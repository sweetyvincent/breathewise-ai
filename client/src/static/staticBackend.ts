/**
 * In-browser "backend" for the static GitHub Pages build.
 *
 * GitHub Pages can only serve static files, so there is no Express server. This module answers the same
 * REST contract as the real API (see docs/API.md) by calling the server's own transport-agnostic handlers
 * (server/src/core/handlers.ts), so validation, the simulator, the rules engine and the impact maths are
 * shared code, not copies. Data is always simulated and clearly labelled; nothing leaves the browser.
 */
import { createHandlers, type CallUser } from '@server/core/handlers';
import { AppError } from '@server/lib/errors';
import { createAiService } from '@server/services/ai';
import { createAirQualityService } from '@server/services/airQuality';
import { createGeocodeService, createWeatherService } from '@server/services/weather';
import { MemoryStore } from '@server/store/memoryStore';

const handlers = createHandlers({
  store: new MemoryStore(),
  air: createAirQualityService({}),
  weather: createWeatherService({}),
  geocode: createGeocodeService({}),
  ai: createAiService(undefined), // no LLM in the browser: the deterministic rules engine answers
  mode: { airQuality: 'simulated', ai: 'rules', auth: 'demo', demoLoginEnabled: true, storage: 'memory' },
  alwaysSimulated: true,
});

export interface StaticRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  body?: unknown;
  token: string | null;
}

/** Same demo-token rule as the real server: `demo-` + 8–64 URL-safe characters. */
const DEMO_TOKEN = /^demo-[A-Za-z0-9_-]{8,64}$/;
const userFrom = (token: string | null): CallUser | undefined => (token && DEMO_TOKEN.test(token) ? { id: token, demo: true } : undefined);

export async function handleStatic(req: StaticRequest): Promise<unknown> {
  const { query } = req;
  // Round-trip the body through JSON so validation sees exactly what a network request would carry.
  const body: unknown = req.body === undefined ? undefined : JSON.parse(JSON.stringify(req.body));
  const user = userFrom(req.token);

  switch (`${req.method} ${req.path}`) {
    case 'GET /api/health':
      return handlers.health();
    case 'GET /api/air-quality':
      return handlers.airQuality(query, user);
    case 'GET /api/weather':
      return handlers.weather(query);
    case 'GET /api/locations/search':
      return handlers.searchLocations(query);
    case 'POST /api/ai/daily-plan':
      return handlers.dailyPlan(body, user);
    case 'POST /api/ai/indoor-recommendations':
      return handlers.indoor(body);
    case 'POST /api/ai/mobility-recommendations':
      return handlers.mobility(body);
    case 'POST /api/ai/chat':
      return handlers.chat(body, user);
    case 'GET /api/ai/chat/history':
      return handlers.chatHistory(user);
    case 'POST /api/impact/calculate':
      return handlers.calculateImpact(body, user);
    case 'GET /api/impact/history':
      return handlers.impactHistory(user);
    case 'POST /api/community/report':
      return handlers.submitReport(body, user);
    case 'GET /api/community/reports':
      return handlers.listReports(query);
    case 'GET /api/user/profile':
      return handlers.getProfile(user);
    case 'PUT /api/user/profile':
      return handlers.putProfile(body, user);
    default:
      throw new AppError(404, 'NOT_FOUND', 'Route not found.');
  }
}
