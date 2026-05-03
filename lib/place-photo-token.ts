import { createHmac, timingSafeEqual } from "crypto";

// Server-side HMAC over (ref, exp) so we can hand the Next.js image
// optimizer a URL it can fetch without a session cookie. The optimizer
// runs as its own outbound process and does NOT forward browser
// cookies, which is why the original session-based auth gate on
// /api/place-photo broke <Image> rendering.
//
// Tokens are bearer credentials. They're issued only by server-rendered
// pages (RSC) that have already authenticated the caller, so no anonymous
// burn vector — but they ARE shareable for the duration of the TTL. The
// short horizon plus an IP-keyed rate limit on the signed branch (see
// app/api/place-photo/route.ts) bounds damage if a token leaks.

const TTL_SECONDS = 60 * 60 * 2; // 2h

function getSecret(): string {
  const s = process.env.PLACE_PHOTO_HMAC_SECRET;
  if (!s || s.length < 32) {
    throw new Error("PLACE_PHOTO_HMAC_SECRET env var not set or too short");
  }
  return s;
}

function hmac(ref: string, exp: number): string {
  return createHmac("sha256", getSecret()).update(`${ref}.${exp}`).digest("hex");
}

/**
 * Build a signed `/api/place-photo?ref=...&exp=...&sig=...` URL.
 * Call this from a Server Component or server action — never from the
 * browser, which has no access to the secret.
 */
export function signPlacePhotoUrl(ref: string): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const sig = hmac(ref, exp);
  return `/api/place-photo?ref=${encodeURIComponent(ref)}&exp=${exp}&sig=${sig}`;
}

/**
 * Verify a signed token from the request query. Returns true if the
 * signature matches and the token has not expired. Constant-time
 * compare on the hash to avoid timing oracles.
 */
export function verifyPlacePhotoToken(
  ref: string,
  expStr: string | null,
  sig: string | null,
): boolean {
  if (!expStr || !sig) return false;
  const exp = Number.parseInt(expStr, 10);
  if (!Number.isFinite(exp)) return false;
  if (exp < Math.floor(Date.now() / 1000)) return false;
  const expected = hmac(ref, exp);
  if (expected.length !== sig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
  } catch {
    return false;
  }
}
