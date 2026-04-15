import { Type } from 'class-transformer';
import {
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
} from 'class-validator';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    barcode?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    price: number;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    costPrice: number;

    @IsString()
    categoryId: string;

    @IsString()
    brandId: string;

    @IsOptional()
    @IsString()
    supplierId?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    initialStock?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    minQuantity?: number;
}