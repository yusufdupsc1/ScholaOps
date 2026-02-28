import { z } from "zod";

export const TwoFactorEnableSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  secret: z.string().min(16),
});

export const TwoFactorDisableSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export const PushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(10),
  }),
});

export type TwoFactorEnableInput = z.infer<typeof TwoFactorEnableSchema>;
export type TwoFactorDisableInput = z.infer<typeof TwoFactorDisableSchema>;
export type PushSubscribeInput = z.infer<typeof PushSubscribeSchema>;
