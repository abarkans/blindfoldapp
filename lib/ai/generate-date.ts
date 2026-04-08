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
    .min(2)
    .max(4)
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
}: {
  partnerNames: { partner1: string; partner2: string };
  interests: string[];
  budgetMax: number;
  hasCar: boolean;
  prefersWalking: boolean;
  previousTitles?: string[];
}): Promise<GeneratedDateIdea> {
  const avoidClause =
    previousTitles.length > 0
      ? `\nAvoid repeating these past date ideas: ${previousTitles.join(", ")}.`
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

Couple: ${partnerNames.partner1} & ${partnerNames.partner2}
Interests: ${interests.join(", ")}
Max budget: €${budgetMax}
${transportNote}${avoidClause}

The date should feel tailored to their specific interests, not generic. Be creative and specific — name real types of venues or activities. Make it feel exciting and slightly unexpected. Keep the tone warm, playful, and romantic.`,
  });

  return output;
}
