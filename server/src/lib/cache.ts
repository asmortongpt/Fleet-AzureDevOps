import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

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
  const key = generateCacheKey(options);
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const data = await fetcher();
    await redis.setex(key, options.ttl, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Redis error:', error);
    return fetcher(); // Graceful degradation
  }
}

export async function invalidateCache(options: CacheOptions): Promise<void> {
  const key = generateCacheKey(options);
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis error during cache invalidation:', error);
  }
}

export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Redis error during pattern-based cache invalidation:', error);
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