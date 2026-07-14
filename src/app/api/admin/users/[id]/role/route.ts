import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { forbiddenResponse, requireRole } from "@/lib/auth/server";

const bodySchema = z.object({ role: z.enum(["user", "admin", "founder"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireRole("founder");
  if (!access.allowed) return forbiddenResponse(access.status);

  const { id } = await context.params;
  if (id === access.user.id) {
    return Response.json({ message: "Die eigene Founder-Rolle kann hier nicht entfernt werden." }, { status: 409 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Ungültige Rolle." }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("user_roles").update({
    role: parsed.data.role,
    assigned_by: access.user.id,
    updated_at: new Date().toISOString()
  }).eq("user_id", id);

  if (error) return Response.json({ message: "Rolle konnte nicht gespeichert werden." }, { status: 503 });

  await admin.from("admin_audit_events").insert({
    actor_id: access.user.id,
    action: "role.updated",
    target_type: "user",
    target_id: id,
    metadata: { role: parsed.data.role }
  });

  return Response.json({ success: true, role: parsed.data.role });
}

