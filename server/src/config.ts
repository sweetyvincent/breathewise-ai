import 'dotenv/config';
import { z } from 'zod';

/** Treat empty strings (as left in a copied .env.example) as "not set". */
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : undefined));

const boolish = z
  .string()
  .optional()
  .transform((v) => (v ?? '').toLowerCase() === 'true');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  OPENWEATHER_API_KEY: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  SUPABASE_URL: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  /** Enables the shared-nothing demo login (`Bearer demo-<id>`). Defaults on outside production when Supabase is absent. */
  DEMO_MODE: boolish,
  RATE_LIMIT_GENERAL_PER_MIN: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_AI_PER_MIN: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_WRITE_PER_HOUR: z.coerce.number().int().positive().default(20),
});

export interface Config {
  env: 'development' | 'test' | 'production';
  isProd: boolean;
  port: number;
  corsOrigins: string[];
  openWeatherKey?: string;
  openaiKey?: string;
  openaiModel: string;
  supabase?: { url: string; serviceKey: string };
  demoAuth: boolean;
  rateLimits: { generalPerMin: number; aiPerMin: number; writePerHour: number };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const e = parsed.data;
  const supabase =
    e.SUPABASE_URL && e.SUPABASE_SERVICE_ROLE_KEY ? { url: e.SUPABASE_URL, serviceKey: e.SUPABASE_SERVICE_ROLE_KEY } : undefined;
  const isProd = e.NODE_ENV === 'production';
  return {
    env: e.NODE_ENV,
    isProd,
    port: e.PORT,
    corsOrigins: e.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    openWeatherKey: e.OPENWEATHER_API_KEY,
    openaiKey: e.OPENAI_API_KEY,
    openaiModel: e.OPENAI_MODEL,
    supabase,
    demoAuth: e.DEMO_MODE || (!supabase && !isProd),
    rateLimits: {
      generalPerMin: e.RATE_LIMIT_GENERAL_PER_MIN,
      aiPerMin: e.RATE_LIMIT_AI_PER_MIN,
      writePerHour: e.RATE_LIMIT_WRITE_PER_HOUR,
    },
  };
}
