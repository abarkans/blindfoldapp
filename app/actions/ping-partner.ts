"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";
import { checkPartnerPingRateLimit } from "@/lib/rate-limit";
import { resend, FROM_ADDRESS } from "@/lib/email/resend";
import { partnerPingEmail } from "@/lib/email/templates/partner-ping";
import { generateUnsubscribeToken } from "@/lib/email/unsubscribe-token";

const PING_ELIGIBILITY_DAYS = 7;
const PING_ELIGIBILITY_MS = PING_ELIGIBILITY_DAYS * 24 * 60 * 60 * 1000;
const PING_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function pingPartner(): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    await checkPartnerPingRateLimit(user.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Rate limit exceeded" };
  }

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { data: profile } = await admin
    .from("profiles")
    .select("date_idea, date_accepted_at, reveal_owner_ready_at, reveal_partner_ready_at, partner_ping_sent_at, partner_names, email_notifications")
    .eq("id", access.profileId)
    .single();

  if (!profile) return { error: "Profile not found" };

  // Must have an active (unaccepted) date idea
  if (!profile.date_idea) return { error: "No active date" };
  if (profile.date_accepted_at) return { error: "Date already accepted" };

  // Determine which ready_at belongs to the current user
  const myReadyAt = access.role === "owner"
    ? profile.reveal_owner_ready_at
    : profile.reveal_partner_ready_at;
  const partnerReadyAt = access.role === "owner"
    ? profile.reveal_partner_ready_at
    : profile.reveal_owner_ready_at;

  // Current user must have tapped "I'm ready"
  if (!myReadyAt) return { error: "You haven't tapped I'm ready yet" };

  // Partner must NOT have tapped "I'm ready" yet
  if (partnerReadyAt) return { error: "Partner already ready — date should be revealed" };

  // 7-day wait since current user tapped ready
  const msSinceReady = Date.now() - new Date(myReadyAt).getTime();
  if (msSinceReady < PING_ELIGIBILITY_MS) {
    const daysLeft = Math.ceil((PING_ELIGIBILITY_MS - msSinceReady) / (24 * 60 * 60 * 1000));
    return { error: `Nudge unlocks in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` };
  }

  // 24-hour cooldown between pings
  if (profile.partner_ping_sent_at) {
    const msSincePing = Date.now() - new Date(profile.partner_ping_sent_at).getTime();
    if (msSincePing < PING_COOLDOWN_MS) {
      const hoursLeft = Math.ceil((PING_COOLDOWN_MS - msSincePing) / (60 * 60 * 1000));
      return { error: `Already nudged recently. Try again in ${hoursLeft}h` };
    }
  }

  // Respect shared couple email preference
  if (!profile.email_notifications) {
    return { error: "Email notifications are turned off for this account" };
  }

  // Find partner's user_id in couple_members
  const partnerRole = access.role === "owner" ? "partner" : "owner";
  const { data: partnerMember } = await admin
    .from("couple_members")
    .select("user_id")
    .eq("profile_id", access.profileId)
    .eq("role", partnerRole)
    .maybeSingle();

  if (!partnerMember) return { error: "Partner hasn't joined yet" };

  // Get partner's email
  const { data: partnerAuth } = await admin.auth.admin.getUserById(partnerMember.user_id);
  const partnerEmail = partnerAuth?.user?.email;
  if (!partnerEmail) return { error: "Could not find partner's email" };

  // Determine who is sending (current user's name)
  const names = profile.partner_names as { partner1: string; partner2: string } | null;
  const myName = access.role === "owner"
    ? (names?.partner1 || "Your partner")
    : (names?.partner2 || "Your partner");

  // Generate unsubscribe URL for partner
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfolddate.com";
  const unsubscribeToken = generateUnsubscribeToken(partnerMember.user_id);
  const unsubscribeUrl = `${appUrl}/unsubscribe?uid=${partnerMember.user_id}&token=${unsubscribeToken}`;

  const { subject, html } = partnerPingEmail({ partnerName: myName, unsubscribeUrl });

  const { error: sendError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: partnerEmail,
    subject,
    html,
  });

  if (sendError) {
    console.error(`[ping-partner] send failed uid=${user.id} msg=${sendError.message}`);
    return { error: "Couldn't send nudge. Try again later." };
  }

  // Record timestamp
  await admin
    .from("profiles")
    .update({ partner_ping_sent_at: new Date().toISOString() })
    .eq("id", access.profileId);

  return { success: true };
}
