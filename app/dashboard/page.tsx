import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardTabs from "@/components/dashboard/DashboardTabs";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch everything needed for all tabs in one shot
  const [{ data: profile }, { data: currentDateIdea }, { data: userBadgeRows }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
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

  return (
    <DashboardTabs
      profile={profile}
      earnedBadges={earnedBadges}
      isDateCompleted={!currentDateIdea}
    />
  );
}
