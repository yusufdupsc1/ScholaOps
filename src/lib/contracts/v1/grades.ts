import { z } from "zod";

export const GradeCreateSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  score: z.coerce.number().min(0),
  maxScore: z.coerce.number().min(1).default(100),
  term: z.string().min(1),
  remarks: z.string().optional(),
});

export const GradeListFiltersSchema = z.object({
  classId: z.string().default(""),
  subjectId: z.string().default(""),
  term: z.string().default(""),
});

export type GradeCreateInput = z.infer<typeof GradeCreateSchema>;
