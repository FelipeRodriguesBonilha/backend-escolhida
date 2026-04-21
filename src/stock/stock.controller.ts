import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query
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
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('showInactive') showInactive?: string,
    ) {
        const result = await this.stockService.findAll(
            parseInt(page ?? '1') || 1,
            parseInt(limit ?? '10') || 10,
            search,
            showInactive === 'true',
        );
        return { ...result, data: result.data.map(s => new ReturnStockDto(s)) };
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

    @Delete('product/:productId/permanent')
    async permanentDelete(@Param('productId') productId: string) {
        await this.stockService.permanentDeleteByProduct(productId);
        return { message: 'Produto excluído permanentemente' };
    }
}