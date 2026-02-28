import { z } from "zod";

export const StudentCreateSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  classId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentPhone: z.string().optional(),
  parentRelation: z.string().optional(),
});

export const StudentListFiltersSchema = z.object({
  classId: z.string().default(""),
  status: z.string().default("ACTIVE"),
});

export type StudentCreateInput = z.infer<typeof StudentCreateSchema>;
