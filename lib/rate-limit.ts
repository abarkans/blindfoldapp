import { createAdminClient } from "@/lib/supabase/admin";

// Postgres-based rate limiter. Backed by the rate_limits table and the
// check_rate_limit() RPC introduced in migration 017. The RPC is
// SECURITY DEFINER and EXECUTE is granted only to service_role, so an
// authenticated client cannot burn another user's quota by calling
// the function directly.
//
// Failure posture is per-action:
//   - failClosed=true  : RPC error → block the request. Used for actions
//                        that hit paid third-party APIs (Anthropic, Google
//                        Places, Stripe) where unmetered traffic is worse
//                        than a brief outage of the action.
//   - failClosed=false : RPC error → allow. Used for cost-free actions
//                        (e.g. completeDate XP increment) where blocking
//                        on a transient DB hiccup would harm UX without
//                        protecting any external spend.

async function check(
  key: string,
  max: number,
  windowSeconds: number,
  failClosed: boolean,
): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error(`[rate-limit] rpc error key=${key} failClosed=${failClosed} msg=${error.message}`);
    if (failClosed) {
      throw new Error("Service temporarily unavailable. Please try again.");
    }
    return;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (row && row.allowed === false) {
    throw new Error(
      `Too many requests. Try again in ${row.retry_after_seconds} seconds.`
    );
  }
}

/**
 * Enforce per-user rate limits on the reveal action.
 * Limit: 3 reveals per 60 seconds (guards against AI/Places API cost runup).
 * Fails closed: paid AI + Places spend.
 */
export async function checkRevealRateLimit(userId: string): Promise<void> {
  await check(`reveal:${userId}`, 3, 60, true);
}

/**
 * Enforce per-user rate limits on the complete action.
 * Limit: 5 completions per 60 seconds (guards against XP/badge farming).
 * Fails open: no external cost — blocking on DB hiccup hurts UX for nothing.
 */
export async function checkCompleteRateLimit(userId: string): Promise<void> {
  await check(`complete:${userId}`, 5, 60, false);
}

/**
 * Enforce per-user rate limits on Stripe checkout/portal session creation.
 * Limit: 10 per hour (guards against Stripe API abuse and unexpected billing).
 * Fails closed: Stripe API spend + accidental subscriptions.
 */
export async function checkStripeRateLimit(userId: string): Promise<void> {
  await check(`stripe:${userId}`, 10, 3600, true);
}

/**
 * Enforce per-user rate limits on Google Places photo proxy.
 * Limit: 120 per hour (guards against Google Maps quota exhaustion).
 * Fails closed: paid Google Maps quota.
 */
export async function checkPlacePhotoRateLimit(userId: string): Promise<void> {
  await check(`place-photo:${userId}`, 120, 3600, true);
}
