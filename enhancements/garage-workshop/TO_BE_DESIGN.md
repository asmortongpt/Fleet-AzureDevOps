# TO_BE_DESIGN.md - Garage-Workshop Module Enhancement
**Version:** 2.3.0
**Last Updated:** 2023-11-15
**Author:** Enterprise Architecture Team

---

## Executive Vision (120 lines)

### Strategic Transformation Goals

The enhanced garage-workshop module represents a paradigm shift in automotive service management, transitioning from a transactional system to an intelligent, predictive maintenance ecosystem. Our strategic vision encompasses four key transformation pillars:

1. **Predictive Maintenance Revolution**
   - Implement AI-driven failure prediction models that analyze vehicle telemetry, service history, and environmental factors
   - Reduce unplanned downtime by 65% through early detection of component wear patterns
   - Create a "digital twin" for each vehicle that evolves with its service history

2. **Customer Experience Transformation**
   - Develop a unified omnichannel experience across web, mobile, and in-person interactions
   - Implement real-time service tracking with augmented reality vehicle status visualization
   - Create personalized maintenance recommendations based on driving patterns and vehicle usage

3. **Operational Excellence**
   - Achieve 40% reduction in service cycle time through intelligent job scheduling
   - Implement dynamic resource allocation based on technician skills and availability
   - Automate 80% of routine administrative tasks through robotic process automation

4. **Data-Driven Decision Making**
   - Establish a real-time analytics dashboard for all operational metrics
   - Implement predictive staffing models based on historical demand patterns
   - Create a knowledge graph connecting vehicles, parts, technicians, and service procedures

### Business Model Innovation

The enhanced system enables three new revenue streams:

1. **Subscription-Based Maintenance Programs**
   - Tiered service plans with predictive maintenance included
   - Usage-based pricing models for commercial fleets
   - Loyalty programs with gamification elements

2. **Value-Added Services**
   - Remote diagnostics and over-the-air updates
   - Connected car integration with manufacturer APIs
   - Environmental impact reporting for corporate fleets

3. **Data Monetization**
   - Anonymized vehicle health insights for manufacturers
   - Parts failure analytics for suppliers
   - Driving behavior data for insurance partners

### Competitive Advantages

**Technological Leadership:**
- First in industry to implement federated learning for vehicle diagnostics
- Patented predictive maintenance algorithms with 92% accuracy
- Edge computing capabilities for real-time analysis without cloud dependency

**Customer-Centric Differentiation:**
- 24/7 virtual service advisor with natural language processing
- Augmented reality vehicle inspection guides
- Personalized maintenance videos for each vehicle

**Operational Superiority:**
- 30% faster service turnaround through AI-optimized scheduling
- 25% reduction in parts inventory through predictive stocking
- 40% lower operational costs through automation

### Long-Term Roadmap

**Phase 1: Foundation (0-6 months)**
- Core system modernization with microservices architecture
- Basic predictive maintenance capabilities
- Initial PWA implementation
- Core third-party integrations

**Phase 2: Intelligence (6-18 months)**
- Advanced AI/ML models for failure prediction
- Real-time operational analytics
- Complete omnichannel experience
- Initial gamification elements

**Phase 3: Ecosystem (18-36 months)**
- Industry-wide data sharing platform
- Autonomous service scheduling
- Blockchain-based service history
- AR/VR service experiences

**Phase 4: Transformation (36+ months)**
- Self-healing vehicle capabilities
- Predictive manufacturing for parts suppliers
- AI-driven service innovation
- Complete digital-physical integration

### Organizational Impact

**Cultural Transformation:**
- Shift from reactive to predictive service mindset
- Data literacy programs for all staff
- Agile service development processes

**Skill Development:**
- AI/ML training for senior technicians
- Data analysis certification for managers
- Customer experience design workshops

**Process Evolution:**
- Continuous delivery pipeline for service enhancements
- Automated compliance monitoring
- Real-time performance feedback loops

### Success Metrics

**Financial:**
- 22% increase in average revenue per customer
- 18% reduction in operational costs
- 35% improvement in customer lifetime value

**Operational:**
- 40% reduction in service cycle time
- 65% decrease in unplanned downtime
- 95% first-time fix rate

**Customer:**
- 45% increase in Net Promoter Score
- 70% reduction in customer complaints
- 80% adoption of digital service channels

**Innovation:**
- 12 new patents filed in first 24 months
- 3 industry awards for innovation
- 25% of revenue from new services

---

## Performance Enhancements (320 lines)

### Redis Caching Layer Implementation

```typescript
// src/cache/redisCache.ts
import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/logger';
import { CacheConfig } from '../config/cacheConfig';

export class RedisCache {
    private static instance: RedisCache;
    private client: RedisClientType;
    private logger: Logger;
    private config: CacheConfig;
    private isConnected: boolean = false;

    private constructor() {
        this.logger = new Logger('RedisCache');
        this.config = new CacheConfig();
        this.initializeClient();
    }

    public static getInstance(): RedisCache {
        if (!RedisCache.instance) {
            RedisCache.instance = new RedisCache();
        }
        return RedisCache.instance;
    }

    private async initializeClient(): Promise<void> {
        try {
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
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                this.logger.info('Redis client connected');
                this.isConnected = true;
            });

            this.client.on('reconnecting', () => {
                this.logger.info('Redis client reconnecting');
                this.isConnected = false;
            });

            await this.client.connect();
            await this.setupCacheDefaults();
        } catch (err) {
            this.logger.error(`Failed to initialize Redis client: ${err.message}`);
            throw err;
        }
    }

    private async setupCacheDefaults(): Promise<void> {
        try {
            // Set default cache TTL if not configured
            if (!(await this.client.get('default_ttl'))) {
                await this.client.set('default_ttl', this.config.defaultTtl.toString());
            }

            // Configure cache eviction policy
            await this.client.configSet('maxmemory-policy', 'allkeys-lru');
            await this.client.configSet('maxmemory', this.config.maxMemory);

            this.logger.info('Redis cache defaults configured successfully');
        } catch (err) {
            this.logger.error(`Failed to setup cache defaults: ${err.message}`);
        }
    }

    public async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected) {
            this.logger.warn('Redis not connected, returning null');
            return null;
        }

        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (err) {
            this.logger.error(`Error getting key ${key}: ${err.message}`);
            return null;
        }
    }

    public async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
        if (!this.isConnected) {
            this.logger.warn('Redis not connected, cache set failed');
            return false;
        }

        try {
            const stringValue = JSON.stringify(value);
            const actualTtl = ttl || this.config.defaultTtl;

            if (actualTtl > 0) {
                await this.client.setEx(key, actualTtl, stringValue);
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
        if (!this.isConnected) {
            this.logger.warn('Redis not connected, cache delete failed');
            return false;
        }

        try {
            const result = await this.client.del(key);
            return result === 1;
        } catch (err) {
            this.logger.error(`Error deleting key ${key}: ${err.message}`);
            return false;
        }
    }

    public async getWithCacheFallback<T>(
        key: string,
        fallbackFn: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        try {
            const cachedValue = await this.get<T>(key);
            if (cachedValue !== null) {
                this.logger.debug(`Cache hit for key ${key}`);
                return cachedValue;
            }

            this.logger.debug(`Cache miss for key ${key}, executing fallback`);
            const freshValue = await fallbackFn();

            if (freshValue !== null && freshValue !== undefined) {
                await this.set(key, freshValue, ttl);
            }

            return freshValue;
        } catch (err) {
            this.logger.error(`Error in getWithCacheFallback for key ${key}: ${err.message}`);
            return fallbackFn();
        }
    }

    public async clearNamespace(namespace: string): Promise<number> {
        if (!this.isConnected) {
            this.logger.warn('Redis not connected, clear namespace failed');
            return 0;
        }

        try {
            const pattern = `${namespace}:*`;
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) return 0;

            const result = await this.client.del(keys);
            this.logger.info(`Cleared ${result} keys from namespace ${namespace}`);
            return result;
        } catch (err) {
            this.logger.error(`Error clearing namespace ${namespace}: ${err.message}`);
            return 0;
        }
    }

    public async getCacheStats(): Promise<{
        keys: number;
        memoryUsage: number;
        hitRate: number;
    }> {
        if (!this.isConnected) {
            this.logger.warn('Redis not connected, cannot get stats');
            return { keys: 0, memoryUsage: 0, hitRate: 0 };
        }

        try {
            const keys = await this.client.dbSize();
            const info = await this.client.info('memory');
            const memoryUsage = parseInt(info.split('\r\n').find(line => line.startsWith('used_memory:'))?.split(':')[1] || '0');

            const stats = await this.client.info('stats');
            const hits = parseInt(stats.split('\r\n').find(line => line.startsWith('keyspace_hits:'))?.split(':')[1] || '0');
            const misses = parseInt(stats.split('\r\n').find(line => line.startsWith('keyspace_misses:'))?.split(':')[1] || '0');
            const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;

            return {
                keys,
                memoryUsage,
                hitRate
            };
        } catch (err) {
            this.logger.error(`Error getting cache stats: ${err.message}`);
            return { keys: 0, memoryUsage: 0, hitRate: 0 };
        }
    }

    public async close(): Promise<void> {
        try {
            if (this.isConnected) {
                await this.client.quit();
                this.isConnected = false;
                this.logger.info('Redis client closed successfully');
            }
        } catch (err) {
            this.logger.error(`Error closing Redis client: ${err.message}`);
        }
    }
}
```

### Database Query Optimization

```typescript
// src/database/queryOptimizer.ts
import { Pool, PoolClient, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { DatabaseConfig } from '../config/databaseConfig';
import { RedisCache } from '../cache/redisCache';

export class QueryOptimizer {
    private static instance: QueryOptimizer;
    private pool: Pool;
    private logger: Logger;
    private config: DatabaseConfig;
    private cache: RedisCache;

    private constructor() {
        this.logger = new Logger('QueryOptimizer');
        this.config = new DatabaseConfig();
        this.cache = RedisCache.getInstance();
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
            user: this.config.username,
            host: this.config.host,
            database: this.config.database,
            password: this.config.password,
            port: this.config.port,
            max: this.config.maxConnections,
            idleTimeoutMillis: this.config.idleTimeout,
            connectionTimeoutMillis: this.config.connectionTimeout,
            ssl: this.config.sslEnabled ? {
                rejectUnauthorized: false
            } : false
        });

        this.pool.on('error', (err) => {
            this.logger.error(`Unexpected error on idle client: ${err.message}`);
        });

        this.pool.on('connect', () => {
            this.logger.debug('New database connection established');
        });
    }

    public async executeQuery<T>(
        query: string,
        params: any[] = [],
        options: {
            cacheKey?: string;
            cacheTtl?: number;
            useReadReplica?: boolean;
            explain?: boolean;
        } = {}
    ): Promise<T[]> {
        const { cacheKey, cacheTtl, useReadReplica, explain } = options;

        // Check cache first if cacheKey is provided
        if (cacheKey) {
            const cachedResult = await this.cache.get<T[]>(cacheKey);
            if (cachedResult) {
                this.logger.debug(`Cache hit for query with key ${cacheKey}`);
                return cachedResult;
            }
        }

        let client: PoolClient | null = null;
        try {
            // Use read replica if specified and available
            const targetPool = useReadReplica && this.config.readReplicaEnabled
                ? this.getReadReplicaPool()
                : this.pool;

            client = await targetPool.connect();

            // Execute EXPLAIN if requested
            if (explain) {
                const explainQuery = `EXPLAIN ANALYZE ${query}`;
                const explainResult = await client.query(explainQuery, params);
                this.logger.debug(`Query execution plan:\n${explainResult.rows.map(r => r['QUERY PLAN']).join('\n')}`);
            }

            const startTime = Date.now();
            const result = await client.query(query, params);
            const executionTime = Date.now() - startTime;

            this.logger.debug(`Query executed in ${executionTime}ms: ${query.substring(0, 100)}...`);

            // Cache the result if cacheKey is provided
            if (cacheKey && result.rows.length > 0) {
                await this.cache.set(cacheKey, result.rows, cacheTtl);
            }

            return result.rows as T[];
        } catch (err) {
            this.logger.error(`Error executing query: ${err.message}\nQuery: ${query}\nParams: ${JSON.stringify(params)}`);
            throw err;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    public async executeTransaction<T>(
        queries: Array<{
            text: string;
            values: any[];
        }>,
        options: {
            isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
        } = {}
    ): Promise<T[]> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Set transaction isolation level if specified
            if (options.isolationLevel) {
                await client.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
            }

            const results: T[] = [];

            for (const query of queries) {
                const result = await client.query(query.text, query.values);
                results.push(result.rows as T);
            }

            await client.query('COMMIT');
            return results;
        } catch (err) {
            await client.query('ROLLBACK');
            this.logger.error(`Transaction failed: ${err.message}`);
            throw err;
        } finally {
            client.release();
        }
    }

    public async getVehicleServiceHistory(vehicleId: string): Promise<any[]> {
        const cacheKey = `vehicle_service_history:${vehicleId}`;
        const cacheTtl = 3600; // 1 hour cache

        const query = `
            WITH service_stats AS (
                SELECT
                    s.service_id,
                    s.vehicle_id,
                    s.service_date,
                    s.status,
                    s.estimated_duration,
                    s.actual_duration,
                    s.total_cost,
                    s.technician_id,
                    t.name as technician_name,
                    t.specialization,
                    json_agg(
                        json_build_object(
                            'part_id', p.part_id,
                            'part_name', p.name,
                            'quantity', sp.quantity,
                            'unit_price', sp.unit_price,
                            'total_price', sp.quantity * sp.unit_price
                        )
                    ) as parts,
                    json_agg(
                        json_build_object(
                            'labor_id', l.labor_id,
                            'description', l.description,
                            'hours', sl.hours,
                            'rate', sl.rate,
                            'total_price', sl.hours * sl.rate
                        )
                    ) as labor
                FROM services s
                LEFT JOIN service_parts sp ON s.service_id = sp.service_id
                LEFT JOIN parts p ON sp.part_id = p.part_id
                LEFT JOIN service_labor sl ON s.service_id = sl.service_id
                LEFT JOIN labor l ON sl.labor_id = l.labor_id
                LEFT JOIN technicians t ON s.technician_id = t.technician_id
                WHERE s.vehicle_id = $1
                GROUP BY s.service_id, t.name, t.specialization
            )
            SELECT
                ss.*,
                v.make,
                v.model,
                v.year,
                v.license_plate,
                v.mileage,
                v.vin,
                (
                    SELECT json_agg(
                        json_build_object(
                            'code', c.code,
                            'description', c.description,
                            'severity', c.severity,
                            'status', sc.status
                        )
                    )
                    FROM service_codes sc
                    JOIN codes c ON sc.code_id = c.code_id
                    WHERE sc.service_id = ss.service_id
                ) as diagnostic_codes,
                (
                    SELECT json_agg(
                        json_build_object(
                            'document_id', d.document_id,
                            'document_type', d.document_type,
                            'url', d.url,
                            'upload_date', d.upload_date
                        )
                    )
                    FROM documents d
                    WHERE d.service_id = ss.service_id
                ) as documents
            FROM service_stats ss
            JOIN vehicles v ON ss.vehicle_id = v.vehicle_id
            ORDER BY ss.service_date DESC
        `;

        return this.executeQuery(query, [vehicleId], { cacheKey, cacheTtl });
    }

    public async getTechnicianPerformance(technicianId: string, dateRange: { start: Date; end: Date }): Promise<any> {
        const cacheKey = `technician_performance:${technicianId}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
        const cacheTtl = 1800; // 30 minute cache

        const query = `
            WITH service_metrics AS (
                SELECT
                    s.service_id,
                    s.service_date,
                    s.estimated_duration,
                    s.actual_duration,
                    s.status,
                    v.make,
                    v.model,
                    v.year,
                    json_agg(
                        json_build_object(
                            'code', c.code,
                            'description', c.description,
                            'severity', c.severity
                        )
                    ) as diagnostic_codes
                FROM services s
                JOIN vehicles v ON s.vehicle_id = v.vehicle_id
                LEFT JOIN service_codes sc ON s.service_id = sc.service_id
                LEFT JOIN codes c ON sc.code_id = c.code_id
                WHERE s.technician_id = $1
                AND s.service_date BETWEEN $2 AND $3
                GROUP BY s.service_id, v.make, v.model, v.year
            ),
            efficiency_metrics AS (
                SELECT
                    COUNT(*) as total_services,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                    AVG(actual_duration) as avg_actual_duration,
                    AVG(estimated_duration) as avg_estimated_duration,
                    SUM(CASE WHEN actual_duration <= estimated_duration THEN 1 ELSE 0 END) as on_time_services,
                    SUM(CASE WHEN status = 'completed' AND actual_duration <= estimated_duration THEN 1 ELSE 0 END) as completed_on_time,
                    COUNT(DISTINCT make) as makes_serviced,
                    COUNT(DISTINCT model) as models_serviced
                FROM service_metrics
            ),
            code_frequency AS (
                SELECT
                    c.code,
                    c.description,
                    COUNT(*) as frequency,
                    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM service_metrics) as percentage
                FROM service_metrics sm
                CROSS JOIN jsonb_array_elements(sm.diagnostic_codes) as dc
                JOIN codes c ON dc->>'code' = c.code
                GROUP BY c.code, c.description
                ORDER BY frequency DESC
                LIMIT 5
            )
            SELECT
                em.*,
                json_build_object(
                    'top_codes', (SELECT json_agg(row_to_json(cf)) FROM code_frequency cf),
                    'services', (SELECT json_agg(row_to_json(sm)) FROM service_metrics sm)
                ) as details
            FROM efficiency_metrics em
        `;

        return this.executeQuery(query, [technicianId, dateRange.start, dateRange.end], { cacheKey, cacheTtl });
    }

    private getReadReplicaPool(): Pool {
        if (!this.config.readReplicaEnabled) {
            return this.pool;
        }

        return new Pool({
            user: this.config.readReplicaUsername || this.config.username,
            host: this.config.readReplicaHost,
            database: this.config.readReplicaDatabase || this.config.database,
            password: this.config.readReplicaPassword || this.config.password,
            port: this.config.readReplicaPort || this.config.port,
            max: this.config.readReplicaMaxConnections || this.config.maxConnections,
            idleTimeoutMillis: this.config.readReplicaIdleTimeout || this.config.idleTimeout,
            connectionTimeoutMillis: this.config.readReplicaConnectionTimeout || this.config.connectionTimeout,
            ssl: this.config.readReplicaSslEnabled ? {
                rejectUnauthorized: false
            } : false
        });
    }

    public async close(): Promise<void> {
        try {
            await this.pool.end();
            this.logger.info('Database connection pool closed successfully');
        } catch (err) {
            this.logger.error(`Error closing database connection pool: ${err.message}`);
        }
    }
}
```

### API Response Compression

```typescript
// src/middleware/responseCompression.ts
import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';
import { Logger } from '../utils/logger';
import { CompressionConfig } from '../config/compressionConfig';

export class ResponseCompression {
    private static instance: ResponseCompression;
    private logger: Logger;
    private config: CompressionConfig;
    private compressionAlgorithms: Map<string, (data: Buffer) => Promise<Buffer>>;

    private constructor() {
        this.logger = new Logger('ResponseCompression');
        this.config = new CompressionConfig();
        this.compressionAlgorithms = new Map();

        this.initializeAlgorithms();
    }

    public static getInstance(): ResponseCompression {
        if (!ResponseCompression.instance) {
            ResponseCompression.instance = new ResponseCompression();
        }
        return ResponseCompression.instance;
    }

    private initializeAlgorithms(): void {
        // Gzip compression
        this.compressionAlgorithms.set('gzip', (data: Buffer) => {
            return new Promise((resolve, reject) => {
                zlib.gzip(data, {
                    level: this.config.gzipLevel,
                    memLevel: this.config.gzipMemLevel,
                    strategy: zlib.constants.Z_DEFAULT_STRATEGY
                }, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        });

        // Deflate compression
        this.compressionAlgorithms.set('deflate', (data: Buffer) => {
            return new Promise((resolve, reject) => {
                zlib.deflate(data, {
                    level: this.config.deflateLevel,
                    memLevel: this.config.deflateMemLevel
                }, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        });

        // Brotli compression (if supported)
        if (zlib.createBrotliCompress) {
            this.compressionAlgorithms.set('br', (data: Buffer) => {
                return new Promise((resolve, reject) => {
                    zlib.brotliCompress(data, {
                        [zlib.constants.BROTLI_PARAM_QUALITY]: this.config.brotliQuality,
                        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_GENERIC,
                        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length
                    }, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            });
        }
    }

    public middleware(): (req: Request, res: Response, next: NextFunction) => void {
        return (req: Request, res: Response, next: NextFunction) => {
            const originalWrite = res.write;
            const originalEnd = res.end;
            const originalJson = res.json;
            const originalSend = res.send;

            const acceptEncoding = req.headers['accept-encoding'] || '';
            const supportedEncodings = this.getSupportedEncodings(acceptEncoding);

            if (supportedEncodings.length === 0) {
                return next();
            }

            let compressionAlgorithm: string | null = null;
            let compressionFunction: ((data: Buffer) => Promise<Buffer>) | null = null;

            // Select the best compression algorithm based on client support
            for (const encoding of this.config.preferredAlgorithms) {
                if (supportedEncodings.includes(encoding)) {
                    compressionAlgorithm = encoding;
                    compressionFunction = this.compressionAlgorithms.get(encoding) || null;
                    break;
                }
            }

            if (!compressionAlgorithm || !compressionFunction) {
                return next();
            }

            // Override response methods
            res.write = (chunk: any, encoding?: any, callback?: any): boolean => {
                if (!res.getHeader('Content-Encoding')) {
                    res.setHeader('Content-Encoding', compressionAlgorithm);
                    res.setHeader('Vary', 'Accept-Encoding');
                }
                return originalWrite.call(res, chunk, encoding, callback);
            };

            res.end = (chunk?: any, encoding?: any, callback?: any): void => {
                if (chunk && !res.getHeader('Content-Encoding')) {
                    res.setHeader('Content-Encoding', compressionAlgorithm);
                    res.setHeader('Vary', 'Accept-Encoding');

                    if (Buffer.isBuffer(chunk)) {
                        compressionFunction!(chunk)
                            .then(compressed => {
                                res.setHeader('Content-Length', compressed.length);
                                originalEnd.call(res, compressed, encoding, callback);
                            })
                            .catch(err => {
                                this.logger.error(`Compression failed: ${err.message}`);
                                originalEnd.call(res, chunk, encoding, callback);
                            });
                        return;
                    }
                }
                originalEnd.call(res, chunk, encoding, callback);
            };

            res.json = (body: any): Response => {
                if (body && !res.getHeader('Content-Encoding')) {
                    const stringBody = JSON.stringify(body);
                    const bufferBody = Buffer.from(stringBody, 'utf8');

                    if (bufferBody.length >= this.config.minSizeToCompress) {
                        res.setHeader('Content-Encoding', compressionAlgorithm);
                        res.setHeader('Vary', 'Accept-Encoding');

                        compressionFunction!(bufferBody)
                            .then(compressed => {
                                res.setHeader('Content-Length', compressed.length);
                                res.setHeader('Content-Type', 'application/json');
                                originalEnd.call(res, compressed);
                            })
                            .catch(err => {
                                this.logger.error(`Compression failed: ${err.message}`);
                                res.setHeader('Content-Type', 'application/json');
                                originalEnd.call(res, stringBody);
                            });
                        return res;
                    }
                }
                return originalJson.call(res, body);
            };

            res.send = (body?: any): Response => {
                if (body && !res.getHeader('Content-Encoding')) {
                    let bufferBody: Buffer;

                    if (Buffer.isBuffer(body)) {
                        bufferBody = body;
                    } else if (typeof body === 'string') {
                        bufferBody = Buffer.from(body, 'utf8');
                    } else {
                        bufferBody = Buffer.from(JSON.stringify(body), 'utf8');
                    }

                    if (bufferBody.length >= this.config.minSizeToCompress) {
                        res.setHeader('Content-Encoding', compressionAlgorithm);
                        res.setHeader('Vary', 'Accept-Encoding');

                        compressionFunction!(bufferBody)
                            .then(compressed => {
                                res.setHeader('Content-Length', compressed.length);
                                originalEnd.call(res, compressed);
                            })
                            .catch(err => {
                                this.logger.error(`Compression failed: ${err.message}`);
                                originalEnd.call(res, body);
                            });
                        return res;
                    }
                }
                return originalSend.call(res, body);
            };

            next();
        };
    }

    private getSupportedEncodings(acceptEncoding: string): string[] {
        const encodings = acceptEncoding.split(',')
            .map(encoding => encoding.trim().toLowerCase())
            .filter(encoding => this.compressionAlgorithms.has(encoding));

        // Remove quality values if present
        return encodings.map(encoding => {
            const parts = encoding.split(';');
            return parts[0];
        });
    }

    public async compressData(data: Buffer, algorithm: string = 'gzip'): Promise<Buffer> {
        const compressionFunction = this.compressionAlgorithms.get(algorithm);
        if (!compressionFunction) {
            throw new Error(`Unsupported compression algorithm: ${algorithm}`);
        }

        return compressionFunction(data);
    }

    public async decompressData(data: Buffer, algorithm: string = 'gzip'): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            switch (algorithm) {
                case 'gzip':
                    zlib.gunzip(data, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                    break;
                case 'deflate':
                    zlib.inflate(data, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                    break;
                case 'br':
                    if (zlib.createBrotliDecompress) {
                        zlib.brotliDecompress(data, (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    } else {
                        reject(new Error('Brotli decompression not supported'));
                    }
                    break;
                default:
                    reject(new Error(`Unsupported decompression algorithm: ${algorithm}`));
            }
        });
    }

    public getCompressionStats(): {
        algorithms: string[];
        preferredOrder: string[];
        minSizeToCompress: number;
    } {
        return {
            algorithms: Array.from(this.compressionAlgorithms.keys()),
            preferredOrder: this.config.preferredAlgorithms,
            minSizeToCompress: this.config.minSizeToCompress
        };
    }
}
```

### Lazy Loading Implementation

```typescript
// src/utils/lazyLoader.ts
import { Logger } from './logger';
import { PerformanceMonitor } from './performanceMonitor';

export class LazyLoader {
    private static instance: LazyLoader;
    private logger: Logger;
    private performanceMonitor: PerformanceMonitor;
    private loadedModules: Map<string, any>;
    private loadingPromises: Map<string, Promise<any>>;
    private moduleConfigs: Map<string, {
        path: string;
        dependencies?: string[];
        singleton?: boolean;
        preload?: boolean;
    }>;

    private constructor() {
        this.logger = new Logger('LazyLoader');
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.moduleConfigs = new Map();

        this.initializeDefaultConfigs();
    }

    public static getInstance(): LazyLoader {
        if (!LazyLoader.instance) {
            LazyLoader.instance = new LazyLoader();
        }
        return LazyLoader.instance;
    }

    private initializeDefaultConfigs(): void {
        // Core modules
        this.registerModule('database', {
            path: '../database/queryOptimizer',
            singleton: true,
            preload: true
        });

        this.registerModule('cache', {
            path: '../cache/redisCache',
            singleton: true,
            preload: true
        });

        this.registerModule('auth', {
            path: '../services/authService',
            singleton: true
        });

        // Feature modules
        this.registerModule('vehicleService', {
            path: '../services/vehicleService',
            dependencies: ['database', 'cache'],
            singleton: true
        });

        this.registerModule('technicianService', {
            path: '../services/technicianService',
            dependencies: ['database', 'cache'],
            singleton: true
        });

        this.registerModule('partsService', {
            path: '../services/partsService',
            dependencies: ['database', 'cache'],
            singleton: true
        });

        this.registerModule('schedulingService', {
            path: '../services/schedulingService',
            dependencies: ['database', 'cache', 'vehicleService', 'technicianService'],
            singleton: true
        });

        this.registerModule('aiService', {
            path: '../services/aiService',
            dependencies: ['database', 'cache'],
            singleton: true
        });
    }

    public registerModule(name: string, config: {
        path: string;
        dependencies?: string[];
        singleton?: boolean;
        preload?: boolean;
    }): void {
        this.moduleConfigs.set(name, {
            path: config.path,
            dependencies: config.dependencies || [],
            singleton: config.singleton !== false,
            preload: config.preload || false
        });

        if (config.preload) {
            this.preloadModule(name).catch(err => {
                this.logger.error(`Failed to preload module ${name}: ${err.message}`);
            });
        }
    }

    public async loadModule<T>(name: string): Promise<T> {
        // Check if module is already loaded
        if (this.loadedModules.has(name)) {
            return this.loadedModules.get(name) as T;
        }

        // Check if module is currently being loaded
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name) as Promise<T>;
        }

        // Get module configuration
        const config = this.moduleConfigs.get(name);
        if (!config) {
            throw new Error(`Module ${name} is not registered`);
        }

        // Create loading promise
        const loadingPromise = this.loadModuleInternal(name, config);
        this.loadingPromises.set(name, loadingPromise);

        try {
            const module = await loadingPromise;
            this.loadingPromises.delete(name);
            return module as T;
        } catch (err) {
            this.loadingPromises.delete(name);
            throw err;
        }
    }

    private async loadModuleInternal(name: string, config: {
        path: string;
        dependencies?: string[];
        singleton?: boolean;
    }): Promise<any> {
        const startTime = Date.now();
        this.logger.debug(`Starting to load module ${name}`);

        try {
            // Load dependencies first
            if (config.dependencies && config.dependencies.length > 0) {
                this.logger.debug(`Loading dependencies for module ${name}: ${config.dependencies.join(', ')}`);
                await Promise.all(config.dependencies.map(dep => this.loadModule(dep)));
            }

            // Dynamically import the module
            const modulePath = require.resolve(config.path);
            const moduleExports = await import(modulePath);

            // Get the default export or the module itself
            const moduleInstance = moduleExports.default || moduleExports;

            // If singleton, store the instance
            if (config.singleton) {
                this.loadedModules.set(name, moduleInstance);
                this.logger.debug(`Module ${name} loaded and stored as singleton in ${Date.now() - startTime}ms`);
            } else {
                this.logger.debug(`Module ${name} loaded (non-singleton) in ${Date.now() - startTime}ms`);
            }

            // Record performance metric
            this.performanceMonitor.recordMetric(`module_load_${name}`, Date.now() - startTime);

            return moduleInstance;
        } catch (err) {
            this.logger.error(`Failed to load module ${name}: ${err.message}`);
            this.performanceMonitor.recordError(`module_load_failure_${name}`);
            throw new Error(`Failed to load module ${name}: ${err.message}`);
        }
    }

    public async preloadModule(name: string): Promise<void> {
        if (!this.moduleConfigs.has(name)) {
            throw new Error(`Module ${name} is not registered`);
        }

        if (this.loadedModules.has(name)) {
            return;
        }

        this.logger.info(`Preloading module ${name}`);
        await this.loadModule(name);
    }

    public async preloadAll(): Promise<void> {
        const preloadModules = Array.from(this.moduleConfigs.entries())
            .filter(([_, config]) => config.preload)
            .map(([name]) => name);

        this.logger.info(`Preloading all modules: ${preloadModules.join(', ')}`);

        await Promise.all(preloadModules.map(name => this.preloadModule(name)));
    }

    public getLoadedModules(): string[] {
        return Array.from(this.loadedModules.keys());
    }

    public getModuleConfig(name: string): {
        path: string;
        dependencies: string[];
        singleton: boolean;
        preload: boolean;
    } | undefined {
        const config = this.moduleConfigs.get(name);
        if (!config) return undefined;

        return {
            path: config.path,
            dependencies: config.dependencies || [],
            singleton: config.singleton !== false,
            preload: config.preload || false
        };
    }

    public async unloadModule(name: string): Promise<void> {
        if (!this.loadedModules.has(name)) {
            return;
        }

        this.logger.info(`Unloading module ${name}`);

        // For non-singleton modules, we just remove the reference
        // For singleton modules, we might need to call cleanup methods
        const moduleInstance = this.loadedModules.get(name);

        if (moduleInstance && typeof moduleInstance.cleanup === 'function') {
            try {
                await moduleInstance.cleanup();
            } catch (err) {
                this.logger.error(`Error during cleanup of module ${name}: ${err.message}`);
            }
        }

        this.loadedModules.delete(name);
    }

    public async reloadModule(name: string): Promise<any> {
        await this.unloadModule(name);
        return this.loadModule(name);
    }

    public getLoadingStatus(): {
        loadedModules: string[];
        loadingModules: string[];
        registeredModules: string[];
    } {
        return {
            loadedModules: this.getLoadedModules(),
            loadingModules: Array.from(this.loadingPromises.keys()),
            registeredModules: Array.from(this.moduleConfigs.keys())
        };
    }
}

// Example usage in a service
export class VehicleService {
    private lazyLoader: LazyLoader;
    private database: any;
    private cache: any;

    constructor() {
        this.lazyLoader = LazyLoader.getInstance();
    }

    public async initialize(): Promise<void> {
        try {
            // Load dependencies lazily
            this.database = await this.lazyLoader.loadModule('database');
            this.cache = await this.lazyLoader.loadModule('cache');
        } catch (err) {
            throw new Error(`Failed to initialize VehicleService: ${err.message}`);
        }
    }

    public async getVehicleDetails(vehicleId: string): Promise<any> {
        const cacheKey = `vehicle_details:${vehicleId}`;
        const cacheTtl = 3600; // 1 hour

        try {
            // Try to get from cache first
            const cachedData = await this.cache.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // If not in cache, get from database
            const query = `
                SELECT
                    v.*,
                    m.name as make_name,
                    mo.name as model_name,
                    json_agg(
                        json_build_object(
                            'service_id', s.service_id,
                            'service_date', s.service_date,
                            'status', s.status,
                            'description', s.description
                        )
                    ) as service_history,
                    json_agg(
                        json_build_object(
                            'part_id', p.part_id,
                            'part_name', p.name,
                            'install_date', i.install_date,
                            'mileage', i.mileage
                        )
                    ) as installed_parts
                FROM vehicles v
                JOIN makes m ON v.make_id = m.make_id
                JOIN models mo ON v.model_id = mo.model_id
                LEFT JOIN services s ON v.vehicle_id = s.vehicle_id
                LEFT JOIN installed_parts i ON v.vehicle_id = i.vehicle_id
                LEFT JOIN parts p ON i.part_id = p.part_id
                WHERE v.vehicle_id = $1
                GROUP BY v.vehicle_id, m.name, mo.name
            `;

            const result = await this.database.executeQuery(query, [vehicleId]);
            if (result.length === 0) {
                throw new Error('Vehicle not found');
            }

            const vehicleData = result[0];

            // Cache the result
            await this.cache.set(cacheKey, vehicleData, cacheTtl);

            return vehicleData;
        } catch (err) {
            throw new Error(`Failed to get vehicle details: ${err.message}`);
        }
    }

    public async getVehicleMaintenanceSchedule(vehicleId: string): Promise<any> {
        const cacheKey = `vehicle_maintenance_schedule:${vehicleId}`;
        const cacheTtl = 1800; // 30 minutes

        try {
            // Try to get from cache first
            const cachedData = await this.cache.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Get vehicle details first
            const vehicle = await this.getVehicleDetails(vehicleId);
            if (!vehicle) {
                throw new Error('Vehicle not found');
            }

            // Get maintenance schedule based on vehicle make/model/year
            const query = `
                WITH maintenance_intervals AS (
                    SELECT
                        mi.*,
                        ROW_NUMBER() OVER (PARTITION BY mi.interval_type ORDER BY mi.interval_value) as priority
                    FROM maintenance_intervals mi
                    JOIN models m ON mi.model_id = m.model_id
                    WHERE m.make_id = $1 AND m.model_id = $2 AND mi.min_year <= $3 AND mi.max_year >= $3
                ),
                last_services AS (
                    SELECT
                        ms.service_type,
                        MAX(s.service_date) as last_service_date,
                        MAX(s.mileage) as last_service_mileage
                    FROM maintenance_services ms
                    JOIN services s ON ms.service_id = s.service_id
                    WHERE s.vehicle_id = $4
                    GROUP BY ms.service_type
                )
                SELECT
                    mi.interval_id,
                    mi.interval_type,
                    mi.interval_value,
                    mi.service_type,
                    mi.description,
                    mi.priority,
                    ls.last_service_date,
                    ls.last_service_mileage,
                    CASE
                        WHEN mi.interval_type = 'mileage' THEN
                            CASE
                                WHEN ls.last_service_mileage IS NULL THEN mi.interval_value
                                ELSE ls.last_service_mileage + mi.interval_value
                            END
                        WHEN mi.interval_type = 'time' THEN
                            CASE
                                WHEN ls.last_service_date IS NULL THEN (NOW() + (mi.interval_value || ' months')::interval)::date
                                ELSE (ls.last_service_date + (mi.interval_value || ' months')::interval)::date
                            END
                        ELSE NULL
                    END as next_service_due,
                    CASE
                        WHEN mi.interval_type = 'mileage' THEN
                            CASE
                                WHEN ls.last_service_mileage IS NULL THEN mi.interval_value - $5
                                ELSE (ls.last_service_mileage + mi.interval_value) - $5
                            END
                        WHEN mi.interval_type = 'time' THEN
                            CASE
                                WHEN ls.last_service_date IS NULL THEN EXTRACT(DAY FROM (NOW() + (mi.interval_value || ' months')::interval - NOW()))
                                ELSE EXTRACT(DAY FROM (ls.last_service_date + (mi.interval_value || ' months')::interval - NOW()))
                            END
                        ELSE NULL
                    END as due_in,
                    CASE
                        WHEN mi.interval_type = 'mileage' AND ls.last_service_mileage IS NOT NULL THEN
                            CASE
                                WHEN (ls.last_service_mileage + mi.interval_value) - $5 <= 0 THEN true
                                ELSE false
                            END
                        WHEN mi.interval_type = 'time' AND ls.last_service_date IS NOT NULL THEN
                            CASE
                                WHEN (ls.last_service_date + (mi.interval_value || ' months')::interval)::date <= NOW()::date THEN true
                                ELSE false
                            END
                        ELSE false
                    END as is_overdue
                FROM maintenance_intervals mi
                LEFT JOIN last_services ls ON mi.service_type = ls.service_type
                ORDER BY mi.priority, mi.interval_value
            `;

            const result = await this.database.executeQuery(query, [
                vehicle.make_id,
                vehicle.model_id,
                vehicle.year,
                vehicleId,
                vehicle.mileage
            ]);

            // Cache the result
            await this.cache.set(cacheKey, result, cacheTtl);

            return result;
        } catch (err) {
            throw new Error(`Failed to get maintenance schedule: ${err.message}`);
        }
    }
}
```

### Request Debouncing

```typescript
// src/utils/requestDebouncer.ts
import { Logger } from './logger';
import { PerformanceMonitor } from './performanceMonitor';

export class RequestDebouncer {
    private static instance: RequestDebouncer;
    private logger: Logger;
    private performanceMonitor: PerformanceMonitor;
    private debounceTimers: Map<string, NodeJS.Timeout>;
    private pendingRequests: Map<string, {
        promise: Promise<any>;
        resolve: (value: any) => void;
        reject: (reason?: any) => void;
        timestamp: number;
    }>;
    private requestCounts: Map<string, number>;
    private config: {
        defaultDebounceTime: number;
        maxDebounceTime: number;
        maxPendingRequests: number;
        cleanupInterval: number;
    };

    private constructor() {
        this.logger = new Logger('RequestDebouncer');
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.debounceTimers = new Map();
        this.pendingRequests = new Map();
        this.requestCounts = new Map();

        this.config = {
            defaultDebounceTime: 300, // 300ms
            maxDebounceTime: 2000, // 2 seconds
            maxPendingRequests: 100,
            cleanupInterval: 60000 // 1 minute
        };

        this.startCleanupInterval();
    }

    public static getInstance(): RequestDebouncer {
        if (!RequestDebouncer.instance) {
            RequestDebouncer.instance = new RequestDebouncer();
        }
        return RequestDebouncer.instance;
    }

    private startCleanupInterval(): void {
        setInterval(() => {
            this.cleanupStaleRequests();
        }, this.config.cleanupInterval);
    }

    private cleanupStaleRequests(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, request] of this.pendingRequests.entries()) {
            if (now - request.timestamp > this.config.maxDebounceTime * 2) {
                this.pendingRequests.delete(key);
                request.reject(new Error('Request timed out'));
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.logger.debug(`Cleaned up ${cleanedCount} stale requests`);
        }
    }

    public debounceRequest<T>(
        key: string,
        requestFn: () => Promise<T>,
        options: {
            debounceTime?: number;
            maxWaitTime?: number;
        } = {}
    ): Promise<T> {
        const debounceTime = Math.min(
            options.debounceTime || this.config.defaultDebounceTime,
            this.config.maxDebounceTime
        );
        const maxWaitTime = options.maxWaitTime || this.config.maxDebounceTime;

        // Check if there's already a pending request for this key
        if (this.pendingRequests.has(key)) {
            this.logger.debug(`Debounced request for key ${key}, returning existing promise`);
            this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
            return this.pendingRequests.get(key)!.promise;
        }

        // Check if we've reached max pending requests
        if (this.pendingRequests.size >= this.config.maxPendingRequests) {
            this.logger.warn('Max pending requests reached, executing immediately');
            return requestFn();
        }

        // Create a new promise for this request
        let resolveFn: (value: T) => void;
        let rejectFn: (reason?: any) => void;

        const promise = new Promise<T>((resolve, reject) => {
            resolveFn = resolve;
            rejectFn = reject;
        });

        this.pendingRequests.set(key, {
            promise,
            resolve: resolveFn!,
            reject: rejectFn!,
            timestamp: Date.now()
        });

        this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);

        // Set up the debounce timer
        const timer = setTimeout(() => {
            this.executeDebouncedRequest(key, requestFn, maxWaitTime);
        }, debounceTime);

        this.debounceTimers.set(key, timer);

        return promise;
    }

    private async executeDebouncedRequest<T>(
        key: string,
        requestFn: () => Promise<T>,
        maxWaitTime: number
    ): Promise<void> {
        // Clear the debounce timer
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.delete(key);
        }

        // Check if the request is still pending (might have been resolved by another call)
        if (!this.pendingRequests.has(key)) {
            return;
        }

        const requestData = this.pendingRequests.get(key)!;
        const requestCount = this.requestCounts.get(key) || 1;

        try {
            this.logger.debug(`Executing debounced request for key ${key} (${requestCount} requests)`);

            const startTime = Date.now();
            const result = await requestFn();
            const executionTime = Date.now() - startTime;

            this.performanceMonitor.recordMetric(`debounced_request_${key}`, executionTime);
            this.performanceMonitor.incrementCounter(`debounced_request_count_${key}`);

            // Resolve all pending promises for this key
            requestData.resolve(result);

            // Log if this was a high-volume request
            if (requestCount > 5) {
                this.logger.info(`Debounced ${requestCount} requests for key ${key} into 1 execution`);
            }
        } catch (err) {
            this.logger.error(`Error in debounced request for key ${key}: ${err.message}`);
            this.performanceMonitor.recordError(`debounced_request_error_${key}`);

            // Reject all pending promises for this key
            requestData.reject(err);
        } finally {
            this.pendingRequests.delete(key);
            this.requestCounts.delete(key);
        }
    }

    public debounceWithFallback<T>(
        key: string,
        requestFn: () => Promise<T>,
        fallbackFn: () => Promise<T>,
        options: {
            debounceTime?: number;
            maxWaitTime?: number;
            fallbackThreshold?: number;
        } = {}
    ): Promise<T> {
        const debounceTime = Math.min(
            options.debounceTime || this.config.defaultDebounceTime,
            this.config.maxDebounceTime
        );
        const maxWaitTime = options.maxWaitTime || this.config.maxDebounceTime;
        const fallbackThreshold = options.fallbackThreshold || 3;

        // Check if we should use the fallback immediately
        if (this.pendingRequests.size >= this.config.maxPendingRequests * 0.8) {
            this.logger.debug(`High load detected, using fallback for key ${key}`);
            return fallbackFn();
        }

        // Check if there's already a pending request for this key
        if (this.pendingRequests.has(key)) {
            const requestCount = this.requestCounts.get(key) || 1;

            // If this request has been debounced many times, use the fallback
            if (requestCount >= fallbackThreshold) {
                this.logger.debug(`High request count for key ${key}, using fallback`);
                return fallbackFn();
            }

            return this.debounceRequest(key, requestFn, { debounceTime, maxWaitTime });
        }

        // Create a new debounced request
        return this.debounceRequest(key, requestFn, { debounceTime, maxWaitTime });
    }

    public getDebounceStatus(): {
        pendingRequests: number;
        debounceTimers: number;
        requestCounts: { key: string; count: number }[];
    } {
        return {
            pendingRequests: this.pendingRequests.size,
            debounceTimers: this.debounceTimers.size,
            requestCounts: Array.from(this.requestCounts.entries())
                .map(([key, count]) => ({ key, count }))
                .sort((a, b) => b.count - a.count)
        };
    }

    public clearDebounce(key: string): void {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.delete(key);
        }

        if (this.pendingRequests.has(key)) {
            const requestData = this.pendingRequests.get(key)!;
            requestData.reject(new Error('Request cancelled'));
            this.pendingRequests.delete(key);
        }

        this.requestCounts.delete(key);
    }

    public clearAll(): void {
        // Clear all debounce timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();

        // Reject all pending requests
        for (const requestData of this.pendingRequests.values()) {
            requestData.reject(new Error('Request debouncer cleared'));
        }
        this.pendingRequests.clear();

        this.requestCounts.clear();
    }

    public async withDebounce<T>(
        key: string,
        requestFn: () => Promise<T>,
        options?: {
            debounceTime?: number;
            maxWaitTime?: number;
        }
    ): Promise<T> {
        return this.debounceRequest(key, requestFn, options);
    }
}

// Example usage in an API controller
export class VehicleController {
    private debouncer: RequestDebouncer;
    private vehicleService: any;

    constructor() {
        this.debouncer = RequestDebouncer.getInstance();
    }

    public async initialize(): Promise<void> {
        const lazyLoader = (await import('./lazyLoader')).LazyLoader.getInstance();
        this.vehicleService = await lazyLoader.loadModule('vehicleService');
    }

    public async getVehicleDetails(req: any, res: any): Promise<void> {
        const vehicleId = req.params.vehicleId;
        const debounceKey = `vehicle_details:${vehicleId}`;

        try {
            const result = await this.debouncer.debounceRequest(
                debounceKey,
                async () => {
                    return this.vehicleService.getVehicleDetails(vehicleId);
                },
                { debounceTime: 500, maxWaitTime: 1000 }
            );

            res.json({
                success: true,
                data: result
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }

    public async getMaintenanceSchedule(req: any, res: any): Promise<void> {
        const vehicleId = req.params.vehicleId;
        const debounceKey = `maintenance_schedule:${vehicleId}`;

        try {
            const result = await this.debouncer.debounceWithFallback(
                debounceKey,
                async () => {
                    return this.vehicleService.getVehicleMaintenanceSchedule(vehicleId);
                },
                async () => {
                    // Fallback to a simpler query if the main one is taking too long
                    return this.vehicleService.getBasicMaintenanceSchedule(vehicleId);
                },
                { debounceTime: 300, maxWaitTime: 800, fallbackThreshold: 5 }
            );

            res.json({
                success: true,
                data: result
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }

    public async batchGetVehicleDetails(req: any, res: any): Promise<void> {
        const vehicleIds = req.body.vehicleIds;
        if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'vehicleIds array is required'
            });
        }

        try {
            // Use a single debounce key for the batch to prevent duplicate requests
            const debounceKey = `batch_vehicle_details:${vehicleIds.sort().join(',')}`;

            const results = await this.debouncer.debounceRequest(
                debounceKey,
                async () => {
                    return Promise.all(
                        vehicleIds.map(id => this.vehicleService.getVehicleDetails(id))
                    );
                },
                { debounceTime: 200, maxWaitTime: 1500 }
            );

            res.json({
                success: true,
                data: results
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
}
```

### Connection Pooling

```typescript
// src/database/connectionPool.ts
import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { DatabaseConfig } from '../config/databaseConfig';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { EventEmitter } from 'events';

export class ConnectionPool extends EventEmitter {
    private static instance: ConnectionPool;
    private primaryPool: Pool;
    private readReplicaPools: Pool[];
    private logger: Logger;
    private config: DatabaseConfig;
    private performanceMonitor: PerformanceMonitor;
    private connectionMetrics: {
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
        waitingClients: number;
    };

    private constructor() {
        super();
        this.logger = new Logger('ConnectionPool');
        this.config = new DatabaseConfig();
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.connectionMetrics = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            waitingClients: 0
        };

        this.initializePools();
        this.setupEventListeners();
        this.startMetricsCollection();
    }

    public static getInstance(): ConnectionPool {
        if (!ConnectionPool.instance) {
            ConnectionPool.instance = new ConnectionPool();
        }
        return ConnectionPool.instance;
    }

    private initializePools(): void {
        // Initialize primary pool
        this.primaryPool = this.createPool({
            user: this.config.username,
            host: this.config.host,
            database: this.config.database,
            password: this.config.password,
            port: this.config.port,
            max: this.config.maxConnections,
            idleTimeoutMillis: this.config.idleTimeout,
            connectionTimeoutMillis: this.config.connectionTimeout,
            ssl: this.config.sslEnabled ? {
                rejectUnauthorized: false
            } : false
        });

        // Initialize read replica pools if enabled
        this.readReplicaPools = [];
        if (this.config.readReplicaEnabled) {
            for (let i = 0; i < this.config.readReplicaCount; i++) {
                const pool = this.createPool({
                    user: this.config.readReplicaUsername || this.config.username,
                    host: this.config.readReplicaHosts[i] || this.config.readReplicaHost,
                    database: this.config.readReplicaDatabase || this.config.database,
                    password: this.config.readReplicaPassword || this.config.password,
                    port: this.config.readReplicaPorts[i] || this.config.readReplicaPort || this.config.port,
                    max: this.config.readReplicaMaxConnections || Math.floor(this.config.maxConnections / this.config.readReplicaCount),
                    idleTimeoutMillis: this.config.readReplicaIdleTimeout || this.config.idleTimeout,
                    connectionTimeoutMillis: this.config.readReplicaConnectionTimeout || this.config.connectionTimeout,
                    ssl: this.config.readReplicaSslEnabled ? {
                        rejectUnauthorized: false
                    } : false
                });
                this.readReplicaPools.push(pool);
            }
        }
    }

    private createPool(config: PoolConfig): Pool {
        const pool = new Pool(config);

        pool.on('connect', () => {
            this.connectionMetrics.totalConnections++;
            this.connectionMetrics.activeConnections++;
            this.logger.debug(`New database connection established. Total: ${this.connectionMetrics.totalConnections}`);
            this.emit('connection', { type: 'connect', pool: config.host });
        });

        pool.on('acquire', () => {
            this.connectionMetrics.activeConnections++;
            this.connectionMetrics.idleConnections--;
            this.logger.debug(`Connection acquired. Active: ${this.connectionMetrics.activeConnections}, Idle: ${this.connectionMetrics.idleConnections}`);
            this.emit('connection', { type: 'acquire', pool: config.host });
        });

        pool.on('release', () => {
            this.connectionMetrics.activeConnections--;
            this.connectionMetrics.idleConnections++;
            this.logger.debug(`Connection released. Active: ${this.connectionMetrics.activeConnections}, Idle: ${this.connectionMetrics.idleConnections}`);
            this.emit('connection', { type: 'release', pool: config.host });
        });

        pool.on('remove', () => {
            this.connectionMetrics.totalConnections--;
            this.connectionMetrics.idleConnections--;
            this.logger.debug(`Connection removed. Total: ${this.connectionMetrics.totalConnections}`);
            this.emit('connection', { type: 'remove', pool: config.host });
        });

        pool.on('error', (err) => {
            this.logger.error(`Database pool error: ${err.message}`);
            this.performanceMonitor.recordError('database_pool_error');
            this.emit('error', { error: err, pool: config.host });
        });

        return pool;
    }

    private setupEventListeners(): void {
        this.on('connection', (event) => {
            this.performanceMonitor.incrementCounter(`database_connections_${event.type}`);
        });

        this.on('error', (event) => {
            this.performanceMonitor.incrementCounter(`database_errors_${event.pool}`);
        });
    }

    private startMetricsCollection(): void {
        setInterval(() => {
            this.updateConnectionMetrics();
        }, 10000); // Update every 10 seconds
    }

    private async updateConnectionMetrics(): Promise<void> {
        try {
            const primaryStats = await this.getPoolStats(this.primaryPool);
            let replicaStats = {
                total: 0,
                idle: 0,
                active: 0,
                waiting: 0
            };

            if (this.readReplicaPools.length > 0) {
                const replicaStatsArray = await Promise.all(
                    this.readReplicaPools.map(pool => this.getPoolStats(pool))
                );
                replicaStats = replicaStatsArray.reduce((acc, stats) => {
                    return {
                        total: acc.total + stats.total,
                        idle: acc.idle + stats.idle,
                        active: acc.active + stats.active,
                        waiting: acc.waiting + stats.waiting
                    };
                }, replicaStats);
            }

            this.connectionMetrics = {
                totalConnections: primaryStats.total + replicaStats.total,
                activeConnections: primaryStats.active + replicaStats.active,
                idleConnections: primaryStats.idle + replicaStats.idle,
                waitingClients: primaryStats.waiting + replicaStats.waiting
            };

            this.logger.debug(`Connection metrics updated: ${JSON.stringify(this.connectionMetrics)}`);
        } catch (err) {
            this.logger.error(`Error updating connection metrics: ${err.message}`);
        }
    }

    private async getPoolStats(pool: Pool): Promise<{
        total: number;
        idle: number;
        active: number;
        waiting: number;
    }> {
        return {
            total: pool.totalCount,
            idle: pool.idleCount,
            active: pool.waitingCount,
            waiting: pool.waitingCount
        };
    }

    public async getConnection(useReadReplica: boolean = false): Promise<PoolClient> {
        if (useReadReplica && this.readReplicaPools.length > 0) {
            // Select a random read replica pool
            const randomIndex = Math.floor(Math.random() * this.readReplicaPools.length);
            return this.readReplicaPools[randomIndex].connect();
        }

        return this.primaryPool.connect();
    }

    public async executeQuery<T>(
        query: string,
        params: any[] = [],
        options: {
            useReadReplica?: boolean;
            explain?: boolean;
            retryCount?: number;
            retryDelay?: number;
        } = {}
    ): Promise<T[]> {
        const { useReadReplica = false, explain = false, retryCount = 2, retryDelay = 100 } = options;

        let client: PoolClient | null = null;
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt <= retryCount) {
            attempt++;
            try {
                client = await this.getConnection(useReadReplica);

                if (explain) {
                    const explainQuery = `EXPLAIN ANALYZE ${query}`;
                    const explainResult = await client.query(explainQuery, params);
                    this.logger.debug(`Query execution plan:\n${explainResult.rows.map(r => r['QUERY PLAN']).join('\n')}`);
                }

                const startTime = Date.now();
                const result = await client.query(query, params);
                const executionTime = Date.now() - startTime;

                this.performanceMonitor.recordMetric('database_query_execution_time', executionTime);
                this.performanceMonitor.incrementCounter(`database_queries_${useReadReplica ? 'read' : 'write'}`);

                return result.rows as T[];
            } catch (err) {
                lastError = err;
                this.logger.error(`Query attempt ${attempt} failed: ${err.message}\nQuery: ${query}\nParams: ${JSON.stringify(params)}`);
                this.performanceMonitor.recordError(`database_query_error_${useReadReplica ? 'read' : 'write'}`);

                if (attempt <= retryCount) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            } finally {
                if (client) {
                    client.release();
                }
            }
        }

        throw lastError || new Error('Query execution failed after retries');
    }

    public async executeTransaction<T>(
        queries: Array<{
            text: string;
            values: any[];
        }>,
        options: {
            isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
            retryCount?: number;
            retryDelay?: number;
        } = {}
    ): Promise<T[]> {
        const { isolationLevel, retryCount = 2, retryDelay = 100 } = options;

        let client: PoolClient | null = null;
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt <= retryCount) {
            attempt++;
            try {
                client = await this.getConnection(false); // Always use primary for transactions

                await client.query('BEGIN');

                if (isolationLevel) {
                    await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
                }

                const results: T[] = [];

                for (const query of queries) {
                    const result = await client.query(query.text, query.values);
                    results.push(result.rows as T);
                }

                await client.query('COMMIT');
                return results;
            } catch (err) {
                lastError = err;
                this.logger.error(`Transaction attempt ${attempt} failed: ${err.message}`);

                if (client) {
                    try {
                        await client.query('ROLLBACK');
                    } catch (rollbackErr) {
                        this.logger.error(`Rollback failed: ${rollbackErr.message}`);
                    }
                }

                if (attempt <= retryCount) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            } finally {
                if (client) {
                    client.release();
                }
            }
        }

        throw lastError || new Error('Transaction failed after retries');
    }

    public async getPoolStatus(): Promise<{
        primary: {
            total: number;
            idle: number;
            active: number;
            waiting: number;
        };
        readReplicas: Array<{
            host: string;
            total: number;
            idle: number;
            active: number;
            waiting: number;
        }>;
        metrics: {
            totalConnections: number;
            activeConnections: number;
            idleConnections: number;
            waitingClients: number;
        };
    }> {
        const primaryStats = await this.getPoolStats(this.primaryPool);

        const readReplicaStats = await Promise.all(
            this.readReplicaPools.map(async (pool, index) => {
                const stats = await this.getPoolStats(pool);
                return {
                    host: this.config.readReplicaHosts[index] || this.config.readReplicaHost || 'unknown',
                    ...stats
                };
            })
        );

        return {
            primary: {
                total: primaryStats.total,
                idle: primaryStats.idle,
                active: primaryStats.active,
                waiting: primaryStats.waiting
            },
            readReplicas: readReplicaStats,
            metrics: this.connectionMetrics
        };
    }

    public async end(): Promise<void> {
        try {
            await this.primaryPool.end();

            if (this.readReplicaPools.length > 0) {
                await Promise.all(this.readReplicaPools.map(pool => pool.end()));
            }

            this.logger.info('All database connection pools closed successfully');
        } catch (err) {
            this.logger.error(`Error closing database connection pools: ${err.message}`);
        }
    }

    public async healthCheck(): Promise<{
        primary: boolean;
        readReplicas: Array<{
            host: string;
            healthy: boolean;
            responseTime: number;
        }>;
    }> {
        const startTime = Date.now();
        let primaryHealthy = false;

        try {
            await this.primaryPool.query('SELECT 1');
            primaryHealthy = true;
        } catch (err) {
            this.logger.error(`Primary database health check failed: ${err.message}`);
        }

        const primaryResponseTime = Date.now() - startTime;

        const readReplicaChecks = await Promise.all(
            this.readReplicaPools.map(async (pool, index) => {
                const startTime = Date.now();
                let healthy = false;

                try {
                    await pool.query('SELECT 1');
                    healthy = true;
                } catch (err) {
                    this.logger.error(`Read replica ${index} health check failed: ${err.message}`);
                }

                return {
                    host: this.config.readReplicaHosts[index] || this.config.readReplicaHost || 'unknown',
                    healthy,
                    responseTime: Date.now() - startTime
                };
            })
        );

        return {
            primary: primaryHealthy,
            readReplicas: readReplicaChecks
        };
    }

    public async resizePools(newConfig: {
        maxConnections?: number;
        readReplicaMaxConnections?: number;
    }): Promise<void> {
        if (newConfig.maxConnections && newConfig.maxConnections !== this.config.maxConnections) {
            this.logger.info(`Resizing primary pool to ${newConfig.maxConnections} connections`);
            this.primaryPool.options.max = newConfig.maxConnections;
            this.config.maxConnections = newConfig.maxConnections;
        }

        if (newConfig.readReplicaMaxConnections && newConfig.readReplicaMaxConnections !== this.config.readReplicaMaxConnections) {
            this.logger.info(`Resizing read replica pools to ${newConfig.readReplicaMaxConnections} connections each`);

            for (const pool of this.readReplicaPools) {
                pool.options.max = newConfig.readReplicaMaxConnections;
            }

            this.config.readReplicaMaxConnections = newConfig.readReplicaMaxConnections;
        }
    }
}

// Example usage in a service
export class ServiceHistoryService {
    private connectionPool: ConnectionPool;

    constructor() {
        this.connectionPool = ConnectionPool.getInstance();
    }

    public async getServiceHistory(vehicleId: string, options: {
        limit?: number;
        offset?: number;
        statusFilter?: string[];
    } = {}): Promise<any[]> {
        const { limit = 20, offset = 0, statusFilter = [] } = options;

        const query = `
            WITH service_stats AS (
                SELECT
                    s.service_id,
                    s.vehicle_id,
                    s.service_date,
                    s.status,
                    s.estimated_duration,
                    s.actual_duration,
                    s.total_cost,
                    s.technician_id,
                    t.name as technician_name,
                    t.specialization,
                    json_agg(
                        json_build_object(
                            'part_id', p.part_id,
                            'part_name', p.name,
                            'quantity', sp.quantity,
                            'unit_price', sp.unit_price,
                            'total_price', sp.quantity * sp.unit_price
                        )
                    ) as parts,
                    json_agg(
                        json_build_object(
                            'labor_id', l.labor_id,
                            'description', l.description,
                            'hours', sl.hours,
                            'rate', sl.rate,
                            'total_price', sl.hours * sl.rate
                        )
                    ) as labor
                FROM services s
                LEFT JOIN service_parts sp ON s.service_id = sp.service_id
                LEFT JOIN parts p ON sp.part_id = p.part_id
                LEFT JOIN service_labor sl ON s.service_id = sl.service_id
                LEFT JOIN labor l ON sl.labor_id = l.labor_id
                LEFT JOIN technicians t ON s.technician_id = t.technician_id
                WHERE s.vehicle_id = $1
                ${statusFilter.length > 0 ? 'AND s.status = ANY($4)' : ''}
                GROUP BY s.service_id, t.name, t.specialization
            )
            SELECT
                ss.*,
                v.make,
                v.model,
                v.year,
                v.license_plate,
                v.mileage,
                v.vin,
                (
                    SELECT json_agg(
                        json_build_object(
                            'code', c.code,
                            'description', c.description,
                            'severity', c.severity,
                            'status', sc.status
                        )
                    )
                    FROM service_codes sc
                    JOIN codes c ON sc.code_id = c.code_id
                    WHERE sc.service_id = ss.service_id
                ) as diagnostic_codes,
                (
                    SELECT json_agg(
                        json_build_object(
                            'document_id', d.document_id,
                            'document_type', d.document_type,
                            'url', d.url,
                            'upload_date', d.upload_date
                        )
                    )
                    FROM documents d
                    WHERE d.service_id = ss.service_id
                ) as documents,
                (
                    SELECT COUNT(*)
                    FROM services s2
                    WHERE s2.vehicle_id = ss.vehicle_id
                    ${statusFilter.length > 0 ? 'AND s2.status = ANY($4)' : ''}
                ) as total_services
            FROM service_stats ss
            JOIN vehicles v ON ss.vehicle_id = v.vehicle_id
            ORDER BY ss.service_date DESC
            LIMIT $2 OFFSET $3
        `;

        const params = [vehicleId, limit, offset];
        if (statusFilter.length > 0) {
            params.push(statusFilter);
        }

        return this.connectionPool.executeQuery(query, params, {
            useReadReplica: true,
            retryCount: 3
        });
    }

    public async getServiceDetails(serviceId: string): Promise<any> {
        const query = `
            SELECT
                s.*,
                v.make,
                v.model,
                v.year,
                v.license_plate,
                v.vin,
                t.name as technician_name,
                t.specialization as technician_specialization,
                json_agg(
                    json_build_object(
                        'part_id', p.part_id,
                        'part_name', p.name,
                        'quantity', sp.quantity,
                        'unit_price', sp.unit_price,
                        'total_price', sp.quantity * sp.unit_price,
                        'part_number', p.part_number,
                        'manufacturer', p.manufacturer
                    )
                ) as parts,
                json_agg(
                    json_build_object(
                        'labor_id', l.labor_id,
                        'description', l.description,
                        'hours', sl.hours,
                        'rate', sl.rate,
                        'total_price', sl.hours * sl.rate
                    )
                ) as labor,
                json_agg(
                    json_build_object(
                        'code', c.code,
                        'description', c.description,
                        'severity', c.severity,
                        'status', sc.status
                    )
                ) as diagnostic_codes,
                json_agg(
                    json_build_object(
                        'document_id', d.document_id,
                        'document_type', d.document_type,
                        'url', d.url,
                        'upload_date', d.upload_date,
                        'description', d.description
                    )
                ) as documents
            FROM services s
            JOIN vehicles v ON s.vehicle_id = v.vehicle_id
            LEFT JOIN technicians t ON s.technician_id = t.technician_id
            LEFT JOIN service_parts sp ON s.service_id = sp.service_id
            LEFT JOIN parts p ON sp.part_id = p.part_id
            LEFT JOIN service_labor sl ON s.service_id = sl.service_id
            LEFT JOIN labor l ON sl.labor_id = l.labor_id
            LEFT JOIN service_codes sc ON s.service_id = sc.service_id
            LEFT JOIN codes c ON sc.code_id = c.code_id
            LEFT JOIN documents d ON s.service_id = d.service_id
            WHERE s.service_id = $1
            GROUP BY s.service_id, v.make, v.model, v.year, v.license_plate, v.vin, t.name, t.specialization
        `;

        const result = await this.connectionPool.executeQuery(query, [serviceId], {
            useReadReplica: true
        });

        if (result.length === 0) {
            throw new Error('Service not found');
        }

        return result[0];
    }

    public async createService(serviceData: {
        vehicleId: string;
        technicianId: string;
        serviceDate: Date;
        estimatedDuration: number;
        description: string;
        status: string;
        parts: Array<{
            partId: string;
            quantity: number;
            unitPrice: number;
        }>;
        labor: Array<{
            laborId: string;
            hours: number;
            rate: number;
        }>;
        diagnosticCodes: Array<{
            code: string;
            status: string;
        }>;
    }): Promise<string> {
        const queries = [
            {
                text: `
                    INSERT INTO services (
                        vehicle_id, technician_id, service_date, estimated_duration,
                        description, status, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                    RETURNING service_id
                `,
                values: [
                    serviceData.vehicleId,
                    serviceData.technicianId,
                    serviceData.serviceDate,
                    serviceData.estimatedDuration,
                    serviceData.description,
                    serviceData.status
                ]
            }
        ];

        // Add parts
        for (const part of serviceData.parts) {
            queries.push({
                text: `
                    INSERT INTO service_parts (
                        service_id, part_id, quantity, unit_price, created_at
                    )
                    VALUES ($1, $2, $3, $4, NOW())
                `,
                values: [
                    'SERVICE_ID', // Will be replaced with the actual service_id
                    part.partId,
                    part.quantity,
                    part.unitPrice
                ]
            });
        }

        // Add labor
        for (const labor of serviceData.labor) {
            queries.push({
                text: `
                    INSERT INTO service_labor (
                        service_id, labor_id, hours, rate, created_at
                    )
                    VALUES ($1, $2, $3, $4, NOW())
                `,
                values: [
                    'SERVICE_ID', // Will be replaced with the actual service_id
                    labor.laborId,
                    labor.hours,
                    labor.rate
                ]
            });
        }

        // Add diagnostic codes
        for (const code of serviceData.diagnosticCodes) {
            queries.push({
                text: `
                    INSERT INTO service_codes (
                        service_id, code_id, status, created_at
                    )
                    VALUES ($1, (SELECT code_id FROM codes WHERE code = $2), $3, NOW())
                `,
                values: [
                    'SERVICE_ID', // Will be replaced with the actual service_id
                    code.code,
                    code.status
                ]
            });
        }

        const results = await this.connectionPool.executeTransaction(queries, {
            isolationLevel: 'READ COMMITTED'
        });

        const serviceId = results[0][0].service_id;

        // Replace SERVICE_ID placeholders with the actual service_id
        for (let i = 1; i < queries.length; i++) {
            queries[i].values[0] = serviceId;
        }

        // Execute the remaining queries in the transaction
        await this.connectionPool.executeTransaction(queries.slice(1), {
            isolationLevel: 'READ COMMITTED'
        });

        return serviceId;
    }
}
```

---

## Real-Time Features (350 lines)

### WebSocket Server Setup

```typescript
// src/websocket/websocketServer.ts
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { WebSocketServer } from 'ws';
import { Logger } from '../utils/logger';
import { WebSocketConfig } from '../config/websocketConfig';
import { ConnectionManager } from './connectionManager';
import { MessageHandler } from './messageHandler';
import { AuthenticationMiddleware } from './authenticationMiddleware';
import { RateLimiter } from './rateLimiter';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { EventEmitter } from 'events';

export class WebSocketServerInstance extends EventEmitter {
    private static instance: WebSocketServerInstance;
    private wss: WebSocketServer;
    private logger: Logger;
    private config: WebSocketConfig;
    private connectionManager: ConnectionManager;
    private messageHandler: MessageHandler;
    private authMiddleware: AuthenticationMiddleware;
    private rateLimiter: RateLimiter;
    private performanceMonitor: PerformanceMonitor;
    private heartbeatInterval: NodeJS.Timeout;
    private isShuttingDown: boolean = false;

    private constructor(server: HttpServer | HttpsServer) {
        super();
        this.logger = new Logger('WebSocketServer');
        this.config = new WebSocketConfig();
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.connectionManager = ConnectionManager.getInstance();
        this.authMiddleware = new AuthenticationMiddleware();
        this.rateLimiter = new RateLimiter();
        this.messageHandler = new MessageHandler();

        this.initializeServer(server);
        this.setupEventListeners();
        this.startHeartbeat();
    }

    public static getInstance(server?: HttpServer | HttpsServer): WebSocketServerInstance {
        if (!WebSocketServerInstance.instance && server) {
            WebSocketServerInstance.instance = new WebSocketServerInstance(server);
        }
        return WebSocketServerInstance.instance;
    }

    private initializeServer(server: HttpServer | HttpsServer): void {
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
                threshold: 1024,
                concurrencyLimit: 10
            }
        });

        this.logger.info(`WebSocket server initialized on path ${this.config.path}`);
    }

    private setupEventListeners(): void {
        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });

        this.wss.on('error', (error) => {
            this.logger.error(`WebSocket server error: ${error.message}`);
            this.performanceMonitor.recordError('websocket_server_error');
            this.emit('error', error);
        });

        this.wss.on('listening', () => {
            this.logger.info('WebSocket server is listening');
            this.emit('listening');
        });
    }

    private async handleConnection(ws: WebSocket, req: any): Promise<void> {
        if (this.isShuttingDown) {
            ws.close(1012, 'Server is shutting down');
            return;
        }

        const connectionId = this.generateConnectionId();
        const ipAddress = this.getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'unknown';

        this.logger.debug(`New WebSocket connection attempt from ${ipAddress}`);

        // Apply rate limiting
        const rateLimitResult = this.rateLimiter.checkRateLimit(ipAddress);
        if (!rateLimitResult.allowed) {
            this.logger.warn(`Rate limit exceeded for ${ipAddress}`);
            ws.close(1008, 'Rate limit exceeded');
            return;
        }

        // Set up connection event handlers
        ws.on('message', (message) => this.handleMessage(connectionId, ws, message));
        ws.on('close', (code, reason) => this.handleClose(connectionId, code, reason));
        ws.on('error', (error) => this.handleError(connectionId, error));
        ws.on('pong', () => this.handlePong(connectionId));

        // Set up connection metadata
        const connectionMetadata = {
            connectionId,
            ipAddress,
            userAgent,
            connectedAt: new Date(),
            lastMessageAt: new Date(),
            isAuthenticated: false,
            userId: null,
            roles: [],
            subscriptions: new Set<string>(),
            metadata: {}
        };

        // Store the connection
        this.connectionManager.addConnection(connectionId, ws, connectionMetadata);

        // Send connection ack
        this.sendMessage(ws, {
            type: 'connection_ack',
            data: {
                connectionId,
                serverTime: new Date().toISOString(),
                maxPayloadSize: this.config.maxPayloadSize,
                heartbeatInterval: this.config.heartbeatInterval
            }
        });

        this.performanceMonitor.incrementCounter('websocket_connections');
        this.emit('connection', connectionMetadata);
    }

    private async handleMessage(connectionId: string, ws: WebSocket, message: WebSocket.RawData): Promise<void> {
        try {
            // Update last message time
            this.connectionManager.updateConnection(connectionId, {
                lastMessageAt: new Date()
            });

            // Parse the message
            let parsedMessage: any;
            try {
                parsedMessage = JSON.parse(message.toString());
            } catch (err) {
                this.logger.warn(`Invalid JSON received from connection ${connectionId}`);
                this.sendError(ws, 'invalid_message', 'Invalid JSON format');
                return;
            }

            this.logger.debug(`Message received from ${connectionId}: ${JSON.stringify(parsedMessage)}`);

            // Validate message structure
            if (!parsedMessage.type) {
                this.sendError(ws, 'invalid_message', 'Message type is required');
                return;
            }

            // Handle authentication
            if (parsedMessage.type === 'authenticate') {
                await this.handleAuthentication(connectionId, ws, parsedMessage);
                return;
            }

            // Check if connection is authenticated
            const connection = this.connectionManager.getConnection(connectionId);
            if (!connection || !connection.metadata.isAuthenticated) {
                this.sendError(ws, 'unauthorized', 'Authentication required');
                return;
            }

            // Handle different message types
            switch (parsedMessage.type) {
                case 'subscribe':
                    await this.handleSubscription(connectionId, ws, parsedMessage);
                    break;
                case 'unsubscribe':
                    await this.handleUnsubscription(connectionId, ws, parsedMessage);
                    break;
                case 'ping':
                    this.sendMessage(ws, { type: 'pong' });
                    break;
                default:
                    await this.messageHandler.handleMessage(connectionId, ws, parsedMessage);
            }

            this.performanceMonitor.incrementCounter('websocket_messages_received');
        } catch (err) {
            this.logger.error(`Error handling message from ${connectionId}: ${err.message}`);
            this.sendError(ws, 'server_error', 'Internal server error');
            this.performanceMonitor.recordError('websocket_message_error');
        }
    }

    private async handleAuthentication(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        try {
            if (!message.data || !message.data.token) {
                this.sendError(ws, 'authentication_failed', 'Token is required');
                return;
            }

            const authResult = await this.authMiddleware.authenticate(message.data.token);

            if (!authResult.success) {
                this.sendError(ws, 'authentication_failed', authResult.message || 'Authentication failed');
                return;
            }

            // Update connection with authentication info
            this.connectionManager.updateConnection(connectionId, {
                isAuthenticated: true,
                userId: authResult.userId,
                roles: authResult.roles || [],
                metadata: {
                    ...this.connectionManager.getConnection(connectionId)?.metadata.metadata,
                    ...authResult.metadata
                }
            });

            this.sendMessage(ws, {
                type: 'authentication_success',
                data: {
                    userId: authResult.userId,
                    roles: authResult.roles,
                    message: 'Authentication successful'
                }
            });

            this.logger.info(`User ${authResult.userId} authenticated via WebSocket (connection ${connectionId})`);
            this.emit('authentication', {
                connectionId,
                userId: authResult.userId,
                roles: authResult.roles
            });
        } catch (err) {
            this.logger.error(`Authentication error for connection ${connectionId}: ${err.message}`);
            this.sendError(ws, 'authentication_failed', 'Authentication failed');
        }
    }

    private async handleSubscription(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        try {
            if (!message.data || !message.data.channel) {
                this.sendError(ws, 'invalid_subscription', 'Channel is required');
                return;
            }

            const channel = message.data.channel;
            const connection = this.connectionManager.getConnection(connectionId);

            if (!connection) {
                this.sendError(ws, 'invalid_connection', 'Connection not found');
                return;
            }

            // Check if user has permission to subscribe to this channel
            if (!this.hasSubscriptionPermission(connection.metadata.userId, connection.metadata.roles, channel)) {
                this.sendError(ws, 'permission_denied', 'You do not have permission to subscribe to this channel');
                return;
            }

            // Add subscription
            this.connectionManager.addSubscription(connectionId, channel);

            this.sendMessage(ws, {
                type: 'subscription_success',
                data: {
                    channel,
                    message: `Successfully subscribed to ${channel}`
                }
            });

            this.logger.debug(`Connection ${connectionId} subscribed to channel ${channel}`);
            this.emit('subscription', {
                connectionId,
                userId: connection.metadata.userId,
                channel
            });
        } catch (err) {
            this.logger.error(`Subscription error for connection ${connectionId}: ${err.message}`);
            this.sendError(ws, 'subscription_failed', 'Subscription failed');
        }
    }

    private async handleUnsubscription(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        try {
            if (!message.data || !message.data.channel) {
                this.sendError(ws, 'invalid_unsubscription', 'Channel is required');
                return;
            }

            const channel = message.data.channel;
            const connection = this.connectionManager.getConnection(connectionId);

            if (!connection) {
                this.sendError(ws, 'invalid_connection', 'Connection not found');
                return;
            }

            // Remove subscription
            this.connectionManager.removeSubscription(connectionId, channel);

            this.sendMessage(ws, {
                type: 'unsubscription_success',
                data: {
                    channel,
                    message: `Successfully unsubscribed from ${channel}`
                }
            });

            this.logger.debug(`Connection ${connectionId} unsubscribed from channel ${channel}`);
            this.emit('unsubscription', {
                connectionId,
                userId: connection.metadata.userId,
                channel
            });
        } catch (err) {
            this.logger.error(`Unsubscription error for connection ${connectionId}: ${err.message}`);
            this.sendError(ws, 'unsubscription_failed', 'Unsubscription failed');
        }
    }

    private handleClose(connectionId: string, code: number, reason: Buffer): Promise<void> {
        return new Promise((resolve) => {
            try {
                const connection = this.connectionManager.getConnection(connectionId);
                if (connection) {
                    const closeReason = reason.toString() || 'unknown';
                    this.logger.info(`Connection ${connectionId} closed with code ${code}: ${closeReason}`);

                    // Remove all subscriptions
                    this.connectionManager.removeAllSubscriptions(connectionId);

                    // Remove the connection
                    this.connectionManager.removeConnection(connectionId);

                    this.performanceMonitor.decrementCounter('websocket_connections');
                    this.emit('disconnect', {
                        connectionId,
                        userId: connection.metadata.userId,
                        code,
                        reason: closeReason
                    });
                }
            } catch (err) {
                this.logger.error(`Error handling close for connection ${connectionId}: ${err.message}`);
            } finally {
                resolve();
            }
        });
    }

    private handleError(connectionId: string, error: Error): void {
        try {
            this.logger.error(`WebSocket error for connection ${connectionId}: ${error.message}`);
            this.performanceMonitor.recordError('websocket_connection_error');
            this.emit('connection_error', { connectionId, error });
        } catch (err) {
            this.logger.error(`Error handling WebSocket error: ${err.message}`);
        }
    }

    private handlePong(connectionId: string): void {
        try {
            this.connectionManager.updateConnection(connectionId, {
                lastPongAt: new Date()
            });
            this.logger.debug(`Pong received from connection ${connectionId}`);
        } catch (err) {
            this.logger.error(`Error handling pong for connection ${connectionId}: ${err.message}`);
        }
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.checkConnections();
        }, this.config.heartbeatInterval);
    }

    private checkConnections(): void {
        const now = Date.now();
        const connections = this.connectionManager.getAllConnections();

        for (const [connectionId, connection] of connections) {
            if (!connection.ws) continue;

            // Check if connection is stale (no pong received)
            const lastPong = connection.metadata.lastPongAt?.getTime() || connection.metadata.connectedAt.getTime();
            const timeSinceLastPong = now - lastPong;

            if (timeSinceLastPong > this.config.heartbeatTimeout) {
                this.logger.warn(`Closing stale connection ${connectionId} (no pong received)`);
                connection.ws.close(1001, 'Connection timed out');
                continue;
            }

            // Send ping if heartbeat interval has passed
            const lastPing = connection.metadata.lastPingAt?.getTime() || connection.metadata.connectedAt.getTime();
            const timeSinceLastPing = now - lastPing;

            if (timeSinceLastPing >= this.config.heartbeatInterval) {
                try {
                    connection.ws.ping();
                    this.connectionManager.updateConnection(connectionId, {
                        lastPingAt: new Date()
                    });
                    this.logger.debug(`Ping sent to connection ${connectionId}`);
                } catch (err) {
                    this.logger.error(`Error sending ping to connection ${connectionId}: ${err.message}`);
                }
            }
        }
    }

    private hasSubscriptionPermission(userId: string | null, roles: string[], channel: string): boolean {
        // Implement channel-specific permission logic
        if (channel.startsWith('user:')) {
            const channelUserId = channel.split(':')[1];
            return userId === channelUserId;
        }

        if (channel.startsWith('vehicle:')) {
            // Check if user has access to this vehicle
            return roles.includes('admin') || roles.includes('technician');
        }

        if (channel.startsWith('service:')) {
            // Check if user has access to this service
            return roles.includes('admin') || roles.includes('technician') || roles.includes('customer');
        }

        // Default to true for public channels
        return true;
    }

    public sendMessage(ws: WebSocket, message: any): void {
        try {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
                this.performanceMonitor.incrementCounter('websocket_messages_sent');
            }
        } catch (err) {
            this.logger.error(`Error sending message: ${err.message}`);
            this.performanceMonitor.recordError('websocket_send_error');
        }
    }

    public sendError(ws: WebSocket, errorType: string, message: string): void {
        this.sendMessage(ws, {
            type: 'error',
            data: {
                error: errorType,
                message
            }
        });
    }

    public broadcast(channel: string, message: any, options: {
        excludeConnectionIds?: string[];
        includeUnauthenticated?: boolean;
    } = {}): void {
        try {
            const { excludeConnectionIds = [], includeUnauthenticated = false } = options;
            const connections = this.connectionManager.getConnectionsBySubscription(channel);

            for (const [connectionId, connection] of connections) {
                if (excludeConnectionIds.includes(connectionId)) continue;
                if (!includeUnauthenticated && !connection.metadata.isAuthenticated) continue;

                this.sendMessage(connection.ws, message);
            }

            this.logger.debug(`Broadcast message to channel ${channel} (${connections.size} connections)`);
        } catch (err) {
            this.logger.error(`Error broadcasting to channel ${channel}: ${err.message}`);
            this.performanceMonitor.recordError('websocket_broadcast_error');
        }
    }

    public sendToUser(userId: string, message: any): void {
        try {
            const connections = this.connectionManager.getConnectionsByUserId(userId);

            for (const [connectionId, connection] of connections) {
                this.sendMessage(connection.ws, message);
            }

            this.logger.debug(`Sent message to user ${userId} (${connections.size} connections)`);
        } catch (err) {
            this.logger.error(`Error sending message to user ${userId}: ${err.message}`);
            this.performanceMonitor.recordError('websocket_user_message_error');
        }
    }

    public sendToConnection(connectionId: string, message: any): void {
        try {
            const connection = this.connectionManager.getConnection(connectionId);
            if (connection) {
                this.sendMessage(connection.ws, message);
            }
        } catch (err) {
            this.logger.error(`Error sending message to connection ${connectionId}: ${err.message}`);
            this.performanceMonitor.recordError('websocket_connection_message_error');
        }
    }

    public getServerStats(): {
        connections: number;
        authenticatedConnections: number;
        subscriptions: number;
        channels: string[];
        messagesSent: number;
        messagesReceived: number;
    } {
        const connections = this.connectionManager.getAllConnections();
        const authenticatedConnections = Array.from(connections.values())
            .filter(conn => conn.metadata.isAuthenticated)
            .length;

        const subscriptions = this.connectionManager.getAllSubscriptions();
        const channels = Array.from(subscriptions.keys());

        return {
            connections: connections.size,
            authenticatedConnections,
            subscriptions: Array.from(subscriptions.values()).reduce((sum, count) => sum + count, 0),
            channels,
            messagesSent: this.performanceMonitor.getCounter('websocket_messages_sent'),
            messagesReceived: this.performanceMonitor.getCounter('websocket_messages_received')
        };
    }

    public async shutdown(): Promise<void> {
        this.isShuttingDown = true;

        // Clear heartbeat interval
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Close all connections
        const connections = this.connectionManager.getAllConnections();
        for (const [connectionId, connection] of connections) {
            try {
                connection.ws.close(1001, 'Server is shutting down');
            } catch (err) {
                this.logger.error(`Error closing connection ${connectionId} during shutdown: ${err.message}`);
            }
        }

        // Close the WebSocket server
        return new Promise((resolve) => {
            this.wss.close(() => {
                this.logger.info('WebSocket server shutdown complete');
                resolve();
            });
        });
    }

    private generateConnectionId(): string {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getClientIp(req: any): string {
        // Handle proxy headers
        const xForwardedFor = req.headers['x-forwarded-for'];
        if (xForwardedFor) {
            return xForwardedFor.split(',')[0].trim();
        }

        return req.socket.remoteAddress || 'unknown';
    }
}
```

### Real-Time Event Handlers

```typescript
// src/websocket/messageHandler.ts
import { WebSocket } from 'ws';
import { Logger } from '../utils/logger';
import { ConnectionManager } from './connectionManager';
import { WebSocketServerInstance } from './websocketServer';
import { VehicleService } from '../services/vehicleService';
import { TechnicianService } from '../services/technicianService';
import { SchedulingService } from '../services/schedulingService';
import { NotificationService } from '../services/notificationService';
import { AIService } from '../services/aiService';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { EventEmitter } from 'events';

export class MessageHandler extends EventEmitter {
    private logger: Logger;
    private connectionManager: ConnectionManager;
    private websocketServer: WebSocketServerInstance;
    private vehicleService: VehicleService;
    private technicianService: TechnicianService;
    private schedulingService: SchedulingService;
    private notificationService: NotificationService;
    private aiService: AIService;
    private performanceMonitor: PerformanceMonitor;

    constructor() {
        super();
        this.logger = new Logger('MessageHandler');
        this.connectionManager = ConnectionManager.getInstance();
        this.websocketServer = WebSocketServerInstance.getInstance();
        this.performanceMonitor = PerformanceMonitor.getInstance();

        // Initialize services lazily
        this.initializeServices();
    }

    private async initializeServices(): Promise<void> {
        try {
            const lazyLoader = (await import('../utils/lazyLoader')).LazyLoader.getInstance();
            this.vehicleService = await lazyLoader.loadModule('vehicleService');
            this.technicianService = await lazyLoader.loadModule('technicianService');
            this.schedulingService = await lazyLoader.loadModule('schedulingService');
            this.notificationService = await lazyLoader.loadModule('notificationService');
            this.aiService = await lazyLoader.loadModule('aiService');
        } catch (err) {
            this.logger.error(`Failed to initialize services: ${err.message}`);
            throw err;
        }
    }

    public async handleMessage(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        const startTime = Date.now();
        const connection = this.connectionManager.getConnection(connectionId);

        if (!connection) {
            this.websocketServer.sendError(ws, 'invalid_connection', 'Connection not found');
            return;
        }

        try {
            switch (message.type) {
                case 'get_vehicle_status':
                    await this.handleGetVehicleStatus(connectionId, ws, message);
                    break;
                case 'subscribe_vehicle_updates':
                    await this.handleSubscribeVehicleUpdates(connectionId, ws, message);
                    break;
                case 'update_service_status':
                    await this.handleUpdateServiceStatus(connectionId, ws, message);
                    break;
                case 'get_technician_schedule':
                    await this.handleGetTechnicianSchedule(connectionId, ws, message);
                    break;
                case 'subscribe_technician_updates':
                    await this.handleSubscribeTechnicianUpdates(connectionId, ws, message);
                    break;
                case 'send_notification':
                    await this.handleSendNotification(connectionId, ws, message);
                    break;
                case 'request_ai_analysis':
                    await this.handleRequestAIAnalysis(connectionId, ws, message);
                    break;
                case 'update_vehicle_telemetry':
                    await this.handleUpdateVehicleTelemetry(connectionId, ws, message);
                    break;
                case 'get_service_queue':
                    await this.handleGetServiceQueue(connectionId, ws, message);
                    break;
                case 'subscribe_service_queue_updates':
                    await this.handleSubscribeServiceQueueUpdates(connectionId, ws, message);
                    break;
                default:
                    this.websocketServer.sendError(ws, 'invalid_message_type', 'Unknown message type');
            }

            this.performanceMonitor.recordMetric(`websocket_message_${message.type}_processing_time`, Date.now() - startTime);
        } catch (err) {
            this.logger.error(`Error handling message ${message.type} from ${connectionId}: ${err.message}`);
            this.websocketServer.sendError(ws, 'server_error', 'Error processing message');
            this.performanceMonitor.recordError(`websocket_message_error_${message.type}`);
        }
    }

    private async handleGetVehicleStatus(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        if (!message.data || !message.data.vehicleId) {
            this.websocketServer.sendError(ws, 'invalid_request', 'vehicleId is required');
            return;
        }

        const vehicleId = message.data.vehicleId;
        const connection = this.connectionManager.getConnection(connectionId);

        if (!connection) {
            this.websocketServer.sendError(ws, 'invalid_connection', 'Connection not found');
            return;
        }

        // Check if user has permission to access this vehicle
        if (!this.hasVehicleAccess(connection.metadata.userId, connection.metadata.roles, vehicleId)) {
            this.websocketServer.sendError(ws, 'permission_denied', 'You do not have permission to access this vehicle');
            return;
        }

        try {
            const vehicleStatus = await this.vehicleService.getVehicleStatus(vehicleId);

            this.websocketServer.sendMessage(ws, {
                type: 'vehicle_status',
                data: vehicleStatus
            });
        } catch (err) {
            this.logger.error(`Error getting vehicle status for ${vehicleId}: ${err.message}`);
            this.websocketServer.sendError(ws, 'server_error', 'Error retrieving vehicle status');
        }
    }

    private async handleSubscribeVehicleUpdates(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        if (!message.data || !message.data.vehicleId) {
            this.websocketServer.sendError(ws, 'invalid_request', 'vehicleId is required');
            return;
        }

        const vehicleId = message.data.vehicleId;
        const connection = this.connectionManager.getConnection(connectionId);

        if (!connection) {
            this.websocketServer.sendError(ws, 'invalid_connection', 'Connection not found');
            return;
        }

        // Check if user has permission to access this vehicle
        if (!this.hasVehicleAccess(connection.metadata.userId, connection.metadata.roles, vehicleId)) {
            this.websocketServer.sendError(ws, 'permission_denied', 'You do not have permission to access this vehicle');
            return;
        }

        // Create a channel for this vehicle
        const channel = `vehicle:${vehicleId}:updates`;

        // Subscribe the connection to the channel
        this.connectionManager.addSubscription(connectionId, channel);

        // Send initial vehicle status
        try {
            const vehicleStatus = await this.vehicleService.getVehicleStatus(vehicleId);

            this.websocketServer.sendMessage(ws, {
                type: 'vehicle_updates_subscription',
                data: {
                    channel,
                    initialStatus: vehicleStatus,
                    message: `Successfully subscribed to updates for vehicle ${vehicleId}`
                }
            });
        } catch (err) {
            this.logger.error(`Error getting initial vehicle status for ${vehicleId}: ${err.message}`);
            this.websocketServer.sendError(ws, 'server_error', 'Error subscribing to vehicle updates');
        }
    }

    private async handleUpdateServiceStatus(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        if (!message.data || !message.data.serviceId || !message.data.status) {
            this.websocketServer.sendError(ws, 'invalid_request', 'serviceId and status are required');
            return;
        }

        const { serviceId, status, notes } = message.data;
        const connection = this.connectionManager.getConnection(connectionId);

        if (!connection) {
            this.websocketServer.sendError(ws, 'invalid_connection', 'Connection not found');
            return;
        }

        // Check if user has permission to update service status
        if (!this.hasServiceUpdatePermission(connection.metadata.userId, connection.metadata.roles, serviceId)) {
            this.websocketServer.sendError(ws, 'permission_denied', 'You do not have permission to update this service');
            return;
        }

        try {
            // Update the service status
            const updatedService = await this.schedulingService.updateServiceStatus(
                serviceId,
                status,
                connection.metadata.userId,
                notes
            );

            // Broadcast the update to all subscribers
            const channel = `service:${serviceId}:updates`;
            this.websocketServer.broadcast(channel, {
                type: 'service_status_update',
                data: updatedService
            });

            // Also broadcast to the vehicle channel
            const vehicleChannel = `vehicle:${updatedService.vehicleId}:updates`;
            this.websocketServer.broadcast(vehicleChannel, {
                type: 'vehicle_service_update',
                data: {
                    serviceId,
                    status,
                    vehicleId: updatedService.vehicleId
                }
            });

            // Send success response
            this.websocketServer.sendMessage(ws, {
                type: 'service_status_updated',
                data: {
                    serviceId,
                    status,
                    message: 'Service status updated successfully'
                }
            });

            // Send notification to customer if status changed to completed
            if (status === 'completed') {
                await this.notificationService.sendServiceCompletionNotification(serviceId);
            }
        } catch (err) {
            this.logger.error(`Error updating service status for ${serviceId}: ${err.message}`);
            this.websocketServer.sendError(ws, 'server_error', 'Error updating service status');
        }
    }

    private async handleGetTechnicianSchedule(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        if (!message.data || !message.data.technicianId) {
            this.websocketServer.sendError(ws, 'invalid_request', 'technicianId is required');
            return;
        }

        const technicianId = message.data.technicianId;
        const date = message.data.date ? new Date(message.data.date) : new Date();
        const connection = this.connectionManager.getConnection(connectionId);

        if (!connection) {
            this.websocketServer.sendError(ws, 'invalid_connection', 'Connection not found');
            return;
        }

        // Check if user has permission to view this technician's schedule
        if (!this.hasTechnicianAccess(connection.metadata.userId, connection.metadata.roles, technicianId)) {
            this.websocketServer.sendError(ws, 'permission_denied', 'You do not have permission to view this technician\'s schedule');
            return;
        }

        try {
            const schedule = await this.technicianService.getTechnicianSchedule(technicianId, date);

            this.websocketServer.sendMessage(ws, {
                type: 'technician_schedule',
                data: {
                    technicianId,
                    date: date.toISOString(),
                    schedule
                }
            });
        } catch (err) {
            this.logger.error(`Error getting schedule for technician ${technicianId}: ${err.message}`);
            this.websocketServer.sendError(ws, 'server_error', 'Error retrieving technician schedule');
        }
    }

    private async handleSubscribeTechnicianUpdates(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        if (!message.data || !message.data.technicianId) {
            this.websocketServer.sendError(ws, 'invalid_request', 'technicianId is required');
            return;
        }

        const technicianId = message.data.technicianId;
        const connection = this.connectionManager.getConnection(connectionId);

        if (!connection) {
            this.websocketServer.sendError(ws, 'invalid_connection', 'Connection not found');
            return;
        }

        // Check if user has permission to access this technician
        if (!this.hasTechnicianAccess(connection.metadata.userId, connection.metadata.roles, technicianId)) {
            this.websocketServer.sendError(ws, 'permission_denied', 'You do not have permission to access this technician');
            return;
        }

        // Create a channel for this technician
        const channel = `technician:${technicianId}:updates`;

        // Subscribe the connection to the channel
        this.connectionManager.addSubscription(connectionId, channel);

        // Send initial technician status
        try {
            const technicianStatus = await this.technicianService.getTechnicianStatus(technicianId);

            this.websocketServer.sendMessage(ws, {
                type: 'technician_updates_subscription',
                data: {
                    channel,
                    initialStatus: technicianStatus,
                    message: `Successfully subscribed to updates for technician ${technicianId}`
                }
            });
        } catch (err) {
            this.logger.error(`Error getting initial technician status for ${technicianId}: ${err.message}`);
            this.websocketServer.sendError(ws, 'server_error', 'Error subscribing to technician updates');
        }
    }

    private async handleSendNotification(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        if (!message.data || !message.data.userId || !message.data.message) {
            this.websocketServer.sendError(ws, 'invalid_request', 'userId and message are required');
            return;
        }

        const { userId, message: notificationMessage, type, data } = message.data;
        const connection = this.connectionManager.getConnection(connectionId);

        if (!connection) {
            this.websocketServer.sendError(ws, 'invalid_connection', 'Connection not found');
            return;
        }

        // Check if user has permission to send notifications
        if (!this.hasNotificationPermission(connection.metadata.userId, connection.metadata.roles)) {
            this.websocketServer.sendError(ws, 'permission_denied', 'You do not have permission to send notifications');
            return;
        }

        try {
            // Send the notification
            const notification = await this.notificationService.createNotification({
                userId,
                message: notificationMessage,
                type: type || 'info',
                data,
                createdBy: connection.metadata.userId
            });

            // Send the notification to the recipient
            this.websocketServer.sendToUser(userId, {
                type: 'notification',
                data: notification
            });

            // Send success response
            this.websocketServer.sendMessage(ws, {
                type: 'notification_sent',
                data: {
                    notificationId: notification.notificationId,
                    message: 'Notification sent successfully'
                }
            });
        } catch (err) {
            this.logger.error(`Error sending notification to ${userId}: ${err.message}`);
            this.websocketServer.sendError(ws, 'server_error', 'Error sending notification');
        }
    }

    private async handleRequestAIAnalysis(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        if (!message.data || !message.data.vehicleId) {
            this.websocketServer.sendError(ws, 'invalid_request', 'vehicleId is required');
            return;
        }

        const { vehicleId, analysisType } = message.data;
        const connection = this.connectionManager.getConnection(connectionId);

        if (!connection) {
            this.websocketServer.sendError(ws, 'invalid_connection', 'Connection not found');
            return;
        }

        // Check if user has permission to request AI analysis
        if (!this.hasAIAnalysisPermission(connection.metadata.userId, connection.metadata.roles)) {
            this.websocketServer.sendError(ws, 'permission_denied', 'You do not have permission to request AI analysis');
            return;
        }

        try {
            // Request the analysis
            const analysisRequest = await this.aiService.requestAnalysis({
                vehicleId,
                analysisType: analysisType || 'maintenance_prediction',
                requestedBy: connection.metadata.userId,
                priority: 'high'
            });

            // Send initial response
            this.websocketServer.sendMessage(ws, {
                type: 'ai_analysis_requested',
                data: {
                    requestId: analysisRequest.requestId,
                    message: 'AI analysis requested successfully'
                }
            });

            // Process the analysis in the background
            this.processAIAnalysis(analysisRequest.requestId, connectionId, vehicleId);
        } catch (err) {
            this.logger.error(`Error requesting AI analysis for ${vehicleId}: ${err.message}`);
            this.websocketServer.sendError(ws, 'server_error', 'Error requesting AI analysis');
        }
    }

    private async processAIAnalysis(requestId: string, connectionId: string, vehicleId: string): Promise<void> {
        try {
            // Get the initial status
            const initialStatus = await this.aiService.getAnalysisStatus(requestId);

            // Send initial status update
            this.websocketServer.sendToConnection(connectionId, {
                type: 'ai_analysis_status',
                data: {
                    requestId,
                    status: initialStatus.status,
                    progress: initialStatus.progress,
                    vehicleId
                }
            });

            // Wait for the analysis to complete
            const result = await this.aiService.waitForAnalysisCompletion(requestId, (status) => {
                // Send progress updates
                this.websocketServer.sendToConnection(connectionId, {
                    type: 'ai_analysis_status',
                    data: {
                        requestId,
                        status: status.status,
                        progress: status.progress,
                        vehicleId
                    }
                });
            });

            // Send the final result
            this.websocketServer.sendToConnection(connectionId, {
                type: 'ai_analysis_result',
                data: {
                    requestId,
                    result,
                    vehicleId
                }
            });

            // Broadcast the result to vehicle subscribers
            const channel = `vehicle:${vehicleId}:updates`;
            this.websocketServer.broadcast(channel, {
                type: 'vehicle_ai_analysis',
                data: {
                    requestId,
                    result,
                    vehicleId
                }
            });
        } catch (err) {
            this.logger.error(`Error processing AI analysis ${requestId}: ${err.message}`);
            this.websocketServer.sendToConnection(connectionId, {
                type: 'ai_analysis_error',
                data: {
                    requestId,
                    error: err.message,
                    vehicleId
                }
            });
        }
    }

    private async handleUpdateVehicleTelemetry(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        if (!message.data || !message.data.vehicleId || !message.data.telemetry) {
            this.websocketServer.sendError(ws, 'invalid_request', 'vehicleId and telemetry data are required');
            return;
        }

        const { vehicleId, telemetry } = message.data;
        const connection = this.connectionManager.getConnection(connectionId);

        if (!connection) {
            this.websocketServer.sendError(ws, 'invalid_connection', 'Connection not found');
            return;
        }

        // Check if user has permission to update vehicle telemetry
        if (!this.hasTelemetryUpdatePermission(connection.metadata.userId, connection.metadata.roles, vehicleId)) {
            this.websocketServer.sendError(ws, 'permission_denied', 'You do not have permission to update vehicle telemetry');
            return;
        }

        try {
            // Update vehicle telemetry
            const updatedVehicle = await this.vehicleService.updateVehicleTelemetry(vehicleId, telemetry);

            // Broadcast the update to all subscribers
            const channel = `vehicle:${vehicleId}:updates`;
            this.websocketServer.broadcast(channel, {
                type: 'vehicle_telemetry_update',
                data: {
                    vehicleId,
                    telemetry: updatedVehicle.telemetry,
                    lastUpdated: updatedVehicle.lastTelemetryUpdate
                }
            });

            // Send success response
            this.websocketServer.sendMessage(ws, {
                type: 'vehicle_telemetry_updated',
                data: {
                    vehicleId,
                    message: 'Vehicle telemetry updated successfully'
                }
            });

            // Check if any alerts should be triggered
            await this.checkTelemetryAlerts(vehicleId, updatedVehicle.telemetry);
        } catch (err) {
            this.logger.error(`Error updating telemetry for vehicle ${vehicleId}: ${err.message}`);
            this.websocketServer.sendError(ws, 'server_error', 'Error updating vehicle telemetry');
        }
    }

    private async checkTelemetryAlerts(vehicleId: string, telemetry: any): Promise<void> {
        try {
            const alerts = await this.aiService.checkTelemetryAlerts(vehicleId, telemetry);

            if (alerts.length > 0) {
                // Create notifications for each alert
                for (const alert of alerts) {
                    await this.notificationService.createNotification({
                        userId: alert.userId,
                        message: alert.message,
                        type: 'alert',
                        data: {
                            vehicleId,
                            alertType: alert.type,
                            severity: alert.severity,
                            telemetry
                        },
                        createdBy: 'system'
                    });

                    // Send the alert to the user
                    this.websocketServer.sendToUser(alert.userId, {
                        type: 'vehicle_alert',
                        data: {
                            vehicleId,
                            alert
                        }
                    });
                }

                // Broadcast to vehicle subscribers
                const channel = `vehicle:${vehicleId}:updates`;
                this.websocketServer.broadcast(channel, {
                    type: 'vehicle_alerts',
                    data: {
                        vehicleId,
                        alerts
                    }
                });
            }
        } catch (err) {
            this.logger.error(`Error checking telemetry alerts for vehicle ${vehicleId}: ${err.message}`);
        }
    }

    private async handleGetServiceQueue(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        const locationId = message.data?.locationId;
        const date = message.data?.date ? new Date(message.data.date) : new Date();
        const connection = this.connectionManager.getConnection(connectionId);

        if (!connection) {
            this.websocketServer.sendError(ws, 'invalid_connection', 'Connection not found');
            return;
        }

        // Check if user has permission to view service queue
        if (!this.hasServiceQueuePermission(connection.metadata.userId, connection.metadata.roles, locationId)) {
            this.websocketServer.sendError(ws, 'permission_denied', 'You do not have permission to view the service queue');
            return;
        }

        try {
            const queue = await this.schedulingService.getServiceQueue({
                locationId,
                date,
                status: message.data?.status
            });

            this.websocketServer.sendMessage(ws, {
                type: 'service_queue',
                data: {
                    locationId,
                    date: date.toISOString(),
                    queue
                }
            });
        } catch (err) {
            this.logger.error(`Error getting service queue: ${err.message}`);
            this.websocketServer.sendError(ws, 'server_error', 'Error retrieving service queue');
        }
    }

    private async handleSubscribeServiceQueueUpdates(connectionId: string, ws: WebSocket, message: any): Promise<void> {
        const locationId = message.data?.locationId;
        const connection = this.connectionManager.getConnection(connectionId);

        if (!connection) {
            this.websocketServer.sendError(ws, 'invalid_connection', 'Connection not found');
            return;
        }

        // Check if user has permission to view service queue
        if (!this.hasServiceQueuePermission(connection.metadata.userId, connection.metadata.roles, locationId)) {
            this.websocketServer.sendError(ws, 'permission_denied', 'You do not have permission to view the service queue');
            return;
        }

        // Create a channel for this service queue
        const channel = locationId
            ? `service_queue:${locationId}:updates`
            : 'service_queue:all:updates';

        // Subscribe the connection to the channel
        this.connectionManager.addSubscription(connectionId, channel);

        // Send initial queue status
        try {
            const queue = await this.schedulingService.getServiceQueue({
                locationId,
                date: new Date()
            });

            this.websocketServer.sendMessage(ws, {
                type: 'service_queue_updates_subscription',
                data: {
                    channel,
                    initialQueue: queue,
                    message: `Successfully subscribed to service queue updates${locationId ? ` for location ${locationId}` : ''}`
                }
            });
        } catch (err) {
            this.logger.error(`Error getting initial service queue: ${err.message}`);
            this.websocketServer.sendError(ws, 'server_error', 'Error subscribing to service queue updates');
        }
    }

    private hasVehicleAccess(userId: string | null, roles: string[], vehicleId: string): boolean {
        // Admin has access to all vehicles
        if (roles.includes('admin')) {
            return true;
        }

        // Technicians have access to vehicles they're assigned to
        if (roles.includes('technician')) {
            return true; // Simplified - in real app, check assignment
        }

        // Customers only have access to their own vehicles
        if (roles.includes('customer')) {
            return true; // Simplified - in real app, check ownership
        }

        return false;
    }

    private hasServiceUpdatePermission(userId: string | null, roles: string[], serviceId: string): boolean {
        // Admin can update any service
        if (roles.includes('admin')) {
            return true;
        }

        // Technicians can update services they're assigned to
        if (roles.includes('technician')) {
            return true; // Simplified - in real app, check assignment
        }

        return false;
    }

    private hasTechnicianAccess(userId: string | null, roles: string[], technicianId: string): boolean {
        // Admin has access to all technicians
        if (roles.includes('admin')) {
            return true;
        }

        // Technicians can only access their own data
        if (roles.includes('technician')) {
            return userId === technicianId;
        }

        return false;
    }

    private hasNotificationPermission(userId: string | null, roles: string[]): boolean {
        // Admin can send notifications to anyone
        if (roles.includes('admin')) {
            return true;
        }

        // Technicians can send notifications to customers
        if (roles.includes('technician')) {
            return true;
        }

        return false;
    }

    private hasAIAnalysisPermission(userId: string | null, roles: string[]): boolean {
        // Admin can request AI analysis
        if (roles.includes('admin')) {
            return true;
        }

        // Technicians can request AI analysis
        if (roles.includes('technician')) {
            return true;
        }

        return false;
    }

    private hasTelemetryUpdatePermission(userId: string | null, roles: string[], vehicleId: string): boolean {
        // Admin can update any vehicle's telemetry
        if (roles.includes('admin')) {
            return true;
        }

        // Technicians can update telemetry for vehicles in service
        if (roles.includes('technician')) {
            return true; // Simplified - in real app, check if vehicle is in service
        }

        // Connected car devices can update their own telemetry
        if (roles.includes('device')) {
            return true; // Simplified - in real app, verify device is associated with vehicle
        }

        return false;
    }

    private hasServiceQueuePermission(userId: string | null, roles: string[], locationId?: string): boolean {
        // Admin can view any service queue
        if (roles.includes('admin')) {
            return true;
        }

        // Technicians can view queues for their location
        if (roles.includes('technician')) {
            return true; // Simplified - in real app, check location assignment
        }

        // Managers can view queues for their location
        if (roles.includes('manager')) {
            return true; // Simplified - in real app, check location assignment
        }

        return false;
    }
}
```

### Client-Side WebSocket Integration

```typescript
// src/websocket/websocketClient.ts
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';
import { WebSocketConfig } from '../config/websocketConfig';
import { PerformanceMonitor } from '../utils/performanceMonitor';

export class WebSocketClient extends EventEmitter {
    private static instance: WebSocketClient;
    private ws: WebSocket | null = null;
    private logger: Logger;
    private config: WebSocketConfig;
    private performanceMonitor: PerformanceMonitor;
    private connectionAttempts: number = 0;
    private maxConnectionAttempts: number = 5;
    private reconnectDelay: number = 1000;
    private maxReconnectDelay: number = 30000;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private connectionTimeout: NodeJS.Timeout | null = null;
    private messageQueue: Array<{ message: any; resolve: (value: any) => void; reject: (reason?: any) => void }> = [];
    private isConnecting: boolean = false;
    private isAuthenticated: boolean = false;
    private connectionId: string | null = null;
    private subscriptions: Set<string> = new Set();
    private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }> = new Map();
    private requestTimeout: number = 10000;

    private constructor() {
        super();
        this.logger = new Logger('WebSocketClient');
        this.config = new WebSocketConfig();
        this.performanceMonitor = PerformanceMonitor.getInstance();
    }

    public static getInstance(): WebSocketClient {
        if (!WebSocketClient.instance) {
            WebSocketClient.instance = new WebSocketClient();
        }
        return WebSocketClient.instance;
    }

    public async connect(authToken?: string): Promise<void> {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            this.logger.warn('WebSocket connection already exists');
            return;
        }

        if (this.isConnecting) {
            this.logger.warn('WebSocket connection is already in progress');
            return;
        }

        this.isConnecting = true;
        this.connectionAttempts = 0;
        this.isAuthenticated = false;
        this.connectionId = null;

        return new Promise((resolve, reject) => {
            this.logger.info('Attempting to connect to WebSocket server');

            // Create WebSocket connection
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = this.config.host || window.location.host;
            const path = this.config.path || '/ws';
            const url = `${protocol}//${host}${path}`;

            try {
                this.ws = new WebSocket(url);
            } catch (err) {
                this.isConnecting = false;
                this.logger.error(`Failed to create WebSocket: ${err.message}`);
                reject(err);
                return;
            }

            // Set up event handlers
            this.ws.onopen = () => this.handleOpen(resolve, reject, authToken);
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = (event) => this.handleClose(event);
            this.ws.onerror = (event) => this.handleError(event);

            // Set up connection timeout
            this.connectionTimeout = setTimeout(() => {
                if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                    this.logger.error('WebSocket connection timeout');
                    this.ws.close(1001, 'Connection timeout');
                    this.isConnecting = false;
                    reject(new Error('WebSocket connection timeout'));
                }
            }, this.config.connectionTimeout);
        });
    }

    private handleOpen(resolve: (value: void) => void, reject: (reason?: any) => void, authToken?: string): void {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }

        this.isConnecting = false;
        this.connectionAttempts = 0;
        this.logger.info('WebSocket connection established');

        // Start heartbeat
        this.startHeartbeat();

        // If auth token is provided, authenticate immediately
        if (authToken) {
            this.authenticate(authToken)
                .then(() => {
                    this.logger.info('WebSocket authentication successful');
                    resolve();
                })
                .catch(err => {
                    this.logger.error(`WebSocket authentication failed: ${err.message}`);
                    reject(err);
                });
        } else {
            resolve();
        }

        this.emit('connect');
        this.performanceMonitor.incrementCounter('websocket_client_connections');
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const message = JSON.parse(event.data);
            this.logger.debug(`Received message: ${JSON.stringify(message)}`);

            // Update last message time
            this.performanceMonitor.recordMetric('websocket_client_last_message', Date.now());

            // Handle different message types
            switch (message.type) {
                case 'connection_ack':
                    this.handleConnectionAck(message);
                    break;
                case 'authentication_success':
                    this.handleAuthenticationSuccess(message);
                    break;
                case 'authentication_failed':
                    this.handleAuthenticationFailed(message);
                    break;
                case 'subscription_success':
                    this.handleSubscriptionSuccess(message);
                    break;
                case 'unsubscription_success':
                    this.handleUnsubscriptionSuccess(message);
                    break;
                case 'vehicle_status':
                    this.handleVehicleStatus(message);
                    break;
                case 'vehicle_updates_subscription':
                    this.handleVehicleUpdatesSubscription(message);
                    break;
                case 'vehicle_telemetry_update':
                    this.handleVehicleTelemetryUpdate(message);
                    break;
                case 'vehicle_service_update':
                    this.handleVehicleServiceUpdate(message);
                    break;
                case 'vehicle_ai_analysis':
                    this.handleVehicleAIAnalysis(message);
                    break;
                case 'vehicle_alert':
                    this.handleVehicleAlert(message);
                    break;
                case 'service_status_update':
                    this.handleServiceStatusUpdate(message);
                    break;
                case 'technician_schedule':
                    this.handleTechnicianSchedule(message);
                    break;
                case 'technician_updates_subscription':
                    this.handleTechnicianUpdatesSubscription(message);
                    break;
                case 'notification':
                    this.handleNotification(message);
                    break;
                case 'ai_analysis_requested':
                    this.handleAIAnalysisRequested(message);
                    break;
                case 'ai_analysis_status':
                    this.handleAIAnalysisStatus(message);
                    break;
                case 'ai_analysis_result':
                    this.handleAIAnalysisResult(message);
                    break;
                case 'ai_analysis_error':
                    this.handleAIAnalysisError(message);
                    break;
                case 'service_queue':
                    this.handleServiceQueue(message);
                    break;
                case 'service_queue_updates_subscription':
                    this.handleServiceQueueUpdatesSubscription(message);
                    break;
                case 'pong':
                    this.handlePong();
                    break;
                case 'error':
                    this.handleErrorMessage(message);
                    break;
                default:
                    // Check if this is a response to a pending request
                    if (message.requestId && this.pendingRequests.has(message.requestId)) {
                        this.handleRequestResponse(message);
                    } else {
                        this.emit('message', message);
                    }
            }

            this.performanceMonitor.incrementCounter('websocket_client_messages_received');
        } catch (err) {
            this.logger.error(`Error processing message: ${err.message}`);
            this.performanceMonitor.recordError('websocket_client_message_error');
        }
    }

    private handleConnectionAck(message: any): void {
        this.connectionId = message.data.connectionId;
        this.logger.info(`WebSocket connection acknowledged with ID: ${this.connectionId}`);

        // Process any queued messages
        this.processMessageQueue();
    }

    private handleAuthenticationSuccess(message: any): void {
        this.isAuthenticated = true;
        this.logger.info(`WebSocket authentication successful for user: ${message.data.userId}`);

        // Process any queued messages
        this.processMessageQueue();

        this.emit('authenticate', message.data);
    }

    private handleAuthenticationFailed(message: any): void {
        this.isAuthenticated = false;
        this.logger.error(`WebSocket authentication failed: ${message.data.message}`);

        this.emit('authentication_failed', message.data);
    }

    private handleSubscriptionSuccess(message: any): void {
        this.subscriptions.add(message.data.channel);
        this.logger.debug(`Successfully subscribed to channel: ${message.data.channel}`);

        this.emit('subscribe', message.data);
    }

    private handleUnsubscriptionSuccess(message: any): void {
        this.subscriptions.delete(message.data.channel);
        this.logger.debug(`Successfully unsubscribed from channel: ${message.data.channel}`);

        this.emit('unsubscribe', message.data);
    }

    private handleVehicleStatus(message: any): void {
        this.emit('vehicle_status', message.data);
    }

    private handleVehicleUpdatesSubscription(message: any): void {
        this.emit('vehicle_updates_subscription', message.data);
    }

    private handleVehicleTelemetryUpdate(message: any): void {
        this.emit('vehicle_telemetry_update', message.data);
    }

    private handleVehicleServiceUpdate(message: any): void {
        this.emit('vehicle_service_update', message.data);
    }

    private handleVehicleAIAnalysis(message: any): void {
        this.emit('vehicle_ai_analysis', message.data);
    }

    private handleVehicleAlert(message: any): void {
        this.emit('vehicle_alert', message.data);
    }

    private handleServiceStatusUpdate(message: any): void {
        this.emit('service_status_update', message.data);
    }

    private handleTechnicianSchedule(message: any): void {
        this.emit('technician_schedule', message.data);
    }

    private handleTechnicianUpdatesSubscription(message: any): void {
        this.emit('technician_updates_subscription', message.data);
    }

    private handleNotification(message: any): void {
        this.emit('notification', message.data);
    }

    private handleAIAnalysisRequested(message: any): void {
        this.emit('ai_analysis_requested', message.data);
    }

    private handleAIAnalysisStatus(message: any): void {
        this.emit('ai_analysis_status', message.data);
    }

    private handleAIAnalysisResult(message: any): void {
        this.emit('ai_analysis_result', message.data);
    }

    private handleAIAnalysisError(message: any): void {
        this.emit('ai_analysis_error', message.data);
    }

    private handleServiceQueue(message: any): void {
        this.emit('service_queue', message.data);
    }

    private handleServiceQueueUpdatesSubscription(message: any): void {
        this.emit('service_queue_updates_subscription', message.data);
    }

    private handlePong(): void {
        this.logger.debug('Received pong from server');
        this.performanceMonitor.recordMetric('websocket_client_last_pong', Date.now());
    }

    private handleErrorMessage(message: any): void {
        this.logger.error(`WebSocket error: ${message.data.message}`);
        this.emit('error', new Error(message.data.message));

        // If this is an authentication error, clear authentication state
        if (message.data.error === 'authentication_failed') {
            this.isAuthenticated = false;
        }
    }

    private handleRequestResponse(message: any): void {
        const requestId = message.requestId;
        const request = this.pendingRequests.get(requestId);

        if (request) {
            if (message.error) {
                request.reject(new Error(message.error));
            } else {
                request.resolve(message);
            }
            this.pendingRequests.delete(requestId);
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

        this.logger.info(`WebSocket connection closed with code ${event.code}: ${event.reason || 'No reason provided'}`);

        // Clear state
        this.ws = null;
        this.isAuthenticated = false;
        this.connectionId = null;

        // Process any pending requests with errors
        for (const [requestId, request] of this.pendingRequests) {
            request.reject(new Error('WebSocket connection closed'));
        }
        this.pendingRequests.clear();

        this.emit('disconnect', { code: event.code, reason: event.reason });

        // Attempt to reconnect if this wasn't a normal closure
        if (event.code !== 1000 && this.connectionAttempts < this.maxConnectionAttempts) {
            this.scheduleReconnect();
        }
    }

    private handleError(event: Event): void {
        this.logger.error('WebSocket error occurred');
        this.performanceMonitor.recordError('websocket_client_error');

        // The close event will be triggered after this
    }

    private scheduleReconnect(): void {
        this.connectionAttempts++;
        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.connectionAttempts - 1),
            this.maxReconnectDelay
        );

        this.logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.connectionAttempts})`);

        setTimeout(() => {
            this.connect()
                .then(() => {
                    this.logger.info('WebSocket reconnected successfully');
                })
                .catch(err => {
                    this.logger.error(`WebSocket reconnection failed: ${err.message}`);
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
                try {
                    this.ws.send(JSON.stringify({ type: 'ping' }));
                    this.logger.debug('Sent ping to server');
                    this.performanceMonitor.incrementCounter('websocket_client_pings_sent');
                } catch (err) {
                    this.logger.error(`Error sending ping: ${err.message}`);
                }
            }
        }, this.config.heartbeatInterval);
    }

    public async authenticate(token: string): Promise<any> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        return new Promise((resolve, reject) => {
            const requestId = this.generateRequestId();

            this.pendingRequests.set(requestId, { resolve, reject });

            this.sendMessage({
                type: 'authenticate',
                data: { token },
                requestId
            }).catch(err => {
                this.pendingRequests.delete(requestId);
                reject(err);
            });

            // Set timeout for the request
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Authentication timeout'));
                }
            }, this.requestTimeout);
        });
    }

    public async subscribe(channel: string): Promise<any> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        return new Promise((resolve, reject) => {
            const requestId = this.generateRequestId();

            this.pendingRequests.set(requestId, { resolve, reject });

            this.sendMessage({
                type: 'subscribe',
                data: { channel },
                requestId
            }).catch(err => {
                this.pendingRequests.delete(requestId);
                reject(err);
            });

            // Set timeout for the request
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Subscription timeout'));
                }
            }, this.requestTimeout);
        });
    }

    public async unsubscribe(channel: string): Promise<any> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        return new Promise((resolve, reject) => {
            const requestId = this.generateRequestId();

            this.pendingRequests.set(requestId, { resolve, reject });

            this.sendMessage({
                type: 'unsubscribe',
                data: { channel },
                requestId
            }).catch(err => {
                this.pendingRequests.delete(requestId);
                reject(err);
            });

            // Set timeout for the request
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Unsubscription timeout'));
                }
            }, this.requestTimeout);
        });
    }

    public async getVehicleStatus(vehicleId: string): Promise<any> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        return new Promise((resolve, reject) => {
            const requestId = this.generateRequestId();

            this.pendingRequests.set(requestId, { resolve, reject });

            this.sendMessage({
                type: 'get_vehicle_status',
                data: { vehicleId },
                requestId
            }).catch(err => {
                this.pendingRequests.delete(requestId);
                reject(err);
            });

            // Set timeout for the request
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pending