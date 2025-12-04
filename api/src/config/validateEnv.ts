import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production'], {
    message: 'NODE_ENV must be development, staging, or production'
  }),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string({
    message: 'DATABASE_URL is required'
  }).url(),
  JWT_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32),
});

export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.issues.forEach((issue, index) => {
        console.error(\`  \${index + 1}. \${issue.path.join('.')}: \${issue.message}\`);
      });
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}
