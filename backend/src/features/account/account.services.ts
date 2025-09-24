import { PrismaClient } from "@prisma/client";
import { Express } from "express";
import cloudinary from "../../config/cloudinary.config";

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
      //1. upload pic to cloudinary
      const uploadResult = await cloudinary.uploader.upload(picture.path, {
        folder: "user_profiles",
      });

      const imageUrl = uploadResult.secure_url;
      const publicId = uploadResult.public_id;

      //2. save to db
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
      if ((error as any).meta?.cause?.includes("DB")) {
        if ((error as any).public_id) {
          await cloudinary.uploader.destroy((error as any).public_id);
        }
      }

      throw new Error("Failed to update profile picture");
    }
  }
}
