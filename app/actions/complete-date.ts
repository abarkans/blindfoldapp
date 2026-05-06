"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcLevel } from "@/lib/utils";
import type { CompleteDateResult, PlanType } from "@/lib/types";
import { checkCompleteRateLimit } from "@/lib/rate-limit";

const XP_PER_DATE = 100;

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

  // Atomically: find the revealed idea (with row lock), mark it completed,
  // and increment XP + count in a single DB round-trip. The RPC also reads
  // plan_type and skips the XP/count increment for non-subscription users,
  // returning gated=true so we know to suppress the badge fetch.
  const { data: result, error } = await supabase.rpc("complete_date_atomic", {
    p_user_id: user.id,
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

  // Fetch badges earned within the last 10 seconds (just awarded by the trigger)
  const cutoff = new Date(Date.now() - 10_000).toISOString();
  const { data: newBadgeRows } = await supabase
    .from("user_badges")
    .select("earned_at, milestones(name, description, icon_emoji)")
    .eq("user_id", user.id)
    .gte("earned_at", cutoff);

  console.info(`[audit] complete: success uid=${user.id} xp=${newXp} dates=${newCount}`);
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
    planType,
    gated: false,
    dateIdeaId,
  };
}
