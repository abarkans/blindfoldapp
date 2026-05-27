"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitDateFeedback(
  dateIdeaId: string,
  rating: number,
  comment?: string
): Promise<void> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;

  // Authenticate via session client, then write via admin client.
  // Migration 057 revoked authenticated UPDATE on date_ideas (security fix);
  // admin bypasses RLS. Authorization is enforced here: user_id + status filter.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const sanitized = comment?.trim().slice(0, 500) || null;
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("date_ideas")
    .update({ rating, feedback: sanitized })
    .eq("id", dateIdeaId)
    .eq("user_id", user.id)
    .eq("status", "completed");

  if (error) {
    console.error(`[audit] feedback: save failed uid=${user.id} ideaId=${dateIdeaId} msg=${error.message}`);
  }
}
