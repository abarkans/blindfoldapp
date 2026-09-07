import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { fulfillStorePurchase } from "@/lib/store/fulfill";
import { getPurchaseBySessionId } from "@/lib/store/purchases";
import { signStoreAccess, STORE_ACCESS_COOKIE } from "@/lib/store/access-token";
import { checkStoreClaimRateLimit } from "@/lib/rate-limit";
import { safeLogValue } from "@/lib/log";

// Stripe's success_url lands here rather than on a page.
//
// Fulfilling here as well as in the webhook is deliberate (and Stripe's own
// recommendation): the redirect frequently beats the webhook, and a buyer who
// lands on "check your email" while nothing has been written yet has no way to
// tell a lag from a failure. fulfillStorePurchase() is idempotent on
// stripe_session_id, so whichever path arrives second is a no-op — no duplicate
// row, no duplicate email.
//
// Being a route handler also means the cookie can be set here and the session ID
// never reaches a rendered page URL, matching /api/store/claim.
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")?.trim()
    ?? "unknown";

  try {
    await checkStoreClaimRateLimit(ip);
  } catch {
    return NextResponse.redirect(new URL("/store/downloads?claim=throttled", origin));
  }

  const sessionId = req.nextUrl.searchParams.get("session_id");
  // Stripe checkout session IDs are `cs_` + alphanumerics; anything else never
  // reaches the API.
  if (!sessionId || !/^cs_[A-Za-z0-9_]{10,120}$/.test(sessionId)) {
    return NextResponse.redirect(new URL("/store/downloads?claim=invalid", origin));
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error(`[store/session-claim] retrieve failed err=${safeLogValue(err)}`);
    return NextResponse.redirect(new URL("/store/downloads?claim=invalid", origin));
  }

  if (session.mode !== "payment") {
    return NextResponse.redirect(new URL("/store/downloads?claim=invalid", origin));
  }

  // Delayed-settlement methods (SEPA, bank transfer…) redirect here unpaid. No
  // entitlement yet — checkout.session.async_payment_succeeded will fulfil and
  // mail the link when the money actually lands.
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return NextResponse.redirect(new URL("/store/downloads?claim=pending", origin));
  }

  try {
    await fulfillStorePurchase(session);
  } catch (err) {
    // The webhook is the backstop: it will retry and fulfil. Send the buyer to a
    // page that explains the email is coming rather than showing a hard error.
    console.error(`[store/session-claim] fulfil failed session=${sessionId} err=${safeLogValue(err)}`);
    return NextResponse.redirect(new URL("/store/downloads?claim=pending", origin));
  }

  const purchase = await getPurchaseBySessionId(session.id);
  if (!purchase) {
    return NextResponse.redirect(new URL("/store/downloads?claim=pending", origin));
  }

  const { value, maxAge } = signStoreAccess(purchase.id);
  const res = NextResponse.redirect(new URL("/store/downloads?claim=new", origin));
  res.cookies.set(STORE_ACCESS_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return res;
}
