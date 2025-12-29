import Redis from 'ioredis';

import { logger } from '../services/logger';

let redis: Redis | null = null;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis max reconnection attempts reached');
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redis.on('error', (error) => {
    logger.error('Redis client error', { error: error.message });
  });

  // Attempt connection but don't fail if it doesn't work
  redis.connect().catch((error) => {
    logger.warn('Redis connection failed - continuing without cache', { error: error.message });
    redis = null;
  });
} catch (error) {
  logger.warn('Failed to initialize Redis client', { error: error instanceof Error ? error.message : error });
  redis = null;
}

type CacheOptions = {
  tenantId: string;
  entity: string;
  id: string;
  ttl: number;
};

function generateCacheKey({ tenantId, entity, id }: CacheOptions): string {
  return `${tenantId}:${entity}:${id}`;
}

export async function cached<T>(
  options: CacheOptions,
  fetcher: () => Promise<T>
): Promise<T> {
  // If Redis is not available, fetch directly
  if (!redis) {
    return fetcher();
  }

  const key = generateCacheKey(options);
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const data = await fetcher();
    await redis.setex(key, options.ttl, JSON.stringify(data));
    return data;
  } catch (error) {
    logger.error('Redis error during cache operation', { error: error instanceof Error ? error.message : error });
    return fetcher(); // Graceful degradation
  }
}

export async function invalidateCache(options: CacheOptions): Promise<void> {
  if (!redis) return; // No-op if Redis is not available

  const key = generateCacheKey(options);
  try {
    await redis.del(key);
  } catch (error) {
    logger.error('Redis error during cache invalidation', { error: error instanceof Error ? error.message : error });
  }
}

export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  if (!redis) return; // No-op if Redis is not available

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    logger.error('Redis error during pattern-based cache invalidation', { error: error instanceof Error ? error.message : error });
  }
}

// Example usage for vehicle listings
export async function getVehicleListings(tenantId: string, fetcher: () => Promise<any>): Promise<any> {
  return cached({ tenantId, entity: 'vehicleListings', id: 'all', ttl: 300 }, fetcher);
}

// Example usage for driver profiles
export async function getDriverProfile(tenantId: string, driverId: string, fetcher: () => Promise<any>): Promise<any> {
  return cached({ tenantId, entity: 'driverProfile', id: driverId, ttl: 600 }, fetcher);
}

// Example usage for dashboard stats
export async function getDashboardStats(tenantId: string, fetcher: () => Promise<any>): Promise<any> {
  return cached({ tenantId, entity: 'dashboardStats', id: 'all', ttl: 120 }, fetcher);
}

export const cache = cached; // Alias for compatibility
