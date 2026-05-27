import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { checkStripeRateLimit } from "@/lib/rate-limit";
import { safeLogValue } from "@/lib/log";
import { isAllowedOrigin } from "@/lib/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";

const VALID_CADENCES = new Set(["weekly", "biweekly", "monthly"]);
const VALID_BILLING_INTERVALS = new Set(["monthly", "yearly"]);

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
  const access = await getCoupleAccess(createAdminClient(), user.id);
  if (access.role !== "owner") {
    return NextResponse.json({ error: "Only the account owner can manage billing" }, { status: 403 });
  }

  await checkStripeRateLimit(user.id);

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const { cadence: rawCadence, billingInterval: rawInterval, returnPath: rawReturnPath } = body;

  const cadence = typeof rawCadence === "string" && VALID_CADENCES.has(rawCadence)
    ? rawCadence
    : "monthly";
  const billingInterval = typeof rawInterval === "string" && VALID_BILLING_INTERVALS.has(rawInterval)
    ? rawInterval as "monthly" | "yearly"
    : "monthly";
  const returnPath = isSafeReturnPath(rawReturnPath) ? rawReturnPath : "/dashboard";

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("stripe_customer_id, plan_type")
    .eq("id", user.id)
    .single();

  if (profile?.plan_type === "subscription") {
    // Return 200 so the client can advance cleanly without a console error.
    return NextResponse.json({ alreadySubscribed: true });
  }

  const isFirstTimeSubscriber = !profile?.stripe_customer_id;

  const priceId = billingInterval === "yearly"
    ? process.env.STRIPE_YEARLY_PRICE_ID!
    : process.env.STRIPE_PRICE_ID!;

  // Intro coupon only applies to monthly — yearly price already reflects the saving.
  const applyDiscount = billingInterval === "monthly" && !!process.env.STRIPE_INTRO_COUPON_ID && isFirstTimeSubscriber;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(applyDiscount
        ? { discounts: [{ coupon: process.env.STRIPE_INTRO_COUPON_ID! }] }
        : {}),
      // Reuse existing Stripe customer when available to prevent duplicate customers
      // on re-subscription. Fall back to email lookup only for first-time subscribers.
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: user.email }),
      success_url: `${origin}/dashboard/upgrade?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: (() => { const base = `${origin}${returnPath}`; return base.includes("?") ? `${base}&checkout=cancelled` : `${base}?checkout=cancelled`; })(),
      metadata: { user_id: user.id, cadence, billing_interval: billingInterval },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Stripe error strings can leak request IDs / parameter context.
    // Log internally; return generic message to the client.
    console.error(`[stripe/checkout] uid=${safeLogValue(user.id)} err=${safeLogValue(err)}`);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
