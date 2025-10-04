import { PrismaClient } from "@prisma/client";
import cloudinary from "../../config/cloudinary.config";
import { HttpError } from "../../utils/httpError.util";
import { sort } from "./review.controllers";

type orderBy = { createdAt?: "asc" | "desc" } | { rating?: "asc" | "desc" };

export class ReviewServices {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /*
   * input @date gtm+0 2025-10-03T09:52:48.624Z
   * output @string gmt+7 2025/10/04
   */
  private formatTime(inputDate: Date) {
    // Input ที่คุณให้มา (เวลา GMT+0)
    // const inputDate = new Date(time);

    // แปลงเป็นเวลาท้องถิ่นของประเทศไทย (GMT+7)
    const thaiTime = new Date(
      inputDate.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    );

    // จัดรูปแบบเป็น "YYYY/M/D"
    const year = thaiTime.getFullYear();
    const month = thaiTime.getMonth() + 1; // getMonth() เริ่มจาก 0
    const day = thaiTime.getDate();

    return `${year}/${month}/${day}`;
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
    let uploadedResults: { url: string; public_id: string }[] = [];

    try {
      if (pictures) {
        const uploadPromises = this.uploadImages(pictures);
        uploadedResults = await Promise.all(uploadPromises);
      }
      //1.upload images

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
      });
    } catch (error) {
      if (uploadedResults.length > 0) {
        await Promise.allSettled(
          uploadedResults.map((img) =>
            cloudinary.uploader.destroy(img.public_id)
          )
        );
      }

      if (error instanceof HttpError) {
        throw error; // preserve HttpError
      }

      throw new Error(`error during create review service Error: ${error}`);
    }
  }

  async get(page: number, limit: number, restaurantId: string, sort: sort) {
    //1. create sort
    let orderBy: orderBy = { createdAt: "asc" }; // default = เก่าสุด

    switch (sort) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "highest":
        orderBy = { rating: "desc" };
        break;
      case "lowest":
        orderBy = { rating: "asc" };
        break;
    }

    //2. pagination
    const offset = (page - 1) * limit;

    //3. query review
    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: {
          restaurantId,
        },
        orderBy,
        skip: offset,
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
      }),
      this.prisma.review.count({
        where: {
          restaurantId,
        },
      }),
    ]);

    //4. map review
    const reviewMap = reviews.map((review) => ({
      id: review.id,
      user: {
        name: review.user.username,
        avatar: review.user.profilePictureUrl,
      },
      rating: review.rating,
      date: this.formatTime(review.createdAt),
      Images: review.images.map((images) => images.imageUrl),
    }));

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      reviews: reviewMap,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalReviews: total,
        limit: limit,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
      },
    };
  }
}
