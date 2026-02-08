import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env if present
dotenv.config();

const emptyToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  MONGODB_URI: z.preprocess(emptyToUndefined, z.string().url().optional()),
  MONGODB_DB_NAME: z.preprocess(emptyToUndefined, z.string().optional()),
  MONGODB_PLACES_COLLECTION: z.string().default('places'),
  MONGODB_INSIGHTS_COLLECTION: z.string().default('refinedInsights'),
  MONGODB_ADMISSION_BLOCKS_COLLECTION: z.string().default('admission_blocks'),
  CORS_ORIGIN: z.preprocess(emptyToUndefined, z.string().optional()),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  DEVICE_AUTH_ENABLED: booleanFromString,
  // Supabase (for JWT verification)
  SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  SUPABASE_SERVICE_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  // Claude API (for bot)
  ANTHROPIC_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  // Toss Payments
  TOSS_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  TOSS_CLIENT_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  // Expo Push
  EXPO_ACCESS_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),
  // data.go.kr
  DATA_GO_KR_KEY: z.preprocess(emptyToUndefined, z.string().optional()),

  // Redis (BullMQ workers)
  REDIS_URL: z.preprocess(emptyToUndefined, z.string().optional().default('redis://localhost:6379')),
  // AI worker provider
  AI_PROVIDER: z.preprocess(emptyToUndefined, z.string().optional().default('stub')),

  // Git SHA (set by CI/CD)
  GIT_SHA: z.preprocess(emptyToUndefined, z.string().optional()),

  // Sentry (error tracking, optional)
  SENTRY_DSN: z.preprocess(emptyToUndefined, z.string().url().optional()),

  // Partner / Referral / External ingest (UJUz Hybrid)
  ADMIN_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  PARTNER_KEY_HASH_SALT: z.preprocess(emptyToUndefined, z.string().optional()),
  REFERRAL_ATTRIBUTION_DAYS: z.coerce.number().int().positive().default(14),
  WIDGET_PUBLIC_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  throw new Error(`Invalid environment variables: ${message}`);
}

export const env = parsed.data;
