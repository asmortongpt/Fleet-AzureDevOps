import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

dotenv.config();

export default {
  schema: './src/schemas/production.schema.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet_dev',
  },
  verbose: true,
  strict: true,
} satisfies Config;
