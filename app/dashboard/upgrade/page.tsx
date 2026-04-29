import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_CADENCES = new Set(["weekly", "biweekly", "monthly"]);

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id) redirect("/dashboard");

  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.status !== "complete") redirect("/dashboard");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || session.metadata?.user_id !== user.id) redirect("/dashboard");

  const rawCadence = session.metadata?.cadence;
  const cadence = rawCadence && VALID_CADENCES.has(rawCadence) ? rawCadence : undefined;

  // plan_type and stripe_customer_id are protected by the lockdown trigger
  // from migration 015. Session ownership has been verified above, so the
  // admin client is the appropriate path for this trusted write.
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      plan_type: "subscription",
      stripe_customer_id: session.customer as string,
      ...(cadence ? { cadence } : {}),
    })
    .eq("id", user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .single();

  redirect(profile?.onboarding_complete ? "/dashboard" : "/onboarding");
}
