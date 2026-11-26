/** Weather and geocoding services (OpenWeather when configured, labelled simulated data otherwise). */
import { TtlCache } from '../lib/cache';
import type { OpenWeatherClient } from './openweather';
import { nearestProfile, simulatedWeather } from './simulated';
import type { GeoPoint, GeocodeService, WeatherResult, WeatherService } from './types';
import { DEMO_CITIES } from './simulated';

export function createWeatherService(opts: { openWeather?: OpenWeatherClient; now?: () => number }): WeatherService {
  const now = opts.now ?? Date.now;
  const cache = new TtlCache<WeatherResult>(10 * 60_000, 300, now);
  return {
    async get(input, o = {}) {
      const loc: GeoPoint = {
        name: input.name?.trim() || `${input.lat.toFixed(2)}, ${input.lon.toFixed(2)}`,
        lat: input.lat,
        lon: input.lon,
      };
      const simulated = o.forceSimulated || !opts.openWeather;
      const key = `${simulated ? 's' : 'l'}:${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}`;
      const hit = cache.get(key);
      if (hit) return { ...hit.value, location: loc };
      let result: WeatherResult;
      if (simulated || !opts.openWeather) {
        const w = simulatedWeather(nearestProfile(loc.lat, loc.lon), loc.lon, now());
        result = { source: 'simulated', provider: 'BreatheWise demo simulator', location: loc, ...w };
      } else {
        const w = await opts.openWeather.weather(loc.lat, loc.lon);
        result = {
          source: 'live',
          provider: 'OpenWeather Current Weather API',
          location: loc,
          observedAt: new Date(w.dt * 1000).toISOString(),
          tempC: Math.round(w.main.temp * 10) / 10,
          humidity: Math.round(w.main.humidity),
          windSpeedMs: Math.round(w.wind.speed * 10) / 10,
          description: w.weather[0]?.description ?? 'n/a',
        };
      }
      cache.set(key, result);
      return result;
    },
  };
}

export function createGeocodeService(opts: { openWeather?: OpenWeatherClient }): GeocodeService {
  return {
    async search(query) {
      const q = query.trim().toLowerCase();
      if (!q) return DEMO_CITIES.map(({ name, lat, lon }) => ({ name, lat, lon }));
      if (opts.openWeather) return opts.openWeather.geocode(query);
      return DEMO_CITIES.filter((c) => c.name.toLowerCase().includes(q)).map(({ name, lat, lon }) => ({ name, lat, lon }));
    },
  };
}
