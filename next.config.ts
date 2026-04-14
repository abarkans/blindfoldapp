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
  // CSP: restrict where resources can load from.
  // unsafe-inline + unsafe-eval required by Next.js App Router hydration and Tailwind CSS v4.
  // Tighten with nonces in a future pass.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Place photos served through internal proxy (/api/place-photo); data: for inline SVGs/favicons
      "img-src 'self' data: blob:",
      "font-src 'self'",
      // Client-side fetch targets: Supabase (REST + Realtime WS) + Nominatim geocoding
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org",
      // Deny all framing
      "frame-ancestors 'none'",
      // Restrict <base> and <form> to same origin
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
