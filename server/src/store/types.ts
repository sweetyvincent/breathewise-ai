/** Store interface and record types; both implementations satisfy it. */
import type { ActivityType } from '../schemas';

export interface UserRecord {
  id: string;
  name: string;
  email?: string;
  location?: { lat: number; lon: number; name?: string };
  ageGroup?: string;
  occupation?: string;
  preferences: Record<string, unknown>;
  createdAt: string;
}

export interface AqiHistoryRecord {
  id: string;
  userId: string;
  location: string;
  aqi: number;
  pm25: number;
  pm10: number;
  recordedAt: string;
}

export interface ChatRecord {
  id: string;
  userId: string;
  message: string;
  response: string;
  createdAt: string;
}

export interface ImpactRecord {
  id: string;
  userId: string;
  transportType: ActivityType;
  /** Total distance across all trips in this record (km). */
  distance: number;
  /** Number of trips/actions this record represents. */
  tripCount: number;
  estimatedCo2Saved: number;
  createdAt: string;
}

export type VerificationStatus = 'unverified' | 'verified' | 'rejected';

export interface CommunityReportRecord {
  id: string;
  userId: string;
  reportType: string;
  description: string;
  approximateLocation: string;
  approxLat?: number;
  approxLon?: number;
  verificationStatus: VerificationStatus;
  createdAt: string;
  seeded?: boolean;
}

/** Persistence boundary. Implemented in-memory (demo) and on Supabase (production). */
export interface Store {
  readonly kind: 'memory' | 'supabase';
  getUser(id: string): Promise<UserRecord | undefined>;
  upsertUser(user: Omit<UserRecord, 'createdAt'> & { createdAt?: string }): Promise<UserRecord>;
  addAqiHistory(r: Omit<AqiHistoryRecord, 'id'>): Promise<void>;
  listAqiHistory(userId: string, limit: number): Promise<AqiHistoryRecord[]>;
  saveDailyPlan(userId: string, plan: unknown): Promise<void>;
  addChat(r: Omit<ChatRecord, 'id' | 'createdAt'>): Promise<void>;
  listChat(userId: string, limit: number): Promise<ChatRecord[]>;
  addImpact(r: Omit<ImpactRecord, 'id' | 'createdAt'> & { createdAt?: string }): Promise<void>;
  listImpact(userId: string, sinceIso: string): Promise<ImpactRecord[]>;
  addReport(r: Omit<CommunityReportRecord, 'id' | 'createdAt' | 'verificationStatus'>): Promise<CommunityReportRecord>;
  listReports(limit: number): Promise<CommunityReportRecord[]>;
}
