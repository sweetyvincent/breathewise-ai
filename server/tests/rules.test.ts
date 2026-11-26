import { describe, expect, it } from 'vitest';
import { collectStrings, screenText } from '../src/services/ai/guardrails';
import { DailyPlanSchema, IndoorSchema } from '../src/services/ai/outputSchemas';
import { buildChatReply, detectIntent } from '../src/services/rules/chat';
import { buildDailyPlan } from '../src/services/rules/dailyPlan';
import { buildIndoorPlan, recommendedCadr } from '../src/services/rules/indoor';
import { assessExposure, buildMobility } from '../src/services/rules/mobility';
import type { HomeProfile, MobilityRequest, PlanProfile } from '../src/schemas';
import { contextWithAqi, DELHI, simulatedContext } from './helpers';

const adult: PlanProfile = {
  ageGroup: 'adult',
  occupation: 'office',
  commute: 'car',
  outdoorFrequency: 'several_per_week',
  lifestyle: ['outdoor_exercise', 'cooks_daily'],
  sensitivities: [],
  workHours: { start: '09:00', end: '17:00' },
};
const home: HomeProfile = {
  sizeSqm: 80,
  rooms: 3,
  budget: 'medium',
  hasChildren: true,
  hasElderly: false,
  hasPets: true,
  ventilation: 'limited',
  hasAirConditioner: true,
  cooksIndoors: true,
  usesIncenseOrCandles: false,
  smokersInHome: false,
};
const trip = (over: Partial<MobilityRequest> = {}): MobilityRequest => ({
  location: DELHI,
  distanceKm: 8,
  preferredMode: 'car_petrol',
  tripsPerWeek: 5,
  travellingWithChildrenOrElderly: false,
  sensitive: false,
  ...over,
});

describe('daily plan rules', () => {
  it('produces schema-valid output covering all four times of day', async () => {
    const plan = buildDailyPlan(adult, await contextWithAqi(260));
    expect(DailyPlanSchema.safeParse(plan).success).toBe(true);
    const times = new Set(plan.daily_recommendations.map((r) => r.time));
    expect(times).toEqual(new Set(['Morning', 'Afternoon', 'Evening', 'Night']));
  });

  it('moves exercise indoors and keeps windows closed when air is poor', async () => {
    const text = JSON.stringify(buildDailyPlan(adult, await contextWithAqi(260)).daily_recommendations).toLowerCase();
    expect(text).toContain('indoor exercise');
    expect(text).toContain('windows closed');
  });

  it('allows outdoor exercise when air is good', async () => {
    const text = JSON.stringify(buildDailyPlan(adult, await contextWithAqi(35)).daily_recommendations).toLowerCase();
    expect(text).toContain('outdoor exercise is reasonable');
  });

  it('adds extra caution for sensitive users at the same AQI', async () => {
    const ctx = await contextWithAqi(150); // Moderate
    const plain = JSON.stringify(buildDailyPlan(adult, ctx).daily_recommendations);
    const senior = JSON.stringify(buildDailyPlan({ ...adult, ageGroup: 'senior' }, ctx).daily_recommendations);
    expect(senior).not.toEqual(plain);
    expect(senior.toLowerCase()).toContain('indoor exercise'); // escalated one level
  });

  it('references a doctor plan only for users who volunteer a respiratory condition', async () => {
    const ctx = await contextWithAqi(150);
    const recs = (p: PlanProfile) => JSON.stringify(buildDailyPlan(p, ctx).daily_recommendations).toLowerCase();
    expect(recs(adult)).not.toContain('doctor');
    expect(recs({ ...adult, sensitivities: ['asthma'] })).toContain('doctor');
  });

  it('does not push walking/cycling commuters outdoors when air is very poor', async () => {
    const plan = buildDailyPlan({ ...adult, commute: 'cycle' }, await contextWithAqi(350));
    const commute = plan.daily_recommendations.find((r) => r.time === 'Afternoon' && /cycl|walk|metro|bus/i.test(r.action));
    expect(commute?.action.toLowerCase()).toMatch(/shorten|switch to metro/);
  });

  it('always recommends following official advisories and labels simulated data', async () => {
    const plan = buildDailyPlan(adult, await contextWithAqi(260));
    expect(plan.important_note.toLowerCase()).toContain('official');
    expect(plan.air_quality_summary).toContain('SIMULATED');
  });
});

describe('indoor rules', () => {
  it('returns schema-valid output with free, low-budget and advanced tiers', async () => {
    const out = buildIndoorPlan(home, await contextWithAqi(260));
    expect(IndoorSchema.safeParse(out).success).toBe(true);
    expect(out.solutions.free.length).toBeGreaterThan(0);
    expect(out.solutions.low_budget.length).toBeGreaterThan(0);
    expect(out.solutions.advanced.length).toBeGreaterThan(0);
  });

  it('sizes purifiers from room volume and air changes per hour', () => {
    const { cadr, ach } = recommendedCadr(home, 3);
    expect(ach).toBe(5);
    expect(cadr).toBeGreaterThanOrEqual(26.67 * 2.7 * 5);
    expect(cadr % 10).toBe(0);
  });

  it('flags items that exceed the budget instead of hiding them', async () => {
    const out = buildIndoorPlan({ ...home, budget: 'free' }, await contextWithAqi(260));
    expect(out.solutions.advanced.every((s) => s.fits_budget === false)).toBe(true);
    expect(out.solutions.free.every((s) => s.fits_budget)).toBe(true);
  });

  it('says to keep windows shut in poor air and ventilate when air is clean', async () => {
    expect(buildIndoorPlan(home, await contextWithAqi(260)).ventilation_advice.action.toLowerCase()).toContain('closed');
    expect(buildIndoorPlan(home, await contextWithAqi(30)).ventilation_advice.action.toLowerCase()).toContain('open windows');
  });

  it('debunks the indoor-plants myth and never claims plants clean the air', async () => {
    const out = buildIndoorPlan(home, await contextWithAqi(180));
    expect(out.myths.some((m) => /plant/i.test(m.myth) && /not at normal room scale/i.test(m.reality))).toBe(true);
    expect(screenText(collectStrings(out)).ok).toBe(true);
  });

  it('distinguishes purifiers from air conditioners', async () => {
    const note = buildIndoorPlan(home, await contextWithAqi(180)).purifier_guidance.note.toLowerCase();
    expect(note).toContain('air conditioner');
    expect(note).toContain('respirator');
  });
});

describe('mobility rules', () => {
  it('does NOT assume walking/cycling is healthiest in severe pollution', () => {
    expect(assessExposure('walk', 3, 5, false).suitability).toBe('not_advised');
    expect(assessExposure('cycle', 6, 4, false).suitability).toBe('not_advised');
    expect(assessExposure('cycle', 4, 3, true).suitability).toBe('not_advised');
  });

  it('allows short active trips with a caution in poor air', () => {
    expect(assessExposure('walk', 1, 3, false).suitability).toBe('caution');
  });

  it('endorses active travel when air is good', () => {
    expect(assessExposure('cycle', 5, 0, false).suitability).toBe('ok');
  });

  it('marks modes impractical beyond their range', () => {
    expect(assessExposure('walk', 30, 0, false).suitability).toBe('impractical');
  });

  it('recommends transit (not walking) for a 3 km trip in severe air', async () => {
    const r = buildMobility(trip({ distanceKm: 3 }), (await contextWithAqi(420)).air);
    expect(['metro', 'bus']).toContain(r.recommended.mode);
    expect(r.options.find((o) => o.mode === 'walk')?.suitability).toBe('not_advised');
  });

  it('recommends a zero-emission mode for a short trip when air is good', async () => {
    const r = buildMobility(trip({ distanceKm: 2 }), (await contextWithAqi(30)).air);
    expect(['walk', 'cycle']).toContain(r.recommended.mode);
  });

  it('computes savings against the preferred mode and weekly totals consistently', async () => {
    const r = buildMobility(trip({ distanceKm: 10, tripsPerWeek: 4 }), (await contextWithAqi(150)).air);
    const best = r.options.find((o) => o.mode === r.recommended.mode)!;
    expect(best.savedVsPreferredKg).toBeCloseTo(1.7 - best.emissionsKg, 2);
    expect(r.weekly.savedKg).toBeCloseTo(best.savedVsPreferredKg * 4, 1);
    expect(r.assumptions.length).toBeGreaterThan(3);
  });

  it('never recommends an option rated not advised or impractical', async () => {
    for (const aqi of [20, 120, 250, 350, 450]) {
      const r = buildMobility(trip({ distanceKm: 4, sensitive: aqi > 200 }), (await contextWithAqi(aqi)).air);
      expect(r.recommended.mode).toBeTruthy();
      const rec = r.options.find((o) => o.mode === r.recommended.mode)!;
      expect(['recommended']).toContain(rec.suitability);
    }
  });
});

describe('chat rules', () => {
  it.each([
    ['Is it safe to go outside today?', 'outside'],
    ['Should my children play outdoors?', 'children'],
    ['Is opening windows a good idea right now?', 'windows'],
    ['How can I improve air quality in my bedroom?', 'bedroom'],
    ['Which is better: an air purifier or an air conditioner?', 'purifier_vs_ac'],
    ['What should I do if AQI reaches 300?', 'aqi300'],
    ['How can I commute with less pollution exposure?', 'commute'],
    ['What are the most affordable ways to protect my family?', 'affordable'],
  ])('detects intent for "%s"', (q, intent) => {
    expect(detectIntent(q)).toBe(intent);
  });

  it('refuses to invent data when no location is selected', () => {
    const reply = buildChatReply('Is it safe to go outside?', null);
    expect(reply).toMatch(/don't have air-quality data/i);
    expect(reply).not.toMatch(/AQI\s*\*{0,2}\s*\d/);
  });

  it('quotes the real AQI, flags simulated data and recommends official guidance', async () => {
    const ctx = await contextWithAqi(260);
    const reply = buildChatReply('Is it safe to go outside today?', ctx);
    expect(reply).toContain('260');
    expect(reply).toContain('SIMULATED');
    expect(reply.toLowerCase()).toContain('official');
    expect(reply).not.toMatch(/completely safe/i);
  });

  it('separates personal exposure from emissions in commute advice', async () => {
    const reply = buildChatReply('How can I commute with less pollution?', await simulatedContext());
    expect(reply.toLowerCase()).toMatch(/emissions/);
  });
});
