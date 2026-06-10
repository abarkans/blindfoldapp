export const FREE_INTERESTS = ["food", "nature", "romance"] as const;
export const MIN_INTEREST_CATEGORIES = 2;
export const FREE_MAX_RADIUS_KM = 15;
export const PAID_MAX_RADIUS_KM = 50;

export const PLANS = [
  {
    id: "free" as const,
    name: "Starter",
    price: null,
    introPrice: null,
    yearlyPrice: null,
    priceLine: "Free forever",
    tagline: "Try it free, no card needed",
    datesPerMonth: 1,
    cadence: "monthly" as const,
    allowedInterests: FREE_INTERESTS,
    features: [
      "1 mystery date per month",
      "3 date categories",
      "Dates out or dates in — your call",
      "Nearby venues only",
      "1 swap, ever",
      "XP & milestone badges",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    id: "subscription" as const,
    name: "Plus",
    price: 5.99,
    introPrice: 1.49,
    priceLine: "€5.99 / month",
    yearlyPrice: 39.99,
    yearlyPriceLine: "€39.99 / year",
    tagline: "Leave all the planning to us",
    datesPerMonth: null,
    cadence: null,
    allowedInterests: null,
    features: [
      "Choose your date frequency",
      "All date categories unlocked",
      "Personalized to your exact taste",
      "Near & far venue search",
      "1 swap per date",
      "Double XP on every date",
      "Date memories & photo history",
      "Richer, more creative date experiences",
    ],
    cta: "Take over my planning",
    highlighted: true,
  },
] as const;

export type PlanId = "free" | "subscription" | "trial";

/** Returns true for plan types that get Plus-quality features (full interests, larger radius, 2× XP, etc.) */
export function isPlusPlan(planType: PlanId | string | null | undefined): boolean {
  return planType === "subscription" || planType === "trial";
}
