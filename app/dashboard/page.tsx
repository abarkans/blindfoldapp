import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { getUnitSystem } from "@/lib/get-unit-system";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch everything needed for all tabs in one shot
  const [{ data: profile }, { data: currentDateIdea }, { data: userBadgeRows }] =
    await Promise.all([
      supabase.from("profiles").select("id, partner_names, interests, constraints, plan_type, cadence, date_idea, last_lat, last_long, preferred_radius, onboarding_complete, revealed_at, total_rerolls_used, current_date_rerolled, date_accepted_at, total_xp, dates_completed_count, subscription_ends_at, notification_sent_at, stripe_customer_id, created_at, updated_at").eq("id", user.id).single(),
      supabase
        .from("date_ideas")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "revealed")
        .order("revealed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("user_badges")
        .select("earned_at, milestones(name, icon_emoji)")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: true }),
    ]);

  if (!profile?.onboarding_complete) redirect("/onboarding");

  const earnedBadges = (userBadgeRows ?? []).map((row) => {
    const m = row.milestones as { name: string; icon_emoji: string } | null;
    return { name: m?.name ?? "", earned_at: row.earned_at };
  });

  const unitSystem = await getUnitSystem();

  return (
    <DashboardTabs
      profile={profile}
      earnedBadges={earnedBadges}
      isDateCompleted={!currentDateIdea}
      unitSystem={unitSystem}
    />
  );
}
