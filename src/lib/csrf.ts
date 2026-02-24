// src/lib/csrf.ts
// CSRF protection utilities

import { cookies } from "next/headers";

const CSRF_TOKEN_LENGTH = 32;

export async function generateCsrfToken(): Promise<string> {
  const crypto = await import("crypto");
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("csrf-token")?.value;
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  const storedToken = await getCsrfToken();
  if (!storedToken) return false;

  // Timing-safe comparison
  const crypto = await import("crypto");
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
}

// Server action wrapper for CSRF protection
export async function withCsrfProtection<T>(
  action: () => Promise<T>,
  csrfToken?: string,
): Promise<T> {
  // In development, skip CSRF for easier testing
  if (process.env.NODE_ENV === "development") {
    return action();
  }

  // Server Actions in Next.js have built-in CSRF protection
  // Additional validation can be added here if needed

  // Validate CSRF token for mutations
  if (csrfToken) {
    const isValid = await validateCsrfToken(csrfToken);
    if (!isValid) {
      throw new Error("Invalid CSRF token");
    }
  }

  return action();
}

// Middleware helper to add CSRF token to response headers
export function getCsrfTokenHeader(): Record<string, string> {
  // This is typically handled by a server action or API route
  // that generates and returns the token
  return {
    "X-CSRF-Token": "fetch-this-from-server-action",
  };
}
