import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateProductDto } from './createProduct.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    active?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    removeImage?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        return [value];
    })
    removeImageIds?: string[];
}