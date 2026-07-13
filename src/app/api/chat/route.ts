import { z } from "zod";
import { releaseApiUsage, reserveApiUsage, settleApiUsage } from "@/features/payments/server";
import { extractOpenAIOutputText, extractOpenAIUsage } from "@/lib/openai";

const messageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(4000) });
const requestSchema = z.object({ messages: z.array(messageSchema).min(1).max(12), analysis: z.unknown().optional() });

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return Response.json({ message: "Der Assistent ist noch nicht konfiguriert." }, { status: 503 });
  try {
    const body = requestSchema.parse(await request.json());
    const input = `${body.analysis ? `Aktuelle Analyse:\n${JSON.stringify(body.analysis).slice(0, 30000)}\n\n` : ""}Dialog:\n${body.messages.map((item) => `${item.role}: ${item.content}`).join("\n")}`;
    const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";
    const reservation = await reserveApiUsage({ requiredTier: "starter", feature: "analysis_chat", model, input, maxOutputTokens: 700 });
    if (!reservation.ok) return Response.json({ message: reservation.message }, { status: reservation.status });

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          instructions: "Du bist der deutschsprachige Assistent einer Immobilienanalyse-Plattform. Antworte klar und knapp. Nutze nur bereitgestellte Analysedaten, erfinde keine Zahlen und kennzeichne Steuer-, Förder- und Finanzhinweise als unverbindliche Orientierung. Frage gezielt nach fehlenden Angaben.",
          input,
          max_output_tokens: 700
        })
      });
      const data: unknown = await response.json();
      const answer = extractOpenAIOutputText(data);
      if (!response.ok || !answer) {
        await releaseApiUsage(reservation);
        return Response.json({ message: "Der Assistent konnte nicht antworten." }, { status: 502 });
      }
      const tokenBalance = await settleApiUsage(reservation, extractOpenAIUsage(data));
      return Response.json({ answer, tokenBalance });
    } catch {
      await releaseApiUsage(reservation);
      return Response.json({ message: "Der Assistent konnte nicht antworten." }, { status: 502 });
    }
  } catch {
    return Response.json({ message: "Ungültige Chat-Anfrage." }, { status: 400 });
  }
}
