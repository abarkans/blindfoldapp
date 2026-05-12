"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";
import { checkCheckInRateLimit } from "@/lib/rate-limit";
import { calcLevel } from "@/lib/utils";
import type { CheckInResult, CompleteDateResult, PlanType } from "@/lib/types";

const MAX_CHECKIN_RADIUS_METERS = 200;
const XP_PER_DATE = 100;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type BadgeRow = {
  earned_at: string;
  milestones: {
    name: string;
    description: string;
    icon_emoji: string;
    required_dates: number;
  } | null;
};

export async function checkInToDate({ lat, lng }: { lat: number; lng: number }): Promise<CheckInResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Not authenticated" };

  try {
    await checkCheckInRateLimit(user.id);
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Too many requests. Try again shortly.",
    };
  }

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("date_idea, date_accepted_at, checkin_owner_at, checkin_partner_at, total_checkins")
    .eq("id", access.profileId)
    .single();

  if (profileError || !profile) return { status: "error", error: "Profile not found" };
  if (!profile.date_accepted_at) return { status: "error", error: "Date not revealed yet" };

  const idea = profile.date_idea as unknown as {
    type?: string;
    location?: { latitude?: number; longitude?: number };
  } | null;

  if (!idea || idea.type !== "venue" || !idea.location?.latitude || !idea.location?.longitude) {
    return { status: "no_venue" };
  }

  const distance = haversineMeters(lat, lng, idea.location.latitude, idea.location.longitude);
  if (distance > MAX_CHECKIN_RADIUS_METERS) {
    return { status: "too_far", distanceMeters: Math.round(distance) };
  }

  const nowIso = new Date().toISOString();
  const alreadyCheckedIn =
    access.role === "owner" ? !!profile.checkin_owner_at : !!profile.checkin_partner_at;

  if (!alreadyCheckedIn) {
    const checkinUpdate =
      access.role === "owner"
        ? { checkin_owner_at: nowIso }
        : { checkin_partner_at: nowIso };

    const { error: writeError } = await admin
      .from("profiles")
      .update(checkinUpdate)
      .eq("id", access.profileId);

    if (writeError) {
      console.error(`[audit] checkin: write failed uid=${user.id} msg=${writeError.message}`);
      return { status: "error", error: "Failed to record check-in. Please try again." };
    }
  }

  // Re-read after write — prevents TOCTOU race where both partners write
  // simultaneously and both see the other's flag as null in the pre-write snapshot.
  const { data: fresh, error: freshError } = await admin
    .from("profiles")
    .select("checkin_owner_at, checkin_partner_at")
    .eq("id", access.profileId)
    .single();

  if (freshError || !fresh?.checkin_owner_at || !fresh?.checkin_partner_at) {
    revalidatePath("/dashboard");
    return { status: "waiting" };
  }

  // Both checked in — complete the date atomically
  const { data: rpcResult, error: rpcError } = await supabase.rpc("complete_date_atomic", {
    p_user_id: access.profileId,
    p_xp_gain: XP_PER_DATE,
  });

  if (rpcError) {
    console.error(`[audit] checkin: rpc error uid=${user.id} msg=${rpcError.message}`);
    return { status: "error", error: "Failed to complete date" };
  }

  const {
    total_xp: newXp,
    dates_completed_count: newCount,
    gated,
    completed_idea_id: dateIdeaId,
  } = rpcResult as {
    total_xp: number;
    dates_completed_count: number;
    gated: boolean;
    completed_idea_id: string;
  };

  await admin
    .from("profiles")
    .update({ total_checkins: (profile.total_checkins ?? 0) + 1 })
    .eq("id", access.profileId);

  const planType: PlanType = gated ? "free" : "subscription";

  if (gated) {
    console.info(`[audit] checkin: gated uid=${user.id} dates=${newCount}`);
    revalidatePath("/dashboard");
    return {
      status: "completed",
      result: {
        xpGained: 0,
        newTotalXp: newXp,
        newLevel: calcLevel(newXp),
        newBadges: [],
        planType,
        gated: true,
        dateIdeaId,
      },
    };
  }

  const previousCount = Math.max(0, newCount - 1);

  const { data: eligibleMilestones } = await admin
    .from("milestones")
    .select("id")
    .lte("required_dates", newCount);

  if (eligibleMilestones?.length) {
    await admin.from("user_badges").upsert(
      eligibleMilestones.map((m) => ({ user_id: access.profileId, milestone_id: m.id })),
      { onConflict: "user_id,milestone_id" }
    );
  }

  const { data: newBadgeRows } = await admin
    .from("user_badges")
    .select("earned_at, milestones!inner(name, description, icon_emoji, required_dates)")
    .eq("user_id", access.profileId)
    .gt("milestones.required_dates", previousCount)
    .lte("milestones.required_dates", newCount) as { data: BadgeRow[] | null };

  console.info(`[audit] checkin: completed uid=${user.id} xp=${newXp} dates=${newCount}`);
  revalidatePath("/dashboard");

  return {
    status: "completed",
    result: {
      xpGained: XP_PER_DATE,
      newTotalXp: newXp,
      newLevel: calcLevel(newXp),
      newBadges: (newBadgeRows ?? []).map((b) => ({
        name: b.milestones?.name ?? "",
        description: b.milestones?.description ?? "",
        icon_emoji: b.milestones?.icon_emoji ?? "🏆",
      })),
      planType,
      gated: false,
      dateIdeaId,
    } satisfies CompleteDateResult,
  };
}
