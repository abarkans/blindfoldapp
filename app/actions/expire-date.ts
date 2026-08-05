"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";
import { getCheckinDeadlineMs } from "@/lib/cadence";
import { expireProfileDate } from "@/lib/date-expiry";

/**
 * Fired client-side by the check-in countdown when it reaches zero.
 * Re-checks the deadline server-side (never trust a client clock or a
 * stale page) and is a no-op if it hasn't actually passed, or if another
 * caller already resolved it.
 */
export async function expireCurrentDateIfDue(): Promise<{ expired: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { expired: false };

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { data: profile } = await admin
    .from("profiles")
    .select("plan_type, cadence, revealed_at, date_accepted_at, date_idea, interests, checkin_owner_at, checkin_partner_at")
    .eq("id", access.profileId)
    .single();

  if (!profile?.date_idea || !profile.date_accepted_at || !profile.revealed_at) {
    return { expired: false };
  }

  if (Date.now() < getCheckinDeadlineMs(profile.revealed_at, profile.cadence)) {
    return { expired: false };
  }

  const expired = await expireProfileDate(admin, access.profileId, profile);
  if (expired) revalidatePath("/dashboard");
  return { expired };
}
