# TO_BE_DESIGN.md: Next-Generation Tenant Management System

## Executive Vision (120+ lines)

### Strategic Transformation Vision

The next-generation Tenant Management System (TMS) represents a paradigm shift from traditional property management software to an intelligent, autonomous platform that redefines the entire real estate lifecycle. This transformation will position our organization at the forefront of PropTech innovation, creating a sustainable competitive advantage through:

1. **Autonomous Operations**: Leveraging AI to automate 80% of routine tenant interactions, lease administration, and maintenance coordination, reducing operational costs by 60% while improving response times from days to seconds.

2. **Predictive Ecosystem**: Implementing machine learning models that predict tenant behavior, maintenance needs, and financial risks with 92%+ accuracy, enabling proactive rather than reactive management.

3. **Unified Experience Platform**: Creating a seamless digital ecosystem that connects tenants, property managers, maintenance teams, and owners through a single intelligent interface with real-time synchronization.

4. **Regulatory Intelligence**: Building an AI-powered compliance engine that automatically adapts to changing local, state, and federal regulations, reducing legal exposure by 95%.

5. **Financial Optimization**: Implementing dynamic pricing algorithms and automated rent collection systems that improve cash flow by 30% while reducing delinquencies by 70%.

### Business Transformation Goals

**Short-Term (0-12 months):**
- Achieve 99.99% system availability with multi-region deployment
- Reduce tenant onboarding time from 2 hours to 15 minutes
- Implement real-time maintenance tracking with 5-minute resolution
- Launch predictive maintenance system reducing emergency calls by 40%
- Achieve WCAG 2.1 AAA compliance across all interfaces

**Medium-Term (12-24 months):**
- Automate 70% of lease administration tasks
- Implement dynamic pricing for 100% of managed properties
- Reduce operational costs by 45% through process automation
- Launch tenant self-service portal with 90% adoption rate
- Implement blockchain-based lease verification system

**Long-Term (24-36 months):**
- Create autonomous property management system requiring <5% human intervention
- Implement global property management network with cross-border compliance
- Develop AI-powered tenant matching system with 95% satisfaction rate
- Achieve net-zero operational carbon footprint through smart resource management
- Establish industry standard API for third-party integrations

### User Experience Revolution

**Tenant Experience:**
- **Conversational Interface**: AI-powered chatbot available 24/7 with natural language understanding, capable of handling 95% of tenant inquiries without human intervention
- **Proactive Notifications**: Context-aware alerts that anticipate needs (e.g., "Your rent is due in 3 days - would you like to set up autopay?")
- **Augmented Reality Maintenance**: AR-enabled maintenance requests where tenants can point their phone at an issue and the system automatically generates a work order with visual documentation
- **Community Building**: Virtual community spaces with interest-based groups, event planning, and neighbor matching
- **Financial Wellness**: Integrated budgeting tools and rent reporting to credit bureaus

**Property Manager Experience:**
- **Intelligent Dashboard**: Single pane of glass showing property health scores, predictive alerts, and recommended actions
- **Automated Workflows**: AI-driven task prioritization and automated routing of maintenance requests
- **Performance Analytics**: Real-time KPI tracking with benchmarking against similar properties
- **Compliance Assistant**: Automated compliance checks and documentation generation
- **Mobile Command Center**: Full functionality available on mobile with offline capabilities

**Owner Experience:**
- **Portfolio Intelligence**: AI-generated insights about portfolio performance and optimization opportunities
- **Predictive ROI**: Forecasting tools that model different investment scenarios
- **Transparent Reporting**: Real-time financial reporting with drill-down capabilities
- **Risk Assessment**: Automated risk scoring for each property and tenant
- **Capital Planning**: AI-driven recommendations for capital improvements

### Competitive Advantages

1. **First-Mover in Autonomous Property Management**: While competitors focus on incremental improvements, we're building the first truly autonomous property management system.

2. **AI-Native Architecture**: Unlike bolt-on AI solutions, our system is designed from the ground up with machine learning at its core.

3. **Regulatory Intelligence Engine**: Our compliance system doesn't just track regulations - it interprets them and automatically updates business processes.

4. **Tenant Lifecycle Management**: We manage the entire tenant journey from prospect to alumni, creating a sticky ecosystem.

5. **Ecosystem Integration**: Our open API and marketplace will become the de facto standard for PropTech integrations.

6. **Predictive Maintenance**: Our system doesn't just react to maintenance issues - it predicts and prevents them.

7. **Dynamic Pricing**: AI-driven pricing that maximizes revenue while maintaining occupancy rates.

8. **Blockchain Verification**: Immutable records for leases, payments, and maintenance history.

### Long-Term Roadmap

**Year 1: Foundation and Intelligence**
- Core platform migration to microservices architecture
- Implementation of AI/ML models for predictive maintenance and risk assessment
- Launch of tenant and owner portals
- Initial third-party integrations (Stripe, Salesforce, etc.)
- Achievement of WCAG 2.1 AAA compliance

**Year 2: Automation and Expansion**
- Implementation of autonomous workflows for 70% of routine tasks
- Launch of dynamic pricing system
- Expansion of third-party ecosystem
- Implementation of blockchain for lease verification
- Launch of mobile apps with PWA capabilities

**Year 3: Autonomy and Ecosystem**
- Autonomous property management with <5% human intervention
- Global expansion with cross-border compliance
- AI-powered tenant matching system
- Carbon-neutral operations through smart resource management
- Industry-standard API adoption

**Year 4: Market Leadership**
- 60% market share in managed properties
- Platform becomes the de facto standard for PropTech
- Autonomous property management as a service
- Predictive analytics for real estate investment
- Fully autonomous maintenance and operations

## Performance Enhancements (300+ lines)

### Redis Caching Layer Implementation

```typescript
// src/cache/redis-cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import { promisify } from 'util';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: RedisClientType;
  private getAsync: (key: string) => Promise<string | null>;
  private setAsync: (key: string, value: string, mode?: string, duration?: number) => Promise<string>;
  private delAsync: (key: string) => Promise<number>;
  private keysAsync: (pattern: string) => Promise<string[]>;

  constructor(private configService: ConfigService) {
    this.initializeRedisClient();
  }

  private async initializeRedisClient() {
    try {
      this.client = createClient({
        url: this.configService.get<string>('REDIS_URL'),
        socket: {
          tls: this.configService.get<boolean>('REDIS_TLS'),
          rejectUnauthorized: false
        }
      }) as RedisClientType;

      this.client.on('error', (err) => {
        this.logger.error(`Redis error: ${err}`);
      });

      this.client.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      await this.client.connect();

      // Promisify Redis commands
      this.getAsync = promisify(this.client.get).bind(this.client);
      this.setAsync = promisify(this.client.set).bind(this.client);
      this.delAsync = promisify(this.client.del).bind(this.client);
      this.keysAsync = promisify(this.client.keys).bind(this.client);

      // Set up cache invalidation listeners
      this.setupCacheInvalidation();
    } catch (error) {
      this.logger.error(`Failed to initialize Redis: ${error.message}`);
      throw error;
    }
  }

  private setupCacheInvalidation() {
    // Listen for tenant updates to invalidate cache
    this.client.subscribe('tenant-updates', (message) => {
      const { tenantId } = JSON.parse(message);
      this.invalidateTenantCache(tenantId);
    });

    // Listen for property updates
    this.client.subscribe('property-updates', (message) => {
      const { propertyId } = JSON.parse(message);
      this.invalidatePropertyCache(propertyId);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.getAsync(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const stringValue = JSON.stringify(value);
      const result = ttl
        ? await this.setAsync(key, stringValue, 'EX', ttl)
        : await this.setAsync(key, stringValue);
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}: ${error.message}`);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.delAsync(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}: ${error.message}`);
      return false;
    }
  }

  async invalidateTenantCache(tenantId: string): Promise<void> {
    try {
      const pattern = `tenant:${tenantId}:*`;
      const keys = await this.keysAsync(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.log(`Invalidated ${keys.length} cache entries for tenant ${tenantId}`);
      }
    } catch (error) {
      this.logger.error(`Error invalidating tenant cache: ${error.message}`);
    }
  }

  async invalidatePropertyCache(propertyId: string): Promise<void> {
    try {
      const pattern = `property:${propertyId}:*`;
      const keys = await this.keysAsync(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.log(`Invalidated ${keys.length} cache entries for property ${propertyId}`);
      }
    } catch (error) {
      this.logger.error(`Error invalidating property cache: ${error.message}`);
    }
  }

  async getWithFallback<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        return cachedValue;
      }

      const freshValue = await fallbackFn();
      if (freshValue !== null && freshValue !== undefined) {
        await this.set(key, freshValue, ttl);
      }

      return freshValue;
    } catch (error) {
      this.logger.error(`Error in getWithFallback for key ${key}: ${error.message}`);
      return fallbackFn();
    }
  }

  async cacheTenantData(tenantId: string, data: any, ttl?: number): Promise<boolean> {
    const key = `tenant:${tenantId}:full`;
    return this.set(key, data, ttl);
  }

  async getCachedTenantData(tenantId: string): Promise<any> {
    const key = `tenant:${tenantId}:full`;
    return this.get(key);
  }

  async cachePropertyData(propertyId: string, data: any, ttl?: number): Promise<boolean> {
    const key = `property:${propertyId}:full`;
    return this.set(key, data, ttl);
  }

  async getCachedPropertyData(propertyId: string): Promise<any> {
    const key = `property:${propertyId}:full`;
    return this.get(key);
  }

  async cachePaginatedResults(
    baseKey: string,
    page: number,
    pageSize: number,
    data: any,
    ttl?: number
  ): Promise<boolean> {
    const key = `${baseKey}:page:${page}:size:${pageSize}`;
    return this.set(key, data, ttl);
  }

  async getCachedPaginatedResults(
    baseKey: string,
    page: number,
    pageSize: number
  ): Promise<any> {
    const key = `${baseKey}:page:${page}:size:${pageSize}`;
    return this.get(key);
  }

  async close(): Promise<void> {
    try {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error(`Error closing Redis connection: ${error.message}`);
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
import { Tenant } from '../tenants/entities/tenant.entity';
import { Property } from '../properties/entities/property.entity';
import { Lease } from '../leases/entities/lease.entity';
import { MaintenanceRequest } from '../maintenance/entities/maintenance-request.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Between, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
    @InjectRepository(Lease)
    private leaseRepository: Repository<Lease>,
    @InjectRepository(MaintenanceRequest)
    private maintenanceRepository: Repository<MaintenanceRequest>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>
  ) {}

  async getOptimizedTenantQuery(
    filters: {
      status?: string[];
      propertyId?: string;
      searchTerm?: string;
      minRent?: number;
      maxRent?: number;
      leaseStartDate?: Date;
      leaseEndDate?: Date;
      hasMaintenanceIssues?: boolean;
      page?: number;
      pageSize?: number;
    }
  ): Promise<{ data: Tenant[]; count: number }> {
    const { page = 1, pageSize = 20 } = filters;
    const skip = (page - 1) * pageSize;

    const query = this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.currentLease', 'lease')
      .leftJoinAndSelect('lease.property', 'property')
      .leftJoinAndSelect('tenant.maintenanceRequests', 'maintenanceRequests')
      .leftJoinAndSelect('tenant.payments', 'payments')
      .where('tenant.isActive = :isActive', { isActive: true });

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      query.andWhere('tenant.status IN (:...status)', { status: filters.status });
    }

    // Apply property filter
    if (filters.propertyId) {
      query.andWhere('property.id = :propertyId', { propertyId: filters.propertyId });
    }

    // Apply search term filter
    if (filters.searchTerm) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('tenant.firstName ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('tenant.lastName ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('tenant.email ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('tenant.phone ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('property.address ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          });
        })
      );
    }

    // Apply rent range filter
    if (filters.minRent || filters.maxRent) {
      if (filters.minRent && filters.maxRent) {
        query.andWhere('lease.monthlyRent BETWEEN :minRent AND :maxRent', {
          minRent: filters.minRent,
          maxRent: filters.maxRent,
        });
      } else if (filters.minRent) {
        query.andWhere('lease.monthlyRent >= :minRent', { minRent: filters.minRent });
      } else if (filters.maxRent) {
        query.andWhere('lease.monthlyRent <= :maxRent', { maxRent: filters.maxRent });
      }
    }

    // Apply lease date filters
    if (filters.leaseStartDate && filters.leaseEndDate) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            new Brackets((qb2) => {
              qb2.where('lease.startDate <= :endDate', { endDate: filters.leaseEndDate })
                .andWhere('lease.endDate >= :startDate', { startDate: filters.leaseStartDate });
            })
          )
          .orWhere(
            new Brackets((qb2) => {
              qb2.where('lease.startDate IS NULL').andWhere('lease.endDate IS NULL');
            })
          );
        })
      );
    } else if (filters.leaseStartDate) {
      query.andWhere('lease.endDate >= :startDate', { startDate: filters.leaseStartDate });
    } else if (filters.leaseEndDate) {
      query.andWhere('lease.startDate <= :endDate', { endDate: filters.leaseEndDate });
    }

    // Apply maintenance issues filter
    if (filters.hasMaintenanceIssues !== undefined) {
      if (filters.hasMaintenanceIssues) {
        query.andWhere('maintenanceRequests.status IN (:...statuses)', {
          statuses: ['open', 'in_progress'],
        });
      } else {
        query.andWhere(
          new Brackets((qb) => {
            qb.where('maintenanceRequests.id IS NULL').orWhere(
              'maintenanceRequests.status NOT IN (:...statuses)',
              { statuses: ['open', 'in_progress'] }
            );
          })
        );
      }
    }

    // Optimize query execution
    query
      .orderBy('tenant.lastName', 'ASC')
      .addOrderBy('tenant.firstName', 'ASC')
      .skip(skip)
      .take(pageSize);

    // Get count for pagination
    const [data, count] = await Promise.all([
      query.getMany(),
      query.getCount(),
    ]);

    return { data, count };
  }

  async getOptimizedPropertyQuery(
    filters: {
      status?: string[];
      propertyType?: string[];
      minUnits?: number;
      maxUnits?: number;
      minOccupancy?: number;
      maxOccupancy?: number;
      searchTerm?: string;
      hasMaintenanceIssues?: boolean;
      page?: number;
      pageSize?: number;
    }
  ): Promise<{ data: Property[]; count: number }> {
    const { page = 1, pageSize = 20 } = filters;
    const skip = (page - 1) * pageSize;

    const query = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.units', 'units')
      .leftJoinAndSelect('units.currentLease', 'lease')
      .leftJoinAndSelect('property.maintenanceRequests', 'maintenanceRequests')
      .where('property.isActive = :isActive', { isActive: true });

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      query.andWhere('property.status IN (:...status)', { status: filters.status });
    }

    // Apply property type filter
    if (filters.propertyType && filters.propertyType.length > 0) {
      query.andWhere('property.type IN (:...propertyType)', {
        propertyType: filters.propertyType,
      });
    }

    // Apply unit count filters
    if (filters.minUnits || filters.maxUnits) {
      if (filters.minUnits && filters.maxUnits) {
        query.andWhere('property.totalUnits BETWEEN :minUnits AND :maxUnits', {
          minUnits: filters.minUnits,
          maxUnits: filters.maxUnits,
        });
      } else if (filters.minUnits) {
        query.andWhere('property.totalUnits >= :minUnits', { minUnits: filters.minUnits });
      } else if (filters.maxUnits) {
        query.andWhere('property.totalUnits <= :maxUnits', { maxUnits: filters.maxUnits });
      }
    }

    // Apply occupancy filters
    if (filters.minOccupancy || filters.maxOccupancy) {
      if (filters.minOccupancy && filters.maxOccupancy) {
        query.andWhere(
          '(SELECT COUNT(*) FROM unit WHERE unit.propertyId = property.id AND unit.status = :occupied) BETWEEN :minOccupancy AND :maxOccupancy',
          {
            occupied: 'occupied',
            minOccupancy: filters.minOccupancy,
            maxOccupancy: filters.maxOccupancy,
          }
        );
      } else if (filters.minOccupancy) {
        query.andWhere(
          '(SELECT COUNT(*) FROM unit WHERE unit.propertyId = property.id AND unit.status = :occupied) >= :minOccupancy',
          { occupied: 'occupied', minOccupancy: filters.minOccupancy }
        );
      } else if (filters.maxOccupancy) {
        query.andWhere(
          '(SELECT COUNT(*) FROM unit WHERE unit.propertyId = property.id AND unit.status = :occupied) <= :maxOccupancy',
          { occupied: 'occupied', maxOccupancy: filters.maxOccupancy }
        );
      }
    }

    // Apply search term filter
    if (filters.searchTerm) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('property.address ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('property.city ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('property.state ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('property.zipCode ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('property.name ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          });
        })
      );
    }

    // Apply maintenance issues filter
    if (filters.hasMaintenanceIssues !== undefined) {
      if (filters.hasMaintenanceIssues) {
        query.andWhere('maintenanceRequests.status IN (:...statuses)', {
          statuses: ['open', 'in_progress'],
        });
      } else {
        query.andWhere(
          new Brackets((qb) => {
            qb.where('maintenanceRequests.id IS NULL').orWhere(
              'maintenanceRequests.status NOT IN (:...statuses)',
              { statuses: ['open', 'in_progress'] }
            );
          })
        );
      }
    }

    // Optimize query execution
    query
      .orderBy('property.name', 'ASC')
      .skip(skip)
      .take(pageSize);

    // Get count for pagination
    const [data, count] = await Promise.all([
      query.getMany(),
      query.getCount(),
    ]);

    return { data, count };
  }

  async getOptimizedMaintenanceQuery(
    filters: {
      status?: string[];
      priority?: string[];
      propertyId?: string;
      tenantId?: string;
      requestDateFrom?: Date;
      requestDateTo?: Date;
      completionDateFrom?: Date;
      completionDateTo?: Date;
      searchTerm?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<{ data: MaintenanceRequest[]; count: number }> {
    const { page = 1, pageSize = 20 } = filters;
    const skip = (page - 1) * pageSize;

    const query = this.maintenanceRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.property', 'property')
      .leftJoinAndSelect('request.tenant', 'tenant')
      .leftJoinAndSelect('request.assignedTo', 'assignedTo')
      .leftJoinAndSelect('request.workOrder', 'workOrder')
      .where('request.isActive = :isActive', { isActive: true });

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      query.andWhere('request.status IN (:...status)', { status: filters.status });
    }

    // Apply priority filter
    if (filters.priority && filters.priority.length > 0) {
      query.andWhere('request.priority IN (:...priority)', { priority: filters.priority });
    }

    // Apply property filter
    if (filters.propertyId) {
      query.andWhere('property.id = :propertyId', { propertyId: filters.propertyId });
    }

    // Apply tenant filter
    if (filters.tenantId) {
      query.andWhere('tenant.id = :tenantId', { tenantId: filters.tenantId });
    }

    // Apply date range filters
    if (filters.requestDateFrom && filters.requestDateTo) {
      query.andWhere('request.createdAt BETWEEN :from AND :to', {
        from: filters.requestDateFrom,
        to: filters.requestDateTo,
      });
    } else if (filters.requestDateFrom) {
      query.andWhere('request.createdAt >= :from', { from: filters.requestDateFrom });
    } else if (filters.requestDateTo) {
      query.andWhere('request.createdAt <= :to', { to: filters.requestDateTo });
    }

    if (filters.completionDateFrom && filters.completionDateTo) {
      query.andWhere('request.completedAt BETWEEN :from AND :to', {
        from: filters.completionDateFrom,
        to: filters.completionDateTo,
      });
    } else if (filters.completionDateFrom) {
      query.andWhere('request.completedAt >= :from', { from: filters.completionDateFrom });
    } else if (filters.completionDateTo) {
      query.andWhere('request.completedAt <= :to', { to: filters.completionDateTo });
    }

    // Apply search term filter
    if (filters.searchTerm) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('request.title ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('request.description ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('property.address ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('tenant.firstName ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('tenant.lastName ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          });
        })
      );
    }

    // Optimize query execution
    query
      .orderBy('request.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    // Get count for pagination
    const [data, count] = await Promise.all([
      query.getMany(),
      query.getCount(),
    ]);

    return { data, count };
  }

  async getOptimizedPaymentQuery(
    filters: {
      status?: string[];
      paymentMethod?: string[];
      propertyId?: string;
      tenantId?: string;
      minAmount?: number;
      maxAmount?: number;
      paymentDateFrom?: Date;
      paymentDateTo?: Date;
      dueDateFrom?: Date;
      dueDateTo?: Date;
      searchTerm?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<{ data: Payment[]; count: number }> {
    const { page = 1, pageSize = 20 } = filters;
    const skip = (page - 1) * pageSize;

    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.tenant', 'tenant')
      .leftJoinAndSelect('payment.lease', 'lease')
      .leftJoinAndSelect('lease.property', 'property')
      .where('payment.isActive = :isActive', { isActive: true });

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      query.andWhere('payment.status IN (:...status)', { status: filters.status });
    }

    // Apply payment method filter
    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      query.andWhere('payment.paymentMethod IN (:...paymentMethod)', {
        paymentMethod: filters.paymentMethod,
      });
    }

    // Apply property filter
    if (filters.propertyId) {
      query.andWhere('property.id = :propertyId', { propertyId: filters.propertyId });
    }

    // Apply tenant filter
    if (filters.tenantId) {
      query.andWhere('tenant.id = :tenantId', { tenantId: filters.tenantId });
    }

    // Apply amount filters
    if (filters.minAmount || filters.maxAmount) {
      if (filters.minAmount && filters.maxAmount) {
        query.andWhere('payment.amount BETWEEN :minAmount AND :maxAmount', {
          minAmount: filters.minAmount,
          maxAmount: filters.maxAmount,
        });
      } else if (filters.minAmount) {
        query.andWhere('payment.amount >= :minAmount', { minAmount: filters.minAmount });
      } else if (filters.maxAmount) {
        query.andWhere('payment.amount <= :maxAmount', { maxAmount: filters.maxAmount });
      }
    }

    // Apply payment date filters
    if (filters.paymentDateFrom && filters.paymentDateTo) {
      query.andWhere('payment.paymentDate BETWEEN :from AND :to', {
        from: filters.paymentDateFrom,
        to: filters.paymentDateTo,
      });
    } else if (filters.paymentDateFrom) {
      query.andWhere('payment.paymentDate >= :from', { from: filters.paymentDateFrom });
    } else if (filters.paymentDateTo) {
      query.andWhere('payment.paymentDate <= :to', { to: filters.paymentDateTo });
    }

    // Apply due date filters
    if (filters.dueDateFrom && filters.dueDateTo) {
      query.andWhere('payment.dueDate BETWEEN :from AND :to', {
        from: filters.dueDateFrom,
        to: filters.dueDateTo,
      });
    } else if (filters.dueDateFrom) {
      query.andWhere('payment.dueDate >= :from', { from: filters.dueDateFrom });
    } else if (filters.dueDateTo) {
      query.andWhere('payment.dueDate <= :to', { to: filters.dueDateTo });
    }

    // Apply search term filter
    if (filters.searchTerm) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('payment.referenceNumber ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('tenant.firstName ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('tenant.lastName ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          })
          .orWhere('property.address ILIKE :searchTerm', {
            searchTerm: `%${filters.searchTerm}%`,
          });
        })
      );
    }

    // Optimize query execution
    query
      .orderBy('payment.paymentDate', 'DESC')
      .skip(skip)
      .take(pageSize);

    // Get count for pagination
    const [data, count] = await Promise.all([
      query.getMany(),
      query.getCount(),
    ]);

    return { data, count };
  }

  async getTenantFinancialSummary(tenantId: string): Promise<any> {
    const query = this.tenantRepository
      .createQueryBuilder('tenant')
      .select([
        'tenant.id',
        'tenant.firstName',
        'tenant.lastName',
        'SUM(payment.amount) as totalPaid',
        'SUM(CASE WHEN payment.status = :paid THEN payment.amount ELSE 0 END) as paidAmount',
        'SUM(CASE WHEN payment.status = :pending THEN payment.amount ELSE 0 END) as pendingAmount',
        'SUM(CASE WHEN payment.status = :overdue THEN payment.amount ELSE 0 END) as overdueAmount',
        'COUNT(payment.id) as paymentCount',
        'COUNT(CASE WHEN payment.status = :overdue THEN 1 ELSE NULL END) as overdueCount',
        'AVG(payment.amount) as avgPaymentAmount',
        'MAX(payment.paymentDate) as lastPaymentDate',
      ])
      .leftJoin('tenant.payments', 'payment')
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('payment.isActive = :isActive', { isActive: true })
      .setParameter('paid', 'paid')
      .setParameter('pending', 'pending')
      .setParameter('overdue', 'overdue')
      .groupBy('tenant.id');

    const result = await query.getRawOne();

    if (!result) {
      return null;
    }

    return {
      tenantId: result.tenant_id,
      firstName: result.tenant_firstName,
      lastName: result.tenant_lastName,
      totalPaid: parseFloat(result.totalPaid) || 0,
      paidAmount: parseFloat(result.paidAmount) || 0,
      pendingAmount: parseFloat(result.pendingAmount) || 0,
      overdueAmount: parseFloat(result.overdueAmount) || 0,
      paymentCount: parseInt(result.paymentCount) || 0,
      overdueCount: parseInt(result.overdueCount) || 0,
      avgPaymentAmount: parseFloat(result.avgPaymentAmount) || 0,
      lastPaymentDate: result.lastPaymentDate,
      paymentStatus: this.calculatePaymentStatus(
        parseFloat(result.paidAmount) || 0,
        parseFloat(result.pendingAmount) || 0,
        parseFloat(result.overdueAmount) || 0
      ),
    };
  }

  private calculatePaymentStatus(
    paidAmount: number,
    pendingAmount: number,
    overdueAmount: number
  ): string {
    if (overdueAmount > 0) {
      return 'at_risk';
    }
    if (pendingAmount > 0) {
      return 'pending';
    }
    if (paidAmount > 0) {
      return 'good';
    }
    return 'unknown';
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

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly compressionMiddleware: any;

  constructor(private configService: ConfigService) {
    this.compressionMiddleware = compression({
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
          contentType.includes('application/pdf')
        )) {
          return false;
        }

        return compression.filter(req, res);
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Set compression headers
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('X-Content-Encoding', 'gzip');

    // Apply compression
    this.compressionMiddleware(req, res, next);
  }
}

// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseCompressionMiddleware } from './middleware/response-compression.middleware';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with specific configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Apply response compression middleware
  app.use(new ResponseCompressionMiddleware(app.get(ConfigService)).use);

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Tenant Management System API')
    .setDescription('API documentation for the Tenant Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
```

### Lazy Loading Implementation

```typescript
// src/common/lazy-loader.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { LAZY_LOAD_METADATA } from './constants';

export function LazyLoad(relations: string[] | string) {
  const relationsArray = Array.isArray(relations) ? relations : [relations];
  return applyDecorators(
    SetMetadata(LAZY_LOAD_METADATA, relationsArray),
  );
}

// src/common/lazy-load.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LAZY_LOAD_METADATA } from './constants';
import { DataSource } from 'typeorm';
import { plainToClass } from 'class-transformer';

@Injectable()
export class LazyLoadInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LazyLoadInterceptor.name);

  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const relations = this.reflector.get<string[]>(
      LAZY_LOAD_METADATA,
      context.getHandler(),
    );

    if (!relations || relations.length === 0) {
      return next.handle();
    }

    return next.handle().pipe(
      map(async (data) => {
        if (!data) {
          return data;
        }

        try {
          if (Array.isArray(data)) {
            return await this.loadRelationsForArray(data, relations);
          } else {
            return await this.loadRelationsForEntity(data, relations);
          }
        } catch (error) {
          this.logger.error(`Error during lazy loading: ${error.message}`);
          return data;
        }
      }),
    );
  }

  private async loadRelationsForArray(entities: any[], relations: string[]): Promise<any[]> {
    if (entities.length === 0) {
      return entities;
    }

    // Group entities by their type
    const entityGroups = this.groupEntitiesByType(entities);

    // Load relations for each group
    const results = await Promise.all(
      Object.entries(entityGroups).map(async ([entityName, entityInstances]) => {
        const repository = this.dataSource.getRepository(entityName);
        const primaryColumn = repository.metadata.primaryColumns[0].propertyName;

        // Create a map of entity IDs for quick lookup
        const idMap = new Map<string, any>();
        entityInstances.forEach((entity) => {
          idMap.set(entity[primaryColumn], entity);
        });

        // Load relations for all entities of this type
        const ids = Array.from(idMap.keys());
        const query = repository
          .createQueryBuilder(entityName)
          .whereInIds(ids);

        // Add all relations to the query
        relations.forEach((relation) => {
          query.leftJoinAndSelect(`${entityName}.${relation}`, relation);
        });

        const loadedEntities = await query.getMany();

        // Merge loaded relations back into the original entities
        return loadedEntities.map((loadedEntity) => {
          const originalEntity = idMap.get(loadedEntity[primaryColumn]);
          return { ...originalEntity, ...loadedEntity };
        });
      }),
    );

    // Flatten the results
    return results.flat();
  }

  private async loadRelationsForEntity(entity: any, relations: string[]): Promise<any> {
    if (!entity) {
      return entity;
    }

    const entityName = entity.constructor.name;
    const repository = this.dataSource.getRepository(entityName);
    const primaryColumn = repository.metadata.primaryColumns[0].propertyName;
    const id = entity[primaryColumn];

    const query = repository
      .createQueryBuilder(entityName)
      .where(`${entityName}.${primaryColumn} = :id`, { id });

    // Add all relations to the query
    relations.forEach((relation) => {
      query.leftJoinAndSelect(`${entityName}.${relation}`, relation);
    });

    const loadedEntity = await query.getOne();

    return loadedEntity || entity;
  }

  private groupEntitiesByType(entities: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    entities.forEach((entity) => {
      const entityName = entity.constructor.name;
      if (!groups[entityName]) {
        groups[entityName] = [];
      }
      groups[entityName].push(entity);
    });

    return groups;
  }
}

// src/tenants/tenants.controller.ts
import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { LazyLoad } from '../common/lazy-loader.decorator';
import { LazyLoadInterceptor } from '../common/lazy-load.interceptor';

@Controller('tenants')
@UseInterceptors(LazyLoadInterceptor)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @LazyLoad(['currentLease', 'currentLease.property', 'maintenanceRequests'])
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @LazyLoad([
    'currentLease',
    'currentLease.property',
    'maintenanceRequests',
    'maintenanceRequests.workOrder',
    'payments',
    'documents',
    'communicationLogs',
  ])
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/financial-summary')
  @LazyLoad(['payments', 'currentLease'])
  async getFinancialSummary(@Param('id') id: string) {
    return this.tenantsService.getFinancialSummary(id);
  }
}

// src/common/lazy-load.module.ts
import { Module, Global } from '@nestjs/common';
import { LazyLoadInterceptor } from './lazy-load.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LazyLoadInterceptor,
    },
  ],
  exports: [LazyLoadInterceptor],
})
export class LazyLoadModule {}
```

### Request Debouncing

```typescript
// src/common/debounce.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { DEBOUNCE_METADATA } from './constants';

export function Debounce(
  options: {
    key?: string | ((...args: any[]) => string);
    wait?: number;
    leading?: boolean;
    trailing?: boolean;
  } = {}
) {
  const {
    key = '',
    wait = 300,
    leading = false,
    trailing = true,
  } = options;

  return applyDecorators(
    SetMetadata(DEBOUNCE_METADATA, {
      key,
      wait,
      leading,
      trailing,
    }),
  );
}

// src/common/debounce.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, mergeMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { DEBOUNCE_METADATA } from './constants';
import * as lodash from 'lodash';

@Injectable()
export class DebounceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DebounceInterceptor.name);
  private debounceStore = new Map<string, lodash.DebouncedFunc<() => Promise<any>>>();

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const debounceOptions = this.reflector.get<any>(
      DEBOUNCE_METADATA,
      context.getHandler(),
    );

    if (!debounceOptions) {
      return next.handle();
    }

    const { key, wait, leading, trailing } = debounceOptions;
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Generate a unique key for this request
    const requestKey = this.generateRequestKey(request, key);

    // Check if we already have a debounced function for this key
    if (!this.debounceStore.has(requestKey)) {
      const debouncedFn = lodash.debounce(
        async () => {
          try {
            const result = await next.handle().toPromise();
            response.json(result);
          } catch (error) {
            response.status(error.status || 500).json({
              statusCode: error.status || 500,
              message: error.message,
            });
          }
        },
        wait,
        { leading, trailing },
      );

      this.debounceStore.set(requestKey, debouncedFn);
    }

    const debouncedFn = this.debounceStore.get(requestKey);

    return of(null).pipe(
      tap(() => {
        debouncedFn();
      }),
      mergeMap(() => {
        // Return an empty observable since the response is handled by the debounced function
        return new Observable((subscriber) => {
          // We need to keep the connection open until the debounced function completes
          const checkInterval = setInterval(() => {
            if (response.headersSent) {
              clearInterval(checkInterval);
              subscriber.complete();
            }
          }, 100);

          // Clean up on unsubscribe
          return () => {
            clearInterval(checkInterval);
          };
        });
      }),
    );
  }

  private generateRequestKey(
    request: any,
    key: string | ((...args: any[]) => string),
  ): string {
    if (typeof key === 'function') {
      return key(request);
    }

    if (key) {
      return `${request.route.path}:${key}`;
    }

    // Default key based on request parameters
    const params = Object.entries(request.params || {})
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const query = Object.entries(request.query || {})
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    return `${request.route.path}?${params}&${query}`;
  }
}

// src/tenants/tenants.controller.ts
import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Debounce } from '../common/debounce.decorator';
import { DebounceInterceptor } from '../common/debounce.interceptor';

@Controller('tenants')
@UseInterceptors(DebounceInterceptor)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('search')
  @Debounce({
    key: (req) => {
      // Create a unique key based on search parameters
      const { searchTerm, status, propertyId } = req.query;
      return `search:${searchTerm}:${status}:${propertyId}`;
    },
    wait: 500,
  })
  async searchTenants(
    @Query('searchTerm') searchTerm?: string,
    @Query('status') status?: string[],
    @Query('propertyId') propertyId?: string,
  ) {
    return this.tenantsService.search({
      searchTerm,
      status,
      propertyId,
    });
  }

  @Get('dashboard')
  @Debounce({
    key: 'dashboard',
    wait: 1000,
  })
  async getDashboardData() {
    return this.tenantsService.getDashboardData();
  }

  @Get('financial-report')
  @Debounce({
    key: (req) => {
      const { period, propertyId } = req.query;
      return `financial-report:${period}:${propertyId}`;
    },
    wait: 1500,
  })
  async getFinancialReport(
    @Query('period') period: string,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.tenantsService.getFinancialReport(period, propertyId);
  }
}

// src/common/debounce.module.ts
import { Module, Global } from '@nestjs/common';
import { DebounceInterceptor } from './debounce.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DebounceInterceptor,
    },
  ],
  exports: [DebounceInterceptor],
})
export class DebounceModule {}
```

### Connection Pooling

```typescript
// src/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: configService.get('DB_LOGGING') === 'true',
        migrationsRun: configService.get('DB_MIGRATIONS_RUN') === 'true',
        migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
        ssl: configService.get('DB_SSL') === 'true' ? {
          rejectUnauthorized: false,
        } : false,
        extra: {
          // Connection pool settings
          max: configService.get('DB_POOL_MAX') || 20,
          min: configService.get('DB_POOL_MIN') || 2,
          idleTimeoutMillis: configService.get('DB_POOL_IDLE_TIMEOUT') || 30000,
          connectionTimeoutMillis: configService.get('DB_POOL_CONNECTION_TIMEOUT') || 2000,
          maxUses: configService.get('DB_POOL_MAX_USES') || 7500,
          statement_timeout: configService.get('DB_STATEMENT_TIMEOUT') || 10000,
          query_timeout: configService.get('DB_QUERY_TIMEOUT') || 10000,
          application_name: 'tenant-management-system',
        },
      }),
      inject: [ConfigService],
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return addTransactionalDataSource(dataSource);
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

// src/database/connection-pool.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConnectionPoolService {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private readonly pool: Map<string, QueryRunner> = new Map();
  private readonly maxPoolSize: number;
  private readonly idleTimeout: number;

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    this.maxPoolSize = this.configService.get<number>('DB_POOL_MAX') || 20;
    this.idleTimeout = this.configService.get<number>('DB_POOL_IDLE_TIMEOUT') || 30000;

    // Start the idle connection cleanup interval
    this.startIdleConnectionCleanup();
  }

  async getConnection(key: string): Promise<QueryRunner> {
    // Check if we already have a connection for this key
    if (this.pool.has(key)) {
      const queryRunner = this.pool.get(key);
      if (queryRunner && !queryRunner.isReleased) {
        // Update last used time
        queryRunner['lastUsed'] = Date.now();
        return queryRunner;
      }
    }

    // Check if we've reached max pool size
    if (this.pool.size >= this.maxPoolSize) {
      this.logger.warn(`Connection pool reached maximum size of ${this.maxPoolSize}`);
      // Try to find an idle connection to replace
      const oldestKey = this.findOldestIdleConnection();
      if (oldestKey) {
        await this.releaseConnection(oldestKey);
      }
    }

    // Create a new connection
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    queryRunner['lastUsed'] = Date.now();
    queryRunner['key'] = key;
    this.pool.set(key, queryRunner);

    this.logger.debug(`Created new connection for key: ${key}`);
    return queryRunner;
  }

  async releaseConnection(key: string): Promise<void> {
    if (this.pool.has(key)) {
      const queryRunner = this.pool.get(key);
      if (queryRunner && !queryRunner.isReleased) {
        try {
          await queryRunner.release();
          this.logger.debug(`Released connection for key: ${key}`);
        } catch (error) {
          this.logger.error(`Error releasing connection for key ${key}: ${error.message}`);
        } finally {
          this.pool.delete(key);
        }
      }
    }
  }

  async withConnection<T>(
    key: string,
    work: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = await this.getConnection(key);
    try {
      const result = await work(queryRunner);
      // Update last used time
      queryRunner['lastUsed'] = Date.now();
      return result;
    } catch (error) {
      this.logger.error(`Error in connection work for key ${key}: ${error.message}`);
      throw error;
    } finally {
      // Don't release the connection here - let the caller decide
    }
  }

  private findOldestIdleConnection(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    this.pool.forEach((queryRunner, key) => {
      if (queryRunner['lastUsed'] < oldestTime) {
        oldestTime = queryRunner['lastUsed'];
        oldestKey = key;
      }
    });

    return oldestKey;
  }

  private startIdleConnectionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const idleThreshold = now - this.idleTimeout;

      this.pool.forEach((queryRunner, key) => {
        if (queryRunner['lastUsed'] < idleThreshold) {
          this.logger.debug(`Cleaning up idle connection for key: ${key}`);
          this.releaseConnection(key);
        }
      });
    }, this.idleTimeout / 2);
  }

  async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.pool.keys()).map((key) =>
      this.releaseConnection(key),
    );
    await Promise.all(promises);
    this.logger.log('All database connections closed');
  }

  getPoolStats(): {
    total: number;
    inUse: number;
    idle: number;
  } {
    let inUse = 0;
    let idle = 0;

    this.pool.forEach((queryRunner) => {
      if (queryRunner.isReleased) {
        idle++;
      } else {
        inUse++;
      }
    });

    return {
      total: this.pool.size,
      inUse,
      idle,
    };
  }
}

// src/database/transactional.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { TRANSACTIONAL_KEY } from './constants';

export function Transactional(options?: {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  propagation?: 'REQUIRED' | 'REQUIRES_NEW' | 'NESTED';
}) {
  return SetMetadata(TRANSACTIONAL_KEY, options || {});
}

// src/database/transaction.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { TRANSACTIONAL_KEY } from './constants';
import { ConnectionPoolService } from './connection-pool.service';
import { QueryRunner } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionInterceptor.name);

  constructor(
    private reflector: Reflector,
    private connectionPool: ConnectionPoolService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const transactionOptions = this.reflector.get<any>(
      TRANSACTIONAL_KEY,
      context.getHandler(),
    );

    if (!transactionOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || 'anonymous';
    const transactionKey = `transaction:${userId}:${Date.now()}`;

    return new Observable((subscriber) => {
      this.connectionPool
        .withConnection(transactionKey, async (queryRunner) => {
          try {
            // Start transaction
            await queryRunner.startTransaction(
              transactionOptions.isolationLevel,
            );

            // Attach queryRunner to the request for use in services
            request.queryRunner = queryRunner;

            // Execute the handler
            const result = await next.handle().toPromise();

            // Commit transaction
            await queryRunner.commitTransaction();

            subscriber.next(result);
            subscriber.complete();
          } catch (error) {
            this.logger.error(`Transaction failed: ${error.message}`);
            // Rollback transaction
            if (queryRunner.isTransactionActive) {
              await queryRunner.rollbackTransaction();
            }
            subscriber.error(error);
          } finally {
            // Release the connection
            await this.connectionPool.releaseConnection(transactionKey);
          }
        })
        .catch((error) => {
          subscriber.error(error);
        });
    });
  }
}

// src/database/database.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { ConnectionPoolService } from './connection-pool.service';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private dataSource: DataSource,
    private connectionPool: ConnectionPoolService,
  ) {}

  async executeInTransaction<T>(
    work: (queryRunner: QueryRunner) => Promise<T>,
    options?: {
      isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
      key?: string;
    },
  ): Promise<T> {
    const transactionKey = options?.key || `transaction:${Date.now()}`;

    return this.connectionPool.withConnection(transactionKey, async (queryRunner) => {
      try {
        // Start transaction
        await queryRunner.startTransaction(options?.isolationLevel);

        // Execute the work
        const result = await work(queryRunner);

        // Commit transaction
        await queryRunner.commitTransaction();

        return result;
      } catch (error) {
        this.logger.error(`Transaction failed: ${error.message}`);
        // Rollback transaction
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        throw error;
      }
    });
  }

  async getConnection(key: string): Promise<QueryRunner> {
    return this.connectionPool.getConnection(key);
  }

  async releaseConnection(key: string): Promise<void> {
    await this.connectionPool.releaseConnection(key);
  }

  getPoolStats() {
    return this.connectionPool.getPoolStats();
  }
}
```

## Real-Time Features (350+ lines)

### WebSocket Server Setup

```typescript
// src/websocket/websocket.module.ts
import { Module, Global } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';
import { AuthModule } from '../auth/auth.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PropertiesModule } from '../properties/properties.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { PaymentsModule } from '../payments/payments.module';

@Global()
@Module({
  imports: [
    AuthModule,
    TenantsModule,
    PropertiesModule,
    MaintenanceModule,
    PaymentsModule,
  ],
  providers: [WebsocketGateway, WebsocketService],
  exports: [WebsocketGateway, WebsocketService],
})
export class WebsocketModule {}

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
import { WebsocketService } from './websocket.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  path: '/ws',
  pingInterval: 25000,
  pingTimeout: 5000,
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly connectedClients = new Map<string, Socket>();
  private readonly userToSocketIds = new Map<string, Set<string>>();

  constructor(
    private websocketService: WebsocketService,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.websocketService.setServer(server);

    // Set up event listeners for system events
    this.setupSystemEventListeners();
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.debug(`Client connected: ${client.id}`);

      // Verify authentication
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect(true);
        return;
      }

      const user = await this.authService.verifyToken(token);
      if (!user) {
        this.logger.warn(`Client ${client.id} connected with invalid token`);
        client.disconnect(true);
        return;
      }

      // Store client information
      this.connectedClients.set(client.id, client);

      // Map user to socket IDs
      if (!this.userToSocketIds.has(user.id)) {
        this.userToSocketIds.set(user.id, new Set());
      }
      this.userToSocketIds.get(user.id).add(client.id);

      // Join user-specific room
      client.join(`user:${user.id}`);

      // Join role-based rooms
      if (user.roles) {
        user.roles.forEach((role) => {
          client.join(`role:${role}`);
        });
      }

      // Join property-specific rooms if user has property access
      if (user.propertyIds && user.propertyIds.length > 0) {
        user.propertyIds.forEach((propertyId) => {
          client.join(`property:${propertyId}`);
        });
      }

      // Join tenant-specific room if user is a tenant
      if (user.tenantId) {
        client.join(`tenant:${user.tenantId}`);
      }

      this.logger.log(`User ${user.id} connected via WebSocket (${client.id})`);

      // Send welcome message
      client.emit('connected', {
        message: 'Successfully connected to WebSocket server',
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      // Send initial state if needed
      this.websocketService.sendInitialState(client, user);
    } catch (error) {
      this.logger.error(`Error during WebSocket connection: ${error.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.connectedClients.delete(clientId);

    // Find and remove the client from userToSocketIds
    this.userToSocketIds.forEach((socketIds, userId) => {
      if (socketIds.has(clientId)) {
        socketIds.delete(clientId);
        if (socketIds.size === 0) {
          this.userToSocketIds.delete(userId);
        }
      }
    });

    this.logger.log(`Client disconnected: ${clientId}`);
  }

  private setupSystemEventListeners() {
    // Listen for tenant updates
    this.websocketService.onTenantUpdate((tenantId, update) => {
      this.server.to(`tenant:${tenantId}`).emit('tenant:update', update);
      this.server.to(`property:${update.propertyId}`).emit('tenant:update', update);
    });

    // Listen for property updates
    this.websocketService.onPropertyUpdate((propertyId, update) => {
      this.server.to(`property:${propertyId}`).emit('property:update', update);
    });

    // Listen for maintenance updates
    this.websocketService.onMaintenanceUpdate((maintenanceId, update) => {
      this.server.to(`tenant:${update.tenantId}`).emit('maintenance:update', update);
      this.server.to(`property:${update.propertyId}`).emit('maintenance:update', update);
    });

    // Listen for payment updates
    this.websocketService.onPaymentUpdate((paymentId, update) => {
      this.server.to(`tenant:${update.tenantId}`).emit('payment:update', update);
      this.server.to(`property:${update.propertyId}`).emit('payment:update', update);
    });

    // Listen for lease updates
    this.websocketService.onLeaseUpdate((leaseId, update) => {
      this.server.to(`tenant:${update.tenantId}`).emit('lease:update', update);
      this.server.to(`property:${update.propertyId}`).emit('lease:update', update);
    });

    // Listen for system notifications
    this.websocketService.onSystemNotification((notification) => {
      if (notification.targetUserId) {
        this.server.to(`user:${notification.targetUserId}`).emit('notification', notification);
      } else if (notification.targetRole) {
        this.server.to(`role:${notification.targetRole}`).emit('notification', notification);
      } else {
        this.server.emit('notification', notification);
      }
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.rooms || !Array.isArray(data.rooms)) {
      client.emit('error', {
        message: 'Invalid subscription request: rooms must be an array',
      });
      return;
    }

    data.rooms.forEach((room) => {
      client.join(room);
    });

    client.emit('subscribed', {
      rooms: data.rooms,
      message: `Successfully subscribed to ${data.rooms.length} rooms`,
    });
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.rooms || !Array.isArray(data.rooms)) {
      client.emit('error', {
        message: 'Invalid unsubscription request: rooms must be an array',
      });
      return;
    }

    data.rooms.forEach((room) => {
      client.leave(room);
    });

    client.emit('unsubscribed', {
      rooms: data.rooms,
      message: `Successfully unsubscribed from ${data.rooms.length} rooms`,
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('get:connections')
  handleGetConnections(@ConnectedSocket() client: Socket) {
    const stats = {
      totalConnections: this.connectedClients.size,
      usersConnected: this.userToSocketIds.size,
      rooms: Array.from(this.server.sockets.adapter.rooms.keys()),
    };

    client.emit('connections:stats', stats);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userToSocketIds.keys());
  }

  getUserSocketIds(userId: string): string[] {
    const socketIds = this.userToSocketIds.get(userId);
    return socketIds ? Array.from(socketIds) : [];
  }

  async broadcastToUser(userId: string, event: string, data: any) {
    const socketIds = this.getUserSocketIds(userId);
    if (socketIds.length > 0) {
      socketIds.forEach((socketId) => {
        const client = this.connectedClients.get(socketId);
        if (client) {
          client.emit(event, data);
        }
      });
    }
  }

  async broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  async broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
```

### Real-Time Event Handlers

```typescript
// src/websocket/websocket.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TenantsService } from '../tenants/tenants.service';
import { PropertiesService } from '../properties/properties.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { PaymentsService } from '../payments/payments.service';
import { LeasesService } from '../leases/leases.service';
import { User } from '../users/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WebsocketService {
  private server: Server;
  private readonly logger = new Logger(WebsocketService.name);
  private readonly eventHandlers = new Map<string, Function[]>();

  constructor(
    private tenantsService: TenantsService,
    private propertiesService: PropertiesService,
    private maintenanceService: MaintenanceService,
    private paymentsService: PaymentsService,
    private leasesService: LeasesService,
    private eventEmitter: EventEmitter2,
  ) {
    this.setupEventListeners();
  }

  setServer(server: Server) {
    this.server = server;
  }

  private setupEventListeners() {
    // Listen for tenant events
    this.eventEmitter.on('tenant.created', (tenant) => this.handleTenantCreated(tenant));
    this.eventEmitter.on('tenant.updated', (tenant) => this.handleTenantUpdated(tenant));
    this.eventEmitter.on('tenant.deleted', (tenantId) => this.handleTenantDeleted(tenantId));

    // Listen for property events
    this.eventEmitter.on('property.created', (property) => this.handlePropertyCreated(property));
    this.eventEmitter.on('property.updated', (property) => this.handlePropertyUpdated(property));
    this.eventEmitter.on('property.deleted', (propertyId) => this.handlePropertyDeleted(propertyId));

    // Listen for maintenance events
    this.eventEmitter.on('maintenance.created', (request) => this.handleMaintenanceCreated(request));
    this.eventEmitter.on('maintenance.updated', (request) => this.handleMaintenanceUpdated(request));
    this.eventEmitter.on('maintenance.deleted', (requestId) => this.handleMaintenanceDeleted(requestId));

    // Listen for payment events
    this.eventEmitter.on('payment.created', (payment) => this.handlePaymentCreated(payment));
    this.eventEmitter.on('payment.updated', (payment) => this.handlePaymentUpdated(payment));
    this.eventEmitter.on('payment.deleted', (paymentId) => this.handlePaymentDeleted(paymentId));

    // Listen for lease events
    this.eventEmitter.on('lease.created', (lease) => this.handleLeaseCreated(lease));
    this.eventEmitter.on('lease.updated', (lease) => this.handleLeaseUpdated(lease));
    this.eventEmitter.on('lease.deleted', (leaseId) => this.handleLeaseDeleted(leaseId));
  }

  async sendInitialState(client: Socket, user: User) {
    try {
      // Send initial state based on user role and permissions
      if (user.roles.includes('admin') || user.roles.includes('property_manager')) {
        // For admins and property managers, send high-level stats
        const [tenantCount, propertyCount, maintenanceCount, paymentCount] = await Promise.all([
          this.tenantsService.count(),
          this.propertiesService.count(),
          this.maintenanceService.count(),
          this.paymentsService.count(),
        ]);

        client.emit('initial:state', {
          tenantCount,
          propertyCount,
          maintenanceCount,
          paymentCount,
          timestamp: new Date().toISOString(),
        });
      }

      if (user.tenantId) {
        // For tenants, send their specific data
        const [tenant, maintenanceRequests, payments, lease] = await Promise.all([
          this.tenantsService.findOne(user.tenantId),
          this.maintenanceService.findByTenant(user.tenantId),
          this.paymentsService.findByTenant(user.tenantId),
          this.leasesService.findCurrentByTenant(user.tenantId),
        ]);

        client.emit('initial:state', {
          tenant,
          maintenanceRequests,
          payments,
          lease,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Error sending initial state: ${error.message}`);
    }
  }

  // Tenant event handlers
  private async handleTenantCreated(tenant: any) {
    const update = {
      ...tenant,
      event: 'created',
      timestamp: new Date().toISOString(),
    };

    this.emitTenantUpdate(tenant.id, update);
    this.emitSystemNotification({
      title: 'New Tenant',
      message: `Tenant ${tenant.firstName} ${tenant.lastName} has been added to property ${tenant.propertyName}`,
      type: 'info',
      targetRole: 'property_manager',
      targetPropertyId: tenant.propertyId,
      data: update,
    });
  }

  private async handleTenantUpdated(tenant: any) {
    const update = {
      ...tenant,
      event: 'updated',
      timestamp: new Date().toISOString(),
    };

    this.emitTenantUpdate(tenant.id, update);
    this.emitSystemNotification({
      title: 'Tenant Updated',
      message: `Tenant ${tenant.firstName} ${tenant.lastName} has been updated`,
      type: 'info',
      targetRole: 'property_manager',
      targetPropertyId: tenant.propertyId,
      data: update,
    });
  }

  private async handleTenantDeleted(tenantId: string) {
    const update = {
      id: tenantId,
      event: 'deleted',
      timestamp: new Date().toISOString(),
    };

    this.emitTenantUpdate(tenantId, update);
    this.emitSystemNotification({
      title: 'Tenant Removed',
      message: `Tenant ${tenantId} has been removed`,
      type: 'warning',
      targetRole: 'property_manager',
    });
  }

  // Property event handlers
  private async handlePropertyCreated(property: any) {
    const update = {
      ...property,
      event: 'created',
      timestamp: new Date().toISOString(),
    };

    this.emitPropertyUpdate(property.id, update);
    this.emitSystemNotification({
      title: 'New Property',
      message: `Property ${property.name} has been added to the system`,
      type: 'info',
      targetRole: 'admin',
      data: update,
    });
  }

  private async handlePropertyUpdated(property: any) {
    const update = {
      ...property,
      event: 'updated',
      timestamp: new Date().toISOString(),
    };

    this.emitPropertyUpdate(property.id, update);
    this.emitSystemNotification({
      title: 'Property Updated',
      message: `Property ${property.name} has been updated`,
      type: 'info',
      targetRole: 'admin',
      targetPropertyId: property.id,
      data: update,
    });
  }

  private async handlePropertyDeleted(propertyId: string) {
    const update = {
      id: propertyId,
      event: 'deleted',
      timestamp: new Date().toISOString(),
    };

    this.emitPropertyUpdate(propertyId, update);
    this.emitSystemNotification({
      title: 'Property Removed',
      message: `Property ${propertyId} has been removed from the system`,
      type: 'warning',
      targetRole: 'admin',
    });
  }

  // Maintenance event handlers
  private async handleMaintenanceCreated(request: any) {
    const update = {
      ...request,
      event: 'created',
      timestamp: new Date().toISOString(),
    };

    this.emitMaintenanceUpdate(request.id, update);
    this.emitSystemNotification({
      title: 'New Maintenance Request',
      message: `Maintenance request #${request.id} has been created for ${request.title}`,
      type: 'info',
      targetUserId: request.tenantId,
      targetRole: 'property_manager',
      targetPropertyId: request.propertyId,
      data: update,
    });
  }

  private async handleMaintenanceUpdated(request: any) {
    const update = {
      ...request,
      event: 'updated',
      timestamp: new Date().toISOString(),
    };

    this.emitMaintenanceUpdate(request.id, update);

    // Send specific notifications based on status changes
    if (request.status === 'in_progress') {
      this.emitSystemNotification({
        title: 'Maintenance Started',
        message: `Maintenance request #${request.id} is now in progress`,
        type: 'info',
        targetUserId: request.tenantId,
        data: update,
      });
    } else if (request.status === 'completed') {
      this.emitSystemNotification({
        title: 'Maintenance Completed',
        message: `Maintenance request #${request.id} has been completed`,
        type: 'success',
        targetUserId: request.tenantId,
        data: update,
      });
    }
  }

  private async handleMaintenanceDeleted(requestId: string) {
    const update = {
      id: requestId,
      event: 'deleted',
      timestamp: new Date().toISOString(),
    };

    this.emitMaintenanceUpdate(requestId, update);
    this.emitSystemNotification({
      title: 'Maintenance Request Deleted',
      message: `Maintenance request #${requestId} has been deleted`,
      type: 'warning',
      targetRole: 'property_manager',
    });
  }

  // Payment event handlers
  private async handlePaymentCreated(payment: any) {
    const update = {
      ...payment,
      event: 'created',
      timestamp: new Date().toISOString(),
    };

    this.emitPaymentUpdate(payment.id, update);
    this.emitSystemNotification({
      title: 'New Payment',
      message: `Payment of $${payment.amount} has been received from ${payment.tenantName}`,
      type: 'success',
      targetRole: 'property_manager',
      targetPropertyId: payment.propertyId,
      data: update,
    });

    // Notify tenant
    this.emitSystemNotification({
      title: 'Payment Received',
      message: `Your payment of $${payment.amount} has been received`,
      type: 'success',
      targetUserId: payment.tenantId,
      data: update,
    });
  }

  private async handlePaymentUpdated(payment: any) {
    const update = {
      ...payment,
      event: 'updated',
      timestamp: new Date().toISOString(),
    };

    this.emitPaymentUpdate(payment.id, update);

    // Send specific notifications based on status changes
    if (payment.status === 'failed') {
      this.emitSystemNotification({
        title: 'Payment Failed',
        message: `Payment of $${payment.amount} from ${payment.tenantName} has failed`,
        type: 'error',
        targetRole: 'property_manager',
        targetPropertyId: payment.propertyId,
        data: update,
      });

      // Notify tenant
      this.emitSystemNotification({
        title: 'Payment Failed',
        message: `Your payment of $${payment.amount} has failed. Please update your payment method.`,
        type: 'error',
        targetUserId: payment.tenantId,
        data: update,
      });
    }
  }

  private async handlePaymentDeleted(paymentId: string) {
    const update = {
      id: paymentId,
      event: 'deleted',
      timestamp: new Date().toISOString(),
    };

    this.emitPaymentUpdate(paymentId, update);
    this.emitSystemNotification({
      title: 'Payment Deleted',
      message: `Payment #${paymentId} has been deleted`,
      type: 'warning',
      targetRole: 'property_manager',
    });
  }

  // Lease event handlers
  private async handleLeaseCreated(lease: any) {
    const update = {
      ...lease,
      event: 'created',
      timestamp: new Date().toISOString(),
    };

    this.emitLeaseUpdate(lease.id, update);
    this.emitSystemNotification({
      title: 'New Lease',
      message: `Lease for ${lease.tenantName} at ${lease.propertyName} has been created`,
      type: 'info',
      targetRole: 'property_manager',
      targetPropertyId: lease.propertyId,
      data: update,
    });

    // Notify tenant
    this.emitSystemNotification({
      title: 'Lease Created',
      message: `Your lease for ${lease.propertyName} has been created`,
      type: 'info',
      targetUserId: lease.tenantId,
      data: update,
    });
  }

  private async handleLeaseUpdated(lease: any) {
    const update = {
      ...lease,
      event: 'updated',
      timestamp: new Date().toISOString(),
    };

    this.emitLeaseUpdate(lease.id, update);

    // Send specific notifications based on lease changes
    if (lease.status === 'terminated') {
      this.emitSystemNotification({
        title: 'Lease Terminated',
        message: `Lease for ${lease.tenantName} at ${lease.propertyName} has been terminated`,
        type: 'warning',
        targetRole: 'property_manager',
        targetPropertyId: lease.propertyId,
        data: update,
      });

      // Notify tenant
      this.emitSystemNotification({
        title: 'Lease Terminated',
        message: `Your lease for ${lease.propertyName} has been terminated`,
        type: 'warning',
        targetUserId: lease.tenantId,
        data: update,
      });
    }
  }

  private async handleLeaseDeleted(leaseId: string) {
    const update = {
      id: leaseId,
      event: 'deleted',
      timestamp: new Date().toISOString(),
    };

    this.emitLeaseUpdate(leaseId, update);
    this.emitSystemNotification({
      title: 'Lease Deleted',
      message: `Lease #${leaseId} has been deleted`,
      type: 'warning',
      targetRole: 'property_manager',
    });
  }

  // Event emitter methods
  private emitTenantUpdate(tenantId: string, update: any) {
    if (this.eventHandlers.has('tenant:update')) {
      this.eventHandlers.get('tenant:update').forEach((handler) => {
        handler(tenantId, update);
      });
    }
  }

  private emitPropertyUpdate(propertyId: string, update: any) {
    if (this.eventHandlers.has('property:update')) {
      this.eventHandlers.get('property:update').forEach((handler) => {
        handler(propertyId, update);
      });
    }
  }

  private emitMaintenanceUpdate(maintenanceId: string, update: any) {
    if (this.eventHandlers.has('maintenance:update')) {
      this.eventHandlers.get('maintenance:update').forEach((handler) => {
        handler(maintenanceId, update);
      });
    }
  }

  private emitPaymentUpdate(paymentId: string, update: any) {
    if (this.eventHandlers.has('payment:update')) {
      this.eventHandlers.get('payment:update').forEach((handler) => {
        handler(paymentId, update);
      });
    }
  }

  private emitLeaseUpdate(leaseId: string, update: any) {
    if (this.eventHandlers.has('lease:update')) {
      this.eventHandlers.get('lease:update').forEach((handler) => {
        handler(leaseId, update);
      });
    }
  }

  private emitSystemNotification(notification: any) {
    if (this.eventHandlers.has('system:notification')) {
      this.eventHandlers.get('system:notification').forEach((handler) => {
        handler(notification);
      });
    }
  }

  // Event listener registration
  onTenantUpdate(handler: (tenantId: string, update: any) => void) {
    if (!this.eventHandlers.has('tenant:update')) {
      this.eventHandlers.set('tenant:update', []);
    }
    this.eventHandlers.get('tenant:update').push(handler);
  }

  onPropertyUpdate(handler: (propertyId: string, update: any) => void) {
    if (!this.eventHandlers.has('property:update')) {
      this.eventHandlers.set('property:update', []);
    }
    this.eventHandlers.get('property:update').push(handler);
  }

  onMaintenanceUpdate(handler: (maintenanceId: string, update: any) => void) {
    if (!this.eventHandlers.has('maintenance:update')) {
      this.eventHandlers.set('maintenance:update', []);
    }
    this.eventHandlers.get('maintenance:update').push(handler);
  }

  onPaymentUpdate(handler: (paymentId: string, update: any) => void) {
    if (!this.eventHandlers.has('payment:update')) {
      this.eventHandlers.set('payment:update', []);
    }
    this.eventHandlers.get('payment:update').push(handler);
  }

  onLeaseUpdate(handler: (leaseId: string, update: any) => void) {
    if (!this.eventHandlers.has('lease:update')) {
      this.eventHandlers.set('lease:update', []);
    }
    this.eventHandlers.get('lease:update').push(handler);
  }

  onSystemNotification(handler: (notification: any) => void) {
    if (!this.eventHandlers.has('system:notification')) {
      this.eventHandlers.set('system:notification', []);
    }
    this.eventHandlers.get('system:notification').push(handler);
  }

  // Custom event methods
  async emitCustomEvent(event: string, data: any) {
    this.server.emit(event, data);
  }

  async emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  async emitToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  async emitToProperty(propertyId: string, event: string, data: any) {
    this.server.to(`property:${propertyId}`).emit(event, data);
  }

  async emitToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  // Presence tracking
  async trackUserPresence(userId: string, isOnline: boolean) {
    this.server.emit('presence:update', {
      userId,
      isOnline,
      timestamp: new Date().toISOString(),
    });
  }

  // Typing indicators
  async sendTypingIndicator(userId: string, targetUserId: string, isTyping: boolean) {
    this.server.to(`user:${targetUserId}`).emit('typing', {
      userId,
      isTyping,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Client-Side WebSocket Integration

```typescript
// src/frontend/src/services/websocket.service.ts
import { Injectable, EventEmitter } from '@angular/core';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable } from 'rxjs';

interface WebSocketMessage {
  event: string;
  data: any;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket: SocketIOClient.Socket;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private messageQueue: WebSocketMessage[] = [];

  // Event emitters for different message types
  private tenantUpdateEmitter = new EventEmitter<any>();
  private propertyUpdateEmitter = new EventEmitter<any>();
  private maintenanceUpdateEmitter = new EventEmitter<any>();
  private paymentUpdateEmitter = new EventEmitter<any>();
  private leaseUpdateEmitter = new EventEmitter<any>();
  private notificationEmitter = new EventEmitter<any>();
  private systemEventEmitter = new EventEmitter<any>();
  private presenceUpdateEmitter = new EventEmitter<any>();
  private typingEmitter = new EventEmitter<any>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
  ) {
    this.setupConnection();
    this.setupAuthListener();
  }

  private setupConnection(): void {
    // Create WebSocket connection
    this.socket = io(environment.wsUrl, {
      path: '/ws',
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false, // We'll handle reconnection manually
      query: {
        token: this.authService.getToken(),
      },
    });

    // Set up event listeners
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Connection events
    this.socket.on('connect', () => this.handleConnect());
    this.socket.on('disconnect', (reason: string) => this.handleDisconnect(reason));
    this.socket.on('connect_error', (error: any) => this.handleConnectError(error));
    this.socket.on('error', (error: any) => this.handleError(error));

    // System events
    this.socket.on('connected', (data: any) => this.handleConnected(data));
    this.socket.on('initial:state', (data: any) => this.handleInitialState(data));
    this.socket.on('pong', (data: any) => this.handlePong(data));

    // Domain events
    this.socket.on('tenant:update', (data: any) => this.handleTenantUpdate(data));
    this.socket.on('property:update', (data: any) => this.handlePropertyUpdate(data));
    this.socket.on('maintenance:update', (data: any) => this.handleMaintenanceUpdate(data));
    this.socket.on('payment:update', (data: any) => this.handlePaymentUpdate(data));
    this.socket.on('lease:update', (data: any) => this.handleLeaseUpdate(data));
    this.socket.on('notification', (data: any) => this.handleNotification(data));

    // Presence events
    this.socket.on('presence:update', (data: any) => this.handlePresenceUpdate(data));
    this.socket.on('typing', (data: any) => this.handleTyping(data));

    // Custom events
    this.socket.onAny((event: string, data: any) => this.handleCustomEvent(event, data));
  }

  private setupAuthListener(): void {
    this.authService.onAuthStateChanged((user) => {
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  private handleConnect(): void {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.connectionStatus.next(true);

    // Process any queued messages
    this.processMessageQueue();

    console.log('WebSocket connected');
  }

  private handleDisconnect(reason: string): void {
    this.isConnected = false;
    this.connectionStatus.next(false);

    console.log(`WebSocket disconnected: ${reason}`);

    // Attempt to reconnect if this wasn't an intentional disconnect
    if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
      this.scheduleReconnect();
    }
  }

  private handleConnectError(error: any): void {
    console.error('WebSocket connection error:', error);

    // If we have a token error, clear auth and redirect
    if (error.message.includes('Authentication error')) {
      this.authService.logout();
      this.router.navigate(['/login']);
      this.toastr.error('Session expired. Please login again.');
    }

    this.scheduleReconnect();
  }

  private handleError(error: any): void {
    console.error('WebSocket error:', error);
  }

  private handleConnected(data: any): void {
    console.log('WebSocket connection established:', data);
  }

  private handleInitialState(data: any): void {
    console.log('Received initial state:', data);
    this.systemEventEmitter.emit({
      event: 'initial:state',
      data,
    });
  }

  private handlePong(data: any): void {
    // console.log('Received pong:', data);
  }

  private handleTenantUpdate(data: any): void {
    this.tenantUpdateEmitter.emit(data);
  }

  private handlePropertyUpdate(data: any): void {
    this.propertyUpdateEmitter.emit(data);
  }

  private handleMaintenanceUpdate(data: any): void {
    this.maintenanceUpdateEmitter.emit(data);
  }

  private handlePaymentUpdate(data: any): void {
    this.paymentUpdateEmitter.emit(data);
  }

  private handleLeaseUpdate(data: any): void {
    this.leaseUpdateEmitter.emit(data);
  }

  private handleNotification(data: any): void {
    this.notificationEmitter.emit(data);

    // Show toast notification
    if (data.type === 'success') {
      this.toastr.success(data.message, data.title);
    } else if (data.type === 'error') {
      this.toastr.error(data.message, data.title);
    } else if (data.type === 'warning') {
      this.toastr.warning(data.message, data.title);
    } else {
      this.toastr.info(data.message, data.title);
    }
  }

  private handlePresenceUpdate(data: any): void {
    this.presenceUpdateEmitter.emit(data);
  }

  private handleTyping(data: any): void {
    this.typingEmitter.emit(data);
  }

  private handleCustomEvent(event: string, data: any): void {
    this.systemEventEmitter.emit({
      event,
      data,
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;

      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.toastr.error('Connection lost. Please refresh the page.');
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message.event, message.data);
      }
    }
  }

  connect(): void {
    if (!this.isConnected) {
      // Update token in case it changed
      this.socket.io.opts.query = {
        token: this.authService.getToken(),
      };

      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.isConnected) {
      this.socket.disconnect();
    }
  }

  sendMessage(event: string, data: any): void {
    if (this.isConnected) {
      this.socket.emit(event, data);
    } else {
      // Queue the message if not connected
      this.messageQueue.push({
        event,
        data,
      });

      // Attempt to connect if not already trying
      if (!this.socket.connected && this.reconnectAttempts === 0) {
        this.connect();
      }
    }
  }

  subscribeToTenantUpdates(): Observable<any> {
    return this.tenantUpdateEmitter.asObservable();
  }

  subscribeToPropertyUpdates(): Observable<any> {
    return this.propertyUpdateEmitter.asObservable();
  }

  subscribeToMaintenanceUpdates(): Observable<any> {
    return this.maintenanceUpdateEmitter.asObservable();
  }

  subscribeToPaymentUpdates(): Observable<any> {
    return this.paymentUpdateEmitter.asObservable();
  }

  subscribeToLeaseUpdates(): Observable<any> {
    return this.leaseUpdateEmitter.asObservable();
  }

  subscribeToNotifications(): Observable<any> {
    return this.notificationEmitter.asObservable();
  }

  subscribeToSystemEvents(): Observable<any> {
    return this.systemEventEmitter.asObservable();
  }

  subscribeToPresenceUpdates(): Observable<any> {
    return this.presenceUpdateEmitter.asObservable();
  }

  subscribeToTyping(): Observable<any> {
    return this.typingEmitter.asObservable();
  }

  subscribeToConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  sendPing(): void {
    this.sendMessage('ping', {});
  }

  subscribeToRooms(rooms: string[]): void {
    this.sendMessage('subscribe', { rooms });
  }

  unsubscribeFromRooms(rooms: string[]): void {
    this.sendMessage('unsubscribe', { rooms });
  }

  sendTypingIndicator(targetUserId: string, isTyping: boolean): void {
    this.sendMessage('typing', {
      targetUserId,
      isTyping,
    });
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// src/frontend/src/services/websocket.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WebsocketService } from './websocket.service';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class WebsocketInterceptor implements HttpInterceptor {
  constructor(
    private websocketService: WebsocketService,
    private toastr: ToastrService,
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // If we get a 401, it might be because the WebSocket connection is using an expired token
          // Try to reconnect with a fresh token
          this.websocketService.disconnect();
          setTimeout(() => {
            this.websocketService.connect();
          }, 1000);
        }

        if (error.status >= 500) {
          // For server errors, check WebSocket connection
          if (!this.websocketService.getConnectionStatus()) {
            this.toastr.warning(
              'Connection issues detected. Some features may not work properly.',
              'Connection Problem',
            );
          }
        }

        return throwError(error);
      }),
    );
  }
}

// src/frontend/src/app/core/core.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { WebsocketInterceptor } from '../services/websocket.interceptor';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: WebsocketInterceptor,
      multi: true,
    },
  ],
})
export class CoreModule {}

// src/frontend/src/app/tenants/tenant-detail/tenant-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TenantService } from '../tenant.service';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-tenant-detail',
  templateUrl: './tenant-detail.component.html',
  styleUrls: ['./tenant-detail.component.scss'],
})
export class TenantDetailComponent implements OnInit, OnDestroy {
  tenant: any;
  isLoading = true;
  private tenantId: string;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private tenantService: TenantService,
    private websocketService: WebsocketService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.tenantId = this.route.snapshot.paramMap.get('id');
    this.loadTenant();

    // Subscribe to real-time updates
    this.subscriptions.add(
      this.websocketService.subscribeToTenantUpdates().subscribe((update) => {
        if (update.id === this.tenantId) {
          this.handleTenantUpdate(update);
        }
      }),
    );

    // Subscribe to maintenance updates for this tenant
    this.subscriptions.add(
      this.websocketService.subscribeToMaintenanceUpdates().subscribe((update) => {
        if (update.tenantId === this.tenantId) {
          this.handleMaintenanceUpdate(update);
        }
      }),
    );

    // Subscribe to payment updates for this tenant
    this.subscriptions.add(
      this.websocketService.subscribeToPaymentUpdates().subscribe((update) => {
        if (update.tenantId === this.tenantId) {
          this.handlePaymentUpdate(update);
        }
      }),
    );

    // Subscribe to lease updates for this tenant
    this.subscriptions.add(
      this.websocketService.subscribeToLeaseUpdates().subscribe((update) => {
        if (update.tenantId === this.tenantId) {
          this.handleLeaseUpdate(update);
        }
      }),
    );

    // Subscribe to the tenant's room
    this.websocketService.subscribeToRooms([`tenant:${this.tenantId}`]);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.websocketService.unsubscribeFromRooms([`tenant:${this.tenantId}`]);
  }

  private loadTenant(): void {
    this.isLoading = true;
    this.tenantService.getTenant(this.tenantId).subscribe({
      next: (tenant) => {
        this.tenant = tenant;
        this.isLoading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load tenant details', 'Error');
        this.isLoading = false;
      },
    });
  }

  private handleTenantUpdate(update: any): void {
    if (update.event === 'deleted') {
      this.toastr.warning('This tenant has been deleted', 'Tenant Deleted');
      // Redirect or handle deletion
      return;
    }

    // Merge the update with the current tenant data
    this.tenant = { ...this.tenant, ...update };

    // Show notification for important updates
    if (update.event === 'updated') {
      this.toastr.info('Tenant details updated', 'Update');
    }
  }

  private handleMaintenanceUpdate(update: any): void {
    // Update maintenance requests in the tenant object
    if (!this.tenant.maintenanceRequests) {
      this.tenant.maintenanceRequests = [];
    }

    const index = this.tenant.maintenanceRequests.findIndex(
      (req) => req.id === update.id,
    );

    if (update.event === 'created') {
      this.tenant.maintenanceRequests.unshift(update);
      this.toastr.info('New maintenance request created', 'Maintenance');
    } else if (update.event === 'updated') {
      if (index !== -1) {
        this.tenant.maintenanceRequests[index] = update;
      }
      this.toastr.info('Maintenance request updated', 'Maintenance');
    } else if (update.event === 'deleted') {
      if (index !== -1) {
        this.tenant.maintenanceRequests.splice(index, 1);
      }
      this.toastr.warning('Maintenance request deleted', 'Maintenance');
    }
  }

  private handlePaymentUpdate(update: any): void {
    // Update payments in the tenant object
    if (!this.tenant.payments) {
      this.tenant.payments = [];
    }

    const index = this.tenant.payments.findIndex((p) => p.id === update.id);

    if (update.event === 'created') {
      this.tenant.payments.unshift(update);
      this.toastr.success('New payment received', 'Payment');
    } else if (update.event === 'updated') {
      if (index !== -1) {
        this.tenant.payments[index] = update;
      }
      if (update.status === 'failed') {
        this.toastr.error('Payment failed', 'Payment');
      }
    } else if (update.event === 'deleted') {
      if (index !== -1) {
        this.tenant.payments.splice(index, 1);
      }
      this.toastr.warning('Payment deleted', 'Payment');
    }
  }

  private handleLeaseUpdate(update: any): void {
    // Update lease in the tenant object
    this.tenant.currentLease = update;

    if (update.event === 'created') {
      this.toastr.info('New lease created', 'Lease');
    } else if (update.event === 'updated') {
      this.toastr.info('Lease updated', 'Lease');
      if (update.status === 'terminated') {
        this.toastr.warning('Lease has been terminated', 'Lease');
      }
    } else if (update.event === 'deleted') {
      this.tenant.currentLease = null;
      this.toastr.warning('Lease has been deleted', 'Lease');
    }
  }

  refreshTenant(): void {
    this.loadTenant();
  }
}
```

### Room/Channel Management

```typescript
// src/websocket/room-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { TenantsService } from '../tenants/tenants.service';
import { PropertiesService } from '../properties/properties.service';
import { UsersService } from '../users/users.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { LeasesService } from '../leases/leases.service';

@Injectable()
export class RoomManagerService {
  private readonly logger = new Logger(RoomManagerService.name);
  private readonly roomSubscriptions = new Map<string, Set<string>>();

  constructor(
    private websocketGateway: WebsocketGateway,
    private tenantsService: TenantsService,
    private propertiesService: PropertiesService,
    private usersService: UsersService,
    private maintenanceService: MaintenanceService,
    private leasesService: LeasesService,
  ) {}

  async setupUserRooms(userId: string, socketId: string): Promise<void> {
    try {
      const user = await this.usersService.findOne(userId);
      if (!user) {
        this.logger.warn(`User ${userId} not found`);
        return;
      }

      // Join user-specific room
      await this.addToRoom(`user:${userId}`, socketId);

      // Join role-based rooms
      if (user.roles) {
        for (const role of user.roles) {
          await this.addToRoom(`role:${role}`, socketId);
        }
      }

      // Join property-specific rooms if user has property access
      if (user.propertyIds && user.propertyIds.length > 0) {
        for (const propertyId of user.propertyIds) {
          await this.addToRoom(`property:${propertyId}`, socketId);
        }
      }

      // Join tenant-specific room if user is a tenant
      if (user.tenantId) {
        await this.addToRoom(`tenant:${user.tenantId}`, socketId);
      }

      this.logger.log(`Setup rooms for user ${userId} (socket: ${socketId})`);
    } catch (error) {
      this.logger.error(`Error setting up rooms for user ${userId}: ${error.message}`);
    }
  }

  async cleanupUserRooms(socketId: string): Promise<void> {
    try {
      // Find all rooms this socket is subscribed to
      const roomsToLeave = [];
      this.roomSubscriptions.forEach((socketIds, room) => {
        if (socketIds.has(socketId)) {
          roomsToLeave.push(room);
        }
      });

      // Leave all rooms
      for (const room of roomsToLeave) {
        await this.removeFromRoom(room, socketId);
      }

      this.logger.log(`Cleaned up rooms for socket ${socketId}`);
    } catch (error) {
      this.logger.error(`Error cleaning up rooms for socket ${socketId}: ${error.message}`);
    }
  }

  async addToRoom(room: string, socketId: string): Promise<void> {
    try {
      // Add to the room in Socket.IO
      await this.websocketGateway.server.sockets.sockets.get(socketId)?.join(room);

      // Track the subscription
      if (!this.roomSubscriptions.has(room)) {
        this.roomSubscriptions.set(room, new Set());
      }
      this.roomSubscriptions.get(room).add(socketId);

      this.logger.debug(`Added socket ${socketId} to room ${room}`);
    } catch (error) {
      this.logger.error(`Error adding socket ${socketId} to room ${room}: ${error.message}`);
    }
  }

  async removeFromRoom(room: string, socketId: string): Promise<void> {
    try {
      // Remove from the room in Socket.IO
      await this.websocketGateway.server.sockets.sockets.get(socketId)?.leave(room);

      // Remove from tracking
      if (this.roomSubscriptions.has(room)) {
        this.roomSubscriptions.get(room).delete(socketId);
        if (this.roomSubscriptions.get(room).size === 0) {
          this.roomSubscriptions.delete(room);
        }
      }

      this.logger.debug(`Removed socket ${socketId} from room ${room}`);
    } catch (error) {
      this.logger.error(`Error removing socket ${socketId} from room ${room}: ${error.message}`);
    }
  }

  async getRoomMembers(room: string): Promise<string[]> {
    try {
      const roomInfo = this.websocketGateway.server.sockets.adapter.rooms.get(room);
      if (!roomInfo) {
        return [];
      }
      return Array.from(roomInfo);
    } catch (error) {
      this.logger.error(`Error getting members for room ${room}: ${error.message}`);
      return [];
    }
  }

  async getUserRooms(userId: string): Promise<string[]> {
    try {
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      if (!socketIds || socketIds.length === 0) {
        return [];
      }

      const rooms = new Set<string>();
      for (const socketId of socketIds) {
        const socketRooms = this.websocketGateway.server.sockets.sockets.get(socketId)?.rooms;
        if (socketRooms) {
          socketRooms.forEach((room) => rooms.add(room));
        }
      }

      return Array.from(rooms);
    } catch (error) {
      this.logger.error(`Error getting rooms for user ${userId}: ${error.message}`);
      return [];
    }
  }

  async broadcastToRoom(room: string, event: string, data: any): Promise<void> {
    try {
      this.websocketGateway.server.to(room).emit(event, data);
      this.logger.debug(`Broadcast to room ${room}: ${event}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to room ${room}: ${error.message}`);
    }
  }

  async broadcastToUser(userId: string, event: string, data: any): Promise<void> {
    try {
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      if (socketIds && socketIds.length > 0) {
        for (const socketId of socketIds) {
          this.websocketGateway.server.sockets.sockets.get(socketId)?.emit(event, data);
        }
        this.logger.debug(`Broadcast to user ${userId}: ${event}`);
      }
    } catch (error) {
      this.logger.error(`Error broadcasting to user ${userId}: ${error.message}`);
    }
  }

  async broadcastToRole(role: string, event: string, data: any): Promise<void> {
    try {
      this.websocketGateway.server.to(`role:${role}`).emit(event, data);
      this.logger.debug(`Broadcast to role ${role}: ${event}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to role ${role}: ${error.message}`);
    }
  }

  async broadcastToProperty(propertyId: string, event: string, data: any): Promise<void> {
    try {
      this.websocketGateway.server.to(`property:${propertyId}`).emit(event, data);
      this.logger.debug(`Broadcast to property ${propertyId}: ${event}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to property ${propertyId}: ${error.message}`);
    }
  }

  async broadcastToTenant(tenantId: string, event: string, data: any): Promise<void> {
    try {
      this.websocketGateway.server.to(`tenant:${tenantId}`).emit(event, data);
      this.logger.debug(`Broadcast to tenant ${tenantId}: ${event}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to tenant ${tenantId}: ${error.message}`);
    }
  }

  async getRoomStats(): Promise<Record<string, number>> {
    try {
      const stats: Record<string, number> = {};

      // Get all rooms from Socket.IO adapter
      const rooms = this.websocketGateway.server.sockets.adapter.rooms;

      // Count members in each room
      rooms.forEach((_, room) => {
        stats[room] = this.websocketGateway.server.sockets.adapter.rooms.get(room)?.size || 0;
      });

      return stats;
    } catch (error) {
      this.logger.error(`Error getting room stats: ${error.message}`);
      return {};
    }
  }

  async getUserCountInRoom(room: string): Promise<number> {
    try {
      return this.websocketGateway.server.sockets.adapter.rooms.get(room)?.size || 0;
    } catch (error) {
      this.logger.error(`Error getting user count for room ${room}: ${error.message}`);
      return 0;
    }
  }

  async createDynamicRoom(roomName: string, members: string[]): Promise<void> {
    try {
      // Create a unique room name
      const roomId = `dynamic:${roomName}:${Date.now()}`;

      // Add all members to the room
      for (const userId of members) {
        const socketIds = this.websocketGateway.getUserSocketIds(userId);
        for (const socketId of socketIds) {
          await this.addToRoom(roomId, socketId);
        }
      }

      this.logger.log(`Created dynamic room ${roomId} with ${members.length} members`);
    } catch (error) {
      this.logger.error(`Error creating dynamic room ${roomName}: ${error.message}`);
    }
  }

  async cleanupDynamicRoom(roomId: string): Promise<void> {
    try {
      // Get all members of the room
      const members = await this.getRoomMembers(roomId);

      // Remove all members from the room
      for (const socketId of members) {
        await this.removeFromRoom(roomId, socketId);
      }

      this.logger.log(`Cleaned up dynamic room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error cleaning up dynamic room ${roomId}: ${error.message}`);
    }
  }

  async setupMaintenanceRoom(maintenanceId: string): Promise<void> {
    try {
      const maintenance = await this.maintenanceService.findOne(maintenanceId);
      if (!maintenance) {
        this.logger.warn(`Maintenance request ${maintenanceId} not found`);
        return;
      }

      const roomId = `maintenance:${maintenanceId}`;

      // Add tenant to the room
      if (maintenance.tenantId) {
        const tenantSocketIds = this.websocketGateway.getUserSocketIds(maintenance.tenantId);
        for (const socketId of tenantSocketIds) {
          await this.addToRoom(roomId, socketId);
        }
      }

      // Add property managers to the room
      const property = await this.propertiesService.findOne(maintenance.propertyId);
      if (property && property.managerIds) {
        for (const managerId of property.managerIds) {
          const managerSocketIds = this.websocketGateway.getUserSocketIds(managerId);
          for (const socketId of managerSocketIds) {
            await this.addToRoom(roomId, socketId);
          }
        }
      }

      // Add assigned technician to the room
      if (maintenance.assignedToId) {
        const technicianSocketIds = this.websocketGateway.getUserSocketIds(maintenance.assignedToId);
        for (const socketId of technicianSocketIds) {
          await this.addToRoom(roomId, socketId);
        }
      }

      this.logger.log(`Setup maintenance room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error setting up maintenance room for ${maintenanceId}: ${error.message}`);
    }
  }

  async setupLeaseRoom(leaseId: string): Promise<void> {
    try {
      const lease = await this.leasesService.findOne(leaseId);
      if (!lease) {
        this.logger.warn(`Lease ${leaseId} not found`);
        return;
      }

      const roomId = `lease:${leaseId}`;

      // Add tenant to the room
      if (lease.tenantId) {
        const tenantSocketIds = this.websocketGateway.getUserSocketIds(lease.tenantId);
        for (const socketId of tenantSocketIds) {
          await this.addToRoom(roomId, socketId);
        }
      }

      // Add property managers to the room
      const property = await this.propertiesService.findOne(lease.propertyId);
      if (property && property.managerIds) {
        for (const managerId of property.managerIds) {
          const managerSocketIds = this.websocketGateway.getUserSocketIds(managerId);
          for (const socketId of managerSocketIds) {
            await this.addToRoom(roomId, socketId);
          }
        }
      }

      this.logger.log(`Setup lease room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error setting up lease room for ${leaseId}: ${error.message}`);
    }
  }

  async getRoomActivity(room: string, limit = 10): Promise<any[]> {
    try {
      // In a real implementation, this would query a database of room activity
      // For now, we'll return a mock response
      return [
        {
          event: 'message',
          userId: 'user1',
          timestamp: new Date().toISOString(),
          content: 'Sample message in room',
        },
        {
          event: 'join',
          userId: 'user2',
          timestamp: new Date().toISOString(),
        },
      ].slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting activity for room ${room}: ${error.message}`);
      return [];
    }
  }

  async isUserInRoom(userId: string, room: string): Promise<boolean> {
    try {
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      if (!socketIds || socketIds.length === 0) {
        return false;
      }

      for (const socketId of socketIds) {
        const socket = this.websocketGateway.server.sockets.sockets.get(socketId);
        if (socket && socket.rooms.has(room)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking if user ${userId} is in room ${room}: ${error.message}`);
      return false;
    }
  }
}
```

### Reconnection Logic

```typescript
// src/websocket/reconnection.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { RoomManagerService } from './room-manager.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ReconnectionService {
  private readonly logger = new Logger(ReconnectionService.name);
  private readonly reconnectionAttempts = new Map<string, number>();
  private readonly maxReconnectAttempts: number;
  private readonly reconnectDelay: number;
  private readonly reconnectBackoffFactor: number;

  constructor(
    private websocketGateway: WebsocketGateway,
    private roomManager: RoomManagerService,
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    this.maxReconnectAttempts = this.configService.get<number>('WS_MAX_RECONNECT_ATTEMPTS', 5);
    this.reconnectDelay = this.configService.get<number>('WS_RECONNECT_DELAY', 1000);
    this.reconnectBackoffFactor = this.configService.get<number>('WS_RECONNECT_BACKOFF_FACTOR', 2);
  }

  async handleDisconnectedUser(userId: string): Promise<void> {
    try {
      // Check if we've already tried to reconnect this user too many times
      const attempts = this.reconnectionAttempts.get(userId) || 0;
      if (attempts >= this.maxReconnectAttempts) {
        this.logger.warn(`Max reconnection attempts reached for user ${userId}`);
        return;
      }

      // Increment attempt count
      this.reconnectionAttempts.set(userId, attempts + 1);

      // Calculate delay with exponential backoff
      const delay = this.reconnectDelay * Math.pow(this.reconnectBackoffFactor, attempts);

      this.logger.log(
        `Scheduling reconnection for user ${userId} in ${delay}ms (attempt ${attempts + 1})`,
      );

      // Schedule reconnection
      setTimeout(async () => {
        try {
          await this.attemptReconnection(userId);
        } catch (error) {
          this.logger.error(`Error during reconnection attempt for user ${userId}: ${error.message}`);
        }
      }, delay);
    } catch (error) {
      this.logger.error(`Error handling disconnected user ${userId}: ${error.message}`);
    }
  }

  private async attemptReconnection(userId: string): Promise<void> {
    try {
      // Check if user is already connected
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      if (socketIds && socketIds.length > 0) {
        this.logger.log(`User ${userId} is already connected, skipping reconnection`);
        this.reconnectionAttempts.delete(userId);
        return;
      }

      // Get fresh user data
      const user = await this.authService.findUserById(userId);
      if (!user) {
        this.logger.warn(`User ${userId} not found, cannot reconnect`);
        return;
      }

      // Generate a new token for the user
      const token = await this.authService.generateToken(user);

      // Simulate a new connection (in a real app, this would be handled by the client)
      // For server-side, we'll just set up the rooms again
      const tempSocketId = `reconnect:${userId}:${Date.now()}`;
      await this.roomManager.setupUserRooms(userId, tempSocketId);

      this.logger.log(`Successfully reconnected user ${userId}`);

      // Reset reconnection attempts
      this.reconnectionAttempts.delete(userId);

      // Notify the user (if they have any active clients)
      this.websocketGateway.broadcastToUser(userId, 'reconnected', {
        message: 'Successfully reconnected to the server',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Reconnection attempt failed for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async handleClientReconnection(client: any, oldSocketId: string): Promise<void> {
    try {
      const userId = client.handshake.auth.userId || client.handshake.query.userId;

      if (!userId) {
        this.logger.warn(`Client ${client.id} reconnected without userId`);
        return;
      }

      this.logger.log(`Handling reconnection for user ${userId} (old socket: ${oldSocketId}, new socket: ${client.id})`);

      // Clean up old socket rooms
      await this.roomManager.cleanupUserRooms(oldSocketId);

      // Set up new socket rooms
      await this.roomManager.setupUserRooms(userId, client.id);

      // Reset reconnection attempts
      this.reconnectionAttempts.delete(userId);

      // Send reconnection confirmation
      client.emit('reconnected', {
        message: 'Successfully reconnected',
        oldSocketId,
        newSocketId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error handling client reconnection: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkDisconnectedUsers(): Promise<void> {
    try {
      this.logger.log('Running disconnected users check');

      // Get all currently connected users
      const connectedUsers = this.websocketGateway.getConnectedUsers();

      // In a real implementation, we would compare with a list of users who should be connected
      // For this example, we'll just log the connected users
      this.logger.debug(`Currently connected users: ${connectedUsers.join(', ')}`);

      // Here you could implement logic to check for users who should be connected
      // but aren't, and attempt to reconnect them
    } catch (error) {
      this.logger.error(`Error in disconnected users check: ${error.message}`);
    }
  }

  async scheduleForcedReconnection(userId: string): Promise<void> {
    try {
      this.logger.log(`Scheduling forced reconnection for user ${userId}`);

      // Force disconnect all current connections for this user
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      if (socketIds && socketIds.length > 0) {
        for (const socketId of socketIds) {
          const client = this.websocketGateway.server.sockets.sockets.get(socketId);
          if (client) {
            client.disconnect(true);
          }
        }
      }

      // Reset reconnection attempts
      this.reconnectionAttempts.set(userId, 0);

      // Attempt immediate reconnection
      await this.attemptReconnection(userId);
    } catch (error) {
      this.logger.error(`Error scheduling forced reconnection for user ${userId}: ${error.message}`);
    }
  }

  async getReconnectionStatus(userId: string): Promise<{
    attempts: number;
    maxAttempts: number;
    nextAttemptDelay: number;
    isConnected: boolean;
  }> {
    try {
      const attempts = this.reconnectionAttempts.get(userId) || 0;
      const isConnected = this.websocketGateway.getUserSocketIds(userId).length > 0;

      const nextAttemptDelay = isConnected
        ? 0
        : this.reconnectDelay * Math.pow(this.reconnectBackoffFactor, attempts);

      return {
        attempts,
        maxAttempts: this.maxReconnectAttempts,
        nextAttemptDelay,
        isConnected,
      };
    } catch (error) {
      this.logger.error(`Error getting reconnection status for user ${userId}: ${error.message}`);
      return {
        attempts: 0,
        maxAttempts: this.maxReconnectAttempts,
        nextAttemptDelay: 0,
        isConnected: false,
      };
    }
  }

  async monitorConnectionHealth(): Promise<void> {
    try {
      const stats = this.websocketGateway.server.engine.clientsCount;
      const rooms = await this.roomManager.getRoomStats();

      this.logger.log(`Connection health:
        - Active connections: ${stats}
        - Active rooms: ${Object.keys(rooms).length}
        - Users with reconnection attempts: ${this.reconnectionAttempts.size}`);

      // Log room statistics
      for (const [room, count] of Object.entries(rooms)) {
        if (count > 0) {
          this.logger.debug(`Room ${room}: ${count} members`);
        }
      }
    } catch (error) {
      this.logger.error(`Error monitoring connection health: ${error.message}`);
    }
  }

  async handleServerRestart(): Promise<void> {
    try {
      this.logger.log('Handling server restart - notifying all connected clients');

      // Notify all connected clients about the upcoming restart
      this.websocketGateway.broadcastToAll('server:restart', {
        message: 'Server is restarting for maintenance',
        timestamp: new Date().toISOString(),
        restartIn: 30, // seconds
      });

      // Give clients time to handle the restart notification
      await new Promise((resolve) => setTimeout(resolve, 20000));

      // Disconnect all clients
      this.websocketGateway.server.disconnectSockets(true);

      this.logger.log('All clients disconnected for server restart');
    } catch (error) {
      this.logger.error(`Error handling server restart: ${error.message}`);
    }
  }

  async handleClientHeartbeat(client: any): Promise<void> {
    try {
      const userId = client.handshake.auth.userId;
      if (!userId) {
        return;
      }

      // Update last activity time
      client.lastActivity = Date.now();

      // Reset reconnection attempts if this is a valid heartbeat
      this.reconnectionAttempts.delete(userId);

      // Send heartbeat response
      client.emit('heartbeat:ack', {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error handling client heartbeat: ${error.message}`);
    }
  }

  async checkClientHeartbeats(): Promise<void> {
    try {
      const now = Date.now();
      const timeout = this.configService.get<number>('WS_HEARTBEAT_TIMEOUT', 30000);

      this.websocketGateway.server.sockets.sockets.forEach((client) => {
        if (client.lastActivity && now - client.lastActivity > timeout) {
          this.logger.log(`Client ${client.id} heartbeat timeout, disconnecting`);
          client.disconnect(true);
        }
      });
    } catch (error) {
      this.logger.error(`Error checking client heartbeats: ${error.message}`);
    }
  }
}
```

## AI/ML Capabilities (300+ lines)

### Predictive Model Training

```python
# src/ai/models/tenant_risk_model.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix,
    classification_report
)
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.model_selection import GridSearchCV
import joblib
import os
from datetime import datetime
import mlflow
import mlflow.sklearn
from mlflow.models.signature import infer_signature
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import logging
from typing import Tuple, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class TenantRiskModel:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.feature_importances = None
        self.model_path = os.getenv('MODEL_PATH', 'models/tenant_risk_model.pkl')
        self.experiment_name = "Tenant Risk Prediction"
        self.target_column = "risk_level"
        self.numerical_features = [
            'credit_score', 'income_to_rent_ratio', 'previous_evictions',
            'late_payments_count', 'lease_duration_months', 'age',
            'employment_duration_months', 'deposit_amount', 'monthly_rent',
            'payment_history_score', 'maintenance_requests_count',
            'communication_score', 'property_value', 'neighborhood_score'
        ]
        self.categorical_features = [
            'employment_status', 'rental_history', 'pet_ownership',
            'smoking_status', 'property_type', 'lease_type'
        ]
        self.setup_mlflow()

    def setup_mlflow(self):
        """Set up MLflow tracking"""
        mlflow.set_tracking_uri(os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000'))
        mlflow.set_experiment(self.experiment_name)

    def fetch_data_from_db(self) -> pd.DataFrame:
        """Fetch training data from PostgreSQL database"""
        try:
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST'),
                database=os.getenv('DB_NAME'),
                user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASSWORD'),
                port=os.getenv('DB_PORT')
            )

            query = sql.SQL("""
                SELECT
                    t.credit_score,
                    t.income_to_rent_ratio,
                    t.previous_evictions,
                    t.late_payments_count,
                    EXTRACT(EPOCH FROM (t.lease_end_date - t.lease_start_date))/2592000 AS lease_duration_months,
                    t.age,
                    t.employment_duration_months,
                    t.deposit_amount,
                    l.monthly_rent,
                    t.payment_history_score,
                    COUNT(DISTINCT mr.id) AS maintenance_requests_count,
                    t.communication_score,
                    p.value AS property_value,
                    n.score AS neighborhood_score,
                    t.employment_status,
                    t.rental_history,
                    t.pet_ownership,
                    t.smoking_status,
                    p.type AS property_type,
                    l.type AS lease_type,
                    CASE
                        WHEN t.status = 'evicted' THEN 'high'
                        WHEN t.status = 'delinquent' THEN 'medium'
                        WHEN t.status IN ('active', 'good_standing') THEN 'low'
                        ELSE 'unknown'
                    END AS risk_level
                FROM
                    tenants t
                JOIN
                    leases l ON t.current_lease_id = l.id
                JOIN
                    properties p ON l.property_id = p.id
                LEFT JOIN
                    neighborhoods n ON p.neighborhood_id = n.id
                LEFT JOIN
                    maintenance_requests mr ON t.id = mr.tenant_id AND mr.status IN ('open', 'in_progress')
                WHERE
                    t.is_active = TRUE
                    AND l.is_active = TRUE
                GROUP BY
                    t.id, l.id, p.id, n.id
            """)

            df = pd.read_sql_query(query, conn)
            conn.close()
            logger.info(f"Fetched {len(df)} records from database")
            return df
        except Exception as e:
            logger.error(f"Error fetching data from database: {str(e)}")
            raise

    def preprocess_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Preprocess the data and split into features and target"""
        try:
            # Handle missing values
            df = df.replace([np.inf, -np.inf], np.nan)

            # Convert categorical variables
            df['employment_status'] = df['employment_status'].astype('category')
            df['rental_history'] = df['rental_history'].astype('category')
            df['pet_ownership'] = df['pet_ownership'].astype('category')
            df['smoking_status'] = df['smoking_status'].astype('category')
            df['property_type'] = df['property_type'].astype('category')
            df['lease_type'] = df['lease_type'].astype('category')

            # Create preprocessor
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
                    ('num', numerical_transformer, self.numerical_features),
                    ('cat', categorical_transformer, self.categorical_features)
                ])

            # Split into features and target
            X = df.drop(columns=[self.target_column])
            y = df[self.target_column]

            # Encode target variable
            y = y.map({'low': 0, 'medium': 1, 'high': 2})

            return X, y
        except Exception as e:
            logger.error(f"Error preprocessing data: {str(e)}")
            raise

    def train_test_split_data(self, X: pd.DataFrame, y: pd.Series) -> Tuple:
        """Split data into training and test sets"""
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            logger.info(f"Data split - Train: {len(X_train)}, Test: {len(X_test)}")
            return X_train, X_test, y_train, y_test
        except Exception as e:
            logger.error(f"Error splitting data: {str(e)}")
            raise

    def train_model(self, X_train: pd.DataFrame, y_train: pd.Series) -> Any:
        """Train the machine learning model"""
        try:
            # Preprocess the training data
            X_train_processed = self.preprocessor.fit_transform(X_train)

            # Feature selection
            selector = SelectKBest(score_func=f_classif, k=15)
            X_train_selected = selector.fit_transform(X_train_processed, y_train)

            # Get selected feature names
            selected_features = self.get_selected_features(selector)
            logger.info(f"Selected features: {selected_features}")

            # Define models to try
            models = {
                'random_forest': RandomForestClassifier(random_state=42),
                'gradient_boosting': GradientBoostingClassifier(random_state=42),
                'logistic_regression': LogisticRegression(max_iter=1000, random_state=42),
                'svm': SVC(probability=True, random_state=42),
                'neural_network': MLPClassifier(random_state=42)
            }

            # Define parameter grids for each model
            param_grids = {
                'random_forest': {
                    'n_estimators': [100, 200, 300],
                    'max_depth': [None, 10, 20, 30],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4]
                },
                'gradient_boosting': {
                    'n_estimators': [100, 200],
                    'learning_rate': [0.01, 0.1, 0.2],
                    'max_depth': [3, 5, 7]
                },
                'logistic_regression': {
                    'C': [0.1, 1, 10],
                    'penalty': ['l1', 'l2'],
                    'solver': ['liblinear']
                },
                'svm': {
                    'C': [0.1, 1, 10],
                    'kernel': ['linear', 'rbf']
                },
                'neural_network': {
                    'hidden_layer_sizes': [(50,), (100,), (50, 50)],
                    'activation': ['relu', 'tanh'],
                    'alpha': [0.0001, 0.001]
                }
            }

            best_model = None
            best_score = 0
            best_params = {}

            # Train and evaluate each model
            for name, model in models.items():
                logger.info(f"Training {name}...")

                # Use GridSearchCV for hyperparameter tuning
                grid_search = GridSearchCV(
                    estimator=model,
                    param_grid=param_grids[name],
                    cv=5,
                    scoring='f1_weighted',
                    n_jobs=-1,
                    verbose=1
                )

                grid_search.fit(X_train_selected, y_train)

                # Evaluate on training data
                y_pred = grid_search.predict(X_train_selected)
                score = f1_score(y_train, y_pred, average='weighted')

                logger.info(f"{name} - Best params: {grid_search.best_params_}")
                logger.info(f"{name} - F1 score: {score:.4f}")

                if score > best_score:
                    best_score = score
                    best_model = grid_search.best_estimator_
                    best_params = grid_search.best_params_

            logger.info(f"Best model: {best_model.__class__.__name__} with F1 score: {best_score:.4f}")
            logger.info(f"Best parameters: {best_params}")

            # Train the best model on all training data
            self.model = best_model
            self.model.fit(X_train_selected, y_train)

            # Get feature importances if available
            if hasattr(self.model, 'feature_importances_'):
                self.feature_importances = self.model.feature_importances_
            elif hasattr(self.model, 'coef_'):
                self.feature_importances = np.abs(self.model.coef_[0])

            return self.model
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise

    def get_selected_features(self, selector) -> list:
        """Get names of selected features"""
        try:
            # Get numerical feature names
            num_features = self.numerical_features

            # Get categorical feature names
            cat_encoder = self.preprocessor.named_transformers_['cat'].named_steps['onehot']
            cat_features = cat_encoder.get_feature_names_out(self.categorical_features)

            # Combine all feature names
            all_features = np.concatenate([num_features, cat_features])

            # Get selected feature indices
            selected_indices = selector.get_support(indices=True)

            return [all_features[i] for i in selected_indices]
        except Exception as e:
            logger.error(f"Error getting selected features: {str(e)}")
            return []

    def evaluate_model(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, float]:
        """Evaluate the trained model on test data"""
        try:
            # Preprocess the test data
            X_test_processed = self.preprocessor.transform(X_test)

            # Apply feature selection
            selector = SelectKBest(score_func=f_classif, k=15)
            selector.fit(self.preprocessor.transform(X_test), y_test)
            X_test_selected = selector.transform(X_test_processed)

            # Make predictions
            y_pred = self.model.predict(X_test_selected)
            y_pred_proba = self.model.predict_proba(X_test_selected)

            # Calculate metrics
            metrics = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred, average='weighted'),
                'recall': recall_score(y_test, y_pred, average='weighted'),
                'f1': f1_score(y_test, y_pred, average='weighted'),
                'roc_auc': roc_auc_score(y_test, y_pred_proba, multi_class='ovr'),
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
            }

            # Generate classification report
            report = classification_report(y_test, y_pred, output_dict=True)
            metrics['classification_report'] = report

            logger.info("Model Evaluation Metrics:")
            for metric, value in metrics.items():
                if metric != 'confusion_matrix' and metric != 'classification_report':
                    logger.info(f"{metric}: {value:.4f}")

            return metrics
        except Exception as e:
            logger.error(f"Error evaluating model: {str(e)}")
            raise

    def save_model(self