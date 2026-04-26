import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { checkStripeRateLimit } from "@/lib/rate-limit";

const ALLOWED_ORIGINS = new Set(
  [process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"].filter(Boolean) as string[]
);

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await checkStripeRateLimit(user.id);

  const { cadence, returnPath } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    customer_email: user.email,
    success_url: `${origin}/dashboard/upgrade?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard?checkout=cancelled`,
    metadata: { user_id: user.id, cadence: cadence ?? "monthly" },
  });

  return NextResponse.json({ url: session.url });
}
