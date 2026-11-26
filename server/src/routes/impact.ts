import { Router } from 'express';
import { coreDeps, type Deps } from '../deps';
import { createHandlers } from '../core/handlers';

export function impactRouter(deps: Deps): Router {
  const r = Router();
  const h = createHandlers(coreDeps(deps));

  r.post('/calculate', deps.auth.required, async (req, res) => res.json(await h.calculateImpact(req.body, req.user)));
  r.get('/history', deps.auth.required, async (req, res) => res.json(await h.impactHistory(req.user)));
  return r;
}
