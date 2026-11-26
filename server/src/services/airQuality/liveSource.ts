/** Live air-quality source: current, history and forecast from OpenWeather, scored with CPCB NAQI. */
import { computeAqi } from '../../lib/aqi';
import { logger } from '../../lib/logger';
import type { OpenWeatherClient, PollutionEntry } from '../openweather';
import type { AirQualityResult, GeoPoint } from '../types';
import { CHART_FUTURE_HOURS, CHART_PAST_HOURS, HISTORY_DAYS, HOUR_MS } from './constants';
import { assemble, dailyAverages, toHourlyPoint, toPollutants, type ScoredPoint } from './result';

const scoreEntry = (e: PollutionEntry): ScoredPoint => {
  const pollutants = toPollutants(e);
  return { ts: e.dt * 1000, pm25: pollutants.pm25, aqi: computeAqi(pollutants).aqi };
};

/** History and forecast are optional extras: if they fail we say so in the notes and carry on with the current reading. */
const optional = (what: string) => (error: unknown) => {
  logger.warn(`${what} unavailable; continuing without it`, { reason: String(error) });
  return [] as PollutionEntry[];
};

/** Fetches current, 7-day history and forecast from OpenWeather and shapes them into one result. */
export async function buildLiveResult(client: OpenWeatherClient, loc: GeoPoint, nowMs: number): Promise<AirQualityResult> {
  const nowSec = Math.floor(nowMs / 1000);
  const [current, history, forecast] = await Promise.all([
    client.currentPollution(loc.lat, loc.lon),
    client.pollutionHistory(loc.lat, loc.lon, nowSec - HISTORY_DAYS * 24 * 3600, nowSec).catch(optional('history')),
    client.pollutionForecast(loc.lat, loc.lon).catch(optional('forecast')),
  ]);
  if (!current) throw new Error('provider returned no current reading'); // surfaced as a 5xx by the caller

  const observed = history.map(scoreEntry).sort((a, b) => a.ts - b.ts);
  const upcoming = forecast
    .map(scoreEntry)
    .filter((p) => p.ts > nowMs)
    .sort((a, b) => a.ts - b.ts)
    .slice(0, CHART_FUTURE_HOURS);

  const hourly = [
    ...observed.filter((p) => p.ts > nowMs - CHART_PAST_HOURS * HOUR_MS).map((p) => toHourlyPoint(p, 'observed')),
    ...upcoming.map((p) => toHourlyPoint(p, 'forecast')),
  ];

  const notes = ['Live data from OpenWeather Air Pollution API (modelled/satellite-assisted; may differ from nearby ground stations).'];
  if (history.length === 0) notes.push('7-day history is currently unavailable.');
  if (forecast.length === 0) notes.push('Forecast is currently unavailable.');

  return assemble({
    source: 'live',
    provider: 'OpenWeather Air Pollution API',
    location: loc,
    observedAtMs: current.dt * 1000,
    pollutants: toPollutants(current),
    hourly,
    daily: dailyAverages(observed, loc.lon),
    notes,
    nowMs,
  });
}
