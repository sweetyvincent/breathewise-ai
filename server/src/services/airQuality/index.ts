import { TtlCache } from '../../lib/cache';
import type { OpenWeatherClient } from '../openweather';
import type { AirQualityResult, AirQualityService, GeoPoint } from '../types';
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS } from './constants';
import { buildLiveResult } from './liveSource';
import { ageMinutes } from './result';
import { buildSimulatedResult } from './simulatedSource';

/** Cache per ~1 km cell, with live and simulated results kept apart so they can never be mixed up. */
const cacheKey = (lat: number, lon: number, simulated: boolean) => `${simulated ? 's' : 'l'}:${lat.toFixed(2)},${lon.toFixed(2)}`;

const displayName = (input: { name?: string; lat: number; lon: number }) =>
  input.name?.trim() || `${input.lat.toFixed(2)}, ${input.lon.toFixed(2)}`;

interface AirQualityOptions {
  openWeather?: OpenWeatherClient;
  now?: () => number; // injectable clock for tests
}

/** Air-quality lookups: live from OpenWeather when configured, otherwise labelled simulated data; 10-minute cache. */
export function createAirQualityService(opts: AirQualityOptions): AirQualityService {
  const now = opts.now ?? Date.now;
  const cache = new TtlCache<AirQualityResult>(CACHE_TTL_MS, CACHE_MAX_ENTRIES, now);

  return {
    async get(input, options = {}) {
      const loc: GeoPoint = { name: displayName(input), lat: input.lat, lon: input.lon };
      const client = opts.openWeather;
      const useSimulated = options.forceSimulated || !client;

      const key = cacheKey(loc.lat, loc.lon, useSimulated);
      const hit = cache.get(key);
      if (hit) {
        return {
          ...hit.value,
          location: { ...hit.value.location, name: loc.name },
          cached: true,
          ageMinutes: ageMinutes(now(), Date.parse(hit.value.observedAt)),
        };
      }

      const result = client && !useSimulated ? await buildLiveResult(client, loc, now()) : buildSimulatedResult(loc, now());
      cache.set(key, result);
      return result;
    },
  };
}
