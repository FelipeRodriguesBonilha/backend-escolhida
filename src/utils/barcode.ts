import { PrismaClient } from '../generated/prisma/client';

export async function generateInternalBarcode(prisma: PrismaClient): Promise<string> {
    let barcode: string = '';
    let exists = true;
    
    while (exists) {
        const randomDigits = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
        barcode = `200${randomDigits}`;
        
        const product = await prisma.product.findUnique({
            where: { barcode },
        });
        exists = !!product;
    }
    
    return barcode;
}
