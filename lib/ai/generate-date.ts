"use server";

import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const DateIdeaSchema = z.object({
  title: z.string().describe("Short catchy name for the date, max 5 words"),
  description: z
    .string()
    .describe(
      "2-3 sentence description of the date experience, written in second person, playful and exciting tone"
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
  const avoidClause =
    previousTitles.length > 0
      ? `\nYou MUST NOT generate any of the following past date ideas — they are strictly forbidden: ${previousTitles.join(", ")}. The new idea must be meaningfully different in activity type, not just renamed.`
      : "";

  const transportNote = hasCar
    ? "They have access to a car so you can suggest destinations requiring travel."
    : prefersWalking
    ? "They prefer walking — keep destinations within walking distance."
    : "They have no car — keep destinations reachable by public transport.";

  const venueAttributes = venue?.meta
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

  const prompt = venue
    ? `You are writing a date hype description for a couples app called Blindfold.
The couple just revealed their date destination. Make them excited to go.

PLACE DATA:
Name: ${venue.name}
Type: ${venue.meta?.primary_type_display_name ?? "not available"}
Price level: ${venue.price_level} (PRICE_LEVEL_INEXPENSIVE=budget, PRICE_LEVEL_VERY_EXPENSIVE=luxury)
Rating: ${venue.rating}/5${venue.meta?.user_rating_count ? ` from ${venue.meta.user_rating_count} reviews` : ""}
Editorial summary: ${venue.meta?.editorial_summary ?? "not available"}
Attributes: ${venueAttributes}
Review excerpts: ${venue.meta?.reviews?.join(" | ") ?? "not available"}

COUPLE CONTEXT:
Names: ${partnerNames.partner1} & ${partnerNames.partner2}
Interests: ${interests.join(", ")}
Max budget: €${budgetMax}

DESCRIPTION RULES:
1. Use only what's in the data — never invent specifics
2. You CAN use the place name naturally in the text
3. Write exactly 2 sentences for the description:
   - Sentence 1: what makes this place worth going to (atmosphere, vibe, reputation)
   - Sentence 2: one concrete thing they'll likely do, eat, drink, or experience there
4. Banned words: charming, cozy, vibrant, perfect, hidden gem, delightful, lovely, unique, amazing
5. If reviews are missing, rely only on type + attributes + price level
6. Tone: a friend who's been there, genuinely excited for them — not a travel brochure
7. If the place is a Bar, Family restaurant, or Hamburger restaurant, do not mention intimate atmosphere or romance

Also provide: a short catchy title (max 5 words), a single emoji that captures the vibe, a 2-4 word vibe label, estimated duration, rough budget range within €${budgetMax}, and 2-4 tags.`
    : `You are a creative date planner. Generate a unique, personalised mystery date idea for a couple.

Couple: ${partnerNames.partner1} & ${partnerNames.partner2}
Interests: ${interests.join(", ")}
Max budget: €${budgetMax}
${transportNote}${avoidClause}

The date should feel tailored to their specific interests, not generic. Be creative and specific — name real types of venues or activities. Make it feel exciting and slightly unexpected. Keep the tone warm, playful, and romantic.`;

  const { output } = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    output: Output.object({ schema: DateIdeaSchema }),
    prompt,
  });

  return output;
}
