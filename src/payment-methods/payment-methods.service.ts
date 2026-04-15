import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentMethodDto } from './__dtos__/createPaymentMethod.dto';
import { UpdatePaymentMethodDto } from './__dtos__/updatePaymentMethod.dto';

@Injectable()
export class PaymentMethodsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreatePaymentMethodDto) {
        const exists = await this.prisma.paymentMethod.findUnique({
            where: { code: dto.code },
        });

        if (exists) {
            throw new ConflictException('Código de método de pagamento já existe');
        }

        return this.prisma.paymentMethod.create({
            data: dto,
        });
    }

    async findAll() {
        return this.prisma.paymentMethod.findMany({
            where: { active: true },
            orderBy: { order: 'asc' },
        });
    }

    async findOne(id: string) {
        const paymentMethod = await this.prisma.paymentMethod.findUnique({
            where: { id },
        });

        if (!paymentMethod) {
            throw new NotFoundException('Método de pagamento não encontrado');
        }

        return paymentMethod;
    }

    async findByCode(code: string) {
        const paymentMethod = await this.prisma.paymentMethod.findUnique({
            where: { code },
        });

        if (!paymentMethod) {
            throw new NotFoundException('Método de pagamento não encontrado');
        }

        return paymentMethod;
    }

    async update(id: string, dto: UpdatePaymentMethodDto) {
        await this.findOne(id);

        return this.prisma.paymentMethod.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.paymentMethod.update({
            where: { id },
            data: { active: false },
        });
    }
}
