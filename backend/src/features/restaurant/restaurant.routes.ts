import { Router } from "express";
import multer from "multer";

import restaurantControllers from "./restaurant.controllers";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/create",
  upload.array("images", 4),
  restaurantControllers.createRestaurant
);
router.get("/get", restaurantControllers.getRestaurants);
router.get("/get/:id", restaurantControllers.getInformation);

export default router;
