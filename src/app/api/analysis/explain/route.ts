import { z } from "zod";

const requestSchema = z.object({
  input: z.record(z.unknown()),
  result: z.record(z.unknown())
});

function extractOutputText(data: unknown): string | null {
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
      { ok: false, configured: false, message: "OPENAI_API_KEY ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  try {
    const body = requestSchema.parse(await request.json());
    const prompt = [
      "Erkläre die folgende Immobilienanalyse auf Deutsch.",
      "Trenne klar zwischen Fakten, Annahmen und Empfehlungen.",
      "Nenne zuerst die drei wichtigsten Erkenntnisse, danach Risiken und konkrete nächste Schritte.",
      "Keine Rechts-, Steuer- oder Finanzberatung vortäuschen. Keine Zahlen erfinden.",
      JSON.stringify(body)
    ].join("\n\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
        instructions:
          "Du bist ein vorsichtiger Immobilienanalyse-Assistent. Nutze ausschließlich die gelieferten Daten.",
        input: prompt,
        max_output_tokens: 1200
      })
    });

    const data: unknown = await response.json();
    if (!response.ok) {
      return Response.json(
        { ok: false, configured: true, message: "KI-Auswertung ist fehlgeschlagen." },
        { status: response.status }
      );
    }

    const explanation = extractOutputText(data);
    if (!explanation) {
      return Response.json(
        { ok: false, configured: true, message: "Die KI hat keinen auswertbaren Text geliefert." },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, explanation });
  } catch {
    return Response.json(
      { ok: false, configured: true, message: "Ungültige Anfrage für die KI-Auswertung." },
      { status: 400 }
    );
  }
}
