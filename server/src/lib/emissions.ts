/**
 * Transparent emissions model. Every number here is an ILLUSTRATIVE ESTIMATE, rounded to the order of
 * magnitude of published per-passenger-km inventories, tuned for Indian city travel (grid ≈ 0.7 kg CO2/kWh).
 * Real emissions vary with vehicle, load, traffic and grid mix. Edit this table to localise.
 */

export type ModeId = 'walk' | 'cycle' | 'e_scooter' | 'metro' | 'bus' | 'carpool' | 'two_wheeler' | 'ev_car' | 'car_petrol' | 'car_diesel';

export interface Mode {
  id: ModeId;
  label: string;
  /** Grams CO2-equivalent per passenger-km (tailpipe + electricity), estimate. */
  gPerKm: number;
  /** Average door-to-door city speed in km/h (estimate). */
  speedKmh: number;
  /** Physically active modes raise breathing rate → higher inhaled dose per minute. */
  active: boolean;
  /** Longest distance we consider practical for the mode. */
  maxKm: number;
  /** Time spent in/near traffic increases exposure for these modes. */
  trafficExposed: boolean;
}

export const MODES: Record<ModeId, Mode> = {
  walk: { id: 'walk', label: 'Walking', gPerKm: 0, speedKmh: 5, active: true, maxKm: 5, trafficExposed: true },
  cycle: { id: 'cycle', label: 'Cycling', gPerKm: 0, speedKmh: 15, active: true, maxKm: 15, trafficExposed: true },
  e_scooter: {
    id: 'e_scooter',
    label: 'Electric scooter / e-bike',
    gPerKm: 25,
    speedKmh: 22,
    active: false,
    maxKm: 20,
    trafficExposed: true,
  },
  metro: { id: 'metro', label: 'Metro / train', gPerKm: 35, speedKmh: 30, active: false, maxKm: 80, trafficExposed: false },
  bus: { id: 'bus', label: 'Bus', gPerKm: 60, speedKmh: 18, active: false, maxKm: 80, trafficExposed: false },
  carpool: { id: 'carpool', label: 'Carpool (3 riders)', gPerKm: 57, speedKmh: 25, active: false, maxKm: 200, trafficExposed: false },
  two_wheeler: {
    id: 'two_wheeler',
    label: 'Motorbike / scooter (petrol)',
    gPerKm: 70,
    speedKmh: 25,
    active: false,
    maxKm: 60,
    trafficExposed: true,
  },
  ev_car: { id: 'ev_car', label: 'Electric car', gPerKm: 95, speedKmh: 25, active: false, maxKm: 300, trafficExposed: false },
  car_petrol: {
    id: 'car_petrol',
    label: 'Car (petrol, solo)',
    gPerKm: 170,
    speedKmh: 25,
    active: false,
    maxKm: 500,
    trafficExposed: false,
  },
  car_diesel: {
    id: 'car_diesel',
    label: 'Car (diesel, solo)',
    gPerKm: 160,
    speedKmh: 25,
    active: false,
    maxKm: 500,
    trafficExposed: false,
  },
};

export const BASELINE_MODE: ModeId = 'car_petrol';
/** Petrol car fuel use used to translate avoided emissions into "fuel saved" (≈14 km/L). */
export const BASELINE_FUEL_L_PER_KM = 0.07;

export const EMISSION_ASSUMPTIONS: string[] = [
  'Values are rounded, illustrative estimates in grams of CO2-equivalent per passenger-km, not measurements.',
  'Electric modes use an Indian grid factor of roughly 0.7 kg CO2/kWh; cleaner grids make them lower.',
  'Carpool assumes 3 occupants sharing a petrol car. Walking and cycling are counted as zero operational emissions.',
  'Savings are measured against a solo petrol car, which is the default baseline.',
  'Fuel saved is scaled in proportion to avoided emissions at about 14 km per litre of petrol.',
];

export const round = (n: number, digits = 2): number => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

export function tripEmissionsKg(mode: ModeId, km: number): number {
  return round((MODES[mode].gPerKm * km) / 1000, 3);
}

export function tripMinutes(mode: ModeId, km: number): number {
  return Math.max(1, Math.round((km / MODES[mode].speedKmh) * 60));
}

/** CO2 (kg) avoided relative to the baseline for travelling `km` by `mode`. Never negative. */
export function savedVsBaselineKg(mode: ModeId, km: number): number {
  return round(Math.max(0, tripEmissionsKg(BASELINE_MODE, km) - tripEmissionsKg(mode, km)), 3);
}

export function fuelSavedLitres(mode: ModeId, km: number): number {
  const baseKg = tripEmissionsKg(BASELINE_MODE, km);
  if (baseKg <= 0) return 0;
  return round((savedVsBaselineKg(mode, km) / baseKg) * km * BASELINE_FUEL_L_PER_KM, 3);
}
