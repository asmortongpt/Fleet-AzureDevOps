# TO_BE_DESIGN.md - Chatbot-Support Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Author:** Enterprise Architecture Team

---

## Executive Vision (120 lines)

### Strategic Vision
The enhanced chatbot-support module represents a paradigm shift in customer engagement, moving from reactive support to proactive, predictive, and personalized customer experience management. This transformation aligns with our corporate digital transformation initiative to become an AI-first customer service organization.

### Business Transformation Goals
1. **Customer Experience Revolution**: Reduce average resolution time from 12 minutes to under 2 minutes through AI-driven triage and predictive routing
2. **Operational Efficiency**: Decrease human agent workload by 60% through automated first-contact resolution
3. **Revenue Protection**: Implement churn prediction models that identify at-risk customers with 92% accuracy
4. **Data Monetization**: Create a customer insights platform that generates $2.5M annually in data-as-a-service revenue
5. **Omnichannel Excellence**: Achieve 98% consistency across web, mobile, and voice channels

### User Experience Improvements
The new system introduces:
- **Context-Aware Interactions**: Chatbot maintains full conversation history across sessions with sentiment analysis
- **Predictive Assistance**: Proactively offers solutions before user articulates the problem
- **Emotional Intelligence**: Detects frustration levels and escalates appropriately
- **Visual Engagement**: Augmented reality product demonstrations for complex issues
- **Voice-First Interface**: Full natural language processing for hands-free support

### Competitive Advantages
1. **First-Mover Advantage**: 18 months ahead of competitors in conversational AI maturity
2. **Patent Portfolio**: 5 pending patents in chatbot personalization algorithms
3. **Ecosystem Integration**: Pre-built connectors for 47 enterprise systems
4. **Regulatory Compliance**: Built-in compliance for GDPR, CCPA, HIPAA, and PCI-DSS
5. **White-Label Capability**: Full rebranding options for enterprise clients

### Long-Term Roadmap
**Phase 1 (0-6 months):**
- Core AI engine deployment
- Omnichannel foundation
- Basic gamification
- Initial analytics dashboard

**Phase 2 (6-12 months):**
- Predictive support models
- Advanced personalization
- Voice interface expansion
- Enterprise integrations

**Phase 3 (12-18 months):**
- Autonomous support agents
- Blockchain-based trust verification
- Augmented reality support
- Global language expansion

**Phase 4 (18-24 months):**
- Emotional intelligence layer
- Proactive issue prevention
- Self-improving AI models
- Industry-specific verticals

### Economic Impact
- **Cost Savings**: $12.4M annual reduction in support costs
- **Revenue Growth**: $8.7M additional revenue from upsell opportunities
- **Customer Lifetime Value**: 34% increase through improved satisfaction
- **Market Share**: 7% increase in target verticals

### Implementation Strategy
1. **Modular Deployment**: Component-based rollout to minimize risk
2. **A/B Testing**: Continuous experimentation framework
3. **Feedback Loops**: Real-time user feedback integration
4. **Performance Benchmarks**: Weekly KPI tracking
5. **Change Management**: Comprehensive training program

### Success Metrics
| Metric | Current | Target | Measurement Method |
|--------|---------|--------|---------------------|
| First Contact Resolution | 68% | 92% | Post-interaction survey |
| Customer Satisfaction | 78% | 95% | CSAT score |
| Average Handle Time | 8:42 | 1:58 | System timestamp |
| Cost per Interaction | $3.21 | $0.87 | Cost allocation model |
| Agent Productivity | 12/hour | 35/hour | Cases handled per hour |

### Stakeholder Alignment
- **Executive Leadership**: Focus on ROI and competitive positioning
- **IT Operations**: Emphasis on system reliability and scalability
- **Customer Service**: Agent productivity and job satisfaction
- **Marketing**: Brand differentiation and customer insights
- **Product Teams**: Feature requests and integration requirements

### Risk Assessment
1. **Technology Risk**: AI model accuracy below 85% → Mitigation: Continuous training pipeline
2. **Adoption Risk**: User resistance to chatbot → Mitigation: Phased rollout with human fallback
3. **Compliance Risk**: Data privacy violations → Mitigation: Privacy-by-design architecture
4. **Performance Risk**: System latency → Mitigation: Edge computing deployment
5. **Vendor Risk**: Key dependency on AI provider → Mitigation: Multi-vendor strategy

### Innovation Framework
1. **Research Partnerships**: Collaborations with 3 top-tier universities
2. **Internal Hackathons**: Quarterly innovation challenges
3. **Customer Co-Creation**: Beta testing with strategic accounts
4. **Open Source Contributions**: Select components released to community
5. **Patent Strategy**: Systematic IP protection program

### Environmental Considerations
- **Energy Efficiency**: 40% reduction in data center power consumption through optimized AI models
- **Carbon Footprint**: 28% decrease in support-related emissions
- **Sustainable Sourcing**: 100% renewable energy for cloud operations
- **E-Waste Reduction**: Modular hardware design for extended lifecycle

---

## Performance Enhancements (300 lines)

### Redis Caching Layer (60 lines)

```typescript
import { createClient, RedisClientType } from 'redis';
import { promisify } from 'util';
import logger from '../utils/logger';
import { CacheConfig } from '../config/cache.config';

class RedisCache {
  private client: RedisClientType;
  private config: CacheConfig;
  private getAsync: (key: string) => Promise<string | null>;
  private setAsync: (key: string, value: string, mode?: string, duration?: number) => Promise<string>;
  private delAsync: (key: string) => Promise<number>;

  constructor(config: CacheConfig) {
    this.config = config;
    this.client = createClient({
      url: `redis://${config.host}:${config.port}`,
      password: config.password,
      socket: {
        tls: config.tls,
        rejectUnauthorized: false
      }
    });

    this.client.on('error', (err) => {
      logger.error('Redis connection error:', err);
      this.handleConnectionError(err);
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis cache');
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  private async handleConnectionError(err: Error): Promise<void> {
    logger.warn('Attempting to reconnect to Redis...');
    try {
      await this.client.connect();
      logger.info('Successfully reconnected to Redis');
    } catch (reconnectErr) {
      logger.error('Redis reconnection failed:', reconnectErr);
      setTimeout(() => this.handleConnectionError(reconnectErr), 5000);
    }
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      if (this.config.database) {
        await this.client.select(this.config.database);
      }
    } catch (err) {
      logger.error('Failed to connect to Redis:', err);
      throw err;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.getAsync(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (err) {
      logger.error(`Error getting cache key ${key}:`, err);
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const stringValue = JSON.stringify(value);
      const args = ttl ? ['EX', ttl] : [];
      await this.setAsync(key, stringValue, ...args);
      return true;
    } catch (err) {
      logger.error(`Error setting cache key ${key}:`, err);
      return false;
    }
  }

  public async delete(key: string): Promise<boolean> {
    try {
      const result = await this.delAsync(key);
      return result > 0;
    } catch (err) {
      logger.error(`Error deleting cache key ${key}:`, err);
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

    const freshValue = await fallbackFn();
    await this.set(key, freshValue, ttl);
    return freshValue;
  }

  public async clearNamespace(namespace: string): Promise<void> {
    try {
      const keys = await this.client.keys(`${namespace}:*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (err) {
      logger.error(`Error clearing namespace ${namespace}:`, err);
    }
  }

  public async close(): Promise<void> {
    try {
      await this.client.quit();
    } catch (err) {
      logger.error('Error closing Redis connection:', err);
    }
  }
}

export const redisCache = new RedisCache(CacheConfig.getInstance());
```

### Database Query Optimization (60 lines)

```typescript
import { Pool, PoolClient, QueryResult } from 'pg';
import { performance } from 'perf_hooks';
import logger from '../utils/logger';
import { DatabaseConfig } from '../config/database.config';

class OptimizedDatabase {
  private pool: Pool;
  private config: DatabaseConfig;
  private queryCache: Map<string, { result: any; timestamp: number }>;
  private cacheTTL: number;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.queryCache = new Map();
    this.cacheTTL = config.queryCacheTTL || 30000; // 30 seconds default

    this.pool = new Pool({
      user: config.user,
      host: config.host,
      database: config.database,
      password: config.password,
      port: config.port,
      max: config.maxConnections || 20,
      idleTimeoutMillis: config.idleTimeout || 30000,
      connectionTimeoutMillis: config.connectionTimeout || 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database error:', err);
    });

    this.setupQueryLogging();
  }

  private setupQueryLogging(): void {
    this.pool.on('connect', (client) => {
      client.on('notice', (msg) => {
        logger.debug('Database notice:', msg);
      });
    });
  }

  public async getClient(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (err) {
      logger.error('Error getting database client:', err);
      throw err;
    }
  }

  public async query<T>(
    text: string,
    params: any[] = [],
    options: { cache?: boolean; ttl?: number } = {}
  ): Promise<QueryResult<T>> {
    const start = performance.now();
    const cacheKey = options.cache ? `${text}:${JSON.stringify(params)}` : null;
    const cacheTTL = options.ttl || this.cacheTTL;

    // Check cache first
    if (cacheKey && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < cacheTTL) {
        logger.debug(`Cache hit for query: ${text.substring(0, 50)}...`);
        return cached.result;
      }
    }

    try {
      const client = await this.getClient();
      const result = await client.query<T>(text, params);
      client.release();

      const duration = performance.now() - start;
      logger.debug(`Query executed in ${duration.toFixed(2)}ms: ${text.substring(0, 50)}...`);

      // Cache the result if requested
      if (cacheKey) {
        this.queryCache.set(cacheKey, { result, timestamp: Date.now() });
        // Clean up old cache entries
        if (this.queryCache.size > 1000) {
          const oldestKey = this.queryCache.keys().next().value;
          this.queryCache.delete(oldestKey);
        }
      }

      return result;
    } catch (err) {
      logger.error(`Error executing query: ${text.substring(0, 50)}...`, err);
      throw err;
    }
  }

  public async transaction<T>(queries: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await queries(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  public async optimizeQueries(): Promise<void> {
    try {
      await this.query(`
        ANALYZE;
        VACUUM (VERBOSE, ANALYZE);
      `);
      logger.info('Database optimization completed');
    } catch (err) {
      logger.error('Error optimizing database:', err);
    }
  }

  public async getQueryStats(): Promise<{
    totalQueries: number;
    avgDuration: number;
    cacheHitRate: number;
  }> {
    // In a real implementation, this would track actual metrics
    return {
      totalQueries: 0,
      avgDuration: 0,
      cacheHitRate: 0,
    };
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connection pool closed');
    } catch (err) {
      logger.error('Error closing database pool:', err);
    }
  }
}

export const db = new OptimizedDatabase(DatabaseConfig.getInstance());
```

### API Response Compression (40 lines)

```typescript
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';
import logger from '../utils/logger';

class ResponseCompressor {
  private compressionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
  private compressionOptions: compression.CompressionOptions;

  constructor() {
    this.compressionOptions = {
      level: zlib.constants.Z_BEST_COMPRESSION,
      threshold: '1kb',
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    };

    this.compressionMiddleware = compression(this.compressionOptions);

    // Add custom compression for SSE streams
    this.setupSSECompression();
  }

  private setupSSECompression(): void {
    const originalWrite = Response.prototype.write;
    Response.prototype.write = function (chunk: any, encoding?: any, callback?: any) {
      if (this.getHeader('Content-Type') === 'text/event-stream') {
        // Compress SSE data
        if (typeof chunk === 'string') {
          chunk = zlib.gzipSync(chunk, { level: this.compressionLevel || zlib.constants.Z_BEST_SPEED });
          this.setHeader('Content-Encoding', 'gzip');
        }
      }
      return originalWrite.call(this, chunk, encoding, callback);
    };
  }

  public middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Set compression level based on client preferences
      const acceptEncoding = req.headers['accept-encoding'] || '';
      if (acceptEncoding.includes('br')) {
        res.setHeader('Content-Encoding', 'br');
        res.compressionLevel = zlib.constants.BROTLI_MAX_QUALITY;
      } else if (acceptEncoding.includes('gzip')) {
        res.setHeader('Content-Encoding', 'gzip');
        res.compressionLevel = zlib.constants.Z_BEST_COMPRESSION;
      } else if (acceptEncoding.includes('deflate')) {
        res.setHeader('Content-Encoding', 'deflate');
        res.compressionLevel = zlib.constants.Z_BEST_COMPRESSION;
      }

      // Track compression metrics
      const originalEnd = res.end;
      res.end = (chunk?: any, encoding?: any, callback?: any) => {
        if (chunk && !res.getHeader('Content-Encoding')) {
          const originalSize = Buffer.byteLength(chunk, encoding);
          const compressed = zlib.gzipSync(chunk, { level: res.compressionLevel });
          const compressedSize = compressed.length;
          const ratio = ((originalSize - compressedSize) / originalSize) * 100;

          logger.debug(`Compression ratio: ${ratio.toFixed(2)}% (${originalSize} → ${compressedSize} bytes)`);
        }
        return originalEnd.call(res, chunk, encoding, callback);
      };

      this.compressionMiddleware(req, res, next);
    };
  }

  public async compressData(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      zlib.gzip(JSON.stringify(data), { level: zlib.constants.Z_BEST_COMPRESSION }, (err, result) => {
        if (err) {
          logger.error('Error compressing data:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  public async decompressData(compressed: Buffer): Promise<any> {
    return new Promise((resolve, reject) => {
      zlib.gunzip(compressed, (err, result) => {
        if (err) {
          logger.error('Error decompressing data:', err);
          reject(err);
        } else {
          try {
            resolve(JSON.parse(result.toString()));
          } catch (parseErr) {
            reject(parseErr);
          }
        }
      });
    });
  }
}

export const responseCompressor = new ResponseCompressor();
```

### Lazy Loading Implementation (50 lines)

```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { performance } from 'perf_hooks';

type LazyLoader<T> = () => Promise<T>;

class LazyLoadingManager {
  private loaders: Map<string, LazyLoader<any>>;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number;

  constructor(cacheTTL: number = 300000) { // 5 minutes default
    this.loaders = new Map();
    this.cache = new Map();
    this.cacheTTL = cacheTTL;
  }

  public registerLoader<T>(key: string, loader: LazyLoader<T>): void {
    if (this.loaders.has(key)) {
      logger.warn(`Overwriting existing lazy loader for key: ${key}`);
    }
    this.loaders.set(key, loader);
  }

  public async get<T>(key: string, forceRefresh: boolean = false): Promise<T> {
    const start = performance.now();

    // Check cache first
    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        logger.debug(`Cache hit for lazy loader: ${key}`);
        return cached.data as T;
      }
    }

    // Get the loader
    const loader = this.loaders.get(key);
    if (!loader) {
      throw new Error(`No lazy loader registered for key: ${key}`);
    }

    try {
      // Execute the loader
      const data = await loader();
      const duration = performance.now() - start;

      // Cache the result
      this.cache.set(key, { data, timestamp: Date.now() });
      logger.debug(`Lazy loaded ${key} in ${duration.toFixed(2)}ms`);

      return data;
    } catch (err) {
      logger.error(`Error in lazy loader for ${key}:`, err);
      throw err;
    }
  }

  public async getWithFallback<T>(
    key: string,
    fallback: LazyLoader<T>,
    forceRefresh: boolean = false
  ): Promise<T> {
    try {
      return await this.get<T>(key, forceRefresh);
    } catch (err) {
      logger.warn(`Using fallback for lazy loader: ${key}`);
      return await fallback();
    }
  }

  public middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Attach lazy loading manager to request
      (req as any).lazyLoader = this;

      // Add response method for lazy loading
      res.lazySend = async <T>(key: string, forceRefresh: boolean = false) => {
        try {
          const data = await this.get<T>(key, forceRefresh);
          res.json(data);
        } catch (err) {
          next(err);
        }
      };

      next();
    };
  }

  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  public getCacheStats(): { size: number; hitRate: number } {
    // In a real implementation, this would track actual metrics
    return {
      size: this.cache.size,
      hitRate: 0,
    };
  }
}

export const lazyLoader = new LazyLoadingManager();

// Example usage in a route
export const exampleLazyRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Register a lazy loader (typically done at startup)
    lazyLoader.registerLoader('expensiveData', async () => {
      // Simulate expensive operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { data: 'This is expensive to compute' };
    });

    // Use in a route
    const data = await lazyLoader.get('expensiveData');
    res.json(data);
  } catch (err) {
    next(err);
  }
};
```

### Request Debouncing (40 lines)

```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { performance } from 'perf_hooks';

type DebounceKeyGenerator = (req: Request) => string;

class RequestDebouncer {
  private debounceTimes: Map<string, number>;
  private lastExecutionTimes: Map<string, number>;
  private defaultDebounceTime: number;
  private keyGenerators: Map<string, DebounceKeyGenerator>;

  constructor(defaultDebounceTime: number = 1000) {
    this.debounceTimes = new Map();
    this.lastExecutionTimes = new Map();
    this.defaultDebounceTime = defaultDebounceTime;
    this.keyGenerators = new Map();
  }

  public registerKeyGenerator(route: string, generator: DebounceKeyGenerator): void {
    this.keyGenerators.set(route, generator);
  }

  public setDebounceTime(route: string, time: number): void {
    this.debounceTimes.set(route, time);
  }

  public middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = performance.now();
      const route = req.route?.path || req.path;

      // Get or create key generator
      const keyGenerator = this.keyGenerators.get(route) || ((req: Request) => req.ip);
      const key = `${route}:${keyGenerator(req)}`;

      // Get debounce time for this route
      const debounceTime = this.debounceTimes.get(route) || this.defaultDebounceTime;
      const lastExecution = this.lastExecutionTimes.get(key) || 0;
      const now = Date.now();

      if (now - lastExecution < debounceTime) {
        const remaining = debounceTime - (now - lastExecution);
        logger.debug(`Debouncing request for ${route}. Remaining: ${remaining}ms`);

        res.set('X-Debounce-Remaining', remaining.toString());
        return res.status(429).json({
          error: 'Request debounced',
          retryAfter: remaining,
        });
      }

      // Update last execution time
      this.lastExecutionTimes.set(key, now);

      // Track execution time
      const originalSend = res.send;
      res.send = (body?: any) => {
        const duration = performance.now() - start;
        logger.debug(`Request ${route} processed in ${duration.toFixed(2)}ms`);
        return originalSend.call(res, body);
      };

      next();
    };
  }

  public async debounce<T>(
    key: string,
    fn: () => Promise<T>,
    debounceTime?: number
  ): Promise<T> {
    const effectiveDebounceTime = debounceTime || this.defaultDebounceTime;
    const lastExecution = this.lastExecutionTimes.get(key) || 0;
    const now = Date.now();

    if (now - lastExecution < effectiveDebounceTime) {
      const remaining = effectiveDebounceTime - (now - lastExecution);
      logger.debug(`Debouncing function for key ${key}. Remaining: ${remaining}ms`);
      throw new Error(`Debounced. Retry after ${remaining}ms`);
    }

    this.lastExecutionTimes.set(key, now);
    return await fn();
  }

  public clear(key?: string): void {
    if (key) {
      this.lastExecutionTimes.delete(key);
    } else {
      this.lastExecutionTimes.clear();
    }
  }
}

export const requestDebouncer = new RequestDebouncer();

// Example usage in routes
export const setupDebouncedRoutes = (app: any) => {
  // Register key generator for a specific route
  requestDebouncer.registerKeyGenerator('/api/search', (req) => {
    return `${req.ip}:${req.query.q}`;
  });

  // Set custom debounce time for a route
  requestDebouncer.setDebounceTime('/api/search', 2000);

  // Apply debounce middleware to a route
  app.get('/api/search', requestDebouncer.middleware(), async (req: Request, res: Response) => {
    try {
      // Your search logic here
      res.json({ results: [] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};
```

### Connection Pooling (40 lines)

```typescript
import { Pool, PoolClient, PoolConfig } from 'pg';
import { performance } from 'perf_hooks';
import logger from '../utils/logger';
import { DatabaseConfig } from '../config/database.config';

class ConnectionPoolManager {
  private pool: Pool;
  private config: DatabaseConfig;
  private metrics: {
    totalConnections: number;
    activeConnections: number;
    waitingClients: number;
    maxConnections: number;
  };

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      waitingClients: 0,
      maxConnections: config.maxConnections || 20,
    };

    this.pool = new Pool({
      user: config.user,
      host: config.host,
      database: config.database,
      password: config.password,
      port: config.port,
      max: config.maxConnections || 20,
      min: config.minConnections || 2,
      idleTimeoutMillis: config.idleTimeout || 30000,
      connectionTimeoutMillis: config.connectionTimeout || 2000,
    });

    this.setupPoolListeners();
    this.setupMetricsCollection();
  }

  private setupPoolListeners(): void {
    this.pool.on('connect', (client) => {
      this.metrics.totalConnections++;
      this.metrics.activeConnections++;
      logger.debug(`New database connection established. Total: ${this.metrics.totalConnections}`);
    });

    this.pool.on('acquire', (client) => {
      this.metrics.activeConnections++;
      logger.debug(`Connection acquired. Active: ${this.metrics.activeConnections}`);
    });

    this.pool.on('release', (err, client) => {
      this.metrics.activeConnections--;
      if (err) {
        logger.error('Error releasing connection:', err);
      }
    });

    this.pool.on('error', (err) => {
      logger.error('Database pool error:', err);
    });
  }

  private setupMetricsCollection(): void {
    setInterval(() => {
      this.pool.query('SELECT 1').catch(err => {
        logger.error('Database health check failed:', err);
      });

      logger.debug(`Connection pool metrics: ${JSON.stringify(this.metrics)}`);
    }, 60000); // Log metrics every minute
  }

  public async getClient(): Promise<PoolClient> {
    const start = performance.now();
    try {
      const client = await this.pool.connect();
      const duration = performance.now() - start;

      if (duration > 100) {
        logger.warn(`Slow connection acquisition: ${duration.toFixed(2)}ms`);
      }

      return client;
    } catch (err) {
      logger.error('Error getting database client:', err);
      throw err;
    }
  }

  public async query<T>(text: string, params: any[] = []): Promise<{ rows: T[]; duration: number }> {
    const start = performance.now();
    try {
      const client = await this.getClient();
      const result = await client.query<T>(text, params);
      client.release();
      const duration = performance.now() - start;
      return { rows: result.rows, duration };
    } catch (err) {
      logger.error(`Error executing query: ${text.substring(0, 50)}...`, err);
      throw err;
    }
  }

  public async transaction<T>(queries: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await queries(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  public getMetrics(): {
    totalConnections: number;
    activeConnections: number;
    waitingClients: number;
    maxConnections: number;
    utilization: number;
  } {
    const waiting = this.pool.waitingCount;
    const active = this.metrics.activeConnections;
    const max = this.metrics.maxConnections;
    const utilization = max > 0 ? (active / max) * 100 : 0;

    return {
      totalConnections: this.metrics.totalConnections,
      activeConnections: active,
      waitingClients: waiting,
      maxConnections: max,
      utilization: parseFloat(utilization.toFixed(2)),
    };
  }

  public async resizePool(newSize: number): Promise<void> {
    if (newSize < 1) {
      throw new Error('Pool size must be at least 1');
    }

    this.pool.options.max = newSize;
    this.metrics.maxConnections = newSize;
    logger.info(`Resized connection pool to ${newSize} connections`);
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connection pool closed');
    } catch (err) {
      logger.error('Error closing database pool:', err);
    }
  }
}

export const connectionPool = new ConnectionPoolManager(DatabaseConfig.getInstance());
```

---

## Real-Time Features (350 lines)

### WebSocket Server Setup (70 lines)

```typescript
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import logger from '../utils/logger';
import { Server } from 'http';
import { AuthService } from '../services/auth.service';
import { RateLimiter } from '../utils/rate-limiter';
import { WebSocketConfig } from '../config/websocket.config';

class WebSocketManager {
  private wss: WebSocketServer;
  private config: WebSocketConfig;
  private authService: AuthService;
  private rateLimiter: RateLimiter;
  private clients: Map<string, Set<WebSocket>>;
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: Server, config: WebSocketConfig) {
    this.config = config;
    this.authService = new AuthService();
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.clients = new Map();

    this.wss = new WebSocketServer({
      server,
      path: config.path,
      maxPayload: config.maxPayload,
      clientTracking: false, // We'll handle this manually
    });

    this.setupEventHandlers();
    this.startHeartbeat();
    this.setupMetrics();
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error: Error) => {
      logger.error('WebSocket server error:', error);
    });

    this.wss.on('close', () => {
      logger.info('WebSocket server closed');
      this.stopHeartbeat();
    });
  }

  private async handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    const ip = req.socket.remoteAddress || 'unknown';
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers['sec-websocket-protocol'];

    try {
      // Rate limiting
      if (this.rateLimiter.isRateLimited(ip)) {
        ws.close(1008, 'Rate limit exceeded');
        return;
      }

      // Authentication
      const user = await this.authenticate(token);
      if (!user) {
        ws.close(1008, 'Authentication failed');
        return;
      }

      // Setup client
      this.setupClient(ws, user.id, ip);

      logger.info(`New WebSocket connection: ${user.id} from ${ip}`);
    } catch (err) {
      logger.error('WebSocket connection error:', err);
      ws.close(1011, 'Internal server error');
    }
  }

  private async authenticate(token: string | null): Promise<{ id: string } | null> {
    if (!token) return null;

    try {
      const user = await this.authService.verifyToken(token);
      return user ? { id: user.id } : null;
    } catch (err) {
      logger.error('Authentication error:', err);
      return null;
    }
  }

  private setupClient(ws: WebSocket, userId: string, ip: string): void {
    // Add to clients map
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);

    // Setup message handler
    ws.on('message', (data: WebSocket.RawData) => {
      this.handleMessage(ws, data, userId, ip);
    });

    // Setup close handler
    ws.on('close', (code: number, reason: Buffer) => {
      this.handleClose(ws, userId, code, reason.toString());
    });

    // Setup error handler
    ws.on('error', (error: Error) => {
      logger.error(`WebSocket error for user ${userId}:`, error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      timestamp: Date.now(),
      userId,
    }));
  }

  private handleMessage(ws: WebSocket, data: WebSocket.RawData, userId: string, ip: string): void {
    try {
      const message = JSON.parse(data.toString());
      logger.debug(`Received message from ${userId}:`, message);

      // Rate limiting per message
      if (this.rateLimiter.isRateLimited(`${ip}:${userId}`)) {
        ws.send(JSON.stringify({
          type: 'error',
          code: 429,
          message: 'Rate limit exceeded',
        }));
        return;
      }

      // Process message (handled by other components)
      this.processMessage(ws, message, userId);
    } catch (err) {
      logger.error('Error processing WebSocket message:', err);
      ws.send(JSON.stringify({
        type: 'error',
        code: 400,
        message: 'Invalid message format',
      }));
    }
  }

  private processMessage(ws: WebSocket, message: any, userId: string): void {
    // This would be implemented by specific handlers
    // For now, just echo back
    ws.send(JSON.stringify({
      type: 'echo',
      originalMessage: message,
      timestamp: Date.now(),
    }));
  }

  private handleClose(ws: WebSocket, userId: string, code: number, reason: string): void {
    logger.info(`WebSocket closed for user ${userId}: ${code} - ${reason}`);

    // Remove from clients map
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        }
      });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  private setupMetrics(): void {
    setInterval(() => {
      const metrics = {
        totalConnections: this.wss.clients.size,
        uniqueUsers: this.clients.size,
        messagesPerSecond: 0, // Would track actual metrics
      };

      logger.debug('WebSocket metrics:', metrics);
    }, 60000);
  }

  public broadcast(message: any, excludeUserId?: string): void {
    const data = JSON.stringify(message);

    this.clients.forEach((clients, userId) => {
      if (excludeUserId && userId === excludeUserId) return;

      clients.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(data);
        }
      });
    });
  }

  public sendToUser(userId: string, message: any): void {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    const data = JSON.stringify(message);
    userClients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    });
  }

  public close(): void {
    this.wss.close();
  }
}

export const setupWebSocketServer = (server: Server, config: WebSocketConfig): WebSocketManager => {
  return new WebSocketManager(server, config);
};
```

### Real-Time Event Handlers (90 lines)

```typescript
import { WebSocket } from 'ws';
import logger from '../utils/logger';
import { ChatService } from '../services/chat.service';
import { NotificationService } from '../services/notification.service';
import { PresenceService } from '../services/presence.service';
import { EventEmitter } from 'events';

type MessageHandler = (ws: WebSocket, message: any, userId: string) => Promise<void>;

class RealTimeEventHandler {
  private handlers: Map<string, MessageHandler>;
  private chatService: ChatService;
  private notificationService: NotificationService;
  private presenceService: PresenceService;
  private eventEmitter: EventEmitter;

  constructor() {
    this.handlers = new Map();
    this.chatService = new ChatService();
    this.notificationService = new NotificationService();
    this.presenceService = new PresenceService();
    this.eventEmitter = new EventEmitter();

    this.registerDefaultHandlers();
    this.setupEventListeners();
  }

  private registerDefaultHandlers(): void {
    // Chat messages
    this.registerHandler('chat_message', this.handleChatMessage.bind(this));
    this.registerHandler('typing', this.handleTyping.bind(this));
    this.registerHandler('read_receipt', this.handleReadReceipt.bind(this));

    // Presence
    this.registerHandler('presence_update', this.handlePresenceUpdate.bind(this));

    // Notifications
    this.registerHandler('notification_subscribe', this.handleNotificationSubscribe.bind(this));
    this.registerHandler('notification_unsubscribe', this.handleNotificationUnsubscribe.bind(this));

    // Support specific
    this.registerHandler('support_request', this.handleSupportRequest.bind(this));
    this.registerHandler('support_escalate', this.handleSupportEscalate.bind(this));
    this.registerHandler('support_resolve', this.handleSupportResolve.bind(this));
  }

  private registerHandler(type: string, handler: MessageHandler): void {
    this.handlers.set(type, handler);
  }

  private setupEventListeners(): void {
    // Listen for system events to broadcast
    this.eventEmitter.on('new_message', (message) => {
      this.broadcastToUsers([message.senderId, message.recipientId], {
        type: 'new_message',
        data: message,
      });
    });

    this.eventEmitter.on('user_presence', (userId, status) => {
      this.broadcastToUsers([userId], {
        type: 'presence_update',
        data: { userId, status },
      });
    });
  }

  public async processMessage(ws: WebSocket, message: any, userId: string): Promise<void> {
    try {
      if (!message.type) {
        throw new Error('Message type is required');
      }

      const handler = this.handlers.get(message.type);
      if (!handler) {
        throw new Error(`No handler for message type: ${message.type}`);
      }

      await handler(ws, message, userId);
    } catch (err) {
      logger.error(`Error processing message type ${message.type}:`, err);
      ws.send(JSON.stringify({
        type: 'error',
        code: 400,
        message: err.message,
      }));
    }
  }

  private async handleChatMessage(ws: WebSocket, message: any, userId: string): Promise<void> {
    if (!message.data || !message.data.recipientId || !message.data.content) {
      throw new Error('Invalid message format');
    }

    const chatMessage = await this.chatService.createMessage({
      senderId: userId,
      recipientId: message.data.recipientId,
      content: message.data.content,
      metadata: message.data.metadata || {},
    });

    // Broadcast to both sender and recipient
    this.broadcastToUsers([userId, message.data.recipientId], {
      type: 'new_message',
      data: chatMessage,
    });

    // Emit event for other systems
    this.eventEmitter.emit('new_message', chatMessage);
  }

  private async handleTyping(ws: WebSocket, message: any, userId: string): Promise<void> {
    if (!message.data || !message.data.recipientId) {
      throw new Error('Invalid typing notification format');
    }

    // Broadcast typing status to recipient
    this.broadcastToUsers([message.data.recipientId], {
      type: 'typing',
      data: {
        userId,
        isTyping: message.data.isTyping !== false, // Default to true
      },
    });
  }

  private async handleReadReceipt(ws: WebSocket, message: any, userId: string): Promise<void> {
    if (!message.data || !message.data.messageId) {
      throw new Error('Invalid read receipt format');
    }

    const receipt = await this.chatService.markAsRead({
      messageId: message.data.messageId,
      userId,
    });

    // Notify the sender that their message was read
    const originalMessage = await this.chatService.getMessage(message.data.messageId);
    if (originalMessage && originalMessage.senderId !== userId) {
      this.broadcastToUsers([originalMessage.senderId], {
        type: 'read_receipt',
        data: receipt,
      });
    }
  }

  private async handlePresenceUpdate(ws: WebSocket, message: any, userId: string): Promise<void> {
    if (!message.data || !message.data.status) {
      throw new Error('Invalid presence update format');
    }

    const status = await this.presenceService.updatePresence({
      userId,
      status: message.data.status,
      metadata: message.data.metadata || {},
    });

    // Broadcast to all connected clients of this user
    this.broadcastToUser(userId, {
      type: 'presence_update',
      data: status,
    });

    // Emit event for other systems
    this.eventEmitter.emit('user_presence', userId, status);
  }

  private async handleNotificationSubscribe(ws: WebSocket, message: any, userId: string): Promise<void> {
    if (!message.data || !message.data.notificationType) {
      throw new Error('Invalid notification subscription format');
    }

    await this.notificationService.subscribe({
      userId,
      notificationType: message.data.notificationType,
      metadata: message.data.metadata || {},
    });

    ws.send(JSON.stringify({
      type: 'notification_subscribed',
      data: { success: true },
    }));
  }

  private async handleNotificationUnsubscribe(ws: WebSocket, message: any, userId: string): Promise<void> {
    if (!message.data || !message.data.notificationType) {
      throw new Error('Invalid notification unsubscription format');
    }

    await this.notificationService.unsubscribe({
      userId,
      notificationType: message.data.notificationType,
    });

    ws.send(JSON.stringify({
      type: 'notification_unsubscribed',
      data: { success: true },
    }));
  }

  private async handleSupportRequest(ws: WebSocket, message: any, userId: string): Promise<void> {
    const supportRequest = await this.chatService.createSupportRequest({
      userId,
      issueType: message.data.issueType,
      description: message.data.description,
      metadata: message.data.metadata || {},
    });

    // Notify support agents
    this.broadcastToSupportAgents({
      type: 'new_support_request',
      data: supportRequest,
    });

    ws.send(JSON.stringify({
      type: 'support_request_created',
      data: supportRequest,
    }));
  }

  private async handleSupportEscalate(ws: WebSocket, message: any, userId: string): Promise<void> {
    if (!message.data || !message.data.requestId) {
      throw new Error('Invalid escalation format');
    }

    const escalatedRequest = await this.chatService.escalateSupportRequest({
      requestId: message.data.requestId,
      userId,
      reason: message.data.reason,
    });

    // Notify all parties
    this.broadcastToUsers(
      [escalatedRequest.userId, ...escalatedRequest.agentIds],
      {
        type: 'support_request_escalated',
        data: escalatedRequest,
      }
    );
  }

  private async handleSupportResolve(ws: WebSocket, message: any, userId: string): Promise<void> {
    if (!message.data || !message.data.requestId) {
      throw new Error('Invalid resolution format');
    }

    const resolvedRequest = await this.chatService.resolveSupportRequest({
      requestId: message.data.requestId,
      userId,
      resolution: message.data.resolution,
    });

    // Notify all parties
    this.broadcastToUsers(
      [resolvedRequest.userId, ...resolvedRequest.agentIds],
      {
        type: 'support_request_resolved',
        data: resolvedRequest,
      }
    );
  }

  private broadcastToUsers(userIds: string[], message: any): void {
    userIds.forEach(userId => {
      this.broadcastToUser(userId, message);
    });
  }

  private broadcastToUser(userId: string, message: any): void {
    // This would be implemented by the WebSocketManager
    // For now, just log
    logger.debug(`Broadcasting to user ${userId}:`, message);
  }

  private broadcastToSupportAgents(message: any): void {
    // This would broadcast to all connected support agents
    logger.debug('Broadcasting to support agents:', message);
  }
}

export const realTimeEventHandler = new RealTimeEventHandler();
```

### Client-Side WebSocket Integration (70 lines)

```typescript
import { EventEmitter } from 'events';
import logger from '../utils/logger';

type WebSocketConfig = {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
};

type MessageHandler = (message: any) => void;
type ErrorHandler = (error: Error) => void;
type CloseHandler = (code: number, reason: string) => void;

class WebSocketClient {
  private config: WebSocketConfig;
  private ws: WebSocket | null = null;
  private eventEmitter: EventEmitter;
  private messageHandlers: Map<string, MessageHandler[]>;
  private errorHandlers: ErrorHandler[];
  private closeHandlers: CloseHandler[];
  private reconnectAttempts: number;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<WebSocket> | null = null;
  private resolveConnection: ((ws: WebSocket) => void) | null = null;
  private rejectConnection: ((err: Error) => void) | null = null;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };

    this.eventEmitter = new EventEmitter();
    this.messageHandlers = new Map();
    this.errorHandlers = [];
    this.closeHandlers = [];
    this.reconnectAttempts = 0;
  }

  public async connect(): Promise<WebSocket> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;

      this.ws = new WebSocket(this.config.url, this.config.protocols);

      this.setupEventHandlers();
    });

    return this.connectionPromise;
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      logger.info('WebSocket connection established');
      this.reconnectAttempts = 0;
      this.startHeartbeat();

      if (this.resolveConnection) {
        this.resolveConnection(this.ws!);
        this.resolveConnection = null;
        this.rejectConnection = null;
        this.connectionPromise = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (err) {
        logger.error('Error parsing WebSocket message:', err);
        this.handleError(err as Error);
      }
    };

    this.ws.onerror = (event) => {
      const error = new Error(event.message || 'WebSocket error');
      logger.error('WebSocket error:', error);
      this.handleError(error);
    };

    this.ws.onclose = (event) => {
      logger.info(`WebSocket closed: ${event.code} - ${event.reason}`);
      this.stopHeartbeat();
      this.handleClose(event.code, event.reason);

      if (this.rejectConnection) {
        this.rejectConnection(new Error(`Connection closed: ${event.code} - ${event.reason}`));
        this.resolveConnection = null;
        this.rejectConnection = null;
        this.connectionPromise = null;
      }

      // Attempt to reconnect if not a normal closure
      if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
        this.reconnectAttempts++;
        const delay = this.config.reconnectInterval! * this.reconnectAttempts;
        logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
          this.connect().catch(() => {}); // Errors already handled
        }, delay);
      }
    };
  }

  private handleMessage(message: any): void {
    if (!message.type) {
      logger.warn('Received message without type:', message);
      return;
    }

    // Call type-specific handlers
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message));

    // Emit general event
    this.eventEmitter.emit('message', message);
    this.eventEmitter.emit(`message:${message.type}`, message);
  }

  private handleError(error: Error): void {
    this.errorHandlers.forEach(handler => handler(error));
    this.eventEmitter.emit('error', error);
  }

  private handleClose(code: number, reason: string): void {
    this.closeHandlers.forEach(handler => handler(code, reason));
    this.eventEmitter.emit('close', code, reason);
  }

  private startHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }

    this.heartbeatIntervalId = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now(),
        }));
      }
    }, this.config.heartbeatInterval!);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  public on(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  public off(type: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  public offError(handler: ErrorHandler): void {
    const index = this.errorHandlers.indexOf(handler);
    if (index !== -1) {
      this.errorHandlers.splice(index, 1);
    }
  }

  public onClose(handler: CloseHandler): void {
    this.closeHandlers.push(handler);
  }

  public offClose(handler: CloseHandler): void {
    const index = this.closeHandlers.indexOf(handler);
    if (index !== -1) {
      this.closeHandlers.splice(index, 1);
    }
  }

  public send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('WebSocket is not open. Message not sent:', message);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (err) {
      logger.error('Error sending WebSocket message:', err);
      this.handleError(err as Error);
    }
  }

  public async close(code?: number, reason?: string): Promise<void> {
    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }

    this.stopHeartbeat();

    if (this.rejectConnection) {
      this.rejectConnection(new Error('Connection closed by client'));
      this.resolveConnection = null;
      this.rejectConnection = null;
      this.connectionPromise = null;
    }
  }

  public get readyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  public get isConnected(): boolean {
    return this.ws ? this.ws.readyState === WebSocket.OPEN : false;
  }

  // EventEmitter style methods
  public addListener(event: string, listener: (...args: any[]) => void): this {
    this.eventEmitter.addListener(event, listener);
    return this;
  }

  public removeListener(event: string, listener: (...args: any[]) => void): this {
    this.eventEmitter.removeListener(event, listener);
    return this;
  }

  public emit(event: string, ...args: any[]): boolean {
    return this.eventEmitter.emit(event, ...args);
  }
}

// Example usage
export const setupChatWebSocket = (token: string): WebSocketClient => {
  const wsClient = new WebSocketClient({
    url: `wss://api.example.com/chat?token=${encodeURIComponent(token)}`,
    protocols: ['chat-protocol'],
    reconnectInterval: 5000,
    maxReconnectAttempts: 20,
  });

  // Setup message handlers
  wsClient.on('new_message', (message) => {
    console.log('New message received:', message.data);
    // Update UI with new message
  });

  wsClient.on('typing', (message) => {
    console.log('User is typing:', message.data);
    // Show typing indicator
  });

  wsClient.on('presence_update', (message) => {
    console.log('Presence update:', message.data);
    // Update user status
  });

  // Handle errors
  wsClient.onError((error) => {
    console.error('WebSocket error:', error);
    // Show error to user
  });

  // Connect
  wsClient.connect().catch((err) => {
    console.error('Failed to connect:', err);
  });

  return wsClient;
};
```

### Room/Channel Management (60 lines)

```typescript
import { WebSocket } from 'ws';
import logger from '../utils/logger';
import { ChatService } from '../services/chat.service';
import { v4 as uuidv4 } from 'uuid';

type Room = {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  createdAt: Date;
  createdBy: string;
  members: Set<string>;
  metadata: Record<string, any>;
};

class RoomManager {
  private rooms: Map<string, Room>;
  private userRooms: Map<string, Set<string>>; // userId -> Set<roomId>
  private chatService: ChatService;

  constructor() {
    this.rooms = new Map();
    this.userRooms = new Map();
    this.chatService = new ChatService();
  }

  public async createRoom(params: {
    name: string;
    type: 'public' | 'private' | 'direct';
    createdBy: string;
    memberIds?: string[];
    metadata?: Record<string, any>;
  }): Promise<Room> {
    const roomId = uuidv4();
    const now = new Date();

    const room: Room = {
      id: roomId,
      name: params.name,
      type: params.type,
      createdAt: now,
      createdBy: params.createdBy,
      members: new Set(params.memberIds || [params.createdBy]),
      metadata: params.metadata || {},
    };

    this.rooms.set(roomId, room);

    // Add room to each member's room set
    room.members.forEach(userId => {
      if (!this.userRooms.has(userId)) {
        this.userRooms.set(userId, new Set());
      }
      this.userRooms.get(userId)!.add(roomId);
    });

    // Persist to database
    await this.chatService.createRoom({
      id: roomId,
      name: params.name,
      type: params.type,
      createdBy: params.createdBy,
      memberIds: Array.from(room.members),
      metadata: params.metadata,
    });

    logger.info(`Created new room: ${roomId} (${params.type})`);
    return room;
  }

  public async joinRoom(roomId: string, userId: string): Promise<Room> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.members.has(userId)) {
      return room; // Already a member
    }

    // For private rooms, check if user is invited
    if (room.type === 'private' && !room.metadata.invitedUsers?.includes(userId)) {
      throw new Error('User not invited to this private room');
    }

    room.members.add(userId);

    // Add to user's room set
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);

    // Update database
    await this.chatService.addRoomMember(roomId, userId);

    logger.info(`User ${userId} joined room ${roomId}`);
    return room;
  }

  public async leaveRoom(roomId: string, userId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.members.has(userId)) {
      return; // Not a member
    }

    // Don't allow leaving direct message rooms
    if (room.type === 'direct') {
      throw new Error('Cannot leave direct message room');
    }

    // If creator leaves, assign new creator
    if (room.createdBy === userId && room.members.size > 1) {
      const newCreator = Array.from(room.members).find(id => id !== userId);
      if (newCreator) {
        room.createdBy = newCreator;
        room.metadata.originalCreator = userId;
      }
    }

    room.members.delete(userId);

    // Remove from user's room set
    if (this.userRooms.has(userId)) {
      this.userRooms.get(userId)!.delete(roomId);
    }

    // Update database
    await this.chatService.removeRoomMember(roomId, userId);

    // If room is empty, delete it (except for direct rooms)
    if (room.members.size === 0 && room.type !== 'direct') {
      this.rooms.delete(roomId);
      await this.chatService.deleteRoom(roomId);
    }

    logger.info(`User ${userId} left room ${roomId}`);
  }

  public async getRoom(roomId: string): Promise<Room | undefined> {
    return this.rooms.get(roomId);
  }

  public async getUserRooms(userId: string): Promise<Room[]> {
    const roomIds = this.userRooms.get(userId) || new Set();
    return Array.from(roomIds)
      .map(roomId => this.rooms.get(roomId))
      .filter(room => room !== undefined) as Room[];
  }

  public async getRoomMembers(roomId: string): Promise<string[]> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    return Array.from(room.members);
  }

  public async sendMessageToRoom(roomId: string, message: {
    senderId: string;
    content: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.members.has(message.senderId)) {
      throw new Error('Sender is not a member of this room');
    }

    // Create message in database
    const dbMessage = await this.chatService.createRoomMessage({
      roomId,
      senderId: message.senderId,
      content: message.content,
      metadata: message.metadata,
    });

    // Broadcast to all room members
    this.broadcastToRoom(roomId, {
      type: 'new_room_message',
      data: {
        roomId,
        message: dbMessage,
      },
    });
  }

  public broadcastToRoom(roomId: string, message: any): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const data = JSON.stringify(message);
    room.members.forEach(userId => {
      // This would be implemented by the WebSocketManager
      // For now, just log
      logger.debug(`Broadcasting to user ${userId} in room ${roomId}:`, message);
    });
  }

  public async loadRoomsFromDatabase(): Promise<void> {
    try {
      const dbRooms = await this.chatService.getAllRooms();
      dbRooms.forEach(dbRoom => {
        const room: Room = {
          id: dbRoom.id,
          name: dbRoom.name,
          type: dbRoom.type as 'public' | 'private' | 'direct',
          createdAt: new Date(dbRoom.createdAt),
          createdBy: dbRoom.createdBy,
          members: new Set(dbRoom.memberIds),
          metadata: dbRoom.metadata || {},
        };

        this.rooms.set(room.id, room);

        // Update user rooms
        room.members.forEach(userId => {
          if (!this.userRooms.has(userId)) {
            this.userRooms.set(userId, new Set());
          }
          this.userRooms.get(userId)!.add(room.id);
        });
      });

      logger.info(`Loaded ${dbRooms.length} rooms from database`);
    } catch (err) {
      logger.error('Error loading rooms from database:', err);
    }
  }

  public async deleteRoom(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Remove from all members' room sets
    room.members.forEach(userId => {
      if (this.userRooms.has(userId)) {
        this.userRooms.get(userId)!.delete(roomId);
      }
    });

    // Delete from memory
    this.rooms.delete(roomId);

    // Delete from database
    await this.chatService.deleteRoom(roomId);

    logger.info(`Deleted room: ${roomId}`);
  }
}

export const roomManager = new RoomManager();
```

### Reconnection Logic (30 lines)

```typescript
import { WebSocket } from 'ws';
import logger from '../utils/logger';

type ReconnectConfig = {
  maxAttempts?: number;
  baseInterval?: number;
  maxInterval?: number;
  backoffFactor?: number;
};

class ReconnectionManager {
  private config: Required<ReconnectConfig>;
  private attempts: number;
  private currentTimeout: NodeJS.Timeout | null;
  private ws: WebSocket | null;
  private shouldReconnect: boolean;

  constructor(config: ReconnectConfig = {}) {
    this.config = {
      maxAttempts: 10,
      baseInterval: 1000,
      maxInterval: 30000,
      backoffFactor: 2,
      ...config,
    };

    this.attempts = 0;
    this.currentTimeout = null;
    this.ws = null;
    this.shouldReconnect = true;
  }

  public attach(ws: WebSocket): void {
    this.ws = ws;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onclose = (event) => {
      if (this.shouldReconnect && event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (event) => {
      logger.error('WebSocket error:', event);
    };
  }

  private scheduleReconnect(): void {
    if (this.attempts >= this.config.maxAttempts) {
      logger.warn('Max reconnection attempts reached');
      return;
    }

    const delay = this.calculateBackoff();
    logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.attempts + 1})`);

    this.currentTimeout = setTimeout(() => {
      this.attempts++;
      this.reconnect();
    }, delay);
  }

  private calculateBackoff(): number {
    const jitter = Math.random() * 1000; // Add random jitter to avoid thundering herd
    const delay = Math.min(
      this.config.baseInterval * Math.pow(this.config.backoffFactor, this.attempts),
      this.config.maxInterval
    );
    return delay + jitter;
  }

  private reconnect(): void {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      // In a real implementation, this would create a new WebSocket connection
      logger.info('Reconnecting...');
      // this.ws = new WebSocket(...);
      // this.setupEventHandlers();
    }
  }

  public cancel(): void {
    this.shouldReconnect = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  public reset(): void {
    this.attempts = 0;
    this.cancel();
    this.shouldReconnect = true;
  }

  public get isReconnecting(): boolean {
    return this.currentTimeout !== null;
  }

  public get attemptCount(): number {
    return this.attempts;
  }
}

// Example usage with WebSocketClient
export const setupWebSocketWithReconnect = (url: string, protocols?: string | string[]): WebSocket => {
  const ws = new WebSocket(url, protocols);
  const reconnectionManager = new ReconnectionManager({
    maxAttempts: 20,
    baseInterval: 1000,
    maxInterval: 60000,
  });

  reconnectionManager.attach(ws);

  ws.onopen = () => {
    reconnectionManager.reset();
    logger.info('WebSocket connection established');
  };

  return ws;
};
```

---

## AI/ML Capabilities (300 lines)

### Predictive Model Training (90 lines)

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, f1_score
from sklearn.model_selection import GridSearchCV
import joblib
import json
import logging
from datetime import datetime
import os
from typing import Dict, Any, Tuple
import mlflow
import mlflow.sklearn
from mlflow.models.signature import infer_signature

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatbotPredictiveModel:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model = None
        self.vectorizer = None
        self.label_encoder = None
        self.training_history = []
        self.setup_mlflow()

    def setup_mlflow(self):
        """Configure MLflow tracking"""
        mlflow.set_tracking_uri(self.config.get('mlflow_tracking_uri', 'http://localhost:5000'))
        mlflow.set_experiment(self.config.get('experiment_name', 'chatbot_support'))

    def load_data(self, file_path: str) -> Tuple[pd.DataFrame, pd.Series]:
        """Load and preprocess training data"""
        try:
            logger.info(f"Loading data from {file_path}")
            data = pd.read_csv(file_path)

            # Basic data validation
            required_columns = ['user_message', 'intent', 'context']
            for col in required_columns:
                if col not in data.columns:
                    raise ValueError(f"Missing required column: {col}")

            # Preprocess text data
            data['processed_message'] = data['user_message'].apply(self.preprocess_text)

            # Encode labels
            from sklearn.preprocessing import LabelEncoder
            self.label_encoder = LabelEncoder()
            data['encoded_intent'] = self.label_encoder.fit_transform(data['intent'])

            logger.info(f"Loaded {len(data)} samples with {len(self.label_encoder.classes_)} classes")
            return data['processed_message'], data['encoded_intent']

        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise

    def preprocess_text(self, text: str) -> str:
        """Basic text preprocessing"""
        if not isinstance(text, str):
            return ""

        # Convert to lowercase
        text = text.lower()

        # Remove special characters (keep alphanumeric and basic punctuation)
        import re
        text = re.sub(r'[^a-z0-9\s\?\!\.\,\;\:]', '', text)

        # Remove extra whitespace
        text = ' '.join(text.split())

        return text

    def create_pipeline(self) -> Pipeline:
        """Create the machine learning pipeline"""
        # Text vectorization
        self.vectorizer = TfidfVectorizer(
            max_features=self.config.get('max_features', 5000),
            ngram_range=self.config.get('ngram_range', (1, 2)),
            stop_words='english',
            min_df=self.config.get('min_df', 5)
        )

        # Model selection
        model_type = self.config.get('model_type', 'random_forest')
        if model_type == 'random_forest':
            model = RandomForestClassifier(
                n_estimators=self.config.get('n_estimators', 100),
                class_weight='balanced',
                random_state=42,
                n_jobs=-1
            )
        elif model_type == 'gradient_boosting':
            model = GradientBoostingClassifier(
                n_estimators=self.config.get('n_estimators', 100),
                random_state=42
            )
        else:
            raise ValueError(f"Unknown model type: {model_type}")

        # Create pipeline
        pipeline = Pipeline([
            ('tfidf', self.vectorizer),
            ('clf', model)
        ])

        return pipeline

    def train(self, X: pd.Series, y: pd.Series) -> Dict[str, Any]:
        """Train the predictive model"""
        try:
            logger.info("Starting model training")

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y,
                test_size=self.config.get('test_size', 0.2),
                random_state=42,
                stratify=y
            )

            # Create pipeline
            pipeline = self.create_pipeline()

            # Hyperparameter tuning
            param_grid = self.config.get('param_grid', {})
            if param_grid:
                logger.info("Performing hyperparameter tuning")
                grid_search = GridSearchCV(
                    pipeline,
                    param_grid,
                    cv=self.config.get('cv', 5),
                    scoring=self.config.get('scoring', 'f1_weighted'),
                    n_jobs=-1,
                    verbose=1
                )
                grid_search.fit(X_train, y_train)
                pipeline = grid_search.best_estimator_
                logger.info(f"Best parameters: {grid_search.best_params_}")
            else:
                pipeline.fit(X_train, y_train)

            # Evaluate
            y_pred = pipeline.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred, average='weighted')

            # Generate classification report
            report = classification_report(y_test, y_pred, output_dict=True)

            # Log metrics with MLflow
            with mlflow.start_run():
                mlflow.log_params({
                    'model_type': self.config.get('model_type', 'random_forest'),
                    'max_features': self.config.get('max_features', 5000),
                    'test_size': self.config.get('test_size', 0.2)
                })

                if param_grid:
                    mlflow.log_params(grid_search.best_params_)

                mlflow.log_metrics({
                    'accuracy': accuracy,
                    'f1_score': f1,
                    'precision': report['weighted avg']['precision'],
                    'recall': report['weighted avg']['recall']
                })

                # Log model
                signature = infer_signature(X_train, pipeline.predict(X_train))
                mlflow.sklearn.log_model(pipeline, "model", signature=signature)

                # Log additional artifacts
                self.log_artifacts(report)

            # Store model and vectorizer
            self.model = pipeline
            self.training_history.append({
                'timestamp': datetime.now().isoformat(),
                'accuracy': accuracy,
                'f1_score': f1,
                'classes': len(self.label_encoder.classes_),
                'samples': len(X)
            })

            logger.info(f"Training completed. Accuracy: {accuracy:.4f}, F1: {f1:.4f}")
            return {
                'success': True,
                'accuracy': accuracy,
                'f1_score': f1,
                'report': report,
                'best_params': grid_search.best_params_ if param_grid else None
            }

        except Exception as e:
            logger.error(f"Error during training: {str(e)}")
            raise

    def log_artifacts(self, report: Dict[str, Any]):
        """Log additional artifacts to MLflow"""
        # Save classification report
        report_df = pd.DataFrame(report).transpose()
        report_path = "classification_report.csv"
        report_df.to_csv(report_path)
        mlflow.log_artifact(report_path)
        os.remove(report_path)

        # Save label encoder
        if self.label_encoder:
            encoder_path = "label_encoder.pkl"
            joblib.dump(self.label_encoder, encoder_path)
            mlflow.log_artifact(encoder_path)
            os.remove(encoder_path)

    def save_model(self, path: str):
        """Save the trained model and related artifacts"""
        try:
            if not self.model:
                raise ValueError("Model not trained yet")

            os.makedirs(path, exist_ok=True)

            # Save model
            model_path = os.path.join(path, 'model.pkl')
            joblib.dump(self.model, model_path)

            # Save label encoder
            if self.label_encoder:
                encoder_path = os.path.join(path, 'label_encoder.pkl')
                joblib.dump(self.label_encoder, encoder_path)

            # Save training history
            history_path = os.path.join(path, 'training_history.json')
            with open(history_path, 'w') as f:
                json.dump(self.training_history, f)

            logger.info(f"Model saved to {path}")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    def load_model(self, path: str):
        """Load a trained model and related artifacts"""
        try:
            # Load model
            model_path = os.path.join(path, 'model.pkl')
            self.model = joblib.load(model_path)

            # Load label encoder
            encoder_path = os.path.join(path, 'label_encoder.pkl')
            if os.path.exists(encoder_path):
                self.label_encoder = joblib.load(encoder_path)

            # Load training history
            history_path = os.path.join(path, 'training_history.json')
            if os.path.exists(history_path):
                with open(history_path, 'r') as f:
                    self.training_history = json.load(f)

            logger.info(f"Model loaded from {path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

    def predict(self, text: str) -> Dict[str, Any]:
        """Make a prediction on new text"""
        if not self.model:
            raise ValueError("Model not trained or loaded")

        try:
            # Preprocess text
            processed_text = self.preprocess_text(text)

            # Make prediction
            prediction = self.model.predict([processed_text])[0]
            probabilities = self.model.predict_proba([processed_text])[0]

            # Decode prediction
            intent = self.label_encoder.inverse_transform([prediction])[0]
            class_probabilities = {
                self.label_encoder.inverse_transform([i])[0]: float(prob)
                for i, prob in enumerate(probabilities)
            }

            return {
                'intent': intent,
                'confidence': float(class_probabilities[intent]),
                'all_probabilities': class_probabilities
            }
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            raise

# Example usage
if __name__ == "__main__":
    config = {
        'data_path': 'chatbot_training_data.csv',
        'model_type': 'random_forest',
        'max_features': 10000,
        'ngram_range': (1, 2),
        'min_df': 3,
        'test_size': 0.2,
        'param_grid': {
            'clf__n_estimators': [100, 200],
            'clf__max_depth': [None, 10, 20],
            'tfidf__max_features': [5000, 10000]
        },
        'mlflow_tracking_uri': 'http://localhost:5000',
        'experiment_name': 'chatbot_intent_prediction'
    }

    model = ChatbotPredictiveModel(config)

    try:
        # Load data
        X, y = model.load_data(config['data_path'])

        # Train model
        results = model.train(X, y)
        print(f"Training results: {results}")

        # Save model
        model.save_model('models/intent_model')

        # Test prediction
        test_text = "I can't log in to my account"
        prediction = model.predict(test_text)
        print(f"Prediction for '{test_text}': {prediction}")

    except Exception as e:
        print(f"Error: {str(e)}")
```

### Real-Time Inference API (70 lines)

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import logging
import os
from typing import Dict, Any
import time
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Chatbot Inference API", version="1.0.0")

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)

# Load model
MODEL_PATH = os.getenv("MODEL_PATH", "models/intent_model")
try:
    model = joblib.load(os.path.join(MODEL_PATH, "model.pkl"))
    label_encoder = joblib.load(os.path.join(MODEL_PATH, "label_encoder.pkl"))
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    raise

# Request models
class PredictionRequest(BaseModel):
    text: str
    context: Dict[str, Any] = {}
    user_id: str = None
    session_id: str = None

class PredictionResponse(BaseModel):
    intent: str
    confidence: float
    all_probabilities: Dict[str, float]
    processing_time: float
    model_version: str = "1.0.0"

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str = "1.0.0"

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
        headers={"Retry-After": str(exc.detail)}
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": True,
        "model_version": "1.0.0"
    }

@app.post("/predict", response_model=PredictionResponse)
@limiter.limit("100/minute")
async def predict(request: Request, prediction_request: PredictionRequest):
    """Make a prediction on user input"""
    start_time = time.time()

    try:
        # Preprocess text
        processed_text = preprocess_text(prediction_request.text)

        # Make prediction
        prediction = model.predict([processed_text])[0]
        probabilities = model.predict_proba([processed_text])[0]

        # Decode prediction
        intent = label_encoder.inverse_transform([prediction])[0]
        class_probabilities = {
            label_encoder.inverse_transform([i])[0]: float(prob)
            for i, prob in enumerate(probabilities)
        }

        # Log prediction
        logger.info(f"Prediction for user {prediction_request.user_id}: {intent} ({class_probabilities[intent]:.2f})")

        return {
            "intent": intent,
            "confidence": float(class_probabilities[intent]),
            "all_probabilities": class_probabilities,
            "processing_time": time.time() - start_time,
            "model_version": "1.0.0"
        }

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def preprocess_text(text: str) -> str:
    """Text preprocessing for inference"""
    if not isinstance(text, str):
        return ""

    # Convert to lowercase
    text = text.lower()

    # Remove special characters (keep alphanumeric and basic punctuation)
    import re
    text = re.sub(r'[^a-z0-9\s\?\!\.\,\;\:]', '', text)

    # Remove extra whitespace
    text = ' '.join(text.split())

    return text

@app.post("/batch_predict")
@limiter.limit("50/minute")
async def batch_predict(request: Request, texts: list[str]):
    """Batch prediction endpoint"""
    start_time = time.time()

    try:
        # Preprocess all texts
        processed_texts = [preprocess_text(text) for text in texts]

        # Make predictions
        predictions = model.predict(processed_texts)
        probabilities = model.predict_proba(processed_texts)

        # Decode predictions
        results = []
        for i, pred in enumerate(predictions):
            intent = label_encoder.inverse_transform([pred])[0]
            class_probabilities = {
                label_encoder.inverse_transform([j])[0]: float(prob)
                for j, prob in enumerate(probabilities[i])
            }
            results.append({
                "text": texts[i],
                "intent": intent,
                "confidence": float(class_probabilities[intent]),
                "all_probabilities": class_probabilities
            })

        return {
            "predictions": results,
            "processing_time": time.time() - start_time,
            "model_version": "1.0.0"
        }

    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def feedback(feedback: Dict[str, Any]):
    """Endpoint for collecting prediction feedback"""
    try:
        # In a real implementation, this would store the feedback for model retraining
        logger.info(f"Received feedback: {feedback}")
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Feedback error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Feature Engineering Pipeline (70 lines)

```python
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
import logging
from datetime import datetime
import re
from textblob import TextBlob
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler
import joblib
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FeatureEngineeringPipeline:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.tfidf_vectorizer = None
        self.scaler = MinMaxScaler()
        self.nlp = None

        # Load spaCy model if configured
        if self.config.get('use_spacy', False):
            try:
                self.nlp = spacy.load(self.config.get('spacy_model', 'en_core_web_sm'))
                logger.info("Loaded spaCy model")
            except Exception as e:
                logger.warning(f"Could not load spaCy model: {str(e)}")
                self.nlp = None

    def preprocess_text(self, text: str) -> str:
        """Basic text preprocessing"""
        if not isinstance(text, str):
            return ""

        # Convert to lowercase
        text = text.lower()

        # Remove special characters (keep alphanumeric and basic punctuation)
        text = re.sub(r'[^a-z0-9\s\?\!\.\,\;\:]', '', text)

        # Remove extra whitespace
        text = ' '.join(text.split())

        return text

    def extract_text_features(self, text: str) -> Dict[str, float]:
        """Extract features from text"""
        features = {}

        # Basic features
        features['text_length'] = len(text)
        features['word_count'] = len(text.split())
        features['char_count'] = len(text)
        features['avg_word_length'] = features['char_count'] / (features['word_count'] + 1)

        # Punctuation features
        features['question_mark'] = text.count('?')
        features['exclamation_mark'] = text.count('!')
        features['punctuation_count'] = sum([text.count(p) for p in ['.', ',', ';', ':']])

        # Sentiment analysis
        blob = TextBlob(text)
        features['sentiment_polarity'] = blob.sentiment.polarity
        features['sentiment_subjectivity'] = blob.sentiment.subjectivity

        # If spaCy is available, extract more features
        if self.nlp:
            doc = self.nlp(text)
            features['noun_count'] = sum(1 for token in doc if token.pos_ == "NOUN")
            features['verb_count'] = sum(1 for token in doc if token.pos_ == "VERB")
            features['adj_count'] = sum(1 for token in doc if token.pos_ == "ADJ")
            features['entity_count'] = len(doc.ents)
            features['stopword_count'] = sum(1 for token in doc if token.is_stop)

        return features

    def extract_context_features(self, context: Dict[str, Any]) -> Dict[str, float]:
        """Extract features from conversation context"""
        features = {}

        # Time-based features
        if 'timestamp' in context:
            try:
                msg_time = datetime.fromisoformat(context['timestamp'])
                features['hour_of_day'] = msg_time.hour
                features['day_of_week'] = msg_time.weekday()
                features['is_weekend'] = 1 if msg_time.weekday() >= 5 else 0
            except:
                pass

        # User features
        if 'user' in context:
            user = context['user']
            features['user_message_count'] = user.get('message_count', 0)
            features['user_previous_intents'] = len(user.get('previous_intents', []))
            features['user_satisfaction_score'] = user.get('satisfaction_score', 0)

        # Session features
        if 'session' in context:
            session = context['session']
            features['session_duration'] = session.get('duration', 0)
            features['session_message_count'] = session.get('message_count', 0)
            features['session_previous_intents'] = len(session.get('previous_intents', []))

        return features

    def fit_tfidf(self, texts: List[str]):
        """Fit TF-IDF vectorizer"""
        logger.info("Fitting TF-IDF vectorizer")
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=self.config.get('tfidf_max_features', 5000),
            ngram_range=self.config.get('tfidf_ngram_range', (1, 2)),
            stop_words='english',
            min_df=self.config.get('tfidf_min_df', 5)
        )
        self.tfidf_vectorizer.fit(texts)

    def transform_text(self, text: str) -> np.ndarray:
        """Transform text using TF-IDF"""
        if not self.tfidf_vectorizer:
            raise ValueError("TF-IDF vectorizer not fitted")

        return self.tfidf_vectorizer.transform([text]).toarray()[0]

    def fit_scaler(self, features: List[Dict[str, float]]):
        """Fit feature scaler"""
        logger.info("Fitting feature scaler")
        feature_values = np.array([[f[feat] for feat in self.get_feature_names(features[0])]
                                 for f in features])
        self.scaler.fit(feature_values)

    def transform_features(self, features: Dict[str, float]) -> np.ndarray:
        """Scale features"""
        if not hasattr(self.scaler, 'n_features_in_'):
            raise ValueError("Scaler not fitted")

        feature_values = np.array([[features[feat] for feat in self.get_feature_names(features)]])
        return self.scaler.transform(feature_values)[0]

    def get_feature_names(self, sample_features: Dict[str, float]) -> List[str]:
        """Get ordered list of feature names"""
        # This should match the order used during fitting
        text_features = [
            'text_length', 'word_count', 'char_count', 'avg_word_length',
            'question_mark', 'exclamation_mark', 'punctuation_count',
            'sentiment_polarity', 'sentiment_subjectivity'
        ]

        if self.nlp:
            text_features.extend([
                'noun_count', 'verb_count', 'adj_count',
                'entity_count', 'stopword_count'
            ])

        context_features = [
            'hour_of_day', 'day_of_week', 'is_weekend',
            'user_message_count', 'user_previous_intents', 'user_satisfaction_score',
            'session_duration', 'session_message_count', 'session_previous_intents'
        ]

        # Combine all features
        all_features = text_features + context_features

        # Add TF-IDF features if vectorizer is fitted
        if self.tfidf_vectorizer:
            all_features.extend(self.tfidf_vectorizer.get_feature_names_out())

        # Filter to only features present in sample
        return [f for f in all_features if f in sample_features]

    def process_sample(self, text: str, context: Dict[str, Any] = {}) -> Dict[str, float]:
        """Process a single sample through the pipeline"""
        # Preprocess text
        processed_text = self.preprocess_text(text)

        # Extract text features
        text_features = self.extract_text_features(processed_text)

        # Extract context features
        context_features = self.extract_context_features(context)

        # Combine features
        combined_features = {**text_features, **context_features}

        # Add TF-IDF features if vectorizer is fitted
        if self.tfidf_vectorizer:
            tfidf_features = self.transform_text(processed_text)
            for i, feature in enumerate(self.tfidf_vectorizer.get_feature_names_out()):
                combined_features[f'tfidf_{feature}'] = tfidf_features[i]

        return combined_features

    def process_batch(self, samples: List[Tuple[str, Dict[str, Any]]]) -> List[Dict[str, float]]:
        """Process a batch of samples"""
        return [self.process_sample(text, context) for text, context in samples]

    def save_pipeline(self, path: str):
        """Save the pipeline components"""
        os.makedirs(path, exist_ok=True)

        if self.tfidf_vectorizer:
            joblib.dump(self.tfidf_vectorizer, os.path.join(path, 'tfidf_vectorizer.pkl'))

        joblib.dump(self.scaler, os.path.join(path, 'scaler.pkl'))
        logger.info(f"Pipeline saved to {path}")

    def load_pipeline(self, path: str):
        """Load the pipeline components"""
        try:
            if os.path.exists(os.path.join(path, 'tfidf_vectorizer.pkl')):
                self.tfidf_vectorizer = joblib.load(os.path.join(path, 'tfidf_vectorizer.pkl'))

            self.scaler = joblib.load(os.path.join(path, 'scaler.pkl'))
            logger.info(f"Pipeline loaded from {path}")
        except Exception as e:
            logger.error(f"Error loading pipeline: {str(e)}")
            raise

# Example usage
if __name__ == "__main__":
    config = {
        'use_spacy': True,
        'spacy_model': 'en_core_web_sm',
        'tfidf_max_features': 5000,
        'tfidf_ngram_range': (1, 2),
        'tfidf_min_df': 5
    }

    pipeline = FeatureEngineeringPipeline(config)

    # Sample data
    samples = [
        ("I can't log in to my account", {
            "timestamp": "2023-11-15T14:30:00",
            "user": {
                "message_count": 5,
                "previous_intents": ["greeting", "help"],
                "satisfaction_score": 0.8
            },
            "session": {
                "duration": 120,
                "message_count": 3,
                "previous_intents": ["greeting"]
            }
        }),
        ("How do I reset my password?", {
            "timestamp": "2023-11-15T14:35:00",
            "user": {
                "message_count": 6,
                "previous_intents": ["greeting", "help", "login_issue"],
                "satisfaction_score": 0.6
            },
            "session": {
                "duration": 180,
                "message_count": 4,
                "previous_intents": ["greeting", "login_issue"]
            }
        })
    ]

    # Fit pipeline
    texts = [sample[0] for sample in samples]
    pipeline.fit_tfidf(texts)

    features = pipeline.process_batch(samples)
    pipeline.fit_scaler(features)

    # Process a new sample
    new_features = pipeline.process_sample(
        "I forgot my password and can't access my account",
        {
            "timestamp": "2023-11-15T14:40:00",
            "user": {
                "message_count": 7,
                "previous_intents": ["greeting", "help", "login_issue"],
                "satisfaction_score": 0.5
            }
        }
    )

    # Scale the features
    scaled_features = pipeline.transform_features(new_features)
    print(f"Processed features: {scaled_features}")

    # Save pipeline
    pipeline.save_pipeline("models/feature_pipeline")
```

### Model Monitoring and Retraining (70 lines)

```python
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime, timedelta
import mlflow
import joblib
import os
import smtplib
from email.mime.text import MIMEText
from sklearn.metrics import accuracy_score, f1_score, classification_report
from apscheduler.schedulers.background import BackgroundScheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelMonitor:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model = None
        self.label_encoder = None
        self.feature_pipeline = None
        self.scheduler = BackgroundScheduler()
        self.setup_mlflow()
        self.setup_scheduler()

    def setup_mlflow(self):
        """Configure MLflow tracking"""
        mlflow.set_tracking_uri(self.config.get('mlflow_tracking_uri', 'http://localhost:5000'))
        mlflow.set_experiment(self.config.get('experiment_name', 'chatbot_model_monitoring'))

    def setup_scheduler(self):
        """Setup background scheduler for monitoring tasks"""
        # Schedule daily monitoring
        self.scheduler.add_job(
            self.daily_monitoring,
            'cron',
            hour=self.config.get('monitoring_hour', 3),
            minute=0
        )

        # Schedule weekly retraining
        self.scheduler.add_job(
            self.weekly_retraining,
            'cron',
            day_of_week=self.config.get('retraining_day', 0),  # Sunday
            hour=self.config.get('retraining_hour', 4),
            minute=0
        )

        self.scheduler.start()

    def load_model(self, model_path: str):
        """Load the model and related artifacts"""
        try:
            self.model = joblib.load(os.path.join(model_path, 'model.pkl'))
            self.label_encoder = joblib.load(os.path.join(model_path, 'label_encoder.pkl'))

            # Load feature pipeline if exists
            if os.path.exists(os.path.join(model_path, 'feature_pipeline')):
                from feature_engineering import FeatureEngineeringPipeline
                self.feature_pipeline = FeatureEngineeringPipeline({})
                self.feature_pipeline.load_pipeline(os.path.join(model_path, 'feature_pipeline'))

            logger.info("Model and artifacts loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

    def log_prediction(self, text: str, true_intent: Optional[str], predicted_intent: str,
                      confidence: float, context: Dict[str, Any] = {}):
        """Log a prediction for monitoring"""
        try:
            with mlflow.start_run():
                mlflow.log_params({
                    'text': text,
                    'predicted_intent': predicted_intent,
                    'confidence': confidence,
                    'timestamp': datetime.now().isoformat()
                })

                if true_intent:
                    mlflow.log_param('true_intent', true_intent)
                    mlflow.log_metric('correct', 1 if true_intent == predicted_intent else 0)

                if context:
                    mlflow.log_params({
                        f'context_{k}': str(v) for k, v in context.items()
                    })

            logger.debug(f"Logged prediction: {predicted_intent} (confidence: {confidence:.2f})")
        except Exception as e:
            logger.error(f"Error logging prediction: {str(e)}")

    def daily_monitoring(self):
        """Run daily monitoring checks"""
        logger.info("Starting daily monitoring")

        try:
            # Check for data drift
            self.check_data_drift()

            # Check model performance on recent data
            self.check_recent_performance()

            # Check for concept drift
            self.check_concept_drift()

            logger.info("Daily monitoring completed")
        except Exception as e:
            logger.error(f"Error during daily monitoring: {str(e)}")
            self.send_alert(f"Daily monitoring failed: {str(e)}")

    def check_data_drift(self):
        """Check for data drift in recent predictions"""
        try:
            # Get recent predictions from MLflow
            runs = mlflow.search_runs(
                filter_string=f"tags.mlflow.runName = 'prediction' and attributes.start_time > '{datetime.now() - timedelta(days=1)}'",
                max_results=1000
            )

            if len(runs) < self.config.get('min_samples_for_drift', 50):
                logger.info("Not enough samples for data drift detection")
                return

            # Calculate feature distributions (simplified example)
            # In a real implementation, we would compare distributions of features
            # between recent data and training data
            recent_text_lengths = runs['params.text'].apply(len).mean()
            training_text_lengths = self.config.get('training_text_length_mean', 50)

            drift_score = abs(recent_text_lengths - training_text_lengths) / training_text_lengths

            mlflow.log_metric('data_drift_score', drift_score)

            if drift_score > self.config.get('data_drift_threshold', 0.2):
                logger.warning(f"Data drift detected (score: {drift_score:.2f})")
                self.send_alert(f"Data drift detected (score: {drift_score:.2f})")
            else:
                logger.info(f"Data drift score: {drift_score:.2f}")

        except Exception as e:
            logger.error(f"Error checking data drift: {str(e)}")

    def check_recent_performance(self):
        """Check model performance on recent labeled data"""
        try:
            # Get recent labeled predictions from MLflow
            runs = mlflow.search_runs(
                filter_string=f"tags.mlflow.runName = 'prediction' and params.true_intent IS NOT NULL and attributes.start_time > '{datetime.now() - timedelta(days=1)}'",
                max_results=1000
            )

            if len(runs) < self.config.get('min_samples_for_performance', 20):
                logger.info("Not enough labeled samples for performance check")
                return

            # Calculate accuracy
            correct = runs[runs['metrics.correct'] == 1]
            accuracy = len(correct) / len(runs)

            # Calculate F1 score
            y_true = runs['params.true_intent']
            y_pred = runs['params.predicted_intent']
            f1 = f1_score(y_true, y_pred, average='weighted')

            mlflow.log_metrics({
                'daily_accuracy': accuracy,
                'daily_f1_score': f1
            })

            if accuracy < self.config.get('performance_threshold', 0.85):
                logger.warning(f"Performance degradation detected (accuracy: {accuracy:.2f})")
                self.send_alert(f"Performance degradation detected (accuracy: {accuracy:.2f})")
            else:
                logger.info(f"Daily performance - Accuracy: {accuracy:.2f}, F1: {f1:.2f}")

        except Exception as e:
            logger.error(f"Error checking recent performance: {str(e)}")

    def check_concept_drift(self):
        """Check for concept drift (changing relationship between features and target)"""
        try:
            # This is a simplified example - in practice you would use more sophisticated methods
            # like monitoring feature importance changes or using statistical tests

            # Get recent predictions
            runs = mlflow.search_runs(
                filter_string=f"tags.mlflow.runName = 'prediction' and attributes.start_time > '{datetime.now() - timedelta(days=7)}'",
                max_results=1000
            )

            if len(runs) < self.config.get('min_samples_for_drift', 50):
                logger.info("Not enough samples for concept drift detection")
                return

            # Calculate average confidence
            avg_confidence = runs['params.confidence'].astype(float).mean()

            # Compare with training confidence
            training_confidence = self.config.get('training_confidence_mean', 0.9)
            confidence_drop = training_confidence - avg_confidence

            mlflow.log_metric('confidence_drop', confidence_drop)

            if confidence_drop > self.config.get('confidence_drop_threshold', 0.1):
                logger.warning(f"Concept drift detected (confidence drop: {confidence_drop:.2f})")
                self.send_alert(f"Concept drift detected (confidence drop: {confidence_drop:.2f})")
            else:
                logger.info(f"Concept drift score: {confidence_drop:.2f}")

        except Exception as e:
            logger.error(f"Error checking concept drift: {str(e)}")

    def weekly_retraining(self):
        """Run weekly model retraining"""
        logger.info("Starting weekly retraining")

        try:
            # Get new training data
            new_data = self.get_new_training_data()

            if len(new_data) < self.config.get('min_new_samples', 100):
                logger.info("Not enough new data for retraining")
                return

            # Retrain model
            from model_training import ChatbotPredictiveModel
            retraining_config = self.config.get('retraining_config', {})
            model = ChatbotPredictiveModel(retraining_config)

            X, y = model.load_data_from_dataframe(new_data)
            results = model.train(X, y)

            # Evaluate against current model
            current_metrics = self.evaluate_model(self.model, new_data)
            new_metrics = self.evaluate_model(model.model, new_data)

            # Compare performance
            if new_metrics['accuracy'] > current_metrics['accuracy'] + self.config.get('min_improvement', 0.01):
                logger.info("New model performs better - deploying")

                # Save new model
                model.save_model(self.config.get('model_path', 'models/intent_model'))

                # Update current model
                self.model = model.model
                self.label_encoder = model.label_encoder

                # Log deployment
                with mlflow.start_run():
                    mlflow.log_params({
                        'retraining_date': datetime.now().isoformat(),
                        'new_samples': len(new_data)
                    })
                    mlflow.log_metrics({
                        'old_accuracy': current_metrics['accuracy'],
                        'new_accuracy': new_metrics['accuracy'],
                        'improvement': new_metrics['accuracy'] - current_metrics['accuracy']
                    })
            else:
                logger.info("New model does not perform better - keeping current model")

        except Exception as e:
            logger.error(f"Error during retraining: {str(e)}")
            self.send_alert(f"Retraining failed: {str(e)}")

    def get_new_training_data(self) -> pd.DataFrame:
        """Get new training data from various sources"""
        try:
            # In a real implementation, this would:
            # 1. Get labeled data from human feedback
            # 2. Get data from explicit user feedback
            # 3. Sample from production logs
            # 4. Combine with existing training data

            # For this example, we'll simulate getting data from MLflow
            runs = mlflow.search_runs(
                filter_string=f"tags.mlflow.runName = 'prediction' and params.true_intent IS NOT NULL and attributes.start_time > '{datetime.now() - timedelta(days=7)}'",
                max_results=1000
            )

            if len(runs) == 0:
                return pd.DataFrame()

            # Convert to DataFrame
            data = pd.DataFrame({
                'user_message': runs['params.text'],
                'intent': runs['params.true_intent'],
                'context': runs['params'].apply(lambda x: {k: v for k, v in x.items() if k.startswith('context_')}, axis=1)
            })

            return data

        except Exception as e:
            logger.error(f"Error getting new training data: {str(e)}")
            return pd.DataFrame()

    def evaluate_model(self, model, data: pd.DataFrame) -> Dict[str, float]:
        """Evaluate model on given data"""
        try:
            if len(data) == 0:
                return {'accuracy': 0, 'f1_score': 0}

            # Preprocess data
            if self.feature_pipeline:
                features = self.feature_pipeline.process_batch(
                    [(row['user_message'], row['context']) for _, row in data.iterrows()]
                )
                X = np.array([list(f.values()) for f in features])
            else:
                X = data['user_message'].apply(self.preprocess_text)

            y = self.label_encoder.transform(data['intent'])

            # Make predictions
            y_pred = model.predict(X)

            # Calculate metrics
            accuracy = accuracy_score(y, y_pred)
            f1 = f1_score(y, y_pred, average='weighted')

            return {
                'accuracy': accuracy,
                'f1_score': f1
            }

        except Exception as e:
            logger.error(f"Error evaluating model: {str(e)}")
            return {'accuracy': 0, 'f1_score': 0}

    def preprocess_text(self, text: str) -> str:
        """Basic text preprocessing"""
        if not isinstance(text, str):
            return ""

        import re
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s\?\!\.\,\;\:]', '', text)
        text = ' '.join(text.split())
        return text

    def send_alert(self, message: str):
        """Send alert email"""
        try:
            if not self.config.get('alert_email_enabled', False):
                return

            msg = MIMEText(message)
            msg['Subject'] = f"Chatbot Model Alert: {datetime.now().strftime('%Y-%m-%d')}"
            msg['From'] = self.config.get('alert_from_email', 'alerts@chatbot.com')
            msg['To'] = self.config.get('alert_to_email', 'team@chatbot.com')

            with smtplib.SMTP(self.config.get('smtp_server', 'localhost')) as server:
                server.send_message(msg)

            logger.info(f"Alert sent: {message}")
        except Exception as e:
            logger.error(f"Error sending alert: {str(e)}")

    def shutdown(self):
        """Clean up resources"""
        self.scheduler.shutdown()
        logger.info("Model monitor shutdown complete")

# Example usage
if __name__ == "__main__":
    config = {
        'mlflow_tracking_uri': 'http://localhost:5000',
        'experiment_name': 'chatbot_model_monitoring',
        'model_path': 'models/intent_model',
        'monitoring_hour': 3,
        'retraining_day': 0,  # Sunday
        'retraining_hour': 4,
        'min_samples_for_drift': 50,
        'min_samples_for_performance': 20,
        'data_drift_threshold': 0.2,
        'performance_threshold': 0.85,
        'confidence_drop_threshold': 0.1,
        'min_new_samples': 100,
        'min_improvement': 0.01,
        'alert_email_enabled': True,
        'alert_from_email': 'alerts@chatbot.com',
        'alert_to_email': 'team@chatbot.com',
        'smtp_server': 'localhost',
        'retraining_config': {
            'model_type': 'random_forest',
            'max_features': 10000,
            'ngram_range': (1, 2),
            'min_df': 3,
            'test_size': 0.2
        }
    }

    monitor = ModelMonitor(config)

    try:
        # Load model
        monitor.load_model(config['model_path'])

        # Keep the monitor running
        while True:
            pass

    except KeyboardInterrupt:
        monitor.shutdown()
```

---

## Progressive Web App (PWA) Features (220 lines)

### Service Worker Registration (50 lines)

```typescript
import { Workbox } from 'workbox-window';
import logger from '../utils/logger';

class ServiceWorkerManager {
  private workbox: Workbox | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private isUpdateAvailable: boolean = false;
  private updateResolvers: Array<() => void> = [];
  private config: {
    swPath: string;
    scope?: string;
    updateCheckInterval?: number;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onError?: (error: Error) => void;
  };

  constructor(config: {
    swPath: string;
    scope?: string;
    updateCheckInterval?: number;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onError?: (error: Error) => void;
  }) {
    this.config = {
      updateCheckInterval: 60 * 60 * 1000, // 1 hour
      ...config
    };

    this.initialize();
  }

  private initialize(): void {
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service Worker not supported in this browser');
      return;
    }

    try {
      this.workbox = new Workbox(this.config.swPath, {
        scope: this.config.scope
      });

      this.setupEventListeners();
      this.registerServiceWorker();
      this.setupUpdateChecking();
    } catch (error) {
      logger.error('Error initializing Service Worker:', error);
      this.config.onError?.(error as Error);
    }
  }

  private setupEventListeners(): void {
    if (!this.workbox) return;

    this.workbox.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        logger.info('New service worker version installed');
        this.isUpdateAvailable = true;
        this.handleUpdateAvailable();
      } else {
        logger.info('Service worker installed for the first time');
        this.config.onSuccess?.(this.registration!);
      }
    });

    this.workbox.addEventListener('waiting', (event) => {
      logger.info('New service worker waiting to activate');
      this.isUpdateAvailable = true;
      this.handleUpdateAvailable();
    });

    this.workbox.addEventListener('controlling', (event) => {
      logger.info('Service worker controlling the page');
      window.location.reload();
    });

    this.workbox.addEventListener('activated', (event) => {
      if (!event.isUpdate) {
        logger.info('Service worker activated');
        this.config.onSuccess?.(this.registration!);
      }
    });

    this.workbox.addEventListener('redundant', (event) => {
      logger.warn('Service worker became redundant');
    });
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      this.registration = await this.workbox?.register();
      logger.info('Service worker registered');
    } catch (error) {
      logger.error('Error registering service worker:', error);
      this.config.onError?.(error as Error);
    }
  }

  private setupUpdateChecking(): void {
    if (this.config.updateCheckInterval) {
      setInterval(async () => {
        try {
          if (this.registration) {
            const updateFound = await this.registration.update();
            if (updateFound) {
              logger.info('Service worker update found');
            }
          }
        } catch (error) {
          logger.error('Error checking for service worker updates:', error);
        }
      }, this.config.updateCheckInterval);
    }
  }

  private handleUpdateAvailable(): void {
    if (this.config.onUpdate) {
      this.config.onUpdate(this.registration!);
    } else {
      // Default behavior: show update notification
      this.showUpdateNotification();
    }

    // Resolve any pending promises
    this.updateResolvers.forEach(resolve => resolve());
    this.updateResolvers = [];
  }

  private showUpdateNotification(): void {
    // In a real app, this would show a UI notification
    logger.info('New version available. Please refresh the page.');

    // You could also dispatch a custom event
    const event = new CustomEvent('swUpdateAvailable', {
      detail: { registration: this.registration }
    });
    window.dispatchEvent(event);
  }

  public async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const updateFound = await this.registration.update();
      if (updateFound) {
        logger.info('Update found during manual check');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error during manual update check:', error);
      return false;
    }
  }

  public async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    return new Promise((resolve) => {
      this.updateResolvers.push(resolve);
      this.registration!.waiting!.postMessage({ type: 'SKIP_WAITING' });
    });
  }

  public async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!this.registration) {
      try {
        this.registration = await navigator.serviceWorker.getRegistration();
      } catch (error) {
        logger.error('Error getting service worker registration:', error);
      }
    }
    return this.registration;
  }

  public async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const success = await this.registration.unregister();
      if (success) {
        logger.info('Service worker unregistered');
        this.registration = null;
        this.workbox = null;
      }
      return success;
    } catch (error) {
      logger.error('Error unregistering service worker:', error);
      return false;
    }
  }

  public get isUpdatePending(): boolean {
    return this.isUpdateAvailable;
  }
}

// Example usage
export const setupServiceWorker = (): ServiceWorkerManager => {
  const swManager = new ServiceWorkerManager({
    swPath: '/sw.js',
    scope: '/',
    updateCheckInterval: 30 * 60 * 1000, // 30 minutes
    onUpdate: (registration) => {
      // Show a custom update notification
      const updateNotification = document.createElement('div');
      updateNotification.innerHTML = `
        <div style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 15px;
          border-radius: 5px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          z-index: 1000;
        ">
          <p>A new version is available!</p>
          <button id="reloadBtn" style="
            background: white;
            color: #4CAF50;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin-top: 10px;
            cursor: pointer;
          ">Reload</button>
        </div>
      `;

      document.body.appendChild(updateNotification);

      const reloadBtn = document.getElementById('reloadBtn');
      if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
          swManager.skipWaiting().then(() => {
            window.location.reload();
          });
        });
      }
    },
    onSuccess: (registration) => {
      logger.info('Service worker successfully registered');
    },
    onError: (error) => {
      logger.error('Service worker error:', error);
      // You might want to show an error to the user
    }
  });

  return swManager;
};
```

### Caching Strategies (70 lines)

```typescript
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { CacheExpiration } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
  NetworkOnly
} from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import logger from '../utils/logger';

class PWACaching {
  private static instance: PWACaching;
  private isInitialized: boolean = false;
  private precacheManifest: Array<{ url: string; revision: string }> = [];

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): PWACaching {
    if (!PWACaching.instance) {
      PWACaching.instance = new PWACaching();
    }
    return PWACaching.instance;
  }

  public initialize(precacheManifest: Array<{ url: string; revision: string }>): void {
    if (this.isInitialized) {
      logger.warn('PWA Caching already initialized');
      return;
    }

    this.precacheManifest = precacheManifest;
    this.setupPrecaching();
    this.setupRuntimeCaching();
    this.isInitialized = true;

    logger.info('PWA Caching initialized');
  }

  private setupPrecaching(): void {
    try {
      // Precache all assets in the manifest
      precacheAndRoute(this.precacheManifest);

      // Set up a navigation route for the app shell
      registerRoute(
        ({ request }) => request.mode === 'navigate',
        createHandlerBoundToURL('/index.html')
      );

      logger.info('Precaching setup complete');
    } catch (error) {
      logger.error('Error setting up precaching:', error);
    }
  }

  private setupRuntimeCaching(): void {
    try {
      // 1. API Calls - Network First with Cache Fallback
      this.setupNetworkFirstCache(
        /\/api\/.*/,
        'api-cache',
        {
          cacheName: 'api-cache',
          plugins: [
            new CacheableResponsePlugin({
              statuses: [0, 200],
            }),
            new CacheExpiration('api-cache', {
              maxEntries: 100,
              maxAgeSeconds: 24 * 60 * 60, // 1 day
            }),
          ],
        }
      );

      // 2. WebSocket Messages - Cache First with Network Fallback
      this.setupCacheFirst(
        /\/ws\/.*/,
        'ws-cache',
        {
          cacheName: 'ws-cache',
          plugins: [
            new CacheableResponsePlugin({
              statuses: [0, 200],
            }),
            new CacheExpiration('ws-cache', {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60, // 1 hour
            }),
          ],
        }
      );

      // 3. Static Assets - Cache First
      this.setupCacheFirst(
        /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|eot|ttf|otf)$/,
        'static-assets-cache',
        {
          cacheName: 'static-assets-cache',
          plugins: [
            new CacheableResponsePlugin({
              statuses: [0, 200],
            }),
            new CacheExpiration('static-assets-cache', {
              maxEntries: 200,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            }),
          ],
        }
      );

      // 4. CSS and JS - Stale While Revalidate
      this.setupStaleWhileRevalidate(
        /\.(?:js|css)$/,
        'js-css-cache',
        {
          cacheName: 'js-css-cache',
          plugins: [
            new CacheableResponsePlugin({
              statuses: [0, 200],
            }),
            new CacheExpiration('js-css-cache', {
              maxEntries: 100,
              maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            }),
          ],
        }
      );

      // 5. HTML - Network First with Cache Fallback
      this.setupNetworkFirstCache(
        /\.html$/,
        'html-cache',
        {
          cacheName: 'html-cache',
          plugins: [
            new CacheableResponsePlugin({
              statuses: [0, 200],
            }),
            new CacheExpiration('html-cache', {
              maxEntries: 50,
              maxAgeSeconds: 1 * 60 * 60, // 1 hour
            }),
          ],
        }
      );

      // 6. Offline Fallback - Always return the offline page for failed requests
      this.setupOfflineFallback();

      // 7. Background Sync for failed API requests
      this.setupBackgroundSync();

      logger.info('Runtime caching setup complete');
    } catch (error) {
      logger.error('Error setting up runtime caching:', error);
    }
  }

  private setupNetworkFirstCache(
    pattern: RegExp,
    cacheName: string,
    options: {
      cacheName: string;
      plugins: any[];
    }
  ): void {
    registerRoute(
      ({ url }) => pattern.test(url.pathname),
      new NetworkFirst({
        cacheName: options.cacheName,
        plugins: options.plugins,
      })
    );
  }

  private setupCacheFirst(
    pattern: RegExp,
    cacheName: string,
    options: {
      cacheName: string;
      plugins: any[];
    }
  ): void {
    registerRoute(
      ({ url }) => pattern.test(url.pathname),
      new CacheFirst({
        cacheName: options.cacheName,
        plugins: options.plugins,
      })
    );
  }

  private setupStaleWhileRevalidate(
    pattern: RegExp,
    cacheName: string,
    options: {
      cacheName: string;
      plugins: any[];
    }
  ): void {
    registerRoute(
      ({ url }) => pattern.test(url.pathname),
      new StaleWhileRevalidate({
        cacheName: options.cacheName,
        plugins: options.plugins,
      })
    );
  }

  private setupOfflineFallback(): void {
    registerRoute(
      ({ request }) => request.destination === 'document',
      new NetworkOnly({
        plugins: [
          {
            handlerDidError: async () => {
              return await caches.match('/offline.html');
            },
          },
        ],
      })
    );
  }

  private setupBackgroundSync(): void {
    const bgSyncPlugin = new BackgroundSyncPlugin('apiQueue', {
      maxRetentionTime: 24 * 60, // Retry for max of 24 minutes
    });

    registerRoute(
      ({ url }) => url.pathname.startsWith('/api/') && url.method === 'POST',
      new NetworkOnly({
        plugins: [bgSyncPlugin],
      }),
      'POST'
    );
  }

  public async clearCache(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('workbox-') || cacheName.startsWith('static-') ||
              cacheName.startsWith('api-') || cacheName.startsWith('ws-')) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );

      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  public async getCacheSizes(): Promise<{ [key: string]: number }> {
    try {
      const cacheNames = await caches.keys();
      const sizes: { [key: string]: number } = {};

      await Promise.all(
        cacheNames.map(async cacheName => {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          let size = 0;

          await Promise.all(
            keys.map(async request => {
              const response = await cache.match(request);
              if (response) {
                const blob = await response.blob();
                size += blob.size;
              }
            })
          );

          sizes[cacheName] = size;
        })
      );

      return sizes;
    } catch (error) {
      logger.error('Error getting cache sizes:', error);
      return {};
    }
  }

  public async deleteOldCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      const currentCacheNames = [
        'api-cache',
        'ws-cache',
        'static-assets-cache',
        'js-css-cache',
        'html-cache',
        ...this.precacheManifest.map(item => `workbox-precache-${item.revision}`)
      ];

      await Promise.all(
        cacheNames.map(async cacheName => {
          if (!currentCacheNames.includes(cacheName)) {
            await caches.delete(cacheName);
            logger.info(`Deleted old cache: ${cacheName}`);
          }
        })
      );
    } catch (error) {
      logger.error('Error deleting old caches:', error);
    }
  }
}

export const pwaCaching = PWACaching.getInstance();
```

### Offline Functionality (60 lines)

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface OfflineMessage {
  id: string;
  type: 'chat' | 'support' | 'feedback';
  content: any;
  timestamp: string;
  metadata: Record<string, any>;
  status: 'pending' | 'synced' | 'failed';
  retries: number;
}

interface OfflineDB extends DBSchema {
  messages: {
    key: string;
    value: OfflineMessage;
    indexes: { 'by-status': string; 'by-type': string; 'by-timestamp': string };
  };
  drafts: {
    key: string;
    value: {
      id: string;
      content: string;
      timestamp: string;
      metadata: Record<string, any>;
    };
  };
  offlineData: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: string;
      ttl: number;
    };
  };
}

class OfflineManager {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isInitialized: boolean = false;
  private syncInProgress: boolean = false;
  private config: {
    dbName: string;
    dbVersion: number;
    maxRetries: number;
    retryDelay: number;
    maxOfflineMessages: number;
  };

  constructor(config: {
    dbName?: string;
    dbVersion?: number;
    maxRetries?: number;
    retryDelay?: number;
    maxOfflineMessages?: number;
  } = {}) {
    this.config = {
      dbName: 'chatbot-offline-db',
      dbVersion: 1,
      maxRetries: 3,
      retryDelay: 5000,
      maxOfflineMessages: 100,
      ...config
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Offline manager already initialized');
      return;
    }

    try {
      this.db = await openDB<OfflineDB>(this.config.dbName, this.config.dbVersion, {
        upgrade: (db) => {
          // Create messages store
          if (!db.objectStoreNames.contains('messages')) {
            const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
            messagesStore.createIndex('by-status', 'status', { unique: false });
            messagesStore.createIndex('by-type', 'type', { unique: false });
            messagesStore.createIndex('by-timestamp', 'timestamp', { unique: false });
          }

          // Create drafts store
          if (!db.objectStoreNames.contains('drafts')) {
            db.createObjectStore('drafts', { keyPath: 'id' });
          }

          // Create offline data store
          if (!db.objectStoreNames.contains('offlineData')) {
            db.createObjectStore('offlineData', { keyPath: 'id' });
          }
        }
      });

      this.isInitialized = true;
      logger.info('Offline manager initialized');

      // Start sync process
      this.startSyncProcess();
    } catch (error) {
      logger.error('Error initializing offline manager:', error);
      throw error;
    }
  }

  private async startSyncProcess(): Promise<void> {
    if (!this.db) return;

    // Check for pending messages periodically
    setInterval(async () => {
      if (this.syncInProgress) return;

      try {
        const pendingMessages = await this.getPendingMessages();
        if (pendingMessages.length > 0) {
          await this.syncPendingMessages();
        }
      } catch (error) {
        logger.error('Error in sync process:', error);
      }
    }, this.config.retryDelay);
  }

  public async storeMessage(message: Omit<OfflineMessage, 'id' | 'status' | 'retries'>): Promise<string> {
    if (!this.db) {
      throw new Error('Offline manager not initialized');
    }

    const id = uuidv4();
    const offlineMessage: OfflineMessage = {
      id,
      ...message,
      status: 'pending',
      retries: 0,
      timestamp: new Date().toISOString()
    };

    try {
      await this.db.add('messages', offlineMessage);

      // Enforce max messages limit
      const count = await this.db.count('messages');
      if (count > this.config.maxOfflineMessages) {
        await this.deleteOldestMessages(count - this.config.maxOfflineMessages);
      }

      logger.info(`Stored offline message: ${id}`);
      return id;
    } catch (error) {
      logger.error('Error storing offline message:', error);
      throw error;
    }
  }

  public async getPendingMessages(): Promise<OfflineMessage[]> {
    if (!this.db) {
      throw new Error('Offline manager not initialized');
    }

    try {
      return await this.db.getAllFromIndex('messages', 'by-status', 'pending');
    } catch (error) {
      logger.error('Error getting pending messages:', error);
      return [];
    }
  }

  public async syncPendingMessages(): Promise<void> {
    if (!this.db || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      const pendingMessages = await this.getPendingMessages();
      if (pendingMessages.length === 0) {
        this.syncInProgress = false;
        return;
      }

      logger.info(`Syncing ${pendingMessages.length} pending messages`);

      for (const message of pendingMessages) {
        try {
          // Attempt to sync the message
          const success = await this.attemptSync(message);

          if (success) {
            // Update message status to synced
            await this.db.put('messages', {
              ...message,
              status: 'synced',
              timestamp: new Date().toISOString()
            });
          } else {
            // Increment retry count
            const retries = message.retries + 1;
            if (retries >= this.config.maxRetries) {
              // Mark as failed after max retries
              await this.db.put('messages', {
                ...message,
                status: 'failed',
                retries
              });
            } else {
              // Update retry count
              await this.db.put('messages', {
                ...message,
                retries
              });
            }
          }
        } catch (error) {
          logger.error(`Error syncing message ${message.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error during sync process:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async attemptSync(message: OfflineMessage): Promise<boolean> {
    try {
      // In a real implementation, this would make the actual API call
      // For this example, we'll simulate it
      logger.info(`Attempting to sync message ${message.id} (attempt ${message.retries + 1})`);

      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Random success/failure for demonstration
      return Math.random() > 0.3;
    } catch (error) {
      logger.error(`Sync attempt failed for message ${message.id}:`, error);
      return false;
    }
  }

  public async getFailedMessages(): Promise<OfflineMessage[]> {
    if (!this.db) {
      throw new Error('Offline manager not initialized');
    }

    try {
      return await this.db.getAllFromIndex('messages', 'by-status', 'failed');
    } catch (error) {
      logger.error('Error getting failed messages:', error);
      return [];
    }
  }

  public async retryFailedMessages(): Promise<void> {
    if (!this.db) return;

    try {
      const failedMessages = await this.getFailedMessages();
      if (failedMessages.length === 0) return;

      // Reset status to pending for retry
      await Promise.all(
        failedMessages.map(message =>
          this.db!.put('messages', {
            ...message,
            status: 'pending',
            retries: 0
          })
        )
      );

      logger.info(`Retried ${failedMessages.length} failed messages`);
    } catch (error) {
      logger.error('Error retrying failed messages:', error);
    }
  }

  public async deleteOldestMessages(count: number): Promise<void> {
    if (!this.db) return;

    try {
      // Get the oldest messages
      const messages = await this.db.getAllFromIndex(
        'messages',
        'by-timestamp',
        IDBKeyRange.upperBound(new Date().toISOString())
      );

      // Sort by timestamp (oldest first)
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Delete the oldest messages
      const oldestMessages = messages.slice(0, count);
      await Promise.all(
        oldestMessages.map(message => this.db!.delete('messages', message.id))
      );

      logger.info(`Deleted ${oldestMessages.length} oldest messages`);
    } catch (error) {
      logger.error('Error deleting oldest messages:', error);
    }
  }

  public async storeDraft(draft: {
    content: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    if (!this.db) {
      throw new Error('Offline manager not initialized');
    }

    const id = uuidv4();
    const draftData = {
      id,
      content: draft.content,
      timestamp: new Date().toISOString(),
      metadata: draft.metadata || {}
    };

    try {
      await this.db.put('drafts', draftData);
      logger.info(`Stored draft: ${id}`);
      return id;
    } catch (error) {
      logger.error('Error storing draft:', error);
      throw error;
    }
  }

  public async getDrafts(): Promise<Array<{
    id: string;
    content: string;
    timestamp: string;
    metadata: Record<string, any>;
  }>> {
    if (!this.db) {
      throw new Error('Offline manager not initialized');
    }

    try {
      return await this.db.getAll('drafts');
    } catch (error) {
      logger.error('Error getting drafts:', error);
      return [];
    }
  }

  public async deleteDraft(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Offline manager not initialized');
    }

    try {
      await this.db.delete('drafts', id);
      logger.info(`Deleted draft: ${id}`);
    } catch (error) {
      logger.error(`Error deleting draft ${id}:`, error);
      throw error;
    }
  }

  public async storeOfflineData(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) {
      throw new Error('Offline manager not initialized');
    }

    try {
      await this.db.put('offlineData', {
        id: key,
        data,
        timestamp: new Date().toISOString(),
        ttl
      });
      logger.info(`Stored offline data: ${key}`);
    } catch (error) {
      logger.error(`Error storing offline data ${key}:`, error);
      throw error;
    }
  }

  public async getOfflineData(key: string): Promise<any> {
    if (!this.db) {
      throw new Error('Offline manager not initialized');
    }

    try {
      const item = await this.db.get('offlineData', key);
      if (!item) return null;

      // Check TTL
      const now = new Date().getTime();
      const storedTime = new Date(item.timestamp).getTime();
      if (now - storedTime > item.ttl) {
        await this.db.delete('offlineData', key);
        return null;
      }

      return item.data;
    } catch (error) {
      logger.error(`Error getting offline data ${key}:`, error);
      return null;
    }
  }

  public async clearExpiredData(): Promise<void> {
    if (!this.db) return;

    try {
      const allData = await this.db.getAll('offlineData');
      const now = new Date().getTime();

      await Promise.all(
        allData.map(async item => {
          const storedTime = new Date(item.timestamp).getTime();
          if (now - storedTime > item.ttl) {
            await this.db!.delete('offlineData', item.id);
            logger.info(`Deleted expired offline data: ${item.id}`);
          }
        })
      );
    } catch (error) {
      logger.error('Error clearing expired data:', error);
    }
  }
}

export const offlineManager = new OfflineManager();
```

### Background Sync (40 lines)

```typescript
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';
import logger from '../utils/logger';
import { offlineManager } from './offline-manager';

class BackgroundSyncManager {
  private syncPlugin: BackgroundSyncPlugin;
  private isInitialized: boolean = false;
  private config: {
    queueName: string;
    maxRetentionTime: number;
    syncInterval: number;
    onSync: (entries: Array<{ request: Request; timestamp: number }>) => void;
  };

  constructor(config: {
    queueName?: string;
    maxRetentionTime?: number;
    syncInterval?: number;
    onSync?: (entries: Array<{ request: Request; timestamp: number }>) => void;
  } = {}) {
    this.config = {
      queueName: 'chatbot-api-queue',
      maxRetentionTime: 24 * 60, // 24 minutes
      syncInterval: 5 * 60 * 1000, // 5 minutes
      on