import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { requireCronSecret } from "@/lib/api/cron-auth";

describe("requireCronSecret", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
  });

  it("accepts valid bearer secret", () => {
    const req = new NextRequest("http://localhost/api/cron/progress-weekly", {
      method: "POST",
      headers: {
        authorization: "Bearer test-cron-secret",
      },
    });

    expect(requireCronSecret(req)).toBeNull();
  });

  it("rejects invalid secret", async () => {
    const req = new NextRequest("http://localhost/api/cron/progress-weekly", {
      method: "POST",
      headers: {
        authorization: "Bearer invalid-secret",
      },
    });

    const response = requireCronSecret(req);
    expect(response).not.toBeNull();

    const json = await response?.json();
    expect(response?.status).toBe(401);
    expect(json?.error?.code).toBe("CRON_UNAUTHORIZED");
  });

  it("accepts x-cron-secret header", () => {
    const req = new NextRequest("http://localhost/api/cron/progress-weekly", {
      method: "POST",
      headers: {
        "x-cron-secret": "test-cron-secret",
      },
    });

    expect(requireCronSecret(req)).toBeNull();
  });
});
