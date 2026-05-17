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

  // Verify the underlying subscription is still active — session.status === "complete"
  // stays "complete" permanently, so a cancelled subscriber could replay this URL to
  // re-upgrade for free. This is the same check used in finish-onboarding.ts.
  const subId = typeof session.subscription === "string"
    ? session.subscription
    : (session.subscription as { id?: string } | null)?.id ?? null;

  let subActive = false;
  if (subId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subId);
      subActive = sub.status === "active" || sub.status === "trialing";
    } catch (subErr) {
      console.error(
        `[audit] upgrade: subscription retrieve failed uid=${user.id} sub=${subId} msg=${subErr instanceof Error ? subErr.message : String(subErr)}`
      );
    }
  }

  if (!subActive) redirect("/dashboard");

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

  if (profile?.onboarding_complete) redirect("/dashboard?subscriberBadge=1&tab=progress");

  const params = new URLSearchParams({
    checkout: "completed",
    session_id,
  });
  if (cadence) params.set("cadence", cadence);

  redirect(`/onboarding?${params.toString()}`);
}
