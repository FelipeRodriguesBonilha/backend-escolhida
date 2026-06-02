-- AlterTable
ALTER TABLE "Product" ADD COLUMN "inPromotion" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "promotionPrice" DECIMAL(10,2);
