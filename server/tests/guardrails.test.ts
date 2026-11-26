import { describe, expect, it } from 'vitest';
import { generateStructured } from '../src/services/ai/generate';
import { screenText } from '../src/services/ai/guardrails';
import { DailyPlanSchema } from '../src/services/ai/outputSchemas';
import { buildDailyPlan } from '../src/services/rules/dailyPlan';
import type { PlanProfile } from '../src/schemas';
import { contextWithAqi, mockLlm } from './helpers';

const profile: PlanProfile = {
  ageGroup: 'adult',
  occupation: 'office',
  commute: 'metro',
  outdoorFrequency: 'weekly',
  lifestyle: [],
  sensitivities: [],
  workHours: { start: '09:00', end: '17:00' },
};

describe('screenText', () => {
  it.each([
    'This air is completely safe for everyone.',
    'You probably have asthma, so take 20 mg of the inhaler.',
    'Snake plants purify the air in your bedroom and remove toxins.',
    'This purifier cures respiratory illness.',
  ])('rejects: %s', (t) => {
    expect(screenText([t]).ok).toBe(false);
  });

  it('accepts hedged, evidence-based text and plant myth-busting', () => {
    expect(screenText(['Plants do not meaningfully clean the air in a normal room.', 'A HEPA purifier can lower indoor PM2.5.']).ok).toBe(
      true,
    );
  });

  it('rejects invented AQI figures but allows real values and standard thresholds', () => {
    expect(screenText(['The AQI is 120 right now.'], { actualAqi: 260 }).ok).toBe(false);
    expect(screenText(['The AQI is 258 right now.'], { actualAqi: 260 }).ok).toBe(true);
    expect(screenText(['If AQI reaches 300, stay indoors.'], { actualAqi: 260 }).ok).toBe(true);
  });
});

describe('generateStructured (AI output validation)', () => {
  const build = async () => {
    const ctx = await contextWithAqi(260);
    const good = buildDailyPlan(profile, ctx);
    return { ctx, good };
  };
  const run = async (llm: ReturnType<typeof mockLlm> | undefined, ctx: Awaited<ReturnType<typeof build>>['ctx']) =>
    generateStructured({
      llm,
      label: 'test',
      system: 's',
      user: 'u',
      schema: DailyPlanSchema,
      fallback: () => buildDailyPlan(profile, ctx),
      finalize: (d) => ({ ...d, risk_level: ctx.air.category.risk }),
      actualAqi: ctx.air.aqi,
    });

  it('falls back to rules when no API key / LLM is configured', async () => {
    const { ctx } = await build();
    const out = await run(undefined, ctx);
    expect(out.generatedBy).toBe('rules');
    expect(out.fallbackReason).toBe('no_api_key');
    expect(DailyPlanSchema.safeParse(out.data).success).toBe(true);
  });

  it('uses valid model output and overrides risk level with the server-computed value', async () => {
    const { ctx, good } = await build();
    const out = await run(mockLlm({ json: () => ({ ...good, risk_level: 'low' }) }), ctx);
    expect(out.generatedBy).toBe('openai');
    expect(out.data.risk_level).toBe('high'); // AQI 260 → Poor → high; model's "low" is ignored
  });

  it('falls back when the model returns malformed JSON structure', async () => {
    const { ctx } = await build();
    const out = await run(mockLlm({ json: () => ({ hello: 'world' }) }), ctx);
    expect(out.generatedBy).toBe('rules');
    expect(out.fallbackReason).toBe('invalid_output');
  });

  it('falls back when the model invents an AQI value', async () => {
    const { ctx, good } = await build();
    const bad = { ...good, air_quality_summary: 'The AQI is 45 today, which is Good, so enjoy the outdoors.' };
    const out = await run(mockLlm({ json: () => bad }), ctx);
    expect(out.fallbackReason).toBe('safety_screen');
    expect(out.generatedBy).toBe('rules');
  });

  it('falls back when the API call throws', async () => {
    const { ctx } = await build();
    const out = await run(mockLlm({}), ctx);
    expect(out.fallbackReason).toBe('ai_error');
  });
});
