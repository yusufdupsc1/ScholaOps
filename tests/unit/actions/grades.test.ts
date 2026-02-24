import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createGrade,
  updateGrade,
  deleteGrade,
  getGrades,
  getGradeDistribution,
} from "@/server/actions/grades";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    grade: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    subject: {
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(vi.fn())),
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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Grades Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createGrade", () => {
    const validFormData = {
      studentId: "student-123",
      subjectId: "subject-123",
      score: 85,
      maxScore: 100,
      term: "Term 1 2024",
    };

    it("should create a new grade record", async () => {
      // Arrange
      (db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "student-123",
        studentId: "STU-001",
      });
      (db.subject.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "subject-123",
        name: "Mathematics",
      });
      (db.grade.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "grade-123",
        percentage: 85,
        letterGrade: "B",
        ...validFormData,
      });

      // Act
      const result = await createGrade(validFormData);

      // Assert
      expect(result.success).toBe(true);
      expect(db.grade.create).toHaveBeenCalled();
      expect(db.auditLog.create).toHaveBeenCalled();
    });

    it("should calculate percentage and letter grade automatically", async () => {
      // Arrange
      (db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "student-123",
      });
      (db.subject.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "subject-123",
      });

      let createCall: any;
      (db.grade.create as ReturnType<typeof vi.fn>).mockImplementation(
        (args) => {
          createCall = args;
          return Promise.resolve({ id: "grade-123", ...args.data });
        },
      );

      // Act
      await createGrade({ ...validFormData, score: 92, maxScore: 100 });

      // Assert
      expect(createCall.data.percentage).toBe(92);
      expect(createCall.data.letterGrade).toBe("A-");
    });

    it("should fail if student not found", async () => {
      // Arrange
      (db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      // Act
      const result = await createGrade(validFormData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Student not found");
    });

    it("should fail if subject not found", async () => {
      // Arrange
      (db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "student-123",
      });
      (db.subject.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      // Act
      const result = await createGrade(validFormData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Subject not found");
    });

    it("should validate score range", async () => {
      // Act
      const result = await createGrade({
        ...validFormData,
        score: 150, // Exceeds maxScore
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.score).toBeDefined();
    });

    it("should validate required fields", async () => {
      // Act
      const result = await createGrade({
        studentId: "",
        subjectId: "",
        score: 0,
      } as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
    });
  });

  describe("updateGrade", () => {
    const gradeId = "grade-123";
    const updateData = {
      score: 90,
      maxScore: 100,
      term: "Term 1 2024",
      remarks: "Excellent improvement",
    };

    it("should update existing grade", async () => {
      // Arrange
      (db.grade.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: gradeId,
        score: 85,
      });
      (db.grade.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: gradeId,
        ...updateData,
        percentage: 90,
        letterGrade: "A-",
      });

      // Act
      const result = await updateGrade(gradeId, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(db.grade.update).toHaveBeenCalled();
    });

    it("should fail if grade not found", async () => {
      // Arrange
      (db.grade.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      // Act
      const result = await updateGrade(gradeId, updateData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("deleteGrade", () => {
    const gradeId = "grade-123";

    it("should delete grade record", async () => {
      // Arrange
      (db.grade.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: gradeId,
      });
      (db.grade.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: gradeId,
      });

      // Act
      const result = await deleteGrade(gradeId);

      // Assert
      expect(result.success).toBe(true);
      expect(db.grade.delete).toHaveBeenCalledWith({ where: { id: gradeId } });
    });

    it("should fail if grade not found", async () => {
      // Arrange
      (db.grade.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      // Act
      const result = await deleteGrade(gradeId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("getGrades", () => {
    it("should return paginated list of grades", async () => {
      // Arrange
      const mockGrades = [
        {
          id: "1",
          score: 85,
          student: { firstName: "John" },
          subject: { name: "Math" },
        },
        {
          id: "2",
          score: 92,
          student: { firstName: "Jane" },
          subject: { name: "Science" },
        },
      ];
      (db.grade.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockGrades,
      );
      (db.grade.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      // Act
      const result = await getGrades({ page: 1, search: "" });

      // Assert
      expect(result.grades).toEqual(mockGrades);
      expect(result.total).toBe(2);
      expect(result.pages).toBe(1);
    });

    it("should filter by subject", async () => {
      // Arrange
      (db.grade.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (db.grade.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      // Act
      await getGrades({ page: 1, subjectId: "subject-123" });

      // Assert
      expect(db.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subjectId: "subject-123",
          }),
        }),
      );
    });

    it("should filter by term", async () => {
      // Arrange
      (db.grade.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (db.grade.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      // Act
      await getGrades({ page: 1, term: "Term 1 2024" });

      // Assert
      expect(db.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            term: "Term 1 2024",
          }),
        }),
      );
    });
  });

  describe("getGradeDistribution", () => {
    it("should return grade distribution for charts", async () => {
      // Arrange
      const mockDistribution = [
        { letterGrade: "A", _count: 15 },
        { letterGrade: "B", _count: 25 },
        { letterGrade: "C", _count: 20 },
        { letterGrade: "D", _count: 10 },
        { letterGrade: "F", _count: 5 },
      ];
      (db.grade.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDistribution,
      );

      // Act
      const result = await getGradeDistribution();

      // Assert
      expect(result).toEqual(mockDistribution);
    });

    it("should filter by subject if provided", async () => {
      // Arrange
      (db.grade.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      // Act
      await getGradeDistribution("subject-123");

      // Assert
      expect(db.grade.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: expect.arrayContaining(["letterGrade"]),
          where: expect.objectContaining({
            subjectId: "subject-123",
          }),
        }),
      );
    });
  });
});
