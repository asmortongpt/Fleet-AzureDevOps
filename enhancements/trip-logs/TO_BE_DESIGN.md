# TO_BE_DESIGN.md - Trip-Logs Module Comprehensive Design

## Executive Vision (120 lines)

### Strategic Vision for Enhanced Trip-Logs System

The enhanced trip-logs module represents a paradigm shift in how organizations track, analyze, and derive value from travel data. This transformation will position our platform as the industry leader in intelligent travel management solutions, moving beyond simple logging to become a comprehensive travel intelligence system.

**Business Transformation Goals:**

1. **Data-Driven Decision Making**: Transform raw travel data into actionable insights that drive cost savings, improve employee safety, and enhance travel policy compliance. By implementing predictive analytics, we'll enable organizations to forecast travel expenses with 95% accuracy 6 months in advance.

2. **Operational Efficiency**: Reduce administrative overhead by 70% through automation of expense reporting, compliance checking, and reimbursement processing. The system will automatically flag non-compliant expenses and suggest policy adjustments based on historical patterns.

3. **Employee Experience**: Create a seamless travel experience that reduces friction for employees while ensuring corporate compliance. The system will provide personalized recommendations for travel options based on individual preferences and company policies.

4. **Risk Management**: Implement real-time travel risk assessment with automated alerts for high-risk destinations, weather events, or political instability. The system will integrate with global risk databases and provide automated evacuation protocols.

5. **Sustainability Tracking**: Enable organizations to track and reduce their carbon footprint by providing detailed emissions reporting and suggesting lower-impact travel alternatives. This will support ESG (Environmental, Social, Governance) reporting requirements.

**User Experience Improvements:**

The enhanced system will revolutionize user experience through:

1. **Context-Aware Interface**: The UI will adapt based on user role, travel status, and historical behavior. For example, frequent travelers will see quick-access buttons for their most common routes, while managers will see team travel dashboards.

2. **Proactive Assistance**: AI-powered virtual travel assistant that provides real-time suggestions and alerts. The assistant will learn from user behavior to anticipate needs, such as suggesting alternative flights when delays are detected.

3. **Unified Travel Ecosystem**: Single interface for planning, booking, tracking, and expensing travel. Users will be able to book flights, hotels, and ground transportation through integrated partners, with all data automatically logged in the system.

4. **Offline-First Design**: Full functionality available without internet connection, with automatic sync when connectivity is restored. This is critical for international travelers who may have limited connectivity.

5. **Gamification Elements**: Reward system for policy-compliant behavior, early expense reporting, and sustainable travel choices. This will increase user engagement and policy adherence.

**Competitive Advantages:**

1. **Predictive Intelligence**: Unlike competitors who provide only historical reporting, our system will predict future travel patterns, expenses, and potential issues before they occur.

2. **Real-Time Risk Management**: Integration with global risk databases and automated alerting provides unmatched traveler safety capabilities.

3. **Automated Compliance**: AI-powered policy enforcement that learns and adapts to organizational needs, reducing manual review requirements by 80%.

4. **Seamless Integrations**: Native integrations with all major travel booking platforms, expense systems, and HRIS solutions, eliminating data silos.

5. **Carbon Intelligence**: Comprehensive emissions tracking and reduction suggestions that go beyond basic carbon calculators to provide actionable insights.

**Long-Term Roadmap:**

**Phase 1 (0-6 months):**
- Core system enhancements with real-time features
- Basic AI/ML capabilities for expense categorization
- Initial PWA implementation
- Core integrations with major travel providers

**Phase 2 (6-12 months):**
- Advanced predictive analytics
- Full gamification system
- Comprehensive carbon tracking
- Expanded third-party integrations
- Mobile app enhancements

**Phase 3 (12-18 months):**
- Autonomous travel assistant with NLP capabilities
- Blockchain-based expense verification
- Virtual reality travel planning
- Advanced biometric authentication
- Predictive maintenance for corporate travel programs

**Phase 4 (18-24 months):**
- Global travel marketplace with dynamic pricing
- AI-powered travel policy optimization
- Autonomous rebooking for disrupted travel
- Integration with smart city infrastructure
- Quantum computing for ultra-fast travel optimization

**Market Positioning:**

The enhanced trip-logs module will position us as the "Intelligent Travel Platform" rather than just another expense tracking system. We'll target three key market segments:

1. **Enterprise Customers**: Large organizations with complex travel policies and global operations
2. **Mid-Market Companies**: Growing businesses that need scalable travel management solutions
3. **Government/Military**: Organizations with stringent compliance and security requirements

**Revenue Model Enhancements:**

1. **Subscription Tiers**: Introduce premium tiers with advanced features like predictive analytics and dedicated support
2. **Usage-Based Pricing**: Additional revenue from high-volume API calls and premium integrations
3. **Value-Added Services**: Offer consulting services for travel program optimization
4. **Marketplace Commissions**: Take a percentage of bookings made through integrated partners
5. **Data Insights**: Anonymized, aggregated travel data insights sold to industry analysts

**Implementation Strategy:**

We'll follow an agile implementation approach with continuous delivery:

1. **MVP Development**: Core real-time features and basic AI capabilities
2. **Pilot Testing**: Limited release to select enterprise customers
3. **Iterative Enhancement**: Continuous improvement based on user feedback
4. **Full Rollout**: Phased deployment with comprehensive training and support

**Success Metrics:**

1. **Adoption Rates**: 90% of existing customers upgrade within 12 months
2. **User Engagement**: 70% of users interact with the system at least weekly
3. **Cost Savings**: Customers achieve 15-25% reduction in travel expenses
4. **Customer Satisfaction**: Net Promoter Score (NPS) increase from 45 to 70+
5. **Market Share**: Increase market share from 12% to 25% within 24 months

## Performance Enhancements (300+ lines)

### Redis Caching Layer (60 lines)

```typescript
import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/logger';
import { CacheKeyGenerator } from '../utils/cacheKeyGenerator';
import { performance } from 'perf_hooks';

class RedisCache {
    private client: RedisClientType;
    private logger: Logger;
    private cacheKeyGenerator: CacheKeyGenerator;
    private readonly DEFAULT_TTL = 300; // 5 minutes
    private readonly LONG_TTL = 86400; // 24 hours
    private readonly SHORT_TTL = 60; // 1 minute

    constructor() {
        this.logger = new Logger('RedisCache');
        this.cacheKeyGenerator = new CacheKeyGenerator();
        this.initializeClient();
    }

    private async initializeClient(): Promise<void> {
        try {
            this.client = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    tls: process.env.REDIS_TLS === 'true',
                    rejectUnauthorized: false
                }
            });

            this.client.on('error', (err) => {
                this.logger.error('Redis Client Error', { error: err });
            });

            this.client.on('connect', () => {
                this.logger.info('Connected to Redis');
            });

            this.client.on('reconnecting', () => {
                this.logger.warn('Reconnecting to Redis');
            });

            await this.client.connect();
            this.logger.info('Redis client initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Redis client', { error });
            throw error;
        }
    }

    public async get<T>(key: string): Promise<T | null> {
        const startTime = performance.now();
        try {
            const cacheKey = this.cacheKeyGenerator.generate(key);
            const value = await this.client.get(cacheKey);

            if (!value) {
                this.logger.debug('Cache miss', { key });
                return null;
            }

            const parsedValue = JSON.parse(value) as T;
            this.logger.debug('Cache hit', {
                key,
                duration: performance.now() - startTime
            });
            return parsedValue;
        } catch (error) {
            this.logger.error('Error getting value from Redis', {
                key,
                error,
                duration: performance.now() - startTime
            });
            return null;
        }
    }

    public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        const startTime = performance.now();
        try {
            const cacheKey = this.cacheKeyGenerator.generate(key);
            const stringValue = JSON.stringify(value);
            const effectiveTTL = ttl || this.getTTLForKey(key);

            await this.client.set(cacheKey, stringValue, {
                EX: effectiveTTL
            });

            this.logger.debug('Value cached successfully', {
                key,
                ttl: effectiveTTL,
                duration: performance.now() - startTime
            });
        } catch (error) {
            this.logger.error('Error setting value in Redis', {
                key,
                error,
                duration: performance.now() - startTime
            });
        }
    }

    public async delete(key: string): Promise<void> {
        const startTime = performance.now();
        try {
            const cacheKey = this.cacheKeyGenerator.generate(key);
            await this.client.del(cacheKey);
            this.logger.debug('Cache key deleted', {
                key,
                duration: performance.now() - startTime
            });
        } catch (error) {
            this.logger.error('Error deleting key from Redis', {
                key,
                error,
                duration: performance.now() - startTime
            });
        }
    }

    public async getWithFallback<T>(
        key: string,
        fallback: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cachedValue = await this.get<T>(key);
        if (cachedValue !== null) {
            return cachedValue;
        }

        const value = await fallback();
        await this.set(key, value, ttl);
        return value;
    }

    private getTTLForKey(key: string): number {
        if (key.includes('user_profile') || key.includes('configuration')) {
            return this.LONG_TTL;
        }

        if (key.includes('real_time') || key.includes('status')) {
            return this.SHORT_TTL;
        }

        return this.DEFAULT_TTL;
    }

    public async close(): Promise<void> {
        try {
            await this.client.quit();
            this.logger.info('Redis connection closed');
        } catch (error) {
            this.logger.error('Error closing Redis connection', { error });
        }
    }
}

export const redisCache = new RedisCache();
```

### Database Query Optimization (60 lines)

```typescript
import { Pool, PoolClient, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

class TripLogsDatabase {
    private pool: Pool;
    private logger: Logger;
    private readonly MAX_QUERY_TIME_MS = 500;
    private readonly SLOW_QUERY_THRESHOLD_MS = 100;

    constructor() {
        this.logger = new Logger('TripLogsDatabase');
        this.initializePool();
    }

    private initializePool(): void {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            ssl: process.env.DATABASE_SSL === 'true' ? {
                rejectUnauthorized: false
            } : false
        });

        this.pool.on('error', (err) => {
            this.logger.error('Unexpected error on idle client', { error: err });
        });

        this.logger.info('Database pool initialized', {
            maxConnections: 20,
            idleTimeout: '30s',
            connectionTimeout: '2s'
        });
    }

    public async getTripLogs(
        userId: string,
        filters: {
            startDate?: Date;
            endDate?: Date;
            status?: string[];
            limit?: number;
            offset?: number;
        } = {}
    ): Promise<QueryResult> {
        const startTime = performance.now();
        const client = await this.pool.connect();

        try {
            const query = this.buildTripLogsQuery(userId, filters);
            const params = this.buildQueryParams(userId, filters);

            this.logger.debug('Executing trip logs query', {
                query: query.substring(0, 100) + '...',
                params
            });

            const result = await client.query(query, params);

            const duration = performance.now() - startTime;
            if (duration > this.SLOW_QUERY_THRESHOLD_MS) {
                this.logger.warn('Slow query detected', {
                    queryType: 'getTripLogs',
                    duration,
                    userId,
                    filters
                });
            }

            if (duration > this.MAX_QUERY_TIME_MS) {
                this.logger.error('Query exceeded maximum execution time', {
                    queryType: 'getTripLogs',
                    duration,
                    userId,
                    filters
                });
                throw new Error('Query execution time exceeded maximum threshold');
            }

            return result;
        } catch (error) {
            this.logger.error('Error executing trip logs query', {
                error,
                userId,
                filters,
                duration: performance.now() - startTime
            });
            throw error;
        } finally {
            client.release();
        }
    }

    private buildTripLogsQuery(
        userId: string,
        filters: {
            startDate?: Date;
            endDate?: Date;
            status?: string[];
            limit?: number;
            offset?: number;
        }
    ): string {
        const conditions = [
            'tl.user_id = $1',
            filters.startDate ? 'tl.start_date >= $2' : null,
            filters.endDate ? 'tl.end_date <= $3' : null,
            filters.status && filters.status.length > 0
                ? `tl.status = ANY($${this.getParamIndex(filters)})`
                : null
        ].filter(Boolean).join(' AND ');

        const query = `
            SELECT
                tl.id,
                tl.user_id,
                tl.title,
                tl.description,
                tl.start_date,
                tl.end_date,
                tl.status,
                tl.total_cost,
                tl.currency,
                tl.created_at,
                tl.updated_at,
                json_agg(
                    json_build_object(
                        'id', te.id,
                        'expense_type', te.expense_type,
                        'amount', te.amount,
                        'currency', te.currency,
                        'date', te.date,
                        'description', te.description,
                        'receipt_url', te.receipt_url,
                        'status', te.status
                    )
                ) as expenses,
                u.first_name,
                u.last_name,
                u.email,
                u.department
            FROM
                trip_logs tl
            LEFT JOIN
                trip_expenses te ON tl.id = te.trip_id
            LEFT JOIN
                users u ON tl.user_id = u.id
            WHERE
                ${conditions}
            GROUP BY
                tl.id, u.id
            ORDER BY
                tl.start_date DESC
            ${filters.limit ? `LIMIT $${this.getParamIndex(filters)}` : ''}
            ${filters.offset ? `OFFSET $${this.getParamIndex(filters)}` : ''}
        `;

        return query;
    }

    private buildQueryParams(
        userId: string,
        filters: {
            startDate?: Date;
            endDate?: Date;
            status?: string[];
            limit?: number;
            offset?: number;
        }
    ): any[] {
        const params = [userId];
        let paramIndex = 2;

        if (filters.startDate) {
            params.push(filters.startDate);
            paramIndex++;
        }

        if (filters.endDate) {
            params.push(filters.endDate);
            paramIndex++;
        }

        if (filters.status && filters.status.length > 0) {
            params.push(filters.status);
            paramIndex++;
        }

        if (filters.limit) {
            params.push(filters.limit);
            paramIndex++;
        }

        if (filters.offset) {
            params.push(filters.offset);
        }

        return params;
    }

    private getParamIndex(filters: any): number {
        let index = 2; // userId is always $1

        if (filters.startDate) index++;
        if (filters.endDate) index++;
        if (filters.status && filters.status.length > 0) index++;
        if (filters.limit) index++;

        return index;
    }

    public async getTripLogWithDetails(tripId: string): Promise<any> {
        const startTime = performance.now();
        const client = await this.pool.connect();

        try {
            const query = `
                WITH trip_details AS (
                    SELECT
                        tl.*,
                        u.first_name,
                        u.last_name,
                        u.email,
                        u.department,
                        u.manager_id,
                        m.first_name as manager_first_name,
                        m.last_name as manager_last_name
                    FROM
                        trip_logs tl
                    LEFT JOIN
                        users u ON tl.user_id = u.id
                    LEFT JOIN
                        users m ON u.manager_id = m.id
                    WHERE
                        tl.id = $1
                ),
                expenses AS (
                    SELECT
                        json_agg(
                            json_build_object(
                                'id', id,
                                'expense_type', expense_type,
                                'amount', amount,
                                'currency', currency,
                                'date', date,
                                'description', description,
                                'receipt_url', receipt_url,
                                'status', status,
                                'created_at', created_at,
                                'updated_at', updated_at
                            )
                        ) as expenses
                    FROM
                        trip_expenses
                    WHERE
                        trip_id = $1
                ),
                approvals AS (
                    SELECT
                        json_agg(
                            json_build_object(
                                'id', id,
                                'approver_id', approver_id,
                                'status', status,
                                'comments', comments,
                                'created_at', created_at,
                                'updated_at', updated_at,
                                'approver_name', CONCAT(u.first_name, ' ', u.last_name)
                            )
                        ) as approvals
                    FROM
                        trip_approvals ta
                    LEFT JOIN
                        users u ON ta.approver_id = u.id
                    WHERE
                        trip_id = $1
                )
                SELECT
                    td.*,
                    e.expenses,
                    a.approvals
                FROM
                    trip_details td
                LEFT JOIN
                    expenses e ON true
                LEFT JOIN
                    approvals a ON true
            `;

            const result = await client.query(query, [tripId]);

            const duration = performance.now() - startTime;
            if (duration > this.SLOW_QUERY_THRESHOLD_MS) {
                this.logger.warn('Slow query detected', {
                    queryType: 'getTripLogWithDetails',
                    duration,
                    tripId
                });
            }

            return result.rows[0] || null;
        } catch (error) {
            this.logger.error('Error executing trip details query', {
                error,
                tripId,
                duration: performance.now() - startTime
            });
            throw error;
        } finally {
            client.release();
        }
    }

    public async close(): Promise<void> {
        try {
            await this.pool.end();
            this.logger.info('Database pool closed');
        } catch (error) {
            this.logger.error('Error closing database pool', { error });
        }
    }
}

export const tripLogsDatabase = new TripLogsDatabase();
```

### API Response Compression (40 lines)

```typescript
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

class ResponseCompressor {
    private logger: Logger;
    private readonly COMPRESSION_THRESHOLD = 1024; // 1KB
    private readonly COMPRESSION_LEVEL = 6; // Balance between speed and compression

    constructor() {
        this.logger = new Logger('ResponseCompressor');
    }

    public middleware(): (req: Request, res: Response, next: NextFunction) => void {
        return (req: Request, res: Response, next: NextFunction) => {
            const startTime = performance.now();

            // Check if client accepts compression
            if (!req.headers['accept-encoding']?.includes('gzip')) {
                this.logger.debug('Client does not accept gzip compression', {
                    requestId: req.id
                });
                return next();
            }

            // Check if response should be compressed
            const originalWrite = res.write;
            const originalEnd = res.end;
            const chunks: Buffer[] = [];
            let responseSize = 0;

            res.write = function(chunk: any): boolean {
                if (chunk) {
                    chunks.push(Buffer.from(chunk));
                    responseSize += chunk.length;
                }
                return originalWrite.apply(res, arguments as any);
            };

            res.end = function(chunk: any): any {
                if (chunk) {
                    chunks.push(Buffer.from(chunk));
                    responseSize += chunk.length;
                }

                // Only compress if response is large enough
                if (responseSize >= this.COMPRESSION_THRESHOLD) {
                    const body = Buffer.concat(chunks);
                    const acceptEncoding = req.headers['accept-encoding'] || '';

                    if (acceptEncoding.includes('gzip')) {
                        compression({
                            level: this.COMPRESSION_LEVEL,
                            threshold: 0
                        })(req, res, () => {
                            res.setHeader('Content-Encoding', 'gzip');
                            res.setHeader('Content-Length', body.length);
                            originalEnd.call(res, body);
                        });
                    } else {
                        originalEnd.call(res, body);
                    }
                } else {
                    originalEnd.apply(res, arguments as any);
                }

                const duration = performance.now() - startTime;
                this.logger.debug('Response compression completed', {
                    requestId: req.id,
                    originalSize: responseSize,
                    compressed: responseSize >= this.COMPRESSION_THRESHOLD,
                    duration
                });
            }.bind(this);

            next();
        };
    }

    public async compressString(content: string): Promise<Buffer> {
        const startTime = performance.now();
        try {
            if (content.length < this.COMPRESSION_THRESHOLD) {
                this.logger.debug('Content too small for compression', {
                    originalSize: content.length
                });
                return Buffer.from(content);
            }

            return new Promise<Buffer>((resolve, reject) => {
                compression({
                    level: this.COMPRESSION_LEVEL,
                    threshold: 0
                }).transform(content, (err, compressed) => {
                    if (err) {
                        this.logger.error('Error compressing content', {
                            error: err,
                            originalSize: content.length,
                            duration: performance.now() - startTime
                        });
                        reject(err);
                    } else {
                        this.logger.debug('Content compressed successfully', {
                            originalSize: content.length,
                            compressedSize: compressed.length,
                            ratio: (compressed.length / content.length).toFixed(2),
                            duration: performance.now() - startTime
                        });
                        resolve(compressed);
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error in compressString', {
                error,
                duration: performance.now() - startTime
            });
            throw error;
        }
    }
}

export const responseCompressor = new ResponseCompressor();
```

### Lazy Loading Implementation (50 lines)

```typescript
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

interface LazyLoadOptions<T> {
    loadFn: () => Promise<T>;
    cacheKey?: string;
    ttl?: number;
    maxRetries?: number;
    retryDelay?: number;
}

class LazyLoader {
    private logger: Logger;
    private cache: Map<string, { value: any; expires: number }>;
    private loadingPromises: Map<string, Promise<any>>;

    constructor() {
        this.logger = new Logger('LazyLoader');
        this.cache = new Map();
        this.loadingPromises = new Map();
    }

    public async load<T>(key: string, options: LazyLoadOptions<T>): Promise<T> {
        const startTime = performance.now();
        const cacheKey = options.cacheKey || key;

        try {
            // Check cache first
            const cachedValue = this.getFromCache<T>(cacheKey);
            if (cachedValue !== null) {
                this.logger.debug('Cache hit for lazy loaded resource', {
                    key: cacheKey,
                    duration: performance.now() - startTime
                });
                return cachedValue;
            }

            // Check if already loading
            if (this.loadingPromises.has(cacheKey)) {
                this.logger.debug('Waiting for existing load operation', {
                    key: cacheKey
                });
                return this.loadingPromises.get(cacheKey) as Promise<T>;
            }

            // Start loading
            const loadPromise = this.executeLoad<T>(cacheKey, options);
            this.loadingPromises.set(cacheKey, loadPromise);

            const result = await loadPromise;
            this.loadingPromises.delete(cacheKey);

            this.logger.debug('Lazy loaded resource', {
                key: cacheKey,
                duration: performance.now() - startTime
            });

            return result;
        } catch (error) {
            this.loadingPromises.delete(cacheKey);
            this.logger.error('Error lazy loading resource', {
                key: cacheKey,
                error,
                duration: performance.now() - startTime
            });
            throw error;
        }
    }

    private getFromCache<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (cached.expires && cached.expires < Date.now()) {
            this.cache.delete(key);
            return null;
        }

        return cached.value as T;
    }

    private async executeLoad<T>(key: string, options: LazyLoadOptions<T>): Promise<T> {
        const startTime = performance.now();
        let retries = 0;
        const maxRetries = options.maxRetries || 3;
        const retryDelay = options.retryDelay || 1000;

        while (retries <= maxRetries) {
            try {
                const value = await options.loadFn();
                const expires = options.ttl ? Date.now() + options.ttl : null;

                if (expires) {
                    this.cache.set(key, { value, expires });
                }

                this.logger.debug('Successfully loaded lazy resource', {
                    key,
                    retries,
                    duration: performance.now() - startTime
                });

                return value;
            } catch (error) {
                retries++;
                if (retries > maxRetries) {
                    throw error;
                }

                this.logger.warn('Retrying lazy load after error', {
                    key,
                    retries,
                    error: error instanceof Error ? error.message : error,
                    delay: retryDelay
                });

                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        throw new Error('Max retries exceeded for lazy load');
    }

    public async preload<T>(key: string, options: LazyLoadOptions<T>): Promise<void> {
        const startTime = performance.now();
        try {
            await this.load(key, options);
            this.logger.debug('Preloaded resource', {
                key,
                duration: performance.now() - startTime
            });
        } catch (error) {
            this.logger.error('Error preloading resource', {
                key,
                error,
                duration: performance.now() - startTime
            });
        }
    }

    public clearCache(key?: string): void {
        if (key) {
            this.cache.delete(key);
            this.logger.debug('Cleared cache for key', { key });
        } else {
            this.cache.clear();
            this.logger.debug('Cleared all lazy load cache');
        }
    }
}

export const lazyLoader = new LazyLoader();

// Example usage:
/*
const tripLogsLoader = new LazyLoader();

async function getTripLogs(userId: string) {
    return tripLogsLoader.load(`trip_logs_${userId}`, {
        loadFn: async () => {
            return await tripLogsDatabase.getTripLogs(userId);
        },
        cacheKey: `trip_logs_${userId}`,
        ttl: 300000 // 5 minutes
    });
}
*/
```

### Request Debouncing (40 lines)

```typescript
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

interface DebounceOptions {
    wait: number;
    maxWait?: number;
    leading?: boolean;
    trailing?: boolean;
}

class RequestDebouncer {
    private logger: Logger;
    private timers: Map<string, NodeJS.Timeout>;
    private maxWaitTimers: Map<string, NodeJS.Timeout>;
    private lastCallTimes: Map<string, number>;
    private lastInvokeTimes: Map<string, number>;
    private pendingCalls: Map<string, { args: any[]; resolve: (value: any) => void }>;

    constructor() {
        this.logger = new Logger('RequestDebouncer');
        this.timers = new Map();
        this.maxWaitTimers = new Map();
        this.lastCallTimes = new Map();
        this.lastInvokeTimes = new Map();
        this.pendingCalls = new Map();
    }

    public debounce<T>(
        key: string,
        fn: (...args: any[]) => Promise<T>,
        options: DebounceOptions
    ): Promise<T> {
        const startTime = performance.now();
        this.logger.debug('Debounce called', { key, options });

        return new Promise<T>((resolve) => {
            const now = Date.now();
            const lastCallTime = this.lastCallTimes.get(key) || 0;
            const lastInvokeTime = this.lastInvokeTimes.get(key) || 0;
            const timeSinceLastCall = now - lastCallTime;
            const timeSinceLastInvoke = now - lastInvokeTime;

            // Clear any existing timers
            this.clearTimers(key);

            // Set up pending call
            this.pendingCalls.set(key, { args: [], resolve });

            // Handle leading edge
            if (options.leading && timeSinceLastInvoke >= options.wait) {
                this.invokeFunction(key, fn, startTime);
            } else {
                // Set up trailing edge timer
                this.timers.set(key, setTimeout(() => {
                    this.invokeFunction(key, fn, startTime);
                }, options.wait));

                // Set up max wait timer if specified
                if (options.maxWait && timeSinceLastCall >= options.maxWait) {
                    this.maxWaitTimers.set(key, setTimeout(() => {
                        this.invokeFunction(key, fn, startTime);
                    }, options.maxWait - timeSinceLastCall));
                }
            }

            this.lastCallTimes.set(key, now);
        });
    }

    private async invokeFunction<T>(
        key: string,
        fn: (...args: any[]) => Promise<T>,
        startTime: number
    ): Promise<void> {
        if (!this.pendingCalls.has(key)) return;

        const { args, resolve } = this.pendingCalls.get(key)!;
        this.pendingCalls.delete(key);
        this.clearTimers(key);
        this.lastInvokeTimes.set(key, Date.now());

        try {
            const result = await fn(...args);
            resolve(result);
            this.logger.debug('Debounced function executed', {
                key,
                duration: performance.now() - startTime
            });
        } catch (error) {
            this.logger.error('Error in debounced function', {
                key,
                error,
                duration: performance.now() - startTime
            });
            throw error;
        }
    }

    private clearTimers(key: string): void {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }

        if (this.maxWaitTimers.has(key)) {
            clearTimeout(this.maxWaitTimers.get(key));
            this.maxWaitTimers.delete(key);
        }
    }

    public cancel(key: string): void {
        this.clearTimers(key);
        if (this.pendingCalls.has(key)) {
            this.pendingCalls.delete(key);
            this.logger.debug('Debounced call cancelled', { key });
        }
    }
}

export const requestDebouncer = new RequestDebouncer();

// Example usage:
/*
async function searchTrips(query: string) {
    return requestDebouncer.debounce(
        `search_trips_${query}`,
        async () => {
            return await tripLogsDatabase.searchTrips(query);
        },
        {
            wait: 300,
            maxWait: 1000,
            leading: false,
            trailing: true
        }
    );
}
*/
```

### Connection Pooling (40 lines)

```typescript
import { Pool, PoolClient, PoolConfig } from 'pg';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

class DatabaseConnectionPool {
    private pool: Pool;
    private logger: Logger;
    private readonly DEFAULT_POOL_CONFIG: PoolConfig = {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        application_name: 'trip-logs-service'
    };

    constructor(config?: PoolConfig) {
        this.logger = new Logger('DatabaseConnectionPool');
        this.initializePool(config);
    }

    private initializePool(config?: PoolConfig): void {
        const poolConfig = {
            ...this.DEFAULT_POOL_CONFIG,
            ...config,
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_SSL === 'true' ? {
                rejectUnauthorized: false
            } : false
        };

        this.pool = new Pool(poolConfig);

        this.pool.on('connect', (client) => {
            this.logger.debug('New database connection established', {
                totalConnections: this.pool.totalCount,
                idleConnections: this.pool.idleCount,
                waitingClients: this.pool.waitingCount
            });
        });

        this.pool.on('acquire', (client) => {
            this.logger.debug('Connection acquired from pool', {
                totalConnections: this.pool.totalCount,
                idleConnections: this.pool.idleCount,
                waitingClients: this.pool.waitingCount
            });
        });

        this.pool.on('remove', (client) => {
            this.logger.debug('Connection removed from pool', {
                totalConnections: this.pool.totalCount,
                idleConnections: this.pool.idleCount,
                waitingClients: this.pool.waitingCount
            });
        });

        this.pool.on('error', (err, client) => {
            this.logger.error('Database pool error', {
                error: err,
                totalConnections: this.pool.totalCount,
                idleConnections: this.pool.idleCount,
                waitingClients: this.pool.waitingCount
            });
        });

        this.logger.info('Database connection pool initialized', {
            maxConnections: poolConfig.max,
            idleTimeout: `${poolConfig.idleTimeoutMillis}ms`,
            connectionTimeout: `${poolConfig.connectionTimeoutMillis}ms`
        });
    }

    public async getClient(): Promise<PoolClient> {
        const startTime = performance.now();
        try {
            const client = await this.pool.connect();

            // Add custom error handling for this client
            client.on('error', (err) => {
                this.logger.error('Client connection error', {
                    error: err,
                    duration: performance.now() - startTime
                });
            });

            this.logger.debug('Client acquired from pool', {
                duration: performance.now() - startTime,
                totalConnections: this.pool.totalCount,
                idleConnections: this.pool.idleCount,
                waitingClients: this.pool.waitingCount
            });

            return client;
        } catch (error) {
            this.logger.error('Error acquiring client from pool', {
                error,
                duration: performance.now() - startTime
            });
            throw error;
        }
    }

    public async executeQuery<T>(
        query: string,
        params: any[] = [],
        client?: PoolClient
    ): Promise<T[]> {
        const startTime = performance.now();
        let acquiredClient = false;

        try {
            const dbClient = client || (await this.getClient());
            if (!client) acquiredClient = true;

            this.logger.debug('Executing query', {
                query: query.substring(0, 100) + '...',
                paramsCount: params.length
            });

            const result = await dbClient.query(query, params);

            this.logger.debug('Query executed successfully', {
                rowCount: result.rowCount,
                duration: performance.now() - startTime
            });

            return result.rows as T[];
        } catch (error) {
            this.logger.error('Error executing query', {
                query: query.substring(0, 100) + '...',
                error,
                duration: performance.now() - startTime
            });
            throw error;
        } finally {
            if (acquiredClient && client) {
                client.release();
            }
        }
    }

    public async executeTransaction<T>(
        queries: { query: string; params?: any[] }[]
    ): Promise<T[]> {
        const startTime = performance.now();
        const client = await this.getClient();

        try {
            await client.query('BEGIN');

            const results: T[] = [];
            for (const { query, params } of queries) {
                const result = await client.query(query, params);
                results.push(result.rows as T);
            }

            await client.query('COMMIT');

            this.logger.debug('Transaction executed successfully', {
                queryCount: queries.length,
                duration: performance.now() - startTime
            });

            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Transaction failed, rolled back', {
                error,
                duration: performance.now() - startTime
            });
            throw error;
        } finally {
            client.release();
        }
    }

    public async close(): Promise<void> {
        const startTime = performance.now();
        try {
            await this.pool.end();
            this.logger.info('Database connection pool closed', {
                duration: performance.now() - startTime
            });
        } catch (error) {
            this.logger.error('Error closing database connection pool', {
                error,
                duration: performance.now() - startTime
            });
            throw error;
        }
    }

    public getPoolStats(): {
        totalConnections: number;
        idleConnections: number;
        waitingClients: number;
    } {
        return {
            totalConnections: this.pool.totalCount,
            idleConnections: this.pool.idleCount,
            waitingClients: this.pool.waitingCount
        };
    }
}

export const databaseConnectionPool = new DatabaseConnectionPool();
```

## Real-Time Features (350+ lines)

### WebSocket Server Setup (70 lines)

```typescript
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import { jwtVerify } from 'jose';
import { UserService } from '../services/userService';

interface WebSocketConnection extends WebSocket {
    id: string;
    userId: string;
    userRole: string;
    isAlive: boolean;
    lastPingTime: number;
    metadata: Record<string, any>;
}

class TripLogsWebSocketServer {
    private wss: WebSocketServer;
    private logger: Logger;
    private userService: UserService;
    private readonly PING_INTERVAL = 30000; // 30 seconds
    private readonly PONG_TIMEOUT = 10000; // 10 seconds
    private readonly MAX_CONNECTION_AGE = 86400000; // 24 hours

    constructor(server: any) {
        this.logger = new Logger('TripLogsWebSocketServer');
        this.userService = new UserService();
        this.initializeServer(server);
    }

    private initializeServer(server: any): void {
        this.wss = new WebSocketServer({
            server,
            path: '/ws/trip-logs',
            clientTracking: true,
            maxPayload: 1024 * 1024 // 1MB
        });

        this.logger.info('WebSocket server initialized', {
            path: '/ws/trip-logs',
            maxPayload: '1MB'
        });

        this.setupEventHandlers();
        this.setupHeartbeat();
    }

    private setupEventHandlers(): void {
        this.wss.on('connection', (ws: WebSocketConnection, req: IncomingMessage) => {
            const startTime = performance.now();
            const connectionId = uuidv4();

            ws.id = connectionId;
            ws.isAlive = true;
            ws.lastPingTime = Date.now();
            ws.metadata = {};

            this.logger.info('New WebSocket connection', {
                connectionId,
                ip: req.socket.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            // Authenticate the connection
            this.authenticateConnection(ws, req)
                .then(() => {
                    this.logger.debug('WebSocket connection authenticated', {
                        connectionId,
                        duration: performance.now() - startTime
                    });

                    this.setupConnectionHandlers(ws);
                })
                .catch((error) => {
                    this.logger.error('WebSocket authentication failed', {
                        connectionId,
                        error,
                        duration: performance.now() - startTime
                    });
                    ws.close(1008, 'Authentication failed');
                });
        });

        this.wss.on('close', () => {
            this.logger.info('WebSocket server closed');
        });

        this.wss.on('error', (error) => {
            this.logger.error('WebSocket server error', { error });
        });
    }

    private async authenticateConnection(ws: WebSocketConnection, req: IncomingMessage): Promise<void> {
        const token = this.extractToken(req);

        if (!token) {
            throw new Error('No authentication token provided');
        }

        try {
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET!),
                {
                    algorithms: ['HS256'],
                    issuer: 'trip-logs-service'
                }
            );

            if (!payload.sub) {
                throw new Error('Invalid token payload');
            }

            const user = await this.userService.getUserById(payload.sub);
            if (!user) {
                throw new Error('User not found');
            }

            ws.userId = user.id;
            ws.userRole = user.role;
            ws.metadata = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                department: user.department
            };

            this.logger.debug('WebSocket user authenticated', {
                userId: ws.userId,
                role: ws.userRole
            });
        } catch (error) {
            this.logger.error('WebSocket authentication error', { error });
            throw error;
        }
    }

    private extractToken(req: IncomingMessage): string | null {
        const authHeader = req.headers['sec-websocket-protocol'];
        if (!authHeader) return null;

        const parts = authHeader.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.startsWith('Bearer ')) {
                return trimmed.substring(7);
            }
        }

        return null;
    }

    private setupConnectionHandlers(ws: WebSocketConnection): void {
        ws.on('message', (data: WebSocket.RawData) => {
            this.handleMessage(ws, data);
        });

        ws.on('pong', () => {
            ws.isAlive = true;
            ws.lastPingTime = Date.now();
            this.logger.debug('Received pong from client', { connectionId: ws.id });
        });

        ws.on('close', (code: number, reason: Buffer) => {
            this.logger.info('WebSocket connection closed', {
                connectionId: ws.id,
                userId: ws.userId,
                code,
                reason: reason.toString()
            });
        });

        ws.on('error', (error) => {
            this.logger.error('WebSocket connection error', {
                connectionId: ws.id,
                userId: ws.userId,
                error
            });
        });

        // Send welcome message
        this.sendMessage(ws, {
            type: 'welcome',
            connectionId: ws.id,
            timestamp: Date.now(),
            user: {
                id: ws.userId,
                role: ws.userRole,
                ...ws.metadata
            }
        });
    }

    private setupHeartbeat(): void {
        setInterval(() => {
            this.wss.clients.forEach((ws: WebSocketConnection) => {
                // Check if connection is still alive
                if (!ws.isAlive) {
                    this.logger.warn('Terminating unresponsive WebSocket connection', {
                        connectionId: ws.id,
                        userId: ws.userId
                    });
                    ws.terminate();
                    return;
                }

                // Check connection age
                if (Date.now() - ws.lastPingTime > this.MAX_CONNECTION_AGE) {
                    this.logger.info('Terminating old WebSocket connection', {
                        connectionId: ws.id,
                        userId: ws.userId,
                        age: `${(Date.now() - ws.lastPingTime) / 1000} seconds`
                    });
                    ws.close(1000, 'Connection too old');
                    return;
                }

                // Send ping
                ws.isAlive = false;
                ws.ping();
                this.logger.debug('Sent ping to client', { connectionId: ws.id });
            });
        }, this.PING_INTERVAL);
    }
}
```

### Real-Time Event Handlers (90 lines)

```typescript
import { WebSocketConnection } from './websocketServer';
import { TripLogsService } from '../services/tripLogsService';
import { NotificationService } from '../services/notificationService';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

class WebSocketEventHandler {
    private tripLogsService: TripLogsService;
    private notificationService: NotificationService;
    private logger: Logger;
    private eventHandlers: Record<string, (ws: WebSocketConnection, data: any) => Promise<void>>;

    constructor() {
        this.tripLogsService = new TripLogsService();
        this.notificationService = new NotificationService();
        this.logger = new Logger('WebSocketEventHandler');
        this.initializeEventHandlers();
    }

    private initializeEventHandlers(): void {
        this.eventHandlers = {
            'trip:subscribe': this.handleTripSubscribe.bind(this),
            'trip:unsubscribe': this.handleTripUnsubscribe.bind(this),
            'trip:update': this.handleTripUpdate.bind(this),
            'expense:create': this.handleExpenseCreate.bind(this),
            'expense:update': this.handleExpenseUpdate.bind(this),
            'expense:delete': this.handleExpenseDelete.bind(this),
            'approval:request': this.handleApprovalRequest.bind(this),
            'approval:respond': this.handleApprovalResponse.bind(this),
            'notification:read': this.handleNotificationRead.bind(this),
            'presence:update': this.handlePresenceUpdate.bind(this)
        };
    }

    public async handleMessage(ws: WebSocketConnection, data: WebSocket.RawData): Promise<void> {
        const startTime = performance.now();
        let parsedData: any;

        try {
            parsedData = JSON.parse(data.toString());
            this.logger.debug('Received WebSocket message', {
                connectionId: ws.id,
                userId: ws.userId,
                messageType: parsedData.type
            });

            if (!parsedData.type) {
                throw new Error('Message type is required');
            }

            if (!this.eventHandlers[parsedData.type]) {
                throw new Error(`Unknown message type: ${parsedData.type}`);
            }

            await this.eventHandlers[parsedData.type](ws, parsedData);
        } catch (error) {
            this.logger.error('Error handling WebSocket message', {
                connectionId: ws.id,
                userId: ws.userId,
                error,
                data: parsedData || data.toString(),
                duration: performance.now() - startTime
            });

            this.sendError(ws, {
                type: 'error',
                code: 'INVALID_MESSAGE',
                message: error instanceof Error ? error.message : 'Invalid message format',
                timestamp: Date.now()
            });
        }
    }

    private async handleTripSubscribe(ws: WebSocketConnection, data: any): Promise<void> {
        const startTime = performance.now();

        if (!data.tripId) {
            throw new Error('tripId is required for subscription');
        }

        try {
            // Verify user has access to this trip
            const trip = await this.tripLogsService.getTripLog(data.tripId);
            if (!trip) {
                throw new Error('Trip not found');
            }

            if (trip.userId !== ws.userId && ws.userRole !== 'admin') {
                throw new Error('Unauthorized access to trip');
            }

            // Add to trip room
            if (!ws.metadata.subscriptions) {
                ws.metadata.subscriptions = new Set();
            }
            ws.metadata.subscriptions.add(`trip:${data.tripId}`);

            this.logger.debug('User subscribed to trip', {
                connectionId: ws.id,
                userId: ws.userId,
                tripId: data.tripId,
                duration: performance.now() - startTime
            });

            // Send current trip state
            this.sendMessage(ws, {
                type: 'trip:state',
                trip: await this.tripLogsService.getTripLogWithDetails(data.tripId),
                timestamp: Date.now()
            });
        } catch (error) {
            this.logger.error('Error handling trip subscription', {
                connectionId: ws.id,
                userId: ws.userId,
                tripId: data.tripId,
                error,
                duration: performance.now() - startTime
            });
            throw error;
        }
    }

    private async handleTripUnsubscribe(ws: WebSocketConnection, data: any): Promise<void> {
        const startTime = performance.now();

        if (!data.tripId) {
            throw new Error('tripId is required for unsubscription');
        }

        try {
            if (ws.metadata.subscriptions) {
                ws.metadata.subscriptions.delete(`trip:${data.tripId}`);
            }

            this.logger.debug('User unsubscribed from trip', {
                connectionId: ws.id,
                userId: ws.userId,
                tripId: data.tripId,
                duration: performance.now() - startTime
            });
        } catch (error) {
            this.logger.error('Error handling trip unsubscription', {
                connectionId: ws.id,
                userId: ws.userId,
                tripId: data.tripId,
                error,
                duration: performance.now() - startTime
            });
            throw error;
        }
    }

    private async handleTripUpdate(ws: WebSocketConnection, data: any): Promise<void> {
        const startTime = performance.now();

        if (!data.tripId || !data.updates) {
            throw new Error('tripId and updates are required');
        }

        try {
            // Verify user has permission to update this trip
            const trip = await this.tripLogsService.getTripLog(data.tripId);
            if (!trip) {
                throw new Error('Trip not found');
            }

            if (trip.userId !== ws.userId) {
                throw new Error('Unauthorized to update trip');
            }

            // Update the trip
            const updatedTrip = await this.tripLogsService.updateTripLog(
                data.tripId,
                data.updates,
                ws.userId
            );

            // Broadcast update to all subscribers
            this.broadcastToRoom(`trip:${data.tripId}`, {
                type: 'trip:updated',
                trip: updatedTrip,
                updatedBy: ws.userId,
                timestamp: Date.now()
            });

            this.logger.debug('Trip updated via WebSocket', {
                connectionId: ws.id,
                userId: ws.userId,
                tripId: data.tripId,
                duration: performance.now() - startTime
            });
        } catch (error) {
            this.logger.error('Error handling trip update', {
                connectionId: ws.id,
                userId: ws.userId,
                tripId: data.tripId,
                error,
                duration: performance.now() - startTime
            });
            throw error;
        }
    }

    private async handleExpenseCreate(ws: WebSocketConnection, data: any): Promise<void> {
        const startTime = performance.now();

        if (!data.tripId || !data.expense) {
            throw new Error('tripId and expense are required');
        }

        try {
            // Verify user has permission to add expenses to this trip
            const trip = await this.tripLogsService.getTripLog(data.tripId);
            if (!trip) {
                throw new Error('Trip not found');
            }

            if (trip.userId !== ws.userId) {
                throw new Error('Unauthorized to add expenses to trip');
            }

            // Create the expense
            const expense = await this.tripLogsService.createExpense(
                data.tripId,
                data.expense,
                ws.userId
            );

            // Broadcast to all subscribers
            this.broadcastToRoom(`trip:${data.tripId}`, {
                type: 'expense:created',
                tripId: data.tripId,
                expense,
                createdBy: ws.userId,
                timestamp: Date.now()
            });

            this.logger.debug('Expense created via WebSocket', {
                connectionId: ws.id,
                userId: ws.userId,
                tripId: data.tripId,
                expenseId: expense.id,
                duration: performance.now() - startTime
            });
        } catch (error) {
            this.logger.error('Error handling expense creation', {
                connectionId: ws.id,
                userId: ws.userId,
                tripId: data.tripId,
                error,
                duration: performance.now() - startTime
            });
            throw error;
        }
    }

    private broadcastToRoom(room: string, message: any): void {
        this.wss.clients.forEach((client: WebSocketConnection) => {
            if (client.metadata.subscriptions?.has(room)) {
                this.sendMessage(client, message);
            }
        });
    }

    private sendMessage(ws: WebSocketConnection, message: any): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    private sendError(ws: WebSocketConnection, error: any): void {
        this.sendMessage(ws, error);
    }
}

export const webSocketEventHandler = new WebSocketEventHandler();
```

### Client-Side WebSocket Integration (70 lines)

```typescript
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

interface WebSocketMessage {
    type: string;
    [key: string]: any;
}

interface WebSocketOptions {
    url: string;
    token: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    onOpen?: () => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (error: Event) => void;
    onMessage?: (message: WebSocketMessage) => void;
}

class TripLogsWebSocketClient {
    private socket: WebSocket | null = null;
    private logger: Logger;
    private options: WebSocketOptions;
    private reconnectAttempts = 0;
    private maxReconnectAttempts: number;
    private reconnectInterval: number;
    private isConnecting = false;
    private messageQueue: WebSocketMessage[] = [];
    private subscriptions: Set<string> = new Set();
    private connectionId: string | null = null;
    private pingInterval: NodeJS.Timeout | null = null;
    private readonly PING_INTERVAL = 25000; // 25 seconds

    constructor(options: WebSocketOptions) {
        this.logger = new Logger('TripLogsWebSocketClient');
        this.options = options;
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        this.initialize();
    }

    private initialize(): void {
        this.connect();
    }

    private connect(): void {
        if (this.isConnecting) return;
        this.isConnecting = true;

        const startTime = performance.now();
        this.logger.info('Connecting to WebSocket server', { url: this.options.url });

        try {
            this.socket = new WebSocket(this.options.url, ['Bearer', this.options.token]);

            this.socket.onopen = (event) => {
                this.reconnectAttempts = 0;
                this.isConnecting = false;
                this.connectionId = event.currentTarget instanceof WebSocket
                    ? event.currentTarget.url
                    : null;

                this.logger.info('WebSocket connection established', {
                    connectionId: this.connectionId,
                    duration: performance.now() - startTime
                });

                // Process queued messages
                this.processMessageQueue();

                // Set up ping
                this.setupPing();

                // Call onOpen callback
                if (this.options.onOpen) {
                    this.options.onOpen();
                }
            };

            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as WebSocketMessage;
                    this.logger.debug('Received WebSocket message', {
                        type: message.type,
                        connectionId: this.connectionId
                    });

                    // Handle welcome message
                    if (message.type === 'welcome') {
                        this.connectionId = message.connectionId;
                        this.logger.info('WebSocket connection authenticated', {
                            connectionId: this.connectionId,
                            user: message.user
                        });
                    }

                    // Call onMessage callback
                    if (this.options.onMessage) {
                        this.options.onMessage(message);
                    }
                } catch (error) {
                    this.logger.error('Error parsing WebSocket message', {
                        error,
                        data: event.data
                    });
                }
            };

            this.socket.onclose = (event) => {
                this.isConnecting = false;
                this.cleanupPing();

                this.logger.info('WebSocket connection closed', {
                    connectionId: this.connectionId,
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                });

                // Call onClose callback
                if (this.options.onClose) {
                    this.options.onClose(event);
                }

                // Attempt to reconnect
                this.attemptReconnect();
            };

            this.socket.onerror = (error) => {
                this.logger.error('WebSocket error', {
                    connectionId: this.connectionId,
                    error
                });

                // Call onError callback
                if (this.options.onError) {
                    this.options.onError(error);
                }
            };
        } catch (error) {
            this.isConnecting = false;
            this.logger.error('Error creating WebSocket connection', {
                error,
                duration: performance.now() - startTime
            });
            this.attemptReconnect();
        }
    }

    private setupPing(): void {
        this.cleanupPing();
        this.pingInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'ping',
                    timestamp: Date.now()
                }));
                this.logger.debug('Sent ping to server', { connectionId: this.connectionId });
            }
        }, this.PING_INTERVAL);
    }

    private cleanupPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error('Max reconnect attempts reached', {
                maxAttempts: this.maxReconnectAttempts
            });
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectInterval * this.reconnectAttempts;

        this.logger.info('Attempting to reconnect', {
            attempt: this.reconnectAttempts,
            delay: `${delay}ms`
        });

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    public send(message: WebSocketMessage): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.logger.warn('WebSocket not connected, queuing message', {
                messageType: message.type
            });
            this.messageQueue.push(message);
            return;
        }

        try {
            this.socket.send(JSON.stringify(message));
            this.logger.debug('Sent WebSocket message', {
                type: message.type,
                connectionId: this.connectionId
            });
        } catch (error) {
            this.logger.error('Error sending WebSocket message', {
                error,
                messageType: message.type
            });
        }
    }

    private processMessageQueue(): void {
        if (this.messageQueue.length === 0) return;

        this.logger.info('Processing queued WebSocket messages', {
            count: this.messageQueue.length
        });

        const queue = [...this.messageQueue];
        this.messageQueue = [];

        queue.forEach(message => this.send(message));
    }

    public subscribe(tripId: string): void {
        if (this.subscriptions.has(tripId)) return;

        this.subscriptions.add(tripId);
        this.send({
            type: 'trip:subscribe',
            tripId
        });
    }

    public unsubscribe(tripId: string): void {
        if (!this.subscriptions.has(tripId)) return;

        this.subscriptions.delete(tripId);
        this.send({
            type: 'trip:unsubscribe',
            tripId
        });
    }

    public updateTrip(tripId: string, updates: any): void {
        this.send({
            type: 'trip:update',
            tripId,
            updates
        });
    }

    public createExpense(tripId: string, expense: any): void {
        this.send({
            type: 'expense:create',
            tripId,
            expense
        });
    }

    public close(): void {
        this.cleanupPing();

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        this.logger.info('WebSocket client closed', { connectionId: this.connectionId });
    }
}

export default TripLogsWebSocketClient;
```

### Room/Channel Management (60 lines)

```typescript
import { WebSocketConnection } from './websocketServer';
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

class WebSocketRoomManager {
    private rooms: Map<string, Set<WebSocketConnection>>;
    private logger: Logger;
    private readonly MAX_ROOM_SIZE = 1000;
    private readonly ROOM_CLEANUP_INTERVAL = 3600000; // 1 hour

    constructor() {
        this.rooms = new Map();
        this.logger = new Logger('WebSocketRoomManager');
        this.setupRoomCleanup();
    }

    private setupRoomCleanup(): void {
        setInterval(() => {
            const startTime = performance.now();
            let cleanedRooms = 0;

            this.rooms.forEach((connections, room) => {
                if (connections.size === 0) {
                    this.rooms.delete(room);
                    cleanedRooms++;
                }
            });

            this.logger.debug('Room cleanup completed', {
                cleanedRooms,
                remainingRooms: this.rooms.size,
                duration: performance.now() - startTime
            });
        }, this.ROOM_CLEANUP_INTERVAL);
    }

    public joinRoom(room: string, ws: WebSocketConnection): void {
        const startTime = performance.now();

        if (!this.rooms.has(room)) {
            this.rooms.set(room, new Set());
        }

        const roomConnections = this.rooms.get(room)!;

        if (roomConnections.size >= this.MAX_ROOM_SIZE) {
            this.logger.warn('Room size limit reached', {
                room,
                maxSize: this.MAX_ROOM_SIZE
            });
            throw new Error('Room size limit reached');
        }

        roomConnections.add(ws);
        this.logger.debug('WebSocket joined room', {
            connectionId: ws.id,
            userId: ws.userId,
            room,
            roomSize: roomConnections.size,
            duration: performance.now() - startTime
        });
    }

    public leaveRoom(room: string, ws: WebSocketConnection): void {
        const startTime = performance.now();

        if (!this.rooms.has(room)) {
            this.logger.warn('Attempt to leave non-existent room', {
                room,
                connectionId: ws.id
            });
            return;
        }

        const roomConnections = this.rooms.get(room)!;
        roomConnections.delete(ws);

        this.logger.debug('WebSocket left room', {
            connectionId: ws.id,
            userId: ws.userId,
            room,
            roomSize: roomConnections.size,
            duration: performance.now() - startTime
        });
    }

    public leaveAllRooms(ws: WebSocketConnection): void {
        const startTime = performance.now();
        let roomsLeft = 0;

        this.rooms.forEach((connections, room) => {
            if (connections.has(ws)) {
                connections.delete(ws);
                roomsLeft++;
            }
        });

        this.logger.debug('WebSocket left all rooms', {
            connectionId: ws.id,
            userId: ws.userId,
            roomsLeft,
            duration: performance.now() - startTime
        });
    }

    public broadcastToRoom(room: string, message: any, exclude?: WebSocketConnection): void {
        const startTime = performance.now();

        if (!this.rooms.has(room)) {
            this.logger.debug('No connections in room, nothing to broadcast', {
                room,
                duration: performance.now() - startTime
            });
            return;
        }

        const roomConnections = this.rooms.get(room)!;
        let sentCount = 0;

        roomConnections.forEach((ws) => {
            if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(JSON.stringify(message));
                    sentCount++;
                } catch (error) {
                    this.logger.error('Error sending message to WebSocket', {
                        connectionId: ws.id,
                        userId: ws.userId,
                        room,
                        error
                    });
                }
            }
        });

        this.logger.debug('Broadcast message to room', {
            room,
            messageType: message.type,
            sentCount,
            totalConnections: roomConnections.size,
            duration: performance.now() - startTime
        });
    }

    public broadcastToUser(userId: string, message: any): void {
        const startTime = performance.now();
        let sentCount = 0;

        this.rooms.forEach((connections) => {
            connections.forEach((ws) => {
                if (ws.userId === userId && ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.send(JSON.stringify(message));
                        sentCount++;
                    } catch (error) {
                        this.logger.error('Error sending message to user WebSocket', {
                            connectionId: ws.id,
                            userId,
                            error
                        });
                    }
                }
            });
        });

        this.logger.debug('Broadcast message to user', {
            userId,
            messageType: message.type,
            sentCount,
            duration: performance.now() - startTime
        });
    }

    public getRoomConnections(room: string): WebSocketConnection[] {
        if (!this.rooms.has(room)) {
            return [];
        }

        return Array.from(this.rooms.get(room)!.values());
    }

    public getRoomSize(room: string): number {
        if (!this.rooms.has(room)) {
            return 0;
        }

        return this.rooms.get(room)!.size;
    }

    public getUserConnections(userId: string): WebSocketConnection[] {
        const connections: WebSocketConnection[] = [];

        this.rooms.forEach((roomConnections) => {
            roomConnections.forEach((ws) => {
                if (ws.userId === userId) {
                    connections.push(ws);
                }
            });
        });

        return connections;
    }

    public getUserRoomCount(userId: string): number {
        let count = 0;

        this.rooms.forEach((roomConnections) => {
            roomConnections.forEach((ws) => {
                if (ws.userId === userId) {
                    count++;
                }
            });
        });

        return count;
    }
}

export const webSocketRoomManager = new WebSocketRoomManager();
```

### Reconnection Logic (40 lines)

```typescript
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

interface ReconnectionOptions {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    jitter?: boolean;
    onReconnect?: (attempt: number) => void;
    onMaxAttempts?: () => void;
}

class WebSocketReconnector {
    private logger: Logger;
    private options: Required<ReconnectionOptions>;
    private attempt: number = 0;
    private timeoutId: NodeJS.Timeout | null = null;
    private isReconnecting: boolean = false;

    constructor(options: ReconnectionOptions = {}) {
        this.logger = new Logger('WebSocketReconnector');
        this.options = {
            maxAttempts: options.maxAttempts || 10,
            baseDelay: options.baseDelay || 1000,
            maxDelay: options.maxDelay || 30000,
            jitter: options.jitter !== false, // default to true
            onReconnect: options.onReconnect || (() => {}),
            onMaxAttempts: options.onMaxAttempts || (() => {})
        };
    }

    public startReconnecting(): void {
        if (this.isReconnecting) return;
        this.isReconnecting = true;
        this.attempt = 0;
        this.scheduleReconnect();
    }

    public stopReconnecting(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.isReconnecting = false;
        this.attempt = 0;
    }

    private scheduleReconnect(): void {
        if (this.attempt >= this.options.maxAttempts) {
            this.logger.warn('Max reconnection attempts reached', {
                maxAttempts: this.options.maxAttempts
            });
            this.options.onMaxAttempts();
            this.isReconnecting = false;
            return;
        }

        this.attempt++;
        const delay = this.calculateDelay();

        this.logger.info('Scheduling reconnection attempt', {
            attempt: this.attempt,
            delay: `${delay}ms`
        });

        this.timeoutId = setTimeout(() => {
            this.options.onReconnect(this.attempt);
            this.scheduleReconnect();
        }, delay);
    }

    private calculateDelay(): number {
        const exponentialDelay = Math.min(
            this.options.baseDelay * Math.pow(2, this.attempt - 1),
            this.options.maxDelay
        );

        if (!this.options.jitter) {
            return exponentialDelay;
        }

        // Add jitter to avoid thundering herd problem
        const jitter = Math.random() * exponentialDelay * 0.2; // 20% jitter
        return exponentialDelay + jitter;
    }

    public getReconnectAttempts(): number {
        return this.attempt;
    }

    public isActive(): boolean {
        return this.isReconnecting;
    }

    public getNextDelay(): number {
        return this.calculateDelay();
    }
}

export default WebSocketReconnector;

// Example usage:
/*
const reconnector = new WebSocketReconnector({
    maxAttempts: 15,
    baseDelay: 2000,
    maxDelay: 60000,
    onReconnect: (attempt) => {
        console.log(`Attempting to reconnect (attempt ${attempt})`);
        // Try to reconnect here
    },
    onMaxAttempts: () => {
        console.log('Max reconnection attempts reached');
    }
});

// When connection is lost:
reconnector.startReconnecting();

// When connection is re-established:
reconnector.stopReconnecting();
*/
```

## AI/ML Capabilities (300+ lines)

### Predictive Model Training (90 lines)

```python
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_regression
from joblib import dump, load
import mlflow
import mlflow.sklearn
from datetime import datetime
import logging
import os
from typing import Tuple, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TripExpensePredictor:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.feature_columns = None
        self.target_column = 'total_expense'
        self.experiment_name = 'trip_expense_prediction'
        self.model_path = 'models/trip_expense_predictor.joblib'
        self.preprocessor_path = 'models/preprocessor.joblib'
        self.experiment_id = None

        # Initialize MLflow
        mlflow.set_tracking_uri(os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000'))
        mlflow.set_experiment(self.experiment_name)

    def load_data(self, file_path: str) -> pd.DataFrame:
        """Load and preprocess the training data"""
        logger.info(f"Loading data from {file_path}")
        data = pd.read_csv(file_path, parse_dates=['start_date', 'end_date'])

        # Feature engineering
        data['trip_duration'] = (data['end_date'] - data['start_date']).dt.days
        data['start_month'] = data['start_date'].dt.month
        data['start_day_of_week'] = data['start_date'].dt.dayofweek
        data['start_day_of_month'] = data['start_date'].dt.day
        data['is_weekend'] = data['start_day_of_week'].isin([5, 6]).astype(int)

        # Handle missing values in target
        data = data.dropna(subset=[self.target_column])

        logger.info(f"Data loaded with {len(data)} records and {len(data.columns)} columns")
        return data

    def preprocess_data(self, data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Preprocess the data and split into features and target"""
        # Separate features and target
        X = data.drop(columns=[self.target_column, 'start_date', 'end_date'])
        y = data[self.target_column]

        # Identify feature types
        numeric_features = X.select_dtypes(include=['int64', 'float64']).columns
        categorical_features = X.select_dtypes(include=['object', 'category']).columns

        # Create preprocessing pipeline
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])

        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ])

        # Fit and transform the data
        X_processed = self.preprocessor.fit_transform(X)
        self.feature_columns = numeric_features.tolist() + \
                              self.preprocessor.named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(categorical_features).tolist()

        logger.info(f"Data preprocessing completed. Features: {len(self.feature_columns)}")
        return X_processed, y

    def train_model(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """Train the predictive model with cross-validation"""
        logger.info("Starting model training")

        # Split data into train and test sets (time-series aware)
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        # Define models to try
        models = {
            'random_forest': RandomForestRegressor(
                n_estimators=200,
                max_depth=10,
                min_samples_split=5,
                random_state=42,
                n_jobs=-1
            ),
            'gradient_boosting': GradientBoostingRegressor(
                n_estimators=200,
                learning_rate=0.05,
                max_depth=5,
                random_state=42
            )
        }

        best_model = None
        best_score = -np.inf
        best_metrics = {}

        # Start MLflow run
        with mlflow.start_run():
            for name, model in models.items():
                logger.info(f"Training {name} model")

                # Create pipeline
                pipeline = Pipeline(steps=[
                    ('preprocessor', self.preprocessor),
                    ('feature_selection', SelectKBest(score_func=f_regression, k=20)),
                    ('model', model)
                ])

                # Train model
                pipeline.fit(X_train, y_train)

                # Evaluate on test set
                y_pred = pipeline.predict(X_test)
                mae = mean_absolute_error(y_test, y_pred)
                mse = mean_squared_error(y_test, y_pred)
                rmse = np.sqrt(mse)
                r2 = r2_score(y_test, y_pred)

                # Log metrics to MLflow
                mlflow.log_metric(f"{name}_mae", mae)
                mlflow.log_metric(f"{name}_mse", mse)
                mlflow.log_metric(f"{name}_rmse", rmse)
                mlflow.log_metric(f"{name}_r2", r2)

                logger.info(f"{name} model metrics - MAE: {mae:.2f}, RMSE: {rmse:.2f}, R2: {r2:.2f}")

                # Track best model
                if r2 > best_score:
                    best_score = r2
                    best_model = pipeline
                    best_metrics = {
                        'model_name': name,
                        'mae': mae,
                        'mse': mse,
                        'rmse': rmse,
                        'r2': r2,
                        'features': self.feature_columns
                    }

            # Log best model
            if best_model:
                mlflow.sklearn.log_model(best_model, "model")
                mlflow.log_metrics(best_metrics)
                mlflow.set_tag("model_type", best_metrics['model_name'])

                # Save model and preprocessor
                dump(best_model, self.model_path)
                dump(self.preprocessor, self.preprocessor_path)

                logger.info(f"Best model: {best_metrics['model_name']} with R2: {best_metrics['r2']:.2f}")
                logger.info(f"Model saved to {self.model_path}")

        self.model = best_model
        return best_metrics

    def cross_validate_model(self, X: pd.DataFrame, y: pd.Series, n_splits: int = 5) -> Dict[str, Any]:
        """Perform time-series cross-validation"""
        logger.info(f"Starting time-series cross-validation with {n_splits} splits")

        tscv = TimeSeriesSplit(n_splits=n_splits)
        metrics = {
            'mae': [],
            'mse': [],
            'rmse': [],
            'r2': []
        }

        for train_index, test_index in tscv.split(X):
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y.iloc[train_index], y.iloc[test_index]

            # Create and train model
            model = Pipeline(steps=[
                ('preprocessor', self.preprocessor),
                ('feature_selection', SelectKBest(score_func=f_regression, k=20)),
                ('model', GradientBoostingRegressor(
                    n_estimators=200,
                    learning_rate=0.05,
                    max_depth=5,
                    random_state=42
                ))
            ])

            model.fit(X_train, y_train)

            # Evaluate
            y_pred = model.predict(X_test)
            metrics['mae'].append(mean_absolute_error(y_test, y_pred))
            metrics['mse'].append(mean_squared_error(y_test, y_pred))
            metrics['rmse'].append(np.sqrt(mean_squared_error(y_test, y_pred)))
            metrics['r2'].append(r2_score(y_test, y_pred))

        # Calculate average metrics
        avg_metrics = {
            'avg_mae': np.mean(metrics['mae']),
            'avg_mse': np.mean(metrics['mse']),
            'avg_rmse': np.mean(metrics['rmse']),
            'avg_r2': np.mean(metrics['r2']),
            'std_mae': np.std(metrics['mae']),
            'std_mse': np.std(metrics['mse']),
            'std_rmse': np.std(metrics['rmse']),
            'std_r2': np.std(metrics['r2'])
        }

        logger.info(f"Cross-validation results: {avg_metrics}")
        return avg_metrics

    def train(self, data_path: str) -> Dict[str, Any]:
        """Complete training pipeline"""
        start_time = datetime.now()

        # Load and preprocess data
        data = self.load_data(data_path)
        X, y = self.preprocess_data(data)

        # Cross-validate
        cv_metrics = self.cross_validate_model(X, y)

        # Train final model
        final_metrics = self.train_model(X, y)

        # Log to MLflow
        with mlflow.start_run():
            mlflow.log_metrics(cv_metrics)
            mlflow.log_metrics(final_metrics)
            mlflow.log_param("training_start_time", start_time.isoformat())
            mlflow.log_param("training_end_time", datetime.now().isoformat())
            mlflow.log_param("data_records", len(data))
            mlflow.log_param("features_count", len(self.feature_columns))

        logger.info(f"Training completed in {(datetime.now() - start_time).total_seconds():.2f} seconds")
        return {**cv_metrics, **final_metrics}

if __name__ == "__main__":
    predictor = TripExpensePredictor()
    results = predictor.train("data/trip_expenses.csv")
    print("Training results:", results)
```

### Real-Time Inference API (70 lines)

```python
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from joblib import load
import pandas as pd
import numpy as np
import logging
import os
from datetime import datetime
import mlflow
from mlflow.tracking import MlflowClient
import redis
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Trip Expense Prediction API")

class TripFeatures(BaseModel):
    user_id: str
    department: str
    destination: str
    purpose: str
    start_date: str
    end_date: str
    trip_type: str
    previous_trips_count: int
    avg_expense_last_3_trips: float
    travel_policy_compliance: bool
    season: str
    is_international: bool

class PredictionRequest(BaseModel):
    trips: List[TripFeatures]
    request_id: Optional[str] = None

class PredictionResponse(BaseModel):
    predictions: List[float]
    confidence_intervals: List[List[float]]
    model_version: str
    request_id: str
    timestamp: str
    warnings: List[str]

class ModelMonitor:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            db=int(os.getenv('REDIS_DB', 0))
        )
        self.mlflow_client = MlflowClient(
            tracking_uri=os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000')
        )
        self.current_model_version = None
        self.model_loaded_at = None
        self.load_model()

    def load_model(self):
        """Load the latest model from MLflow"""
        try:
            # Get the latest model version
            model_name = "trip_expense_predictor"
            latest_version = self.mlflow_client.get_latest_versions(model_name, stages=["Production"])

            if not latest_version:
                latest_version = self.mlflow_client.get_latest_versions(model_name)

            if not latest_version:
                raise ValueError("No model versions found")

            model_uri = f"models:/{model_name}/{latest_version[0].version}"
            model = mlflow.sklearn.load_model(model_uri)
            preprocessor = load("models/preprocessor.joblib")

            self.current_model = model
            self.preprocessor = preprocessor
            self.current_model_version = latest_version[0].version
            self.model_loaded_at = datetime.now()

            logger.info(f"Model loaded successfully. Version: {self.current_model_version}")

            # Store model info in Redis
            self.redis_client.set(
                "current_model_info",
                json.dumps({
                    "version": self.current_model_version,
                    "loaded_at": self.model_loaded_at.isoformat(),
                    "model_uri": model_uri
                })
            )

        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

    def preprocess_features(self, trips: List[TripFeatures]) -> pd.DataFrame:
        """Convert input features to DataFrame and preprocess"""
        try:
            # Convert to DataFrame
            data = pd.DataFrame([trip.dict() for trip in trips])

            # Feature engineering
            data['start_date'] = pd.to_datetime(data['start_date'])
            data['end_date'] = pd.to_datetime(data['end_date'])
            data['trip_duration'] = (data['end_date'] - data['start_date']).dt.days
            data['start_month'] = data['start_date'].dt.month
            data['start_day_of_week'] = data['start_date'].dt.dayofweek
            data['start_day_of_month'] = data['start_date'].dt.day
            data['is_weekend'] = data['start_day_of_week'].isin([5, 6]).astype(int)

            # Drop original date columns
            data = data.drop(columns=['start_date', 'end_date'])

            # Preprocess using the saved preprocessor
            processed_data = self.preprocessor.transform(data)

            return processed_data

        except Exception as e:
            logger.error(f"Error preprocessing features: {str(e)}")
            raise

    def predict(self, features: pd.DataFrame) -> dict:
        """Make predictions using the loaded model"""
        try:
            # Make prediction
            predictions = self.current_model.predict(features)

            # Calculate confidence intervals (simplified)
            # In a real scenario, you would use proper prediction intervals
            confidence_intervals = []
            for pred in predictions:
                lower = pred * 0.9  # 10% below
                upper = pred * 1.1  # 10% above
                confidence_intervals.append([lower, upper])

            return {
                "predictions": predictions.tolist(),
                "confidence_intervals": confidence_intervals
            }

        except Exception as e:
            logger.error(f"Error making predictions: {str(e)}")
            raise

    def log_prediction(self, request: PredictionRequest, response: PredictionResponse):
        """Log prediction details to Redis for monitoring"""
        try:
            prediction_log = {
                "request_id": response.request_id,
                "timestamp": response.timestamp,
                "model_version": response.model_version,
                "input_features": [trip.dict() for trip in request.trips],
                "predictions": response.predictions,
                "confidence_intervals": response.confidence_intervals,
                "warnings": response.warnings
            }

            # Store in Redis with TTL of 30 days
            self.redis_client.setex(
                f"prediction:{response.request_id}",
                2592000,  # 30 days in seconds
                json.dumps(prediction_log)
            )

            # Increment prediction count
            self.redis_client.incr("total_predictions")

        except Exception as e:
            logger.error(f"Error logging prediction: {str(e)}")

# Initialize model monitor
model_monitor = ModelMonitor()

@app.post("/predict", response_model=PredictionResponse)
async def predict_expenses(
    request: PredictionRequest,
    background_tasks: BackgroundTasks
):
    """Predict trip expenses for given trip features"""
    start_time = datetime.now()
    request_id = request.request_id or f"pred_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    logger.info(f"Received prediction request {request_id} for {len(request.trips)} trips")

    try:
        # Preprocess features
        features = model_monitor.preprocess_features(request.trips)

        # Make predictions
        predictions = model_monitor.predict(features)

        # Prepare response
        response = PredictionResponse(
            predictions=predictions["predictions"],
            confidence_intervals=predictions["confidence_intervals"],
            model_version=model_monitor.current_model_version,
            request_id=request_id,
            timestamp=datetime.now().isoformat(),
            warnings=[]
        )

        # Check for potential issues
        if len(request.trips) > 100:
            response.warnings.append("Large batch size may impact performance")

        # Log prediction in background
        background_tasks.add_task(
            model_monitor.log_prediction,
            request,
            response
        )

        logger.info(f"Completed prediction request {request_id} in {(datetime.now() - start_time).total_seconds():.2f}s")
        return response

    except Exception as e:
        logger.error(f"Error processing prediction request {request_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing prediction: {str(e)}"
        )

@app.get("/model-info")
async def get_model_info():
    """Get information about the current model"""
    try:
        model_info = json.loads(model_monitor.redis_client.get("current_model_info") or "{}")

        if not model_info:
            model_info = {
                "version": model_monitor.current_model_version,
                "loaded_at": model_monitor.model_loaded_at.isoformat() if model_monitor.model_loaded_at else None,
                "status": "loaded" if model_monitor.current_model else "not_loaded"
            }

        return {
            "model_info": model_info,
            "total_predictions": int(model_monitor.redis_client.get("total_predictions") or 0)
        }

    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting model info: {str(e)}"
        )

@app.post("/reload-model")
async def reload_model():
    """Force reload of the model"""
    try:
        model_monitor.load_model()
        return {
            "status": "success",
            "message": "Model reloaded successfully",
            "model_version": model_monitor.current_model_version
        }
    except Exception as e:
        logger.error(f"Error reloading model: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error reloading model: {str(e)}"
        )
```

### Feature Engineering Pipeline (70 lines)

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import logging
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
import holidays

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TripFeatureEngineer(BaseEstimator, TransformerMixin):
    def __init__(self, country: str = 'US'):
        self.country = country
        self.country_holidays = holidays.country_holidays(country)
        self.season_map = {
            1: 'winter', 2: 'winter', 3: 'spring',
            4: 'spring', 5: 'spring', 6: 'summer',
            7: 'summer', 8: 'summer', 9: 'fall',
            10: 'fall', 11: 'fall', 12: 'winter'
        }

    def fit(self, X, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Transform the input DataFrame with feature engineering"""
        X = X.copy()

        # Basic date features
        X = self._add_date_features(X)

        # Trip duration features
        X = self._add_duration_features(X)

        # User behavior features
        X = self._add_user_behavior_features(X)

        # Seasonal and holiday features
        X = self._add_seasonal_features(X)

        # Policy compliance features
        X = self._add_policy_features(X)

        # Destination features
        X = self._add_destination_features(X)

        # Clean up temporary columns
        X = self._cleanup_columns(X)

        return X

    def _add_date_features(self, X: pd.DataFrame) -> pd.DataFrame:
        """Add features derived from dates"""
        X['start_date'] = pd.to_datetime(X['start_date'])
        X['end_date'] = pd.to_datetime(X['end_date'])

        X['start_month'] = X['start_date'].dt.month
        X['start_day_of_week'] = X['start_date'].dt.dayofweek
        X['start_day_of_month'] = X['start_date'].dt.day
        X['start_week_of_year'] = X['start_date'].dt.isocalendar().week
        X['start_quarter'] = X['start_date'].dt.quarter

        X['end_month'] = X['end_date'].dt.month
        X['end_day_of_week'] = X['end_date'].dt.dayofweek
        X['end_day_of_month'] = X['end_date'].dt.day

        # Is weekend
        X['is_weekend_start'] = X['start_day_of_week'].isin([5, 6]).astype(int)
        X['is_weekend_end'] = X['end_day_of_week'].isin([5, 6]).astype(int)

        return X

    def _add_duration_features(self, X: pd.DataFrame) -> pd.DataFrame:
        """Add features related to trip duration"""
        X['trip_duration_days'] = (X['end_date'] - X['start_date']).dt.days
        X['trip_duration_hours'] = X['trip_duration_days'] * 24

        # Overnight trip
        X['is_overnight'] = (X['trip_duration_days'] >= 1).astype(int)

        # Long trip
        X['is_long_trip'] = (X['trip_duration_days'] > 3).astype(int)

        # Same day trip
        X['is_same_day'] = (X['trip_duration_days'] == 0).astype(int)

        return X

    def _add_user_behavior_features(self, X: pd.DataFrame) -> pd.DataFrame:
        """Add features related to user behavior patterns"""
        # Calculate average trip duration for user
        if 'user_id' in X.columns and 'trip_duration_days' in X.columns:
            user_avg_duration = X.groupby('user_id')['trip_duration_days'].transform('mean')
            X['user_avg_trip_duration'] = user_avg_duration
            X['duration_deviation'] = X['trip_duration_days'] - user_avg_duration

        # Calculate trip frequency
        if 'user_id' in X.columns and 'start_date' in X.columns:
            X['user_trip_count'] = X.groupby('user_id')['user_id'].transform('count')
            X['user_trips_per_month'] = X['user_trip_count'] / (
                (X['start_date'].max() - X['start_date'].min()).days / 30
            )

        return X

    def _add_seasonal_features(self, X: pd.DataFrame) -> pd.DataFrame:
        """Add seasonal and holiday features"""
        # Season
        X['season'] = X['start_month'].map(self.season_map)

        # Is holiday
        X['is_holiday'] = X['start_date'].apply(
            lambda x: x in self.country_holidays
        ).astype(int)

        # Days until next holiday
        X['days_until_next_holiday'] = X['start_date'].apply(
            lambda x: self._days_until_next_holiday(x)
        )

        # Days since last holiday
        X['days_since_last_holiday'] = X['start_date'].apply(
            lambda x: self._days_since_last_holiday(x)
        )

        return X

    def _days_until_next_holiday(self, date: datetime) -> int:
        """Calculate days until next holiday"""
        future_holidays = [h for h in self.country_holidays if h > date]
        if not future_holidays:
            return 365  # No holidays left this year
        return (min(future_holidays) - date).days

    def _days_since_last_holiday(self, date: datetime) -> int:
        """Calculate days since last holiday"""
        past_holidays = [h for h in self.country_holidays if h < date]
        if not past_holidays:
            return 365  # No holidays this year yet
        return (date - max(past_holidays)).days

    def _add_policy_features(self, X: pd.DataFrame) -> pd.DataFrame:
        """Add features related to travel policy compliance"""
        if 'travel_policy_compliance' in X.columns:
            X['is_policy_compliant'] = X['travel_policy_compliance'].astype(int)

        if 'max_allowed_expense' in X.columns and 'estimated_expense' in X.columns:
            X['expense_ratio'] = X['estimated_expense'] / X['max_allowed_expense']
            X['is_over_budget'] = (X['expense_ratio'] > 1).astype(int)

        return X

    def _add_destination_features(self, X: pd.DataFrame) -> pd.DataFrame:
        """Add features related to destination"""
        if 'destination' in X.columns:
            # Destination type (simplified)
            X['is_domestic'] = X['destination'].apply(
                lambda x: 1 if x == 'Domestic' else 0
            )

            # Destination category (would be more sophisticated in production)
            X['destination_category'] = X['destination'].apply(
                lambda x: self._categorize_destination(x)
            )

        return X

    def _categorize_destination(self, destination: str) -> str:
        """Simple destination categorization"""
        domestic_cities = ['New York', 'Chicago', 'Los Angeles', 'San Francisco']
        international_cities = ['London', 'Paris', 'Tokyo', 'Sydney']

        if destination in domestic_cities:
            return 'domestic_major'
        elif destination in international_cities:
            return 'international_major'
        elif destination == 'Domestic':
            return 'domestic_other'
        else:
            return 'international_other'

    def _cleanup_columns(self, X: pd.DataFrame) -> pd.DataFrame:
        """Remove temporary columns and clean up DataFrame"""
        # List of columns to keep
        keep_columns = [
            col for col in X.columns
            if not col.startswith('_') and
            col not in ['start_date', 'end_date'] and
            not col.endswith('_temp')
        ]

        return X[keep_columns]

def create_feature_engineering_pipeline() -> Pipeline:
    """Create a complete feature engineering pipeline"""
    return Pipeline([
        ('feature_engineer', TripFeatureEngineer(country='US'))
    ])

# Example usage
if __name__ == "__main__":
    # Sample data
    data = pd.DataFrame({
        'user_id': ['user1', 'user2', 'user1', 'user3'],
        'department': ['Sales', 'Engineering', 'Sales', 'Marketing'],
        'destination': ['New York', 'London', 'Chicago', 'Domestic'],
        'purpose': ['Client Meeting', 'Conference', 'Training', 'Team Offsite'],
        'start_date': ['2023-01-15', '2023-06-20', '2023-03-10', '2023-12-25'],
        'end_date': ['2023-01-17', '2023-06-25', '2023-03-10', '2023-12-28'],
        'trip_type': ['Business', 'Business', 'Business', 'Business'],
        'previous_trips_count': [5, 2, 4, 10],
        'avg_expense_last_3_trips': [1200.50, 2500.00, 800.25, 1500.75],
        'travel_policy_compliance': [True, False, True, True],
        'max_allowed_expense': [1500, 3000, 1000, 2000],
        'estimated_expense': [1300, 3200, 900, 1800]
    })

    # Create and apply pipeline
    pipeline = create_feature_engineering_pipeline()
    transformed_data = pipeline.fit_transform(data)

    print("Transformed data:")
    print(transformed_data.head())
    print("\nColumns:")
    print(transformed_data.columns.tolist())
```

### Model Monitoring and Retraining (60 lines)

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import mlflow
from mlflow.tracking import MlflowClient
import logging
import os
import json
import redis
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict, Any, Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelMonitor:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            db=int(os.getenv('REDIS_DB', 0))
        )
        self.mlflow_client = MlflowClient(
            tracking_uri=os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000')
        )
        self.model_name = "trip_expense_predictor"
        self.data_window_days = 30
        self.performance_threshold = 0.8  # Minimum R2 score
        self.drift_threshold = 0.15  # Maximum allowed feature drift
        self.scheduler = BackgroundScheduler()
        self.initialize_scheduler()

    def initialize_scheduler(self):
        """Initialize the background scheduler for monitoring tasks"""
        # Schedule daily monitoring
        self.scheduler.add_job(
            self.daily_monitoring,
            CronTrigger(hour=2, minute=30)  # Run at 2:30 AM daily
        )

        # Schedule weekly model evaluation
        self.scheduler.add_job(
            self.weekly_model_evaluation,
            CronTrigger(day_of_week='sun', hour=3, minute=0)  # Run Sunday at 3 AM
        )

        # Schedule monthly model retraining
        self.scheduler.add_job(
            self.monthly_model_retraining,
            CronTrigger(day=1, hour=4, minute=0)  # Run on the 1st at 4 AM
        )

        self.scheduler.start()
        logger.info("Model monitoring scheduler initialized")

    def daily_monitoring(self):
        """Run daily monitoring checks"""
        logger.info("Starting daily model monitoring")

        try:
            # Check prediction drift
            drift_detected = self.check_prediction_drift()

            # Check feature drift
            feature_drift = self.check_feature_drift()

            # Log monitoring results
            self.log_monitoring_results({
                "timestamp": datetime.now().isoformat(),
                "type": "daily",
                "prediction_drift": drift_detected,
                "feature_drift": feature_drift,
                "model_version": self.get_current_model_version()
            })

            # Alert if drift detected
            if drift_detected or any(d > self.drift_threshold for d in feature_drift.values()):
                self.alert_team("Model drift detected")

            logger.info("Daily model monitoring completed")

        except Exception as e:
            logger.error(f"Error in daily monitoring: {str(e)}")
            self.alert_team(f"Model monitoring failed: {str(e)}")

    def weekly_model_evaluation(self):
        """Run weekly model performance evaluation"""
        logger.info("Starting weekly model evaluation")

        try:
            # Get recent predictions
            recent_predictions = self.get_recent_predictions()

            if len(recent_predictions) < 100:
                logger.warning("Not enough recent predictions for evaluation")
                return

            # Calculate performance metrics
            metrics = self.calculate_performance_metrics(recent_predictions)

            # Log metrics
            self.log_performance_metrics(metrics)

            # Check if performance has degraded
            if metrics['r2'] < self.performance_threshold:
                logger.warning(f"Model performance below threshold (R2: {metrics['r2']:.2f})")
                self.alert_team(f"Model performance degraded (R2: {metrics['r2']:.2f})")

            logger.info("Weekly model evaluation completed")

        except Exception as e:
            logger.error(f"Error in weekly model evaluation: {str(e)}")
            self.alert_team(f"Model evaluation failed: {str(e)}")

    def monthly_model_retraining(self):
        """Run monthly model retraining if needed"""
        logger.info("Starting monthly model retraining check")

        try:
            # Get current model performance
            current_metrics = self.get_latest_performance_metrics()

            # Get new training data
            new_data = self.get_new_training_data()

            if len(new_data) < 1000:
                logger.warning("Not enough new data for retraining")
                return

            # Train new model
            new_model_metrics = self.train_new_model(new_data)

            # Compare performance
            if new_model_metrics['r2'] > current_metrics['r2'] + 0.05:  # 5% improvement
                logger.info("New model performs better, promoting to production")
                self.promote_new_model(new_model_metrics['run_id'])
                self.alert_team("New model promoted to production")
            else:
                logger.info("Current model still performs better, no promotion needed")

            logger.info("Monthly model retraining check completed")

        except Exception as e:
            logger.error(f"Error in monthly model retraining: {str(e)}")
            self.alert_team(f"Model retraining failed: {str(e)}")

    def check_prediction_drift(self) -> bool:
        """Check for prediction drift by comparing recent predictions to historical"""
        try:
            # Get recent predictions (last 7 days)
            recent_predictions = self.get_recent_predictions(days=7)

            if len(recent_predictions) < 50:
                logger.warning("Not enough recent predictions for drift detection")
                return False

            # Get historical predictions (previous 30 days)
            historical_predictions = self.get_recent_predictions(days=30, exclude_last_days=7)

            if len(historical_predictions) < 200:
                logger.warning("Not enough historical predictions for drift detection")
                return False

            # Calculate distribution statistics
            recent_mean = np.mean([p['prediction'] for p in recent_predictions])
            historical_mean = np.mean([p['prediction'] for p in historical_predictions])

            recent_std = np.std([p['prediction'] for p in recent_predictions])
            historical_std = np.std([p['prediction'] for p in historical_predictions])

            # Calculate drift
            mean_drift = abs(recent_mean - historical_mean) / (historical_std + 1e-6)
            std_drift = abs(recent_std - historical_std) / (historical_std + 1e-6)

            logger.info(f"Prediction drift - Mean: {mean_drift:.2f}, Std: {std_drift:.2f}")

            # Return True if significant drift detected
            return mean_drift > 0.5 or std_drift > 0.3

        except Exception as e:
            logger.error(f"Error checking prediction drift: {str(e)}")
            return False

    def check_feature_drift(self) -> Dict[str, float]:
        """Check for feature drift by comparing recent data to training data"""
        try:
            # Get recent features (last 7 days)
            recent_features = self.get_recent_features(days=7)

            if len(recent_features) < 50:
                logger.warning("Not enough recent features for drift detection")
                return {}

            # Get training data features
            training_features = self.get_training_features()

            if len(training_features) < 1000:
                logger.warning("Not enough training features for drift detection")
                return {}

            # Calculate drift for each feature
            drift_results = {}

            for feature in recent_features.columns:
                if feature in training_features.columns:
                    # For numeric features
                    if pd.api.types.is_numeric_dtype(recent_features[feature]):
                        recent_mean = recent_features[feature].mean()
                        training_mean = training_features[feature].mean()
                        recent_std = recent_features[feature].std()
                        training_std = training_features[feature].std()

                        mean_drift = abs(recent_mean - training_mean) / (training_std + 1e-6)
                        drift_results[feature] = mean_drift

                    # For categorical features
                    elif pd.api.types.is_categorical_dtype(recent_features[feature]) or \
                         pd.api.types.is_object_dtype(recent_features[feature]):
                        # Calculate distribution difference using KL divergence
                        recent_dist = recent_features[feature].value_counts(normalize=True)
                        training_dist = training_features[feature].value_counts(normalize=True)

                        # Combine distributions to handle missing categories
                        all_categories = set(recent_dist.index).union(set(training_dist.index))
                        recent_dist = recent_dist.reindex(all_categories, fill_value=0)
                        training_dist = training_dist.reindex(all_categories, fill_value=0)

                        # Add small value to avoid division by zero
                        recent_dist += 1e-6
                        training_dist += 1e-6

                        # Normalize
                        recent_dist = recent_dist / recent_dist.sum()
                        training_dist = training_dist / training_dist.sum()

                        # Calculate KL divergence
                        kl_div = np.sum(training_dist * np.log(training_dist / recent_dist))
                        drift_results[feature] = kl_div

            logger.info(f"Feature drift detected: {drift_results}")
            return drift_results

        except Exception as e:
            logger.error(f"Error checking feature drift: {str(e)}")
            return {}

    def calculate_performance_metrics(self, predictions: List[Dict]) -> Dict[str, float]:
        """Calculate performance metrics for the model"""
        try:
            # Extract actual and predicted values
            y_true = [p['actual'] for p in predictions if 'actual' in p]
            y_pred = [p['prediction'] for p in predictions if 'actual' in p]

            if len(y_true) < 50:
                logger.warning("Not enough data points for performance calculation")
                return {
                    'mae': 0,
                    'mse': 0,
                    'rmse': 0,
                    'r2': 0,
                    'count': len(y_true)
                }

            # Calculate metrics
            mae = mean_absolute_error(y_true, y_pred)
            mse = mean_squared_error(y_true, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_true, y_pred)

            return {
                'mae': mae,
                'mse': mse,
                'rmse': rmse,
                'r2': r2,
                'count': len(y_true)
            }

        except Exception as e:
            logger.error(f"Error calculating performance metrics: {str(e)}")
            return {
                'mae': 0,
                'mse': 0,
                'rmse': 0,
                'r2': 0,
                'count': 0
            }

    def train_new_model(self, new_data: pd.DataFrame) -> Dict[str, Any]:
        """Train a new model with the provided data"""
        try:
            # Log new training run
            with mlflow.start_run():
                # Feature engineering
                from feature_engineering import create_feature_engineering_pipeline
                pipeline = create_feature_engineering_pipeline()
                processed_data = pipeline.fit_transform(new_data)

                # Split data
                X = processed_data.drop(columns=['total_expense'])
                y = processed_data['total_expense']
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42
                )

                # Train model
                from sklearn.ensemble import GradientBoostingRegressor
                model = GradientBoostingRegressor(
                    n_estimators=200,
                    learning_rate=0.05,
                    max_depth=5,
                    random_state=42
                )
                model.fit(X_train, y_train)

                # Evaluate
                y_pred = model.predict(X_test)
                metrics = {
                    'mae': mean_absolute_error(y_test, y_pred),
                    'mse': mean_squared_error(y_test, y_pred),
                    'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
                    'r2': r2_score(y_test, y_pred)
                }

                # Log metrics and model
                mlflow.log_metrics(metrics)
                mlflow.sklearn.log_model(model, "model")

                # Get run ID
                run_id = mlflow.active_run().info.run_id

                logger.info(f"New model trained with R2: {metrics['r2']:.2f}")
                return {
                    **metrics,
                    'run_id': run_id,
                    'training_samples': len(new_data)
                }

        except Exception as e:
            logger.error(f"Error training new model: {str(e)}")
            raise

    def promote_new_model(self, run_id: str):
        """Promote a new model to production"""
        try:
            # Get the current production model
            current_prod = self.mlflow_client.get_latest_versions(
                self.model_name, stages=["Production"]
            )

            # Transition current production to Archived
            if current_prod:
                self.mlflow_client.transition_model_version_stage(
                    name=self.model_name,
                    version=current_prod[0].version,
                    stage="Archived"
                )

            # Transition new model to Production
            self.mlflow_client.transition_model_version_stage(
                name=self.model_name,
                version=self.get_model_version_from_run(run_id),
                stage="Production"
            )

            # Update Redis with new model info
            self.redis_client.set(
                "current_model_info",
                json.dumps({
                    "version": self.get_model_version_from_run(run_id),
                    "promoted_at": datetime.now().isoformat(),
                    "run_id": run_id
                })
            )

            logger.info(f"Model {run_id} promoted to production")

        except Exception as e:
            logger.error(f"Error promoting new model: {str(e)}")
            raise

    def get_model_version_from_run(self, run_id: str) -> str:
        """Get model version from MLflow run ID"""
        try:
            run = self.mlflow_client.get_run(run_id)
            return run.info.run_id  # In MLflow, run_id is used as version
        except Exception as e:
            logger.error(f"Error getting model version from run: {str(e)}")
            raise

    def get_current_model_version(self) -> Optional[str]:
        """Get the current production model version"""
        try:
            prod_model = self.mlflow_client.get_latest_versions(
                self.model_name, stages=["Production"]
            )
            return prod_model[0].version if prod_model else None
        except Exception as e:
            logger.error(f"Error getting current model version: {str(e)}")
            return None

    def get_recent_predictions(self, days: int = 7, exclude_last_days: int = 0) -> List[Dict]:
        """Get recent predictions from Redis"""
        try:
            end_date = datetime.now() - timedelta(days=exclude_last_days)
            start_date = end_date - timedelta(days=days)

            # Get all prediction keys
            keys = self.redis_client.keys("prediction:*")
            predictions = []

            for key in keys:
                prediction = json.loads(self.redis_client.get(key))
                pred_time = datetime.fromisoformat(prediction['timestamp'])

                if start_date <= pred_time <= end_date:
                    predictions.append(prediction)

            return predictions

        except Exception as e:
            logger.error(f"Error getting recent predictions: {str(e)}")
            return []

    def get_recent_features(self, days: int = 7) -> pd.DataFrame:
        """Get recent features from predictions"""
        try:
            predictions = self.get_recent_predictions(days=days)
            if not predictions:
                return pd.DataFrame()

            # Extract features from predictions
            features_list = []
            for pred in predictions:
                if 'input_features' in pred and len(pred['input_features']) > 0:
                    features_list.append(pred['input_features'][0])

            return pd.DataFrame(features_list)

        except Exception as e:
            logger.error(f"Error getting recent features: {str(e)}")
            return pd.DataFrame()

    def get_training_features(self) -> pd.DataFrame:
        """Get features from the original training data"""
        try:
            # In a real implementation, this would load from a database or file
            # For this example, we'll return an empty DataFrame
            return pd.DataFrame()
        except Exception as e:
            logger.error(f"Error getting training features: {str(e)}")
            return pd.DataFrame()

    def get_new_training_data(self) -> pd.DataFrame:
        """Get new training data from the last N days"""
        try:
            # In a real implementation, this would query the database
            # For this example, we'll return an empty DataFrame
            end_date = datetime.now()
            start_date = end_date - timedelta(days=self.data_window_days)

            logger.info(f"Getting new training data from {start_date} to {end_date}")
            return pd.DataFrame()

        except Exception as e:
            logger.error(f"Error getting new training data: {str(e)}")
            return pd.DataFrame()

    def get_latest_performance_metrics(self) -> Dict[str, float]:
        """Get the latest performance metrics from Redis"""
        try:
            metrics = self.redis_client.get("latest_performance_metrics")
            return json.loads(metrics) if metrics else {
                'mae': 0,
                'mse': 0,
                'rmse': 0,
                'r2': 0,
                'count': 0
            }
        except Exception as e:
            logger.error(f"Error getting latest performance metrics: {str(e)}")
            return {
                'mae': 0,
                'mse': 0,
                'rmse': 0,
                'r2': 0,
                'count': 0
            }

    def log_performance_metrics(self, metrics: Dict[str, float]):
        """Log performance metrics to Redis"""
        try:
            self.redis_client.setex(
                "latest_performance_metrics",
                2592000,  # 30 days
                json.dumps(metrics)
            )
            logger.info(f"Performance metrics logged: {metrics}")
        except Exception as e:
            logger.error(f"Error logging performance metrics: {str(e)}")

    def log_monitoring_results(self, results: Dict[str, Any]):
        """Log monitoring results to Redis"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d")
            self.redis_client.lpush(
                "monitoring_results",
                json.dumps(results)
            )
            self.redis_client.ltrim("monitoring_results", 0, 99)  # Keep last 100 results
            logger.info("Monitoring results logged")
        except Exception as e:
            logger.error(f"Error logging monitoring results: {str(e)}")

    def alert_team(self, message: str):
        """Send alert to the team (placeholder for actual implementation)"""
        logger.warning(f"ALERT: {message}")
        # In a real implementation, this would send an email, Slack message, etc.

    def shutdown(self):
        """Clean up resources"""
        self.scheduler.shutdown()
        logger.info("Model monitor shutdown complete")

# Example usage
if __name__ == "__main__":
    monitor = ModelMonitor()

    try:
        # Run initial checks
        monitor.daily_monitoring()
        monitor.weekly_model_evaluation()

        # Keep running
        while True:
            pass

    except KeyboardInterrupt:
        monitor.shutdown()
```

## Progressive Web App (PWA) Features (250+ lines)

### Service Worker Registration (50 lines)

```typescript
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

class ServiceWorkerManager {
    private logger: Logger;
    private registration: ServiceWorkerRegistration | null = null;
    private isSupported: boolean;
    private readonly SERVICE_WORKER_URL = '/sw.js';
    private readonly SCOPE = '/';
    private readonly UPDATE_CHECK_INTERVAL = 3600000; // 1 hour
    private updateCheckInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.logger = new Logger('ServiceWorkerManager');
        this.isSupported = 'serviceWorker' in navigator;
        this.initialize();
    }

    private initialize(): void {
        if (!this.isSupported) {
            this.logger.warn('Service workers are not supported in this browser');
            return;
        }

        this.logger.info('Initializing service worker manager');

        // Register service worker
        this.registerServiceWorker();

        // Check for updates periodically
        this.startUpdateCheck();

        // Listen for controller changes (new service worker taking control)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            this.logger.info('Service worker controller changed');
            window.location.reload();
        });
    }

    private async registerServiceWorker(): Promise<void> {
        const startTime = performance.now();

        try {
            this.registration = await navigator.serviceWorker.register(
                this.SERVICE_WORKER_URL,
                {
                    scope: this.SCOPE,
                    type: 'module',
                    updateViaCache: 'none'
                }
            );

            this.logger.info('Service worker registered successfully', {
                scope: this.registration.scope,
                installing: this.registration.installing !== null,
                waiting: this.registration.waiting !== null,
                active: this.registration.active !== null,
                duration: performance.now() - startTime
            });

            // Handle service worker states
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration?.installing;

                if (newWorker) {
                    this.logger.info('New service worker found, installing...');

                    newWorker.addEventListener('statechange', () => {
                        this.logger.debug('Service worker state changed', {
                            state: newWorker.state
                        });

                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // New update available
                                this.logger.info('New service worker installed, waiting to activate');
                                this.showUpdateNotification();
                            } else {
                                // First install
                                this.logger.info('Service worker installed for the first time');
                                this.showFirstInstallNotification();
                            }
                        }
                    });
                }
            });

            // Check if service worker is already waiting
            if (this.registration.waiting) {
                this.logger.info('Service worker already waiting to activate');
                this.showUpdateNotification();
            }

        } catch (error) {
            this.logger.error('Error registering service worker', {
                error,
                duration: performance.now() - startTime
            });
        }
    }

    private startUpdateCheck(): void {
        if (!this.isSupported) return;

        this.updateCheckInterval = setInterval(async () => {
            try {
                if (!this.registration) {
                    this.logger.warn('No service worker registration available for update check');
                    return;
                }

                this.logger.debug('Checking for service worker updates...');
                const startTime = performance.now();
                const updateFound = await this.registration.update();

                if (updateFound) {
                    this.logger.info('Service worker update found', {
                        duration: performance.now() - startTime
                    });
                } else {
                    this.logger.debug('No service worker updates found', {
                        duration: performance.now() - startTime
                    });
                }
            } catch (error) {
                this.logger.error('Error checking for service worker updates', { error });
            }
        }, this.UPDATE_CHECK_INTERVAL);
    }

    private showUpdateNotification(): void {
        this.logger.info('Showing update available notification');

        // In a real app, this would show a UI notification
        if (window.confirm('A new version of the app is available. Reload now?')) {
            this.skipWaitingAndReload();
        }
    }

    private showFirstInstallNotification(): void {
        this.logger.info('Showing first install notification');

        // In a real app, this would show a welcome notification
        console.log('App is ready for offline use!');
    }

    public async skipWaitingAndReload(): Promise<void> {
        if (!this.registration?.waiting) {
            this.logger.warn('No waiting service worker to skip');
            return;
        }

        try {
            this.logger.info('Sending skipWaiting message to service worker');
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

            // Wait for the new service worker to take control
            await new Promise<void>((resolve) => {
                const checkController = () => {
                    if (navigator.serviceWorker.controller?.state === 'activated') {
                        resolve();
                    } else {
                        setTimeout(checkController, 100);
                    }
                };
                checkController();
            });

            this.logger.info('Service worker activated, reloading page');
            window.location.reload();
        } catch (error) {
            this.logger.error('Error skipping waiting and reloading', { error });
        }
    }

    public async unregister(): Promise<void> {
        if (!this.isSupported || !this.registration) return;

        try {
            const success = await this.registration.unregister();
            this.logger.info('Service worker unregistered', { success });

            if (this.updateCheckInterval) {
                clearInterval(this.updateCheckInterval);
                this.updateCheckInterval = null;
            }

            this.registration = null;
        } catch (error) {
            this.logger.error('Error unregistering service worker', { error });
        }
    }

    public getRegistration(): ServiceWorkerRegistration | null {
        return this.registration;
    }

    public getServiceWorkerState(): {
        isSupported: boolean;
        isRegistered: boolean;
        isInstalling: boolean;
        isWaiting: boolean;
        isActive: boolean;
        registrationScope: string | null;
    } {
        if (!this.isSupported) {
            return {
                isSupported: false,
                isRegistered: false,
                isInstalling: false,
                isWaiting: false,
                isActive: false,
                registrationScope: null
            };
        }

        return {
            isSupported: true,
            isRegistered: this.registration !== null,
            isInstalling: this.registration?.installing !== null,
            isWaiting: this.registration?.waiting !== null,
            isActive: this.registration?.active !== null,
            registrationScope: this.registration?.scope || null
        };
    }
}

export const serviceWorkerManager = new ServiceWorkerManager();
```

### Caching Strategies (70 lines)

```typescript
import { Logger } from '../utils/logger';
import { performance } from 'perf_hooks';

type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'cache-only' | 'network-only';

interface CacheOptions {
    strategy?: CacheStrategy;
    cacheName?: string;
    maxEntries?: number;
    maxAgeSeconds?: number;
    networkTimeoutSeconds?: number;
}

class CacheManager {
    private logger: Logger;
    private defaultCacheName: string;
    private defaultStrategy: CacheStrategy;
    private defaultMaxEntries: number;
    private defaultMaxAgeSeconds: number;
    private defaultNetworkTimeoutSeconds: number;

    constructor() {
        this.logger = new Logger('CacheManager');
        this.defaultCacheName = 'trip-logs-cache';
        this.defaultStrategy = 'stale-while-revalidate';
        this.defaultMaxEntries = 100;
        this.defaultMaxAgeSeconds = 86400; // 24 hours
        this.defaultNetworkTimeoutSeconds = 5;

        this.initializeDefaultCache();
    }

    private async initializeDefaultCache(): Promise<void> {
        try {
            const cacheNames = await caches.keys();
            if (!cacheNames.includes(this.defaultCacheName)) {
                await caches.open(this.defaultCacheName);
                this.logger.info('Default cache initialized', { cacheName: this.defaultCacheName });
            }
        } catch (error) {
            this.logger.error('Error initializing default cache', { error });
        }
    }

    public async addToCache(request: Request | string, response: Response, options?: CacheOptions): Promise<void> {
        const startTime = performance.now();
        const cacheName = options?.cacheName || this.defaultCacheName;

        try {
            const cache = await caches.open(cacheName);
            await cache.put(this.normalizeRequest(request), response.clone());

            this.logger.debug('Added to cache', {
                request: typeof request === 'string' ? request : request.url,
                cacheName,
                duration: performance.now() - startTime
            });

            // Enforce max entries
            if (options?.maxEntries) {
                await this.enforceMaxEntries(cacheName, options.maxEntries);
            }
        } catch (error) {
            this.logger.error('Error adding to cache', {
                request: typeof request === 'string' ? request : request.url,
                error,
                duration: performance.now() - startTime
            });
        }
    }

    public async match(request: Request | string, options?: CacheOptions): Promise<Response | undefined> {
        const startTime = performance.now();
        const cacheName = options?.cacheName || this.defaultCacheName;
        const strategy = options?.strategy || this.defaultStrategy;

        try {
            const cache = await caches.open(cacheName);
            const normalizedRequest = this.normalizeRequest(request);
            let response: Response | undefined;

            switch (strategy) {
                case 'cache-first':
                    response = await this.cacheFirst(cache, normalizedRequest, options);
                    break;
                case 'network-first':
                    response = await this.networkFirst(cache, normalizedRequest, options);
                    break;
                case 'stale-while-revalidate':
                    response = await this.staleWhileRevalidate(cache, normalizedRequest, options);
                    break;
                case 'cache-only':
                    response = await cache.match(normalizedRequest);
                    break;
                case 'network-only':
                    response = await this.fetchFromNetwork(normalizedRequest, options);
                    break;
                default:
                    response = await this.staleWhileRevalidate(cache, normalizedRequest, options);
            }

            this.logger.debug('Cache match completed', {
                request: typeof request === 'string' ? request : request.url,
                strategy,
                cacheName,
                found: response !== undefined,
                duration: performance.now() - startTime
            });

            return response;
        } catch (error) {
            this.logger.error('Error matching cache', {
                request: typeof request === 'string' ? request : request.url,
                error,
                duration: performance.now() - startTime
            });
            return undefined;
        }
    }

    private async cacheFirst(cache: Cache, request: Request, options?: CacheOptions): Promise<Response | undefined> {
        // Try cache first
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            if (this.isResponseFresh(cachedResponse, options?.maxAgeSeconds)) {
                return cachedResponse;
            } else {
                // Remove stale response
                await cache.delete(request);
            }
        }

        // Fall back to network
        try {
            const networkResponse = await this.fetchFromNetwork(request, options);
            if (networkResponse) {
                await cache.put(request, networkResponse.clone());
                return networkResponse;
            }
        } catch (error) {
            this.logger.warn('Network request failed in cache-first strategy', {
                request: request.url,
                error
            });
        }

        return undefined;
    }

    private async networkFirst(cache: Cache, request: Request, options?: CacheOptions): Promise<Response | undefined> {
        try {
            const networkResponse = await this.fetchFromNetwork(request, options);
            if (networkResponse) {
                await cache.put(request, networkResponse.clone());
                return networkResponse;
            }
        } catch (error) {
            this.logger.warn('Network request failed in network-first strategy', {
                request: request.url,
                error
            });
        }

        // Fall back to cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        return undefined;
    }

    private async staleWhileRevalidate(cache: Cache, request: Request, options?: CacheOptions): Promise<Response | undefined> {
        // Try cache first
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            // Return cached response immediately
            const responseToReturn = cachedResponse.clone();

            // Update cache in background if stale
            if (!this.isResponseFresh(cachedResponse, options?.maxAgeSeconds)) {
                this.updateCacheInBackground(request, cache, options);
            }

            return response