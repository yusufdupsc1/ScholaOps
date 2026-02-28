import { describe, expect, it } from "vitest";
import { can, isPrivilegedRole } from "@/lib/rbac";

describe("rbac policies", () => {
  it("allows admin finance writes", () => {
    expect(can("ADMIN", "finance", "create")).toBe(true);
    expect(can("PRINCIPAL", "finance", "delete")).toBe(true);
  });

  it("blocks student from finance writes", () => {
    expect(can("STUDENT", "finance", "create")).toBe(false);
    expect(can("PARENT", "settings", "update")).toBe(false);
  });

  it("flags privileged roles correctly", () => {
    expect(isPrivilegedRole("SUPER_ADMIN")).toBe(true);
    expect(isPrivilegedRole("ADMIN")).toBe(true);
    expect(isPrivilegedRole("TEACHER")).toBe(false);
  });
});
