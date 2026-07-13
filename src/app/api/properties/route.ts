import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const propertySchema = z.object({
  address_line1: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  postal_code: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  lat: z.number().optional(),
  lon: z.number().optional(),
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
      "id,owner_id,address_line1,city,postal_code,country,lat,lon,metadata,created_at"
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

    const { data, error } = await auth.supabase
      .from("properties")
      .insert({
        owner_id: auth.user.id,
        address_line1: payload.address_line1,
        city: payload.city,
        postal_code: payload.postal_code,
        country: payload.country,
        lat: payload.lat ?? null,
        lon: payload.lon ?? null,
        metadata: payload.metadata ?? {}
      })
      .select("id,created_at")
      .single();

    if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });
    return Response.json({ ok: true, property: data });
  } catch (err) {
    return Response.json({ ok: false, message: "Ungültige Daten." }, { status: 400 });
  }
}
