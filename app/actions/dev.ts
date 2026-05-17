"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";
import { completeDate } from "@/app/actions/complete-date";
import type { CompleteDateResult } from "@/lib/types";

export type DevResult = { ok: boolean; message?: string };
export type DevCompleteResult = DevResult & { completionData?: CompleteDateResult };

function devGate() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Dev actions unavailable in production");
  }
}

const STUB_DATE = {
  title: "[DEV] Mystery Rooftop Dinner",
  description: "A stub date for development testing. Ignore this content.",
  mission: "Find the best seat and order something you have never tried.",
  vibe: "Romantic & Adventurous",
  preparation: "Dress for the weather — it might be breezy.",
  conversation_starter: "What is the most spontaneous thing you have ever done?",
  duration: "2–3 hours",
  budget_range: "€30–€60",
  tags: ["rooftop", "dinner", "views"],
  location_type: "outside",
};

const STUB_TEASER = {
  vibe: "Romantic & Adventurous",
  activity_level: "Relaxed",
  price: "€30–€60",
  hook: "Something elevated, literally and figuratively",
};

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);
  return { supabase, admin, access };
}

// ── Date State ────────────────────────────────────────────────────────────────

export async function devResetDate(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  await admin
    .from("profiles")
    .update({
      date_idea: null,
      date_teaser: null,
      revealed_at: null,
      date_accepted_at: null,
      reveal_owner_ready_at: null,
      reveal_partner_ready_at: null,
      checkin_owner_at: null,
      checkin_partner_at: null,
      current_date_rerolled: false,
    })
    .eq("id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: "Date reset to initial state" };
}

export async function devSetTeaser(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  const nowIso = new Date().toISOString();
  await admin
    .from("date_ideas")
    .delete()
    .eq("user_id", access.profileId)
    .in("status", ["pending", "revealed"]);
  await admin.from("date_ideas").insert({
    user_id: access.profileId,
    idea: STUB_DATE,
    status: "pending",
    revealed_at: nowIso,
    location_type: "outside",
  });
  await admin
    .from("profiles")
    .update({
      date_idea: STUB_DATE,
      date_teaser: STUB_TEASER,
      revealed_at: nowIso,
      date_accepted_at: null,
      reveal_owner_ready_at: null,
      reveal_partner_ready_at: null,
      checkin_owner_at: null,
      checkin_partner_at: null,
      current_date_rerolled: false,
    })
    .eq("id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: "Date set to teaser state" };
}

export async function devSetRevealed(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  const nowIso = new Date().toISOString();
  const { data: profile } = await admin
    .from("profiles")
    .select("date_idea")
    .eq("id", access.profileId)
    .single();
  const idea = profile?.date_idea ?? STUB_DATE;
  await admin
    .from("date_ideas")
    .delete()
    .eq("user_id", access.profileId)
    .in("status", ["pending", "revealed"]);
  await admin.from("date_ideas").insert({
    user_id: access.profileId,
    idea,
    status: "revealed",
    revealed_at: nowIso,
    location_type: "outside",
  });
  await admin
    .from("profiles")
    .update({
      date_idea: idea,
      date_teaser: STUB_TEASER,
      revealed_at: nowIso,
      date_accepted_at: nowIso,
      reveal_owner_ready_at: null,
      reveal_partner_ready_at: null,
      checkin_owner_at: null,
      checkin_partner_at: null,
    })
    .eq("id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: "Date set to revealed/accepted state" };
}

export async function devSkipCooldown(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  const eightDaysAgo = new Date(Date.now() - 8 * 86_400_000).toISOString();
  await admin
    .from("profiles")
    .update({ revealed_at: eightDaysAgo })
    .eq("id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: "Cooldown expired (revealed_at → 8 days ago)" };
}

export async function devSetCountdown1Min(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  const { data: profile } = await admin
    .from("profiles")
    .select("cadence")
    .eq("id", access.profileId)
    .single();
  const cadenceDays: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30 };
  const days = cadenceDays[profile?.cadence ?? "weekly"] ?? 7;
  const revealedAt = new Date(Date.now() - days * 86_400_000 + 60_000).toISOString();
  await admin
    .from("profiles")
    .update({ revealed_at: revealedAt })
    .eq("id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: `Countdown set to ~1 min (cadence: ${profile?.cadence ?? "weekly"})` };
}

// ── Check-in ──────────────────────────────────────────────────────────────────

export async function devMockMyCheckin(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  const nowIso = new Date().toISOString();
  const update =
    access.role === "owner"
      ? { checkin_owner_at: nowIso }
      : { checkin_partner_at: nowIso };
  await admin.from("profiles").update(update).eq("id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: `My check-in set (role: ${access.role})` };
}

export async function devMockPartnerCheckin(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  const nowIso = new Date().toISOString();
  const update =
    access.role === "owner"
      ? { checkin_partner_at: nowIso }
      : { checkin_owner_at: nowIso };
  await admin.from("profiles").update(update).eq("id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: "Partner check-in set" };
}

export async function devMockBothCheckinAndComplete(): Promise<DevCompleteResult> {
  devGate();
  const { admin, access } = await getContext();
  const nowIso = new Date().toISOString();
  const { data: profile } = await admin
    .from("profiles")
    .select("date_idea, date_accepted_at, total_checkins")
    .eq("id", access.profileId)
    .single();
  const idea = profile?.date_idea ?? STUB_DATE;
  if (!profile?.date_accepted_at) {
    await admin
      .from("date_ideas")
      .delete()
      .eq("user_id", access.profileId)
      .in("status", ["pending", "revealed"]);
    await admin.from("date_ideas").insert({
      user_id: access.profileId,
      idea,
      status: "revealed",
      revealed_at: nowIso,
      location_type: "outside",
    });
    await admin
      .from("profiles")
      .update({ date_idea: idea, date_teaser: STUB_TEASER, revealed_at: nowIso, date_accepted_at: nowIso })
      .eq("id", access.profileId);
  } else {
    const { data: existingRevealed } = await admin
      .from("date_ideas")
      .select("id")
      .eq("user_id", access.profileId)
      .eq("status", "revealed")
      .limit(1)
      .maybeSingle();
    if (!existingRevealed) {
      await admin.from("date_ideas").insert({
        user_id: access.profileId,
        idea,
        status: "revealed",
        revealed_at: nowIso,
        location_type: "outside",
      });
    }
  }
  await admin
    .from("profiles")
    .update({ checkin_owner_at: nowIso, checkin_partner_at: nowIso })
    .eq("id", access.profileId);
  const completionData = await completeDate();
  await admin
    .from("profiles")
    .update({ total_checkins: (profile?.total_checkins ?? 0) + 1 })
    .eq("id", access.profileId);
  return { ok: true, message: "Both checked in + date completed", completionData };
}

// ── Gamification ──────────────────────────────────────────────────────────────

export async function devInstantComplete(): Promise<DevCompleteResult> {
  devGate();
  const { admin, access } = await getContext();
  const nowIso = new Date().toISOString();
  const { data: profile } = await admin
    .from("profiles")
    .select("date_idea, date_accepted_at")
    .eq("id", access.profileId)
    .single();
  const idea = profile?.date_idea ?? STUB_DATE;
  if (!profile?.date_accepted_at) {
    await admin
      .from("profiles")
      .update({ date_idea: idea, revealed_at: nowIso, date_accepted_at: nowIso })
      .eq("id", access.profileId);
  }
  const { data: existingRevealed } = await admin
    .from("date_ideas")
    .select("id")
    .eq("user_id", access.profileId)
    .eq("status", "revealed")
    .limit(1)
    .maybeSingle();
  if (!existingRevealed) {
    await admin
      .from("date_ideas")
      .delete()
      .eq("user_id", access.profileId)
      .eq("status", "pending");
    await admin.from("date_ideas").insert({
      user_id: access.profileId,
      idea,
      status: "revealed",
      revealed_at: nowIso,
      location_type: "outside",
    });
  }
  const completionData = await completeDate();
  return { ok: true, message: "Date completed instantly", completionData };
}

export async function devSetCompletionCount(count: number): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  await admin
    .from("profiles")
    .update({ dates_completed_count: count, total_xp: count * 100 })
    .eq("id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: `Set to ${count} completions (${count * 100} XP)` };
}

export async function devResetGamification(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  await admin
    .from("profiles")
    .update({ dates_completed_count: 0, total_xp: 0, total_checkins: 0 })
    .eq("id", access.profileId);
  await admin.from("user_badges").delete().eq("user_id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: "XP, count, checkins, and badges reset" };
}

// ── Photos ────────────────────────────────────────────────────────────────────

export async function devMockBothCheckin(): Promise<DevResult> {
  devGate();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };
  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);
  const nowIso = new Date().toISOString();

  const { data: profile } = await admin
    .from("profiles")
    .select("date_idea, date_accepted_at")
    .eq("id", access.profileId)
    .single();

  const idea = profile?.date_idea ?? STUB_DATE;

  if (!profile?.date_accepted_at) {
    await admin.from("date_ideas").delete()
      .eq("user_id", access.profileId)
      .in("status", ["pending", "revealed"]);
    await admin.from("date_ideas").insert({
      user_id: access.profileId,
      idea,
      status: "revealed",
      revealed_at: nowIso,
      location_type: "outside",
    });
    await admin.from("profiles").update({
      date_idea: idea,
      date_teaser: STUB_TEASER,
      revealed_at: nowIso,
      date_accepted_at: nowIso,
    }).eq("id", access.profileId);
  } else {
    const { data: existingRevealed } = await admin
      .from("date_ideas")
      .select("id")
      .eq("user_id", access.profileId)
      .eq("status", "revealed")
      .limit(1)
      .maybeSingle();
    if (!existingRevealed) {
      await admin.from("date_ideas").insert({
        user_id: access.profileId,
        idea,
        status: "revealed",
        revealed_at: nowIso,
        location_type: "outside",
      });
    }
  }

  await admin.from("profiles").update({
    checkin_owner_at: nowIso,
    checkin_partner_at: nowIso,
  }).eq("id", access.profileId);

  revalidatePath("/dashboard");
  return { ok: true, message: "Both checked in → photo challenge visible" };
}

export async function devMockPhotoForHistory(): Promise<DevResult> {
  devGate();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };
  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);
  const nowIso = new Date().toISOString();

  let { data: completedDate } = await admin
    .from("date_ideas")
    .select("id")
    .eq("user_id", access.profileId)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();

  if (!completedDate) {
    const { data: inserted } = await admin.from("date_ideas").insert({
      user_id: access.profileId,
      idea: STUB_DATE,
      status: "completed",
      revealed_at: nowIso,
      location_type: "outside",
    }).select("id").single();
    completedDate = inserted;
  }

  if (!completedDate) return { ok: false, message: "Could not find or create completed date" };

  const { error } = await admin.from("date_photos").upsert({
    date_idea_id: completedDate.id,
    profile_id: access.profileId,
    uploader_user_id: user.id,
    r2_key: "photos/dev/placeholder.jpg",
  }, { onConflict: "date_idea_id,uploader_user_id" });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  return { ok: true, message: "Fake photo added to history tab" };
}

export async function devClearPhotos(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  await admin.from("date_photos").delete().eq("profile_id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: "All photos cleared" };
}

export async function devFullReset(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();

  await admin.from("profiles").update({
    date_idea: null,
    date_teaser: null,
    revealed_at: null,
    date_accepted_at: null,
    reveal_owner_ready_at: null,
    reveal_partner_ready_at: null,
    checkin_owner_at: null,
    checkin_partner_at: null,
    current_date_rerolled: false,
    dates_completed_count: 0,
    total_xp: 0,
    total_checkins: 0,
    total_rerolls_used: 0,
  }).eq("id", access.profileId);

  await admin.from("date_ideas").delete().eq("user_id", access.profileId);
  await admin.from("date_photos").delete().eq("profile_id", access.profileId);
  await admin.from("user_badges").delete().eq("user_id", access.profileId);

  revalidatePath("/dashboard");
  return { ok: true, message: "Profile fully reset (preferences kept)" };
}

// ── Plan & Limits ─────────────────────────────────────────────────────────────

export async function devTogglePlan(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  const { data: profile } = await admin
    .from("profiles")
    .select("plan_type")
    .eq("id", access.profileId)
    .single();
  const newPlan = profile?.plan_type === "subscription" ? "free" : "subscription";
  await admin
    .from("profiles")
    .update({
      plan_type: newPlan,
      ...(newPlan === "free" ? { cadence: "monthly" } : {}),
    })
    .eq("id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: `Plan → ${newPlan}` };
}

export async function devResetRerolls(): Promise<DevResult> {
  devGate();
  const { admin, access } = await getContext();
  await admin
    .from("profiles")
    .update({ current_date_rerolled: false, total_rerolls_used: 0 })
    .eq("id", access.profileId);
  revalidatePath("/dashboard");
  return { ok: true, message: "Rerolls reset" };
}
