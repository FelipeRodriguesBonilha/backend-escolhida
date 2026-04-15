import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class UpdatePaymentMethodDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsBoolean()
    @IsOptional()
    active?: boolean;

    @IsInt()
    @IsOptional()
    order?: number;
}
