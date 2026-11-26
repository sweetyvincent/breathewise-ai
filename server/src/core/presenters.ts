/** Shapes internal records into the public JSON the API returns (no internal ids, nothing fabricated). */
import type { EnvironmentContext } from '../services/types';
import type { CommunityReportRecord, UserRecord } from '../store/types';

/** Public projection: no user id, coordinates already coarsened (~1 km), always labelled unverified until reviewed. */
export function toPublicReport(r: CommunityReportRecord) {
  return {
    id: r.id,
    type: r.reportType,
    description: r.description,
    area: r.approximateLocation,
    approxLat: r.approxLat ?? null,
    approxLon: r.approxLon ?? null,
    status: r.verificationStatus,
    statusLabel: r.verificationStatus === 'verified' ? 'Reviewed and verified' : 'User-submitted · Unverified until reviewed',
    createdAt: r.createdAt,
    sample: r.seeded === true,
  };
}

export function toPublicUser(u: UserRecord) {
  return {
    id: u.id,
    name: u.name,
    email: u.email ?? null,
    location: u.location ?? null,
    ageGroup: u.ageGroup ?? null,
    occupation: u.occupation ?? null,
    preferences: u.preferences,
    createdAt: u.createdAt,
  };
}

/** Compact, user-facing description of what data an answer was based on (never fabricated). */
export function dataQuality({ air, weather }: EnvironmentContext) {
  return {
    source: air.source,
    provider: air.provider,
    scale: air.scale.name,
    observedAt: air.observedAt,
    ageMinutes: air.ageMinutes,
    location: air.location.name,
    aqi: air.aqi,
    category: air.category.label,
    weatherAvailable: weather !== null,
    notes: air.notes,
  };
}

/** Provenance of a recommendation: which engine produced it and why a fallback happened, if it did. */
export function aiMeta(g: { generatedBy: string; fallbackReason?: string | null; model?: string | null }) {
  return { generatedBy: g.generatedBy, fallbackReason: g.fallbackReason ?? null, model: g.model ?? null };
}
