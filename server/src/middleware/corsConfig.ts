/**
 * CORS Configuration - Production Ready
 * Task 1.6a from REMEDIATION_COMPLIANCE_PLAN.md
 *
 * Implements proper CORS with environment-based origin whitelisting
 * FedRAMP/SOC 2 compliant
 */

import cors from 'cors';
import { CorsOptions } from 'cors';

/**
 * Get production-ready CORS configuration
 * Only allows whitelisted origins in production
 */
export function getCorsConfig(): CorsOptions {
  const environment = process.env.NODE_ENV || 'development';
  const corsOrigin = process.env.CORS_ORIGIN;

  if (environment === 'production') {
    if (!corsOrigin) {
      throw new Error(
        'CRITICAL: CORS_ORIGIN must be set in production environment. ' +
        'Set CORS_ORIGIN to your frontend domain (e.g., https://fleet.capitaltechalliance.com)'
      );
    }

    // Production: strict origin whitelist
    const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Tenant-ID',
        'X-CSRF-Token'
      ],
      exposedHeaders: ['X-Total-Count', 'X-Page-Number', 'X-Page-Size'],
      maxAge: 86400, // 24 hours
      optionsSuccessStatus: 204
    };
  }

  // Development: allow localhost origins
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4200',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4200'
  ];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin
      if (!origin) {
        return callback(null, true);
      }

      if (devOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // In development, log but allow unknown origins with warning
        console.warn(`⚠️  Development mode: Allowing origin ${origin}`);
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Tenant-ID',
      'X-CSRF-Token'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Number', 'X-Page-Size'],
    maxAge: 3600, // 1 hour in dev
    optionsSuccessStatus: 204
  };
}

/**
 * Validate CORS configuration on application startup
 */
export function validateCorsConfig(): void {
  const environment = process.env.NODE_ENV || 'development';

  if (environment === 'production') {
    const corsOrigin = process.env.CORS_ORIGIN;

    if (!corsOrigin) {
      throw new Error(
        'CORS_ORIGIN environment variable is required in production. ' +
        'Example: CORS_ORIGIN=https://fleet.capitaltechalliance.com,https://admin.capitaltechalliance.com'
      );
    }

    const origins = corsOrigin.split(',').map(o => o.trim());

    // Validate each origin
    for (const origin of origins) {
      try {
        new URL(origin);
      } catch (error) {
        throw new Error(`Invalid CORS origin: ${origin}. Must be a valid URL.`);
      }

      // Warn if using HTTP in production
      if (origin.startsWith('http://')) {
        console.warn(
          `⚠️  WARNING: Using HTTP origin in production: ${origin}. ` +
          `HTTPS is strongly recommended for security.`
        );
      }
    }

    console.log(`✅ CORS configured for production with ${origins.length} allowed origin(s)`);
  } else {
    console.log('✅ CORS configured for development mode');
  }
}
