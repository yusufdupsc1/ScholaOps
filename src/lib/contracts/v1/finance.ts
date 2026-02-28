import { z } from "zod";

export const FeeCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01),
  dueDate: z.string().min(1),
  term: z.string().min(1),
  academicYear: z.string().min(1),
  feeType: z
    .enum([
      "TUITION",
      "TRANSPORT",
      "LIBRARY",
      "LABORATORY",
      "SPORTS",
      "EXAMINATION",
      "UNIFORM",
      "MISC",
    ])
    .default("TUITION"),
  studentId: z.string().min(1),
  classId: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

export const PaymentCreateSchema = z.object({
  feeId: z.string().min(1),
  amount: z.coerce.number().min(0.01),
  method: z
    .enum(["CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE", "STRIPE"])
    .default("CASH"),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

export const FinanceListFiltersSchema = z.object({
  status: z.string().default(""),
  term: z.string().default(""),
  mode: z.enum(["fees", "summary"]).default("fees"),
});

export type FeeCreateInput = z.infer<typeof FeeCreateSchema>;
export type PaymentCreateInput = z.infer<typeof PaymentCreateSchema>;
