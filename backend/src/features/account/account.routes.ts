import { Router } from "express";
import multer from "multer";

import { accountController } from "./account.controllers";
import { accountService } from "./account.services";
import prisma from "../../config/db.config";
import { isAuthenticated, hasRole } from "../../middleware/auth.middleware";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB limit per file
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
  hasRole("User"),
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "restaurantImages", maxCount: 4 },
  ]),
  controllers.updateToRestaurantOwner
);

router.put(
  "/updateRestaurantInfo",
  isAuthenticated,
  hasRole("RestaurantOwner"),
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "restaurantImages", maxCount: 4 },
  ]),
  controllers.updateRestaurantInfo
);

router.get(
  "/updateRestaurantInfo",
  isAuthenticated,
  hasRole("RestaurantOwner"),
  controllers.getInfoForEditRestaurant
);

router.put(
  "/updateStatus",
  isAuthenticated,
  hasRole("RestaurantOwner"),
  controllers.updateRestaurantStatus
);

export default router;
