import { ReviewServices } from "./review.services";
import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import { HttpError } from "../../utils/httpError.util";

export type sort = "oldest" | "newest" | "highest" | "lowest";

export class ReviewControllers {
  private services: ReviewServices;
  constructor(services: ReviewServices) {
    this.services = services;
  }

  create = async (req: Request, res: Response) => {
    /*
        picture field : reviewImages
        restaurantId: "string",
        rating: 1-5,
        review: "string", 
        */

    console.log(req.body);
    const user = req.user as User;
    const userId = user.id;
    const pictures = req.files as Express.Multer.File[];

    console.log(req.files);
    try {
      const restaurantId = req.body.restaurantId;
      const rating = parseInt(req.body.rating);
      const review = req.body.review;

      await this.services.create(
        userId,
        restaurantId,
        rating,
        review,
        pictures
      );

      res.sendStatus(200);
    } catch (error: unknown) {
      console.error(
        "Error during create review ERROR:",
        error instanceof Error ? error.message : error
      );

      if (error instanceof HttpError) {
        const payload: any = {
          success: false,
          code: error.code,
          message: error.message,
        };
        return res.status(error.status).json(payload);
      }
      res.status(500).json({
        message: "error during create review",
      });
    }
  };

  get = async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const restaurantId = req.query.restaurantId as string;
    const sort = req.query.sort as sort;
    const filter = Number(req.query.filter);
    try {
      const result = await this.services.get(
        page,
        limit,
        restaurantId,
        sort,
        filter
      );

      console.log(result);
      res.status(200).json({
        ...result,
      });
    } catch (error) {
      console.error(
        "Error during create review ERROR:",
        error instanceof Error ? error.message : error
      );

      if (error instanceof HttpError) {
        const payload: any = {
          success: false,
          code: error.code,
          message: error.message,
        };
        return res.status(error.status).json(payload);
      }
      res.status(500).json({
        message: "error during create review",
      });
    }
  };

  delete = async (req: Request, res: Response) => {
    const user = req.user as User;
    const restaurantId = req.query.restaurantId as string;

    try {
      await this.services.delete(user.id, restaurantId);
      res.sendStatus(204);
    } catch (error: unknown) {
      console.error(
        "Error during delete review ERROR:",
        error instanceof Error ? error.message : error
      );

      if (error instanceof HttpError) {
        const payload: any = {
          success: false,
          code: error.code,
          message: error.message,
        };
        return res.status(error.status).json(payload);
      }
      res.status(500).json({
        message: "error during delete review",
      });
    }
  };
}
