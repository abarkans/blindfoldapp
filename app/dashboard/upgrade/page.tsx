import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";

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

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  // Partners never own billing — guard here mirrors the checkout route.
  if (access.role !== "owner") redirect("/dashboard");

  const rawCadence = session.metadata?.cadence;
  const cadence = rawCadence && VALID_CADENCES.has(rawCadence) ? rawCadence : undefined;

  // plan_type and stripe_customer_id are protected by the lockdown trigger
  // from migration 015. Session ownership has been verified above, so the
  // admin client is the appropriate path for this trusted write.
  const { error: upgradeError } = await admin
    .from("profiles")
    .update({
      plan_type: "subscription",
      stripe_customer_id: session.customer as string,
      ...(cadence ? { cadence } : {}),
    })
    .eq("id", access.profileId);
  if (upgradeError) {
    console.error(`[upgrade] profile update failed uid=${user.id} profileId=${access.profileId} msg=${upgradeError.message}`);
    redirect("/dashboard");
  }

  // Retroactively credit any dates this user completed while on the free
  // plan. Idempotent — recomputes from date_ideas history. Trigger
  // award_milestone_badges fires on the count delta.
  await admin.rpc("backfill_completed_xp", { p_user_id: access.profileId, p_xp_per_date: 100 });

  const { data: profile } = await admin
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", access.profileId)
    .single();

  if (profile?.onboarding_complete) redirect("/dashboard");

  const params = new URLSearchParams({
    checkout: "completed",
    session_id,
  });
  if (cadence) params.set("cadence", cadence);

  redirect(`/onboarding?${params.toString()}`);
}
