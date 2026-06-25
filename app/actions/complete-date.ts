"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcLevel } from "@/lib/utils";
import type { CompleteDateResult } from "@/lib/types";
import { checkCompleteRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";
import { FREE_INTERESTS } from "@/lib/plans";

// XP is server-determined inside complete_date_atomic (migration 060).
// Trial and subscription earn 200 XP (2×); free earns 100 XP.

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

  // Check plan_type before the RPC so we know if downgrade is needed after.
  const { data: profileBefore } = await admin
    .from("profiles")
    .select("plan_type, interests")
    .eq("id", access.profileId)
    .single();

  const wasTrial = profileBefore?.plan_type === "trial";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (admin as any).rpc("complete_date_atomic", {
    p_user_id: access.profileId,
  });

  if (error) {
    console.error(`[audit] complete: rpc error uid=${user.id} msg=${error.message}`);
    throw new Error(error.message);
  }

  const {
    total_xp: newXp,
    dates_completed_count: newCount,
    xp_awarded: xpAwarded,
    completed_idea_id: dateIdeaId,
  } = result as {
    total_xp: number;
    dates_completed_count: number;
    xp_awarded: number;
    completed_idea_id: string;
  };

  const previousCount = Math.max(0, newCount - 1);

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

  // Downgrade trial → free after first date completion.
  // Guard is === "trial" specifically — never isPlusPlan() — so paying subscribers
  // are never accidentally downgraded.
  if (wasTrial) {
    const safeInterests = (profileBefore?.interests ?? []) as string[];
    const freeInterests = safeInterests.filter((i) =>
      (FREE_INTERESTS as readonly string[]).includes(i)
    );
    const interests = freeInterests.length >= 2 ? freeInterests : [...FREE_INTERESTS];

    const { error: downgradeError } = await admin
      .from("profiles")
      .update({ plan_type: "free", preferred_radius: 15000, interests })
      .eq("id", access.profileId);

    if (downgradeError) {
      console.error(`[audit] complete: trial downgrade failed uid=${user.id} msg=${downgradeError.message}`);
    } else {
      console.info(`[audit] complete: trial→free uid=${user.id}`);
    }
  }

  console.info(`[audit] complete: success uid=${user.id} xp=${newXp} dates=${newCount}`);
  revalidatePath("/dashboard");

  return {
    xpGained: xpAwarded,
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
    dateIdeaId,
    trialExpired: wasTrial,
    datesCompletedCount: newCount,
  };
}
