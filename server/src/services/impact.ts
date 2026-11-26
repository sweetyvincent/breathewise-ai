/** Personal impact maths: CO2 and fuel saved versus a solo petrol-car baseline, and the sustainability score. */
import {
  BASELINE_FUEL_L_PER_KM,
  BASELINE_MODE,
  EMISSION_ASSUMPTIONS,
  MODES,
  round,
  savedVsBaselineKg,
  tripEmissionsKg,
  type ModeId,
} from '../lib/emissions';
import type { ActivityType } from '../schemas';
import type { ImpactRecord } from '../store/types';

export interface ActivityInput {
  type: ActivityType;
  distanceKm: number;
  count: number;
}

export interface ActivityImpact {
  type: ActivityType;
  label: string;
  trips: number;
  totalKm: number;
  co2SavedKg: number;
  fuelSavedL: number;
}

const LABELS: Record<ActivityType, string> = {
  walk: 'Walked instead of driving',
  cycle: 'Cycled instead of driving',
  metro: 'Took metro / train',
  bus: 'Took the bus',
  carpool: 'Carpooled',
  e_scooter: 'Used an e-scooter / e-bike',
  ev_car: 'Drove an electric car',
  avoided_trip: 'Avoided an unnecessary vehicle trip',
  household_habit: 'Sustainable household habit',
};

const fuelFromCo2 = (kg: number) => round((kg / (MODES[BASELINE_MODE].gPerKm / 1000)) * BASELINE_FUEL_L_PER_KM, 3);

export function calculateActivity(a: ActivityInput): ActivityImpact {
  const totalKm = round(a.distanceKm * a.count, 2);
  let co2 = 0;
  if (a.type === 'avoided_trip') co2 = tripEmissionsKg(BASELINE_MODE, totalKm);
  else if (a.type !== 'household_habit') co2 = savedVsBaselineKg(a.type as ModeId, totalKm);
  co2 = round(co2, 3);
  return { type: a.type, label: LABELS[a.type], trips: a.count, totalKm, co2SavedKg: co2, fuelSavedL: fuelFromCo2(co2) };
}

export function calculateImpact(activities: ActivityInput[]) {
  const items = activities.map(calculateActivity);
  return {
    items,
    totals: {
      co2SavedKg: round(
        items.reduce((s, i) => s + i.co2SavedKg, 0),
        3,
      ),
      fuelSavedL: round(
        items.reduce((s, i) => s + i.fuelSavedL, 0),
        2,
      ),
      sustainableTrips: items.filter((i) => i.type !== 'household_habit').reduce((s, i) => s + i.trips, 0),
      habits: items.filter((i) => i.type === 'household_habit').reduce((s, i) => s + i.trips, 0),
    },
  };
}

export const IMPACT_DISCLAIMER =
  'All figures are estimates based on the assumptions below. Your personal CO2 savings do not reduce your local AQI by a measurable amount: city air quality improves when many people and industries cut emissions together, and local weather also plays a large part. Your choices still matter as part of that collective effect, and some (like avoiding traffic or burning) also lower your own exposure.';

export const IMPACT_ASSUMPTIONS = [
  ...EMISSION_ASSUMPTIONS,
  'Avoided trips are credited with the full emissions of a solo petrol car over that distance.',
  'Household habits count toward the sustainability score but are not assigned a CO2 value.',
  'Sustainability score = min(100, 6 × sustainable trips + 8 × kg CO2 saved + 3 × habits) over the last 7 days.',
];

const DAY = 86_400_000;

/** Monday (UTC) of the week containing `ms`. */
function weekStart(ms: number): string {
  const d = new Date(ms);
  const dow = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow)).toISOString().slice(0, 10);
}

export function scoreFor(trips: number, co2Kg: number, habits: number): number {
  return Math.min(100, Math.round(6 * trips + 8 * co2Kg + 3 * habits));
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Clean-air champion';
  if (score >= 50) return 'Making a difference';
  if (score >= 20) return 'Good start';
  return 'Just getting started';
}

export function summarizeImpact(records: ImpactRecord[], nowMs: number = Date.now()) {
  const sum = (rs: ImpactRecord[]) => ({
    co2SavedKg: round(
      rs.reduce((s, r) => s + r.estimatedCo2Saved, 0),
      2,
    ),
    trips: rs.filter((r) => r.transportType !== 'household_habit').reduce((s, r) => s + r.tripCount, 0),
    habits: rs.filter((r) => r.transportType === 'household_habit').reduce((s, r) => s + r.tripCount, 0),
    fuelSavedL: round(
      rs.reduce((s, r) => s + fuelFromCo2(r.estimatedCo2Saved), 0),
      2,
    ),
  });

  const weeks: Array<{ weekStart: string; co2SavedKg: number; trips: number }> = [];
  for (let i = 7; i >= 0; i--) {
    const ws = weekStart(nowMs - i * 7 * DAY);
    const rs = records.filter((r) => weekStart(Date.parse(r.createdAt)) === ws);
    const s = sum(rs);
    weeks.push({ weekStart: ws, co2SavedKg: s.co2SavedKg, trips: s.trips });
  }

  const months: Array<{ month: string; co2SavedKg: number; trips: number }> = [];
  const nowD = new Date(nowMs);
  for (let i = 5; i >= 0; i--) {
    const key = new Date(Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth() - i, 1)).toISOString().slice(0, 7);
    const s = sum(records.filter((r) => r.createdAt.slice(0, 7) === key));
    months.push({ month: key, co2SavedKg: s.co2SavedKg, trips: s.trips });
  }

  const last7 = sum(records.filter((r) => Date.parse(r.createdAt) > nowMs - 7 * DAY));
  const last30 = sum(records.filter((r) => Date.parse(r.createdAt) > nowMs - 30 * DAY));
  const score = scoreFor(last7.trips, last7.co2SavedKg, last7.habits);

  return {
    allTime: sum(records),
    last7Days: last7,
    last30Days: last30,
    weekly: weeks,
    monthly: months,
    score: { value: score, label: scoreLabel(score) },
    disclaimer: IMPACT_DISCLAIMER,
    assumptions: IMPACT_ASSUMPTIONS,
  };
}
