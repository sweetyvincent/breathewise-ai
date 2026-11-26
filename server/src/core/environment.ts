/** Health, air quality, weather and location-search handlers. */
import { z } from 'zod';
import { parseOrThrow } from '../lib/errors';
import { sanitizeText } from '../lib/sanitize';
import { locationSchema } from '../schemas';
import type { ContextLoader } from './context';
import type { CallUser, CoreDeps } from './types';

const SNAPSHOT_INTERVAL_MS = 3_600_000; // record at most one AQI history point per user per hour
const airQuerySchema = locationSchema.extend({ demo: z.enum(['true', 'false']).optional() });
const searchSchema = z.object({
  q: z
    .string()
    .max(100)
    .default('')
    .transform((s) => sanitizeText(s, 100)),
});

/** Health, air quality, weather and location search. */
export function createEnvironmentHandlers(d: CoreDeps, ctx: ContextLoader) {
  const lastSnapshot = new Map<string, number>(); // userId → epoch ms of the last saved snapshot

  /** Saves an AQI history point for signed-in users who have not opted out; never blocks or fails the request. */
  async function recordSnapshot(user: CallUser, air: Awaited<ReturnType<CoreDeps['air']['get']>>) {
    if (Date.now() - (lastSnapshot.get(user.id) ?? 0) <= SNAPSHOT_INTERVAL_MS) return;
    lastSnapshot.set(user.id, Date.now());
    if ((await ctx.privacyOf(user.id)).saveAqiHistory === false) return;
    await d.store
      .addAqiHistory({
        userId: user.id,
        location: air.location.name,
        aqi: air.aqi,
        pm25: air.pollutants.pm25,
        pm10: air.pollutants.pm10,
        recordedAt: air.observedAt,
      })
      .catch(() => undefined);
  }

  return {
    health: () => ({ status: 'ok', mode: d.mode, time: new Date().toISOString() }),

    async airQuality(query: unknown, user?: CallUser) {
      const q = parseOrThrow(airQuerySchema, query);
      const air = await d.air.get(q, { forceSimulated: ctx.isForcedSimulated(q.demo === 'true') });
      if (user) void recordSnapshot(user, air).catch(() => undefined); // best-effort; must never fail the request
      return air;
    },

    async weather(query: unknown) {
      const q = parseOrThrow(airQuerySchema, query);
      return d.weather.get(q, { forceSimulated: ctx.isForcedSimulated(q.demo === 'true') });
    },

    async searchLocations(query: unknown) {
      const { q } = parseOrThrow(searchSchema, query);
      return { results: await d.geocode.search(q), simulated: d.mode.airQuality === 'simulated' };
    },
  };
}
