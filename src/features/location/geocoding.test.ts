import { describe, expect, it } from "vitest";
import {
  getGeocodingMode,
  isValidGermanPostalCode,
  resolveLocation,
  type GeocodingMode,
  type GeocodingProvider
} from "./geocoding";

const validAddress = {
  street: "Königstraße",
  houseNumber: "1",
  postalCode: "70173",
  city: "Stuttgart"
};

function provider(
  geocode: GeocodingProvider["geocode"],
  id = crypto.randomUUID()
): GeocodingProvider {
  return { id, geocode };
}

describe("Standortauflösung", () => {
  it("erkennt eine gültige deutsche PLZ", async () => {
    expect(isValidGermanPostalCode("70173")).toBe(true);
    const outcome = await resolveLocation(validAddress, provider(async () => ({
      latitude: 48.7784,
      longitude: 9.1801,
      city: "Stuttgart",
      postalCode: "70173",
      displayName: "Königstraße 1, Stuttgart",
      houseNumber: "1"
    })), { useCache: false });
    expect(outcome.status).toBe("found");
    expect(outcome.result?.city).toBe("Stuttgart");
  });

  it("meldet eine unbekannte PLZ als nicht gefunden", async () => {
    const outcome = await resolveLocation(
      { ...validAddress, postalCode: "00000" },
      provider(async () => null),
      { useCache: false }
    );
    expect(outcome.status).toBe("not_found");
  });

  it("nutzt ohne Hausnummer nur den ungefähren PLZ-Standort", async () => {
    let requestedMode: GeocodingMode | null = null;
    const address = { ...validAddress, houseNumber: "" };
    expect(getGeocodingMode(address)).toBe("postal");
    const outcome = await resolveLocation(address, provider(async (_address, mode) => {
      requestedMode = mode;
      return {
        latitude: 48.7758,
        longitude: 9.1829,
        city: "Stuttgart",
        postalCode: "70173",
        displayName: "70173 Stuttgart",
        houseNumber: null
      };
    }), { useCache: false });
    expect(requestedMode).toBe("postal");
    expect(outcome.result?.precision).toBe("approximate");
  });

  it("behandelt eine fehlgeschlagene Geocoding-Anfrage verständlich", async () => {
    const outcome = await resolveLocation(validAddress, provider(async () => {
      throw new Error("provider unavailable");
    }), { useCache: false });
    expect(outcome.status).toBe("unavailable");
    expect(outcome.message).toContain("nicht gesucht");
  });
});
