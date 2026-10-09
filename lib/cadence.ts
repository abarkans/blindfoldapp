/**
 * Single source of truth for cadence lengths. profiles.cadence is
 * `not null default 'weekly'` (migrations 001 + 009) and constrained to exactly
 * these three values by profiles_cadence_check (migration 019), so every lookup
 * here hits and the `?? CADENCE_FALLBACK_DAYS` guards below are unreachable in
 * practice — they exist only so a future cadence value added to the DB without
 * a matching entry here degrades instead of producing NaN.
 *
 * Do not re-declare this map locally. It used to be copied into reveal.ts,
 * notify-dates/route.ts, deletion-hold.ts and dev.ts with fallbacks that
 * disagreed (7 in some, 30 in others), which meant the same date could be given
 * two different deadlines depending on which file was asked.
 */
export const CADENCE_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

const CADENCE_FALLBACK_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getCadenceDays(cadence: string | null | undefined): number {
  return CADENCE_DAYS[cadence ?? ""] ?? CADENCE_FALLBACK_DAYS;
}

/**
 * Check-in deadline anchors on revealed_at (not date_accepted_at) so it lines
 * up with isRevealAvailableForProfile's next-date gate in reveal.ts — an
 * accept-anchored deadline could land after the next date already unlocked.
 *
 * Consequence: revealed_at is stamped at generation, so any delay before both
 * partners accept is subtracted from the window the couple actually sees.
 */
export function getCheckinDeadlineMs(revealedAt: string, cadence: string | null | undefined): number {
  return new Date(revealedAt).getTime() + getCadenceDays(cadence) * DAY_MS;
}
