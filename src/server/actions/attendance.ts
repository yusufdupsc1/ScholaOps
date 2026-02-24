// src/server/actions/attendance.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const AttendanceEntrySchema = z.object({
  studentId: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED", "HOLIDAY"]),
  remarks: z.string().optional(),
});

const MarkAttendanceSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  date: z.string().min(1, "Date is required"),
  entries: z.array(AttendanceEntrySchema).min(1, "At least one entry required"),
});

export type MarkAttendanceData = z.infer<typeof MarkAttendanceSchema>;

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

export async function markAttendance(
  formData: MarkAttendanceData,
): Promise<ActionResult> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = MarkAttendanceSchema.safeParse(formData);

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
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    // Verify class belongs to institution
    const cls = await db.class.findFirst({
      where: { id: data.classId, institutionId },
    });
    if (!cls) return { success: false, error: "Class not found" };

    // Upsert attendance records
    await db.$transaction(async (tx) => {
      for (const entry of data.entries) {
        await tx.attendance.upsert({
          where: { studentId_date: { studentId: entry.studentId, date } },
          create: {
            date,
            status: entry.status,
            remarks: entry.remarks || null,
            institutionId,
            classId: data.classId,
            studentId: entry.studentId,
          },
          update: {
            status: entry.status,
            remarks: entry.remarks || null,
            markedAt: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: "MARK_ATTENDANCE",
          entity: "Attendance",
          entityId: data.classId,
          newValues: {
            date: data.date,
            classId: data.classId,
            count: data.entries.length,
          },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/attendance");
    return { success: true };
  } catch (error) {
    console.error("[MARK_ATTENDANCE]", error);
    return { success: false, error: "Failed to mark attendance." };
  }
}

export async function getAttendanceForClass({
  classId,
  date,
}: {
  classId: string;
  date: string;
}) {
  const { institutionId } = await getAuthContext();

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const [students, attendance] = await Promise.all([
    db.student.findMany({
      where: { classId, institutionId, status: "ACTIVE" },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        photo: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    db.attendance.findMany({
      where: { classId, institutionId, date: d },
      select: { studentId: true, status: true, remarks: true },
    }),
  ]);

  const attendanceMap = new Map(attendance.map((a) => [a.studentId, a]));

  return students.map((s) => ({
    ...s,
    attendance: attendanceMap.get(s.id) ?? null,
  }));
}

export async function getAttendanceSummary({
  classId,
  startDate,
  endDate,
}: {
  classId?: string;
  startDate: string;
  endDate: string;
}) {
  const { institutionId } = await getAuthContext();

  const where: Record<string, unknown> = {
    institutionId,
    date: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
    ...(classId && { classId }),
  };

  const data = await db.attendance.groupBy({
    by: ["status"],
    where,
    _count: true,
  });

  const total = data.reduce((sum, d) => sum + d._count, 0);
  const present = data.find((d) => d.status === "PRESENT")?._count ?? 0;
  const absent = data.find((d) => d.status === "ABSENT")?._count ?? 0;
  const late = data.find((d) => d.status === "LATE")?._count ?? 0;
  const excused = data.find((d) => d.status === "EXCUSED")?._count ?? 0;

  return {
    total,
    present,
    absent,
    late,
    excused,
    presentRate: total > 0 ? Math.round((present / total) * 100) : 0,
    breakdown: data,
  };
}

export async function getAttendanceTrend({
  classId,
  days = 30,
}: {
  classId?: string;
  days?: number;
}) {
  const { institutionId } = await getAuthContext();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const data = await db.attendance.groupBy({
    by: ["date", "status"],
    where: {
      institutionId,
      date: { gte: startDate },
      ...(classId && { classId }),
    },
    _count: true,
    orderBy: { date: "asc" },
  });

  return data;
}
