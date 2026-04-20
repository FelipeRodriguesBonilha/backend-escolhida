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

export class SalePaymentMethodDto {
    @IsString()
    paymentMethodId: string;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    amount: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    installments?: number;
}

export class CreateSaleDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => SaleItemDto)
    items: SaleItemDto[];

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => SalePaymentMethodDto)
    payments: SalePaymentMethodDto[];

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    discount: number = 0;

    @IsOptional()
    @IsString()
    notes?: string;
}