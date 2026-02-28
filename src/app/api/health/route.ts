// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const start = Date.now();
  const requiredEnv = ["DATABASE_URL", "AUTH_SECRET", "NEXT_PUBLIC_APP_URL"];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);

  try {
    // Test DB connection
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        latency: Date.now() - start,
        services: {
          database: "ok",
          app: "ok",
        },
        checks: {
          dbConnectivity: true,
          envComplete: missingEnv.length === 0,
          missingEnv,
          realtimeProvider: env.REALTIME_PROVIDER,
          aiAssistEnabled: env.ENABLE_AI_ASSIST,
        },
        version: process.env.npm_package_version ?? "2.0.0",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        services: {
          database: "error",
          app: "ok",
        },
        checks: {
          dbConnectivity: false,
          envComplete: missingEnv.length === 0,
          missingEnv,
        },
        error: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
