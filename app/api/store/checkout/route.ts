import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getStoreProduct, resolvePriceId } from "@/lib/store/products";
import { checkStoreCheckoutRateLimit } from "@/lib/rate-limit";
import { isAllowedOrigin } from "@/lib/origin";
import { safeLogValue } from "@/lib/log";

// One-off digital purchase. Unlike /api/stripe/checkout this is deliberately
// open to guests: the store sells files, not seats, so requiring an account
// would cost conversions for no security gain. The claim token mailed after
// payment is what grants access.
//
// Two things this route must NOT do, both learned from the subscription route:
//   1. Never write profiles.stripe_customer_id. That column is what
//      /api/stripe/checkout reads to decide isFirstTimeSubscriber, so writing it
//      here would silently burn a buyer's €0.99 intro month.
//   2. Never accept a price or amount from the client. The body carries a
//      product slug; the price ID is resolved server-side from env.

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")?.trim()
    ?? "unknown";

  try {
    await checkStoreCheckoutRateLimit(ip);
  } catch {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const product = getStoreProduct(body.productId);
  if (!product) {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }

  // Optional: a signed-in buyer gets their email prefilled and the purchase
  // linked to their account up front. Absence of a session is not an error.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: await resolvePriceId(product), quantity: 1 }],
      // Guest path: Stripe collects the address itself and we read it back off
      // customer_details in the webhook.
      ...(user?.email ? { customer_email: user.email } : {}),
      // Lands on a route handler, not a page: it fulfils immediately (the redirect
      // usually beats the webhook) and sets the access cookie, so no session ID
      // ever ends up in a page URL that analytics would record.
      // The EU right of withdrawal on digital content survives unless the buyer
      // expressly requests immediate delivery and acknowledges losing it
      // (Directive 2011/83/EU Art. 16(m)). Terms acceptance is the record of
      // that, so it is required rather than optional — without this the waiver
      // in /legal/terms is asserted but never actually agreed to.
      // Requires a Terms of service URL set in Stripe → Settings → Public details.
      consent_collection: { terms_of_service: "required" as const },
      custom_text: {
        terms_of_service_acceptance: {
          message:
            "I request immediate delivery of this download and accept that I lose my 14-day right of withdrawal once it is available.",
        },
      },
      success_url: `${origin}/api/store/session-claim?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store?checkout=cancelled`,
      metadata: {
        product_id: product.id,
        ...(user ? { user_id: user.id } : {}),
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Stripe error strings can leak request IDs / parameter context.
    console.error(`[store/checkout] product=${product.id} ip=${safeLogValue(ip)} err=${safeLogValue(err)}`);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
