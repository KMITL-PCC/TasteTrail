import { Request, Response, NextFunction } from "express";

import { Restaurant } from "../../types/restaurant";
import restaurantServices from "./restaurant.services";

function validateNestedFields(obj: any, requiredFields: string[]): string[] {
  return requiredFields.filter((field) => !obj?.[field]);
}

export default {
  createRestaurant: async (req: Request, res: Response, next: NextFunction) => {
    //info :     {
    // information: {
    //        "name",
    //       "description",
    //       "address",
    //       "latitude",
    //       "longitude",
    //       "services": [1,2,3,4]
    // },
    // price: {
    //       "minPrice",
    //       "maxPrice"
    // },
    // time : {
    //       "weekday",
    //       "openTime",
    //       "closeTime"
    // }
    // }
    const { information, price, time, services } = JSON.parse(req.body.info);
    const pictures = req.files as Express.Multer.File[];

    const missingInfo = validateNestedFields(information, [
      "name",
      "description",
      "address",
      // "latitude",
      // "longitude",
    ]);
    const missingPrice = validateNestedFields(price, ["minPrice", "maxPrice"]);
    const missingTime = validateNestedFields(time, [
      "weekday",
      "openTime",
      "closeTime",
    ]);

    if (!missingInfo || !missingPrice || !missingTime || !pictures) {
      return res.status(400).json({ message: "Missing data" });
    }

    try {
      const result = await restaurantServices.createRestaurant(
        information,
        price,
        time,
        pictures,
        services
      );

      if (!result) {
        return res.status(500).json({
          message: "Error during create restaurant",
        });
      }
      res.status(201).json({
        message: "create success",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error during create restaurant ERROR:", error.message);
      } else {
        console.error("Error during create restaurant ERROR:", error);
      }

      res.status(500).json({
        message: "Error during create restaurant",
      });
    }
  },

  getRestaurants: async (req: Request, res: Response, next: NextFunction) => {
    const queryRating = Number(req.query.rating);
    const pricerateQuery = req.query.priceRate as string;

    const priceRate = ["40", "40-100", "100"].includes(pricerateQuery)
      ? pricerateQuery
      : "";

    const rating = [2, 4].includes(queryRating) ? queryRating : 0;

    const data: Restaurant.query = {
      limit: Number(req.query.limit) || 20,
      page: Number(req.query.page) || 1,
      category: (req.query.category as string) || "",
      sort: (req.query.sort as string) || "desc",
      sortBy: (req.query.sortBy as string) || "avgRating",
      search: (req.query.search as string) || "",
      rating,
      priceRate,
    };

    try {
      const { restaurant, totalPages, currentPage, itemPerPage } =
        await restaurantServices.getRestaurants(data as Restaurant.query);

      res.status(200).json({
        restaurant: restaurant,
        pagination: {
          totalPages,
          currentPage,
          itemPerPage,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error during get restaurants ERROR:", error.message);
      } else {
        console.error("Error during get restaurants ERROR:", error);
      }
      res.status(500).json({
        message: "Server error during get restaurants",
      });
    }
  },

  getInformation: async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        message: "missing ID",
      });
    }

    try {
      const restaurantInfo = await restaurantServices.Information(id);
      if (!restaurantInfo) {
        return res.status(400).json({
          message: "Can't find restaurant",
        });
      }

      res.status(200).json({
        message: "ok",
        restaurantInfo,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          "Error during get restaurant infomation ERROR:",
          error.message
        );
      } else {
        console.error("Error during get restaurant infomation ERROR:", error);
      }
      res.status(500).json({
        message: "Error during get restaurant infomation",
      });
    }
  },
};
