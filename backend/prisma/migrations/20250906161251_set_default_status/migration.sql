/*
  Warnings:

  - You are about to alter the column `max_price` on the `Restaurant` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - You are about to alter the column `min_price` on the `Restaurant` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.

*/
-- AlterTable
ALTER TABLE "public"."Restaurant" ALTER COLUMN "status" SET DEFAULT 'Temporarily_Closed',
ALTER COLUMN "max_price" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "min_price" SET DATA TYPE DECIMAL(5,2);
