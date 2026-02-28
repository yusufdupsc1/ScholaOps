import { z } from "zod";

export const AttendanceEntrySchema = z.object({
  studentId: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED", "HOLIDAY"]),
  remarks: z.string().optional(),
});

export const AttendanceMarkSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  entries: z.array(AttendanceEntrySchema).min(1),
});

export type AttendanceMarkInput = z.infer<typeof AttendanceMarkSchema>;
