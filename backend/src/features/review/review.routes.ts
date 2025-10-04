import { Router } from "express";
import { ReviewControllers } from "./review.controllers";
import { ReviewServices } from "./review.services";
import prisma from "../../config/db.config";
import multer from "multer";
import { isAuthenticated } from "../../middleware/auth.middleware";
import { ReviewValidation } from "../../middleware/review.middleware";
import { PaginationValidation } from "../../middleware/pagination.middleware";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB limit per file
  },
});

const router = Router();

const reviewServices = new ReviewServices(prisma);
const reviewControllers = new ReviewControllers(reviewServices);

router.post(
  "/create",
  isAuthenticated,
  upload.array("reviewImages"),
  ReviewValidation.validRestaurantId("restaurantId"),
  ReviewValidation.validReviewText("review"),
  ReviewValidation.validRating("rating"),
  ReviewValidation.validate,
  reviewControllers.create
);

router.get(
  "/get",
  ReviewValidation.validRestaurantIdQuery("restaurantId"),
  PaginationValidation.validPage("page"),
  PaginationValidation.validLimit("limit"),
  PaginationValidation.validSort("sort"),
  PaginationValidation.validate,
  reviewControllers.get
);

router.delete(
  "/delete",
  isAuthenticated,
  ReviewValidation.validRestaurantIdQuery("restaurantId"),
  reviewControllers.delete
);

export default router;
