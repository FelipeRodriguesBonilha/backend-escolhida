import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class AdjustStockDto {
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    quantity: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    minQuantity?: number;
}