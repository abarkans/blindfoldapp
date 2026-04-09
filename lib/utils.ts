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
