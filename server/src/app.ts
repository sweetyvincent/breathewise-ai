/** Express app factory: security headers, CORS, body limits, rate limits, routes and error handling. */
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Deps } from './deps';
import { createLimiters, errorHandler, notFound, requestContext } from './middleware/common';
import { aiRouter } from './routes/ai';
import { communityRouter } from './routes/community';
import { environmentRouter } from './routes/environment';
import { impactRouter } from './routes/impact';
import { userRouter } from './routes/user';

export function createApp(deps: Deps): Express {
  const { config } = deps;
  const app = express();
  app.disable('x-powered-by');
  if (config.isProd) app.set('trust proxy', 1); // correct client IPs behind Render/Railway for rate limiting

  const limiters = createLimiters(config);

  app.use(requestContext);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Allow non-browser clients (no Origin) and configured front-end origins only.
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '50kb' }));
  app.use('/api', limiters.general);

  app.use('/api', environmentRouter(deps));
  app.use('/api/ai', limiters.ai, aiRouter(deps));
  app.use('/api/impact', impactRouter(deps));
  app.use('/api/community', communityRouter(deps));
  app.use('/api/user', userRouter(deps));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
