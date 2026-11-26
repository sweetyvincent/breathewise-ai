import { createApp } from './app';
import { loadConfig } from './config';
import { buildDeps } from './deps';
import { logger } from './lib/logger';

const config = loadConfig();
const deps = buildDeps(config);
const app = createApp(deps);

const server = app.listen(config.port, () => {
  logger.info('BreatheWise API listening', {
    port: config.port,
    env: config.env,
    airQuality: config.openWeatherKey ? 'live' : 'simulated',
    ai: deps.ai.engine,
    auth: config.supabase ? 'supabase' : config.demoAuth ? 'demo' : 'none',
    storage: deps.store.kind,
  });
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    logger.info('shutting down', { sig });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  });
}
