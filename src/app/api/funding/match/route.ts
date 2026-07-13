import { validateAnalysisInput } from "@/features/analysis/domain";
import { matchFundingPrograms } from "@/features/funding/agent";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTier } from "@/features/payments/server";

export async function POST(request: Request) {
  try {
    const access = await requireTier("plus");
    if (!access.allowed) return Response.json({ message: "Die Förderprüfung ist im Finanzierungspaket verfügbar." }, { status: 403 });
    
    const body = await request.json();
    const validation = validateAnalysisInput(body);
    if (!validation.success) return Response.json({ message: "Ungültige Analysedaten.", errors: validation.errors }, { status: 422 });
    
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("current_funding_programs").select("normalized_data");
    if (error) {
      console.error("funding.match.db-error", error.message);
      return Response.json({ message: "Förderdaten sind noch nicht verfügbar." }, { status: 503 });
    }
    if (!data?.length) return Response.json({ message: "Der Förderbestand wurde noch nicht initialisiert." }, { status: 503 });
    
    try {
      return Response.json(matchFundingPrograms(validation.data, (data ?? []).map((row) => row.normalized_data)));
    } catch (error) {
      console.error("funding.match.calculation-error", error instanceof Error ? error.message : String(error));
      return Response.json({ message: "Förderdaten konnten nicht sicher ausgewertet werden." }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("funding.match.parse-error", error.message);
      return Response.json({ message: "Ungültiges JSON-Format." }, { status: 400 });
    }
    console.error("funding.match.unexpected-error", error instanceof Error ? error.message : String(error));
    return Response.json({ message: "Der Request konnte nicht verarbeitet werden." }, { status: 500 });
  }
}
