import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { parseNfe } from '../../src/utils/nfe';
import * as fs from 'fs';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

const CATEGORY_NAME = 'Importados NFe';

async function main() {
    const xmlPath = process.argv[2];
    if (!xmlPath) {
        console.error('Uso: node dist/prisma/scripts/backfill-supplier-code.js <caminho-do-xml>');
        process.exit(1);
    }

    const { emitCnpj, emitName, items } = parseNfe(fs.readFileSync(xmlPath, 'utf-8'));
    console.log(`Backfill supplierCode | emitente: ${emitName} (${emitCnpj}) | ${items.length} itens`);

    const cleared = await prisma.product.updateMany({
        where: { supplierCode: { not: null } },
        data: { supplierCode: null },
    });
    console.log(`supplierCode zerados: ${cleared.count}`);

    const supplier = emitCnpj
        ? await prisma.supplier.findUnique({ where: { cnpj: emitCnpj } })
        : null;

    const claimed = new Set<string>();
    let filled = 0;
    let notFound = 0;
    const warnings: string[] = [];

    for (const item of items) {
        if (!item.supplierCode) {
            warnings.push(`[${item.nItem}] "${item.name}" sem cProd na nota — ignorado`);
            continue;
        }

        let product: { id: string; supplierCode: string | null } | null = null;

        if (item.barcode) {
            product = await prisma.product.findUnique({ where: { barcode: item.barcode } });
        }

        if (!product) {
            const candidates = await prisma.product.findMany({
                where: {
                    name: { equals: item.name, mode: 'insensitive' },
                    barcodeGenerated: true,
                    barcode: { startsWith: '200' },
                    category: { name: CATEGORY_NAME },
                    ...(supplier && { supplierId: supplier.id }),
                    ...(emitName && { brand: { name: emitName } }),
                    id: { notIn: [...claimed] },
                },
                orderBy: { createdAt: 'asc' },
            });
            product = candidates[0] ?? null;
        }

        if (!product) {
            notFound++;
            warnings.push(`[${item.nItem}] "${item.name}" (cProd ${item.supplierCode}) — produto não encontrado`);
            continue;
        }

        claimed.add(product.id);

        await prisma.product.update({
            where: { id: product.id },
            data: { supplierCode: item.supplierCode },
        });
        filled++;
        console.log(`[${item.nItem}] ${item.name} -> supplierCode ${item.supplierCode}`);
    }

    for (const w of warnings) console.warn(`  ! ${w}`);
    console.log(`Concluído: ${filled} preenchidos, ${notFound} não encontrados, ${warnings.length} avisos`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
