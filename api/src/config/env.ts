import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  DB_POOL_MIN: z.string().default('2').transform(Number),
  DB_POOL_MAX: z.string().default('10').transform(Number),
  JWT_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

try {
  envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.issues.forEach((e) => {
      console.error(`  - ${e.path.join('.')}: ${e.message}`);
    });
    process.exit(1);
  }
  throw error;
}
