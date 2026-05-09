import { IsOptional, IsString } from 'class-validator';

export class CloseCashRegisterDto {
  @IsOptional()
  @IsString()
  closingNotes?: string;
}
