import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updateRestaurantStatus = async () => {
  console.time("updateRestaurantStatus");

  //1.get time now
  const now = new Date();
  const weekday = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  console.log(`Checking schedules for weekday ${weekday} at ${currentTime}`);

  //2. find restaurant schedule with ownerId null
  const schedules = await prisma.openingHour.findMany({
    where: {
      restaurant: {
        ownerId: null,
      },
      weekday,
    },
    include: {
      restaurant: {
        select: {
          status: true,
        },
      },
    },
  });

  //3. update restaurant status

  const restaurantsToOpen = [];
  const restaurantsToClose = [];

  console.log(schedules);
  for (const schedule of schedules) {
    const { openTime, closeTime, restaurantId, restaurant } = schedule;
    const shouldBeOpen = openTime <= currentTime && closeTime >= currentTime;

    if (shouldBeOpen && restaurant.status !== "Open") {
      restaurantsToOpen.push(restaurantId);
    } else if (!shouldBeOpen && restaurant.status !== "Closed") {
      restaurantsToClose.push(restaurantId);
    }
  }

  const updates = [];

  if (restaurantsToOpen.length > 0) {
    updates.push(
      prisma.restaurant.updateMany({
        where: { id: { in: restaurantsToOpen } },
        data: { status: "Open" },
      })
    );
  }

  if (restaurantsToClose.length > 0) {
    updates.push(
      prisma.restaurant.updateMany({
        where: { id: { in: restaurantsToClose } },
        data: { status: "Closed" },
      })
    );
  }

  await Promise.all(updates);
  console.timeEnd("updateRestaurantStatus");
};

updateRestaurantStatus();
// cron.schedule("*/2 * * * *", async () => {
//   await updateRestaurantStatus();
//   console.log("Restaurant status update task completed.");
//   parentPort?.postMessage("done");
// });
