# TO_BE_DESIGN.md - Maintenance Scheduling Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Author:** Enterprise Architecture Team

---

## Executive Vision (120+ lines)

### Strategic Vision for Next-Gen Maintenance Scheduling

The enhanced maintenance-scheduling module represents a paradigm shift in how organizations approach asset lifecycle management. This isn't merely an incremental upgrade - it's a complete reimagining of maintenance operations designed to deliver:

**1. Digital Transformation of Maintenance Culture**
We're moving from reactive "firefighting" to predictive "fire prevention" through:
- AI-driven failure prediction that reduces unplanned downtime by 70%+
- Real-time collaboration tools that break down silos between operations and maintenance
- Mobile-first design that brings maintenance intelligence to the shop floor

**2. Business Model Innovation**
The system enables new revenue streams through:
- Maintenance-as-a-Service offerings for equipment manufacturers
- Predictive maintenance subscriptions for customers
- Performance-based contracting models
- Data monetization through anonymized benchmarking services

**3. Operational Excellence Framework**
Core operational improvements include:
- 50% reduction in mean time to repair (MTTR)
- 30% increase in first-time fix rates
- 25% extension of asset lifespan
- 40% reduction in spare parts inventory costs

**4. User Experience Revolution**
We're transforming maintenance from a "necessary evil" to an engaging experience:
- Gamified maintenance workflows that improve technician engagement
- Augmented reality overlays for complex repairs
- Voice-enabled work order creation
- Context-aware recommendations

**5. Competitive Differentiation**
Key differentiators in the marketplace:
- Industry-first maintenance confidence scoring system
- Predictive maintenance accuracy >95%
- Real-time OEE (Overall Equipment Effectiveness) integration
- Carbon footprint tracking for maintenance activities

### Long-Term Roadmap (2023-2028)

**Phase 1: Foundation (2023)**
- Core predictive maintenance engine
- Real-time collaboration platform
- Mobile PWA with offline capabilities
- Basic gamification elements

**Phase 2: Expansion (2024)**
- AR maintenance guidance
- Advanced analytics dashboard
- API ecosystem for third-party integrations
- Carbon tracking module

**Phase 3: Transformation (2025)**
- Autonomous maintenance scheduling
- Digital twin integration
- Blockchain for maintenance records
- AI-powered root cause analysis

**Phase 4: Ecosystem (2026-2028)**
- Maintenance marketplace
- Predictive maintenance as a service
- Industry benchmarking platform
- Autonomous maintenance robots integration

### Business Transformation Goals

**Financial Impact:**
- $12M annual savings from reduced downtime (Year 1)
- $8M annual revenue from new service offerings (Year 2)
- 30% reduction in maintenance labor costs
- 25% decrease in spare parts inventory

**Operational Impact:**
- 90% reduction in paper-based work orders
- 75% faster work order completion
- 60% improvement in PM compliance
- 50% reduction in emergency work orders

**Customer Experience:**
- 40% increase in customer satisfaction scores
- 35% reduction in customer-reported issues
- 50% faster response times
- Personalized maintenance portals

**Employee Experience:**
- 45% increase in technician productivity
- 60% reduction in administrative tasks
- 30% improvement in job satisfaction
- 50% faster onboarding for new technicians

### Technology Vision

**Architecture Principles:**
1. **Cloud-Native First:** Designed for AWS with multi-cloud portability
2. **Event-Driven:** Real-time processing of maintenance events
3. **Microservices:** Independent scaling of components
4. **API-First:** Comprehensive REST and GraphQL interfaces
5. **Data-Centric:** Unified data model across all modules

**Key Technology Stack:**
- **Frontend:** React 18 with TypeScript, Redux Toolkit, Material-UI
- **Backend:** Node.js with NestJS, Express
- **Database:** PostgreSQL (OLTP), TimescaleDB (time-series), Redis (caching)
- **AI/ML:** Python with PyTorch, TensorFlow, scikit-learn
- **Real-Time:** WebSocket with Socket.io
- **Search:** ElasticSearch
- **DevOps:** Kubernetes, Docker, Terraform, GitHub Actions
- **Monitoring:** Prometheus, Grafana, ELK Stack

**Innovation Enablers:**
- Digital twin integration for virtual equipment simulation
- Blockchain for immutable maintenance records
- Computer vision for automated inspection
- Natural language processing for work order creation
- Edge computing for remote asset monitoring

### Change Management Strategy

**Stakeholder Engagement:**
- Executive sponsorship program
- Super user network
- Change champion certification
- Departmental adoption metrics

**Training Program:**
- Microlearning modules (5-10 min)
- Virtual reality training simulations
- Certification tracks for different roles
- Continuous learning pathways

**Communication Plan:**
- Monthly transformation newsletters
- Quarterly town halls
- Department-specific roadshows
- Gamified progress tracking

**Adoption Metrics:**
- System login frequency
- Feature utilization rates
- Work order completion times
- User satisfaction scores
- Business outcome tracking

---

## Performance Enhancements (300+ lines)

### Redis Caching Layer Implementation

```typescript
// src/cache/redis-cache.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Logger } from '@nestjs/common';
import { promisify } from 'util';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis;
  private getAsync: (key: string) => Promise<string | null>;
  private setexAsync: (key: string, seconds: number, value: string) => Promise<'OK'>;

  constructor(private configService: ConfigService) {
    this.initializeRedisClient();
  }

  private initializeRedisClient() {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      db: this.configService.get<number>('REDIS_DB', 0),
      tls: this.configService.get<boolean>('REDIS_TLS', false) ? {} : null,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(`Redis connection retry attempt ${times}, next in ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        this.logger.error(`Redis reconnection error: ${err.message}`);
        return true;
      },
    };

    this.client = new Redis(redisConfig);

    this.client.on('connect', () => {
      this.logger.log('Redis client connected successfully');
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('reconnecting', () => {
      this.logger.log('Redis client reconnecting...');
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setexAsync = promisify(this.client.setex).bind(this.client);
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.logger.log('Redis connection verified');
    } catch (err) {
      this.logger.error('Failed to verify Redis connection', err);
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
      this.logger.log('Redis client disconnected gracefully');
    } catch (err) {
      this.logger.error('Error disconnecting Redis client', err);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.getAsync(key);
      return result ? JSON.parse(result) : null;
    } catch (err) {
      this.logger.error(`Error getting value from Redis for key ${key}: ${err.message}`);
      throw err;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await this.setexAsync(key, ttlSeconds, stringValue);
    } catch (err) {
      this.logger.error(`Error setting value in Redis for key ${key}: ${err.message}`);
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`Error deleting key ${key} from Redis: ${err.message}`);
      throw err;
    }
  }

  async getWithCacheFallback<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    try {
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        this.logger.debug(`Cache hit for key ${key}`);
        return cachedValue;
      }

      this.logger.debug(`Cache miss for key ${key}, executing fallback`);
      const freshValue = await fallbackFn();
      await this.set(key, freshValue, ttlSeconds);
      return freshValue;
    } catch (err) {
      this.logger.error(`Error in getWithCacheFallback for key ${key}: ${err.message}`);
      // Fallback to direct execution if cache fails
      return fallbackFn();
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.log(`Invalidated ${keys.length} keys matching pattern ${pattern}`);
      }
    } catch (err) {
      this.logger.error(`Error invalidating pattern ${pattern}: ${err.message}`);
      throw err;
    }
  }

  async cacheWorkOrderDetails(workOrderId: string, details: any): Promise<void> {
    const key = `workorder:${workOrderId}:details`;
    const ttl = 3600; // 1 hour cache for work order details
    await this.set(key, details, ttl);
  }

  async getCachedWorkOrderDetails(workOrderId: string): Promise<any | null> {
    const key = `workorder:${workOrderId}:details`;
    return this.get(key);
  }

  async cacheTechnicianSchedule(technicianId: string, schedule: any): Promise<void> {
    const key = `technician:${technicianId}:schedule`;
    const ttl = 1800; // 30 minute cache for technician schedules
    await this.set(key, schedule, ttl);
  }

  async getCachedTechnicianSchedule(technicianId: string): Promise<any | null> {
    const key = `technician:${technicianId}:schedule`;
    return this.get(key);
  }

  async cacheEquipmentMaintenanceHistory(equipmentId: string, history: any): Promise<void> {
    const key = `equipment:${equipmentId}:history`;
    const ttl = 7200; // 2 hour cache for equipment history
    await this.set(key, history, ttl);
  }

  async getCachedEquipmentMaintenanceHistory(equipmentId: string): Promise<any | null> {
    const key = `equipment:${equipmentId}:history`;
    return this.get(key);
  }

  async getCacheStats(): Promise<{ keys: number; memory: string }> {
    try {
      const keys = await this.client.dbsize();
      const memory = await this.client.info('memory');
      const usedMemory = memory.split('\n').find(line => line.startsWith('used_memory:'))?.split(':')[1] || '0';

      return {
        keys: Number(keys),
        memory: usedMemory.trim()
      };
    } catch (err) {
      this.logger.error(`Error getting cache stats: ${err.message}`);
      throw err;
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
import { WorkOrder } from '../work-orders/work-order.entity';
import { Technician } from '../technicians/technician.entity';
import { Equipment } from '../equipment/equipment.entity';
import { MaintenanceTask } from '../tasks/maintenance-task.entity';
import { Priority, WorkOrderStatus } from '../common/enums';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Between, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);

  constructor(
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(Technician)
    private technicianRepository: Repository<Technician>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    @InjectRepository(MaintenanceTask)
    private taskRepository: Repository<MaintenanceTask>,
  ) {}

  async getOptimizedWorkOrderList(
    pagination: PaginationDto,
    filters: {
      status?: WorkOrderStatus[];
      priority?: Priority[];
      technicianId?: string;
      equipmentId?: string;
      dueDateFrom?: Date;
      dueDateTo?: Date;
      createdAfter?: Date;
      search?: string;
    }
  ): Promise<{ data: WorkOrder[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.workOrderRepository
      .createQueryBuilder('wo')
      .leftJoinAndSelect('wo.technician', 'technician')
      .leftJoinAndSelect('wo.equipment', 'equipment')
      .leftJoinAndSelect('wo.tasks', 'tasks')
      .leftJoinAndSelect('tasks.assignedTechnician', 'taskTechnician')
      .leftJoinAndSelect('wo.parts', 'parts')
      .leftJoinAndSelect('parts.part', 'part')
      .select([
        'wo.id',
        'wo.workOrderNumber',
        'wo.title',
        'wo.description',
        'wo.status',
        'wo.priority',
        'wo.dueDate',
        'wo.createdAt',
        'wo.updatedAt',
        'wo.scheduledStartTime',
        'wo.scheduledEndTime',
        'wo.actualStartTime',
        'wo.actualEndTime',
        'wo.estimatedDuration',
        'wo.actualDuration',
        'technician.id',
        'technician.firstName',
        'technician.lastName',
        'technician.employeeId',
        'equipment.id',
        'equipment.name',
        'equipment.equipmentNumber',
        'equipment.location',
        'tasks.id',
        'tasks.title',
        'tasks.status',
        'tasks.estimatedDuration',
        'tasks.actualDuration',
        'taskTechnician.id',
        'taskTechnician.firstName',
        'taskTechnician.lastName',
        'parts.id',
        'parts.quantity',
        'parts.status',
        'part.id',
        'part.name',
        'part.partNumber',
        'part.cost',
      ])
      .where('1=1');

    // Apply filters with optimized conditions
    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('wo.status IN (:...status)', { status: filters.status });
    }

    if (filters.priority && filters.priority.length > 0) {
      queryBuilder.andWhere('wo.priority IN (:...priority)', { priority: filters.priority });
    }

    if (filters.technicianId) {
      queryBuilder.andWhere('wo.technicianId = :technicianId', { technicianId: filters.technicianId });
    }

    if (filters.equipmentId) {
      queryBuilder.andWhere('wo.equipmentId = :equipmentId', { equipmentId: filters.equipmentId });
    }

    if (filters.dueDateFrom && filters.dueDateTo) {
      queryBuilder.andWhere('wo.dueDate BETWEEN :dueDateFrom AND :dueDateTo', {
        dueDateFrom: filters.dueDateFrom,
        dueDateTo: filters.dueDateTo,
      });
    } else if (filters.dueDateFrom) {
      queryBuilder.andWhere('wo.dueDate >= :dueDateFrom', { dueDateFrom: filters.dueDateFrom });
    } else if (filters.dueDateTo) {
      queryBuilder.andWhere('wo.dueDate <= :dueDateTo', { dueDateTo: filters.dueDateTo });
    }

    if (filters.createdAfter) {
      queryBuilder.andWhere('wo.createdAt >= :createdAfter', { createdAfter: filters.createdAfter });
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('wo.title ILIKE :search', { search: searchTerm })
            .orWhere('wo.description ILIKE :search', { search: searchTerm })
            .orWhere('wo.workOrderNumber ILIKE :search', { search: searchTerm })
            .orWhere('equipment.name ILIKE :search', { search: searchTerm })
            .orWhere('equipment.equipmentNumber ILIKE :search', { search: searchTerm })
            .orWhere('technician.firstName ILIKE :search', { search: searchTerm })
            .orWhere('technician.lastName ILIKE :search', { search: searchTerm })
            .orWhere('technician.employeeId ILIKE :search', { search: searchTerm });
        })
      );
    }

    // Add optimized sorting - default to due date ascending
    queryBuilder.orderBy('wo.dueDate', 'ASC');

    // Get total count for pagination
    const [data, total] = await Promise.all([
      queryBuilder.skip(skip).take(limit).getMany(),
      queryBuilder.getCount(),
    ]);

    this.logger.debug(`Optimized work order query executed with ${total} results`);

    return { data, total };
  }

  async getTechnicianScheduleOptimized(
    technicianId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{
    workOrders: WorkOrder[];
    totalWorkOrders: number;
    totalHoursScheduled: number;
    utilization: number;
  }> {
    const { start, end } = dateRange;

    const queryBuilder = this.workOrderRepository
      .createQueryBuilder('wo')
      .leftJoinAndSelect('wo.equipment', 'equipment')
      .leftJoinAndSelect('wo.tasks', 'tasks')
      .where('wo.technicianId = :technicianId', { technicianId })
      .andWhere(
        new Brackets(qb => {
          qb.where('wo.scheduledStartTime BETWEEN :start AND :end', { start, end })
            .orWhere('wo.scheduledEndTime BETWEEN :start AND :end', { start, end })
            .orWhere(':start BETWEEN wo.scheduledStartTime AND wo.scheduledEndTime', { start })
            .orWhere(':end BETWEEN wo.scheduledStartTime AND wo.scheduledEndTime', { end });
        })
      )
      .andWhere('wo.status IN (:...statuses)', {
        statuses: [
          WorkOrderStatus.SCHEDULED,
          WorkOrderStatus.IN_PROGRESS,
          WorkOrderStatus.PENDING_APPROVAL,
        ],
      })
      .orderBy('wo.scheduledStartTime', 'ASC');

    const workOrders = await queryBuilder.getMany();
    const totalWorkOrders = workOrders.length;

    // Calculate total scheduled hours
    const totalHoursScheduled = workOrders.reduce((sum, wo) => {
      if (wo.scheduledStartTime && wo.scheduledEndTime) {
        const durationMs = wo.scheduledEndTime.getTime() - wo.scheduledStartTime.getTime();
        return sum + durationMs / (1000 * 60 * 60);
      }
      return sum;
    }, 0);

    // Calculate utilization (assuming 8-hour workday)
    const totalAvailableHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const utilization = totalAvailableHours > 0 ? (totalHoursScheduled / totalAvailableHours) * 100 : 0;

    return {
      workOrders,
      totalWorkOrders,
      totalHoursScheduled,
      utilization,
    };
  }

  async getEquipmentMaintenanceHistoryOptimized(
    equipmentId: string,
    pagination: PaginationDto,
    filters: {
      status?: WorkOrderStatus[];
      priority?: Priority[];
      dateFrom?: Date;
      dateTo?: Date;
      technicianId?: string;
    }
  ): Promise<{ data: WorkOrder[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.workOrderRepository
      .createQueryBuilder('wo')
      .leftJoinAndSelect('wo.technician', 'technician')
      .leftJoinAndSelect('wo.tasks', 'tasks')
      .where('wo.equipmentId = :equipmentId', { equipmentId })
      .andWhere('wo.status IN (:...statuses)', {
        statuses: [
          WorkOrderStatus.COMPLETED,
          WorkOrderStatus.CLOSED,
          WorkOrderStatus.CANCELLED,
        ],
      });

    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('wo.status IN (:...status)', { status: filters.status });
    }

    if (filters.priority && filters.priority.length > 0) {
      queryBuilder.andWhere('wo.priority IN (:...priority)', { priority: filters.priority });
    }

    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere('wo.actualEndTime BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    } else if (filters.dateFrom) {
      queryBuilder.andWhere('wo.actualEndTime >= :dateFrom', { dateFrom: filters.dateFrom });
    } else if (filters.dateTo) {
      queryBuilder.andWhere('wo.actualEndTime <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.technicianId) {
      queryBuilder.andWhere('wo.technicianId = :technicianId', { technicianId: filters.technicianId });
    }

    // Optimized sorting - most recent first
    queryBuilder.orderBy('wo.actualEndTime', 'DESC');

    const [data, total] = await Promise.all([
      queryBuilder.skip(skip).take(limit).getMany(),
      queryBuilder.getCount(),
    ]);

    this.logger.debug(`Optimized equipment history query executed for equipment ${equipmentId}`);

    return { data, total };
  }

  async getMaintenanceDashboardStats(): Promise<{
    totalWorkOrders: number;
    openWorkOrders: number;
    overdueWorkOrders: number;
    highPriorityWorkOrders: number;
    averageCompletionTime: number;
    topTechnicians: Array<{ technicianId: string; name: string; completedCount: number }>;
    equipmentWithMostWorkOrders: Array<{ equipmentId: string; name: string; workOrderCount: number }>;
  }> {
    // Use parallel queries for better performance
    const [
      totalWorkOrders,
      openWorkOrders,
      overdueWorkOrders,
      highPriorityWorkOrders,
      completionTimes,
      topTechnicians,
      equipmentStats,
    ] = await Promise.all([
      this.workOrderRepository.count(),
      this.workOrderRepository.count({
        where: { status: In([WorkOrderStatus.OPEN, WorkOrderStatus.SCHEDULED, WorkOrderStatus.IN_PROGRESS]) },
      }),
      this.workOrderRepository.count({
        where: {
          status: In([WorkOrderStatus.OPEN, WorkOrderStatus.SCHEDULED, WorkOrderStatus.IN_PROGRESS]),
          dueDate: LessThanOrEqual(new Date()),
        },
      }),
      this.workOrderRepository.count({
        where: { priority: Priority.HIGH, status: Not(WorkOrderStatus.COMPLETED) },
      }),
      this.workOrderRepository
        .createQueryBuilder('wo')
        .select('AVG(EXTRACT(EPOCH FROM (wo.actualEndTime - wo.actualStartTime)))', 'avgCompletionTime')
        .where('wo.status = :status', { status: WorkOrderStatus.COMPLETED })
        .andWhere('wo.actualStartTime IS NOT NULL')
        .andWhere('wo.actualEndTime IS NOT NULL')
        .getRawOne(),
      this.workOrderRepository
        .createQueryBuilder('wo')
        .select(['wo.technicianId', 'technician.firstName', 'technician.lastName', 'COUNT(*) as count'])
        .leftJoin('wo.technician', 'technician')
        .where('wo.status = :status', { status: WorkOrderStatus.COMPLETED })
        .groupBy('wo.technicianId, technician.firstName, technician.lastName')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany(),
      this.workOrderRepository
        .createQueryBuilder('wo')
        .select(['wo.equipmentId', 'equipment.name', 'COUNT(*) as count'])
        .leftJoin('wo.equipment', 'equipment')
        .groupBy('wo.equipmentId, equipment.name')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany(),
    ]);

    const averageCompletionTime = completionTimes.avgCompletionTime
      ? parseFloat(completionTimes.avgCompletionTime) / 3600 // Convert seconds to hours
      : 0;

    return {
      totalWorkOrders,
      openWorkOrders,
      overdueWorkOrders,
      highPriorityWorkOrders,
      averageCompletionTime,
      topTechnicians: topTechnicians.map(t => ({
        technicianId: t.wo_technicianId,
        name: `${t.technician_firstName} ${t.technician_lastName}`,
        completedCount: parseInt(t.count),
      })),
      equipmentWithMostWorkOrders: equipmentStats.map(e => ({
        equipmentId: e.wo_equipmentId,
        name: e.equipment_name,
        workOrderCount: parseInt(e.count),
      })),
    };
  }

  async getTechnicianPerformanceMetrics(
    technicianId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{
    totalWorkOrders: number;
    completedWorkOrders: number;
    onTimeCompletionRate: number;
    averageCompletionTime: number;
    firstTimeFixRate: number;
    utilizationRate: number;
    topEquipmentTypes: Array<{ equipmentType: string; count: number }>;
  }> {
    const { start, end } = dateRange;

    const [
      totalWorkOrders,
      completedWorkOrders,
      onTimeCompletions,
      completionTimes,
      firstTimeFixes,
      utilizationData,
      equipmentTypeStats,
    ] = await Promise.all([
      this.workOrderRepository.count({ where: { technicianId } }),
      this.workOrderRepository.count({
        where: {
          technicianId,
          status: WorkOrderStatus.COMPLETED,
          actualEndTime: Between(start, end),
        },
      }),
      this.workOrderRepository.count({
        where: {
          technicianId,
          status: WorkOrderStatus.COMPLETED,
          actualEndTime: LessThanOrEqual(new Date()), // Completed on or before due date
          dueDate: MoreThanOrEqual(start),
        },
      }),
      this.workOrderRepository
        .createQueryBuilder('wo')
        .select('AVG(EXTRACT(EPOCH FROM (wo.actualEndTime - wo.actualStartTime)))', 'avgCompletionTime')
        .where('wo.technicianId = :technicianId', { technicianId })
        .andWhere('wo.status = :status', { status: WorkOrderStatus.COMPLETED })
        .andWhere('wo.actualStartTime IS NOT NULL')
        .andWhere('wo.actualEndTime IS NOT NULL')
        .andWhere('wo.actualEndTime BETWEEN :start AND :end', { start, end })
        .getRawOne(),
      this.workOrderRepository
        .createQueryBuilder('wo')
        .leftJoin('wo.tasks', 'task')
        .where('wo.technicianId = :technicianId', { technicianId })
        .andWhere('wo.status = :status', { status: WorkOrderStatus.COMPLETED })
        .andWhere('task.firstTimeFix = :firstTimeFix', { firstTimeFix: true })
        .andWhere('wo.actualEndTime BETWEEN :start AND :end', { start, end })
        .getCount(),
      this.workOrderRepository
        .createQueryBuilder('wo')
        .select('SUM(EXTRACT(EPOCH FROM (wo.actualEndTime - wo.actualStartTime)))', 'totalHours')
        .where('wo.technicianId = :technicianId', { technicianId })
        .andWhere('wo.status = :status', { status: WorkOrderStatus.COMPLETED })
        .andWhere('wo.actualStartTime IS NOT NULL')
        .andWhere('wo.actualEndTime IS NOT NULL')
        .andWhere('wo.actualEndTime BETWEEN :start AND :end', { start, end })
        .getRawOne(),
      this.workOrderRepository
        .createQueryBuilder('wo')
        .leftJoin('wo.equipment', 'equipment')
        .select(['equipment.type', 'COUNT(*) as count'])
        .where('wo.technicianId = :technicianId', { technicianId })
        .andWhere('wo.status = :status', { status: WorkOrderStatus.COMPLETED })
        .andWhere('wo.actualEndTime BETWEEN :start AND :end', { start, end })
        .groupBy('equipment.type')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany(),
    ]);

    const averageCompletionTime = completionTimes.avgCompletionTime
      ? parseFloat(completionTimes.avgCompletionTime) / 3600 // Convert seconds to hours
      : 0;

    const onTimeCompletionRate = totalWorkOrders > 0
      ? (onTimeCompletions / totalWorkOrders) * 100
      : 0;

    const firstTimeFixRate = completedWorkOrders > 0
      ? (firstTimeFixes / completedWorkOrders) * 100
      : 0;

    const totalAvailableHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalWorkedHours = utilizationData.totalHours
      ? parseFloat(utilizationData.totalHours) / 3600
      : 0;
    const utilizationRate = totalAvailableHours > 0
      ? (totalWorkedHours / totalAvailableHours) * 100
      : 0;

    return {
      totalWorkOrders,
      completedWorkOrders,
      onTimeCompletionRate,
      averageCompletionTime,
      firstTimeFixRate,
      utilizationRate,
      topEquipmentTypes: equipmentTypeStats.map(e => ({
        equipmentType: e.equipment_type,
        count: parseInt(e.count),
      })),
    };
  }
}
```

### API Response Compression

```typescript
// src/middleware/compression.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as compression from 'compression';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  private readonly compressionMiddleware: (req: Request, res: Response, next: NextFunction) => void;

  constructor(private configService: ConfigService) {
    const compressionOptions: compression.CompressionOptions = {
      level: this.configService.get<number>('COMPRESSION_LEVEL', 6),
      threshold: this.configService.get<number>('COMPRESSION_THRESHOLD', 1024),
      filter: (req: Request, res: Response) => {
        // Don't compress responses that are already compressed
        if (res.getHeader('Content-Encoding')) {
          return false;
        }

        // Don't compress small responses
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Only compress certain content types
        const contentType = res.getHeader('Content-Type') as string;
        if (contentType && !this.shouldCompressContentType(contentType)) {
          return false;
        }

        return compression.filter(req, res);
      },
    };

    this.compressionMiddleware = compression(compressionOptions);
  }

  private shouldCompressContentType(contentType: string): boolean {
    const compressibleTypes = [
      'text/html',
      'text/css',
      'text/plain',
      'text/xml',
      'application/json',
      'application/javascript',
      'application/xml',
      'application/xhtml+xml',
      'image/svg+xml',
    ];

    return compressibleTypes.some(type => contentType.startsWith(type));
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Set compression-related headers
    res.setHeader('Vary', 'Accept-Encoding');

    // Apply compression middleware
    this.compressionMiddleware(req, res, next);
  }
}

// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CompressionMiddleware } from './middleware/compression.middleware';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },
    bodyParser: true,
  });

  // Security middleware
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
    }),
  );

  // Compression middleware
  app.use(new CompressionMiddleware(app.get(ConfigService)).use);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Maintenance Scheduling API')
      .setDescription('API for the maintenance scheduling system')
      .setVersion('2.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  // Enable shutdown hooks
  app.enableShutdownHooks();

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
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
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LAZY_LOAD_METADATA } from './constants';
import { ClassConstructor, plainToClass } from 'class-transformer';

@Injectable()
export class LazyLoadInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const lazyLoadRelations = this.reflector.get<string[]>(
      LAZY_LOAD_METADATA,
      context.getHandler(),
    );

    if (!lazyLoadRelations || lazyLoadRelations.length === 0) {
      return next.handle();
    }

    return next.handle().pipe(
      map(data => {
        if (Array.isArray(data)) {
          return data.map(item => this.processItem(item, lazyLoadRelations));
        }
        return this.processItem(data, lazyLoadRelations);
      }),
    );
  }

  private processItem(item: any, relations: string[]): any {
    if (!item) return item;

    // Create a proxy that will load relations on demand
    return new Proxy(item, {
      get: (target, prop) => {
        if (relations.includes(prop as string)) {
          // If the relation is not loaded, return a function to load it
          if (!target[prop]) {
            return async () => {
              // In a real implementation, this would make an API call to load the relation
              const relationData = await this.loadRelation(target.id, prop as string);
              target[prop] = relationData;
              return relationData;
            };
          }
          return target[prop];
        }
        return target[prop];
      },
    });
  }

  private async loadRelation(id: string, relation: string): Promise<any> {
    // This is a simplified implementation
    // In a real application, this would make an API call to load the relation
    console.log(`Loading relation ${relation} for entity with id ${id}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return mock data based on relation
    switch (relation) {
      case 'technician':
        return {
          id: 'tech-123',
          firstName: 'John',
          lastName: 'Doe',
          employeeId: 'EMP-456',
        };
      case 'equipment':
        return {
          id: 'equip-789',
          name: 'Conveyor Belt',
          equipmentNumber: 'EQ-001',
          location: 'Warehouse A',
        };
      case 'tasks':
        return [
          {
            id: 'task-1',
            title: 'Inspect motor',
            status: 'COMPLETED',
          },
          {
            id: 'task-2',
            title: 'Lubricate bearings',
            status: 'IN_PROGRESS',
          },
        ];
      case 'parts':
        return [
          {
            id: 'part-1',
            partNumber: 'PART-001',
            name: 'Bearing',
            quantity: 2,
          },
        ];
      default:
        return null;
    }
  }
}

// src/work-orders/work-orders.controller.ts
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { LazyLoad } from '../common/lazy-loader.decorator';
import { LazyLoadInterceptor } from '../common/lazy-load.interceptor';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('work-orders')
@ApiBearerAuth()
@Controller('work-orders')
@UseInterceptors(LazyLoadInterceptor)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all work orders with pagination' })
  @ApiResponse({ status: 200, description: 'List of work orders' })
  @LazyLoad(['technician', 'equipment', 'tasks'])
  async findAll(@Query() pagination: PaginationDto) {
    return this.workOrdersService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific work order by ID' })
  @ApiResponse({ status: 200, description: 'The work order details' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  @LazyLoad(['technician', 'equipment', 'tasks', 'parts'])
  async findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Get('equipment/:equipmentId')
  @ApiOperation({ summary: 'Get work orders for specific equipment' })
  @ApiResponse({ status: 200, description: 'List of work orders for the equipment' })
  @LazyLoad(['technician', 'tasks'])
  async findByEquipment(
    @Param('equipmentId') equipmentId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.workOrdersService.findByEquipment(equipmentId, pagination);
  }

  @Get('technician/:technicianId')
  @ApiOperation({ summary: 'Get work orders assigned to a specific technician' })
  @ApiResponse({ status: 200, description: 'List of work orders for the technician' })
  @LazyLoad(['equipment', 'tasks'])
  async findByTechnician(
    @Param('technicianId') technicianId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.workOrdersService.findByTechnician(technicianId, pagination);
  }
}

// src/work-orders/work-orders.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { QueryOptimizerService } from '../database/query-optimizer.service';
import { RedisCacheService } from '../cache/redis-cache.service';

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    private queryOptimizer: QueryOptimizerService,
    private cacheService: RedisCacheService,
  ) {}

  async findAll(pagination: PaginationDto): Promise<{ data: WorkOrder[]; total: number }> {
    const cacheKey = `workorders:list:${pagination.page}:${pagination.limit}`;
    const cacheTtl = 300; // 5 minutes

    return this.cacheService.getWithCacheFallback(
      cacheKey,
      async () => {
        this.logger.debug('Cache miss for work orders list, executing database query');
        return this.queryOptimizer.getOptimizedWorkOrderList(pagination, {});
      },
      cacheTtl,
    );
  }

  async findOne(id: string): Promise<WorkOrder> {
    const cacheKey = `workorder:${id}:details`;
    const cacheTtl = 3600; // 1 hour

    return this.cacheService.getWithCacheFallback(
      cacheKey,
      async () => {
        this.logger.debug(`Cache miss for work order ${id}, executing database query`);
        const workOrder = await this.workOrderRepository.findOne({
          where: { id },
          relations: ['technician', 'equipment', 'tasks', 'parts', 'parts.part'],
        });

        if (!workOrder) {
          throw new Error('Work order not found');
        }

        return workOrder;
      },
      cacheTtl,
    );
  }

  async findByEquipment(
    equipmentId: string,
    pagination: PaginationDto,
  ): Promise<{ data: WorkOrder[]; total: number }> {
    const cacheKey = `workorders:equipment:${equipmentId}:${pagination.page}:${pagination.limit}`;
    const cacheTtl = 600; // 10 minutes

    return this.cacheService.getWithCacheFallback(
      cacheKey,
      async () => {
        this.logger.debug(`Cache miss for work orders by equipment ${equipmentId}`);
        return this.queryOptimizer.getOptimizedWorkOrderList(pagination, {
          equipmentId,
        });
      },
      cacheTtl,
    );
  }

  async findByTechnician(
    technicianId: string,
    pagination: PaginationDto,
  ): Promise<{ data: WorkOrder[]; total: number }> {
    const cacheKey = `workorders:technician:${technicianId}:${pagination.page}:${pagination.limit}`;
    const cacheTtl = 600; // 10 minutes

    return this.cacheService.getWithCacheFallback(
      cacheKey,
      async () => {
        this.logger.debug(`Cache miss for work orders by technician ${technicianId}`);
        return this.queryOptimizer.getOptimizedWorkOrderList(pagination, {
          technicianId,
        });
      },
      cacheTtl,
    );
  }

  async getTechnicianSchedule(technicianId: string, dateRange: { start: Date; end: Date }) {
    const cacheKey = `technician:${technicianId}:schedule:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
    const cacheTtl = 1800; // 30 minutes

    return this.cacheService.getWithCacheFallback(
      cacheKey,
      async () => {
        this.logger.debug(`Cache miss for technician ${technicianId} schedule`);
        return this.queryOptimizer.getTechnicianScheduleOptimized(technicianId, dateRange);
      },
      cacheTtl,
    );
  }

  async getEquipmentMaintenanceHistory(
    equipmentId: string,
    pagination: PaginationDto,
  ): Promise<{ data: WorkOrder[]; total: number }> {
    const cacheKey = `equipment:${equipmentId}:history:${pagination.page}:${pagination.limit}`;
    const cacheTtl = 7200; // 2 hours

    return this.cacheService.getWithCacheFallback(
      cacheKey,
      async () => {
        this.logger.debug(`Cache miss for equipment ${equipmentId} maintenance history`);
        return this.queryOptimizer.getEquipmentMaintenanceHistoryOptimized(equipmentId, pagination, {});
      },
      cacheTtl,
    );
  }
}
```

### Request Debouncing

```typescript
// src/common/debounce.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { DEBOUNCE_METADATA } from './constants';

export function Debounce(ms: number = 300) {
  return applyDecorators(
    SetMetadata(DEBOUNCE_METADATA, ms),
  );
}

// src/common/debounce.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, debounceTime } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { DEBOUNCE_METADATA } from './constants';

@Injectable()
export class DebounceInterceptor implements NestInterceptor {
  private readonly debounceMap = new Map<string, NodeJS.Timeout>();

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const debounceTimeMs = this.reflector.get<number>(
      DEBOUNCE_METADATA,
      context.getHandler(),
    );

    if (!debounceTimeMs) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const cacheKey = this.generateCacheKey(request);

    // If there's already a pending request with the same key, clear it
    if (this.debounceMap.has(cacheKey)) {
      clearTimeout(this.debounceMap.get(cacheKey));
    }

    return new Observable(observer => {
      const debounceTimer = setTimeout(() => {
        next.handle().subscribe({
          next: value => {
            // Set response headers to indicate debounced request
            response.setHeader('X-Debounced-Request', 'true');
            observer.next(value);
            observer.complete();
          },
          error: err => observer.error(err),
        });
      }, debounceTimeMs);

      this.debounceMap.set(cacheKey, debounceTimer);

      // Clean up on completion or error
      return () => {
        clearTimeout(debounceTimer);
        this.debounceMap.delete(cacheKey);
      };
    });
  }

  private generateCacheKey(request: any): string {
    const { method, url, body, query, params } = request;

    // Create a unique key based on request method, URL, and relevant parameters
    const keyParts = [
      method,
      url,
      JSON.stringify(query),
      JSON.stringify(params),
    ];

    // Only include body for certain methods
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      keyParts.push(JSON.stringify(body));
    }

    return keyParts.join('|');
  }
}

// src/work-orders/work-orders.controller.ts (updated)
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { LazyLoad } from '../common/lazy-loader.decorator';
import { LazyLoadInterceptor } from '../common/lazy-load.interceptor';
import { Debounce } from '../common/debounce.decorator';
import { DebounceInterceptor } from '../common/debounce.interceptor';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('work-orders')
@ApiBearerAuth()
@Controller('work-orders')
@UseInterceptors(LazyLoadInterceptor, DebounceInterceptor)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all work orders with pagination' })
  @ApiResponse({ status: 200, description: 'List of work orders' })
  @LazyLoad(['technician', 'equipment', 'tasks'])
  @Debounce(500) // Debounce for 500ms to prevent rapid duplicate requests
  async findAll(@Query() pagination: PaginationDto) {
    return this.workOrdersService.findAll(pagination);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search work orders' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @LazyLoad(['technician', 'equipment'])
  @Debounce(300) // Shorter debounce for search
  async search(
    @Query('q') query: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.workOrdersService.search(query, pagination);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  @Debounce(1000) // Longer debounce for stats that don't change frequently
  async getDashboardStats() {
    return this.workOrdersService.getDashboardStats();
  }
}

// src/technicians/technicians.controller.ts
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { TechniciansService } from './technicians.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Debounce } from '../common/debounce.decorator';
import { DebounceInterceptor } from '../common/debounce.interceptor';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('technicians')
@ApiBearerAuth()
@Controller('technicians')
@UseInterceptors(DebounceInterceptor)
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Get()
  @ApiOperation({ summary: 'Get all technicians with pagination' })
  @ApiResponse({ status: 200, description: 'List of technicians' })
  @Debounce(500)
  async findAll(@Query() pagination: PaginationDto) {
    return this.techniciansService.findAll(pagination);
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Get technician schedule' })
  @ApiResponse({ status: 200, description: 'Technician schedule' })
  @Debounce(300)
  async getSchedule(
    @Param('id') id: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const dateRange = {
      start: new Date(start),
      end: new Date(end),
    };
    return this.techniciansService.getSchedule(id, dateRange);
  }

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get technician performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics' })
  @Debounce(1000)
  async getPerformance(
    @Param('id') id: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const dateRange = {
      start: new Date(start),
      end: new Date(end),
    };
    return this.techniciansService.getPerformanceMetrics(id, dateRange);
  }
}
```

### Connection Pooling

```typescript
// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { DataSource } from 'typeorm';

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
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false, // Always false in production
        logging: configService.get('DB_LOGGING') === 'true',
        namingStrategy: new SnakeNamingStrategy(),
        ssl: configService.get('DB_SSL') === 'true' ? {
          rejectUnauthorized: configService.get('DB_SSL_REJECT_UNAUTHORIZED') === 'true',
          ca: configService.get('DB_SSL_CA'),
        } : false,
        extra: {
          // Connection pool settings
          max: configService.get('DB_POOL_MAX') || 20, // Maximum number of connections in the pool
          min: configService.get('DB_POOL_MIN') || 2, // Minimum number of connections in the pool
          idleTimeoutMillis: configService.get('DB_POOL_IDLE_TIMEOUT') || 30000, // How long a client is allowed to remain idle before being closed
          connectionTimeoutMillis: configService.get('DB_POOL_CONNECTION_TIMEOUT') || 2000, // How long to wait for a connection to become available
          maxUses: configService.get('DB_POOL_MAX_USES') || 7500, // Maximum number of times a connection can be used before being destroyed
          application_name: 'maintenance-scheduling',
        },
        poolErrorHandler: (err: Error) => {
          console.error('Database pool error:', err);
          // In a real application, you might want to log this to a monitoring system
        },
      }),
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

// src/database/connection-pool.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConnectionPoolService {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private readonly dataSource: DataSource;

  constructor(
    private configService: ConfigService,
    dataSource: DataSource,
  ) {
    this.dataSource = dataSource;
    this.monitorPoolHealth();
  }

  private monitorPoolHealth() {
    // Set up periodic monitoring of the connection pool
    setInterval(async () => {
      try {
        const pool = this.dataSource.driver.pool;
        if (pool) {
          const status = {
            totalConnections: pool.totalCount,
            idleConnections: pool.idleCount,
            waitingClients: pool.waitingCount,
            maxConnections: pool.options.max,
          };

          this.logger.debug(`Connection pool status: ${JSON.stringify(status)}`);

          // Log warnings if pool is getting full
          if (status.waitingClients > 0) {
            this.logger.warn(`Connection pool has ${status.waitingClients} waiting clients`);
          }

          if (status.totalConnections >= status.maxConnections * 0.9) {
            this.logger.warn(`Connection pool is 90% full (${status.totalConnections}/${status.maxConnections})`);
          }
        }
      } catch (err) {
        this.logger.error('Error monitoring connection pool', err);
      }
    }, this.configService.get('POOL_MONITOR_INTERVAL') || 30000); // Every 30 seconds
  }

  async getPoolStatus() {
    try {
      const pool = this.dataSource.driver.pool;
      if (!pool) {
        return { status: 'No connection pool available' };
      }

      return {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
        maxConnections: pool.options.max,
        minConnections: pool.options.min,
        utilization: pool.totalCount > 0
          ? Math.round((pool.totalCount - pool.idleCount) / pool.totalCount * 100)
          : 0,
      };
    } catch (err) {
      this.logger.error('Error getting pool status', err);
      return { error: 'Could not retrieve pool status' };
    }
  }

  async checkConnection() {
    try {
      await this.dataSource.query('SELECT 1');
      return { connected: true };
    } catch (err) {
      this.logger.error('Database connection check failed', err);
      return { connected: false, error: err.message };
    }
  }

  async executeWithRetry<T>(
    queryFn: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await queryFn();
      } catch (err) {
        lastError = err;
        this.logger.warn(`Query attempt ${i + 1} failed: ${err.message}`);

        // Only retry for certain types of errors
        if (!this.shouldRetry(err)) {
          break;
        }

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2; // Exponential backoff
        }
      }
    }

    this.logger.error(`All ${maxRetries} attempts failed`, lastError);
    throw lastError;
  }

  private shouldRetry(error: Error): boolean {
    // Retry for connection-related errors
    const retryableErrors = [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      'connection terminated',
      'Connection terminated unexpectedly',
      'Connection is not established',
      'Connection lost',
      'could not connect to server',
    ];

    return retryableErrors.some(errMsg =>
      error.message.includes(errMsg),
    );
  }

  async getConnection() {
    return this.dataSource.createQueryRunner();
  }

  async releaseConnection(queryRunner: any) {
    if (queryRunner) {
      await queryRunner.release();
    }
  }

  async withTransaction<T>(
    work: (queryRunner: any) => Promise<T>,
  ): Promise<T> {
    const queryRunner = await this.getConnection();

    try {
      await queryRunner.startTransaction();
      const result = await work(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await this.releaseConnection(queryRunner);
    }
  }
}

// src/work-orders/work-orders.service.ts (updated)
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { QueryOptimizerService } from '../database/query-optimizer.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { ConnectionPoolService } from '../database/connection-pool.service';

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    private queryOptimizer: QueryOptimizerService,
    private cacheService: RedisCacheService,
    private connectionPool: ConnectionPoolService,
  ) {}

  async findAll(pagination: PaginationDto): Promise<{ data: WorkOrder[]; total: number }> {
    const cacheKey = `workorders:list:${pagination.page}:${pagination.limit}`;
    const cacheTtl = 300; // 5 minutes

    return this.cacheService.getWithCacheFallback(
      cacheKey,
      async () => {
        this.logger.debug('Cache miss for work orders list, executing database query');
        return this.connectionPool.executeWithRetry(async () => {
          return this.queryOptimizer.getOptimizedWorkOrderList(pagination, {});
        });
      },
      cacheTtl,
    );
  }

  async findOne(id: string): Promise<WorkOrder> {
    const cacheKey = `workorder:${id}:details`;
    const cacheTtl = 3600; // 1 hour

    return this.cacheService.getWithCacheFallback(
      cacheKey,
      async () => {
        this.logger.debug(`Cache miss for work order ${id}, executing database query`);
        return this.connectionPool.executeWithRetry(async () => {
          const workOrder = await this.workOrderRepository.findOne({
            where: { id },
            relations: ['technician', 'equipment', 'tasks', 'parts', 'parts.part'],
          });

          if (!workOrder) {
            throw new Error('Work order not found');
          }

          return workOrder;
        });
      },
      cacheTtl,
    );
  }

  async create(workOrderData: Partial<WorkOrder>): Promise<WorkOrder> {
    return this.connectionPool.withTransaction(async (queryRunner) => {
      const workOrderRepository = queryRunner.manager.getRepository(WorkOrder);

      // Create the work order
      const workOrder = workOrderRepository.create(workOrderData);
      const savedWorkOrder = await workOrderRepository.save(workOrder);

      // Invalidate relevant caches
      await this.cacheService.invalidatePattern(`workorder:${savedWorkOrder.id}:*`);
      await this.cacheService.invalidatePattern(`workorders:list:*`);
      await this.cacheService.invalidatePattern(`workorders:equipment:${savedWorkOrder.equipmentId}:*`);
      await this.cacheService.invalidatePattern(`workorders:technician:${savedWorkOrder.technicianId}:*`);

      return savedWorkOrder;
    });
  }

  async update(id: string, updateData: Partial<WorkOrder>): Promise<WorkOrder> {
    return this.connectionPool.withTransaction(async (queryRunner) => {
      const workOrderRepository = queryRunner.manager.getRepository(WorkOrder);

      // Get the current work order to determine what needs to be invalidated
      const currentWorkOrder = await workOrderRepository.findOne({ where: { id } });
      if (!currentWorkOrder) {
        throw new Error('Work order not found');
      }

      // Update the work order
      const updatedWorkOrder = await workOrderRepository.save({
        ...currentWorkOrder,
        ...updateData,
      });

      // Invalidate relevant caches
      await this.cacheService.invalidatePattern(`workorder:${id}:*`);
      await this.cacheService.invalidatePattern(`workorders:list:*`);
      await this.cacheService.invalidatePattern(`workorders:equipment:${updatedWorkOrder.equipmentId}:*`);
      await this.cacheService.invalidatePattern(`workorders:technician:${updatedWorkOrder.technicianId}:*`);

      // If the status changed to COMPLETED, invalidate equipment history cache
      if (
        updateData.status === 'COMPLETED' &&
        currentWorkOrder.status !== 'COMPLETED'
      ) {
        await this.cacheService.invalidatePattern(`equipment:${updatedWorkOrder.equipmentId}:history:*`);
      }

      return updatedWorkOrder;
    });
  }

  async delete(id: string): Promise<void> {
    return this.connectionPool.withTransaction(async (queryRunner) => {
      const workOrderRepository = queryRunner.manager.getRepository(WorkOrder);

      // Get the work order to determine what needs to be invalidated
      const workOrder = await workOrderRepository.findOne({ where: { id } });
      if (!workOrder) {
        throw new Error('Work order not found');
      }

      await workOrderRepository.delete(id);

      // Invalidate relevant caches
      await this.cacheService.invalidatePattern(`workorder:${id}:*`);
      await this.cacheService.invalidatePattern(`workorders:list:*`);
      await this.cacheService.invalidatePattern(`workorders:equipment:${workOrder.equipmentId}:*`);
      await this.cacheService.invalidatePattern(`workorders:technician:${workOrder.technicianId}:*`);
    });
  }

  async getDashboardStats() {
    const cacheKey = 'dashboard:stats';
    const cacheTtl = 60; // 1 minute

    return this.cacheService.getWithCacheFallback(
      cacheKey,
      async () => {
        this.logger.debug('Cache miss for dashboard stats, executing database query');
        return this.connectionPool.executeWithRetry(async () => {
          return this.queryOptimizer.getMaintenanceDashboardStats();
        });
      },
      cacheTtl,
    );
  }
}
```

---

## Real-Time Features (350+ lines)

### WebSocket Server Setup

```typescript
// src/websocket/websocket.module.ts
import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';
import { AuthModule } from '../auth/auth.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { TechniciansModule } from '../technicians/technicians.module';
import { EquipmentModule } from '../equipment/equipment.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    WorkOrdersModule,
    TechniciansModule,
    EquipmentModule,
    NotificationsModule,
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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*', // Should be configured properly in production
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly connectedClients = new Map<string, Socket>();
  private readonly userIdToSocketIds = new Map<string, Set<string>>();

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.websocketService.setServer(server);

    // Set up periodic cleanup of disconnected clients
    setInterval(() => {
      this.cleanupDisconnectedClients();
    }, 300000); // Every 5 minutes
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.debug(`Client connected: ${client.id}`);

      // Authenticate the client
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.authService.validateUser(payload);
      if (!user) {
        this.logger.warn(`Client ${client.id} connected with invalid token`);
        client.disconnect(true);
        return;
      }

      // Store client information
      this.connectedClients.set(client.id, client);
      this.addUserSocket(user.id, client.id);

      // Join user-specific room
      client.join(`user:${user.id}`);

      // Join role-specific rooms
      if (user.roles) {
        user.roles.forEach(role => {
          client.join(`role:${role}`);
        });
      }

      this.logger.log(`Client ${client.id} authenticated as user ${user.id} (${user.email})`);

      // Send connection confirmation
      client.emit('connection:confirm', {
        success: true,
        message: 'Connected to real-time service',
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      // Send initial presence update
      this.websocketService.broadcastPresenceUpdate();
    } catch (err) {
      this.logger.error(`Error during client connection: ${err.message}`);
      client.emit('error', {
        type: 'authentication_error',
        message: 'Authentication failed',
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);

    // Remove client from tracking
    this.connectedClients.delete(client.id);

    // Remove from user mapping
    this.userIdToSocketIds.forEach((socketIds, userId) => {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.userIdToSocketIds.delete(userId);
      }
    });

    // Broadcast presence update
    this.websocketService.broadcastPresenceUpdate();
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data.rooms || !Array.isArray(data.rooms)) {
        throw new Error('Invalid rooms format');
      }

      // Validate room names
      const validRooms = data.rooms.filter(room =>
        this.websocketService.isValidRoom(room),
      );

      if (validRooms.length === 0) {
        throw new Error('No valid rooms provided');
      }

      // Join the rooms
      validRooms.forEach(room => {
        client.join(room);
      });

      this.logger.debug(`Client ${client.id} subscribed to rooms: ${validRooms.join(', ')}`);

      return {
        success: true,
        message: `Subscribed to ${validRooms.length} rooms`,
        rooms: validRooms,
      };
    } catch (err) {
      this.logger.error(`Subscription error for client ${client.id}: ${err.message}`);
      return {
        success: false,
        message: err.message,
      };
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data.rooms || !Array.isArray(data.rooms)) {
        throw new Error('Invalid rooms format');
      }

      // Leave the rooms
      data.rooms.forEach(room => {
        client.leave(room);
      });

      this.logger.debug(`Client ${client.id} unsubscribed from rooms: ${data.rooms.join(', ')}`);

      return {
        success: true,
        message: `Unsubscribed from ${data.rooms.length} rooms`,
        rooms: data.rooms,
      };
    } catch (err) {
      this.logger.error(`Unsubscription error for client ${client.id}: ${err.message}`);
      return {
        success: false,
        message: err.message,
      };
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
    });
  }

  private extractToken(client: Socket): string | null {
    // Check for token in query params
    if (client.handshake.query.token) {
      return client.handshake.query.token as string;
    }

    // Check for token in headers
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    return null;
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userIdToSocketIds.has(userId)) {
      this.userIdToSocketIds.set(userId, new Set());
    }
    this.userIdToSocketIds.get(userId).add(socketId);
  }

  private cleanupDisconnectedClients() {
    const disconnectedClients = Array.from(this.connectedClients.entries())
      .filter(([_, client]) => !client.connected)
      .map(([socketId]) => socketId);

    disconnectedClients.forEach(socketId => {
      this.connectedClients.delete(socketId);
      this.userIdToSocketIds.forEach((socketIds, userId) => {
        socketIds.delete(socketId);
        if (socketIds.size === 0) {
          this.userIdToSocketIds.delete(userId);
        }
      });
    });

    if (disconnectedClients.length > 0) {
      this.logger.debug(`Cleaned up ${disconnectedClients.length} disconnected clients`);
      this.websocketService.broadcastPresenceUpdate();
    }
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getConnectedUsersCount(): number {
    return this.userIdToSocketIds.size;
  }

  getUserSocketIds(userId: string): string[] {
    const socketIds = this.userIdToSocketIds.get(userId);
    return socketIds ? Array.from(socketIds) : [];
  }

  getUserSockets(userId: string): Socket[] {
    const socketIds = this.getUserSocketIds(userId);
    return socketIds
      .map(socketId => this.connectedClients.get(socketId))
      .filter(socket => socket && socket.connected);
  }
}

// src/websocket/websocket.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import { TechniciansService } from '../technicians/technicians.service';
import { EquipmentService } from '../equipment/equipment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class WebsocketService {
  private server: Server;
  private readonly logger = new Logger(WebsocketService.name);
  private readonly validRooms = new Set<string>([
    // System rooms
    'system:all',
    'system:presence',
    'system:notifications',

    // Work order rooms
    'workorders:all',
    'workorders:updates',
    'workorders:created',
    'workorders:updated',
    'workorders:deleted',

    // Technician rooms
    'technicians:all',
    'technicians:updates',
    'technicians:schedule',

    // Equipment rooms
    'equipment:all',
    'equipment:updates',
    'equipment:status',

    // User-specific rooms (dynamic)
    // Format: user:{userId}
  ]);

  constructor(
    private readonly workOrdersService: WorkOrdersService,
    private readonly techniciansService: TechniciansService,
    private readonly equipmentService: EquipmentService,
    private readonly notificationsService: NotificationsService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  isValidRoom(room: string): boolean {
    // Check if room is in the valid rooms set
    if (this.validRooms.has(room)) {
      return true;
    }

    // Check for dynamic user rooms
    if (room.startsWith('user:')) {
      return true;
    }

    // Check for dynamic work order rooms
    if (room.startsWith('workorder:')) {
      return true;
    }

    // Check for dynamic equipment rooms
    if (room.startsWith('equipment:')) {
      return true;
    }

    // Check for dynamic technician rooms
    if (room.startsWith('technician:')) {
      return true;
    }

    return false;
  }

  broadcastPresenceUpdate() {
    const connectedClients = this.websocketGateway.getConnectedClientsCount();
    const connectedUsers = this.websocketGateway.getConnectedUsersCount();

    this.server.to('system:presence').emit('presence:update', {
      connectedClients,
      connectedUsers,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastWorkOrderUpdate(workOrderId: string, eventType: string, data: any) {
    try {
      const workOrder = await this.workOrdersService.findOne(workOrderId);

      // Broadcast to general work order rooms
      this.server.to('workorders:all').emit('workorder:update', {
        eventType,
        workOrderId,
        data,
        timestamp: new Date().toISOString(),
      });

      this.server.to('workorders:updates').emit('workorder:update', {
        eventType,
        workOrderId,
        data,
        timestamp: new Date().toISOString(),
      });

      // Broadcast to specific event type room
      this.server.to(`workorders:${eventType}`).emit('workorder:update', {
        eventType,
        workOrderId,
        data,
        timestamp: new Date().toISOString(),
      });

      // Broadcast to work order-specific room
      this.server.to(`workorder:${workOrderId}`).emit('workorder:update', {
        eventType,
        workOrderId,
        data,
        timestamp: new Date().toISOString(),
      });

      // Broadcast to equipment room
      if (workOrder.equipmentId) {
        this.server.to(`equipment:${workOrder.equipmentId}`).emit('workorder:update', {
          eventType,
          workOrderId,
          equipmentId: workOrder.equipmentId,
          data,
          timestamp: new Date().toISOString(),
        });
      }

      // Broadcast to technician room
      if (workOrder.technicianId) {
        this.server.to(`technician:${workOrder.technicianId}`).emit('workorder:update', {
          eventType,
          workOrderId,
          technicianId: workOrder.technicianId,
          data,
          timestamp: new Date().toISOString(),
        });

        // Also send to user-specific room if technician is connected
        const technicianSockets = this.websocketGateway.getUserSockets(workOrder.technicianId);
        if (technicianSockets.length > 0) {
          technicianSockets.forEach(socket => {
            socket.emit('workorder:update', {
              eventType,
              workOrderId,
              data: {
                ...data,
                isAssignedToYou: true,
              },
              timestamp: new Date().toISOString(),
            });
          });
        }
      }

      this.logger.debug(`Broadcasted work order ${eventType} event for ${workOrderId}`);
    } catch (err) {
      this.logger.error(`Error broadcasting work order update: ${err.message}`);
    }
  }

  async broadcastTechnicianUpdate(technicianId: string, eventType: string, data: any) {
    try {
      // Broadcast to general technician rooms
      this.server.to('technicians:all').emit('technician:update', {
        eventType,
        technicianId,
        data,
        timestamp: new Date().toISOString(),
      });

      this.server.to('technicians:updates').emit('technician:update', {
        eventType,
        technicianId,
        data,
        timestamp: new Date().toISOString(),
      });

      // Broadcast to specific event type room
      this.server.to(`technicians:${eventType}`).emit('technician:update', {
        eventType,
        technicianId,
        data,
        timestamp: new Date().toISOString(),
      });

      // Broadcast to technician-specific room
      this.server.to(`technician:${technicianId}`).emit('technician:update', {
        eventType,
        technicianId,
        data,
        timestamp: new Date().toISOString(),
      });

      // Broadcast to user-specific rooms
      const userSockets = this.websocketGateway.getUserSockets(technicianId);
      if (userSockets.length > 0) {
        userSockets.forEach(socket => {
          socket.emit('technician:update', {
            eventType,
            technicianId,
            data: {
              ...data,
              isAboutYou: true,
            },
            timestamp: new Date().toISOString(),
          });
        });
      }

      this.logger.debug(`Broadcasted technician ${eventType} event for ${technicianId}`);
    } catch (err) {
      this.logger.error(`Error broadcasting technician update: ${err.message}`);
    }
  }

  async broadcastEquipmentUpdate(equipmentId: string, eventType: string, data: any) {
    try {
      // Broadcast to general equipment rooms
      this.server.to('equipment:all').emit('equipment:update', {
        eventType,
        equipmentId,
        data,
        timestamp: new Date().toISOString(),
      });

      this.server.to('equipment:updates').emit('equipment:update', {
        eventType,
        equipmentId,
        data,
        timestamp: new Date().toISOString(),
      });

      // Broadcast to specific event type room
      this.server.to(`equipment:${eventType}`).emit('equipment:update', {
        eventType,
        equipmentId,
        data,
        timestamp: new Date().toISOString(),
      });

      // Broadcast to equipment-specific room
      this.server.to(`equipment:${equipmentId}`).emit('equipment:update', {
        eventType,
        equipmentId,
        data,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(`Broadcasted equipment ${eventType} event for ${equipmentId}`);
    } catch (err) {
      this.logger.error(`Error broadcasting equipment update: ${err.message}`);
    }
  }

  broadcastNotification(userId: string, notification: any) {
    try {
      // Broadcast to user-specific room
      this.server.to(`user:${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString(),
      });

      // Broadcast to user's connected sockets
      const userSockets = this.websocketGateway.getUserSockets(userId);
      if (userSockets.length > 0) {
        userSockets.forEach(socket => {
          socket.emit('notification', {
            ...notification,
            timestamp: new Date().toISOString(),
          });
        });
      }

      this.logger.debug(`Broadcasted notification to user ${userId}`);
    } catch (err) {
      this.logger.error(`Error broadcasting notification: ${err.message}`);
    }
  }

  broadcastSystemMessage(message: string, data: any = {}) {
    try {
      this.server.to('system:all').emit('system:message', {
        message,
        data,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(`Broadcasted system message: ${message}`);
    } catch (err) {
      this.logger.error(`Error broadcasting system message: ${err.message}`);
    }
  }

  async broadcastWorkOrderAssignment(workOrderId: string, technicianId: string) {
    try {
      const [workOrder, technician] = await Promise.all([
        this.workOrdersService.findOne(workOrderId),
        this.techniciansService.findOne(technicianId),
      ]);

      const notification = {
        type: 'work_order_assigned',
        title: 'New Work Order Assigned',
        message: `You have been assigned work order #${workOrder.workOrderNumber}: ${workOrder.title}`,
        workOrderId,
        workOrderNumber: workOrder.workOrderNumber,
        equipmentId: workOrder.equipmentId,
        equipmentName: workOrder.equipment?.name,
        dueDate: workOrder.dueDate,
        priority: workOrder.priority,
      };

      // Send to the assigned technician
      this.broadcastNotification(technicianId, notification);

      // Also broadcast the update
      this.broadcastWorkOrderUpdate(workOrderId, 'assigned', {
        technicianId,
        technicianName: `${technician.firstName} ${technician.lastName}`,
        assignedAt: new Date().toISOString(),
      });

      this.logger.debug(`Broadcasted work order assignment for ${workOrderId} to ${technicianId}`);
    } catch (err) {
      this.logger.error(`Error broadcasting work order assignment: ${err.message}`);
    }
  }

  async broadcastWorkOrderStatusChange(workOrderId: string, newStatus: string, oldStatus: string) {
    try {
      const workOrder = await this.workOrdersService.findOne(workOrderId);

      const notificationData = {
        type: 'work_order_status_change',
        title: `Work Order Status Changed to ${newStatus}`,
        message: `Work order #${workOrder.workOrderNumber} status changed from ${oldStatus} to ${newStatus}`,
        workOrderId,
        workOrderNumber: workOrder.workOrderNumber,
        oldStatus,
        newStatus,
        updatedAt: new Date().toISOString(),
      };

      // Send notification to the assigned technician
      if (workOrder.technicianId) {
        this.broadcastNotification(workOrder.technicianId, notificationData);
      }

      // Send notification to equipment owner if available
      if (workOrder.equipment?.ownerId) {
        this.broadcastNotification(workOrder.equipment.ownerId, {
          ...notificationData,
          title: `Equipment Work Order Status Changed to ${newStatus}`,
        });
      }

      // Broadcast the update
      this.broadcastWorkOrderUpdate(workOrderId, 'status_change', {
        oldStatus,
        newStatus,
        changedAt: new Date().toISOString(),
      });

      this.logger.debug(`Broadcasted work order status change for ${workOrderId} to ${newStatus}`);
    } catch (err) {
      this.logger.error(`Error broadcasting work order status change: ${err.message}`);
    }
  }

  async broadcastTechnicianScheduleUpdate(technicianId: string) {
    try {
      const schedule = await this.techniciansService.getSchedule(technicianId, {
        start: new Date(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
      });

      // Broadcast to technician-specific room
      this.server.to(`technician:${technicianId}`).emit('technician:schedule_update', {
        technicianId,
        schedule,
        timestamp: new Date().toISOString(),
      });

      // Send to user-specific rooms
      const userSockets = this.websocketGateway.getUserSockets(technicianId);
      if (userSockets.length > 0) {
        userSockets.forEach(socket => {
          socket.emit('technician:schedule_update', {
            technicianId,
            schedule: {
              ...schedule,
              isYourSchedule: true,
            },
            timestamp: new Date().toISOString(),
          });
        });
      }

      this.logger.debug(`Broadcasted schedule update for technician ${technicianId}`);
    } catch (err) {
      this.logger.error(`Error broadcasting technician schedule update: ${err.message}`);
    }
  }

  async broadcastEquipmentStatusUpdate(equipmentId: string, newStatus: string, oldStatus: string) {
    try {
      const equipment = await this.equipmentService.findOne(equipmentId);

      const notificationData = {
        type: 'equipment_status_change',
        title: `Equipment Status Changed to ${newStatus}`,
        message: `Equipment ${equipment.name} (${equipment.equipmentNumber}) status changed from ${oldStatus} to ${newStatus}`,
        equipmentId,
        equipmentName: equipment.name,
        equipmentNumber: equipment.equipmentNumber,
        oldStatus,
        newStatus,
        updatedAt: new Date().toISOString(),
      };

      // Send notification to equipment owner
      if (equipment.ownerId) {
        this.broadcastNotification(equipment.ownerId, notificationData);
      }

      // Send notification to maintenance manager if available
      if (equipment.maintenanceManagerId) {
        this.broadcastNotification(equipment.maintenanceManagerId, notificationData);
      }

      // Broadcast the update
      this.broadcastEquipmentUpdate(equipmentId, 'status_change', {
        oldStatus,
        newStatus,
        changedAt: new Date().toISOString(),
      });

      this.logger.debug(`Broadcasted equipment status change for ${equipmentId} to ${newStatus}`);
    } catch (err) {
      this.logger.error(`Error broadcasting equipment status update: ${err.message}`);
    }
  }
}
```

### Client-Side WebSocket Integration

```typescript
// src/frontend/src/services/websocket.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { filter, map, shareReplay, takeUntil } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { Notification } from '../models/notification.model';
import { WorkOrderUpdate } from '../models/work-order-update.model';
import { TechnicianUpdate } from '../models/technician-update.model';
import { EquipmentUpdate } from '../models/equipment-update.model';
import { PresenceUpdate } from '../models/presence-update.model';
import { SystemMessage } from '../models/system-message.model';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second
  private maxReconnectDelay = 30000; // 30 seconds
  private reconnectTimer: any = null;
  private messageSubject = new Subject<WebSocketMessage>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  private subscribedRooms = new Set<string>();
  private pendingSubscriptions = new Set<string>();
  private pendingUnsubscriptions = new Set<string>();

  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public notifications$ = this.messageSubject.pipe(
    filter(msg => msg.type === 'notification'),
    map(msg => msg as Notification),
    shareReplay(1)
  );
  public workOrderUpdates$ = this.messageSubject.pipe(
    filter(msg => msg.type === 'workorder:update'),
    map(msg => msg as WorkOrderUpdate),
    shareReplay(1)
  );
  public technicianUpdates$ = this.messageSubject.pipe(
    filter(msg => msg.type === 'technician:update'),
    map(msg => msg as TechnicianUpdate),
    shareReplay(1)
  );
  public equipmentUpdates$ = this.messageSubject.pipe(
    filter(msg => msg.type === 'equipment:update'),
    map(msg => msg as EquipmentUpdate),
    shareReplay(1)
  );
  public presenceUpdates$ = this.messageSubject.pipe(
    filter(msg => msg.type === 'presence:update'),
    map(msg => msg as PresenceUpdate),
    shareReplay(1)
  );
  public systemMessages$ = this.messageSubject.pipe(
    filter(msg => msg.type === 'system:message'),
    map(msg => msg as SystemMessage),
    shareReplay(1)
  );

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.connect();
      } else {
        this.disconnect();
      }
    });

    // Handle beforeunload event
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  private connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.warn('No authentication token available');
      return;
    }

    const wsUrl = environment.wsUrl || this.getWebSocketUrl();
    const url = `${wsUrl}?token=${encodeURIComponent(token)}`;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
      this.connectionStatusSubject.next(true);

      // Resubscribe to all rooms after reconnection
      this.resubscribeToRooms();
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.messageSubject.next(message);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    this.socket.onclose = (event) => {
      this.connectionStatusSubject.next(false);

      if (event.wasClean) {
        console.log(`WebSocket connection closed cleanly, code=${event.code}, reason=${event.reason}`);
      } else {
        console.warn('WebSocket connection died, attempting to reconnect...');
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // The onclose callback will handle reconnection
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
        this.maxReconnectDelay
      );

      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Client initiated disconnect');
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.connectionStatusSubject.next(false);
    this.subscribedRooms.clear();
    this.pendingSubscriptions.clear();
    this.pendingUnsubscriptions.clear();
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }

  private sendMessage(message: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected, cannot send message');
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error sending WebSocket message:', err);
      return false;
    }
  }

  public subscribeToRooms(rooms: string[]): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // If not connected, store pending subscriptions
      rooms.forEach(room => this.pendingSubscriptions.add(room));
      return;
    }

    const newRooms = rooms.filter(room => !this.subscribedRooms.has(room));
    if (newRooms.length === 0) {
      return;
    }

    this.sendMessage({
      event: 'subscribe',
      data: {
        rooms: newRooms
      }
    });

    newRooms.forEach(room => {
      this.subscribedRooms.add(room);
      this.pendingSubscriptions.delete(room);
    });
  }

  public unsubscribeFromRooms(rooms: string[]): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // If not connected, store pending unsubscriptions
      rooms.forEach(room => this.pendingUnsubscriptions.add(room));
      return;
    }

    const existingRooms = rooms.filter(room => this.subscribedRooms.has(room));
    if (existingRooms.length === 0) {
      return;
    }

    this.sendMessage({
      event: 'unsubscribe',
      data: {
        rooms: existingRooms
      }
    });

    existingRooms.forEach(room => {
      this.subscribedRooms.delete(room);
      this.pendingUnsubscriptions.delete(room);
    });
  }

  private resubscribeToRooms(): void {
    if (this.subscribedRooms.size > 0) {
      this.sendMessage({
        event: 'subscribe',
        data: {
          rooms: Array.from(this.subscribedRooms)
        }
      });
    }

    // Process pending subscriptions
    if (this.pendingSubscriptions.size > 0) {
      this.subscribeToRooms(Array.from(this.pendingSubscriptions));
    }

    // Process pending unsubscriptions
    if (this.pendingUnsubscriptions.size > 0) {
      this.unsubscribeFromRooms(Array.from(this.pendingUnsubscriptions));
    }
  }

  public subscribeToWorkOrder(workOrderId: string): void {
    this.subscribeToRooms([`workorder:${workOrderId}`]);
  }

  public unsubscribeFromWorkOrder(workOrderId: string): void {
    this.unsubscribeFromRooms([`workorder:${workOrderId}`]);
  }

  public subscribeToTechnician(technicianId: string): void {
    this.subscribeToRooms([`technician:${technicianId}`]);
  }

  public unsubscribeFromTechnician(technicianId: string): void {
    this.unsubscribeFromRooms([`technician:${technicianId}`]);
  }

  public subscribeToEquipment(equipmentId: string): void {
    this.subscribeToRooms([`equipment:${equipmentId}`]);
  }

  public unsubscribeFromEquipment(equipmentId: string): void {
    this.unsubscribeFromRooms([`equipment:${equipmentId}`]);
  }

  public subscribeToUser(userId: string): void {
    this.subscribeToRooms([`user:${userId}`]);
  }

  public unsubscribeFromUser(userId: string): void {
    this.unsubscribeFromRooms([`user:${userId}`]);
  }

  public subscribeToSystem(): void {
    this.subscribeToRooms(['system:all', 'system:presence']);
  }

  public unsubscribeFromSystem(): void {
    this.unsubscribeFromRooms(['system:all', 'system:presence']);
  }

  public sendPing(): void {
    this.sendMessage({
      event: 'ping'
    });
  }

  public getSubscribedRooms(): string[] {
    return Array.from(this.subscribedRooms);
  }

  public isSubscribedToRoom(room: string): boolean {
    return this.subscribedRooms.has(room);
  }

  public getConnectionStatus(): boolean {
    return this.connectionStatusSubject.value;
  }

  // Helper methods for specific event types
  public getWorkOrderUpdatesForId(workOrderId: string): Observable<WorkOrderUpdate> {
    return this.workOrderUpdates$.pipe(
      filter(update => update.workOrderId === workOrderId)
    );
  }

  public getTechnicianUpdatesForId(technicianId: string): Observable<TechnicianUpdate> {
    return this.technicianUpdates$.pipe(
      filter(update => update.technicianId === technicianId)
    );
  }

  public getEquipmentUpdatesForId(equipmentId: string): Observable<EquipmentUpdate> {
    return this.equipmentUpdates$.pipe(
      filter(update => update.equipmentId === equipmentId)
    );
  }

  public getNotificationsForUser(userId: string): Observable<Notification> {
    return this.notifications$.pipe(
      filter(notification => notification.userId === userId)
    );
  }

  public getWorkOrderAssignments(): Observable<WorkOrderUpdate> {
    return this.workOrderUpdates$.pipe(
      filter(update =>
        update.eventType === 'assigned' &&
        update.data.isAssignedToYou
      )
    );
  }

  public getTechnicianScheduleUpdates(): Observable<TechnicianUpdate> {
    return this.technicianUpdates$.pipe(
      filter(update =>
        update.eventType === 'schedule_update' &&
        update.data.isYourSchedule
      )
    );
  }
}

// src/frontend/src/services/websocket.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { WebsocketService } from './websocket.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

describe('WebsocketService', () => {
  let service: WebsocketService;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let mockWebSocket: any;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken'], {
      isAuthenticated$: new BehaviorSubject<boolean>(true)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        WebsocketService,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(WebsocketService);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock WebSocket
    mockWebSocket = {
      send: jasmine.createSpy('send'),
      close: jasmine.createSpy('close'),
      readyState: WebSocket.OPEN,
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null
    };

    spyOn(window, 'WebSocket').and.returnValue(mockWebSocket);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should connect when authenticated', () => {
    authService.getToken.and.returnValue('test-token');
    service['connect']();

    expect(window.WebSocket).toHaveBeenCalled();
    expect(mockWebSocket.onopen).toBeDefined();
    expect(mockWebSocket.onmessage).toBeDefined();
    expect(mockWebSocket.onclose).toBeDefined();
    expect(mockWebSocket.onerror).toBeDefined();
  });

  it('should not connect when not authenticated', () => {
    authService.getToken.and.returnValue(null);
    service['connect']();

    expect(window.WebSocket).not.toHaveBeenCalled();
  });

  it('should handle WebSocket messages', () => {
    const testMessage = { type: 'test', data: 'test-data' };
    const messageSpy = jasmine.createSpy('messageSpy');
    service['messageSubject'].subscribe(messageSpy);

    service['connect']();
    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage({ data: JSON.stringify(testMessage) });
    }

    expect(messageSpy).toHaveBeenCalledWith(testMessage);
  });

  it('should handle connection status changes', () => {
    const statusSpy = jasmine.createSpy('statusSpy');
    service.connectionStatus$.subscribe(statusSpy);

    service['connect']();
    if (mockWebSocket.onopen) {
      mockWebSocket.onopen(new Event('open'));
    }

    expect(statusSpy).toHaveBeenCalledWith(true);

    if (mockWebSocket.onclose) {
      mockWebSocket.onclose({ wasClean: true, code: 1000, reason: 'Test' });
    }

    expect(statusSpy).toHaveBeenCalledWith(false);
  });

  it('should subscribe to rooms', () => {
    service['connect']();
    service.subscribeToRooms(['test-room']);

    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
      event: 'subscribe',
      data: { rooms: ['test-room'] }
    }));
  });

  it('should unsubscribe from rooms', () => {
    service['connect']();
    service.subscribeToRooms(['test-room']);
    service.unsubscribeFromRooms(['test-room']);

    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
      event: 'unsubscribe',
      data: { rooms: ['test-room'] }
    }));
  });

  it('should queue subscriptions when not connected', () => {
    service.subscribeToRooms(['test-room']);
    expect(service['pendingSubscriptions'].has('test-room')).toBeTrue();

    service['connect']();
    if (mockWebSocket.onopen) {
      mockWebSocket.onopen(new Event('open'));
    }

    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
      event: 'subscribe',
      data: { rooms: ['test-room'] }
    }));
    expect(service['pendingSubscriptions'].size).toBe(0);
  });

  it('should handle reconnection', () => {
    service['connect']();
    if (mockWebSocket.onclose) {
      mockWebSocket.onclose({ wasClean: false });
    }

    expect(service['reconnectAttempts']).toBe(1);
    jasmine.clock().tick(1000);
    expect(window.WebSocket).toHaveBeenCalledTimes(2);
  });

  it('should not reconnect after max attempts', () => {
    service['maxReconnectAttempts'] = 2;
    service['connect']();

    if (mockWebSocket.onclose) {
      mockWebSocket.onclose({ wasClean: false });
      jasmine.clock().tick(1000);
      mockWebSocket.onclose({ wasClean: false });
      jasmine.clock().tick(2000);
    }

    expect(service['reconnectAttempts']).toBe(2);
    expect(window.WebSocket).toHaveBeenCalledTimes(3);

    if (mockWebSocket.onclose) {
      mockWebSocket.onclose({ wasClean: false });
    }

    expect(service['reconnectAttempts']).toBe(2);
    expect(window.WebSocket).toHaveBeenCalledTimes(3);
  });
});

// src/frontend/src/components/real-time-notifications/real-time-notifications.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { Notification } from '../../models/notification.model';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-real-time-notifications',
  templateUrl: './real-time-notifications.component.html',
  styleUrls: ['./real-time-notifications.component.scss']
})
export class RealTimeNotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  private subscriptions = new Subscription();
  private userId: string | null = null;

  constructor(
    private websocketService: WebsocketService,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.userId = user?.id || null;
      this.setupWebSocketSubscriptions();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.websocketService.unsubscribeFromUser(this.userId || '');
  }

  private setupWebSocketSubscriptions(): void {
    if (!this.userId) return;

    // Subscribe to user-specific notifications
    this.websocketService.subscribeToUser(this.userId);

    // Handle incoming notifications
    this.subscriptions.add(
      this.websocketService.notifications$.subscribe(notification => {
        this.handleNotification(notification);
      })
    );

    // Handle work order assignments
    this.subscriptions.add(
      this.websocketService.getWorkOrderAssignments().subscribe(update => {
        this.showSnackBarNotification(
          'New Work Order Assigned',
          `${update.data.workOrderNumber}: ${update.data.title}`,
          `/work-orders/${update.workOrderId}`
        );
      })
    );

    // Handle work order status changes
    this.subscriptions.add(
      this.websocketService.workOrderUpdates$.subscribe(update => {
        if (update.eventType === 'status_change' && update.data.isAssignedToYou) {
          this.showSnackBarNotification(
            'Work Order Status Changed',
            `Status changed to ${update.data.newStatus}`,
            `/work-orders/${update.workOrderId}`
          );
        }
      })
    );
  }

  private handleNotification(notification: Notification): void {
    // Add to notifications list
    this.notifications.unshift(notification);
    if (this.notifications.length > 50) {
      this.notifications.pop();
    }

    // Update unread count
    if (!notification.read) {
      this.unreadCount++;
    }

    // Show snack bar for important notifications
    if (this.shouldShowSnackBar(notification)) {
      this.showSnackBarNotification(
        notification.title,
        notification.message,
        this.getNotificationRoute(notification)
      );
    }
  }

  private shouldShowSnackBar(notification: Notification): boolean {
    // Always show work order assignments and status changes
    if (notification.type === 'work_order_assigned' ||
        notification.type === 'work_order_status_change') {
      return true;
    }

    // Show high priority notifications
    if (notification.priority === 'high') {
      return true;
    }

    // Don't show if the user is already on the relevant page
    const currentUrl = this.router.url;
    const notificationRoute = this.getNotificationRoute(notification);
    return !currentUrl.includes(notificationRoute);
  }

  private showSnackBarNotification(title: string, message: string, route: string): void {
    this.snackBar.open(`${title}: ${message}`, 'View', {
      duration: 10000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    }).onAction().subscribe(() => {
      this.router.navigateByUrl(route);
    });
  }

  private getNotificationRoute(notification: Notification): string {
    switch (notification.type) {
      case 'work_order_assigned':
      case 'work_order_status_change':
        return `/work-orders/${notification.workOrderId}`;
      case 'equipment_status_change':
        return `/equipment/${notification.equipmentId}`;
      case 'maintenance_reminder':
        return `/work-orders?status=OPEN&dueDateFrom=${new Date().toISOString()}`;
      default:
        return '/notifications';
    }
  }

  markAsRead(notification: Notification): void {
    notification.read = true;
    this.unreadCount = Math.max(0, this.unreadCount - 1);
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.unreadCount = 0;
  }

  navigateToNotification(notification: Notification): void {
    this.markAsRead(notification);
    const route = this.getNotificationRoute(notification);
    this.router.navigateByUrl(route);
  }

  getNotificationIcon(notification: Notification): string {
    switch (notification.type) {
      case 'work_order_assigned':
        return 'assignment';
      case 'work_order_status_change':
        return 'update';
      case 'equipment_status_change':
        return 'build';
      case 'maintenance_reminder':
        return 'alarm';
      case 'system_alert':
        return 'warning';
      default:
        return 'notifications';
    }
  }

  getNotificationColor(notification: Notification): string {
    if (notification.priority === 'high') {
      return 'warn';
    }
    return 'primary';
  }
}
```

### Room/Channel Management

```typescript
// src/websocket/room-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import { TechniciansService } from '../technicians/technicians.service';
import { EquipmentService } from '../equipment/equipment.service';

@Injectable()
export class RoomManagerService {
  private readonly logger = new Logger(RoomManagerService.name);
  private readonly roomSubscriptions = new Map<string, Set<string>>();
  private readonly userRoomSubscriptions = new Map<string, Set<string>>();

  constructor(
    private readonly websocketGateway: WebsocketGateway,
    private readonly websocketService: WebsocketService,
    private readonly workOrdersService: WorkOrdersService,
    private readonly techniciansService: TechniciansService,
    private readonly equipmentService: EquipmentService,
  ) {}

  async subscribeUserToWorkOrder(userId: string, workOrderId: string): Promise<boolean> {
    try {
      // Verify the work order exists
      const workOrder = await this.workOrdersService.findOne(workOrderId);
      if (!workOrder) {
        this.logger.warn(`Work order ${workOrderId} not found`);
        return false;
      }

      const roomName = `workorder:${workOrderId}`;

      // Add to user's subscriptions
      this.addUserRoomSubscription(userId, roomName);

      // Get all sockets for this user and subscribe them
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      socketIds.forEach(socketId => {
        const socket = this.websocketGateway['connectedClients'].get(socketId);
        if (socket && socket.connected) {
          socket.join(roomName);
        }
      });

      this.logger.debug(`User ${userId} subscribed to work order ${workOrderId}`);
      return true;
    } catch (err) {
      this.logger.error(`Error subscribing user ${userId} to work order ${workOrderId}: ${err.message}`);
      return false;
    }
  }

  async unsubscribeUserFromWorkOrder(userId: string, workOrderId: string): Promise<boolean> {
    try {
      const roomName = `workorder:${workOrderId}`;

      // Remove from user's subscriptions
      this.removeUserRoomSubscription(userId, roomName);

      // Get all sockets for this user and unsubscribe them
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      socketIds.forEach(socketId => {
        const socket = this.websocketGateway['connectedClients'].get(socketId);
        if (socket && socket.connected) {
          socket.leave(roomName);
        }
      });

      this.logger.debug(`User ${userId} unsubscribed from work order ${workOrderId}`);
      return true;
    } catch (err) {
      this.logger.error(`Error unsubscribing user ${userId} from work order ${workOrderId}: ${err.message}`);
      return false;
    }
  }

  async subscribeUserToTechnician(userId: string, technicianId: string): Promise<boolean> {
    try {
      // Verify the technician exists
      const technician = await this.techniciansService.findOne(technicianId);
      if (!technician) {
        this.logger.warn(`Technician ${technicianId} not found`);
        return false;
      }

      const roomName = `technician:${technicianId}`;

      // Add to user's subscriptions
      this.addUserRoomSubscription(userId, roomName);

      // Get all sockets for this user and subscribe them
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      socketIds.forEach(socketId => {
        const socket = this.websocketGateway['connectedClients'].get(socketId);
        if (socket && socket.connected) {
          socket.join(roomName);
        }
      });

      this.logger.debug(`User ${userId} subscribed to technician ${technicianId}`);
      return true;
    } catch (err) {
      this.logger.error(`Error subscribing user ${userId} to technician ${technicianId}: ${err.message}`);
      return false;
    }
  }

  async unsubscribeUserFromTechnician(userId: string, technicianId: string): Promise<boolean> {
    try {
      const roomName = `technician:${technicianId}`;

      // Remove from user's subscriptions
      this.removeUserRoomSubscription(userId, roomName);

      // Get all sockets for this user and unsubscribe them
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      socketIds.forEach(socketId => {
        const socket = this.websocketGateway['connectedClients'].get(socketId);
        if (socket && socket.connected) {
          socket.leave(roomName);
        }
      });

      this.logger.debug(`User ${userId} unsubscribed from technician ${technicianId}`);
      return true;
    } catch (err) {
      this.logger.error(`Error unsubscribing user ${userId} from technician ${technicianId}: ${err.message}`);
      return false;
    }
  }

  async subscribeUserToEquipment(userId: string, equipmentId: string): Promise<boolean> {
    try {
      // Verify the equipment exists
      const equipment = await this.equipmentService.findOne(equipmentId);
      if (!equipment) {
        this.logger.warn(`Equipment ${equipmentId} not found`);
        return false;
      }

      const roomName = `equipment:${equipmentId}`;

      // Add to user's subscriptions
      this.addUserRoomSubscription(userId, roomName);

      // Get all sockets for this user and subscribe them
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      socketIds.forEach(socketId => {
        const socket = this.websocketGateway['connectedClients'].get(socketId);
        if (socket && socket.connected) {
          socket.join(roomName);
        }
      });

      this.logger.debug(`User ${userId} subscribed to equipment ${equipmentId}`);
      return true;
    } catch (err) {
      this.logger.error(`Error subscribing user ${userId} to equipment ${equipmentId}: ${err.message}`);
      return false;
    }
  }

  async unsubscribeUserFromEquipment(userId: string, equipmentId: string): Promise<boolean> {
    try {
      const roomName = `equipment:${equipmentId}`;

      // Remove from user's subscriptions
      this.removeUserRoomSubscription(userId, roomName);

      // Get all sockets for this user and unsubscribe them
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      socketIds.forEach(socketId => {
        const socket = this.websocketGateway['connectedClients'].get(socketId);
        if (socket && socket.connected) {
          socket.leave(roomName);
        }
      });

      this.logger.debug(`User ${userId} unsubscribed from equipment ${equipmentId}`);
      return true;
    } catch (err) {
      this.logger.error(`Error unsubscribing user ${userId} from equipment ${equipmentId}: ${err.message}`);
      return false;
    }
  }

  async subscribeUserToSystem(userId: string): Promise<boolean> {
    try {
      const systemRooms = ['system:all', 'system:presence'];

      // Add to user's subscriptions
      systemRooms.forEach(room => {
        this.addUserRoomSubscription(userId, room);
      });

      // Get all sockets for this user and subscribe them
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      socketIds.forEach(socketId => {
        const socket = this.websocketGateway['connectedClients'].get(socketId);
        if (socket && socket.connected) {
          systemRooms.forEach(room => {
            socket.join(room);
          });
        }
      });

      this.logger.debug(`User ${userId} subscribed to system rooms`);
      return true;
    } catch (err) {
      this.logger.error(`Error subscribing user ${userId} to system rooms: ${err.message}`);
      return false;
    }
  }

  async unsubscribeUserFromSystem(userId: string): Promise<boolean> {
    try {
      const systemRooms = ['system:all', 'system:presence'];

      // Remove from user's subscriptions
      systemRooms.forEach(room => {
        this.removeUserRoomSubscription(userId, room);
      });

      // Get all sockets for this user and unsubscribe them
      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      socketIds.forEach(socketId => {
        const socket = this.websocketGateway['connectedClients'].get(socketId);
        if (socket && socket.connected) {
          systemRooms.forEach(room => {
            socket.leave(room);
          });
        }
      });

      this.logger.debug(`User ${userId} unsubscribed from system rooms`);
      return true;
    } catch (err) {
      this.logger.error(`Error unsubscribing user ${userId} from system rooms: ${err.message}`);
      return false;
    }
  }

  async resubscribeUser(userId: string): Promise<void> {
    try {
      const userSubscriptions = this.userRoomSubscriptions.get(userId);
      if (!userSubscriptions || userSubscriptions.size === 0) {
        return;
      }

      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      if (socketIds.length === 0) {
        return;
      }

      const rooms = Array.from(userSubscriptions);

      // Get all connected sockets for this user
      const connectedSockets = socketIds
        .map(socketId => this.websocketGateway['connectedClients'].get(socketId))
        .filter(socket => socket && socket.connected);

      // Subscribe each socket to all rooms
      connectedSockets.forEach(socket => {
        rooms.forEach(room => {
          socket.join(room);
        });
      });

      this.logger.debug(`Resubscribed user ${userId} to ${rooms.length} rooms`);
    } catch (err) {
      this.logger.error(`Error resubscribing user ${userId}: ${err.message}`);
    }
  }

  async unsubscribeUserFromAll(userId: string): Promise<void> {
    try {
      const userSubscriptions = this.userRoomSubscriptions.get(userId);
      if (!userSubscriptions || userSubscriptions.size === 0) {
        return;
      }

      const socketIds = this.websocketGateway.getUserSocketIds(userId);
      if (socketIds.length === 0) {
        return;
      }

      const rooms = Array.from(userSubscriptions);

      // Get all connected sockets for this user
      const connectedSockets = socketIds
        .map(socketId => this.websocketGateway['connectedClients'].get(socketId))
        .filter(socket => socket && socket.connected);

      // Unsubscribe each socket from all rooms
      connectedSockets.forEach(socket => {
        rooms.forEach(room => {
          socket.leave(room);
        });
      });

      // Clear user's subscriptions
      this.userRoomSubscriptions.delete(userId);

      this.logger.debug(`Unsubscribed user ${userId} from all rooms`);
    } catch (err) {
      this.logger.error(`Error unsubscribing user ${userId} from all rooms: ${err.message}`);
    }
  }

  async getUserSubscriptions(userId: string): Promise<string[]> {
    const subscriptions = this.userRoomSubscriptions.get(userId);
    return subscriptions ? Array.from(subscriptions) : [];
  }

  async getRoomSubscribers(room: string): Promise<string[]> {
    const subscribers = this.roomSubscriptions.get(room);
    return subscribers ? Array.from(subscribers) : [];
  }

  private addUserRoomSubscription(userId: string, room: string): void {
    if (!this.userRoomSubscriptions.has(userId)) {
      this.userRoomSubscriptions.set(userId, new Set());
    }
    this.userRoomSubscriptions.get(userId)?.add(room);

    // Track room subscriptions
    if (!this.roomSubscriptions.has(room)) {
      this.roomSubscriptions.set(room, new Set());
    }
    this.roomSubscriptions.get(room)?.add(userId);
  }

  private removeUserRoomSubscription(userId: string, room: string): void {
    if (this.userRoomSubscriptions.has(userId)) {
      this.userRoomSubscriptions.get(userId)?.delete(room);
      if (this.userRoomSubscriptions.get(userId)?.size === 0) {
        this.userRoomSubscriptions.delete(userId);
      }
    }

    // Update room subscriptions
    if (this.roomSubscriptions.has(room)) {
      this.roomSubscriptions.get(room)?.delete(userId);
      if (this.roomSubscriptions.get(room)?.size === 0) {
        this.roomSubscriptions.delete(room);
      }
    }
  }

  async getWorkOrderSubscribers(workOrderId: string): Promise<string[]> {
    const roomName = `workorder:${workOrderId}`;
    return this.getRoomSubscribers(roomName);
  }

  async getTechnicianSubscribers(technicianId: string): Promise<string[]> {
    const roomName = `technician:${technicianId}`;
    return this.getRoomSubscribers(roomName);
  }

  async getEquipmentSubscribers(equipmentId: string): Promise<string[]> {
    const roomName = `equipment:${equipmentId}`;
    return this.getRoomSubscribers(roomName);
  }

  async getSystemRoomSubscribers(): Promise<string[]> {
    const allSubscribers = new Set<string>();

    // Get subscribers for all system rooms
    const systemRooms = ['system:all', 'system:presence'];
    systemRooms.forEach(room => {
      const subscribers = this.roomSubscriptions.get(room);
      if (subscribers) {
        subscribers.forEach(userId => allSubscribers.add(userId));
      }
    });

    return Array.from(allSubscribers);
  }

  async broadcastToRoom(room: string, event: string, data: any): Promise<void> {
    try {
      this.websocketService['server'].to(room).emit(event, data);
      this.logger.debug(`Broadcasted ${event} to room ${room}`);
    } catch (err) {
      this.logger.error(`Error broadcasting to room ${room}: ${err.message}`);
    }
  }

  async broadcastToWorkOrder(workOrderId: string, event: string, data: any): Promise<void> {
    const roomName = `workorder:${workOrderId}`;
    await this.broadcastToRoom(roomName, event, data);
  }

  async broadcastToTechnician(technicianId: string, event: string, data: any): Promise<void> {
    const roomName = `technician:${technicianId}`;
    await this.broadcastToRoom(roomName, event, data);
  }

  async broadcastToEquipment(equipmentId: string, event: string, data: any): Promise<void> {
    const roomName = `equipment:${equipmentId}`;
    await this.broadcastToRoom(roomName, event, data);
  }

  async broadcastToUser(userId: string, event: string, data: any): Promise<void> {
    const roomName = `user:${userId}`;
    await this.broadcastToRoom(roomName, event, data);
  }

  async broadcastToSystem(event: string, data: any): Promise<void> {
    await this.broadcastToRoom('system:all', event, data);
  }

  async getRoomSize(room: string): Promise<number> {
    try {
      const sockets = await this.websocketService['server'].in(room).fetchSockets();
      return sockets.length;
    } catch (err) {
      this.logger.error(`Error getting room size for ${room}: ${err.message}`);
      return 0;
    }
  }

  async getWorkOrderRoomSize(workOrderId: string): Promise<number> {
    const roomName = `workorder:${workOrderId}`;
    return this.getRoomSize(roomName);
  }

  async getTechnicianRoomSize(technicianId: string): Promise<number> {
    const roomName = `technician:${technicianId}`;
    return this.getRoomSize(roomName);
  }

  async getEquipmentRoomSize(equipmentId: string): Promise<number> {
    const roomName = `equipment:${equipmentId}`;
    return this.getRoomSize(roomName);
  }
}
```

### Reconnection Logic

```typescript
// src/websocket/reconnection.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { RoomManagerService } from './room-manager.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReconnectionService {
  private readonly logger = new Logger(ReconnectionService.name);
  private readonly disconnectedUsers = new Map<string, number>();
  private readonly maxDisconnectionTime = 3600000; // 1 hour in milliseconds

  constructor(
    private readonly websocketGateway: WebsocketGateway,
    private readonly roomManager: RoomManagerService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleDisconnectedUsers() {
    try {
      const now = Date.now();
      const usersToRemove: string[] = [];

      // Check all disconnected users
      this.disconnectedUsers.forEach((disconnectedAt, userId) => {
        if (now - disconnectedAt > this.maxDisconnectionTime) {
          usersToRemove.push(userId);
        }
      });

      // Remove users who have been disconnected too long
      usersToRemove.forEach(userId => {
        this.disconnectedUsers.delete(userId);
        this.roomManager.unsubscribeUserFromAll(userId);
        this.logger.log(`Removed user ${userId} from tracking after prolonged disconnection`);
      });

      // Check for users who might have reconnected
      const connectedUsers = new Set<string>();
      this.websocketGateway['connectedClients'].forEach((socket, socketId) => {
        if (socket.connected) {
          const userId = this.getUserIdFromSocket(socketId);
          if (userId) {
            connectedUsers.add(userId);
          }
        }
      });

      // Remove from disconnected list if user has reconnected
      this.disconnectedUsers.forEach((_, userId) => {
        if (connectedUsers.has(userId)) {
          this.disconnectedUsers.delete(userId);
          this.logger.debug(`User ${userId} has reconnected, removing from disconnected list`);
        }
      });
    } catch (err) {
      this.logger.error(`Error in disconnected users handler: ${err.message}`);
    }
  }

  handleUserDisconnection(userId: string): void {
    if (!this.disconnectedUsers.has(userId)) {
      this.disconnectedUsers.set(userId, Date.now());
      this.logger.debug(`User ${userId} marked as disconnected`);
    }
  }

  async handleUserReconnection(userId: string): Promise<void> {
    try {
      // Remove from disconnected list
      this.disconnectedUsers.delete(userId);

      // Resubscribe to all rooms
      await this.roomManager.resubscribeUser(userId);

      this.logger.log(`User ${userId} reconnected and resubscribed to rooms`);
    } catch (err) {
      this.logger.error(`Error handling user reconnection for ${userId}: ${err.message}`);
    }
  }

  private getUserIdFromSocket(socketId: string): string | null {
    for (const [userId, socketIds] of this.websocketGateway['userIdToSocketIds'].entries()) {
      if (socketIds.has(socketId)) {
        return userId;
      }
    }
    return null;
  }

  async getDisconnectedUsers(): Promise<Array<{ userId: string; disconnectedAt: Date }>> {
    const result: Array<{ userId: string; disconnectedAt: Date }> = [];

    this.disconnectedUsers.forEach((disconnectedAt, userId) => {
      result.push({
        userId,
        disconnectedAt: new Date(disconnectedAt),
      });
    });

    return result;
  }

  async getReconnectionStatus(userId: string): Promise<{
    isDisconnected: boolean;
    disconnectedAt?: Date;
    timeDisconnected?: number;
  }> {
    if (!this.disconnectedUsers.has(userId)) {
      return { isDisconnected: false };
    }

    const disconnectedAt = this.disconnectedUsers.get(userId) || 0;
    const timeDisconnected = Date.now() - disconnectedAt;

    return {
      isDisconnected: true,
      disconnectedAt: new Date(disconnectedAt),
      timeDisconnected,
    };
  }

  async attemptReconnectionForUser(userId: string): Promise<boolean> {
    try {
      // Check if user is actually disconnected
      const status = await this.getReconnectionStatus(userId);
      if (!status.isDisconnected) {
        return true;
      }

      // In a real implementation, this would attempt to reconnect
      // For this example, we'll just log and return success
      this.logger.log(`Attempting reconnection for user ${userId}`);
      return true;
    } catch (err) {
      this.logger.error(`Error attempting reconnection for user ${userId}: ${err.message}`);
      return false;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkForStaleConnections() {
    try {
      const now = Date.now();
      const staleThreshold = this.configService.get<number>('STALE_CONNECTION_THRESHOLD') || 300000; // 5 minutes

      this.websocketGateway['connectedClients'].forEach((socket, socketId) => {
        if (socket.connected) {
          // Check last activity time (simplified - in real app you'd track this)
          const lastActivity = socket['lastActivityTime'] || now;
          if (now - lastActivity > staleThreshold) {
            this.logger.warn(`Closing stale connection for socket ${socketId}`);
            socket.close(1001, 'Connection timed out');
          }
        }
      });
    } catch (err) {
      this.logger.error(`Error checking for stale connections: ${err.message}`);
    }
  }

  async notifyDisconnectedUsers(): Promise<void> {
    try {
      const disconnectedUsers = await this.getDisconnectedUsers();
      if (disconnectedUsers.length === 0) {
        return;
      }

      // In a real implementation, you might send emails or push notifications
      // For this example, we'll just log
      this.logger.log(`Notifying ${disconnectedUsers.length} disconnected users`);

      // Broadcast to system that users are disconnected
      this.roomManager.broadcastToSystem('system:disconnected_users', {
        count: disconnectedUsers.length,
        users: disconnectedUsers.map(user => ({
          userId: user.userId,
          disconnectedAt: user.disconnectedAt,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      this.logger.error(`Error notifying disconnected users: ${err.message}`);
    }
  }

  async getReconnectionStatistics(): Promise<{
    totalDisconnectedUsers: number;
    averageDisconnectionTime: number;
    longestDisconnectionTime: number;
    shortestDisconnectionTime: number;
  }> {
    const disconnectedUsers = Array.from(this.disconnectedUsers.entries());
    if (disconnectedUsers.length === 0) {
      return {
        totalDisconnectedUsers: 0,
        averageDisconnectionTime: 0,
        longestDisconnectionTime: 0,
        shortestDisconnectionTime: 0,
      };
    }

    const now = Date.now();
    const disconnectionTimes = disconnectedUsers.map(([_, disconnectedAt]) =>
      now - disconnectedAt
    );

    const total = disconnectionTimes.reduce((sum, time) => sum + time, 0);
    const average = total / disconnectionTimes.length;
    const longest = Math.max(...disconnectionTimes);
    const shortest = Math.min(...disconnectionTimes);

    return {
      totalDisconnectedUsers: disconnectedUsers.length,
      averageDisconnectionTime: average,
      longestDisconnectionTime: longest,
      shortestDisconnectionTime: shortest,
    };
  }
}

// src/websocket/websocket.gateway.ts (updated with reconnection logic)
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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ReconnectionService } from './reconnection.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly connectedClients = new Map<string, Socket>();
  private readonly userIdToSocketIds = new Map<string, Set<string>>();

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reconnectionService: ReconnectionService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.websocketService.setServer(server);

    // Set up periodic cleanup of disconnected clients
    setInterval(() => {
      this.cleanupDisconnectedClients();
    }, 300000); // Every 5 minutes
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.debug(`Client connected: ${client.id}`);

      // Track last activity time
      client['lastActivityTime'] = Date.now();

      // Authenticate the client
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.authService.validateUser(payload);
      if (!user) {
        this.logger.warn(`Client ${client.id} connected with invalid token`);
        client.disconnect(true);
        return;
      }

      // Store client information
      this.connectedClients.set(client.id, client);
      this.addUserSocket(user.id, client.id);

      // Join user-specific room
      client.join(`user:${user.id}`);

      // Join role-specific rooms
      if (user.roles) {
        user.roles.forEach(role => {
          client.join(`role:${role}`);
        });
      }

      this.logger.log(`Client ${client.id} authenticated as user ${user.id} (${user.email})`);

      // Handle reconnection
      await this.reconnectionService.handleUserReconnection(user.id);

      // Send connection confirmation
      client.emit('connection:confirm', {
        success: true,
        message: 'Connected to real-time service',
        userId: user.id,
        timestamp: new Date().toISOString(),
        reconnected: true,
      });

      // Send initial presence update
      this.websocketService.broadcastPresenceUpdate();
    } catch (err) {
      this.logger.error(`Error during client connection: ${err.message}`);
      client.emit('error', {
        type: 'authentication_error',
        message: 'Authentication failed',
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);

    // Get user ID before removing the client
    const userId = this.getUserIdFromSocket(client.id);

    // Remove client from tracking
    this.connectedClients.delete(client.id);

    // Remove from user mapping
    this.userIdToSocketIds.forEach((socketIds, uid) => {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.userIdToSocketIds.delete(uid);
      }
    });

    // Handle user disconnection if no more sockets
    if (userId && !this.userIdToSocketIds.has(userId)) {
      this.reconnectionService.handleUserDisconnection(userId);
    }

    // Broadcast presence update
    this.websocketService.broadcastPresenceUpdate();
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data.rooms || !Array.isArray(data.rooms)) {
        throw new Error('Invalid rooms format');
      }

      // Validate room names
      const validRooms = data.rooms.filter(room =>
        this.websocketService.isValidRoom(room),
      );

      if (validRooms.length === 0) {
        throw new Error('No valid rooms provided');
      }

      // Join the rooms
      validRooms.forEach(room => {
        client.join(room);
      });

      // Update last activity time
      client['lastActivityTime'] = Date.now();

      this.logger.debug(`Client ${client.id} subscribed to rooms: ${validRooms.join(', ')}`);

      return {
        success: true,
        message: `Subscribed to ${validRooms.length} rooms`,
        rooms: validRooms,
      };
    } catch (err) {
      this.logger.error(`Subscription error for client ${client.id}: ${err.message}`);
      return {
        success: false,
        message: err.message,
      };
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data.rooms || !Array.isArray(data.rooms)) {
        throw new Error('Invalid rooms format');
      }

      // Leave the rooms
      data.rooms.forEach(room => {
        client.leave(room);
      });

      // Update last activity time
      client['lastActivityTime'] = Date.now();

      this.logger.debug(`Client ${client.id} unsubscribed from rooms: ${data.rooms.join(', ')}`);

      return {
        success: true,
        message: `Unsubscribed from ${data.rooms.length} rooms`,
        rooms: data.rooms,
      };
    } catch (err) {
      this.logger.error(`Unsubscription error for client ${client.id}: ${err.message}`);
      return {
        success: false,
        message: err.message,
      };
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client['lastActivityTime'] = Date.now();
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
    });
  }

  @SubscribeMessage('reconnect')
  async handleReconnect(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data.token) {
        throw new Error('Token is required for reconnection');
      }

      const payload = await this.jwtService.verifyAsync(data.token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.authService.validateUser(payload);
      if (!user) {
        throw new Error('Invalid token');
      }

      // If the client is already authenticated, just update the token
      const existingUserId = this.getUserIdFromSocket(client.id);
      if (existingUserId && existingUserId === user.id) {
