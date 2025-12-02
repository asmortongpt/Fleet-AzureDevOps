/**
 * Environment-Specific Security Configuration
 * Phase 2 Task 1 - FedRAMP/SOC 2 compliant
 */

export const securityConfig = {
  development: {
    sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
    cookieSecure: false,
    corsOrigins: ['http://localhost:*'],
    rateLimits: { api: 1000, auth: 50 },
    csp: { enforceMode: false }
  },
  staging: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes  
    cookieSecure: true,
    corsOrigins: process.env.STAGING_ORIGINS?.split(',') || [],
    rateLimits: { api: 500, auth: 10 },
    csp: { enforceMode: true }
  },
  production: {
    sessionTimeout: 15 * 60 * 1000, // 15 minutes
    cookieSecure: true,
    corsOrigins: process.env.CORS_ORIGIN?.split(',') || [],
    rateLimits: { api: 100, auth: 5 },
    csp: { enforceMode: true }
  }
}[process.env.NODE_ENV || 'development'];
