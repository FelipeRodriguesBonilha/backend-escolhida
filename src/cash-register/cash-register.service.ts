import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CloseCashRegisterDto } from './__dtos__/close-cash-register.dto';
import { CreateCashBleedDto } from './__dtos__/create-cash-bleed.dto';
import { OpenCashRegisterDto } from './__dtos__/open-cash-register.dto';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  private includeQuery = { bleeds: { orderBy: { createdAt: 'desc' as const } } };

  async open(dto: OpenCashRegisterDto) {
    const existing = await this.prisma.cashRegister.findFirst({
      where: { status: 'OPEN' },
    });

    if (existing) {
      throw new BadRequestException('Já existe um caixa aberto. Feche-o antes de abrir um novo.');
    }

    return this.prisma.cashRegister.create({
      data: {
        initialAmount: dto.initialAmount,
        notes: dto.notes,
      },
      include: this.includeQuery,
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
    const expectedAmount = Number(cashRegister.initialAmount) - totalBleeds;
    const difference = dto.finalAmount - expectedAmount;

    return this.prisma.cashRegister.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        finalAmount: dto.finalAmount,
        expectedAmount,
        difference,
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
