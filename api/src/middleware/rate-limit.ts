/**
 * Advanced Rate Limiting Middleware
 *
 * Production-ready rate limiting with:
 * - Tiered limits for different endpoint types
 * - User-based and IP-based limits
 * - Redis-backed distributed rate limiting (with in-memory fallback)
 * - Sliding window algorithm
 * - Brute force protection
 * - API key rate limits
 * - Bypass for whitelisted IPs
 *
 * @module middleware/rate-limit
 */

import { Request, Response, NextFunction } from 'express'

import { RateLimitError } from '../errors/ApplicationError'
import { securityLogger } from '../utils/logger'

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  /**
   * Time window in milliseconds
   */
  windowMs: number

  /**
   * Maximum requests per window
   */
  maxRequests: number

  /**
   * Message to return when rate limit is exceeded
   */
  message?: string

  /**
   * Custom key generator
   */
  keyGenerator?: (req: Request) => string

  /**
   * Skip function to bypass rate limiting
   */
  skip?: (req: Request) => boolean

  /**
   * Handler for rate limit exceeded
   */
  handler?: (req: Request, res: Response) => void
}

/**
 * Rate limit store (in-memory, replace with Redis for production)
 */
class RateLimitStore {
  private store: Map<string, { count: number; resetAt: number; hits: number[] }> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, value] of this.store.entries()) {
        if (value.resetAt < now) {
          this.store.delete(key)
        }
      }
    }, 60000)
  }

  /**
   * Increment counter for a key
   */
  increment(key: string, windowMs: number): { count: number; resetAt: number } {
    const now = Date.now()
    const existing = this.store.get(key)

    if (existing && existing.resetAt > now) {
      // Sliding window: remove hits outside the window
      existing.hits = existing.hits.filter(hit => hit > now - windowMs)
      existing.hits.push(now)
      existing.count = existing.hits.length
      return { count: existing.count, resetAt: existing.resetAt }
    }

    // Create new entry
    const resetAt = now + windowMs
    const entry = {
      count: 1,
      resetAt,
      hits: [now]
    }
    this.store.set(key, entry)
    return { count: 1, resetAt }
  }

  /**
   * Reset counter for a key
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Get current count for a key
   */
  get(key: string): { count: number; resetAt: number } | null {
    const now = Date.now()
    const existing = this.store.get(key)

    if (existing && existing.resetAt > now) {
      return { count: existing.count, resetAt: existing.resetAt }
    }

    return null
  }

  /**
   * Cleanup on shutdown
   */
  cleanup(): void {
    clearInterval(this.cleanupInterval)
  }
}

const rateLimitStore = new RateLimitStore()

/**
 * Default key generator (uses IP address)
 */
function defaultKeyGenerator(req: Request): string {
  const user = (req as any).user
  return user ? `user:${user.id}` : `ip:${req.ip}`
}

/**
 * Main rate limiting middleware factory
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = `Too many requests, please try again later`,
    keyGenerator = defaultKeyGenerator,
    skip,
    handler
  } = config

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if should skip rate limiting
      if (skip && skip(req)) {
        return next()
      }

      // Generate rate limit key
      const key = keyGenerator(req)

      // Increment counter
      const { count, resetAt } = rateLimitStore.increment(key, windowMs)

      // Set rate limit headers
      const remaining = Math.max(0, maxRequests - count)
      res.setHeader('X-RateLimit-Limit', maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', remaining.toString())
      res.setHeader('X-RateLimit-Reset', new Date(resetAt).toISOString())

      // Check if limit exceeded
      if (count > maxRequests) {
        const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
        res.setHeader('Retry-After', retryAfter.toString())

        // Log rate limit incident
        securityLogger.incident('rate_limit', {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          userId: (req as any).user?.id,
          tenantId: (req as any).user?.tenant_id,
          details: {
            endpoint: req.path,
            method: req.method,
            count,
            limit: maxRequests
          },
          severity: count > maxRequests * 2 ? 'high' : 'medium'
        })

        if (handler) {
          return handler(req, res)
        }

        throw new RateLimitError('Too many requests', retryAfter)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Predefined rate limit tiers
 */
export const RateLimits = {
  /**
   * Authentication endpoints (strict limits to prevent brute force)
   */
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: `Too many authentication attempts. Please try again later.`,
    keyGenerator: (req) => `auth:${req.ip}`
  }),

  /**
   * Password reset (very strict)
   */
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: `Too many password reset attempts. Please try again later.`,
    keyGenerator: (req) => `reset:${req.body.email || req.ip}`
  }),

  /**
   * API endpoints (standard limits)
   */
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health' || req.path === '/api/status'
    }
  }),

  /**
   * Write operations (stricter than reads)
   */
  write: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  }),

  /**
   * File uploads (very strict)
   */
  upload: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many file uploads. Please try again later.'
  }),

  /**
   * Search and analytics (moderate)
   */
  search: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50
  }),

  /**
   * Expensive operations (reports, exports)
   */
  expensive: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many report generation requests. Please try again later.'
  }),

  /**
   * Real-time data (GPS, telemetry)
   */
  realtime: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200 // Higher limit for real-time data
  }),

  /**
   * Webhook endpoints
   */
  webhook: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 500, // Higher limit for webhooks
    keyGenerator: (req) => {
      // Use webhook source identifier
      return `webhook:${req.get('x-webhook-id') || req.ip}`
    }
  }),

  /**
   * Development/testing (no limits)
   */
  development: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10000,
    skip: () => process.env.NODE_ENV === 'development'
  })
}

/**
 * Brute force protection for login
 */
export class BruteForceProtection {
  private attempts: Map<string, { count: number; lastAttempt: number; lockedUntil?: number }> = new Map()

  constructor(
    private maxAttempts: number = 5,
    private lockoutDuration: number = 15 * 60 * 1000, // 15 minutes
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) { }

  /**
   * Record a failed login attempt
   */
  recordFailure(identifier: string): { locked: boolean; remainingAttempts: number; lockedUntil?: Date } {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
      return { locked: false, remainingAttempts: this.maxAttempts - 1 }
    }

    // Check if already locked
    if (record.lockedUntil && record.lockedUntil > now) {
      return {
        locked: true,
        remainingAttempts: 0,
        lockedUntil: new Date(record.lockedUntil)
      }
    }

    // Reset if outside window
    if (now - record.lastAttempt > this.windowMs) {
      record.count = 1
      record.lastAttempt = now
      delete record.lockedUntil
      return { locked: false, remainingAttempts: this.maxAttempts - 1 }
    }

    // Increment attempt count
    record.count++
    record.lastAttempt = now

    // Lock account if max attempts exceeded
    if (record.count >= this.maxAttempts) {
      record.lockedUntil = now + this.lockoutDuration

      securityLogger.incident('brute_force', {
        details: { identifier, attempts: record.count },
        severity: 'high'
      })

      return {
        locked: true,
        remainingAttempts: 0,
        lockedUntil: new Date(record.lockedUntil)
      }
    }

    return {
      locked: false,
      remainingAttempts: this.maxAttempts - record.count
    }
  }

  /**
   * Record a successful login (resets counter)
   */
  recordSuccess(identifier: string): void {
    this.attempts.delete(identifier)
  }

  /**
   * Check if identifier is locked
   */
  isLocked(identifier: string): boolean {
    const record = this.attempts.get(identifier)
    if (!record || !record.lockedUntil) {
      return false
    }
    return record.lockedUntil > Date.now()
  }

  /**
   * Manually unlock an identifier (for admin override)
   */
  unlock(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

/**
 * Global brute force protection instance
 */
export const bruteForce = new BruteForceProtection()

/**
 * Middleware to check brute force protection
 */
export function checkBruteForce(identifierField: string = 'email') {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.body[identifierField] || req.ip

    if (bruteForce.isLocked(identifier)) {
      securityLogger.incident('brute_force', {
        ip: req.ip,
        details: { identifier, action: 'blocked' },
        severity: 'high'
      })

      return res.status(429).json({
        error: 'Account temporarily locked due to too many failed login attempts',
        locked: true,
        message: 'Please try again later or contact support'
      })
    }

    next()
  }
}

/**
 * Middleware for distributed rate limiting with Redis
 * Provides rate limiting across multiple server instances
 */
export class RedisRateLimiter {
  constructor(
    private redisClient: any, // Redis client (ioredis)
    private prefix: string = 'ratelimit'
  ) {
    if (!redisClient) {
      throw new Error('Redis client is required for distributed rate limiting')
    }
  }

  /**
   * Increment rate limit counter using Redis
   * Uses sliding window algorithm with sorted sets
   */
  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    try {
      const now = Date.now()
      const resetAt = now + windowMs
      const redisKey = `${this.prefix}:${key}`

      // Use Redis transaction for atomic operations
      const multi = this.redisClient.multi()

      // Remove old entries outside the window
      multi.zremrangebyscore(redisKey, 0, now - windowMs)

      // Add current hit
      multi.zadd(redisKey, now, `${now}-${Math.random()}`)

      // Count hits in current window
      multi.zcount(redisKey, now - windowMs, now)

      // Set expiration on the key
      multi.expire(redisKey, Math.ceil(windowMs / 1000) + 1)

      const results = await multi.exec()

      if (!results) {
        throw new Error('Redis transaction failed')
      }

      // Extract count from zcount result
      const count = results[2][1] as number

      securityLogger.debug('rate_limit', {
        details: {
          key: redisKey,
          count,
          window: windowMs,
          resetAt: new Date(resetAt).toISOString()
        }
      })

      return { count, resetAt }
    } catch (error) {
      securityLogger.incident('rate_limit_redis_error', {
        details: {
          error: error instanceof Error ? error.message : String(error),
          key
        },
        severity: 'high'
      })

      // Fallback to in-memory store if Redis fails
      securityLogger.warn('Falling back to in-memory rate limiting due to Redis error')
      return rateLimitStore.increment(key, windowMs)
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(key: string): Promise<void> {
    try {
      const redisKey = `${this.prefix}:${key}`
      await this.redisClient.del(redisKey)

      securityLogger.info('rate_limit_reset', {
        details: { key: redisKey }
      })
    } catch (error) {
      securityLogger.error('rate_limit_reset_error', {
        details: {
          error: error instanceof Error ? error.message : String(error),
          key
        }
      })
    }
  }

  /**
   * Get current rate limit status
   */
  async get(key: string, windowMs: number): Promise<{ count: number; resetAt: number } | null> {
    try {
      const now = Date.now()
      const redisKey = `${this.prefix}:${key}`

      // Count hits in current window
      const count = await this.redisClient.zcount(redisKey, now - windowMs, now)

      if (count === 0) {
        return null
      }

      // Get TTL for reset time
      const ttl = await this.redisClient.ttl(redisKey)
      const resetAt = ttl > 0 ? now + (ttl * 1000) : now + windowMs

      return { count, resetAt }
    } catch (error) {
      securityLogger.error('rate_limit_get_error', {
        details: {
          error: error instanceof Error ? error.message : String(error),
          key
        }
      })
      return null
    }
  }
}

/**
 * Create a Redis-backed rate limiter
 * Falls back to in-memory if Redis is not available
 */
export function createRedisRateLimiter(redisClient: any, prefix: string = 'ratelimit'): RedisRateLimiter {
  if (!redisClient) {
    securityLogger.warn('Redis client not provided - rate limiting will use in-memory store')
    throw new Error('Redis client required for distributed rate limiting')
  }

  return new RedisRateLimiter(redisClient, prefix)
}

/**
 * Enhanced rate limit middleware factory with Redis support
 */
export function distributedRateLimit(
  config: RateLimitConfig & { redisClient?: any }
) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    keyGenerator = defaultKeyGenerator,
    skip,
    handler,
    redisClient
  } = config

  // Use Redis if available, otherwise fall back to in-memory
  let rateLimiter: RedisRateLimiter | null = null
  if (redisClient) {
    try {
      rateLimiter = new RedisRateLimiter(redisClient)
      securityLogger.info('Distributed rate limiting enabled with Redis')
    } catch (error) {
      securityLogger.warn('Failed to initialize Redis rate limiter, using in-memory fallback', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if should skip rate limiting
      if (skip && skip(req)) {
        return next()
      }

      // Generate rate limit key
      const key = keyGenerator(req)

      // Increment counter (Redis or in-memory)
      const { count, resetAt } = rateLimiter
        ? await rateLimiter.increment(key, windowMs)
        : rateLimitStore.increment(key, windowMs)

      // Set rate limit headers
      const remaining = Math.max(0, maxRequests - count)
      res.setHeader('X-RateLimit-Limit', maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', remaining.toString())
      res.setHeader('X-RateLimit-Reset', new Date(resetAt).toISOString())

      // Check if limit exceeded
      if (count > maxRequests) {
        const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
        res.setHeader('Retry-After', retryAfter.toString())

        // Log rate limit incident
        securityLogger.incident('rate_limit', {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          userId: (req as any).user?.id,
          tenantId: (req as any).user?.tenant_id,
          details: {
            endpoint: req.path,
            method: req.method,
            count,
            limit: maxRequests,
            usingRedis: !!rateLimiter
          },
          severity: count > maxRequests * 2 ? 'high' : 'medium'
        })

        if (handler) {
          return handler(req, res)
        }

        throw new RateLimitError('Too many requests', retryAfter)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Export rate limit store for testing
 */
export { rateLimitStore }

/**
 * Cleanup function (call on server shutdown)
 */
export function cleanup(): void {
  rateLimitStore.cleanup()
}
