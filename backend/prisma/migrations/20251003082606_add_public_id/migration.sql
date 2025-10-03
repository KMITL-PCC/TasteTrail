/*
  Warnings:

  - Added the required column `public_id` to the `ReviewImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ReviewImage" ADD COLUMN     "public_id" VARCHAR(100) NOT NULL;
