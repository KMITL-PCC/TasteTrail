import { PrismaClient, Role, User, RestaurantStatus } from "@prisma/client";
import { Express } from "express";
import cloudinary from "../../config/cloudinary.config";
import { Restaurant } from "../../types/restaurant";
import RestaurantService from "../restaurant/restaurant.services";
import { resolve } from "path";
import { rejects } from "assert";

import { fullname, updateRestaurantImages } from "./account.controllers";

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
    profilePicture: Express.Multer.File,
    category: string[]
  ) {
    const restaurant = await RestaurantService.createRestaurant(
      information,
      price,
      time,
      restaurantPictures,
      information.services || [],
      category
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
    id: string,
    images: updateRestaurantImages,
    categories: string[]
  ) {
    //0. update restaurant information
    const updateData = await this.prisma.$transaction(async (tx) => {
      const categoryData = [
        { id: 1, name: "ร้านอาหารตามสั่ง" },
        { id: 2, name: "ร้านก๋วยเตี๋ยว" },
        { id: 3, name: "คาเฟ่" },
        { id: 4, name: "ร้านเครื่องดื่ม" },
        { id: 5, name: "ร้านของหวาน" },
        { id: 6, name: "ร้านของกินเล่น" },
        { id: 7, name: "อาหารฮาลาล" },
        { id: 8, name: "ร้านอาหารอีสาน" },
      ];

      console.log("category: ", categories);
      const categoryIds = categoryData
        .filter((c) => categories.includes(c.name))
        .map((c) => c.id);

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
          contact: {
            updateMany: {
              where: {
                restaurantId: restaurant?.id,
                contactType: "phone",
              },
              data: {
                contactDetail: information.contactDetail,
              },
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

      //5. delete all category and create new one
      await tx.restaurantCategory.deleteMany({
        where: {
          restaurantId: restaurant?.id,
        },
      });

      await tx.restaurantCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          restaurantId: restaurant?.id,
          categoryId: categoryId,
        })),
      });
    });

    // console.log(images.profilePicture);
    //5. update owner images
    if (images.profilePicture) {
      const profileId = await this.prisma.restaurantImage.findFirst({
        where: {
          restaurant: { ownerId: id },
          profilePic: true,
        },
        select: {
          id: true,
          publicId: true,
        },
      });

      const profileUploadResult = await new Promise<any>((resolve, rejects) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "restaurant_profiles",
            public_id: profileId?.publicId?.split("/")[1] || undefined,
            overwrite: true,
          },
          (error, result) => {
            if (error) rejects(error);
            else resolve(result);
          }
        );
        stream.end(images.profilePicture.buffer);
      });

      await this.prisma.restaurantImage.update({
        where: {
          id: profileId?.id || 0,
        },
        data: {
          imageUrl: profileUploadResult.secure_url,
          publicId: profileUploadResult.public_id,
        },
      });
    }

    //6. update restaurant images
    if (images.restaurantPictures.images.length > 0) {
      //find old pic from image id
      const oldImages = await this.prisma.restaurantImage.findMany({
        where: {
          id: { in: images.restaurantPictures.updateImageIds },
        },
        select: {
          id: true,
          publicId: true,
        },
      });

      //upload many pic to cloudinary overwrite public id
      const uploadPromises = oldImages.map((image, index) => {
        return new Promise<any>((resolve, rejects) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "restaurant_images",
              public_id: image.publicId?.split("/")[1] || undefined,
              overwrite: true,
            },
            (error, result) => {
              if (error) rejects(error);
              else resolve(result);
            }
          );
          stream.end(images.restaurantPictures.images[index].buffer);
        });
      });

      const uploadResults = await Promise.all(uploadPromises);

      await Promise.all(
        uploadResults.map((result, index) =>
          this.prisma.restaurantImage.update({
            where: { id: oldImages[index].id },
            data: {
              imageUrl: result.secure_url,
              publicId: result.public_id,
            },
          })
        )
      );
    }
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
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        name: true,
        description: true,
        status: true,
        address: true,
        latitude: true,
        longitude: true,
        minPrice: true,
        maxPrice: true,
        images: {
          where: {
            profilePic: false,
          },
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
        categories: {
          select: {
            category: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!information) {
      throw Error("Restaurant not found for this owner");
    }

    const profileImage = await this.prisma.restaurantImage.findFirst({
      where: {
        restaurant: { id: restaurantId?.id },
        profilePic: true,
      },
      select: {
        id: true,
        imageUrl: true,
      },
    });

    const restaurantInformation = {
      fullname: {
        firstName: information.owner?.firstName,
        lastName: information.owner?.lastName,
      },
      name: information.name,
      description: information.description,
      address: information.address,
      latitude: information.latitude,
      longitude: information.longitude,
      status: information.status,
      minPrice: information.minPrice,
      maxPrice: information.maxPrice,
      image: {
        restaurantImages: information.images.map((image) => {
          return { id: image.id, url: image.imageUrl };
        }),
        profileImage: profileImage
          ? { id: profileImage.id, url: profileImage.imageUrl }
          : null,
      },
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
      category: information.categories.map((c) => c.category.name),
    };

    return restaurantInformation;
  }

  async updateRestaurantStatus(ownerId: string, status: RestaurantStatus) {
    //1. find restaurant id by owner id
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        ownerId,
      },
      select: {
        id: true,
      },
    });
    if (!restaurant || !restaurant.id) {
      throw Error("Restaurant not found for this owner");
    }

    //2. update status
    const updated = await this.prisma.restaurant.update({
      where: {
        id: restaurant.id,
      },
      data: {
        status,
      },
    });

    return updated.status;
  }
}
