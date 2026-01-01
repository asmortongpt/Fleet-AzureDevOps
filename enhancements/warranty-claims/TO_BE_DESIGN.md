# TO_BE_DESIGN.md - Warranty Claims Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Author:** Enterprise Architecture Team

---

## Executive Vision (100+ lines minimum)

### Strategic Transformation of Warranty Claims Processing

The enhanced warranty-claims module represents a fundamental reimagining of how our organization handles post-sale customer support, transforming it from a cost center into a strategic differentiator that drives customer loyalty, operational efficiency, and revenue protection. This comprehensive redesign aligns with our corporate digital transformation initiative and positions us as industry leaders in customer experience innovation.

#### Business Transformation Goals

1. **Customer Experience Revolution**
   - Reduce average claim resolution time from 7-10 business days to under 24 hours for 90% of cases
   - Implement proactive warranty notifications that reduce customer effort by 75%
   - Achieve Net Promoter Score (NPS) improvement from current 32 to target 65 within 18 months
   - Eliminate paper-based processes completely, moving to 100% digital interactions

2. **Operational Excellence**
   - Reduce operational costs by 40% through automation and AI-driven decision making
   - Decrease fraudulent claims by 80% using machine learning pattern detection
   - Implement real-time SLA monitoring with automated escalation pathways
   - Achieve 99.99% system uptime with multi-region redundancy

3. **Revenue Protection & Growth**
   - Increase warranty attachment rates by 35% through improved customer education
   - Reduce warranty claim leakage by 60% through better tracking and enforcement
   - Create new revenue streams through extended warranty offerings and upsell opportunities
   - Improve parts recovery rates by 50% through enhanced tracking

4. **Data-Driven Decision Making**
   - Implement predictive analytics for warranty cost forecasting with 95% accuracy
   - Create real-time dashboards for executive decision making
   - Develop early warning systems for product quality issues
   - Enable data-driven product improvement cycles

#### Competitive Advantages

1. **First-Mover Advantage in AI-Driven Claims**
   - Implement patent-pending AI claim assessment that reduces manual review by 70%
   - Develop predictive failure models that identify product issues before they occur
   - Create automated claim routing based on complexity and specialist availability

2. **Superior Customer Experience**
   - Industry-first real-time claim tracking with interactive timelines
   - Proactive warranty management with automatic renewal reminders
   - Seamless omnichannel experience across web, mobile, and in-store kiosks
   - Personalized warranty recommendations based on usage patterns

3. **Operational Efficiency Leadership**
   - Achieve 3x faster claim processing than industry average
   - Reduce fraud losses to below 0.5% of claims (industry average is 3-5%)
   - Implement zero-touch processing for 60% of standard claims
   - Create self-healing processes that automatically correct common errors

4. **Technological Innovation**
   - First in industry to implement blockchain for warranty verification
   - Develop AR-based claim submission for complex products
   - Create voice-enabled warranty management for field technicians
   - Implement edge computing for offline claim processing in remote areas

#### Long-Term Roadmap

**Phase 1: Foundation (0-6 months)**
- Complete migration from legacy systems
- Implement core claim processing workflows
- Deploy basic AI assessment capabilities
- Launch mobile app with core functionality
- Establish real-time monitoring and alerting

**Phase 2: Differentiation (6-18 months)**
- Implement advanced predictive analytics
- Deploy AR/VR claim submission tools
- Launch proactive warranty management
- Integrate with IoT product telemetry
- Implement blockchain verification

**Phase 3: Transformation (18-36 months)**
- Achieve fully autonomous claim processing for 80% of cases
- Implement global warranty passport system
- Create AI-powered customer service agents
- Develop self-optimizing warranty pricing models
- Establish industry consortium for warranty data sharing

**Phase 4: Leadership (36+ months)**
- Launch warranty-as-a-service platform
- Implement quantum-resistant encryption
- Develop neural network-based claim assessment
- Create autonomous warranty enforcement agents
- Establish industry standards for warranty processing

#### User Experience Vision

The enhanced warranty claims system will deliver a frictionless, intuitive experience that transforms customer perception of warranty processes:

1. **Zero-Effort Claim Submission**
   - One-tap claim initiation from mobile devices
   - Automatic claim population from product registration data
   - AI-powered claim form that adapts to user responses
   - Voice-enabled claim submission for hands-free operation

2. **Transparent Process Visibility**
   - Real-time claim status tracking with interactive timelines
   - Proactive notifications at each processing stage
   - Estimated resolution time predictions
   - Direct communication channels with claim processors

3. **Proactive Warranty Management**
   - Automatic warranty expiration reminders
   - Usage-based warranty recommendations
   - Predictive maintenance alerts
   - Automated warranty registration for new purchases

4. **Omnichannel Consistency**
   - Seamless experience across web, mobile, and in-store
   - Context preservation across channels
   - Unified customer view for support agents
   - Consistent branding and interaction patterns

5. **Personalized Interactions**
   - Tailored warranty recommendations based on purchase history
   - Adaptive communication preferences
   - Personalized claim resolution options
   - Context-aware help and support

#### Business Impact Projections

| Metric | Current | Target (12 mo) | Target (24 mo) | Target (36 mo) |
|--------|---------|----------------|----------------|----------------|
| Claim Processing Time | 7-10 days | <24 hours | <4 hours | <1 hour |
| Customer Satisfaction | 68% | 85% | 92% | 95% |
| Operational Cost | $12.5M | $8.2M | $6.1M | $4.8M |
| Fraud Detection Rate | 65% | 85% | 95% | 99% |
| Warranty Attachment | 42% | 55% | 65% | 75% |
| First-Contact Resolution | 38% | 70% | 85% | 95% |
| System Uptime | 99.5% | 99.9% | 99.95% | 99.99% |
| Mobile Adoption | 18% | 60% | 80% | 90% |

#### Implementation Strategy

1. **Agile Transformation Approach**
   - Implement SAFe (Scaled Agile Framework) for enterprise-wide coordination
   - Establish cross-functional feature teams with end-to-end responsibility
   - Adopt continuous delivery with daily production deployments
   - Implement feature flags for gradual rollout and A/B testing

2. **Change Management**
   - Comprehensive training program for all user types
   - Dedicated change champions in each business unit
   - Gamified adoption tracking with rewards
   - Continuous feedback loops with customers and employees

3. **Technology Stack Evolution**
   - Migrate from monolithic architecture to microservices
   - Implement Kubernetes-based container orchestration
   - Adopt service mesh for inter-service communication
   - Implement observability platform for real-time monitoring

4. **Vendor Partnerships**
   - Strategic partnerships with AI/ML providers
   - Integration with major e-commerce platforms
   - Collaboration with payment processors
   - Partnerships with logistics providers

5. **Governance Model**
   - Establish warranty center of excellence
   - Implement data governance framework
   - Create cross-functional steering committee
   - Develop comprehensive security and compliance program

This comprehensive vision positions the warranty claims module as a strategic asset that not only improves operational efficiency but fundamentally transforms how we engage with customers throughout the product lifecycle, creating lasting competitive advantages and driving measurable business value.

---

## Performance Enhancements (250+ lines minimum)

### Comprehensive Performance Optimization Strategy

The enhanced warranty claims system implements a multi-layered performance optimization approach that addresses client-side responsiveness, server-side processing efficiency, and database optimization. This section provides complete TypeScript implementations for all critical performance enhancements.

#### 1. Redis Caching Layer (50+ lines)

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
  private readonly CACHE_PREFIX = 'warranty:';

  constructor(private configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 5000),
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis client connected successfully');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`, err.stack);
    });
  }

  /**
   * Generates a consistent cache key based on input parameters
   * @param keyParts Array of values to include in the key
   * @returns Hashed cache key
   */
  private generateCacheKey(keyParts: any[]): string {
    const keyString = keyParts
      .map(part => {
        if (typeof part === 'object') {
          return JSON.stringify(part);
        }
        return String(part);
      })
      .join(':');

    return `${this.CACHE_PREFIX}${crypto.createHash('md5').update(keyString).digest('hex')}`;
  }

  /**
   * Gets cached value with automatic fallback
   * @param keyParts Parts to generate cache key
   * @param fallbackAsync Function to call if cache miss
   * @param ttl Optional TTL in seconds
   * @returns Promise with the cached or computed value
   */
  async getWithFallback<T>(
    keyParts: any[],
    fallbackAsync: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(keyParts);

    try {
      const cachedValue = await this.redisClient.get(cacheKey);
      if (cachedValue) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return JSON.parse(cachedValue) as T;
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      const result = await fallbackAsync();

      if (result !== null && result !== undefined) {
        const ttlToUse = ttl || this.DEFAULT_TTL;
        await this.redisClient.setex(
          cacheKey,
          ttlToUse,
          JSON.stringify(result)
        );
        this.logger.debug(`Cached value for key: ${cacheKey} with TTL ${ttlToUse}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Cache operation failed for key ${cacheKey}: ${error.message}`);
      // Fallback to direct computation if cache fails
      return fallbackAsync();
    }
  }

  /**
   * Gets multiple values from cache with automatic fallback
   * @param keyGroups Array of key parts and fallback pairs
   * @param ttl Optional TTL in seconds
   * @returns Promise with array of results
   */
  async getMultipleWithFallback<T>(
    keyGroups: Array<{ keyParts: any[]; fallback: () => Promise<T> }>,
    ttl?: number
  ): Promise<T[]> {
    const results: T[] = [];
    const pipeline = this.redisClient.pipeline();

    // First pass: get all cache keys
    const cacheKeys = keyGroups.map(group => ({
      key: this.generateCacheKey(group.keyParts),
      fallback: group.fallback,
    }));

    // Check cache for all keys
    cacheKeys.forEach(({ key }) => {
      pipeline.get(key);
    });

    const cachedResults = await pipeline.exec();
    const cacheMissIndices: number[] = [];

    // Process results
    for (let i = 0; i < cachedResults.length; i++) {
      const [err, value] = cachedResults[i];

      if (err) {
        this.logger.error(`Cache get error for key ${cacheKeys[i].key}: ${err.message}`);
        cacheMissIndices.push(i);
        continue;
      }

      if (value) {
        results[i] = JSON.parse(value) as T;
        this.logger.debug(`Cache hit for key: ${cacheKeys[i].key}`);
      } else {
        cacheMissIndices.push(i);
        this.logger.debug(`Cache miss for key: ${cacheKeys[i].key}`);
      }
    }

    // Process cache misses
    if (cacheMissIndices.length > 0) {
      const missResults = await Promise.all(
        cacheMissIndices.map(i => cacheKeys[i].fallback())
      );

      // Cache the results and prepare pipeline for setting values
      const setPipeline = this.redisClient.pipeline();
      const ttlToUse = ttl || this.DEFAULT_TTL;

      for (let i = 0; i < cacheMissIndices.length; i++) {
        const index = cacheMissIndices[i];
        const result = missResults[i];

        if (result !== null && result !== undefined) {
          results[index] = result;
          setPipeline.setex(
            cacheKeys[index].key,
            ttlToUse,
            JSON.stringify(result)
          );
          this.logger.debug(`Cached value for key: ${cacheKeys[index].key}`);
        }
      }

      await setPipeline.exec();
    }

    return results;
  }

  /**
   * Invalidates cache for specific keys
   * @param keyParts Parts to generate cache key
   * @returns Promise with number of keys deleted
   */
  async invalidateCache(keyParts: any[]): Promise<number> {
    const cacheKey = this.generateCacheKey(keyParts);
    try {
      const result = await this.redisClient.del(cacheKey);
      this.logger.debug(`Invalidated cache for key: ${cacheKey}`);
      return result;
    } catch (error) {
      this.logger.error(`Cache invalidation failed for key ${cacheKey}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Invalidates cache with pattern matching
   * @param pattern Cache key pattern to match
   * @returns Promise with number of keys deleted
   */
  async invalidateCacheByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redisClient.keys(`${this.CACHE_PREFIX}${pattern}`);
      if (keys.length === 0) return 0;

      const result = await this.redisClient.del(keys);
      this.logger.debug(`Invalidated ${result} cache keys matching pattern: ${pattern}`);
      return result;
    } catch (error) {
      this.logger.error(`Pattern cache invalidation failed: ${error.message}`);
      return 0;
    }
  }

  /**
   * Gets cache statistics
   * @returns Promise with cache statistics
   */
  async getCacheStats(): Promise<{
    keys: number;
    memoryUsage: string;
    hitRate: number;
  }> {
    try {
      const keys = await this.redisClient.keys(`${this.CACHE_PREFIX}*`);
      const info = await this.redisClient.info('memory');
      const memoryUsage = info.split('\n').find(line => line.startsWith('used_memory:'))?.split(':')[1] || '0';

      // Get hit rate from info command
      const stats = await this.redisClient.info('stats');
      const keyspaceHits = parseInt(stats.split('\n').find(line => line.startsWith('keyspace_hits:'))?.split(':')[1] || '0');
      const keyspaceMisses = parseInt(stats.split('\n').find(line => line.startsWith('keyspace_misses:'))?.split(':')[1] || '1');

      const hitRate = keyspaceMisses > 0
        ? (keyspaceHits / (keyspaceHits + keyspaceMisses)) * 100
        : 100;

      return {
        keys: keys.length,
        memoryUsage,
        hitRate: parseFloat(hitRate.toFixed(2)),
      };
    } catch (error) {
      this.logger.error(`Failed to get cache stats: ${error.message}`);
      return {
        keys: 0,
        memoryUsage: '0',
        hitRate: 0,
      };
    }
  }

  /**
   * Clears all warranty-related cache
   * @returns Promise with number of keys deleted
   */
  async clearWarrantyCache(): Promise<number> {
    try {
      const keys = await this.redisClient.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length === 0) return 0;

      const result = await this.redisClient.del(keys);
      this.logger.log(`Cleared ${result} warranty cache keys`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to clear warranty cache: ${error.message}`);
      return 0;
    }
  }
}
```

#### 2. Database Query Optimization (50+ lines)

```typescript
// src/database/query-optimizer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets, In } from 'typeorm';
import { WarrantyClaim } from '../entities/warranty-claim.entity';
import { ClaimStatus } from '../enums/claim-status.enum';
import { Product } from '../entities/product.entity';
import { Customer } from '../entities/customer.entity';
import { PaginatedResult } from '../interfaces/paginated-result.interface';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);

  constructor(
    @InjectRepository(WarrantyClaim)
    private readonly claimRepository: Repository<WarrantyClaim>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  /**
   * Optimized query for finding warranty claims with complex filtering
   * @param filters Filter criteria
   * @param page Page number
   * @param limit Items per page
   * @param sort Sort criteria
   * @returns Paginated result of warranty claims
   */
  async findClaimsOptimized(
    filters: {
      status?: ClaimStatus[];
      productId?: string;
      customerId?: string;
      dateRange?: { from: Date; to: Date };
      searchTerm?: string;
      minAmount?: number;
      maxAmount?: number;
      isFraudSuspected?: boolean;
    },
    page: number = 1,
    limit: number = 20,
    sort: { field: string; order: 'ASC' | 'DESC' } = { field: 'createdAt', order: 'DESC' }
  ): Promise<PaginatedResult<WarrantyClaim>> {
    const queryBuilder = this.claimRepository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.product', 'product')
      .leftJoinAndSelect('claim.customer', 'customer')
      .leftJoinAndSelect('claim.claimDocuments', 'documents')
      .leftJoinAndSelect('claim.claimNotes', 'notes')
      .leftJoinAndSelect('claim.claimEvents', 'events');

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('claim.status IN (:...statuses)', {
        statuses: filters.status,
      });
    }

    // Apply product filter
    if (filters.productId) {
      queryBuilder.andWhere('claim.productId = :productId', {
        productId: filters.productId,
      });
    }

    // Apply customer filter
    if (filters.customerId) {
      queryBuilder.andWhere('claim.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    // Apply date range filter
    if (filters.dateRange) {
      queryBuilder.andWhere('claim.createdAt BETWEEN :from AND :to', {
        from: filters.dateRange.from,
        to: filters.dateRange.to,
      });
    }

    // Apply amount range filter
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      if (filters.minAmount !== undefined && filters.maxAmount !== undefined) {
        queryBuilder.andWhere('claim.claimAmount BETWEEN :min AND :max', {
          min: filters.minAmount,
          max: filters.maxAmount,
        });
      } else if (filters.minAmount !== undefined) {
        queryBuilder.andWhere('claim.claimAmount >= :min', {
          min: filters.minAmount,
        });
      } else {
        queryBuilder.andWhere('claim.claimAmount <= :max', {
          max: filters.maxAmount,
        });
      }
    }

    // Apply fraud filter
    if (filters.isFraudSuspected !== undefined) {
      queryBuilder.andWhere('claim.isFraudSuspected = :isFraud', {
        isFraud: filters.isFraudSuspected,
      });
    }

    // Apply search term filter (complex search across multiple fields)
    if (filters.searchTerm) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('claim.claimNumber ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('product.name ILIKE :searchTerm')
          .orWhere('product.modelNumber ILIKE :searchTerm')
          .orWhere('product.serialNumber ILIKE :searchTerm')
          .orWhere('customer.firstName ILIKE :searchTerm')
          .orWhere('customer.lastName ILIKE :searchTerm')
          .orWhere('customer.email ILIKE :searchTerm')
          .orWhere('customer.phone ILIKE :searchTerm');
        }),
      );
    }

    // Apply sorting
    if (sort.field === 'claimAmount') {
      queryBuilder.addOrderBy('claim.claimAmount', sort.order);
    } else if (sort.field === 'createdAt') {
      queryBuilder.addOrderBy('claim.createdAt', sort.order);
    } else if (sort.field === 'productName') {
      queryBuilder.addOrderBy('product.name', sort.order);
    } else if (sort.field === 'customerName') {
      queryBuilder.addOrderBy(
        `(customer.firstName || ' ' || customer.lastName)`,
        sort.order,
      );
    } else {
      queryBuilder.addOrderBy('claim.createdAt', 'DESC');
    }

    // Get total count for pagination
    const [claims, total] = await Promise.all([
      queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    return {
      data: claims,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Optimized query for claim statistics with aggregation
   * @param filters Filter criteria
   * @returns Claim statistics
   */
  async getClaimStatistics(
    filters: {
      productIds?: string[];
      dateRange?: { from: Date; to: Date };
      status?: ClaimStatus[];
    } = {},
  ): Promise<{
    totalClaims: number;
    totalAmount: number;
    averageAmount: number;
    byStatus: Record<string, number>;
    byProduct: Record<string, { count: number; amount: number }>;
    byMonth: Record<string, number>;
  }> {
    const queryBuilder = this.claimRepository.createQueryBuilder('claim');

    // Apply product filter
    if (filters.productIds && filters.productIds.length > 0) {
      queryBuilder.andWhere('claim.productId IN (:...productIds)', {
        productIds: filters.productIds,
      });
    }

    // Apply date range filter
    if (filters.dateRange) {
      queryBuilder.andWhere('claim.createdAt BETWEEN :from AND :to', {
        from: filters.dateRange.from,
        to: filters.dateRange.to,
      });
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('claim.status IN (:...statuses)', {
        statuses: filters.status,
      });
    }

    // Get base statistics
    const [totalClaims, totalAmount] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .select('SUM(claim.claimAmount)', 'totalAmount')
        .getRawOne()
        .then(result => parseFloat(result.totalAmount) || 0),
    ]);

    const averageAmount = totalClaims > 0 ? totalAmount / totalClaims : 0;

    // Get statistics by status
    const statusStats = await this.claimRepository
      .createQueryBuilder('claim')
      .select('claim.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(claim.claimAmount)', 'amount')
      .groupBy('claim.status')
      .where(queryBuilder.getQuery())
      .setParameters(queryBuilder.getParameters())
      .getRawMany();

    const byStatus = statusStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    // Get statistics by product
    const productStats = await this.claimRepository
      .createQueryBuilder('claim')
      .leftJoin('claim.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(claim.claimAmount)', 'amount')
      .groupBy('product.id, product.name')
      .where(queryBuilder.getQuery())
      .setParameters(queryBuilder.getParameters())
      .getRawMany();

    const byProduct = productStats.reduce((acc, stat) => {
      acc[stat.productId] = {
        count: parseInt(stat.count),
        amount: parseFloat(stat.amount) || 0,
        name: stat.productName,
      };
      return acc;
    }, {} as Record<string, { count: number; amount: number; name: string }>);

    // Get statistics by month
    const monthStats = await this.claimRepository
      .createQueryBuilder('claim')
      .select("TO_CHAR(claim.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy("TO_CHAR(claim.createdAt, 'YYYY-MM')")
      .orderBy("TO_CHAR(claim.createdAt, 'YYYY-MM')")
      .where(queryBuilder.getQuery())
      .setParameters(queryBuilder.getParameters())
      .getRawMany();

    const byMonth = monthStats.reduce((acc, stat) => {
      acc[stat.month] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalClaims,
      totalAmount,
      averageAmount,
      byStatus,
      byProduct,
      byMonth,
    };
  }

  /**
   * Optimized bulk update of claim statuses
   * @param claimIds Array of claim IDs
   * @param status New status
   * @param updatedBy User who made the update
   * @returns Number of claims updated
   */
  async bulkUpdateClaimStatus(
    claimIds: string[],
    status: ClaimStatus,
    updatedBy: string,
  ): Promise<number> {
    if (claimIds.length === 0) return 0;

    const result = await this.claimRepository
      .createQueryBuilder()
      .update(WarrantyClaim)
      .set({
        status,
        updatedBy,
        updatedAt: new Date(),
        statusUpdatedAt: new Date(),
      })
      .where('id IN (:...claimIds)', { claimIds })
      .execute();

    // Invalidate cache for updated claims
    const cacheService = new RedisCacheService(new ConfigService());
    await Promise.all(
      claimIds.map(id => cacheService.invalidateCache(['claim', id])),
    );

    return result.affected || 0;
  }

  /**
   * Optimized query for getting claim details with all relations
   * @param claimId Claim ID
   * @returns Warranty claim with all relations
   */
  async getClaimDetailsOptimized(claimId: string): Promise<WarrantyClaim | null> {
    return this.claimRepository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.manufacturer', 'manufacturer')
      .leftJoinAndSelect('claim.customer', 'customer')
      .leftJoinAndSelect('customer.addresses', 'addresses')
      .leftJoinAndSelect('claim.claimDocuments', 'documents')
      .leftJoinAndSelect('documents.documentType', 'documentType')
      .leftJoinAndSelect('claim.claimNotes', 'notes')
      .leftJoinAndSelect('notes.createdByUser', 'createdByUser')
      .leftJoinAndSelect('claim.claimEvents', 'events')
      .leftJoinAndSelect('events.createdBy', 'eventCreatedBy')
      .leftJoinAndSelect('claim.approvalWorkflow', 'workflow')
      .leftJoinAndSelect('workflow.steps', 'steps')
      .leftJoinAndSelect('steps.assignedTo', 'assignedTo')
      .leftJoinAndSelect('claim.payments', 'payments')
      .leftJoinAndSelect('payments.paymentMethod', 'paymentMethod')
      .where('claim.id = :claimId', { claimId })
      .getOne();
  }

  /**
   * Optimized query for finding similar claims
   * @param claimId Reference claim ID
   * @param limit Maximum number of similar claims to return
   * @returns Array of similar claims
   */
  async findSimilarClaims(claimId: string, limit: number = 5): Promise<WarrantyClaim[]> {
    // First get the reference claim
    const referenceClaim = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: ['product', 'customer'],
    });

    if (!referenceClaim) return [];

    // Find claims with similar characteristics
    return this.claimRepository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.product', 'product')
      .leftJoinAndSelect('claim.customer', 'customer')
      .where('claim.id != :claimId', { claimId })
      .andWhere(
        new Brackets((qb) => {
          // Same product or same product category
          qb.where('claim.productId = :productId', {
            productId: referenceClaim.product.id,
          }).orWhere('product.categoryId = :categoryId', {
            categoryId: referenceClaim.product.categoryId,
          });

          // Similar claim amount
          qb.orWhere('claim.claimAmount BETWEEN :minAmount AND :maxAmount', {
            minAmount: referenceClaim.claimAmount * 0.8,
            maxAmount: referenceClaim.claimAmount * 1.2,
          });

          // Same customer (for repeat claims)
          qb.orWhere('claim.customerId = :customerId', {
            customerId: referenceClaim.customer.id,
          });
        }),
      )
      .orderBy('claim.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
```

#### 3. API Response Compression (30+ lines)

```typescript
// src/middleware/response-compression.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as compression from 'compression';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly compressionMiddleware: (req: Request, res: Response, next: NextFunction) => void;

  constructor(private configService: ConfigService) {
    // Configure compression with optimal settings
    this.compressionMiddleware = compression({
      level: this.configService.get('COMPRESSION_LEVEL', 6), // 6 is a good balance between speed and compression
      threshold: this.configService.get('COMPRESSION_THRESHOLD', 1024), // 1KB threshold
      filter: (req: Request, res: Response) => {
        // Don't compress if already compressed
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Don't compress binary data
        if (res.getHeader('Content-Type')?.toString().includes('application/octet-stream')) {
          return false;
        }

        // Always compress JSON responses
        if (res.getHeader('Content-Type')?.toString().includes('application/json')) {
          return true;
        }

        // Compress based on accept-encoding header
        return compression.filter(req, res);
      },
      strategy: this.configService.get('COMPRESSION_STRATEGY', 'DEFAULT_STRATEGY'), // Use ZLIB's default strategy
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Set compression-related headers
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Apply compression middleware
    this.compressionMiddleware(req, res, next);
  }
}

// src/main.ts - Compression configuration
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseCompressionMiddleware } from './middleware/response-compression.middleware';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply compression middleware globally
  app.use(new ResponseCompressionMiddleware(app.get(ConfigService)).use);

  // Configure body parsers with size limits
  app.use(json({
    limit: '10mb',
    verify: (req: Request, res, buf) => {
      // Store raw body for signature verification
      (req as any).rawBody = buf;
    }
  }));

  app.use(urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 10000
  }));

  // Enable CORS with specific configuration
  app.enableCors({
    origin: app.get(ConfigService).get('ALLOWED_ORIGINS', '*').split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With,Accept,Origin',
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Set security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com; frame-src 'self' https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';");
    next();
  });

  await app.listen(app.get(ConfigService).get('PORT', 3000));
}
```

#### 4. Lazy Loading Implementation (40+ lines)

```typescript
// src/utils/lazy-loader.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { LAZY_LOAD_METADATA } from './lazy-load.constants';

/**
 * Decorator to mark a route or method for lazy loading
 * @param options Lazy loading options
 */
export function LazyLoad(options: {
  /**
   * The property to lazy load
   */
  property: string;

  /**
   * The method to call to load the data
   */
  loadMethod: string;

  /**
   * Optional condition for lazy loading
   */
  condition?: (req: any) => boolean;

  /**
   * Optional TTL for cached lazy loaded data
   */
  ttl?: number;
} = { property: '', loadMethod: '' }) {
  return applyDecorators(
    SetMetadata(LAZY_LOAD_METADATA, options),
  );
}

// src/interceptors/lazy-load.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LAZY_LOAD_METADATA } from '../utils/lazy-load.constants';
import { RedisCacheService } from '../cache/redis-cache.service';

@Injectable()
export class LazyLoadInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LazyLoadInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: RedisCacheService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const lazyLoadOptions = this.reflector.get<{
      property: string;
      loadMethod: string;
      condition?: (req: any) => boolean;
      ttl?: number;
    }>(LAZY_LOAD_METADATA, context.getHandler());

    if (!lazyLoadOptions) {
      return next.handle();
    }

    const { property, loadMethod, condition, ttl } = lazyLoadOptions;
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Check if lazy loading should be applied
    if (condition && !condition(request)) {
      return next.handle();
    }

    // Store original method
    const originalMethod = response.json;

    // Override response.json to intercept the response
    response.json = (data: any) => {
      if (data && data[property] === undefined) {
        // If the property is not in the response, we'll lazy load it
        return originalMethod.call(response, data);
      }

      // Create a proxy for the property that will lazy load when accessed
      if (data && data[property] !== undefined) {
        Object.defineProperty(data, property, {
          get: () => {
            // This will be called when the property is accessed
            if (data[`__${property}_loaded`]) {
              return data[`__${property}_value`];
            }

            // Mark as loading to prevent multiple calls
            data[`__${property}_loading`] = true;

            // Get the service from the controller
            const controller = context.getClass();
            const service = context.getArgs()[0].container.get(controller);

            if (!service || !service[loadMethod]) {
              this.logger.error(`Lazy load method ${loadMethod} not found on service`);
              data[`__${property}_loaded`] = true;
              data[`__${property}_value`] = null;
              return null;
            }

            // Generate cache key
            const cacheKey = ['lazy-load', request.route.path, request.params.id, property];

            // Try to get from cache first
            if (ttl) {
              return this.cacheService.getWithFallback(
                cacheKey,
                async () => {
                  try {
                    const result = await service[loadMethod](request.params.id);
                    data[`__${property}_loaded`] = true;
                    data[`__${property}_value`] = result;
                    return result;
                  } catch (error) {
                    this.logger.error(`Failed to lazy load ${property}: ${error.message}`);
                    data[`__${property}_loaded`] = true;
                    data[`__${property}_value`] = null;
                    return null;
                  }
                },
                ttl,
              );
            }

            // If no TTL, load directly
            return service[loadMethod](request.params.id)
              .then(result => {
                data[`__${property}_loaded`] = true;
                data[`__${property}_value`] = result;
                return result;
              })
              .catch(error => {
                this.logger.error(`Failed to lazy load ${property}: ${error.message}`);
                data[`__${property}_loaded`] = true;
                data[`__${property}_value`] = null;
                return null;
              });
          },
          configurable: true,
          enumerable: true,
        });

        // Add metadata about lazy loading
        data[`__lazy_loaded`] = data[`__lazy_loaded`] || [];
        data[`__lazy_loaded`].push(property);
      }

      return originalMethod.call(response, data);
    };

    return next.handle().pipe(
      tap(() => {
        // Restore original method after response is sent
        response.json = originalMethod;
      }),
    );
  }
}

// src/claims/claims.controller.ts - Example usage
import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { LazyLoad } from '../utils/lazy-loader.decorator';
import { LazyLoadInterceptor } from '../interceptors/lazy-load.interceptor';

@Controller('claims')
@UseInterceptors(LazyLoadInterceptor)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get(':id')
  @LazyLoad({
    property: 'detailedDocuments',
    loadMethod: 'getDetailedDocuments',
    ttl: 300, // 5 minutes cache
  })
  async getClaim(@Param('id') id: string) {
    return this.claimsService.getClaimById(id);
  }

  @Get(':id/full-details')
  @LazyLoad({
    property: 'approvalWorkflow',
    loadMethod: 'getApprovalWorkflow',
    condition: (req) => req.query.includeWorkflow === 'true',
  })
  @LazyLoad({
    property: 'paymentHistory',
    loadMethod: 'getPaymentHistory',
  })
  async getFullClaimDetails(@Param('id') id: string) {
    return this.claimsService.getClaimById(id);
  }
}

// src/claims/claims.service.ts - Example service methods
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarrantyClaim } from '../entities/warranty-claim.entity';
import { ClaimDocument } from '../entities/claim-document.entity';
import { ApprovalWorkflow } from '../entities/approval-workflow.entity';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectRepository(WarrantyClaim)
    private readonly claimRepository: Repository<WarrantyClaim>,
    @InjectRepository(ClaimDocument)
    private readonly documentRepository: Repository<ClaimDocument>,
    @InjectRepository(ApprovalWorkflow)
    private readonly workflowRepository: Repository<ApprovalWorkflow>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async getClaimById(id: string): Promise<WarrantyClaim> {
    return this.claimRepository.findOne({
      where: { id },
      relations: ['product', 'customer', 'claimDocuments'],
    });
  }

  async getDetailedDocuments(claimId: string): Promise<ClaimDocument[]> {
    return this.documentRepository.find({
      where: { claim: { id: claimId } },
      relations: ['documentType', 'uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getApprovalWorkflow(claimId: string): Promise<ApprovalWorkflow> {
    return this.workflowRepository.findOne({
      where: { claim: { id: claimId } },
      relations: ['steps', 'steps.assignedTo'],
      order: { steps: { sequence: 'ASC' } },
    });
  }

  async getPaymentHistory(claimId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { claim: { id: claimId } },
      relations: ['paymentMethod'],
      order: { createdAt: 'DESC' },
    });
  }
}
```

#### 5. Request Debouncing (30+ lines)

```typescript
// src/utils/request-debouncer.ts
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class RequestDebouncer {
  private readonly logger = new Logger(RequestDebouncer.name);
  private readonly redisClient: Redis;
  private readonly DEFAULT_DEBOUNCE_TIME = 1000; // 1 second default

  constructor(private configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
      connectTimeout: 5000,
      maxRetriesPerRequest: 2,
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis debouncer error: ${err.message}`, err.stack);
    });
  }

  /**
   * Generates a consistent debounce key based on input parameters
   * @param keyParts Array of values to include in the key
   * @returns Hashed debounce key
   */
  private generateDebounceKey(keyParts: any[]): string {
    const keyString = keyParts
      .map(part => {
        if (typeof part === 'object') {
          return JSON.stringify(part);
        }
        return String(part);
      })
      .join(':');

    return `debounce:${crypto.createHash('md5').update(keyString).digest('hex')}`;
  }

  /**
   * Checks if a request should be debounced
   * @param keyParts Parts to generate debounce key
   * @param debounceTime Optional debounce time in milliseconds
   * @returns Promise with debounce result
   */
  async shouldDebounce(
    keyParts: any[],
    debounceTime?: number,
  ): Promise<{ shouldDebounce: boolean; remainingTime?: number }> {
    const debounceKey = this.generateDebounceKey(keyParts);
    const timeToUse = debounceTime || this.DEFAULT_DEBOUNCE_TIME;

    try {
      // Use Redis SET command with NX and PX options
      const result = await this.redisClient.set(
        debounceKey,
        Date.now().toString(),
        'PX',
        timeToUse,
        'NX',
      );

      if (result === 'OK') {
        // Successfully set the key - this is the first request
        return { shouldDebounce: false };
      } else {
        // Key already exists - check remaining time
        const remainingTime = await this.redisClient.pttl(debounceKey);
        return {
          shouldDebounce: true,
          remainingTime: Math.max(0, remainingTime),
        };
      }
    } catch (error) {
      this.logger.error(`Debounce check failed: ${error.message}`);
      // If Redis fails, don't debounce to avoid blocking requests
      return { shouldDebounce: false };
    }
  }

  /**
   * Gets the last request time for a debounce key
   * @param keyParts Parts to generate debounce key
   * @returns Promise with last request time or null
   */
  async getLastRequestTime(keyParts: any[]): Promise<number | null> {
    const debounceKey = this.generateDebounceKey(keyParts);

    try {
      const timestamp = await this.redisClient.get(debounceKey);
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      this.logger.error(`Failed to get last request time: ${error.message}`);
      return null;
    }
  }

  /**
   * Clears a debounce key
   * @param keyParts Parts to generate debounce key
   * @returns Promise with number of keys deleted
   */
  async clearDebounce(keyParts: any[]): Promise<number> {
    const debounceKey = this.generateDebounceKey(keyParts);

    try {
      const result = await this.redisClient.del(debounceKey);
      return result;
    } catch (error) {
      this.logger.error(`Failed to clear debounce key: ${error.message}`);
      return 0;
    }
  }

  /**
   * Debounces a function call
   * @param keyParts Parts to generate debounce key
   * @param fn Function to debounce
   * @param debounceTime Optional debounce time in milliseconds
   * @returns Promise with the function result or undefined if debounced
   */
  async debounceFunction<T>(
    keyParts: any[],
    fn: () => Promise<T>,
    debounceTime?: number,
  ): Promise<T | undefined> {
    const debounceResult = await this.shouldDebounce(keyParts, debounceTime);

    if (debounceResult.shouldDebounce) {
      this.logger.debug(`Request debounced for key: ${this.generateDebounceKey(keyParts)}`);
      return undefined;
    }

    try {
      return await fn();
    } catch (error) {
      this.logger.error(`Debounced function failed: ${error.message}`);
      throw error;
    }
  }
}

// src/middleware/debounce.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestDebouncer } from '../utils/request-debouncer';

@Injectable()
export class DebounceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DebounceMiddleware.name);

  constructor(private readonly debouncer: RequestDebouncer) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip debouncing for GET requests and certain paths
    if (req.method === 'GET' || req.path.startsWith('/health')) {
      return next();
    }

    // Generate debounce key based on request characteristics
    const debounceKey = [
      req.method,
      req.path,
      req.ip,
      req.headers['user-agent'],
      req.headers['authorization'] || '',
      JSON.stringify(req.body),
    ];

    const debounceTime = this.getDebounceTime(req);

    const debounceResult = await this.debouncer.shouldDebounce(debounceKey, debounceTime);

    if (debounceResult.shouldDebounce) {
      this.logger.warn(`Debounced duplicate request from ${req.ip} to ${req.path}`);
      return res.status(429).json({
        statusCode: 429,
        message: 'Too many requests. Please wait before trying again.',
        remainingTime: debounceResult.remainingTime,
      });
    }

    next();
  }

  /**
   * Gets debounce time based on request characteristics
   * @param req Request object
   * @returns Debounce time in milliseconds
   */
  private getDebounceTime(req: Request): number {
    // Longer debounce time for resource-intensive operations
    if (req.path.includes('/claims') && req.method === 'POST') {
      return 5000; // 5 seconds for claim submissions
    }

    if (req.path.includes('/documents') && req.method === 'POST') {
      return 3000; // 3 seconds for document uploads
    }

    if (req.path.includes('/payments') && req.method === 'POST') {
      return 2000; // 2 seconds for payment processing
    }

    // Default debounce time
    return 1000;
  }
}

// src/main.ts - Debounce middleware configuration
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DebounceMiddleware } from './middleware/debounce.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply debounce middleware globally
  app.use(new DebounceMiddleware(app.get(RequestDebouncer)).use);

  await app.listen(3000);
}
```

#### 6. Connection Pooling (30+ lines)

```typescript
// src/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

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
        ssl: configService.get('DB_SSL') === 'true' ? {
          rejectUnauthorized: false,
          ca: configService.get('DB_SSL_CA'),
        } : false,
        namingStrategy: new SnakeNamingStrategy(),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
        subscribers: [__dirname + '/../**/*.subscriber{.ts,.js}'],
        synchronize: false, // Never use synchronize in production
        logging: configService.get('DB_LOGGING') === 'true',
        maxQueryExecutionTime: 1000, // Log queries slower than 1 second
        extra: {
          // Connection pool settings
          max: configService.get('DB_POOL_MAX', 20), // Maximum number of connections in the pool
          min: configService.get('DB_POOL_MIN', 2), // Minimum number of connections in the pool
          idleTimeoutMillis: configService.get('DB_POOL_IDLE_TIMEOUT', 30000), // Close idle connections after 30 seconds
          connectionTimeoutMillis: configService.get('DB_POOL_CONNECTION_TIMEOUT', 5000), // Fail after 5 seconds if connection not established
          maxUses: configService.get('DB_POOL_MAX_USES', 1000), // Close connection after 1000 uses
          application_name: 'warranty-claims-service',
        },
        poolErrorHandler: (err) => {
          console.error('Database pool error:', err);
          // Here you could implement reconnection logic or alerting
        },
      }),
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }

        const dataSource = new DataSource(options);
        await dataSource.initialize();

        // Add transactional data source for typeorm-transactional
        return addTransactionalDataSource(dataSource);
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

// src/database/database-health.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

@Injectable()
export class DatabaseHealthService extends HealthIndicator {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if we can get a connection from the pool
      const connection = await this.dataSource.createQueryRunner();
      await connection.connect();

      // Check pool statistics
      const pool = (this.dataSource.driver as any).master;
      const poolStats = {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
      };

      await connection.release();

      // Check database time to detect clock skew
      const dbTime = await this.dataSource.query('SELECT NOW() as now');
      const currentTime = new Date();
      const timeDiff = Math.abs(currentTime.getTime() - new Date(dbTime[0].now).getTime());

      if (timeDiff > 5000) { // More than 5 seconds difference
        throw new Error(`Database clock skew detected: ${timeDiff}ms`);
      }

      return this.getStatus(key, true, {
        pool: poolStats,
        timeDiff: `${timeDiff}ms`,
      });
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      throw new HealthCheckError(
        'Database health check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }

  /**
   * Gets connection pool statistics
   * @returns Connection pool statistics
   */
  async getPoolStats(): Promise<{
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
    maxConnections: number;
  }> {
    try {
      const pool = (this.dataSource.driver as any).master;
      return {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
        maxConnections: pool.max,
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats: ${error.message}`);
      return {
        totalConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        maxConnections: 0,
      };
    }
  }

  /**
   * Gets slow queries from the database
   * @param threshold Minimum execution time in milliseconds
   * @param limit Maximum number of queries to return
   * @returns Array of slow queries
   */
  async getSlowQueries(threshold: number = 1000, limit: number = 10): Promise<Array<{
    query: string;
    executionTime: number;
    calledAt: Date;
  }>> {
    try {
      // This is PostgreSQL specific - adjust for other databases
      const slowQueries = await this.dataSource.query(`
        SELECT query, total_time / calls as avg_time, calls, now() - interval '5 minutes' as since
        FROM pg_stat_statements
        WHERE total_time / calls > $1
        ORDER BY avg_time DESC
        LIMIT $2
      `, [threshold, limit]);

      return slowQueries.map(q => ({
        query: q.query,
        executionTime: parseFloat(q.avg_time),
        calledAt: new Date(q.since),
      }));
    } catch (error) {
      this.logger.error(`Failed to get slow queries: ${error.message}`);
      return [];
    }
  }

  /**
   * Gets database size information
   * @returns Database size information
   */
  async getDatabaseSize(): Promise<{
    databaseSize: string;
    tableSizes: Array<{ tableName: string; size: string; rowCount: number }>;
  }> {
    try {
      // Get total database size
      const dbSize = await this.dataSource.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);

      // Get table sizes
      const tableSizes = await this.dataSource.query(`
        SELECT
          table_name,
          pg_size_pretty(pg_total_relation_size(table_name)) as size,
          (SELECT reltuples FROM pg_class WHERE relname = table_name) as row_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY pg_total_relation_size(table_name) DESC
      `);

      return {
        databaseSize: dbSize[0].size,
        tableSizes: tableSizes.map(t => ({
          tableName: t.table_name,
          size: t.size,
          rowCount: parseInt(t.row_count),
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get database size: ${error.message}`);
      return {
        databaseSize: '0 bytes',
        tableSizes: [],
      };
    }
  }
}

// src/database/database-monitor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseHealthService } from './database-health.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseMonitorService {
  private readonly logger = new Logger(DatabaseMonitorService.name);
  private readonly alertThresholds = {
    connectionUsage: 0.8, // 80% of max connections
    idleConnections: 0.2, // Less than 20% idle connections
    slowQueries: 5, // More than 5 slow queries in last 5 minutes
  };

  constructor(
    private readonly dbHealthService: DatabaseHealthService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorDatabase() {
    try {
      const poolStats = await this.dbHealthService.getPoolStats();
      const slowQueries = await this.dbHealthService.getSlowQueries();
      const dbSize = await this.dbHealthService.getDatabaseSize();

      // Check connection usage
      const maxConnections = poolStats.maxConnections;
      const connectionUsage = poolStats.totalConnections / maxConnections;

      if (connectionUsage > this.alertThresholds.connectionUsage) {
        this.logger.warn(
          `High database connection usage: ${(connectionUsage * 100).toFixed(2)}% ` +
          `(${poolStats.totalConnections}/${maxConnections})`,
        );
        // Here you could send an alert or trigger auto-scaling
      }

      // Check idle connections
      const idleRatio = poolStats.idleConnections / poolStats.totalConnections;
      if (idleRatio < this.alertThresholds.idleConnections) {
        this.logger.warn(
          `Low idle connections: ${(idleRatio * 100).toFixed(2)}% ` +
          `(${poolStats.idleConnections}/${poolStats.totalConnections})`,
        );
      }

      // Check for slow queries
      if (slowQueries.length > this.alertThresholds.slowQueries) {
        this.logger.warn(
          `Found ${slowQueries.length} slow queries in the last 5 minutes. ` +
          `Slowest query: ${slowQueries[0].executionTime.toFixed(2)}ms`,
        );
        // Log the slowest queries
        slowQueries.slice(0, 3).forEach(query => {
          this.logger.debug(`Slow query: ${query.query} (${query.executionTime.toFixed(2)}ms)`);
        });
      }

      // Log database size growth
      this.logger.log(`Database size: ${dbSize.databaseSize}`);
      if (dbSize.tableSizes.length > 0) {
        this.logger.debug(`Largest tables: ${dbSize.tableSizes.slice(0, 3).map(t =>
          `${t.tableName} (${t.size}, ${t.rowCount} rows)`
        ).join(', ')}`);
      }

    } catch (error) {
      this.logger.error(`Database monitoring failed: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async optimizeDatabase() {
    try {
      this.logger.log('Starting database optimization tasks');

      // Vacuum analyze to update statistics
      await this.dbHealthService.dataSource.query('VACUUM ANALYZE');
      this.logger.log('Completed VACUUM ANALYZE');

      // Reindex large tables
      const largeTables = await this.dbHealthService.dataSource.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND pg_total_relation_size(table_name) > 100000000  -- 100MB
        ORDER BY pg_total_relation_size(table_name) DESC
      `);

      for (const table of largeTables) {
        this.logger.log(`Reindexing table: ${table.table_name}`);
        await this.dbHealthService.dataSource.query(`REINDEX TABLE ${table.table_name}`);
      }

      this.logger.log('Completed database optimization tasks');
    } catch (error) {
      this.logger.error(`Database optimization failed: ${error.message}`);
    }
  }
}
```

---

## Real-Time Features (300+ lines minimum)

### Comprehensive WebSocket Implementation

The warranty claims system implements a robust real-time communication layer using WebSockets to provide immediate updates to users, enable collaborative claim processing, and support live dashboards.

#### 1. WebSocket Server Setup (60+ lines)

```typescript
// src/websocket/websocket.module.ts
import { Module, Global } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { AuthModule } from '../auth/auth.module';
import { ClaimsModule } from '../claims/claims.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [AuthModule, ClaimsModule, NotificationsModule, ConfigModule],
  providers: [WebSocketGateway, WebSocketService],
  exports: [WebSocketGateway, WebSocketService],
})
export class WebSocketModule {}

// src/websocket/websocket.gateway.ts
import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Instrument } from 'nestjs-otel';

@WebSocketGateway({
  cors: {
    origin: '*', // Will be restricted in production
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  path: '/ws-warranty',
  pingInterval: 25000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e6, // 1MB
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly connectedClients = new Map<string, Socket>();
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.webSocketService.setServer(server);

    // Set up server-side event listeners
    server.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          throw new Error('Authentication token missing');
        }

        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET'),
        });

        if (!payload) {
          throw new Error('Invalid authentication token');
        }

        // Attach user to socket
        socket.data.user = payload;
        next();
      } catch (error) {
        this.logger.error(`WebSocket authentication failed: ${error.message}`);
        next(new Error('Authentication failed'));
      }
    });

    // Set up periodic health checks
    setInterval(() => {
      this.checkConnectedClients();
    }, 60000); // Every minute
  }

  handleConnection(client: Socket) {
    const userId = client.data.user?.sub;
    const clientId = client.id;

    this.logger.log(`Client connected: ${clientId} (User: ${userId || 'anonymous'})`);

    // Store client connection
    this.connectedClients.set(clientId, client);

    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(clientId);
    }

    // Send welcome message
    client.emit('connected', {
      message: 'Successfully connected to warranty claims WebSocket',
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
    });

    // Notify other clients about new connection
    this.webSocketService.broadcastUserStatus(userId, 'online');
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub;
    const clientId = client.id;

    this.logger.log(`Client disconnected: ${clientId} (User: ${userId || 'anonymous'})`);

    // Remove client from maps
    this.connectedClients.delete(clientId);

    if (userId) {
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.delete(clientId);
        if (userSockets.size === 0) {
          this.userSockets.delete(userId);
          // Notify other clients about user going offline
          this.webSocketService.broadcastUserStatus(userId, 'offline');
        }
      }
    }
  }

  @SubscribeMessage('ping')
  @Instrument()
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      timestamp: Date.now(),
      serverTime: Date.now(),
    });
  }

  @SubscribeMessage('subscribe')
  @Instrument()
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string; [key: string]: any },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) {
      client.emit('error', {
        message: 'Authentication required for subscription',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    this.logger.debug(`User ${userId} subscribing to channel: ${data.channel}`);
    this.webSocketService.subscribeClient(client.id, userId, data.channel, data);
  }

  @SubscribeMessage('unsubscribe')
  @Instrument()
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    this.logger.debug(`User ${userId} unsubscribing from channel: ${data.channel}`);
    this.webSocketService.unsubscribeClient(client.id, userId, data.channel);
  }

  @SubscribeMessage('message')
  @Instrument()
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string; message: any },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) {
      client.emit('error', {
        message: 'Authentication required for messaging',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    this.logger.debug(`Message from ${userId} to channel ${data.channel}: ${JSON.stringify(data.message)}`);
    this.webSocketService.broadcastToChannel(data.channel, {
      from: userId,
      timestamp: new Date().toISOString(),
      ...data.message,
    });
  }

  private checkConnectedClients() {
    const now = Date.now();
    let disconnectedCount = 0;

    this.connectedClients.forEach((client, clientId) => {
      if (client.disconnected) {
        this.connectedClients.delete(clientId);
        disconnectedCount++;
      } else {
        // Check if client is responsive
        client.emit('ping', { timestamp: now });
      }
    });

    if (disconnectedCount > 0) {
      this.logger.log(`Cleaned up ${disconnectedCount} disconnected clients`);
    }
  }

  /**
   * Gets the number of connected clients
   * @returns Number of connected clients
   */
  getConnectedClientCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Gets the number of connected users
   * @returns Number of connected users
   */
  getConnectedUserCount(): number {
    return this.userSockets.size;
  }

  /**
   * Gets all connected users
   * @returns Set of connected user IDs
   */
  getConnectedUsers(): Set<string> {
    return new Set(this.userSockets.keys());
  }
}

// src/websocket/websocket.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ClaimsService } from '../claims/claims.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { Instrument } from 'nestjs-otel';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server;
  private readonly channelSubscriptions = new Map<string, Set<string>>(); // channel -> set of client IDs
  private readonly clientSubscriptions = new Map<string, Set<string>>(); // client ID -> set of channels
  private readonly userChannels = new Map<string, Set<string>>(); // user ID -> set of channels
  private readonly redisSubscriber: Redis;
  private readonly redisPublisher: Redis;

  constructor(
    private readonly claimsService: ClaimsService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    // Initialize Redis for pub/sub
    this.redisSubscriber = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
    });

    this.redisPublisher = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
    });

    // Set up Redis event listeners
    this.redisSubscriber.on('message', (channel, message) => {
      this.handleRedisMessage(channel, message);
    });

    this.redisSubscriber.on('error', (err) => {
      this.logger.error(`Redis subscriber error: ${err.message}`);
    });
  }

  setServer(server: Server) {
    this.server = server;
  }

  @Instrument()
  subscribeClient(clientId: string, userId: string, channel: string, options?: any) {
    // Add to channel subscriptions
    if (!this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.set(channel, new Set());
    }
    this.channelSubscriptions.get(channel)?.add(clientId);

    // Add to client subscriptions
    if (!this.clientSubscriptions.has(clientId)) {
      this.clientSubscriptions.set(clientId, new Set());
    }
    this.clientSubscriptions.get(clientId)?.add(channel);

    // Add to user channels
    if (!this.userChannels.has(userId)) {
      this.userChannels.set(userId, new Set());
    }
    this.userChannels.get(userId)?.add(channel);

    // Subscribe to Redis channel if this is the first subscriber
    if (this.channelSubscriptions.get(channel)?.size === 1) {
      this.redisSubscriber.subscribe(channel);
      this.logger.debug(`Subscribed to Redis channel: ${channel}`);
    }

    this.logger.debug(`Client ${clientId} (User: ${userId}) subscribed to channel: ${channel}`);
  }

  @Instrument()
  unsubscribeClient(clientId: string, userId: string, channel: string) {
    // Remove from channel subscriptions
    if (this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.get(channel)?.delete(clientId);
      if (this.channelSubscriptions.get(channel)?.size === 0) {
        this.channelSubscriptions.delete(channel);
        this.redisSubscriber.unsubscribe(channel);
        this.logger.debug(`Unsubscribed from Redis channel: ${channel}`);
      }
    }

    // Remove from client subscriptions
    if (this.clientSubscriptions.has(clientId)) {
      this.clientSubscriptions.get(clientId)?.delete(channel);
      if (this.clientSubscriptions.get(clientId)?.size === 0) {
        this.clientSubscriptions.delete(clientId);
      }
    }

    // Remove from user channels
    if (this.userChannels.has(userId)) {
      this.userChannels.get(userId)?.delete(channel);
      if (this.userChannels.get(userId)?.size === 0) {
        this.userChannels.delete(userId);
      }
    }

    this.logger.debug(`Client ${clientId} (User: ${userId}) unsubscribed from channel: ${channel}`);
  }

  @Instrument()
  broadcastToChannel(channel: string, message: any, excludeClient?: string) {
    if (!this.channelSubscriptions.has(channel)) {
      return;
    }

    const clientIds = this.channelSubscriptions.get(channel);
    if (!clientIds || clientIds.size === 0) {
      return;
    }

    // Broadcast to all clients in the channel
    clientIds.forEach(clientId => {
      if (clientId !== excludeClient) {
        const client = this.server.sockets.sockets.get(clientId);
        if (client) {
          client.emit(channel, message);
        }
      }
    });

    // Also publish to Redis for other instances
    this.redisPublisher.publish(channel, JSON.stringify(message));
  }

  @Instrument()
  broadcastToUser(userId: string, event: string, message: any) {
    if (!this.userChannels.has(userId)) {
      return;
    }

    const channels = this.userChannels.get(userId);
    if (!channels) {
      return;
    }

    // Find all client IDs for this user
    const clientIds = new Set<string>();
    channels.forEach(channel => {
      const channelClients = this.channelSubscriptions.get(channel);
      if (channelClients) {
        channelClients.forEach(clientId => {
          clientIds.add(clientId);
        });
      }
    });

    // Send to all user's clients
    clientIds.forEach(clientId => {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        client.emit(event, message);
      }
    });
  }

  @Instrument()
  broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    this.broadcastToChannel('user-status', {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  @Instrument()
  async sendClaimUpdate(claimId: string, update: any) {
    const claim = await this.claimsService.getClaimById(claimId);
    if (!claim) {
      this.logger.warn(`Claim ${claimId} not found for WebSocket update`);
      return;
    }

    // Send to claim-specific channel
    this.broadcastToChannel(`claim:${claimId}`, {
      event: 'claim-updated',
      claimId,
      update,
      timestamp: new Date().toISOString(),
    });

    // Send to customer channel if this is a customer-facing update
    if (update.isCustomerVisible) {
      this.broadcastToUser(claim.customerId, 'claim-update', {
        claimId,
        update,
        timestamp: new Date().toISOString(),
      });
    }

    // Send to product channel for product managers
    this.broadcastToChannel(`product:${claim.productId}`, {
      event: 'claim-updated',
      claimId,
      productId: claim.productId,
      update,
      timestamp: new Date().toISOString(),
    });
  }

  @Instrument()
  async sendNotification(userId: string, notification: any) {
    // Send via WebSocket
    this.broadcastToUser(userId, 'notification', notification);

    // Also send via Redis for other instances
    this.redisPublisher.publish(`notifications:${userId}`, JSON.stringify(notification));
  }

  private handleRedisMessage(channel: string, message: string) {
    try {
      const parsedMessage = JSON.parse(message);

      // Broadcast to local clients
      if (this.channelSubscriptions.has(channel)) {
        this.channelSubscriptions.get(channel)?.forEach(clientId => {
          const client = this.server.sockets.sockets.get(clientId);
          if (client) {
            client.emit(channel, parsedMessage);
          }
        });
      }
    } catch (error) {
      this.logger.error(`Failed to handle Redis message on channel ${channel}: ${error.message}`);
    }
  }

  /**
   * Gets statistics about WebSocket connections
   * @returns WebSocket statistics
   */
  getStatistics(): {
    totalClients: number;
    totalUsers: number;
    channels: number;
    channelStats: Array<{ channel: string; clients: number }>;
  } {
    const channelStats = Array.from(this.channelSubscriptions.entries()).map(
      ([channel, clients]) => ({
        channel,
        clients: clients.size,
      }),
    );

    return {
      totalClients: this.clientSubscriptions.size,
      totalUsers: this.userChannels.size,
      channels: this.channelSubscriptions.size,
      channelStats,
    };
  }

  /**
   * Cleans up disconnected clients
   */
  cleanupDisconnectedClients() {
    // This would be called periodically by a scheduler
    this.logger.log('Running WebSocket cleanup');
    // Implementation would iterate through clientSubscriptions and remove disconnected clients
  }
}
```

#### 2. Real-Time Event Handlers (80+ lines)

```typescript
// src/events/claim-events.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketService } from '../websocket/websocket.service';
import { ClaimsService } from '../claims/claims.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ClaimStatus } from '../enums/claim-status.enum';
import { ClaimEventType } from '../enums/claim-event-type.enum';
import { Instrument } from 'nestjs-otel';

@Injectable()
export class ClaimEventsHandler {
  private readonly logger = new Logger(ClaimEventsHandler.name);

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly claimsService: ClaimsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent('claim.created')
  @Instrument()
  async handleClaimCreated(payload: {
    claimId: string;
    createdBy: string;
    customerId: string;
    productId: string;
  }) {
    try {
      this.logger.log(`Handling claim.created event for claim ${payload.claimId}`);

      // Send real-time update to all interested parties
      await this.webSocketService.sendClaimUpdate(payload.claimId, {
        eventType: ClaimEventType.CREATED,
        status: ClaimStatus.SUBMITTED,
        updatedBy: payload.createdBy,
        isCustomerVisible: true,
        message: 'Your warranty claim has been submitted successfully',
      });

      // Notify the customer
      await this.notificationsService.createNotification({
        userId: payload.customerId,
        type: 'claim_submitted',
        title: 'Claim Submitted',
        message: 'Your warranty claim has been successfully submitted and is being processed.',
        data: {
          claimId: payload.claimId,
          productId: payload.productId,
        },
        isRead: false,
      });

      // Notify the claims team
      await this.notificationsService.createNotification({
        userId: 'claims-team', // Special user ID for team notifications
        type: 'new_claim',
        title: 'New Warranty Claim',
        message: `A new warranty claim #${payload.claimId} has been submitted and requires review.`,
        data: {
          claimId: payload.claimId,
          customerId: payload.customerId,
        },
        isRead: false,
      });

    } catch (error) {
      this.logger.error(`Failed to handle claim.created event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('claim.status.updated')
  @Instrument()
  async handleClaimStatusUpdated(payload: {
    claimId: string;
    oldStatus: ClaimStatus;
    newStatus: ClaimStatus;
    updatedBy: string;
    customerId: string;
    productId: string;
    notes?: string;
  }) {
    try {
      this.logger.log(`Handling claim.status.updated event for claim ${payload.claimId} from ${payload.oldStatus} to ${payload.newStatus}`);

      const isCustomerVisible = this.isStatusChangeCustomerVisible(payload.oldStatus, payload.newStatus);
      const customerMessage = this.getStatusChangeCustomerMessage(payload.newStatus);

      // Send real-time update
      await this.webSocketService.sendClaimUpdate(payload.claimId, {
        eventType: ClaimEventType.STATUS_CHANGED,
        oldStatus: payload.oldStatus,
        newStatus: payload.newStatus,
        updatedBy: payload.updatedBy,
        isCustomerVisible,
        message: customerMessage,
        notes: payload.notes,
      });

      // Notify customer if this is a customer-visible change
      if (isCustomerVisible) {
        await this.notificationsService.createNotification({
          userId: payload.customerId,
          type: `claim_status_${payload.newStatus.toLowerCase()}`,
          title: 'Claim Status Updated',
          message: customerMessage,
          data: {
            claimId: payload.claimId,
            newStatus: payload.newStatus,
          },
          isRead: false,
        });
      }

      // Notify relevant team members based on status
      await this.notifyTeamMembers(payload.claimId, payload.newStatus, payload.updatedBy);

    } catch (error) {
      this.logger.error(`Failed to handle claim.status.updated event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('claim.document.added')
  @Instrument()
  async handleClaimDocumentAdded(payload: {
    claimId: string;
    documentId: string;
    documentType: string;
    uploadedBy: string;
    customerId: string;
    fileName: string;
  }) {
    try {
      this.logger.log(`Handling claim.document.added event for claim ${payload.claimId}, document ${payload.documentId}`);

      // Send real-time update
      await this.webSocketService.sendClaimUpdate(payload.claimId, {
        eventType: ClaimEventType.DOCUMENT_ADDED,
        documentId: payload.documentId,
        documentType: payload.documentType,
        uploadedBy: payload.uploadedBy,
        isCustomerVisible: true,
        message: `A new document (${payload.fileName}) has been added to your claim`,
      });

      // Notify the customer
      await this.notificationsService.createNotification({
        userId: payload.customerId,
        type: 'document_added',
        title: 'Document Added',
        message: `A new document (${payload.fileName}) has been added to your warranty claim.`,
        data: {
          claimId: payload.claimId,
          documentId: payload.documentId,
        },
        isRead: false,
      });

    } catch (error) {
      this.logger.error(`Failed to handle claim.document.added event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('claim.note.added')
  @Instrument()
  async handleClaimNoteAdded(payload: {
    claimId: string;
    noteId: string;
    addedBy: string;
    content: string;
    isInternal: boolean;
    customerId: string;
  }) {
    try {
      this.logger.log(`Handling claim.note.added event for claim ${payload.claimId}, note ${payload.noteId}`);

      const isCustomerVisible = !payload.isInternal;

      // Send real-time update
      await this.webSocketService.sendClaimUpdate(payload.claimId, {
        eventType: ClaimEventType.NOTE_ADDED,
        noteId: payload.noteId,
        addedBy: payload.addedBy,
        isCustomerVisible,
        message: isCustomerVisible ? 'A new note has been added to your claim' : 'An internal note has been added to the claim',
        content: payload.content,
      });

      // Notify customer if this is a customer-visible note
      if (isCustomerVisible) {
        await this.notificationsService.createNotification({
          userId: payload.customerId,
          type: 'note_added',
          title: 'New Claim Note',
          message: 'A new note has been added to your warranty claim.',
          data: {
            claimId: payload.claimId,
            noteId: payload.noteId,
            content: payload.content,
          },
          isRead: false,
        });
      }

    } catch (error) {
      this.logger.error(`Failed to handle claim.note.added event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('claim.approval.required')
  @Instrument()
  async handleClaimApprovalRequired(payload: {
    claimId: string;
    approvalStepId: string;
    assignedTo: string;
    requiredBy: Date;
    customerId: string;
  }) {
    try {
      this.logger.log(`Handling claim.approval.required event for claim ${payload.claimId}, step ${payload.approvalStepId}`);

      // Send real-time update to the assigned approver
      await this.webSocketService.broadcastToUser(payload.assignedTo, 'approval_required', {
        claimId: payload.claimId,
        approvalStepId: payload.approvalStepId,
        requiredBy: payload.requiredBy,
        timestamp: new Date().toISOString(),
      });

      // Notify the approver
      await this.notificationsService.createNotification({
        userId: payload.assignedTo,
        type: 'approval_required',
        title: 'Approval Required',
        message: `You have a new warranty claim requiring your approval by ${payload.requiredBy.toLocaleString()}.`,
        data: {
          claimId: payload.claimId,
          approvalStepId: payload.approvalStepId,
        },
        isRead: false,
      });

      // Also send a general update about the approval process
      await this.webSocketService.sendClaimUpdate(payload.claimId, {
        eventType: ClaimEventType.APPROVAL_REQUIRED,
        approvalStepId: payload.approvalStepId,
        assignedTo: payload.assignedTo,
        requiredBy: payload.requiredBy,
        isCustomerVisible: false,
        message: 'Your claim is awaiting approval from a specialist',
      });

    } catch (error) {
      this.logger.error(`Failed to handle claim.approval.required event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('claim.approval.completed')
  @Instrument()
  async handleClaimApprovalCompleted(payload: {
    claimId: string;
    approvalStepId: string;
    approved: boolean;
    approvedBy: string;
    comments: string;
    nextStep?: string;
    customerId: string;
  }) {
    try {
      this.logger.log(`Handling claim.approval.completed event for claim ${payload.claimId}, step ${payload.approvalStepId}`);

      const eventType = payload.approved
        ? ClaimEventType.APPROVAL_APPROVED
        : ClaimEventType.APPROVAL_REJECTED;

      // Send real-time update
      await this.webSocketService.sendClaimUpdate(payload.claimId, {
        eventType,
        approvalStepId: payload.approvalStepId,
        approved: payload.approved,
        approvedBy: payload.approvedBy,
        comments: payload.comments,
        nextStep: payload.nextStep,
        isCustomerVisible: false,
        message: payload.approved
          ? 'Your claim has been approved at this stage'
          : 'Your claim requires additional information',
      });

      // Notify the customer if this affects them
      if (payload.nextStep) {
        await this.notificationsService.createNotification({
          userId: payload.customerId,
          type: payload.approved ? 'approval_approved' : 'approval_rejected',
          title: payload.approved ? 'Claim Approved' : 'Claim Requires Action',
          message: payload.approved
            ? 'Your warranty claim has been approved at this stage and is moving forward.'
            : 'Your warranty claim requires additional information or documentation.',
          data: {
            claimId: payload.claimId,
            comments: payload.comments,
          },
          isRead: false,
        });
      }

    } catch (error) {
      this.logger.error(`Failed to handle claim.approval.completed event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('claim.payment.processed')
  @Instrument()
  async handleClaimPaymentProcessed(payload: {
    claimId: string;
    paymentId: string;
    amount: number;
    currency: string;
    status: string;
    processedBy: string;
    customerId: string;
  }) {
    try {
      this.logger.log(`Handling claim.payment.processed event for claim ${payload.claimId}, payment ${payload.paymentId}`);

      // Send real-time update
      await this.webSocketService.sendClaimUpdate(payload.claimId, {
        eventType: ClaimEventType.PAYMENT_PROCESSED,
        paymentId: payload.paymentId,
        amount: payload.amount,
        currency: payload.currency,
        status: payload.status,
        processedBy: payload.processedBy,
        isCustomerVisible: true,
        message: `A payment of ${payload.amount} ${payload.currency} has been processed for your claim`,
      });

      // Notify the customer
      await this.notificationsService.createNotification({
        userId: payload.customerId,
        type: 'payment_processed',
        title: 'Payment Processed',
        message: `A payment of ${payload.amount} ${payload.currency} has been processed for your warranty claim.`,
        data: {
          claimId: payload.claimId,
          paymentId: payload.paymentId,
          amount: payload.amount,
          currency: payload.currency,
        },
        isRead: false,
      });

    } catch (error) {
      this.logger.error(`Failed to handle claim.payment.processed event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('claim.fraud.suspected')
  @Instrument()
  async handleClaimFraudSuspected(payload: {
    claimId: string;
    detectedBy: string;
    reason: string;
    confidence: number;
    customerId: string;
  }) {
    try {
      this.logger.log(`Handling claim.fraud.suspected event for claim ${payload.claimId}`);

      // Send real-time update to fraud team
      await this.webSocketService.broadcastToChannel('fraud-team', {
        event: 'fraud_alert',
        claimId: payload.claimId,
        detectedBy: payload.detectedBy,
        reason: payload.reason,
        confidence: payload.confidence,
        timestamp: new Date().toISOString(),
      });

      // Notify fraud team
      await this.notificationsService.createNotification({
        userId: 'fraud-team',
        type: 'fraud_alert',
        title: 'Potential Fraud Detected',
        message: `Potential fraud detected on claim ${payload.claimId} with ${(payload.confidence * 100).toFixed(1)}% confidence.`,
        data: {
          claimId: payload.claimId,
          reason: payload.reason,
          confidence: payload.confidence,
        },
        isRead: false,
      });

      // Also send a general update about the fraud suspicion
      await this.webSocketService.sendClaimUpdate(payload.claimId, {
        eventType: ClaimEventType.FRAUD_SUSPECTED,
        detectedBy: payload.detectedBy,
        reason: payload.reason,
        confidence: payload.confidence,
        isCustomerVisible: false,
        message: 'Your claim is under review for potential fraud',
      });

    } catch (error) {
      this.logger.error(`Failed to handle claim.fraud.suspected event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('claim.comment.added')
  @Instrument()
  async handleClaimCommentAdded(payload: {
    claimId: string;
    commentId: string;
    addedBy: string;
    content: string;
    isPublic: boolean;
    customerId: string;
  }) {
    try {
      this.logger.log(`Handling claim.comment.added event for claim ${payload.claimId}, comment ${payload.commentId}`);

      const isCustomerVisible = payload.isPublic;

      // Send real-time update
      await this.webSocketService.sendClaimUpdate(payload.claimId, {
        eventType: ClaimEventType.COMMENT_ADDED,
        commentId: payload.commentId,
        addedBy: payload.addedBy,
        isCustomerVisible,
        message: isCustomerVisible ? 'A new comment has been added to your claim' : 'An internal comment has been added to the claim',
        content: payload.content,
      });

      // Notify customer if this is a public comment
      if (isCustomerVisible) {
        await this.notificationsService.createNotification({
          userId: payload.customerId,
          type: 'comment_added',
          title: 'New Claim Comment',
          message: 'A new comment has been added to your warranty claim.',
          data: {
            claimId: payload.claimId,
            commentId: payload.commentId,
            content: payload.content,
          },
          isRead: false,
        });
      }

    } catch (error) {
      this.logger.error(`Failed to handle claim.comment.added event: ${error.message}`, error.stack);
    }
  }

  private isStatusChangeCustomerVisible(oldStatus: ClaimStatus, newStatus: ClaimStatus): boolean {
    // Status changes that should be visible to customers
    const customerVisibleTransitions = [
      [ClaimStatus.SUBMITTED, ClaimStatus.IN_REVIEW],
      [ClaimStatus.IN_REVIEW, ClaimStatus.APPROVED],
      [ClaimStatus.IN_REVIEW, ClaimStatus.REJECTED],
      [ClaimStatus.IN_REVIEW, ClaimStatus.REQUIRES_INFO],
      [ClaimStatus.REQUIRES_INFO, ClaimStatus.IN_REVIEW],
      [ClaimStatus.APPROVED, ClaimStatus.PROCESSING],
      [ClaimStatus.PROCESSING, ClaimStatus.COMPLETED],
      [ClaimStatus.PROCESSING, ClaimStatus.REJECTED],
    ];

    return customerVisibleTransitions.some(
      ([from, to]) => from === oldStatus && to === newStatus,
    );
  }

  private getStatusChangeCustomerMessage(status: ClaimStatus): string {
    switch (status) {
      case ClaimStatus.IN_REVIEW:
        return 'Your claim is now being reviewed by our team.';
      case ClaimStatus.APPROVED:
        return 'Your warranty claim has been approved!';
      case ClaimStatus.REJECTED:
        return 'Your warranty claim has been rejected. Please check your email for details.';
      case ClaimStatus.REQUIRES_INFO:
        return 'We need additional information to process your claim. Please check your email.';
      case ClaimStatus.PROCESSING:
        return 'Your claim is being processed. You will be notified when complete.';
      case ClaimStatus.COMPLETED:
        return 'Your warranty claim has been completed!';
      case ClaimStatus.CANCELLED:
        return 'Your warranty claim has been cancelled.';
      default:
        return 'Your claim status has been updated.';
    }
  }

  private async notifyTeamMembers(claimId: string, status: ClaimStatus, updatedBy: string) {
    // Get the claim to determine which team members should be notified
    const claim = await this.claimsService.getClaimById(claimId);
    if (!claim) return;

    // Determine notification recipients based on status
    const notifications = [];

    switch (status) {
      case ClaimStatus.IN_REVIEW:
        // Notify the claims team
        notifications.push({
          userId: 'claims-team',
          type: 'claim_in_review',
          title: 'Claim In Review',
          message: `Claim ${claimId} is now in review.`,
          data: { claimId },
          isRead: false,
        });
        break;

      case ClaimStatus.APPROVED:
        // Notify the processing team
        notifications.push({
          userId: 'processing-team',
          type: 'claim_approved',
          title: 'Claim Approved',
          message: `Claim ${claimId} has been approved and is ready for processing.`,
          data: { claimId },
          isRead: false,
        });
        break;

      case ClaimStatus.REJECTED:
        // Notify the customer service team for follow-up
        notifications.push({
          userId: 'customer-service',
          type: 'claim_rejected',
          title: 'Claim Rejected',
          message: `Claim ${claimId} has been rejected and may require customer follow-up.`,
          data: { claimId },
          isRead: false,
        });
        break;

      case ClaimStatus.REQUIRES_INFO:
        // Notify the customer service team
        notifications.push({
          userId: 'customer-service',
          type: 'claim_requires_info',
          title: 'Claim Requires Information',
          message: `Claim ${claimId} requires additional information from the customer.`,
          data: { claimId },
          isRead: false,
        });
        break;
    }

    // Send all notifications
    for (const notification of notifications) {
      await this.notificationsService.createNotification(notification);
    }
  }
}
```

#### 3. Client-Side WebSocket Integration (60+ lines)

```typescript
// src/frontend/src/services/websocket.service.ts
import { Injectable, Logger } from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent, merge } from 'rxjs';
import { filter, map, shareReplay, takeUntil } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { ClaimEvent } from '../models/claim-event.model';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private readonly logger = new Logger('WebSocketService');
  private socket: SocketIOClient.Socket | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly reconnectAttempts = 5;
  private currentAttempt = 0;
  private readonly reconnectDelay = 3000; // 3 seconds
  private readonly maxReconnectDelay = 30000; // 30 seconds

  // Subjects for different event types
  private readonly claimEvents$ = new Subject<ClaimEvent>();
  private readonly notifications$ = new Subject<Notification>();
  private readonly userStatus$ = new Subject<{ userId: string; status: 'online' | 'offline' }>();
  private readonly connectionStatus$ = new BehaviorSubject<boolean>(false);
  private readonly connectionError$ = new Subject<string>();

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.initializeWebSocket();
    this.setupAuthListeners();
  }

  /**
   * Initializes the WebSocket connection
   */
  private initializeWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Get WebSocket URL from environment
    const wsUrl = environment.wsUrl || environment.apiUrl.replace(/^http/, 'ws');

    this.logger.log(`Initializing WebSocket connection to ${wsUrl}`);

    // Create socket with authentication
    this.socket = io(wsUrl, {
      path: '/ws-warranty',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.reconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: this.maxReconnectDelay,
      randomizationFactor: 0.5,
      timeout: 20000,
      autoConnect: false,
      query: {
        token: this.authService.getToken() || '',
      },
    });

    // Set up event listeners
    this.setupSocketListeners();
  }

  /**
   * Sets up WebSocket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.logger.log('WebSocket connected');
      this.connectionStatus$.next(true);
      this.currentAttempt = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      this.logger.log(`WebSocket disconnected: ${reason}`);
      this.connectionStatus$.next(false);

      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, reconnect manually
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      this.logger.error('WebSocket connection error', error);
      this.connectionError$.next(error.message);

      if (this.currentAttempt < this.reconnectAttempts) {
        this.reconnect();
      }
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      this.logger.log(`WebSocket reconnection attempt ${attempt}`);
      this.currentAttempt = attempt;
    });

    this.socket.on('reconnect_failed', () => {
      this.logger.error('WebSocket reconnection failed');
      this.connectionError$.next('Failed to reconnect to WebSocket server');
    });

    // Custom events
    this.socket.on('connected', (data: any) => {
      this.logger.log('WebSocket connection established', data);
    });

    this.socket.on('pong', (data: any) => {
      this.logger.debug('WebSocket pong received', data);
    });

    // Claim events
    this.socket.on('claim:update', (event: ClaimEvent) => {
      this.logger.debug('Claim update received', event);
      this.claimEvents$.next(event);
    });

    // Notifications
    this.socket.on('notification', (notification: Notification) => {
      this.logger.debug('Notification received', notification);
      this.notifications$.next(notification);
    });

    // User status updates
    this.socket.on('user-status', (data: { userId: string; status: 'online' | 'offline' }) => {
      this.logger.debug('User status update', data);
      this.userStatus$.next(data);
    });

    // Error events
    this.socket.on('error', (error: any) => {
      this.logger.error('WebSocket error', error);
      this.connectionError$.next(error.message || 'WebSocket error occurred');
    });
  }

  /**
   * Sets up authentication state listeners
   */
  private setupAuthListeners(): void {
    // Reconnect when token changes
    this.authService.token$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(token => {
      if (token && this.socket && !this.socket.connected) {
        this.connect();
      }
    });

    // Disconnect when user logs out
    this.authService.logout$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.disconnect();
    });
  }

  /**
   * Attempts to reconnect to the WebSocket server
   */
  private reconnect(): void {
    if (!this.socket) return;

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.logger.log('Attempting WebSocket reconnection...');
        this.socket.connect();
      }
    }, this.reconnectDelay * Math.pow(2, this.currentAttempt));
  }

  /**
   * Connects to the WebSocket server
   */
  connect(): void {
    if (!this.socket) {
      this.initializeWebSocket();
    }

    if (this.socket && !this.socket.connected) {
      this.logger.log('Connecting to WebSocket...');
      this.socket.connect();
    }
  }

  /**
   * Disconnects from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.logger.log('Disconnecting from WebSocket...');
      this.socket.disconnect();
    }
  }

  /**
   * Subscribes to a WebSocket channel
   * @param channel Channel name
   * @param options Subscription options
   */
  subscribe(channel: string, options?: any): void {
    if (!this.socket || !this.socket.connected) {
      this.logger.warn(`Cannot subscribe to ${channel}: WebSocket not connected`);
      return;
    }

    this.logger.log(`Subscribing to channel: ${channel}`);
    this.socket.emit('subscribe', { channel, ...options });
  }

  /**
   * Unsubscribes from a WebSocket channel
   * @param channel Channel name
   */
  unsubscribe(channel: string): void {
    if (!this.socket || !this.socket.connected) {
      this.logger.warn(`Cannot unsubscribe from ${channel}: WebSocket not connected`);
      return;
    }

    this.logger.log(`Unsubscribing from channel: ${channel}`);
    this.socket.emit('unsubscribe', { channel });
  }

  /**
   * Sends a message to a WebSocket channel
   * @param channel Channel name
   * @param message Message to send
   */
  sendMessage(channel: string, message: any): void {
    if (!this.socket || !this.socket.connected) {
      this.logger.warn(`Cannot send message to ${channel}: WebSocket not connected`);
      return;
    }

    this.logger.debug(`Sending message to channel ${channel}`, message);
    this.socket.emit('message', { channel, message });
  }

  /**
   * Gets an observable for claim events
   * @param claimId Optional claim ID to filter events
   * @returns Observable of claim events
   */
  getClaimEvents(claimId?: string): Observable<ClaimEvent> {
    return this.claimEvents$.pipe(
      filter(event => !claimId || event.claimId === claimId),
      shareReplay(1),
    );
  }

  /**
   * Gets an observable for notifications
   * @returns Observable of notifications
   */
  getNotifications(): Observable<Notification> {
    return this.notifications$.pipe(
      shareReplay(1),
    );
  }

  /**
   * Gets an observable for user status updates
   * @returns Observable of user status updates
   */
  getUserStatusUpdates(): Observable<{ userId: string; status: 'online' | 'offline' }> {
    return this.userStatus$.pipe(
      shareReplay(1),
    );
  }

  /**
   * Gets an observable for connection status
   * @returns Observable of connection status
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.pipe(
      shareReplay(1),
    );
  }

  /**
   * Gets an observable for connection errors
   * @returns Observable of connection errors
   */
  getConnectionErrors(): Observable<string> {
    return this.connectionError$.pipe(
      shareReplay(1),
    );
  }

  /**
   * Gets the current connection status
   * @returns Current connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Gets WebSocket statistics
   * @returns WebSocket statistics
   */
  getStatistics(): { connected: boolean; channels: string[] } {
    if (!this.socket) {
      return { connected: false, channels: [] };
    }

    // Note: In a real implementation, you would track subscribed channels
    return {
      connected: this.socket.connected,
      channels: [], // Would be populated with actual subscribed channels
    };
  }

  /**
   * Sends a ping to the WebSocket server
   */
  ping(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Cleans up the WebSocket service
   */
  ngOnDestroy(): void {
    this.logger.log('Destroying WebSocket service');
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}

// src/frontend/src/services/claim-realtime.service.ts
import { Injectable, Logger } from '@angular/core';
import { WebSocketService } from './websocket.service';
import { ClaimEvent } from '../models/claim-event.model';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter, map, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { ClaimStatus } from '../enums/claim-status.enum';
import { ClaimEventType } from '../enums/claim-event-type.enum';

@Injectable({
  providedIn: 'root',
})
export class ClaimRealtimeService {
  private readonly logger = new Logger('ClaimRealtimeService');
  private readonly activeClaims = new Map<string, BehaviorSubject<ClaimEvent>>();

  constructor(private webSocketService: WebSocketService) {
    this.setupEventListeners();
  }

  /**
   * Sets up WebSocket event listeners
   */
  private setupEventListeners(): void {
    // Subscribe to all claim events
    this.webSocketService.getClaimEvents().subscribe(event => {
      this.handleClaimEvent(event);
    });
  }

  /**
   * Handles a claim event
   * @param event Claim event
   */
  private handleClaimEvent(event: ClaimEvent): void {
    // Update the active claim subject
    if (!this.activeClaims.has(event.claimId)) {
      this.activeClaims.set(event.claimId, new BehaviorSubject<ClaimEvent>(event));
    } else {
      this.activeClaims.get(event.claimId)?.next(event);
    }

    // Log the event
    this.logger.debug(`Claim event received for ${event.claimId}: ${event.eventType}`);
  }

  /**
   * Gets real-time updates for a specific claim
   * @param claimId Claim ID
   * @returns Observable of claim events
   */
  getClaimUpdates(claimId: string): Observable<ClaimEvent> {
    // If we don't have this claim in our map, create a new subject
    if (!this.activeClaims.has(claimId)) {
      this.activeClaims.set(claimId, new BehaviorSubject<ClaimEvent>({
        claimId,
        eventType: ClaimEventType.INITIALIZED,
        timestamp: new Date().toISOString(),
      }));
    }

    // Subscribe to the claim's channel
    this.webSocketService.subscribe(`claim:${claimId}`);

    return this.activeClaims.get(claimId)!.asObservable().pipe(
      filter(event => event.eventType !== ClaimEventType.INITIALIZED),
      shareReplay(1),
    );
  }

  /**
   * Gets the current status of a claim
   * @param claimId Claim ID
   * @returns Observable of claim status
   */
  getClaimStatus(claimId: string): Observable<ClaimStatus> {
    return this.getClaimUpdates(claimId).pipe(
      map(event => {
        // For status change events, return the new status
        if (event.eventType === ClaimEventType.STATUS_CHANGED) {
          return event.newStatus;
        }

        // For other events, try to extract status from the event
        if ('status' in event) {
          return event.status;
        }

        // Default to the last known status
        return ClaimStatus.SUBMITTED;
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
  }

  /**
   * Gets the real-time timeline for a claim
   * @param claimId Claim ID
   * @returns Observable of claim timeline events
   */
  getClaimTimeline(claimId: string): Observable<ClaimEvent[]> {
    const timelineSubject = new BehaviorSubject<ClaimEvent[]>([]);

    this.getClaimUpdates(claimId).subscribe(event => {
      const currentTimeline = timelineSubject.getValue();
      timelineSubject.next([...currentTimeline, event]);
    });

    return timelineSubject.asObservable().pipe(
      shareReplay(1),
    );
  }

  /**
   * Gets real-time updates for all claims related to a product
   * @param productId Product ID
   * @returns Observable of claim events for the product
   */
  getProductClaimUpdates(productId: string): Observable<ClaimEvent> {
    // Subscribe to the product's channel
    this.webSocketService.subscribe(`product:${productId}`);

    return this.webSocketService.getClaimEvents().pipe(
      filter(event => event.productId === productId),
      shareReplay(1),
    );
  }

  /**
   * Gets real-time updates for all claims for a customer
   * @param customerId Customer ID
   * @returns Observable of claim events for the customer
   */
  getCustomerClaimUpdates(customerId: string): Observable<ClaimEvent> {
    // Subscribe to the customer's channel
    this.webSocketService.subscribe(`customer:${customerId}`);

    return this.webSocketService.getClaimEvents().pipe(
      filter(event => event.customerId === customerId),
      shareReplay(1),
    );
  }

  /**
   * Gets real-time statistics for a claim
   * @param claimId Claim ID
   * @returns Observable of claim statistics
   */
  getClaimStatistics(claimId: string): Observable<{
    status: ClaimStatus;
    lastUpdate: Date;
    documentsCount: number;
    notesCount: number;
    approvalSteps: number;
    isFraudSuspected: boolean;
  }> {
    return combineLatest([
      this.getClaimStatus(claimId),
      this.getClaimUpdates(claimId),
    ]).pipe(
      map(([status, lastEvent]) => {
        // Initialize statistics
        const stats = {
          status,
          lastUpdate: new Date(lastEvent.timestamp),
          documentsCount: 0,
          notesCount: 0,
          approvalSteps: 0,
          isFraudSuspected: false,
        };

        // Update based on event type
        switch (lastEvent.eventType) {
          case ClaimEventType.DOCUMENT_ADDED:
            stats.documentsCount++;
            break;
          case ClaimEventType.NOTE_ADDED:
            stats.notesCount++;
            break;
          case ClaimEventType.APPROVAL_REQUIRED:
            stats.approvalSteps++;
            break;
          case ClaimEventType.FRAUD_SUSPECTED:
            stats.isFraudSuspected = true;
            break;
        }

        return stats;
      }),
      distinctUntilChanged((prev, curr) =>
        prev.status === curr.status &&
        prev.lastUpdate.getTime() === curr.lastUpdate.getTime() &&
        prev.documentsCount === curr.documentsCount &&
        prev.notesCount === curr.notesCount &&
        prev.approvalSteps === curr.approvalSteps &&
        prev.isFraudSuspected === curr.isFraudSuspected
      ),
      shareReplay(1),
    );
  }

  /**
   * Cleans up resources for a claim
   * @param claimId Claim ID
   */
  cleanupClaim(claimId: string): void {
    this.logger.log(`Cleaning up real-time resources for claim ${claimId}`);
    this.webSocketService.unsubscribe(`claim:${claimId}`);
    this.activeClaims.get(claimId)?.complete();
    this.activeClaims.delete(claimId);
  }
}

// src/frontend/src/components/claim-status/claim-status.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ClaimRealtimeService } from '../../services/claim-realtime.service';
import { ClaimStatus } from '../../enums/claim-status.enum';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-claim-status',
  templateUrl: './claim-status.component.html',
  styleUrls: ['./claim-status.component.scss'],
})
export class ClaimStatusComponent implements OnInit, OnDestroy {
  @Input() claimId!: string;
  @Input() showDetails: boolean = false;

  status$: Observable<ClaimStatus>;
  statusText$: Observable<string>;
  statusClass$: Observable<string>;
  lastUpdate$: Observable<Date>;
  isLoading: boolean = true;
  private subscriptions = new Subscription();

  constructor(private claimRealtimeService: ClaimRealtimeService) {
    this.status$ = new Observable();
    this.statusText$ = new Observable();
    this.statusClass$ = new Observable();
    this.lastUpdate$ = new Observable();
  }

  ngOnInit(): void {
    if (!this.claimId) {
      console.error('Claim ID is required for ClaimStatusComponent');
      return;
    }

    // Get real-time status updates
    this.status$ = this.claimRealtimeService.getClaimStatus(this.claimId).pipe(
      map(status => {
        this.isLoading = false;
        return status;
      }),
    );

    // Map status to display text
    this.statusText$ = this.status$.pipe(
      map(status => this.getStatusText(status)),
    );

    // Map status to CSS class
    this.statusClass$ = this.status$.pipe(
      map(status => this.getStatusClass(status)),
    );

    // Get last update time
    this.lastUpdate$ = this.claimRealtimeService.getClaimUpdates(this.claimId).pipe(
      map(event => new Date(event.timestamp)),
    );

    // Subscribe to status changes for logging
    this.subscriptions.add(
      this.status$.subscribe(status => {
        console.log(`Claim ${this.claimId} status updated to: ${status}`);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.claimRealtimeService.cleanupClaim(this.claimId);
  }

  private getStatusText(status: ClaimStatus): string {
    switch (status) {
      case ClaimStatus.SUBMITTED: return 'Submitted';
      case ClaimStatus.IN_REVIEW: return 'In Review';
      case ClaimStatus.APPROVED: return 'Approved';
      case ClaimStatus.REJECTED: return 'Rejected';
      case ClaimStatus.REQUIRES_INFO: return 'Requires Information';
      case ClaimStatus.PROCESSING: return 'Processing';
      case ClaimStatus.COMPLETED: return 'Completed';
      case ClaimStatus.CANCELLED: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  private getStatusClass(status: ClaimStatus): string {
    switch (status) {
      case ClaimStatus.SUBMITTED: return 'status-submitted';
      case ClaimStatus.IN_REVIEW: return 'status-in-review';
      case ClaimStatus.APPROVED: return 'status-approved';
      case ClaimStatus.REJECTED: return 'status-rejected';
      case ClaimStatus.REQUIRES_INFO: return 'status-requires-info';
      case ClaimStatus.PROCESSING: return 'status-processing';
      case ClaimStatus.COMPLETED: return 'status-completed';
      case ClaimStatus.CANCELLED: return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  getStatusIcon(status: ClaimStatus): string {
    switch (status) {
      case ClaimStatus.SUBMITTED: return 'hourglass_empty';
      case ClaimStatus.IN_REVIEW: return 'search';
      case ClaimStatus.APPROVED: return 'check_circle';
      case ClaimStatus.REJECTED: return 'cancel';
      case ClaimStatus.REQUIRES_INFO: return 'info';
      case ClaimStatus.PROCESSING: return 'autorenew';
      case ClaimStatus.COMPLETED: return 'done_all';
      case ClaimStatus.CANCELLED: return 'block';
      default: return 'help_outline';
    }
  }
}
```

#### 4. Room/Channel Management (50+ lines)

```typescript
// src/websocket/channel-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { ClaimsService } from '../claims/claims.service';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Instrument } from 'nestjs-otel';

@Injectable()
export class ChannelManagerService {
  private readonly logger = new Logger(ChannelManagerService.name);
  private readonly channelPrefixes = {
    claim: 'claim',
    customer: 'customer',
    product: 'product',
    user: 'user',
    team: 'team',
    global: 'global',
  };

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly claimsService: ClaimsService,
    private readonly customersService: CustomersService,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Gets all available channel types
   * @returns Array of channel types
   */
  getChannelTypes(): string[] {
    return Object.values(this.channelPrefixes);
  }

  /**
   * Validates if a channel name is valid
   * @param channel Channel name
   * @returns Validation result
   */
  validateChannel(channel: string): { isValid: boolean; type?: string; id?: string } {
    const parts = channel.split(':');
    if (parts.length < 2) {
      return { isValid: false };
    }

    const prefix = parts[0];
    const id = parts.slice(1).join(':');

    if (!Object.values(this.channelPrefixes).includes(prefix)) {
      return { isValid: false };
    }

    if (!id || id.length === 0) {
      return { isValid: false };
    }

    return { isValid: true, type: prefix, id };
  }

  /**
   * Creates a claim-specific channel
   * @param claimId Claim ID
   * @returns Channel name
   */
  createClaimChannel(claimId: string): string {
    return `${this.channelPrefixes.claim}:${claimId}`;
  }

  /**
   * Creates a customer-specific channel
   * @param customerId Customer ID
   * @returns Channel name
   */
  createCustomerChannel(customerId: string): string {
    return `${this.channelPrefixes.customer}:${customerId}`;
  }

  /**
   * Creates a product-specific channel
   * @param productId Product ID
   * @returns Channel name
   */
  createProductChannel(productId: string): string {
    return `${this.channelPrefixes.product}:${productId}`;
  }

  /**
   * Creates a user-specific channel
   * @param userId User ID
   * @returns Channel name
   */
  createUserChannel(userId: string): string {
    return `${this.channelPrefixes.user}:${userId}`;
  }

  /**
   * Creates a team channel
   * @param teamName Team name
   * @returns Channel name
   */
  createTeamChannel(teamName: string): string {
    return `${this.channelPrefixes.team}:${teamName}`;
  }

  /**
   * Creates a global channel
   * @param channelName Channel name
   * @returns Channel name
   */
  createGlobalChannel(channelName: string): string {
    return `${this.channelPrefixes.global}:${channelName}`;
  }

  /**
   * Subscribes a user to a claim channel with proper authorization
   * @param userId User ID
   * @param claimId Claim ID
   * @param clientId WebSocket client ID
   */
  @Instrument()
  async subscribeToClaimChannel(userId: string, claimId: string, clientId: string): Promise<boolean> {
    try {
      // Verify that the user has access to this claim
      const hasAccess = await this.verifyClaimAccess(userId, claimId);
      if (!hasAccess) {
        this.logger.warn(`User ${userId} attempted to subscribe to claim ${claimId} without access`);
        return false;
      }

      const channel = this.createClaimChannel(claimId);
      this.webSocketService.subscribeClient(clientId, userId, channel, {
        claimId,
        userId,
      });

      this.logger.log(`User ${userId} subscribed to claim channel ${channel}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId} to claim ${claimId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Subscribes a user to a customer channel with proper authorization
   * @param userId User ID
   * @param customerId Customer ID
   * @param clientId WebSocket client ID
   */
  @Instrument()
  async subscribeToCustomerChannel(userId: string, customerId: string, clientId: string): Promise<boolean> {
    try {
      // Verify that the user has access to this customer
      const hasAccess = await this.verifyCustomerAccess(userId, customerId);
      if (!hasAccess) {
        this.logger.warn(`User ${userId} attempted to subscribe to customer ${customerId} without access`);
        return false;
      }

      const channel = this.createCustomerChannel(customerId);
      this.webSocketService.subscribeClient(clientId, userId, channel, {
        customerId,
        userId,
      });

      this.logger.log(`User ${userId} subscribed to customer channel ${channel}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId} to customer ${customerId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Subscribes a user to a product channel with proper authorization
   * @param userId User ID
   * @param productId Product ID
   * @param clientId WebSocket client ID
   */
  @Instrument()
  async subscribeToProductChannel(userId: string, productId: string, clientId: string): Promise<boolean> {
    try {
      // Verify that the user has access to this product
      const hasAccess = await this.verifyProductAccess(userId, productId);
      if (!hasAccess) {
        this.logger.warn(`User ${userId} attempted to subscribe to product ${productId} without access`);
        return false;
      }

      const channel = this.createProductChannel(productId);
      this.webSocketService.subscribeClient(clientId, userId, channel, {
        productId,
        userId,
      });

      this.logger.log(`User ${userId} subscribed to product channel ${channel}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId} to product ${productId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Subscribes a user to a team channel with proper authorization
   * @param userId User ID
   * @param teamName Team name
   * @param clientId WebSocket client ID
   */
  @Instrument()
  async subscribeToTeamChannel(userId: string, teamName: string, clientId: string): Promise<boolean> {
    try {
      // Verify that the user belongs to this team
      const belongsToTeam = await this.verifyTeamMembership(userId, teamName);
      if (!belongsToTeam) {
        this.logger.warn(`User ${userId} attempted to subscribe to team ${teamName} without membership`);
        return false;
      }

      const channel = this.createTeamChannel(teamName);
      this.webSocketService.subscribeClient(clientId, userId, channel, {
        teamName,
        userId,
      });

      this.logger.log(`User ${userId} subscribed to team channel ${channel}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId} to team ${teamName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Subscribes a user to a global channel with proper authorization
   * @param userId User ID
   * @param channelName Channel name
   * @param clientId WebSocket client ID
   */
  @Instrument()
  async subscribeToGlobalChannel(userId: string, channelName: string, clientId: string): Promise<boolean> {
    try {
      // Verify that the user has access to this global channel
      const hasAccess = await this.verifyGlobalChannelAccess(userId, channelName);
      if (!hasAccess) {
        this.logger.warn(`User ${userId} attempted to subscribe to global channel ${channelName} without access`);
        return false;
      }

      const channel = this.createGlobalChannel(channelName);
      this.webSocketService.subscribeClient(clientId, userId, channel, {
        channelName,
        userId,
      });

      this.logger.log(`User ${userId} subscribed to global channel ${channel}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId} to global channel ${channelName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Unsubscribes a client from a channel
   * @param clientId WebSocket client ID
   * @param userId User ID
   * @param channel Channel name
   */
  @Instrument()
  unsubscribeFromChannel(clientId: string, userId: string, channel: string): void {
    try {
      this.webSocketService.unsubscribeClient(clientId, userId, channel);
      this.logger.log(`Client ${clientId} (User: ${userId}) unsubscribed from channel ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe client ${clientId} from channel ${channel}: ${error.message}`);
    }
  }

  /**
   * Gets all channels a user is subscribed to
   * @param userId User ID
   * @returns Array of channel names
   */
  @Instrument()
  getUserChannels(userId: string): string[] {
    return Array.from(this.webSocketService['userChannels'].get(userId) || []);
  }

  /**
   * Gets all clients subscribed to a channel
   * @param channel Channel name
   * @returns Array of client IDs
   */
  @Instrument()
  getChannelClients(channel: string): string[] {
    return Array.from(this.webSocketService['channelSubscriptions'].get(channel) || []);
  }

  /**
   * Gets statistics for all channels
   * @returns Channel statistics
   */
  @Instrument()
  getChannelStatistics(): Array<{
    channel: string;
    type: string;
    clients: number;
    users: number;
  }> {
    const stats: Array<{
      channel: string;
      type: string;
      clients: number;
      users: number;
    }> = [];

    this.webSocketService['channelSubscriptions'].forEach((clients, channel) => {
      const validation = this.validateChannel(channel);
      if (!validation.isValid) return;

      // Count unique users
      const userIds = new Set<string>();
      clients.forEach(clientId => {
        const client = this.webSocketService['server'].sockets.sockets.get(clientId);
        if (client && client.data.user?.sub) {
          userIds.add(client.data.user.sub);
        }
      });

      stats.push({
        channel,
        type: validation.type!,
        clients: clients.size,
        users: userIds.size,
      });
    });

    return stats;
  }

  /**
   * Verifies if a user has access to a claim
   * @param userId User ID
   * @param claimId Claim ID
   * @returns Promise with access verification result
   */
  private async verifyClaimAccess(userId: string, claimId: string): Promise<boolean> {
    try {
      const claim = await this.claimsService.getClaimById(claimId);
      if (!claim) {
        return false;
      }

      // Customer can access their own claims
      if (claim.customerId === userId) {
        return true;
      }

      // Check if user is in the claims team or has specific permissions
      const user = await this.usersService.findById(userId);
      if (!user) {
        return false;
      }

      // Check user roles/permissions
      return user.roles.some(role =>
        role.name === 'claims_agent' ||
        role.name === 'claims_manager' ||
        role.name === 'admin'
      );
    } catch (error) {
      this.logger.error(`Error verifying claim access for user ${userId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifies if a user has access to a customer
   * @param userId User ID
   * @param customerId Customer ID
   * @returns Promise with access verification result
   */
  private async verifyCustomerAccess(userId: string, customerId: string): Promise<boolean> {
    try {
      // Customer can access their own data
      if (userId === customerId) {
        return true;
      }

      // Check if user has customer access permissions
      const user = await this.usersService.findById(userId);
      if (!user) {
        return false;
      }

      // Check user roles/permissions
      return user.roles.some(role =>
        role.name === 'customer_service' ||
        role.name === 'claims_agent' ||
        role.name === 'admin'
      );
    } catch (error) {
      this.logger.error(`Error verifying customer access for user ${userId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifies if a user has access to a product
   * @param userId User ID
   * @param productId Product ID
   * @returns Promise with access verification result
   */
  private async verifyProductAccess(userId: string, productId: string): Promise<boolean> {
    try {
      // Check if user has product access permissions
      const user = await this.usersService.findById(userId);
      if (!user) {
        return false;
      }

      // Check user roles/permissions
      return user.roles.some(role =>
        role.name === 'product_manager' ||
        role.name === 'claims_agent' ||
        role.name === 'admin'
      );
    } catch (error) {
      this.logger.error(`Error verifying product access for user ${userId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifies if a user belongs to a team
   * @param userId User ID
   * @param teamName Team name
   * @returns Promise with team membership verification result
   */
  private async verifyTeamMembership(userId: string, teamName: string): Promise<boolean> {
    try {
      // Special team names
      if (teamName === 'claims-team' || teamName === 'fraud-team' || teamName === 'customer-service') {
        const user = await this.usersService.findById(userId);
        if (!user) {
          return false;
        }

        // Check user roles
        return user.roles.some(role => {
          switch (teamName) {
            case 'claims-team':
              return role.name === 'claims_agent' || role.name === 'claims_manager';
            case 'fraud-team':
              return role.name === 'fraud_analyst' || role.name === 'fraud_manager';
            case 'customer-service':
              return role.name === 'customer_service' || role.name === 'customer_service_manager';
            default:
              return false;
          }
        });
      }

      // For other teams, check database
      return this.usersService.isUserInTeam(userId, teamName);
    } catch (error) {
      this.logger.error(`Error verifying team membership for user ${userId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifies if a user has access to a global channel
   * @param userId User ID
   * @param channelName Channel name
   * @returns Promise with access verification result
   */
  private async verifyGlobalChannelAccess(userId: string, channelName: string): Promise<boolean> {
    try {
      // Check if channel is public
      const publicChannels = this.configService.get('PUBLIC_WEBSOCKET_CHANNELS', '').split(',');
      if (publicChannels.includes(channelName)) {
        return true;
      }

      // Check user permissions
      const user = await this.usersService.findById(userId);
      if (!user) {
        return false;
      }

      // Admins have access to all channels
      if (user.roles.some(role => role.name === 'admin')) {
        return true;
      }

      // Check specific channel permissions
      return user.permissions.some(permission =>
        permission.name === `websocket:${channelName}` ||
        permission.name === 'websocket:*'
      );
    } catch (error) {
      this.logger.error(`Error verifying global channel access for user ${userId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Automatically subscribes a user to relevant channels based on their role
   * @param userId User ID
   * @param clientId WebSocket client ID
   */
  @Instrument()
  async autoSubscribeUser(userId: string, clientId: string): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        this.logger.warn(`User ${userId} not found for auto-subscription`);
        return;
      }

      this.logger.log(`Auto-subscribing user ${userId} to relevant channels`);

      // Subscribe to user's own channel
      await this.subscribeToUserChannel(userId, userId, clientId);

      // Subscribe based on roles
      for (const role of user.roles) {
        switch (role.name) {
          case 'claims_agent':
          case 'claims_manager':
            await this.subscribeToTeamChannel(userId, 'claims-team', clientId);
            break;

          case 'fraud_analyst':
          case 'fraud_manager':
            await this.subscribeToTeamChannel(userId, 'fraud-team', clientId);
            break;

          case 'customer_service':
          case 'customer_service_manager':
            await this.subscribeToTeamChannel(userId, 'customer-service', clientId);
            break;

          case 'product_manager':
            // Subscribe to all products (or could be more specific)
            await this.subscribeToGlobalChannel(userId, 'product-updates', clientId);
            break;

          case 'admin':
            // Admins get access to all channels
            await this.subscribeToGlobalChannel(userId, 'admin', clientId);
            break;
        }
      }

      // Subscribe to any saved preferences
      const preferences = await this.usersService.getUserPreferences(userId);
      if (preferences?.websocket?.autoSubscribe) {
        for (const channel of preferences.websocket.autoSubscribe) {
          const validation = this.validateChannel(channel);
          if (validation.isValid) {
            switch (validation.type) {
              case this.channelPrefixes.claim:
                await this.subscribeToClaimChannel(userId, validation.id, clientId);
                break;
              case this.channelPrefixes.customer:
                await this.subscribeToCustomerChannel(userId, validation.id, clientId);
                break;
              case this.channelPrefixes.product:
                await this.subscribeToProductChannel(userId, validation.id, clientId);
                break;
              case this.channelPrefixes.team:
                await this.subscribeToTeamChannel(userId, validation.id, clientId);
                break;
              case this.channelPrefixes.global:
                await this.subscribeToGlobalChannel(userId, validation.id, clientId);
                break;
            }
          }
        }
      }

    } catch (error) {
      this.logger.error(`Failed to auto-subscribe user ${userId}: ${error.message}`);
    }
  }
}
```

#### 5. Reconnection Logic (30+ lines)

```typescript
// src/websocket/reconnection.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { ChannelManagerService } from './channel-manager.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Instrument } from 'nestjs-otel';

@Injectable()
export class ReconnectionService {
  private readonly logger = new Logger(ReconnectionService.name);
  private readonly reconnectionAttempts = new Map<string, number>();
  private readonly maxReconnectionAttempts: number;
  private readonly reconnectionDelay: number;
  private readonly maxReconnectionDelay: number;

  constructor(
    private readonly webSocketGateway: WebSocketGateway,
    private readonly webSocketService: WebSocketService,
    private readonly channelManager: ChannelManagerService,
    private readonly configService: ConfigService,
  ) {
    this.maxReconnectionAttempts = this.configService.get('WEBSOCKET_MAX_RECONNECTION_ATTEMPTS', 10);
    this.reconnectionDelay = this.configService.get('WEBSOCKET_RECONNECTION_DELAY', 3000);
    this.maxReconnectionDelay = this.configService.get('WEBSOCKET_MAX_RECONNECTION_DELAY', 30000);
  }

  /**
   * Handles a client that needs reconnection
   * @param clientId Client ID
   * @param userId User ID
   */
  @Instrument()
  handleClientReconnection(clientId: string, userId: string): void {
    const attempt = this.reconnectionAttempts.get(clientId) || 0;
    const nextAttempt = attempt + 1;

    if (nextAttempt > this.maxReconnectionAttempts) {
      this.logger.warn(`Max reconnection attempts reached for client ${clientId}`);
      this.reconnectionAttempts.delete(clientId);
      return;
    }

    this.reconnectionAttempts.set(clientId, nextAttempt);

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectionDelay * Math.pow(2, nextAttempt - 1),
      this.maxReconnectionDelay,
    );

    this.logger.log(`Scheduling reconnection for client ${clientId} (attempt ${nextAttempt}) in ${delay}ms`);

    setTimeout(() => {
      this.attemptReconnection(clientId, userId);
    }, delay);
  }

  /**
   * Attempts to reconnect a client
   * @param clientId Client ID
   * @param userId User ID
   */
  @Instrument()
  private async attemptReconnection