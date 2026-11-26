/** Shared types for air quality, weather and the service interfaces. */
import type { AqiCategory, PollutantKey, Pollutants } from '../lib/aqi';

export type DataSource = 'live' | 'simulated';

export interface GeoPoint {
  name: string;
  lat: number;
  lon: number;
}

export interface HourlyPoint {
  time: string; // ISO
  aqi: number;
  pm25: number;
  /** observed = past measurement, forecast = provider forecast, simulated = demo data. */
  kind: 'observed' | 'forecast' | 'simulated';
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD (approx. local date)
  aqi: number;
  pm25: number;
}

export interface AirQualityResult {
  source: DataSource;
  provider: string;
  scale: { name: string; note: string };
  location: GeoPoint;
  observedAt: string;
  fetchedAt: string;
  ageMinutes: number;
  cached: boolean;
  aqi: number;
  category: AqiCategory;
  dominantPollutant: PollutantKey;
  pollutants: Pollutants;
  subIndices: Record<PollutantKey, number>;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  notes: string[];
}

export interface WeatherResult {
  source: DataSource;
  provider: string;
  location: GeoPoint;
  observedAt: string;
  tempC: number;
  humidity: number;
  windSpeedMs: number;
  description: string;
}

export interface AirQualityService {
  get(loc: { lat: number; lon: number; name?: string }, opts?: { forceSimulated?: boolean }): Promise<AirQualityResult>;
}

export interface WeatherService {
  get(loc: { lat: number; lon: number; name?: string }, opts?: { forceSimulated?: boolean }): Promise<WeatherResult>;
}

export interface GeocodeService {
  search(query: string): Promise<GeoPoint[]>;
}

/** Everything the recommendation engines need about the outside world. */
export interface EnvironmentContext {
  air: AirQualityResult;
  weather: WeatherResult | null;
}
