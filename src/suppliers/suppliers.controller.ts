import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('showInactive') showInactive?: string,
    ) {
        const result = await this.suppliersService.findAll(
            parseInt(page ?? '1') || 1,
            parseInt(limit ?? '10') || 10,
            search,
            showInactive === 'true',
        );
        return { ...result, data: result.data.map(s => new ReturnSupplierDto(s)) };
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

    @Patch(':id/reactivate')
    async reactivate(@Param('id') id: string): Promise<ReturnSupplierDto> {
        return new ReturnSupplierDto(await this.suppliersService.reactivate(id));
    }

    @Delete(':id/permanent')
    async permanentDelete(@Param('id') id: string) {
        await this.suppliersService.permanentDelete(id);
        return { message: 'Fornecedor excluído permanentemente' };
    }
}