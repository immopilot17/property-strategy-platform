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

    try {
      const result = runFullAnalysis(validation.data);
      return Response.json({ ok: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analyse-Berechnung fehlgeschlagen";
      console.error("analysis.full.calculation-error", message);
      return Response.json(
        { ok: false, message: "Die Analyse konnte nicht berechnet werden. Bitte versuchen Sie es erneut." },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("analysis.full.parse-error", error.message);
      return Response.json(
        { ok: false, message: "Ungültiges JSON-Format." },
        { status: 400 }
      );
    }
    console.error("analysis.full.unexpected-error", error instanceof Error ? error.message : String(error));
    return Response.json(
      { ok: false, message: "Die Anfrage konnte nicht verarbeitet werden." },
      { status: 400 }
    );
  }
}
