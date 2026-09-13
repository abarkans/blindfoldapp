// Curated idea pool for the public /random-date-generator page.
// Static on purpose: a public "spin" button must never call the AI or
// Google Places — that would cost money per anonymous click and invite abuse.
// Every relatedSlug must match a real file in content/blog/.

export type IdeaCategory =
  | "food"
  | "romance"
  | "nature"
  | "culture"
  | "nightlife"
  | "coffee"
  | "cinema"
  | "water"
  | "active"
  | "creative"
  | "learning"
  | "games"
  | "home";

export type IdeaSetting = "out" | "in";
export type IdeaBudget = "free" | "low" | "mid" | "high";

export type DateIdea = {
  slug: string;
  title: string;
  category: IdeaCategory;
  setting: IdeaSetting;
  budget: IdeaBudget;
  duration: string;
  vibe: string;
  mission: string;
  relatedSlug: string;
};

export const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  food: "Food & Dining",
  romance: "Romance",
  nature: "Nature",
  culture: "Art & Culture",
  nightlife: "Drinks & Nightlife",
  coffee: "Coffee & Cafés",
  cinema: "Cinema",
  water: "Beach & Water",
  active: "Active",
  creative: "Creative",
  learning: "Books & Learning",
  games: "Games",
  home: "Night In",
};

export const BUDGET_LABELS: Record<IdeaBudget, string> = {
  free: "Free",
  low: "$",
  mid: "$$",
  high: "$$$",
};

export const SETTING_LABELS: Record<IdeaSetting, string> = {
  out: "Going out",
  in: "Staying in",
};

export const DATE_IDEAS: DateIdea[] = [
  // Going out
  { slug: "omakase-for-two", title: "Omakase for Two", category: "food", setting: "out", budget: "high", duration: "2 hrs", vibe: "A chef's table. No menu. Just trust.", mission: "Guess the ingredient before the chef says it.", relatedSlug: "romantic-date-ideas-for-couples" },
  { slug: "sunset-rooftop-drinks", title: "Sunset Rooftop Drinks", category: "romance", setting: "out", budget: "mid", duration: "2 hrs", vibe: "Golden hour, cold glass, no agenda.", mission: "Clink glasses without saying \"cheers.\"", relatedSlug: "romantic-date-ideas-for-couples" },
  { slug: "sunrise-hike", title: "Sunrise Hike", category: "nature", setting: "out", budget: "free", duration: "3 hrs", vibe: "Early alarm. Worth every minute.", mission: "First to spot wildlife on the trail wins.", relatedSlug: "cheap-date-ideas-under-30" },
  { slug: "gallery-after-dark", title: "Gallery After Dark", category: "culture", setting: "out", budget: "mid", duration: "2 hrs", vibe: "Late opening. Quiet rooms. Wine included.", mission: "Pick each other's favorite piece, blind.", relatedSlug: "tourist-in-your-own-city" },
  { slug: "speakeasy-night", title: "Speakeasy Night", category: "nightlife", setting: "out", budget: "mid", duration: "2 hrs", vibe: "Hidden bar. Secret knock optional.", mission: "Order for each other with zero hints.", relatedSlug: "surprise-date-night-ideas" },
  { slug: "third-wave-coffee-tour", title: "Third Wave Coffee Tour", category: "coffee", setting: "out", budget: "low", duration: "2 hrs", vibe: "Four cafés. Rate them all.", mission: "Rank all four cafés, no ties allowed.", relatedSlug: "tourist-in-your-own-city" },
  { slug: "outdoor-film-night", title: "Outdoor Film Night", category: "cinema", setting: "out", budget: "low", duration: "3 hrs", vibe: "Blanket, popcorn, sky above.", mission: "Guess the ending before the halfway mark.", relatedSlug: "date-night-ideas-to-try-this-weekend" },
  { slug: "kayak-at-dusk", title: "Kayak at Dusk", category: "water", setting: "out", budget: "mid", duration: "2 hrs", vibe: "Paddle out. Watch the light change.", mission: "Race each other to the buoy and back.", relatedSlug: "date-night-ideas-to-try-this-weekend" },
  { slug: "bouldering-date", title: "Bouldering Date", category: "active", setting: "out", budget: "mid", duration: "2 hrs", vibe: "Trust your partner to spot you.", mission: "Spot each other on the hardest route.", relatedSlug: "first-date-ideas-not-dinner" },
  { slug: "golden-hour-shoot", title: "Golden Hour Shoot", category: "creative", setting: "out", budget: "free", duration: "1 hr", vibe: "You two. Best light of the day.", mission: "Ten shots each, zero retakes allowed.", relatedSlug: "cheap-date-ideas-under-30" },
  { slug: "bookshop-trawl", title: "Bookshop Trawl", category: "learning", setting: "out", budget: "low", duration: "1 hr", vibe: "A small budget each. Find something for the other.", mission: "Five minutes to pick the right book.", relatedSlug: "cheap-date-ideas-under-30" },
  { slug: "arcade-night", title: "Arcade Night", category: "games", setting: "out", budget: "low", duration: "2 hrs", vibe: "Tokens, competition, bad winners.", mission: "Loser buys the next round of tokens.", relatedSlug: "first-date-ideas-not-dinner" },
  { slug: "street-food-safari", title: "Street Food Safari", category: "food", setting: "out", budget: "low", duration: "2 hrs", vibe: "Follow your nose through the market.", mission: "Each of you picks one dish the other would never order.", relatedSlug: "tourist-in-your-own-city" },
  { slug: "candlelit-cinema", title: "Candlelit Cinema", category: "romance", setting: "out", budget: "mid", duration: "3 hrs", vibe: "Old film. Dark room. Just you two.", mission: "No phones until the credits roll.", relatedSlug: "romantic-date-ideas-for-couples" },
  { slug: "botanical-garden-wander", title: "Botanical Garden Wander", category: "nature", setting: "out", budget: "low", duration: "2 hrs", vibe: "No destination. Just greenery.", mission: "Find the strangest plant in the garden.", relatedSlug: "cheap-date-ideas-under-30" },
  { slug: "cocktail-lab", title: "Cocktail Lab", category: "nightlife", setting: "out", budget: "high", duration: "2 hrs", vibe: "Build your own drink. Judge each other's.", mission: "Blind-taste it and guess the recipe.", relatedSlug: "date-night-challenges-for-couples" },
  { slug: "tourist-for-a-day", title: "Tourist for a Day", category: "culture", setting: "out", budget: "low", duration: "4 hrs", vibe: "Your own city, seen like it's the first time.", mission: "Take the cheesiest photo at the most famous spot.", relatedSlug: "tourist-in-your-own-city" },
  { slug: "night-market-dash", title: "Night Market Dash", category: "food", setting: "out", budget: "low", duration: "1 hr", vibe: "One hour. Fifteen stalls. Go.", mission: "Split every bite fifty-fifty, no negotiating.", relatedSlug: "last-minute-date-night-ideas" },
  { slug: "karaoke-booth", title: "Private Karaoke Booth", category: "nightlife", setting: "out", budget: "mid", duration: "2 hrs", vibe: "Closed door. Nobody's judging. Probably.", mission: "Pick each other's song. No vetoes.", relatedSlug: "date-night-challenges-for-couples" },
  { slug: "pottery-class", title: "Pottery Class", category: "creative", setting: "out", budget: "mid", duration: "2 hrs", vibe: "Wet clay, wobbly bowls, zero pressure.", mission: "Make a mug for the other person.", relatedSlug: "anniversary-date-ideas" },
  { slug: "stargazing-drive", title: "Stargazing Drive", category: "nature", setting: "out", budget: "free", duration: "3 hrs", vibe: "Drive past the city lights. Look up.", mission: "Name a constellation after something only you two get.", relatedSlug: "surprise-date-night-ideas" },
  { slug: "one-hour-dessert-crawl", title: "One-Hour Dessert Crawl", category: "food", setting: "out", budget: "low", duration: "1 hr", vibe: "Skip dinner. Three sweet stops, fast.", mission: "Each stop, order blind from the middle of the menu.", relatedSlug: "2-hour-date-night-ideas-for-parents" },

  // Staying in
  { slug: "blind-taste-test", title: "Blind Taste Test", category: "home", setting: "in", budget: "low", duration: "1 hr", vibe: "Five snacks. One blindfold. Loud guesses.", mission: "Score a point for every brand you name correctly.", relatedSlug: "date-night-ideas-at-home" },
  { slug: "living-room-restaurant", title: "Living Room Restaurant", category: "home", setting: "in", budget: "low", duration: "2 hrs", vibe: "Tablecloth, printed menu, candles. Dress up anyway.", mission: "One of you cooks, the other writes a critic's review.", relatedSlug: "date-night-ideas-at-home" },
  { slug: "blanket-fort-movie", title: "Blanket Fort Movie Night", category: "home", setting: "in", budget: "free", duration: "3 hrs", vibe: "Every cushion you own. No shame.", mission: "Pick the film by spinning a list of five each.", relatedSlug: "date-ideas-when-tired" },
  { slug: "cook-a-new-cuisine", title: "Cook a Cuisine You've Never Tried", category: "home", setting: "in", budget: "low", duration: "2 hrs", vibe: "Unfamiliar recipe. Shared panic.", mission: "No looking at the recipe photo until it's plated.", relatedSlug: "date-night-ideas-at-home" },
  { slug: "memory-lane-photos", title: "Memory Lane Night", category: "romance", setting: "in", budget: "free", duration: "1 hr", vibe: "Old photos, old stories, new laughs.", mission: "Each find a photo the other has forgotten.", relatedSlug: "anniversary-date-ideas" },
  { slug: "36-questions", title: "The 36 Questions", category: "romance", setting: "in", budget: "free", duration: "1 hr", vibe: "The famous question list. Phones in another room.", mission: "Answer honestly. No skipping the hard ones.", relatedSlug: "date-night-challenges-for-couples" },
  { slug: "board-game-tournament", title: "Board Game Tournament", category: "games", setting: "in", budget: "free", duration: "2 hrs", vibe: "Best of three. Grudges allowed.", mission: "Loser plans the next date.", relatedSlug: "date-ideas-when-tired" },
  { slug: "paint-each-other", title: "Paint Each Other", category: "creative", setting: "in", budget: "low", duration: "1 hr", vibe: "Cheap canvases. Unflattering portraits.", mission: "Twenty minutes each. Reveal at the same time.", relatedSlug: "date-night-ideas-at-home" },
  { slug: "home-spa-night", title: "Home Spa Night", category: "home", setting: "in", budget: "low", duration: "2 hrs", vibe: "Face masks, low lights, zero chores.", mission: "Whoever checks their phone first gives the massage.", relatedSlug: "date-ideas-when-tired" },
  { slug: "book-club-for-two", title: "Book Club for Two", category: "learning", setting: "in", budget: "free", duration: "1 hr", vibe: "Same short story. Two very different takes.", mission: "Each defend the character the other hated.", relatedSlug: "why-couples-who-try-new-things" },
  { slug: "at-home-wine-tasting", title: "At-Home Wine Tasting", category: "nightlife", setting: "in", budget: "mid", duration: "2 hrs", vibe: "Three bottles, labels hidden, big opinions.", mission: "Rank them before revealing the prices.", relatedSlug: "date-night-ideas-at-home" },
  { slug: "learn-a-dance", title: "Learn a Dance in the Kitchen", category: "active", setting: "in", budget: "free", duration: "1 hr", vibe: "One tutorial video. Many stepped-on toes.", mission: "Perform the full routine once, no stopping.", relatedSlug: "last-minute-date-night-ideas" },
  { slug: "plan-a-dream-trip", title: "Plan a Dream Trip", category: "home", setting: "in", budget: "free", duration: "1 hr", vibe: "No budget, no dates, just a map.", mission: "Each plan one surprise day the other can't see.", relatedSlug: "signs-relationship-rut" },
  { slug: "puzzle-and-playlist", title: "Puzzle & Playlist", category: "games", setting: "in", budget: "low", duration: "2 hrs", vibe: "A 500-piece puzzle and a playlist you built together.", mission: "Take turns choosing songs. No skips.", relatedSlug: "2-hour-date-night-ideas-for-parents" },
];

export function getIdeaBySlug(slug: string | undefined): DateIdea | undefined {
  if (!slug) return undefined;
  return DATE_IDEAS.find((idea) => idea.slug === slug);
}
