import { nearestProfile, simulateHour } from '../simulated';
import type { AirQualityResult, GeoPoint } from '../types';
import { CHART_FUTURE_HOURS, CHART_PAST_HOURS, HISTORY_DAYS, HOUR_MS } from './constants';
import { assemble, dailyAverages, toHourlyPoint, type ScoredPoint } from './result';

/** Builds a clearly-labelled simulated result: a deterministic diurnal pattern for the nearest city profile. */
export function buildSimulatedResult(loc: GeoPoint, nowMs: number): AirQualityResult {
  const profile = nearestProfile(loc.lat, loc.lon);
  const hourStart = Math.floor(nowMs / HOUR_MS) * HOUR_MS;
  const pastHours = HISTORY_DAYS * 24;
  const past = Array.from({ length: pastHours }, (_, i) => simulateHour(profile, loc.lon, hourStart - (pastHours - 1 - i) * HOUR_MS));
  const future = Array.from({ length: CHART_FUTURE_HOURS }, (_, i) => simulateHour(profile, loc.lon, hourStart + (i + 1) * HOUR_MS));
  const current = past[past.length - 1];
  if (!current) throw new Error('simulation produced no data');

  const scored = (h: (typeof past)[number]): ScoredPoint => ({ ts: h.ts, aqi: h.aqi, pm25: h.pollutants.pm25 });
  const hourly = [...past.slice(-CHART_PAST_HOURS), ...future].map((h) => toHourlyPoint(scored(h), 'simulated'));

  return assemble({
    source: 'simulated',
    provider: 'BreatheWise demo simulator',
    location: loc,
    observedAtMs: current.ts,
    pollutants: current.pollutants,
    hourly,
    daily: dailyAverages(past.map(scored), loc.lon),
    notes: [
      `SIMULATED DEMO DATA, not a real measurement. Patterns are modelled on typical winter conditions near ${profile.name}.`,
      'Add an OPENWEATHER_API_KEY on the server to switch to live data.',
    ],
    nowMs,
  });
}
