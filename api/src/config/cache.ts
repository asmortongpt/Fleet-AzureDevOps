import Redis from 'ioredis';

/**
 * Redis Caching Configuration
 * Performance optimization for frequently accessed data
 */

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export class CacheService {
  private ttl = 3600; // 1 hour default

  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number = this.ttl): Promise<void> {
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

