/**
 * Rate Limiting Middleware - Redis-backed sliding window
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

export class RateLimitMiddleware {
  constructor(private redis: Redis) {}

  limit = (options: { windowMs: number; max: number; keyPrefix?: string }) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const key = `${options.keyPrefix || 'ratelimit'}:${req.ip || 'unknown'}`;
      const now = Date.now();
      const windowStart = now - options.windowMs;

      try {
        // Remove old entries
        await this.redis.zremrangebyscore(key, 0, windowStart);

        // Count current requests
        const count = await this.redis.zcard(key);

        if (count >= options.max) {
          res.status(429).json({
            success: false,
            error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
          });
          return;
        }

        // Add current request
        await this.redis.zadd(key, now, `${now}-${Math.random()}`);
        await this.redis.expire(key, Math.ceil(options.windowMs / 1000));

        res.setHeader('X-RateLimit-Limit', options.max.toString());
        res.setHeader('X-RateLimit-Remaining', (options.max - count - 1).toString());

        next();
      } catch (error) {
        // Fail open on Redis errors
        next();
      }
    };
  };

  global = this.limit({ windowMs: 60000, max: 100 }); // 100 req/min
}

export function createRateLimitMiddleware(redis: Redis): RateLimitMiddleware {
  return new RateLimitMiddleware(redis);
}
