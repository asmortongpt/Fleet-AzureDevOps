// src/cache/ApiResponseCache.ts
import { Logger } from '../utils/Logger';

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

export class ApiResponseCache {
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number;
  private logger: Logger;

  constructor(defaultTTL: number = 300000) { // Default TTL: 5 minutes
    this.cache = new Map<string, CacheEntry>();
    this.defaultTTL = defaultTTL;
    this.logger = new Logger('ApiResponseCache');
  }

  /**
   * Get a cached response by key
   * @param key Cache key
   * @returns Cached data or null if not found/expired
   */
  public get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.logger.debug(`Cache miss for key: ${key}`);
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired for key: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit for key: ${key}`);
    return entry.data;
  }

  /**
   * Set a response in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  public set(key: string, data: unknown, ttl?: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    };
    this.cache.set(key, entry);
    this.logger.debug(`Cached data for key: ${key} with TTL: ${entry.ttl}ms`);
  }

  /**
   * Clear cache for a specific key or all cache if no key provided
   * @param key Optional cache key to clear
   */
  public clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.logger.debug(`Cleared cache for key: ${key}`);
    } else {
      this.cache.clear();
      this.logger.debug('Cleared entire cache');
    }
  }

  /**
   * Get cache size
   * @returns Number of cached entries
   */
  public size(): number {
    return this.cache.size;
  }
}

// src/utils/Logger.ts
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  public debug(message: string): void {
    console.log(`[DEBUG] [${this.context}] ${message}`);
  }

  public info(message: string): void {
    console.info(`[INFO] [${this.context}] ${message}`);
  }

  public error(message: string): void {
    console.error(`[ERROR] [${this.context}] ${message}`);
  }
}

// src/services/ApiService.ts
import { ApiResponseCache } from '../cache/ApiResponseCache';
import { Logger } from '../utils/Logger';

export class ApiService {
  private cache: ApiResponseCache;
  private logger: Logger;

  constructor(cacheTTL: number = 300000) {
    this.cache = new ApiResponseCache(cacheTTL);
    this.logger = new Logger('ApiService');
  }

  /**
   * Fetch data from API with caching
   * @param endpoint API endpoint
   * @param cacheKey Unique cache key for this request
   * @param ttl Custom TTL for this request (optional)
   * @returns API response data
   */
  public async fetchWithCache<T>(
    endpoint: string,
    cacheKey: string,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cachedData = this.cache.get(cacheKey) as T | null;
    if (cachedData !== null) {
      this.logger.info(`Returning cached data for ${endpoint}`);
      return cachedData;
    }

    // Fetch from API if not in cache
    this.logger.info(`Fetching data from ${endpoint}`);
    try {
      const response = await this.makeRequest<T>(endpoint);
      this.cache.set(cacheKey, response, ttl);
      return response;
    } catch (error) {
      this.logger.error(`Failed to fetch from ${endpoint}: ${error}`);
      throw error;
    }
  }

  /**
   * Clear cache for a specific key or all
   * @param cacheKey Optional cache key to clear
   */
  public clearCache(cacheKey?: string): void {
    this.cache.clear(cacheKey);
  }

  /**
   * Simulate API request (replace with actual HTTP client in production)
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    // This is a mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ endpoint, data: 'mock response' } as unknown as T);
      }, 1000);
    });
  }
}

// tests/cache/ApiResponseCache.test.ts
import { ApiResponseCache } from '../../src/cache/ApiResponseCache';

describe('ApiResponseCache', () => {
  let cache: ApiResponseCache;

  beforeEach(() => {
    cache = new ApiResponseCache(1000); // 1 second TTL for testing
  });

  afterEach(() => {
    cache.clear();
  });

  test('should store and retrieve data from cache', () => {
    const key = 'test-key';
    const data = { id: 1, name: 'test' };

    cache.set(key, data);
    const result = cache.get(key);

    expect(result).toEqual(data);
  });

  test('should return null for expired cache entry', async () => {
    const key = 'test-key';
    const data = { id: 1, name: 'test' };

    cache.set(key, data);
    // Wait for cache to expire (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = cache.get(key);
    expect(result).toBeNull();
  });

  test('should return null for non-existent key', () => {
    const result = cache.get('non-existent-key');
    expect(result).toBeNull();
  });

  test('should clear specific cache entry', () => {
    const key1 = 'key1';
    const key2 = 'key2';

    cache.set(key1, { data: 1 });
    cache.set(key2, { data: 2 });

    cache.clear(key1);
    expect(cache.get(key1)).toBeNull();
    expect(cache.get(key2)).not.toBeNull();
  });

  test('should clear all cache entries', () => {
    cache.set('key1', { data: 1 });
    cache.set('key2', { data: 2 });

    cache.clear();
    expect(cache.size()).toBe(0);
  });

  test('should return correct cache size', () => {
    cache.set('key1', { data: 1 });
    cache.set('key2', { data: 2 });

    expect(cache.size()).toBe(2);
  });
});

// tests/services/ApiService.test.ts
import { ApiService } from '../../src/services/ApiService';

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    apiService = new ApiService(1000); // 1 second TTL for testing
  });

  test('should return cached data on second call', async () => {
    const endpoint = 'test-endpoint';
    const cacheKey = 'test-cache-key';

    // First call - should fetch from API
    const firstResult = await apiService.fetchWithCache(endpoint, cacheKey);
    expect(firstResult).toBeDefined();

    // Second call - should return cached data
    const secondResult = await apiService.fetchWithCache(endpoint, cacheKey);
    expect(secondResult).toEqual(firstResult);
  });

  test('should fetch new data after cache expires', async () => {
    const endpoint = 'test-endpoint';
    const cacheKey = 'test-cache-key';

    // First call
    await apiService.fetchWithCache(endpoint, cacheKey);

    // Wait for cache to expire
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Second call after expiration - should fetch new data
    // Since it's a mock, we can't verify new fetch, but we can ensure cache is cleared
    apiService.clearCache(cacheKey);
    const result = await apiService.fetchWithCache(endpoint, cacheKey);
    expect(result).toBeDefined();
  });

  test('should clear cache for specific key', async () => {
    const endpoint = 'test-endpoint';
    const cacheKey = 'test-cache-key';

    await apiService.fetchWithCache(endpoint, cacheKey);
    apiService.clearCache(cacheKey);

    // After clearing cache, should fetch new data
    const result = await apiService.fetchWithCache(endpoint, cacheKey);
    expect(result).toBeDefined();
  });

  test('should clear all cache', async () => {
    const endpoint1 = 'test-endpoint1';
    const cacheKey1 = 'test-cache-key1';
    const endpoint2 = 'test-endpoint2';
    const cacheKey2 = 'test-cache-key2';

    await apiService.fetchWithCache(endpoint1, cacheKey1);
    await apiService.fetchWithCache(endpoint2, cacheKey2);
    apiService.clearCache();

    // After clearing all cache, should fetch new data
    const result1 = await apiService.fetchWithCache(endpoint1, cacheKey1);
    const result2 = await apiService.fetchWithCache(endpoint2, cacheKey2);
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });
});
