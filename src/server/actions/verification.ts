// src/server/actions/verification.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { nanoid } from "nanoid";

const SendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export type VerificationActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getAuthContext() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; institutionId?: string; role?: string }
    | undefined;

  if (!user?.id || !user.institutionId) {
    throw new Error("Unauthorized");
  }
  return {
    userId: user.id,
    institutionId: user.institutionId,
    role: user.role,
  };
}

export async function sendVerificationEmail(
  email: string,
): Promise<VerificationActionResult<{ sent: boolean }>> {
  try {
    const parsed = SendVerificationSchema.safeParse({ email });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Invalid email",
      };
    }

    const { institutionId } = await getAuthContext();

    const user = await db.user.findFirst({
      where: { email: parsed.data.email, institutionId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.emailVerified) {
      return { success: false, error: "Email already verified" };
    }

    const verificationToken = await db.verificationToken.findFirst({
      where: {
        identifier: user.email,
        type: "EMAIL_VERIFICATION",
      },
    });

    if (verificationToken && verificationToken.expires > new Date()) {
      return {
        success: false,
        error: "Verification email already sent. Check your inbox.",
      };
    }

    const token = nanoid(32);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: user.email,
          token: token,
        },
      },
      create: {
        identifier: user.email,
        token: token,
        type: "EMAIL_VERIFICATION",
        expires,
        institutionId,
      },
      update: {
        token: token,
        expires,
      },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h1>Verify Your Email Address</h1>
        <p>Click the button below to verify your email address:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #7c6fff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link: ${verifyUrl}</p>
        <p>This link expires in 24 hours.</p>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: "Verify your email address",
      html: emailHtml,
    });

    return { success: true, data: { sent: true } };
  } catch (error) {
    console.error("[SEND_VERIFICATION_EMAIL]", error);
    return { success: false, error: "Failed to send verification email" };
  }
}

export async function verifyEmail(
  token: string,
): Promise<VerificationActionResult<{ verified: boolean }>> {
  try {
    const parsed = VerifyEmailSchema.safeParse({ token });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Invalid token",
      };
    }

    const verificationToken = await db.verificationToken.findFirst({
      where: {
        token: parsed.data.token,
        type: "EMAIL_VERIFICATION",
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return { success: false, error: "Invalid or expired verification token" };
    }

    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      db.verificationToken.delete({
        where: { token: parsed.data.token },
      }),
    ]);

    return { success: true, data: { verified: true } };
  } catch (error) {
    console.error("[VERIFY_EMAIL]", error);
    return { success: false, error: "Failed to verify email" };
  }
}

export async function sendPasswordResetEmail(
  email: string,
): Promise<VerificationActionResult<{ sent: boolean }>> {
  try {
    const parsed = SendVerificationSchema.safeParse({ email });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Invalid email",
      };
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user) {
      return { success: true, data: { sent: true } };
    }

    const existingToken = await db.verificationToken.findFirst({
      where: {
        identifier: user.email,
        type: "PASSWORD_RESET",
      },
    });

    if (existingToken && existingToken.expires > new Date()) {
      return {
        success: false,
        error: "Reset email already sent. Wait before requesting again.",
      };
    }

    const token = nanoid(32);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: user.email,
          token: token,
        },
      },
      create: {
        identifier: user.email,
        token: token,
        type: "PASSWORD_RESET",
        expires,
        institutionId: user.institutionId,
      },
      update: {
        token: token,
        expires,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h1>Reset Your Password</h1>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #7c6fff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link: ${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: emailHtml,
    });

    return { success: true, data: { sent: true } };
  } catch (error) {
    console.error("[SEND_PASSWORD_RESET_EMAIL]", error);
    return { success: false, error: "Failed to send reset email" };
  }
}

export async function resetPasswordWithToken(
  token: string,
  password: string,
): Promise<VerificationActionResult<{ reset: boolean }>> {
  try {
    if (!password || password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters",
      };
    }

    const verificationToken = await db.verificationToken.findFirst({
      where: {
        token: token,
        type: "PASSWORD_RESET",
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return { success: false, error: "Invalid or expired reset token" };
    }

    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      db.verificationToken.delete({
        where: { token: token },
      }),
    ]);

    revalidatePath("/auth/login");

    return { success: true, data: { reset: true } };
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return { success: false, error: "Failed to reset password" };
  }
}
