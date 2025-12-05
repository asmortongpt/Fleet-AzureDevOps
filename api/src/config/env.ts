import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
});

export type Env = z.infer<typeof envSchema>;

export function loadConfig(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('Environment validation failed:');
      err.errors.forEach(e => console.error(`  ${e.path}: ${e.message}`));
      process.exit(1);
    }
    throw err;
  }
}

export const config = loadConfig();
