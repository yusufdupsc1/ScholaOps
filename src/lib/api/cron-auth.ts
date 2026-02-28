import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function extractSecret(req: NextRequest) {
  const bearer = req.headers.get("authorization") ?? "";
  if (bearer.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim();
  }
  return req.headers.get("x-cron-secret")?.trim() ?? "";
}

export function requireCronSecret(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? "";
  if (!cronSecret) {
    return apiError(500, "CRON_MISCONFIGURED", "CRON_SECRET is not configured");
  }

  const token = extractSecret(req);
  if (!token || !safeEqual(token, cronSecret)) {
    return apiError(401, "CRON_UNAUTHORIZED", "Invalid cron secret");
  }

  return null;
}
