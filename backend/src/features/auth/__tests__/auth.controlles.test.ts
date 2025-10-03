import { Request, Response, NextFunction } from "express";
import { AuthControllers } from "../auth.controllers";
import { AuthServices } from "../auth.services";
import { logoutAllDevices } from "../../../model/redis.model";
import { HttpError } from "../../../utils/httpError.util";
import passport from "../../../config/passport";
import { User, Role } from "@prisma/client";
import { Session } from "express-session";

// Mock dependencies
jest.mock("../../../model/redis.model");
jest.mock("../../../config/passport");

describe("AuthControllers", () => {
  let authController: AuthControllers;
  let mockAuthService: jest.Mocked<AuthServices>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock service
    mockAuthService = {
      registerStep1_sendOtp: jest.fn(),
      verifyOtp: jest.fn(),
      create: jest.fn(),
      forgotPass: jest.fn(),
      sendVerificationOtp: jest.fn(),
      updatePassword: jest.fn(),
      updatePasswordByCurrent: jest.fn(),
      getRestaurantByOwnerId: jest.fn(),
      checkUserNotExistence: jest.fn(),
    } as any;

    authController = new AuthControllers(mockAuthService);

    // Reset mocks
    mockRequest = {
      body: {},
      session: undefined,
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe("registerStep1_sendOtp", () => {
    it("should send OTP and store data in session when registration is successful", async () => {
      const username = "testuser";
      const email = "test@example.com";
      const password = "password123";
      const passwordHash = "hashedPassword";
      const otpHashed = "hashedOTP";
      const expiresAt = new Date();

      mockRequest.body = { username, email, password };
      mockRequest.session = {
        save: jest.fn((cb) => cb()),
      } as any;

      mockAuthService.registerStep1_sendOtp.mockResolvedValue({
        success: true,
        status: 200,
        data: { passwordHash, otpHashed, expiresAt },
      });

      await authController.registerStep1_sendOtp(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.registerStep1_sendOtp).toHaveBeenCalledWith(
        username,
        email,
        password
      );
      expect(mockRequest.session).toHaveProperty("registerData", {
        username,
        email,
        passwordHash,
      });
      expect(mockRequest.session).toHaveProperty("otp", {
        otp: otpHashed,
        expiresAt,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message:
          "OTP sent to your email. Please verify to complete registration.",
      });
    });

    it("should return error when username or email already exists", async () => {
      mockRequest.body = {
        username: "existinguser",
        email: "existing@example.com",
        password: "password123",
      };

      mockAuthService.registerStep1_sendOtp.mockResolvedValue({
        success: false,
        status: 400,
        message: "Username or email already taken.",
      });

      await authController.registerStep1_sendOtp(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Username or email already taken.",
      });
    });

    it("should handle internal server error", async () => {
      mockRequest.body = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      mockAuthService.registerStep1_sendOtp.mockRejectedValue(
        new Error("Database error")
      );

      await authController.registerStep1_sendOtp(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal server error during registration.",
      });
    });
  });

  describe("registerStep2_verifyOTPandCreateUser", () => {
    const mockUser: User = {
      id: "user123",
      username: "testuser",
      email: "test@example.com",
      passwordHash: "hashedPassword",
      role: Role.User,
      profilePictureUrl: null,
      profilePictureUrlPublicId: null,
      firstName: null,
      lastName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should verify OTP and create user successfully", async () => {
      const otp = "12345";
      mockRequest.body = { otp };
      (mockRequest.session as any) = {
        registerData: {
          username: "testuser",
          email: "test@example.com",
          passwordHash: "hashedPassword",
        },
        otp: {
          otp: "hashedOTP",
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        },
      } as any;

      mockRequest.login = jest.fn((user, cb) => cb(null)) as any;

      mockAuthService.verifyOtp.mockResolvedValue(true);
      mockAuthService.create.mockResolvedValue(mockUser);

      await authController.registerStep2_verifyOTPandCreateUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.verifyOtp).toHaveBeenCalledWith(
        otp,
        "hashedOTP",
        (mockRequest.session as any).otp.expiresAt
      );
      expect(mockAuthService.create).toHaveBeenCalledWith(
        "testuser",
        "test@example.com",
        "hashedPassword"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User registered and logged in successfully!",
        user: "testuser",
      });
    });

    it("should return 401 when OTP is missing", async () => {
      mockRequest.body = {};

      await authController.registerStep2_verifyOTPandCreateUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid OTP. Please try again.",
      });
    });

    it("should return 401 when no pending registration exists", async () => {
      mockRequest.body = { otp: "12345" };
      mockRequest.session = {} as any;

      await authController.registerStep2_verifyOTPandCreateUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "No pending registration. Please start registration again.",
      });
    });

    it("should handle expired OTP error", async () => {
      mockRequest.body = { otp: "12345" };
      mockRequest.session = {
        registerData: {
          username: "testuser",
          email: "test@example.com",
          passwordHash: "hashedPassword",
        },
        otp: {
          otp: "hashedOTP",
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        },
      } as any;

      mockAuthService.verifyOtp.mockRejectedValue(
        new HttpError(400, "OTP_EXPIRED")
      );

      await authController.registerStep2_verifyOTPandCreateUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        code: undefined,
        message: "OTP_EXPIRED",
      });
    });

    it("should handle auto-login failure", async () => {
      mockRequest.body = { otp: "12345" };
      mockRequest.session = {
        registerData: {
          username: "testuser",
          email: "test@example.com",
          passwordHash: "hashedPassword",
        },
        otp: {
          otp: "hashedOTP",
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        },
      } as any;

      mockRequest.login = jest.fn((user, cb) =>
        cb(new Error("Login failed"))
      ) as any;

      mockAuthService.verifyOtp.mockResolvedValue(true);
      mockAuthService.create.mockResolvedValue(mockUser);

      await authController.registerStep2_verifyOTPandCreateUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message:
          "User registered successfully, but failed to auto-login. Please try logging in manually.",
        user: "testuser",
      });
    });
  });

  describe("login", () => {
    it("should authenticate and login user successfully", async () => {
      const mockUser: User = {
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashedPassword",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.login = jest.fn((user, cb) => cb(null)) as any;

      (passport.authenticate as jest.Mock).mockImplementation(
        (strategy, callback) => {
          return (req: Request, res: Response, next: NextFunction) => {
            callback(null, mockUser, { message: "Success" });
          };
        }
      );

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Logged in success",
      });
    });

    it("should return 401 when authentication fails", async () => {
      (passport.authenticate as jest.Mock).mockImplementation(
        (strategy, callback) => {
          return (req: Request, res: Response, next: NextFunction) => {
            callback(null, false, { message: "Invalid credentials" });
          };
        }
      );

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "login failed",
      });
    });

    it("should handle passport authentication error", async () => {
      const error = new Error("Auth error");

      (passport.authenticate as jest.Mock).mockImplementation(
        (strategy, callback) => {
          return (req: Request, res: Response, next: NextFunction) => {
            callback(error, null, null);
          };
        }
      );

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("logout", () => {
    it("should logout user and destroy session successfully", async () => {
      mockRequest.logout = jest.fn((cb) => cb(null)) as any;
      mockRequest.session = {
        destroy: jest.fn((cb) => cb(null)),
      } as any;

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.logout).toHaveBeenCalled();
      expect(mockRequest.session?.destroy).toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith("connect.sid");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Logged out successfully",
      });
    });

    it("should handle logout error", async () => {
      const error = new Error("Logout failed");
      mockRequest.logout = jest.fn((cb) => cb(error)) as any;

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle session destroy error", async () => {
      const error = new Error("Session destroy failed");
      mockRequest.logout = jest.fn((cb) => cb(null)) as any;
      mockRequest.session = {
        destroy: jest.fn((cb) => cb(error)),
      } as any;

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("forgotPass", () => {
    it("should send OTP for password reset", async () => {
      const email = "test@example.com";
      mockRequest.body = { email };
      mockRequest.session = {
        save: jest.fn((cb) => cb()),
      } as any;

      const expiresAt = new Date();
      mockAuthService.forgotPass.mockResolvedValue({
        success: true,
        status: 200,
        data: {
          otpHashed: "hashedOTP",
          expiresAt,
        },
      });

      await authController.forgotPass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.forgotPass).toHaveBeenCalledWith(email);
      expect(mockRequest.session).toHaveProperty("forgotData", { email });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "send otp pls check your email",
      });
    });

    it("should return 400 when email is missing", async () => {
      mockRequest.body = {};

      await authController.forgotPass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Email or Username are required.",
      });
    });

    it("should handle user not found", async () => {
      mockRequest.body = { email: "notfound@example.com" };

      mockAuthService.forgotPass.mockResolvedValue({
        success: false,
        status: 400,
        message: "Email not registered or only login with social account",
      });

      await authController.forgotPass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Email not registered or only login with social account",
      });
    });
  });

  describe("OTPverify", () => {
    it("should verify OTP successfully", async () => {
      const otp = "12345";
      mockRequest.body = { otp };
      (mockRequest.session as any) = {
        otp: {
          otp: "hashedOTP",
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        },
        save: jest.fn((cb) => cb?.()),
      } as any;

      mockAuthService.verifyOtp.mockResolvedValue(true);

      await authController.OTPverify(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.verifyOtp).toHaveBeenCalled();
      // expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "OTP verified",
      });
      expect((mockRequest.session as any).otp).toHaveProperty("verify", true);
    });

    it("should return 401 when OTP is missing", async () => {
      mockRequest.body = {};

      await authController.OTPverify(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid OTP. Please try again.",
      });
    });

    it("should handle expired OTP", async () => {
      mockRequest.body = { otp: "12345" };
      mockRequest.session = {
        otp: {
          otp: "hashedOTP",
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        },
      } as any;

      mockAuthService.verifyOtp.mockRejectedValue(
        new HttpError(400, "OTP_EXPIRED")
      );

      await authController.OTPverify(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        code: undefined,
        message: "OTP_EXPIRED",
      });
    });
  });

  describe("resendOTP", () => {
    it("should resend OTP successfully", async () => {
      const email = "test@example.com";
      mockRequest.session = {
        registerData: { email },
        otp: { otp: "oldOTP" },
        save: jest.fn((cb) => cb()),
      } as any;

      const expiresAt = new Date();
      mockAuthService.sendVerificationOtp.mockResolvedValue({
        otp: "newHashedOTP",
        expiresAt,
      });

      await authController.resendOTP(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.sendVerificationOtp).toHaveBeenCalledWith(email);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "send otp pls check your email",
      });
    });

    it("should return 401 when no pending registration", async () => {
      mockRequest.session = {} as any;

      await authController.resendOTP(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "No pending registration. Please start registration again.",
      });
    });
  });

  describe("sendOTP", () => {
    it("should send OTP to authenticated user", async () => {
      const mockUser: User = {
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashedPassword",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.user = mockUser;
      mockRequest.session = {
        save: jest.fn((cb) => cb()),
      } as any;

      const expiresAt = new Date();
      mockAuthService.sendVerificationOtp.mockResolvedValue({
        otp: "hashedOTP",
        expiresAt,
      });

      await authController.sendOTP(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.sendVerificationOtp).toHaveBeenCalledWith(
        mockUser.email
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "send otp success",
      });
    });
  });

  describe("updatePass", () => {
    it("should update password after OTP verification", async () => {
      const newPassword = "newPassword123";
      const email = "test@example.com";
      const updatedUser: User = {
        id: "user123",
        username: "testuser",
        email,
        passwordHash: "newHashedPassword",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = { newPassword };
      mockRequest.session = {
        forgotData: { email },
        otp: {
          verify: true,
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        },
      } as any;

      mockAuthService.updatePassword.mockResolvedValue(updatedUser);
      (logoutAllDevices as jest.Mock).mockResolvedValue(undefined);

      await authController.updatePass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.updatePassword).toHaveBeenCalledWith(
        email,
        newPassword
      );
      expect(logoutAllDevices).toHaveBeenCalledWith(updatedUser.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Update password success",
        userInfo: updatedUser,
      });
    });

    it("should return 400 when password is missing", async () => {
      mockRequest.body = {};

      await authController.updatePass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        "Missing password, email or username"
      );
    });

    it("should return 401 when OTP not verified", async () => {
      mockRequest.body = { newPassword: "newPassword123" };
      mockRequest.session = {} as any;

      await authController.updatePass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "No pending registration. Please start registration again.",
      });
    });
  });

  describe("updatePassCurrent", () => {
    it("should update password with current password verification", async () => {
      const mockUser: User = {
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashedPassword",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.user = mockUser;
      mockRequest.body = {
        currentPassword: "oldPassword",
        newPassword: "newPassword123",
      };

      mockAuthService.updatePasswordByCurrent.mockResolvedValue({
        success: true,
        status: 200,
        message: "Update password success",
      });

      await authController.updatePassCurrent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.updatePasswordByCurrent).toHaveBeenCalledWith(
        mockUser.email,
        "oldPassword",
        "newPassword123"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Update password success",
      });
    });

    it("should return 400 when current password is wrong", async () => {
      const mockUser: User = {
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashedPassword",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.user = mockUser;
      mockRequest.body = {
        currentPassword: "wrongPassword",
        newPassword: "newPassword123",
      };

      mockAuthService.updatePasswordByCurrent.mockResolvedValue({
        success: false,
        status: 400,
        message: "Wrong password",
      });

      await authController.updatePassCurrent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Wrong password",
      });
    });
  });

  describe("getUserData", () => {
    it("should return user data with restaurant ID", async () => {
      const mockUser: User = {
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashedPassword",
        role: Role.RestaurantOwner,
        profilePictureUrl: "http://example.com/pic.jpg",
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.user = mockUser;
      mockAuthService.getRestaurantByOwnerId.mockResolvedValue("restaurant123");

      await authController.getUserData(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.getRestaurantByOwnerId).toHaveBeenCalledWith(
        mockUser.id
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: {
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          profilePictureUrl: mockUser.profilePictureUrl,
          restaurantId: "restaurant123",
        },
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      mockRequest.user = undefined;

      await authController.getUserData(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    it("should return user data without restaurant ID", async () => {
      const mockUser: User = {
        id: "user123",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashedPassword",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.user = mockUser;
      mockAuthService.getRestaurantByOwnerId.mockResolvedValue(undefined);

      await authController.getUserData(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        user: {
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          profilePictureUrl: null,
          restaurantId: null,
        },
      });
    });
  });
});
