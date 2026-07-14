import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { forbiddenResponse, requireRole } from "@/lib/auth/server";

const bodySchema = z.object({ enabled: z.boolean() });

export async function PATCH(request: Request, context: { params: Promise<{ key: string }> }) {
  const access = await requireRole("admin");
  if (!access.allowed) return forbiddenResponse(access.status);

  const { key } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Ungültiger Status." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("feature_flags").update({
    enabled: parsed.data.enabled,
    updated_by: access.user.id,
    updated_at: new Date().toISOString()
  }).eq("key", key).select("key,enabled").maybeSingle();

  if (error || !data) return Response.json({ message: "Feature-Flag konnte nicht gespeichert werden." }, { status: 503 });

  await admin.from("admin_audit_events").insert({
    actor_id: access.user.id,
    action: "feature_flag.updated",
    target_type: "feature_flag",
    target_id: key,
    metadata: { enabled: parsed.data.enabled }
  });

  return Response.json({ success: true, flag: data });
}

