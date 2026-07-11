import { runFullAnalysis } from "@/features/analysis/analysis-service";
import { validateAnalysisInput } from "@/features/analysis/domain";

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    const validation = validateAnalysisInput(payload);

    if (!validation.success) {
      return Response.json(
        { ok: false, message: "Bitte Eingaben korrigieren.", errors: validation.errors },
        { status: 422 }
      );
    }

    return Response.json({ ok: true, result: runFullAnalysis(validation.data) });
  } catch {
    return Response.json(
      { ok: false, message: "Die Anfrage konnte nicht verarbeitet werden." },
      { status: 400 }
    );
  }
}
