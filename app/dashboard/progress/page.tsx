import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import XPProgressBar from "@/components/dashboard/XPProgressBar";
import BadgeGrid from "@/components/dashboard/BadgeGrid";
import { Zap, CalendarCheck } from "lucide-react";
import { calcLevel, xpProgress } from "@/lib/utils";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: userBadgeRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("total_xp, dates_completed_count")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_badges")
      .select("earned_at, milestones(name, icon_emoji)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: true }),
  ]);

  const totalXp = profile?.total_xp ?? 0;
  const datesCompleted = profile?.dates_completed_count ?? 0;
  const { level } = xpProgress(totalXp);

  const earnedBadges = (userBadgeRows ?? []).map((row) => {
    const m = row.milestones as { name: string; icon_emoji: string } | null;
    return { name: m?.name ?? "", earned_at: row.earned_at };
  });

  const nextMilestoneMap: Record<number, { count: number; name: string }> = {
    0: { count: 1, name: "First Spark" },
    1: { count: 3, name: "Triple Threat" },
    2: { count: 5, name: "High Five" },
    3: { count: 10, name: "Perfect 10" },
  };
  const nextMilestone = nextMilestoneMap[earnedBadges.length];

  return (
    <div>
      {/* Page title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Your progress</h2>
        <p className="text-white/40 text-sm mt-1">Every date counts.</p>
      </div>

      {/* Hero stats row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gradient-to-br from-orange-500/15 to-amber-500/8 border border-orange-500/20 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-2xl font-black text-white">{totalXp}</span>
          </div>
          <p className="text-xs text-white/40">Total XP</p>
        </div>
        <div className="bg-gradient-to-br from-pink-500/15 to-rose-500/8 border border-pink-500/20 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CalendarCheck className="w-4 h-4 text-pink-400" />
            <span className="text-2xl font-black text-white">{datesCompleted}</span>
          </div>
          <p className="text-xs text-white/40">Dates done</p>
        </div>
      </div>

      {/* XP bar */}
      <XPProgressBar totalXp={totalXp} />

      {/* Next milestone nudge */}
      {nextMilestone && (
        <div className="bg-white/4 border border-white/8 rounded-2xl p-3.5 mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-base flex-shrink-0">
            🎯
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              {nextMilestone.count - datesCompleted} date
              {nextMilestone.count - datesCompleted !== 1 ? "s" : ""} until{" "}
              <span className="text-pink-400">{nextMilestone.name}</span>
            </p>
            <p className="text-[10px] text-white/35 mt-0.5">
              Keep going — you&apos;re on a roll!
            </p>
          </div>
        </div>
      )}

      {/* Trophy room */}
      <BadgeGrid earnedBadges={earnedBadges} />
    </div>
  );
}
