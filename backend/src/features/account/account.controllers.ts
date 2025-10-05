import { Role, User, RestaurantStatus } from "@prisma/client";
import { Restaurant } from "../../types/restaurant";
import { Request, Response, NextFunction } from "express";
import { accountService } from "./account.services";

export type fullname = {
  firstName: string;
  lastName: string;
};

export type updateRestaurantImages = {
  profilePicture: Express.Multer.File;
  restaurantPictures: {
    images: Express.Multer.File[];
    updateImageIds: number[];
  };
};

export class accountController {
  private service: accountService;

  constructor(service: accountService) {
    this.service = service;
  }

  updateProfile = async (req: Request, res: Response) => {
    const user = req.user as User;
    const newUsername = req.body.username as string;
    const profilePicture = req.file;

    if (!user || !(newUsername || profilePicture)) {
      return res.status(400).json({
        message: "missing data",
      });
    }
    try {
      if (newUsername) {
        await this.service.updateUsername(user.id, newUsername);
      }

      if (profilePicture) {
        await this.service.updateProfile(user.id, profilePicture);
      }

      res.status(200).json({
        message: "update success",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Error during update user profile ERROR:", error.message);
      } else {
        console.log("Error during update user profile ERROR:", error);
      }

      res.status(500).json({
        message: "Error during update user profile",
      });
    }
  };

  updateToRestaurantOwner = async (req: Request, res: Response) => {
    // {
    //fullname : {
    // firstName,
    // lastName
    //},
    // information: {
    //       "name",
    //       "description",
    //       "address",
    //       "latitude": number,
    //       "longitude": number,
    //       "services": [1,2,3,4] //delivery,QR, WIFI, alcohol,
    //       "contactDetail": ""
    // },
    // price: {
    //       "minPrice",
    //       "maxPrice"
    // },
    // time : [{
    //       "weekday" : 0, 0 = sun, 6= saturday
    //       "openTime",
    //       "closeTime"
    // },{
    //       "weekday" : 0, 0 = sun, 6= saturday
    //       "openTime",
    //       "closeTime"
    // }
    // ],
    // }

    //5 pic
    //4 for Restaurant page and 1 for Owner selfie picture
    const user = req.user as User;
    const id = user.id;

    const requiredFields = [
      "information",
      "price",
      "time",
      "fullname",
      "category",
    ];
    const missing = requiredFields.filter(
      (field) => !req.body[field] && req.body[field] === null
    );

    if (missing.length > 0) {
      return res.status(400).json({
        message: "missing files or invalid role",
      });
    }

    try {
      const files = req.files as {
        profileImage: Express.Multer.File[];
        restaurantImages: Express.Multer.File[];
      };

      const profilePicture = files.profileImage[0] as Express.Multer.File;
      const restaurantPictures = files.restaurantImages;

      const information = JSON.parse(
        req.body.information
      ) as Restaurant.information;
      const price = JSON.parse(req.body.price) as Restaurant.price;
      const time = JSON.parse(req.body.time) as Restaurant.time[];
      const fullname = JSON.parse(req.body.fullname) as fullname;
      const category = JSON.parse(req.body.category) as string[];

      await this.service.updateToRestaurantOwner(
        id,
        fullname,
        information,
        price,
        time,
        restaurantPictures,
        profilePicture,
        category
      );

      return res.status(200).json({
        message: "Successfully updated to restaurant owner",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          "Error during update user restaurant ERROR:",
          error.message
        );
      } else {
        console.error("Error during update user ERROR:", error);
      }

      res.status(500).json({
        message: "Error during update user restaurant ",
      });
    }
  };

  updateRestaurantInfo = async (req: Request, res: Response) => {
    // {
    //fullname : {
    // firstName,
    // lastName
    //},
    // information: {
    //       "name",
    //       "description",
    //       "address",
    //       "latitude": number,
    //       "longitude": number,
    //       "services": [1,2,3,4] //delivery,QR, WIFI, alcohol,
    //       "contactDetail": ""
    // },
    // price: {
    //       "minPrice",
    //       "maxPrice"
    // },
    // time : [{
    //       "weekday" : 0, 0 = sun, 6= saturday
    //       "openTime",
    //       "closeTime"
    // },{
    //       "weekday" : 0, 0 = sun, 6= saturday
    //       "openTime",
    //       "closeTime"
    // }
    // ],
    // }

    //5 pic
    //4 for Restaurant page and 1 for Owner selfie picture

    const user = req.user as User;

    if (!user || user.role !== Role.RestaurantOwner) {
      return res.status(400).json({
        message: "invalid role",
      });
    }

    const requiredFields = [
      "information",
      "price",
      "time",
      "fullname",
      "category",
    ];
    const missing = requiredFields.filter((field) => !req.body[field]);

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        fields: missing,
      });
    }

    try {
      const information = JSON.parse(
        req.body.information
      ) as Restaurant.information;
      const price = JSON.parse(req.body.price) as Restaurant.price;
      const fullname = JSON.parse(req.body.fullname) as fullname;
      const time = JSON.parse(req.body.time) as Restaurant.time[];
      const updateImage = req.body.updateImage
        ? (JSON.parse(req.body.updateImage) as number[])
        : [];
      const category = JSON.parse(req.body.category) as string[];

      const files = req.files as {
        profileImage: Express.Multer.File[];
        restaurantImages: Express.Multer.File[];
      };

      const images = {
        profilePicture: files?.profileImage?.[0] ?? undefined,
        restaurantPictures: {
          images: files?.restaurantImages ?? [],
          updateImageIds: updateImage,
        },
      } as updateRestaurantImages;
      // const profilePicture = files.profileImage[0] as Express.Multer.File;
      // const restaurantPictures = files.restaurantImages;
      if (images.restaurantPictures.images.length > 4) {
        return res.status(400).json({
          message: "You can upload up to 4 restaurant images in total",
        });
      }

      const updateRestaurantInfo = await this.service.updateRestaurantInfo(
        information,
        price,
        time,
        fullname,
        user.id,
        images,
        category
      );

      res.sendStatus(200);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          "Error during update restaurant info ERROR:",
          error.message
        );
      } else {
        console.error("Error during update restaurant info ERROR:", error);
      }

      res.status(500).json({
        message: "Error during update restaurant info ",
      });
    }
  };

  getInfoForEditRestaurant = async (req: Request, res: Response) => {
    const user = req.user as User;
    const id = user.id;

    try {
      const result = await this.service.getRestaurantByOwnerId(id);

      if (!result) {
        return res.status(400).json({
          message: "can't find restaurant",
        });
      }

      res.json({
        ...result,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          "Error during update restaurant info ERROR:",
          error.message
        );
      } else {
        console.error("Error during update restaurant info ERROR:", error);
      }

      res.status(500).json({
        message: "Error during update restaurant info ",
      });
    }
  };

  updateRestaurantStatus = async (req: Request, res: Response) => {
    const user = req.user as User;
    const role = user.role;
    const id = user.id;
    const status = req.body.status as RestaurantStatus;

    if (!user || role !== Role.RestaurantOwner || !status) {
      return res.status(400).json({
        message: "missing data or invalid role",
      });
    }

    try {
      const result = await this.service.updateRestaurantStatus(id, status);

      res.status(200).json({
        message: "Successfully update restaurant status:" + result,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          "Error during update restaurant status ERROR:",
          error.message
        );
      } else {
        console.error("Error during update restaurant status ERROR:", error);
      }

      res.status(500).json({
        message: "Error during update restaurant status ",
      });
    }
  };
}
