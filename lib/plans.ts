export const FREE_INTERESTS = ["food", "nature", "romance"] as const;
export const FREE_MAX_RADIUS_KM = 15;
export const PAID_MAX_RADIUS_KM = 50;

export const PLANS = [
  {
    id: "free" as const,
    name: "Starter",
    price: null,
    introPrice: null,
    priceLine: "Free forever",
    tagline: "Try it — no card needed",
    datesPerMonth: 1,
    cadence: "monthly" as const,
    allowedInterests: FREE_INTERESTS,
    features: [
      "1 mystery date per month",
      "3 date categories",
      "Casual date story",
      "Nearby venues only",
      "1 free swap",
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
      "XP & milestone badges",
      "Richer, more creative date experiences",
    ],
    cta: "Take over my planning",
    highlighted: true,
  },
] as const;

export type PlanId = "free" | "subscription";
