// One-off fix: re-anchor a couple's date clock on acceptance instead of
// generation.
//
// Both the completion deadline (lib/cadence.ts getCheckinDeadlineMs) and the
// next-date unlock (app/actions/reveal.ts isRevealAvailableForProfile) are
// computed as profiles.revealed_at + CADENCE_DAYS. revealed_at is stamped when
// the date is GENERATED (reveal.ts, inside the atomic cooldown claim), not when
// both partners accept it — so every day spent waiting for acceptance is eaten
// out of the completion window. Wait 26 days on a monthly cadence and you get
// 4 days to actually do the date.
//
// This sets revealed_at := date_accepted_at, giving the couple the full cadence
// from the moment they both accepted.
//
// NOTE: because deadline and unlock are the same instant by construction, this
// also pushes the NEXT date's unlock out by the same amount. That is inherent,
// not a side effect of this script.
//
// Usage:
//   node scripts/rebase-date-clock.mjs user@example.com           (inspect only)
//   node scripts/rebase-date-clock.mjs user@example.com --apply   (write it)

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
const doApply = process.argv.includes("--apply");
if (!email) {
  console.error("Usage: node scripts/rebase-date-clock.mjs <email> [--apply]");
  process.exit(1);
}

const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
function env(key) {
  const match = envFile.match(new RegExp(`^${key}=(.+)$`, "m"));
  if (!match) {
    console.error(`${key} not found in .env.local`);
    process.exit(1);
  }
  return match[1].trim().replace(/^"|"$/g, "");
}

const admin = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

// Mirrors lib/cadence.ts. Deliberately duplicated: this script must keep
// working against the deployed schema even if the app's constants move.
const CADENCE_DAYS = { weekly: 7, biweekly: 14, monthly: 30 };
const DAY_MS = 86_400_000;

const { data: users, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (usersError) {
  console.error("auth.listUsers failed:", usersError.message);
  process.exit(1);
}
const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`No auth user for ${email}`);
  process.exit(1);
}

// The couple's row may be owned by either member; couple_members maps user -> profile.
const { data: member } = await admin
  .from("couple_members")
  .select("profile_id, role")
  .eq("user_id", user.id)
  .maybeSingle();
const profileId = member?.profile_id ?? user.id;

const { data: profile, error } = await admin
  .from("profiles")
  .select("id, cadence, revealed_at, date_accepted_at, date_idea, dates_completed_count")
  .eq("id", profileId)
  .single();

if (error || !profile) {
  console.error("profile fetch failed:", error?.message ?? "not found");
  process.exit(1);
}

const days = CADENCE_DAYS[profile.cadence] ?? 30;
const revealedAt = profile.revealed_at ? new Date(profile.revealed_at) : null;
const acceptedAt = profile.date_accepted_at ? new Date(profile.date_accepted_at) : null;

function fmt(d) {
  return d ? d.toISOString() : "null";
}
function daysLeft(from) {
  return ((from.getTime() + days * DAY_MS - Date.now()) / DAY_MS).toFixed(1);
}

console.log(`profile        ${profile.id}${member ? `  (via couple_members as ${member.role})` : ""}`);
console.log(`cadence        ${profile.cadence} (${days} days)`);
console.log(`has date_idea  ${profile.date_idea ? "yes" : "no"}`);
console.log(`completed      ${profile.dates_completed_count}`);
console.log(`revealed_at    ${fmt(revealedAt)}   <- clock anchor (generation)`);
console.log(`accepted_at    ${fmt(acceptedAt)}   <- when both partners accepted`);

if (!profile.date_idea) {
  console.log("\nNo active date. Nothing to re-anchor.");
  process.exit(0);
}
if (!revealedAt || !acceptedAt) {
  console.log("\nDate is not in the accepted state yet. Nothing to re-anchor.");
  process.exit(0);
}

const lagDays = (acceptedAt.getTime() - revealedAt.getTime()) / DAY_MS;
console.log(`\nacceptance lag ${lagDays.toFixed(1)} days  (burned out of the window before anyone saw the date)`);
console.log(`days left now  ${daysLeft(revealedAt)}`);
console.log(`days left after ${daysLeft(acceptedAt)}`);

if (acceptedAt <= revealedAt) {
  console.log("\nacceptance is not later than generation — nothing to gain.");
  process.exit(0);
}

if (!doApply) {
  console.log("\nInspect only. Re-run with --apply to set revealed_at := date_accepted_at.");
  process.exit(0);
}

// Moving revealed_at FORWARD is permitted by the protect_revealed_at trigger
// (migration 018 only blocks moving it backward); the service-role client also
// bypasses the migration 015 lockdown trigger.
const { error: writeError } = await admin
  .from("profiles")
  .update({ revealed_at: profile.date_accepted_at })
  .eq("id", profile.id)
  .eq("revealed_at", profile.revealed_at); // no-op if something changed under us

if (writeError) {
  console.error("\nwrite failed:", writeError.message);
  process.exit(1);
}

const { data: after } = await admin
  .from("profiles")
  .select("revealed_at")
  .eq("id", profile.id)
  .single();

console.log(`\nrevealed_at -> ${after?.revealed_at}`);
if (after?.revealed_at !== profile.date_accepted_at) {
  console.error("MISMATCH: the trigger may have reverted the write. Inspect manually.");
  process.exit(1);
}
console.log(`done. ${daysLeft(acceptedAt)} days left to complete; next date unlocks at the same instant.`);
