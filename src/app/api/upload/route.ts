import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const payload = await request.json() as { fileName?: unknown; contentType?: unknown };
    if (typeof payload.fileName !== "string" || typeof payload.contentType !== "string") {
      return Response.json({ ok: false, message: "Dateiname oder Dateityp fehlt." }, { status: 400 });
    }
    const safeFileName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
    const key = `${data.user.id}/${Date.now()}-${safeFileName}`;

    const { data: signed, error: supaErr } = await supabase.storage
      .from("documents")
      .createSignedUploadUrl(key, { upsert: false });

    if (supaErr) return Response.json({ ok: false, message: supaErr.message }, { status: 500 });
    return Response.json({ ok: true, uploadUrl: signed.signedUrl, key });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Ungültige Anfrage." }, { status: 400 });
  }
}
