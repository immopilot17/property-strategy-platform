import { z } from "zod";
import { validateAnalysisInput } from "@/features/analysis/domain";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { requireTier } from "@/features/payments/server";

const saveSchema = z.object({
  title: z.string().trim().min(2).max(150),
  input: z.unknown(),
  result: z.record(z.unknown()),
  aiSummary: z.string().max(20000).optional()
});

async function authenticatedClient() {
  if (!isSupabaseConfigured()) return { error: "not_configured" as const };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { error: "unauthorized" as const };
  return { supabase, user: data.user };
}

export async function GET() {
  const auth = await authenticatedClient();
  if ("error" in auth) {
    return Response.json(
      { ok: false, error: auth.error },
      { status: auth.error === "unauthorized" ? 401 : 503 }
    );
  }

  const { data, error } = await auth.supabase
    .from("analyses")
    .select("id,title,input_snapshot,result_snapshot,ai_summary,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });
  return Response.json({ ok: true, analyses: data });
}

export async function POST(request: Request) {
  const access = await requireTier("starter");
  if (!access.allowed) return Response.json({ ok: false, message: "Cloudspeicherung ist ab Basis Plus verfügbar." }, { status: 403 });
  const auth = await authenticatedClient();
  if ("error" in auth) {
    return Response.json(
      { ok: false, error: auth.error },
      { status: auth.error === "unauthorized" ? 401 : 503 }
    );
  }

  try {
    const payload = saveSchema.parse(await request.json());
    const validation = validateAnalysisInput(payload.input);
    if (!validation.success) {
      return Response.json({ ok: false, errors: validation.errors }, { status: 422 });
    }

    const { data, error } = await auth.supabase
      .from("analyses")
      .insert({
        user_id: auth.user.id,
        title: payload.title,
        analysis_type: "full",
        status: "completed",
        input_snapshot: validation.data,
        result_snapshot: payload.result,
        ai_summary: payload.aiSummary ?? null
      })
      .select("id,created_at")
      .single();

    if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });
    return Response.json({ ok: true, analysis: data });
  } catch {
    return Response.json({ ok: false, message: "Ungültige Speicherdaten." }, { status: 400 });
  }
}
