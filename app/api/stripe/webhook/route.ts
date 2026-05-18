import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_INTERESTS } from "@/lib/plans";
import type Stripe from "stripe";

const VALID_CADENCES = new Set(["weekly", "biweekly", "monthly"]);

// Stripe sets different fields depending on how cancellation was scheduled
// and on the API version pinned to the account:
//   - explicit `cancel_at` future timestamp (custom scheduling)
//   - `cancel_at_period_end: true` with the period end on the subscription
//     (older API versions) or on the first item (newer API versions where
//     billing fields moved to items)
// Fall through these in priority order so portal-triggered cancellations
// always populate subscription_ends_at correctly.
function resolveSubscriptionEndsAt(sub: Stripe.Subscription): string | null {
  if (sub.cancel_at) return new Date(sub.cancel_at * 1000).toISOString();
  if (!sub.cancel_at_period_end) return null;

  const topLevelPeriodEnd = (sub as unknown as { current_period_end?: number | null }).current_period_end;
  if (topLevelPeriodEnd) return new Date(topLevelPeriodEnd * 1000).toISOString();

  const itemPeriodEnd = sub.items?.data?.[0]?.current_period_end;
  if (itemPeriodEnd) return new Date(itemPeriodEnd * 1000).toISOString();

  return null;
}

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

  // Service-role client: webhook has no user session, and the writes target
  // rows by stripe_customer_id which RLS would otherwise block.
  const supabase = createAdminClient();

  // Idempotency: insert event.id first. If the row already exists, this is a
  // retry of an already-processed event — return 200 without re-running.
  const { data: claim, error: claimErr } = await supabase
    .from("processed_stripe_events")
    .insert({ event_id: event.id })
    .select("event_id")
    .maybeSingle();

  if (claimErr) {
    // Postgres unique-violation code: duplicate event.id → already processed.
    if (claimErr.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
  if (!claim) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.user_id;
        const rawCadence = session.metadata?.cadence;
        const cadence = rawCadence && VALID_CADENCES.has(rawCadence) ? rawCadence : undefined;
        const customerId = session.customer as string | null;
        if (!userId || !customerId) break;

        const { error } = await supabase
          .from("profiles")
          .update({
            plan_type: "subscription",
            stripe_customer_id: customerId,
            ...(cadence ? { cadence } : {}),
          })
          .eq("id", userId);
        if (error) throw error;

        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const endsAt = resolveSubscriptionEndsAt(sub);

        const { error } = await supabase
          .from("profiles")
          .update({ subscription_ends_at: endsAt })
          .eq("stripe_customer_id", customerId);
        if (error) throw error;
        console.info(`[stripe/webhook] subscription.updated cust=${customerId} ends_at=${endsAt}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const { error } = await supabase
          .from("profiles")
          .update({
            plan_type: "free",
            subscription_ends_at: null,
            cadence: "monthly",
            preferred_radius: 15000,
            interests: [...FREE_INTERESTS],
          })
          .eq("stripe_customer_id", customerId);
        if (error) throw error;
        break;
      }

      case "invoice.payment_failed":
        // Acknowledged. Stripe runs the dunning sequence and fires
        // customer.subscription.deleted once retries are exhausted —
        // downgrade is handled there.
        break;
    }
  } catch {
    // Processing failed → release the idempotency claim so Stripe's retry
    // can re-attempt this event. Best-effort delete; ignore failure.
    await supabase.from("processed_stripe_events").delete().eq("event_id", event.id);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
