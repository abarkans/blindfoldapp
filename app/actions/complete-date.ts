"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcLevel } from "@/lib/utils";
import type { CompleteDateResult } from "@/lib/types";

const XP_PER_DATE = 100;

export async function completeDate(): Promise<CompleteDateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Atomically: find the revealed idea (with row lock), mark it completed,
  // and increment XP + count in a single DB round-trip.
  // This eliminates the read-then-write race that previously allowed double XP
  // from concurrent requests. The DB trigger award_milestone_badges() still fires.
  const { data: result, error } = await supabase.rpc("complete_date_atomic", {
    p_user_id: user.id,
    p_xp_gain: XP_PER_DATE,
  });

  if (error) throw new Error(error.message);

  const { total_xp: newXp, dates_completed_count: newCount } = result as {
    total_xp: number;
    dates_completed_count: number;
  };

  // Fetch badges earned within the last 10 seconds (just awarded by the trigger)
  const cutoff = new Date(Date.now() - 10_000).toISOString();
  const { data: newBadgeRows } = await supabase
    .from("user_badges")
    .select("earned_at, milestones(name, description, icon_emoji)")
    .eq("user_id", user.id)
    .gte("earned_at", cutoff);

  revalidatePath("/dashboard");

  return {
    xpGained: XP_PER_DATE,
    newTotalXp: newXp,
    newLevel: calcLevel(newXp),
    newBadges: (newBadgeRows ?? []).map((b) => {
      const m = b.milestones as { name: string; description: string; icon_emoji: string } | null;
      return {
        name: m?.name ?? "",
        description: m?.description ?? "",
        icon_emoji: m?.icon_emoji ?? "🏆",
      };
    }),
  };
}
