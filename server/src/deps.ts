/** Dependency wiring: builds the real services from config, with overrides so tests can inject fakes. */
import { createClient } from '@supabase/supabase-js';
import type { Config } from './config';
import { createAuthenticator, type Authenticator } from './middleware/auth';
import { createAiService, type AiService } from './services/ai';
import { createOpenAiClient } from './services/ai/llm';
import { createAirQualityService } from './services/airQuality';
import { OpenWeatherClient } from './services/openweather';
import type { AirQualityService, GeocodeService, WeatherService } from './services/types';
import { createGeocodeService, createWeatherService } from './services/weather';
import type { CoreDeps } from './core/handlers';
import { MemoryStore } from './store/memoryStore';
import { SupabaseStore } from './store/supabaseStore';
import type { Store } from './store/types';

export interface Deps {
  config: Config;
  store: Store;
  auth: Authenticator;
  air: AirQualityService;
  weather: WeatherService;
  geocode: GeocodeService;
  ai: AiService;
}

/** The slice of Deps the transport-agnostic handlers need. */
export function coreDeps(d: Deps): CoreDeps {
  return {
    store: d.store,
    air: d.air,
    weather: d.weather,
    geocode: d.geocode,
    ai: d.ai,
    mode: {
      airQuality: d.config.openWeatherKey ? 'live' : 'simulated',
      ai: d.ai.engine === 'openai' ? 'openai' : 'rules',
      auth: d.config.supabase ? 'supabase' : d.config.demoAuth ? 'demo' : 'none',
      demoLoginEnabled: d.config.demoAuth,
      storage: d.store.kind,
    },
  };
}

/** Wires real implementations from configuration. Tests pass `overrides` to inject fakes. */
export function buildDeps(config: Config, overrides: Partial<Deps> = {}): Deps {
  const supabaseAdmin = config.supabase
    ? createClient(config.supabase.url, config.supabase.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : undefined;
  const openWeather = config.openWeatherKey ? new OpenWeatherClient(config.openWeatherKey) : undefined;
  const llm = config.openaiKey ? createOpenAiClient(config.openaiKey, config.openaiModel) : undefined;

  return {
    config,
    store: supabaseAdmin ? new SupabaseStore(supabaseAdmin) : new MemoryStore(),
    auth: createAuthenticator(config, supabaseAdmin),
    air: createAirQualityService({ openWeather }),
    weather: createWeatherService({ openWeather }),
    geocode: createGeocodeService({ openWeather }),
    ai: createAiService(llm),
    ...overrides,
  };
}
