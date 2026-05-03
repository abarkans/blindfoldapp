import type { NextConfig } from "next";

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

export default nextConfig;
