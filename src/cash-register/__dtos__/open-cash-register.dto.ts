import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCashEntryDto } from './create-cash-entry.dto';

export class OpenCashRegisterDto {
  @IsNumber()
  @Min(0)
  initialAmount: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCashEntryDto)
  entries?: CreateCashEntryDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
