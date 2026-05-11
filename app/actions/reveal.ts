"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAIDateIdea } from "@/lib/ai/generate-date";
import { searchNearbyVenues } from "@/lib/places/search";
import { checkRevealRateLimit } from "@/lib/rate-limit";
import { adoptDeletionHold } from "@/lib/deletion-hold";
import { getCoupleAccess } from "@/lib/partner-invites";
import { createDateTeaser } from "@/lib/date-teaser";
import { resend, FROM_ADDRESS } from "@/lib/email/resend";
import { dateInitiatedEmail } from "@/lib/email/templates/date-initiated";
import type { Database, Json } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const profileSchema = z.object({
  plan_type: z.string(),
  partner_names: z.object({ partner1: z.string().max(50), partner2: z.string().max(50) }),
  interests: z.array(z.string().max(40)).max(12),
  constraints: z.object({
    budget_max: z.number().min(10).max(200),
    date_outside: z.boolean().default(true),
    date_at_home: z.boolean().default(false),
    has_car: z.boolean().optional(),
    prefers_walking: z.boolean().optional(),
  }),
  cadence: z.enum(["weekly", "biweekly", "monthly"]),
  revealed_at: z.string().nullable(),
  last_lat: z.number().min(-90).max(90).nullable(),
  last_long: z.number().min(-180).max(180).nullable(),
  preferred_radius: z.number().min(1000).max(50000).nullable(),
  dates_completed_count: z.number().min(0).default(0),
  date_idea: z.unknown().nullable().optional(),
  date_accepted_at: z.string().nullable().optional(),
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

type RevealResult =
  | { status: "started"; warning?: string }
  | { status: "waiting" }
  | { status: "revealed" }
  | { status: "error"; error: string };

export async function startDate(): Promise<RevealResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Not authenticated" };

  try {
    await checkRevealRateLimit(user.id);
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Too many reveal attempts. Try again shortly.",
    };
  }

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);
  await adoptDeletionHold(admin, access.profileId, user.email);

  const { data: raw, error: profileError } = await admin
    .from("profiles")
    .select("plan_type, partner_names, interests, constraints, cadence, revealed_at, last_lat, last_long, preferred_radius, dates_completed_count, date_idea, date_accepted_at")
    .eq("id", access.profileId)
    .single();

  if (profileError || !raw) {
    console.error(`[audit] start-date: profile fetch failed uid=${user.id} profile=${access.profileId} msg=${profileError?.message ?? "missing"}`);
    return { status: "error", error: "Profile not found" };
  }

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[audit] start-date: profile validation failed uid=${user.id} profile=${access.profileId}`);
    return { status: "error", error: "Profile needs setup before starting a date." };
  }
  const profile = parsed.data;

  const { data: partnerMember, error: partnerError } = await admin
    .from("couple_members")
    .select("user_id")
    .eq("profile_id", access.profileId)
    .eq("role", "partner")
    .maybeSingle();

  if (partnerError) {
    console.error(`[audit] start-date: partner fetch failed uid=${user.id} profile=${access.profileId} msg=${partnerError.message}`);
    return { status: "error", error: "Could not check partner status. Please try again." };
  }
  if (!partnerMember) return { status: "error", error: "Invite your partner before starting a date." };
  if (profile.date_idea && !profile.date_accepted_at) return { status: "started" };
  if (!isRevealAvailableForProfile(profile.revealed_at, profile.cadence)) {
    return { status: "error", error: "Next date not available yet" };
  }

  const nowIso = new Date().toISOString();
  const days = CADENCE_DAYS[profile.cadence];
  const cooldownCutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  let claimQuery = admin
    .from("profiles")
    .update({ revealed_at: nowIso })
    .eq("id", access.profileId);
  claimQuery = profile.revealed_at
    ? claimQuery.lte("revealed_at", cooldownCutoff)
    : claimQuery.is("revealed_at", null);
  const { data: claimed } = await claimQuery.select("id");
  if (!claimed?.length) return { status: "error", error: "Next date not available yet" };

  const safeInterests = profile.interests.filter((i) => VALID_INTERESTS.has(i));
  let idea: object;

  try {
    if (profile.last_lat && profile.last_long) {
      const { data: pastIdeas } = await admin
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
        budgetMax: profile.constraints.budget_max,
        dateOutside: profile.constraints.date_outside,
        dateAtHome: profile.constraints.date_at_home,
        isSubscribed: profile.plan_type === "subscription",
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
      const { data: pastIdeas } = await admin
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
        budgetMax: profile.constraints.budget_max,
        dateOutside: profile.constraints.date_outside,
        dateAtHome: profile.constraints.date_at_home,
        isSubscribed: profile.plan_type === "subscription",
        datesCompleted: profile.dates_completed_count,
        previousTitles,
      });
    }
  } catch (error) {
    await admin.from("profiles").update({ revealed_at: profile.revealed_at }).eq("id", access.profileId);
    console.error(`[audit] start-date: generation failed uid=${user.id} profile=${access.profileId}`);
    return { status: "error", error: "Couldn't generate a date. Please try again." };
  }

  const teaser = createDateTeaser(idea);
  await admin.from("date_ideas").insert({
    user_id: access.profileId,
    idea: idea as Json,
    status: "pending",
    revealed_at: nowIso,
  });
  await admin
    .from("profiles")
    .update({
      date_idea: idea as Json,
      date_teaser: teaser as unknown as Json,
      notification_sent_at: null,
      current_date_rerolled: false,
      date_accepted_at: null,
      reveal_owner_ready_at: null,
      reveal_partner_ready_at: null,
    })
    .eq("id", access.profileId);

  const notificationStatus = await notifyOtherPartner(admin, access.profileId, user.id, profile.partner_names);
  revalidatePath("/dashboard");
  return {
    status: "started",
    ...(notificationStatus === "sent"
      ? {}
      : { warning: "Date started, but we couldn't email your partner. They'll see it when they open the app." }),
  };
}

export async function revealDate(): Promise<RevealResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Not authenticated" };

  try {
    await checkRevealRateLimit(user.id);
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Too many reveal attempts. Try again shortly.",
    };
  }

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);
  const { data: profile, error } = await admin
    .from("profiles")
    .select("date_idea, date_accepted_at, reveal_owner_ready_at, reveal_partner_ready_at")
    .eq("id", access.profileId)
    .single();

  if (error || !profile?.date_idea) return { status: "error", error: "Start the date first." };
  if (profile.date_accepted_at) return { status: "revealed" };

  const nowIso = new Date().toISOString();
  const ownerReadyAt = access.role === "owner" ? nowIso : profile.reveal_owner_ready_at;
  const partnerReadyAt = access.role === "partner" ? nowIso : profile.reveal_partner_ready_at;
  const readyUpdate =
    access.role === "owner"
      ? { reveal_owner_ready_at: nowIso }
      : { reveal_partner_ready_at: nowIso };

  const { error: readyError } = await admin
    .from("profiles")
    .update(readyUpdate)
    .eq("id", access.profileId);
  if (readyError) return { status: "error", error: "Could not mark you ready. Please try again." };

  if (!ownerReadyAt || !partnerReadyAt) {
    revalidatePath("/dashboard");
    return { status: "waiting" };
  }

  await admin
    .from("profiles")
    .update({
      date_accepted_at: nowIso,
      reveal_owner_ready_at: null,
      reveal_partner_ready_at: null,
    })
    .eq("id", access.profileId);
  await admin
    .from("date_ideas")
    .update({ status: "revealed" })
    .eq("user_id", access.profileId)
    .eq("status", "pending");

  revalidatePath("/dashboard");
  return { status: "revealed" };
}

function isRevealAvailableForProfile(revealedAt: string | null, cadence: string): boolean {
  if (!revealedAt) return true;
  const days = CADENCE_DAYS[cadence] ?? 7;
  return Date.now() >= new Date(revealedAt).getTime() + days * 86_400_000;
}

async function notifyOtherPartner(
  admin: SupabaseClient<Database>,
  profileId: string,
  initiatingUserId: string,
  names: { partner1: string; partner2: string }
): Promise<"sent" | "skipped" | "failed"> {
  const { data: members, error: membersError } = await admin
    .from("couple_members")
    .select("user_id, role")
    .eq("profile_id", profileId);
  if (membersError) {
    console.warn(`[audit] start-date: email failed profile=${profileId} reason=members_lookup msg=${membersError.message}`);
    return "failed";
  }

  const other = members?.find((member) => member.user_id !== initiatingUserId);
  if (!other) {
    console.warn(`[audit] start-date: email skipped profile=${profileId} reason=no_other_partner`);
    return "skipped";
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(other.user_id);
  if (userError) {
    console.warn(`[audit] start-date: email failed profile=${profileId} partner=${other.user_id} reason=user_lookup msg=${userError.message}`);
    return "failed";
  }

  let recipientEmail = userData.user?.email ?? null;
  if (!recipientEmail) {
    const { data: acceptedInvite, error: inviteError } = await admin
      .from("partner_invites")
      .select("invited_email")
      .eq("profile_id", profileId)
      .eq("accepted_user_id", other.user_id)
      .not("accepted_at", "is", null)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (inviteError) {
      console.warn(`[audit] start-date: email failed profile=${profileId} partner=${other.user_id} reason=invite_lookup msg=${inviteError.message}`);
      return "failed";
    }
    recipientEmail = acceptedInvite?.invited_email ?? null;
  }

  if (!recipientEmail) {
    console.warn(`[audit] start-date: email skipped profile=${profileId} partner=${other.user_id} reason=no_email`);
    return "skipped";
  }

  const initiator = members?.find((member) => member.user_id === initiatingUserId);
  const initiatorIsOwner = initiator?.role === "owner";
  const { subject, html } = dateInitiatedEmail({
    partnerName: initiatorIsOwner ? names.partner1 : names.partner2,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipientEmail,
      subject,
      html,
    });
    if (error) {
      console.warn(`[audit] start-date: email failed profile=${profileId} partner=${other.user_id} msg=${error.message}`);
      return "failed";
    }
    console.info(`[audit] start-date: email sent profile=${profileId} partner=${other.user_id} resend_id=${data?.id ?? "unknown"}`);
    return "sent";
  } catch (error) {
    console.warn(`[audit] start-date: email failed profile=${profileId} partner=${other.user_id} msg=${error instanceof Error ? error.message : String(error)}`);
    return "failed";
  }
}
