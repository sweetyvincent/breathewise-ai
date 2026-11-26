import { Router } from 'express';
import { coreDeps, type Deps } from '../deps';
import { createHandlers } from '../core/handlers';

export function userRouter(deps: Deps): Router {
  const r = Router();
  const h = createHandlers(coreDeps(deps));

  r.get('/profile', deps.auth.required, async (req, res) => res.json(await h.getProfile(req.user)));
  r.put('/profile', deps.auth.required, async (req, res) => res.json(await h.putProfile(req.body, req.user)));
  return r;
}
