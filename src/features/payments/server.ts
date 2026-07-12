import { createClient } from "@/lib/supabase/server";
import { hasTier, type AccessTier } from "./packages";

export async function requirePaymentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function appUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

export async function getAccountAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { tier: "free" as AccessTier, user: null, supabase };
  const { data } = await supabase.from("payments").select("package_code").eq("user_id", user.id).eq("status", "completed");
  const order: AccessTier[] = ["free", "starter", "plus", "pro", "premium"];
  const tier = (data ?? []).reduce<AccessTier>((highest, payment) => {
    const candidate = payment.package_code as AccessTier;
    return order.indexOf(candidate) > order.indexOf(highest) ? candidate : highest;
  }, "free");
  return { tier, user, supabase };
}

export async function requireTier(required: AccessTier) {
  const access = await getAccountAccess();
  return { ...access, allowed: hasTier(access.tier, required) };
}
