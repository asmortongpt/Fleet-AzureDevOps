// Redis Distributed Caching Service
// Production-grade caching with fallback and health checks

import { LRUCache } from 'lru-cache';
import { createClient, RedisClientType } from 'redis';

interface CacheConfig {
  redis: {
    url: string;
    maxRetries: number;
    retryDelay: number;
    commandTimeout: number;
  };
  lru: {
    max: number;
    ttl: number;
    updateAgeOnGet: boolean;
  };
  defaultTTL: number;
}

export class RedisService {
  private redisClient: RedisClientType | null = null;
  private lruCache: LRUCache<string, any>;
  private isRedisConnected: boolean = false;
  private reconnectAttempts: number = 0;

  private config: CacheConfig = {
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      maxRetries: 10,
      retryDelay: 2000,
      commandTimeout: 5000,
    },
    lru: {
      max: 1000, // 1000 items in memory
      ttl: 1000 * 60 * 5, // 5 minutes
      updateAgeOnGet: true,
    },
    defaultTTL: 3600, // 1 hour in seconds
  };

  constructor() {
    this.lruCache = new LRUCache(this.config.lru);
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        url: this.config.redis.url,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.config.redis.maxRetries) {
              console.error('Redis max retries exceeded, falling back to LRU');
              return new Error('Max retries exceeded');
            }
            return this.config.redis.retryDelay;
          },
        },
      });

      this.redisClient.on('connect', () => {
        console.log('✅ Redis connected');
        this.isRedisConnected = true;
        this.reconnectAttempts = 0;
      });

      this.redisClient.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
        this.isRedisConnected = false;
      });

      this.redisClient.on('reconnecting', () => {
        this.reconnectAttempts++;
        console.log(`🔄 Redis reconnecting (attempt ${this.reconnectAttempts})...`);
      });

      await this.redisClient.connect();
    } catch (error) {
      console.error('Failed to initialize Redis, using LRU only:', error);
      this.isRedisConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try LRU first (fastest)
    const lruValue = this.lruCache.get(key);
    if (lruValue !== undefined) {
      return lruValue as T;
    }

    // Try Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          const parsed = JSON.parse(typeof redisValue === 'string' ? redisValue : redisValue.toString()) as T;
          // Populate LRU for next time
          this.lruCache.set(key, parsed);
          return parsed;
        }
      } catch (error) {
        console.error(`Redis GET error for key ${key}:`, error);
      }
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl: number = this.config.defaultTTL): Promise<boolean> {
    // Always set in LRU
    this.lruCache.set(key, value);

    // Try Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(`Redis SET error for key ${key}:`, error);
        return false;
      }
    }

    return true; // LRU succeeded
  }

  async delete(key: string): Promise<boolean> {
    // Delete from LRU
    this.lruCache.delete(key);

    // Try Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
        return true;
      } catch (error) {
        console.error(`Redis DELETE error for key ${key}:`, error);
        return false;
      }
    }

    return true;
  }

  async invalidatePattern(pattern: string): Promise<number> {
    let count = 0;

    // Invalidate in LRU
    for (const key of this.lruCache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.lruCache.delete(key);
        count++;
      }
    }

    // Try Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          count += keys.length;
        }
      } catch (error) {
        console.error(`Redis pattern invalidation error:`, error);
      }
    }

    return count;
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }

  async getStats() {
    return {
      lru: {
        size: this.lruCache.size,
        max: this.config.lru.max,
        hitRate: this.lruCache.size > 0 ? 'N/A' : '0%',
      },
      redis: {
        connected: this.isRedisConnected,
        reconnectAttempts: this.reconnectAttempts,
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isRedisConnected || !this.redisClient) {
      return false;
    }

    try {
      await this.redisClient.ping();
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    this.lruCache.clear();
  }
}

export const cacheService = new RedisService();
