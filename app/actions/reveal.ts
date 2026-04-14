"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateAIDateIdea } from "@/lib/ai/generate-date";
import { searchNearbyVenues } from "@/lib/places/search";
import { checkRevealRateLimit } from "@/lib/rate-limit";

// Validate the shape of the profile row fetched from the DB.
// Prevents compromised/malformed data from reaching AI prompts or place searches.
const profileSchema = z.object({
  partner_names: z.object({ partner1: z.string().max(50), partner2: z.string().max(50) }),
  interests: z.array(z.string()),
  constraints: z.object({
    budget_max: z.number().min(10).max(200),
    has_car: z.boolean(),
    prefers_walking: z.boolean(),
  }),
  cadence: z.enum(["weekly", "biweekly", "monthly", "spontaneous"]),
  revealed_at: z.string().nullable(),
  last_lat: z.number().nullable(),
  last_long: z.number().nullable(),
  preferred_radius: z.number().nullable(),
});

export async function revealDate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn("[audit] reveal: unauthenticated attempt");
    throw new Error("Not authenticated");
  }

  await checkRevealRateLimit(user.id);

  const { data: raw } = await supabase
    .from("profiles")
    .select("partner_names, interests, constraints, cadence, revealed_at, last_lat, last_long, preferred_radius")
    .eq("id", user.id)
    .single();

  if (!raw) throw new Error("Profile not found");

  // Validate + type the profile row at the server trust boundary
  const profile = profileSchema.parse(raw);

  // Guard: check cooldown server-side
  const cadenceDays: Record<string, number> = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
    spontaneous: 3,
  };

  if (profile.revealed_at) {
    const days = cadenceDays[profile.cadence];
    const nextAvailable = new Date(profile.revealed_at);
    nextAvailable.setDate(nextAvailable.getDate() + days);
    if (new Date() < nextAvailable) {
      console.warn(`[audit] reveal: cooldown violation uid=${user.id} next=${nextAvailable.toISOString()}`);
      throw new Error("Next date not available yet");
    }
  }

  const { constraints } = profile;

  // Server-side allowlist: reject interests that weren't set via the legitimate onboarding UI
  const VALID_INTERESTS = new Set([
    "food", "music", "nature", "art", "fitness", "cinema",
    "books", "coffee", "beach", "photography", "gaming", "romance",
  ]);
  const safeInterests = profile.interests.filter((i) => VALID_INTERESTS.has(i));

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
      interests: safeInterests,
      lat: profile.last_lat,
      lng: profile.last_long,
      radiusMeters: profile.preferred_radius ?? 10000,
      previousPlaceIds,
    });

    // Enrich the venue with AI-generated description, vibe, tags etc.
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
      partnerNames: profile.partner_names,
      interests: safeInterests,
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

  console.info(`[audit] reveal: success uid=${user.id} mode=${profile.last_lat ? "venue" : "ai"}`);
  revalidatePath("/dashboard");
}
