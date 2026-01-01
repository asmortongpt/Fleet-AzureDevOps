# TO_BE_DESIGN.md - Predictive Analytics Module
**Version:** 3.0.0
**Last Updated:** 2023-11-15
**Status:** APPROVED

---

## Executive Vision (120 lines)

### Strategic Vision for Predictive Analytics Transformation

The enhanced predictive analytics module represents a paradigm shift in how our organization leverages data to drive decision-making. This transformation moves beyond traditional retrospective analytics to a proactive, forward-looking system that anticipates customer needs, operational bottlenecks, and market trends before they fully materialize.

**Core Transformation Goals:**
1. **From Reactive to Predictive:** Transition from historical reporting to real-time predictive insights with 90%+ accuracy in forecasting key business metrics
2. **From Siloed to Integrated:** Unify data sources across 15+ departments into a single predictive model with cross-functional insights
3. **From Manual to Automated:** Reduce manual analysis time by 85% through automated model training and inference pipelines
4. **From Generic to Personalized:** Deliver hyper-personalized predictions at the individual customer level with 95% relevance scores

**Business Impact Projections:**
- **Revenue Growth:** 22-28% increase through predictive cross-sell/upsell recommendations
- **Cost Reduction:** 35% decrease in operational costs via predictive maintenance and resource optimization
- **Customer Retention:** 40% improvement in churn prediction accuracy leading to 18% higher retention rates
- **Risk Mitigation:** 60% reduction in fraudulent transactions through real-time anomaly detection

**User Experience Revolution:**
The new system will transform user interaction patterns through:
- **Proactive Insights:** Push notifications for predicted opportunities/risks before users even search for them
- **Conversational Analytics:** Natural language query interface with 98% accuracy in understanding business questions
- **Immersive Visualization:** 3D predictive modeling with interactive scenario planning
- **Context-Aware Recommendations:** Predictions that adapt to user role, location, and current workflow

**Competitive Advantages:**
1. **First-Mover in Predictive AI:** 18-month lead over competitors in production-grade predictive capabilities
2. **Patent-Pending Algorithms:** 3 proprietary machine learning models for industry-specific predictions
3. **Edge Computing Integration:** Real-time predictions at the IoT device level with <100ms latency
4. **Explainable AI:** Full transparency into prediction rationale with audit trails for regulatory compliance
5. **Self-Optimizing Models:** Continuous learning system that improves without human intervention

**Long-Term Roadmap (2024-2027):**
**Phase 1 (2024 Q1-Q2):**
- Core predictive engine deployment
- Real-time WebSocket integration
- Basic PWA capabilities
- Initial 5 department integrations

**Phase 2 (2024 Q3-Q4):**
- Advanced gamification system
- Predictive maintenance module
- Cross-platform mobile apps
- 10 additional department integrations

**Phase 3 (2025):**
- Autonomous predictive agents
- Blockchain verification for predictions
- AR/VR visualization interfaces
- Full enterprise-wide adoption

**Phase 4 (2026-2027):**
- Predictive ecosystem marketplace
- Quantum computing integration
- Self-evolving AI models
- Industry benchmarking network

**Implementation Principles:**
1. **Modular Architecture:** Component-based design allowing independent scaling of prediction types
2. **Progressive Enhancement:** Core functionality first, advanced features layered on top
3. **Ethical AI:** Bias detection and mitigation built into every prediction pipeline
4. **Observability:** Full telemetry for model performance and business impact
5. **Developer Experience:** Comprehensive SDKs for internal and partner integrations

**Change Management Strategy:**
- **Leadership Alignment:** Quarterly executive briefings with predictive ROI demonstrations
- **User Adoption:** Gamified onboarding with achievement-based learning paths
- **Continuous Feedback:** Real-time sentiment analysis of user interactions
- **Performance Tracking:** Individual and team-level predictive usage metrics

**Success Metrics:**
| KPI | Baseline | Target (12 months) | Target (24 months) |
|-----|----------|--------------------|--------------------|
| Prediction Accuracy | 72% | 90% | 95% |
| User Adoption Rate | 45% | 85% | 98% |
| Time-to-Insight | 4.2 hours | 15 minutes | <5 minutes |
| Cost per Prediction | $0.87 | $0.22 | $0.10 |
| Business Impact | $2.1M/year | $8.7M/year | $22.3M/year |

**Risk Mitigation Framework:**
1. **Data Quality:** Automated validation pipelines with 99.9% accuracy
2. **Model Drift:** Continuous monitoring with automated retraining triggers
3. **Security:** Zero-trust architecture with real-time anomaly detection
4. **Compliance:** Automated regulatory reporting for GDPR, CCPA, and industry-specific requirements
5. **User Trust:** Explainable AI with confidence scoring for every prediction

This transformation positions our predictive analytics module as the central nervous system of our digital enterprise, enabling data-driven decision making at every level of the organization while maintaining the agility to adapt to rapidly changing business conditions.

---

## Performance Enhancements (320 lines)

### Redis Caching Layer Implementation

```typescript
// src/cache/redis-cache.ts
import { createClient, RedisClientType } from 'redis';
import { performance } from 'perf_hooks';
import { Logger } from '../utils/logger';
import { CacheConfig } from '../config/cache-config';

export class RedisCache {
    private static instance: RedisCache;
    private client: RedisClientType;
    private logger: Logger;
    private config: CacheConfig;
    private isReady: boolean = false;

    private constructor() {
        this.config = new CacheConfig();
        this.logger = new Logger('RedisCache');
        this.client = createClient({
            url: this.config.redisUrl,
            socket: {
                tls: this.config.useTls,
                rejectUnauthorized: false
            },
            password: this.config.redisPassword
        });

        this.initialize();
    }

    public static getInstance(): RedisCache {
        if (!RedisCache.instance) {
            RedisCache.instance = new RedisCache();
        }
        return RedisCache.instance;
    }

    private async initialize(): Promise<void> {
        try {
            this.client.on('error', (err) => {
                this.logger.error(`Redis error: ${err.message}`);
                this.isReady = false;
            });

            this.client.on('connect', () => {
                this.logger.info('Redis client connected');
            });

            this.client.on('ready', () => {
                this.isReady = true;
                this.logger.info('Redis client ready');
            });

            await this.client.connect();
            await this.setupCachePolicies();
        } catch (err) {
            this.logger.error(`Redis initialization failed: ${err.message}`);
            throw err;
        }
    }

    private async setupCachePolicies(): Promise<void> {
        try {
            // Configure cache eviction policies
            await this.client.configSet('maxmemory', this.config.maxMemory);
            await this.client.configSet('maxmemory-policy', this.config.evictionPolicy);

            // Set up cache compression
            await this.client.configSet('hash-max-ziplist-entries', '512');
            await this.client.configSet('hash-max-ziplist-value', '64');

            this.logger.info('Redis cache policies configured successfully');
        } catch (err) {
            this.logger.error(`Failed to set cache policies: ${err.message}`);
            throw err;
        }
    }

    public async get<T>(key: string): Promise<T | null> {
        if (!this.isReady) {
            this.logger.warn('Redis not ready, returning null');
            return null;
        }

        try {
            const startTime = performance.now();
            const value = await this.client.get(key);
            const duration = performance.now() - startTime;

            this.logger.debug(`Cache GET for ${key} took ${duration.toFixed(2)}ms`);

            if (value === null) {
                this.logger.debug(`Cache miss for key: ${key}`);
                return null;
            }

            return JSON.parse(value) as T;
        } catch (err) {
            this.logger.error(`Error getting key ${key}: ${err.message}`);
            return null;
        }
    }

    public async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
        if (!this.isReady) {
            this.logger.warn('Redis not ready, skipping set operation');
            return false;
        }

        try {
            const startTime = performance.now();
            const stringValue = JSON.stringify(value);

            if (ttl) {
                await this.client.setEx(key, ttl, stringValue);
            } else {
                await this.client.set(key, stringValue);
            }

            const duration = performance.now() - startTime;
            this.logger.debug(`Cache SET for ${key} took ${duration.toFixed(2)}ms`);

            return true;
        } catch (err) {
            this.logger.error(`Error setting key ${key}: ${err.message}`);
            return false;
        }
    }

    public async delete(key: string): Promise<boolean> {
        if (!this.isReady) {
            this.logger.warn('Redis not ready, skipping delete operation');
            return false;
        }

        try {
            const startTime = performance.now();
            const result = await this.client.del(key);
            const duration = performance.now() - startTime;

            this.logger.debug(`Cache DELETE for ${key} took ${duration.toFixed(2)}ms`);
            return result === 1;
        } catch (err) {
            this.logger.error(`Error deleting key ${key}: ${err.message}`);
            return false;
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

    public async clearNamespace(namespace: string): Promise<boolean> {
        if (!this.isReady) {
            this.logger.warn('Redis not ready, skipping clear operation');
            return false;
        }

        try {
            const keys = await this.client.keys(`${namespace}:*`);
            if (keys.length === 0) {
                return true;
            }

            const startTime = performance.now();
            const result = await this.client.del(keys);
            const duration = performance.now() - startTime;

            this.logger.debug(`Cleared ${keys.length} keys in ${duration.toFixed(2)}ms`);
            return result === keys.length;
        } catch (err) {
            this.logger.error(`Error clearing namespace ${namespace}: ${err.message}`);
            return false;
        }
    }

    public async getCacheStats(): Promise<CacheStats> {
        if (!this.isReady) {
            return {
                keys: 0,
                memoryUsage: 0,
                hitRate: 0,
                evictions: 0
            };
        }

        try {
            const info = await this.client.info('memory');
            const stats = await this.client.info('stats');

            const memoryUsage = parseFloat(info.match(/used_memory:(\d+)/)?.[1] || '0');
            const keys = parseInt(stats.match(/keyspace_hits:(\d+)/)?.[1] || '0') +
                         parseInt(stats.match(/keyspace_misses:(\d+)/)?.[1] || '0');
            const hitRate = keys > 0 ?
                parseInt(stats.match(/keyspace_hits:(\d+)/)?.[1] || '0') / keys : 0;
            const evictions = parseInt(stats.match(/evicted_keys:(\d+)/)?.[1] || '0');

            return {
                keys,
                memoryUsage,
                hitRate,
                evictions
            };
        } catch (err) {
            this.logger.error(`Error getting cache stats: ${err.message}`);
            return {
                keys: 0,
                memoryUsage: 0,
                hitRate: 0,
                evictions: 0
            };
        }
    }

    public async close(): Promise<void> {
        try {
            await this.client.quit();
            this.isReady = false;
            this.logger.info('Redis connection closed');
        } catch (err) {
            this.logger.error(`Error closing Redis connection: ${err.message}`);
        }
    }
}

interface CacheStats {
    keys: number;
    memoryUsage: number;
    hitRate: number;
    evictions: number;
}
```

### Database Query Optimization

```typescript
// src/database/query-optimizer.ts
import { Pool, PoolClient, QueryResult } from 'pg';
import { performance } from 'perf_hooks';
import { Logger } from '../utils/logger';
import { DatabaseConfig } from '../config/database-config';
import { RedisCache } from '../cache/redis-cache';

export class QueryOptimizer {
    private pool: Pool;
    private logger: Logger;
    private cache: RedisCache;
    private config: DatabaseConfig;

    constructor() {
        this.config = new DatabaseConfig();
        this.logger = new Logger('QueryOptimizer');
        this.cache = RedisCache.getInstance();

        this.pool = new Pool({
            user: this.config.username,
            host: this.config.host,
            database: this.config.database,
            password: this.config.password,
            port: this.config.port,
            max: this.config.maxConnections,
            idleTimeoutMillis: this.config.idleTimeout,
            connectionTimeoutMillis: this.config.connectionTimeout,
            ssl: this.config.ssl ? { rejectUnauthorized: false } : false
        });

        this.setupPoolListeners();
    }

    private setupPoolListeners(): void {
        this.pool.on('connect', () => {
            this.logger.debug('New database connection established');
        });

        this.pool.on('acquire', (client) => {
            this.logger.debug(`Connection acquired from pool (total: ${this.pool.totalCount})`);
        });

        this.pool.on('remove', () => {
            this.logger.debug('Connection removed from pool');
        });

        this.pool.on('error', (err) => {
            this.logger.error(`Database pool error: ${err.message}`);
        });
    }

    public async executeQuery<T>(
        query: string,
        params: any[] = [],
        options: QueryOptions = {}
    ): Promise<QueryResult<T>> {
        const {
            cacheKey,
            cacheTtl,
            explain,
            timeout = 30000,
            retryCount = 2
        } = options;

        const startTime = performance.now();

        try {
            // Check cache first if cacheKey is provided
            if (cacheKey) {
                const cachedResult = await this.cache.get<QueryResult<T>>(cacheKey);
                if (cachedResult) {
                    this.logger.debug(`Cache hit for query: ${query.substring(0, 50)}...`);
                    return cachedResult;
                }
            }

            // Execute the query with retry logic
            const result = await this.executeWithRetry(query, params, timeout, retryCount);

            // Cache the result if cacheKey is provided
            if (cacheKey && result.rowCount > 0) {
                await this.cache.set(cacheKey, result, cacheTtl);
            }

            // Log query performance
            const duration = performance.now() - startTime;
            this.logger.debug(`Query executed in ${duration.toFixed(2)}ms: ${query.substring(0, 50)}...`);

            // Run EXPLAIN if requested
            if (explain) {
                await this.logQueryPlan(query, params);
            }

            return result;
        } catch (err) {
            const duration = performance.now() - startTime;
            this.logger.error(`Query failed after ${duration.toFixed(2)}ms: ${query.substring(0, 50)}...`);
            this.logger.error(`Error details: ${err.message}`);
            throw err;
        }
    }

    private async executeWithRetry(
        query: string,
        params: any[],
        timeout: number,
        retryCount: number
    ): Promise<QueryResult> {
        let lastError: Error;

        for (let attempt = 1; attempt <= retryCount; attempt++) {
            const client = await this.pool.connect();

            try {
                // Set statement timeout
                await client.query(`SET statement_timeout = ${timeout}`);

                // Execute the query
                const result = await client.query(query, params);
                return result;
            } catch (err) {
                lastError = err;
                this.logger.warn(`Query attempt ${attempt} failed: ${err.message}`);

                // Only retry on certain errors
                if (!this.shouldRetry(err)) {
                    break;
                }

                // Exponential backoff
                const delay = Math.pow(2, attempt) * 100;
                this.logger.debug(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } finally {
                client.release();
            }
        }

        throw lastError;
    }

    private shouldRetry(err: Error): boolean {
        const retryableErrors = [
            'ECONNRESET',
            'ETIMEDOUT',
            'ECONNREFUSED',
            'connection terminated',
            'sorry, too many clients already'
        ];

        return retryableErrors.some(error =>
            err.message.includes(error)
        );
    }

    private async logQueryPlan(query: string, params: any[]): Promise<void> {
        try {
            const explainQuery = `EXPLAIN (ANALYZE, FORMAT JSON) ${query}`;
            const result = await this.pool.query(explainQuery, params);
            const plan = result.rows[0].QUERY_PLAN;

            this.logger.debug('Query execution plan:');
            this.logger.debug(JSON.stringify(plan, null, 2));

            // Analyze the plan for potential optimizations
            this.analyzeQueryPlan(plan);
        } catch (err) {
            this.logger.error(`Failed to get query plan: ${err.message}`);
        }
    }

    private analyzeQueryPlan(plan: any): void {
        const issues: string[] = [];

        // Check for sequential scans
        if (JSON.stringify(plan).includes('Seq Scan')) {
            issues.push('Sequential scan detected - consider adding indexes');
        }

        // Check for high cost operations
        if (plan[0]?.['Plan']?.['Total Cost'] > 1000) {
            issues.push('High cost operation detected - consider query optimization');
        }

        // Check for sorting operations
        if (JSON.stringify(plan).includes('Sort')) {
            issues.push('Sort operation detected - consider adding appropriate indexes');
        }

        // Check for nested loops
        if (JSON.stringify(plan).includes('Nested Loop')) {
            issues.push('Nested loop join detected - consider query restructuring');
        }

        if (issues.length > 0) {
            this.logger.warn('Query optimization recommendations:');
            issues.forEach(issue => this.logger.warn(`- ${issue}`));
        }
    }

    public async getClient(): Promise<PoolClient> {
        return this.pool.connect();
    }

    public async optimizeTable(tableName: string): Promise<void> {
        try {
            this.logger.info(`Starting optimization for table: ${tableName}`);

            // Analyze the table
            await this.pool.query(`ANALYZE ${tableName}`);
            this.logger.debug(`Analyzed table: ${tableName}`);

            // Vacuum the table
            await this.pool.query(`VACUUM (VERBOSE, ANALYZE) ${tableName}`);
            this.logger.debug(`Vacuumed table: ${tableName}`);

            // Reindex the table if it has indexes
            const indexes = await this.pool.query(
                `SELECT indexname FROM pg_indexes WHERE tablename = $1`,
                [tableName]
            );

            if (indexes.rowCount > 0) {
                for (const row of indexes.rows) {
                    await this.pool.query(`REINDEX INDEX CONCURRENTLY ${row.indexname}`);
                    this.logger.debug(`Reindexed: ${row.indexname}`);
                }
            }

            this.logger.info(`Optimization completed for table: ${tableName}`);
        } catch (err) {
            this.logger.error(`Failed to optimize table ${tableName}: ${err.message}`);
            throw err;
        }
    }

    public async createIndexIfNotExists(
        tableName: string,
        columnName: string,
        indexName?: string
    ): Promise<void> {
        try {
            const idxName = indexName || `${tableName}_${columnName}_idx`;
            const checkQuery = `
                SELECT 1 FROM pg_indexes
                WHERE tablename = $1 AND indexname = $2
            `;

            const result = await this.pool.query(checkQuery, [tableName, idxName]);

            if (result.rowCount === 0) {
                this.logger.info(`Creating index ${idxName} on ${tableName}.${columnName}`);
                await this.pool.query(`
                    CREATE INDEX CONCURRENTLY ${idxName}
                    ON ${tableName} (${columnName})
                `);
                this.logger.info(`Index ${idxName} created successfully`);
            } else {
                this.logger.debug(`Index ${idxName} already exists`);
            }
        } catch (err) {
            this.logger.error(`Failed to create index: ${err.message}`);
            throw err;
        }
    }

    public async close(): Promise<void> {
        try {
            await this.pool.end();
            this.logger.info('Database connection pool closed');
        } catch (err) {
            this.logger.error(`Error closing database pool: ${err.message}`);
        }
    }
}

interface QueryOptions {
    cacheKey?: string;
    cacheTtl?: number;
    explain?: boolean;
    timeout?: number;
    retryCount?: number;
}
```

### API Response Compression

```typescript
// src/middleware/compression-middleware.ts
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';
import zlib from 'zlib';

export class CompressionMiddleware {
    private logger: Logger;
    private compressionFilter: (req: Request, res: Response) => boolean;
    private compressionOptions: compression.CompressionOptions;

    constructor() {
        this.logger = new Logger('CompressionMiddleware');

        // Custom compression filter
        this.compressionFilter = (req: Request, res: Response): boolean => {
            // Don't compress if already compressed
            if (req.headers['x-no-compression']) {
                return false;
            }

            // Don't compress small responses
            if (res.getHeader('Content-Length') &&
                parseInt(res.getHeader('Content-Length') as string) < 1024) {
                return false;
            }

            // Don't compress binary data
            const contentType = res.getHeader('Content-Type') as string;
            if (contentType && (
                contentType.includes('image/') ||
                contentType.includes('video/') ||
                contentType.includes('audio/') ||
                contentType.includes('application/octet-stream')
            )) {
                return false;
            }

            return true;
        };

        // Compression options
        this.compressionOptions = {
            level: zlib.constants.Z_BEST_COMPRESSION, // Maximum compression
            threshold: 1024, // Minimum response size to compress (1KB)
            filter: this.compressionFilter,
            strategy: zlib.constants.Z_DEFAULT_STRATEGY,
            chunkSize: 16 * 1024 // 16KB chunks
        };
    }

    public getMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
        const compressor = compression(this.compressionOptions);

        return (req: Request, res: Response, next: NextFunction) => {
            const startTime = performance.now();

            // Add compression headers
            res.setHeader('Vary', 'Accept-Encoding');
            res.setHeader('X-Compression', 'enabled');

            // Track original write and end methods
            const originalWrite = res.write;
            const originalEnd = res.end;
            const originalSetHeader = res.setHeader;

            let compressionUsed = false;
            let originalContentLength: number | null = null;

            // Override setHeader to track content length
            res.setHeader = (name: string, value: string | number | string[]): Response => {
                if (name.toLowerCase() === 'content-length') {
                    originalContentLength = typeof value === 'number' ? value : parseInt(value as string);
                }
                return originalSetHeader.call(res, name, value);
            };

            // Override write method
            res.write = (chunk: any, encoding?: any, callback?: any): boolean => {
                if (!compressionUsed && this.compressionFilter(req, res)) {
                    compressionUsed = true;
                    this.logger.debug(`Compression enabled for ${req.path}`);
                }
                return originalWrite.call(res, chunk, encoding, callback);
            };

            // Override end method
            res.end = (chunk?: any, encoding?: any, callback?: any): Response => {
                if (compressionUsed) {
                    const duration = performance.now() - startTime;
                    const compressedSize = res.getHeader('Content-Length') ?
                        parseInt(res.getHeader('Content-Length') as string) : 0;

                    let compressionRatio = 0;
                    if (originalContentLength && compressedSize) {
                        compressionRatio = 1 - (compressedSize / originalContentLength);
                    }

                    this.logger.info(
                        `Compressed response for ${req.path} - ` +
                        `Original: ${originalContentLength} bytes, ` +
                        `Compressed: ${compressedSize} bytes, ` +
                        `Ratio: ${(compressionRatio * 100).toFixed(2)}%, ` +
                        `Time: ${duration.toFixed(2)}ms`
                    );
                }
                return originalEnd.call(res, chunk, encoding, callback);
            };

            // Apply compression
            compressor(req, res, next);
        };
    }

    public async compressString(content: string, level?: number): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            zlib.gzip(content, {
                level: level || zlib.constants.Z_BEST_COMPRESSION
            }, (err, result) => {
                if (err) {
                    this.logger.error(`Compression failed: ${err.message}`);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    public async decompressBuffer(buffer: Buffer): Promise<string> {
        return new Promise((resolve, reject) => {
            zlib.gunzip(buffer, (err, result) => {
                if (err) {
                    this.logger.error(`Decompression failed: ${err.message}`);
                    reject(err);
                } else {
                    resolve(result.toString());
                }
            });
        });
    }

    public getCompressionStats(): CompressionStats {
        return {
            enabled: true,
            level: this.compressionOptions.level || zlib.constants.Z_DEFAULT_COMPRESSION,
            threshold: this.compressionOptions.threshold || 0,
            strategy: this.compressionOptions.strategy || zlib.constants.Z_DEFAULT_STRATEGY
        };
    }

    public setCompressionLevel(level: number): void {
        if (level < -1 || level > 9) {
            throw new Error('Compression level must be between -1 and 9');
        }

        this.compressionOptions.level = level;
        this.logger.info(`Compression level set to ${level}`);
    }

    public setCompressionThreshold(threshold: number): void {
        if (threshold < 0) {
            throw new Error('Threshold must be a positive number');
        }

        this.compressionOptions.threshold = threshold;
        this.logger.info(`Compression threshold set to ${threshold} bytes`);
    }
}

interface CompressionStats {
    enabled: boolean;
    level: number;
    threshold: number;
    strategy: number;
}
```

### Lazy Loading Implementation

```typescript
// src/utils/lazy-loader.ts
import { Logger } from './logger';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

export class LazyLoader<T> {
    private logger: Logger;
    private loader: () => Promise<T>;
    private cache: { value?: T, loading: boolean, error?: Error } = { loading: false };
    private eventEmitter: EventEmitter;
    private timeout: number;
    private maxRetries: number;
    private retryDelay: number;
    private lastAccessed: number = 0;
    private ttl: number;

    constructor(
        loader: () => Promise<T>,
        options: LazyLoaderOptions = {}
    ) {
        this.logger = new Logger('LazyLoader');
        this.loader = loader;
        this.eventEmitter = new EventEmitter();
        this.timeout = options.timeout || 10000;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000;
        this.ttl = options.ttl || 300000; // 5 minutes default TTL
    }

    public async get(): Promise<T> {
        this.lastAccessed = performance.now();

        // Return cached value if available and not expired
        if (this.cache.value !== undefined && !this.isExpired()) {
            this.logger.debug('Returning cached value');
            return this.cache.value;
        }

        // If already loading, wait for the load to complete
        if (this.cache.loading) {
            this.logger.debug('Waiting for existing load to complete');
            return this.waitForLoad();
        }

        // Start loading
        this.cache.loading = true;
        this.logger.debug('Starting lazy load');

        try {
            const value = await this.loadWithRetry();
            this.cache.value = value;
            this.cache.error = undefined;
            this.eventEmitter.emit('loaded', value);
            return value;
        } catch (err) {
            this.cache.error = err as Error;
            this.eventEmitter.emit('error', err);
            throw err;
        } finally {
            this.cache.loading = false;
        }
    }

    private async waitForLoad(): Promise<T> {
        return new Promise((resolve, reject) => {
            const onLoaded = (value: T) => {
                this.eventEmitter.off('error', onError);
                resolve(value);
            };

            const onError = (err: Error) => {
                this.eventEmitter.off('loaded', onLoaded);
                reject(err);
            };

            this.eventEmitter.once('loaded', onLoaded);
            this.eventEmitter.once('error', onError);

            // Set timeout to prevent hanging
            setTimeout(() => {
                this.eventEmitter.off('loaded', onLoaded);
                this.eventEmitter.off('error', onError);
                reject(new Error('Lazy load timeout'));
            }, this.timeout);
        });
    }

    private async loadWithRetry(): Promise<T> {
        let lastError: Error;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const startTime = performance.now();
                const value = await this.loader();
                const duration = performance.now() - startTime;

                this.logger.debug(`Lazy load completed in ${duration.toFixed(2)}ms (attempt ${attempt})`);
                return value;
            } catch (err) {
                lastError = err as Error;
                this.logger.warn(`Lazy load attempt ${attempt} failed: ${err.message}`);

                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1);
                    this.logger.debug(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    private isExpired(): boolean {
        return performance.now() - this.lastAccessed > this.ttl;
    }

    public async refresh(): Promise<T> {
        this.logger.debug('Forcing refresh of lazy loaded value');
        this.cache.value = undefined;
        this.cache.error = undefined;
        return this.get();
    }

    public getStatus(): LazyLoaderStatus {
        return {
            loading: this.cache.loading,
            hasValue: this.cache.value !== undefined,
            error: this.cache.error?.message,
            lastAccessed: this.lastAccessed,
            expiresIn: this.isExpired() ? 0 : this.ttl - (performance.now() - this.lastAccessed)
        };
    }

    public on(event: 'loaded', listener: (value: T) => void): void;
    public on(event: 'error', listener: (error: Error) => void): void;
    public on(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: 'loaded', listener: (value: T) => void): void;
    public off(event: 'error', listener: (error: Error) => void): void;
    public off(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    public clear(): void {
        this.cache.value = undefined;
        this.cache.error = undefined;
        this.logger.debug('Cleared lazy loaded value');
    }
}

interface LazyLoaderOptions {
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
    ttl?: number;
}

interface LazyLoaderStatus {
    loading: boolean;
    hasValue: boolean;
    error?: string;
    lastAccessed: number;
    expiresIn: number;
}

// Example usage with predictive analytics models
export class ModelLazyLoader {
    private static instances: Map<string, LazyLoader<any>> = new Map();
    private static logger: Logger = new Logger('ModelLazyLoader');

    public static getModel<T>(modelName: string, loader: () => Promise<T>): LazyLoader<T> {
        if (!this.instances.has(modelName)) {
            this.logger.info(`Creating lazy loader for model: ${modelName}`);
            const lazyLoader = new LazyLoader<T>(loader, {
                timeout: 30000,
                maxRetries: 3,
                retryDelay: 2000,
                ttl: 600000 // 10 minutes
            });

            // Add event listeners
            lazyLoader.on('loaded', (model) => {
                this.logger.info(`Model ${modelName} loaded successfully`);
            });

            lazyLoader.on('error', (err) => {
                this.logger.error(`Error loading model ${modelName}: ${err.message}`);
            });

            this.instances.set(modelName, lazyLoader);
        }

        return this.instances.get(modelName) as LazyLoader<T>;
    }

    public static async getChurnPredictionModel(): Promise<LazyLoader<any>> {
        return this.getModel('churn-prediction', async () => {
            // In a real implementation, this would load the actual model
            this.logger.debug('Loading churn prediction model...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
            return {
                predict: (features: any) => {
                    // Mock prediction
                    return Math.random() > 0.5 ? 1 : 0;
                },
                version: '1.0.0'
            };
        });
    }

    public static async getSalesForecastModel(): Promise<LazyLoader<any>> {
        return this.getModel('sales-forecast', async () => {
            this.logger.debug('Loading sales forecast model...');
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate loading
            return {
                predict: (features: any) => {
                    // Mock prediction
                    return features.baseValue * (0.8 + Math.random() * 0.4);
                },
                version: '1.2.0'
            };
        });
    }

    public static clearAll(): void {
        this.logger.info('Clearing all lazy loaded models');
        this.instances.forEach((loader, modelName) => {
            loader.clear();
        });
        this.instances.clear();
    }
}
```

### Request Debouncing

```typescript
// src/utils/request-debouncer.ts
import { Logger } from './logger';
import { performance } from 'perf_hooks';

export class RequestDebouncer {
    private static instances: Map<string, RequestDebouncer> = new Map();
    private logger: Logger;
    private key: string;
    private delay: number;
    private lastCallTime: number = 0;
    private pendingPromise: Promise<any> | null = null;
    private pendingResolve: ((value: any) => void) | null = null;
    private pendingReject: ((reason?: any) => void) | null = null;
    private timeoutId: NodeJS.Timeout | null = null;
    private maxWait: number;
    private leading: boolean;
    private trailing: boolean;

    private constructor(
        key: string,
        options: DebouncerOptions = {}
    ) {
        this.key = key;
        this.logger = new Logger(`RequestDebouncer:${key}`);
        this.delay = options.delay || 300;
        this.maxWait = options.maxWait || 1000;
        this.leading = options.leading !== false;
        this.trailing = options.trailing !== false;
    }

    public static getInstance(
        key: string,
        options: DebouncerOptions = {}
    ): RequestDebouncer {
        if (!this.instances.has(key)) {
            this.instances.set(key, new RequestDebouncer(key, options));
        }
        return this.instances.get(key)!;
    }

    public async debounce<T>(fn: () => Promise<T>): Promise<T> {
        const now = performance.now();
        const elapsed = now - this.lastCallTime;

        this.lastCallTime = now;

        // Clear any existing timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        // If we're leading and there's no pending promise, execute immediately
        if (this.leading && !this.pendingPromise && elapsed >= this.delay) {
            this.logger.debug('Executing leading edge request');
            return this.executeFn(fn);
        }

        // If there's a pending promise, return it
        if (this.pendingPromise) {
            this.logger.debug('Returning pending promise');
            return this.pendingPromise;
        }

        // Create a new promise that will be resolved later
        this.pendingPromise = new Promise<T>((resolve, reject) => {
            this.pendingResolve = resolve;
            this.pendingReject = reject;
        });

        // Set up the trailing edge execution
        if (this.trailing) {
            this.timeoutId = setTimeout(() => {
                this.logger.debug('Executing trailing edge request');
                this.executeFn(fn).then(
                    value => this.pendingResolve?.(value),
                    error => this.pendingReject?.(error)
                );
            }, this.delay);
        }

        // Set up max wait timeout
        if (this.maxWait > 0) {
            setTimeout(() => {
                if (this.pendingPromise) {
                    this.logger.debug('Max wait time reached, executing request');
                    this.executeFn(fn).then(
                        value => this.pendingResolve?.(value),
                        error => this.pendingReject?.(error)
                    );
                }
            }, this.maxWait);
        }

        return this.pendingPromise;
    }

    private async executeFn<T>(fn: () => Promise<T>): Promise<T> {
        try {
            this.logger.debug('Executing debounced function');
            const result = await fn();
            this.clearPending();
            return result;
        } catch (error) {
            this.clearPending();
            throw error;
        }
    }

    private clearPending(): void {
        this.pendingPromise = null;
        this.pendingResolve = null;
        this.pendingReject = null;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    public getStatus(): DebouncerStatus {
        return {
            key: this.key,
            lastCallTime: this.lastCallTime,
            pending: !!this.pendingPromise,
            delay: this.delay,
            maxWait: this.maxWait,
            leading: this.leading,
            trailing: this.trailing
        };
    }

    public cancel(): void {
        this.logger.debug('Cancelling pending debounced request');
        if (this.pendingPromise && this.pendingReject) {
            this.pendingReject(new Error('Request cancelled'));
        }
        this.clearPending();
    }

    public flush(): void {
        this.logger.debug('Flushing debounced request');
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.pendingPromise) {
            this.pendingResolve?.(undefined);
            this.clearPending();
        }
    }

    public static clearAll(): void {
        this.instances.forEach(debouncer => {
            debouncer.cancel();
        });
        this.instances.clear();
    }
}

interface DebouncerOptions {
    delay?: number;
    maxWait?: number;
    leading?: boolean;
    trailing?: boolean;
}

interface DebouncerStatus {
    key: string;
    lastCallTime: number;
    pending: boolean;
    delay: number;
    maxWait: number;
    leading: boolean;
    trailing: boolean;
}

// Example usage with predictive analytics API
export class AnalyticsDebouncer {
    private static logger: Logger = new Logger('AnalyticsDebouncer');
    private static DEBOUNCE_KEYS = {
        PREDICTION: 'prediction-request',
        FORECAST: 'forecast-request',
        RECOMMENDATION: 'recommendation-request',
        ANOMALY_DETECTION: 'anomaly-detection-request'
    };

    public static async getPrediction(
        customerId: string,
        features: any[]
    ): Promise<any> {
        const key = `${this.DEBOUNCE_KEYS.PREDICTION}:${customerId}`;
        const debouncer = RequestDebouncer.getInstance(key, {
            delay: 500,
            maxWait: 2000,
            leading: true
        });

        return debouncer.debounce(async () => {
            this.logger.info(`Fetching prediction for customer ${customerId}`);
            // In a real implementation, this would call the actual prediction API
            await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
            return {
                customerId,
                prediction: Math.random() > 0.3 ? 'high_value' : 'low_value',
                confidence: 0.85 + Math.random() * 0.15,
                timestamp: new Date().toISOString()
            };
        });
    }

    public static async getSalesForecast(
        region: string,
        timeRange: string
    ): Promise<any> {
        const key = `${this.DEBOUNCE_KEYS.FORECAST}:${region}:${timeRange}`;
        const debouncer = RequestDebouncer.getInstance(key, {
            delay: 800,
            maxWait: 3000,
            leading: false
        });

        return debouncer.debounce(async () => {
            this.logger.info(`Fetching sales forecast for ${region} (${timeRange})`);
            // Simulate API call with variable delay
            const delay = 200 + Math.random() * 500;
            await new Promise(resolve => setTimeout(resolve, delay));

            return {
                region,
                timeRange,
                forecast: Array.from({ length: 7 }, (_, i) => ({
                    date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
                    value: 1000 + Math.random() * 5000,
                    confidence: 0.7 + Math.random() * 0.3
                })),
                generatedAt: new Date().toISOString()
            };
        });
    }

    public static async getRecommendations(
        userId: string,
        context: any
    ): Promise<any> {
        const key = `${this.DEBOUNCE_KEYS.RECOMMENDATION}:${userId}`;
        const debouncer = RequestDebouncer.getInstance(key, {
            delay: 400,
            maxWait: 1500,
            leading: true,
            trailing: true
        });

        return debouncer.debounce(async () => {
            this.logger.info(`Fetching recommendations for user ${userId}`);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 250));

            return {
                userId,
                recommendations: Array.from({ length: 5 }, (_, i) => ({
                    id: `rec-${i}`,
                    productId: `prod-${Math.floor(Math.random() * 100)}`,
                    score: 0.5 + Math.random() * 0.5,
                    reason: ['similar_to_purchased', 'trending', 'personalized'][Math.floor(Math.random() * 3)]
                })),
                context,
                generatedAt: new Date().toISOString()
            };
        });
    }

    public static async detectAnomalies(
        datasetId: string,
        parameters: any
    ): Promise<any> {
        const key = `${this.DEBOUNCE_KEYS.ANOMALY_DETECTION}:${datasetId}`;
        const debouncer = RequestDebouncer.getInstance(key, {
            delay: 1000,
            maxWait: 5000,
            leading: false
        });

        return debouncer.debounce(async () => {
            this.logger.info(`Detecting anomalies in dataset ${datasetId}`);
            // Simulate longer API call
            await new Promise(resolve => setTimeout(resolve, 800));

            return {
                datasetId,
                anomalies: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => ({
                    id: `anomaly-${i}`,
                    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                    value: 100 + Math.random() * 1000,
                    expectedRange: [50, 200],
                    severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
                })),
                parameters,
                generatedAt: new Date().toISOString()
            };
        });
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
import { DatabaseConfig } from '../config/database-config';

export class ConnectionPool {
    private static instance: ConnectionPool;
    private pool: Pool;
    private logger: Logger;
    private config: DatabaseConfig;
    private eventEmitter: EventEmitter;
    private activeConnections: Set<PoolClient> = new Set();
    private connectionMetrics: ConnectionMetrics = {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        lastAcquisitionTime: 0,
        acquisitionTimes: []
    };

    private constructor() {
        this.config = new DatabaseConfig();
        this.logger = new Logger('ConnectionPool');
        this.eventEmitter = new EventEmitter();

        const poolConfig: PoolConfig = {
            user: this.config.username,
            host: this.config.host,
            database: this.config.database,
            password: this.config.password,
            port: this.config.port,
            max: this.config.maxConnections,
            min: this.config.minConnections,
            idleTimeoutMillis: this.config.idleTimeout,
            connectionTimeoutMillis: this.config.connectionTimeout,
            ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
            application_name: 'predictive-analytics-service'
        };

        this.pool = new Pool(poolConfig);
        this.setupPoolListeners();
        this.setupMetricsCollection();
    }

    public static getInstance(): ConnectionPool {
        if (!ConnectionPool.instance) {
            ConnectionPool.instance = new ConnectionPool();
        }
        return ConnectionPool.instance;
    }

    private setupPoolListeners(): void {
        this.pool.on('connect', (client) => {
            this.logger.debug('New database connection established');
            this.connectionMetrics.totalConnections++;
            this.eventEmitter.emit('connect', client);
        });

        this.pool.on('acquire', (client) => {
            this.activeConnections.add(client);
            this.connectionMetrics.activeConnections = this.activeConnections.size;
            this.connectionMetrics.idleConnections = this.pool.idleCount;
            this.connectionMetrics.waitingClients = this.pool.waitingCount;
            this.logger.debug(`Connection acquired (active: ${this.connectionMetrics.activeConnections}, idle: ${this.connectionMetrics.idleConnections})`);
            this.eventEmitter.emit('acquire', client);
        });

        this.pool.on('remove', (client) => {
            this.activeConnections.delete(client);
            this.connectionMetrics.activeConnections = this.activeConnections.size;
            this.connectionMetrics.idleConnections = this.pool.idleCount;
            this.logger.debug(`Connection removed (active: ${this.connectionMetrics.activeConnections}, idle: ${this.connectionMetrics.idleConnections})`);
            this.eventEmitter.emit('remove', client);
        });

        this.pool.on('error', (err, client) => {
            this.logger.error(`Database pool error: ${err.message}`);
            if (client) {
                this.activeConnections.delete(client);
                this.connectionMetrics.activeConnections = this.activeConnections.size;
            }
            this.eventEmitter.emit('error', err, client);
        });
    }

    private setupMetricsCollection(): void {
        // Collect metrics every 30 seconds
        setInterval(() => {
            this.connectionMetrics.idleConnections = this.pool.idleCount;
            this.connectionMetrics.waitingClients = this.pool.waitingCount;
            this.connectionMetrics.activeConnections = this.activeConnections.size;

            // Calculate average acquisition time
            if (this.connectionMetrics.acquisitionTimes.length > 0) {
                const sum = this.connectionMetrics.acquisitionTimes.reduce((a, b) => a + b, 0);
                const avg = sum / this.connectionMetrics.acquisitionTimes.length;
                this.logger.debug(`Connection pool metrics - Active: ${this.connectionMetrics.activeConnections}, Idle: ${this.connectionMetrics.idleConnections}, Waiting: ${this.connectionMetrics.waitingClients}, Avg Acquisition Time: ${avg.toFixed(2)}ms`);
                this.connectionMetrics.acquisitionTimes = [];
            }
        }, 30000);
    }

    public async getClient(): Promise<PoolClient> {
        const startTime = performance.now();

        try {
            const client = await this.pool.connect();
            const duration = performance.now() - startTime;

            this.connectionMetrics.lastAcquisitionTime = duration;
            this.connectionMetrics.acquisitionTimes.push(duration);

            // Set up client-specific listeners
            client.on('error', (err) => {
                this.logger.error(`Client error: ${err.message}`);
                this.activeConnections.delete(client);
            });

            client.on('end', () => {
                this.activeConnections.delete(client);
            });

            return client;
        } catch (err) {
            const duration = performance.now() - startTime;
            this.logger.error(`Failed to get client after ${duration.toFixed(2)}ms: ${err.message}`);
            throw err;
        }
    }

    public async executeQuery<T>(
        query: string,
        params: any[] = [],
        options: QueryOptions = {}
    ): Promise<QueryResult<T>> {
        const {
            client: providedClient,
            timeout = 30000,
            retryCount = 2,
            logQuery = true
        } = options;

        const startTime = performance.now();
        let client: PoolClient | null = null;
        let lastError: Error;

        try {
            // Get a client from the pool if not provided
            client = providedClient || await this.getClient();

            // Set statement timeout
            await client.query(`SET statement_timeout = ${timeout}`);

            // Execute the query
            const result = await client.query(query, params);

            if (logQuery) {
                const duration = performance.now() - startTime;
                this.logger.debug(`Query executed in ${duration.toFixed(2)}ms: ${query.substring(0, 100)}...`);
            }

            return result;
        } catch (err) {
            lastError = err as Error;
            const duration = performance.now() - startTime;

            if (logQuery) {
                this.logger.error(`Query failed after ${duration.toFixed(2)}ms: ${query.substring(0, 100)}...`);
                this.logger.error(`Error details: ${err.message}`);
            }

            // Only retry if we're not using a provided client
            if (!providedClient && retryCount > 0) {
                this.logger.debug(`Retrying query (${retryCount} attempts remaining)`);
                return this.executeQuery(query, params, {
                    ...options,
                    retryCount: retryCount - 1
                });
            }

            throw err;
        } finally {
            // Release the client if we got it from the pool
            if (!providedClient && client) {
                client.release();
            }
        }
    }

    public async executeTransaction<T>(
        queries: Array<{ query: string; params?: any[] }>,
        options: TransactionOptions = {}
    ): Promise<T> {
        const {
            isolationLevel = 'READ COMMITTED',
            retryCount = 2,
            timeout = 30000
        } = options;

        const client = await this.getClient();
        let lastError: Error;

        try {
            await client.query('BEGIN');
            await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
            await client.query(`SET statement_timeout = ${timeout}`);

            const results: any[] = [];

            for (const { query, params } of queries) {
                const result = await client.query(query, params);
                results.push(result);
            }

            await client.query('COMMIT');
            return results.length === 1 ? results[0] : results;
        } catch (err) {
            await client.query('ROLLBACK');
            lastError = err as Error;

            this.logger.error(`Transaction failed: ${err.message}`);

            if (retryCount > 0) {
                this.logger.debug(`Retrying transaction (${retryCount} attempts remaining)`);
                return this.executeTransaction(queries, {
                    ...options,
                    retryCount: retryCount - 1
                });
            }

            throw err;
        } finally {
            client.release();
        }
    }

    public async checkConnection(): Promise<boolean> {
        let client: PoolClient | null = null;

        try {
            client = await this.getClient();
            await client.query('SELECT 1');
            return true;
        } catch (err) {
            this.logger.error(`Connection check failed: ${err.message}`);
            return false;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    public getPoolStats(): PoolStats {
        return {
            totalConnections: this.connectionMetrics.totalConnections,
            activeConnections: this.connectionMetrics.activeConnections,
            idleConnections: this.connectionMetrics.idleConnections,
            waitingClients: this.connectionMetrics.waitingClients,
            maxConnections: this.config.maxConnections,
            minConnections: this.config.minConnections,
            lastAcquisitionTime: this.connectionMetrics.lastAcquisitionTime,
            averageAcquisitionTime: this.calculateAverageAcquisitionTime()
        };
    }

    private calculateAverageAcquisitionTime(): number {
        if (this.connectionMetrics.acquisitionTimes.length === 0) {
            return 0;
        }

        const sum = this.connectionMetrics.acquisitionTimes.reduce((a, b) => a + b, 0);
        return sum / this.connectionMetrics.acquisitionTimes.length;
    }

    public async resizePool(newSize: number): Promise<void> {
        if (newSize < 1) {
            throw new Error('Pool size must be at least 1');
        }

        if (newSize === this.config.maxConnections) {
            this.logger.debug('Pool size unchanged');
            return;
        }

        this.logger.info(`Resizing connection pool from ${this.config.maxConnections} to ${newSize}`);
        this.config.maxConnections = newSize;
        this.pool.options.max = newSize;
    }

    public async close(): Promise<void> {
        try {
            await this.pool.end();
            this.logger.info('Database connection pool closed');
        } catch (err) {
            this.logger.error(`Error closing database pool: ${err.message}`);
            throw err;
        }
    }

    public on(event: 'connect', listener: (client: PoolClient) => void): void;
    public on(event: 'acquire', listener: (client: PoolClient) => void): void;
    public on(event: 'remove', listener: (client: PoolClient) => void): void;
    public on(event: 'error', listener: (err: Error, client?: PoolClient) => void): void;
    public on(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: 'connect', listener: (client: PoolClient) => void): void;
    public off(event: 'acquire', listener: (client: PoolClient) => void): void;
    public off(event: 'remove', listener: (client: PoolClient) => void): void;
    public off(event: 'error', listener: (err: Error, client?: PoolClient) => void): void;
    public off(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }
}

interface QueryOptions {
    client?: PoolClient;
    timeout?: number;
    retryCount?: number;
    logQuery?: boolean;
}

interface TransactionOptions {
    isolationLevel?: 'SERIALIZABLE' | 'REPEATABLE READ' | 'READ COMMITTED' | 'READ UNCOMMITTED';
    retryCount?: number;
    timeout?: number;
}

interface PoolStats {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
    maxConnections: number;
    minConnections: number;
    lastAcquisitionTime: number;
    averageAcquisitionTime: number;
}

interface ConnectionMetrics {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
    lastAcquisitionTime: number;
    acquisitionTimes: number[];
}
```

---

## Real-Time Features (350 lines)

### WebSocket Server Setup

```typescript
// src/websocket/websocket-server.ts
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { WebSocketServer } from 'ws';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { RateLimiter } from '../security/rate-limiter';
import { AuthService } from '../services/auth-service';
import { ConnectionManager } from './connection-manager';
import { ChannelManager } from './channel-manager';
import { MessageQueue } from './message-queue';

export class WebSocketServerInstance {
    private static instance: WebSocketServerInstance;
    private wss: WebSocketServer;
    private logger: Logger;
    private eventEmitter: EventEmitter;
    private connectionManager: ConnectionManager;
    private channelManager: ChannelManager;
    private messageQueue: MessageQueue;
    private rateLimiter: RateLimiter;
    private authService: AuthService;
    private isShuttingDown: boolean = false;

    private constructor(server: HttpServer | HttpsServer) {
        this.logger = new Logger('WebSocketServer');
        this.eventEmitter = new EventEmitter();
        this.connectionManager = ConnectionManager.getInstance();
        this.channelManager = ChannelManager.getInstance();
        this.messageQueue = MessageQueue.getInstance();
        this.rateLimiter = new RateLimiter({
            points: 100,
            duration: 60,
            blockDuration: 300
        });
        this.authService = new AuthService();

        // Create WebSocket server
        this.wss = new WebSocketServer({
            server,
            clientTracking: true,
            maxPayload: 1024 * 1024, // 1MB max payload
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

        this.setupWebSocketServer();
        this.setupEventListeners();
        this.setupMessageProcessing();
    }

    public static getInstance(server?: HttpServer | HttpsServer): WebSocketServerInstance {
        if (!WebSocketServerInstance.instance && server) {
            WebSocketServerInstance.instance = new WebSocketServerInstance(server);
        }
        return WebSocketServerInstance.instance;
    }

    private setupWebSocketServer(): void {
        this.logger.info('WebSocket server initialized');

        this.wss.on('connection', (ws, req) => {
            const startTime = performance.now();
            const connectionId = uuidv4();
            const ip = req.socket.remoteAddress || 'unknown';

            this.logger.info(`New WebSocket connection attempt from ${ip}`);

            // Rate limiting
            if (this.rateLimiter.isRateLimited(ip)) {
                this.logger.warn(`Connection from ${ip} rate limited`);
                ws.close(1008, 'Too many connection attempts');
                return;
            }

            // Authenticate the connection
            this.authenticateConnection(ws, req, connectionId, ip)
                .then((user) => {
                    const duration = performance.now() - startTime;
                    this.logger.info(`Connection ${connectionId} authenticated in ${duration.toFixed(2)}ms`);

                    // Register the connection
                    this.connectionManager.addConnection(connectionId, ws, user, ip);

                    // Set up connection event listeners
                    this.setupConnectionListeners(ws, connectionId, user);

                    // Send welcome message
                    ws.send(JSON.stringify({
                        type: 'welcome',
                        connectionId,
                        timestamp: new Date().toISOString(),
                        user: {
                            id: user.id,
                            username: user.username,
                            roles: user.roles
                        }
                    }));

                    this.eventEmitter.emit('connection', connectionId, user);
                })
                .catch((err) => {
                    this.logger.error(`Authentication failed for connection ${connectionId}: ${err.message}`);
                    ws.close(1008, 'Authentication failed');
                });
        });

        this.wss.on('error', (error) => {
            this.logger.error(`WebSocket server error: ${error.message}`);
            this.eventEmitter.emit('error', error);
        });

        this.wss.on('close', () => {
            this.logger.info('WebSocket server closed');
            this.eventEmitter.emit('close');
        });
    }

    private async authenticateConnection(
        ws: WebSocket,
        req: any,
        connectionId: string,
        ip: string
    ): Promise<any> {
        // Check for token in query params or headers
        let token: string | null = null;

        if (req.url) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            token = url.searchParams.get('token');
        }

        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            throw new Error('No authentication token provided');
        }

        // Verify the token
        const user = await this.authService.verifyToken(token);

        if (!user) {
            throw new Error('Invalid authentication token');
        }

        // Check if user is already connected
        if (this.connectionManager.isUserConnected(user.id)) {
            throw new Error('User already connected');
        }

        return user;
    }

    private setupConnectionListeners(ws: WebSocket, connectionId: string, user: any): void {
        ws.on('message', (data) => {
            this.handleIncomingMessage(ws, connectionId, user, data);
        });

        ws.on('ping', () => {
            this.logger.debug(`Received ping from connection ${connectionId}`);
            ws.pong();
        });

        ws.on('pong', () => {
            this.logger.debug(`Received pong from connection ${connectionId}`);
        });

        ws.on('close', (code, reason) => {
            this.logger.info(`Connection ${connectionId} closed: ${code} - ${reason}`);
            this.connectionManager.removeConnection(connectionId);
            this.channelManager.removeConnectionFromAllChannels(connectionId);
            this.eventEmitter.emit('disconnect', connectionId, user);
        });

        ws.on('error', (error) => {
            this.logger.error(`Connection ${connectionId} error: ${error.message}`);
            this.connectionManager.removeConnection(connectionId);
            this.channelManager.removeConnectionFromAllChannels(connectionId);
        });
    }

    private handleIncomingMessage(ws: WebSocket, connectionId: string, user: any, data: WebSocket.RawData): void {
        try {
            // Rate limiting
            if (this.rateLimiter.isRateLimited(user.id)) {
                ws.send(JSON.stringify({
                    type: 'error',
                    code: 429,
                    message: 'Too many messages, please slow down'
                }));
                return;
            }

            // Parse the message
            let message: any;
            try {
                message = JSON.parse(data.toString());
            } catch (err) {
                this.logger.warn(`Invalid JSON received from connection ${connectionId}`);
                ws.send(JSON.stringify({
                    type: 'error',
                    code: 400,
                    message: 'Invalid JSON format'
                }));
                return;
            }

            // Validate the message
            if (!this.isValidMessage(message)) {
                ws.send(JSON.stringify({
                    type: 'error',
                    code: 400,
                    message: 'Invalid message format'
                }));
                return;
            }

            // Process the message
            this.processMessage(ws, connectionId, user, message);
        } catch (err) {
            this.logger.error(`Error handling message from connection ${connectionId}: ${err.message}`);
            ws.send(JSON.stringify({
                type: 'error',
                code: 500,
                message: 'Internal server error'
            }));
        }
    }

    private isValidMessage(message: any): boolean {
        if (!message || typeof message !== 'object') {
            return false;
        }

        if (!message.type || typeof message.type !== 'string') {
            return false;
        }

        // Additional validation based on message type
        switch (message.type) {
            case 'subscribe':
                return message.channel && typeof message.channel === 'string';
            case 'unsubscribe':
                return message.channel && typeof message.channel === 'string';
            case 'publish':
                return message.channel && typeof message.channel === 'string' &&
                       message.data !== undefined;
            case 'direct':
                return message.to && typeof message.to === 'string' &&
                       message.data !== undefined;
            case 'ping':
                return true;
            default:
                return false;
        }
    }

    private processMessage(ws: WebSocket, connectionId: string, user: any, message: any): void {
        const startTime = performance.now();

        switch (message.type) {
            case 'subscribe':
                this.handleSubscribe(ws, connectionId, user, message);
                break;
            case 'unsubscribe':
                this.handleUnsubscribe(ws, connectionId, user, message);
                break;
            case 'publish':
                this.handlePublish(ws, connectionId, user, message);
                break;
            case 'direct':
                this.handleDirectMessage(ws, connectionId, user, message);
                break;
            case 'ping':
                this.handlePing(ws, connectionId, user);
                break;
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    code: 400,
                    message: `Unknown message type: ${message.type}`
                }));
        }

        const duration = performance.now() - startTime;
        this.logger.debug(`Processed ${message.type} message in ${duration.toFixed(2)}ms`);
    }

    private handleSubscribe(ws: WebSocket, connectionId: string, user: any, message: any): void {
        const { channel, params } = message;

        // Check if user has permission to subscribe to this channel
        if (!this.hasChannelPermission(user, channel, 'subscribe')) {
            ws.send(JSON.stringify({
                type: 'error',
                code: 403,
                message: `No permission to subscribe to channel ${channel}`
            }));
            return;
        }

        // Subscribe the connection to the channel
        this.channelManager.addConnectionToChannel(connectionId, channel, user, params)
            .then(() => {
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    channel,
                    timestamp: new Date().toISOString()
                }));

                // Send any queued messages for this channel
                this.messageQueue.processQueuedMessages(channel, connectionId);
            })
            .catch((err) => {
                this.logger.error(`Failed to subscribe connection ${connectionId} to channel ${channel}: ${err.message}`);
                ws.send(JSON.stringify({
                    type: 'error',
                    code: 500,
                    message: `Failed to subscribe to channel ${channel}`
                }));
            });
    }

    private handleUnsubscribe(ws: WebSocket, connectionId: string, user: any, message: any): void {
        const { channel } = message;

        // Unsubscribe the connection from the channel
        this.channelManager.removeConnectionFromChannel(connectionId, channel)
            .then(() => {
                ws.send(JSON.stringify({
                    type: 'unsubscribed',
                    channel,
                    timestamp: new Date().toISOString()
                }));
            })
            .catch((err) => {
                this.logger.error(`Failed to unsubscribe connection ${connectionId} from channel ${channel}: ${err.message}`);
                ws.send(JSON.stringify({
                    type: 'error',
                    code: 500,
                    message: `Failed to unsubscribe from channel ${channel}`
                }));
            });
    }

    private handlePublish(ws: WebSocket, connectionId: string, user: any, message: any): void {
        const { channel, data } = message;

        // Check if user has permission to publish to this channel
        if (!this.hasChannelPermission(user, channel, 'publish')) {
            ws.send(JSON.stringify({
                type: 'error',
                code: 403,
                message: `No permission to publish to channel ${channel}`
            }));
            return;
        }

        // Create the message object
        const msg = {
            id: uuidv4(),
            type: 'message',
            channel,
            data,
            from: {
                connectionId,
                userId: user.id,
                username: user.username
            },
            timestamp: new Date().toISOString()
        };

        // Publish the message to the channel
        this.channelManager.publishToChannel(channel, msg)
            .then(() => {
                ws.send(JSON.stringify({
                    type: 'published',
                    channel,
                    messageId: msg.id,
                    timestamp: msg.timestamp
                }));
            })
            .catch((err) => {
                this.logger.error(`Failed to publish message to channel ${channel}: ${err.message}`);
                ws.send(JSON.stringify({
                    type: 'error',
                    code: 500,
                    message: `Failed to publish message to channel ${channel}`
                }));
            });
    }

    private handleDirectMessage(ws: WebSocket, connectionId: string, user: any, message: any): void {
        const { to, data } = message;

        // Check if the target user is connected
        if (!this.connectionManager.isUserConnected(to)) {
            ws.send(JSON.stringify({
                type: 'error',
                code: 404,
                message: `User ${to} is not connected`
            }));
            return;
        }

        // Create the message object
        const msg = {
            id: uuidv4(),
            type: 'direct',
            data,
            from: {
                connectionId,
                userId: user.id,
                username: user.username
            },
            to: {
                userId: to
            },
            timestamp: new Date().toISOString()
        };

        // Send the message to the target user
        this.connectionManager.sendToUser(to, msg)
            .then(() => {
                ws.send(JSON.stringify({
                    type: 'direct_sent',
                    to,
                    messageId: msg.id,
                    timestamp: msg.timestamp
                }));
            })
            .catch((err) => {
                this.logger.error(`Failed to send direct message to user ${to}: ${err.message}`);
                ws.send(JSON.stringify({
                    type: 'error',
                    code: 500,
                    message: `Failed to send direct message to user ${to}`
                }));
            });
    }

    private handlePing(ws: WebSocket, connectionId: string, user: any): void {
        ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
        }));
    }

    private hasChannelPermission(user: any, channel: string, action: 'subscribe' | 'publish'): boolean {
        // In a real implementation, this would check user roles/permissions
        // For now, we'll allow all actions for all channels

        // Special case: admin channel
        if (channel === 'admin' && !user.roles.includes('admin')) {
            return false;
        }

        return true;
    }

    private setupEventListeners(): void {
        // Listen for channel events
        this.channelManager.on('message', (channel, message) => {
            this.logger.debug(`Message published to channel ${channel}: ${message.id}`);
            this.eventEmitter.emit('message', channel, message);
        });

        this.channelManager.on('join', (channel, connectionId, user) => {
            this.logger.debug(`Connection ${connectionId} joined channel ${channel}`);
            this.eventEmitter.emit('join', channel, connectionId, user);
        });

        this.channelManager.on('leave', (channel, connectionId, user) => {
            this.logger.debug(`Connection ${connectionId} left channel ${channel}`);
            this.eventEmitter.emit('leave', channel, connectionId, user);
        });
    }

    private setupMessageProcessing(): void {
        // Process queued messages every 100ms
        setInterval(() => {
            this.messageQueue.processAllQueues();
        }, 100);
    }

    public broadcast(message: any, excludeConnectionId?: string): void {
        const msg = {
            ...message,
            id: uuidv4(),
            timestamp: new Date().toISOString()
        };

        this.connectionManager.broadcast(msg, excludeConnectionId);
    }

    public sendToChannel(channel: string, message: any): void {
        const msg = {
            ...message,
            id: uuidv4(),
            channel,
            timestamp: new Date().toISOString()
        };

        this.channelManager.publishToChannel(channel, msg)
            .catch(err => {
                this.logger.error(`Failed to send to channel ${channel}: ${err.message}`);
            });
    }

    public sendToUser(userId: string, message: any): void {
        const msg = {
            ...message,
            id: uuidv4(),
            timestamp: new Date().toISOString()
        };

        this.connectionManager.sendToUser(userId, msg)
            .catch(err => {
                this.logger.error(`Failed to send to user ${userId}: ${err.message}`);
            });
    }

    public getConnectionCount(): number {
        return this.connectionManager.getConnectionCount();
    }

    public getChannelInfo(channel: string): ChannelInfo {
        return this.channelManager.getChannelInfo(channel);
    }

    public getAllChannels(): string[] {
        return this.channelManager.getAllChannels();
    }

    public getUserConnections(userId: string): ConnectionInfo[] {
        return this.connectionManager.getUserConnections(userId);
    }

    public async shutdown(): Promise<void> {
        if (this.isShuttingDown) {
            return;
        }

        this.isShuttingDown = true;
        this.logger.info('Shutting down WebSocket server...');

        // Close all connections
        this.connectionManager.closeAllConnections();

        // Close the WebSocket server
        await new Promise<void>((resolve, reject) => {
            this.wss.close((err) => {
                if (err) {
                    this.logger.error(`Error closing WebSocket server: ${err.message}`);
                    reject(err);
                } else {
                    this.logger.info('WebSocket server closed successfully');
                    resolve();
                }
            });
        });
    }

    public on(event: 'connection', listener: (connectionId: string, user: any) => void): void;
    public on(event: 'disconnect', listener: (connectionId: string, user: any) => void): void;
    public on(event: 'message', listener: (channel: string, message: any) => void): void;
    public on(event: 'join', listener: (channel: string, connectionId: string, user: any) => void): void;
    public on(event: 'leave', listener: (channel: string, connectionId: string, user: any) => void): void;
    public on(event: 'error', listener: (error: Error) => void): void;
    public on(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: 'connection', listener: (connectionId: string, user: any) => void): void;
    public off(event: 'disconnect', listener: (connectionId: string, user: any) => void): void;
    public off(event: 'message', listener: (channel: string, message: any) => void): void;
    public off(event: 'join', listener: (channel: string, connectionId: string, user: any) => void): void;
    public off(event: 'leave', listener: (channel: string, connectionId: string, user: any) => void): void;
    public off(event: 'error', listener: (error: Error) => void): void;
    public off(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }
}

interface ChannelInfo {
    name: string;
    connections: number;
    createdAt: Date;
}

interface ConnectionInfo {
    connectionId: string;
    userId: string;
    username: string;
    ip: string;
    connectedAt: Date;
    channels: string[];
}
```

### Real-Time Event Handlers

```typescript
// src/websocket/event-handlers.ts
import { WebSocketServerInstance } from './websocket-server';
import { Logger } from '../utils/logger';
import { PredictionService } from '../services/prediction-service';
import { NotificationService } from '../services/notification-service';
import { AnalyticsService } from '../services/analytics-service';
import { GamificationService } from '../services/gamification-service';
import { v4 as uuidv4 } from 'uuid';

export class RealTimeEventHandlers {
    private logger: Logger;
    private wsServer: WebSocketServerInstance;
    private predictionService: PredictionService;
    private notificationService: NotificationService;
    private analyticsService: AnalyticsService;
    private gamificationService: GamificationService;

    constructor(wsServer: WebSocketServerInstance) {
        this.logger = new Logger('RealTimeEventHandlers');
        this.wsServer = wsServer;
        this.predictionService = new PredictionService();
        this.notificationService = new NotificationService();
        this.analyticsService = new AnalyticsService();
        this.gamificationService = new GamificationService();

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        // Connection events
        this.wsServer.on('connection', (connectionId, user) => {
            this.handleNewConnection(connectionId, user);
        });

        this.wsServer.on('disconnect', (connectionId, user) => {
            this.handleDisconnect(connectionId, user);
        });

        // Channel events
        this.wsServer.on('join', (channel, connectionId, user) => {
            this.handleChannelJoin(channel, connectionId, user);
        });

        this.wsServer.on('leave', (channel, connectionId, user) => {
            this.handleChannelLeave(channel, connectionId, user);
        });

        // Message events
        this.wsServer.on('message', (channel, message) => {
            this.handleChannelMessage(channel, message);
        });

        // System events
        this.setupSystemEventHandlers();
    }

    private handleNewConnection(connectionId: string, user: any): void {
        this.logger.info(`New connection established: ${connectionId} (user: ${user.id})`);

        // Track connection in analytics
        this.analyticsService.trackEvent('websocket_connection', {
            connectionId,
            userId: user.id,
            username: user.username,
            timestamp: new Date().toISOString()
        });

        // Send initial data to the user
        this.sendInitialData(connectionId, user);

        // Notify other users in the same department
        if (user.department) {
            this.wsServer.sendToChannel(`department:${user.department}`, {
                type: 'user_connected',
                user: {
                    id: user.id,
                    username: user.username,
                    department: user.department
                },
                timestamp: new Date().toISOString()
            });
        }
    }

    private async sendInitialData(connectionId: string, user: any): Promise<void> {
        try {
            // Send recent notifications
            const notifications = await this.notificationService.getRecentNotifications(user.id);
            this.wsServer.sendToUser(user.id, {
                type: 'initial_notifications',
                notifications
            });

            // Send user-specific predictions
            const predictions = await this.predictionService.getUserPredictions(user.id);
            this.wsServer.sendToUser(user.id, {
                type: 'initial_predictions',
                predictions
            });

            // Send gamification status
            const gamificationStatus = await this.gamificationService.getUserStatus(user.id);
            this.wsServer.sendToUser(user.id, {
                type: 'initial_gamification',
                ...gamificationStatus
            });

            this.logger.debug(`Sent initial data to connection ${connectionId}`);
        } catch (err) {
            this.logger.error(`Failed to send initial data to connection ${connectionId}: ${err.message}`);
        }
    }

    private handleDisconnect(connectionId: string, user: any): void {
        this.logger.info(`Connection closed: ${connectionId} (user: ${user.id})`);

        // Track disconnection in analytics
        this.analyticsService.trackEvent('websocket_disconnection', {
            connectionId,
            userId: user.id,
            username: user.username,
            timestamp: new Date().toISOString()
        });

        // Notify other users in the same department
        if (user.department) {
            this.wsServer.sendToChannel(`department:${user.department}`, {
                type: 'user_disconnected',
                user: {
                    id: user.id,
                    username: user.username,
                    department: user.department
                },
                timestamp: new Date().toISOString()
            });
        }
    }

    private handleChannelJoin(channel: string, connectionId: string, user: any): void {
        this.logger.debug(`User ${user.id} joined channel ${channel}`);

        // Track channel join in analytics
        this.analyticsService.trackEvent('channel_join', {
            channel,
            userId: user.id,
            username: user.username,
            connectionId,
            timestamp: new Date().toISOString()
        });

        // Special handling for prediction channels
        if (channel.startsWith('prediction:')) {
            this.handlePredictionChannelJoin(channel, connectionId, user);
        }

        // Special handling for department channels
        if (channel.startsWith('department:')) {
            this.handleDepartmentChannelJoin(channel, connectionId, user);
        }
    }

    private async handlePredictionChannelJoin(channel: string, connectionId: string, user: any): Promise<void> {
        try {
            const predictionId = channel.split(':')[1];
            const prediction = await this.predictionService.getPrediction(predictionId);

            if (prediction) {
                this.wsServer.sendToUser(user.id, {
                    type: 'prediction_update',
                    prediction
                });
            }
        } catch (err) {
            this.logger.error(`Failed to handle prediction channel join: ${err.message}`);
        }
    }

    private async handleDepartmentChannelJoin(channel: string, connectionId: string, user: any): Promise<void> {
        try {
            const department = channel.split(':')[1];
            const onlineUsers = this.wsServer.getUserConnections(user.id)
                .filter(conn => conn.channels.includes(`department:${department}`))
                .map(conn => ({
                    id: conn.userId,
                    username: conn.username
                }));

            this.wsServer.sendToUser(user.id, {
                type: 'department_status',
                department,
                onlineUsers,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            this.logger.error(`Failed to handle department channel join: ${err.message}`);
        }
    }

    private handleChannelLeave(channel: string, connectionId: string, user: any): void {
        this.logger.debug(`User ${user.id} left channel ${channel}`);

        // Track channel leave in analytics
        this.analyticsService.trackEvent('channel_leave', {
            channel,
            userId: user.id,
            username: user.username,
            connectionId,
            timestamp: new Date().toISOString()
        });
    }

    private handleChannelMessage(channel: string, message: any): void {
        this.logger.debug(`Message received on channel ${channel}: ${message.id}`);

        // Track message in analytics
        this.analyticsService.trackEvent('channel_message', {
            channel,
            messageId: message.id,
            fromUserId: message.from.userId,
            fromUsername: message.from.username,
            timestamp: message.timestamp
        });

        // Special handling for different channel types
        if (channel.startsWith('prediction:')) {
            this.handlePredictionChannelMessage(channel, message);
        } else if (channel.startsWith('department:')) {
            this.handleDepartmentChannelMessage(channel, message);
        } else if (channel === 'notifications') {
            this.handleNotificationChannelMessage(channel, message);
        }
    }

    private async handlePredictionChannelMessage(channel: string, message: any): Promise<void> {
        try {
            const predictionId = channel.split(':')[1];

            switch (message.type) {
                case 'prediction_request':
                    await this.handlePredictionRequest(predictionId, message);
                    break;
                case 'prediction_feedback':
                    await this.handlePredictionFeedback(predictionId, message);
                    break;
                case 'prediction_comment':
                    await this.handlePredictionComment(predictionId, message);
                    break;
            }
        } catch (err) {
            this.logger.error(`Failed to handle prediction channel message: ${err.message}`);
        }
    }

    private async handlePredictionRequest(predictionId: string, message: any): Promise<void> {
        try {
            const { features, options } = message.data;
            const result = await this.predictionService.requestPrediction(
                predictionId,
                features,
                message.from.userId,
                options
            );

            this.wsServer.sendToChannel(`prediction:${predictionId}`, {
                type: 'prediction_result',
                predictionId,
                result,
                requestedBy: message.from.userId,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            this.wsServer.sendToChannel(`prediction:${predictionId}`, {
                type: 'prediction_error',
                predictionId,
                error: err.message,
                requestedBy: message.from.userId,
                timestamp: new Date().toISOString()
            });
        }
    }

    private async handlePredictionFeedback(predictionId: string, message: any): Promise<void> {
        try {
            const { feedback, rating } = message.data;
            await this.predictionService.recordFeedback(
                predictionId,
                message.from.userId,
                feedback,
                rating
            );

            this.wsServer.sendToChannel(`prediction:${predictionId}`, {
                type: 'feedback_recorded',
                predictionId,
                userId: message.from.userId,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            this.logger.error(`Failed to record prediction feedback: ${err.message}`);
        }
    }

    private async handlePredictionComment(predictionId: string, message: any): Promise<void> {
        try {
            const { comment } = message.data;
            const commentId = await this.predictionService.addComment(
                predictionId,
                message.from.userId,
                comment
            );

            this.wsServer.sendToChannel(`prediction:${predictionId}`, {
                type: 'new_comment',
                predictionId,
                comment: {
                    id: commentId,
                    userId: message.from.userId,
                    username: message.from.username,
                    comment,
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            this.logger.error(`Failed to add prediction comment: ${err.message}`);
        }
    }

    private async handleDepartmentChannelMessage(channel: string, message: any): Promise<void> {
        try {
            const department = channel.split(':')[1];

            switch (message.type) {
                case 'department_alert':
                    await this.handleDepartmentAlert(department, message);
                    break;
                case 'department_update':
                    await this.handleDepartmentUpdate(department, message);
                    break;
                case 'collaboration_request':
                    await this.handleCollaborationRequest(department, message);
                    break;
            }
        } catch (err) {
            this.logger.error(`Failed to handle department channel message: ${err.message}`);
        }
    }

    private async handleDepartmentAlert(department: string, message: any): Promise<void> {
        try {
            const { alertType, message: alertMessage, data } = message.data;

            // Record the alert
            await this.notificationService.createAlert(
                department,
                alertType,
                alertMessage,
                message.from.userId,
                data
            );

            // Broadcast to the department
            this.wsServer.sendToChannel(`department:${department}`, {
                type: 'department_alert',
                alertType,
                message: alertMessage,
                data,
                from: {
                    userId: message.from.userId,
                    username: message.from.username
                },
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            this.logger.error(`Failed to handle department alert: ${err.message}`);
        }
    }

    private async handleDepartmentUpdate(department: string, message: any): Promise<void> {
        try {
            const { updateType, content } = message.data;

            // Record the update
            await this.notificationService.createDepartmentUpdate(
                department,
                updateType,
                content,
                message.from.userId
            );

            // Broadcast to the department
            this.wsServer.sendToChannel(`department:${department}`, {
                type: 'department_update',
                updateType,
                content,
                from: {
                    userId: message.from.userId,
                    username: message.from.username
                },
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            this.logger.error(`Failed to handle department update: ${err.message}`);
        }
    }

    private async handleCollaborationRequest(department: string, message: any): Promise<void> {
        try {
            const { requestType, details, targetUserId } = message.data;

            // Create the collaboration request
            const requestId = await this.notificationService.createCollaborationRequest(
                message.from.userId,
                targetUserId,
                requestType,
                details
            );

            // Send to the target user if they're online
            if (this.wsServer.getUserConnections(targetUserId).length > 0) {
                this.wsServer.sendToUser(targetUserId, {
                    type: 'collaboration_request',
                    requestId,
                    requestType,
                    details,
                    from: {
                        userId: message.from.userId,
                        username: message.from.username,
                        department
                    },
                    timestamp: new Date().toISOString()
                });
            }

            // Notify the sender
            this.wsServer.sendToUser(message.from.userId, {
                type: 'collaboration_request_sent',
                requestId,
                targetUserId,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            this.logger.error(`Failed to handle collaboration request: ${err.message}`);
        }
    }

    private async handleNotificationChannelMessage(channel: string, message: any): Promise<void> {
        try {
            switch (message.type) {
                case 'notification_read':
                    await this.handleNotificationRead(message);
                    break;
                case 'notification_action':
                    await this.handleNotificationAction(message);
                    break;
            }
        } catch (err) {
            this.logger.error(`Failed to handle notification channel message: ${err.message}`);
        }
    }

    private async handleNotificationRead(message: any): Promise<void> {
        try {
            const { notificationId } = message.data;
            await this.notificationService.markAsRead(notificationId, message.from.userId);

            this.wsServer.sendToUser(message.from.userId, {
                type: 'notification_updated',
                notificationId,
                status: 'read',
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            this.logger.error(`Failed to mark notification as read: ${err.message}`);
        }
    }

    private async handleNotificationAction(message: any): Promise<void> {
        try {
            const { notificationId, action } = message.data;
            const result = await this.notificationService.handleAction(
                notificationId,
                message.from.userId,
                action
            );

            this.wsServer.sendToUser(message.from.userId, {
                type: 'notification_action_result',
                notificationId,
                action,
                result,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            this.logger.error(`Failed to handle notification action: ${err.message}`);
        }
    }

    private setupSystemEventHandlers(): void {
        // Handle prediction updates from the prediction service
        this.predictionService.on('prediction_update', (prediction) => {
            this.wsServer.sendToChannel(`prediction:${prediction.id}`, {
                type: 'prediction_update',
                prediction,
                timestamp: new Date().toISOString()
            });
        });

        // Handle new predictions
        this.predictionService.on('new_prediction', (prediction) => {
            this.wsServer.broadcast({
                type: 'new_prediction',
                prediction,
                timestamp: new Date().toISOString()
            });
        });

        // Handle system alerts
        this.notificationService.on('system_alert', (alert) => {
            this.wsServer.broadcast({
                type: 'system_alert',
                alert,
                timestamp: new Date().toISOString()
            });
        });

        // Handle gamification events
        this.gamificationService.on('achievement_unlocked', (event) => {
            this.wsServer.sendToUser(event.userId, {
                type: 'achievement_unlocked',
                achievement: event.achievement,
                timestamp: new Date().toISOString()
            });
        });

        this.gamificationService.on('points_earned', (event) => {
            this.wsServer.sendToUser(event.userId, {
                type: 'points_earned',
                points: event.points,
                totalPoints: event.totalPoints,
                reason: event.reason,
                timestamp: new Date().toISOString()
            });
        });

        this.gamificationService.on('leaderboard_update', (leaderboard) => {
            this.wsServer.broadcast({
                type: 'leaderboard_update',
                leaderboard,
                timestamp: new Date().toISOString()
            });
        });
    }

    public async handlePredictionTrigger(trigger: PredictionTrigger): Promise<void> {
        try {
            this.logger.info(`Handling prediction trigger: ${trigger.type}`);

            // Create a prediction
            const prediction = await this.predictionService.createPrediction(
                trigger.type,
                trigger.entityType,
                trigger.entityId,
                trigger.features,
                trigger.options
            );

            // Broadcast to relevant channels
            if (trigger.broadcastChannels) {
                trigger.broadcastChannels.forEach(channel => {
                    this.wsServer.sendToChannel(channel, {
                        type: 'new_prediction',
                        prediction,
                        trigger: {
                            type: trigger.type,
                            entityType: trigger.entityType,
                            entityId: trigger.entityId
                        },
                        timestamp: new Date().toISOString()
                    });
                });
            }

            // Send to specific users if specified
            if (trigger.targetUserIds) {
                trigger.targetUserIds.forEach(userId => {
                    this.wsServer.sendToUser(userId, {
                        type: 'new_prediction',
                        prediction,
                        trigger: {
                            type: trigger.type,
                            entityType: trigger.entityType,
                            entityId: trigger.entityId
                        },
                        timestamp: new Date().toISOString()
                    });
                });
            }
        } catch (err) {
            this.logger.error(`Failed to handle prediction trigger: ${err.message}`);
        }
    }

    public async handleSystemEvent(event: SystemEvent): Promise<void> {
        try {
            this.logger.info(`Handling system event: ${event.type}`);

            switch (event.type) {
                case 'maintenance':
                    this.handleMaintenanceEvent(event);
                    break;
                case 'incident':
                    this.handleIncidentEvent(event);
                    break;
                case 'feature_update':
                    this.handleFeatureUpdateEvent(event);
                    break;
            }
        } catch (err) {
            this.logger.error(`Failed to handle system event: ${err.message}`);
        }
    }

    private async handleMaintenanceEvent(event: SystemEvent): Promise<void> {
        const { startTime, endTime, affectedServices, message } = event.data;

        // Create a system alert
        const alert = await this.notificationService.createSystemAlert(
            'maintenance',
            `Maintenance: ${message}`,
            {
                startTime,
                endTime,
                affectedServices
            }
        );

        // Broadcast to all users
        this.wsServer.broadcast({
            type: 'system_maintenance',
            alertId: alert.id,
            startTime,
            endTime,
            affectedServices,
            message,
            timestamp: new Date().toISOString()
        });
    }

    private async handleIncidentEvent(event: SystemEvent): Promise<void> {
        const { severity, status, affectedServices, message, resolutionETA } = event.data;

        // Create a system alert
        const alert = await this.notificationService.createSystemAlert(
            'incident',
            `Incident: ${message}`,
            {
                severity,
                status,
                affectedServices,
                resolutionETA
            }
        );

        // Broadcast to all users
        this.wsServer.broadcast({
            type: 'system_incident',
            alertId: alert.id,
            severity,
            status,
            affectedServices,
            message,
            resolutionETA,
            timestamp: new Date().toISOString()
        });
    }

    private async handleFeatureUpdateEvent(event: SystemEvent): Promise<void> {
        const { featureName, version, description, impact } = event.data;

        // Create a system alert
        const alert = await this.notificationService.createSystemAlert(
            'feature_update',
            `New Feature: ${featureName} ${version}`,
            {
                featureName,
                version,
                description,
                impact
            }
        );

        // Broadcast to all users
        this.wsServer.broadcast({
            type: 'feature_update',
            alertId: alert.id,
            featureName,
            version,
            description,
            impact,
            timestamp: new Date().toISOString()
        });
    }
}

interface PredictionTrigger {
    type: string;
    entityType: string;
    entityId: string;
    features: any;
    options?: any;
    broadcastChannels?: string[];
    targetUserIds?: string[];
}

interface SystemEvent {
    type: 'maintenance' | 'incident' | 'feature_update';
    data: any;
    timestamp: string;
}
```

### Client-Side WebSocket Integration

```typescript
// src/websocket/websocket-client.ts
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { ConnectionManager } from './connection-manager';
import { MessageQueue } from './message-queue';
import { AuthService } from '../services/auth-service';

export class WebSocketClient {
    private static instances: Map<string, WebSocketClient> = new Map();
    private logger: Logger;
    private ws: WebSocket | null = null;
    private eventEmitter: EventEmitter;
    private connectionId: string | null = null;
    private user: any = null;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;
    private pingInterval: NodeJS.Timeout | null = null;
    private pingTimeout: NodeJS.Timeout | null = null;
    private messageQueue: MessageQueue;
    private authService: AuthService;
    private isConnecting: boolean = false;
    private isConnected: boolean = false;
    private lastMessageTime: number = 0;
    private connectionTimeout: NodeJS.Timeout | null = null;
    private options: WebSocketClientOptions;

    private constructor(options: WebSocketClientOptions) {
        this.options = {
            url: options.url,
            autoReconnect: options.autoReconnect !== false,
            maxReconnectAttempts: options.maxReconnectAttempts || 5,
            reconnectDelay: options.reconnectDelay || 1000,
            pingInterval: options.pingInterval || 30000,
            pongTimeout: options.pongTimeout || 10000,
            connectionTimeout: options.connectionTimeout || 10000,
            debug: options.debug || false
        };

        this.logger = new Logger(`WebSocketClient:${options.url}`);
        this.eventEmitter = new EventEmitter();
        this.messageQueue = MessageQueue.getInstance();
        this.authService = new AuthService();

        if (this.options.debug) {
            this.logger.setLevel('debug');
        }
    }

    public static getInstance(options: WebSocketClientOptions): WebSocketClient {
        const key = options.url;
        if (!WebSocketClient.instances.has(key)) {
            WebSocketClient.instances.set(key, new WebSocketClient(options));
        }
        return WebSocketClient.instances.get(key)!;
    }

    public async connect(): Promise<void> {
        if (this.isConnected || this.isConnecting) {
            this.logger.debug('Already connected or connecting');
            return;
        }

        this.isConnecting = true;
        this.reconnectAttempts = 0;

        try {
            // Get authentication token
            const token = await this.getAuthToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            // Create WebSocket URL with token
            const wsUrl = new URL(this.options.url);
            wsUrl.searchParams.append('token', token);

            this.logger.info(`Connecting to WebSocket at ${wsUrl.toString()}`);

            // Create WebSocket connection
            this.ws = new WebSocket(wsUrl.toString());

            // Set up connection timeout
            this.connectionTimeout = setTimeout(() => {
                if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                    this.logger.warn('Connection timeout');
                    this.ws.close(1000, 'Connection timeout');
                }
            }, this.options.connectionTimeout);

            this.setupWebSocketListeners();
        } catch (err) {
            this.isConnecting = false;
            this.logger.error(`Connection failed: ${err.message}`);
            this.eventEmitter.emit('error', err);
            throw err;
        }
    }

    private async getAuthToken(): Promise<string | null> {
        try {
            // Try to get token from auth service
            const token = await this.authService.getToken();
            if (token) {
                return token;
            }

            // Fallback to local storage if available
            if (typeof localStorage !== 'undefined') {
                return localStorage.getItem('authToken');
            }

            return null;
        } catch (err) {
            this.logger.error(`Failed to get auth token: ${err.message}`);
            return null;
        }
    }

    private setupWebSocketListeners(): void {
        if (!this.ws) {
            return;
        }

        this.ws.onopen = () => {
            this.handleOpen();
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
            this.handleClose(event);
        };

        this.ws.onerror = (event) => {
            this.handleError(event);
        };
    }

    private handleOpen(): void {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }

        this.isConnecting = false;
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.lastMessageTime = Date.now();

        this.logger.info('WebSocket connection established');

        // Start ping/pong
        this.startPing();

        // Process any queued messages
        this.messageQueue.processAllQueues();

        this.eventEmitter.emit('open');
    }

    private handleMessage(event: MessageEvent): void {
        this.lastMessageTime = Date.now();

        try {
            const message = JSON.parse(event.data);

            this.logger.debug(`Received message: ${message.type}`);

            // Handle different message types
            switch (message.type) {
                case 'welcome':
                    this.handleWelcomeMessage(message);
                    break;
                case 'message':
                    this.handleChannelMessage(message);
                    break;
                case 'direct':
                    this.handleDirectMessage(message);
                    break;
                case 'subscribed':
                    this.handleSubscribedMessage(message);
                    break;
                case 'unsubscribed':
                    this.handleUnsubscribedMessage(message);
                    break;
                case 'published':
                    this.handlePublishedMessage(message);
                    break;
                case 'direct_sent':
                    this.handleDirectSentMessage(message);
                    break;
                case 'error':
                    this.handleErrorMessage(message);
                    break;
                case 'pong':
                    this.handlePongMessage();
                    break;
                case 'new_prediction':
                    this.handleNewPrediction(message);
                    break;
                case 'prediction_update':
                    this.handlePredictionUpdate(message);
                    break;
                case 'prediction_result':
                    this.handlePredictionResult(message);
                    break;
                case 'prediction_error':
                    this.handlePredictionError(message);
                    break;
                case 'new_comment':
                    this.handleNewComment(message);
                    break;
                case 'feedback_recorded':
                    this.handleFeedbackRecorded(message);
                    break;
                case 'user_connected':
                    this.handleUserConnected(message);
                    break;
                case 'user_disconnected':
                    this.handleUserDisconnected(message);
                    break;
                case 'department_status':
                    this.handleDepartmentStatus(message);
                    break;
                case 'department_alert':
                    this.handleDepartmentAlert(message);
                    break;
                case 'department_update':
                    this.handleDepartmentUpdate(message);
                    break;
                case 'collaboration_request':
                    this.handleCollaborationRequest(message);
                    break;
                case 'collaboration_request_sent':
                    this.handleCollaborationRequestSent(message);
                    break;
                case 'notification':
                    this.handleNotification(message);
                    break;
                case 'initial_notifications':
                    this.handleInitialNotifications(message);
                    break;
                case 'initial_predictions':
                    this.handleInitialPredictions(message);
                    break;
                case 'initial_gamification':
                    this.handleInitialGamification(message);
                    break;
                case 'achievement_unlocked':
                    this.handleAchievementUnlocked(message);
                    break;
                case 'points_earned':
                    this.handlePointsEarned(message);
                    break;
                case 'leaderboard_update':
                    this.handleLeaderboardUpdate(message);
                    break;
                case 'system_alert':
                    this.handleSystemAlert(message);
                    break;
                case 'system_maintenance':
                    this.handleSystemMaintenance(message);
                    break;
                case 'system_incident':
                    this.handleSystemIncident(message);
                    break;
                case 'feature_update':
                    this.handleFeatureUpdate(message);
                    break;
                default:
                    this.logger.warn(`Unknown message type: ${message.type}`);
                    this.eventEmitter.emit('unknown_message', message);
            }

            this.eventEmitter.emit('message', message);
        } catch (err) {
            this.logger.error(`Error processing message: ${err.message}`);
            this.eventEmitter.emit('error', err);
        }
    }

    private handleWelcomeMessage(message: any): void {
        this.connectionId = message.connectionId;
        this.user = message.user;

        this.logger.info(`Connected as ${this.user.username} (connection ID: ${this.connectionId})`);

        this.eventEmitter.emit('connected', {
            connectionId: this.connectionId,
            user: this.user
        });
    }

    private handleChannelMessage(message: any): void {
        this.eventEmitter.emit(`channel:${message.channel}`, message);
        this.eventEmitter.emit('channel_message', message.channel, message);
    }

    private handleDirectMessage(message: any): void {
        this.eventEmitter.emit('direct_message', message);
    }

    private handleSubscribedMessage(message: any): void {
        this.logger.info(`Subscribed to channel: ${message.channel}`);
        this.eventEmitter.emit('subscribed', message.channel);
    }

    private handleUnsubscribedMessage(message: any): void {
        this.logger.info(`Unsubscribed from channel: ${message.channel}`);
        this.eventEmitter.emit('unsubscribed', message.channel);
    }

    private handlePublishedMessage(message: any): void {
        this.logger.debug(`Message published to channel ${message.channel}: ${message.messageId}`);
        this.eventEmitter.emit('published', message.channel, message.messageId);
    }

    private handleDirectSentMessage(message: any): void {
        this.logger.debug(`Direct message sent to ${message.to}: ${message.messageId}`);
        this.eventEmitter.emit('direct_sent', message.to, message.messageId);
    }

    private handleErrorMessage(message: any): void {
        this.logger.error(`Server error: ${message.code} - ${message.message}`);
        this.eventEmitter.emit('server_error', message);
    }

    private handlePongMessage(): void {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
            this.pingTimeout = null;
        }
    }

    private handleNewPrediction(message: any): void {
        this.eventEmitter.emit('new_prediction', message.prediction);
    }

    private handlePredictionUpdate(message: any): void {
        this.eventEmitter.emit('prediction_update', message.prediction);
    }

    private handlePredictionResult(message: any): void {
        this.eventEmitter.emit('prediction_result', message.predictionId, message.result);
    }

    private handlePredictionError(message: any): void {
        this.eventEmitter.emit('prediction_error', message.predictionId, message.error);
    }

    private handleNewComment(message: any): void {
        this.eventEmitter.emit('new_comment', message.predictionId, message.comment);
    }

    private handleFeedbackRecorded(message: any): void {
        this.eventEmitter.emit('feedback_recorded', message.predictionId, message.userId);
    }

    private handleUserConnected(message: any): void {
        this.eventEmitter.emit('user_connected', message.user);
    }

    private handleUserDisconnected(message: any): void {
        this.eventEmitter.emit('user_disconnected', message.user);
    }

    private handleDepartmentStatus(message: any): void {
        this.eventEmitter.emit('department_status', message.department, message.onlineUsers);
    }

    private handleDepartmentAlert(message: any): void {
        this.eventEmitter.emit('department_alert', message);
    }

    private handleDepartmentUpdate(message: any): void {
        this.eventEmitter.emit('department_update', message);
    }

    private handleCollaborationRequest(message: any): void {
        this.eventEmitter.emit('collaboration_request', message);
    }

    private handleCollaborationRequestSent(message: any): void {
        this.eventEmitter.emit('collaboration_request_sent', message);
    }

    private handleNotification(message: any): void {
        this.eventEmitter.emit('notification', message);
    }

    private handleInitialNotifications(message: any): void {
        this.eventEmitter.emit('initial_notifications', message.notifications);
    }

    private handleInitialPredictions(message: any): void {
        this.eventEmitter.emit('initial_predictions', message.predictions);
    }

    private handleInitialGamification(message: any): void {
        this.eventEmitter.emit('initial_gamification', message);
    }

    private handleAchievementUnlocked(message: any): void {
        this.eventEmitter.emit('achievement_unlocked', message.achievement);
    }

    private handlePointsEarned(message: any): void {
        this.eventEmitter.emit('points_earned', message);
    }

    private handleLeaderboardUpdate(message: any): void {
        this.eventEmitter.emit('leaderboard_update', message.leaderboard);
    }

    private handleSystemAlert(message: any): void {
        this.eventEmitter.emit('system_alert', message);
    }

    private handleSystemMaintenance(message: any): void {
        this.eventEmitter.emit('system_maintenance', message);
    }

    private handleSystemIncident(message: any): void {
        this.eventEmitter.emit('system_incident', message);
    }

    private handleFeatureUpdate(message: any): void {
        this.eventEmitter.emit('feature_update', message);
    }

    private handleClose(event: CloseEvent): void {
        this.cleanupConnection();

        this.logger.info(`WebSocket connection closed: ${event.code} - ${event.reason}`);

        if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.scheduleReconnect();
        } else {
            this.eventEmitter.emit('close', event);
        }
    }

    private handleError(event: Event): void {
        this.logger.error('WebSocket error occurred');
        this.eventEmitter.emit('error', event);
    }

    private cleanupConnection(): void {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }

        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
            this.pingTimeout = null;
        }

        this.isConnected = false;
        this.isConnecting = false;
        this.ws = null;
    }

    private scheduleReconnect(): void {
        this.reconnectAttempts++;
        const delay = Math.min(
            this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            30000
        );

        this.logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect().catch(err => {
                this.logger.error(`Reconnection attempt failed: ${err.message}`);
            });
        }, delay);
    }

    private startPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.logger.debug('Sending ping');
                this.ws.send(JSON.stringify({ type: 'ping' }));

                // Set up pong timeout
                if (this.pingTimeout) {
                    clearTimeout(this.pingTimeout);
                }

                this.pingTimeout = setTimeout(() => {
                    this.logger.warn('Pong timeout, closing connection');
                    this.ws?.close(1000, 'Pong timeout');
                }, this.options.pongTimeout);
            }
        }, this.options.pingInterval);
    }

    public async disconnect(): Promise<void> {
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
            this.logger.debug('Already disconnected');
            return;
        }

        this.logger.info('Disconnecting WebSocket');

        // Remove auto-reconnect
        this.options.autoReconnect = false;

        // Close the connection
        this.ws.close(1000, 'Client initiated disconnect');

        // Wait for close event
        await new Promise<void>((resolve) => {
            const onClose = () => {
                this.eventEmitter.off('close', onClose);
                resolve();
            };
            this.eventEmitter.on('close', onClose);
        });
    }

    public async subscribe(channel: string, params?: any): Promise<void> {
        if (!this.isConnected) {
            this.logger.warn('Not connected, queuing subscribe request');
            this.messageQueue.queueMessage(channel, {
                type: 'subscribe',
                channel,
                params
            });
            return;
        }

        if (!this.ws) {
            throw new Error('WebSocket not initialized');
        }

        this.logger.debug(`Subscribing to channel: ${channel}`);

        this.ws.send(JSON.stringify({
            type: 'subscribe',
            channel,
            params
        }));
    }

    public async unsubscribe(channel: string): Promise<void> {
        if (!this.isConnected) {
            this.logger.warn('Not connected, queuing unsubscribe request');
            this.messageQueue.queueMessage(channel, {
                type: 'unsubscribe',
                channel
            });
            return;
        }

        if (!this.ws) {
            throw new Error('WebSocket not initialized');
        }

        this.logger.debug(`Unsubscribing from channel: ${channel}`);

        this.ws.send(JSON.stringify({
            type: 'unsubscribe',
            channel
        }));
    }

    public async publish(channel: string, data: any): Promise<void> {
        if (!this.isConnected) {
            this.logger.warn('Not connected, queuing publish request');
            this.messageQueue.queueMessage(channel, {
                type: 'publish',
                channel,
                data
            });
            return;
        }

        if (!this.ws) {
            throw new Error('WebSocket not initialized');
        }

        const messageId = uuidv4();

        this.logger.debug(`Publishing to channel ${channel}: ${messageId}`);

        this.ws.send(JSON.stringify({
            type: 'publish',
            channel,
            data,
            messageId
        }));
    }

    public async sendDirect(toUserId: string, data: any): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Not connected to WebSocket server');
        }

        if (!this.ws) {
            throw new Error('WebSocket not initialized');
        }

        const messageId = uuidv4();

        this.logger.debug(`Sending direct message to ${toUserId}: ${messageId}`);

        this.ws.send(JSON.stringify({
            type: 'direct',
            to: toUserId,
            data,
            messageId
        }));
    }

    public getConnectionStatus(): WebSocketConnectionStatus {
        return {
            connected: this.isConnected,
            connecting: this.isConnecting,
            connectionId: this.connectionId,
            user: this.user,
            reconnectAttempts: this.reconnectAttempts,
            lastMessageTime: this.lastMessageTime
        };
    }

    public on(event: 'open', listener: () => void): void;
    public on(event: 'close', listener: (event: CloseEvent) => void): void;
    public on(event: 'error', listener: (error: Error | Event) => void): void;
    public on(event: 'message', listener: (message: any) => void): void;
    public on(event: 'connected', listener: (data: { connectionId: string; user: any }) => void): void;
    public on(event: 'subscribed', listener: (channel: string) => void): void;
    public on(event: 'unsubscribed', listener: (channel: string) => void): void;
    public on(event: 'published', listener: (channel: string, messageId: string) => void): void;
    public on(event: 'direct_sent', listener: (toUserId: string, messageId: string) => void): void;
    public on(event: 'server_error', listener: (error: any) => void): void;
    public on(event: 'unknown_message', listener: (message: any) => void): void;
    public on(event: 'channel_message', listener: (channel: string, message: any) => void): void;
    public on(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: 'open', listener: () => void): void;
    public off(event: 'close', listener: (event: CloseEvent) => void): void;
    public off(event: 'error', listener: (error: Error | Event) => void): void;
    public off(event: 'message', listener: (message: any) => void): void;
    public off(event: 'connected', listener: (data: { connectionId: string; user: any }) => void): void;
    public off(event: 'subscribed', listener: (channel: string) => void): void;
    public off(event: 'unsubscribed', listener: (channel: string) => void): void;
    public off(event: 'published', listener: (channel: string, messageId: string) => void): void;
    public off(event: 'direct_sent', listener: (toUserId: string, messageId: string) => void): void;
    public off(event: 'server_error', listener: (error: any) => void): void;
    public off(event: 'unknown_message', listener: (message: any) => void): void;
    public off(event: 'channel_message', listener: (channel: string, message: any) => void): void;
    public off(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    public once(event: 'open', listener: () => void): void;
    public once(event: 'close', listener: (event: CloseEvent) => void): void;
    public once(event: 'error', listener: (error: Error | Event) => void): void;
    public once(event: 'message', listener: (message: any) => void): void;
    public once(event: 'connected', listener: (data: { connectionId: string; user: any }) => void): void;
    public once(event: 'subscribed', listener: (channel: string) => void): void;
    public once(event: 'unsubscribed', listener: (channel: string) => void): void;
    public once(event: 'published', listener: (channel: string, messageId: string) => void): void;
    public once(event: 'direct_sent', listener: (toUserId: string, messageId: string) => void): void;
    public once(event: 'server_error', listener: (error: any) => void): void;
    public once(event: 'unknown_message', listener: (message: any) => void): void;
    public once(event: 'channel_message', listener: (channel: string, message: any) => void): void;
    public once(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.once(event, listener);
    }
}

interface WebSocketClientOptions {
    url: string;
    autoReconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    pingInterval?: number;
    pongTimeout?: number;
    connectionTimeout?: number;
    debug?: boolean;
}

interface WebSocketConnectionStatus {
    connected: boolean;
    connecting: boolean;
    connectionId: string | null;
    user: any;
    reconnectAttempts: number;
    lastMessageTime: number;
}

// Example usage with predictive analytics
export class AnalyticsWebSocketClient {
    private static instance: AnalyticsWebSocketClient;
    private wsClient: WebSocketClient;
    private logger: Logger;
    private predictionSubscriptions: Set<string> = new Set();
    private departmentChannel: string | null = null;

    private constructor() {
        this.logger = new Logger('AnalyticsWebSocketClient');

        // Get WebSocket URL from configuration
        const wsUrl = process.env.WEBSOCKET_URL || 'wss://api.example.com/ws';

        this.wsClient = WebSocketClient.getInstance({
            url: wsUrl,
            autoReconnect: true,
            maxReconnectAttempts: 10,
            reconnectDelay: 2000,
            pingInterval: 30000,
            pongTimeout: 10000,
            connectionTimeout: 15000,
            debug: process.env.NODE_ENV === 'development'
        });

        this.setupEventListeners();
    }

    public static getInstance(): AnalyticsWebSocketClient {
        if (!AnalyticsWebSocketClient.instance) {
            AnalyticsWebSocketClient.instance = new AnalyticsWebSocketClient();
        }
        return AnalyticsWebSocketClient.instance;
    }

    private setupEventListeners(): void {
        // Connection events
        this.wsClient.on('open', () => {
            this.logger.info('WebSocket connection established');
            this.subscribeToUserChannels();
        });

        this.wsClient.on('close', (event) => {
            this.logger.info(`WebSocket connection closed: ${event.code} - ${event.reason}`);
            this.predictionSubscriptions.clear();
            this.departmentChannel = null;
        });

        this.wsClient.on('error', (error) => {
            this.logger.error(`WebSocket error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        });

        // Prediction events
        this.wsClient.on('new_prediction', (prediction) => {
            this.logger.info(`New prediction received: ${prediction.id}`);
            this.handleNewPrediction(prediction);
        });

        this.wsClient.on('prediction_update', (prediction) => {
            this.logger.debug(`Prediction updated: ${prediction.id}`);
            this.handlePredictionUpdate(prediction);
        });

        this.wsClient.on('prediction_result', (predictionId, result) => {
            this.logger.info(`Prediction result for ${predictionId}: ${JSON.stringify(result)}`);
            this.handlePredictionResult(predictionId, result);
        });

        this.wsClient.on('prediction_error', (predictionId, error) => {
            this.logger.error(`Prediction error for ${predictionId}: ${error}`);
            this.handlePredictionError(predictionId, error);
        });

        // Department events
        this.wsClient.on('department_status', (department, onlineUsers) => {
            this.logger.debug(`Department status update for ${department}: ${onlineUsers.length} users online`);
            this.handleDepartmentStatus(department, onlineUsers);
        });

        this.wsClient.on('department_alert', (alert) => {
            this.logger.info(`Department alert: ${alert.alertType} - ${alert.message}`);
            this.handleDepartmentAlert(alert);
        });

        // Gamification events
        this.wsClient.on('achievement_unlocked', (achievement) => {
            this.logger.info(`Achievement unlocked: ${achievement.name}`);
            this.handleAchievementUnlocked(achievement);
        });

        this.wsClient.on('points_earned', (pointsData) => {
            this.logger.info(`Points earned: ${pointsData.points} (total: ${pointsData.totalPoints})`);
            this.handlePointsEarned(pointsData);
        });

        // System events
        this.wsClient.on('system_alert', (alert) => {
            this.logger.info(`System alert: ${alert.alert.type} - ${alert.alert.message}`);
            this.handleSystemAlert(alert);
        });
    }

    private async subscribeToUserChannels(): Promise<void> {
        try {
            // Get current user
            const user = this.wsClient.getConnectionStatus().user;
            if (!user) {
                this.logger.warn('No user information available for channel subscription');
                return;
            }

            // Subscribe to department channel
            if (user.department) {
                this.departmentChannel = `department:${user.department}`;
                await this.wsClient.subscribe(this.departmentChannel);
                this.logger.info(`Subscribed to department channel: ${this.departmentChannel}`);
            }

            // Subscribe to user-specific channels
            await this.wsClient.subscribe(`user:${user.id}`);

            // Subscribe to notifications channel
            await this.wsClient.subscribe('notifications');

            // Subscribe to any existing prediction subscriptions
            if (this.predictionSubscriptions.size > 0) {
                for (const predictionId of this.predictionSubscriptions) {
                    await this.subscribeToPrediction(predictionId);
                }
            }
        } catch (err) {
            this.logger.error(`Failed to subscribe to user channels: ${err.message}`);
        }
    }

    public async subscribeToPrediction(predictionId: string): Promise<void> {
        try {
            const channel = `prediction:${predictionId}`;
            await this.wsClient.subscribe(channel);
            this.predictionSubscriptions.add(predictionId);
            this.logger.info(`Subscribed to prediction channel: ${channel}`);
        } catch (err) {
            this.logger.error(`Failed to subscribe to prediction ${predictionId}: ${err.message}`);
            throw err;
        }
    }

    public async unsubscribeFromPrediction(predictionId: string): Promise<void> {
        try {
            const channel = `prediction:${predictionId}`;
            await this.wsClient.unsubscribe(channel);
            this.predictionSubscriptions.delete(predictionId);
            this.logger.info(`Unsubscribed from prediction channel: ${channel}`);
        } catch (err) {
            this.logger.error(`Failed to unsubscribe from prediction ${predictionId}: ${err.message}`);
            throw err;
        }
    }

    public async requestPrediction(predictionId: string, features: any, options?: any): Promise<void> {
        try {
            const channel = `prediction:${predictionId}`;
            await this.wsClient.publish(channel, {
                type: 'prediction_request',
                features,
                options
            });
            this.logger.info(`Prediction request sent for ${predictionId}`);
        } catch (err) {
            this.logger.error(`Failed to request prediction ${predictionId}: ${err.message}`);
            throw err;
        }
    }

    public async sendPredictionFeedback(predictionId: string, feedback: string, rating: number): Promise<void> {
        try {
            const channel = `prediction:${predictionId}`;
            await this.wsClient.publish(channel, {
                type: 'prediction_feedback',
                feedback,
                rating
            });
            this.logger.info(`Feedback sent for prediction ${predictionId}`);
        } catch (err) {
            this.logger.error(`Failed to send feedback for prediction ${predictionId}: ${err.message}`);
            throw err;
        }
    }

    public async addPredictionComment(predictionId: string, comment: string): Promise<void> {
        try {
            const channel = `prediction:${predictionId}`;
            await this.wsClient.publish(channel, {
                type: 'prediction_comment',
                comment
            });
            this.logger.info(`Comment added to prediction ${predictionId}`);
        } catch (err) {
            this.logger.error(`Failed to add comment to prediction ${predictionId}: ${err.message}`);
            throw err;
        }
    }

    public async sendDepartmentAlert(alertType: string, message: string, data?: any): Promise<void> {
        try {
            if (!this.departmentChannel) {
                throw new Error('Not subscribed to any department channel');
            }

            await this.wsClient.publish(this.departmentChannel, {
                type: 'department_alert',
                alertType,
                message,
                data
            });
            this.logger.info(`Department alert sent: ${alertType}`);
        } catch (err) {
            this.logger.error(`Failed to send department alert: ${err.message}`);
            throw err;
        }
    }

    public async sendDepartmentUpdate(updateType: string, content: string): Promise<void> {
        try {
            if (!this.departmentChannel) {
                throw new Error('Not subscribed to any department channel');
            }

            await this.wsClient.publish(this.departmentChannel, {
                type: 'department_update',
                updateType,
                content
            });
            this.logger.info(`Department update sent: ${updateType}`);
        } catch (err) {
            this.logger.error(`Failed to send department update: ${err.message}`);
            throw err;
        }
    }

    public async sendCollaborationRequest(
        targetUserId: string,
        requestType: string,
        details: any
    ): Promise<void> {
        try {
            if (!this.departmentChannel) {
                throw new Error('Not subscribed to any department channel');
            }

            const department = this.departmentChannel.split(':')[1];

            await this.wsClient.publish(this.departmentChannel, {
                type: 'collaboration_request',
                requestType,
                details,
                targetUserId
            });
            this.logger.info(`Collaboration request sent to ${targetUserId}`);
        } catch (err) {
            this.logger.error(`Failed to send collaboration request: ${err.message}`);
            throw err;
        }
    }

    public async connect(): Promise<void> {
        try {
            await this.wsClient.connect();
        } catch (err) {
            this.logger.error(`Failed to connect WebSocket: ${err.message}`);
            throw err;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await this.wsClient.disconnect();
        } catch (err) {
            this.logger.error(`Failed to disconnect WebSocket: ${err.message}`);
            throw err;
        }
    }

    public getConnectionStatus(): WebSocketConnectionStatus {
        return this.wsClient.getConnectionStatus();
    }

    public onPredictionUpdate(predictionId: string, callback: (prediction: any) => void): void {
        this.wsClient.on(`channel:prediction:${predictionId}`, (message) => {
            if (message.type === 'prediction_update') {
                callback(message.prediction);
            }
        });
    }

    public onPredictionResult(predictionId: string, callback: (result: any) => void): void {
        this.wsClient.on(`channel:prediction:${predictionId}`, (message) => {
            if (message.type === 'prediction_result') {
                callback(message.result);
            }
        });
    }

    public onDepartmentAlert(callback: (alert: any) => void): void {
        this.wsClient.on('department_alert', callback);
    }

    public onDepartmentUpdate(callback: (update: any) => void): void {
        this.wsClient.on('department_update', callback);
    }

    public onNewPrediction(callback: (prediction: any) => void): void {
        this.wsClient.on('new_prediction', callback);
    }

    public onAchievementUnlocked(callback: (achievement: any) => void): void {
        this.wsClient.on('achievement_unlocked', callback);
    }

    public onPointsEarned(callback: (pointsData: any) => void): void {
        this.wsClient.on('points_earned', callback);
    }

    private handleNewPrediction(prediction: any): void {
        // In a real implementation, this would update the UI or trigger other actions
        this.logger.info(`Handling new prediction: ${prediction.id}`);
    }

    private handlePredictionUpdate(prediction: any): void {
        // In a real implementation, this would update the UI
        this.logger.debug(`Handling prediction update: ${prediction.id}`);
    }

    private handlePredictionResult(predictionId: string, result: any): void {
        // In a real implementation, this would display the prediction result
        this.logger.info(`Handling prediction result for ${predictionId}`);
    }

    private handlePredictionError(predictionId: string, error: string): void {
        // In a real implementation, this would show an error to the user
        this.logger.error(`Handling prediction error for ${predictionId}: ${error}`);
    }

    private handleDepartmentStatus(department: string, onlineUsers: any[]): void {
        // In a real implementation, this would update the department status UI
        this.logger.debug(`Department ${department} has ${onlineUsers.length} users online`);
    }

    private handleDepartmentAlert(alert: any): void {
        // In a real implementation, this would show the alert to users
        this.logger.info(`Handling department alert: ${alert.alertType}`);
    }

    private handleAchievementUnlocked(achievement: any): void {
        // In a real implementation, this would show a notification
        this.logger.info(`Handling achievement unlocked: ${achievement.name}`);
    }

    private handlePointsEarned(pointsData: any): void {
        // In a real implementation, this would update the points display
        this.logger.info(`Handling points earned: ${pointsData.points}`);
    }

    private handleSystemAlert(alert: any): void {
        // In a real implementation, this would show a system-wide alert
        this.logger.info(`Handling system alert: ${alert.alert.type}`);
    }
}
```

### Room/Channel Management

```typescript
// src/websocket/channel-manager.ts
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';
import { RedisCache } from '../cache/redis-cache';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import { ConnectionManager } from './connection-manager';
import { MessageQueue } from './message-queue';

export class ChannelManager {
    private static instance: ChannelManager;
    private logger: Logger;
    private eventEmitter: EventEmitter;
    private cache: RedisCache;
    private connectionManager: ConnectionManager;
    private messageQueue: MessageQueue;
    private channelSubscriptions: Map<string, Set<string>> = new Map(); // channel -> set of connectionIds
    private connectionChannels: Map<string, Set<string>> = new Map(); // connectionId -> set of channels
    private channelMetadata: Map<string, ChannelMetadata> = new Map(); // channel -> metadata
    private channelLocks: Map<string, Promise<void>> = new Map(); // channel -> lock promise

    private constructor() {
        this.logger = new Logger('ChannelManager');
        this.eventEmitter = new EventEmitter();
        this.cache = RedisCache.getInstance();
        this.connectionManager = ConnectionManager.getInstance();
        this.messageQueue = MessageQueue.getInstance();

        // Set up periodic cleanup
        this.setupCleanupInterval();
    }

    public static getInstance(): ChannelManager {
        if (!ChannelManager.instance) {
            ChannelManager.instance = new ChannelManager();
        }
        return ChannelManager.instance;
    }

    private setupCleanupInterval(): void {
        // Clean up empty channels every 5 minutes
        setInterval(() => {
            this.cleanupEmptyChannels();
        }, 300000);
    }

    private async cleanupEmptyChannels(): Promise<void> {
        this.logger.debug('Starting channel cleanup');

        const channelsToRemove: string[] = [];

        for (const [channel, connections] of this.channelSubscriptions.entries()) {
            if (connections.size === 0) {
                channelsToRemove.push(channel);
            }
        }

        for (const channel of channelsToRemove) {
            this.logger.debug(`Removing empty channel: ${channel}`);
            this.channelSubscriptions.delete(channel);
            this.channelMetadata.delete(channel);
            await this.cache.delete(`channel:${channel}`);
        }

        this.logger.debug(`Channel cleanup completed. Removed ${channelsToRemove.length} channels.`);
    }

    public async addConnectionToChannel(
        connectionId: string,
        channel: string,
        user: any,
        params?: any
    ): Promise<void> {
        // Get a lock for this channel to prevent concurrent modifications
        const lock = this.getChannelLock(channel);
        await lock;

        try {
            // Check if the connection exists
            if (!this.connectionManager.hasConnection(connectionId)) {
                throw new Error(`Connection ${connectionId} does not exist`);
            }

            // Initialize channel data if it doesn't exist
            if (!this.channelSubscriptions.has(channel)) {
                this.channelSubscriptions.set(channel, new Set());
                this.channelMetadata.set(channel, {
                    createdAt: new Date(),
                    createdBy: user.id,
                    params: params || {},
                    memberCount: 0
                });
            }

            // Check if the connection is already in this channel
            if (this.channelSubscriptions.get(channel)?.has(connectionId)) {
                this.logger.debug(`Connection ${connectionId} is already in channel ${channel}`);
                return;
            }

            // Add the connection to the channel
            this.channelSubscriptions.get(channel)?.add(connectionId);

            // Add the channel to the connection's channels
            if (!this.connectionChannels.has(connectionId)) {
                this.connectionChannels.set(connectionId, new Set());
            }
            this.connectionChannels.get(connectionId)?.add(channel);

            // Update metadata
            const metadata = this.channelMetadata.get(channel);
            if (metadata) {
                metadata.memberCount = this.channelSubscriptions.get(channel)?.size || 0;
                this.channelMetadata.set(channel, metadata);
            }

            // Store in cache
            await this.cache.set(`channel:${channel}:connection:${connectionId}`, {
                joinedAt: new Date(),
                userId: user.id,
                username: user.username
            }, 86400); // 24 hour TTL

            this.logger.info(`Added connection ${connectionId} to channel ${channel}`);

            // Emit event
            this.eventEmitter.emit('join', channel, connectionId, user);

            // Process any queued messages for this channel
            this.messageQueue.processQueuedMessages(channel, connectionId);
        } catch (err) {
            this.logger.error(`Failed to add connection ${connectionId} to channel ${channel}: ${err.message}`);
            throw err;
        } finally {
            this.releaseChannelLock(channel);
        }
    }

    public async removeConnectionFromChannel(
        connectionId: string,
        channel: string
    ): Promise<void> {
        // Get a lock for this channel
        const lock = this.getChannelLock(channel);
        await lock;

        try {
            // Check if the channel exists
            if (!this.channelSubscriptions.has(channel)) {
                this.logger.debug(`Channel ${channel} does not exist`);
                return;
            }

            // Check if the connection is in this channel
            if (!this.channelSubscriptions.get(channel)?.has(connectionId)) {
                this.logger.debug(`Connection ${connectionId} is not in channel ${channel}`);
                return;
            }

            // Remove the connection from the channel
            this.channelSubscriptions.get(channel)?.delete(connectionId);

            // Remove the channel from the connection's channels
            this.connectionChannels.get(connectionId)?.delete(channel);

            // Update metadata
            const metadata = this.channelMetadata.get(channel);
            if (metadata) {
                metadata.memberCount = this.channelSubscriptions.get(channel)?.size || 0;
                this.channelMetadata.set(channel, metadata);
            }

            // Remove from cache
            await this.cache.delete(`channel:${channel}:connection:${connectionId}`);

            this.logger.info(`Removed connection ${connectionId} from channel ${channel}`);

            // Emit event
            const user = this.connectionManager.getConnectionUser(connectionId);
            if (user) {
                this.eventEmitter.emit('leave', channel, connectionId, user);
            }

            // If channel is empty, clean it up
            if (this.channelSubscriptions.get(channel)?.size === 0) {
                this.logger.debug(`Channel ${channel} is now empty, scheduling cleanup`);
                // Cleanup will happen in the next cleanup interval
            }
        } catch (err) {
            this.logger.error(`Failed to remove connection ${connectionId} from channel ${channel}: ${err.message}`);
            throw err;
        } finally {
            this.releaseChannelLock(channel);
        }
    }

    public async removeConnectionFromAllChannels(connectionId: string): Promise<void> {
        // Get all channels for this connection
        const channels = this.connectionChannels.get(connectionId) || new Set();

        // Remove from each channel
        for (const channel of channels) {
            try {
                await this.removeConnectionFromChannel(connectionId, channel);
            } catch (err) {
                this.logger.error(`Failed to remove connection ${connectionId} from channel ${channel}: ${err.message}`);
            }
        }

        // Clean up the connection's channel set
        this.connectionChannels.delete(connectionId);
    }

    public async publishToChannel(channel: string, message: any): Promise<void> {
        // Get a lock for this channel
        const lock = this.getChannelLock(channel);
        await lock;

        try {
            // Check if the channel exists
            if (!this.channelSubscriptions.has(channel)) {
                this.logger.debug(`Channel ${channel} does not exist, creating it`);
                this.channelSubscriptions.set(channel, new Set());
                this.channelMetadata.set(channel, {
                    createdAt: new Date(),
                    createdBy: 'system',
                    params: {},
                    memberCount: 0
                });
            }

            // Store the message in cache (for new subscribers)
            await this.cache.set(`channel:${channel}:message:${message.id}`, message, 3600); // 1 hour TTL

            // Get all connections in this channel
            const connections = this.channelSubscriptions.get(channel) || new Set();

            // Send the message to each connection
            const sendPromises: Promise<void>[] = [];
            for (const connectionId of connections) {
                sendPromises.push(this.sendMessageToConnection(connectionId, message));
            }

            await Promise.all(sendPromises);

            this.logger.debug(`Published message ${message.id} to channel ${channel} (${connections.size} connections)`);

            // Emit event
            this.eventEmitter.emit('message', channel, message);
        } catch (err) {
            this.logger.error(`Failed to publish message to channel ${channel}: ${err.message}`);
            throw err;
        } finally {
            this.releaseChannelLock(channel);
        }
    }

    private async sendMessageToConnection(connectionId: string, message: any): Promise<void> {
        try {
            const connection = this.connectionManager.getConnection(connectionId);
            if (!connection) {
                this.logger.warn(`Connection ${connectionId} not found, removing from channel`);
                // The connection will be removed from the channel by the connection manager
                return;
            }

            // Send the message
            connection.send(JSON.stringify(message));
        } catch (err) {
            this.logger.error(`Failed to send message to connection ${connectionId}: ${err.message}`);
            // The connection will be removed by the connection manager if it fails
        }
    }

    public async getChannelConnections(channel: string): Promise<string