"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAIDateIdea } from "@/lib/ai/generate-date";
import { searchNearbyVenues } from "@/lib/places/search";
import { checkRerollRateLimit } from "@/lib/rate-limit";
import { getCoupleAccess } from "@/lib/partner-invites";
import { createDateTeaser } from "@/lib/date-teaser";

const profileSchema = z.object({
  plan_type: z.string(),
  total_rerolls_used: z.number(),
  current_date_rerolled: z.boolean(),
  date_accepted_at: z.string().nullable(),
  reveal_owner_ready_at: z.string().nullable(),
  reveal_partner_ready_at: z.string().nullable(),
  dates_completed_count: z.number().min(0).default(0),
  partner_names: z.object({ partner1: z.string().max(50), partner2: z.string().max(50) }),
  // Cap entry length and array length so a poisoned interests array cannot
  // balloon the AI prompt. Mirrors the bound enforced in reveal.ts.
  interests: z.array(z.string().max(40)).max(12),
  constraints: z.object({
    budget_max: z.number().min(10).max(200),
    date_outside: z.boolean().default(true),
    date_at_home: z.boolean().default(false),
    has_car: z.boolean().optional(),
    prefers_walking: z.boolean().optional(),
  }),
  last_lat: z.number().min(-90).max(90).nullable(),
  last_long: z.number().min(-180).max(180).nullable(),
  preferred_radius: z.number().min(1000).max(50000).nullable(),
});

export async function rerollDate(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { data: raw } = await supabase
    .from("profiles")
    .select("plan_type, total_rerolls_used, current_date_rerolled, date_accepted_at, reveal_owner_ready_at, reveal_partner_ready_at, dates_completed_count, partner_names, interests, constraints, last_lat, last_long, preferred_radius")
    .eq("id", access.profileId)
    .single();

  if (!raw) throw new Error("Profile not found");

  await checkRerollRateLimit(user.id);

  const profile = profileSchema.parse(raw);
  const isFree = profile.plan_type !== "subscription";
  const partnerReadyAt =
    access.role === "owner" ? profile.reveal_partner_ready_at : profile.reveal_owner_ready_at;

  if (profile.date_accepted_at || partnerReadyAt) {
    throw new Error("Your partner already accepted this date.");
  }

  // Writes go through the admin client because total_rerolls_used,
  // current_date_rerolled, date_idea, and date_accepted_at are protected by
  // the lockdown trigger from migration 015.
  // Atomic eligibility claim — single conditional UPDATE prevents concurrent requests
  // from both passing the eligibility check (TOCTOU race condition).
  // Returns 0 rows if the condition wasn't met; throw without touching the counter.
  if (isFree) {
    const { data: claimed } = await admin
      .from("profiles")
      .update({ total_rerolls_used: 1, current_date_rerolled: true })
      .eq("id", access.profileId)
      .eq("total_rerolls_used", 0)
      .select("id");
    if (!claimed?.length) throw new Error("No re-rolls remaining on the basic plan");
  } else {
    const { data: claimed } = await admin
      .from("profiles")
      .update({ current_date_rerolled: true })
      .eq("id", access.profileId)
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
        .eq("user_id", access.profileId)
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
        dateOutside: constraints.date_outside,
        dateAtHome: constraints.date_at_home,
        isSubscribed: !isFree,
        datesCompleted: profile.dates_completed_count,
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
        .eq("user_id", access.profileId)
        .order("generated_at", { ascending: false })
        .limit(50);

      const previousTitles = (pastIdeas ?? [])
        .map((row) => (row.idea as { title?: string })?.title)
        .filter(Boolean) as string[];

      idea = await generateAIDateIdea({
        partnerNames: profile.partner_names,
        interests: safeInterests,
        budgetMax: constraints.budget_max,
        dateOutside: constraints.date_outside,
        dateAtHome: constraints.date_at_home,
        isSubscribed: !isFree,
        datesCompleted: profile.dates_completed_count,
        previousTitles,
      });
    }
  } catch (err) {
    // Generation failed — roll back the atomic claim so the user can retry
    if (isFree) {
      await admin.from("profiles").update({ total_rerolls_used: 0, current_date_rerolled: false }).eq("id", access.profileId);
    } else {
      await admin.from("profiles").update({ current_date_rerolled: false }).eq("id", access.profileId);
    }
    throw err;
  }

  await admin
    .from("date_ideas")
    .update({ status: "skipped" })
    .eq("user_id", access.profileId)
    .eq("status", "pending");

  // Insert new idea into history so it won't repeat in future reveals/rerolls
  await admin.from("date_ideas").insert({
    user_id: access.profileId,
    idea: idea as unknown as import("@/lib/types").Json,
    status: "pending",
    revealed_at: new Date().toISOString(),
  });

  // Reroll flags already set atomically above — only update the date idea here
  await admin
    .from("profiles")
    .update({
      date_idea: idea as unknown as import("@/lib/types").Json,
      date_teaser: createDateTeaser(idea) as unknown as import("@/lib/types").Json,
      date_accepted_at: null,
      reveal_owner_ready_at: null,
      reveal_partner_ready_at: null,
    })
    .eq("id", access.profileId);

  revalidatePath("/dashboard");
}
