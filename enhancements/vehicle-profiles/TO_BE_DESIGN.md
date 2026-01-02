# TO_BE_DESIGN.md - Vehicle-Profiles Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Status:** APPROVED

---

## Executive Vision (120 lines)

### Strategic Vision
The enhanced vehicle-profiles module represents a paradigm shift in how we manage, analyze, and interact with vehicle data. This transformation will position our platform as the industry leader in intelligent vehicle lifecycle management, creating a 360-degree digital twin for every vehicle in our ecosystem.

### Business Transformation Goals
1. **Revenue Growth:** Enable 3 new monetization streams through premium analytics, predictive maintenance subscriptions, and dealer integration services
2. **Cost Reduction:** Achieve 40% reduction in operational costs through automation and AI-driven insights
3. **Market Expansion:** Expand from 12 to 25 markets through localized vehicle profiles and regulatory compliance features
4. **Customer Retention:** Increase average customer lifetime value by 2.5x through personalized vehicle experiences

### User Experience Transformation
The new vehicle-profiles module will implement a "Vehicle DNA" concept where each vehicle becomes:
- **Self-aware:** Continuously updating its digital twin with real-time telemetry
- **Predictive:** Anticipating maintenance needs before they become critical
- **Social:** Enabling vehicle-to-vehicle communication for fleet optimization
- **Personalized:** Adapting to driver preferences and usage patterns

### Competitive Advantages
1. **First-Mover in AI-Powered Profiles:** 18-month lead over competitors in predictive analytics
2. **Regulatory Compliance Engine:** Automated compliance with 95% of global vehicle regulations
3. **Frictionless Integration:** 50% faster onboarding for new data providers
4. **Carbon Footprint Tracking:** First in industry to provide ISO-certified emissions reporting

### Long-Term Roadmap (5-Year Vision)

**Year 1: Foundation & Intelligence**
- Core vehicle DNA framework
- Basic predictive maintenance
- Initial dealer integrations
- First AI-driven recommendations

**Year 2: Ecosystem Expansion**
- Vehicle-to-vehicle communication
- Advanced fleet optimization
- Carbon credit marketplace
- Insurance partnership network

**Year 3: Autonomous Integration**
- Self-driving vehicle profiles
- AI co-pilot integration
- Predictive accident avoidance
- Autonomous maintenance scheduling

**Year 4: Global Platform**
- Multi-country regulatory compliance
- Localized vehicle configurations
- Global parts marketplace
- Cross-border vehicle tracking

**Year 5: Industry Standard**
- Open vehicle profile API
- Industry consortium leadership
- Standardized vehicle data format
- Autonomous vehicle certification

### Key Differentiators
1. **Dynamic Vehicle DNA:** Unlike static profiles, our system creates living digital twins that evolve with each vehicle
2. **Predictive Intelligence:** First system to combine historical data, real-time telemetry, and AI for true predictive capabilities
3. **Regulatory Genius:** Automated compliance engine that adapts to changing regulations in real-time
4. **Frictionless Integration:** Designed for seamless integration with any data source or third-party system
5. **Carbon Intelligence:** Comprehensive emissions tracking and optimization tools

### Implementation Phases
**Phase 1: Core Infrastructure (Months 1-3)**
- Database schema redesign
- API architecture modernization
- Basic caching layer
- Initial performance optimizations

**Phase 2: Intelligence Layer (Months 4-6)**
- AI/ML model integration
- Predictive maintenance engine
- Real-time telemetry processing
- Basic analytics dashboards

**Phase 3: Ecosystem Integration (Months 7-9)**
- Third-party API integrations
- Dealer management system connectors
- Fleet optimization tools
- Advanced search capabilities

**Phase 4: User Experience (Months 10-12)**
- Progressive Web App implementation
- Gamification system
- Advanced accessibility features
- Personalized vehicle portals

### Success Metrics
1. **Performance:** 99.99% API availability with <100ms response times
2. **Adoption:** 80% of existing customers migrate within 6 months
3. **Engagement:** 40% increase in user interactions per vehicle profile
4. **Cost Savings:** $2.1M annual savings from predictive maintenance
5. **Revenue:** $8.7M new ARR from premium features

### Stakeholder Impact
**End Users:**
- 60% reduction in unexpected vehicle downtime
- 35% lower maintenance costs through predictive insights
- Personalized vehicle experiences that adapt to usage patterns

**Dealers:**
- 40% faster vehicle onboarding
- 30% higher parts sales through predictive recommendations
- Automated compliance reporting saving 15 hours/week

**Fleet Operators:**
- 25% reduction in fuel costs through optimization
- 20% lower maintenance costs
- 15% improvement in vehicle utilization

**Regulators:**
- 90% reduction in compliance reporting effort
- Real-time emissions monitoring
- Automated recall management

### Risk Mitigation Strategy
The implementation includes comprehensive risk assessment with:
- 12 identified technical risks with mitigation plans
- 8 business risks with contingency strategies
- 5 market risks with adaptive approaches
- 3 regulatory risks with compliance safeguards

### Budget Allocation
| Category               | Allocation | Key Investments                          |
|------------------------|------------|------------------------------------------|
| Development            | 45%        | Core platform, AI/ML, integrations       |
| Infrastructure         | 20%        | Cloud services, performance optimization |
| Testing & QA           | 15%        | Automated testing, security audits       |
| UX/UI Design           | 10%        | Accessibility, PWA, responsive design    |
| Project Management     | 5%         | Agile coaching, tools                    |
| Contingency            | 5%         | Risk mitigation                          |

---

## Performance Enhancements (300+ lines)

### Redis Caching Layer Implementation

```typescript
// redis-cache.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour default
  private readonly CACHE_PREFIX = 'vehicle_profiles:';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = new Redis({
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

      this.client.on('connect', () => {
        this.logger.log('Redis client connected successfully');
      });

      this.client.on('error', (err) => {
        this.logger.error(`Redis error: ${err.message}`);
      });

      // Test connection
      await this.client.ping();
      this.logger.log('Redis connection test successful');
    } catch (err) {
      this.logger.error(`Failed to initialize Redis: ${err.message}`);
      throw err;
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
      this.logger.log('Redis client disconnected');
    }
  }

  private generateCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  private generateHashKey(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.generateCacheKey(key);
      const result = await this.client.get(cacheKey);

      if (!result) {
        this.logger.debug(`Cache miss for key: ${cacheKey}`);
        return null;
      }

      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return JSON.parse(result) as T;
    } catch (err) {
      this.logger.error(`Error getting cache key ${key}: ${err.message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(key);
      const stringValue = JSON.stringify(value);
      const expireTime = ttl || this.DEFAULT_TTL;

      await this.client.setex(cacheKey, expireTime, stringValue);
      this.logger.debug(`Set cache key: ${cacheKey} with TTL: ${expireTime}`);
    } catch (err) {
      this.logger.error(`Error setting cache key ${key}: ${err.message}`);
      throw err;
    }
  }

  async setWithHash<T>(baseKey: string, data: any, value: T, ttl?: number): Promise<void> {
    try {
      const hashKey = this.generateHashKey(data);
      const cacheKey = this.generateCacheKey(`${baseKey}:${hashKey}`);
      const stringValue = JSON.stringify(value);
      const expireTime = ttl || this.DEFAULT_TTL;

      await this.client.setex(cacheKey, expireTime, stringValue);
      this.logger.debug(`Set hashed cache key: ${cacheKey} with TTL: ${expireTime}`);
    } catch (err) {
      this.logger.error(`Error setting hashed cache key: ${err.message}`);
      throw err;
    }
  }

  async getWithHash<T>(baseKey: string, data: any): Promise<T | null> {
    try {
      const hashKey = this.generateHashKey(data);
      const cacheKey = this.generateCacheKey(`${baseKey}:${hashKey}`);
      const result = await this.client.get(cacheKey);

      if (!result) {
        this.logger.debug(`Cache miss for hashed key: ${cacheKey}`);
        return null;
      }

      this.logger.debug(`Cache hit for hashed key: ${cacheKey}`);
      return JSON.parse(result) as T;
    } catch (err) {
      this.logger.error(`Error getting hashed cache key: ${err.message}`);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(key);
      await this.client.del(cacheKey);
      this.logger.debug(`Deleted cache key: ${cacheKey}`);
    } catch (err) {
      this.logger.error(`Error deleting cache key ${key}: ${err.message}`);
      throw err;
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const cachePattern = this.generateCacheKey(pattern);
      const keys = await this.client.keys(`${cachePattern}*`);

      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.debug(`Deleted ${keys.length} cache keys matching pattern: ${cachePattern}`);
      }
    } catch (err) {
      this.logger.error(`Error deleting cache keys by pattern ${pattern}: ${err.message}`);
      throw err;
    }
  }

  async getCacheStats(): Promise<{
    keys: number;
    memoryUsage: string;
    hitRate: number;
  }> {
    try {
      const keys = await this.client.keys(`${this.CACHE_PREFIX}*`);
      const info = await this.client.info('memory');
      const memoryUsage = info.split('\n').find(line => line.startsWith('used_memory:'))?.split(':')[1] || '0';

      // Simplified hit rate calculation (in production, track this separately)
      const hitRate = keys.length > 0 ? 0.85 : 0; // Placeholder

      return {
        keys: keys.length,
        memoryUsage,
        hitRate,
      };
    } catch (err) {
      this.logger.error(`Error getting cache stats: ${err.message}`);
      throw err;
    }
  }

  async cachePipeline<T>(operations: Array<{
    key: string;
    value?: T;
    ttl?: number;
    action: 'set' | 'get' | 'del';
  }>): Promise<Array<T | null | void>> {
    try {
      const pipeline = this.client.pipeline();

      operations.forEach(op => {
        const cacheKey = this.generateCacheKey(op.key);

        switch (op.action) {
          case 'set':
            if (op.value !== undefined) {
              pipeline.setex(
                cacheKey,
                op.ttl || this.DEFAULT_TTL,
                JSON.stringify(op.value)
              );
            }
            break;
          case 'get':
            pipeline.get(cacheKey);
            break;
          case 'del':
            pipeline.del(cacheKey);
            break;
        }
      });

      const results = await pipeline.exec();
      return results.map((result, index) => {
        if (operations[index].action === 'get') {
          return result[1] ? JSON.parse(result[1]) : null;
        }
        return result[0] ? null : undefined;
      });
    } catch (err) {
      this.logger.error(`Error in cache pipeline: ${err.message}`);
      throw err;
    }
  }
}
```

### Database Query Optimization

```typescript
// vehicle-profile.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { VehicleProfile } from './entities/vehicle-profile.entity';
import { VehicleProfileSearchDto } from './dto/vehicle-profile-search.dto';
import { RedisCacheService } from '../cache/redis-cache.service';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { Between, In, Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

@Injectable()
export class VehicleProfileRepository {
  private readonly logger = new Logger(VehicleProfileRepository.name);
  private readonly CACHE_TTL = 300; // 5 minutes for search results
  private readonly PROFILE_CACHE_TTL = 3600; // 1 hour for individual profiles

  constructor(
    @InjectRepository(VehicleProfile)
    private readonly repository: Repository<VehicleProfile>,
    private readonly cacheService: RedisCacheService,
  ) {}

  private generateCacheKey(searchDto: VehicleProfileSearchDto, page: number, limit: number): string {
    const baseKey = 'search';
    const params = {
      ...searchDto,
      page,
      limit,
    };
    return `${baseKey}:${this.cacheService.generateHashKey(params)}`;
  }

  async findAllPaginated(
    searchDto: VehicleProfileSearchDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<VehicleProfile>> {
    const cacheKey = this.generateCacheKey(searchDto, page, limit);

    // Try to get from cache first
    const cachedResult = await this.cacheService.get<PaginatedResult<VehicleProfile>>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Returning cached results for search`);
      return cachedResult;
    }

    const queryBuilder = this.createSearchQueryBuilder(searchDto);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Get results and total count
    const [results, total] = await Promise.all([
      queryBuilder.getMany(),
      queryBuilder.getCount(),
    ]);

    const paginatedResult: PaginatedResult<VehicleProfile> = {
      data: results,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the results
    await this.cacheService.set(cacheKey, paginatedResult, this.CACHE_TTL);

    return paginatedResult;
  }

  private createSearchQueryBuilder(searchDto: VehicleProfileSearchDto): SelectQueryBuilder<VehicleProfile> {
    const queryBuilder = this.repository.createQueryBuilder('vp');

    // Always join with related entities we know we'll need
    queryBuilder
      .leftJoinAndSelect('vp.manufacturer', 'manufacturer')
      .leftJoinAndSelect('vp.model', 'model')
      .leftJoinAndSelect('vp.vehicleType', 'vehicleType')
      .leftJoinAndSelect('vp.features', 'features')
      .leftJoinAndSelect('vp.maintenanceRecords', 'maintenanceRecords')
      .leftJoinAndSelect('vp.telemetryData', 'telemetryData')
      .leftJoinAndSelect('vp.ownerHistory', 'ownerHistory');

    // Apply search conditions
    if (searchDto.vin) {
      queryBuilder.andWhere('vp.vin = :vin', { vin: searchDto.vin });
    }

    if (searchDto.licensePlate) {
      queryBuilder.andWhere('vp.licensePlate = :licensePlate', {
        licensePlate: searchDto.licensePlate,
      });
    }

    if (searchDto.manufacturerId) {
      queryBuilder.andWhere('vp.manufacturerId = :manufacturerId', {
        manufacturerId: searchDto.manufacturerId,
      });
    }

    if (searchDto.modelId) {
      queryBuilder.andWhere('vp.modelId = :modelId', { modelId: searchDto.modelId });
    }

    if (searchDto.yearFrom || searchDto.yearTo) {
      queryBuilder.andWhere('vp.year BETWEEN :yearFrom AND :yearTo', {
        yearFrom: searchDto.yearFrom || 1900,
        yearTo: searchDto.yearTo || new Date().getFullYear() + 1,
      });
    }

    if (searchDto.minMileage || searchDto.maxMileage) {
      queryBuilder.andWhere('vp.mileage BETWEEN :minMileage AND :maxMileage', {
        minMileage: searchDto.minMileage || 0,
        maxMileage: searchDto.maxMileage || 1000000,
      });
    }

    if (searchDto.fuelType) {
      queryBuilder.andWhere('vp.fuelType IN (:...fuelTypes)', {
        fuelTypes: Array.isArray(searchDto.fuelType)
          ? searchDto.fuelType
          : [searchDto.fuelType],
      });
    }

    if (searchDto.transmissionType) {
      queryBuilder.andWhere('vp.transmissionType IN (:...transmissionTypes)', {
        transmissionTypes: Array.isArray(searchDto.transmissionType)
          ? searchDto.transmissionType
          : [searchDto.transmissionType],
      });
    }

    if (searchDto.vehicleTypeId) {
      queryBuilder.andWhere('vp.vehicleTypeId IN (:...vehicleTypeIds)', {
        vehicleTypeIds: Array.isArray(searchDto.vehicleTypeId)
          ? searchDto.vehicleTypeId
          : [searchDto.vehicleTypeId],
      });
    }

    if (searchDto.featureIds && searchDto.featureIds.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          searchDto.featureIds.forEach((featureId, index) => {
            qb.orWhere(`:featureId${index} = ANY(vp.featureIds)`, {
              [`featureId${index}`]: featureId,
            });
          });
        }),
      );
    }

    if (searchDto.searchText) {
      const searchText = `%${searchDto.searchText}%`;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('vp.vin ILIKE :searchText', { searchText })
            .orWhere('vp.licensePlate ILIKE :searchText', { searchText })
            .orWhere('manufacturer.name ILIKE :searchText', { searchText })
            .orWhere('model.name ILIKE :searchText', { searchText })
            .orWhere('vp.color ILIKE :searchText', { searchText })
            .orWhere('vp.engineNumber ILIKE :searchText', { searchText });
        }),
      );
    }

    if (searchDto.status) {
      queryBuilder.andWhere('vp.status IN (:...statuses)', {
        statuses: Array.isArray(searchDto.status)
          ? searchDto.status
          : [searchDto.status],
      });
    }

    if (searchDto.lastMaintenanceFrom || searchDto.lastMaintenanceTo) {
      queryBuilder.andWhere(
        'vp.lastMaintenanceDate BETWEEN :lastMaintenanceFrom AND :lastMaintenanceTo',
        {
          lastMaintenanceFrom: searchDto.lastMaintenanceFrom || '1900-01-01',
          lastMaintenanceTo: searchDto.lastMaintenanceTo || new Date().toISOString(),
        },
      );
    }

    // Apply sorting
    if (searchDto.sortBy) {
      const sortDirection = searchDto.sortDirection || 'ASC';
      queryBuilder.orderBy(`vp.${searchDto.sortBy}`, sortDirection);

      // Add secondary sort for consistent ordering
      queryBuilder.addOrderBy('vp.id', 'ASC');
    } else {
      queryBuilder.orderBy('vp.createdAt', 'DESC');
    }

    return queryBuilder;
  }

  async findById(id: string): Promise<VehicleProfile | null> {
    const cacheKey = `profile:${id}`;

    // Try to get from cache first
    const cachedProfile = await this.cacheService.get<VehicleProfile>(cacheKey);
    if (cachedProfile) {
      this.logger.debug(`Returning cached profile for ID: ${id}`);
      return cachedProfile;
    }

    const queryBuilder = this.repository
      .createQueryBuilder('vp')
      .leftJoinAndSelect('vp.manufacturer', 'manufacturer')
      .leftJoinAndSelect('vp.model', 'model')
      .leftJoinAndSelect('vp.vehicleType', 'vehicleType')
      .leftJoinAndSelect('vp.features', 'features')
      .leftJoinAndSelect('vp.maintenanceRecords', 'maintenanceRecords')
      .leftJoinAndSelect('vp.telemetryData', 'telemetryData')
      .leftJoinAndSelect('vp.ownerHistory', 'ownerHistory')
      .where('vp.id = :id', { id });

    const profile = await queryBuilder.getOne();

    if (profile) {
      // Cache the result
      await this.cacheService.set(cacheKey, profile, this.PROFILE_CACHE_TTL);
    }

    return profile;
  }

  async findByVin(vin: string): Promise<VehicleProfile | null> {
    const cacheKey = `profile:vin:${vin}`;

    // Try to get from cache first
    const cachedProfile = await this.cacheService.get<VehicleProfile>(cacheKey);
    if (cachedProfile) {
      this.logger.debug(`Returning cached profile for VIN: ${vin}`);
      return cachedProfile;
    }

    const queryBuilder = this.repository
      .createQueryBuilder('vp')
      .leftJoinAndSelect('vp.manufacturer', 'manufacturer')
      .leftJoinAndSelect('vp.model', 'model')
      .leftJoinAndSelect('vp.vehicleType', 'vehicleType')
      .where('vp.vin = :vin', { vin });

    const profile = await queryBuilder.getOne();

    if (profile) {
      // Cache the result
      await this.cacheService.set(cacheKey, profile, this.PROFILE_CACHE_TTL);
    }

    return profile;
  }

  async updateProfile(id: string, updateData: Partial<VehicleProfile>): Promise<VehicleProfile> {
    // Update in database
    await this.repository.update(id, updateData);

    // Get the updated profile
    const updatedProfile = await this.findById(id);

    if (!updatedProfile) {
      throw new Error('Profile not found after update');
    }

    // Invalidate cache for this profile
    await this.cacheService.del(`profile:${id}`);
    await this.cacheService.del(`profile:vin:${updatedProfile.vin}`);

    // Invalidate search cache that might include this profile
    await this.cacheService.delPattern('search');

    return updatedProfile;
  }

  async getAdvancedAnalytics(
    searchDto: VehicleProfileSearchDto,
  ): Promise<{
    totalVehicles: number;
    avgMileage: number;
    avgAge: number;
    fuelTypeDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
    maintenanceFrequency: Record<string, number>;
  }> {
    const cacheKey = `analytics:${this.cacheService.generateHashKey(searchDto)}`;

    // Try to get from cache first
    const cachedAnalytics = await this.cacheService.get(cacheKey);
    if (cachedAnalytics) {
      this.logger.debug('Returning cached analytics');
      return cachedAnalytics;
    }

    const queryBuilder = this.createSearchQueryBuilder(searchDto);

    // Get base query for counting
    const countQuery = queryBuilder.clone();

    // Get analytics data
    const [
      totalVehicles,
      mileageResult,
      ageResult,
      fuelTypeResult,
      statusResult,
      maintenanceResult,
    ] = await Promise.all([
      countQuery.getCount(),
      queryBuilder
        .select('AVG(vp.mileage)', 'avgMileage')
        .getRawOne(),
      queryBuilder
        .select('AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, vp.manufactureDate)))', 'avgAge')
        .getRawOne(),
      queryBuilder
        .select('vp.fuelType', 'fuelType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('vp.fuelType')
        .getRawMany(),
      queryBuilder
        .select('vp.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('vp.status')
        .getRawMany(),
      queryBuilder
        .select('EXTRACT(YEAR FROM vp.lastMaintenanceDate)', 'year')
        .addSelect('COUNT(*)', 'count')
        .where('vp.lastMaintenanceDate IS NOT NULL')
        .groupBy('EXTRACT(YEAR FROM vp.lastMaintenanceDate)')
        .orderBy('year', 'ASC')
        .getRawMany(),
    ]);

    const result = {
      totalVehicles,
      avgMileage: parseFloat(mileageResult.avgMileage) || 0,
      avgAge: parseFloat(ageResult.avgAge) || 0,
      fuelTypeDistribution: fuelTypeResult.reduce((acc, curr) => {
        acc[curr.fuelType] = parseInt(curr.count);
        return acc;
      }, {} as Record<string, number>),
      statusDistribution: statusResult.reduce((acc, curr) => {
        acc[curr.status] = parseInt(curr.count);
        return acc;
      }, {} as Record<string, number>),
      maintenanceFrequency: maintenanceResult.reduce((acc, curr) => {
        acc[curr.year] = parseInt(curr.count);
        return acc;
      }, {} as Record<string, number>),
    };

    // Cache the results
    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async getTelemetryTrends(
    vehicleId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<{
    fuelEfficiency: Array<{ date: string; value: number }>;
    engineLoad: Array<{ date: string; value: number }>;
    batteryVoltage: Array<{ date: string; value: number }>;
    tirePressure: Array<{ date: string; value: Record<string, number> }>;
  }> {
    const cacheKey = `telemetry:${vehicleId}:${timeRange.from.toISOString()}:${timeRange.to.toISOString()}`;

    // Try to get from cache first
    const cachedTrends = await this.cacheService.get(cacheKey);
    if (cachedTrends) {
      this.logger.debug('Returning cached telemetry trends');
      return cachedTrends;
    }

    const queryBuilder = this.repository
      .createQueryBuilder('vp')
      .leftJoinAndSelect('vp.telemetryData', 'telemetry')
      .where('vp.id = :vehicleId', { vehicleId })
      .andWhere('telemetry.timestamp BETWEEN :from AND :to', {
        from: timeRange.from,
        to: timeRange.to,
      })
      .orderBy('telemetry.timestamp', 'ASC');

    const telemetryData = await queryBuilder.getOne();

    if (!telemetryData || !telemetryData.telemetryData) {
      return {
        fuelEfficiency: [],
        engineLoad: [],
        batteryVoltage: [],
        tirePressure: [],
      };
    }

    // Process telemetry data
    const fuelEfficiency: Array<{ date: string; value: number }> = [];
    const engineLoad: Array<{ date: string; value: number }> = [];
    const batteryVoltage: Array<{ date: string; value: number }> = [];
    const tirePressure: Array<{ date: string; value: Record<string, number> }> = [];

    telemetryData.telemetryData.forEach((data) => {
      const date = data.timestamp.toISOString().split('T')[0];

      fuelEfficiency.push({
        date,
        value: data.fuelEfficiency || 0,
      });

      engineLoad.push({
        date,
        value: data.engineLoad || 0,
      });

      batteryVoltage.push({
        date,
        value: data.batteryVoltage || 0,
      });

      tirePressure.push({
        date,
        value: {
          frontLeft: data.tirePressureFrontLeft || 0,
          frontRight: data.tirePressureFrontRight || 0,
          rearLeft: data.tirePressureRearLeft || 0,
          rearRight: data.tirePressureRearRight || 0,
        },
      });
    });

    const result = {
      fuelEfficiency,
      engineLoad,
      batteryVoltage,
      tirePressure,
    };

    // Cache the results
    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
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

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly compressionMiddleware: (req: Request, res: Response, next: NextFunction) => void;

  constructor(private configService: ConfigService) {
    // Configure compression with optimal settings
    this.compressionMiddleware = compression({
      level: this.configService.get('COMPRESSION_LEVEL', 6), // 6 is a good balance
      threshold: this.configService.get('COMPRESSION_THRESHOLD', 1024), // 1KB threshold
      filter: (req: Request, res: Response) => {
        // Don't compress responses that are already compressed
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Don't compress if the response is small
        if (res.getHeader('Content-Length') &&
            parseInt(res.getHeader('Content-Length') as string) < 1024) {
          return false;
        }

        // Don't compress binary data
        if (res.getHeader('Content-Type')?.includes('application/octet-stream')) {
          return false;
        }

        // Compress all other responses
        return compression.filter(req, res);
      },
      strategy: this.configService.get('COMPRESSION_STRATEGY', 'DEFAULT'),
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Set compression-related headers
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('X-Content-Encoding', 'gzip');

    // Apply compression middleware
    this.compressionMiddleware(req, res, next);
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
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResponseCompressionInterceptor implements NestInterceptor {
  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Set additional compression headers
    response.setHeader(
      'Content-Encoding',
      this.configService.get('CONTENT_ENCODING', 'gzip'),
    );

    return next.handle().pipe(
      map((data) => {
        // For successful responses, ensure we're not double-compressing
        if (response.getHeader('Content-Encoding') === 'gzip') {
          return data;
        }

        // For non-compressed responses, ensure proper content-length
        if (!response.getHeader('Content-Length')) {
          const stringData = JSON.stringify(data);
          response.setHeader('Content-Length', Buffer.byteLength(stringData));
        }

        return data;
      }),
    );
  }
}

// response-compression.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ResponseCompressionMiddleware } from './response-compression.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseCompressionInterceptor } from './response-compression.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseCompressionInterceptor,
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
```

### Lazy Loading Implementation

```typescript
// lazy-loading.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { LAZY_LOADING_KEY } from './lazy-loading.constants';

export const LazyLoad = (options: {
  path: string;
  condition?: (data: any) => boolean;
  maxDepth?: number;
  ttl?: number;
}): MethodDecorator => {
  return SetMetadata(LAZY_LOADING_KEY, options);
};

// lazy-loading.interceptor.ts
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
import { LAZY_LOADING_KEY } from './lazy-loading.constants';
import { RedisCacheService } from '../cache/redis-cache.service';
import { VehicleProfileService } from '../vehicle-profile/vehicle-profile.service';

@Injectable()
export class LazyLoadingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LazyLoadingInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: RedisCacheService,
    private readonly vehicleProfileService: VehicleProfileService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const lazyLoadOptions = this.reflector.get<{
      path: string;
      condition?: (data: any) => boolean;
      maxDepth?: number;
      ttl?: number;
    }>(LAZY_LOADING_KEY, context.getHandler());

    if (!lazyLoadOptions) {
      return next.handle();
    }

    return next.handle().pipe(
      map(async (data) => {
        if (!data) {
          return data;
        }

        // Check if we should lazy load based on condition
        if (lazyLoadOptions.condition && !lazyLoadOptions.condition(data)) {
          return data;
        }

        // Get the path to the property that needs lazy loading
        const pathParts = lazyLoadOptions.path.split('.');
        let current = data;

        // Navigate to the parent of the property to be lazy loaded
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            return data;
          }
          current = current[pathParts[i]];
        }

        const lastPart = pathParts[pathParts.length - 1];
        const propertyValue = current[lastPart];

        // If the property is already loaded, return the data as is
        if (propertyValue !== undefined && propertyValue !== null) {
          return data;
        }

        // Generate a unique key for this lazy load request
        const request = context.switchToHttp().getRequest();
        const cacheKey = this.generateLazyLoadCacheKey(
          request,
          lazyLoadOptions.path,
        );

        // Try to get from cache first
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
          this.logger.debug(`Lazy loading from cache for path: ${lazyLoadOptions.path}`);
          current[lastPart] = cachedData;
          return data;
        }

        try {
          // Determine the ID to load based on the data structure
          let idToLoad: string | null = null;

          if (current.id) {
            idToLoad = current.id;
          } else if (current.vehicleId) {
            idToLoad = current.vehicleId;
          } else if (current.vehicleProfileId) {
            idToLoad = current.vehicleProfileId;
          }

          if (!idToLoad) {
            this.logger.warn(`Could not determine ID for lazy loading at path: ${lazyLoadOptions.path}`);
            return data;
          }

          // Load the data based on the path
          let loadedData: any;

          switch (lazyLoadOptions.path) {
            case 'maintenanceRecords':
              loadedData = await this.vehicleProfileService.getMaintenanceRecords(
                idToLoad,
                lazyLoadOptions.maxDepth,
              );
              break;
            case 'telemetryData':
              loadedData = await this.vehicleProfileService.getTelemetryData(
                idToLoad,
                lazyLoadOptions.maxDepth,
              );
              break;
            case 'ownerHistory':
              loadedData = await this.vehicleProfileService.getOwnerHistory(
                idToLoad,
                lazyLoadOptions.maxDepth,
              );
              break;
            case 'features':
              loadedData = await this.vehicleProfileService.getVehicleFeatures(
                idToLoad,
              );
              break;
            case 'documents':
              loadedData = await this.vehicleProfileService.getVehicleDocuments(
                idToLoad,
              );
              break;
            case 'insurance':
              loadedData = await this.vehicleProfileService.getInsuranceInfo(
                idToLoad,
              );
              break;
            case 'warranty':
              loadedData = await this.vehicleProfileService.getWarrantyInfo(
                idToLoad,
              );
              break;
            default:
              this.logger.warn(`No lazy loading handler for path: ${lazyLoadOptions.path}`);
              return data;
          }

          // Set the loaded data on the property
          current[lastPart] = loadedData;

          // Cache the loaded data
          await this.cacheService.set(
            cacheKey,
            loadedData,
            lazyLoadOptions.ttl || 300, // 5 minutes default
          );

          return data;
        } catch (err) {
          this.logger.error(
            `Error lazy loading data for path ${lazyLoadOptions.path}: ${err.message}`,
          );
          return data;
        }
      }),
    );
  }

  private generateLazyLoadCacheKey(
    request: any,
    path: string,
  ): string {
    const userId = request.user?.id || 'anonymous';
    const vehicleId = request.params.vehicleId || request.body.vehicleId || 'unknown';
    const queryHash = this.cacheService.generateHashKey(request.query);

    return `lazy:${userId}:${vehicleId}:${path}:${queryHash}`;
  }
}

// lazy-loading.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LazyLoadingInterceptor } from './lazy-loading.interceptor';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { VehicleProfileModule } from '../vehicle-profile/vehicle-profile.module';

@Module({
  imports: [RedisCacheModule, VehicleProfileModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LazyLoadingInterceptor,
    },
  ],
})
export class LazyLoadingModule {}

// example usage in controller
import { Controller, Get, Param } from '@nestjs/common';
import { VehicleProfileService } from './vehicle-profile.service';
import { LazyLoad } from '../lazy-loading/lazy-loading.decorator';

@Controller('vehicle-profiles')
export class VehicleProfileController {
  constructor(private readonly vehicleProfileService: VehicleProfileService) {}

  @Get(':id')
  @LazyLoad({
    path: 'maintenanceRecords',
    condition: (data) => data.showMaintenanceRecords,
    maxDepth: 2,
    ttl: 600,
  })
  async getVehicleProfile(@Param('id') id: string) {
    return this.vehicleProfileService.getBasicProfile(id);
  }
}
```

### Request Debouncing

```typescript
// debounce.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Injectable()
export class DebounceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DebounceMiddleware.name);
  private readonly redisClient: Redis;
  private readonly DEFAULT_DEBOUNCE_TIME = 1000; // 1 second default
  private readonly DEBOUNCE_PREFIX = 'debounce:';

  constructor(private configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip debouncing for certain routes
    if (this.shouldSkipDebounce(req)) {
      return next();
    }

    const debounceKey = this.generateDebounceKey(req);
    const debounceTime = this.getDebounceTime(req);

    try {
      // Check if this request is already being processed
      const isProcessing = await this.redisClient.get(debounceKey);

      if (isProcessing) {
        this.logger.debug(`Debouncing request: ${req.method} ${req.originalUrl}`);
        return res.status(429).json({
          statusCode: 429,
          message: 'Request is being processed. Please wait before retrying.',
          retryAfter: debounceTime / 1000,
        });
      }

      // Set the debounce key with expiration
      await this.redisClient.setex(
        debounceKey,
        debounceTime / 1000,
        'processing',
      );

      // Add cleanup for when the request completes
      res.on('finish', async () => {
        try {
          await this.redisClient.del(debounceKey);
        } catch (err) {
          this.logger.error(`Error cleaning up debounce key: ${err.message}`);
        }
      });

      next();
    } catch (err) {
      this.logger.error(`Debounce middleware error: ${err.message}`);
      next();
    }
  }

  private generateDebounceKey(req: Request): string {
    // Create a unique key based on user, route, and parameters
    const userId = req.user?.id || req.ip || 'anonymous';
    const method = req.method;
    const path = req.path;

    // Include query parameters in the key
    const queryParams = new URLSearchParams(req.query as Record<string, any>);
    queryParams.sort();

    // Include body parameters for POST/PUT/PATCH requests
    let bodyParams = '';
    if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const bodyKeys = Object.keys(req.body).sort();
      bodyParams = bodyKeys
        .map(key => `${key}=${JSON.stringify(req.body[key])}`)
        .join('&');
    }

    return `${this.DEBOUNCE_PREFIX}${userId}:${method}:${path}:${queryParams.toString()}:${bodyParams}`;
  }

  private getDebounceTime(req: Request): number {
    // Different routes can have different debounce times
    const routeDebounceTimes: Record<string, number> = {
      '/api/vehicle-profiles/search': 2000, // 2 seconds for search
      '/api/vehicle-profiles/analytics': 3000, // 3 seconds for analytics
      '/api/vehicle-profiles/telemetry': 500, // 0.5 seconds for telemetry
    };

    // Check for route-specific debounce time
    const routeKey = `${req.method}:${req.path}`;
    if (routeDebounceTimes[routeKey]) {
      return routeDebounceTimes[routeKey];
    }

    // Check for debounce time in headers
    const headerDebounceTime = req.headers['x-debounce-time'];
    if (headerDebounceTime && !isNaN(Number(headerDebounceTime))) {
      return Math.min(Number(headerDebounceTime), 10000); // Max 10 seconds
    }

    return this.DEFAULT_DEBOUNCE_TIME;
  }

  private shouldSkipDebounce(req: Request): boolean {
    // Skip debouncing for certain routes
    const skipRoutes = [
      '/api/health',
      '/api/auth',
      '/api/webhooks',
    ];

    return skipRoutes.some(route => req.path.startsWith(route));
  }
}

// debounce.guard.ts
import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { DEBOUNCE_TIME_KEY } from './debounce.constants';

@Injectable()
export class DebounceGuard implements CanActivate {
  private readonly logger = new Logger(DebounceGuard.name);
  private readonly redisClient: Redis;
  private readonly DEBOUNCE_PREFIX = 'debounce:guard:';

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const debounceTime = this.reflector.get<number>(
      DEBOUNCE_TIME_KEY,
      context.getHandler(),
    );

    if (!debounceTime) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const debounceKey = this.generateDebounceKey(request);

    try {
      const isProcessing = await this.redisClient.get(debounceKey);

      if (isProcessing) {
        this.logger.debug(`Debounce guard triggered for ${request.method} ${request.path}`);
        return false;
      }

      await this.redisClient.setex(
        debounceKey,
        debounceTime / 1000,
        'processing',
      );

      return true;
    } catch (err) {
      this.logger.error(`Debounce guard error: ${err.message}`);
      return true; // Fail open
    }
  }

  private generateDebounceKey(req: Request): string {
    const userId = req.user?.id || req.ip || 'anonymous';
    const method = req.method;
    const path = req.path;

    // Include relevant parameters in the key
    const params = {
      ...req.query,
      ...req.params,
      ...(req.body && ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : {}),
    };

    return `${this.DEBOUNCE_PREFIX}${userId}:${method}:${path}:${JSON.stringify(params)}`;
  }
}

// debounce.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { DEBOUNCE_TIME_KEY } from './debounce.constants';

export const Debounce = (time: number): MethodDecorator => {
  return SetMetadata(DEBOUNCE_TIME_KEY, time);
};

// example usage in controller
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Debounce } from '../debounce/debounce.decorator';
import { DebounceGuard } from '../debounce/debounce.guard';

@Controller('vehicle-profiles')
export class VehicleProfileController {
  @Post('search')
  @Debounce(2000) // 2 seconds debounce
  @UseGuards(DebounceGuard)
  async searchVehicleProfiles(@Body() searchDto: VehicleProfileSearchDto) {
    // Search implementation
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
import { VehicleProfile } from './vehicle-profile/entities/vehicle-profile.entity';
import { Manufacturer } from './vehicle-profile/entities/manufacturer.entity';
import { Model } from './vehicle-profile/entities/model.entity';
import { VehicleType } from './vehicle-profile/entities/vehicle-type.entity';
import { Feature } from './vehicle-profile/entities/feature.entity';
import { MaintenanceRecord } from './vehicle-profile/entities/maintenance-record.entity';
import { TelemetryData } from './vehicle-profile/entities/telemetry-data.entity';
import { OwnerHistory } from './vehicle-profile/entities/owner-history.entity';

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
          VehicleProfile,
          Manufacturer,
          Model,
          VehicleType,
          Feature,
          MaintenanceRecord,
          TelemetryData,
          OwnerHistory,
        ],
        synchronize: false, // Always false in production
        logging: configService.get('DB_LOGGING', 'error').split(','),
        maxQueryExecutionTime: configService.get('DB_SLOW_QUERY_THRESHOLD', 1000),
        ssl: configService.get('DB_SSL') === 'true' ? {
          rejectUnauthorized: configService.get('DB_SSL_REJECT_UNAUTHORIZED') !== 'false',
        } : false,
        // Connection pool settings
        extra: {
          max: configService.get('DB_POOL_MAX', 20), // Maximum number of connections in the pool
          min: configService.get('DB_POOL_MIN', 2), // Minimum number of connections in the pool
          idleTimeoutMillis: configService.get('DB_POOL_IDLE_TIMEOUT', 30000), // 30 seconds
          connectionTimeoutMillis: configService.get('DB_POOL_CONNECTION_TIMEOUT', 2000), // 2 seconds
          maxUses: configService.get('DB_POOL_MAX_USES', 1000), // Maximum number of queries per connection
          application_name: 'vehicle-profiles-service',
        },
        // TypeORM specific pool settings
        pool: {
          max: configService.get('DB_POOL_MAX', 20),
          min: configService.get('DB_POOL_MIN', 2),
          acquire: configService.get('DB_POOL_ACQUIRE_TIMEOUT', 10000), // 10 seconds
          idle: configService.get('DB_POOL_IDLE_TIMEOUT', 30000), // 30 seconds
          evictionRunIntervalMillis: configService.get('DB_POOL_EVICTION_INTERVAL', 10000), // 10 seconds
          numTestsPerRun: configService.get('DB_POOL_TESTS_PER_RUN', 3),
          softIdleTimeoutMillis: configService.get('DB_POOL_SOFT_IDLE_TIMEOUT', 10000), // 10 seconds
        },
      }),
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }

        const dataSource = new DataSource(options);
        await dataSource.initialize();

        // Add transactional support
        return addTransactionalDataSource(dataSource);
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

// database-health.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

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
      const connection = await this.dataSource.createQueryRunner().connect();
      await connection.release();

      // Check pool statistics
      const poolStats = this.getPoolStatistics();

      return this.getStatus(key, true, {
        pool: poolStats,
        message: 'Database connection pool is healthy',
      });
    } catch (err) {
      this.logger.error(`Database health check failed: ${err.message}`);
      return this.getStatus(key, false, {
        error: err.message,
        message: 'Database connection pool is unhealthy',
      });
    }
  }

  private getPoolStatistics(): {
    totalConnections: number;
    idleConnections: number;
    usedConnections: number;
    waitingClients: number;
  } {
    const pool = this.dataSource.driver.pool;

    if (!pool) {
      return {
        totalConnections: 0,
        idleConnections: 0,
        usedConnections: 0,
        waitingClients: 0,
      };
    }

    // For pg-pool (PostgreSQL)
    if ('_pool' in pool) {
      const pgPool = pool as any;
      return {
        totalConnections: pgPool._pool.length,
        idleConnections: pgPool._idle.length,
        usedConnections: pgPool._pendingQueue.length,
        waitingClients: pgPool.waitingCount,
      };
    }

    // For other pool implementations, return basic stats
    return {
      totalConnections: pool.totalCount || 0,
      idleConnections: pool.idleCount || 0,
      usedConnections: pool.usedCount || 0,
      waitingClients: pool.waitingCount || 0,
    };
  }

  async getConnectionPoolMetrics(): Promise<{
    maxConnections: number;
    currentConnections: number;
    idleConnections: number;
    activeConnections: number;
    waitingRequests: number;
    connectionTimeouts: number;
    averageConnectionTime: number;
    averageQueryTime: number;
  }> {
    try {
      const pool = this.dataSource.driver.pool;

      if (!pool) {
        return {
          maxConnections: 0,
          currentConnections: 0,
          idleConnections: 0,
          activeConnections: 0,
          waitingRequests: 0,
          connectionTimeouts: 0,
          averageConnectionTime: 0,
          averageQueryTime: 0,
        };
      }

      // Get basic pool metrics
      const metrics = {
        maxConnections: pool.options.max || 0,
        currentConnections: pool.totalCount || 0,
        idleConnections: pool.idleCount || 0,
        activeConnections: pool.usedCount || 0,
        waitingRequests: pool.waitingCount || 0,
        connectionTimeouts: pool.connectionTimeouts || 0,
        averageConnectionTime: pool.averageConnectionTime || 0,
        averageQueryTime: pool.averageQueryTime || 0,
      };

      return metrics;
    } catch (err) {
      this.logger.error(`Error getting connection pool metrics: ${err.message}`);
      return {
        maxConnections: 0,
        currentConnections: 0,
        idleConnections: 0,
        activeConnections: 0,
        waitingRequests: 0,
        connectionTimeouts: 0,
        averageConnectionTime: 0,
        averageQueryTime: 0,
      };
    }
  }

  async getSlowQueries(thresholdMs: number = 1000): Promise<Array<{
    query: string;
    parameters: any[];
    executionTime: number;
    timestamp: Date;
  }>> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const slowQueries = await queryRunner.query(`
        SELECT query, params as parameters, execution_time_ms as "executionTime", timestamp
        FROM pg_stat_statements
        WHERE execution_time_ms > $1
        ORDER BY execution_time_ms DESC
        LIMIT 100
      `, [thresholdMs]);

      await queryRunner.release();

      return slowQueries.map(query => ({
        query: query.query,
        parameters: query.parameters,
        executionTime: parseFloat(query.executionTime),
        timestamp: new Date(query.timestamp),
      }));
    } catch (err) {
      this.logger.error(`Error getting slow queries: ${err.message}`);
      return [];
    }
  }

  async getLongRunningTransactions(): Promise<Array<{
    pid: number;
    usename: string;
    application_name: string;
    client_addr: string;
    query: string;
    query_start: Date;
    state: string;
    waiting: boolean;
  }>> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const transactions = await queryRunner.query(`
        SELECT pid, usename, application_name, client_addr, query, query_start, state, waiting
        FROM pg_stat_activity
        WHERE state = 'active'
        AND query NOT LIKE '%pg_stat_activity%'
        AND query_start < NOW() - INTERVAL '5 minutes'
        ORDER BY query_start ASC
      `);

      await queryRunner.release();

      return transactions.map(tx => ({
        pid: tx.pid,
        usename: tx.usename,
        application_name: tx.application_name,
        client_addr: tx.client_addr,
        query: tx.query,
        query_start: new Date(tx.query_start),
        state: tx.state,
        waiting: tx.waiting,
      }));
    } catch (err) {
      this.logger.error(`Error getting long-running transactions: ${err.message}`);
      return [];
    }
  }
}

// connection-pool.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ConnectionPoolInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ConnectionPoolInterceptor.name);
  private readonly WARNING_THRESHOLD = 0.8; // 80% of pool capacity
  private readonly CRITICAL_THRESHOLD = 0.95; // 95% of pool capacity

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap({
        next: () => this.logConnectionUsage(request, startTime, false),
        error: () => this.logConnectionUsage(request, startTime, true),
      }),
    );
  }

  private logConnectionUsage(
    request: any,
    startTime: number,
    isError: boolean,
  ): void {
    try {
      const pool = this.dataSource.driver.pool;
      if (!pool) return;

      const duration = Date.now() - startTime;
      const poolStats = this.getPoolStatistics(pool);
      const poolUsage = poolStats.usedConnections / poolStats.maxConnections;

      // Log basic request info
      this.logger.log({
        message: 'Request completed',
        method: request.method,
        path: request.path,
        status: isError ? 'error' : 'success',
        duration,
        poolUsage: `${Math.round(poolUsage * 100)}%`,
        usedConnections: poolStats.usedConnections,
        idleConnections: poolStats.idleConnections,
      });

      // Log warnings if pool usage is high
      if (poolUsage > this.CRITICAL_THRESHOLD) {
        this.logger.warn({
          message: 'Connection pool usage critical',
          poolUsage: `${Math.round(poolUsage * 100)}%`,
          usedConnections: poolStats.usedConnections,
          maxConnections: poolStats.maxConnections,
          request: `${request.method} ${request.path}`,
        });
      } else if (poolUsage > this.WARNING_THRESHOLD) {
        this.logger.warn({
          message: 'Connection pool usage high',
          poolUsage: `${Math.round(poolUsage * 100)}%`,
          usedConnections: poolStats.usedConnections,
          maxConnections: poolStats.maxConnections,
          request: `${request.method} ${request.path}`,
        });
      }
    } catch (err) {
      this.logger.error(`Error logging connection pool usage: ${err.message}`);
    }
  }

  private getPoolStatistics(pool: any): {
    maxConnections: number;
    usedConnections: number;
    idleConnections: number;
  } {
    if ('_pool' in pool) {
      // pg-pool
      return {
        maxConnections: pool.options.max,
        usedConnections: pool._pendingQueue.length,
        idleConnections: pool._idle.length,
      };
    }

    // Generic pool
    return {
      maxConnections: pool.options.max || 0,
      usedConnections: pool.usedCount || 0,
      idleConnections: pool.idleCount || 0,
    };
  }
}

// connection-pool.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ConnectionPoolService {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private readonly POOL_MONITORING_INTERVAL = '30 seconds';

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async monitorConnectionPool() {
    try {
      const poolStats = await this.getPoolStatistics();
      const poolUsage = poolStats.usedConnections / poolStats.maxConnections;

      // Log pool statistics
      this.logger.debug({
        message: 'Connection pool statistics',
        ...poolStats,
        poolUsage: `${Math.round(poolUsage * 100)}%`,
      });

      // Check for potential issues
      if (poolUsage > 0.9) {
        this.logger.warn({
          message: 'High connection pool usage',
          ...poolStats,
          poolUsage: `${Math.round(poolUsage * 100)}%`,
        });

        // Consider scaling up or alerting
        await this.handleHighPoolUsage(poolStats);
      }

      if (poolStats.waitingRequests > 0) {
        this.logger.warn({
          message: 'Requests waiting for connections',
          waitingRequests: poolStats.waitingRequests,
        });
      }

      if (poolStats.connectionTimeouts > 0) {
        this.logger.error({
          message: 'Connection timeouts detected',
          connectionTimeouts: poolStats.connectionTimeouts,
        });
      }
    } catch (err) {
      this.logger.error(`Error monitoring connection pool: ${err.message}`);
    }
  }

  private async handleHighPoolUsage(poolStats: {
    maxConnections: number;
    usedConnections: number;
    idleConnections: number;
    waitingRequests: number;
  }): Promise<void> {
    // Implement strategies to handle high pool usage
    // 1. Log detailed information
    this.logger.error({
      message: 'Connection pool capacity issue',
      action: 'Implementing mitigation strategies',
      ...poolStats,
    });

    // 2. Check for long-running queries
    const longRunningQueries = await this.getLongRunningQueries();
    if (longRunningQueries.length > 0) {
      this.logger.error({
        message: 'Long-running queries detected',
        queries: longRunningQueries.map(q => ({
          query: q.query.substring(0, 100) + '...',
          executionTime: q.executionTime,
        })),
      });

      // Consider killing long-running queries if they're problematic
      // await this.killLongRunningQueries(longRunningQueries);
    }

    // 3. Check for idle transactions
    const idleTransactions = await this.getIdleTransactions();
    if (idleTransactions.length > 0) {
      this.logger.error({
        message: 'Idle transactions detected',
        transactions: idleTransactions.map(t => ({
          pid: t.pid,
          duration: this.formatDuration(t.query_start),
        })),
      });

      // Consider terminating idle transactions
      // await this.terminateIdleTransactions(idleTransactions);
    }
  }

  private async getPoolStatistics(): Promise<{
    maxConnections: number;
    usedConnections: number;
    idleConnections: number;
    waitingRequests: number;
    connectionTimeouts: number;
  }> {
    try {
      const pool = this.dataSource.driver.pool;

      if (!pool) {
        return {
          maxConnections: 0,
          usedConnections: 0,
          idleConnections: 0,
          waitingRequests: 0,
          connectionTimeouts: 0,
        };
      }

      // For pg-pool
      if ('_pool' in pool) {
        const pgPool = pool as any;
        return {
          maxConnections: pgPool.options.max,
          usedConnections: pgPool._pendingQueue.length,
          idleConnections: pgPool._idle.length,
          waitingRequests: pgPool.waitingCount,
          connectionTimeouts: pgPool.connectionTimeouts || 0,
        };
      }

      // For other pool implementations
      return {
        maxConnections: pool.options.max || 0,
        usedConnections: pool.usedCount || 0,
        idleConnections: pool.idleCount || 0,
        waitingRequests: pool.waitingCount || 0,
        connectionTimeouts: pool.connectionTimeouts || 0,
      };
    } catch (err) {
      this.logger.error(`Error getting pool statistics: ${err.message}`);
      return {
        maxConnections: 0,
        usedConnections: 0,
        idleConnections: 0,
        waitingRequests: 0,
        connectionTimeouts: 0,
      };
    }
  }

  private async getLongRunningQueries(thresholdMinutes: number = 5): Promise<Array<{
    pid: number;
    query: string;
    executionTime: number;
    query_start: Date;
  }>> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const queries = await queryRunner.query(`
        SELECT pid, query, now() - query_start AS execution_time, query_start
        FROM pg_stat_activity
        WHERE state = 'active'
        AND query NOT LIKE '%pg_stat_activity%'
        AND query_start < NOW() - INTERVAL '${thresholdMinutes} minutes'
        ORDER BY query_start ASC
      `);

      await queryRunner.release();

      return queries.map(q => ({
        pid: q.pid,
        query: q.query,
        executionTime: this.convertIntervalToMs(q.execution_time),
        query_start: new Date(q.query_start),
      }));
    } catch (err) {
      this.logger.error(`Error getting long-running queries: ${err.message}`);
      return [];
    }
  }

  private async getIdleTransactions(): Promise<Array<{
    pid: number;
    query: string;
    query_start: Date;
    state: string;
  }>> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const transactions = await queryRunner.query(`
        SELECT pid, query, query_start, state
        FROM pg_stat_activity
        WHERE state = 'idle in transaction'
        AND query_start < NOW() - INTERVAL '5 minutes'
        ORDER BY query_start ASC
      `);

      await queryRunner.release();

      return transactions.map(t => ({
        pid: t.pid,
        query: t.query,
        query_start: new Date(t.query_start),
        state: t.state,
      }));
    } catch (err) {
      this.logger.error(`Error getting idle transactions: ${err.message}`);
      return [];
    }
  }

  private convertIntervalToMs(interval: string): number {
    // Parse PostgreSQL interval format (e.g., "00:05:30.123456")
    const parts = interval.split(/[:.]/);
    if (parts.length < 3) return 0;

    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    const milliseconds = parts.length > 3 ? parseInt(parts[3].substring(0, 3)) || 0 : 0;

    return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
  }

  private formatDuration(startTime: Date): string {
    const durationMs = Date.now() - startTime.getTime();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
```

---

## Real-Time Features (300+ lines)

### WebSocket Server Setup

```typescript
// websocket.module.ts
import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { VehicleProfileModule } from '../vehicle-profile/vehicle-profile.module';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    VehicleProfileModule,
    RedisModule,
    AuthModule,
  ],
  providers: [WebSocketGateway, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}

// websocket.gateway.ts
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
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  namespace: 'vehicle-profiles',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebSocketGateway.name);

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.webSocketService.setServer(server);

    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 300000); // Every 5 minutes
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.debug(`Client connected: ${client.id}`);

      // Authenticate the connection
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect(true);
        return;
      }

      const user = await this.authService.validateWebSocketToken(token as string);
      if (!user) {
        this.logger.warn(`Client ${client.id} provided invalid token`);
        client.disconnect(true);
        return;
      }

      // Store user information on the socket
      client.data.user = user;

      // Add to default room
      client.join('all_users');

      // Add to user-specific room
      client.join(`user_${user.id}`);

      // Store connection in Redis
      await this.redisService.set(
        `ws:connection:${client.id}`,
        {
          userId: user.id,
          connectedAt: new Date().toISOString(),
          ip: client.handshake.address,
          userAgent: client.handshake.headers['user-agent'],
        },
        86400, // 24 hours
      );

      this.logger.log(`Client ${client.id} authenticated as user ${user.id}`);
    } catch (err) {
      this.logger.error(`Connection error for client ${client.id}: ${err.message}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      this.logger.debug(`Client disconnected: ${client.id}`);

      // Remove from Redis
      await this.redisService.del(`ws:connection:${client.id}`);

      // Remove from all rooms
      const rooms = [...client.rooms];
      for (const room of rooms) {
        client.leave(room);
      }

      if (client.data.user) {
        this.logger.log(`User ${client.data.user.id} disconnected`);
      }
    } catch (err) {
      this.logger.error(`Disconnection error for client ${client.id}: ${err.message}`);
    }
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { room: string; vehicleId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!client.data.user) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { room, vehicleId } = data;

      // Validate room
      if (!this.isValidRoom(room)) {
        client.emit('error', { message: 'Invalid room' });
        return;
      }

      // Check permissions for vehicle-specific rooms
      if (room.startsWith('vehicle_') && vehicleId) {
        const hasAccess = await this.webSocketService.checkVehicleAccess(
          client.data.user.id,
          vehicleId,
        );

        if (!hasAccess) {
          client.emit('error', { message: 'Access denied to vehicle' });
          return;
        }
      }

      // Join the room
      client.join(room);
      this.logger.debug(`Client ${client.id} joined room ${room}`);

      // Get initial state if available
      if (room.startsWith('vehicle_') && vehicleId) {
        const initialState = await this.webSocketService.getVehicleInitialState(vehicleId);
        client.emit('initial_state', initialState);
      }

      client.emit('subscribed', { room });
    } catch (err) {
      this.logger.error(`Subscribe error for client ${client.id}: ${err.message}`);
      client.emit('error', { message: 'Subscription failed' });
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!this.isValidRoom(room)) {
        client.emit('error', { message: 'Invalid room' });
        return;
      }

      client.leave(room);
      this.logger.debug(`Client ${client.id} left room ${room}`);
      client.emit('unsubscribed', { room });
    } catch (err) {
      this.logger.error(`Unsubscribe error for client ${client.id}: ${err.message}`);
      client.emit('error', { message: 'Unsubscription failed' });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  private isValidRoom(room: string): boolean {
    const validRooms = [
      'all_users',
      'vehicle_*',
      'fleet_*',
      'maintenance_*',
      'telemetry_*',
      'alerts_*',
    ];

    return validRooms.some(validRoom =>
      validRoom.endsWith('*')
        ? room.startsWith(validRoom.slice(0, -1))
        : room === validRoom,
    );
  }

  private async cleanupStaleConnections() {
    try {
      this.logger.debug('Starting stale connection cleanup');

      // Get all active connections from Redis
      const connectionKeys = await this.redisService.keys('ws:connection:*');
      const activeConnections = await this.redisService.mget(connectionKeys);

      // Get all connected clients from the server
      const connectedClients = this.server.sockets.sockets;

      // Find connections in Redis that are no longer active
      const staleConnections = connectionKeys.filter(key => {
        const clientId = key.split(':')[2];
        return !connectedClients.has(clientId);
      });

      if (staleConnections.length > 0) {
        this.logger.log(`Cleaning up ${staleConnections.length} stale connections`);
        await this.redisService.del(staleConnections);
      }
    } catch (err) {
      this.logger.error(`Error during stale connection cleanup: ${err.message}`);
    }
  }
}
```

### Real-Time Event Handlers

```typescript
// websocket.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { VehicleProfileService } from '../vehicle-profile/vehicle-profile.service';
import { RedisService } from '../redis/redis.service';
import { VehicleProfile } from '../vehicle-profile/entities/vehicle-profile.entity';
import { TelemetryData } from '../vehicle-profile/entities/telemetry-data.entity';
import { MaintenanceRecord } from '../vehicle-profile/entities/maintenance-record.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WebSocketService {
  private server: Server;
  private readonly logger = new Logger(WebSocketService.name);
  private readonly EVENT_PREFIX = 'vehicle:';

  constructor(
    private readonly vehicleProfileService: VehicleProfileService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Subscribe to Redis pub/sub for real-time events
    this.subscribeToRedisEvents();
  }

  setServer(server: Server) {
    this.server = server;
  }

  private subscribeToRedisEvents() {
    this.redisService.subscribe(`${this.EVENT_PREFIX}*`);

    this.redisService.on('message', (channel: string, message: string) => {
      try {
        const event = channel.substring(this.EVENT_PREFIX.length);
        const data = JSON.parse(message);

        this.handleRedisEvent(event, data);
      } catch (err) {
        this.logger.error(`Error processing Redis event: ${err.message}`);
      }
    });
  }

  private async handleRedisEvent(event: string, data: any) {
    try {
      switch (event) {
        case 'profile:updated':
          await this.handleProfileUpdated(data);
          break;
        case 'telemetry:updated':
          await this.handleTelemetryUpdated(data);
          break;
        case 'maintenance:created':
          await this.handleMaintenanceCreated(data);
          break;
        case 'maintenance:updated':
          await this.handleMaintenanceUpdated(data);
          break;
        case 'alert:triggered':
          await this.handleAlertTriggered(data);
          break;
        case 'fleet:updated':
          await this.handleFleetUpdated(data);
          break;
        default:
          this.logger.warn(`Unknown event type: ${event}`);
      }
    } catch (err) {
      this.logger.error(`Error handling event ${event}: ${err.message}`);
    }
  }

  private async handleProfileUpdated(data: { vehicleId: string; changes: Partial<VehicleProfile> }) {
    try {
      const { vehicleId, changes } = data;

      // Get the vehicle profile to get the current state
      const profile = await this.vehicleProfileService.getBasicProfile(vehicleId);
      if (!profile) return;

      // Emit to vehicle-specific room
      this.server.to(`vehicle_${vehicleId}`).emit('profile_updated', {
        vehicleId,
        changes,
        profile: this.sanitizeProfile(profile),
      });

      // Emit to fleet room if this vehicle is part of a fleet
      if (profile.fleetId) {
        this.server.to(`fleet_${profile.fleetId}`).emit('fleet_profile_updated', {
          vehicleId,
          fleetId: profile.fleetId,
          changes,
        });
      }

      // Emit to user-specific rooms if needed
      const usersWithAccess = await this.vehicleProfileService.getUsersWithAccess(vehicleId);
      for (const userId of usersWithAccess) {
        this.server.to(`user_${userId}`).emit('vehicle_updated', {
          vehicleId,
          changes,
        });
      }
    } catch (err) {
      this.logger.error(`Error handling profile updated event: ${err.message}`);
    }
  }

  private async handleTelemetryUpdated(data: {
    vehicleId: string;
    telemetry: TelemetryData;
    isCritical?: boolean;
  }) {
    try {
      const { vehicleId, telemetry, isCritical } = data;

      // Emit to vehicle-specific room
      this.server.to(`vehicle_${vehicleId}`).emit('telemetry_updated', {
        vehicleId,
        telemetry: this.sanitizeTelemetry(telemetry),
        timestamp: new Date().toISOString(),
      });

      // Emit to telemetry-specific room
      this.server.to(`telemetry_${vehicleId}`).emit('telemetry_data', {
        vehicleId,
        telemetry: this.sanitizeTelemetry(telemetry),
      });

      // If this is a critical telemetry update, emit to alerts room
      if (isCritical) {
        this.server.to(`alerts_${vehicleId}`).emit('critical_telemetry', {
          vehicleId,
          telemetry: this.sanitizeTelemetry(telemetry),
          timestamp: new Date().toISOString(),
        });
      }

      // Emit to fleet room if this vehicle is part of a fleet
      const profile = await this.vehicleProfileService.getBasicProfile(vehicleId);
      if (profile?.fleetId) {
        this.server.to(`fleet_${profile.fleetId}`).emit('fleet_telemetry_updated', {
          vehicleId,
          fleetId: profile.fleetId,
          telemetry: this.sanitizeTelemetry(telemetry),
        });
      }
    } catch (err) {
      this.logger.error(`Error handling telemetry updated event: ${err.message}`);
    }
  }

  private async handleMaintenanceCreated(data: { record: MaintenanceRecord; vehicleId: string }) {
    try {
      const { record, vehicleId } = data;

      // Emit to vehicle-specific room
      this.server.to(`vehicle_${vehicleId}`).emit('maintenance_created', {
        vehicleId,
        record: this.sanitizeMaintenanceRecord(record),
      });

      // Emit to maintenance-specific room
      this.server.to(`maintenance_${vehicleId}`).emit('maintenance_record', {
        vehicleId,
        record: this.sanitizeMaintenanceRecord(record),
      });

      // Emit to user-specific rooms
      const usersWithAccess = await this.vehicleProfileService.getUsersWithAccess(vehicleId);
      for (const userId of usersWithAccess) {
        this.server.to(`user_${userId}`).emit('maintenance_alert', {
          vehicleId,
          record: this.sanitizeMaintenanceRecord(record),
        });
      }
    } catch (err) {
      this.logger.error(`Error handling maintenance created event: ${err.message}`);
    }
  }

  private async handleMaintenanceUpdated(data: { record: MaintenanceRecord; vehicleId: string }) {
    try {
      const { record, vehicleId } = data;

      // Emit to vehicle-specific room
      this.server.to(`vehicle_${vehicleId}`).emit('maintenance_updated', {
        vehicleId,
        record: this.sanitizeMaintenanceRecord(record),
      });

      // Emit to maintenance-specific room
      this.server.to(`maintenance_${vehicleId}`).emit('maintenance_record_updated', {
        vehicleId,
        record: this.sanitizeMaintenanceRecord(record),
      });
    } catch (err) {
      this.logger.error(`Error handling maintenance updated event: ${err.message}`);
    }
  }

  private async handleAlertTriggered(data: {
    vehicleId: string;
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metadata?: any;
  }) {
    try {
      const { vehicleId, alertType, severity, message, metadata } = data;

      // Emit to alerts room
      this.server.to(`alerts_${vehicleId}`).emit('alert', {
        vehicleId,
        alertType,
        severity,
        message,
        metadata,
        timestamp: new Date().toISOString(),
      });

      // Emit to vehicle-specific room
      this.server.to(`vehicle_${vehicleId}`).emit('vehicle_alert', {
        vehicleId,
        alertType,
        severity,
        message,
        metadata,
      });

      // Emit to user-specific rooms
      const usersWithAccess = await this.vehicleProfileService.getUsersWithAccess(vehicleId);
      for (const userId of usersWithAccess) {
        this.server.to(`user_${userId}`).emit('alert', {
          vehicleId,
          alertType,
          severity,
          message,
          metadata,
        });
      }

      // For critical alerts, emit to all admins
      if (severity === 'critical') {
        this.server.to('all_admins').emit('critical_alert', {
          vehicleId,
          alertType,
          severity,
          message,
          metadata,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      this.logger.error(`Error handling alert triggered event: ${err.message}`);
    }
  }

  private async handleFleetUpdated(data: { fleetId: string; changes: any }) {
    try {
      const { fleetId, changes } = data;

      // Emit to fleet room
      this.server.to(`fleet_${fleetId}`).emit('fleet_updated', {
        fleetId,
        changes,
      });

      // Emit to all vehicles in the fleet
      const vehicleIds = await this.vehicleProfileService.getVehicleIdsInFleet(fleetId);
      for (const vehicleId of vehicleIds) {
        this.server.to(`vehicle_${vehicleId}`).emit('fleet_update', {
          fleetId,
          changes,
        });
      }
    } catch (err) {
      this.logger.error(`Error handling fleet updated event: ${err.message}`);
    }
  }

  async checkVehicleAccess(userId: string, vehicleId: string): Promise<boolean> {
    try {
      // Check if user has direct access to the vehicle
      const hasDirectAccess = await this.vehicleProfileService.checkUserAccess(
        userId,
        vehicleId,
      );

      if (hasDirectAccess) return true;

      // Check if user has access through a fleet
      const fleetId = await this.vehicleProfileService.getFleetIdForVehicle(vehicleId);
      if (fleetId) {
        return this.vehicleProfileService.checkFleetAccess(userId, fleetId);
      }

      return false;
    } catch (err) {
      this.logger.error(`Error checking vehicle access: ${err.message}`);
      return false;
    }
  }

  async getVehicleInitialState(vehicleId: string): Promise<any> {
    try {
      const profile = await this.vehicleProfileService.getBasicProfile(vehicleId);
      if (!profile) return null;

      const telemetry = await this.vehicleProfileService.getLatestTelemetry(vehicleId);
      const maintenance = await this.vehicleProfileService.getUpcomingMaintenance(vehicleId);
      const alerts = await this.vehicleProfileService.getActiveAlerts(vehicleId);

      return {
        profile: this.sanitizeProfile(profile),
        telemetry: telemetry ? this.sanitizeTelemetry(telemetry) : null,
        upcomingMaintenance: maintenance,
        activeAlerts: alerts,
      };
    } catch (err) {
      this.logger.error(`Error getting vehicle initial state: ${err.message}`);
      return null;
    }
  }

  private sanitizeProfile(profile: VehicleProfile): any {
    return {
      id: profile.id,
      vin: profile.vin,
      licensePlate: profile.licensePlate,
      year: profile.year,
      make: profile.manufacturer?.name,
      model: profile.model?.name,
      vehicleType: profile.vehicleType?.name,
      status: profile.status,
      mileage: profile.mileage,
      color: profile.color,
      fuelType: profile.fuelType,
      transmissionType: profile.transmissionType,
      lastMaintenanceDate: profile.lastMaintenanceDate,
      nextMaintenanceDate: profile.nextMaintenanceDate,
      fleetId: profile.fleetId,
    };
  }

  private sanitizeTelemetry(telemetry: TelemetryData): any {
    return {
      timestamp: telemetry.timestamp,
      fuelLevel: telemetry.fuelLevel,
      fuelEfficiency: telemetry.fuelEfficiency,
      engineLoad: telemetry.engineLoad,
      engineTemperature: telemetry.engineTemperature,
      batteryVoltage: telemetry.batteryVoltage,
      odometer: telemetry.odometer,
      tirePressure: {
        frontLeft: telemetry.tirePressureFrontLeft,
        frontRight: telemetry.tirePressureFrontRight,
        rearLeft: telemetry.tirePressureRearLeft,
        rearRight: telemetry.tirePressureRearRight,
      },
      location: telemetry.location ? {
        latitude: telemetry.location.coordinates[1],
        longitude: telemetry.location.coordinates[0],
      } : null,
      speed: telemetry.speed,
      rpm: telemetry.rpm,
    };
  }

  private sanitizeMaintenanceRecord(record: MaintenanceRecord): any {
    return {
      id: record.id,
      type: record.type,
      description: record.description,
      status: record.status,
      scheduledDate: record.scheduledDate,
      completedDate: record.completedDate,
      cost: record.cost,
      mileage: record.mileage,
      notes: record.notes,
      technician: record.technician,
    };
  }

  async emitToRoom(room: string, event: string, data: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    this.server.to(room).emit(event, data);
  }

  async emitToUser(userId: string, event: string, data: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    this.server.to(`user_${userId}`).emit(event, data);
  }

  async emitToVehicle(vehicleId: string, event: string, data: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    this.server.to(`vehicle_${vehicleId}`).emit(event, data);
  }

  async broadcast(event: string, data: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    this.server.emit(event, data);
  }

  async getConnectedClientsCount(): Promise<number> {
    if (!this.server) return 0;
    return this.server.sockets.sockets.size;
  }

  async getConnectedClientsInRoom(room: string): Promise<string[]> {
    if (!this.server) return [];
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.map(socket => socket.id);
  }

  async getUserConnections(userId: string): Promise<string[]> {
    return this.getConnectedClientsInRoom(`user_${userId}`);
  }

  async getVehicleConnections(vehicleId: string): Promise<string[]> {
    return this.getConnectedClientsInRoom(`vehicle_${vehicleId}`);
  }
}
```

### Client-Side WebSocket Integration

```typescript
// vehicle-websocket.service.ts (Angular Service)
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { filter, map, shareReplay, takeUntil } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Router } from '@angular/router';

export interface WebSocketMessage {
  event: string;
  data: any;
  timestamp?: string;
}

export interface WebSocketConnectionStatus {
  connected: boolean;
  connecting: boolean;
  lastError?: string;
  lastReconnectAttempt?: Date;
  reconnectAttempts: number;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleWebSocketService implements OnDestroy {
  private socket$: WebSocketSubject<any>;
  private messageSubject = new Subject<WebSocketMessage>();
  private connectionStatusSubject = new BehaviorSubject<WebSocketConnectionStatus>({
    connected: false,
    connecting: false,
    reconnectAttempts: 0
  });
  private destroy$ = new Subject<void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // 1 second
  private heartbeatInterval: NodeJS.Timeout;
  private subscribedRooms = new Set<string>();
  private pendingSubscriptions = new Map<string, (value: boolean) => void>();

  constructor(
    private authService: AuthService,
    private ngZone: NgZone,
    private router: Router
  ) {
    this.initializeWebSocket();
    this.setupAuthListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  private initializeWebSocket(): void {
    if (this.socket$) {
      return;
    }

    this.updateConnectionStatus({ connecting: true });

    const token = this.authService.getAccessToken();
    if (!token) {
      this.updateConnectionStatus({
        connected: false,
        connecting: false,
        lastError: 'No authentication token available'
      });
      return;
    }

    const wsUrl = this.getWebSocketUrl();
    this.socket$ = webSocket({
      url: wsUrl,
      serializer: msg => JSON.stringify(msg),
      deserializer: msg => {
        try {
          return JSON.parse(msg.data);
        } catch (e) {
          return msg;
        }
      },
      openObserver: {
        next: () => {
          this.ngZone.run(() => {
            this.reconnectAttempts = 0;
            this.updateConnectionStatus({ connected: true, connecting: false });

            // Re-subscribe to all rooms after reconnection
            this.resubscribeToRooms();

            // Start heartbeat
            this.startHeartbeat();
          });
        }
      },
      closeObserver: {
        next: (event) => {
          this.ngZone.run(() => {
            this.updateConnectionStatus({
              connected: false,
              connecting: false,
              lastError: `WebSocket closed: ${event.code} - ${event.reason}`
            });

            // Stop heartbeat
            this.stopHeartbeat();

            // Attempt to reconnect if this wasn't a deliberate disconnect
            if (event.code !== 1000) {
              this.scheduleReconnect();
            }
          });
        }
      }
    });

    this.socket$.pipe(
      takeUntil(this.destroy$),
      filter(msg => msg !== null && msg !== undefined)
    ).subscribe(
      (message: WebSocketMessage) => {
        this.ngZone.run(() => {
          this.messageSubject.next({
            event: message.event,
            data: message.data,
            timestamp: new Date().toISOString()
          });
        });
      },
      (error) => {
        this.ngZone.run(() => {
          this.updateConnectionStatus({
            connected: false,
            connecting: false,
            lastError: `WebSocket error: ${error.message}`
          });
          this.scheduleReconnect();
        });
      }
    );
  }

  private getWebSocketUrl(): string {
    const token = this.authService.getAccessToken();
    const baseUrl = environment.wsUrl || environment.apiUrl.replace(/^http/, 'ws');
    return `${baseUrl}/vehicle-profiles?token=${token}`;
  }

  private setupAuthListener(): void {
    this.authService.authState$.pipe(
      takeUntil(this.destroy$),
      filter(state => !state.isAuthenticated)
    ).subscribe(() => {
      this.disconnect();
    });
  }

  private updateConnectionStatus(status: Partial<WebSocketConnectionStatus>): void {
    const currentStatus = this.connectionStatusSubject.getValue();
    this.connectionStatusSubject.next({
      ...currentStatus,
      ...status,
      reconnectAttempts: status.connected ? 0 : currentStatus.reconnectAttempts + 1
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateConnectionStatus({
        lastError: `Max reconnection attempts (${this.maxReconnectAttempts}) reached`
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000); // Max 30 seconds

    this.updateConnectionStatus({
      connecting: true,
      lastReconnectAttempt: new Date(),
      reconnectAttempts: this.reconnectAttempts
    });

    setTimeout(() => {
      if (!this.connectionStatusSubject.getValue().connected) {
        this.initializeWebSocket();
      }
    }, delay);
  }

  private resubscribeToRooms(): void {
    if (this.subscribedRooms.size === 0) return;

    const roomsToResubscribe = [...this.subscribedRooms];
    this.subscribedRooms.clear();

    roomsToResubscribe.forEach(room => {
      this.subscribeToRoom(room).then(success => {
        if (!success) {
          console.warn(`Failed to resubscribe to room: ${room}`);
        }
      });
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket$ && this.connectionStatusSubject.getValue().connected) {
        this.socket$.next({ event: 'ping' });
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  connect(): void {
    if (this.connectionStatusSubject.getValue().connected) {
      return;
    }
    this.initializeWebSocket();
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
    this.updateConnectionStatus({ connected: false, connecting: false });
    this.stopHeartbeat();
  }

  get connectionStatus$(): Observable<WebSocketConnectionStatus> {
    return this.connectionStatusSubject.asObservable();
  }

  get messages$(): Observable<WebSocketMessage> {
    return this.messageSubject.asObservable();
  }

  getMessageByEvent<T>(event: string): Observable<T> {
    return this.messageSubject.pipe(
      filter(msg => msg.event === event),
      map(msg => msg.data as T)
    );
  }

  async subscribeToRoom(room: string): Promise<boolean> {
    if (!this.socket$ || !this.connectionStatusSubject.getValue().connected) {
      return new Promise<boolean>(resolve => {
        this.pendingSubscriptions.set(room, resolve);
      });
    }

    if (this.subscribedRooms.has(room)) {
      return true;
    }

    return new Promise<boolean>(resolve => {
      const timeout = setTimeout(() => {
        this.pendingSubscriptions.delete(room);
        resolve(false);
      }, 5000);

      this.socket$.next({
        event: 'subscribe',
        data: { room }
      });

      this.socket$.pipe(
        filter(msg => msg.event === 'subscribed' && msg.data.room === room),
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          clearTimeout(timeout);
          this.subscribedRooms.add(room);
          this.pendingSubscriptions.get(room)?.(true);
          this.pendingSubscriptions.delete(room);
          resolve(true);
        },
        error: () => {
          clearTimeout(timeout);
          this.pendingSubscriptions.get(room)?.(false);
          this.pendingSubscriptions.delete(room);
          resolve(false);
        }
      });
    });
  }

  async unsubscribeFromRoom(room: string): Promise<boolean> {
    if (!this.socket$ || !this.connectionStatusSubject.getValue().connected) {
      return false;
    }

    if (!this.subscribedRooms.has(room)) {
      return true;
    }

    return new Promise<boolean>(resolve => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      this.socket$.next({
        event: 'unsubscribe',
        data: room
      });

      this.socket$.pipe(
        filter(msg => msg.event === 'unsubscribed' && msg.data.room === room),
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          clearTimeout(timeout);
          this.subscribedRooms.delete(room);
          resolve(true);
        },
        error: () => {
          clearTimeout(timeout);
          resolve(false);
        }
      });
    });
  }

  async subscribeToVehicle(vehicleId: string): Promise<boolean> {
    return this.subscribeToRoom(`vehicle_${vehicleId}`);
  }

  async unsubscribeFromVehicle(vehicleId: string): Promise<boolean> {
    return this.unsubscribeFromRoom(`vehicle_${vehicleId}`);
  }

  async subscribeToFleet(fleetId: string): Promise<boolean> {
    return this.subscribeToRoom(`fleet_${fleetId}`);
  }

  async unsubscribeFromFleet(fleetId: string): Promise<boolean> {
    return this.unsubscribeFromRoom(`fleet_${fleetId}`);
  }

  async subscribeToAlerts(vehicleId: string): Promise<boolean> {
    return this.subscribeToRoom(`alerts_${vehicleId}`);
  }

  async unsubscribeFromAlerts(vehicleId: string): Promise<boolean> {
    return this.unsubscribeFromRoom(`alerts_${vehicleId}`);
  }

  getSubscribedRooms(): string[] {
    return Array.from(this.subscribedRooms);
  }

  // Specific event observables
  get profileUpdates$(): Observable<{ vehicleId: string; changes: any; profile: any }> {
    return this.getMessageByEvent('profile_updated');
  }

  get telemetryUpdates$(): Observable<{
    vehicleId: string;
    telemetry: any;
    timestamp: string;
  }> {
    return this.getMessageByEvent('telemetry_updated');
  }

  get maintenanceUpdates$(): Observable<{
    vehicleId: string;
    record: any;
  }> {
    return this.getMessageByEvent('maintenance_created');
  }

  get alerts$(): Observable<{
    vehicleId: string;
    alertType: string;
    severity: string;
    message: string;
    metadata?: any;
  }> {
    return this.getMessageByEvent('alert');
  }

  get fleetUpdates$(): Observable<{ fleetId: string; changes: any }> {
    return this.getMessageByEvent('fleet_updated');
  }

  get criticalTelemetry$(): Observable<{
    vehicleId: string;
    telemetry: any;
    timestamp: string;
  }> {
    return this.getMessageByEvent('critical_telemetry');
  }

  get initialState$(): Observable<any> {
    return this.getMessageByEvent('initial_state');
  }
}

// vehicle-realtime.component.ts (Example Component)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { VehicleWebSocketService } from '../../services/vehicle-websocket.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { VehicleProfileService } from '../../services/vehicle-profile.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-vehicle-realtime',
  templateUrl: './vehicle-realtime.component.html',
  styleUrls: ['./vehicle-realtime.component.scss']
})
export class VehicleRealtimeComponent implements OnInit, OnDestroy {
  vehicleId: string;
  vehicleProfile: any;
  telemetryData: any;
  maintenanceRecords: any[] = [];
  activeAlerts: any[] = [];
  connectionStatus: any;
  isLoading = true;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private vehicleWebSocketService: VehicleWebSocketService,
    private vehicleProfileService: VehicleProfileService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.vehicleId = this.route.snapshot.paramMap.get('id');
    this.setupWebSocketConnection();
    this.loadInitialData();
    this.setupConnectionStatusListener();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.vehicleWebSocketService.unsubscribeFromVehicle(this.vehicleId);
    this.vehicleWebSocketService.unsubscribeFromAlerts(this.vehicleId);
  }

  private setupWebSocketConnection(): void {
    // Subscribe to vehicle updates
    this.subscriptions.add(
      this.vehicleWebSocketService.subscribeToVehicle(this.vehicleId).then(success => {
        if (!success) {
          this.alertService.error('Failed to connect to real-time updates');
        }
      })
    );

    // Subscribe to alerts
    this.subscriptions.add(
      this.vehicleWebSocketService.subscribeToAlerts(this.vehicleId).then(success => {
        if (!success) {
          console.warn('Failed to subscribe to alerts');
        }
      })
    );

    // Listen for profile updates
    this.subscriptions.add(
      this.vehicleWebSocketService.profileUpdates$.subscribe(update => {
        if (update.vehicleId === this.vehicleId) {
          this.vehicleProfile = update.profile;
        }
      })
    );

    // Listen for telemetry updates
    this.subscriptions.add(
      this.vehicleWebSocketService.telemetryUpdates$.subscribe(update => {
        if (update.vehicleId === this.vehicleId) {
          this.telemetryData = update.telemetry;
        }
      })
    );

    // Listen for maintenance updates
    this.subscriptions.add(
      this.vehicleWebSocketService.maintenanceUpdates$.subscribe(update => {
        if (update.vehicleId === this.vehicleId) {
          this.maintenanceRecords.unshift(update.record);
          if (this.maintenanceRecords.length > 10) {
            this.maintenanceRecords.pop();
          }
        }
      })
    );

    // Listen for alerts
    this.subscriptions.add(
      this.vehicleWebSocketService.alerts$.subscribe(alert => {
        if (alert.vehicleId === this.vehicleId) {
          this.activeAlerts.unshift(alert);
          if (this.activeAlerts.length > 5) {
            this.activeAlerts.pop();
          }

          // Show alert to user
          this.alertService.warning(alert.message);
        }
      })
    );

    // Listen for initial state
    this.subscriptions.add(
      this.vehicleWebSocketService.initialState$.subscribe(state => {
        if (state.profile?.id === this.vehicleId) {
          this.vehicleProfile = state.profile;
          this.telemetryData = state.telemetry;
          this.isLoading = false;
        }
      })
    );
  }

  private loadInitialData(): void {
    this.vehicleProfileService.getVehicleProfile(this.vehicleId).subscribe({
      next: (profile) => {
        this.vehicleProfile = profile;
      },
      error: (err) => {
        this.alertService.error('Failed to load vehicle profile');
        console.error('Error loading vehicle profile:', err);
      }
    });

    this.vehicleProfileService.getLatestTelemetry(this.vehicleId).subscribe({
      next: (telemetry) => {
        this.telemetryData = telemetry;
      },
      error: (err) => {
        console.error('Error loading telemetry data:', err);
      }
    });

    this.vehicleProfileService.getRecentMaintenance(this.vehicleId).subscribe({
      next: (records) => {
        this.maintenanceRecords = records;
      },
      error: (err) => {
        console.error('Error loading maintenance records:', err);
      }
    });

    this.vehicleProfileService.getActiveAlerts(this.vehicleId).subscribe({
      next: (alerts) => {
        this.activeAlerts = alerts;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading active alerts:', err);
        this.isLoading = false;
      }
    });
  }

  private setupConnectionStatusListener(): void {
    this.subscriptions.add(
      this.vehicleWebSocketService.connectionStatus$.subscribe(status => {
        this.connectionStatus = status;

        if (!status.connected && !status.connecting) {
          this.alertService.warning('Real-time connection lost. Some updates may be delayed.');
        } else if (status.connected && status.reconnectAttempts > 0) {
          this.alertService.success('Real-time connection restored');
        }
      })
    );
  }

  getFuelLevelPercentage(): number {
    return this.telemetryData?.fuelLevel ? Math.round(this.telemetryData.fuelLevel * 100) : 0;
  }

  getTirePressureStatus(tire: string): string {
    const pressure = this.telemetryData?.tirePressure?.[tire];
    if (pressure === undefined) return 'unknown';

    if (pressure < 28) return 'low';
    if (pressure > 35) return 'high';
    return 'normal';
  }

  getEngineTemperatureStatus(): string {
    const temp = this.telemetryData?.engineTemperature;
    if (temp === undefined) return 'unknown';

    if (temp < 180) return 'low';
    if (temp > 220) return 'high';
    return 'normal';
  }

  getBatteryVoltageStatus(): string {
    const voltage = this.telemetryData?.batteryVoltage;
    if (voltage === undefined) return 'unknown';

    if (voltage < 12.2) return 'low';
    if (voltage > 14.8) return 'high';
    return 'normal';
  }

  reconnect(): void {
    this.vehicleWebSocketService.connect();
  }
}
```

### Room/Channel Management

```typescript
// room.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { VehicleProfileService } from '../vehicle-profile/vehicle-profile.service';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private readonly ROOM_PREFIX = 'ws:room:';
  private readonly USER_ROOMS_PREFIX = 'ws:user:rooms:';

  constructor(
    private readonly redisService: RedisService,
    private readonly vehicleProfileService: VehicleProfileService,
    private readonly webSocketService: WebSocketService,
  ) {}

  async addUserToRoom(userId: string, room: string, socketId: string): Promise<void> {
    try {
      // Add to room set
      await this.redisService.sadd(`${this.ROOM_PREFIX}${room}`, socketId);

      // Add room to user's rooms set
      await this.redisService.sadd(`${this.USER_ROOMS_PREFIX}${userId}`, room);

      // Store additional room metadata if needed
      if (room.startsWith('vehicle_')) {
        const vehicleId = room.substring('vehicle_'.length);
        await this.storeVehicleRoomMetadata(vehicleId, room);
      } else if (room.startsWith('fleet_')) {
        const fleetId = room.substring('fleet_'.length);
        await this.storeFleetRoomMetadata(fleetId, room);
      }

      this.logger.debug(`User ${userId} added to room ${room} with socket ${socketId}`);
    } catch (err) {
      this.logger.error(`Error adding user to room: ${err.message}`);
      throw err;
    }
  }

  async removeUserFromRoom(userId: string, room: string, socketId: string): Promise<void> {
    try {
      // Remove from room set
      await this.redisService.srem(`${this.ROOM_PREFIX}${room}`, socketId);

      // Remove room from user's rooms set if no more sockets in the room
      const remainingSockets = await this.redisService.smembers(`${this.ROOM_PREFIX}${room}`);
      if (remainingSockets.length === 0) {
        await this.redisService.srem(`${this.USER_ROOMS_PREFIX}${userId}`, room);

        // Clean up room metadata
        if (room.startsWith('vehicle_')) {
          const vehicleId = room.substring('vehicle_'.length);
          await this.removeVehicleRoomMetadata(vehicleId, room);
        } else if (room.startsWith('fleet_')) {
          const fleetId = room.substring('fleet_'.length);
          await this.removeFleetRoomMetadata(fleetId, room);
        }
      }

      this.logger.debug(`User ${userId} removed from room ${room} with socket ${socketId}`);
    } catch (err) {
      this.logger.error(`Error removing user from room: ${err.message}`);
      throw err;
    }
  }

  async getUsersInRoom(room: string): Promise<string[]> {
    try {
      const socketIds = await this.redisService.smembers(`${this.ROOM_PREFIX}${room}`);

      // Get user IDs for each socket
      const userIds = await Promise.all(
        socketIds.map(socketId => this.getUserIdForSocket(socketId)),
      );

      return [...new Set(userIds.filter(userId => userId))];
    } catch (err) {
      this.logger.error(`Error getting users in room: ${err.message}`);
      return [];
    }
  }

  async getRoomsForUser(userId: string): Promise<string[]> {
    try {
      return this.redisService.smembers(`${this.USER_ROOMS_PREFIX}${userId}`);
    } catch (err) {
      this.logger.error(`Error getting rooms for user: ${err.message}`);
      return [];
    }
  }

  async getSocketsInRoom(room: string): Promise<string[]> {
    try {
      return this.redisService.smembers(`${this.ROOM_PREFIX}${room}`);
    } catch (err) {
      this.logger.error(`Error getting sockets in room: ${err.message}`);
      return [];
    }
  }

  async getRoomMetadata(room: string): Promise<any> {
    try {
      if (room.startsWith('vehicle_')) {
        const vehicleId = room.substring('vehicle_'.length);
        return this.getVehicleRoomMetadata(vehicleId);
      } else if (room.startsWith('fleet_')) {
        const fleetId = room.substring('fleet_'.length);
        return this.getFleetRoomMetadata(fleetId);
      } else {
        return this.redisService.get(`${this.ROOM_PREFIX}${room}:metadata`);
      }
    } catch (err) {
      this.logger.error(`Error getting room metadata: ${err.message}`);
      return null;
    }
  }

  async getUserIdForSocket(socketId: string): Promise<string | null> {
    try {
      const connectionData = await this.redisService.get(`ws:connection:${socketId}`);
      return connectionData?.userId || null;
    } catch (err) {
      this.logger.error(`Error getting user ID for socket: ${err.message}`);
      return null;
    }
  }

  async getSocketIdsForUser(userId: string): Promise<string[]> {
    try {
      const connectionKeys = await this.redisService.keys(`ws:connection:*`);
      const connections = await this.redisService.mget(connectionKeys);

      return connections
        .filter(conn => conn?.userId === userId)
        .map((_, index) => connectionKeys[index].split(':')[2]);
    } catch (err) {
      this.logger.error(`Error getting socket IDs for user: ${err.message}`);
      return [];
    }
  }

  async cleanupUserSockets(userId: string): Promise<void> {
    try {
      const socketIds = await this.getSocketIdsForUser(userId);
      const rooms = await this.getRoomsForUser(userId);

      // Remove from all rooms
      for (const room of rooms) {
        for (const socketId of socketIds) {
          await this.removeUserFromRoom(userId, room, socketId);
        }
      }

      // Remove connection data
      for (const socketId of socketIds) {
        await this.redisService.del(`ws:connection:${socketId}`);
      }

      // Remove user's rooms set
      await this.redisService.del(`${this.USER_ROOMS_PREFIX}${userId}`);

      this.logger.log(`Cleaned up ${socketIds.length} sockets for user ${userId}`);
    } catch (err) {
      this.logger.error(`Error cleaning up user sockets: ${err.message}`);
    }
  }

  private async storeVehicleRoomMetadata(vehicleId: string, room: string): Promise<void> {
    try {
      const profile = await this.vehicleProfileService.getBasicProfile(vehicleId);
      if (!profile) return;

      const metadata = {
        vehicleId,
        vin: profile.vin,
        licensePlate: profile.licensePlate,
        make: profile.manufacturer?.name,
        model: profile.model?.name,
        year: profile.year,
        fleetId: profile.fleetId,
        createdAt: new Date().toISOString(),
      };

      await this.redisService.set(
        `${this.ROOM_PREFIX}${room}:metadata`,
        metadata,
        86400, // 24 hours
      );
    } catch (err) {
      this.logger.error(`Error storing vehicle room metadata: ${err.message}`);
    }
  }

  private async removeVehicleRoomMetadata(vehicleId: string, room: string): Promise<void> {
    try {
      await this.redisService.del(`${this.ROOM_PREFIX}${room}:metadata`);
    } catch (err) {
      this.logger.error(`Error removing vehicle room metadata: ${err.message}`);
    }
  }

  private async getVehicleRoomMetadata(vehicleId: string): Promise<any> {
    try {
      const room = `vehicle_${vehicleId}`;
      const metadata = await this.redisService.get(`${this.ROOM_PREFIX}${room}:metadata`);

      if (metadata) {
        return metadata;
      }

      // If not in cache, get from database and store
      const profile = await this.vehicleProfileService.getBasicProfile(vehicleId);
      if (!profile) return null;

      const newMetadata = {
        vehicleId,
        vin: profile.vin,
        licensePlate: profile.licensePlate,
        make: profile.manufacturer?.name,
        model: profile.model?.name,
        year: profile.year,
        fleetId: profile.fleetId,
        createdAt: new Date().toISOString(),
      };

      await this.redisService.set(
        `${this.ROOM_PREFIX}${room}:metadata`,
        newMetadata,
        86400,
      );

      return newMetadata;
    } catch (err) {
      this.logger.error(`Error getting vehicle room metadata: ${err.message}`);
      return null;
    }
  }

  private async storeFleetRoomMetadata(fleetId: string, room: string): Promise<void> {
    try {
      const fleet = await this.vehicleProfileService.getFleetInfo(fleetId);
      if (!fleet) return;

      const metadata = {
        fleetId,
        name: fleet.name,
        description: fleet.description,
        vehicleCount: fleet.vehicleCount,
        createdAt: new Date().toISOString(),
      };

      await this.redisService.set(
        `${this.ROOM_PREFIX}${room}:metadata`,
        metadata,
        86400,
      );
    } catch (err) {
      this.logger.error(`Error storing fleet room metadata: ${err.message}`);
    }
  }

  private async removeFleetRoomMetadata(fleetId: string, room: string): Promise<void> {
    try {
      await this.redisService.del(`${this.ROOM_PREFIX}${room}:metadata`);
    } catch (err) {
      this.logger.error(`Error removing fleet room metadata: ${err.message}`);
    }
  }

  private async getFleetRoomMetadata(fleetId: string): Promise<any> {
    try {
      const room = `fleet_${fleetId}`;
      const metadata = await this.redisService.get(`${this.ROOM_PREFIX}${room}:metadata`);

      if (metadata) {
        return metadata;
      }

      // If not in cache, get from database and store
      const fleet = await this.vehicleProfileService.getFleetInfo(fleetId);
      if (!fleet) return null;

      const newMetadata = {
        fleetId,
        name: fleet.name,
        description: fleet.description,
        vehicleCount: fleet.vehicleCount,
        createdAt: new Date().toISOString(),
      };

      await this.redisService.set(
        `${this.ROOM_PREFIX}${room}:metadata`,
        newMetadata,
        86400,
      );

      return newMetadata;
    } catch (err) {
      this.logger.error(`Error getting fleet room metadata: ${err.message}`);
      return null;
    }
  }

  async broadcastToRoom(room: string, event: string, data: any): Promise<void> {
    try {
      const socketIds = await this.getSocketsInRoom(room);
      if (socketIds.length === 0) return;

      this.webSocketService.emitToRoom(room, event, data);
      this.logger.debug(`Broadcasted ${event} to ${socketIds.length} sockets in room ${room}`);
    } catch (err) {
      this.logger.error(`Error broadcasting to room: ${err.message}`);
    }
  }

  async broadcastToUser(userId: string, event: string, data: any): Promise<void> {
    try {
      const socketIds = await this.getSocketIdsForUser(userId);
      if (socketIds.length === 0) return;

      this.webSocketService.emitToUser(userId, event, data);
      this.logger.debug(`Broadcasted ${event} to ${socketIds.length} sockets for user ${userId}`);
    } catch (err) {
      this.logger.error(`Error broadcasting to user: ${err.message}`);
    }
  }

  async getRoomStatistics(): Promise<{
    totalRooms: number;
    totalUsers: number;
    roomsByType: Record<string, number>;
    usersPerRoom: Record<string, number>;
  }> {
    try {
      const roomKeys = await this.redisService.keys(`${this.ROOM_PREFIX}*`);
      const rooms = roomKeys
        .filter(key => !key.includes(':metadata'))
        .map(key => key.substring(this.ROOM_PREFIX.length));

      const usersPerRoom: Record<string, number> = {};
      const roomsByType: Record<string, number> = {
        vehicle: 0,
        fleet: 0,
        user: 0,
        other: 0,
      };

      let totalUsers = 0;

      for (const room of rooms) {
        const userCount = await this.getUsersInRoom(room);
        usersPerRoom[room] = userCount.length;
        totalUsers += userCount.length;

        if (room.startsWith('vehicle_')) {
          roomsByType.vehicle++;
        } else if (room.startsWith('fleet_')) {
          roomsByType.fleet++;
        } else if (room.startsWith('user_')) {
          roomsByType.user++;
        } else {
          roomsByType.other++;
        }
      }

      return {
        totalRooms: rooms.length,
        totalUsers,
        roomsByType,
        usersPerRoom,
      };
    } catch (err) {
      this.logger.error(`Error getting room statistics: ${err.message}`);
      return {
        totalRooms: 0,
        totalUsers: 0,
        roomsByType: {},
        usersPerRoom: {},
      };
    }
  }

  async getActiveRooms(limit: number = 100): Promise<Array<{
    room: string;
    userCount: number;
    socketCount: number;
    metadata?: any;
  }>> {
    try {
      const roomKeys = await this.redisService.keys(`${this.ROOM_PREFIX}*`);
      const rooms = roomKeys
        .filter(key => !key.includes(':metadata'))
        .map(key => key.substring(this.ROOM_PREFIX.length));

      const activeRooms = await Promise.all(
        rooms.map(async room => {
          const userCount = (await this.getUsersInRoom(room)).length;
          const socketCount = (await this.getSocketsInRoom(room)).length;
          const metadata = await this.getRoomMetadata(room);

          return {
            room,
            userCount,
            socketCount,
            metadata,
          };
        }),
      );

      return activeRooms
        .filter(room => room.socketCount > 0)
        .sort((a, b) => b.userCount - a.userCount)
        .slice(0, limit);
    } catch (err) {
      this.logger.error(`Error getting active rooms: ${err.message}`);
      return [];
    }
  }

  async cleanupInactiveRooms(): Promise<{
    cleanedRooms: number;
    cleanedSockets: number;
  }> {
    try {
      const roomKeys = await this.redisService.keys(`${this.ROOM_PREFIX}*`);
      const rooms = roomKeys
        .filter(key => !key.includes(':metadata'))
        .map(key => key.substring(this.ROOM_PREFIX.length));

      let cleanedRooms = 0;
      let cleanedSockets = 0;

      for (const room of rooms) {
        const sockets = await this.getSocketsInRoom(room);
        if (sockets.length === 0) {
          // Room is empty, clean up
          await this.redisService.del(`${this.ROOM_PREFIX}${room}`);

          if (room.startsWith('vehicle_')) {
            const vehicleId = room.substring('vehicle_'.length);
            await this.removeVehicleRoomMetadata(vehicleId, room);
          } else if (room.startsWith('fleet_')) {
            const fleetId = room.substring('fleet_'.length);
            await this.removeFleetRoomMetadata(fleetId, room);
          } else {
            await this.redisService.del(`${this.ROOM_PREFIX}${room}:metadata`);
          }

          cleanedRooms++;
        } else {
          // Check for stale sockets
          const staleSockets = await this.findStaleSockets(sockets);
          if (staleSockets.length > 0) {
            for (const socketId of staleSockets) {
              const userId = await this.getUserIdForSocket(socketId);
              if (userId) {
                await this.removeUserFromRoom(userId, room, socketId);
                cleanedSockets++;
              }
            }
          }
        }
      }

      this.logger.log(`Cleaned up ${cleanedRooms} inactive rooms and ${cleanedSockets} stale sockets`);
      return { cleanedRooms, cleanedSockets };
    } catch (err) {
      this.logger.error(`Error cleaning up inactive rooms: ${err.message}`);
      return { cleanedRooms: 0, cleanedSockets: 0 };
    }
  }

  private async findStaleSockets(socketIds: string[]): Promise<string[]> {
    try {
      const connectionKeys = socketIds.map(id => `ws:connection:${id}`);
      const connections = await this.redisService.mget(connectionKeys);

      return connections
        .map((conn, index) => ({ conn, socketId: socketIds[index] }))
        .filter(({ conn }) => !conn)
        .map(({ socketId }) => socketId);
    } catch (err) {
      this.logger.error(`Error finding stale sockets: ${err.message}`);
      return [];
    }
  }
}
```

### Reconnection Logic

```typescript
// reconnection.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';
import { WebSocketService } from '../websocket/websocket.service';
import { RoomService } from './room.service';

@Injectable()
export class ReconnectionService {
  private readonly logger = new Logger(ReconnectionService.name);
  private readonly RECONNECTION_PREFIX = 'ws:reconnection:';
  private readonly RECONNECTION_EXPIRY = 3600; // 1 hour

  constructor(
    private readonly redisService: RedisService,
    private readonly webSocketService: WebSocketService,
    private readonly roomService: RoomService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleReconnectionCleanup() {
    try {
      this.logger.debug('Running reconnection cleanup');
      await this.cleanupExpiredReconnectionAttempts();
    } catch (err) {
      this.logger.error(`Error during reconnection cleanup: ${err.message}`);
    }
  }

  async registerReconnectionAttempt(userId: string, socketId: string): Promise<string> {
    try {
      const reconnectionId = this.generateReconnectionId(userId, socketId);
      const reconnectionData = {
        userId,
        socketId,
        timestamp: new Date().toISOString(),
        rooms: await this.roomService.getRoomsForUser(userId),
      };

      await this.redisService.set(
        `${this.RECONNECTION_PREFIX}${reconnectionId}`,
        reconnectionData,
        this.RECONNECTION_EXPIRY,
      );

      this.logger.debug(`Registered reconnection attempt for user ${userId} with ID ${reconnectionId}`);
      return reconnectionId;
    } catch (err) {
      this.logger.error(`Error registering reconnection attempt: ${err.message}`);
      throw err;
    }
  }

  async getReconnectionData(reconnectionId: string): Promise<{
    userId: string;
    socketId: string;
    rooms: string[];
    timestamp: string;
  } | null> {
    try {
      const data = await this.redisService.get(`${this.RECONNECTION_PREFIX}${reconnectionId}`);
      if (!data) return null;

      return {
        userId: data.userId,
        socketId: data.socketId,
        rooms: data.rooms || [],
        timestamp: data.timestamp,
      };
    } catch (err) {
      this.logger.error(`Error getting reconnection data: ${err.message}`);
      return null;
    }
  }

  async restoreReconnection(reconnectionId: string, newSocketId: string): Promise<boolean> {
    try {
      const reconnectionData = await this.getReconnectionData(reconnectionId);
      if (!reconnectionData) return false;

      // Check if the original socket is still connected
      const isOriginalConnected = await this.redisService.exists(
        `ws:connection:${reconnectionData.socketId}`,
      );

      if (isOriginalConnected) {
        this.logger.warn(`Original socket ${reconnectionData.socketId} is still connected`);
        return false;
      }

      // Restore user's rooms
      for (const room of reconnectionData.rooms) {
        await this.roomService.addUserToRoom(
          reconnectionData.userId,
          room,
          newSocketId,
        );
      }

      // Update connection data
      await this.redisService.set(
        `ws:connection:${newSocketId}`,
        {
          userId: reconnectionData.userId,
          connectedAt: new Date().toISOString(),
          ip: 'reconnected', // Would need to get actual IP from new connection
          userAgent: 'reconnected',
        },
        86400,
      );

      // Clean up reconnection data
      await this.redisService.del(`${this.RECONNECTION_PREFIX}${reconnectionId}`);

      this.logger.log(`Restored reconnection for user ${reconnectionData.userId} with new socket ${newSocketId}`);
      return true;
    } catch (err) {
      this.logger.error(`Error restoring reconnection: ${err.message}`);
      return false;
    }
  }

  async cleanupExpiredReconnectionAttempts(): Promise<number> {
    try {
      const reconnectionKeys = await this.redisService.keys(`${this.RECONNECTION_PREFIX}*`);
      if (reconnectionKeys.length === 0) return 0;

      const now = new Date();
      let cleanedCount = 0;

      for (const key of reconnectionKeys) {
        const reconnectionData = await this.redisService.get(key);
        if (!reconnectionData) continue;

        const timestamp = new Date(reconnectionData.timestamp);
        const ageInSeconds = (now.getTime() - timestamp.getTime()) / 1000;

        if (ageInSeconds > this.RECONNECTION_EXPIRY) {
          await this.redisService.del(key);
          cleanedCount++;
        }
      }

      this.logger.log(`Cleaned up ${cleanedCount} expired reconnection attempts`);
      return cleanedCount;
    } catch (err) {
      this.logger.error(`Error cleaning up expired reconnection attempts: ${err.message}`);
      return 0;
    }
  }

  private generateReconnectionId(userId: string, socketId: string): string {
    return `${userId}:${socketId}:${Date.now()}`;
  }

  async getActiveReconnectionAttempts(): Promise<Array<{
    reconnectionId: string;
    userId: string;
    socketId: string;
    timestamp: string;
    ageInSeconds: number;
    rooms: string[];
  }>> {
    try {
      const reconnectionKeys = await this.redisService.keys(`${this.RECONNECTION_PREFIX}*`);
      if (reconnectionKeys.length === 0) return [];

      const now = new Date();
      const reconnectionAttempts = await Promise.all(
        reconnectionKeys.map(async key => {
          const reconnectionData = await this.redisService.get(key);
          if (!reconnectionData) return null;

          const timestamp = new Date(reconnectionData.timestamp);
          const ageInSeconds = (now.getTime() - timestamp.getTime()) / 1000;

          return {
            reconnectionId: key.substring(this.RECONNECTION_PREFIX.length),
            userId: reconnectionData.userId,
            socketId: reconnectionData.socketId,
            timestamp: reconnectionData.timestamp,
            ageInSeconds,
            rooms: reconnectionData.rooms || [],
          };
        }),
      );

      return reconnectionAttempts.filter(attempt => attempt !== null);
    } catch (err) {
      this.logger.error(`Error getting active reconnection attempts: ${err.message}`);
      return [];
    }
  }

  async forceReconnectUser(userId: string): Promise<boolean> {
    try {
      const socketIds = await this.roomService.getSocketIdsForUser(userId);
      if (socketIds.length === 0) return false;

      // Notify all sockets to reconnect
      this.webSocketService.emitToUser(userId, 'force_reconnect', {
        message: 'Server is requesting a reconnection',
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Forced reconnect for user ${userId} with ${socketIds.length} sockets`);
      return true;
    } catch (err) {
      this.logger.error(`Error forcing reconnect for user: ${err.message}`);
      return false;
    }
  }

  async handleServerRestart(): Promise<void> {
    try {
      this.logger.log('Handling server restart - notifying all connected clients');

      // Notify all connected clients to reconnect
      const activeRooms = await this.roomService.getActiveRooms();
      for (const room of activeRooms) {
        this.webSocketService.emitToRoom(room.room, 'server_restart', {
          message: 'Server is restarting, please reconnect',
          timestamp: new Date().toISOString(),
          reconnectionDelay: 30000, // 30 seconds
        });
      }

      // Give clients time to reconnect before cleaning up
      setTimeout(async () => {
        this.logger.log('Cleaning up after server restart');
        await this.roomService.cleanupInactiveRooms();
      }, 60000); // 1 minute
    } catch (err) {
      this.logger.error(`Error handling server restart: ${err.message}`);
    }
  }

  async getReconnectionStatistics(): Promise<{
    totalAttempts: number;
    successfulReconnections: number;
    failedReconnections: number;
    averageReconnectionTime: number;
  }> {
    try {
      const reconnectionKeys = await this.redisService.keys(`${this.RECONNECTION_PREFIX}*`);
      const reconnectionData = await this.redisService.mget(reconnectionKeys);

      let successful = 0;
      let failed = 0;
      let totalTime = 0;

      for (const data of reconnectionData) {
        if (!data) continue;

        if (data.restored) {
          successful++;
          totalTime += data.reconnectionTime || 0;
        } else {
          failed++;
        }
      }

      return {
        totalAttempts: reconnectionKeys.length,
        successfulReconnections: successful,
        failedReconnections: failed,
        averageReconnectionTime: successful > 0 ? totalTime / successful : 0,
      };
    } catch (err) {
      this.logger.error(`Error getting reconnection statistics: ${err.message}`);
      return {
        totalAttempts: 0,
        successfulReconnections: 0,
        failedReconnections: 0,
        averageReconnectionTime: 0,
      };
    }
  }
}

// reconnection.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ReconnectionService } from './reconnection.service';

@Injectable()
export class ReconnectionMiddleware implements NestMiddleware {
  constructor(private readonly reconnectionService: ReconnectionService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Check for reconnection ID in headers
    const reconnectionId = req.headers['x-reconnection-id'] as string;

    if (reconnectionId) {
      this.handleReconnection(reconnectionId, req, res, next);
    } else {
      next();
    }
  }

  private async handleReconnection(
    reconnectionId: string,
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const reconnectionData = await this.reconnectionService.getReconnectionData(reconnectionId);
      if (!reconnectionData) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Invalid reconnection ID',
        });
      }

      // Check if the user is already connected with a different socket
      const existingSockets = await this.reconnectionService.roomService.getSocketIdsForUser(
        reconnectionData.userId,
      );

      if (existingSockets.length > 0) {
        return res.status(409).json({
          statusCode: 409,
          message: 'User is already connected with another session',
          reconnectionId: await this.reconnectionService.registerReconnectionAttempt(
            reconnectionData.userId,
            req.socket.id,
          ),
        });
      }

      // Restore the reconnection
      const success = await this.reconnectionService.restoreReconnection(
        reconnectionId,
        req.socket.id,
      );

      if (!success) {
        return res.status(500).json({
          statusCode: 500,
          message: 'Failed to restore reconnection',
        });
      }

      // Add reconnection info to request
      req.reconnection = {
        reconnectionId,
        userId: reconnectionData.userId,
        restored: true,
      };

      next();
    } catch (err) {
      next(err);
    }
  }
}

// reconnection.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ReconnectionService } from './reconnection.service';

@Injectable()
export class ReconnectionInterceptor implements NestInterceptor {
  constructor(private readonly reconnectionService: ReconnectionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // If this is a reconnection, we don't need to do anything special
    if (request.reconnection?.restored) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => this.handleResponse(context),
        error: () => this.handleResponse(context),
      }),
    );
  }

  private handleResponse(context: ExecutionContext): void {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Check if this is a WebSocket upgrade request
    if (request.headers.upgrade === 'websocket') {
      // For WebSocket connections, register reconnection attempt
      if (request.user?.id) {
        this.reconnectionService.registerReconnectionAttempt(
          request.user.id,
          request.socket.id,
        ).then(reconnectionId => {
          response.setHeader('X-Reconnection-ID', reconnectionId);
        });
      }
    }
  }
}
```

---

## AI/ML Capabilities (250+ lines)

### Predictive Model Training

```python
# model_training.py
import os
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
from sklearn.model_selection import GridSearchCV
import joblib
import psycopg2
from psycopg2 import sql
from psycopg2.extras import DictCursor
import boto3
from io import BytesIO
import logging
from typing import Tuple, Dict, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class VehiclePredictiveModelTrainer:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'vehicle_profiles'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'postgres'),
            'port': os.getenv('DB_PORT', '5432')
        }

        self.s3_config = {
            'bucket': os.getenv('S3_BUCKET', 'vehicle-profiles-models'),
            'region': os.getenv('AWS_REGION', 'us-east-1'),
            'access_key': os.getenv('AWS_ACCESS_KEY_ID'),
            'secret_key': os.getenv('AWS_SECRET_ACCESS_KEY')
        }

        self.model_config = {
            'maintenance': {
                'target': 'days_until_next_maintenance',
                'features': [
                    'vehicle_age', 'mileage', 'engine_hours',
                    'fuel_consumption', 'last_maintenance_mileage',
                    'last_maintenance_age', 'manufacturer_id',
                    'model_id', 'vehicle_type_id', 'fuel_type',
                    'transmission_type', 'avg_engine_load',
                    'avg_engine_temp', 'avg_battery_voltage',
                    'num_previous_maintenance', 'days_since_last_maintenance',
                    'maintenance_type'
                ],
                'categorical_features': [
                    'manufacturer_id', 'model_id', 'vehicle_type_id',
                    'fuel_type', 'transmission_type', 'maintenance_type'
                ],
                'numeric_features': [
                    'vehicle_age', 'mileage', 'engine_hours',
                    'fuel_consumption', 'last_maintenance_mileage',
                    'last_maintenance_age', 'avg_engine_load',
                    'avg_engine_temp', 'avg_battery_voltage',
                    'num_previous_maintenance', 'days_since_last_maintenance'
                ],
                'test_size': 0.2,
                'random_state': 42,
                'model_type': 'gradient_boosting',
                'model_params': {
                    'n_estimators': [100, 200, 300],
                    'learning_rate': [0.01, 0.05, 0.1],
                    'max_depth': [3, 5, 7],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4]
                }
            },
            'fuel_efficiency': {
                'target': 'fuel_efficiency',
                'features': [
                    'vehicle_age', 'mileage', 'engine_hours',
                    'avg_speed', 'avg_engine_load', 'avg_engine_temp',
                    'avg_battery_voltage', 'tire_pressure_avg',
                    'manufacturer_id', 'model_id