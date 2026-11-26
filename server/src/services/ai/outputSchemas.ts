/** Zod schemas for every LLM output; anything that does not match is rejected before it reaches users. */
import { z } from 'zod';

const riskLevel = z.enum(['low', 'moderate', 'high', 'very_high']);

export const DailyPlanSchema = z.object({
  air_quality_summary: z.string().min(10).max(500),
  risk_level: riskLevel,
  daily_recommendations: z
    .array(
      z.object({
        time: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']),
        action: z.string().min(3).max(220),
        reason: z.string().min(3).max(320),
        impact: z.string().min(3).max(320),
      }),
    )
    .min(4)
    .max(16),
  indoor_tips: z.array(z.string().min(3).max(260)).min(1).max(8),
  sustainable_actions: z.array(z.string().min(3).max(260)).min(1).max(8),
  important_note: z.string().min(5).max(500),
});
export type DailyPlan = z.infer<typeof DailyPlanSchema>;

const solution = z.object({
  title: z.string().min(3).max(120),
  detail: z.string().min(3).max(320),
  why: z.string().min(3).max(320),
  evidence: z.enum(['strong', 'moderate', 'limited']),
  fits_budget: z.boolean().default(true),
});

export const IndoorSchema = z.object({
  summary: z.string().min(10).max(500),
  risk_level: riskLevel,
  ventilation_advice: z.object({ action: z.string().min(3).max(260), reason: z.string().min(3).max(320) }),
  purifier_guidance: z.object({
    recommended_cadr_m3h: z.number().nullable(),
    note: z.string().min(3).max(500),
  }),
  solutions: z.object({
    free: z.array(solution).min(1).max(8),
    low_budget: z.array(solution).min(1).max(8),
    advanced: z.array(solution).min(1).max(8),
  }),
  maintenance_reminders: z.array(z.string().min(3).max(220)).min(1).max(8),
  myths: z
    .array(z.object({ myth: z.string().min(3).max(200), reality: z.string().min(3).max(360) }))
    .min(1)
    .max(8),
  important_note: z.string().min(5).max(500),
});
export type IndoorPlan = z.infer<typeof IndoorSchema>;
export type Solution = z.infer<typeof solution>;

/** What the LLM is allowed to write for mobility. All numbers are computed deterministically on the server. */
export const MobilityNarrativeSchema = z.object({
  rationale: z.string().min(10).max(600),
  exposure_notes: z.record(z.string(), z.string().max(300)).default({}),
  additional_ideas: z.array(z.string().min(3).max(240)).min(1).max(6),
});
export type MobilityNarrative = z.infer<typeof MobilityNarrativeSchema>;
