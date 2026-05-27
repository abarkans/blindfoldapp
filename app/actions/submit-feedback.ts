"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";

export async function submitDateFeedback(
  dateIdeaId: string,
  rating: number,
  comment?: string
): Promise<void> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;

  // Authenticate via session client, then write via admin client.
  // Migration 057 revoked authenticated UPDATE on date_ideas (security fix);
  // admin bypasses RLS. Authorization is enforced here: profileId + status filter.
  // date_ideas.user_id stores profileId (couple owner's ID), not the auth user.id —
  // filtering by user.id breaks for partner users.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const sanitized = comment?.trim().slice(0, 500) || null;
  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("date_ideas")
    .update({ rating, feedback: sanitized })
    .eq("id", dateIdeaId)
    .eq("user_id", access.profileId)
    .eq("status", "completed");

  if (error) {
    console.error(`[audit] feedback: save failed uid=${user.id} ideaId=${dateIdeaId} msg=${error.message}`);
  }
}
