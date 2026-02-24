// src/server/actions/users.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "PRINCIPAL", "TEACHER", "STAFF"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["ADMIN", "PRINCIPAL", "TEACHER", "STAFF"]).optional(),
  isActive: z.boolean().optional(),
});

export type UserFormData = z.infer<typeof CreateUserSchema>;
export type UserUpdateData = z.infer<typeof UpdateUserSchema>;

type ActionResult<T = void> =
  | { success: true; data?: T; error?: never }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      data?: never;
    };

async function getAuthContext() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; institutionId?: string; role?: string }
    | undefined;

  if (!user?.id || !user.institutionId || !user.role) {
    throw new Error("Unauthorized");
  }
  return {
    userId: user.id,
    institutionId: user.institutionId,
    role: user.role,
  };
}

export async function createUser(
  formData: UserFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { institutionId, role: currentUserRole } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN"].includes(currentUserRole || "")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const parsed = CreateUserSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const { name, email, role, password } = parsed.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          institutionId,
          isActive: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "User",
          entityId: newUser.id,
          newValues: { name, email, role },
          userId: (await getAuthContext()).userId,
          institutionId,
        },
      });

      return newUser;
    });

    revalidatePath("/dashboard/users");
    return { success: true, data: { id: user.id } };
  } catch (error) {
    console.error("[CREATE_USER]", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(
  id: string,
  formData: UserUpdateData,
): Promise<ActionResult> {
  try {
    const {
      institutionId,
      role: currentUserRole,
      userId: currentUserId,
    } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN"].includes(currentUserRole || "")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const parsed = UpdateUserSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const existing = await db.user.findFirst({
      where: { id, institutionId },
    });

    if (!existing) {
      return { success: false, error: "User not found" };
    }

    if (existing.id === currentUserId) {
      return { success: false, error: "Cannot modify your own account" };
    }

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: parsed.data,
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "User",
          entityId: id,
          oldValues: { name: existing.name, role: existing.role },
          newValues: parsed.data,
          userId: currentUserId,
          institutionId,
        },
      });
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_USER]", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deactivateUser(id: string): Promise<ActionResult> {
  try {
    const {
      institutionId,
      role: currentUserRole,
      userId: currentUserId,
    } = await getAuthContext();

    if (
      !["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(currentUserRole || "")
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    const existing = await db.user.findFirst({
      where: { id, institutionId },
    });

    if (!existing) {
      return { success: false, error: "User not found" };
    }

    if (existing.id === currentUserId) {
      return { success: false, error: "Cannot deactivate your own account" };
    }

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { isActive: false },
      });

      await tx.auditLog.create({
        data: {
          action: "DEACTIVATE",
          entity: "User",
          entityId: id,
          userId: currentUserId,
          institutionId,
        },
      });
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("[DEACTIVATE_USER]", error);
    return { success: false, error: "Failed to deactivate user" };
  }
}

export async function getUsers({
  page = 1,
  limit = 20,
  search = "",
  role = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) {
  const { institutionId } = await getAuthContext();

  const where: Record<string, unknown> = {
    institutionId,
    ...(role && { role }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        teacher: {
          select: {
            id: true,
            teacherId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  return { users, total, pages: Math.ceil(total / limit), page };
}

export async function linkTeacherToUser(
  userId: string,
  teacherId: string,
): Promise<ActionResult> {
  try {
    const { institutionId, userId: currentUserId } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN"].includes((await getAuthContext()).role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, institutionId },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    const user = await db.user.findFirst({
      where: { id: userId, institutionId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await db.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id: teacherId },
        data: { userId },
      });

      await tx.auditLog.create({
        data: {
          action: "LINK",
          entity: "Teacher",
          entityId: teacherId,
          newValues: { userId },
          userId: currentUserId,
          institutionId,
        },
      });
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("[LINK_TEACHER_TO_USER]", error);
    return { success: false, error: "Failed to link teacher to user" };
  }
}
