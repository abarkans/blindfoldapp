"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateDateIdea } from "@/lib/date-generator";

export async function revealDate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("interests, constraints, cadence, revealed_at")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  // Guard: check cooldown server-side too
  if (profile.revealed_at) {
    const cadenceDays: Record<string, number> = {
      weekly: 7,
      biweekly: 14,
      monthly: 30,
      spontaneous: 3,
    };
    const days = cadenceDays[profile.cadence] ?? 7;
    const nextAvailable = new Date(profile.revealed_at);
    nextAvailable.setDate(nextAvailable.getDate() + days);
    if (new Date() < nextAvailable) {
      throw new Error("Next date not available yet");
    }
  }

  const idea = generateDateIdea(
    profile.interests,
    (profile.constraints as { budget_max: number }).budget_max,
    (profile.constraints as { has_car: boolean }).has_car
  );

  await supabase
    .from("profiles")
    .update({
      revealed_at: new Date().toISOString(),
      date_idea: idea as unknown as import("@/lib/types").Json,
    })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}
