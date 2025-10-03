/*
  Warnings:

  - Added the required column `max_price` to the `Restaurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `min_price` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Restaurant" ADD COLUMN     "max_price" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "min_price" DECIMAL(65,30) NOT NULL;

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" SERIAL NOT NULL,
    "service" VARCHAR(50) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RestaurantService" (
    "restaurant_id" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "RestaurantService_pkey" PRIMARY KEY ("restaurant_id","serviceId")
);

-- AddForeignKey
ALTER TABLE "public"."RestaurantService" ADD CONSTRAINT "RestaurantService_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."Restaurant"("restaurant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RestaurantService" ADD CONSTRAINT "RestaurantService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
