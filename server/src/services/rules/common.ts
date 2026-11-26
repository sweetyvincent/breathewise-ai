/** Helpers shared by the rules engine: caution levels, cleanest time window, standard advisory text. */
import { POLLUTANT_META } from '../../lib/aqi';
import { approxLocalHour, formatHourRange } from '../../lib/geo';
import type { AirQualityResult, EnvironmentContext } from '../types';

export const OFFICIAL_ADVISORY_NOTE =
  'This is general guidance, not medical advice. Follow official local health and pollution advisories (for example from your city, state pollution control board or health department), and speak to a doctor about personal health concerns.';

export const SEVERE_ADDENDUM =
  ' If you feel unwell, or symptoms such as breathing difficulty or chest discomfort appear, seek medical advice promptly.';

export function dataLabel(air: AirQualityResult): string {
  return air.source === 'live' ? 'measured/provider data' : 'SIMULATED demo data';
}

export function aqiPhrase(air: AirQualityResult): string {
  return `AQI ${air.aqi} (${air.category.label}; ${dataLabel(air)})`;
}

/** Children, older adults, or anyone who voluntarily listed a sensitivity get an extra level of caution. */
export function isSensitive(p: { ageGroup?: string; sensitivities?: readonly string[] }): boolean {
  return p.ageGroup === 'child' || p.ageGroup === 'senior' || (p.sensitivities?.length ?? 0) > 0;
}

export function cautionLevel(air: AirQualityResult, sensitive: boolean): number {
  const level = air.category.level;
  return Math.min(5, level + (sensitive && level >= 1 ? 1 : 0));
}

export interface CleanestWindow {
  label: string;
  startIso: string;
  avgAqi: number;
  basis: 'forecast' | 'simulated';
}

/**
 * Finds the cleanest consecutive two-hour daytime (6am–9pm approx. local) window among upcoming hours.
 * Returns null when no forecast exists (e.g. live provider without forecast) rather than guessing.
 */
export function cleanestWindow(air: AirQualityResult, nowMs: number = Date.parse(air.fetchedAt)): CleanestWindow | null {
  const upcoming = air.hourly.filter((h) => h.kind !== 'observed' && Date.parse(h.time) > nowMs).slice(0, 24);
  let best: { i: number; avg: number } | null = null;
  for (let i = 0; i < upcoming.length - 1; i++) {
    const a = upcoming[i];
    const b = upcoming[i + 1];
    if (!a || !b) continue;
    const h = approxLocalHour(new Date(a.time), air.location.lon);
    if (h < 6 || h > 19) continue;
    const avg = (a.aqi + b.aqi) / 2;
    if (!best || avg < best.avg) best = { i, avg };
  }
  if (!best) return null;
  const start = upcoming[best.i];
  if (!start) return null;
  const startHour = approxLocalHour(new Date(start.time), air.location.lon);
  return {
    label: `${formatHourRange(startHour, startHour + 2)} (approx. local time)`,
    startIso: start.time,
    avgAqi: Math.round(best.avg),
    basis: start.kind === 'forecast' ? 'forecast' : 'simulated',
  };
}

export function pollutantSummary(air: AirQualityResult): string {
  const m = POLLUTANT_META[air.dominantPollutant];
  return `${m.label} is the main pollutant right now (${air.pollutants[air.dominantPollutant]} ${m.unit}).`;
}

export function contextForPrompt(ctx: EnvironmentContext | null) {
  if (!ctx) return { available: false, note: 'No location selected, so no air-quality data is available.' };
  const { air, weather } = ctx;
  return {
    available: true,
    dataSource: air.source === 'live' ? 'live provider data' : 'SIMULATED demo data (not real measurements)',
    location: air.location.name,
    observedAt: air.observedAt,
    ageMinutes: air.ageMinutes,
    aqiScale: air.scale.name,
    aqi: air.aqi,
    category: air.category.label,
    dominantPollutant: POLLUTANT_META[air.dominantPollutant].label,
    pollutants: Object.fromEntries(
      (Object.keys(air.pollutants) as Array<keyof typeof air.pollutants>).map((k) => [
        POLLUTANT_META[k].label,
        `${air.pollutants[k]} ${POLLUTANT_META[k].unit}`,
      ]),
    ),
    weather: weather
      ? {
          dataSource: weather.source,
          tempC: weather.tempC,
          humidityPct: weather.humidity,
          windSpeedMs: weather.windSpeedMs,
          description: weather.description,
        }
      : 'unavailable',
    cleanestUpcomingWindow: cleanestWindow(air),
  };
}
