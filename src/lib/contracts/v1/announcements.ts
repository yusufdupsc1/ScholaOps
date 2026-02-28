import { z } from "zod";

export const AnnouncementCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  targetAudience: z.array(z.string()).default(["ALL"]),
  expiresAt: z.string().optional(),
});

export const AnnouncementListFiltersSchema = z.object({
  priority: z.string().default(""),
  activeOnly: z.boolean().default(false),
});

export type AnnouncementCreateInput = z.infer<typeof AnnouncementCreateSchema>;
