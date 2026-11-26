import { Router } from 'express';
import { coreDeps, type Deps } from '../deps';
import { createHandlers } from '../core/handlers';

export function aiRouter(deps: Deps): Router {
  const r = Router();
  const h = createHandlers(coreDeps(deps));

  r.post('/daily-plan', deps.auth.optional, async (req, res) => res.json(await h.dailyPlan(req.body, req.user)));
  r.post('/indoor-recommendations', deps.auth.optional, async (req, res) => res.json(await h.indoor(req.body)));
  r.post('/mobility-recommendations', deps.auth.optional, async (req, res) => res.json(await h.mobility(req.body)));
  r.post('/chat', deps.auth.optional, async (req, res) => res.json(await h.chat(req.body, req.user)));
  r.get('/chat/history', deps.auth.required, async (req, res) => res.json(await h.chatHistory(req.user)));
  return r;
}
