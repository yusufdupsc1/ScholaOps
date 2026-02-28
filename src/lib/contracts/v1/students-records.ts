import { z } from "zod";

export const BANGLADESHI_CLASS_OPTIONS = [
  "Pre-Primary",
  "Class One",
  "Class Two",
  "Class Three",
  "Class Four",
  "Class Five",
] as const;

export const BANGLADESHI_SUBJECT_OPTIONS = [
  "Bangla",
  "English",
  "Mathematics",
  "General Science",
  "Bangladesh and Global Studies",
  "Religion",
] as const;

export const StudentRecordTypeSchema = z.enum([
  "ID_CARD",
  "RESULT_SHEET",
  "ATTENDANCE_RECORD",
  "BEHAVIOR_TRACKING",
  "FINAL_EXAM_CERTIFICATE",
  "CHARACTER_CERTIFICATE",
  "EXTRA_SKILLS_CERTIFICATE",
  "TRANSFER_CERTIFICATE",
  "WEEKLY_PROGRESS",
  "MONTHLY_PROGRESS",
  "QUARTERLY_PROGRESS",
  "ANNUAL_FINAL_REPORT",
]);

export const MANUAL_TEMPLATE_OPTIONS = [
  "ID_CARD",
  "RESULT_SHEET",
  "ATTENDANCE_RECORD",
  "BEHAVIOR_TRACKING",
  "FINAL_EXAM_CERTIFICATE",
  "CHARACTER_CERTIFICATE",
  "EXTRA_SKILLS_CERTIFICATE",
  "TRANSFER_CERTIFICATE",
] as const;

export const StudentRecordPeriodTypeSchema = z.enum([
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUAL",
  "CUSTOM",
]);

export const StudentReportGenerateSchema = z.object({
  studentId: z.string().min(1),
  template: StudentRecordTypeSchema,
  classId: z.string().optional(),
  periodType: StudentRecordPeriodTypeSchema.default("CUSTOM"),
  periodLabel: z.string().min(1).max(120).optional(),
  regenerate: z.boolean().default(false),
});

export const StudentRecordListQuerySchema = z.object({
  periodType: StudentRecordPeriodTypeSchema.optional(),
  q: z.string().default(""),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export type StudentReportGenerateInput = z.infer<
  typeof StudentReportGenerateSchema
>;

export type StudentReportTemplate = z.infer<typeof StudentRecordTypeSchema>;
