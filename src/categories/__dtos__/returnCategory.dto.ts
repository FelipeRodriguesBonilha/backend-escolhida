import { Category } from "src/generated/prisma/client";

export class ReturnCategoryDto {
    id: string;
    name: string;
    active: boolean;
    showInCatalog: boolean;
    createdAt: Date;

    constructor(category: Category) {
        this.id = category.id;
        this.name = category.name;
        this.active = category.active;
        this.showInCatalog = category.showInCatalog;
        this.createdAt = category.createdAt;
    }
}
