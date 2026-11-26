import type { AiService } from '../services/ai';
import type { AirQualityService, GeocodeService, WeatherService } from '../services/types';
import type { Store } from '../store/types';
import { AppError } from '../lib/errors';

/** Which providers are active; surfaced by `/api/health` so the UI can label demo vs live behaviour honestly. */
export interface ServerModeInfo {
  airQuality: 'live' | 'simulated';
  ai: 'openai' | 'rules';
  auth: 'supabase' | 'demo' | 'none';
  demoLoginEnabled: boolean;
  storage: 'memory' | 'supabase';
}

/** Everything the handlers need, injected so the same logic runs on Express, in tests and in the browser. */
export interface CoreDeps {
  store: Store;
  air: AirQualityService;
  weather: WeatherService;
  geocode: GeocodeService;
  ai: AiService;
  mode: ServerModeInfo;
  /** True when live providers do not exist at all (static build): every lookup is forced to simulated data. */
  alwaysSimulated?: boolean;
}

/** The authenticated caller, as resolved by the transport (Supabase JWT or demo token). */
export interface CallUser {
  id: string;
  email?: string;
  demo: boolean;
}

/** Narrows an optional caller to a signed-in one, or raises the standard 401. */
export function needUser(user: CallUser | undefined): CallUser {
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Please sign in (or start the demo session) to use this feature.');
  return user;
}
