import { IsNumber, IsString, Min } from 'class-validator';

export class CreateCashEntryDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  description: string;
}
