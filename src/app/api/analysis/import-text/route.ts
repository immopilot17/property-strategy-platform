import { z } from "zod";

const requestSchema = z.object({
  text: z.string().trim().min(50).max(30000)
});

function outputText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const response = data as {
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return null;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { ok: false, configured: false, message: "Für den Textimport fehlt OPENAI_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const { text } = requestSchema.parse(await request.json());
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
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
      return Response.json(
        { ok: false, configured: true, message: "Exposé-Import ist fehlgeschlagen." },
        { status: response.status }
      );
    }

    const textOutput = outputText(data);
    if (!textOutput) {
      return Response.json({ ok: false, message: "Keine Daten erkannt." }, { status: 502 });
    }

    return Response.json({ ok: true, property: JSON.parse(textOutput) as unknown });
  } catch {
    return Response.json(
      { ok: false, message: "Der Text konnte nicht ausgewertet werden." },
      { status: 400 }
    );
  }
}
