ALTER TABLE "ProductColor" RENAME TO "ProductVariation";
ALTER INDEX "ProductColor_pkey" RENAME TO "ProductVariation_pkey";
ALTER INDEX "ProductColor_barcode_key" RENAME TO "ProductVariation_barcode_key";
ALTER TABLE "ProductVariation" RENAME CONSTRAINT "ProductColor_productId_fkey" TO "ProductVariation_productId_fkey";
