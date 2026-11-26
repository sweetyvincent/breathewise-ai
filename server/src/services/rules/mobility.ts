/** Mobility rules: emissions per mode, exposure-aware suitability, and the recommended option. */
import {
  BASELINE_MODE,
  EMISSION_ASSUMPTIONS,
  MODES,
  round,
  savedVsBaselineKg,
  tripEmissionsKg,
  tripMinutes,
  type ModeId,
} from '../../lib/emissions';
import type { MobilityRequest } from '../../schemas';
import type { AirQualityResult } from '../types';
import { OFFICIAL_ADVISORY_NOTE, SEVERE_ADDENDUM } from './common';

export type Suitability = 'recommended' | 'ok' | 'caution' | 'not_advised' | 'impractical';

export interface MobilityOption {
  mode: ModeId;
  label: string;
  emissionsKg: number;
  savedVsPreferredKg: number;
  savedVsBaselineKg: number;
  minutes: number;
  suitability: Suitability;
  exposureNote: string;
}

export interface MobilityResult {
  distanceKm: number;
  preferredMode: ModeId;
  recommended: { mode: ModeId; label: string; rationale: string };
  options: MobilityOption[];
  weekly: { tripsPerWeek: number; preferredKg: number; recommendedKg: number; savedKg: number };
  additionalIdeas: string[];
  assumptions: string[];
  importantNote: string;
}

/**
 * Exposure logic. Active modes raise breathing rate and walk/cycle/two-wheelers share the road with traffic,
 * so on polluted days a "green" mode is NOT automatically the healthiest. Enclosed transit is judged by waiting time.
 */
export function assessExposure(
  mode: ModeId,
  km: number,
  level: number,
  sensitiveRider: boolean,
): { suitability: Suitability; note: string } {
  const m = MODES[mode];
  const minutes = tripMinutes(mode, km);
  if (km > m.maxKm) return { suitability: 'impractical', note: `${km} km is longer than is practical for ${m.label.toLowerCase()}.` };

  if (m.active) {
    if (level >= 4)
      return minutes <= 10 && !sensitiveRider
        ? {
            suitability: 'caution',
            note: 'Very high pollution: keep this very short, avoid main roads, and consider a well-fitted respirator if official advisories recommend one.',
          }
        : {
            suitability: 'not_advised',
            note: `At this pollution level a ${minutes}-minute active trip means a long period of fast breathing in polluted air. Prefer enclosed transport.`,
          };
    if (level === 3)
      return minutes <= 20 && !sensitiveRider
        ? {
            suitability: 'caution',
            note: 'Poor air: take the quietest route and keep exertion easy; the longer you are out, the more you inhale.',
          }
        : {
            suitability: 'not_advised',
            note: sensitiveRider
              ? 'Poor air and a sensitive traveller: avoid long active trips.'
              : `A ${minutes}-minute active trip in poor air is likely to add a lot of exposure.`,
          };
    if (level === 2)
      return sensitiveRider
        ? {
            suitability: 'caution',
            note: 'Moderate air: fine for most people, but sensitive travellers should keep it short and use quiet streets.',
          }
        : { suitability: 'ok', note: 'Moderate air: use low-traffic streets; pollution falls quickly away from busy roads.' };
    return { suitability: 'ok', note: 'Air quality is good enough that active travel is a healthy, zero-emission choice.' };
  }

  if (mode === 'two_wheeler' || mode === 'e_scooter') {
    if (level >= 4 && sensitiveRider)
      return { suitability: 'not_advised', note: 'Open-air riding in very poor air is not advised for sensitive travellers.' };
    if (level >= 3)
      return {
        suitability: 'caution',
        note: 'You are exposed to traffic exhaust and dust. A well-fitted particulate respirator may help if official guidance recommends it; cloth masks filter poorly.',
      };
    return { suitability: 'ok', note: 'Ride on quieter roads and avoid idling in dense traffic.' };
  }

  if (mode === 'metro' || mode === 'bus') {
    return {
      suitability: 'ok',
      note:
        level >= 3
          ? 'Enclosed transport keeps exposure moderate; minimise time waiting at open stops and plan a short, low-traffic walk to the station.'
          : 'Low emissions per passenger; most exposure is on the walk and the wait.',
    };
  }
  return {
    suitability: 'ok',
    note:
      level >= 3
        ? 'Keep windows up with recirculation on in traffic; this reduces some roadside particles but not all.'
        : 'Enclosed cabin; the main trade-off is higher emissions per passenger.',
  };
}

export function buildMobility(req: MobilityRequest, air: AirQualityResult): MobilityResult {
  const level = air.category.level;
  const sensitiveRider = req.sensitive || req.travellingWithChildrenOrElderly;
  const km = req.distanceKm;
  const preferredKg = tripEmissionsKg(req.preferredMode, km);

  const options: MobilityOption[] = (Object.keys(MODES) as ModeId[]).map((mode) => {
    const { suitability, note } = assessExposure(mode, km, level, sensitiveRider);
    const kg = tripEmissionsKg(mode, km);
    return {
      mode,
      label: MODES[mode].label,
      emissionsKg: kg,
      savedVsPreferredKg: round(Math.max(0, preferredKg - kg), 3),
      savedVsBaselineKg: savedVsBaselineKg(mode, km),
      minutes: tripMinutes(mode, km),
      suitability,
      exposureNote: note,
    };
  });

  // Choose: lowest-emission option among those that are neither impractical nor not advised, preferring 'ok' over 'caution'.
  const usable = options.filter((o) => o.suitability === 'ok' || o.suitability === 'caution');
  const rank = (o: MobilityOption) => (o.suitability === 'ok' ? 0 : 1);
  const best =
    [...usable].sort((a, b) => rank(a) - rank(b) || a.emissionsKg - b.emissionsKg || a.minutes - b.minutes)[0] ??
    options.find((o) => o.mode === 'metro') ??
    (options[0] as MobilityOption);
  for (const o of options) if (o.mode === best.mode) o.suitability = 'recommended';

  const rationale =
    `${best.label} is the lowest-emission option that is also sensible for today's air (${air.category.label}, ${air.source === 'live' ? 'provider data' : 'simulated demo data'}) over ${km} km. ` +
    (best.mode === req.preferredMode
      ? 'It matches your preferred choice. '
      : `Compared with ${MODES[req.preferredMode].label.toLowerCase()} it saves an estimated ${best.savedVsPreferredKg} kg CO2 per trip. `) +
    'Walking or cycling are excluded or flagged when pollution is high, because exertion in polluted air raises the dose you breathe.';

  const ideas = [
    'Combine errands into one trip to cut both distance and time in traffic.',
    level >= 3
      ? 'If your employer allows, work from home on the worst-pollution days.'
      : 'Consider remote work or flexible hours on one or two days a week.',
    'Travel outside peak traffic hours where you can; roadside pollution is usually higher at rush hour.',
    'Avoid idling, and keep tyres inflated and vehicles serviced: both cut tailpipe emissions.',
  ];

  return {
    distanceKm: km,
    preferredMode: req.preferredMode,
    recommended: { mode: best.mode, label: best.label, rationale },
    options: options.sort((a, b) => a.emissionsKg - b.emissionsKg),
    weekly: {
      tripsPerWeek: req.tripsPerWeek,
      preferredKg: round(preferredKg * req.tripsPerWeek, 2),
      recommendedKg: round(best.emissionsKg * req.tripsPerWeek, 2),
      savedKg: round(Math.max(0, preferredKg - best.emissionsKg) * req.tripsPerWeek, 2),
    },
    additionalIdeas: ideas,
    assumptions: [...EMISSION_ASSUMPTIONS, `Distance is treated as one-way per trip; baseline vehicle is "${MODES[BASELINE_MODE].label}".`],
    importantNote: OFFICIAL_ADVISORY_NOTE + (level >= 4 ? SEVERE_ADDENDUM : ''),
  };
}
