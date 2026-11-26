import { Router } from 'express';
import { coreDeps, type Deps } from '../deps';
import { createHandlers } from '../core/handlers';
import { createLimiters } from '../middleware/common';

export function communityRouter(deps: Deps): Router {
  const r = Router();
  const h = createHandlers(coreDeps(deps));
  const { write } = createLimiters(deps.config);

  r.post('/report', deps.auth.required, write, async (req, res) => res.status(201).json(await h.submitReport(req.body, req.user)));
  r.get('/reports', async (req, res) => res.json(await h.listReports(req.query)));
  return r;
}
