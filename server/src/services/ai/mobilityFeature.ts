import { dataMessage, MOBILITY_SYSTEM } from '../../prompts';
import type { MobilityRequest } from '../../schemas';
import { contextForPrompt } from '../rules/common';
import { buildMobility, type MobilityResult } from '../rules/mobility';
import type { EnvironmentContext } from '../types';
import { generateStructured } from './generate';
import type { LlmClient } from './llmTypes';
import { MobilityNarrativeSchema, type MobilityNarrative } from './outputSchemas';

/**
 * Applies the model's wording to the computed result. Numbers, rankings and suitability always stay as computed,
 * and a mode flagged "not advised" keeps its rule-based note so the model cannot soften a safety warning.
 */
function mergeNarrative(computed: MobilityResult, narrative: MobilityNarrative): MobilityResult {
  return {
    ...computed,
    recommended: { ...computed.recommended, rationale: narrative.rationale },
    options: computed.options.map((option) => ({
      ...option,
      exposureNote:
        option.suitability === 'not_advised' ? option.exposureNote : (narrative.exposure_notes[option.mode] ?? option.exposureNote),
    })),
    additionalIdeas: narrative.additional_ideas,
  };
}

/** Mobility advice: all numbers are computed by rules; the LLM may only rewrite the explanation text. */
export async function generateMobility(llm: LlmClient | undefined, req: MobilityRequest, ctx: EnvironmentContext) {
  const computed = buildMobility(req, ctx.air);
  const narrative = await generateStructured<MobilityNarrative>({
    llm,
    label: 'mobility',
    system: MOBILITY_SYSTEM,
    user: dataMessage('Explain the recommended option and exposure trade-offs.', {
      context: contextForPrompt(ctx),
      request: {
        distanceKm: req.distanceKm,
        preferredMode: req.preferredMode,
        sensitive: req.sensitive || req.travellingWithChildrenOrElderly,
      },
      computed: {
        recommendedMode: computed.recommended.mode,
        options: computed.options.map(({ mode, label, emissionsKg, minutes, suitability }) => ({
          mode,
          label,
          emissionsKg,
          minutes,
          suitability,
        })),
      },
    }),
    schema: MobilityNarrativeSchema,
    fallback: () => ({
      rationale: computed.recommended.rationale,
      exposure_notes: Object.fromEntries(computed.options.map((o) => [o.mode, o.exposureNote])),
      additional_ideas: computed.additionalIdeas,
    }),
    finalize: (n) => n,
    actualAqi: ctx.air.aqi,
  });
  return {
    data: mergeNarrative(computed, narrative.data),
    generatedBy: narrative.generatedBy,
    model: narrative.model,
    fallbackReason: narrative.fallbackReason,
  };
}
