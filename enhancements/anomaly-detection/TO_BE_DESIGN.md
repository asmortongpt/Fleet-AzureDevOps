# TO_BE_DESIGN.md: Anomaly Detection Module - Next-Generation System Design

## Executive Vision (120 lines)

### Strategic Vision for the Enhanced Anomaly Detection System

The next-generation anomaly detection system represents a paradigm shift in how organizations identify, analyze, and respond to operational irregularities. This transformation moves beyond traditional rule-based systems to an intelligent, self-learning platform that provides predictive insights with human-like contextual understanding.

**Business Transformation Goals:**

1. **Proactive Risk Management**: Transition from reactive incident response to predictive risk mitigation, reducing financial losses by 40% through early anomaly detection
2. **Operational Efficiency**: Automate 95% of routine anomaly investigations, freeing security teams to focus on strategic threat analysis
3. **Data-Driven Decision Making**: Provide executive leadership with real-time operational intelligence through interactive dashboards and predictive analytics
4. **Regulatory Compliance**: Achieve 100% audit readiness with automated compliance reporting and immutable anomaly logs
5. **Customer Trust**: Enhance brand reputation through transparent anomaly resolution and proactive communication

**User Experience Transformation:**

The system will implement a "zero-learning-curve" interface that adapts to each user's role and expertise level. Key UX improvements include:

- **Context-Aware Workflows**: Dynamic interfaces that present only relevant information based on user role, current context, and historical behavior patterns
- **Predictive Assistance**: AI-powered suggestions that anticipate user needs before explicit requests
- **Immersive Visualization**: 3D anomaly relationship mapping with interactive exploration capabilities
- **Natural Language Interaction**: Voice and chat-based interface for querying anomaly data and generating reports
- **Adaptive Alerting**: Intelligent notification system that learns user preferences and adjusts alert frequency and channels accordingly

**Competitive Advantages:**

1. **Hybrid Detection Engine**: Unique combination of statistical analysis, machine learning, and graph-based anomaly detection
2. **Temporal Pattern Recognition**: Industry-leading capability to detect anomalies across multiple time dimensions (seconds to years)
3. **Explainable AI**: Full transparency into detection logic with human-readable explanations for each anomaly
4. **Cross-Domain Correlation**: Ability to detect anomalies that span business units, systems, and data types
5. **Self-Optimizing System**: Continuous performance improvement through reinforcement learning

**Long-Term Roadmap (3-5 Years):**

**Year 1: Foundation and Core Capabilities**
- Launch enhanced detection engine with 95% accuracy
- Implement real-time processing pipeline
- Develop comprehensive API ecosystem
- Achieve SOC 2 Type II certification

**Year 2: Intelligence Expansion**
- Integrate external threat intelligence feeds
- Implement automated response playbooks
- Develop industry-specific anomaly models
- Expand to edge computing environments

**Year 3: Autonomous Operations**
- Achieve 80% automated anomaly resolution
- Implement predictive maintenance for IT infrastructure
- Develop quantum-resistant encryption
- Expand to IoT and OT environments

**Year 4: Cognitive Platform**
- Implement natural language processing for anomaly investigation
- Develop digital twin integration
- Achieve full autonomous operation mode
- Expand to multi-cloud and hybrid environments

**Year 5: Industry Standard Platform**
- Open core model with enterprise extensions
- Establish anomaly detection as a service (ADaaS)
- Develop industry consortium for anomaly data sharing
- Achieve 99.99% uptime SLA

**Economic Impact Analysis:**

The enhanced system is projected to deliver:
- 300% ROI within 36 months
- 40% reduction in operational losses from anomalies
- 60% reduction in mean time to detect (MTTD)
- 70% reduction in mean time to respond (MTTR)
- 50% reduction in false positives

**Implementation Strategy:**

1. **Phased Rollout**: Begin with high-value use cases and expand systematically
2. **Pilot Programs**: Initial deployment with select enterprise customers
3. **Continuous Feedback**: Real-time user feedback integration
4. **Performance Benchmarking**: Ongoing comparison against baseline metrics
5. **Change Management**: Comprehensive training and adoption programs

This vision establishes the anomaly detection system as a strategic business asset rather than a tactical tool, positioning it as a core component of enterprise risk management and operational intelligence.

## Performance Enhancements (300+ lines)

### Redis Caching Layer Implementation

```typescript
// redis-cache.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { promisify } from 'util';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: RedisClientType;
  private getAsync: (key: string) => Promise<string | null>;
  private setAsync: (key: string, value: string, mode?: string, duration?: number) => Promise<string>;
  private delAsync: (key: string) => Promise<number>;
  private keysAsync: (pattern: string) => Promise<string[]>;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD', '');
    const redisTls = this.configService.get<boolean>('REDIS_TLS', false);

    this.client = createClient({
      url: redisUrl,
      password: redisPassword,
      socket: {
        tls: redisTls,
        rejectUnauthorized: false
      }
    }) as RedisClientType;

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`, err.stack);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Reconnecting to Redis...');
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.keysAsync = promisify(this.client.keys).bind(this.client);
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Redis client initialized successfully');

      // Initialize cache with default TTL
      await this.client.configSet('maxmemory-policy', 'allkeys-lru');
      await this.client.configSet('maxmemory', this.configService.get<string>('REDIS_MAX_MEMORY', '1gb'));
    } catch (err) {
      this.logger.error('Failed to initialize Redis client', err.stack);
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    } catch (err) {
      this.logger.error('Error closing Redis connection', err.stack);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.getAsync(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      this.logger.error(`Error getting key ${key} from Redis`, err.stack);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const stringValue = JSON.stringify(value);
      const result = ttl
        ? await this.setAsync(key, stringValue, 'EX', ttl)
        : await this.setAsync(key, stringValue);

      return result === 'OK';
    } catch (err) {
      this.logger.error(`Error setting key ${key} in Redis`, err.stack);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.delAsync(key);
      return result > 0;
    } catch (err) {
      this.logger.error(`Error deleting key ${key} from Redis`, err.stack);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keysAsync(pattern);
      if (keys.length > 0) {
        return await this.delAsync(keys);
      }
      return 0;
    } catch (err) {
      this.logger.error(`Error deleting pattern ${pattern} from Redis`, err.stack);
      return 0;
    }
  }

  async getWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    try {
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return cachedValue;
      }

      this.logger.debug(`Cache miss for key: ${key}, fetching from source`);
      const freshValue = await fetchFn();
      await this.set(key, freshValue, ttl);
      return freshValue;
    } catch (err) {
      this.logger.error(`Error in getWithCache for key ${key}`, err.stack);
      // Fallback to direct fetch if cache fails
      return await fetchFn();
    }
  }

  async getMulti<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await Promise.all(keys.map(key => this.get<T>(key)));
      return values;
    } catch (err) {
      this.logger.error(`Error getting multiple keys from Redis`, err.stack);
      return keys.map(() => null);
    }
  }

  async setMulti(entries: { key: string; value: any; ttl?: number }[]): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();
      entries.forEach(entry => {
        const stringValue = JSON.stringify(entry.value);
        if (entry.ttl) {
          pipeline.set(entry.key, stringValue, 'EX', entry.ttl);
        } else {
          pipeline.set(entry.key, stringValue);
        }
      });

      const results = await pipeline.exec();
      return results.every(result => result === 'OK');
    } catch (err) {
      this.logger.error(`Error setting multiple keys in Redis`, err.stack);
      return false;
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.client.incrBy(key, amount);
    } catch (err) {
      this.logger.error(`Error incrementing key ${key} in Redis`, err.stack);
      return -1;
    }
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.client.decrBy(key, amount);
    } catch (err) {
      this.logger.error(`Error decrementing key ${key} in Redis`, err.stack);
      return -1;
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    try {
      return await this.keysAsync(pattern);
    } catch (err) {
      this.logger.error(`Error getting keys with pattern ${pattern} from Redis`, err.stack);
      return [];
    }
  }

  async flushAll(): Promise<boolean> {
    try {
      await this.client.flushAll();
      return true;
    } catch (err) {
      this.logger.error('Error flushing Redis', err.stack);
      return false;
    }
  }

  async getCacheStats(): Promise<{
    keys: number;
    memoryUsage: string;
    connectedClients: number;
  }> {
    try {
      const keys = await this.client.dbSize();
      const memoryInfo = await this.client.info('memory');
      const memoryUsage = memoryInfo.split('\n')
        .find(line => line.startsWith('used_memory:'))
        ?.split(':')[1] || '0';

      const clientsInfo = await this.client.info('clients');
      const connectedClients = clientsInfo.split('\n')
        .find(line => line.startsWith('connected_clients:'))
        ?.split(':')[1] || '0';

      return {
        keys,
        memoryUsage,
        connectedClients: parseInt(connectedClients)
      };
    } catch (err) {
      this.logger.error('Error getting Redis stats', err.stack);
      return {
        keys: 0,
        memoryUsage: '0',
        connectedClients: 0
      };
    }
  }
}
```

### Database Query Optimization

```typescript
// database-optimizer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets, DataSource } from 'typeorm';
import { Anomaly } from './entities/anomaly.entity';
import { DetectionRule } from './entities/detection-rule.entity';
import { AnomalyEvent } from './entities/anomaly-event.entity';
import { User } from './entities/user.entity';
import { QueryOptimizerConfig } from './interfaces/query-optimizer-config.interface';
import { QueryPerformanceMetrics } from './interfaces/query-performance-metrics.interface';
import { RedisCacheService } from './redis-cache.service';

@Injectable()
export class DatabaseOptimizerService {
  private readonly logger = new Logger(DatabaseOptimizerService.name);
  private readonly MAX_QUERY_TIME_MS = 1000;
  private readonly MAX_JOINS = 5;
  private readonly MAX_RESULTS = 1000;

  constructor(
    @InjectRepository(Anomaly)
    private readonly anomalyRepository: Repository<Anomaly>,
    @InjectRepository(DetectionRule)
    private readonly detectionRuleRepository: Repository<DetectionRule>,
    @InjectRepository(AnomalyEvent)
    private readonly anomalyEventRepository: Repository<AnomalyEvent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly cacheService: RedisCacheService
  ) {}

  async optimizeAnomalyQuery(
    queryConfig: QueryOptimizerConfig,
    userId?: string
  ): Promise<{ data: Anomaly[]; metrics: QueryPerformanceMetrics }> {
    const startTime = performance.now();
    const queryBuilder = this.anomalyRepository.createQueryBuilder('anomaly');

    try {
      // Apply base query optimizations
      this.applyBaseOptimizations(queryBuilder);

      // Apply user-specific filters if provided
      if (userId) {
        this.applyUserAccessControl(queryBuilder, userId);
      }

      // Apply configuration-specific optimizations
      this.applyConfigOptimizations(queryBuilder, queryConfig);

      // Execute the query with performance monitoring
      const [data, count] = await Promise.all([
        queryBuilder.getMany(),
        queryBuilder.getCount()
      ]);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Log performance metrics
      this.logger.log(
        `Anomaly query executed in ${executionTime}ms, returned ${data.length} of ${count} records`
      );

      return {
        data,
        metrics: {
          executionTime,
          recordsReturned: data.length,
          totalRecords: count,
          queryComplexity: this.calculateQueryComplexity(queryBuilder),
          cacheHit: false // Will be updated if caching is used
        }
      };
    } catch (err) {
      this.logger.error('Error optimizing anomaly query', err.stack);
      throw new Error('Failed to optimize anomaly query');
    }
  }

  async optimizeAnomalyEventsQuery(
    queryConfig: QueryOptimizerConfig,
    anomalyId?: string
  ): Promise<{ data: AnomalyEvent[]; metrics: QueryPerformanceMetrics }> {
    const cacheKey = `anomaly_events:${JSON.stringify(queryConfig)}:${anomalyId || 'all'}`;
    const cachedResult = await this.cacheService.get<{ data: AnomalyEvent[]; metrics: QueryPerformanceMetrics }>(cacheKey);

    if (cachedResult) {
      this.logger.debug(`Cache hit for anomaly events query: ${cacheKey}`);
      cachedResult.metrics.cacheHit = true;
      return cachedResult;
    }

    const startTime = performance.now();
    const queryBuilder = this.anomalyEventRepository.createQueryBuilder('event');

    try {
      this.applyBaseOptimizations(queryBuilder);

      if (anomalyId) {
        queryBuilder.andWhere('event.anomalyId = :anomalyId', { anomalyId });
      }

      this.applyConfigOptimizations(queryBuilder, queryConfig);

      // Optimize for event queries - typically need more recent data
      if (!queryConfig.timeRange || queryConfig.timeRange === 'all') {
        queryBuilder.andWhere('event.createdAt >= :minDate', {
          minDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        });
      }

      const [data, count] = await Promise.all([
        queryBuilder.getMany(),
        queryBuilder.getCount()
      ]);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      const result = {
        data,
        metrics: {
          executionTime,
          recordsReturned: data.length,
          totalRecords: count,
          queryComplexity: this.calculateQueryComplexity(queryBuilder),
          cacheHit: false
        }
      };

      // Cache the result for 5 minutes
      await this.cacheService.set(cacheKey, result, 300);

      return result;
    } catch (err) {
      this.logger.error('Error optimizing anomaly events query', err.stack);
      throw new Error('Failed to optimize anomaly events query');
    }
  }

  private applyBaseOptimizations(queryBuilder: SelectQueryBuilder<any>): void {
    // Always select only necessary fields
    queryBuilder.select([
      'anomaly.id',
      'anomaly.severity',
      'anomaly.status',
      'anomaly.detectedAt',
      'anomaly.resolvedAt',
      'anomaly.score',
      'anomaly.type',
      'anomaly.source',
      'anomaly.description'
    ]);

    // Add default ordering
    queryBuilder.orderBy('anomaly.detectedAt', 'DESC');

    // Limit results to prevent excessive data transfer
    queryBuilder.take(this.MAX_RESULTS);

    // Add query timeout
    queryBuilder.setQueryRunnerOptions({
      queryTimeout: this.MAX_QUERY_TIME_MS
    });
  }

  private applyUserAccessControl(queryBuilder: SelectQueryBuilder<any>, userId: string): void {
    queryBuilder.leftJoin('anomaly.assignedUsers', 'assignedUser');
    queryBuilder.leftJoin('anomaly.createdBy', 'createdBy');

    queryBuilder.andWhere(new Brackets(qb => {
      qb.where('assignedUser.id = :userId', { userId })
        .orWhere('createdBy.id = :userId', { userId })
        .orWhere('anomaly.visibility = :public', { public: 'public' });
    }));
  }

  private applyConfigOptimizations(
    queryBuilder: SelectQueryBuilder<any>,
    config: QueryOptimizerConfig
  ): void {
    if (config.timeRange) {
      const now = new Date();
      let startDate: Date;

      switch (config.timeRange) {
        case 'last_hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'last_24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'last_7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last_30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (config.customRange) {
            startDate = new Date(config.customRange.start);
            const endDate = new Date(config.customRange.end);
            queryBuilder.andWhere('anomaly.detectedAt BETWEEN :start AND :end', {
              start: startDate,
              end: endDate
            });
          }
          return;
        default:
          return;
      }

      queryBuilder.andWhere('anomaly.detectedAt >= :startDate', { startDate });
    }

    if (config.severityLevels && config.severityLevels.length > 0) {
      queryBuilder.andWhere('anomaly.severity IN (:...severities)', {
        severities: config.severityLevels
      });
    }

    if (config.statuses && config.statuses.length > 0) {
      queryBuilder.andWhere('anomaly.status IN (:...statuses)', {
        statuses: config.statuses
      });
    }

    if (config.types && config.types.length > 0) {
      queryBuilder.andWhere('anomaly.type IN (:...types)', {
        types: config.types
      });
    }

    if (config.sources && config.sources.length > 0) {
      queryBuilder.andWhere('anomaly.source IN (:...sources)', {
        sources: config.sources
      });
    }

    if (config.minScore) {
      queryBuilder.andWhere('anomaly.score >= :minScore', {
        minScore: config.minScore
      });
    }

    if (config.maxScore) {
      queryBuilder.andWhere('anomaly.score <= :maxScore', {
        maxScore: config.maxScore
      });
    }

    if (config.searchTerm) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('anomaly.description ILIKE :searchTerm', {
            searchTerm: `%${config.searchTerm}%`
          })
          .orWhere('anomaly.type ILIKE :searchTerm', {
            searchTerm: `%${config.searchTerm}%`
          })
          .orWhere('anomaly.source ILIKE :searchTerm', {
            searchTerm: `%${config.searchTerm}%`
          });
        })
      );
    }

    // Add pagination if requested
    if (config.page && config.pageSize) {
      const skip = (config.page - 1) * config.pageSize;
      queryBuilder.skip(skip).take(config.pageSize);
    }

    // Add joins only if needed
    if (config.includeAssignedUsers) {
      queryBuilder.leftJoinAndSelect('anomaly.assignedUsers', 'assignedUsers');
    }

    if (config.includeEvents) {
      queryBuilder.leftJoinAndSelect('anomaly.events', 'events');
    }

    if (config.includeDetectionRules) {
      queryBuilder.leftJoinAndSelect('anomaly.detectionRules', 'detectionRules');
    }
  }

  private calculateQueryComplexity(queryBuilder: SelectQueryBuilder<any>): number {
    let complexity = 0;

    // Base complexity
    complexity += 10;

    // Add complexity for each join
    const joins = queryBuilder.expressionMap.joinAttributes;
    complexity += joins.length * 5;

    // Add complexity for each where condition
    const whereConditions = queryBuilder.expressionMap.wheres;
    complexity += whereConditions.length * 2;

    // Add complexity for sorting
    const orderBys = queryBuilder.expressionMap.orderBys;
    complexity += Object.keys(orderBys).length * 1;

    // Add complexity for pagination
    if (queryBuilder.expressionMap.skip || queryBuilder.expressionMap.take) {
      complexity += 5;
    }

    return Math.min(complexity, 100); // Cap at 100
  }

  async getQueryExecutionPlan(query: string): Promise<string> {
    try {
      const result = await this.dataSource.query(`EXPLAIN ANALYZE ${query}`);
      return result.map((row: any) => row['QUERY PLAN']).join('\n');
    } catch (err) {
      this.logger.error('Error getting query execution plan', err.stack);
      return 'Unable to generate execution plan';
    }
  }

  async optimizeAllActiveQueries(): Promise<void> {
    try {
      const activeQueries = await this.dataSource.query(`
        SELECT pid, query, now() - query_start AS duration
        FROM pg_stat_activity
        WHERE state = 'active'
        AND query NOT LIKE '%pg_stat_activity%'
        AND query_start < now() - interval '10 seconds'
      `);

      for (const query of activeQueries) {
        if (query.duration > 30) { // If query is running for more than 30 seconds
          this.logger.warn(`Long-running query detected (${query.duration}s): ${query.query.substring(0, 100)}...`);

          // Optionally terminate the query
          // await this.dataSource.query(`SELECT pg_terminate_backend(${query.pid})`);
        }
      }
    } catch (err) {
      this.logger.error('Error optimizing active queries', err.stack);
    }
  }

  async createMaterializedView(viewName: string, query: string): Promise<void> {
    try {
      // Check if materialized view exists
      const exists = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM pg_catalog.pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
          AND c.relname = $1
          AND c.relkind = 'm'
        )
      `, [viewName]);

      if (exists[0].exists) {
        await this.dataSource.query(`REFRESH MATERIALIZED VIEW ${viewName}`);
      } else {
        await this.dataSource.query(`CREATE MATERIALIZED VIEW ${viewName} AS ${query}`);
        await this.dataSource.query(`CREATE INDEX idx_${viewName}_id ON ${viewName}(id)`);
      }

      this.logger.log(`Materialized view ${viewName} created/updated successfully`);
    } catch (err) {
      this.logger.error(`Error creating materialized view ${viewName}`, err.stack);
      throw err;
    }
  }

  async getDatabasePerformanceMetrics(): Promise<{
    activeConnections: number;
    longRunningQueries: number;
    cacheHitRatio: number;
    tableSizes: Record<string, number>;
  }> {
    try {
      // Get active connections
      const activeConnectionsResult = await this.dataSource.query(`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE state = 'active'
      `);

      // Get long-running queries (> 10 seconds)
      const longRunningQueriesResult = await this.dataSource.query(`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE state = 'active'
        AND now() - query_start > interval '10 seconds'
      `);

      // Get cache hit ratio
      const cacheHitRatioResult = await this.dataSource.query(`
        SELECT
          sum(heap_blks_read) as disk_reads,
          sum(heap_blks_hit) as cache_hits
        FROM pg_statio_user_tables
      `);

      const cacheHitRatio = cacheHitRatioResult[0].cache_hits /
        (cacheHitRatioResult[0].cache_hits + cacheHitRatioResult[0].disk_reads);

      // Get table sizes
      const tableSizesResult = await this.dataSource.query(`
        SELECT
          table_name,
          pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC
        LIMIT 10
      `);

      const tableSizes: Record<string, number> = {};
      for (const row of tableSizesResult) {
        const sizeMatch = row.size.match(/^(\d+)\s(\w+)$/);
        if (sizeMatch) {
          const size = parseInt(sizeMatch[1]);
          const unit = sizeMatch[2].toLowerCase();

          let bytes = size;
          switch (unit) {
            case 'kb': bytes = size * 1024; break;
            case 'mb': bytes = size * 1024 * 1024; break;
            case 'gb': bytes = size * 1024 * 1024 * 1024; break;
          }

          tableSizes[row.table_name] = bytes;
        }
      }

      return {
        activeConnections: parseInt(activeConnectionsResult[0].count),
        longRunningQueries: parseInt(longRunningQueriesResult[0].count),
        cacheHitRatio: parseFloat(cacheHitRatio.toFixed(4)),
        tableSizes
      };
    } catch (err) {
      this.logger.error('Error getting database performance metrics', err.stack);
      return {
        activeConnections: 0,
        longRunningQueries: 0,
        cacheHitRatio: 0,
        tableSizes: {}
      };
    }
  }
}
```

### API Response Compression

```typescript
// response-compression.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { createBrotliCompress, createGzip, createDeflate } from 'zlib';
import { promisify } from 'util';
import { pipeline } from 'stream';

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly brotliCompress: any;
  private readonly gzipCompress: any;
  private readonly deflateCompress: any;
  private readonly pipelineAsync: any;

  constructor(private configService: ConfigService) {
    // Initialize compression algorithms with optimal settings
    this.brotliCompress = createBrotliCompress({
      [compression.constants.BROTLI_PARAM_QUALITY]: this.configService.get<number>('COMPRESSION_BROTLI_LEVEL', 6),
      [compression.constants.BROTLI_PARAM_MODE]: compression.constants.BROTLI_MODE_TEXT,
      [compression.constants.BROTLI_PARAM_SIZE_HINT]: 16384 // 16KB
    });

    this.gzipCompress = createGzip({
      level: this.configService.get<number>('COMPRESSION_GZIP_LEVEL', 6),
      memLevel: 9,
      windowBits: 15
    });

    this.deflateCompress = createDeflate({
      level: this.configService.get<number>('COMPRESSION_DEFLATE_LEVEL', 6),
      memLevel: 9,
      windowBits: 15
    });

    this.pipelineAsync = promisify(pipeline);
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip compression for small responses
    const skipCompression = this.shouldSkipCompression(req);
    if (skipCompression) {
      return next();
    }

    // Determine the best compression algorithm based on client support
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const compressionAlgorithm = this.determineCompressionAlgorithm(acceptEncoding);

    if (!compressionAlgorithm) {
      return next();
    }

    // Set appropriate headers
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('Content-Encoding', compressionAlgorithm.name);

    // Store original methods
    const originalWrite = res.write;
    const originalEnd = res.end;
    const originalOn = res.on;

    // Create compression stream
    const compressionStream = this.createCompressionStream(compressionAlgorithm);

    // Override response methods
    res.write = (chunk: any, encoding?: any, callback?: any) => {
      if (!res.headersSent) {
        res.setHeader('Content-Encoding', compressionAlgorithm.name);
      }
      return compressionStream.write(chunk, encoding, callback);
    };

    res.end = (chunk?: any, encoding?: any, callback?: any) => {
      if (chunk) {
        compressionStream.write(chunk, encoding);
      }
      compressionStream.end();
      return res;
    };

    res.on = (event: string, listener: (...args: any[]) => void) => {
      if (event === 'drain') {
        return compressionStream.on(event, listener);
      }
      return originalOn.call(res, event, listener);
    };

    // Pipe compressed data to response
    compressionStream.on('data', (chunk: Buffer) => {
      originalWrite.call(res, chunk);
    });

    compressionStream.on('end', () => {
      originalEnd.call(res);
    });

    compressionStream.on('error', (err: Error) => {
      res.removeHeader('Content-Encoding');
      res.status(500).send('Compression error');
    });

    next();
  }

  private shouldSkipCompression(req: Request): boolean {
    // Skip compression for certain content types
    const contentType = req.headers['content-type'] || '';
    const skipTypes = ['image/', 'video/', 'audio/', 'application/pdf', 'application/zip'];

    if (skipTypes.some(type => contentType.startsWith(type))) {
      return true;
    }

    // Skip compression for small responses (configurable threshold)
    const minSize = this.configService.get<number>('COMPRESSION_MIN_SIZE', 1024); // 1KB
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) < minSize) {
      return true;
    }

    // Skip compression for specific paths
    const skipPaths = this.configService.get<string[]>('COMPRESSION_SKIP_PATHS', []);
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return true;
    }

    return false;
  }

  private determineCompressionAlgorithm(acceptEncoding: string): { name: string; stream: any } | null {
    const encodings = acceptEncoding.split(',').map(encoding => encoding.trim().toLowerCase());

    // Priority order: brotli > gzip > deflate
    if (encodings.includes('br')) {
      return { name: 'br', stream: this.brotliCompress };
    }

    if (encodings.includes('gzip')) {
      return { name: 'gzip', stream: this.gzipCompress };
    }

    if (encodings.includes('deflate')) {
      return { name: 'deflate', stream: this.deflateCompress };
    }

    return null;
  }

  private createCompressionStream(algorithm: { name: string; stream: any }): any {
    // Reset the compression stream for each request
    if (algorithm.name === 'br') {
      return createBrotliCompress({
        [compression.constants.BROTLI_PARAM_QUALITY]: this.configService.get<number>('COMPRESSION_BROTLI_LEVEL', 6),
        [compression.constants.BROTLI_PARAM_MODE]: compression.constants.BROTLI_MODE_TEXT
      });
    } else if (algorithm.name === 'gzip') {
      return createGzip({
        level: this.configService.get<number>('COMPRESSION_GZIP_LEVEL', 6)
      });
    } else {
      return createDeflate({
        level: this.configService.get<number>('COMPRESSION_DEFLATE_LEVEL', 6)
      });
    }
  }

  async compressString(content: string, algorithm: 'br' | 'gzip' | 'deflate' = 'br'): Promise<Buffer> {
    try {
      const input = Buffer.from(content);
      let compressionStream: any;

      switch (algorithm) {
        case 'br':
          compressionStream = this.brotliCompress;
          break;
        case 'gzip':
          compressionStream = this.gzipCompress;
          break;
        case 'deflate':
          compressionStream = this.deflateCompress;
          break;
        default:
          compressionStream = this.brotliCompress;
      }

      const chunks: Buffer[] = [];
      compressionStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      compressionStream.write(input);
      compressionStream.end();

      return new Promise<Buffer>((resolve, reject) => {
        compressionStream.on('end', () => resolve(Buffer.concat(chunks)));
        compressionStream.on('error', reject);
      });
    } catch (err) {
      throw new Error(`Compression failed: ${err.message}`);
    }
  }

  async decompressBuffer(buffer: Buffer, encoding: string): Promise<string> {
    try {
      let decompressionStream: any;

      switch (encoding) {
        case 'br':
          decompressionStream = compression.createBrotliDecompress();
          break;
        case 'gzip':
          decompressionStream = compression.createGunzip();
          break;
        case 'deflate':
          decompressionStream = compression.createInflate();
          break;
        default:
          throw new Error(`Unsupported encoding: ${encoding}`);
      }

      const chunks: Buffer[] = [];
      decompressionStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      decompressionStream.write(buffer);
      decompressionStream.end();

      return new Promise<string>((resolve, reject) => {
        decompressionStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        decompressionStream.on('error', reject);
      });
    } catch (err) {
      throw new Error(`Decompression failed: ${err.message}`);
    }
  }

  getCompressionStats(): {
    brotliRatio: number;
    gzipRatio: number;
    deflateRatio: number;
  } {
    // In a real implementation, you would track actual compression ratios
    // This is a simplified version
    return {
      brotliRatio: 0.3, // 70% compression
      gzipRatio: 0.5,   // 50% compression
      deflateRatio: 0.55 // 45% compression
    };
  }
}
```

### Lazy Loading Implementation

```typescript
// lazy-loader.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisCacheService } from './redis-cache.service';
import { ConfigService } from '@nestjs/config';
import { Subject, Observable, from, of } from 'rxjs';
import { mergeMap, delay, tap, catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

interface LazyLoadRequest<T> {
  id: string;
  loader: () => Promise<T>;
  priority: number;
  ttl?: number;
  dependencies?: string[];
  timestamp: number;
}

interface LazyLoadResult<T> {
  id: string;
  data: T;
  error?: Error;
  loadedAt: number;
  expiresAt?: number;
}

@Injectable()
export class LazyLoaderService {
  private readonly logger = new Logger(LazyLoaderService.name);
  private readonly requestQueue: LazyLoadRequest<any>[] = [];
  private readonly processingQueue = new Map<string, LazyLoadRequest<any>>();
  private readonly resultCache = new Map<string, LazyLoadResult<any>>();
  private readonly dependencyGraph = new Map<string, Set<string>>();
  private readonly reverseDependencyGraph = new Map<string, Set<string>>();
  private readonly requestSubject = new Subject<LazyLoadRequest<any>>();
  private isProcessing = false;
  private readonly MAX_CONCURRENT_REQUESTS: number;
  private readonly DEFAULT_TTL: number;
  private readonly PRIORITY_LEVELS: number;

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.MAX_CONCURRENT_REQUESTS = this.configService.get<number>('LAZY_LOAD_MAX_CONCURRENT', 5);
    this.DEFAULT_TTL = this.configService.get<number>('LAZY_LOAD_DEFAULT_TTL', 300);
    this.PRIORITY_LEVELS = this.configService.get<number>('LAZY_LOAD_PRIORITY_LEVELS', 5);

    // Initialize the processing pipeline
    this.initializeProcessingPipeline();

    // Set up periodic cache cleanup
    this.setupCacheCleanup();
  }

  private initializeProcessingPipeline(): void {
    // Create multiple processing streams based on priority
    for (let i = 0; i < this.PRIORITY_LEVELS; i++) {
      this.requestSubject
        .pipe(
          mergeMap(request => {
            if (request.priority === i) {
              return this.processRequest(request).pipe(
                tap(result => {
                  this.handleResult(result);
                }),
                catchError(error => {
                  this.logger.error(`Error processing request ${request.id}`, error.stack);
                  this.handleResult({
                    id: request.id,
                    data: null,
                    error,
                    loadedAt: Date.now()
                  });
                  return of(null);
                })
              );
            }
            return of(null);
          }, this.MAX_CONCURRENT_REQUESTS)
        )
        .subscribe();
    }
  }

  private setupCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      let removedCount = 0;

      this.resultCache.forEach((result, id) => {
        if (result.expiresAt && result.expiresAt <= now) {
          this.resultCache.delete(id);
          removedCount++;
        }
      });

      if (removedCount > 0) {
        this.logger.debug(`Cleaned up ${removedCount} expired cache entries`);
      }
    }, 5 * 60 * 1000);
  }

  async load<T>(
    loader: () => Promise<T>,
    options: {
      priority?: number;
      ttl?: number;
      key?: string;
      dependencies?: string[];
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    const {
      priority = 0,
      ttl = this.DEFAULT_TTL,
      key = uuidv4(),
      dependencies = [],
      forceRefresh = false
    } = options;

    // Check if we already have a result in cache
    if (!forceRefresh) {
      const cachedResult = this.resultCache.get(key);
      if (cachedResult) {
        if (cachedResult.expiresAt && cachedResult.expiresAt > Date.now()) {
          this.logger.debug(`Cache hit for key: ${key}`);
          if (cachedResult.error) {
            throw cachedResult.error;
          }
          return cachedResult.data;
        }
      }

      // Check Redis cache
      const redisCached = await this.cacheService.get<LazyLoadResult<T>>(key);
      if (redisCached) {
        this.resultCache.set(key, redisCached);
        this.logger.debug(`Redis cache hit for key: ${key}`);
        if (redisCached.error) {
          throw redisCached.error;
        }
        return redisCached.data;
      }
    }

    // Create a new request
    const request: LazyLoadRequest<T> = {
      id: key,
      loader,
      priority: Math.min(priority, this.PRIORITY_LEVELS - 1),
      ttl,
      dependencies,
      timestamp: Date.now()
    };

    // Add dependencies to the graph
    this.addDependencies(key, dependencies);

    // Add to queue
    this.requestQueue.push(request);

    // Sort queue by priority and timestamp
    this.requestQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    // Emit the request to the processing pipeline
    this.requestSubject.next(request);

    // Return a promise that resolves when the data is loaded
    return new Promise<T>((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const result = this.resultCache.get(key);
        if (result) {
          clearInterval(checkInterval);
          if (result.error) {
            reject(result.error);
          } else {
            resolve(result.data);
          }
        }
      }, 50);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error(`Lazy load timeout for key: ${key}`));
      }, 30000);
    });
  }

  private addDependencies(key: string, dependencies: string[]): void {
    // Add to dependency graph
    if (!this.dependencyGraph.has(key)) {
      this.dependencyGraph.set(key, new Set());
    }
    const deps = this.dependencyGraph.get(key);
    dependencies.forEach(dep => deps.add(dep));

    // Add to reverse dependency graph
    dependencies.forEach(dep => {
      if (!this.reverseDependencyGraph.has(dep)) {
        this.reverseDependencyGraph.set(dep, new Set());
      }
      this.reverseDependencyGraph.get(dep).add(key);
    });
  }

  private processRequest<T>(request: LazyLoadRequest<T>): Observable<LazyLoadResult<T>> {
    // Check if this request is already being processed
    if (this.processingQueue.has(request.id)) {
      this.logger.debug(`Request ${request.id} is already being processed`);
      return of(null);
    }

    this.processingQueue.set(request.id, request);
    this.logger.debug(`Processing request ${request.id} with priority ${request.priority}`);

    // Check if dependencies are loaded
    const unloadedDeps = request.dependencies.filter(dep => !this.resultCache.has(dep));
    if (unloadedDeps.length > 0) {
      this.logger.debug(`Waiting for dependencies to load: ${unloadedDeps.join(', ')}`);

      // Wait for dependencies to load
      return from(
        Promise.all(unloadedDeps.map(dep => {
          return new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
              if (this.resultCache.has(dep)) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 50);
          });
        }))
      ).pipe(
        mergeMap(() => this.executeLoader(request))
      );
    }

    return this.executeLoader(request);
  }

  private executeLoader<T>(request: LazyLoadRequest<T>): Observable<LazyLoadResult<T>> {
    return from(request.loader()).pipe(
      mergeMap(data => {
        const result: LazyLoadResult<T> = {
          id: request.id,
          data,
          loadedAt: Date.now(),
          expiresAt: request.ttl ? Date.now() + request.ttl * 1000 : undefined
        };

        // Cache the result
        this.resultCache.set(request.id, result);

        // Cache in Redis if TTL is specified
        if (request.ttl) {
          this.cacheService.set(request.id, result, request.ttl);
        }

        // Notify dependents
        this.notifyDependents(request.id);

        return of(result);
      }),
      catchError(error => {
        const result: LazyLoadResult<T> = {
          id: request.id,
          data: null,
          error,
          loadedAt: Date.now()
        };

        this.resultCache.set(request.id, result);
        this.logger.error(`Error loading data for ${request.id}`, error.stack);

        // Notify dependents even on error
        this.notifyDependents(request.id);

        throw error;
      }),
      tap(() => {
        this.processingQueue.delete(request.id);
      })
    );
  }

  private notifyDependents(key: string): void {
    if (this.reverseDependencyGraph.has(key)) {
      const dependents = this.reverseDependencyGraph.get(key);
      dependents.forEach(dependent => {
        this.logger.debug(`Notifying dependent ${dependent} that ${key} has loaded`);
        // In a real implementation, you might want to re-process the dependent
      });
    }
  }

  private handleResult<T>(result: LazyLoadResult<T>): void {
    if (!result) return;

    this.logger.debug(`Result received for ${result.id}`);

    // Emit event for external subscribers
    this.eventEmitter.emit('lazy-load.result', result);

    // Remove from processing queue if present
    this.processingQueue.delete(result.id);
  }

  async loadBatch<T>(
    loaders: (() => Promise<T>)[],
    options: {
      priority?: number;
      ttl?: number;
      batchKey?: string;
    } = {}
  ): Promise<T[]> {
    const { priority = 0, ttl = this.DEFAULT_TTL, batchKey = uuidv4() } = options;

    // Check cache first
    const cachedResults = await this.cacheService.get<LazyLoadResult<T>[]>(batchKey);
    if (cachedResults) {
      this.logger.debug(`Batch cache hit for key: ${batchKey}`);
      return cachedResults.map(result => result.data);
    }

    // Create individual requests
    const requests = loaders.map((loader, index) => ({
      id: `${batchKey}-${index}`,
      loader,
      priority,
      ttl,
      dependencies: [],
      timestamp: Date.now()
    }));

    // Add to queue
    this.requestQueue.push(...requests);

    // Sort queue
    this.requestQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    // Process requests
    const results = await Promise.all(
      requests.map(request => this.load(request.loader, {
        priority: request.priority,
        ttl: request.ttl,
        key: request.id
      }))
    );

    // Cache the batch results
    if (ttl) {
      const batchResults = results.map((data, index) => ({
        id: `${batchKey}-${index}`,
        data,
        loadedAt: Date.now(),
        expiresAt: Date.now() + ttl * 1000
      }));

      await this.cacheService.set(batchKey, batchResults, ttl);
    }

    return results;
  }

  getQueueStatus(): {
    queueLength: number;
    processingCount: number;
    cacheSize: number;
    priorityDistribution: Record<number, number>;
  } {
    const priorityDistribution: Record<number, number> = {};

    this.requestQueue.forEach(request => {
      priorityDistribution[request.priority] = (priorityDistribution[request.priority] || 0) + 1;
    });

    return {
      queueLength: this.requestQueue.length,
      processingCount: this.processingQueue.size,
      cacheSize: this.resultCache.size,
      priorityDistribution
    };
  }

  clearCache(key?: string): void {
    if (key) {
      this.resultCache.delete(key);
      this.cacheService.delete(key);
    } else {
      this.resultCache.clear();
      this.cacheService.flushAll();
    }
  }

  async preload<T>(
    key: string,
    loader: () => Promise<T>,
    options: {
      priority?: number;
      ttl?: number;
      dependencies?: string[];
    } = {}
  ): Promise<void> {
    const { priority = 0, ttl = this.DEFAULT_TTL, dependencies = [] } = options;

    // Check if already loaded
    const cachedResult = this.resultCache.get(key);
    if (cachedResult && (!cachedResult.expiresAt || cachedResult.expiresAt > Date.now())) {
      this.logger.debug(`Preload skipped - already loaded: ${key}`);
      return;
    }

    // Check Redis cache
    const redisCached = await this.cacheService.get<LazyLoadResult<T>>(key);
    if (redisCached) {
      this.resultCache.set(key, redisCached);
      this.logger.debug(`Preload skipped - in Redis cache: ${key}`);
      return;
    }

    // Create and process the request
    const request: LazyLoadRequest<T> = {
      id: key,
      loader,
      priority,
      ttl,
      dependencies,
      timestamp: Date.now()
    };

    this.addDependencies(key, dependencies);
    this.requestSubject.next(request);
    this.logger.debug(`Preload initiated for: ${key}`);
  }

  async getCacheStats(): Promise<{
    memoryUsage: number;
    cacheHitRate: number;
    averageLoadTime: number;
  }> {
    // In a real implementation, you would track these metrics
    // This is a simplified version
    const cacheSize = this.resultCache.size;
    const memoryUsage = cacheSize * 1024; // Approximate 1KB per item

    // These would be tracked in a real implementation
    const cacheHitRate = 0.85; // 85% hit rate
    const averageLoadTime = 150; // 150ms average

    return {
      memoryUsage,
      cacheHitRate,
      averageLoadTime
    };
  }
}
```

### Request Debouncing

```typescript
// debounce.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, filter } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

interface DebouncedRequest<T> {
  id: string;
  key: string;
  request: T;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  subscription?: Subscription;
}

@Injectable()
export class DebounceService {
  private readonly logger = new Logger(DebounceService.name);
  private readonly requestStreams = new Map<string, Subject<any>>();
  private readonly pendingRequests = new Map<string, DebouncedRequest<any>>();
  private readonly defaultDebounceTimes: Record<string, number> = {
    'anomaly-search': 300,
    'anomaly-filter': 250,
    'dashboard-update': 500,
    'notification-preferences': 1000,
    'user-preferences': 1000,
    'default': 300
  };

  debounce<T, R>(
    key: string,
    request: T,
    options: {
      debounceTime?: number;
      distinctUntilChanged?: boolean;
      transform?: (value: T) => any;
    } = {}
  ): Promise<R> {
    const {
      debounceTime = this.defaultDebounceTimes[key] || this.defaultDebounceTimes.default,
      distinctUntilChanged = true,
      transform = (value: T) => value
    } = options;

    return new Promise<R>((resolve, reject) => {
      // Create a unique ID for this request
      const requestId = uuidv4();

      // Check if there's an existing request with the same key
      if (this.pendingRequests.has(key)) {
        const existingRequest = this.pendingRequests.get(key);
        if (existingRequest) {
          // Cancel the existing request
          existingRequest.subscription?.unsubscribe();
          existingRequest.reject(new Error('Request superseded by newer request'));
          this.pendingRequests.delete(key);
        }
      }

      // Create a new request
      const debouncedRequest: DebouncedRequest<T> = {
        id: requestId,
        key,
        request,
        timestamp: Date.now(),
        resolve,
        reject
      };

      this.pendingRequests.set(key, debouncedRequest);

      // Get or create the subject for this key
      if (!this.requestStreams.has(key)) {
        this.requestStreams.set(key, new Subject<any>());
      }

      const subject = this.requestStreams.get(key);

      // Apply debounce and other operators
      const subscription = subject.pipe(
        debounceTime(debounceTime),
        distinctUntilChanged((prev, curr) => {
          if (!distinctUntilChanged) return false;
          return JSON.stringify(transform(prev)) === JSON.stringify(transform(curr));
        }),
        map(transform)
      ).subscribe({
        next: (value) => {
          this.handleRequestSuccess(key, value);
        },
        error: (err) => {
          this.handleRequestError(key, err);
        }
      });

      debouncedRequest.subscription = subscription;

      // Emit the request
      subject.next(request);
    });
  }

  private handleRequestSuccess(key: string, result: any): void {
    const request = this.pendingRequests.get(key);
    if (request) {
      this.logger.debug(`Debounced request succeeded for key: ${key}`);
      request.resolve(result);
      this.cleanupRequest(key);
    }
  }

  private handleRequestError(key: string, error: any): void {
    const request = this.pendingRequests.get(key);
    if (request) {
      this.logger.error(`Debounced request failed for key: ${key}`, error.stack);
      request.reject(error);
      this.cleanupRequest(key);
    }
  }

  private cleanupRequest(key: string): void {
    const request = this.pendingRequests.get(key);
    if (request) {
      request.subscription?.unsubscribe();
      this.pendingRequests.delete(key);
    }

    // Clean up the subject if no more requests
    if (this.pendingRequests.size === 0) {
      this.requestStreams.get(key)?.complete();
      this.requestStreams.delete(key);
    }
  }

  getDebounceStatus(): {
    activeRequests: number;
    activeStreams: number;
    requestKeys: string[];
  } {
    return {
      activeRequests: this.pendingRequests.size,
      activeStreams: this.requestStreams.size,
      requestKeys: Array.from(this.pendingRequests.keys())
    };
  }

  setDefaultDebounceTime(key: string, time: number): void {
    this.defaultDebounceTimes[key] = time;
    this.logger.log(`Updated default debounce time for ${key} to ${time}ms`);
  }

  clearAll(): void {
    this.pendingRequests.forEach((request, key) => {
      request.reject(new Error('Debounce service cleared'));
      this.cleanupRequest(key);
    });

    this.requestStreams.forEach((subject, key) => {
      subject.complete();
    });

    this.requestStreams.clear();
    this.pendingRequests.clear();
    this.logger.log('Cleared all debounced requests');
  }

  async debounceBatch<T, R>(
    key: string,
    requests: T[],
    options: {
      debounceTime?: number;
      batchSize?: number;
      transform?: (value: T[]) => any;
    } = {}
  ): Promise<R[]> {
    const {
      debounceTime = this.defaultDebounceTimes[key] || this.defaultDebounceTimes.default,
      batchSize = 10,
      transform = (values: T[]) => values
    } = options;

    if (requests.length === 0) {
      return [];
    }

    // Process requests in batches
    const batches = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }

    const results: R[] = [];

    for (const batch of batches) {
      const result = await this.debounce<T[], R>(
        `${key}-batch`,
        batch,
        {
          debounceTime,
          transform
        }
      );
      results.push(result);
    }

    return results;
  }

  createDebouncedObservable<T, R>(
    key: string,
    options: {
      debounceTime?: number;
      distinctUntilChanged?: boolean;
      transform?: (value: T) => any;
    } = {}
  ): {
    next: (value: T) => void;
    observable: Observable<R>;
    complete: () => void;
  } {
    const {
      debounceTime = this.defaultDebounceTimes[key] || this.defaultDebounceTimes.default,
      distinctUntilChanged = true,
      transform = (value: T) => value
    } = options;

    const subject = new Subject<T>();

    const observable = subject.pipe(
      debounceTime(debounceTime),
      distinctUntilChanged((prev, curr) => {
        if (!distinctUntilChanged) return false;
        return JSON.stringify(transform(prev)) === JSON.stringify(transform(curr));
      }),
      map(transform)
    );

    return {
      next: (value: T) => subject.next(value),
      observable,
      complete: () => subject.complete()
    };
  }

  async withDebounce<T, R>(
    key: string,
    fn: () => Promise<T>,
    options: {
      debounceTime?: number;
      onSuccess?: (result: T) => R;
      onError?: (error: any) => R;
    } = {}
  ): Promise<R> {
    const {
      debounceTime = this.defaultDebounceTimes[key] || this.defaultDebounceTimes.default,
      onSuccess = (result: T) => result as unknown as R,
      onError = (error: any) => { throw error; }
    } = options;

    try {
      const result = await this.debounce<T, T>(key, fn(), { debounceTime });
      return onSuccess(result);
    } catch (error) {
      return onError(error);
    }
  }
}
```

### Connection Pooling

```typescript
// connection-pool.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import { Redis } from 'ioredis';
import { createPool, Pool as GenericPool, Options as GenericPoolOptions } from 'generic-pool';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { setTimeout } from 'timers/promises';

interface ConnectionPoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  maxConnections: number;
  connectionTimeouts: number;
  connectionErrors: number;
  averageWaitTime: number;
  averageUsageTime: number;
}

interface ConnectionPoolConfig {
  name: string;
  type: 'postgres' | 'redis';
  config: PoolConfig | any;
  poolOptions?: GenericPoolOptions;
}

@Injectable()
export class ConnectionPoolService implements OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private readonly pools = new Map<string, GenericPool<PoolClient | Redis>>();
  private readonly metrics = new Map<string, ConnectionPoolMetrics>();
  private readonly defaultPoolOptions: GenericPoolOptions = {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    evictionRunIntervalMillis: 10000,
    numTestsPerEvictionRun: 3,
    softIdleTimeoutMillis: 10000,
    testOnBorrow: true,
    testOnReturn: true,
    testWhileIdle: true
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // Initialize default connection pools
    this.initializeDefaultPools();

    // Set up metrics collection
    this.setupMetricsCollection();
  }

  private initializeDefaultPools(): void {
    // PostgreSQL pool
    const postgresConfig: ConnectionPoolConfig = {
      name: 'postgres',
      type: 'postgres',
      config: {
        host: this.configService.get<string>('DB_HOST', 'localhost'),
        port: this.configService.get<number>('DB_PORT', 5432),
        user: this.configService.get<string>('DB_USERNAME', 'postgres'),
        password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
        database: this.configService.get<string>('DB_NAME', 'anomaly_detection'),
        ssl: this.configService.get<boolean>('DB_SSL', false)
      },
      poolOptions: {
        ...this.defaultPoolOptions,
        max: this.configService.get<number>('DB_POOL_MAX', 20)
      }
    };

    // Redis pool
    const redisConfig: ConnectionPoolConfig = {
      name: 'redis',
      type: 'redis',
      config: {
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD', ''),
        db: this.configService.get<number>('REDIS_DB', 0),
        tls: this.configService.get<boolean>('REDIS_TLS', false)
      },
      poolOptions: {
        ...this.defaultPoolOptions,
        max: this.configService.get<number>('REDIS_POOL_MAX', 15)
      }
    };

    this.createPool(postgresConfig);
    this.createPool(redisConfig);
  }

  private setupMetricsCollection(): void {
    // Initialize metrics for each pool
    this.pools.forEach((_, name) => {
      this.metrics.set(name, {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        maxConnections: 0,
        connectionTimeouts: 0,
        connectionErrors: 0,
        averageWaitTime: 0,
        averageUsageTime: 0
      });
    });

    // Update metrics every 5 seconds
    setInterval(() => {
      this.pools.forEach((pool, name) => {
        const poolMetrics = pool.getPoolStats();
        const metrics = this.metrics.get(name);

        if (metrics) {
          metrics.activeConnections = poolMetrics.acquired;
          metrics.idleConnections = poolMetrics.idle;
          metrics.waitingClients = poolMetrics.pending;
          metrics.maxConnections = poolMetrics.max;
          metrics.totalConnections = poolMetrics.size;

          this.metrics.set(name, metrics);
        }
      });
    }, 5000);
  }

  createPool(config: ConnectionPoolConfig): void {
    if (this.pools.has(config.name)) {
      this.logger.warn(`Pool with name ${config.name} already exists`);
      return;
    }

    let factory: GenericPool.Factory<PoolClient | Redis>;

    if (config.type === 'postgres') {
      const pgPool = new Pool(config.config);

      factory = {
        create: async () => {
          const startTime = Date.now();
          try {
            const client = await pgPool.connect();
            const endTime = Date.now();
            this.updateMetrics(config.name, 'create', endTime - startTime);
            return client;
          } catch (err) {
            this.updateMetrics(config.name, 'error');
            this.logger.error(`Error creating PostgreSQL connection for pool ${config.name}`, err.stack);
            throw err;
          }
        },
        destroy: async (client: PoolClient) => {
          try {
            client.release();
            this.updateMetrics(config.name, 'destroy');
          } catch (err) {
            this.logger.error(`Error destroying PostgreSQL connection for pool ${config.name}`, err.stack);
          }
        },
        validate: async (client: PoolClient) => {
          try {
            // Simple query to validate connection
            await client.query('SELECT 1');
            return true;
          } catch (err) {
            this.logger.error(`Connection validation failed for pool ${config.name}`, err.stack);
            return false;
          }
        }
      };
    } else if (config.type === 'redis') {
      factory = {
        create: async () => {
          const startTime = Date.now();
          try {
            const redis = new Redis(config.config);
            const endTime = Date.now();
            this.updateMetrics(config.name, 'create', endTime - startTime);

            // Set up event listeners
            redis.on('error', (err) => {
              this.logger.error(`Redis connection error for pool ${config.name}`, err.stack);
              this.updateMetrics(config.name, 'error');
            });

            return redis;
          } catch (err) {
            this.updateMetrics(config.name, 'error');
            this.logger.error(`Error creating Redis connection for pool ${config.name}`, err.stack);
            throw err;
          }
        },
        destroy: async (redis: Redis) => {
          try {
            await redis.quit();
            this.updateMetrics(config.name, 'destroy');
          } catch (err) {
            this.logger.error(`Error destroying Redis connection for pool ${config.name}`, err.stack);
          }
        },
        validate: async (redis: Redis) => {
          try {
            await redis.ping();
            return true;
          } catch (err) {
            this.logger.error(`Connection validation failed for pool ${config.name}`, err.stack);
            return false;
          }
        }
      };
    } else {
      throw new Error(`Unsupported pool type: ${config.type}`);
    }

    const pool = createPool(factory, {
      ...this.defaultPoolOptions,
      ...config.poolOptions
    });

    // Set up pool event listeners
    pool.on('factoryCreateError', (err) => {
      this.logger.error(`Factory create error for pool ${config.name}`, err.stack);
      this.updateMetrics(config.name, 'error');
    });

    pool.on('factoryDestroyError', (err) => {
      this.logger.error(`Factory destroy error for pool ${config.name}`, err.stack);
    });

    this.pools.set(config.name, pool);
    this.metrics.set(config.name, {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      maxConnections: config.poolOptions?.max || this.defaultPoolOptions.max || 10,
      connectionTimeouts: 0,
      connectionErrors: 0,
      averageWaitTime: 0,
      averageUsageTime: 0
    });

    this.logger.log(`Created connection pool: ${config.name} (type: ${config.type})`);
  }

  private updateMetrics(
    poolName: string,
    event: 'create' | 'destroy' | 'acquire' | 'release' | 'timeout' | 'error',
    duration?: number
  ): void {
    const metrics = this.metrics.get(poolName);
    if (!metrics) return;

    switch (event) {
      case 'create':
        metrics.totalConnections++;
        break;
      case 'destroy':
        metrics.totalConnections--;
        break;
      case 'acquire':
        metrics.activeConnections++;
        metrics.idleConnections--;
        if (duration) {
          metrics.averageWaitTime =
            (metrics.averageWaitTime * (metrics.totalConnections - 1) + duration) /
            metrics.totalConnections;
        }
        break;
      case 'release':
        metrics.activeConnections--;
        metrics.idleConnections++;
        if (duration) {
          metrics.averageUsageTime =
            (metrics.averageUsageTime * (metrics.totalConnections - 1) + duration) /
            metrics.totalConnections;
        }
        break;
      case 'timeout':
        metrics.connectionTimeouts++;
        break;
      case 'error':
        metrics.connectionErrors++;
        break;
    }

    this.metrics.set(poolName, metrics);
    this.eventEmitter.emit('connection-pool.metrics', { poolName, metrics });
  }

  async getConnection<T extends PoolClient | Redis>(poolName: string): Promise<T> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    const startTime = Date.now();
    try {
      const connection = await pool.acquire();
      const endTime = Date.now();
      this.updateMetrics(poolName, 'acquire', endTime - startTime);
      return connection as T;
    } catch (err) {
      this.updateMetrics(poolName, 'error');
      this.logger.error(`Error acquiring connection from pool ${poolName}`, err.stack);
      throw err;
    }
  }

  async releaseConnection<T extends PoolClient | Redis>(poolName: string, connection: T): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      this.logger.warn(`Pool ${poolName} not found when releasing connection`);
      return;
    }

    try {
      await pool.release(connection);
      this.updateMetrics(poolName, 'release');
    } catch (err) {
      this.logger.error(`Error releasing connection to pool ${poolName}`, err.stack);
    }
  }

  async withConnection<T, R>(
    poolName: string,
    fn: (connection: T) => Promise<R>,
    options: {
      retryCount?: number;
      retryDelay?: number;
    } = {}
  ): Promise<R> {
    const { retryCount = 3, retryDelay = 100 } = options;
    let lastError: Error;

    for (let i = 0; i < retryCount; i++) {
      let connection: T | null = null;
      try {
        connection = await this.getConnection<T>(poolName);
        const result = await fn(connection);
        await this.releaseConnection(poolName, connection);
        return result;
      } catch (err) {
        lastError = err;
        this.logger.error(`Error in withConnection (attempt ${i + 1}/${retryCount})`, err.stack);

        if (connection) {
          try {
            await this.releaseConnection(poolName, connection);
          } catch (releaseErr) {
            this.logger.error('Error releasing connection after failure', releaseErr.stack);
          }
        }

        if (i < retryCount - 1) {
          await setTimeout(retryDelay);
        }
      }
    }

    throw lastError || new Error('Unknown error in withConnection');
  }

  async query<T>(poolName: string, query: string, params?: any[]): Promise<QueryResult<T>> {
    if (this.pools.get(poolName)?.getPoolStats().type === 'redis') {
      throw new Error('Query method is only for PostgreSQL pools');
    }

    return this.withConnection<PoolClient, QueryResult<T>>(poolName, async (client) => {
      return client.query(query, params);
    });
  }

  async execute<T>(poolName: string, command: string, ...args: any[]): Promise<T> {
    if (this.pools.get(poolName)?.getPoolStats().type !== 'redis') {
      throw new Error('Execute method is only for Redis pools');
    }

    return this.withConnection<Redis, T>(poolName, async (redis) => {
      return redis.call(command, ...args) as Promise<T>;
    });
  }

  getPoolMetrics(poolName: string): ConnectionPoolMetrics {
    const metrics = this.metrics.get(poolName);
    if (!metrics) {
      throw new Error(`Pool ${poolName} not found`);
    }
    return { ...metrics };
  }

  getAllPoolMetrics(): Record<string, ConnectionPoolMetrics> {
    const result: Record<string, ConnectionPoolMetrics> = {};
    this.metrics.forEach((metrics, name) => {
      result[name] = { ...metrics };
    });
    return result;
  }

  async resizePool(poolName: string, min: number, max: number): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    try {
      await pool.resize({ min, max });
      const metrics = this.metrics.get(poolName);
      if (metrics) {
        metrics.maxConnections = max;
        this.metrics.set(poolName, metrics);
      }
      this.logger.log(`Resized pool ${poolName} to min: ${min}, max: ${max}`);
    } catch (err) {
      this.logger.error(`Error resizing pool ${poolName}`, err.stack);
      throw err;
    }
  }

  async drainPool(poolName: string): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    try {
      await pool.drain();
      this.logger.log(`Drained pool ${poolName}`);
    } catch (err) {
      this.logger.error(`Error draining pool ${poolName}`, err.stack);
      throw err;
    }
  }

  async clearPool(poolName: string): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    try {
      await pool.clear();
      this.logger.log(`Cleared pool ${poolName}`);
    } catch (err) {
      this.logger.error(`Error clearing pool ${poolName}`, err.stack);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down connection pools...');

    const shutdownPromises = Array.from(this.pools.entries()).map(async ([name, pool]) => {
      try {
        await pool.drain();
        await pool.clear();
        this.logger.log(`Successfully shut down pool: ${name}`);
      } catch (err) {
        this.logger.error(`Error shutting down pool ${name}`, err.stack);
      }
    });

    await Promise.all(shutdownPromises);
    this.logger.log('All connection pools shut down');
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, pool] of this.pools.entries()) {
      try {
        const connection = await pool.acquire();
        if (pool.getPoolStats().type === 'postgres') {
          await (connection as PoolClient).query('SELECT 1');
        } else {
          await (connection as Redis).ping();
        }
        await pool.release(connection);
        results[name] = true;
      } catch (err) {
        this.logger.error(`Health check failed for pool ${name}`, err.stack);
        results[name] = false;
      }
    }

    return results;
  }

  async getPoolStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const [name, pool] of this.pools.entries()) {
      stats[name] = pool.getPoolStats();
    }

    return stats;
  }

  async executeInTransaction<T>(
    poolName: string,
    fn: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    if (this.pools.get(poolName)?.getPoolStats().type !== 'postgres') {
      throw new Error('Transactions are only supported for PostgreSQL pools');
    }

    return this.withConnection<PoolClient, T>(poolName, async (client) => {
      try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        this.logger.error('Transaction rolled back due to error', err.stack);
        throw err;
      }
    });
  }

  async executeBatch<T>(
    poolName: string,
    queries: { text: string; values?: any[] }[]
  ): Promise<QueryResult<T>[]> {
    if (this.pools.get(poolName)?.getPoolStats().type !== 'postgres') {
      throw new Error('Batch execution is only for PostgreSQL pools');
    }

    return this.withConnection<PoolClient, QueryResult<T>[]>(poolName, async (client) => {
      const results: QueryResult<T>[] = [];

      for (const query of queries) {
        const result = await client.query(query.text, query.values);
        results.push(result);
      }

      return results;
    });
  }
}
```

## Real-Time Features (300+ lines)

### WebSocket Server Setup

```typescript
// websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsExceptionFilter } from './filters/ws-exception.filter';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { RedisCacheService } from '../redis-cache/redis-cache.service';
import { ConnectionPoolService } from '../connection-pool/connection-pool.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';

interface WebSocketClient {
  socket: Socket;
  userId: string;
  roles: string[];
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
  ipAddress: string;
  userAgent: string;
  rateLimiter: RateLimiterMemory;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6, // 1MB
  path: '/ws-anomaly-detection'
})
@UseFilters(new WsExceptionFilter())
@UseGuards(WsAuthGuard)
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly clients = new Map<string, WebSocketClient>();
  private readonly rooms = new Map<string, Set<string>>();
  private readonly userToSocket = new Map<string, Set<string>>();
  private readonly messageQueue = new Map<string, any[]>();
  private readonly rateLimiter: RateLimiterMemory;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly cacheService: RedisCacheService,
    private readonly connectionPool: ConnectionPoolService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // Initialize rate limiter
    this.rateLimiter = new RateLimiterMemory({
      points: this.configService.get<number>('WS_RATE_LIMIT_POINTS', 100),
      duration: this.configService.get<number>('WS_RATE_LIMIT_DURATION', 60)
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.server = server;

    // Set up server-level middleware
    this.server.use(async (socket: Socket, next) => {
      try {
        // Extract and validate JWT from handshake
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
          return next(new Error('Authentication token missing'));
        }

        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET')
        });

        // Attach user info to socket
        socket.data.user = {
          id: payload.sub,
          roles: payload.roles || [],
          token
        };

        // Store IP address and user agent
        socket.data.ipAddress = socket.handshake.address;
        socket.data.userAgent = socket.handshake.headers['user-agent'];

        next();
      } catch (err) {
        this.logger.error('WebSocket authentication failed', err.stack);
        next(new Error('Authentication failed'));
      }
    });

    // Set up periodic cleanup
    this.setupCleanupInterval();
  }

  async handleConnection(socket: Socket) {
    const clientId = socket.id;
    const userId = socket.data.user?.id;
    const roles = socket.data.user?.roles || [];
    const ipAddress = socket.data.ipAddress;
    const userAgent = socket.data.userAgent;

    // Create rate limiter for this client
    const clientRateLimiter = new RateLimiterMemory({
      points: this.configService.get<number>('WS_CLIENT_RATE_LIMIT_POINTS', 30),
      duration: this.configService.get<number>('WS_CLIENT_RATE_LIMIT_DURATION', 10)
    });

    // Create client record
    const client: WebSocketClient = {
      socket,
      userId,
      roles,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set(),
      ipAddress,
      userAgent,
      rateLimiter: clientRateLimiter
    };

    // Store client
    this.clients.set(clientId, client);

    // Track user to socket mapping
    if (!this.userToSocket.has(userId)) {
      this.userToSocket.set(userId, new Set());
    }
    this.userToSocket.get(userId).add(clientId);

    this.logger.log(`Client connected: ${clientId} (User: ${userId})`);

    // Send welcome message
    socket.emit('connected', {
      clientId,
      timestamp: new Date().toISOString(),
      serverVersion: this.configService.get<string>('APP_VERSION', '1.0.0'),
      supportedEvents: this.getSupportedEvents()
    });

    // Process any queued messages
    await this.processQueuedMessages(clientId);

    // Emit connection event
    this.eventEmitter.emit('websocket.connection', {
      clientId,
      userId,
      roles,
      ipAddress,
      userAgent
    });
  }

  async handleDisconnect(socket: Socket) {
    const clientId = socket.id;
    const client = this.clients.get(clientId);

    if (client) {
      const userId = client.userId;

      // Remove from user to socket mapping
      if (this.userToSocket.has(userId)) {
        this.userToSocket.get(userId).delete(clientId);
        if (this.userToSocket.get(userId).size === 0) {
          this.userToSocket.delete(userId);
        }
      }

      // Remove from all rooms
      for (const room of client.subscriptions) {
        await this.leaveRoom(clientId, room);
      }

      // Remove client
      this.clients.delete(clientId);

      this.logger.log(`Client disconnected: ${clientId} (User: ${userId})`);

      // Emit disconnection event
      this.eventEmitter.emit('websocket.disconnection', {
        clientId,
        userId,
        connectedAt: client.connectedAt,
        disconnectedAt: new Date()
      });
    }
  }

  private setupEventListeners() {
    // Listen for anomaly detection events
    this.eventEmitter.on('anomaly.detected', (anomaly) => {
      this.broadcastAnomalyDetection(anomaly);
    });

    this.eventEmitter.on('anomaly.updated', (anomaly) => {
      this.broadcastAnomalyUpdate(anomaly);
    });

    this.eventEmitter.on('anomaly.resolved', (anomaly) => {
      this.broadcastAnomalyResolution(anomaly);
    });

    this.eventEmitter.on('system.alert', (alert) => {
      this.broadcastSystemAlert(alert);
    });

    // Listen for client activity
    this.eventEmitter.on('websocket.activity', ({ clientId }) => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastActivity = new Date();
      }
    });
  }

  private setupCleanupInterval() {
    // Clean up inactive clients every 5 minutes
    setInterval(() => {
      const now = new Date();
      const inactiveThreshold = this.configService.get<number>('WS_INACTIVE_THRESHOLD', 30 * 60 * 1000); // 30 minutes

      this.clients.forEach((client, clientId) => {
        if (now.getTime() - client.lastActivity.getTime() > inactiveThreshold) {
          this.logger.log(`Disconnecting inactive client: ${clientId}`);
          client.socket.disconnect(true);
        }
      });
    }, 5 * 60 * 1000);
  }

  private getSupportedEvents(): string[] {
    return [
      'anomaly.detected',
      'anomaly.updated',
      'anomaly.resolved',
      'anomaly.assigned',
      'anomaly.commented',
      'system.alert',
      'system.maintenance',
      'user.notification',
      'dashboard.update',
      'realtime.stats'
    ];
  }

  private async processQueuedMessages(clientId: string) {
    if (this.messageQueue.has(clientId)) {
      const messages = this.messageQueue.get(clientId);
      const client = this.clients.get(clientId);

      if (client) {
        for (const message of messages) {
          try {
            await this.sendMessageToClient(client, message.event, message.data);
          } catch (err) {
            this.logger.error(`Error sending queued message to ${clientId}`, err.stack);
          }
        }
      }

      this.messageQueue.delete(clientId);
    }
  }

  private async sendMessageToClient(client: WebSocketClient, event: string, data: any): Promise<boolean> {
    try {
      // Check rate limiting
      try {
        await client.rateLimiter.consume(client.socket.id);
      } catch (rateLimitError) {
        this.logger.warn(`Rate limit exceeded for client ${client.socket.id}`);
        client.socket.emit('rate.limit.exceeded', {
          event,
          message: 'Too many requests, please slow down'
        });
        return false;
      }

      // Check if client is still connected
      if (!client.socket.connected) {
        this.logger.warn(`Attempted to send message to disconnected client: ${client.socket.id}`);
        return false;
      }

      // Send the message
      client.socket.emit(event, data);
      client.lastActivity = new Date();

      // Emit activity event
      this.eventEmitter.emit('websocket.activity', { clientId: client.socket.id });

      return true;
    } catch (err) {
      this.logger.error(`Error sending message to client ${client.socket.id}`, err.stack);
      return false;
    }
  }

  async broadcastToRoom(room: string, event: string, data: any, options: { exclude?: string[] } = {}): Promise<number> {
    const { exclude = [] } = options;
    let sentCount = 0;

    if (this.rooms.has(room)) {
      const clientIds = this.rooms.get(room);

      for (const clientId of clientIds) {
        if (exclude.includes(clientId)) continue;

        const client = this.clients.get(clientId);
        if (client) {
          const success = await this.sendMessageToClient(client, event, data);
          if (success) sentCount++;
        }
      }
    }

    return sentCount;
  }

  async broadcastToUser(userId: string, event: string, data: any): Promise<number> {
    let sentCount = 0;

    if (this.userToSocket.has(userId)) {
      const clientIds = this.userToSocket.get(userId);

      for (const clientId of clientIds) {
        const client = this.clients.get(clientId);
        if (client) {
          const success = await this.sendMessageToClient(client, event, data);
          if (success) sentCount++;
        }
      }
    }

    return sentCount;
  }

  async broadcastToAll(event: string, data: any, options: { exclude?: string[] } = {}): Promise<number> {
    const { exclude = [] } = options;
    let sentCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (exclude.includes(clientId)) continue;

      const success = await this.sendMessageToClient(client, event, data);
      if (success) sentCount++;
    }

    return sentCount;
  }

  async joinRoom(clientId: string, room: string): Promise<boolean> {
    const client = this.clients.get(clientId);
    if (!client) {
      this.logger.warn(`Client ${clientId} not found when attempting to join room ${room}`);
      return false;
    }

    // Check if client is already in the room
    if (client.subscriptions.has(room)) {
      this.logger.debug(`Client ${clientId} is already in room ${room}`);
      return true;
    }

    // Add to room
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room).add(clientId);
    client.subscriptions.add(room);

    this.logger.log(`Client ${clientId} joined room ${room}`);

    // Send confirmation
    client.socket.emit('room.joined', {
      room,
      timestamp: new Date().toISOString()
    });

    // Emit event
    this.eventEmitter.emit('websocket.room.joined', {
      clientId,
      room,
      userId: client.userId
    });

    return true;
  }

  async leaveRoom(clientId: string, room: string): Promise<boolean> {
    const client = this.clients.get(clientId);
    if (!client) {
      this.logger.warn(`Client ${clientId} not found when attempting to leave room ${room}`);
      return false;
    }

    // Check if client is in the room
    if (!client.subscriptions.has(room)) {
      this.logger.debug(`Client ${clientId} is not in room ${room}`);
      return true;
    }

    // Remove from room
    if (this.rooms.has(room)) {
      this.rooms.get(room).delete(clientId);
      if (this.rooms.get(room).size === 0) {
        this.rooms.delete(room);
      }
    }
    client.subscriptions.delete(room);

    this.logger.log(`Client ${clientId} left room ${room}`);

    // Send confirmation
    client.socket.emit('room.left', {
      room,
      timestamp: new Date().toISOString()
    });

    // Emit event
    this.eventEmitter.emit('websocket.room.left', {
      clientId,
      room,
      userId: client.userId
    });

    return true;
  }

  async getRoomClients(room: string): Promise<string[]> {
    if (this.rooms.has(room)) {
      return Array.from(this.rooms.get(room));
    }
    return [];
  }

  async getUserClients(userId: string): Promise<string[]> {
    if (this.userToSocket.has(userId)) {
      return Array.from(this.userToSocket.get(userId));
    }
    return [];
  }

  async getClientInfo(clientId: string): Promise<WebSocketClient | null> {
    return this.clients.get(clientId) || null;
  }

  async getConnectionStats(): Promise<{
    totalClients: number;
    activeRooms: number;
    usersConnected: number;
    messagesSent: number;
    averageConnectionTime: number;
  }> {
    const now = new Date();
    let totalConnectionTime = 0;

    this.clients.forEach(client => {
      totalConnectionTime += now.getTime() - client.connectedAt.getTime();
    });

    const averageConnectionTime = this.clients.size > 0
      ? totalConnectionTime / this.clients.size / 1000 // in seconds
      : 0;

    return {
      totalClients: this.clients.size,
      activeRooms: this.rooms.size,
      usersConnected: this.userToSocket.size,
      messagesSent: 0, // Would be tracked in a real implementation
      averageConnectionTime
    };
  }

  private async broadcastAnomalyDetection(anomaly: any) {
    const room = `anomalies:${anomaly.severity.toLowerCase()}`;
    const sentCount = await this.broadcastToRoom(room, 'anomaly.detected', anomaly);

    this.logger.debug(`Broadcast anomaly detection to ${sentCount} clients in room ${room}`);

    // Also send to user-specific rooms if assigned
    if (anomaly.assignedUserId) {
      const userRoom = `user:${anomaly.assignedUserId}`;
      const userSentCount = await this.broadcastToRoom(userRoom, 'anomaly.detected', anomaly);
      this.logger.debug(`Broadcast anomaly detection to ${userSentCount} clients for user ${anomaly.assignedUserId}`);
    }
  }

  private async broadcastAnomalyUpdate(anomaly: any) {
    const room = `anomaly:${anomaly.id}`;
    const sentCount = await this.broadcastToRoom(room, 'anomaly.updated', anomaly);

    this.logger.debug(`Broadcast anomaly update to ${sentCount} clients in room ${room}`);

    // Also send to severity room
    const severityRoom = `anomalies:${anomaly.severity.toLowerCase()}`;
    await this.broadcastToRoom(severityRoom, 'anomaly.updated', anomaly);
  }

  private async broadcastAnomalyResolution(anomaly: any) {
    const room = `anomaly:${anomaly.id}`;
    const sentCount = await this.broadcastToRoom(room, 'anomaly.resolved', anomaly);

    this.logger.debug(`Broadcast anomaly resolution to ${sentCount} clients in room ${room}`);

    // Also send to severity room
    const severityRoom = `anomalies:${anomaly.severity.toLowerCase()}`;
    await this.broadcastToRoom(severityRoom, 'anomaly.resolved', anomaly);
  }

  private async broadcastSystemAlert(alert: any) {
    const sentCount = await this.broadcastToAll('system.alert', alert, {
      exclude: alert.excludeClients || []
    });

    this.logger.debug(`Broadcast system alert to ${sentCount} clients`);
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() socket: Socket
  ): Promise<{ success: boolean; message?: string }> {
    const clientId = socket.id;
    const client = this.clients.get(clientId);

    if (!client) {
      return { success: false, message: 'Client not found' };
    }

    try {
      for (const room of data.rooms) {
        await this.joinRoom(clientId, room);
      }

      return { success: true };
    } catch (err) {
      this.logger.error(`Error handling subscribe request from ${clientId}`, err.stack);
      return { success: false, message: err.message };
    }
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() socket: Socket
  ): Promise<{ success: boolean; message?: string }> {
    const clientId = socket.id;
    const client = this.clients.get(clientId);

    if (!client) {
      return { success: false, message: 'Client not found' };
    }

    try {
      for (const room of data.rooms) {
        await this.leaveRoom(clientId, room);
      }

      return { success: true };
    } catch (err) {
      this.logger.error(`Error handling unsubscribe request from ${clientId}`, err.stack);
      return { success: false, message: err.message };
    }
  }

  @SubscribeMessage('get.rooms')
  async handleGetRooms(
    @ConnectedSocket() socket: Socket
  ): Promise<{ rooms: string[] }> {
    const clientId = socket.id;
    const client = this.clients.get(clientId);

    if (!client) {
      return { rooms: [] };
    }

    return { rooms: Array.from(client.subscriptions) };
  }

  @SubscribeMessage('ping')
  async handlePing(
    @ConnectedSocket() socket: Socket
  ): Promise<{ timestamp: string; latency: number }> {
    const clientId = socket.id;
    const client = this.clients.get(clientId);

    if (client) {
      client.lastActivity = new Date();
      this.eventEmitter.emit('websocket.activity', { clientId });
    }

    return {
      timestamp: new Date().toISOString(),
      latency: 0 // Would be measured in a real implementation
    };
  }

  @SubscribeMessage('request.history')
  async handleRequestHistory(
    @MessageBody() data: { event: string; limit?: number },
    @ConnectedSocket() socket: Socket
  ): Promise<{ events: any[] }> {
    const { event, limit = 50 } = data;
    const clientId = socket.id;

    try {
      // In a real implementation, you would fetch from a database or cache
      // This is a simplified version
      const cacheKey = `ws:history:${event}`;
      const cachedEvents = await this.cacheService.get<any[]>(cacheKey);

      const events = cachedEvents
        ? cachedEvents.slice(0, limit)
        : [];

      return { events };
    } catch (err) {
      this.logger.error(`Error handling history request from ${clientId}`, err.stack);
      return { events: [] };
    }
  }

  async queueMessageForClient(clientId: string, event: string, data: any): Promise<void> {
    if (!this.messageQueue.has(clientId)) {
      this.messageQueue.set(clientId, []);
    }

    this.messageQueue.get(clientId).push({ event, data });
    this.logger.debug(`Queued message for client ${clientId}: ${event}`);
  }

  async getClientCount(): Promise<number> {
    return this.clients.size;
  }

  async getRoomCount(): Promise<number> {
    return this.rooms.size;
  }

  async getUserCount(): Promise<number> {
    return this.userToSocket.size;
  }

  async disconnectClient(clientId: string, reason?: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (client) {
      client.socket.disconnect(true);
      this.logger.log(`Disconnected client ${clientId}: ${reason || 'No reason provided'}`);
    }
  }

  async broadcastMaintenanceNotification(notification: {
    message: string;
    startTime: string;
    endTime: string;
    affectedServices: string[];
  }): Promise<number> {
    return this.broadcastToAll('system.maintenance', notification);
  }

  async broadcastUserNotification(userId: string, notification: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    data?: any;
  }): Promise<number> {
    return this.broadcastToUser(userId, 'user.notification', notification);
  }

  async broadcastDashboardUpdate(dashboardId: string, update: {
    type: string;
    data: any;
    timestamp: string;
  }): Promise<number> {
    const room = `dashboard:${dashboardId}`;
    return this.broadcastToRoom(room, 'dashboard.update', update);
  }

  async broadcastRealtimeStats(stats: {
    anomaliesDetected: number;
    anomaliesResolved: number;
    usersOnline: number;
    systemLoad: number;
    timestamp: string;
  }): Promise<number> {
    return this.broadcastToAll('realtime.stats', stats);
  }
}
```

### Real-Time Event Handlers

```typescript
// realtime-event.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AnomalyService } from '../anomaly/anomaly.service';
import { DetectionRuleService } from '../detection-rule/detection-rule.service';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';
import { SystemService } from '../system/system.service';
import { RedisCacheService } from '../redis-cache/redis-cache.service';
import { ConnectionPoolService } from '../connection-pool/connection-pool.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

interface AnomalyEvent {
  id: string;
  type: string;
  severity: string;
  source: string;
  description: string;
  detectedAt: string;
  score: number;
  status: string;
  assignedUserId?: string;
  metadata?: any;
}

interface SystemAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  affectedServices?: string[];
  metadata?: any;
}

@Injectable()
export class RealtimeEventService {
  private readonly logger = new Logger(RealtimeEventService.name);
  private readonly eventBuffer: AnomalyEvent[] = [];
  private readonly bufferFlushInterval: number;
  private readonly maxBufferSize: number;

  constructor(
    private readonly websocketGateway: WebsocketGateway,
    private readonly eventEmitter: EventEmitter2,
    private readonly anomalyService: AnomalyService,
    private readonly detectionRuleService: DetectionRuleService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly systemService: SystemService,
    private readonly cacheService: RedisCacheService,
    private readonly connectionPool: ConnectionPoolService,
    private readonly configService: ConfigService
  ) {
    this.bufferFlushInterval = this.configService.get<number>('EVENT_BUFFER_FLUSH_INTERVAL', 1000);
    this.maxBufferSize = this.configService.get<number>('EVENT_BUFFER_MAX_SIZE', 100);

    // Set up periodic buffer flushing
    this.setupBufferFlushing();
  }

  private setupBufferFlushing(): void {
    setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flushEventBuffer();
      }
    }, this.bufferFlushInterval);
  }

  @OnEvent('anomaly.detected', { async: true })
  async handleAnomalyDetected(anomaly: AnomalyEvent): Promise<void> {
    try {
      // Add to buffer
      this.eventBuffer.push(anomaly);

      // Check if buffer is full
      if (this.eventBuffer.length >= this.maxBufferSize) {
        await this.flushEventBuffer();
      }

      // Update real-time stats
      await this.updateRealtimeStats();

      // Send immediate notification for high-severity anomalies
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        await this.sendImmediateNotifications(anomaly);
      }

      this.logger.debug(`Anomaly detected event handled: ${anomaly.id}`);
    } catch (err) {
      this.logger.error(`Error handling anomaly detected event: ${anomaly.id}`, err.stack);
    }
  }

  @OnEvent('anomaly.updated', { async: true })
  async handleAnomalyUpdated(anomaly: AnomalyEvent): Promise<void> {
    try {
      // Broadcast update to all subscribed clients
      await this.websocketGateway.broadcastToRoom(`anomaly:${anomaly.id}`, 'anomaly.updated', anomaly);

      // If status changed, send appropriate notifications
      if (anomaly.status === 'resolved') {
        await this.handleAnomalyResolved(anomaly);
      } else if (anomaly.status === 'in_progress') {
        await this.sendAssignmentNotifications(anomaly);
      }

      // Update real-time stats
      await this.updateRealtimeStats();

      this.logger.debug(`Anomaly updated event handled: ${anomaly.id}`);
    } catch (err) {
      this.logger.error(`Error handling anomaly updated event: ${anomaly.id}`, err.stack);
    }
  }

  @OnEvent('anomaly.resolved', { async: true })
  async handleAnomalyResolved(anomaly: AnomalyEvent): Promise<void> {
    try {
      // Broadcast resolution to all subscribed clients
      await this.websocketGateway.broadcastToRoom(`anomaly:${anomaly.id}`, 'anomaly.resolved', anomaly);

      // Send resolution notifications
      await this.sendResolutionNotifications(anomaly);

      // Update real-time stats
      await this.updateRealtimeStats();

      this.logger.debug(`Anomaly resolved event handled: ${anomaly.id}`);
    } catch (err) {
      this.logger.error(`Error handling anomaly resolved event: ${anomaly.id}`, err.stack);
    }
  }

  @OnEvent('anomaly.commented', { async: true })
  async handleAnomalyCommented(payload: {
    anomalyId: string;
    commentId: string;
    userId: string;
    comment: string;
    timestamp: string;
  }): Promise<void> {
    try {
      // Get the anomaly details
      const anomaly = await this.anomalyService.getAnomalyById(payload.anomalyId);

      // Broadcast comment to all subscribed clients
      await this.websocketGateway.broadcastToRoom(
        `anomaly:${payload.anomalyId}`,
        'anomaly.commented',
        {
          anomalyId: payload.anomalyId,
          commentId: payload.commentId,
          userId: payload.userId,
          comment: payload.comment,
          timestamp: payload.timestamp,
          userName: await this.getUserName(payload.userId)
        }
      );

      // Send notifications to relevant users
      await this.sendCommentNotifications(anomaly, payload);

      this.logger.debug(`Anomaly commented event handled: ${payload.anomalyId}`);
    } catch (err) {
      this.logger.error(`Error handling anomaly commented event: ${payload.anomalyId}`, err.stack);
    }
  }

  @OnEvent('system.alert', { async: true })
  async handleSystemAlert(alert: SystemAlert): Promise<void> {
    try {
      // Broadcast system alert to all clients
      await this.websocketGateway.broadcastToAll('system.alert', alert);

      // Send notifications to admin users
      await this.sendSystemAlertNotifications(alert);

      this.logger.debug(`System alert event handled: ${alert.id}`);
    } catch (err) {
      this.logger.error(`Error handling system alert event: ${alert.id}`, err.stack);
    }
  }

  @OnEvent('user.online', { async: true })
  async handleUserOnline(payload: { userId: string; clientId: string }): Promise<void> {
    try {
      // Update user status
      await this.userService.updateUserStatus(payload.userId, 'online');

      // Broadcast to user's contacts
      await this.broadcastUserStatus(payload.userId, 'online');

      // Send welcome notification
      await this.websocketGateway.broadcastToUser(
        payload.userId,
        'user.welcome',
        {
          message: 'Welcome back! You are now online.',
          timestamp: new Date().toISOString(),
          unreadNotifications: await this.notificationService.getUnreadCount(payload.userId)
        }
      );

      this.logger.debug(`User online event handled: ${payload.userId}`);
    } catch (err) {
      this.logger.error(`Error handling user online event: ${payload.userId}`, err.stack);
    }
  }

  @OnEvent('user.offline', { async: true })
  async handleUserOffline(payload: { userId: string; clientId: string }): Promise<void> {
    try {
      // Check if user has any other active connections
      const activeClients = await this.websocketGateway.getUserClients(payload.userId);

      if (activeClients.length === 0) {
        // Update user status
        await this.userService.updateUserStatus(payload.userId, 'offline');

        // Broadcast to user's contacts
        await this.broadcastUserStatus(payload.userId, 'offline');
      }

      this.logger.debug(`User offline event handled: ${payload.userId}`);
    } catch (err) {
      this.logger.error(`Error handling user offline event: ${payload.userId}`, err.stack);
    }
  }

  @OnEvent('detection.rule.triggered', { async: true })
  async handleDetectionRuleTriggered(payload: {
    ruleId: string;
    anomalyId: string;
    timestamp: string;
    metadata: any;
  }): Promise<void> {
    try {
      // Get the detection rule details
      const rule = await this.detectionRuleService.getDetectionRuleById(payload.ruleId);

      // Broadcast to rule subscribers
      await this.websocketGateway.broadcastToRoom(
        `rule:${payload.ruleId}`,
        'detection.rule.triggered',
        {
          ruleId: payload.ruleId,
          ruleName: rule.name,
          anomalyId: payload.anomalyId,
          timestamp: payload.timestamp,
          metadata: payload.metadata
        }
      );

      // Send notifications to rule owners
      await this.sendRuleTriggeredNotifications(rule, payload.anomalyId);

      this.logger.debug(`Detection rule triggered event handled: ${payload.ruleId}`);
    } catch (err) {
      this.logger.error(`Error handling detection rule triggered event: ${payload.ruleId}`, err.stack);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleRealtimeStatsCron(): Promise<void> {
    try {
      await this.updateRealtimeStats();
    } catch (err) {
      this.logger.error('Error updating real-time stats', err.stack);
    }
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const eventsToProcess = [...this.eventBuffer];
      this.eventBuffer.length = 0;

      // Process events in parallel with limited concurrency
      const batchSize = this.configService.get<number>('EVENT_PROCESSING_BATCH_SIZE', 10);
      const batches = [];

      for (let i = 0; i < eventsToProcess.length; i += batchSize) {
        batches.push(eventsToProcess.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await Promise.all(batch.map(event => this.processBufferedEvent(event)));
      }

      this.logger.debug(`Flushed ${eventsToProcess.length} events from buffer`);
    } catch (err) {
      this.logger.error('Error flushing event buffer', err.stack);
    }
  }

  private async processBufferedEvent(event: AnomalyEvent): Promise<void> {
    try {
      // Broadcast to severity room
      await this.websocketGateway.broadcastToRoom(
        `anomalies:${event.severity.toLowerCase()}`,
        'anomaly.detected',
        event
      );

      // Broadcast to source room
      await this.websocketGateway.broadcastToRoom(
        `source:${event.source}`,
        'anomaly.detected',
        event
      );

      // Cache the event
      await this.cacheEvent(event);

      // Update detection rule statistics
      await this.updateDetectionRuleStats(event);
    } catch (err) {
      this.logger.error(`Error processing buffered event: ${event.id}`, err.stack);
    }
  }

  private async cacheEvent(event: AnomalyEvent): Promise<void> {
    try {
      const cacheKey = `anomaly:events:${event.id}`;
      await this.cacheService.set(cacheKey, event, 86400); // Cache for 24 hours

      // Also add to event history
      const historyKey = `anomaly:history:${event.severity.toLowerCase()}`;
      const history = await this.cacheService.get<AnomalyEvent[]>(historyKey) || [];
      history.unshift(event);

      // Keep only the last 1000 events
      if (history.length > 1000) {
        history.length = 1000;
      }

      await this.cacheService.set(historyKey, history, 86400);
    } catch (err) {
      this.logger.error(`Error caching event: ${event.id}`, err.stack);
    }
  }

  private async updateDetectionRuleStats(event: AnomalyEvent): Promise<void> {
    try {
      // In a real implementation, you would update statistics for the detection rules
      // that triggered this anomaly
      this.logger.debug(`Updating detection rule stats for anomaly: ${event.id}`);
    } catch (err) {
      this.logger.error(`Error updating detection rule stats for anomaly: ${event.id}`, err.stack);
    }
  }

  private async sendImmediateNotifications(anomaly: AnomalyEvent): Promise<void> {
    try {
      // Get users who should be notified
      const usersToNotify = await this.getUsersForNotification(anomaly);

      // Send WebSocket notifications
      for (const userId of usersToNotify) {
        await this.websocketGateway.broadcastToUser(
          userId,
          'user.notification',
          {
            title: `New ${anomaly.severity} anomaly detected`,
            message: `Anomaly ${anomaly.id}: ${anomaly.description}`,
            type: 'warning',
            data: {
              anomalyId: anomaly.id,
              severity: anomaly.severity,
              timestamp: anomaly.detectedAt
            }
          }
        );
      }

      // Send email notifications for critical anomalies
      if (anomaly.severity === 'critical') {
        await this.notificationService.sendEmailNotifications(
          usersToNotify,
          `Critical Anomaly Detected: ${anomaly.id}`,
          `Anomaly ${anomaly.id} has been detected with critical severity. Description: ${anomaly.description}`
        );
      }
    } catch (err) {
      this.logger.error(`Error sending immediate notifications for anomaly: ${anomaly.id}`, err.stack);
    }
  }

  private async sendAssignmentNotifications(anomaly: AnomalyEvent): Promise<void> {
    try {
      if (!anomaly.assignedUserId) return;

      // Get the assigned user's details
      const assignedUser = await this.userService.getUserById(anomaly.assignedUserId);

      // Send notification to the assigned user
      await this.websocketGateway.broadcastToUser(
        anomaly.assignedUserId,
        'user.notification',
        {
          title: `Anomaly assigned to you`,
          message: `Anomaly ${anomaly.id} has been assigned to you for investigation`,
          type: 'info',
          data: {
            anomalyId: anomaly.id,
            severity: anomaly.severity,
            timestamp: new Date().toISOString()
          }
        }
      );

      // Send email notification
      await this.notificationService.sendEmail(
        assignedUser.email,
        `Anomaly Assigned: ${anomaly.id}`,
        `Anomaly ${anomaly.id} (${anomaly.severity}) has been assigned to you for investigation. Description: ${anomaly.description}`
      );
    } catch (err) {
      this.logger.error(`Error sending assignment notifications for anomaly: ${anomaly.id}`, err.stack);
    }
  }

  private async sendResolutionNotifications(anomaly: AnomalyEvent): Promise<void> {
    try {
      // Get the anomaly history to find who was involved
      const history = await this.anomalyService.getAnomalyHistory(anomaly.id);
      const involvedUsers = new Set<string>();

      history.forEach(entry => {
        if (entry.userId) {
          involvedUsers.add(entry.userId);
        }
      });

      // Send notifications to all involved users
      for (const userId of involvedUsers) {
        await this.websocketGateway.broadcastToUser(
          userId,
          'user.notification',
          {
            title: `Anomaly resolved`,
            message: `Anomaly ${anomaly.id} has been resolved`,
            type: 'success',
            data: {
              anomalyId: anomaly.id,
              severity: anomaly.severity,
              timestamp: new Date().toISOString()
            }
          }
        );
      }
    } catch (err) {
      this.logger.error(`Error sending resolution notifications for anomaly: ${anomaly.id}`, err.stack);
    }
  }

  private async sendCommentNotifications(anomaly: AnomalyEvent, commentPayload: any): Promise<void> {
    try {
      // Get all users who have commented on this anomaly
      const comments = await this.anomalyService.getAnomalyComments(anomaly.id);
      const notifiedUsers = new Set<string>();

      // Add the commenter to the set to avoid duplicate notifications
      notifiedUsers.add(commentPayload.userId);

      // Notify all other commenters
      for (const comment of comments) {
        if (comment.userId !== commentPayload.userId && !notifiedUsers.has(comment.userId)) {
          await this.websocketGateway.broadcastToUser(
            comment.userId,
            'user.notification',
            {
              title: `New comment on anomaly ${anomaly.id}`,
              message: `User ${await this.getUserName(commentPayload.userId)} commented on anomaly you're following`,
              type: 'info',
              data: {
                anomalyId: anomaly.id,
                commentId: commentPayload.commentId,
                timestamp: commentPayload.timestamp
              }
            }
          );
          notifiedUsers.add(comment.userId);
        }
      }

      // Notify the anomaly assignee if different from commenter
      if (anomaly.assignedUserId && anomaly.assignedUserId !== commentPayload.userId) {
        await this.websocketGateway.broadcastToUser(
          anomaly.assignedUserId,
          'user.notification',
          {
            title: `New comment on assigned anomaly ${anomaly.id}`,
            message: `User ${await this.getUserName(commentPayload.userId)} commented on anomaly assigned to you`,
            type: 'info',
            data: {
              anomalyId: anomaly.id,
              commentId: commentPayload.commentId,
              timestamp: commentPayload.timestamp
            }
          }
        );
      }
    } catch (err) {
      this.logger.error(`Error sending comment notifications for anomaly: ${anomaly.id}`, err.stack);
    }
  }

  private async sendSystemAlertNotifications(alert: SystemAlert): Promise<void> {
    try {
      // Get all admin users
      const adminUsers = await this.userService.getUsersByRole('admin');

      // Send notifications to all admin users
      for (const user of adminUsers) {
        await this.websocketGateway.broadcastToUser(
          user.id,
          'user.notification',
          {
            title: `System Alert: ${alert.title}`,
            message: alert.message,
            type: alert.severity,
            data: {
              alertId: alert.id,
              severity: alert.severity,
              timestamp: alert.timestamp
            }
          }
        );
      }

      // For critical alerts, send email notifications
      if (alert.severity === 'critical') {
        await this.notificationService.sendEmailNotifications(
          adminUsers.map(user => user.id),
          `CRITICAL System Alert: ${alert.title}`,
          `${alert.message}\n\nAffected Services: ${alert.affectedServices?.join(', ') || 'Not specified'}`
        );
      }
    } catch (err) {
      this.logger.error(`Error sending system alert notifications for alert: ${alert.id}`, err.stack);
    }
  }

  private async sendRuleTriggeredNotifications(rule: any, anomalyId: string): Promise<void> {
    try {
      // Get the rule owners
      const owners = await this.detectionRuleService.getRuleOwners(rule.id);

      // Send notifications to rule owners
      for (const ownerId of owners) {
        await this.websocketGateway.broadcastToUser(
          ownerId,
          'user.notification',
          {
            title: `Detection rule triggered: ${rule.name}`,
            message: `Your detection rule "${rule.name}" has triggered an anomaly`,
            type: 'info',
            data: {
              ruleId: rule.id,
              anomalyId,
              timestamp: new Date().toISOString()
            }
          }
        );
      }
    } catch (err) {
      this.logger.error(`Error sending rule triggered notifications for rule: ${rule.id}`, err.stack);
    }
  }

  private async broadcastUserStatus(userId: string, status: 'online' | 'offline'): Promise<void> {
    try {
      // Get the user's contacts
      const contacts = await this.userService.getUserContacts(userId);

      // Broadcast status change to contacts
      for (const contactId of contacts) {
        await this.websocketGateway.broadcastToUser(
          contactId,
          'user.status',
          {
            userId,
            status,
            timestamp: new Date().toISOString()
          }
        );
      }
    } catch (err) {
      this.logger.error(`Error broadcasting user status for user: ${userId}`, err.stack);
    }
  }

  private async getUsersForNotification(anomaly: AnomalyEvent): Promise<string[]> {
    try {
      const users = new Set<string>();

      // Add users who are subscribed to this anomaly type
      const subscribers = await this.userService.getUsersSubscribedToAnomalyType(anomaly.type);
      subscribers.forEach(userId => users.add(userId));

      // Add users who are subscribed to this severity level
      const severitySubscribers = await this.userService.getUsersSubscribedToSeverity(anomaly.severity);
      severitySubscribers.forEach(userId => users.add(userId));

      // Add users who are subscribed to this source
      const sourceSubscribers = await this.userService.getUsersSubscribedToSource(anomaly.source);
      sourceSubscribers.forEach(userId => users.add(userId));

      // Add admin users
      const adminUsers = await this.userService.getUsersByRole('admin');
      adminUsers.forEach(user => users.add(user.id));

      // Remove the user who might have triggered the anomaly (if applicable)
      if (anomaly.metadata?.triggeredBy) {
        users.delete(anomaly.metadata.triggeredBy);
      }

      return Array.from(users);
    } catch (err) {
      this.logger.error(`Error getting users for notification for anomaly: ${anomaly.id}`, err.stack);
      return [];
    }
  }

  private async getUserName(userId: string): Promise<string> {
    try {
      const user = await this.userService.getUserById(userId);
      return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
    } catch (err) {
      this.logger.error(`Error getting user name for user: ${userId}`, err.stack);
      return 'Unknown User';
    }
  }

  private async updateRealtimeStats(): Promise<void> {
    try {
      // Get current stats from services
      const [
        anomaliesDetected,
        anomaliesResolved,
        usersOnline,
        systemLoad
      ] = await Promise.all([
        this.anomalyService.getAnomalyCount('detected'),
        this.anomalyService.getAnomalyCount('resolved'),
        this.websocketGateway.getUserCount(),
        this.systemService.getSystemLoad()
      ]);

      // Broadcast to all clients
      await this.websocketGateway.broadcastRealtimeStats({
        anomaliesDetected,
        anomaliesResolved,
        usersOnline,
        systemLoad,
        timestamp: new Date().toISOString()
      });

      // Cache the stats
      await this.cacheService.set('realtime:stats', {
        anomaliesDetected,
        anomaliesResolved,
        usersOnline,
        systemLoad,
        timestamp: new Date().toISOString()
      }, 60); // Cache for 1 minute
    } catch (err) {
      this.logger.error('Error updating real-time stats', err.stack);
    }
  }

  async getEventHistory(eventType: string, limit: number = 50): Promise<any[]> {
    try {
      const cacheKey = `event:history:${eventType}`;
      const cachedHistory = await this.cacheService.get<any[]>(cacheKey);

      if (cachedHistory) {
        return cachedHistory.slice(0, limit);
      }

      // In a real implementation, you would fetch from a database
      return [];
    } catch (err) {
      this.logger.error(`Error getting event history for type: ${eventType}`, err.stack);
      return [];
    }
  }

  async getAnomalyHistory(anomalyId: string): Promise<AnomalyEvent[]> {
    try {
      const cacheKey = `anomaly:history:${anomalyId}`;
      const cachedHistory = await this.cacheService.get<AnomalyEvent[]>(cacheKey);

      if (cachedHistory) {
        return cachedHistory;
      }

      // In a real implementation, you would fetch from a database
      return [];
    } catch (err) {
      this.logger.error(`Error getting anomaly history for: ${anomalyId}`, err.stack);
      return [];
    }
  }

  async getClientStats(): Promise<{
    totalClients: number;
    activeRooms: number;
    usersConnected: number;
    messagesSent: number;
    averageConnectionTime: number;
  }> {
    try {
      return await this.websocketGateway.getConnectionStats();
    } catch (err) {
      this.logger.error('Error getting client stats', err.stack);
      return {
        totalClients: 0,
        activeRooms: 0,
        usersConnected: 0,
        messagesSent: 0,
        averageConnectionTime: 0
      };
    }
  }

  async broadcastMaintenanceNotification(notification: {
    message: string;
    startTime: string;
    endTime: string;
    affectedServices: string[];
  }): Promise<number> {
    try {
      return await this.websocketGateway.broadcastMaintenanceNotification(notification);
    } catch (err) {
      this.logger.error('Error broadcasting maintenance notification', err.stack);
      return 0;
    }
  }

  async sendDirectMessage(userId: string, message: {
    title: string;
    content: string;
    type: 'info' | 'warning' | 'error' | 'success';
    data?: any;
  }): Promise<number> {
    try {
      return await this.websocketGateway.broadcastToUser(userId, 'user.message', message);
    } catch (err) {
      this.logger.error(`Error sending direct message to user: ${userId}`, err.stack);
      return 0;
    }
  }

  async getRoomClients(room: string): Promise<string[]> {
    try {
      return await this.websocketGateway.getRoomClients(room);
    } catch (err) {
      this.logger.error(`Error getting clients for room: ${room}`, err.stack);
      return [];
    }
  }

  async getUserClients(userId: string): Promise<string[]> {
    try {
      return await this.websocketGateway.getUserClients(userId);
    } catch (err) {
      this.logger.error(`Error getting clients for user: ${userId}`, err.stack);
      return [];
    }
  }
}
```

### Client-Side WebSocket Integration

```typescript
// websocket-client.service.ts
import { Injectable, Logger, OnDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

interface WebSocketMessage {
  event: string;
  data: any;
  timestamp?: string;
}

interface WebSocketConfig {
  url: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  protocols?: string | string[];
  token?: string;
  debug?: boolean;
}

interface WebSocketConnectionStatus {
  connected: boolean;
  connecting: boolean;
  lastError?: Error;
  reconnectAttempts: number;
  lastMessageReceived?: string;
  lastMessageSent?: string;
}

@Injectable()
export class WebsocketClientService implements OnDestroy {
  private readonly logger = new Logger(WebsocketClientService.name);
  private socket: WebSocket | null = null;
  private config: WebSocketConfig;
  private messageQueue: WebSocketMessage[] = [];
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private autoReconnect: boolean;
  private subscriptions = new Map<string, Subscription>();
  private messageHandlers = new Map<string, ((data: any) => void)[]>();
  private connectionStatus = new BehaviorSubject<WebSocketConnectionStatus>({
    connected: false,
    connecting: false,
    reconnectAttempts: 0
  });
  private messageSubject = new Subject<WebSocketMessage>();
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private lastPongTime: number = 0;
  private connectionId: string = uuidv4();
  private debugMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // Initialize with default config
    this.config = {
      url: this.configService.get<string>('WS_CLIENT_URL', 'ws://localhost:3000/ws-anomaly-detection'),
      autoReconnect: this.configService.get<boolean>('WS_AUTO_RECONNECT', true),
      reconnectInterval: this.configService.get<number>('WS_RECONNECT_INTERVAL', 5000),
      maxReconnectAttempts: this.configService.get<number>('WS_MAX_RECONNECT_ATTEMPTS', 10),
      debug: this.configService.get<boolean>('WS_DEBUG', false)
    };

    this.autoReconnect = this.config.autoReconnect;
    this.reconnectInterval = this.config.reconnectInterval;
    this.maxReconnectAttempts = this.config.maxReconnectAttempts;
    this.debugMode = this.config.debug;

    // Set up message processing pipeline
    this.setupMessagePipeline();
  }

  private setupMessagePipeline(): void {
    // Process messages with debounce to handle bursts
    const messageSubscription = this.messageSubject.pipe(
      debounceTime(50),
      distinctUntilChanged((prev, curr) => {
        // Simple comparison - could be enhanced based on message content
        return prev.event === curr.event && JSON.stringify(prev.data) === JSON.stringify(curr.data);
      })
    ).subscribe(message => {
      this.processMessage(message);
    });

    this.subscriptions.set('messagePipeline', messageSubscription);

    // Log connection status changes
    const statusSubscription = this.connectionStatus.pipe(
      distinctUntilChanged((prev, curr) => {
        return prev.connected === curr.connected &&
               prev.connecting === curr.connecting &&
               prev.reconnectAttempts === curr.reconnectAttempts;
      })
    ).subscribe(status => {
      if (this.debugMode) {
        this.logger.debug(`Connection status changed: ${JSON.stringify(status)}`);
      }
      this.eventEmitter.emit('websocket.connection.status', status);
    });

    this.subscriptions.set('statusPipeline', statusSubscription);
  }

  connect(config?: Partial<WebSocketConfig>): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.logger.warn('WebSocket is already connected');
      return;
    }

    // Merge config
    this.config = { ...this.config, ...config };
    this.autoReconnect = this.config.autoReconnect;
    this.reconnectInterval = this.config.reconnectInterval;
    this.maxReconnectAttempts = this.config.maxReconnectAttempts;
    this.debugMode = this.config.debug;

    if (this.isConnecting) {
      this.logger.warn('WebSocket connection is already in progress');
      return;
    }

    this.isConnecting = true;
    this.updateConnectionStatus({ connecting: true });

    try {
      // Create WebSocket connection
      this.socket = new WebSocket(this.config.url, this.config.protocols);

      // Set up event handlers
      this.setupSocketEventHandlers();

      // Set up ping/pong for connection health
      this.setupPingPong();

      // Process any queued messages
      this.processMessageQueue();
    } catch (err) {
      this.logger.error('Error creating WebSocket connection', err.stack);
      this.handleConnectionError(err);
    }
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = (event) => {
      this.handleConnectionOpen(event);
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.socket.onerror = (event) => {
      this.handleError(event);
    };

    this.socket.onclose = (event) => {
      this.handleConnectionClose(event);
    };
  }

  private setupPingPong(): void {
    // Clear any existing intervals
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
    }

    // Set up ping interval (every 30 seconds)
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.sendPing();

        // Set up pong timeout (5 seconds)
        this.pongTimeout = setTimeout(() => {
          if (Date.now() - this.lastPongTime > 35000) { // 35 seconds
            this.logger.warn('Pong not received, closing connection');
            this.close(true, 'Pong timeout');
          }
        }, 5000);
      }
    }, 30000);
  }

  private handleConnectionOpen(event: Event): void {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.updateConnectionStatus({
      connected: true,
      connecting: false,
      lastError: undefined,
      reconnectAttempts: 0
    });

    this.logger.log('WebSocket connection established');

    // Authenticate if token is provided
    if (this.config.token) {
      this.send('authenticate', { token: this.config.token });
    }

    // Process any queued messages
    this.processMessageQueue();

    // Emit connection event
    this.eventEmitter.emit('websocket.connected', {
      connectionId: this.connectionId,
      timestamp: new Date().toISOString()
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = typeof event.data === 'string'
        ? JSON.parse(event.data)
        : event.data;

      if (this.debugMode) {
        this.logger.debug(`Message received: ${message.event}`);
      }

      // Update connection status
      this.updateConnectionStatus({
        lastMessageReceived: message.event
      });

      // Handle pong response
      if (message.event === 'pong') {
        this.lastPongTime = Date.now();
        return;
      }

      // Emit to message subject for processing
      this.messageSubject.next({
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      });
    } catch (err) {
      this.logger.error('Error processing WebSocket message', err.stack);
    }
  }

  private processMessage(message: WebSocketMessage): void {
    try {
      // Call specific handlers for this event
      if (this.messageHandlers.has(message.event)) {
        const handlers = this.messageHandlers.get(message.event);
        handlers.forEach(handler => handler(message.data));
      }

      // Emit general message event
      this.eventEmitter.emit('websocket.message', message);

      // Emit specific event
      this.eventEmitter.emit(`websocket.${message.event}`, message.data);
    } catch (err) {
      this.logger.error(`Error processing message for event ${message.event}`, err.stack);
    }
  }

  private handleError(event: Event): void {
    const error = new Error(`WebSocket error: ${event.type}`);
    this.logger.error(error.message);

    this.updateConnectionStatus({
      lastError: error
    });

    this.eventEmitter.emit('websocket.error', error);
  }

  private handleConnectionClose(event: CloseEvent): void {
    this.logger.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);

    // Clear ping/pong intervals
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }

    this.updateConnectionStatus({
      connected: false,
      connecting: false,
      lastError: event.reason ? new Error(event.reason) : undefined
    });

    // Attempt to reconnect if configured
    if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.updateConnectionStatus({ reconnectAttempts: this.reconnectAttempts });

      this.logger.log(`Attempting to reconnect (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else if (this.autoReconnect) {
      this.logger.warn('Max reconnect attempts reached, giving up');
    }

    this.eventEmitter.emit('websocket.disconnected', {
      connectionId: this.connectionId,
      code: event.code,
      reason: event.reason,
      timestamp: new Date().toISOString()
    });
  }

  private handleConnectionError(error: Error): void {
    this.isConnecting = false;
    this.updateConnectionStatus({
      connected: false,
      connecting: false,
      lastError: error
    });

    this.logger.error('WebSocket connection error', error.stack);

    if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.updateConnectionStatus({ reconnectAttempts: this.reconnectAttempts });

      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    }
  }

  private updateConnectionStatus(updates: Partial<WebSocketConnectionStatus>): void {
    const currentStatus = this.connectionStatus.getValue();
    this.connectionStatus.next({
      ...currentStatus,
      ...updates
    });
  }

  send(event: string, data: any, options: { queueIfDisconnected?: boolean } = {}): boolean {
    const { queueIfDisconnected = true } = options;

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      if (queueIfDisconnected) {
        this.queueMessage(event, data);
        return true;
      }
      return false;
    }

    try {
      const message: WebSocketMessage = {
        event,
        data,
        timestamp: new Date().toISOString()
      };

      this.socket.send(JSON.stringify(message));

      // Update connection status
      this.updateConnectionStatus({
        lastMessageSent: event
      });

      if (this.debugMode) {
        this.logger.debug(`Message sent: ${event}`);
      }

      return true;
    } catch (err) {
      this.logger.error(`Error sending WebSocket message: ${event}`, err.stack);
      return false;
    }
  }

  private sendPing(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        event: 'ping',
        data: {
          timestamp: new Date().toISOString(),
          connectionId: this.connectionId
        }
      }));
    }
  }

  private queueMessage(event: string, data: any): void {
    this.messageQueue.push({
      event,
      data,
      timestamp: new Date().toISOString()
    });

    if (this.debugMode) {
      this.logger.debug(`Message queued (${this.messageQueue.length} in queue): ${event}`);
    }
  }

  private processMessageQueue(): void {
    if (this.messageQueue.length === 0 || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const messagesToSend = [...this.messageQueue];
    this.messageQueue = [];

    messagesToSend.forEach(message => {
      this.send(message.event, message.data, { queueIfDisconnected: false });
    });

    if (this.debugMode) {
      this.logger.debug(`Processed ${messagesToSend.length} queued messages`);
    }
  }

  subscribe<T = any>(event: string, handler: (data: T) => void): Subscription {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }

    const handlers = this.messageHandlers.get(event);
    handlers.push(handler);

    // Return a subscription that can be used to unsubscribe
    const subscription = new Subscription(() => {
      this.unsubscribe(event, handler);
    });

    this.subscriptions.set(`${event}:${handlers.length - 1}`, subscription);

    return subscription;
  }

  unsubscribe(event: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(event)) return;

    const handlers = this.messageHandlers.get(event);
    const index = handlers.indexOf(handler);

    if (index !== -1) {
      handlers.splice(index, 1);

      // Clean up if no more handlers
      if (handlers.length === 0) {
        this.messageHandlers.delete(event);
      }

      // Clean up subscription
      this.subscriptions.delete(`${event}:${index}`);
    }
  }

  subscribeToConnectionStatus(handler: (status: WebSocketConnectionStatus) => void): Subscription {
    return this.connectionStatus.pipe(
      distinctUntilChanged()
    ).subscribe(handler);
  }

  joinRoom(room: string | string[]): void {
    const rooms = Array.isArray(room) ? room : [room];
    this.send('subscribe', { rooms });
  }

  leaveRoom(room: string | string[]): void {
    const rooms = Array.isArray(room) ? room : [room];
    this.send('unsubscribe', { rooms });
  }

  getConnectionStatus(): WebSocketConnectionStatus {
    return this.connectionStatus.getValue();
  }

  getConnectionId(): string {
    return this.connectionId;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  close(code?: number, reason?: string): void {
    this.autoReconnect = false;

    if (this.socket) {
      this.socket.close(code, reason);
    }

    // Clear all intervals and timeouts
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  ngOnDestroy(): void {
    this.close(1000, 'Service destroyed');

    // Clean up all subscriptions
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions.clear();
    this.messageHandlers.clear();

    if (this.messageSubject) {
      this.messageSubject.complete();
    }

    if (this.connectionStatus) {
      this.connectionStatus.complete();
    }
  }

  // Convenience methods for common events

  onAnomalyDetected(handler: (anomaly: any) => void): Subscription {
    return this.subscribe('anomaly.detected', handler);
  }

  onAnomalyUpdated(handler: (anomaly: any) => void): Subscription {
    return this.subscribe('anomaly.updated', handler);
  }

  onAnomalyResolved(handler: (anomaly: any) => void): Subscription {
    return this.subscribe('anomaly.resolved', handler);
  }

  onSystemAlert(handler: (alert: any) => void): Subscription {
    return this.subscribe('system.alert', handler);
  }

  onUserNotification(handler: (notification: any) => void): Subscription {
    return this.subscribe('user.notification', handler);
  }

  onDashboard