import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";

import passport from "../../config/passport";
import authServices from "./auth.services";
import { logoutAllDevices } from "../../model/redis.model";
import { User } from "@prisma/client";
import { session } from "passport";

export default {
  //send otp to create user email
  registerStep1_sendOtp: async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!password && !email && !username) {
      return res.status(400).json({ message: "Missing user data" });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      return res.status(400).json({ message: "email wrong format" });
    }

    try {
      const result = await authServices.checkUserNotExistence(username, email);

      if (result && !result.success && result.status) {
        return res.status(result.status).json({ message: result.message });
      }

      const { otp, expiresAt } = await authServices.sendVerificationOtp(email);

      //hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const otpHashed = await bcrypt.hash(otp, 5);

      const session = req.session as any;
      // console.log(session)
      session.registerData = {
        username,
        email,
        passwordHash,
        otp: otpHashed,
        expiresAt: expiresAt,
        // expiresAt: expiresAt.toISOString()
      };

      if (req.sessionID) {
        console.log("Session ID:", req.sessionID);
      }

      // ตรวจสอบข้อมูลใน Session
      if (req.session) {
        console.log("Session Data:", req.session);
      }
      req.session.save((err) => {
        if (err) {
          console.error("Failed to save session:", err);
          return res.status(500).send("Internal Server Error");
        }
      });

      res.status(200).json({
        message:
          "OTP sent to your email. Please verify to complete registration.",
      });
    } catch (err) {
      console.error("ERRORR during user validate", err);
      res
        .status(500)
        .json({ message: "Internal server error during registration." });
    }
  },

  // verify otp and create user to db
  registerStep2_verifyOTPandCreateUser: async (req: Request, res: Response) => {
    const { otp } = req.body;

    if (req.sessionID) {
      console.log("Session ID:", req.sessionID);
    }

    // ตรวจสอบข้อมูลใน Session
    if (req.session) {
      console.log("Session Data:", req.session);
    }

    if (!otp) {
      return res
        .status(401)
        .json({ message: "Invalid OTP. Please try again." });
    }

    const session = req.session as any;
    if (!session || !session.registerData || !session.registerData.otp) {
      return res.status(401).json({
        message: "No pending registration. Please start registration again.",
      });
    }
    const {
      username,
      email,
      passwordHash,
      otp: storedOtp,
      expiresAt: storedExpiresAt,
    } = session.registerData;

    if (new Date() > new Date(storedExpiresAt)) {
      delete session.registerData;
      return res
        .status(401)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    const verify = await bcrypt.compare(otp, storedOtp);
    if (!verify) {
      return res
        .status(401)
        .json({ message: "Invalid OTP. Please try again." });
    }

    try {
      const newUser = await authServices.create(username, email, passwordHash);

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
    } catch (err) {
      console.error("ERROR during user creation after OTP verification:", err);
      res
        .status(500)
        .json({ message: "Internal server error during registration." });
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
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
          console.log(info.message);
        }

        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          res.status(200).json({ message: "Logged in success" });
        });
      }
    )(req, res, next);
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
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
  },

  forgotPass: async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email or Username are required." });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      return res.status(400).json({ message: "email wrong format" });
    }

    try {
      //find user
      //return success.true = not found return success false = found
      const isDoentHaveUser = await authServices.checkUserNotExistence(
        "",
        email
      );
      if (isDoentHaveUser && isDoentHaveUser.success) {
        return res.status(400).json({
          message: "Can't find user or email pls try again",
        });
      }

      if (isDoentHaveUser && !isDoentHaveUser.isLocal) {
        return res.status(400).json({
          message: "Can't change password. You can only login by google",
        });
      }

      //send otp
      const { otp, expiresAt } = await authServices.sendVerificationOtp(email);
      const saltRounds = 5;
      const otpHashed = await bcrypt.hash(otp, saltRounds);

      const session = req.session as any;
      session.forgotData = {
        email,
      };

      session.otp = {
        otp: otpHashed,
        expiresAt: expiresAt.toISOString(),
      };

      req.session.save((err) => {
        if (err) {
          console.error("Failed to save session:", err);
          return res.status(500).send("Internal Server Error");
        }
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
  },

  OTPverify: async (req: Request, res: Response) => {
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
      console.log(session);

      const verify = await bcrypt.compare(otp, storedOtp);

      if (!verify) {
        return res
          .status(401)
          .json({ message: "Invalid OTP. Please try again." });
      }

      const now = new Date();
      if (now > new Date(storedExpiresAt)) {
        delete session.otp;
        return res
          .status(401)
          .json({ message: "OTP has expired. Please request a new one." });
      }

      delete session.otp;

      session.otp = {
        verify: true,
        expiresAt: new Date(now.getTime() + 5 * 60000).toISOString(),
      };
      res.status(200).json({
        message: "OTP verified",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error during verify OTP ERROR:", error.message);
        return res.status(500).json({
          message: "Error during verify OTP",
        });
      } else {
        console.error("Error during verify OTP ERROR:", error);
        return res.status(500).json({
          message: "Error during verify OTP",
        });
      }
    }
  },

  resendOTP: async (req: Request, res: Response) => {
    const session = req.session as any;

    if (!session || !session.otp || !session.otp.otp) {
      return res.status(401).json({
        message: "No pending registration. Please start registration again.",
      });
    }

    const { email } = session.forgotData || session.updateUserData;

    try {
      const { otp, expiresAt } = await authServices.sendVerificationOtp(email);

      session.otp = {
        otp,
        expiresAt: expiresAt.toISOString(),
      };

      req.session.save((err) => {
        if (err) {
          console.error("Failed to save session:", err);
          return res.status(500).send("Internal Server Error");
        }
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
  },

  sendOTP: async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;

    const email = user.email;

    try {
      const { otp, expiresAt } = await authServices.sendVerificationOtp(email);

      const session = req.session as any;

      const otpHashed = await bcrypt.hash(otp, 5);

      session.updateUserData = {
        email,
      };

      session.otp = {
        otp: otpHashed,
        expiresAt: expiresAt.toISOString(),
      };

      req.session.save((err) => {
        if (err) {
          console.error("Failed to save session:", err);
          return res.status(500).send("Internal Server Error");
        }
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
  },

  updatePass: async (req: Request, res: Response) => {
    const newPassword = req.body.newPassword;

    if (!newPassword) {
      return res.status(400).json("Missing password, email or username");
    }

    const session = req.session as any;
    console.log(session);
    if (!session || !session.otp || !session.otp.verify) {
      return res.status(401).json({
        message: "No pending registration. Please start registration again.",
      });
    }

    if (!(session.forgotData || session.updateUserData)) {
      return res.status(401).json({
        message: "No pending registration. Please start registration again.",
      });
    }
    if (!session.otp.verify) {
      return res.status(401).json({
        message: "You not verify access pls try again later",
      });
    }

    const { email } = session.forgotData || session.updateUserData;

    if (!email) {
      return res.status(401).json({
        message: "No pending registration. Please start registration again.",
      });
    }
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      const updatePass = await authServices.updatePassword(email, passwordHash);

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

      res.status(500).json({
        message: "Error during update password",
      });
    }
  },

  updatePassCurrent: async (req: Request, res: Response) => {
    const user = req.user as User;

    const email = user.email;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        message: "Missing data",
      });
    }

    try {
      const result = await authServices.updatePasswordByCurrent(
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
  },

  getUserData: async (req: Request, res: Response) => {
    const user = req.user as User | undefined;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    res.status(200).json({
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
      },
    });
  },
};
