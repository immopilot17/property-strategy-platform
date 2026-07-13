import { normalizedFundingProgramSchema, type FundingSourceDocument } from "./domain";
import { extractOpenAIOutputText } from "@/lib/openai";

type OpenAIErrorResponse = {
  error?: {
    code?: string | null;
    type?: string | null;
  };
};

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function openAIErrorCode(data: unknown) {
  if (!data || typeof data !== "object") return "unknown_error";
  const error = (data as OpenAIErrorResponse).error;
  return error?.code ?? error?.type ?? "unknown_error";
}

async function requestOpenAI(body: Record<string, unknown>) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: unknown = await response.json().catch(() => null);
    if (response.ok) return data;

    const code = openAIErrorCode(data);
    const canRetry = response.status === 429 && code !== "insufficient_quota" && attempt < 2;
    if (!canRetry) throw new Error(`Normalisierung fehlgeschlagen (OpenAI ${response.status}, ${code}).`);

    const retryAfterSeconds = Number(response.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? Math.min(retryAfterSeconds * 1000, 15_000)
      : 1_500 * 2 ** attempt;
    await wait(delay);
  }
  throw new Error("Normalisierung fehlgeschlagen (OpenAI retry_exhausted).");
}

export async function normalizeFundingDocument(document: FundingSourceDocument) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY fehlt für die Fördernormalisierung.");
  const data = await requestOpenAI({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    instructions: "Extrahiere ausschließlich ausdrücklich belegte Angaben aus der offiziellen Quelle. Erfinde keine Zahlen, Fristen, Kombinationen oder Voraussetzungen. Nutze null beziehungsweise leere Listen, wenn etwas nicht belegt ist. Jede finanzielle Angabe und Frist benötigt ein kurzes wörtliches Belegfragment in sourceEvidence.",
    input: JSON.stringify({ providerId: document.providerId, officialSource: document.sourceUrl, fetchedAt: document.fetchedAt, title: document.title, sourceText: document.text }),
    text: { format: { type: "json_schema", name: "funding_program", strict: true, schema: {
        type: "object", additionalProperties: false,
        properties: {
          providerId: { type: "string" }, programId: { type: "string" }, programName: { type: "string" }, description: { type: "string" },
          category: { type: "string", enum: ["purchase", "new_build", "renovation", "energy", "accessibility", "other"] },
          eligibility: { type: "array", items: { type: "object", additionalProperties: false, properties: { field: { type: "string", enum: ["federalState", "occupancy", "children", "annualIncome", "projectType", "firstPurchase", "renovation", "energyClass"] }, operator: { type: "string", enum: ["equals", "not_equals", "at_least", "at_most", "one_of"] }, value: { anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "array", items: { type: "string" } }] }, explanation: { type: "string" } }, required: ["field", "operator", "value", "explanation"] } },
          maximumFunding: { type: "object", additionalProperties: false, properties: { amount: { type: ["number", "null"] }, currency: { type: "string", enum: ["EUR"] }, description: { type: "string" } }, required: ["amount", "currency", "description"] },
          interestRate: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, properties: { valuePercent: { type: ["number", "null"] }, description: { type: "string" }, variable: { type: "boolean" } }, required: ["valuePercent", "description", "variable"] }] },
          repaymentGrant: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, properties: { amount: { type: ["number", "null"] }, percent: { type: ["number", "null"] }, description: { type: "string" } }, required: ["amount", "percent", "description"] }] },
          validFrom: { type: ["string", "null"] }, validUntil: { type: ["string", "null"] }, applicationProcess: { type: "string" }, applicationDeadline: { type: "string" },
          requiredDocuments: { type: "array", items: { type: "string" } }, combinations: { type: "array", items: { type: "string" } }, restrictions: { type: "array", items: { type: "string" } },
          officialSource: { type: "string" }, sourcePublishedAt: { type: ["string", "null"] }, lastUpdated: { type: "string" },
          sourceEvidence: { type: "array", items: { type: "object", additionalProperties: false, properties: { field: { type: "string" }, quote: { type: "string" } }, required: ["field", "quote"] } }
        },
        required: ["providerId", "programId", "programName", "description", "category", "eligibility", "maximumFunding", "interestRate", "repaymentGrant", "validFrom", "validUntil", "applicationProcess", "applicationDeadline", "requiredDocuments", "combinations", "restrictions", "officialSource", "sourcePublishedAt", "lastUpdated", "sourceEvidence"]
    } } },
    max_output_tokens: 5000,
  });
  const text = extractOpenAIOutputText(data);
  if (!text) throw new Error("Normalisierung fehlgeschlagen (OpenAI lieferte keinen Text).");
  const normalized = normalizedFundingProgramSchema.parse({ ...JSON.parse(text), providerId: document.providerId, officialSource: document.sourceUrl, lastUpdated: document.fetchedAt });
  if (normalized.providerId !== document.providerId || normalized.officialSource !== document.sourceUrl) throw new Error("Normalisierte Quelle stimmt nicht mit dem Original überein.");
  return normalized;
}
