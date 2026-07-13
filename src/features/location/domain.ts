import { z } from "zod";

export const germanPostalCodePattern = /^\d{5}$/;

const baseAddressSchema = z.object({
  street: z.string().trim().max(150).default(""),
  houseNumber: z.string().trim().max(30).default(""),
  postalCode: z.string().trim().max(5).default(""),
  city: z.string().trim().max(100).default("")
});

export const geocodingAddressSchema = baseAddressSchema.extend({
  postalCode: z.string().trim().regex(germanPostalCodePattern, "Postleitzahl muss fünfstellig sein.")
});

export const locationAddressSchema = baseAddressSchema.extend({
  postalCode: z.string().trim().regex(/^$|^\d{5}$/, "Postleitzahl muss fünfstellig sein.").default(""),
  latitude: z.number().finite().min(-90).max(90).nullable().default(null),
  longitude: z.number().finite().min(-180).max(180).nullable().default(null),
  locationSource: z.string().trim().max(100).nullable().default(null),
  geocodedAt: z.string().datetime().nullable().default(null)
});

export type GeocodingAddress = z.infer<typeof geocodingAddressSchema>;
export type LocationAddress = z.infer<typeof locationAddressSchema>;
export type GeocodingPrecision = "exact" | "approximate";
export type GeocodingResult = {
  latitude: number;
  longitude: number;
  city: string;
  postalCode: string;
  displayName: string;
  precision: GeocodingPrecision;
  source: string;
  geocodedAt: string;
};
export type GeocodingOutcome =
  | { status: "found"; result: GeocodingResult; message: string }
  | { status: "not_found" | "unavailable"; result: null; message: string };
