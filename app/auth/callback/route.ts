import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Missing code = invalid or tampered callback URL
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabase = await createClient();
  // Supabase PKCE flow validates the code_verifier stored in the cookie,
  // providing CSRF protection. We must still handle errors explicitly.
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Explicit allowlist of post-callback destinations. Falls back to /dashboard
  // for any unrecognised value to defeat open-redirect attempts that smuggle
  // path-prefix traversal or query-string payloads through `next`.
  const ALLOWED_NEXT = new Set(["/dashboard", "/onboarding", "/reset-password", "/partner-invite"]);
  const next = searchParams.get("next") ?? "/dashboard";
  const safePath = ALLOWED_NEXT.has(next) ? next : "/dashboard";

  // Forward ?plan= when landing on onboarding so StepPlan can pre-select.
  // Only the two known values are forwarded; anything else is dropped.
  const plan = searchParams.get("plan");
  const planSuffix =
    safePath === "/onboarding" && (plan === "free" || plan === "subscription")
      ? `?plan=${plan}`
      : "";
  const invite = searchParams.get("invite");
  const inviteSuffix =
    safePath === "/partner-invite" && invite && /^[A-Za-z0-9_-]{20,256}$/.test(invite)
      ? `?token=${encodeURIComponent(invite)}`
      : "";

  return NextResponse.redirect(`${origin}${safePath}${planSuffix}${inviteSuffix}`);
}
