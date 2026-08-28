import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// XP / levelling helpers
// Formula: Level = floor(sqrt(XP / 100)) + 1
export function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Minimum XP required to reach a given level
export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

// Progress info within the current level
export function xpProgress(xp: number): {
  level: number;
  current: number;   // XP accumulated in this level
  required: number;  // XP needed to reach next level from start of this level
  percentage: number;
} {
  const level = calcLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const current = xp - currentLevelXp;
  const required = nextLevelXp - currentLevelXp;
  return { level, current, required, percentage: Math.round((current / required) * 100) };
}

/**
 * JSON.stringify made safe for embedding inside a <script> tag.
 *
 * JSON.stringify does not escape `<`, so any value containing "</script>"
 * terminates the element early and everything after it is parsed as HTML.
 * Today every JSON-LD input is static or MDX frontmatter we author, but these
 * blocks are one field away from carrying user text — a venue name from Places,
 * a review, a partner name — and at that point this becomes stored XSS.
 *
 * Escapes to \u-sequences, which are valid inside JSON string literals and
 * parse back to the original characters.
 */
export function jsonLdSafe(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\u003c")
    .replace(/>/g, "\u003e")
    .replace(/&/g, "\u0026");
}
