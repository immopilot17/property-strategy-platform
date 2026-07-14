import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { forbiddenResponse, requireRole } from "@/lib/auth/server";

const grantSchema = z.object({ email: z.string().email(), name: z.string().trim().min(1).max(120) });
const revokeSchema = z.object({ userId: z.string().uuid() });

export async function GET() {
  const access = await requireRole("founder");
  if (!access.allowed) return forbiddenResponse(access.status);
  const { data, error } = await createAdminClient().from("founder_users").select("id,email,name,verified_at").order("verified_at", { ascending: false });
  if (error) return Response.json({ message: "Founder-Liste konnte nicht geladen werden." }, { status: 503 });
  return Response.json({ founders: data ?? [] });
}
export async function POST(request: Request) {
  const access = await requireRole("founder");
  if (!access.allowed) return forbiddenResponse(access.status);
  const parsed = grantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "E-Mail und Name sind erforderlich." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("grant_founder_status", { founder_email: parsed.data.email, founder_name: parsed.data.name });
  if (error) return Response.json({ message: "Founder-Status konnte nicht vergeben werden." }, { status: 503 });
  const { data: { users } } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const target = users.find((user) => user.email?.toLowerCase() === parsed.data.email.toLowerCase());
  if (target) await admin.from("user_roles").update({ role: "founder", assigned_by: access.user.id, updated_at: new Date().toISOString() }).eq("user_id", target.id);
  await admin.from("admin_audit_events").insert({ actor_id: access.user.id, action: "founder.granted", target_type: "user", target_id: target?.id, metadata: { email: parsed.data.email } });
  return Response.json({ success: data === true });
}

export async function DELETE(request: Request) {
  const access = await requireRole("founder");
  if (!access.allowed) return forbiddenResponse(access.status);
  const parsed = revokeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Eine gültige Nutzer-ID ist erforderlich." }, { status: 400 });
  if (parsed.data.userId === access.user.id) return Response.json({ message: "Der eigene Founder-Zugang kann hier nicht entfernt werden." }, { status: 409 });

  const admin = createAdminClient();
  const { error } = await admin.rpc("revoke_founder_status", { target_user_id: parsed.data.userId });
  if (error) return Response.json({ message: "Founder-Status konnte nicht entfernt werden." }, { status: 503 });
  await admin.from("user_roles").update({ role: "user", assigned_by: access.user.id, updated_at: new Date().toISOString() }).eq("user_id", parsed.data.userId);
  await admin.from("admin_audit_events").insert({ actor_id: access.user.id, action: "founder.revoked", target_type: "user", target_id: parsed.data.userId });
  return Response.json({ success: true });
}
