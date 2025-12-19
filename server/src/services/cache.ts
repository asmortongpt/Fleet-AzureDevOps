import { createClient, RedisClientType } from 'redis';

import { logger } from './logger';

/**
 * Cache TTL Configuration (in seconds)
 *
 * Configured per entity type for optimal performance
 */
export const CacheTTL = {
  // High-frequency, low-change data
  VEHICLE_LIST: 5 * 60, // 5 minutes
  DRIVER_LIST: 10 * 60, // 10 minutes
  STATIC_DATA: 24 * 60 * 60, // 24 hours (makes, models, etc.)

  // Detail views (frequently accessed)
  VEHICLE_DETAIL: 1 * 60, // 1 minute
  DRIVER_DETAIL: 2 * 60, // 2 minutes
  FACILITY_DETAIL: 5 * 60, // 5 minutes

  // Reports and analytics (expensive queries)
  REPORTS: 1 * 60 * 60, // 1 hour
  DASHBOARDS: 5 * 60, // 5 minutes
  ANALYTICS: 15 * 60, // 15 minutes

  // Session and auth data
  SESSION: 15 * 60, // 15 minutes
  JWT_BLACKLIST: 24 * 60 * 60, // 24 hours

  // Real-time data (short TTL)
  TELEMETRY: 30, // 30 seconds
  GPS_LOCATION: 10, // 10 seconds
} as const;

/**
 * Cache Service
 *
 * Provides Redis-based caching with automatic invalidation, monitoring, and fallback
 */
export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private hitCount = 0;
  private missCount = 0;
  private errorCount = 0;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize Redis client
   */
  private async initializeClient(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000); // Exponential backoff
          },
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
        this.isConnected = false;
        this.errorCount++;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis client connected and ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.warn('Redis client connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis client', { error: error instanceof Error ? error.message : error });
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      this.missCount++;
      return null; // Graceful degradation
    }

    try {
      const cached = await this.client.get(key);

      if (cached) {
        this.hitCount++;
        logger.debug('Cache hit', { key });
        return JSON.parse(cached) as T;
      } else {
        this.missCount++;
        logger.debug('Cache miss', { key });
        return null;
      }
    } catch (error) {
      logger.error('Cache get error', { key, error: error instanceof Error ? error.message : error });
      this.errorCount++;
      this.missCount++;
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return; // Graceful degradation
    }

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      logger.debug('Cache set', { key, ttl });
    } catch (error) {
      logger.error('Cache set error', { key, error: error instanceof Error ? error.message : error });
      this.errorCount++;
    }
  }

  /**
   * Delete single key
   */
  async delete(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
      logger.debug('Cache delete', { key });
    } catch (error) {
      logger.error('Cache delete error', { key, error: error instanceof Error ? error.message : error });
      this.errorCount++;
    }
  }

  /**
   * Invalidate keys matching pattern (e.g., "vehicle:*")
   */
  async invalidate(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info('Cache invalidation', { pattern, keysDeleted: keys.length });
      }
    } catch (error) {
      logger.error('Cache invalidation error', { pattern, error: error instanceof Error ? error.message : error });
      this.errorCount++;
    }
  }

  /**
   * Warm cache with initial data
   */
  async warm(keys: Array<{ key: string; value: any; ttl: number }>): Promise<void> {
    logger.info('Warming cache...', { keyCount: keys.length });

    for (const { key, value, ttl } of keys) {
      await this.set(key, value, ttl);
    }

    logger.info('Cache warming complete');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hits: number;
    misses: number;
    errors: number;
    hitRate: number;
    isConnected: boolean;
  } {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;

    return {
      hits: this.hitCount,
      misses: this.missCount,
      errors: this.errorCount,
      hitRate: parseFloat(hitRate.toFixed(2)),
      isConnected: this.isConnected,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
    this.errorCount = 0;
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flush(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.flushAll();
      logger.warn('Cache flushed - all keys deleted');
    } catch (error) {
      logger.error('Cache flush error', { error: error instanceof Error ? error.message : error });
      this.errorCount++;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis client closed');
    }
  }

  /**
   * Check if cache is healthy
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Singleton cache instance
 */
export const cache = new CacheService();

/**
 * Cache key builders for consistent naming
 */
export const CacheKeys = {
  vehicle: (id: string | number) => `vehicle:${id}`,
  vehicleList: (tenantId: string) => `vehicles:list:${tenantId}`,
  driver: (id: string | number) => `driver:${id}`,
  driverList: (tenantId: string) => `drivers:list:${tenantId}`,
  facility: (id: string | number) => `facility:${id}`,
  report: (type: string, tenantId: string) => `report:${type}:${tenantId}`,
  dashboard: (tenantId: string) => `dashboard:${tenantId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  jwtBlacklist: (tokenId: string) => `jwt:blacklist:${tokenId}`,
  telemetry: (vehicleId: string | number) => `telemetry:${vehicleId}`,
} as const;

/**
 * Cache middleware for Express routes
 *
 * Usage:
 * app.get('/vehicles', cacheMiddleware(CacheKeys.vehicleList, CacheTTL.VEHICLE_LIST), handler)
 */
export function cacheMiddleware(
  keyFn: (req: any) => string,
  ttl: number
) {
  return async (req: any, res: any, next: any) => {
    const cacheKey = keyFn(req);

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Cache miss - store response
    res.setHeader('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      cache.set(cacheKey, body, ttl); // Fire and forget
      return originalJson(body);
    };

    next();
  };
}
