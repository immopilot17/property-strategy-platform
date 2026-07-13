import { PaymentPackages } from "@/components/payments/payment-packages";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentsPage() {
  if (!isSupabaseConfigured()) return <PaymentPackages signedIn={false} tokenBalance={0} />;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let tokenBalance = 0;
  if (user) {
    const { data } = await supabase.from("analysis_credits").select("token_balance").eq("user_id", user.id).maybeSingle();
    tokenBalance = Number(data?.token_balance ?? 0);
  }
  return <PaymentPackages signedIn={Boolean(user)} tokenBalance={tokenBalance} />;
}
