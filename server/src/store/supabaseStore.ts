/** Supabase-backed store; every query is scoped to the signed-in user (row-level security also enforces this). */
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import type { AqiHistoryRecord, ChatRecord, CommunityReportRecord, ImpactRecord, Store, UserRecord } from './types';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T | null {
  if (res.error) {
    logger.error('supabase error', { what, message: res.error.message });
    throw new AppError(503, 'UPSTREAM_UNAVAILABLE', 'The database is temporarily unavailable.');
  }
  return res.data;
}

/** Like check(), but a missing row is also an error (used after insert/upsert … .single()). */
function mustCheck<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  const data = check(res, what);
  if (data === null) throw new AppError(503, 'UPSTREAM_UNAVAILABLE', 'The database returned no data.');
  return data;
}

const toUser = (r: Row): UserRecord => ({
  id: r.id,
  name: r.name ?? '',
  email: r.email ?? undefined,
  location: r.location ?? undefined,
  ageGroup: r.age_group ?? undefined,
  occupation: r.occupation ?? undefined,
  preferences: r.preferences ?? {},
  createdAt: r.created_at,
});

const toReport = (r: Row): CommunityReportRecord => ({
  id: r.id,
  userId: r.user_id,
  reportType: r.report_type,
  description: r.description,
  approximateLocation: r.approximate_location,
  approxLat: r.approx_lat ?? undefined,
  approxLon: r.approx_lon ?? undefined,
  verificationStatus: r.verification_status,
  createdAt: r.created_at,
});

/** Uses the service-role key server-side only. Row Level Security still protects direct client access (see supabase/schema.sql). */
export class SupabaseStore implements Store {
  readonly kind = 'supabase' as const;
  constructor(private readonly db: SupabaseClient) {}

  async getUser(id: string) {
    const data = check(await this.db.from('users').select('*').eq('id', id).maybeSingle(), 'getUser');
    return data ? toUser(data) : undefined;
  }

  async upsertUser(user: Omit<UserRecord, 'createdAt'> & { createdAt?: string }) {
    const row = {
      id: user.id,
      name: user.name,
      email: user.email ?? null,
      location: user.location ?? null,
      age_group: user.ageGroup ?? null,
      occupation: user.occupation ?? null,
      preferences: user.preferences,
    };
    return toUser(mustCheck<Row>(await this.db.from('users').upsert(row).select('*').single(), 'upsertUser'));
  }

  async addAqiHistory(r: Omit<AqiHistoryRecord, 'id'>) {
    check(
      await this.db
        .from('aqi_history')
        .insert({ user_id: r.userId, location: r.location, aqi: r.aqi, pm25: r.pm25, pm10: r.pm10, recorded_at: r.recordedAt }),
      'addAqiHistory',
    );
  }

  async listAqiHistory(userId: string, limit: number) {
    const data = check(
      await this.db.from('aqi_history').select('*').eq('user_id', userId).order('recorded_at', { ascending: false }).limit(limit),
      'listAqiHistory',
    );
    return (data ?? []).map((r: Row) => ({
      id: r.id,
      userId: r.user_id,
      location: r.location,
      aqi: r.aqi,
      pm25: r.pm25,
      pm10: r.pm10,
      recordedAt: r.recorded_at,
    }));
  }

  async saveDailyPlan(userId: string, plan: unknown) {
    check(await this.db.from('daily_plans').insert({ user_id: userId, plan_data: plan }), 'saveDailyPlan');
  }

  async addChat(r: Omit<ChatRecord, 'id' | 'createdAt'>) {
    check(await this.db.from('chat_history').insert({ user_id: r.userId, message: r.message, response: r.response }), 'addChat');
  }

  async listChat(userId: string, limit: number) {
    const data = check(
      await this.db.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
      'listChat',
    );
    return (data ?? [])
      .map((r: Row) => ({ id: r.id, userId: r.user_id, message: r.message, response: r.response, createdAt: r.created_at }))
      .reverse();
  }

  async addImpact(r: Omit<ImpactRecord, 'id' | 'createdAt'> & { createdAt?: string }) {
    check(
      await this.db.from('impact_records').insert({
        user_id: r.userId,
        transport_type: r.transportType,
        distance: r.distance,
        trip_count: r.tripCount,
        estimated_co2_saved: r.estimatedCo2Saved,
        ...(r.createdAt ? { created_at: r.createdAt } : {}),
      }),
      'addImpact',
    );
  }

  async listImpact(userId: string, sinceIso: string) {
    const data = check(
      await this.db
        .from('impact_records')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: true })
        .limit(5000),
      'listImpact',
    );
    return (data ?? []).map((r: Row): ImpactRecord => ({
      id: r.id,
      userId: r.user_id,
      transportType: r.transport_type,
      distance: Number(r.distance),
      tripCount: Number(r.trip_count ?? 1),
      estimatedCo2Saved: Number(r.estimated_co2_saved),
      createdAt: r.created_at,
    }));
  }

  async addReport(r: Omit<CommunityReportRecord, 'id' | 'createdAt' | 'verificationStatus'>) {
    const data = mustCheck<Row>(
      await this.db
        .from('community_reports')
        .insert({
          user_id: r.userId,
          report_type: r.reportType,
          description: r.description,
          approximate_location: r.approximateLocation,
          approx_lat: r.approxLat ?? null,
          approx_lon: r.approxLon ?? null,
          verification_status: 'unverified',
        })
        .select('*')
        .single(),
      'addReport',
    );
    return toReport(data);
  }

  async listReports(limit: number) {
    const data = check(
      await this.db
        .from('community_reports')
        .select('*')
        .neq('verification_status', 'rejected')
        .order('created_at', { ascending: false })
        .limit(limit),
      'listReports',
    );
    return (data ?? []).map(toReport);
  }
}
