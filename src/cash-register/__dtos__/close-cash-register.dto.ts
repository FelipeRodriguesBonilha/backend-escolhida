import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseCashRegisterDto {
  @IsNumber()
  @Min(0)
  finalAmount: number;

  @IsOptional()
  @IsString()
  closingNotes?: string;
}
