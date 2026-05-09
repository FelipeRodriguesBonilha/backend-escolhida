import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CloseCashRegisterDto } from './__dtos__/close-cash-register.dto';
import { CreateCashBleedDto } from './__dtos__/create-cash-bleed.dto';
import { CreateCashEntryDto } from './__dtos__/create-cash-entry.dto';
import { OpenCashRegisterDto } from './__dtos__/open-cash-register.dto';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  private includeQuery = {
    bleeds: {
      orderBy: { createdAt: 'asc' as const },
    },
    entries: {
      orderBy: { createdAt: 'asc' as const },
    },
    sales: {
      include: {
        payments: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' as const },
    },
  };

  async open(dto: OpenCashRegisterDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.prisma.cashRegister.findFirst({
      where: { status: 'OPEN' },
    });

    if (existing) {
      throw new BadRequestException('Já existe um caixa aberto. Feche-o antes de abrir um novo.');
    }

    const todayRegister = await this.prisma.cashRegister.findFirst({
      where: {
        openedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (todayRegister) {
      throw new BadRequestException('Já existe um caixa aberto hoje. Só é permitido um caixa por dia.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const cashRegister = await tx.cashRegister.create({
        data: {
          initialAmount: dto.initialAmount,
          notes: dto.notes,
        },
        include: this.includeQuery,
      });

      if (dto.entries && dto.entries.length > 0) {
        for (const entry of dto.entries) {
          await tx.cashEntry.create({
            data: {
              cashRegisterId: cashRegister.id,
              amount: entry.amount,
              description: entry.description,
            },
          });
        }
      }

      return tx.cashRegister.findUnique({
        where: { id: cashRegister.id },
        include: this.includeQuery,
      });
    });
  }

  async close(id: string, dto: CloseCashRegisterDto) {
    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: this.includeQuery,
    });

    if (!cashRegister) throw new NotFoundException('Caixa não encontrado.');
    if (cashRegister.status === 'CLOSED') throw new BadRequestException('Este caixa já está fechado.');

    const totalBleeds = cashRegister.bleeds.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalEntries = cashRegister.entries.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCashSales = cashRegister.sales
      .filter(sale => sale.payments.some(payment => payment.paymentMethod.code === 'CASH'))
      .reduce((sum, sale) => sum + Number(sale.finalTotal), 0);
    
    const finalAmount = Number(cashRegister.initialAmount) + totalEntries + totalCashSales - totalBleeds;

    return this.prisma.cashRegister.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        finalAmount,
        closingNotes: dto.closingNotes,
      },
      include: this.includeQuery,
    });
  }

  async bleed(id: string, dto: CreateCashBleedDto) {
    const cashRegister = await this.prisma.cashRegister.findUnique({ where: { id } });

    if (!cashRegister) throw new NotFoundException('Caixa não encontrado.');
    if (cashRegister.status === 'CLOSED') throw new BadRequestException('Não é possível fazer sangria em caixa fechado.');

    return this.prisma.cashBleed.create({
      data: {
        cashRegisterId: id,
        amount: dto.amount,
        reason: dto.reason,
      },
    });
  }

  async addEntry(id: string, dto: CreateCashEntryDto) {
    const cashRegister = await this.prisma.cashRegister.findUnique({ where: { id } });

    if (!cashRegister) throw new NotFoundException('Caixa não encontrado.');
    if (cashRegister.status === 'CLOSED') throw new BadRequestException('Não é possível adicionar entrada em caixa fechado.');

    return this.prisma.cashEntry.create({
      data: {
        cashRegisterId: id,
        amount: dto.amount,
        description: dto.description,
      },
    });
  }

  async linkSaleToCurrentCashRegister(saleId: string) {
    const currentCashRegister = await this.findCurrent();
    
    if (!currentCashRegister) {
      throw new BadRequestException('Não há caixa aberto no momento.');
    }

    return this.prisma.sale.update({
      where: { id: saleId },
      data: {
        cashRegisterId: currentCashRegister.id,
      },
    });
  }

  async findCurrent() {
    const cashRegister = await this.prisma.cashRegister.findFirst({
      where: { status: 'OPEN' },
      include: this.includeQuery,
    });

    return cashRegister ?? null;
  }

  async findAll(page = 1, limit = 20, date?: string) {
    const skip = (page - 1) * limit;

    const where = date
      ? {
          openedAt: {
            gte: new Date(`${date}T00:00:00.000Z`),
            lte: new Date(`${date}T23:59:59.999Z`),
          },
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.cashRegister.findMany({
        where,
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' },
        include: this.includeQuery,
      }),
      this.prisma.cashRegister.count({ where }),
    ]);

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: this.includeQuery,
    });

    if (!cashRegister) throw new NotFoundException('Caixa não encontrado.');
    return cashRegister;
  }
}
