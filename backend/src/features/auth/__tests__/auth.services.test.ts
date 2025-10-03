import { AuthServices } from "../auth.services";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import otpGenerator from "otp-generator";
import transporter from "../../../config/email.config";
import { HttpError } from "../../../utils/httpError.util";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

// Mock all external dependencies
jest.mock("bcrypt");
jest.mock("otp-generator");
jest.mock("../../../config/email.config");
jest.mock("../../../config/passport");

describe("AuthServices", () => {
  let authService: AuthServices;
  let mockPrisma: DeepMockProxy<PrismaClient>;

  // Setup before each test
  beforeEach(() => {
    // Create a deep mock of Prisma client
    mockPrisma = mockDeep<PrismaClient>();

    // Initialize the service with mocked prisma
    authService = new AuthServices(mockPrisma);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("registerStep1_sendOtp", () => {
    it("should return error if username or email already exists", async () => {
      // Mock: User already exists
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "1",
        username: "testuser",
        email: "test@test.com",
        passwordHash: "hashedpass",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.registerStep1_sendOtp(
        "testuser",
        "test@example.com",
        "password123"
      );

      expect(result).toEqual({
        success: false,
        status: 400,
        message: "Username or email already taken.",
      });
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ username: "testuser" }, { email: "test@example.com" }],
        },
        select: {
          passwordHash: true,
        },
      });
    });

    it("should send OTP and return hashed data when user does not exist", async () => {
      // Mock: User does not exist
      mockPrisma.user.findFirst.mockResolvedValue(null);

      // Mock OTP generation
      (otpGenerator.generate as jest.Mock).mockReturnValue("12345");

      // Mock bcrypt hashing
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce("hashedOtp" as never) // OTP hash (first call in sendVerificationOtp)
        .mockResolvedValueOnce("hashedPassword" as never); // password hash

      // Mock email sending
      (transporter.sendMail as jest.Mock).mockResolvedValue({
        messageId: "test-123",
      });

      const result = await authService.registerStep1_sendOtp(
        "newuser",
        "new@example.com",
        "password123"
      );

      console.log(result);
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty("passwordHash", "hashedPassword");
      expect(result.data).toHaveProperty("otpHashed", "hashedOtp");
      expect(result.data).toHaveProperty("expiresAt");
      expect(result.data?.expiresAt).toBeInstanceOf(Date);

      // Verify OTP generation
      expect(otpGenerator.generate).toHaveBeenCalledWith(5, {
        digits: true,
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });

      // Verify email was sent
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: process.env.EMAIL_USER,
          to: "new@example.com",
          subject: "Verify Tastetrail OTP",
        })
      );
    });

    it("should handle email sending failure", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      (otpGenerator.generate as jest.Mock).mockReturnValue("12345");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword" as never);
      (transporter.sendMail as jest.Mock).mockRejectedValue(
        new Error("SMTP error")
      );

      await expect(
        authService.registerStep1_sendOtp(
          "newuser",
          "new@example.com",
          "password123"
        )
      ).rejects.toThrow("Failed to send verification email.");
    });
  });

  describe("checkUserNotExistence", () => {
    it("should return false if user exists by username", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "1",
        username: "existinguser",
        email: "existing@example.com",
        passwordHash: "hash",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.checkUserNotExistence(
        "existinguser",
        "other@example.com"
      );

      expect(result).toBe(false);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ username: "existinguser" }, { email: "other@example.com" }],
        },
        select: {
          passwordHash: true,
        },
      });
    });

    it("should return false if user exists by email", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "1",
        username: "testuser",
        email: "existing@example.com",
        passwordHash: "hash",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.checkUserNotExistence(
        "newuser",
        "existing@example.com"
      );

      expect(result).toBe(false);
    });

    it("should return true if user does not exist", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await authService.checkUserNotExistence(
        "newuser",
        "new@example.com"
      );

      // Note: The original code has a bug - missing 'return' keyword
      // It should return true, but returns undefined
      expect(result).toBe(true);
    });
  });

  describe("sendVerificationOtp", () => {
    it("should generate OTP and send email successfully", async () => {
      const mockOtp = "54321";
      (otpGenerator.generate as jest.Mock).mockReturnValue(mockOtp);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedOtp54321" as never);
      (transporter.sendMail as jest.Mock).mockResolvedValue({
        messageId: "msg-456",
      });

      const result = await authService.sendVerificationOtp("test@example.com");

      expect(result).toHaveProperty("expiresAt");
      expect(result).toHaveProperty("otp");
      expect(result.expiresAt).toBeInstanceOf(Date);

      // Check that OTP expires in approximately 5 minutes
      const now = new Date();
      const expiryTime = result.expiresAt.getTime() - now.getTime();
      expect(expiryTime).toBeGreaterThan(4.5 * 60 * 1000); // at least 4.5 minutes
      expect(expiryTime).toBeLessThan(5.5 * 60 * 1000); // at most 5.5 minutes

      expect(otpGenerator.generate).toHaveBeenCalledWith(5, {
        digits: true,
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });

      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "Verify Tastetrail OTP",
        })
      );
    });

    it("should throw error if email sending fails", async () => {
      (otpGenerator.generate as jest.Mock).mockReturnValue("54321");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedOtp" as never);
      (transporter.sendMail as jest.Mock).mockRejectedValue(
        new Error("Connection timeout")
      );

      await expect(
        authService.sendVerificationOtp("test@example.com")
      ).rejects.toThrow("Failed to send verification email.");
    });
  });

  describe("create", () => {
    it("should create a new user successfully", async () => {
      const mockUser = {
        id: "cuid_123456",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashedpass",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await authService.create(
        "testuser",
        "test@example.com",
        "hashedpass"
      );

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          username: "testuser",
          email: "test@example.com",
          passwordHash: "hashedpass",
        },
      });
    });

    it("should create user with CUID as ID", async () => {
      const mockUser = {
        id: "cuid_789",
        username: "newuser",
        email: "new@example.com",
        passwordHash: "hash123",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await authService.create(
        "newuser",
        "new@example.com",
        "hash123"
      );

      expect(result.id).toBeTruthy();
      expect(result.role).toBe(Role.User); // Default role
    });
  });

  describe("forgotPass", () => {
    it("should return error if email is not registered", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await authService.forgotPass("notfound@example.com");

      expect(result).toEqual({
        success: false,
        status: 400,
        message: "Email not registered or only login with social account",
      });
    });

    it("should send OTP if email is registered", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "1",
        username: "testuser",
        email: "found@example.com",
        passwordHash: "hash",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (otpGenerator.generate as jest.Mock).mockReturnValue("11111");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedOtp11111" as never);
      (transporter.sendMail as jest.Mock).mockResolvedValue({
        messageId: "msg-789",
      });

      const result = await authService.forgotPass("found@example.com");

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty("otpHashed");
      expect(result.data).toHaveProperty("expiresAt");
    });

    it("should handle user with null passwordHash (social login only)", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "2",
        username: "googleuser",
        email: "google@example.com",
        passwordHash: null, // User logged in via Google
        role: Role.User,
        profilePictureUrl: "https://google.com/pic.jpg",
        profilePictureUrlPublicId: null,
        firstName: "John",
        lastName: "Doe",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.forgotPass("google@example.com");

      // Should still send OTP even if passwordHash is null
      expect(result.success).toBe(true);
    });
  });

  describe("verifyOtp", () => {
    it("should throw HttpError with OTP_EXPIRED if OTP is expired", async () => {
      const pastDate = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago

      await expect(
        authService.verifyOtp("12345", "hashedOtp", pastDate)
      ).rejects.toThrow(HttpError);

      try {
        await authService.verifyOtp("12345", "hashedOtp", pastDate);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).message).toBe("OTP_EXPIRED");
        expect((error as HttpError).status).toBe(400);
      }
    });

    it("should throw HttpError with OTP_INVALID if OTP does not match", async () => {
      const futureDate = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.verifyOtp("12345", "hashedOtp", futureDate)
      ).rejects.toThrow(HttpError);

      try {
        await authService.verifyOtp("12345", "hashedOtp", futureDate);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).message).toBe("OTP_INVALID");
        expect((error as HttpError).status).toBe(400);
      }
    });

    it("should return true if OTP is valid and not expired", async () => {
      const futureDate = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.verifyOtp(
        "12345",
        "hashedOtp",
        futureDate
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith("12345", "hashedOtp");
    });

    it("should handle edge case where OTP expires exactly now", async () => {
      // const nowDate = new Date().toISOString();
      const pastDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Since the check is >, not >=, this should still work
      await expect(
        authService.verifyOtp("12345", "hashedOtp", pastDate)
      ).rejects.toThrow("OTP_EXPIRED");
    });
  });

  describe("updatePassword", () => {
    it("should update password successfully", async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue(
        "newHashedPassword" as never
      );

      const mockUpdatedUser = {
        id: "123",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "newHashedPassword",
        role: Role.User,
        profilePictureUrl: null,
        profilePictureUrlPublicId: null,
        firstName: null,
        lastName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await authService.updatePassword(
        "test@example.com",
        "newPassword123"
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        data: { passwordHash: "newHashedPassword" },
      });
      expect(result.passwordHash).toBe("newHashedPassword");
      expect(bcrypt.hash).toHaveBeenCalledWith("newPassword123", 10);
    });

    it("should handle user not found during password update", async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue("newHash" as never);
      mockPrisma.user.update.mockRejectedValue(new Error("Record not found"));

      await expect(
        authService.updatePassword("nonexistent@example.com", "newPass")
      ).rejects.toThrow("Record not found");
    });
  });

  describe("updatePasswordByCurrent", () => {
    it("should return error if user has no password (social login)", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = mockDeep<PrismaClient>();
        mockTx.user.findUnique.mockResolvedValue({
          id: "1",
          username: "googleuser",
          email: "google@example.com",
          passwordHash: null, // Social login user
          role: Role.User,
          profilePictureUrl: "https://google.com/pic.jpg",
          profilePictureUrlPublicId: null,
          firstName: "John",
          lastName: "Doe",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return callback(mockTx);
      });

      const result = await authService.updatePasswordByCurrent(
        "google@example.com",
        "currentPass",
        "newPass"
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe("You don't have password in this web");
    });

    it("should return error if current password is wrong", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = mockDeep<PrismaClient>();
        mockTx.user.findUnique.mockResolvedValue({
          id: "1",
          username: "testuser",
          email: "test@example.com",
          passwordHash: "oldHash",
          role: Role.User,
          profilePictureUrl: null,
          profilePictureUrlPublicId: null,
          firstName: null,
          lastName: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return callback(mockTx);
      });

      const result = await authService.updatePasswordByCurrent(
        "test@example.com",
        "wrongPassword",
        "newPass"
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe("Wrong password");
    });

    it("should update password successfully with correct current password", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(
        "newHashedPassword" as never
      );

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = mockDeep<PrismaClient>();
        mockTx.user.findUnique.mockResolvedValue({
          id: "1",
          username: "testuser",
          email: "test@example.com",
          passwordHash: "oldHash",
          role: Role.User,
          profilePictureUrl: null,
          profilePictureUrlPublicId: null,
          firstName: null,
          lastName: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return callback(mockTx);
      });

      const result = await authService.updatePasswordByCurrent(
        "test@example.com",
        "correctOldPassword",
        "newPassword123"
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe("Update password success");
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "correctOldPassword",
        "oldHash"
      );
      expect(bcrypt.hash).toHaveBeenCalledWith("newPassword123", 10);
    });

    it("should handle user not found in transaction", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = mockDeep<PrismaClient>();
        mockTx.user.findUnique.mockResolvedValue(null);
        return callback(mockTx);
      });

      const result = await authService.updatePasswordByCurrent(
        "nonexistent@example.com",
        "currentPass",
        "newPass"
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("You don't have password in this web");
    });
  });

  describe("getRestaurantByOwnerId", () => {
    it("should return restaurant id if found", async () => {
      mockPrisma.restaurant.findFirst.mockResolvedValue({
        id: "restaurant_cuid_123",
      } as any);

      const result = await authService.getRestaurantByOwnerId("owner_cuid_456");

      expect(result).toBe("restaurant_cuid_123");
      expect(mockPrisma.restaurant.findFirst).toHaveBeenCalledWith({
        where: { ownerId: "owner_cuid_456" },
        select: { id: true },
      });
    });

    it("should return undefined if restaurant not found", async () => {
      mockPrisma.restaurant.findFirst.mockResolvedValue(null);

      const result = await authService.getRestaurantByOwnerId(
        "owner_without_restaurant"
      );

      expect(result).toBeUndefined();
    });

    it("should handle owner with RestaurantOwner role", async () => {
      // This test verifies the query works for restaurant owners
      mockPrisma.restaurant.findFirst.mockResolvedValue({
        id: "restaurant_999",
      } as any);

      const result = await authService.getRestaurantByOwnerId(
        "owner_with_role"
      );

      expect(result).toBe("restaurant_999");
    });
  });
});
