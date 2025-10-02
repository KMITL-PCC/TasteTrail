import bcrypt from "bcrypt";
import otpGenerator from "otp-generator";

import prisma from "../../config/db.config";
import passport from "../../config/passport";
import { Role, User, PrismaClient } from "@prisma/client";
import transporter from "../../config/email.config";
import { HttpError } from "../../utils/httpError.util";

export class AuthServices {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async registerStep1_sendOtp(
    username: string,
    email: string,
    password: string
  ) {
    //1. check user not exists
    const userCheck = await this.checkUserNotExistence(username, email);

    if (userCheck) {
      return {
        success: false,
        status: 400,
        message: "Username or email already taken.",
      };
    }

    //2. send otp to email
    const { expiresAt, otp } = await this.sendVerificationOtp(email);

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const otpHashed = await bcrypt.hash(otp, 5);

    return {
      success: true,
      status: 200,
      data: {
        passwordHash,
        otpHashed,
        expiresAt,
      },
    };
  }

  //return true if user not exists;
  async checkUserNotExistence(username: string = "", email: string = "") {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      select: {
        passwordHash: true,
      },
    });

    if (existingUser) {
      return false;
    } else {
      true;
    }
  }

  async sendVerificationOtp(email: string) {
    const otp = otpGenerator.generate(5, {
      digits: true,
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60000);
    const otpHashed = await bcrypt.hash(otp, 5);

    console.log(otp);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Tastetrail OTP",
      html: `
            <h1>DEAR CUSTOMER TASTETRAIL</h1>
            <p>Thank you for use my website (tastetrail)</p>
            <p style="color: red;">Your OTP number is <strong>${otp}</strong></p>
            <p>This is OTP will expires in 5 minutes</p>
            <p>Use this password for verify OTP</p>
            <p>Thank you</p>
        `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Verification OTP sent to: ${email}`);
      return { expiresAt, otp: otpHashed };
    } catch (err) {
      console.error(`Failed to send verification OTP to ${email}:`, err);
      throw new Error("Failed to send verification email.");
    }
  }

  async create(username: string, email: string, passwordHash: string) {
    //create new user
    const newUser = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    return newUser;
  }

  async forgotPass(email: string) {
    //1. check user exists
    const userCheck = await this.checkUserNotExistence("", email);

    if (userCheck) {
      return {
        success: false,
        status: 400,
        message: "Email not registered or only login with social account",
      };
    }

    //2. send otp to email
    const { expiresAt, otp } = await this.sendVerificationOtp(email);
    // const otpHashed = await bcrypt.hash(otp, 5);

    return {
      success: true,
      status: 200,
      data: {
        otpHashed: otp,
        expiresAt,
      },
    };
  }

  async verifyOtp(otp: string, otpHashed: string, otpExpiresAt: string) {
    if (new Date() > new Date(otpExpiresAt)) {
      throw new HttpError(400, "OTP_EXPIRED");
    }

    console.log("Verify check", otp);
    const isMatch = await bcrypt.compare(otp, otpHashed);
    if (!isMatch) {
      throw new HttpError(400, "OTP_INVALID");
    }

    return true;
  }

  async updatePassword(email: string, newPassword: string) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const updatePassword = await prisma.user.update({
      where: {
        email,
      },
      data: {
        passwordHash,
      },
    });
    return updatePassword;
  }

  async updatePasswordByCurrent(
    email: string,
    currentPassword: string,
    newPassword: string
  ) {
    const update = await prisma.$transaction(async (tx) => {
      const password = await tx.user.findUnique({
        where: {
          email,
        },
        select: {
          passwordHash: true,
        },
      });

      if (!password || !password.passwordHash) {
        return {
          success: false,
          status: 400,
          message: "You don't have password in this web",
        };
      }

      const isMatch = await bcrypt.compare(
        currentPassword,
        password.passwordHash
      );

      if (!isMatch) {
        return {
          success: false,
          status: 400,
          message: "Wrong password",
        };
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      await prisma.user.update({
        where: {
          email,
        },
        data: {
          passwordHash,
        },
      });

      return {
        success: true,
        status: 200,
        message: "Update password success",
      };
    });

    if (!update?.success) {
      return {
        success: update.success,
        status: update.status,
        message: update.message,
      };
    }
    return {
      success: true,
      status: 200,
      message: "Update password success",
    };
  }

  async getRestaurantByOwnerId(ownerId: string) {
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId },
      select: {
        id: true,
      },
    });

    return restaurant?.id;
  }
}

/*
export default {
  checkUserNotExistence: async (username: string = "", email: string = "") => {
    //find existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return {
          success: false,
          status: 409,
          message: "Username already taken.",
          isLocal: existingUser?.passwordHash !== null,
        };
        // return res.status(409).json({ message: 'Username already taken.' });
      }
      if (existingUser.email === email) {
        return {
          success: false,
          status: 409,
          message: "Email already registered.",
          isLocal: existingUser?.passwordHash !== null,
        };
        // return res.status(409).json({ message: 'Email already registered.' });
      }
    }

    return { success: true };
  },

  sendVerificationOtp: async (email: string) => {
    const otp = otpGenerator.generate(5, {
      digits: true,
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60000);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Tastetrail OTP",
      html: `
            <h1>DEAR CUSTOMER TASTETRAIL</h1>
            <p>Thank you for use my website (tastetrail)</p>
            <p style="color: red;">Your OTP number is <strong>${otp}</strong></p>
            <p>This is OTP will expires in 5 minutes</p>
            <p>Use this password for verify OTP</p>
            <p>Thank you</p>
        `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Verification OTP sent to: ${email}`);
      return { expiresAt, otp };
    } catch (err) {
      console.error(`Failed to send verification OTP to ${email}:`, err);
      throw new Error("Failed to send verification email.");
    }
  },

  create: async (username: string, email: string, passwordHash: string) => {
    //create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });
    console.log(newUser.username);

    return newUser;
  },

  updatePassword: async (email: string, passwordHash: string) => {
    const updatePassword = await prisma.user.update({
      where: {
        email,
      },
      data: {
        passwordHash,
      },
    });
    return updatePassword;
  },

  updatePasswordByCurrent: async (
    email: string,
    currentPassword: string,
    newPassword: string
  ) => {
    const update = await prisma.$transaction(async (tx) => {
      const password = await tx.user.findUnique({
        where: {
          email,
        },
        select: {
          passwordHash: true,
        },
      });

      if (!password || !password.passwordHash) {
        return {
          success: false,
          status: 400,
          message: "You don't have password in this web",
        };
      }

      const isMatch = await bcrypt.compare(
        currentPassword,
        password.passwordHash
      );

      console.log(isMatch);

      if (!isMatch) {
        return {
          success: false,
          status: 400,
          message: "Wrong password",
        };
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      await prisma.user.update({
        where: {
          email,
        },
        data: {
          passwordHash,
        },
      });

      return {
        success: true,
        status: 200,
        message: "Update password success",
      };
    });

    if (!update?.success) {
      return {
        success: update.success,
        status: update.status,
        message: update.message,
      };
    }
    return {
      success: true,
      status: 200,
      message: "Update password success",
    };
  },

  getRestaurantByOwnerId: async (ownerId: string) => {
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId },
      select: {
        id: true,
      },
    });

    return restaurant?.id;
  },
};
*/
