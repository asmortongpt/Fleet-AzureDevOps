import { createClient, RedisClientType } from 'redis';

/**
 * Interface for Cache Service
 */
export interface ICacheService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
  getCacheKey(tenant: string, resource: string, id?: string): string;
  isConnected(): boolean;
}

export class CacheService implements ICacheService {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor(private redisUrl: string) {
    this.client = createClient({ url: this.redisUrl });
    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.connected = true;
      console.log('✅ Redis connected');
    } catch (error) {
      console.warn('⚠️ Cache connection failed – running without cache');
      this.connected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
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
      console.error(`Error deleting pattern ${pattern}:`, error);
    }
  }

  getCacheKey(tenant: string, resource: string, id?: string): string {
    return `${tenant}:${resource}${id ? `:${id}` : ''}`;
  }

  isConnected(): boolean {
    return this.connected;
  }
}