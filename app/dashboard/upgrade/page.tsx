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
  const { error: upgradeError } = await admin
    .from("profiles")
    .update({
      plan_type: "subscription",
      stripe_customer_id: session.customer as string,
      ...(cadence ? { cadence } : {}),
    })
    .eq("id", user.id);
  if (upgradeError) {
    console.error(`[upgrade] profile update failed uid=${user.id} msg=${upgradeError.message}`);
    redirect("/onboarding");
  }

  // Retroactively credit any dates this user completed while on the free
  // plan. Idempotent — recomputes from date_ideas history. Trigger
  // award_milestone_badges fires on the count delta.
  await admin.rpc("backfill_completed_xp", { p_user_id: user.id, p_xp_per_date: 100 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_complete) redirect("/dashboard");

  const params = new URLSearchParams({
    checkout: "completed",
    session_id,
  });
  if (cadence) params.set("cadence", cadence);

  redirect(`/onboarding?${params.toString()}`);
}
