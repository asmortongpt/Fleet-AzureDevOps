# TO_BE_DESIGN.md - Safety Incident Management System
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Author:** Enterprise Architecture Team

---

## Executive Vision (120+ lines)

### Strategic Vision for Safety Incident Management Transformation

The next-generation Safety Incident Management System (SIMS) represents a paradigm shift in how organizations prevent, respond to, and learn from safety incidents. This transformation goes beyond incremental improvements to create a comprehensive ecosystem that integrates real-time monitoring, predictive analytics, and collaborative response capabilities.

**Core Transformation Goals:**

1. **Proactive Safety Culture:** Shift from reactive incident reporting to predictive safety management through AI-driven risk identification and prevention
2. **Real-Time Operational Awareness:** Provide immediate visibility into safety incidents with live dashboards and automated escalation pathways
3. **Data-Driven Decision Making:** Transform incident data into actionable insights through advanced analytics and machine learning
4. **Cross-Functional Collaboration:** Break down silos between safety teams, operations, and leadership with unified communication platforms
5. **Regulatory Excellence:** Ensure compliance with evolving safety regulations through automated reporting and audit trails

### Business Value Proposition

**Operational Efficiency:**
- Reduce incident response time by 60% through automated workflows and real-time notifications
- Decrease administrative overhead by 40% with automated reporting and documentation
- Improve incident resolution rates by 35% through predictive maintenance and risk mitigation

**Financial Impact:**
- Projected 25% reduction in safety-related costs through prevention and early intervention
- 15% decrease in insurance premiums through demonstrated safety improvements
- 20% increase in operational uptime through predictive incident prevention

**Strategic Advantages:**
- Position as industry leader in safety innovation
- Create competitive differentiation through superior safety performance
- Enhance brand reputation and stakeholder trust

### User Experience Transformation

**Unified Workflow Experience:**
- Single sign-on access to all safety management functions
- Context-aware interfaces that adapt to user roles and responsibilities
- Seamless transition between desktop and mobile experiences

**Intelligent Assistance:**
- AI-powered incident classification and severity assessment
- Contextual recommendations for incident response
- Predictive suggestions for preventive actions

**Collaborative Features:**
- Real-time team coordination during incidents
- Shared documentation and communication spaces
- Integrated video conferencing for remote assistance

### Competitive Differentiation

**Industry-First Capabilities:**
1. **Predictive Incident Prevention:** AI models that identify potential safety risks before they materialize
2. **Augmented Reality Guidance:** AR overlays for incident response procedures
3. **Autonomous Drones:** AI-powered drones for remote incident assessment
4. **Digital Twin Integration:** Virtual representation of physical environments for risk simulation
5. **Blockchain Verification:** Immutable records for regulatory compliance and audits

**Market Positioning:**
- "The world's most intelligent safety management platform"
- "Proactive safety through predictive intelligence"
- "From compliance to competitive advantage"

### Long-Term Roadmap (2024-2027)

**Phase 1: Foundation (2024)**
- Core platform migration to microservices architecture
- Real-time incident reporting and basic analytics
- Mobile application with offline capabilities
- Initial AI/ML integration for incident classification

**Phase 2: Intelligence (2025)**
- Advanced predictive analytics for risk identification
- Computer vision integration for hazard detection
- Automated regulatory reporting
- Voice-enabled incident reporting

**Phase 3: Autonomy (2026)**
- Autonomous incident response systems
- Self-learning safety models
- Digital twin integration for risk simulation
- Blockchain for audit trails and compliance

**Phase 4: Ecosystem (2027)**
- Industry-wide safety data consortium
- API marketplace for third-party integrations
- Global safety standards compliance engine
- AI-powered safety training and certification

### Organizational Impact

**Cultural Transformation:**
- Shift from "safety as compliance" to "safety as competitive advantage"
- Empower frontline workers with real-time safety intelligence
- Create safety champions through gamification and recognition

**Process Evolution:**
- Automate 80% of routine safety reporting
- Implement closed-loop incident management
- Establish continuous improvement cycles

**Technology Foundation:**
- Cloud-native architecture for global scalability
- API-first design for ecosystem integration
- AI/ML at the core of all safety processes

### Success Metrics

**Quantitative KPIs:**
1. 50% reduction in recordable incident rate
2. 40% improvement in near-miss reporting
3. 30% decrease in lost time incidents
4. 25% reduction in workers' compensation claims
5. 20% improvement in safety culture survey scores

**Qualitative Outcomes:**
- Industry recognition as safety leader
- Increased employee engagement in safety programs
- Enhanced community and stakeholder trust
- Improved regulatory relationships

### Implementation Strategy

**Phased Rollout:**
1. Pilot with high-risk operations (Q1 2024)
2. Full deployment across primary facilities (Q3 2024)
3. Global expansion (2025)
4. Ecosystem development (2026+)

**Change Management:**
- Executive sponsorship program
- Safety ambassador network
- Comprehensive training curriculum
- Continuous feedback loops

**Risk Mitigation:**
- Parallel operation with legacy systems during transition
- Comprehensive data migration strategy
- Dedicated support team for first 12 months
- Regular performance reviews and adjustments

---

## Performance Enhancements (300+ lines)

### Comprehensive Performance Optimization Strategy

The performance enhancements for the Safety Incident Management System focus on six key areas: caching, database optimization, network efficiency, resource management, client-side performance, and system monitoring. Each component is designed to work together to create a responsive, scalable system capable of handling high-volume incident reporting and real-time analytics.

### Redis Caching Layer Implementation

```typescript
// services/cache/redis-cache.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Logger } from '../logger/logger.service';
import { CacheKeyGenerator } from './cache-key-generator.service';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly DEFAULT_TTL = 300; // 5 minutes default cache TTL
  private readonly LONG_TTL = 86400; // 24 hours for long-lived data

  constructor(
    private configService: ConfigService,
    private keyGenerator: CacheKeyGenerator,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisPort = this.configService.get<number>('REDIS_PORT');
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    this.redisClient = new Redis({
      host: redisUrl,
      port: redisPort,
      password: redisPassword,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(`Redis connection retry attempt ${times}, next in ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        this.logger.error(`Redis reconnection error: ${err.message}`);
        return true;
      },
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis client connected successfully');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  /**
   * Get cached value with automatic fallback to source
   * @param key - Cache key
   * @param fallback - Function to call when cache misses
   * @param ttl - Time to live in seconds
   * @returns Promise with cached or fresh data
   */
  async getWithFallback<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    try {
      const cachedData = await this.redisClient.get(key);
      if (cachedData) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(cachedData) as T;
      }

      this.logger.debug(`Cache miss for key: ${key}, fetching fresh data`);
      const freshData = await fallback();
      await this.set(key, freshData, ttl);
      return freshData;
    } catch (error) {
      this.logger.error(`Cache operation failed for key ${key}: ${error.message}`);
      // Fallback to direct fetch if cache fails
      return await fallback();
    }
  }

  /**
   * Set cache value with optional TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds
   */
  async set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await this.redisClient.setex(key, ttl, stringValue);
      this.logger.debug(`Cache set for key: ${key} with TTL ${ttl}s`);
    } catch (error) {
      this.logger.error(`Failed to set cache for key ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete cache entry
   * @param key - Cache key to delete
   */
  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache for key ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cache incident data with automatic key generation
   * @param incidentId - Incident ID
   * @param data - Incident data to cache
   * @param ttl - Time to live in seconds
   */
  async cacheIncident(incidentId: string, data: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const key = this.keyGenerator.generateIncidentKey(incidentId);
    await this.set(key, data, ttl);
  }

  /**
   * Get cached incident data
   * @param incidentId - Incident ID
   * @param fallback - Function to fetch fresh data
   * @returns Promise with incident data
   */
  async getIncident(
    incidentId: string,
    fallback: () => Promise<any>,
  ): Promise<any> {
    const key = this.keyGenerator.generateIncidentKey(incidentId);
    return this.getWithFallback(key, fallback);
  }

  /**
   * Cache incident list with pagination
   * @param query - Query parameters
   * @param data - Incident list data
   * @param ttl - Time to live in seconds
   */
  async cacheIncidentList(query: any, data: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const key = this.keyGenerator.generateIncidentListKey(query);
    await this.set(key, data, ttl);
  }

  /**
   * Get cached incident list
   * @param query - Query parameters
   * @param fallback - Function to fetch fresh data
   * @returns Promise with incident list data
   */
  async getIncidentList(
    query: any,
    fallback: () => Promise<any>,
  ): Promise<any> {
    const key = this.keyGenerator.generateIncidentListKey(query);
    return this.getWithFallback(key, fallback, 60); // Shorter TTL for lists
  }

  /**
   * Invalidate all incident-related caches
   * @param incidentId - Incident ID to invalidate
   */
  async invalidateIncidentCache(incidentId: string): Promise<void> {
    try {
      const incidentKey = this.keyGenerator.generateIncidentKey(incidentId);
      const listKeys = await this.redisClient.keys(
        this.keyGenerator.generateIncidentListKeyPattern(incidentId),
      );

      const keysToDelete = [incidentKey, ...listKeys];
      if (keysToDelete.length > 0) {
        await this.redisClient.del(keysToDelete);
        this.logger.debug(`Invalidated ${keysToDelete.length} cache entries for incident ${incidentId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate cache for incident ${incidentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get cache statistics
   * @returns Promise with cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: string }> {
    try {
      const keys = await this.redisClient.dbsize();
      const memory = await this.redisClient.info('memory');
      const usedMemory = memory.split('\n').find(line => line.startsWith('used_memory:'));
      return {
        keys,
        memory: usedMemory ? usedMemory.split(':')[1].trim() : 'unknown',
      };
    } catch (error) {
      this.logger.error(`Failed to get cache stats: ${error.message}`);
      throw error;
    }
  }
}
```

### Database Query Optimization

```typescript
// repositories/incident.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Incident } from '../entities/incident.entity';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentSeverity } from '../enums/incident-severity.enum';
import { PaginationDto } from '../dto/pagination.dto';
import { Logger } from '../logger/logger.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { IncidentFilterDto } from '../dto/incident-filter.dto';

@Injectable()
export class IncidentRepository {
  private readonly logger = new Logger(IncidentRepository.name);

  constructor(
    @InjectRepository(Incident)
    private readonly repository: Repository<Incident>,
    private readonly cacheService: RedisCacheService,
  ) {}

  /**
   * Optimized incident listing with complex filtering and pagination
   * @param filter - Filter criteria
   * @param pagination - Pagination parameters
   * @returns Promise with paginated results
   */
  async findAllOptimized(
    filter: IncidentFilterDto,
    pagination: PaginationDto,
  ): Promise<{ data: Incident[]; total: number }> {
    const cacheKey = this.generateCacheKey(filter, pagination);

    return this.cacheService.getWithFallback(
      cacheKey,
      async () => {
        const query = this.createBaseQuery();

        // Apply filters with optimized query building
        this.applyStatusFilter(query, filter.status);
        this.applySeverityFilter(query, filter.severity);
        this.applyDateRangeFilter(query, filter.startDate, filter.endDate);
        this.applyLocationFilter(query, filter.locationId);
        this.applySearchFilter(query, filter.search);

        // Get total count for pagination
        const [data, total] = await Promise.all([
          this.executePaginatedQuery(query, pagination),
          query.getCount(),
        ]);

        return { data, total };
      },
      60, // Cache for 1 minute
    );
  }

  /**
   * Create base query with optimized joins and selects
   * @returns SelectQueryBuilder for Incident
   */
  private createBaseQuery(): SelectQueryBuilder<Incident> {
    return this.repository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.reporter', 'reporter')
      .leftJoinAndSelect('incident.location', 'location')
      .leftJoinAndSelect('incident.department', 'department')
      .leftJoinAndSelect('incident.incidentType', 'incidentType')
      .leftJoinAndSelect('incident.attachments', 'attachments')
      .leftJoinAndSelect('incident.actions', 'actions')
      .leftJoinAndSelect('incident.comments', 'comments', 'comments.isDeleted = :isDeleted', { isDeleted: false })
      .select([
        'incident.id',
        'incident.title',
        'incident.description',
        'incident.status',
        'incident.severity',
        'incident.reportedAt',
        'incident.resolvedAt',
        'incident.createdAt',
        'incident.updatedAt',
        'reporter.id',
        'reporter.firstName',
        'reporter.lastName',
        'reporter.email',
        'location.id',
        'location.name',
        'location.address',
        'department.id',
        'department.name',
        'incidentType.id',
        'incidentType.name',
        'attachments.id',
        'attachments.fileName',
        'attachments.fileType',
        'attachments.url',
        'actions.id',
        'actions.description',
        'actions.status',
        'actions.dueDate',
        'comments.id',
        'comments.content',
        'comments.createdAt',
        'comments.updatedAt',
        'comments.userId',
      ])
      .orderBy('incident.reportedAt', 'DESC');
  }

  /**
   * Apply status filter with optimized query conditions
   * @param query - Query builder
   * @param status - Status filter
   */
  private applyStatusFilter(
    query: SelectQueryBuilder<Incident>,
    status?: IncidentStatus[],
  ): void {
    if (status && status.length > 0) {
      query.andWhere('incident.status IN (:...status)', { status });
    }
  }

  /**
   * Apply severity filter with optimized query conditions
   * @param query - Query builder
   * @param severity - Severity filter
   */
  private applySeverityFilter(
    query: SelectQueryBuilder<Incident>,
    severity?: IncidentSeverity[],
  ): void {
    if (severity && severity.length > 0) {
      query.andWhere('incident.severity IN (:...severity)', { severity });
    }
  }

  /**
   * Apply date range filter with optimized query conditions
   * @param query - Query builder
   * @param startDate - Start date
   * @param endDate - End date
   */
  private applyDateRangeFilter(
    query: SelectQueryBuilder<Incident>,
    startDate?: Date,
    endDate?: Date,
  ): void {
    if (startDate && endDate) {
      query.andWhere('incident.reportedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      query.andWhere('incident.reportedAt >= :startDate', { startDate });
    } else if (endDate) {
      query.andWhere('incident.reportedAt <= :endDate', { endDate });
    }
  }

  /**
   * Apply location filter with optimized query conditions
   * @param query - Query builder
   * @param locationId - Location ID
   */
  private applyLocationFilter(
    query: SelectQueryBuilder<Incident>,
    locationId?: string,
  ): void {
    if (locationId) {
      query.andWhere('incident.locationId = :locationId', { locationId });
    }
  }

  /**
   * Apply search filter with full-text search optimization
   * @param query - Query builder
   * @param search - Search term
   */
  private applySearchFilter(
    query: SelectQueryBuilder<Incident>,
    search?: string,
  ): void {
    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('incident.title ILIKE :search', { search: `%${search}%` })
            .orWhere('incident.description ILIKE :search', { search: `%${search}%` })
            .orWhere('reporter.firstName ILIKE :search', { search: `%${search}%` })
            .orWhere('reporter.lastName ILIKE :search', { search: `%${search}%` })
            .orWhere('location.name ILIKE :search', { search: `%${search}%` })
            .orWhere('incidentType.name ILIKE :search', { search: `%${search}%` });
        }),
      );
    }
  }

  /**
   * Execute paginated query with optimized limits
   * @param query - Query builder
   * @param pagination - Pagination parameters
   * @returns Promise with query results
   */
  private async executePaginatedQuery(
    query: SelectQueryBuilder<Incident>,
    pagination: PaginationDto,
  ): Promise<Incident[]> {
    return query
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getMany();
  }

  /**
   * Generate cache key for incident list queries
   * @param filter - Filter criteria
   * @param pagination - Pagination parameters
   * @returns Cache key string
   */
  private generateCacheKey(
    filter: IncidentFilterDto,
    pagination: PaginationDto,
  ): string {
    const parts = [
      'incident_list',
      filter.status?.join(',') || 'all',
      filter.severity?.join(',') || 'all',
      filter.startDate?.toISOString() || 'none',
      filter.endDate?.toISOString() || 'none',
      filter.locationId || 'all',
      filter.search || 'none',
      pagination.page,
      pagination.limit,
    ];
    return parts.join('|');
  }

  /**
   * Find incident by ID with optimized eager loading
   * @param id - Incident ID
   * @returns Promise with incident or null
   */
  async findByIdOptimized(id: string): Promise<Incident | null> {
    return this.cacheService.getIncident(id, async () => {
      return this.repository.findOne({
        where: { id },
        relations: [
          'reporter',
          'location',
          'department',
          'incidentType',
          'attachments',
          'actions',
          'comments',
          'comments.user',
        ],
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          severity: true,
          reportedAt: true,
          resolvedAt: true,
          createdAt: true,
          updatedAt: true,
          reporter: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
          location: {
            id: true,
            name: true,
            address: true,
            coordinates: true,
          },
          department: {
            id: true,
            name: true,
          },
          incidentType: {
            id: true,
            name: true,
            description: true,
          },
          attachments: {
            id: true,
            fileName: true,
            fileType: true,
            url: true,
            size: true,
            createdAt: true,
          },
          actions: {
            id: true,
            description: true,
            status: true,
            dueDate: true,
            assignedTo: {
              id: true,
              firstName: true,
              lastName: true,
            },
            completedAt: true,
          },
          comments: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });
  }

  /**
   * Optimized incident creation with transaction support
   * @param incidentData - Incident data
   * @returns Promise with created incident
   */
  async createOptimized(incidentData: Partial<Incident>): Promise<Incident> {
    return this.repository.manager.transaction(async (transactionalEntityManager) => {
      const incident = this.repository.create(incidentData);
      const savedIncident = await transactionalEntityManager.save(incident);

      // Invalidate cache for incident lists
      await this.cacheService.del(this.generateCacheKey({}, { page: 1, limit: 10 }));

      return savedIncident;
    });
  }

  /**
   * Optimized incident update with selective field updates
   * @param id - Incident ID
   * @param updateData - Update data
   * @returns Promise with updated incident
   */
  async updateOptimized(id: string, updateData: Partial<Incident>): Promise<Incident> {
    return this.repository.manager.transaction(async (transactionalEntityManager) => {
      // Get current incident to determine what changed
      const currentIncident = await transactionalEntityManager.findOne(Incident, {
        where: { id },
        select: ['id', 'status', 'severity', 'resolvedAt'],
      });

      if (!currentIncident) {
        throw new Error('Incident not found');
      }

      // Only update fields that have changed
      const fieldsToUpdate: Partial<Incident> = {};
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== currentIncident[key]) {
          fieldsToUpdate[key] = updateData[key];
        }
      });

      if (Object.keys(fieldsToUpdate).length === 0) {
        return currentIncident;
      }

      // Update only changed fields
      await transactionalEntityManager.update(Incident, id, fieldsToUpdate);

      // Get updated incident
      const updatedIncident = await transactionalEntityManager.findOne(Incident, {
        where: { id },
        relations: ['reporter', 'location', 'department', 'incidentType'],
      });

      // Invalidate cache for this incident and related lists
      await this.cacheService.invalidateIncidentCache(id);

      return updatedIncident;
    });
  }

  /**
   * Optimized bulk status update with transaction support
   * @param ids - Incident IDs
   * @param status - New status
   * @returns Promise with number of updated incidents
   */
  async bulkUpdateStatus(ids: string[], status: IncidentStatus): Promise<number> {
    return this.repository.manager.transaction(async (transactionalEntityManager) => {
      const result = await transactionalEntityManager.update(
        Incident,
        { id: In(ids) },
        { status, updatedAt: new Date() },
      );

      // Invalidate cache for all affected incidents
      await Promise.all(ids.map(id => this.cacheService.invalidateIncidentCache(id)));

      return result.affected || 0;
    });
  }

  /**
   * Optimized incident statistics query
   * @param filter - Filter criteria
   * @returns Promise with statistics
   */
  async getStatistics(filter: IncidentFilterDto): Promise<any> {
    const cacheKey = `incident_stats:${this.generateCacheKey(filter, { page: 1, limit: 1 })}`;

    return this.cacheService.getWithFallback(
      cacheKey,
      async () => {
        const query = this.createBaseQuery();

        this.applyStatusFilter(query, filter.status);
        this.applySeverityFilter(query, filter.severity);
        this.applyDateRangeFilter(query, filter.startDate, filter.endDate);
        this.applyLocationFilter(query, filter.locationId);

        // Get counts by status
        const statusCounts = await query
          .select('incident.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .groupBy('incident.status')
          .getRawMany();

        // Get counts by severity
        const severityCounts = await query
          .select('incident.severity', 'severity')
          .addSelect('COUNT(*)', 'count')
          .groupBy('incident.severity')
          .getRawMany();

        // Get counts by time period
        const timeCounts = await query
          .select("DATE_TRUNC('month', incident.reportedAt)", 'period')
          .addSelect('COUNT(*)', 'count')
          .groupBy("DATE_TRUNC('month', incident.reportedAt)")
          .orderBy('period')
          .getRawMany();

        // Get average resolution time
        const resolutionTime = await query
          .select('AVG(EXTRACT(EPOCH FROM (incident.resolvedAt - incident.reportedAt)))', 'avgResolutionTime')
          .where('incident.resolvedAt IS NOT NULL')
          .getRawOne();

        return {
          total: await query.getCount(),
          statusCounts: statusCounts.reduce((acc, item) => {
            acc[item.status] = parseInt(item.count);
            return acc;
          }, {}),
          severityCounts: severityCounts.reduce((acc, item) => {
            acc[item.severity] = parseInt(item.count);
            return acc;
          }, {}),
          timeCounts: timeCounts.map(item => ({
            period: item.period,
            count: parseInt(item.count),
          })),
          avgResolutionTime: resolutionTime.avgResolutionTime
            ? parseFloat(resolutionTime.avgResolutionTime)
            : null,
        };
      },
      300, // Cache for 5 minutes
    );
  }
}
```

### API Response Compression

```typescript
// middleware/response-compression.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ResponseCompressionMiddleware.name);
  private readonly compressionMiddleware: any;

  constructor(private configService: ConfigService) {
    const compressionOptions = {
      level: this.configService.get<number>('COMPRESSION_LEVEL', 6),
      threshold: this.configService.get<number>('COMPRESSION_THRESHOLD', 1024),
      filter: (req: Request, res: Response) => {
        // Don't compress responses that are already compressed
        if (res.getHeader('Content-Encoding')) {
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

        return compression.filter(req, res);
      },
    };

    this.compressionMiddleware = compression(compressionOptions);
  }

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Set compression headers
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('X-Content-Encoding', 'gzip');

      // Apply compression middleware
      this.compressionMiddleware(req, res, next);
    } catch (error) {
      this.logger.error(`Response compression error: ${error.message}`);
      next();
    }
  }
}

// middleware/response-optimization.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger/logger.service';

@Injectable()
export class ResponseOptimizationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ResponseOptimizationMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Set performance headers
    res.setHeader('X-Response-Time', `${Date.now() - req.startTime}ms`);
    res.setHeader('Server-Timing', this.getServerTimingHeader(req));

    // Optimize JSON responses
    const originalJson = res.json;
    res.json = (body: any) => {
      // Add performance metrics to response
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        body._performance = {
          responseTime: `${Date.now() - req.startTime}ms`,
          timestamp: new Date().toISOString(),
        };
      }

      // Apply response optimization
      const optimizedBody = this.optimizeResponse(body);

      return originalJson.call(res, optimizedBody);
    };

    next();
  }

  /**
   * Optimize response body for performance
   * @param body - Response body
   * @returns Optimized response body
   */
  private optimizeResponse(body: any): any {
    if (!body) return body;

    // Handle paginated responses
    if (body.data && body.total !== undefined) {
      return {
        data: this.optimizeData(body.data),
        total: body.total,
        page: body.page,
        limit: body.limit,
        _performance: body._performance,
      };
    }

    // Handle array responses
    if (Array.isArray(body)) {
      return this.optimizeData(body);
    }

    // Handle object responses
    if (typeof body === 'object') {
      return this.optimizeObject(body);
    }

    return body;
  }

  /**
   * Optimize data array
   * @param data - Data array
   * @returns Optimized data array
   */
  private optimizeData(data: any[]): any[] {
    if (!data || data.length === 0) return data;

    return data.map(item => this.optimizeObject(item));
  }

  /**
   * Optimize object by removing null/undefined values and optimizing nested objects
   * @param obj - Object to optimize
   * @returns Optimized object
   */
  private optimizeObject(obj: any): any {
    if (!obj) return obj;

    const optimized: any = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // Skip null and undefined values
        if (value === null || value === undefined) {
          continue;
        }

        // Skip internal properties
        if (key.startsWith('_')) {
          continue;
        }

        // Optimize nested objects
        if (typeof value === 'object' && !Array.isArray(value)) {
          optimized[key] = this.optimizeObject(value);
        }
        // Optimize arrays
        else if (Array.isArray(value)) {
          optimized[key] = this.optimizeData(value);
        }
        // Keep primitive values
        else {
          optimized[key] = value;
        }
      }
    }

    return optimized;
  }

  /**
   * Generate Server-Timing header
   * @param req - Request object
   * @returns Server-Timing header string
   */
  private getServerTimingHeader(req: Request): string {
    const timing = [
      `db;dur=${req.dbTime || 0}`,
      `cache;dur=${req.cacheTime || 0}`,
      `total;dur=${Date.now() - req.startTime}`,
    ];

    return timing.join(', ');
  }
}
```

### Lazy Loading Implementation

```typescript
// directives/lazy-load.directive.ts
import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { IntersectionObserverService } from '../services/intersection-observer.service';
import { Logger } from '../services/logger.service';

@Directive({
  selector: '[appLazyLoad]',
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input() appLazyLoad: string = '';
  @Input() lazyLoadThreshold: number = 0.1;
  @Input() lazyLoadRootMargin: string = '0px';
  @Input() lazyLoadOnce: boolean = true;

  private observer: IntersectionObserver | null = null;
  private hasLoaded: boolean = false;
  private logger = new Logger(LazyLoadDirective.name);

  constructor(
    private el: ElementRef,
    private intersectionObserverService: IntersectionObserverService,
  ) {}

  ngOnInit(): void {
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.cleanupObserver();
  }

  private setupObserver(): void {
    try {
      // Get the root element (default to viewport)
      const root = this.intersectionObserverService.getRootElement();

      // Create intersection observer options
      const options: IntersectionObserverInit = {
        root,
        rootMargin: this.lazyLoadRootMargin,
        threshold: this.lazyLoadThreshold,
      };

      // Create observer
      this.observer = new IntersectionObserver((entries) => {
        this.handleIntersection(entries);
      }, options);

      // Start observing
      this.observer.observe(this.el.nativeElement);
    } catch (error) {
      this.logger.error(`Failed to setup lazy load observer: ${error.message}`);
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !this.hasLoaded) {
        this.loadContent();
        if (this.lazyLoadOnce) {
          this.cleanupObserver();
        }
      }
    });
  }

  private loadContent(): void {
    try {
      if (this.appLazyLoad) {
        // For images
        if (this.el.nativeElement.tagName === 'IMG') {
          this.el.nativeElement.src = this.appLazyLoad;
          this.el.nativeElement.onload = () => {
            this.logger.debug(`Lazy loaded image: ${this.appLazyLoad}`);
          };
        }
        // For other elements (like iframes, components, etc.)
        else {
          this.el.nativeElement.innerHTML = this.appLazyLoad;
          this.logger.debug(`Lazy loaded content: ${this.appLazyLoad.substring(0, 50)}...`);
        }
      } else {
        // For components that need to be loaded
        this.el.nativeElement.style.display = 'block';
        this.logger.debug('Lazy loaded component');
      }

      this.hasLoaded = true;
    } catch (error) {
      this.logger.error(`Failed to load lazy content: ${error.message}`);
    }
  }

  private cleanupObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// services/lazy-load.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Logger } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class LazyLoadService {
  private readonly logger = new Logger(LazyLoadService.name);
  private loadedComponents: Set<string> = new Set();
  private loadQueue: Map<string, Promise<any>> = new Map();
  private loadSubjects: Map<string, BehaviorSubject<boolean>> = new Map();

  /**
   * Load a component lazily
   * @param componentName - Name of the component to load
   * @param loadFn - Function to load the component
   * @returns Observable that emits when loading is complete
   */
  loadComponent<T>(componentName: string, loadFn: () => Promise<T>): Observable<boolean> {
    // Return existing subject if component is already loading
    if (this.loadSubjects.has(componentName)) {
      return this.loadSubjects.get(componentName)!.asObservable();
    }

    // Create new subject for this component
    const subject = new BehaviorSubject<boolean>(false);
    this.loadSubjects.set(componentName, subject);

    // Check if already loaded
    if (this.loadedComponents.has(componentName)) {
      subject.next(true);
      subject.complete();
      this.loadSubjects.delete(componentName);
      return subject.asObservable();
    }

    // Check if already in queue
    if (this.loadQueue.has(componentName)) {
      return subject.asObservable();
    }

    // Create loading promise
    const loadPromise = loadFn()
      .then((module) => {
        this.loadedComponents.add(componentName);
        subject.next(true);
        subject.complete();
        this.logger.debug(`Successfully loaded component: ${componentName}`);
        return module;
      })
      .catch((error) => {
        subject.error(error);
        this.logger.error(`Failed to load component ${componentName}: ${error.message}`);
        throw error;
      })
      .finally(() => {
        this.loadQueue.delete(componentName);
        this.loadSubjects.delete(componentName);
      });

    this.loadQueue.set(componentName, loadPromise);

    return subject.asObservable();
  }

  /**
   * Check if a component is already loaded
   * @param componentName - Name of the component
   * @returns True if component is loaded
   */
  isComponentLoaded(componentName: string): boolean {
    return this.loadedComponents.has(componentName);
  }

  /**
   * Preload components in the background
   * @param componentNames - Array of component names to preload
   * @param loadFnMap - Map of component names to load functions
   */
  preloadComponents(componentNames: string[], loadFnMap: Map<string, () => Promise<any>>): void {
    componentNames.forEach((componentName) => {
      if (!this.loadedComponents.has(componentName) && !this.loadQueue.has(componentName)) {
        const loadFn = loadFnMap.get(componentName);
        if (loadFn) {
          this.loadComponent(componentName, loadFn).subscribe({
            next: () => {},
            error: (error) => {
              this.logger.warn(`Failed to preload component ${componentName}: ${error.message}`);
            },
          });
        }
      }
    });
  }

  /**
   * Get loading progress
   * @returns Progress percentage (0-100)
   */
  getLoadingProgress(): number {
    const total = this.loadSubjects.size + this.loadQueue.size;
    const loaded = this.loadedComponents.size;
    return total > 0 ? Math.round((loaded / total) * 100) : 100;
  }
}

// components/lazy-load-container/lazy-load-container.component.ts
import { Component, Input, OnInit, OnDestroy, ComponentRef, ViewChild, ViewContainerRef } from '@angular/core';
import { LazyLoadService } from '../../services/lazy-load.service';
import { Logger } from '../../services/logger.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lazy-load-container',
  template: '<ng-container #container></ng-container>',
})
export class LazyLoadContainerComponent implements OnInit, OnDestroy {
  @Input() componentName: string = '';
  @Input() componentInput: any = null;
  @Input() preload: boolean = false;
  @Input() fallback: string = '<div class="loading-spinner"></div>';

  @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;

  private componentRef: ComponentRef<any> | null = null;
  private loadSubscription: Subscription | null = null;
  private logger = new Logger(LazyLoadContainerComponent.name);

  constructor(private lazyLoadService: LazyLoadService) {}

  ngOnInit(): void {
    if (this.preload) {
      this.preloadComponent();
    } else {
      this.loadComponent();
    }
  }

  ngOnDestroy(): void {
    this.cleanupComponent();
    if (this.loadSubscription) {
      this.loadSubscription.unsubscribe();
    }
  }

  private preloadComponent(): void {
    if (!this.componentName) return;

    // Define load function based on component name
    const loadFn = this.getLoadFunction(this.componentName);

    if (loadFn) {
      this.lazyLoadService.preloadComponents([this.componentName], new Map([[this.componentName, loadFn]]));
    }
  }

  private loadComponent(): void {
    if (!this.componentName) {
      this.logger.warn('No component name provided for lazy loading');
      return;
    }

    // Show fallback content while loading
    this.container.clear();
    this.container.element.nativeElement.innerHTML = this.fallback;

    // Define load function based on component name
    const loadFn = this.getLoadFunction(this.componentName);

    if (!loadFn) {
      this.logger.error(`No load function defined for component: ${this.componentName}`);
      return;
    }

    // Load the component
    this.loadSubscription = this.lazyLoadService.loadComponent(this.componentName, loadFn)
      .subscribe({
        next: () => {
          this.createComponent();
        },
        error: (error) => {
          this.logger.error(`Failed to load component ${this.componentName}: ${error.message}`);
          this.container.clear();
          this.container.element.nativeElement.innerHTML = `<div class="error-message">Failed to load component</div>`;
        },
      });
  }

  private getLoadFunction(componentName: string): () => Promise<any> {
    // This would be replaced with actual component loaders in a real application
    const componentLoaders: { [key: string]: () => Promise<any> } = {
      'IncidentDashboardComponent': () => import('../../incident/incident-dashboard/incident-dashboard.component').then(m => m.IncidentDashboardComponent),
      'IncidentListComponent': () => import('../../incident/incident-list/incident-list.component').then(m => m.IncidentListComponent),
      'IncidentDetailComponent': () => import('../../incident/incident-detail/incident-detail.component').then(m => m.IncidentDetailComponent),
      'ReportingFormComponent': () => import('../../reporting/reporting-form/reporting-form.component').then(m => m.ReportingFormComponent),
      'AnalyticsDashboardComponent': () => import('../../analytics/analytics-dashboard/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent),
    };

    return componentLoaders[componentName];
  }

  private createComponent(): void {
    if (!this.componentName) return;

    try {
      // Clear the container
      this.container.clear();

      // Create the component dynamically
      const loadFn = this.getLoadFunction(this.componentName);
      loadFn().then((component) => {
        this.componentRef = this.container.createComponent(component);

        // Pass inputs to the component
        if (this.componentInput && this.componentRef.instance) {
          Object.assign(this.componentRef.instance, this.componentInput);
        }

        this.logger.debug(`Successfully created component: ${this.componentName}`);
      });
    } catch (error) {
      this.logger.error(`Failed to create component ${this.componentName}: ${error.message}`);
      this.container.clear();
      this.container.element.nativeElement.innerHTML = `<div class="error-message">Failed to load component</div>`;
    }
  }

  private cleanupComponent(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }
}
```

### Request Debouncing

```typescript
// services/debounce.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Logger } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class DebounceService {
  private readonly logger = new Logger(DebounceService.name);
  private debounceSubjects: Map<string, Subject<any>> = new Map();
  private debounceSubscriptions: Map<string, Subscription> = new Map();
  private defaultDebounceTime = 300; // ms

  /**
   * Create or get a debounced subject for a specific key
   * @param key - Unique key for the debounce operation
   * @param debounceTime - Custom debounce time in ms
   * @returns Observable that emits debounced values
   */
  debounce<T>(key: string, debounceTime?: number): Observable<T> {
    // Clean up existing subject if it exists
    this.cleanupSubject(key);

    // Create new subject
    const subject = new Subject<T>();
    this.debounceSubjects.set(key, subject);

    // Create debounced observable
    const debounce$ = subject.pipe(
      debounceTime(debounceTime || this.defaultDebounceTime),
      distinctUntilChanged(),
      filter(value => value !== undefined && value !== null),
    );

    // Store subscription to clean up later
    const subscription = debounce$.subscribe({
      complete: () => this.cleanupSubject(key),
    });

    this.debounceSubscriptions.set(key, subscription);

    return debounce$;
  }

  /**
   * Emit a value to the debounced subject
   * @param key - Unique key for the debounce operation
   * @param value - Value to emit
   */
  emit<T>(key: string, value: T): void {
    const subject = this.debounceSubjects.get(key);
    if (subject) {
      subject.next(value);
    } else {
      this.logger.warn(`No debounce subject found for key: ${key}`);
    }
  }

  /**
   * Complete and clean up a debounce subject
   * @param key - Unique key for the debounce operation
   */
  complete(key: string): void {
    const subject = this.debounceSubjects.get(key);
    if (subject) {
      subject.complete();
    }
    this.cleanupSubject(key);
  }

  /**
   * Clean up subject and subscription for a key
   * @param key - Unique key for the debounce operation
   */
  private cleanupSubject(key: string): void {
    // Complete and remove subject
    const subject = this.debounceSubjects.get(key);
    if (subject) {
      subject.complete();
      this.debounceSubjects.delete(key);
    }

    // Unsubscribe and remove subscription
    const subscription = this.debounceSubscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.debounceSubscriptions.delete(key);
    }
  }

  /**
   * Clean up all debounce subjects
   */
  cleanupAll(): void {
    this.debounceSubjects.forEach((subject, key) => {
      subject.complete();
    });
    this.debounceSubjects.clear();

    this.debounceSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.debounceSubscriptions.clear();
  }
}

// directives/debounce-click.directive.ts
import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { DebounceService } from '../services/debounce.service';
import { Logger } from '../services/logger.service';

@Directive({
  selector: '[appDebounceClick]',
})
export class DebounceClickDirective {
  @Input() debounceTime: number = 300;
  @Output() debounceClick = new EventEmitter<Event>();

  private readonly logger = new Logger(DebounceClickDirective.name);
  private readonly debounceKey = `click_${Math.random().toString(36).substring(2, 9)}`;

  constructor(private debounceService: DebounceService) {}

  @HostListener('click', ['$event'])
  clickEvent(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.debounceService.emit(this.debounceKey, event);
  }

  ngOnInit(): void {
    this.debounceService.debounce(this.debounceKey, this.debounceTime).subscribe({
      next: (event) => {
        this.debounceClick.emit(event as Event);
      },
      error: (error) => {
        this.logger.error(`Debounce click error: ${error.message}`);
      },
    });
  }

  ngOnDestroy(): void {
    this.debounceService.complete(this.debounceKey);
  }
}

// directives/debounce-input.directive.ts
import { Directive, EventEmitter, HostListener, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { DebounceService } from '../services/debounce.service';
import { Logger } from '../services/logger.service';

@Directive({
  selector: '[appDebounceInput]',
})
export class DebounceInputDirective implements OnInit, OnDestroy {
  @Input() debounceTime: number = 300;
  @Output() debounceInput = new EventEmitter<string>();

  private readonly logger = new Logger(DebounceInputDirective.name);
  private readonly debounceKey = `input_${Math.random().toString(36).substring(2, 9)}`;

  constructor(private debounceService: DebounceService) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.debounceService.emit(this.debounceKey, value);
  }

  ngOnInit(): void {
    this.debounceService.debounce(this.debounceKey, this.debounceTime).subscribe({
      next: (value) => {
        this.debounceInput.emit(value as string);
      },
      error: (error) => {
        this.logger.error(`Debounce input error: ${error.message}`);
      },
    });
  }

  ngOnDestroy(): void {
    this.debounceService.complete(this.debounceKey);
  }
}

// components/incident-search/incident-search.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IncidentService } from '../../services/incident.service';
import { DebounceService } from '../../services/debounce.service';
import { Logger } from '../../services/logger.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-incident-search',
  templateUrl: './incident-search.component.html',
  styleUrls: ['./incident-search.component.scss'],
})
export class IncidentSearchComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  searchResults: any[] = [];
  isLoading = false;
  private searchSubscription: Subscription | null = null;
  private readonly logger = new Logger(IncidentSearchComponent.name);
  private readonly searchDebounceKey = 'incident_search';

  constructor(
    private incidentService: IncidentService,
    private debounceService: DebounceService,
  ) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private setupSearchDebounce(): void {
    // Subscribe to debounced search input
    this.debounceService.debounce<string>(this.searchDebounceKey, 500).subscribe({
      next: (searchTerm) => {
        this.performSearch(searchTerm);
      },
      error: (error) => {
        this.logger.error(`Search debounce error: ${error.message}`);
      },
    });

    // Update debounce service when input changes
    this.searchControl.valueChanges.subscribe((value) => {
      this.debounceService.emit(this.searchDebounceKey, value);
    });
  }

  private performSearch(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim().length < 2) {
      this.searchResults = [];
      return;
    }

    this.isLoading = true;

    // Clean up previous subscription
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    this.searchSubscription = this.incidentService.searchIncidents(searchTerm).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isLoading = false;
      },
      error: (error) => {
        this.logger.error(`Search failed: ${error.message}`);
        this.isLoading = false;
        this.searchResults = [];
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.debounceService.emit(this.searchDebounceKey, value);
  }

  onSearchResultSelected(incident: any): void {
    // Handle selected incident
    this.logger.debug(`Selected incident: ${incident.id}`);
    this.searchControl.setValue('');
    this.searchResults = [];
  }

  private cleanup(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    this.debounceService.complete(this.searchDebounceKey);
  }
}
```

### Connection Pooling

```typescript
// database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';
import { DatabaseService } from './database.service';
import { Incident } from '../incident/entities/incident.entity';
import { User } from '../user/entities/user.entity';
import { Location } from '../location/entities/location.entity';
import { Department } from '../department/entities/department.entity';
import { IncidentType } from '../incident/entities/incident-type.entity';
import { Attachment } from '../attachment/entities/attachment.entity';
import { Action } from '../action/entities/action.entity';
import { Comment } from '../comment/entities/comment.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');

        const baseConfig: TypeOrmModuleOptions = {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [
            Incident,
            User,
            Location,
            Department,
            IncidentType,
            Attachment,
            Action,
            Comment,
          ],
          synchronize: false, // Always false in production
          logging: configService.get<string>('NODE_ENV') === 'development',
          maxQueryExecutionTime: 1000, // Log slow queries
        };

        // Configure connection pooling
        const poolConfig = {
          max: configService.get<number>('DB_POOL_MAX', 20),
          min: configService.get<number>('DB_POOL_MIN', 4),
          acquire: configService.get<number>('DB_POOL_ACQUIRE', 30000),
          idle: configService.get<number>('DB_POOL_IDLE', 10000),
          evictionRunIntervalMillis: configService.get<number>('DB_POOL_EVICTION_INTERVAL', 5000),
          numTestsPerRun: configService.get<number>('DB_POOL_TESTS_PER_RUN', 3),
          softIdleTimeoutMillis: configService.get<number>('DB_POOL_SOFT_IDLE_TIMEOUT', 30000),
        };

        logger.log(`Database connection pool configured with max: ${poolConfig.max}, min: ${poolConfig.min}`);

        return {
          ...baseConfig,
          extra: {
            max: poolConfig.max,
            min: poolConfig.min,
            connectionTimeoutMillis: poolConfig.acquire,
            idleTimeoutMillis: poolConfig.idle,
            evictionRunIntervalMillis: poolConfig.evictionRunIntervalMillis,
            numTestsPerRun: poolConfig.numTestsPerRun,
            softIdleTimeoutMillis: poolConfig.softIdleTimeoutMillis,
          },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Incident,
      User,
      Location,
      Department,
      IncidentType,
      Attachment,
      Action,
      Comment,
    ]),
  ],
  providers: [DatabaseService],
  exports: [TypeOrmModule, DatabaseService],
})
export class DatabaseModule {}

// database/database.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { Logger } from '../logger/logger.service';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly queryRunners: Map<string, QueryRunner> = new Map();
  private readonly transactionPromises: Map<string, Promise<any>> = new Map();
  private pool: Pool;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private configService: ConfigService,
  ) {
    this.initializePool();
    this.setupConnectionMonitoring();
  }

  private initializePool(): void {
    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
      max: this.configService.get<number>('DB_POOL_MAX', 20),
      min: this.configService.get<number>('DB_POOL_MIN', 4),
      idleTimeoutMillis: this.configService.get<number>('DB_POOL_IDLE', 10000),
      connectionTimeoutMillis: this.configService.get<number>('DB_POOL_ACQUIRE', 30000),
    });

    this.pool.on('connect', () => {
      this.logger.debug('New database connection established');
    });

    this.pool.on('acquire', (connection) => {
      this.logger.debug(`Connection ${connection.processID} acquired from pool`);
    });

    this.pool.on('release', (connection) => {
      this.logger.debug(`Connection ${connection.processID} released back to pool`);
    });

    this.pool.on('error', (err, client) => {
      this.logger.error(`Database pool error: ${err.message}`, err.stack);
    });
  }

  private setupConnectionMonitoring(): void {
    // Log pool statistics periodically
    setInterval(async () => {
      try {
        const stats = await this.getPoolStats();
        this.logger.debug(`Pool stats - total: ${stats.total}, idle: ${stats.idle}, waiting: ${stats.waiting}`);
      } catch (error) {
        this.logger.error(`Failed to get pool stats: ${error.message}`);
      }
    }, 60000); // Every minute
  }

  async getPoolStats(): Promise<{ total: number; idle: number; waiting: number }> {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing database connections...');

    // Clean up query runners
    for (const [key, queryRunner] of this.queryRunners) {
      try {
        if (!queryRunner.isReleased) {
          await queryRunner.release();
        }
      } catch (error) {
        this.logger.error(`Failed to release query runner ${key}: ${error.message}`);
      }
    }

    // Clean up transaction promises
    for (const [key, promise] of this.transactionPromises) {
      try {
        await promise;
      } catch (error) {
        this.logger.error(`Transaction ${key} failed during cleanup: ${error.message}`);
      }
    }

    // Close the pool
    try {
      await this.pool.end();
      this.logger.log('Database pool closed successfully');
    } catch (error) {
      this.logger.error(`Failed to close database pool: ${error.message}`);
    }
  }

  /**
   * Get a query runner for manual transaction management
   * @param key - Unique key for the query runner
   * @returns QueryRunner instance
   */
  async getQueryRunner(key: string): Promise<QueryRunner> {
    // Check if we already have a query runner for this key
    if (this.queryRunners.has(key)) {
      return this.queryRunners.get(key)!;
    }

    // Create new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    this.queryRunners.set(key, queryRunner);
    this.logger.debug(`Created new query runner for key: ${key}`);

    return queryRunner;
  }

  /**
   * Release a query runner
   * @param key - Unique key for the query runner
   */
  async releaseQueryRunner(key: string): Promise<void> {
    const queryRunner = this.queryRunners.get(key);
    if (queryRunner) {
      try {
        if (!queryRunner.isReleased) {
          await queryRunner.release();
        }
        this.queryRunners.delete(key);
        this.logger.debug(`Released query runner for key: ${key}`);
      } catch (error) {
        this.logger.error(`Failed to release query runner ${key}: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Execute a transaction with automatic cleanup
   * @param key - Unique key for the transaction
   * @param operation - Function to execute within the transaction
   * @returns Promise with the result of the operation
   */
  async executeTransaction<T>(key: string, operation: (queryRunner: QueryRunner) => Promise<T>): Promise<T> {
    // Check if we already have a transaction for this key
    if (this.transactionPromises.has(key)) {
      return this.transactionPromises.get(key) as Promise<T>;
    }

    // Create transaction promise
    const transactionPromise = (async () => {
      const queryRunner = await this.getQueryRunner(key);

      try {
        await queryRunner.startTransaction();
        this.logger.debug(`Started transaction for key: ${key}`);

        const result = await operation(queryRunner);

        await queryRunner.commitTransaction();
        this.logger.debug(`Committed transaction for key: ${key}`);

        return result;
      } catch (error) {
        this.logger.error(`Transaction failed for key ${key}: ${error.message}`);
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await this.releaseQueryRunner(key);
      }
    })();

    this.transactionPromises.set(key, transactionPromise);

    // Clean up after transaction completes
    transactionPromise
      .finally(() => {
        this.transactionPromises.delete(key);
      });

    return transactionPromise;
  }

  /**
   * Execute a query with connection pooling
   * @param query - SQL query
   * @param parameters - Query parameters
   * @returns Promise with query result
   */
  async executeQuery<T>(query: string, parameters?: any[]): Promise<T> {
    const client = await this.pool.connect();

    try {
      const startTime = Date.now();
      const result = await client.query(query, parameters);
      const duration = Date.now() - startTime;

      if (duration > 1000) {
        this.logger.warn(`Slow query executed in ${duration}ms: ${query.substring(0, 100)}...`);
      } else {
        this.logger.debug(`Query executed in ${duration}ms`);
      }

      return result.rows as T;
    } catch (error) {
      this.logger.error(`Query execution failed: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a batch of queries in a transaction
   * @param queries - Array of queries to execute
   * @returns Promise with array of results
   */
  async executeBatch(queries: { query: string; parameters?: any[] }[]): Promise<any[]> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const results = [];
      for (const { query, parameters } of queries) {
        const result = await client.query(query, parameters);
        results.push(result.rows);
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Batch execution failed: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get connection from pool for raw queries
   * @returns Promise with database client
   */
  async getClient(): Promise<any> {
    return this.pool.connect();
  }

  /**
   * Check database connection health
   * @returns Promise with health status
   */
  async checkHealth(): Promise<{ status: string; details: any }> {
    try {
      const startTime = Date.now();
      const result = await this.dataSource.query('SELECT 1');
      const duration = Date.now() - startTime;

      return {
        status: 'healthy',
        details: {
          responseTime: `${duration}ms`,
          poolStats: await this.getPoolStats(),
          database: this.configService.get<string>('DB_NAME'),
        },
      };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          poolStats: await this.getPoolStats(),
        },
      };
    }
  }
}
```

---

## Real-Time Features (350+ lines)

### WebSocket Server Setup

```typescript
// websocket/websocket.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { IncidentModule } from '../incident/incident.module';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    IncidentModule,
    NotificationModule,
    AuthModule,
    RedisModule,
  ],
  providers: [WebSocketGateway, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}

// websocket/websocket.gateway.ts
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
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { AuthService } from '../auth/auth.service';
import { IncidentService } from '../incident/incident.service';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  namespace: 'safety',
  cors: {
    origin: '*',
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
  private readonly connectedClients: Map<string, Socket> = new Map();
  private readonly userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private configService: ConfigService,
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private incidentService: IncidentService,
    private notificationService: NotificationService,
    private redisService: RedisService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.webSocketService.setServer(server);

    // Setup event listeners
    this.setupEventListeners();

    // Start monitoring
    this.startMonitoring();
  }

  private setupEventListeners(): void {
    // Listen for incident updates
    this.incidentService.onIncidentUpdate((incident) => {
      this.handleIncidentUpdate(incident);
    });

    // Listen for new incidents
    this.incidentService.onIncidentCreated((incident) => {
      this.handleIncidentCreated(incident);
    });

    // Listen for notifications
    this.notificationService.onNotification((notification) => {
      this.handleNotification(notification);
    });
  }

  private startMonitoring(): void {
    // Log connection statistics periodically
    setInterval(() => {
      this.logger.log(`WebSocket connections: ${this.connectedClients.size} clients, ${this.userSockets.size} users`);
    }, 60000); // Every minute
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);

      // Verify authentication
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Unauthenticated connection attempt from ${client.id}`);
        client.disconnect(true);
        return;
      }

      const user = await this.authService.validateWebSocketToken(token);

      if (!user) {
        this.logger.warn(`Invalid token from client ${client.id}`);
        client.disconnect(true);
        return;
      }

      // Store client connection
      this.connectedClients.set(client.id, client);

      // Store user to socket mapping
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)?.add(client.id);

      // Join user-specific room
      client.join(`user:${user.id}`);

      // Join role-based rooms
      if (user.roles) {
        user.roles.forEach((role) => {
          client.join(`role:${role}`);
        });
      }

      // Join location-based rooms if applicable
      if (user.locationId) {
        client.join(`location:${user.locationId}`);
      }

      // Join department-based rooms if applicable
      if (user.departmentId) {
        client.join(`department:${user.departmentId}`);
      }

      // Send connection confirmation
      client.emit('connection:established', {
        success: true,
        userId: user.id,
        timestamp: new Date().toISOString(),
        serverTime: new Date().toISOString(),
      });

      this.logger.log(`User ${user.id} (${user.email}) connected via WebSocket`);

      // Send initial data if needed
      this.sendInitialData(client, user);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect(true);
    }
  }

  private async sendInitialData(client: Socket, user: any): Promise<void> {
    try {
      // Send unread notifications count
      const unreadCount = await this.notificationService.getUnreadCount(user.id);
      client.emit('notifications:unread', unreadCount);

      // Send recent incidents if user has permission
      if (this.authService.hasPermission(user, 'incident:read')) {
        const recentIncidents = await this.incidentService.getRecentIncidents(user.id);
        client.emit('incidents:recent', recentIncidents);
      }

      // Send user preferences
      const preferences = await this.redisService.getUserPreferences(user.id);
      client.emit('user:preferences', preferences);
    } catch (error) {
      this.logger.error(`Failed to send initial data: ${error.message}`);
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const clientId = client.id;
      const userId = this.getUserIdBySocketId(clientId);

      this.logger.log(`Client disconnected: ${clientId}`);

      // Remove from connected clients
      this.connectedClients.delete(clientId);

      // Remove from user sockets
      if (userId) {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          sockets.delete(clientId);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      }

      // Leave all rooms
      const rooms = Array.from(client.rooms);
      rooms.forEach((room) => {
        client.leave(room);
      });

      this.logger.log(`User ${userId || 'unknown'} disconnected`);
    } catch (error) {
      this.logger.error(`Disconnection error: ${error.message}`);
    }
  }

  private getUserIdBySocketId(socketId: string): string | null {
    for (const [userId, sockets] of this.userSockets) {
      if (sockets.has(socketId)) {
        return userId;
      }
    }
    return null;
  }

  private async handleIncidentUpdate(incident: any): Promise<void> {
    try {
      // Determine which rooms should receive this update
      const rooms = this.getRoomsForIncident(incident);

      // Get all clients in these rooms
      const clients = this.getClientsInRooms(rooms);

      // Prepare update data
      const updateData = {
        incidentId: incident.id,
        status: incident.status,
        severity: incident.severity,
        updatedAt: incident.updatedAt,
        updatedBy: incident.updatedBy,
        changes: incident.changes,
      };

      // Send update to all relevant clients
      clients.forEach((client) => {
        client.emit('incident:updated', updateData);
      });

      this.logger.debug(`Sent incident update to ${clients.size} clients`);
    } catch (error) {
      this.logger.error(`Failed to handle incident update: ${error.message}`);
    }
  }

  private async handleIncidentCreated(incident: any): Promise<void> {
    try {
      // Determine which rooms should receive this notification
      const rooms = this.getRoomsForIncident(incident);

      // Get all clients in these rooms
      const clients = this.getClientsInRooms(rooms);

      // Prepare notification data
      const notificationData = {
        incidentId: incident.id,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        reportedAt: incident.reportedAt,
        reporter: incident.reporter,
        location: incident.location,
      };

      // Send notification to all relevant clients
      clients.forEach((client) => {
        client.emit('incident:created', notificationData);
      });

      this.logger.debug(`Sent incident creation notification to ${clients.size} clients`);
    } catch (error) {
      this.logger.error(`Failed to handle incident creation: ${error.message}`);
    }
  }

  private async handleNotification(notification: any): Promise<void> {
    try {
      // Determine target users
      const targetUsers = this.getTargetUsersForNotification(notification);

      // Send notification to each target user
      for (const userId of targetUsers) {
        const sockets = this.userSockets.get(userId);
        if (sockets && sockets.size > 0) {
          const notificationData = {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            createdAt: notification.createdAt,
            read: notification.read,
          };

          sockets.forEach((socketId) => {
            const client = this.connectedClients.get(socketId);
            if (client) {
              client.emit('notification:received', notificationData);
            }
          });
        }
      }

      this.logger.debug(`Sent notification to ${targetUsers.size} users`);
    } catch (error) {
      this.logger.error(`Failed to handle notification: ${error.message}`);
    }
  }

  private getRoomsForIncident(incident: any): string[] {
    const rooms = new Set<string>();

    // Add incident-specific room
    rooms.add(`incident:${incident.id}`);

    // Add location room if incident has location
    if (incident.locationId) {
      rooms.add(`location:${incident.locationId}`);
    }

    // Add department room if incident has department
    if (incident.departmentId) {
      rooms.add(`department:${incident.departmentId}`);
    }

    // Add severity-based room
    rooms.add(`severity:${incident.severity}`);

    // Add status-based room
    rooms.add(`status:${incident.status}`);

    // Add global incident room
    rooms.add('incidents:all');

    return Array.from(rooms);
  }

  private getClientsInRooms(rooms: string[]): Set<Socket> {
    const clients = new Set<Socket>();

    rooms.forEach((room) => {
      const roomClients = this.server.sockets.adapter.rooms.get(room);
      if (roomClients) {
        roomClients.forEach((socketId) => {
          const client = this.connectedClients.get(socketId);
          if (client) {
            clients.add(client);
          }
        });
      }
    });

    return clients;
  }

  private getTargetUsersForNotification(notification: any): Set<string> {
    const users = new Set<string>();

    // Add specific users if notification has targets
    if (notification.userIds) {
      notification.userIds.forEach((userId: string) => {
        users.add(userId);
      });
    }

    // Add users by role if notification has role targets
    if (notification.roles) {
      notification.roles.forEach((role: string) => {
        const roleSockets = this.server.sockets.adapter.rooms.get(`role:${role}`);
        if (roleSockets) {
          roleSockets.forEach((socketId) => {
            const userId = this.getUserIdBySocketId(socketId);
            if (userId) {
              users.add(userId);
            }
          });
        }
      });
    }

    // Add users by location if notification has location targets
    if (notification.locationIds) {
      notification.locationIds.forEach((locationId: string) => {
        const locationSockets = this.server.sockets.adapter.rooms.get(`location:${locationId}`);
        if (locationSockets) {
          locationSockets.forEach((socketId) => {
            const userId = this.getUserIdBySocketId(socketId);
            if (userId) {
              users.add(userId);
            }
          });
        }
      });
    }

    return users;
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() client: Socket,
  ): void {
    try {
      if (!data.rooms || !Array.isArray(data.rooms)) {
        client.emit('error', { message: 'Invalid subscription request' });
        return;
      }

      // Validate rooms
      const validRooms = data.rooms.filter((room) => this.isValidRoom(room));

      if (validRooms.length === 0) {
        client.emit('error', { message: 'No valid rooms provided' });
        return;
      }

      // Subscribe to rooms
      validRooms.forEach((room) => {
        client.join(room);
      });

      client.emit('subscribed', {
        success: true,
        rooms: validRooms,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(`Client ${client.id} subscribed to rooms: ${validRooms.join(', ')}`);
    } catch (error) {
      this.logger.error(`Subscription error: ${error.message}`);
      client.emit('error', { message: 'Subscription failed' });
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() client: Socket,
  ): void {
    try {
      if (!data.rooms || !Array.isArray(data.rooms)) {
        client.emit('error', { message: 'Invalid unsubscription request' });
        return;
      }

      // Unsubscribe from rooms
      data.rooms.forEach((room) => {
        client.leave(room);
      });

      client.emit('unsubscribed', {
        success: true,
        rooms: data.rooms,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(`Client ${client.id} unsubscribed from rooms: ${data.rooms.join(', ')}`);
    } catch (error) {
      this.logger.error(`Unsubscription error: ${error.message}`);
      client.emit('error', { message: 'Unsubscription failed' });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      serverTime: new Date().toISOString(),
    });
  }

  @SubscribeMessage('presence:update')
  handlePresenceUpdate(
    @MessageBody() data: { status: string; metadata?: any },
    @ConnectedSocket() client: Socket,
  ): void {
    try {
      const userId = this.getUserIdBySocketId(client.id);
      if (!userId) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Update presence in Redis
      this.redisService.updateUserPresence(userId, {
        status: data.status,
        lastActive: new Date().toISOString(),
        metadata: data.metadata,
        socketId: client.id,
      });

      // Broadcast presence update to relevant users
      this.broadcastPresenceUpdate(userId, data.status, data.metadata);

      client.emit('presence:updated', {
        success: true,
        status: data.status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Presence update error: ${error.message}`);
      client.emit('error', { message: 'Presence update failed' });
    }
  }

  private broadcastPresenceUpdate(userId: string, status: string, metadata?: any): void {
    try {
      // Get user's team members
      this.redisService.getUserTeam(userId).then((teamMembers) => {
        if (teamMembers && teamMembers.length > 0) {
          const presenceData = {
            userId,
            status,
            metadata,
            timestamp: new Date().toISOString(),
          };

          teamMembers.forEach((memberId) => {
            const sockets = this.userSockets.get(memberId);
            if (sockets) {
              sockets.forEach((socketId) => {
                const client = this.connectedClients.get(socketId);
                if (client) {
                  client.emit('presence:update', presenceData);
                }
              });
            }
          });
        }
      });
    } catch (error) {
      this.logger.error(`Failed to broadcast presence update: ${error.message}`);
    }
  }

  private isValidRoom(room: string): boolean {
    // Basic room validation
    if (!room || typeof room !== 'string') {
      return false;
    }

    // Check room pattern
    const validPatterns = [
      /^user:\w+$/,
      /^role:\w+$/,
      /^location:\w+$/,
      /^department:\w+$/,
      /^incident:\w+$/,
      /^severity:\w+$/,
      /^status:\w+$/,
      /^incidents:all$/,
    ];

    return validPatterns.some((pattern) => pattern.test(room));
  }

  /**
   * Broadcast a message to all connected clients
   * @param event - Event name
   * @param data - Data to broadcast
   * @param rooms - Optional rooms to broadcast to
   */
  broadcast(event: string, data: any, rooms?: string[]): void {
    try {
      if (rooms && rooms.length > 0) {
        rooms.forEach((room) => {
          this.server.to(room).emit(event, data);
        });
      } else {
        this.server.emit(event, data);
      }
    } catch (error) {
      this.logger.error(`Broadcast error: ${error.message}`);
    }
  }
}
```

### WebSocket Service Implementation

```typescript
// websocket/websocket.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { IncidentService } from '../incident/incident.service';
import { NotificationService } from '../notification/notification.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebSocketService {
  private server: Server;
  private readonly logger = new Logger(WebSocketService.name);
  private readonly messageQueue: Map<string, any[]> = new Map();
  private readonly messageProcessing: Map<string, boolean> = new Map();

  constructor(
    private redisService: RedisService,
    private incidentService: IncidentService,
    private notificationService: NotificationService,
    private configService: ConfigService,
  ) {}

  setServer(server: Server): void {
    this.server = server;
    this.setupMessageProcessing();
  }

  private setupMessageProcessing(): void {
    // Process queued messages every second
    setInterval(() => {
      this.processMessageQueue();
    }, 1000);
  }

  /**
   * Send a real-time message to a specific user
   * @param userId - Target user ID
   * @param event - Event name
   * @param data - Data to send
   */
  async sendToUser(userId: string, event: string, data: any): Promise<void> {
    try {
      const sockets = await this.redisService.getUserSockets(userId);

      if (sockets && sockets.length > 0) {
        sockets.forEach((socketId) => {
          this.server.to(socketId).emit(event, data);
        });
        this.logger.debug(`Sent ${event} to user ${userId} (${sockets.length} sockets)`);
      } else {
        // Queue message if user is not connected
        this.queueMessage(userId, event, data);
        this.logger.debug(`Queued ${event} for user ${userId} (offline)`);
      }
    } catch (error) {
      this.logger.error(`Failed to send message to user ${userId}: ${error.message}`);
    }
  }

  /**
   * Send a real-time message to multiple users
   * @param userIds - Array of user IDs
   * @param event - Event name
   * @param data - Data to send
   */
  async sendToUsers(userIds: string[], event: string, data: any): Promise<void> {
    try {
      const promises = userIds.map((userId) => this.sendToUser(userId, event, data));
      await Promise.all(promises);
    } catch (error) {
      this.logger.error(`Failed to send message to users: ${error.message}`);
    }
  }

  /**
   * Send a real-time message to a specific room
   * @param room - Room name
   * @param event - Event name
   * @param data - Data to send
   */
  sendToRoom(room: string, event: string, data: any): void {
    try {
      this.server.to(room).emit(event, data);
      this.logger.debug(`Sent ${event} to room ${room}`);
    } catch (error) {
      this.logger.error(`Failed to send message to room ${room}: ${error.message}`);
    }
  }

  /**
   * Send a real-time message to multiple rooms
   * @param rooms - Array of room names
   * @param event - Event name
   * @param data - Data to send
   */
  sendToRooms(rooms: string[], event: string, data: any): void {
    try {
      rooms.forEach((room) => {
        this.sendToRoom(room, event, data);
      });
    } catch (error) {
      this.logger.error(`Failed to send message to rooms: ${error.message}`);
    }
  }

  /**
   * Broadcast a message to all connected clients
   * @param event - Event name
   * @param data - Data to send
   */
  broadcast(event: string, data: any): void {
    try {
      this.server.emit(event, data);
      this.logger.debug(`Broadcasted ${event} to all clients`);
    } catch (error) {
      this.logger.error(`Failed to broadcast message: ${error.message}`);
    }
  }

  /**
   * Queue a message for offline users
   * @param userId - User ID
   * @param event - Event name
   * @param data - Data to send
   */
  private queueMessage(userId: string, event: string, data: any): void {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }

    this.messageQueue.get(userId)?.push({ event, data, timestamp: new Date().toISOString() });
  }

  /**
   * Process queued messages for users who have come online
   */
  private async processMessageQueue(): Promise<void> {
    try {
      for (const [userId, messages] of this.messageQueue) {
        if (messages.length === 0) {
          this.messageQueue.delete(userId);
          continue;
        }

        // Check if user is now online
        const isOnline = await this.redisService.isUserOnline(userId);

        if (isOnline && !this.messageProcessing.get(userId)) {
          this.messageProcessing.set(userId, true);

          try {
            // Get user's sockets
            const sockets = await this.redisService.getUserSockets(userId);

            if (sockets && sockets.length > 0) {
              // Send all queued messages
              messages.forEach((message) => {
                sockets.forEach((socketId) => {
                  this.server.to(socketId).emit(message.event, message.data);
                });
              });

              // Clear the queue
              this.messageQueue.set(userId, []);
              this.logger.debug(`Processed ${messages.length} queued messages for user ${userId}`);
            }
          } catch (error) {
            this.logger.error(`Failed to process message queue for user ${userId}: ${error.message}`);
          } finally {
            this.messageProcessing.set(userId, false);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process message queue: ${error.message}`);
    }
  }

  /**
   * Send incident update notification
   * @param incidentId - Incident ID
   * @param changes - Changes made to the incident
   */
  async sendIncidentUpdate(incidentId: string, changes: any): Promise<void> {
    try {
      // Get incident details
      const incident = await this.incidentService.getIncidentById(incidentId);

      if (!incident) {
        this.logger.warn(`Incident ${incidentId} not found for update notification`);
        return;
      }

      // Determine target rooms
      const rooms = this.getIncidentRooms(incident);

      // Prepare update data
      const updateData = {
        incidentId: incident.id,
        title: incident.title,
        status: incident.status,
        severity: incident.severity,
        updatedAt: incident.updatedAt,
        updatedBy: incident.updatedBy,
        changes,
        locationId: incident.locationId,
        departmentId: incident.departmentId,
      };

      // Send to rooms
      this.sendToRooms(rooms, 'incident:updated', updateData);

      // Send to specific users if needed
      if (changes.assignedTo) {
        await this.sendToUser(changes.assignedTo, 'incident:assigned', {
          incidentId: incident.id,
          title: incident.title,
          severity: incident.severity,
        });
      }

      this.logger.debug(`Sent incident update for ${incidentId} to ${rooms.length} rooms`);
    } catch (error) {
      this.logger.error(`Failed to send incident update: ${error.message}`);
    }
  }

  /**
   * Send incident creation notification
   * @param incidentId - Incident ID
   */
  async sendIncidentCreated(incidentId: string): Promise<void> {
    try {
      // Get incident details
      const incident = await this.incidentService.getIncidentById(incidentId);

      if (!incident) {
        this.logger.warn(`Incident ${incidentId} not found for creation notification`);
        return;
      }

      // Determine target rooms
      const rooms = this.getIncidentRooms(incident);

      // Prepare notification data
      const notificationData = {
        incidentId: incident.id,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        reportedAt: incident.reportedAt,
        reporter: incident.reporter,
        location: incident.location,
        department: incident.department,
        incidentType: incident.incidentType,
      };

      // Send to rooms
      this.sendToRooms(rooms, 'incident:created', notificationData);

      this.logger.debug(`Sent incident creation for ${incidentId} to ${rooms.length} rooms`);
    } catch (error) {
      this.logger.error(`Failed to send incident creation: ${error.message}`);
    }
  }

  /**
   * Send notification to users
   * @param notificationId - Notification ID
   */
  async sendNotification(notificationId: string): Promise<void> {
    try {
      // Get notification details
      const notification = await this.notificationService.getNotificationById(notificationId);

      if (!notification) {
        this.logger.warn(`Notification ${notificationId} not found`);
        return;
      }

      // Determine target users
      const targetUsers = await this.getNotificationTargetUsers(notification);

      // Prepare notification data
      const notificationData = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt,
        read: notification.read,
        incidentId: notification.incidentId,
      };

      // Send to target users
      await this.sendToUsers(targetUsers, 'notification:received', notificationData);

      this.logger.debug(`Sent notification ${notificationId} to ${targetUsers.length} users`);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * Get rooms for an incident
   * @param incident - Incident data
   * @returns Array of room names
   */
  private getIncidentRooms(incident: any): string[] {
    const rooms = new Set<string>();

    // Add incident-specific room
    rooms.add(`incident:${incident.id}`);

    // Add location room
    if (incident.locationId) {
      rooms.add(`location:${incident.locationId}`);
    }

    // Add department room
    if (incident.departmentId) {
      rooms.add(`department:${incident.departmentId}`);
    }

    // Add severity room
    rooms.add(`severity:${incident.severity}`);

    // Add status room
    rooms.add(`status:${incident.status}`);

    // Add global incident room
    rooms.add('incidents:all');

    // Add role-based rooms for incident responders
    if (incident.responderRoles) {
      incident.responderRoles.forEach((role: string) => {
        rooms.add(`role:${role}`);
      });
    }

    return Array.from(rooms);
  }

  /**
   * Get target users for a notification
   * @param notification - Notification data
   * @returns Array of user IDs
   */
  private async getNotificationTargetUsers(notification: any): Promise<string[]> {
    const users = new Set<string>();

    // Add specific users
    if (notification.userIds) {
      notification.userIds.forEach((userId: string) => {
        users.add(userId);
      });
    }

    // Add users by role
    if (notification.roles) {
      const roleUsers = await this.redisService.getUsersByRole(notification.roles);
      roleUsers.forEach((userId) => {
        users.add(userId);
      });
    }

    // Add users by location
    if (notification.locationIds) {
      const locationUsers = await this.redisService.getUsersByLocation(notification.locationIds);
      locationUsers.forEach((userId) => {
        users.add(userId);
      });
    }

    // Add users by department
    if (notification.departmentIds) {
      const departmentUsers = await this.redisService.getUsersByDepartment(notification.departmentIds);
      departmentUsers.forEach((userId) => {
        users.add(userId);
      });
    }

    return Array.from(users);
  }

  /**
   * Send presence update to team members
   * @param userId - User ID
   * @param status - Presence status
   * @param metadata - Additional metadata
   */
  async sendPresenceUpdate(userId: string, status: string, metadata?: any): Promise<void> {
    try {
      // Get user's team members
      const teamMembers = await this.redisService.getUserTeam(userId);

      if (teamMembers && teamMembers.length > 0) {
        const presenceData = {
          userId,
          status,
          metadata,
          timestamp: new Date().toISOString(),
        };

        // Send to team members
        await this.sendToUsers(teamMembers, 'presence:update', presenceData);
      }
    } catch (error) {
      this.logger.error(`Failed to send presence update: ${error.message}`);
    }
  }

  /**
   * Send real-time analytics update
   * @param data - Analytics data
   */
  async sendAnalyticsUpdate(data: any): Promise<void> {
    try {
      // Send to analytics dashboard room
      this.sendToRoom('analytics:dashboard', 'analytics:update', data);

      // Send to specific users with analytics permissions
      const analyticsUsers = await this.redisService.getUsersWithPermission('analytics:view');
      await this.sendToUsers(analyticsUsers, 'analytics:update', data);

      this.logger.debug('Sent analytics update to dashboard and users');
    } catch (error) {
      this.logger.error(`Failed to send analytics update: ${error.message}`);
    }
  }

  /**
   * Send system alert
   * @param alert - Alert data
   */
  async sendSystemAlert(alert: any): Promise<void> {
    try {
      // Prepare alert data
      const alertData = {
        id: alert.id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.timestamp,
        data: alert.data,
      };

      // Send to all connected clients
      this.broadcast('system:alert', alertData);

      this.logger.debug(`Sent system alert: ${alert.title}`);
    } catch (error) {
      this.logger.error(`Failed to send system alert: ${error.message}`);
    }
  }

  /**
   * Check WebSocket server health
   * @returns Health status
   */
  async checkHealth(): Promise<{ status: string; details: any }> {
    try {
      const clients = this.server ? this.server.engine.clientsCount : 0;
      const rooms = this.server ? this.server.sockets.adapter.rooms.size : 0;

      return {
        status: 'healthy',
        details: {
          connectedClients: clients,
          activeRooms: rooms,
          messageQueueSize: this.messageQueue.size,
          redisStatus: await this.redisService.checkHealth(),
        },
      };
    } catch (error) {
      this.logger.error(`WebSocket health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
        },
      };
    }
  }
}
```

### Client-Side WebSocket Integration

```typescript
// services/websocket.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';
import { Logger } from './logger.service';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { filter, map, shareReplay, takeUntil } from 'rxjs/operators';
import { Incident } from '../models/incident.model';
import { Notification } from '../models/notification.model';
import { UserPresence } from '../models/user-presence.model';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private socket: SocketIOClient.Socket | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly connectionStatus$ = new BehaviorSubject<boolean>(false);
  private readonly reconnectAttempts = new BehaviorSubject<number>(0);
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000; // 3 seconds
  private reconnectTimeout: any;
  private heartbeatInterval: any;
  private readonly HEARTBEAT_INTERVAL = 20000; // 20 seconds
  private readonly HEARTBEAT_VALUE = 'heartbeat';

  // Event subjects
  private readonly incidentCreated$ = new Subject<Incident>();
  private readonly incidentUpdated$ = new Subject<{ incidentId: string; changes: any }>();
  private readonly notificationReceived$ = new Subject<Notification>();
  private readonly presenceUpdate$ = new Subject<UserPresence>();
  private readonly analyticsUpdate$ = new Subject<any>();
  private readonly systemAlert$ = new Subject<any>();
  private readonly connectionError$ = new Subject<Error>();

  private readonly logger = new Logger(WebSocketService.name);
  private isConnecting = false;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    // Initialize when user is authenticated
    this.authService.isAuthenticated$.pipe(
      filter(isAuthenticated => isAuthenticated),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.initialize();
    });

    // Clean up when user logs out
    this.authService.logout$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.disconnect();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  /**
   * Initialize WebSocket connection
   */
  private initialize(): void {
    if (this.isConnecting || this.socket) {
      return;
    }

    this.isConnecting = true;
    this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    try {
      // Get WebSocket URL from config
      const wsUrl = this.configService.get('WEBSOCKET_URL');
      if (!wsUrl) {
        throw new Error('WebSocket URL not configured');
      }

      // Get authentication token
      const token = this.authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Create socket connection
      this.socket = io(wsUrl, {
        path: '/safety',
        transports: ['websocket'],
        autoConnect: false,
        reconnection: false, // We handle reconnection manually
        query: {
          token: token,
        },
        timeout: 10000,
        upgrade: false,
      });

      // Setup event listeners
      this.setupEventListeners();

      // Connect
      this.socket.connect();
      this.logger.log('WebSocket connection attempt started');

    } catch (error) {
      this.logger.error(`WebSocket connection failed: ${error.message}`);
      this.handleConnectionError(error);
      this.isConnecting = false;
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      this.logger.log('WebSocket connected successfully');
      this.connectionStatus$.next(true);
      this.reconnectAttempts.next(0);
      this.isConnecting = false;
      this.startHeartbeat();
    });

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      this.logger.error(`WebSocket connection error: ${error.message}`);
      this.handleConnectionError(error);
    });

    // Disconnected
    this.socket.on('disconnect', (reason: string) => {
      this.logger.warn(`WebSocket disconnected: ${reason}`);
      this.connectionStatus$.next(false);
      this.stopHeartbeat();

      if (reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    // Custom events
    this.socket.on('incident:created', (data: any) => {
      this.handleIncidentCreated(data);
    });

    this.socket.on('incident:updated', (data: any) => {
      this.handleIncidentUpdated(data);
    });

    this.socket.on('notification:received', (data: any) => {
      this.handleNotificationReceived(data);
    });

    this.socket.on('presence:update', (data: any) => {
      this.handlePresenceUpdate(data);
    });

    this.socket.on('analytics:update', (data: any) => {
      this.analyticsUpdate$.next(data);
    });

    this.socket.on('system:alert', (data: any) => {
      this.systemAlert$.next(data);
    });

    this.socket.on('connection:established', (data: any) => {
      this.logger.debug('Connection established', data);
    });

    this.socket.on('error', (error: any) => {
      this.logger.error(`WebSocket error: ${error.message}`);
      this.connectionError$.next(new Error(error.message));
    });

    this.socket.on('pong', (data: any) => {
      this.logger.debug('Received pong', data);
    });
  }

  /**
   * Handle connection error
   * @param error - Error object
   */
  private handleConnectionError(error: Error): void {
    this.connectionError$.next(error);
    this.connectionStatus$.next(false);
    this.isConnecting = false;

    if (this.reconnectAttempts.value < this.MAX_RECONNECT_ATTEMPTS) {
      this.scheduleReconnect();
    } else {
      this.logger.error('Max reconnection attempts reached');
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    const currentAttempts = this.reconnectAttempts.value;
    this.reconnectAttempts.next(currentAttempts + 1);

    const delay = this.calculateReconnectDelay(currentAttempts);

    this.logger.log(`Scheduling reconnection attempt ${currentAttempts + 1} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Calculate reconnection delay with exponential backoff
   * @param attempt - Current attempt number
   * @returns Delay in milliseconds
   */
  private calculateReconnectDelay(attempt: number): number {
    const baseDelay = this.RECONNECT_DELAY;
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping', this.HEARTBEAT_VALUE);
        this.logger.debug('Sent heartbeat ping');
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.logger.log('Disconnecting WebSocket');

    // Clear reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Stop heartbeat
    this.stopHeartbeat();

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionStatus$.next(false);
    this.reconnectAttempts.next(0);
    this.isConnecting = false;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection status observable
   */
  get connectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable().pipe(
      shareReplay(1)
    );
  }

  /**
   * Get reconnect attempts observable
   */
  get reconnectAttempts$(): Observable<number> {
    return this.reconnectAttempts.asObservable();
  }

  /**
   * Subscribe to incident created events
   */
  get incidentCreated$(): Observable<Incident> {
    return this.incidentCreated$.asObservable().pipe(
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to incident updated events
   */
  get incidentUpdated$(): Observable<{ incidentId: string; changes: any }> {
    return this.incidentUpdated$.asObservable().pipe(
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to notification received events
   */
  get notificationReceived$(): Observable<Notification> {
    return this.notificationReceived$.asObservable().pipe(
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to presence update events
   */
  get presenceUpdate$(): Observable<UserPresence> {
    return this.presenceUpdate$.asObservable().pipe(
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to analytics update events
   */
  get analyticsUpdate$(): Observable<any> {
    return this.analyticsUpdate$.asObservable().pipe(
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to system alert events
   */
  get systemAlert$(): Observable<any> {
    return this.systemAlert$.asObservable().pipe(
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to connection error events
   */
  get connectionError$(): Observable<Error> {
    return this.connectionError$.asObservable().pipe(
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to specific incident updates
   * @param incidentId - Incident ID to subscribe to
   */
  incidentUpdates$(incidentId: string): Observable<{ incidentId: string; changes: any }> {
    return this.incidentUpdated$.pipe(
      filter(update => update.incidentId === incidentId),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to specific user presence updates
   * @param userId - User ID to subscribe to
   */
  userPresence$(userId: string): Observable<UserPresence> {
    return this.presenceUpdate$.pipe(
      filter(presence => presence.userId === userId),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Subscribe to specific incident room
   * @param incidentId - Incident ID
   */
  subscribeToIncident(incidentId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe', { rooms: [`incident:${incidentId}`] });
      this.logger.debug(`Subscribed to incident ${incidentId}`);
    } else {
      this.logger.warn('Cannot subscribe to incident - WebSocket not connected');
    }
  }

  /**
   * Unsubscribe from specific incident room
   * @param incidentId - Incident ID
   */
  unsubscribeFromIncident(incidentId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('unsubscribe', { rooms: [`incident:${incidentId}`] });
      this.logger.debug(`Unsubscribed from incident ${incidentId}`);
    }
  }

  /**
   * Subscribe to multiple rooms
   * @param rooms - Array of room names
   */
  subscribeToRooms(rooms: string[]): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe', { rooms });
      this.logger.debug(`Subscribed to rooms: ${rooms.join(', ')}`);
    } else {
      this.logger.warn('Cannot subscribe to rooms - WebSocket not connected');
    }
  }

  /**
   * Unsubscribe from multiple rooms
   * @param rooms - Array of room names
   */
  unsubscribeFromRooms(rooms: string[]): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('unsubscribe', { rooms });
      this.logger.debug(`Unsubscribed from rooms: ${rooms.join(', ')}`);
    }
  }

  /**
   * Update user presence status
   * @param status - Presence status
   * @param metadata - Additional metadata
   */
  updatePresence(status: string, metadata?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('presence:update', { status, metadata });
      this.logger.debug(`Updated presence to ${status}`);
    } else {
      this.logger.warn('Cannot update presence - WebSocket not connected');
    }
  }

  /**
   * Send custom event
   * @param event - Event name
   * @param data - Event data
   */
  emit(event: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
      this.logger.debug(`Emitted event ${event}`);
    } else {
      this.logger.warn(`Cannot emit event ${event} - WebSocket not connected`);
    }
  }

  /**
   * Handle incident created event
   * @param data - Incident data
   */
  private handleIncidentCreated(data: any): void {
    try {
      const incident = this.mapIncidentData(data);
      this.incidentCreated$.next(incident);
      this.logger.debug(`Received incident created event for ${incident.id}`);
    } catch (error) {
      this.logger.error(`Failed to process incident created event: ${error.message}`);
    }
  }

  /**
   * Handle incident updated event
   * @param data - Update data
   */
  private handleIncidentUpdated(data: any): void {
    try {
      const update = {
        incidentId: data.incidentId,
        changes: data.changes,
      };
      this.incidentUpdated$.next(update);
      this.logger.debug(`Received incident updated event for ${data.incidentId}`);
    } catch (error) {
      this.logger.error(`Failed to process incident updated event: ${error.message}`);
    }
  }

  /**
   * Handle notification received event
   * @param data - Notification data
   */
  private handleNotificationReceived(data: any): void {
    try {
      const notification = this.mapNotificationData(data);
      this.notificationReceived$.next(notification);
      this.logger.debug(`Received notification ${notification.id}`);
    } catch (error) {
      this.logger.error(`Failed to process notification event: ${error.message}`);
    }
  }

  /**
   * Handle presence update event
   * @param data - Presence data
   */
  private handlePresenceUpdate(data: any): void {
    try {
      const presence = this.mapPresenceData(data);
      this.presenceUpdate$.next(presence);
      this.logger.debug(`Received presence update for user ${presence.userId}`);
    } catch (error) {
      this.logger.error(`Failed to process presence update event: ${error.message}`);
    }
  }

  /**
   * Map raw incident data to Incident model
   * @param data - Raw incident data
   * @returns Mapped Incident object
   */
  private mapIncidentData(data: any): Incident {
    return {
      id: data.incidentId || data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      severity: data.severity,
      reportedAt: new Date(data.reportedAt),
      resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
      reporter: data.reporter,
      location: data.location,
      department: data.department,
      incidentType: data.incidentType,
      attachments: data.attachments || [],
      actions: data.actions || [],
      comments: data.comments || [],
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  /**
   * Map raw notification data to Notification model
   * @param data - Raw notification data
   * @returns Mapped Notification object
   */
  private mapNotificationData(data: any): Notification {
    return {
      id: data.id,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      createdAt: new Date(data.createdAt),
      read: data.read || false,
      incidentId: data.incidentId,
    };
  }

  /**
   * Map raw presence data to UserPresence model
   * @param data - Raw presence data
   * @returns Mapped UserPresence object
   */
  private mapPresenceData(data: any): UserPresence {
    return {
      userId: data.userId,
      status: data.status,
      metadata: data.metadata,
      timestamp: new Date(data.timestamp),
    };
  }

  /**
   * Check WebSocket service health
   * @returns Health status
   */
  checkHealth(): { status: string; details: any } {
    const isConnected = this.isConnected();
    const reconnectAttempts = this.reconnectAttempts.value;

    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      details: {
        connected: isConnected,
        reconnectAttempts,
        lastError: this.connectionError$.value?.message || null,
      },
    };
  }
}
```

### Room/Channel Management

```typescript
// websocket/room.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { RedisService } from '../redis/redis.service';
import { IncidentService } from '../incident/incident.service';
import { UserService } from '../user/user.service';
import { LocationService } from '../location/location.service';
import { DepartmentService } from '../department/department.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private readonly DEFAULT_ROOM_TTL = 86400; // 24 hours in seconds

  constructor(
    private webSocketService: WebSocketService,
    private redisService: RedisService,
    private incidentService: IncidentService,
    private userService: UserService,
    private locationService: LocationService,
    private departmentService: DepartmentService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a room for an incident
   * @param incidentId - Incident ID
   * @param ttl - Time to live in seconds
   */
  async createIncidentRoom(incidentId: string, ttl?: number): Promise<void> {
    try {
      // Get incident details
      const incident = await this.incidentService.getIncidentById(incidentId);
      if (!incident) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      // Create room in Redis
      const roomKey = this.getIncidentRoomKey(incidentId);
      const roomData = {
        type: 'incident',
        incidentId: incident.id,
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
        locationId: incident.locationId,
        departmentId: incident.departmentId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (ttl || this.DEFAULT_ROOM_TTL) * 1000).toISOString(),
      };

      await this.redisService.set(roomKey, roomData, ttl || this.DEFAULT_ROOM_TTL);

      // Add room to incident index
      await this.redisService.sadd(this.getIncidentRoomsKey(), roomKey);

      // Add incident to location and department rooms
      if (incident.locationId) {
        await this.addIncidentToLocationRoom(incident.locationId, incidentId);
      }
      if (incident.departmentId) {
        await this.addIncidentToDepartmentRoom(incident.departmentId, incidentId);
      }

      this.logger.log(`Created room for incident ${incidentId}`);
    } catch (error) {
      this.logger.error(`Failed to create incident room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete an incident room
   * @param incidentId - Incident ID
   */
  async deleteIncidentRoom(incidentId: string): Promise<void> {
    try {
      const roomKey = this.getIncidentRoomKey(incidentId);

      // Get room data before deletion
      const roomData = await this.redisService.get(roomKey);
      if (!roomData) {
        this.logger.warn(`Incident room ${incidentId} not found`);
        return;
      }

      // Remove from incident index
      await this.redisService.srem(this.getIncidentRoomsKey(), roomKey);

      // Remove from location and department rooms if applicable
      if (roomData.locationId) {
        await this.removeIncidentFromLocationRoom(roomData.locationId, incidentId);
      }
      if (roomData.departmentId) {
        await this.removeIncidentFromDepartmentRoom(roomData.departmentId, incidentId);
      }

      // Delete the room
      await this.redisService.del(roomKey);

      this.logger.log(`Deleted room for incident ${incidentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete incident room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add user to incident room
   * @param incidentId - Incident ID
   * @param userId - User ID
   */
  async addUserToIncidentRoom(incidentId: string, userId: string): Promise<void> {
    try {
      const roomKey = this.getIncidentRoomKey(incidentId);
      const userKey = this.getUserRoomKey(userId);

      // Add user to room
      await this.redisService.sadd(roomKey, userKey);

      // Add room to user's rooms
      await this.redisService.sadd(userKey, roomKey);

      // Update user's last activity in room
      await this.redisService.hset(
        this.getRoomUserKey(roomKey, userId),
        {
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        }
      );

      // Notify WebSocket service
      this.webSocketService.sendToUser(userId, 'room:joined', {
        room: `incident:${incidentId}`,
        incidentId,
      });

      this.logger.debug(`Added user ${userId} to incident room ${incidentId}`);
    } catch (error) {
      this.logger.error(`Failed to add user to incident room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove user from incident room
   * @param incidentId - Incident ID
   * @param userId - User ID
   */
  async removeUserFromIncidentRoom(incidentId: string, userId: string): Promise<void> {
    try {
      const roomKey = this.getIncidentRoomKey(incidentId);
      const userKey = this.getUserRoomKey(userId);

      // Remove user from room
      await this.redisService.srem(roomKey, userKey);

      // Remove room from user's rooms
      await this.redisService.srem(userKey, roomKey);

      // Remove user's activity data
      await this.redisService.del(this.getRoomUserKey(roomKey, userId));

      // Notify WebSocket service
      this.webSocketService.sendToUser(userId, 'room:left', {
        room: `incident:${incidentId}`,
        incidentId,
      });

      this.logger.debug(`Removed user ${userId} from incident room ${incidentId}`);
    } catch (error) {
      this.logger.error(`Failed to remove user from incident room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a location room
   * @param locationId - Location ID
   * @param ttl - Time to live in seconds
   */
  async createLocationRoom(locationId: string, ttl?: number): Promise<void> {
    try {
      // Get location details
      const location = await this.locationService.getLocationById(locationId);
      if (!location) {
        throw new Error(`Location ${locationId} not found`);
      }

      // Create room in Redis
      const roomKey = this.getLocationRoomKey(locationId);
      const roomData = {
        type: 'location',
        locationId: location.id,
        name: location.name,
        address: location.address,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (ttl || this.DEFAULT_ROOM_TTL) * 1000).toISOString(),
      };

      await this.redisService.set(roomKey, roomData, ttl || this.DEFAULT_ROOM_TTL);

      // Add room to location index
      await this.redisService.sadd(this.getLocationRoomsKey(), roomKey);

      this.logger.log(`Created room for location ${locationId}`);
    } catch (error) {
      this.logger.error(`Failed to create location room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add incident to location room
   * @param locationId - Location ID
   * @param incidentId - Incident ID
   */
  async addIncidentToLocationRoom(locationId: string, incidentId: string): Promise<void> {
    try {
      const roomKey = this.getLocationRoomKey(locationId);
      await this.redisService.sadd(roomKey, incidentId);

      // Also add to the incident's location reference
      await this.redisService.hset(
        this.getIncidentRoomKey(incidentId),
        { locationId }
      );

      this.logger.debug(`Added incident ${incidentId} to location room ${locationId}`);
    } catch (error) {
      this.logger.error(`Failed to add incident to location room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove incident from location room
   * @param locationId - Location ID
   * @param incidentId - Incident ID
   */
  async removeIncidentFromLocationRoom(locationId: string, incidentId: string): Promise<void> {
    try {
      const roomKey = this.getLocationRoomKey(locationId);
      await this.redisService.srem(roomKey, incidentId);

      // Remove location reference from incident
      await this.redisService.hdel(
        this.getIncidentRoomKey(incidentId),
        'locationId'
      );

      this.logger.debug(`Removed incident ${incidentId} from location room ${locationId}`);
    } catch (error) {
      this.logger.error(`Failed to remove incident from location room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a department room
   * @param departmentId - Department ID
   * @param ttl - Time to live in seconds
   */
  async createDepartmentRoom(departmentId: string, ttl?: number): Promise<void> {
    try {
      // Get department details
      const department = await this.departmentService.getDepartmentById(departmentId);
      if (!department) {
        throw new Error(`Department ${departmentId} not found`);
      }

      // Create room in Redis
      const roomKey = this.getDepartmentRoomKey(departmentId);
      const roomData = {
        type: 'department',
        departmentId: department.id,
        name: department.name,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (ttl || this.DEFAULT_ROOM_TTL) * 1000).toISOString(),
      };

      await this.redisService.set(roomKey, roomData, ttl || this.DEFAULT_ROOM_TTL);

      // Add room to department index
      await this.redisService.sadd(this.getDepartmentRoomsKey(), roomKey);

      this.logger.log(`Created room for department ${departmentId}`);
    } catch (error) {
      this.logger.error(`Failed to create department room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add incident to department room
   * @param departmentId - Department ID
   * @param incidentId - Incident ID
   */
  async addIncidentToDepartmentRoom(departmentId: string, incidentId: string): Promise<void> {
    try {
      const roomKey = this.getDepartmentRoomKey(departmentId);
      await this.redisService.sadd(roomKey, incidentId);

      // Also add to the incident's department reference
      await this.redisService.hset(
        this.getIncidentRoomKey(incidentId),
        { departmentId }
      );

      this.logger.debug(`Added incident ${incidentId} to department room ${departmentId}`);
    } catch (error) {
      this.logger.error(`Failed to add incident to department room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove incident from department room
   * @param departmentId - Department ID
   * @param incidentId - Incident ID
   */
  async removeIncidentFromDepartmentRoom(departmentId: string, incidentId: string): Promise<void> {
    try {
      const roomKey = this.getDepartmentRoomKey(departmentId);
      await this.redisService.srem(roomKey, incidentId);

      // Remove department reference from incident
      await this.redisService.hdel(
        this.getIncidentRoomKey(incidentId),
        'departmentId'
      );

      this.logger.debug(`Removed incident ${incidentId} from department room ${departmentId}`);
    } catch (error) {
      this.logger.error(`Failed to remove incident from department room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a role room
   * @param roleName - Role name
   * @param ttl - Time to live in seconds
   */
  async createRoleRoom(roleName: string, ttl?: number): Promise<void> {
    try {
      // Create room in Redis
      const roomKey = this.getRoleRoomKey(roleName);
      const roomData = {
        type: 'role',
        role: roleName,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (ttl || this.DEFAULT_ROOM_TTL) * 1000).toISOString(),
      };

      await this.redisService.set(roomKey, roomData, ttl || this.DEFAULT_ROOM_TTL);

      // Add room to role index
      await this.redisService.sadd(this.getRoleRoomsKey(), roomKey);

      this.logger.log(`Created room for role ${roleName}`);
    } catch (error) {
      this.logger.error(`Failed to create role room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add user to role room
   * @param roleName - Role name
   * @param userId - User ID
   */
  async addUserToRoleRoom(roleName: string, userId: string): Promise<void> {
    try {
      const roomKey = this.getRoleRoomKey(roleName);
      const userKey = this.getUserRoomKey(userId);

      // Add user to room
      await this.redisService.sadd(roomKey, userKey);

      // Add room to user's rooms
      await this.redisService.sadd(userKey, roomKey);

      // Update user's last activity in room
      await this.redisService.hset(
        this.getRoomUserKey(roomKey, userId),
        {
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        }
      );

      // Notify WebSocket service
      this.webSocketService.sendToUser(userId, 'room:joined', {
        room: `role:${roleName}`,
        role: roleName,
      });

      this.logger.debug(`Added user ${userId} to role room ${roleName}`);
    } catch (error) {
      this.logger.error(`Failed to add user to role room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove user from role room
   * @param roleName - Role name
   * @param userId - User ID
   */
  async removeUserFromRoleRoom(roleName: string, userId: string): Promise<void> {
    try {
      const roomKey = this.getRoleRoomKey(roleName);
      const userKey = this.getUserRoomKey(userId);

      // Remove user from room
      await this.redisService.srem(roomKey, userKey);

      // Remove room from user's rooms
      await this.redisService.srem(userKey, roomKey);

      // Remove user's activity data
      await this.redisService.del(this.getRoomUserKey(roomKey, userId));

      // Notify WebSocket service
      this.webSocketService.sendToUser(userId, 'room:left', {
        room: `role:${roleName}`,
        role: roleName,
      });

      this.logger.debug(`Removed user ${userId} from role room ${roleName}`);
    } catch (error) {
      this.logger.error(`Failed to remove user from role room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all users in a room
   * @param roomKey - Room key
   * @returns Array of user IDs
   */
  async getUsersInRoom(roomKey: string): Promise<string[]> {
    try {
      const userKeys = await this.redisService.smembers(roomKey);
      return userKeys.map(key => this.extractUserIdFromKey(key));
    } catch (error) {
      this.logger.error(`Failed to get users in room ${roomKey}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all incidents in a location room
   * @param locationId - Location ID
   * @returns Array of incident IDs
   */
  async getIncidentsInLocationRoom(locationId: string): Promise<string[]> {
    try {
      const roomKey = this.getLocationRoomKey(locationId);
      return this.redisService.smembers(roomKey);
    } catch (error) {
      this.logger.error(`Failed to get incidents in location room ${locationId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all incidents in a department room
   * @param departmentId - Department ID
   * @returns Array of incident IDs
   */
  async getIncidentsInDepartmentRoom(departmentId: string): Promise<string[]> {
    try {
      const roomKey = this.getDepartmentRoomKey(departmentId);
      return this.redisService.smembers(roomKey);
    } catch (error) {
      this.logger.error(`Failed to get incidents in department room ${departmentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all rooms a user is in
   * @param userId - User ID
   * @returns Array of room keys
   */
  async getUserRooms(userId: string): Promise<string[]> {
    try {
      const userKey = this.getUserRoomKey(userId);
      return this.redisService.smembers(userKey);
    } catch (error) {
      this.logger.error(`Failed to get rooms for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get room details
   * @param roomKey - Room key
   * @returns Room details or null if not found
   */
  async getRoomDetails(roomKey: string): Promise<any> {
    try {
      return this.redisService.get(roomKey);
    } catch (error) {
      this.logger.error(`Failed to get details for room ${roomKey}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user activity in a room
   * @param roomKey - Room key
   * @param userId - User ID
   */
  async updateUserActivity(roomKey: string, userId: string): Promise<void> {
    try {
      await this.redisService.hset(
        this.getRoomUserKey(roomKey, userId),
        { lastActive: new Date().toISOString() }
      );
    } catch (error) {
      this.logger.error(`Failed to update user activity in room ${roomKey}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get active users in a room
   * @param roomKey - Room key
   * @param inactiveThreshold - Inactive threshold in seconds
   * @returns Array of active user IDs
   */
  async getActiveUsersInRoom(roomKey: string, inactiveThreshold: number = 300): Promise<string[]> {
    try {
      const userKeys = await this.redisService.smembers(roomKey);
      const activeUsers: string[] = [];

      for (const userKey of userKeys) {
        const userId = this.extractUserIdFromKey(userKey);
        const activityData = await this.redisService.hgetall(this.getRoomUserKey(roomKey, userId));

        if (activityData && activityData.lastActive) {
          const lastActive = new Date(activityData.lastActive);
          const now = new Date();
          const diff = (now.getTime() - lastActive.getTime()) / 1000;

          if (diff <= inactiveThreshold) {
            activeUsers.push(userId);
          }
        }
      }

      return activeUsers;
    } catch (error) {
      this.logger.error(`Failed to get active users in room ${roomKey}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all incident rooms
   * @returns Array of incident room keys
   */
  async getAllIncidentRooms(): Promise<string[]> {
    try {
      return this.redisService.smembers(this.getIncidentRoomsKey());
    } catch (error) {
      this.logger.error(`Failed to get all incident rooms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all location rooms
   * @returns Array of location room keys
   */
  async getAllLocationRooms(): Promise<string[]> {
    try {
      return this.redisService.smembers(this.getLocationRoomsKey());
    } catch (error) {
      this.logger.error(`Failed to get all location rooms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all department rooms
   * @returns Array of department room keys
   */
  async getAllDepartmentRooms(): Promise<string[]> {
    try {
      return this.redisService.smembers(this.getDepartmentRoomsKey());
    } catch (error) {
      this.logger.error(`Failed to get all department rooms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all role rooms
   * @returns Array of role room keys
   */
  async getAllRoleRooms(): Promise<string[]> {
    try {
      return this.redisService.smembers(this.getRoleRoomsKey());
    } catch (error) {
      this.logger.error(`Failed to get all role rooms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up expired rooms
   */
  async cleanupExpiredRooms(): Promise<void> {
    try {
      this.logger.log('Starting room cleanup');

      // Clean up incident rooms
      const incidentRooms = await this.getAllIncidentRooms();
      for (const roomKey of incidentRooms) {
        const roomData = await this.getRoomDetails(roomKey);
        if (roomData && new Date(roomData.expiresAt) < new Date()) {
          const incidentId = this.extractIncidentIdFromKey(roomKey);
          await this.deleteIncidentRoom(incidentId);
        }
      }

      // Clean up location rooms
      const locationRooms = await this.getAllLocationRooms();
      for (const roomKey of locationRooms) {
        const roomData = await this.getRoomDetails(roomKey);
        if (roomData && new Date(roomData.expiresAt) < new Date()) {
          await this.redisService.del(roomKey);
          await this.redisService.srem(this.getLocationRoomsKey(), roomKey);
        }
      }

      // Clean up department rooms
      const departmentRooms = await this.getAllDepartmentRooms();
      for (const roomKey of departmentRooms) {
        const roomData = await this.getRoomDetails(roomKey);
        if (roomData && new Date(roomData.expiresAt) < new Date()) {
          await this.redisService.del(roomKey);
          await this.redisService.srem(this.getDepartmentRoomsKey(), roomKey);
        }
      }

      // Clean up role rooms
      const roleRooms = await this.getAllRoleRooms();
      for (const roomKey of roleRooms) {
        const roomData = await this.getRoomDetails(roomKey);
        if (roomData && new Date(roomData.expiresAt) < new Date()) {
          await this.redisService.del(roomKey);
          await this.redisService.srem(this.getRoleRoomsKey(), roomKey);
        }
      }

      this.logger.log('Room cleanup completed');
    } catch (error) {
      this.logger.error(`Room cleanup failed: ${error.message}`);
    }
  }

  /**
   * Get incident room key
   * @param incidentId - Incident ID
   * @returns Room key
   */
  private getIncidentRoomKey(incidentId: string): string {
    return `room:incident:${incidentId}`;
  }

  /**
   * Get location room key
   * @param locationId - Location ID
   * @returns Room key
   */
  private getLocationRoomKey(locationId: string): string {
    return `room:location:${locationId}`;
  }

  /**
   * Get department room key
   * @param departmentId - Department ID
   * @returns Room key
   */
  private getDepartmentRoomKey(departmentId: string): string {
    return `room:department:${departmentId}`;
  }

  /**
   * Get role room key
   * @param roleName - Role name
   * @returns Room key
   */
  private getRoleRoomKey(roleName: string): string {
    return `room:role:${roleName}`;
  }

  /**
   * Get user room key
   * @param userId - User ID
   * @returns Room key
   */
  private getUserRoomKey(userId: string): string {
    return `user:rooms:${userId}`;
  }

  /**
   * Get room user activity key
   * @param roomKey - Room key
   * @param userId - User ID
   * @returns Activity key
   */
  private getRoomUserKey(roomKey: string, userId: string): string {
    return `${roomKey}:user:${userId}`;
  }

  /**
   * Get incident rooms index key
   * @returns Index key
   */
  private getIncidentRoomsKey(): string {
    return 'index:incident_rooms';
  }

  /**
   * Get location rooms index key
   * @returns Index key
   */
  private getLocationRoomsKey(): string {
    return 'index:location_rooms';
  }

  /**
   * Get department rooms index key
   * @returns Index key
   */
  private getDepartmentRoomsKey(): string {
    return 'index:department_rooms';
  }

  /**
   * Get role rooms index key
   * @returns Index key
   */
  private getRoleRoomsKey(): string {
    return 'index:role_rooms';
  }

  /**
   * Extract incident ID from room key
   * @param roomKey - Room key
   * @returns Incident ID
   */
  private extractIncidentIdFromKey(roomKey: string): string {
    return roomKey.split(':')[2];
  }

  /**
   * Extract user ID from user key
   * @param userKey - User key
   * @returns User ID
   */
  private extractUserIdFromKey(userKey: string): string {
    return userKey.split(':