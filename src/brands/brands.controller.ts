import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/__enums__/role.enum';
import { CreateBrandDto } from './__dtos__/createBrand.dto';
import { ReturnBrandDto } from './__dtos__/returnBrand.dto';
import { UpdateBrandDto } from './__dtos__/updateBrand.dto';
import { BrandsService } from './brands.service';

@Roles(Role.Admin)
@Controller('brands')
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) { }

    @Post()
    async create(@Body() dto: CreateBrandDto): Promise<ReturnBrandDto> {
        return new ReturnBrandDto(await this.brandsService.create(dto));
    }

    @Get()
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('showInactive') showInactive?: string,
    ) {
        const result = await this.brandsService.findAll(
            parseInt(page ?? '1') || 1,
            parseInt(limit ?? '10') || 10,
            search,
            showInactive === 'true',
        );
        return { ...result, data: result.data.map(b => new ReturnBrandDto(b)) };
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<ReturnBrandDto> {
        return new ReturnBrandDto(await this.brandsService.findOne(id));
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateBrandDto): Promise<ReturnBrandDto> {
        return new ReturnBrandDto(await this.brandsService.update(id, dto));
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<ReturnBrandDto> {
        return new ReturnBrandDto(await this.brandsService.remove(id));
    }

    @Patch(':id/reactivate')
    async reactivate(@Param('id') id: string): Promise<ReturnBrandDto> {
        return new ReturnBrandDto(await this.brandsService.reactivate(id));
    }

    @Delete(':id/permanent')
    async permanentDelete(@Param('id') id: string) {
        await this.brandsService.permanentDelete(id);
        return { message: 'Marca excluída permanentemente' };
    }
}