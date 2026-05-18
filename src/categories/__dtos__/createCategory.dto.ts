import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsBoolean()
    showInCatalog?: boolean;
}