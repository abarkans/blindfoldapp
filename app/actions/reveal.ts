"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateAIDateIdea } from "@/lib/ai/generate-date";

export async function revealDate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("partner_names, interests, constraints, cadence, revealed_at")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  // Guard: check cooldown server-side
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

  // Fetch last 10 idea titles to avoid repeats
  const { data: pastIdeas } = await supabase
    .from("date_ideas")
    .select("idea")
    .eq("user_id", user.id)
    .order("generated_at", { ascending: false })
    .limit(10);

  const previousTitles = (pastIdeas ?? [])
    .map((row) => (row.idea as { title?: string })?.title)
    .filter(Boolean) as string[];

  const constraints = profile.constraints as {
    budget_max: number;
    has_car: boolean;
    prefers_walking: boolean;
  };

  const idea = await generateAIDateIdea({
    partnerNames: profile.partner_names as { partner1: string; partner2: string },
    interests: profile.interests,
    budgetMax: constraints.budget_max,
    hasCar: constraints.has_car,
    prefersWalking: constraints.prefers_walking,
    previousTitles,
  });

  const now = new Date().toISOString();

  // Insert into date_ideas history
  await supabase.from("date_ideas").insert({
    user_id: user.id,
    idea: idea as unknown as import("@/lib/types").Json,
    status: "revealed",
    revealed_at: now,
  });

  // Update profile with current idea + timestamp
  await supabase
    .from("profiles")
    .update({
      revealed_at: now,
      date_idea: idea as unknown as import("@/lib/types").Json,
    })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}
