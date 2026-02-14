// Express Middleware for API Response Caching

import crypto from 'crypto';

import { Request, Response, NextFunction } from 'express';

import { cacheService } from './RedisService';

import logger from '@/utils/logger';

interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  varyBy?: string[];
  skipCache?: (req: Request) => boolean;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 60,
    keyPrefix = 'api',
    varyBy = ['url', 'tenantId'],
    skipCache = () => false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if custom function returns true
    if (skipCache(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = generateCacheKey(req, keyPrefix, varyBy);

    try {
      // Try to get from cache
      const cached = await cacheService.get<{
        status: number;
        headers: Record<string, string>;
        body: any;
      }>(cacheKey);

      if (cached) {
        // Cache hit
        res.set(cached.headers);
        res.set('X-Cache', 'HIT');
        return res.status(cached.status).json(cached.body);
      }

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);

      res.json = function (body: any) {
        // Store in cache
        cacheService.set(
          cacheKey,
          {
            status: res.statusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            body,
          },
          ttl
        ).catch(err => logger.error('Cache set error:', err));

        // Set cache header
        res.set('X-Cache', 'MISS');

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

function generateCacheKey(
  req: Request,
  prefix: string,
  varyBy: string[]
): string {
  const parts = [prefix];

  for (const field of varyBy) {
    switch (field) {
      case 'url':
        parts.push(req.originalUrl || req.url);
        break;
      case 'tenantId':
        parts.push(req.headers['x-tenant-id'] as string || 'default');
        break;
      case 'userId':
        parts.push((req as any).user?.id || 'anonymous');
        break;
      default:
        parts.push(req.headers[field] as string || '');
    }
  }

  const key = parts.join(':');

  // Hash if key is too long
  if (key.length > 200) {
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return `${prefix}:${hash}`;
  }

  return key;
}

// Cache invalidation middleware for mutations
export function invalidateCacheMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send method
    const originalSend = res.send.bind(res);

    res.send = function (body: any) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          cacheService.invalidatePattern(pattern).catch(err => {
            logger.error('Cache invalidation error:', err);
          });
        });
      }

      return originalSend(body);
    };

    next();
  };
}
