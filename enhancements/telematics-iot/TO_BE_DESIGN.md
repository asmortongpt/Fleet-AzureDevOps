# TO_BE_DESIGN.md - Telematics-IoT Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Author:** Telematics Architecture Team

---

## Table of Contents
1. [Executive Vision](#executive-vision)
2. [Performance Enhancements](#performance-enhancements)
3. [Real-Time Features](#real-time-features)
4. [AI/ML Capabilities](#aiml-capabilities)
5. [Progressive Web App (PWA) Features](#progressive-web-app-pwa-features)
6. [WCAG 2.1 AAA Accessibility](#wcag-21-aaa-accessibility)
7. [Advanced Search and Filtering](#advanced-search-and-filtering)
8. [Third-Party Integrations](#third-party-integrations)
9. [Gamification System](#gamification-system)
10. [Analytics Dashboards](#analytics-dashboards)
11. [Security Hardening](#security-hardening)
12. [Comprehensive Testing](#comprehensive-testing)
13. [Kubernetes Deployment](#kubernetes-deployment)
14. [Database Migration Strategy](#database-migration-strategy)
15. [Key Performance Indicators](#key-performance-indicators)
16. [Risk Mitigation](#risk-mitigation)

---

## Executive Vision
*(100+ lines)*

### 1.1 Strategic Vision for Telematics-IoT 2.0
The next-generation Telematics-IoT platform represents a paradigm shift from traditional vehicle tracking to an **AI-driven, real-time mobility intelligence ecosystem**. Our vision is to transform raw telemetry data into **actionable insights** that drive **operational efficiency, predictive maintenance, and autonomous decision-making** across industries.

Key transformation goals:
1. **From Reactive to Predictive**: Shift from historical reporting to real-time predictive analytics with 95% accuracy in failure prediction
2. **From Siloed to Integrated**: Unify telematics with enterprise systems (ERP, CRM, Supply Chain) via API-first architecture
3. **From Generic to Personalized**: Deliver hyper-personalized experiences through AI-driven recommendations
4. **From Static to Adaptive**: Implement self-optimizing algorithms that improve with usage patterns

### 1.2 Business Transformation Goals
| Goal | Current State | Target State | KPI | Timeline |
|------|---------------|--------------|-----|----------|
| Fleet Utilization | 65% average utilization | 90% utilization | % increase in asset utilization | Q3 2024 |
| Maintenance Costs | $1.2M/year (corrective) | $400K/year (predictive) | $ reduction in maintenance costs | Q4 2024 |
| Customer Retention | 78% annual retention | 95% annual retention | % retention rate | Q2 2025 |
| Data Processing | 15-min batch processing | Real-time (<100ms) | Latency reduction | Q1 2024 |
| API Adoption | 200 monthly API calls | 10,000 monthly API calls | API call volume | Q3 2024 |

### 1.3 User Experience Improvements
**1.3.1 Real-Time Command Center**
- **Live Vehicle Tracking**: 3D visualization with 1-second refresh rates
- **Predictive Alerts**: AI-generated warnings with 90%+ accuracy
- **Voice-Activated Controls**: Natural language processing for fleet commands

**1.3.2 Driver Experience**
- **In-Cab AI Assistant**: Real-time coaching with voice feedback
- **Gamified Performance**: Personalized scorecards with social features
- **Fatigue Monitoring**: Computer vision-based driver alertness detection

**1.3.3 Administrator Experience**
- **Drag-and-Drop Rule Builder**: No-code policy configuration
- **Automated Reporting**: AI-generated executive summaries
- **Collaborative Workspaces**: Team-based incident resolution

### 1.4 Competitive Advantages
**1.4.1 Differentiation Matrix**
| Feature | Competitor A | Competitor B | Telematics-IoT 2.0 |
|---------|-------------|-------------|---------------------|
| Real-Time Processing | 5-min latency | 30-sec latency | <100ms latency |
| Predictive Analytics | Basic trends | Limited ML | Full AI/ML suite |
| Integration Ecosystem | 5 APIs | 12 APIs | 50+ APIs with SDKs |
| Offline Capabilities | None | Partial | Full PWA with sync |
| Accessibility | WCAG 2.0 AA | WCAG 2.1 AA | WCAG 2.1 AAA |
| Gamification | None | Basic points | Full achievement system |

**1.4.2 First-Mover Advantages**
1. **Autonomous Fleet Optimization**: First platform with self-adjusting routing algorithms
2. **Carbon Footprint Tracking**: Real-time emissions monitoring with offset recommendations
3. **Blockchain Verification**: Immutable records for regulatory compliance
4. **AR Maintenance Guides**: Augmented reality for field technicians

### 1.5 Long-Term Roadmap (2024-2027)
**Phase 1: Foundation (Q1-Q2 2024)**
- Core performance optimizations
- Real-time WebSocket infrastructure
- Basic AI/ML integration
- PWA implementation

**Phase 2: Intelligence (Q3-Q4 2024)**
- Advanced predictive models
- Autonomous alert resolution
- Enterprise integrations
- Gamification system

**Phase 3: Autonomy (2025)**
- Self-healing fleets
- Autonomous dispatching
- Predictive supply chain
- Carbon-neutral operations

**Phase 4: Ecosystem (2026-2027)**
- Developer marketplace
- Open telemetry standards
- Industry-specific solutions
- Global regulatory compliance

### 1.6 Financial Projections
**1.6.1 Revenue Growth**
```
2023: $18M (baseline)
2024: $32M (+78%)
2025: $58M (+81%)
2026: $95M (+64%)
2027: $140M (+47%)
```

**1.6.2 Cost Savings**
| Category | Current Annual Cost | Projected Annual Cost | Savings |
|----------|---------------------|-----------------------|---------|
| Cloud Infrastructure | $2.4M | $1.8M | $600K |
| Maintenance | $1.2M | $400K | $800K |
| Customer Support | $950K | $650K | $300K |
| Development | $3.2M | $2.8M | $400K |

### 1.7 Stakeholder Impact Analysis
**1.7.1 Fleet Operators**
- **Benefits**: 40% reduction in idle time, 30% fuel savings, 25% fewer accidents
- **Challenges**: Training on new interfaces, initial setup complexity

**1.7.2 Drivers**
- **Benefits**: Safer working conditions, performance-based bonuses, reduced paperwork
- **Challenges**: Privacy concerns, initial resistance to monitoring

**1.7.3 Maintenance Teams**
- **Benefits**: 60% reduction in unplanned downtime, predictive parts ordering
- **Challenges**: New diagnostic tools, shift from reactive to proactive mindset

**1.7.4 Executives**
- **Benefits**: Real-time business insights, automated compliance reporting
- **Challenges**: Initial ROI justification, change management

### 1.8 Implementation Strategy
**1.8.1 Phased Rollout**
1. **Pilot Phase**: 5 enterprise customers (Q1 2024)
2. **Beta Phase**: 50 customers (Q2 2024)
3. **General Availability**: All customers (Q3 2024)

**1.8.2 Success Metrics**
- **Adoption Rate**: 90% of existing customers within 6 months
- **Performance**: 99.95% uptime, <500ms API response time
- **User Satisfaction**: 4.5/5 CSAT score
- **Business Impact**: 20% reduction in operational costs for pilot customers

**1.8.3 Change Management**
- **Training**: 40 hours of role-based training per user
- **Documentation**: Interactive tutorials, video guides, and API playground
- **Support**: Dedicated migration team for first 90 days

---

## Performance Enhancements
*(250+ lines with 6 TypeScript implementations)*

### 2.1 Redis Caching Layer
```typescript
// src/cache/redis-cache.ts
import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/logger';
import { CacheConfig } from '../config/cache-config';

export class RedisCache {
    private client: RedisClientType;
    private logger: Logger;
    private config: CacheConfig;
    private static instance: RedisCache;

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

        this.client.on('error', (err) => {
            this.logger.error(`Redis error: ${err.message}`);
        });

        this.client.on('connect', () => {
            this.logger.info('Connected to Redis');
        });

        this.client.connect().catch(err => {
            this.logger.error(`Redis connection failed: ${err.message}`);
            throw err;
        });
    }

    public static getInstance(): RedisCache {
        if (!RedisCache.instance) {
            RedisCache.instance = new RedisCache();
        }
        return RedisCache.instance;
    }

    public async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            if (value) {
                return JSON.parse(value) as T;
            }
            return null;
        } catch (err) {
            this.logger.error(`Error getting key ${key}: ${err.message}`);
            return null;
        }
    }

    public async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
        try {
            const stringValue = JSON.stringify(value);
            if (ttl) {
                await this.client.setEx(key, ttl, stringValue);
            } else {
                await this.client.set(key, stringValue);
            }
            return true;
        } catch (err) {
            this.logger.error(`Error setting key ${key}: ${err.message}`);
            return false;
        }
    }

    public async delete(key: string): Promise<boolean> {
        try {
            const result = await this.client.del(key);
            return result === 1;
        } catch (err) {
            this.logger.error(`Error deleting key ${key}: ${err.message}`);
            return false;
        }
    }

    public async getWithCache<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl: number = 300
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached) {
            this.logger.debug(`Cache hit for ${key}`);
            return cached;
        }

        this.logger.debug(`Cache miss for ${key}, fetching fresh data`);
        const freshData = await fetchFn();
        await this.set(key, freshData, ttl);
        return freshData;
    }

    public async invalidatePattern(pattern: string): Promise<number> {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                return await this.client.del(keys);
            }
            return 0;
        } catch (err) {
            this.logger.error(`Error invalidating pattern ${pattern}: ${err.message}`);
            return 0;
        }
    }

    public async close(): Promise<void> {
        try {
            await this.client.quit();
            this.logger.info('Redis connection closed');
        } catch (err) {
            this.logger.error(`Error closing Redis connection: ${err.message}`);
        }
    }
}
```

### 2.2 Database Query Optimization
```typescript
// src/database/query-optimizer.ts
import { Pool, PoolClient, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { DatabaseConfig } from '../config/database-config';

export class QueryOptimizer {
    private pool: Pool;
    private logger: Logger;
    private config: DatabaseConfig;

    constructor() {
        this.config = new DatabaseConfig();
        this.logger = new Logger('QueryOptimizer');
        this.pool = new Pool({
            user: this.config.dbUser,
            host: this.config.dbHost,
            database: this.config.dbName,
            password: this.config.dbPassword,
            port: this.config.dbPort,
            max: this.config.maxConnections,
            idleTimeoutMillis: this.config.idleTimeout,
            connectionTimeoutMillis: this.config.connectionTimeout
        });

        this.pool.on('error', (err) => {
            this.logger.error(`Database connection error: ${err.message}`);
        });
    }

    public async executeOptimizedQuery<T>(
        query: string,
        params: any[] = [],
        options: {
            useCache?: boolean,
            cacheKey?: string,
            cacheTtl?: number,
            batchSize?: number
        } = {}
    ): Promise<T[]> {
        const { useCache = true, cacheKey, cacheTtl = 300, batchSize } = options;

        if (useCache && cacheKey) {
            const redisCache = RedisCache.getInstance();
            const cached = await redisCache.get<T[]>(cacheKey);
            if (cached) {
                this.logger.debug(`Returning cached results for ${cacheKey}`);
                return cached;
            }
        }

        try {
            if (batchSize && params.length > batchSize) {
                return await this.executeBatchQuery(query, params, batchSize);
            }

            const startTime = Date.now();
            const client = await this.pool.connect();

            try {
                const result = await client.query(query, params);
                const duration = Date.now() - startTime;

                this.logger.debug(`Query executed in ${duration}ms: ${query.substring(0, 100)}...`);

                if (useCache && cacheKey && result.rows.length > 0) {
                    const redisCache = RedisCache.getInstance();
                    await redisCache.set(cacheKey, result.rows, cacheTtl);
                }

                return result.rows as T[];
            } finally {
                client.release();
            }
        } catch (err) {
            this.logger.error(`Query execution failed: ${err.message}`);
            throw err;
        }
    }

    private async executeBatchQuery<T>(
        query: string,
        params: any[],
        batchSize: number
    ): Promise<T[]> {
        const results: T[] = [];
        const totalBatches = Math.ceil(params.length / batchSize);

        this.logger.debug(`Executing query in ${totalBatches} batches`);

        for (let i = 0; i < totalBatches; i++) {
            const batchParams = params.slice(i * batchSize, (i + 1) * batchSize);
            const batchResults = await this.executeOptimizedQuery<T>(query, batchParams, {
                useCache: false
            });
            results.push(...batchResults);
        }

        return results;
    }

    public async getVehicleTelemetry(
        vehicleId: string,
        startTime: Date,
        endTime: Date,
        limit: number = 1000
    ): Promise<VehicleTelemetry[]> {
        const query = `
            WITH RECURSIVE telemetry_tree AS (
                SELECT t.*,
                       ROW_NUMBER() OVER (ORDER BY t.timestamp) as rn
                FROM vehicle_telemetry t
                WHERE t.vehicle_id = $1
                AND t.timestamp BETWEEN $2 AND $3
                ORDER BY t.timestamp
                LIMIT $4
            )
            SELECT * FROM telemetry_tree
            ORDER BY timestamp;
        `;

        const params = [vehicleId, startTime, endTime, limit];
        return this.executeOptimizedQuery<VehicleTelemetry>(query, params, {
            cacheKey: `telemetry:${vehicleId}:${startTime.getTime()}:${endTime.getTime()}`,
            cacheTtl: 60
        });
    }

    public async getFleetSummary(
        fleetId: string,
        dateRange: { start: Date, end: Date }
    ): Promise<FleetSummary> {
        const query = `
            SELECT
                COUNT(DISTINCT v.vehicle_id) as total_vehicles,
                SUM(CASE WHEN v.status = 'active' THEN 1 ELSE 0 END) as active_vehicles,
                SUM(CASE WHEN v.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_vehicles,
                AVG(t.speed) as avg_speed,
                SUM(t.distance) as total_distance,
                SUM(t.fuel_consumed) as total_fuel,
                COUNT(DISTINCT t.driver_id) as unique_drivers,
                COUNT(CASE WHEN t.alert_type IS NOT NULL THEN 1 END) as total_alerts
            FROM vehicles v
            LEFT JOIN LATERAL (
                SELECT
                    speed, distance, fuel_consumed, driver_id, alert_type
                FROM vehicle_telemetry
                WHERE vehicle_id = v.vehicle_id
                AND timestamp BETWEEN $2 AND $3
                ORDER BY timestamp DESC
                LIMIT 1
            ) t ON true
            WHERE v.fleet_id = $1;
        `;

        const params = [fleetId, dateRange.start, dateRange.end];
        const results = await this.executeOptimizedQuery<FleetSummary>(query, params, {
            cacheKey: `fleet-summary:${fleetId}:${dateRange.start.getTime()}:${dateRange.end.getTime()}`,
            cacheTtl: 300
        });

        return results[0] || {
            total_vehicles: 0,
            active_vehicles: 0,
            maintenance_vehicles: 0,
            avg_speed: 0,
            total_distance: 0,
            total_fuel: 0,
            unique_drivers: 0,
            total_alerts: 0
        };
    }

    public async close(): Promise<void> {
        try {
            await this.pool.end();
            this.logger.info('Database pool closed');
        } catch (err) {
            this.logger.error(`Error closing database pool: ${err.message}`);
        }
    }
}

interface VehicleTelemetry {
    telemetry_id: string;
    vehicle_id: string;
    timestamp: Date;
    latitude: number;
    longitude: number;
    speed: number;
    direction: number;
    fuel_level: number;
    engine_temp: number;
    odometer: number;
    rpm: number;
    throttle_position: number;
    brake_status: boolean;
    gear_position: number;
    battery_voltage: number;
    coolant_temp: number;
    oil_pressure: number;
    tire_pressures: number[];
    driver_id: string;
    alert_type: string | null;
    distance: number;
    fuel_consumed: number;
}

interface FleetSummary {
    total_vehicles: number;
    active_vehicles: number;
    maintenance_vehicles: number;
    avg_speed: number;
    total_distance: number;
    total_fuel: number;
    unique_drivers: number;
    total_alerts: number;
}
```

### 2.3 API Response Compression
```typescript
// src/middleware/response-compression.ts
import { Request, Response, NextFunction } from 'express';
import { createBrotliCompress, createGzip, createDeflate } from 'zlib';
import { Logger } from '../utils/logger';
import { pipeline } from 'stream';

export class ResponseCompression {
    private logger: Logger;
    private static instance: ResponseCompression;
    private compressionThreshold: number;

    private constructor() {
        this.logger = new Logger('ResponseCompression');
        this.compressionThreshold = 1024; // 1KB
    }

    public static getInstance(): ResponseCompression {
        if (!ResponseCompression.instance) {
            ResponseCompression.instance = new ResponseCompression();
        }
        return ResponseCompression.instance;
    }

    public middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            // Skip compression for small responses
            const originalWrite = res.write;
            const originalEnd = res.end;
            const originalJson = res.json;
            const originalSend = res.send;

            let chunks: Buffer[] = [];
            let shouldCompress = false;
            let compressionStream: NodeJS.WritableStream | null = null;

            // Check if client accepts compression
            const acceptEncoding = req.headers['accept-encoding'] || '';
            const supportsBrotli = acceptEncoding.includes('br');
            const supportsGzip = acceptEncoding.includes('gzip');
            const supportsDeflate = acceptEncoding.includes('deflate');

            // Determine compression method
            let compressionMethod = '';
            if (supportsBrotli) {
                compressionMethod = 'br';
                compressionStream = createBrotliCompress({
                    params: {
                        [require('zlib').constants.BROTLI_PARAM_QUALITY]: 4
                    }
                });
            } else if (supportsGzip) {
                compressionMethod = 'gzip';
                compressionStream = createGzip({
                    level: 6
                });
            } else if (supportsDeflate) {
                compressionMethod = 'deflate';
                compressionStream = createDeflate({
                    level: 6
                });
            }

            // Override response methods
            res.write = (chunk: any, ...args: any[]): boolean => {
                if (chunk) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
                return originalWrite.apply(res, [chunk, ...args]);
            };

            res.end = (chunk: any, ...args: any[]): any => {
                if (chunk) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }

                const body = Buffer.concat(chunks);
                const contentLength = body.length;

                // Only compress if response is large enough
                if (contentLength >= this.compressionThreshold && compressionStream) {
                    shouldCompress = true;
                    res.setHeader('Content-Encoding', compressionMethod);
                    res.removeHeader('Content-Length');

                    const compressedStream = pipeline(
                        body,
                        compressionStream,
                        res,
                        (err) => {
                            if (err) {
                                this.logger.error(`Compression pipeline error: ${err.message}`);
                            }
                        }
                    );

                    return originalEnd.apply(res, [compressedStream, ...args]);
                }

                return originalEnd.apply(res, [body, ...args]);
            };

            res.json = (body: any): any => {
                if (body && compressionStream) {
                    const jsonString = JSON.stringify(body);
                    const contentLength = Buffer.byteLength(jsonString);

                    if (contentLength >= this.compressionThreshold) {
                        shouldCompress = true;
                        res.setHeader('Content-Encoding', compressionMethod);
                        res.removeHeader('Content-Length');

                        const compressedStream = pipeline(
                            Buffer.from(jsonString),
                            compressionStream,
                            res,
                            (err) => {
                                if (err) {
                                    this.logger.error(`JSON compression error: ${err.message}`);
                                }
                            }
                        );

                        return res;
                    }
                }

                return originalJson.apply(res, [body]);
            };

            res.send = (body: any): any => {
                if (body && compressionStream) {
                    const contentLength = Buffer.byteLength(body.toString());

                    if (contentLength >= this.compressionThreshold) {
                        shouldCompress = true;
                        res.setHeader('Content-Encoding', compressionMethod);
                        res.removeHeader('Content-Length');

                        const compressedStream = pipeline(
                            Buffer.from(body),
                            compressionStream,
                            res,
                            (err) => {
                                if (err) {
                                    this.logger.error(`Send compression error: ${err.message}`);
                                }
                            }
                        );

                        return res;
                    }
                }

                return originalSend.apply(res, [body]);
            };

            next();
        };
    }

    public setCompressionThreshold(threshold: number): void {
        if (threshold >= 0) {
            this.compressionThreshold = threshold;
            this.logger.info(`Compression threshold set to ${threshold} bytes`);
        } else {
            this.logger.warn('Invalid compression threshold, using default');
        }
    }
}
```

### 2.4 Lazy Loading Implementation
```typescript
// src/utils/lazy-loader.ts
import { Logger } from './logger';
import { performance } from 'perf_hooks';

export class LazyLoader {
    private static instance: LazyLoader;
    private logger: Logger;
    private loaders: Map<string, {
        loader: () => Promise<any>,
        instance: any,
        loaded: boolean,
        loading: boolean,
        subscribers: ((instance: any) => void)[]
    }>;
    private maxRetries: number;
    private retryDelay: number;

    private constructor() {
        this.logger = new Logger('LazyLoader');
        this.loaders = new Map();
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    public static getInstance(): LazyLoader {
        if (!LazyLoader.instance) {
            LazyLoader.instance = new LazyLoader();
        }
        return LazyLoader.instance;
    }

    public async load<T>(
        key: string,
        loader: () => Promise<T>,
        options: {
            forceReload?: boolean,
            maxRetries?: number,
            retryDelay?: number
        } = {}
    ): Promise<T> {
        const { forceReload = false, maxRetries = this.maxRetries, retryDelay = this.retryDelay } = options;

        if (!this.loaders.has(key)) {
            this.loaders.set(key, {
                loader,
                instance: null,
                loaded: false,
                loading: false,
                subscribers: []
            });
        }

        const loaderData = this.loaders.get(key)!;

        if (forceReload) {
            loaderData.loaded = false;
            loaderData.instance = null;
        }

        if (loaderData.loaded) {
            this.logger.debug(`Returning cached instance for ${key}`);
            return loaderData.instance as T;
        }

        if (loaderData.loading) {
            this.logger.debug(`Waiting for existing load of ${key}`);
            return new Promise<T>((resolve) => {
                loaderData.subscribers.push(resolve);
            });
        }

        loaderData.loading = true;
        let attempts = 0;
        let lastError: Error | null = null;

        while (attempts <= maxRetries) {
            try {
                const startTime = performance.now();
                this.logger.debug(`Loading ${key} (attempt ${attempts + 1})`);

                const instance = await loader();
                const duration = performance.now() - startTime;

                loaderData.instance = instance;
                loaderData.loaded = true;
                loaderData.loading = false;

                this.logger.debug(`Successfully loaded ${key} in ${duration.toFixed(2)}ms`);

                // Notify all subscribers
                loaderData.subscribers.forEach(subscriber => {
                    try {
                        subscriber(instance);
                    } catch (err) {
                        this.logger.error(`Subscriber error for ${key}: ${err.message}`);
                    }
                });
                loaderData.subscribers = [];

                return instance;
            } catch (err) {
                lastError = err as Error;
                attempts++;
                this.logger.warn(`Failed to load ${key} (attempt ${attempts}): ${err.message}`);

                if (attempts <= maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        loaderData.loading = false;
        this.logger.error(`Failed to load ${key} after ${maxRetries} attempts`);
        throw new Error(`Failed to load ${key}: ${lastError?.message}`);
    }

    public async loadMultiple<T>(
        keys: string[],
        loaderFactory: (key: string) => () => Promise<T>
    ): Promise<Map<string, T>> {
        const results = new Map<string, T>();

        await Promise.all(keys.map(async key => {
            try {
                const instance = await this.load(key, loaderFactory(key));
                results.set(key, instance);
            } catch (err) {
                this.logger.error(`Failed to load ${key}: ${err.message}`);
                throw err;
            }
        }));

        return results;
    }

    public isLoaded(key: string): boolean {
        const loaderData = this.loaders.get(key);
        return loaderData ? loaderData.loaded : false;
    }

    public clear(key: string): void {
        this.loaders.delete(key);
        this.logger.debug(`Cleared loader for ${key}`);
    }

    public clearAll(): void {
        this.loaders.clear();
        this.logger.debug('Cleared all loaders');
    }

    public setRetryPolicy(maxRetries: number, retryDelay: number): void {
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.logger.info(`Retry policy set to ${maxRetries} attempts with ${retryDelay}ms delay`);
    }
}

// Usage example for React components
export function withLazyLoading<T extends { [key: string]: any }>(
    componentName: string,
    importFunction: () => Promise<{ default: React.ComponentType<T> }>
): React.ComponentType<T> {
    const LazyComponent = React.lazy(async () => {
        const loader = LazyLoader.getInstance();
        return loader.load(
            `component:${componentName}`,
            async () => {
                const module = await importFunction();
                return { default: module.default };
            },
            { maxRetries: 2 }
        );
    });

    return (props: T) => (
        <React.Suspense fallback={<div>Loading {componentName}...</div>}>
            <LazyComponent {...props} />
        </React.Suspense>
    );
}
```

### 2.5 Request Debouncing
```typescript
// src/utils/request-debouncer.ts
import { Logger } from './logger';

export class RequestDebouncer {
    private static instance: RequestDebouncer;
    private logger: Logger;
    private debounceTimers: Map<string, NodeJS.Timeout>;
    private debounceCache: Map<string, {
        lastRequest: number,
        lastResponse: any,
        pending: boolean,
        subscribers: ((response: any) => void)[]
    }>;
    private defaultDelay: number;

    private constructor() {
        this.logger = new Logger('RequestDebouncer');
        this.debounceTimers = new Map();
        this.debounceCache = new Map();
        this.defaultDelay = 300; // 300ms default debounce delay
    }

    public static getInstance(): RequestDebouncer {
        if (!RequestDebouncer.instance) {
            RequestDebouncer.instance = new RequestDebouncer();
        }
        return RequestDebouncer.instance;
    }

    public async debounce<T>(
        key: string,
        requestFn: () => Promise<T>,
        options: {
            delay?: number,
            cacheFor?: number,
            forceRefresh?: boolean
        } = {}
    ): Promise<T> {
        const { delay = this.defaultDelay, cacheFor = 0, forceRefresh = false } = options;

        // Check cache first if not forcing refresh
        if (!forceRefresh && cacheFor > 0) {
            const cached = this.debounceCache.get(key);
            if (cached && Date.now() - cached.lastRequest < cacheFor) {
                this.logger.debug(`Returning cached response for ${key}`);
                return cached.lastResponse as T;
            }
        }

        // If there's a pending request, subscribe to it
        const cached = this.debounceCache.get(key);
        if (cached && cached.pending) {
            this.logger.debug(`Waiting for pending request for ${key}`);
            return new Promise<T>((resolve) => {
                cached.subscribers.push(resolve);
            });
        }

        // Set up new debounce timer
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        return new Promise<T>((resolve) => {
            this.debounceTimers.set(key, setTimeout(async () => {
                try {
                    this.logger.debug(`Executing debounced request for ${key}`);

                    // Mark as pending
                    if (!this.debounceCache.has(key)) {
                        this.debounceCache.set(key, {
                            lastRequest: Date.now(),
                            lastResponse: null,
                            pending: true,
                            subscribers: []
                        });
                    } else {
                        const existing = this.debounceCache.get(key)!;
                        existing.pending = true;
                        existing.lastRequest = Date.now();
                        existing.subscribers = [];
                    }

                    const response = await requestFn();

                    // Update cache and notify subscribers
                    const cacheEntry = this.debounceCache.get(key)!;
                    cacheEntry.lastResponse = response;
                    cacheEntry.pending = false;

                    resolve(response);
                    cacheEntry.subscribers.forEach(subscriber => {
                        try {
                            subscriber(response);
                        } catch (err) {
                            this.logger.error(`Subscriber error for ${key}: ${err.message}`);
                        }
                    });

                    // Clean up if cache duration is set
                    if (cacheFor > 0) {
                        setTimeout(() => {
                            this.debounceCache.delete(key);
                            this.logger.debug(`Cleared cache for ${key}`);
                        }, cacheFor);
                    } else {
                        this.debounceCache.delete(key);
                    }
                } catch (err) {
                    this.logger.error(`Debounced request failed for ${key}: ${err.message}`);
                    this.debounceCache.delete(key);
                    throw err;
                } finally {
                    this.debounceTimers.delete(key);
                }
            }, delay));
        });
    }

    public cancel(key: string): void {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.delete(key);
            this.debounceCache.delete(key);
            this.logger.debug(`Cancelled debounced request for ${key}`);
        }
    }

    public cancelAll(): void {
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        this.debounceCache.clear();
        this.logger.debug('Cancelled all debounced requests');
    }

    public setDefaultDelay(delay: number): void {
        if (delay >= 0) {
            this.defaultDelay = delay;
            this.logger.info(`Default debounce delay set to ${delay}ms`);
        } else {
            this.logger.warn('Invalid debounce delay, using default');
        }
    }

    public getPendingCount(): number {
        return this.debounceTimers.size;
    }

    public getCacheSize(): number {
        return this.debounceCache.size;
    }
}

// Usage example for API calls
export class VehicleApi {
    private debouncer: RequestDebouncer;
    private logger: Logger;

    constructor() {
        this.debouncer = RequestDebouncer.getInstance();
        this.logger = new Logger('VehicleApi');
    }

    public async getVehicleTelemetry(
        vehicleId: string,
        forceRefresh: boolean = false
    ): Promise<VehicleTelemetry> {
        const cacheKey = `vehicle-telemetry:${vehicleId}`;

        return this.debouncer.debounce(
            cacheKey,
            async () => {
                this.logger.debug(`Fetching fresh telemetry for ${vehicleId}`);
                const response = await fetch(`/api/vehicles/${vehicleId}/telemetry`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch telemetry: ${response.statusText}`);
                }
                return response.json();
            },
            {
                delay: 500,
                cacheFor: 10000, // 10 seconds
                forceRefresh
            }
        );
    }

    public async searchVehicles(
        query: string,
        filters: VehicleSearchFilters
    ): Promise<VehicleSearchResults> {
        const cacheKey = `vehicle-search:${query}:${JSON.stringify(filters)}`;

        return this.debouncer.debounce(
            cacheKey,
            async () => {
                this.logger.debug(`Searching vehicles with query: ${query}`);
                const response = await fetch('/api/vehicles/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ query, filters })
                });
                if (!response.ok) {
                    throw new Error(`Search failed: ${response.statusText}`);
                }
                return response.json();
            },
            {
                delay: 300,
                cacheFor: 30000 // 30 seconds
            }
        );
    }
}

interface VehicleTelemetry {
    vehicleId: string;
    timestamp: string;
    location: {
        lat: number;
        lng: number;
    };
    speed: number;
    fuelLevel: number;
    engineStatus: string;
    alerts: string[];
}

interface VehicleSearchFilters {
    status?: string[];
    type?: string[];
    lastActive?: string;
    minFuelLevel?: number;
}

interface VehicleSearchResults {
    results: Vehicle[];
    total: number;
    page: number;
    pageSize: number;
}

interface Vehicle {
    id: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    status: string;
    lastLocation: {
        lat: number;
        lng: number;
    };
    lastActive: string;
    fuelLevel: number;
}
```

### 2.6 Connection Pooling
```typescript
// src/database/connection-pool.ts
import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { DatabaseConfig } from '../config/database-config';

export class ConnectionPool {
    private static instance: ConnectionPool;
    private pool: Pool;
    private logger: Logger;
    private config: DatabaseConfig;
    private activeConnections: Set<PoolClient>;
    private connectionMetrics: {
        total: number;
        active: number;
        idle: number;
        waiting: number;
    };

    private constructor() {
        this.config = new DatabaseConfig();
        this.logger = new Logger('ConnectionPool');
        this.activeConnections = new Set();
        this.connectionMetrics = {
            total: 0,
            active: 0,
            idle: 0,
            waiting: 0
        };

        const poolConfig: PoolConfig = {
            user: this.config.dbUser,
            host: this.config.dbHost,
            database: this.config.dbName,
            password: this.config.dbPassword,
            port: this.config.dbPort,
            max: this.config.maxConnections,
            min: this.config.minConnections,
            idleTimeoutMillis: this.config.idleTimeout,
            connectionTimeoutMillis: this.config.connectionTimeout,
            application_name: 'telematics-iot'
        };

        this.pool = new Pool(poolConfig);

        // Set up event listeners
        this.pool.on('connect', (client) => {
            this.connectionMetrics.total++;
            this.logger.debug(`New connection established. Total: ${this.connectionMetrics.total}`);
        });

        this.pool.on('acquire', (client) => {
            this.connectionMetrics.active++;
            this.connectionMetrics.idle--;
            this.activeConnections.add(client);
            this.logger.debug(`Connection acquired. Active: ${this.connectionMetrics.active}, Idle: ${this.connectionMetrics.idle}`);
        });

        this.pool.on('release', (err, client) => {
            this.connectionMetrics.active--;
            this.connectionMetrics.idle++;
            this.activeConnections.delete(client);
            if (err) {
                this.logger.error(`Connection release error: ${err.message}`);
            } else {
                this.logger.debug(`Connection released. Active: ${this.connectionMetrics.active}, Idle: ${this.connectionMetrics.idle}`);
            }
        });

        this.pool.on('error', (err) => {
            this.logger.error(`Pool error: ${err.message}`);
        });
    }

    public static getInstance(): ConnectionPool {
        if (!ConnectionPool.instance) {
            ConnectionPool.instance = new ConnectionPool();
        }
        return ConnectionPool.instance;
    }

    public async getClient(): Promise<PoolClient> {
        try {
            const client = await this.pool.connect();
            this.logger.debug(`Client acquired from pool. Total clients: ${this.pool.totalCount}`);

            // Set up client-specific error handling
            client.on('error', (err) => {
                this.logger.error(`Client error: ${err.message}`);
                this.activeConnections.delete(client);
            });

            return client;
        } catch (err) {
            this.logger.error(`Failed to get client from pool: ${err.message}`);
            throw err;
        }
    }

    public async executeQuery<T>(
        query: string,
        params: any[] = [],
        options: {
            client?: PoolClient,
            retryOnFailure?: boolean,
            maxRetries?: number
        } = {}
    ): Promise<QueryResult<T>> {
        const { client, retryOnFailure = true, maxRetries = 3 } = options;
        let attempts = 0;
        let lastError: Error | null = null;

        while (attempts <= maxRetries) {
            try {
                const startTime = Date.now();
                const useInternalClient = !client;

                const dbClient = client || await this.getClient();

                try {
                    const result = await dbClient.query<T>(query, params);
                    const duration = Date.now() - startTime;

                    this.logger.debug(`Query executed in ${duration}ms: ${query.substring(0, 100)}...`);

                    if (useInternalClient) {
                        dbClient.release();
                    }

                    return result;
                } catch (err) {
                    if (useInternalClient) {
                        dbClient.release(err);
                    }
                    throw err;
                }
            } catch (err) {
                lastError = err as Error;
                attempts++;
                this.logger.warn(`Query attempt ${attempts} failed: ${err.message}`);

                if (attempts <= maxRetries && retryOnFailure) {
                    await new Promise(resolve => setTimeout(resolve, 100 * attempts));
                } else {
                    this.logger.error(`Query failed after ${maxRetries} attempts: ${query.substring(0, 100)}...`);
                    throw lastError;
                }
            }
        }

        throw lastError!;
    }

    public async executeTransaction<T>(
        queries: {
            query: string,
            params?: any[]
        }[],
        options: {
            isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE'
        } = {}
    ): Promise<T[]> {
        const { isolationLevel = 'READ COMMITTED' } = options;
        const client = await this.getClient();
        let results: T[] = [];

        try {
            await client.query('BEGIN');
            await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);

            for (const { query, params } of queries) {
                const result = await client.query<T>(query, params);
                results.push(result.rows[0]);
            }

            await client.query('COMMIT');
            this.logger.debug('Transaction committed successfully');
            return results;
        } catch (err) {
            await client.query('ROLLBACK');
            this.logger.error(`Transaction rolled back: ${err.message}`);
            throw err;
        } finally {
            client.release();
        }
    }

    public async getPoolStatus(): Promise<PoolStatus> {
        return {
            totalConnections: this.pool.totalCount,
            idleConnections: this.pool.idleCount,
            waitingClients: this.pool.waitingCount,
            activeConnections: this.connectionMetrics.active,
            maxConnections: this.config.maxConnections,
            minConnections: this.config.minConnections
        };
    }

    public async end(): Promise<void> {
        try {
            await this.pool.end();
            this.logger.info('Connection pool closed');
        } catch (err) {
            this.logger.error(`Error closing connection pool: ${err.message}`);
            throw err;
        }
    }

    public getActiveConnectionCount(): number {
        return this.activeConnections.size;
    }

    public getConnectionMetrics(): typeof this.connectionMetrics {
        return { ...this.connectionMetrics };
    }
}

interface PoolStatus {
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
    activeConnections: number;
    maxConnections: number;
    minConnections: number;
}

// Usage example
export class VehicleRepository {
    private pool: ConnectionPool;
    private logger: Logger;

    constructor() {
        this.pool = ConnectionPool.getInstance();
        this.logger = new Logger('VehicleRepository');
    }

    public async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
        const query = `
            SELECT
                v.*,
                f.fleet_name,
                f.fleet_manager_id,
                d.first_name as driver_first_name,
                d.last_name as driver_last_name,
                d.license_number,
                d.contact_number
            FROM vehicles v
            LEFT JOIN fleets f ON v.fleet_id = f.fleet_id
            LEFT JOIN drivers d ON v.current_driver_id = d.driver_id
            WHERE v.vehicle_id = $1
        `;

        try {
            const result = await this.pool.executeQuery<Vehicle>(query, [vehicleId]);
            return result.rows[0] || null;
        } catch (err) {
            this.logger.error(`Failed to get vehicle ${vehicleId}: ${err.message}`);
            throw err;
        }
    }

    public async updateVehicleLocation(
        vehicleId: string,
        location: { lat: number, lng: number },
        timestamp: Date
    ): Promise<void> {
        const queries = [
            {
                query: `
                    UPDATE vehicles
                    SET
                        last_location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
                        last_location_update = $3
                    WHERE vehicle_id = $4
                `,
                params: [location.lng, location.lat, timestamp, vehicleId]
            },
            {
                query: `
                    INSERT INTO vehicle_locations (vehicle_id, location, timestamp)
                    VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4)
                `,
                params: [vehicleId, location.lng, location.lat, timestamp]
            }
        ];

        try {
            await this.pool.executeTransaction(queries);
            this.logger.debug(`Updated location for vehicle ${vehicleId}`);
        } catch (err) {
            this.logger.error(`Failed to update location for vehicle ${vehicleId}: ${err.message}`);
            throw err;
        }
    }

    public async getVehicleTelemetry(
        vehicleId: string,
        startTime: Date,
        endTime: Date,
        limit: number = 1000
    ): Promise<VehicleTelemetry[]> {
        const query = `
            SELECT
                telemetry_id,
                vehicle_id,
                timestamp,
                ST_X(location) as longitude,
                ST_Y(location) as latitude,
                speed,
                direction,
                fuel_level,
                engine_temp,
                odometer,
                rpm,
                throttle_position,
                brake_status,
                gear_position,
                battery_voltage,
                coolant_temp,
                oil_pressure,
                tire_pressures,
                driver_id,
                alert_type,
                distance,
                fuel_consumed
            FROM vehicle_telemetry
            WHERE vehicle_id = $1
            AND timestamp BETWEEN $2 AND $3
            ORDER BY timestamp DESC
            LIMIT $4
        `;

        try {
            const result = await this.pool.executeQuery<VehicleTelemetry>(query, [
                vehicleId,
                startTime,
                endTime,
                limit
            ]);
            return result.rows;
        } catch (err) {
            this.logger.error(`Failed to get telemetry for vehicle ${vehicleId}: ${err.message}`);
            throw err;
        }
    }
}

interface Vehicle {
    vehicle_id: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    fleet_id: string;
    fleet_name?: string;
    fleet_manager_id?: string;
    current_driver_id?: string;
    driver_first_name?: string;
    driver_last_name?: string;
    license_number?: string;
    contact_number?: string;
    status: string;
    last_location: { lat: number, lng: number };
    last_location_update: Date;
    registration_number: string;
    purchase_date: Date;
    last_maintenance_date: Date;
    next_maintenance_date: Date;
    fuel_type: string;
    fuel_capacity: number;
    odometer: number;
    created_at: Date;
    updated_at: Date;
}

interface VehicleTelemetry {
    telemetry_id: string;
    vehicle_id: string;
    timestamp: Date;
    latitude: number;
    longitude: number;
    speed: number;
    direction: number;
    fuel_level: number;
    engine_temp: number;
    odometer: number;
    rpm: number;
    throttle_position: number;
    brake_status: boolean;
    gear_position: number;
    battery_voltage: number;
    coolant_temp: number;
    oil_pressure: number;
    tire_pressures: number[];
    driver_id: string;
    alert_type: string | null;
    distance: number;
    fuel_consumed: number;
}
```

---

## Real-Time Features
*(300+ lines with 5 TypeScript implementations)*

### 3.1 WebSocket Server Setup
```typescript
// src/websocket/websocket-server.ts
import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { Logger } from '../utils/logger';
import { WebSocketConfig } from '../config/websocket-config';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiter } from '../security/rate-limiter';
import { JwtVerifier } from '../security/jwt-verifier';

export class WebSocketServerManager {
    private static instance: WebSocketServerManager;
    private wss: WebSocketServer;
    private logger: Logger;
    private config: WebSocketConfig;
    private clients: Map<string, WebSocketClient>;
    private rateLimiter: RateLimiter;
    private jwtVerifier: JwtVerifier;
    private heartbeatInterval: NodeJS.Timeout;
    private connectionCleanupInterval: NodeJS.Timeout;

    private constructor(server: Server) {
        this.config = new WebSocketConfig();
        this.logger = new Logger('WebSocketServer');
        this.clients = new Map();
        this.rateLimiter = new RateLimiter({
            points: this.config.rateLimitPoints,
            duration: this.config.rateLimitDuration
        });
        this.jwtVerifier = new JwtVerifier();

        this.wss = new WebSocketServer({
            server,
            path: this.config.path,
            clientTracking: false,
            maxPayload: this.config.maxPayloadSize,
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
        this.startHeartbeat();
        this.startConnectionCleanup();
    }

    public static getInstance(server?: Server): WebSocketServerManager {
        if (!WebSocketServerManager.instance && server) {
            WebSocketServerManager.instance = new WebSocketServerManager(server);
        }
        return WebSocketServerManager.instance;
    }

    private setupEventListeners(): void {
        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req).catch(err => {
                this.logger.error(`Connection handler error: ${err.message}`);
                ws.close(1008, 'Internal server error');
            });
        });

        this.wss.on('error', (err) => {
            this.logger.error(`WebSocket server error: ${err.message}`);
        });

        this.wss.on('listening', () => {
            this.logger.info(`WebSocket server listening on path ${this.config.path}`);
        });
    }

    private async handleConnection(ws: WebSocket, req: any): Promise<void> {
        const clientId = uuidv4();
        const ip = req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        this.logger.info(`New WebSocket connection attempt from ${ip}`);

        // Rate limiting
        const rateLimitKey = `ws:${ip}`;
        const rateLimitResult = this.rateLimiter.consume(rateLimitKey);

        if (!rateLimitResult.success) {
            this.logger.warn(`Connection rate limit exceeded for ${ip}`);
            ws.close(1008, 'Too many connection attempts');
            return;
        }

        // Authentication
        const authHeader = req.headers['sec-websocket-protocol'] || '';
        const token = authHeader.split(',').find((t: string) => t.trim().startsWith('Bearer '))?.split(' ')[1];

        if (!token) {
            this.logger.warn(`No authentication token provided by ${ip}`);
            ws.close(1008, 'Authentication required');
            return;
        }

        try {
            const payload = await this.jwtVerifier.verify(token);
            this.logger.debug(`Authenticated user ${payload.userId} from ${ip}`);

            // Create client record
            const client: WebSocketClient = {
                id: clientId,
                ws,
                ip,
                userAgent,
                userId: payload.userId,
                roles: payload.roles || [],
                connectedAt: new Date(),
                lastActivity: new Date(),
                subscriptions: new Set(),
                metadata: {}
            };

            this.clients.set(clientId, client);

            // Send connection confirmation
            ws.send(JSON.stringify({
                type: 'connection_ack',
                data: {
                    clientId,
                    serverTime: new Date().toISOString(),
                    maxPayloadSize: this.config.maxPayloadSize,
                    heartbeatInterval: this.config.heartbeatInterval
                }
            }));

            // Set up client-specific listeners
            this.setupClientListeners(client);

            this.logger.info(`Client ${clientId} connected (User: ${payload.userId}, IP: ${ip})`);
        } catch (err) {
            this.logger.warn(`Authentication failed for ${ip}: ${err.message}`);
            ws.close(1008, 'Invalid authentication token');
        }
    }

    private setupClientListeners(client: WebSocketClient): void {
        const { ws } = client;

        ws.on('message', (data) => {
            this.handleMessage(client, data).catch(err => {
                this.logger.error(`Message handler error for ${client.id}: ${err.message}`);
                ws.send(JSON.stringify({
                    type: 'error',
                    data: {
                        code: 'MESSAGE_HANDLER_ERROR',
                        message: 'Failed to process message'
                    }
                }));
            });
        });

        ws.on('ping', () => {
            client.lastActivity = new Date();
            ws.pong();
        });

        ws.on('pong', () => {
            client.lastActivity = new Date();
        });

        ws.on('close', (code, reason) => {
            this.handleDisconnect(client, code, reason);
        });

        ws.on('error', (err) => {
            this.logger.error(`WebSocket error for ${client.id}: ${err.message}`);
            this.handleDisconnect(client, 1011, 'Internal error');
        });
    }

    private async handleMessage(client: WebSocketClient, data: WebSocket.Data): Promise<void> {
        client.lastActivity = new Date();

        // Rate limiting per client
        const rateLimitKey = `ws:${client.ip}:${client.id}`;
        const rateLimitResult = this.rateLimiter.consume(rateLimitKey);

        if (!rateLimitResult.success) {
            this.logger.warn(`Message rate limit exceeded for client ${client.id}`);
            client.ws.send(JSON.stringify({
                type: 'error',
                data: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many messages'
                }
            }));
            return;
        }

        try {
            if (typeof data !== 'string') {
                this.logger.warn(`Received binary data from ${client.id}, expected text`);
                client.ws.send(JSON.stringify({
                    type: 'error',
                    data: {
                        code: 'INVALID_MESSAGE_FORMAT',
                        message: 'Binary data not supported'
                    }
                }));
                return;
            }

            const message = JSON.parse(data) as WebSocketMessage;
            this.logger.debug(`Received message from ${client.id}: ${message.type}`);

            // Validate message
            if (!message.type) {
                throw new Error('Message type is required');
            }

            // Route message to appropriate handler
            switch (message.type) {
                case 'subscribe':
                    await this.handleSubscribe(client, message.data);
                    break;
                case 'unsubscribe':
                    await this.handleUnsubscribe(client, message.data);
                    break;
                case 'ping':
                    this.handlePing(client);
                    break;
                case 'custom':
                    await this.handleCustomMessage(client, message);
                    break;
                default:
                    this.logger.warn(`Unknown message type from ${client.id}: ${message.type}`);
                    client.ws.send(JSON.stringify({
                        type: 'error',
                        data: {
                            code: 'UNKNOWN_MESSAGE_TYPE',
                            message: `Unknown message type: ${message.type}`
                        }
                    }));
            }
        } catch (err) {
            this.logger.error(`Failed to process message from ${client.id}: ${err.message}`);
            client.ws.send(JSON.stringify({
                type: 'error',
                data: {
                    code: 'MESSAGE_PROCESSING_ERROR',
                    message: err.message
                }
            }));
        }
    }

    private async handleSubscribe(client: WebSocketClient, data: any): Promise<void> {
        if (!data || !data.channel) {
            throw new Error('Channel is required for subscription');
        }

        const { channel, params = {} } = data;

        // Check if client is already subscribed
        if (client.subscriptions.has(channel)) {
            this.logger.debug(`Client ${client.id} already subscribed to ${channel}`);
            return;
        }

        // Validate channel permissions
        if (!this.hasPermissionForChannel(client, channel)) {
            throw new Error('Insufficient permissions for this channel');
        }

        // Add subscription
        client.subscriptions.add(channel);
        this.logger.info(`Client ${client.id} subscribed to ${channel}`);

        // Send subscription confirmation
        client.ws.send(JSON.stringify({
            type: 'subscription_ack',
            data: {
                channel,
                status: 'subscribed',
                timestamp: new Date().toISOString()
            }
        }));

        // Send initial data if available
        await this.sendInitialData(client, channel, params);
    }

    private async handleUnsubscribe(client: WebSocketClient, data: any): Promise<void> {
        if (!data || !data.channel) {
            throw new Error('Channel is required for unsubscription');
        }

        const { channel } = data;

        if (!client.subscriptions.has(channel)) {
            this.logger.debug(`Client ${client.id} not subscribed to ${channel}`);
            return;
        }

        client.subscriptions.delete(channel);
        this.logger.info(`Client ${client.id} unsubscribed from ${channel}`);

        client.ws.send(JSON.stringify({
            type: 'unsubscription_ack',
            data: {
                channel,
                status: 'unsubscribed',
                timestamp: new Date().toISOString()
            }
        }));
    }

    private handlePing(client: WebSocketClient): void {
        client.ws.send(JSON.stringify({
            type: 'pong',
            data: {
                timestamp: new Date().toISOString(),
                serverTime: new Date().toISOString()
            }
        }));
    }

    private async handleCustomMessage(client: WebSocketClient, message: WebSocketMessage): Promise<void> {
        // This would be extended by specific implementations
        this.logger.debug(`Received custom message from ${client.id}: ${message.type}`);

        // Send acknowledgment
        client.ws.send(JSON.stringify({
            type: 'custom_ack',
            data: {
                originalType: message.type,
                timestamp: new Date().toISOString()
            }
        }));
    }

    private async sendInitialData(client: WebSocketClient, channel: string, params: any): Promise<void> {
        try {
            // This would be implemented by specific channel handlers
            this.logger.debug(`Sending initial data for channel ${channel} to ${client.id}`);

            // Example: Send last 10 messages for a chat channel
            if (channel.startsWith('chat:')) {
                const messages = await this.getLastMessages(channel, 10);
                client.ws.send(JSON.stringify({
                    type: 'initial_data',
                    data: {
                        channel,
                        messages
                    }
                }));
            }

            // Example: Send current vehicle status for telemetry channel
            if (channel.startsWith('vehicle:')) {
                const vehicleId = channel.split(':')[1];
                const status = await this.getVehicleStatus(vehicleId);
                client.ws.send(JSON.stringify({
                    type: 'initial_data',
                    data: {
                        channel,
                        status
                    }
                }));
            }
        } catch (err) {
            this.logger.error(`Failed to send initial data for ${channel} to ${client.id}: ${err.message}`);
        }
    }

    private hasPermissionForChannel(client: WebSocketClient, channel: string): boolean {
        // Implement channel-specific permission checks
        if (channel.startsWith('admin:')) {
            return client.roles.includes('admin');
        }

        if (channel.startsWith('fleet:')) {
            const fleetId = channel.split(':')[1];
            return client.roles.includes('fleet_manager') ||
                   client.metadata.fleetIds?.includes(fleetId);
        }

        if (channel.startsWith('vehicle:')) {
            const vehicleId = channel.split(':')[1];
            return client.roles.includes('driver') ||
                   client.roles.includes('fleet_manager') ||
                   client.metadata.vehicleIds?.includes(vehicleId);
        }

        return true; // Default to true for public channels
    }

    private handleDisconnect(client: WebSocketClient, code: number, reason: string): void {
        this.clients.delete(client.id);
        this.logger.info(`Client ${client.id} disconnected (Code: ${code}, Reason: ${reason})`);

        // Clean up any pending operations for this client
        this.cleanupClient(client);
    }

    private cleanupClient(client: WebSocketClient): void {
        // This would be extended by specific implementations
        this.logger.debug(`Cleaning up client ${client.id}`);
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            const now = new Date();
            this.clients.forEach(client => {
                try {
                    if (now.getTime() - client.lastActivity.getTime() > this.config.heartbeatInterval * 2) {
                        this.logger.warn(`Client ${client.id} missed heartbeat, closing connection`);
                        client.ws.close(1001, 'Heartbeat timeout');
                    } else {
                        client.ws.ping();
                    }
                } catch (err) {
                    this.logger.error(`Heartbeat error for ${client.id}: ${err.message}`);
                }
            });
        }, this.config.heartbeatInterval);
    }

    private startConnectionCleanup(): void {
        this.connectionCleanupInterval = setInterval(() => {
            const now = new Date();
            this.clients.forEach((client, clientId) => {
                if (now.getTime() - client.lastActivity.getTime() > this.config.connectionTimeout) {
                    this.logger.info(`Closing inactive connection for ${clientId}`);
                    client.ws.close(1001, 'Connection timeout');
                }
            });
        }, this.config.connectionCleanupInterval);
    }

    public broadcast(channel: string, message: WebSocketMessage): void {
        this.clients.forEach(client => {
            if (client.subscriptions.has(channel)) {
                try {
                    client.ws.send(JSON.stringify(message));
                } catch (err) {
                    this.logger.error(`Failed to broadcast to ${client.id}: ${err.message}`);
                }
            }
        });
    }

    public sendToClient(clientId: string, message: WebSocketMessage): boolean {
        const client = this.clients.get(clientId);
        if (client) {
            try {
                client.ws.send(JSON.stringify(message));
                return true;
            } catch (err) {
                this.logger.error(`Failed to send message to ${clientId}: ${err.message}`);
                return false;
            }
        }
        return false;
    }

    public sendToUser(userId: string, message: WebSocketMessage): number {
        let count = 0;
        this.clients.forEach(client => {
            if (client.userId === userId) {
                try {
                    client.ws.send(JSON.stringify(message));
                    count++;
                } catch (err) {
                    this.logger.error(`Failed to send message to user ${userId} (client ${client.id}): ${err.message}`);
                }
            }
        });
        return count;
    }

    public getClientCount(): number {
        return this.clients.size;
    }

    public getClientInfo(clientId: string): WebSocketClientInfo | null {
        const client = this.clients.get(clientId);
        if (client) {
            return {
                id: client.id,
                userId: client.userId,
                ip: client.ip,
                userAgent: client.userAgent,
                connectedAt: client.connectedAt,
                lastActivity: client.lastActivity,
                subscriptions: Array.from(client.subscriptions),
                roles: client.roles
            };
        }
        return null;
    }

    public getAllClients(): WebSocketClientInfo[] {
        return Array.from(this.clients.values()).map(client => ({
            id: client.id,
            userId: client.userId,
            ip: client.ip,
            userAgent: client.userAgent,
            connectedAt: client.connectedAt,
            lastActivity: client.lastActivity,
            subscriptions: Array.from(client.subscriptions),
            roles: client.roles
        }));
    }

    public shutdown(): void {
        clearInterval(this.heartbeatInterval);
        clearInterval(this.connectionCleanupInterval);

        this.clients.forEach(client => {
            try {
                client.ws.close(1001, 'Server shutting down');
            } catch (err) {
                this.logger.error(`Error closing client ${client.id} during shutdown: ${err.message}`);
            }
        });

        this.wss.close();
        this.logger.info('WebSocket server shutdown complete');
    }

    // Example methods that would be implemented by specific services
    private async getLastMessages(channel: string, limit: number): Promise<any[]> {
        // Implementation would query database for recent messages
        return [];
    }

    private async getVehicleStatus(vehicleId: string): Promise<any> {
        // Implementation would query vehicle status
        return {};
    }
}

interface WebSocketClient {
    id: string;
    ws: WebSocket;
    ip: string;
    userAgent: string;
    userId: string;
    roles: string[];
    connectedAt: Date;
    lastActivity: Date;
    subscriptions: Set<string>;
    metadata: Record<string, any>;
}

interface WebSocketMessage {
    type: string;
    data: any;
}

interface WebSocketClientInfo {
    id: string;
    userId: string;
    ip: string;
    userAgent: string;
    connectedAt: Date;
    lastActivity: Date;
    subscriptions: string[];
    roles: string[];
}
```

### 3.2 Real-Time Event Handlers
```typescript
// src/websocket/event-handlers.ts
import { WebSocketServerManager } from './websocket-server';
import { Logger } from '../utils/logger';
import { VehicleService } from '../services/vehicle-service';
import { AlertService } from '../services/alert-service';
import { DriverService } from '../services/driver-service';
import { FleetService } from '../services/fleet-service';
import { NotificationService } from '../services/notification-service';
import { GeofenceService } from '../services/geofence-service';
import { MaintenanceService } from '../services/maintenance-service';

export class WebSocketEventHandlers {
    private static instance: WebSocketEventHandlers;
    private wsServer: WebSocketServerManager;
    private logger: Logger;
    private vehicleService: VehicleService;
    private alertService: AlertService;
    private driverService: DriverService;
    private fleetService: FleetService;
    private notificationService: NotificationService;
    private geofenceService: GeofenceService;
    private maintenanceService: MaintenanceService;

    private constructor(wsServer: WebSocketServerManager) {
        this.wsServer = wsServer;
        this.logger = new Logger('WebSocketEventHandlers');
        this.vehicleService = new VehicleService();
        this.alertService = new AlertService();
        this.driverService = new DriverService();
        this.fleetService = new FleetService();
        this.notificationService = new NotificationService();
        this.geofenceService = new GeofenceService();
        this.maintenanceService = new MaintenanceService();

        this.setupEventListeners();
    }

    public static getInstance(wsServer?: WebSocketServerManager): WebSocketEventHandlers {
        if (!WebSocketEventHandlers.instance && wsServer) {
            WebSocketEventHandlers.instance = new WebSocketEventHandlers(wsServer);
        }
        return WebSocketEventHandlers.instance;
    }

    private setupEventListeners(): void {
        // Vehicle telemetry updates
        this.vehicleService.on('telemetry_update', (data) => {
            this.handleTelemetryUpdate(data).catch(err => {
                this.logger.error(`Telemetry update handler error: ${err.message}`);
            });
        });

        // Alert events
        this.alertService.on('alert_triggered', (data) => {
            this.handleAlertTriggered(data).catch(err => {
                this.logger.error(`Alert triggered handler error: ${err.message}`);
            });
        });

        this.alertService.on('alert_resolved', (data) => {
            this.handleAlertResolved(data).catch(err => {
                this.logger.error(`Alert resolved handler error: ${err.message}`);
            });
        });

        // Driver events
        this.driverService.on('driver_status_change', (data) => {
            this.handleDriverStatusChange(data).catch(err => {
                this.logger.error(`Driver status change handler error: ${err.message}`);
            });
        });

        this.driverService.on('driver_assigned', (data) => {
            this.handleDriverAssigned(data).catch(err => {
                this.logger.error(`Driver assigned handler error: ${err.message}`);
            });
        });

        // Fleet events
        this.fleetService.on('fleet_status_change', (data) => {
            this.handleFleetStatusChange(data).catch(err => {
                this.logger.error(`Fleet status change handler error: ${err.message}`);
            });
        });

        // Geofence events
        this.geofenceService.on('geofence_entry', (data) => {
            this.handleGeofenceEntry(data).catch(err => {
                this.logger.error(`Geofence entry handler error: ${err.message}`);
            });
        });

        this.geofenceService.on('geofence_exit', (data) => {
            this.handleGeofenceExit(data).catch(err => {
                this.logger.error(`Geofence exit handler error: ${err.message}`);
            });
        });

        // Maintenance events
        this.maintenanceService.on('maintenance_due', (data) => {
            this.handleMaintenanceDue(data).catch(err => {
                this.logger.error(`Maintenance due handler error: ${err.message}`);
            });
        });

        this.maintenanceService.on('maintenance_completed', (data) => {
            this.handleMaintenanceCompleted(data).catch(err => {
                this.logger.error(`Maintenance completed handler error: ${err.message}`);
            });
        });
    }

    private async handleTelemetryUpdate(data: VehicleTelemetryUpdate): Promise<void> {
        const { vehicleId, timestamp, ...telemetry } = data;

        // Broadcast to vehicle channel
        this.wsServer.broadcast(`vehicle:${vehicleId}`, {
            type: 'telemetry_update',
            data: {
                vehicleId,
                timestamp,
                telemetry
            }
        });

        // Broadcast to fleet channel if vehicle belongs to a fleet
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (vehicle?.fleetId) {
            this.wsServer.broadcast(`fleet:${vehicle.fleetId}`, {
                type: 'fleet_telemetry_update',
                data: {
                    vehicleId,
                    fleetId: vehicle.fleetId,
                    timestamp,
                    telemetry: {
                        speed: telemetry.speed,
                        fuelLevel: telemetry.fuelLevel,
                        engineStatus: telemetry.engineStatus
                    }
                }
            });
        }

        // Check for alerts based on telemetry
        await this.checkTelemetryAlerts(vehicleId, telemetry);
    }

    private async checkTelemetryAlerts(vehicleId: string, telemetry: TelemetryData): Promise<void> {
        const alerts = await this.alertService.checkTelemetryForAlerts(vehicleId, telemetry);

        for (const alert of alerts) {
            await this.alertService.triggerAlert({
                alertId: alert.alertId,
                vehicleId,
                type: alert.type,
                severity: alert.severity,
                message: alert.message,
                data: telemetry,
                timestamp: new Date().toISOString()
            });
        }
    }

    private async handleAlertTriggered(data: AlertEvent): Promise<void> {
        const { alertId, vehicleId, type, severity, message, timestamp } = data;

        // Broadcast to vehicle channel
        this.wsServer.broadcast(`vehicle:${vehicleId}`, {
            type: 'alert_triggered',
            data: {
                alertId,
                vehicleId,
                type,
                severity,
                message,
                timestamp
            }
        });

        // Broadcast to fleet channel
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (vehicle?.fleetId) {
            this.wsServer.broadcast(`fleet:${vehicle.fleetId}`, {
                type: 'fleet_alert_triggered',
                data: {
                    alertId,
                    vehicleId,
                    fleetId: vehicle.fleetId,
                    type,
                    severity,
                    message,
                    timestamp
                }
            });
        }

        // Send notifications to relevant users
        await this.sendAlertNotifications(data);
    }

    private async handleAlertResolved(data: AlertEvent): Promise<void> {
        const { alertId, vehicleId, type, timestamp } = data;

        // Broadcast to vehicle channel
        this.wsServer.broadcast(`vehicle:${vehicleId}`, {
            type: 'alert_resolved',
            data: {
                alertId,
                vehicleId,
                type,
                timestamp
            }
        });

        // Broadcast to fleet channel
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (vehicle?.fleetId) {
            this.wsServer.broadcast(`fleet:${vehicle.fleetId}`, {
                type: 'fleet_alert_resolved',
                data: {
                    alertId,
                    vehicleId,
                    fleetId: vehicle.fleetId,
                    type,
                    timestamp
                }
            });
        }
    }

    private async sendAlertNotifications(alert: AlertEvent): Promise<void> {
        const { vehicleId, type, severity, message } = alert;

        // Get vehicle and fleet info
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (!vehicle) return;

        // Get fleet managers
        const fleetManagers = await this.fleetService.getFleetManagers(vehicle.fleetId);

        // Get vehicle owner
        const owner = await this.vehicleService.getVehicleOwner(vehicleId);

        // Create notification
        const notification = {
            title: `Alert: ${type}`,
            message: `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber}): ${message}`,
            type: 'alert',
            severity,
            data: {
                alertId: alert.alertId,
                vehicleId,
                fleetId: vehicle.fleetId,
                type,
                timestamp: alert.timestamp
            },
            actions: [
                {
                    label: 'View Vehicle',
                    url: `/vehicles/${vehicleId}`
                },
                {
                    label: 'View Alert',
                    url: `/alerts/${alert.alertId}`
                }
            ]
        };

        // Send to fleet managers
        for (const manager of fleetManagers) {
            await this.notificationService.sendNotification(manager.userId, notification);
        }

        // Send to owner
        if (owner && !fleetManagers.some(m => m.userId === owner.userId)) {
            await this.notificationService.sendNotification(owner.userId, notification);
        }
    }

    private async handleDriverStatusChange(data: DriverStatusChange): Promise<void> {
        const { driverId, status, timestamp } = data;

        // Broadcast to driver channel
        this.wsServer.broadcast(`driver:${driverId}`, {
            type: 'driver_status_change',
            data: {
                driverId,
                status,
                timestamp
            }
        });

        // Broadcast to assigned vehicles
        const vehicles = await this.driverService.getAssignedVehicles(driverId);
        for (const vehicle of vehicles) {
            this.wsServer.broadcast(`vehicle:${vehicle.vehicleId}`, {
                type: 'driver_status_update',
                data: {
                    driverId,
                    vehicleId: vehicle.vehicleId,
                    status,
                    timestamp
                }
            });
        }
    }

    private async handleDriverAssigned(data: DriverAssignment): Promise<void> {
        const { driverId, vehicleId, timestamp } = data;

        // Broadcast to driver channel
        this.wsServer.broadcast(`driver:${driverId}`, {
            type: 'driver_assigned',
            data: {
                driverId,
                vehicleId,
                timestamp
            }
        });

        // Broadcast to vehicle channel
        this.wsServer.broadcast(`vehicle:${vehicleId}`, {
            type: 'driver_assigned',
            data: {
                driverId,
                vehicleId,
                timestamp
            }
        });

        // Send notification to driver
        const driver = await this.driverService.getDriverById(driverId);
        if (driver) {
            const vehicle = await this.vehicleService.getVehicleById(vehicleId);
            await this.notificationService.sendNotification(driver.userId, {
                title: 'Vehicle Assignment',
                message: `You have been assigned to ${vehicle?.make} ${vehicle?.model} (${vehicle?.registrationNumber})`,
                type: 'assignment',
                data: {
                    driverId,
                    vehicleId,
                    timestamp
                },
                actions: [
                    {
                        label: 'View Vehicle',
                        url: `/vehicles/${vehicleId}`
                    }
                ]
            });
        }
    }

    private async handleFleetStatusChange(data: FleetStatusChange): Promise<void> {
        const { fleetId, status, timestamp } = data;

        // Broadcast to fleet channel
        this.wsServer.broadcast(`fleet:${fleetId}`, {
            type: 'fleet_status_change',
            data: {
                fleetId,
                status,
                timestamp
            }
        });

        // Send notification to fleet managers
        const managers = await this.fleetService.getFleetManagers(fleetId);
        for (const manager of managers) {
            await this.notificationService.sendNotification(manager.userId, {
                title: 'Fleet Status Change',
                message: `Fleet ${fleetId} status changed to ${status}`,
                type: 'fleet_status',
                data: {
                    fleetId,
                    status,
                    timestamp
                },
                actions: [
                    {
                        label: 'View Fleet',
                        url: `/fleets/${fleetId}`
                    }
                ]
            });
        }
    }

    private async handleGeofenceEntry(data: GeofenceEvent): Promise<void> {
        const { vehicleId, geofenceId, timestamp } = data;

        // Broadcast to vehicle channel
        this.wsServer.broadcast(`vehicle:${vehicleId}`, {
            type: 'geofence_entry',
            data: {
                vehicleId,
                geofenceId,
                timestamp
            }
        });

        // Broadcast to fleet channel
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (vehicle?.fleetId) {
            this.wsServer.broadcast(`fleet:${vehicle.fleetId}`, {
                type: 'fleet_geofence_entry',
                data: {
                    vehicleId,
                    fleetId: vehicle.fleetId,
                    geofenceId,
                    timestamp
                }
            });
        }

        // Send notification to relevant users
        await this.sendGeofenceNotifications(data, 'entry');
    }

    private async handleGeofenceExit(data: GeofenceEvent): Promise<void> {
        const { vehicleId, geofenceId, timestamp } = data;

        // Broadcast to vehicle channel
        this.wsServer.broadcast(`vehicle:${vehicleId}`, {
            type: 'geofence_exit',
            data: {
                vehicleId,
                geofenceId,
                timestamp
            }
        });

        // Broadcast to fleet channel
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (vehicle?.fleetId) {
            this.wsServer.broadcast(`fleet:${vehicle.fleetId}`, {
                type: 'fleet_geofence_exit',
                data: {
                    vehicleId,
                    fleetId: vehicle.fleetId,
                    geofenceId,
                    timestamp
                }
            });
        }

        // Send notification to relevant users
        await this.sendGeofenceNotifications(data, 'exit');
    }

    private async sendGeofenceNotifications(event: GeofenceEvent, type: 'entry' | 'exit'): Promise<void> {
        const { vehicleId, geofenceId, timestamp } = event;

        // Get vehicle and geofence info
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (!vehicle) return;

        const geofence = await this.geofenceService.getGeofenceById(geofenceId);
        if (!geofence) return;

        // Get fleet managers
        const fleetManagers = await this.fleetService.getFleetManagers(vehicle.fleetId);

        // Get vehicle owner
        const owner = await this.vehicleService.getVehicleOwner(vehicleId);

        // Create notification
        const notification = {
            title: `Geofence ${type === 'entry' ? 'Entry' : 'Exit'}`,
            message: `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber}) has ${type === 'entry' ? 'entered' : 'exited'} geofence "${geofence.name}"`,
            type: 'geofence',
            data: {
                vehicleId,
                fleetId: vehicle.fleetId,
                geofenceId,
                geofenceName: geofence.name,
                type,
                timestamp
            },
            actions: [
                {
                    label: 'View Vehicle',
                    url: `/vehicles/${vehicleId}`
                },
                {
                    label: 'View Geofence',
                    url: `/geofences/${geofenceId}`
                }
            ]
        };

        // Send to fleet managers
        for (const manager of fleetManagers) {
            await this.notificationService.sendNotification(manager.userId, notification);
        }

        // Send to owner
        if (owner && !fleetManagers.some(m => m.userId === owner.userId)) {
            await this.notificationService.sendNotification(owner.userId, notification);
        }
    }

    private async handleMaintenanceDue(data: MaintenanceEvent): Promise<void> {
        const { vehicleId, maintenanceId, type, dueDate, timestamp } = data;

        // Broadcast to vehicle channel
        this.wsServer.broadcast(`vehicle:${vehicleId}`, {
            type: 'maintenance_due',
            data: {
                vehicleId,
                maintenanceId,
                type,
                dueDate,
                timestamp
            }
        });

        // Broadcast to fleet channel
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (vehicle?.fleetId) {
            this.wsServer.broadcast(`fleet:${vehicle.fleetId}`, {
                type: 'fleet_maintenance_due',
                data: {
                    vehicleId,
                    fleetId: vehicle.fleetId,
                    maintenanceId,
                    type,
                    dueDate,
                    timestamp
                }
            });
        }

        // Send notification to relevant users
        await this.sendMaintenanceNotifications(data, 'due');
    }

    private async handleMaintenanceCompleted(data: MaintenanceEvent): Promise<void> {
        const { vehicleId, maintenanceId, type, completionDate, timestamp } = data;

        // Broadcast to vehicle channel
        this.wsServer.broadcast(`vehicle:${vehicleId}`, {
            type: 'maintenance_completed',
            data: {
                vehicleId,
                maintenanceId,
                type,
                completionDate,
                timestamp
            }
        });

        // Broadcast to fleet channel
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (vehicle?.fleetId) {
            this.wsServer.broadcast(`fleet:${vehicle.fleetId}`, {
                type: 'fleet_maintenance_completed',
                data: {
                    vehicleId,
                    fleetId: vehicle.fleetId,
                    maintenanceId,
                    type,
                    completionDate,
                    timestamp
                }
            });
        }

        // Send notification to relevant users
        await this.sendMaintenanceNotifications(data, 'completed');
    }

    private async sendMaintenanceNotifications(event: MaintenanceEvent, status: 'due' | 'completed'): Promise<void> {
        const { vehicleId, maintenanceId, type, dueDate, completionDate, timestamp } = event;

        // Get vehicle info
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (!vehicle) return;

        // Get fleet managers
        const fleetManagers = await this.fleetService.getFleetManagers(vehicle.fleetId);

        // Get vehicle owner
        const owner = await this.vehicleService.getVehicleOwner(vehicleId);

        // Create notification
        const notification = {
            title: `Maintenance ${status === 'due' ? 'Due' : 'Completed'}`,
            message: `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber}) has ${status === 'due' ? 'maintenance due' : 'completed maintenance'} (${type})`,
            type: 'maintenance',
            data: {
                vehicleId,
                fleetId: vehicle.fleetId,
                maintenanceId,
                type,
                status,
                dueDate: status === 'due' ? dueDate : undefined,
                completionDate: status === 'completed' ? completionDate : undefined,
                timestamp
            },
            actions: [
                {
                    label: 'View Vehicle',
                    url: `/vehicles/${vehicleId}`
                },
                {
                    label: 'View Maintenance',
                    url: `/maintenance/${maintenanceId}`
                }
            ]
        };

        // Send to fleet managers
        for (const manager of fleetManagers) {
            await this.notificationService.sendNotification(manager.userId, notification);
        }

        // Send to owner
        if (owner && !fleetManagers.some(m => m.userId === owner.userId)) {
            await this.notificationService.sendNotification(owner.userId, notification);
        }
    }

    public async handleCommandExecution(command: CommandExecution): Promise<void> {
        const { commandId, vehicleId, type, status, result, timestamp } = command;

        // Broadcast to vehicle channel
        this.wsServer.broadcast(`vehicle:${vehicleId}`, {
            type: 'command_execution',
            data: {
                commandId,
                vehicleId,
                type,
                status,
                result,
                timestamp
            }
        });

        // Broadcast to fleet channel if vehicle belongs to a fleet
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (vehicle?.fleetId) {
            this.wsServer.broadcast(`fleet:${vehicle.fleetId}`, {
                type: 'fleet_command_execution',
                data: {
                    commandId,
                    vehicleId,
                    fleetId: vehicle.fleetId,
                    type,
                    status,
                    result,
                    timestamp
                }
            });
        }

        // Send notification to command initiator
        if (command.initiatorUserId) {
            await this.notificationService.sendNotification(command.initiatorUserId, {
                title: `Command ${status}`,
                message: `Your ${type} command to ${vehicle?.make} ${vehicle?.model} has been ${status}`,
                type: 'command',
                data: {
                    commandId,
                    vehicleId,
                    type,
                    status,
                    result,
                    timestamp
                },
                actions: [
                    {
                        label: 'View Vehicle',
                        url: `/vehicles/${vehicleId}`
                    },
                    {
                        label: 'View Command',
                        url: `/commands/${commandId}`
                    }
                ]
            });
        }
    }
}

interface VehicleTelemetryUpdate {
    vehicleId: string;
    timestamp: string;
    speed: number;
    fuelLevel: number;
    engineStatus: string;
    location: {
        lat: number;
        lng: number;
    };
    odometer: number;
    engineTemp: number;
    rpm: number;
    throttlePosition: number;
    brakeStatus: boolean;
    gearPosition: number;
    batteryVoltage: number;
    coolantTemp: number;
    oilPressure: number;
    tirePressures: number[];
    driverId: string;
    [key: string]: any;
}

interface TelemetryData {
    speed: number;
    fuelLevel: number;
    engineStatus: string;
    location: {
        lat: number;
        lng: number;
    };
    [key: string]: any;
}

interface AlertEvent {
    alertId: string;
    vehicleId: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    data?: any;
    timestamp: string;
}

interface DriverStatusChange {
    driverId: string;
    status: string;
    timestamp: string;
}

interface DriverAssignment {
    driverId: string;
    vehicleId: string;
    timestamp: string;
}

interface FleetStatusChange {
    fleetId: string;
    status: string;
    timestamp: string;
}

interface GeofenceEvent {
    vehicleId: string;
    geofenceId: string;
    timestamp: string;
}

interface MaintenanceEvent {
    vehicleId: string;
    maintenanceId: string;
    type: string;
    dueDate?: string;
    completionDate?: string;
    timestamp: string;
}

interface CommandExecution {
    commandId: string;
    vehicleId: string;
    type: string;
    status: 'pending' | 'success' | 'failed';
    result?: any;
    initiatorUserId?: string;
    timestamp: string;
}
```

### 3.3 Client-Side WebSocket Integration
```typescript
// src/websocket/websocket-client.ts
import { Logger } from '../utils/logger';
import { WebSocketConfig } from '../config/websocket-config';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export class WebSocketClient extends EventEmitter {
    private static instance: WebSocketClient;
    private ws: WebSocket | null = null;
    private logger: Logger;
    private config: WebSocketConfig;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number;
    private reconnectDelay: number;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private connectionTimeout: NodeJS.Timeout | null = null;
    private messageQueue: WebSocketMessage[] = [];
    private isConnecting: boolean = false;
    private clientId: string | null = null;
    private authToken: string | null = null;
    private subscriptions: Set<string> = new Set();
    private pendingRequests: Map<string, {
        resolve: (response: any) => void,
        reject: (error: Error) => void,
        timeout: NodeJS.Timeout
    }> = new Map();

    private constructor() {
        super();
        this.logger = new Logger('WebSocketClient');
        this.config = new WebSocketConfig();
        this.maxReconnectAttempts = this.config.maxReconnectAttempts;
        this.reconnectDelay = this.config.reconnectDelay;
    }

    public static getInstance(): WebSocketClient {
        if (!WebSocketClient.instance) {
            WebSocketClient.instance = new WebSocketClient();
        }
        return WebSocketClient.instance;
    }

    public async connect(authToken: string): Promise<void> {
        if (this.isConnected()) {
            this.logger.warn('Already connected to WebSocket server');
            return;
        }

        if (this.isConnecting) {
            this.logger.warn('Connection already in progress');
            return;
        }

        this.isConnecting = true;
        this.authToken = authToken;

        try {
            await this.createConnection();
        } catch (err) {
            this.isConnecting = false;
            throw err;
        }
    }

    private async createConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.logger.info('Connecting to WebSocket server...');

            // Clear any existing connection
            this.disconnect();

            // Create new WebSocket connection
            const wsUrl = new URL(this.config.url);
            const protocols = ['json', `Bearer ${this.authToken}`];

            try {
                this.ws = new WebSocket(wsUrl.toString(), protocols);
            } catch (err) {
                this.logger.error(`Failed to create WebSocket: ${err.message}`);
                this.isConnecting = false;
                reject(err);
                return;
            }

            // Set up event listeners
            this.ws.onopen = () => this.handleOpen(resolve);
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = (event) => this.handleClose(event);
            this.ws.onerror = (event) => this.handleError(event);

            // Set up connection timeout
            this.connectionTimeout = setTimeout(() => {
                if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                    this.logger.error('WebSocket connection timeout');
                    this.ws.close(1001, 'Connection timeout');
                    this.isConnecting = false;
                    reject(new Error('Connection timeout'));
                }
            }, this.config.connectionTimeout);
        });
    }

    private handleOpen(resolve: () => void): void {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }

        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.logger.info('WebSocket connection established');

        // Start heartbeat
        this.startHeartbeat();

        // Process any queued messages
        this.processMessageQueue();

        // Resubscribe to channels
        this.resubscribeAll();

        resolve();
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const message = JSON.parse(event.data) as WebSocketMessage;

            this.logger.debug(`Received message: ${message.type}`);

            // Handle system messages
            if (message.type === 'connection_ack') {
                this.clientId = message.data.clientId;
                this.logger.info(`Connection acknowledged. Client ID: ${this.clientId}`);
                this.emit('connected', message.data);
                return;
            }

            if (message.type === 'subscription_ack') {
                this.logger.info(`Subscribed to channel: ${message.data.channel}`);
                this.emit('subscribed', message.data);
                return;
            }

            if (message.type === 'unsubscription_ack') {
                this.logger.info(`Unsubscribed from channel: ${message.data.channel}`);
                this.emit('unsubscribed', message.data);
                return;
            }

            if (message.type === 'pong') {
                this.logger.debug('Received pong from server');
                return;
            }

            if (message.type === 'error') {
                this.logger.error(`Server error: ${message.data.message}`);
                this.emit('error', message.data);
                return;
            }

            // Handle response to request
            if (message.requestId && this.pendingRequests.has(message.requestId)) {
                const { resolve, reject, timeout } = this.pendingRequests.get(message.requestId)!;
                clearTimeout(timeout);
                this.pendingRequests.delete(message.requestId);

                if (message.type === 'error') {
                    reject(new Error(message.data.message));
                } else {
                    resolve(message.data);
                }
                return;
            }

            // Emit custom message
            this.emit(message.type, message.data);

            // Emit all messages for debugging
            this.emit('message', message);
        } catch (err) {
            this.logger.error(`Failed to process message: ${err.message}`);
        }
    }

    private handleClose(event: CloseEvent): void {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        this.logger.info(`WebSocket connection closed (Code: ${event.code}, Reason: ${event.reason})`);

        // Clean up pending requests
        this.pendingRequests.forEach(({ reject, timeout }) => {
            clearTimeout(timeout);
            reject(new Error('Connection closed'));
        });
        this.pendingRequests.clear();

        // Attempt to reconnect if this wasn't a normal closure
        if (event.code !== 1000) {
            this.scheduleReconnect();
        }

        this.emit('disconnected', { code: event.code, reason: event.reason });
    }

    private handleError(event: Event): void {
        this.logger.error(`WebSocket error: ${event.type}`);
        this.emit('error', event);
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
            this.emit('max_reconnects_reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        this.logger.info(`Attempting to reconnect in ${delay}ms (Attempt ${this.reconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.connect(this.authToken!).catch(err => {
                this.logger.error(`Reconnect failed: ${err.message}`);
                this.scheduleReconnect();
            });
        }, delay);
    }

    private startHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.send({
                    type: 'ping',
                    data: {
                        timestamp: new Date().toISOString()
                    }
                });
            }
        }, this.config.heartbeatInterval);
    }

    private processMessageQueue(): void {
        if (!this.isConnected()) {
            this.logger.warn('Cannot process message queue - not connected');
            return;
        }

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift()!;
            this.send(message);
        }
    }

    private resubscribeAll(): void {
        if (!this.isConnected()) {
            this.logger.warn('Cannot resubscribe - not connected');
            return;
        }

        this.subscriptions.forEach(channel => {
            this.subscribe(channel).catch(err => {
                this.logger.error(`Failed to resubscribe to ${channel}: ${err.message}`);
            });
        });
    }

    public isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    public disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Normal closure');
            this.ws = null;
        }

        this.clientId = null;
        this.isConnecting = false;
        this.logger.info('WebSocket disconnected');
    }

    public async subscribe(channel: string, params?: any): Promise<void> {
        if (!this.isConnected()) {
            throw new Error('Not connected to WebSocket server');
        }

        if (this.subscriptions.has(channel)) {
            this.logger.warn(`Already subscribed to channel: ${channel}`);
            return;
        }

        return new Promise((resolve, reject) => {
            const message: WebSocketMessage = {
                type: 'subscribe',
                data: {
                    channel,
                    params
                }
            };

            const requestId = uuidv4();
            message.requestId = requestId;

            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('Subscription timeout'));
            }, this.config.requestTimeout);

            this.pendingRequests.set(requestId, { resolve, reject, timeout });

            this.send(message);
            this.subscriptions.add(channel);
        });
    }

    public async unsubscribe(channel: string): Promise<void> {
        if (!this.isConnected()) {
            throw new Error('Not connected to WebSocket server');
        }

        if (!this.subscriptions.has(channel)) {
            this.logger.warn(`Not subscribed to channel: ${channel}`);
            return;
        }

        return new Promise((resolve, reject) => {
            const message: WebSocketMessage = {
                type: 'unsubscribe',
                data: {
                    channel
                }
            };

            const requestId = uuidv4();
            message.requestId = requestId;

            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('Unsubscription timeout'));
            }, this.config.requestTimeout);

            this.pendingRequests.set(requestId, { resolve, reject, timeout });

            this.send(message);
            this.subscriptions.delete(channel);
        });
    }

    public async request<T>(type: string, data: any): Promise<T> {
        if (!this.isConnected()) {
            throw new Error('Not connected to WebSocket server');
        }

        return new Promise((resolve, reject) => {
            const message: WebSocketMessage = {
                type,
                data
            };

            const requestId = uuidv4();
            message.requestId = requestId;

            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('Request timeout'));
            }, this.config.requestTimeout);

            this.pendingRequests.set(requestId, { resolve, reject, timeout });

            this.send(message);
        });
    }

    public send(message: WebSocketMessage): void {
        if (!this.isConnected()) {
            this.logger.warn('Cannot send message - not connected');
            this.messageQueue.push(message);
            return;
        }

        try {
            this.ws!.send(JSON.stringify(message));
            this.logger.debug(`Sent message: ${message.type}`);
        } catch (err) {
            this.logger.error(`Failed to send message: ${err.message}`);
            this.messageQueue.push(message);
        }
    }

    public getClientId(): string | null {
        return this.clientId;
    }

    public getSubscriptions(): string[] {
        return Array.from(this.subscriptions);
    }

    public getConnectionStatus(): WebSocketConnectionStatus {
        if (!this.ws) {
            return 'disconnected';
        }

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return 'connecting';
            case WebSocket.OPEN:
                return 'connected';
            case WebSocket.CLOSING:
                return 'disconnecting';
            case WebSocket.CLOSED:
                return 'disconnected';
            default:
                return 'disconnected';
        }
    }

    public setReconnectPolicy(maxAttempts: number, delay: number): void {
        this.maxReconnectAttempts = maxAttempts;
        this.reconnectDelay = delay;
        this.logger.info(`Reconnect policy set to ${maxAttempts} attempts with ${delay}ms delay`);
    }
}

interface WebSocketMessage {
    type: string;
    data: any;
    requestId?: string;
}

interface WebSocketConnectionStatus {
    status: 'connected' | 'connecting' | 'disconnected' | 'disconnecting';
    clientId?: string;
    reconnectAttempts?: number;
    lastError?: string;
}

// Usage example with React hooks
export function useWebSocket() {
    const [status, setStatus] = React.useState<WebSocketConnectionStatus>({
        status: 'disconnected'
    });
    const [subscriptions, setSubscriptions] = React.useState<string[]>([]);
    const wsClientRef = React.useRef<WebSocketClient | null>(null);

    React.useEffect(() => {
        const wsClient = WebSocketClient.getInstance();
        wsClientRef.current = wsClient;

        const updateStatus = () => {
            setStatus({
                status: wsClient.getConnectionStatus(),
                clientId: wsClient.getClientId() || undefined,
                reconnectAttempts: wsClient.reconnectAttempts
            });
            setSubscriptions(wsClient.getSubscriptions());
        };

        wsClient.on('connected', updateStatus);
        wsClient.on('disconnected', updateStatus);
        wsClient.on('subscribed', updateStatus);
        wsClient.on('unsubscribed', updateStatus);
        wsClient.on('max_reconnects_reached', updateStatus);

        updateStatus();

        return () => {
            wsClient.off('connected', updateStatus);
            wsClient.off('disconnected', updateStatus);
            wsClient.off('subscribed', updateStatus);
            wsClient.off('unsubscribed', updateStatus);
            wsClient.off('max_reconnects_reached', updateStatus);
        };
    }, []);

    const connect = React.useCallback(async (authToken: string) => {
        try {
            await wsClientRef.current?.connect(authToken);
        } catch (err) {
            console.error('WebSocket connection failed:', err);
        }
    }, []);

    const disconnect = React.useCallback(() => {
        wsClientRef.current?.disconnect();
    }, []);

    const subscribe = React.useCallback(async (channel: string, params?: any) => {
        try {
            await wsClientRef.current?.subscribe(channel, params);
        } catch (err) {
            console.error(`Failed to subscribe to ${channel}:`, err);
        }
    }, []);

    const unsubscribe = React.useCallback(async (channel: string) => {
        try {
            await wsClientRef.current?.unsubscribe(channel);
        } catch (err) {
            console.error(`Failed to unsubscribe from ${channel}:`, err);
        }
    }, []);

    const send = React.useCallback((message: WebSocketMessage) => {
        wsClientRef.current?.send(message);
    }, []);

    const request = React.useCallback(async <T>(type: string, data: any): Promise<T> => {
        return wsClientRef.current?.request<T>(type, data) || Promise.reject('Not connected');
    }, []);

    return {
        status,
        subscriptions,
        connect,
        disconnect,
        subscribe,
        unsubscribe,
        send,
        request,
        client: wsClientRef.current
    };
}
```

### 3.4 Room/Channel Management
```typescript
// src/websocket/channel-manager.ts
import { WebSocketServerManager } from './websocket-server';
import { Logger } from '../utils/logger';
import { RedisCache } from '../cache/redis-cache';
import { VehicleService } from '../services/vehicle-service';
import { FleetService } from '../services/fleet-service';
import { DriverService } from '../services/driver-service';
import { UserService } from '../services/user-service';

export class ChannelManager {
    private static instance: ChannelManager;
    private wsServer: WebSocketServerManager;
    private logger: Logger;
    private redisCache: RedisCache;
    private vehicleService: VehicleService;
    private fleetService: FleetService;
    private driverService: DriverService;
    private userService: UserService;
    private channelSubscribers: Map<string, Set<string>>;
    private userSubscriptions: Map<string, Set<string>>;
    private channelMetadata: Map<string, ChannelMetadata>;

    private constructor(wsServer: WebSocketServerManager) {
        this.wsServer = wsServer;
        this.logger = new Logger('ChannelManager');
        this.redisCache = RedisCache.getInstance();
        this.vehicleService = new VehicleService();
        this.fleetService = new FleetService();
        this.driverService = new DriverService();
        this.userService = new UserService();
        this.channelSubscribers = new Map();
        this.userSubscriptions = new Map();
        this.channelMetadata = new Map();

        this.initializeDefaultChannels();
    }

    public static getInstance(wsServer?: WebSocketServerManager): ChannelManager {
        if (!ChannelManager.instance && wsServer) {
            ChannelManager.instance = new ChannelManager(wsServer);
        }
        return ChannelManager.instance;
    }

    private initializeDefaultChannels(): void {
        // System channels
        this.createChannel('system:notifications', {
            description: 'System-wide notifications',
            public: true,
            persistent: true
        });

        this.createChannel('system:announcements', {
            description: 'System announcements',
            public: true,
            persistent: true
        });

        // User-specific channels
        this.createChannelPattern('user:{userId}', {
            description: 'User-specific channel',
            public: false,
            persistent: false,
            pattern: true
        });
    }

    public createChannel(channel: string, metadata: ChannelMetadata): void {
        if (this.channelMetadata.has(channel)) {
            this.logger.warn(`Channel ${channel} already exists`);
            return;
        }

        this.channelMetadata.set(channel, metadata);
        this.channelSubscribers.set(channel, new Set());
        this.logger.info(`Created channel: ${channel}`);
    }

    public createChannelPattern(pattern: string, metadata: ChannelMetadata): void {
        if (!pattern.includes('{')) {
            throw new Error('Pattern must contain a placeholder');
        }

        const basePattern = pattern.replace(/{[^}]+}/g, '*');
        this.createChannel(basePattern, {
            ...metadata,
            pattern: true
        });
    }

    public async subscribeClient(clientId: string, channel: string, params?: any): Promise<boolean> {
        // Check if channel exists
        const channelInfo = this.getChannelInfo(channel);
        if (!channelInfo) {
            this.logger.warn(`Channel ${channel} does not exist`);
            return false;
        }

        // Check if client is already subscribed
        const subscribers = this.channelSubscribers.get(channel);
        if (subscribers?.has(clientId)) {
            this.logger.debug(`Client ${clientId} already subscribed to ${channel}`);
            return true;
        }

        // Validate channel permissions
        const clientInfo = this.wsServer.getClientInfo(clientId);
        if (!clientInfo) {
            this.logger.warn(`Client ${clientId} not found`);
            return false;
        }

        if (!this.hasPermissionForChannel(clientInfo, channel, params)) {
            this.logger.warn(`Client ${clientId} has no permission for channel ${channel}`);
            return false;
        }

        // Add subscription
        if (!subscribers) {
            this.channelSubscribers.set(channel, new Set([clientId]));
        } else {
            subscribers.add(clientId);
        }

        // Track user subscriptions
        if (!this.userSubscriptions.has(clientInfo.userId)) {
            this.userSubscriptions.set(clientInfo.userId, new Set([channel]));
        } else {
            this.userSubscriptions.get(clientInfo.userId)!.add(channel);
        }

        this.logger.info(`Client ${clientId} subscribed to ${channel}`);

        // Send initial data if available
        await this.sendInitialData(clientId, channel, params);

        return true;
    }

    public async unsubscribeClient(clientId: string, channel: string): Promise<boolean> {
        const subscribers = this.channelSubscribers.get(channel);
        if (!subscribers || !subscribers.has(clientId)) {
            this.logger.debug(`Client ${clientId} not subscribed to ${channel}`);
            return false;
        }

        subscribers.delete(clientId);

        // Remove from user subscriptions
        const clientInfo = this.wsServer.getClientInfo(clientId);
        if (clientInfo) {
            const userSubs = this.userSubscriptions.get(clientInfo.userId);
            if (userSubs) {
                userSubs.delete(channel);
            }
        }

        this.logger.info(`Client ${clientId} unsubscribed from ${channel}`);
        return true;
    }

    public async unsubscribeClientFromAll(clientId: string): Promise<void> {
        const clientInfo = this.wsServer.getClientInfo(clientId);
        if (!clientInfo) return;

        // Get all channels the client is subscribed to
        const channels = this.getClientSubscriptions(clientId);

        // Unsubscribe from each channel
        for (const channel of channels) {
            await this.unsubscribeClient(clientId, channel);
        }
    }

    public async broadcast(channel: string, message: WebSocketMessage, options: BroadcastOptions = {}): Promise<number> {
        const { excludeClient, onlyUser, onlyRole } = options;
        let count = 0;

        const subscribers = this.channelSubscribers.get(channel);
        if (!subscribers || subscribers.size === 0) {
            this.logger.debug(`No subscribers for channel ${channel}`);
            return 0;
        }

        for (const clientId of subscribers) {
            // Skip excluded client
            if (excludeClient && clientId === excludeClient) {
                continue;
            }

            const clientInfo = this.wsServer.getClientInfo(clientId);
            if (!clientInfo) {
                continue;
            }

            // Filter by user if specified
            if (onlyUser && clientInfo.userId !== onlyUser) {
                continue;
            }

            // Filter by role if specified
            if (onlyRole && !clientInfo.roles.includes(onlyRole)) {
                continue;
            }

            // Send message
            if (this.wsServer.sendToClient(clientId, message)) {
                count++;
            }
        }

        this.logger.debug(`Broadcast to ${count} clients on channel ${channel}`);
        return count;
    }

    public async broadcastToUser(userId: string, message: WebSocketMessage): Promise<number> {
        const userSubs = this.userSubscriptions.get(userId);
        if (!userSubs || userSubs.size === 0) {
            this.logger.debug(`No subscriptions for user ${userId}`);
            return 0;
        }

        let count = 0;

        for (const channel of userSubs) {
            count += await this.broadcast(channel, message, { onlyUser: userId });
        }

        return count;
    }

    public async broadcastToRole(role: string, message: WebSocketMessage): Promise<number> {
        let count = 0;

        // Get all channels
        for (const [channel, subscribers] of this.channelSubscribers) {
            for (const clientId of subscribers) {
                const clientInfo = this.wsServer.getClientInfo(clientId);
                if (clientInfo && clientInfo.roles.includes(role)) {
                    if (this.wsServer.sendToClient(clientId, message)) {
                        count++;
                    }
                }
            }
        }

        return count;
    }

    public getChannelSubscribers(channel: string): string[] {
        const subscribers = this.channelSubscribers.get(channel);
        return subscribers ? Array.from(subscribers) : [];
    }

    public getClientSubscriptions(clientId: string): string[] {
        const clientInfo = this.wsServer.getClientInfo(clientId);
        if (!clientInfo) return [];

        const userSubs = this.userSubscriptions.get(clientInfo.userId);
        return userSubs ? Array.from(userSubs) : [];
    }

    public getChannelInfo(channel: string): ChannelMetadata | null {
        return this.channelMetadata.get(channel) || null;
    }

    public getAllChannels(): ChannelMetadata[] {
        return Array.from(this.channelMetadata.values());
    }

    public getChannelCount(): number {
        return this.channelMetadata.size;
    }

    public getSubscriberCount(channel: string): number {
        const subscribers = this.channelSubscribers.get(channel);
        return subscribers ? subscribers.size : 0;
    }

    private async hasPermissionForChannel(clientInfo: WebSocketClientInfo, channel: string, params?: any): Promise<boolean> {
        // System channels are public
        if (channel.startsWith('system:')) {
            const channelInfo = this.getChannelInfo(channel);
            return channelInfo?.public || false;
        }

        // User-specific channels
        if (channel.startsWith('user:')) {
            const userId = channel.split(':')[1];
            return clientInfo.userId === userId;
        }

        // Vehicle channels
        if (channel.startsWith('vehicle:')) {
            const vehicleId = channel.split(':')[1];
            return this.hasVehiclePermission(clientInfo, vehicleId);
        }

        // Fleet channels
        if (channel.startsWith('fleet:')) {
            const fleetId = channel.split(':')[1];
            return this.hasFleetPermission(clientInfo, fleetId);
        }

        // Driver channels
        if (channel.startsWith('driver:')) {
            const driverId = channel.split(':')[1];
            return this.hasDriverPermission(clientInfo, driverId);
        }

        // Check if channel is public
        const channelInfo = this.getChannelInfo(channel);
        if (channelInfo?.public) {
            return true;
        }

        // Default to false for unknown channels
        return false;
    }

    private async hasVehiclePermission(clientInfo: WebSocketClientInfo, vehicleId: string): Promise<boolean> {
        // Admins have access to all vehicles
        if (clientInfo.roles.includes('admin')) {
            return true;
        }

        // Check if user is the vehicle owner
        const owner = await this.vehicleService.getVehicleOwner(vehicleId);
        if (owner && owner.userId === clientInfo.userId) {
            return true;
        }

        // Check if user is a fleet manager for the vehicle's fleet
        const vehicle = await this.vehicleService.getVehicleById(vehicleId);
        if (vehicle?.fleetId) {
            const managers = await this.fleetService.getFleetManagers(vehicle.fleetId);
            if (managers.some(m => m.userId === clientInfo.userId)) {
                return true;
            }
        }

        // Check if user is assigned as the driver
        const assignments = await this.driverService.getDriverAssignments(clientInfo.userId);
        if (assignments.some(a => a.vehicleId === vehicleId)) {
            return true;
        }

        return false;
    }

    private async hasFleetPermission(clientInfo: WebSocketClientInfo, fleetId: string): Promise<boolean> {
        // Admins have access to all fleets
        if (clientInfo.roles.includes('admin')) {
            return true;
        }

        // Check if user is a fleet manager
        const managers = await this.fleetService.getFleetManagers(fleetId);
        if (managers.some(m => m.userId === clientInfo.userId)) {
            return true;
        }

        // Check if user is a driver in the fleet
        const drivers = await this.fleetService.getFleetDrivers(fleetId);
        if (drivers.some(d => d.userId === clientInfo.userId)) {
            return true;
        }

        return false;
    }

    private async hasDriverPermission(clientInfo: WebSocketClientInfo, driverId: string): Promise<boolean> {
        // Admins have access to all drivers
        if (clientInfo.roles.includes('admin')) {
            return true;
        }

        // Check if user is the driver
        const driver = await this.driverService.getDriverById(driverId);
        if (driver && driver.userId === clientInfo.userId) {
            return true;
        }

        // Check if user is a fleet manager for the driver's fleet
        const fleetId = await this.driverService.getDriverFleetId(driverId);
        if (fleetId) {
            const managers = await this.fleetService.getFleetManagers(fleetId);
            if (managers.some(m => m.userId === clientInfo.userId)) {
                return true;
            }
        }

        return false;
    }

    private async sendInitialData(clientId: string, channel: string, params?: any): Promise<void> {
        try {
            const clientInfo = this.wsServer.getClientInfo(clientId);
            if (!clientInfo) return;

            // Vehicle channels
            if (channel.startsWith('vehicle:')) {
                const vehicleId = channel.split(':')[1];
                const vehicle = await this.vehicleService.getVehicleById(vehicleId);
                if (vehicle) {
                    this.wsServer.sendToClient(clientId, {
                        type: 'initial_data',
                        data: {
                            channel,
                            vehicle
                        }
                    });
                }
                return;
            }

            // Fleet channels
            if (channel.startsWith('fleet:')) {
                const fleetId = channel.split(':')[1];
                const fleet = await this.fleetService.getFleetById(fleetId);
                if (fleet) {
                    this.wsServer.sendToClient(clientId, {
                        type: 'initial_data',
                        data: {
                            channel,
                            fleet
                        }
                    });
                }
                return;
            }

            // Driver channels
            if (channel.startsWith('driver:')) {
                const driverId = channel.split(':')[1];
                const driver = await this.driverService.getDriverById(driverId);
                if (driver) {
                    this.wsServer.sendToClient(clientId, {
                        type: 'initial_data',
                        data: {
                            channel,
                            driver
                        }
                    });
                }
                return;
            }

            // User channels
            if (channel.startsWith('user:')) {
                const userId = channel.split(':')[1];
                const user = await this.userService.getUserById(userId);
                if (user) {
                    this.wsServer.sendToClient(clientId, {
                        type: 'initial_data',
                        data: {
                            channel,
                            user
                        }
                    });
                }
                return;
            }

            // Custom channels can implement their own initial data logic
            this.logger.debug(`No initial data implementation for channel ${channel}`);
        } catch (err) {
            this.logger.error(`Failed to send initial data for ${channel} to ${clientId}: ${err.message}`);
        }
    }

    public async createDynamicChannel(pattern: string, params: any, metadata: ChannelMetadata): Promise<string> {
        // Replace placeholders in pattern with actual values
        let channel = pattern;
        for (const [key, value] of Object.entries(params)) {
            channel = channel.replace(`{${key}}`, value);
        }

        // Create the channel if it doesn't exist
        if (!this.channelMetadata.has(channel)) {
            this.createChannel(channel, metadata);
        }

        return channel;
    }

    public async getChannelStats(): Promise<ChannelStats> {
        const stats: ChannelStats = {
            totalChannels: this.getChannelCount(),
            channels: []
        };

        for (const [channel, metadata] of this.channelMetadata) {
            const subscriberCount = this.getSubscriberCount(channel);
            stats.channels.push({
                channel,
                subscriberCount,
                metadata
            });
        }

        return stats;
    }

    public async cleanupInactiveChannels(): Promise<number> {
        let count = 0;
        const now = new Date();

        for (const [channel, metadata] of this.channelMetadata) {
            if (!metadata.persistent) {
                const subscribers = this.channelSubscribers.get(channel);
                if (!subscribers || subscribers.size === 0) {
                    // Check if channel has been inactive for too long
                    const lastActivity = metadata.lastActivity || now;
                    if (now.getTime() - lastActivity.getTime() > 86400000) { // 24 hours
                        this.channelMetadata.delete(channel);
                        this.channelSubscribers.delete(channel);
                        count++;
                        this.logger.info(`Cleaned up inactive channel: ${channel}`);
                    }
                }
            }
        }

        return count;
    }
}

interface ChannelMetadata {
    description: string;
    public: boolean;
    persistent?: boolean;
    pattern?: boolean;
    lastActivity?: Date;
    [key: string]: any;
}

interface BroadcastOptions {
    excludeClient?: string;
    onlyUser?: string;
    onlyRole?: string;
}

interface ChannelStats {
    totalChannels: number;
    channels: {
        channel: string;
        subscriberCount: number;
        metadata: ChannelMetadata;
    }[];
}

interface WebSocketClientInfo {
    id: string;
    userId: string;
    ip: string;
    userAgent: string;
    connectedAt: Date;
    lastActivity: Date;
    subscriptions: string[];
    roles: string[];
}
```

### 3.5 Reconnection Logic
```typescript
// src/websocket/reconnection-manager.ts
import { WebSocketClient } from './websocket-client';
import { Logger } from '../utils/logger';
import { WebSocketConfig } from '../config/websocket-config';
import { EventEmitter } from 'events';

export class ReconnectionManager extends EventEmitter {
    private static instance: ReconnectionManager;
    private wsClient: WebSocketClient;
    private logger: Logger;
    private config: WebSocketConfig;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number;
    private reconnectDelay: number;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private backoffFactor: number;
    private jitterFactor: number;
    private connectionMonitor: NodeJS.Timeout | null = null;
    private lastConnectionTime: Date | null = null;
    private connectionStable: boolean = false;
    private connectionStabilityThreshold: number;
    private authToken: string | null = null;
    private connectionStrategies: ReconnectionStrategy[];

    private constructor(wsClient: WebSocketClient) {
        super();
        this.wsClient = wsClient;
        this.logger = new Logger('ReconnectionManager');
        this.config = new WebSocketConfig();
        this.maxReconnectAttempts = this.config.maxReconnectAttempts;
        this.reconnectDelay = this.config.reconnectDelay;
        this.backoffFactor = this.config.backoffFactor;
        this.jitterFactor = this.config.jitterFactor;
        this.connectionStabilityThreshold = this.config.connectionStabilityThreshold;

        // Initialize connection strategies
        this.connectionStrategies = [
            new ExponentialBackoffStrategy(this),
            new LinearBackoffStrategy(this),
            new FixedIntervalStrategy(this),
            new ImmediateReconnectStrategy(this)
        ];

        this.setupEventListeners();
    }

    public static getInstance(wsClient?: WebSocketClient): ReconnectionManager {
        if (!ReconnectionManager.instance && wsClient) {
            ReconnectionManager.instance = new ReconnectionManager(wsClient);
        }
        return ReconnectionManager.instance;
    }

    private setupEventListeners(): void {
        this.wsClient.on('connected', () => {
            this.handleConnectionSuccess();
        });

        this.wsClient.on('disconnected', (data) => {
            this.handleDisconnection(data);
        });

        this.wsClient.on('error', (err) => {
            this.logger.error(`WebSocket error: ${err instanceof Error ? err.message : String(err)}`);
        });
    }

    public async connect(authToken: string): Promise<void> {
        this.authToken = authToken;
        this.logger.info('Initiating WebSocket connection');

        try {
            await this.wsClient.connect(authToken);
        } catch (err) {
            this.logger.error(`Initial connection failed: ${err.message}`);
            this.scheduleReconnect();
        }
    }

    private handleConnectionSuccess(): void {
        this.reconnectAttempts = 0;
        this.lastConnectionTime = new Date();
        this.connectionStable = true;
        this.logger.info('WebSocket connection established successfully');

        // Start connection monitoring
        this.startConnectionMonitor();

        this.emit('connection_success');
    }

    private handleDisconnection(data: { code: number, reason: string }): void {
        this.connectionStable = false;
        this.logger.info(`WebSocket disconnected (Code: ${data.code}, Reason: ${data.reason})`);

        // Don't attempt to reconnect for normal closures
        if (data.code === 1000) {
            this.logger.info('Normal closure, no reconnection attempt');
            this.emit('connection_closed');
            return;
        }

        // Check if we should attempt to reconnect
        if (this.shouldReconnect(data.code)) {
            this.scheduleReconnect();
        } else {
            this.logger.info('Reconnection not attempted based on close code');
            this.emit('reconnection_aborted', data.code);
        }
    }

    private shouldReconnect(code: number): boolean {
        // Don't reconnect for these codes
        const noReconnectCodes = [
            1000, // Normal closure
            1001, // Going away
            1008, // Policy violation
            1011, // Internal error
            1012, // Service restart
            1013, // Try again later
            1015  // TLS handshake
        ];

        return !noReconnectCodes.includes(code);
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
            this.emit('max_reconnects_reached');
            return;
        }

        // Select reconnection strategy based on attempt count
        const strategy = this.selectReconnectionStrategy();
        const delay = strategy.calculateDelay(this.reconnectAttempts);

        this.reconnectAttempts++;
        this.logger.info(`Attempting reconnection in ${delay}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.reconnectTimer = setTimeout(() => {
            this.attemptReconnect();
        }, delay);
    }

    private selectReconnectionStrategy(): ReconnectionStrategy {
        // For first few attempts, use exponential backoff
        if (this.reconnectAttempts < 3) {
            return this.connectionStrategies[0]; // ExponentialBackoffStrategy
        }

        // For medium attempts, use linear backoff
        if (this.reconnectAttempts < 6) {
            return this.connectionStrategies[1]; // LinearBackoffStrategy
        }

        // For later attempts, use fixed interval
        return this.connectionStrategies[2]; // FixedIntervalStrategy
    }

    private async attemptReconnect(): Promise<void> {
        if (!this.authToken) {
            this.logger.error('No authentication token available for reconnection');
            this.emit('reconnection_failed', new Error('No authentication token'));
            return;
        }

        try {
            await this.wsClient.connect(this.authToken);
        } catch (err) {
            this.logger.error(`Reconnection attempt ${this.reconnectAttempts} failed: ${err.message}`);
            this.scheduleReconnect();
        }
    }

    private startConnectionMonitor(): void {
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
        }

        this.connectionMonitor = setInterval(() => {
            this.checkConnectionStability();
        }, this.config.connectionMonitorInterval);
    }

    private checkConnectionStability(): void {
        if (!this.lastConnectionTime) {
            return;
        }

        const now = new Date();
        const connectionDuration = now.getTime() - this.lastConnectionTime.getTime();

        // If connection has been stable for the threshold duration, consider it stable
        if (connectionDuration >= this.connectionStabilityThreshold && !this.connectionStable) {
            this.connectionStable = true;
            this.logger.info('Connection stability threshold reached');
            this.emit('connection_stable');
        }
    }

    public getConnectionStatus(): ConnectionStatus {
        return {
            connected: this.wsClient.isConnected(),
            reconnectAttempts: this.reconnectAttempts,
            lastConnectionTime: this.lastConnectionTime,
            connectionStable: this.connectionStable,
            currentStrategy: this.selectReconnectionStrategy().constructor.name
        };
    }

    public resetReconnectAttempts(): void {
        this.reconnectAttempts = 0;
        this.logger.info('Reconnection attempts reset');
    }

    public setReconnectPolicy(maxAttempts: number, initialDelay: number): void {
        this.maxReconnectAttempts = maxAttempts;
        this.reconnectDelay = initialDelay;
        this.logger.info(`Reconnect policy set to ${maxAttempts} attempts with ${initialDelay}ms initial delay`);
    }

    public setBackoffPolicy(factor: number, jitter: number): void {
        this.backoffFactor = factor;
        this.jitterFactor = jitter;
        this.logger.info(`Backoff policy set to factor ${factor} with jitter ${jitter}`);
    }

    public disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
            this.connectionMonitor = null;
        }

        this.wsClient.disconnect();
        this.logger.info('WebSocket disconnected by user');
    }

    public async forceReconnect(): Promise<void> {
        this.logger.info('Forcing WebSocket reconnection');
        this.disconnect();
        await this.scheduleImmediateReconnect();
    }

    private async scheduleImmediateReconnect(): Promise<void> {
        if (!this.authToken) {
            this.logger.error('No authentication token available for immediate reconnection');
            return;
        }

        try {
            await this.wsClient.connect(this.authToken);
        } catch (err) {
            this.logger.error(`Immediate reconnection failed: ${err.message}`);
            this.scheduleReconnect();
        }
    }
}

interface ConnectionStatus {
    connected: boolean;
    reconnectAttempts: number;
    lastConnectionTime: Date | null;
    connectionStable: boolean;
    currentStrategy: string;
}

interface ReconnectionStrategy {
    calculateDelay(attempt: number): number;
}

class ExponentialBackoffStrategy implements ReconnectionStrategy {
    private manager: ReconnectionManager;
    private baseDelay: number;
    private maxDelay: number;

    constructor(manager: ReconnectionManager) {
        this.manager = manager;
        this.baseDelay = manager.reconnectDelay;
        this.maxDelay = 30000; // 30 seconds
    }

    calculateDelay(attempt: number): number {
        // Exponential backoff with jitter
        const delay = Math.min(
            this.baseDelay * Math.pow(this.manager.backoffFactor, attempt),
            this.maxDelay
        );

        // Add jitter to avoid thundering herd
        const jitter = delay * this.manager.jitterFactor * (Math.random() * 2 - 1);
        return Math.max(1000, delay + jitter);
    }
}

class LinearBackoffStrategy implements ReconnectionStrategy {
    private manager: ReconnectionManager;
    private baseDelay: number;
    private maxDelay: number;

    constructor(manager: ReconnectionManager) {
        this.manager = manager;
        this.baseDelay = manager.reconnectDelay;
        this.maxDelay = 15000; // 15 seconds
    }

    calculateDelay(attempt: number): number {
        // Linear backoff with jitter
        const delay = Math.min(
            this.baseDelay + (attempt * 1000),
            this.maxDelay
        );

        // Add jitter
        const jitter = delay * this.manager.jitterFactor * (Math.random() * 2 - 1);
        return Math.max(1000, delay + jitter);
    }
}

class FixedIntervalStrategy implements ReconnectionStrategy {
    private manager: ReconnectionManager;
    private delay: number;

    constructor(manager: ReconnectionManager) {
        this.manager = manager;
        this.delay = 5000; // 5 seconds
    }

    calculateDelay(): number {
        // Fixed interval with jitter
        const jitter = this.delay * this.manager.jitterFactor * (Math.random() * 2 - 1);
        return Math.max(1000, this.delay + jitter);
    }
}

class ImmediateReconnectStrategy implements ReconnectionStrategy {
    calculateDelay(): number {
        return 0; // Immediate reconnection
    }
}

// Usage example with React
export function useWebSocketReconnection() {
    const [status, setStatus] = React.useState<ConnectionStatus>({
        connected: false,
        reconnectAttempts: 0,
        lastConnectionTime: null,
        connectionStable: false,
        currentStrategy: ''
    });

    const reconnectionManagerRef = React.useRef<ReconnectionManager | null>(null);

    React.useEffect(() => {
        const wsClient = WebSocketClient.getInstance();
        const reconnectionManager = ReconnectionManager.getInstance(wsClient);
        reconnectionManagerRef.current = reconnectionManager;

        const updateStatus = () => {
            setStatus(reconnectionManager.getConnectionStatus());
        };

        reconnectionManager.on('connection_success', updateStatus);
        reconnectionManager.on('connection_closed', updateStatus);
        reconnectionManager.on('max_reconnects_reached', updateStatus);
        reconnectionManager.on('reconnection_aborted', updateStatus);
        reconnectionManager.on('connection_stable', updateStatus);

        updateStatus();

        return () => {
            reconnectionManager.off('connection_success', updateStatus);
            reconnectionManager.off('connection_closed', updateStatus);
            reconnectionManager.off('max_reconnects_reached', updateStatus);
            reconnectionManager.off('reconnection_aborted', updateStatus);
            reconnectionManager.off('connection_stable', updateStatus);
        };
    }, []);

    const connect = React.useCallback(async (authToken: string) => {
        await reconnectionManagerRef.current?.connect(authToken);
    }, []);

    const disconnect = React.useCallback(() => {
        reconnectionManagerRef.current?.disconnect();
    }, []);

    const forceReconnect = React.useCallback(async () => {
        await reconnectionManagerRef.current?.forceReconnect();
    }, []);

    const getReconnectionManager = React.useCallback(() => {
        return reconnectionManagerRef.current;
    }, []);

    return {
        status,
        connect,
        disconnect,
        forceReconnect,
        getReconnectionManager
    };
}
```

---

## AI/ML Capabilities
*(250+ lines with 4 Python implementations)*

### 4.1 Predictive Model Training
```python
# src/ml/predictive_model_trainer.py
import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_regression
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from catboost import CatBoostRegressor
import joblib
import mlflow
import mlflow.sklearn
from mlflow.models.signature import infer_signature
from typing import Tuple, Dict, List, Optional
import logging
from logging.handlers import RotatingFileHandler
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('predictive_model_trainer.log', maxBytes=5*1024*1024, backupCount=2),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class PredictiveModelTrainer:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'telematics'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', ''),
            'port': os.getenv('DB_PORT', '5432')
        }

        self.mlflow_config = {
            'tracking_uri': os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000'),
            'experiment_name': os.getenv('MLFLOW_EXPERIMENT_NAME', 'telematics-predictive-models')
        }

        self.models_config = {
            'maintenance': {
                'target': 'days_until_maintenance',
                'features': [
                    'vehicle_age_days', 'odometer', 'engine_hours',
                    'fuel_consumed', 'avg_speed', 'max_speed',
                    'hard_braking_count', 'hard_acceleration_count',
                    'idle_time', 'trip_count', 'last_maintenance_days_ago',
                    'make', 'model', 'year', 'fuel_type'
                ],
                'categorical_features': ['make', 'model', 'fuel_type'],
                'test_size': 0.2,
                'random_state': 42,
                'models': [
                    {
                        'name': 'RandomForest',
                        'model': RandomForestRegressor(
                            n_estimators=200,
                            max_depth=10,
                            min_samples_split=5,
                            min_samples_leaf=2,
                            random_state=42
                        )
                    },
                    {
                        'name': 'GradientBoosting',
                        'model': GradientBoostingRegressor(
                            n_estimators=200,
                            learning_rate=0.05,
                            max_depth=6,
                            random_state=42
                        )
                    },
                    {
                        'name': 'XGBoost',
                        'model': XGBRegressor(
                            n_estimators=200,
                            learning_rate=0.05,
                            max_depth=6,
                            random_state=42,
                            objective='reg:squarederror'
                        )
                    },
                    {
                        'name': 'LightGBM',
                        'model': LGBMRegressor(
                            n_estimators=200,
                            learning_rate=0.05,
                            max_depth=6,
                            random_state=42
                        )
                    },
                    {
                        'name': 'CatBoost',
                        'model': CatBoostRegressor(
                            iterations=200,
                            learning_rate=0.05,
                            depth=6,
                            random_state=42,
                            verbose=0
                        )
                    }
                ]
            },
            'fuel_efficiency': {
                'target': 'fuel_efficiency',
                'features': [
                    'vehicle_age_days', 'odometer', 'engine_hours',
                    'avg_speed', 'max_speed', 'hard_braking_count',
                    'hard_acceleration_count', 'idle_time', 'trip_count',
                    'load_weight', 'terrain_type', 'driver_experience',
                    'make', 'model', 'year', 'fuel_type', 'transmission_type'
                ],
                'categorical_features': ['make', 'model', 'fuel_type', 'transmission_type', 'terrain_type'],
                'test_size': 0.2,
                'random_state': 42,
                'models': [
                    {
                        'name': 'RandomForest',
                        'model': RandomForestRegressor(
                            n_estimators=150,
                            max_depth=8,
                            min_samples_split=5,
                            random_state=42
                        )
                    },
                    {
                        'name': 'XGBoost',
                        'model': XGBRegressor(
                            n_estimators=150,
                            learning_rate=0.05,
                            max_depth=6,
                            random_state=42,
                            objective='reg:squarederror'
                        )
                    }
                ]
            },
            'driver_behavior': {
                'target': 'safety_score',
                'features': [
                    'avg_speed', 'max_speed', 'hard_braking_count',
                    'hard_acceleration_count', 'idle_time', 'trip_count',
                    'night_driving_hours', 'phone_usage_count',
                    'seatbelt_usage', 'driver_experience', 'age',
                    'vehicle_make', 'vehicle_model', 'vehicle_year'
                ],
                'categorical_features': ['vehicle_make', 'vehicle_model'],
                'test_size': 0.2,
                'random_state': 42,
                'models': [
                    {
                        'name': 'RandomForest',
                        'model': RandomForestRegressor(
                            n_estimators=100,
                            max_depth=6,
                            random_state=42
                        )
                    },
                    {
                        'name': 'GradientBoosting',
                        'model': GradientBoostingRegressor(
                            n_estimators=100,
                            learning_rate=0.1,
                            max_depth=4,
                            random_state=42
                        )
                    }
                ]
            }
        }

        # Initialize MLflow
        mlflow.set_tracking_uri(self.mlflow_config['tracking_uri'])
        mlflow.set_experiment(self.mlflow_config['experiment_name'])

    def fetch_training_data(self, model_type: str, days: int = 365) -> pd.DataFrame:
        """Fetch training data from the database for the specified model type."""
        config = self.models_config.get(model_type)
        if not config:
            raise ValueError(f"Unknown model type: {model_type}")

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        query = self._build_query(model_type, start_date, end_date)

        try:
            with psycopg2.connect(**self.db_config) as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    logger.info(f"Fetching training data for {model_type} from {start_date} to {end_date}")
                    cursor.execute(query)
                    data = cursor.fetchall()

                    if not data:
                        logger.warning("No data returned from query")
                        return pd.DataFrame()

                    df = pd.DataFrame(data)

                    # Convert date fields to datetime
                    date_columns = [col for col