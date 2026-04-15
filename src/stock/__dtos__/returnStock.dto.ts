import { ReturnProductDto } from "src/products/__dtos__/returnProduct.dto";
import { Stock, Product } from "src/generated/prisma/client";

export class ReturnStockDto {
    id: string;
    productId: string;
    quantity: number;
    minQuantity: number;
    updatedAt: Date;
    product?: ReturnProductDto;

    constructor(stock: Stock & { product?: Product | null }) {
        this.id = stock.id;
        this.productId = stock.productId;
        this.quantity = stock.quantity;
        this.minQuantity = stock.minQuantity;
        this.updatedAt = stock.updatedAt;
        
        this.product = stock.product ? new ReturnProductDto(stock.product) : undefined;
    }
}
