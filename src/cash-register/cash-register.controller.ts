import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/__enums__/role.enum';
import { CloseCashRegisterDto } from './__dtos__/close-cash-register.dto';
import { CreateCashBleedDto } from './__dtos__/create-cash-bleed.dto';
import { CreateCashEntryDto } from './__dtos__/create-cash-entry.dto';
import { OpenCashRegisterDto } from './__dtos__/open-cash-register.dto';
import { ReturnCashRegisterDto } from './__dtos__/return-cash-register.dto';
import { CashRegisterService } from './cash-register.service';

@Roles(Role.Admin)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('open')
  async open(@Body() dto: OpenCashRegisterDto): Promise<ReturnCashRegisterDto> {
    return new ReturnCashRegisterDto(await this.cashRegisterService.open(dto));
  }

  @Post(':id/close')
  async close(@Param('id') id: string, @Body() dto: CloseCashRegisterDto): Promise<ReturnCashRegisterDto> {
    return new ReturnCashRegisterDto(await this.cashRegisterService.close(id, dto));
  }

  @Post(':id/bleed')
  async bleed(@Param('id') id: string, @Body() dto: CreateCashBleedDto) {
    return this.cashRegisterService.bleed(id, dto);
  }

  @Post(':id/entry')
  async addEntry(@Param('id') id: string, @Body() dto: CreateCashEntryDto) {
    return this.cashRegisterService.addEntry(id, dto);
  }

  @Post('link-sale/:saleId')
  async linkSaleToCurrentCashRegister(@Param('saleId') saleId: string) {
    return this.cashRegisterService.linkSaleToCurrentCashRegister(saleId);
  }

  @Get('current')
  async findCurrent() {
    const result = await this.cashRegisterService.findCurrent();
    return result ? new ReturnCashRegisterDto(result) : null;
  }

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('date') date?: string,
  ) {
    const result = await this.cashRegisterService.findAll(Number(page), Number(limit), date);
    return {
      ...result,
      data: result.data.map(cr => new ReturnCashRegisterDto(cr)),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ReturnCashRegisterDto> {
    return new ReturnCashRegisterDto(await this.cashRegisterService.findOne(id));
  }
}
