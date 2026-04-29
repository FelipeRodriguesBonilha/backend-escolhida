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

export class ReturnCashRegisterDto {
  id: string;
  openedAt: Date;
  closedAt: Date | null;
  initialAmount: number;
  finalAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: CashRegisterStatus;
  notes: string | null;
  closingNotes: string | null;
  bleeds: ReturnCashBleedDto[];
  totalBleeds: number;

  constructor(cashRegister: any) {
    this.id = cashRegister.id;
    this.openedAt = cashRegister.openedAt;
    this.closedAt = cashRegister.closedAt ?? null;
    this.initialAmount = Number(cashRegister.initialAmount);
    this.finalAmount = cashRegister.finalAmount != null ? Number(cashRegister.finalAmount) : null;
    this.expectedAmount = cashRegister.expectedAmount != null ? Number(cashRegister.expectedAmount) : null;
    this.difference = cashRegister.difference != null ? Number(cashRegister.difference) : null;
    this.status = cashRegister.status;
    this.notes = cashRegister.notes ?? null;
    this.closingNotes = cashRegister.closingNotes ?? null;
    this.bleeds = (cashRegister.bleeds ?? []).map((b: any) => new ReturnCashBleedDto(b));
    this.totalBleeds = this.bleeds.reduce((sum, b) => sum + b.amount, 0);
  }
}
