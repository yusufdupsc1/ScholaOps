// src/server/actions/timetable.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const TimetableEntrySchema = z.object({
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  roomNumber: z.string().optional(),
});

export type TimetableFormData = z.infer<typeof TimetableEntrySchema>;

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

export async function createTimetableEntry(
  formData: TimetableFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { institutionId, userId } = await getAuthContext();

    if (
      !["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(
        (await getAuthContext()).role,
      )
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    const parsed = TimetableEntrySchema.safeParse(formData);
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

    const hasConflict = await db.timetable.findFirst({
      where: {
        classId: data.classId,
        dayOfWeek: data.dayOfWeek,
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: data.startTime } },
              { endTime: { lte: data.endTime } },
            ],
          },
        ],
      },
    });

    if (hasConflict) {
      return {
        success: false,
        error: "Time slot conflicts with existing timetable entry",
      };
    }

    const entry = await db.$transaction(async (tx) => {
      const e = await tx.timetable.create({
        data: {
          classId: data.classId,
          subjectId: data.subjectId,
          teacherId: data.teacherId || null,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
          roomNumber: data.roomNumber || null,
          institutionId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Timetable",
          entityId: e.id,
          newValues: data,
          userId,
          institutionId,
        },
      });

      return e;
    });

    revalidatePath("/dashboard/timetable");
    return { success: true, data: { id: entry.id } };
  } catch (error) {
    console.error("[CREATE_TIMETABLE_ENTRY]", error);
    return { success: false, error: "Failed to create timetable entry" };
  }
}

export async function updateTimetableEntry(
  id: string,
  formData: TimetableFormData,
): Promise<ActionResult> {
  try {
    const { institutionId, role } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role || "")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const parsed = TimetableEntrySchema.safeParse(formData);
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

    const existing = await db.timetable.findFirst({
      where: { id, institutionId },
    });

    if (!existing) {
      return { success: false, error: "Timetable entry not found" };
    }

    await db.$transaction(async (tx) => {
      await tx.timetable.update({
        where: { id },
        data: parsed.data,
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Timetable",
          entityId: id,
          oldValues: existing,
          newValues: parsed.data,
          userId: (await getAuthContext()).userId,
          institutionId,
        },
      });
    });

    revalidatePath("/dashboard/timetable");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_TIMETABLE_ENTRY]", error);
    return { success: false, error: "Failed to update timetable entry" };
  }
}

export async function deleteTimetableEntry(id: string): Promise<ActionResult> {
  try {
    const { institutionId, role } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role || "")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const existing = await db.timetable.findFirst({
      where: { id, institutionId },
    });

    if (!existing) {
      return { success: false, error: "Timetable entry not found" };
    }

    await db.$transaction(async (tx) => {
      await tx.timetable.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          action: "DELETE",
          entity: "Timetable",
          entityId: id,
          userId: (await getAuthContext()).userId,
          institutionId,
        },
      });
    });

    revalidatePath("/dashboard/timetable");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_TIMETABLE_ENTRY]", error);
    return { success: false, error: "Failed to delete timetable entry" };
  }
}

export async function getTimetableForClass(classId: string) {
  const { institutionId } = await getAuthContext();

  return db.timetable.findMany({
    where: { classId, institutionId },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
      class: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function getTimetableForTeacher(teacherId: string) {
  const { institutionId } = await getAuthContext();

  return db.timetable.findMany({
    where: { teacherId, institutionId },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function getWeeklyTimetable(classId?: string) {
  const { institutionId } = await getAuthContext();

  const where = classId ? { classId, institutionId } : { institutionId };

  const entries = await db.timetable.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
      class: { select: { id: true, name: true, grade: true, section: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const weeklySchedule = days.map((day, index) => ({
    day: days[index],
    dayIndex: index,
    entries: entries.filter((e) => e.dayOfWeek === index),
  }));

  return weeklySchedule;
}
