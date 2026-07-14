import { describe, expect, it } from "vitest";
import { getPaymentPackage, hasTier, isAccessTier } from "./packages";

describe("payment package access", () => {
  it("does not expose the founder tier as a purchasable package", () => {
    expect(getPaymentPackage("founder")).toBeUndefined();
  });

  it("keeps paid packages purchasable", () => {
    expect(getPaymentPackage("starter")?.priceCents).toBe(799);
    expect(getPaymentPackage("premium")?.priceCents).toBe(2499);
  });

  it("treats founder as the highest access tier", () => {
    expect(hasTier("founder", "premium")).toBe(true);
    expect(hasTier("free", "starter")).toBe(false);
    expect(isAccessTier("founder")).toBe(true);
    expect(isAccessTier("administrator")).toBe(false);
  });
});
