import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { checkStripeRateLimit } from "@/lib/rate-limit";
import { safeLogValue } from "@/lib/log";

const STATIC_ORIGINS = new Set(
  [process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"].filter(Boolean) as string[]
);

const VALID_CADENCES = new Set(["weekly", "biweekly", "monthly"]);

// Reject anything that isn't a same-origin relative path. Disallow protocol-
// relative ("//evil.com") and backslash-prefixed forms that some browsers
// normalise to "//" before resolving against the origin.
function isSafeReturnPath(p: unknown): p is string {
  if (typeof p !== "string" || p.length === 0 || p.length > 256) return false;
  if (!p.startsWith("/")) return false;
  if (p.startsWith("//") || p.startsWith("/\\")) return false;
  return true;
}

function isAllowedOrigin(req: Request, origin: string | null): boolean {
  if (!origin) return false;
  if (STATIC_ORIGINS.has(origin)) return true;
  // Fallback: accept requests from the same host (covers preview URLs, non-3000 ports)
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? "https";
  return !!host && origin === `${proto}://${host}`;
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(req, origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await checkStripeRateLimit(user.id);

  const { cadence: rawCadence, returnPath: rawReturnPath } = await req.json();

  const cadence = typeof rawCadence === "string" && VALID_CADENCES.has(rawCadence)
    ? rawCadence
    : "monthly";
  const returnPath = isSafeReturnPath(rawReturnPath) ? rawReturnPath : "/dashboard";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      customer_email: user.email,
      success_url: `${origin}/dashboard/upgrade?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: (() => { const base = `${origin}${returnPath}`; return base.includes("?") ? `${base}&checkout=cancelled` : `${base}?checkout=cancelled`; })(),
      metadata: { user_id: user.id, cadence },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Stripe error strings can leak request IDs / parameter context.
    // Log internally; return generic message to the client.
    console.error(`[stripe/checkout] uid=${safeLogValue(user.id)} err=${safeLogValue(err)}`);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
