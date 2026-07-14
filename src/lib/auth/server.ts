import "server-only";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasRole, isAppRole, type AppRole } from "./roles";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserRole(userId: string): Promise<AppRole> {
  const { data } = await createAdminClient()
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  return isAppRole(data?.role) ? data.role : "user";
}

export async function getRoleAccess() {
  const user = await getAuthenticatedUser();
  const role = user ? await getUserRole(user.id) : "user";
  return { user, role };
}

export async function requireRole(required: AppRole) {
  const { user, role } = await getRoleAccess();
  if (!user) return { user: null, role, allowed: false as const, status: 401 as const };
  if (!hasRole(role, required)) return { user, role, allowed: false as const, status: 403 as const };
  return { user, role, allowed: true as const, status: 200 as const };
}

export async function requireRolePage(required: AppRole) {
  const access = await requireRole(required);
  if (!access.user) redirect(`/login?next=${encodeURIComponent(required === "admin" ? "/admin" : "/dashboard")}`);
  if (!access.allowed) redirect("/dashboard");
  return access;
}

export function forbiddenResponse(status: 401 | 403) {
  return Response.json(
    { message: status === 401 ? "Bitte melde dich an." : "Du hast keine Berechtigung für diese Funktion." },
    { status }
  );
}
