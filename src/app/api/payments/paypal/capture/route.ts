import { NextResponse } from "next/server";
import { paypalRequest } from "@/features/payments/paypal";
import { appUrl, requirePaymentUser } from "@/features/payments/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PayPalOrder = { id: string; status: string; purchase_units: Array<{ custom_id?: string; amount: { value: string } }> };

export async function GET(request: Request) {
  const origin = appUrl(request);
  const user = await requirePaymentUser();
  const token = new URL(request.url).searchParams.get("token");
  if (!user || !token) return NextResponse.redirect(`${origin}/login`);
  const response = await paypalRequest(`/v2/checkout/orders/${token}/capture`, { method: "POST", body: "{}" });
  const order = await response.json() as PayPalOrder;
  const [userId, packageCode, credits] = order.purchase_units?.[0]?.custom_id?.split("|") ?? [];
  if (!response.ok || order.status !== "COMPLETED" || userId !== user.id) {
    return NextResponse.redirect(`${origin}/dashboard/zahlungen?status=failed`);
  }
  const { error } = await createAdminClient().rpc("complete_credit_payment", {
    payment_user_id: userId,
    payment_provider: "paypal",
    external_payment_id: order.id,
    payment_amount_cents: Math.round(Number(order.purchase_units[0].amount.value) * 100),
    payment_package_code: packageCode,
    purchased_credits: Number(credits)
  });
  return NextResponse.redirect(`${origin}/dashboard/zahlungen?status=${error ? "failed" : "success"}`);
}
