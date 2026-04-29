import { createAdminClient } from "@/lib/supabase/admin";

// Postgres-based rate limiter. Backed by the rate_limits table and the
// check_rate_limit() RPC introduced in migration 017. The RPC is
// SECURITY DEFINER and EXECUTE is granted only to service_role, so an
// authenticated client cannot burn another user's quota by calling
// the function directly.
//
// On infrastructure errors (Supabase RPC failure) the limiter fails
// open and logs — same posture as the previous Upstash implementation.
// Failing closed here would compound a Supabase outage by 500-ing
// every reveal/complete/Stripe action, which is worse than running
// briefly unmetered.

async function check(key: string, max: number, windowSeconds: number): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error(`[rate-limit] rpc error key=${key} msg=${error.message}`);
    return; // fail open
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
 */
export async function checkRevealRateLimit(userId: string): Promise<void> {
  await check(`reveal:${userId}`, 3, 60);
}

/**
 * Enforce per-user rate limits on the complete action.
 * Limit: 5 completions per 60 seconds (guards against XP/badge farming).
 */
export async function checkCompleteRateLimit(userId: string): Promise<void> {
  await check(`complete:${userId}`, 5, 60);
}

/**
 * Enforce per-user rate limits on Stripe checkout/portal session creation.
 * Limit: 10 per hour (guards against Stripe API abuse and unexpected billing).
 */
export async function checkStripeRateLimit(userId: string): Promise<void> {
  await check(`stripe:${userId}`, 10, 3600);
}
