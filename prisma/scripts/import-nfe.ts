import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { generateInternalBarcode } from '../../src/utils/barcode';
import * as fs from 'fs';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

const CATEGORY_NAME = 'Importados NFe';

interface NfeItem {
    nItem: string;
    supplierCode: string;
    barcode?: string;
    name: string;
    quantity: number;
    unitCost: number;
}

function tag(block: string, name: string): string | undefined {
    return block.match(new RegExp(`<${name}>(.*?)</${name}>`))?.[1];
}

function parseNfe(xml: string) {
    const emitBlock = xml.match(/<emit>(.*?)<\/emit>/)?.[1] ?? '';
    const emitCnpj = tag(emitBlock, 'CNPJ');
    const emitName = tag(emitBlock, 'xNome');

    const items: NfeItem[] = [];
    for (const m of xml.matchAll(/<det nItem="(\d+)"><prod>(.*?)<\/prod>/g)) {
        const prod = m[2];
        const ean = tag(prod, 'cEAN');
        items.push({
            nItem: m[1],
            supplierCode: tag(prod, 'cProd') ?? '',
            barcode: ean && ean !== 'SEM GTIN' ? ean : undefined,
            name: tag(prod, 'xProd') ?? '',
            quantity: Math.round(parseFloat(tag(prod, 'qCom') ?? '0')),
            unitCost: parseFloat(tag(prod, 'vUnCom') ?? '0'),
        });
    }

    return { emitCnpj, emitName, items };
}

async function main() {
    const xmlPath = process.argv[2];
    if (!xmlPath) {
        console.error('Uso: ts-node prisma/scripts/import-nfe.ts <caminho-do-xml>');
        process.exit(1);
    }

    const { emitCnpj, emitName, items } = parseNfe(fs.readFileSync(xmlPath, 'utf-8'));
    console.log(`NF-e: ${items.length} itens | emitente: ${emitName} (${emitCnpj})`);

    const supplier = emitCnpj
        ? await prisma.supplier.upsert({
            where: { cnpj: emitCnpj },
            update: {},
            create: { name: emitName ?? 'Fornecedor NFe', cnpj: emitCnpj, active: true },
        })
        : null;

    const category = await prisma.category.upsert({
        where: { name: CATEGORY_NAME },
        update: {},
        create: { name: CATEGORY_NAME, active: true },
    });

    const brand = await prisma.brand.upsert({
        where: { name: emitName ?? 'SEM MARCA' },
        update: {},
        create: { name: emitName ?? 'SEM MARCA', active: true },
    });

    let created = 0;
    let restocked = 0;
    let errors = 0;

    for (const item of items) {
        try {
            const existing = item.barcode
                ? await prisma.product.findUnique({ where: { barcode: item.barcode } })
                : null;

            if (existing) {
                await prisma.stock.upsert({
                    where: { productId: existing.id },
                    update: { quantity: { increment: item.quantity } },
                    create: { productId: existing.id, quantity: item.quantity },
                });
                await prisma.product.update({
                    where: { id: existing.id },
                    data: { costPrice: item.unitCost },
                });
                restocked++;
                console.log(`[${item.nItem}] Estoque +${item.quantity}: ${existing.name}`);
                continue;
            }

            const barcode = item.barcode ?? (await generateInternalBarcode(prisma));

            const product = await prisma.product.create({
                data: {
                    name: item.name,
                    barcode,
                    barcodeGenerated: !item.barcode,
                    price: item.unitCost,
                    costPrice: item.unitCost,
                    categoryId: category.id,
                    brandId: brand.id,
                    supplierId: supplier?.id,
                },
            });

            await prisma.stock.create({
                data: { productId: product.id, quantity: item.quantity },
            });

            created++;
            console.log(`[${item.nItem}] Criado: ${item.name}`);
        } catch (error) {
            errors++;
            console.error(`[${item.nItem}] Erro em "${item.name}":`, error);
        }
    }

    console.log(`Concluído: ${created} criados, ${restocked} reestocados, ${errors} erros`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
