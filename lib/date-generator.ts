export interface DateIdea {
  title: string;
  description: string;
  emoji: string;
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
    emoji: "🍽️",
    vibe: "Intimate & Luxurious",
    duration: "2–3 hours",
    budget_range: "€40–80",
    budget_tier: "medium",
    tags: ["Indoor", "Dining", "Evening"],
  },
  {
    interests: ["food", "coffee"],
    title: "Blind Tasting Night",
    description: "A curated flight of wines or cocktails with small plates. Guess what you're drinking.",
    emoji: "🍷",
    vibe: "Playful & Sophisticated",
    duration: "2 hours",
    budget_range: "€30–60",
    budget_tier: "medium",
    tags: ["Indoor", "Tasting", "Evening"],
  },
  {
    interests: ["food"],
    title: "Midnight Ramen Run",
    description: "Late-night ramen at a spot picked by a coin flip. No googling allowed.",
    emoji: "🍜",
    vibe: "Spontaneous & Cosy",
    duration: "1–2 hours",
    budget_range: "€15–30",
    budget_tier: "low",
    tags: ["Indoor", "Late Night", "Casual"],
  },
  // Coffee & Cafés
  {
    interests: ["coffee"],
    title: "Café Crawl",
    description: "Three mystery cafés, three mystery drinks chosen by the barista. You just say 'surprise me'.",
    emoji: "☕",
    vibe: "Relaxed & Curious",
    duration: "2–3 hours",
    budget_range: "€15–25",
    budget_tier: "low",
    tags: ["Walking", "Cafés", "Daytime"],
  },
  // Nature
  {
    interests: ["nature"],
    title: "Sunrise Hike & Picnic",
    description: "An early morning trail ending at a viewpoint with a mystery picnic basket packed with your favourites.",
    emoji: "🌄",
    vibe: "Adventurous & Peaceful",
    duration: "3–4 hours",
    budget_range: "€10–20",
    budget_tier: "low",
    tags: ["Outdoor", "Active", "Morning"],
  },
  {
    interests: ["nature", "photography"],
    title: "Golden Hour Walk",
    description: "A mystery route through a park or waterfront timed perfectly for the golden hour. Camera required.",
    emoji: "🌅",
    vibe: "Romantic & Creative",
    duration: "2 hours",
    budget_range: "€0–10",
    budget_tier: "low",
    tags: ["Outdoor", "Walking", "Evening"],
  },
  {
    interests: ["nature", "beach"],
    title: "Coastal Escape",
    description: "A surprise drive to the nearest beach with a packed cooler and a playlist. Shoes optional.",
    emoji: "🌊",
    vibe: "Freeing & Romantic",
    duration: "4–6 hours",
    budget_range: "€20–40",
    budget_tier: "low",
    requires_car: true,
    tags: ["Outdoor", "Beach", "Daytime"],
  },
  // Art & Culture
  {
    interests: ["art"],
    title: "Gallery Roulette",
    description: "Visit three small galleries. Pick your favourite piece in each. Winner chooses dessert.",
    emoji: "🎨",
    vibe: "Cultured & Playful",
    duration: "2–3 hours",
    budget_range: "€10–20",
    budget_tier: "low",
    tags: ["Indoor", "Walking", "Daytime"],
  },
  {
    interests: ["art", "books"],
    title: "Mystery Market Find",
    description: "Each of you buys a second-hand book for the other without showing the cover. Read together after.",
    emoji: "📚",
    vibe: "Thoughtful & Intimate",
    duration: "2 hours",
    budget_range: "€10–20",
    budget_tier: "low",
    tags: ["Walking", "Markets", "Cosy"],
  },
  // Cinema & Entertainment
  {
    interests: ["cinema"],
    title: "Blind Cinema Date",
    description: "Show up at the cinema and see whatever starts next. No trailers, no reviews — pure surprise.",
    emoji: "🎬",
    vibe: "Spontaneous & Fun",
    duration: "3 hours",
    budget_range: "€20–30",
    budget_tier: "low",
    tags: ["Indoor", "Evening", "No Planning"],
  },
  {
    interests: ["cinema", "gaming"],
    title: "Retro Arcade Night",
    description: "An evening at an arcade bar. €20 in tokens, two competing for bragging rights.",
    emoji: "🕹️",
    vibe: "Competitive & Fun",
    duration: "2–3 hours",
    budget_range: "€20–40",
    budget_tier: "low",
    tags: ["Indoor", "Evening", "Competitive"],
  },
  // Music
  {
    interests: ["music"],
    title: "Mystery Gig Night",
    description: "Tickets to a live act neither of you knows. Picked by genre only. Dress for the vibes.",
    emoji: "🎵",
    vibe: "Electric & Exciting",
    duration: "3–4 hours",
    budget_range: "€25–60",
    budget_tier: "medium",
    tags: ["Indoor", "Live Music", "Evening"],
  },
  // Fitness & Active
  {
    interests: ["fitness"],
    title: "Sunrise Yoga & Brunch",
    description: "An outdoor yoga class followed by a surprise brunch spot nearby. Wear comfortable clothes.",
    emoji: "🧘",
    vibe: "Energising & Wholesome",
    duration: "3 hours",
    budget_range: "€20–40",
    budget_tier: "low",
    tags: ["Outdoor", "Active", "Morning"],
  },
  {
    interests: ["fitness", "nature"],
    title: "Bike & Explore",
    description: "Rent bikes and follow a mystery route map. Stops include a café, a viewpoint, and a surprise.",
    emoji: "🚴",
    vibe: "Active & Adventurous",
    duration: "3–4 hours",
    budget_range: "€20–40",
    budget_tier: "low",
    tags: ["Outdoor", "Active", "Daytime"],
  },
  // Romance
  {
    interests: ["romance"],
    title: "Candlelit Rooftop",
    description: "A rooftop terrace reservation, candles pre-set, favourite drinks on arrival. Pure magic.",
    emoji: "🕯️",
    vibe: "Deeply Romantic",
    duration: "2–3 hours",
    budget_range: "€50–100",
    budget_tier: "high",
    tags: ["Outdoor", "Evening", "Romantic"],
  },
  {
    interests: ["romance", "coffee"],
    title: "Morning Love Letter Café",
    description: "Breakfast at a cosy café. The rule: no phones. Write each other one handwritten thing you love.",
    emoji: "💌",
    vibe: "Tender & Intimate",
    duration: "1–2 hours",
    budget_range: "€15–25",
    budget_tier: "low",
    tags: ["Indoor", "Morning", "Intimate"],
  },
  // Photography
  {
    interests: ["photography"],
    title: "City Portrait Session",
    description: "Take turns photographing each other in 5 mystery locations around the city. Edit together after.",
    emoji: "📸",
    vibe: "Creative & Playful",
    duration: "3 hours",
    budget_range: "€0–15",
    budget_tier: "low",
    tags: ["Walking", "Creative", "Daytime"],
  },
  // Beach & Water
  {
    interests: ["beach"],
    title: "Sunset Swim",
    description: "Pack a bag, grab towels, find the water. Stay until the last light. Come back starving.",
    emoji: "🏖️",
    vibe: "Carefree & Romantic",
    duration: "3–5 hours",
    budget_range: "€10–20",
    budget_tier: "low",
    tags: ["Outdoor", "Beach", "Evening"],
  },
  // Gaming
  {
    interests: ["gaming"],
    title: "Board Game Café Showdown",
    description: "A mystery game chosen by the café owner. Loser buys the next round.",
    emoji: "🎲",
    vibe: "Playful & Cosy",
    duration: "2–3 hours",
    budget_range: "€15–30",
    budget_tier: "low",
    tags: ["Indoor", "Evening", "Competitive"],
  },
  // Books
  {
    interests: ["books"],
    title: "Bookshop Scavenger Hunt",
    description: "Each of you finds three books for the other in under 20 minutes. No peeking. Swap and judge.",
    emoji: "📖",
    vibe: "Nerdy & Sweet",
    duration: "2 hours",
    budget_range: "€20–40",
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
    emoji: pick.emoji,
    vibe: pick.vibe,
    duration: pick.duration,
    budget_range: pick.budget_range,
    tags: pick.tags,
  };
}
