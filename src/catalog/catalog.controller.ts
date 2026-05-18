import { Controller, Get, Param, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { ReturnProductDto } from 'src/products/__dtos__/returnProduct.dto';

@Controller('catalog')
export class CatalogController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
    ) {}

    @Get('products')
    async getProducts(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('categoryId') categoryId?: string,
        @Query('brandId') brandId?: string,
    ) {
        const pageNum = parseInt(page ?? '1') || 1;
        const limitNum = parseInt(limit ?? '50') || 50;
        const skip = (pageNum - 1) * limitNum;

        const where: Prisma.ProductWhereInput = {
            active: true,
            showInCatalog: true,
            ...(categoryId && { categoryId }),
            ...(brandId && { brandId }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { category: { name: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        };

        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: {
                    category: true,
                    brand: true,
                    colors: { orderBy: { order: 'asc' as const } },
                },
                orderBy: { name: 'asc' },
                skip,
                take: limitNum,
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            data: data.map(p => new ReturnProductDto(p)),
            total,
            page: pageNum,
            limit: limitNum,
        };
    }

    @Get('categories')
    async getCategories() {
        return this.prisma.category.findMany({
            where: { active: true, showInCatalog: true },
            orderBy: { name: 'asc' },
        });
    }

    @Get('brands')
    async getBrands(@Query('categoryId') categoryId?: string) {
        const productWhere: Prisma.ProductWhereInput = {
            active: true,
            showInCatalog: true,
            brand: { showInCatalog: true, active: true },
            ...(categoryId && { categoryId }),
        };
        const products = await this.prisma.product.findMany({
            where: productWhere,
            select: { brand: true },
            distinct: ['brandId'],
        });
        return products
            .map(p => p.brand)
            .filter(Boolean)
            .sort((a, b) => a!.name.localeCompare(b!.name));
    }

    @Get('uploads/:filename')
    async getImage(
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const file = await this.uploadService.getFile(filename);

        const ext = filename.split('.').pop()?.toLowerCase();
        const contentType = this.getContentType(ext);

        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'public, max-age=86400',
        });

        return new StreamableFile(file);
    }

    private getContentType(ext?: string): string {
        const types: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
        };
        return types[ext || ''] || 'application/octet-stream';
    }
}
