// src/server/actions/grades.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  asPlainArray,
  normalizeGroupCount,
  toNumber,
} from "@/lib/server/serializers";

const GradeSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  subjectId: z.string().min(1, "Subject is required"),
  score: z.coerce.number().min(0, "Score must be positive"),
  maxScore: z.coerce
    .number()
    .min(1, "Max score must be at least 1")
    .default(100),
  term: z.string().min(1, "Term is required"),
  remarks: z.string().optional(),
});

export type GradeFormData = z.infer<typeof GradeSchema>;

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

function computeLetterGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 30) return "D";
  return "F";
}

export async function createGrade(
  formData: GradeFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = GradeSchema.safeParse(formData);

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

    if (data.score > data.maxScore) {
      return { success: false, error: "Score cannot exceed max score." };
    }

    // Verify student belongs to institution
    const student = await db.student.findFirst({
      where: { id: data.studentId, institutionId },
    });
    if (!student) return { success: false, error: "Student not found" };

    const percentage =
      Math.round((data.score / data.maxScore) * 100 * 100) / 100;
    const letterGrade = computeLetterGrade(percentage);

    const grade = await db.$transaction(async (tx) => {
      const g = await tx.grade.create({
        data: {
          score: data.score,
          maxScore: data.maxScore,
          percentage,
          letterGrade,
          term: data.term,
          remarks: data.remarks || null,
          institutionId,
          studentId: data.studentId,
          subjectId: data.subjectId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Grade",
          entityId: g.id,
          newValues: {
            studentId: data.studentId,
            subjectId: data.subjectId,
            score: data.score,
            term: data.term,
          },
          userId,
        },
      });

      return g;
    });

    revalidatePath("/dashboard/grades");
    return { success: true, data: { id: grade.id } };
  } catch (error) {
    console.error("[CREATE_GRADE]", error);
    return { success: false, error: "Failed to create grade." };
  }
}

export async function updateGrade(
  id: string,
  formData: GradeFormData,
): Promise<ActionResult> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = GradeSchema.safeParse(formData);

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

    const existing = await db.grade.findFirst({ where: { id, institutionId } });
    if (!existing) return { success: false, error: "Grade not found" };

    const data = parsed.data;
    if (data.score > data.maxScore) {
      return { success: false, error: "Score cannot exceed max score." };
    }

    const percentage =
      Math.round((data.score / data.maxScore) * 100 * 100) / 100;
    const letterGrade = computeLetterGrade(percentage);

    await db.$transaction(async (tx) => {
      await tx.grade.update({
        where: { id },
        data: {
          score: data.score,
          maxScore: data.maxScore,
          percentage,
          letterGrade,
          term: data.term,
          remarks: data.remarks || null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Grade",
          entityId: id,
          oldValues: { score: existing.score },
          newValues: { score: data.score },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/grades");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_GRADE]", error);
    return { success: false, error: "Failed to update grade." };
  }
}

export async function deleteGrade(id: string): Promise<ActionResult> {
  try {
    const { institutionId, role, userId } = await getAuthContext();

    if (!["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"].includes(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const grade = await db.grade.findFirst({ where: { id, institutionId } });
    if (!grade) return { success: false, error: "Grade not found" };

    await db.$transaction(async (tx) => {
      await tx.grade.delete({ where: { id } });
      await tx.auditLog.create({
        data: { action: "DELETE", entity: "Grade", entityId: id, userId },
      });
    });

    revalidatePath("/dashboard/grades");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_GRADE]", error);
    return { success: false, error: "Failed to delete grade." };
  }
}

export async function getGrades({
  page = 1,
  limit = 25,
  search = "",
  classId = "",
  subjectId = "",
  term = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  subjectId?: string;
  term?: string;
}) {
  const { institutionId } = await getAuthContext();
  const studentFilter: Record<string, unknown> = {};
  if (classId) {
    studentFilter.classId = classId;
  }
  if (search) {
    studentFilter.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { studentId: { contains: search, mode: "insensitive" } },
    ];
  }

  const where: Record<string, unknown> = {
    institutionId,
    ...(subjectId && { subjectId }),
    ...(term && { term }),
    ...(Object.keys(studentFilter).length > 0 && { student: studentFilter }),
  };

  const [grades, total] = await Promise.all([
    db.grade.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            class: { select: { name: true } },
          },
        },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ term: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.grade.count({ where }),
  ]);

  return {
    grades: asPlainArray(grades).map((grade) => ({
      id: grade.id,
      score: toNumber(grade.score),
      maxScore: toNumber(grade.maxScore),
      percentage: toNumber(grade.percentage),
      letterGrade: grade.letterGrade,
      term: grade.term,
      remarks: grade.remarks,
      student: {
        id: grade.student.id,
        firstName: grade.student.firstName,
        lastName: grade.student.lastName,
        studentId: grade.student.studentId,
        class: grade.student.class ? { name: grade.student.class.name } : null,
      },
      subject: {
        id: grade.subject.id,
        name: grade.subject.name,
        code: grade.subject.code,
      },
    })),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    page,
  };
}

export async function getGradeDistribution() {
  const { institutionId } = await getAuthContext();

  const grades = await db.grade.groupBy({
    by: ["letterGrade"],
    where: { institutionId },
    _count: true,
    orderBy: { letterGrade: "asc" },
  });

  return asPlainArray(grades).map((grade) => ({
    letterGrade: grade.letterGrade,
    _count: normalizeGroupCount(grade._count),
  }));
}
