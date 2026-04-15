import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';

export class SaleItemDto {
    @IsString()
    productId: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateSaleDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => SaleItemDto)
    items: SaleItemDto[];

    @IsString()
    paymentMethodId: string;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    discount: number = 0;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    amountPaid: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    installments?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}