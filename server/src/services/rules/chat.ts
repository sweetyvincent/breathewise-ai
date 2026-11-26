/** Rules-based BreatheBot: detects the question type and answers from real air-quality data. */
import { POLLUTANT_META } from '../../lib/aqi';
import type { AirQualityResult, EnvironmentContext } from '../types';
import { cleanestWindow, dataLabel, OFFICIAL_ADVISORY_NOTE } from './common';

type Intent = 'outside' | 'children' | 'windows' | 'bedroom' | 'purifier_vs_ac' | 'aqi300' | 'commute' | 'affordable' | 'mask' | 'general';

const INTENTS: Array<[Intent, RegExp]> = [
  ['purifier_vs_ac', /(purifier|air cleaner).*(air ?con|\bac\b)|(air ?con|\bac\b).*(purifier|air cleaner)/i],
  ['aqi300', /\b(300|400|500)\b|very poor|severe/i],
  ['children', /child|kid|baby|infant|school|play/i],
  ['windows', /window|ventilat|open the door|fresh air/i],
  ['bedroom', /bedroom|sleep|night/i],
  ['commute', /commut|travel|drive|bike|cycl|walk to|bus|metro|ride/i],
  ['mask', /mask|respirator|n95|ffp2/i],
  ['affordable', /afford|cheap|budget|low[- ]cost|free|save money/i],
  ['outside', /outside|outdoor|go out|jog|run|exercise|walk|safe/i],
];

export function detectIntent(question: string): Intent {
  return INTENTS.find(([, re]) => re.test(question))?.[0] ?? 'general';
}

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join('\n');

/** Facts every intent-specific answer may draw on, computed once per question. */
interface ReplyContext {
  /** Caution tier from the AQI category (0 = good … 5 = severe). */
  level: number;
  /** One line about the cleanest upcoming daytime window; empty when no forecast exists. */
  winLine: string;
  /** Extra-caution paragraph for children, older adults and people with lung or heart conditions. */
  sens: string;
}

type BodyBuilder = (c: ReplyContext) => string;

/** Picks the sentence for the current pollution tier: calm/high (level 3+), and optionally a middle tier (level 2). */
function byLevel(level: number, tiers: { high: string; middle: string; low: string }): string {
  if (level >= 3) return tiers.high;
  return level === 2 ? tiers.middle : tiers.low;
}

/** One answer builder per intent; keeping them in a table makes adding a question type a one-entry change. */
const BODY_BUILDERS: Record<Intent, BodyBuilder> = {
  outside: ({ level, winLine, sens }) =>
    [
      level <= 1
        ? '**Going outside:** Conditions are generally fine for most people; sensitive individuals may prefer lighter activity.'
        : level === 2
          ? '**Going outside:** Okay for most people for short periods; keep exercise light and avoid busy roads.'
          : '**Going outside:** Limit time and exertion outdoors. Choose indoor exercise and keep essential trips short.',
      winLine,
      '',
      sens,
      '',
      '**Why it helps:** Harder breathing during exertion pulls more particles deep into the lungs, so lighter or indoor activity lowers your personal exposure.',
    ].join('\n'),

  children: ({ level, winLine, sens }) =>
    [
      byLevel(level, {
        high: '**Children outdoors:** Avoid prolonged outdoor play today; choose indoor games or a short, calm outing instead.',
        middle: '**Children outdoors:** Shorter, gentler play is reasonable; avoid busy roads and watch for coughing or discomfort.',
        low: '**Children outdoors:** Normal play is generally fine; keep an eye out if a child is sensitive.',
      }),
      winLine,
      '',
      sens,
      '',
      '**Practical tips:** Check with the school about indoor sports on high-pollution days; keep any prescribed medication handy and follow your child’s doctor’s advice.',
    ].join('\n'),

  windows: ({ level, winLine }) =>
    [
      byLevel(level, {
        high: '**Opening windows:** Not a good idea right now; outdoor air is worse than what you likely have indoors, so keep them closed except for brief cooking ventilation.',
        middle: '**Opening windows:** Brief airing (10–15 minutes) in the cleanest part of the day is reasonable, then close up.',
        low: '**Opening windows:** Yes, cross-ventilate for 15+ minutes; fresh air dilutes indoor pollutants.',
      }),
      winLine,
      '',
      '**Why:** Ventilation only helps when outdoor air is cleaner than indoor air.',
    ].join('\n'),

  bedroom: () =>
    [
      '**Improving bedroom air:**',
      bullets([
        'Keep windows closed during peak hours and seal obvious gaps (low-cost foam strips).',
        'Run a properly sized HEPA purifier with the door closed if you can afford one; a DIY box-fan filter is a cheaper alternative.',
        'Wet-mop and damp-dust, wash bedding weekly, and avoid incense, coils and candles.',
      ]),
      '',
      '**Why:** You spend many hours asleep, so cleaner bedroom air has an outsized effect on total exposure.',
    ].join('\n'),

  purifier_vs_ac: () =>
    [
      '**Purifier or air conditioner?** They do different jobs.',
      bullets([
        'A HEPA purifier removes fine particles (PM2.5) from room air; it does not cool.',
        'An air conditioner cools and often dehumidifies, but most do not filter fine particles and some recirculate indoor air.',
        'For smog, a purifier is the better first investment; keep the AC filter clean either way.',
      ]),
    ].join('\n'),

  aqi300: () =>
    [
      '**If AQI reaches 300 or more (Poor to Very Poor):**',
      bullets([
        'Stay indoors as much as practical; postpone strenuous outdoor activity.',
        'Keep windows closed; run a HEPA purifier in the room you use most.',
        'Avoid indoor smoke sources and use the kitchen exhaust when cooking.',
        'If you must go out, keep it short; a well-fitted N95/FFP2-type respirator is far better than cloth masks if official guidance recommends one.',
        'Follow your city’s official health advisories; sensitive people should keep medicines handy and seek medical advice if unwell.',
      ]),
    ].join('\n'),

  commute: ({ level }) =>
    [
      '**Lower-exposure commuting:**',
      bullets([
        level >= 3
          ? 'Prefer metro or bus; active travel (walking or cycling) raises how much you inhale, so it is not the healthiest choice on polluted days.'
          : 'Walking or cycling is fine when air is better; use quiet side streets.',
        'In a car, keep windows up with recirculation on in traffic.',
        'Avoid rush hours when possible and combine errands into one trip.',
      ]),
      '',
      '**Environmental angle:** Public transport and carpooling cut emissions per person; this helps city-wide air over time, though one person’s savings will not noticeably change today’s AQI.',
    ].join('\n'),

  mask: () =>
    [
      '**Masks and respirators:**',
      bullets([
        'Cloth and surgical masks filter fine particles poorly.',
        'A well-fitted N95/FFP2/KN95-type respirator filters much better, but only works when sealed to the face; it is not suitable for everyone, so check with a doctor if you have breathing conditions.',
        'Masks protect you outdoors; a purifier cleans a room; neither is a substitute for reducing time in polluted air.',
      ]),
    ].join('\n'),

  affordable: () =>
    [
      '**Most affordable ways to protect your family:**',
      bullets([
        'Free: close windows at peaks, wet-mop, no indoor smoke, cooking exhaust on, plan outdoor time for cleaner hours.',
        'Low cost: door/window sealing strips, a DIY box-fan filter, a humidity gauge.',
        'Higher cost: a HEPA purifier sized for the bedroom first.',
      ]),
      '',
      '**Why:** Cutting exposure at its source (smoke, dust, cooking fumes) is the cheapest and often the most effective step.',
    ].join('\n'),

  general: ({ level, winLine, sens }) =>
    [
      '**What you can do today:**',
      bullets([
        level >= 3 ? 'Limit outdoor exertion and choose indoor activity.' : 'Plan outdoor activity for the cleanest hours.',
        level >= 3 ? 'Keep windows closed and use a HEPA purifier if available.' : 'Air out briefly when outdoor air is clean.',
        'Wet-mop instead of sweeping; avoid indoor smoke.',
        'Use metro, bus or carpool where practical; it cuts emissions, though your own choices will not visibly change today’s AQI.',
      ]),
      winLine,
      '',
      sens,
    ].join('\n'),
};

/** Honest fallback when no location is selected: general tips only, never invented readings. */
function noDataReply(): string {
  return [
    "**I don't have air-quality data for you yet.** Pick a location on the dashboard (or allow location access) and I can tailor my answer to current conditions. I won't guess readings.",
    '',
    '**General guidance in the meantime**',
    bullets([
      'Check a trusted local AQI source before outdoor exercise.',
      'Keep windows closed when outdoor smog is high; air out briefly when it is lower.',
      'A well-sized HEPA purifier helps most with fine particles in a closed room.',
    ]),
    '',
    `_${OFFICIAL_ADVISORY_NOTE}_`,
  ].join('\n');
}

/** The "Right now" opener: the measured AQI, its source and the dominant pollutant, so every answer is grounded. */
function currentConditionsLine(air: AirQualityResult): string {
  const p = POLLUTANT_META[air.dominantPollutant];
  return `**Right now:** AQI **${air.aqi}** (${air.category.label}) in ${air.location.name}, from ${dataLabel(air)}. ${p.label} is the main pollutant (${air.pollutants[air.dominantPollutant]} ${p.unit}). ${air.category.healthMessage}`;
}

function cleanestWindowLine(air: AirQualityResult): string {
  const win = cleanestWindow(air);
  if (!win) return '';
  return `The cleanest upcoming daytime window looks like **${win.label}** (estimate from ${win.basis === 'forecast' ? 'forecast' : 'simulated'} data).`;
}

/** Builds the full deterministic reply: conditions, intent-specific advice, advisory footer, and a simulated-data note. */
export function buildChatReply(question: string, ctx: EnvironmentContext | null): string {
  if (!ctx) return noDataReply();

  const { air } = ctx;
  const replyCtx: ReplyContext = {
    level: air.category.level,
    winLine: cleanestWindowLine(air),
    sens: `**For children, older adults and people with lung or heart conditions:** ${air.category.sensitiveMessage}`,
  };
  const body = BODY_BUILDERS[detectIntent(question)](replyCtx);
  const footer = `_${OFFICIAL_ADVISORY_NOTE}_`;
  const simulatedNote = air.source === 'simulated' ? '\n\n_Note: this uses simulated demo data, not live measurements._' : '';

  return [currentConditionsLine(air), '', body, '', footer + simulatedNote].join('\n').replace(/\n{3,}/g, '\n\n');
}
