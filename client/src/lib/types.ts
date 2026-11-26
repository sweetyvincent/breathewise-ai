/** Types mirror the server's JSON responses (server/src/services/types.ts and route handlers). */

export type PollutantKey = 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type DataSource = 'live' | 'simulated';

export interface GeoPoint {
  name: string;
  lat: number;
  lon: number;
}

export interface AqiCategory {
  key: string;
  label: string;
  range: [number, number];
  level: 0 | 1 | 2 | 3 | 4 | 5;
  risk: RiskLevel;
  color: string;
  bg: string;
  fg: string;
  healthMessage: string;
  sensitiveMessage: string;
}

export interface HourlyPoint {
  time: string;
  aqi: number;
  pm25: number;
  kind: 'observed' | 'forecast' | 'simulated';
}
export interface DailyPoint {
  date: string;
  aqi: number;
  pm25: number;
}

export interface AirQuality {
  source: DataSource;
  provider: string;
  scale: { name: string; note: string };
  location: GeoPoint;
  observedAt: string;
  fetchedAt: string;
  ageMinutes: number;
  cached: boolean;
  aqi: number;
  category: AqiCategory;
  dominantPollutant: PollutantKey;
  pollutants: Record<PollutantKey, number>;
  subIndices: Record<PollutantKey, number>;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  notes: string[];
}

export interface Weather {
  source: DataSource;
  provider: string;
  observedAt: string;
  tempC: number;
  humidity: number;
  windSpeedMs: number;
  description: string;
}

export interface ServerMode {
  airQuality: 'live' | 'simulated';
  ai: 'openai' | 'rules';
  auth: 'supabase' | 'demo' | 'none';
  demoLoginEnabled: boolean;
  storage: 'memory' | 'supabase';
}

export interface DataQuality {
  source: DataSource;
  provider: string;
  scale: string;
  observedAt: string;
  ageMinutes: number;
  location: string;
  aqi: number;
  category: string;
  weatherAvailable: boolean;
  notes: string[];
}

export interface AiMeta {
  generatedBy: 'openai' | 'rules';
  fallbackReason: string | null;
  model: string | null;
  dataQuality: DataQuality;
}

export interface PlanProfile {
  ageGroup: 'child' | 'teen' | 'adult' | 'senior';
  occupation: 'student' | 'office' | 'remote' | 'field_outdoor' | 'driver_delivery' | 'homemaker' | 'retired' | 'other';
  commute: 'walk' | 'cycle' | 'two_wheeler' | 'car' | 'bus' | 'metro' | 'carpool' | 'work_from_home';
  outdoorFrequency: 'rarely' | 'weekly' | 'several_per_week' | 'daily';
  lifestyle: string[];
  sensitivities: string[];
  workHours: { start: string; end: string };
}

export interface DailyPlan {
  air_quality_summary: string;
  risk_level: RiskLevel;
  daily_recommendations: Array<{ time: 'Morning' | 'Afternoon' | 'Evening' | 'Night'; action: string; reason: string; impact: string }>;
  indoor_tips: string[];
  sustainable_actions: string[];
  important_note: string;
}
export type DailyPlanResponse = AiMeta & { plan: DailyPlan };

export interface HomeProfile {
  sizeSqm: number;
  rooms: number;
  budget: 'free' | 'low' | 'medium' | 'high';
  hasChildren: boolean;
  hasElderly: boolean;
  hasPets: boolean;
  ventilation: 'good' | 'limited' | 'none';
  hasAirConditioner: boolean;
  cooksIndoors: boolean;
  usesIncenseOrCandles: boolean;
  smokersInHome: boolean;
}

export interface Solution {
  title: string;
  detail: string;
  why: string;
  evidence: 'strong' | 'moderate' | 'limited';
  fits_budget: boolean;
}
export interface IndoorPlan {
  summary: string;
  risk_level: RiskLevel;
  ventilation_advice: { action: string; reason: string };
  purifier_guidance: { recommended_cadr_m3h: number | null; note: string };
  solutions: { free: Solution[]; low_budget: Solution[]; advanced: Solution[] };
  maintenance_reminders: string[];
  myths: Array<{ myth: string; reality: string }>;
  important_note: string;
}
export type IndoorResponse = AiMeta & { recommendations: IndoorPlan };

export type ModeId = 'walk' | 'cycle' | 'e_scooter' | 'metro' | 'bus' | 'carpool' | 'two_wheeler' | 'ev_car' | 'car_petrol' | 'car_diesel';
export type Suitability = 'recommended' | 'ok' | 'caution' | 'not_advised' | 'impractical';
export interface MobilityOption {
  mode: ModeId;
  label: string;
  emissionsKg: number;
  savedVsPreferredKg: number;
  savedVsBaselineKg: number;
  minutes: number;
  suitability: Suitability;
  exposureNote: string;
}
export interface MobilityResult {
  distanceKm: number;
  preferredMode: ModeId;
  recommended: { mode: ModeId; label: string; rationale: string };
  options: MobilityOption[];
  weekly: { tripsPerWeek: number; preferredKg: number; recommendedKg: number; savedKg: number };
  additionalIdeas: string[];
  assumptions: string[];
  importantNote: string;
}
export type MobilityResponse = AiMeta & { result: MobilityResult };

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
export interface ChatResponse {
  reply: string;
  generatedBy: 'openai' | 'rules';
  dataQuality: DataQuality | null;
  disclaimer: string;
}

export type ActivityType = 'walk' | 'cycle' | 'metro' | 'bus' | 'carpool' | 'e_scooter' | 'ev_car' | 'avoided_trip' | 'household_habit';
export interface ActivityInput {
  type: ActivityType;
  distanceKm: number;
  count: number;
  daysAgo: number;
}
export interface ImpactTotals {
  co2SavedKg: number;
  fuelSavedL: number;
  sustainableTrips: number;
  habits: number;
}
export interface ImpactCalcResponse {
  items: Array<{ type: ActivityType; label: string; trips: number; totalKm: number; co2SavedKg: number; fuelSavedL: number }>;
  totals: ImpactTotals;
  saved: boolean;
  disclaimer: string;
  assumptions: string[];
}
export interface ImpactSummary {
  co2SavedKg: number;
  trips: number;
  habits: number;
  fuelSavedL: number;
}
export interface ImpactHistory {
  allTime: ImpactSummary;
  last7Days: ImpactSummary;
  last30Days: ImpactSummary;
  weekly: Array<{ weekStart: string; co2SavedKg: number; trips: number }>;
  monthly: Array<{ month: string; co2SavedKg: number; trips: number }>;
  score: { value: number; label: string };
  disclaimer: string;
  assumptions: string[];
  recent: Array<{ id: string; type: string; label: string; trips: number; distanceKm: number; co2SavedKg: number; createdAt: string }>;
}

export interface CommunityReport {
  id: string;
  type: string;
  description: string;
  area: string;
  approxLat: number | null;
  approxLon: number | null;
  status: 'unverified' | 'verified' | 'rejected';
  statusLabel: string;
  createdAt: string;
  sample: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  location: GeoPoint | null;
  ageGroup: string | null;
  occupation: string | null;
  preferences: {
    commute?: string;
    outdoorFrequency?: string;
    lifestyle?: string[];
    sensitivities?: string[];
    workHours?: { start: string; end: string };
    notifications?: { highAqiAlerts: boolean; dailyPlanReminder: boolean };
    privacy?: { saveChatHistory: boolean; saveAqiHistory: boolean };
  };
  createdAt: string;
}
