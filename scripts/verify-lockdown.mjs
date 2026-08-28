// Verifies the lockdown_protected_columns() trigger (migrations 015→067) and the
// RLS/grant write-denial on date_ideas, from a REAL authenticated user session —
// i.e. exactly what an attacker holding a valid login and the public anon key can
// do from devtools.
//
//   node --env-file=.env.local scripts/verify-lockdown.mjs <email>
//
// AUTH: Supabase captcha protection (Turnstile) blocks scripted
// signInWithPassword, so this mints a magic link with the service-role key and
// redeems it with the anon client — the same generateLink → verifyOtp flow
// /api/auth/handoff and /auth/confirm already use. verifyOtp is the redemption
// step and is not captcha-gated. No password needed; works for OAuth accounts.
//
// The session it obtains is an ORDINARY user session. Every check below runs
// through the anon key, so it exercises the real attacker path — the service-role
// key is used ONLY to mint the link, never to read or write the tables under test.
//
// IMPORTANT: the trigger reverts silently. A blocked write returns 200 OK with the
// old value intact — there is no error. Every check writes, then RE-READS, and
// compares. "No error" is not evidence of protection.

import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !URL || !ANON || !SERVICE) {
  console.error("usage: node --env-file=.env.local scripts/verify-lockdown.mjs <email>");
  if (!URL || !ANON || !SERVICE) {
    console.error("missing env:", [
      !URL && "NEXT_PUBLIC_SUPABASE_URL",
      !ANON && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      !SERVICE && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean).join(", "));
    console.error("(if these look set, check .env.local for a UTF-8 BOM — node --env-file does not strip it)");
  }
  process.exitCode = 2;
} else {
  await main();
}

async function main() {
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
  const supabase = createClient(URL, ANON);

  // Mint + redeem a magic link to obtain a normal user session.
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkErr || !link?.properties?.hashed_token) {
    console.error("could not mint magic link:", linkErr?.message ?? "no hashed_token returned");
    console.error("(does an account exist for that email?)");
    process.exitCode = 2;
    return;
  }

  const { data: auth, error: authErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (authErr || !auth?.user) {
    console.error("could not redeem magic link:", authErr?.message);
    process.exitCode = 2;
    return;
  }

  const uid = auth.user.id;
  console.log(`session established for ${email}`);
  console.log(`  user id: ${uid}`);

  // Resolve the profile this session can actually write to (own, or the couple's).
  const { data: membership } = await supabase
    .from("couple_members")
    .select("profile_id, role")
    .eq("user_id", uid)
    .maybeSingle();
  const profileId = membership?.profile_id ?? uid;
  console.log(`  profile: ${profileId} (role: ${membership?.role ?? "owner/implicit"})\n`);

  const COLUMNS = [
    "plan_type", "stripe_customer_id", "total_xp", "dates_completed_count",
    "revealed_at", "date_accepted_at", "onboarding_complete", "cadence",
    "preferred_radius", "email_notifications",
    "reminder_sent_at", "reengagement_sent_at",
    "push_notifications_enabled", "push_token",
  ];

  const { data: before, error: readErr } = await supabase
    .from("profiles").select(COLUMNS.join(", ")).eq("id", profileId).single();

  if (readErr) {
    console.error("could not read profile:", readErr.message);
    console.error("(after migration 068 this would also fail if the SELECT grant went missing)");
    process.exitCode = 2;
    return;
  }

  // Each attempt is a real privilege-escalation or guard-bypass.
  const ATTEMPTS = [
    ["plan_type",                  "subscription",   "free Plus upgrade"],
    ["total_xp",                   999999,           "XP farming"],
    ["dates_completed_count",      99,               "badge farming"],
    ["onboarding_complete",        true,             "skip onboarding gate"],
    ["cadence",                    "weekly",         "4x faster reveal cooldown"],
    ["revealed_at",                null,             "reset reveal cooldown"],
    ["preferred_radius",           50000,            "F1: free-plan 50km Plus radius"],
    ["reminder_sent_at",           null,             "F2: re-arm reminder email"],
    ["reengagement_sent_at",       null,             "F2: re-arm re-engagement email"],
    ["email_notifications",        false,            "silence couple's email"],
    ["push_notifications_enabled", false,            "067: silence couple's push"],
    ["push_token",                 "ATTACKER_TOKEN", "067: vestigial token write"],
  ];

  let failures = 0;
  console.log("column                       attempted            result");
  console.log("-".repeat(78));

  for (const [col, value, label] of ATTEMPTS) {
    const { error: writeErr } = await supabase
      .from("profiles").update({ [col]: value }).eq("id", profileId);

    const { data: after } = await supabase
      .from("profiles").select(col).eq("id", profileId).single();

    const held = JSON.stringify(after?.[col]) === JSON.stringify(before[col]);

    if (!held) {
      failures++;
      // Restore so a failed test does not leave the account modified.
      await supabase.from("profiles").update({ [col]: before[col] }).eq("id", profileId);
    }

    console.log(
      `${col.padEnd(28)} ${String(value).padEnd(20)} ` +
      (held ? "BLOCKED (reverted)" : `*** WRITE LANDED -> ${JSON.stringify(after?.[col])}   <- ${label}`) +
      (writeErr ? `  [rejected outright: ${writeErr.code ?? writeErr.message}]` : "")
    );
  }

  // RLS + grant write-denial on date_ideas (F11 / migrations 057, 068).
  console.log("");
  const { error: insErr } = await supabase
    .from("date_ideas")
    .insert({ user_id: profileId, idea: { title: "injected" }, status: "revealed" });

  if (insErr) {
    console.log(`date_ideas INSERT (forged revealed date)   BLOCKED [${insErr.code ?? insErr.message}]`);
  } else {
    failures++;
    console.log("date_ideas INSERT (forged revealed date)   *** SUCCEEDED - write-denial not holding");
    console.log("    !! A junk date_ideas row with status='revealed' now exists on this profile");
    console.log("    !! and this client cannot delete it (no DELETE grant after migration 068).");
    console.log("    !! Remove it in the Supabase SQL editor:");
    console.log(`    !!   delete from public.date_ideas`);
    console.log(`    !!   where user_id = '${profileId}' and idea->>'title' = 'injected';`);
  }

  console.log("-".repeat(78));
  if (failures === 0) {
    console.log("\n>>> PASS: every protected column reverted; date_ideas writes denied.");
  } else {
    console.log(`\n>>> FAIL: ${failures} write(s) landed. Those columns are NOT protected.`);
    console.log(">>> Original values restored. Check that migrations 066 and 067 applied.");
  }

  await supabase.auth.signOut();
  process.exitCode = failures === 0 ? 0 : 1;
}
