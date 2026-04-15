import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateSaleDto } from './__dtos__/createSale.dto';
import { SimulateSaleDto } from './__dtos__/simulateSale.dto';

@Injectable()
export class SalesService {
    constructor(private prisma: PrismaService) { }

    private async validateItemWithStock(
        item: { productId: string; quantity: number },
        prismaClient: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    ) {
        const product = await prismaClient.product.findUnique({
            where: { id: item.productId, active: true },
            include: { category: true, brand: true },
        });

        if (!product) {
            throw new NotFoundException(
                `Produto ID ${item.productId} não encontrado`,
            );
        }

        const stock = await prismaClient.stock.findUnique({
            where: { productId: item.productId },
        });

        const available = stock?.quantity ?? 0;
        const hasStock = available >= item.quantity;
        const unitPrice = Number(product.price);
        const subtotal = unitPrice * item.quantity;

        return {
            product,
            stock,
            available,
            hasStock,
            unitPrice,
            subtotal,
            willBelowMinStock: stock
                ? available - item.quantity <= stock.minQuantity
                : false,
        };
    }

    async simulate(dto: SimulateSaleDto) {
        const paymentMethod = await this.prisma.paymentMethod.findUnique({
            where: { id: dto.paymentMethodId, active: true }
        });

        if (!paymentMethod) {
            throw new BadRequestException('Método de pagamento não encontrado');
        }

        if (dto.installments && paymentMethod.code !== 'CREDIT_CARD') {
            throw new BadRequestException('Parcelas são permitidas apenas para cartão de crédito');
        }

        if (!dto.installments && paymentMethod.code === 'CREDIT_CARD') {
            throw new BadRequestException('Parcelas são obrigatórias para cartão de crédito');
        }

        const itemsWithDetails = await Promise.all(
            dto.items.map(async (item) => {
                const validation = await this.validateItemWithStock(
                    item,
                    this.prisma,
                );

                return {
                    productId: validation.product.id,
                    productName: validation.product.name,
                    category: validation.product.category.name,
                    brand: validation.product.brand?.name ?? null,
                    unitPrice: validation.unitPrice,
                    quantity: item.quantity,
                    subtotal: validation.subtotal,
                    stockAvailable: validation.available,
                    hasStock: validation.hasStock,
                    willBelowMinStock: validation.willBelowMinStock,
                };
            }),
        );

        const stockErrors = itemsWithDetails.filter((i) => !i.hasStock);

        const subtotal = Math.round(
            itemsWithDetails.reduce((sum, i) => sum + i.subtotal, 0) * 100,
        ) / 100;

        const discount = Math.round(dto.discount * 100) / 100;
        const total = Math.round((subtotal - discount) * 100) / 100;

        const change =
            dto.amountPaid !== undefined
                ? Math.round((dto.amountPaid - total) * 100) / 100
                : null;

        const canFinalize = stockErrors.length === 0 &&
            (dto.amountPaid === undefined || dto.amountPaid >= total);

        const installmentValue = dto.installments ? Math.round((total / dto.installments) * 100) / 100 : null;

        return {
            canFinalize,
            items: itemsWithDetails,
            summary: {
                totalItems: itemsWithDetails.reduce((sum, i) => sum + i.quantity, 0),
                totalProducts: itemsWithDetails.length,
                subtotal,
                discount,
                total,
                amountPaid: dto.amountPaid ?? null,
                change: change !== null && change < 0 ? null : change,
                installments: dto.installments ?? null,
                installmentValue,
            },
            errors: [
                ...stockErrors.map((i) => ({
                    type: 'INSUFFICIENT_STOCK',
                    productId: i.productId,
                    productName: i.productName,
                    message: `Estoque insuficiente para "${i.productName}". Disponível: ${i.stockAvailable}, solicitado: ${i.quantity}`,
                })),
                ...(dto.amountPaid !== undefined && dto.amountPaid < total
                    ? [
                        {
                            type: 'INSUFFICIENT_PAYMENT',
                            message: `Valor pago (R$ ${dto.amountPaid.toFixed(2)}) é menor que o total (R$ ${total.toFixed(2)}). Faltam R$ ${(total - dto.amountPaid).toFixed(2)}`,
                        },
                    ]
                    : []),
            ],
            warnings: itemsWithDetails
                .filter((i) => i.hasStock && i.willBelowMinStock)
                .map((i) => ({
                    type: 'LOW_STOCK_AFTER_SALE',
                    productId: i.productId,
                    productName: i.productName,
                    message: `"${i.productName}" ficará abaixo do estoque mínimo após esta venda`,
                })),
        };
    }

    async create(dto: CreateSaleDto) {
        return this.prisma.$transaction(async (tx) => {
            const paymentMethod = await tx.paymentMethod.findUnique({
                where: { id: dto.paymentMethodId, active: true }
            });

            if (!paymentMethod) {
                throw new BadRequestException('Método de pagamento não encontrado');
            }

            if (dto.installments && paymentMethod.code !== 'CREDIT_CARD') {
                throw new BadRequestException('Parcelas são permitidas apenas para cartão de crédito');
            }

            if (!dto.installments && paymentMethod.code === 'CREDIT_CARD') {
                throw new BadRequestException('Parcelas são obrigatórias para cartão de crédito');
            }

            const itemsWithDetails = await Promise.all(
                dto.items.map(async (item) => {
                    const validation = await this.validateItemWithStock(item, tx);

                    if (!validation.hasStock) {
                        throw new BadRequestException(
                            `Estoque insuficiente para "${validation.product.name}". Disponível: ${validation.available}`,
                        );
                    }

                    return {
                        product: validation.product,
                        quantity: item.quantity,
                        unitPrice: validation.unitPrice,
                        subtotal: validation.subtotal,
                    };
                }),
            );

            const subtotal = itemsWithDetails.reduce((sum, i) => sum + i.subtotal, 0);
            const discount = Math.round(dto.discount * 100) / 100;
            const total = Math.round((subtotal - discount) * 100) / 100;

            if (dto.amountPaid < total) {
                throw new BadRequestException(
                    `Valor pago (R$ ${dto.amountPaid.toFixed(2)}) é menor que o total (R$ ${total.toFixed(2)})`,
                );
            }

            const change = Math.round((dto.amountPaid - total) * 100) / 100;
            const installmentValue = dto.installments ? Math.round((total / dto.installments) * 100) / 100 : null;

            const sale = await tx.sale.create({
                data: {
                    total: subtotal,
                    discount,
                    finalTotal: total,
                    amountPaid: dto.amountPaid,
                    change,
                    paymentMethodId: dto.paymentMethodId,
                    installments: dto.installments,
                    installmentValue,
                    notes: dto.notes,
                    items: {
                        create: itemsWithDetails.map((i) => ({
                            productId: i.product.id,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            subtotal: i.subtotal,
                        })),
                    },
                },
                include: {
                    items: { include: { product: true } },
                    paymentMethod: true,
                },
            });

            await Promise.all(
                itemsWithDetails.map((i) =>
                    tx.stock.update({
                        where: { productId: i.product.id },
                        data: { quantity: { decrement: i.quantity } },
                    }),
                ),
            );

            return sale;
        });
    }

    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [sales, total] = await Promise.all([
            this.prisma.sale.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: { product: { select: { id: true, name: true } } },
                    },
                    paymentMethod: true,
                },
            }),
            this.prisma.sale.count(),
        ]);

        return {
            data: sales,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    async findOne(id: string) {
        const sale = await this.prisma.sale.findUnique({
            where: { id },
            include: {
                items: {
                    include: { product: { include: { category: true, brand: true } } },
                },
                paymentMethod: true,
            },
        });
        if (!sale) throw new NotFoundException('Venda não encontrada');
        return sale;
    }
}