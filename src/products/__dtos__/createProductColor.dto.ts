import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductColorDto {
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

export class ConvertProductToColorDto {
    @IsString()
    barcode: string;

    @IsOptional()
    @IsString()
    colorId?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    colorCode?: string;
}