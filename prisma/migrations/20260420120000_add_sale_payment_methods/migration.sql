-- CreateTable: SalePaymentMethod
CREATE TABLE "SalePaymentMethod" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "installments" INTEGER,
    "installmentValue" DECIMAL(10,2),

    CONSTRAINT "SalePaymentMethod_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SalePaymentMethod" ADD CONSTRAINT "SalePaymentMethod_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePaymentMethod" ADD CONSTRAINT "SalePaymentMethod_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DataMigration: migrate existing paymentMethodId data to SalePaymentMethod
INSERT INTO "SalePaymentMethod" ("id", "saleId", "paymentMethodId", "amount", "installments", "installmentValue")
SELECT
    gen_random_uuid()::text,
    s."id",
    s."paymentMethodId",
    s."amountPaid",
    s."installments",
    s."installmentValue"
FROM "Sale" s
WHERE s."paymentMethodId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_paymentMethodId_fkey";

-- AlterTable: remove old payment columns from Sale
ALTER TABLE "Sale"
    DROP COLUMN "paymentMethodId",
    DROP COLUMN "installments",
    DROP COLUMN "installmentValue";
