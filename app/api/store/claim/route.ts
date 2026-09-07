import { NextRequest, NextResponse } from "next/server";
import { hashClaimToken, isValidClaimTokenFormat } from "@/lib/store/claim-token";
import { getPurchaseByClaimHash } from "@/lib/store/purchases";
import { signStoreAccess, STORE_ACCESS_COOKIE } from "@/lib/store/access-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkStoreClaimRateLimit } from "@/lib/rate-limit";

// Entry point for the link in the fulfilment email. Exchanges the long-lived
// claim token for an HttpOnly cookie and redirects to a clean URL.
//
// Why a redirect and not a page that reads ?token= directly: the token is a
// permanent bearer credential for a paid file. A page URL carrying it ends up in
// PostHog's $current_url, Sentry breadcrumbs, the Google Ads tag, browser
// history sync and any Referer sent to a third party. A route handler is not
// instrumented by the client-side analytics, and the 302 leaves the token
// behind before any page renders.
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")?.trim()
    ?? "unknown";

  const failed = new URL("/store/downloads?claim=invalid", req.nextUrl.origin);

  try {
    await checkStoreClaimRateLimit(ip);
  } catch {
    return NextResponse.redirect(new URL("/store/downloads?claim=throttled", req.nextUrl.origin));
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!isValidClaimTokenFormat(token)) return NextResponse.redirect(failed);

  const purchase = await getPurchaseByClaimHash(hashClaimToken(token));
  if (!purchase) return NextResponse.redirect(failed);

  if (!purchase.claimed_at) {
    // First open. Not an authorisation gate — the link stays valid forever so a
    // buyer can re-download from the same email — just a record of first use.
    await createAdminClient()
      .from("store_purchases")
      .update({ claimed_at: new Date().toISOString() })
      .eq("id", purchase.id);
  }

  const { value, maxAge } = signStoreAccess(purchase.id);
  const res = NextResponse.redirect(new URL("/store/downloads", req.nextUrl.origin));
  res.cookies.set(STORE_ACCESS_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return res;
}
