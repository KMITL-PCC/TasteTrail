import { PrismaClient } from "@prisma/client";
import { Express } from "express";
import cloudinary from "../../config/cloudinary.config";
import { resolve } from "path";
import { rejects } from "assert";

export class accountService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async updateUsername(
    userId: string,
    newUsername: string
  ): Promise<Express.User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { username: newUsername },
      select: {
        id: true,
        role: true,
      },
    });
  }

  async updateProfile(userId: string, picture: Express.Multer.File) {
    try {
      //1. find picture public id
      const oldUser = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          profilePictureUrlPublicId: true,
        },
      });

      //2. upload pic to cloudinary
      const uploadResult = await new Promise<any>((resolve, rejects) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "user_profiles",
            public_id:
              oldUser?.profilePictureUrlPublicId?.split("/")[1] || undefined,
            overwrite: true,
          },
          (error, result) => {
            if (error) rejects(error);
            else resolve(result);
          }
        );

        stream.end(picture.buffer);
      });

      console.log(uploadResult);
      const imageUrl = uploadResult.secure_url;
      const publicId = uploadResult.public_id;
      console.log("public id is " + publicId);

      //3. save to db
      const updateUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePictureUrl: imageUrl,
          profilePictureUrlPublicId: publicId,
        },
        select: {
          username: true,
        },
      });

      return updateUser;
    } catch (error) {
      console.error("Failed to update profile picture", error);
      if ((error as any).meta?.cause?.includes("DB")) {
        if ((error as any).public_id) {
          await cloudinary.uploader.destroy((error as any).public_id);
        }
      }

      throw new Error("Failed to update profile picture Error");
    }
  }
}
