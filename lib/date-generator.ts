export interface DateIdea {
  title: string;
  description: string;
  vibe: string;
  duration: string;
  budget_range: string;
  tags: string[];
}

type BudgetTier = "low" | "medium" | "high";

interface PoolItem extends DateIdea {
  interests: string[];
  budget_tier: BudgetTier;
  requires_car?: boolean;
}

const POOL: PoolItem[] = [
  // Food & Dining
  {
    interests: ["food"],
    title: "Secret Supper Club",
    description: "A reservation at a hidden pop-up restaurant neither of you has ever visited. Dress code: mystery.",

    vibe: "Intimate & Luxurious",
    duration: "2â€“3 hours",
    budget_range: "â‚¬40â€“80",
    budget_tier: "medium",
    tags: ["Indoor", "Dining", "Evening"],
  },
  {
    interests: ["food", "coffee"],
    title: "Blind Tasting Night",
    description: "A curated flight of wines or cocktails with small plates. Guess what you're drinking.",
    vibe: "Playful & Sophisticated",
    duration: "2 hours",
    budget_range: "â‚¬30â€“60",
    budget_tier: "medium",
    tags: ["Indoor", "Tasting", "Evening"],
  },
  {
    interests: ["food"],
    title: "Midnight Ramen Run",
    description: "Late-night ramen at a spot picked by a coin flip. No googling allowed.",
    vibe: "Spontaneous & Cozy",
    duration: "1â€“2 hours",
    budget_range: "â‚¬15â€“30",
    budget_tier: "low",
    tags: ["Indoor", "Late Night", "Casual"],
  },
  // Coffee & CafÃ©s
  {
    interests: ["coffee"],
    title: "CafÃ© Crawl",
    description: "Three mystery cafÃ©s, three mystery drinks chosen by the barista. You just say 'surprise me'.",
    vibe: "Relaxed & Curious",
    duration: "2â€“3 hours",
    budget_range: "â‚¬15â€“25",
    budget_tier: "low",
    tags: ["Walking", "CafÃ©s", "Daytime"],
  },
  // Nature
  {
    interests: ["nature"],
    title: "Sunrise Hike & Picnic",
    description: "An early morning trail ending at a viewpoint with a mystery picnic basket packed with your favorites.",
    vibe: "Adventurous & Peaceful",
    duration: "3â€“4 hours",
    budget_range: "â‚¬10â€“20",
    budget_tier: "low",
    tags: ["Outdoor", "Active", "Morning"],
  },
  {
    interests: ["nature", "photography"],
    title: "Golden Hour Walk",
    description: "A mystery route through a park or waterfront timed perfectly for the golden hour. Camera required.",
    vibe: "Romantic & Creative",
    duration: "2 hours",
    budget_range: "â‚¬0â€“10",
    budget_tier: "low",
    tags: ["Outdoor", "Walking", "Evening"],
  },
  {
    interests: ["nature", "beach"],
    title: "Coastal Escape",
    description: "A surprise drive to the nearest beach with a packed cooler and a playlist. Shoes optional.",
    vibe: "Freeing & Romantic",
    duration: "4â€“6 hours",
    budget_range: "â‚¬20â€“40",
    budget_tier: "low",
    requires_car: true,
    tags: ["Outdoor", "Beach", "Daytime"],
  },
  // Art & Culture
  {
    interests: ["art"],
    title: "Gallery Roulette",
    description: "Visit three small galleries. Pick your favorite piece in each. Winner chooses dessert.",
    vibe: "Cultured & Playful",
    duration: "2â€“3 hours",
    budget_range: "â‚¬10â€“20",
    budget_tier: "low",
    tags: ["Indoor", "Walking", "Daytime"],
  },
  {
    interests: ["art", "books"],
    title: "Mystery Market Find",
    description: "Each of you buys a second-hand book for the other without showing the cover. Read together after.",
    vibe: "Thoughtful & Intimate",
    duration: "2 hours",
    budget_range: "â‚¬10â€“20",
    budget_tier: "low",
    tags: ["Walking", "Markets", "Cozy"],
  },
  // Cinema & Entertainment
  {
    interests: ["cinema"],
    title: "Blind Cinema Date",
    description: "Show up at the cinema and see whatever starts next. No trailers, no reviews â€” pure surprise.",
    vibe: "Spontaneous & Fun",
    duration: "3 hours",
    budget_range: "â‚¬20â€“30",
    budget_tier: "low",
    tags: ["Indoor", "Evening", "No Planning"],
  },
  {
    interests: ["cinema", "gaming"],
    title: "Retro Arcade Night",
    description: "An evening at an arcade bar. â‚¬20 in tokens, two competing for bragging rights.",
    vibe: "Competitive & Fun",
    duration: "2â€“3 hours",
    budget_range: "â‚¬20â€“40",
    budget_tier: "low",
    tags: ["Indoor", "Evening", "Competitive"],
  },
  // Drinks & Nightlife
  {
    interests: ["music"],
    title: "Mystery Bar Crawl",
    description: "Three nearby spots, one drink or mocktail each, and a shared rating after every stop.",
    vibe: "Playful & Social",
    duration: "2â€“3 hours",
    budget_range: "â‚¬25â€“50",
    budget_tier: "medium",
    tags: ["Indoor", "Nightlife", "Evening"],
  },
  // Fitness & Active
  {
    interests: ["fitness"],
    title: "Sunrise Yoga & Brunch",
    description: "An outdoor yoga class followed by a surprise brunch spot nearby. Wear comfortable clothes.",
    vibe: "Energising & Wholesome",
    duration: "3 hours",
    budget_range: "â‚¬20â€“40",
    budget_tier: "low",
    tags: ["Outdoor", "Active", "Morning"],
  },
  {
    interests: ["fitness", "nature"],
    title: "Bike & Explore",
    description: "Rent bikes and follow a mystery route map. Stops include a cafÃ©, a viewpoint, and a surprise.",
    vibe: "Active & Adventurous",
    duration: "3â€“4 hours",
    budget_range: "â‚¬20â€“40",
    budget_tier: "low",
    tags: ["Outdoor", "Active", "Daytime"],
  },
  // Romance
  {
    interests: ["romance"],
    title: "Candlelit Rooftop",
    description: "A rooftop terrace reservation, candles pre-set, favorite drinks on arrival. Pure magic.",
    vibe: "Deeply Romantic",
    duration: "2â€“3 hours",
    budget_range: "â‚¬50â€“100",
    budget_tier: "high",
    tags: ["Outdoor", "Evening", "Romantic"],
  },
  {
    interests: ["romance", "coffee"],
    title: "Morning Love Letter CafÃ©",
    description: "Breakfast at a cosy cafÃ©. The rule: no phones. Write each other one handwritten thing you love.",
    vibe: "Tender & Intimate",
    duration: "1â€“2 hours",
    budget_range: "â‚¬15â€“25",
    budget_tier: "low",
    tags: ["Indoor", "Morning", "Intimate"],
  },
  // Photography
  {
    interests: ["photography"],
    title: "City Portrait Session",
    description: "Take turns photographing each other in 5 mystery locations around the city. Edit together after.",
    vibe: "Creative & Playful",
    duration: "3 hours",
    budget_range: "â‚¬0â€“15",
    budget_tier: "low",
    tags: ["Walking", "Creative", "Daytime"],
  },
  // Beach & Water
  {
    interests: ["beach"],
    title: "Sunset Swim",
    description: "Pack a bag, grab towels, find the water. Stay until the last light. Come back starving.",
    vibe: "Carefree & Romantic",
    duration: "3â€“5 hours",
    budget_range: "â‚¬10â€“20",
    budget_tier: "low",
    tags: ["Outdoor", "Beach", "Evening"],
  },
  // Gaming
  {
    interests: ["gaming"],
    title: "Board Game CafÃ© Showdown",
    description: "A mystery game chosen by the cafÃ© owner. Loser buys the next round.",
    vibe: "Playful & Cozy",
    duration: "2â€“3 hours",
    budget_range: "â‚¬15â€“30",
    budget_tier: "low",
    tags: ["Indoor", "Evening", "Competitive"],
  },
  // Books
  {
    interests: ["books"],
    title: "Bookshop Scavenger Hunt",
    description: "Each of you finds three books for the other in under 20 minutes. No peeking. Swap and judge.",
    vibe: "Nerdy & Sweet",
    duration: "2 hours",
    budget_range: "â‚¬20â€“40",
    budget_tier: "low",
    tags: ["Indoor", "Daytime", "Thoughtful"],
  },
];

function getBudgetTier(budgetMax: number): BudgetTier[] {
  const tiers: BudgetTier[] = ["low"];
  if (budgetMax >= 50) tiers.push("medium");
  if (budgetMax >= 100) tiers.push("high");
  return tiers;
}

export function generateDateIdea(
  interests: string[],
  budgetMax: number,
  hasCar: boolean
): DateIdea {
  const allowedTiers = getBudgetTier(budgetMax);

  // Filter: budget tier fits + car requirement met
  let candidates = POOL.filter(
    (idea) =>
      allowedTiers.includes(idea.budget_tier) &&
      (!idea.requires_car || hasCar)
  );

  // Score by interest match (more overlapping interests = higher score)
  const scored = candidates.map((idea) => ({
    idea,
    score: idea.interests.filter((i) => interests.includes(i)).length,
  }));

  // Prefer matched ideas but fall back to any eligible one
  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0]?.score ?? 0;
  const pool = topScore > 0
    ? scored.filter((s) => s.score === topScore)
    : scored;

  // Random pick from top tier
  const pick = pool[Math.floor(Math.random() * pool.length)].idea;

  // Return only the public DateIdea fields
  return {
    title: pick.title,
    description: pick.description,
    vibe: pick.vibe,
    duration: pick.duration,
    budget_range: pick.budget_range,
    tags: pick.tags,
  };
}
