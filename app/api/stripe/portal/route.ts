import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { checkStripeRateLimit } from "@/lib/rate-limit";
import { safeLogValue } from "@/lib/log";
import { isAllowedOrigin } from "@/lib/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";

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
    // Stripe error strings can leak request IDs / parameter context.
    // Log internally; return generic message to the client.
    console.error(`[stripe/portal] uid=${safeLogValue(user.id)} err=${safeLogValue(err)}`);
    return NextResponse.json({ error: "Could not open billing portal. Please try again." }, { status: 500 });
  }
}
