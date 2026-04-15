import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/__enums__/role.enum';
import { CreateSaleDto } from './__dtos__/createSale.dto';
import { ReturnSaleDto } from './__dtos__/returnSale.dto';
import { SimulateSaleDto } from './__dtos__/simulateSale.dto';
import { SalesService } from './sales.service';

@Roles(Role.Admin)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) { }

  @Post('simulate')
  simulate(@Body() dto: SimulateSaleDto) {
    return this.salesService.simulate(dto);
  }

  @Post()
  async create(@Body() dto: CreateSaleDto): Promise<ReturnSaleDto> {
    return new ReturnSaleDto(await this.salesService.create(dto));
  }

  @Get()
  async findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    const result = await this.salesService.findAll(Number(page), Number(limit));
    return {
      ...result,
      data: result.data.map(sale => new ReturnSaleDto(sale)),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ReturnSaleDto> {
    return new ReturnSaleDto(await this.salesService.findOne(id));
  }
}