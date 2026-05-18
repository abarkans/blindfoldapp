"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fullOnboardingSchema, identitySchema, type FullOnboardingData, type IdentityFormData } from "@/lib/schemas/onboarding";
import { hashEmail } from "@/lib/deletion-hold";
import { sendPartnerInviteForOnboarding } from "@/app/actions/partner-invite";
import { FREE_INTERESTS, FREE_MAX_RADIUS_KM, MIN_INTEREST_CATEGORIES } from "@/lib/plans";

function optionalNumber(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

export async function saveOnboardingCheckoutDraft(input: IdentityFormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = identitySchema.safeParse(input);
  if (!parsed.success) {
    const firstMessage = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: firstMessage ?? "Invalid names" };
  }

  const v = parsed.data;
  const partnerNamesDraft = {
    partner1: v.partner1,
    partner2: v.partner2,
    ...(v.partner_email ? { partner_email: v.partner_email.toLowerCase() } : {}),
  };
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .upsert({
      id: user.id,
      partner_names: partnerNamesDraft,
    });

  if (error) {
    console.error(`[audit] save-onboarding-checkout-draft: uid=${user.id} msg=${error.message}`);
    return { error: "Couldn't save your setup before checkout. Please try again." };
  }

  return {};
}

export async function finishOnboarding(input: FullOnboardingData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  let { data: profile } = await admin
    .from("profiles")
    .select("plan_type, partner_names, cadence, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profile?.plan_type !== "subscription" && input.checkout_session_id) {
    try {
      const { stripe } = await import("@/lib/stripe");
      const session = await stripe.checkout.sessions.retrieve(input.checkout_session_id);
      if (
        session.status === "complete" &&
        session.mode === "subscription" &&
        session.metadata?.user_id === user.id
      ) {
        // Verify the subscription is still active — session.status === "complete" only
        // means the checkout was completed, not that the subscription is current. Without
        // this check a cancelled subscriber could replay their old session_id to re-upgrade
        // for free.
        const subId = typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as { id?: string } | null)?.id ?? null;

        let subActive = false;
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            subActive = sub.status === "active" || sub.status === "trialing";
          } catch (subErr) {
            console.error(
              `[audit] finish-onboarding: subscription retrieve failed uid=${user.id} sub=${subId} msg=${subErr instanceof Error ? subErr.message : String(subErr)}`
            );
          }
        }

        if (subActive) {
          const customerId = typeof session.customer === "string" ? session.customer : null;
          const rawCadence = session.metadata?.cadence;
          const checkoutCadence =
            rawCadence === "weekly" || rawCadence === "biweekly" || rawCadence === "monthly"
              ? rawCadence
              : undefined;

          const { data: updatedProfile, error: checkoutProfileError } = await admin
            .from("profiles")
            .update({
              plan_type: "subscription",
              ...(customerId ? { stripe_customer_id: customerId } : {}),
              ...(checkoutCadence ? { cadence: checkoutCadence } : {}),
            })
            .eq("id", user.id)
            .select("plan_type, partner_names, cadence, stripe_customer_id")
            .single();

          if (checkoutProfileError) {
            console.error(
              `[audit] finish-onboarding: checkout profile update failed uid=${user.id} msg=${checkoutProfileError.message}`
            );
          } else {
            profile = updatedProfile;
          }
        } else {
          console.warn(
            `[audit] finish-onboarding: session replay rejected — subscription not active uid=${user.id} sub=${subId}`
          );
        }
      }
    } catch (error) {
      console.error(
        `[audit] finish-onboarding: checkout verify failed uid=${user.id} msg=${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const savedNames = profile?.partner_names as { partner1?: string; partner2?: string; partner_email?: string } | null;
  const inputWithSavedRequiredFields = {
    ...input,
    partner1: input.partner1 || savedNames?.partner1 || "",
    partner2: input.partner2 || savedNames?.partner2 || "",
    cadence: input.cadence || profile?.cadence || "monthly",
    partner_email: input.partner_email || savedNames?.partner_email || undefined,
    budget_max: optionalNumber(input.budget_max) ?? 50,
    lat: optionalNumber(input.lat),
    lng: optionalNumber(input.lng),
    preferred_radius: optionalNumber(input.preferred_radius),
  };

  const parsed = fullOnboardingSchema.safeParse(inputWithSavedRequiredFields);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    console.error(
      `[audit] finish-onboarding: invalid uid=${user.id} issues=${JSON.stringify(fieldErrors)}`
    );
    const firstMessage = Object.values(fieldErrors).flat()[0];
    return { error: firstMessage ?? "Invalid onboarding data" };
  }
  const v = parsed.data;

  const isSubscribed = profile?.plan_type === "subscription";
  const interests = isSubscribed
    ? v.interests
    : v.interests.filter((interest) =>
        (FREE_INTERESTS as readonly string[]).includes(interest)
      );
  if (interests.length < MIN_INTEREST_CATEGORIES) {
    return { error: `Select at least ${MIN_INTEREST_CATEGORIES} Starter categories` };
  }

  const preferredRadius = isSubscribed
    ? v.preferred_radius
    : v.preferred_radius !== undefined
    ? Math.min(v.preferred_radius, FREE_MAX_RADIUS_KM * 1000)
    : undefined;

  // Carry over any active reveal cooldown from a deleted prior account with
  // the same email. Applied at onboarding finish so the dashboard renders
  // the countdown state immediately instead of showing a Reveal button that
  // would then fail.
  let carryoverRevealedAt: string | null = null;
  let carryoverCadence: string | null = null;
  if (user.email) {
    const idHash = hashEmail(user.email);
    const { data: hold } = await admin
      .from("deletion_holds")
      .select("revealed_at, cadence, expires_at")
      .eq("id_hash", idHash)
      .single();
    if (hold && new Date(hold.expires_at).getTime() > Date.now()) {
      carryoverRevealedAt = hold.revealed_at;
      carryoverCadence = hold.cadence;
      await admin.from("deletion_holds").delete().eq("id_hash", idHash);
    }
  }

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
      cadence: carryoverCadence ?? v.cadence,
      last_lat: v.lat ?? null,
      last_long: v.lng ?? null,
      ...(preferredRadius !== undefined ? { preferred_radius: preferredRadius } : {}),
      ...(carryoverRevealedAt ? { revealed_at: carryoverRevealedAt } : {}),
      onboarding_complete: true,
    })
    .eq("id", user.id);

  if (error) {
    console.error(`[audit] finish-onboarding: uid=${user.id} msg=${error.message}`);
    return { error: "Failed to save onboarding" };
  }

  // Invite is best-effort: profile is already saved as complete. A transient
  // email failure must not block onboarding — the user can resend from Settings.
  if (v.partner_email) {
    const inviteResult = await sendPartnerInviteForOnboarding(v.partner_email.toLowerCase());
    if (inviteResult.error) {
      console.warn(`[audit] finish-onboarding: invite non-fatal uid=${user.id} reason=${inviteResult.error}`);
    }
  }

  const cookieStore = await cookies();
  cookieStore.set("onboarding_complete", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/dashboard");
  return {};
}
