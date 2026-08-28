import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_INTERESTS } from "@/lib/plans";
import { safeLogValue } from "@/lib/log";
import type Stripe from "stripe";

const VALID_CADENCES = new Set(["weekly", "biweekly", "monthly"]);

// Shared by every downgrade path so they cannot drift apart.
//
// interests is NOT cosmetic here: the profiles_interests_by_plan CHECK from
// migration 060 permits up to 12 interests only for subscription/trial. Setting
// plan_type='free' while a former subscriber still holds 12 interests violates
// the constraint, which would throw, 500 the webhook, and make Stripe retry the
// same event indefinitely. cadence and preferred_radius are reset for the same
// "return them to a valid free-tier row" reason.
const FREE_PLAN_RESET = {
  plan_type: "free" as const,
  subscription_ends_at: null,
  cadence: "monthly" as const,
  preferred_radius: 15000,
  interests: [...FREE_INTERESTS],
};

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

  // Two-phase idempotency: INSERT with status='pending', mark 'completed' after
  // processing. Hard-crash remnants (pending + >30 s old) are re-claimable by
  // Stripe retries, closing the gap where a crash after INSERT but before UPDATE
  // would permanently block reprocessing of a partially-applied event.
  const { error: claimErr } = await supabase
    .from("processed_stripe_events")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ event_id: event.id, status: "pending" } as any);

  if (claimErr) {
    if (claimErr.code !== "23505") {
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // Unique conflict: inspect the existing row to distinguish three cases:
    //   completed   → truly done, skip safely
    //   pending <30s → in-flight (another instance), tell Stripe to retry
    //   pending ≥30s → crash remnant, re-claimable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("processed_stripe_events")
      .select("status, processed_at")
      .eq("event_id", event.id)
      .single() as { data: { status: string; processed_at: string } | null };

    if (!existing || existing.status === "completed") {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const ageMs = Date.now() - new Date(existing.processed_at).getTime();
    if (ageMs < 30_000) {
      // Still in-flight — return 503 so Stripe retries after a delay.
      return NextResponse.json({ error: "Processing in progress" }, { status: 503 });
    }

    // Crash remnant: atomically re-claim via conditional UPDATE.
    // Using UPDATE instead of DELETE+INSERT prevents the TOCTOU race where two
    // concurrent retries both see pending+old, both delete, and both re-insert.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reclaimed } = await (supabase as any)
      .from("processed_stripe_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_id", event.id)
      .eq("status", "pending")
      .lt("processed_at", new Date(Date.now() - 30_000).toISOString())
      .select("event_id") as { data: { event_id: string }[] | null };

    if (!reclaimed?.length) {
      // Another instance just won the re-claim race — let it finish.
      return NextResponse.json({ error: "Processing in progress" }, { status: 503 });
    }
    // We own the re-claim — fall through to event processing below.
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

        // Session completion is not payment settlement. Delayed-settlement
        // methods (SEPA, Bacs, bank transfer, Klarna…) complete the session with
        // payment_status "unpaid" and leave the subscription "incomplete".
        // dashboard/upgrade/page.tsx already gates on subscription status for
        // the redirect path; this is the same guard for the webhook path.
        const settled =
          session.status === "complete" &&
          (session.payment_status === "paid" || session.payment_status === "no_payment_required");

        // Link the Stripe customer REGARDLESS of settlement. customer.subscription.
        // updated below matches on stripe_customer_id, so skipping this write
        // would leave the profile unfindable and the customer could pay and never
        // receive Plus. Only the plan grant is gated.
        const { error } = await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            ...(settled ? { plan_type: "subscription" as const } : {}),
            ...(cadence ? { cadence } : {}),
          })
          .eq("id", userId);
        if (error) throw error;

        if (!settled) {
          console.info(
            `[stripe/webhook] checkout.completed grant deferred uid=${userId} ` +
            `cust=${customerId} status=${session.status} payment_status=${session.payment_status} ` +
            `— awaiting customer.subscription.updated`
          );
        }

        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const endsAt = resolveSubscriptionEndsAt(sub);

        // Subscription status is authoritative for entitlement; subscription_ends_at
        // only drives UI copy. Previously this handler wrote ends_at and nothing
        // else, so a subscription entering dunning kept full Plus until the
        // eventual .deleted event — potentially weeks of unpaid access.
        //
        //   active / trialing        → entitled (also the settlement path for a
        //                              deferred grant from checkout above, and for
        //                              cancel_at_period_end, which stays active
        //                              until the period actually ends)
        //   past_due                 → keep access; Stripe is still retrying and
        //                              revoking mid-dunning punishes a recoverable
        //                              card failure
        //   unpaid / incomplete_expired → retries exhausted, or the initial payment
        //                              never completed. Revoke now.
        //   canceled                 → handled by customer.subscription.deleted
        if (sub.status === "unpaid" || sub.status === "incomplete_expired") {
          const { error } = await supabase
            .from("profiles")
            .update(FREE_PLAN_RESET)
            .eq("stripe_customer_id", customerId);
          if (error) throw error;
          console.warn(`[stripe/webhook] subscription.updated REVOKED cust=${customerId} status=${sub.status}`);
          break;
        }

        const entitled = sub.status === "active" || sub.status === "trialing";

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_ends_at: endsAt,
            ...(entitled ? { plan_type: "subscription" as const } : {}),
          })
          .eq("stripe_customer_id", customerId);
        if (error) throw error;
        console.info(
          `[stripe/webhook] subscription.updated cust=${customerId} status=${sub.status} ` +
          `entitled=${entitled} ends_at=${endsAt}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const { error } = await supabase
          .from("profiles")
          .update(FREE_PLAN_RESET)
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

  // Flip status to 'completed'. If this DB write fails after a successful
  // profile update, the pending row becomes a crash remnant — Stripe's next
  // retry will re-claim and re-process it. customer.subscription.updated is
  // not idempotent for subscription_ends_at (could overwrite a newer value),
  // so log CRITICAL for manual recovery if this ever fires in production.
  const { error: completeErr } = await supabase
    .from("processed_stripe_events")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: "completed" } as any)
    .eq("event_id", event.id);

  if (completeErr) {
    console.error(
      `[audit] stripe/webhook: CRITICAL failed to mark event completed ` +
      `evt=${event.id} type=${event.type} msg=${safeLogValue(completeErr.message)}`
    );
  }

  return NextResponse.json({ received: true });
}
