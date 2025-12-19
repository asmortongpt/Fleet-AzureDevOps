import dotenv from 'dotenv';

import { AppConfig } from '../types';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'AZURE_AD_CLIENT_ID',
  'AZURE_AD_TENANT_ID',
  'AZURE_AD_REDIRECT_URI',
  'DATABASE_HOST',
  'DATABASE_NAME',
  'DATABASE_USER',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  azureAd: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
    tenantId: process.env.AZURE_AD_TENANT_ID!,
    redirectUri: process.env.AZURE_AD_REDIRECT_URI!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fleet-management-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  database: {
    host: process.env.DATABASE_HOST!,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    database: process.env.DATABASE_NAME!,
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD || '',
    ssl: process.env.DATABASE_SSL === 'true',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased to 10 seconds for Azure PostgreSQL
  },

  redis: {
    host: process.env.REDIS_HOST || 'fleet-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  frontendUrl: process.env.FRONTEND_URL || 'https://fleet.capitaltechalliance.com',
  logLevel: process.env.LOG_LEVEL || 'info',
};
