import { User } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { accountService } from "./account.services";

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
}
