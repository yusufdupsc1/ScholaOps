import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  getInitials,
  slugify,
  generateReceiptNumber,
  getAttendanceColor,
  calcPercentage,
} from "@/lib/utils";

describe("Utility Functions", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      const result = cn("foo", "bar");
      expect(result).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      const result = cn("foo", false && "bar", "baz");
      expect(result).toBe("foo baz");
    });

    it("should handle arrays", () => {
      const result = cn(["foo", "bar"]);
      expect(result).toBe("foo bar");
    });
  });

  describe("formatCurrency", () => {
    it("should format number as USD by default", () => {
      expect(formatCurrency(1000)).toBe("$1,000");
    });

    it("should format string number", () => {
      expect(formatCurrency("1500.50")).toBe("$1,500.5");
    });

    it("should handle different currencies", () => {
      expect(formatCurrency(1000, "EUR")).toContain("1,000");
    });

    it("should handle zero", () => {
      expect(formatCurrency(0)).toBe("$0");
    });
  });

  describe("formatDate", () => {
    it("should format date object", () => {
      const result = formatDate(new Date("2024-01-15"));
      expect(result).toContain("Jan");
      expect(result).toContain("15");
      expect(result).toContain("2024");
    });

    it("should format date string", () => {
      const result = formatDate("2024-01-15");
      expect(result).toContain("Jan");
    });

    it("should accept custom options", () => {
      const result = formatDate(new Date("2024-01-15"), { day: "numeric" });
      expect(result).toBe("15");
    });
  });

  describe("getInitials", () => {
    it("should return first two letters of two-word name", () => {
      expect(getInitials("John Doe")).toBe("JD");
    });

    it("should return first letter of single-word name", () => {
      expect(getInitials("John")).toBe("J");
    });

    it("should handle three-word names", () => {
      expect(getInitials("John Michael Doe")).toBe("JM");
    });

    it("should handle lowercase", () => {
      expect(getInitials("john doe")).toBe("JD");
    });
  });

  describe("slugify", () => {
    it("should convert string to slug", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("should remove special characters", () => {
      expect(slugify("Hello @World!")).toBe("hello-world");
    });

    it("should handle multiple spaces", () => {
      expect(slugify("Hello    World")).toBe("hello-world");
    });

    it("should handle empty string", () => {
      expect(slugify("")).toBe("");
    });
  });

  describe("generateReceiptNumber", () => {
    it("should generate receipt with RCP prefix", () => {
      const result = generateReceiptNumber();
      expect(result).toMatch(/^RCP-/);
    });

    it("should generate unique numbers", () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(generateReceiptNumber());
      }
      // Should have mostly unique values (allowing for minimal collisions)
      expect(results.size).toBeGreaterThan(90);
    });
  });

  describe("getAttendanceColor", () => {
    it("should return success for >= 90%", () => {
      expect(getAttendanceColor(90)).toBe("text-success");
      expect(getAttendanceColor(100)).toBe("text-success");
    });

    it("should return warning for 75-89%", () => {
      expect(getAttendanceColor(75)).toBe("text-warning");
      expect(getAttendanceColor(89)).toBe("text-warning");
    });

    it("should return destructive for < 75%", () => {
      expect(getAttendanceColor(74)).toBe("text-destructive");
      expect(getAttendanceColor(50)).toBe("text-destructive");
    });
  });

  describe("calcPercentage", () => {
    it("should calculate percentage correctly", () => {
      expect(calcPercentage(25, 100)).toBe(25);
      expect(calcPercentage(1, 4)).toBe(25);
    });

    it("should handle zero total", () => {
      expect(calcPercentage(10, 0)).toBe(0);
    });

    it("should round to nearest integer", () => {
      expect(calcPercentage(1, 3)).toBe(33);
    });
  });
});
