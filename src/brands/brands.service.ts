import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateBrandDto } from './__dtos__/createBrand.dto';
import { UpdateBrandDto } from './__dtos__/updateBrand.dto';

@Injectable()
export class BrandsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateBrandDto) {
        const exists = await this.prisma.brand.findUnique({ where: { name: dto.name } });
        if (exists) throw new ConflictException('Marca já cadastrada');
        return this.prisma.brand.create({ data: dto });
    }

    async findAll(page: number = 1, limit: number = 10, search?: string, showInactive: boolean = false) {
        const skip = (page - 1) * limit;
        const where = {
            active: !showInactive,
            ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
        };
        const [data, total] = await Promise.all([
            this.prisma.brand.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
            this.prisma.brand.count({ where }),
        ]);
        return { data, total, page, limit };
    }

    async findOne(id: string) {
        const brand = await this.prisma.brand.findUnique({ where: { id } });
        if (!brand) throw new NotFoundException('Marca não encontrada');
        return brand;
    }

    async update(id: string, dto: UpdateBrandDto) {
        await this.findOne(id);
        return this.prisma.brand.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.brand.update({ where: { id }, data: { active: false } });
    }

    async reactivate(id: string) {
        await this.findOne(id);
        return this.prisma.brand.update({ where: { id }, data: { active: true } });
    }

    async permanentDelete(id: string) {
        const brand = await this.findOne(id);
        if (brand.active) throw new BadRequestException('Apenas marcas inativas podem ser excluídas permanentemente');
        const productCount = await this.prisma.product.count({ where: { brandId: id } });
        if (productCount > 0) throw new BadRequestException(`Não é possível excluir: ${productCount} produto(s) ainda usam esta marca`);
        return this.prisma.brand.delete({ where: { id } });
    }
}