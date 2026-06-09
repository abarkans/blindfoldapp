"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";
import { FREE_INTERESTS } from "@/lib/plans";

export async function skipTrialDate(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { data: profile } = await admin
    .from("profiles")
    .select("plan_type, interests, date_accepted_at")
    .eq("id", access.profileId)
    .single();

  if (profile?.plan_type !== "trial") {
    return { error: "Only trial users can use this action." };
  }

  if (!profile.date_accepted_at) {
    return { error: "No active date to skip." };
  }

  // Mark the revealed date idea as skipped — excluded from Memories/history.
  await admin
    .from("date_ideas")
    .update({ status: "skipped" })
    .eq("user_id", access.profileId)
    .eq("status", "revealed");

  // Downgrade interests to free tier — mirror the logic in complete-date.ts.
  const safeInterests = (profile.interests ?? []) as string[];
  const freeInterests = safeInterests.filter((i) =>
    (FREE_INTERESTS as readonly string[]).includes(i)
  );
  const interests = freeInterests.length >= 2 ? freeInterests : [...FREE_INTERESTS];

  const nowIso = new Date().toISOString();

  const { error } = await admin
    .from("profiles")
    .update({
      plan_type: "free",
      preferred_radius: 15000,
      interests,
      date_idea: null,
      date_teaser: null,
      date_accepted_at: null,
      revealed_at: nowIso,
      reveal_owner_ready_at: null,
      reveal_partner_ready_at: null,
      checkin_owner_at: null,
      checkin_partner_at: null,
      checkin_owner_skipped: false,
      checkin_partner_skipped: false,
      current_date_rerolled: false,
      notification_sent_at: null,
      partner_ping_sent_at: null,
    })
    .eq("id", access.profileId);

  if (error) {
    console.error(`[audit] skip-trial: profile update failed uid=${user.id} msg=${error.message}`);
    return { error: "Failed to skip date. Please try again." };
  }

  console.info(`[audit] skip-trial: uid=${user.id} downgraded to free`);
  revalidatePath("/dashboard");
  return {};
}
