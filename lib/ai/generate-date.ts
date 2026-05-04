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
  emoji: z.string().describe("Single emoji that captures the vibe"),
  vibe: z.string().describe("2-4 word vibe label, e.g. 'Romantic & Adventurous'"),
  duration: z.string().describe("Estimated duration, e.g. '2–3 hours'"),
  budget_range: z
    .string()
    .describe("Budget range in euros, e.g. '€20–40'. Must fit within budget_max"),
  tags: z
    .array(z.string())
    .describe("2-4 short tags like 'Indoor', 'Evening', 'Active', 'Romantic'"),
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

GLOBAL RULES:
- Use only the place data provided — never invent specific menu items, staff names, or room details
- Tone: a friend who's been there, genuinely excited for them — not a travel brochure
- Draw on the couple's specific interests to make the output feel personally tailored, not generic`;

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
    const { output } = await generateText({
      model: anthropic(primaryModel),
      output: Output.object({ schema: DateIdeaSchema }),
      system,
      prompt,
    });
    return output;
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
      const { output } = await generateText({
        model: anthropic(HAIKU),
        output: Output.object({ schema: DateIdeaSchema }),
        system,
        prompt,
      });
      return output;
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
  hasCar,
  prefersWalking,
  isSubscribed = false,
  previousTitles = [],
  venue,
}: {
  partnerNames: { partner1: string; partner2: string };
  interests: string[];
  budgetMax: number;
  hasCar: boolean;
  prefersWalking: boolean;
  isSubscribed?: boolean;
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
Max budget: €${budgetMax}
</couple_context>

Also provide: a short catchy title (max 5 words), a single emoji, a 2-4 word vibe label, estimated duration, rough budget range within €${budgetMax}, and 2-4 tags.`;

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

  const transportNote = hasCar
    ? "They have access to a car so you can suggest destinations requiring travel."
    : prefersWalking
    ? "They prefer walking — keep destinations within walking distance."
    : "They have no car — keep destinations reachable by public transport.";

  const fallbackPrompt = `You are a creative date planner. Generate a unique, personalised mystery date idea for a couple.

<couple_context>
Names: ${sanitize(partnerNames.partner1, 50)} & ${sanitize(partnerNames.partner2, 50)}
Interests: ${interests.map((i) => sanitize(i, 30)).join(", ")}
Max budget: €${budgetMax}
Transport: ${transportNote}
</couple_context>
${avoidClause}

The date should feel tailored to their specific interests, not generic. Be creative and specific — name real types of venues or activities. Make it feel exciting and slightly unexpected. Keep the tone warm, playful, and romantic.

Also write a mission: a fun challenge the couple does TOGETHER at this type of place. Must start immediately, no prep needed. Slightly competitive or silly. Forbidden: "take a photo together", "share a dessert", anything wellness-adjacent. Tone: a friend daring you.${isSubscribed ? " Include a small forfeit or reward for the loser to raise the stakes." : ""}`;

  return callWithFallback({ prompt: fallbackPrompt, isSubscribed });
}
