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

  const prompt = venue
    ? `You are a creative date planner. Write a mystery date description for a specific venue.

Venue: ${venue.name}
Address: ${venue.address}
Rating: ${venue.rating}/5
Couple: ${partnerNames.partner1} & ${partnerNames.partner2}
Interests: ${interests.join(", ")}
Max budget: €${budgetMax}

Write a short catchy title (max 5 words), a playful 2-3 sentence description of what a date at this specific venue would feel like (second person, warm and romantic tone). Pick an emoji that fits the venue's vibe, a 2-4 word vibe label, estimated duration, rough budget range, and 2-4 tags. Make it feel exciting and personal — reference the type of place and what they could do there.`
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
