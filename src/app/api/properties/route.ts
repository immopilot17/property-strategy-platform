import { z } from "zod";
import { resolveLocation } from "@/features/location/geocoding";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const propertySchema = z.object({
  street: z.string().trim().max(150).default(""),
  house_number: z.string().trim().max(30).default(""),
  city: z.string().trim().max(100).default(""),
  postal_code: z.string().trim().regex(/^\d{5}$/),
  country: z.string().min(1).max(100),
  lat: z.number().finite().min(-90).max(90).nullable().optional(),
  lon: z.number().finite().min(-180).max(180).nullable().optional(),
  location_source: z.string().trim().max(100).nullable().optional(),
  geocoded_at: z.string().datetime().nullable().optional(),
  metadata: z.record(z.unknown()).optional()
});

async function authenticatedClient() {
  if (!isSupabaseConfigured()) return { error: "not_configured" as const };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { error: "unauthorized" as const };
  return { supabase, user: data.user };
}

export async function GET() {
  const auth = await authenticatedClient();
  if ("error" in auth) {
    return Response.json(
      { ok: false, error: auth.error },
      { status: auth.error === "unauthorized" ? 401 : 503 }
    );
  }

  const { data, error } = await auth.supabase
    .from("properties")
    .select(
      "id,owner_id,address_line1,street,house_number,city,postal_code,country,lat,lon,location_source,geocoded_at,metadata,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });
  return Response.json({ ok: true, properties: data });
}

export async function POST(request: Request) {
  const auth = await authenticatedClient();
  if ("error" in auth) {
    return Response.json(
      { ok: false, error: auth.error },
      { status: auth.error === "unauthorized" ? 401 : 503 }
    );
  }

  try {
    const payload = propertySchema.parse(await request.json());
    const serverLocation = await resolveLocation({
      street: payload.street,
      houseNumber: payload.house_number,
      postalCode: payload.postal_code,
      city: payload.city
    });
    const manualCoordinates = payload.location_source === "manual" && payload.lat != null && payload.lon != null;
    const resolvedLocation = serverLocation.status === "found" && !manualCoordinates ? serverLocation.result : null;
    const latitude = resolvedLocation?.latitude ?? payload.lat ?? null;
    const longitude = resolvedLocation?.longitude ?? payload.lon ?? null;
    const city = payload.city || resolvedLocation?.city || "";
    const addressLine1 = [payload.street, payload.house_number].filter(Boolean).join(" ") || [payload.postal_code, city].filter(Boolean).join(" ");

    const { data, error } = await auth.supabase
      .from("properties")
      .insert({
        owner_id: auth.user.id,
        address_line1: addressLine1,
        street: payload.street,
        house_number: payload.house_number,
        city,
        postal_code: payload.postal_code,
        country: payload.country,
        lat: latitude,
        lon: longitude,
        location_source: manualCoordinates ? "manual" : resolvedLocation?.source ?? payload.location_source ?? null,
        geocoded_at: manualCoordinates ? null : resolvedLocation?.geocodedAt ?? payload.geocoded_at ?? null,
        metadata: payload.metadata ?? {}
      })
      .select("id,created_at,lat,lon,location_source,geocoded_at")
      .single();

    if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });
    return Response.json({ ok: true, property: data, location_status: serverLocation.status });
  } catch {
    return Response.json({ ok: false, message: "Ungültige Daten." }, { status: 400 });
  }
}
