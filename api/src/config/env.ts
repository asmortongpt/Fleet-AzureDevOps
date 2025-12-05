import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  DB_POOL_MIN: z.string().transform(Number).default('2'),
  DB_POOL_MAX: z.string().transform(Number).default('10'),
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
      console.error(\`  - \${e.path.join('.')}: \${e.message}\`);
    });
    process.exit(1);
  }
  throw error;
}
