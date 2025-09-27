import { PrismaClient, Role, User } from "@prisma/client";
import { Express } from "express";
import cloudinary from "../../config/cloudinary.config";
import { Restaurant } from "../../types/restaurant";
import RestaurantService from "../restaurant/restaurant.services";
import { resolve } from "path";
import { rejects } from "assert";

import { fullname } from "./account.controllers";

export class accountService {
  private prisma: PrismaClient;
  public restaurantId: string | null = null;
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

  async updateToRestaurantOwner(
    userId: string,
    fullname: fullname,
    information: Restaurant.information,
    price: Restaurant.price,
    time: Restaurant.time[],
    restaurantPictures: Express.Multer.File[],
    profilePicture: Express.Multer.File
  ) {
    const restaurant = await RestaurantService.createRestaurant(
      information,
      price,
      time,
      restaurantPictures,
      information.services || []
    );

    if (!restaurant || !restaurant.id) {
      throw Error("Create restaurant fail");
    }

    const profileUploadResult = await new Promise<any>((resolve, rejects) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "owner_profiles" },
        (error, result) => {
          if (error) rejects(error);
          else resolve(result);
        }
      );
      stream.end(profilePicture.buffer);
    });

    this.restaurantId = restaurant.id;

    const profileImageUrl = profileUploadResult.secure_url;
    const profilePublicId = profileUploadResult.public_id;

    await this.prisma.$transaction(async (tx) => {
      await tx.restaurantImage.create({
        data: {
          imageUrl: profileImageUrl,
          publicId: profilePublicId,
          profilePic: true,
          restaurantId: restaurant.id,
        },
      });

      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          firstName: fullname.firstName,
          lastName: fullname.lastName,
          role: Role.RestaurantOwner,
        },
      });

      await tx.restaurant.update({
        where: {
          id: restaurant.id,
        },
        data: {
          ownerId: userId,
        },
      });
    });
  }

  async updateRestaurantInfo(
    information: Restaurant.information,
    price: Restaurant.price,
    time: Restaurant.time[],
    fullname: fullname,
    id: string
  ) {
    const updateData = await this.prisma.$transaction(async (tx) => {
      //1. find restaurant id by owner id
      const restaurant = await tx.restaurant.findFirst({
        where: {
          ownerId: id,
        },
        select: {
          id: true,
        },
      });

      if (!restaurant || !restaurant.id) {
        throw Error("Restaurant not found for this owner");
      }
      //2. update user fullname
      await tx.restaurant.update({
        where: {
          id: restaurant?.id,
        },
        data: {
          //restaurant
          name: information.name,
          description: information.description,
          address: information.address,
          latitude: information.latitude,
          longitude: information.longitude,
          minPrice: price.minPrice,
          maxPrice: price.maxPrice,
          //user
          owner: {
            update: {
              firstName: fullname.firstName,
              lastName: fullname.lastName,
            },
          },
        },
      });

      //3. update opening hour
      // delete all and create new one
      await tx.openingHour.deleteMany({
        where: {
          restaurantId: restaurant?.id,
        },
      });

      await tx.openingHour.createMany({
        data: time.map((t) => ({
          weekday: t.weekday,
          openTime: t.openTime,
          closeTime: t.closeTime,
          restaurantId: restaurant?.id || "",
        })),
      });

      //4. update services
      // delete all and create new one
      await tx.restaurantService.deleteMany({
        where: {
          restaurantId: restaurant?.id,
        },
      });

      await tx.restaurantService.createMany({
        data: (information.services || []).map((serviceId) => ({
          restaurantId: restaurant?.id,
          serviceId: serviceId,
        })),
      });
    });
  }

  async getRestaurantByOwnerId(ownerId: string) {
    // if (!this.restaurantId) {
    //   return null;
    // }

    //find restaurant id form owner id
    const restaurantId = await this.prisma.restaurant.findFirst({
      where: {
        ownerId,
      },
      select: {
        id: true,
      },
    });

    //1. find restaurant id by owner id
    const information = await this.prisma.restaurant.findFirst({
      where: {
        id: restaurantId?.id,
      },
      select: {
        name: true,
        description: true,
        status: true,
        address: true,
        latitude: true,
        longitude: true,
        minPrice: true,
        maxPrice: true,
        images: {
          select: {
            id: true,
            imageUrl: true,
          },
        },
        openninghour: {
          take: 7,
          select: {
            weekday: true,
            openTime: true,
            closeTime: true,
          },
        },
        restaurantServices: {
          select: {
            service: {
              select: {
                service: true,
              },
            },
          },
        },
        contact: {
          select: {
            contactDetail: true,
            contactType: true,
          },
        },
      },
    });

    if (!information) {
      throw Error("Restaurant not found for this owner");
    }

    const restaurantInformation = {
      name: information.name,
      description: information.description,
      address: information.address,
      latitude: information.latitude,
      longitude: information.longitude,
      status: information.status,
      minPrice: information.minPrice,
      maxPrice: information.maxPrice,
      image: information.images.map((image) => {
        return { id: image.id, url: image.imageUrl };
      }),
      openingHour: information.openninghour.map((hour) => ({
        weekday: hour.weekday,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
      })),
      contact: {
        contactType: information.contact[0].contactType,
        contactDetail: information.contact[0].contactDetail,
      },
      services: information.restaurantServices.map(
        (service) => service.service.service
      ),
    };

    return restaurantInformation;
  }
}
