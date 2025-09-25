import { User } from "@prisma/client";
import { Restaurant } from "../../types/restaurant";
import { Request, Response, NextFunction } from "express";
import { accountService } from "./account.services";

export type fullname = {
  firstName: string;
  lastName: string;
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
    //       "services": [1,2,3,4] //delivery,QR, WIFI, alcohol
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
    // ]

    //5 pic
    //4 for Restaurant page and 1 for Owner selfie picture
    const user = req.user as User;
    const role = user.role;
    const id = user.id;

    const information = req.body.information as Restaurant.information;
    const price = req.body.price as Restaurant.price;
    const time = req.body.time as Restaurant.time;
    const fullname = req.body.fullname as fullname;

    try {
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
}
