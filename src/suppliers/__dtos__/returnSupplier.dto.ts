import { Supplier } from "src/generated/prisma/client";

export class ReturnSupplierDto {
    id: string;
    name: string;
    cnpj: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;

    constructor(supplier: Supplier) {
        this.id = supplier.id;
        this.name = supplier.name;
        this.cnpj = supplier.cnpj;
        this.phone = supplier.phone;
        this.email = supplier.email;
        this.address = supplier.address;
        this.active = supplier.active;
        this.createdAt = supplier.createdAt;
        this.updatedAt = supplier.updatedAt;
    }
}
