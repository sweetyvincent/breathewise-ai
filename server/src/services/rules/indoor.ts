import type { HomeProfile } from '../../schemas';
import type { AirQualityResult, EnvironmentContext } from '../types';
import type { IndoorPlan, Solution } from '../ai/outputSchemas';
import { aqiPhrase, OFFICIAL_ADVISORY_NOTE, SEVERE_ADDENDUM } from './common';

const BUDGET_RANK = { free: 0, low: 1, medium: 2, high: 3 } as const;
type Budget = keyof typeof BUDGET_RANK;

/** Sizing assumptions for the purifier rule of thumb (see `recommendedCadr`). */
const MIN_ROOM_AREA_SQM = 8;
const CEILING_HEIGHT_M = 2.7;
const BASELINE_ACH = 4;
const HIGH_ACH = 5;
/** AQI category level from which outdoor air counts as "poor" (3 = Poor). */
const POOR_LEVEL = 3;
const VERY_POOR_LEVEL = 4;
const MODERATE_LEVEL = 2;
/** CADR is rounded up to the next 10 m³/h so the figure matches how purifiers are rated. */
const CADR_ROUNDING = 10;
/** Output-schema cap for free-text fields. */
const TEXT_MAX_CHARS = 500;

/**
 * Rule-of-thumb purifier sizing: Clean Air Delivery Rate ≈ room volume × air changes per hour.
 * 4 ACH is a common baseline; 5 when outdoor air is poor or vulnerable people live here.
 * This is guidance, not a guarantee; always check the manufacturer's room-size rating.
 */
export function recommendedCadr(home: HomeProfile, level: number): { cadr: number; roomAreaSqm: number; ach: number } {
  const roomAreaSqm = Math.max(MIN_ROOM_AREA_SQM, home.sizeSqm / Math.max(1, home.rooms));
  const ach = level >= POOR_LEVEL || home.hasChildren || home.hasElderly ? HIGH_ACH : BASELINE_ACH;
  const cadr = Math.ceil((roomAreaSqm * CEILING_HEIGHT_M * ach) / CADR_ROUNDING) * CADR_ROUNDING;
  return { cadr, roomAreaSqm: Math.round(roomAreaSqm), ach };
}

type Sizing = ReturnType<typeof recommendedCadr>;

/** Builds a `Solution`, marking whether the household budget covers it (unaffordable items are shown, not hidden). */
type SolutionFactory = (title: string, detail: string, why: string, evidence: Solution['evidence'], minBudget: Budget) => Solution;

function solutionFactory(budget: Budget): SolutionFactory {
  return (title, detail, why, evidence, minBudget) => ({
    title,
    detail,
    why,
    evidence,
    fits_budget: BUDGET_RANK[budget] >= BUDGET_RANK[minBudget],
  });
}

/** Zero-cost habits; pet and AC tips are added only when they apply to this home. */
function freeSolutions(home: HomeProfile, level: number, s: SolutionFactory): Solution[] {
  const solutions: Solution[] = [
    s(
      'Close windows during pollution peaks',
      level >= POOR_LEVEL
        ? 'Keep windows and balcony doors shut most of the day; open only briefly in the cleanest hours.'
        : 'Open windows for 10–15 minutes at cleaner, low-traffic times.',
      'Outdoor particles enter through gaps quickly when outdoor air is polluted.',
      'strong',
      'free',
    ),
    s(
      'Wet-mop and damp-dust',
      'Use a damp cloth on surfaces and a wet mop on floors 2–3 times a week. Avoid dry sweeping and feather dusters.',
      'Dry methods resuspend settled dust into the air you breathe.',
      'strong',
      'free',
    ),
    s(
      'Remove indoor smoke sources',
      'No smoking, incense, mosquito coils or candles indoors on polluted days. Never burn coal, charcoal or wood in a closed room.',
      'Combustion adds fine particles and, for coal or charcoal, dangerous carbon monoxide.',
      'strong',
      'free',
    ),
    s(
      'Ventilate while cooking',
      home.cooksIndoors
        ? 'Turn on the exhaust fan or chimney before you start and keep it running for ~15 minutes after. Use back burners where possible.'
        : 'Keep the kitchen door closed when others cook.',
      'Cooking is a major source of indoor PM2.5, especially frying.',
      'strong',
      'free',
    ),
    s(
      'Take shoes off at the door',
      'Keep a mat and a shoe rack at the entrance.',
      'Reduces dust and soot carried in from outside.',
      'moderate',
      'free',
    ),
  ];
  if (home.hasPets) {
    solutions.push(
      s(
        'Brush and wash pets regularly',
        'Brush pets outdoors when possible and wash pet bedding weekly.',
        'Cuts dander and hair that add to indoor dust.',
        'moderate',
        'free',
      ),
    );
  }
  if (home.hasAirConditioner) {
    solutions.push(
      s(
        'Clean the AC filter',
        'Wash or replace the indoor-unit filter monthly during heavy use.',
        'A clogged filter weakens airflow and can recirculate dust.',
        'moderate',
        'free',
      ),
    );
  }
  return solutions;
}

function lowBudgetSolutions(s: SolutionFactory): Solution[] {
  return [
    s(
      'Seal gaps around doors and windows',
      'Self-adhesive foam strips or door sweeps cost little and are easy to fit, starting with the bedroom.',
      'Fewer leaks means less outdoor smog entering a closed room.',
      'moderate',
      'low',
    ),
    s(
      'Build a DIY box-fan filter',
      'A box fan with 4 pleated MERV-13 furnace filters (a "Corsi–Rosenthal box") is a low-cost way to clean one room.',
      'Tested in lab and field studies to remove particles effectively; noisier and bulkier than a purifier.',
      'moderate',
      'low',
    ),
    s(
      'Add a hygrometer',
      'Aim for roughly 30–50% indoor humidity; ventilate bathrooms and avoid drying laundry in closed bedrooms.',
      'Damp rooms encourage mould and dust mites that irritate airways.',
      'moderate',
      'low',
    ),
    s(
      'Use washable mop cloths and a HEPA-bag vacuum',
      'Choose cloths you can wash and a vacuum with a sealed HEPA filter if buying one.',
      'Standard vacuums can blow fine dust back out.',
      'moderate',
      'low',
    ),
  ];
}

function advancedSolutions(sizing: Sizing, s: SolutionFactory): Solution[] {
  return [
    s(
      `HEPA purifier rated about ${sizing.cadr}+ m³/h CADR`,
      `Size for the room you use most (about ${sizing.roomAreaSqm} m² here) and start with the bedroom. Check the manufacturer's room-size rating.`,
      'True HEPA filters remove fine particles from a closed room. They do not remove gases or odours; carbon layers help only partly.',
      'strong',
      'medium',
    ),
    s(
      'Ducted kitchen hood or chimney',
      'Choose a hood that vents outdoors rather than recirculating.',
      'Removes cooking pollutants at the source.',
      'strong',
      'high',
    ),
    s(
      'Fresh-air ventilation with filtration (HRV/ERV)',
      'Balanced ventilators with a good filter bring in filtered outdoor air continuously.',
      'Keeps ventilation without opening windows on polluted days.',
      'moderate',
      'high',
    ),
    s(
      'Indoor PM2.5 monitor',
      'A low-cost laser sensor shows when cooking or cleaning spikes particles and when to ventilate.',
      'Gives feedback on what actually works in your home; readings are indicative, not reference-grade.',
      'limited',
      'medium',
    ),
  ];
}

/** Window advice follows outdoor air: shut in poor air, brief airing in moderate air, cross-ventilate when clean. */
function ventilationAdvice(home: HomeProfile, air: AirQualityResult): IndoorPlan['ventilation_advice'] {
  const level = air.category.level;
  let advice: IndoorPlan['ventilation_advice'];
  if (level >= POOR_LEVEL) {
    advice = {
      action: 'Keep windows closed and use exhaust fans only briefly while cooking.',
      reason: `Outdoor air is ${air.category.label}; opening windows would likely make indoor air worse.`,
    };
  } else if (level === MODERATE_LEVEL) {
    advice = {
      action: 'Ventilate briefly (10–15 minutes) in the cleanest part of the day, then close up.',
      reason: 'Outdoor air is moderate, so short airing dilutes indoor pollutants without letting in much outdoor pollution.',
    };
  } else {
    advice = {
      action: 'Open windows on opposite sides for 15+ minutes to cross-ventilate.',
      reason: 'Outdoor air is relatively clean, so fresh air is the cheapest way to dilute indoor pollutants.',
    };
  }
  if (home.ventilation === 'none') {
    advice.action += ' With little natural ventilation, rely on exhaust fans and avoid generating smoke or fumes indoors.';
  }
  return advice;
}

/** Explains the sizing rule and, importantly, how purifiers differ from air conditioners and masks. */
function purifierNote(home: HomeProfile, sizing: Sizing): string {
  return [
    `Rule of thumb: CADR ≈ room volume × ${sizing.ach} air changes per hour; for about ${sizing.roomAreaSqm} m² that is roughly ${sizing.cadr} m³/h.`,
    home.rooms > 1
      ? 'Prioritise the bedroom, then the room where the family spends most time.'
      : 'Place it away from walls with space around it.',
    'An air conditioner cools air but usually does not filter fine particles (and many split units recirculate indoor air). A HEPA purifier is the better tool for PM2.5; they do different jobs.',
    'Masks and purifiers work differently: a purifier cleans a room, a well-fitted N95/FFP2-type respirator protects you while outdoors when official guidance recommends it.',
  ].join(' ');
}

function indoorSummary(home: HomeProfile, air: AirQualityResult): string {
  const vulnerable = home.hasChildren || home.hasElderly;
  const focus = vulnerable
    ? 'Because children or older adults live here, prioritise the bedroom and avoid scented products and smoke sources.'
    : 'Focus first on the free steps below, then add a purifier if budget allows.';
  return `${air.category.healthMessage} (${aqiPhrase(air)}). ${focus}`.slice(0, TEXT_MAX_CHARS);
}

const MAINTENANCE_REMINDERS = [
  'Wash the purifier pre-filter every 2–4 weeks; replace the HEPA filter as the manufacturer advises (sooner in heavy smog).',
  'Clean AC filters monthly during heavy use and kitchen chimney filters monthly.',
  'Wash bedding weekly (hot water if the fabric allows) and damp-dust 2–3 times a week.',
  'Replace furnace filters in a DIY box-fan unit when visibly dirty or every 2–3 months.',
];

/** Myths vs evidence, including the required "indoor plants do not clean room air" correction. */
const MYTHS: IndoorPlan['myths'] = [
  {
    myth: 'Indoor plants clean the air in my room.',
    reality:
      'Not at normal room scale. You would need an impractical number of plants to match even a small purifier; plants are nice, but not a pollution solution.',
  },
  {
    myth: 'Burning incense or candles purifies the air.',
    reality: 'They release fine particles and other pollutants and make indoor air worse.',
  },
  {
    myth: 'My air conditioner cleans the air.',
    reality: 'Cooling is not filtering. Most ACs do not remove fine particles; use a HEPA purifier for PM2.5.',
  },
  {
    myth: 'Ionisers and "ozone" purifiers are the best choice.',
    reality: 'Some generate ozone, which irritates lungs. Prefer filter-based HEPA purifiers.',
  },
  {
    myth: 'Opening windows is always good (or always bad).',
    reality: 'It depends on outdoor versus indoor levels. Ventilate when outdoor air is cleaner; keep closed during peaks.',
  },
  {
    myth: 'A cloth or surgical mask blocks smog.',
    reality:
      'They filter fine particles poorly; a well-fitted N95/FFP2/KN95-type respirator does much better when recommended by official guidance.',
  },
];

/** Assembles the deterministic indoor plan (also the fallback whenever the LLM is unavailable or rejected). */
export function buildIndoorPlan(home: HomeProfile, ctx: EnvironmentContext): IndoorPlan {
  const { air } = ctx;
  const level = air.category.level;
  const sizing = recommendedCadr(home, level);
  const s = solutionFactory(home.budget);

  return {
    summary: indoorSummary(home, air),
    risk_level: air.category.risk,
    ventilation_advice: ventilationAdvice(home, air),
    purifier_guidance: { recommended_cadr_m3h: sizing.cadr, note: purifierNote(home, sizing).slice(0, TEXT_MAX_CHARS) },
    solutions: { free: freeSolutions(home, level, s), low_budget: lowBudgetSolutions(s), advanced: advancedSolutions(sizing, s) },
    maintenance_reminders: [...MAINTENANCE_REMINDERS],
    myths: MYTHS.map((m) => ({ ...m })),
    important_note: OFFICIAL_ADVISORY_NOTE + (level >= VERY_POOR_LEVEL ? SEVERE_ADDENDUM : ''),
  };
}
