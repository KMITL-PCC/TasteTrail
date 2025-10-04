import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";

import passport from "../../config/passport";
import { AuthServices } from "./auth.services";
import { logoutAllDevices } from "../../model/redis.model";
import { User } from "@prisma/client";
import { session } from "passport";
import { HttpError } from "../../utils/httpError.util";

export class AuthControllers {
  private service: AuthServices;

  constructor(service: AuthServices) {
    this.service = service;
  }

  registerStep1_sendOtp = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    try {
      const result = await this.service.registerStep1_sendOtp(
        username,
        email,
        password
      );

      if (!result.success) {
        return res.status(result.status).json({ message: result.message });
      }

      const session = req.session as any;
      session.registerData = {
        username,
        email,
        passwordHash: result.data?.passwordHash,
      };

      session.otp = {
        otp: result.data?.otpHashed,
        expiresAt: result.data?.expiresAt,
      };

      console.log(session);
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(200).json({
        message:
          "OTP sent to your email. Please verify to complete registration.",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("ERROR during user validate", err.message);
      } else {
        console.error("ERROR during user validate", err);
      }
      res
        .status(500)
        .json({ message: "Internal server error during registration." });
    }
  };

  registerStep2_verifyOTPandCreateUser = async (
    req: Request,
    res: Response
  ) => {
    const { otp } = req.body;

    if (!otp) {
      return res
        .status(401)
        .json({ message: "Invalid OTP. Please try again." });
    }

    const session = req.session as any;
    if (!session || !session.registerData || !session.otp) {
      return res.status(401).json({
        message: "No pending registration. Please start registration again.",
      });
    }

    try {
      const { username, email, passwordHash } = session.registerData;

      const { otp: storedOtp, expiresAt: storedExpiresAt } = session.otp;

      await this.service.verifyOtp(otp, storedOtp, storedExpiresAt);

      const newUser = await this.service.create(username, email, passwordHash);

      delete session.registrationData;

      req.login(newUser as Express.User, (err) => {
        if (err) {
          console.error("Error auto-logging in after registration:", err);
          return res.status(201).json({
            message:
              "User registered successfully, but failed to auto-login. Please try logging in manually.",
            user: newUser.username,
          });
        }
        res.status(201).json({
          message: "User registered and logged in successfully!",
          user: newUser.username,
        });
      });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        const payload: any = {
          success: false,
          code: err.code,
          message: err.message,
        };
        return res.status(err.status).json(payload);
      } else if (err instanceof Error) {
        console.error(
          "ERROR during user creation after OTP verification:",
          err.message
        );
      } else {
        console.error(
          "ERROR during user creation after OTP verification:",
          err
        );
      }
      res
        .status(500)
        .json({ message: "Internal server error during registration." });
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    console.log("got req from log in");
    passport.authenticate(
      "local",
      (err: any, user: Express.User | false, info: { message: string }) => {
        if (err) {
          console.error("Passport Auth Error:", err);
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: "login failed" });
        }

        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          res.status(200).json({ message: "Logged in success" });
        });
      }
    )(req, res, next);
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    req.logout((err: any) => {
      if (err) {
        console.error("Error during Passport logout:", err);
        return next(err);
      }
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Error during destroying session:", err);
          return next(err);
        }

        res.clearCookie("connect.sid");

        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  };

  forgotPass = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email or Username are required." });
    }

    try {
      const result = await this.service.forgotPass(email);

      if (!result.success) {
        return res.status(result.status).json({
          message: result.message,
        });
      }

      const session = req.session as any;
      session.forgotData = {
        email,
      };

      session.otp = {
        otp: result.data?.otpHashed,
        expiresAt: result.data?.expiresAt.toISOString(),
      };

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(200).json({
        message: "send otp pls check your email",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error during forgot password ERROR:", error.message);
        return res.status(500).json({
          message: "Error during forgot password",
        });
      } else {
        console.error("Error during forgot password ERROR:", error);
        return res.status(500).json({
          message: "Error during forgot password",
        });
      }
    }
  };

  OTPverify = async (req: Request, res: Response) => {
    const { otp } = req.body;

    if (!otp) {
      return res
        .status(401)
        .json({ message: "Invalid OTP. Please try again." });
    }

    const session = req.session as any;
    if (!session || !session.otp || !session.otp.otp) {
      return res.status(401).json({
        message: "No pending registration. Please start registration again.",
      });
    }

    try {
      const { otp: storedOtp, expiresAt: storedExpiresAt } = session.otp;

      await this.service.verifyOtp(otp, storedOtp, storedExpiresAt);

      delete session.otp;

      const now = new Date();
      session.otp = {
        verify: true,
        expiresAt: new Date(now.getTime() + 5 * 60000).toISOString(),
      };

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(200).json({
        message: "OTP verified",
      });
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        const payload: any = {
          success: false,
          code: error.code,
          message: error.message,
        };
        return res.status(error.status).json(payload);
      } else if (error instanceof Error) {
        console.error("Error during verify OTP ERROR:", error.message);
      } else {
        console.error("Error during verify OTP ERROR:", error);
      }

      // delete session.otp;

      res.status(500).json({
        message: "Error during verify OTP",
      });
    }
  };

  resendOTP = async (req: Request, res: Response) => {
    const session = req.session as any;

    if (!session || !session.otp || !session.otp.otp) {
      return res.status(401).json({
        message: "No pending registration. Please start registration again.",
      });
    }

    try {
      const { email } =
        session.forgotData || session.updateUserData || session.registerData;
      const { otp, expiresAt } = await this.service.sendVerificationOtp(email);

      session.otp = {
        otp,
        expiresAt: expiresAt.toISOString(),
      };
      console.log("Resend OTP Session:", session);

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(200).json({
        message: "send otp pls check your email",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error during send otp ERROR:", error.message);
        return res.status(500).json({ message: "Error during send otp ERROR" });
      } else {
        console.error("Error during send otp ERROR:", error);
        return res.status(500).json({ message: "Error during send otp ERROR" });
      }
    }
  };

  sendOTP = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;

    const email = user.email;

    try {
      const { otp, expiresAt } = await this.service.sendVerificationOtp(email);

      const session = req.session as any;

      // const otpHashed = await bcrypt.hash(otp, 5);

      session.updateUserData = {
        email,
      };

      session.otp = {
        otp: otp,
        expiresAt: expiresAt.toISOString(),
      };

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(200).json({
        message: "send otp success",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error during update password ERROR:", error.message);
      } else {
        console.error("Error during update password ERROR:", error);
      }

      res.status(500).json({
        message: "Error during update password",
      });
    }
  };

  updatePass = async (req: Request, res: Response) => {
    const newPassword = req.body.newPassword;

    if (!newPassword) {
      return res.status(400).json("Missing password, email or username");
    }

    const session = req.session as any;

    if (
      !session ||
      !session.otp ||
      !session.otp.verify ||
      !(session.forgotData || session.updateUserData)
    ) {
      return res.status(401).json({
        message: "No pending registration. Please start registration again.",
      });
    }

    const { email } = session.forgotData || session.updateUserData;

    if (!email) {
      return res.status(401).json({
        message: "No pending registration. Please start registration again.",
      });
    }
    try {
      const updatePass = await this.service.updatePassword(email, newPassword);

      req.session.destroy((err) => {
        if (err) console.error("Error destroying session:", err);
      });

      // delete session.otp;
      // if (session.forgotData) {
      //   delete session.forgotData;
      // }
      logoutAllDevices(updatePass.id);

      res.status(200).json({
        message: "Update password success",
        userInfo: updatePass,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error during update password ERROR:", error.message);
      } else {
        console.error("Error during update password ERROR:", error);
      }

      req.session.destroy((err) => {
        if (err) console.error("Error destroying session:", err);
      });

      res.status(500).json({
        message: "Error during update password",
      });
    }
  };

  updatePassCurrent = async (req: Request, res: Response) => {
    const user = req.user as User;

    const email = user.email;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        message: "Missing data",
      });
    }

    try {
      const result = await this.service.updatePasswordByCurrent(
        email,
        currentPassword,
        newPassword
      );

      if (result && !result?.success) {
        return res.status(result?.status).json({
          message: result.message,
        });
      }

      res.status(result.status).json({
        message: result.message,
      });
      // res.sendStatus(200);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error during update password ERROR:", error.message);
      } else {
        console.error("Error during update password ERROR:", error);
      }

      res.status(500).json({
        message: "Error during update password",
      });
    }
  };

  getUserData = async (req: Request, res: Response) => {
    const user = req.user as User | undefined;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    try {
      const restaurantId = await this.service.getRestaurantByOwnerId(user.id);
      const is3rdOnly = await this.service.is3rdOnly(user.id);
      res.status(200).json({
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          profilePictureUrl: user.profilePictureUrl,
          restaurantId: restaurantId || null,
          thirdPartyOnly: is3rdOnly,
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error during get user data ERROR:", err.message);
      } else {
        console.error("Error during get user data ERROR:", err);
      }

      res.status(500).json({
        message: "Error during get user data",
      });
    }
  };
}
