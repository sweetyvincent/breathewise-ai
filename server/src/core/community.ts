import { parseOrThrow } from '../lib/errors';
import { haversineKm } from '../lib/geo';
import { coarsenCoordinate } from '../lib/sanitize';
import { reportRequestSchema, reportsQuerySchema } from '../schemas';
import type { CommunityReportRecord } from '../store/types';
import { toPublicReport } from './presenters';
import { needUser, type CallUser, type CoreDeps } from './types';

const REPORT_POOL_SIZE = 200; // fetch a pool, then sort by distance and trim to the requested limit

/** Community pollution reports: always labelled user-submitted/unverified, location coarsened before storage. */
export function createCommunityHandlers(d: CoreDeps) {
  return {
    async submitReport(input: unknown, user: CallUser | undefined) {
      const u = needUser(user);
      const b = parseOrThrow(reportRequestSchema, input);
      const hasCoords = b.lat !== undefined && b.lon !== undefined;
      const record = await d.store.addReport({
        userId: u.id,
        reportType: b.type,
        description: b.description,
        approximateLocation: b.areaLabel,
        approxLat: hasCoords ? coarsenCoordinate(b.lat!) : undefined,
        approxLon: hasCoords ? coarsenCoordinate(b.lon!) : undefined,
      });
      return {
        report: toPublicReport(record),
        message:
          'Thank you. Your report is saved as user-submitted and unverified until it is reviewed. Your exact location is never shown publicly.',
      };
    },

    async listReports(query: unknown) {
      const q = parseOrThrow(reportsQuerySchema, query);
      let rows = await d.store.listReports(REPORT_POOL_SIZE);
      if (q.lat !== undefined && q.lon !== undefined) {
        // Nearest first; reports without coordinates sort last.
        const distanceKm = (r: CommunityReportRecord) =>
          r.approxLat !== undefined && r.approxLon !== undefined ? haversineKm(q.lat!, q.lon!, r.approxLat, r.approxLon) : Infinity;
        rows = [...rows].sort((a, b) => distanceKm(a) - distanceKm(b));
      }
      return {
        reports: rows.slice(0, q.limit).map(toPublicReport),
        note: 'Reports are submitted by community members and have not been independently verified.',
      };
    },
  };
}
