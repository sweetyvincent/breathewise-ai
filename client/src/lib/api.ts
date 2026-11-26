import type {
  ActivityInput,
  AirQuality,
  ChatMessage,
  ChatResponse,
  CommunityReport,
  DailyPlanResponse,
  HomeProfile,
  ImpactCalcResponse,
  ImpactHistory,
  IndoorResponse,
  MobilityResponse,
  ModeId,
  PlanProfile,
  ServerMode,
  UserProfile,
  Weather,
  GeoPoint,
} from './types';

/** True for the GitHub Pages build: no server exists, so requests are answered in the browser (see src/static). */
export const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === 'true';

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
  /** Human-friendly message, including field problems when the server rejected the input. */
  get friendly(): string {
    if (this.details?.length) return `${this.message} ${this.details.map((d) => `${d.field}: ${d.message}`).join('; ')}`;
    return this.message;
  }
}

type TokenProvider = () => Promise<string | null>;
let tokenProvider: TokenProvider = async () => null;
export const setTokenProvider = (fn: TokenProvider) => {
  tokenProvider = fn;
};

async function request<T>(
  method: string,
  path: string,
  opts: { body?: unknown; query?: Record<string, string | number | boolean | undefined>; signal?: AbortSignal } = {},
): Promise<T> {
  if (STATIC_MODE) return staticRequest<T>(method, path, opts);
  const url = new URL(`${BASE}${path}`, window.location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = await tokenProvider();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined, signal: opts.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK', 'Cannot reach the BreatheWise server. Check your connection and try again.');
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (data as { error?: { code?: string; message?: string; details?: ApiError['details'] } } | null)?.error;
    throw new ApiError(res.status, e?.code ?? 'ERROR', e?.message ?? `Request failed (${res.status}).`, e?.details);
  }
  return data as T;
}

async function staticRequest<T>(
  method: string,
  path: string,
  opts: { body?: unknown; query?: Record<string, string | number | boolean | undefined> },
): Promise<T> {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== '') query[k] = String(v);
  try {
    const { handleStatic } = await import('../static/staticBackend'); // code-split; absent from normal builds
    return (await handleStatic({ method, path, query, body: opts.body, token: await tokenProvider() })) as T;
  } catch (err) {
    const e = err as { status?: number; code?: string; message?: string; details?: ApiError['details'] };
    if (typeof e.status === 'number') throw new ApiError(e.status, e.code ?? 'ERROR', e.message ?? 'Request failed.', e.details);
    throw err;
  }
}

type Loc = { lat: number; lon: number; name?: string };

export const api = {
  health: (signal?: AbortSignal) => request<{ status: string; mode: ServerMode }>('GET', '/api/health', { signal }),
  airQuality: (loc: Loc, demo: boolean, signal?: AbortSignal) =>
    request<AirQuality>('GET', '/api/air-quality', { query: { ...loc, demo: demo || undefined }, signal }),
  weather: (loc: Loc, demo: boolean, signal?: AbortSignal) =>
    request<Weather>('GET', '/api/weather', { query: { ...loc, demo: demo || undefined }, signal }),
  searchLocations: (q: string, signal?: AbortSignal) =>
    request<{ results: GeoPoint[]; simulated: boolean }>('GET', '/api/locations/search', { query: { q }, signal }),

  dailyPlan: (location: Loc, profile: PlanProfile, demo: boolean) =>
    request<DailyPlanResponse>('POST', '/api/ai/daily-plan', { body: { location, profile, demo } }),
  indoor: (location: Loc, home: HomeProfile, demo: boolean) =>
    request<IndoorResponse>('POST', '/api/ai/indoor-recommendations', { body: { location, home, demo } }),
  mobility: (body: {
    location: Loc;
    origin?: string;
    destination?: string;
    distanceKm: number;
    preferredMode: ModeId;
    tripsPerWeek: number;
    sensitive: boolean;
    travellingWithChildrenOrElderly: boolean;
    demo: boolean;
  }) => request<MobilityResponse>('POST', '/api/ai/mobility-recommendations', { body }),
  chat: (body: { messages: ChatMessage[]; location?: Loc; profile?: Partial<PlanProfile>; demo: boolean }, signal?: AbortSignal) =>
    request<ChatResponse>('POST', '/api/ai/chat', { body, signal }),

  calculateImpact: (activities: ActivityInput[], save = true) =>
    request<ImpactCalcResponse>('POST', '/api/impact/calculate', { body: { activities, save } }),
  impactHistory: () => request<ImpactHistory>('GET', '/api/impact/history'),

  reports: (loc?: Loc) =>
    request<{ reports: CommunityReport[]; note: string }>('GET', '/api/community/reports', { query: { lat: loc?.lat, lon: loc?.lon } }),
  submitReport: (body: { type: string; description: string; areaLabel: string; lat?: number; lon?: number }) =>
    request<{ report: CommunityReport; message: string }>('POST', '/api/community/report', { body }),

  getProfile: () => request<{ profile: UserProfile; demo: boolean }>('GET', '/api/user/profile'),
  putProfile: (body: unknown) => request<{ profile: UserProfile }>('PUT', '/api/user/profile', { body }),
};
