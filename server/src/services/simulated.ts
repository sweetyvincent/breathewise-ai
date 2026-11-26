/**
 * Deterministic SIMULATED air-quality and weather data for demo mode.
 * Never presented as live: every result carries `source: 'simulated'`.
 * Patterns mimic North-Indian winter smog (morning and late-evening peaks, mid-afternoon dip).
 */
import { computeAqi, type Pollutants } from '../lib/aqi';
import { approxLocalHour, haversineKm } from '../lib/geo';
import type { GeoPoint } from './types';

export interface CityProfile extends GeoPoint {
  /** Typical winter-season PM2.5 baseline in µg/m³ (illustrative). */
  basePm25: number;
  baseTempC: number;
}

export const DEMO_CITIES: CityProfile[] = [
  { name: 'Delhi, India', lat: 28.6139, lon: 77.209, basePm25: 165, baseTempC: 12 },
  { name: 'Lucknow, India', lat: 26.8467, lon: 80.9462, basePm25: 140, baseTempC: 14 },
  { name: 'Kolkata, India', lat: 22.5726, lon: 88.3639, basePm25: 95, baseTempC: 19 },
  { name: 'Mumbai, India', lat: 19.076, lon: 72.8777, basePm25: 70, baseTempC: 25 },
  { name: 'Pune, India', lat: 18.5204, lon: 73.8567, basePm25: 60, baseTempC: 21 },
  { name: 'Hyderabad, India', lat: 17.385, lon: 78.4867, basePm25: 55, baseTempC: 22 },
  { name: 'Chennai, India', lat: 13.0827, lon: 80.2707, basePm25: 45, baseTempC: 26 },
  { name: 'Bengaluru, India', lat: 12.9716, lon: 77.5946, basePm25: 40, baseTempC: 21 },
];

export function nearestProfile(lat: number, lon: number): CityProfile {
  let best = DEMO_CITIES[0] as CityProfile;
  let bestD = Infinity;
  for (const c of DEMO_CITIES) {
    const d = haversineKm(lat, lon, c.lat, c.lon);
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

/** mulberry32 PRNG: small, fast, deterministic. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bump = (h: number, centre: number, width: number): number => {
  const d = Math.min(Math.abs(h - centre), 24 - Math.abs(h - centre));
  return Math.exp(-((d / width) ** 2));
};

/** Multiplier (≈0.7–1.4) describing the time-of-day pattern. */
export function diurnalFactor(localHour: number): number {
  return 0.8 + 0.28 * bump(localHour, 9, 2.5) + 0.4 * bump(localHour, 22, 3) - 0.18 * bump(localHour, 15, 3);
}

export interface SimulatedHour {
  ts: number;
  pollutants: Pollutants;
  aqi: number;
}

export function simulatedPollutants(profile: CityProfile, lon: number, hourStartMs: number): Pollutants {
  const hourIdx = Math.floor(hourStartMs / 3_600_000);
  const dayIdx = Math.floor(hourIdx / 24);
  const rand = prng(hourIdx * 2654435761 + Math.round(profile.lat * 100));
  const dayRand = prng(dayIdx * 40503 + Math.round(profile.lon * 100));
  const dayFactor = 0.75 + dayRand() * 0.55; // some days are cleaner than others
  const local = approxLocalHour(new Date(hourStartMs), lon);
  const pm25 = Math.max(4, profile.basePm25 * diurnalFactor(local) * dayFactor * (0.92 + rand() * 0.16));
  const daytime = bump(local, 14, 4);
  return {
    pm25: round1(pm25),
    pm10: round1(pm25 * (1.55 + rand() * 0.3)),
    no2: round1(18 + pm25 * 0.22 + rand() * 6),
    so2: round1(6 + pm25 * 0.04 + rand() * 3),
    co: Math.round((0.5 + pm25 * 0.011 + rand() * 0.15) * 100) / 100,
    o3: round1(20 + daytime * 45 * (1 - Math.min(0.6, pm25 / 400)) + rand() * 8),
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function simulateHour(profile: CityProfile, lon: number, hourStartMs: number): SimulatedHour {
  const pollutants = simulatedPollutants(profile, lon, hourStartMs);
  return { ts: hourStartMs, pollutants, aqi: computeAqi(pollutants).aqi };
}

export function simulatedWeather(profile: CityProfile, lon: number, nowMs: number) {
  const hourStart = Math.floor(nowMs / 3_600_000) * 3_600_000;
  const local = approxLocalHour(new Date(hourStart), lon);
  const rand = prng(Math.floor(hourStart / 3_600_000) * 97 + 13);
  const tempC = round1(profile.baseTempC + 4 * Math.sin(((local - 9) / 24) * 2 * Math.PI) + (rand() - 0.5));
  return {
    observedAt: new Date(hourStart).toISOString(),
    tempC,
    humidity: Math.round(Math.min(95, 62 + 18 * Math.cos(((local - 5) / 24) * 2 * Math.PI) + rand() * 6)),
    windSpeedMs: round1(0.8 + rand() * 1.8),
    description: profile.baseTempC < 16 ? 'hazy, cool (simulated)' : 'partly cloudy (simulated)',
  };
}
