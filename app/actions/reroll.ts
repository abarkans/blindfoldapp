"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateAIDateIdea } from "@/lib/ai/generate-date";
import { searchNearbyVenues } from "@/lib/places/search";

const profileSchema = z.object({
  plan_type: z.string(),
  total_rerolls_used: z.number(),
  current_date_rerolled: z.boolean(),
  partner_names: z.object({ partner1: z.string().max(50), partner2: z.string().max(50) }),
  interests: z.array(z.string()),
  constraints: z.object({
    budget_max: z.number().min(10).max(200),
    has_car: z.boolean(),
    prefers_walking: z.boolean(),
  }),
  last_lat: z.number().nullable(),
  last_long: z.number().nullable(),
  preferred_radius: z.number().nullable(),
});

export async function rerollDate(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: raw } = await supabase
    .from("profiles")
    .select("plan_type, total_rerolls_used, current_date_rerolled, partner_names, interests, constraints, last_lat, last_long, preferred_radius")
    .eq("id", user.id)
    .single();

  if (!raw) throw new Error("Profile not found");

  const profile = profileSchema.parse(raw);
  const isFree = profile.plan_type !== "subscription";

  // Atomic eligibility claim — single conditional UPDATE prevents concurrent requests
  // from both passing the eligibility check (TOCTOU race condition).
  // Returns 0 rows if the condition wasn't met; throw without touching the counter.
  if (isFree) {
    const { data: claimed } = await supabase
      .from("profiles")
      .update({ total_rerolls_used: 1 })
      .eq("id", user.id)
      .eq("total_rerolls_used", 0)
      .select("id");
    if (!claimed?.length) throw new Error("No re-rolls remaining on the basic plan");
  } else {
    const { data: claimed } = await supabase
      .from("profiles")
      .update({ current_date_rerolled: true })
      .eq("id", user.id)
      .eq("current_date_rerolled", false)
      .select("id");
    if (!claimed?.length) throw new Error("Already re-rolled this date");
  }

  const VALID_INTERESTS = new Set([
    "food", "music", "nature", "art", "fitness", "cinema",
    "books", "coffee", "beach", "photography", "gaming", "romance",
  ]);
  const safeInterests = profile.interests.filter((i) => VALID_INTERESTS.has(i));
  const { constraints } = profile;

  let idea: object;

  try {
    if (profile.last_lat && profile.last_long) {
      const { data: pastIdeas } = await supabase
        .from("date_ideas")
        .select("idea")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(50);

      const previousPlaceIds = (pastIdeas ?? [])
        .map((row) => (row.idea as { place_id?: string })?.place_id)
        .filter(Boolean) as string[];

      const venue = await searchNearbyVenues({
        interests: safeInterests,
        lat: profile.last_lat,
        lng: profile.last_long,
        radiusMeters: profile.preferred_radius ?? 10000,
        previousPlaceIds,
      });

      const aiEnrichment = await generateAIDateIdea({
        partnerNames: profile.partner_names,
        interests: safeInterests,
        budgetMax: constraints.budget_max,
        hasCar: constraints.has_car,
        prefersWalking: constraints.prefers_walking,
        venue: {
          name: venue.display_name,
          address: venue.formatted_address,
          rating: venue.rating,
          price_level: venue.price_level,
          meta: venue.meta,
        },
      });

      idea = { ...venue, ai: aiEnrichment };
    } else {
      const { data: pastIdeas } = await supabase
        .from("date_ideas")
        .select("idea")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(50);

      const previousTitles = (pastIdeas ?? [])
        .map((row) => (row.idea as { title?: string })?.title)
        .filter(Boolean) as string[];

      idea = await generateAIDateIdea({
        partnerNames: profile.partner_names,
        interests: safeInterests,
        budgetMax: constraints.budget_max,
        hasCar: constraints.has_car,
        prefersWalking: constraints.prefers_walking,
        previousTitles,
      });
    }
  } catch (err) {
    // Generation failed — roll back the atomic claim so the user can retry
    if (isFree) {
      await supabase.from("profiles").update({ total_rerolls_used: 0 }).eq("id", user.id);
    } else {
      await supabase.from("profiles").update({ current_date_rerolled: false }).eq("id", user.id);
    }
    throw err;
  }

  // Insert new idea into history so it won't repeat in future reveals/rerolls
  await supabase.from("date_ideas").insert({
    user_id: user.id,
    idea: idea as unknown as import("@/lib/types").Json,
    status: "revealed",
    revealed_at: new Date().toISOString(),
  });

  // Reroll flags already set atomically above — only update the date idea here
  await supabase
    .from("profiles")
    .update({
      date_idea: idea as unknown as import("@/lib/types").Json,
      date_accepted_at: null,
    })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}
