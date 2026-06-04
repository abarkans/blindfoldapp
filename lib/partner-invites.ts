import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

export type CoupleRole = "owner" | "partner";

export interface CoupleAccess {
  profileId: string;
  role: CoupleRole;
}

export interface PartnerInviteStatus {
  state: "none" | "pending" | "expired" | "accepted";
  invitedEmail: string | null;
  ownerEmail: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
}

export const partnerEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email")
  .max(254, "Email is too long")
  .transform((email) => email.toLowerCase());

export function createInviteToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getCoupleAccess(
  admin: SupabaseClient<Database>,
  userId: string
): Promise<CoupleAccess> {
  const { data: partnerMembership, error: partnerError } = await admin
    .from("couple_members")
    .select("profile_id, role")
    .eq("user_id", userId)
    .eq("role", "partner")
    .maybeSingle();

  if (partnerError) {
    console.warn(`[couple-access] partner lookup failed uid=${userId} msg=${partnerError.message}`);
  } else if (partnerMembership) {
    return {
      profileId: partnerMembership.profile_id,
      role: partnerMembership.role as CoupleRole,
    };
  }

  const { data: ownerMembership, error: ownerError } = await admin
    .from("couple_members")
    .select("profile_id, role")
    .eq("user_id", userId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (ownerError) {
    console.warn(`[couple-access] owner lookup failed uid=${userId} msg=${ownerError.message}`);
  } else if (ownerMembership) {
    return {
      profileId: ownerMembership.profile_id,
      role: ownerMembership.role as CoupleRole,
    };
  }

  await admin
    .from("couple_members")
    .upsert({ profile_id: userId, user_id: userId, role: "owner" });

  return { profileId: userId, role: "owner" };
}

export async function getPartnerInviteStatus(
  admin: SupabaseClient<Database>,
  profileId: string
): Promise<PartnerInviteStatus> {
  const [{ data: member }, ownerAuthResult] = await Promise.all([
    admin
      .from("couple_members")
      .select("created_at")
      .eq("profile_id", profileId)
      .eq("role", "partner")
      .maybeSingle(),
    admin.auth.admin.getUserById(profileId),
  ]);

  const ownerEmail = ownerAuthResult.data?.user?.email ?? null;

  if (member) {
    const { data: acceptedInvite } = await admin
      .from("partner_invites")
      .select("invited_email, expires_at, accepted_at")
      .eq("profile_id", profileId)
      .not("accepted_at", "is", null)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      state: "accepted",
      invitedEmail: acceptedInvite?.invited_email ?? null,
      ownerEmail,
      expiresAt: acceptedInvite?.expires_at ?? null,
      acceptedAt: acceptedInvite?.accepted_at ?? member.created_at,
    };
  }

  const { data: invite } = await admin
    .from("partner_invites")
    .select("invited_email, expires_at, accepted_at, revoked_at")
    .eq("profile_id", profileId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!invite) {
    return { state: "none", invitedEmail: null, ownerEmail, expiresAt: null, acceptedAt: null };
  }

  const expired = new Date(invite.expires_at).getTime() <= Date.now();
  return {
    state: expired ? "expired" : "pending",
    invitedEmail: invite.invited_email,
    ownerEmail,
    expiresAt: invite.expires_at,
    acceptedAt: null,
  };
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
