import { geocodingAddressSchema } from "@/features/location/domain";
import { resolveLocation } from "@/features/location/geocoding";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = geocodingAddressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { status: "not_found", result: null, message: "Bitte eine gültige fünfstellige Postleitzahl eingeben." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const outcome = await resolveLocation(parsed.data);
  return Response.json(outcome, {
    status: outcome.status === "unavailable" ? 503 : 200,
    headers: { "Cache-Control": "private, no-store" }
  });
}
