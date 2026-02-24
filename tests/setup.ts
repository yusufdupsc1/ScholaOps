import { beforeAll, afterAll, vi } from "vitest";
import "@testing-library/jest-dom";

// ============================================
// MOCKS CONFIGURATION
// ============================================

// Mock NextAuth auth() function
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma client
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    teacher: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    subject: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    attendance: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    grade: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    fee: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    event: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    announcement: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    institution: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    institutionSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(vi.fn())),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

// Mock email service
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, id: "test-email-id" }),
  passwordResetEmail: vi.fn().mockReturnValue("<html>Reset Email</html>"),
  welcomeEmail: vi.fn().mockReturnValue("<html>Welcome Email</html>"),
  newStudentEmail: vi.fn().mockReturnValue("<html>New Student Email</html>"),
}));

// Mock environment variables
vi.mock("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    AUTH_SECRET: "test-secret-key-minimum-32-characters-here",
    AUTH_URL: "http://localhost:3000",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NODE_ENV: "test",
    RESEND_API_KEY: "test-resend-key",
    EMAIL_FROM: "test@example.com",
  },
}));

// Mock rate limiter
vi.mock("@/lib/rate-limit", () => ({
  rateLimiter: {
    check: vi.fn().mockReturnValue(true),
    getRemaining: vi.fn().mockReturnValue(99),
  },
  checkRateLimit: vi
    .fn()
    .mockReturnValue({
      success: true,
      remaining: 99,
      resetAt: Date.now() + 60000,
    }),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock redirect
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

// ============================================
// GLOBAL TEST UTILITIES
// ============================================

declare global {
  namespace Vi {
    interface Matchers<T> extends jest.Matchers<T> {}
  }
}

// Helper to create mock session
export function createMockSession(overrides = {}) {
  return {
    user: {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      role: "ADMIN",
      institutionId: "inst-123",
      institutionName: "Test School",
      institutionSlug: "test-school",
      ...overrides,
    },
  };
}

// Helper to create mock user
export function createMockUser(overrides = {}) {
  return {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    password: "$2a$12$hash", // bcrypt hash for "password123"
    role: "ADMIN",
    isActive: true,
    emailVerified: new Date(),
    image: null,
    institutionId: "inst-123",
    institution: {
      name: "Test School",
      slug: "test-school",
    },
    ...overrides,
  };
}

// Helper to create mock student
export function createMockStudent(overrides = {}) {
  return {
    id: "student-123",
    studentId: "STU-2024-0001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@student.school.com",
    gender: "MALE",
    dateOfBirth: new Date("2010-01-01"),
    status: "ACTIVE",
    classId: "class-123",
    institutionId: "inst-123",
    class: {
      name: "Grade 9A",
      grade: "9",
      section: "A",
    },
    ...overrides,
  };
}

// Helper to create mock teacher
export function createMockTeacher(overrides = {}) {
  return {
    id: "teacher-123",
    teacherId: "TCH-2024-001",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@school.com",
    gender: "FEMALE",
    status: "ACTIVE",
    salary: 55000,
    specialization: "Mathematics",
    institutionId: "inst-123",
    ...overrides,
  };
}

// Helper to create mock class
export function createMockClass(overrides = {}) {
  return {
    id: "class-123",
    name: "Grade 9A",
    grade: "9",
    section: "A",
    capacity: 30,
    academicYear: "2024-2025",
    isActive: true,
    institutionId: "inst-123",
    classTeacher: {
      firstName: "Jane",
      lastName: "Smith",
    },
    _count: {
      students: 25,
    },
    ...overrides,
  };
}

// Helper to create mock institution
export function createMockInstitution(overrides = {}) {
  return {
    id: "inst-123",
    name: "Test School",
    slug: "test-school",
    email: "admin@testschool.com",
    phone: "+1234567890",
    address: "123 Test Street",
    city: "Test City",
    country: "US",
    timezone: "America/New_York",
    currency: "USD",
    plan: "PROFESSIONAL",
    planExpiry: new Date("2025-12-31"),
    ...overrides,
  };
}

// Helper to create mock fee
export function createMockFee(overrides = {}) {
  return {
    id: "fee-123",
    title: "Tuition Fee - Term 1 2024",
    amount: 1500,
    dueDate: new Date("2024-09-15"),
    term: "Term 1",
    academicYear: "2024-2025",
    feeType: "TUITION",
    status: "UNPAID",
    studentId: "student-123",
    classId: "class-123",
    institutionId: "inst-123",
    ...overrides,
  };
}

// Helper to create mock payment
export function createMockPayment(overrides = {}) {
  return {
    id: "payment-123",
    amount: 1500,
    method: "CASH",
    transactionRef: "TXN-123456",
    receiptNumber: "RCP-123456",
    paidAt: new Date(),
    notes: "Payment received",
    feeId: "fee-123",
    institutionId: "inst-123",
    ...overrides,
  };
}

// Helper to create mock attendance
export function createMockAttendance(overrides = {}) {
  return {
    id: "attendance-123",
    date: new Date(),
    status: "PRESENT",
    studentId: "student-123",
    classId: "class-123",
    institutionId: "inst-123",
    ...overrides,
  };
}

// Helper to create mock grade
export function createMockGrade(overrides = {}) {
  return {
    id: "grade-123",
    score: 85,
    maxScore: 100,
    percentage: 85,
    letterGrade: "B",
    term: "Term 1 2024",
    remarks: "Good progress",
    studentId: "student-123",
    subjectId: "subject-123",
    institutionId: "inst-123",
    student: {
      firstName: "John",
      lastName: "Doe",
      studentId: "STU-2024-0001",
      class: { name: "Grade 9A" },
    },
    subject: {
      name: "Mathematics",
      code: "MATH",
    },
    ...overrides,
  };
}

// Helper to create mock event
export function createMockEvent(overrides = {}) {
  return {
    id: "event-123",
    title: "Annual Sports Day",
    description: "School annual sports event",
    startDate: new Date("2025-03-15"),
    endDate: new Date("2025-03-15"),
    location: "School Ground",
    type: "SPORTS",
    institutionId: "inst-123",
    ...overrides,
  };
}

// Helper to create mock announcement
export function createMockAnnouncement(overrides = {}) {
  return {
    id: "announcement-123",
    title: "Welcome Back",
    content: "Welcome to the new academic year",
    priority: "NORMAL",
    targetAudience: ["ALL"],
    publishedAt: new Date(),
    expiresAt: null,
    institutionId: "inst-123",
    ...overrides,
  };
}

// Helper to create mock action result
export function createMockActionResult<T>(data: T, success = true) {
  return success
    ? { success: true, data }
    : { success: false, error: "Action failed" };
}

// ============================================
// BEFORE/AFTER HOOKS
// ============================================

beforeAll(() => {
  // Set up test environment
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
});

afterAll(() => {
  // Clean up
  vi.clearAllMocks();
});

export {};
