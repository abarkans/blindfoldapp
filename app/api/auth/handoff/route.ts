import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAuthHandoffRateLimit } from "@/lib/rate-limit";
import { isAllowedOrigin } from "@/lib/origin";
import { safeLogValue } from "@/lib/log";

// Mints a one-time login link for the Capacitor app's "Manage account" button.
// The app's main webview is already authenticated, but Browser.open() opens a
// separate browser context (SFSafariViewController / Custom Tab) with its own
// cookie jar, so the external tab would otherwise land on a logged-out page.
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await checkAuthHandoffRateLimit(user.id);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 429 });
  }

  const { data, error } = await createAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
  });

  if (error || !data?.properties?.hashed_token) {
    console.error(`[auth/handoff] uid=${safeLogValue(user.id)} err=${safeLogValue(error)}`);
    return NextResponse.json({ error: "Could not start session handoff." }, { status: 500 });
  }

  const next = encodeURIComponent("/dashboard?tab=settings");
  const url = `${origin}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=${next}`;
  return NextResponse.json({ url });
}
