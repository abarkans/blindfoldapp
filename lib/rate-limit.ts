import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazily instantiated so cold starts don't fail if env vars are missing.
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env.
let revealLimiter: Ratelimit | null = null;
let completeLimiter: Ratelimit | null = null;
let stripeLimiter: Ratelimit | null = null;

function buildLimiter(requests: number, windowSeconds: number): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Rate limiting is disabled — warn once in dev, silent in production to avoid log spam.
    if (process.env.NODE_ENV === "development") {
      console.warn("[rate-limit] Upstash env vars not set — rate limiting is disabled.");
    }
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    analytics: false,
  });
}

/**
 * Enforce per-user rate limits on the reveal action.
 * Limit: 3 reveals per 60 seconds (guards against AI/Places API cost runup).
 */
export async function checkRevealRateLimit(userId: string): Promise<void> {
  if (!revealLimiter) revealLimiter = buildLimiter(3, 60);
  if (!revealLimiter) return;

  const { success, reset } = await revealLimiter.limit(`reveal:${userId}`);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    throw new Error(`Too many requests. Try again in ${retryAfter} seconds.`);
  }
}

/**
 * Enforce per-user rate limits on the complete action.
 * Limit: 5 completions per 60 seconds (guards against XP/badge farming).
 */
export async function checkCompleteRateLimit(userId: string): Promise<void> {
  if (!completeLimiter) completeLimiter = buildLimiter(5, 60);
  if (!completeLimiter) return;

  const { success, reset } = await completeLimiter.limit(`complete:${userId}`);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    throw new Error(`Too many requests. Try again in ${retryAfter} seconds.`);
  }
}

/**
 * Enforce per-user rate limits on Stripe checkout/portal session creation.
 * Limit: 10 per hour (guards against Stripe API abuse and unexpected billing).
 */
export async function checkStripeRateLimit(userId: string): Promise<void> {
  if (!stripeLimiter) stripeLimiter = buildLimiter(10, 3600);
  if (!stripeLimiter) return;

  const { success, reset } = await stripeLimiter.limit(`stripe:${userId}`);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    throw new Error(`Too many requests. Try again in ${retryAfter} seconds.`);
  }
}
