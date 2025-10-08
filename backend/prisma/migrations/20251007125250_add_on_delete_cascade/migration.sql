-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Contact" DROP CONSTRAINT "Contact_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OpeningHour" DROP CONSTRAINT "OpeningHour_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RestaurantCategories" DROP CONSTRAINT "RestaurantCategories_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."RestaurantImage" DROP CONSTRAINT "RestaurantImage_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."RestaurantService" DROP CONSTRAINT "RestaurantService_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_user_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpeningHour" ADD CONSTRAINT "OpeningHour_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("restaurant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RestaurantService" ADD CONSTRAINT "RestaurantService_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."Restaurant"("restaurant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RestaurantImage" ADD CONSTRAINT "RestaurantImage_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."Restaurant"("restaurant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RestaurantCategories" ADD CONSTRAINT "RestaurantCategories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."Restaurant"("restaurant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."Restaurant"("restaurant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("restaurant_id") ON DELETE CASCADE ON UPDATE CASCADE;
