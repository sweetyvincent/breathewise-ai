/** In-memory store used for demo mode and tests (data resets on restart). */
import { randomUUID } from 'node:crypto';
import type { AqiHistoryRecord, ChatRecord, CommunityReportRecord, ImpactRecord, Store, UserRecord } from './types';

const CAP = 500; // per-user cap keeps the demo store bounded

function pushCapped<T>(arr: T[], item: T) {
  arr.push(item);
  if (arr.length > CAP) arr.shift();
}

const SEED_REPORTS: Array<
  Omit<CommunityReportRecord, 'id' | 'createdAt' | 'verificationStatus' | 'userId' | 'seeded'> & { hoursAgo: number }
> = [
  {
    reportType: 'construction_dust',
    description: 'Uncovered construction site with no water sprinkling; dust visible across the road.',
    approximateLocation: 'Sector 21 (sample)',
    approxLat: 28.58,
    approxLon: 77.32,
    hoursAgo: 5,
  },
  {
    reportType: 'garbage_burning',
    description: 'Small pile of leaves and plastic being burned behind the market in the evening.',
    approximateLocation: 'Old Market Road (sample)',
    approxLat: 28.64,
    approxLon: 77.21,
    hoursAgo: 20,
  },
  {
    reportType: 'vehicle_emissions',
    description: 'Idling diesel trucks near the school gate during drop-off time.',
    approximateLocation: 'Green Park Lane (sample)',
    approxLat: 28.56,
    approxLon: 77.2,
    hoursAgo: 30,
  },
];

export class MemoryStore implements Store {
  readonly kind = 'memory' as const;
  private users = new Map<string, UserRecord>();
  private aqi = new Map<string, AqiHistoryRecord[]>();
  private chats = new Map<string, ChatRecord[]>();
  private impacts = new Map<string, ImpactRecord[]>();
  private plans = new Map<string, unknown[]>();
  private reports: CommunityReportRecord[] = [];

  constructor(seed = true) {
    if (seed) {
      const now = Date.now();
      this.reports = SEED_REPORTS.map(({ hoursAgo, ...r }) => ({
        ...r,
        id: randomUUID(),
        userId: 'seed',
        verificationStatus: 'unverified' as const,
        createdAt: new Date(now - hoursAgo * 3_600_000).toISOString(),
        seeded: true,
      }));
    }
  }

  async getUser(id: string) {
    return this.users.get(id);
  }

  async upsertUser(user: Omit<UserRecord, 'createdAt'> & { createdAt?: string }) {
    const existing = this.users.get(user.id);
    const record: UserRecord = { ...existing, ...user, createdAt: existing?.createdAt ?? user.createdAt ?? new Date().toISOString() };
    this.users.set(user.id, record);
    return record;
  }

  async addAqiHistory(r: Omit<AqiHistoryRecord, 'id'>) {
    pushCapped(this.aqi.get(r.userId) ?? this.aqi.set(r.userId, []).get(r.userId)!, { ...r, id: randomUUID() });
  }

  async listAqiHistory(userId: string, limit: number) {
    return (this.aqi.get(userId) ?? []).slice(-limit).reverse();
  }

  async saveDailyPlan(userId: string, plan: unknown) {
    pushCapped(this.plans.get(userId) ?? this.plans.set(userId, []).get(userId)!, plan);
  }

  async addChat(r: Omit<ChatRecord, 'id' | 'createdAt'>) {
    pushCapped(this.chats.get(r.userId) ?? this.chats.set(r.userId, []).get(r.userId)!, {
      ...r,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });
  }

  async listChat(userId: string, limit: number) {
    return (this.chats.get(userId) ?? []).slice(-limit);
  }

  async addImpact(r: Omit<ImpactRecord, 'id' | 'createdAt'> & { createdAt?: string }) {
    pushCapped(this.impacts.get(r.userId) ?? this.impacts.set(r.userId, []).get(r.userId)!, {
      ...r,
      id: randomUUID(),
      createdAt: r.createdAt ?? new Date().toISOString(),
    });
  }

  async listImpact(userId: string, sinceIso: string) {
    return (this.impacts.get(userId) ?? []).filter((r) => r.createdAt >= sinceIso);
  }

  async addReport(r: Omit<CommunityReportRecord, 'id' | 'createdAt' | 'verificationStatus'>) {
    const record: CommunityReportRecord = { ...r, id: randomUUID(), createdAt: new Date().toISOString(), verificationStatus: 'unverified' };
    this.reports.unshift(record);
    if (this.reports.length > 1000) this.reports.pop();
    return record;
  }

  async listReports(limit: number) {
    return [...this.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }
}
