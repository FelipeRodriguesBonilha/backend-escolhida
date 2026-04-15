import { Brand } from "src/generated/prisma/client";

export class ReturnBrandDto {
    id: string;
    name: string;
    active: boolean;
    createdAt: Date;

    constructor(brand: Brand) {
        this.id = brand.id;
        this.name = brand.name;
        this.active = brand.active;
        this.createdAt = brand.createdAt;
    }
}
