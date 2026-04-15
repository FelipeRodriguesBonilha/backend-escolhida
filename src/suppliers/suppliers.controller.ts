import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/__enums__/role.enum';
import { CreateSupplierDto } from './__dtos__/createSupplier.dto';
import { ReturnSupplierDto } from './__dtos__/returnSupplier.dto';
import { UpdateSupplierDto } from './__dtos__/updateSupplier.dto';
import { SuppliersService } from './suppliers.service';

@Roles(Role.Admin)
@Controller('suppliers')
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) { }

    @Post()
    async create(@Body() dto: CreateSupplierDto): Promise<ReturnSupplierDto> {
        return new ReturnSupplierDto(await this.suppliersService.create(dto));
    }

    @Get()
    async findAll(): Promise<ReturnSupplierDto[]> {
        return (await this.suppliersService.findAll()).map(supplier => new ReturnSupplierDto(supplier));
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<ReturnSupplierDto> {
        return new ReturnSupplierDto(await this.suppliersService.findOne(id));
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto): Promise<ReturnSupplierDto> {
        return new ReturnSupplierDto(await this.suppliersService.update(id, dto));
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<ReturnSupplierDto> {
        return new ReturnSupplierDto(await this.suppliersService.remove(id));
    }
}