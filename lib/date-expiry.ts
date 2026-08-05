import type { SupabaseClient } from "@supabase/supabase-js";
import { FREE_INTERESTS } from "@/lib/plans";
import { tryCompleteIfBothDone } from "@/app/actions/photo";

interface ExpirableProfile {
  plan_type: string;
  interests: string[] | null;
  checkin_owner_at: string | null;
  checkin_partner_at: string | null;
}

/**
 * Auto-resolves a date whose check-in deadline has passed without full
 * completion. Trial (one-time date) downgrades to free, mirroring
 * skip-trial-date.ts — except it does NOT reset revealed_at, since that
 * would restart the cooldown and push the next free date further out for
 * whoever waited the full window. Free/subscription just flags whichever
 * side(s) never checked in, same effect as a manual per-side Skip.
 *
 * Returns false if there was nothing to do (already resolved by someone
 * else — callers may race, e.g. both partners' clients or a cron sweep).
 */
export async function expireProfileDate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
  profileId: string,
  profile: ExpirableProfile
): Promise<boolean> {
  if (profile.plan_type === "trial") {
    const freeInterests = (profile.interests ?? []).filter((i) =>
      (FREE_INTERESTS as readonly string[]).includes(i)
    );
    const interests = freeInterests.length >= 2 ? freeInterests : [...FREE_INTERESTS];

    // Atomic guard: eq("plan_type", "trial") means only the first caller to
    // reach this wins the downgrade; a concurrent duplicate call no-ops.
    const { data: claimed } = await admin
      .from("profiles")
      .update({
        plan_type: "free",
        preferred_radius: 15000,
        interests,
        date_idea: null,
        date_teaser: null,
        date_accepted_at: null,
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
      .eq("id", profileId)
      .eq("plan_type", "trial")
      .select("id");

    if (!claimed?.length) return false;

    await admin
      .from("date_ideas")
      .update({ status: "skipped" })
      .eq("user_id", profileId)
      .eq("status", "revealed");

    console.info(`[audit] expire-date: trial→free profile=${profileId}`);
    return true;
  }

  const nowIso = new Date().toISOString();
  const update: Record<string, unknown> = {};
  if (!profile.checkin_owner_at) {
    update.checkin_owner_at = nowIso;
    update.checkin_owner_skipped = true;
  }
  if (!profile.checkin_partner_at) {
    update.checkin_partner_at = nowIso;
    update.checkin_partner_skipped = true;
  }
  if (Object.keys(update).length === 0) return false;

  await admin.from("profiles").update(update).eq("id", profileId);
  console.info(`[audit] expire-date: check-in auto-skipped profile=${profileId}`);

  const { data: activeIdea } = await admin
    .from("date_ideas")
    .select("id, location_type")
    .eq("user_id", profileId)
    .eq("status", "revealed")
    .single();

  if (activeIdea) {
    // Home dates: complete_date_atomic requires a date_photos row from every
    // couple member unconditionally. Mirrors markPartnerNotComing()'s fix —
    // insert the same skipped placeholder skipPhoto() would for whichever
    // side we just auto-skipped, so the RPC's invariant still holds.
    if (activeIdea.location_type === "home") {
      const skippedRoles: ("owner" | "partner")[] = [];
      if (update.checkin_owner_skipped) skippedRoles.push("owner");
      if (update.checkin_partner_skipped) skippedRoles.push("partner");

      if (skippedRoles.length) {
        const { data: skippedMembers } = await admin
          .from("couple_members")
          .select("user_id, role")
          .eq("profile_id", profileId)
          .in("role", skippedRoles);

        for (const member of skippedMembers ?? []) {
          await admin.from("date_photos").upsert(
            {
              date_idea_id: activeIdea.id,
              profile_id: profileId,
              uploader_user_id: member.user_id,
              r2_key: null,
              skipped: true,
            },
            { onConflict: "date_idea_id,uploader_user_id", ignoreDuplicates: true }
          );
        }
      }
    }

    // Whichever side was still undecided is now flagged skipped — if the other
    // partner already finished their side, this may be the final condition
    // needed to complete. Re-check now instead of leaving it stuck until some
    // later photo action that will never come from the auto-skipped side.
    await tryCompleteIfBothDone(admin, profileId, activeIdea.id);
  }

  return true;
}
