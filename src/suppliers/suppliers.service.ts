import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

    async findAll(page: number = 1, limit: number = 10, search?: string, showInactive: boolean = false) {
        const skip = (page - 1) * limit;
        const where = {
            active: !showInactive,
            ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
        };
        const [data, total] = await Promise.all([
            this.prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
            this.prisma.supplier.count({ where }),
        ]);
        return { data, total, page, limit };
    }

    async permanentDelete(id: string) {
        const supplier = await this.findOne(id);
        if (supplier.active) throw new BadRequestException('Apenas fornecedores inativos podem ser excluídos permanentemente');
        await this.prisma.product.updateMany({ where: { supplierId: id }, data: { supplierId: null } });
        return this.prisma.supplier.delete({ where: { id } });
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

    async reactivate(id: string) {
        await this.findOne(id);
        return this.prisma.supplier.update({ where: { id }, data: { active: true } });
    }
}