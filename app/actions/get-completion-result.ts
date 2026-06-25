"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";
import { calcLevel } from "@/lib/utils";
import type { CompleteDateResult } from "@/lib/types";
import { isPlusPlan } from "@/lib/plans";

const XP_PER_DATE = 100;

type BadgeRow = {
  earned_at: string;
  milestones: {
    name: string;
    description: string;
    icon_emoji: string;
    required_dates: number;
  } | null;
};

export async function getCompletionResult(): Promise<CompleteDateResult | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { data: profile } = await admin
    .from("profiles")
    .select("total_xp, dates_completed_count, plan_type, checkin_owner_skipped, checkin_partner_skipped")
    .eq("id", access.profileId)
    .single();

  if (!profile) return null;

  // Both partners skipped check-in and dismissed the date — no reward modal.
  if (profile.checkin_owner_skipped && profile.checkin_partner_skipped) return null;

  const newCount = profile.dates_completed_count;
  const newXp = profile.total_xp;
  // Plus earns 2× XP; this result is displayed after photo-completion path.
  const xpGained = isPlusPlan(profile.plan_type) ? XP_PER_DATE * 2 : XP_PER_DATE;

  const { data: dateIdea } = await admin
    .from("date_ideas")
    .select("id")
    .eq("user_id", access.profileId)
    .eq("status", "completed")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  const dateIdeaId = dateIdea?.id ?? "";
  const previousCount = Math.max(0, newCount - 1);

  const { data: newBadgeRows } = await admin
    .from("user_badges")
    .select("earned_at, milestones!inner(name, description, icon_emoji, required_dates)")
    .eq("user_id", access.profileId)
    .gt("milestones.required_dates", previousCount)
    .lte("milestones.required_dates", newCount) as { data: BadgeRow[] | null };

  return {
    xpGained,
    newTotalXp: newXp,
    newLevel: calcLevel(newXp),
    newBadges: (newBadgeRows ?? []).map((b) => ({
      name: b.milestones?.name ?? "",
      description: b.milestones?.description ?? "",
      icon_emoji: b.milestones?.icon_emoji ?? "🏆",
    })),
    dateIdeaId,
    datesCompletedCount: newCount,
  };
}
