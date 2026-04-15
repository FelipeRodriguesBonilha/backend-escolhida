import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSupplierDto } from './__dtos__/createSupplier.dto';
import { UpdateSupplierDto } from './__dtos__/updateSupplier.dto';

@Injectable()
export class SuppliersService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateSupplierDto) {
        if (dto.cnpj) {
            const exists = await this.prisma.supplier.findUnique({ where: { cnpj: dto.cnpj } });
            if (exists) throw new ConflictException('CNPJ já cadastrado');
        }
        return this.prisma.supplier.create({ data: dto });
    }

    async findAll() {
        return this.prisma.supplier.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
            include: { products: { select: { id: true, name: true } } },
        });
        if (!supplier) throw new NotFoundException('Fornecedor não encontrado');
        return supplier;
    }

    async update(id: string, dto: UpdateSupplierDto) {
        await this.findOne(id);
        return this.prisma.supplier.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.supplier.update({ where: { id }, data: { active: false } });
    }
}