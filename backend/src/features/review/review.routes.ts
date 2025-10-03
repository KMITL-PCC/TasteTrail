import { Router } from "express";
import { ReviewControllers } from "./review.controllers";
import { ReviewServices } from "./review.services";
import prisma from "../../config/db.config";
import multer from "multer";

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

router.post("/create", upload.array("reviewImages"), reviewControllers.create);

export default router;
