import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductVariationDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    colorCode?: string;

    @IsOptional()
    @IsString()
    barcode?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    removeImage?: boolean;
}

export class ConvertProductToVariationDto {
    @IsString()
    barcode: string;

    @IsOptional()
    @IsString()
    variationId?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    colorCode?: string;
}