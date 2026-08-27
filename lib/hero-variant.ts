export const HERO_VARIANT_COOKIE = "hero_variant";

export type HeroVariant = "A" | "B";

export function isHeroVariant(value: string | undefined): value is HeroVariant {
  return value === "A" || value === "B";
}

export function pickHeroVariant(): HeroVariant {
  return Math.random() < 0.5 ? "A" : "B";
}
