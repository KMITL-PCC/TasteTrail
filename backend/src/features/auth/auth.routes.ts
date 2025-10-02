import { Router } from "express";
import {
  isLoggedIn,
  isAuthenticated,
  hasRole,
  AuthValidation,
} from "../../middleware/auth.middleware";
import { AuthControllers } from "./auth.controllers";

import passport from "../../config/passport";
import rateLimit from "express-rate-limit";
import { AuthServices } from "./auth.services";
import prisma from "../../config/db.config";

const router = Router();
const services = new AuthServices(prisma);
const authControllers = new AuthControllers(services);

//local
router.post(
  "/register/send-otp",
  // rateLimit({ windowMs: 20 * 60 * 1000, max: 5 }),
  isLoggedIn,
  AuthValidation.validName("username"),
  AuthValidation.validEmail("email"),
  AuthValidation.validPassword("password"),
  AuthValidation.validate,
  authControllers.registerStep1_sendOtp
);

router.post(
  "/register/verify",
  // rateLimit({ windowMs: 10 * 60 * 1000, max: 10 }),
  isLoggedIn,
  AuthValidation.otpValid("otp"),
  AuthValidation.validate,
  authControllers.registerStep2_verifyOTPandCreateUser
);

router.post(
  "/login",
  // rateLimit({ windowMs: 20 * 60 * 1000, max: 5 }),
  isLoggedIn,
  AuthValidation.validName("loginform"),
  AuthValidation.validPassword("password"),
  AuthValidation.validate,
  authControllers.login
);

router.post(
  "/forgotPass",
  // rateLimit({ windowMs: 20 * 60 * 1000, max: 5 }), //5req : 20 minutes
  isLoggedIn,
  AuthValidation.validEmail("email"),
  AuthValidation.validate,
  authControllers.forgotPass
);

router.post(
  "/verify-otp",
  // rateLimit({ windowMs: 10 * 60 * 1000, max: 10 }),
  AuthValidation.otpValid("otp"),
  AuthValidation.validate,
  authControllers.OTPverify
);

router.post(
  "/resend-otp",
  // rateLimit({ windowMs: 10 * 60 * 1000, max: 10 }),
  authControllers.resendOTP
);

router.patch(
  "/reset-password",
  isLoggedIn,
  AuthValidation.validPassword("newPassword"),
  AuthValidation.validate,
  authControllers.updatePass
);

router.post("/sendOTP", isAuthenticated, authControllers.sendOTP);
router.patch(
  "/updatepass",
  isAuthenticated,
  AuthValidation.validPassword("newPassword"),
  AuthValidation.validate,
  authControllers.updatePass
);
router.patch(
  "/updatepass-current",
  isAuthenticated,
  AuthValidation.validPassword("currentPassword"),
  AuthValidation.validPassword("newPassword"),
  AuthValidation.validate,
  authControllers.updatePassCurrent
);

//google
router.get(
  "/google",
  // rateLimit({ windowMs: 20 * 60 * 1000, max: 5 }),
  isLoggedIn,
  passport.authenticate("google", { scope: ["profile", "email"] }) // ขอสิทธิ์เข้าถึง profile และ email
);

// Endpoint ที่ Google จะเรียกกลับมาหลังจากการล็อกอินสำเร็จ/ไม่สำเร็จ
router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: process.env.FRONTEND_URL + "/", // Redirect ไปยังหน้า Dashboard ของ Frontend เมื่อล็อกอินสำเร็จ
    failureRedirect: process.env.FRONTEND_URL + "/fail", // Redirect ไปยังหน้า Login ของ Frontend เมื่อล็อกอินไม่สำเร็จ
  })
);

router.get("/me", isAuthenticated, authControllers.getUserData);

router.get("/logout", isAuthenticated, authControllers.logout);

export default router;
