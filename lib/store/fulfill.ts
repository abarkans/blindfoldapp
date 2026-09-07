import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM_ADDRESS } from "@/lib/email/resend";
import { storePurchaseEmail } from "@/lib/email/templates/store-purchase";
import { generateClaimToken } from "@/lib/store/claim-token";
import { getStoreProduct } from "@/lib/store/products";
import { safeLogValue } from "@/lib/log";

/**
 * Grant a one-off digital purchase and mail the claim link.
 *
 * Called from the Stripe webhook for both `checkout.session.completed`
 * (mode='payment') and `checkout.session.async_payment_succeeded`. Safe to call
 * twice for the same session: the insert is `on conflict do nothing` on
 * stripe_session_id, and the email only goes out when a row was actually
 * created. That row-level guard matters because the webhook's crash-remnant
 * re-claim path (migration 058) intentionally re-processes events older than
 * 30s — event-level dedup alone would not stop a second charge-free grant and a
 * second email.
 *
 * Throws only on database failure, which lets the webhook release its
 * idempotency claim and Stripe retry. A missing product or email is NOT thrown:
 * a retry cannot fix either, and failing forever would block the endpoint.
 */
export async function fulfillStorePurchase(session: Stripe.Checkout.Session): Promise<void> {
  const product = getStoreProduct(session.metadata?.product_id);
  if (!product) {
    // Paid, and nothing to deliver: the webhook will mark the event completed
    // and nothing retries. Needs a human, hence the audit prefix.
    console.error(
      `[audit] store/fulfill: CRITICAL unknown product session=${session.id} ` +
      `product_id=${safeLogValue(session.metadata?.product_id)}`
    );
    return;
  }

  // Stripe Checkout collects the email itself in payment mode; customer_email is
  // only set when we prefilled it for a signed-in buyer.
  const rawEmail = session.customer_details?.email ?? session.customer_email;
  if (!rawEmail) {
    // Same posture: charged, undeliverable, and a retry cannot conjure an email.
    console.error(`[audit] store/fulfill: CRITICAL no email on session=${session.id} — cannot deliver`);
    return;
  }
  const email = rawEmail.trim().toLowerCase();

  const admin = createAdminClient();
  const { raw: claimToken, hash: claimTokenHash } = generateClaimToken();

  // Link to an account when one already exists under that address. Purely a
  // convenience so the buyer sees the file at /store/downloads while signed in —
  // the claim token remains the primary credential either way.
  let userId: string | null = null;
  const metadataUserId = session.metadata?.user_id;
  if (metadataUserId) {
    userId = metadataUserId;
  } else {
    const { data } = await admin.rpc("get_user_id_by_email", { p_email: email });
    userId = (data as string | null) ?? null;
  }

  // Plain INSERT with an explicit unique-violation branch rather than an upsert:
  // the entire no-double-email guarantee rests on distinguishing "row created"
  // from "row already there", and a 23505 is unambiguous about which happened.
  // Getting that backwards would re-send the claim email carrying the token
  // generated above — which was never persisted, so the newest email in the
  // buyer's inbox would hold a dead link. Same 23505 check the subscription
  // webhook already uses for its idempotency claim.
  const { data: inserted, error } = await admin
    .from("store_purchases")
    .insert({
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      product_id: product.id,
      email,
      user_id: userId,
      amount_total: session.amount_total,
      currency: session.currency,
      claim_token_hash: claimTokenHash,
    })
    .select("id");

  if (error) {
    if (error.code === "23505") {
      // Already fulfilled and already mailed on an earlier delivery of this
      // session. The token generated above was never stored — drop it.
      console.info(`[store/fulfill] duplicate session=${session.id} — already fulfilled`);
      return;
    }
    throw error;
  }

  if (!inserted?.length) {
    console.error(`[audit] store/fulfill: CRITICAL insert returned no row session=${session.id}`);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfolddate.com";
  const claimUrl = `${appUrl}/api/store/claim?token=${claimToken}`;
  const { subject, html } = storePurchaseEmail({
    productName: product.name,
    format: product.format,
    claimUrl,
  });

  // A failed send must NOT throw: the purchase is already recorded and a Stripe
  // retry would hit the duplicate branch above and never re-send anyway. The
  // buyer still reaches the file through the success page, which grants access
  // from the paid session directly.
  try {
    const { error: sendErr } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject,
      html,
    });
    if (sendErr) {
      console.error(
        `[audit] store/fulfill: CRITICAL claim email failed session=${session.id} ` +
        `purchase=${inserted[0].id} msg=${safeLogValue(sendErr.message)}`
      );
    }
  } catch (err) {
    console.error(
      `[audit] store/fulfill: CRITICAL claim email threw session=${session.id} ` +
      `purchase=${inserted[0].id} err=${safeLogValue(err)}`
    );
  }
}
