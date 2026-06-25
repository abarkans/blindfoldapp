"use server";

import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["bug", "idea", "other"] as const;
export type AppFeedbackCategory = (typeof CATEGORIES)[number];

export async function submitAppFeedback(
  category: AppFeedbackCategory,
  message: string,
  platform: "capacitor" | "web"
): Promise<{ error?: string }> {
  if (!CATEGORIES.includes(category)) return { error: "Invalid category" };

  const trimmed = message.trim().slice(0, 1000);
  if (!trimmed) return { error: "Please add a message" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("app_feedback").insert({
    user_id: user.id,
    category,
    message: trimmed,
    platform,
  });

  if (error) {
    console.error(`[audit] app-feedback: save failed uid=${user.id} msg=${error.message}`);
    return { error: "Failed to send feedback. Please try again." };
  }

  return {};
}
