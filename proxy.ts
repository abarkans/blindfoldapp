import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { unitSystemForCountry } from "@/lib/units";
import { UNIT_SYSTEM_COOKIE } from "@/lib/get-unit-system";

// Build a per-request CSP using a fresh nonce so we can drop
// 'unsafe-inline' / 'unsafe-eval' from script-src in production.
// 'strict-dynamic' lets nonced scripts load child chunks dynamically
// (required for Next.js client bootstrap + hydration).
//
// In development we still allow 'unsafe-eval' because Turbopack HMR
// evaluates modules at runtime via Function/eval. Keeping the prod
// posture clean is the goal — dev relaxation is acceptable since
// dev never serves real users.
//
// `enforce` builds the enforced policy (still ships unsafe-eval until
// the Turbopack runtime chunk is isolated). `false` builds the
// report-only twin without unsafe-eval — does not block, just emits
// violation reports to /api/csp-report so we can identify the chunks
// that need it. Once reports are clean for ~1 week we can flip the
// enforced policy.
function buildCsp(nonce: string, enforce: boolean): string {
  const isDev = process.env.NODE_ENV !== "production";
  // Vercel Live (feedback/comments overlay) injects eval-using scripts on
  // preview deploys. Allow only on preview, never on real production.
  const isPreview = process.env.VERCEL_ENV === "preview";
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
    ...(isPreview ? ["https://vercel.live"] : []),
    // Cloudflare Turnstile loader (api.js + challenge platform).
    "https://challenges.cloudflare.com",
    // Enforced policy keeps unsafe-eval as a temporary safety net for
    // Next.js 16 / Turbopack runtime chunks that still call eval. The
    // report-only twin omits it so we can collect violation reports
    // and patch the offending chunks before flipping enforcement.
    ...(enforce ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const connectSrc = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://nominatim.openstreetmap.org",
    ...(isPreview ? ["https://vercel.live", "wss://ws-us3.pusher.com"] : []),
  ].join(" ");

  const frameSrc = [
    "https://challenges.cloudflare.com",
    ...(isPreview ? ["https://vercel.live"] : []),
  ].join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Tailwind + framer-motion inline styles. Acceptable XSS surface
    // because style-based attacks are limited and Tailwind v4 has no
    // viable alternative without breaking hydration.
    "style-src 'self' 'unsafe-inline'",
    // Place photos served through internal proxy (/api/place-photo);
    // data: for inline SVGs/favicons; blob: for client-generated assets.
    "img-src 'self' data: blob: https://vercel.live https://vercel.com",
    "font-src 'self' https://vercel.live https://assets.vercel.com",
    `connect-src ${connectSrc}`,
    `frame-src ${frameSrc}`,
    "worker-src blob: 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  // Only the report-only header carries report-uri; the enforced
  // header doesn't need it (we don't want to log violations of the
  // looser policy).
  if (!enforce) directives.push("report-uri /api/csp-report");

  return directives.join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Per-request nonce. Cryptographically random; base64-encoded for the
  // CSP header. Not stored — regenerated every request.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, true);
  // Production-only report-only header used to investigate which
  // Turbopack chunks still need 'unsafe-eval'. Skip in dev where
  // Turbopack HMR triggers floods of legitimate eval violations.
  const cspReportOnly =
    process.env.NODE_ENV === "production" ? buildCsp(nonce, false) : null;

  // First-visit unit-system detection from Vercel geo header.
  // Push into request.cookies immediately so this-request RSCs see it,
  // then write to whatever response we end up returning.
  let pendingUnitCookie: string | null = null;
  if (!request.cookies.get(UNIT_SYSTEM_COOKIE)) {
    const country = request.headers.get("x-vercel-ip-country");
    const system = unitSystemForCountry(country);
    request.cookies.set(UNIT_SYSTEM_COOKIE, system);
    pendingUnitCookie = system;
  }
  const applyResponseHeaders = (res: NextResponse) => {
    res.headers.set("Content-Security-Policy", csp);
    if (cspReportOnly) {
      res.headers.set("Content-Security-Policy-Report-Only", cspReportOnly);
    }
    res.headers.set("x-nonce", nonce);
    if (pendingUnitCookie) {
      res.cookies.set(UNIT_SYSTEM_COOKIE, pendingUnitCookie, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return res;
  };

  // Forward the nonce to RSCs via the request headers so app/layout.tsx
  // can read it via next/headers and apply it to inline <script> tags.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: calling getUser() here is what triggers the session token refresh.
  // Do not add any logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated → protected routes → send to login
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding"))) {
    return applyResponseHeaders(NextResponse.redirect(new URL("/login", request.url)));
  }

  // Authenticated → auth pages → send to dashboard only if onboarding is done.
  // Users with incomplete onboarding can visit /login and /register freely
  // (e.g. to switch accounts or after navigating back from the landing page).
  if (user && (pathname === "/login" || pathname === "/register")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_complete) {
      return applyResponseHeaders(NextResponse.redirect(new URL("/dashboard", request.url)));
    }
  }

  return applyResponseHeaders(supabaseResponse);
}

export const proxyConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
