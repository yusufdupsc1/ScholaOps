// src/server/actions/announcements.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const AnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  targetAudience: z.array(z.string()).default(["ALL"]),
  expiresAt: z.string().optional(),
});

export type AnnouncementFormData = z.infer<typeof AnnouncementSchema>;

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

export async function createAnnouncement(
  formData: AnnouncementFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = AnnouncementSchema.safeParse(formData);

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

    const data = parsed.data;

    const announcement = await db.$transaction(async (tx) => {
      const a = await tx.announcement.create({
        data: {
          title: data.title,
          content: data.content,
          priority: data.priority,
          targetAudience: data.targetAudience,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          institutionId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Announcement",
          entityId: a.id,
          newValues: { title: data.title },
          userId,
        },
      });

      return a;
    });

    revalidatePath("/dashboard/announcements");
    return { success: true, data: { id: announcement.id } };
  } catch (error) {
    console.error("[CREATE_ANNOUNCEMENT]", error);
    return { success: false, error: "Failed to create announcement." };
  }
}

export async function updateAnnouncement(
  id: string,
  formData: AnnouncementFormData,
): Promise<ActionResult> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = AnnouncementSchema.safeParse(formData);

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

    const existing = await db.announcement.findFirst({
      where: { id, institutionId },
    });
    if (!existing) return { success: false, error: "Announcement not found" };

    const data = parsed.data;

    await db.$transaction(async (tx) => {
      await tx.announcement.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          priority: data.priority,
          targetAudience: data.targetAudience,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Announcement",
          entityId: id,
          oldValues: { title: existing.title },
          newValues: { title: data.title },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_ANNOUNCEMENT]", error);
    return { success: false, error: "Failed to update announcement." };
  }
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  try {
    const { institutionId, role, userId } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const announcement = await db.announcement.findFirst({
      where: { id, institutionId },
    });
    if (!announcement)
      return { success: false, error: "Announcement not found" };

    await db.$transaction(async (tx) => {
      await tx.announcement.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          action: "DELETE",
          entity: "Announcement",
          entityId: id,
          userId,
        },
      });
    });

    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_ANNOUNCEMENT]", error);
    return { success: false, error: "Failed to delete announcement." };
  }
}

export async function getAnnouncements({
  page = 1,
  limit = 20,
  search = "",
  priority = "",
  activeOnly = false,
}: {
  page?: number;
  limit?: number;
  search?: string;
  priority?: string;
  activeOnly?: boolean;
}) {
  const { institutionId } = await getAuthContext();

  const now = new Date();
  const where: Record<string, unknown> = {
    institutionId,
    ...(priority && { priority }),
    ...(activeOnly && {
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [announcements, total] = await Promise.all([
    db.announcement.findMany({
      where,
      orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.announcement.count({ where }),
  ]);

  return { announcements, total, pages: Math.ceil(total / limit), page };
}
