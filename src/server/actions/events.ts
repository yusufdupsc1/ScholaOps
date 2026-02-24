// src/server/actions/events.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const EventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  location: z.string().optional(),
  type: z
    .enum(["ACADEMIC", "SPORTS", "CULTURAL", "HOLIDAY", "EXAM", "GENERAL"])
    .default("GENERAL"),
});

export type EventFormData = z.infer<typeof EventSchema>;

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

export async function createEvent(
  formData: EventFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = EventSchema.safeParse(formData);

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

    const event = await db.$transaction(async (tx) => {
      const e = await tx.event.create({
        data: {
          title: data.title,
          description: data.description || null,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          location: data.location || null,
          type: data.type,
          institutionId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Event",
          entityId: e.id,
          newValues: { title: data.title },
          userId,
        },
      });

      return e;
    });

    revalidatePath("/dashboard/events");
    revalidatePath("/dashboard");
    return { success: true, data: { id: event.id } };
  } catch (error) {
    console.error("[CREATE_EVENT]", error);
    return { success: false, error: "Failed to create event." };
  }
}

export async function updateEvent(
  id: string,
  formData: EventFormData,
): Promise<ActionResult> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = EventSchema.safeParse(formData);

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

    const existing = await db.event.findFirst({ where: { id, institutionId } });
    if (!existing) return { success: false, error: "Event not found" };

    const data = parsed.data;

    await db.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description || null,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          location: data.location || null,
          type: data.type,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Event",
          entityId: id,
          oldValues: { title: existing.title },
          newValues: { title: data.title },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/events");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_EVENT]", error);
    return { success: false, error: "Failed to update event." };
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    const { institutionId, role, userId } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const event = await db.event.findFirst({ where: { id, institutionId } });
    if (!event) return { success: false, error: "Event not found" };

    await db.$transaction(async (tx) => {
      await tx.event.delete({ where: { id } });
      await tx.auditLog.create({
        data: { action: "DELETE", entity: "Event", entityId: id, userId },
      });
    });

    revalidatePath("/dashboard/events");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_EVENT]", error);
    return { success: false, error: "Failed to delete event." };
  }
}

export async function getEvents({
  page = 1,
  limit = 20,
  search = "",
  type = "",
  upcoming = false,
}: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  upcoming?: boolean;
}) {
  const { institutionId } = await getAuthContext();

  const where: Record<string, unknown> = {
    institutionId,
    ...(type && { type }),
    ...(upcoming && { startDate: { gte: new Date() } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.event.count({ where }),
  ]);

  return { events, total, pages: Math.ceil(total / limit), page };
}
