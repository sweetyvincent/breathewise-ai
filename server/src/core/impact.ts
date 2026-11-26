/** Impact tracker handlers: calculate (and optionally save) activities, and summarise history. */
import { MODES, type ModeId } from '../lib/emissions';
import { parseOrThrow } from '../lib/errors';
import { impactRequestSchema } from '../schemas';
import { calculateImpact, IMPACT_ASSUMPTIONS, IMPACT_DISCLAIMER, summarizeImpact } from '../services/impact';
import { needUser, type CallUser, type CoreDeps } from './types';

const HISTORY_DAYS = 190; // covers the 6-month chart plus a little slack
const RECENT_ACTIVITY_LIMIT = 20;
const MS_PER_DAY = 86_400_000;

const labelFor = (type: string): string => (type in MODES ? MODES[type as ModeId].label : type.replace(/_/g, ' '));

/** The personal impact tracker: estimate (and optionally save) activities, and summarise history. */
export function createImpactHandlers(d: CoreDeps) {
  return {
    async calculateImpact(input: unknown, user: CallUser | undefined) {
      const u = needUser(user);
      const b = parseOrThrow(impactRequestSchema, input);
      const result = calculateImpact(b.activities.map((a) => ({ type: a.type, distanceKm: a.distanceKm, count: a.count })));
      if (b.save) {
        for (const [i, item] of result.items.entries()) {
          const daysAgo = b.activities[i]?.daysAgo ?? 0;
          await d.store.addImpact({
            userId: u.id,
            transportType: item.type,
            distance: item.totalKm,
            tripCount: item.trips,
            estimatedCo2Saved: item.co2SavedKg,
            createdAt: new Date(Date.now() - daysAgo * MS_PER_DAY).toISOString(),
          });
        }
      }
      return { ...result, saved: b.save, estimate: true, disclaimer: IMPACT_DISCLAIMER, assumptions: IMPACT_ASSUMPTIONS };
    },

    async impactHistory(user: CallUser | undefined) {
      const u = needUser(user);
      const records = await d.store.listImpact(u.id, new Date(Date.now() - HISTORY_DAYS * MS_PER_DAY).toISOString());
      const recent = [...records]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, RECENT_ACTIVITY_LIMIT)
        .map((x) => ({
          id: x.id,
          type: x.transportType,
          label: labelFor(x.transportType),
          trips: x.tripCount,
          distanceKm: x.distance,
          co2SavedKg: x.estimatedCo2Saved,
          createdAt: x.createdAt,
        }));
      return { ...summarizeImpact(records), recent, estimate: true };
    },
  };
}
