# TO_BE_DESIGN.md - Parts Inventory Module
**Version:** 2.3.0
**Last Updated:** 2023-11-15
**Author:** Enterprise Architecture Team

---

## Executive Vision (120 lines)

### Strategic Transformation Goals

The enhanced Parts Inventory Module represents a paradigm shift in how our organization manages, tracks, and utilizes critical inventory assets. This transformation aligns with our digital-first strategy and addresses key business challenges:

1. **Inventory Optimization**: Reduce carrying costs by 35% through AI-driven demand forecasting and automated reordering
2. **Operational Efficiency**: Decrease stockout incidents by 90% with real-time visibility and predictive analytics
3. **Customer Experience**: Improve first-time fix rates by 40% through intelligent parts matching and technician empowerment
4. **Cost Reduction**: Lower procurement costs by 20% via dynamic supplier pricing comparisons
5. **Sustainability**: Reduce waste by 25% through better expiration tracking and FIFO enforcement

### Business Model Innovation

The new system enables several revenue-generating opportunities:
- **Parts-as-a-Service**: Subscription model for guaranteed parts availability
- **Predictive Maintenance**: Monetize usage data through equipment health insights
- **Marketplace Integration**: Commission-based parts resale platform
- **Warranty Optimization**: Reduce warranty claims through better parts tracking
- **Fleet Management**: Enhanced offerings for customers with large equipment fleets

### User Experience Revolution

The redesigned interface introduces:
- **Context-Aware Workflows**: Adaptive UI that changes based on user role, location, and current task
- **Augmented Reality**: Visual parts identification using mobile device cameras
- **Voice-Enabled Operations**: Hands-free inventory management for warehouse staff
- **Haptic Feedback**: Mobile alerts for critical stock levels
- **Personalized Dashboards**: Role-specific KPIs with drill-down capabilities

### Competitive Differentiation

Key advantages over competitors:
1. **Real-Time Global Visibility**: Single source of truth across all locations with sub-second latency
2. **AI-Powered Decision Making**: Machine learning models that improve with every transaction
3. **Seamless Integration**: Native connectors for all major ERP, CRM, and field service systems
4. **Offline-First Design**: Full functionality in disconnected environments with automatic sync
5. **Predictive Analytics**: Forecasting engine that anticipates needs before they arise

### Long-Term Roadmap

**Phase 1 (0-6 months):**
- Core inventory management with real-time tracking
- Basic AI recommendations
- Mobile app for field technicians
- Integration with existing ERP

**Phase 2 (6-12 months):**
- Advanced predictive analytics
- Automated reordering system
- Blockchain for parts provenance
- AR/VR training modules

**Phase 3 (12-18 months):**
- Autonomous inventory drones
- Cognitive search with natural language processing
- Dynamic pricing engine
- Full IoT integration with equipment sensors

**Phase 4 (18-24 months):**
- Self-healing supply chain
- Digital twin simulation
- AI-powered design for manufacturability
- Global parts marketplace

### Organizational Impact

**For Executives:**
- Real-time dashboard with strategic KPIs
- Predictive financial modeling
- Risk assessment tools
- Competitive benchmarking

**For Managers:**
- Team performance analytics
- Resource allocation optimization
- Compliance tracking
- Budget variance analysis

**For Technicians:**
- Guided repair workflows
- Parts compatibility verification
- Tool integration
- Knowledge base access

**For Warehouse Staff:**
- Voice-directed picking
- Automated labeling
- Error-proofing systems
- Ergonomic improvements

### Change Management Strategy

**Communication Plan:**
- Monthly town halls with live demos
- Executive sponsorship program
- User success stories
- Gamified learning paths

**Training Program:**
- Microlearning modules
- Virtual reality training environments
- Certification tracks
- Mentorship program

**Adoption Metrics:**
- Daily active users
- Feature utilization rates
- Time-to-competency
- Net Promoter Score

### Financial Justification

**Cost Savings:**
- $2.1M annual reduction in carrying costs
- $850K reduction in stockout-related downtime
- $420K savings from reduced obsolescence
- $310K from improved labor efficiency

**Revenue Growth:**
- $1.8M from new service offerings
- $950K from parts-as-a-service subscriptions
- $620K from marketplace commissions
- $480K from warranty optimization

**ROI Calculation:**
- 3.7x return in first 12 months
- 18-month payback period
- 22% IRR over 5 years
- $12.4M NPV at 12% discount rate

### Success Metrics

**Operational KPIs:**
- Inventory accuracy (target: 99.5%)
- Order fulfillment time (target: <2 hours)
- Stockout rate (target: <0.5%)
- Obsolete inventory (target: <1%)

**Financial KPIs:**
- Inventory turnover ratio (target: 8x)
- Carrying cost percentage (target: <15%)
- Procurement cost savings (target: 20%)
- Revenue per part (target: +12%)

**User KPIs:**
- System adoption rate (target: 98%)
- User satisfaction score (target: 4.5/5)
- Training completion rate (target: 100%)
- Help desk tickets (target: -70%)

### Environmental, Social, and Governance (ESG) Impact

**Environmental:**
- 30% reduction in paper usage
- 25% decrease in fuel consumption from optimized logistics
- 20% reduction in packaging waste
- Carbon footprint tracking for all shipments

**Social:**
- Improved workplace safety with AR-guided picking
- Reduced physical strain through automation
- Enhanced job satisfaction with gamification
- Community parts donation program

**Governance:**
- Full audit trail for all inventory transactions
- Automated compliance reporting
- Ethical sourcing tracking
- Conflict mineral monitoring

### Global Expansion Strategy

**Localization Features:**
- Multi-language support (12 languages)
- Local tax calculation
- Currency conversion
- Regional compliance rules
- Cultural adaptation of UI elements

**Market-Specific Adaptations:**
- Emerging markets: Offline-first design
- EU: GDPR compliance
- US: FDA tracking for medical parts
- Asia: QR code integration
- Middle East: Right-to-left language support

---

## Performance Enhancements (320 lines)

### Redis Caching Layer (60 lines)

```typescript
import { createClient, RedisClientType } from 'redis';
import { LRUCache } from 'lru-cache';
import { performance } from 'perf_hooks';
import { logger } from '../utils/logger';
import { CacheKeyGenerator } from '../utils/cacheKeyGenerator';

class RedisCacheService {
  private static instance: RedisCacheService;
  private redisClient: RedisClientType;
  private localCache: LRUCache<string, any>;
  private isConnected: boolean = false;
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly LOCAL_CACHE_SIZE = 1000;
  private readonly LOCAL_CACHE_TTL = 60; // 1 minute

  private constructor() {
    this.initializeRedis();
    this.initializeLocalCache();
  }

  public static getInstance(): RedisCacheService {
    if (!RedisCacheService.instance) {
      RedisCacheService.instance = new RedisCacheService();
    }
    return RedisCacheService.instance;
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          tls: process.env.REDIS_TLS === 'true',
          rejectUnauthorized: false
        }
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis connection error', { error: err });
        this.isConnected = false;
      });

      this.redisClient.on('connect', () => {
        logger.info('Connected to Redis');
        this.isConnected = true;
      });

      this.redisClient.on('reconnecting', () => {
        logger.warn('Attempting to reconnect to Redis');
        this.isConnected = false;
      });

      await this.redisClient.connect();
    } catch (err) {
      logger.error('Failed to initialize Redis', { error: err });
      this.isConnected = false;
    }
  }

  private initializeLocalCache(): void {
    this.localCache = new LRUCache({
      max: this.LOCAL_CACHE_SIZE,
      ttl: this.LOCAL_CACHE_TTL * 1000,
      fetchMethod: async (key, staleValue, { signal }) => {
        if (!this.isConnected) return staleValue;

        try {
          const value = await this.redisClient.get(key);
          return value ? JSON.parse(value) : null;
        } catch (err) {
          logger.error('Local cache fetch failed', { error: err, key });
          return staleValue;
        }
      }
    });
  }

  public async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();

    try {
      // First try local cache
      const localValue = this.localCache.get(key) as T | undefined;
      if (localValue !== undefined) {
        logger.debug('Cache hit (local)', { key, duration: performance.now() - startTime });
        return localValue;
      }

      // Fall back to Redis if local cache misses
      if (!this.isConnected) {
        logger.warn('Redis not connected, returning null', { key });
        return null;
      }

      const value = await this.redisClient.get(key);
      if (value) {
        const parsedValue = JSON.parse(value) as T;
        // Update local cache
        this.localCache.set(key, parsedValue);
        logger.debug('Cache hit (Redis)', { key, duration: performance.now() - startTime });
        return parsedValue;
      }

      logger.debug('Cache miss', { key, duration: performance.now() - startTime });
      return null;
    } catch (err) {
      logger.error('Cache get operation failed', { error: err, key });
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const startTime = performance.now();
    const effectiveTtl = ttl || this.DEFAULT_TTL;

    try {
      // Update local cache
      this.localCache.set(key, value, { ttl: this.LOCAL_CACHE_TTL * 1000 });

      if (!this.isConnected) {
        logger.warn('Redis not connected, only local cache updated', { key });
        return;
      }

      await this.redisClient.set(key, JSON.stringify(value), {
        EX: effectiveTtl
      });

      logger.debug('Cache set successful', {
        key,
        ttl: effectiveTtl,
        duration: performance.now() - startTime
      });
    } catch (err) {
      logger.error('Cache set operation failed', { error: err, key });
      throw err;
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      // Delete from local cache
      this.localCache.delete(key);

      if (!this.isConnected) {
        logger.warn('Redis not connected, only local cache deleted', { key });
        return;
      }

      await this.redisClient.del(key);
      logger.debug('Cache delete successful', { key });
    } catch (err) {
      logger.error('Cache delete operation failed', { error: err, key });
      throw err;
    }
  }

  public async getWithFallback<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cachedValue = await this.get<T>(key);
    if (cachedValue !== null) {
      return cachedValue;
    }

    const value = await fallbackFn();
    await this.set(key, value, ttl);
    return value;
  }

  public async clearCache(pattern: string = '*'): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, cannot clear cache');
        return;
      }

      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }

      // Clear local cache
      this.localCache.clear();

      logger.info('Cache cleared successfully', { pattern, count: keys.length });
    } catch (err) {
      logger.error('Cache clear operation failed', { error: err, pattern });
      throw err;
    }
  }

  public async getCacheStats(): Promise<{
    redis: { connected: boolean; memoryUsage?: number };
    local: { size: number; maxSize: number; hits: number; misses: number };
  }> {
    return {
      redis: {
        connected: this.isConnected,
        memoryUsage: this.isConnected
          ? await this.redisClient.memoryUsage(CacheKeyGenerator.getStatsKey())
          : undefined
      },
      local: {
        size: this.localCache.size,
        maxSize: this.LOCAL_CACHE_SIZE,
        hits: this.localCache.hits,
        misses: this.localCache.misses
      }
    };
  }
}

export const cacheService = RedisCacheService.getInstance();
```

### Database Query Optimization (70 lines)

```typescript
import { Pool, PoolClient, QueryResult } from 'pg';
import { performance } from 'perf_hooks';
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';
import { QueryBuilder } from '../utils/queryBuilder';

class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;
  private readonly MAX_QUERY_TIME_MS = 1000;
  private readonly CACHE_TTL = 300; // 5 minutes

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', { error: err });
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async getClient(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (err) {
      logger.error('Failed to get database client', { error: err });
      throw err;
    }
  }

  private async executeWithMetrics<T>(
    query: string,
    params: any[],
    client: PoolClient
  ): Promise<QueryResult<T>> {
    const startTime = performance.now();
    let result: QueryResult<T>;

    try {
      result = await client.query(query, params);
      const duration = performance.now() - startTime;

      if (duration > this.MAX_QUERY_TIME_MS) {
        logger.warn('Slow query detected', {
          query,
          params,
          duration,
          rowCount: result.rowCount
        });
      } else {
        logger.debug('Query executed successfully', {
          query,
          duration,
          rowCount: result.rowCount
        });
      }

      return result;
    } catch (err) {
      const duration = performance.now() - startTime;
      logger.error('Query execution failed', {
        query,
        params,
        error: err,
        duration
      });
      throw err;
    }
  }

  public async query<T>(
    query: string,
    params: any[] = [],
    useCache: boolean = true
  ): Promise<QueryResult<T>> {
    const cacheKey = QueryBuilder.generateCacheKey(query, params);

    if (useCache) {
      const cachedResult = await cacheService.get<QueryResult<T>>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const client = await this.getClient();
    try {
      const result = await this.executeWithMetrics<T>(query, params, client);

      if (useCache && result.rowCount > 0) {
        await cacheService.set(cacheKey, result, this.CACHE_TTL);
      }

      return result;
    } finally {
      client.release();
    }
  }

  public async queryWithTransaction<T>(
    queries: { query: string; params: any[] }[],
    useCache: boolean = false
  ): Promise<QueryResult<T>[]> {
    const client = await this.getClient();
    const results: QueryResult<T>[] = [];

    try {
      await client.query('BEGIN');

      for (const { query, params } of queries) {
        const result = await this.executeWithMetrics<T>(query, params, client);
        results.push(result);
      }

      await client.query('COMMIT');

      if (useCache) {
        for (let i = 0; i < queries.length; i++) {
          const cacheKey = QueryBuilder.generateCacheKey(queries[i].query, queries[i].params);
          await cacheService.set(cacheKey, results[i], this.CACHE_TTL);
        }
      }

      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed, rolled back', { error: err });
      throw err;
    } finally {
      client.release();
    }
  }

  public async getInventorySummary(
    locationId: string,
    categoryId?: string,
    status?: string[]
  ): Promise<{
    totalItems: number;
    totalValue: number;
    byCategory: Record<string, { count: number; value: number }>;
    lowStockItems: number;
    criticalStockItems: number;
  }> {
    const cacheKey = `inventory_summary:${locationId}:${categoryId || 'all'}:${status?.join(',') || 'all'}`;

    const cachedResult = await cacheService.get<any>(cacheKey);
    if (cachedResult) return cachedResult;

    const client = await this.getClient();
    try {
      let query = `
        SELECT
          COUNT(*) as total_items,
          COALESCE(SUM(p.price * i.quantity), 0) as total_value,
          COUNT(*) FILTER (WHERE i.quantity <= i.reorder_threshold) as low_stock_items,
          COUNT(*) FILTER (WHERE i.quantity <= i.critical_threshold) as critical_stock_items
        FROM inventory i
        JOIN parts p ON i.part_id = p.id
        WHERE i.location_id = $1
      `;

      const params: any[] = [locationId];

      if (categoryId) {
        query += ' AND p.category_id = $2';
        params.push(categoryId);
      }

      if (status && status.length > 0) {
        query += ` AND i.status = ANY($${params.length + 1})`;
        params.push(status);
      }

      const summaryResult = await this.executeWithMetrics(query, params, client);

      query = `
        SELECT
          p.category_id,
          c.name as category_name,
          COUNT(*) as count,
          COALESCE(SUM(p.price * i.quantity), 0) as value
        FROM inventory i
        JOIN parts p ON i.part_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE i.location_id = $1
      `;

      params.splice(1); // Reset params after first query

      if (categoryId) {
        query += ' AND p.category_id = $2';
        params.push(categoryId);
      }

      if (status && status.length > 0) {
        query += ` AND i.status = ANY($${params.length + 1})`;
        params.push(status);
      }

      query += ' GROUP BY p.category_id, c.name';

      const categoryResult = await this.executeWithMetrics(query, params, client);

      const byCategory: Record<string, { count: number; value: number }> = {};
      categoryResult.rows.forEach(row => {
        byCategory[row.category_id] = {
          count: parseInt(row.count),
          value: parseFloat(row.value)
        };
      });

      const result = {
        totalItems: parseInt(summaryResult.rows[0].total_items),
        totalValue: parseFloat(summaryResult.rows[0].total_value),
        byCategory,
        lowStockItems: parseInt(summaryResult.rows[0].low_stock_items),
        criticalStockItems: parseInt(summaryResult.rows[0].critical_stock_items)
      };

      await cacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } finally {
      client.release();
    }
  }

  public async getTopMovingParts(
    locationId: string,
    days: number = 30,
    limit: number = 10
  ): Promise<Array<{
    partId: string;
    partNumber: string;
    description: string;
    quantity: number;
    value: number;
    transactions: number;
  }>> {
    const cacheKey = `top_moving_parts:${locationId}:${days}:${limit}`;

    const cachedResult = await cacheService.get<any[]>(cacheKey);
    if (cachedResult) return cachedResult;

    const client = await this.getClient();
    try {
      const query = `
        SELECT
          p.id as part_id,
          p.part_number,
          p.description,
          SUM(t.quantity) as quantity,
          SUM(t.quantity * p.price) as value,
          COUNT(t.id) as transactions
        FROM transactions t
        JOIN parts p ON t.part_id = p.id
        WHERE t.location_id = $1
          AND t.created_at >= NOW() - INTERVAL '${days} days'
          AND t.type = 'ISSUE'
        GROUP BY p.id, p.part_number, p.description
        ORDER BY quantity DESC
        LIMIT $2
      `;

      const result = await this.executeWithMetrics(query, [locationId, limit], client);

      const formattedResult = result.rows.map(row => ({
        partId: row.part_id,
        partNumber: row.part_number,
        description: row.description,
        quantity: parseInt(row.quantity),
        value: parseFloat(row.value),
        transactions: parseInt(row.transactions)
      }));

      await cacheService.set(cacheKey, formattedResult, this.CACHE_TTL);
      return formattedResult;
    } finally {
      client.release();
    }
  }

  public async getDatabaseStats(): Promise<{
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
    maxConnections: number;
    queriesPerSecond: number;
  }> {
    const client = await this.getClient();
    try {
      const result = await client.query(`
        SELECT
          COUNT(*) as total_connections,
          COUNT(*) FILTER (WHERE state = 'active') as active_connections,
          COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
          setting as max_connections
        FROM pg_stat_activity, (SELECT setting FROM pg_settings WHERE name = 'max_connections') s
      `);

      const statsResult = await client.query(`
        SELECT
          SUM(calls) as total_calls,
          SUM(calls) / EXTRACT(EPOCH FROM (NOW() - stats_reset)) as queries_per_second
        FROM pg_stat_statements
      `);

      return {
        activeConnections: parseInt(result.rows[0].active_connections),
        idleConnections: parseInt(result.rows[0].idle_connections),
        totalConnections: parseInt(result.rows[0].total_connections),
        maxConnections: parseInt(result.rows[0].max_connections),
        queriesPerSecond: parseFloat(statsResult.rows[0].queries_per_second) || 0
      };
    } finally {
      client.release();
    }
  }
}

export const dbService = DatabaseService.getInstance();
```

### API Response Compression (40 lines)

```typescript
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';

export class ResponseCompression {
  private static readonly MIN_COMPRESSION_SIZE = 1024; // 1KB
  private static readonly COMPRESSION_LEVEL = 6; // Balance between speed and compression
  private static readonly COMPRESSION_FILTER = (req: Request, res: Response): boolean => {
    // Don't compress if already compressed
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Don't compress binary data or already compressed content
    const contentType = res.getHeader('Content-Type') as string;
    if (contentType && (
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('audio/') ||
      contentType.includes('application/pdf') ||
      contentType.includes('application/zip') ||
      contentType.includes('application/gzip')
    )) {
      return false;
    }

    return true;
  };

  public static middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();

      // Add compression headers
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('X-Content-Encoding', 'gzip');

      // Wrap the original write and end methods
      const originalWrite = res.write;
      const originalEnd = res.end;
      const originalSetHeader = res.setHeader;

      let chunks: Buffer[] = [];
      let contentLength = 0;

      res.setHeader = (name: string, value: any): Response => {
        if (name.toLowerCase() === 'content-length') {
          contentLength = parseInt(value);
        }
        return originalSetHeader.call(res, name, value);
      };

      res.write = (chunk: any, encoding?: any, callback?: any): boolean => {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        }
        return true;
      };

      res.end = (chunk?: any, encoding?: any, callback?: any): void => {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        }

        const body = Buffer.concat(chunks);
        const shouldCompress = this.shouldCompress(req, res, body, contentLength);

        if (shouldCompress) {
          compression({
            level: this.COMPRESSION_LEVEL,
            filter: this.COMPRESSION_FILTER,
            threshold: this.MIN_COMPRESSION_SIZE
          })(req, res, () => {
            res.write = originalWrite;
            res.end = originalEnd;
            res.end(body, encoding, callback);
          });
        } else {
          res.write = originalWrite;
          res.end = originalEnd;
          res.end(body, encoding, callback);
        }

        const duration = performance.now() - startTime;
        logger.debug('Response compression processed', {
          path: req.path,
          originalSize: body.length,
          compressed: shouldCompress,
          duration
        });
      };

      next();
    };
  }

  private static shouldCompress(
    req: Request,
    res: Response,
    body: Buffer,
    contentLength: number
  ): boolean {
    // Check if client accepts gzip
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (!acceptEncoding.includes('gzip')) {
      return false;
    }

    // Check if response is already compressed
    if (res.getHeader('Content-Encoding')) {
      return false;
    }

    // Check if content is too small to benefit from compression
    const size = contentLength || body.length;
    if (size < this.MIN_COMPRESSION_SIZE) {
      return false;
    }

    // Check if content type should be compressed
    return this.COMPRESSION_FILTER(req, res);
  }

  public static async compressString(content: string): Promise<Buffer> {
    const { gzip } = await import('zlib');
    return new Promise((resolve, reject) => {
      gzip(content, { level: this.COMPRESSION_LEVEL }, (err, result) => {
        if (err) {
          logger.error('String compression failed', { error: err });
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  public static async decompressString(compressed: Buffer): Promise<string> {
    const { gunzip } = await import('zlib');
    return new Promise((resolve, reject) => {
      gunzip(compressed, (err, result) => {
        if (err) {
          logger.error('String decompression failed', { error: err });
          reject(err);
        } else {
          resolve(result.toString());
        }
      });
    });
  }
}
```

### Lazy Loading Implementation (50 lines)

```typescript
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';

type LazyLoaderOptions<T> = {
  loadFn: () => Promise<T>;
  cacheKey?: string;
  ttl?: number;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onLoad?: (data: T) => void;
};

export class LazyLoader<T> {
  private data: T | null = null;
  private isLoading = false;
  private loadPromise: Promise<T> | null = null;
  private error: Error | null = null;
  private lastLoaded: number = 0;
  private readonly options: Required<LazyLoaderOptions<T>>;

  constructor(options: LazyLoaderOptions<T>) {
    this.options = {
      cacheKey: options.cacheKey || '',
      ttl: options.ttl || 300, // 5 minutes
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      onError: options.onError || (() => {}),
      onLoad: options.onLoad || (() => {}),
      ...options
    };
  }

  public async get(): Promise<T> {
    const startTime = performance.now();

    // Return cached data if available and not expired
    if (this.data !== null && !this.isExpired()) {
      logger.debug('Returning cached lazy-loaded data', {
        cacheKey: this.options.cacheKey,
        duration: performance.now() - startTime
      });
      return this.data;
    }

    // Return existing error if load failed and we're not retrying
    if (this.error !== null && !this.isLoading) {
      throw this.error;
    }

    // If already loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      logger.debug('Waiting for existing lazy load', {
        cacheKey: this.options.cacheKey
      });
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = this.loadWithRetry();

    try {
      this.data = await this.loadPromise;
      this.lastLoaded = Date.now();
      this.error = null;
      this.options.onLoad(this.data);

      logger.debug('Lazy load completed successfully', {
        cacheKey: this.options.cacheKey,
        duration: performance.now() - startTime
      });

      return this.data;
    } catch (err) {
      this.error = err as Error;
      this.options.onError(err as Error);
      logger.error('Lazy load failed', {
        error: err,
        cacheKey: this.options.cacheKey,
        duration: performance.now() - startTime
      });
      throw err;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  private async loadWithRetry(attempt: number = 1): Promise<T> {
    try {
      return await this.options.loadFn();
    } catch (err) {
      if (attempt >= this.options.maxRetries) {
        throw new Error(`Failed to load after ${attempt} attempts: ${err instanceof Error ? err.message : String(err)}`);
      }

      logger.warn(`Lazy load attempt ${attempt} failed, retrying...`, {
        error: err,
        cacheKey: this.options.cacheKey,
        attempt,
        delay: this.options.retryDelay
      });

      await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
      return this.loadWithRetry(attempt + 1);
    }
  }

  private isExpired(): boolean {
    return Date.now() - this.lastLoaded > this.options.ttl * 1000;
  }

  public async refresh(): Promise<T> {
    this.data = null;
    this.error = null;
    return this.get();
  }

  public getStatus(): {
    isLoaded: boolean;
    isLoading: boolean;
    isExpired: boolean;
    lastLoaded: number;
    error: Error | null;
  } {
    return {
      isLoaded: this.data !== null,
      isLoading: this.isLoading,
      isExpired: this.isExpired(),
      lastLoaded: this.lastLoaded,
      error: this.error
    };
  }
}

// Example usage in inventory service
export class InventoryService {
  private static partDetailsLoader = new LazyLoader<PartDetails>({
    cacheKey: 'part_details',
    ttl: 600, // 10 minutes
    loadFn: async () => {
      const result = await dbService.query<PartDetails>(
        'SELECT * FROM parts WHERE id = $1',
        [partId]
      );
      return result.rows[0];
    },
    onError: (error) => {
      logger.error('Failed to load part details', { error, partId });
    },
    onLoad: (data) => {
      logger.debug('Part details loaded', { partId: data.id });
    }
  });

  public static async getPartDetails(partId: string): Promise<PartDetails> {
    return this.partDetailsLoader.get();
  }

  public static async refreshPartDetails(partId: string): Promise<PartDetails> {
    return this.partDetailsLoader.refresh();
  }
}
```

### Request Debouncing (40 lines)

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';

type DebounceOptions = {
  keyGenerator: (req: Request) => string;
  delay: number;
  maxWait?: number;
  onDebounce?: (key: string, count: number) => void;
  onExecute?: (key: string, count: number) => void;
};

export class RequestDebouncer {
  private static readonly DEFAULT_DELAY = 300; // 300ms
  private static readonly DEFAULT_MAX_WAIT = 1000; // 1 second
  private static timers: Map<string, NodeJS.Timeout> = new Map();
  private static waiting: Map<string, { count: number; firstRequestTime: number }> = new Map();
  private static options: DebounceOptions;

  public static configure(options: Partial<DebounceOptions>): void {
    this.options = {
      delay: this.DEFAULT_DELAY,
      maxWait: this.DEFAULT_MAX_WAIT,
      ...options,
      keyGenerator: options.keyGenerator || ((req) => req.path + JSON.stringify(req.query))
    };
  }

  public static middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.options.keyGenerator(req);
      const now = Date.now();
      const existing = this.waiting.get(key);

      if (existing) {
        // Update existing request
        existing.count++;
        this.waiting.set(key, existing);

        if (this.options.onDebounce) {
          this.options.onDebounce(key, existing.count);
        }

        logger.debug('Debounced request', {
          key,
          count: existing.count,
          timeSinceFirst: now - existing.firstRequestTime
        });

        return;
      }

      // First request - set up debounce
      this.waiting.set(key, { count: 1, firstRequestTime: now });

      const timer = setTimeout(() => {
        this.executeRequest(key, req, res, next);
      }, this.options.delay);

      this.timers.set(key, timer);

      // Set up max wait timer if configured
      if (this.options.maxWait) {
        const maxWaitTimer = setTimeout(() => {
          this.executeRequest(key, req, res, next);
        }, this.options.maxWait);

        this.timers.set(`${key}_maxWait`, maxWaitTimer);
      }
    };
  }

  private static executeRequest(
    key: string,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const waiting = this.waiting.get(key);
    if (!waiting) return;

    // Clear timers
    const timer = this.timers.get(key);
    if (timer) clearTimeout(timer);

    const maxWaitTimer = this.timers.get(`${key}_maxWait`);
    if (maxWaitTimer) clearTimeout(maxWaitTimer);

    this.timers.delete(key);
    this.timers.delete(`${key}_maxWait`);
    this.waiting.delete(key);

    if (this.options.onExecute) {
      this.options.onExecute(key, waiting.count);
    }

    logger.debug('Executing debounced request', {
      key,
      count: waiting.count,
      duration: Date.now() - waiting.firstRequestTime
    });

    // Add debounce info to request
    (req as any).debounceInfo = {
      count: waiting.count,
      firstRequestTime: waiting.firstRequestTime
    };

    next();
  }

  public static clear(key: string): void {
    const timer = this.timers.get(key);
    if (timer) clearTimeout(timer);

    const maxWaitTimer = this.timers.get(`${key}_maxWait`);
    if (maxWaitTimer) clearTimeout(maxWaitTimer);

    this.timers.delete(key);
    this.timers.delete(`${key}_maxWait`);
    this.waiting.delete(key);
  }

  public static getStats(): {
    activeDebounces: number;
    waitingRequests: number;
  } {
    return {
      activeDebounces: this.timers.size / 2, // Each key has 2 timers (regular + maxWait)
      waitingRequests: Array.from(this.waiting.values()).reduce(
        (sum, current) => sum + current.count,
        0
      )
    };
  }
}

// Example usage in inventory routes
RequestDebouncer.configure({
  keyGenerator: (req) => {
    // Debounce based on path and relevant query params
    const params = [
      req.path,
      req.query.locationId as string,
      req.query.categoryId as string,
      req.query.status as string
    ].join('|');
    return `inventory:${params}`;
  },
  delay: 500,
  maxWait: 2000,
  onDebounce: (key, count) => {
    logger.info('Debounced inventory request', { key, count });
  },
  onExecute: (key, count) => {
    logger.info('Executing debounced inventory request', { key, count });
  }
});

// Apply to inventory routes
router.get(
  '/inventory/summary',
  RequestDebouncer.middleware(),
  async (req: Request, res: Response) => {
    const debounceInfo = (req as any).debounceInfo;
    logger.debug('Processing debounced request', { debounceInfo });

    try {
      const result = await dbService.getInventorySummary(
        req.query.locationId as string,
        req.query.categoryId as string,
        req.query.status as string[]
      );

      res.json({
        ...result,
        debounceInfo: {
          count: debounceInfo?.count || 1,
          timeSaved: debounceInfo
            ? Date.now() - debounceInfo.firstRequestTime - 500 // 500ms debounce delay
            : 0
        }
      });
    } catch (err) {
      logger.error('Failed to get inventory summary', { error: err });
      res.status(500).json({ error: 'Failed to get inventory summary' });
    }
  }
);
```

### Connection Pooling (30 lines)

```typescript
import { Pool, PoolClient, PoolConfig } from 'pg';
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';

class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private pools: Map<string, Pool> = new Map();
  private readonly DEFAULT_CONFIG: PoolConfig = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };

  private constructor() {
    // Initialize default pool
    this.createPool('default', process.env.DATABASE_URL || '');
  }

  public static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager();
    }
    return ConnectionPoolManager.instance;
  }

  public createPool(name: string, connectionString: string, config?: PoolConfig): void {
    if (this.pools.has(name)) {
      logger.warn(`Pool with name ${name} already exists`);
      return;
    }

    const poolConfig: PoolConfig = {
      ...this.DEFAULT_CONFIG,
      ...config,
      connectionString
    };

    const pool = new Pool(poolConfig);

    // Event listeners
    pool.on('connect', () => {
      logger.debug(`New client connected to pool ${name}`);
    });

    pool.on('acquire', () => {
      logger.debug(`Client acquired from pool ${name}`);
    });

    pool.on('remove', () => {
      logger.debug(`Client removed from pool ${name}`);
    });

    pool.on('error', (err) => {
      logger.error(`Unexpected error on pool ${name}`, { error: err });
    });

    this.pools.set(name, pool);
    logger.info(`Created new connection pool ${name}`);
  }

  public async getClient(poolName: string = 'default'): Promise<PoolClient> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    const startTime = performance.now();
    try {
      const client = await pool.connect();
      const duration = performance.now() - startTime;

      logger.debug(`Acquired client from pool ${poolName}`, {
        duration,
        totalClients: pool.totalCount,
        idleClients: pool.idleCount,
        waitingClients: pool.waitingCount
      });

      return client;
    } catch (err) {
      const duration = performance.now() - startTime;
      logger.error(`Failed to acquire client from pool ${poolName}`, {
        error: err,
        duration,
        totalClients: pool.totalCount,
        idleClients: pool.idleCount,
        waitingClients: pool.waitingCount
      });
      throw err;
    }
  }

  public async executeQuery<T>(
    poolName: string,
    query: string,
    params: any[] = []
  ): Promise<{ rows: T[]; duration: number }> {
    const client = await this.getClient(poolName);
    const startTime = performance.now();

    try {
      const result = await client.query(query, params);
      const duration = performance.now() - startTime;

      logger.debug(`Query executed on pool ${poolName}`, {
        query,
        duration,
        rowCount: result.rowCount
      });

      return {
        rows: result.rows,
        duration
      };
    } catch (err) {
      const duration = performance.now() - startTime;
      logger.error(`Query failed on pool ${poolName}`, {
        query,
        params,
        error: err,
        duration
      });
      throw err;
    } finally {
      client.release();
    }
  }

  public async getPoolStats(poolName: string = 'default'): Promise<{
    totalClients: number;
    idleClients: number;
    waitingClients: number;
    maxClients: number;
    queriesPerSecond: number;
  }> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    // Get basic pool stats
    const stats = {
      totalClients: pool.totalCount,
      idleClients: pool.idleCount,
      waitingClients: pool.waitingCount,
      maxClients: pool.options.max || 20,
      queriesPerSecond: 0
    };

    // Get more detailed stats if possible
    try {
      const client = await this.getClient(poolName);
      try {
        const result = await client.query(`
          SELECT
            SUM(calls) as total_calls,
            SUM(calls) / EXTRACT(EPOCH FROM (NOW() - stats_reset)) as queries_per_second
          FROM pg_stat_statements
        `);

        if (result.rows[0].queries_per_second) {
          stats.queriesPerSecond = parseFloat(result.rows[0].queries_per_second);
        }
      } finally {
        client.release();
      }
    } catch (err) {
      logger.warn('Could not get detailed pool stats', { error: err });
    }

    return stats;
  }

  public async endPool(poolName: string = 'default'): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      logger.warn(`Pool ${poolName} not found`);
      return;
    }

    try {
      await pool.end();
      this.pools.delete(poolName);
      logger.info(`Connection pool ${poolName} ended`);
    } catch (err) {
      logger.error(`Failed to end pool ${poolName}`, { error: err });
      throw err;
    }
  }

  public async endAllPools(): Promise<void> {
    const promises = Array.from(this.pools.keys()).map(poolName => this.endPool(poolName));
    await Promise.all(promises);
  }
}

export const poolManager = ConnectionPoolManager.getInstance();

// Example usage in inventory service
export class InventoryRepository {
  private static readonly POOL_NAME = 'inventory';

  public static async initialize(): Promise<void> {
    poolManager.createPool(
      this.POOL_NAME,
      process.env.INVENTORY_DATABASE_URL || '',
      {
        max: 30, // Higher limit for inventory service
        idleTimeoutMillis: 60000
      }
    );
  }

  public static async getPartById(partId: string): Promise<Part | null> {
    const { rows } = await poolManager.executeQuery<Part>(
      this.POOL_NAME,
      'SELECT * FROM parts WHERE id = $1',
      [partId]
    );

    return rows[0] || null;
  }

  public static async getInventoryByLocation(locationId: string): Promise<InventoryItem[]> {
    const { rows } = await poolManager.executeQuery<InventoryItem>(
      this.POOL_NAME,
      `
        SELECT i.*, p.part_number, p.description, p.price, p.category_id
        FROM inventory i
        JOIN parts p ON i.part_id = p.id
        WHERE i.location_id = $1
        ORDER BY p.part_number
      `,
      [locationId]
    );

    return rows;
  }

  public static async getPoolStats(): Promise<{
    totalClients: number;
    idleClients: number;
    waitingClients: number;
    maxClients: number;
    queriesPerSecond: number;
  }> {
    return poolManager.getPoolStats(this.POOL_NAME);
  }
}
```

---

## Real-Time Features (350 lines)

### WebSocket Server Setup (70 lines)

```typescript
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiter } from '../utils/rateLimiter';
import { AuthService } from '../services/authService';

type WebSocketConnection = {
  socket: WebSocket;
  userId: string;
  roles: string[];
  connectionId: string;
  ipAddress: string;
  userAgent: string;
  connectedAt: number;
  lastActivity: number;
  subscriptions: Set<string>;
  isAlive: boolean;
};

export class RealTimeServer {
  private static instance: RealTimeServer;
  private wss: WebSocketServer;
  private connections: Map<string, WebSocketConnection> = new Map();
  private rateLimiter: RateLimiter;
  private readonly PING_INTERVAL = 30000; // 30 seconds
  private readonly CONNECTION_TIMEOUT = 60000; // 1 minute
  private readonly MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB

  private constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      clientTracking: false,
      maxPayload: this.MAX_MESSAGE_SIZE,
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        threshold: 1024
      }
    });

    this.rateLimiter = new RateLimiter({
      points: 100,
      duration: 60,
      blockDuration: 300
    });

    this.setupEventHandlers();
    this.setupPingPong();
    this.setupCleanup();

    logger.info('WebSocket server initialized');
  }

  public static getInstance(server?: Server): RealTimeServer {
    if (!RealTimeServer.instance && server) {
      RealTimeServer.instance = new RealTimeServer(server);
    }
    return RealTimeServer.instance;
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const startTime = performance.now();
      const ipAddress = this.getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Rate limiting
      const rateLimitKey = `ws:${ipAddress}`;
      if (this.rateLimiter.isBlocked(rateLimitKey)) {
        ws.close(1008, 'Too many connection attempts');
        logger.warn('Blocked WebSocket connection due to rate limiting', {
          ipAddress,
          userAgent
        });
        return;
      }

      this.rateLimiter.consume(rateLimitKey).catch(() => {
        ws.close(1008, 'Too many connection attempts');
        logger.warn('Rate limit exceeded for WebSocket connection', {
          ipAddress,
          userAgent
        });
      });

      // Authentication
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        ws.close(1008, 'Authentication required');
        logger.warn('WebSocket connection attempt without authentication', {
          ipAddress,
          userAgent
        });
        return;
      }

      AuthService.verifyToken(authHeader.replace('Bearer ', ''))
        .then(({ userId, roles }) => {
          const connectionId = uuidv4();
          const connection: WebSocketConnection = {
            socket: ws,
            userId,
            roles,
            connectionId,
            ipAddress,
            userAgent,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
            subscriptions: new Set(),
            isAlive: true
          };

          this.connections.set(connectionId, connection);
          logger.info('WebSocket connection established', {
            connectionId,
            userId,
            ipAddress,
            userAgent,
            duration: performance.now() - startTime
          });

          this.setupConnectionHandlers(connection);
        })
        .catch((err) => {
          ws.close(1008, 'Authentication failed');
          logger.warn('WebSocket authentication failed', {
            error: err,
            ipAddress,
            userAgent
          });
        });
    });
  }

  private setupConnectionHandlers(connection: WebSocketConnection): void {
    const { socket, connectionId } = connection;

    socket.on('message', (data: WebSocket.RawData) => {
      connection.lastActivity = Date.now();
      this.handleMessage(connection, data);
    });

    socket.on('pong', () => {
      connection.isAlive = true;
      connection.lastActivity = Date.now();
    });

    socket.on('close', (code: number, reason: Buffer) => {
      this.handleClose(connection, code, reason);
    });

    socket.on('error', (error: Error) => {
      logger.error('WebSocket error', {
        connectionId,
        error,
        userId: connection.userId
      });
    });
  }

  private setupPingPong(): void {
    setInterval(() => {
      this.connections.forEach((connection) => {
        if (!connection.isAlive) {
          connection.socket.close(1001, 'Connection timeout');
          return;
        }

        connection.isAlive = false;
        connection.socket.ping();
      });
    }, this.PING_INTERVAL);
  }

  private setupCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      this.connections.forEach((connection, connectionId) => {
        if (now - connection.lastActivity > this.CONNECTION_TIMEOUT) {
          connection.socket.close(1001, 'Connection timeout');
          this.connections.delete(connectionId);
          logger.info('Closed inactive WebSocket connection', {
            connectionId,
            userId: connection.userId
          });
        }
      });
    }, this.PING_INTERVAL);
  }

  private getClientIp(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public getConnectionsByUser(userId: string): WebSocketConnection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.userId === userId
    );
  }

  public getActiveSubscriptions(): Map<string, number> {
    const subscriptions = new Map<string, number>();

    this.connections.forEach((connection) => {
      connection.subscriptions.forEach((channel) => {
        subscriptions.set(channel, (subscriptions.get(channel) || 0) + 1);
      });
    });

    return subscriptions;
  }

  public broadcast(channel: string, message: any): void {
    const data = JSON.stringify({
      type: 'broadcast',
      channel,
      data: message,
      timestamp: Date.now()
    });

    this.connections.forEach((connection) => {
      if (connection.subscriptions.has(channel)) {
        try {
          connection.socket.send(data);
          connection.lastActivity = Date.now();
        } catch (err) {
          logger.error('Failed to send broadcast message', {
            connectionId: connection.connectionId,
            channel,
            error: err
          });
        }
      }
    });
  }

  public sendToUser(userId: string, message: any): void {
    const data = JSON.stringify({
      type: 'direct',
      data: message,
      timestamp: Date.now()
    });

    this.getConnectionsByUser(userId).forEach((connection) => {
      try {
        connection.socket.send(data);
        connection.lastActivity = Date.now();
      } catch (err) {
        logger.error('Failed to send direct message', {
          connectionId: connection.connectionId,
          userId,
          error: err
        });
      }
    });
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket server...');

    // Close all connections
    this.connections.forEach((connection) => {
      connection.socket.close(1001, 'Server shutdown');
    });

    // Wait for connections to close
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.connections.size === 0) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 100);
    });

    // Close the WebSocket server
    this.wss.close(() => {
      logger.info('WebSocket server shutdown complete');
    });
  }
}
```

### Real-Time Event Handlers (90 lines)

```typescript
import { WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { InventoryService } from '../services/inventoryService';
import { NotificationService } from '../services/notificationService';
import { AuditService } from '../services/auditService';
import { RealTimeServer } from './realTimeServer';

type WebSocketMessage = {
  type: string;
  channel?: string;
  data: any;
};

export class RealTimeEventHandler {
  private static readonly ALLOWED_CHANNELS = new Set([
    'inventory-updates',
    'low-stock-alerts',
    'order-updates',
    'transfer-updates',
    'system-notifications',
    'user-activity'
  ]);

  private static readonly ROLE_PERMISSIONS: Record<string, string[]> = {
    admin: ['*'],
    manager: [
      'inventory-updates',
      'low-stock-alerts',
      'order-updates',
      'transfer-updates',
      'system-notifications'
    ],
    technician: [
      'inventory-updates',
      'low-stock-alerts',
      'system-notifications'
    ],
    warehouse: [
      'inventory-updates',
      'low-stock-alerts',
      'order-updates',
      'transfer-updates'
    ]
  };

  public static handleMessage(connection: WebSocketConnection, data: WebSocket.RawData): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      if (!message.type) {
        this.sendError(connection, 'Invalid message format: missing type');
        return;
      }

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(connection, message);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(connection, message);
          break;
        case 'ping':
          this.handlePing(connection);
          break;
        case 'inventory-query':
          this.handleInventoryQuery(connection, message);
          break;
        case 'order-status':
          this.handleOrderStatusUpdate(connection, message);
          break;
        default:
          this.sendError(connection, `Unknown message type: ${message.type}`);
      }
    } catch (err) {
      logger.error('Failed to parse WebSocket message', {
        error: err,
        connectionId: connection.connectionId,
        userId: connection.userId
      });
      this.sendError(connection, 'Invalid message format');
    }
  }

  private static handleSubscribe(connection: WebSocketConnection, message: WebSocketMessage): void {
    if (!message.channel) {
      this.sendError(connection, 'Channel is required for subscription');
      return;
    }

    if (!this.ALLOWED_CHANNELS.has(message.channel)) {
      this.sendError(connection, `Invalid channel: ${message.channel}`);
      return;
    }

    // Check permissions
    if (!this.hasPermission(connection, message.channel)) {
      this.sendError(connection, `Permission denied for channel: ${message.channel}`);
      return;
    }

    connection.subscriptions.add(message.channel);
    logger.info('WebSocket subscription added', {
      connectionId: connection.connectionId,
      userId: connection.userId,
      channel: message.channel
    });

    this.sendAck(connection, {
      type: 'subscribe',
      channel: message.channel,
      status: 'success'
    });

    // Send initial data if available
    this.sendInitialData(connection, message.channel);
  }

  private static handleUnsubscribe(connection: WebSocketConnection, message: WebSocketMessage): void {
    if (!message.channel) {
      this.sendError(connection, 'Channel is required for unsubscription');
      return;
    }

    if (connection.subscriptions.has(message.channel)) {
      connection.subscriptions.delete(message.channel);
      logger.info('WebSocket subscription removed', {
        connectionId: connection.connectionId,
        userId: connection.userId,
        channel: message.channel
      });

      this.sendAck(connection, {
        type: 'unsubscribe',
        channel: message.channel,
        status: 'success'
      });
    } else {
      this.sendError(connection, `Not subscribed to channel: ${message.channel}`);
    }
  }

  private static handlePing(connection: WebSocketConnection): void {
    connection.lastActivity = Date.now();
    connection.socket.send(JSON.stringify({
      type: 'pong',
      timestamp: Date.now()
    }));
  }

  private static async handleInventoryQuery(
    connection: WebSocketConnection,
    message: WebSocketMessage
  ): Promise<void> {
    if (!this.hasPermission(connection, 'inventory-updates')) {
      this.sendError(connection, 'Permission denied for inventory queries');
      return;
    }

    try {
      const { locationId, partId, categoryId } = message.data || {};

      if (!locationId) {
        this.sendError(connection, 'locationId is required for inventory query');
        return;
      }

      const inventory = await InventoryService.getInventoryForLocation(
        locationId,
        partId,
        categoryId
      );

      connection.socket.send(JSON.stringify({
        type: 'inventory-data',
        data: inventory,
        timestamp: Date.now()
      }));

      connection.lastActivity = Date.now();

      // Log the query for auditing
      await AuditService.logEvent({
        userId: connection.userId,
        action: 'inventory_query',
        entityType: 'inventory',
        entityId: locationId,
        metadata: {
          partId,
          categoryId,
          connectionId: connection.connectionId
        }
      });
    } catch (err) {
      logger.error('Failed to handle inventory query', {
        error: err,
        connectionId: connection.connectionId,
        userId: connection.userId
      });
      this.sendError(connection, 'Failed to process inventory query');
    }
  }

  private static async handleOrderStatusUpdate(
    connection: WebSocketConnection,
    message: WebSocketMessage
  ): Promise<void> {
    if (!this.hasPermission(connection, 'order-updates')) {
      this.sendError(connection, 'Permission denied for order status updates');
      return;
    }

    try {
      const { orderId, status, notes } = message.data || {};

      if (!orderId || !status) {
        this.sendError(connection, 'orderId and status are required');
        return;
      }

      const updatedOrder = await InventoryService.updateOrderStatus(
        orderId,
        status,
        notes,
        connection.userId
      );

      // Broadcast the update to all subscribers
      RealTimeServer.getInstance().broadcast('order-updates', {
        orderId,
        status,
        updatedAt: updatedOrder.updatedAt,
        updatedBy: connection.userId
      });

      // Send notification to relevant users
      await NotificationService.createNotification({
        type: 'order_update',
        recipientIds: [updatedOrder.createdBy, updatedOrder.assignedTo].filter(Boolean),
        title: `Order ${orderId} status updated to ${status}`,
        message: notes || `Order status changed to ${status}`,
        data: {
          orderId,
          status,
          notes
        }
      });

      this.sendAck(connection, {
        type: 'order-status',
        status: 'success',
        orderId,
        newStatus: status
      });
    } catch (err) {
      logger.error('Failed to handle order status update', {
        error: err,
        connectionId: connection.connectionId,
        userId: connection.userId
      });
      this.sendError(connection, 'Failed to update order status');
    }
  }

  private static async sendInitialData(
    connection: WebSocketConnection,
    channel: string
  ): Promise<void> {
    try {
      switch (channel) {
        case 'inventory-updates':
          // For inventory updates, we don't send initial data as it's too large
          break;
        case 'low-stock-alerts':
          const alerts = await InventoryService.getLowStockAlerts();
          connection.socket.send(JSON.stringify({
            type: 'initial-data',
            channel,
            data: alerts,
            timestamp: Date.now()
          }));
          break;
        case 'order-updates':
          const orders = await InventoryService.getRecentOrders();
          connection.socket.send(JSON.stringify({
            type: 'initial-data',
            channel,
            data: orders,
            timestamp: Date.now()
          }));
          break;
        case 'system-notifications':
          const notifications = await NotificationService.getRecentNotifications(
            connection.userId
          );
          connection.socket.send(JSON.stringify({
            type: 'initial-data',
            channel,
            data: notifications,
            timestamp: Date.now()
          }));
          break;
      }
    } catch (err) {
      logger.error('Failed to send initial data', {
        error: err,
        connectionId: connection.connectionId,
        userId: connection.userId,
        channel
      });
    }
  }

  private static hasPermission(connection: WebSocketConnection, channel: string): boolean {
    // Check if user has any role that allows this channel
    return connection.roles.some(role => {
      const permissions = this.ROLE_PERMISSIONS[role];
      return permissions && (permissions.includes('*') || permissions.includes(channel));
    });
  }

  private static sendAck(connection: WebSocketConnection, data: any): void {
    connection.socket.send(JSON.stringify({
      type: 'ack',
      ...data,
      timestamp: Date.now()
    }));
    connection.lastActivity = Date.now();
  }

  private static sendError(connection: WebSocketConnection, message: string): void {
    connection.socket.send(JSON.stringify({
      type: 'error',
      message,
      timestamp: Date.now()
    }));
    connection.lastActivity = Date.now();
  }

  public static async handleInventoryUpdate(
    locationId: string,
    partId: string,
    quantityChange: number,
    metadata: any = {}
  ): Promise<void> {
    try {
      const inventory = await InventoryService.getInventoryItem(locationId, partId);
      if (!inventory) return;

      // Broadcast the update to all subscribers
      RealTimeServer.getInstance().broadcast('inventory-updates', {
        locationId,
        partId,
        newQuantity: inventory.quantity,
        change: quantityChange,
        timestamp: Date.now(),
        ...metadata
      });

      // Check if this update triggers a low stock alert
      if (inventory.quantity <= inventory.reorderThreshold) {
        const alert = await InventoryService.createLowStockAlert(
          locationId,
          partId,
          inventory.quantity,
          inventory.reorderThreshold
        );

        RealTimeServer.getInstance().broadcast('low-stock-alerts', alert);

        // Send notification to relevant users
        const location = await InventoryService.getLocation(locationId);
        if (location) {
          await NotificationService.createNotification({
            type: 'low_stock',
            recipientIds: location.managerIds || [],
            title: `Low stock alert for ${inventory.partNumber}`,
            message: `Only ${inventory.quantity} ${inventory.partNumber} (${inventory.description}) remaining at ${location.name}`,
            data: {
              locationId,
              partId,
              quantity: inventory.quantity,
              threshold: inventory.reorderThreshold
            }
          });
        }
      }
    } catch (err) {
      logger.error('Failed to handle inventory update', {
        error: err,
        locationId,
        partId
      });
    }
  }

  public static async handleOrderUpdate(orderId: string): Promise<void> {
    try {
      const order = await InventoryService.getOrder(orderId);
      if (!order) return;

      RealTimeServer.getInstance().broadcast('order-updates', {
        orderId,
        status: order.status,
        updatedAt: order.updatedAt,
        updatedBy: order.updatedBy
      });
    } catch (err) {
      logger.error('Failed to handle order update', {
        error: err,
        orderId
      });
    }
  }
}
```

### Client-Side WebSocket Integration (70 lines)

```typescript
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

type WebSocketMessage = {
  type: string;
  channel?: string;
  data: any;
  timestamp: number;
  [key: string]: any;
};

type WebSocketOptions = {
  url: string;
  token: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: (code: number, reason: string) => void;
  onError?: (error: Error) => void;
};

export class WebSocketClient extends EventEmitter {
  private socket: WebSocket | null = null;
  private readonly options: Required<WebSocketOptions>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private subscriptions: Set<string> = new Set();
  private messageQueue: WebSocketMessage[] = [];
  private isConnecting = false;
  private connectionId: string | null = null;

  constructor(options: WebSocketOptions) {
    super();
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      onConnect: () => {},
      onDisconnect: () => {},
      onError: () => {},
      ...options
    };
  }

  public connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      logger.warn('WebSocket connection already established');
      return;
    }

    if (this.isConnecting) {
      logger.warn('WebSocket connection already in progress');
      return;
    }

    this.isConnecting = true;
    this.reconnectAttempts = 0;

    try {
      this.socket = new WebSocket(this.options.url, {
        headers: {
          Authorization: `Bearer ${this.options.token}`
        }
      });

      this.setupEventHandlers();
    } catch (err) {
      this.handleError(err as Error);
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.connectionId = this.generateConnectionId();

      logger.info('WebSocket connected', {
        connectionId: this.connectionId,
        url: this.options.url
      });

      // Process any queued messages
      this.processMessageQueue();

      // Start ping/pong
      this.startPingPong();

      // Notify subscribers
      this.options.onConnect();
      this.emit('connect');
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (err) {
        logger.error('Failed to parse WebSocket message', {
          error: err,
          connectionId: this.connectionId
        });
      }
    };

    this.socket.onclose = (event) => {
      this.isConnecting = false;
      this.stopPingPong();

      logger.info('WebSocket disconnected', {
        connectionId: this.connectionId,
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });

      this.options.onDisconnect(event.code, event.reason);
      this.emit('disconnect', event.code, event.reason);

      if (event.code !== 1000) { // 1000 is normal closure
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (event) => {
      logger.error('WebSocket error', {
        connectionId: this.connectionId,
        error: event.error || 'Unknown error'
      });
      this.handleError(event.error || new Error('WebSocket error'));
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    this.emit('message', message);

    if (message.type === 'broadcast' && message.channel) {
      this.emit(`channel:${message.channel}`, message.data);
      this.emit('broadcast', message.channel, message.data);
    } else if (message.type === 'direct') {
      this.emit('direct', message.data);
    } else if (message.type === 'ack') {
      this.emit('ack', message);
    } else if (message.type === 'error') {
      this.emit('error', new Error(message.message));
    } else if (message.type === 'pong') {
      // Handled by ping/pong mechanism
    } else {
      logger.warn('Unknown message type received', {
        connectionId: this.connectionId,
        messageType: message.type
      });
    }
  }

  private startPingPong(): void {
    this.stopPingPong();

    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000); // 30 seconds
  }

  private stopPingPong(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      logger.warn('Max reconnect attempts reached, giving up', {
        connectionId: this.connectionId,
        maxAttempts: this.options.maxReconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;

    const delay = this.options.reconnectInterval * this.reconnectAttempts;
    logger.info('Scheduling WebSocket reconnect', {
      connectionId: this.connectionId,
      attempt: this.reconnectAttempts,
      delay
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public subscribe(channel: string): void {
    if (this.subscriptions.has(channel)) {
      logger.warn('Already subscribed to channel', {
        connectionId: this.connectionId,
        channel
      });
      return;
    }

    this.subscriptions.add(channel);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    } else {
      this.messageQueue.push({
        type: 'subscribe',
        channel,
        timestamp: Date.now()
      });
    }
  }

  public unsubscribe(channel: string): void {
    if (!this.subscriptions.has(channel)) {
      logger.warn('Not subscribed to channel', {
        connectionId: this.connectionId,
        channel
      });
      return;
    }

    this.subscriptions.delete(channel);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'unsubscribe',
        channel
      }));
    }
  }

  public queryInventory(locationId: string, partId?: string, categoryId?: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot query inventory - WebSocket not connected');
      return;
    }

    this.socket.send(JSON.stringify({
      type: 'inventory-query',
      data: {
        locationId,
        partId,
        categoryId
      }
    }));
  }

  public updateOrderStatus(orderId: string, status: string, notes?: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot update order status - WebSocket not connected');
      return;
    }

    this.socket.send(JSON.stringify({
      type: 'order-status',
      data: {
        orderId,
        status,
        notes
      }
    }));
  }

  private processMessageQueue(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.socket.send(JSON.stringify(message));
      }
    }
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close(1000, 'Client initiated disconnect');
      this.socket = null;
    }

    this.stopPingPong();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  private handleError(error: Error): void {
    logger.error('WebSocket client error', {
      connectionId: this.connectionId,
      error: error.message
    });
    this.options.onError(error);
    this.emit('error', error);
  }

  public getStatus(): {
    connected: boolean;
    connecting: boolean;
    reconnectAttempts: number;
    subscriptions: string[];
    connectionId: string | null;
  } {
    return {
      connected: this.socket?.readyState === WebSocket.OPEN,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions),
      connectionId: this.connectionId
    };
  }
}

// Example usage in a React component
export class InventoryWebSocketService {
  private static client: WebSocketClient | null = null;
  private static listeners: Map<string, Set<Function>> = new Map();

  public static initialize(token: string): void {
    if (this.client) {
      this.client.disconnect();
    }

    this.client = new WebSocketClient({
      url: process.env.REACT_APP_WS_URL || 'wss://api.example.com/ws',
      token,
      onConnect: () => {
        logger.info('WebSocket connected');
        this.setupSubscriptions();
      },
      onDisconnect: (code, reason) => {
        logger.info('WebSocket disconnected', { code, reason });
      },
      onError: (error) => {
        logger.error('WebSocket error', { error });
      }
    });

    this.client.connect();
  }

  private static setupSubscriptions(): void {
    if (!this.client) return;

    // Subscribe to inventory updates
    this.client.subscribe('inventory-updates');

    // Subscribe to low stock alerts
    this.client.subscribe('low-stock-alerts');

    // Subscribe to system notifications
    this.client.subscribe('system-notifications');

    // Set up event listeners
    this.client.on('channel:inventory-updates', (data: any) => {
      this.notifyListeners('inventory-updates', data);
    });

    this.client.on('channel:low-stock-alerts', (data: any) => {
      this.notifyListeners('low-stock-alerts', data);
    });

    this.client.on('channel:system-notifications', (data: any) => {
      this.notifyListeners('system-notifications', data);
    });
  }

  public static subscribe(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  public static unsubscribe(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private static notifyListeners(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        logger.error('Error in WebSocket listener', {
          event,
          error: err
        });
      }
    });
  }

  public static queryInventory(locationId: string, partId?: string, categoryId?: string): void {
    this.client?.queryInventory(locationId, partId, categoryId);
  }

  public static updateOrderStatus(orderId: string, status: string, notes?: string): void {
    this.client?.updateOrderStatus(orderId, status, notes);
  }

  public static getStatus(): {
    connected: boolean;
    subscriptions: string[];
  } {
    if (!this.client) {
      return { connected: false, subscriptions: [] };
    }

    const status = this.client.getStatus();
    return {
      connected: status.connected,
      subscriptions: status.subscriptions
    };
  }

  public static disconnect(): void {
    this.client?.disconnect();
    this.client = null;
    this.listeners.clear();
  }
}
```

### Room/Channel Management (60 lines)

```typescript
import { logger } from '../utils/logger';
import { RealTimeServer } from './realTimeServer';

type Room = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  members: Set<string>;
  metadata: Record<string, any>;
};

type Channel = {
  id: string;
  name: string;
  description: string;
  roomId: string;
  createdAt: Date;
  createdBy: string;
  isPublic: boolean;
  metadata: Record<string, any>;
};

export class RoomManager {
  private static rooms: Map<string, Room> = new Map();
  private static channels: Map<string, Channel> = new Map();
  private static userRooms: Map<string, Set<string>> = new Map();
  private static channelSubscriptions: Map<string, Set<string>> = new Map();

  public static async createRoom(
    id: string,
    name: string,
    description: string,
    createdBy: string,
    metadata: Record<string, any> = {}
  ): Promise<Room> {
    if (this.rooms.has(id)) {
      throw new Error(`Room with id ${id} already exists`);
    }

    const room: Room = {
      id,
      name,
      description,
      createdAt: new Date(),
      createdBy,
      members: new Set([createdBy]),
      metadata
    };

    this.rooms.set(id, room);
    this.addUserToRoom(createdBy, id);

    logger.info('Room created', {
      roomId: id,
      name,
      createdBy
    });

    return room;
  }

  public static async updateRoom(
    id: string,
    updates: {
      name?: string;
      description?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Room> {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error(`Room with id ${id} not found`);
    }

    if (updates.name) room.name = updates.name;
    if (updates.description) room.description = updates.description;
    if (updates.metadata) room.metadata = { ...room.metadata, ...updates.metadata };

    this.rooms.set(id, room);

    logger.info('Room updated', {
      roomId: id,
      updates
    });

    return room;
  }

  public static async deleteRoom(id: string): Promise<void> {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error(`Room with id ${id} not found`);
    }

    // Remove all channels in this room
    Array.from(this.channels.values())
      .filter(channel => channel.roomId === id)
      .forEach(channel => this.deleteChannel(channel.id));

    // Remove room from all users
    room.members.forEach(userId => {
      this.removeUserFromRoom(userId, id);
    });

    this.rooms.delete(id);

    logger.info('Room deleted', {
      roomId: id
    });
  }

  public static async addUserToRoom(userId: string, roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room with id ${roomId} not found`);
    }

    room.members.add(userId);
    this.rooms.set(roomId, room);

    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)?.add(roomId);

    logger.info('User added to room', {
      userId,
      roomId
    });

    // Notify the user
    RealTimeServer.getInstance().sendToUser(userId, {
      type: 'room_joined',
      roomId,
      roomName: room.name
    });
  }

  public static async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room with id ${roomId} not found`);
    }

    room.members.delete(userId);
    this.rooms.set(roomId, room);

    if (this.userRooms.has(userId)) {
      this.userRooms.get(userId)?.delete(roomId);
    }

    // Remove all channel subscriptions for this user in this room
    Array.from(this.channels.values())
      .filter(channel => channel.roomId === roomId)
      .forEach(channel => {
        this.unsubscribeFromChannel(userId, channel.id);
      });

    logger.info('User removed from room', {
      userId,
      roomId
    });

    // Notify the user
    RealTimeServer.getInstance().sendToUser(userId, {
      type: 'room_left',
      roomId
    });
  }

  public static async createChannel(
    id: string,
    name: string,
    description: string,
    roomId: string,
    createdBy: string,
    isPublic: boolean = true,
    metadata: Record<string, any> = {}
  ): Promise<Channel> {
    if (this.channels.has(id)) {
      throw new Error(`Channel with id ${id} already exists`);
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room with id ${roomId} not found`);
    }

    const channel: Channel = {
      id,
      name,
      description,
      roomId,
      createdAt: new Date(),
      createdBy,
      isPublic,
      metadata
    };

    this.channels.set(id, channel);

    logger.info('Channel created', {
      channelId: id,
      name,
      roomId,
      createdBy
    });

    return channel;
  }

  public static async updateChannel(
    id: string,
    updates: {
      name?: string;
      description?: string;
      isPublic?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<Channel> {
    const channel = this.channels.get(id);
    if (!channel) {
      throw new Error(`Channel with id ${id} not found`);
    }

    if (updates.name) channel.name = updates.name;
    if (updates.description) channel.description = updates.description;
    if (updates.isPublic !== undefined) channel.isPublic = updates.isPublic;
    if (updates.metadata) channel.metadata = { ...channel.metadata, ...updates.metadata };

    this.channels.set(id, channel);

    logger.info('Channel updated', {
      channelId: id,
      updates
    });

    return channel;
  }

  public static async deleteChannel(id: string): Promise<void> {
    const channel = this.channels.get(id);
    if (!channel) {
      throw new Error(`Channel with id ${id} not found`);
    }

    // Remove all subscriptions to this channel
    if (this.channelSubscriptions.has(id)) {
      this.channelSubscriptions.get(id)?.forEach(userId => {
        this.unsubscribeFromChannel(userId, id);
      });
    }

    this.channels.delete(id);

    logger.info('Channel deleted', {
      channelId: id
    });
  }

  public static async subscribeToChannel(userId: string, channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel with id ${channelId} not found`);
    }

    const room = this.rooms.get(channel.roomId);
    if (!room) {
      throw new Error(`Room for channel ${channelId} not found`);
    }

    // Check if user is in the room
    if (!room.members.has(userId)) {
      throw new Error(`User ${userId} is not a member of room ${channel.roomId}`);
    }

    // Check if channel is public or user has permission
    if (!channel.isPublic) {
      // In a real implementation, you would check permissions here
      throw new Error(`User ${userId} does not have permission to subscribe to channel ${channelId}`);
    }

    if (!this.channelSubscriptions.has(channelId)) {
      this.channelSubscriptions.set(channelId, new Set());
    }

    this.channelSubscriptions.get(channelId)?.add(userId);

    logger.info('User subscribed to channel', {
      userId,
      channelId
    });

    // Notify the user
    RealTimeServer.getInstance().sendToUser(userId, {
      type: 'channel_subscribed',
      channelId,
      channelName: channel.name
    });
  }

  public static async unsubscribeFromChannel(userId: string, channelId: string): Promise<void> {
    if (!this.channelSubscriptions.has(channelId)) {
      return;
    }

    this.channelSubscriptions.get(channelId)?.delete(userId);

    logger.info('User unsubscribed from channel', {
      userId,
      channelId
    });

    // Notify the user
    RealTimeServer.getInstance().sendToUser(userId, {
      type: 'channel_unsubscribed',
      channelId
    });
  }

  public static async broadcastToChannel(
    channelId: string,
    message: any,
    senderId?: string
  ): Promise<void> {
    if (!this.channelSubscriptions.has(channelId)) {
      return;
    }

    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel with id ${channelId} not found`);
    }

    const subscribers = this.channelSubscriptions.get(channelId);
    if (!subscribers) return;

    const broadcastMessage = {
      type: 'channel_message',
      channelId,
      channelName: channel.name,
      data: message,
      timestamp: Date.now(),
      senderId
    };

    subscribers.forEach(userId => {
      RealTimeServer.getInstance().sendToUser(userId, broadcastMessage);
    });

    logger.debug('Message broadcast to channel', {
      channelId,
      subscriberCount: subscribers.size
    });
  }

  public static async broadcastToRoom(
    roomId: string,
    message: any,
    senderId?: string
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room with id ${roomId} not found`);
    }

    const broadcastMessage = {
      type: 'room_message',
      roomId,
      roomName: room.name,
      data: message,
      timestamp: Date.now(),
      senderId
    };

    room.members.forEach(userId => {
      RealTimeServer.getInstance().sendToUser(userId, broadcastMessage);
    });

    logger.debug('Message broadcast to room', {
      roomId,
      memberCount: room.members.size
    });
  }

  public static getUserRooms(userId: string): Room[] {
    const roomIds = this.userRooms.get(userId) || new Set();
    return Array.from(roomIds).map(roomId => this.rooms.get(roomId)).filter(Boolean) as Room[];
  }

  public static getRoomChannels(roomId: string): Channel[] {
    return Array.from(this.channels.values()).filter(channel => channel.roomId === roomId);
  }

  public static getChannelSubscribers(channelId: string): string[] {
    return Array.from(this.channelSubscriptions.get(channelId) || []);
  }

  public static getRoomMembers(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.members) : [];
  }

  public static async cleanupInactiveUsers(): Promise<void> {
    const server = RealTimeServer.getInstance();
    const activeConnections = server.getConnectionCount();

    // Get all active user IDs from WebSocket connections
    const activeUserIds = new Set<string>();
    Array.from(this.userRooms.keys()).forEach(userId => {
      const connections = server.getConnectionsByUser(userId);
      if (connections.length > 0) {
        activeUserIds.add(userId);
      }
    });

    // Remove inactive users from rooms
    Array.from(this.userRooms.keys()).forEach(userId => {
      if (!activeUserIds.has(userId)) {
        this.userRooms.get(userId)?.forEach(roomId => {
          this.removeUserFromRoom(userId, roomId);
        });
        this.userRooms.delete(userId);
      }
    });

    logger.info('Cleaned up inactive users', {
      activeUsers: activeUserIds.size,
      inactiveUsers: Array.from(this.userRooms.keys()).length - activeUserIds.size
    });
  }
}

// Example usage for inventory system
export class InventoryRoomManager {
  private static readonly INVENTORY_ROOM_ID = 'inventory_global';
  private static readonly LOCATION_PREFIX = 'location_';

  public static async initialize(): Promise<void> {
    try {
      // Create global inventory room
      await RoomManager.createRoom(
        this.INVENTORY_ROOM_ID,
        'Global Inventory',
        'All inventory-related updates and discussions',
        'system'
      );

      // Create channels in the global room
      await RoomManager.createChannel(
        'inventory-updates',
        'Inventory Updates',
        'Real-time updates to inventory quantities',
        this.INVENTORY_ROOM_ID,
        'system',
        true
      );

      await RoomManager.createChannel(
        'low-stock-alerts',
        'Low Stock Alerts',
        'Notifications about low stock levels',
        this.INVENTORY_ROOM_ID,
        'system',
        true
      );

      await RoomManager.createChannel(
        'order-updates',
        'Order Updates',
        'Status updates for inventory orders',
        this.INVENTORY_ROOM_ID,
        'system',
        true
      );

      logger.info('Inventory room and channels initialized');
    } catch (err) {
      logger.error('Failed to initialize inventory rooms', { error: err });
    }
  }

  public static async createLocationRoom(locationId: string, locationName: string): Promise<void> {
    const roomId = `${this.LOCATION_PREFIX}${locationId}`;

    try {
      await RoomManager.createRoom(
        roomId,
        `${locationName} Inventory`,
        `Inventory updates for ${locationName}`,
        'system',
        { locationId }
      );

      // Add location-specific channels
      await RoomManager.createChannel(
        `${roomId}_updates`,
        'Inventory Updates',
        `Real-time updates for ${locationName}`,
        roomId,
        'system',
        true,
        { locationId }
      );

      await RoomManager.createChannel(
        `${roomId}_alerts`,
        'Alerts',
        `Alerts for ${locationName}`,
        roomId,
        'system',
        true,
        { locationId }
      );

      logger.info('Location room created', { locationId, roomId });
    } catch (err) {
      logger.error('Failed to create location room', {
        error: err,
        locationId
      });
    }
  }

  public static async addUserToLocation(userId: string, locationId: string): Promise<void> {
    const roomId = `${this.LOCATION_PREFIX}${locationId}`;

    try {
      await RoomManager.addUserToRoom(userId, roomId);
      await RoomManager.addUserToRoom(userId, this.INVENTORY_ROOM_ID);

      // Subscribe user to location-specific channels
      await RoomManager.subscribeToChannel(userId, `${roomId}_updates`);
      await RoomManager.subscribeToChannel(userId, `${roomId}_alerts`);

      logger.info('User added to location rooms', {
        userId,
        locationId
      });
    } catch (err) {
      logger.error('Failed to add user to location rooms', {
        error: err,
        userId,
        locationId
      });
    }
  }

  public static async broadcastInventoryUpdate(
    locationId: string,
    partId: string,
    quantityChange: number,
    metadata: any = {}
  ): Promise<void> {
    const roomId = `${this.LOCATION_PREFIX}${locationId}`;
    const globalMessage = {
      type: 'inventory_update',
      locationId,
      partId,
      quantityChange,
      timestamp: Date.now(),
      ...metadata
    };

    try {
      // Broadcast to location-specific channel
      await RoomManager.broadcastToChannel(
        `${roomId}_updates`,
        globalMessage
      );

      // Broadcast to global inventory updates channel
      await RoomManager.broadcastToChannel(
        'inventory-updates',
        globalMessage
      );

      logger.debug('Inventory update broadcast', {
        locationId,
        partId,
        quantityChange
      });
    } catch (err) {
      logger.error('Failed to broadcast inventory update', {
        error: err,
        locationId,
        partId
      });
    }
  }

  public static async broadcastLowStockAlert(
    locationId: string,
    partId: string,
    quantity: number,
    threshold: number,
    metadata: any = {}
  ): Promise<void> {
    const roomId = `${this.LOCATION_PREFIX}${locationId}`;
    const alertMessage = {
      type: 'low_stock_alert',
      locationId,
      partId,
      quantity,
      threshold,
      timestamp: Date.now(),
      ...metadata
    };

    try {
      // Broadcast to location-specific alerts channel
      await RoomManager.broadcastToChannel(
        `${roomId}_alerts`,
        alertMessage
      );

      // Broadcast to global low stock alerts channel
      await RoomManager.broadcastToChannel(
        'low-stock-alerts',
        alertMessage
      );

      logger.info('Low stock alert broadcast', {
        locationId,
        partId,
        quantity,
        threshold
      });
    } catch (err) {
      logger.error('Failed to broadcast low stock alert', {
        error: err,
        locationId,
        partId
      });
    }
  }
}
```

### Reconnection Logic (30 lines)

```typescript
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';

type ReconnectionOptions = {
  maxAttempts?: number;
  baseInterval?: number;
  maxInterval?: number;
  backoffFactor?: number;
  onReconnect?: (attempt: number) => void;
  onMaxAttemptsReached?: () => void;
};

export class ReconnectionManager {
  private readonly options: Required<ReconnectionOptions>;
  private attempts = 0;
  private timer: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private lastAttemptTime = 0;

  constructor(options: ReconnectionOptions = {}) {
    this.options = {
      maxAttempts: 10,
      baseInterval: 1000, // 1 second
      maxInterval: 30000, // 30 seconds
      backoffFactor: 2,
      onReconnect: () => {},
      onMaxAttemptsReached: () => {},
      ...options
    };
  }

  public start(): void {
    if (this.isReconnecting) {
      logger.warn('Reconnection already in progress');
      return;
    }

    this.isReconnecting = true;
    this.attempts = 0;
    this.scheduleReconnect();
  }

  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isReconnecting = false;
    this.attempts = 0;
  }

  private scheduleReconnect(): void {
    if (this.attempts >= this.options.maxAttempts) {
      this.isReconnecting = false;
      this.options.onMaxAttemptsReached();
      logger.warn('Max reconnection attempts reached');
      return;
    }

    const delay = this.calculateDelay();
    this.attempts++;
    this.lastAttemptTime = Date.now();

    this.timer = setTimeout(() => {
      this.options.onReconnect(this.attempts);
      this.scheduleReconnect();
    }, delay);

    logger.info('Scheduled reconnection attempt', {
      attempt: this.attempts,
      delay,
      maxAttempts: this.options.maxAttempts
    });
  }

  private calculateDelay(): number {
    // Exponential backoff with jitter
    const exponentialDelay = this.options.baseInterval * Math.pow(this.options.backoffFactor, this.attempts - 1);
    const jitter = exponentialDelay * 0.2 * Math.random(); // 20% jitter
    const delay = Math.min(exponentialDelay + jitter, this.options.maxInterval);

    return delay;
  }

  public getStatus(): {
    isReconnecting: boolean;
    attempts: number;
    nextAttemptIn: number;
    lastAttemptTime: number;
  } {
    const now = Date.now();
    const nextAttemptIn = this.timer
      ? Math.max(0, this.lastAttemptTime + this.calculateDelay() - now)
      : 0;

    return {
      isReconnecting: this.isReconnecting,
      attempts: this.attempts,
      nextAttemptIn,
      lastAttemptTime: this.lastAttemptTime
    };
  }

  public reset(): void {
    this.stop();
    this.attempts = 0;
    this.lastAttemptTime = 0;
  }
}

// Example usage in WebSocket client
export class ResilientWebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectionManager: ReconnectionManager;
  private readonly url: string;
  private readonly token: string;
  private connectionStartTime = 0;
  private connectionId: string | null = null;

  constructor(url: string, token: string, options: ReconnectionOptions = {}) {
    this.url = url;
    this.token = token;
    this.reconnectionManager = new ReconnectionManager({
      maxAttempts: 15,
      baseInterval: 1000,
      maxInterval: 60000,
      onReconnect: (attempt) => this.handleReconnect(attempt),
      onMaxAttemptsReached: () => this.handleMaxAttemptsReached(),
      ...options
    });
  }

  public connect(): void {
    this.connectionStartTime = Date.now();
    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    try {
      this.socket = new WebSocket(this.url, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      this.setupEventHandlers();
    } catch (err) {
      logger.error('Failed to create WebSocket', { error: err });
      this.reconnectionManager.start();
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.reconnectionManager.stop();
      this.connectionId = this.generateConnectionId();

      logger.info('WebSocket connected', {
        connectionId: this.connectionId,
        duration: Date.now() - this.connectionStartTime
      });
    };

    this.socket.onclose = (event) => {
      logger.info('WebSocket disconnected', {
        connectionId: this.connectionId,
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });

      if (event.code !== 1000) { // 1000 is normal closure
        this.reconnectionManager.start();
      }
    };

    this.socket.onerror = (event) => {
      logger.error('WebSocket error', {
        connectionId: this.connectionId,
        error: event.error || 'Unknown error'
      });
    };
  }

  private handleReconnect(attempt: number): void {
    logger.info('Attempting to reconnect', {
      attempt,
      connectionId: this.connectionId
    });

    this.connectWebSocket();
  }

  private handleMaxAttemptsReached(): void {
    logger.error('Max reconnection attempts reached', {
      connectionId: this.connectionId
    });

    // Notify application that connection is permanently lost
    // In a real application, you might want to show a user notification
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  public disconnect(): void {
    this.reconnectionManager.stop();

    if (this.socket) {
      this.socket.close(1000, 'Client initiated disconnect');
      this.socket = null;
    }
  }

  public getStatus(): {
    connected: boolean;
    connecting: boolean;
    reconnectionStatus: ReturnType<ReconnectionManager['getStatus']>;
    connectionId: string | null;
    connectionDuration: number;
  } {
    const reconnectionStatus = this.reconnectionManager.getStatus();

    return {
      connected: this.socket?.readyState === WebSocket.OPEN,
      connecting: reconnectionStatus.isReconnecting,
      reconnectionStatus,
      connectionId: this.connectionId,
      connectionDuration: this.connectionId
        ? Date.now() - this.connectionStartTime
        : 0
    };
  }
}
```

---

## AI/ML Capabilities (300 lines)

### Predictive Model Training (90 lines)

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import joblib
import psycopg2
from psycopg2 import sql
import boto3
from io import BytesIO
import logging
import warnings
from typing import Tuple, Dict, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
warnings.filterwarnings('ignore')

class InventoryDemandPredictor:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.feature_columns = None
        self.target_column = 'quantity_used'
        self.model_version = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.s3_client = boto3.client('s3')
        self.bucket_name = 'inventory-ml-models'
        self.db_config = {
            'dbname': 'inventory_db',
            'user': 'ml_user',
            'password': 'secure_password',
            'host': 'inventory-db.example.com',
            'port': '5432'
        }

    def fetch_training_data(self, days: int = 365) -> pd.DataFrame:
        """Fetch historical inventory data from the database."""
        logger.info(f"Fetching training data for last {days} days")

        query = sql.SQL("""
            WITH daily_usage AS (
                SELECT
                    part_id,
                    location_id,
                    DATE(created_at) as date,
                    SUM(quantity) as quantity_used,
                    COUNT(*) as transaction_count
                FROM transactions
                WHERE type = 'ISSUE'
                    AND created_at >= %s
                GROUP BY part_id, location_id, DATE(created_at)
            ),
            part_features AS (
                SELECT
                    p.id as part_id,
                    p.category_id,
                    p.supplier_id,
                    p.lead_time,
                    p.price,
                    p.reorder_threshold,
                    p.critical_threshold,
                    c.name as category_name,
                    c.parent_category_id,
                    s.name as supplier_name,
                    s.lead_time as supplier_lead_time,
                    s.reliability_score
                FROM parts p
                JOIN categories c ON p.category_id = c.id
                JOIN suppliers s ON p.supplier_id = s.id
            ),
            location_features AS (
                SELECT
                    id as location_id,
                    region,
                    country,
                    is_warehouse,
                    is_service_center,
                    climate_zone
                FROM locations
            ),
            date_features AS (
                SELECT
                    date,
                    EXTRACT(DOW FROM date) as day_of_week,
                    EXTRACT(DOY FROM date) as day_of_year,
                    EXTRACT(WEEK FROM date) as week_of_year,
                    EXTRACT(MONTH FROM date) as month,
                    EXTRACT(QUARTER FROM date) as quarter,
                    is_weekend,
                    is_holiday,
                    holiday_name,
                    temperature_avg,
                    temperature_min,
                    temperature_max,
                    precipitation
                FROM date_dimension
                WHERE date >= %s
            )
            SELECT
                du.part_id,
                du.location_id,
                du.date,
                du.quantity_used,
                du.transaction_count,
                pf.category_id,
                pf.category_name,
                pf.parent_category_id,
                pf.supplier_id,
                pf.supplier_name,
                pf.lead_time as part_lead_time,
                pf.supplier_lead_time,
                pf.price,
                pf.reorder_threshold,
                pf.critical_threshold,
                pf.reliability_score,
                lf.region,
                lf.country,
                lf.is_warehouse,
                lf.is_service_center,
                lf.climate_zone,
                df.day_of_week,
                df.day_of_year,
                df.week_of_year,
                df.month,
                df.quarter,
                df.is_weekend,
                df.is_holiday,
                df.holiday_name,
                df.temperature_avg,
                df.temperature_min,
                df.temperature_max,
                df.precipitation,
                -- Lag features
                LAG(du.quantity_used, 1) OVER (PARTITION BY du.part_id, du.location_id ORDER BY du.date) as lag_1,
                LAG(du.quantity_used, 7) OVER (PARTITION BY du.part_id, du.location_id ORDER BY du.date) as lag_7,
                LAG(du.quantity_used, 30) OVER (PARTITION BY du.part_id, du.location_id ORDER BY du.date) as lag_30,
                -- Rolling averages
                AVG(du.quantity_used) OVER (
                    PARTITION BY du.part_id, du.location_id
                    ORDER BY du.date
                    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
                ) as rolling_avg_7,
                AVG(du.quantity_used) OVER (
                    PARTITION BY du.part_id, du.location_id
                    ORDER BY du.date
                    ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
                ) as rolling_avg_30,
                -- Rolling std dev
                STDDEV(du.quantity_used) OVER (
                    PARTITION BY du.part_id, du.location_id
                    ORDER BY du.date
                    ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
                ) as rolling_std_30
            FROM daily_usage du
            JOIN part_features pf ON du.part_id = pf.part_id
            JOIN location_features lf ON du.location_id = lf.location_id
            JOIN date_features df ON du.date = df.date
            ORDER BY du.date
        """)

        start_date = datetime.now() - timedelta(days=days)

        try:
            with psycopg2.connect(**self.db_config) as conn:
                df = pd.read_sql_query(
                    query,
                    conn,
                    params=(start_date, start_date),
                    parse_dates=['date']
                )

            logger.info(f"Fetched {len(df)} records for training")
            return df
        except Exception as e:
            logger.error(f"Error fetching training data: {str(e)}")
            raise

    def preprocess_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Preprocess the data for training."""
        logger.info("Preprocessing data")

        # Drop rows with missing target values
        df = df.dropna(subset=[self.target_column])

        # Create additional features
        df['day_of_month'] = df['date'].dt.day
        df['is_month_start'] = df['day_of_month'].isin([1, 2, 3]).astype(int)
        df['is_month_end'] = df['day_of_month'].isin([28, 29, 30, 31]).astype(int)
        df['is_quarter_start'] = df['month'].isin([1, 4, 7, 10]).astype(int)
        df['is_quarter_end'] = df['month'].isin([3, 6, 9, 12]).astype(int)

        # Calculate days since last holiday
        df['days_since_holiday'] = df.groupby(['location_id'])['is_holiday'].apply(
            lambda x: x.shift().cumsum().fillna(0)
        )

        # Calculate price per unit (handling potential division by zero)
        df['price_per_unit'] = df['price'] / df['quantity_used'].replace(0, np.nan)
        df['price_per_unit'] = df['price_per_unit'].fillna(0)

        # Define features and target
        features = df.drop(columns=[
            self.target_column, 'date', 'part_id', 'location_id',
            'category_name', 'supplier_name', 'holiday_name'
        ])
        target = df[self.target_column]

        # Identify categorical and numerical columns
        categorical_cols = features.select_dtypes(include=['object', 'category']).columns.tolist()
        numerical_cols = features.select_dtypes(include=['int64', 'float64']).columns.tolist()

        # Create preprocessing pipeline
        numerical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numerical_transformer, numerical_cols),
                ('cat', categorical_transformer, categorical_cols)
            ])

        # Fit and transform the data
        features_processed = self.preprocessor.fit_transform(features)

        # Get feature names after one-hot encoding
        feature_names = numerical_cols.copy()
        if len(categorical_cols) > 0:
            ohe_feature_names = self.preprocessor.named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(categorical_cols)
            feature_names.extend(ohe_feature_names)

        # Convert to DataFrame
        features_processed = pd.DataFrame(features_processed, columns=feature_names)

        # Store feature columns for later use
        self.feature_columns = feature_names

        logger.info(f"Preprocessing complete. Features: {len(feature_names)}")
        return features_processed, target

    def train_model(self, X: pd.DataFrame, y: pd.Series) -> None:
        """Train the predictive model."""
        logger.info("Training model")

        # Define the model
        base_model = GradientBoostingRegressor(
            random_state=42,
            n_estimators=200,
            learning_rate=0.05,
            max_depth=6,
            min_samples_split=10,
            min_samples_leaf=4,
            max_features='sqrt'
        )

        # Define parameter grid for tuning
        param_grid = {
            'n_estimators': [100, 200],
            'learning_rate': [0.01, 0.05, 0.1],
            'max_depth': [4, 6, 8],
            'min_samples_split': [5, 10],
            'min_samples_leaf': [2, 4]
        }

        # Use time series cross-validation
        tscv = TimeSeriesSplit(n_splits=5)

        # Create grid search
        grid_search = GridSearchCV(
            estimator=base_model,
            param_grid=param_grid,
            cv=tscv,
            scoring='neg_mean_absolute_error',
            n_jobs=-1,
            verbose=2
        )

        # Fit the model
        grid_search.fit(X, y)

        # Get the best model
        self.model = grid_search.best_estimator_

        # Log best parameters
        logger.info(f"Best parameters: {grid_search.best_params_}")
        logger.info(f"Best MAE: {-grid_search.best_score_:.2f}")

        # Evaluate on training data
        y_pred = self.model.predict(X)
        self.log_metrics(y, y_pred, "Training")

    def log_metrics(self, y_true: pd.Series, y_pred: np.ndarray, dataset: str) -> None:
        """Log evaluation metrics."""
        mae = mean_absolute_error(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_true, y_pred)

        logger.info(f"{dataset} Metrics:")
        logger.info(f"  MAE: {mae:.2f}")
        logger.info(f"  MSE: {mse:.2f}")
        logger.info(f"  RMSE: {rmse:.2f}")
        logger.info(f"  R2: {r2:.2f}")

    def save_model(self) -> None:
        """Save the trained model and preprocessor to S3."""
        if not self.model or not self.preprocessor:
            raise ValueError("Model and preprocessor must be trained before saving")

        logger.info("Saving model to S3")

        # Create a dictionary with all components
        model_data = {
            'model': self.model,
            'preprocessor': self.preprocessor,
            'feature_columns': self.feature_columns,
            'target_column': self.target_column,
            'model_version': self.model_version,
            'training_date': datetime.now().isoformat(),
            'metrics': {
                'training_mae': mean_absolute_error(
                    self.model.predict(self.X_train),
                    self.y_train
                )
            }
        }

        # Serialize the model
        buffer = BytesIO()
        joblib.dump(model_data, buffer)
        buffer.seek(0)

        # Upload to S3
        s3_key = f"models/inventory_demand/{self.model_version}.joblib"
        self.s3_client.upload_fileobj(
            buffer,
            self.bucket_name,
            s3_key
        )

        logger.info(f"Model saved to s3://{self.bucket_name}/{s3_key}")

        # Update the model registry
        self.update_model_registry()

    def update_model_registry(self) -> None:
        """Update the model registry in the database."""
        logger.info("Updating model registry")

        query = sql.SQL("""
            INSERT INTO ml_model_registry (
                model_name,
                model_version,
                model_type,
                training_date,
                s3_path,
                performance_metrics,
                status,
                features
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (model_name, model_version)
            DO UPDATE SET
                training_date = EXCLUDED.training_date,
                s3_path = EXCLUDED.s3_path,
                performance_metrics = EXCLUDED.performance_metrics,
                status = EXCLUDED.status,
                features = EXCLUDED.features
        """)

        metrics = {
            'training_mae': mean_absolute_error(
                self.model.predict(self.X_train),
                self.y_train
            )
        }

        try:
            with psycopg2.connect(**self.db_config) as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (
                        'inventory_demand_predictor',
                        self.model_version,
                        'GradientBoostingRegressor',
                        datetime.now(),
                        f"s3://{self.bucket_name}/models/inventory_demand/{self.model_version}.joblib",
                        json.dumps(metrics),
                        'active',
                        json.dumps(self.feature_columns)
                    ))
                    conn.commit()
            logger.info("Model registry updated successfully")
        except Exception as e:
            logger.error(f"Error updating model registry: {str(e)}")
            raise

    def train_and_save(self, days: int = 365) -> None:
        """Complete training pipeline."""
        logger.info("Starting model training pipeline")

        try:
            # Step 1: Fetch data
            df = self.fetch_training_data(days)

            # Step 2: Preprocess data
            X, y = self.preprocess_data(df)
            self.X_train = X
            self.y_train = y

            # Step 3: Train model
            self.train_model(X, y)

            # Step 4: Save model
            self.save_model()

            logger.info("Model training pipeline completed successfully")
        except Exception as e:
            logger.error(f"Error in training pipeline: {str(e)}")
            raise

# Example usage
if __name__ == "__main__":
    predictor = InventoryDemandPredictor()

    # Train model with 2 years of data
    predictor.train_and_save(days=730)
```

### Real-Time Inference API (70 lines)

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import boto3
from io import BytesIO
import psycopg2
from psycopg2 import sql
import logging
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Inventory Demand Prediction API",
    description="API for real-time inventory demand predictions",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Configuration
MODEL_BUCKET = os.getenv('MODEL_BUCKET', 'inventory-ml-models')
DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'inventory_db'),
    'user': os.getenv('DB_USER', 'ml_user'),
    'password': os.getenv('DB_PASSWORD', 'secure_password'),
    'host': os.getenv('DB_HOST', 'inventory-db.example.com'),
    'port': os.getenv('DB_PORT', '5432')
}

class PredictionRequest(BaseModel):
    part_id: str
    location_id: str
    date: str  # ISO format date
    horizon: int = 7  # Number of days to predict
    include_features: bool = False

class PredictionResponse(BaseModel):
    part_id: str
    location_id: str
    predictions: List[Dict[str, float]]
    model_version: str
    timestamp: str
    features: Optional[Dict] = None

class ModelLoader:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.feature_columns = None
        self.target_column = None
        self.model_version = None
        self.last_loaded = None
        self.s3_client = boto3.client('s3')

    async def load_latest_model(self):
        """Load the latest model from S3."""
        try:
            # Get the latest model from the registry
            latest_model = self.get_latest_model_version()

            if not latest_model:
                raise ValueError("No models found in registry")

            if self.model_version == latest_model['model_version'] and self.model:
                logger.info("Model is already up to date")
                return

            # Download the model from S3
            response = self.s3_client.get_object(
                Bucket=MODEL_BUCKET,
                Key=latest_model['s3_path'].replace(f"s3://{MODEL_BUCKET}/", "")
            )

            model_data = joblib.load(BytesIO(response['Body'].read()))

            self.model = model_data['model']
            self.preprocessor = model_data['preprocessor']
            self.feature_columns = model_data['feature_columns']
            self.target_column = model_data['target_column']
            self.model_version = model_data['model_version']
            self.last_loaded = datetime.now()

            logger.info(f"Loaded model version {self.model_version}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

    def get_latest_model_version(self) -> Optional[Dict]:
        """Get the latest model version from the database."""
        query = sql.SQL("""
            SELECT model_version, s3_path, training_date
            FROM ml_model_registry
            WHERE model_name = 'inventory_demand_predictor'
                AND status = 'active'
            ORDER BY training_date DESC
            LIMIT 1
        """)

        try:
            with psycopg2.connect(**DB_CONFIG) as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query)
                    result = cursor.fetchone()
                    if result:
                        return {
                            'model_version': result[0],
                            's3_path': result[1],
                            'training_date': result[2]
                        }
                    return None
        except Exception as e:
            logger.error(f"Error fetching latest model version: {str(e)}")
            raise

    def create_features(self, part_id: str, location_id: str, date: datetime) -> pd.DataFrame:
        """Create feature vector for prediction."""
        try:
            # Get part features
            part_features = self.get_part_features(part_id)

            # Get location features
            location_features = self.get_location_features(location_id)

            # Get date features
            date_features = self.get_date_features(date)

            # Combine features
            features = {
                **part_features,
                **location_features,
                **date_features,
                'part_id': part_id,
                'location_id': location_id
            }

            # Create DataFrame
            df = pd.DataFrame([features])

            # Add lag features (we'll use zeros for prediction since we don't have historical data)
            for lag in [1, 7, 30]:
                df[f'lag_{lag}'] = 0
                df[f'rolling_avg_{lag}'] = 0
                if lag == 30:
                    df[f'rolling_std_{lag}'] = 0

            return df
        except Exception as e:
            logger.error(f"Error creating features: {str(e)}")
            raise

    def get_part_features(self, part_id: str) -> Dict:
        """Get features for a specific part."""
        query = sql.SQL("""
            SELECT
                p.category_id,
                p.supplier_id,
                p.lead_time,
                p.price,
                p.reorder_threshold,
                p.critical_threshold,
                c.name as category_name,
                c.parent_category_id,
                s.name as supplier_name,
                s.lead_time as supplier_lead_time,
                s.reliability_score
            FROM parts p
            JOIN categories c ON p.category_id = c.id
            JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = %s
        """)

        try:
            with psycopg2.connect(**DB_CONFIG) as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (part_id,))
                    result = cursor.fetchone()

                    if not result:
                        raise ValueError(f"Part {part_id} not found")

                    return {
                        'category_id': result[0],
                        'supplier_id': result[1],
                        'part_lead_time': result[2],
                        'price': result[3],
                        'reorder_threshold': result[4],
                        'critical_threshold': result[5],
                        'category_name': result[6],
                        'parent_category_id': result[7],
                        'supplier_name': result[8],
                        'supplier_lead_time': result[9],
                        'reliability_score': result[10]
                    }
        except Exception as e:
            logger.error(f"Error fetching part features: {str(e)}")
            raise

    def get_location_features(self, location_id: str) -> Dict:
        """Get features for a specific location."""
        query = sql.SQL("""
            SELECT
                region,
                country,
                is_warehouse,
                is_service_center,
                climate_zone
            FROM locations
            WHERE id = %s
        """)

        try:
            with psycopg2.connect(**DB_CONFIG) as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (location_id,))
                    result = cursor.fetchone()

                    if not result:
                        raise ValueError(f"Location {location_id} not found")

                    return {
                        'region': result[0],
                        'country': result[1],
                        'is_warehouse': result[2],
                        'is_service_center': result[3],
                        'climate_zone': result[4]
                    }
        except Exception as e:
            logger.error(f"Error fetching location features: {str(e)}")
            raise

    def get_date_features(self, date: datetime) -> Dict:
        """Get features for a specific date."""
        query = sql.SQL("""
            SELECT
                EXTRACT(DOW FROM date) as day_of_week,
                EXTRACT(DOY FROM date) as day_of_year,
                EXTRACT(WEEK FROM date) as week_of_year,
                EXTRACT(MONTH FROM date) as month,
                EXTRACT(QUARTER FROM date) as quarter,
                is_weekend,
                is_holiday,
                holiday_name,
                temperature_avg,
                temperature_min,
                temperature_max,
                precipitation
            FROM date_dimension
            WHERE date = %s
        """)

        try:
            with psycopg2.connect(**DB_CONFIG) as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (date.date(),))
                    result = cursor.fetchone()

                    if not result:
                        # If date not found, use default values
                        return {
                            'day_of_week': date.weekday(),
                            'day_of_year': date.timetuple().tm_yday,
                            'week_of_year': date.isocalendar()[1],
                            'month': date.month,
                            'quarter': (date.month - 1) // 3 + 1,
                            'is_weekend': int(date.weekday() >= 5),
                            'is_holiday': 0,
                            'holiday_name': None,
                            'temperature_avg': 0,
                            'temperature_min': 0,
                            'temperature_max': 0,
                            'precipitation': 0
                        }

                    return {
                        'day_of_week': result[0],
                        'day_of_year': result[1],
                        'week_of_year': result[2],
                        'month': result[3],
                        'quarter': result[4],
                        'is_weekend': result[5],
                        'is_holiday': result[6],
                        'holiday_name': result[7],
                        'temperature_avg': result[8],
                        'temperature_min': result[9],
                        'temperature_max': result[10],
                        'precipitation': result[11]
                    }
        except Exception as e:
            logger.error(f"Error fetching date features: {str(e)}")
            raise

model_loader = ModelLoader()

@app.on_event("startup")
async def startup_event():
    """Load the model when the application starts."""
    try:
        await model_loader.load_latest_model()
    except Exception as e:
        logger.error(f"Failed to load model on startup: {str(e)}")
        raise

async def get_current_model():
    """Dependency to get the current model."""
    if not model_loader.model:
        await model_loader.load_latest_model()
    return model_loader

@app.post("/predict", response_model=PredictionResponse)
async def predict_demand(
    request: PredictionRequest,
    model_data: ModelLoader = Depends(get_current_model),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Predict inventory demand for a part at a location."""
    try:
        # Verify token (in a real app, you would validate the token)
        token = credentials.credentials
        logger.info(f"Prediction request for part {request.part_id} at {request.location_id}")

        # Parse the date
        try:
            date = datetime.fromisoformat(request.date)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Use ISO format (YYYY-MM-DD)"
            )

        # Generate predictions for each day in the horizon
        predictions = []
        for day in range(request.horizon):
            prediction_date = date + timedelta(days=day)
            features = model_data.create_features(request.part_id, request.location_id, prediction_date)

            # Preprocess features
            features_processed = model_data.preprocessor.transform(features)

            # Ensure feature columns match
            features_df = pd.DataFrame(features_processed, columns=model_data.feature_columns)

            # Make prediction
            prediction = model_data.model.predict(features_df)[0]

            # Ensure prediction is non-negative
            prediction = max(0, prediction)

            # Get additional prediction info
            prediction_info = {
                'date': prediction_date.isoformat(),
                'predicted_quantity': float(prediction),
                'lower_bound': float(prediction * 0.9),  # 10% lower bound
                'upper_bound': float(prediction * 1.1)   # 10% upper bound
            }

            predictions.append(prediction_info)

        # Prepare response
        response = {
            'part_id': request.part_id,
            'location_id': request.location_id,
            'predictions': predictions,
            'model_version': model_data.model_version,
            'timestamp': datetime.now().isoformat()
        }

        if request.include_features:
            # Get the features for the first prediction date
            features = model_data.create_features(request.part_id, request.location_id, date)
            response['features'] = features.to_dict(orient='records')[0]

        return response
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error making prediction")

@app.get("/model-info")
async def get_model_info(model_data: ModelLoader = Depends(get_current_model)):
    """Get information about the current model."""
    try:
        return {
            'model_version': model_data.model_version,
            'last_loaded': model_data.last_loaded.isoformat() if model_data.last_loaded else None,
            'feature_count': len(model_data.feature_columns),
            'target_column': model_data.target_column,
            'model_type': model_data.model.__class__.__name__
        }
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting model info")

@app.post("/reload-model")
async def reload_model(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Force reload of the latest model."""
    try:
        # Verify token (in a real app, you would validate the token)
        token = credentials.credentials

        await model_loader.load_latest_model()
        return {
            'status': 'success',
            'model_version': model_loader.model_version,
            'message': 'Model reloaded successfully'
        }
    except Exception as e:
        logger.error(f"Error reloading model: {str(e)}")
        raise HTTPException(status_code=500, detail="Error reloading model")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check database connection
        with psycopg2.connect(**DB_CONFIG):
            pass

        # Check model is loaded
        if not model_loader.model:
            raise ValueError("Model not loaded")

        return {
            'status': 'healthy',
            'model_loaded': model_loader.model is not None,
            'model_version': model_loader.model_version,
            'database': 'connected'
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check failed")
```

### Feature Engineering Pipeline (70 lines)

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple, Dict, List, Optional
import psycopg2
from psycopg2 import sql
import logging
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer
from sklearn.compose import ColumnTransformer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class InventoryFeatureEngineer:
    def __init__(self, db_config: Dict):
        self.db_config = db_config
        self.feature_pipeline = self.build_feature_pipeline()

    def build_feature_pipeline(self) -> Pipeline:
        """Build the feature engineering pipeline."""
        return Pipeline([
            ('base_features', FunctionTransformer(self.create_base_features)),
            ('temporal_features', FunctionTransformer(self.create_temporal_features)),
            ('lag_features', FunctionTransformer(self.create_lag_features)),
            ('rolling_features', FunctionTransformer(self.create_rolling_features)),
            ('interaction_features', FunctionTransformer(self.create_interaction_features)),
            ('categorical_features', FunctionTransformer(self.create_categorical_features)),
            ('final_cleanup', FunctionTransformer(self.final_cleanup))
        ])

    def create_base_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create base features from raw data."""
        logger.info("Creating base features")

        # Ensure we have the required columns
        required_columns = [
            'part_id', 'location_id', 'date', 'quantity_used', 'transaction_count',
            'category_id', 'supplier_id', 'lead_time', 'price', 'reorder_threshold',
            'critical_threshold', 'reliability_score', 'region', 'country',
            'is_warehouse', 'is_service_center', 'climate_zone', 'day_of_week',
            'day_of_year', 'week_of_year', 'month', 'quarter', 'is_weekend',
            'is_holiday', 'temperature_avg', 'precipitation'
        ]

        for col in required_columns:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")

        # Create additional base features
        df['day_of_month'] = df['date'].dt.day
        df['is_month_start'] = df['day_of_month'].isin([1, 2, 3]).astype(int)
        df['is_month_end'] = df['day_of_month'].isin([28, 29, 30, 31]).astype(int)
        df['is_quarter_start'] = df['month'].isin([1, 4, 7, 10]).astype(int)
        df['is_quarter_end'] = df['month'].isin([3, 6, 9, 12]).astype(int)

        # Days since last holiday
        df['days_since_holiday'] = df.groupby(['location_id'])['is_holiday'].apply(
            lambda x: x.shift().cumsum().fillna(0)
        )

        # Price per unit (handling potential division by zero)
        df['price_per_unit'] = df['price'] / df['quantity_used'].replace(0, np.nan)
        df['price_per_unit'] = df['price_per_unit'].fillna(0)

        # Inventory turnover ratio (simplified)
        df['inventory_turnover'] = df['quantity_used'] / (df['reorder_threshold'] + 1)

        return df

    def create_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create temporal features."""
        logger.info("Creating temporal features")

        # Cyclical encoding for day of week and month
        df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)

        # Seasonality features
        df['is_spring'] = df['month'].isin([3, 4, 5]).astype(int)
        df['is_summer'] = df['month'].isin([6, 7, 8]).astype(int)
        df['is_fall'] = df['month'].isin([9, 10, 11]).astype(int)
        df['is_winter'] = df['month'].isin([12, 1, 2]).astype(int)

        # Holiday flags
        df['is_major_holiday'] = df['is_holiday'] & df['holiday_name'].isin([
            'New Year\'s Day', 'Christmas Day', 'Thanksgiving Day',
            'Independence Day', 'Labor Day', 'Memorial Day'
        ]).astype(int)

        # Temperature features
        df['temp_range'] = df['temperature_max'] - df['temperature_min']
        df['temp_anomaly'] = df['temperature_avg'] - df.groupby(['location_id', 'month'])['temperature_avg'].transform('mean')

        return df

    def create_lag_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create lag features."""
        logger.info("Creating lag features")

        # Sort by part, location, and date
        df = df.sort_values(['part_id', 'location_id', 'date'])

        # Create lag features for different time periods
        for lag in [1, 7, 14, 30, 90]:
            df[f'lag_{lag}'] = df.groupby(['part_id', 'location_id'])['quantity_used'].shift(lag)

            # Fill NA values with 0 (assuming no usage)
            df[f'lag_{lag}'] = df[f'lag_{lag}'].fillna(0)

            # Create binary flag for whether there was usage
            df[f'has_lag_{lag}'] = (df[f'lag_{lag}'] > 0).astype(int)

        return df

    def create_rolling_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create rolling window features."""
        logger.info("Creating rolling features")

        # Sort by part, location, and date
        df = df.sort_values(['part_id', 'location_id', 'date'])

        # Create rolling statistics
        for window in [7, 14, 30, 90]:
            # Rolling mean
            df[f'rolling_mean_{window}'] = df.groupby(['part_id', 'location_id'])['quantity_used'].transform(
                lambda x: x.rolling(window, min_periods=1).mean()
            )

            # Rolling std
            df[f'rolling_std_{window}'] = df.groupby(['part_id', 'location_id'])['quantity_used'].transform(
                lambda x: x.rolling(window, min_periods=1).std()
            )

            # Rolling min
            df[f'rolling_min_{window}'] = df.groupby(['part_id', 'location_id'])['quantity_used'].transform(
                lambda x: x.rolling(window, min_periods=1).min()
            )

            # Rolling max
            df[f'rolling_max_{window}'] = df.groupby(['part_id', 'location_id'])['quantity_used'].transform(
                lambda x: x.rolling(window, min_periods=1).max()
            )

            # Rolling median
            df[f'rolling_median_{window}'] = df.groupby(['part_id', 'location_id'])['quantity_used'].transform(
                lambda x: x.rolling(window, min_periods=1).median()
            )

            # Rolling sum
            df[f'rolling_sum_{window}'] = df.groupby(['part_id', 'location_id'])['quantity_used'].transform(
                lambda x: x.rolling(window, min_periods=1).sum()
            )

        return df

    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features between different variables."""
        logger.info("Creating interaction features")

        # Price and lead time interaction
        df['price_lead_time'] = df['price'] * df['lead_time']

        # Category and region interaction
        df['category_region'] = df['category_id'].astype(str) + '_' + df['region']

        # Supplier reliability and lead time interaction
        df['reliability_lead_time'] = df['reliability_score'] * df['lead_time']

        # Temperature and season interaction
        df['temp_season'] = df['temperature_avg'] * df['is_summer']

        # Price and holiday interaction
        df['price_holiday'] = df['price'] * df['is_major_holiday']

        # Inventory turnover and season interaction
        df['turnover_season'] = df['inventory_turnover'] * df['is_summer']

        return df

    def create_categorical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create additional categorical features."""
        logger.info("Creating categorical features")

        # Create hierarchical category features
        df['category_level1'] = df['category_id'].apply(lambda x: x.split('_')[0] if isinstance(x, str) else 'unknown')

        # Create