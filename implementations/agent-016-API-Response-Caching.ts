```typescript
// src/services/cacheService.ts
import { Logger } from '../utils/logger';
import { RedisClient } from '../config/redisConfig';

export class CacheService {
  private readonly cacheTTL: number = 3600; // Cache TTL in seconds (1 hour)
  private readonly logger: Logger;

  constructor(private readonly redisClient: RedisClient) {
    this.logger = new Logger('CacheService');
  }

  /**
   * Get cached data by key
   * @param key Cache key
   * @returns Cached data or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await this.redisClient.get(key);
      if (cachedData) {
        this.logger.info(`Cache hit for key: ${key}`);
        return JSON.parse(cachedData) as T;
      }
      this.logger.info(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set<T>(key: string, data: T, ttl: number = this.cacheTTL): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      await this.redisClient.setEx(key, ttl, serializedData);
      this.logger.info(`Cache set for key: ${key} with TTL: ${ttl}`);
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}:`, error);
    }
  }

  /**
   * Delete cached data by key
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.logger.info(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAll(): Promise<void> {
    try {
      await this.redisClient.flushAll();
      this.logger.info('All cache cleared');
    } catch (error) {
      this.logger.error('Error clearing all cache:', error);
    }
  }
}

// src/config/redisConfig.ts
import redis, { RedisClientType } from 'redis';
import { config } from '../config/env';

export class RedisClient {
  private client: RedisClientType | null = null;
  private readonly logger = new Logger('RedisClient');

  async connect(): Promise<void> {
    try {
      this.client = redis.createClient({
        url: config.redisUrl,
        password: config.redisPassword,
      });

      await this.client.connect();
      this.logger.info('Redis client connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw new Error('Redis connection failed');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis client not initialized');
    return await this.client.get(key);
  }

  async setEx(key: string, ttl: number, value: string): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');
    await this.client.setEx(key, ttl, value);
  }

  async del(key: string): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');
    await this.client.del(key);
  }

  async flushAll(): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');
    await this.client.flushAll();
  }
}

// src/utils/logger.ts
export class Logger {
  constructor(private readonly context: string) {}

  info(message: string): void {
    console.log(`[INFO] [${this.context}] ${message}`);
  }

  error(message: string, error?: unknown): void {
    console.error(`[ERROR] [${this.context}] ${message}`, error);
  }

  warn(message: string): void {
    console.warn(`[WARN] [${this.context}] ${message}`);
  }
}

// src/config/env.ts
export const config = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisPassword: process.env.REDIS_PASSWORD || '',
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.example.com',
};

// src/services/apiService.ts
import { CacheService } from './cacheService';
import axios, { AxiosResponse } from 'axios';
import { config } from '../config/env';
import { Logger } from '../utils/logger';

export class ApiService {
  private readonly logger: Logger;
  private readonly cachePrefix = 'api:response:';

  constructor(private readonly cacheService: CacheService) {
    this.logger = new Logger('ApiService');
  }

  /**
   * Fetch data from API with caching
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns API response data
   */
  async fetchWithCache<T>(
    endpoint: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(endpoint, params);
    const cachedData = await this.cacheService.get<T>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await this.makeRequest<T>(endpoint, params);
      await this.cacheService.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      this.logger.error(`API request failed for ${endpoint}:`, error);
      throw new Error(`Failed to fetch data from ${endpoint}`);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<AxiosResponse<T>> {
    const url = `${config.apiBaseUrl}${endpoint}`;
    return await axios.get<T>(url, {
      params,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.API_KEY || '',
      },
      timeout: 5000,
    });
  }

  private generateCacheKey(
    endpoint: string,
    params: Record<string, unknown>
  ): string {
    const paramsString = JSON.stringify(params);
    return `${this.cachePrefix}${endpoint}:${paramsString}`;
  }
}

// src/index.ts
import { RedisClient } from './config/redisConfig';
import { CacheService } from './services/cacheService';
import { ApiService } from './services/apiService';

async function main() {
  const redisClient = new RedisClient();
  await redisClient.connect();

  const cacheService = new CacheService(redisClient);
  const apiService = new ApiService(cacheService);

  try {
    const data = await apiService.fetchWithCache('/users', { page: 1 });
    console.log('Fetched data:', data);
  } catch (error) {
    console.error('Application error:', error);
  }
}

main().catch((error) => console.error('Failed to start application:', error));

// tests/cacheService.test.ts
import { RedisClient } from '../src/config/redisConfig';
import { CacheService } from '../src/services/cacheService';

jest.mock('../src/config/redisConfig');

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedisClient: jest.Mocked<RedisClient>;

  beforeEach(() => {
    mockRedisClient = new RedisClient() as jest.Mocked<RedisClient>;
    cacheService = new CacheService(mockRedisClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return cached data on hit', async () => {
    const testData = { id: 1, name: 'Test' };
    mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

    const result = await cacheService.get<{ id: number; name: string }>('test:key');
    expect(result).toEqual(testData);
    expect(mockRedisClient.get).toHaveBeenCalledWith('test:key');
  });

  test('should return null on cache miss', async () => {
    mockRedisClient.get.mockResolvedValue(null);

    const result = await cacheService.get('test:key');
    expect(result).toBeNull();
    expect(mockRedisClient.get).toHaveBeenCalledWith('test:key');
  });

  test('should handle error when getting cache', async () => {
    mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

    const result = await cacheService.get('test:key');
    expect(result).toBeNull();
    expect(mockRedisClient.get).toHaveBeenCalledWith('test:key');
  });

  test('should set data in cache', async () => {
    const testData = { id: 1, name: 'Test' };
    mockRedisClient.setEx.mockResolvedValue();

    await cacheService.set('test:key', testData, 3600);
    expect(mockRedisClient.setEx).toHaveBeenCalledWith(
      'test:key',
      3600,
      JSON.stringify(testData)
    );
  });

  test('should handle error when setting cache', async () => {
    mockRedisClient.setEx.mockRejectedValue(new Error('Redis error'));
    const testData = { id: 1, name: 'Test' };

    await expect(cacheService.set('test:key', testData)).resolves.toBeUndefined();
    expect(mockRedisClient.setEx).toHaveBeenCalled();
  });
});

// tests/apiService.test.ts
import { CacheService } from '../src/services/cacheService';
import { ApiService } from '../src/services/apiService';
import axios from 'axios';

jest.mock('axios');
jest.mock('../src/services/cacheService');

describe('ApiService', () => {
  let apiService: ApiService;
  let mockCacheService: jest.Mocked<CacheService>;
  const mockAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    mockCacheService = new CacheService({} as any) as jest.Mocked<CacheService>;
    apiService = new ApiService(mockCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return cached data if available', async () => {
    const cachedData = { id: 1, name: 'Test' };
    mockCacheService.get.mockResolvedValue(cachedData);

    const result = await apiService.fetchWithCache('/test', { page: 1 });
    expect(result).toEqual(cachedData);
    expect(mockCacheService.get).toHaveBeenCalled();
    expect(mockAxios.get).not.toHaveBeenCalled();
  });

  test('should fetch from API and cache on cache miss', async () => {
    const apiData = { id: 1, name: 'Test' };
    mockCacheService.get.mockResolvedValue(null);
    mockAxios.get.mockResolvedValue({ data: apiData });

    const result = await apiService.fetchWithCache('/test', { page: 1 });
    expect(result).toEqual(apiData);
    expect(mockCacheService.get).toHaveBeenCalled();
    expect(mockAxios.get).toHaveBeenCalled();
    expect(mockCacheService.set).toHaveBeenCalledWith(
      expect.any(String),
      apiData
    );
  });

  test('should throw error on API failure', async () => {
    mockCacheService.get.mockResolvedValue(null);
    mockAxios.get.mockRejectedValue(new Error('API error'));

    await expect(apiService.fetchWithCache('/test')).rejects.toThrow(
      'Failed to fetch data from /test'
    );
    expect(mockCacheService.get).toHaveBeenCalled();
    expect(mockAxios.get).toHaveBeenCalled();
  });
});
```
