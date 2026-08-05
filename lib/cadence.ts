export const CADENCE_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

/**
 * Check-in deadline anchors on revealed_at (not date_accepted_at) so it lines
 * up with isRevealAvailableForProfile's next-date gate in reveal.ts — an
 * accept-anchored deadline could land after the next date already unlocked.
 */
export function getCheckinDeadlineMs(revealedAt: string, cadence: string | null | undefined): number {
  const days = CADENCE_DAYS[cadence ?? "monthly"] ?? 30;
  return new Date(revealedAt).getTime() + days * 24 * 60 * 60 * 1000;
}
