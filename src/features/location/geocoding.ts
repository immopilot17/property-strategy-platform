import { z } from "zod";
import {
  geocodingAddressSchema,
  germanPostalCodePattern,
  type GeocodingAddress,
  type GeocodingOutcome
} from "./domain";

export type GeocodingMode = "full" | "postal";

export type ProviderLocation = {
  latitude: number;
  longitude: number;
  city: string;
  postalCode: string;
  displayName: string;
  houseNumber: string | null;
};

export interface GeocodingProvider {
  id: string;
  geocode(address: GeocodingAddress, mode: GeocodingMode): Promise<ProviderLocation | null>;
}

const nominatimResultSchema = z.object({
  lat: z.string(),
  lon: z.string(),
  display_name: z.string().default(""),
  address: z.record(z.unknown()).optional()
});

const cache = new Map<string, { expiresAt: number; outcome: GeocodingOutcome }>();
const foundCacheTtl = 24 * 60 * 60 * 1000;
const notFoundCacheTtl = 15 * 60 * 1000;
const maximumCacheEntries = 500;
let providerQueue: Promise<void> = Promise.resolve();
let lastProviderRequestAt = 0;

export function isValidGermanPostalCode(value: string): boolean {
  return germanPostalCodePattern.test(value.trim());
}

export function getGeocodingMode(address: GeocodingAddress): GeocodingMode | null {
  if (!isValidGermanPostalCode(address.postalCode)) return null;
  return address.street.trim() && address.houseNumber.trim() && address.city.trim() ? "full" : "postal";
}

export function normalizeAddressKey(address: GeocodingAddress, mode = getGeocodingMode(address)): string {
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("de-DE");
  if (mode === "postal") return [mode, "", "", address.postalCode.trim(), ""].join("|");
  return [mode ?? "invalid", normalize(address.street), normalize(address.houseNumber), address.postalCode.trim(), normalize(address.city)].join("|");
}

function addressValue(address: Record<string, unknown> | undefined, keys: string[]): string {
  for (const key of keys) {
    const value = address?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function scheduleProviderRequest<T>(request: () => Promise<T>): Promise<T> {
  const run = async () => {
    const wait = Math.max(0, 1000 - (Date.now() - lastProviderRequestAt));
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastProviderRequestAt = Date.now();
    return request();
  };
  const result = providerQueue.then(run, run);
  providerQueue = result.then(() => undefined, () => undefined);
  return result;
}

const nominatimProvider: GeocodingProvider = {
  id: "nominatim",
  async geocode(address, mode) {
    const baseUrl = process.env.GEOCODING_BASE_URL?.trim() || "https://nominatim.openstreetmap.org";
    const endpoint = new URL("search", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("addressdetails", "1");
    endpoint.searchParams.set("limit", "1");
    endpoint.searchParams.set("countrycodes", "de");
    endpoint.searchParams.set("accept-language", "de");
    endpoint.searchParams.set("postalcode", address.postalCode);
    if (mode === "full") {
      endpoint.searchParams.set("street", `${address.houseNumber} ${address.street}`.trim());
      endpoint.searchParams.set("city", address.city);
    }
    if (process.env.GEOCODING_CONTACT_EMAIL?.trim()) {
      endpoint.searchParams.set("email", process.env.GEOCODING_CONTACT_EMAIL.trim());
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://property-strategy-platform.vercel.app";
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Language": "de",
      "User-Agent": process.env.GEOCODING_USER_AGENT?.trim() || `PropertyStrategyPlatform/1.0 (+${appUrl})`
    };
    if (/^https?:\/\//.test(appUrl)) headers.Referer = appUrl;

    const response = await scheduleProviderRequest(() => fetch(endpoint, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    }));
    if (!response.ok) throw new Error(`Geocoding provider returned ${response.status}`);

    const parsed = z.array(nominatimResultSchema).safeParse(await response.json());
    if (!parsed.success || !parsed.data[0]) return null;
    const item = parsed.data[0];
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return {
      latitude,
      longitude,
      city: addressValue(item.address, ["city", "town", "village", "municipality", "county"]) || address.city,
      postalCode: addressValue(item.address, ["postcode"]) || address.postalCode,
      displayName: item.display_name,
      houseNumber: addressValue(item.address, ["house_number"]) || null
    };
  }
};

function readCache(key: string): GeocodingOutcome | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.outcome;
}

function writeCache(key: string, outcome: GeocodingOutcome): void {
  if (cache.size >= maximumCacheEntries) {
    const oldestKey = cache.keys().next().value;
    if (typeof oldestKey === "string") cache.delete(oldestKey);
  }
  cache.set(key, {
    expiresAt: Date.now() + (outcome.status === "found" ? foundCacheTtl : notFoundCacheTtl),
    outcome
  });
}

export async function resolveLocation(
  input: GeocodingAddress,
  provider: GeocodingProvider = nominatimProvider,
  options: { useCache?: boolean } = {}
): Promise<GeocodingOutcome> {
  const parsed = geocodingAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "not_found", result: null, message: "Standort nicht gefunden." };
  }

  const mode = getGeocodingMode(parsed.data);
  if (!mode) return { status: "not_found", result: null, message: "Standort nicht gefunden." };
  const cacheKey = `${provider.id}|${normalizeAddressKey(parsed.data, mode)}`;
  if (options.useCache !== false) {
    const cached = readCache(cacheKey);
    if (cached) return cached;
  }

  try {
    let resolvedMode = mode;
    let location = await provider.geocode(parsed.data, mode);
    if (!location && mode === "full") {
      resolvedMode = "postal";
      location = await provider.geocode(parsed.data, resolvedMode);
    }
    if (!location) {
      const outcome: GeocodingOutcome = { status: "not_found", result: null, message: "Standort nicht gefunden." };
      if (options.useCache !== false) writeCache(cacheKey, outcome);
      return outcome;
    }

    const approximate = resolvedMode === "postal" || !location.houseNumber;
    const outcome: GeocodingOutcome = {
      status: "found",
      message: approximate ? "Ungefährer Standort gefunden." : "Standort gefunden.",
      result: {
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        postalCode: location.postalCode,
        displayName: location.displayName,
        precision: approximate ? "approximate" : "exact",
        source: resolvedMode === "postal" ? `${provider.id}_postal_code` : provider.id,
        geocodedAt: new Date().toISOString()
      }
    };
    if (options.useCache !== false) writeCache(cacheKey, outcome);
    return outcome;
  } catch {
    return {
      status: "unavailable",
      result: null,
      message: "Standort konnte gerade nicht gesucht werden. Bitte später erneut versuchen."
    };
  }
}
