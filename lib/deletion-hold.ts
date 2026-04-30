import { createHash } from "crypto";

const CADENCE_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

export function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export function cooldownExpiry(revealedAtIso: string, cadence: string): Date {
  const days = CADENCE_DAYS[cadence] ?? 30;
  return new Date(new Date(revealedAtIso).getTime() + days * 86_400_000);
}

export function isCooldownActive(revealedAtIso: string, cadence: string): boolean {
  return cooldownExpiry(revealedAtIso, cadence).getTime() > Date.now();
}
