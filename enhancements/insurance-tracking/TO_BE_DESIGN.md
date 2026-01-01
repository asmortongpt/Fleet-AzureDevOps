# TO_BE_DESIGN.md: Insurance-Tracking Module - Next-Generation System Architecture

## Executive Vision (120 lines)

### Strategic Transformation Goals

The enhanced insurance-tracking module represents a paradigm shift in how insurance organizations manage policies, claims, and customer relationships. This transformation aligns with four strategic pillars:

1. **Customer-Centric Digital Experience**: Moving from transactional interactions to relationship-based engagement through personalized, proactive service delivery. The system will anticipate customer needs through predictive analytics and deliver tailored recommendations at each touchpoint.

2. **Operational Excellence**: Automating 80% of routine processes while maintaining human oversight for complex decisions. This includes straight-through processing for standard claims, automated underwriting for low-risk policies, and AI-driven fraud detection.

3. **Data-Driven Decision Making**: Transitioning from historical reporting to real-time predictive analytics. The system will provide actionable insights at every level - from front-line agents to C-suite executives - with role-specific dashboards and alerts.

4. **Ecosystem Integration**: Creating a platform that seamlessly connects with partners, third-party data providers, and regulatory bodies. This includes open APIs for insurtech startups, direct integrations with healthcare providers, and automated compliance reporting.

### Business Transformation Outcomes

**Revenue Growth:**
- 15-20% increase in policy sales through personalized recommendations
- 10-15% reduction in customer churn via proactive retention strategies
- 25% faster time-to-market for new insurance products

**Cost Reduction:**
- 30% reduction in claims processing costs through automation
- 40% decrease in fraud-related losses via AI detection
- 25% lower customer service costs through self-service capabilities

**Risk Management:**
- 50% improvement in risk assessment accuracy
- 30% reduction in underwriting cycle time
- 20% decrease in regulatory compliance violations

### User Experience Revolution

The new system will transform user experiences across all personas:

**Policyholders:**
- Unified digital wallet for all insurance products
- Proactive risk mitigation advice based on IoT data
- AI-powered claims assistant available 24/7
- Gamified health and safety programs with rewards
- Voice-enabled interactions for hands-free management

**Agents/Brokers:**
- Augmented reality property assessment tools
- Predictive lead scoring and next-best-action recommendations
- Virtual collaboration spaces for complex cases
- Automated document generation and e-signature workflows
- Real-time commission tracking and performance analytics

**Underwriters:**
- AI-assisted risk assessment with explainable decisions
- Automated document verification and data extraction
- Collaborative underwriting workspaces
- Portfolio risk visualization tools
- Regulatory change impact analysis

**Claims Adjusters:**
- Computer vision for damage assessment
- Automated repair cost estimation
- Fraud detection heatmaps
- Virtual inspection capabilities
- Predictive claim duration forecasting

**Executives:**
- Real-time enterprise risk exposure dashboard
- Predictive market trend analysis
- Competitive benchmarking tools
- Scenario modeling for strategic decisions
- Automated regulatory reporting

### Competitive Advantages

1. **First-Mover in AI-Powered Insurance**: Leveraging proprietary machine learning models trained on 20+ years of claims data to provide unmatched risk assessment accuracy.

2. **Hyper-Personalization Engine**: Dynamic product bundling and pricing based on individual risk profiles, behavior patterns, and life events.

3. **Seamless Omnichannel Experience**: Consistent experience across web, mobile, voice assistants, and physical locations with real-time data synchronization.

4. **Proactive Risk Management**: IoT integration for real-time monitoring of insured assets (homes, vehicles, health) with automated alerts and preventive recommendations.

5. **Regulatory Technology Leadership**: Automated compliance monitoring with predictive violation detection and self-correcting workflows.

6. **Ecosystem Platform**: Open API marketplace enabling third-party developers to build innovative insurance applications on our platform.

### Long-Term Roadmap (2024-2028)

**2024: Foundation Phase**
- Core system migration to microservices architecture
- Implementation of real-time data processing pipeline
- Launch of basic PWA with offline capabilities
- Initial AI/ML models for claims processing
- First version of gamification system

**2025: Intelligence Phase**
- Advanced predictive analytics for all business lines
- Full IoT integration for property and auto insurance
- AI-powered virtual assistant for customer service
- Blockchain for smart contracts and fraud prevention
- Expanded third-party integrations

**2026: Ecosystem Phase**
- Insurance marketplace platform launch
- Developer API portal with sandbox environment
- Partner program for insurtech startups
- Cross-industry data partnerships
- First autonomous insurance products

**2027: Autonomous Phase**
- Self-learning AI that improves without human intervention
- Fully autonomous claims processing for simple cases
- Dynamic pricing that adjusts in real-time
- Predictive underwriting with 95%+ accuracy
- Global expansion with localized products

**2028: Transformation Phase**
- Cognitive insurance advisor with emotional intelligence
- Quantum computing for complex risk modeling
- Neuro-insurance products based on brainwave patterns
- Autonomous drone fleets for risk assessment
- Insurance-as-a-Service platform for non-insurance businesses

### Organizational Impact

**Cultural Transformation:**
- Shift from product-centric to customer-centric mindset
- Data literacy programs for all employees
- Agile methodology adoption across all departments
- Innovation labs for continuous experimentation

**Process Transformation:**
- End-to-end digital workflows with minimal manual intervention
- Real-time performance monitoring and continuous improvement
- Automated quality assurance for all customer interactions
- Predictive staffing based on workload forecasting

**Technology Transformation:**
- Cloud-native architecture with multi-cloud strategy
- Zero-trust security model
- Event-driven microservices architecture
- AI/ML operations pipeline for continuous model improvement
- Edge computing for real-time data processing

### Success Metrics

**Business Metrics:**
- 30% increase in customer lifetime value
- 25% reduction in combined operating ratio
- 40% faster claims settlement
- 20% increase in cross-sell/upsell rates
- 15% improvement in Net Promoter Score

**Technical Metrics:**
- 99.99% system availability
- <100ms API response times
- 95% test coverage
- <1% error rates
- 100% compliance with WCAG 2.1 AAA

**Customer Metrics:**
- 80% digital adoption rate
- 70% reduction in call center volume
- 60% increase in mobile app engagement
- 50% improvement in first-contact resolution
- 40% increase in policyholder retention

## Performance Enhancements (300 lines)

### Redis Caching Layer Implementation

```typescript
// src/cache/redis-cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { promisify } from 'util';
import { CacheKeyGenerator } from './cache-key-generator.service';
import { CacheTTL } from './enums/cache-ttl.enum';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly redisClient: Redis;
  private readonly getAsync: (key: string) => Promise<string | null>;
  private readonly setexAsync: (key: string, ttl: number, value: string) => Promise<'OK'>;
  private readonly delAsync: (key: string) => Promise<number>;
  private readonly keysAsync: (pattern: string) => Promise<string[]>;

  constructor(
    private configService: ConfigService,
    private cacheKeyGenerator: CacheKeyGenerator
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');
    const redisPort = this.configService.get<number>('REDIS_PORT');
    const redisHost = this.configService.get<string>('REDIS_HOST');

    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      tls: redisUrl?.startsWith('rediss://') ? {} : undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(`Redis connection retry attempt ${times}, next in ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        this.logger.error(`Redis reconnection error: ${err.message}`);
        return true;
      }
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis client connected successfully');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.redisClient.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    // Promisify Redis methods
    this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
    this.setexAsync = promisify(this.redisClient.setex).bind(this.redisClient);
    this.delAsync = promisify(this.redisClient.del).bind(this.redisClient);
    this.keysAsync = promisify(this.redisClient.keys).bind(this.redisClient);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const generatedKey = this.cacheKeyGenerator.generate(key);
      const cachedData = await this.getAsync(generatedKey);

      if (!cachedData) {
        this.logger.debug(`Cache miss for key: ${generatedKey}`);
        return null;
      }

      this.logger.debug(`Cache hit for key: ${generatedKey}`);
      return JSON.parse(cachedData) as T;
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: CacheTTL | number = CacheTTL.SHORT): Promise<void> {
    try {
      const generatedKey = this.cacheKeyGenerator.generate(key);
      const stringValue = JSON.stringify(value);
      const ttlValue = typeof ttl === 'number' ? ttl : this.getTTLValue(ttl);

      await this.setexAsync(generatedKey, ttlValue, stringValue);
      this.logger.debug(`Cache set for key: ${generatedKey} with TTL: ${ttlValue}`);
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}: ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const generatedKey = this.cacheKeyGenerator.generate(key);
      await this.delAsync(generatedKey);
      this.logger.debug(`Cache deleted for key: ${generatedKey}`);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}: ${error.message}`);
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const generatedPattern = this.cacheKeyGenerator.generate(pattern);
      const keys = await this.keysAsync(`${generatedPattern}*`);

      if (keys.length > 0) {
        await this.delAsync(keys);
        this.logger.debug(`Deleted ${keys.length} cache entries matching pattern: ${generatedPattern}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting cache by pattern ${pattern}: ${error.message}`);
    }
  }

  async getWithFallback<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    ttl: CacheTTL | number = CacheTTL.SHORT
  ): Promise<T> {
    try {
      const cachedData = await this.get<T>(key);

      if (cachedData !== null) {
        return cachedData;
      }

      this.logger.debug(`Executing fallback function for key: ${key}`);
      const freshData = await fallbackFn();
      await this.set(key, freshData, ttl);

      return freshData;
    } catch (error) {
      this.logger.error(`Error in getWithFallback for key ${key}: ${error.message}`);
      return fallbackFn();
    }
  }

  async getMulti<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const generatedKeys = keys.map(key => this.cacheKeyGenerator.generate(key));
      const results = await Promise.all(generatedKeys.map(key => this.getAsync(key)));

      return results.reduce((acc, result, index) => {
        acc[keys[index]] = result ? JSON.parse(result) as T : null;
        return acc;
      }, {} as Record<string, T | null>);
    } catch (error) {
      this.logger.error(`Error in getMulti: ${error.message}`);
      return keys.reduce((acc, key) => {
        acc[key] = null;
        return acc;
      }, {} as Record<string, T | null>);
    }
  }

  private getTTLValue(ttl: CacheTTL): number {
    const ttlMap = {
      [CacheTTL.SHORT]: 300,    // 5 minutes
      [CacheTTL.MEDIUM]: 1800,  // 30 minutes
      [CacheTTL.LONG]: 86400,   // 24 hours
      [CacheTTL.VERY_LONG]: 604800 // 7 days
    };

    return ttlMap[ttl] || ttlMap[CacheTTL.MEDIUM];
  }

  async flushAll(): Promise<void> {
    try {
      await this.redisClient.flushall();
      this.logger.log('All Redis cache flushed');
    } catch (error) {
      this.logger.error(`Error flushing Redis cache: ${error.message}`);
    }
  }

  async getCacheStats(): Promise<{
    keys: number;
    memoryUsage: string;
    connectedClients: number;
  }> {
    try {
      const [keys, memoryInfo, clients] = await Promise.all([
        this.redisClient.dbsize(),
        this.redisClient.info('memory'),
        this.redisClient.client('list')
      ]);

      const usedMemory = memoryInfo.split('\r\n')
        .find(line => line.startsWith('used_memory:'))
        ?.split(':')[1] || '0';

      return {
        keys: keys,
        memoryUsage: `${Math.round(parseInt(usedMemory) / 1024 / 1024 * 100) / 100} MB`,
        connectedClients: clients.split('\n').length - 1
      };
    } catch (error) {
      this.logger.error(`Error getting cache stats: ${error.message}`);
      return {
        keys: 0,
        memoryUsage: '0 MB',
        connectedClients: 0
      };
    }
  }

  async close(): Promise<void> {
    try {
      await this.redisClient.quit();
      this.logger.log('Redis client connection closed');
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
import { Repository, SelectQueryBuilder, Brackets, In } from 'typeorm';
import { Policy } from '../policies/entities/policy.entity';
import { Claim } from '../claims/entities/claim.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Agent } from '../agents/entities/agent.entity';
import { QueryOptimizationConfig } from './interfaces/query-optimization-config.interface';
import { QueryPerformanceTracker } from './query-performance-tracker.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { CacheTTL } from '../cache/enums/cache-ttl.enum';

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);

  constructor(
    @InjectRepository(Policy)
    private policyRepository: Repository<Policy>,
    @InjectRepository(Claim)
    private claimRepository: Repository<Claim>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    private cacheService: RedisCacheService,
    private performanceTracker: QueryPerformanceTracker
  ) {}

  async optimizePolicyQuery(
    config: QueryOptimizationConfig,
    relations: string[] = []
  ): Promise<Policy[]> {
    const { customerId, agentId, status, productType, dateRange, limit, offset } = config;
    const cacheKey = this.generateCacheKey('policies', config);

    return this.cacheService.getWithFallback(cacheKey, async () => {
      const query = this.policyRepository.createQueryBuilder('policy')
        .leftJoinAndSelect('policy.customer', 'customer')
        .leftJoinAndSelect('policy.agent', 'agent')
        .leftJoinAndSelect('policy.product', 'product');

      this.applyCommonFilters(query, config);

      if (customerId) {
        query.andWhere('policy.customerId = :customerId', { customerId });
      }

      if (agentId) {
        query.andWhere('policy.agentId = :agentId', { agentId });
      }

      if (productType) {
        query.andWhere('product.type = :productType', { productType });
      }

      if (relations.includes('claims')) {
        query.leftJoinAndSelect('policy.claims', 'claims');
      }

      if (relations.includes('payments')) {
        query.leftJoinAndSelect('policy.payments', 'payments');
      }

      if (relations.includes('documents')) {
        query.leftJoinAndSelect('policy.documents', 'documents');
      }

      query.orderBy('policy.effectiveDate', 'DESC')
        .skip(offset)
        .take(limit);

      const startTime = performance.now();
      const results = await query.getMany();
      const executionTime = performance.now() - startTime;

      this.performanceTracker.trackQuery('policy', executionTime, query.getQueryAndParameters());

      return results;
    }, CacheTTL.MEDIUM);
  }

  async optimizeComplexClaimQuery(
    config: QueryOptimizationConfig & {
      claimTypes?: string[];
      severityLevels?: string[];
      claimStatuses?: string[];
      involvedParties?: string[];
    }
  ): Promise<Claim[]> {
    const { claimTypes, severityLevels, claimStatuses, involvedParties } = config;
    const cacheKey = this.generateCacheKey('claims', config);

    return this.cacheService.getWithFallback(cacheKey, async () => {
      const query = this.claimRepository.createQueryBuilder('claim')
        .leftJoinAndSelect('claim.policy', 'policy')
        .leftJoinAndSelect('policy.customer', 'customer')
        .leftJoinAndSelect('claim.adjuster', 'adjuster')
        .leftJoinAndSelect('claim.documents', 'documents')
        .leftJoinAndSelect('claim.payments', 'payments');

      this.applyCommonFilters(query, config);

      if (claimTypes && claimTypes.length > 0) {
        query.andWhere('claim.type IN (:...claimTypes)', { claimTypes });
      }

      if (severityLevels && severityLevels.length > 0) {
        query.andWhere('claim.severity IN (:...severityLevels)', { severityLevels });
      }

      if (claimStatuses && claimStatuses.length > 0) {
        query.andWhere('claim.status IN (:...claimStatuses)', { claimStatuses });
      }

      if (involvedParties && involvedParties.length > 0) {
        query.andWhere(new Brackets(qb => {
          involvedParties.forEach((party, index) => {
            if (index === 0) {
              qb.where('claim.involvedParties LIKE :party', { party: `%${party}%` });
            } else {
              qb.orWhere('claim.involvedParties LIKE :party', { party: `%${party}%` });
            }
          });
        }));
      }

      query.orderBy('claim.dateOfLoss', 'DESC')
        .skip(config.offset)
        .take(config.limit);

      const startTime = performance.now();
      const results = await query.getMany();
      const executionTime = performance.now() - startTime;

      this.performanceTracker.trackQuery('claim', executionTime, query.getQueryAndParameters());

      return results;
    }, CacheTTL.MEDIUM);
  }

  async optimizeCustomerQuery(
    config: QueryOptimizationConfig & {
      riskScores?: number[];
      policyCountRange?: [number, number];
      premiumRange?: [number, number];
    }
  ): Promise<Customer[]> {
    const { riskScores, policyCountRange, premiumRange } = config;
    const cacheKey = this.generateCacheKey('customers', config);

    return this.cacheService.getWithFallback(cacheKey, async () => {
      const query = this.customerRepository.createQueryBuilder('customer')
        .leftJoinAndSelect('customer.policies', 'policies')
        .leftJoinAndSelect('customer.agents', 'agents')
        .leftJoinAndSelect('customer.documents', 'documents');

      this.applyCommonFilters(query, config);

      if (riskScores && riskScores.length > 0) {
        query.andWhere('customer.riskScore IN (:...riskScores)', { riskScores });
      }

      if (policyCountRange) {
        query.andWhere('customer.policyCount BETWEEN :min AND :max', {
          min: policyCountRange[0],
          max: policyCountRange[1]
        });
      }

      if (premiumRange) {
        query.andWhere('customer.totalPremium BETWEEN :min AND :max', {
          min: premiumRange[0],
          max: premiumRange[1]
        });
      }

      query.orderBy('customer.createdAt', 'DESC')
        .skip(config.offset)
        .take(config.limit);

      const startTime = performance.now();
      const results = await query.getMany();
      const executionTime = performance.now() - startTime;

      this.performanceTracker.trackQuery('customer', executionTime, query.getQueryAndParameters());

      return results;
    }, CacheTTL.LONG);
  }

  async optimizeAgentPerformanceQuery(
    config: QueryOptimizationConfig & {
      policySalesRange?: [number, number];
      claimResolutionTimeRange?: [number, number];
      customerSatisfactionRange?: [number, number];
    }
  ): Promise<Agent[]> {
    const { policySalesRange, claimResolutionTimeRange, customerSatisfactionRange } = config;
    const cacheKey = this.generateCacheKey('agents', config);

    return this.cacheService.getWithFallback(cacheKey, async () => {
      const query = this.agentRepository.createQueryBuilder('agent')
        .leftJoinAndSelect('agent.policies', 'policies')
        .leftJoinAndSelect('agent.claims', 'claims')
        .leftJoinAndSelect('agent.customers', 'customers');

      this.applyCommonFilters(query, config);

      if (policySalesRange) {
        query.andWhere('agent.policySalesCount BETWEEN :min AND :max', {
          min: policySalesRange[0],
          max: policySalesRange[1]
        });
      }

      if (claimResolutionTimeRange) {
        query.andWhere('agent.avgClaimResolutionTime BETWEEN :min AND :max', {
          min: claimResolutionTimeRange[0],
          max: claimResolutionTimeRange[1]
        });
      }

      if (customerSatisfactionRange) {
        query.andWhere('agent.customerSatisfactionScore BETWEEN :min AND :max', {
          min: customerSatisfactionRange[0],
          max: customerSatisfactionRange[1]
        });
      }

      query.orderBy('agent.performanceScore', 'DESC')
        .skip(config.offset)
        .take(config.limit);

      const startTime = performance.now();
      const results = await query.getMany();
      const executionTime = performance.now() - startTime;

      this.performanceTracker.trackQuery('agent', executionTime, query.getQueryAndParameters());

      return results;
    }, CacheTTL.LONG);
  }

  private applyCommonFilters(
    query: SelectQueryBuilder<any>,
    config: QueryOptimizationConfig
  ): void {
    const { status, dateRange, searchTerm } = config;

    if (status && status.length > 0) {
      query.andWhere('status IN (:...status)', { status });
    }

    if (dateRange) {
      query.andWhere('createdAt BETWEEN :startDate AND :endDate', {
        startDate: dateRange[0],
        endDate: dateRange[1]
      });
    }

    if (searchTerm) {
      query.andWhere(new Brackets(qb => {
        qb.where('name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
          .orWhere('email ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
          .orWhere('phone ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
          .orWhere('id::text ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` });
      }));
    }
  }

  private generateCacheKey(baseKey: string, config: any): string {
    const configString = Object.entries(config)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}=[${value.sort().join(',')}]`;
        }
        return `${key}=${value}`;
      })
      .sort()
      .join('&');

    return `${baseKey}:${configString}`;
  }

  async batchLoadPolicies(policyIds: string[]): Promise<Policy[]> {
    if (policyIds.length === 0) return [];

    const cacheKey = `batch:policies:${policyIds.sort().join(',')}`;
    return this.cacheService.getWithFallback(cacheKey, async () => {
      const query = this.policyRepository.createQueryBuilder('policy')
        .leftJoinAndSelect('policy.customer', 'customer')
        .leftJoinAndSelect('policy.agent', 'agent')
        .leftJoinAndSelect('policy.product', 'product')
        .where('policy.id IN (:...policyIds)', { policyIds });

      const startTime = performance.now();
      const results = await query.getMany();
      const executionTime = performance.now() - startTime;

      this.performanceTracker.trackQuery('batch_policy', executionTime, query.getQueryAndParameters());

      // Cache individual policies for future requests
      await Promise.all(results.map(policy =>
        this.cacheService.set(`policy:${policy.id}`, policy, CacheTTL.LONG)
      ));

      return results;
    }, CacheTTL.SHORT);
  }

  async getPolicyWithRelations(policyId: string): Promise<Policy | null> {
    const cacheKey = `policy:full:${policyId}`;
    return this.cacheService.getWithFallback(cacheKey, async () => {
      const query = this.policyRepository.createQueryBuilder('policy')
        .leftJoinAndSelect('policy.customer', 'customer')
        .leftJoinAndSelect('policy.agent', 'agent')
        .leftJoinAndSelect('policy.product', 'product')
        .leftJoinAndSelect('policy.claims', 'claims')
        .leftJoinAndSelect('policy.payments', 'payments')
        .leftJoinAndSelect('policy.documents', 'documents')
        .where('policy.id = :policyId', { policyId });

      const startTime = performance.now();
      const result = await query.getOne();
      const executionTime = performance.now() - startTime;

      this.performanceTracker.trackQuery('policy_full', executionTime, query.getQueryAndParameters());

      return result;
    }, CacheTTL.MEDIUM);
  }

  async getCustomerLifetimeValue(customerId: string): Promise<number> {
    const cacheKey = `customer:ltv:${customerId}`;
    return this.cacheService.getWithFallback(cacheKey, async () => {
      const query = this.customerRepository.createQueryBuilder('customer')
        .select('SUM(policy.annualPremium * policy.termYears)', 'ltv')
        .leftJoin('customer.policies', 'policy')
        .where('customer.id = :customerId', { customerId })
        .andWhere('policy.status IN (:...statuses)', {
          statuses: ['active', 'lapsed', 'renewed']
        });

      const startTime = performance.now();
      const result = await query.getRawOne();
      const executionTime = performance.now() - startTime;

      this.performanceTracker.trackQuery('customer_ltv', executionTime, query.getQueryAndParameters());

      return parseFloat(result?.ltv) || 0;
    }, CacheTTL.LONG);
  }

  async getAgentPerformanceMetrics(agentId: string): Promise<{
    policySales: number;
    claimResolutionRate: number;
    customerSatisfaction: number;
    retentionRate: number;
  }> {
    const cacheKey = `agent:metrics:${agentId}`;
    return this.cacheService.getWithFallback(cacheKey, async () => {
      const policySalesQuery = this.agentRepository.createQueryBuilder('agent')
        .select('COUNT(policy.id)', 'policySales')
        .leftJoin('agent.policies', 'policy')
        .where('agent.id = :agentId', { agentId })
        .andWhere('policy.status = :status', { status: 'active' });

      const claimResolutionQuery = this.claimRepository.createQueryBuilder('claim')
        .select('COUNT(claim.id)', 'resolvedClaims')
        .addSelect('COUNT(*)', 'totalClaims')
        .leftJoin('claim.agent', 'agent')
        .where('agent.id = :agentId', { agentId })
        .andWhere('claim.status = :status', { status: 'closed' });

      const satisfactionQuery = this.customerRepository.createQueryBuilder('customer')
        .select('AVG(customer.satisfactionScore)', 'satisfaction')
        .leftJoin('customer.agents', 'agent')
        .where('agent.id = :agentId', { agentId });

      const retentionQuery = this.policyRepository.createQueryBuilder('policy')
        .select('COUNT(policy.id)', 'retainedPolicies')
        .addSelect('COUNT(*)', 'totalPolicies')
        .leftJoin('policy.agent', 'agent')
        .where('agent.id = :agentId', { agentId })
        .andWhere('policy.status = :status', { status: 'renewed' });

      const startTime = performance.now();
      const [
        policySalesResult,
        claimResolutionResult,
        satisfactionResult,
        retentionResult
      ] = await Promise.all([
        policySalesQuery.getRawOne(),
        claimResolutionQuery.getRawOne(),
        satisfactionQuery.getRawOne(),
        retentionQuery.getRawOne()
      ]);
      const executionTime = performance.now() - startTime;

      this.performanceTracker.trackQuery('agent_metrics', executionTime, {
        policySales: policySalesQuery.getQueryAndParameters(),
        claimResolution: claimResolutionQuery.getQueryAndParameters(),
        satisfaction: satisfactionQuery.getQueryAndParameters(),
        retention: retentionQuery.getQueryAndParameters()
      });

      return {
        policySales: parseInt(policySalesResult?.policySales) || 0,
        claimResolutionRate: parseInt(claimResolutionResult?.resolvedClaims) /
          (parseInt(claimResolutionResult?.totalClaims) || 1),
        customerSatisfaction: parseFloat(satisfactionResult?.satisfaction) || 0,
        retentionRate: parseInt(retentionResult?.retainedPolicies) /
          (parseInt(retentionResult?.totalPolicies) || 1)
      };
    }, CacheTTL.MEDIUM);
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
  private readonly compressionMiddleware: ReturnType<typeof compression>;
  private readonly logger = new Logger(ResponseCompressionMiddleware.name);

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
          contentType.includes('application/octet-stream') ||
          contentType.includes('image/') ||
          contentType.includes('video/') ||
          contentType.includes('audio/')
        )) {
          return false;
        }

        return compression.filter(req, res);
      }
    };

    this.compressionMiddleware = compression(compressionOptions);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = performance.now();

    // Wrap the response methods to track compression
    const originalWrite = res.write;
    const originalEnd = res.end;
    const originalJson = res.json;
    const originalSend = res.send;

    let compressed = false;
    let originalSize = 0;
    let compressedSize = 0;

    // Override response methods to track size
    res.write = function(chunk: any, ...args: any[]) {
      if (chunk) {
        originalSize += chunk.length;
      }
      return originalWrite.call(this, chunk, ...args);
    };

    res.end = function(chunk: any, ...args: any[]) {
      if (chunk) {
        originalSize += chunk.length;
      }
      return originalEnd.call(this, chunk, ...args);
    };

    res.json = function(body: any) {
      if (body) {
        originalSize += JSON.stringify(body).length;
      }
      return originalJson.call(this, body);
    };

    res.send = function(body: any) {
      if (body) {
        originalSize += typeof body === 'string' ? body.length : JSON.stringify(body).length;
      }
      return originalSend.call(this, body);
    };

    // Add compression headers tracking
    res.on('finish', () => {
      const contentEncoding = res.getHeader('Content-Encoding');
      compressed = contentEncoding === 'gzip' || contentEncoding === 'deflate';
      compressedSize = parseInt(res.getHeader('Content-Length') as string) || 0;

      const compressionTime = performance.now() - startTime;
      const compressionRatio = compressed ? (1 - (compressedSize / originalSize)) * 100 : 0;

      this.logger.log({
        message: 'Response compression metrics',
        path: req.path,
        method: req.method,
        originalSize: `${Math.round(originalSize / 1024 * 100) / 100} KB`,
        compressedSize: compressed ? `${Math.round(compressedSize / 1024 * 100) / 100} KB` : 'N/A',
        compressionRatio: `${Math.round(compressionRatio * 100) / 100}%`,
        compressionTime: `${Math.round(compressionTime * 100) / 100}ms`,
        compressed,
        statusCode: res.statusCode
      });
    });

    this.compressionMiddleware(req, res, next);
  }
}

// src/app.module.ts
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ResponseCompressionMiddleware } from './middleware/response-compression.middleware';

@Module({
  imports: [...],
  controllers: [...],
  providers: [...]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ResponseCompressionMiddleware)
      .forRoutes('*');
  }
}

// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configure response compression at application level
  app.set('trust proxy', true);
  app.use(compression({
    level: configService.get<number>('COMPRESSION_LEVEL', 6),
    threshold: configService.get<number>('COMPRESSION_THRESHOLD', 1024),
    filter: (req, res) => {
      // Skip compression for certain content types
      const contentType = res.getHeader('Content-Type') as string;
      if (contentType && (
        contentType.includes('application/octet-stream') ||
        contentType.includes('image/') ||
        contentType.includes('video/') ||
        contentType.includes('audio/')
      )) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  await app.listen(configService.get<number>('PORT', 3000));
}
bootstrap();
```

### Lazy Loading Implementation

```typescript
// src/lazy-loading/lazy-loader.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LazyLoadConfig } from './interfaces/lazy-load-config.interface';
import { PerformanceTrackerService } from '../performance-tracker/performance-tracker.service';

@Injectable()
export class LazyLoaderService {
  private readonly logger = new Logger(LazyLoaderService.name);
  private readonly loadedModules = new Map<string, any>();
  private readonly loadingPromises = new Map<string, Promise<any>>();

  constructor(
    private moduleRef: ModuleRef,
    private performanceTracker: PerformanceTrackerService
  ) {}

  async loadModule<T>(config: LazyLoadConfig): Promise<T> {
    const { moduleName, importPath, exportName, cache = true } = config;

    // Return cached module if available
    if (cache && this.loadedModules.has(moduleName)) {
      this.logger.debug(`Returning cached module: ${moduleName}`);
      return this.loadedModules.get(moduleName) as T;
    }

    // Return existing loading promise if available
    if (this.loadingPromises.has(moduleName)) {
      this.logger.debug(`Waiting for existing load of: ${moduleName}`);
      return this.loadingPromises.get(moduleName) as Promise<T>;
    }

    // Create new loading promise
    const loadPromise = new Promise<T>(async (resolve, reject) => {
      try {
        this.logger.debug(`Starting lazy load of module: ${moduleName}`);

        const startTime = performance.now();
        const module = await import(importPath);
        const endTime = performance.now();

        this.performanceTracker.trackLazyLoad({
          moduleName,
          loadTime: endTime - startTime,
          size: this.estimateModuleSize(module)
        });

        const exportedModule = exportName ? module[exportName] : module.default || module;

        if (!exportedModule) {
          throw new Error(`Module ${moduleName} does not export ${exportName || 'default'}`);
        }

        if (cache) {
          this.loadedModules.set(moduleName, exportedModule);
        }

        this.logger.debug(`Successfully loaded module: ${moduleName}`);
        resolve(exportedModule);
      } catch (error) {
        this.logger.error(`Failed to load module ${moduleName}: ${error.message}`);
        reject(error);
      } finally {
        this.loadingPromises.delete(moduleName);
      }
    });

    this.loadingPromises.set(moduleName, loadPromise);
    return loadPromise;
  }

  loadModuleObservable<T>(config: LazyLoadConfig): Observable<T> {
    return from(this.loadModule<T>(config)).pipe(
      catchError(error => {
        this.logger.error(`Observable lazy load failed for ${config.moduleName}: ${error.message}`);
        return of(null as T);
      }),
      tap(module => {
        if (module) {
          this.logger.debug(`Observable lazy load completed for: ${config.moduleName}`);
        }
      })
    );
  }

  async loadFeature<T>(featureName: string, config: LazyLoadConfig): Promise<T> {
    const startTime = performance.now();
    const feature = await this.loadModule<T>(config);
    const endTime = performance.now();

    this.performanceTracker.trackFeatureLoad({
      featureName,
      loadTime: endTime - startTime,
      moduleName: config.moduleName
    });

    return feature;
  }

  async loadFeatureWithFallback<T>(
    featureName: string,
    primaryConfig: LazyLoadConfig,
    fallbackConfig: LazyLoadConfig
  ): Promise<T> {
    try {
      return await this.loadFeature<T>(featureName, primaryConfig);
    } catch (error) {
      this.logger.warn(`Primary feature load failed for ${featureName}, falling back to secondary`);
      return this.loadFeature<T>(featureName, fallbackConfig);
    }
  }

  async preloadModules(moduleConfigs: LazyLoadConfig[]): Promise<void> {
    this.logger.log(`Preloading ${moduleConfigs.length} modules`);

    const startTime = performance.now();
    await Promise.all(moduleConfigs.map(config => this.loadModule(config)));
    const endTime = performance.now();

    this.logger.log(`Preloaded ${moduleConfigs.length} modules in ${endTime - startTime}ms`);
  }

  clearCache(moduleName?: string): void {
    if (moduleName) {
      this.loadedModules.delete(moduleName);
      this.logger.debug(`Cleared cache for module: ${moduleName}`);
    } else {
      this.loadedModules.clear();
      this.logger.debug('Cleared all lazy load cache');
    }
  }

  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  private estimateModuleSize(module: any): number {
    try {
      const moduleString = JSON.stringify(module);
      return moduleString.length;
    } catch {
      return 0;
    }
  }

  async loadWithRetry<T>(
    config: LazyLoadConfig,
    maxRetries = 3,
    retryDelay = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.loadModule<T>(config);
      } catch (error) {
        lastError = error;
        this.logger.warn(`Attempt ${i + 1} failed for ${config.moduleName}: ${error.message}`);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError;
  }
}

// src/lazy-loading/lazy-load.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { LAZY_LOAD_CONFIG } from './lazy-loading.constants';

export interface LazyLoadDecoratorConfig {
  moduleName: string;
  importPath: string;
  exportName?: string;
  cache?: boolean;
  preload?: boolean;
}

export function LazyLoad(config: LazyLoadDecoratorConfig) {
  return SetMetadata(LAZY_LOAD_CONFIG, config);
}

// src/lazy-loading/lazy-loading.module.ts
import { Module, Global } from '@nestjs/common';
import { LazyLoaderService } from './lazy-loader.service';
import { PerformanceTrackerModule } from '../performance-tracker/performance-tracker.module';

@Global()
@Module({
  imports: [PerformanceTrackerModule],
  providers: [LazyLoaderService],
  exports: [LazyLoaderService]
})
export class LazyLoadingModule {}

// src/features/claims/claims.module.ts
import { Module } from '@nestjs/common';
import { LazyLoad } from '../../lazy-loading/lazy-load.decorator';

@LazyLoad({
  moduleName: 'claims',
  importPath: './claims.module',
  preload: true
})
@Module({
  imports: [...],
  controllers: [...],
  providers: [...],
  exports: [...]
})
export class ClaimsModule {}

// src/features/claims/claims.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { LazyLoaderService } from '../../lazy-loading/lazy-loader.service';
import { LazyLoad } from '../../lazy-loading/lazy-load.decorator';

@Controller('claims')
export class ClaimsController {
  constructor(private lazyLoader: LazyLoaderService) {}

  @Get(':id')
  async getClaim(@Param('id') id: string) {
    const claimsService = await this.lazyLoader.loadFeature(
      'claims-service',
      {
        moduleName: 'claims-service',
        importPath: './claims.service',
        exportName: 'ClaimsService'
      }
    );

    return claimsService.getClaimById(id);
  }

  @LazyLoad({
    moduleName: 'claims-analytics',
    importPath: './claims-analytics.service',
    exportName: 'ClaimsAnalyticsService'
  })
  @Get(':id/analytics')
  async getClaimAnalytics(@Param('id') id: string) {
    const analyticsService = await this.lazyLoader.loadModule(
      'claims-analytics'
    );

    return analyticsService.getAnalyticsForClaim(id);
  }
}

// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LazyLoaderService } from './lazy-loading/lazy-loader.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Preload critical modules
  const lazyLoader = app.get(LazyLoaderService);
  await lazyLoader.preloadModules([
    {
      moduleName: 'auth-service',
      importPath: './auth/auth.service',
      exportName: 'AuthService',
      preload: true
    },
    {
      moduleName: 'customer-service',
      importPath: './customers/customers.service',
      exportName: 'CustomersService',
      preload: true
    }
  ]);

  await app.listen(3000);
}
bootstrap();
```

### Request Debouncing

```typescript
// src/debounce/request-debouncer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, shareReplay } from 'rxjs/operators';
import { createHash } from 'crypto';

interface DebouncedRequest {
  key: string;
  request: () => Promise<any>;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

@Injectable()
export class RequestDebouncerService {
  private readonly logger = new Logger(RequestDebouncerService.name);
  private readonly debounceSubject = new Subject<DebouncedRequest>();
  private readonly activeRequests = new Map<string, Promise<any>>();
  private readonly debounceTimeMs: number;
  private readonly maxDebounceTimeMs: number;

  constructor(private configService: ConfigService) {
    this.debounceTimeMs = this.configService.get<number>('REQUEST_DEBOUNCE_TIME', 300);
    this.maxDebounceTimeMs = this.configService.get<number>('REQUEST_MAX_DEBOUNCE_TIME', 1000);

    this.setupDebouncePipeline();
  }

  private setupDebouncePipeline(): void {
    this.debounceSubject.pipe(
      // Group requests by key and debounce
      debounceTime(this.debounceTimeMs),
      // Ensure we don't process duplicate requests
      distinctUntilChanged((prev, curr) => prev.key === curr.key),
      // Filter out requests that have been resolved while waiting
      filter(request => {
        const existing = this.activeRequests.get(request.key);
        return !existing || existing !== request.request;
      }),
      // Execute the request
      map(async request => {
        try {
          const result = await request.request();
          request.resolve(result);
          this.activeRequests.delete(request.key);
          return { key: request.key, success: true, result };
        } catch (error) {
          request.reject(error);
          this.activeRequests.delete(request.key);
          return { key: request.key, success: false, error };
        }
      }),
      // Share the observable to allow multiple subscribers
      shareReplay(1)
    ).subscribe({
      next: result => this.logger.debug(`Debounced request completed: ${result.key}`),
      error: error => this.logger.error(`Error in debounce pipeline: ${error.message}`)
    });
  }

  async debounce<T>(key: string, request: () => Promise<T>, customDebounceTime?: number): Promise<T> {
    // Generate a unique key for the request
    const requestKey = this.generateRequestKey(key, request);

    // Check if there's an active request with this key
    const existingRequest = this.activeRequests.get(requestKey);
    if (existingRequest) {
      this.logger.debug(`Returning existing debounced request for key: ${requestKey}`);
      return existingRequest as Promise<T>;
    }

    // Create a new promise for this request
    const requestPromise = new Promise<T>((resolve, reject) => {
      const debouncedRequest: DebouncedRequest = {
        key: requestKey,
        request,
        timestamp: Date.now(),
        resolve,
        reject
      };

      // Check if this request should bypass debouncing
      const now = Date.now();
      const timeSinceLastRequest = now - (this.activeRequests.get(requestKey)?.timestamp || 0);

      if (timeSinceLastRequest > (customDebounceTime || this.maxDebounceTimeMs)) {
        // Execute immediately if it's been too long since the last request
        this.logger.debug(`Executing request immediately (bypassing debounce) for key: ${requestKey}`);
        request().then(resolve).catch(reject);
      } else {
        // Add to debounce pipeline
        this.logger.debug(`Adding request to debounce pipeline for key: ${requestKey}`);
        this.debounceSubject.next(debouncedRequest);
      }
    });

    // Store the active request
    this.activeRequests.set(requestKey, requestPromise);

    // Set a timeout to remove the request from active requests if it takes too long
    setTimeout(() => {
      if (this.activeRequests.get(requestKey) === requestPromise) {
        this.activeRequests.delete(requestKey);
        this.logger.warn(`Request timed out and removed from debouncer: ${requestKey}`);
      }
    }, this.maxDebounceTimeMs * 2);

    return requestPromise;
  }

  private generateRequestKey(baseKey: string, request: () => Promise<any>): string {
    // Create a hash of the request function to ensure different requests with same base key are treated separately
    const requestHash = createHash('md5')
      .update(request.toString())
      .digest('hex')
      .substring(0, 8);

    return `${baseKey}:${requestHash}`;
  }

  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  getActiveRequestKeys(): string[] {
    return Array.from(this.activeRequests.keys());
  }

  clearActiveRequests(): void {
    this.activeRequests.clear();
    this.logger.log('Cleared all active debounced requests');
  }

  async debounceWithFallback<T>(
    key: string,
    primaryRequest: () => Promise<T>,
    fallbackRequest: () => Promise<T>,
    customDebounceTime?: number
  ): Promise<T> {
    try {
      return await this.debounce(key, primaryRequest, customDebounceTime);
    } catch (error) {
      this.logger.warn(`Primary request failed for ${key}, falling back to secondary`);
      return this.debounce(`${key}:fallback`, fallbackRequest, customDebounceTime);
    }
  }

  observeDebouncedRequests(): Observable<{ key: string; success: boolean; result?: any; error?: any }> {
    return this.debounceSubject.pipe(
      debounceTime(0), // Process immediately after debounce
      map(request => ({
        key: request.key,
        success: true,
        result: null // Result will be populated when the request completes
      })),
      shareReplay(1)
    );
  }

  async batchDebounce<T>(requests: Array<{ key: string; request: () => Promise<T> }>): Promise<T[]> {
    const results = await Promise.all(
      requests.map(({ key, request }) => this.debounce(key, request))
    );

    return results;
  }
}

// src/debounce/request-debounce.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestDebouncerService } from './request-debouncer.service';
import { Reflector } from '@nestjs/core';
import { DEBOUNCE_KEY } from './debounce.constants';

@Injectable()
export class RequestDebounceInterceptor implements NestInterceptor {
  constructor(
    private debouncer: RequestDebouncerService,
    private reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const debounceKey = this.reflector.get<string>(DEBOUNCE_KEY, context.getHandler());

    if (!debounceKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const originalMethod = next.handle.bind(next);

    return new Observable(observer => {
      this.debouncer.debounce(debounceKey, async () => {
        try {
          const result = await originalMethod().toPromise();
          observer.next(result);
          observer.complete();
          return result;
        } catch (error) {
          observer.error(error);
          throw error;
        }
      }).catch(error => {
        observer.error(error);
      });
    });
  }
}

// src/debounce/debounce.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { DEBOUNCE_KEY } from './debounce.constants';

export function Debounce(key: string, customDebounceTime?: number) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(DEBOUNCE_KEY, key)(target, propertyKey, descriptor);

    const originalMethod = descriptor.value;

    descriptor.value = function(...args: any[]) {
      // In a real implementation, you would use the RequestDebouncerService here
      // This is simplified for the example
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// src/debounce/debounce.module.ts
import { Module, Global } from '@nestjs/common';
import { RequestDebouncerService } from './request-debouncer.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestDebounceInterceptor } from './request-debounce.interceptor';

@Global()
@Module({
  providers: [
    RequestDebouncerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestDebounceInterceptor
    }
  ],
  exports: [RequestDebouncerService]
})
export class DebounceModule {}

// src/policies/policies.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { Debounce } from '../debounce/debounce.decorator';
import { PoliciesService } from './policies.service';

@Controller('policies')
export class PoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @Get()
  @Debounce('policies:search', 500)
  async searchPolicies(
    @Query('customerId') customerId?: string,
    @Query('agentId') agentId?: string,
    @Query('status') status?: string,
    @Query('searchTerm') searchTerm?: string
  ) {
    return this.policiesService.searchPolicies({
      customerId,
      agentId,
      status,
      searchTerm
    });
  }

  @Get('stats')
  @Debounce('policies:stats')
  async getPolicyStats() {
    return this.policiesService.getPolicyStatistics();
  }
}

// src/claims/claims.service.ts
import { Injectable } from '@nestjs/common';
import { RequestDebouncerService } from '../debounce/request-debouncer.service';

@Injectable()
export class ClaimsService {
  constructor(private debouncer: RequestDebouncerService) {}

  async getClaimAnalytics(claimId: string) {
    return this.debouncer.debounce(
      `claims:analytics:${claimId}`,
      async () => {
        // Expensive analytics calculation
        return this.calculateClaimAnalytics(claimId);
      },
      1000 // Custom debounce time for analytics
    );
  }

  async getClaimWithFallback(claimId: string) {
    return this.debouncer.debounceWithFallback(
      `claims:get:${claimId}`,
      async () => {
        // Primary data source
        return this.getClaimFromPrimarySource(claimId);
      },
      async () => {
        // Fallback data source
        return this.getClaimFromFallbackSource(claimId);
      }
    );
  }

  private async calculateClaimAnalytics(claimId: string) {
    // Simulate expensive calculation
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      claimId,
      riskScore: Math.random() * 100,
      fraudProbability: Math.random(),
      estimatedPayout: Math.random() * 10000,
      processingTime: Math.random() * 30
    };
  }

  private async getClaimFromPrimarySource(claimId: string) {
    // Simulate primary source access
    if (Math.random() > 0.7) {
      throw new Error('Primary source unavailable');
    }
    return { claimId, source: 'primary', data: 'Detailed claim data' };
  }

  private async getClaimFromFallbackSource(claimId: string) {
    // Simulate fallback source access
    return { claimId, source: 'fallback', data: 'Basic claim data' };
  }
}
```

### Connection Pooling

```typescript
// src/database/database-connection-pool.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import { performance } from 'perf_hooks';
import { DatabaseConnectionError } from './database.errors';
import { ConnectionPoolMetrics } from './interfaces/connection-pool-metrics.interface';

@Injectable()
export class DatabaseConnectionPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseConnectionPoolService.name);
  private pool: Pool;
  private readonly config: PoolConfig;
  private readonly connectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingClients: 0,
    queryCount: 0,
    queryTime: 0,
    errors: 0
  };

  constructor(private configService: ConfigService) {
    this.config = {
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
      ssl: this.configService.get<boolean>('DB_SSL')
        ? { rejectUnauthorized: false }
        : false,
      max: this.configService.get<number>('DB_POOL_MAX', 20),
      min: this.configService.get<number>('DB_POOL_MIN', 4),
      idleTimeoutMillis: this.configService.get<number>('DB_POOL_IDLE_TIMEOUT', 30000),
      connectionTimeoutMillis: this.configService.get<number>('DB_POOL_CONNECTION_TIMEOUT', 5000),
      application_name: this.configService.get<string>('DB_APPLICATION_NAME', 'insurance-tracking')
    };
  }

  async onModuleInit() {
    await this.initializePool();
    this.setupConnectionEventListeners();
    this.setupMetricsCollection();
  }

  async onModuleDestroy() {
    await this.closePool();
  }

  private async initializePool(): Promise<void> {
    try {
      this.pool = new Pool(this.config);

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.logger.log('Database connection pool initialized successfully');
      this.logger.debug(`Pool configuration: ${JSON.stringify({
        max: this.config.max,
        min: this.config.min,
        idleTimeout: this.config.idleTimeoutMillis,
        connectionTimeout: this.config.connectionTimeoutMillis
      })}`);
    } catch (error) {
      this.logger.error(`Failed to initialize database connection pool: ${error.message}`);
      throw new DatabaseConnectionError('Database connection pool initialization failed');
    }
  }

  private setupConnectionEventListeners(): void {
    if (!this.pool) return;

    this.pool.on('connect', () => {
      this.connectionMetrics.totalConnections++;
      this.connectionMetrics.activeConnections++;
      this.logger.debug('New database connection established');
    });

    this.pool.on('acquire', () => {
      this.connectionMetrics.activeConnections++;
      this.connectionMetrics.idleConnections--;
      this.logger.debug('Connection acquired from pool');
    });

    this.pool.on('release', () => {
      this.connectionMetrics.activeConnections--;
      this.connectionMetrics.idleConnections++;
      this.logger.debug('Connection released back to pool');
    });

    this.pool.on('remove', () => {
      this.connectionMetrics.activeConnections--;
      this.connectionMetrics.totalConnections--;
      this.logger.debug('Connection removed from pool');
    });

    this.pool.on('error', (error) => {
      this.connectionMetrics.errors++;
      this.logger.error(`Database connection pool error: ${error.message}`);
    });
  }

  private setupMetricsCollection(): void {
    setInterval(() => {
      this.updateConnectionMetrics();
    }, 60000); // Update metrics every minute
  }

  private updateConnectionMetrics(): void {
    if (!this.pool) return;

    const metrics: ConnectionPoolMetrics = {
      totalConnections: this.connectionMetrics.totalConnections,
      activeConnections: this.connectionMetrics.activeConnections,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      queryCount: this.connectionMetrics.queryCount,
      avgQueryTime: this.connectionMetrics.queryCount > 0
        ? this.connectionMetrics.queryTime / this.connectionMetrics.queryCount
        : 0,
      errors: this.connectionMetrics.errors,
      poolSize: this.pool.totalCount,
      maxPoolSize: this.config.max || 20
    };

    this.logger.debug(`Connection pool metrics: ${JSON.stringify(metrics)}`);

    // Reset counters
    this.connectionMetrics.queryCount = 0;
    this.connectionMetrics.queryTime = 0;
    this.connectionMetrics.errors = 0;
  }

  async getClient(): Promise<PoolClient> {
    try {
      const startTime = performance.now();
      const client = await this.pool.connect();
      const connectionTime = performance.now() - startTime;

      this.logger.debug(`Acquired database client in ${connectionTime}ms`);

      // Add error handling to the client
      const originalQuery = client.query;
      client.query = async (...args: any[]) => {
        const queryStartTime = performance.now();
        try {
          const result = await originalQuery.apply(client, args);
          const queryTime = performance.now() - queryStartTime;

          this.connectionMetrics.queryCount++;
          this.connectionMetrics.queryTime += queryTime;

          this.logger.debug(`Query executed in ${queryTime}ms: ${args[0]}`);

          return result;
        } catch (error) {
          this.connectionMetrics.errors++;
          this.logger.error(`Query failed: ${error.message}`);
          throw error;
        }
      };

      return client;
    } catch (error) {
      this.connectionMetrics.errors++;
      this.logger.error(`Failed to acquire database client: ${error.message}`);
      throw new DatabaseConnectionError('Failed to acquire database connection');
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await this.getClient();
    try {
      return await client.query<T>(text, params);
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Transaction rolled back: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async batchQuery(queries: Array<{ text: string; params?: any[] }>): Promise<any[]> {
    return this.transaction(async (client) => {
      const results = [];
      for (const query of queries) {
        const result = await client.query(query.text, query.params);
        results.push(result);
      }
      return results;
    });
  }

  async getPoolStatus(): Promise<ConnectionPoolMetrics> {
    if (!this.pool) {
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        queryCount: 0,
        avgQueryTime: 0,
        errors: 0,
        poolSize: 0,
        maxPoolSize: this.config.max || 20
      };
    }

    return {
      totalConnections: this.connectionMetrics.totalConnections,
      activeConnections: this.connectionMetrics.activeConnections,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      queryCount: this.connectionMetrics.queryCount,
      avgQueryTime: this.connectionMetrics.queryCount > 0
        ? this.connectionMetrics.queryTime / this.connectionMetrics.queryCount
        : 0,
      errors: this.connectionMetrics.errors,
      poolSize: this.pool.totalCount,
      maxPoolSize: this.config.max || 20
    };
  }

  async resizePool(newSize: { max?: number; min?: number }): Promise<void> {
    if (!this.pool) {
      throw new DatabaseConnectionError('Connection pool not initialized');
    }

    if (newSize.max !== undefined) {
      this.config.max = newSize.max;
      this.pool.options.max = newSize.max;
      this.logger.log(`Updated max pool size to ${newSize.max}`);
    }

    if (newSize.min !== undefined) {
      this.config.min = newSize.min;
      this.pool.options.min = newSize.min;
      this.logger.log(`Updated min pool size to ${newSize.min}`);
    }
  }

  async closePool(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
        this.logger.log('Database connection pool closed successfully');
      } catch (error) {
        this.logger.error(`Error closing database connection pool: ${error.message}`);
        throw new DatabaseConnectionError('Failed to close database connection pool');
      }
    }
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    retryDelay = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Operation failed (attempt ${i + 1}/${maxRetries}): ${error.message}`);

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError;
  }

  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const startTime = performance.now();
      const result = await this.query('SELECT 1');
      const responseTime = performance.now() - startTime;

      return {
        healthy: true,
        details: {
          status: 'available',
          responseTime: `${Math.round(responseTime)}ms`,
          poolStatus: await this.getPoolStatus()
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          status: 'unavailable',
          error: error.message,
          poolStatus: await this.getPoolStatus()
        }
      };
    }
  }
}

// src/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { DatabaseConnectionPoolService } from './database-connection-pool.service';
import { QueryOptimizerService } from './query-optimizer.service';
import { QueryPerformanceTracker } from './query-performance-tracker.service';

@Global()
@Module({
  providers: [
    DatabaseConnectionPoolService,
    QueryOptimizerService,
    QueryPerformanceTracker
  ],
  exports: [
    DatabaseConnectionPoolService,
    QueryOptimizerService
  ]
})
export class DatabaseModule {}

// src/database/query-performance-tracker.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';

interface QueryPerformance {
  query: string;
  parameters: any[];
  executionTime: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

@Injectable()
export class QueryPerformanceTracker {
  private readonly logger = new Logger(QueryPerformanceTracker.name);
  private readonly queryHistory: QueryPerformance[] = [];
  private readonly maxHistorySize = 1000;

  trackQuery(queryType: string, executionTime: number, queryDetails: { query: string; parameters: any[] }): void {
    const performanceEntry: QueryPerformance = {
      query: queryDetails.query,
      parameters: queryDetails.parameters,
      executionTime,
      timestamp: Date.now(),
      success: true
    };

    this.addToHistory(performanceEntry);
    this.logQueryPerformance(queryType, performanceEntry);
  }

  trackFailedQuery(queryType: string, error: Error, queryDetails: { query: string; parameters: any[] }): void {
    const performanceEntry: QueryPerformance = {
      query: queryDetails.query,
      parameters: queryDetails.parameters,
      executionTime: 0,
      timestamp: Date.now(),
      success: false,
      error: error.message
    };

    this.addToHistory(performanceEntry);
    this.logQueryPerformance(queryType, performanceEntry);
  }

  private addToHistory(entry: QueryPerformance): void {
    this.queryHistory.push(entry);
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory.shift();
    }
  }

  private logQueryPerformance(queryType: string, entry: QueryPerformance): void {
    const logLevel = entry.success ? 'debug' : 'error';
    const logMessage = {
      queryType,
      executionTime: `${Math.round(entry.executionTime)}ms`,
      success: entry.success,
      query: this.sanitizeQuery(entry.query),
      parameters: entry.parameters,
      timestamp: new Date(entry.timestamp).toISOString(),
      ...(entry.error && { error: entry.error })
    };

    this.logger[logLevel](logMessage);
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data from query for logging
    return query.replace(/\$\d+/g, '?');
  }

  getSlowQueries(thresholdMs: number, limit = 10): QueryPerformance[] {
    return this.queryHistory
      .filter(entry => entry.executionTime > thresholdMs)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  getFailedQueries(limit = 10): QueryPerformance[] {
    return this.queryHistory
      .filter(entry => !entry.success)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getQueryStatistics(): {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    avgExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    queriesPerMinute: number;
  } {
    if (this.queryHistory.length === 0) {
      return {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        avgExecutionTime: 0,
        minExecutionTime: 0,
        maxExecutionTime: 0,
        queriesPerMinute: 0
      };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentQueries = this.queryHistory.filter(entry => entry.timestamp >= oneMinuteAgo);
    const executionTimes = this.queryHistory.map(entry => entry.executionTime);

    return {
      totalQueries: this.queryHistory.length,
      successfulQueries: this.queryHistory.filter(entry => entry.success).length,
      failedQueries: this.queryHistory.filter(entry => !entry.success).length,
      avgExecutionTime: executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length,
      minExecutionTime: Math.min(...executionTimes),
      maxExecutionTime: Math.max(...executionTimes),
      queriesPerMinute: recentQueries.length
    };
  }

  clearHistory(): void {
    this.queryHistory.length = 0;
    this.logger.log('Query performance history cleared');
  }
}

// src/policies/policies.service.ts
import { Injectable } from '@nestjs/common';
import { DatabaseConnectionPoolService } from '../database/database-connection-pool.service';
import { QueryOptimizerService } from '../database/query-optimizer.service';
import { Policy } from './entities/policy.entity';

@Injectable()
export class PoliciesService {
  constructor(
    private dbPool: DatabaseConnectionPoolService,
    private queryOptimizer: QueryOptimizerService
  ) {}

  async getPolicyById(id: string): Promise<Policy | null> {
    return this.dbPool.withRetry(async () => {
      return this.queryOptimizer.getPolicyWithRelations(id);
    });
  }

  async searchPolicies(params: {
    customerId?: string;
    agentId?: string;
    status?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }): Promise<Policy[]> {
    return this.dbPool.withRetry(async () => {
      return this.queryOptimizer.optimizePolicyQuery({
        customerId: params.customerId,
        agentId: params.agentId,
        status: params.status ? [params.status] : undefined,
        searchTerm: params.searchTerm,
        limit: params.limit || 20,
        offset: params.offset || 0
      });
    });
  }

  async createPolicy(policyData: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Policy> {
    return this.dbPool.transaction(async (client) => {
      const query = `
        INSERT INTO policies (
          customer_id, agent_id, product_id, status,
          effective_date, expiration_date, annual_premium,
          term_years, coverage_amount, deductible,
          payment_frequency, policy_number, external_reference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        policyData.customerId,
        policyData.agentId,
        policyData.productId,
        policyData.status,
        policyData.effectiveDate,
        policyData.expirationDate,
        policyData.annualPremium,
        policyData.termYears,
        policyData.coverageAmount,
        policyData.deductible,
        policyData.paymentFrequency,
        this.generatePolicyNumber(),
        policyData.externalReference
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    });
  }

  async updatePolicy(id: string, updateData: Partial<Policy>): Promise<Policy> {
    return this.dbPool.transaction(async (client) => {
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          setClauses.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);
      const query = `
        UPDATE policies
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      return result.rows[0];
    });
  }

  async batchCreatePolicies(policies: Array<Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Policy[]> {
    return this.dbPool.transaction(async (client) => {
      const query = `
        INSERT INTO policies (
          customer_id, agent_id, product_id, status,
          effective_date, expiration_date, annual_premium,
          term_years, coverage_amount, deductible,
          payment_frequency, policy_number, external_reference
        ) VALUES %L
        RETURNING *
      `;

      // Using pg-format for batch insert
      const values = policies.map(policy => [
        policy.customerId,
        policy.agentId,
        policy.productId,
        policy.status,
        policy.effectiveDate,
        policy.expirationDate,
        policy.annualPremium,
        policy.termYears,
        policy.coverageAmount,
        policy.deductible,
        policy.paymentFrequency,
        this.generatePolicyNumber(),
        policy.externalReference
      ]);

      const result = await client.query(format(query, values));
      return result.rows;
    });
  }

  private generatePolicyNumber(): string {
    const prefix = 'POL';
    const timestamp = Date.now().toString().substring(6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${timestamp}-${random}`;
  }
}
```

## Real-Time Features (320 lines)

### WebSocket Server Setup

```typescript
// src/websocket/websocket.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { WebSocketAuthService } from './websocket-auth.service';
import { WebSocketRoomService } from './websocket-room.service';
import { WebSocketEventService } from './websocket-event.service';
import { WebSocketMetricsService } from './websocket-metrics.service';
import { WebSocketAdapter } from './websocket.adapter';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  adapter: WebSocketAdapter
})
@Injectable()
export class WebSocketGatewayService implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebSocketGatewayService.name);
  private redisSubscriber: Redis;
  private redisPublisher: Redis;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private authService: WebSocketAuthService,
    private roomService: WebSocketRoomService,
    private eventService: WebSocketEventService,
    private metricsService: WebSocketMetricsService
  ) {
    this.initializeRedis();
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.server = server;

    // Set up event handlers
    this.setupEventHandlers();

    // Start metrics collection
    this.metricsService.startMetricsCollection();
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.debug(`Client connected: ${client.id}`);
    this.metricsService.incrementConnectionCount();

    // Authenticate the client
    this.authenticateClient(client)
      .then(() => {
        this.logger.debug(`Client authenticated: ${client.id}`);
        this.metricsService.incrementAuthenticatedCount();
      })
      .catch(error => {
        this.logger.warn(`Authentication failed for client ${client.id}: ${error.message}`);
        client.disconnect(true);
      });
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    this.metricsService.decrementConnectionCount();

    // Clean up client rooms
    this.roomService.leaveAllRooms(client.id);
  }

  private async authenticateClient(client: Socket): Promise<void> {
    const token = this.extractToken(client);

    if (!token) {
      throw new Error('Authentication token not provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET')
      });

      const user = await this.authService.validateUser(payload);

      if (!user) {
        throw new Error('User not found');
      }

      // Attach user to the socket
      client.data.user = user;

      // Join user-specific room
      await this.roomService.joinRoom(client, `user:${user.id}`);

      // Join role-based rooms
      await this.joinRoleRooms(client, user.roles);

      this.logger.debug(`User ${user.id} authenticated and joined rooms`);
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      throw error;
    }
  }

  private extractToken(client: Socket): string | null {
    // Check query parameters
    if (client.handshake.query.token) {
      return client.handshake.query.token as string;
    }

    // Check headers
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private async joinRoleRooms(client: Socket, roles: string[]): Promise<void> {
    const roleRooms = roles.map(role => `role:${role}`);
    await Promise.all(roleRooms.map(room => this.roomService.joinRoom(client, room)));
  }

  private setupEventHandlers(): void {
    // Handle custom events
    this.eventService.on('claim:updated', (data) => {
      this.server.to(`claim:${data.claimId}`).emit('claim:updated', data);
      this.server.to(`user:${data.agentId}`).emit('claim:updated', data);
      this.server.to('role:claims-adjuster').emit('claim:updated', data);
    });

    this.eventService.on('policy:updated', (data) => {
      this.server.to(`policy:${data.policyId}`).emit('policy:updated', data);
      this.server.to(`user:${data.agentId}`).emit('policy:updated', data);
      this.server.to(`user:${data.customerId}`).emit('policy:updated', data);
    });

    this.eventService.on('notification:created', (data) => {
      this.server.to(`user:${data.userId}`).emit('notification:created', data);
    });

    this.eventService.on('system:alert', (data) => {
      this.server.to('role:admin').emit('system:alert', data);
    });

    // Handle Redis pub/sub for distributed WebSocket
    this.redisSubscriber.on('message', (channel, message) => {
      try {
        const event = JSON.parse(message);
        this.server.to(event.room).emit(event.event, event.data);
        this.metricsService.incrementEventCount(event.event);
      } catch (error) {
        this.logger.error(`Error processing Redis message: ${error.message}`);
      }
    });
  }

  private initializeRedis(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');
    const redisPort = this.configService.get<number>('REDIS_PORT');
    const redisHost = this.configService.get<string>('REDIS_HOST');

    this.redisPublisher = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword
    });

    this.redisSubscriber = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword
    });

    this.redisSubscriber.on('connect', () => {
      this.logger.log('Redis subscriber connected for WebSocket');
    });

    this.redisSubscriber.on('error', (error) => {
      this.logger.error(`Redis subscriber error: ${error.message}`);
    });
  }

  async broadcastToRoom(room: string, event: string, data: any): Promise<void> {
    if (this.server) {
      this.server.to(room).emit(event, data);
      this.metricsService.incrementEventCount(event);

      // Publish to Redis for other instances
      await this.redisPublisher.publish(
        'websocket',
        JSON.stringify({ room, event, data })
      );
    }
  }

  async broadcastToUser(userId: string, event: string, data: any): Promise<void> {
    await this.broadcastToRoom(`user:${userId}`, event, data);
  }

  async broadcastToRole(role: string, event: string, data: any): Promise<void> {
    await this.broadcastToRoom(`role:${role}`, event, data);
  }

  async broadcastToAll(event: string, data: any): Promise<void> {
    if (this.server) {
      this.server.emit(event, data);
      this.metricsService.incrementEventCount(event);

      // Publish to Redis for other instances
      await this.redisPublisher.publish(
        'websocket',
        JSON.stringify({ room: null, event, data })
      );
    }
  }

  getServer(): Server {
    return this.server;
  }

  getClientCount(): number {
    return this.server ? this.server.engine.clientsCount : 0;
  }

  getRoomClients(room: string): Promise<string[]> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve([]);
        return;
      }

      this.server.in(room).allSockets().then(sockets => {
        resolve(Array.from(sockets));
      }).catch(() => {
        resolve([]);
      });
    });
  }

  async getClientInfo(clientId: string): Promise<{
    connected: boolean;
    rooms: string[];
    user?: any;
  }> {
    if (!this.server) {
      return { connected: false, rooms: [] };
    }

    const sockets = await this.server.fetchSockets();
    const client = sockets.find(socket => socket.id === clientId);

    if (!client) {
      return { connected: false, rooms: [] };
    }

    return {
      connected: true,
      rooms: Array.from(client.rooms),
      user: client.data.user
    };
  }
}

// src/websocket/websocket.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

export class WebSocketAdapter extends IoAdapter {
  private redisAdapter: any;

  constructor(app: any, private configService: ConfigService) {
    super(app);
    this.initializeRedisAdapter();
  }

  private initializeRedisAdapter(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');
    const redisPort = this.configService.get<number>('REDIS_PORT');
    const redisHost = this.configService.get<string>('REDIS_HOST');

    const pubClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword
    });

    const subClient = pubClient.duplicate();

    this.redisAdapter = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);

    // Use Redis adapter for horizontal scaling
    server.adapter(this.redisAdapter);

    return server;
  }
}

// src/websocket/websocket.module.ts
import { Module, Global } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket.gateway';
import { WebSocketAuthService } from './websocket-auth.service';
import { WebSocketRoomService } from './websocket-room.service';
import { WebSocketEventService } from './websocket-event.service';
import { WebSocketMetricsService } from './websocket-metrics.service';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' }
    })
  ],
  providers: [
    WebSocketGatewayService,
    WebSocketAuthService,
    WebSocketRoomService,
    WebSocketEventService,
    WebSocketMetricsService
  ],
  exports: [
    WebSocketGatewayService,
    WebSocketEventService
  ]
})
export class WebSocketModule {}
```

### Real-Time Event Handlers

```typescript
// src/websocket/websocket-event.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WebSocketGatewayService } from './websocket.gateway';
import { WebSocketRoomService } from './websocket-room.service';
import { WebSocketMetricsService } from './websocket-metrics.service';

interface WebSocketEvent {
  event: string;
  data: any;
  room?: string;
  userId?: string;
  role?: string;
}

@Injectable()
export class WebSocketEventService {
  private readonly logger = new Logger(WebSocketEventService.name);
  private readonly eventEmitter = new EventEmitter2();

  constructor(
    private gateway: WebSocketGatewayService,
    private roomService: WebSocketRoomService,
    private metricsService: WebSocketMetricsService
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for internal events and broadcast them via WebSocket
    this.eventEmitter.on('*', (event, data) => {
      this.handleInternalEvent(event as string, data);
    });
  }

  private async handleInternalEvent(event: string, data: any): Promise<void> {
    try {
      this.logger.debug(`Handling internal event: ${event}`);

      // Determine the appropriate broadcast method based on event type
      if (event.startsWith('claim:')) {
        await this.handleClaimEvent(event, data);
      } else if (event.startsWith('policy:')) {
        await this.handlePolicyEvent(event, data);
      } else if (event.startsWith('notification:')) {
        await this.handleNotificationEvent(event, data);
      } else if (event.startsWith('system:')) {
        await this.handleSystemEvent(event, data);
      } else {
        this.logger.warn(`No handler for event type: ${event}`);
      }

      this.metricsService.incrementEventCount(event);
    } catch (error) {
      this.logger.error(`Error handling event ${event}: ${error.message}`);
    }
  }

  private async handleClaimEvent(event: string, data: any): Promise<void> {
    const { claimId, agentId, customerId } = data;

    // Broadcast to claim-specific room
    await this.gateway.broadcastToRoom(`claim:${claimId}`, event, data);

    // Broadcast to agent
    if (agentId) {
      await this.gateway.broadcastToUser(agentId, event, data);
    }

    // Broadcast to customer
    if (customerId) {
      await this.gateway.broadcastToUser(customerId, event, data);
    }

    // Broadcast to claims adjusters role
    await this.gateway.broadcastToRole('claims-adjuster', event, data);
  }

  private async handlePolicyEvent(event: string, data: any): Promise<void> {
    const { policyId, agentId, customerId } = data;

    // Broadcast to policy-specific room
    await this.gateway.broadcastToRoom(`policy:${policyId}`, event, data);

    // Broadcast to agent
    if (agentId) {
      await this.gateway.broadcastToUser(agentId, event, data);
    }

    // Broadcast to customer
    if (customerId) {
      await this.gateway.broadcastToUser(customerId, event, data);
    }

    // Broadcast to agents role
    await this.gateway.broadcastToRole('agent', event, data);
  }

  private async handleNotificationEvent(event: string, data: any): Promise<void> {
    const { userId, role } = data;

    // Broadcast to specific user
    if (userId) {
      await this.gateway.broadcastToUser(userId, event, data);
    }

    // Broadcast to role if specified
    if (role) {
      await this.gateway.broadcastToRole(role, event, data);
    }
  }

  private async handleSystemEvent(event: string, data: any): Promise<void> {
    // Broadcast to all admins
    await this.gateway.broadcastToRole('admin', event, data);

    // For critical system events, broadcast to all connected clients
    if (data.severity === 'critical') {
      await this.gateway.broadcastToAll(event, data);
    }
  }

  emit(event: string, data: any): void {
    this.eventEmitter.emit(event, data);
  }

  on(event: string, listener: (data: any) => void): void {
    this.eventEmitter.on(event, listener);
  }

  async broadcast(event: WebSocketEvent): Promise<void> {
    try {
      if (event.room) {
        await this.gateway.broadcastToRoom(event.room, event.event, event.data);
      } else if (event.userId) {
        await this.gateway.broadcastToUser(event.userId, event.event, event.data);
      } else if (event.role) {
        await this.gateway.broadcastToRole(event.role, event.event, event.data);
      } else {
        await this.gateway.broadcastToAll(event.event, event.data);
      }
    } catch (error) {
      this.logger.error(`Error broadcasting event ${event.event}: ${error.message}`);
    }
  }

  async broadcastToMultiple(event: string, targets: Array<{ type: 'room' | 'user' | 'role'; id: string }>, data: any): Promise<void> {
    await Promise.all(targets.map(target => {
      switch (target.type) {
        case 'room':
          return this.gateway.broadcastToRoom(target.id, event, data);
        case 'user':
          return this.gateway.broadcastToUser(target.id, event, data);
        case 'role':
          return this.gateway.broadcastToRole(target.id, event, data);
      }
    }));
  }

  async createEventStream(userId: string, eventTypes: string[]): Promise<void> {
    // Join rooms for all event types
    await Promise.all(eventTypes.map(eventType => {
      return this.roomService.joinRoomByClientId(userId, `stream:${eventType}`);
    }));

    this.logger.debug(`Created event stream for user ${userId} with events: ${eventTypes.join(', ')}`);
  }

  async closeEventStream(userId: string, eventTypes: string[]): Promise<void> {
    // Leave rooms for all event types
    await Promise.all(eventTypes.map(eventType => {
      return this.roomService.leaveRoom(userId, `stream:${eventType}`);
    }));

    this.logger.debug(`Closed event stream for user ${userId}`);
  }

  async handleCustomEvent(event: string, handler: (data: any) => Promise<void>): Promise<void> {
    this.on(event, async (data) => {
      try {
        await handler(data);
      } catch (error) {
        this.logger.error(`Error in custom event handler for ${event}: ${error.message}`);
      }
    });
  }
}

// src/websocket/websocket-auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WebSocketAuthService {
  private readonly logger = new Logger(WebSocketAuthService.name);

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService
  ) {}

  async validateUser(payload: any): Promise<User | null> {
    try {
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        this.logger.warn(`User not found: ${payload.sub}`);
        return null;
      }

      if (!user.isActive) {
        this.logger.warn(`User is inactive: ${payload.sub}`);
        return null;
      }

      // Check token expiration
      if (payload.exp * 1000 < Date.now()) {
        this.logger.warn(`Token expired for user: ${payload.sub}`);
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error(`Error validating user: ${error.message}`);
      return null;
    }
  }

  async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
    };

    return this.jwtService.sign(payload);
  }

  async refreshToken(token: string): Promise<string> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.validateUser(payload);

      if (!user) {
        throw new Error('Invalid user');
      }

      return this.generateToken(user);
    } catch (error) {
      this.logger.error(`Error refreshing token: ${error.message}`);
      throw new Error('Invalid token');
    }
  }
}

// src/websocket/websocket-room.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WebSocketGatewayService } from './websocket.gateway';

@Injectable()
export class WebSocketRoomService {
  private readonly logger = new Logger(WebSocketRoomService.name);
  private readonly rooms = new Map<string, Set<string>>();

  constructor(private gateway: WebSocketGatewayService) {}

  async joinRoom(client: Socket, room: string): Promise<void> {
    try {
      await client.join(room);
      this.addToRoom(room, client.id);

      this.logger.debug(`Client ${client.id} joined room ${room}`);
    } catch (error) {
      this.logger.error(`Error joining room ${room}: ${error.message}`);
      throw error;
    }
  }

  async leaveRoom(client: Socket, room: string): Promise<void> {
    try {
      await client.leave(room);
      this.removeFromRoom(room, client.id);

      this.logger.debug(`Client ${client.id} left room ${room}`);
    } catch (error) {
      this.logger.error(`Error leaving room ${room}: ${error.message}`);
      throw error;
    }
  }

  async joinRoomByClientId(clientId: string, room: string): Promise<void> {
    try {
      const client = await this.getClient(clientId);
      if (client) {
        await this.joinRoom(client, room);
      }
    } catch (error) {
      this.logger.error(`Error joining room by client ID: ${error.message}`);
    }
  }

  async leaveRoomByClientId(clientId: string, room: string): Promise<void> {
    try {
      const client = await this.getClient(clientId);
      if (client) {
        await this.leaveRoom(client, room);
      }
    } catch (error) {
      this.logger.error(`Error leaving room by client ID: ${error.message}`);
    }
  }

  async leaveAllRooms(clientId: string): Promise<void> {
    try {
      const client = await this.getClient(clientId);
      if (client) {
        const rooms = Array.from(client.rooms);
        await Promise.all(rooms.map(room => this.leaveRoom(client, room)));
      }

      // Clean up our room tracking
      this.rooms.forEach((clients, room) => {
        clients.delete(clientId);
        if (clients.size === 0) {
          this.rooms.delete(room);
        }
      });
    } catch (error) {
      this.logger.error(`Error leaving all rooms for client ${clientId}: ${error.message}`);
    }
  }

  getClientsInRoom(room: string): string[] {
    return Array.from(this.rooms.get(room) || []);
  }

  getRoomsForClient(clientId: string): string[] {
    const rooms: string[] = [];
    this.rooms.forEach((clients, room) => {
      if (clients.has(clientId)) {
        rooms.push(room);
      }
    });
    return rooms;
  }

  getAllRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  private addToRoom(room: string, clientId: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)?.add(clientId);
  }

  private removeFromRoom(room: string, clientId: string): void {
    const clients = this.rooms.get(room);
    if (clients) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  private async getClient(clientId: string): Promise<Socket | null> {
    try {
      const sockets = await this.gateway.getServer().fetchSockets();
      return sockets.find(socket => socket.id === clientId) || null;
    } catch (error) {
      this.logger.error(`Error fetching client ${clientId}: ${error.message}`);
      return null;
    }
  }
}
```

### Client-Side WebSocket Integration

```typescript
// src/websocket/websocket-client.service.ts
import { Injectable, Logger, OnDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject, fromEvent } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { WebSocketEvent } from './interfaces/websocket-event.interface';
import { WebSocketConnectionStatus } from './enums/websocket-connection-status.enum';

@Injectable()
export class WebSocketClientService implements OnDestroy {
  private readonly logger = new Logger(WebSocketClientService.name);
  private socket: Socket | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly connectionStatus$ = new BehaviorSubject<WebSocketConnectionStatus>(
    WebSocketConnectionStatus.DISCONNECTED
  );
  private readonly eventSubject$ = new Subject<WebSocketEvent>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private jwtToken: string | null = null;

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private initialize(): void {
    this.setupConnectionStatusListener();
  }

  private setupConnectionStatusListener(): void {
    this.connectionStatus$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(status => {
      this.logger.debug(`WebSocket connection status: ${status}`);

      if (status === WebSocketConnectionStatus.CONNECTED) {
        this.reconnectAttempts = 0;
      }
    });
  }

  connect(token: string): void {
    if (this.socket && this.connectionStatus$.value === WebSocketConnectionStatus.CONNECTED) {
      this.logger.warn('WebSocket already connected');
      return;
    }

    this.jwtToken = token;
    this.createSocket();
  }

  private createSocket(): void {
    const websocketUrl = this.configService.get<string>('WEBSOCKET_URL');
    if (!websocketUrl) {
      this.logger.error('WebSocket URL not configured');
      return;
    }

    this.socket = io(websocketUrl, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false, // We'll handle reconnection manually
      query: {
        token: this.jwtToken
      },
      path: '/socket.io',
      withCredentials: true,
      rejectUnauthorized: false
    });

    this.setupSocketEventListeners();
    this.socket.connect();
  }

  private setupSocketEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.logger.log('WebSocket connected');
      this.connectionStatus$.next(WebSocketConnectionStatus.CONNECTED);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.warn(`WebSocket disconnected: ${reason}`);
      this.connectionStatus$.next(WebSocketConnectionStatus.DISCONNECTED);

      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error(`WebSocket connection error: ${error.message}`);
      this.connectionStatus$.next(WebSocketConnectionStatus.CONNECTION_ERROR);

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.handleReconnection();
      } else {
        this.connectionStatus$.next(WebSocketConnectionStatus.DISCONNECTED);
      }
    });

    // Custom events
    this.socket.onAny((event, data) => {
      this.eventSubject$.next({ event, data });
    });
  }

  private handleReconnection(): void {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);

    this.logger.log(`Attempting to reconnect (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(() => {
      if (this.socket && this.connectionStatus$.value !== WebSocketConnectionStatus.CONNECTED) {
        this.socket.connect();
      }
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus$.next(WebSocketConnectionStatus.DISCONNECTED);
      this.logger.log('WebSocket disconnected');
    }
  }

  reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.createSocket();
    }
  }

  getConnectionStatus(): Observable<WebSocketConnectionStatus> {
    return this.connectionStatus$.asObservable();
  }

  onEvent<T = any>(eventName: string): Observable<WebSocketEvent<T>> {
    return this.eventSubject$.pipe(
      filter(event => event.event === eventName),
      takeUntil(this.destroy$)
    );
  }

  onAnyEvent<T = any>(): Observable<WebSocketEvent<T>> {
    return this.eventSubject$.pipe(
      takeUntil(this.destroy$)
    );
  }

  emit<T = any>(event: string, data: T): void {
    if (this.socket && this.connectionStatus$.value === WebSocketConnectionStatus.CONNECTED) {
      this.socket.emit(event, data);
      this.logger.debug(`Emitted event: ${event}`);
    } else {
      this.logger.warn(`Cannot emit event ${event}: WebSocket not connected`);
    }
  }

  async emitWithAck<T = any, R = any>(event: string, data: T): Promise<R> {
    if (this.socket && this.connectionStatus$.value === WebSocketConnectionStatus.CONNECTED) {
      try {
        const response = await this.socket.emitWithAck(event, data);
        this.logger.debug(`Emitted event with ack: ${event}`);
        return response;
      } catch (error) {
        this.logger.error(`Error in emitWithAck for event ${event}: ${error.message}`);
        throw error;
      }
    } else {
      this.logger.warn(`Cannot emit event with ack ${event}: WebSocket not connected`);
      throw new Error('WebSocket not connected');
    }
  }

  joinRoom(room: string): void {
    if (this.socket && this.connectionStatus$.value === WebSocketConnectionStatus.CONNECTED) {
      this.socket.emit('join-room', room);
      this.logger.debug(`Joined room: ${room}`);
    } else {
      this.logger.warn(`Cannot join room ${room}: WebSocket not connected`);
    }
  }

  leaveRoom(room: string): void {
    if (this.socket && this.connectionStatus$.value === WebSocketConnectionStatus.CONNECTED) {
      this.socket.emit('leave-room', room);
      this.logger.debug(`Left room: ${room}`);
    } else {
      this.logger.warn(`Cannot leave room ${room}: WebSocket not connected`);
    }
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  isConnected(): boolean {
    return this.connectionStatus$.value === WebSocketConnectionStatus.CONNECTED;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  async createEventStream(eventTypes: string[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    try {
      const response = await this.emitWithAck('create-event-stream', { eventTypes });
      this.logger.log(`Created event stream for events: ${eventTypes.join(', ')}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to create event stream: ${error.message}`);
      throw error;
    }
  }

  async closeEventStream(eventTypes: string[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    try {
      const response = await this.emitWithAck('close-event-stream', { eventTypes });
      this.logger.log(`Closed event stream for events: ${eventTypes.join(', ')}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to close event stream: ${error.message}`);
      throw error;
    }
  }

  async getConnectionInfo(): Promise<{
    connected: boolean;
    socketId: string | null;
    rooms: string[];
    connectionTime: Date | null;
  }> {
    if (!this.socket) {
      return {
        connected: false,
        socketId: null,
        rooms: [],
        connectionTime: null
      };
    }

    return {
      connected: this.isConnected(),
      socketId: this.socket.id,
      rooms: Array.from(this.socket.rooms),
      connectionTime: this.socket.connected ? new Date() : null
    };
  }
}

// src/websocket/websocket-client.module.ts
import { Module, Global } from '@nestjs/common';
import { WebSocketClientService } from './websocket-client.service';

@Global()
@Module({
  providers: [WebSocketClientService],
  exports: [WebSocketClientService]
})
export class WebSocketClientModule {}

// src/claims/claims.controller.ts
import { Controller, Get, Param, Sse, MessageEvent } from '@nestjs/common';
import { WebSocketClientService } from '../websocket/websocket-client.service';
import { Observable, fromEvent, map } from 'rxjs';
import { Claim } from './entities/claim.entity';

@Controller('claims')
export class ClaimsController {
  constructor(private websocketClient: WebSocketClientService) {}

  @Sse(':id/events')
  claimEvents(@Param('id') id: string): Observable<MessageEvent> {
    return this.websocketClient.onEvent<Claim>(`claim:${id}:updated`).pipe(
      map(event => ({
        data: event.data,
        id: event.data.id,
        type: 'claim-updated'
      }))
    );
  }

  @Get(':id/subscribe')
  async subscribeToClaim(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      this.websocketClient.joinRoom(`claim:${id}`);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  @Get(':id/unsubscribe')
  async unsubscribeFromClaim(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      this.websocketClient.leaveRoom(`claim:${id}`);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }
}

// src/policies/policies.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocketEventService } from '../websocket/websocket-event.service';
import { Policy } from './entities/policy.entity';

@Injectable()
export class PoliciesService {
  constructor(private eventService: WebSocketEventService) {}

  async createPolicy(policyData: Omit<Policy, 'id'>): Promise<Policy> {
    // ... create policy logic

    // Emit real-time event
    this.eventService.emit('policy:created', {
      policyId: createdPolicy.id,
      customerId: createdPolicy.customerId,
      agentId: createdPolicy.agentId,
      status: createdPolicy.status,
      timestamp: new Date().toISOString()
    });

    return createdPolicy;
  }

  async updatePolicy(id: string, updateData: Partial<Policy>): Promise<Policy> {
    // ... update policy logic

    // Emit real-time event
    this.eventService.emit('policy:updated', {
      policyId: id,
      customerId: updatedPolicy.customerId,
      agentId: updatedPolicy.agentId,
      changes: updateData,
      timestamp: new Date().toISOString()
    });

    return updatedPolicy;
  }

  async renewPolicy(id: string): Promise<Policy> {
    // ... renew policy logic

    // Emit real-time event
    this.eventService.emit('policy:renewed', {
      policyId: id,
      customerId: renewedPolicy.customerId,
      agentId: renewedPolicy.agentId,
      newExpirationDate: renewedPolicy.expirationDate,
      timestamp: new Date().toISOString()
    });

    return renewedPolicy;
  }
}

// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocketEventService } from '../websocket/websocket-event.service';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(private eventService: WebSocketEventService) {}

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    // ... create notification logic

    // Emit real-time event
    this.eventService.emit('notification:created', {
      notificationId: createdNotification.id,
      userId: createdNotification.userId,
      type: createdNotification.type,
      message: createdNotification.message,
      timestamp: createdNotification.createdAt.toISOString()
    });

    return createdNotification;
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    // ... mark as read logic

    // Emit real-time event
    this.eventService.emit('notification:read', {
      notificationId,
      userId,
      timestamp: new Date().toISOString()
    });

    return updatedNotification;
  }
}

// src/main.ts (client-side example)
import { WebSocketClientService } from './websocket/websocket-client.service';
import { WebSocketConnectionStatus } from './websocket/enums/websocket-connection-status.enum';

// Example client-side usage
const websocketClient = new WebSocketClientService(/* config */);

// Connect with JWT token
websocketClient.connect('your-jwt-token-here');

// Listen for connection status changes
websocketClient.getConnectionStatus().subscribe(status => {
  console.log('Connection status:', status);

  if (status === WebSocketConnectionStatus.CONNECTED) {
    // Join rooms after connection
    websocketClient.joinRoom('user:123');
    websocketClient.joinRoom('role:agent');

    // Create event stream for specific events
    websocketClient.createEventStream(['claim:updated', 'policy:updated']);
  }
});

// Listen for specific events
websocketClient.onEvent<{ claimId: string; status: string }>('claim:updated').subscribe(event => {
  console.log('Claim updated:', event.data);
});

// Listen for all events
websocketClient.onAnyEvent().subscribe(event => {
  console.log('Event received:', event.event, event.data);
});

// Emit an event
websocketClient.emit('custom-event', { data: 'Hello World' });

// Emit with acknowledgment
websocketClient.emitWithAck('custom-event-with-ack', { data: 'Hello' })
  .then(response => console.log('Ack response:', response))
  .catch(error => console.error('Ack error:', error));
```

### Room/Channel Management

```typescript
// src/websocket/websocket-room-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket.gateway';
import { WebSocketRoomService } from './websocket-room.service';
import { WebSocketEventService } from './websocket-event.service';
import { WebSocketMetricsService } from './websocket-metrics.service';

interface RoomConfiguration {
  name: string;
  description: string;
  isPublic: boolean;
  maxClients?: number;
  requiresAuth?: boolean;
  allowedRoles?: string[];
  autoJoin?: boolean;
  persistent?: boolean;
}

@Injectable()
export class WebSocketRoomManagerService {
  private readonly logger = new Logger(WebSocketRoomManagerService.name);
  private readonly roomConfigurations = new Map<string, RoomConfiguration>();
  private readonly persistentRooms = new Set<string>();

  constructor(
    private gateway: WebSocketGatewayService,
    private roomService: WebSocketRoomService,
    private eventService: WebSocketEventService,
    private metricsService: WebSocketMetricsService
  ) {
    this.initializeDefaultRooms();
  }

  private initializeDefaultRooms(): void {
    // System rooms
    this.registerRoom({
      name: 'system:all',
      description: 'All connected clients',
      isPublic: true,
      autoJoin: true,
      persistent: true
    });

    this.registerRoom({
      name: 'system:admins',
      description: 'All admin users',
      isPublic: false,
      requiresAuth: true,
      allowedRoles: ['admin'],
      persistent: true
    });

    // Business domain rooms
    this.registerRoom({
      name: 'domain:claims',
      description: 'All claims-related events',
      isPublic: false,
      requiresAuth: true,
      persistent: true
    });

    this.registerRoom({
      name: 'domain:policies',
      description: 'All policies-related events',
      isPublic: false,
      requiresAuth: true,
      persistent: true
    });

    this.registerRoom({
      name: 'domain:customers',
      description: 'All customers-related events',
      isPublic: false,
      requiresAuth: true,
      persistent: true
    });
  }

  registerRoom(config: RoomConfiguration): void {
    this.roomConfigurations.set(config.name, config);

    if (config.persistent) {
      this.persistentRooms.add(config.name);
    }

    this.logger.log(`Registered room: ${config.name}`);
  }

  async createRoom(name: string, config?: Partial<RoomConfiguration>): Promise<void> {
    const defaultConfig: RoomConfiguration = {
      name,
      description: `Custom room: ${name}`,
      isPublic: false,
      requiresAuth: true,
      persistent: false
    };

    const roomConfig = { ...defaultConfig, ...config };
    this.registerRoom(roomConfig);
  }

  async joinRoom(clientId: string, roomName: string, user?: any): Promise<boolean> {
    try {
      const config = this.roomConfigurations.get(roomName);

      if (!config) {
        this.logger.warn(`Attempt to join non-existent room: ${roomName}`);
        return false;
      }

      // Check room capacity
      if (config.maxClients) {
        const clientCount = await this.getClientCount(roomName);
        if (clientCount >= config.maxClients) {
          this.logger.warn(`Room ${roomName} is at capacity (${config.maxClients})`);
          return false;
        }
      }

      // Check authentication
      if (config.requiresAuth && !user) {
        this.logger.warn(`Attempt to join authenticated room ${roomName} without authentication`);
        return false;
      }

      // Check roles
      if (config.allowedRoles && user?.roles) {
        const hasRequiredRole = config.allowedRoles.some(role => user.roles.includes(role));
        if (!hasRequiredRole) {
          this.logger.warn(`User ${user.id} does not have required role for room ${roomName}`);
          return false;
        }
      }

      await this.roomService.joinRoomByClientId(clientId, roomName);

      this.logger.debug(`Client ${clientId} joined room ${roomName}`);
      this.metricsService.incrementRoomJoin(roomName);

      // Emit room join event
      this.eventService.emit('room:joined', {
        clientId,
        room: roomName,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      this.logger.error(`Error joining room ${roomName}: ${error.message}`);
      return false;
    }
  }

  async leaveRoom(clientId: string, roomName: string): Promise<boolean> {
    try {
      const config = this.roomConfigurations.get(roomName);

      if (!config) {
        this.logger.warn(`Attempt to leave non-existent room: ${roomName}`);
        return false;
      }

      // Don't allow leaving persistent rooms
      if (config.persistent) {
        this.logger.warn(`Attempt to leave persistent room: ${roomName}`);
        return false;
      }

      await this.roomService.leaveRoomByClientId(clientId, roomName);

      this.logger.debug(`Client ${clientId} left room ${roomName}`);
      this.metricsService.incrementRoomLeave(roomName);

      // Emit room leave event
      this.eventService.emit('room:left', {
        clientId,
        room: roomName,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      this.logger.error(`Error leaving room ${roomName}: ${error.message}`);
      return false;
    }
  }

  async getClientCount(roomName: string): Promise<number> {
    try {
      const clientIds = await this.gateway.getRoomClients(roomName);
      return clientIds.length;
    } catch (error) {
      this.logger.error(`Error getting client count for room ${roomName}: ${error.message}`);
      return 0;
    }
  }

  async getRoomInfo(roomName: string): Promise<{
    name: string;
    description: string;
    clientCount: number;
    isPublic: boolean;
    requiresAuth: boolean;
    allowedRoles?: string[];
    persistent: boolean;
    createdAt: Date;
  } | null> {
    const config = this.roomConfigurations.get(roomName);
    if (!config) {
      return null;
    }

    const clientCount = await this.getClientCount(roomName);

    return {
      name: config.name,
      description: config.description,
      clientCount,
      isPublic: config.isPublic,
      requiresAuth: config.requiresAuth,
      allowedRoles: config.allowedRoles,
      persistent: config.persistent,
      createdAt: new Date() // In a real implementation, track actual creation time
    };
  }

  async getAllRooms(): Promise<Array<{
    name: string;
    description: string;
    clientCount: number;
    isPublic: boolean;
  }>> {
    const roomNames = this.roomService.getAllRooms();
    const roomsInfo = await Promise.all(roomNames.map(async name => {
      const clientCount = await this.getClientCount(name);
      const config = this.roomConfigurations.get(name) || {
        name,
        description: 'Unknown room',
        isPublic: false
      };

      return {
        name: config.name,
        description: config.description,
        clientCount,
        isPublic: config.isPublic
      };
    }));

    return roomsInfo.sort((a, b) => b.clientCount - a.clientCount);
  }

  async getRoomsForClient(clientId: string): Promise<string[]> {
    return this.roomService.getRoomsForClient(clientId);
  }

  async broadcastToRoom(roomName: string, event: string, data: any): Promise<void> {
    try {
      const config = this.roomConfigurations.get(roomName);
      if (!config) {
        this.logger.warn(`Attempt to broadcast to non-existent room: ${roomName}`);
        return;
      }

      await this.gateway.broadcastToRoom(roomName, event, data);
      this.metricsService.incrementEventCount(event);
    } catch (error) {
      this.logger.error(`Error broadcasting to room ${roomName}: ${error.message}`);
    }
  }

  async broadcastToMultipleRooms(roomNames: string[], event: string, data: any): Promise<void> {
    try {
      await Promise.all(roomNames.map(roomName =>
        this.broadcastToRoom(roomName, event, data)
      ));
    } catch (error) {
      this.logger.error(`Error broadcasting to multiple rooms: ${error.message}`);
    }
  }

  async autoJoinRooms(clientId: string, user: any): Promise<void> {
    const roomsToJoin = Array.from(this.roomConfigurations.values())
      .filter(config => config.autoJoin)
      .filter(config => {
        // Check if user meets room requirements
        if (config.requiresAuth && !user) return false;
        if (config.allowedRoles && user?.roles) {
          return config.allowedRoles.some(role => user.roles.includes(role));
        }
        return true;
      })
      .map(config => config.name);

    await Promise.all(roomsToJoin.map(roomName =>
      this.joinRoom(clientId, roomName, user)
    ));

    this.logger.debug(`Auto-joined rooms for client ${clientId}: ${roomsToJoin.join(', ')}`);
  }

  async cleanupInactiveRooms(): Promise<void> {
    const allRooms = this.roomService.getAllRooms();
    const roomsToCleanup = allRooms.filter(room => {
      const config = this.roomConfigurations.get(room);
      return config && !config.persistent && !this.persistentRooms.has(room);
    });

    for (const room of roomsToCleanup) {
      const clientCount = await this.getClientCount(room);
      if (clientCount === 0) {
        this.roomConfigurations.delete(room);
        this.logger.log(`Cleaned up inactive room: ${room}`);
      }
    }
  }

  async getRoomMetrics(): Promise<{
    totalRooms: number;
    publicRooms: number;
    privateRooms: number;
    persistentRooms: number;
    totalClients: number;
    roomsByClientCount: Array<{ count: number; rooms: number }>;
  }> {
    const allRooms = await this.getAllRooms();
    const clientCounts = await Promise.all(allRooms.map(room => this.getClientCount(room.name)));

    const totalClients = clientCounts.reduce((sum, count) => sum + count, 0);

    // Group rooms by client count
    const countGroups = new Map<number, number>();
    clientCounts.forEach(count => {
      countGroups.set(count, (countGroups.get(count) || 0) + 1);
    });

    const roomsByClientCount = Array.from(countGroups.entries())
      .map(([count, rooms]) => ({ count, rooms }))
      .sort((a, b) => b.count - a.count);

    return {
      totalRooms: allRooms.length,
      publicRooms: allRooms.filter(room => room.isPublic).length,
      privateRooms: allRooms.filter(room => !room.isPublic).length,
      persistentRooms: Array.from(this.persistentRooms).length,
      totalClients,
      roomsByClientCount
    };
  }

  async createTemporaryRoom(name: string, ttl: number): Promise<void> {
    await this.createRoom(name, {
      description: `Temporary room: ${name}`,
      isPublic: false,
      persistent: false
    });

    // Set timeout to clean up the room
    setTimeout(async () => {
      const clientCount = await this.getClientCount(name);
      if (clientCount === 0) {
        this.roomConfigurations.delete(name);
        this.logger.log(`Cleaned up temporary room: ${name}`);
      }
    }, ttl);
  }

  async getRoomHierarchy(): Promise<{
    name: string;
    children: Array<{
      name: string;
      clientCount: number;
    }>;
  }[]> {
    const allRooms = await this.getAllRooms();

    // Group rooms by prefix
    const roomGroups = new Map<string, Array<{ name: string; clientCount: number }>>();

    allRooms.forEach(room => {
      const prefix = room.name.split(':')[0];
      if (!roomGroups.has(prefix)) {
        roomGroups.set(prefix, []);
      }
      roomGroups.get(prefix)?.push({
        name: room.name,
        clientCount: room.clientCount
      });
    });

    return Array.from(roomGroups.entries()).map(([name, children]) => ({
      name,
      children: children.sort((a, b) => b.clientCount - a.clientCount)
    }));
  }
}

// src/websocket/websocket-room-manager.module.ts
import { Module } from '@nestjs/common';
import { WebSocketRoomManagerService } from './websocket-room-manager.service';
import { WebSocketModule } from './websocket.module';

@Module({
  imports: [WebSocketModule],
  providers: [WebSocketRoomManagerService],
  exports: [WebSocketRoomManagerService]
})
export class WebSocketRoomManagerModule {}

// src/claims/claims.gateway.ts
import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { WebSocketRoomManagerService } from '../websocket/websocket-room-manager.service';
import { WebSocketEventService } from '../websocket/websocket-event.service';

@WebSocketGateway()
export class ClaimsGateway {
  constructor(
    private roomManager: WebSocketRoomManagerService,
    private eventService: WebSocketEventService
  ) {}

  @SubscribeMessage('join-claim-room')
  async handleJoinClaimRoom(client: any, claimId: string): Promise<boolean> {
    return this.roomManager.joinRoom(client.id, `claim:${claimId}`, client.data.user);
  }

  @SubscribeMessage('leave-claim-room')
  async handleLeaveClaimRoom(client: any, claimId: string): Promise<boolean> {
    return this.roomManager.leaveRoom(client.id, `claim:${claimId}`);
  }

  async broadcastClaimUpdate(claimId: string, data: any): Promise<void> {
    await this.roomManager.broadcastToRoom(`claim:${claimId}`, 'claim:updated', data);
    await this.roomManager.broadcastToRoom('domain:claims', 'claim:updated', data);
  }
}

// src/policies/policies.gateway.ts
import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { WebSocketRoomManagerService } from '../websocket/websocket-room-manager.service';

@WebSocketGateway()
export class PoliciesGateway {
  constructor(private roomManager: WebSocketRoomManagerService) {}

  @SubscribeMessage('join-policy-room')
  async handleJoinPolicyRoom(client: any, policyId: string): Promise<boolean> {
    return this.roomManager.joinRoom(client.id, `policy:${policyId}`, client.data.user);
  }

  @SubscribeMessage('leave-policy-room')
  async handleLeavePolicyRoom(client: any, policyId: string): Promise<boolean> {
    return this.roomManager.leaveRoom(client.id, `policy:${policyId}`);
  }

  async broadcastPolicyUpdate(policyId: string, data: any): Promise<void> {
    await this.roomManager.broadcastToRoom(`policy:${policyId}`, 'policy:updated', data);
    await this.roomManager.broadcastToRoom('domain:policies', 'policy:updated', data);
  }
}

// src/notifications/notifications.gateway.ts
import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { WebSocketRoomManagerService } from '../websocket/websocket-room-manager.service';

@WebSocketGateway()
export class NotificationsGateway {
  constructor(private roomManager: WebSocketRoomManagerService) {}

  @SubscribeMessage('join-notification-stream')
  async handleJoinNotificationStream(client: any): Promise<boolean> {
    return this.roomManager.joinRoom(client.id, `user:${client.data.user.id}:notifications`, client.data.user);
  }

  @SubscribeMessage('leave-notification-stream')
  async handleLeaveNotificationStream(client: any): Promise<boolean> {
    return this.roomManager.leaveRoom(client.id, `user:${client.data.user.id}:notifications`);
  }

  async broadcastNotification(userId: string, data: any): Promise<void> {
    await this.roomManager.broadcastToRoom(`user:${userId}:notifications`, 'notification:created', data);
  }
}
```

### Reconnection Logic

```typescript
// src/websocket/websocket-reconnection.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket.gateway';
import { WebSocketClientService } from './websocket-client.service';
import { WebSocketRoomManagerService } from './websocket-room-manager.service';
import { WebSocketEventService } from './websocket-event.service';
import { WebSocketMetricsService } from './websocket-metrics.service';
import { interval, Subject } from 'rxjs';
import { takeUntil, filter, tap } from 'rxjs/operators';

@Injectable()
export class WebSocketReconnectionService {
  private readonly logger = new Logger(WebSocketReconnectionService.name);
  private readonly destroy$ = new Subject<void>();
  private readonly reconnectionInterval = 30000; // 30 seconds
  private readonly maxReconnectionAttempts = 10;
  private reconnectionAttempts = new Map<string, number>();

  constructor(
    private gateway: WebSocketGatewayService,
    private clientService: WebSocketClientService,
    private roomManager: WebSocketRoomManagerService,
    private eventService: WebSocketEventService,
    private metricsService: WebSocketMetricsService
  ) {
    this.setupReconnectionMonitor();
    this.setupEventListeners();
  }

  private setupReconnectionMonitor(): void {
    interval(this.reconnectionInterval).pipe(
      takeUntil(this.destroy$),
      filter(() => this.gateway.getClientCount() === 0)
    ).subscribe(() => {
      this.logger.log('No active WebSocket connections - checking for reconnection opportunities');
      // In a real implementation, you might want to trigger a health check
    });
  }

  private setupEventListeners(): void {
    this.eventService.on('client:disconnected', (data) => {
      this.handleClientDisconnection(data.clientId);
    });

    this.eventService.on('client:reconnected', (data) => {
      this.handleClientReconnection(data.clientId);
    });
  }

  private async handleClientDisconnection(clientId: string): Promise<void> {
    this.logger.debug(`Handling disconnection for client: ${clientId}`);

    // Get the rooms the client was in
    const rooms = await this.roomManager.getRoomsForClient(clientId);
    this.logger.debug(`Client ${clientId} was in rooms: ${rooms.join(', ')}`);

    // Store the rooms for potential reconnection
    if (rooms.length > 0) {
      this.metricsService.trackDisconnectedClient(clientId, rooms);
    }

    // Initialize reconnection attempts counter
    this.reconnectionAttempts.set(clientId, 0);
  }

  private async handleClientReconnection(clientId: string): Promise<void> {
    this.logger.debug(`Handling reconnection for client: ${clientId}`);

    // Get the rooms the client was in before disconnection
    const previousRooms = this.metricsService.getDisconnectedClientRooms(clientId);

    if (previousRooms && previousRooms.length > 0) {
      this.logger.debug(`Rejoining rooms for client ${clientId}: ${previousRooms.join(', ')}`);

      // Get the user associated with this client
      const clientInfo = await this.gateway.getClientInfo(clientId);
      const user = clientInfo.user;

      // Rejoin the rooms
      await Promise.all(previousRooms.map(room =>
        this.roomManager.joinRoom(clientId, room, user)
      ));

      this.metricsService.clearDisconnectedClient(clientId);
    }

    // Clear reconnection attempts
    this.reconnectionAttempts.delete(clientId);
  }

  async attemptReconnection(clientId: string): Promise<boolean> {
    const attempts = this.reconnectionAttempts.get(clientId) || 0;

    if (attempts >= this.maxReconnectionAttempts) {
      this.logger.warn(`Max reconnection attempts reached for client ${clientId}`);
      this.reconnectionAttempts.delete(clientId);
      return false;
    }

    this.reconnectionAttempts.set(clientId, attempts + 1);
    this.logger.log(`Attempting reconnection for client ${clientId} (attempt ${attempts + 1}/${this.maxReconnectionAttempts})`);

    try {
      // In a real implementation, you would trigger the client to reconnect
      // This might involve sending a push notification or using a service worker
      this.eventService.emit('reconnect:request', { clientId });

      // Wait for reconnection or timeout
      const reconnected = await this.waitForReconnection(clientId, 10000);

      if (reconnected) {
        this.logger.log(`Successfully reconnected client ${clientId}`);
        return true;
      } else {
        this.logger.warn(`Reconnection timeout for client ${clientId}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Error attempting reconnection for client ${clientId}: ${error.message}`);
      return false;
    }
  }

  private waitForReconnection(clientId: string, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        subscription.unsubscribe();
        resolve(false);
      }, timeout);

      const subscription = this.eventService.on('client:reconnected')
        .pipe(
          filter(event => event.data.clientId === clientId),
          tap(() => clearTimeout(timeoutId))
        )
        .subscribe({
          next: () => {
            subscription.unsubscribe();
            resolve(true);
          }
        });
    });
  }

  async scheduleReconnection(clientId: string, delay: number): Promise<void> {
    setTimeout(async () => {
      const success = await this.attemptReconnection(clientId);
      if (!success) {
        this.logger.warn(`Scheduled reconnection failed for client ${clientId}`);
      }
    }, delay);
  }

  async handleConnectionError(clientId: string, error: Error): Promise<void> {
    this.logger.error(`Connection error for client ${clientId}: ${error.message}`);

    // Check if this is a recoverable error
    if (this.isRecoverableError(error)) {
      const attempts = this.reconnectionAttempts.get(clientId) || 0;
      const delay = this.calculateBackoffDelay(attempts);

      this.logger.log(`Scheduling reconnection for client ${clientId} in ${delay}ms`);
      await this.scheduleReconnection(clientId, delay);
    } else {
      this.logger.warn(`Non-recoverable error for client ${clientId}, not attempting reconnection`);
      this.reconnectionAttempts.delete(clientId);
    }
  }

  private isRecoverableError(error: Error): boolean {
    // List of recoverable error messages
    const recoverableErrors = [
      'connection refused',
      'connection reset',
      'connection timed out',
      'network error',
      'socket hang up',
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ];

    return recoverableErrors.some(errorMessage =>
      error.message.toLowerCase().includes(errorMessage.toLowerCase())
    );
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter

    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay) + jitter;
    return Math.round(delay);
  }

  async getReconnectionStatus(clientId: string): Promise<{
    attempts: number;
    maxAttempts: number;
    nextAttemptIn?: number;
    lastAttempt?: Date;
  }> {
    const attempts = this.reconnectionAttempts.get(clientId) || 0;

    return {
      attempts,
      maxAttempts: this.maxReconnectionAttempts,
      ...(attempts > 0 && {
        nextAttemptIn: this.calculateBackoffDelay(attempts),
        lastAttempt: new Date(Date.now() - this.calculateBackoffDelay(attempts - 1))
      })
    };
  }

  async forceReconnectAll(): Promise<void> {
    this.logger.log('Forcing reconnection for all clients');

    const allClients = await this.gateway.getServer().fetchSockets();
    await Promise.all(allClients.map(async client => {
      try {
        await client.disconnect(true);
        this.logger.debug(`Forced disconnect for client ${client.id}`);
      } catch (error) {
        this.logger.error(`Error forcing disconnect for client ${client.id}: ${error.message}`);
      }
    }));
  }

  async getReconnectionMetrics(): Promise<{
    totalReconnectionAttempts: number;
    successfulReconnections: number;
    failedReconnections: number;
    clientsAttemptingReconnection: number;
    avgReconnectionTime: number;
  }> {
    return this.metricsService.getReconnectionMetrics();
  }

  onModuleDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// src/websocket/websocket-reconnection.module.ts
import { Module } from '@nestjs/common';
import { WebSocketReconnectionService } from './websocket-reconnection.service';
import { WebSocketModule } from './websocket.module';

@Module({
  imports: [WebSocketModule],
  providers: [WebSocketReconnectionService],
  exports: [WebSocketReconnectionService]
})
export class WebSocketReconnectionModule {}

// src/websocket/websocket-metrics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket.gateway';
import { interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable()
export class WebSocketMetricsService {
  private readonly logger = new Logger(WebSocketMetricsService.name);
  private readonly destroy$ = new Subject<void>();

  // Connection metrics
  private connectionCount = 0;
  private authenticatedCount = 0;
  private peakConnectionCount = 0;
  private totalConnections = 0;
  private totalDisconnections = 0;

  // Event metrics
  private eventCounts = new Map<string, number>();
  private totalEvents = 0;

  // Room metrics
  private roomJoins = new Map<string, number>();
  private roomLeaves = new Map<string, number>();
  private totalRoomJoins = 0;
  private totalRoomLeaves = 0;

  // Reconnection metrics
  private reconnectionAttempts = 0;
  private successfulReconnections = 0;
  private failedReconnections = 0;
  private reconnectionTimes: number[] = [];

  // Disconnected clients tracking
  private disconnectedClients = new Map<string, {
    rooms: string[];
    disconnectedAt: Date;
  }>();

  constructor(private gateway: WebSocketGatewayService) {}

  startMetricsCollection(): void {
    // Log metrics every minute
    interval(60000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.logMetrics();
    });
  }

  incrementConnectionCount(): void {
    this.connectionCount++;
    this.totalConnections++;

    if (this.connectionCount > this.peakConnectionCount) {
      this.peakConnectionCount = this.connectionCount;
    }
  }

  decrementConnectionCount(): void {
    this.connectionCount--;
    this.totalDisconnections++;
  }

  incrementAuthenticatedCount(): void {
    this.authenticatedCount++;
  }

  incrementEventCount(event: string): void {
    this.eventCounts.set(event, (this.eventCounts.get(event) || 0) + 1);
    this.totalEvents++;
  }

  incrementRoomJoin(room: string): void {
    this.roomJoins.set(room, (this.roomJoins.get(room) || 0) + 1);
    this.totalRoomJoins++;
  }

  incrementRoomLeave(room: string): void {
    this.roomLeaves.set(room, (this.roomLeaves.get(room) || 0) + 1);
    this.totalRoomLeaves++;
  }

  trackReconnectionAttempt(success: boolean, reconnectionTime?: number): void {
    this.reconnectionAttempts++;
    if (success) {
      this.successfulReconnections++;
      if (reconnectionTime) {
        this.reconnectionTimes.push(reconnectionTime);
      }
    } else {
      this.failedReconnections++;
    }
  }

  trackDisconnectedClient(clientId: string, rooms: string[]): void {
    this.disconnectedClients.set(clientId, {
      rooms,
      disconnectedAt: new Date()
    });
  }

  clearDisconnectedClient(clientId: string): void {
    this.disconnectedClients.delete(clientId);
  }

  getDisconnectedClientRooms(clientId: string): string[] | undefined {
    return this.disconnectedClients.get(clientId)?.rooms;
  }

  private logMetrics(): void {
    const metrics = this.getCurrentMetrics();

    this.logger.log({
      message: 'WebSocket Metrics',
      ...metrics,
      reconnectionSuccessRate: metrics.reconnectionAttempts > 0
        ? `${Math.round((metrics.successfulReconnections / metrics.reconnectionAttempts) * 100)}%`
        : 'N/A'
    });
  }

  getCurrentMetrics(): {
    connectionCount: number;
    authenticatedCount: number;
    peakConnectionCount: number;
    totalConnections: number;
    totalDisconnections: number;
    eventsPerMinute: number;
    topEvents: Array<{ event: string; count: number }>;
    roomActivity: Array<{ room: string; joins: number; leaves: