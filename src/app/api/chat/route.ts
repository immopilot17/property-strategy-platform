import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireTier } from "@/features/payments/server";

const messageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(4000) });
const requestSchema = z.object({ messages: z.array(messageSchema).min(1).max(12), analysis: z.unknown().optional() });

function outputText(data: unknown) {
  const response = data as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  return response.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
}

export async function POST(request: Request) {
  const access = await requireTier("starter");
  if (!access.allowed) return Response.json({ message: "Der Analyse-Assistent ist ab Basis Plus verfügbar." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ message: "Bitte anmelden, um den Assistenten zu nutzen." }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return Response.json({ message: "Der Assistent ist noch nicht konfiguriert." }, { status: 503 });
  try {
    const body = requestSchema.parse(await request.json());
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
        instructions: "Du bist der deutschsprachige Assistent einer Immobilienanalyse-Plattform. Antworte klar und knapp. Nutze nur bereitgestellte Analysedaten, erfinde keine Zahlen und kennzeichne Steuer-, Förder- und Finanzhinweise als unverbindliche Orientierung. Frage gezielt nach fehlenden Angaben.",
        input: `${body.analysis ? `Aktuelle Analyse:\n${JSON.stringify(body.analysis).slice(0, 30000)}\n\n` : ""}Dialog:\n${body.messages.map((item) => `${item.role}: ${item.content}`).join("\n")}`,
        max_output_tokens: 700
      })
    });
    const data: unknown = await response.json();
    const answer = outputText(data);
    if (!response.ok || !answer) return Response.json({ message: "Der Assistent konnte nicht antworten." }, { status: 502 });
    return Response.json({ answer });
  } catch {
    return Response.json({ message: "Ungültige Chat-Anfrage." }, { status: 400 });
  }
}
