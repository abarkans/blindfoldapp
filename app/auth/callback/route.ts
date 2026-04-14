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

  // Middleware will handle redirect to /onboarding if onboarding is incomplete
  return NextResponse.redirect(`${origin}/dashboard`);
}
