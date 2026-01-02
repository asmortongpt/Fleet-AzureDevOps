# TO_BE_DESIGN.md - Reporting-Analytics Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Status:** APPROVED

---

## Executive Vision (120 lines)

### Strategic Transformation Goals

The enhanced reporting-analytics module represents a paradigm shift in how organizations derive value from their data assets. Our vision is to transform this module from a static reporting tool into a dynamic, intelligent decision-making platform that:

1. **Democratizes Data Insights**: By implementing natural language query interfaces and AI-driven recommendations, we will make advanced analytics accessible to non-technical users across the organization. This aligns with our goal of reducing the "time-to-insight" from days to seconds.

2. **Enables Predictive Decision Making**: Moving beyond retrospective analysis, the system will incorporate machine learning models that provide forward-looking insights. For example, customer churn prediction models will help sales teams proactively retain at-risk accounts.

3. **Creates a Data-Driven Culture**: Through gamification elements and real-time dashboards, we will foster healthy competition and continuous improvement across teams. The leaderboard system will make performance metrics visible and engaging.

4. **Breaks Down Data Silos**: The system will integrate with 12+ enterprise systems (CRM, ERP, HRIS, etc.) to provide a unified view of organizational performance. This 360-degree perspective will eliminate departmental blind spots.

5. **Supports Scalable Growth**: The architecture will be designed to handle 10x current data volumes while maintaining sub-second response times. This scalability will support our global expansion plans.

### Business Impact Projections

| Metric | Current State | Target State | Improvement |
|--------|---------------|--------------|-------------|
| Report Generation Time | 2-4 hours | <1 minute | 99% reduction |
| Data Accuracy | 92% | 99.9% | 7.9% improvement |
| User Adoption | 45% | 95% | 111% increase |
| Decision Speed | 3-5 days | Real-time | 99% faster |
| Operational Costs | $2.1M/year | $1.2M/year | 43% reduction |
| Customer Retention | 82% | 89% | 7% increase |

### Competitive Advantages

1. **Real-Time Competitive Intelligence**: Unlike competitors who provide daily or weekly reports, our system will deliver real-time market intelligence through WebSocket connections to external data sources.

2. **AI-Powered Insight Generation**: While most analytics tools require users to know what questions to ask, our system will proactively suggest insights through anomaly detection and pattern recognition.

3. **Embedded Analytics**: The module will support white-labeling and embedding within partner applications, creating new revenue streams through our analytics-as-a-service offering.

4. **Regulatory Compliance**: Built-in compliance reporting for GDPR, CCPA, HIPAA, and other regulations will reduce legal exposure and audit costs.

5. **Cross-Platform Consistency**: The PWA implementation will provide identical functionality across desktop, tablet, and mobile devices, unlike competitors who offer limited mobile experiences.

### User Experience Transformation

**Current Pain Points:**
- Multiple logins required for different reporting systems
- Reports take too long to generate and are often outdated
- Limited visualization options and customization
- No mobile access to critical reports
- Difficult to find relevant information
- No collaboration features

**Future State Experience:**
1. **Unified Dashboard**: Single sign-on access to all reporting and analytics with role-based personalization
2. **Conversational Interface**: Natural language queries like "Show me Q3 sales trends for the Northeast region"
3. **Adaptive UI**: Interface that learns user preferences and adapts layout accordingly
4. **Proactive Notifications**: AI-driven alerts for significant business events
5. **Collaborative Workspaces**: Shared dashboards with annotation and discussion features
6. **Offline Capabilities**: Full functionality available without internet connection

### Long-Term Roadmap (3-5 Years)

**Year 1: Foundation and Core Capabilities**
- Launch real-time reporting infrastructure
- Implement basic AI/ML features (anomaly detection, forecasting)
- Release mobile PWA with offline capabilities
- Achieve WCAG 2.1 AAA compliance
- Integrate with 5 core enterprise systems

**Year 2: Advanced Intelligence**
- Predictive modeling for all major KPIs
- Natural language generation for automated report writing
- Augmented reality data visualization
- Blockchain for data provenance and audit trails
- Voice interface for hands-free reporting

**Year 3: Autonomous Analytics**
- Self-optimizing dashboards that automatically adjust to user needs
- AI-driven root cause analysis for business issues
- Automated corrective action recommendations
- Integration with IoT devices for real-time operational data
- Federated learning for privacy-preserving analytics

**Year 4: Ecosystem Expansion**
- Marketplace for third-party analytics modules
- API-first architecture for complete extensibility
- Edge computing for low-latency global access
- Quantum computing readiness for complex simulations
- Digital twin integration for scenario planning

**Year 5: Self-Evolving System**
- Continuous learning from user interactions
- Automatic feature engineering and model improvement
- Self-healing infrastructure
- Predictive maintenance for the analytics system itself
- Cognitive analytics that understand business context

### Organizational Alignment

**Executive Sponsorship:**
- CEO: Strategic vision and resource allocation
- CFO: Cost optimization and ROI tracking
- CTO: Technical architecture and integration
- CDO: Data governance and quality
- CMO: Customer insights and market intelligence

**Cross-Functional Teams:**
1. **Data Science Team**: Model development and algorithm optimization
2. **Frontend Team**: UI/UX design and implementation
3. **Backend Team**: API development and performance tuning
4. **DevOps Team**: Deployment and monitoring infrastructure
5. **Security Team**: Compliance and threat protection
6. **Product Team**: Feature prioritization and roadmap management

### Success Metrics

**Quantitative:**
- 99.9% system uptime
- <500ms average response time for all queries
- 95% user adoption rate within 6 months
- 40% reduction in report-related support tickets
- 25% improvement in forecast accuracy
- 15% increase in customer retention

**Qualitative:**
- User satisfaction scores >4.5/5
- "Game-changing" feedback from executive leadership
- Recognition as a leader in Gartner's Analytics Magic Quadrant
- Case studies demonstrating 3x ROI within 12 months
- Feature requests that align with our long-term roadmap

### Risk Assessment

**Strategic Risks:**
1. **Market Adoption**: Mitigated through extensive user testing and phased rollout
2. **Technology Obsolescence**: Addressed through modular architecture and continuous innovation
3. **Data Privacy Concerns**: Handled via strict compliance measures and transparent data policies
4. **Vendor Lock-in**: Avoided through open standards and multi-cloud support
5. **Talent Shortage**: Mitigated through internal training programs and strategic hiring

**Implementation Risks:**
1. **Scope Creep**: Controlled through strict change management processes
2. **Performance Issues**: Addressed via comprehensive load testing and optimization
3. **Integration Challenges**: Mitigated through API-first design and thorough documentation
4. **User Resistance**: Handled through change management and training programs
5. **Security Vulnerabilities**: Addressed through continuous security testing and hardening

### Financial Projections

**Development Costs:**
- Initial development: $2.8M
- Infrastructure: $1.2M
- Training: $450K
- Maintenance (annual): $750K

**ROI Timeline:**
- Year 1: Break-even
- Year 2: 2.5x ROI
- Year 3: 4.2x ROI
- Year 4: 6.1x ROI
- Year 5: 8.3x ROI

**Revenue Impact:**
- New revenue streams: $3.2M/year by Year 3
- Cost savings: $1.8M/year by Year 2
- Productivity gains: $2.4M/year by Year 3

---

## Performance Enhancements (300+ lines)

### Redis Caching Layer Implementation

```typescript
// redis-cache.service.ts
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
  private readonly LONG_TTL = 86400; // 24 hours for less volatile data
  private readonly SHORT_TTL = 300; // 5 minutes for highly volatile data

  constructor(private configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
      connectTimeout: 5000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(`Redis connection retry attempt ${times}, next in ${delay}ms`);
        return delay;
      },
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Successfully connected to Redis');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
  }

  /**
   * Generates a consistent cache key from input parameters
   * @param prefix - Cache key prefix
   * @param params - Parameters to include in key
   * @returns Hashed cache key
   */
  private generateCacheKey(prefix: string, params: any): string {
    const paramString = JSON.stringify(params);
    return `${prefix}:${crypto.createHash('sha256').update(paramString).digest('hex')}`;
  }

  /**
   * Gets cached data with automatic fallback to original method
   * @param keyPrefix - Cache key prefix
   * @param params - Parameters for key generation
   * @param fallbackFn - Function to call if cache miss
   * @param ttl - Optional TTL override
   * @returns Promise with cached or fresh data
   */
  async getWithFallback<T>(
    keyPrefix: string,
    params: any,
    fallbackFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(keyPrefix, params);

    try {
      const cachedData = await this.redisClient.get(cacheKey);
      if (cachedData) {
        this.logger.debug(`Cache hit for ${cacheKey}`);
        return JSON.parse(cachedData) as T;
      }

      this.logger.debug(`Cache miss for ${cacheKey}, executing fallback`);
      const freshData = await fallbackFn();

      if (freshData !== null && freshData !== undefined) {
        const effectiveTtl = ttl || this.getTtlForData(freshData);
        await this.redisClient.setex(
          cacheKey,
          effectiveTtl,
          JSON.stringify(freshData),
        );
        this.logger.debug(`Cached data for ${cacheKey} with TTL ${effectiveTtl}`);
      }

      return freshData;
    } catch (error) {
      this.logger.error(`Cache operation failed for ${cacheKey}: ${error.message}`);
      // Fallback to original method if cache fails
      return fallbackFn();
    }
  }

  /**
   * Determines appropriate TTL based on data characteristics
   * @param data - Data to be cached
   * @returns TTL in seconds
   */
  private getTtlForData(data: any): number {
    if (data === null || data === undefined) {
      return this.SHORT_TTL;
    }

    // Large datasets get shorter TTL
    if (JSON.stringify(data).length > 100000) {
      return this.SHORT_TTL;
    }

    // Data with timestamp fields likely needs frequent updates
    if (data.timestamp || data.createdAt || data.updatedAt) {
      return this.DEFAULT_TTL;
    }

    return this.LONG_TTL;
  }

  /**
   * Multi-get operation for batch cache retrieval
   * @param keys - Array of cache keys
   * @returns Promise with array of cached values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!keys.length) return [];

    try {
      const results = await this.redisClient.mget(keys);
      return results.map((result) => (result ? JSON.parse(result) : null));
    } catch (error) {
      this.logger.error(`Multi-get operation failed: ${error.message}`);
      return keys.map(() => null);
    }
  }

  /**
   * Cache invalidation for specific patterns
   * @param pattern - Cache key pattern to invalidate
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redisClient.keys(`${pattern}*`);
      if (keys.length) {
        await this.redisClient.del(keys);
        this.logger.log(`Invalidated ${keys.length} cache keys matching ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Cache invalidation failed for ${pattern}: ${error.message}`);
    }
  }

  /**
   * Cache warming for critical data
   * @param keyPrefix - Cache key prefix
   * @param params - Parameters for key generation
   * @param dataFn - Function to generate data
   * @param ttl - Optional TTL override
   */
  async warmCache<T>(
    keyPrefix: string,
    params: any,
    dataFn: () => Promise<T>,
    ttl?: number,
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(keyPrefix, params);

    try {
      const data = await dataFn();
      if (data !== null && data !== undefined) {
        const effectiveTtl = ttl || this.getTtlForData(data);
        await this.redisClient.setex(
          cacheKey,
          effectiveTtl,
          JSON.stringify(data),
        );
        this.logger.debug(`Warmed cache for ${cacheKey}`);
      }
    } catch (error) {
      this.logger.error(`Cache warming failed for ${cacheKey}: ${error.message}`);
    }
  }

  /**
   * Gets cache statistics
   * @returns Promise with cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    hitRate: number;
  }> {
    try {
      const keys = await this.redisClient.dbsize();
      const info = await this.redisClient.info('memory');
      const memory = info.split('\n').find((line) => line.startsWith('used_memory_human:'))?.split(':')[1] || '0';

      // Simplified hit rate calculation (would need to track hits/misses in production)
      const hitRate = 0.85; // Placeholder - implement proper tracking

      return {
        keys,
        memory,
        hitRate,
      };
    } catch (error) {
      this.logger.error(`Failed to get cache stats: ${error.message}`);
      return {
        keys: 0,
        memory: '0',
        hitRate: 0,
      };
    }
  }

  /**
   * Closes Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.redisClient.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error(`Error closing Redis connection: ${error.message}`);
    }
  }
}
```

### Database Query Optimization

```typescript
// query-optimizer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Report } from './entities/report.entity';
import { ReportData } from './entities/report-data.entity';
import { User } from '../auth/entities/user.entity';
import { PaginationOptions } from './interfaces/pagination-options.interface';
import { QueryOptimizationResult } from './interfaces/query-optimization-result.interface';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER, Inject } from '@nestjs/common';

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);
  private readonly MAX_QUERY_TIME = 5000; // 5 seconds
  private readonly MAX_ROWS = 100000; // Safety limit for unoptimized queries

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(ReportData)
    private readonly reportDataRepository: Repository<ReportData>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Optimizes a complex report query with multiple conditions
   * @param queryBuilder - Base query builder
   * @param filters - Filter conditions
   * @param pagination - Pagination options
   * @param user - Current user for permission checks
   * @returns Optimized query builder and performance metrics
   */
  async optimizeReportQuery(
    queryBuilder: SelectQueryBuilder<Report>,
    filters: any,
    pagination: PaginationOptions,
    user: User,
  ): Promise<QueryOptimizationResult> {
    const startTime = Date.now();
    let optimizedQuery = queryBuilder;

    try {
      // Step 1: Apply security filters based on user permissions
      optimizedQuery = this.applySecurityFilters(optimizedQuery, user);

      // Step 2: Optimize join operations
      optimizedQuery = this.optimizeJoins(optimizedQuery);

      // Step 3: Apply user filters with proper indexing
      optimizedQuery = this.applyUserFilters(optimizedQuery, filters);

      // Step 4: Optimize sorting
      optimizedQuery = this.optimizeSorting(optimizedQuery, filters);

      // Step 5: Apply pagination with safety checks
      optimizedQuery = this.applyPagination(optimizedQuery, pagination);

      // Step 6: Add query hints for the optimizer
      optimizedQuery = this.addQueryHints(optimizedQuery);

      // Step 7: Cache the optimized query plan
      const cacheKey = this.generateQueryCacheKey(optimizedQuery, filters, pagination);
      await this.cacheManager.set(cacheKey, optimizedQuery.getQueryAndParameters(), 3600);

      const executionTime = Date.now() - startTime;
      this.logger.debug(`Query optimization completed in ${executionTime}ms`);

      return {
        query: optimizedQuery,
        executionTime,
        estimatedCost: this.estimateQueryCost(optimizedQuery),
        cacheKey,
      };
    } catch (error) {
      this.logger.error(`Query optimization failed: ${error.message}`);
      // Fallback to original query if optimization fails
      return {
        query: queryBuilder,
        executionTime: Date.now() - startTime,
        estimatedCost: this.estimateQueryCost(queryBuilder),
        error: error.message,
      };
    }
  }

  /**
   * Applies security filters based on user permissions
   * @param query - Query builder
   * @param user - Current user
   * @returns Query builder with security filters applied
   */
  private applySecurityFilters(
    query: SelectQueryBuilder<Report>,
    user: User,
  ): SelectQueryBuilder<Report> {
    // Always filter by tenant for multi-tenant systems
    if (user.tenantId) {
      query.andWhere('report.tenantId = :tenantId', { tenantId: user.tenantId });
    }

    // Apply role-based access control
    if (!user.roles.includes('admin')) {
      // Non-admin users can only see reports they created or are shared with them
      query.andWhere(
        new Brackets((qb) => {
          qb.where('report.createdById = :userId', { userId: user.id })
            .orWhere('report.sharedWith @> :userId', {
              userId: [user.id],
            })
            .orWhere('report.visibility = :public', { public: 'public' });
        }),
      );
    }

    return query;
  }

  /**
   * Optimizes join operations to minimize data transfer
   * @param query - Query builder
   * @returns Query builder with optimized joins
   */
  private optimizeJoins(query: SelectQueryBuilder<Report>): SelectQueryBuilder<Report> {
    // Only join tables that are actually needed
    const selectFields = query.getQueryAndParameters()[0]
      .split('SELECT')[1]
      .split('FROM')[0];

    // If we're not selecting from report_data, don't join it
    if (!selectFields.includes('report_data.')) {
      query.leftJoinAndSelect('report.data', 'report_data', '1=0'); // Fake join to prevent errors
    } else {
      query.leftJoinAndSelect('report.data', 'report_data');
    }

    // For report metrics, use a more efficient join
    if (selectFields.includes('report_metrics.')) {
      query.leftJoinAndSelect(
        'report.metrics',
        'report_metrics',
        'report_metrics.reportId = report.id',
      );
    }

    return query;
  }

  /**
   * Applies user filters with proper indexing
   * @param query - Query builder
   * @param filters - User-provided filters
   * @returns Query builder with filters applied
   */
  private applyUserFilters(
    query: SelectQueryBuilder<Report>,
    filters: any,
  ): SelectQueryBuilder<Report> {
    if (!filters) return query;

    // Date range filters - use indexed columns
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      if (startDate) {
        query.andWhere('report.createdAt >= :startDate', { startDate });
      }
      if (endDate) {
        query.andWhere('report.createdAt <= :endDate', { endDate });
      }
    }

    // Status filter - use indexed column
    if (filters.status) {
      query.andWhere('report.status IN (:...status)', { status: filters.status });
    }

    // Category filter - use indexed column
    if (filters.category) {
      query.andWhere('report.category IN (:...category)', { category: filters.category });
    }

    // Full-text search with proper indexing
    if (filters.search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('report.title ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('report.description ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('report.tags @> :tags', {
              tags: [`${filters.search}`],
            });
        }),
      );
    }

    // Numeric range filters
    if (filters.minViews) {
      query.andWhere('report.viewCount >= :minViews', { minViews: filters.minViews });
    }
    if (filters.maxViews) {
      query.andWhere('report.viewCount <= :maxViews', { maxViews: filters.maxViews });
    }

    return query;
  }

  /**
   * Optimizes sorting to use indexed columns
   * @param query - Query builder
   * @param filters - User-provided filters
   * @returns Query builder with optimized sorting
   */
  private optimizeSorting(
    query: SelectQueryBuilder<Report>,
    filters: any,
  ): SelectQueryBuilder<Report> {
    // Default sorting if none specified
    if (!filters.sortBy) {
      query.orderBy('report.createdAt', 'DESC');
      return query;
    }

    // Map user-friendly sort fields to actual database columns
    const sortFieldMap = {
      'date': 'report.createdAt',
      'views': 'report.viewCount',
      'popularity': 'report.popularityScore',
      'name': 'report.title',
      'size': 'report.size',
    };

    const dbField = sortFieldMap[filters.sortBy] || filters.sortBy;
    const direction = filters.sortDirection || 'DESC';

    // Only allow sorting on indexed columns for performance
    const indexedColumns = [
      'report.createdAt',
      'report.updatedAt',
      'report.viewCount',
      'report.popularityScore',
      'report.title',
    ];

    if (indexedColumns.includes(dbField)) {
      query.orderBy(dbField, direction);
    } else {
      this.logger.warn(`Attempted to sort on non-indexed column: ${dbField}`);
      // Fallback to default sorting
      query.orderBy('report.createdAt', 'DESC');
    }

    return query;
  }

  /**
   * Applies pagination with safety limits
   * @param query - Query builder
   * @param pagination - Pagination options
   * @returns Query builder with pagination applied
   */
  private applyPagination(
    query: SelectQueryBuilder<Report>,
    pagination: PaginationOptions,
  ): SelectQueryBuilder<Report> {
    const { page = 1, limit = 20 } = pagination;

    // Enforce maximum limit to prevent performance issues
    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;

    // For very large datasets, use keyset pagination instead of offset
    if (offset > 10000) {
      this.logger.warn('Large offset detected, consider using keyset pagination');
      query.take(safeLimit);
    } else {
      query.skip(offset).take(safeLimit);
    }

    return query;
  }

  /**
   * Adds query hints to help the database optimizer
   * @param query - Query builder
   * @returns Query builder with hints added
   */
  private addQueryHints(query: SelectQueryBuilder<Report>): SelectQueryBuilder<Report> {
    // Add query hints based on database type
    const queryString = query.getQuery();

    // For PostgreSQL
    if (queryString.includes('FROM "report"')) {
      query.addSelect('/*+ IndexScan(report) */');
    }

    // For complex queries, suggest materialized views
    if (queryString.includes('JOIN') && queryString.includes('WHERE')) {
      query.addSelect('/*+ MaterializedView(report_summary) */');
    }

    return query;
  }

  /**
   * Estimates the cost of a query for performance monitoring
   * @param query - Query builder
   * @returns Estimated query cost
   */
  private estimateQueryCost(query: SelectQueryBuilder<Report>): number {
    const queryString = query.getQuery();
    let cost = 0;

    // Count joins
    const joinCount = (queryString.match(/JOIN/g) || []).length;
    cost += joinCount * 10;

    // Count where conditions
    const whereCount = (queryString.match(/WHERE/g) || []).length;
    cost += whereCount * 5;

    // Count subqueries
    const subqueryCount = (queryString.match(/\(SELECT/g) || []).length;
    cost += subqueryCount * 20;

    // Check for full-text search
    if (queryString.includes('ILIKE')) {
      cost += 30;
    }

    // Check for pagination
    if (queryString.includes('OFFSET') || queryString.includes('LIMIT')) {
      cost -= 5; // Pagination actually helps performance
    }

    // Cap the cost at 100
    return Math.min(cost, 100);
  }

  /**
   * Generates a cache key for the query
   * @param query - Query builder
   * @param filters - User filters
   * @param pagination - Pagination options
   * @returns Cache key string
   */
  private generateQueryCacheKey(
    query: SelectQueryBuilder<Report>,
    filters: any,
    pagination: PaginationOptions,
  ): string {
    const queryString = query.getQuery();
    const params = query.getParameters();
    const filterString = JSON.stringify(filters);
    const paginationString = JSON.stringify(pagination);

    return `query:${crypto
      .createHash('sha256')
      .update(`${queryString}:${JSON.stringify(params)}:${filterString}:${paginationString}`)
      .digest('hex')}`;
  }

  /**
   * Executes a query with performance monitoring
   * @param query - Query builder
   * @param options - Execution options
   * @returns Query result with performance metrics
   */
  async executeWithMonitoring<T>(
    query: SelectQueryBuilder<T>,
    options: { name?: string; timeout?: number } = {},
  ): Promise<{ data: T[]; performance: QueryPerformance }> {
    const startTime = Date.now();
    const queryName = options.name || 'unnamed_query';
    const timeout = options.timeout || this.MAX_QUERY_TIME;

    try {
      // Set query timeout
      query.setQueryTimeout(timeout / 1000);

      // Execute the query
      const data = await query.getMany();

      // Check if we hit the row limit
      if (data.length >= this.MAX_ROWS) {
        this.logger.warn(`Query ${queryName} returned maximum allowed rows (${this.MAX_ROWS})`);
      }

      const executionTime = Date.now() - startTime;
      const performance = {
        executionTime,
        rowCount: data.length,
        queryCost: this.estimateQueryCost(query),
        isSlow: executionTime > 1000,
        isLarge: data.length > 1000,
      };

      this.logger.debug(
        `Query ${queryName} executed in ${executionTime}ms, returned ${data.length} rows`,
      );

      return { data, performance };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `Query ${queryName} failed after ${executionTime}ms: ${error.message}`,
      );

      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  /**
   * Creates a materialized view for frequently accessed reports
   * @param viewName - Name of the materialized view
   * @param query - Query definition
   * @param refreshInterval - Refresh interval in seconds
   */
  async createMaterializedView(
    viewName: string,
    query: string,
    refreshInterval: number = 3600,
  ): Promise<void> {
    try {
      // Check if view already exists
      const exists = await this.reportRepository.query(
        `SELECT EXISTS (
          SELECT FROM pg_catalog.pg_matviews
          WHERE matviewname = $1
        )`,
        [viewName],
      );

      if (exists[0].exists) {
        this.logger.log(`Materialized view ${viewName} already exists`);
        return;
      }

      // Create the materialized view
      await this.reportRepository.query(`
        CREATE MATERIALIZED VIEW ${viewName} AS
        ${query}
        WITH DATA
      `);

      // Create index on the view
      await this.reportRepository.query(`
        CREATE INDEX idx_${viewName}_id ON ${viewName} (id)
      `);

      // Set up automatic refresh
      await this.reportRepository.query(`
        CREATE OR REPLACE FUNCTION refresh_${viewName}()
        RETURNS TRIGGER AS $$
        BEGIN
          REFRESH MATERIALIZED VIEW ${viewName};
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
      `);

      await this.reportRepository.query(`
        CREATE EVENT TRIGGER refresh_${viewName}_trigger
        ON SCHEDULE EVERY ${refreshInterval} SECOND
        EXECUTE FUNCTION refresh_${viewName}()
      `);

      this.logger.log(`Created materialized view ${viewName} with refresh interval ${refreshInterval}s`);
    } catch (error) {
      this.logger.error(`Failed to create materialized view ${viewName}: ${error.message}`);
      throw error;
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
import { performance } from 'perf_hooks';

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly compressionMiddleware: ReturnType<typeof compression>;
  private readonly logger = new Logger(ResponseCompressionMiddleware.name);

  constructor(private configService: ConfigService) {
    // Configure compression with optimal settings
    this.compressionMiddleware = compression({
      level: this.configService.get('COMPRESSION_LEVEL') || 6, // Optimal balance between speed and ratio
      threshold: this.configService.get('COMPRESSION_THRESHOLD') || 1024, // 1KB threshold
      filter: (req: Request, res: Response) => {
        // Don't compress if already compressed
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Don't compress binary data
        if (res.getHeader('Content-Type')?.toString().includes('application/octet-stream')) {
          return false;
        }

        // Always compress JSON, HTML, CSS, JS, etc.
        return compression.filter(req, res);
      },
      strategy: this.configService.get('COMPRESSION_STRATEGY') || 'DEFAULT_STRATEGY',
      chunkSize: 16384, // 16KB chunks
      windowBits: 15, // Default window size
      memLevel: 8, // Default memory level
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = performance.now();

    // Wrap the response.end method to measure compression performance
    const originalEnd = res.end;
    res.end = ((...args: any[]) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log compression metrics if response was compressed
      if (res.getHeader('Content-Encoding') === 'gzip') {
        const originalSize = parseInt(res.getHeader('X-Original-Size') as string) || 0;
        const compressedSize = parseInt(res.getHeader('Content-Length') as string) || 0;

        if (originalSize > 0) {
          const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
          this.logger.debug(
            `Compressed response for ${req.path}: ${originalSize} → ${compressedSize} bytes (${ratio}% reduction) in ${duration.toFixed(2)}ms`,
          );
        }
      }

      return originalEnd.apply(res, args);
    } as any;

    // Add original size header before compression
    const originalWrite = res.write;
    res.write = ((chunk: any, ...args: any[]) => {
      if (!res.getHeader('X-Original-Size')) {
        const size = Buffer.byteLength(chunk);
        res.setHeader('X-Original-Size', size);
      }
      return originalWrite.apply(res, [chunk, ...args]);
    } as any);

    // Apply compression middleware
    this.compressionMiddleware(req, res, () => {
      // Add compression headers
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('X-Compression', 'gzip');

      // Continue to next middleware
      next();
    });
  }
}

// response-compression.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { performance } from 'perf_hooks';

@Injectable()
export class ResponseCompressionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseCompressionInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = performance.now();
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Skip compression for already compressed responses
        if (response.getHeader('Content-Encoding')) {
          return data;
        }

        // Skip compression for small responses
        if (JSON.stringify(data).length < 1024) {
          return data;
        }

        // Add performance metrics to response
        if (response.getHeader('Content-Type')?.toString().includes('application/json')) {
          const originalSize = Buffer.byteLength(JSON.stringify(data));
          response.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
          response.setHeader('X-Original-Size', originalSize);

          this.logger.debug(
            `Response for ${httpContext.getRequest().path} generated in ${duration.toFixed(2)}ms (${originalSize} bytes)`,
          );
        }

        return data;
      }),
    );
  }
}
```

### Lazy Loading Implementation

```typescript
// lazy-loading.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Observable, of, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { PerformanceMonitor } from '../monitoring/performance-monitor.service';

@Injectable()
export class LazyLoadingService {
  private readonly logger = new Logger(LazyLoadingService.name);
  private readonly loadedModules = new Map<string, any>();
  private readonly loadingPromises = new Map<string, Promise<any>>();

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly performanceMonitor: PerformanceMonitor,
  ) {}

  /**
   * Lazily loads a module and its dependencies
   * @param moduleName - Name of the module to load
   * @param options - Loading options
   * @returns Observable of the loaded module
   */
  loadModule<T>(moduleName: string, options: LazyLoadOptions = {}): Observable<T> {
    const { timeout = 10000, retryCount = 2 } = options;

    // Check if module is already loaded
    if (this.loadedModules.has(moduleName)) {
      return of(this.loadedModules.get(moduleName) as T);
    }

    // Check if module is currently being loaded
    if (this.loadingPromises.has(moduleName)) {
      return from(this.loadingPromises.get(moduleName) as Promise<T>);
    }

    // Create a new loading promise
    const loadPromise = this.loadModuleInternal(moduleName, retryCount)
      .then((module) => {
        this.loadedModules.set(moduleName, module);
        this.loadingPromises.delete(moduleName);
        return module;
      })
      .catch((error) => {
        this.loadingPromises.delete(moduleName);
        throw error;
      });

    this.loadingPromises.set(moduleName, loadPromise);

    // Convert promise to observable with timeout
    return from(loadPromise).pipe(
      catchError((error) => {
        this.logger.error(`Failed to load module ${moduleName}: ${error.message}`);
        return throwError(() => new Error(`Module loading failed: ${error.message}`));
      }),
      switchMap((module) => {
        // Track module loading performance
        this.performanceMonitor.trackModuleLoad(moduleName, {
          success: true,
          timestamp: Date.now(),
        });
        return of(module);
      }),
    );
  }

  /**
   * Internal method to load a module with retry logic
   * @param moduleName - Name of the module to load
   * @param retryCount - Number of retries
   * @returns Promise of the loaded module
   */
  private async loadModuleInternal(moduleName: string, retryCount: number): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retryCount + 1; attempt++) {
      try {
        const startTime = performance.now();

        // Use NestJS module reference to get the module
        const module = this.moduleRef.get(moduleName, { strict: false });

        if (!module) {
          throw new Error(`Module ${moduleName} not found`);
        }

        const loadTime = performance.now() - startTime;
        this.logger.debug(
          `Loaded module ${moduleName} in ${loadTime.toFixed(2)}ms (attempt ${attempt})`,
        );

        return module;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Attempt ${attempt} to load module ${moduleName} failed: ${error.message}`,
        );

        if (attempt <= retryCount) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Preloads critical modules during application startup
   * @param moduleNames - Array of module names to preload
   */
  async preloadCriticalModules(moduleNames: string[]): Promise<void> {
    const startTime = performance.now();
    const results = await Promise.allSettled(
      moduleNames.map((moduleName) => this.loadModuleInternal(moduleName, 1)),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    const loadTime = performance.now() - startTime;
    this.logger.log(
      `Preloaded ${successful}/${moduleNames.length} critical modules in ${loadTime.toFixed(2)}ms`,
    );

    if (failed > 0) {
      this.logger.warn(
        `Failed to preload ${failed} modules: ${results
          .filter((r) => r.status === 'rejected')
          .map((r) => (r as PromiseRejectedResult).reason.message)
          .join(', ')}`,
      );
    }
  }

  /**
   * Clears a loaded module from cache
   * @param moduleName - Name of the module to clear
   */
  clearModule(moduleName: string): void {
    if (this.loadedModules.has(moduleName)) {
      this.loadedModules.delete(moduleName);
      this.logger.debug(`Cleared module ${moduleName} from cache`);
    }
  }

  /**
   * Gets statistics about loaded modules
   * @returns Object with module statistics
   */
  getModuleStats(): {
    loadedCount: number;
    loadingCount: number;
    memoryUsage: number;
  } {
    const loadedCount = this.loadedModules.size;
    const loadingCount = this.loadingPromises.size;

    // Estimate memory usage (very rough estimate)
    let memoryUsage = 0;
    this.loadedModules.forEach((module) => {
      memoryUsage += JSON.stringify(module).length;
    });

    return {
      loadedCount,
      loadingCount,
      memoryUsage: Math.round(memoryUsage / 1024), // KB
    };
  }
}

// lazy-load.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { LAZY_LOAD_MODULE } from './lazy-load.constants';

/**
 * Decorator to mark a controller method for lazy loading
 * @param moduleName - Name of the module to lazy load
 * @param options - Lazy loading options
 */
export function LazyLoad(moduleName: string, options: LazyLoadOptions = {}) {
  return SetMetadata(LAZY_LOAD_MODULE, { moduleName, options });
}

// lazy-load.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LazyLoadingService } from './lazy-loading.service';
import { LAZY_LOAD_MODULE } from './lazy-load.constants';

@Injectable()
export class LazyLoadGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly lazyLoadingService: LazyLoadingService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const lazyLoadMeta = this.reflector.get<{
      moduleName: string;
      options: LazyLoadOptions;
    }>(LAZY_LOAD_MODULE, context.getHandler());

    if (!lazyLoadMeta) {
      return true;
    }

    const { moduleName, options } = lazyLoadMeta;

    return from(this.lazyLoadingService.loadModule(moduleName, options)).pipe(
      switchMap(() => {
        // Module loaded successfully, proceed with request
        return [true];
      }),
    );
  }
}
```

### Request Debouncing

```typescript
// request-debouncer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, shareReplay } from 'rxjs/operators';
import { createHash } from 'crypto';

@Injectable()
export class RequestDebouncerService {
  private readonly logger = new Logger(RequestDebouncerService.name);
  private readonly debounceStreams = new Map<string, Subject<any>>();
  private readonly debounceResults = new Map<string, Observable<any>>();
  private readonly DEFAULT_DEBOUNCE_TIME = 300; // ms
  private readonly MAX_DEBOUNCE_TIME = 2000; // ms

  /**
   * Debounces a request and returns a shared observable
   * @param key - Unique key for the request
   * @param requestFn - Function that returns the request observable
   * @param options - Debounce options
   * @returns Observable of the debounced result
   */
  debounceRequest<T>(
    key: string,
    requestFn: () => Observable<T>,
    options: DebounceOptions = {},
  ): Observable<T> {
    const { debounceTime: customDebounceTime, maxWait = this.MAX_DEBOUNCE_TIME } = options;
    const debounceTime = Math.min(
      customDebounceTime || this.DEFAULT_DEBOUNCE_TIME,
      this.MAX_DEBOUNCE_TIME,
    );

    // Check if we already have a debounced stream for this key
    if (this.debounceResults.has(key)) {
      return this.debounceResults.get(key) as Observable<T>;
    }

    // Create a new debounce subject
    const subject = new Subject<any>();
    this.debounceStreams.set(key, subject);

    // Create the debounced observable
    const debounced$ = subject.pipe(
      debounceTime(debounceTime),
      distinctUntilChanged((prev, curr) => this.isEqual(prev, curr)),
      switchMap((params) => {
        this.logger.debug(`Executing debounced request for ${key}`);
        return requestFn().pipe(
          // Cache the result for subsequent subscribers
          shareReplay(1),
        );
      }),
    );

    // Store the debounced observable
    this.debounceResults.set(key, debounced$);

    // Set up max wait timer to ensure requests don't wait too long
    if (maxWait > 0) {
      setTimeout(() => {
        if (this.debounceStreams.has(key)) {
          const currentSubject = this.debounceStreams.get(key);
          if (currentSubject.observers.length > 0) {
            this.logger.debug(`Max wait time reached for ${key}, forcing execution`);
            currentSubject.next({ force: true });
          }
        }
      }, maxWait);
    }

    return debounced$;
  }

  /**
   * Triggers a debounced request
   * @param key - Unique key for the request
   * @param params - Request parameters
   */
  triggerRequest(key: string, params: any = {}): void {
    if (!this.debounceStreams.has(key)) {
      this.logger.warn(`No debounced request found for key ${key}`);
      return;
    }

    const subject = this.debounceStreams.get(key);
    subject?.next(params);
  }

  /**
   * Cancels a debounced request
   * @param key - Unique key for the request
   */
  cancelRequest(key: string): void {
    if (this.debounceStreams.has(key)) {
      this.debounceStreams.get(key)?.complete();
      this.debounceStreams.delete(key);
      this.debounceResults.delete(key);
      this.logger.debug(`Cancelled debounced request for ${key}`);
    }
  }

  /**
   * Clears all debounced requests
   */
  clearAll(): void {
    this.debounceStreams.forEach((subject) => subject.complete());
    this.debounceStreams.clear();
    this.debounceResults.clear();
    this.logger.log('Cleared all debounced requests');
  }

  /**
   * Generates a unique key for a request
   * @param baseKey - Base key
   * @param params - Request parameters
   * @returns Unique request key
   */
  generateRequestKey(baseKey: string, params: any = {}): string {
    const paramString = JSON.stringify(params);
    return `${baseKey}:${createHash('sha256').update(paramString).digest('hex').substring(0, 8)}`;
  }

  /**
   * Checks if two objects are equal for debouncing purposes
   * @param a - First object
   * @param b - Second object
   * @returns True if objects are equal
   */
  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
      return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key) || !this.isEqual(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets statistics about current debounced requests
   * @returns Object with debounce statistics
   */
  getStats(): {
    activeRequests: number;
    pendingRequests: number;
    memoryUsage: number;
  } {
    const activeRequests = this.debounceStreams.size;
    const pendingRequests = Array.from(this.debounceStreams.values()).reduce(
      (count, subject) => count + subject.observers.length,
      0,
    );

    // Estimate memory usage
    let memoryUsage = 0;
    this.debounceStreams.forEach((subject, key) => {
      memoryUsage += key.length;
      memoryUsage += JSON.stringify(subject).length;
    });

    return {
      activeRequests,
      pendingRequests,
      memoryUsage: Math.round(memoryUsage / 1024), // KB
    };
  }
}

// debounce.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestDebouncerService } from './request-debouncer.service';
import { Reflector } from '@nestjs/core';
import { DEBOUNCE_OPTIONS } from './debounce.constants';

@Injectable()
export class DebounceInterceptor implements NestInterceptor {
  constructor(
    private readonly requestDebouncer: RequestDebouncerService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const debounceOptions = this.reflector.get<DebounceOptions>(
      DEBOUNCE_OPTIONS,
      context.getHandler(),
    );

    if (!debounceOptions) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    // Generate a unique key for this request
    const baseKey = `${request.method}:${request.path}`;
    const requestKey = this.requestDebouncer.generateRequestKey(baseKey, {
      query: request.query,
      params: request.params,
      body: request.body,
    });

    // Create a debounced observable
    const debounced$ = this.requestDebouncer.debounceRequest(
      requestKey,
      () => next.handle(),
      debounceOptions,
    );

    // Track request timing
    const startTime = Date.now();
    response.setHeader('X-Request-Key', requestKey);

    return debounced$.pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        response.setHeader('X-Debounce-Time', `${duration}ms`);
      }),
    );
  }
}
```

### Connection Pooling

```typescript
// database-pool.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, PoolConfig } from 'pg';
import { performance } from 'perf_hooks';
import { setTimeout } from 'timers/promises';

@Injectable()
export class DatabasePoolService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabasePoolService.name);
  private readonly pools = new Map<string, Pool>();
  private readonly DEFAULT_POOL_NAME = 'default';
  private readonly DEFAULT_POOL_CONFIG: PoolConfig = {
    max: 20, // Maximum number of clients in the pool
    min: 4, // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000, // How long to wait for a connection to become available
    maxUses: 1000, // Maximum number of uses per connection
    statement_timeout: 10000, // Statement timeout in ms
    query_timeout: 10000, // Query timeout in ms
    application_name: 'reporting-analytics',
  };

  constructor(private readonly configService: ConfigService) {
    this.initializeDefaultPool();
  }

  /**
   * Initializes the default database pool
   */
  private initializeDefaultPool(): void {
    const config = this.getPoolConfig(this.DEFAULT_POOL_NAME);
    this.createPool(this.DEFAULT_POOL_NAME, config);
  }

  /**
   * Gets configuration for a pool
   * @param poolName - Name of the pool
   * @returns Pool configuration
   */
  private getPoolConfig(poolName: string): PoolConfig {
    const baseConfig = {
      ...this.DEFAULT_POOL_CONFIG,
      host: this.configService.get(`DB_${poolName.toUpperCase()}_HOST`),
      port: this.configService.get(`DB_${poolName.toUpperCase()}_PORT`),
      database: this.configService.get(`DB_${poolName.toUpperCase()}_NAME`),
      user: this.configService.get(`DB_${poolName.toUpperCase()}_USER`),
      password: this.configService.get(`DB_${poolName.toUpperCase()}_PASSWORD`),
    };

    // Override defaults with environment-specific settings
    return {
      ...baseConfig,
      max: this.configService.get(`DB_${poolName.toUpperCase()}_MAX_CONNECTIONS`) || baseConfig.max,
      min: this.configService.get(`DB_${poolName.toUpperCase()}_MIN_CONNECTIONS`) || baseConfig.min,
      idleTimeoutMillis:
        this.configService.get(`DB_${poolName.toUpperCase()}_IDLE_TIMEOUT`) ||
        baseConfig.idleTimeoutMillis,
    };
  }

  /**
   * Creates a new database pool
   * @param poolName - Name of the pool
   * @param config - Pool configuration
   */
  private createPool(poolName: string, config: PoolConfig): void {
    if (this.pools.has(poolName)) {
      this.logger.warn(`Pool ${poolName} already exists`);
      return;
    }

    const pool = new Pool(config);

    // Set up event listeners
    pool.on('connect', () => {
      this.logger.debug(`New connection established in pool ${poolName}`);
    });

    pool.on('acquire', (client) => {
      this.logger.debug(`Client acquired from pool ${poolName}`);
    });

    pool.on('remove', (client) => {
      this.logger.debug(`Client removed from pool ${poolName}`);
    });

    pool.on('error', (err, client) => {
      this.logger.error(`Pool ${poolName} error: ${err.message}`);
    });

    this.pools.set(poolName, pool);
    this.logger.log(`Created database pool ${poolName} with config: ${JSON.stringify(config)}`);
  }

  /**
   * Gets a client from the specified pool
   * @param poolName - Name of the pool (defaults to 'default')
   * @param retries - Number of retries if connection fails
   * @returns Promise with a database client
   */
  async getClient(poolName: string = this.DEFAULT_POOL_NAME, retries = 2): Promise<PoolClient> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    let lastError: Error;
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const startTime = performance.now();
        const client = await pool.connect();
        const duration = performance.now() - startTime;

        this.logger.debug(
          `Acquired client from pool ${poolName} in ${duration.toFixed(2)}ms (attempt ${attempt})`,
        );

        // Add performance monitoring to the client
        this.monitorClient(client, poolName);

        return client;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Attempt ${attempt} to get client from pool ${poolName} failed: ${error.message}`,
        );

        if (attempt <= retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 100;
          await setTimeout(delay);
        }
      }
    }

    throw new Error(
      `Failed to get client from pool ${poolName} after ${retries + 1} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Adds performance monitoring to a client
   * @param client - Database client
   * @param poolName - Name of the pool
   */
  private monitorClient(client: PoolClient, poolName: string): void {
    const originalQuery = client.query;

    client.query = async (...args: any[]) => {
      const startTime = performance.now();
      let query: string;
      let params: any[] = [];

      // Handle different query signatures
      if (typeof args[0] === 'string') {
        query = args[0];
        if (Array.isArray(args[1])) {
          params = args[1];
        }
      } else if (args[0] && typeof args[0] === 'object') {
        query = args[0].text;
        params = args[0].values || [];
      }

      try {
        const result = await originalQuery.apply(client, args);
        const duration = performance.now() - startTime;

        // Log slow queries
        if (duration > 1000) {
          this.logger.warn(
            `Slow query (${duration.toFixed(2)}ms) in pool ${poolName}: ${this.truncateQuery(query, 100)}`,
          );
        } else if (duration > 100) {
          this.logger.debug(
            `Query (${duration.toFixed(2)}ms) in pool ${poolName}: ${this.truncateQuery(query, 50)}`,
          );
        }

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.logger.error(
          `Query failed after ${duration.toFixed(2)}ms in pool ${poolName}: ${this.truncateQuery(query, 100)} - ${error.message}`,
        );
        throw error;
      }
    };
  }

  /**
   * Truncates a query for logging purposes
   * @param query - SQL query
   * @param maxLength - Maximum length
   * @returns Truncated query
   */
  private truncateQuery(query: string, maxLength: number): string {
    if (!query) return 'unknown';
    return query.length > maxLength ? `${query.substring(0, maxLength)}...` : query;
  }

  /**
   * Executes a query using a client from the pool
   * @param query - SQL query
   * @param params - Query parameters
   * @param poolName - Name of the pool
   * @returns Promise with query result
   */
  async query<T = any>(query: string, params: any[] = [], poolName: string = this.DEFAULT_POOL_NAME): Promise<T> {
    const client = await this.getClient(poolName);
    try {
      const result = await client.query<T>(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Executes a transaction
   * @param callback - Function that receives a client and returns a promise
   * @param poolName - Name of the pool
   * @param retries - Number of retries for the transaction
   * @returns Promise with the transaction result
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    poolName: string = this.DEFAULT_POOL_NAME,
    retries = 2,
  ): Promise<T> {
    const client = await this.getClient(poolName);
    let lastError: Error;

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch((rollbackError) => {
        this.logger.error(`Rollback failed: ${rollbackError.message}`);
      });

      lastError = error;
      this.logger.warn(`Transaction failed: ${error.message}`);

      if (retries > 0) {
        this.logger.log(`Retrying transaction (${retries} attempts remaining)`);
        // Exponential backoff
        const delay = Math.pow(2, 2 - retries) * 100;
        await setTimeout(delay);
        return this.transaction(callback, poolName, retries - 1);
      }

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Gets pool statistics
   * @param poolName - Name of the pool
   * @returns Promise with pool statistics
   */
  async getPoolStats(poolName: string = this.DEFAULT_POOL_NAME): Promise<PoolStats> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    const stats = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
      maxConnections: pool.options.max,
      minConnections: pool.options.min,
    };

    // Get additional stats from the database
    try {
      const client = await this.getClient(poolName);
      try {
        const dbStats = await client.query(`
          SELECT
            count(*) as active_connections,
            sum(state = 'idle') as idle_connections,
            sum(state = 'active') as active_queries,
            max(extract(epoch from now() - query_start)) as longest_query_seconds
          FROM pg_stat_activity
          WHERE datname = current_database()
        `);

        return {
          ...stats,
          activeConnections: parseInt(dbStats.rows[0].active_connections),
          activeQueries: parseInt(dbStats.rows[0].active_queries),
          longestQuerySeconds: parseFloat(dbStats.rows[0].longest_query_seconds) || 0,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error(`Failed to get database stats for pool ${poolName}: ${error.message}`);
      return stats;
    }
  }

  /**
   * Resizes a pool
   * @param poolName - Name of the pool
   * @param min - Minimum number of connections
   * @param max - Maximum number of connections
   */
  async resizePool(poolName: string, min: number, max: number): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    this.logger.log(`Resizing pool ${poolName} to min: ${min}, max: ${max}`);
    pool.options.min = min;
    pool.options.max = max;

    // Adjust the pool size
    if (pool.totalCount > max) {
      // Need to reduce the pool size
      const clientsToRemove = pool.totalCount - max;
      for (let i = 0; i < clientsToRemove; i++) {
        const client = await pool.connect();
        client.release(true); // Force remove the client
      }
    }
  }

  /**
   * Closes all pools
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing all database pools');
    const closePromises = Array.from(this.pools.values()).map((pool) =>
      pool.end().catch((error) => {
        this.logger.error(`Error closing pool: ${error.message}`);
      }),
    );

    await Promise.all(closePromises);
    this.logger.log('All database pools closed');
  }

  /**
   * Creates a new named pool
   * @param poolName - Name of the pool
   */
  createNamedPool(poolName: string): void {
    if (this.pools.has(poolName)) {
      this.logger.warn(`Pool ${poolName} already exists`);
      return;
    }

    const config = this.getPoolConfig(poolName);
    this.createPool(poolName, config);
  }

  /**
   * Gets all pool names
   * @returns Array of pool names
   */
  getPoolNames(): string[] {
    return Array.from(this.pools.keys());
  }
}
```

---

## Real-Time Features (300+ lines)

### WebSocket Server Setup

```typescript
// websocket-gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../auth/user.service';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({
  path: '/ws-analytics',
  transports: ['websocket'],
  cors: {
    origin: '*',
  },
  pingInterval: 30000,
  pingTimeout: 60000,
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly clients = new Map<string, WebSocket>();
  private readonly userConnections = new Map<string, Set<string>>(); // userId -> Set<clientId>
  private readonly roomClients = new Map<string, Set<string>>(); // roomName -> Set<clientId>
  private readonly clientMetadata = new Map<string, ClientMetadata>();
  private readonly messageQueue = new Map<string, any[]>();
  private readonly rateLimiter: RateLimiterMemory;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {
    // Configure rate limiting
    this.rateLimiter = new RateLimiterMemory({
      points: 100, // 100 requests
      duration: 60, // per 60 seconds
      blockDuration: 60, // block for 60 seconds if exceeded
    });
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.setupServer(server);
    this.setupHeartbeat();
    this.setupMessageQueueProcessor();
  }

  private setupServer(server: Server) {
    // Set up server event listeners
    server.on('error', (error) => {
      this.logger.error(`WebSocket server error: ${error.message}`);
    });

    server.on('listening', () => {
      const address = server.address();
      this.logger.log(`WebSocket server listening on ${typeof address === 'string' ? address : address?.port}`);
    });

    // Add middleware for connection validation
    server.shouldHandle = (request) => {
      return this.validateConnectionRequest(request);
    };
  }

  private validateConnectionRequest(request: any): boolean {
    try {
      const token = this.extractToken(request);
      if (!token) {
        this.logger.warn('Connection attempt without token');
        return false;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Check if user exists
      if (!payload.sub) {
        this.logger.warn('Invalid token payload - no user ID');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn(`Invalid connection request: ${error.message}`);
      return false;
    }
  }

  private extractToken(request: any): string | null {
    // Extract token from query parameters
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (token) {
      return token;
    }

    // Extract token from headers
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private setupHeartbeat() {
    // Set up heartbeat to detect dead connections
    setInterval(() => {
      const now = Date.now();
      this.clients.forEach((client, clientId) => {
        if (client.readyState === WebSocket.OPEN) {
          // Check if client has responded to ping
          const lastPong = this.clientMetadata.get(clientId)?.lastPong || 0;
          if (now - lastPong > 60000) { // 60 seconds
            this.logger.debug(`Client ${clientId} missed heartbeat, terminating`);
            client.terminate();
          } else {
            // Send ping
            client.ping();
          }
        }
      });
    }, 30000);
  }

  private setupMessageQueueProcessor() {
    // Process message queue every 100ms
    setInterval(() => {
      this.messageQueue.forEach((messages, clientId) => {
        if (messages.length === 0) return;

        const client = this.clients.get(clientId);
        if (!client || client.readyState !== WebSocket.OPEN) {
          this.messageQueue.delete(clientId);
          return;
        }

        // Process up to 10 messages at a time to avoid overwhelming the client
        const messagesToSend = messages.splice(0, 10);
        try {
          client.send(JSON.stringify({
            type: 'batch',
            data: messagesToSend,
            timestamp: Date.now(),
          }));
        } catch (error) {
          this.logger.error(`Failed to send batch to client ${clientId}: ${error.message}`);
        }
      });
    }, 100);
  }

  async handleConnection(client: WebSocket, request: any) {
    const startTime = performance.now();
    const clientId = uuidv4();
    this.clients.set(clientId, client);

    try {
      // Extract and verify token
      const token = this.extractToken(request);
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Get user details
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new Error('User not found');
      }

      // Store client metadata
      this.clientMetadata.set(clientId, {
        clientId,
        userId: user.id,
        tenantId: user.tenantId,
        roles: user.roles,
        ipAddress: request.socket.remoteAddress,
        userAgent: request.headers['user-agent'],
        connectedAt: new Date(),
        lastPong: Date.now(),
        lastMessage: null,
      });

      // Track user connections
      if (!this.userConnections.has(user.id)) {
        this.userConnections.set(user.id, new Set());
      }
      this.userConnections.get(user.id)?.add(clientId);

      this.logger.log(
        `Client ${clientId} connected (User: ${user.id}, Tenant: ${user.tenantId}) in ${performance.now() - startTime}ms`,
      );

      // Send welcome message with connection details
      this.sendToClient(clientId, {
        type: 'connection_established',
        data: {
          clientId,
          userId: user.id,
          tenantId: user.tenantId,
          serverTime: new Date().toISOString(),
          connectionId: uuidv4(),
        },
      });

      // Join default rooms
      this.joinRoom(clientId, `user:${user.id}`);
      this.joinRoom(clientId, `tenant:${user.tenantId}`);

      // If user has admin role, join admin room
      if (user.roles.includes('admin')) {
        this.joinRoom(clientId, 'admin');
      }

      // Set up client event listeners
      this.setupClientListeners(client, clientId);

    } catch (error) {
      this.logger.error(`Connection failed for client ${clientId}: ${error.message}`);
      this.sendToClient(clientId, {
        type: 'connection_error',
        data: {
          message: 'Authentication failed',
          details: error.message,
        },
        error: true,
      });
      client.close(1008, 'Authentication failed');
    }
  }

  private setupClientListeners(client: WebSocket, clientId: string) {
    client.on('pong', () => {
      const metadata = this.clientMetadata.get(clientId);
      if (metadata) {
        metadata.lastPong = Date.now();
      }
    });

    client.on('message', async (data) => {
      try {
        await this.handleClientMessage(clientId, data);
      } catch (error) {
        this.logger.error(`Error handling message from client ${clientId}: ${error.message}`);
        this.sendToClient(clientId, {
          type: 'error',
          data: {
            message: 'Message processing failed',
            details: error.message,
          },
          error: true,
        });
      }
    });

    client.on('close', (code, reason) => {
      this.handleDisconnect(clientId, code, reason);
    });

    client.on('error', (error) => {
      this.logger.error(`Client ${clientId} error: ${error.message}`);
    });
  }

  private async handleClientMessage(clientId: string, data: WebSocket.Data) {
    const startTime = performance.now();
    const metadata = this.clientMetadata.get(clientId);
    if (!metadata) {
      throw new Error('Client metadata not found');
    }

    // Rate limiting
    try {
      await this.rateLimiter.consume(clientId);
    } catch (error) {
      this.logger.warn(`Rate limit exceeded for client ${clientId}`);
      this.sendToClient(clientId, {
        type: 'rate_limit_exceeded',
        data: {
          retryAfter: error.msBeforeNext / 1000,
        },
        error: true,
      });
      return;
    }

    // Parse message
    let message: WebSocketMessage;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    // Validate message
    if (!message.type) {
      throw new Error('Message type is required');
    }

    // Update client metadata
    metadata.lastMessage = {
      type: message.type,
      timestamp: new Date(),
      size: data.toString().length,
    };

    this.logger.debug(
      `Received message ${message.type} from client ${clientId} (${data.toString().length} bytes)`,
    );

    // Handle different message types
    switch (message.type) {
      case 'subscribe':
        await this.handleSubscribe(clientId, message.data);
        break;
      case 'unsubscribe':
        await this.handleUnsubscribe(clientId, message.data);
        break;
      case 'join':
        await this.handleJoinRoom(clientId, message.data);
        break;
      case 'leave':
        await this.handleLeaveRoom(clientId, message.data);
        break;
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          data: {
            timestamp: message.data?.timestamp || Date.now(),
          },
        });
        break;
      case 'query':
        await this.handleQuery(clientId, message.data);
        break;
      case 'action':
        await this.handleAction(clientId, message.data);
        break;
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }

    this.logger.debug(
      `Processed message ${message.type} for client ${clientId} in ${performance.now() - startTime}ms`,
    );
  }

  private async handleSubscribe(clientId: string, data: any) {
    if (!data?.topic) {
      throw new Error('Topic is required for subscription');
    }

    const metadata = this.clientMetadata.get(clientId);
    if (!metadata) {
      throw new Error('Client metadata not found');
    }

    // Validate topic permissions
    if (!this.isTopicAllowed(data.topic, metadata)) {
      throw new Error('Topic not allowed');
    }

    // Add subscription
    if (!metadata.subscriptions) {
      metadata.subscriptions = new Set();
    }
    metadata.subscriptions.add(data.topic);

    this.logger.log(`Client ${clientId} subscribed to topic ${data.topic}`);

    // Send confirmation
    this.sendToClient(clientId, {
      type: 'subscribed',
      data: {
        topic: data.topic,
        timestamp: Date.now(),
      },
    });
  }

  private async handleUnsubscribe(clientId: string, data: any) {
    if (!data?.topic) {
      throw new Error('Topic is required for unsubscription');
    }

    const metadata = this.clientMetadata.get(clientId);
    if (!metadata?.subscriptions) {
      return;
    }

    metadata.subscriptions.delete(data.topic);
    this.logger.log(`Client ${clientId} unsubscribed from topic ${data.topic}`);

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      data: {
        topic: data.topic,
        timestamp: Date.now(),
      },
    });
  }

  private async handleJoinRoom(clientId: string, data: any) {
    if (!data?.room) {
      throw new Error('Room name is required');
    }

    this.joinRoom(clientId, data.room);
    this.logger.log(`Client ${clientId} joined room ${data.room}`);

    this.sendToClient(clientId, {
      type: 'room_joined',
      data: {
        room: data.room,
        timestamp: Date.now(),
      },
    });
  }

  private async handleLeaveRoom(clientId: string, data: any) {
    if (!data?.room) {
      throw new Error('Room name is required');
    }

    this.leaveRoom(clientId, data.room);
    this.logger.log(`Client ${clientId} left room ${data.room}`);

    this.sendToClient(clientId, {
      type: 'room_left',
      data: {
        room: data.room,
        timestamp: Date.now(),
      },
    });
  }

  private async handleQuery(clientId: string, data: any) {
    if (!data?.query) {
      throw new Error('Query is required');
    }

    const metadata = this.clientMetadata.get(clientId);
    if (!metadata) {
      throw new Error('Client metadata not found');
    }

    // Validate query permissions
    if (!this.isQueryAllowed(data.query, metadata)) {
      throw new Error('Query not allowed');
    }

    // In a real implementation, you would execute the query here
    // For this example, we'll just return mock data
    const mockResults = this.generateMockQueryResults(data.query);

    this.sendToClient(clientId, {
      type: 'query_result',
      data: {
        query: data.query,
        results: mockResults,
        timestamp: Date.now(),
      },
    });
  }

  private async handleAction(clientId: string, data: any) {
    if (!data?.action) {
      throw new Error('Action is required');
    }

    const metadata = this.clientMetadata.get(clientId);
    if (!metadata) {
      throw new Error('Client metadata not found');
    }

    // Validate action permissions
    if (!this.isActionAllowed(data.action, metadata)) {
      throw new Error('Action not allowed');
    }

    // In a real implementation, you would execute the action here
    // For this example, we'll just return a success message
    this.logger.log(`Client ${clientId} executed action ${data.action}`);

    this.sendToClient(clientId, {
      type: 'action_result',
      data: {
        action: data.action,
        success: true,
        timestamp: Date.now(),
      },
    });

    // Broadcast action to relevant rooms
    this.broadcastToRoom(`action:${data.action}`, {
      type: 'action_executed',
      data: {
        action: data.action,
        executedBy: metadata.userId,
        timestamp: Date.now(),
      },
    });
  }

  private isTopicAllowed(topic: string, metadata: ClientMetadata): boolean {
    // Implement topic permission logic
    // For example, only allow topics that start with the user's tenant ID
    if (topic.startsWith(`tenant:${metadata.tenantId}`)) {
      return true;
    }

    if (topic.startsWith(`user:${metadata.userId}`)) {
      return true;
    }

    if (topic === 'global' && metadata.roles.includes('admin')) {
      return true;
    }

    return false;
  }

  private isQueryAllowed(query: string, metadata: ClientMetadata): boolean {
    // Implement query permission logic
    // For example, only allow queries that reference the user's tenant
    if (query.includes(`tenant_id = '${metadata.tenantId}'`)) {
      return true;
    }

    if (query.includes(`user_id = '${metadata.userId}'`)) {
      return true;
    }

    if (metadata.roles.includes('admin')) {
      return true;
    }

    return false;
  }

  private isActionAllowed(action: string, metadata: ClientMetadata): boolean {
    // Implement action permission logic
    const allowedActions = {
      admin: ['delete_report', 'update_settings', 'manage_users'],
      editor: ['create_report', 'update_report'],
      viewer: ['view_report', 'comment'],
    };

    for (const role of metadata.roles) {
      if (allowedActions[role]?.includes(action)) {
        return true;
      }
    }

    return false;
  }

  private generateMockQueryResults(query: string): any {
    // Simple mock data generator based on query
    if (query.includes('sales')) {
      return {
        columns: ['date', 'region', 'product', 'amount'],
        data: [
          ['2023-11-01', 'North', 'Product A', 1500],
          ['2023-11-01', 'South', 'Product B', 2200],
          ['2023-11-02', 'North', 'Product A', 1800],
        ],
      };
    }

    if (query.includes('users')) {
      return {
        columns: ['id', 'name', 'email', 'last_active'],
        data: [
          ['1', 'John Doe', 'john@example.com', '2023-11-10T10:30:00Z'],
          ['2', 'Jane Smith', 'jane@example.com', '2023-11-10T09:15:00Z'],
        ],
      };
    }

    return {
      columns: ['id', 'value'],
      data: [
        ['1', Math.floor(Math.random() * 100)],
        ['2', Math.floor(Math.random() * 100)],
      ],
    };
  }

  handleDisconnect(clientId: string, code: number, reason: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const metadata = this.clientMetadata.get(clientId);
    if (metadata) {
      this.logger.log(
        `Client ${clientId} disconnected (User: ${metadata.userId}, Code: ${code}, Reason: ${reason})`,
      );

      // Remove from user connections
      if (metadata.userId && this.userConnections.has(metadata.userId)) {
        this.userConnections.get(metadata.userId)?.delete(clientId);
        if (this.userConnections.get(metadata.userId)?.size === 0) {
          this.userConnections.delete(metadata.userId);
        }
      }

      // Leave all rooms
      this.roomClients.forEach((clients, room) => {
        clients.delete(clientId);
        if (clients.size === 0) {
          this.roomClients.delete(room);
        }
      });
    }

    // Clean up
    this.clients.delete(clientId);
    this.clientMetadata.delete(clientId);
    this.messageQueue.delete(clientId);
  }

  joinRoom(clientId: string, roomName: string) {
    if (!this.roomClients.has(roomName)) {
      this.roomClients.set(roomName, new Set());
    }
    this.roomClients.get(roomName)?.add(clientId);

    // Track room membership in client metadata
    const metadata = this.clientMetadata.get(clientId);
    if (metadata) {
      if (!metadata.rooms) {
        metadata.rooms = new Set();
      }
      metadata.rooms.add(roomName);
    }
  }

  leaveRoom(clientId: string, roomName: string) {
    if (this.roomClients.has(roomName)) {
      this.roomClients.get(roomName)?.delete(clientId);
      if (this.roomClients.get(roomName)?.size === 0) {
        this.roomClients.delete(roomName);
      }
    }

    // Update client metadata
    const metadata = this.clientMetadata.get(clientId);
    if (metadata?.rooms) {
      metadata.rooms.delete(roomName);
    }
  }

  sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client || client.readyState !== WebSocket.OPEN) {
      this.logger.warn(`Cannot send message to client ${clientId} - connection not open`);
      return;
    }

    try {
      const messageString = JSON.stringify(message);
      const messageSize = Buffer.byteLength(messageString);

      // For large messages, use the queue
      if (messageSize > 10240) { // 10KB
        if (!this.messageQueue.has(clientId)) {
          this.messageQueue.set(clientId, []);
        }
        this.messageQueue.get(clientId)?.push(message);
      } else {
        client.send(messageString);
      }
    } catch (error) {
      this.logger.error(`Failed to send message to client ${clientId}: ${error.message}`);
    }
  }

  broadcastToRoom(roomName: string, message: WebSocketMessage, exceptClientId?: string) {
    if (!this.roomClients.has(roomName)) {
      return;
    }

    const clients = this.roomClients.get(roomName);
    if (!clients) return;

    clients.forEach((clientId) => {
      if (clientId !== exceptClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  broadcastToUser(userId: string, message: WebSocketMessage) {
    if (!this.userConnections.has(userId)) {
      return;
    }

    const clientIds = this.userConnections.get(userId);
    if (!clientIds) return;

    clientIds.forEach((clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  broadcastToAll(message: WebSocketMessage, exceptClientId?: string) {
    this.clients.forEach((client, clientId) => {
      if (clientId !== exceptClientId && client.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, message);
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getRoomCount(): number {
    return this.roomClients.size;
  }

  getUserCount(): number {
    return this.userConnections.size;
  }

  getStats(): WebSocketStats {
    const now = Date.now();
    const uptime = now - (this.clientMetadata.values().next().value?.connectedAt?.getTime() || now);

    return {
      clients: this.getClientCount(),
      rooms: this.getRoomCount(),
      users: this.getUserCount(),
      uptime,
      messagesSent: 0, // Would need to track this
      messagesReceived: 0, // Would need to track this
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    };
  }
}

interface WebSocketMessage {
  type: string;
  data: any;
  error?: boolean;
}

interface ClientMetadata {
  clientId: string;
  userId: string;
  tenantId: string;
  roles: string[];
  ipAddress: string;
  userAgent: string;
  connectedAt: Date;
  lastPong: number;
  lastMessage: {
    type: string;
    timestamp: Date;
    size: number;
  } | null;
  subscriptions?: Set<string>;
  rooms?: Set<string>;
}

interface WebSocketStats {
  clients: number;
  rooms: number;
  users: number;
  uptime: number;
  messagesSent: number;
  messagesReceived: number;
  memoryUsage: number;
}
```

### Real-Time Event Handlers

```typescript
// realtime-event.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket-gateway';
import { ReportService } from '../report/report.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { AlertService } from '../alert/alert.service';
import { DataProcessingService } from '../data-processing/data-processing.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { performance } from 'perf_hooks';

@Injectable()
export class RealtimeEventService {
  private readonly logger = new Logger(RealtimeEventService.name);
  private readonly eventHandlers = new Map<string, EventHandler[]>();
  private readonly eventProcessingTimes = new Map<string, number[]>();
  private readonly MAX_PROCESSING_TIMES = 100;

  constructor(
    private readonly websocketGateway: WebsocketGateway,
    private readonly reportService: ReportService,
    private readonly dashboardService: DashboardService,
    private readonly alertService: AlertService,
    private readonly dataProcessingService: DataProcessingService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.initializeEventHandlers();
    this.setupEventListeners();
  }

  private initializeEventHandlers() {
    // Report events
    this.registerEventHandler('report.created', this.handleReportCreated.bind(this));
    this.registerEventHandler('report.updated', this.handleReportUpdated.bind(this));
    this.registerEventHandler('report.deleted', this.handleReportDeleted.bind(this));
    this.registerEventHandler('report.shared', this.handleReportShared.bind(this));
    this.registerEventHandler('report.viewed', this.handleReportViewed.bind(this));

    // Dashboard events
    this.registerEventHandler('dashboard.created', this.handleDashboardCreated.bind(this));
    this.registerEventHandler('dashboard.updated', this.handleDashboardUpdated.bind(this));
    this.registerEventHandler('dashboard.deleted', this.handleDashboardDeleted.bind(this));

    // Data events
    this.registerEventHandler('data.updated', this.handleDataUpdated.bind(this));
    this.registerEventHandler('data.processed', this.handleDataProcessed.bind(this));

    // Alert events
    this.registerEventHandler('alert.triggered', this.handleAlertTriggered.bind(this));
    this.registerEventHandler('alert.resolved', this.handleAlertResolved.bind(this));

    // System events
    this.registerEventHandler('system.health', this.handleSystemHealth.bind(this));
    this.registerEventHandler('system.maintenance', this.handleSystemMaintenance.bind(this));
  }

  private setupEventListeners() {
    // Listen for all events
    this.eventEmitter.on('*', (event: string, payload: any) => {
      this.processEvent(event, payload).catch((error) => {
        this.logger.error(`Error processing event ${event}: ${error.message}`);
      });
    });
  }

  private registerEventHandler(eventName: string, handler: EventHandler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)?.push(handler);
  }

  private async processEvent(eventName: string, payload: any) {
    const startTime = performance.now();
    const handlers = this.eventHandlers.get(eventName) || [];

    this.logger.debug(`Processing event ${eventName} with ${handlers.length} handlers`);

    try {
      // Process all handlers for this event
      await Promise.all(handlers.map((handler) => handler(payload)));

      // Track processing time
      const processingTime = performance.now() - startTime;
      this.trackProcessingTime(eventName, processingTime);

      this.logger.debug(`Processed event ${eventName} in ${processingTime.toFixed(2)}ms`);
    } catch (error) {
      this.logger.error(`Error processing event ${eventName}: ${error.message}`);
      throw error;
    }
  }

  private trackProcessingTime(eventName: string, time: number) {
    if (!this.eventProcessingTimes.has(eventName)) {
      this.eventProcessingTimes.set(eventName, []);
    }

    const times = this.eventProcessingTimes.get(eventName) || [];
    times.push(time);

    // Keep only the last N processing times
    if (times.length > this.MAX_PROCESSING_TIMES) {
      times.shift();
    }
  }

  private getAverageProcessingTime(eventName: string): number {
    const times = this.eventProcessingTimes.get(eventName) || [];
    if (times.length === 0) return 0;

    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }

  // Event Handlers

  private async handleReportCreated(payload: ReportEventPayload) {
    const { report, userId } = payload;

    // Broadcast to user's personal room
    this.websocketGateway.broadcastToRoom(`user:${userId}`, {
      type: 'report_created',
      data: {
        report: this.sanitizeReport(report),
        timestamp: Date.now(),
      },
    });

    // Broadcast to tenant room
    this.websocketGateway.broadcastToRoom(`tenant:${report.tenantId}`, {
      type: 'report_activity',
      data: {
        type: 'created',
        reportId: report.id,
        reportName: report.name,
        userId,
        timestamp: Date.now(),
      },
    });

    // If report is public, broadcast to global room
    if (report.visibility === 'public') {
      this.websocketGateway.broadcastToRoom('global', {
        type: 'public_report_created',
        data: {
          reportId: report.id,
          reportName: report.name,
          tenantId: report.tenantId,
          timestamp: Date.now(),
        },
      });
    }
  }

  private async handleReportUpdated(payload: ReportEventPayload) {
    const { report, userId, changes } = payload;

    // Broadcast to all users who have access to this report
    const usersWithAccess = await this.reportService.getUsersWithAccess(report.id);
    usersWithAccess.forEach((user) => {
      this.websocketGateway.broadcastToRoom(`user:${user.id}`, {
        type: 'report_updated',
        data: {
          reportId: report.id,
          changes,
          timestamp: Date.now(),
        },
      });
    });

    // Broadcast to tenant room
    this.websocketGateway.broadcastToRoom(`tenant:${report.tenantId}`, {
      type: 'report_activity',
      data: {
        type: 'updated',
        reportId: report.id,
        reportName: report.name,
        userId,
        changes,
        timestamp: Date.now(),
      },
    });
  }

  private async handleReportDeleted(payload: ReportEventPayload) {
    const { report, userId } = payload;

    // Broadcast to all users who had access to this report
    const usersWithAccess = await this.reportService.getUsersWithAccess(report.id);
    usersWithAccess.forEach((user) => {
      this.websocketGateway.broadcastToRoom(`user:${user.id}`, {
        type: 'report_deleted',
        data: {
          reportId: report.id,
          reportName: report.name,
          timestamp: Date.now(),
        },
      });
    });

    // Broadcast to tenant room
    this.websocketGateway.broadcastToRoom(`tenant:${report.tenantId}`, {
      type: 'report_activity',
      data: {
        type: 'deleted',
        reportId: report.id,
        reportName: report.name,
        userId,
        timestamp: Date.now(),
      },
    });
  }

  private async handleReportShared(payload: ReportSharedEventPayload) {
    const { report, sharedWith, sharedBy } = payload;

    // Notify the user who shared the report
    this.websocketGateway.broadcastToRoom(`user:${sharedBy}`, {
      type: 'report_shared',
      data: {
        reportId: report.id,
        reportName: report.name,
        sharedWith,
        timestamp: Date.now(),
      },
    });

    // Notify all users who were shared with
    sharedWith.forEach((user) => {
      this.websocketGateway.broadcastToRoom(`user:${user.id}`, {
        type: 'report_shared_with_you',
        data: {
          reportId: report.id,
          reportName: report.name,
          sharedBy: {
            id: sharedBy,
            name: 'A colleague', // Would fetch actual name in real implementation
          },
          timestamp: Date.now(),
        },
      });
    });
  }

  private async handleReportViewed(payload: ReportViewedEventPayload) {
    const { report, userId, viewCount } = payload;

    // Update the report's view count in real-time
    this.websocketGateway.broadcastToRoom(`report:${report.id}`, {
      type: 'report_view_count_updated',
      data: {
        reportId: report.id,
        viewCount,
        timestamp: Date.now(),
      },
    });

    // Notify the report owner
    if (report.createdById !== userId) {
      this.websocketGateway.broadcastToRoom(`user:${report.createdById}`, {
        type: 'report_viewed',
        data: {
          reportId: report.id,
          reportName: report.name,
          viewedBy: userId,
          timestamp: Date.now(),
        },
      });
    }
  }

  private async handleDashboardCreated(payload: DashboardEventPayload) {
    const { dashboard, userId } = payload;

    // Broadcast to user's personal room
    this.websocketGateway.broadcastToRoom(`user:${userId}`, {
      type: 'dashboard_created',
      data: {
        dashboard: this.sanitizeDashboard(dashboard),
        timestamp: Date.now(),
      },
    });

    // Broadcast to tenant room
    this.websocketGateway.broadcastToRoom(`tenant:${dashboard.tenantId}`, {
      type: 'dashboard_activity',
      data: {
        type: 'created',
        dashboardId: dashboard.id,
        dashboardName: dashboard.name,
        userId,
        timestamp: Date.now(),
      },
    });
  }

  private async handleDashboardUpdated(payload: DashboardEventPayload) {
    const { dashboard, userId, changes } = payload;

    // Broadcast to all users who have access to this dashboard
    const usersWithAccess = await this.dashboardService.getUsersWithAccess(dashboard.id);
    usersWithAccess.forEach((user) => {
      this.websocketGateway.broadcastToRoom(`user:${user.id}`, {
        type: 'dashboard_updated',
        data: {
          dashboardId: dashboard.id,
          changes,
          timestamp: Date.now(),
        },
      });
    });
  }

  private async handleDashboardDeleted(payload: DashboardEventPayload) {
    const { dashboard, userId } = payload;

    // Broadcast to all users who had access to this dashboard
    const usersWithAccess = await this.dashboardService.getUsersWithAccess(dashboard.id);
    usersWithAccess.forEach((user) => {
      this.websocketGateway.broadcastToRoom(`user:${user.id}`, {
        type: 'dashboard_deleted',
        data: {
          dashboardId: dashboard.id,
          dashboardName: dashboard.name,
          timestamp: Date.now(),
        },
      });
    });
  }

  private async handleDataUpdated(payload: DataUpdatedEventPayload) {
    const { dataSource, records, tenantId } = payload;

    // Broadcast to all users in the tenant
    this.websocketGateway.broadcastToRoom(`tenant:${tenantId}`, {
      type: 'data_updated',
      data: {
        dataSource,
        recordCount: records.length,
        timestamp: Date.now(),
      },
    });

    // If this data source is used in any dashboards, notify those dashboard viewers
    const affectedDashboards = await this.dashboardService.getDashboardsUsingDataSource(
      dataSource,
      tenantId,
    );

    affectedDashboards.forEach((dashboard) => {
      this.websocketGateway.broadcastToRoom(`dashboard:${dashboard.id}`, {
        type: 'dashboard_data_updated',
        data: {
          dashboardId: dashboard.id,
          dataSource,
          timestamp: Date.now(),
        },
      });
    });
  }

  private async handleDataProcessed(payload: DataProcessedEventPayload) {
    const { jobId, status, recordsProcessed, tenantId } = payload;

    // Broadcast to tenant admins
    this.websocketGateway.broadcastToRoom(`tenant:${tenantId}:admins`, {
      type: 'data_processing_update',
      data: {
        jobId,
        status,
        recordsProcessed,
        timestamp: Date.now(),
      },
    });

    // If completed, broadcast to all users in the tenant
    if (status === 'completed') {
      this.websocketGateway.broadcastToRoom(`tenant:${tenantId}`, {
        type: 'data_processing_completed',
        data: {
          jobId,
          recordsProcessed,
          timestamp: Date.now(),
        },
      });
    }
  }

  private async handleAlertTriggered(payload: AlertEventPayload) {
    const { alert, triggeredBy, value, threshold } = payload;

    // Notify the alert owner
    this.websocketGateway.broadcastToRoom(`user:${alert.createdById}`, {
      type: 'alert_triggered',
      data: {
        alertId: alert.id,
        alertName: alert.name,
        condition: alert.condition,
        value,
        threshold,
        timestamp: Date.now(),
      },
    });

    // Notify all users who subscribed to this alert
    const subscribers = await this.alertService.getAlertSubscribers(alert.id);
    subscribers.forEach((user) => {
      this.websocketGateway.broadcastToRoom(`user:${user.id}`, {
        type: 'alert_notification',
        data: {
          alertId: alert.id,
          alertName: alert.name,
          condition: alert.condition,
          value,
          threshold,
          timestamp: Date.now(),
        },
      });
    });

    // Broadcast to tenant room
    this.websocketGateway.broadcastToRoom(`tenant:${alert.tenantId}`, {
      type: 'alert_activity',
      data: {
        alertId: alert.id,
        alertName: alert.name,
        status: 'triggered',
        value,
        threshold,
        timestamp: Date.now(),
      },
    });
  }

  private async handleAlertResolved(payload: AlertEventPayload) {
    const { alert, triggeredBy, value, threshold } = payload;

    // Notify the alert owner
    this.websocketGateway.broadcastToRoom(`user:${alert.createdById}`, {
      type: 'alert_resolved',
      data: {
        alertId: alert.id,
        alertName: alert.name,
        condition: alert.condition,
        value,
        threshold,
        timestamp: Date.now(),
      },
    });

    // Notify all users who subscribed to this alert
    const subscribers = await this.alertService.getAlertSubscribers(alert.id);
    subscribers.forEach((user) => {
      this.websocketGateway.broadcastToRoom(`user:${user.id}`, {
        type: 'alert_notification',
        data: {
          alertId: alert.id,
          alertName: alert.name,
          condition: alert.condition,
          value,
          threshold,
          status: 'resolved',
          timestamp: Date.now(),
        },
      });
    });

    // Broadcast to tenant room
    this.websocketGateway.broadcastToRoom(`tenant:${alert.tenantId}`, {
      type: 'alert_activity',
      data: {
        alertId: alert.id,
        alertName: alert.name,
        status: 'resolved',
        value,
        threshold,
        timestamp: Date.now(),
      },
    });
  }

  private async handleSystemHealth(payload: SystemHealthEventPayload) {
    const { status, metrics, timestamp } = payload;

    // Broadcast to all admin users
    this.websocketGateway.broadcastToRoom('admin', {
      type: 'system_health_update',
      data: {
        status,
        metrics,
        timestamp,
      },
    });
  }

  private async handleSystemMaintenance(payload: SystemMaintenanceEventPayload) {
    const { type, startTime, endTime, status, message } = payload;

    // Broadcast to all admin users
    this.websocketGateway.broadcastToRoom('admin', {
      type: 'system_maintenance',
      data: {
        type,
        startTime,
        endTime,
        status,
        message,
        timestamp: Date.now(),
      },
    });

    // If maintenance is starting, broadcast to all users
    if (status === 'starting') {
      this.websocketGateway.broadcastToAll({
        type: 'system_maintenance_notice',
        data: {
          type,
          startTime,
          endTime,
          message,
          timestamp: Date.now(),
        },
      });
    }
  }

  private sanitizeReport(report: any): any {
    // Remove sensitive fields from the report before broadcasting
    const { id, name, description, createdAt, updatedAt, visibility, tags, viewCount } = report;
    return {
      id,
      name,
      description,
      createdAt,
      updatedAt,
      visibility,
      tags,
      viewCount,
    };
  }

  private sanitizeDashboard(dashboard: any): any {
    // Remove sensitive fields from the dashboard before broadcasting
    const { id, name, description, createdAt, updatedAt, isPublic } = dashboard;
    return {
      id,
      name,
      description,
      createdAt,
      updatedAt,
      isPublic,
    };
  }

  // Periodic tasks

  @Cron(CronExpression.EVERY_MINUTE)
  async broadcastSystemStats() {
    const stats = this.websocketGateway.getStats();
    const avgProcessingTimes = Array.from(this.eventProcessingTimes.entries()).map(
      ([event, times]) => ({
        event,
        avgTime: this.getAverageProcessingTime(event),
      }),
    );

    this.websocketGateway.broadcastToRoom('admin', {
      type: 'system_stats',
      data: {
        ...stats,
        eventProcessingTimes: avgProcessingTimes,
        timestamp: Date.now(),
      },
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkDataFreshness() {
    const dataSources = await this.dataProcessingService.getDataSources();

    for (const source of dataSources) {
      const freshness = await this.dataProcessingService.checkDataFreshness(source.id);

      if (freshness.status !== 'ok') {
        this.websocketGateway.broadcastToRoom(`tenant:${source.tenantId}:admins`, {
          type: 'data_freshness_alert',
          data: {
            dataSourceId: source.id,
            dataSourceName: source.name,
            status: freshness.status,
            lastUpdated: freshness.lastUpdated,
            expectedFrequency: freshness.expectedFrequency,
            timestamp: Date.now(),
          },
        });
      }
    }
  }
}

type EventHandler = (payload: any) => Promise<void>;

interface ReportEventPayload {
  report: any;
  userId: string;
  changes?: any;
}

interface ReportSharedEventPayload {
  report: any;
  sharedWith: any[];
  sharedBy: string;
}

interface ReportViewedEventPayload {
  report: any;
  userId: string;
  viewCount: number;
}

interface DashboardEventPayload {
  dashboard: any;
  userId: string;
  changes?: any;
}

interface DataUpdatedEventPayload {
  dataSource: string;
  records: any[];
  tenantId: string;
}

interface DataProcessedEventPayload {
  jobId: string;
  status: 'started' | 'processing' | 'completed' | 'failed';
  recordsProcessed: number;
  tenantId: string;
}

interface AlertEventPayload {
  alert: any;
  triggeredBy: string;
  value: any;
  threshold: any;
}

interface SystemHealthEventPayload {
  status: 'ok' | 'warning' | 'critical';
  metrics: any;
  timestamp: number;
}

interface SystemMaintenanceEventPayload {
  type: 'scheduled' | 'unscheduled';
  startTime: number;
  endTime: number;
  status: 'starting' | 'in_progress' | 'completed';
  message: string;
}
```

### Client-Side WebSocket Integration

```typescript
// websocket.service.ts (Client-side)
import { Injectable, Logger, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent, merge } from 'rxjs';
import { filter, map, shareReplay, takeUntil, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private readonly logger = new Logger('WebsocketService');
  private socket: WebSocket | null = null;
  private connectionStatus = new BehaviorSubject<WebsocketConnectionStatus>('disconnected');
  private messageSubject = new Subject<WebsocketMessage>();
  private destroy$ = new Subject<void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: number | null = null;
  private pendingMessages: WebsocketMessage[] = [];
  private messageQueue: WebsocketMessage[] = [];
  private isProcessingQueue = false;
  private connectionId: string | null = null;
  private clientId: string | null = null;

  // Public observables
  public connectionStatus$ = this.connectionStatus.asObservable();
  public messages$ = this.messageSubject.asObservable();

  constructor(
    private authService: AuthService,
    private ngZone: NgZone,
  ) {
    this.setupAuthListener();
  }

  /**
   * Connects to the WebSocket server
   */
  connect(): void {
    if (this.connectionStatus.value === 'connected' || this.connectionStatus.value === 'connecting') {
      this.logger.log('WebSocket already connected or connecting');
      return;
    }

    this.connectionStatus.next('connecting');
    this.reconnectAttempts = 0;

    try {
      // Get WebSocket URL from environment
      const wsUrl = this.getWebSocketUrl();

      this.logger.log(`Connecting to WebSocket at ${wsUrl}`);

      // Create WebSocket connection
      this.socket = new WebSocket(wsUrl);

      // Set up event listeners
      this.setupSocketListeners();

      // Start heartbeat
      this.startHeartbeat();

    } catch (error) {
      this.logger.error('WebSocket connection error:', error);
      this.connectionStatus.next('disconnected');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnects from the WebSocket server
   */
  disconnect(): void {
    if (this.connectionStatus.value === 'disconnected') {
      return;
    }

    this.logger.log('Disconnecting from WebSocket');

    // Clear reconnect timer if exists
    if (this.reconnectDelay) {
      clearTimeout(this.reconnectDelay);
      this.reconnectDelay = null;
    }

    // Clear heartbeat
    this.stopHeartbeat();

    // Close connection
    if (this.socket) {
      this.socket.close(1000, 'Client initiated disconnect');
      this.socket = null;
    }

    this.connectionStatus.next('disconnected');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Gets the WebSocket URL with authentication token
   * @returns WebSocket URL
   */
  private getWebSocketUrl(): string {
    const token = this.authService.getAccessToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const baseUrl = environment.production
      ? environment.wsUrl
      : environment.wsUrl.replace('https://', 'wss://');

    return `${baseUrl}/ws-analytics?token=${encodeURIComponent(token)}`;
  }

  /**
   * Sets up WebSocket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Handle open event
    this.socket.onopen = (event) => {
      this.ngZone.run(() => {
        this.logger.log('WebSocket connection established');
        this.connectionStatus.next('connected');
        this.reconnectAttempts = 0;

        // Process any pending messages
        this.processPendingMessages();

        // Send any queued messages
        this.processMessageQueue();
      });
    };

    // Handle message event
    this.socket.onmessage = (event) => {
      this.ngZone.run(() => {
        try {
          const message: WebsocketMessage = JSON.parse(event.data);

          // Handle connection established message
          if (message.type === 'connection_established') {
            this.connectionId = message.data.connectionId;
            this.clientId = message.data.clientId;
            this.logger.log(`Connection established with ID: ${this.connectionId}`);
            return;
          }

          // Handle pong messages
          if (message.type === 'pong') {
            this.logger.debug('Received pong from server');
            return;
          }

          // Handle batch messages
          if (message.type === 'batch') {
            message.data.forEach((msg: WebsocketMessage) => {
              this.messageSubject.next(msg);
            });
            return;
          }

          // Forward all other messages to subscribers
          this.messageSubject.next(message);
        } catch (error) {
          this.logger.error('Error parsing WebSocket message:', error);
        }
      });
    };

    // Handle close event
    this.socket.onclose = (event) => {
      this.ngZone.run(() => {
        this.logger.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
        this.connectionStatus.next('disconnected');

        if (event.code !== 1000) { // 1000 is normal closure
          this.scheduleReconnect();
        }
      });
    };

    // Handle error event
    this.socket.onerror = (event) => {
      this.ngZone.run(() => {
        this.logger.error('WebSocket error:', event);
        this.connectionStatus.next('error');
      });
    };
  }

  /**
   * Sets up authentication state listener
   */
  private setupAuthListener(): void {
    this.authService.authState$.pipe(
      takeUntil(this.destroy$),
    ).subscribe((state) => {
      if (state === 'authenticated') {
        // Connect when authenticated
        this.connect();
      } else {
        // Disconnect when not authenticated
        this.disconnect();
      }
    });
  }

  /**
   * Schedules a reconnect attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.warn('Max reconnect attempts reached');
      this.connectionStatus.next('disconnected');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.getReconnectDelay();

    this.logger.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectDelay = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Gets the reconnect delay with exponential backoff
   * @returns Delay in milliseconds
   */
  private getReconnectDelay(): number {
    return Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Max 30 seconds
  }

  /**
   * Starts the heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          data: {
            timestamp: Date.now(),
          },
        });
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stops the heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Processes pending messages (messages sent while disconnected)
   */
  private processPendingMessages(): void {
    if (this.pendingMessages.length === 0) return;

    this.logger.log(`Processing ${this.pendingMessages.length} pending messages`);

    this.pendingMessages.forEach((message) => {
      this.send(message);
    });

    this.pendingMessages = [];
  }

  /**
   * Processes the message queue
   */
  private processMessageQueue(): void {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;

    this.isProcessingQueue = true;

    const processNext = () => {
      if (this.messageQueue.length === 0 || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
        this.isProcessingQueue = false;
        return;
      }

      const message = this.messageQueue.shift();
      if (message) {
        this.sendInternal(message).then(() => {
          // Add small delay between messages to avoid overwhelming the server
          setTimeout(processNext, 50);
        }).catch(() => {
          this.isProcessingQueue = false;
        });
      } else {
        this.isProcessingQueue = false;
      }
    };

    processNext();
  }

  /**
   * Sends a message through the WebSocket connection
   * @param message - Message to send
   */
  send(message: WebsocketMessage): void {
    if (this.connectionStatus.value !== 'connected' || !this.socket) {
      this.logger.warn('WebSocket not connected, adding message to pending queue');
      this.pendingMessages.push(message);
      return;
    }

    // Add to queue and process
    this.messageQueue.push(message);
    this.processMessageQueue();
  }

  /**
   * Internal method to send a message
   * @param message - Message to send
   * @returns Promise that resolves when message is sent
   */
  private sendInternal(message: WebsocketMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        this.socket.send(JSON.stringify(message));
        this.logger.debug(`Sent message of type: ${message.type}`);
        resolve();
      } catch (error) {
        this.logger.error('Error sending WebSocket message:', error);
        reject(error);
      }
    });
  }

  /**
   * Subscribes to a specific message type
   * @param type - Message type to subscribe to
   * @returns Observable of messages of the specified type
   */
  on<T = any>(type: string): Observable<T> {
    return this.messages$.pipe(
      filter((message) => message.type === type),
      map((message) => message.data as T),
      shareReplay(1),
    );
  }

  /**
   * Subscribes to a room
   * @param room - Room name to join
   */
  joinRoom(room: string): void {
    this.send({
      type: 'join',
      data: {
        room,
      },
    });
  }

  /**
   * Unsubscribes from a room
   * @param room - Room name to leave
   */
  leaveRoom(room: string): void {
    this.send({
      type: 'leave',
      data: {
        room,
      },
    });
  }

  /**
   * Subscribes to a topic
   * @param topic - Topic to subscribe to
   */
  subscribe(topic: string): void {
    this.send({
      type: 'subscribe',
      data: {
        topic,
      },
    });
  }

  /**
   * Unsubscribes from a topic
   * @param topic - Topic to unsubscribe from
   */
  unsubscribe(topic: string): void {
    this.send({
      type: 'unsubscribe',
      data: {
        topic,
      },
    });
  }

  /**
   * Executes a query through WebSocket
   * @param query - Query to execute
   * @returns Promise with query results
   */
  async query<T = any>(query: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const subscription = this.on<QueryResult<T>>('query_result').pipe(
        filter((result) => result.query === query),
      ).subscribe({
        next: (result) => {
          subscription.unsubscribe();
          resolve(result.results);
        },
        error: (error) => {
          subscription.unsubscribe();
          reject(error);
        },
      });

      this.send({
        type: 'query',
        data: {
          query,
        },
      });
    });
  }

  /**
   * Executes an action through WebSocket
   * @param action - Action to execute
   * @param data - Action data
   * @returns Promise with action result
   */
  async executeAction(action: string, data: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const subscription = this.on<ActionResult>('action_result').pipe(
        filter((result) => result.action === action),
      ).subscribe({
        next: (result) => {
          subscription.unsubscribe();
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.message || 'Action failed'));
          }
        },
        error: (error) => {
          subscription.unsubscribe();
          reject(error);
        },
      });

      this.send({
        type: 'action',
        data: {
          action,
          ...data,
        },
      });
    });
  }

  /**
   * Gets the current connection status
   * @returns Current connection status
   */
  getConnectionStatus(): WebsocketConnectionStatus {
    return this.connectionStatus.value;
  }

  /**
   * Gets the connection ID
   * @returns Connection ID or null if not connected
   */
  getConnectionId(): string | null {
    return this.connectionId;
  }

  /**
   * Gets the client ID
   * @returns Client ID or null if not connected
   */
  getClientId(): string | null {
    return this.clientId;
  }

  /**
   * Gets WebSocket statistics
   * @returns WebSocket statistics
   */
  getStats(): WebsocketStats {
    return {
      connectionStatus: this.connectionStatus.value,
      reconnectAttempts: this.reconnectAttempts,
      pendingMessages: this.pendingMessages.length,
      queuedMessages: this.messageQueue.length,
      connectionId: this.connectionId,
      clientId: this.clientId,
    };
  }
}

export type WebsocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebsocketMessage {
  type: string;
  data: any;
  error?: boolean;
}

export interface QueryResult<T> {
  query: string;
  results: T;
  timestamp: number;
}

export interface ActionResult {
  action: string;
  success: boolean;
  message?: string;
  data?: any;
  timestamp: number;
}

export interface WebsocketStats {
  connectionStatus: WebsocketConnectionStatus;
  reconnectAttempts: number;
  pendingMessages: number;
  queuedMessages: number;
  connectionId: string | null;
  clientId: string | null;
}
```

### Room/Channel Management

```typescript
// room-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket-gateway';
import { UserService } from '../auth/user.service';
import { ReportService } from '../report/report.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { AlertService } from '../alert/alert.service';
import { DataSourceService } from '../data-source/data-source.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { performance } from 'perf_hooks';

@Injectable()
export class RoomManagerService {
  private readonly logger = new Logger(RoomManagerService.name);
  private readonly roomSubscriptions = new Map<string, Set<string>>(); // roomName -> Set<clientId>
  private readonly clientRooms = new Map<string, Set<string>>(); // clientId -> Set<roomName>
  private readonly roomMetrics = new Map<string, RoomMetrics>();
  private readonly MAX_ROOM_SIZE = 1000; // Maximum clients per room
  private readonly CLEANUP_INTERVAL = 3600000; // 1 hour

  constructor(
    private readonly websocketGateway: WebsocketGateway,
    private readonly userService: UserService,
    private readonly reportService: ReportService,
    private readonly dashboardService: DashboardService,
    private readonly alertService: AlertService,
    private readonly dataSourceService: DataSourceService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.initializeDefaultRooms();
    this.setupEventListeners();
    this.startCleanupTimer();
  }

  private initializeDefaultRooms() {
    // Create default rooms that should always exist
    const defaultRooms = ['global', 'admin', 'system'];

    defaultRooms.forEach((room) => {
      if (!this.roomSubscriptions.has(room)) {
        this.roomSubscriptions.set(room, new Set());
        this.roomMetrics.set(room, {
          createdAt: new Date(),
          lastActivity: new Date(),
          messageCount: 0,
          clientCount: 0,
        });
      }
    });

    this.logger.log(`Initialized ${defaultRooms.length} default rooms`);
  }

  private setupEventListeners() {
    // Listen for client connection events
    this.eventEmitter.on('client.connected', (clientId: string) => {
      this.handleClientConnected(clientId);
    });

    // Listen for client disconnection events
    this.eventEmitter.on('client.disconnected', (clientId: string) => {
      this.handleClientDisconnected(clientId);
    });

    // Listen for room join events
    this.eventEmitter.on('room.joined', ({ clientId, roomName }: RoomEvent) => {
      this.handleRoomJoined(clientId, roomName);
    });

    // Listen for room leave events
    this.eventEmitter.on('room.left', ({ clientId, roomName }: RoomEvent) => {
      this.handleRoomLeft(clientId, roomName);
    });
  }

  private startCleanupTimer() {
    // Clean up inactive rooms periodically
    setInterval(() => {
      this.cleanupInactiveRooms();
    }, this.CLEANUP_INTERVAL);
  }

  private handleClientConnected(clientId: string) {
    // Add client to their personal room
    const metadata = this.websocketGateway.getClientMetadata(clientId);
    if (metadata?.userId) {
      this.joinRoom(clientId, `user:${metadata.userId}`);
    }

    // Add client to their tenant room
    if (metadata?.tenantId) {
      this.joinRoom(clientId, `tenant:${metadata.tenantId}`);

      // Add to tenant admin room if user is admin
      if (metadata.roles.includes('admin')) {
        this.joinRoom(clientId, `tenant:${metadata.tenantId}:admins`);
      }
    }
  }

  private handleClientDisconnected(clientId: string) {
    // Remove client from all rooms
    const rooms = this.clientRooms.get(clientId);
    if (rooms) {
      rooms.forEach((roomName) => {
        this.leaveRoom(clientId, roomName);
      });
    }

    this.clientRooms.delete(clientId);
  }

  private handleRoomJoined(clientId: string, roomName: string) {
    // Track room membership
    if (!this.clientRooms.has(clientId)) {
      this.clientRooms.set(clientId, new Set());
    }
    this.clientRooms.get(clientId)?.add(roomName);

    // Update room metrics
    this.updateRoomMetrics(roomName, 'join');
  }

  private handleRoomLeft(clientId: string, roomName: string) {
    // Update room metrics
    this.updateRoomMetrics(roomName, 'leave');

    // Remove from client's room set
    const rooms = this.clientRooms.get(clientId);
    if (rooms) {
      rooms.delete(roomName);
      if (rooms.size === 0) {
        this.clientRooms.delete(clientId);
      }
    }
  }

  /**
   * Joins a client to a room
   * @param clientId - Client ID
   * @param roomName - Room name
   */
  joinRoom(clientId: string, roomName: string): void {
    // Check if room exists, if not create it
    if (!this.roomSubscriptions.has(roomName)) {
      this.roomSubscriptions.set(roomName, new Set());
      this.roomMetrics.set(roomName, {
        createdAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        clientCount: 0,
      });
      this.logger.log(`Created new room: ${roomName}`);
    }

    // Check if client is already in the room
    const roomClients = this.roomSubscriptions.get(roomName);
    if (roomClients?.has(clientId)) {
      this.logger.debug(`Client ${clientId} already in room ${roomName}`);
      return;
    }

    // Check room size limit
    if (roomClients && roomClients.size >= this.MAX_ROOM_SIZE) {
      this.logger.warn(`Room ${roomName} has reached maximum capacity (${this.MAX_ROOM_SIZE})`);
      throw new Error('Room is full');
    }

    // Add client to room
    roomClients?.add(clientId);
    this.logger.debug(`Client ${clientId} joined room ${roomName}`);

    // Emit event
    this.eventEmitter.emit('room.joined', { clientId, roomName });
  }

  /**
   * Removes a client from a room
   * @param clientId - Client ID
   * @param roomName - Room name
   */
  leaveRoom(clientId: string, roomName: string): void {
    const roomClients = this.roomSubscriptions.get(roomName);
    if (!roomClients || !roomClients.has(clientId)) {
      this.logger.debug(`Client ${clientId} not in room ${roomName}`);
      return;
    }

    // Remove client from room
    roomClients.delete(clientId);
    this.logger.debug(`Client ${clientId} left room ${roomName}`);

    // If room is empty, clean it up
    if (roomClients.size === 0) {
      this.roomSubscriptions.delete(roomName);
      this.roomMetrics.delete(roomName);
      this.logger.log(`Room ${roomName} is now empty and has been removed`);
    }

    // Emit event
    this.eventEmitter.emit('room.left', { clientId, roomName });
  }

  /**
   * Gets all clients in a room
   * @param roomName - Room name
   * @returns Set of client IDs
   */
  getClientsInRoom(roomName: string): Set<string> {
    return this.roomSubscriptions.get(roomName) || new Set();
  }

  /**
   * Gets all rooms a client is in
   * @param clientId - Client ID
   * @returns Set of room names
   */
  getRoomsForClient(clientId: string): Set<string> {
    return this.clientRooms.get(clientId) || new Set();
  }

  /**
   * Gets all active rooms
   * @returns Array of room names
   */
  getAllRooms(): string[] {
    return Array.from(this.roomSubscriptions.keys());
  }

  /**
   * Gets room metrics
   * @param roomName - Room name
   * @returns Room metrics or null if room doesn't exist
   */
  getRoomMetrics(roomName: string): RoomMetrics | null {
    return this.roomMetrics.get(roomName) || null;
  }

  /**
   * Updates room metrics
   * @param roomName - Room name
   * @param action - Action that occurred (join, leave, message)
   */
  private updateRoomMetrics(roomName: string, action: 'join' | 'leave' | 'message'): void {
    const metrics = this.roomMetrics.get(roomName);
    if (!metrics) return;

    metrics.lastActivity = new Date();

    if (action === 'join') {
      metrics.clientCount++;
    } else if (action === 'leave') {
      metrics.clientCount--;
    } else if (action === 'message') {
      metrics.messageCount++;
    }
  }

  /**
   * Broadcasts a message to a room
   * @param roomName - Room name
   * @param message - Message to broadcast
   * @param exceptClientId - Optional client ID to exclude
   */
  broadcastToRoom(roomName: string, message: WebsocketMessage, exceptClientId?: string): void {
    const clients = this.getClientsInRoom(roomName);
    if (clients.size === 0) return;

    clients.forEach((clientId) => {
      if (clientId !== exceptClientId) {
        this.websocketGateway.sendToClient(clientId, message);
      }
    });

    // Update room metrics
    this.updateRoomMetrics(roomName, 'message');
  }

  /**
   * Broadcasts a message to multiple rooms
   * @param roomNames - Array of room names
   * @param message - Message to broadcast
   * @param exceptClientId - Optional client ID to exclude
   */
  broadcastToRooms(roomNames: string[], message: WebsocketMessage, exceptClientId?: string): void {
    roomNames.forEach((roomName) => {
      this.broadcastToRoom(roomName, message, exceptClientId);
    });
  }

  /**
   * Creates a dynamic room based on entity type and ID
   * @param entityType - Type of entity (report, dashboard, etc.)
   * @param entityId - ID of the entity
   * @param options - Room options
   * @returns Room name
   */
  createEntityRoom(entityType: string, entityId: string, options: EntityRoomOptions = {}): string {
    const roomName = `${entityType}:${entityId}`;

    // Create the room if it doesn't exist
    if (!this.roomSubscriptions.has(roomName)) {
      this.roomSubscriptions.set(roomName, new Set());
      this.roomMetrics.set(roomName, {
        createdAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        clientCount: 0,
        entityType,
        entityId,
        ...options,
      });
      this.logger.log(`Created entity room: ${roomName}`);
    }

    return roomName;
  }

  /**
   * Gets all rooms for a specific entity
   * @param entityType - Type of entity
   * @param entityId - ID of the entity
   * @returns Array of room names
   */
  getEntityRooms(entityType: string, entityId: string): string[] {
    const prefix = `${entityType}:${entityId}`;
    return this.getAllRooms().filter((room) => room.startsWith(prefix));
  }

  /**
   * Automatically joins clients to relevant entity rooms
   * @param clientId - Client ID
   */
  async autoJoinEntityRooms(clientId: string): Promise<void> {
    const metadata = this.websocketGateway.getClientMetadata(clientId);
    if (!metadata?.userId || !metadata.tenantId) return;

    // Get all reports the user has access to
    const reports = await this.reportService.getReportsForUser(metadata.userId, metadata.tenantId);
    reports.forEach((report) => {
      this.joinRoom(clientId, `report:${report.id}`);
    });

    // Get all dashboards the user has access to
    const dashboards = await this.dashboardService.getDashboardsForUser(metadata.userId, metadata.tenantId);
    dashboards.forEach((dashboard) => {
      this.joinRoom(clientId, `dashboard:${dashboard.id}`);
    });

    // Get all alerts the user subscribed to
    const alerts = await this.alertService.getAlertsForUser(metadata.userId);
    alerts.forEach((alert) => {
      this.joinRoom(clientId, `alert:${alert.id}`);
    });

    // Get all data sources the user has access to
    const dataSources = await this.dataSourceService.getDataSourcesForUser(metadata.userId, metadata.tenantId);
    dataSources.forEach((source) => {
      this.joinRoom(clientId, `datasource:${source.id}`);
    });

    this.logger.log(`Auto-joined client ${clientId} to ${reports.length + dashboards.length + alerts.length + dataSources.length} entity rooms`);
  }

  /**
   * Cleans up inactive rooms
   */
  private cleanupInactiveRooms(): void {
    const now = new Date();
    const inactiveRooms: string[] = [];

    this.roomMetrics.forEach((metrics, roomName) => {
      // Skip default rooms
      if (['global', 'admin', 'system'].includes(roomName)) return;

      // Calculate inactivity period (1 hour for most rooms, 24 hours for entity rooms)
      const inactivityPeriod = roomName.includes(':') ? 86400000 : 3600000;

      if (now.getTime() - metrics.lastActivity.getTime() > inactivityPeriod) {
        inactiveRooms.push(roomName);
      }
    });

    if (inactiveRooms.length > 0) {
      this.logger.log(`Cleaning up ${inactiveRooms.length} inactive rooms`);
      inactiveRooms.forEach((roomName) => {
        this.roomSubscriptions.delete(roomName);
        this.roomMetrics.delete(roomName);
        this.logger.debug(`Removed inactive room: ${roomName}`);
      });
    }
  }

  /**
   * Gets room statistics
   * @returns Room statistics
   */
  getRoomStatistics(): RoomStatistics {
    const totalRooms = this.roomSubscriptions.size;
    const totalClients = this.clientRooms.size;
    const activeClients = Array.from(this.clientRooms.values()).reduce(
      (count, rooms) => count + rooms.size,
      0,
    );

    // Calculate room size distribution
    const roomSizes = Array.from(this.roomSubscriptions.values()).map(
      (clients) => clients.size,
    );
    const sizeDistribution = this.calculateSizeDistribution(roomSizes);

    return {
      totalRooms,
      totalClients,
      activeClients,
      averageRoomSize: totalRooms > 0 ? activeClients / totalRooms : 0,
      sizeDistribution,
      largestRoom: Math.max(...roomSizes, 0),
      smallestRoom: Math.min(...roomSizes, 0),
    };
  }

  /**
   * Calculates size distribution for rooms
   * @param sizes - Array of room sizes
   * @returns Size distribution object
   */
  private calculateSizeDistribution(sizes: number[]): SizeDistribution {
    const distribution: SizeDistribution = {
      '0-10': 0,
      '11-50': 0,
      '51-100': 0,
      '101-500': 0,
      '501+': 0,
    };

    sizes.forEach((size) => {
      if (size <= 10) {
        distribution['0-10']++;
      } else if (size <= 50) {
        distribution['11-50']++;
      } else if (size <= 100) {
        distribution['51-100']++;
      } else if (size <= 500) {
        distribution['101-500']++;
      } else {
        distribution['501+']++;
      }
    });

    return distribution;
  }

  /**
   * Gets detailed information about a specific room
   * @param roomName - Room name
   * @returns Room information or null if room doesn't exist
   */
  getRoomInfo(roomName: string): RoomInfo | null {
    const clients = this.getClientsInRoom(roomName);
    if (clients.size === 0) return null;

    const metrics = this.getRoomMetrics(roomName);
    if (!metrics) return null;

    // Get client details
    const clientDetails = Array.from(clients).map((clientId) => {
      const metadata = this.websocketGateway.getClientMetadata(clientId);
      return {
        clientId,
        userId: metadata?.userId || null,
        tenantId: metadata?.tenantId || null,
        connectedAt: metadata?.connectedAt || null,
      };
    });

    return {
      roomName,
      clientCount: clients.size,
      createdAt: metrics.createdAt,
      lastActivity: metrics.lastActivity,
      messageCount: metrics.messageCount,
      entityType: metrics.entityType,
      entityId: metrics.entityId,
      clients: clientDetails,
    };
  }

  /**
   * Finds rooms matching a pattern
   * @param pattern - Room name pattern
   * @returns Array of matching room names
   */
  findRooms(pattern: string): string[] {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return this.getAllRooms().filter((room) => regex.test(room));
  }

  /**
   * Moves a client from one room to another
   * @param clientId - Client ID
   * @param fromRoom - Source room name
   * @param toRoom - Destination room name
   */
  moveClient(clientId: string, fromRoom: string, toRoom: string): void {
    this.leaveRoom(clientId, fromRoom);
    this.joinRoom(clientId, toRoom);
  }

  /**
   * Checks if a client is in a room
   * @param clientId - Client ID
   * @param roomName - Room name
   * @returns True if client is in the room
   */
  isClientInRoom(clientId: string, roomName: string): boolean {
    const roomClients = this.roomSubscriptions.get(roomName);
    return roomClients?.has(clientId) || false;
  }

  /**
   * Gets the number of clients in a room
   * @param roomName - Room name
   * @returns Number of clients in the room
   */
  getClientCount(roomName: string): number {
    return this.getClientsInRoom(roomName).size;
  }

  /**
   * Periodically logs room statistics
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  logRoomStatistics() {
    const stats = this.getRoomStatistics();
    this.logger.log(
      `Room Statistics: ${stats.totalRooms} rooms, ${stats.totalClients} clients, ` +
      `avg size: ${stats.averageRoomSize.toFixed(2)}, largest: ${stats.largestRoom}`,
    );
  }
}

interface RoomEvent {
  clientId: string;
  roomName: string;
}

interface RoomMetrics {
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  clientCount: number;
  entityType?: string;
  entityId?: string;
  [key: string]: any;
}

interface EntityRoomOptions {
  [key: string]: any;
}

interface RoomStatistics {
  totalRooms: number;
  totalClients: number;
  activeClients: number;
  averageRoomSize: number;
  sizeDistribution: SizeDistribution;
  largestRoom: number;
  smallestRoom: number;
}

interface SizeDistribution {
  '0-10': number;
  '11-50': number;
  '51-100': number;
  '101-500': number;
  '501+': number;
}

interface RoomInfo {
  roomName: string;
  clientCount: number;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  entityType?: string;
  entityId?: string;
  clients: Array<{
    clientId: string;
    userId: string | null;
    tenantId: string | null;
    connectedAt: Date | null;
  }>;
}

interface WebsocketMessage {
  type: string;
  data: any;
  error?: boolean;
}
```

### Reconnection Logic

```typescript
// reconnection-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket-gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { performance } from 'perf_hooks';

@Injectable()
export class ReconnectionManagerService {
  private readonly logger = new Logger(ReconnectionManagerService.name);
  private readonly reconnectionAttempts = new Map<string, ReconnectionAttempt>();
  private readonly MAX_RECONNECTION