import { Product, Category, Brand, Supplier, Stock, ProductVariation, ProductImage } from "src/generated/prisma/client";
import { ReturnBrandDto } from "src/brands/__dtos__/returnBrand.dto";
import { ReturnCategoryDto } from "src/categories/__dtos__/returnCategory.dto";
import { ReturnSupplierDto } from "src/suppliers/__dtos__/returnSupplier.dto";
import { ReturnStockDto } from "src/stock/__dtos__/returnStock.dto";

export class ReturnProductImageDto {
    id: string;
    productId: string;
    url: string;
    order: number;
    createdAt: Date;

    constructor(image: ProductImage) {
        this.id = image.id;
        this.productId = image.productId;
        this.url = image.url;
        this.order = image.order;
        this.createdAt = image.createdAt;
    }
}

export class ReturnProductVariationDto {
    id: string;
    productId: string;
    name: string;
    barcode: string | null;
    colorCode: string | null;
    imageUrl: string | null;
    order: number;
    createdAt: Date;

    constructor(variation: ProductVariation) {
        this.id = variation.id;
        this.productId = variation.productId;
        this.name = variation.name;
        this.barcode = variation.barcode;
        this.colorCode = variation.colorCode;
        this.imageUrl = variation.imageUrl;
        this.order = variation.order;
        this.createdAt = variation.createdAt;
    }
}

export class ReturnProductDto {
    id: string;
    name: string;
    barcode: string | null;
    description: string | null;
    price: number;
    costPrice: number;
    inPromotion: boolean;
    promotionPrice: number | null;
    effectivePrice: number;
    isNew: boolean;
    categoryId: string;
    brandId: string | null;
    supplierId: string | null;
    supplierCode: string | null;
    imageUrl: string | null;
    expirationDate: Date | null;
    active: boolean;
    showInCatalog: boolean;
    createdAt: Date;
    updatedAt: Date;
    category?: ReturnCategoryDto;
    brand?: ReturnBrandDto;
    supplier?: ReturnSupplierDto;
    stock?: ReturnStockDto;
    variations: ReturnProductVariationDto[];
    images: ReturnProductImageDto[];

    constructor(product: Product & { 
        category?: Category | null; 
        brand?: Brand | null; 
        supplier?: Supplier | null; 
        stock?: Stock | null;
        variations?: ProductVariation[];
        images?: ProductImage[];
    }) {
        this.id = product.id;
        this.name = product.name;
        this.barcode = product.barcode;
        this.description = product.description;
        this.price = Number(product.price);
        this.costPrice = Number(product.costPrice);
        this.inPromotion = product.inPromotion;
        this.promotionPrice = product.promotionPrice ? Number(product.promotionPrice) : null;
        this.effectivePrice = this.inPromotion && this.promotionPrice ? this.promotionPrice : this.price;
        this.isNew = product.isNew;
        this.categoryId = product.categoryId;
        this.brandId = product.brandId;
        this.supplierId = product.supplierId;
        this.supplierCode = product.supplierCode;
        this.imageUrl = product.imageUrl;
        this.expirationDate = product.expirationDate;
        this.active = product.active;
        this.showInCatalog = product.showInCatalog;
        this.createdAt = product.createdAt;
        this.updatedAt = product.updatedAt;

        this.category = product.category ? new ReturnCategoryDto(product.category) : undefined;
        this.brand = product.brand ? new ReturnBrandDto(product.brand) : undefined;
        this.supplier = product.supplier ? new ReturnSupplierDto(product.supplier) : undefined;
        this.stock = product.stock ? new ReturnStockDto(product.stock) : undefined;
        this.variations = (product.variations ?? []).map(c => new ReturnProductVariationDto(c));
        this.images = (product.images ?? []).map(i => new ReturnProductImageDto(i));
    }
}
