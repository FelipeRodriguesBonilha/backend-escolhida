-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "showInCatalog" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "showInCatalog" BOOLEAN NOT NULL DEFAULT false;
