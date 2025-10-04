-- DropForeignKey
ALTER TABLE "public"."ReviewImage" DROP CONSTRAINT "ReviewImage_review_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."ReviewImage" ADD CONSTRAINT "ReviewImage_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."Review"("review_id") ON DELETE CASCADE ON UPDATE CASCADE;
