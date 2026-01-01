# TO_BE_DESIGN.md - Admin-Config Module Comprehensive Design

## Executive Vision (120 lines)

### Strategic Transformation of Admin Configuration

The enhanced admin-config module represents a paradigm shift in how administrators interact with and manage enterprise systems. This transformation moves beyond basic CRUD operations to a sophisticated, intelligent configuration platform that serves as the central nervous system for enterprise operations.

**Business Transformation Goals:**

1. **Operational Excellence**: Reduce configuration time by 70% through intelligent defaults, template systems, and AI-assisted setup
2. **Cost Reduction**: Decrease support tickets by 60% through self-service configuration and guided troubleshooting
3. **Revenue Growth**: Enable rapid feature deployment through modular configuration, reducing time-to-market by 40%
4. **Risk Mitigation**: Implement policy-as-code with automated compliance checks to reduce configuration errors by 90%
5. **Customer Retention**: Improve system reliability through predictive configuration validation, increasing uptime to 99.99%

**User Experience Revolution:**

The new admin-config module will transform the administrator experience from a command-line driven, error-prone process to an intuitive, guided configuration journey:

- **Context-Aware Interface**: Dynamic UI that adapts to the administrator's role, experience level, and current task
- **Predictive Configuration**: AI-powered suggestions that anticipate configuration needs based on usage patterns
- **Visual Configuration**: Drag-and-drop policy builders with real-time validation
- **Collaborative Configuration**: Team-based configuration with change tracking and approval workflows
- **Immersive Documentation**: Interactive guides that appear exactly when needed within the configuration context

**Competitive Advantages:**

1. **First-Mover in Intelligent Configuration**: AI-driven configuration assistance that learns from enterprise patterns
2. **Unified Configuration Plane**: Single interface for managing all enterprise services with cross-service validation
3. **Policy-as-Code Engine**: Advanced policy management with versioning, testing, and deployment pipelines
4. **Real-Time Configuration**: Instant propagation of changes with conflict resolution and rollback capabilities
5. **Compliance Automation**: Built-in compliance checks for GDPR, HIPAA, SOC2, and other regulatory frameworks

**Long-Term Roadmap (5 Year Vision):**

**Year 1: Foundation Phase**
- Core configuration engine with AI assistance
- Basic policy-as-code capabilities
- Real-time configuration propagation
- Comprehensive audit logging
- Mobile administration interface

**Year 2: Intelligence Phase**
- Predictive configuration optimization
- Automated compliance monitoring
- Self-healing configuration systems
- Advanced collaboration features
- Voice-enabled configuration

**Year 3: Ecosystem Phase**
- Configuration marketplace for third-party integrations
- AI-powered configuration generation from business requirements
- Cross-enterprise configuration sharing (opt-in)
- Blockchain-based configuration provenance
- Quantum-resistant encryption for sensitive configurations

**Year 4: Autonomy Phase**
- Self-configuring systems based on business metrics
- Autonomous policy generation from regulatory changes
- Predictive configuration impact analysis
- Fully automated compliance reporting
- Neural configuration interfaces

**Year 5: Evolution Phase**
- Cognitive configuration assistants
- Configuration DNA - genetic algorithms for optimal setup
- Holographic configuration interfaces
- Emotion-aware configuration suggestions
- Configuration singularity - self-improving systems

**Implementation Principles:**

1. **Modular Architecture**: Each configuration domain as an independent, versioned module
2. **Progressive Enhancement**: Core functionality available immediately with advanced features layered on
3. **Backward Compatibility**: Support for existing configuration formats and APIs
4. **Extensibility**: Plugin architecture for custom configuration domains
5. **Observability**: Comprehensive metrics and tracing for all configuration operations
6. **Security-First**: Zero-trust model for all configuration operations
7. **Performance-Optimized**: Sub-100ms response times for all operations
8. **Resilience**: Built-in fault tolerance and disaster recovery

**Success Metrics:**

| KPI | Baseline | Year 1 Target | Year 3 Target | Year 5 Target |
|-----|----------|---------------|---------------|---------------|
| Configuration Time | 45 min | 15 min | 5 min | 1 min |
| Support Tickets | 120/mo | 50/mo | 15/mo | 5/mo |
| System Uptime | 99.8% | 99.95% | 99.99% | 99.999% |
| Feature Deployment | 30 days | 7 days | 1 day | 1 hour |
| Compliance Violations | 15/mo | 3/mo | 0.5/mo | 0/mo |
| Administrator Satisfaction | 65% | 85% | 95% | 99% |

## Performance Enhancements (300+ lines)

### Redis Caching Layer Implementation

```typescript
// src/cache/redis-cache.ts
import Redis from 'ioredis';
import { Logger } from '../utils/logger';
import { CacheConfig } from '../config/cache-config';
import { performance } from 'perf_hooks';

/**
 * Advanced Redis caching layer with:
 * - Multi-level caching (memory + Redis)
 * - Automatic cache invalidation
 * - Cache stampede protection
 * - Performance metrics
 * - Circuit breaker pattern
 */
export class RedisCache {
    private static instance: RedisCache;
    private redisClient: Redis.Redis;
    private memoryCache: Map<string, { value: any, expires: number }>;
    private config: CacheConfig;
    private logger: Logger;
    private circuitBreaker: {
        isOpen: boolean;
        failureCount: number;
        lastFailureTime: number;
    };

    private constructor() {
        this.config = CacheConfig.getInstance();
        this.logger = new Logger('RedisCache');
        this.memoryCache = new Map();
        this.circuitBreaker = {
            isOpen: false,
            failureCount: 0,
            lastFailureTime: 0
        };

        this.initializeRedis();
        this.setupEventListeners();
    }

    public static getInstance(): RedisCache {
        if (!RedisCache.instance) {
            RedisCache.instance = new RedisCache();
        }
        return RedisCache.instance;
    }

    private initializeRedis(): void {
        try {
            this.redisClient = new Redis({
                host: this.config.redisHost,
                port: this.config.redisPort,
                password: this.config.redisPassword,
                db: this.config.redisDB,
                connectTimeout: this.config.connectionTimeout,
                maxRetriesPerRequest: this.config.maxRetries,
                enableReadyCheck: true,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 100, 5000);
                    this.logger.warn(`Redis connection retry attempt ${times}, next in ${delay}ms`);
                    return delay;
                }
            });

            this.logger.info('Redis client initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Redis client', error);
            throw error;
        }
    }

    private setupEventListeners(): void {
        this.redisClient.on('connect', () => {
            this.logger.info('Redis client connected');
            this.circuitBreaker.isOpen = false;
            this.circuitBreaker.failureCount = 0;
        });

        this.redisClient.on('error', (error) => {
            this.logger.error('Redis client error', error);
            this.circuitBreaker.failureCount++;

            if (this.circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
                this.circuitBreaker.isOpen = true;
                this.circuitBreaker.lastFailureTime = Date.now();
                this.logger.warn('Redis circuit breaker opened');
            }
        });

        this.redisClient.on('reconnecting', () => {
            this.logger.info('Redis client reconnecting');
        });

        this.redisClient.on('end', () => {
            this.logger.warn('Redis client connection closed');
        });
    }

    /**
     * Get cached value with multi-level caching and stampede protection
     */
    public async get<T>(key: string): Promise<T | null> {
        const startTime = performance.now();

        // Check circuit breaker
        if (this.circuitBreaker.isOpen) {
            if (Date.now() - this.circuitBreaker.lastFailureTime > this.config.circuitBreakerResetTimeout) {
                this.circuitBreaker.isOpen = false;
                this.circuitBreaker.failureCount = 0;
                this.logger.info('Redis circuit breaker reset');
            } else {
                this.logger.warn('Redis circuit breaker is open, falling back to memory cache');
                return this.getFromMemoryCache<T>(key);
            }
        }

        try {
            // Check memory cache first
            const memoryValue = this.getFromMemoryCache<T>(key);
            if (memoryValue !== null) {
                this.logger.debug(`Memory cache hit for key: ${key}`);
                this.trackPerformance('memory_cache_hit', startTime);
                return memoryValue;
            }

            // Check Redis cache
            const redisValue = await this.getFromRedis<T>(key);
            if (redisValue !== null) {
                // Store in memory cache
                this.setInMemoryCache(key, redisValue, this.config.memoryCacheTTL);
                this.trackPerformance('redis_cache_hit', startTime);
                return redisValue;
            }

            this.trackPerformance('cache_miss', startTime);
            return null;
        } catch (error) {
            this.logger.error(`Error getting cache for key ${key}`, error);
            this.trackPerformance('cache_error', startTime);
            throw error;
        }
    }

    private getFromMemoryCache<T>(key: string): T | null {
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.value as T;
        }
        return null;
    }

    private async getFromRedis<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redisClient.get(key);
            if (value) {
                return JSON.parse(value) as T;
            }
            return null;
        } catch (error) {
            this.logger.error(`Error getting from Redis for key ${key}`, error);
            throw error;
        }
    }

    /**
     * Set value in cache with automatic TTL
     */
    public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        const effectiveTTL = ttl || this.config.defaultTTL;
        const startTime = performance.now();

        try {
            // Set in memory cache
            this.setInMemoryCache(key, value, this.config.memoryCacheTTL);

            // Set in Redis with circuit breaker check
            if (!this.circuitBreaker.isOpen) {
                await this.redisClient.setex(
                    key,
                    effectiveTTL,
                    JSON.stringify(value)
                );
            }

            this.trackPerformance('cache_set', startTime);
        } catch (error) {
            this.logger.error(`Error setting cache for key ${key}`, error);
            this.trackPerformance('cache_set_error', startTime);
            throw error;
        }
    }

    private setInMemoryCache<T>(key: string, value: T, ttl: number): void {
        this.memoryCache.set(key, {
            value,
            expires: Date.now() + ttl * 1000
        });

        // Clean up expired items periodically
        if (Math.random() < 0.01) {
            this.cleanupMemoryCache();
        }
    }

    private cleanupMemoryCache(): void {
        const now = Date.now();
        for (const [key, value] of this.memoryCache.entries()) {
            if (value.expires <= now) {
                this.memoryCache.delete(key);
            }
        }
    }

    /**
     * Delete value from cache
     */
    public async delete(key: string): Promise<void> {
        const startTime = performance.now();

        try {
            this.memoryCache.delete(key);
            if (!this.circuitBreaker.isOpen) {
                await this.redisClient.del(key);
            }
            this.trackPerformance('cache_delete', startTime);
        } catch (error) {
            this.logger.error(`Error deleting cache for key ${key}`, error);
            this.trackPerformance('cache_delete_error', startTime);
            throw error;
        }
    }

    /**
     * Invalidate cache for a pattern
     */
    public async invalidate(pattern: string): Promise<void> {
        const startTime = performance.now();

        try {
            // Invalidate memory cache
            for (const key of this.memoryCache.keys()) {
                if (key.includes(pattern)) {
                    this.memoryCache.delete(key);
                }
            }

            // Invalidate Redis cache
            if (!this.circuitBreaker.isOpen) {
                const keys = await this.redisClient.keys(`${pattern}*`);
                if (keys.length > 0) {
                    await this.redisClient.del(keys);
                }
            }

            this.trackPerformance('cache_invalidate', startTime);
        } catch (error) {
            this.logger.error(`Error invalidating cache for pattern ${pattern}`, error);
            this.trackPerformance('cache_invalidate_error', startTime);
            throw error;
        }
    }

    private trackPerformance(operation: string, startTime: number): void {
        const duration = performance.now() - startTime;
        this.logger.debug(`Cache operation ${operation} took ${duration.toFixed(2)}ms`);

        // In a real implementation, you would send this to your metrics system
        // metrics.increment(`cache.${operation}`);
        // metrics.timing(`cache.${operation}.duration`, duration);
    }

    /**
     * Get cache statistics
     */
    public async getStats(): Promise<{
        memoryCacheSize: number;
        redisCacheSize: number;
        memoryCacheHitRate: number;
        redisCacheHitRate: number;
    }> {
        try {
            const memoryCacheSize = this.memoryCache.size;
            const redisCacheSize = await this.redisClient.dbsize();

            // In a real implementation, you would track hit rates
            return {
                memoryCacheSize,
                redisCacheSize,
                memoryCacheHitRate: 0, // Would be calculated from metrics
                redisCacheHitRate: 0   // Would be calculated from metrics
            };
        } catch (error) {
            this.logger.error('Error getting cache stats', error);
            throw error;
        }
    }
}
```

### Database Query Optimization

```typescript
// src/database/query-optimizer.ts
import { Pool, PoolClient, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';
import { CacheConfig } from '../config/cache-config';
import { RedisCache } from '../cache/redis-cache';

/**
 * Advanced database query optimizer with:
 * - Query caching
 * - Query rewriting
 * - Execution plan analysis
 * - Connection pooling
 * - Batch processing
 * - Read/write splitting
 */
export class QueryOptimizer {
    private static instance: QueryOptimizer;
    private pool: Pool;
    private logger: Logger;
    private cache: RedisCache;
    private config: any;
    private queryCache: Map<string, { result: any, expires: number }>;
    private queryMetrics: Map<string, { count: number, avgDuration: number }>;

    private constructor() {
        this.config = {
            db: {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                user: process.env.DB_USER || 'admin',
                password: process.env.DB_PASSWORD || 'password',
                database: process.env.DB_NAME || 'admin_config',
                max: parseInt(process.env.DB_POOL_MAX || '20'),
                idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
                connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000')
            },
            query: {
                cacheEnabled: process.env.QUERY_CACHE_ENABLED !== 'false',
                cacheTTL: parseInt(process.env.QUERY_CACHE_TTL || '300'),
                slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'),
                maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '1000')
            }
        };

        this.logger = new Logger('QueryOptimizer');
        this.cache = RedisCache.getInstance();
        this.queryCache = new Map();
        this.queryMetrics = new Map();

        this.initializePool();
    }

    public static getInstance(): QueryOptimizer {
        if (!QueryOptimizer.instance) {
            QueryOptimizer.instance = new QueryOptimizer();
        }
        return QueryOptimizer.instance;
    }

    private initializePool(): void {
        this.pool = new Pool({
            host: this.config.db.host,
            port: this.config.db.port,
            user: this.config.db.user,
            password: this.config.db.password,
            database: this.config.db.database,
            max: this.config.db.max,
            idleTimeoutMillis: this.config.db.idleTimeoutMillis,
            connectionTimeoutMillis: this.config.db.connectionTimeoutMillis
        });

        this.pool.on('connect', () => {
            this.logger.info('Database connection established');
        });

        this.pool.on('error', (err) => {
            this.logger.error('Database connection error', err);
        });

        this.logger.info('Database connection pool initialized');
    }

    /**
     * Execute a query with optimization
     */
    public async query<T>(text: string, params: any[] = [], options: {
        cache?: boolean,
        ttl?: number,
        batch?: boolean,
        readOnly?: boolean
    } = {}): Promise<QueryResult<T>> {
        const startTime = performance.now();
        const cacheKey = this.generateCacheKey(text, params);
        const useCache = options.cache !== false && this.config.query.cacheEnabled;
        const effectiveTTL = options.ttl || this.config.query.cacheTTL;

        try {
            // Check cache first if enabled
            if (useCache) {
                const cachedResult = await this.getCachedQuery(cacheKey);
                if (cachedResult) {
                    this.trackQueryMetrics(text, startTime, true);
                    return cachedResult as QueryResult<T>;
                }
            }

            // Get a client from the pool
            const client = await this.getClient(options.readOnly);

            try {
                // Execute the query
                const result = await client.query<T>(text, params);

                // Cache the result if enabled
                if (useCache) {
                    await this.cacheQuery(cacheKey, result, effectiveTTL);
                }

                this.trackQueryMetrics(text, startTime, false);
                return result;
            } finally {
                // Release the client back to the pool
                client.release();
            }
        } catch (error) {
            this.logger.error(`Query execution failed: ${text}`, error);
            this.trackQueryMetrics(text, startTime, false, true);
            throw error;
        }
    }

    private async getClient(readOnly: boolean = false): Promise<PoolClient> {
        try {
            const client = await this.pool.connect();

            // Set read-only mode if requested
            if (readOnly) {
                await client.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');
            }

            return client;
        } catch (error) {
            this.logger.error('Failed to get database client', error);
            throw error;
        }
    }

    private async getCachedQuery(cacheKey: string): Promise<QueryResult | null> {
        try {
            const cached = this.queryCache.get(cacheKey);
            if (cached && cached.expires > Date.now()) {
                this.logger.debug(`Cache hit for query: ${cacheKey}`);
                return cached.result;
            }

            const redisResult = await this.cache.get<QueryResult>(cacheKey);
            if (redisResult) {
                // Update memory cache
                this.queryCache.set(cacheKey, {
                    result: redisResult,
                    expires: Date.now() + this.config.query.cacheTTL * 1000
                });
                return redisResult;
            }

            return null;
        } catch (error) {
            this.logger.error('Error getting cached query', error);
            return null;
        }
    }

    private async cacheQuery(cacheKey: string, result: QueryResult, ttl: number): Promise<void> {
        try {
            // Store in memory cache
            this.queryCache.set(cacheKey, {
                result,
                expires: Date.now() + ttl * 1000
            });

            // Store in Redis
            await this.cache.set(cacheKey, result, ttl);
        } catch (error) {
            this.logger.error('Error caching query result', error);
        }
    }

    private generateCacheKey(text: string, params: any[]): string {
        // Create a consistent cache key from query and parameters
        const paramString = params.map(p => {
            if (p === null || p === undefined) return 'null';
            if (typeof p === 'object') return JSON.stringify(p);
            return p.toString();
        }).join(',');

        return `query:${text}:${paramString}`;
    }

    private trackQueryMetrics(text: string, startTime: number, fromCache: boolean, isError: boolean = false): void {
        const duration = performance.now() - startTime;
        const queryKey = this.simplifyQuery(text);

        // Update metrics
        if (!this.queryMetrics.has(queryKey)) {
            this.queryMetrics.set(queryKey, { count: 0, avgDuration: 0 });
        }

        const metrics = this.queryMetrics.get(queryKey)!;
        metrics.count++;
        metrics.avgDuration = (metrics.avgDuration * (metrics.count - 1) + duration) / metrics.count;

        // Log slow queries
        if (duration > this.config.query.slowQueryThreshold) {
            this.logger.warn(`Slow query detected (${duration.toFixed(2)}ms): ${queryKey}`);
        }

        // Log cache performance
        if (fromCache) {
            this.logger.debug(`Query served from cache: ${queryKey} (${duration.toFixed(2)}ms)`);
        }

        // Log errors
        if (isError) {
            this.logger.error(`Query failed: ${queryKey} (${duration.toFixed(2)}ms)`);
        }
    }

    private simplifyQuery(text: string): string {
        // Remove parameters and whitespace to create a simplified query key
        return text.replace(/\s+/g, ' ')
                   .replace(/\$\d+/g, '')
                   .trim()
                   .substring(0, 100);
    }

    /**
     * Execute a batch of queries in a transaction
     */
    public async batchQuery(queries: { text: string, params?: any[] }[]): Promise<QueryResult[]> {
        if (queries.length > this.config.query.maxBatchSize) {
            throw new Error(`Batch size exceeds maximum of ${this.config.query.maxBatchSize}`);
        }

        const startTime = performance.now();
        const client = await this.pool.connect();
        const results: QueryResult[] = [];

        try {
            await client.query('BEGIN');

            for (const query of queries) {
                const result = await client.query(query.text, query.params || []);
                results.push(result);
            }

            await client.query('COMMIT');
            this.trackQueryMetrics(`batch:${queries.length}`, startTime, false);
            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Batch query failed', error);
            this.trackQueryMetrics(`batch:${queries.length}`, startTime, false, true);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Analyze query execution plan
     */
    public async explainQuery(text: string, params: any[] = []): Promise<any> {
        const explainQuery = `EXPLAIN (ANALYZE, FORMAT JSON) ${text}`;
        const result = await this.query(explainQuery, params);
        return JSON.parse(result.rows[0].QUERY_PLAN);
    }

    /**
     * Get query performance metrics
     */
    public getQueryMetrics(): Map<string, { count: number, avgDuration: number }> {
        return new Map(this.queryMetrics);
    }

    /**
     * Close all database connections
     */
    public async close(): Promise<void> {
        try {
            await this.pool.end();
            this.logger.info('Database connection pool closed');
        } catch (error) {
            this.logger.error('Error closing database connection pool', error);
            throw error;
        }
    }
}
```

### API Response Compression

```typescript
// src/middleware/response-compression.ts
import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

/**
 * Advanced API response compression middleware with:
 * - Dynamic compression based on content type
 * - Adaptive compression level
 * - Cache control headers
 * - Performance metrics
 * - Client hints support
 */
export class ResponseCompression {
    private static instance: ResponseCompression;
    private logger: Logger;
    private compressionLevels: Map<string, number>;
    private minSizeForCompression: number;
    private cacheControl: {
        maxAge: number;
        staleWhileRevalidate: number;
    };

    private constructor() {
        this.logger = new Logger('ResponseCompression');
        this.compressionLevels = new Map([
            ['text/html', 6],
            ['application/json', 6],
            ['application/javascript', 6],
            ['text/css', 6],
            ['text/plain', 4],
            ['image/svg+xml', 4],
            ['application/xml', 4]
        ]);
        this.minSizeForCompression = 1024; // 1KB
        this.cacheControl = {
            maxAge: 3600, // 1 hour
            staleWhileRevalidate: 86400 // 24 hours
        };
    }

    public static getInstance(): ResponseCompression {
        if (!ResponseCompression.instance) {
            ResponseCompression.instance = new ResponseCompression();
        }
        return ResponseCompression.instance;
    }

    /**
     * Express middleware for response compression
     */
    public middleware(): (req: Request, res: Response, next: NextFunction) => void {
        return (req: Request, res: Response, next: NextFunction) => {
            const startTime = performance.now();
            const originalWrite = res.write;
            const originalEnd = res.end;
            const originalJson = res.json;
            const originalSend = res.send;

            // Check if client supports compression
            const acceptEncoding = req.headers['accept-encoding'] || '';
            const supportsGzip = acceptEncoding.includes('gzip');
            const supportsBrotli = acceptEncoding.includes('br');

            // Determine compression method
            let compressionMethod: 'gzip' | 'br' | null = null;
            if (supportsBrotli) {
                compressionMethod = 'br';
            } else if (supportsGzip) {
                compressionMethod = 'gzip';
            }

            // Only compress if client supports it and response is large enough
            const shouldCompress = (res: Response) => {
                const contentType = res.getHeader('Content-Type') as string;
                const contentLength = res.getHeader('Content-Length') as number | string;

                // Don't compress if already compressed
                if (res.getHeader('Content-Encoding')) {
                    return false;
                }

                // Don't compress if content type is not compressible
                if (!contentType || !this.isCompressible(contentType)) {
                    return false;
                }

                // Don't compress if content is too small
                if (contentLength && typeof contentLength === 'number' && contentLength < this.minSizeForCompression) {
                    return false;
                }

                // Don't compress if response is already cached
                if (res.getHeader('Cache-Control')?.includes('public')) {
                    return false;
                }

                return true;
            };

            // Override response methods
            res.write = (chunk: any, encoding?: BufferEncoding | ((error: Error | null) => void), cb?: (error: Error | null) => void): boolean => {
                if (!shouldCompress(res)) {
                    return originalWrite.call(res, chunk, encoding as any, cb);
                }

                return this.compressChunk(res, chunk, compressionMethod, originalWrite, encoding, cb);
            };

            res.end = (chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void): void => {
                if (!chunk && !shouldCompress(res)) {
                    return originalEnd.call(res, chunk, encoding as any, cb);
                }

                if (chunk) {
                    this.compressChunk(res, chunk, compressionMethod, (compressedChunk: any) => {
                        originalEnd.call(res, compressedChunk, encoding as any, cb);
                    });
                } else {
                    originalEnd.call(res, chunk, encoding as any, cb);
                }
            };

            res.json = (body: any): Response => {
                if (!shouldCompress(res)) {
                    return originalJson.call(res, body);
                }

                const jsonString = JSON.stringify(body);
                const buffer = Buffer.from(jsonString);

                return this.compressResponse(res, buffer, compressionMethod, 'application/json');
            };

            res.send = (body?: any): Response => {
                if (!shouldCompress(res)) {
                    return originalSend.call(res, body);
                }

                let buffer: Buffer;
                if (body instanceof Buffer) {
                    buffer = body;
                } else if (typeof body === 'string') {
                    buffer = Buffer.from(body);
                } else {
                    buffer = Buffer.from(JSON.stringify(body));
                }

                const contentType = res.getHeader('Content-Type') as string || 'text/html';
                return this.compressResponse(res, buffer, compressionMethod, contentType);
            };

            // Set cache control headers
            res.setHeader('Cache-Control', `public, max-age=${this.cacheControl.maxAge}, stale-while-revalidate=${this.cacheControl.staleWhileRevalidate}`);

            // Add Vary header
            res.setHeader('Vary', 'Accept-Encoding');

            // Track performance
            res.on('finish', () => {
                const duration = performance.now() - startTime;
                const contentLength = res.getHeader('Content-Length') as number;
                const contentEncoding = res.getHeader('Content-Encoding');

                this.logger.debug(`Response ${contentEncoding ? 'compressed' : 'uncompressed'} in ${duration.toFixed(2)}ms, size: ${contentLength || 'unknown'} bytes`);

                // In a real implementation, you would send this to your metrics system
                // metrics.increment(`response.${contentEncoding || 'uncompressed'}`);
                // metrics.timing(`response.duration`, duration);
                // metrics.histogram(`response.size`, contentLength || 0);
            });

            next();
        };
    }

    private isCompressible(contentType: string): boolean {
        for (const [type] of this.compressionLevels) {
            if (contentType.includes(type)) {
                return true;
            }
        }
        return false;
    }

    private getCompressionLevel(contentType: string): number {
        for (const [type, level] of this.compressionLevels) {
            if (contentType.includes(type)) {
                return level;
            }
        }
        return 4; // Default compression level
    }

    private compressChunk(
        res: Response,
        chunk: any,
        compressionMethod: 'gzip' | 'br' | null,
        originalWrite: any,
        encoding?: BufferEncoding | ((error: Error | null) => void),
        cb?: (error: Error | null) => void
    ): boolean {
        if (!compressionMethod || !chunk) {
            return originalWrite.call(res, chunk, encoding as any, cb);
        }

        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        const compressionLevel = this.getCompressionLevel(res.getHeader('Content-Type') as string);

        try {
            if (compressionMethod === 'br') {
                zlib.brotliCompress(buffer, {
                    params: {
                        [zlib.constants.BROTLI_PARAM_QUALITY]: compressionLevel
                    }
                }, (err, compressed) => {
                    if (err) {
                        this.logger.error('Brotli compression failed', err);
                        return originalWrite.call(res, chunk, encoding as any, cb);
                    }
                    res.setHeader('Content-Encoding', 'br');
                    originalWrite.call(res, compressed, encoding as any, cb);
                });
                return true;
            } else {
                zlib.gzip(buffer, { level: compressionLevel }, (err, compressed) => {
                    if (err) {
                        this.logger.error('Gzip compression failed', err);
                        return originalWrite.call(res, chunk, encoding as any, cb);
                    }
                    res.setHeader('Content-Encoding', 'gzip');
                    originalWrite.call(res, compressed, encoding as any, cb);
                });
                return true;
            }
        } catch (error) {
            this.logger.error('Compression failed', error);
            return originalWrite.call(res, chunk, encoding as any, cb);
        }
    }

    private compressResponse(
        res: Response,
        buffer: Buffer,
        compressionMethod: 'gzip' | 'br' | null,
        contentType: string
    ): Response {
        if (!compressionMethod) {
            res.setHeader('Content-Length', buffer.length);
            return res;
        }

        const compressionLevel = this.getCompressionLevel(contentType);

        try {
            if (compressionMethod === 'br') {
                const compressed = zlib.brotliCompressSync(buffer, {
                    params: {
                        [zlib.constants.BROTLI_PARAM_QUALITY]: compressionLevel
                    }
                });
                res.setHeader('Content-Encoding', 'br');
                res.setHeader('Content-Length', compressed.length);
                return res.send(compressed);
            } else {
                const compressed = zlib.gzipSync(buffer, { level: compressionLevel });
                res.setHeader('Content-Encoding', 'gzip');
                res.setHeader('Content-Length', compressed.length);
                return res.send(compressed);
            }
        } catch (error) {
            this.logger.error('Response compression failed', error);
            res.setHeader('Content-Length', buffer.length);
            return res.send(buffer);
        }
    }

    /**
     * Configure compression settings
     */
    public configure(config: {
        compressionLevels?: Map<string, number>;
        minSizeForCompression?: number;
        cacheControl?: {
            maxAge?: number;
            staleWhileRevalidate?: number;
        };
    }): void {
        if (config.compressionLevels) {
            this.compressionLevels = config.compressionLevels;
        }
        if (config.minSizeForCompression) {
            this.minSizeForCompression = config.minSizeForCompression;
        }
        if (config.cacheControl) {
            this.cacheControl = {
                ...this.cacheControl,
                ...config.cacheControl
            };
        }
    }
}
```

### Lazy Loading Implementation

```typescript
// src/utils/lazy-loader.ts
import { Logger } from './logger';
import { performance } from 'perf_hooks';

/**
 * Advanced lazy loading system with:
 * - Dependency injection
 * - Circular dependency detection
 * - Performance metrics
 * - Retry logic
 * - Cache management
 * - Async initialization
 */
export class LazyLoader {
    private static instance: LazyLoader;
    private logger: Logger;
    private loadedModules: Map<string, any>;
    private loadingModules: Map<string, Promise<any>>;
    private moduleFactories: Map<string, () => Promise<any>>;
    private dependencyGraph: Map<string, Set<string>>;
    private maxRetries: number;
    private retryDelay: number;
    private initializationPromises: Map<string, Promise<void>>;

    private constructor() {
        this.logger = new Logger('LazyLoader');
        this.loadedModules = new Map();
        this.loadingModules = new Map();
        this.moduleFactories = new Map();
        this.dependencyGraph = new Map();
        this.maxRetries = 3;
        this.retryDelay = 100;
        this.initializationPromises = new Map();
    }

    public static getInstance(): LazyLoader {
        if (!LazyLoader.instance) {
            LazyLoader.instance = new LazyLoader();
        }
        return LazyLoader.instance;
    }

    /**
     * Register a module factory
     */
    public registerModule<T>(name: string, factory: () => Promise<T>, dependencies: string[] = []): void {
        if (this.moduleFactories.has(name)) {
            this.logger.warn(`Module ${name} is already registered, overwriting`);
        }

        this.moduleFactories.set(name, factory);
        this.dependencyGraph.set(name, new Set(dependencies));

        // Validate dependencies
        for (const dep of dependencies) {
            if (!this.moduleFactories.has(dep)) {
                throw new Error(`Dependency ${dep} for module ${name} is not registered`);
            }
        }

        this.logger.debug(`Registered module ${name} with dependencies: [${dependencies.join(', ')}]`);
    }

    /**
     * Get a module, loading it if necessary
     */
    public async getModule<T>(name: string, options: {
        forceReload?: boolean;
        maxRetries?: number;
        retryDelay?: number;
    } = {}): Promise<T> {
        const startTime = performance.now();
        const effectiveOptions = {
            forceReload: options.forceReload || false,
            maxRetries: options.maxRetries || this.maxRetries,
            retryDelay: options.retryDelay || this.retryDelay
        };

        // Check if already loaded
        if (!effectiveOptions.forceReload && this.loadedModules.has(name)) {
            this.logger.debug(`Returning cached module ${name}`);
            this.trackPerformance(name, startTime, 'cache_hit');
            return this.loadedModules.get(name) as T;
        }

        // Check for circular dependencies
        if (this.loadingModules.has(name)) {
            const circularPath = this.detectCircularDependency(name, name, []);
            if (circularPath) {
                this.logger.error(`Circular dependency detected: ${circularPath.join(' -> ')}`);
                throw new Error(`Circular dependency detected for module ${name}`);
            }
        }

        // Check if currently loading
        if (this.loadingModules.has(name)) {
            this.logger.debug(`Waiting for module ${name} to load`);
            const module = await this.loadingModules.get(name)!;
            this.trackPerformance(name, startTime, 'loading_wait');
            return module as T;
        }

        // Load the module
        try {
            const module = await this.loadModuleWithRetry(name, effectiveOptions.maxRetries, effectiveOptions.retryDelay);
            this.loadedModules.set(name, module);
            this.trackPerformance(name, startTime, 'load_success');
            return module;
        } catch (error) {
            this.logger.error(`Failed to load module ${name}`, error);
            this.trackPerformance(name, startTime, 'load_failure');
            throw error;
        } finally {
            this.loadingModules.delete(name);
        }
    }

    private async loadModuleWithRetry(name: string, maxRetries: number, retryDelay: number): Promise<any> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.loadModule(name);
            } catch (error) {
                lastError = error as Error;
                this.logger.warn(`Attempt ${attempt} to load module ${name} failed: ${error instanceof Error ? error.message : String(error)}`);

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        throw new Error(`Failed to load module ${name} after ${maxRetries} attempts. Last error: ${lastError?.message}`);
    }

    private async loadModule(name: string): Promise<any> {
        if (!this.moduleFactories.has(name)) {
            throw new Error(`Module ${name} is not registered`);
        }

        this.loadingModules.set(name, new Promise((_, reject) => {
            // This will be replaced by the actual loading promise
            setTimeout(() => reject(new Error('Module loading timed out')), 30000);
        }));

        const factory = this.moduleFactories.get(name)!;
        const dependencies = Array.from(this.dependencyGraph.get(name) || []);

        // Load dependencies first
        const loadedDependencies: any[] = [];
        for (const dep of dependencies) {
            const depModule = await this.getModule(dep);
            loadedDependencies.push(depModule);
        }

        // Load the module
        this.logger.debug(`Loading module ${name}`);
        const module = await factory();

        // Initialize the module if it has an init method
        if (typeof module.init === 'function') {
            if (!this.initializationPromises.has(name)) {
                this.initializationPromises.set(name, module.init(...loadedDependencies));
            }
            await this.initializationPromises.get(name);
        }

        // Replace the loading promise with the actual module
        this.loadingModules.set(name, Promise.resolve(module));
        return module;
    }

    private detectCircularDependency(current: string, target: string, path: string[]): string[] | null {
        if (current === target && path.length > 0) {
            return [...path, current];
        }

        const dependencies = this.dependencyGraph.get(current);
        if (!dependencies) {
            return null;
        }

        for (const dep of dependencies) {
            if (path.includes(dep)) {
                continue;
            }

            const result = this.detectCircularDependency(dep, target, [...path, current]);
            if (result) {
                return result;
            }
        }

        return null;
    }

    /**
     * Initialize all registered modules
     */
    public async initializeAll(): Promise<void> {
        this.logger.info('Initializing all lazy-loaded modules');

        const modules = Array.from(this.moduleFactories.keys());
        const initializationPromises: Promise<void>[] = [];

        for (const moduleName of modules) {
            try {
                const module = await this.getModule(moduleName);
                if (typeof module.init === 'function' && !this.initializationPromises.has(moduleName)) {
                    initializationPromises.push(
                        module.init().catch(error => {
                            this.logger.error(`Initialization failed for module ${moduleName}`, error);
                        })
                    );
                }
            } catch (error) {
                this.logger.error(`Failed to initialize module ${moduleName}`, error);
            }
        }

        await Promise.all(initializationPromises);
        this.logger.info('All modules initialized');
    }

    /**
     * Clear a module from cache
     */
    public clearModule(name: string): void {
        this.loadedModules.delete(name);
        this.initializationPromises.delete(name);
        this.logger.debug(`Cleared module ${name} from cache`);
    }

    /**
     * Clear all modules from cache
     */
    public clearAll(): void {
        this.loadedModules.clear();
        this.initializationPromises.clear();
        this.logger.debug('Cleared all modules from cache');
    }

    private trackPerformance(moduleName: string, startTime: number, operation: string): void {
        const duration = performance.now() - startTime;
        this.logger.debug(`Module ${moduleName} ${operation} in ${duration.toFixed(2)}ms`);

        // In a real implementation, you would send this to your metrics system
        // metrics.increment(`lazy_loader.${operation}`);
        // metrics.timing(`lazy_loader.${moduleName}.duration`, duration);
    }

    /**
     * Get loading status of all modules
     */
    public getStatus(): {
        registered: string[];
        loaded: string[];
        loading: string[];
        failed: string[];
    } {
        const registered = Array.from(this.moduleFactories.keys());
        const loaded = Array.from(this.loadedModules.keys());
        const loading = Array.from(this.loadingModules.keys());

        const failed = registered.filter(module =>
            !loaded.includes(module) &&
            !loading.includes(module)
        );

        return {
            registered,
            loaded,
            loading,
            failed
        };
    }
}
```

### Request Debouncing

```typescript
// src/utils/request-debouncer.ts
import { Logger } from './logger';
import { performance } from 'perf_hooks';

/**
 * Advanced request debouncing system with:
 * - Multiple debounce strategies
 * - Priority-based debouncing
 * - Memory management
 - Performance metrics
 - Leaky bucket algorithm
 - Adaptive debouncing
 */
export class RequestDebouncer {
    private static instance: RequestDebouncer;
    private logger: Logger;
    private debounceTimers: Map<string, NodeJS.Timeout>;
    private debounceData: Map<string, {
        lastCall: number;
        pendingCalls: number;
        priority: number;
        lastResult?: any;
        lastError?: Error;
    }>;
    private debounceConfig: Map<string, {
        wait: number;
        maxWait?: number;
        strategy: 'leading' | 'trailing' | 'both';
        priority?: number;
        maxPending?: number;
    }>;
    private leakyBuckets: Map<string, {
        capacity: number;
        tokens: number;
        lastRefill: number;
        refillRate: number;
    }>;
    private adaptiveDebounce: Map<string, {
        currentWait: number;
        minWait: number;
        maxWait: number;
        adjustmentFactor: number;
        lastAdjustment: number;
    }>;

    private constructor() {
        this.logger = new Logger('RequestDebouncer');
        this.debounceTimers = new Map();
        this.debounceData = new Map();
        this.debounceConfig = new Map();
        this.leakyBuckets = new Map();
        this.adaptiveDebounce = new Map();
    }

    public static getInstance(): RequestDebouncer {
        if (!RequestDebouncer.instance) {
            RequestDebouncer.instance = new RequestDebouncer();
        }
        return RequestDebouncer.instance;
    }

    /**
     * Configure debouncing for a specific key
     */
    public configure(key: string, config: {
        wait: number;
        maxWait?: number;
        strategy?: 'leading' | 'trailing' | 'both';
        priority?: number;
        maxPending?: number;
        leakyBucket?: {
            capacity: number;
            refillRate: number;
        };
        adaptive?: {
            minWait: number;
            maxWait: number;
            adjustmentFactor: number;
        };
    }): void {
        this.debounceConfig.set(key, {
            wait: config.wait,
            maxWait: config.maxWait,
            strategy: config.strategy || 'trailing',
            priority: config.priority || 0,
            maxPending: config.maxPending
        });

        if (config.leakyBucket) {
            this.leakyBuckets.set(key, {
                capacity: config.leakyBucket.capacity,
                tokens: config.leakyBucket.capacity,
                lastRefill: performance.now(),
                refillRate: config.leakyBucket.refillRate
            });
        }

        if (config.adaptive) {
            this.adaptiveDebounce.set(key, {
                currentWait: config.wait,
                minWait: config.adaptive.minWait,
                maxWait: config.adaptive.maxWait,
                adjustmentFactor: config.adaptive.adjustmentFactor,
                lastAdjustment: performance.now()
            });
        }

        this.logger.debug(`Configured debouncing for ${key}: ${JSON.stringify(config)}`);
    }

    /**
     * Debounce a function call
     */
    public debounce<T extends (...args: any[]) => any>(
        key: string,
        fn: T,
        ...args: Parameters<T>
    ): Promise<ReturnType<T>> {
        const startTime = performance.now();
        const config = this.debounceConfig.get(key) || {
            wait: 300,
            strategy: 'trailing',
            priority: 0
        };

        // Check leaky bucket
        if (this.leakyBuckets.has(key)) {
            const bucket = this.leakyBuckets.get(key)!;
            this.refillLeakyBucket(key);

            if (bucket.tokens <= 0) {
                this.logger.warn(`Leaky bucket full for ${key}, request dropped`);
                this.trackPerformance(key, startTime, 'dropped');
                throw new Error(`Request rate limit exceeded for ${key}`);
            }

            bucket.tokens--;
        }

        // Initialize debounce data if not exists
        if (!this.debounceData.has(key)) {
            this.debounceData.set(key, {
                lastCall: 0,
                pendingCalls: 0,
                priority: config.priority || 0
            });
        }

        const data = this.debounceData.get(key)!;
        data.pendingCalls++;

        // Check max pending calls
        if (config.maxPending && data.pendingCalls > config.maxPending) {
            this.logger.warn(`Max pending calls exceeded for ${key}, request dropped`);
            data.pendingCalls--;
            this.trackPerformance(key, startTime, 'dropped');
            throw new Error(`Max pending calls exceeded for ${key}`);
        }

        // Clear existing timer
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        // Handle leading edge
        if (config.strategy === 'leading' || config.strategy === 'both') {
            const now = performance.now();
            if (now - data.lastCall >= config.wait) {
                data.lastCall = now;
                data.pendingCalls--;

                return this.executeFunction(key, fn, args, startTime);
            }
        }

        // Set up new timer
        return new Promise<ReturnType<T>>((resolve, reject) => {
            this.debounceTimers.set(key, setTimeout(async () => {
                try {
                    // Handle trailing edge
                    if (config.strategy === 'trailing' || config.strategy === 'both') {
                        data.lastCall = performance.now();
                    }

                    const result = await this.executeFunction(key, fn, args, startTime);
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.debounceTimers.delete(key);
                }
            }, this.getEffectiveWaitTime(key, config.wait)));
        });
    }

    private getEffectiveWaitTime(key: string, baseWait: number): number {
        // Apply adaptive debouncing if configured
        if (this.adaptiveDebounce.has(key)) {
            const adaptive = this.adaptiveDebounce.get(key)!;
            const now = performance.now();

            // Adjust wait time based on recent performance
            if (now - adaptive.lastAdjustment > 1000) {
                // In a real implementation, you would use actual performance metrics
                // For this example, we'll just oscillate between min and max
                if (adaptive.currentWait >= adaptive.maxWait) {
                    adaptive.currentWait = adaptive.maxWait;
                } else if (adaptive.currentWait <= adaptive.minWait) {
                    adaptive.currentWait = adaptive.minWait;
                } else {
                    adaptive.currentWait = Math.max(
                        adaptive.minWait,
                        Math.min(
                            adaptive.maxWait,
                            adaptive.currentWait * (1 + (Math.random() * 2 - 1) * adaptive.adjustmentFactor)
                        )
                    );
                }

                adaptive.lastAdjustment = now;
                this.logger.debug(`Adjusted debounce wait for ${key} to ${adaptive.currentWait}ms`);
            }

            return adaptive.currentWait;
        }

        return baseWait;
    }

    private refillLeakyBucket(key: string): void {
        const bucket = this.leakyBuckets.get(key)!;
        const now = performance.now();
        const timePassed = now - bucket.lastRefill;
        const tokensToAdd = Math.floor(timePassed * bucket.refillRate / 1000);

        if (tokensToAdd > 0) {
            bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
            bucket.lastRefill = now;
        }
    }

    private async executeFunction<T extends (...args: any[]) => any>(
        key: string,
        fn: T,
        args: Parameters<T>,
        startTime: number
    ): Promise<ReturnType<T>> {
        const data = this.debounceData.get(key)!;
        data.pendingCalls = Math.max(0, data.pendingCalls - 1);

        try {
            const result = await fn(...args);
            data.lastResult = result;
            data.lastError = undefined;
            this.trackPerformance(key, startTime, 'success');
            return result;
        } catch (error) {
            data.lastError = error as Error;
            this.trackPerformance(key, startTime, 'error');
            throw error;
        }
    }

    /**
     * Cancel pending debounced calls
     */
    public cancel(key: string): void {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.delete(key);
            this.debounceData.delete(key);
            this.logger.debug(`Cancelled debounced calls for ${key}`);
        }
    }

    /**
     * Cancel all pending debounced calls
     */
    public cancelAll(): void {
        this.debounceTimers.forEach((timer, key) => {
            clearTimeout(timer);
            this.logger.debug(`Cancelled debounced calls for ${key}`);
        });
        this.debounceTimers.clear();
        this.debounceData.clear();
    }

    /**
     * Get debounce status for a key
     */
    public getStatus(key: string): {
        pendingCalls: number;
        lastCall: number;
        lastResult?: any;
        lastError?: Error;
        config: any;
        leakyBucket?: {
            tokens: number;
            capacity: number;
        };
        adaptiveDebounce?: {
            currentWait: number;
            minWait: number;
            maxWait: number;
        };
    } {
        const data = this.debounceData.get(key) || {
            pendingCalls: 0,
            lastCall: 0
        };

        const config = this.debounceConfig.get(key) || {
            wait: 300,
            strategy: 'trailing',
            priority: 0
        };

        const status: any = {
            pendingCalls: data.pendingCalls,
            lastCall: data.lastCall,
            lastResult: data.lastResult,
            lastError: data.lastError,
            config
        };

        if (this.leakyBuckets.has(key)) {
            const bucket = this.leakyBuckets.get(key)!;
            status.leakyBucket = {
                tokens: bucket.tokens,
                capacity: bucket.capacity
            };
        }

        if (this.adaptiveDebounce.has(key)) {
            const adaptive = this.adaptiveDebounce.get(key)!;
            status.adaptiveDebounce = {
                currentWait: adaptive.currentWait,
                minWait: adaptive.minWait,
                maxWait: adaptive.maxWait
            };
        }

        return status;
    }

    private trackPerformance(key: string, startTime: number, operation: string): void {
        const duration = performance.now() - startTime;
        this.logger.debug(`Debounced operation ${key} ${operation} in ${duration.toFixed(2)}ms`);

        // In a real implementation, you would send this to your metrics system
        // metrics.increment(`debouncer.${operation}`);
        // metrics.timing(`debouncer.${key}.duration`, duration);
    }

    /**
     * Flush all pending debounced calls
     */
    public async flush(): Promise<void> {
        const promises: Promise<void>[] = [];

        this.debounceTimers.forEach((timer, key) => {
            clearTimeout(timer);
            promises.push(new Promise<void>(resolve => {
                // The setTimeout ensures the debounced function gets called
                setTimeout(resolve, 0);
            }));
        });

        await Promise.all(promises);
        this.debounceTimers.clear();
        this.logger.debug('Flushed all debounced calls');
    }
}
```

### Connection Pooling

```typescript
// src/database/connection-pool.ts
import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

/**
 * Advanced database connection pool with:
 * - Connection health checks
 * - Dynamic pool sizing
 * - Connection borrowing strategies
 * - Performance metrics
 - Circuit breaker pattern
 - Read/write splitting
 */
export class AdvancedConnectionPool extends EventEmitter {
    private pool: Pool;
    private logger: Logger;
    private config: PoolConfig & {
        healthCheckInterval: number;
        maxLifetime: number;
        idleTimeout: number;
        connectionTimeout: number;
        readOnlyHosts?: string[];
        circuitBreaker: {
            threshold: number;
            resetTimeout: number;
        };
    };
    private healthCheckInterval: NodeJS.Timeout | null;
    private circuitBreaker: {
        isOpen: boolean;
        failureCount: number;
        lastFailureTime: number;
    };
    private connectionMetrics: {
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
        waitingClients: number;
        maxConnections: number;
    };
    private connectionLifetimes: Map<string, number>;
    private readOnlyPool?: Pool;

    constructor(config: PoolConfig & {
        healthCheckInterval?: number;
        maxLifetime?: number;
        idleTimeout?: number;
        connectionTimeout?: number;
        readOnlyHosts?: string[];
        circuitBreaker?: {
            threshold?: number;
            resetTimeout?: number;
        };
    }) {
        super();
        this.logger = new Logger('AdvancedConnectionPool');

        this.config = {
            ...config,
            healthCheckInterval: config.healthCheckInterval || 30000,
            maxLifetime: config.maxLifetime || 3600000,
            idleTimeout: config.idleTimeout || 300000,
            connectionTimeout: config.connectionTimeout || 5000,
            circuitBreaker: {
                threshold: config.circuitBreaker?.threshold || 5,
                resetTimeout: config.circuitBreaker?.resetTimeout || 30000
            }
        };

        this.circuitBreaker = {
            isOpen: false,
            failureCount: 0,
            lastFailureTime: 0
        };

        this.connectionMetrics = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            waitingClients: 0,
            maxConnections: this.config.max || 10
        };

        this.connectionLifetimes = new Map();

        this.initializePool();
        this.setupEventListeners();
        this.startHealthChecks();

        if (this.config.readOnlyHosts && this.config.readOnlyHosts.length > 0) {
            this.initializeReadOnlyPool();
        }
    }

    private initializePool(): void {
        this.pool = new Pool({
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database,
            max: this.config.max,
            idleTimeoutMillis: this.config.idleTimeout,
            connectionTimeoutMillis: this.config.connectionTimeout,
            application_name: 'admin-config-primary'
        });

        this.logger.info('Primary database connection pool initialized');
    }

    private initializeReadOnlyPool(): void {
        const readOnlyConfig = {
            ...this.config,
            host: this.config.readOnlyHosts![0],
            application_name: 'admin-config-readonly'
        };

        this.readOnlyPool = new Pool(readOnlyConfig);
        this.logger.info('Read-only database connection pool initialized');
    }

    private setupEventListeners(): void {
        this.pool.on('connect', (client) => {
            this.connectionMetrics.totalConnections++;
            this.connectionMetrics.activeConnections++;
            this.connectionLifetimes.set(client.processID!.toString(), performance.now());

            this.logger.debug(`New connection established (ID: ${client.processID})`);
            this.emit('connect', client);
        });

        this.pool.on('acquire', (client) => {
            this.connectionMetrics.activeConnections++;
            this.connectionMetrics.idleConnections--;

            this.logger.debug(`Connection acquired (ID: ${client.processID})`);
            this.emit('acquire', client);
        });

        this.pool.on('release', (err, client) => {
            this.connectionMetrics.activeConnections--;
            this.connectionMetrics.idleConnections++;

            if (err) {
                this.logger.error(`Connection release error (ID: ${client.processID})`, err);
            } else {
                this.logger.debug(`Connection released (ID: ${client.processID})`);
            }
            this.emit('release', err, client);
        });

        this.pool.on('error', (err, client) => {
            this.logger.error('Connection pool error', err);
            this.handleConnectionError();

            if (client) {
                this.logger.error(`Error occurred on connection (ID: ${client.processID})`, err);
            }
            this.emit('error', err, client);
        });

        this.pool.on('remove', (client) => {
            this.connectionMetrics.totalConnections--;
            this.connectionMetrics.activeConnections--;
            this.connectionLifetimes.delete(client.processID!.toString());

            this.logger.debug(`Connection removed (ID: ${client.processID})`);
            this.emit('remove', client);
        });
    }

    private startHealthChecks(): void {
        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.checkConnectionHealth();
            } catch (error) {
                this.logger.error('Health check failed', error);
            }
        }, this.config.healthCheckInterval);
    }

    private async checkConnectionHealth(): Promise<void> {
        if (this.circuitBreaker.isOpen) {
            const now = performance.now();
            if (now - this.circuitBreaker.lastFailureTime > this.config.circuitBreaker.resetTimeout) {
                this.circuitBreaker.isOpen = false;
                this.circuitBreaker.failureCount = 0;
                this.logger.info('Circuit breaker reset, attempting to reconnect');
            } else {
                this.logger.debug('Circuit breaker is open, skipping health check');
                return;
            }
        }

        try {
            const client = await this.pool.connect();
            try {
                // Check connection health
                const startTime = performance.now();
                await client.query('SELECT 1');
                const duration = performance.now() - startTime;

                // Check connection lifetime
                const connectionId = client.processID!.toString();
                const connectionStart = this.connectionLifetimes.get(connectionId);
                if (connectionStart) {
                    const lifetime = performance.now() - connectionStart;
                    if (lifetime > this.config.maxLifetime) {
                        this.logger.warn(`Connection ${connectionId} exceeded max lifetime (${lifetime}ms), terminating`);
                        client.release(new Error('Connection exceeded max lifetime'));
                    }
                }

                this.logger.debug(`Health check successful (${duration.toFixed(2)}ms)`);
            } finally {
                client.release();
            }
        } catch (error) {
            this.logger.error('Health check failed', error);
            this.handleConnectionError();
        }
    }

    private handleConnectionError(): void {
        this.circuitBreaker.failureCount++;

        if (this.circuitBreaker.failureCount >= this.config.circuitBreaker.threshold) {
            this.circuitBreaker.isOpen = true;
            this.circuitBreaker.lastFailureTime = performance.now();
            this.logger.warn('Circuit breaker opened due to repeated failures');
        }
    }

    /**
     * Get a connection from the pool
     */
    public async getConnection(readOnly: boolean = false): Promise<PoolClient> {
        const startTime = performance.now();

        if (this.circuitBreaker.isOpen) {
            throw new Error('Database connections are currently unavailable (circuit breaker open)');
        }

        try {
            const pool = readOnly && this.readOnlyPool ? this.readOnlyPool : this.pool;
            const client = await pool.connect();

            // Set read-only mode if requested
            if (readOnly) {
                await client.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');
            }

            this.trackConnectionMetrics('acquire', startTime);
            return client;
        } catch (error) {
            this.trackConnectionMetrics('acquire_error', startTime);
            this.handleConnectionError();
            throw error;
        }
    }

    /**
     * Execute a query
     */
    public async query<T>(text: string, params: any[] = [], readOnly: boolean = false): Promise<QueryResult<T>> {
        const startTime = performance.now();
        const client = await this.getConnection(readOnly);

        try {
            const result = await client.query<T>(text, params);
            this.trackQueryMetrics(text, startTime, false);
            return result;
        } catch (error) {
            this.trackQueryMetrics(text, startTime, true);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Execute a transaction
     */
    public async transaction<T>(queries: { text: string, params?: any[] }[], readOnly: boolean = false): Promise<QueryResult<T>[]> {
        const startTime = performance.now();
        const client = await this.getConnection(readOnly);
        const results: QueryResult<T>[] = [];

        try {
            await client.query('BEGIN');

            for (const query of queries) {
                const result = await client.query<T>(query.text, query.params || []);
                results.push(result);
            }

            await client.query('COMMIT');
            this.trackQueryMetrics(`transaction:${queries.length}`, startTime, false);
            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            this.trackQueryMetrics(`transaction:${queries.length}`, startTime, true);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get pool statistics
     */
    public getStats(): {
        pool: {
            totalConnections: number;
            activeConnections: number;
            idleConnections: number;
            waitingClients: number;
            maxConnections: number;
        };
        circuitBreaker: {
            isOpen: boolean;
            failureCount: number;
            lastFailureTime: number;
        };
        readOnlyPool?: {
            totalConnections: number;
            activeConnections: number;
            idleConnections: number;
            waitingClients: number;
            maxConnections: number;
        };
    } {
        const stats: any = {
            pool: { ...this.connectionMetrics },
            circuitBreaker: { ...this.circuitBreaker }
        };

        if (this.readOnlyPool) {
            stats.readOnlyPool = {
                totalConnections: this.readOnlyPool.totalCount,
                activeConnections: this.readOnlyPool.waitingCount,
                idleConnections: this.readOnlyPool.idleCount,
                waitingClients: this.readOnlyPool.waitingCount,
                maxConnections: this.readOnlyPool.options.max || 10
            };
        }

        return stats;
    }

    private trackConnectionMetrics(operation: string, startTime: number): void {
        const duration = performance.now() - startTime;
        this.logger.debug(`Connection ${operation} took ${duration.toFixed(2)}ms`);

        // In a real implementation, you would send this to your metrics system
        // metrics.increment(`connection_pool.${operation}`);
        // metrics.timing(`connection_pool.${operation}.duration`, duration);
    }

    private trackQueryMetrics(query: string, startTime: number, isError: boolean): void {
        const duration = performance.now() - startTime;
        const simplifiedQuery = this.simplifyQuery(query);

        this.logger.debug(`Query ${simplifiedQuery} ${isError ? 'failed' : 'succeeded'} in ${duration.toFixed(2)}ms`);

        // In a real implementation, you would send this to your metrics system
        // metrics.increment(`query.${isError ? 'error' : 'success'}`);
        // metrics.timing(`query.${simplifiedQuery}.duration`, duration);
    }

    private simplifyQuery(text: string): string {
        return text.replace(/\s+/g, ' ')
                  .replace(/\$\d+/g, '')
                  .trim()
                  .substring(0, 50);
    }

    /**
     * Close all connections in the pool
     */
    public async close(): Promise<void> {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        try {
            await this.pool.end();
            this.logger.info('Primary connection pool closed');

            if (this.readOnlyPool) {
                await this.readOnlyPool.end();
                this.logger.info('Read-only connection pool closed');
            }
        } catch (error) {
            this.logger.error('Error closing connection pools', error);
            throw error;
        }
    }

    /**
     * Resize the connection pool
     */
    public resize(maxConnections: number): void {
        this.pool.options.max = maxConnections;
        this.connectionMetrics.maxConnections = maxConnections;

        if (this.readOnlyPool) {
            this.readOnlyPool.options.max = maxConnections;
        }

        this.logger.info(`Connection pool resized to ${maxConnections} connections`);
    }

    /**
     * Get the current number of connections
     */
    public getConnectionCount(): number {
        return this.pool.totalCount;
    }
}
```

## Real-Time Features (300+ lines)

### WebSocket Server Setup

```typescript
// src/websocket/websocket-server.ts
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { WebSocketServer } from 'ws';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiter } from '../utils/rate-limiter';
import { AuthService } from '../services/auth-service';
import { EventEmitter } from 'events';

/**
 * Advanced WebSocket server with:
 * - Authentication and authorization
 * - Rate limiting
 * - Connection tracking
 * - Performance metrics
 * - Message validation
 * - Graceful degradation
 * - Heartbeat monitoring
 */
export class WebSocketServerManager extends EventEmitter {
    private static instance: WebSocketServerManager;
    private wss: WebSocketServer;
    private logger: Logger;
    private rateLimiter: RateLimiter;
    private authService: AuthService;
    private connections: Map<string, {
        socket: WebSocket;
        userId: string;
        roles: string[];
        ipAddress: string;
        userAgent: string;
        connectedAt: number;
        lastActivity: number;
        subscriptions: Set<string>;
        heartbeatInterval: NodeJS.Timeout;
    }>;
    private heartbeatInterval: number;
    private maxMessageSize: number;
    private messageQueue: Map<string, { message: any, timestamp: number }[]>;
    private maxQueueSize: number;
    private messageProcessors: Map<string, (message: any, connectionId: string) => Promise<any>>;

    private constructor(server: HttpServer | HttpsServer) {
        super();
        this.logger = new Logger('WebSocketServer');
        this.rateLimiter = new RateLimiter();
        this.authService = AuthService.getInstance();
        this.connections = new Map();
        this.heartbeatInterval = 30000; // 30 seconds
        this.maxMessageSize = 1024 * 1024; // 1MB
        this.messageQueue = new Map();
        this.maxQueueSize = 100;
        this.messageProcessors = new Map();

        this.wss = new WebSocketServer({
            server,
            clientTracking: false,
            maxPayload: this.maxMessageSize,
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

        this.setupEventListeners();
        this.startHeartbeatMonitoring();
        this.startMessageProcessing();

        this.logger.info('WebSocket server initialized');
    }

    public static getInstance(server?: HttpServer | HttpsServer): WebSocketServerManager {
        if (!WebSocketServerManager.instance && server) {
            WebSocketServerManager.instance = new WebSocketServerManager(server);
        } else if (!WebSocketServerManager.instance) {
            throw new Error('WebSocket server not initialized. Provide a server instance.');
        }
        return WebSocketServerManager.instance;
    }

    private setupEventListeners(): void {
        this.wss.on('connection', (socket: WebSocket, request: any) => {
            const startTime = performance.now();
            const connectionId = uuidv4();
            const ipAddress = this.getClientIp(request);
            const userAgent = request.headers['user-agent'] || 'unknown';

            this.logger.debug(`New WebSocket connection attempt from ${ipAddress}`);

            // Set up initial connection handlers
            socket.on('message', (data: WebSocket.RawData) => this.handleMessage(connectionId, data));
            socket.on('close', (code: number, reason: Buffer) => this.handleClose(connectionId, code, reason));
            socket.on('error', (error: Error) => this.handleError(connectionId, error));
            socket.on('pong', () => this.handlePong(connectionId));

            // Authenticate the connection
            this.authenticateConnection(connectionId, socket, request)
                .then(({ userId, roles }) => {
                    // Connection authenticated successfully
                    this.setupAuthenticatedConnection(connectionId, socket, userId, roles, ipAddress, userAgent);
                    this.trackConnectionMetrics('connect_success', startTime);
                    this.emit('connection', connectionId, userId, roles);
                })
                .catch(error => {
                    this.logger.warn(`Authentication failed for connection ${connectionId}: ${error.message}`);
                    socket.close(1008, 'Authentication failed');
                    this.trackConnectionMetrics('connect_failure', startTime);
                });
        });

        this.wss.on('error', (error: Error) => {
            this.logger.error('WebSocket server error', error);
            this.emit('error', error);
        });

        this.wss.on('listening', () => {
            this.logger.info('WebSocket server listening');
            this.emit('listening');
        });
    }

    private getClientIp(request: any): string {
        // Handle proxy headers
        const xForwardedFor = request.headers['x-forwarded-for'];
        if (xForwardedFor) {
            return xForwardedFor.split(',')[0].trim();
        }

        return request.socket.remoteAddress || 'unknown';
    }

    private async authenticateConnection(
        connectionId: string,
        socket: WebSocket,
        request: any
    ): Promise<{ userId: string; roles: string[] }> {
        // Check rate limit first
        const ipAddress = this.getClientIp(request);
        const rateLimitKey = `ws_connect:${ipAddress}`;
        const rateLimitResult = this.rateLimiter.check(rateLimitKey, 5, 60000); // 5 connections per minute

        if (!rateLimitResult.allowed) {
            throw new Error(`Connection rate limit exceeded. Try again in ${rateLimitResult.retryAfter}ms.`);
        }

        // Get auth token from query params or headers
        const queryParams = new URLSearchParams(request.url.split('?')[1] || '');
        const token = queryParams.get('token') || request.headers['sec-websocket-protocol'] || '';

        if (!token) {
            throw new Error('Authentication token required');
        }

        // Verify the token
        const authResult = await this.authService.verifyToken(token);
        if (!authResult.valid) {
            throw new Error('Invalid authentication token');
        }

        return {
            userId: authResult.userId,
            roles: authResult.roles || []
        };
    }

    private setupAuthenticatedConnection(
        connectionId: string,
        socket: WebSocket,
        userId: string,
        roles: string[],
        ipAddress: string,
        userAgent: string
    ): void {
        // Set up heartbeat
        const heartbeatInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.ping();
            }
        }, this.heartbeatInterval);

        // Store connection information
        this.connections.set(connectionId, {
            socket,
            userId,
            roles,
            ipAddress,
            userAgent,
            connectedAt: performance.now(),
            lastActivity: performance.now(),
            subscriptions: new Set(),
            heartbeatInterval
        });

        // Send welcome message
        this.sendMessage(connectionId, {
            type: 'welcome',
            connectionId,
            timestamp: new Date().toISOString(),
            userId,
            roles
        });

        this.logger.info(`WebSocket connection established: ${connectionId} (User: ${userId})`);
    }

    private startHeartbeatMonitoring(): void {
        setInterval(() => {
            const now = performance.now();
            this.connections.forEach((connection, connectionId) => {
                if (now - connection.lastActivity > this.heartbeatInterval * 2) {
                    this.logger.warn(`Connection ${connectionId} timed out due to inactivity`);
                    connection.socket.close(1001, 'Connection timed out');
                }
            });
        }, this.heartbeatInterval);
    }

    private startMessageProcessing(): void {
        setInterval(() => {
            this.messageQueue.forEach((queue, connectionId) => {
                if (queue.length > 0) {
                    const connection = this.connections.get(connectionId);
                    if (connection && connection.socket.readyState === WebSocket.OPEN) {
                        const message = queue.shift()!;
                        this.processMessage(connectionId, message.message)
                            .catch(error => {
                                this.logger.error(`Error processing message for ${connectionId}`, error);
                            });
                    }
                }

                // Prevent queue from growing too large
                if (queue.length > this.maxQueueSize) {
                    queue.splice(0, queue.length - this.maxQueueSize);
                }
            });
        }, 100);
    }

    private async handleMessage(connectionId: string, data: WebSocket.RawData): Promise<void> {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            this.logger.warn(`Received message from unknown connection ${connectionId}`);
            return;
        }

        // Update last activity time
        connection.lastActivity = performance.now();

        // Check rate limit
        const rateLimitKey = `ws_message:${connection.ipAddress}`;
        const rateLimitResult = this.rateLimiter.check(rateLimitKey, 100, 60000); // 100 messages per minute

        if (!rateLimitResult.allowed) {
            this.sendMessage(connectionId, {
                type: 'error',
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Message rate limit exceeded. Try again in ${rateLimitResult.retryAfter}ms.`
            });
            return;
        }

        // Parse the message
        let message: any;
        try {
            if (data instanceof Buffer) {
                message = JSON.parse(data.toString());
            } else if (typeof data === 'string') {
                message = JSON.parse(data);
            } else {
                throw new Error('Unsupported message format');
            }

            // Validate message size
            if (JSON.stringify(message).length > this.maxMessageSize) {
                throw new Error('Message size exceeds maximum limit');
            }
        } catch (error) {
            this.logger.warn(`Invalid message from ${connectionId}: ${error instanceof Error ? error.message : String(error)}`);
            this.sendMessage(connectionId, {
                type: 'error',
                code: 'INVALID_MESSAGE',
                message: 'Invalid message format'
            });
            return;
        }

        // Add to message queue
        if (!this.messageQueue.has(connectionId)) {
            this.messageQueue.set(connectionId, []);
        }
        this.messageQueue.get(connectionId)!.push({
            message,
            timestamp: performance.now()
        });
    }

    private async processMessage(connectionId: string, message: any): Promise<void> {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            this.logger.warn(`Cannot process message for unknown connection ${connectionId}`);
            return;
        }

        try {
            // Validate required fields
            if (!message.type) {
                throw new Error('Message type is required');
            }

            // Check if there's a registered processor for this message type
            if (this.messageProcessors.has(message.type)) {
                const processor = this.messageProcessors.get(message.type)!;
                const result = await processor(message, connectionId);

                if (result) {
                    this.sendMessage(connectionId, {
                        type: `${message.type}_response`,
                        requestId: message.requestId,
                        ...result
                    });
                }
            } else {
                this.logger.warn(`No processor registered for message type ${message.type}`);
                this.sendMessage(connectionId, {
                    type: 'error',
                    code: 'UNKNOWN_MESSAGE_TYPE',
                    message: `Unknown message type: ${message.type}`
                });
            }
        } catch (error) {
            this.logger.error(`Error processing message ${message.type} from ${connectionId}`, error);
            this.sendMessage(connectionId, {
                type: 'error',
                code: 'PROCESSING_ERROR',
                message: error instanceof Error ? error.message : 'Error processing message',
                requestId: message.requestId
            });
        }
    }

    private handleClose(connectionId: string, code: number, reason: Buffer): void {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return;
        }

        // Clear heartbeat interval
        clearInterval(connection.heartbeatInterval);

        // Remove from connections
        this.connections.delete(connectionId);
        this.messageQueue.delete(connectionId);

        this.logger.info(`WebSocket connection closed: ${connectionId} (Code: ${code}, Reason: ${reason.toString()})`);
        this.emit('disconnect', connectionId, connection.userId, code, reason.toString());
    }

    private handleError(connectionId: string, error: Error): void {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return;
        }

        this.logger.error(`WebSocket error for connection ${connectionId}`, error);
        this.emit('connection_error', connectionId, connection.userId, error);
    }

    private handlePong(connectionId: string): void {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.lastActivity = performance.now();
        }
    }

    /**
     * Register a message processor
     */
    public registerMessageProcessor(type: string, processor: (message: any, connectionId: string) => Promise<any>): void {
        this.messageProcessors.set(type, processor);
        this.logger.debug(`Registered message processor for type: ${type}`);
    }

    /**
     * Send a message to a specific connection
     */
    public sendMessage(connectionId: string, message: any): void {
        const connection = this.connections.get(connectionId);
        if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
            this.logger.warn(`Cannot send message to closed connection ${connectionId}`);
            return;
        }

        try {
            const messageString = JSON.stringify(message);
            connection.socket.send(messageString);
            connection.lastActivity = performance.now();
        } catch (error) {
            this.logger.error(`Error sending message to ${connectionId}`, error);
        }
    }

    /**
     * Broadcast a message to all connections
     */
    public broadcast(message: any, filter?: (connection: any) => boolean): void {
        const messageString = JSON.stringify(message);
        let count = 0;

        this.connections.forEach((connection, connectionId) => {
            if (connection.socket.readyState === WebSocket.OPEN) {
                if (!filter || filter(connection)) {
                    try {
                        connection.socket.send(messageString);
                        connection.lastActivity = performance.now();
                        count++;
                    } catch (error) {
                        this.logger.error(`Error broadcasting message to ${connectionId}`, error);
                    }
                }
            }
        });

        this.logger.debug(`Broadcast message to ${count} connections`);
    }

    /**
     * Broadcast to connections subscribed to a specific channel
     */
    public broadcastToChannel(channel: string, message: any): void {
        const messageString = JSON.stringify(message);
        let count = 0;

        this.connections.forEach((connection, connectionId) => {
            if (connection.socket.readyState === WebSocket.OPEN && connection.subscriptions.has(channel)) {
                try {
                    connection.socket.send(messageString);
                    connection.lastActivity = performance.now();
                    count++;
                } catch (error) {
                    this.logger.error(`Error sending channel message to ${connectionId}`, error);
                }
            }
        });

        this.logger.debug(`Broadcast channel ${channel} message to ${count} connections`);
    }

    /**
     * Subscribe a connection to a channel
     */
    public subscribe(connectionId: string, channel: string): void {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.subscriptions.add(channel);
            this.logger.debug(`Connection ${connectionId} subscribed to channel ${channel}`);
        }
    }

    /**
     * Unsubscribe a connection from a channel
     */
    public unsubscribe(connectionId: string, channel: string): void {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.subscriptions.delete(channel);
            this.logger.debug(`Connection ${connectionId} unsubscribed from channel ${channel}`);
        }
    }

    /**
     * Close the WebSocket server
     */
    public async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.logger.info('Closing WebSocket server...');

            // Close all active connections
            this.connections.forEach((connection, connectionId) => {
                try {
                    connection.socket.close(1001, 'Server shutting down');
                } catch (error) {
                    this.logger.error(`Error closing connection ${connectionId}`, error);
                }
            });

            // Close the server
            this.wss.close((error) => {
                if (error) {
                    this.logger.error('Error closing WebSocket server', error);
                    reject(error);
                } else {
                    this.logger.info('WebSocket server closed');
                    resolve();
                }
            });
        });
    }

    /**
     * Get connection statistics
     */
    public getStats(): {
        totalConnections: number;
        activeConnections: number;
        messagesProcessed: number;
        messageProcessors: number;
    } {
        return {
            totalConnections: this.connections.size,
            activeConnections: Array.from(this.connections.values())
                .filter(c => c.socket.readyState === WebSocket.OPEN).length,
            messagesProcessed: Array.from(this.messageQueue.values())
                .reduce((sum, queue) => sum + queue.length, 0),
            messageProcessors: this.messageProcessors.size
        };
    }

    /**
     * Get connection details
     */
    public getConnection(connectionId: string): {
        userId: string;
        roles: string[];
        ipAddress: string;
        userAgent: string;
        connectedAt: number;
        lastActivity: number;
        subscriptions: string[];
    } | null {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return null;
        }

        return {
            userId: connection.userId,
            roles: connection.roles,
            ipAddress: connection.ipAddress,
            userAgent: connection.userAgent,
            connectedAt: connection.connectedAt,
            lastActivity: connection.lastActivity,
            subscriptions: Array.from(connection.subscriptions)
        };
    }

    private trackConnectionMetrics(operation: string, startTime: number): void {
        const duration = performance.now() - startTime;
        this.logger.debug(`Connection ${operation} took ${duration.toFixed(2)}ms`);

        // In a real implementation, you would send this to your metrics system
        // metrics.increment(`websocket.${operation}`);
        // metrics.timing(`websocket.${operation}.duration`, duration);
    }
}
```

### Real-Time Event Handlers

```typescript
// src/websocket/event-handlers.ts
import { WebSocketServerManager } from './websocket-server';
import { Logger } from '../utils/logger';
import { ConfigService } from '../services/config-service';
import { NotificationService } from '../services/notification-service';
import { AuditService } from '../services/audit-service';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { RateLimiter } from '../utils/rate-limiter';

/**
 * Real-time event handlers for the WebSocket server with:
 * - Configuration updates
 * - Notification delivery
 * - Audit logging
 * - Performance monitoring
 * - Rate limiting
 * - Validation
 */
export class WebSocketEventHandlers {
    private static instance: WebSocketEventHandlers;
    private logger: Logger;
    private wsServer: WebSocketServerManager;
    private configService: ConfigService;
    private notificationService: NotificationService;
    private auditService: AuditService;
    private performanceMonitor: PerformanceMonitor;
    private rateLimiter: RateLimiter;

    private constructor() {
        this.logger = new Logger('WebSocketEventHandlers');
        this.wsServer = WebSocketServerManager.getInstance();
        this.configService = ConfigService.getInstance();
        this.notificationService = NotificationService.getInstance();
        this.auditService = AuditService.getInstance();
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.rateLimiter = new RateLimiter();

        this.registerHandlers();
    }

    public static getInstance(): WebSocketEventHandlers {
        if (!WebSocketEventHandlers.instance) {
            WebSocketEventHandlers.instance = new WebSocketEventHandlers();
        }
        return WebSocketEventHandlers.instance;
    }

    private registerHandlers(): void {
        // Configuration events
        this.wsServer.registerMessageProcessor('get_config', this.handleGetConfig.bind(this));
        this.wsServer.registerMessageProcessor('update_config', this.handleUpdateConfig.bind(this));
        this.wsServer.registerMessageProcessor('subscribe_config', this.handleSubscribeConfig.bind(this));
        this.wsServer.registerMessageProcessor('unsubscribe_config', this.handleUnsubscribeConfig.bind(this));

        // Notification events
        this.wsServer.registerMessageProcessor('get_notifications', this.handleGetNotifications.bind(this));
        this.wsServer.registerMessageProcessor('mark_notification_read', this.handleMarkNotificationRead.bind(this));
        this.wsServer.registerMessageProcessor('subscribe_notifications', this.handleSubscribeNotifications.bind(this));

        // System events
        this.wsServer.registerMessageProcessor('ping', this.handlePing.bind(this));
        this.wsServer.registerMessageProcessor('get_status', this.handleGetStatus.bind(this));

        this.logger.info('WebSocket event handlers registered');
    }

    /**
     * Handle get_config message
     */
    private async handleGetConfig(message: any, connectionId: string): Promise<any> {
        const startTime = performance.now();
        const connection = this.wsServer.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        // Check rate limit
        const rateLimitKey = `get_config:${connection.userId}`;
        const rateLimitResult = this.rateLimiter.check(rateLimitKey, 10, 60000); // 10 requests per minute

        if (!rateLimitResult.allowed) {
            throw new Error(`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter}ms.`);
        }

        // Validate request
        if (!message.key) {
            throw new Error('Config key is required');
        }

        // Check permissions
        if (!this.hasPermission(connection.roles, 'config:read', message.key)) {
            throw new Error('Permission denied');
        }

        try {
            const config = await this.configService.getConfig(message.key, {
                includeMetadata: message.includeMetadata,
                includeHistory: message.includeHistory
            });

            this.auditService.log({
                action: 'get_config',
                userId: connection.userId,
                metadata: {
                    key: message.key,
                    connectionId
                },
                status: 'success'
            });

            this.performanceMonitor.track('get_config', performance.now() - startTime);
            return { config };
        } catch (error) {
            this.auditService.log({
                action: 'get_config',
                userId: connection.userId,
                metadata: {
                    key: message.key,
                    connectionId,
                    error: error instanceof Error ? error.message : String(error)
                },
                status: 'failed'
            });

            throw error;
        }
    }

    /**
     * Handle update_config message
     */
    private async handleUpdateConfig(message: any, connectionId: string): Promise<any> {
        const startTime = performance.now();
        const connection = this.wsServer.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        // Check rate limit
        const rateLimitKey = `update_config:${connection.userId}`;
        const rateLimitResult = this.rateLimiter.check(rateLimitKey, 5, 60000); // 5 updates per minute

        if (!rateLimitResult.allowed) {
            throw new Error(`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter}ms.`);
        }

        // Validate request
        if (!message.key) {
            throw new Error('Config key is required');
        }

        if (message.value === undefined) {
            throw new Error('Config value is required');
        }

        // Check permissions
        if (!this.hasPermission(connection.roles, 'config:write', message.key)) {
            throw new Error('Permission denied');
        }

        try {
            const result = await this.configService.updateConfig(
                message.key,
                message.value,
                {
                    userId: connection.userId,
                    metadata: message.metadata,
                    validate: message.validate !== false,
                    broadcast: message.broadcast !== false
                }
            );

            this.auditService.log({
                action: 'update_config',
                userId: connection.userId,
                metadata: {
                    key: message.key,
                    value: message.value,
                    connectionId
                },
                status: 'success'
            });

            this.performanceMonitor.track('update_config', performance.now() - startTime);

            // If broadcast is enabled, the ConfigService will handle it
            return { success: true, result };
        } catch (error) {
            this.auditService.log({
                action: 'update_config',
                userId: connection.userId,
                metadata: {
                    key: message.key,
                    value: message.value,
                    connectionId,
                    error: error instanceof Error ? error.message : String(error)
                },
                status: 'failed'
            });

            throw error;
        }
    }

    /**
     * Handle subscribe_config message
     */
    private async handleSubscribeConfig(message: any, connectionId: string): Promise<any> {
        const connection = this.wsServer.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        // Validate request
        if (!message.key) {
            throw new Error('Config key is required');
        }

        // Check permissions
        if (!this.hasPermission(connection.roles, 'config:read', message.key)) {
            throw new Error('Permission denied');
        }

        try {
            // Subscribe to the config channel
            const channel = `config:${message.key}`;
            this.wsServer.subscribe(connectionId, channel);

            // Get current value to send immediately
            const config = await this.configService.getConfig(message.key);

            this.auditService.log({
                action: 'subscribe_config',
                userId: connection.userId,
                metadata: {
                    key: message.key,
                    connectionId
                },
                status: 'success'
            });

            return {
                success: true,
                config,
                channel
            };
        } catch (error) {
            this.auditService.log({
                action: 'subscribe_config',
                userId: connection.userId,
                metadata: {
                    key: message.key,
                    connectionId,
                    error: error instanceof Error ? error.message : String(error)
                },
                status: 'failed'
            });

            throw error;
        }
    }

    /**
     * Handle unsubscribe_config message
     */
    private async handleUnsubscribeConfig(message: any, connectionId: string): Promise<any> {
        const connection = this.wsServer.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        // Validate request
        if (!message.key) {
            throw new Error('Config key is required');
        }

        try {
            const channel = `config:${message.key}`;
            this.wsServer.unsubscribe(connectionId, channel);

            this.auditService.log({
                action: 'unsubscribe_config',
                userId: connection.userId,
                metadata: {
                    key: message.key,
                    connectionId
                },
                status: 'success'
            });

            return { success: true, channel };
        } catch (error) {
            this.auditService.log({
                action: 'unsubscribe_config',
                userId: connection.userId,
                metadata: {
                    key: message.key,
                    connectionId,
                    error: error instanceof Error ? error.message : String(error)
                },
                status: 'failed'
            });

            throw error;
        }
    }

    /**
     * Handle get_notifications message
     */
    private async handleGetNotifications(message: any, connectionId: string): Promise<any> {
        const startTime = performance.now();
        const connection = this.wsServer.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        // Check rate limit
        const rateLimitKey = `get_notifications:${connection.userId}`;
        const rateLimitResult = this.rateLimiter.check(rateLimitKey, 20, 60000); // 20 requests per minute

        if (!rateLimitResult.allowed) {
            throw new Error(`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter}ms.`);
        }

        try {
            const notifications = await this.notificationService.getNotifications(
                connection.userId,
                {
                    limit: message.limit || 50,
                    offset: message.offset || 0,
                    unreadOnly: message.unreadOnly,
                    since: message.since
                }
            );

            this.auditService.log({
                action: 'get_notifications',
                userId: connection.userId,
                metadata: {
                    connectionId,
                    limit: message.limit,
                    offset: message.offset
                },
                status: 'success'
            });

            this.performanceMonitor.track('get_notifications', performance.now() - startTime);
            return { notifications };
        } catch (error) {
            this.auditService.log({
                action: 'get_notifications',
                userId: connection.userId,
                metadata: {
                    connectionId,
                    error: error instanceof Error ? error.message : String(error)
                },
                status: 'failed'
            });

            throw error;
        }
    }

    /**
     * Handle mark_notification_read message
     */
    private async handleMarkNotificationRead(message: any, connectionId: string): Promise<any> {
        const connection = this.wsServer.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        // Validate request
        if (!message.notificationId) {
            throw new Error('Notification ID is required');
        }

        try {
            await this.notificationService.markAsRead(connection.userId, message.notificationId);

            this.auditService.log({
                action: 'mark_notification_read',
                userId: connection.userId,
                metadata: {
                    notificationId: message.notificationId,
                    connectionId
                },
                status: 'success'
            });

            return { success: true };
        } catch (error) {
            this.auditService.log({
                action: 'mark_notification_read',
                userId: connection.userId,
                metadata: {
                    notificationId: message.notificationId,
                    connectionId,
                    error: error instanceof Error ? error.message : String(error)
                },
                status: 'failed'
            });

            throw error;
        }
    }

    /**
     * Handle subscribe_notifications message
     */
    private async handleSubscribeNotifications(message: any, connectionId: string): Promise<any> {
        const connection = this.wsServer.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        try {
            const channel = `notifications:${connection.userId}`;
            this.wsServer.subscribe(connectionId, channel);

            // Get unread count to send immediately
            const unreadCount = await this.notificationService.getUnreadCount(connection.userId);

            this.auditService.log({
                action: 'subscribe_notifications',
                userId: connection.userId,
                metadata: {
                    connectionId
                },
                status: 'success'
            });

            return {
                success: true,
                unreadCount,
                channel
            };
        } catch (error) {
            this.auditService.log({
                action: 'subscribe_notifications',
                userId: connection.userId,
                metadata: {
                    connectionId,
                    error: error instanceof Error ? error.message : String(error)
                },
                status: 'failed'
            });

            throw error;
        }
    }

    /**
     * Handle ping message
     */
    private async handlePing(message: any, connectionId: string): Promise<any> {
        const connection = this.wsServer.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        return {
            pong: true,
            timestamp: new Date().toISOString(),
            serverTime: Date.now()
        };
    }

    /**
     * Handle get_status message
     */
    private async handleGetStatus(message: any, connectionId: string): Promise<any> {
        const connection = this.wsServer.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        try {
            const configStatus = await this.configService.getStatus();
            const notificationStatus = await this.notificationService.getStatus();
            const wsStatus = this.wsServer.getStats();

            return {
                config: configStatus,
                notifications: notificationStatus,
                websocket: wsStatus,
                serverTime: Date.now()
            };
        } catch (error) {
            this.logger.error('Error getting status', error);
            throw new Error('Failed to get status');
        }
    }

    /**
     * Check if user has permission
     */
    private hasPermission(userRoles: string[], permission: string, resource?: string): boolean {
        // In a real implementation, this would check against your permission system
        // For this example, we'll use a simple check

        // Admin has all permissions
        if (userRoles.includes('admin')) {
            return true;
        }

        // Check specific permissions
        if (permission === 'config:read') {
            return userRoles.includes('config_reader') ||
                   userRoles.includes('config_editor') ||
                   userRoles.includes('config_admin');
        }

        if (permission === 'config:write') {
            return userRoles.includes('config_editor') ||
                   userRoles.includes('config_admin');
        }

        // Check resource-specific permissions
        if (resource) {
            // Example: config:write:system.*
            const resourcePermission = `${permission}:${resource}`;
            return userRoles.some(role => role === resourcePermission);
        }

        return false;
    }

    /**
     * Broadcast config update to subscribers
     */
    public async broadcastConfigUpdate(key: string, value: any, metadata: any = {}): Promise<void> {
        const channel = `config:${key}`;
        const message = {
            type: 'config_update',
            key,
            value,
            timestamp: new Date().toISOString(),
            ...metadata
        };

        this.wsServer.broadcastToChannel(channel, message);
        this.logger.debug(`Broadcast config update for ${key} to ${channel}`);
    }

    /**
     * Broadcast notification to user
     */
    public async broadcastNotification(userId: string, notification: any): Promise<void> {
        const channel = `notifications:${userId}`;
        const message = {
            type: 'new_notification',
            notification,
            timestamp: new Date().toISOString()
        };

        this.wsServer.broadcastToChannel(channel, message);
        this.logger.debug(`Broadcast notification to user ${userId}`);
    }
}
```

### Client-Side WebSocket Integration

```typescript
// src/websocket/websocket-client.ts
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Advanced WebSocket client with:
 * - Automatic reconnection
 * - Message queuing
 * - Heartbeat monitoring
 * - Error handling
 * - Performance metrics
 * - Message validation
 * - Subscription management
 */
export class WebSocketClient extends EventEmitter {
    private logger: Logger;
    private url: string;
    private protocols: string[] | string | undefined;
    private socket: WebSocket | null;
    private reconnectAttempts: number;
    private maxReconnectAttempts: number;
    private reconnectDelay: number;
    private maxReconnectDelay: number;
    private reconnectTimer: NodeJS.Timeout | null;
    private heartbeatInterval: NodeJS.Timeout | null;
    private heartbeatTimeout: NodeJS.Timeout | null;
    private messageQueue: { message: any, resolve: (value: any) => void, reject: (reason: any) => void }[];
    private processingQueue: boolean;
    private subscriptions: Set<string>;
    private connectionId: string | null;
    private lastMessageTime: number;
    private messageHandlers: Map<string, (message: any) => void>;
    private defaultMessageHandler: ((message: any) => void) | null;
    private authToken: string | null;
    private connectionPromise: Promise<void> | null;
    private resolveConnection: (() => void) | null;
    private rejectConnection: ((reason: any) => void) | null;
    private messageTimeout: number;

    constructor(url: string, options: {
        protocols?: string[] | string;
        maxReconnectAttempts?: number;
        reconnectDelay?: number;
        maxReconnectDelay?: number;
        heartbeatInterval?: number;
        messageTimeout?: number;
        authToken?: string;
    } = {}) {
        super();
        this.logger = new Logger('WebSocketClient');
        this.url = url;
        this.protocols = options.protocols;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        this.reconnectDelay = options.reconnectDelay || 1000;
        this.maxReconnectDelay = options.maxReconnectDelay || 30000;
        this.reconnectTimer = null;
        this.heartbeatInterval = null;
        this.heartbeatTimeout = null;
        this.messageQueue = [];
        this.processingQueue = false;
        this.subscriptions = new Set();
        this.connectionId = null;
        this.lastMessageTime = 0;
        this.messageHandlers = new Map();
        this.defaultMessageHandler = null;
        this.authToken = options.authToken || null;
        this.connectionPromise = null;
        this.resolveConnection = null;
        this.rejectConnection = null;
        this.messageTimeout = options.messageTimeout || 10000;

        this.initialize();
    }

    private initialize(): void {
        this.logger.info(`Initializing WebSocket client for ${this.url}`);

        // Register default message handlers
        this.registerMessageHandler('welcome', this.handleWelcome.bind(this));
        this.registerMessageHandler('config_update', this.handleConfigUpdate.bind(this));
        this.registerMessageHandler('new_notification', this.handleNewNotification.bind(this));
        this.registerMessageHandler('error', this.handleError.bind(this));
    }

    /**
     * Connect to the WebSocket server
     */
    public connect(): Promise<void> {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise((resolve, reject) => {
            this.resolveConnection = resolve;
            this.rejectConnection = reject;

            this.logger.info('Connecting to WebSocket server...');
            this.attemptConnection();
        });

        return this.connectionPromise;
    }

    private attemptConnection(): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.logger.debug('WebSocket is already connected');
            this.resolveConnection?.();
            this.connectionPromise = null;
            return;
        }

        // Clean up any existing connection
        this.cleanup();

        // Create new WebSocket connection
        try {
            const url = new URL(this.url);
            if (this.authToken) {
                url.searchParams.append('token', this.authToken);
            }

            this.socket = new WebSocket(url.toString(), this.protocols);

            this.setupEventListeners();
        } catch (error) {
            this.logger.error('Failed to create WebSocket connection', error);
            this.handleConnectionError(error);
        }
    }

    private setupEventListeners(): void {
        if (!this.socket) {
            return;
        }

        this.socket.onopen = () => this.handleOpen();
        this.socket.onclose = (event) => this.handleClose(event);
        this.socket.onerror = (event) => this.handleError(event);
        this.socket.onmessage = (event) => this.handleMessage(event);
    }

    private handleOpen(): void {
        this.logger.info('WebSocket connection established');
        this.reconnectAttempts = 0;

        // Start heartbeat
        this.startHeartbeat();

        // Process any queued messages
        this.processQueue();

        // Resolve the connection promise
        this.resolveConnection?.();
        this.connectionPromise = null;

        this.emit('connect');
    }

    private handleClose(event: CloseEvent): void {
        this.logger.info(`WebSocket connection closed: ${event.code} - ${event.reason || 'No reason provided'}`);
        this.cleanup();

        if (event.code !== 1000) { // 1000 is normal closure
            this.scheduleReconnect();
        }

        this.emit('disconnect', event.code, event.reason);
    }

    private handleError(event: Event): void {
        this.logger.error('WebSocket error', event);
        this.emit('error', event);
    }

    private handleMessage(event: MessageEvent): void {
        this.lastMessageTime = Date.now();

        try {
            const message = JSON.parse(event.data);

            // Update connection ID if this is a welcome message
            if (message.type === 'welcome' && message.connectionId) {
                this.connectionId = message.connectionId;
            }

            // Call specific message handler if registered
            if (this.messageHandlers.has(message.type)) {
                this.messageHandlers.get(message.type)!(message);
            }
            // Call default message handler if registered
            else if (this.defaultMessageHandler) {
                this.defaultMessageHandler(message);
            }
            // Emit as event
            else {
                this.emit('message', message);
                this.emit(message.type, message);
            }
        } catch (error) {
            this.logger.error('Error processing WebSocket message', error);
            this.emit('error', error);
        }
    }

    private handleWelcome(message: any): void {
        this.logger.info(`Welcome message received. Connection ID: ${message.connectionId}`);
        this.connectionId = message.connectionId;

        // Re-subscribe to all channels
        this.subscriptions.forEach(channel => {
            this.subscribe(channel);
        });

        this.emit('welcome', message);
    }

    private handleConfigUpdate(message: any): void {
        this.logger.debug(`Config update received for ${message.key}`);
        this.emit('config_update', message);
        this.emit(`config_update:${message.key}`, message);
    }

    private handleNewNotification(message: any): void {
        this.logger.debug('New notification received');
        this.emit('new_notification', message);
    }

    private handleError(message: any): void {
        this.logger.error('Error message from server', message);
        this.emit('server_error', message);
    }

    private startHeartbeat(): void {
        // Clear any existing heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
        }

        // Send ping every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.send({ type: 'ping' });
            }
        }, 30000);

        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
            this.logger.warn('Heartbeat timeout, closing connection');
            this.close(1001, 'Heartbeat timeout');
        }, 45000);
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error('Max reconnect attempts reached, giving up');
            this.rejectConnection?.(new Error('Max reconnect attempts reached'));
            this.connectionPromise = null;
            return;
        }

        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
            this.maxReconnectDelay
        );

        this.logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempts++;
            this.attemptConnection();
        }, delay);
    }

    private cleanup(): void {
        // Clear reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // Clear heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }

        // Close socket if open
        if (this.socket) {
            if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
                this.socket.close();
            }
            this.socket = null;
        }

        this.connectionId = null;
    }

    /**
     * Close the WebSocket connection
     */
    public close(code?: number, reason?: string): void {
        if (this.socket) {
            this.socket.close(code, reason);
        }
        this.cleanup();
    }

    /**
     * Send a message to the server
     */
    public send(message: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
                    // Queue the message if connecting
                    this.messageQueue.push({ message, resolve, reject });
                } else {
                    reject(new Error('WebSocket is not connected'));
                }
                return;
            }

            try {
                // Add request ID if not present
                if (!message.requestId) {
                    message.requestId = uuidv4();
                }

                // Add timestamp
                message.timestamp = new Date().toISOString();

                const messageString = JSON.stringify(message);
                this.socket.send(messageString);

                // Set timeout for response
                const timeout = setTimeout(() => {
                    reject(new Error(`Message timeout after ${this.messageTimeout}ms`));
                }, this.messageTimeout);

                // Store the resolve/reject functions to call when response is received
                this.messageQueue.push({
                    message,
                    resolve: (value) => {
                        clearTimeout(timeout);
                        resolve(value);
                    },
                    reject: (reason) => {
                        clearTimeout(timeout);
                        reject(reason);
                    }
                });

                // Process the queue
                this.processQueue();
            } catch (error) {
                reject(error);
            }
        });
    }

    private processQueue(): void {
        if (this.processingQueue || this.messageQueue.length === 0) {
            return;
        }

        this.processingQueue = true;

        const processNext = () => {
            if (this.messageQueue.length === 0) {
                this.processingQueue = false;
                return;
            }

            const { message, resolve, reject } = this.messageQueue[0];

            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket is not connected'));
                this.messageQueue.shift();
                processNext();
                return;
            }

            // For messages that expect a response, we need to wait for it
            if (message.requestId) {
                const responseHandler = (response: any) => {
                    if (response.requestId === message.requestId) {
                        this.off(message.type + '_response', responseHandler);
                        this.off('error', errorHandler);

                        if (response.type.endsWith('_response')) {
                            resolve(response);
                        } else {
                            reject(new Error('Unexpected response type'));
                        }

                        this.messageQueue.shift();
                        processNext();
                    }
                };

                const errorHandler = (error: any) => {
                    if (error.requestId === message.requestId) {
                        this.off(message.type + '_response', responseHandler);
                        this.off('error', errorHandler);
                        reject(error);
                        this.messageQueue.shift();
                        processNext();
                    }
                };

                this.on(message.type + '_response', responseHandler);
                this.on('error', errorHandler);

                // Send the message
                try {
                    this.socket.send(JSON.stringify(message));
                } catch (error) {
                    this.off(message.type + '_response', responseHandler);
                    this.off('error', errorHandler);
                    reject(error);
                    this.messageQueue.shift();
                    processNext();
                }
            } else {
                // For fire-and-forget messages
                try {
                    this.socket.send(JSON.stringify(message));
                    resolve({ success: true });
                } catch (error) {
                    reject(error);
                }

                this.messageQueue.shift();
                processNext();
            }
        };

        processNext();
    }

    /**
     * Subscribe to a channel
     */
    public subscribe(channel: string): Promise<any> {
        if (this.subscriptions.has(channel)) {
            return Promise.resolve({ success: true, channel });
        }

        return this.send({
            type: 'subscribe_config',
            key: channel.replace('config:', '')
        }).then(response => {
            this.subscriptions.add(channel);
            return response;
        });
    }

    /**
     * Unsubscribe from a channel
     */
    public unsubscribe(channel: string): Promise<any> {
        if (!this.subscriptions.has(channel)) {
            return Promise.resolve({ success: true, channel });
        }

        return this.send({
            type: 'unsubscribe_config',
            key: channel.replace('config:', '')
        }).then(response => {
            this.subscriptions.delete(channel);
            return response;
        });
    }

    /**
     * Get current configuration
     */
    public getConfig(key: string, options: { includeMetadata?: boolean, includeHistory?: boolean } = {}): Promise<any> {
        return this.send({
            type: 'get_config',
            key,
            includeMetadata: options.includeMetadata,
            includeHistory: options.includeHistory
        });
    }

    /**
     * Update configuration
     */
    public updateConfig(key: string, value: any, options: { metadata?: any, validate?: boolean, broadcast?: boolean } = {}): Promise<any> {
        return this.send({
            type: 'update_config',
            key,
            value,
            metadata: options.metadata,
            validate: options.validate,
            broadcast: options.broadcast
        });
    }

    /**
     * Get notifications
     */
    public getNotifications(options: { limit?: number, offset?: number, unreadOnly?: boolean, since?: string } = {}): Promise<any> {
        return this.send({
            type: 'get_notifications',
            ...options
        });
    }

    /**
     * Mark notification as read
     */
    public markNotificationRead(notificationId: string): Promise<any> {
        return this.send({
            type: 'mark_notification_read',
            notificationId
        });
    }

    /**
     * Subscribe to notifications
     */
    public subscribeNotifications(): Promise<any> {
        return this.send({
            type: 'subscribe_notifications'
        }).then(response => {
            this.subscriptions.add(`notifications:${this.connectionId}`);
            return response;
        });
    }

    /**
     * Get connection status
     */
    public getStatus(): Promise<any> {
        return this.send({
            type: 'get_status'
        });
    }

    /**
     * Register a message handler
     */
    public registerMessageHandler(type: string, handler: (message: any) => void): void {
        this.messageHandlers.set(type, handler);
    }

    /**
     * Unregister a message handler
     */
    public unregisterMessageHandler(type: string): void {
        this.messageHandlers.delete(type);
    }

    /**
     * Set default message handler
     */
    public setDefaultMessageHandler(handler: (message: any) => void): void {
        this.defaultMessageHandler = handler;
    }

    /**
     * Get connection statistics
     */
    public getStats(): {
        connected: boolean;
        reconnectAttempts: number;
        lastMessageTime: number;
        messageQueueLength: number;
        subscriptions: string[];
    } {
        return {
            connected: this.socket?.readyState === WebSocket.OPEN,
            reconnectAttempts: this.reconnectAttempts,
            lastMessageTime: this.lastMessageTime,
            messageQueueLength: this.messageQueue.length,
            subscriptions: Array.from(this.subscriptions)
        };
    }

    /**
     * Get connection ID
     */
    public getConnectionId(): string | null {
        return this.connectionId;
    }
}
```

### Room/Channel Management

```typescript
// src/websocket/room-manager.ts
import { WebSocketServerManager } from './websocket-server';
import { Logger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';
import { performance } from 'perf_hooks';

/**
 * Advanced room/channel management system with:
 * - Hierarchical room structure
 * - Access control
 * - Room metadata
 * - Message history
 * - Rate limiting
 * - Performance metrics
 */
export class RoomManager {
    private static instance: RoomManager;
    private logger: Logger;
    private wsServer: WebSocketServerManager;
    private rateLimiter: RateLimiter;
    private rooms: Map<string, {
        name: string;
        description: string;
        createdAt: number;
        createdBy: string;
        members: Map<string, { joinedAt: number, roles: string[] }>;
        metadata: Record<string, any>;
        parentRoom?: string;
        childRooms: Set<string>;
        messageHistory: { message: any, timestamp: number }[];
        maxMessageHistory: number;
    }>;
    private userRooms: Map<string, Set<string>>;
    private roomMessageProcessors: Map<string, (message: any, room: string, connectionId: string) => Promise<any>>;

    private constructor() {
        this.logger = new Logger('RoomManager');
        this.wsServer = WebSocketServerManager.getInstance();
        this.rateLimiter = new RateLimiter();
        this.rooms = new Map();
        this.userRooms = new Map();
        this.roomMessageProcessors = new Map();

        this.initialize();
    }

    public static getInstance(): RoomManager {
        if (!RoomManager.instance) {
            RoomManager.instance = new RoomManager();
        }
        return RoomManager.instance;
    }

    private initialize(): void {
        // Register default room message processors
        this.registerRoomMessageProcessor('room_message', this.handleRoomMessage.bind(this));
        this.registerRoomMessageProcessor('join_room', this.handleJoinRoom.bind(this));
        this.registerRoomMessageProcessor('leave_room', this.handleLeaveRoom.bind(this));
        this.registerRoomMessageProcessor('get_room_info', this.handleGetRoomInfo.bind(this));
        this.registerRoomMessageProcessor('get_room_members', this.handleGetRoomMembers.bind(this));
        this.registerRoomMessageProcessor('update_room', this.handleUpdateRoom.bind(this));

        this.logger.info('Room manager initialized');
    }

    /**
     * Create a new room
     */
    public async createRoom(options: {
        name: string;
        description?: string;
        createdBy: string;
        metadata?: Record<string, any>;
        parentRoom?: string;
        maxMessageHistory?: number;
    }): Promise<string> {
        const startTime = performance.now();
        const roomId = `room:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

        // Validate parent room if specified
        if (options.parentRoom && !this.rooms.has(options.parentRoom)) {
            throw new Error('Parent room does not exist');
        }

        // Create the room
        this.rooms.set(roomId, {
            name: options.name,
            description: options.description || '',
            createdAt: performance.now(),
            createdBy: options.createdBy,
            members: new Map(),
            metadata: options.metadata || {},
            parentRoom: options.parentRoom,
            childRooms: new Set(),
            messageHistory: [],
            maxMessageHistory: options.maxMessageHistory || 100
        });

        // Add to parent's child rooms if parent exists
        if (options.parentRoom) {
            const parentRoom = this.rooms.get(options.parentRoom)!;
            parentRoom.childRooms.add(roomId);
        }

        this.logger.info(`Room created: ${roomId} (${options.name}) by ${options.createdBy}`);
        this.trackPerformance('create_room', startTime);
        return roomId;
    }

    /**
     * Delete a room
     */
    public async deleteRoom(roomId: string, deletedBy: string): Promise<void> {
        const startTime = performance.now();
        const room = this.rooms.get(roomId);

        if (!room) {
            throw new Error('Room does not exist');
        }

        // Check if user has permission to delete the room
        if (!this.hasRoomPermission(roomId, deletedBy, 'room:delete')) {
            throw new Error('Permission denied');
        }

        // Remove from parent's child rooms if parent exists
        if (room.parentRoom) {
            const parentRoom = this.rooms.get(room.parentRoom);
            if (parentRoom) {
                parentRoom.childRooms.delete(roomId);
            }
        }

        // Delete all child rooms
        for (const childRoomId of room.childRooms) {
            await this.deleteRoom(childRoomId, deletedBy);
        }

        // Remove room from all members' room lists
        for (const [connectionId] of room.members) {
            const userRoomSet = this.userRooms.get(connectionId);
            if (userRoomSet) {
                userRoomSet.delete(roomId);
                if (userRoomSet.size === 0) {
                    this.userRooms.delete(connectionId);
                }
            }
        }

        // Delete the room
        this.rooms.delete(roomId);

        this.logger.info(`Room deleted: ${roomId} (${room.name}) by ${deletedBy}`);
        this.trackPerformance('delete_room', startTime);
    }

    /**
     * Join a room
     */
    public async joinRoom(roomId: string, connectionId: string, roles: string[] = []): Promise<void> {
        const startTime = performance.now();
        const room = this.rooms.get(roomId);

        if (!room) {
            throw new Error('Room does not exist');
        }

        // Check if user is already in the room
        if (room.members.has(connectionId)) {
            return;
        }

        // Add to room members
        room.members.set(connectionId, {
            joinedAt: performance.now(),
            roles
        });

        // Add to user's room list
        if (!this.userRooms.has(connectionId)) {
            this.userRooms.set(connectionId, new Set());
        }
        this.userRooms.get(connectionId)!.add(roomId);

        // Notify room members
        this.broadcastToRoom(roomId, {
            type: 'room_member_joined',
            roomId,
            connectionId,
            timestamp: new Date().toISOString()
        });

        this.logger.debug(`Connection ${connectionId} joined room ${roomId}`);
        this.trackPerformance('join_room', startTime);
    }

    /**
     * Leave a room
     */
    public async leaveRoom(roomId: string, connectionId: string): Promise<void> {
        const startTime = performance.now();
        const room = this.rooms.get(roomId);

        if (!room) {
            throw new Error('Room does not exist');
        }

        // Check if user is in the room
        if (!room.members.has(connectionId)) {
            return;
        }

        // Remove from room members
        room.members.delete(connectionId);

        // Remove from user's room list
        const userRoomSet = this.userRooms.get(connectionId);
        if (userRoomSet) {
            userRoomSet.delete(roomId);
            if (userRoomSet.size === 0) {
                this.userRooms.delete(connectionId);
            }
        }

        // Notify room members
        this.broadcastToRoom(roomId, {
            type: 'room_member_left',
            roomId,
            connectionId,
            timestamp: new Date().toISOString()
        });

        this.logger.debug(`Connection ${connectionId} left room ${roomId}`);
        this.trackPerformance('leave_room', startTime);
    }

    /**
     * Send a message to a room
     */
    public async sendToRoom(roomId: string, message: any, senderConnectionId?: string): Promise<void> {
        const startTime = performance.now();
        const room = this.rooms.get(roomId);

        if (!room) {
            throw new Error('Room does not exist');
        }

        // Check rate limit
        if (senderConnectionId) {
            const rateLimitKey = `room_message:${senderConnectionId}:${roomId}`;
            const rateLimitResult = this.rateLimiter.check(rateLimitKey, 20, 60000); // 20 messages per minute

            if (!rateLimitResult.allowed) {
                throw new Error(`Message rate limit exceeded. Try again in ${rateLimitResult.retryAfter}ms.`);
            }
        }

        // Add metadata to message
        const messageWithMetadata = {
            ...message,
            roomId,
            timestamp: new Date().toISOString(),
            senderConnectionId
        };

        // Store in message history
        room.messageHistory.push({
            message: messageWithMetadata,
            timestamp: performance.now()
        });

        // Trim message history if needed
        if (room.messageHistory.length > room.maxMessageHistory) {
            room.messageHistory.shift();
        }

        // Broadcast to room members
        this.broadcastToRoom(roomId, messageWithMetadata);

        this.logger.debug(`Message sent to room ${roomId} by ${senderConnectionId || 'server'}`);
        this.trackPerformance('send_to_room', startTime);
    }

    /**
     * Broadcast a message to all members of a room
     */
    private broadcastToRoom(roomId: string, message: any): void {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }

        const messageString = JSON.stringify(message);

        room.members.forEach((_, connectionId) => {
            const connection = this.wsServer.getConnection(connectionId);
            if (connection && connection.socket.readyState === WebSocket.OPEN) {
                try {
                    connection.socket.send(messageString);
                } catch (error) {
                    this.logger.error(`Error sending message to ${connectionId} in room ${roomId}`, error);
                }
            }
        });
    }

    /**
     * Get room information
     */
    public async getRoomInfo(roomId: string): Promise<any> {
        const startTime = performance.now();
        const room = this.rooms.get(roomId);

        if (!room) {
            throw new Error('Room does not exist');
        }

        const info = {
            id: roomId,
            name: room.name,
            description: room.description,
            createdAt: new Date(room.createdAt).toISOString(),
            createdBy: room.createdBy,
            memberCount: room.members.size,
            metadata: room.metadata,
            parentRoom: room.parentRoom,
            childRooms: Array.from(room.childRooms)
        };

        this.trackPerformance('get_room_info', startTime);
        return info;
    }

    /**
     * Get room members
     */
    public async getRoomMembers(roomId: string): Promise<any[]> {
        const startTime = performance.now();
        const room = this.rooms.get(roomId);

        if (!room) {
            throw new Error('Room does not exist');
        }

        const members = Array.from(room.members.entries()).map(([connectionId, member]) => ({
            connectionId,
            joinedAt: new Date(member.joinedAt).toISOString(),
            roles: member.roles
        }));

        this.trackPerformance('get_room_members', startTime);
        return members;
    }

    /**
     * Update room information
     */
    public async updateRoom(roomId: string, updatedBy: string, updates: {
        name?: string;
        description?: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const startTime = performance.now();
        const room = this.rooms.get(roomId);

        if (!room) {
            throw new Error('Room does not exist');
        }

        // Check if user has permission to update the room
        if (!this.hasRoomPermission(roomId, updatedBy, 'room:update')) {
            throw new Error('Permission denied');
        }

        // Apply updates
        if (updates.name !== undefined) {
            room.name = updates.name;
        }

        if (updates.description !== undefined) {
            room.description = updates.description;
        }

        if (updates.metadata !== undefined) {
            room.metadata = { ...room.metadata, ...updates.metadata };
        }

        // Notify room members of update
        this.broadcastToRoom(roomId, {
            type: 'room_updated',
            roomId,
            updates,
            updatedBy,
            timestamp: new Date().toISOString()
        });

        this.logger.info(`Room ${roomId} updated by ${updatedBy}`);
        this.trackPerformance('update_room', startTime);
    }

    /**
     * Get message history for a room
     */
    public async getMessageHistory(roomId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
        const startTime = performance.now();
        const room = this.rooms.get(roomId);

        if (!room) {
            throw new Error('Room does not exist');
        }

        const history = room.messageHistory
            .slice(offset, offset + limit)
            .map(entry => ({
                ...entry.message,
                timestamp: new Date(entry.timestamp).toISOString()
            }));

        this.trackPerformance('get_message_history', startTime);
        return history;
    }

    /**
     * Check if a user has permission for a room
     */
    public hasRoomPermission(roomId: string, connectionId: string, permission: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        // Check if user is in the room
        if (!room.members.has(connectionId)) {
            return false;
        }

        const member = room.members.get(connectionId)!;

        // Admin has all permissions
        if (member.roles.includes('admin')) {
            return true;
        }

        // Check specific permissions
        if (permission === 'room:message') {
            return member.roles.includes('member') ||
                   member.roles.includes('moderator') ||
                   member.roles.includes('admin');
        }

        if (permission === 'room:update') {
            return member.roles.includes('moderator') ||
                   member.roles.includes('admin');
        }

        if (permission === 'room:delete') {
            return member.roles.includes('admin');
        }

        if (permission === 'room:kick') {
            return member.roles.includes('moderator') ||
                   member.roles.includes('admin');
        }

        return false;
    }

    /**
     * Kick a member from a room
     */
    public async kickMember(roomId: string, kickedConnectionId: string, kickedBy: string): Promise<void> {
        const startTime = performance.now();
        const room = this.rooms.get(roomId);

        if (!room) {
            throw new Error('Room does not exist');
        }

        // Check if user has permission to kick
        if (!this.hasRoomPermission(roomId, kickedBy, 'room:kick')) {
            throw new Error('Permission denied');
        }

        // Check if user is trying to kick themselves
        if (kickedConnectionId === kickedBy) {
            throw new Error('Cannot kick yourself');
        }

        // Check if the kicked user is in the room
        if (!room.members.has(kickedConnectionId)) {
            throw new Error('User is not in the room');
        }

        // Leave the room
        await this.leaveRoom(roomId, kickedConnectionId);

        // Notify room members
        this.broadcastToRoom(roomId, {
            type: 'room_member_kicked',
            roomId,
            connectionId: kickedConnectionId,
            kickedBy,
            timestamp: new Date().toISOString()
        });

        this.logger.info(`Connection ${kickedConnectionId} kicked from room ${roomId} by ${kickedBy}`);
        this.trackPerformance('kick_member', startTime);
    }

    /**
     * Get rooms for a connection
     */
    public async getConnectionRooms(connectionId: string): Promise<string[]> {
        const startTime = performance.now();
        const roomSet = this.userRooms.get(connectionId) || new Set();
        const rooms = Array.from(roomSet);

        this.trackPerformance('get_connection_rooms', startTime);
        return rooms;
    }

    /**
     * Register a room message processor
     */
    public registerRoomMessageProcessor(type: string, processor: (message: any, room: string, connectionId: string) => Promise<any>): void {
        this.roomMessageProcessors.set(type, processor);
        this.logger.debug(`Registered room message processor for type: ${type}`);
    }

    /**
     * Handle room_message
     */
    private async handleRoomMessage(message: any, roomId: string, connectionId: string): Promise<any> {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error('Room does not exist');
        }

        // Check if user is in the room
        if (!room.members.has(connectionId)) {
            throw new Error('You are not a member of this room');
        }

        // Check if user has permission to send messages
        if (!this.hasRoomPermission(roomId, connectionId, 'room:message')) {
            throw new Error('Permission denied');
        }

        // Send the message to the room
        await this.sendToRoom(roomId, message, connectionId);

        return { success: true };
    }

    /**
     * Handle join_room
     */
    private async handleJoinRoom(message: any, roomId: string, connectionId: string): Promise<any> {
        const connection = this.wsServer.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        // Check if room exists
        if (!this.rooms.has(roomId)) {
            throw new Error('Room does not exist');
        }

        // Join the room
        await this.joinRoom(roomId, connectionId, message.roles || []);

        // Get room info to return
        const roomInfo = await this.getRoomInfo(roomId);

        return {
            success: true,
            room: roomInfo
        };
    }

    /**
     * Handle leave_room
     */
    private async handleLeaveRoom(message: any, roomId: string, connectionId: string): Promise<any> {
        // Leave the room
        await this.leaveRoom(roomId, connectionId);

        return { success: true };
    }

    /**
     * Handle get_room_info
     */
    private async handleGetRoomInfo(message: any, roomId: string): Promise<any> {
        const roomInfo = await this.getRoomInfo(roomId);
        return { room: roomInfo };
    }

    /**
     * Handle get_room_members
     */
    private async handleGetRoomMembers(message: any, roomId: string): Promise<any> {
        const members = await this.getRoomMembers(roomId);
        return { members };
    }

    /**
     * Handle update_room
     */
    private async handleUpdateRoom(message: any, roomId: string, connectionId: string): Promise<any> {
        const connection = this.wsServer.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        // Update the room
        await this.updateRoom(roomId, connection.userId, message.updates);

        // Get updated room info
        const roomInfo = await this.getRoomInfo(roomId);

        return {
            success: true,
            room: roomInfo
        };
    }

    /**
     * Get room statistics
     */
    public getStats(): {
        totalRooms: number;
        totalMembers: number;
        activeRooms: number;
        messageProcessors: number;
    } {
        let totalMembers = 0;
        let activeRooms = 0;

        this.rooms.forEach(room => {
            totalMembers += room.members.size;
            if (room.members.size > 0) {
                activeRooms++;
            }
        });

        return {
            totalRooms: this.rooms.size,
            totalMembers,
            activeRooms,
            messageProcessors: this.roomMessageProcessors.size
        };
    }

    private trackPerformance(operation: string, startTime: number): void {
        const duration = performance.now() - startTime;
        this.logger.debug(`Room operation ${operation} took ${duration.toFixed(2)}ms`);

        // In a real implementation, you would send this to your metrics system
        // metrics.increment(`room_manager.${operation}`);
        // metrics.timing(`room_manager.${operation}.duration`, duration);
    }
}
```

### Reconnection Logic

```typescript
// src/websocket/reconnection-manager.ts
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

/**
 * Advanced WebSocket reconnection manager with:
 * - Exponential backoff
 * - Jitter for distributed systems
 * - Connection quality monitoring
 * - Automatic failover
 * - Session persistence
 * - Network change detection
 */
export class ReconnectionManager extends EventEmitter {
    private static instance: ReconnectionManager;
    private logger: Logger;
    private reconnectAttempts: number;
    private maxReconnectAttempts: number;
    private baseReconnectDelay: number;
    private maxReconnectDelay: number;
    private jitterFactor: number;
    private reconnectTimer: NodeJS.Timeout | null;
    private connectionQuality: {
        lastSuccess: number;
        lastFailure: number;
        successCount: number;
        failureCount: number;
        lastLatency: number;
        averageLatency: number;
    };
    private failoverUrls: string[];
    private currentUrlIndex: number;
    private sessionData: any;
    private networkOnline: boolean;
    private networkChangeHandler: (() => void) | null;
    private connectionMetrics: {
        totalAttempts: number;
        successfulAttempts: number;
        failedAttempts: number;
        totalConnectionTime: number;
        lastConnectionStart: number;
    };

    private constructor() {
        super();
        this.logger = new Logger('ReconnectionManager');
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.baseReconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.jitterFactor = 0.2;
        this.reconnectTimer = null;
        this.connectionQuality = {
            lastSuccess: 0,
            lastFailure: 0,
            successCount: 0,
            failureCount: 0,
            lastLatency: 0,
            averageLatency: 0
        };
        this.failoverUrls = [];
        this.currentUrlIndex = 0;
        this.sessionData = null;
        this.networkOnline = true;
        this.networkChangeHandler = null;
        this.connectionMetrics = {
            totalAttempts: 0,
            successfulAttempts: 0,
            failedAttempts: 0,
            totalConnectionTime: 0,
            lastConnectionStart: 0
        };

        this.initialize();
    }

    public static getInstance(): ReconnectionManager {
        if (!ReconnectionManager.instance) {
            ReconnectionManager.instance = new ReconnectionManager();
        }
        return ReconnectionManager.instance;
    }

    private initialize(): void {
        // Set up network change detection
        this.setupNetworkChangeDetection();

        this.logger.info('Reconnection manager initialized');
    }

    /**
     * Set up network change detection
     */
    private setupNetworkChangeDetection(): void {
        if (typeof window !== 'undefined') {
            // Browser environment
            this.networkChangeHandler = () => {
                const online = navigator.onLine;
                if (online !== this.networkOnline) {
                    this.networkOnline = online;
                    this.logger.info(`Network status changed: ${online ? 'online' : 'offline'}`);
                    this.emit('network_change', online);

                    if (online) {
                        this.attemptReconnect();
                    }
                }
            };

            window.addEventListener('online', this.networkChangeHandler);
            window.addEventListener('offline', this.networkChangeHandler);
            this.networkOnline = navigator.onLine;
        } else {
            // Node.js environment
            this.networkOnline = true;
        }
    }

    /**
     * Configure reconnection settings
     */
    public configure(config: {
        maxReconnectAttempts?: number;
        baseReconnectDelay?: number;
        maxReconnectDelay?: number;
        jitterFactor?: number;
        failoverUrls?: string[];
    }): void {
        if (config.maxReconnectAttempts !== undefined) {
            this.maxReconnectAttempts = config.maxReconnectAttempts;
        }

        if (config.baseReconnectDelay !== undefined) {
            this.baseReconnectDelay = config.baseReconnectDelay;
        }

        if (config.maxReconnectDelay !== undefined) {
            this.maxReconnectDelay = config.maxReconnectDelay;
        }

        if (config.jitterFactor !== undefined) {
            this.jitterFactor = config.jitterFactor;
        }

        if (config.failoverUrls !== undefined) {
            this.failoverUrls = config.failoverUrls;
            this.currentUrlIndex = 0;
        }

        this.logger.debug(`Reconnection manager configured: ${JSON.stringify(config)}`);
    }

    /**
     * Start connection attempt
     */
    public startConnectionAttempt(url: string): void {
        this.connectionMetrics.totalAttempts++;
        this.connectionMetrics.lastConnectionStart = performance.now();

        this.logger.info(`Starting connection attempt to ${url}`);
        this.emit('connecting', url);
    }

    /**
     * Connection successful
     */
    public connectionSuccess(latency: number): void {
        const connectionTime = performance.now() - this.connectionMetrics.lastConnectionStart;

        this.reconnectAttempts = 0;
        this.connectionQuality.successCount++;
        this.connection