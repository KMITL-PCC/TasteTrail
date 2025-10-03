/*
  Warnings:

  - Made the column `description` on table `Restaurant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Restaurant" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;
