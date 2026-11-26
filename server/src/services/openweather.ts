/** Thin, validated OpenWeather client. The API key lives only on the server and never appears in logs or errors. */
import { z } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

const BASE = 'https://api.openweathermap.org';
const TIMEOUT_MS = 8000;

const Components = z.object({
  co: z.number(),
  no2: z.number(),
  o3: z.number(),
  so2: z.number(),
  pm2_5: z.number(),
  pm10: z.number(),
});
const PollutionResponse = z.object({
  list: z.array(z.object({ dt: z.number(), components: Components })),
});
export type PollutionEntry = z.infer<typeof PollutionResponse>['list'][number];

const WeatherResponse = z.object({
  dt: z.number(),
  main: z.object({ temp: z.number(), humidity: z.number() }),
  wind: z.object({ speed: z.number() }),
  weather: z.array(z.object({ description: z.string() })).default([]),
});
export type OwWeather = z.infer<typeof WeatherResponse>;

const GeoResponse = z.array(
  z.object({ name: z.string(), lat: z.number(), lon: z.number(), country: z.string().optional(), state: z.string().optional() }),
);

export type FetchLike = typeof fetch;

export class OpenWeatherClient {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  private async getJson<S extends z.ZodTypeAny>(path: string, params: Record<string, string | number>, schema: S): Promise<z.infer<S>> {
    const url = new URL(path, BASE);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    url.searchParams.set('appid', this.apiKey);
    let res: Response;
    try {
      res = await this.fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (err) {
      logger.warn('openweather request failed', { path, reason: err instanceof Error ? err.name : 'unknown' });
      throw new AppError(503, 'UPSTREAM_UNAVAILABLE', 'The air-quality data provider could not be reached.');
    }
    if (!res.ok) {
      logger.warn('openweather non-2xx', { path, status: res.status });
      throw new AppError(503, 'UPSTREAM_UNAVAILABLE', `The air-quality data provider returned an error (${res.status}).`);
    }
    const parsed = schema.safeParse(await res.json().catch(() => null));
    if (!parsed.success) {
      logger.warn('openweather response failed validation', { path });
      throw new AppError(503, 'UPSTREAM_UNAVAILABLE', 'The data provider returned an unexpected response.');
    }
    return parsed.data;
  }

  async currentPollution(lat: number, lon: number): Promise<PollutionEntry | undefined> {
    const r = await this.getJson('/data/2.5/air_pollution', { lat, lon }, PollutionResponse);
    return r.list[0];
  }

  async pollutionHistory(lat: number, lon: number, startSec: number, endSec: number): Promise<PollutionEntry[]> {
    const r = await this.getJson('/data/2.5/air_pollution/history', { lat, lon, start: startSec, end: endSec }, PollutionResponse);
    return r.list;
  }

  async pollutionForecast(lat: number, lon: number): Promise<PollutionEntry[]> {
    const r = await this.getJson('/data/2.5/air_pollution/forecast', { lat, lon }, PollutionResponse);
    return r.list;
  }

  weather(lat: number, lon: number): Promise<OwWeather> {
    return this.getJson('/data/2.5/weather', { lat, lon, units: 'metric' }, WeatherResponse);
  }

  async geocode(query: string): Promise<Array<{ name: string; lat: number; lon: number }>> {
    const r = await this.getJson('/geo/1.0/direct', { q: query, limit: 5 }, GeoResponse);
    return r.map((g) => ({
      name: [g.name, g.state, g.country].filter(Boolean).join(', '),
      lat: g.lat,
      lon: g.lon,
    }));
  }
}
