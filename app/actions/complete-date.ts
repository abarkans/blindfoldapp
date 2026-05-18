"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcLevel } from "@/lib/utils";
import type { CompleteDateResult, PlanType } from "@/lib/types";
import { checkCompleteRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";

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

export async function completeDate(): Promise<CompleteDateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn("[audit] complete: unauthenticated attempt");
    throw new Error("Not authenticated");
  }

  await checkCompleteRateLimit(user.id);
  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  // Atomically: find the revealed idea (with row lock), mark it completed,
  // and increment XP + count in a single DB round-trip. The RPC also reads
  // plan_type and skips the XP/count increment for non-subscription users,
  // returning gated=true so we know to suppress the badge fetch.
  const { data: result, error } = await supabase.rpc("complete_date_atomic", {
    p_user_id: access.profileId,
    p_xp_gain: XP_PER_DATE,
  });

  if (error) {
    console.error(`[audit] complete: rpc error uid=${user.id} msg=${error.message}`);
    throw new Error(error.message);
  }

  const {
    total_xp: newXp,
    dates_completed_count: newCount,
    gated,
    completed_idea_id: dateIdeaId,
  } = result as {
    total_xp: number;
    dates_completed_count: number;
    gated: boolean;
    completed_idea_id: string;
  };

  const planType: PlanType = gated ? "free" : "subscription";

  // Free plan: no XP, no badges — modal will render upsell instead.
  if (gated) {
    console.info(`[audit] complete: gated uid=${user.id} dates=${newCount}`);
    revalidatePath("/dashboard");
    return {
      xpGained: 0,
      newTotalXp: newXp,
      newLevel: calcLevel(newXp),
      newBadges: [],
      planType,
      gated: true,
      dateIdeaId,
    };
  }

  const previousCount = Math.max(0, newCount - 1);

  // The DB trigger normally awards badges when dates_completed_count increments.
  // Keep this server action defensive too: backfill any eligible missing badges,
  // then return the milestones crossed by this completion.
  const { data: eligibleMilestones } = await admin
    .from("milestones")
    .select("id")
    .lte("required_dates", newCount);

  if (eligibleMilestones?.length) {
    const { error: badgeError } = await admin.from("user_badges").upsert(
      eligibleMilestones.map((milestone) => ({
        user_id: access.profileId,
        milestone_id: milestone.id,
      })),
      { onConflict: "user_id,milestone_id" }
    );
    if (badgeError) {
      console.error(`[audit] complete: badge upsert failed uid=${user.id} msg=${badgeError.message}`);
    }
  }

  const { data: newBadgeRows } = await admin
    .from("user_badges")
    .select("earned_at, milestones!inner(name, description, icon_emoji, required_dates)")
    .eq("user_id", access.profileId)
    .gt("milestones.required_dates", previousCount)
    .lte("milestones.required_dates", newCount) as { data: BadgeRow[] | null };

  console.info(`[audit] complete: success uid=${user.id} xp=${newXp} dates=${newCount}`);
  revalidatePath("/dashboard");

  return {
    xpGained: XP_PER_DATE,
    newTotalXp: newXp,
    newLevel: calcLevel(newXp),
    newBadges: (newBadgeRows ?? []).map((b) => {
      const m = b.milestones;
      return {
        name: m?.name ?? "",
        description: m?.description ?? "",
        icon_emoji: m?.icon_emoji ?? "🏆",
      };
    }),
    planType,
    gated: false,
    dateIdeaId,
  };
}
