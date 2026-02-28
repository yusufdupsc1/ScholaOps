import { z } from "zod";

export const TeacherCreateSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  salary: z.string().optional(),
  joiningDate: z.string().optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"])
    .optional(),
  subjectIds: z.array(z.string()).optional(),
});

export const TeacherListFiltersSchema = z.object({
  status: z.string().default("ACTIVE"),
});

export type TeacherCreateInput = z.infer<typeof TeacherCreateSchema>;
