import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { checkStripeRateLimit } from "@/lib/rate-limit";

const STATIC_ORIGINS = new Set(
  [process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"].filter(Boolean) as string[]
);

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/dashboard?portal=return`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
