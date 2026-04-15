import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class CreatePaymentMethodDto {
    @IsString()
    code: string;

    @IsString()
    name: string;

    @IsBoolean()
    @IsOptional()
    active?: boolean;

    @IsInt()
    @IsOptional()
    order?: number;
}
