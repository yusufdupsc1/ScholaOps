import { describe, expect, it } from "vitest";
import {
  createOtpAuthUri,
  generateTotpCode,
  generateTotpSecret,
  verifyTotpCode,
} from "@/lib/totp";

describe("totp", () => {
  it("creates usable secret and verifies generated code", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const code = generateTotpCode(secret, now);

    expect(secret.length).toBeGreaterThan(20);
    expect(verifyTotpCode({ secret, code, timestamp: now })).toBe(true);
  });

  it("rejects invalid code", () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode({ secret, code: "000000" })).toBe(false);
  });

  it("builds valid otpauth URI", () => {
    const secret = generateTotpSecret();
    const uri = createOtpAuthUri({
      issuer: "scholaOps",
      accountName: "admin@school.edu",
      secret,
    });

    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain("issuer=scholaOps");
    expect(uri).toContain(secret);
  });
});
