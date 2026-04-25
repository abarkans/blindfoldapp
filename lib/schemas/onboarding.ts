import { z } from "zod";

// Unicode-aware: allows letters from any script (Latin, CJK, Arabic, etc.),
// combining marks, spaces, hyphens, apostrophes, and dots (e.g. "O'Brien",
// "Mary-Jane", "J.K."). Blocks control characters and injection characters.
const nameRegex = /^[\p{L}\p{M}\s'\-.]+$/u;

export const identitySchema = z.object({
  partner1: z
    .string()
    .min(1, "Partner 1 name is required")
    .max(50, "Name too long")
    .regex(nameRegex, "Name contains invalid characters"),
  partner2: z
    .string()
    .min(1, "Partner 2 name is required")
    .max(50, "Name too long")
    .regex(nameRegex, "Name contains invalid characters"),
});

export const interestsSchema = z.object({
  interests: z
    .array(z.string())
    .min(1, "Select at least one interest")
    .max(10, "Max 10 interests"),
});

export const logisticsSchema = z.object({
  budget_max: z.number().min(10).max(200),
  has_car: z.boolean(),
  prefers_walking: z.boolean(),
});

export const frequencySchema = z.object({
  cadence: z.enum(["weekly", "biweekly", "monthly", "spontaneous"]),
});

export const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  preferred_radius: z.number().min(1000).max(50000),
});

export const fullOnboardingSchema = z.object({
  partner1: identitySchema.shape.partner1,
  partner2: identitySchema.shape.partner2,
  interests: interestsSchema.shape.interests,
  budget_max: logisticsSchema.shape.budget_max,
  has_car: logisticsSchema.shape.has_car,
  prefers_walking: logisticsSchema.shape.prefers_walking,
  cadence: frequencySchema.shape.cadence,
  lat: z.number().optional(),
  lng: z.number().optional(),
  preferred_radius: z.number().optional(),
});

export const planSchema = z
  .object({
    plan_type: z.enum(["free", "subscription"]),
    cadence: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  })
  .refine(
    (d) => d.plan_type !== "subscription" || d.cadence !== undefined,
    { message: "Please select a frequency", path: ["cadence"] }
  );

export type PlanFormData = z.infer<typeof planSchema>;

export type IdentityFormData = z.infer<typeof identitySchema>;
export type InterestsFormData = z.infer<typeof interestsSchema>;
export type LogisticsFormData = z.infer<typeof logisticsSchema>;
export type FrequencyFormData = z.infer<typeof frequencySchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type FullOnboardingData = z.infer<typeof fullOnboardingSchema>;
