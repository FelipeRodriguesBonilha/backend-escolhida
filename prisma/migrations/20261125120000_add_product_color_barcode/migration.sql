ALTER TABLE "ProductColor"
ADD COLUMN "barcode" TEXT;

CREATE UNIQUE INDEX "ProductColor_barcode_key" ON "ProductColor"("barcode");
