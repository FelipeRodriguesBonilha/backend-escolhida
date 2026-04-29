import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenCashRegisterDto {
  @IsNumber()
  @Min(0)
  initialAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
