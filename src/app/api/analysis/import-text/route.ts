import { z } from "zod";
import { releaseApiUsage, reserveApiUsage, settleApiUsage, type UsageReservation } from "@/features/payments/server";
import { extractOpenAIOutputText, extractOpenAIUsage } from "@/lib/openai";

const requestSchema = z.object({
  text: z.string().trim().min(50).max(30000)
});

export async function POST(request: Request) {
  let activeReservation: UsageReservation | null = null;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { ok: false, configured: false, message: "Für den Textimport fehlt OPENAI_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const { text } = requestSchema.parse(await request.json());
    const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";
    const reservation = await reserveApiUsage({
      requiredTier: "starter",
      feature: "expose_text_import",
      model,
      input: text,
      maxOutputTokens: 1000
    });
    if (!reservation.ok) return Response.json({ ok: false, message: reservation.message }, { status: reservation.status });
    activeReservation = reservation;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions:
          "Extrahiere nur eindeutig im Immobilientext enthaltene Werte. Unbekannte Werte als null ausgeben.",
        input: text,
        text: {
          format: {
            type: "json_schema",
            name: "property_extraction",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: ["string", "null"] },
                purchasePrice: { type: ["number", "null"] },
                livingArea: { type: ["number", "null"] },
                landArea: { type: ["number", "null"] },
                numberOfUnits: { type: ["number", "null"] },
                yearBuilt: { type: ["number", "null"] },
                monthlyColdRent: { type: ["number", "null"] },
                monthlyHouseMoney: { type: ["number", "null"] },
                renovationCosts: { type: ["number", "null"] },
                city: { type: ["string", "null"] },
                postalCode: { type: ["string", "null"] },
                energyClass: { type: ["string", "null"] }
              },
              required: [
                "title", "purchasePrice", "livingArea", "landArea", "numberOfUnits",
                "yearBuilt", "monthlyColdRent", "monthlyHouseMoney",
                "renovationCosts", "city", "postalCode", "energyClass"
              ]
            }
          }
        }
      })
    });

    const data: unknown = await response.json();
    if (!response.ok) {
      await releaseApiUsage(reservation);
      return Response.json(
        { ok: false, configured: true, message: "Exposé-Import ist fehlgeschlagen." },
        { status: response.status }
      );
    }

    const textOutput = extractOpenAIOutputText(data);
    if (!textOutput) {
      await releaseApiUsage(reservation);
      return Response.json({ ok: false, message: "Keine Daten erkannt." }, { status: 502 });
    }

    const tokenBalance = await settleApiUsage(reservation, extractOpenAIUsage(data));
    return Response.json({ ok: true, property: JSON.parse(textOutput) as unknown, tokenBalance });
  } catch {
    if (activeReservation) await releaseApiUsage(activeReservation);
    return Response.json(
      { ok: false, message: "Der Text konnte nicht ausgewertet werden." },
      { status: 400 }
    );
  }
}
