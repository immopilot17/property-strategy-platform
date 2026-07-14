import { createAdminClient } from "@/lib/supabase/admin";
import { forbiddenResponse, requireRole } from "@/lib/auth/server";
import { isAppRole } from "@/lib/auth/roles";

export async function GET() {
  const access = await requireRole("admin");
  if (!access.allowed) return forbiddenResponse(access.status);

  const admin = createAdminClient();
  const [usersResult, rolesResult, flagsResult, auditResult, analysesResult, propertiesResult] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
    admin.from("user_roles").select("user_id,role,updated_at"),
    admin.from("feature_flags").select("key,label,description,enabled,environment,updated_at").order("key"),
    admin.from("admin_audit_events").select("id,action,target_type,target_id,metadata,created_at,actor_id").order("created_at", { ascending: false }).limit(20),
    admin.from("analyses").select("id", { count: "exact", head: true }),
    admin.from("properties").select("id", { count: "exact", head: true })
  ]);

  if (usersResult.error || rolesResult.error || flagsResult.error || auditResult.error) {
    return Response.json({ message: "Admin-Daten konnten nicht vollständig geladen werden." }, { status: 503 });
  }

  const roles = new Map((rolesResult.data ?? []).map((item) => [item.user_id, isAppRole(item.role) ? item.role : "user"]));
  const users = usersResult.data.users.map((user) => ({
    id: user.id,
    email: user.email ?? "Keine E-Mail",
    role: roles.get(user.id) ?? "user",
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null
  }));

  return Response.json({
    viewer: { id: access.user.id, email: access.user.email, role: access.role },
    counts: { users: users.length, analyses: analysesResult.count ?? 0, properties: propertiesResult.count ?? 0 },
    users,
    flags: flagsResult.data ?? [],
    auditEvents: auditResult.data ?? [],
    services: {
      database: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      ai: Boolean(process.env.OPENAI_API_KEY),
      payments: Boolean(process.env.STRIPE_SECRET_KEY || process.env.PAYPAL_CLIENT_ID)
    }
  });
}

