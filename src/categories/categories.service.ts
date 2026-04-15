import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCategoryDto } from './__dtos__/createCategory.dto';
import { UpdateCategoryDto } from './__dtos__/updateCategory.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateCategoryDto) {
        const exists = await this.prisma.category.findUnique({ where: { name: dto.name } });
        if (exists) throw new ConflictException('Categoria já cadastrada');
        return this.prisma.category.create({ data: dto });
    }

    async findAll() {
        return this.prisma.category.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) throw new NotFoundException('Categoria não encontrada');
        return category;
    }

    async update(id: string, dto: UpdateCategoryDto) {
        await this.findOne(id);
        return this.prisma.category.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.category.update({ where: { id }, data: { active: false } });
    }
}