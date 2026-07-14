import { describe, expect, it } from "vitest";
import { hasRole, isAppRole } from "./roles";

describe("application RBAC", () => {
  it("enforces Founder > Admin > User", () => {
    expect(hasRole("founder", "founder")).toBe(true);
    expect(hasRole("founder", "admin")).toBe(true);
    expect(hasRole("founder", "user")).toBe(true);
    expect(hasRole("admin", "founder")).toBe(false);
    expect(hasRole("admin", "admin")).toBe(true);
    expect(hasRole("user", "admin")).toBe(false);
  });

  it("rejects unknown or package-derived roles", () => {
    expect(isAppRole("founder")).toBe(true);
    expect(isAppRole("premium")).toBe(false);
    expect(isAppRole("administrator")).toBe(false);
  });
});
