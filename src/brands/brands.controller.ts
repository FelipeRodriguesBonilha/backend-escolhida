import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
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
    async findAll(): Promise<ReturnBrandDto[]> {
        return (await this.brandsService.findAll()).map(brand => new ReturnBrandDto(brand));
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
}