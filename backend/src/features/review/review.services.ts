import { PrismaClient } from "@prisma/client";
import cloudinary from "../../config/cloudinary.config";
import { HttpError } from "../../utils/httpError.util";

export class ReviewServices {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private uploadImages(pictures: Express.Multer.File[]) {
    const uploadPromises = pictures.map(
      (pic) =>
        new Promise<{ url: string; public_id: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "image", folder: "review_images" },
            (error, result: any) => {
              if (error) return reject(error);
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
              });
            }
          );
          stream.end(pic.buffer);
        })
    );

    return uploadPromises;
  }

  async create(
    userId: string,
    restaurantId: string,
    rating: number,
    review: string,
    pictures: Express.Multer.File[]
  ) {
    const uploadPromises = this.uploadImages(pictures);
    let uploadedResults: { url: string; public_id: string }[] = [];
    try {
      //1.upload images
      uploadedResults = await Promise.all(uploadPromises);

      const result = await this.prisma.$transaction(async (tx) => {
        //2.check if user exist review
        const existingReview = await tx.review.findFirst({
          where: {
            AND: [{ userId }, { restaurantId }],
          },
        });

        if (existingReview) {
          throw new HttpError(400, "You have already reviewed this restaurant");
        }

        //3.create review
        const newReview = await tx.review.create({
          data: {
            userId,
            restaurantId,
            rating,
            reviewText: review,
            images: {
              createMany: {
                data: uploadedResults.map((img) => ({
                  imageUrl: img.url,
                  publicId: img.public_id,
                })),
              },
            },
          },
        });

        //4. get avg and total review
        const stats = await tx.review.aggregate({
          where: { restaurantId },
          _avg: { rating: true },
          _count: { id: true },
        });

        //5. update to restaurant
        await tx.restaurant.update({
          where: { id: restaurantId },
          data: {
            avgRating: stats._avg.rating || 0,
            totalReviews: stats._count.id,
          },
        });

        return newReview;
      });
    } catch (error) {
      if (uploadedResults.length > 0) {
        await Promise.allSettled(
          uploadedResults.map((img) =>
            cloudinary.uploader.destroy(img.public_id)
          )
        );
        throw new Error(`error during create review service Error: ${error}`);
      }
    }
  }

  async get(page: number, limit: number, restaurantId: any) {
    const reviews = await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.findMany({
        where: {
          restaurantId,
        },
        select: {
          id: true,
          rating: true,
          reviewText: true,
          createdAt: true,
          user: {
            select: {
              username: true,
              profilePictureUrl: true,
            },
          },
          images: {
            select: {
              imageUrl: true,
            },
          },
        },
      });

      return review;
    });

    return reviews;
  }
}
