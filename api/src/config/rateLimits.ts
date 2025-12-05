/**
 * CRIT-F-004: Centralized Rate Limit Configuration
 *
 * This file defines all rate limiting configurations for the Fleet API.
 * Different environments (development, production) can have different limits.
 *
 * Rate limiting prevents:
 * - DoS attacks
 * - Brute force attacks
 * - API abuse
 * - Excessive costs from expensive operations
 *
 * @module config/rateLimits
 */

/**
 * Environment-based configuration
 */
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Rate limit multiplier for different environments
 * - Development: 100x limits (for testing)
 * - Staging: 10x limits (for load testing)
 * - Production: 1x limits (strict enforcement)
 */
const environmentMultiplier = (() => {
  if (isDevelopment) return 100
  if (process.env.NODE_ENV === 'staging') return 10
  return 1
})()

/**
 * Base time windows in milliseconds
 */
export const TimeWindows = {
  ONE_MINUTE: 1 * 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000
} as const

/**
 * Rate limit configurations by endpoint type
 */
export const RateLimitConfig = {
  /**
   * Authentication endpoints
   * Strictest limits to prevent brute force attacks
   */
  auth: {
    windowMs: TimeWindows.FIFTEEN_MINUTES,
    max: Math.min(5 * environmentMultiplier, 100), // Max 100 even in dev
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    skipSuccessfulRequests: true
  },

  /**
   * Registration endpoint
   * Very strict to prevent mass account creation and spam
   */
  registration: {
    windowMs: TimeWindows.ONE_HOUR,
    max: Math.min(3 * environmentMultiplier, 50),
    message: 'Too many account creation attempts. Please try again in 1 hour.'
  },

  /**
   * Password reset endpoint
   * Strict to prevent password reset abuse
   */
  passwordReset: {
    windowMs: TimeWindows.ONE_HOUR,
    max: Math.min(3 * environmentMultiplier, 30),
    message: 'Too many password reset attempts. Please try again in 1 hour.'
  },

  /**
   * Read operations (GET requests)
   * Moderate limits - most common operation
   */
  read: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: 100 * environmentMultiplier,
    message: 'Too many read requests. Please slow down.'
  },

  /**
   * Write operations (POST, PUT, PATCH, DELETE)
   * Stricter than reads to prevent data corruption and spam
   */
  write: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: 20 * environmentMultiplier,
    message: 'Too many write requests. Please slow down.'
  },

  /**
   * Administrative operations
   * Moderate limits for admin users
   */
  admin: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: 50 * environmentMultiplier,
    message: 'Too many administrative requests. Please slow down.'
  },

  /**
   * File upload operations
   * Very strict to prevent storage abuse and bandwidth costs
   */
  fileUpload: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: Math.min(5 * environmentMultiplier, 100),
    message: 'Too many file uploads. You can only upload 5 files per minute.'
  },

  /**
   * AI/ML processing
   * Extremely strict due to high computational costs
   */
  aiProcessing: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: Math.min(2 * environmentMultiplier, 20),
    message: 'AI processing is limited to 2 requests per minute due to computational costs.'
  },

  /**
   * OCR processing
   * Strict due to computational costs
   */
  ocrProcessing: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: Math.min(5 * environmentMultiplier, 50),
    message: 'OCR processing is limited to 5 requests per minute.'
  },

  /**
   * Search and analytics
   * Moderate limits - can be computationally expensive
   */
  search: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: 50 * environmentMultiplier,
    message: 'Too many search requests. Please slow down.'
  },

  /**
   * Report generation
   * Strict limits - very expensive operations
   */
  reportGeneration: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: Math.min(5 * environmentMultiplier, 30),
    message: 'Report generation is limited to 5 requests per minute.'
  },

  /**
   * Export operations (CSV, Excel, PDF)
   * Moderate limits - can be expensive
   */
  export: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: Math.min(10 * environmentMultiplier, 50),
    message: 'Export operations are limited to 10 per minute.'
  },

  /**
   * Real-time data (GPS, telemetry, live updates)
   * Higher limits - needs frequent updates
   */
  realtime: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: 200 * environmentMultiplier,
    message: 'Too many real-time data requests. Please slow down.'
  },

  /**
   * Webhook endpoints
   * Very high limits - external systems depend on these
   */
  webhook: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: 500 * environmentMultiplier,
    message: 'Webhook rate limit exceeded.'
  },

  /**
   * Global fallback
   * Applied to all endpoints without specific limits
   */
  global: {
    windowMs: TimeWindows.ONE_MINUTE,
    max: 30 * environmentMultiplier,
    message: 'Too many requests from this IP. Please try again later.'
  }
} as const

/**
 * Brute force protection configuration
 */
export const BruteForceConfig = {
  /**
   * Maximum failed login attempts before lockout
   */
  maxAttempts: isProduction ? 5 : 100,

  /**
   * How long to lock out after max attempts (15 minutes)
   */
  lockoutDuration: TimeWindows.FIFTEEN_MINUTES,

  /**
   * Time window for counting attempts (15 minutes)
   */
  windowMs: TimeWindows.FIFTEEN_MINUTES
} as const

/**
 * Whitelisted IPs (no rate limiting)
 * Add internal IPs, monitoring services, etc.
 */
export const WhitelistedIPs: string[] = [
  '127.0.0.1', // Localhost
  '::1', // IPv6 localhost
  // Add your internal IPs here
  ...(process.env.RATE_LIMIT_WHITELIST?.split(',') || [])
]

/**
 * Trusted proxy configuration
 * Important for getting correct client IPs behind load balancers
 */
export const TrustedProxies = {
  enabled: isProduction,
  // Number of proxies to trust (Azure Front Door, load balancer, etc.)
  count: parseInt(process.env.TRUSTED_PROXY_COUNT || '1', 10)
} as const

/**
 * Redis configuration for distributed rate limiting
 * Required for multi-instance deployments
 */
export const RedisConfig = {
  enabled: isProduction && !!process.env.REDIS_URL,
  url: process.env.REDIS_URL,
  prefix: 'ratelimit',
  // Fallback to in-memory if Redis is unavailable
  fallbackToMemory: true
} as const

/**
 * Rate limit header configuration
 */
export const HeaderConfig = {
  // Use standard RateLimit headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
  standardHeaders: true,
  // Don't use legacy X-RateLimit headers
  legacyHeaders: false
} as const

/**
 * Logging configuration
 */
export const LoggingConfig = {
  // Log all rate limit violations
  logViolations: true,
  // Log to Azure Application Insights if available
  useApplicationInsights: !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  // Log to Sentry if available
  useSentry: !!process.env.SENTRY_DSN
} as const

/**
 * Route-specific rate limit overrides
 * Maps route patterns to specific configurations
 */
export const RouteOverrides: Record<string, keyof typeof RateLimitConfig> = {
  '/api/auth/login': 'auth',
  '/api/auth/register': 'registration',
  '/api/auth/reset-password': 'passwordReset',
  '/api/auth/forgot-password': 'passwordReset',
  '/api/documents/upload': 'fileUpload',
  '/api/attachments/upload': 'fileUpload',
  '/api/ocr': 'ocrProcessing',
  '/api/ai-insights': 'aiProcessing',
  '/api/ai-search': 'aiProcessing',
  '/api/ai-tasks': 'aiProcessing',
  '/api/custom-reports': 'reportGeneration',
  '/api/executive-dashboard': 'reportGeneration',
  '/api/gps': 'realtime',
  '/api/telematics': 'realtime',
  '/api/search': 'search',
  '/api/webhooks': 'webhook'
} as const

/**
 * Export combined configuration
 */
export default {
  RateLimitConfig,
  BruteForceConfig,
  WhitelistedIPs,
  TrustedProxies,
  RedisConfig,
  HeaderConfig,
  LoggingConfig,
  RouteOverrides,
  TimeWindows,
  isDevelopment,
  isProduction,
  environmentMultiplier
}
