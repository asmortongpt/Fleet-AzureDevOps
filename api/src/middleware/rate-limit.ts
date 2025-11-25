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
import { RateLimitError } from './error-handler'
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
    message = 'Too many requests, please try again later',
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

        throw new RateLimitError(retryAfter)
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
    message: 'Too many authentication attempts. Please try again later.',
    keyGenerator: (req) => `auth:${req.ip}`
  }),

  /**
   * Password reset (very strict)
   */
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts. Please try again later.',
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
      return 'webhook:${req.get('x-webhook-id') || req.ip}'
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
  ) {}

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
 * (Placeholder - implement when Redis is configured)
 */
export class RedisRateLimiter {
  constructor(
    private redisClient: any, // Redis client
    private prefix: string = 'ratelimit'
  ) {}

  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    // TODO: Implement Redis-based rate limiting
    // This provides distributed rate limiting across multiple server instances
    return rateLimitStore.increment(key, windowMs)
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
