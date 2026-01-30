/**
import logger from '@/utils/logger';
 * Advanced Rate Limiting System
 * Implements sophisticated rate limiting with blocking, sliding windows, and distributed support
 *
 * @module security/rate-limiter
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  blockDuration?: number; // Block duration in ms after exceeding limit
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (key: string) => string; // Custom key generator
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
  blockedUntil?: number;
}

export interface RateLimitViolation {
  key: string;
  timestamp: number;
  requestCount: number;
  windowMs: number;
  maxRequests: number;
}

/**
 * Rate Limiter with sliding window algorithm
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private blocked: Map<string, number> = new Map();
  private violations: RateLimitViolation[] = [];
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (key: string) => key,
      ...config,
      blockDuration: config.blockDuration || 0,
    };

    // Clean up old entries periodically
    this.startCleanupTimer();
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const computedKey = this.config.keyGenerator(key);
    const now = Date.now();

    // Check if blocked
    const blockedUntil = this.blocked.get(computedKey);
    if (blockedUntil && now < blockedUntil) {
      return false;
    }

    // Remove block if expired
    if (blockedUntil && now >= blockedUntil) {
      this.blocked.delete(computedKey);
    }

    // Get request timestamps for this key
    const timestamps = this.requests.get(computedKey) || [];

    // Remove old timestamps outside the window (sliding window)
    const validTimestamps = timestamps.filter(
      (ts) => now - ts < this.config.windowMs
    );

    // Check if limit exceeded
    if (validTimestamps.length >= this.config.maxRequests) {
      // Block if block duration is set
      if (this.config.blockDuration && this.config.blockDuration > 0) {
        this.blocked.set(computedKey, now + this.config.blockDuration);
      }

      // Record violation
      this.recordViolation(computedKey, validTimestamps.length);

      return false;
    }

    // Add current request
    validTimestamps.push(now);
    this.requests.set(computedKey, validTimestamps);

    return true;
  }

  /**
   * Get rate limit status for a key
   */
  getStatus(key: string): RateLimitStatus {
    const computedKey = this.config.keyGenerator(key);
    const now = Date.now();

    const blockedUntil = this.blocked.get(computedKey);
    const isBlocked = blockedUntil ? now < blockedUntil : false;

    const timestamps = this.requests.get(computedKey) || [];
    const validTimestamps = timestamps.filter(
      (ts) => now - ts < this.config.windowMs
    );

    const remaining = Math.max(0, this.config.maxRequests - validTimestamps.length);

    // Calculate reset time (when oldest request exits the window)
    const oldestTimestamp = validTimestamps[0] || now;
    const resetTime = oldestTimestamp + this.config.windowMs;

    return {
      allowed: !isBlocked && remaining > 0,
      remaining,
      resetTime,
      blocked: isBlocked,
      blockedUntil,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    const computedKey = this.config.keyGenerator(key);
    this.requests.delete(computedKey);
    this.blocked.delete(computedKey);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requests.clear();
    this.blocked.clear();
    this.violations = [];
  }

  /**
   * Get remaining requests for a key
   */
  getRemainingRequests(key: string): number {
    return this.getStatus(key).remaining;
  }

  /**
   * Get reset time for a key
   */
  getResetTime(key: string): number {
    return this.getStatus(key).resetTime;
  }

  /**
   * Check if key is blocked
   */
  isBlocked(key: string): boolean {
    const computedKey = this.config.keyGenerator(key);
    const blockedUntil = this.blocked.get(computedKey);
    return blockedUntil ? Date.now() < blockedUntil : false;
  }

  /**
   * Manually block a key
   */
  block(key: string, duration?: number): void {
    const computedKey = this.config.keyGenerator(key);
    const blockDuration = duration || this.config.blockDuration || 0;
    if (blockDuration > 0) {
      this.blocked.set(computedKey, Date.now() + blockDuration);
    }
  }

  /**
   * Unblock a key
   */
  unblock(key: string): void {
    const computedKey = this.config.keyGenerator(key);
    this.blocked.delete(computedKey);
  }

  /**
   * Record rate limit violation
   */
  private recordViolation(key: string, requestCount: number): void {
    const violation: RateLimitViolation = {
      key,
      timestamp: Date.now(),
      requestCount,
      windowMs: this.config.windowMs,
      maxRequests: this.config.maxRequests,
    };

    this.violations.push(violation);

    // Keep only last 1000 violations
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-1000);
    }

    // Log in development
    if (import.meta.env.DEV) {
      logger.warn('[Rate Limit] Violation detected:', violation);
    }

    // Send to monitoring in production
    if (import.meta.env.PROD) {
      this.reportViolation(violation);
    }
  }

  /**
   * Report violation to monitoring service
   */
  private async reportViolation(violation: RateLimitViolation): Promise<void> {
    try {
      await fetch('/api/v1/security/rate-limit-violations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(violation),
      });
    } catch (error) {
      logger.error('Failed to report rate limit violation:', error);
    }
  }

  /**
   * Get all violations
   */
  getViolations(): RateLimitViolation[] {
    return [...this.violations];
  }

  /**
   * Get violations for a specific key
   */
  getViolationsForKey(key: string): RateLimitViolation[] {
    const computedKey = this.config.keyGenerator(key);
    return this.violations.filter((v) => v.key === computedKey);
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();

    // Clean up expired requests
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(
        (ts) => now - ts < this.config.windowMs
      );

      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }

    // Clean up expired blocks
    for (const [key, blockedUntil] of this.blocked.entries()) {
      if (now >= blockedUntil) {
        this.blocked.delete(key);
      }
    }

    // Clean up old violations (keep only last 24 hours)
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    this.violations = this.violations.filter((v) => v.timestamp > oneDayAgo);
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    // Run cleanup every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalKeys: number;
    blockedKeys: number;
    totalViolations: number;
    recentViolations: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    return {
      totalKeys: this.requests.size,
      blockedKeys: this.blocked.size,
      totalViolations: this.violations.length,
      recentViolations: this.violations.filter((v) => v.timestamp > oneHourAgo).length,
    };
  }
}

/**
 * Pre-configured rate limiters
 */

// API rate limiter - 100 requests per minute
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  blockDuration: 5 * 60 * 1000, // 5 minutes
});

// Auth rate limiter - 5 login attempts per 15 minutes
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  blockDuration: 30 * 60 * 1000, // 30 minutes
});

// Search rate limiter - 30 searches per minute
export const searchRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  blockDuration: 2 * 60 * 1000, // 2 minutes
});

// Upload rate limiter - 10 uploads per hour
export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  blockDuration: 60 * 60 * 1000, // 1 hour
});

// Websocket rate limiter - 200 messages per minute
export const websocketRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200,
  blockDuration: 1 * 60 * 1000, // 1 minute
});

/**
 * Rate limit decorator for functions
 */
export function rateLimit(
  limiter: RateLimiter,
  keyFn?: (...args: any[]) => string
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyFn ? keyFn(...args) : 'default';

      if (!limiter.isAllowed(key)) {
        const status = limiter.getStatus(key);
        throw new Error(
          `Rate limit exceeded. Try again after ${new Date(
            status.resetTime
          ).toISOString()}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Rate limit hook for React components
 */
export function useRateLimit(
  limiter: RateLimiter,
  key: string
): RateLimitStatus {
  return limiter.getStatus(key);
}

/**
 * Distributed rate limiter using Redis (for backend)
 * This is a placeholder - implement with actual Redis client
 */
export class DistributedRateLimiter {
  private config: Required<RateLimitConfig>;
  private redisClient: any; // Replace with actual Redis client type

  constructor(config: RateLimitConfig, redisClient: any) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (key: string) => key,
      ...config,
      blockDuration: config.blockDuration || 0,
    };
    this.redisClient = redisClient;
  }

  async isAllowed(key: string): Promise<boolean> {
    const computedKey = this.config.keyGenerator(key);

    // Check if blocked
    const blockedUntil = await this.redisClient?.get(`blocked:${computedKey}`);
    if (blockedUntil && Date.now() < parseInt(blockedUntil)) {
      return false;
    }

    // Increment counter
    const count = await this.redisClient?.incr(`ratelimit:${computedKey}`);

    // Set expiry on first request
    if (count === 1) {
      await this.redisClient?.pexpire(
        `ratelimit:${computedKey}`,
        this.config.windowMs
      );
    }

    // Check if limit exceeded
    if (count > this.config.maxRequests) {
      // Block if configured
      if (this.config.blockDuration && this.config.blockDuration > 0) {
        await this.redisClient?.set(
          `blocked:${computedKey}`,
          Date.now() + this.config.blockDuration,
          'PX',
          this.config.blockDuration
        );
      }
      return false;
    }

    return true;
  }

  async getStatus(key: string): Promise<RateLimitStatus> {
    const computedKey = this.config.keyGenerator(key);

    const count = (await this.redisClient?.get(`ratelimit:${computedKey}`)) || 0;
    const blockedUntil = await this.redisClient?.get(`blocked:${computedKey}`);
    const ttl = (await this.redisClient?.pttl(`ratelimit:${computedKey}`)) || 0;

    const remaining = Math.max(0, this.config.maxRequests - count);
    const resetTime = ttl > 0 ? Date.now() + ttl : Date.now();
    const isBlocked = blockedUntil ? Date.now() < parseInt(blockedUntil) : false;

    return {
      allowed: !isBlocked && remaining > 0,
      remaining,
      resetTime,
      blocked: isBlocked,
      blockedUntil: blockedUntil ? parseInt(blockedUntil) : undefined,
    };
  }

  async reset(key: string): Promise<void> {
    const computedKey = this.config.keyGenerator(key);
    await this.redisClient?.del(`ratelimit:${computedKey}`);
    await this.redisClient?.del(`blocked:${computedKey}`);
  }
}
