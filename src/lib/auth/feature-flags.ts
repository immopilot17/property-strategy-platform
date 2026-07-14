import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "./roles";

export type FeatureFlagKey = "ai_analysis" | "url_import" | "funding_intelligence" | "premium_reports" | "debug_tools";

export async function isFeatureEnabled(key: FeatureFlagKey, role: AppRole) {
  if (role === "founder") return true;
  const { data } = await createAdminClient()
    .from("feature_flags")
    .select("enabled")
    .eq("key", key)
    .maybeSingle();
  return data?.enabled !== false;
}

