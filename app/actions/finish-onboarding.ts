"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fullOnboardingSchema, type FullOnboardingData } from "@/lib/schemas/onboarding";
import { hashEmail } from "@/lib/deletion-hold";
import { PAID_MAX_RADIUS_KM, MIN_INTEREST_CATEGORIES } from "@/lib/plans";
import { generateAIDateIdea, generateHomeDateIdea } from "@/lib/ai/generate-date";
import { searchNearbyVenues } from "@/lib/places/search";
import { createDateTeaser } from "@/lib/date-teaser";
import { getCoupleAccess } from "@/lib/partner-invites";
import type { Json } from "@/lib/types";

function optionalNumber(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

export async function finishOnboarding(input: FullOnboardingData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  const inputWithDefaults = {
    ...input,
    partner1: input.partner1 || "",
    partner2: input.partner2 || "",
    cadence: "monthly" as const,
    budget_max: optionalNumber(input.budget_max) ?? 50,
    lat: optionalNumber(input.lat),
    lng: optionalNumber(input.lng),
    preferred_radius: optionalNumber(input.preferred_radius),
  };

  const parsed = fullOnboardingSchema.safeParse(inputWithDefaults);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    console.error(
      `[audit] finish-onboarding: invalid uid=${user.id} issues=${JSON.stringify(fieldErrors)}`
    );
    const firstMessage = Object.values(fieldErrors).flat()[0];
    return { error: firstMessage ?? "Invalid onboarding data" };
  }
  const v = parsed.data;

  // All new users start on trial — they get 1 Plus-quality date.
  // Trial users can pick any interest category.
  const interests = v.interests.filter((i) =>
    ["food", "music", "nature", "art", "fitness", "cinema", "books", "coffee", "beach", "photography", "gaming", "romance"].includes(i)
  );
  if (interests.length < MIN_INTEREST_CATEGORIES) {
    return { error: `Select at least ${MIN_INTEREST_CATEGORIES} categories` };
  }

  // Trial gets Plus-quality radius (no cap).
  const preferredRadius = v.preferred_radius !== undefined
    ? Math.min(v.preferred_radius, PAID_MAX_RADIUS_KM * 1000)
    : undefined;

  // Carry over any active reveal cooldown from a deleted prior account.
  let carryoverRevealedAt: string | null = null;
  if (user.email) {
    const idHash = hashEmail(user.email);
    const { data: hold } = await admin
      .from("deletion_holds")
      .select("revealed_at, expires_at")
      .eq("id_hash", idHash)
      .single();
    if (hold && new Date(hold.expires_at).getTime() > Date.now()) {
      carryoverRevealedAt = hold.revealed_at;
      await admin.from("deletion_holds").delete().eq("id_hash", idHash);
    }
  }

  const { data: updated, error } = await admin
    .from("profiles")
    .update({
      partner_names: { partner1: v.partner1, partner2: v.partner2 },
      interests,
      constraints: {
        budget_max: v.budget_max,
        date_outside: v.date_outside,
        date_at_home: v.date_at_home,
      },
      cadence: "monthly",
      plan_type: "trial",
      last_lat: v.lat ?? null,
      last_long: v.lng ?? null,
      ...(preferredRadius !== undefined ? { preferred_radius: preferredRadius } : {}),
      ...(carryoverRevealedAt ? { revealed_at: carryoverRevealedAt } : {}),
      onboarding_complete: true,
    })
    .eq("id", user.id)
    .select("onboarding_complete")
    .single();

  if (error) {
    console.error(`[audit] finish-onboarding: uid=${user.id} msg=${error.message}`);
    return { error: "Failed to save onboarding" };
  }

  if (!updated?.onboarding_complete) {
    console.error(`[audit] finish-onboarding: onboarding_complete reverted uid=${user.id} — check SUPABASE_SERVICE_ROLE_KEY`);
    return { error: "Setup couldn't be saved. Please check your connection and try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set("onboarding_complete", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });

  try {
    await generateInitialDate(user.id, {
      partner_names: { partner1: v.partner1, partner2: v.partner2 },
      interests,
      constraints: { budget_max: v.budget_max, date_outside: v.date_outside, date_at_home: v.date_at_home },
      last_lat: v.lat ?? null,
      last_long: v.lng ?? null,
      preferred_radius: preferredRadius ?? null,
    });
  } catch (err) {
    console.error(`[audit] finish-onboarding: initial date generation failed uid=${user.id} msg=${err instanceof Error ? err.message : String(err)}`);
  }

  revalidatePath("/dashboard");
  return {};
}

const VALID_INTERESTS_SET = new Set([
  "food", "music", "nature", "art", "fitness", "cinema",
  "books", "coffee", "beach", "photography", "gaming", "romance",
]);

async function generateInitialDate(
  userId: string,
  profile: {
    partner_names: { partner1: string; partner2: string };
    interests: string[];
    constraints: { budget_max: number; date_outside: boolean; date_at_home: boolean };
    last_lat: number | null;
    last_long: number | null;
    preferred_radius: number | null;
  }
) {
  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, userId);
  const safeInterests = profile.interests.filter((i) => VALID_INTERESTS_SET.has(i));
  const nowIso = new Date().toISOString();
  const { date_outside, date_at_home } = profile.constraints;
  const effectiveLocationType: "outside" | "home" =
    date_at_home && !date_outside ? "home" : "outside";

  let idea: object;

  if (effectiveLocationType === "home") {
    const homeIdea = await generateHomeDateIdea({
      partnerNames: profile.partner_names,
      interests: safeInterests,
      budgetMax: profile.constraints.budget_max,
      isSubscribed: true,
      datesCompleted: 0,
      previousTitles: [],
    });
    idea = { ...homeIdea, location_type: "home" };
  } else if (profile.last_lat != null && profile.last_long != null) {
    const venue = await searchNearbyVenues({
      interests: safeInterests,
      lat: profile.last_lat,
      lng: profile.last_long,
      radiusMeters: profile.preferred_radius ?? 10000,
      previousPlaceIds: [],
    });
    const aiEnrichment = await generateAIDateIdea({
      partnerNames: profile.partner_names,
      interests: safeInterests,
      budgetMax: profile.constraints.budget_max,
      dateOutside: true,
      dateAtHome: date_at_home,
      isSubscribed: true,
      datesCompleted: 0,
      venue: {
        name: venue.display_name,
        address: venue.formatted_address,
        rating: venue.rating,
        price_level: venue.price_level,
        meta: venue.meta,
      },
    });
    idea = { ...venue, ai: aiEnrichment, location_type: "outside" };
  } else {
    const aiIdea = await generateAIDateIdea({
      partnerNames: profile.partner_names,
      interests: safeInterests,
      budgetMax: profile.constraints.budget_max,
      dateOutside: date_outside,
      dateAtHome: date_at_home,
      isSubscribed: true,
      datesCompleted: 0,
      previousTitles: [],
    });
    idea = { ...aiIdea, location_type: "outside" };
  }

  const teaser = createDateTeaser(idea);

  await admin.from("date_ideas").insert({
    user_id: access.profileId,
    idea: idea as Json,
    status: "revealed",
    revealed_at: nowIso,
    location_type: effectiveLocationType,
  });

  await admin.from("profiles").update({
    date_idea: idea as Json,
    date_teaser: teaser as unknown as Json,
    revealed_at: nowIso,
    notification_sent_at: null,
    current_date_rerolled: false,
    date_accepted_at: nowIso,
    reveal_owner_ready_at: null,
    reveal_partner_ready_at: null,
    partner_ping_sent_at: null,
    checkin_owner_at: null,
    checkin_partner_at: null,
    checkin_owner_skipped: false,
    checkin_partner_skipped: false,
  }).eq("id", access.profileId);
}
