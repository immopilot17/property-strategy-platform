import Stripe from "stripe";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return new Response("Not configured", { status: 503 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { error } = await createAdminClient().rpc("complete_credit_payment", {
      payment_user_id: session.metadata?.userId,
      payment_provider: "stripe",
      external_payment_id: session.id,
      payment_amount_cents: session.amount_total ?? 0,
      payment_package_code: session.metadata?.packageCode,
      purchased_credits: Number(session.metadata?.credits ?? 0)
    });
    if (error) return new Response(error.message, { status: 500 });
  }
  return Response.json({ received: true });
}
