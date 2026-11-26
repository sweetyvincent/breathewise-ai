import { dataMessage, PLAN_SYSTEM } from '../../prompts';
import type { PlanProfile } from '../../schemas';
import { contextForPrompt } from '../rules/common';
import { buildDailyPlan } from '../rules/dailyPlan';
import type { EnvironmentContext } from '../types';
import { ensureAdvisory } from './advisory';
import { generateStructured } from './generate';
import type { LlmClient } from './llmTypes';
import { DailyPlanSchema, type DailyPlan } from './outputSchemas';

/** Personalised daily plan: LLM draft when available, otherwise the rules engine. */
export function generateDailyPlan(llm: LlmClient | undefined, profile: PlanProfile, ctx: EnvironmentContext) {
  return generateStructured<DailyPlan>({
    llm,
    label: 'daily-plan',
    system: PLAN_SYSTEM,
    user: dataMessage('Generate the personalised daily plan.', { context: contextForPrompt(ctx), user: profile }),
    schema: DailyPlanSchema,
    fallback: () => buildDailyPlan(profile, ctx),
    // Server-computed facts always win over model output.
    finalize: (plan) => ({ ...plan, risk_level: ctx.air.category.risk, important_note: ensureAdvisory(plan.important_note) }),
    actualAqi: ctx.air.aqi,
  });
}
