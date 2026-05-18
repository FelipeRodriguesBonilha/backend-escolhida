import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateBrandDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsBoolean()
    showInCatalog?: boolean;
}