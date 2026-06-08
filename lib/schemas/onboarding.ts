import { z } from "zod";
import { MIN_INTEREST_CATEGORIES } from "@/lib/plans";

// Unicode-aware: allows letters from any script (Latin, CJK, Arabic, etc.),
// combining marks, spaces, hyphens, apostrophes, and dots (e.g. "O'Brien",
// "Mary-Jane", "J.K."). Blocks control characters and injection characters.
const nameRegex = /^[\p{L}\p{M}\s'\-.]+$/u;

// Collapse runs of combining marks down to one. Stops Zalgo-style stacking
// abuse (U+0300-range marks repeated until layout breaks) while preserving
// legitimate single-mark accents.
const collapseCombiningMarks = (s: string) => s.replace(/(\p{M})\p{M}+/gu, "$1");

export const identitySchema = z.object({
  partner1: z
    .string()
    .min(1, "Partner 1 name is required")
    .max(50, "Name too long")
    .regex(nameRegex, "Name contains invalid characters")
    .transform(collapseCombiningMarks),
  partner2: z
    .string()
    .max(50, "Name too long")
    .regex(
      /^[\p{L}\p{M}\s'\-.]*$/u,
      "Name contains invalid characters"
    )
    .transform(collapseCombiningMarks),
  partner_email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Enter a valid email",
    }),
});

export const interestsSchema = z.object({
  interests: z
    .array(z.string())
    .min(
      MIN_INTEREST_CATEGORIES,
      `Select at least ${MIN_INTEREST_CATEGORIES} categories`
    )
    .max(12, "Max 12 interests"),
});

export const logisticsSchema = z.object({
  budget_max: z.number().min(10).max(200),
  date_outside: z.boolean(),
  date_at_home: z.boolean(),
}).refine((d) => d.date_outside || d.date_at_home, {
  message: "Choose at least one date style",
  path: ["date_outside"],
});

export const frequencySchema = z.object({
  cadence: z.enum(["weekly", "biweekly", "monthly"]),
});

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  preferred_radius: z.number().min(1000).max(50000),
});

export const fullOnboardingSchema = z
  .object({
    partner1: identitySchema.shape.partner1,
    partner2: identitySchema.shape.partner2,
    interests: interestsSchema.shape.interests,
    budget_max: logisticsSchema.shape.budget_max,
    date_outside: logisticsSchema.shape.date_outside,
    date_at_home: logisticsSchema.shape.date_at_home,
    cadence: frequencySchema.shape.cadence,
    partner_email: identitySchema.shape.partner_email,
    checkout_session_id: z.string().max(255).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    preferred_radius: z.number().min(1000).max(50000).optional(),
  })
  .refine((d) => d.date_outside || d.date_at_home, {
    message: "Choose at least one date style",
    path: ["date_outside"],
  });

export const planSchema = z
  .object({
    plan_type: z.enum(["free", "subscription", "trial"]),
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
