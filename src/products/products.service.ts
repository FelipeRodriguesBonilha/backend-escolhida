import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { CreateProductDto } from './__dtos__/createProduct.dto';
import { ConvertProductToVariationDto, CreateProductVariationDto } from './__dtos__/createProductVariation.dto';
import { UpdateProductDto } from './__dtos__/updateProduct.dto';
import { generateInternalBarcode } from 'src/utils/barcode';
import { parseNfe } from 'src/utils/nfe';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private uploadService: UploadService,
    ) { }

    async create(dto: CreateProductDto, files?: Express.Multer.File[]) {
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
            const existsInVariation = await this.prisma.productVariation.findUnique({
                where: { barcode },
            });
            if (existsInVariation) throw new ConflictException('Código de barras já cadastrado em uma variação');
        }

        const { initialStock, minQuantity, expirationDate, ...productData } = dto;

        const stockQuantity = initialStock ?? 0;
        const minStockQuantity = minQuantity ?? 0;

        if (stockQuantity <= 0) {
            throw new BadRequestException('Estoque inicial deve ser maior que 0');
        }

        if (stockQuantity < minStockQuantity) {
            throw new BadRequestException(`Estoque inicial (${stockQuantity}) não pode ser menor que o estoque mínimo (${minStockQuantity})`);
        }

        const uploadedUrls: string[] = [];
        if (files && files.length > 0) {
            for (const file of files) {
                const url = await this.uploadService.saveFile(file);
                uploadedUrls.push(url);
            }
        }

        const mainImageUrl = uploadedUrls[0] ?? dto.imageUrl;

        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    ...productData,
                    barcode,
                    barcodeGenerated,
                    imageUrl: mainImageUrl,
                    expirationDate: expirationDate ? new Date(expirationDate) : null,
                }
            });

            await tx.stock.create({
                data: {
                    productId: product.id,
                    quantity: initialStock ?? 0,
                    minQuantity: minQuantity ?? 5,
                },
            });

            for (let i = 0; i < uploadedUrls.length; i++) {
                await tx.productImage.create({
                    data: { productId: product.id, url: uploadedUrls[i], order: i },
                });
            }

            const createdProduct = await tx.product.findUnique({
                where: { id: product.id },
                include: { category: true, brand: true, supplier: true, stock: true, variations: { orderBy: { order: 'asc' as const } }, images: { orderBy: { order: 'asc' as const } } },
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
                    { variations: { some: { barcode: { contains: search } } } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: { category: true, brand: true, supplier: true, stock: true, variations: { orderBy: { order: 'asc' as const } }, images: { orderBy: { order: 'asc' as const } } },
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
            include: { category: true, brand: true, supplier: true, stock: true, variations: { orderBy: { order: 'asc' } }, images: { orderBy: { order: 'asc' } } },
        });
        if (!product) throw new NotFoundException('Produto não encontrado');
        return product;
    }

    async findByBarcode(barcode: string) {
        const product = await this.prisma.product.findFirst({
            where: {
                OR: [
                    { barcode },
                    { variations: { some: { barcode } } },
                ],
            },
            include: { category: true, brand: true, supplier: true, stock: true, variations: { orderBy: { order: 'asc' } }, images: { orderBy: { order: 'asc' } } },
        });
        if (!product) throw new NotFoundException('Produto não encontrado para este código de barras');
        return product;
    }

    async update(id: string, dto: UpdateProductDto, files?: Express.Multer.File[]) {
        const product = await this.findOne(id);

        if (dto.barcode) {
            const exists = await this.prisma.product.findFirst({
                where: { barcode: dto.barcode, NOT: { id } },
            });
            if (exists) throw new ConflictException('Código de barras já cadastrado em outro produto');
            const existsInVariation = await this.prisma.productVariation.findUnique({
                where: { barcode: dto.barcode },
            });
            if (existsInVariation) throw new ConflictException('Código de barras já cadastrado em uma variação');
        }

        const { initialStock, minQuantity, removeImage, removeImageIds, expirationDate, ...productData } = dto;

        if (removeImageIds && removeImageIds.length > 0) {
            const toRemove = await this.prisma.productImage.findMany({
                where: { id: { in: removeImageIds }, productId: id },
            });
            for (const img of toRemove) {
                await this.uploadService.deleteFile(img.url);
            }
            await this.prisma.productImage.deleteMany({
                where: { id: { in: removeImageIds }, productId: id },
            });
        }

        const uploadedUrls: string[] = [];
        if (files && files.length > 0) {
            for (const file of files) {
                const url = await this.uploadService.saveFile(file);
                uploadedUrls.push(url);
            }
            const maxOrder = await this.prisma.productImage.aggregate({
                where: { productId: id },
                _max: { order: true },
            });
            let nextOrder = (maxOrder._max.order ?? -1) + 1;
            for (const url of uploadedUrls) {
                await this.prisma.productImage.create({
                    data: { productId: id, url, order: nextOrder++ },
                });
            }
        }

        const currentMain = await this.prisma.productImage.findFirst({
            where: { productId: id },
            orderBy: { order: 'asc' },
        });

        return this.prisma.product.update({
            where: { id },
            data: {
                ...productData,
                imageUrl: currentMain?.url ?? null,
                ...(expirationDate !== undefined && {
                    expirationDate: expirationDate ? new Date(expirationDate) : null,
                }),
            },
            include: { category: true, brand: true, supplier: true, stock: true, variations: { orderBy: { order: 'asc' } }, images: { orderBy: { order: 'asc' } } },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.product.update({ 
            where: { id }, 
            data: { active: false },
            include: { category: true, brand: true, supplier: true, stock: true, variations: { orderBy: { order: 'asc' } }, images: { orderBy: { order: 'asc' } } },
        });
    }

    async reactivate(id: string) {
        await this.findOne(id);
        return this.prisma.product.update({
            where: { id },
            data: { active: true },
            include: { category: true, brand: true, supplier: true, stock: true, variations: { orderBy: { order: 'asc' } }, images: { orderBy: { order: 'asc' } } },
        });
    }

    async permanentDelete(id: string) {
        const product = await this.findOne(id);
        if (product.active) throw new BadRequestException('Apenas produtos inativos podem ser excluídos permanentemente');
        const saleItemCount = await this.prisma.saleItem.count({ where: { productId: id } });
        if (saleItemCount > 0) throw new BadRequestException(`Não é possível excluir: este produto possui ${saleItemCount} item(ns) em vendas`);
        await this.prisma.$transaction(async (tx) => {
            await tx.productImage.deleteMany({ where: { productId: id } });
            await tx.productVariation.deleteMany({ where: { productId: id } });
            await tx.stock.deleteMany({ where: { productId: id } });
            await tx.product.delete({ where: { id } });
        });
    }

    async findLowStock() {
        const stocks = await this.prisma.stock.findMany({
            where: {
                product: { active: true },
            },
            include: { product: { include: { category: true, brand: true, supplier: true, stock: true, variations: { orderBy: { order: 'asc' } }, images: { orderBy: { order: 'asc' } } } } },
        });

        return stocks
            .filter((s) => s.quantity <= s.minQuantity)
            .map((s) => s.product);
    }

    async findExpirations(days: number = 90) {
        const now = new Date();
        const limit = new Date(now);
        limit.setDate(limit.getDate() + days);
        const include = {
            category: true, brand: true, supplier: true, stock: true,
            variations: { orderBy: { order: 'asc' as const } },
            images: { orderBy: { order: 'asc' as const } },
        };

        const [expired, expiring] = await Promise.all([
            this.prisma.product.findMany({
                where: { active: true, expirationDate: { not: null, lt: now } },
                include,
                orderBy: { expirationDate: 'asc' },
            }),
            this.prisma.product.findMany({
                where: { active: true, expirationDate: { gte: now, lte: limit } },
                include,
                orderBy: { expirationDate: 'asc' },
            }),
        ]);

        return { expired, expiring };
    }

    async importNfe(xml: string) {
        const { emitCnpj, emitName, items } = parseNfe(xml);
        if (items.length === 0) {
            throw new BadRequestException('Nenhum item encontrado no XML da NF-e');
        }

        return this.prisma.$transaction(async (tx) => {
            const supplier = emitCnpj
                ? await tx.supplier.upsert({
                    where: { cnpj: emitCnpj },
                    update: {},
                    create: { name: emitName ?? 'Fornecedor NFe', cnpj: emitCnpj, active: true },
                })
                : null;

            const category = await tx.category.upsert({
                where: { name: 'Importados NFe' },
                update: {},
                create: { name: 'Importados NFe', active: true },
            });

            const brand = await tx.brand.upsert({
                where: { name: emitName ?? 'SEM MARCA' },
                update: {},
                create: { name: emitName ?? 'SEM MARCA', active: true },
            });

            const result = {
                emitter: emitName ?? null,
                total: items.length,
                created: 0,
                restocked: 0,
                errors: [] as { nItem: string; name: string; message: string }[],
            };

            for (const item of items) {
                try {
                    let existing = item.barcode
                        ? await tx.product.findUnique({ where: { barcode: item.barcode } })
                        : null;

                    existing ??= item.supplierCode && supplier
                        ? await tx.product.findFirst({
                            where: { active: true, supplierCode: item.supplierCode, supplierId: supplier.id },
                        })
                        : await tx.product.findFirst({
                            where: {
                                active: true,
                                name: { equals: item.name, mode: 'insensitive' },
                                ...(item.supplierCode ? { supplierCode: item.supplierCode } : {}),
                            },
                        });

                    if (existing) {
                        await tx.stock.upsert({
                            where: { productId: existing.id },
                            update: { quantity: { increment: item.quantity } },
                            create: { productId: existing.id, quantity: item.quantity },
                        });
                        await tx.product.update({
                            where: { id: existing.id },
                            data: {
                                costPrice: item.unitCost,
                                ...(item.supplierCode && !existing.supplierCode && { supplierCode: item.supplierCode }),
                            },
                        });
                        result.restocked++;
                        continue;
                    }

                    const barcode = item.barcode ?? (await generateInternalBarcode(tx));

                    const product = await tx.product.create({
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

                    await tx.stock.create({
                        data: { productId: product.id, quantity: item.quantity },
                    });

                    result.created++;
                } catch (error) {
                    throw new BadRequestException(
                        `Erro no item ${item.nItem} "${item.name}": ${error instanceof Error ? error.message : 'erro desconhecido'}. Nenhum produto foi importado.`,
                    );
                }
            }

            return result;
        }, { timeout: 60000, maxWait: 15000 });
    }

    private async checkBarcodeConflict(barcode: string, excludeVariationId?: string) {
        const inProduct = await this.prisma.product.findUnique({ where: { barcode } });
        if (inProduct) throw new ConflictException('Código de barras já cadastrado em um produto');
        const inVariation = await this.prisma.productVariation.findFirst({
            where: { barcode, NOT: excludeVariationId ? { id: excludeVariationId } : undefined },
        });
        if (inVariation) throw new ConflictException('Código de barras já cadastrado em outra variação');
    }

    async addVariation(productId: string, dto: CreateProductVariationDto, file?: Express.Multer.File) {
        await this.findOne(productId);

        if (dto.barcode) {
            await this.checkBarcodeConflict(dto.barcode);
        }

        let imageUrl: string | undefined;
        if (file) {
            imageUrl = await this.uploadService.saveFile(file);
        }

        const maxOrder = await this.prisma.productVariation.aggregate({
            where: { productId },
            _max: { order: true },
        });

        return this.prisma.productVariation.create({
            data: {
                productId,
                name: dto.name,
                barcode: dto.barcode,
                colorCode: dto.colorCode,
                imageUrl,
                order: (maxOrder._max.order ?? -1) + 1,
            },
        });
    }

    async updateVariation(productId: string, variationId: string, dto: CreateProductVariationDto, file?: Express.Multer.File) {
        const variation = await this.prisma.productVariation.findFirst({ where: { id: variationId, productId } });
        if (!variation) throw new NotFoundException('Variação não encontrada');

        if (dto.barcode && dto.barcode !== variation.barcode) {
            await this.checkBarcodeConflict(dto.barcode, variationId);
        }

        let imageUrl: string | undefined | null;
        if (file) {
            imageUrl = await this.uploadService.saveFile(file);
            if (variation.imageUrl) {
                await this.uploadService.deleteFile(variation.imageUrl);
            }
        } else if (dto.removeImage && variation.imageUrl) {
            await this.uploadService.deleteFile(variation.imageUrl);
            imageUrl = null;
        }

        return this.prisma.productVariation.update({
            where: { id: variationId },
            data: {
                name: dto.name,
                barcode: dto.barcode ?? variation.barcode,
                colorCode: dto.colorCode ?? variation.colorCode,
                ...(imageUrl !== undefined && { imageUrl }),
            },
        });
    }

    async convertProductToVariation(productId: string, dto: ConvertProductToVariationDto, file?: Express.Multer.File) {
        const source = await this.prisma.product.findUnique({
            where: { barcode: dto.barcode },
        });
        if (!source) throw new NotFoundException('Nenhum produto encontrado com este código de barras');
        if (source.id === productId) throw new BadRequestException('Este código de barras já pertence ao próprio produto');
        await this.findOne(productId);

        const imageUrl = file ? await this.uploadService.saveFile(file) : undefined;

        return this.prisma.$transaction(async (tx) => {
            let variation;
            if (dto.variationId) {
                const existing = await tx.productVariation.findFirst({ where: { id: dto.variationId, productId } });
                if (!existing) throw new NotFoundException('Variação não encontrada');
                variation = await tx.productVariation.update({
                    where: { id: dto.variationId },
                    data: {
                        ...(dto.name && { name: dto.name }),
                        ...(dto.colorCode && { colorCode: dto.colorCode }),
                        barcode: source.barcode,
                        imageUrl: imageUrl ?? existing.imageUrl ?? source.imageUrl,
                    },
                });
            } else {
                const maxOrder = await tx.productVariation.aggregate({
                    where: { productId },
                    _max: { order: true },
                });
                variation = await tx.productVariation.create({
                    data: {
                        productId,
                        name: dto.name || source.name,
                        barcode: source.barcode,
                        colorCode: dto.colorCode,
                        imageUrl: imageUrl ?? source.imageUrl,
                        order: (maxOrder._max.order ?? -1) + 1,
                    },
                });
            }

            await tx.product.update({
                where: { id: source.id },
                data: { active: false, barcode: null },
            });

            return variation;
        });
    }

    async removeVariation(productId: string, variationId: string) {
        const variation = await this.prisma.productVariation.findFirst({ where: { id: variationId, productId } });
        if (!variation) throw new NotFoundException('Variação não encontrada');

        if (variation.imageUrl) {
            await this.uploadService.deleteFile(variation.imageUrl);
        }

        return this.prisma.productVariation.delete({ where: { id: variationId } });
    }

    async setMainImage(productId: string, imageId: string) {
        const image = await this.prisma.productImage.findFirst({ where: { id: imageId, productId } });
        if (!image) throw new NotFoundException('Imagem não encontrada');

        const allImages = await this.prisma.productImage.findMany({
            where: { productId },
            orderBy: { order: 'asc' },
        });

        await this.prisma.$transaction(async (tx) => {
            await tx.productImage.updateMany({
                where: { productId, order: { lt: image.order } },
                data: { order: { increment: 1 } },
            });
            await tx.productImage.update({
                where: { id: imageId },
                data: { order: 0 },
            });
            await tx.product.update({
                where: { id: productId },
                data: { imageUrl: image.url },
            });
        });

        return this.prisma.productImage.findMany({
            where: { productId },
            orderBy: { order: 'asc' },
        });
    }
}