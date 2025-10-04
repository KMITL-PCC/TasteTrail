import { Request, Response, NextFunction } from "express";
import { validationResult, body } from "express-validator";
import passport from "../config/passport";
import { Role, User } from "@prisma/client";
import { AuthServices } from "../features/auth/auth.services";
import { HttpError } from "../utils/httpError.util";
import prisma from "../config/db.config";

const authService = new AuthServices(prisma);
// ตรวจสอบว่าผู้ใช้ล็อกอินอยู่หรือไม่
export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.isAuthenticated()) {
    return next();
  }
  // ส่ง Unauthorized response หรือ redirect ไปหน้า login
  res.status(401).json({ message: "Unauthorized: Please log in." });
}

// ตรวจสอบ Role ของผู้ใช้
export function hasRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized: Please log in." });
    }
    // ตรวจสอบ role ของผู้ใช้ที่ล็อกอิน
    const user = req.user as User;
    if (user && user.role === role) {
      return next();
    }
    res.status(403).json({
      message: "Forbidden: You do not have the necessary permissions.",
    });
  };
}

export function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).json({ message: "you are logged in , pls log out" });
  }
}

export function invalidCsrf(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({
      message: "Invalid CSRF token. Please refresh the page and try again.",
    });
  }

  next(err);
}

export async function onlyFrom3rd(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user as User;
  const isFrom3rdOnly = await authService.checkUserNotExistence(
    user?.username,
    user?.email
  );

  if (isFrom3rdOnly === null) {
    return res.status(400).json({
      message: "You login from 3 rd only. can't use this function",
    });
  }

  next();
}

export class AuthValidation {
  static validate(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((err) => ({
          field: err.type === "field" ? err.path : "unknown",
          message: err.msg,
        })),
      });
    }
    next();
  }

  static validEmail(email: string) {
    return [body(email).trim().notEmpty().isEmail().normalizeEmail()];
  }

  static otpValid(otp: string) {
    return [
      body(otp).trim().notEmpty().isLength({ min: 5, max: 5 }).isNumeric(),
    ];
  }

  static validName(name: string) {
    return [
      body(name)
        .trim()
        .notEmpty()
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters")
        .matches(/^[a-zA-Z0-9\s]+$/)
        .withMessage("Name must contain only letters and spaces"),
    ];
  }

  static validPassword(password: string) {
    return [
      body(password)
        .trim()
        .notEmpty()
        .isLength({ min: 8, max: 50 })
        .withMessage("Password must be between 8 and 50 characters")
        .matches(/[a-z]/)
        .withMessage("Password must contain at least one lowercase letter")
        .matches(/[A-Z]/)
        .withMessage("Password must contain at least one uppercase letter")
        .matches(/[0-9]/)
        .withMessage("Password must contain at least one number")
        .matches(/[\W_]/)
        .withMessage("Password must contain at least one special character"),
    ];
  }
}
