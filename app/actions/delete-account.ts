"use server";

import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hashEmail, isCooldownActive, cooldownExpiry } from "@/lib/deletion-hold";
import { resend, FROM_ADDRESS } from "@/lib/email/resend";
import { deleteConfirmationEmail } from "@/lib/email/templates/delete-confirmation";
import { safeLogValue } from "@/lib/log";
import { checkDeletionRequestRateLimit } from "@/lib/rate-limit";

// Short TTL on an irreversible action. The legitimate flow is
// "open email → click link" which fits comfortably in 5 min; anything
// longer mostly extends the window for a stolen link to be replayed.
const TOKEN_TTL_MINUTES = 5;

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Pull the originating IP from the standard forwarded headers. Returns
// null if no header is present so the caller can decide whether to
// store the bind value (we still issue the token; we just won't enforce
// IP match if we never captured one).
async function requestBindings(): Promise<{ ip: string | null; ua: string | null }> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  const ip = xff
    ? xff.split(",")[0].trim() || null
    : (h.get("x-real-ip")?.trim() || null);
  const ua = h.get("user-agent")?.slice(0, 500) || null;
  return { ip, ua };
}

// Compare two IPv4 addresses by their /24 prefix. Mobile carrier NAT
// and consumer ISPs often shift the last octet between requests; a /24
// match keeps the bind useful without over-rejecting legitimate users.
// IPv6 / non-dotted values fall back to exact compare.
function ipMatchesLoose(a: string, b: string): boolean {
  if (a === b) return true;
  const av4 = a.split(".");
  const bv4 = b.split(".");
  if (av4.length !== 4 || bv4.length !== 4) return false;
  return av4[0] === bv4[0] && av4[1] === bv4[1] && av4[2] === bv4[2];
}

/**
 * Step 1 of account deletion: issue a one-time confirmation token and
 * email it to the user. Replaces any prior pending token for the same
 * user so an issued-but-unused link is invalidated as soon as a new one
 * is requested.
 *
 * Returns the email it was sent to so the UI can render a confirmation
 * screen. Throws on any failure — caller renders a generic error state.
 */
export async function requestAccountDeletion(): Promise<{ email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");
  if (!user.email) throw new Error("Account has no email on file");

  // Per-user limiter (3/hr fail-closed). Stops a compromised session from
  // spamming the user's inbox with deletion confirmations and bounds spend
  // on transactional email if the attacker keeps re-triggering.
  await checkDeletionRequestRateLimit(user.id);

  const admin = createAdminClient();
  const { ip: requestIp, ua: userAgent } = await requestBindings();

  // Replace any prior pending token for this user. Keeps the table free
  // of accumulated unsent tokens and ensures a fresh link supersedes
  // anything that may have leaked.
  await admin.from("account_deletion_tokens").delete().eq("user_id", user.id);

  const plaintext = randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(plaintext);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);

  const { error: insertErr } = await admin
    .from("account_deletion_tokens")
    .insert({
      token_hash: tokenHash,
      user_id: user.id,
      expires_at: expiresAt.toISOString(),
      request_ip: requestIp,
      user_agent: userAgent,
    });

  if (insertErr) {
    console.error(`[audit] delete-request: insert failed uid=${safeLogValue(user.id)} msg=${safeLogValue(insertErr.message)}`);
    throw new Error("Could not start deletion. Please try again.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfolddate.com";
  const confirmUrl = `${appUrl}/account/confirm-delete?t=${plaintext}`;
  const { subject, html } = deleteConfirmationEmail({
    confirmUrl,
    expiresInMinutes: TOKEN_TTL_MINUTES,
  });

  const { error: sendErr } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: user.email,
    subject,
    html,
  });

  if (sendErr) {
    // Roll back the token on send failure so we don't leave a row that
    // matches no real email. Best-effort; a stale row will be cleaned up
    // by cleanup_account_deletion_tokens() within 24h regardless.
    await admin.from("account_deletion_tokens").delete().eq("token_hash", tokenHash);
    console.error(`[audit] delete-request: email failed uid=${safeLogValue(user.id)} msg=${safeLogValue(sendErr.message)}`);
    throw new Error("Could not send confirmation email. Please try again.");
  }

  console.info(`[audit] delete-request: token issued uid=${safeLogValue(user.id)}`);
  return { email: user.email };
}

/**
 * Step 2 of account deletion: caller is the page handling the email
 * link. Validates the plaintext token, verifies it belongs to the
 * currently authenticated user, and runs the irreversible delete.
 *
 * The token is consumed (row deleted) before the auth user is removed
 * so a replay racing against this call cannot succeed even if the
 * delete itself is slow.
 */
export async function confirmAccountDeletion(plaintextToken: string): Promise<void> {
  if (!plaintextToken || typeof plaintextToken !== "string" || plaintextToken.length < 32) {
    throw new Error("Invalid confirmation link");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const tokenHash = sha256Hex(plaintextToken);

  const { data: row } = await admin
    .from("account_deletion_tokens")
    .select("user_id, expires_at, request_ip, user_agent")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!row) {
    console.warn(`[audit] delete-confirm: unknown token uid=${safeLogValue(user.id)}`);
    throw new Error("Confirmation link is invalid or already used");
  }

  if (row.user_id !== user.id) {
    // Token was issued for a different account. Do not delete it — the
    // legitimate owner may still need to use it. Just reject.
    console.warn(`[audit] delete-confirm: cross-user uid=${safeLogValue(user.id)} token_uid=${safeLogValue(row.user_id)}`);
    throw new Error("Confirmation link is invalid");
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await admin.from("account_deletion_tokens").delete().eq("token_hash", tokenHash);
    console.warn(`[audit] delete-confirm: expired token uid=${safeLogValue(user.id)}`);
    throw new Error("Confirmation link has expired. Please request a new one.");
  }

  // IP/UA bind: only enforce when both sides have a value. If we never
  // captured one at request time (proxy stripped header) we fall through
  // to the next check rather than locking the user out of their own
  // account. Mismatches are logged but do NOT consume the token — the
  // legitimate owner may still complete from the original device.
  const { ip: confirmIp, ua: confirmUa } = await requestBindings();
  if (row.request_ip && confirmIp && !ipMatchesLoose(row.request_ip, confirmIp)) {
    console.warn(`[audit] delete-confirm: ip mismatch uid=${safeLogValue(user.id)}`);
    throw new Error("Confirmation must be completed from the same network. Please request a new link.");
  }
  if (row.user_agent && confirmUa && row.user_agent !== confirmUa) {
    console.warn(`[audit] delete-confirm: ua mismatch uid=${safeLogValue(user.id)}`);
    throw new Error("Confirmation must be completed from the same browser. Please request a new link.");
  }

  // Consume the token first so concurrent replays cannot pass the lookup
  // above. If anything below fails we still treat the token as spent —
  // the user can request a new one.
  await admin.from("account_deletion_tokens").delete().eq("token_hash", tokenHash);

  // Persist a deletion hold if the user is mid-cooldown so they can't bypass
  // the reveal cadence by deleting and re-registering with the same email.
  if (user.email) {
    const { data: profile } = await admin
      .from("profiles")
      .select("revealed_at, cadence")
      .eq("id", user.id)
      .single();

    if (profile?.revealed_at && profile.cadence && isCooldownActive(profile.revealed_at, profile.cadence)) {
      await admin.from("deletion_holds").upsert({
        id_hash: hashEmail(user.email),
        revealed_at: profile.revealed_at,
        cadence: profile.cadence,
        expires_at: cooldownExpiry(profile.revealed_at, profile.cadence).toISOString(),
      });
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error(`[audit] delete-confirm: deleteUser failed uid=${safeLogValue(user.id)} msg=${safeLogValue(error.message)}`);
    throw new Error("Failed to delete account");
  }

  await supabase.auth.signOut();
  console.info(`[audit] delete-confirm: success uid=${safeLogValue(user.id)}`);
}
