import { z } from 'zod';
import logger from './logger';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production'], {
    message: 'NODE_ENV must be development, staging, or production'
  }),
  PORT: z.string().default('3000').transform(Number),
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
      logger.error('Environment validation failed');
      error.issues.forEach((issue, index) => {
        logger.error('Environment validation issue', { index: index + 1, path: issue.path.join('.'), message: issue.message });
      });
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}
