export const FREE_INTERESTS = ["food", "nature", "romance"] as const;
export const FREE_MAX_RADIUS_KM = 15;
export const PAID_MAX_RADIUS_KM = 50;

export const PLANS = [
  {
    id: "free" as const,
    name: "Starter",
    price: null,
    priceLine: "Free forever",
    tagline: "Try it — no card needed",
    datesPerMonth: 1,
    cadence: "monthly" as const,
    allowedInterests: FREE_INTERESTS,
    features: [
      "1 mystery date per month",
      "3 date categories",
      "AI-crafted date stories",
      "Nearby venues only",
      "1 lifetime re-roll",
      "XP & milestone badges",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    id: "subscription" as const,
    name: "Plus",
    price: 5.99,
    priceLine: "€5.99 / month",
    tagline: "Leave all the planning to us",
    datesPerMonth: null,
    cadence: null,
    allowedInterests: null,
    features: [
      "Date as often as you want",
      "All date categories unlocked",
      "Personalized to your exact taste",
      "Near & far venue search",
      "1 re-roll per date",
      "XP & milestone badges",
    ],
    cta: "Take over my planning",
    highlighted: true,
  },
] as const;

export type PlanId = "free" | "subscription";
