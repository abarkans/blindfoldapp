import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { checkStripeRateLimit } from "@/lib/rate-limit";
import { safeLogValue } from "@/lib/log";
import { isAllowedOrigin } from "@/lib/origin";

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

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  const isFirstTimeSubscriber = !profile?.stripe_customer_id;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      ...(process.env.STRIPE_INTRO_COUPON_ID && isFirstTimeSubscriber
        ? { discounts: [{ coupon: process.env.STRIPE_INTRO_COUPON_ID }] }
        : {}),
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
