import path from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Force HTTPS for 1 year, include subdomains
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Deny framing (clickjacking protection) — also enforced by CSP frame-ancestors
  { key: "X-Frame-Options", value: "DENY" },
  // Limit referrer info sent to external origins
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not used by this app
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  // Content-Security-Policy is set per-request in proxy.ts so each
  // response can carry a fresh nonce for inline scripts.
];

const nextConfig: NextConfig = {
  // Pin Turbopack workspace root. Next 16.2.4 tightened root inference and
  // started panicking ("Next.js package not found") when it couldn't walk
  // up to a single project directory unambiguously. Anchoring to __dirname
  // makes the project root explicit.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      { pathname: "/**" },
      { pathname: "/api/place-photo", search: "**" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.blindfolddate.com" }],
        destination: "https://blindfolddate.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    // Defense in depth against archive crawlers / log scrapers picking up
    // PKCE codes, password-reset tokens, or deletion-confirmation tokens
    // that briefly appear in URLs on these routes. The site-wide
    // metadata.robots noindex tag is HTML-only; this is HTTP-level.
    const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      { source: "/login/:path*", headers: noIndex },
      { source: "/register/:path*", headers: noIndex },
      { source: "/auth/:path*", headers: noIndex },
      { source: "/account/:path*", headers: noIndex },
      { source: "/reset-password/:path*", headers: noIndex },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // Source map upload requires SENTRY_AUTH_TOKEN + org/project.
  // Set those in Vercel env to enable stack traces on production errors.
  // Without them, errors still capture but stack frames show minified names.
});
