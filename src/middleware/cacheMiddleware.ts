import { Request, Response, NextFunction } from 'express';

import { ICacheService } from '../utils/cache';

import logger from '@/utils/logger';

/**
 * Middleware to cache GET requests
 * @param cacheService - Instance of CacheService
 * @param ttl - Time to live for cache entries in seconds
 */
export const cacheMiddleware = (cacheService: ICacheService, ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const cacheKey = `route:${req.originalUrl}`;
    const cachedResponse = await cacheService.get<string>(cacheKey);

    if (cachedResponse) {
      logger.debug(`✅ Cache HIT: ${cacheKey}`);
      return res.send(JSON.parse(cachedResponse));
    } else {
      logger.debug(`❌ Cache MISS: ${cacheKey}`);
      const originalSend = res.send;
      res.send = (body: unknown) => {
        cacheService.set(cacheKey, JSON.stringify(body), ttl);
        return originalSend.call(res, body);
      };
      next();
    }
  };
};