import { IsOptional, IsString } from 'class-validator';

export class CreateProductColorDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    colorCode?: string;
}