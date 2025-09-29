import { PrismaClient, Prisma, RestaurantStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  //truncate all tables
  await prisma.$executeRaw`TRUNCATE TABLE "Category", "Service" RESTART IDENTITY CASCADE`;
  //insert to service delivery, QR, WIFI, alcohol
  const services = [
    { id: 1, service: "delivery" },
    { id: 2, service: "QR" },
    { id: 3, service: "WIFI" },
    { id: 4, service: "alcohol" },
  ];

  await prisma.service.createMany({
    data: services,
    skipDuplicates: true,
  });

  const categories = [
    { id: 1, name: "ร้านอาหารตามสั่ง" },
    { id: 2, name: "ร้านก๋วยเตี๋ยว" },
    { id: 3, name: "คาเฟ่" },
    { id: 4, name: "ร้านเครื่องดื่ม" },
    { id: 5, name: "ร้านของหวาน" },
    { id: 6, name: "ร้านของกินเล่น" },
    { id: 7, name: "อาหารฮาลาล" },
    { id: 8, name: "ร้านอาหารอีสาน" },
  ];

  await prisma.category.createMany({
    data: categories,
    skipDuplicates: true,
  });

  for (let i = 0; i < 10; i++) {
    // สร้าง Restaurant
    await prisma.$transaction(async (prisma) => {
      const restaurant = await prisma.restaurant.create({
        data: {
          name: faker.company.name(),
          description: faker.lorem.sentence(),
          address: faker.location.streetAddress(),
          latitude: new Prisma.Decimal(
            faker.location
              .latitude({
                max: 90,
                min: -90,
              })
              .toFixed(8)
          ),
          longitude: new Prisma.Decimal(
            faker.location
              .longitude({
                max: 180,
                min: -180,
              })
              .toFixed(8)
          ),
          status: faker.helpers.arrayElement([
            RestaurantStatus.Open,
            RestaurantStatus.Closed,
            RestaurantStatus.Temporarily_Closed,
          ]),
          minPrice: new Prisma.Decimal(faker.number.int({ min: 50, max: 200 })),
          maxPrice: new Prisma.Decimal(
            faker.number.int({ min: 300, max: 1000 })
          ),
        },
      });

      // Opening Hours (ทุกวันจันทร์-อาทิตย์)
      for (let weekday = 0; weekday < 7; weekday++) {
        await prisma.openingHour.create({
          data: {
            restaurantId: restaurant.id,
            weekday,
            openTime: "09:00",
            closeTime: "21:00",
          },
        });
      }

      // Restaurant Services (serviceId 1–4)
      const serviceIds = faker.helpers.arrayElements([1, 2, 3, 4], {
        min: 1,
        max: 4,
      });
      for (const serviceId of serviceIds) {
        await prisma.restaurantService.create({
          data: {
            restaurantId: restaurant.id,
            serviceId,
          },
        });
      }

      // Restaurant Categories (categoryId 1–8)
      const categoryIds = faker.helpers.arrayElements(
        [1, 2, 3, 4, 5, 6, 7, 8],
        {
          min: 1,
          max: 3,
        }
      );
      for (const categoryId of categoryIds) {
        await prisma.restaurantCategory.create({
          data: {
            restaurantId: restaurant.id,
            categoryId,
          },
        });
      }

      // Contact (phone 10 หลัก)
      await prisma.contact.create({
        data: {
          restaurantId: restaurant.id,
          contactType: "phone",
          contactDetail: faker.phone.number({ style: "human" }), // เช่น 0912345678
        },
      });

      console.log(`✅ Created restaurant ${restaurant.name}`);
    });
  }
}

(async () => {
  try {
    console.log("start seed");
    await main();
    console.log("seed succes");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error during seed ERROR: ", error.message);
    } else {
      console.error("Error during seed ERROR: ", error);
    }
  }
})();
