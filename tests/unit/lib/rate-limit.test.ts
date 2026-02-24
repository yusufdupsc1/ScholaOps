import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { rateLimiter, checkRateLimit, withRateLimit } from "@/lib/rate-limit";

describe("Rate Limiter", () => {
  beforeEach(() => {
    // Reset the rate limiter before each test
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rateLimiter.check", () => {
    it("should allow requests under limit", () => {
      const result = rateLimiter.check("test-key", 10, 60);
      expect(result).toBe(true);
    });

    it("should track request count", () => {
      rateLimiter.check("test-key-2", 5, 60);
      rateLimiter.check("test-key-2", 5, 60);
      const result = rateLimiter.check("test-key-2", 5, 60);
      expect(result).toBe(true);
    });

    it("should block requests over limit", () => {
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.check("test-key-3", 5, 60);
      }

      // Next request should be blocked
      const result = rateLimiter.check("test-key-3", 5, 60);
      expect(result).toBe(false);
    });

    it("should reset after window expires", () => {
      // Use up the limit
      for (let i = 0; i < 3; i++) {
        rateLimiter.check("test-key-4", 3, 60);
      }

      // Advance time past the window
      vi.advanceTimersByTime(61000);

      // Should be allowed again
      const result = rateLimiter.check("test-key-4", 3, 60);
      expect(result).toBe(true);
    });

    it("should track different keys separately", () => {
      // Fill up key1
      for (let i = 0; i < 3; i++) {
        rateLimiter.check("key1", 3, 60);
      }

      // key2 should still be empty
      const result = rateLimiter.check("key2", 3, 60);
      expect(result).toBe(true);
    });
  });

  describe("rateLimiter.getRemaining", () => {
    it("should return remaining requests", () => {
      rateLimiter.check("test-remain", 10, 60);
      const remaining = rateLimiter.getRemaining("test-remain");
      expect(remaining).toBeLessThanOrEqual(100);
    });

    it("should return 0 for expired keys", () => {
      rateLimiter.check("test-expired", 10, 60);
      vi.advanceTimersByTime(61000);
      const remaining = rateLimiter.getRemaining("test-expired");
      expect(remaining).toBe(0);
    });

    it("should return 0 for unknown keys", () => {
      const remaining = rateLimiter.getRemaining("unknown-key");
      expect(remaining).toBe(0);
    });
  });

  describe("checkRateLimit", () => {
    it("should return success object when allowed", () => {
      const result = checkRateLimit("test-check", 10, 60);

      expect(result.success).toBe(true);
      expect(result.remaining).toBeDefined();
      expect(result.resetAt).toBeDefined();
    });

    it("should return failure when limit exceeded", () => {
      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit("test-fail", 10, 60);
      }

      const result = checkRateLimit("test-fail", 10, 60);

      expect(result.success).toBe(false);
    });
  });

  describe("withRateLimit", () => {
    it("should return success for allowed requests", async () => {
      const mockRequest = new Request("http://localhost/test", {
        method: "GET",
      });

      const result = await withRateLimit(mockRequest, {
        limit: 10,
        windowSeconds: 60,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });

    it("should return 429 when rate limited", async () => {
      const mockRequest = new Request("http://localhost/test-rate", {
        method: "GET",
      });

      // Exhaust the default limit
      for (let i = 0; i < 100; i++) {
        await withRateLimit(mockRequest, { limit: 100, windowSeconds: 60 });
      }

      const result = await withRateLimit(mockRequest, {
        limit: 100,
        windowSeconds: 60,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(429);
    });

    it("should use custom identifier when provided", async () => {
      const mockRequest = new Request("http://localhost/test-ident", {
        method: "GET",
        headers: {
          "x-forwarded-for": "1.2.3.4",
        },
      });

      const result = await withRateLimit(mockRequest, {
        limit: 10,
        windowSeconds: 60,
        identifier: "custom-identifier",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("should clean up expired entries", () => {
      const key = "cleanup-test";
      rateLimiter.check(key, 10, 1); // 1 second window

      // Entry should exist
      expect(rateLimiter.getRemaining(key)).toBeGreaterThan(0);

      // Advance time past expiry
      vi.advanceTimersByTime(2000);

      // Entry should be cleaned up
      expect(rateLimiter.getRemaining(key)).toBe(0);
    });
  });
});
