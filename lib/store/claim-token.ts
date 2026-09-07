import { createHash, randomBytes } from "node:crypto";

// The claim token is the bearer credential mailed to a guest buyer -- it is the
// only thing standing between a URL and a paid file, so only its SHA-256 hash
// is persisted (see migration 070). 32 random bytes is 256 bits of entropy;
// base64url keeps it URL-safe and exactly 43 characters.
//
// No HMAC here on purpose: an HMAC would let anyone holding the secret mint
// tokens for arbitrary purchases. A random token has to exist in the table to
// be worth anything, so a leaked secret grants nothing.

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function hashClaimToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateClaimToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashClaimToken(raw) };
}

/** Cheap shape check before touching the database, so junk never hits the index. */
export function isValidClaimTokenFormat(raw: unknown): raw is string {
  return typeof raw === "string" && TOKEN_PATTERN.test(raw);
}
