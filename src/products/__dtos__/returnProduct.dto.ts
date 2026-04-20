import { Product, Category, Brand, Supplier, Stock, ProductColor } from "src/generated/prisma/client";
import { ReturnBrandDto } from "src/brands/__dtos__/returnBrand.dto";
import { ReturnCategoryDto } from "src/categories/__dtos__/returnCategory.dto";
import { ReturnSupplierDto } from "src/suppliers/__dtos__/returnSupplier.dto";
import { ReturnStockDto } from "src/stock/__dtos__/returnStock.dto";

export class ReturnProductColorDto {
    id: string;
    productId: string;
    name: string;
    colorCode: string | null;
    imageUrl: string | null;
    order: number;
    createdAt: Date;

    constructor(color: ProductColor) {
        this.id = color.id;
        this.productId = color.productId;
        this.name = color.name;
        this.colorCode = color.colorCode;
        this.imageUrl = color.imageUrl;
        this.order = color.order;
        this.createdAt = color.createdAt;
    }
}

export class ReturnProductDto {
    id: string;
    name: string;
    barcode: string | null;
    description: string | null;
    price: number;
    costPrice: number;
    categoryId: string;
    brandId: string | null;
    supplierId: string | null;
    imageUrl: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    category?: ReturnCategoryDto;
    brand?: ReturnBrandDto;
    supplier?: ReturnSupplierDto;
    stock?: ReturnStockDto;
    colors: ReturnProductColorDto[];

    constructor(product: Product & { 
        category?: Category | null; 
        brand?: Brand | null; 
        supplier?: Supplier | null; 
        stock?: Stock | null;
        colors?: ProductColor[];
    }) {
        this.id = product.id;
        this.name = product.name;
        this.barcode = product.barcode;
        this.description = product.description;
        this.price = Number(product.price);
        this.costPrice = Number(product.costPrice);
        this.categoryId = product.categoryId;
        this.brandId = product.brandId;
        this.supplierId = product.supplierId;
        this.imageUrl = product.imageUrl;
        this.active = product.active;
        this.createdAt = product.createdAt;
        this.updatedAt = product.updatedAt;

        this.category = product.category ? new ReturnCategoryDto(product.category) : undefined;
        this.brand = product.brand ? new ReturnBrandDto(product.brand) : undefined;
        this.supplier = product.supplier ? new ReturnSupplierDto(product.supplier) : undefined;
        this.stock = product.stock ? new ReturnStockDto(product.stock) : undefined;
        this.colors = (product.colors ?? []).map(c => new ReturnProductColorDto(c));
    }
}
