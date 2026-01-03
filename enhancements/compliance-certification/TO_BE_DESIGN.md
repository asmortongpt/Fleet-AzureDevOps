# TO_BE_DESIGN.md - Compliance-Certification Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Status:** APPROVED

---

## Executive Vision (150+ lines)

### Strategic Transformation of Compliance-Certification

The enhanced compliance-certification module represents a paradigm shift in how organizations manage regulatory adherence, moving from reactive compliance to proactive risk mitigation through intelligent automation. This transformation aligns with our corporate vision of becoming the gold standard in compliance management software by 2025.

#### Business Transformation Goals

1. **Regulatory Intelligence Platform**
   - Transition from static rule-based systems to dynamic, learning compliance engines
   - Implement continuous monitoring of regulatory changes across 120+ jurisdictions
   - Automate 85% of routine compliance tasks through AI-driven workflows

2. **Customer Experience Revolution**
   - Reduce certification processing time from 14 days to under 48 hours
   - Implement predictive compliance status indicators with 92% accuracy
   - Create personalized compliance journeys based on organizational risk profiles

3. **Operational Excellence**
   - Achieve 99.99% system uptime through multi-region Kubernetes deployments
   - Reduce false positive alerts by 78% through machine learning refinement
   - Implement zero-touch audit processes for 60% of standard certifications

#### Competitive Advantage Framework

**Market Differentiation:**
- **AI-Powered Predictive Compliance:** First in industry to offer real-time compliance forecasting with integrated risk scoring
- **Jurisdictional Intelligence:** Only platform with automated regulatory change detection across global jurisdictions
- **Continuous Certification:** Unique capability for ongoing compliance monitoring vs. point-in-time assessments

**Technical Superiority:**
- **Performance Architecture:** 10x faster processing through Redis caching and ElasticSearch integration
- **Real-Time Capabilities:** WebSocket-based live compliance status updates
- **Offline-First Design:** Full PWA implementation for field auditors in low-connectivity environments

#### User Experience Transformation

**Auditor Persona:**
- **Before:** Manual form completion, disconnected systems, 3-5 day response times
- **After:** Voice-enabled data entry, AI-assisted evidence collection, real-time collaboration

**Compliance Officer Persona:**
- **Before:** Reactive monitoring, spreadsheet-based tracking, quarterly reporting
- **After:** Predictive dashboards, automated alerting, continuous certification status

**Executive Persona:**
- **Before:** Static PDF reports, limited visibility, retrospective analysis
- **After:** Interactive 3D risk heatmaps, forward-looking compliance forecasts, automated board reporting

#### Long-Term Roadmap (2024-2027)

**Phase 1: Foundation (2024 Q1-Q2)**
- Core performance enhancements (Redis, ElasticSearch)
- Real-time WebSocket infrastructure
- Basic PWA capabilities
- WCAG 2.1 AAA compliance

**Phase 2: Intelligence (2024 Q3-Q4)**
- Predictive compliance modeling
- Automated evidence collection
- Advanced gamification system
- Blockchain-based audit trails

**Phase 3: Ecosystem (2025)**
- Compliance marketplace
- Third-party app integrations
- Regulatory change API
- Compliance-as-a-Service

**Phase 4: Autonomous Compliance (2026-2027)**
- Self-healing compliance systems
- Autonomous regulatory adaptation
- Predictive enforcement avoidance
- Compliance quantum computing

#### Financial Impact Projections

| Metric | 2024 | 2025 | 2026 | 2027 |
|--------|------|------|------|------|
| Customer Acquisition Cost | $450 | $380 | $320 | $280 |
| Customer Lifetime Value | $18,000 | $22,000 | $26,000 | $30,000 |
| Compliance Process Cost | $120/hr | $95/hr | $75/hr | $60/hr |
| Certification Throughput | 1,200/mo | 2,500/mo | 4,800/mo | 8,500/mo |
| Market Share | 8% | 15% | 22% | 30% |

#### Organizational Alignment

**Technology Teams:**
- Adopt TypeScript as primary language (95% coverage)
- Implement GitOps workflows for all deployments
- Standardize on Kubernetes for container orchestration
- Enforce 100% test coverage for critical paths

**Compliance Teams:**
- Transition to continuous monitoring model
- Develop new certification methodologies
- Create training programs for AI-assisted compliance
- Establish regulatory change management processes

**Customer Success:**
- Develop onboarding accelerators
- Create compliance maturity assessment tools
- Implement customer health scoring
- Establish success planning frameworks

#### Risk-Adjusted ROI Analysis

**Base Case:**
- 3-year ROI: 387%
- Payback Period: 18 months
- IRR: 42%

**Conservative Case:**
- 3-year ROI: 245%
- Payback Period: 24 months
- IRR: 31%

**Optimistic Case:**
- 3-year ROI: 582%
- Payback Period: 14 months
- IRR: 58%

#### Implementation Governance

**Steering Committee:**
- CTO (Chair)
- VP of Product
- Chief Compliance Officer
- Director of Engineering
- Customer Advisory Board Representative

**Workstreams:**
1. **Core Platform** (Performance, Security, Architecture)
2. **Intelligence Layer** (AI/ML, Predictive Analytics)
3. **User Experience** (PWA, Accessibility, Gamification)
4. **Ecosystem** (Integrations, Marketplace, APIs)
5. **Operations** (Deployment, Monitoring, Support)

**Success Metrics:**
- System performance (99.95% uptime)
- Customer satisfaction (NPS +45)
- Certification processing time (<48 hours)
- Compliance accuracy (98.5% first-time pass rate)
- Revenue growth (35% YoY)

---

## Performance Enhancements (300+ lines)

### Redis Caching Layer Implementation

```typescript
// src/cache/redis-cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { promisify } from 'util';
import * as crypto from 'crypto';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly redisClient: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour default
  private readonly CACHE_PREFIX = 'compliance:';

  constructor(private configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
      retryStrategy: (times) => Math.min(times * 50, 2000),
      reconnectOnError: (err) => {
        this.logger.error(`Redis reconnection error: ${err.message}`);
        return true;
      },
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis connection established');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  /**
   * Generate cache key with consistent hashing
   * @param keyParts Array of key components
   * @returns Hashed cache key
   */
  private generateCacheKey(keyParts: string[]): string {
    const key = keyParts.join(':');
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Get cached value with automatic type conversion
   * @param keyParts Cache key components
   * @returns Cached value or null
   */
  async get<T>(keyParts: string[]): Promise<T | null> {
    try {
      const key = this.generateCacheKey(keyParts);
      const value = await this.redisClient.get(`${this.CACHE_PREFIX}${key}`);

      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        this.logger.warn(`Failed to parse cached value for key: ${key}`);
        return null;
      }
    } catch (err) {
      this.logger.error(`Redis get operation failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Set cache value with optional TTL
   * @param keyParts Cache key components
   * @param value Value to cache
   * @param ttl Time to live in seconds
   */
  async set<T>(keyParts: string[], value: T, ttl?: number): Promise<void> {
    try {
      const key = this.generateCacheKey(keyParts);
      const stringValue = JSON.stringify(value);
      const effectiveTtl = ttl || this.DEFAULT_TTL;

      await this.redisClient.setex(
        `${this.CACHE_PREFIX}${key}`,
        effectiveTtl,
        stringValue
      );
    } catch (err) {
      this.logger.error(`Redis set operation failed: ${err.message}`);
    }
  }

  /**
   * Cache with automatic refresh
   * @param keyParts Cache key components
   * @param fetchFn Function to fetch fresh data
   * @param ttl Time to live in seconds
   * @param refreshThreshold Percentage of TTL when refresh should start
   * @returns Cached or fresh value
   */
  async cacheWithRefresh<T>(
    keyParts: string[],
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
    refreshThreshold: number = 0.8
  ): Promise<T> {
    const key = this.generateCacheKey(keyParts);
    const cachedValue = await this.get<T>(keyParts);

    if (cachedValue) {
      // Check if we should refresh in background
      const ttlRemaining = await this.redisClient.ttl(
        `${this.CACHE_PREFIX}${key}`
      );

      if (ttlRemaining < ttl * refreshThreshold) {
        this.logger.debug(`Refreshing cache for key: ${key}`);
        fetchFn()
          .then((freshValue) => this.set(keyParts, freshValue, ttl))
          .catch((err) => {
            this.logger.error(`Cache refresh failed: ${err.message}`);
          });
      }

      return cachedValue;
    }

    // Cache miss - fetch fresh data
    const freshValue = await fetchFn();
    await this.set(keyParts, freshValue, ttl);
    return freshValue;
  }

  /**
   * Delete cache entries matching pattern
   * @param pattern Cache key pattern
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisClient.keys(
        `${this.CACHE_PREFIX}${pattern}`
      );

      if (keys.length > 0) {
        await this.redisClient.del(keys);
        this.logger.log(`Deleted ${keys.length} cache entries matching ${pattern}`);
      }
    } catch (err) {
      this.logger.error(`Redis delete by pattern failed: ${err.message}`);
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memoryUsage: string;
    hitRate: number;
  }> {
    try {
      const keys = await this.redisClient.dbsize();
      const info = await this.redisClient.info('memory');
      const memoryUsage = info
        .split('\n')
        .find((line) => line.startsWith('used_memory:'))
        ?.split(':')[1]
        .trim();

      // Simplified hit rate calculation
      const hitRate = 0.95; // Would be calculated from actual metrics in production

      return {
        keys,
        memoryUsage: memoryUsage || '0',
        hitRate,
      };
    } catch (err) {
      this.logger.error(`Failed to get cache stats: ${err.message}`);
      return {
        keys: 0,
        memoryUsage: '0',
        hitRate: 0,
      };
    }
  }

  /**
   * Cache multi-get operation
   * @param keyPatterns Array of key patterns
   * @returns Array of cached values
   */
  async mget<T>(keyPatterns: string[][]): Promise<(T | null)[]> {
    try {
      const keys = keyPatterns.map((parts) =>
        `${this.CACHE_PREFIX}${this.generateCacheKey(parts)}`
      );

      const values = await this.redisClient.mget(keys);
      return values.map((value) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (err) {
      this.logger.error(`Redis mget operation failed: ${err.message}`);
      return keyPatterns.map(() => null);
    }
  }

  /**
   * Cache pipeline for bulk operations
   * @param operations Array of cache operations
   */
  async pipeline(
    operations: Array<{
      type: 'set' | 'get' | 'del';
      keyParts: string[];
      value?: any;
      ttl?: number;
    }>
  ): Promise<any[]> {
    try {
      const pipeline = this.redisClient.pipeline();

      operations.forEach((op) => {
        const key = `${this.CACHE_PREFIX}${this.generateCacheKey(op.keyParts)}`;

        switch (op.type) {
          case 'set':
            pipeline.setex(key, op.ttl || this.DEFAULT_TTL, JSON.stringify(op.value));
            break;
          case 'get':
            pipeline.get(key);
            break;
          case 'del':
            pipeline.del(key);
            break;
        }
      });

      const results = await pipeline.exec();
      return results.map((result) => {
        if (result[0]) {
          this.logger.error(`Pipeline operation failed: ${result[0].message}`);
          return null;
        }

        if (result[1] && typeof result[1] === 'string') {
          try {
            return JSON.parse(result[1]);
          } catch {
            return result[1];
          }
        }

        return result[1];
      });
    } catch (err) {
      this.logger.error(`Redis pipeline failed: ${err.message}`);
      return operations.map(() => null);
    }
  }
}
```

### Database Query Optimization

```typescript
// src/database/query-optimizer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { ComplianceCertification } from './entities/compliance-certification.entity';
import { ComplianceRequirement } from './entities/compliance-requirement.entity';
import { AuditLog } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { QueryOptimizationResult } from './interfaces/query-optimization-result.interface';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);
  private readonly QUERY_CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(ComplianceCertification)
    private certificationRepo: Repository<ComplianceCertification>,
    @InjectRepository(ComplianceRequirement)
    private requirementRepo: Repository<ComplianceRequirement>,
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  /**
   * Optimize certification listing query with dynamic joins
   * @param options Query options
   * @returns Optimized query builder
   */
  optimizeCertificationQuery(
    options: {
      organizationId?: string;
      status?: string[];
      certificationType?: string[];
      dueBefore?: Date;
      dueAfter?: Date;
      search?: string;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }
  ): SelectQueryBuilder<ComplianceCertification> {
    const query = this.certificationRepo
      .createQueryBuilder('cert')
      .leftJoinAndSelect('cert.organization', 'org')
      .leftJoinAndSelect('cert.requirements', 'req')
      .leftJoinAndSelect('cert.auditLogs', 'auditLogs')
      .leftJoinAndSelect('cert.createdBy', 'createdBy')
      .leftJoinAndSelect('cert.updatedBy', 'updatedBy');

    // Apply dynamic joins only when needed
    if (options.search) {
      query.leftJoinAndSelect('cert.documents', 'documents');
    }

    // Apply filters
    if (options.organizationId) {
      query.andWhere('org.id = :orgId', { orgId: options.organizationId });
    }

    if (options.status && options.status.length > 0) {
      query.andWhere('cert.status IN (:...status)', { status: options.status });
    }

    if (options.certificationType && options.certificationType.length > 0) {
      query.andWhere('cert.type IN (:...types)', {
        types: options.certificationType,
      });
    }

    if (options.dueBefore) {
      query.andWhere('cert.dueDate <= :dueBefore', {
        dueBefore: options.dueBefore,
      });
    }

    if (options.dueAfter) {
      query.andWhere('cert.dueDate >= :dueAfter', { dueAfter: options.dueAfter });
    }

    if (options.search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('cert.name ILIKE :search', { search: `%${options.search}%` })
            .orWhere('cert.description ILIKE :search', {
              search: `%${options.search}%`,
            })
            .orWhere('org.name ILIKE :search', { search: `%${options.search}%` })
            .orWhere('documents.name ILIKE :search', {
              search: `%${options.search}%`,
            });
        })
      );
    }

    // Apply sorting with fallback
    const sortBy = options.sortBy || 'dueDate';
    const sortOrder = options.sortOrder || 'ASC';

    // Handle special cases for sorting
    switch (sortBy) {
      case 'organization':
        query.orderBy('org.name', sortOrder);
        break;
      case 'status':
        query.orderBy('cert.status', sortOrder);
        break;
      case 'completion':
        query.addOrderBy('cert.completionPercentage', sortOrder);
        break;
      default:
        query.orderBy(`cert.${sortBy}`, sortOrder);
    }

    // Apply pagination
    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    // Add query explanation for debugging
    query.addSelect(
      `(SELECT pg_size_pretty(pg_total_relation_size('compliance_certification')))`,
      'table_size'
    );

    return query;
  }

  /**
   * Optimize requirement listing with complex joins
   * @param options Query options
   * @returns Optimized query builder
   */
  optimizeRequirementQuery(
    options: {
      certificationId?: string;
      status?: string[];
      controlType?: string[];
      search?: string;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }
  ): SelectQueryBuilder<ComplianceRequirement> {
    const query = this.requirementRepo
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.certification', 'cert')
      .leftJoinAndSelect('req.evidence', 'evidence')
      .leftJoinAndSelect('req.createdBy', 'createdBy')
      .leftJoinAndSelect('req.updatedBy', 'updatedBy');

    // Apply filters
    if (options.certificationId) {
      query.andWhere('cert.id = :certId', { certId: options.certificationId });
    }

    if (options.status && options.status.length > 0) {
      query.andWhere('req.status IN (:...status)', { status: options.status });
    }

    if (options.controlType && options.controlType.length > 0) {
      query.andWhere('req.controlType IN (:...types)', {
        types: options.controlType,
      });
    }

    if (options.search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('req.name ILIKE :search', { search: `%${options.search}%` })
            .orWhere('req.description ILIKE :search', {
              search: `%${options.search}%`,
            })
            .orWhere('req.controlId ILIKE :search', {
              search: `%${options.search}%`,
            })
            .orWhere('evidence.name ILIKE :search', {
              search: `%${options.search}%`,
            });
        })
      );
    }

    // Apply sorting
    const sortBy = options.sortBy || 'name';
    const sortOrder = options.sortOrder || 'ASC';

    switch (sortBy) {
      case 'certification':
        query.orderBy('cert.name', sortOrder);
        break;
      case 'status':
        query.orderBy('req.status', sortOrder);
        break;
      case 'lastUpdated':
        query.orderBy('req.updatedAt', sortOrder);
        break;
      default:
        query.orderBy(`req.${sortBy}`, sortOrder);
    }

    // Apply pagination
    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    return query;
  }

  /**
   * Analyze and optimize query performance
   * @param queryBuilder Query builder instance
   * @returns Optimization results
   */
  async analyzeQueryPerformance(
    queryBuilder: SelectQueryBuilder<any>
  ): Promise<QueryOptimizationResult> {
    const cacheKey = `query_analysis:${queryBuilder.getQueryAndParameters().join(':')}`;

    // Check cache first
    const cachedResult = await this.cacheManager.get<QueryOptimizationResult>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      // Get query execution plan
      const explanation = await queryBuilder.explain('ANALYZE');

      // Parse execution plan
      const planLines = explanation.split('\n');
      const planningTime = parseFloat(
        planLines
          .find((line) => line.includes('Planning Time:'))
          ?.split(':')[1]
          ?.trim()
          ?.split(' ')[0] || '0'
      );

      const executionTime = parseFloat(
        planLines
          .find((line) => line.includes('Execution Time:'))
          ?.split(':')[1]
          ?.trim()
          ?.split(' ')[0] || '0'
      );

      const totalCost = parseFloat(
        planLines
          .find((line) => line.includes('cost='))
          ?.split('cost=')[1]
          ?.split('..')[1]
          ?.split(' ')[0] || '0'
      );

      // Check for sequential scans
      const hasSeqScan = explanation.includes('Seq Scan');
      const seqScanCount = (explanation.match(/Seq Scan/g) || []).length;

      // Check for index usage
      const hasIndexScan = explanation.includes('Index Scan');
      const indexScanCount = (explanation.match(/Index Scan/g) || []).length;

      // Check for sort operations
      const hasSort = explanation.includes('Sort');
      const sortCount = (explanation.match(/Sort/g) || []).length;

      // Check for hash joins
      const hasHashJoin = explanation.includes('Hash Join');
      const hashJoinCount = (explanation.match(/Hash Join/g) || []).length;

      // Check for nested loops
      const hasNestedLoop = explanation.includes('Nested Loop');
      const nestedLoopCount = (explanation.match(/Nested Loop/g) || []).length;

      // Determine optimization recommendations
      const recommendations: string[] = [];

      if (hasSeqScan && seqScanCount > 2) {
        recommendations.push(
          `Consider adding indexes for tables with sequential scans (${seqScanCount} found)`
        );
      }

      if (!hasIndexScan) {
        recommendations.push(
          'No index scans detected - verify appropriate indexes exist'
        );
      }

      if (hasSort && sortCount > 1) {
        recommendations.push(
          `Multiple sort operations detected (${sortCount}) - consider adding indexes for sort columns`
        );
      }

      if (totalCost > 1000) {
        recommendations.push(
          `Query cost is high (${totalCost}) - consider breaking into smaller queries or adding materialized views`
        );
      }

      if (executionTime > 100) {
        recommendations.push(
          `Execution time is high (${executionTime}ms) - optimize query or add caching`
        );
      }

      const result: QueryOptimizationResult = {
        planningTime,
        executionTime,
        totalCost,
        hasSeqScan,
        seqScanCount,
        hasIndexScan,
        indexScanCount,
        hasSort,
        sortCount,
        hasHashJoin,
        hashJoinCount,
        hasNestedLoop,
        nestedLoopCount,
        recommendations,
        query: queryBuilder.getQuery(),
        parameters: queryBuilder.getParameters(),
      };

      // Cache the result
      await this.cacheManager.set(cacheKey, result, this.QUERY_CACHE_TTL);

      return result;
    } catch (err) {
      this.logger.error(`Query analysis failed: ${err.message}`);
      return {
        planningTime: 0,
        executionTime: 0,
        totalCost: 0,
        hasSeqScan: false,
        seqScanCount: 0,
        hasIndexScan: false,
        indexScanCount: 0,
        hasSort: false,
        sortCount: 0,
        hasHashJoin: false,
        hashJoinCount: 0,
        hasNestedLoop: false,
        nestedLoopCount: 0,
        recommendations: [`Analysis failed: ${err.message}`],
        query: queryBuilder.getQuery(),
        parameters: queryBuilder.getParameters(),
      };
    }
  }

  /**
   * Create materialized view for frequent queries
   * @param viewName Materialized view name
   * @param queryBuilder Query builder for the view
   * @param refreshInterval Refresh interval in seconds
   */
  async createMaterializedView(
    viewName: string,
    queryBuilder: SelectQueryBuilder<any>,
    refreshInterval: number = 3600
  ): Promise<void> {
    try {
      // Check if view exists
      const viewExists = await this.certificationRepo.query(
        `SELECT EXISTS (
          SELECT FROM pg_catalog.pg_matviews
          WHERE matviewname = $1
        )`,
        [viewName]
      );

      const query = queryBuilder.getQuery();
      const parameters = queryBuilder.getParameters();

      if (!viewExists[0].exists) {
        // Create materialized view
        await this.certificationRepo.query(
          `CREATE MATERIALIZED VIEW ${viewName} AS ${query}`,
          parameters
        );

        // Create index on materialized view
        await this.certificationRepo.query(
          `CREATE INDEX idx_${viewName}_id ON ${viewName} (id)`
        );

        this.logger.log(`Created materialized view: ${viewName}`);
      }

      // Schedule refresh
      setInterval(async () => {
        try {
          await this.certificationRepo.query(
            `REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`
          );
          this.logger.log(`Refreshed materialized view: ${viewName}`);
        } catch (err) {
          this.logger.error(
            `Failed to refresh materialized view ${viewName}: ${err.message}`
          );
        }
      }, refreshInterval * 1000);
    } catch (err) {
      this.logger.error(`Failed to create materialized view: ${err.message}`);
      throw err;
    }
  }

  /**
   * Optimize bulk insert operations
   * @param entityName Entity name
   * @param data Array of data to insert
   * @param batchSize Batch size
   * @returns Number of inserted records
   */
  async bulkInsert<T>(
    entityName: string,
    data: Partial<T>[],
    batchSize: number = 1000
  ): Promise<number> {
    if (data.length === 0) return 0;

    try {
      const repository = this.getRepository<T>(entityName);
      let insertedCount = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        // Use transaction for each batch
        await this.certificationRepo.manager.transaction(async (manager) => {
          const result = await manager
            .createQueryBuilder()
            .insert()
            .into(entityName)
            .values(batch)
            .execute();

          insertedCount += result.identifiers.length;
        });
      }

      return insertedCount;
    } catch (err) {
      this.logger.error(`Bulk insert failed for ${entityName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get appropriate repository for entity
   * @param entityName Entity name
   * @returns Repository instance
   */
  private getRepository<T>(entityName: string): Repository<T> {
    switch (entityName) {
      case 'ComplianceCertification':
        return this.certificationRepo as unknown as Repository<T>;
      case 'ComplianceRequirement':
        return this.requirementRepo as unknown as Repository<T>;
      case 'AuditLog':
        return this.auditLogRepo as unknown as Repository<T>;
      case 'User':
        return this.userRepo as unknown as Repository<T>;
      case 'Organization':
        return this.orgRepo as unknown as Repository<T>;
      default:
        throw new Error(`Repository for ${entityName} not found`);
    }
  }
}
```

### API Response Compression

```typescript
// src/middleware/response-compression.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { performance } from 'perf_hooks';

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly compressionMiddleware: any;
  private readonly MIN_COMPRESSION_SIZE = 1024; // 1KB minimum
  private readonly COMPRESSION_LEVEL = 6; // Balance between speed and ratio
  private readonly COMPRESSION_THRESHOLD = 0.3; // 30% size reduction threshold

  constructor(private configService: ConfigService) {
    // Configure compression middleware
    this.compressionMiddleware = compression({
      level: this.COMPRESSION_LEVEL,
      threshold: this.MIN_COMPRESSION_SIZE,
      filter: (req: Request, res: Response) => {
        // Don't compress if already compressed
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Don't compress binary data
        if (res.getHeader('Content-Type')?.toString().includes('application/octet-stream')) {
          return false;
        }

        // Don't compress small responses
        if (Number(res.getHeader('Content-Length')) < this.MIN_COMPRESSION_SIZE) {
          return false;
        }

        return compression.filter(req, res);
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = performance.now();

    // Store original write and end functions
    const originalWrite = res.write;
    const originalEnd = res.end;
    const originalGetHeader = res.getHeader;

    // Track response size
    let responseSize = 0;
    let compressedSize = 0;
    let compressionRatio = 0;

    // Override write function to track size
    res.write = function (chunk: any, ...args: any[]): boolean {
      if (chunk) {
        responseSize += chunk.length;
      }
      return originalWrite.call(this, chunk, ...args);
    };

    // Override end function to track size and compression
    res.end = function (chunk: any, ...args: any[]): Response {
      if (chunk) {
        responseSize += chunk.length;
      }

      // Only compress if we have significant size
      if (responseSize >= this.MIN_COMPRESSION_SIZE) {
        // Check if response is already compressed
        const contentEncoding = res.getHeader('Content-Encoding');
        if (!contentEncoding) {
          // Apply compression
          this.compressionMiddleware(req, res, () => {
            // After compression, measure compressed size
            const compressedContentLength = res.getHeader('Content-Length');
            if (compressedContentLength) {
              compressedSize = Number(compressedContentLength);
              compressionRatio = 1 - (compressedSize / responseSize);

              // Log compression metrics
              const duration = performance.now() - startTime;
              console.log({
                event: 'response_compression',
                path: req.path,
                originalSize: responseSize,
                compressedSize,
                compressionRatio,
                duration,
                compressionLevel: this.COMPRESSION_LEVEL,
              });

              // Only keep compression if it's effective
              if (compressionRatio < this.COMPRESSION_THRESHOLD) {
                // Remove compression headers if not effective
                res.removeHeader('Content-Encoding');
                res.removeHeader('Vary');
              }
            }
          });
        }
      }

      return originalEnd.call(this, chunk, ...args);
    }.bind(res);

    // Override getHeader to track headers
    res.getHeader = function (name: string): any {
      if (name.toLowerCase() === 'content-length') {
        return responseSize;
      }
      return originalGetHeader.call(this, name);
    }.bind(res);

    next();
  }
}

// src/main.ts - Compression configuration
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseCompressionMiddleware } from './middleware/response-compression.middleware';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
    })
  );

  // Response compression
  app.use(new ResponseCompressionMiddleware(app.get(ConfigService)).use);

  // Start server
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

### Lazy Loading Implementation

```typescript
// src/common/lazy-loader.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { LAZY_LOAD_METADATA } from './constants';

/**
 * Decorator to mark a route or controller for lazy loading
 * @param options Lazy loading options
 */
export function LazyLoad(options: {
  /**
   * The property path to load lazily
   * Example: 'requirements' or 'organization.users'
   */
  path: string;
  /**
   * The threshold in milliseconds after which lazy loading should be triggered
   * Default: 500ms
   */
  threshold?: number;
  /**
   * Whether to load in parallel with the main request
   * Default: true
   */
  parallel?: boolean;
  /**
   * Maximum depth for nested lazy loading
   * Default: 2
   */
  maxDepth?: number;
} = { threshold: 500, parallel: true, maxDepth: 2 }) {
  return applyDecorators(
    SetMetadata(LAZY_LOAD_METADATA, {
      path: options.path,
      threshold: options.threshold,
      parallel: options.parallel,
      maxDepth: options.maxDepth,
    })
  );
}

// src/common/lazy-loader.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, mergeMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LAZY_LOAD_METADATA } from './constants';
import { performance } from 'perf_hooks';
import { DataLoaderService } from './data-loader.service';

@Injectable()
export class LazyLoaderInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LazyLoaderInterceptor.name);

  constructor(
    private reflector: Reflector,
    private dataLoader: DataLoaderService
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const lazyLoadOptions = this.reflector.getAllAndOverride<{
      path: string;
      threshold: number;
      parallel: boolean;
      maxDepth: number;
    }>(LAZY_LOAD_METADATA, [context.getHandler(), context.getClass()]);

    if (!lazyLoadOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Store original send function
    const originalSend = response.send;

    // Track if lazy loading has been triggered
    let lazyLoadTriggered = false;
    let mainResponseSent = false;
    let lazyLoadComplete = false;

    // Override send function to track response timing
    response.send = (body: any) => {
      if (!mainResponseSent) {
        mainResponseSent = true;

        // Check if we should trigger lazy loading
        const startTime = performance.now();
        const checkLazyLoad = () => {
          const elapsed = performance.now() - startTime;
          if (elapsed >= lazyLoadOptions.threshold && !lazyLoadTriggered) {
            this.triggerLazyLoad(
              request,
              response,
              lazyLoadOptions,
              body,
              originalSend
            );
            lazyLoadTriggered = true;
          }
        };

        // Check after threshold time
        setTimeout(checkLazyLoad, lazyLoadOptions.threshold);

        // Also check when response is actually sent
        const originalEnd = response.end;
        response.end = (chunk: any, encoding?: any) => {
          checkLazyLoad();
          return originalEnd.call(response, chunk, encoding);
        };
      }

      return originalSend.call(response, body);
    };

    return next.handle().pipe(
      mergeMap((data) => {
        if (lazyLoadOptions.parallel) {
          // Start lazy loading in parallel
          this.startParallelLazyLoad(request, lazyLoadOptions);
        }

        return new Observable((subscriber) => {
          subscriber.next(data);
          subscriber.complete();

          // If lazy loading hasn't been triggered yet, trigger it now
          if (!lazyLoadTriggered && !lazyLoadOptions.parallel) {
            this.triggerLazyLoad(
              request,
              response,
              lazyLoadOptions,
              data,
              originalSend
            );
          }
        });
      })
    );
  }

  private async triggerLazyLoad(
    request: any,
    response: any,
    options: {
      path: string;
      threshold: number;
      parallel: boolean;
      maxDepth: number;
    },
    mainResponse: any,
    originalSend: any
  ) {
    try {
      this.logger.log(
        `Triggering lazy load for path: ${options.path} (threshold: ${options.threshold}ms)`
      );

      // Get the base object to load into
      const basePath = options.path.split('.')[0];
      const baseObject = mainResponse[basePath];

      if (!baseObject) {
        this.logger.warn(`Base path ${basePath} not found in response`);
        return;
      }

      // Load the lazy data
      const lazyData = await this.dataLoader.loadDeep(
        baseObject,
        options.path,
        options.maxDepth
      );

      // Update the response
      if (lazyData) {
        // Create a new response object with the lazy data
        const updatedResponse = {
          ...mainResponse,
          [basePath]: {
            ...mainResponse[basePath],
            ...lazyData,
          },
        };

        // Send the updated response
        originalSend.call(response, updatedResponse);
      }
    } catch (err) {
      this.logger.error(`Lazy loading failed: ${err.message}`);
      // Continue with original response if lazy loading fails
      if (!response.headersSent) {
        originalSend.call(response, mainResponse);
      }
    }
  }

  private async startParallelLazyLoad(
    request: any,
    options: {
      path: string;
      threshold: number;
      parallel: boolean;
      maxDepth: number;
    }
  ) {
    try {
      this.logger.log(
        `Starting parallel lazy load for path: ${options.path}`
      );

      // This would be implemented based on your specific data loading needs
      // For example, you might pre-fetch data that you know will be needed
      await this.dataLoader.preload(options.path, options.maxDepth);
    } catch (err) {
      this.logger.error(`Parallel lazy loading failed: ${err.message}`);
    }
  }
}

// src/common/data-loader.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ComplianceCertification } from '../compliance-certification/entities/compliance-certification.entity';
import { ComplianceRequirement } from '../compliance-certification/entities/compliance-requirement.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../compliance-certification/entities/audit-log.entity';
import { RedisCacheService } from '../cache/redis-cache.service';

@Injectable()
export class DataLoaderService {
  private readonly logger = new Logger(DataLoaderService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(ComplianceCertification)
    private certificationRepo: Repository<ComplianceCertification>,
    @InjectRepository(ComplianceRequirement)
    private requirementRepo: Repository<ComplianceRequirement>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    private cacheService: RedisCacheService
  ) {}

  /**
   * Load data deeply for a given path
   * @param baseObject Base object to load into
   * @param path Path to load (e.g., 'requirements.evidence')
   * @param maxDepth Maximum depth to load
   * @returns Loaded data
   */
  async loadDeep(
    baseObject: any,
    path: string,
    maxDepth: number = 2
  ): Promise<any> {
    const pathParts = path.split('.');
    if (pathParts.length > maxDepth) {
      this.logger.warn(
        `Path ${path} exceeds max depth ${maxDepth}, truncating`
      );
      pathParts.length = maxDepth;
    }

    return this.loadPath(baseObject, pathParts);
  }

  /**
   * Load a specific path
   * @param baseObject Base object
   * @param pathParts Path parts
   * @returns Loaded data
   */
  private async loadPath(baseObject: any, pathParts: string[]): Promise<any> {
    if (pathParts.length === 0) {
      return baseObject;
    }

    const currentPart = pathParts[0];
    const remainingPath = pathParts.slice(1);

    // Check if this property is already loaded
    if (baseObject[currentPart] !== undefined) {
      if (remainingPath.length === 0) {
        return baseObject;
      }
      return this.loadPath(baseObject[currentPart], remainingPath);
    }

    // Determine the type of object we're loading
    const entityType = this.getEntityType(baseObject, currentPart);

    if (!entityType) {
      this.logger.warn(
        `Could not determine entity type for path: ${currentPart}`
      );
      return baseObject;
    }

    // Load the data based on the entity type
    const loadedData = await this.loadEntityData(
      baseObject,
      currentPart,
      entityType
    );

    if (loadedData) {
      baseObject[currentPart] = loadedData;

      if (remainingPath.length > 0) {
        // If we have more path parts, load recursively
        if (Array.isArray(loadedData)) {
          // Handle array case
          const results = await Promise.all(
            loadedData.map((item) => this.loadPath(item, remainingPath))
          );
          baseObject[currentPart] = results;
        } else {
          // Handle object case
          await this.loadPath(loadedData, remainingPath);
        }
      }
    }

    return baseObject;
  }

  /**
   * Determine the entity type for a path
   * @param baseObject Base object
   * @param path Path part
   * @returns Entity type
   */
  private getEntityType(baseObject: any, path: string): string | null {
    // Check the base object type
    if (baseObject instanceof ComplianceCertification) {
      switch (path) {
        case 'requirements':
          return 'ComplianceRequirement';
        case 'auditLogs':
          return 'AuditLog';
        case 'organization':
          return 'Organization';
        case 'createdBy':
        case 'updatedBy':
          return 'User';
        default:
          return null;
      }
    } else if (baseObject instanceof ComplianceRequirement) {
      switch (path) {
        case 'evidence':
          return 'Evidence';
        case 'certification':
          return 'ComplianceCertification';
        case 'createdBy':
        case 'updatedBy':
          return 'User';
        default:
          return null;
      }
    } else if (baseObject instanceof Organization) {
      switch (path) {
        case 'users':
          return 'User';
        case 'certifications':
          return 'ComplianceCertification';
        default:
          return null;
      }
    } else if (baseObject instanceof User) {
      switch (path) {
        case 'organization':
          return 'Organization';
        case 'createdCertifications':
        case 'updatedCertifications':
          return 'ComplianceCertification';
        default:
          return null;
      }
    }

    return null;
  }

  /**
   * Load entity data based on type
   * @param baseObject Base object
   * @param path Path part
   * @param entityType Entity type
   * @returns Loaded data
   */
  private async loadEntityData(
    baseObject: any,
    path: string,
    entityType: string
  ): Promise<any> {
    const cacheKey = this.generateCacheKey(baseObject, path, entityType);

    // Try to get from cache first
    const cachedData = await this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    let data: any;

    try {
      switch (entityType) {
        case 'ComplianceRequirement':
          data = await this.loadRequirements(baseObject);
          break;
        case 'AuditLog':
          data = await this.loadAuditLogs(baseObject);
          break;
        case 'Organization':
          data = await this.loadOrganization(baseObject);
          break;
        case 'User':
          data = await this.loadUser(baseObject, path);
          break;
        case 'Evidence':
          data = await this.loadEvidence(baseObject);
          break;
        default:
          this.logger.warn(`No loader for entity type: ${entityType}`);
          return null;
      }

      // Cache the result
      if (data) {
        await this.cacheService.set(cacheKey, data, this.CACHE_TTL);
      }

      return data;
    } catch (err) {
      this.logger.error(
        `Failed to load ${entityType} for ${path}: ${err.message}`
      );
      return null;
    }
  }

  /**
   * Generate cache key for lazy loading
   * @param baseObject Base object
   * @param path Path part
   * @param entityType Entity type
   * @returns Cache key
   */
  private generateCacheKey(
    baseObject: any,
    path: string,
    entityType: string
  ): string[] {
    const baseKey = this.getBaseCacheKey(baseObject);
    return [`lazy_load`, entityType, path, ...baseKey];
  }

  /**
   * Get base cache key for an object
   * @param obj Object
   * @returns Cache key parts
   */
  private getBaseCacheKey(obj: any): string[] {
    if (obj instanceof ComplianceCertification) {
      return ['certification', obj.id];
    } else if (obj instanceof ComplianceRequirement) {
      return ['requirement', obj.id];
    } else if (obj instanceof Organization) {
      return ['organization', obj.id];
    } else if (obj instanceof User) {
      return ['user', obj.id];
    } else if (obj.id) {
      return ['entity', obj.id];
    }
    return ['unknown'];
  }

  /**
   * Load requirements for a certification
   * @param certification Certification
   * @returns Requirements
   */
  private async loadRequirements(
    certification: ComplianceCertification
  ): Promise<ComplianceRequirement[]> {
    return this.requirementRepo.find({
      where: { certification: { id: certification.id } },
      relations: ['evidence', 'createdBy', 'updatedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Load audit logs for a certification
   * @param certification Certification
   * @returns Audit logs
   */
  private async loadAuditLogs(
    certification: ComplianceCertification
  ): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      where: { certification: { id: certification.id } },
      relations: ['user', 'certification'],
      order: { createdAt: 'DESC' },
      take: 50, // Limit to last 50 logs
    });
  }

  /**
   * Load organization for a certification
   * @param certification Certification
   * @returns Organization
   */
  private async loadOrganization(
    certification: ComplianceCertification
  ): Promise<Organization> {
    return this.orgRepo.findOne({
      where: { id: certification.organizationId },
      relations: ['users', 'certifications'],
    });
  }

  /**
   * Load user (createdBy/updatedBy)
   * @param obj Object with user reference
   * @param path Path (createdBy or updatedBy)
   * @returns User
   */
  private async loadUser(obj: any, path: string): Promise<User> {
    const userId = obj[`${path}Id`];
    if (!userId) return null;

    return this.userRepo.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
  }

  /**
   * Load evidence for a requirement
   * @param requirement Requirement
   * @returns Evidence
   */
  private async loadEvidence(
    requirement: ComplianceRequirement
  ): Promise<any[]> {
    // This would be implemented based on your evidence entity
    return [];
  }

  /**
   * Preload data for parallel lazy loading
   * @param path Path to preload
   * @param maxDepth Maximum depth
   */
  async preload(path: string, maxDepth: number): Promise<void> {
    // This would be implemented based on your specific preloading needs
    // For example, you might pre-fetch data that you know will be needed
    // based on the current request or user behavior patterns

    this.logger.log(`Preloading data for path: ${path}`);
    // Implementation would depend on your specific requirements
  }
}
```

### Request Debouncing

```typescript
// src/common/debounce.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Request } from 'express';
import { RedisCacheService } from '../cache/redis-cache.service';
import { performance } from 'perf_hooks';

@Injectable()
export class DebounceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DebounceInterceptor.name);
  private readonly DEFAULT_DEBOUNCE_TIME = 300; // 300ms default
  private readonly MAX_DEBOUNCE_TIME = 2000; // 2 seconds max
  private readonly DEBOUNCE_CACHE_TTL = 10; // 10 seconds

  constructor(private cacheService: RedisCacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    // Skip debouncing for certain requests
    if (this.shouldSkipDebounce(request)) {
      return next.handle();
    }

    // Generate a unique key for this request
    const debounceKey = this.generateDebounceKey(request);
    const debounceTime = this.getDebounceTime(request);

    // Check if this request is already being processed
    const isProcessing = await this.cacheService.get<boolean>(
      ['debounce', 'processing', debounceKey]
    );

    if (isProcessing) {
      this.logger.log(`Debouncing request: ${request.method} ${request.path}`);
      // Return cached response if available
      const cachedResponse = await this.cacheService.get<any>([
        'debounce',
        'response',
        debounceKey,
      ]);

      if (cachedResponse) {
        this.logger.log(`Returning cached response for ${debounceKey}`);
        response.status(cachedResponse.statusCode);
        return of(cachedResponse.body);
      }

      // If no cached response, wait for the original request to complete
      return new Observable((subscriber) => {
        const checkCompletion = async () => {
          const completedResponse = await this.cacheService.get<any>([
            'debounce',
            'response',
            debounceKey,
          ]);

          if (completedResponse) {
            subscriber.next(completedResponse.body);
            subscriber.complete();
          } else {
            // If still not complete after debounce time, proceed with the request
            setTimeout(() => {
              if (!subscriber.closed) {
                next.handle().subscribe({
                  next: (data) => subscriber.next(data),
                  complete: () => subscriber.complete(),
                });
              }
            }, debounceTime);
          }
        };

        // Check periodically for completion
        const interval = setInterval(checkCompletion, 50);
        return () => clearInterval(interval);
      });
    }

    // Mark this request as being processed
    await this.cacheService.set(
      ['debounce', 'processing', debounceKey],
      true,
      this.DEBOUNCE_CACHE_TTL
    );

    // Process the request with debounce
    return next.handle().pipe(
      tap({
        next: (data) => {
          // Cache the response
          this.cacheService.set(
            ['debounce', 'response', debounceKey],
            {
              statusCode: response.statusCode,
              body: data,
            },
            this.DEBOUNCE_CACHE_TTL
          );

          // Mark as not processing
          this.cacheService.set(
            ['debounce', 'processing', debounceKey],
            false,
            this.DEBOUNCE_CACHE_TTL
          );
        },
        error: (err) => {
          this.logger.error(`Debounced request failed: ${err.message}`);
          // Mark as not processing on error
          this.cacheService.set(
            ['debounce', 'processing', debounceKey],
            false,
            this.DEBOUNCE_CACHE_TTL
          );
        },
      }),
      debounceTime(debounceTime),
      distinctUntilChanged((prev, curr) => {
        // Simple comparison - could be enhanced based on specific needs
        return JSON.stringify(prev) === JSON.stringify(curr);
      })
    );
  }

  /**
   * Determine if debouncing should be skipped for this request
   * @param request Request object
   * @returns True if debouncing should be skipped
   */
  private shouldSkipDebounce(request: Request): boolean {
    // Skip for non-GET requests
    if (request.method !== 'GET') {
      return true;
    }

    // Skip for specific paths
    const skipPaths = [
      '/health',
      '/status',
      '/api-docs',
      '/auth',
      '/webhooks',
    ];

    return skipPaths.some((path) => request.path.startsWith(path));
  }

  /**
   * Generate a unique key for debouncing
   * @param request Request object
   * @returns Debounce key
   */
  private generateDebounceKey(request: Request): string {
    // Create a consistent key based on method, path, and query params
    const queryParams = Object.entries(request.query)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return `${request.method}:${request.path}?${queryParams}`;
  }

  /**
   * Get debounce time for this request
   * @param request Request object
   * @returns Debounce time in milliseconds
   */
  private getDebounceTime(request: Request): number {
    // Check for custom debounce time in headers
    const customDebounce = request.headers['x-debounce-time'];
    if (customDebounce) {
      const time = parseInt(customDebounce as string, 10);
      if (!isNaN(time) && time > 0 && time <= this.MAX_DEBOUNCE_TIME) {
        return time;
      }
    }

    // Check for debounce time in query params
    const queryDebounce = request.query.debounceTime;
    if (queryDebounce) {
      const time = parseInt(queryDebounce as string, 10);
      if (!isNaN(time) && time > 0 && time <= this.MAX_DEBOUNCE_TIME) {
        return time;
      }
    }

    // Return default debounce time
    return this.DEFAULT_DEBOUNCE_TIME;
  }
}

// src/common/debounce.module.ts
import { Module } from '@nestjs/common';
import { DebounceInterceptor } from './debounce.interceptor';
import { RedisCacheModule } from '../cache/redis-cache.module';

@Module({
  imports: [RedisCacheModule],
  providers: [DebounceInterceptor],
  exports: [DebounceInterceptor],
})
export class DebounceModule {}

// src/compliance-certification/compliance-certification.controller.ts
import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { DebounceInterceptor } from '../common/debounce.interceptor';
import { ComplianceCertificationService } from './compliance-certification.service';

@Controller('compliance-certifications')
@UseInterceptors(DebounceInterceptor)
export class ComplianceCertificationController {
  constructor(
    private readonly certificationService: ComplianceCertificationService
  ) {}

  @Get()
  async findAll(
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: string[],
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    return this.certificationService.findAll({
      organizationId,
      status,
      search,
      page,
      limit,
    });
  }

  @Get(':id')
  async findOne(@Query('id') id: string) {
    return this.certificationService.findOne(id);
  }
}
```

### Connection Pooling

```typescript
// src/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { DatabaseHealthIndicator } from './database.health';
import { ComplianceCertification } from '../compliance-certification/entities/compliance-certification.entity';
import { ComplianceRequirement } from '../compliance-certification/entities/compliance-requirement.entity';
import { AuditLog } from '../compliance-certification/entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [
          ComplianceCertification,
          ComplianceRequirement,
          AuditLog,
          User,
          Organization,
        ],
        synchronize: false, // Always false in production
        logging: configService.get('DB_LOGGING') === 'true',
        extra: {
          // Connection pool settings
          max: configService.get('DB_POOL_MAX') || 20, // Maximum number of clients in the pool
          min: configService.get('DB_POOL_MIN') || 4, // Minimum number of clients in the pool
          idleTimeoutMillis: configService.get('DB_POOL_IDLE_TIMEOUT') || 30000,
          connectionTimeoutMillis:
            configService.get('DB_POOL_CONNECTION_TIMEOUT') || 2000,
          maxUses: configService.get('DB_POOL_MAX_USES') || 7500, // Maximum number of queries per connection
          application_name: 'compliance-certification-service',
        },
      }),
    }),
    TypeOrmModule.forFeature([
      ComplianceCertification,
      ComplianceRequirement,
      AuditLog,
      User,
      Organization,
    ]),
  ],
  providers: [DatabaseService, DatabaseHealthIndicator],
  exports: [DatabaseService, DatabaseHealthIndicator, TypeOrmModule],
})
export class DatabaseModule {}

// src/database/database.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { Pool, PoolClient } from 'pg';
import { ConfigService } from '@nestjs/config';
import { performance } from 'perf_hooks';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly connectionPools: Map<string, Pool> = new Map();
  private readonly DEFAULT_POOL_NAME = 'default';
  private readonly QUERY_TIMEOUT = 10000; // 10 seconds

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    // Initialize default connection pool
    await this.createConnectionPool(this.DEFAULT_POOL_NAME);

    // Initialize read replica pool if configured
    if (this.configService.get('DB_READ_REPLICA_HOST')) {
      await this.createConnectionPool('read-replica');
    }

    // Set up connection monitoring
    this.setupConnectionMonitoring();
  }

  async onModuleDestroy() {
    // Close all connection pools
    for (const [name, pool] of this.connectionPools) {
      try {
        await pool.end();
        this.logger.log(`Closed connection pool: ${name}`);
      } catch (err) {
        this.logger.error(`Error closing connection pool ${name}: ${err.message}`);
      }
    }
  }

  /**
   * Create a new connection pool
   * @param name Pool name
   * @param configOverride Custom configuration
   */
  private async createConnectionPool(
    name: string,
    configOverride: Partial<{
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
      max: number;
      min: number;
    }> = {}
  ): Promise<Pool> {
    const config = {
      host: configOverride.host || this.configService.get('DB_HOST'),
      port: configOverride.port || this.configService.get('DB_PORT'),
      user: configOverride.user || this.configService.get('DB_USERNAME'),
      password: configOverride.password || this.configService.get('DB_PASSWORD'),
      database: configOverride.database || this.configService.get('DB_NAME'),
      max: configOverride.max || this.configService.get('DB_POOL_MAX') || 20,
      min: configOverride.min || this.configService.get('DB_POOL_MIN') || 4,
      idleTimeoutMillis:
        this.configService.get('DB_POOL_IDLE_TIMEOUT') || 30000,
      connectionTimeoutMillis:
        this.configService.get('DB_POOL_CONNECTION_TIMEOUT') || 2000,
      maxUses: this.configService.get('DB_POOL_MAX_USES') || 7500,
      application_name: `compliance-certification-service-${name}`,
    };

    const pool = new Pool(config);

    // Set up event listeners
    pool.on('connect', () => {
      this.logger.log(`New connection established to pool: ${name}`);
    });

    pool.on('acquire', (client) => {
      this.logger.debug(`Client acquired from pool: ${name}`);
    });

    pool.on('remove', (client) => {
      this.logger.debug(`Client removed from pool: ${name}`);
    });

    pool.on('error', (err, client) => {
      this.logger.error(`Connection pool error (${name}): ${err.message}`);
    });

    this.connectionPools.set(name, pool);
    this.logger.log(`Created connection pool: ${name}`);

    return pool;
  }

  /**
   * Get a connection pool by name
   * @param name Pool name
   * @returns Connection pool
   */
  private getConnectionPool(name: string = this.DEFAULT_POOL_NAME): Pool {
    const pool = this.connectionPools.get(name);
    if (!pool) {
      throw new Error(`Connection pool ${name} not found`);
    }
    return pool;
  }

  /**
   * Get a client from the connection pool
   * @param poolName Pool name
   * @returns Pool client
   */
  async getClient(poolName: string = this.DEFAULT_POOL_NAME): Promise<PoolClient> {
    const pool = this.getConnectionPool(poolName);
    return pool.connect();
  }

  /**
   * Execute a query with connection pooling
   * @param query SQL query
   * @param params Query parameters
   * @param poolName Pool name
   * @param timeout Query timeout in milliseconds
   * @returns Query result
   */
  async query<T = any>(
    query: string,
    params: any[] = [],
    poolName: string = this.DEFAULT_POOL_NAME,
    timeout: number = this.QUERY_TIMEOUT
  ): Promise<T> {
    const startTime = performance.now();
    const pool = this.getConnectionPool(poolName);

    try {
      // Set up query timeout
      const client = await pool.connect();
      try {
        await client.query('SET statement_timeout TO $1', [timeout]);

        const result = await client.query(query, params);
        const duration = performance.now() - startTime;

        this.logger.debug({
          message: 'Query executed successfully',
          query,
          params,
          duration,
          pool: poolName,
          rowCount: result.rowCount,
        });

        return result.rows;
      } finally {
        client.release();
      }
    } catch (err) {
      const duration = performance.now() - startTime;
      this.logger.error({
        message: 'Query execution failed',
        query,
        params,
        duration,
        pool: poolName,
        error: err.message,
      });

      // Classify the error
      if (err.message.includes('statement timeout')) {
        throw new Error(`Query timeout after ${timeout}ms`);
      } else if (err.message.includes('connection refused')) {
        throw new Error('Database connection refused');
      } else if (err.message.includes('too many clients')) {
        throw new Error('Database connection pool exhausted');
      } else {
        throw err;
      }
    }
  }

  /**
   * Execute a transaction
   * @param work Transaction work function
   * @param poolName Pool name
   * @param isolationLevel Transaction isolation level
   * @returns Transaction result
   */
  async transaction<T>(
    work: (queryRunner: QueryRunner) => Promise<T>,
    poolName: string = this.DEFAULT_POOL_NAME,
    isolationLevel:
      | 'READ UNCOMMITTED'
      | 'READ COMMITTED'
      | 'REPEATABLE READ'
      | 'SERIALIZABLE' = 'READ COMMITTED'
  ): Promise<T> {
    const pool = this.getConnectionPool(poolName);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);

      // Create a query runner that uses our pooled connection
      const queryRunner = this.dataSource.createQueryRunner();
      queryRunner['client'] = client; // Attach our client to the query runner

      try {
        const result = await work(queryRunner);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        queryRunner.release();
      }
    } finally {
      client.release();
    }
  }

  /**
   * Execute a batch of queries in a transaction
   * @param queries Array of queries
   * @param poolName Pool name
   * @returns Array of results
   */
  async batch(
    queries: Array<{ query: string; params?: any[] }>,
    poolName: string = this.DEFAULT_POOL_NAME
  ): Promise<any[]> {
    return this.transaction(async (queryRunner) => {
      const results = [];
      for (const { query, params } of queries) {
        const result = await queryRunner.query(query, params);
        results.push(result);
      }
      return results;
    }, poolName);
  }

  /**
   * Get connection pool statistics
   * @param poolName Pool name
   * @returns Pool statistics
   */
  async getPoolStats(poolName: string = this.DEFAULT_POOL_NAME): Promise<{
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
    maxConnections: number;
    minConnections: number;
  }> {
    const pool = this.getConnectionPool(poolName);
    return {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
      maxConnections: pool.options.max,
      minConnections: pool.options.min,
    };
  }

  /**
   * Check database health
   * @returns Health status
   */
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      responseTime: number;
      poolStats: ReturnType<typeof this.getPoolStats>;
      querySuccess: boolean;
    };
  }> {
    const startTime = performance.now();

    try {
      // Check pool stats
      const poolStats = await this.getPoolStats();

      // Execute a simple query
      const queryStart = performance.now();
      await this.query('SELECT 1', [], this.DEFAULT_POOL_NAME, 2000);
      const queryTime = performance.now() - queryStart;

      const responseTime = performance.now() - startTime;

      // Determine health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (
        poolStats.waitingClients > 5 ||
        poolStats.idleConnections === 0 ||
        queryTime > 1000 ||
        responseTime > 2000
      ) {
        status = 'degraded';
      }

      if (
        poolStats.waitingClients > 20 ||
        poolStats.totalConnections === poolStats.maxConnections ||
        queryTime > 5000
      ) {
        status = 'unhealthy';
      }

      return {
        status,
        details: {
          responseTime,
          poolStats,
          querySuccess: true,
        },
      };
    } catch (err) {
      const responseTime = performance.now() - startTime;
      return {
        status: 'unhealthy',
        details: {
          responseTime,
          poolStats: await this.getPoolStats(),
          querySuccess: false,
        },
      };
    }
  }

  /**
   * Set up connection monitoring
   */
  private setupConnectionMonitoring() {
    // Monitor connection pool stats
    setInterval(async () => {
      try {
        const stats = await this.getPoolStats();
        this.logger.log({
          message: 'Connection pool stats',
          ...stats,
        });

        // Alert if pool is getting full
        if (stats.waitingClients > 0) {
          this.logger.warn(
            `Connection pool has ${stats.waitingClients} waiting clients`
          );
        }
      } catch (err) {
        this.logger.error(`Failed to get pool stats: ${err.message}`);
      }
    }, 30000); // Every 30 seconds

    // Monitor query performance
    this.dataSource.query = new Proxy(this.dataSource.query, {
      apply: (target, thisArg, args) => {
        const startTime = performance.now();
        return target.apply(thisArg, args).then(
          (result) => {
            const duration = performance.now() - startTime;
            if (duration > 1000) {
              this.logger.warn({
                message: 'Slow query detected',
                query: args[0],
                duration,
                params: args[1],
              });
            }
            return result;
          },
          (err) => {
            const duration = performance.now() - startTime;
            this.logger.error({
              message: 'Query failed',
              query: args[0],
              duration,
              params: args[1],
              error: err.message,
            });
            throw err;
          }
        );
      },
    });
  }

  /**
   * Get a read-only connection (from read replica if available)
   * @returns Pool client
   */
  async getReadOnlyClient(): Promise<PoolClient> {
    if (this.connectionPools.has('read-replica')) {
      return this.getClient('read-replica');
    }
    return this.getClient();
  }

  /**
   * Execute a read-only query
   * @param query SQL query
   * @param params Query parameters
   * @param timeout Query timeout
   * @returns Query result
   */
  async readOnlyQuery<T = any>(
    query: string,
    params: any[] = [],
    timeout: number = this.QUERY_TIMEOUT
  ): Promise<T> {
    if (this.connectionPools.has('read-replica')) {
      return this.query(query, params, 'read-replica', timeout);
    }
    return this.query(query, params, this.DEFAULT_POOL_NAME, timeout);
  }
}
```

---

## Real-Time Features (350+ lines)

### WebSocket Server Setup

```typescript
// src/websocket/websocket.module.ts
import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { ComplianceCertificationModule } from '../compliance-certification/compliance-certification.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../cache/redis.module';
import { WebSocketAuthGuard } from './websocket-auth.guard';
import { WebSocketHealthIndicator } from './websocket.health';

@Module({
  imports: [ComplianceCertificationModule, AuthModule, RedisModule],
  providers: [
    WebSocketGateway,
    WebSocketService,
    WebSocketAuthGuard,
    WebSocketHealthIndicator,
  ],
  exports: [WebSocketService, WebSocketHealthIndicator],
})
export class WebSocketModule {}

// src/websocket/websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { WebSocketAuthGuard } from './websocket-auth.guard';
import { UseGuards } from '@nestjs/common';
import { ComplianceEvent } from './interfaces/compliance-event.interface';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 5000,
})
@UseGuards(WebSocketAuthGuard)
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly connectionMap = new Map<string, Socket>();
  private readonly userConnectionMap = new Map<string, Set<string>>();

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly authGuard: WebSocketAuthGuard
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.webSocketService.setServer(server);

    // Set up event listeners
    this.setupEventListeners();
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const clientId = client.id;

    this.logger.log(`Client connected: ${clientId} (User: ${userId})`);

    // Store connection
    this.connectionMap.set(clientId, client);

    // Map user to connections
    if (userId) {
      if (!this.userConnectionMap.has(userId)) {
        this.userConnectionMap.set(userId, new Set());
      }
      this.userConnectionMap.get(userId).add(clientId);
    }

    // Send welcome message
    client.emit('connected', {
      message: 'Successfully connected to compliance events',
      clientId,
      timestamp: new Date().toISOString(),
    });

    // Notify other clients about new connection
    this.server.emit('user-online', {
      userId,
      clientId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    const userId = this.getUserIdForClient(clientId);

    this.logger.log(`Client disconnected: ${clientId} (User: ${userId})`);

    // Remove from connection map
    this.connectionMap.delete(clientId);

    // Remove from user connection map
    if (userId && this.userConnectionMap.has(userId)) {
      const connections = this.userConnectionMap.get(userId);
      connections.delete(clientId);

      if (connections.size === 0) {
        this.userConnectionMap.delete(userId);
      }
    }

    // Notify other clients about disconnection
    this.server.emit('user-offline', {
      userId,
      clientId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { room: string; certificationId?: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.getUserIdForClient(client.id);
    this.logger.log(
      `Client ${client.id} (User: ${userId}) subscribing to room: ${data.room}`
    );

    try {
      // Validate subscription
      await this.webSocketService.validateSubscription(
        userId,
        data.room,
        data.certificationId
      );

      // Join the room
      client.join(data.room);

      // Store subscription
      await this.webSocketService.addSubscription(
        userId,
        client.id,
        data.room,
        data.certificationId
      );

      // Send confirmation
      client.emit('subscribed', {
        room: data.room,
        status: 'success',
        timestamp: new Date().toISOString(),
      });

      // Send current status
      if (data.certificationId) {
        const status = await this.webSocketService.getCertificationStatus(
          data.certificationId
        );
        client.emit('certification-status', status);
      }
    } catch (err) {
      this.logger.error(
        `Subscription failed for ${client.id}: ${err.message}`
      );
      client.emit('subscription-error', {
        room: data.room,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.getUserIdForClient(client.id);
    this.logger.log(
      `Client ${client.id} (User: ${userId}) unsubscribing from room: ${data.room}`
    );

    // Leave the room
    client.leave(data.room);

    // Remove subscription
    this.webSocketService.removeSubscription(userId, client.id, data.room);

    // Send confirmation
    client.emit('unsubscribed', {
      room: data.room,
      status: 'success',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('get-rooms')
  async handleGetRooms(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdForClient(client.id);
    const rooms = await this.webSocketService.getUserRooms(userId, client.id);

    client.emit('rooms', {
      rooms,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast a compliance event to all relevant clients
   * @param event Compliance event
   */
  async broadcastEvent(event: ComplianceEvent) {
    try {
      this.logger.log(`Broadcasting event: ${event.type}`);

      // Determine which rooms to broadcast to
      const rooms = await this.webSocketService.getEventRooms(event);

      // Broadcast to each room
      for (const room of rooms) {
        this.server.to(room).emit(event.type, event);
        this.logger.debug(`Broadcasted ${event.type} to room: ${room}`);
      }

      // Also broadcast to individual users if needed
      if (event.userIds && event.userIds.length > 0) {
        for (const userId of event.userIds) {
          const connections = this.userConnectionMap.get(userId);
          if (connections) {
            for (const clientId of connections) {
              const client = this.connectionMap.get(clientId);
              if (client) {
                client.emit(event.type, event);
              }
            }
          }
        }
      }
    } catch (err) {
      this.logger.error(`Failed to broadcast event: ${err.message}`);
    }
  }

  /**
   * Get user ID for a client
   * @param clientId Client ID
   * @returns User ID or undefined
   */
  private getUserIdForClient(clientId: string): string | undefined {
    for (const [userId, connections] of this.userConnectionMap.entries()) {
      if (connections.has(clientId)) {
        return userId;
      }
    }
    return undefined;
  }

  /**
   * Set up event listeners for the WebSocket server
   */
  private setupEventListeners() {
    // Handle errors
    this.server.on('error', (error) => {
      this.logger.error(`WebSocket server error: ${error.message}`);
    });

    // Handle new connections
    this.server.on('connection', (client) => {
      this.logger.debug(`New connection: ${client.id}`);

      // Set up client-specific listeners
      client.on('error', (error) => {
        this.logger.error(`Client ${client.id} error: ${error.message}`);
      });

      client.on('disconnecting', (reason) => {
        this.logger.debug(`Client ${client.id} disconnecting: ${reason}`);
      });
    });

    // Log server events
    this.server.engine.on('connection', (socket) => {
      this.logger.debug(`Engine connection: ${socket.id}`);
    });

    this.server.engine.on('connection_error', (err) => {
      this.logger.error(`Engine connection error: ${err.message}`);
    });
  }

  /**
   * Get all connected clients
   * @returns Array of connected clients
   */
  getConnectedClients(): Socket[] {
    return Array.from(this.connectionMap.values());
  }

  /**
   * Get all connected clients for a user
   * @param userId User ID
   * @returns Array of connected clients
   */
  getConnectedClientsForUser(userId: string): Socket[] {
    const connectionIds = this.userConnectionMap.get(userId);
    if (!connectionIds) return [];

    return Array.from(connectionIds)
      .map((id) => this.connectionMap.get(id))
      .filter((client): client is Socket => client !== undefined);
  }

  /**
   * Get connection count
   * @returns Connection count
   */
  getConnectionCount(): number {
    return this.connectionMap.size;
  }

  /**
   * Get user connection count
   * @returns User connection count
   */
  getUserConnectionCount(): number {
    return this.userConnectionMap.size;
  }
}
```

### Real-Time Event Handlers

```typescript
// src/websocket/websocket.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { RedisCacheService } from '../cache/redis-cache.service';
import { ComplianceCertificationService } from '../compliance-certification/compliance-certification.service';
import { ComplianceEvent } from './interfaces/compliance-event.interface';
import { ComplianceEventType } from './enums/compliance-event-type.enum';
import { ComplianceCertification } from '../compliance-certification/entities/compliance-certification.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server;
  private readonly SUBSCRIPTION_CACHE_TTL = 3600; // 1 hour
  private readonly EVENT_CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly certificationService: ComplianceCertificationService
  ) {}

  /**
   * Set the WebSocket server instance
   * @param server WebSocket server
   */
  setServer(server: Server) {
    this.server = server;
  }

  /**
   * Validate if a user can subscribe to a room
   * @param userId User ID
   * @param room Room name
   * @param certificationId Certification ID (optional)
   */
  async validateSubscription(
    userId: string,
    room: string,
    certificationId?: string
  ): Promise<void> {
    // Validate room format
    if (!room || typeof room !== 'string') {
      throw new Error('Invalid room name');
    }

    // Validate user
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Check if user has access to the certification
    if (certificationId) {
      const hasAccess = await this.certificationService.userHasAccess(
        userId,
        certificationId
      );

      if (!hasAccess) {
        throw new Error('User does not have access to this certification');
      }
    }

    // Additional validation based on room type
    if (room.startsWith('certification:')) {
      if (!certificationId) {
        throw new Error('Certification ID is required for certification rooms');
      }

      const certification = await this.certificationService.findOne(
        certificationId
      );

      if (!certification) {
        throw new Error('Certification not found');
      }
    } else if (room.startsWith('organization:')) {
      const orgId = room.split(':')[1];
      const user = await this.getUser(userId);

      if (user?.organizationId !== orgId) {
        throw new Error('User does not belong to this organization');
      }
    } else if (room.startsWith('user:')) {
      if (room !== `user:${userId}`) {
        throw new Error('User can only subscribe to their own user room');
      }
    }
  }

  /**
   * Add a subscription for a user
   * @param userId User ID
   * @param clientId Client ID
   * @param room Room name
   * @param certificationId Certification ID (optional)
   */
  async addSubscription(
    userId: string,
    clientId: string,
    room: string,
    certificationId?: string
  ): Promise<void> {
    const cacheKey = this.getSubscriptionCacheKey(userId, clientId);

    // Get existing subscriptions
    const subscriptions = await this.cacheService.get<string[]>(cacheKey) || [];

    // Add new subscription if not already present
    if (!subscriptions.includes(room)) {
      subscriptions.push(room);
      await this.cacheService.set(cacheKey, subscriptions, this.SUBSCRIPTION_CACHE_TTL);
    }

    // Also store certification-specific subscriptions
    if (certificationId) {
      const certCacheKey = this.getCertificationSubscriptionCacheKey(
        certificationId,
        userId
      );
      const certSubscriptions = await this.cacheService.get<string[]>(certCacheKey) || [];
      if (!certSubscriptions.includes(clientId)) {
        certSubscriptions.push(clientId);
        await this.cacheService.set(
          certCacheKey,
          certSubscriptions,
          this.SUBSCRIPTION_CACHE_TTL
        );
      }
    }
  }

  /**
   * Remove a subscription for a user
   * @param userId User ID
   * @param clientId Client ID
   * @param room Room name
   */
  async removeSubscription(
    userId: string,
    clientId: string,
    room: string
  ): Promise<void> {
    const cacheKey = this.getSubscriptionCacheKey(userId, clientId);

    // Get existing subscriptions
    const subscriptions = await this.cacheService.get<string[]>(cacheKey) || [];

    // Remove subscription
    const updatedSubscriptions = subscriptions.filter((r) => r !== room);
    await this.cacheService.set(cacheKey, updatedSubscriptions, this.SUBSCRIPTION_CACHE_TTL);

    // If this was a certification room, also remove from certification subscriptions
    if (room.startsWith('certification:')) {
      const certificationId = room.split(':')[1];
      const certCacheKey = this.getCertificationSubscriptionCacheKey(
        certificationId,
        userId
      );
      const certSubscriptions = await this.cacheService.get<string[]>(certCacheKey) || [];
      const updatedCertSubscriptions = certSubscriptions.filter((id) => id !== clientId);

      if (updatedCertSubscriptions.length > 0) {
        await this.cacheService.set(
          certCacheKey,
          updatedCertSubscriptions,
          this.SUBSCRIPTION_CACHE_TTL
        );
      } else {
        await this.cacheService.deleteByPattern(certCacheKey);
      }
    }
  }

  /**
   * Get all rooms a user is subscribed to
   * @param userId User ID
   * @param clientId Client ID
   * @returns Array of room names
   */
  async getUserRooms(userId: string, clientId: string): Promise<string[]> {
    const cacheKey = this.getSubscriptionCacheKey(userId, clientId);
    return (await this.cacheService.get<string[]>(cacheKey)) || [];
  }

  /**
   * Get all client IDs subscribed to a certification
   * @param certificationId Certification ID
   * @returns Array of client IDs
   */
  async getClientsForCertification(certificationId: string): Promise<string[]> {
    const cacheKey = this.getCertificationSubscriptionCacheKey(certificationId);
    const userSubscriptions = await this.cacheService.get<Record<string, string[]>>(cacheKey);

    if (!userSubscriptions) return [];

    // Flatten all client IDs
    return Object.values(userSubscriptions).flat();
  }

  /**
   * Get rooms that should receive an event
   * @param event Compliance event
   * @returns Array of room names
   */
  async getEventRooms(event: ComplianceEvent): Promise<string[]> {
    const rooms: Set<string> = new Set();

    // Add certification room if applicable
    if (event.certificationId) {
      rooms.add(`certification:${event.certificationId}`);
    }

    // Add organization room if applicable
    if (event.organizationId) {
      rooms.add(`organization:${event.organizationId}`);
    }

    // Add user rooms for specific users
    if (event.userIds && event.userIds.length > 0) {
      for (const userId of event.userIds) {
        rooms.add(`user:${userId}`);
      }
    }

    // Add global rooms for certain event types
    if (this.isGlobalEvent(event.type)) {
      rooms.add('global:compliance');
    }

    return Array.from(rooms);
  }

  /**
   * Check if an event should be broadcast globally
   * @param eventType Event type
   * @returns True if event is global
   */
  private isGlobalEvent(eventType: ComplianceEventType): boolean {
    const globalEvents = [
      ComplianceEventType.REGULATORY_CHANGE,
      ComplianceEventType.SYSTEM_ALERT,
      ComplianceEventType.MAINTENANCE,
    ];

    return globalEvents.includes(eventType);
  }

  /**
   * Create a compliance event
   * @param type Event type
   * @param payload Event payload
   * @param options Additional options
   * @returns Compliance event
   */
  createEvent(
    type: ComplianceEventType,
    payload: any,
    options: {
      certificationId?: string;
      organizationId?: string;
      userIds?: string[];
      timestamp?: Date;
    } = {}
  ): ComplianceEvent {
    return {
      type,
      payload,
      certificationId: options.certificationId,
      organizationId: options.organizationId,
      userIds: options.userIds || [],
      timestamp: options.timestamp || new Date(),
    };
  }

  /**
   * Broadcast a certification status change
   * @param certification Certification
   * @param previousStatus Previous status
   */
  async broadcastCertificationStatusChange(
    certification: ComplianceCertification,
    previousStatus: string
  ) {
    const event = this.createEvent(ComplianceEventType.CERTIFICATION_STATUS_CHANGE, {
      certificationId: certification.id,
      certificationName: certification.name,
      previousStatus,
      newStatus: certification.status,
      completionPercentage: certification.completionPercentage,
      dueDate: certification.dueDate,
      organizationId: certification.organizationId,
    }, {
      certificationId: certification.id,
      organizationId: certification.organizationId,
    });

    await this.broadcastEvent(event);
  }

  /**
   * Broadcast a requirement status change
   * @param requirement Requirement
   * @param certification Certification
   */
  async broadcastRequirementStatusChange(
    requirement: any,
    certification: ComplianceCertification
  ) {
    const event = this.createEvent(ComplianceEventType.REQUIREMENT_STATUS_CHANGE, {
      requirementId: requirement.id,
      requirementName: requirement.name,
      certificationId: certification.id,
      certificationName: certification.name,
      previousStatus: requirement.previousStatus,
      newStatus: requirement.status,
      organizationId: certification.organizationId,
    }, {
      certificationId: certification.id,
      organizationId: certification.organizationId,
    });

    await this.broadcastEvent(event);
  }

  /**
   * Broadcast a new evidence submission
   * @param evidence Evidence
   * @param requirement Requirement
   * @param certification Certification
   */
  async broadcastEvidenceSubmission(
    evidence: any,
    requirement: any,
    certification: ComplianceCertification
  ) {
    const event = this.createEvent(ComplianceEventType.EVIDENCE_SUBMITTED, {
      evidenceId: evidence.id,
      evidenceName: evidence.name,
      requirementId: requirement.id,
      requirementName: requirement.name,
      certificationId: certification.id,
      certificationName: certification.name,
      submittedBy: evidence.submittedBy,
      submittedAt: evidence.submittedAt,
      organizationId: certification.organizationId,
    }, {
      certificationId: certification.id,
      organizationId: certification.organizationId,
      userIds: [evidence.submittedBy],
    });

    await this.broadcastEvent(event);
  }

  /**
   * Broadcast a new audit log entry
   * @param auditLog Audit log
   * @param certification Certification
   */
  async broadcastAuditLog(
    auditLog: any,
    certification: ComplianceCertification
  ) {
    const event = this.createEvent(ComplianceEventType.AUDIT_LOG_CREATED, {
      auditLogId: auditLog.id,
      certificationId: certification.id,
      certificationName: certification.name,
      action: auditLog.action,
      performedBy: auditLog.performedBy,
      performedAt: auditLog.performedAt,
      details: auditLog.details,
      organizationId: certification.organizationId,
    }, {
      certificationId: certification.id,
      organizationId: certification.organizationId,
      userIds: [auditLog.performedBy],
    });

    await this.broadcastEvent(event);
  }

  /**
   * Broadcast a regulatory change
   * @param change Regulatory change
   * @param affectedCertifications Affected certifications
   */
  async broadcastRegulatoryChange(
    change: any,
    affectedCertifications: string[]
  ) {
    const event = this.createEvent(ComplianceEventType.REGULATORY_CHANGE, {
      changeId: change.id,
      title: change.title,
      description: change.description,
      effectiveDate: change.effectiveDate,
      jurisdiction: change.jurisdiction,
      affectedCertifications,
      organizationIds: change.affectedOrganizations || [],
    }, {
      organizationId: change.affectedOrganizations?.[0],
      userIds: change.notificationUsers || [],
    });

    await this.broadcastEvent(event);
  }

  /**
   * Broadcast a system alert
   * @param alert Alert information
   */
  async broadcastSystemAlert(alert: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    affectedComponents?: string[];
  }) {
    const event = this.createEvent(ComplianceEventType.SYSTEM_ALERT, {
      alertId: `alert-${Date.now()}`,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      timestamp: new Date().toISOString(),
      affectedComponents: alert.affectedComponents || [],
    });

    await this.broadcastEvent(event);
  }

  /**
   * Get current status of a certification
   * @param certificationId Certification ID
   * @returns Certification status
   */
  async getCertificationStatus(certificationId: string): Promise<any> {
    const cacheKey = ['certification', 'status', certificationId];

    // Try to get from cache first
    const cachedStatus = await this.cacheService.get<any>(cacheKey);
    if (cachedStatus) {
      return cachedStatus;
    }

    // Get fresh status
    const certification = await this.certificationService.findOne(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    const status = {
      certificationId: certification.id,
      name: certification.name,
      status: certification.status,
      completionPercentage: certification.completionPercentage,
      dueDate: certification.dueDate,
      lastUpdated: certification.updatedAt,
      requirements: {
        total: certification.requirementCount,
        completed: certification.completedRequirementCount,
        pending: certification.pendingRequirementCount,
      },
      organizationId: certification.organizationId,
    };

    // Cache the status
    await this.cacheService.set(cacheKey, status, this.EVENT_CACHE_TTL);

    return status;
  }

  /**
   * Get a user by ID
   * @param userId User ID
   * @returns User or null
   */
  private async getUser(userId: string): Promise<User | null> {
    const cacheKey = ['user', userId];
    const cachedUser = await this.cacheService.get<User>(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    // In a real implementation, you would fetch from the database
    // For this example, we'll return a mock user
    const user: User = {
      id: userId,
      name: `User ${userId}`,
      email: `user${userId}@example.com`,
      organizationId: `org-${Math.floor(Math.random() * 100)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.cacheService.set(cacheKey, user, this.EVENT_CACHE_TTL);
    return user;
  }

  /**
   * Get subscription cache key
   * @param userId User ID
   * @param clientId Client ID
   * @returns Cache key
   */
  private getSubscriptionCacheKey(userId: string, clientId: string): string[] {
    return ['websocket', 'subscriptions', userId, clientId];
  }

  /**
   * Get certification subscription cache key
   * @param certificationId Certification ID
   * @param userId User ID (optional)
   * @returns Cache key
   */
  private getCertificationSubscriptionCacheKey(
    certificationId: string,
    userId?: string
  ): string[] {
    if (userId) {
      return ['websocket', 'cert_subscriptions', certificationId, userId];
    }
    return ['websocket', 'cert_subscriptions', certificationId];
  }

  /**
   * Broadcast an event to all relevant clients
   * @param event Compliance event
   */
  async broadcastEvent(event: ComplianceEvent) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    try {
      // Get rooms for this event
      const rooms = await this.getEventRooms(event);

      // Broadcast to each room
      for (const room of rooms) {
        this.server.to(room).emit(event.type, event);
        this.logger.debug(`Broadcasted ${event.type} to room: ${room}`);
      }

      // Also broadcast to individual users if specified
      if (event.userIds && event.userIds.length > 0) {
        for (const userId of event.userIds) {
          this.server.to(`user:${userId}`).emit(event.type, event);
        }
      }

      // Cache the event for new subscribers
      if (event.certificationId) {
        const cacheKey = ['websocket', 'events', event.certificationId, event.type];
        await this.cacheService.set(cacheKey, event, this.EVENT_CACHE_TTL);
      }
    } catch (err) {
      this.logger.error(`Failed to broadcast event: ${err.message}`);
    }
  }

  /**
   * Get recent events for a certification
   * @param certificationId Certification ID
   * @param limit Maximum number of events to return
   * @returns Array of recent events
   */
  async getRecentEvents(
    certificationId: string,
    limit: number = 20
  ): Promise<ComplianceEvent[]> {
    const cacheKey = ['websocket', 'events', certificationId];
    const cachedEvents = await this.cacheService.get<ComplianceEvent[]>(cacheKey);

    if (cachedEvents) {
      return cachedEvents.slice(0, limit);
    }

    // In a real implementation, you would fetch from the database
    // For this example, we'll return an empty array
    return [];
  }
}
```

### Client-Side WebSocket Integration

```typescript
// src/websocket/websocket-client.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import { ComplianceEvent } from './interfaces/compliance-event.interface';
import { ComplianceEventType } from './enums/compliance-event-type.enum';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WebSocketClientService implements OnModuleDestroy {
  private readonly logger = new Logger(WebSocketClientService.name);
  private socket: Socket;
  private readonly eventSubject = new Subject<ComplianceEvent>();
  private readonly connectionStatus = new BehaviorSubject<boolean>(false);
  private readonly reconnectAttempts = new BehaviorSubject<number>(0);
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000; // 3 seconds
  private reconnectTimeout: NodeJS.Timeout;
  private readonly eventHandlers = new Map<
    ComplianceEventType,
    Array<(event: ComplianceEvent) => void>
  >();
  private readonly pendingSubscriptions = new Map<string, (success: boolean) => void>();
  private readonly pendingUnsubscriptions = new Map<string, (success: boolean) => void>();

  constructor(private readonly configService: ConfigService) {
    this.initializeSocket();
  }

  ngOnDestroy() {
    this.disconnect();
  }

  /**
   * Initialize the WebSocket connection
   */
  private initializeSocket() {
    const wsUrl = this.configService.get('WEBSOCKET_URL');
    if (!wsUrl) {
      this.logger.error('WebSocket URL not configured');
      return;
    }

    // Get authentication token
    const token = this.configService.get('WEBSOCKET_TOKEN') || this.getAuthToken();

    // Create socket with options
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false, // We'll handle reconnection manually
      query: {
        token,
        userId: this.configService.get('USER_ID'),
        clientId: uuidv4(),
      },
      withCredentials: true,
      timeout: 10000,
    });

    // Set up event listeners
    this.setupEventListeners();

    // Connect
    this.connect();
  }

  /**
   * Get authentication token (mock implementation)
   * @returns Authentication token
   */
  private getAuthToken(): string {
    // In a real application, this would get the current user's auth token
    return 'mock-token-' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Set up WebSocket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.logger.log('WebSocket connected');
      this.connectionStatus.next(true);
      this.reconnectAttempts.next(0);

      // Process pending subscriptions
      this.processPendingSubscriptions();
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.log(`WebSocket disconnected: ${reason}`);
      this.connectionStatus.next(false);

      // Attempt to reconnect
      this.scheduleReconnect();
    });

    this.socket.on('connect_error', (err) => {
      this.logger.error(`WebSocket connection error: ${err.message}`);
      this.connectionStatus.next(false);

      // Attempt to reconnect
      this.scheduleReconnect();
    });

    // System events
    this.socket.on('connected', (data) => {
      this.logger.log(`WebSocket connection established: ${data.message}`);
    });

    this.socket.on('user-online', (data) => {
      this.logger.debug(`User online: ${data.userId}`);
    });

    this.socket.on('user-offline', (data) => {
      this.logger.debug(`User offline: ${data.userId}`);
    });

    // Subscription events
    this.socket.on('subscribed', (data) => {
      this.logger.log(`Subscribed to room: ${data.room}`);
      const callback = this.pendingSubscriptions.get(data.room);
      if (callback) {
        callback(true);
        this.pendingSubscriptions.delete(data.room);
      }
    });

    this.socket.on('unsubscribed', (data) => {
      this.logger.log(`Unsubscribed from room: ${data.room}`);
      const callback = this.pendingUnsubscriptions.get(data.room);
      if (callback) {
        callback(true);
        this.pendingUnsubscriptions.delete(data.room);
      }
    });

    this.socket.on('subscription-error', (data) => {
      this.logger.error(`Subscription error for room ${data.room}: ${data.error}`);
      const callback = this.pendingSubscriptions.get(data.room);
      if (callback) {
        callback(false);
        this.pendingSubscriptions.delete(data.room);
      }
    });

    this.socket.on('rooms', (data) => {
      this.logger.debug(`Current rooms: ${data.rooms.join(', ')}`);
    });

    // Compliance events
    this.socket.onAny((eventName, eventData) => {
      if (this.isComplianceEvent(eventName)) {
        const event: ComplianceEvent = {
          type: eventName as ComplianceEventType,
          payload: eventData.payload,
          certificationId: eventData.certificationId,
          organizationId: eventData.organizationId,
          userIds: eventData.userIds,
          timestamp: new Date(eventData.timestamp),
        };

        // Emit to global event stream
        this.eventSubject.next(event);

        // Call specific event handlers
        const handlers = this.eventHandlers.get(event.type);
        if (handlers) {
          handlers.forEach((handler) => handler(event));
        }
      }
    });
  }

  /**
   * Check if an event name is a compliance event
   * @param eventName Event name
   * @returns True if it's a compliance event
   */
  private isComplianceEvent(eventName: string): boolean {
    return Object.values(ComplianceEventType).includes(eventName as ComplianceEventType);
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    if (!this.socket) {
      this.initializeSocket();
      return;
    }

    if (this.socket.connected) {
      this.logger.debug('WebSocket already connected');
      return;
    }

    this.logger.log('Connecting to WebSocket server...');
    this.socket.connect();
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.logger.log('Disconnecting from WebSocket server');
      this.socket.disconnect();
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect() {
    const currentAttempts = this.reconnectAttempts.value;

    if (currentAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.calculateReconnectDelay(currentAttempts);

    this.logger.log(`Attempting to reconnect in ${delay}ms (attempt ${currentAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts.next(currentAttempts + 1);
      this.connect();
    }, delay);
  }

  /**
   * Calculate reconnection delay with exponential backoff
   * @param attempt Current attempt number
   * @returns Delay in milliseconds
   */
  private calculateReconnectDelay(attempt: number): number {
    const baseDelay = this.RECONNECT_DELAY;
    const maxDelay = 30000; // 30 seconds max
    const delay = baseDelay * Math.pow(2, attempt);
    return Math.min(delay, maxDelay);
  }

  /**
   * Process pending subscriptions after reconnection
   */
  private processPendingSubscriptions() {
    // In a real implementation, you would track pending subscriptions
    // and resubscribe after reconnection
    this.logger.log('Processing pending subscriptions after reconnection');
  }

  /**
   * Subscribe to a room
   * @param room Room name
   * @param certificationId Certification ID (optional)
   * @returns Promise that resolves when subscription is confirmed
   */
  async subscribe(
    room: string,
    certificationId?: string
  ): Promise<boolean> {
    if (!this.socket || !this.socket.connected) {
      this.logger.warn('WebSocket not connected, cannot subscribe');
      return false;
    }

    return new Promise((resolve) => {
      this.pendingSubscriptions.set(room, resolve);
      this.socket.emit('subscribe', { room, certificationId });
    });
  }

  /**
   * Unsubscribe from a room
   * @param room Room name
   * @returns Promise that resolves when unsubscription is confirmed
   */
  async unsubscribe(room: string): Promise<boolean> {
    if (!this.socket || !this.socket.connected) {
      this.logger.warn('WebSocket not connected, cannot unsubscribe');
      return false;
    }

    return new Promise((resolve) => {
      this.pendingUnsubscriptions.set(room, resolve);
      this.socket.emit('unsubscribe', { room });
    });
  }

  /**
   * Get current rooms
   * @returns Promise that resolves with current rooms
   */
  async getRooms(): Promise<string[]> {
    if (!this.socket || !this.socket.connected) {
      this.logger.warn('WebSocket not connected, cannot get rooms');
      return [];
    }

    return new Promise((resolve) => {
      const callback = (data: { rooms: string[] }) => {
        this.socket.off('rooms', callback);
        resolve(data.rooms);
      };

      this.socket.on('rooms', callback);
      this.socket.emit('get-rooms');
    });
  }

  /**
   * Get the global event observable
   * @returns Observable of compliance events
   */
  get events$(): Observable<ComplianceEvent> {
    return this.eventSubject.asObservable().pipe(shareReplay(1));
  }

  /**
   * Get connection status observable
   * @returns Observable of connection status
   */
  get connectionStatus$(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  /**
   * Get reconnect attempts observable
   * @returns Observable of reconnect attempts
   */
  get reconnectAttempts$(): Observable<number> {
    return this.reconnectAttempts.asObservable();
  }

  /**
   * Subscribe to specific event types
   * @param eventType Event type
   * @param handler Event handler
   * @returns Function to unsubscribe
   */
  onEvent(
    eventType: ComplianceEventType,
    handler: (event: ComplianceEvent) => void
  ): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    const handlers = this.eventHandlers.get(eventType);
    handlers.push(handler);

    return () => {
      const updatedHandlers = handlers.filter((h) => h !== handler);
      this.eventHandlers.set(eventType, updatedHandlers);
    };
  }

  /**
   * Get events of a specific type
   * @param eventType Event type
   * @returns Observable of specific events
   */
  getEvents$(eventType: ComplianceEventType): Observable<ComplianceEvent> {
    return this.events$.pipe(
      filter((event) => event.type === eventType),
      shareReplay(1)
    );
  }

  /**
   * Get certification status updates
   * @param certificationId Certification ID
   * @returns Observable of certification status events
   */
  getCertificationStatus$(certificationId: string): Observable<any> {
    return this.getEvents$(ComplianceEventType.CERTIFICATION_STATUS_CHANGE).pipe(
      filter((event) => event.certificationId === certificationId),
      map((event) => event.payload)
    );
  }

  /**
   * Get requirement status updates
   * @param certificationId Certification ID
   * @returns Observable of requirement status events
   */
  getRequirementStatus$(certificationId: string): Observable<any> {
    return this.getEvents$(ComplianceEventType.REQUIREMENT_STATUS_CHANGE).pipe(
      filter((event) => event.certificationId === certificationId),
      map((event) => event.payload)
    );
  }

  /**
   * Get evidence submission events
   * @param certificationId Certification ID
   * @returns Observable of evidence submission events
   */
  getEvidenceSubmissions$(certificationId: string): Observable<any> {
    return this.getEvents$(ComplianceEventType.EVIDENCE_SUBMITTED).pipe(
      filter((event) => event.certificationId === certificationId),
      map((event) => event.payload)
    );
  }

  /**
   * Get audit log events
   * @param certificationId Certification ID
   * @returns Observable of audit log events
   */
  getAuditLogs$(certificationId: string): Observable<any> {
    return this.getEvents$(ComplianceEventType.AUDIT_LOG_CREATED).pipe(
      filter((event) => event.certificationId === certificationId),
      map((event) => event.payload)
    );
  }

  /**
   * Get regulatory change events
   * @returns Observable of regulatory change events
   */
  getRegulatoryChanges$(): Observable<any> {
    return this.getEvents$(ComplianceEventType.REGULATORY_CHANGE).pipe(
      map((event) => event.payload)
    );
  }

  /**
   * Get system alert events
   * @returns Observable of system alert events
   */
  getSystemAlerts$(): Observable<any> {
    return this.getEvents$(ComplianceEventType.SYSTEM_ALERT).pipe(
      map((event) => event.payload)
    );
  }

  /**
   * Send a ping to the server
   */
  ping() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Get current connection state
   * @returns Connection state
   */
  getConnectionState(): {
    connected: boolean;
    reconnectAttempts: number;
    lastError?: string;
  } {
    return {
      connected: this.connectionStatus.value,
      reconnectAttempts: this.reconnectAttempts.value,
      lastError: this.socket?.io?.engine?.transport?.websocket?.lastError?.message,
    };
  }
}
```

### Room/Channel Management

```typescript
// src/websocket/room-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from '../cache/redis-cache.service';
import { ComplianceCertificationService } from '../compliance-certification/compliance-certification.service';
import { OrganizationService } from '../organizations/organization.service';
import { UserService } from '../users/user.service';
import { WebSocketGateway } from './websocket.gateway';

@Injectable()
export class RoomManagerService {
  private readonly logger = new Logger(RoomManagerService.name);
  private readonly ROOM_CACHE_TTL = 86400; // 24 hours
  private readonly MEMBER_CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly certificationService: ComplianceCertificationService,
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
    private readonly webSocketGateway: WebSocketGateway
  ) {}

  /**
   * Create a room for a certification
   * @param certificationId Certification ID
   * @returns Room name
   */
  async createCertificationRoom(certificationId: string): Promise<string> {
    const roomName = `certification:${certificationId}`;

    // Check if certification exists
    const certification = await this.certificationService.findOne(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    // Initialize room in cache
    await this.cacheService.set(
      this.getRoomCacheKey(roomName),
      {
        type: 'certification',
        certificationId,
        organizationId: certification.organizationId,
        createdAt: new Date().toISOString(),
      },
      this.ROOM_CACHE_TTL
    );

    this.logger.log(`Created room: ${roomName}`);
    return roomName;
  }

  /**
   * Create a room for an organization
   * @param organizationId Organization ID
   * @returns Room name
   */
  async createOrganizationRoom(organizationId: string): Promise<string> {
    const roomName = `organization:${organizationId}`;

    // Check if organization exists
    const organization = await this.organizationService.findOne(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Initialize room in cache
    await this.cacheService.set(
      this.getRoomCacheKey(roomName),
      {
        type: 'organization',
        organizationId,
        createdAt: new Date().toISOString(),
      },
      this.ROOM_CACHE_TTL
    );

    this.logger.log(`Created room: ${roomName}`);
    return roomName;
  }

  /**
   * Create a room for a user
   * @param userId User ID
   * @returns Room name
   */
  async createUserRoom(userId: string): Promise<string> {
    const roomName = `user:${userId}`;

    // Check if user exists
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Initialize room in cache
    await this.cacheService.set(
      this.getRoomCacheKey(roomName),
      {
        type: 'user',
        userId,
        organizationId: user.organizationId,
        createdAt: new Date().toISOString(),
      },
      this.ROOM_CACHE_TTL
    );

    this.logger.log(`Created room: ${roomName}`);
    return roomName;
  }

  /**
   * Create a global room
   * @param roomName Global room name
   * @returns Room name
   */
  async createGlobalRoom(roomName: string): Promise<string> {
    if (!roomName.startsWith('global:')) {
      roomName = `global:${roomName}`;
    }

    // Initialize room in cache
    await this.cacheService.set(
      this.getRoomCacheKey(roomName),
      {
        type: 'global',
        createdAt: new Date().toISOString(),
      },
      this.ROOM_CACHE_TTL
    );

    this.logger.log(`Created global room: ${roomName}`);
    return roomName;
  }

  /**
   * Add a member to a room
   * @param roomName Room name
   * @param userId User ID
   * @param clientId Client ID
   */
  async addRoomMember(
    roomName: string,
    userId: string,
    clientId: string
  ): Promise<void> {
    // Check if room exists
    const room = await this.getRoom(roomName);
    if (!room) {
      throw new Error('Room not found');
    }

    // Add member to room
    const memberKey = this.getMemberCacheKey(roomName, userId, clientId);
    await this.cacheService.set(
      memberKey,
      {
        userId,
        clientId,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      },
      this.MEMBER_CACHE_TTL
    );

    // Add to room's member list
    const roomMembersKey = this.getRoomMembersCacheKey(roomName);
    const members = await this.cacheService.get<string[]>(roomMembersKey) || [];
    if (!members.includes(clientId)) {
      members.push(clientId);
      await this.cacheService.set(roomMembersKey, members, this.ROOM_CACHE_TTL);
    }

    this.logger.debug(`Added member ${clientId} to room: ${roomName}`);
  }

  /**
   * Remove a member from a room
   * @param roomName Room name
   * @param userId User ID
   * @param clientId Client ID
   */
  async removeRoomMember(
    roomName: string,
    userId: string,
    clientId: string
  ): Promise<void> {
    // Remove member from room
    const memberKey = this.getMemberCacheKey(roomName, userId, clientId);
    await this.cacheService.deleteByPattern(memberKey);

    // Remove from room's member list
    const roomMembersKey = this.getRoomMembersCacheKey(roomName);
    const members = await this.cacheService.get<string[]>(roomMembersKey) || [];
    const updatedMembers = members.filter((id) => id !== clientId);

    if (updatedMembers.length > 0) {
      await this.cacheService.set(roomMembersKey, updatedMembers, this.ROOM_CACHE_TTL);
    } else {
      await this.cacheService.deleteByPattern(roomMembersKey);
    }

    this.logger.debug(`Removed member ${clientId} from room: ${roomName}`);
  }

  /**
   * Get all members of a room
   * @param roomName Room name
   * @returns Array of member information
   */
  async getRoomMembers(roomName: string): Promise<Array<{
    userId: string;
    clientId: string;
    joinedAt: string;
    lastActive: string;
  }>> {
    const roomMembersKey = this.getRoomMembersCacheKey(roomName);
    const clientIds = await this.cacheService.get<string[]>(roomMembersKey) || [];

    const members = await Promise.all(
      clientIds.map(async (clientId) => {
        const userId = await this.getUserIdForClient(roomName, clientId);
        const memberKey = this.getMemberCacheKey(roomName, userId, clientId);
        return this.cacheService.get<any>(memberKey);
      })
    );

    return members.filter((member): member is any => member !== null);
  }

  /**
   * Get all rooms for a user
   * @param userId User ID
   * @returns Array of room names
   */
  async getUserRooms(userId: string): Promise<string[]> {
    const pattern = this.getMemberCacheKeyPattern(userId);
    const keys = await this.cacheService.keys(pattern);

    // Extract room names from keys
    const roomNames = new Set<string>();
    for (const key of keys) {
      const parts = key.split(':');
      if (parts.length >= 4) {
        roomNames.add(`${parts[2]}:${parts[3]}`);
      }
    }

    return Array.from(roomNames);
  }

  /**
   * Get all rooms for a client
   * @param clientId Client ID
   * @returns Array of room names
   */
  async getClientRooms(clientId: string): Promise<string[]> {
    const pattern = this.getMemberCacheKeyPattern(undefined, clientId);
    const keys = await this.cacheService.keys(pattern);

    // Extract room names from keys
    const roomNames = new Set<string>();
    for (const key of keys) {
      const parts = key.split(':');
      if (parts.length >= 4) {
        roomNames.add(`${parts[2]}:${parts[3]}`);
      }
    }

    return Array.from(roomNames);
  }

  /**
   * Get room information
   * @param roomName Room name
   * @returns Room information or null if not found
   */
  async getRoom(roomName: string): Promise<{
    type: string;
    certificationId?: string;
    organizationId?: string;
    userId?: string;
    createdAt: string;
  } | null> {
    return this.cacheService.get(this.getRoomCacheKey(roomName));
  }

  /**
   * Get all rooms
   * @returns Array of room information
   */
  async getAllRooms(): Promise<Array<{
    name: string;
    type: string;
    certificationId?: string;
    organizationId?: string;
    userId?: string;
    createdAt: string;
    memberCount: number;
  }>> {
    const pattern = this.getRoomCacheKeyPattern();
    const keys = await this.cacheService.keys(pattern);

    const rooms = await Promise.all(
      keys.map(async (key) => {
        const room = await this.cacheService.get<any>(key);
        const roomName = key.split(':').slice(2).join(':');
        const memberCount = await this.getRoomMemberCount(roomName);
        return { name: roomName, ...room, memberCount };
      })
    );

    return rooms.filter((room): room is any => room !== null);
  }

  /**
   * Get number of members in a room
   * @param roomName Room name
   * @returns Member count
   */
  async getRoomMemberCount(roomName: string): Promise<number> {
    const roomMembersKey = this.getRoomMembersCacheKey(roomName);
    const members = await this.cacheService.get<string[]>(roomMembersKey);
    return members ? members.length : 0;
  }

  /**
   * Check if a user is a member of a room
   * @param roomName Room name
   * @param userId User ID
   * @param clientId Client ID (optional)
   * @returns True if user is a member
   */
  async isRoomMember(
    roomName: string,
    userId: string,
    clientId?: string
  ): Promise<boolean> {
    if (clientId) {
      const memberKey = this.getMemberCacheKey(roomName, userId, clientId);
      const member = await this.cacheService.get(memberKey);
      return member !== null;
    } else {
      const pattern = this.getMemberCacheKeyPattern(userId);
      const keys = await this.cacheService.keys(pattern);
      return keys.some((key) => key.includes(roomName));
    }
  }

  /**
   * Update member last active time
   * @param roomName Room name
   * @param userId User ID
   * @param clientId Client ID
   */
  async updateMemberActivity(
    roomName: string,
    userId: string,
    clientId: string
  ): Promise<void> {
    const memberKey = this.getMemberCacheKey(roomName, userId, clientId);
    const member = await this.cacheService.get<any>(memberKey);

    if (member) {
      member.lastActive = new Date().toISOString();
      await this.cacheService.set(memberKey, member, this.MEMBER_CACHE_TTL);
    }
  }

  /**
   * Get user ID for a client in a room
   * @param roomName Room name
   * @param clientId Client ID
   * @returns User ID or null if not found
   */
  private async getUserIdForClient(
    roomName: string,
    clientId: string
  ): Promise<string | null> {
    const pattern = this.getMemberCacheKeyPattern(undefined, clientId);
    const keys = await this.cacheService.keys(pattern);

    for (const key of keys) {
      if (key.includes(roomName)) {
        const parts = key.split(':');
        if (parts.length >= 5) {
          return parts[4];
        }
      }
    }

    return null;
  }

  /**
   * Get cache key for room information
   * @param roomName Room name
   * @returns Cache key
   */
  private getRoomCacheKey(roomName: string): string[] {
    return ['websocket', 'rooms', roomName];
  }

  /**
   * Get cache key pattern for rooms
   * @returns Cache key pattern
   */
  private getRoomCacheKeyPattern(): string[] {
    return ['websocket', 'rooms', '*'];
  }

  /**
   * Get cache key for room members
   * @param roomName Room name
   * @returns Cache key
   */
  private getRoomMembersCacheKey(roomName: string): string[] {
    return ['websocket', 'room_members', roomName];
  }

  /**
   * Get cache key for a room member
   * @param roomName Room name
   * @param userId User ID
   * @param clientId Client ID
   * @returns Cache key
   */
  private getMemberCacheKey(
    roomName: string,
    userId: string,
    clientId: string
  ): string[] {
    return ['websocket', 'members', roomName, clientId, userId];
  }

  /**
   * Get cache key pattern for members
   * @param userId User ID (optional)
   * @param clientId Client ID (optional)
   * @returns Cache key pattern
   */
  private getMemberCacheKeyPattern(
    userId?: string,
    clientId?: string
  ): string[] {
    if (userId && clientId) {
      return ['websocket', 'members', '*', clientId, userId];
    } else if (userId) {
      return ['websocket', 'members', '*', '*', userId];
    } else if (clientId) {
      return ['websocket', 'members', '*', clientId, '*'];
    } else {
      return ['websocket', 'members', '*', '*', '*'];
    }
  }

  /**
   * Clean up inactive rooms
   */
  async cleanupInactiveRooms(): Promise<void> {
    const rooms = await this.getAllRooms();

    for (const room of rooms) {
      const memberCount = await this.getRoomMemberCount(room.name);

      // Delete rooms with no members that are older than 1 hour
      if (memberCount === 0) {
        const createdAt = new Date(room.createdAt);
        const now = new Date();
        const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (ageInHours > 1) {
          await this.deleteRoom(room.name);
          this.logger.log(`Deleted inactive room: ${room.name}`);
        }
      }
    }
  }

  /**
   * Delete a room
   * @param roomName Room name
   */
  async deleteRoom(roomName: string): Promise<void> {
    // Remove all members
    const members = await this.getRoomMembers(roomName);
    for (const member of members) {
      await this.removeRoomMember(roomName, member.userId, member.clientId);
    }

    // Remove room
    await this.cacheService.deleteByPattern(this.getRoomCacheKey(roomName));
    await this.cacheService.deleteByPattern(this.getRoomMembersCacheKey(roomName));

    this.logger.log(`Deleted room: ${roomName}`);
  }

  /**
   * Get room statistics
   * @returns Room statistics
   */
  async getRoomStatistics(): Promise<{
    totalRooms: number;
    totalMembers: number;
    roomsByType: Record<string, number>;
    membersByRoomType: Record<string, number>;
  }> {
    const rooms = await this.getAllRooms();
    const roomsByType: Record<string, number> = {};
    const membersByRoomType: Record<string, number> = {};

    let totalMembers = 0;

    for (const room of rooms) {
      // Count rooms by type
      roomsByType[room.type] = (roomsByType[room.type] || 0) + 1;

      // Count members by room type
      membersByRoomType[room.type] =
        (membersByRoomType[room.type] || 0) + room.memberCount;

      totalMembers += room.memberCount;
    }

    return {
      totalRooms: rooms.length,
      totalMembers,
      roomsByType,
      membersByRoomType,
    };
  }

  /**
   * Get active rooms (with members)
   * @returns Array of active rooms
   */
  async getActiveRooms(): Promise<Array<{
    name: string;
    type: string;
    memberCount: number;
    members: Array<{
      userId: string;
      clientId: string;
      lastActive: string;
    }>;
  }>> {
    const rooms = await this.getAllRooms();
    const activeRooms = rooms.filter((room) => room.memberCount > 0);

    return Promise.all(
      activeRooms.map(async (room) => {
        const members = await this.getRoomMembers(room.name);
        return {
          ...room,
          members: members.map((member) => ({
            userId: member.userId,
            clientId: member.clientId,
            lastActive: member.lastActive,
          })),
        };
      })
    );
  }

  /**
   * Broadcast a message to all rooms of a certain type
   * @param roomType Room type
   * @param event Event name
   * @param data Event data
   */
  async broadcastToRoomType(
    roomType: string,
    event: string,
    data: any
  ): Promise<void> {
    const rooms = await this.getAllRooms();
    const typeRooms = rooms.filter((room) => room.type === roomType);

    for (const room of typeRooms) {
      this.webSocketGateway.server.to(room.name).emit(event, data);
    }
  }
}
```

### Reconnection Logic

```typescript
// src/websocket/reconnection.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { RoomManagerService } from './room-manager.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { ComplianceEvent } from './interfaces/compliance-event.interface';
import { ComplianceEventType } from './enums/compliance-event-type.enum';

@Injectable()
export class ReconnectionService {
  private readonly logger = new Logger(ReconnectionService.name);
  private readonly RECONNECTION_CACHE_TTL = 3600; // 1 hour
  private readonly MAX_RECONNECTION_ATTEMPTS = 3;
  private readonly RECONNECTION_DELAY = 5000; // 5 seconds

  constructor(
    private readonly webSocketGateway: WebSocketGateway,
    private readonly webSocketService: WebSocketService,
    private readonly roomManager: RoomManagerService,
    private readonly cacheService: RedisCacheService
  ) {}

  /**
   * Handle client reconnection
   * @param clientId Client ID
   * @param userId User ID
   */
  async handleReconnection(clientId: string, userId: string): Promise<void> {
    this.logger.log(`Handling reconnection for client: ${clientId} (User: ${userId})`);

    try {
      // Get the client's previous state
      const previousState = await this.getClientState(clientId);

      if (!previousState) {
        this.logger.warn(`No previous state found for client: ${clientId}`);
        return;
      }

      // Rejoin rooms
      await this.rejoinRooms(clientId, userId, previousState.rooms);

      // Resend missed events
      await this.resendMissedEvents(clientId, userId, previousState.lastEventId);

      // Update connection status
      await this.updateConnectionStatus(clientId, userId, true);

      this.logger.log(`Reconnection completed for client: ${clientId}`);
    } catch (err) {
      this.logger.error(`Reconnection failed for client ${clientId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Handle client disconnection
   * @param clientId Client ID
   * @param userId User ID
   */
  async handleDisconnection(clientId: string, userId: string): Promise<void> {
    this.logger.log(`Handling disconnection for client: ${clientId} (User: ${userId})`);

    try {
      // Store client state for potential reconnection
      await this.storeClientState(clientId, userId);

      // Update connection status
      await this.updateConnectionStatus(clientId, userId, false);

      this.logger.log(`Disconnection handled for client: ${clientId}`);
    } catch (err) {
      this.logger.error(`Disconnection handling failed for client ${clientId}: ${err.message}`);
    }
  }

  /**
   * Store client state for potential reconnection
   * @param clientId Client ID
   * @param userId User ID
   */
  private async storeClientState(clientId: string, userId: string): Promise<void> {
    // Get current rooms
    const rooms = await this.roomManager.getClientRooms(clientId);

    // Get last event ID (simplified - in a real app you'd track this)
    const lastEventId = await this.getLastEventId(userId);

    // Store state
    await this.cacheService.set(
      this.getClientStateCacheKey(clientId),
      {
        clientId,
        userId,
        rooms,
        lastEventId,
        disconnectedAt: new Date().toISOString(),
        reconnectionAttempts: 0,
      },
      this.RECONNECTION_CACHE_TTL
    );
  }

  /**
   * Get client state for reconnection
   * @param clientId Client ID
   * @returns Client state or null if not found
   */
  private async getClientState(clientId: string): Promise<{
    clientId: string;
    userId: string;
    rooms: string[];
    lastEventId: string;
    disconnectedAt: string;
    reconnectionAttempts: number;
  } | null> {
    return this.cacheService.get(this.getClientStateCacheKey(clientId));
  }

  /**
   * Rejoin rooms after reconnection
   * @param clientId Client ID
   * @param userId User ID
   * @param rooms Rooms to rejoin
   */
  private async rejoinRooms(
    clientId: string,
    userId: string,
    rooms: string[]
  ): Promise<void> {
    for (const room of rooms) {
      try {
        // Rejoin the room
        const client = this.webSocketGateway.getConnectedClients().find(
          (c) => c.id === clientId
        );

        if (client) {
          client.join(room);
          await this.roomManager.addRoomMember(room, userId, clientId);
          this.logger.debug(`Rejoined room ${room} for client ${clientId}`);
        }
      } catch (err) {
        this.logger.error(`Failed to rejoin room ${room} for client ${clientId}: ${err.message}`);
      }
    }
  }

  /**
   * Resend missed events after reconnection
   * @param clientId Client ID
   * @param userId User ID
   * @param lastEventId Last event ID received
   */
  private async resendMissedEvents(
    clientId: string,
    userId: string,
    lastEventId: string
  ): Promise<void> {
    try {
      // Get all rooms the client is in
      const rooms = await this.roomManager.getClientRooms(clientId);

      // Get missed events for each room
      const missedEvents = await this.getMissedEvents(rooms, lastEventId);

      if (missedEvents.length === 0) {
        this.logger.debug(`No missed events for client ${clientId}`);
        return;
      }

      // Send missed events to the client
      const client = this.webSocketGateway.getConnectedClients().find(
        (c) => c.id === clientId
      );

      if (client) {
        for (const event of missedEvents) {
          client.emit(event.type, event);
        }

        this.logger.log(
          `Sent ${missedEvents.length} missed events to client ${clientId}`
        );
      }
    } catch (err) {
      this.logger.error(`Failed to resend missed events to client ${clientId}: ${err.message}`);
    }
  }

  /**
   * Get missed events for a set of rooms
   * @param rooms Rooms to check
   * @param lastEventId Last event ID received
   * @returns Array of missed events
   */
  private async getMissedEvents(
    rooms: string[],
    lastEventId: string
  ): Promise<ComplianceEvent[]> {
    const missedEvents: ComplianceEvent[] = [];

    for (const room of rooms) {
      // Get recent events for this room
      const roomEvents = await this.webSocketService.getRecentEvents(
        this.extractCertificationId(room)
      );

      // Filter events that occurred after the last received event
      const newEvents = roomEvents.filter(
        (event) => event.timestamp > new Date(lastEventId)
      );

      missedEvents.push(...newEvents);
    }

    // Sort by timestamp
    missedEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return missedEvents;
  }

  /**
   * Extract certification ID from room name
   * @param roomName Room name
   * @returns Certification ID or undefined
   */
  private extractCertificationId(roomName: string): string | undefined {
    if (roomName.startsWith('certification:')) {
      return roomName.split(':')[1];
    }
    return undefined;
  }

  /**
   * Get last event ID for a user
   * @param userId User ID
   * @returns Last event ID
   */
  private async getLastEventId(userId: string): Promise<string> {
    // In a real implementation, you would track the last event ID per user
    // For this example, we