import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { generateInternalBarcode } from '../../src/utils/barcode';
import { parseNfe } from '../../src/utils/nfe';
import * as fs from 'fs';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

const CATEGORY_NAME = 'Importados NFe';

async function main() {
    const xmlPath = process.argv[2];
    const key = process.argv[3];
    if (!xmlPath || !key) {
        console.error('Uso: node dist/prisma/scripts/import-nfe-item.js <caminho-do-xml> <nItem-ou-cProd>');
        process.exit(1);
    }

    const { emitCnpj, emitName, items } = parseNfe(fs.readFileSync(xmlPath, 'utf-8'));
    const item = items.find(i => i.nItem === key || i.supplierCode === key);
    if (!item) {
        console.error(`Item "${key}" não encontrado na nota`);
        process.exit(1);
    }

    console.log(`[${item.nItem}] ${item.name} | cProd ${item.supplierCode} | EAN ${item.barcode ?? 'SEM GTIN'} | ${item.quantity}x R$ ${item.unitCost}`);

    const supplier = emitCnpj
        ? await prisma.supplier.upsert({
            where: { cnpj: emitCnpj },
            update: {},
            create: { name: emitName ?? 'Fornecedor NFe', cnpj: emitCnpj, active: true },
        })
        : null;

    const existing = item.barcode
        ? await prisma.product.findUnique({ where: { barcode: item.barcode } })
        : item.supplierCode && supplier
        ? await prisma.product.findFirst({
            where: { supplierCode: item.supplierCode, supplierId: supplier.id },
        })
        : await prisma.product.findFirst({
            where: { name: { equals: item.name, mode: 'insensitive' }, supplierCode: item.supplierCode || undefined },
        });

    if (existing) {
        console.log(`Já existe (id ${existing.id}) — nada a fazer`);
        return;
    }

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
            supplierCode: item.supplierCode || null,
        },
    });

    await prisma.stock.create({
        data: { productId: product.id, quantity: item.quantity },
    });

    console.log(`Criado: ${product.name} (barcode ${barcode}) +${item.quantity} estoque`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
