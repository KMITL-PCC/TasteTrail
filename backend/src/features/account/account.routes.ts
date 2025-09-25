import { Router } from "express";
import multer from "multer";

import { accountController } from "./account.controllers";
import { accountService } from "./account.services";
import prisma from "../../config/db.config";
import { isAuthenticated } from "../../middleware/auth.middleware";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const services = new accountService(prisma);
const controllers = new accountController(services);

router.put(
  "/updateProfile",
  isAuthenticated,
  upload.single("avatar"),
  controllers.updateProfile
);

export default router;
