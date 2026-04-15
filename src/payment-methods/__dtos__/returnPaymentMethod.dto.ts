import { PaymentMethod } from "src/generated/prisma/client";

export class ReturnPaymentMethodDto {
    id: string;
    code: string;
    name: string;
    active: boolean;
    order: number;
    createdAt: Date;

    constructor(paymentMethod: PaymentMethod) {
        this.id = paymentMethod.id;
        this.code = paymentMethod.code;
        this.name = paymentMethod.name;
        this.active = paymentMethod.active;
        this.order = paymentMethod.order;
        this.createdAt = paymentMethod.createdAt;
    }
}
