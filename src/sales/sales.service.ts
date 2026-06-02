import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateSaleDto } from './__dtos__/createSale.dto';
import { SimulateSaleDto } from './__dtos__/simulateSale.dto';
import { CashRegisterService } from '../cash-register/cash-register.service';

@Injectable()
export class SalesService {
    constructor(
        private prisma: PrismaService,
        private cashRegisterService: CashRegisterService
    ) { }

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
        const unitPrice = product.inPromotion && product.promotionPrice
            ? Number(product.promotionPrice)
            : Number(product.price);
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

    private async validatePayments(
        payments: { paymentMethodId: string; amount: number; installments?: number }[],
        prismaClient: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    ) {
        const results = await Promise.all(
            payments.map(async (payment) => {
                const method = await prismaClient.paymentMethod.findUnique({
                    where: { id: payment.paymentMethodId, active: true },
                });

                if (!method) {
                    throw new BadRequestException(`Método de pagamento ID ${payment.paymentMethodId} não encontrado`);
                }

                if (payment.installments && method.code !== 'CREDIT_CARD') {
                    throw new BadRequestException(`Parcelas são permitidas apenas para cartão de crédito (método: ${method.name})`);
                }

                if (!payment.installments && method.code === 'CREDIT_CARD') {
                    throw new BadRequestException(`Parcelas são obrigatórias para cartão de crédito (método: ${method.name})`);
                }

                const installmentValue = payment.installments
                    ? Math.round((payment.amount / payment.installments) * 100) / 100
                    : null;

                return {
                    paymentMethodId: payment.paymentMethodId,
                    paymentMethodName: method.name,
                    amount: payment.amount,
                    installments: payment.installments ?? null,
                    installmentValue,
                };
            }),
        );

        return results;
    }

    async simulate(dto: SimulateSaleDto) {
        const validatedPayments = await this.validatePayments(dto.payments, this.prisma);

        const itemsWithDetails = await Promise.all(
            dto.items.map(async (item) => {
                const validation = await this.validateItemWithStock(item, this.prisma);

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

        const amountPaid = Math.round(
            validatedPayments.reduce((sum, p) => sum + p.amount, 0) * 100,
        ) / 100;

        const change = Math.round((amountPaid - total) * 100) / 100;
        const paymentErrors: { type: string; message: string }[] = [];

        if (amountPaid < total) {
            paymentErrors.push({
                type: 'INSUFFICIENT_PAYMENT',
                message: `Valor pago (R$ ${amountPaid.toFixed(2)}) é menor que o total (R$ ${total.toFixed(2)}). Faltam R$ ${(total - amountPaid).toFixed(2)}`,
            });
        }

        const canFinalize = stockErrors.length === 0 && paymentErrors.length === 0;

        return {
            canFinalize,
            items: itemsWithDetails,
            summary: {
                totalItems: itemsWithDetails.reduce((sum, i) => sum + i.quantity, 0),
                totalProducts: itemsWithDetails.length,
                subtotal,
                discount,
                total,
                amountPaid,
                change: change < 0 ? null : change,
                payments: validatedPayments,
            },
            errors: [
                ...stockErrors.map((i) => ({
                    type: 'INSUFFICIENT_STOCK',
                    productId: i.productId,
                    productName: i.productName,
                    message: `Estoque insuficiente para "${i.productName}". Disponível: ${i.stockAvailable}, solicitado: ${i.quantity}`,
                })),
                ...paymentErrors,
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
            const validatedPayments = await this.validatePayments(dto.payments, tx);

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

            const amountPaid = Math.round(
                validatedPayments.reduce((sum, p) => sum + p.amount, 0) * 100,
            ) / 100;

            if (amountPaid < total) {
                throw new BadRequestException(
                    `Valor pago (R$ ${amountPaid.toFixed(2)}) é menor que o total (R$ ${total.toFixed(2)})`,
                );
            }

            const change = Math.round((amountPaid - total) * 100) / 100;

            // Verificar se há caixa aberto e vincular a venda
            const currentCashRegister = await this.cashRegisterService.findCurrent();
            
            const sale = await tx.sale.create({
                data: {
                    total: subtotal,
                    discount,
                    finalTotal: total,
                    amountPaid,
                    change,
                    notes: dto.notes,
                    cashRegisterId: currentCashRegister?.id || null,
                    items: {
                        create: itemsWithDetails.map((i) => ({
                            productId: i.product.id,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            subtotal: i.subtotal,
                        })),
                    },
                    payments: {
                        create: validatedPayments.map((p) => ({
                            paymentMethodId: p.paymentMethodId,
                            amount: p.amount,
                            installments: p.installments,
                            installmentValue: p.installmentValue,
                        })),
                    },
                },
                include: {
                    items: { include: { product: true } },
                    payments: { include: { paymentMethod: true } },
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

    async findAll(page = 1, limit = 20, date?: string) {
        const skip = (page - 1) * limit;

        let dateFilter = {};
        if (date) {
            const [year, month, day] = date.split('-').map(Number);
            const start = new Date(year, month - 1, day, 0, 0, 0, 0);
            const end = new Date(year, month - 1, day, 23, 59, 59, 999);
            dateFilter = {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            };
        }

        const [sales, total] = await Promise.all([
            this.prisma.sale.findMany({
                where: dateFilter,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: { product: { select: { id: true, name: true } } },
                    },
                    payments: { include: { paymentMethod: true } },
                },
            }),
            this.prisma.sale.count({ where: dateFilter }),
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
                payments: { include: { paymentMethod: true } },
            },
        });
        if (!sale) throw new NotFoundException('Venda não encontrada');
        return sale;
    }
}