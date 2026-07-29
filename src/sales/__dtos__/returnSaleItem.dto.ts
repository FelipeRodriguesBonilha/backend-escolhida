import { SaleItem, Product } from "src/generated/prisma/client";
import { ReturnProductDto } from "src/products/__dtos__/returnProduct.dto";

export class ReturnSaleItemDto {
    id: string;
    saleId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    priceEdited: boolean;
    subtotal: number;
    product?: ReturnProductDto;

    constructor(item: SaleItem & { product?: Product | null }) {
        this.id = item.id;
        this.saleId = item.saleId;
        this.productId = item.productId;
        this.quantity = item.quantity;
        this.unitPrice = Number(item.unitPrice);
        this.priceEdited = item.priceEdited;
        this.subtotal = Number(item.subtotal);
        
        this.product = item.product ? new ReturnProductDto(item.product) : undefined;
    }
}
