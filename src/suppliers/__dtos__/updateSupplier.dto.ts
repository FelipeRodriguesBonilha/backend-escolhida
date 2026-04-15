import { IsBoolean, IsOptional } from 'class-validator';
import { CreateSupplierDto } from './createSupplier.dto';

export class UpdateSupplierDto extends CreateSupplierDto {
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}