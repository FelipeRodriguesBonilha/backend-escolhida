import {
    Body,
    Controller,
    Get,
    Param,
    Post
} from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/__enums__/role.enum';
import { AdjustStockDto } from './__dtos__/adjustStock.dto';
import { ReturnStockDto } from './__dtos__/returnStock.dto';
import { StockService } from './stock.service';

@Roles(Role.Admin)
@Controller('stock')
export class StockController {
    constructor(private readonly stockService: StockService) { }

    @Get()
    async findAll(): Promise<ReturnStockDto[]> {
        return (await this.stockService.findAll()).map(stock => new ReturnStockDto(stock));
    }

    @Get('low-stock')
    async getLowStock(): Promise<ReturnStockDto[]> {
        return (await this.stockService.getLowStock()).map(stock => new ReturnStockDto(stock));
    }

    @Get('product/:productId')
    async findByProduct(@Param('productId') productId: string): Promise<ReturnStockDto> {
        return new ReturnStockDto(await this.stockService.findByProduct(productId));
    }

    @Post('product/:productId/adjust')
    async adjust(
        @Param('productId') productId: string,
        @Body() dto: AdjustStockDto,
    ): Promise<ReturnStockDto> {
        return new ReturnStockDto(await this.stockService.adjust(productId, dto));
    }
}