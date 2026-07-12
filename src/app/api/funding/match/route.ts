import { validateAnalysisInput } from "@/features/analysis/domain";
import { matchFundingPrograms } from "@/features/funding/agent";
import { createClient } from "@/lib/supabase/server";
import { requireTier } from "@/features/payments/server";

export async function POST(request: Request) {
  const access = await requireTier("plus");
  if (!access.allowed) return Response.json({ message: "Die Förderprüfung ist im Finanzierungspaket verfügbar." }, { status: 403 });
  const validation = validateAnalysisInput(await request.json());
  if (!validation.success) return Response.json({ message: "Ungültige Analysedaten." }, { status: 422 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("current_funding_programs").select("normalized_data");
  if (error) return Response.json({ message: "Förderdaten sind noch nicht verfügbar." }, { status: 503 });
  try {
    return Response.json(matchFundingPrograms(validation.data, (data ?? []).map((row) => row.normalized_data)));
  } catch {
    return Response.json({ message: "Förderdaten konnten nicht sicher ausgewertet werden." }, { status: 500 });
  }
}
