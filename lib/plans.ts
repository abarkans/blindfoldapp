export const FREE_INTERESTS = ["food", "nature", "romance"] as const;

export const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: null,
    priceLine: "Free forever",
    tagline: "Start exploring without a card",
    datesPerMonth: 1,
    cadence: "monthly" as const,
    allowedInterests: FREE_INTERESTS,
    features: [
      "1 mystery date per month",
      "Food, Nature & Romance categories",
      "AI-crafted date stories",
      "1 re-roll (lifetime)",
      "XP & milestone badges",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    id: "subscription" as const,
    name: "Subscription",
    price: 9.99,
    priceLine: "€9.99 / month",
    tagline: "Full romantic unlock",
    datesPerMonth: null,
    cadence: null,
    allowedInterests: null,
    features: [
      "Weekly, Bi-weekly, or Monthly dates",
      "All 12 interest categories",
      "Full customization",
      "Enhanced AI personalization",
      "1 re-roll per date",
      "XP & milestone badges",
    ],
    cta: "Unlock everything",
    highlighted: true,
  },
] as const;

export type PlanId = "free" | "subscription";
