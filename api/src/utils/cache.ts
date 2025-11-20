// Optional Redis client for caching
let createClient: any = null

// Lazy load optional Redis client
async function loadRedisClient() {
  if (createClient) return

  try {
    const redisModule = await import('redis')
    createClient = redisModule.createClient
  } catch (err) {
    console.warn('redis not available - caching will be disabled. Install redis package for caching support.')
  }
}

class CacheService {
  private client: any;
  private connected: boolean = false;

  async connect(): Promise<void> {
    if (this.connected) return;

    // Load Redis client if not already loaded
    await loadRedisClient()

    if (!createClient) {
      console.log('⚠️  Redis not available - caching disabled')
      this.connected = false
      return
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return retries * 100;
          }
        }
      });

      this.client.on('error', (err: any) => console.error('Redis Client Error', err));
      this.client.on('connect', () => console.log('✅ Redis connected'));

      await this.client.connect();
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Gracefully degrade - cache will be disabled
      this.connected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.connected) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  getCacheKey(tenant: string, resource: string, id?: string): string {
    return id ? `${tenant}:${resource}:${id}` : `${tenant}:${resource}`;
  }

  async disconnect(): Promise<void> {
    if (this.connected && this.client) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ connected: boolean; dbSize?: number }> {
    if (!this.connected) {
      return { connected: false };
    }

    try {
      const dbSize = await this.client.dbSize();
      return { connected: true, dbSize };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { connected: this.connected };
    }
  }
}

export const cache = new CacheService();

// Cache middleware for Express routes
export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: any, res: any, next: any) => {
    if (req.method !== 'GET') {
      return next();
    }

    // Build cache key from route and query params
    const cacheKey = `route:${req.originalUrl}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`❌ Cache MISS: ${cacheKey}`);

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (body: any) => {
      cache.set(cacheKey, body, ttl);
      return originalJson(body);
    };

    next();
  };
};
