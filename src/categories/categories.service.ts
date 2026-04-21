import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

    async findAll(page: number = 1, limit: number = 10, search?: string, showInactive: boolean = false) {
        const skip = (page - 1) * limit;
        const where = {
            active: !showInactive,
            ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
        };
        const [data, total] = await Promise.all([
            this.prisma.category.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
            this.prisma.category.count({ where }),
        ]);
        return { data, total, page, limit };
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

    async reactivate(id: string) {
        await this.findOne(id);
        return this.prisma.category.update({ where: { id }, data: { active: true } });
    }

    async permanentDelete(id: string) {
        const category = await this.findOne(id);
        if (category.active) throw new BadRequestException('Apenas categorias inativas podem ser excluídas permanentemente');
        const productCount = await this.prisma.product.count({ where: { categoryId: id } });
        if (productCount > 0) throw new BadRequestException(`Não é possível excluir: ${productCount} produto(s) ainda usam esta categoria`);
        return this.prisma.category.delete({ where: { id } });
    }
}