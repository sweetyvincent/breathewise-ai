import { Router } from 'express';
import { coreDeps, type Deps } from '../deps';
import { createHandlers } from '../core/handlers';

export function environmentRouter(deps: Deps): Router {
  const r = Router();
  const h = createHandlers(coreDeps(deps));

  r.get('/health', (_req, res) => res.json(h.health()));
  r.get('/air-quality', deps.auth.optional, async (req, res) => res.json(await h.airQuality(req.query, req.user)));
  r.get('/weather', async (req, res) => res.json(await h.weather(req.query)));
  r.get('/locations/search', async (req, res) => res.json(await h.searchLocations(req.query)));
  return r;
}
