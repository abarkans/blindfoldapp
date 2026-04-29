"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fullOnboardingSchema, type FullOnboardingData } from "@/lib/schemas/onboarding";

export async function finishOnboarding(input: FullOnboardingData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = fullOnboardingSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid onboarding data" };
  const v = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      partner_names: { partner1: v.partner1, partner2: v.partner2 },
      interests: v.interests,
      constraints: {
        budget_max: v.budget_max,
        has_car: v.has_car,
        prefers_walking: v.prefers_walking,
      },
      cadence: v.cadence,
      last_lat: v.lat ?? null,
      last_long: v.lng ?? null,
      ...(v.preferred_radius !== undefined ? { preferred_radius: v.preferred_radius } : {}),
      onboarding_complete: true,
    })
    .eq("id", user.id);

  if (error) {
    console.error(`[audit] finish-onboarding: uid=${user.id} msg=${error.message}`);
    return { error: "Failed to save onboarding" };
  }

  revalidatePath("/dashboard");
  return {};
}
