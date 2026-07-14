import { beforeEach, describe, expect, it } from "vitest";
import { resetRateLimitsForTests, takeRateLimit } from "./rate-limit";

describe("takeRateLimit", () => {
  beforeEach(() => resetRateLimitsForTests());

  it("blocks requests after the configured limit", () => {
    expect(takeRateLimit("client", 2, 1_000, 100)).toBe(true);
    expect(takeRateLimit("client", 2, 1_000, 200)).toBe(true);
    expect(takeRateLimit("client", 2, 1_000, 300)).toBe(false);
  });

  it("opens a fresh window after expiry", () => {
    expect(takeRateLimit("client", 1, 1_000, 100)).toBe(true);
    expect(takeRateLimit("client", 1, 1_000, 1_100)).toBe(true);
  });
});
