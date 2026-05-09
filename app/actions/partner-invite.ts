"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM_ADDRESS } from "@/lib/email/resend";
import { partnerInviteEmail } from "@/lib/email/templates/partner-invite";
import {
  createInviteToken,
  getAppUrl,
  getCoupleAccess,
  hashInviteToken,
  partnerEmailSchema,
} from "@/lib/partner-invites";

type ActionResult = { error?: string; ok?: boolean; waiting?: boolean };

async function createAndSendInvite(profileId: string, inviterUserId: string, email: string) {
  const admin = createAdminClient();
  const { data: existingPartner } = await admin
    .from("couple_members")
    .select("user_id")
    .eq("profile_id", profileId)
    .eq("role", "partner")
    .maybeSingle();

  if (existingPartner) {
    return { error: "A partner is already connected." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("partner_names")
    .eq("id", profileId)
    .single();

  const token = createInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await admin
    .from("partner_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .is("accepted_at", null)
    .is("revoked_at", null);

  const { error: insertError } = await admin.from("partner_invites").insert({
    profile_id: profileId,
    inviter_user_id: inviterUserId,
    invited_email: email,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error(`[partner-invite] insert failed uid=${inviterUserId} msg=${insertError.message}`);
    return { error: "Could not create the invite. Please try again." };
  }

  const names = profile?.partner_names as { partner1?: string; partner2?: string } | null;
  const inviteUrl = `${getAppUrl()}/partner-invite?token=${encodeURIComponent(token)}`;
  const { subject, html } = partnerInviteEmail({
    inviterName: names?.partner1 ?? "Your partner",
    partnerName: names?.partner2 ?? "there",
    inviteUrl,
  });

  const { error: sendError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject,
    html,
  });

  if (sendError) {
    console.error(`[partner-invite] email failed uid=${inviterUserId} msg=${sendError.message}`);
    return { error: "Invite saved, but the email could not be sent." };
  }

  return { ok: true };
}

export async function sendPartnerInvite(email: string): Promise<ActionResult> {
  const parsed = partnerEmailSchema.safeParse(email);
  if (!parsed.success) return { error: "Enter a valid partner email." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (user.email?.toLowerCase() === parsed.data) {
    return { error: "Use your partner's email, not your own." };
  }

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);
  if (access.role !== "owner") {
    return { error: "Only the account owner can invite or replace a partner." };
  }

  const result = await createAndSendInvite(access.profileId, user.id, parsed.data);
  revalidatePath("/dashboard");
  return result;
}

export async function sendPartnerInviteForOnboarding(
  profileId: string,
  inviterUserId: string,
  rawEmail?: string | null
): Promise<ActionResult> {
  const trimmed = rawEmail?.trim();
  if (!trimmed) return { ok: true };

  const parsed = partnerEmailSchema.safeParse(trimmed);
  if (!parsed.success) return { error: "Enter a valid partner email." };

  const admin = createAdminClient();
  const { data: userData } = await admin.auth.admin.getUserById(inviterUserId);
  if (userData.user?.email?.toLowerCase() === parsed.data) {
    return { error: "Use your partner's email, not your own." };
  }

  return createAndSendInvite(profileId, inviterUserId, parsed.data);
}

export async function acceptPartnerInvite(token: string): Promise<ActionResult> {
  if (!token || token.length > 256) return { error: "Invalid invite link." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in or create an account first." };
  if (!user.email) return { error: "Your account needs an email address to accept this invite." };

  const admin = createAdminClient();
  const tokenHash = hashInviteToken(token);
  const { data: invite } = await admin
    .from("partner_invites")
    .select("id, profile_id, invited_email, expires_at, accepted_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!invite || invite.revoked_at) return { error: "This invite is no longer valid." };
  if (invite.accepted_at) return { error: "This invite has already been accepted." };
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return { error: "This invite expired. Ask your partner to send a new one." };
  }
  if (invite.invited_email.toLowerCase() !== user.email.toLowerCase()) {
    return { error: `This invite was sent to ${invite.invited_email}. Sign in with that email to accept it.` };
  }
  if (invite.profile_id === user.id) {
    return { error: "You cannot accept your own partner invite." };
  }

  const { data: existingPartner } = await admin
    .from("couple_members")
    .select("user_id")
    .eq("profile_id", invite.profile_id)
    .eq("role", "partner")
    .maybeSingle();

  if (existingPartner && existingPartner.user_id !== user.id) {
    return { error: "This couple already has a partner connected." };
  }

  const { data: otherPartnerMembership } = await admin
    .from("couple_members")
    .select("profile_id")
    .eq("user_id", user.id)
    .eq("role", "partner")
    .maybeSingle();

  if (otherPartnerMembership && otherPartnerMembership.profile_id !== invite.profile_id) {
    return { error: "This account is already connected to another partner." };
  }

  const now = new Date().toISOString();
  const { error: memberError } = await admin.from("couple_members").upsert({
    profile_id: invite.profile_id,
    user_id: user.id,
    role: "partner",
  });

  if (memberError) {
    console.error(`[partner-invite] accept member failed uid=${user.id} msg=${memberError.message}`);
    return { error: "Could not connect your account. Please try again." };
  }

  await admin
    .from("partner_invites")
    .update({ accepted_at: now, accepted_user_id: user.id })
    .eq("id", invite.id);

  revalidatePath("/dashboard");
  return { ok: true };
}
