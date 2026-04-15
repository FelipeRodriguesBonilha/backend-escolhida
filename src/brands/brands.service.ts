import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

    async findAll() {
        return this.prisma.brand.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
        });
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
}