"use server";

import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";

// U+202A..U+202E (LRE/RLE/PDF/LRO/RLO) and U+2066..U+2069 (LRI/RLI/FSI/PDI).
// Built via new RegExp so the source stays plain ASCII and reviewable.
const BIDI_OVERRIDES = new RegExp("[\\u202A-\\u202E\\u2066-\\u2069]", "g");
// U+200B..U+200F (ZWSP/ZWNJ/ZWJ/LRM/RLM) and U+FEFF (BOM).
const ZERO_WIDTH_AND_FORMAT = new RegExp("[\\u200B-\\u200F\\uFEFF]", "g");

/**
 * Strip characters that could be used to break out of XML tags or inject new
 * prompt sections, then hard-cap length. Applied to all user-derived strings
 * and untrusted third-party content (Google reviews) before they enter prompts.
 *
 * Also strips Unicode bidi-override and zero-width / format characters which
 * can be used to hide malicious instructions inside otherwise innocent-looking
 * text (e.g. RLO smuggles right-to-left content past visual review; ZWJ/ZWNJ
 * embeds invisible payloads). NFKC normalisation collapses homoglyphs.
 */
function sanitize(value: string, maxLen = 200): string {
  return value
    .normalize("NFKC")
    .replace(BIDI_OVERRIDES, "")
    .replace(ZERO_WIDTH_AND_FORMAT, "")
    .replace(/[<>\[\]`#|\\{}]/g, "") // XML / markdown / prompt delimiters
    .replace(/[\n\r\t]/g, " ")       // flatten whitespace controls
    .replace(/ {2,}/g, " ")          // collapse whitespace runs
    .trim()
    .slice(0, maxLen);
}

const DateIdeaSchema = z.object({
  title: z.string().describe("Short catchy name for the date, max 5 words. Must NOT be the venue name verbatim — invent a short evocative phrase about the experience instead."),
  description: z
    .string()
    .describe(
      "Exactly 1 sentence, max 20 words — use the place name naturally, focus on atmosphere or what makes it distinctly worth visiting"
    ),
  mission: z
    .string()
    .describe(
      "2-3 sentences: a fun challenge the couple does TOGETHER at this specific place. Slightly competitive, silly, or requires vulnerability. Tone: a friend daring you, not a life coach."
    ),
  vibe: z.string().describe("2-4 word vibe label, e.g. 'Romantic & Adventurous'"),
  duration: z.string().describe("Estimated duration, e.g. '2–3 hours'"),
  budget_range: z
    .string()
    .describe("Budget range in euros, e.g. '€20–40'. Must fit within budget_max"),
  tags: z
    .array(z.string())
    .describe("2-4 short tags like 'Indoor', 'Evening', 'Active', 'Romantic'"),
  preparation: z
    .string()
    .optional()
    .describe("Plus plan only. One instruction for what to wear or bring. Start with 'Wear' or 'Bring'. Max 15 words. Specific to venue vibe."),
  conversation_starter: z
    .string()
    .optional()
    .describe("Plus plan only. One question tailored to their interests AND the venue. Feels specific to this date, not generic. Max 25 words."),
  // Home date fields — only populated by generateHomeDateIdea()
  preparation_list: z
    .array(z.string())
    .optional()
    .describe("Home dates only. 3-6 items to gather from around the house or buy. Each item max 12 words."),
  steps: z
    .array(z.string())
    .optional()
    .describe("Home dates only. Exactly 3 steps: set the mood, main activity, final step starts with 'Capture the moment' + specific phrase. Each step max 25 words."),

});

export type GeneratedDateIdea = z.infer<typeof DateIdeaSchema>;

const VENUE_SYSTEM_PROMPT = `You are a date experience writer for Blindfold, a couples date app.

TITLE RULES:
- Max 5 words, evocative, captures the vibe of the experience
- Must NOT be the venue's name verbatim
- Must NOT be just a city or place name
- Think "Sunset & Slow Bites" not "Restaurant Riga"

DESCRIPTION RULES:
- Exactly 1 sentence, maximum 20 words
- Use the place name naturally
- Focus on atmosphere or what makes it distinctly worth visiting
- If reviews are missing, rely only on type + attributes + price level
- If the place is a Bar, Family restaurant, or Hamburger restaurant, do not mention intimate atmosphere or romance
- Banned words: charming, cozy, vibrant, perfect, hidden gem, delightful, lovely, unique, amazing, wonderful

MISSION RULES:
- 2-3 sentences max
- A fun challenge the couple does TOGETHER at this specific place
- Must start immediately, zero preparation needed
- Must be specific to this venue type — never generic
- Slightly competitive OR silly OR requires vulnerability
- Forbidden: "take a photo together", "share a dessert", "hold hands", anything wellness or therapy-adjacent
- Tone: a fun friend daring you, not a life coach assigning homework

GLOBAL RULES:
- Use only the place data provided — never invent specific menu items, staff names, or room details
- Tone: a friend who's been there, genuinely excited for them — not a travel brochure`;

const VENUE_SYSTEM_PROMPT_PRO = `You are a date experience writer for Blindfold, a couples date app. You are writing for premium subscribers — push for originality and specificity.

TITLE RULES:
- Max 5 words, evocative, captures the vibe of the experience
- Must NOT be the venue's name verbatim
- Must NOT be just a city or place name
- Think "Sunset & Slow Bites" not "Restaurant Riga"

DESCRIPTION RULES:
- Exactly 1 sentence, maximum 20 words
- Use the place name naturally
- Focus on atmosphere or what makes it distinctly worth visiting
- If reviews are missing, rely only on type + attributes + price level
- If the place is a Bar, Family restaurant, or Hamburger restaurant, do not mention intimate atmosphere or romance
- Banned words: charming, cozy, vibrant, perfect, hidden gem, delightful, lovely, unique, amazing, wonderful

MISSION RULES:
- 2-3 sentences max
- A fun challenge the couple does TOGETHER at this specific place
- Must start immediately, zero preparation needed
- Must be specific to this venue type — never generic
- Slightly competitive OR silly OR requires vulnerability
- Include a clear outcome: name a small forfeit or reward for the winner (e.g., "loser buys dessert", "winner picks next date")
- Forbidden: "take a photo together", "share a dessert", "hold hands", anything wellness or therapy-adjacent
- Tone: a fun friend daring you, not a life coach assigning homework
- The mission must feel fresh — not recycled from other date apps

MISSION ESCALATION — scale difficulty to the "Mission tier" in the prompt:
- BEGINNER (0–2 dates): warm and forgiving — the couple is still finding their rhythm. Low stakes, easy to start, no vulnerability required.
- REGULAR (3–9 dates): they know each other better — raise the ante. More daring, a bit sillier, medium stakes.
- VETERAN (10+ dates): they've done this before — go harder. More vulnerable, sillier, higher stakes. Assume they can handle it.

PREPARATION RULES:
- One short instruction: what to wear or bring to set the mood
- Start with "Wear" or "Bring" — max 15 words
- Specific to venue vibe — jazz bar ≠ hiking trail ≠ gallery
- Playful, one item or concept only (not a full outfit)
- Examples: "Wear something you'd want to be photographed in tonight", "Bring €5 in coins — trust the process"

CONVERSATION STARTER RULES:
- One question tailored to their interests AND this specific venue type
- Not generic — must feel like it belongs to this exact date
- Slightly unexpected, invites a real answer neither has rehearsed
- Max 25 words

GLOBAL RULES:
- Use only the place data provided — never invent specific menu items, staff names, or room details
- Tone: a friend who's been there, genuinely excited for them — not a travel brochure
- Draw on the couple's specific interests to make the output feel personally tailored, not generic`;

function missionTier(datesCompleted: number): string {
  if (datesCompleted >= 10) return "VETERAN";
  if (datesCompleted >= 3) return "REGULAR";
  return "BEGINNER";
}

// Structured single-line logger for AI events. Designed to be Vercel-log-grepable
// and trivial to forward to Sentry/PostHog later. Prefix tags ([ai-fallback],
// [ai-haiku-failed], [ai-fallback-failed]) act as event names.
function logAiEvent(tag: string, data: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.warn(`${tag} ${JSON.stringify(data)}`);
}

function describeErr(err: unknown) {
  if (err instanceof Error) {
    return { error: err.message, errorName: err.name };
  }
  return { error: String(err), errorName: "Unknown" };
}

function isOverloadError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const anyErr = err as unknown as { status?: number; statusCode?: number };
  if (anyErr.status === 529 || anyErr.statusCode === 529) return true;
  return err.message.includes("529") || err.message.toLowerCase().includes("overload");
}

async function callModel(
  model: string,
  system: string | undefined,
  prompt: string,
  maxAttempts = 3
): Promise<GeneratedDateIdea> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { output } = await generateText({
        model: anthropic(model),
        output: Output.object({ schema: DateIdeaSchema }),
        system,
        prompt,
      });
      return output;
    } catch (err) {
      const overloaded = isOverloadError(err);
      if (!overloaded || attempt === maxAttempts) throw err;
      // Exponential backoff: 1s, 2s, 4s before next attempt
      await new Promise((res) => setTimeout(res, 1000 * 2 ** (attempt - 1)));
    }
  }
  throw new Error("unreachable");
}

async function callWithFallback({
  system,
  prompt,
  isSubscribed,
}: {
  system?: string;
  prompt: string;
  isSubscribed: boolean;
}): Promise<GeneratedDateIdea> {
  const primaryModel = isSubscribed ? SONNET : HAIKU;
  try {
    return await callModel(primaryModel, system, prompt);
  } catch (err) {
    if (primaryModel === HAIKU) {
      // Free-tier path. No fallback model available — surface the failure.
      logAiEvent("[ai-haiku-failed]", { tier: "free", ...describeErr(err) });
      throw err;
    }
    // Plus-tier path. Sonnet failed; try Haiku silently from the user's
    // perspective but emit a structured log so we can monitor degradation.
    logAiEvent("[ai-fallback]", {
      from: "sonnet",
      to: "haiku",
      tier: "plus",
      ...describeErr(err),
    });
    try {
      return await callModel(HAIKU, system, prompt);
    } catch (fbErr) {
      logAiEvent("[ai-fallback-failed]", { tier: "plus", ...describeErr(fbErr) });
      throw fbErr;
    }
  }
}

export async function generateAIDateIdea({
  partnerNames,
  interests,
  budgetMax,
  dateOutside,
  dateAtHome,
  isSubscribed = false,
  datesCompleted = 0,
  previousTitles = [],
  venue,
}: {
  partnerNames: { partner1: string; partner2: string };
  interests: string[];
  budgetMax: number;
  dateOutside: boolean;
  dateAtHome: boolean;
  isSubscribed?: boolean;
  datesCompleted?: number;
  previousTitles?: string[];
  venue?: {
    name: string;
    address: string;
    rating: number;
    price_level: string;
    meta?: {
      primary_type_display_name?: string;
      editorial_summary?: string;
      user_rating_count?: number;
      reviews?: string[];
      outdoor_seating?: boolean;
      live_music?: boolean;
      serves_cocktails?: boolean;
      serves_beer?: boolean;
      serves_wine?: boolean;
      serves_dinner?: boolean;
      reservable?: boolean;
    };
  };
}): Promise<GeneratedDateIdea> {
  if (venue) {
    const venueAttributes = venue.meta
      ? Object.entries({
          outdoorSeating: venue.meta.outdoor_seating,
          liveMusic: venue.meta.live_music,
          servesCocktails: venue.meta.serves_cocktails,
          servesBeer: venue.meta.serves_beer,
          servesWine: venue.meta.serves_wine,
          servesDinner: venue.meta.serves_dinner,
          reservable: venue.meta.reservable,
        })
          .filter(([, v]) => v === true)
          .map(([k]) => k)
          .join(", ") || "not available"
      : "not available";

    const safeReviews = (venue.meta?.reviews ?? [])
      .map((r) => sanitize(r, 200))
      .filter(Boolean)
      .join(" | ");

    const tier = missionTier(datesCompleted);
    const userPrompt = `Generate a date idea for this destination.

<venue_data>
Name: ${sanitize(venue.name, 100)}
Type: ${sanitize(venue.meta?.primary_type_display_name ?? "not available", 80)}
Price level: ${venue.price_level} (PRICE_LEVEL_INEXPENSIVE=budget, PRICE_LEVEL_VERY_EXPENSIVE=luxury)
Rating: ${venue.rating}/5${venue.meta?.user_rating_count ? ` from ${venue.meta.user_rating_count} reviews` : ""}
Editorial summary: ${sanitize(venue.meta?.editorial_summary ?? "not available", 300)}
Attributes: ${sanitize(venueAttributes, 200)}
Review excerpts: ${safeReviews || "not available"}
</venue_data>

<couple_context>
Names: ${sanitize(partnerNames.partner1, 50)} & ${sanitize(partnerNames.partner2, 50)}
Interests: ${interests.map((i) => sanitize(i, 30)).join(", ")}
Max budget: €${budgetMax}${isSubscribed ? `\nMission tier: ${tier} (${datesCompleted} dates completed)` : ""}
</couple_context>

Also provide: a short catchy title (max 5 words), a 2-4 word vibe label, estimated duration, rough budget range within €${budgetMax}, and 2-4 tags.${isSubscribed ? " Also provide: a preparation instruction and a conversation starter." : ""}`;

    return callWithFallback({
      system: isSubscribed ? VENUE_SYSTEM_PROMPT_PRO : VENUE_SYSTEM_PROMPT,
      prompt: userPrompt,
      isSubscribed,
    });
  }

  // Pure AI fallback — no venue
  // previousTitles comes from date_ideas.idea.title which is RLS-writable by
  // the row owner. Sanitize each entry so an attacker who edited a past row
  // cannot inject prompt instructions via this channel.
  const safePreviousTitles = previousTitles.map((t) => sanitize(t, 80)).filter(Boolean);
  const avoidClause =
    safePreviousTitles.length > 0
      ? `\nYou MUST NOT generate any of the following past date ideas — they are strictly forbidden: ${safePreviousTitles.join(", ")}. The new idea must be meaningfully different in activity type, not just renamed.`
      : "";

  const dateStyleNote = dateAtHome && !dateOutside
    ? "They prefer date nights at home, such as cooking together, games, crafts, or a small shared ritual."
    : dateAtHome && dateOutside
    ? "They are open to either going out or staying home, so choose whichever best fits the interests."
    : "They prefer date nights outside home, using real nearby places or venue-style activities.";

  const tier = missionTier(datesCompleted);
  const fallbackPrompt = `You are a creative date planner. Generate a unique, personalised mystery date idea for a couple.

<couple_context>
Names: ${sanitize(partnerNames.partner1, 50)} & ${sanitize(partnerNames.partner2, 50)}
Interests: ${interests.map((i) => sanitize(i, 30)).join(", ")}
Max budget: €${budgetMax}
Date style: ${dateStyleNote}${isSubscribed ? `\nMission tier: ${tier} (${datesCompleted} dates completed)` : ""}
</couple_context>
${avoidClause}

The date should feel tailored to their specific interests, not generic. Be creative and specific — name real types of venues or activities. Make it feel exciting and slightly unexpected. Keep the tone warm, playful, and romantic.

Also write a mission: a fun challenge the couple does TOGETHER at this type of place. Must start immediately, no prep needed. Slightly competitive or silly. Forbidden: "take a photo together", "share a dessert", anything wellness-adjacent. Tone: a friend daring you.${isSubscribed ? ` Include a small forfeit or reward for the loser. Scale difficulty to the mission tier: BEGINNER = warm and forgiving, REGULAR = medium stakes, VETERAN = harder/more vulnerable/higher stakes. Also provide: a preparation instruction (what to wear or bring, max 15 words) and a conversation starter tailored to their interests (max 25 words).` : ""}`;

  return callWithFallback({ prompt: fallbackPrompt, isSubscribed });
}

const HOME_SYSTEM_PROMPT = `You are a home date experience designer for Blindfold, a couples app. You create intimate, creative date nights that happen entirely at home.

TITLE RULES:
- Max 5 words, evocative, captures the vibe of the evening
- Examples: "The Candlelit Trivia Showdown", "A Homemade Tasting Night"
- Banned words: charming, cozy, vibrant, perfect, hidden gem, delightful, lovely, unique, amazing, wonderful

DESCRIPTION RULES:
- Exactly 1 sentence, max 20 words
- Capture the mood and what makes this evening special
- Tone: warm, specific, slightly unexpected

MISSION RULES:
- 2-3 sentences: a fun challenge the couple does TOGETHER during the evening
- Must be achievable at home with no advance preparation
- Slightly competitive OR silly OR requires vulnerability
- Forbidden: anything wellness or therapy-adjacent
- Tone: a friend daring you, not a life coach

PREPARATION LIST RULES:
- 3-6 items to gather from around the house or easily purchase today
- Each item should be concrete and specific (not vague like "some snacks")
- Mix of things they probably have and one or two optional upgrades

STEP-BY-STEP RULES:
- Exactly 3 steps — no more, no fewer
- Each step describes atmosphere, activity, or transition — NOT administrative tasks
- Steps should feel like a story unfolding: set the mood → main activity → capture
- The THIRD and FINAL step MUST always start with "Capture the moment" followed by a short phrase specific to this date's activity (e.g. "Capture the moment — snap a photo before you clear the table" or "Capture the moment — your creations tonight deserve to be remembered"). Never generic; always tied to this specific date.

CONVERSATION STARTER RULES:
- Exactly 3 questions
- Each tailored to their specific interests AND this particular date theme
- Slightly unexpected — invites a real answer neither has rehearsed
- Max 25 words each

GLOBAL RULES:
- Budget is the max for any items to buy — lean toward free/household items
- Tone: a creative friend who planned something special, not a lifestyle blogger`;

const HOME_SYSTEM_PROMPT_PRO = `You are a home date experience designer for Blindfold, a couples app. You create intimate, creative date nights that happen entirely at home. You are writing for premium subscribers — push for originality and specificity.

TITLE RULES:
- Max 5 words, evocative, captures the vibe of the evening
- Examples: "The Candlelit Trivia Showdown", "A Homemade Tasting Night"
- Banned words: charming, cozy, vibrant, perfect, hidden gem, delightful, lovely, unique, amazing, wonderful

DESCRIPTION RULES:
- Exactly 1 sentence, max 20 words
- Capture the mood and what makes this evening special
- Tone: warm, specific, slightly unexpected

MISSION RULES:
- 2-3 sentences: a fun challenge the couple does TOGETHER during the evening
- Must be achievable at home with no advance preparation
- Slightly competitive OR silly OR requires vulnerability
- Include a clear outcome: name a small forfeit or reward for the winner
- Forbidden: anything wellness or therapy-adjacent
- Tone: a friend daring you, not a life coach

MISSION ESCALATION — scale difficulty to the "Mission tier" in the prompt:
- BEGINNER (0–2 dates): warm and forgiving. Low stakes, easy to start.
- REGULAR (3–9 dates): more daring, medium stakes.
- VETERAN (10+ dates): more vulnerable, higher stakes. Assume they can handle it.

PREPARATION LIST RULES:
- 3-6 items to gather from around the house or easily purchase today
- Each item should be concrete and specific (not vague like "some snacks")
- Mix of things they probably have and one or two optional upgrades
- One item should feel slightly unexpected or playful

STEP-BY-STEP RULES:
- Exactly 3 steps — no more, no fewer
- Each step describes atmosphere, activity, or transition — NOT administrative tasks
- Steps should feel like a story unfolding: set the mood → main activity → capture
- The THIRD and FINAL step MUST always start with "Capture the moment" followed by a short phrase specific to this date's activity (e.g. "Capture the moment — snap a photo before you clear the table" or "Capture the moment — your creations tonight deserve to be remembered"). Never generic; always tied to this specific date.

CONVERSATION STARTER RULES:
- Exactly 3 questions
- Each tailored to their specific interests AND this particular date theme
- Slightly unexpected — invites a real answer neither has rehearsed
- The third question should be the most vulnerable or revealing
- Max 25 words each

GLOBAL RULES:
- Budget is the max for any items to buy — lean toward free/household items
- Draw on the couple's specific interests to make every element feel personal
- Tone: a creative friend who planned something special, not a lifestyle blogger`;

export async function generateHomeDateIdea({
  partnerNames,
  interests,
  budgetMax,
  isSubscribed = false,
  datesCompleted = 0,
  previousTitles = [],
}: {
  partnerNames: { partner1: string; partner2: string };
  interests: string[];
  budgetMax: number;
  isSubscribed?: boolean;
  datesCompleted?: number;
  previousTitles?: string[];
}): Promise<GeneratedDateIdea> {
  const safePreviousTitles = previousTitles.map((t) => sanitize(t, 80)).filter(Boolean);
  const avoidClause =
    safePreviousTitles.length > 0
      ? `\nYou MUST NOT generate any of the following past date ideas: ${safePreviousTitles.join(", ")}. The new idea must be meaningfully different.`
      : "";

  const tier = missionTier(datesCompleted);
  const prompt = `Generate a home date night for this couple.

<couple_context>
Names: ${sanitize(partnerNames.partner1, 50)} & ${sanitize(partnerNames.partner2, 50)}
Interests: ${interests.map((i) => sanitize(i, 30)).join(", ")}
Max budget for any items to buy: €${budgetMax}${isSubscribed ? `\nMission tier: ${tier} (${datesCompleted} dates completed)` : ""}
</couple_context>
${avoidClause}

The date should feel tailored to their specific interests, not generic. Be creative — think beyond "cook together" or "movie night". Make it feel like a real event they wouldn't have thought of themselves.

Provide: title (max 5 words), description (1 sentence, max 20 words), vibe (2-4 words), mission (2-3 sentences), duration, budget_range within €${budgetMax}, tags (2-4), preparation_list (3-6 items), steps (exactly 3 steps — set the mood, main activity, then the FINAL step MUST start with "Capture the moment" followed by a short phrase specific to this date).${isSubscribed ? ` Scale mission difficulty to tier: BEGINNER = warm/forgiving, REGULAR = medium stakes, VETERAN = higher stakes/more vulnerable. Include a small forfeit or reward in the mission.` : ""}`;

  return callWithFallback({
    system: isSubscribed ? HOME_SYSTEM_PROMPT_PRO : HOME_SYSTEM_PROMPT,
    prompt,
    isSubscribed,
  });
}
