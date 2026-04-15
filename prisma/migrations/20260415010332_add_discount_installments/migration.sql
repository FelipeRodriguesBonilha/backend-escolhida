/*
  Warnings:

  - Added the required column `finalTotal` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "finalTotal" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "installments" INTEGER;
