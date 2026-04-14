"use server";

import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

/**
 * Strip characters that could be used to break out of XML tags or inject new
 * prompt sections, then hard-cap length. Applied to all user-derived strings
 * and untrusted third-party content (Google reviews) before they enter prompts.
 */
function sanitize(value: string, maxLen = 200): string {
  return value
    .replace(/[<>]/g, "")   // strip XML tag delimiters (prevents breaking out of <venue_data> etc.)
    .replace(/\n/g, " ")    // flatten ALL newlines → space (prevents "Ignore prior instructions\n..." injections)
    .replace(/ {3,}/g, "  ") // collapse runs of 3+ spaces left behind by newline replacement
    .trim()
    .slice(0, maxLen);
}

const DateIdeaSchema = z.object({
  title: z.string().describe("Short catchy name for the date, max 5 words"),
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

export async function generateAIDateIdea({
  partnerNames,
  interests,
  budgetMax,
  hasCar,
  prefersWalking,
  previousTitles = [],
  venue,
}: {
  partnerNames: { partner1: string; partner2: string };
  interests: string[];
  budgetMax: number;
  hasCar: boolean;
  prefersWalking: boolean;
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

    const { output } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      output: Output.object({ schema: DateIdeaSchema }),
      system: VENUE_SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    return output;
  }

  // Pure AI fallback — no venue
  const avoidClause =
    previousTitles.length > 0
      ? `\nYou MUST NOT generate any of the following past date ideas — they are strictly forbidden: ${previousTitles.join(", ")}. The new idea must be meaningfully different in activity type, not just renamed.`
      : "";

  const transportNote = hasCar
    ? "They have access to a car so you can suggest destinations requiring travel."
    : prefersWalking
    ? "They prefer walking — keep destinations within walking distance."
    : "They have no car — keep destinations reachable by public transport.";

  const { output } = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    output: Output.object({ schema: DateIdeaSchema }),
    prompt: `You are a creative date planner. Generate a unique, personalised mystery date idea for a couple.

<couple_context>
Names: ${sanitize(partnerNames.partner1, 50)} & ${sanitize(partnerNames.partner2, 50)}
Interests: ${interests.map((i) => sanitize(i, 30)).join(", ")}
Max budget: €${budgetMax}
Transport: ${transportNote}
</couple_context>
${avoidClause}

The date should feel tailored to their specific interests, not generic. Be creative and specific — name real types of venues or activities. Make it feel exciting and slightly unexpected. Keep the tone warm, playful, and romantic.

Also write a mission: a fun challenge the couple does TOGETHER at this type of place. Must start immediately, no prep needed. Slightly competitive or silly. Forbidden: "take a photo together", "share a dessert", anything wellness-adjacent. Tone: a friend daring you.`,
  });

  return output;
}
