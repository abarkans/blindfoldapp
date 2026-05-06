"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitDateFeedback(
  dateIdeaId: string,
  rating: number,
  comment?: string
): Promise<void> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const sanitized = comment?.trim().slice(0, 500) || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("date_ideas")
    .update({ rating, feedback: sanitized })
    .eq("id", dateIdeaId)
    .eq("user_id", user.id)
    .eq("status", "completed");

  if (error) {
    console.error("[feedback] save failed", error.message);
  }
}
