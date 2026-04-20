import { Sale, SaleItem, SalePaymentMethod, PaymentMethod } from "src/generated/prisma/client";
import { ReturnPaymentMethodDto } from "src/payment-methods/__dtos__/returnPaymentMethod.dto";
import { ReturnSaleItemDto } from "./returnSaleItem.dto";

export class SalePaymentMethodReturnDto {
    id: string;
    paymentMethodId: string;
    paymentMethod: ReturnPaymentMethodDto;
    amount: number;
    installments: number | null;
    installmentValue: number | null;

    constructor(p: SalePaymentMethod & { paymentMethod?: PaymentMethod | null }) {
        this.id = p.id;
        this.paymentMethodId = p.paymentMethodId;
        this.paymentMethod = p.paymentMethod ? new ReturnPaymentMethodDto(p.paymentMethod) : {} as ReturnPaymentMethodDto;
        this.amount = Number(p.amount);
        this.installments = p.installments ?? null;
        this.installmentValue = p.installmentValue ? Number(p.installmentValue) : null;
    }
}

export class ReturnSaleDto {
    id: string;
    total: number;
    discount: number;
    finalTotal: number;
    amountPaid: number;
    change: number;
    payments: SalePaymentMethodReturnDto[];
    notes: string | null;
    createdAt: Date;
    items?: ReturnSaleItemDto[];

    constructor(sale: Sale & { items?: SaleItem[] | null; payments?: (SalePaymentMethod & { paymentMethod?: PaymentMethod | null })[] | null }) {
        this.id = sale.id;
        this.total = Number(sale.total);
        this.discount = Number(sale.discount);
        this.finalTotal = Number(sale.finalTotal);
        this.amountPaid = Number(sale.amountPaid);
        this.change = Number(sale.change);
        this.payments = sale.payments ? sale.payments.map(p => new SalePaymentMethodReturnDto(p)) : [];
        this.notes = sale.notes;
        this.createdAt = sale.createdAt;
        this.items = sale.items ? sale.items.map(item => new ReturnSaleItemDto(item)) : undefined;
    }
}
