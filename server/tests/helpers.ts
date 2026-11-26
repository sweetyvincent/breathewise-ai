import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import { buildDeps, type Deps } from '../src/deps';
import type { LlmClient } from '../src/services/ai/llmTypes';
import { createAiService } from '../src/services/ai';
import { createAirQualityService } from '../src/services/airQuality';
import type { AirQualityResult, EnvironmentContext } from '../src/services/types';
import { createWeatherService } from '../src/services/weather';

export const DELHI = { lat: 28.6139, lon: 77.209, name: 'Delhi, India' };
export const FIXED_NOW = Date.parse('2026-11-18T06:30:00Z');

export function testApp(env: Record<string, string> = {}, overrides: Partial<Deps> = {}) {
  const config = loadConfig({ NODE_ENV: 'test', ...env } as NodeJS.ProcessEnv);
  const deps = buildDeps(config, overrides);
  return { app: createApp(deps), deps };
}

export const demoAuth = (id = 'demo-testsession01') => ({ Authorization: `Bearer ${id}` });

export async function simulatedContext(lat = DELHI.lat, lon = DELHI.lon, now = FIXED_NOW): Promise<EnvironmentContext> {
  const air = await createAirQualityService({ now: () => now }).get({ lat, lon, name: 'Test city' });
  const weather = await createWeatherService({ now: () => now }).get({ lat, lon });
  return { air, weather };
}

/** Returns the context with the AQI forced to a specific category (for deterministic rule tests). */
export async function contextWithAqi(aqi: number): Promise<EnvironmentContext> {
  const ctx = await simulatedContext();
  const { categorize } = await import('../src/lib/aqi');
  const air: AirQualityResult = { ...ctx.air, aqi, category: categorize(aqi) };
  return { ...ctx, air };
}

export function mockLlm(handlers: { json?: () => unknown; chat?: () => string }): LlmClient {
  return {
    model: 'mock-model',
    async completeJson() {
      if (!handlers.json) throw new Error('no json handler');
      return handlers.json();
    },
    async chat() {
      if (!handlers.chat) throw new Error('no chat handler');
      return handlers.chat();
    },
  };
}

export { createAiService };
