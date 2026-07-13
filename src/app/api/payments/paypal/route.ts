import { z } from "zod";
import { getPaymentPackage } from "@/features/payments/packages";
import { paypalRequest } from "@/features/payments/paypal";
import { appUrl, requirePaymentUser } from "@/features/payments/server";

const schema = z.object({ packageCode: z.string() });

export async function POST(request: Request) {
  const user = await requirePaymentUser();
  if (!user) return Response.json({ message: "Bitte zuerst anmelden." }, { status: 401 });
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) return Response.json({ message: "PayPal ist nicht konfiguriert." }, { status: 503 });
  const selected = getPaymentPackage(schema.parse(await request.json()).packageCode);
  if (!selected) return Response.json({ message: "Ungültiges Paket." }, { status: 400 });
  const origin = appUrl(request);
  const response = await paypalRequest("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        custom_id: `${user.id}|${selected.code}|${selected.credits}`,
        description: `${selected.name} – ${selected.tokenAllowance.toLocaleString("de-DE")} API-Tokens`,
        amount: { currency_code: "EUR", value: (selected.priceCents / 100).toFixed(2) }
      }],
      payment_source: { paypal: { experience_context: {
        user_action: "PAY_NOW",
        return_url: `${origin}/api/payments/paypal/capture`,
        cancel_url: `${origin}/dashboard/zahlungen?status=cancelled`
      } } }
    })
  });
  const order = await response.json() as { links?: Array<{ rel: string; href: string }>; message?: string };
  if (!response.ok) return Response.json({ message: order.message ?? "PayPal-Checkout fehlgeschlagen." }, { status: 502 });
  return Response.json({ url: order.links?.find((link) => link.rel === "payer-action")?.href });
}
