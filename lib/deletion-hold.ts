import { createHash } from "crypto";
import { domainToASCII } from "url";
import type { SupabaseClient } from "@supabase/supabase-js";

const CADENCE_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

// Server-side pepper bumps the hash from "trivially rainbow-tabled email
// hash" toward "anonymized data". Required at runtime — fail loud rather
// than silently degrade to weaker hashing. Min length matches
// PLACE_PHOTO_HMAC_SECRET to prevent a too-short pepper from making the
// hash space tractable to bulk crackers.
const PEPPER_MIN_LEN = 32;

function getPepper(): string {
  const pepper = process.env.DELETION_HOLD_PEPPER;
  if (!pepper) {
    throw new Error("DELETION_HOLD_PEPPER env var not set");
  }
  if (pepper.length < PEPPER_MIN_LEN) {
    throw new Error(
      `DELETION_HOLD_PEPPER must be at least ${PEPPER_MIN_LEN} characters`,
    );
  }
  return pepper;
}

// Providers that ignore dots in the local part. Treat googlemail as gmail.
const DOT_INSENSITIVE_DOMAINS = new Set(["gmail.com"]);
const DOMAIN_ALIASES: Record<string, string> = {
  "googlemail.com": "gmail.com",
};

function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return trimmed;

  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);

  // IDN canonicalization (homoglyph / unicode domain → punycode ascii).
  try {
    const ascii = domainToASCII(domain);
    if (ascii) domain = ascii;
  } catch {}

  domain = DOMAIN_ALIASES[domain] ?? domain;

  // Strip plus-addressing tag. Honored by Gmail, Outlook, Yahoo, iCloud,
  // ProtonMail, Fastmail. Safe default for unknown providers.
  const plus = local.indexOf("+");
  if (plus >= 0) local = local.slice(0, plus);

  if (DOT_INSENSITIVE_DOMAINS.has(domain)) {
    local = local.replace(/\./g, "");
  }

  return `${local}@${domain}`;
}

export function hashEmail(email: string): string {
  return createHash("sha256")
    .update(`${getPepper()}:${normalizeEmail(email)}`)
    .digest("hex");
}

// Adopt an active deletion hold onto the current profile. Idempotent:
// safe to call multiple times — adopts only when a matching active hold
// exists and the profile's stored revealed_at is older than the hold's.
// Returns whether anything was carried over.
export async function adoptDeletionHold(
  admin: SupabaseClient,
  userId: string,
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  const idHash = hashEmail(email);

  const { data: hold } = await admin
    .from("deletion_holds")
    .select("revealed_at, cadence, expires_at")
    .eq("id_hash", idHash)
    .single();

  if (!hold) return false;
  if (new Date(hold.expires_at).getTime() <= Date.now()) {
    await admin.from("deletion_holds").delete().eq("id_hash", idHash);
    return false;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("revealed_at")
    .eq("id", userId)
    .single();

  const profileTs = profile?.revealed_at ? new Date(profile.revealed_at).getTime() : 0;
  const holdTs = new Date(hold.revealed_at).getTime();
  if (holdTs > profileTs) {
    await admin
      .from("profiles")
      .update({ revealed_at: hold.revealed_at, cadence: hold.cadence })
      .eq("id", userId);
  }

  await admin.from("deletion_holds").delete().eq("id_hash", idHash);
  return holdTs > profileTs;
}

export function cooldownExpiry(revealedAtIso: string, cadence: string): Date {
  const days = CADENCE_DAYS[cadence] ?? 30;
  return new Date(new Date(revealedAtIso).getTime() + days * 86_400_000);
}

export function isCooldownActive(revealedAtIso: string, cadence: string): boolean {
  return cooldownExpiry(revealedAtIso, cadence).getTime() > Date.now();
}
