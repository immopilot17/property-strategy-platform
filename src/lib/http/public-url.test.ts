import { describe, expect, it } from "vitest";
import { createPinnedLookup, isPrivateAddress } from "./public-url";

describe("public URL address validation", () => {
  it.each([
    "127.0.0.1",
    "10.10.1.2",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "::1",
    "fd00::1",
    "ff02::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
  ])("rejects private or special address %s", (address) => {
    expect(isPrivateAddress(address)).toBe(true);
  });

  it.each(["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"])(
    "accepts public address %s",
    (address) => {
      expect(isPrivateAddress(address)).toBe(false);
    },
  );
});

describe("pinned DNS lookup", () => {
  it("returns an address list when Node requests all addresses", async () => {
    const lookup = createPinnedLookup("1.1.1.1", 4);
    const result = await new Promise<unknown>((resolve, reject) => {
      lookup("example.com", { all: true }, (error, addresses) => {
        if (error) reject(error);
        else resolve(addresses);
      });
    });
    expect(result).toEqual([{ address: "1.1.1.1", family: 4 }]);
  });

  it("returns one address for the classic lookup contract", async () => {
    const lookup = createPinnedLookup("2606:4700:4700::1111", 6);
    const result = await new Promise<{ address: unknown; family: number | undefined }>((resolve, reject) => {
      lookup("example.com", {}, (error, address, family) => {
        if (error) reject(error);
        else resolve({ address, family });
      });
    });
    expect(result).toEqual({ address: "2606:4700:4700::1111", family: 6 });
  });
});
