import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM_ADDRESS } from "@/lib/email/resend";
import { dateReadyEmail } from "@/lib/email/templates/date-ready";
import { generateUnsubscribeToken } from "@/lib/email/unsubscribe-token";

// Constant-time comparison so the secret can't be recovered byte-by-byte
// via response-time side channels. Different lengths short-circuit to false
// without leaking length info beyond a single boolean.
function safeBearerEquals(authHeader: string | null, expected: string): boolean {
  if (!authHeader) return false;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(`Bearer ${expected}`);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Cadence → cooldown in days (mirrors reveal.ts)
const CADENCE_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

export async function GET(request: Request) {
  // Verify the request comes from Vercel Cron (or an authorised caller)
  const expected = process.env.CRON_SECRET;
  if (!expected || !safeBearerEquals(request.headers.get("authorization"), expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all profiles that have completed at least one date
  // (revealed_at is set) and haven't been notified for the current cycle.
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, partner_names, cadence, revealed_at, notification_sent_at")
    .not("revealed_at", "is", null)
    .is("notification_sent_at", null)
    .eq("email_notifications", true);

  if (error) {
    console.error("[cron/notify-dates] query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const now = Date.now();
  let sent = 0;
  const errors: string[] = [];

  for (const profile of profiles) {
    const cadenceDays = CADENCE_DAYS[profile.cadence ?? "weekly"] ?? 7;
    const revealedAt = new Date(profile.revealed_at as string).getTime();
    const nextAvailable = revealedAt + cadenceDays * 24 * 60 * 60 * 1000;

    // Not ready yet — skip
    if (now < nextAvailable) continue;

    // Resolve the user's email from auth.users via the admin API
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(profile.id as string);

    if (userError || !userData?.user?.email) {
      errors.push(`uid=${profile.id} reason=no_email`);
      continue;
    }

    const names = profile.partner_names as { partner1: string; partner2: string } | null;
    const partner1 = names?.partner1 ?? "there";
    const partner2 = names?.partner2 ?? "your partner";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfoldapp.vercel.app";
    const unsubscribeToken = generateUnsubscribeToken(profile.id as string);
    const unsubscribeUrl = `${appUrl}/unsubscribe?uid=${encodeURIComponent(profile.id as string)}&token=${unsubscribeToken}`;
    const { subject, html } = dateReadyEmail({ partner1, partner2, unsubscribeUrl });

    const { error: sendError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: userData.user.email,
      subject,
      html,
    });

    if (sendError) {
      errors.push(`uid=${profile.id} reason=${sendError.message}`);
      continue;
    }

    // Attempt partner send BEFORE marking notified so that a partner-send
    // failure doesn't silently lock the couple out of future notifications.
    // If partner send fails the cycle is still marked notified (to prevent
    // owner duplicates on the next run) and the failure is logged for review.
    const { data: partnerMember } = await supabase
      .from("couple_members")
      .select("user_id")
      .eq("profile_id", profile.id as string)
      .eq("role", "partner")
      .maybeSingle();

    if (partnerMember) {
      const { data: partnerAuth, error: partnerAuthError } =
        await supabase.auth.admin.getUserById(partnerMember.user_id);

      if (partnerAuthError || !partnerAuth?.user?.email) {
        errors.push(`uid=${profile.id} partner=${partnerMember.user_id} reason=partner_no_email`);
      } else {
        const partnerUnsubscribeToken = generateUnsubscribeToken(partnerMember.user_id);
        const partnerUnsubscribeUrl = `${appUrl}/unsubscribe?uid=${encodeURIComponent(partnerMember.user_id)}&token=${partnerUnsubscribeToken}`;
        const { subject: partnerSubject, html: partnerHtml } = dateReadyEmail({
          partner1,
          partner2,
          unsubscribeUrl: partnerUnsubscribeUrl,
        });

        const { error: partnerSendError } = await resend.emails.send({
          from: FROM_ADDRESS,
          to: partnerAuth.user.email,
          subject: partnerSubject,
          html: partnerHtml,
        });

        if (partnerSendError) {
          errors.push(`uid=${profile.id} partner=${partnerMember.user_id} reason=${partnerSendError.message}`);
        }
      }
    }

    // Mark notified after both send attempts.
    await supabase
      .from("profiles")
      .update({ notification_sent_at: new Date().toISOString() })
      .eq("id", profile.id as string);

    sent++;
  }

  console.info(`[cron/notify-dates] sent=${sent} errors=${errors.length}`);
  if (errors.length) console.warn("[cron/notify-dates] errors:", errors);

  // Piggyback rate-limit cleanup on the daily cron so the rate_limits
  // table doesn't grow unbounded. Failure is non-fatal for the cron run.
  const { data: deletedRows, error: cleanupErr } = await supabase.rpc("cleanup_rate_limits");
  if (cleanupErr) {
    console.warn(`[cron/notify-dates] rate_limits cleanup failed: ${cleanupErr.message}`);
  } else {
    console.info(`[cron/notify-dates] rate_limits cleanup deleted=${deletedRows ?? 0}`);
  }

  // Same piggyback for expired deletion holds.
  const { data: deletedHolds, error: holdsCleanupErr } = await supabase.rpc("cleanup_deletion_holds");
  if (holdsCleanupErr) {
    console.warn(`[cron/notify-dates] deletion_holds cleanup failed: ${holdsCleanupErr.message}`);
  } else {
    console.info(`[cron/notify-dates] deletion_holds cleanup deleted=${deletedHolds ?? 0}`);
  }

  // Same piggyback for expired account-deletion confirmation tokens.
  const { data: deletedTokens, error: tokensCleanupErr } = await supabase.rpc("cleanup_account_deletion_tokens");
  if (tokensCleanupErr) {
    console.warn(`[cron/notify-dates] account_deletion_tokens cleanup failed: ${tokensCleanupErr.message}`);
  } else {
    console.info(`[cron/notify-dates] account_deletion_tokens cleanup deleted=${deletedTokens ?? 0}`);
  }

  // Prune old processed Stripe events (replay window is ~72h; keep 400 days).
  const { data: deletedEvents, error: eventsCleanupErr } = await supabase.rpc("cleanup_processed_stripe_events");
  if (eventsCleanupErr) {
    console.warn(`[cron/notify-dates] processed_stripe_events cleanup failed: ${eventsCleanupErr.message}`);
  } else {
    console.info(`[cron/notify-dates] processed_stripe_events cleanup deleted=${deletedEvents ?? 0}`);
  }

  // Prune expired/revoked partner invites (accepted invites are kept).
  const { data: deletedInvites, error: invitesCleanupErr } = await supabase.rpc("cleanup_partner_invites");
  if (invitesCleanupErr) {
    console.warn(`[cron/notify-dates] partner_invites cleanup failed: ${invitesCleanupErr.message}`);
  } else {
    console.info(`[cron/notify-dates] partner_invites cleanup deleted=${deletedInvites ?? 0}`);
  }

  return NextResponse.json({ sent, errors });
}
