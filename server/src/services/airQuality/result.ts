import { categorize, computeAqi, SCALE_INFO, type Pollutants } from '../../lib/aqi';
import type { PollutionEntry } from '../openweather';
import type { AirQualityResult, DailyPoint, GeoPoint, HourlyPoint } from '../types';
import { HOUR_MS, MINUTE_MS } from './constants';

/** An hourly reading with its AQI already computed, before it is shaped for the API. */
export interface ScoredPoint {
  ts: number;
  aqi: number;
  pm25: number;
}

/** OpenWeather reports CO in µg/m³; CPCB's CO breakpoints use mg/m³. */
export const toPollutants = (e: PollutionEntry): Pollutants => ({
  pm25: e.components.pm2_5,
  pm10: e.components.pm10,
  no2: e.components.no2,
  so2: e.components.so2,
  co: e.components.co / 1000,
  o3: e.components.o3,
});

export const toHourlyPoint = (p: ScoredPoint, kind: HourlyPoint['kind']): HourlyPoint => ({
  time: new Date(p.ts).toISOString(),
  aqi: p.aqi,
  pm25: p.pm25,
  kind,
});

/** Group hourly points into approximate-local-day averages (local day estimated from longitude). */
export function dailyAverages(points: ScoredPoint[], lon: number): DailyPoint[] {
  const offsetMs = Math.round(lon / 15) * HOUR_MS;
  const buckets = new Map<string, { aqi: number; pm25: number; n: number }>();
  for (const p of points) {
    const day = new Date(p.ts + offsetMs).toISOString().slice(0, 10);
    const bucket = buckets.get(day) ?? { aqi: 0, pm25: 0, n: 0 };
    bucket.aqi += p.aqi;
    bucket.pm25 += p.pm25;
    bucket.n += 1;
    buckets.set(day, bucket);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({ date, aqi: Math.round(b.aqi / b.n), pm25: Math.round((b.pm25 / b.n) * 10) / 10 }));
}

export const ageMinutes = (nowMs: number, observedAtMs: number) => Math.max(0, Math.round((nowMs - observedAtMs) / MINUTE_MS));

interface AssembleArgs {
  source: 'live' | 'simulated';
  provider: string;
  location: GeoPoint;
  observedAtMs: number;
  pollutants: Pollutants;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  notes: string[];
  nowMs: number;
}

/** Combines a reading with its computed AQI, category and sub-indices into the API response. */
export function assemble(args: AssembleArgs): AirQualityResult {
  const { aqi, dominant, subIndices } = computeAqi(args.pollutants);
  return {
    source: args.source,
    provider: args.provider,
    scale: { ...SCALE_INFO },
    location: args.location,
    observedAt: new Date(args.observedAtMs).toISOString(),
    fetchedAt: new Date(args.nowMs).toISOString(),
    ageMinutes: ageMinutes(args.nowMs, args.observedAtMs),
    cached: false,
    aqi,
    category: categorize(aqi),
    dominantPollutant: dominant,
    pollutants: args.pollutants,
    subIndices,
    hourly: args.hourly,
    daily: args.daily,
    notes: args.notes,
  };
}
