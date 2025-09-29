/*
  Warnings:

  - The values [Temporarily Closed] on the enum `RestaurantStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `data` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `contact_id` on the `Restaurant` table. All the data in the column will be lost.
  - You are about to drop the column `opening_hours` on the `Restaurant` table. All the data in the column will be lost.
  - You are about to drop the column `google_id` on the `User` table. All the data in the column will be lost.
  - Added the required column `contact_detail` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurantId` to the `Contact` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."RestaurantStatus_new" AS ENUM ('Open', 'Closed', 'Temporarily_Closed');
ALTER TABLE "public"."Restaurant" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Restaurant" ALTER COLUMN "status" TYPE "public"."RestaurantStatus_new" USING ("status"::text::"public"."RestaurantStatus_new");
ALTER TYPE "public"."RestaurantStatus" RENAME TO "RestaurantStatus_old";
ALTER TYPE "public"."RestaurantStatus_new" RENAME TO "RestaurantStatus";
DROP TYPE "public"."RestaurantStatus_old";
ALTER TABLE "public"."Restaurant" ALTER COLUMN "status" SET DEFAULT 'Open';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Restaurant" DROP CONSTRAINT "Restaurant_contact_id_fkey";

-- DropIndex
DROP INDEX "public"."Restaurant_contact_id_key";

-- DropIndex
DROP INDEX "public"."User_google_id_key";

-- AlterTable
ALTER TABLE "public"."Contact" DROP COLUMN "data",
ADD COLUMN     "contact_detail" VARCHAR(50) NOT NULL,
ADD COLUMN     "restaurantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Restaurant" DROP COLUMN "contact_id",
DROP COLUMN "opening_hours",
ALTER COLUMN "avg_rating" SET DATA TYPE DECIMAL(3,2);

-- AlterTable
ALTER TABLE "public"."Review" ALTER COLUMN "rating" SET DATA TYPE DECIMAL(3,2);

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "google_id";

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpeningHour" (
    "id" SERIAL NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,

    CONSTRAINT "OpeningHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerId_key" ON "public"."Account"("provider", "providerId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpeningHour" ADD CONSTRAINT "OpeningHour_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("restaurant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("restaurant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
