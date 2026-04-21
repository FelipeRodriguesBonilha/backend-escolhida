import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AdjustStockDto } from './__dtos__/adjustStock.dto';

@Injectable()
export class StockService {
    constructor(private prisma: PrismaService) { }

    async findAll(page: number = 1, limit: number = 10, search?: string, showInactive: boolean = false) {
        const skip = (page - 1) * limit;
        const where = {
            product: {
                active: !showInactive,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' as const } },
                        { barcode: { contains: search } },
                        { category: { name: { contains: search, mode: 'insensitive' as const } } },
                        { brand: { name: { contains: search, mode: 'insensitive' as const } } },
                    ],
                }),
            },
        };
        const include = { product: { include: { category: true, brand: true } } };
        const [data, total] = await Promise.all([
            this.prisma.stock.findMany({ where, include, orderBy: { product: { name: 'asc' } }, skip, take: limit }),
            this.prisma.stock.count({ where }),
        ]);
        return { data, total, page, limit };
    }

    async findByProduct(productId: string) {
        const stock = await this.prisma.stock.findUnique({
            where: { productId },
            include: {
                product: { include: { category: true, brand: true } },
            },
        });
        if (!stock) throw new NotFoundException('Estoque não encontrado para este produto');
        return stock;
    }

    async permanentDeleteByProduct(productId: string) {
        const stock = await this.prisma.stock.findUnique({ where: { productId }, include: { product: true } });
        if (!stock) throw new NotFoundException('Estoque não encontrado');
        if (stock.product.active) throw new BadRequestException('Apenas produtos inativos podem ser excluídos permanentemente');
        const saleItemCount = await this.prisma.saleItem.count({ where: { productId } });
        if (saleItemCount > 0) throw new BadRequestException(`Não é possível excluir: este produto possui ${saleItemCount} item(ns) em vendas`);
        await this.prisma.$transaction(async (tx) => {
            await tx.productColor.deleteMany({ where: { productId } });
            await tx.stock.delete({ where: { productId } });
            await tx.product.delete({ where: { id: productId } });
        });
    }

    async adjust(productId: string, dto: AdjustStockDto) {
        const stock = await this.prisma.stock.findUnique({ where: { productId } });
        if (!stock) throw new NotFoundException('Estoque não encontrado para este produto');

        if (dto.quantity < 0) {
            throw new BadRequestException('A quantidade não pode ser negativa');
        }

        return this.prisma.stock.update({
            where: { productId },
            data: {
                quantity: dto.quantity,
                ...(dto.minQuantity !== undefined && { minQuantity: dto.minQuantity }),
            },
            include: { product: true },
        });
    }

    async setMinQuantity(productId: string, minQuantity: number) {
        const stock = await this.prisma.stock.findUnique({ where: { productId } });
        if (!stock) throw new NotFoundException('Estoque não encontrado');

        return this.prisma.stock.update({
            where: { productId },
            data: { minQuantity },
        });
    }

    async getLowStock() {
        const stocks = await this.prisma.stock.findMany({
            include: {
                product: { include: { category: true, brand: true } },
            },
        });
        return stocks.filter((s) => s.quantity <= s.minQuantity);
    }
}