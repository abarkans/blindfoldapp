"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";

/**
 * Dismiss the current date without awarding XP or incrementing dates_completed_count.
 * Used when both partners skipped check-in and decide to close the date.
 */
export async function dismissDate(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  // Verify both partners actually skipped — prevent misuse as a shortcut to skip photos
  const { data: profile } = await admin
    .from("profiles")
    .select("checkin_owner_skipped, checkin_partner_skipped")
    .eq("id", access.profileId)
    .single();

  if (!profile?.checkin_owner_skipped || !profile?.checkin_partner_skipped) {
    return { error: "Both partners must have skipped check-in to dismiss" };
  }

  // Mark the revealed date as completed (no XP/count — bypasses complete_date_atomic)
  const { error: ideaError } = await admin
    .from("date_ideas")
    .update({ status: "completed" })
    .eq("user_id", access.profileId)
    .eq("status", "revealed");

  if (ideaError) {
    console.error(`[audit] dismiss-date: date update failed uid=${user.id} msg=${ideaError.message}`);
    return { error: "Failed to dismiss date. Please try again." };
  }

  // Reset timestamps only — leave skip flags set so getCompletionResult can
  // detect a dismiss and suppress the success modal for both partners.
  // Skip flags are cleared when the next date starts via startDate().
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      checkin_owner_at: null,
      checkin_partner_at: null,
    })
    .eq("id", access.profileId);

  if (profileError) {
    console.error(`[audit] dismiss-date: profile reset failed uid=${user.id} msg=${profileError.message}`);
  }

  revalidatePath("/dashboard");
  return {};
}

/**
 * Reset check-in skip flags so both partners can attempt check-in again.
 * Used when both partners skipped and decide to go to the venue after all.
 */
export async function resetCheckinSkip(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { error } = await admin
    .from("profiles")
    .update({
      checkin_owner_at: null,
      checkin_partner_at: null,
      checkin_owner_skipped: false,
      checkin_partner_skipped: false,
    })
    .eq("id", access.profileId);

  if (error) {
    console.error(`[audit] reset-checkin: failed uid=${user.id} msg=${error.message}`);
    return { error: "Failed to reset check-in. Please try again." };
  }

  // For home dates, also delete skipped photo rows so both partners can re-decide.
  const { data: revealedIdea } = await admin
    .from("date_ideas")
    .select("id, location_type")
    .eq("user_id", access.profileId)
    .eq("status", "revealed")
    .maybeSingle();

  if (revealedIdea?.location_type === "home") {
    await admin
      .from("date_photos")
      .delete()
      .eq("date_idea_id", revealedIdea.id)
      .eq("profile_id", access.profileId)
      .eq("skipped", true);
  }

  revalidatePath("/dashboard");
  return {};
}
