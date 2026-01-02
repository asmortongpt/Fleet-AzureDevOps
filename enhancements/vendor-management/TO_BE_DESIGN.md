# TO_BE_DESIGN.md: Vendor Management System - Next-Generation Platform

## Executive Vision (150+ lines)

### Strategic Vision for Vendor Management Transformation

The next-generation Vendor Management System (VMS) represents a paradigm shift in how enterprises interact with their supplier ecosystem. This transformation initiative aims to evolve from a transactional procurement platform to a strategic partnership hub that drives innovation, cost optimization, and risk mitigation across the supply chain.

**Core Transformation Goals:**

1. **From Reactive to Predictive Management**
   - Implement AI-driven predictive analytics to forecast vendor performance, delivery risks, and pricing fluctuations
   - Develop early warning systems for contract compliance issues and quality deviations
   - Create automated risk assessment models that evaluate vendors across 50+ dimensions

2. **From Siloed to Integrated Operations**
   - Break down functional silos between procurement, finance, legal, and operations
   - Enable cross-functional collaboration through shared dashboards and real-time data synchronization
   - Implement unified vendor profiles that aggregate data from ERP, CRM, and external sources

3. **From Cost-Centric to Value-Driven**
   - Shift focus from unit price negotiation to total value creation
   - Implement innovation scoring to identify vendors that drive competitive advantage
   - Develop sustainability metrics that align with ESG goals and circular economy principles

4. **From Manual to Autonomous Operations**
   - Achieve 80% automation of routine vendor management tasks
   - Implement self-service portals for vendors with guided onboarding
   - Create autonomous contract renewal and performance review workflows

**User Experience Revolution:**

The new VMS will redefine user experience through:

1. **Context-Aware Interfaces**
   - Dynamic dashboards that adapt to user roles, preferences, and current tasks
   - Predictive UI elements that anticipate user needs based on behavioral patterns
   - Contextual help systems that provide relevant guidance at decision points

2. **Omni-Channel Engagement**
   - Unified experience across desktop, mobile, and tablet devices
   - Progressive Web App capabilities for offline functionality
   - Voice-enabled interfaces for hands-free operations

3. **Cognitive Load Reduction**
   - Intelligent information filtering based on user priorities
   - Automated task prioritization using machine learning
   - Natural language processing for query understanding

**Competitive Advantages:**

1. **Market Differentiation**
   - First-to-market with integrated AI-driven vendor scoring
   - Unique vendor innovation index that measures supplier contribution to product development
   - Patent-pending risk propagation modeling for multi-tier supply chains

2. **Operational Excellence**
   - 40% reduction in procurement cycle times
   - 30% improvement in contract compliance rates
   - 25% decrease in supply chain disruptions

3. **Financial Impact**
   - 15% cost savings through dynamic pricing optimization
   - 20% reduction in working capital through improved payment terms
   - 10% revenue growth through supplier-enabled innovation

**Long-Term Roadmap:**

**Year 1: Foundation and Core Transformation**
- Launch AI-powered vendor scoring system
- Implement real-time supply chain visibility
- Deploy autonomous contract management
- Achieve 70% automation of routine tasks

**Year 2: Ecosystem Expansion**
- Launch vendor marketplace with 10,000+ suppliers
- Implement blockchain for contract verification
- Introduce predictive cash flow management
- Expand to 5 international markets

**Year 3: Cognitive Enterprise**
- Fully autonomous vendor lifecycle management
- AI-driven negotiation assistant
- Self-optimizing supply chain network
- Integration with IoT devices for real-time monitoring

**Year 4: Industry Leadership**
- Open API platform for third-party extensions
- AI-powered innovation brokerage
- Predictive regulatory compliance
- Global supply chain risk intelligence network

**Implementation Principles:**

1. **Modular Architecture**
   - Microservices design for independent scaling
   - API-first approach for seamless integrations
   - Event-driven architecture for real-time processing

2. **Data-Centric Design**
   - Unified data model across all modules
   - Real-time data synchronization
   - Predictive data quality management

3. **User-Centric Development**
   - Continuous user feedback loops
   - Behavioral analytics-driven improvements
   - Accessibility-first design approach

4. **Security by Design**
   - Zero-trust architecture implementation
   - Continuous security validation
   - Automated compliance monitoring

**Change Management Strategy:**

1. **Leadership Alignment**
   - Executive sponsorship at CPO and CIO levels
   - Cross-functional steering committee
   - Clear KPIs tied to business outcomes

2. **Stakeholder Engagement**
   - Vendor advisory councils
   - Internal change champions network
   - Regular town hall updates

3. **Training and Adoption**
   - Gamified learning platform
   - Contextual in-app guidance
   - Certification programs

4. **Continuous Improvement**
   - Agile release cycles
   - User behavior analytics
   - Quarterly innovation workshops

## Performance Enhancements (300+ lines)

### Redis Caching Layer Implementation

```typescript
// redis-cache.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redisClient: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour default
  private readonly CACHE_PREFIX = 'vms:';
  private readonly MONITOR_INTERVAL = 60000; // 1 minute
  private cacheHits = 0;
  private cacheMisses = 0;
  private lastMonitorTime = performance.now();

  constructor(private configService: ConfigService) {
    this.initializeRedis();
    this.setupMonitoring();
  }

  private initializeRedis(): void {
    try {
      const redisConfig = {
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD', ''),
        db: this.configService.get<number>('REDIS_DB', 0),
        connectTimeout: 5000,
        retryStrategy: (times: number) => {
          return Math.min(times * 100, 5000);
        },
        maxRetriesPerRequest: 3,
      };

      this.redisClient = new Redis(redisConfig);

      this.redisClient.on('connect', () => {
        this.logger.log('Redis client connected successfully');
      });

      this.redisClient.on('error', (error) => {
        this.logger.error(`Redis error: ${error.message}`, error.stack);
      });

      this.redisClient.on('reconnecting', () => {
        this.logger.warn('Redis client reconnecting...');
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis client', error.stack);
      throw error;
    }
  }

  private setupMonitoring(): void {
    setInterval(() => {
      const currentTime = performance.now();
      const duration = (currentTime - this.lastMonitorTime) / 1000;
      const hitRate = this.cacheHits + this.cacheMisses > 0
        ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
        : 0;

      this.logger.log(
        `Cache Performance - Hits: ${this.cacheHits}, Misses: ${this.cacheMisses}, ` +
        `Hit Rate: ${hitRate.toFixed(2)}%, Duration: ${duration.toFixed(2)}s`
      );

      // Reset counters
      this.cacheHits = 0;
      this.cacheMisses = 0;
      this.lastMonitorTime = currentTime;
    }, this.MONITOR_INTERVAL);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.redisClient.ping();
      this.logger.log('Redis connection verified on module init');
    } catch (error) {
      this.logger.error('Redis connection verification failed', error.stack);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redisClient.quit();
      this.logger.log('Redis client disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting Redis client', error.stack);
    }
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(key);
      const data = await this.redisClient.get(cacheKey);

      if (data) {
        this.cacheHits++;
        return JSON.parse(data) as T;
      }

      this.cacheMisses++;
      return null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}`, error.stack);
      this.cacheMisses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      const stringValue = JSON.stringify(value);
      const effectiveTtl = ttl || this.DEFAULT_TTL;

      await this.redisClient.setex(cacheKey, effectiveTtl, stringValue);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}`, error.stack);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      await this.redisClient.del(cacheKey);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}`, error.stack);
      throw error;
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const cachePattern = this.getCacheKey(pattern);
      const keys = await this.redisClient.keys(`${cachePattern}*`);

      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } catch (error) {
      this.logger.error(`Error deleting cache pattern ${pattern}`, error.stack);
      throw error;
    }
  }

  async getWithFallback<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      const cachedData = await this.get<T>(key);

      if (cachedData !== null) {
        return cachedData;
      }

      const freshData = await fallbackFn();
      await this.set(key, freshData, ttl);
      return freshData;
    } catch (error) {
      this.logger.error(`Error in getWithFallback for key ${key}`, error.stack);
      return fallbackFn();
    }
  }

  async cachePipeline<T>(
    operations: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void> {
    try {
      const pipeline = this.redisClient.pipeline();

      operations.forEach(op => {
        const cacheKey = this.getCacheKey(op.key);
        const stringValue = JSON.stringify(op.value);
        pipeline.setex(cacheKey, op.ttl || this.DEFAULT_TTL, stringValue);
      });

      await pipeline.exec();
    } catch (error) {
      this.logger.error('Error in cache pipeline', error.stack);
      throw error;
    }
  }

  async getCacheStats(): Promise<{
    keys: number;
    memory: string;
    hitRate: number;
  }> {
    try {
      const [keys, memoryInfo] = await Promise.all([
        this.redisClient.dbsize(),
        this.redisClient.info('memory'),
      ]);

      const usedMemory = memoryInfo.split('\n')
        .find(line => line.startsWith('used_memory:'))
        ?.split(':')[1] || '0';

      const hitRate = this.cacheHits + this.cacheMisses > 0
        ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
        : 0;

      return {
        keys: Number(keys),
        memory: `${(Number(usedMemory) / (1024 * 1024)).toFixed(2)} MB`,
        hitRate: Number(hitRate.toFixed(2)),
      };
    } catch (error) {
      this.logger.error('Error getting cache stats', error.stack);
      throw error;
    }
  }
}
```

### Database Query Optimization

```typescript
// vendor.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Vendor } from './vendor.entity';
import { VendorPerformance } from '../performance/vendor-performance.entity';
import { VendorContract } from '../contracts/vendor-contract.entity';
import { VendorRisk } from '../risk/vendor-risk.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { VendorFilterDto } from './dto/vendor-filter.dto';
import { RedisCacheService } from '../../cache/redis-cache.service';
import { performance } from 'perf_hooks';

@Injectable()
export class VendorRepository {
  private readonly logger = new Logger(VendorRepository.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    @InjectRepository(VendorPerformance)
    private readonly performanceRepository: Repository<VendorPerformance>,
    @InjectRepository(VendorContract)
    private readonly contractRepository: Repository<VendorContract>,
    @InjectRepository(VendorRisk)
    private readonly riskRepository: Repository<VendorRisk>,
    private readonly cacheService: RedisCacheService,
  ) {}

  private getCacheKey(filter: VendorFilterDto, pagination: PaginationDto): string {
    const { page, limit, sortBy, sortOrder } = pagination;
    const { status, category, minRating, riskLevel, contractType } = filter;

    return `vendors:${status}:${category}:${minRating}:${riskLevel}:${contractType}:` +
           `${page}:${limit}:${sortBy}:${sortOrder}`;
  }

  async findAllWithFilters(
    filterDto: VendorFilterDto,
    paginationDto: PaginationDto,
  ): Promise<{ data: Vendor[]; total: number }> {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey(filterDto, paginationDto);

    try {
      // Try to get from cache first
      const cachedResult = await this.cacheService.get<{ data: Vendor[]; total: number }>(cacheKey);
      if (cachedResult) {
        this.logger.debug(`Cache hit for vendors with filters`);
        return cachedResult;
      }

      const queryBuilder = this.createBaseQueryBuilder();

      // Apply filters
      this.applyFilters(queryBuilder, filterDto);

      // Get total count for pagination
      const total = await queryBuilder.getCount();

      // Apply pagination and sorting
      this.applyPagination(queryBuilder, paginationDto);

      // Execute query
      const data = await queryBuilder.getMany();

      // Cache the result
      await this.cacheService.set(cacheKey, { data, total }, this.CACHE_TTL);

      const duration = performance.now() - startTime;
      this.logger.log(`Vendor query executed in ${duration.toFixed(2)}ms`);

      return { data, total };
    } catch (error) {
      this.logger.error('Error in findAllWithFilters', error.stack);
      throw error;
    }
  }

  private createBaseQueryBuilder(): SelectQueryBuilder<Vendor> {
    return this.vendorRepository
      .createQueryBuilder('vendor')
      .leftJoinAndSelect('vendor.performance', 'performance')
      .leftJoinAndSelect('vendor.contracts', 'contracts')
      .leftJoinAndSelect('vendor.risks', 'risks')
      .leftJoinAndSelect('vendor.categories', 'categories')
      .leftJoinAndSelect('vendor.locations', 'locations')
      .leftJoinAndSelect('vendor.compliance', 'compliance')
      .leftJoinAndSelect('vendor.certifications', 'certifications')
      .select([
        'vendor.id',
        'vendor.name',
        'vendor.status',
        'vendor.createdAt',
        'vendor.updatedAt',
        'vendor.onboardingDate',
        'vendor.primaryContact',
        'vendor.primaryEmail',
        'vendor.primaryPhone',
        'performance.overallScore',
        'performance.deliveryScore',
        'performance.qualityScore',
        'performance.costScore',
        'performance.innovationScore',
        'contracts.id',
        'contracts.type',
        'contracts.startDate',
        'contracts.endDate',
        'contracts.status',
        'contracts.value',
        'risks.id',
        'risks.type',
        'risks.level',
        'risks.status',
        'risks.lastAssessmentDate',
        'categories.id',
        'categories.name',
        'locations.id',
        'locations.country',
        'locations.region',
        'compliance.id',
        'compliance.type',
        'compliance.status',
        'compliance.nextReviewDate',
        'certifications.id',
        'certifications.name',
        'certifications.issuer',
        'certifications.expiryDate',
      ]);
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Vendor>,
    filterDto: VendorFilterDto,
  ): void {
    const { status, category, minRating, riskLevel, contractType, search } = filterDto;

    if (status) {
      queryBuilder.andWhere('vendor.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere('categories.id = :categoryId', { categoryId: category });
    }

    if (minRating) {
      queryBuilder.andWhere('performance.overallScore >= :minRating', { minRating });
    }

    if (riskLevel) {
      queryBuilder.andWhere('risks.level = :riskLevel', { riskLevel });
    }

    if (contractType) {
      queryBuilder.andWhere('contracts.type = :contractType', { contractType });
    }

    if (search) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('vendor.name ILIKE :search', { search: `%${search}%` })
            .orWhere('vendor.primaryContact ILIKE :search', { search: `%${search}%` })
            .orWhere('vendor.primaryEmail ILIKE :search', { search: `%${search}%` })
            .orWhere('categories.name ILIKE :search', { search: `%${search}%` });
        }),
      );
    }
  }

  private applyPagination(
    queryBuilder: SelectQueryBuilder<Vendor>,
    paginationDto: PaginationDto,
  ): void {
    const { page, limit, sortBy, sortOrder } = paginationDto;

    // Default sorting if not provided
    const effectiveSortBy = sortBy || 'vendor.name';
    const effectiveSortOrder = sortOrder || 'ASC';

    queryBuilder
      .orderBy(effectiveSortBy, effectiveSortOrder as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
  }

  async findVendorWithRelations(vendorId: string): Promise<Vendor | null> {
    const cacheKey = `vendor:${vendorId}:full`;

    try {
      const cachedVendor = await this.cacheService.get<Vendor>(cacheKey);
      if (cachedVendor) {
        return cachedVendor;
      }

      const vendor = await this.vendorRepository.findOne({
        where: { id: vendorId },
        relations: [
          'performance',
          'contracts',
          'risks',
          'categories',
          'locations',
          'compliance',
          'certifications',
          'invoices',
          'purchaseOrders',
          'tickets',
          'documents',
        ],
      });

      if (vendor) {
        await this.cacheService.set(cacheKey, vendor, this.CACHE_TTL * 2); // Longer cache for full vendor
      }

      return vendor;
    } catch (error) {
      this.logger.error(`Error finding vendor with relations ${vendorId}`, error.stack);
      throw error;
    }
  }

  async getVendorPerformanceTrend(vendorId: string, months: number = 12): Promise<any> {
    const cacheKey = `vendor:${vendorId}:performance-trend:${months}`;

    try {
      const cachedTrend = await this.cacheService.get<any>(cacheKey);
      if (cachedTrend) {
        return cachedTrend;
      }

      const query = this.performanceRepository
        .createQueryBuilder('performance')
        .where('performance.vendorId = :vendorId', { vendorId })
        .andWhere('performance.createdAt >= :date', {
          date: new Date(new Date().setMonth(new Date().getMonth() - months)),
        })
        .orderBy('performance.createdAt', 'ASC')
        .select([
          'performance.createdAt',
          'performance.overallScore',
          'performance.deliveryScore',
          'performance.qualityScore',
          'performance.costScore',
          'performance.innovationScore',
        ]);

      const results = await query.getMany();

      const trendData = results.map(perf => ({
        date: perf.createdAt,
        overall: perf.overallScore,
        delivery: perf.deliveryScore,
        quality: perf.qualityScore,
        cost: perf.costScore,
        innovation: perf.innovationScore,
      }));

      await this.cacheService.set(cacheKey, trendData, this.CACHE_TTL);

      return trendData;
    } catch (error) {
      this.logger.error(`Error getting performance trend for vendor ${vendorId}`, error.stack);
      throw error;
    }
  }

  async getVendorRiskProfile(vendorId: string): Promise<any> {
    const cacheKey = `vendor:${vendorId}:risk-profile`;

    try {
      const cachedProfile = await this.cacheService.get<any>(cacheKey);
      if (cachedProfile) {
        return cachedProfile;
      }

      const [activeRisks, historicalRisks, riskDistribution] = await Promise.all([
        this.riskRepository.count({
          where: {
            vendorId,
            status: 'Active',
          },
        }),
        this.riskRepository.count({
          where: {
            vendorId,
            status: 'Resolved',
          },
        }),
        this.riskRepository
          .createQueryBuilder('risk')
          .where('risk.vendorId = :vendorId', { vendorId })
          .select('risk.level', 'level')
          .addSelect('COUNT(*)', 'count')
          .groupBy('risk.level')
          .getRawMany(),
      ]);

      const profile = {
        activeRisks,
        historicalRisks,
        riskDistribution: riskDistribution.reduce((acc, curr) => {
          acc[curr.level] = parseInt(curr.count, 10);
          return acc;
        }, {} as Record<string, number>),
      };

      await this.cacheService.set(cacheKey, profile, this.CACHE_TTL);

      return profile;
    } catch (error) {
      this.logger.error(`Error getting risk profile for vendor ${vendorId}`, error.stack);
      throw error;
    }
  }

  async batchUpdateVendorStatus(vendorIds: string[], status: string): Promise<void> {
    try {
      await this.vendorRepository
        .createQueryBuilder()
        .update(Vendor)
        .set({ status })
        .where('id IN (:...vendorIds)', { vendorIds })
        .execute();

      // Invalidate cache for all affected vendors
      const cacheKeys = vendorIds.map(id => `vendor:${id}:*`);
      await Promise.all(cacheKeys.map(key => this.cacheService.deletePattern(key)));
    } catch (error) {
      this.logger.error(`Error in batch update vendor status`, error.stack);
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
import { performance } from 'perf_hooks';
import { Logger } from '@nestjs/common';

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ResponseCompressionMiddleware.name);
  private readonly compressionMiddleware: ReturnType<typeof compression>;

  constructor() {
    this.compressionMiddleware = compression({
      level: 6, // Optimal balance between compression ratio and CPU usage
      threshold: 1024, // Only compress responses larger than 1KB
      filter: (req: Request, res: Response) => {
        // Don't compress responses that are already compressed
        if (res.getHeader('Content-Encoding')) {
          return false;
        }

        // Don't compress binary data or already compressed formats
        const contentType = res.getHeader('Content-Type') as string;
        if (contentType) {
          const excludedTypes = [
            'image/',
            'video/',
            'audio/',
            'application/pdf',
            'application/zip',
            'application/gzip',
            'application/octet-stream',
          ];

          return !excludedTypes.some(type => contentType.includes(type));
        }

        return true;
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = performance.now();

    // Wrap the response.end method to measure compression performance
    const originalEnd = res.end;
    res.end = ((chunk: any, encoding: any, callback: any) => {
      const duration = performance.now() - startTime;
      const contentLength = res.getHeader('Content-Length') || (chunk ? chunk.length : 0);
      const compressedLength = res.getHeader('X-Compressed-Length') || contentLength;

      if (contentLength > 0) {
        const ratio = compressedLength > 0
          ? (1 - (compressedLength / contentLength)) * 100
          : 0;

        this.logger.debug(
          `Compression - Original: ${contentLength} bytes, ` +
          `Compressed: ${compressedLength} bytes, ` +
          `Ratio: ${ratio.toFixed(2)}%, ` +
          `Time: ${duration.toFixed(2)}ms`
        );
      }

      return originalEnd.call(res, chunk, encoding, callback);
    }) as any;

    // Apply the compression middleware
    this.compressionMiddleware(req, res, next);
  }
}

// response-compression.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ResponseCompressionMiddleware } from './response-compression.middleware';
import { APP_FILTER } from '@nestjs/core';
import { CompressionExceptionFilter } from './compression-exception.filter';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: CompressionExceptionFilter,
    },
  ],
})
export class ResponseCompressionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ResponseCompressionMiddleware)
      .forRoutes('*');
  }
}

// compression-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { Logger } from '@nestjs/common';

@Catch()
export class CompressionExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CompressionExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Ensure we don't try to compress error responses
      response.removeHeader('Content-Encoding');

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: ctx.getRequest().url,
        message: typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || 'Internal server error',
      });
    } else {
      this.logger.error('Unexpected error during compression', (exception as Error).stack);
      response.status(500).json({
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: ctx.getRequest().url,
        message: 'Internal server error',
      });
    }
  }
}
```

### Lazy Loading Implementation

```typescript
// lazy-load.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { LAZY_LOAD_METADATA } from './lazy-load.constants';

export function LazyLoad(threshold: number = 500): MethodDecorator {
  return applyDecorators(
    SetMetadata(LAZY_LOAD_METADATA, { threshold }),
  );
}

// lazy-load.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, delay, switchMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LAZY_LOAD_METADATA } from './lazy-load.constants';
import { performance } from 'perf_hooks';
import { Logger } from '@nestjs/common';

@Injectable()
export class LazyLoadInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LazyLoadInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const lazyLoadConfig = this.reflector.get<{ threshold: number }>(
      LAZY_LOAD_METADATA,
      context.getHandler(),
    );

    if (!lazyLoadConfig) {
      return next.handle();
    }

    const { threshold } = lazyLoadConfig;
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Check if client supports lazy loading
    const supportsLazyLoad = request.headers['x-lazy-load'] === 'true';
    const isMobile = request.headers['user-agent']?.includes('Mobile') || false;

    if (!supportsLazyLoad && !isMobile) {
      return next.handle();
    }

    const startTime = performance.now();

    return next.handle().pipe(
      switchMap(data => {
        const duration = performance.now() - startTime;

        // If response is fast enough, return immediately
        if (duration < threshold) {
          return of(data);
        }

        // For slow responses, implement lazy loading
        return this.implementLazyLoading(data, response, threshold);
      }),
      tap(() => {
        const duration = performance.now() - startTime;
        this.logger.debug(`Lazy loading applied in ${duration.toFixed(2)}ms`);
      }),
    );
  }

  private implementLazyLoading(data: any, response: any, threshold: number): Observable<any> {
    // Create a placeholder response
    const placeholder = this.createPlaceholderResponse(data);

    // Send placeholder immediately
    response.status(202).json(placeholder);

    // Simulate delayed full response
    return of(data).pipe(
      delay(threshold),
      tap(fullData => {
        // In a real implementation, we would use Server-Sent Events or WebSockets
        // to push the full data when ready. For this example, we'll just log.
        this.logger.debug('Full data ready for lazy loading');
      }),
    );
  }

  private createPlaceholderResponse(data: any): any {
    if (Array.isArray(data)) {
      return {
        _placeholder: true,
        count: data.length,
        sample: data.slice(0, 3).map(item => this.simplifyItem(item)),
        estimatedSize: this.estimateSize(data),
        _links: {
          full: {
            href: '/api/lazy-load/full-response',
            method: 'GET',
          },
        },
      };
    }

    return {
      _placeholder: true,
      ...this.simplifyItem(data),
      _links: {
        full: {
          href: '/api/lazy-load/full-response',
          method: 'GET',
        },
      },
    };
  }

  private simplifyItem(item: any): any {
    if (!item) return item;

    const simplified: any = {};

    // Copy primitive properties
    Object.keys(item).forEach(key => {
      if (typeof item[key] !== 'object' || item[key] === null) {
        simplified[key] = item[key];
      } else if (Array.isArray(item[key])) {
        simplified[key] = item[key].length;
      } else {
        simplified[key] = '[complex object]';
      }
    });

    return simplified;
  }

  private estimateSize(data: any): string {
    try {
      const size = JSON.stringify(data).length;
      if (size < 1024) return `${size} bytes`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } catch {
      return 'unknown';
    }
  }
}

// lazy-load.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LazyLoadInterceptor } from './lazy-load.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LazyLoadInterceptor,
    },
  ],
})
export class LazyLoadModule {}

// vendor.controller.ts (example usage)
import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { LazyLoad } from '../../common/decorators/lazy-load.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { VendorFilterDto } from './dto/vendor-filter.dto';

@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get()
  @LazyLoad(300) // Apply lazy loading with 300ms threshold
  async findAll(
    @Query() filterDto: VendorFilterDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.vendorService.findAll(filterDto, paginationDto);
  }

  @Get('performance')
  @LazyLoad(500) // Higher threshold for performance data
  async getPerformanceData(
    @Query('vendorId') vendorId: string,
    @Query('months') months: number = 12,
  ) {
    return this.vendorService.getPerformanceTrend(vendorId, months);
  }
}
```

### Request Debouncing

```typescript
// debounce.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { Logger } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class DebounceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DebounceMiddleware.name);
  private readonly DEBOUNCE_WINDOW = 500; // 500ms debounce window
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly requestCache = new Map<string, {
    timestamp: number;
    response: any;
    status: number;
  }>();

  use(req: Request, res: Response, next: NextFunction): void {
    // Skip debouncing for non-GET requests or specific endpoints
    if (req.method !== 'GET' || this.isExcludedPath(req.path)) {
      return next();
    }

    const cacheKey = this.generateCacheKey(req);

    // Check if we have a recent cached response
    const cached = this.requestCache.get(cacheKey);
    if (cached && performance.now() - cached.timestamp < this.DEBOUNCE_WINDOW) {
      this.logger.debug(`Serving debounced response for ${req.path}`);
      res.status(cached.status).json(cached.response);
      return;
    }

    // Wrap the response methods to cache the response
    const originalJson = res.json;
    const originalStatus = res.status;

    res.json = (body: any) => {
      // Cache the response
      this.requestCache.set(cacheKey, {
        timestamp: performance.now(),
        response: body,
        status: res.statusCode,
      });

      // Clean up old cache entries
      if (this.requestCache.size > this.MAX_CACHE_SIZE) {
        const oldestKey = this.requestCache.keys().next().value;
        this.requestCache.delete(oldestKey);
      }

      return originalJson.call(res, body);
    };

    res.status = (statusCode: number) => {
      res.statusCode = statusCode;
      return res;
    };

    next();
  }

  private generateCacheKey(req: Request): string {
    // Create a unique key based on method, path, and query parameters
    const queryString = Object.keys(req.query)
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');

    const keyString = `${req.method}:${req.path}:${queryString}`;
    return createHash('sha256').update(keyString).digest('hex');
  }

  private isExcludedPath(path: string): boolean {
    const excludedPaths = [
      '/api/auth',
      '/api/webhooks',
      '/api/health',
      '/api/lazy-load',
    ];

    return excludedPaths.some(excluded => path.startsWith(excluded));
  }

  // Method to clear cache (useful for testing or cache invalidation)
  clearCache(): void {
    this.requestCache.clear();
    this.logger.log('Debounce cache cleared');
  }
}

// debounce.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { DebounceMiddleware } from './debounce.middleware';

@Module({})
export class DebounceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DebounceMiddleware)
      .forRoutes('*');
  }
}
```

### Connection Pooling

```typescript
// database.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { Logger } from '@nestjs/common';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'vendor_management'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false, // Always false in production
        logging: configService.get<string>('NODE_ENV') === 'development',
        logger: 'advanced-console',
        maxQueryExecutionTime: 1000, // Log slow queries
        extra: {
          // Connection pool settings
          max: configService.get<number>('DB_POOL_MAX', 20), // Maximum number of connections
          min: configService.get<number>('DB_POOL_MIN', 2), // Minimum number of connections
          idleTimeoutMillis: configService.get<number>('DB_POOL_IDLE_TIMEOUT', 30000), // 30 seconds
          connectionTimeoutMillis: configService.get<number>('DB_POOL_CONNECTION_TIMEOUT', 5000), // 5 seconds
          maxUses: configService.get<number>('DB_POOL_MAX_USES', 7500), // Max uses per connection
          application_name: 'VendorManagementSystem',
        },
        ssl: configService.get<boolean>('DB_SSL', false)
          ? {
              rejectUnauthorized: configService.get<boolean>('DB_SSL_REJECT_UNAUTHORIZED', true),
              ca: configService.get<string>('DB_SSL_CA'),
              key: configService.get<string>('DB_SSL_KEY'),
              cert: configService.get<string>('DB_SSL_CERT'),
            }
          : false,
      }),
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }

        const dataSource = new DataSource(options);
        await dataSource.initialize();

        // Add transactional data source
        addTransactionalDataSource(dataSource);

        // Monitor connection pool
        setInterval(() => {
          const pool = dataSource.driver.pool;
          if (pool) {
            const logger = new Logger('DatabasePool');
            logger.debug(
              `Pool Stats - Total: ${pool.totalCount}, ` +
              `Idle: ${pool.idleCount}, ` +
              `Waiting: ${pool.waitingCount}`
            );
          }
        }, 60000); // Every minute

        return dataSource;
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

// transactional.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { TRANSACTIONAL_OPTIONS } from './transactional.constants';

export interface TransactionalOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  propagation?: 'REQUIRED' | 'REQUIRES_NEW' | 'NESTED' | 'SUPPORTS' | 'NOT_SUPPORTED' | 'NEVER';
  timeout?: number;
}

export function Transactional(options?: TransactionalOptions): MethodDecorator {
  return SetMetadata(TRANSACTIONAL_OPTIONS, options || {});
}

// transactional.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { TRANSACTIONAL_OPTIONS } from './transactional.constants';
import { DataSource } from 'typeorm';
import { Transactional as TypeOrmTransactional } from 'typeorm-transactional';

@Injectable()
export class TransactionalInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<TransactionalOptions>(
      TRANSACTIONAL_OPTIONS,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        // The actual transaction handling is done by typeorm-transactional
        // This interceptor just ensures the decorator is processed
      }),
    );
  }
}

// transactional.module.ts
import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransactionalInterceptor } from './transactional.interceptor';

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransactionalInterceptor,
    },
  ],
})
export class TransactionalModule {}

// vendor.service.ts (example usage)
import { Injectable, Logger } from '@nestjs/common';
import { VendorRepository } from './vendor.repository';
import { Vendor } from './vendor.entity';
import { Transactional } from '../../common/decorators/transactional.decorator';
import { VendorFilterDto } from './dto/vendor-filter.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  constructor(private readonly vendorRepository: VendorRepository) {}

  @Transactional({ isolationLevel: 'REPEATABLE READ' })
  async createVendor(vendorData: Partial<Vendor>): Promise<Vendor> {
    try {
      const vendor = this.vendorRepository.create(vendorData);
      return await this.vendorRepository.save(vendor);
    } catch (error) {
      this.logger.error('Error creating vendor', error.stack);
      throw error;
    }
  }

  async findAll(
    filterDto: VendorFilterDto,
    paginationDto: PaginationDto,
  ): Promise<{ data: Vendor[]; total: number }> {
    try {
      return await this.vendorRepository.findAllWithFilters(filterDto, paginationDto);
    } catch (error) {
      this.logger.error('Error finding vendors', error.stack);
      throw error;
    }
  }

  @Transactional()
  async updateVendorStatus(vendorId: string, status: string): Promise<Vendor> {
    try {
      const vendor = await this.vendorRepository.findOne({ where: { id: vendorId } });
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      vendor.status = status;
      return await this.vendorRepository.save(vendor);
    } catch (error) {
      this.logger.error(`Error updating vendor status ${vendorId}`, error.stack);
      throw error;
    }
  }

  @Transactional({ propagation: 'REQUIRES_NEW' })
  async batchUpdateVendorStatuses(vendorIds: string[], status: string): Promise<void> {
    try {
      await this.vendorRepository.batchUpdateVendorStatus(vendorIds, status);
    } catch (error) {
      this.logger.error('Error in batch update vendor statuses', error.stack);
      throw error;
    }
  }
}
```

## Real-Time Features (300+ lines)

### WebSocket Server Setup

```typescript
// websocket.module.ts
import { Module, Global } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { VendorModule } from '../vendor/vendor.module';
import { ContractModule } from '../contracts/contract.module';
import { RiskModule } from '../risk/risk.module';
import { NotificationModule } from '../notification/notification.module';

@Global()
@Module({
  imports: [VendorModule, ContractModule, RiskModule, NotificationModule],
  providers: [WebSocketGateway, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}

// websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { performance } from 'perf_hooks';

@WebSocketGateway({
  cors: {
    origin: '*', // Should be configured properly in production
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 5000,
})
export class WebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly connectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    messagesReceived: 0,
    messagesSent: 0,
    lastMetricsTime: performance.now(),
  };

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.setupMetrics();
    this.webSocketService.setServer(server);
  }

  async handleConnection(client: Socket) {
    this.connectionMetrics.totalConnections++;
    this.connectionMetrics.activeConnections++;

    try {
      // Authenticate the connection
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.authService.validateUser(payload);
      if (!user) {
        this.logger.warn(`Invalid token for client ${client.id}`);
        client.disconnect(true);
        return;
      }

      // Store user information in the socket
      client.data.user = user;

      // Join user-specific room
      client.join(`user:${user.id}`);

      // Join role-based rooms
      if (user.roles) {
        user.roles.forEach(role => {
          client.join(`role:${role}`);
        });
      }

      this.logger.log(`Client ${client.id} connected for user ${user.id}`);
      this.webSocketService.handleConnection(client);

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to Vendor Management System',
        timestamp: new Date().toISOString(),
        userId: user.id,
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}`, error.stack);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectionMetrics.activeConnections--;
    this.logger.log(`Client ${client.id} disconnected`);

    if (client.data.user) {
      this.webSocketService.handleDisconnection(client);
    }
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

  private setupMetrics() {
    setInterval(() => {
      const now = performance.now();
      const duration = (now - this.connectionMetrics.lastMetricsTime) / 1000;

      this.logger.log(
        `WebSocket Metrics - Active: ${this.connectionMetrics.activeConnections}, ` +
        `Total: ${this.connectionMetrics.totalConnections}, ` +
        `Msgs Rx: ${this.connectionMetrics.messagesReceived}, ` +
        `Msgs Tx: ${this.connectionMetrics.messagesSent}, ` +
        `Duration: ${duration.toFixed(2)}s`
      );

      // Reset counters
      this.connectionMetrics.messagesReceived = 0;
      this.connectionMetrics.messagesSent = 0;
      this.connectionMetrics.lastMetricsTime = now;
    }, 60000); // Every minute
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      latency: performance.now() - client.data.lastPingTime,
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { rooms: string[] }): void {
    if (!payload.rooms || !Array.isArray(payload.rooms)) {
      client.emit('error', { message: 'Invalid subscription request' });
      return;
    }

    payload.rooms.forEach(room => {
      client.join(room);
    });

    client.emit('subscribed', {
      rooms: payload.rooms,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { rooms: string[] }): void {
    if (!payload.rooms || !Array.isArray(payload.rooms)) {
      client.emit('error', { message: 'Invalid unsubscription request' });
      return;
    }

    payload.rooms.forEach(room => {
      client.leave(room);
    });

    client.emit('unsubscribed', {
      rooms: payload.rooms,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Real-Time Event Handlers

```typescript
// websocket.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { VendorService } from '../vendor/vendor.service';
import { ContractService } from '../contracts/contract.service';
import { RiskService } from '../risk/risk.service';
import { NotificationService } from '../notification/notification.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { performance } from 'perf_hooks';

@Injectable()
export class WebSocketService {
  private server: Server;
  private readonly logger = new Logger(WebSocketService.name);
  private readonly eventHandlers: Record<string, (data: any) => Promise<void>> = {};

  constructor(
    private readonly vendorService: VendorService,
    private readonly contractService: ContractService,
    private readonly riskService: RiskService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.initializeEventHandlers();
    this.setupEventListeners();
  }

  setServer(server: Server) {
    this.server = server;
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
    client.data.lastActivity = performance.now();
  }

  handleDisconnection(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  private initializeEventHandlers() {
    // Vendor events
    this.eventHandlers['vendor.created'] = this.handleVendorCreated.bind(this);
    this.eventHandlers['vendor.updated'] = this.handleVendorUpdated.bind(this);
    this.eventHandlers['vendor.status.changed'] = this.handleVendorStatusChanged.bind(this);
    this.eventHandlers['vendor.performance.updated'] = this.handleVendorPerformanceUpdated.bind(this);

    // Contract events
    this.eventHandlers['contract.created'] = this.handleContractCreated.bind(this);
    this.eventHandlers['contract.updated'] = this.handleContractUpdated.bind(this);
    this.eventHandlers['contract.status.changed'] = this.handleContractStatusChanged.bind(this);
    this.eventHandlers['contract.renewal.due'] = this.handleContractRenewalDue.bind(this);

    // Risk events
    this.eventHandlers['risk.created'] = this.handleRiskCreated.bind(this);
    this.eventHandlers['risk.updated'] = this.handleRiskUpdated.bind(this);
    this.eventHandlers['risk.status.changed'] = this.handleRiskStatusChanged.bind(this);

    // Notification events
    this.eventHandlers['notification.created'] = this.handleNotificationCreated.bind(this);
  }

  private setupEventListeners() {
    Object.keys(this.eventHandlers).forEach(event => {
      this.eventEmitter.on(event, async (data) => {
        try {
          await this.eventHandlers[event](data);
        } catch (error) {
          this.logger.error(`Error handling event ${event}`, error.stack);
        }
      });
    });
  }

  private async handleVendorCreated(data: any) {
    this.logger.debug(`Handling vendor.created event for vendor ${data.id}`);

    // Broadcast to all clients in the vendor's category rooms
    if (data.categories) {
      data.categories.forEach((category: { id: string }) => {
        this.server.to(`category:${category.id}`).emit('vendor.created', data);
      });
    }

    // Notify admins
    this.server.to('role:admin').emit('vendor.created', data);

    // Create notification
    await this.notificationService.createNotification({
      type: 'vendor_created',
      title: 'New Vendor Created',
      message: `Vendor ${data.name} has been created`,
      data: { vendorId: data.id },
      recipients: ['role:admin'],
    });
  }

  private async handleVendorUpdated(data: any) {
    this.logger.debug(`Handling vendor.updated event for vendor ${data.id}`);

    // Broadcast to all clients viewing this vendor
    this.server.to(`vendor:${data.id}`).emit('vendor.updated', data);

    // If performance score changed significantly, notify relevant parties
    if (data.performanceChanges && Math.abs(data.performanceChanges.overallScore) >= 10) {
      const direction = data.performanceChanges.overallScore > 0 ? 'improved' : 'declined';
      await this.notificationService.createNotification({
        type: 'vendor_performance_changed',
        title: `Vendor Performance ${direction}`,
        message: `Vendor ${data.name} performance has ${direction} significantly`,
        data: { vendorId: data.id, change: data.performanceChanges.overallScore },
        recipients: ['role:procurement', 'role:vendor_manager'],
      });
    }
  }

  private async handleVendorStatusChanged(data: any) {
    this.logger.debug(`Handling vendor.status.changed event for vendor ${data.id}`);

    // Broadcast to all clients in the vendor's rooms
    this.server.to(`vendor:${data.id}`).emit('vendor.status.changed', data);

    // Notify the vendor if they're connected
    this.server.to(`user:${data.vendorContactId}`).emit('vendor.status.changed', data);

    // Create notification
    await this.notificationService.createNotification({
      type: 'vendor_status_changed',
      title: 'Vendor Status Changed',
      message: `Vendor ${data.name} status changed to ${data.newStatus}`,
      data: { vendorId: data.id, oldStatus: data.oldStatus, newStatus: data.newStatus },
      recipients: ['role:procurement', 'role:vendor_manager'],
    });
  }

  private async handleVendorPerformanceUpdated(data: any) {
    this.logger.debug(`Handling vendor.performance.updated event for vendor ${data.vendorId}`);

    // Broadcast to all clients viewing this vendor
    this.server.to(`vendor:${data.vendorId}`).emit('vendor.performance.updated', data);

    // Check for performance alerts
    if (data.overallScore < 50) {
      await this.notificationService.createNotification({
        type: 'vendor_performance_alert',
        title: 'Vendor Performance Alert',
        message: `Vendor ${data.vendorName} performance score dropped below 50`,
        data: { vendorId: data.vendorId, score: data.overallScore },
        recipients: ['role:procurement', 'role:vendor_manager'],
      });
    }
  }

  private async handleContractCreated(data: any) {
    this.logger.debug(`Handling contract.created event for contract ${data.id}`);

    // Broadcast to all clients in the vendor's room
    this.server.to(`vendor:${data.vendorId}`).emit('contract.created', data);

    // Notify the vendor
    this.server.to(`user:${data.vendorContactId}`).emit('contract.created', data);

    // Create notification
    await this.notificationService.createNotification({
      type: 'contract_created',
      title: 'New Contract Created',
      message: `Contract ${data.name} has been created with vendor ${data.vendorName}`,
      data: { contractId: data.id, vendorId: data.vendorId },
      recipients: ['role:legal', 'role:procurement'],
    });
  }

  private async handleContractUpdated(data: any) {
    this.logger.debug(`Handling contract.updated event for contract ${data.id}`);

    // Broadcast to all clients in the vendor's room
    this.server.to(`vendor:${data.vendorId}`).emit('contract.updated', data);

    // If status changed, handle separately
    if (data.statusChanged) {
      await this.handleContractStatusChanged(data);
    }
  }

  private async handleContractStatusChanged(data: any) {
    this.logger.debug(`Handling contract.status.changed event for contract ${data.id}`);

    // Broadcast to all clients in the vendor's room
    this.server.to(`vendor:${data.vendorId}`).emit('contract.status.changed', data);

    // Notify relevant parties
    const notificationRecipients = ['role:legal', 'role:procurement'];
    if (data.newStatus === 'Active') {
      notificationRecipients.push(`user:${data.vendorContactId}`);
    }

    await this.notificationService.createNotification({
      type: 'contract_status_changed',
      title: 'Contract Status Changed',
      message: `Contract ${data.name} status changed from ${data.oldStatus} to ${data.newStatus}`,
      data: {
        contractId: data.id,
        vendorId: data.vendorId,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
      },
      recipients: notificationRecipients,
    });
  }

  private async handleContractRenewalDue(data: any) {
    this.logger.debug(`Handling contract.renewal.due event for contract ${data.id}`);

    // Broadcast to all clients in the vendor's room
    this.server.to(`vendor:${data.vendorId}`).emit('contract.renewal.due', data);

    // Create notification
    await this.notificationService.createNotification({
      type: 'contract_renewal_due',
      title: 'Contract Renewal Due',
      message: `Contract ${data.name} with ${data.vendorName} is due for renewal on ${data.renewalDate}`,
      data: {
        contractId: data.id,
        vendorId: data.vendorId,
        renewalDate: data.renewalDate,
        daysRemaining: data.daysRemaining,
      },
      recipients: ['role:legal', 'role:procurement'],
    });
  }

  private async handleRiskCreated(data: any) {
    this.logger.debug(`Handling risk.created event for risk ${data.id}`);

    // Broadcast to all clients in the vendor's room
    this.server.to(`vendor:${data.vendorId}`).emit('risk.created', data);

    // Create notification based on risk level
    const notificationRecipients = ['role:risk_manager'];
    if (data.level === 'High' || data.level === 'Critical') {
      notificationRecipients.push('role:procurement', 'role:executive');
    }

    await this.notificationService.createNotification({
      type: 'risk_created',
      title: 'New Risk Identified',
      message: `New ${data.level} risk identified for vendor ${data.vendorName}: ${data.description}`,
      data: { riskId: data.id, vendorId: data.vendorId, level: data.level },
      recipients: notificationRecipients,
    });
  }

  private async handleRiskUpdated(data: any) {
    this.logger.debug(`Handling risk.updated event for risk ${data.id}`);

    // Broadcast to all clients in the vendor's room
    this.server.to(`vendor:${data.vendorId}`).emit('risk.updated', data);

    // If status changed, handle separately
    if (data.statusChanged) {
      await this.handleRiskStatusChanged(data);
    }
  }

  private async handleRiskStatusChanged(data: any) {
    this.logger.debug(`Handling risk.status.changed event for risk ${data.id}`);

    // Broadcast to all clients in the vendor's room
    this.server.to(`vendor:${data.vendorId}`).emit('risk.status.changed', data);

    // Create notification
    const notificationRecipients = ['role:risk_manager'];
    if (data.newStatus === 'Resolved') {
      notificationRecipients.push('role:procurement');
    }

    await this.notificationService.createNotification({
      type: 'risk_status_changed',
      title: 'Risk Status Changed',
      message: `Risk for vendor ${data.vendorName} changed from ${data.oldStatus} to ${data.newStatus}`,
      data: {
        riskId: data.id,
        vendorId: data.vendorId,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
      },
      recipients: notificationRecipients,
    });
  }

  private async handleNotificationCreated(data: any) {
    this.logger.debug(`Handling notification.created event for notification ${data.id}`);

    // Send to individual users
    if (data.recipientIds) {
      data.recipientIds.forEach((userId: string) => {
        this.server.to(`user:${userId}`).emit('notification.created', data);
      });
    }

    // Send to role-based rooms
    if (data.recipientRoles) {
      data.recipientRoles.forEach((role: string) => {
        this.server.to(`role:${role}`).emit('notification.created', data);
      });
    }
  }

  async broadcastToRoom(room: string, event: string, data: any): Promise<void> {
    try {
      this.server.to(room).emit(event, data);
      this.logger.debug(`Broadcasted ${event} to room ${room}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to room ${room}`, error.stack);
      throw error;
    }
  }

  async broadcastToUser(userId: string, event: string, data: any): Promise<void> {
    try {
      this.server.to(`user:${userId}`).emit(event, data);
      this.logger.debug(`Broadcasted ${event} to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to user ${userId}`, error.stack);
      throw error;
    }
  }

  async broadcastToRole(role: string, event: string, data: any): Promise<void> {
    try {
      this.server.to(`role:${role}`).emit(event, data);
      this.logger.debug(`Broadcasted ${event} to role ${role}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to role ${role}`, error.stack);
      throw error;
    }
  }

  async getRoomClients(room: string): Promise<string[]> {
    try {
      const sockets = await this.server.in(room).fetchSockets();
      return sockets.map(socket => socket.id);
    } catch (error) {
      this.logger.error(`Error getting clients for room ${room}`, error.stack);
      throw error;
    }
  }

  async getActiveRooms(): Promise<string[]> {
    try {
      const adapter = this.server.sockets.adapter;
      return Array.from(adapter.rooms.keys());
    } catch (error) {
      this.logger.error('Error getting active rooms', error.stack);
      throw error;
    }
  }
}
```

### Client-Side WebSocket Integration

```typescript
// websocket.service.ts (client-side)
import { Injectable, Logger } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { filter, map, shareReplay, takeUntil } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private socket: Socket | null = null;
  private readonly connectionStatus = new BehaviorSubject<boolean>(false);
  private readonly reconnectAttempts = new BehaviorSubject<number>(0);
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000; // 3 seconds
  private destroy$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    this.initialize();
  }

  private initialize(): void {
    this.setupConnection();
    this.setupReconnection();
  }

  private setupConnection(): void {
    const wsUrl = this.configService.get<string>('WEBSOCKET_URL', 'ws://localhost:3000');
    const token = this.authService.getAccessToken();

    if (!token) {
      this.logger.warn('No authentication token available for WebSocket connection');
      return;
    }

    this.socket = io(wsUrl, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false, // We'll handle reconnection manually
      auth: {
        token: `Bearer ${token}`,
      },
      query: {
        clientType: 'web',
      },
    });

    this.setupSocketEventHandlers();
    this.connect();
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.logger.log('WebSocket connected');
      this.connectionStatus.next(true);
      this.reconnectAttempts.next(0);
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.warn(`WebSocket disconnected: ${reason}`);
      this.connectionStatus.next(false);

      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, need to reconnect manually
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error('WebSocket connection error', error);
      this.connectionStatus.next(false);
    });

    // Custom events
    this.socket.on('connected', (data) => {
      this.logger.log('WebSocket connection established', data);
    });

    this.socket.on('error', (error) => {
      this.logger.error('WebSocket error', error);
    });

    this.socket.on('pong', (data) => {
      this.logger.debug('Received pong', data);
    });
  }

  private setupReconnection(): void {
    this.connectionStatus.pipe(
      filter(connected => !connected),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.reconnect();
    });
  }

  private reconnect(): void {
    const currentAttempts = this.reconnectAttempts.getValue();

    if (currentAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts.next(currentAttempts + 1);

    setTimeout(() => {
      this.logger.log(`Attempting to reconnect (attempt ${currentAttempts + 1})`);
      this.connect();
    }, this.RECONNECT_DELAY * (currentAttempts + 1));
  }

  connect(): void {
    if (!this.socket) {
      this.logger.warn('Socket not initialized');
      return;
    }

    if (this.socket.connected) {
      this.logger.debug('Socket already connected');
      return;
    }

    this.socket.connect();
  }

  disconnect(): void {
    if (!this.socket) {
      this.logger.warn('Socket not initialized');
      return;
    }

    this.socket.disconnect();
    this.connectionStatus.next(false);
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable().pipe(
      shareReplay(1),
    );
  }

  getReconnectAttempts(): Observable<number> {
    return this.reconnectAttempts.asObservable();
  }

  on<T>(event: string): Observable<T> {
    if (!this.socket) {
      this.logger.warn('Socket not initialized');
      return new Observable<T>();
    }

    return fromEvent(this.socket, event).pipe(
      map(data => data as T),
      takeUntil(merge(this.destroy$, this.connectionStatus.pipe(filter(connected => !connected)))),
      shareReplay(1),
    );
  }

  emit(event: string, data?: any): void {
    if (!this.socket) {
      this.logger.warn('Socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      this.logger.warn('Socket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  subscribeToRoom(room: string): void {
    this.emit('subscribe', { rooms: [room] });
  }

  unsubscribeFromRoom(room: string): void {
    this.emit('unsubscribe', { rooms: [room] });
  }

  subscribeToVendor(vendorId: string): void {
    this.subscribeToRoom(`vendor:${vendorId}`);
  }

  unsubscribeFromVendor(vendorId: string): void {
    this.unsubscribeFromRoom(`vendor:${vendorId}`);
  }

  subscribeToUser(userId: string): void {
    this.subscribeToRoom(`user:${userId}`);
  }

  subscribeToRole(role: string): void {
    this.subscribeToRoom(`role:${role}`);
  }

  // Vendor events
  onVendorCreated(): Observable<any> {
    return this.on('vendor.created');
  }

  onVendorUpdated(): Observable<any> {
    return this.on('vendor.updated');
  }

  onVendorStatusChanged(): Observable<any> {
    return this.on('vendor.status.changed');
  }

  onVendorPerformanceUpdated(): Observable<any> {
    return this.on('vendor.performance.updated');
  }

  // Contract events
  onContractCreated(): Observable<any> {
    return this.on('contract.created');
  }

  onContractUpdated(): Observable<any> {
    return this.on('contract.updated');
  }

  onContractStatusChanged(): Observable<any> {
    return this.on('contract.status.changed');
  }

  onContractRenewalDue(): Observable<any> {
    return this.on('contract.renewal.due');
  }

  // Risk events
  onRiskCreated(): Observable<any> {
    return this.on('risk.created');
  }

  onRiskUpdated(): Observable<any> {
    return this.on('risk.updated');
  }

  onRiskStatusChanged(): Observable<any> {
    return this.on('risk.status.changed');
  }

  // Notification events
  onNotificationCreated(): Observable<any> {
    return this.on('notification.created');
  }

  // System events
  onSystemAlert(): Observable<any> {
    return this.on('system.alert');
  }

  ping(): void {
    this.emit('ping', { timestamp: Date.now() });
  }

  async destroy(): Promise<void> {
    this.destroy$.next(true);
    this.destroy$.complete();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionStatus.complete();
    this.reconnectAttempts.complete();
  }
}
```

### Room/Channel Management

```typescript
// room.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { VendorService } from '../vendor/vendor.service';
import { UserService } from '../user/user.service';
import { performance } from 'perf_hooks';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private readonly roomMetrics = new Map<string, {
    memberCount: number;
    lastActivity: number;
    messagesSent: number;
  }>();

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly vendorService: VendorService,
    private readonly userService: UserService,
  ) {
    this.setupMetrics();
  }

  private setupMetrics() {
    setInterval(() => {
      const now = performance.now();
      const activeRooms = Array.from(this.roomMetrics.entries())
        .filter(([_, metrics]) => now - metrics.lastActivity < 300000) // 5 minutes
        .map(([room]) => room);

      this.logger.log(
        `Active Rooms: ${activeRooms.length}, ` +
        `Total Members: ${Array.from(this.roomMetrics.values())
          .reduce((sum, metrics) => sum + metrics.memberCount, 0)}`
      );
    }, 60000); // Every minute
  }

  async createVendorRoom(vendorId: string): Promise<void> {
    try {
      const vendor = await this.vendorService.findById(vendorId);
      if (!vendor) {
        throw new Error(`Vendor ${vendorId} not found`);
      }

      // Vendor rooms are automatically created when the vendor is created
      // This method ensures the room exists and updates metadata
      const roomName = `vendor:${vendorId}`;

      // Update room metadata
      this.updateRoomMetrics(roomName, {
        memberCount: 0,
        lastActivity: performance.now(),
        messagesSent: 0,
      });

      this.logger.log(`Vendor room ${roomName} ensured`);
    } catch (error) {
      this.logger.error(`Error creating vendor room ${vendorId}`, error.stack);
      throw error;
    }
  }

  async joinVendorRoom(userId: string, vendorId: string): Promise<void> {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const vendor = await this.vendorService.findById(vendorId);
      if (!vendor) {
        throw new Error(`Vendor ${vendorId} not found`);
      }

      const roomName = `vendor:${vendorId}`;

      // Join the room via WebSocket
      await this.webSocketService.broadcastToUser(userId, 'join-room', {
        room: roomName,
        vendorId,
        vendorName: vendor.name,
      });

      // Update room metrics
      this.updateRoomMetrics(roomName, {
        memberCount: 1,
        lastActivity: performance.now(),
      });

      this.logger.log(`User ${userId} joined vendor room ${roomName}`);
    } catch (error) {
      this.logger.error(`Error joining vendor room ${vendorId} for user ${userId}`, error.stack);
      throw error;
    }
  }

  async leaveVendorRoom(userId: string, vendorId: string): Promise<void> {
    try {
      const roomName = `vendor:${vendorId}`;

      // Leave the room via WebSocket
      await this.webSocketService.broadcastToUser(userId, 'leave-room', {
        room: roomName,
        vendorId,
      });

      // Update room metrics
      this.updateRoomMetrics(roomName, {
        memberCount: -1,
        lastActivity: performance.now(),
      });

      this.logger.log(`User ${userId} left vendor room ${roomName}`);
    } catch (error) {
      this.logger.error(`Error leaving vendor room ${vendorId} for user ${userId}`, error.stack);
      throw error;
    }
  }

  async createUserRoom(userId: string): Promise<void> {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const roomName = `user:${userId}`;

      // User rooms are automatically created when the user connects
      // This method ensures the room exists and updates metadata
      this.updateRoomMetrics(roomName, {
        memberCount: 0,
        lastActivity: performance.now(),
        messagesSent: 0,
      });

      this.logger.log(`User room ${roomName} ensured`);
    } catch (error) {
      this.logger.error(`Error creating user room ${userId}`, error.stack);
      throw error;
    }
  }

  async createRoleRoom(role: string): Promise<void> {
    try {
      // Validate role exists (optional)
      const roomName = `role:${role}`;

      // Role rooms are automatically created when users with the role connect
      // This method ensures the room exists and updates metadata
      this.updateRoomMetrics(roomName, {
        memberCount: 0,
        lastActivity: performance.now(),
        messagesSent: 0,
      });

      this.logger.log(`Role room ${roomName} ensured`);
    } catch (error) {
      this.logger.error(`Error creating role room ${role}`, error.stack);
      throw error;
    }
  }

  async getRoomMembers(room: string): Promise<string[]> {
    try {
      const clients = await this.webSocketService.getRoomClients(room);
      return clients;
    } catch (error) {
      this.logger.error(`Error getting members for room ${room}`, error.stack);
      throw error;
    }
  }

  async getActiveRooms(): Promise<string[]> {
    try {
      return await this.webSocketService.getActiveRooms();
    } catch (error) {
      this.logger.error('Error getting active rooms', error.stack);
      throw error;
    }
  }

  async broadcastToVendorRoom(vendorId: string, event: string, data: any): Promise<void> {
    try {
      const roomName = `vendor:${vendorId}`;
      await this.webSocketService.broadcastToRoom(roomName, event, data);

      // Update room metrics
      this.updateRoomMetrics(roomName, {
        messagesSent: 1,
        lastActivity: performance.now(),
      });
    } catch (error) {
      this.logger.error(`Error broadcasting to vendor room ${vendorId}`, error.stack);
      throw error;
    }
  }

  async broadcastToUserRoom(userId: string, event: string, data: any): Promise<void> {
    try {
      const roomName = `user:${userId}`;
      await this.webSocketService.broadcastToUser(userId, event, data);

      // Update room metrics
      this.updateRoomMetrics(roomName, {
        messagesSent: 1,
        lastActivity: performance.now(),
      });
    } catch (error) {
      this.logger.error(`Error broadcasting to user room ${userId}`, error.stack);
      throw error;
    }
  }

  async broadcastToRoleRoom(role: string, event: string, data: any): Promise<void> {
    try {
      const roomName = `role:${role}`;
      await this.webSocketService.broadcastToRole(role, event, data);

      // Update room metrics
      this.updateRoomMetrics(roomName, {
        messagesSent: 1,
        lastActivity: performance.now(),
      });
    } catch (error) {
      this.logger.error(`Error broadcasting to role room ${role}`, error.stack);
      throw error;
    }
  }

  async broadcastToCategoryRoom(categoryId: string, event: string, data: any): Promise<void> {
    try {
      const roomName = `category:${categoryId}`;
      await this.webSocketService.broadcastToRoom(roomName, event, data);

      // Update room metrics
      this.updateRoomMetrics(roomName, {
        messagesSent: 1,
        lastActivity: performance.now(),
      });
    } catch (error) {
      this.logger.error(`Error broadcasting to category room ${categoryId}`, error.stack);
      throw error;
    }
  }

  private updateRoomMetrics(room: string, updates: {
    memberCount?: number;
    lastActivity?: number;
    messagesSent?: number;
  }): void {
    const currentMetrics = this.roomMetrics.get(room) || {
      memberCount: 0,
      lastActivity: 0,
      messagesSent: 0,
    };

    const newMetrics = {
      memberCount: updates.memberCount !== undefined
        ? currentMetrics.memberCount + updates.memberCount
        : currentMetrics.memberCount,
      lastActivity: updates.lastActivity !== undefined
        ? updates.lastActivity
        : currentMetrics.lastActivity,
      messagesSent: updates.messagesSent !== undefined
        ? currentMetrics.messagesSent + updates.messagesSent
        : currentMetrics.messagesSent,
    };

    this.roomMetrics.set(room, newMetrics);
  }

  async getRoomMetrics(room: string): Promise<{
    memberCount: number;
    lastActivity: number;
    messagesSent: number;
  }> {
    return this.roomMetrics.get(room) || {
      memberCount: 0,
      lastActivity: 0,
      messagesSent: 0,
    };
  }

  async cleanupInactiveRooms(): Promise<void> {
    try {
      const now = performance.now();
      const inactiveRooms = Array.from(this.roomMetrics.entries())
        .filter(([_, metrics]) => now - metrics.lastActivity > 86400000) // 24 hours
        .map(([room]) => room);

      for (const room of inactiveRooms) {
        this.roomMetrics.delete(room);
        this.logger.log(`Cleaned up inactive room ${room}`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up inactive rooms', error.stack);
      throw error;
    }
  }
}
```

### Reconnection Logic

```typescript
// reconnection.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { interval, Subject, Observable } from 'rxjs';
import { takeUntil, filter, tap, switchMap } from 'rxjs/operators';
import { performance } from 'perf_hooks';

@Injectable()
export class ReconnectionService {
  private readonly logger = new Logger(ReconnectionService.name);
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly BASE_RECONNECT_DELAY = 3000; // 3 seconds
  private readonly MAX_RECONNECT_DELAY = 30000; // 30 seconds
  private destroy$ = new Subject<void>();
  private reconnectAttempts = 0;
  private lastReconnectTime = 0;

  constructor(private readonly webSocketService: WebSocketService) {
    this.setupReconnectionMonitor();
  }

  private setupReconnectionMonitor(): void {
    this.webSocketService.getConnectionStatus().pipe(
      filter(connected => !connected),
      tap(() => {
        this.reconnectAttempts = 0;
        this.lastReconnectTime = 0;
      }),
      switchMap(() => this.reconnectionStrategy()),
      takeUntil(this.destroy$),
    ).subscribe();
  }

  private reconnectionStrategy(): Observable<void> {
    return interval(this.calculateReconnectDelay()).pipe(
      tap(() => {
        this.reconnectAttempts++;
        this.lastReconnectTime = performance.now();
        this.logger.log(`Attempting reconnection (attempt ${this.reconnectAttempts})`);
      }),
      switchMap(() => {
        return new Observable<void>(subscriber => {
          this.webSocketService.connect();

          const subscription = this.webSocketService.getConnectionStatus().pipe(
            filter(connected => connected),
            tap(() => {
              this.logger.log('Reconnection successful');
              subscriber.next();
              subscriber.complete();
            }),
          ).subscribe();

          return () => subscription.unsubscribe();
        });
      }),
      takeUntil(this.webSocketService.getConnectionStatus().pipe(
        filter(connected => connected),
      )),
    );
  }

  private calculateReconnectDelay(): number {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      return this.MAX_RECONNECT_DELAY;
    }

    // Exponential backoff with jitter
    const baseDelay = this.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts);
    const jitter = baseDelay * 0.2 * Math.random(); // 20% jitter
    const delay = Math.min(baseDelay + jitter, this.MAX_RECONNECT_DELAY);

    return delay;
  }

  getReconnectStatus(): Observable<{
    attempts: number;
    lastAttemptTime: number;
    nextAttemptDelay: number;
  }> {
    return interval(1000).pipe(
      map(() => ({
        attempts: this.reconnectAttempts,
        lastAttemptTime: this.lastReconnectTime,
        nextAttemptDelay: this.calculateReconnectDelay(),
      })),
      takeUntil(this.destroy$),
    );
  }

  forceReconnect(): void {
    this.logger.log('Forcing WebSocket reconnection');
    this.webSocketService.disconnect();
    this.webSocketService.connect();
  }

  async destroy(): Promise<void> {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## AI/ML Capabilities (250+ lines)

### Predictive Model Training

```python
# vendor_performance_model.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_regression
from joblib import dump, load
import mlflow
import mlflow.sklearn
from mlflow.models.signature import infer_signature
from datetime import datetime
import logging
import os
import warnings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
warnings.filterwarnings('ignore')

class VendorPerformanceModel:
    def __init__(self, experiment_name='VendorPerformancePrediction'):
        self.experiment_name = experiment_name
        self.model = None
        self.preprocessor = None
        self.feature_names = None
        self.target_variable = 'overall_score'
        self.model_version = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.setup_mlflow()

    def setup_mlflow(self):
        """Set up MLflow tracking"""
        mlflow.set_tracking_uri(os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000'))
        mlflow.set_experiment(self.experiment_name)

    def load_data(self, file_path):
        """Load and preprocess data from CSV file"""
        try:
            logger.info(f"Loading data from {file_path}")
            data = pd.read_csv(file_path)

            # Basic data validation
            required_columns = [
                'vendor_id', 'category_id', 'contract_value', 'contract_duration',
                'delivery_score', 'quality_score', 'cost_score', 'innovation_score',
                'risk_level', 'compliance_score', 'on_time_delivery_rate',
                'defect_rate', 'response_time', 'vendor_age', 'region',
                'has_certification', 'overall_score'
            ]

            for col in required_columns:
                if col not in data.columns:
                    raise ValueError(f"Missing required column: {col}")

            # Feature engineering
            data = self.feature_engineering(data)

            logger.info(f"Data loaded successfully. Shape: {data.shape}")
            return data

        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise

    def feature_engineering(self, data):
        """Perform feature engineering on the dataset"""
        try:
            # Create new features
            data['contract_value_per_month'] = data['contract_value'] / (data['contract_duration'] + 1)
            data['performance_trend'] = data['delivery_score'] + data['quality_score'] - data['defect_rate']
            data['risk_compliance_interaction'] = data['risk_level'] * data['compliance_score']
            data['vendor_maturity'] = data['vendor_age'] * data['has_certification']

            # Encode categorical variables
            data['risk_level_encoded'] = data['risk_level'].map({
                'Low': 0,
                'Medium': 1,
                'High': 2,
                'Critical': 3
            })

            # Create time-based features if we have date information
            if 'last_evaluation_date' in data.columns:
                data['last_evaluation_date'] = pd.to_datetime(data['last_evaluation_date'])
                data['days_since_last_evaluation'] = (datetime.now() - data['last_evaluation_date']).dt.days

            return data

        except Exception as e:
            logger.error(f"Error in feature engineering: {str(e)}")
            raise

    def preprocess_data(self, data):
        """Preprocess data for modeling"""
        try:
            # Separate features and target
            X = data.drop(columns=[self.target_variable, 'vendor_id'])
            y = data[self.target_variable]

            # Identify numerical and categorical columns
            numerical_cols = X.select_dtypes(include=['int64', 'float64']).columns
            categorical_cols = X.select_dtypes(include=['object', 'category']).columns

            # Create preprocessing pipeline
            numerical_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ])

            categorical_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('onehot', OneHotEncoder(handle_unknown='ignore'))
            ])

            self.preprocessor = ColumnTransformer(
                transformers=[
                    ('num', numerical_transformer, numerical_cols),
                    ('cat', categorical_transformer, categorical_cols)
                ])

            # Apply preprocessing
            X_processed = self.preprocessor.fit_transform(X)

            # Get feature names after preprocessing
            feature_names = numerical_cols.tolist()
            if len(categorical_cols) > 0:
                onehot_encoder = self.preprocessor.named_transformers_['cat'].named_steps['onehot']
                cat_feature_names = onehot_encoder.get_feature_names_out(categorical_cols)
                feature_names.extend(cat_feature_names)

            self.feature_names = feature_names

            return X_processed, y

        except Exception as e:
            logger.error(f"Error in data preprocessing: {str(e)}")
            raise

    def train_model(self, X, y):
        """Train the predictive model"""
        try:
            logger.info("Starting model training")

            # Split data into train and test sets
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            # Feature selection
            selector = SelectKBest(score_func=f_regression, k=20)
            X_train_selected = selector.fit_transform(X_train, y_train)
            X_test_selected = selector.transform(X_test)

            # Get selected feature names
            selected_features = np.array(self.feature_names)[selector.get_support()]
            logger.info(f"Selected features: {selected_features.tolist()}")

            # Create and train model
            model = GradientBoostingRegressor(
                n_estimators=200,
                learning_rate=0.05,
                max_depth=5,
                min_samples_split=10,
                min_samples_leaf=5,
                max_features='sqrt',
                random_state=42,
                loss='huber'  # Robust to outliers
            )

            model.fit(X_train_selected, y_train)

            # Evaluate model
            train_score = model.score(X_train_selected, y_train)
            test_score = model.score(X_test_selected, y_test)

            y_pred = model.predict(X_test_selected)
            mae = mean_absolute_error(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, y_pred)

            logger.info(f"Model training completed")
            logger.info(f"Train R2: {train_score:.4f}, Test R2: {test_score:.4f}")
            logger.info(f"MAE: {mae:.4f}, MSE: {mse:.4f}, RMSE: {rmse:.4f}, R2: {r2:.4f}")

            # Store the model and selector
            self.model = {
                'model': model,
                'selector': selector,
                'selected_features': selected_features
            }

            return {
                'train_score': train_score,
                'test_score': test_score,
                'mae': mae,
                'mse': mse,
                'rmse': rmse,
                'r2': r2,
                'selected_features': selected_features.tolist()
            }

        except Exception as e:
            logger.error(f"Error in model training: {str(e)}")
            raise

    def log_model(self, metrics, params):
        """Log model and metrics to MLflow"""
        try:
            with mlflow.start_run():
                # Log parameters
                mlflow.log_params(params)

                # Log metrics
                mlflow.log_metrics(metrics)

                # Log model
                signature = infer_signature(
                    self.preprocessor.transform(pd.DataFrame([params])),
                    self.model['model'].predict(self.model['selector'].transform(
                        self.preprocessor.transform(pd.DataFrame([params]))
                    ))
                )

                mlflow.sklearn.log_model(
                    sk_model=self.model['model'],
                    artifact_path="vendor_performance_model",
                    signature=signature,
                    registered_model_name="VendorPerformanceModel"
                )

                # Log additional artifacts
                mlflow.log_dict(
                    {feature: idx for idx, feature in enumerate(self.model['selected_features'])},
                    "selected_features.json"
                )

                # Log preprocessor
                dump(self.preprocessor, "preprocessor.joblib")
                mlflow.log_artifact("preprocessor.joblib")
                os.remove("preprocessor.joblib")

                logger.info("Model logged to MLflow successfully")

        except Exception as e:
            logger.error(f"Error logging model to MLflow: {str(e)}")
            raise

    def train_and_save(self, data_path, model_path):
        """Complete training pipeline"""
        try:
            # Load and preprocess data
            data = self.load_data(data_path)
            X, y = self.preprocess_data(data)

            # Train model
            params = {
                'n_estimators': 200,
                'learning_rate': 0.05,
                'max_depth': 5,
                'min_samples_split': 10,
                'min_samples_leaf': 5,
                'max_features': 'sqrt',
                'random_state': 42,
                'loss': 'huber'
            }

            metrics = self.train_model(X, y)

            # Log model
            self.log_model(metrics, params)

            # Save model locally
            self.save_model(model_path)

            return {
                'status': 'success',
                'metrics': metrics,
                'model_version': self.model_version,
                'feature_names': self.feature_names,
                'selected_features': self.model['selected_features'].tolist()
            }

        except Exception as e:
            logger.error(f"Error in training pipeline: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def save_model(self, path):
        """Save model to disk"""
        try:
            if not self.model or not self.preprocessor:
                raise ValueError("Model or preprocessor not initialized")

            model_data = {
                'model': self.model['model'],
                'selector': self.model['selector'],
                'preprocessor': self.preprocessor,
                'feature_names': self.feature_names,
                'selected_features': self.model['selected_features'],
                'version': self.model_version,
                'target_variable': self.target_variable
            }

            dump(model_data, path)
            logger.info(f"Model saved to {path}")

        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    @classmethod
    def load_model(cls, path):
        """Load model from disk"""
        try:
            model_data = load(path)
            instance = cls()
            instance.model = {
                'model': model_data['model'],
                'selector': model_data['selector'],
                'selected_features': model_data['selected_features']
            }
            instance.preprocessor = model_data['preprocessor']
            instance.feature_names = model_data['feature_names']
            instance.model_version = model_data.get('version', 'unknown')
            instance.target_variable = model_data.get('target_variable', 'overall_score')

            logger.info(f"Model loaded from {path}")
            return instance

        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

    def predict(self, input_data):
        """Make predictions using the trained model"""
        try:
            if not self.model or not self.preprocessor:
                raise ValueError("Model not loaded or trained")

            # Convert input to DataFrame
            if not isinstance(input_data, pd.DataFrame):
                input_data = pd.DataFrame([input_data])

            # Apply feature engineering
            input_data = self.feature_engineering(input_data)

            # Preprocess input
            input_processed = self.preprocessor.transform(input_data)

            # Apply feature selection
            input_selected = self.model['selector'].transform(input_processed)

            # Make prediction
            prediction = self.model['model'].predict(input_selected)

            return prediction[0]

        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            raise

    def predict_batch(self, input_data):
        """Make batch predictions"""
        try:
            if not isinstance(input_data, pd.DataFrame):
                input_data = pd.DataFrame(input_data)

            predictions = []
            for _, row in input_data.iterrows():
                pred = self.predict(row.to_dict())
                predictions.append(pred)

            return predictions

        except Exception as e:
            logger.error(f"Error in batch prediction: {str(e)}")
            raise

# Example usage
if __name__ == "__main__":
    # Initialize model
    model = VendorPerformanceModel()

    # Train and save model
    result = model.train_and_save(
        data_path='vendor_data.csv',
        model_path='vendor_performance_model.joblib'
    )

    print(result)

    # Load model and make prediction
    loaded_model = VendorPerformanceModel.load_model('vendor_performance_model.joblib')

    sample_input = {
        'category_id': 'CAT001',
        'contract_value': 500000,
        'contract_duration': 24,
        'delivery_score': 85,
        'quality_score': 90,
        'cost_score': 75,
        'innovation_score': 60,
        'risk_level': 'Medium',
        'compliance_score': 88,
        'on_time_delivery_rate': 0.95,
        'defect_rate': 0.02,
        'response_time': 24,
        'vendor_age': 5,
        'region': 'North America',
        'has_certification': 1
    }

    prediction = loaded_model.predict(sample_input)
    print(f"Predicted performance score: {prediction:.2f}")
```

### Real-Time Inference API

```python
# app.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from vendor_performance_model import VendorPerformanceModel
import logging
import os
from datetime import datetime
import mlflow
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Vendor Performance Prediction API",
    description="API for real-time vendor performance predictions using machine learning",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Prometheus instrumentation
Instrumentator().instrument(app).expose(app)

# Load model
MODEL_PATH = os.getenv('MODEL_PATH', 'vendor_performance_model.joblib')
try:
    model = VendorPerformanceModel.load_model(MODEL_PATH)
    logger.info(f"Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    raise

# Request models
class VendorInput(BaseModel):
    vendor_id: Optional[str] = None
    category_id: str
    contract_value: float
    contract_duration: int
    delivery_score: float
    quality_score: float
    cost_score: float
    innovation_score: float
    risk_level: str
    compliance_score: float
    on_time_delivery_rate: float
    defect_rate: float
    response_time: float
    vendor_age: int
    region: str
    has_certification: int

class BatchPredictionRequest(BaseModel):
    vendors: List[VendorInput]
    request_id: Optional[str] = None

class PredictionResponse(BaseModel):
    vendor_id: Optional[str]
    predicted_score: float
    model_version: str
    confidence: float
    features_used: List[str]
    timestamp: str

class BatchPredictionResponse(BaseModel):
    request_id: str
    predictions: List[PredictionResponse]
    model_version: str
    timestamp: str
    processing_time: float

# Background task for model monitoring
async def monitor_model_performance():
    """Background task to monitor model performance"""
    try:
        # In a real implementation, this would compare predictions with actual outcomes
        # and log performance metrics to MLflow
        logger.info("Model performance monitoring completed")
    except Exception as e:
        logger.error(f"Error in model monitoring: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Startup tasks"""
    logger.info("Starting Vendor Performance Prediction API")
    # Start background monitoring
    background_tasks = BackgroundTasks()
    background_tasks.add_task(monitor_model_performance)

@app.post("/predict", response_model=PredictionResponse)
async def predict_vendor_performance(vendor: VendorInput):
    """
    Predict vendor performance score based on input features.

    Args:
        vendor: VendorInput containing all required features

    Returns:
        PredictionResponse with predicted score and metadata
    """
    try:
        start_time = datetime.now()

        # Convert input to dictionary
        input_data = vendor.dict()

        # Remove vendor_id if present (not used in prediction)
        if 'vendor_id' in input_data:
            vendor_id = input_data.pop('vendor_id')
        else:
            vendor_id = None

        # Make prediction
        predicted_score = model.predict(input_data)

        # Calculate confidence (simplified for this example)
        confidence = min(1.0, max(0.0, 1.0 - (abs(predicted_score - 75) / 75)))

        # Prepare response
        response = PredictionResponse(
            vendor_id=vendor_id,
            predicted_score=float(predicted_score),
            model_version=model.model_version,
            confidence=float(confidence),
            features_used=model.model['selected_features'].tolist(),
            timestamp=datetime.now().isoformat()
        )

        processing_time = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Prediction completed for vendor {vendor_id or 'new'}. "
            f"Score: {predicted_score:.2f}, Time: {processing_time:.4f}s"
        )

        return response

    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-batch", response_model=BatchPredictionResponse)
async def predict_batch_vendor_performance(request: BatchPredictionRequest):
    """
    Predict performance scores for multiple vendors in a single request.

    Args:
        request: BatchPredictionRequest containing list of vendors

    Returns:
        BatchPredictionResponse with predictions for all vendors
    """
    try:
        start_time = datetime.now()
        request_id = request.request_id or f"batch_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        logger.info(f"Starting batch prediction for {len(request.vendors)} vendors")

        predictions = []
        for vendor in request.vendors:
            try:
                # Use the single prediction endpoint
                input_data = vendor.dict()
                vendor_id = input_data.pop('vendor_id', None)
                predicted_score = model.predict(input_data)

                confidence = min(1.0, max(0.0, 1.0 - (abs(predicted_score - 75) / 75)))

                predictions.append(PredictionResponse(
                    vendor_id=vendor_id,
                    predicted_score=float(predicted_score),
                    model_version=model.model_version,
                    confidence=float(confidence),
                    features_used=model.model['selected_features'].tolist(),
                    timestamp=datetime.now().isoformat()
                ))
            except Exception as e:
                logger.error(f"Error processing vendor {vendor.vendor_id}: {str(e)}")
                predictions.append(PredictionResponse(
                    vendor_id=vendor.vendor_id,
                    predicted_score=-1,
                    model_version=model.model_version,
                    confidence=0.0,
                    features_used=[],
                    timestamp=datetime.now().isoformat()
                ))

        processing_time = (datetime.now() - start_time).total_seconds()

        response = BatchPredictionResponse(
            request_id=request_id,
            predictions=predictions,
            model_version=model.model_version,
            timestamp=datetime.now().isoformat(),
            processing_time=processing_time
        )

        logger.info(
            f"Batch prediction completed for {len(request.vendors)} vendors. "
            f"Request ID: {request_id}, Time: {processing_time:.4f}s"
        )

        return response

    except Exception as e:
        logger.error(f"Error in batch prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info")
async def get_model_info():
    """
    Get information about the current model.

    Returns:
        Dictionary with model information
    """
    try:
        return {
            "model_version": model.model_version,
            "target_variable": model.target_variable,
            "features": model.feature_names,
            "selected_features": model.model['selected_features'].tolist(),
            "model_type": "GradientBoostingRegressor",
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def provide_feedback(
    vendor_id: str,
    predicted_score: float,
    actual_score: float,
    feedback: str = None
):
    """
    Provide feedback on model predictions to improve future performance.

    Args:
        vendor_id: ID of the vendor
        predicted_score: Score predicted by the model
        actual_score: Actual score observed
        feedback: Optional feedback text
    """
    try:
        # In a real implementation, this would store the feedback for model retraining
        logger.info(
            f"Feedback received for vendor {vendor_id}. "
            f"Predicted: {predicted_score:.2f}, Actual: {actual_score:.2f}"
        )

        # Log feedback to MLflow
        with mlflow.start_run():
            mlflow.log_metric("predicted_score", predicted_score)
            mlflow.log_metric("actual_score", actual_score)
            mlflow.log_param("vendor_id", vendor_id)
            if feedback:
                mlflow.log_text(feedback, "feedback.txt")

        return {
            "status": "success",
            "message": "Feedback received and logged"
        }

    except Exception as e:
        logger.error(f"Error processing feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns:
        Dictionary with health status
    """
    return {
        "status": "healthy",
        "model_loaded": True,
        "model_version": model.model_version,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Feature Engineering Pipeline

```python
# feature_engineering_pipeline.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Optional, Union
from pydantic import BaseModel
import json
from sklearn.preprocessing import MinMaxScaler, StandardScaler
import holidays

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VendorFeatureConfig(BaseModel):
    """Configuration for feature engineering"""
    numerical_features: List[str] = [
        'contract_value', 'contract_duration', 'delivery_score',
        'quality_score', 'cost_score', 'innovation_score',
        'compliance_score', 'on_time_delivery_rate', 'defect_rate',
        'response_time', 'vendor_age'
    ]
    categorical_features: List[str] = ['category_id', 'risk_level', 'region']
    datetime_features: List[str] = ['contract_start_date', 'contract_end_date', 'last_evaluation_date']
    target_variable: str = 'overall_score'
    min_max_scaler_features: List[str] = ['contract_value', 'contract_duration']
    standard_scaler_features: List[str] = [
        'delivery_score', 'quality_score', 'cost_score',
        'innovation_score', 'compliance_score'
    ]
    country_holidays: str = 'US'  # For business day calculations

class FeatureEngineeringPipeline:
    def __init__(self, config: Optional[VendorFeatureConfig] = None):
        self.config = config or VendorFeatureConfig()
        self.scalers = {}
        self.holidays = holidays.country_holidays(self.config.country_holidays)
        self.initialize_scalers()

    def initialize_scalers(self):
        """Initialize scalers for different features"""
        for feature in self.config.min_max_scaler_features:
            self.scalers[feature] = MinMaxScaler()

        for feature in self.config.standard_scaler_features:
            self.scalers[feature] = StandardScaler()

    def fit_scalers(self, data: pd.DataFrame):
        """Fit scalers to the data"""
        try:
            # Fit MinMaxScaler
            min_max_data = data[self.config.min_max_scaler_features].copy()
            for feature in self.config.min_max_scaler_features:
                if feature in min_max_data.columns:
                    self.scalers[feature].fit(min_max_data[[feature]])

            # Fit StandardScaler
            standard_data = data[self.config.standard_scaler_features].copy()
            for feature in self.config.standard_scaler_features:
                if feature in standard_data.columns:
                    self.scalers[feature].fit(standard_data[[feature]])

            logger.info("Scalers fitted successfully")
        except Exception as e:
            logger.error(f"Error fitting scalers: {str(e)}")
            raise

    def transform(self, data: pd.DataFrame) -> pd.DataFrame:
        """Apply feature engineering transformations"""
        try:
            # Make a copy to avoid modifying the original data
            transformed_data = data.copy()

            # 1. Handle missing values
            transformed_data = self.handle_missing_values(transformed_data)

            # 2. Feature engineering
            transformed_data = self.create_time_based_features(transformed_data)
            transformed_data = self.create_performance_features(transformed_data)
            transformed_data = self.create_risk_features(transformed_data)
            transformed_data = self.create_contract_features(transformed_data)
            transformed_data = self.create_interaction_features(transformed_data)

            # 3. Encode categorical variables
            transformed_data = self.encode_categorical_features(transformed_data)

            # 4. Scale numerical features
            transformed_data = self.scale_features(transformed_data)

            # 5. Create derived features
            transformed_data = self.create_derived_features(transformed_data)

            # 6. Handle outliers
            transformed_data = self.handle_outliers(transformed_data)

            logger.info(f"Feature engineering completed. Shape: {transformed_data.shape}")
            return transformed_data

        except Exception as e:
            logger.error(f"Error in feature transformation: {str(e)}")
            raise

    def handle_missing_values(self, data: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset"""
        try:
            # For numerical features, fill with median
            numerical_cols = [col for col in self.config.numerical_features if col in data.columns]
            for col in numerical_cols:
                if data[col].isna().any():
                    median_val = data[col].median()
                    data[col].fillna(median_val, inplace=True)
                    logger.debug(f"Filled missing values in {col} with median {median_val}")

            # For categorical features, fill with mode
            categorical_cols = [col for col in self.config.categorical_features if col in data.columns]
            for col in categorical_cols:
                if data[col].isna().any():
                    mode_val = data[col].mode()[0]
                    data[col].fillna(mode_val, inplace=True)
                    logger.debug(f"Filled missing values in {col} with mode {mode_val}")

            # For datetime features, fill with a default date
            datetime_cols = [col for col in self.config.datetime_features if col in data.columns]
            for col in datetime_cols:
                if data[col].isna().any():
                    default_date = datetime.now() - timedelta(days=365)
                    data[col].fillna(default_date, inplace=True)
                    logger.debug(f"Filled missing values in {col} with {default_date}")

            return data

        except Exception as e:
            logger.error(f"Error handling missing values: {str(e)}")
            raise

    def create_time_based_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Create features based on time information"""
        try:
            # Convert datetime columns if they exist
            datetime_cols = [col for col in self.config.datetime_features if col in data.columns]
            for col in datetime_cols:
                if not pd.api.types.is_datetime64_any_dtype(data[col]):
                    data[col] = pd.to_datetime(data[col])

            # Create contract duration in days if we have start and end dates
            if 'contract_start_date' in data.columns and 'contract_end_date' in data.columns:
                data['contract_duration_days'] = (
                    data['contract_end_date'] - data['contract_start_date']
                ).dt.days

                # Business days in contract
                data['contract_business_days'] = data.apply(
                    lambda row: self.count_business_days(row['contract_start_date'], row['contract_end_date']),
                    axis=1
                )

                # Contract age in days
                data['contract_age_days'] = (datetime.now() - data['contract_start_date']).dt.days

                # Days until contract expiration
                data['days_until_expiration'] = (data['contract_end_date'] - datetime.now()).dt.days

            # Days since last evaluation
            if 'last_evaluation_date' in data.columns:
                data['days_since_evaluation'] = (datetime.now() - data['last_evaluation_date']).dt.days

            return data

        except Exception as e:
            logger.error(f"Error creating time-based features: {str(e)}")
            raise

    def count_business_days(self, start_date: datetime, end_date: datetime) -> int:
        """Count business days between two dates"""
        try:
            business_days = np.busday_count(
                start_date.date(),
                end_date.date(),
                holidays=self.holidays.keys()
            )
            return business_days
        except Exception as e:
            logger.error(f"Error counting business days: {str(e)}")
            return (end_date - start_date).days

    def create_performance_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Create features based on performance metrics"""
        try:
            # Performance consistency (low standard deviation is better)
            if all(col in data.columns for col in ['delivery_score', 'quality_score', 'cost_score']):
                data['performance_consistency'] = data[[
                    'delivery_score', 'quality_score', 'cost_score'
                ]].std(axis=1)

            # Performance trend (improvement over time)
            if 'last_evaluation_date' in data.columns and 'overall_score' in data.columns:
                # In a real implementation, we would have historical data
                # For this example, we'll assume we have a performance trend score
                pass

            # Composite performance score
            if all(col in data.columns for col in ['delivery_score', 'quality_score', 'cost_score']):
                data['composite_performance'] = (
                    data['delivery_score'] * 0.4 +
                    data['quality_score'] * 0.3 +
                    data['cost_score'] * 0.3
                )

            # Performance to risk ratio
            if 'risk_level_encoded' in data.columns and 'composite_performance' in data.columns:
                data['performance_risk_ratio'] = (
                    data['composite_performance'] / (data['risk_level_encoded'] + 1)
                )

            return data

        except Exception as e:
            logger.error(f"Error creating performance features: {str(e)}")
            raise

    def create_risk_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Create features based on risk information"""
        try:
            # Encode risk level if not already encoded
            if 'risk_level' in data.columns and 'risk_level_encoded' not in data.columns:
                data['risk_level_encoded'] = data['risk_level'].map({
                    'Low': 0,
                    'Medium': 1,
                    'High': 2,
                    'Critical': 3
                })

            # Risk exposure (contract value * risk level)
            if 'contract_value' in data.columns and 'risk_level_encoded' in data.columns:
                data['risk_exposure'] = data['contract_value'] * data['risk_level_encoded']

            # Risk-adjusted performance
            if 'composite_performance' in data.columns and 'risk_level_encoded' in data.columns:
                data['risk_adjusted_performance'] = (
                    data['composite_performance'] / (data['risk_level_encoded'] + 1)
                )

            # Compliance-risk interaction
            if 'compliance_score' in data.columns and 'risk_level_encoded' in data.columns:
                data['compliance_risk_interaction'] = (
                    data['compliance_score'] * (4 - data['risk_level_encoded'])
                )

            return data

        except Exception as e:
            logger.error(f"Error creating risk features: {str(e)}")
            raise

    def create_contract_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Create features based on contract information"""
        try:
            # Contract value per month
            if 'contract_value' in data.columns and 'contract_duration' in data.columns:
                data['contract_value_per_month'] = (
                    data['contract_value'] / (data['contract_duration'] + 1)
                )

            # Contract value per business day
            if 'contract_value' in data.columns and 'contract_business_days' in data.columns:
                data['contract_value_per_business_day'] = (
                    data['contract_value'] / (data['contract_business_days'] + 1)
                )

            # Contract renewal probability (simplified)
            if 'days_until_expiration' in data.columns:
                data['renewal_probability'] = np.where(
                    data['days_until_expiration'] < 90,
                    0.9 - (data['days_until_expiration'] / 100),
                    0.1
                )

            # Contract age factor
            if 'contract_age_days' in data.columns:
                data['contract_age_factor'] = np.where(
                    data['contract_age_days'] < 365,
                    data['contract_age_days'] / 365,
                    1.0
                )

            return data

        except Exception as e:
            logger.error(f"Error creating contract features: {str(e)}")
            raise

    def create_interaction_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features between different dimensions"""
        try:
            # Performance-risk interaction
            if 'composite_performance' in data.columns and 'risk_level_encoded' in data.columns:
                data['performance_risk_interaction'] = (
                    data['composite_performance'] * (4 - data['risk_level_encoded'])
                )

            # Performance-contract interaction
            if 'composite_performance' in data.columns and 'contract_value' in data.columns:
                data['performance_contract_interaction'] = (
                    data['composite_performance'] * np.log1p(data['contract_value'])
                )

            # Risk-contract interaction
            if 'risk_level_encoded' in data.columns and 'contract_value' in data.columns:
                data['risk_contract_interaction'] = (
                    data['risk_level_encoded'] * np.log1p(data['contract_value'])
                )

            # Category-specific performance
            if 'category_id' in data.columns and 'composite_performance' in data.columns:
                # In a real implementation, we would have category benchmarks
                pass

            return data

        except Exception as e:
            logger.error(f"Error creating interaction features: {str(e)}")
            raise

    def encode_categorical_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical features"""
        try:
            # One-hot encode categorical features
            categorical_cols = [col for col in self.config.categorical_features if col in data.columns]

            if categorical_cols:
                data = pd.get_dummies(
                    data,
                    columns=categorical_cols,
                    drop_first=True,
                    dummy_na=False
                )

                # Update feature names in config
                for col in categorical_cols:
                    if col in data.columns:
                        # For binary features, we keep the original name
                        pass
                    else:
                        # For one-hot encoded features, we have new columns
                        new_cols = [c for c in data.columns if c.startswith(f"{col}_")]
                        self.config.categorical_features.extend(new_cols)
                        self.config.categorical_features.remove(col)

            return data

        except Exception as e:
            logger.error(f"Error encoding categorical features: {str(e)}")
            raise

    def scale_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Scale numerical features"""
        try:
            # Apply MinMax scaling
            for feature in self.config.min_max_scaler_features:
                if feature in data.columns and feature in self.scalers:
                    data[feature] = self.scalers[feature].transform(data[[feature]])

            # Apply Standard scaling
            for feature in self.config.standard_scaler_features:
                if feature in data.columns and feature in self.scalers:
                    data[feature] = self.scalers[feature].transform(data[[feature]])

            return data

        except Exception as e:
            logger.error(f"Error scaling features: {str(e)}")
            raise

    def create_derived_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Create derived features from existing ones"""
        try:
            # Vendor maturity score
            if all(col in data.columns for col in ['vendor_age', 'has_certification', 'compliance_score']):
                data['vendor_maturity'] = (
                    data['vendor_age'] * 0.4 +
                    data['has_certification'] * 20 +
                    data['compliance_score'] * 0.4
                )

            # Innovation potential
            if all(col in data.columns for col in ['innovation_score', 'vendor_age', 'contract_value']):
                data['innovation_potential'] = (
                    data['innovation_score'] * 0.5 +
                    np.log1p(data['contract_value']) * 0.3 +
                    (10 - data['vendor_age']) * 0.2
                )

            # Risk-adjusted value
            if all(col in data.columns for col in ['contract_value', 'risk_level_encoded', 'composite_performance']):
                data['risk_adjusted_value'] = (
                    data['contract_value'] *
                    data['composite_performance'] /
                    (data['risk_level_encoded'] + 1)
                )

            return data

        except Exception as e:
            logger.error(f"Error creating derived features: {str(e)}")
            raise

    def handle_outliers(self, data: pd.DataFrame) -> pd.DataFrame:
        """Handle outliers in numerical features"""
        try:
            numerical_cols = [col for col in self.config.numerical_features if col in data.columns]

            for col in numerical_cols:
                if col in data.columns:
                    q1 = data[col].quantile(0.25)
                    q3 = data[col].quantile(0.75)
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr

                    # Cap outliers
                    data[col] = np.where(data[col] < lower_bound, lower_bound, data[col])
                    data[col] = np.where(data[col] > upper_bound, upper_bound, data[col])

            return data

        except Exception as e:
            logger.error(f"Error handling outliers: {str(e)}")
            raise

    def get_feature_importance(self, model) -> Dict[str, float]:
        """Get feature importance from a trained model"""
        try:
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
            elif hasattr(model, 'coef_'):
                importances = model.coef_
            else:
                return {}

            # Get feature names after all transformations
            feature_names = self.get_feature_names()

            # Create importance dictionary
            importance_dict = {
                feature: importance
                for feature, importance in zip(feature_names, importances)
            }

            # Sort by importance
            sorted_importance = {
                k: v for k, v in sorted(
                    importance_dict.items(),
                    key=lambda item: item[1],
                    reverse=True
                )
            }

            return sorted_importance

        except Exception as e:
            logger.error(f"Error getting feature importance: {str(e)}")
            return {}

    def get_feature_names(self) -> List[str]:
        """Get list of all feature names after transformations"""
        try:
            # Start with numerical features
            feature_names = self.config.numerical_features.copy()

            # Add one-hot encoded categorical features
            for col in self.config.categorical_features:
                if '_' in col:  # This is likely a one-hot encoded feature
                    feature_names.append(col)

            # Add datetime features
            feature_names.extend(self.config.datetime_features)

            # Add any new features created during transformations
            additional_features = [
                'contract_duration_days', 'contract_business_days', 'contract_age_days',
                'days_until_expiration', 'days_since_evaluation', 'performance_consistency',
                'composite_performance', 'performance_risk_ratio', 'risk_exposure',
                'risk_adjusted_performance', 'compliance_risk_interaction',
                'contract_value_per_month', 'contract_value_per_business_day',
                'renewal_probability', 'contract_age_factor', 'performance_risk_interaction',
                'performance_contract_interaction', 'risk_contract_interaction',
                'vendor_maturity', 'innovation_potential', 'risk_adjusted_value'
            ]

            feature_names.extend([f for f in additional_features if f not in feature_names])

            return feature_names

        except Exception as e:
            logger.error(f"Error getting feature names: {str(e)}")
            return []

    def save_config(self, file_path: str):
        """Save feature engineering configuration to file"""
        try:
            with open(file_path, 'w') as f:
                json.dump(self.config.dict(), f, indent=2)
            logger.info(f"Configuration saved to {file_path}")
        except Exception as e:
            logger.error(f"Error saving configuration: {str(e)}")
            raise

    @classmethod
    def load_config(cls, file_path: str) -> 'FeatureEngineeringPipeline':
        """Load feature engineering configuration from file"""
        try:
            with open(file_path, 'r') as f:
                config_data = json.load(f)
            config = VendorFeatureConfig(**config_data)
            return cls(config)
        except Exception as e:
            logger.error(f"Error loading configuration: {str(e)}")
            raise

# Example usage
if __name__ == "__main__":
    # Sample data
    data = pd.DataFrame({
        'vendor_id': ['V001', 'V002', 'V003'],
        'category_id': ['CAT001', 'CAT002', 'CAT001'],
        'contract_value': [500000, 200000, 1000000],
        'contract_duration': [24, 12, 36],
        'contract_start_date': ['2022-01-01', '2022-06-01', '2021-11-01'],
        'contract_end_date': ['2023-12-31', '2023-05-31', '2024-10-31'],
        'delivery_score': [85, 75, 90],
        'quality_score': [90, 80, 95],
        'cost_score': [75, 85, 80],
        'innovation_score': [60, 70, 85],
        'risk_level': ['Medium', 'Low', 'High'],
        'compliance_score': [88, 92, 85],
        'on_time_delivery_rate': [0.95, 0.90, 0.98],
        'defect_rate': [0.02, 0.05, 0.01],
        'response_time': [24, 48, 12],
        'vendor_age': [5, 3, 10],
        'region': ['North America', 'Europe', 'Asia'],
        'has_certification': [1, 1, 0],
        'last_evaluation_date': ['2023-01-15', '2023-02-20', '2023-01-10'],
        'overall_score': [82, 78, 88]
    })

    # Initialize pipeline
    pipeline = FeatureEngineeringPipeline()

    # Fit scalers
    pipeline.fit_scalers(data)

    # Transform data
    transformed_data = pipeline.transform(data)

    print("Original data shape:", data.shape)
    print("Transformed data shape:", transformed_data.shape)
    print("\nTransformed data columns:", transformed_data.columns.tolist())
    print("\nSample transformed data:")
    print(transformed_data.head())

    # Save and load configuration
    pipeline.save_config('feature_config.json')
    loaded_pipeline = FeatureEngineeringPipeline.load_config('feature_config.json')
```

### Model Monitoring and Retraining

```python
# model_monitoring.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import mlflow
import mlflow.sklearn
from mlflow.entities import ViewType
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import logging
import os
import json
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ModelMonitoringConfig(BaseModel):
    """Configuration for model monitoring"""
    model_name: str = "VendorPerformanceModel"
    monitoring_frequency: str = "0 0 * * *"  # Daily at midnight
    data_drift_threshold: float = 0.15
    performance_degradation_threshold: float = 0.10
    min_samples_for_retraining: int = 100
    monitoring_window_days: int = 30
    alert_email_recipients: List[str] = ["data-science-team@example.com"]
    slack_webhook_url: Optional[str] = None
    mlflow_tracking_uri: str = "http://localhost:5000"
    production_model_stage: str = "Production"
    staging_model_stage: str = "Staging"

class ModelMonitor:
    def __init__(self, config: Optional[ModelMonitoringConfig] = None):
        self.config = config or ModelMonitoringConfig()
        self.scheduler = BackgroundScheduler()
        self.setup_mlflow()
        self.setup_scheduler()

    def setup_mlflow(self):
        """Set up MLflow connection"""
        try:
            mlflow.set_tracking_uri(self.config.mlflow_tracking_uri)
            logger.info(f"Connected to MLflow at {self.config.mlflow_tracking_uri}")
        except Exception as e:
            logger.error(f"Error setting up MLflow: {str(e)}")
            raise

    def setup_scheduler(self):
        """Set up background scheduler for monitoring tasks"""
        try:
            self.scheduler.add_job(
                self.run_monitoring,
                CronTrigger.from_crontab(self.config.monitoring_frequency),
                id="model_monitoring",
                name="Run model monitoring checks",
                replace_existing=True
            )

            self.scheduler.start()
            logger.info("Scheduler started for model monitoring")
        except Exception as e:
            logger.error(f"Error setting up scheduler: {str(e)}")
            raise

    def run_monitoring(self):
        """Run all monitoring checks"""
        try:
            logger.info("Starting model monitoring run")

            # 1. Check for data drift
            drift_detected = self.check_data_drift()
            if drift_detected:
                self.send_alert(
                    "Data Drift Detected",
                    f"Data drift detected in the input features. Consider retraining the model."
                )

            # 2. Check model performance
            performance_degraded = self.check_model_performance()
            if performance_degraded:
                self.send_alert(
                    "Model Performance Degradation",
                    f"Model performance has degraded significantly. Consider retraining the model."
                )

            # 3. Check for sufficient new data for retraining
            sufficient_data = self.check_sufficient_data()
            if sufficient_data:
                logger.info("Sufficient new data available for retraining")
                # In a real implementation, we would trigger retraining here
                # self.trigger_retraining()

            logger.info("Model monitoring run completed successfully")

        except Exception as e:
            logger.error(f"Error in model monitoring run: {str(e)}")
            self.send_alert(
                "Model Monitoring Failed",
                f"An error occurred during model monitoring: {str(e)}"
            )

    def check_data_drift(self) -> bool:
        """Check for data drift in input features"""
        try:
            logger.info("Checking for data drift")

            # Get production model
            production_model = self.get_latest_model(self.config.production_model_stage)
            if not production_model:
                logger.warning("No production model found")
                return False

            # Get training data statistics
            training_stats = self.get_training_data_stats(production_model.run_id)
            if not training_stats:
                logger.warning("No training data statistics found")
                return False

            # Get recent production data
            recent_data = self.get_recent_production_data()
            if recent_data.empty or len(recent_data) < 30:  # Minimum samples for meaningful comparison
                logger.warning("Not enough recent production data for drift detection")
                return False

            # Compare distributions
            drift_detected = False
            drift_report = []

            for feature in training_stats['features']:
                if feature not in recent_data.columns:
                    continue

                # Calculate statistical distance (simplified)
                train_mean = training_stats['feature_stats'][feature]['mean']
                train_std = training_stats['feature_stats'][feature]['std']
                recent_mean = recent_data[feature].mean()
                recent_std = recent_data[feature].std()

                # Calculate z-score for the difference in means
                if train_std > 0:
                    z_score = abs(recent_mean - train_mean) / train_std
                    if z_score > self.config.data_drift_threshold:
                        drift_detected = True
                        drift_report.append({
                            'feature': feature,
                            'train_mean': train_mean,
                            'recent_mean': recent_mean,
                            'train_std': train_std,
                            'recent_std': recent_std,
                            'z_score': z_score,
                            'threshold': self.config.data_drift_threshold
                        })

            if drift_detected:
                logger.warning(f"Data drift detected in {len(drift_report)} features")
                self.send_drift_report(drift_report)
                return True

            logger.info("No significant data drift detected")
            return False

        except Exception as e:
            logger.error(f"Error checking data drift: {str(e)}")
            raise

    def get_training_data_stats(self, run_id: str) -> Optional[Dict]:
        """Get training data statistics from MLflow"""
        try:
            # In a real implementation, we would log these stats during training
            # For this example, we'll assume they're stored as an artifact
            artifact_path = f"runs:/{run_id}/training_data_stats.json"
            try:
                stats = mlflow.artifacts.load_dict(artifact_path)
                return stats
            except:
                # If not found, return None
                return None
        except Exception as e:
            logger.error(f"Error getting training data stats: {str(e)}")
            return None

    def get_recent_production_data(self, days: int = None) -> pd.DataFrame:
        """Get recent production data for monitoring"""
        try:
            # In a real implementation, this would query the production database
            # For this example, we'll simulate getting data
            days = days or self.config.monitoring_window_days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)

            # Simulate getting data from a database or API
            # This is a placeholder - replace with actual data retrieval
            data = self.simulate_production_data(start_date, end_date)

            return data

        except Exception as e:
            logger.error(f"Error getting recent production data: {str(e)}")
            return pd.DataFrame()

    def simulate_production_data(self, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """Simulate production data for demonstration"""
        try:
            # Generate random data that might show some drift
            date_range = pd.date_range(start_date, end_date, freq='D')
            num_samples = len(date_range)

            # Base data
            data = pd.DataFrame({
                'contract_value': np.random.lognormal(mean=12, sigma=0.5, size=num_samples),
                'contract_duration': np.random.randint(6, 60, size=num_samples),
                'delivery_score': np.random.normal(80, 10, size=num_samples),
                'quality_score': np.random.normal(85, 8, size=num_samples),
                'cost_score': np.random.normal(75, 12, size=num_samples),
                'innovation_score': np.random.normal(65, 15, size=num_samples),
                'risk_level': np.random.choice(['Low', 'Medium', 'High'], size=num_samples, p=[0.5, 0.3, 0.2]),
                'compliance_score': np.random.normal(90, 5, size=num_samples),
                'on_time_delivery_rate': np.random.beta(5, 1, size=num_samples),
                'defect_rate': np.random.beta(1, 10, size=num_samples),
                'response_time': np.random.exponential(24, size=num_samples),
                'vendor_age': np.random.randint(1, 20, size=num_samples),
                'region': np.random.choice(['North America', 'Europe', 'Asia', 'Other'], size=num_samples),
                'has_certification': np.random.randint(0, 2, size=num_samples),
                'timestamp': date_range
            })

            # Introduce some drift for demonstration
            if (datetime.now() - start_date).days > 15:
                # After 15 days, introduce some drift
                data.loc[data['timestamp'] > start_date + timedelta(days=15), 'contract_value'] *= 1.2
                data.loc[data['timestamp'] > start_date + timedelta(days=15), 'delivery_score'] *= 0.95
                data.loc[data['timestamp'] > start_date + timedelta(days=15), 'risk_level'] = np.random.choice(
                    ['Low', 'Medium', 'High'], size=len(data[data['timestamp'] > start_date + timedelta(days=15)]), p=[0.3, 0.4, 0.3]
                )

            return data

        except Exception as e:
            logger.error(f"Error simulating production data: {str(e)}")
            return pd.DataFrame()

    def check_model_performance(self) -> bool:
        """Check if model performance has degraded"""
        try:
            logger.info("Checking model performance")

            # Get production model
            production_model = self.get_latest_model(self.config.production_model_stage)
            if not production_model:
                logger.warning("No production model found")
                return False

            # Get recent production data with actual outcomes
            recent_data = self.get_recent_production_data_with_outcomes()
            if recent_data.empty or len(recent_data) < 30:
                logger.warning("Not enough recent production data with outcomes for performance check")
                return False

            # Get actual and predicted values
            X = recent_data.drop(columns=['overall_score', 'timestamp'])
            y = recent_data['overall_score']

            # Load the model
            model = mlflow.sklearn.load_model(production_model.source)

            # Make predictions
            y_pred = model.predict(X)

            # Calculate current performance metrics
            current_mae = mean_absolute_error(y, y_pred)
            current_mse = mean_squared_error(y, y_pred)
            current_r2 = r2_score(y, y_pred)

            # Get training performance metrics
            training_metrics = self.get_training_metrics(production_model.run_id)
            if not training_metrics:
                logger.warning("No training metrics found")
                return False

            # Compare performance
            performance_degraded = False
            performance_report = {
                'current_mae': current_mae,
                'training_mae': training_metrics['mae'],
                'mae_degradation': (current_mae - training_metrics['mae']) / training_metrics['mae'],
                'current_mse': current_mse,
                'training_mse': training_metrics['mse'],
                'mse_degradation': (current_mse - training_metrics['mse']) / training_metrics['mse'],
                'current_r2': current_r2,
                'training_r2': training_metrics['r2'],
                'r2_degradation': (training_metrics['r2'] - current_r2) / training_metrics['r2'],
                'threshold': self.config.performance_degradation_threshold
            }

            # Check if degradation exceeds threshold
           