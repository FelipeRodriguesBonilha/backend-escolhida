import { Sale, SaleItem, PaymentMethod } from "src/generated/prisma/client";
import { ReturnPaymentMethodDto } from "src/payment-methods/__dtos__/returnPaymentMethod.dto";
import { ReturnSaleItemDto } from "./returnSaleItem.dto";

export class ReturnSaleDto {
    id: string;
    total: number;
    discount: number;
    finalTotal: number;
    amountPaid: number;
    change: number;
    paymentMethod: ReturnPaymentMethodDto;
    installments: number | null;
    installmentValue: number | null;
    notes: string | null;
    createdAt: Date;
    items?: ReturnSaleItemDto[];

    constructor(sale: Sale & { items?: SaleItem[] | null; paymentMethod?: PaymentMethod | null }) {
        this.id = sale.id;
        this.total = Number(sale.total);
        this.discount = Number(sale.discount);
        this.finalTotal = Number(sale.finalTotal);
        this.amountPaid = Number(sale.amountPaid);
        this.change = Number(sale.change);
        this.paymentMethod = sale.paymentMethod ? new ReturnPaymentMethodDto(sale.paymentMethod) : {} as ReturnPaymentMethodDto;
        this.installments = sale.installments;
        this.installmentValue = sale.installmentValue ? Number(sale.installmentValue) : null;
        this.notes = sale.notes;
        this.createdAt = sale.createdAt;

        this.items = sale.items ? sale.items.map(item => new ReturnSaleItemDto(item)) : undefined;
    }
}
