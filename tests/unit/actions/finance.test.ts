import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createFee,
  updateFee,
  deleteFee,
  getFees,
  recordPayment,
  getFinanceSummary,
} from "@/server/actions/finance";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    fee: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
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

describe("Finance Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createFee", () => {
    const validFormData = {
      title: "Tuition Fee - Term 1 2024",
      amount: 1500,
      dueDate: "2024-09-15",
      term: "Term 1",
      academicYear: "2024-2025",
      feeType: "TUITION" as const,
    };

    it("should create a new fee for a student", async () => {
      // Arrange
      (db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "student-123",
        classId: "class-123",
      });
      (db.fee.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "fee-123",
        ...validFormData,
        status: "UNPAID",
      });

      // Act
      const result = await createFee({
        ...validFormData,
        studentId: "student-123",
      });

      // Assert
      expect(result.success).toBe(true);
      expect(db.fee.create).toHaveBeenCalled();
      expect(db.auditLog.create).toHaveBeenCalled();
    });

    it("should create a fee for an entire class", async () => {
      // Arrange
      (db.class.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "class-123",
      });
      (db.fee.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "fee-123",
        ...validFormData,
        classId: "class-123",
      });

      // Act
      const result = await createFee({
        ...validFormData,
        classId: "class-123",
      });

      // Assert
      expect(result.success).toBe(true);
      expect(db.fee.create).toHaveBeenCalled();
    });

    it("should fail if neither student nor class provided", async () => {
      // Act
      const result = await createFee(validFormData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Student or class");
    });

    it("should validate required fields", async () => {
      // Act
      const result = await createFee({
        title: "",
        amount: 0,
        dueDate: "",
        term: "",
        academicYear: "",
      } as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
    });

    it("should validate amount is positive", async () => {
      // Act
      const result = await createFee({
        ...validFormData,
        amount: -100,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.amount).toBeDefined();
    });
  });

  describe("updateFee", () => {
    const feeId = "fee-123";
    const updateData = {
      title: "Updated Tuition Fee",
      amount: 2000,
      dueDate: "2024-10-01",
    };

    it("should update existing fee", async () => {
      // Arrange
      (db.fee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: feeId,
        status: "UNPAID",
      });
      (db.fee.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: feeId,
        ...updateData,
      });

      // Act
      const result = await updateFee(feeId, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(db.fee.update).toHaveBeenCalled();
    });

    it("should fail if fee not found", async () => {
      // Arrange
      (db.fee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      // Act
      const result = await updateFee(feeId, updateData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should not allow updating paid fees", async () => {
      // Arrange
      (db.fee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: feeId,
        status: "PAID",
      });

      // Act
      const result = await updateFee(feeId, updateData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("paid");
    });
  });

  describe("deleteFee", () => {
    const feeId = "fee-123";

    it("should delete unpaid fee", async () => {
      // Arrange
      (db.fee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: feeId,
        status: "UNPAID",
      });
      (db.fee.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: feeId,
      });

      // Act
      const result = await deleteFee(feeId);

      // Assert
      expect(result.success).toBe(true);
      expect(db.fee.delete).toHaveBeenCalledWith({ where: { id: feeId } });
    });

    it("should not delete paid fees", async () => {
      // Arrange
      (db.fee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: feeId,
        status: "PAID",
      });

      // Act
      const result = await deleteFee(feeId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("paid");
    });
  });

  describe("getFees", () => {
    it("should return paginated list of fees", async () => {
      // Arrange
      const mockFees = [
        { id: "1", title: "Tuition Fee", amount: 1500, status: "UNPAID" },
        { id: "2", title: "Library Fee", amount: 200, status: "PAID" },
      ];
      (db.fee.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockFees);
      (db.fee.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      // Act
      const result = await getFees({ page: 1, search: "" });

      // Assert
      expect(result.fees).toEqual(mockFees);
      expect(result.total).toBe(2);
    });

    it("should filter by status", async () => {
      // Arrange
      (db.fee.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (db.fee.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      // Act
      await getFees({ page: 1, status: "UNPAID" });

      // Assert
      expect(db.fee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "UNPAID",
          }),
        }),
      );
    });

    it("should filter by term", async () => {
      // Arrange
      (db.fee.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (db.fee.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      // Act
      await getFees({ page: 1, term: "Term 1" });

      // Assert
      expect(db.fee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            term: "Term 1",
          }),
        }),
      );
    });
  });

  describe("recordPayment", () => {
    const validPaymentData = {
      feeId: "fee-123",
      amount: 1500,
      method: "CASH" as const,
      transactionRef: "TXN-123456",
      notes: "Payment received",
    };

    it("should record a payment and update fee status", async () => {
      // Arrange
      const mockFee = {
        id: "fee-123",
        amount: 1500,
        status: "UNPAID",
        payments: [],
      };
      (db.fee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockFee);
      (db.payment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "payment-123",
        amount: 1500,
      });

      // Act
      const result = await recordPayment(validPaymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(db.payment.create).toHaveBeenCalled();
      // Fee status should be updated to PAID
      expect(db.fee.update).toHaveBeenCalled();
    });

    it("should set PARTIAL status for partial payments", async () => {
      // Arrange
      const mockFee = {
        id: "fee-123",
        amount: 1500,
        status: "UNPAID",
        payments: [],
      };
      (db.fee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockFee);
      (db.payment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "payment-123",
        amount: 500, // Partial payment
      });

      // Act
      await recordPayment({ ...validPaymentData, amount: 500 });

      // Assert
      expect(db.fee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "PARTIAL" }),
        }),
      );
    });

    it("should fail if fee not found", async () => {
      // Arrange
      (db.fee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      // Act
      const result = await recordPayment(validPaymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should validate required fields", async () => {
      // Act
      const result = await recordPayment({
        feeId: "",
        amount: 0,
        method: "CASH",
      } as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
    });

    it("should generate receipt number", async () => {
      // Arrange
      const mockFee = {
        id: "fee-123",
        amount: 1500,
        status: "UNPAID",
        payments: [],
      };
      (db.fee.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockFee);

      let createCall: any;
      (db.payment.create as ReturnType<typeof vi.fn>).mockImplementation(
        (args) => {
          createCall = args;
          return Promise.resolve({ id: "payment-123", ...args.data });
        },
      );

      // Act
      await recordPayment(validPaymentData);

      // Assert
      expect(createCall.data.receiptNumber).toBeDefined();
      expect(createCall.data.receiptNumber).toMatch(/^RCP-/);
    });
  });

  describe("getFinanceSummary", () => {
    it("should return comprehensive financial summary", async () => {
      // Arrange
      (db.fee.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { status: "UNPAID", _sum: { amount: 5000 } },
        { status: "PAID", _sum: { amount: 15000 } },
        { status: "PARTIAL", _sum: { amount: 2000 } },
      ]);
      (db.fee.count as ReturnType<typeof vi.fn>).mockResolvedValue(15);
      (db.payment.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      // Act
      const result = await getFinanceSummary();

      // Assert
      expect(result.totalFees.amount).toBe(22000);
      expect(result.paidFees.amount).toBe(15000);
      expect(result.pendingFees.amount).toBe(7000); // UNPAID + PARTIAL
    });

    it("should calculate overdue count", async () => {
      // Arrange
      const today = new Date();
      (db.fee.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (db.fee.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: "1",
          status: "UNPAID",
          dueDate: new Date(today.getTime() - 86400000),
        }, // Yesterday
        {
          id: "2",
          status: "UNPAID",
          dueDate: new Date(today.getTime() + 86400000),
        }, // Tomorrow
      ]);

      // Act
      const result = await getFinanceSummary();

      // Assert
      expect(result.overdueCount).toBe(1);
    });
  });
});
