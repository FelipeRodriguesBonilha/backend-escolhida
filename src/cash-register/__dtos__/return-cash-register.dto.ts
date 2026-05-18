import { CashRegisterStatus } from "src/generated/prisma/client";

export class ReturnCashBleedDto {
  id: string;
  cashRegisterId: string;
  amount: number;
  reason: string;
  createdAt: Date;

  constructor(bleed: any) {
    this.id = bleed.id;
    this.cashRegisterId = bleed.cashRegisterId;
    this.amount = Number(bleed.amount);
    this.reason = bleed.reason;
    this.createdAt = bleed.createdAt;
  }
}

export class ReturnCashEntryDto {
  id: string;
  cashRegisterId: string;
  amount: number;
  description: string;
  createdAt: Date;

  constructor(entry: any) {
    this.id = entry.id;
    this.cashRegisterId = entry.cashRegisterId;
    this.amount = Number(entry.amount);
    this.description = entry.description;
    this.createdAt = entry.createdAt;
  }
}

export class ReturnSalePaymentDto {
  id: string;
  paymentMethodId: string;
  amount: number;
  installments: number | null;
  installmentValue: number | null;
  paymentMethod: {
    id: string;
    name: string;
    code: string;
  };

  constructor(payment: any) {
    this.id = payment.id;
    this.paymentMethodId = payment.paymentMethodId;
    this.amount = Number(payment.amount);
    this.installments = payment.installments ?? null;
    this.installmentValue = payment.installmentValue ? Number(payment.installmentValue) : null;
    this.paymentMethod = payment.paymentMethod;
  }
}

export class ReturnSaleDto {
  id: string;
  total: number;
  discount: number;
  finalTotal: number;
  amountPaid: number;
  change: number;
  notes: string | null;
  createdAt: Date;
  cashRegisterId: string | null;
  payments: ReturnSalePaymentDto[];

  constructor(sale: any) {
    this.id = sale.id;
    this.total = Number(sale.total);
    this.discount = Number(sale.discount);
    this.finalTotal = Number(sale.finalTotal);
    this.amountPaid = Number(sale.amountPaid);
    this.change = Number(sale.change);
    this.notes = sale.notes ?? null;
    this.createdAt = sale.createdAt;
    this.cashRegisterId = sale.cashRegisterId ?? null;
    this.payments = (sale.payments ?? []).map((p: any) => new ReturnSalePaymentDto(p));
  }
}

export class ReturnCashRegisterDto {
  id: string;
  openedAt: Date;
  closedAt: Date | null;
  initialAmount: number;
  finalAmount: number | null;
  status: CashRegisterStatus;
  notes: string | null;
  closingNotes: string | null;
  bleeds: ReturnCashBleedDto[];
  entries: ReturnCashEntryDto[];
  sales: ReturnSaleDto[];
  totalBleeds: number;
  totalEntries: number;
  totalCashSales: number;

  constructor(cashRegister: any) {
    this.id = cashRegister.id;
    this.openedAt = cashRegister.openedAt;
    this.closedAt = cashRegister.closedAt ?? null;
    this.initialAmount = Number(cashRegister.initialAmount);
    this.finalAmount = cashRegister.finalAmount != null ? Number(cashRegister.finalAmount) : null;
    this.status = cashRegister.status;
    this.notes = cashRegister.notes ?? null;
    this.closingNotes = cashRegister.closingNotes ?? null;
    
    this.bleeds = (cashRegister.bleeds ?? []).map((b: any) => new ReturnCashBleedDto(b));
    this.entries = (cashRegister.entries ?? []).map((e: any) => new ReturnCashEntryDto(e));
    this.sales = (cashRegister.sales ?? []).map((s: any) => new ReturnSaleDto(s));
    
    this.totalBleeds = this.bleeds.reduce((sum, b) => sum + b.amount, 0);
    this.totalEntries = this.entries.reduce((sum, e) => sum + e.amount, 0);
    this.totalCashSales = this.sales
      .reduce((sum, sale) => {
        const cashPayment = sale.payments.find(payment => payment.paymentMethod.code === 'CASH');
        return sum + (cashPayment ? cashPayment.amount : 0);
      }, 0);
  }
}
