"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeLogValue } from "@/lib/log";
import { getCoupleAccess } from "@/lib/partner-invites";
import { FREE_INTERESTS, FREE_MAX_RADIUS_KM, MIN_INTEREST_CATEGORIES, PAID_MAX_RADIUS_KM, isPlusPlan } from "@/lib/plans";
import { fullOnboardingSchema } from "@/lib/schemas/onboarding";

const settingsSchema = fullOnboardingSchema.safeExtend({
  preferred_radius: z.number().min(1000).max(PAID_MAX_RADIUS_KM * 1000),
});

export async function updateSettings(input: unknown): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    const firstMessage = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: firstMessage ?? "Invalid settings" };
  }

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("plan_type")
    .eq("id", access.profileId)
    .single();

  if (profileError || !profile) {
    console.error(
      `[audit] update-settings: profile fetch failed uid=${safeLogValue(user.id)} profile=${safeLogValue(access.profileId)} msg=${safeLogValue(profileError?.message ?? "missing")}`
    );
    return { error: "Failed to save" };
  }

  const v = parsed.data;
  const isPremium = isPlusPlan(profile.plan_type);
  const isPayingSubscriber = profile.plan_type === "subscription";
  const interests = isPremium
    ? v.interests
    : v.interests.filter((interest) => (FREE_INTERESTS as readonly string[]).includes(interest));

  if (interests.length < MIN_INTEREST_CATEGORIES) {
    return { error: `Select at least ${MIN_INTEREST_CATEGORIES} Starter categories` };
  }

  const preferredRadius = Math.min(
    v.preferred_radius,
    (isPremium ? PAID_MAX_RADIUS_KM : FREE_MAX_RADIUS_KM) * 1000
  );

  const { error } = await admin
    .from("profiles")
    .update({
      partner_names: { partner1: v.partner1, partner2: v.partner2 },
      interests,
      constraints: {
        budget_max: v.budget_max,
        date_outside: v.date_outside,
        date_at_home: v.date_at_home,
      },
      cadence: isPayingSubscriber ? v.cadence : "monthly",
      last_lat: v.lat ?? null,
      last_long: v.lng ?? null,
      preferred_radius: preferredRadius,
    })
    .eq("id", access.profileId);

  if (error) {
    console.error(
      `[audit] update-settings: failed uid=${safeLogValue(user.id)} profile=${safeLogValue(access.profileId)} msg=${safeLogValue(error.message)}`
    );
    return { error: "Failed to save. Please try again." };
  }

  revalidatePath("/dashboard");
  return {};
}

export async function clearSettingsLocation(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);
  const { error } = await admin
    .from("profiles")
    .update({ last_lat: null, last_long: null })
    .eq("id", access.profileId);

  if (error) {
    console.error(
      `[audit] clear-settings-location: failed uid=${safeLogValue(user.id)} profile=${safeLogValue(access.profileId)} msg=${safeLogValue(error.message)}`
    );
    return { error: "Failed to clear location. Please try again." };
  }

  revalidatePath("/dashboard");
  return {};
}
