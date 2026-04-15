import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/__enums__/role.enum';
import { CreateCategoryDto } from './__dtos__/createCategory.dto';
import { ReturnCategoryDto } from './__dtos__/returnCategory.dto';
import { UpdateCategoryDto } from './__dtos__/updateCategory.dto';
import { CategoriesService } from './categories.service';

@Roles(Role.Admin)
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    async create(@Body() dto: CreateCategoryDto): Promise<ReturnCategoryDto> {
        return new ReturnCategoryDto(await this.categoriesService.create(dto));
    }

    @Get()
    async findAll(): Promise<ReturnCategoryDto[]> {
        return (await this.categoriesService.findAll()).map(category => new ReturnCategoryDto(category));
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<ReturnCategoryDto> {
        return new ReturnCategoryDto(await this.categoriesService.findOne(id));
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<ReturnCategoryDto> {
        return new ReturnCategoryDto(await this.categoriesService.update(id, dto));
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<ReturnCategoryDto> {
        return new ReturnCategoryDto(await this.categoriesService.remove(id));
    }
}