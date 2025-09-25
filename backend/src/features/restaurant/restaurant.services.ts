import { equal, rejects } from "assert";

import cloudinary from "../../config/cloudinary.config";
import prisma from "../../config/db.config";
import { Restaurant } from "../../types/restaurant";
import { error } from "console";

const weekArrayFromat = (openninghour: Restaurant.time[]) => {
  const day = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];
  const firstday = day[openninghour[0].weekday];
  const lastday = day[openninghour[openninghour.length - 1].weekday];
  return {
    day: `${firstday} - ${lastday}`,
    time: `${openninghour[0].openTime} - ${openninghour[0].closeTime}`,
  };
};

export default {
  getRestaurants: async (data: Restaurant.query) => {
    const { limit, page, category, sort, sortBy, search, rating, priceRate } =
      data;

    const offset = (page - 1) * limit;

    let whereClause: any = {};

    //1. search field
    if (search !== "") {
      whereClause.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    //2. category field
    if (category !== "") {
      const categories = (category as string).split(",").map((c) => c.trim());
      whereClause.AND = categories.map((cate) => ({
        categories: {
          some: {
            category: {
              name: {
                equals: cate,
                mode: "insensitive",
              },
            },
          },
        },
      }));
    }

    console.log(JSON.stringify(whereClause, null, 2));
    //3. sort field
    const orderBy: any = {};
    const sortField = sortBy || "avgRating";
    const sortOrder = (sort as "asc" | "desc") || "desc";
    orderBy[sortField] = sortOrder;

    //4. rating
    if (rating !== 0) {
      whereClause.avgRating = {
        gte: rating,
      };
    }

    //5. price rate
    if (priceRate !== "") {
      let price;
      if (priceRate === "40") {
        price = {
          lte: 40,
        };
      } else if (priceRate === "40-100") {
        price = {
          gte: 40,
          lte: 100,
        };
      } else {
        price = {
          gte: 100,
        };
      }
      whereClause.minPrice = {
        ...price,
      };
    }

    //6. query database
    const restaurantInfo = await prisma.restaurant.findMany({
      skip: offset,
      take: limit,
      where: whereClause,
      orderBy,
      select: {
        id: true,
        name: true,
        totalReviews: true,
        avgRating: true,
        status: true,
        categories: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        images: {
          select: {
            imageUrl: true,
          },
        },
      },
    });

    //7. find total
    const total = await prisma.restaurant.count({
      where: whereClause,
    });

    //8. map data
    const restaurant = restaurantInfo.map((data) => {
      return {
        id: data.id,
        name: data.name,
        totalReviews: data.totalReviews,
        avgRating: data.avgRating,
        status: data.status,
        categories: data.categories.map((cate) => cate.category.name),
        images: data.images.map((image) => image.imageUrl),
      };
    });

    console.log(restaurant);
    return {
      restaurant: restaurant,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      itemPerPage: limit,
    };
  },

  createRestaurant: async (
    information: Restaurant.information,
    price: Restaurant.price,
    time: any,
    pictures: Express.Multer.File[],
    services: any
  ) => {
    //0. map open hour
    const availableTime: Restaurant.time[] = [];
    const [start, stop] = time.weekday.split("-").map(Number);

    for (let i = start; i < stop + 1; i++) {
      availableTime.push({
        weekday: i,
        openTime: time.openTime,
        closeTime: time.closeTime,
      });
    }

    // const uploadedResults: { url: string; public_id: string }[] = [];

    // //1. upload picture to cloud
    // for (const pic of pictures) {
    //   const result = await new Promise<any>((resolve, reject) => {
    //     const stream = cloudinary.uploader.upload_stream(
    //       { resource_type: "image" },
    //       (error, result) => {
    //         if (error) reject(error);
    //         else resolve(result);
    //       }
    //     );
    //     stream.end(pic.buffer);
    //   });
    //   uploadedResults.push({
    //     url: result.secure_url,
    //     public_id: result.public_id,
    //   });
    // }

    const uploadPromises = pictures.map((pic) => {
      return new Promise<{ url: string; public_id: string }>(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, result: any) => {
              if (error) reject(error);
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
              });
            }
          );
          stream.end(pic.buffer);
        }
      );
    });

    const uploadedResults: { url: string; public_id: string }[] = [];

    try {
      uploadedResults.push(...(await Promise.all(uploadPromises)));
      console.log(uploadedResults);
      const restaurant = await prisma.$transaction(async (tx) => {
        //2. create restaurant
        const newRestaurant = await tx.restaurant.create({
          data: {
            name: information.name,
            description: information.description,
            address: information.address,
            minPrice: price.minPrice,
            maxPrice: price.maxPrice,
            contact: {
              create: {
                contactType: "phone",
                contactDetail: "0868225445",
              },
            },
          },
        });

        //3. create open hour time
        await tx.openingHour.createMany({
          data: availableTime.map((t) => ({
            weekday: t.weekday,
            openTime: t.openTime,
            closeTime: t.closeTime,
            restaurantId: newRestaurant.id,
          })),
        });

        //4. save image url on db
        await tx.restaurantImage.createMany({
          data: uploadedResults.map((img) => ({
            restaurantId: newRestaurant.id,
            imageUrl: img.url,
            publicId: img.public_id,
          })),
        });
      });

      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error during create restaurant ERROR:", error.message);
      } else {
        console.log("Error during create restaurant ERROR:", error);
      }

      for (const img of uploadedResults) {
        await cloudinary.uploader.destroy(img.public_id);
      }

      return false;
    }
  },

  Information: async (id: string) => {
    //1. query restaurant data
    const information = await prisma.restaurant.findFirst({
      where: {
        id,
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
      return false;
    }

    //2. map open hour
    const openingHour = weekArrayFromat(
      information?.openninghour as Restaurant.time[]
    );

    //map all data
    const restaurantInformation = {
      name: information.name,
      description: information.description,
      address: information.address,
      latitude: information.latitude,
      longitude: information.longitude,
      status: information.status,
      minPrice: information.minPrice,
      maxPrice: information.maxPrice,
      image: information.images.map((image) => image.imageUrl),
      openingHour,
      contact: {
        contactType: information.contact[0].contactType,
        contactDetail: information.contact[0].contactDetail,
      },
      services: information.restaurantServices.map(
        (service) => service.service.service
      ),
    };

    return restaurantInformation;
  },
};
