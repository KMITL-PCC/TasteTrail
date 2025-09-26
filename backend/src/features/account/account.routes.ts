import { Router } from "express";
import multer from "multer";

import { accountController } from "./account.controllers";
import { accountService } from "./account.services";
import prisma from "../../config/db.config";
import { isAuthenticated } from "../../middleware/auth.middleware";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit per file
  },
});

const services = new accountService(prisma);
const controllers = new accountController(services);

router.put(
  "/updateProfile",
  isAuthenticated,
  upload.single("avatar"),
  controllers.updateProfile
);

router.post(
  "/openRestaurant",
  isAuthenticated,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "restaurantImages", maxCount: 4 },
  ]),
  controllers.updateToRestaurantOwner
);

export default router;
