import { createHmac, timingSafeEqual } from "node:crypto";

// Short-lived proof that the holder has already presented a valid credential
// for one purchase -- either the claim token from the fulfilment email or a
// paid Stripe session on the success page. It rides in an HttpOnly cookie, so
// the long-lived claim token never has to sit in a URL that PostHog, Sentry,
// Google Ads or a browser history sync would record.
//
// Same construction as lib/place-photo-token.ts: HMAC over (id, exp), constant-
// time compare, expiry checked before the signature is trusted.

const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — a purchase is permanent; the cookie is just convenience.

export const STORE_ACCESS_COOKIE = "bd_store_access";

function getSecret(): string {
  const s = process.env.STORE_TOKEN_SECRET;
  if (!s || s.length < 32) {
    throw new Error("STORE_TOKEN_SECRET env var not set or too short");
  }
  return s;
}

function hmac(purchaseId: string, exp: number): string {
  return createHmac("sha256", getSecret()).update(`${purchaseId}.${exp}`).digest("hex");
}

/** Cookie value: `{purchaseId}.{exp}.{sig}` */
export function signStoreAccess(purchaseId: string): { value: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  return { value: `${purchaseId}.${exp}.${hmac(purchaseId, exp)}`, maxAge: TTL_SECONDS };
}

/** Returns the purchase ID the cookie authorises, or null if absent/expired/forged. */
export function verifyStoreAccess(value: string | undefined | null): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [purchaseId, expStr, sig] = parts;

  const exp = Number.parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;

  const expected = hmac(purchaseId, exp);
  if (expected.length !== sig.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"))) return null;
  } catch {
    return null;
  }
  return purchaseId;
}
