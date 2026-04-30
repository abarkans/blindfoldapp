export type UnitSystem = "metric" | "imperial";

const KM_TO_MI = 0.621371;

const IMPERIAL_COUNTRIES = new Set(["US", "LR", "MM"]);

export function unitSystemForCountry(country: string | null | undefined): UnitSystem {
  if (!country) return "metric";
  return IMPERIAL_COUNTRIES.has(country.toUpperCase()) ? "imperial" : "metric";
}

export function formatRadius(km: number, system: UnitSystem): string {
  if (system === "imperial") {
    const mi = km * KM_TO_MI;
    return `${Math.round(mi)} mi`;
  }
  return `${km} km`;
}

export function distanceUnitLabel(system: UnitSystem): string {
  return system === "imperial" ? "mi" : "km";
}
