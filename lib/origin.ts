// Allowlist for sensitive same-origin POST endpoints (Stripe checkout/portal).
//
// Inputs are platform-set env vars only — never request headers. Accepting
// X-Forwarded-Host as a fallback fails open the moment a non-Vercel CDN/WAF
// terminates in front of us, since attackers can spoof that header for any
// HTTP client they don't control.
//
// Static set:
//   - NEXT_PUBLIC_APP_URL  → production domain
//   - http://localhost:3000 → dev server
//   - https://${VERCEL_URL} → current preview deploy (only when VERCEL_ENV=preview).
//                              VERCEL_URL is set by the Vercel runtime and
//                              cannot be forged via headers.
const ALLOWED_ORIGINS = new Set(
  [
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
    process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null,
  ].filter(Boolean) as string[]
);

export function isAllowedOrigin(origin: string | null): boolean {
  return !!origin && ALLOWED_ORIGINS.has(origin);
}
