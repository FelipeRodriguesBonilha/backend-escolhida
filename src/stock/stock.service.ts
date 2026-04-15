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

    async findAll() {
        return this.prisma.stock.findMany({
            where: {
                product: {
                    active: true
                }
            },
            include: {
                product: {
                    include: { category: true, brand: true },
                },
            },
            orderBy: { product: { name: 'asc' } },
        });
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