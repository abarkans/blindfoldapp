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

  // Fetch current XP state
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, dates_completed_count")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  // Guard: prevent completing a date that is already completed
  const { data: revealedIdea } = await supabase
    .from("date_ideas")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "revealed")
    .order("revealed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!revealedIdea) throw new Error("No active date to complete");

  // Mark the date as completed
  await supabase
    .from("date_ideas")
    .update({ status: "completed" })
    .eq("id", revealedIdea.id);

  const newXp = (profile.total_xp ?? 0) + XP_PER_DATE;
  const newCount = (profile.dates_completed_count ?? 0) + 1;

  // Update profile — the DB trigger fires award_milestone_badges() automatically
  await supabase
    .from("profiles")
    .update({ total_xp: newXp, dates_completed_count: newCount })
    .eq("id", user.id);

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
