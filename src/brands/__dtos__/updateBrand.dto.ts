import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateBrandDto } from './createBrand.dto';

export class UpdateBrandDto extends PartialType(CreateBrandDto) {
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}