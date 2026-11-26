import type { HomeProfile, PlanProfile } from './types';
import { safeStorage } from './utils';

export const DEFAULT_PLAN_PROFILE: PlanProfile = {
  ageGroup: 'adult',
  occupation: 'office',
  commute: 'metro',
  outdoorFrequency: 'several_per_week',
  lifestyle: ['outdoor_exercise'],
  sensitivities: [],
  workHours: { start: '09:00', end: '17:00' },
};

export const DEFAULT_HOME: HomeProfile = {
  sizeSqm: 70,
  rooms: 3,
  budget: 'low',
  hasChildren: false,
  hasElderly: false,
  hasPets: false,
  ventilation: 'limited',
  hasAirConditioner: false,
  cooksIndoors: true,
  usesIncenseOrCandles: false,
  smokersInHome: false,
};

const KEY = 'bw.planProfile';
export const loadSavedProfile = (): PlanProfile | null => safeStorage.get<PlanProfile | null>(KEY, null);
export const saveProfileLocally = (p: PlanProfile) => safeStorage.set(KEY, p);
export const clearLocalData = () => {
  for (const k of [KEY, 'bw.location', 'bw.forceDemo', 'bw.chat', 'bw.challenges', 'bw.home']) safeStorage.remove(k);
  safeStorage.remove('bw.demoId', globalThis.sessionStorage);
};

/** Small stable hash for cache keys. */
export const hashOf = (v: unknown): string => {
  const s = JSON.stringify(v);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
};
