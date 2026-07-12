import { PaymentPackages } from "@/components/payments/payment-packages";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentsPage() {
  if (!isSupabaseConfigured()) return <PaymentPackages signedIn={false} credits={0} />;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let credits = 0;
  if (user) {
    const { data } = await supabase.from("analysis_credits").select("credits").eq("user_id", user.id).maybeSingle();
    credits = data?.credits ?? 0;
  }
  return <PaymentPackages signedIn={Boolean(user)} credits={credits} />;
}
