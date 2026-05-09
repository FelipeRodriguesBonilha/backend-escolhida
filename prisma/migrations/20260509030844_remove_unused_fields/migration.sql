/*
  Warnings:

  - You are about to drop the column `difference` on the `CashRegister` table. All the data in the column will be lost.
  - You are about to drop the column `expectedAmount` on the `CashRegister` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CashRegister" DROP COLUMN "difference",
DROP COLUMN "expectedAmount";
