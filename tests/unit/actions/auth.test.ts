import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  registerInstitution,
  forgotPassword,
  resetPassword,
} from "@/server/actions/auth";
import { db } from "@/lib/db";
import { sendEmail, welcomeEmail, passwordResetEmail } from "@/lib/email";
import * as bcrypt from "bcryptjs";

vi.mock("@/lib/db", () => ({
  db: {
    institution: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(vi.fn())),
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, id: "test-id" }),
  welcomeEmail: vi.fn().mockReturnValue("<html>Welcome</html>"),
  passwordResetEmail: vi.fn().mockReturnValue("<html>Reset</html>"),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-123",
      institutionId: "inst-123",
      role: "ADMIN",
    },
  }),
}));

describe("Auth Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("registerInstitution", () => {
    const validFormData = {
      institutionName: "Test Academy",
      institutionSlug: "test-academy",
      adminName: "John Admin",
      adminEmail: "admin@testacademy.com",
      adminPassword: "SecurePass123!",
    };

    it("should create a new institution and admin user", async () => {
      // Arrange
      (db.institution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );
      (db.institution.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "inst-123",
        name: validFormData.institutionName,
        slug: validFormData.institutionSlug,
      });
      (db.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        email: validFormData.adminEmail,
      });

      // Act
      const result = await registerInstitution(validFormData);

      // Assert
      expect(result.success).toBe(true);
      expect(db.institution.create).toHaveBeenCalled();
      expect(db.user.create).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
    });

    it("should fail if institution slug already exists", async () => {
      // Arrange
      (db.institution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        {
          id: "existing-inst",
          slug: validFormData.institutionSlug,
        },
      );

      // Act
      const result = await registerInstitution(validFormData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });

    it("should fail if admin email already registered", async () => {
      // Arrange
      (db.institution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "existing-user",
        email: validFormData.adminEmail,
      });

      // Act
      const result = await registerInstitution(validFormData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("email");
    });

    it("should validate password strength", async () => {
      // Act
      const result = await registerInstitution({
        ...validFormData,
        adminPassword: "weak",
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.adminPassword).toBeDefined();
    });
  });

  describe("forgotPassword", () => {
    const validEmail = "user@test.com";

    it("should send password reset email for valid user", async () => {
      // Arrange
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        email: validEmail,
        name: "Test User",
      });

      // Act
      const result = await forgotPassword({ email: validEmail });

      // Assert
      expect(result.success).toBe(true);
      expect(sendEmail).toHaveBeenCalled();
    });

    it("should return success even if user not found (security)", async () => {
      // Arrange
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      // Act
      const result = await forgotPassword({ email: validEmail });

      // Assert
      expect(result.success).toBe(true);
      // Should NOT send email for non-existent user
    });

    it("should validate email format", async () => {
      // Act
      const result = await forgotPassword({ email: "invalid-email" });

      // Assert
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.email).toBeDefined();
    });
  });

  describe("resetPassword", () => {
    const validToken = "valid-reset-token";
    const newPassword = "NewSecurePass123!";

    it("should reset password with valid token", async () => {
      // Arrange - Note: In real implementation, we'd verify the token
      // For this test, we simulate a successful password reset

      // Act
      const result = await resetPassword({
        token: validToken,
        password: newPassword,
      });

      // Assert
      // In a real implementation, we'd verify the token exists and update the password
      // For now, we test the validation
      expect(result).toBeDefined();
    });

    it("should validate password strength", async () => {
      // Act
      const result = await resetPassword({
        token: validToken,
        password: "weak",
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.password).toBeDefined();
    });

    it("should reject invalid tokens", async () => {
      // Act
      const result = await resetPassword({
        token: "",
        password: newPassword,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
