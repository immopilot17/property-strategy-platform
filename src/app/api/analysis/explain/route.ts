import { z } from "zod";
import { releaseApiUsage, reserveApiUsage, settleApiUsage } from "@/features/payments/server";
import { extractOpenAIOutputText, extractOpenAIUsage } from "@/lib/openai";
import { getRoleAccess } from "@/lib/auth/server";
import { isFeatureEnabled } from "@/lib/auth/feature-flags";

const requestSchema = z.object({ input: z.record(z.unknown()), result: z.record(z.unknown()) });

export async function POST(request: Request) {
  const access = await getRoleAccess();
  if (!(await isFeatureEnabled("ai_analysis", access.role))) {
    return Response.json({ ok: false, configured: true, message: "Die KI-Analyse ist vorübergehend deaktiviert." }, { status: 503 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ ok: false, configured: false, message: "OPENAI_API_KEY ist nicht konfiguriert." }, { status: 503 });

  try {
    const body = requestSchema.parse(await request.json());
    const prompt = [
      "Erkläre die folgende Immobilienanalyse auf Deutsch.",
      "Trenne klar zwischen Fakten, Annahmen und Empfehlungen.",
      "Nenne zuerst die drei wichtigsten Erkenntnisse, danach Risiken und konkrete nächste Schritte.",
      "Keine Rechts-, Steuer- oder Finanzberatung vortäuschen. Keine Zahlen erfinden.",
      JSON.stringify(body)
    ].join("\n\n");
    const model = process.env.OPENAI_MODEL ?? "gpt-4-turbo";
    const reservation = await reserveApiUsage({ requiredTier: "starter", feature: "analysis_explanation", model, input: prompt, maxOutputTokens: 1200 });
    if (!reservation.ok) return Response.json({ ok: false, message: reservation.message }, { status: reservation.status });

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          instructions: "Du bist ein vorsichtiger Immobilienanalyse-Assistent. Nutze ausschließlich die gelieferten Daten.",
          input: prompt,
          max_output_tokens: 1200
        })
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        await releaseApiUsage(reservation);
        console.error("explain.api.response-error", `Status: ${response.status}`);
        return Response.json({ ok: false, configured: true, message: "KI-Auswertung ist fehlgeschlagen." }, { status: response.status });
      }
      const explanation = extractOpenAIOutputText(data);
      if (!explanation) {
        await releaseApiUsage(reservation);
        console.error("explain.api.no-text", "OpenAI returned no text content");
        return Response.json({ ok: false, configured: true, message: "Die KI hat keinen auswertbaren Text geliefert." }, { status: 502 });
      }
      const tokenBalance = await settleApiUsage(reservation, extractOpenAIUsage(data));
      return Response.json({ ok: true, explanation, tokenBalance });
    } catch (error) {
      await releaseApiUsage(reservation);
      console.error("explain.api.fetch-error", error instanceof Error ? error.message : String(error));
      return Response.json({ ok: false, configured: true, message: "KI-Auswertung ist fehlgeschlagen." }, { status: 502 });
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("explain.api.parse-error", error.message);
    } else {
      console.error("explain.api.validation-error", error instanceof Error ? error.message : String(error));
    }
    return Response.json({ ok: false, configured: true, message: "Ungültige Anfrage für die KI-Auswertung." }, { status: 400 });
  }
}
