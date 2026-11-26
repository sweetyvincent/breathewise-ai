import type { PlanProfile } from '../../schemas';
import type { EnvironmentContext } from '../types';
import type { DailyPlan } from '../ai/outputSchemas';
import { aqiPhrase, cautionLevel, cleanestWindow, isSensitive, OFFICIAL_ADVISORY_NOTE, pollutantSummary, SEVERE_ADDENDUM } from './common';

type Rec = DailyPlan['daily_recommendations'][number];

/** Caution tiers (see `cautionLevel`): 2 = keep it light, 3+ = move activity indoors. */
const LIGHT_ACTIVITY_CAUTION = 2;
const INDOOR_ACTIVITY_CAUTION = 3;
/** AQI category levels: 3 = Poor (keep windows shut), 4 = Very Poor (add the severe-air note). */
const POOR_LEVEL = 3;
const VERY_POOR_LEVEL = 4;
/** Conditions that justify a "follow your doctor's plan" reminder when the user volunteers them. */
const MEDICAL_PLAN_SENSITIVITIES = ['asthma', 'respiratory', 'heart'];
/** Hard cap on the summary so it stays readable on one card and within the output schema. */
const SUMMARY_MAX_CHARS = 500;

/** Everything the time-of-day builders need, derived once from the profile and the air-quality context. */
interface PlanInputs {
  profile: PlanProfile;
  air: EnvironmentContext['air'];
  /** AQI category level, 0 (good) … 5 (severe). */
  level: number;
  sensitive: boolean;
  /** Category level, raised by one for sensitive users. */
  caution: number;
  /** "Cleanest window" sentence, or null when no forecast exists (we never guess). */
  winText: string | null;
  wantsOutdoor: boolean;
}

function derivePlanInputs(profile: PlanProfile, ctx: EnvironmentContext): PlanInputs {
  const { air } = ctx;
  const sensitive = isSensitive(profile);
  const win = cleanestWindow(air);
  return {
    profile,
    air,
    level: air.category.level,
    sensitive,
    caution: cautionLevel(air, sensitive),
    winText: win
      ? `${win.label} looks cleanest based on ${win.basis === 'forecast' ? 'the provider forecast' : 'the simulated daily pattern'} (about AQI ${win.avgAqi}, an estimate)`
      : null,
    wantsOutdoor: profile.lifestyle.includes('outdoor_exercise') || profile.outdoorFrequency !== 'rarely',
  };
}

function commuteAdvice(commute: PlanProfile['commute'], caution: number): Rec | null {
  switch (commute) {
    case 'work_from_home':
      return {
        time: 'Afternoon',
        action: 'Combine any errands into a single trip, ideally in the cleanest part of the day',
        reason: 'Fewer, shorter trips mean less time breathing roadside air.',
        impact: 'Lower personal exposure; fewer vehicle trips also means fewer emissions.',
      };
    case 'car':
      return {
        time: 'Afternoon',
        action: 'Keep windows up with the AC on recirculation in traffic, and try metro, bus or a carpool on some days',
        reason: 'Closed cabins can reduce (not eliminate) particles from surrounding traffic; shared rides cut emissions per passenger.',
        impact: 'A 3-person carpool cuts per-person CO2 by roughly two-thirds versus driving alone (estimate).',
      };
    case 'two_wheeler':
      return {
        time: 'Afternoon',
        action:
          caution >= 3
            ? 'Prefer metro or bus today; if you must ride, use a well-fitted particulate respirator when local advisories recommend one'
            : 'Ride on quieter roads where possible and avoid idling in dense traffic',
        reason: 'Riders are directly exposed to exhaust and road dust, and a loose cloth or surgical mask filters fine particles poorly.',
        impact: 'Can noticeably lower the dose of traffic-related particles you breathe on the way.',
      };
    case 'walk':
    case 'cycle':
      return caution >= 3
        ? {
            time: 'Afternoon',
            action: 'Shorten active commutes or switch to metro/bus today; if you walk or cycle, use lanes away from heavy traffic',
            reason: 'Exercise raises breathing rate, so on polluted days you inhale more particles per minute than when seated.',
            impact: 'Lower inhaled dose on the worst days; you can return to active commuting when air improves.',
          }
        : {
            time: 'Afternoon',
            action: 'Choose lower-traffic streets (a block off the main road helps) for walking or cycling',
            reason: 'Pollution levels drop quickly with distance from busy roads.',
            impact: 'Keeps a zero-emission commute while reducing the exposure that comes with it.',
          };
    case 'bus':
    case 'metro':
      return {
        time: 'Afternoon',
        action: 'Keep using public transport, and minimise waiting time at open stops and platforms',
        reason: 'Shared transport has low emissions per passenger; most exposure comes from waiting outdoors in traffic.',
        impact: 'Low emissions per trip (estimate) with modest personal exposure.',
      };
    case 'carpool':
      return {
        time: 'Afternoon',
        action: 'Keep carpooling and use recirculation mode with windows closed in heavy traffic',
        reason: 'Fewer cars on the road reduces emissions per person, and a closed cabin reduces some roadside particles.',
        impact: 'Roughly splits trip emissions across riders (estimate).',
      };
  }
}

/** Morning: check AQI, pick exercise intensity by caution tier, decide on airing the home. */
function morningRecs({ profile, level, caution, winText, wantsOutdoor }: PlanInputs): Rec[] {
  const recs: Rec[] = [
    {
      time: 'Morning',
      action: 'Check the local AQI before heading out or exercising outdoors',
      reason: 'In winter, cool still air traps smoke and exhaust near the ground, so mornings and late evenings are often the worst.',
      impact: 'Lets you pick the timing and intensity of outdoor activity based on real conditions.',
    },
    morningExercise(caution, wantsOutdoor),
    level >= POOR_LEVEL
      ? {
          time: 'Morning',
          action: 'Keep windows closed during the morning pollution peak',
          reason: 'Outdoor particles move indoors quickly through open windows when outdoor levels are high.',
          impact: 'Helps keep indoor air cleaner than outside; benefits are larger with a purifier.',
        }
      : {
          time: 'Morning',
          action: winText ? `Air out the home for 10–15 minutes; ${winText}` : 'Air out the home for 10–15 minutes once traffic has eased',
          reason: 'Outdoor air is not at a high-pollution level right now, and short airing dilutes cooking fumes and indoor pollutants.',
          impact: 'Refreshes indoor air without letting much pollution in.',
        },
  ];
  if (profile.sensitivities.some((s) => MEDICAL_PLAN_SENSITIVITIES.includes(s))) {
    recs.push({
      time: 'Morning',
      action: 'Follow the personal action plan from your doctor and keep any prescribed medication within reach',
      reason:
        'People with lung or heart conditions can be affected earlier by polluted air, and their own doctor knows their situation best.',
      impact: 'Supports preparedness; this app does not give medical advice.',
    });
  }
  return recs;
}

/** Exercise advice steps down with the caution tier: outdoor → light/short → indoor only. */
function morningExercise(caution: number, wantsOutdoor: boolean): Rec {
  if (caution < LIGHT_ACTIVITY_CAUTION) {
    return {
      time: 'Morning',
      action: wantsOutdoor
        ? 'Outdoor exercise is reasonable today; a park or low-traffic route is best'
        : 'A short outdoor walk is a good way to start the day',
      reason: 'Air quality is in a range where most people tolerate light to moderate activity.',
      impact: 'Keeps the health benefits of regular movement without much added exposure.',
    };
  }
  if (caution === LIGHT_ACTIVITY_CAUTION) {
    return {
      time: 'Morning',
      action: 'Keep outdoor exercise light and short (for example a brisk 20–30 minute walk), or move it indoors',
      reason: 'Harder breathing during intense exercise increases the amount of pollution reaching your lungs.',
      impact: 'Potentially lowers personal exposure while keeping you active.',
    };
  }
  return {
    time: 'Morning',
    action: 'Choose indoor exercise such as stretching, yoga or bodyweight work',
    reason: 'Air quality is high enough that strenuous outdoor activity raises exposure noticeably.',
    impact: 'Potentially lowers personal pollution exposure at the busiest pollution hours.',
  };
}

/** Afternoon: commute advice, a break suggestion, and one occupation/age-specific tip. */
function afternoonRecs({ profile, caution, winText }: PlanInputs): Rec[] {
  const recs: Rec[] = [];
  const commute = commuteAdvice(profile.commute, caution);
  if (commute) recs.push(commute);
  recs.push(
    caution >= INDOOR_ACTIVITY_CAUTION
      ? {
          time: 'Afternoon',
          action: 'Take lunch and breaks indoors instead of outdoor walks',
          reason: 'Even light outdoor time adds up when particle levels are high.',
          impact: 'Lower cumulative exposure across the day.',
        }
      : {
          time: 'Afternoon',
          action: 'Take a short break outdoors, preferably in a green, low-traffic spot',
          reason: 'Mid-afternoon is often when pollution dips as the day warms and air mixes.',
          impact: 'Gets fresh air and movement with limited exposure.',
        },
  );
  const tip = afternoonTip(profile, winText);
  if (tip) recs.push(tip);
  return recs;
}

/** At most one tailored tip: outdoor workers first, then students, then older adults. */
function afternoonTip(profile: PlanProfile, winText: string | null): Rec | null {
  if (profile.occupation === 'field_outdoor' || profile.occupation === 'driver_delivery') {
    return {
      time: 'Afternoon',
      action: 'Schedule the most physical outdoor tasks for the cleanest part of the day and take regular clean-air breaks',
      reason:
        'Heavy work at high breathing rates multiplies exposure. If official advisories recommend it, a well-fitted N95/FFP2-type respirator filters fine particles far better than cloth masks.',
      impact: 'Can meaningfully reduce your daily inhaled dose; ask your employer about protective equipment.',
    };
  }
  if (profile.occupation === 'student') {
    return {
      time: 'Afternoon',
      action: 'Ask the school or college whether sports and assembly can move indoors on poor-air days',
      reason: 'Young people breathe faster during play and are still developing, so extra care is sensible.',
      impact: 'Reduces exposure for the whole group, not just you.',
    };
  }
  if (profile.ageGroup === 'senior' || profile.occupation === 'retired') {
    return {
      time: 'Afternoon',
      action: winText
        ? `Do essential errands in the cleaner window. ${winText}`
        : 'Do essential errands in the middle of the day rather than early morning or late evening',
      reason: 'Older adults are more sensitive to particles, and pollution is usually lowest in the afternoon.',
      impact: 'Lowers exposure for the same errands.',
    };
  }
  return null;
}

/** Evening: avoid the dusk pollution rise, decide on windows, and add a cooking-ventilation reminder if relevant. */
function eveningRecs({ profile, level, caution, winText }: PlanInputs): Rec[] {
  const recs: Rec[] = [
    caution >= INDOOR_ACTIVITY_CAUTION
      ? {
          time: 'Evening',
          action: 'Skip strenuous outdoor activity such as running or sports; use indoor alternatives',
          reason: 'Pollution often rises again at dusk as temperatures fall and traffic and cooking add to it.',
          impact: 'Avoids a second exposure peak in the day.',
        }
      : {
          time: 'Evening',
          action: 'If you exercise outdoors, finish before dusk and avoid busy roads',
          reason: 'Levels commonly climb after sunset as air cools and traffic builds.',
          impact: 'Keeps outdoor time in cleaner hours.',
        },
    // Windows may open only when air is not Poor AND a forecast window confirms a cleaner period.
    level < POOR_LEVEL && winText !== null
      ? {
          time: 'Evening',
          action: 'Open windows briefly only if the outdoor reading is still low when you check',
          reason: 'Fresh air helps dilute indoor pollutants, but only when outdoor air is cleaner than indoor air.',
          impact: 'Improves indoor air at little cost.',
        }
      : {
          time: 'Evening',
          action: 'Keep windows closed and run a purifier if you have one',
          reason: 'Closing up limits outdoor particles entering, and a HEPA purifier can remove fine particles already inside.',
          impact: 'Potentially lowers indoor PM2.5 substantially in a closed room (depends on purifier size).',
        },
  ];
  if (profile.lifestyle.includes('cooks_daily')) {
    recs.push({
      time: 'Evening',
      action: 'Switch on the chimney or exhaust fan while cooking and for about 15 minutes afterwards',
      reason: 'Cooking, especially frying, is one of the largest sources of indoor fine particles.',
      impact: 'Cuts the indoor pollution that builds up on top of outdoor smog.',
    });
  }
  return recs;
}

/** Night: low-cost cleaning, bedroom air, and planning tomorrow. */
function nightRecs({ level }: PlanInputs): Rec[] {
  return [
    {
      time: 'Night',
      action: 'Damp-wipe surfaces and wet-mop floors instead of dry sweeping',
      reason: 'Dry sweeping lifts settled dust back into the air.',
      impact: 'Lowers indoor dust you breathe overnight, at almost no cost.',
    },
    {
      time: 'Night',
      action:
        level >= 2
          ? 'Run an appropriately sized HEPA purifier in the bedroom with doors and windows closed, if you have or can afford one'
          : 'Check the next day’s air quality forecast before planning outdoor activity',
      reason: 'You spend about a third of your time asleep, so cleaner bedroom air matters most.',
      impact: 'Potentially lowers overnight particle exposure; purifiers filter particles, not gases.',
    },
    {
      time: 'Night',
      action: 'Check tomorrow’s AQI outlook and plan outdoor time for the cleanest window',
      reason: 'Planning ahead lets you shift activities to better hours.',
      impact: 'Helps you reduce exposure without giving up activities.',
    },
  ];
}

/** Headline: the category message, the data label, the dominant pollutant and (for sensitive users) the extra caution. */
function airQualitySummary({ air, sensitive }: PlanInputs): string {
  const sensitiveNote = sensitive ? ' ' + air.category.sensitiveMessage : '';
  return `${air.category.healthMessage} (${aqiPhrase(air)}). ${pollutantSummary(air)}${sensitiveNote}`.slice(0, SUMMARY_MAX_CHARS);
}

function indoorTips(level: number): string[] {
  return [
    level >= POOR_LEVEL
      ? 'Keep windows closed during peaks and use a properly sized HEPA purifier in the room you use most'
      : 'Air out briefly in the cleanest hours, then close up',
    'Avoid burning incense, mosquito coils, candles, coal or wood indoors',
    'Wet-mop and damp-dust instead of dry sweeping',
    'Use the exhaust fan or chimney whenever you cook',
  ];
}

const SUSTAINABLE_ACTIONS = [
  'Combine multiple errands into one journey',
  'Use metro, bus or a carpool for part of your week',
  'Avoid idling your vehicle, especially near schools and crossings',
  'Never burn waste, and report open burning to the local authority',
];

/** Assembles the deterministic daily plan (also the fallback whenever the LLM is unavailable or rejected). */
export function buildDailyPlan(profile: PlanProfile, ctx: EnvironmentContext): DailyPlan {
  const inputs = derivePlanInputs(profile, ctx);
  return {
    air_quality_summary: airQualitySummary(inputs),
    risk_level: inputs.air.category.risk,
    daily_recommendations: [...morningRecs(inputs), ...afternoonRecs(inputs), ...eveningRecs(inputs), ...nightRecs(inputs)],
    indoor_tips: indoorTips(inputs.level),
    sustainable_actions: [...SUSTAINABLE_ACTIONS],
    important_note: OFFICIAL_ADVISORY_NOTE + (inputs.level >= VERY_POOR_LEVEL ? SEVERE_ADDENDUM : ''),
  };
}
