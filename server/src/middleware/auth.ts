import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Config } from '../config';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import type { AuthUser } from '../types';

/** Demo sessions: `Bearer demo-<random id>`. Each id is an isolated in-memory user. Disabled in production unless DEMO_MODE=true. */
const DEMO_TOKEN = /^demo-[A-Za-z0-9_-]{8,64}$/;

export interface Authenticator {
  /** Attaches req.user when a valid token is present; never rejects. */
  optional: RequestHandler;
  /** Rejects with 401 unless a valid token is present. */
  required: RequestHandler;
}

export function createAuthenticator(config: Config, supabaseAdmin?: SupabaseClient): Authenticator {
  async function resolve(req: Request): Promise<AuthUser | undefined> {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) return undefined;
    const token = header.slice(7).trim();
    if (!token || token.length > 4096) return undefined;

    if (config.demoAuth && DEMO_TOKEN.test(token)) return { id: token, demo: true };

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data.user) {
        logger.debug('token rejected', { requestId: req.requestId });
        return undefined;
      }
      return { id: data.user.id, email: data.user.email ?? undefined, demo: false };
    }
    return undefined;
  }

  const optional: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.user = await resolve(req);
      next();
    } catch (err) {
      next(err);
    }
  };

  const required: RequestHandler = async (req, res, next) => {
    try {
      const user = await resolve(req);
      if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Please sign in (or start the demo session) to use this feature.');
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };

  return { optional, required };
}
