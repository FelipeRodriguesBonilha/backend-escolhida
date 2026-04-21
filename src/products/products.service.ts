import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { CreateProductDto } from './__dtos__/createProduct.dto';
import { CreateProductColorDto } from './__dtos__/createProductColor.dto';
import { UpdateProductDto } from './__dtos__/updateProduct.dto';
import { generateInternalBarcode } from 'src/utils/barcode';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private uploadService: UploadService,
    ) { }

    async create(dto: CreateProductDto, file?: Express.Multer.File) {
        let barcode = dto.barcode;
        let barcodeGenerated = false;
        
        if (!barcode) {
            barcode = await generateInternalBarcode(this.prisma);
            barcodeGenerated = true;
        } else {
            const exists = await this.prisma.product.findUnique({
                where: { barcode },
            });
            if (exists) throw new ConflictException('Código de barras já cadastrado');
        }

        const { initialStock, minQuantity, ...productData } = dto;

        const stockQuantity = initialStock ?? 0;
        const minStockQuantity = minQuantity ?? 0;

        if (stockQuantity <= 0) {
            throw new BadRequestException('Estoque inicial deve ser maior que 0');
        }

        if (stockQuantity < minStockQuantity) {
            throw new BadRequestException(`Estoque inicial (${stockQuantity}) não pode ser menor que o estoque mínimo (${minStockQuantity})`);
        }

        let imageUrl: string | undefined;
        if (file) {
            imageUrl = await this.uploadService.saveFile(file);
        }

        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    ...productData,
                    barcode,
                    barcodeGenerated,
                    imageUrl: imageUrl || dto.imageUrl,
                }
            });

            await tx.stock.create({
                data: {
                    productId: product.id,
                    quantity: initialStock ?? 0,
                    minQuantity: minQuantity ?? 5,
                },
            });

            const createdProduct = await tx.product.findUnique({
                where: { id: product.id },
                include: { category: true, brand: true, supplier: true, stock: true, colors: { orderBy: { order: 'asc' as const } } },
            });

            if (!createdProduct) throw new NotFoundException('Erro ao criar produto');
            return createdProduct;
        });
    }

    async findAll(search?: string, page: number = 1, limit: number = 20, showInactive: boolean = false) {
        const skip = (page - 1) * limit;
        const where = {
            active: !showInactive,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { barcode: { contains: search } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                    { category: { name: { contains: search, mode: 'insensitive' as const } } },
                    { brand: { name: { contains: search, mode: 'insensitive' as const } } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: { category: true, brand: true, supplier: true, stock: true, colors: { orderBy: { order: 'asc' as const } } },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.product.count({ where }),
        ]);
        return { data, total, page, limit };
    }

    async findOne(id: string) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { category: true, brand: true, supplier: true, stock: true, colors: { orderBy: { order: 'asc' } } },
        });
        if (!product) throw new NotFoundException('Produto não encontrado');
        return product;
    }

    async findByBarcode(barcode: string) {
        const product = await this.prisma.product.findUnique({
            where: { barcode },
            include: { category: true, brand: true, supplier: true, stock: true, colors: { orderBy: { order: 'asc' } } },
        });
        if (!product) throw new NotFoundException('Produto não encontrado para este código de barras');
        return product;
    }

    async update(id: string, dto: UpdateProductDto, file?: Express.Multer.File) {
        const product = await this.findOne(id);

        if (dto.barcode) {
            const exists = await this.prisma.product.findFirst({
                where: { barcode: dto.barcode, NOT: { id } },
            });
            if (exists) throw new ConflictException('Código de barras já cadastrado em outro produto');
        }

        const { initialStock, minQuantity, ...productData } = dto;

        let imageUrl: string | undefined;
        if (file) {
            imageUrl = await this.uploadService.saveFile(file);
            if (product.imageUrl) {
                await this.uploadService.deleteFile(product.imageUrl);
            }
        }

        return this.prisma.product.update({
            where: { id },
            data: {
                ...productData,
                ...(imageUrl && { imageUrl }),
            },
            include: { category: true, brand: true, supplier: true, stock: true, colors: { orderBy: { order: 'asc' } } },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.product.update({ 
            where: { id }, 
            data: { active: false },
            include: { category: true, brand: true, supplier: true, stock: true, colors: { orderBy: { order: 'asc' } } },
        });
    }

    async reactivate(id: string) {
        await this.findOne(id);
        return this.prisma.product.update({
            where: { id },
            data: { active: true },
            include: { category: true, brand: true, supplier: true, stock: true, colors: { orderBy: { order: 'asc' } } },
        });
    }

    async permanentDelete(id: string) {
        const product = await this.findOne(id);
        if (product.active) throw new BadRequestException('Apenas produtos inativos podem ser excluídos permanentemente');
        const saleItemCount = await this.prisma.saleItem.count({ where: { productId: id } });
        if (saleItemCount > 0) throw new BadRequestException(`Não é possível excluir: este produto possui ${saleItemCount} item(ns) em vendas`);
        await this.prisma.$transaction(async (tx) => {
            await tx.productColor.deleteMany({ where: { productId: id } });
            await tx.stock.deleteMany({ where: { productId: id } });
            await tx.product.delete({ where: { id } });
        });
    }

    async findLowStock() {
        const stocks = await this.prisma.stock.findMany({
            where: {
                product: { active: true },
            },
            include: { product: { include: { category: true, brand: true, supplier: true, stock: true, colors: { orderBy: { order: 'asc' } } } } },
        });

        return stocks
            .filter((s) => s.quantity <= s.minQuantity)
            .map((s) => s.product);
    }

    async addColor(productId: string, dto: CreateProductColorDto, file?: Express.Multer.File) {
        await this.findOne(productId);

        let imageUrl: string | undefined;
        if (file) {
            imageUrl = await this.uploadService.saveFile(file);
        }

        const maxOrder = await this.prisma.productColor.aggregate({
            where: { productId },
            _max: { order: true },
        });

        return this.prisma.productColor.create({
            data: {
                productId,
                name: dto.name,
                colorCode: dto.colorCode,
                imageUrl,
                order: (maxOrder._max.order ?? -1) + 1,
            },
        });
    }

    async updateColor(productId: string, colorId: string, dto: CreateProductColorDto, file?: Express.Multer.File) {
        const color = await this.prisma.productColor.findFirst({ where: { id: colorId, productId } });
        if (!color) throw new NotFoundException('Cor não encontrada');

        let imageUrl: string | undefined;
        if (file) {
            imageUrl = await this.uploadService.saveFile(file);
            if (color.imageUrl) {
                await this.uploadService.deleteFile(color.imageUrl);
            }
        }

        return this.prisma.productColor.update({
            where: { id: colorId },
            data: {
                name: dto.name,
                colorCode: dto.colorCode ?? color.colorCode,
                ...(imageUrl && { imageUrl }),
            },
        });
    }

    async removeColor(productId: string, colorId: string) {
        const color = await this.prisma.productColor.findFirst({ where: { id: colorId, productId } });
        if (!color) throw new NotFoundException('Cor não encontrada');

        if (color.imageUrl) {
            await this.uploadService.deleteFile(color.imageUrl);
        }

        return this.prisma.productColor.delete({ where: { id: colorId } });
    }
}