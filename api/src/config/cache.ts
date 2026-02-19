import redisClient from './redis';

/**
 * Redis Caching Configuration
 * Uses shared Redis client from config/redis.ts (singleton pattern)
 */

const redis = redisClient;

export class CacheService {
  private ttl = 3600; // 1 hour default

  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: unknown, ttl: number = this.ttl): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await redis.del(key);
  }

  async flush(): Promise<void> {
    await redis.flushdb();
  }

  async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1;
  }
}

export const cacheService = new CacheService();
export default redis;

