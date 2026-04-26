import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const endsAt = sub.cancel_at_period_end && sub.cancel_at
      ? new Date(sub.cancel_at * 1000).toISOString()
      : null;

    await supabase
      .from("profiles")
      .update({ subscription_ends_at: endsAt })
      .eq("stripe_customer_id", customerId);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;

    await supabase
      .from("profiles")
      .update({
        plan_type: "free",
        stripe_customer_id: null,
        subscription_ends_at: null,
      })
      .eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}
