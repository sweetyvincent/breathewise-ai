import { dataMessage, INDOOR_SYSTEM } from '../../prompts';
import type { HomeProfile } from '../../schemas';
import { contextForPrompt } from '../rules/common';
import { buildIndoorPlan, recommendedCadr } from '../rules/indoor';
import type { EnvironmentContext } from '../types';
import { ensureAdvisory } from './advisory';
import { generateStructured } from './generate';
import type { LlmClient } from './llmTypes';
import { IndoorSchema, type IndoorPlan } from './outputSchemas';

/** Indoor air advice: the purifier size is computed here and handed to the model, never invented by it. */
export function generateIndoorPlan(llm: LlmClient | undefined, home: HomeProfile, ctx: EnvironmentContext) {
  const sizing = recommendedCadr(home, ctx.air.category.level);
  return generateStructured<IndoorPlan>({
    llm,
    label: 'indoor',
    system: INDOOR_SYSTEM,
    user: dataMessage('Generate indoor air-quality recommendations.', {
      context: contextForPrompt(ctx),
      home,
      computedPurifierSizing: sizing,
    }),
    schema: IndoorSchema,
    fallback: () => buildIndoorPlan(home, ctx),
    finalize: (plan) => ({
      ...plan,
      risk_level: ctx.air.category.risk,
      purifier_guidance: { ...plan.purifier_guidance, recommended_cadr_m3h: sizing.cadr },
      important_note: ensureAdvisory(plan.important_note),
    }),
    actualAqi: ctx.air.aqi,
  });
}
