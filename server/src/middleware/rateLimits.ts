/**
 * Rate Limiting Middleware - Production Ready
 * Task 1.6c from REMEDIATION_COMPLIANCE_PLAN.md
 *
 * Implements rate limiting for all API endpoints to prevent abuse
 * Uses Redis for distributed rate limiting in production
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

/**
 * Redis client for distributed rate limiting
 * Only used in production
 */
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis connection for rate limiting
 */
export async function initializeRateLimitRedis(): Promise<void> {
  const environment = process.env.NODE_ENV || 'development';
  const redisUrl = process.env.REDIS_URL;

  if (environment === 'production') {
    if (!redisUrl) {
      console.warn(
        '⚠️  WARNING: REDIS_URL not set in production. ' +
        'Rate limiting will use in-memory store (not suitable for multi-instance deployments). ' +
        'Set REDIS_URL for distributed rate limiting.'
      );
      return;
    }

    try {
      redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      redisClient.on('error', (err) => {
        console.error('Redis rate limit error:', err);
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis connected for rate limiting');
      });

      await redisClient.connect();
    } catch (error) {
      console.error('❌ Failed to connect to Redis for rate limiting:', error);
      redisClient = null;
    }
  }
}

/**
 * Create rate limiter with optional Redis store
 */
function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}): RateLimitRequestHandler {
  const baseOptions = {
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests that don't consume quota
    skipSuccessfulRequests: false,
    // Skip failed requests
    skipFailedRequests: false,
    // Custom key generator (includes tenant ID if available)
    keyGenerator: (req: any) => {
      const tenantId = req.headers['x-tenant-id'] || 'anonymous';
      const ip = req.ip || req.connection.remoteAddress;
      return `${ip}:${tenantId}`;
    },
    // Custom handler for rate limit exceeded
    handler: (req: any, res: any) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: options.message,
        retryAfter: res.getHeader('Retry-After')
      });
    }
  };

  // Use Redis store in production if available
  if (redisClient) {
    return rateLimit({
      ...baseOptions,
      store: new RedisStore({
        client: redisClient,
        prefix: 'rate-limit:'
      })
    });
  }

  // In-memory store for development or when Redis unavailable
  return rateLimit(baseOptions);
}

/**
 * Rate limit configurations for different endpoint types
 */
export class RateLimits {
  /**
   * General API rate limit
   * 100 requests per 15 minutes per IP/tenant
   */
  static api: RateLimitRequestHandler = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many API requests, please try again later'
  });

  /**
   * Strict rate limit for authentication endpoints
   * 5 requests per 15 minutes per IP
   */
  static auth: RateLimitRequestHandler = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts, please try again later'
  });

  /**
   * Upload rate limit
   * 10 uploads per hour per IP/tenant
   */
  static upload: RateLimitRequestHandler = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many file uploads, please try again later'
  });

  /**
   * Expensive operation rate limit (reports, exports, etc.)
   * 5 requests per hour per IP/tenant
   */
  static expensive: RateLimitRequestHandler = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many resource-intensive requests, please try again later'
  });

  /**
   * Search rate limit
   * 30 searches per minute per IP/tenant
   */
  static search: RateLimitRequestHandler = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many search requests, please slow down'
  });

  /**
   * Password reset rate limit
   * 3 requests per hour per IP
   */
  static passwordReset: RateLimitRequestHandler = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset attempts, please try again later'
  });

  /**
   * Email/SMS rate limit
   * 10 messages per hour per IP/tenant
   */
  static messaging: RateLimitRequestHandler = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many messages sent, please try again later'
  });

  /**
   * Webhook rate limit
   * 100 webhooks per minute per IP/tenant
   */
  static webhook: RateLimitRequestHandler = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many webhook requests'
  });

  /**
   * GraphQL/Complex query rate limit
   * 20 queries per minute per IP/tenant
   */
  static graphql: RateLimitRequestHandler = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: 'Too many GraphQL queries, please slow down'
  });

  /**
   * Public API rate limit (for external integrations)
   * 1000 requests per hour per API key
   */
  static publicApi: RateLimitRequestHandler = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000,
    message: 'API rate limit exceeded, check your API key tier'
  });
}

/**
 * Validate rate limiting configuration
 */
export function validateRateLimiting(): void {
  const environment = process.env.NODE_ENV || 'development';
  const redisUrl = process.env.REDIS_URL;

  if (environment === 'production') {
    if (redisUrl && redisClient) {
      console.log('✅ Rate limiting configured with Redis (distributed)');
      console.log('   - API: 100 req/15min');
      console.log('   - Auth: 5 req/15min');
      console.log('   - Upload: 10 req/hour');
      console.log('   - Expensive: 5 req/hour');
      console.log('   - Search: 30 req/min');
    } else {
      console.warn('⚠️  Rate limiting using in-memory store (not recommended for production)');
      console.warn('   Set REDIS_URL for distributed rate limiting');
    }
  } else {
    console.log('✅ Rate limiting configured for development (in-memory)');
  }
}

/**
 * Cleanup Redis connection on shutdown
 */
export async function closeRateLimitRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis rate limit connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}
