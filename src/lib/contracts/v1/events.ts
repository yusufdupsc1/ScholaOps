import { z } from "zod";

export const EventCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  location: z.string().optional(),
  type: z
    .enum(["ACADEMIC", "SPORTS", "CULTURAL", "HOLIDAY", "EXAM", "GENERAL"])
    .default("GENERAL"),
});

export const EventListFiltersSchema = z.object({
  type: z.string().default(""),
  upcoming: z.boolean().default(false),
});

export type EventCreateInput = z.infer<typeof EventCreateSchema>;
