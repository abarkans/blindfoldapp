import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Verifies a Supabase OTP/magic-link token_hash and establishes a session in
// whichever browser context opens this link — used by the Capacitor app to
// hand off an authenticated session to the external in-app browser, since
// that browser has its own cookie jar separate from the app's main webview.
//
// Only "magiclink" is accepted: it's the only type /api/auth/handoff issues.
// Pinning it (instead of trusting the query param) keeps this GET endpoint —
// reachable by anyone who has a token_hash — from being repurposed for other
// OTP flows (recovery, email_change) it was never meant to verify.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  // Open-redirect guard: only allow paths that start with /dashboard.
  const next = nextParam.startsWith("/dashboard") ? nextParam : "/dashboard";

  if (token_hash && type === "magiclink") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
