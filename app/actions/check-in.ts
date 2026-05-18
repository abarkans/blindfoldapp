"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";
import { checkCheckInRateLimit } from "@/lib/rate-limit";
import type { CheckInResult } from "@/lib/types";

const MAX_CHECKIN_RADIUS_METERS = 200;

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

export async function checkInToDate({ lat, lng }: { lat: number; lng: number }): Promise<CheckInResult> {
  if (
    typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90 ||
    typeof lng !== "number" || !Number.isFinite(lng) || lng < -180 || lng > 180
  ) {
    return { status: "error", error: "Invalid coordinates" };
  }

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
    .select("date_idea, date_accepted_at, checkin_owner_at, checkin_partner_at, total_checkins, total_xp, plan_type")
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

  const isSubscription = profile.plan_type === "subscription";
  const XP_CHECKIN = 50;
  let xpGained = 0;

  if (!alreadyCheckedIn) {
    const xpIncrease = isSubscription ? XP_CHECKIN : 0;
    const checkinUpdate =
      access.role === "owner"
        ? { checkin_owner_at: nowIso, total_checkins: (profile.total_checkins ?? 0) + 1, ...(xpIncrease && { total_xp: (profile.total_xp ?? 0) + xpIncrease }) }
        : { checkin_partner_at: nowIso, total_checkins: (profile.total_checkins ?? 0) + 1, ...(xpIncrease && { total_xp: (profile.total_xp ?? 0) + xpIncrease }) };

    const { error: writeError } = await admin
      .from("profiles")
      .update(checkinUpdate)
      .eq("id", access.profileId);

    if (writeError) {
      console.error(`[audit] checkin: write failed uid=${user.id} msg=${writeError.message}`);
      return { status: "error", error: "Failed to record check-in. Please try again." };
    }

    xpGained = xpIncrease;
  }

  revalidatePath("/dashboard");
  return { status: "waiting", xpGained };
}

export async function skipCheckIn(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    await checkCheckInRateLimit(user.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Too many requests." };
  }

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("date_accepted_at, checkin_owner_at, checkin_partner_at, checkin_owner_skipped, checkin_partner_skipped")
    .eq("id", access.profileId)
    .single();

  if (profileError || !profile) return { error: "Profile not found" };
  if (!profile.date_accepted_at) return { error: "Date not revealed yet" };

  const alreadyDecided =
    access.role === "owner" ? !!profile.checkin_owner_at : !!profile.checkin_partner_at;

  if (!alreadyDecided) {
    const nowIso = new Date().toISOString();
    const update =
      access.role === "owner"
        ? { checkin_owner_at: nowIso, checkin_owner_skipped: true }
        : { checkin_partner_at: nowIso, checkin_partner_skipped: true };

    const { error: writeError } = await admin
      .from("profiles")
      .update(update)
      .eq("id", access.profileId);

    if (writeError) {
      console.error(`[audit] skip-checkin: write failed uid=${user.id} msg=${writeError.message}`);
      return { error: "Failed to record. Please try again." };
    }
  }

  revalidatePath("/dashboard");
  return {};
}
