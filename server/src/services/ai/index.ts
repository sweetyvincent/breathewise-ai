import type { HomeProfile, MobilityRequest, PlanProfile } from '../../schemas';
import type { MobilityResult } from '../rules/mobility';
import type { EnvironmentContext } from '../types';
import { answerChat, type ChatArgs, type ChatOutcome } from './chatFeature';
import { generateDailyPlan } from './dailyPlanFeature';
import type { Generated } from './generate';
import { generateIndoorPlan } from './indoorFeature';
import type { LlmClient } from './llmTypes';
import { generateMobility } from './mobilityFeature';
import type { DailyPlan, IndoorPlan } from './outputSchemas';

/**
 * The recommendation engine. Each method returns an LLM draft that has been schema-validated and safety-screened,
 * or the deterministic rules-engine answer when no model is configured or its output is rejected.
 */
export interface AiService {
  readonly engine: 'openai' | 'rules';
  dailyPlan(profile: PlanProfile, ctx: EnvironmentContext): Promise<Generated<DailyPlan>>;
  indoor(home: HomeProfile, ctx: EnvironmentContext): Promise<Generated<IndoorPlan>>;
  mobility(req: MobilityRequest, ctx: EnvironmentContext): Promise<Generated<MobilityResult>>;
  chat(args: ChatArgs): Promise<ChatOutcome>;
}

export function createAiService(llm?: LlmClient): AiService {
  return {
    engine: llm ? 'openai' : 'rules',
    dailyPlan: (profile, ctx) => generateDailyPlan(llm, profile, ctx),
    indoor: (home, ctx) => generateIndoorPlan(llm, home, ctx),
    mobility: (req, ctx) => generateMobility(llm, req, ctx),
    chat: (args) => answerChat(llm, args),
  };
}
