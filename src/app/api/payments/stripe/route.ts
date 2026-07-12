import Stripe from "stripe";
import { z } from "zod";
import { getPaymentPackage } from "@/features/payments/packages";
import { appUrl, requirePaymentUser } from "@/features/payments/server";

const schema = z.object({ packageCode: z.string() });

export async function POST(request: Request) {
  const user = await requirePaymentUser();
  if (!user) return Response.json({ message: "Bitte zuerst anmelden." }, { status: 401 });
  const selected = getPaymentPackage(schema.parse(await request.json()).packageCode);
  if (!selected) return Response.json({ message: "Ungültiges Paket." }, { status: 400 });
  if (!process.env.STRIPE_SECRET_KEY) return Response.json({ message: "Stripe ist nicht konfiguriert." }, { status: 503 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = appUrl(request);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${origin}/dashboard/zahlungen?status=success`,
    cancel_url: `${origin}/dashboard/zahlungen?status=cancelled`,
    metadata: { userId: user.id, packageCode: selected.code, credits: String(selected.credits) },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: selected.priceCents,
        product_data: { name: `${selected.name} – ${selected.credits} Analyse-Credits` }
      }
    }]
  });
  return Response.json({ url: session.url });
}
