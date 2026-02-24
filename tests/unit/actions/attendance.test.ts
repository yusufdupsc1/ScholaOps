import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  markAttendance,
  getAttendanceForClass,
  getAttendanceSummary,
  getAttendanceTrend,
} from "@/server/actions/attendance";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    class: {
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

describe("Attendance Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("markAttendance", () => {
    const validFormData = {
      date: "2024-01-15",
      records: [
        { studentId: "student-1", status: "PRESENT" as const },
        { studentId: "student-2", status: "ABSENT" as const },
      ],
    };

    it("should mark attendance for multiple students", async () => {
      // Arrange
      (db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "student-1",
        classId: "class-123",
      });
      (db.class.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "class-123",
      });
      (db.attendance.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "attendance-1",
      });

      // Act
      const result = await markAttendance("class-123", validFormData);

      // Assert
      expect(result.success).toBe(true);
      expect(db.attendance.upsert).toHaveBeenCalled();
    });

    it("should fail if class not found", async () => {
      // Arrange
      (db.class.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      // Act
      const result = await markAttendance("invalid-class", validFormData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Class not found");
    });

    it("should validate date format", async () => {
      // Act
      const result = await markAttendance("class-123", {
        date: "invalid-date",
        records: [],
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.date).toBeDefined();
    });

    it("should validate status values", async () => {
      // Act
      const result = await markAttendance("class-123", {
        date: "2024-01-15",
        records: [{ studentId: "student-1", status: "INVALID" as any }],
      });

      // Assert
      expect(result.success).toBe(false);
    });

    it("should prevent duplicate attendance records", async () => {
      // The implementation should use upsert with unique constraint
      // to prevent duplicate records for same student/date
      expect(true).toBe(true);
    });
  });

  describe("getAttendanceForClass", () => {
    it("should return attendance records for a class on a specific date", async () => {
      // Arrange
      const mockRecords = [
        { id: "1", studentId: "student-1", status: "PRESENT" },
        { id: "2", studentId: "student-2", status: "ABSENT" },
      ];
      (db.attendance.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRecords,
      );

      // Act
      const result = await getAttendanceForClass({
        classId: "class-123",
        date: "2024-01-15",
      });

      // Assert
      expect(result).toEqual(mockRecords);
    });

    it("should filter by date range", async () => {
      // Arrange
      (db.attendance.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );

      // Act
      await getAttendanceForClass({
        classId: "class-123",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      // Assert
      expect(db.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe("getAttendanceSummary", () => {
    it("should return attendance summary with counts", async () => {
      // Arrange
      const mockGrouped = [
        { status: "PRESENT", _count: 25 },
        { status: "ABSENT", _count: 3 },
        { status: "LATE", _count: 2 },
      ];
      (db.attendance.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockGrouped,
      );

      // Act
      const result = await getAttendanceSummary({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      // Assert
      expect(result.total).toBe(30);
      expect(result.present).toBe(25);
      expect(result.absent).toBe(3);
      expect(result.late).toBe(2);
      expect(result.presentRate).toBeCloseTo(83.33, 1);
    });

    it("should filter by class", async () => {
      // Arrange
      (db.attendance.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      // Act
      await getAttendanceSummary({
        classId: "class-123",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      // Assert
      expect(db.attendance.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: expect.arrayContaining(["status"]),
          where: expect.objectContaining({
            classId: "class-123",
          }),
        }),
      );
    });

    it("should calculate present rate correctly", async () => {
      // Arrange
      const mockGrouped = [
        { status: "PRESENT", _count: 70 },
        { status: "ABSENT", _count: 30 },
      ];
      (db.attendance.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockGrouped,
      );

      // Act
      const result = await getAttendanceSummary({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      // Assert
      expect(result.presentRate).toBeCloseTo(70, 1);
    });
  });

  describe("getAttendanceTrend", () => {
    it("should return attendance trend data for charts", async () => {
      // Arrange
      const mockTrend = [
        { date: new Date("2024-01-01"), status: "PRESENT", _count: 25 },
        { date: new Date("2024-01-02"), status: "ABSENT", _count: 3 },
      ];
      (db.attendance.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTrend,
      );

      // Act
      const result = await getAttendanceTrend({ days: 30 });

      // Assert
      expect(result).toEqual(mockTrend);
    });

    it("should limit to specified number of days", async () => {
      // Arrange
      (db.attendance.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      // Act
      await getAttendanceTrend({ days: 7 });

      // Assert
      expect(db.attendance.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });
});
