"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateAIDateIdea } from "@/lib/ai/generate-date";
import { searchNearbyVenues } from "@/lib/places/search";

export async function revealDate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("partner_names, interests, constraints, cadence, revealed_at, last_lat, last_long, preferred_radius")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  // Guard: check cooldown server-side
  if (profile.revealed_at) {
    const cadenceDays: Record<string, number> = {
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    };
    const days = cadenceDays[profile.cadence] ?? 7;
    const nextAvailable = new Date(profile.revealed_at);
    nextAvailable.setDate(nextAvailable.getDate() + days);
    if (new Date() < nextAvailable) {
      throw new Error("Next date not available yet");
    }
  }

  const constraints = profile.constraints as {
    budget_max: number;
    has_car: boolean;
    prefers_walking: boolean;
  };

  const now = new Date().toISOString();
  let idea: object;

  if (profile.last_lat && profile.last_long) {
    // Venue-based: fetch previously visited place IDs to avoid repeats
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
      interests: profile.interests,
      lat: profile.last_lat,
      lng: profile.last_long,
      radiusMeters: profile.preferred_radius ?? 10000,
      previousPlaceIds,
    });

    // Enrich the venue with AI-generated description, vibe, tags etc.
    const aiEnrichment = await generateAIDateIdea({
      partnerNames: profile.partner_names as { partner1: string; partner2: string },
      interests: profile.interests,
      budgetMax: constraints.budget_max,
      hasCar: constraints.has_car,
      prefersWalking: constraints.prefers_walking,
      venue: {
        name: venue.display_name,
        address: venue.formatted_address,
        rating: venue.rating,
        price_level: venue.price_level,
      },
    });

    idea = { ...venue, ai: aiEnrichment };
  } else {
    // AI fallback: no location set
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
      partnerNames: profile.partner_names as { partner1: string; partner2: string },
      interests: profile.interests,
      budgetMax: constraints.budget_max,
      hasCar: constraints.has_car,
      prefersWalking: constraints.prefers_walking,
      previousTitles,
    });
  }

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
