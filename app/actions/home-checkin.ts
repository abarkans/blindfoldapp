"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";
import { checkCheckInRateLimit } from "@/lib/rate-limit";
import type { CheckInResult } from "@/lib/types";

export async function homeCheckIn(): Promise<CheckInResult> {
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
    .select("date_accepted_at, checkin_owner_at, checkin_partner_at")
    .eq("id", access.profileId)
    .single();

  if (profileError || !profile) return { status: "error", error: "Profile not found" };
  if (!profile.date_accepted_at) return { status: "error", error: "Date not revealed yet" };

  const alreadyCheckedIn =
    access.role === "owner" ? !!profile.checkin_owner_at : !!profile.checkin_partner_at;

  if (!alreadyCheckedIn) {
    const nowIso = new Date().toISOString();
    const checkinUpdate =
      access.role === "owner"
        ? { checkin_owner_at: nowIso }
        : { checkin_partner_at: nowIso };

    const { error: writeError } = await admin
      .from("profiles")
      .update(checkinUpdate)
      .eq("id", access.profileId);

    if (writeError) {
      console.error(`[audit] home-checkin: write failed uid=${user.id} msg=${writeError.message}`);
      return { status: "error", error: "Failed to record check-in. Please try again." };
    }
  }

  revalidatePath("/dashboard");
  return { status: "waiting" };
}
