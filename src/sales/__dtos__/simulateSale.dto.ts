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

export class SimulateSaleItemDto {
    @IsString()
    productId: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;
}

export class SimulatePaymentMethodDto {
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

export class SimulateSaleDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => SimulateSaleItemDto)
    items: SimulateSaleItemDto[];

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => SimulatePaymentMethodDto)
    payments: SimulatePaymentMethodDto[];

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    discount: number = 0;
}