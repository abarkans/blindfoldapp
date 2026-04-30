"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAIDateIdea } from "@/lib/ai/generate-date";
import { searchNearbyVenues } from "@/lib/places/search";
import { checkRevealRateLimit } from "@/lib/rate-limit";
import { adoptDeletionHold } from "@/lib/deletion-hold";

// Validate the shape of the profile row fetched from the DB.
// Prevents compromised/malformed data from reaching AI prompts or place searches.
const profileSchema = z.object({
  plan_type: z.string(),
  partner_names: z.object({ partner1: z.string().max(50), partner2: z.string().max(50) }),
  interests: z.array(z.string()),
  constraints: z.object({
    budget_max: z.number().min(10).max(200),
    has_car: z.boolean(),
    prefers_walking: z.boolean(),
  }),
  cadence: z.enum(["weekly", "biweekly", "monthly"]),
  revealed_at: z.string().nullable(),
  last_lat: z.number().nullable(),
  last_long: z.number().nullable(),
  preferred_radius: z.number().nullable(),
});

const CADENCE_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

const VALID_INTERESTS = new Set([
  "food", "music", "nature", "art", "fitness", "cinema",
  "books", "coffee", "beach", "photography", "gaming", "romance",
]);

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

  // Defense-in-depth: adopt any active deletion hold for this email before
  // the cooldown gate runs. finishOnboarding is the primary adoption point;
  // this catches edge cases where reveal is invoked on a profile that was
  // created without going through finishOnboarding (skipped/partial flow).
  const admin0 = createAdminClient();
  await adoptDeletionHold(admin0, user.id, user.email);

  const { data: raw } = await supabase
    .from("profiles")
    .select("plan_type, partner_names, interests, constraints, cadence, revealed_at, last_lat, last_long, preferred_radius")
    .eq("id", user.id)
    .single();

  if (!raw) throw new Error("Profile not found");

  // Validate + type the profile row at the server trust boundary
  const profile = profileSchema.parse(raw);

  // Atomic eligibility claim — single conditional UPDATE either succeeds
  // for the first concurrent request or returns 0 rows for everyone else.
  // This is both the cooldown gate AND the spam-protection gate, replacing
  // the old SELECT-then-decide pattern that allowed concurrent rapid
  // requests to all pass and each fire (paid) AI + Places calls.
  const days = CADENCE_DAYS[profile.cadence];
  const cooldownCutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  const nowIso = new Date().toISOString();
  const admin = admin0;

  let claimQuery = admin
    .from("profiles")
    .update({ revealed_at: nowIso })
    .eq("id", user.id);
  claimQuery = profile.revealed_at
    ? claimQuery.lte("revealed_at", cooldownCutoff)
    : claimQuery.is("revealed_at", null);
  const { data: claimed } = await claimQuery.select("id");

  if (!claimed?.length) {
    const reason = profile.revealed_at ? "cooldown_or_race" : "race";
    console.warn(`[audit] reveal: claim failed uid=${user.id} reason=${reason}`);
    throw new Error("Next date not available yet");
  }

  const { constraints } = profile;
  const isSubscribed = profile.plan_type === "subscription";
  const safeInterests = profile.interests.filter((i) => VALID_INTERESTS.has(i));

  let idea: object;

  try {
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
        isSubscribed,
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
        isSubscribed,
        previousTitles,
      });
    }
  } catch (err) {
    // Generation failed — roll back the atomic claim so the user can
    // retry without waiting for the cadence to elapse. Migration 018
    // grants service_role the right to roll revealed_at back; the
    // lockdown trigger continues to block authenticated callers from
    // doing the same.
    await admin
      .from("profiles")
      .update({ revealed_at: profile.revealed_at })
      .eq("id", user.id);
    console.error(`[audit] reveal: generation failed uid=${user.id}, claim rolled back`);
    throw err;
  }

  // Insert into date_ideas history
  await admin.from("date_ideas").insert({
    user_id: user.id,
    idea: idea as unknown as import("@/lib/types").Json,
    status: "revealed",
    revealed_at: nowIso,
  });

  // Final write: attach the idea and reset the per-cycle flags.
  // revealed_at was already stamped by the atomic claim above.
  await admin
    .from("profiles")
    .update({
      date_idea: idea as unknown as import("@/lib/types").Json,
      notification_sent_at: null,
      current_date_rerolled: false,
      date_accepted_at: null,
    })
    .eq("id", user.id);

  console.info(`[audit] reveal: success uid=${user.id} mode=${profile.last_lat ? "venue" : "ai"}`);
  revalidatePath("/dashboard");
}
