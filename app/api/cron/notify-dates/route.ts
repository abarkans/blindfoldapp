import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM_ADDRESS } from "@/lib/email/resend";
import { dateReadyEmail } from "@/lib/email/templates/date-ready";
import { firstDateReminderEmail } from "@/lib/email/templates/first-date-reminder";
import { reengagementEmail } from "@/lib/email/templates/reengagement";
import { generateUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { safeLogValue } from "@/lib/log";
import { expireProfileDate } from "@/lib/date-expiry";

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

// --- R2 orphan reaper -------------------------------------------------------
// Objects older than this with no matching date_photos row are abandoned
// uploads. A legitimate upload gets its row seconds later, so 24h is generous.
const R2_ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;
// Bound work per cron run so a large bucket can't blow the function timeout.
const R2_MAX_PAGES_PER_RUN = 50;      // 50 × 1000 keys = 50k objects scanned
const R2_DB_LOOKUP_CHUNK = 100;       // keeps the PostgREST .in() URL short
const R2_DELETE_CHUNK = 1000;         // DeleteObjects API limit

async function reapOrphanedR2Objects(
  supabase: ReturnType<typeof createAdminClient>
): Promise<void> {
  // Two conditions, both required. VERCEL_ENV is set by the platform and cannot
  // be faked locally, so deletion is impossible outside a production deployment.
  //
  // This matters because dev and production share the R2 bucket
  // (R2_BUCKET=blindfolddate-photos in both) but use SEPARATE databases. A local
  // run would list production's objects, look them up in the dev date_photos
  // table, find nothing, and delete every production photo. Gating on the env
  // var alone left that one setting away from happening.
  const isProdDeployment = process.env.VERCEL_ENV === "production";
  const enabled = isProdDeployment && process.env.R2_REAP_ENABLED === "true";

  if (!isProdDeployment && process.env.R2_REAP_ENABLED === "true") {
    console.warn(
      "[cron/notify-dates] r2 reap: R2_REAP_ENABLED=true but VERCEL_ENV is not " +
      `'production' (${process.env.VERCEL_ENV ?? "unset"}) — forcing dry-run. ` +
      "Deleting from a non-production deployment would purge production objects, " +
      "because the bucket is shared but the database is not."
    );
  }
  const cutoff = Date.now() - R2_ORPHAN_AGE_MS;
  const orphans: string[] = [];
  let scanned = 0;
  let pages = 0;
  let token: string | undefined;
  let truncated = false;

  try {
    do {
      const page = await r2.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET,
          Prefix: "photos/",
          ContinuationToken: token,
        })
      );
      pages++;
      scanned += page.Contents?.length ?? 0;

      const staleKeys = (page.Contents ?? [])
        .filter((o) => o.Key && o.LastModified && o.LastModified.getTime() < cutoff)
        .map((o) => o.Key as string);

      // Chunked lookup. FAIL CLOSED: if any lookup errors we abort the whole
      // run rather than treating an empty result as "these are all orphans" —
      // that mistake would delete every real photo in the bucket.
      for (let i = 0; i < staleKeys.length; i += R2_DB_LOOKUP_CHUNK) {
        const chunk = staleKeys.slice(i, i + R2_DB_LOOKUP_CHUNK);
        const { data: known, error: lookupErr } = await supabase
          .from("date_photos")
          .select("r2_key")
          .in("r2_key", chunk);

        if (lookupErr) {
          console.error(
            `[cron/notify-dates] r2 reap ABORTED (db lookup failed, nothing deleted): ${safeLogValue(lookupErr.message)}`
          );
          return;
        }

        const knownSet = new Set((known ?? []).map((r) => r.r2_key));
        for (const k of chunk) if (!knownSet.has(k)) orphans.push(k);
      }

      token = page.IsTruncated ? page.NextContinuationToken : undefined;
      if (token && pages >= R2_MAX_PAGES_PER_RUN) {
        truncated = true;
        break;
      }
    } while (token);

    if (!enabled) {
      console.info(
        `[cron/notify-dates] r2 reap DRY-RUN scanned=${scanned} orphans=${orphans.length} ` +
        `truncated=${truncated} (set R2_REAP_ENABLED=true to delete) sample=${orphans.slice(0, 5).join(",")}`
      );
      return;
    }

    let deleted = 0;
    for (let i = 0; i < orphans.length; i += R2_DELETE_CHUNK) {
      const batch = orphans.slice(i, i + R2_DELETE_CHUNK).map((Key) => ({ Key }));
      await r2.send(
        new DeleteObjectsCommand({ Bucket: R2_BUCKET, Delete: { Objects: batch } })
      );
      deleted += batch.length;
    }

    console.info(
      `[cron/notify-dates] r2 reap scanned=${scanned} deleted=${deleted} truncated=${truncated}`
    );
  } catch (err) {
    // Non-fatal for the cron run — the reaper is a cost control, not a
    // correctness requirement, and it will retry tomorrow.
    console.warn(
      `[cron/notify-dates] r2 reap failed after scanning ${scanned}: ` +
      `${safeLogValue(err instanceof Error ? err.message : String(err))}`
    );
  }
}

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
    console.error("[cron/notify-dates] query error:", safeLogValue(error.message));
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const now = Date.now();
  let sent = 0;
  const errors: string[] = [];
  // Tracks ids that got a date-ready send this run so the reengagement
  // pass below (same run, stale query snapshot) doesn't also email them —
  // both *_sent_at flags are reset together on reveal, so a lapsed user
  // can satisfy both queries at once.
  const notifiedThisRun = new Set<string>();

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
      errors.push(`uid=${profile.id} reason=${safeLogValue(sendError.message)}`);
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
          errors.push(`uid=${profile.id} partner=${partnerMember.user_id} reason=${safeLogValue(partnerSendError.message)}`);
        }
      }
    }

    // Mark notified after both send attempts.
    await supabase
      .from("profiles")
      .update({ notification_sent_at: new Date().toISOString() })
      .eq("id", profile.id as string);

    notifiedThisRun.add(profile.id as string);
    sent++;
  }

  console.info(`[cron/notify-dates] sent=${sent} errors=${errors.length}`);
  if (errors.length) console.warn("[cron/notify-dates] errors:", errors);

  // --- Auto-expire dates whose check-in deadline has passed. Client-side the
  //     countdown fires expireCurrentDateIfDue() itself when it hits zero, but
  //     that only runs while someone actually has the dashboard open — this is
  //     the safety net for when nobody does.
  const { data: expirableProfiles, error: expirableError } = await supabase
    .from("profiles")
    .select("id, plan_type, cadence, revealed_at, interests, checkin_owner_at, checkin_partner_at")
    .not("date_accepted_at", "is", null)
    .not("date_idea", "is", null)
    .not("revealed_at", "is", null);

  if (expirableError) {
    console.error("[cron/notify-dates] expirable query error:", safeLogValue(expirableError.message));
  } else {
    let expiredCount = 0;
    for (const p of expirableProfiles ?? []) {
      const days = CADENCE_DAYS[(p.cadence as string) ?? "monthly"] ?? 30;
      const deadline = new Date(p.revealed_at as string).getTime() + days * 24 * 60 * 60 * 1000;
      if (now < deadline) continue;
      const didExpire = await expireProfileDate(supabase, p.id as string, {
        plan_type: p.plan_type as string,
        interests: p.interests as string[] | null,
        checkin_owner_at: p.checkin_owner_at as string | null,
        checkin_partner_at: p.checkin_partner_at as string | null,
      });
      if (didExpire) expiredCount++;
    }
    console.info(`[cron/notify-dates] auto-expired=${expiredCount}`);
  }

  // --- First-date reminder: users whose date was generated 5+ days ago but never
  //     completed. Date is already revealed (auto-generated at onboarding); this
  //     nudges them to actually go do it. Sent once per user.
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  const fiveDaysAgo = new Date(now - FIVE_DAYS_MS).toISOString();

  const { data: reminderProfiles, error: reminderError } = await supabase
    .from("profiles")
    .select("id, partner_names, revealed_at, dates_completed_count")
    .eq("onboarding_complete", true)
    .is("reminder_sent_at", null)
    .eq("email_notifications", true)
    .eq("dates_completed_count", 0)
    .not("revealed_at", "is", null)
    .lte("revealed_at", fiveDaysAgo);

  if (reminderError) {
    console.error("[cron/notify-dates] reminder query error:", safeLogValue(reminderError.message));
  } else {
    let reminderSent = 0;
    const reminderErrors: string[] = [];

    for (const profile of reminderProfiles ?? []) {
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(profile.id as string);

      if (userError || !userData?.user?.email) {
        reminderErrors.push(`uid=${profile.id} reason=no_email`);
        continue;
      }

      const names = profile.partner_names as { partner1: string; partner2?: string } | null;
      const partner1 = names?.partner1 ?? "there";
      const partner2 = names?.partner2; // nullable — template handles solo vs couple display

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfoldapp.vercel.app";
      const unsubscribeToken = generateUnsubscribeToken(profile.id as string);
      const unsubscribeUrl = `${appUrl}/unsubscribe?uid=${encodeURIComponent(profile.id as string)}&token=${unsubscribeToken}`;
      const { subject, html } = firstDateReminderEmail({ partner1, partner2, unsubscribeUrl });

      const { error: sendError } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: userData.user.email,
        subject,
        html,
      });

      if (sendError) {
        reminderErrors.push(`uid=${profile.id} reason=${safeLogValue(sendError.message)}`);
        continue;
      }

      // Send to partner if linked
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
          reminderErrors.push(`uid=${profile.id} partner=${partnerMember.user_id} reason=partner_no_email`);
        } else {
          const partnerUnsubToken = generateUnsubscribeToken(partnerMember.user_id);
          const partnerUnsubUrl = `${appUrl}/unsubscribe?uid=${encodeURIComponent(partnerMember.user_id)}&token=${partnerUnsubToken}`;
          const { subject: ps, html: ph } = firstDateReminderEmail({
            partner1,
            partner2,
            unsubscribeUrl: partnerUnsubUrl,
          });
          const { error: partnerSendError } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: partnerAuth.user.email,
            subject: ps,
            html: ph,
          });
          if (partnerSendError) {
            reminderErrors.push(`uid=${profile.id} partner=${partnerMember.user_id} reason=${safeLogValue(partnerSendError.message)}`);
          }
        }
      }

      await supabase.from("profiles").update({ reminder_sent_at: new Date().toISOString() }).eq("id", profile.id as string);

      reminderSent++;
    }

    console.info(`[cron/notify-dates] reminder_sent=${reminderSent} reminder_errors=${reminderErrors.length}`);
    if (reminderErrors.length) console.warn("[cron/notify-dates] reminder errors:", reminderErrors);
  }

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

  // Reap abandoned R2 uploads. /api/photo/presign issues a unique key per call
  // (Date.now() suffix); if the client never calls savePhoto() no date_photos
  // row is ever created, nothing in the app references the object, and it would
  // otherwise sit in the bucket forever. Unmetered presigns are therefore an
  // unbounded storage-cost vector — this is the bound.
  //
  // Set R2_REAP_ENABLED=true to actually delete. Until then it logs what it
  // WOULD delete so the matching logic can be verified against real data
  // before anything is destroyed.
  await reapOrphanedR2Objects(supabase);

  // --- Re-engagement: users who had at least one date but have been inactive
  //     for 30+ days (revealed_at is older than 30 days). Sent once per lapse;
  //     reengagement_sent_at is reset to NULL in reveal.ts when they come back.
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = new Date(now - THIRTY_DAYS_MS).toISOString();

  const { data: reengageProfiles, error: reengageError } = await supabase
    .from("profiles")
    .select("id, partner_names, revealed_at")
    .eq("onboarding_complete", true)
    .eq("email_notifications", true)
    .is("reengagement_sent_at", null)
    .not("revealed_at", "is", null)
    .lte("revealed_at", thirtyDaysAgo);

  if (reengageError) {
    console.error("[cron/notify-dates] reengagement query error:", safeLogValue(reengageError.message));
  } else {
    let reengageSent = 0;
    const reengageErrors: string[] = [];

    for (const profile of reengageProfiles ?? []) {
      // Already got a date-ready email this run — don't double-send.
      if (notifiedThisRun.has(profile.id as string)) continue;

      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(profile.id as string);

      if (userError || !userData?.user?.email) {
        reengageErrors.push(`uid=${profile.id} reason=no_email`);
        continue;
      }

      const names = profile.partner_names as { partner1: string; partner2?: string } | null;
      const partner1 = names?.partner1 ?? "there";
      const partner2 = names?.partner2; // nullable — template handles solo vs couple display

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfoldapp.vercel.app";
      const unsubscribeToken = generateUnsubscribeToken(profile.id as string);
      const unsubscribeUrl = `${appUrl}/unsubscribe?uid=${encodeURIComponent(profile.id as string)}&token=${unsubscribeToken}`;
      const { subject, html } = reengagementEmail({ partner1, partner2, unsubscribeUrl });

      const { error: sendError } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: userData.user.email,
        subject,
        html,
      });

      if (sendError) {
        reengageErrors.push(`uid=${profile.id} reason=${safeLogValue(sendError.message)}`);
        continue;
      }

      // Send to partner if linked
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
          reengageErrors.push(`uid=${profile.id} partner=${partnerMember.user_id} reason=partner_no_email`);
        } else {
          const partnerUnsubToken = generateUnsubscribeToken(partnerMember.user_id);
          const partnerUnsubUrl = `${appUrl}/unsubscribe?uid=${encodeURIComponent(partnerMember.user_id)}&token=${partnerUnsubToken}`;
          const { subject: ps, html: ph } = reengagementEmail({
            partner1,
            partner2,
            unsubscribeUrl: partnerUnsubUrl,
          });
          const { error: partnerSendError } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: partnerAuth.user.email,
            subject: ps,
            html: ph,
          });
          if (partnerSendError) {
            reengageErrors.push(`uid=${profile.id} partner=${partnerMember.user_id} reason=${safeLogValue(partnerSendError.message)}`);
          }
        }
      }

      await supabase
        .from("profiles")
        .update({ reengagement_sent_at: new Date().toISOString() })
        .eq("id", profile.id as string);

      reengageSent++;
    }

    console.info(`[cron/notify-dates] reengagement_sent=${reengageSent} reengagement_errors=${reengageErrors.length}`);
    if (reengageErrors.length) console.warn("[cron/notify-dates] reengagement errors:", reengageErrors);
  }

  return NextResponse.json({ sent, errors });
}
