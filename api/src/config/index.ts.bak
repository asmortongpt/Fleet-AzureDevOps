/**
 * Configuration index file
 */

export const config = {
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,

  // Application Insights
  applicationInsights: {
    connectionString: process.env.APPLICATION_INSIGHTS_CONNECTION_STRING ||
                     process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    enabled: !!process.env.APPLICATION_INSIGHTS_CONNECTION_STRING
  },

  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    enabled: !!process.env.SENTRY_DSN
  },

  // API Settings
  api: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  }
}

export default config