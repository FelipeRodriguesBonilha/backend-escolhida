import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function populateProductImages() {
    console.log('Buscando produtos com imageUrl...');

    const products = await prisma.product.findMany({
        where: { imageUrl: { not: null } },
        select: { id: true, imageUrl: true },
    });

    console.log(`Encontrados ${products.length} produtos com imagem.`);

    let created = 0;
    let skipped = 0;

    for (const product of products) {
        if (!product.imageUrl) continue;

        const existing = await prisma.productImage.findFirst({
            where: { productId: product.id, url: product.imageUrl },
        });

        if (existing) {
            skipped++;
            continue;
        }

        await prisma.productImage.create({
            data: {
                productId: product.id,
                url: product.imageUrl,
                order: 0,
            },
        });
        created++;
    }

    console.log(`Criadas: ${created} | Ignoradas (ja existiam): ${skipped}`);
    console.log('Concluido.');
}

populateProductImages()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
