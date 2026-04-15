import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/__enums__/role.enum';
import { CreatePaymentMethodDto } from './__dtos__/createPaymentMethod.dto';
import { ReturnPaymentMethodDto } from './__dtos__/returnPaymentMethod.dto';
import { UpdatePaymentMethodDto } from './__dtos__/updatePaymentMethod.dto';
import { PaymentMethodsService } from './payment-methods.service';

@Roles(Role.Admin)
@Controller('payment-methods')
export class PaymentMethodsController {
    constructor(private readonly paymentMethodsService: PaymentMethodsService) { }

    @Roles(Role.Admin)
    @Post()
    async create(@Body() dto: CreatePaymentMethodDto): Promise<ReturnPaymentMethodDto> {
        return new ReturnPaymentMethodDto(await this.paymentMethodsService.create(dto));
    }

    @Get()
    async findAll(): Promise<ReturnPaymentMethodDto[]> {
        return (await this.paymentMethodsService.findAll()).map(pm => new ReturnPaymentMethodDto(pm));
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<ReturnPaymentMethodDto> {
        return new ReturnPaymentMethodDto(await this.paymentMethodsService.findOne(id));
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto): Promise<ReturnPaymentMethodDto> {
        return new ReturnPaymentMethodDto(await this.paymentMethodsService.update(id, dto));
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<ReturnPaymentMethodDto> {
        return new ReturnPaymentMethodDto(await this.paymentMethodsService.remove(id));
    }
}
