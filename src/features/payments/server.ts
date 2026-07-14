import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasTier, isAccessTier, type AccessTier } from "./packages";
import { getUserRole } from "@/lib/auth/server";

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
  if (!user) return { tier: "free" as AccessTier, role: "user" as const, user: null, supabase, tokenBalance: 0, tokensUsed: 0, unlimited: false };
  const [{ data: payments }, { data: balance }, { data: profile }, role] = await Promise.all([
    supabase.from("payments").select("package_code").eq("user_id", user.id).eq("status", "completed"),
    supabase.from("analysis_credits").select("token_balance,tokens_used,is_unlimited").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("user_tier").eq("id", user.id).maybeSingle(),
    getUserRole(user.id)
  ]);
  const order: AccessTier[] = ["free", "starter", "plus", "pro", "premium"];
  const paidTier = (payments ?? []).reduce<AccessTier>((highest, payment) => {
    const candidate = payment.package_code as AccessTier;
    return order.indexOf(candidate) > order.indexOf(highest) ? candidate : highest;
  }, "free");
  const profileTier = isAccessTier(profile?.user_tier) ? profile.user_tier : "free";
  const tier = role === "founder" ? "founder" : profileTier === "founder" || hasTier(profileTier, paidTier) ? profileTier : paidTier;
  return {
    tier,
    role,
    user,
    supabase,
    tokenBalance: Number(balance?.token_balance ?? 0),
    tokensUsed: Number(balance?.tokens_used ?? 0),
    unlimited: role === "founder" || balance?.is_unlimited === true
  };
}

export async function requireTier(required: AccessTier) {
  const access = await getAccountAccess();
  return { ...access, allowed: hasTier(access.tier, required) };
}

export type UsageReservation = {
  ok: true;
  requestId: string;
  reservedTokens: number;
  tokenBalance: number;
};

type UsageRejection = {
  ok: false;
  status: number;
  message: string;
};

export async function reserveApiUsage({
  requiredTier,
  feature,
  model,
  input,
  maxOutputTokens
}: {
  requiredTier: AccessTier;
  feature: string;
  model: string;
  input: string;
  maxOutputTokens: number;
}): Promise<UsageReservation | UsageRejection> {
  const access = await requireTier(requiredTier);
  if (!access.user) return { ok: false, status: 401, message: "Bitte anmelden, um diese API-Funktion zu nutzen." };
  if (!access.allowed) return { ok: false, status: 403, message: "Diese Funktion ist in deinem Paket nicht enthalten." };

  const reservedTokens = Math.min(100_000, Math.max(1, Math.ceil(input.length / 4) + maxOutputTokens));
  const requestId = crypto.randomUUID();
  const { data, error } = await createAdminClient().rpc("reserve_api_tokens", {
    usage_user_id: access.user.id,
    usage_request_id: requestId,
    usage_feature: feature,
    usage_model: model,
    token_reservation: reservedTokens
  });

  if (error) {
    return {
      ok: false,
      status: error.message.includes("Insufficient API token balance") ? 402 : 503,
      message: error.message.includes("Insufficient API token balance")
        ? "Dein API-Tokenbudget ist aufgebraucht. Bitte lade ein neues Paket auf."
        : "Der API-Verbrauch konnte nicht reserviert werden."
    };
  }

  return { ok: true, requestId, reservedTokens, tokenBalance: Number(data ?? 0) };
}

export async function settleApiUsage(
  reservation: UsageReservation,
  usage: { inputTokens: number; outputTokens: number } | null
) {
  const inputTokens = usage?.inputTokens ?? reservation.reservedTokens;
  const outputTokens = usage?.outputTokens ?? 0;
  const { data } = await createAdminClient().rpc("settle_api_tokens", {
    usage_request_id: reservation.requestId,
    actual_input_tokens: inputTokens,
    actual_output_tokens: outputTokens
  });
  return Number(data ?? 0);
}

export async function releaseApiUsage(reservation: UsageReservation) {
  await createAdminClient().rpc("release_api_token_reservation", {
    usage_request_id: reservation.requestId
  });
}
