# TO_BE_DESIGN.md - Billing-Invoicing Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Author:** Enterprise Architecture Team

---

## Table of Contents
1. [Executive Vision](#executive-vision)
2. [Performance Enhancements](#performance-enhancements)
3. [Real-Time Features](#real-time-features)
4. [AI/ML Capabilities](#aiml-capabilities)
5. [Progressive Web App (PWA) Features](#progressive-web-app-pwa-features)
6. [WCAG 2.1 AAA Accessibility](#wcag-21-aaa-accessibility)
7. [Advanced Search and Filtering](#advanced-search-and-filtering)
8. [Third-Party Integrations](#third-party-integrations)
9. [Gamification System](#gamification-system)
10. [Analytics Dashboards](#analytics-dashboards)
11. [Security Hardening](#security-hardening)
12. [Comprehensive Testing](#comprehensive-testing)
13. [Kubernetes Deployment](#kubernetes-deployment)
14. [Database Migration Strategy](#database-migration-strategy)
15. [Key Performance Indicators](#key-performance-indicators)
16. [Risk Mitigation](#risk-mitigation)

---

## Executive Vision

### Strategic Vision for the Enhanced Billing-Invoicing System

The next-generation billing-invoicing module represents a paradigm shift in how our organization manages financial transactions, customer relationships, and operational efficiency. This transformation aligns with our strategic objectives of becoming a data-driven, customer-centric enterprise while maintaining operational excellence.

#### Business Transformation Goals

1. **Revenue Cycle Optimization**
   - Reduce invoice-to-cash cycle time by 40% through automated workflows and real-time processing
   - Decrease billing errors by 95% with AI-powered validation and reconciliation
   - Implement dynamic pricing models that adapt to customer segments and market conditions

2. **Customer Experience Revolution**
   - Provide self-service portals with 24/7 access to billing information
   - Offer personalized payment plans based on customer behavior and creditworthiness
   - Implement proactive billing notifications with actionable insights

3. **Operational Excellence**
   - Automate 80% of manual billing processes through RPA and AI
   - Reduce operational costs by 30% through process optimization
   - Achieve 99.99% system availability with multi-region deployment

4. **Data-Driven Decision Making**
   - Implement real-time financial analytics with predictive capabilities
   - Create unified customer financial profiles across all touchpoints
   - Enable data monetization through anonymized billing patterns

5. **Regulatory Compliance**
   - Automate compliance with GAAP, IFRS, and local tax regulations
   - Implement audit trails for all financial transactions
   - Ensure GDPR and CCPA compliance for customer data

#### User Experience Improvements

**Customer Portal Enhancements:**
```typescript
// Customer Dashboard Component with Personalized Insights
@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss']
})
export class CustomerDashboardComponent implements OnInit {
  customerInsights: CustomerInsight[] = [];
  upcomingPayments: PaymentSchedule[] = [];
  spendingTrends: SpendingTrend[] = [];
  creditScore: CreditScore;
  personalizedOffers: Offer[] = [];
  notificationPreferences: NotificationPreference;

  constructor(
    private customerService: CustomerService,
    private analyticsService: AnalyticsService,
    private offerService: OfferService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCustomerData();
    this.setupRealTimeUpdates();
    this.initializePersonalizationEngine();
    this.checkCreditScore();
    this.loadPersonalizedOffers();
  }

  private loadCustomerData(): void {
    combineLatest([
      this.customerService.getCustomerInsights(),
      this.customerService.getUpcomingPayments(),
      this.analyticsService.getSpendingTrends(),
      this.notificationService.getPreferences()
    ]).subscribe({
      next: ([insights, payments, trends, preferences]) => {
        this.customerInsights = insights;
        this.upcomingPayments = payments;
        this.spendingTrends = trends;
        this.notificationPreferences = preferences;
        this.generateInsightCards();
      },
      error: (err) => {
        this.logger.error('Failed to load customer data', err);
        this.notificationService.showError('Unable to load your dashboard. Please try again later.');
      }
    });
  }

  private setupRealTimeUpdates(): void {
    this.realtimeService.getPaymentUpdates().subscribe(update => {
      const index = this.upcomingPayments.findIndex(p => p.id === update.id);
      if (index !== -1) {
        this.upcomingPayments[index] = update;
        this.updatePaymentStatus(update);
      }
    });

    this.realtimeService.getInsightUpdates().subscribe(insight => {
      this.customerInsights = this.customerInsights.map(i =>
        i.type === insight.type ? insight : i
      );
    });
  }

  // Additional 80+ lines of user experience enhancement code...
}
```

**Administrator Experience:**
- Role-based dashboards with configurable widgets
- AI-powered anomaly detection with explainable insights
- Bulk operation interfaces with progress tracking
- Audit trail visualization with timeline views

#### Competitive Advantages

1. **Predictive Billing Intelligence**
   - AI models that predict payment delays with 92% accuracy
   - Automated dunning strategies based on customer behavior
   - Dynamic discounting for early payments

2. **Omnichannel Billing Experience**
   - Unified billing across web, mobile, and voice interfaces
   - Context-aware billing assistants with NLP capabilities
   - Cross-platform synchronization of payment methods

3. **Regulatory Technology (RegTech)**
   - Automated tax calculation for 190+ countries
   - Real-time compliance monitoring with alerting
   - Automated reporting to tax authorities

4. **Subscription Economy Ready**
   - Flexible billing models (usage-based, tiered, flat-rate)
   - Automated proration and mid-cycle changes
   - Churn prediction and retention strategies

5. **Ecosystem Integration**
   - Pre-built connectors for 50+ ERP and CRM systems
   - Marketplace for billing-related extensions
   - Developer API with 99.9% uptime SLA

#### Long-Term Roadmap

**Phase 1: Foundation (0-6 months)**
- Core billing engine modernization
- Basic PWA implementation
- Initial AI validation models
- First-party integrations

**Phase 2: Expansion (6-18 months)**
- Advanced predictive capabilities
- Full omnichannel experience
- Blockchain for invoice verification
- Global tax compliance engine

**Phase 3: Transformation (18-36 months)**
- Autonomous billing operations
- Cognitive billing assistants
- Quantum-resistant encryption
- Decentralized identity for customers

**Phase 4: Innovation (36+ months)**
- Neuro-symbolic AI for billing decisions
- Holographic billing interfaces
- Self-optimizing billing systems
- Interplanetary billing capabilities

#### Financial Impact Projections

| Metric | Current | Target (Year 1) | Target (Year 3) |
|--------|---------|-----------------|-----------------|
| DSO (Days Sales Outstanding) | 45 | 30 | 20 |
| Billing Error Rate | 3.2% | 0.5% | 0.1% |
| Customer Satisfaction (CSAT) | 78% | 90% | 95% |
| Operational Cost Reduction | - | 25% | 40% |
| Revenue Leakage | 1.8% | 0.5% | 0.1% |
| Payment Processing Time | 2.5 days | 4 hours | Real-time |

#### Implementation Strategy

1. **Agile Transformation**
   - Cross-functional squads with product owners, developers, and business analysts
   - Bi-weekly sprint cycles with continuous delivery
   - Feature flags for gradual rollout

2. **Change Management**
   - Comprehensive training programs for all user types
   - Super-user network for peer support
   - Gamified adoption metrics

3. **Technical Approach**
   - Microservices architecture on Kubernetes
   - Event-driven architecture with Kafka
   - Multi-region active-active deployment

4. **Vendor Partnerships**
   - Strategic alliances with cloud providers
   - Technology partnerships with AI vendors
   - Integration partnerships with ERP/CRM providers

---

## Performance Enhancements

### Redis Caching Layer Implementation

```typescript
// redis-cache.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'billing:';

  constructor(private configService: ConfigService) {
    const redisConfig = {
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
      tls: this.configService.get('REDIS_TLS') === 'true' ? {} : null,
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        return Math.min(times * 100, 5000);
      }
    };

    this.redisClient = new Redis(redisConfig);

    this.redisClient.on('connect', () => {
      this.logger.log('Redis client connected successfully');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`, err.stack);
    });

    this.redisClient.on('reconnecting', () => {
      this.logger.warn('Redis client reconnecting...');
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  private generateCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${crypto.createHash('md5').update(key).digest('hex')}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.generateCacheKey(key);
      const cachedData = await this.redisClient.get(cacheKey);

      if (cachedData) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return JSON.parse(cachedData) as T;
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      return null;
    } catch (err) {
      this.logger.error(`Error getting cache for key ${key}: ${err.message}`, err.stack);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(key);
      const stringValue = JSON.stringify(value);
      const effectiveTtl = ttl || this.DEFAULT_TTL;

      await this.redisClient.setex(cacheKey, effectiveTtl, stringValue);
      this.logger.debug(`Cache set for key: ${cacheKey} with TTL: ${effectiveTtl}`);
    } catch (err) {
      this.logger.error(`Error setting cache for key ${key}: ${err.message}`, err.stack);
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(key);
      await this.redisClient.del(cacheKey);
      this.logger.debug(`Cache deleted for key: ${cacheKey}`);
    } catch (err) {
      this.logger.error(`Error deleting cache for key ${key}: ${err.message}`, err.stack);
      throw err;
    }
  }

  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      const cachedData = await this.get<T>(key);
      if (cachedData !== null) {
        return cachedData;
      }

      const freshData = await fetchFn();
      await this.set(key, freshData, ttl);
      return freshData;
    } catch (err) {
      this.logger.error(`Error in getOrSet for key ${key}: ${err.message}`, err.stack);
      // Fallback to direct fetch if cache fails
      return fetchFn();
    }
  }

  async cacheMultiGet<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const cacheKeys = keys.map(key => this.generateCacheKey(key));
      const results = await this.redisClient.mget(...cacheKeys);

      return results.map((result, index) => {
        if (result) {
          this.logger.debug(`Cache hit for multi-get key: ${cacheKeys[index]}`);
          return JSON.parse(result) as T;
        }
        this.logger.debug(`Cache miss for multi-get key: ${cacheKeys[index]}`);
        return null;
      });
    } catch (err) {
      this.logger.error(`Error in multi-get: ${err.message}`, err.stack);
      return keys.map(() => null);
    }
  }

  async cacheMultiSet<T>(items: { key: string; value: T; ttl?: number }[]): Promise<void> {
    try {
      const pipeline = this.redisClient.pipeline();

      items.forEach(item => {
        const cacheKey = this.generateCacheKey(item.key);
        const stringValue = JSON.stringify(item.value);
        const effectiveTtl = item.ttl || this.DEFAULT_TTL;

        pipeline.setex(cacheKey, effectiveTtl, stringValue);
        this.logger.debug(`Multi-set cache for key: ${cacheKey} with TTL: ${effectiveTtl}`);
      });

      await pipeline.exec();
    } catch (err) {
      this.logger.error(`Error in multi-set: ${err.message}`, err.stack);
      throw err;
    }
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      const cachePattern = `${this.CACHE_PREFIX}${pattern}`;
      const keys = await this.redisClient.keys(`${cachePattern}*`);

      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        this.logger.log(`Invalidated ${keys.length} cache keys matching pattern: ${cachePattern}`);
      }
    } catch (err) {
      this.logger.error(`Error invalidating cache by pattern ${pattern}: ${err.message}`, err.stack);
      throw err;
    }
  }

  async getCacheStats(): Promise<{
    keys: number;
    memoryUsage: number;
    hitRate: number;
  }> {
    try {
      const [keys, info] = await Promise.all([
        this.redisClient.keys(`${this.CACHE_PREFIX}*`),
        this.redisClient.info('stats')
      ]);

      const stats = info.split('\r\n').reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) {
          acc[key] = parseFloat(value) || value;
        }
        return acc;
      }, {} as Record<string, any>);

      const hitRate = stats.keyspace_hits && stats.keyspace_misses
        ? (stats.keyspace_hits / (stats.keyspace_hits + stats.keyspace_misses)) * 100
        : 0;

      return {
        keys: keys.length,
        memoryUsage: parseInt(stats.used_memory) || 0,
        hitRate
      };
    } catch (err) {
      this.logger.error(`Error getting cache stats: ${err.message}`, err.stack);
      return {
        keys: 0,
        memoryUsage: 0,
        hitRate: 0
      };
    }
  }
}
```

### Database Query Optimization

```typescript
// invoice.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Invoice } from './invoice.entity';
import { Customer } from '../customer/customer.entity';
import { Payment } from '../payment/payment.entity';
import { InvoiceStatus } from './invoice-status.enum';
import { PaginationOptions } from '../../common/interfaces/pagination-options.interface';
import { Between, In, LessThan, MoreThan, Not } from 'typeorm';
import { RedisCacheService } from '../../cache/redis-cache.service';

@Injectable()
export class InvoiceRepository extends Repository<Invoice> {
  private readonly logger = new Logger(InvoiceRepository.name);

  constructor(
    private dataSource: DataSource,
    private cacheService: RedisCacheService
  ) {
    super(Invoice, dataSource.createEntityManager());
  }

  async findInvoicesWithOptimizedQuery(
    options: {
      customerIds?: string[];
      statuses?: InvoiceStatus[];
      dateRange?: { start: Date; end: Date };
      searchTerm?: string;
      pagination: PaginationOptions;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }
  ): Promise<{ data: Invoice[]; total: number }> {
    const { customerIds, statuses, dateRange, searchTerm, pagination, sortBy, sortOrder } = options;
    const cacheKey = this.generateCacheKey('findInvoices', options);

    try {
      // Try to get from cache first
      const cachedResult = await this.cacheService.get<{ data: Invoice[]; total: number }>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const queryBuilder = this.createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.customer', 'customer')
        .leftJoinAndSelect('invoice.payments', 'payments')
        .leftJoinAndSelect('invoice.lineItems', 'lineItems')
        .leftJoinAndSelect('lineItems.product', 'product')
        .leftJoinAndSelect('invoice.taxes', 'taxes')
        .leftJoinAndSelect('invoice.discounts', 'discounts');

      // Apply filters
      if (customerIds && customerIds.length > 0) {
        queryBuilder.andWhere('invoice.customerId IN (:...customerIds)', { customerIds });
      }

      if (statuses && statuses.length > 0) {
        queryBuilder.andWhere('invoice.status IN (:...statuses)', { statuses });
      }

      if (dateRange) {
        queryBuilder.andWhere('invoice.invoiceDate BETWEEN :start AND :end', {
          start: dateRange.start,
          end: dateRange.end
        });
      }

      if (searchTerm) {
        queryBuilder.andWhere(
          new Brackets(qb => {
            qb.where('invoice.invoiceNumber ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
              .orWhere('customer.name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
              .orWhere('customer.email ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
              .orWhere('invoice.reference ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` });
          })
        );
      }

      // Apply sorting
      if (sortBy) {
        const order = sortOrder || 'ASC';
        if (sortBy === 'customerName') {
          queryBuilder.orderBy('customer.name', order);
        } else if (sortBy === 'dueDate') {
          queryBuilder.orderBy('invoice.dueDate', order);
        } else if (sortBy === 'amount') {
          queryBuilder.orderBy('invoice.totalAmount', order);
        } else {
          queryBuilder.orderBy(`invoice.${sortBy}`, order);
        }
      } else {
        queryBuilder.orderBy('invoice.invoiceDate', 'DESC');
      }

      // Get total count for pagination
      const [data, total] = await Promise.all([
        queryBuilder
          .skip((pagination.page - 1) * pagination.limit)
          .take(pagination.limit)
          .getMany(),
        queryBuilder.getCount()
      ]);

      // Cache the result
      await this.cacheService.set(cacheKey, { data, total }, 300); // 5 minutes cache

      return { data, total };
    } catch (err) {
      this.logger.error(`Error in findInvoicesWithOptimizedQuery: ${err.message}`, err.stack);
      throw err;
    }
  }

  async getInvoiceAnalytics(
    customerId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{
    totalInvoices: number;
    totalAmount: number;
    averageAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    overdueAmount: number;
    paymentDays: number[];
  }> {
    const cacheKey = this.generateCacheKey('invoiceAnalytics', { customerId, dateRange });

    try {
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const queryBuilder = this.createQueryBuilder('invoice')
        .select([
          'COUNT(invoice.id) as totalInvoices',
          'SUM(invoice.totalAmount) as totalAmount',
          'AVG(invoice.totalAmount) as averageAmount',
          'SUM(CASE WHEN invoice.status = :paidStatus THEN invoice.totalAmount ELSE 0 END) as paidAmount',
          'SUM(CASE WHEN invoice.status = :unpaidStatus THEN invoice.totalAmount ELSE 0 END) as unpaidAmount',
          'SUM(CASE WHEN invoice.status = :overdueStatus THEN invoice.totalAmount ELSE 0 END) as overdueAmount',
          'AVG(EXTRACT(DAY FROM (payments.paymentDate - invoice.invoiceDate))) as paymentDays'
        ])
        .leftJoin('invoice.payments', 'payments')
        .where('invoice.customerId = :customerId', { customerId })
        .andWhere('invoice.invoiceDate BETWEEN :start AND :end', {
          start: dateRange.start,
          end: dateRange.end
        })
        .setParameter('paidStatus', InvoiceStatus.PAID)
        .setParameter('unpaidStatus', InvoiceStatus.UNPAID)
        .setParameter('overdueStatus', InvoiceStatus.OVERDUE);

      const result = await queryBuilder.getRawOne();

      // Process payment days
      const paymentDaysQuery = this.createQueryBuilder('invoice')
        .select('EXTRACT(DAY FROM (payments.paymentDate - invoice.invoiceDate))', 'paymentDay')
        .leftJoin('invoice.payments', 'payments')
        .where('invoice.customerId = :customerId', { customerId })
        .andWhere('invoice.invoiceDate BETWEEN :start AND :end', {
          start: dateRange.start,
          end: dateRange.end
        })
        .andWhere('payments.paymentDate IS NOT NULL');

      const paymentDaysResult = await paymentDaysQuery.getRawMany();
      const paymentDays = paymentDaysResult.map(r => parseInt(r.paymentDay, 10)).filter(d => !isNaN(d));

      const analytics = {
        totalInvoices: parseInt(result.totalInvoices, 10),
        totalAmount: parseFloat(result.totalAmount) || 0,
        averageAmount: parseFloat(result.averageAmount) || 0,
        paidAmount: parseFloat(result.paidAmount) || 0,
        unpaidAmount: parseFloat(result.unpaidAmount) || 0,
        overdueAmount: parseFloat(result.overdueAmount) || 0,
        paymentDays
      };

      await this.cacheService.set(cacheKey, analytics, 600); // 10 minutes cache

      return analytics;
    } catch (err) {
      this.logger.error(`Error in getInvoiceAnalytics: ${err.message}`, err.stack);
      throw err;
    }
  }

  async getCustomerPaymentHistory(
    customerId: string,
    options: {
      limit?: number;
      statuses?: InvoiceStatus[];
      dateRange?: { start: Date; end: Date };
    } = {}
  ): Promise<{
    invoices: Invoice[];
    paymentTrends: {
      month: string;
      totalAmount: number;
      paidAmount: number;
      count: number;
    }[];
  }> {
    const cacheKey = this.generateCacheKey('customerPaymentHistory', { customerId, options });

    try {
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const { limit = 10, statuses, dateRange } = options;

      // Get recent invoices
      const invoiceQuery = this.createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.payments', 'payments')
        .where('invoice.customerId = :customerId', { customerId });

      if (statuses && statuses.length > 0) {
        invoiceQuery.andWhere('invoice.status IN (:...statuses)', { statuses });
      }

      if (dateRange) {
        invoiceQuery.andWhere('invoice.invoiceDate BETWEEN :start AND :end', {
          start: dateRange.start,
          end: dateRange.end
        });
      }

      const invoices = await invoiceQuery
        .orderBy('invoice.invoiceDate', 'DESC')
        .take(limit)
        .getMany();

      // Get payment trends
      const trendQuery = this.createQueryBuilder('invoice')
        .select([
          'TO_CHAR(invoice.invoiceDate, \'YYYY-MM\') as month',
          'SUM(invoice.totalAmount) as totalAmount',
          'SUM(CASE WHEN invoice.status = :paidStatus THEN invoice.totalAmount ELSE 0 END) as paidAmount',
          'COUNT(invoice.id) as count'
        ])
        .where('invoice.customerId = :customerId', { customerId })
        .groupBy('month')
        .orderBy('month', 'ASC')
        .setParameter('paidStatus', InvoiceStatus.PAID);

      if (dateRange) {
        trendQuery.andWhere('invoice.invoiceDate BETWEEN :start AND :end', {
          start: dateRange.start,
          end: dateRange.end
        });
      }

      const trends = await trendQuery.getRawMany();

      const paymentTrends = trends.map(trend => ({
        month: trend.month,
        totalAmount: parseFloat(trend.totalAmount) || 0,
        paidAmount: parseFloat(trend.paidAmount) || 0,
        count: parseInt(trend.count, 10)
      }));

      const result = { invoices, paymentTrends };
      await this.cacheService.set(cacheKey, result, 900); // 15 minutes cache

      return result;
    } catch (err) {
      this.logger.error(`Error in getCustomerPaymentHistory: ${err.message}`, err.stack);
      throw err;
    }
  }

  private generateCacheKey(prefix: string, params: any): string {
    const paramString = JSON.stringify(params);
    return `${prefix}:${crypto.createHash('md5').update(paramString).digest('hex')}`;
  }

  async getOverdueInvoices(
    daysOverdue: number,
    options: {
      customerIds?: string[];
      includeDetails?: boolean;
      limit?: number;
    } = {}
  ): Promise<Invoice[]> {
    const { customerIds, includeDetails = false, limit } = options;
    const cacheKey = this.generateCacheKey('overdueInvoices', { daysOverdue, customerIds, includeDetails, limit });

    try {
      const cachedResult = await this.cacheService.get<Invoice[]>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const queryBuilder = this.createQueryBuilder('invoice')
        .where('invoice.status = :status', { status: InvoiceStatus.OVERDUE })
        .andWhere('invoice.dueDate < :cutoffDate', {
          cutoffDate: new Date(Date.now() - daysOverdue * 24 * 60 * 60 * 1000)
        });

      if (customerIds && customerIds.length > 0) {
        queryBuilder.andWhere('invoice.customerId IN (:...customerIds)', { customerIds });
      }

      if (includeDetails) {
        queryBuilder
          .leftJoinAndSelect('invoice.customer', 'customer')
          .leftJoinAndSelect('invoice.payments', 'payments')
          .leftJoinAndSelect('invoice.lineItems', 'lineItems');
      }

      if (limit) {
        queryBuilder.take(limit);
      }

      const invoices = await queryBuilder.getMany();
      await this.cacheService.set(cacheKey, invoices, 300); // 5 minutes cache

      return invoices;
    } catch (err) {
      this.logger.error(`Error in getOverdueInvoices: ${err.message}`, err.stack);
      throw err;
    }
  }

  async getInvoiceWithRelations(invoiceId: string): Promise<Invoice | null> {
    const cacheKey = this.generateCacheKey('invoiceWithRelations', { invoiceId });

    try {
      const cachedResult = await this.cacheService.get<Invoice>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const invoice = await this.createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.customer', 'customer')
        .leftJoinAndSelect('customer.billingAddress', 'billingAddress')
        .leftJoinAndSelect('customer.shippingAddress', 'shippingAddress')
        .leftJoinAndSelect('invoice.payments', 'payments')
        .leftJoinAndSelect('payments.paymentMethod', 'paymentMethod')
        .leftJoinAndSelect('invoice.lineItems', 'lineItems')
        .leftJoinAndSelect('lineItems.product', 'product')
        .leftJoinAndSelect('lineItems.taxes', 'taxes')
        .leftJoinAndSelect('invoice.taxes', 'invoiceTaxes')
        .leftJoinAndSelect('invoice.discounts', 'discounts')
        .leftJoinAndSelect('invoice.attachments', 'attachments')
        .where('invoice.id = :invoiceId', { invoiceId })
        .getOne();

      if (invoice) {
        await this.cacheService.set(cacheKey, invoice, 600); // 10 minutes cache
      }

      return invoice;
    } catch (err) {
      this.logger.error(`Error in getInvoiceWithRelations: ${err.message}`, err.stack);
      throw err;
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
import { Logger } from '@nestjs/common';

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ResponseCompressionMiddleware.name);
  private readonly compressionMiddleware;

  constructor(private configService: ConfigService) {
    const compressionOptions = {
      level: this.configService.get('COMPRESSION_LEVEL') || 6,
      threshold: this.configService.get('COMPRESSION_THRESHOLD') || 1024,
      filter: (req: Request, res: Response) => {
        // Don't compress responses that are already compressed
        if (res.getHeader('Content-Encoding')) {
          return false;
        }

        // Don't compress small responses
        if (res.getHeader('Content-Length') &&
            parseInt(res.getHeader('Content-Length') as string, 10) < 1024) {
          return false;
        }

        // Don't compress binary data
        const contentType = res.getHeader('Content-Type') as string;
        if (contentType && (
          contentType.includes('image/') ||
          contentType.includes('video/') ||
          contentType.includes('audio/') ||
          contentType.includes('application/pdf') ||
          contentType.includes('application/zip')
        )) {
          return false;
        }

        return compression.filter(req, res);
      },
      strategy: this.configService.get('COMPRESSION_STRATEGY') || 'default'
    };

    this.compressionMiddleware = compression(compressionOptions);
  }

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Set compression-related headers
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('X-Compression', 'enabled');

      // Handle pre-compressed responses
      if (req.headers['x-no-compression']) {
        res.setHeader('Content-Encoding', 'identity');
        return next();
      }

      // Apply compression
      this.compressionMiddleware(req, res, next);
    } catch (err) {
      this.logger.error(`Error in response compression middleware: ${err.message}`, err.stack);
      next();
    }
  }
}

// response-compression.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import * as zlib from 'zlib';
import { promisify } from 'util';

@Injectable()
export class ResponseCompressionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseCompressionInterceptor.name);
  private readonly gzip = promisify(zlib.gzip);
  private readonly deflate = promisify(zlib.deflate);
  private readonly brotliCompress = promisify(zlib.brotliCompress);

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Skip if already compressed by middleware
    if (response.getHeader('Content-Encoding')) {
      return next.handle();
    }

    return next.handle().pipe(
      map(async (data) => {
        try {
          // Skip compression for non-JSON responses
          if (!response.getHeader('Content-Type')?.toString().includes('application/json')) {
            return data;
          }

          // Skip compression for small responses
          const stringData = JSON.stringify(data);
          if (stringData.length < 1024) {
            return data;
          }

          // Determine accepted encoding
          const acceptEncoding = request.headers['accept-encoding'] || '';
          let compressedData: Buffer;
          let encoding: string;

          if (acceptEncoding.includes('br')) {
            compressedData = await this.brotliCompress(stringData, {
              params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 6
              }
            });
            encoding = 'br';
          } else if (acceptEncoding.includes('gzip')) {
            compressedData = await this.gzip(stringData, {
              level: 6
            });
            encoding = 'gzip';
          } else if (acceptEncoding.includes('deflate')) {
            compressedData = await this.deflate(stringData, {
              level: 6
            });
            encoding = 'deflate';
          } else {
            return data;
          }

          // Set headers and send compressed data
          response.setHeader('Content-Encoding', encoding);
          response.setHeader('Content-Length', compressedData.length);
          response.setHeader('X-Original-Content-Length', Buffer.byteLength(stringData));

          return compressedData;
        } catch (err) {
          this.logger.error(`Error compressing response: ${err.message}`, err.stack);
          return data;
        }
      })
    );
  }
}

// response-compression.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseCompressionMiddleware } from './response-compression.middleware';
import { ResponseCompressionInterceptor } from './response-compression.interceptor';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
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
// lazy-loading.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';

// Define lazy-loaded routes
const routes: Routes = [
  {
    path: 'invoices',
    loadChildren: () => import('./invoices/invoices.module').then(m => m.InvoicesModule),
    data: { preload: true, delay: 3000 }
  },
  {
    path: 'customers',
    loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule),
    data: { preload: true, delay: 5000 }
  },
  {
    path: 'payments',
    loadChildren: () => import('./payments/payments.module').then(m => m.PaymentsModule),
    data: { preload: false }
  },
  {
    path: 'reports',
    loadChildren: () => import('./reports/reports.module').then(m => m.ReportsModule),
    data: { preload: true }
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule),
    data: { preload: false }
  }
];

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class LazyLoadingModule {}

// preloading-strategy.service.ts
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { LoggerService } from '../core/logger.service';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  private readonly logger = new LoggerService(CustomPreloadingStrategy.name);

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const shouldPreload = this.shouldPreload(route);

    if (shouldPreload) {
      const delay = route.data?.['delay'] || 0;
      this.logger.log(`Preloading route: ${route.path} with delay: ${delay}ms`);

      return timer(delay).pipe(
        mergeMap(() => {
          this.logger.log(`Starting preload for route: ${route.path}`);
          return load().pipe(
            mergeMap(() => {
              this.logger.log(`Preload completed for route: ${route.path}`);
              return of(null);
            })
          );
        })
      );
    }

    return of(null);
  }

  private shouldPreload(route: Route): boolean {
    // Don't preload if the route is marked as not to be preloaded
    if (route.data?.['preload'] === false) {
      return false;
    }

    // Preload if explicitly marked or if no data is provided
    return route.data?.['preload'] === true || !route.data?.hasOwnProperty('preload');
  }
}

// lazy-load.guard.ts
import { Injectable } from '@angular/core';
import {
  CanLoad,
  Route,
  UrlSegment,
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { LoggerService } from '../core/logger.service';
import { LoadingService } from '../core/loading.service';

@Injectable({
  providedIn: 'root'
})
export class LazyLoadGuard implements CanLoad, CanActivate {
  private readonly logger = new LoggerService(LazyLoadGuard.name);

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingService: LoadingService
  ) {}

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    this.logger.log(`Checking canLoad for route: ${route.path}`);

    // Show loading indicator
    this.loadingService.show();

    return this.checkPermissions(route).pipe(
      map(hasPermission => {
        if (!hasPermission) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/error']);
        return of(false);
      }),
      map(result => {
        this.loadingService.hide();
        return result;
      })
    );
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    this.logger.log(`Checking canActivate for route: ${state.url}`);

    return this.checkPermissions(route).pipe(
      map(hasPermission => {
        if (!hasPermission) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/error']);
        return of(false);
      })
    );
  }

  private checkPermissions(route: Route | ActivatedRouteSnapshot): Observable<boolean> {
    // Check if route requires specific permissions
    const requiredPermissions = route.data?.['permissions'] as string[] || [];

    if (requiredPermissions.length === 0) {
      return of(true);
    }

    return this.authService.hasPermissions(requiredPermissions).pipe(
      map(hasPermission => {
        if (!hasPermission) {
          this.logger.warn(`User lacks required permissions for route: ${route.path}`);
        }
        return hasPermission;
      })
    );
  }
}

// lazy-load.directive.ts
import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LazyLoadService } from './lazy-load.service';

@Directive({
  selector: '[appLazyLoad]'
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input() appLazyLoad: string;
  @Input() lazyLoadContext: any;
  @Input() lazyLoadDelay = 0;
  @Input() lazyLoadThreshold = 100;

  private destroy$ = new Subject<void>();
  private hasLoaded = false;
  private observer: IntersectionObserver;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private lazyLoadService: LazyLoadService
  ) {}

  ngOnInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: `${this.lazyLoadThreshold}px`,
      threshold: 0.01
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.hasLoaded) {
          this.loadComponent();
        }
      });
    }, options);

    this.observer.observe(this.viewContainer.element.nativeElement);
  }

  private loadComponent(): void {
    if (this.hasLoaded) {
      return;
    }

    this.hasLoaded = true;

    if (this.lazyLoadDelay > 0) {
      setTimeout(() => this.createComponent(), this.lazyLoadDelay);
    } else {
      this.createComponent();
    }
  }

  private createComponent(): void {
    if (!this.appLazyLoad) {
      return;
    }

    this.lazyLoadService.loadComponent(this.appLazyLoad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (componentFactory) => {
          this.viewContainer.clear();
          const componentRef = this.viewContainer.createComponent(componentFactory);

          // Pass context to the component
          if (this.lazyLoadContext && componentRef.instance) {
            Object.assign(componentRef.instance, this.lazyLoadContext);
          }
        },
        error: (err) => {
          console.error(`Error loading component ${this.appLazyLoad}:`, err);
          // Optionally show a fallback template
          this.viewContainer.clear();
          this.viewContainer.createEmbeddedView(this.templateRef);
        }
      });
  }
}

// lazy-load.service.ts
import { Injectable, Injector, ComponentFactoryResolver, Type } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Compiler } from '@angular/core';
import { LoggerService } from '../core/logger.service';

@Injectable({
  providedIn: 'root'
})
export class LazyLoadService {
  private readonly logger = new LoggerService(LazyLoadService.name);
  private componentCache = new Map<string, Observable<any>>();

  constructor(
    private http: HttpClient,
    private compiler: Compiler,
    private injector: Injector
  ) {}

  loadComponent(componentPath: string): Observable<any> {
    // Check cache first
    if (this.componentCache.has(componentPath)) {
      return this.componentCache.get(componentPath)!;
    }

    // Create observable and cache it
    const component$ = this.loadComponentInternal(componentPath).pipe(
      shareReplay(1),
      catchError(err => {
        this.logger.error(`Error loading component ${componentPath}:`, err);
        this.componentCache.delete(componentPath);
        throw err;
      })
    );

    this.componentCache.set(componentPath, component$);
    return component$;
  }

  private loadComponentInternal(componentPath: string): Observable<any> {
    return this.http.get(`/assets/lazy-components/${componentPath}.js`, {
      responseType: 'text'
    }).pipe(
      map((jsContent: string) => {
        // Create a new module with the component
        const exports = {};
        const module = { exports };

        // Execute the JS content to get the component class
        const fn = new Function('module', 'exports', jsContent);
        fn(module, exports);

        const componentClass = exports[Object.keys(exports)[0]];

        // Compile the component
        const moduleFactory = this.compiler.compileModuleSync(
          this.createComponentModule(componentClass)
        );

        const moduleRef = moduleFactory.create(this.injector);
        const componentFactory = moduleRef.componentFactoryResolver
          .resolveComponentFactory(componentClass);

        return componentFactory;
      })
    );
  }

  private createComponentModule(component: Type<any>): any {
    @NgModule({
      declarations: [component],
      imports: [],
      exports: [component]
    })
    class DynamicComponentModule {}
    return DynamicComponentModule;
  }

  loadModule(modulePath: string): Observable<any> {
    // Check cache first
    if (this.componentCache.has(modulePath)) {
      return this.componentCache.get(modulePath)!;
    }

    // Create observable and cache it
    const module$ = this.loadModuleInternal(modulePath).pipe(
      shareReplay(1),
      catchError(err => {
        this.logger.error(`Error loading module ${modulePath}:`, err);
        this.componentCache.delete(modulePath);
        throw err;
      })
    );

    this.componentCache.set(modulePath, module$);
    return module$;
  }

  private loadModuleInternal(modulePath: string): Observable<any> {
    return this.http.get(`/assets/lazy-modules/${modulePath}.js`, {
      responseType: 'text'
    }).pipe(
      map((jsContent: string) => {
        const exports = {};
        const module = { exports };

        const fn = new Function('module', 'exports', jsContent);
        fn(module, exports);

        const moduleClass = exports[Object.keys(exports)[0]];
        return this.compiler.compileModuleSync(moduleClass);
      })
    );
  }

  clearCache(): void {
    this.componentCache.clear();
  }
}
```

---

## Real-Time Features

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
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { WsAuthGuard } from '../auth/guards/ws-auth.guard';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import { ConfigService } from '@nestjs/config';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { RedisService } from '../redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@WebSocketGateway({
  namespace: 'billing',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6 // 1MB
})
@UseGuards(WsAuthGuard)
@UseFilters(WsExceptionFilter)
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);
  private rateLimiter: RateLimiterMemory;
  private connectionMap = new Map<string, Socket[]>();
  private userRoomMap = new Map<string, Set<string>>();

  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private eventEmitter: EventEmitter2
  ) {
    this.initializeRateLimiter();
    this.setupEventListeners();
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.setupServerMiddleware(server);
  }

  handleConnection(client: Socket, ...args: any[]) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET')
      });

      if (!payload) {
        client.disconnect(true);
        return;
      }

      // Store connection in map
      const userId = payload.sub;
      if (!this.connectionMap.has(userId)) {
        this.connectionMap.set(userId, []);
      }
      this.connectionMap.get(userId)!.push(client);

      // Join user-specific room
      client.join(`user:${userId}`);
      if (!this.userRoomMap.has(userId)) {
        this.userRoomMap.set(userId, new Set());
      }
      this.userRoomMap.get(userId)!.add(`user:${userId}`);

      this.logger.log(`Client connected: ${client.id}, User: ${userId}`);
      this.eventEmitter.emit('websocket.connected', { clientId: client.id, userId });

      // Send welcome message
      client.emit('connected', {
        message: 'Successfully connected to billing WebSocket',
        timestamp: new Date().toISOString(),
        userId
      });
    } catch (err) {
      this.logger.error(`Connection error: ${err.message}`, err.stack);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (token) {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET')
        });

        if (payload) {
          const userId = payload.sub;
          const connections = this.connectionMap.get(userId) || [];
          const index = connections.indexOf(client);

          if (index !== -1) {
            connections.splice(index, 1);
            if (connections.length === 0) {
              this.connectionMap.delete(userId);
            } else {
              this.connectionMap.set(userId, connections);
            }
          }

          this.logger.log(`Client disconnected: ${client.id}, User: ${userId}`);
          this.eventEmitter.emit('websocket.disconnected', { clientId: client.id, userId });
        }
      }
    } catch (err) {
      this.logger.error(`Disconnection error: ${err.message}`, err.stack);
    }
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new Error('Authentication required');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET')
      });

      if (!payload) {
        throw new Error('Invalid authentication');
      }

      const userId = payload.sub;
      const rateLimiterRes = await this.checkRateLimit(userId, 'subscribe', 10);
      if (!rateLimiterRes) {
        client.emit('error', {
          message: 'Too many subscription requests',
          code: 'RATE_LIMIT_EXCEEDED'
        });
        return;
      }

      if (!data.rooms || !Array.isArray(data.rooms)) {
        throw new Error('Invalid rooms format');
      }

      // Validate rooms
      const validRooms = data.rooms.filter(room => {
        // Only allow rooms that the user has permission to join
        return room.startsWith(`user:${userId}`) ||
               room.startsWith('customer:') ||
               room.startsWith('invoice:') ||
               room === 'public';
      });

      if (validRooms.length === 0) {
        throw new Error('No valid rooms provided');
      }

      // Join rooms
      validRooms.forEach(room => {
        client.join(room);
        if (!this.userRoomMap.has(userId)) {
          this.userRoomMap.set(userId, new Set());
        }
        this.userRoomMap.get(userId)!.add(room);
      });

      client.emit('subscribed', {
        rooms: validRooms,
        message: `Successfully subscribed to ${validRooms.length} rooms`
      });

      this.logger.log(`User ${userId} subscribed to rooms: ${validRooms.join(', ')}`);
    } catch (err) {
      this.logger.error(`Subscribe error: ${err.message}`, err.stack);
      client.emit('error', {
        message: err.message,
        code: 'SUBSCRIBE_ERROR'
      });
    }
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @MessageBody() data: { rooms: string[] },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new Error('Authentication required');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET')
      });

      if (!payload) {
        throw new Error('Invalid authentication');
      }

      const userId = payload.sub;
      const rateLimiterRes = await this.checkRateLimit(userId, 'unsubscribe', 10);
      if (!rateLimiterRes) {
        client.emit('error', {
          message: 'Too many unsubscription requests',
          code: 'RATE_LIMIT_EXCEEDED'
        });
        return;
      }

      if (!data.rooms || !Array.isArray(data.rooms)) {
        throw new Error('Invalid rooms format');
      }

      // Leave rooms
      data.rooms.forEach(room => {
        client.leave(room);
        if (this.userRoomMap.has(userId)) {
          this.userRoomMap.get(userId)!.delete(room);
        }
      });

      client.emit('unsubscribed', {
        rooms: data.rooms,
        message: `Successfully unsubscribed from ${data.rooms.length} rooms`
      });

      this.logger.log(`User ${userId} unsubscribed from rooms: ${data.rooms.join(', ')}`);
    } catch (err) {
      this.logger.error(`Unsubscribe error: ${err.message}`, err.stack);
      client.emit('error', {
        message: err.message,
        code: 'UNSUBSCRIBE_ERROR'
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      message: 'Pong from billing WebSocket'
    });
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private initializeRateLimiter() {
    this.rateLimiter = new RateLimiterMemory({
      points: 100, // 100 requests
      duration: 60, // per 60 seconds
      blockDuration: 60 // block for 60 seconds if exceeded
    });
  }

  private async checkRateLimit(
    userId: string,
    action: string,
    points: number
  ): Promise<boolean> {
    try {
      await this.rateLimiter.consume(`${userId}:${action}`, points);
      return true;
    } catch (err) {
      this.logger.warn(`Rate limit exceeded for user ${userId} on action ${action}`);
      return false;
    }
  }

  private setupServerMiddleware(server: Server) {
    server.use((socket: Socket, next) => {
      try {
        const token = this.extractToken(socket);
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET')
        });

        if (!payload) {
          return next(new Error('Invalid authentication'));
        }

        // Attach user to socket
        socket.data.user = payload;
        next();
      } catch (err) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventListeners() {
    // Listen for invoice events
    this.eventEmitter.on('invoice.created', (invoice) => {
      this.broadcastToCustomer(invoice.customerId, 'invoice:created', invoice);
      this.broadcastToRoom('public', 'invoice:created', invoice);
    });

    this.eventEmitter.on('invoice.updated', (invoice) => {
      this.broadcastToCustomer(invoice.customerId, 'invoice:updated', invoice);
      this.broadcastToRoom(`invoice:${invoice.id}`, 'invoice:updated', invoice);
    });

    this.eventEmitter.on('invoice.paid', (invoice) => {
      this.broadcastToCustomer(invoice.customerId, 'invoice:paid', invoice);
      this.broadcastToRoom(`invoice:${invoice.id}`, 'invoice:paid', invoice);
    });

    this.eventEmitter.on('invoice.overdue', (invoice) => {
      this.broadcastToCustomer(invoice.customerId, 'invoice:overdue', invoice);
    });

    // Listen for payment events
    this.eventEmitter.on('payment.created', (payment) => {
      this.broadcastToCustomer(payment.customerId, 'payment:created', payment);
      this.broadcastToRoom(`invoice:${payment.invoiceId}`, 'payment:created', payment);
    });

    this.eventEmitter.on('payment.failed', (payment) => {
      this.broadcastToCustomer(payment.customerId, 'payment:failed', payment);
    });

    // Listen for customer events
    this.eventEmitter.on('customer.updated', (customer) => {
      this.broadcastToCustomer(customer.id, 'customer:updated', customer);
    });
  }

  broadcastToCustomer(customerId: string, event: string, data: any) {
    const room = `customer:${customerId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Broadcasted ${event} to customer ${customerId}`);
  }

  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
    this.logger.debug(`Broadcasted ${event} to room ${room}`);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Broadcasted ${event} to user ${userId}`);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectionMap.keys());
  }

  getUserRooms(userId: string): string[] {
    return this.userRoomMap.get(userId) ? Array.from(this.userRoomMap.get(userId)!) : [];
  }

  getRoomClients(room: string): string[] {
    return Array.from(this.server.sockets.adapter.rooms.get(room) || []).map(
      (socketId) => socketId
    );
  }
}
```

### Real-Time Event Handlers

```typescript
// realtime-event.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { InvoiceService } from '../invoice/invoice.service';
import { PaymentService } from '../payment/payment.service';
import { CustomerService } from '../customer/customer.service';
import { Invoice } from '../invoice/invoice.entity';
import { Payment } from '../payment/payment.entity';
import { Customer } from '../customer/customer.entity';
import { InvoiceStatus } from '../invoice/invoice-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RealtimeEventService {
  private readonly logger = new Logger(RealtimeEventService.name);
  private readonly EVENT_QUEUE_KEY = 'billing:event_queue';

  constructor(
    private eventEmitter: EventEmitter2,
    private websocketGateway: WebsocketGateway,
    private invoiceService: InvoiceService,
    private paymentService: PaymentService,
    private customerService: CustomerService,
    private redisService: RedisService
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Invoice events
    this.eventEmitter.on('invoice.created', (invoice: Invoice) => this.handleInvoiceCreated(invoice));
    this.eventEmitter.on('invoice.updated', (invoice: Invoice) => this.handleInvoiceUpdated(invoice));
    this.eventEmitter.on('invoice.status_changed', (data: { invoice: Invoice; previousStatus: InvoiceStatus }) =>
      this.handleInvoiceStatusChanged(data.invoice, data.previousStatus));
    this.eventEmitter.on('invoice.paid', (invoice: Invoice) => this.handleInvoicePaid(invoice));
    this.eventEmitter.on('invoice.overdue', (invoice: Invoice) => this.handleInvoiceOverdue(invoice));
    this.eventEmitter.on('invoice.void', (invoice: Invoice) => this.handleInvoiceVoid(invoice));
    this.eventEmitter.on('invoice.refunded', (invoice: Invoice) => this.handleInvoiceRefunded(invoice));

    // Payment events
    this.eventEmitter.on('payment.created', (payment: Payment) => this.handlePaymentCreated(payment));
    this.eventEmitter.on('payment.failed', (payment: Payment) => this.handlePaymentFailed(payment));
    this.eventEmitter.on('payment.refunded', (payment: Payment) => this.handlePaymentRefunded(payment));

    // Customer events
    this.eventEmitter.on('customer.created', (customer: Customer) => this.handleCustomerCreated(customer));
    this.eventEmitter.on('customer.updated', (customer: Customer) => this.handleCustomerUpdated(customer));
    this.eventEmitter.on('customer.credit_limit_updated', (data: { customer: Customer; previousLimit: number }) =>
      this.handleCustomerCreditLimitUpdated(data.customer, data.previousLimit));
  }

  private async handleInvoiceCreated(invoice: Invoice) {
    try {
      // Add to event queue
      await this.addToEventQueue('invoice:created', invoice);

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        invoice.customerId,
        'invoice:created',
        this.sanitizeInvoice(invoice)
      );

      // Broadcast to public room
      this.websocketGateway.broadcastToRoom(
        'public',
        'invoice:created',
        this.sanitizeInvoiceForPublic(invoice)
      );

      // Update customer's recent invoices
      await this.customerService.updateRecentInvoices(invoice.customerId, invoice.id);

      this.logger.log(`Handled invoice.created event for invoice ${invoice.id}`);
    } catch (err) {
      this.logger.error(`Error handling invoice.created event: ${err.message}`, err.stack);
    }
  }

  private async handleInvoiceUpdated(invoice: Invoice) {
    try {
      await this.addToEventQueue('invoice:updated', invoice);

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        invoice.customerId,
        'invoice:updated',
        this.sanitizeInvoice(invoice)
      );

      // Broadcast to invoice-specific room
      this.websocketGateway.broadcastToRoom(
        `invoice:${invoice.id}`,
        'invoice:updated',
        this.sanitizeInvoice(invoice)
      );

      this.logger.log(`Handled invoice.updated event for invoice ${invoice.id}`);
    } catch (err) {
      this.logger.error(`Error handling invoice.updated event: ${err.message}`, err.stack);
    }
  }

  private async handleInvoiceStatusChanged(invoice: Invoice, previousStatus: InvoiceStatus) {
    try {
      await this.addToEventQueue('invoice:status_changed', {
        invoice,
        previousStatus
      });

      const eventData = {
        invoice: this.sanitizeInvoice(invoice),
        previousStatus,
        currentStatus: invoice.status
      };

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        invoice.customerId,
        'invoice:status_changed',
        eventData
      );

      // Broadcast to invoice-specific room
      this.websocketGateway.broadcastToRoom(
        `invoice:${invoice.id}`,
        'invoice:status_changed',
        eventData
      );

      // Handle status-specific logic
      switch (invoice.status) {
        case InvoiceStatus.PAID:
          await this.handleInvoicePaid(invoice);
          break;
        case InvoiceStatus.OVERDUE:
          await this.handleInvoiceOverdue(invoice);
          break;
        case InvoiceStatus.VOID:
          await this.handleInvoiceVoid(invoice);
          break;
      }

      this.logger.log(`Handled invoice.status_changed event for invoice ${invoice.id}: ${previousStatus} -> ${invoice.status}`);
    } catch (err) {
      this.logger.error(`Error handling invoice.status_changed event: ${err.message}`, err.stack);
    }
  }

  private async handleInvoicePaid(invoice: Invoice) {
    try {
      await this.addToEventQueue('invoice:paid', invoice);

      const eventData = this.sanitizeInvoice(invoice);

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        invoice.customerId,
        'invoice:paid',
        eventData
      );

      // Broadcast to invoice-specific room
      this.websocketGateway.broadcastToRoom(
        `invoice:${invoice.id}`,
        'invoice:paid',
        eventData
      );

      // Update customer's payment history
      await this.customerService.updatePaymentHistory(invoice.customerId, invoice.id);

      // Check if this completes a subscription
      if (invoice.subscriptionId) {
        await this.invoiceService.checkSubscriptionCompletion(invoice.subscriptionId);
      }

      this.logger.log(`Handled invoice.paid event for invoice ${invoice.id}`);
    } catch (err) {
      this.logger.error(`Error handling invoice.paid event: ${err.message}`, err.stack);
    }
  }

  private async handleInvoiceOverdue(invoice: Invoice) {
    try {
      await this.addToEventQueue('invoice:overdue', invoice);

      const eventData = {
        ...this.sanitizeInvoice(invoice),
        daysOverdue: this.calculateDaysOverdue(invoice.dueDate)
      };

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        invoice.customerId,
        'invoice:overdue',
        eventData
      );

      // Broadcast to collections team if applicable
      if (invoice.amountDue > 1000) { // Threshold for collections
        this.websocketGateway.broadcastToRoom(
          'collections',
          'invoice:overdue:high_value',
          eventData
        );
      }

      // Update customer's credit status
      await this.customerService.updateCreditStatus(invoice.customerId);

      this.logger.log(`Handled invoice.overdue event for invoice ${invoice.id}`);
    } catch (err) {
      this.logger.error(`Error handling invoice.overdue event: ${err.message}`, err.stack);
    }
  }

  private async handleInvoiceVoid(invoice: Invoice) {
    try {
      await this.addToEventQueue('invoice:void', invoice);

      const eventData = this.sanitizeInvoice(invoice);

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        invoice.customerId,
        'invoice:void',
        eventData
      );

      // Broadcast to invoice-specific room
      this.websocketGateway.broadcastToRoom(
        `invoice:${invoice.id}`,
        'invoice:void',
        eventData
      );

      // Update customer's recent invoices
      await this.customerService.removeFromRecentInvoices(invoice.customerId, invoice.id);

      this.logger.log(`Handled invoice.void event for invoice ${invoice.id}`);
    } catch (err) {
      this.logger.error(`Error handling invoice.void event: ${err.message}`, err.stack);
    }
  }

  private async handleInvoiceRefunded(invoice: Invoice) {
    try {
      await this.addToEventQueue('invoice:refunded', invoice);

      const eventData = this.sanitizeInvoice(invoice);

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        invoice.customerId,
        'invoice:refunded',
        eventData
      );

      // Broadcast to invoice-specific room
      this.websocketGateway.broadcastToRoom(
        `invoice:${invoice.id}`,
        'invoice:refunded',
        eventData
      );

      // Update customer's payment history
      await this.customerService.updateRefundHistory(invoice.customerId, invoice.id);

      this.logger.log(`Handled invoice.refunded event for invoice ${invoice.id}`);
    } catch (err) {
      this.logger.error(`Error handling invoice.refunded event: ${err.message}`, err.stack);
    }
  }

  private async handlePaymentCreated(payment: Payment) {
    try {
      await this.addToEventQueue('payment:created', payment);

      const eventData = this.sanitizePayment(payment);

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        payment.customerId,
        'payment:created',
        eventData
      );

      // Broadcast to invoice-specific room
      this.websocketGateway.broadcastToRoom(
        `invoice:${payment.invoiceId}`,
        'payment:created',
        eventData
      );

      // Update customer's payment history
      await this.customerService.updatePaymentHistory(payment.customerId, payment.invoiceId);

      // Check if this completes the invoice
      const invoice = await this.invoiceService.getInvoice(payment.invoiceId);
      if (invoice && invoice.status !== InvoiceStatus.PAID) {
        const remainingAmount = invoice.totalAmount - (invoice.amountPaid + payment.amount);
        if (remainingAmount <= 0) {
          await this.invoiceService.markAsPaid(payment.invoiceId);
        }
      }

      this.logger.log(`Handled payment.created event for payment ${payment.id}`);
    } catch (err) {
      this.logger.error(`Error handling payment.created event: ${err.message}`, err.stack);
    }
  }

  private async handlePaymentFailed(payment: Payment) {
    try {
      await this.addToEventQueue('payment:failed', payment);

      const eventData = {
        ...this.sanitizePayment(payment),
        failureReason: payment.failureReason
      };

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        payment.customerId,
        'payment:failed',
        eventData
      );

      // Broadcast to invoice-specific room
      this.websocketGateway.broadcastToRoom(
        `invoice:${payment.invoiceId}`,
        'payment:failed',
        eventData
      );

      // Update customer's payment history
      await this.customerService.updateFailedPayment(payment.customerId, payment.invoiceId);

      this.logger.log(`Handled payment.failed event for payment ${payment.id}`);
    } catch (err) {
      this.logger.error(`Error handling payment.failed event: ${err.message}`, err.stack);
    }
  }

  private async handlePaymentRefunded(payment: Payment) {
    try {
      await this.addToEventQueue('payment:refunded', payment);

      const eventData = this.sanitizePayment(payment);

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        payment.customerId,
        'payment:refunded',
        eventData
      );

      // Broadcast to invoice-specific room
      this.websocketGateway.broadcastToRoom(
        `invoice:${payment.invoiceId}`,
        'payment:refunded',
        eventData
      );

      // Update customer's refund history
      await this.customerService.updateRefundHistory(payment.customerId, payment.invoiceId);

      this.logger.log(`Handled payment.refunded event for payment ${payment.id}`);
    } catch (err) {
      this.logger.error(`Error handling payment.refunded event: ${err.message}`, err.stack);
    }
  }

  private async handleCustomerCreated(customer: Customer) {
    try {
      await this.addToEventQueue('customer:created', customer);

      const eventData = this.sanitizeCustomer(customer);

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        customer.id,
        'customer:created',
        eventData
      );

      // Broadcast to sales team
      this.websocketGateway.broadcastToRoom(
        'sales',
        'customer:created',
        eventData
      );

      this.logger.log(`Handled customer.created event for customer ${customer.id}`);
    } catch (err) {
      this.logger.error(`Error handling customer.created event: ${err.message}`, err.stack);
    }
  }

  private async handleCustomerUpdated(customer: Customer) {
    try {
      await this.addToEventQueue('customer:updated', customer);

      const eventData = this.sanitizeCustomer(customer);

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        customer.id,
        'customer:updated',
        eventData
      );

      // Broadcast to customer-specific room
      this.websocketGateway.broadcastToRoom(
        `customer:${customer.id}`,
        'customer:updated',
        eventData
      );

      this.logger.log(`Handled customer.updated event for customer ${customer.id}`);
    } catch (err) {
      this.logger.error(`Error handling customer.updated event: ${err.message}`, err.stack);
    }
  }

  private async handleCustomerCreditLimitUpdated(customer: Customer, previousLimit: number) {
    try {
      await this.addToEventQueue('customer:credit_limit_updated', {
        customer,
        previousLimit
      });

      const eventData = {
        customer: this.sanitizeCustomer(customer),
        previousLimit,
        newLimit: customer.creditLimit
      };

      // Broadcast to customer
      this.websocketGateway.broadcastToCustomer(
        customer.id,
        'customer:credit_limit_updated',
        eventData
      );

      // Broadcast to finance team if limit increased significantly
      if (customer.creditLimit > previousLimit * 1.5) {
        this.websocketGateway.broadcastToRoom(
          'finance',
          'customer:credit_limit_increased',
          eventData
        );
      }

      this.logger.log(`Handled customer.credit_limit_updated event for customer ${customer.id}: ${previousLimit} -> ${customer.creditLimit}`);
    } catch (err) {
      this.logger.error(`Error handling customer.credit_limit_updated event: ${err.message}`, err.stack);
    }
  }

  private async addToEventQueue(eventType: string, data: any) {
    try {
      const event = {
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
        processed: false
      };

      await this.redisService.lpush(this.EVENT_QUEUE_KEY, JSON.stringify(event));
      this.logger.debug(`Added event to queue: ${eventType}`);
    } catch (err) {
      this.logger.error(`Error adding event to queue: ${err.message}`, err.stack);
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processEventQueue() {
    try {
      const event = await this.redisService.rpop(this.EVENT_QUEUE_KEY);
      if (!event) {
        return;
      }

      const parsedEvent = JSON.parse(event);
      if (parsedEvent.processed) {
        return;
      }

      // Process the event based on type
      switch (parsedEvent.type) {
        case 'invoice:created':
          await this.handleInvoiceCreated(parsedEvent.data);
          break;
        case 'invoice:updated':
          await this.handleInvoiceUpdated(parsedEvent.data);
          break;
        case 'invoice:status_changed':
          await this.handleInvoiceStatusChanged(parsedEvent.data.invoice, parsedEvent.data.previousStatus);
          break;
        case 'invoice:paid':
          await this.handleInvoicePaid(parsedEvent.data);
          break;
        case 'invoice:overdue':
          await this.handleInvoiceOverdue(parsedEvent.data);
          break;
        case 'payment:created':
          await this.handlePaymentCreated(parsedEvent.data);
          break;
        case 'payment:failed':
          await this.handlePaymentFailed(parsedEvent.data);
          break;
        case 'customer:created':
          await this.handleCustomerCreated(parsedEvent.data);
          break;
        case 'customer:updated':
          await this.handleCustomerUpdated(parsedEvent.data);
          break;
        default:
          this.logger.warn(`Unknown event type in queue: ${parsedEvent.type}`);
      }

      // Mark as processed
      parsedEvent.processed = true;
      await this.redisService.lpush(this.EVENT_QUEUE_KEY, JSON.stringify(parsedEvent));
    } catch (err) {
      this.logger.error(`Error processing event queue: ${err.message}`, err.stack);
    }
  }

  private sanitizeInvoice(invoice: Invoice): any {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      currency: invoice.currency,
      reference: invoice.reference,
      lineItems: invoice.lineItems?.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        productId: item.productId
      })),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    };
  }

  private sanitizeInvoiceForPublic(invoice: Invoice): any {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      createdAt: invoice.createdAt
    };
  }

  private sanitizePayment(payment: Payment): any {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      transactionDate: payment.transactionDate,
      reference: payment.reference,
      createdAt: payment.createdAt
    };
  }

  private sanitizeCustomer(customer: Customer): any {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      billingAddress: customer.billingAddress,
      creditLimit: customer.creditLimit,
      creditScore: customer.creditScore,
      status: customer.status,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };
  }

  private calculateDaysOverdue(dueDate: Date): number {
    const today = new Date();
    const due = new Date(dueDate);
    const timeDiff = today.getTime() - due.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}
```

---

## AI/ML Capabilities

### Predictive Model Training

```python
# billing_prediction_model.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV, TimeSeriesSplit
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    precision_recall_curve,
    average_precision_score,
    f1_score
)
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import make_pipeline as make_imb_pipeline
import xgboost as xgb
import lightgbm as lgb
import catboost as cb
import matplotlib.pyplot as plt
import seaborn as sns
from sqlalchemy import create_engine
import psycopg2
import os
from dotenv import load_dotenv
import warnings
import mlflow
import mlflow.sklearn
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import ClassificationPreset
from evidently.metrics import (
    ClassificationQualityMetric,
    ClassificationClassBalance,
    ClassificationConfusionMatrix,
    ClassificationPRTable,
    ClassificationPRCurve,
    ClassificationROC
)

# Suppress warnings
warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

class BillingPredictionModel:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.feature_names = None
        self.target_variable = 'payment_delayed'
        self.model_version = '1.0.0'
        self.experiment_name = 'billing_payment_prediction'
        self.db_engine = self._create_db_engine()
        self._initialize_mlflow()

    def _create_db_engine(self):
        """Create database engine for data extraction"""
        db_url = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@" \
                 f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
        return create_engine(db_url)

    def _initialize_mlflow(self):
        """Initialize MLflow tracking"""
        mlflow.set_tracking_uri(os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000'))
        mlflow.set_experiment(self.experiment_name)

    def extract_data(self, days_back=365):
        """Extract data from the database"""
        print("Extracting data from database...")

        query = f"""
        WITH customer_stats AS (
            SELECT
                customer_id,
                AVG(total_amount) as avg_invoice_amount,
                STDDEV(total_amount) as std_invoice_amount,
                COUNT(*) as invoice_count,
                SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) as overdue_count,
                AVG(EXTRACT(DAY FROM (payment_date - due_date))) as avg_payment_days,
                STDDEV(EXTRACT(DAY FROM (payment_date - due_date))) as std_payment_days,
                MAX(created_at) as last_invoice_date
            FROM invoices
            WHERE created_at >= NOW() - INTERVAL '{days_back} days'
            GROUP BY customer_id
        ),
        payment_history AS (
            SELECT
                customer_id,
                invoice_id,
                amount,
                payment_method,
                status,
                transaction_date,
                EXTRACT(DAY FROM (transaction_date - due_date)) as payment_delay,
                CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END as is_failed,
                CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END as is_refunded
            FROM payments p
            JOIN invoices i ON p.invoice_id = i.id
            WHERE p.transaction_date >= NOW() - INTERVAL '{days_back} days'
        ),
        customer_features AS (
            SELECT
                c.id as customer_id,
                c.credit_score,
                c.credit_limit,
                c.days_since_last_payment,
                c.payment_frequency,
                c.industry,
                c.company_size,
                c.region,
                c.country,
                c.created_at as customer_created_at,
                EXTRACT(DAY FROM (NOW() - c.created_at)) as customer_age_days,
                cs.avg_invoice_amount,
                cs.std_invoice_amount,
                cs.invoice_count,
                cs.paid_count,
                cs.overdue_count,
                cs.avg_payment_days,
                cs.std_payment_days,
                cs.last_invoice_date,
                EXTRACT(DAY FROM (NOW() - cs.last_invoice_date)) as days_since_last_invoice
            FROM customers c
            LEFT JOIN customer_stats cs ON c.id = cs.customer_id
            WHERE c.created_at >= NOW() - INTERVAL '{days_back * 2} days'
        )
        SELECT
            i.id as invoice_id,
            i.customer_id,
            i.invoice_number,
            i.issue_date,
            i.due_date,
            i.total_amount,
            i.amount_paid,
            i.amount_due,
            i.status,
            i.currency,
            i.tax_amount,
            i.discount_amount,
            i.line_item_count,
            EXTRACT(DAY FROM (i.due_date - i.issue_date)) as payment_terms,
            EXTRACT(DAY FROM (NOW() - i.issue_date)) as invoice_age_days,
            EXTRACT(DAY FROM (NOW() - i.due_date)) as days_overdue,
            CASE WHEN i.status = 'OVERDUE' THEN 1 ELSE 0 END as is_overdue,
            CASE WHEN i.status = 'PAID' AND (i.payment_date > i.due_date) THEN 1 ELSE 0 END as payment_delayed,
            cf.credit_score,
            cf.credit_limit,
            cf.days_since_last_payment,
            cf.payment_frequency,
            cf.industry,
            cf.company_size,
            cf.region,
            cf.country,
            cf.customer_age_days,
            cf.avg_invoice_amount,
            cf.std_invoice_amount,
            cf.invoice_count,
            cf.paid_count,
            cf.overdue_count,
            cf.avg_payment_days,
            cf.std_payment_days,
            cf.days_since_last_invoice,
            CASE WHEN cf.overdue_count > 0 THEN cf.overdue_count::float / cf.invoice_count ELSE 0 END as overdue_rate,
            CASE WHEN cf.invoice_count > 0 THEN cf.paid_count::float / cf.invoice_count ELSE 0 END as payment_rate,
            i.total_amount / NULLIF(cf.avg_invoice_amount, 0) as invoice_amount_ratio,
            EXTRACT(MONTH FROM i.issue_date) as issue_month,
            EXTRACT(DAYOFWEEK FROM i.issue_date) as issue_day_of_week,
            EXTRACT(MONTH FROM i.due_date) as due_month,
            EXTRACT(DAYOFWEEK FROM i.due_date) as due_day_of_week,
            CASE WHEN EXTRACT(DAY FROM i.due_date) BETWEEN 1 AND 7 THEN 1
                 WHEN EXTRACT(DAY FROM i.due_date) BETWEEN 8 AND 14 THEN 2
                 WHEN EXTRACT(DAY FROM i.due_date) BETWEEN 15 AND 21 THEN 3
                 WHEN EXTRACT(DAY FROM i.due_date) BETWEEN 22 AND 28 THEN 4
                 ELSE 5 END as due_week_of_month,
            CASE WHEN i.currency = 'USD' THEN 1 ELSE 0 END as is_usd,
            CASE WHEN i.currency = 'EUR' THEN 1 ELSE 0 END as is_eur,
            CASE WHEN i.currency = 'GBP' THEN 1 ELSE 0 END as is_gbp,
            CASE WHEN i.discount_amount > 0 THEN 1 ELSE 0 END as has_discount,
            i.tax_amount / NULLIF(i.total_amount, 0) as tax_ratio,
            i.discount_amount / NULLIF(i.total_amount, 0) as discount_ratio,
            i.amount_due / NULLIF(i.total_amount, 0) as due_ratio
        FROM invoices i
        JOIN customer_features cf ON i.customer_id = cf.customer_id
        WHERE i.created_at >= NOW() - INTERVAL '{days_back} days'
        AND i.status IN ('PAID', 'OVERDUE', 'UNPAID')
        """

        df = pd.read_sql(query, self.db_engine)
        print(f"Extracted {len(df)} records")
        return df

    def preprocess_data(self, df):
        """Preprocess the data for modeling"""
        print("Preprocessing data...")

        # Create target variable - whether payment was delayed
        df['target'] = df['payment_delayed'].astype(int)

        # Define features and target
        features = df.drop([
            'invoice_id', 'customer_id', 'invoice_number', 'issue_date', 'due_date',
            'status', 'payment_date', 'payment_delayed', 'target'
        ], axis=1, errors='ignore')

        target = df['target']

        # Identify categorical and numerical features
        categorical_features = features.select_dtypes(include=['object', 'category']).columns.tolist()
        numerical_features = features.select_dtypes(include=['int64', 'float64']).columns.tolist()

        # Remove target-related features from numerical features
        numerical_features = [f for f in numerical_features if f not in ['is_overdue', 'payment_delayed']]

        print(f"Categorical features: {categorical_features}")
        print(f"Numerical features: {numerical_features}")

        # Create preprocessing pipeline
        numerical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse=False))
        ])

        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numerical_transformer, numerical_features),
                ('cat', categorical_transformer, categorical_features)
            ])

        # Apply preprocessing
        X_processed = self.preprocessor.fit_transform(features)

        # Get feature names after one-hot encoding
        feature_names = numerical_features.copy()

        if len(categorical_features) > 0:
            ohe_feature_names = self.preprocessor.named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(categorical_features)
            feature_names.extend(ohe_feature_names)

        self.feature_names = feature_names

        # Split data into train and test sets (time-based split)
        df = df.sort_values('issue_date')
        split_date = df['issue_date'].max() - timedelta(days=30)
        train_df = df[df['issue_date'] <= split_date]
        test_df = df[df['issue_date'] > split_date]

        X_train = self.preprocessor.transform(train_df[features.columns])
        X_test = self.preprocessor.transform(test_df[features.columns])
        y_train = train_df['target']
        y_test = test_df['target']

        print(f"Train set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        print(f"Class distribution in train: {y_train.value_counts(normalize=True)}")
        print(f"Class distribution in test: {y_test.value_counts(normalize=True)}")

        return X_train, X_test, y_train, y_test, feature_names

    def train_model(self, X_train, y_train):
        """Train the prediction model"""
        print("Training model...")

        # Define models to try
        models = {
            'random_forest': RandomForestClassifier(random_state=42, n_jobs=-1),
            'xgboost': xgb.XGBClassifier(random_state=42, n_jobs=-1, eval_metric='logloss'),
            'lightgbm': lgb.LGBMClassifier(random_state=42, n_jobs=-1),
            'catboost': cb.CatBoostClassifier(random_state=42, verbose=0),
            'gradient_boosting': GradientBoostingClassifier(random_state=42),
            'logistic_regression': LogisticRegression(random_state=42, max_iter=1000, n_jobs=-1)
        }

        # Define parameter grids for each model
        param_grids = {
            'random_forest': {
                'classifier__n_estimators': [100, 200, 300],
                'classifier__max_depth': [None, 10, 20, 30],
                'classifier__min_samples_split': [2, 5, 10],
                'classifier__min_samples_leaf': [1, 2, 4],
                'classifier__class_weight': [None, 'balanced']
            },
            'xgboost': {
                'classifier__n_estimators': [100, 200, 300],
                'classifier__max_depth': [3, 6, 9],
                'classifier__learning_rate': [0.01, 0.1, 0.2],
                'classifier__subsample': [0.8, 0.9, 1.0],
                'classifier__colsample_bytree': [0.8, 0.9, 1.0],
                'classifier__scale_pos_weight': [1, len(y_train[y_train==0])/len(y_train[y_train==1])]
            },
            'lightgbm': {
                'classifier__n_estimators': [100, 200, 300],
                'classifier__max_depth': [3, 6, 9],
                'classifier__learning_rate': [0.01, 0.1, 0.2],
                'classifier__num_leaves': [31, 63, 127],
                'classifier__class_weight': [None, 'balanced']
            },
            'catboost': {
                'classifier__iterations': [100, 200, 300],
                'classifier__depth': [4, 6, 8],
                'classifier__learning_rate': [0.01, 0.1, 0.2],
                'classifier__l2_leaf_reg': [1, 3, 5],
                'classifier__class_weights': [None, [1, len(y_train[y_train==0])/len(y_train[y_train==1])]]
            },
            'gradient_boosting': {
                'classifier__n_estimators': [100, 200, 300],
                'classifier__learning_rate': [0.01, 0.1, 0.2],
                'classifier__max_depth': [3, 5, 7],
                'classifier__min_samples_split': [2, 5, 10],
                'classifier__min_samples_leaf': [1, 2, 4]
            },
            'logistic_regression': {
                'classifier__C': [0.001, 0.01, 0.1, 1, 10, 100],
                'classifier__penalty': ['l1', 'l2'],
                'classifier__class_weight': [None, 'balanced']
            }
        }

        # Time-based cross-validation
        tscv = TimeSeriesSplit(n_splits=5)

        best_score = 0
        best_model = None
        best_model_name = ''

        # Start MLflow run
        with mlflow.start_run():
            # Log parameters
            mlflow.log_param('target_variable', self.target_variable)
            mlflow.log_param('model_version', self.model_version)

            for model_name, model in models.items():
                print(f"\nTraining {model_name}...")

                # Create pipeline with SMOTE for handling class imbalance
                pipeline = make_imb_pipeline(
                    self.preprocessor,
                    SMOTE(random_state=42),
                    SelectKBest(score_func=f_classif, k=20),
                    model
                )

                # Grid search with time-based CV
                grid_search = GridSearchCV(
                    estimator=pipeline,
                    param_grid=param_grids[model_name],
                    cv=tscv,
                    scoring='roc_auc',
                    n_jobs=-1,
                    verbose=1
                )

                grid_search.fit(X_train, y_train)

                # Evaluate on training set
                y_pred = grid_search.predict(X_train)
                y_pred_proba = grid_search.predict_proba(X_train)[:, 1]

                # Calculate metrics
                train_auc = roc_auc_score(y_train, y_pred_proba)
                train_f1 = f1_score(y_train, y_pred)

                print(f"{model_name} - Train AUC: {train_auc:.4f}, Train F1: {train_f1:.4f}")
                print(f"Best params: {grid_search.best_params_}")

                # Log to MLflow
                mlflow.log_metric(f'{model_name}_train_auc', train_auc)
                mlflow.log_metric(f'{model_name}_train_f1', train_f1)
                mlflow.log_params({f'{model_name}_{k}': v for k, v in grid_search.best_params_.items()})

                # Check if this is the best model so far
                if grid_search.best_score_ > best_score:
                    best_score = grid_search.best_score_
                    best_model = grid_search.best_estimator_
                    best_model_name = model_name

            print(f"\nBest model: {best_model_name} with AUC: {best_score:.4f}")

            # Train best model on full training data
            best_model.fit(X_train, y_train)

            # Log best model to MLflow
            mlflow.sklearn.log_model(best_model, 'model')
            mlflow.log_param('best_model', best_model_name)
            mlflow.log_metric('best_cv_auc', best_score)

            # Save feature importance
            if hasattr(best_model.named_steps[best_model_name], 'feature_importances_'):
                importances = best_model.named_steps[best_model_name].feature_importances_
                selected_features = best_model.named_steps['selectkbest'].get_support()
                feature_importance = pd.DataFrame({
                    'feature': self.feature_names[selected_features],
                    'importance': importances
                }).sort_values('importance', ascending=False)

                # Log feature importance
                mlflow.log_dict(feature_importance.to_dict(), 'feature_importance.json')

                # Plot feature importance
                plt.figure(figsize=(10, 8))
                sns.barplot(x='importance', y='feature', data=feature_importance.head(20))
                plt.title('Top 20 Feature Importances')
                plt.tight_layout()
                plt.savefig('feature_importance.png')
                mlflow.log_artifact('feature_importance.png')

            self.model = best_model
            return best_model

    def evaluate_model(self, model, X_test, y_test):
        """Evaluate the model on test data"""
        print("Evaluating model...")

        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]

        # Calculate metrics
        auc = roc_auc_score(y_test, y_pred_proba)
        f1 = f1_score(y_test, y_pred)
        precision, recall, _ = precision_recall_curve(y_test, y_pred_proba)
        avg_precision = average_precision_score(y_test, y_pred_proba)

        print(f"AUC: {auc:.4f}")
        print(f"F1 Score: {f1:.4f}")
        print(f"Average Precision: {avg_precision:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        print("\nConfusion Matrix:")
        print(confusion_matrix(y_test, y_pred))

        # Log metrics to MLflow
        with mlflow.start_run(nested=True):
            mlflow.log_metric('test_auc', auc)
            mlflow.log_metric('test_f1', f1)
            mlflow.log_metric('test_avg_precision', avg_precision)

            # Log classification report
            report = classification_report(y_test, y_pred, output_dict=True)
            mlflow.log_dict(report, 'classification_report.json')

            # Log confusion matrix
            cm = confusion_matrix(y_test, y_pred)
            mlflow.log_dict({'confusion_matrix': cm.tolist()}, 'confusion_matrix.json')

            # Generate and log Evidently report
            self._generate_evidently_report(X_test, y_test, y_pred, y_pred_proba)

        # Plot ROC curve
        self._plot_roc_curve(y_test, y_pred_proba)

        # Plot Precision-Recall curve
        self._plot_precision_recall_curve(y_test, y_pred_proba)

        return {
            'auc': auc,
            'f1': f1,
            'average_precision': avg_precision,
            'classification_report': classification_report(y_test, y_pred, output_dict=True),
            'confusion_matrix': confusion_matrix(y_test, y_pred)
        }

    def _generate_evidently_report(self, X_test, y_test, y_pred, y_pred_proba):
        """Generate Evidently report for model monitoring"""
        try:
            # Create column mapping
            column_mapping = ColumnMapping()
            column_mapping.target = 'target'
            column_mapping.prediction = 'prediction'
            column_mapping.numerical_features = [f for f in self.feature_names if not f.startswith('cat__')]
            column_mapping.categorical_features = [f for f in self.feature_names if f.startswith('cat__')]

            # Prepare data
            reference_data = pd.DataFrame(X_test, columns=self.feature_names)
            reference_data['target'] = y_test
            reference_data['prediction'] = y_pred_proba

            current_data = pd.DataFrame(X_test, columns=self.feature_names)
            current_data['target'] = y_test
            current_data['prediction'] = y_pred_proba

            # Create report
            report = Report(metrics=[
                ClassificationPreset(),
                ClassificationQualityMetric(),
                ClassificationClassBalance(),
                ClassificationConfusionMatrix(),
                ClassificationPRTable(),
                ClassificationPRCurve(),
                ClassificationROC()
            ])

            report.run(
                reference_data=reference_data,
                current_data=current_data,
                column_mapping=column_mapping
            )

            # Save report
            report.save_html('evidently_report.html')
            mlflow.log_artifact('evidently_report.html')

        except Exception as e:
            print(f"Error generating Evidently report: {e}")

    def _plot_roc_curve(self, y_test, y_pred_proba):
        """Plot ROC curve"""
        from sklearn.metrics import roc_curve

        fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, label=f'AUC = {roc_auc_score(y_test, y_pred_proba):.2f}')
        plt.plot([0, 1], [0, 1], 'k--')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('ROC Curve')
        plt.legend()
        plt.savefig('roc_curve.png')
        mlflow.log_artifact('roc_curve.png')
        plt.close()

    def _plot_precision_recall_curve(self, y_test, y_pred_proba):
        """Plot Precision-Recall curve"""
        precision, recall, _ = precision_recall_curve(y_test, y_pred_proba)
        plt.figure(figsize=(8, 6))
        plt.plot(recall, precision, label=f'AP = {average_precision_score(y_test, y_pred_proba):.2f}')
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title('Precision-Recall Curve')
        plt.legend()
        plt.savefig('precision_recall_curve.png')
        mlflow.log_artifact('precision_recall_curve.png')
        plt.close()

    def save_model(self, path='billing_prediction_model.pkl'):
        """Save the trained model"""
        if self.model is None:
            raise ValueError("Model has not been trained yet")

        joblib.dump({
            'model': self.model,
            'preprocessor': self.preprocessor,
            'feature_names': self.feature_names,
            'target_variable': self.target_variable,
            'model_version': self.model_version
        }, path)

        print(f"Model saved to {path}")
        return path

    def load_model(self, path='billing_prediction_model.pkl'):
        """Load a trained model"""
        data = joblib.load(path)
        self.model = data['model']
        self.preprocessor = data['preprocessor']
        self.feature_names = data['feature_names']
        self.target_variable = data['target_variable']
        self.model_version = data['model_version']

        print(f"Model loaded from {path}")
        return self.model

    def predict(self, new_data):
        """Make predictions on new data"""
        if self.model is None:
            raise ValueError("Model has not been trained or loaded")

        # Preprocess the new data
        X_new = self.preprocessor.transform(new_data)

        # Make predictions
        predictions = self.model.predict(X_new)
        probabilities = self.model.predict_proba(X_new)[:, 1]

        return predictions, probabilities

    def predict_delay_probability(self, invoice_data):
        """Predict the probability of payment delay for a single invoice"""
        if self.model is None:
            raise ValueError("Model has not been trained or loaded")

        # Convert to DataFrame
        df = pd.DataFrame([invoice_data])

        # Preprocess
        X = self.preprocessor.transform(df)

        # Predict
        probability = self.model.predict_proba(X)[0, 1]

        return {
            'invoice_id': invoice_data.get('invoice_id'),
            'customer_id': invoice_data.get('customer_id'),
            'delay_probability': float(probability),
            'prediction': 'DELAYED' if probability > 0.5 else 'ON_TIME',
            'model_version': self.model_version,
            'features': {feature: value for feature, value in zip(self.feature_names, X[0])}
        }

    def get_feature_importance(self):
        """Get feature importance from the model"""
        if self.model is None:
            raise ValueError("Model has not been trained or loaded")

        if hasattr(self.model.named_steps['classifier'], 'feature_importances_'):
            importances = self.model.named_steps['classifier'].feature_importances_
            selected_features = self.model.named_steps['selectkbest'].get_support()

            feature_importance = pd.DataFrame({
                'feature': self.feature_names[selected_features],
                'importance': importances
            }).sort_values('importance', ascending=False)

            return feature_importance
        else:
            return pd.DataFrame({'feature': [], 'importance': []})

    def retrain_model(self, days_back=365):
        """Retrain the model with new data"""
        print("Retraining model with new data...")

        # Extract new data
        df = self.extract_data(days_back)

        # Preprocess
        X_train, X_test, y_train, y_test, _ = self.preprocess_data(df)

        # Retrain
        self.train_model(X_train, y_train)

        # Evaluate
        evaluation = self.evaluate_model(self.model, X_test, y_test)

        return evaluation

    def monitor_model_performance(self, days_back=30):
        """Monitor model performance on recent data"""
        print("Monitoring model performance...")

        # Extract recent data
        df = self.extract_data(days_back)

        # Preprocess
        _, X_test, _, y_test, _ = self.preprocess_data(df)

        # Evaluate
        evaluation = self.evaluate_model(self.model, X_test, y_test)

        return evaluation

if __name__ == "__main__":
    # Initialize and run the model
    model = BillingPredictionModel()

    # Extract data
    df = model.extract_data(days_back=365)

    # Preprocess data
    X_train, X_test, y_train, y_test, feature_names = model.preprocess_data(df)

    # Train model
    trained_model = model.train_model(X_train, y_train)

    # Evaluate model
    evaluation = model.evaluate_model(trained_model, X_test, y_test)

    # Save model
    model_path = model.save_model()

    # Example prediction
    example_invoice = {
        'customer_id': 'cust_123',
        'invoice_number': 'INV-2023-001',
        'total_amount': 1500.0,
        'amount_paid': 0.0,
        'amount_due': 1500.0,
        'payment_terms': 30,
        'invoice_age_days': 5,
        'days_overdue': 0,
        'credit_score': 750,
        'credit_limit': 10000,
        'days_since_last_payment': 25,
        'payment_frequency': 30,
        'avg_invoice_amount': 1200.0,
        'std_invoice_amount': 300.0,
        'invoice_count': 15,
        'paid_count': 14,
        'overdue_count': 1,
        'avg_payment_days': 2.5,
        'std_payment_days': 5.2,
        'days_since_last_invoice': 10,
        'overdue_rate': 0.0667,
        'payment_rate': 0.9333,
        'invoice_amount_ratio': 1.25,
        'issue_month': 11,
        'issue_day_of_week': 2,
        'due_month': 12,
        'due_day_of_week': 5,
        'due_week_of_month': 2,
        'is_usd': 1,
        'has_discount': 0,
        'tax_ratio': 0.08,
        'discount_ratio': 0.0,
        'due_ratio': 1.0,
        'industry': 'Technology',
        'company_size': 'Medium',
        'region': 'North America',
        'country': 'USA'
    }

    prediction = model.predict_delay_probability(example_invoice)
    print("\nExample Prediction:")
    print(prediction)
```

---

## Progressive Web App (PWA) Features

### Service Worker Implementation

```typescript
// service-worker.ts
const CACHE_NAME = 'billing-pwa-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/icons/icon-72x72.png',
  '/assets/icons/icon-96x96.png',
  '/assets/icons/icon-128x128.png',
  '/assets/icons/icon-144x144.png',
  '/assets/icons/icon-152x152.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-384x384.png',
  '/assets/icons/icon-512x512.png',
  '/assets/styles/main.css',
  '/assets/scripts/main.js',
  '/assets/scripts/polyfills.js',
  '/assets/images/logo.png',
  '/assets/images/offline.png',
  '/assets/fonts/roboto.woff2',
  '/assets/fonts/roboto-bold.woff2',
  '/assets/fonts/material-icons.woff2'
];

const DATA_CACHE_NAME = 'billing-data-v2';
const API_URLS = [
  '/api/invoices',
  '/api/customers',
  '/api/payments',
  '/api/reports',
  '/api/settings'
];

const OFFLINE_PAGE = '/offline.html';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

// Install event - cache core assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[Service Worker] Caching app shell');

        // Cache core assets
        await cache.addAll(ASSETS_TO_CACHE);

        // Cache offline page
        await cache.add(OFFLINE_PAGE);

        // Skip waiting to activate the new service worker immediately
        self.skipWaiting();
      } catch (error) {
        console.error('[Service Worker] Installation failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
            .map((name) => caches.delete(name))
        );

        console.log('[Service Worker] Old caches cleaned up');
        await self.clients.claim();
      } catch (error) {
        console.error('[Service Worker] Activation failed:', error);
      }
    })()
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (API_URLS.some(url => event.request.url.includes(url))) {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(event.request.clone());

          // Cache successful API responses
          if (networkResponse.ok) {
            const cache = await caches.open(DATA_CACHE_NAME);
            await cache.put(event.request, networkResponse.clone());
          }

          return networkResponse;
        } catch (error) {
          // Fall back to cache if network fails
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // If no cache, return a custom response
          return new Response(
            JSON.stringify({ error: 'Network error', cached: false }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
              statusText: 'Service Unavailable'
            }
          );
        }
      })()
    );
  } else {
    // Handle other requests with cache-first strategy
    event.respondWith(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);

          if (cachedResponse) {
            // Return cached response if available
            return cachedResponse;
          }

          // If not in cache, try network
          const networkResponse = await fetch(event.request);

          // Cache successful responses
          if (networkResponse.ok && isCacheable(event.request.url)) {
            await cache.put(event.request, networkResponse.clone());
            await enforceCacheSizeLimit(cache);
          }

          return networkResponse;
        } catch (error) {
          // If network fails, return cached response or offline page
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_PAGE);
          }

          return new Response(null, { status: 503, statusText: 'Service Unavailable' });
        }
      })()
    );
  }
});

// Background sync for failed requests
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-payments') {
    event.waitUntil(
      (async () => {
        try {
          const db = await openIndexedDB();
          const pendingPayments = await getPendingPayments(db);

          for (const payment of pendingPayments) {
            try {
              const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${payment.token}`
                },
                body: JSON.stringify(payment.data)
              });

              if (response.ok) {
                await deletePendingPayment(db, payment.id);
                console.log('[Service Worker] Successfully synced payment:', payment.id);
              } else {
                throw new Error('Payment sync failed');
              }
            } catch (error) {
              console.error('[Service Worker] Payment sync failed:', payment.id, error);
              // Will retry on next sync
            }
          }
        } catch (error) {
          console.error('[Service Worker] Sync failed:', error);
        }
      })()
    );
  }
});

// Push notifications
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json();
  const title = data?.title || 'Billing Notification';
  const options = {
    body: data?.body || 'You have a new billing notification',
    icon: data?.icon || '/assets/icons/icon-192x192.png',
    badge: data?.badge || '/assets/icons/badge-72x72.png',
    data: data?.data || {},
    actions: data?.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    vibrate: [200, 100, 200],
    tag: data?.tag || 'billing-notification',
    renotify: data?.renotify || false,
    requireInteraction: data?.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const notificationData = event.notification.data;
  const action = event.action;

  if (action === 'dismiss') {
    return;
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      // Focus on existing window if available
      for (const client of allClients) {
        if (client.url.includes('/billing') && 'focus' in client) {
          await client.focus();
          if (notificationData.url) {
            client.postMessage({
              type: 'NAVIGATE',
              url: notificationData.url
            });
          }
          return;
        }
      }

      // Open new window if no existing one
      if (notificationData.url) {
        await self.clients.openWindow(notificationData.url);
      }
    })()
  );
});

// Periodic sync for background updates
self.addEventListener('periodicsync', (event: PeriodicSyncEvent) => {
  if (event.tag === 'update-invoices') {
    event.waitUntil(
      (async () => {
        try {
          const response = await fetch('/api/invoices?limit=10&status=UNPAID');
          if (response.ok) {
            const invoices = await response.json();
            const cache = await caches.open(DATA_CACHE_NAME);
            await cache.put('/api/invoices?limit=10&status=UNPAID', response.clone());

            // Notify clients about updates
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
              client.postMessage({
                type: 'INVOICES_UPDATED',
                data: invoices
              });
            });
          }
        } catch (error) {
          console.error('[Service Worker] Periodic sync failed:', error);
        }
      })()
    );
  }
});

// Helper functions
function isCacheable(url: string): boolean {
  // Don't cache certain file types
  const excludedExtensions = ['.php', '.asp', '.aspx', '.jsp', '.cgi'];
  return !excludedExtensions.some(ext => url.endsWith(ext));
}

async function enforceCacheSizeLimit(cache: Cache): Promise<void> {
  const keys = await cache.keys();
  let cacheSize = 0;

  // Calculate current cache size
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      cacheSize += blob.size;
    }
  }

  // If cache exceeds limit, remove oldest entries
  if (cacheSize > MAX_CACHE_SIZE) {
    console.log('[Service Worker] Cache size limit exceeded, cleaning up...');

    const sortedKeys = keys.sort((a, b) => {
      return (a.headers.get('date') || '').localeCompare(b.headers.get('date') || '');
    });

    // Remove oldest 20% of entries
    const entriesToRemove = Math.floor(sortedKeys.length * 0.2);
    for (let i = 0; i < entriesToRemove; i++) {
      await cache.delete(sortedKeys[i]);
    }
  }
}

async function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('billing-pwa-db', 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingPayments')) {
        db.createObjectStore('pendingPayments', { keyPath: 'id' });
      }
    };
  });
}

async function getPendingPayments(db: IDBDatabase): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingPayments', 'readonly');
    const store = transaction.objectStore('pendingPayments');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function deletePendingPayment(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingPayments', 'readwrite');
    const store = transaction.objectStore('pendingPayments');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Register periodic sync
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'REGISTER_PERIODIC_SYNC') {
    event.waitUntil(
      (async () => {
        try {
          await self.registration.periodicSync.register('update-invoices', {
            minInterval: 24 * 60 * 60 * 1000 // 24 hours
          });
          console.log('[Service Worker] Periodic sync registered');
        } catch (error) {
          console.error('[Service Worker] Periodic sync registration failed:', error);
        }
      })()
    );
  }
});
```

---

## WCAG 2.1 AAA Accessibility

### ARIA Implementation

```typescript
// accessibility.service.ts
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private readonly HIGH_CONTRAST_CLASS = 'high-contrast';
  private readonly REDUCED_MOTION_CLASS = 'reduced-motion';
  private readonly LARGE_TEXT_CLASS = 'large-text';
  private readonly SCREEN_READER_CLASS = 'screen-reader-mode';

  private highContrastSubject = new BehaviorSubject<boolean>(false);
  private reducedMotionSubject = new BehaviorSubject<boolean>(false);
  private largeTextSubject = new BehaviorSubject<boolean>(false);
  private screenReaderSubject = new BehaviorSubject<boolean>(false);

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.loadPreferences();
  }

  // High Contrast Mode
  toggleHighContrast(): void {
    const currentValue = this.highContrastSubject.value;
    this.setHighContrast(!currentValue);
  }

  setHighContrast(enabled: boolean): void {
    if (enabled) {
      this.document.body.classList.add(this.HIGH_CONTRAST_CLASS);
    } else {
      this.document.body.classList.remove(this.HIGH_CONTRAST_CLASS);
    }

    this.highContrastSubject.next(enabled);
    this.savePreference('highContrast', enabled);
  }

  getHighContrast(): Observable<boolean> {
    return this.highContrastSubject.asObservable();
  }

  // Reduced Motion
  toggleReducedMotion(): void {
    const currentValue = this.reducedMotionSubject.value;
    this.setReducedMotion(!currentValue);
  }

  setReducedMotion(enabled: boolean): void {
    if (enabled) {
      this.document.body.classList.add(this.REDUCED_MOTION_CLASS);
    } else {
      this.document.body.classList.remove(this.REDUCED_MOTION_CLASS);
    }

    this.reducedMotionSubject.next(enabled);
    this.savePreference('reducedMotion', enabled);
  }

  getReducedMotion(): Observable<boolean> {
    return this.reducedMotionSubject.asObservable();
  }

  // Large Text
  toggleLargeText(): void {
    const currentValue = this.largeTextSubject.value;
    this.setLargeText(!currentValue);
  }

  setLargeText(enabled: boolean): void {
    if (enabled) {
      this.document.body.classList.add(this.LARGE_TEXT_CLASS);
    } else {
      this.document.body.classList.remove(this.LARGE_TEXT_CLASS);
    }

    this.largeTextSubject.next(enabled);
    this.savePreference('largeText', enabled);
  }

  getLargeText(): Observable<boolean> {
    return this.largeTextSubject.asObservable();
  }

  // Screen Reader Mode
  toggleScreenReaderMode(): void {
    const currentValue = this.screenReaderSubject.value;
    this.setScreenReaderMode(!currentValue);
  }

  setScreenReaderMode(enabled: boolean): void {
    if (enabled) {
      this.document.body.classList.add(this.SCREEN_READER_CLASS);
    } else {
      this.document.body.classList.remove(this.SCREEN_READER_CLASS);
    }

    this.screenReaderSubject.next(enabled);
    this.savePreference('screenReader', enabled);
  }

  getScreenReaderMode(): Observable<boolean> {
    return this.screenReaderSubject.asObservable();
  }

  // Focus Management
  trapFocus(element: HTMLElement): void {
    const focusableElements = this.getFocusableElements(element);
    if (focusableElements.length === 0) return;

    // Set initial focus
    focusableElements[0].focus();

    // Handle keyboard navigation
    element.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

      if (event.shiftKey) {
        // Shift + Tab
        if (currentIndex <= 0) {
          focusableElements[focusableElements.length - 1].focus();
          event.preventDefault();
        }
      } else {
        // Tab
        if (currentIndex === focusableElements.length - 1) {
          focusableElements[0].focus();
          event.preventDefault();
        }
      }
    });
  }

  getFocusableElements(element: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]:not([tabindex="-1"])'
    ];

    return Array.from(element.querySelectorAll(focusableSelectors.join(',')))
      .filter(el => {
        const style = window.getComputedStyle(el as HTMLElement);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }) as HTMLElement[];
  }

  // Live Announcements
  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    const liveRegion = this.document.getElementById('accessibility-live-region');
    if (!liveRegion) {
      this.createLiveRegion();
    }

    const region = this.document.getElementById('accessibility-live-region')!;
    region.setAttribute('aria-live', politeness);
    region.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      region.textContent = '';
    }, 1000);
  }

  private createLiveRegion(): void {
    const liveRegion = this.document.createElement('div');
    liveRegion.id = 'accessibility-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.margin = '-1px';
    liveRegion.style.padding = '0';
    liveRegion.style.overflow = 'hidden';
    liveRegion.style.clip = 'rect(0, 0, 0, 0)';
    liveRegion.style.border = '0';

    this.document.body.appendChild(liveRegion);
  }

  // Keyboard Navigation
  setupKeyboardNavigation(): void {
    this.document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Skip if not in screen reader mode
      if (!this.screenReaderSubject.value) return;

      // Handle skip links
      if (event.key === 'Tab' && event.shiftKey === false) {
        const skipLink = this.document.getElementById('skip-to-content');
        if (skipLink && document.activeElement === this.document.body) {
          skipLink.focus();
          event.preventDefault();
        }
      }

      // Handle escape key for modals
      if (event.key === 'Escape') {
        const activeModal = this.document.querySelector('.modal[aria-hidden="false"]');
        if (activeModal) {
          const closeButton = activeModal.querySelector('[aria-label="Close"]');
          if (closeButton) {
            (closeButton as HTMLElement).click();
            event.preventDefault();
          }
        }
      }
    });
  }

  // Color Contrast Checker
  checkColorContrast(foreground: string, background: string): { ratio: number; passes: boolean } {
    const fgColor = this.parseColor(foreground);
    const bgColor = this.parseColor(background);

    if (!fgColor || !bgColor) {
      return { ratio: 1, passes: false };
    }

    const fgLuminance = this.calculateLuminance(fgColor);
    const bgLuminance = this.calculateLuminance(bgColor);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    const ratio = (lighter + 0.05) / (darker + 0.05);

    // WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
    const passes = ratio >= 7;

    return { ratio, passes };
  }

  private parseColor(color: string): { r: number; g: number; b: number } | null {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return { r, g, b };
      } else if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b };
      }
    }

    // Handle rgb/rgba colors
    const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*\d+\.?\d*)?\)$/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10)
      };
    }

    // Handle named colors
    const tempDiv = this.document.createElement('div');
    tempDiv.style.color = color;
    this.document.body.appendChild(tempDiv);
    const computedColor = getComputedStyle(tempDiv).color;
    this.document.body.removeChild(tempDiv);

    return this.parseColor(computedColor);
  }

  private calculateLuminance(color: { r: number; g: number; b: number }): number {
    const { r, g, b } = color;

    const sRGB = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  // Save and load preferences
  private savePreference(key: string, value: boolean): void {
    try {
      localStorage.setItem(`accessibility.${key}`, value.toString());
    } catch (e) {
      console.error('Error saving accessibility preference:', e);
    }
  }

  private loadPreferences(): void {
    try {
      const highContrast = localStorage.getItem('accessibility.highContrast') === 'true';
      const reducedMotion = localStorage.getItem('accessibility.reducedMotion') === 'true';
      const largeText = localStorage.getItem('accessibility.largeText') === 'true';
      const screenReader = localStorage.getItem('accessibility.screenReader') === 'true';

      if (highContrast) this.setHighContrast(true);
      if (reducedMotion) this.setReducedMotion(true);
      if (largeText) this.setLargeText(true);
      if (screenReader) this.setScreenReaderMode(true);
    } catch (e) {
      console.error('Error loading accessibility preferences:', e);
    }
  }

  // Initialize accessibility features
  initialize(): void {
    this.setupKeyboardNavigation();
    this.createLiveRegion();

    // Add skip link
    this.addSkipLink();

    // Set up focus styles
    this.setupFocusStyles();

    // Check for system preferences
    this.checkSystemPreferences();
  }

  private addSkipLink(): void {
    const skipLink = this.document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.id = 'skip-to-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('aria-label', 'Skip to main content');

    this.document.body.insertBefore(skipLink, this.document.body.firstChild);
  }

  private setupFocusStyles(): void {
    const style = this.document.createElement('style');
    style.textContent = `
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: #000;
        color: #fff;
        padding: 8px;
        z-index: 100;
        transition: top 0.3s;
      }

      .skip-link:focus {
        top: 0;
      }

      :focus {
        outline: 3px solid #005fcc;
        outline-offset: 2px;
      }

      .high-contrast :focus {
        outline: 3px solid #ffff00;
      }

      .screen-reader-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .screen-reader-mode .screen-reader-only {
        position: static;
        width: auto;
        height: auto;
        padding: 0;
        margin: 0;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }
    `;

    this.document.head.appendChild(style);
  }

  private checkSystemPreferences(): void {
    // Check for high contrast preference
    const highContrastMedia = window.matchMedia('(prefers-contrast: more)');
    if (highContrastMedia.matches) {
      this.setHighContrast(true);
    }

    // Check for reduced motion preference
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotionMedia.matches) {
      this.setReducedMotion(true);
    }

    // Listen for changes
    highContrastMedia.addEventListener('change', (e) => {
      this.setHighContrast(e.matches);
    });

    reducedMotionMedia.addEventListener('change', (e) => {
      this.setReducedMotion(e.matches);
    });
  }
}
```

---

## Advanced Search and Filtering

### ElasticSearch Integration

```typescript
// elasticsearch.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { IndicesCreateRequest, SearchRequest, SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { Invoice } from '../invoice/invoice.entity';
import { Customer } from '../customer/customer.entity';
import { Payment } from '../payment/payment.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ElasticsearchService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly INDEX_PREFIX = 'billing_';
  private client: Client;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private redisService: RedisService
  ) {
    this.initializeClient();
  }

  private initializeClient(): void {
    const node = this.configService.get('ELASTICSEARCH_NODE');
    const username = this.configService.get('ELASTICSEARCH_USERNAME');
    const password = this.configService.get('ELASTICSEARCH_PASSWORD');
    const caFingerprint = this.configService.get('ELASTICSEARCH_CA_FINGERPRINT');

    this.client = new Client({
      node,
      auth: {
        username,
        password
      },
      tls: {
        caFingerprint,
        rejectUnauthorized: true
      },
      maxRetries: 3,
      requestTimeout: 30000,
      sniffOnStart: true,
      sniffOnConnectionFault: true
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.checkConnection();
      await this.setupIndices();
      this.setupEventListeners();
      this.logger.log('Elasticsearch service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch service', error.stack);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.close();
      this.logger.log('Elasticsearch client closed');
    } catch (error) {
      this.logger.error('Error closing Elasticsearch client', error.stack);
    }
  }

  private async checkConnection(): Promise<void> {
    try {
      const { body } = await this.client.info();
      this.logger.log(`Connected to Elasticsearch cluster: ${body.cluster_name}`);
    } catch (error) {
      this.logger.error('Elasticsearch connection failed', error.stack);
      throw error;
    }
  }

  private async setupIndices(): Promise<void> {
    try {
      // Define index mappings
      const indices: Record<string, IndicesCreateRequest> = {
        invoices: this.getInvoiceIndexConfig(),
        customers: this.getCustomerIndexConfig(),
        payments: this.getPaymentIndexConfig()
      };

      // Create indices if they don't exist
      for (const [indexName, config] of Object.entries(indices)) {
        const fullIndexName = this.getIndexName(indexName);
        const exists = await this.client.indices.exists({ index: fullIndexName });

        if (!exists.body) {
          await this.client.indices.create(config);
          this.logger.log(`Created index: ${fullIndexName}`);
        } else {
          this.logger.log(`Index already exists: ${fullIndexName}`);
        }
      }
    } catch (error) {
      this.logger.error('Error setting up Elasticsearch indices', error.stack);
      throw error;
    }
  }

  private getIndexName(entity: string): string {
    return `${this.INDEX_PREFIX}${entity}`;
  }

  private getInvoiceIndexConfig(): IndicesCreateRequest {
    return {
      index: this.getIndexName('invoices'),
      body: {
        settings: {
          analysis: {
            analyzer: {
              autocomplete: {
                tokenizer: 'autocomplete',
                filter: ['lowercase']
              },
              autocomplete_search: {
                tokenizer: 'lowercase'
              }
            },
            tokenizer: {
              autocomplete: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 10,
                token_chars: ['letter', 'digit']
              }
            }
          },
          number_of_shards: 3,
          number_of_replicas: 1
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            invoiceNumber: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
                autocomplete: {
                  type: 'text',
                  analyzer: 'autocomplete',
                  search_analyzer: 'autocomplete_search'
                }
              }
            },
            customerId: { type: 'keyword' },
            customerName: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
                autocomplete: {
                  type: 'text',
                  analyzer: 'autocomplete',
                  search_analyzer: 'autocomplete_search'
                }
              }
            },
            customerEmail: { type: 'keyword' },
            issueDate: { type: 'date' },
            dueDate: { type: 'date' },
            status: { type: 'keyword' },
            totalAmount: { type: 'double' },
            amountPaid: { type: 'double' },
            amountDue: { type: 'double' },
            currency: { type: 'keyword' },
            reference: { type: 'text' },
            lineItems: {
              type: 'nested',
              properties: {
                id: { type: 'keyword' },
                description: { type: 'text' },
                quantity: { type: 'integer' },
                unitPrice: { type: 'double' },
                totalPrice: { type: 'double' },
                productId: { type: 'keyword' },
                productName: { type: 'text' }
              }
            },
            taxes: {
              type: 'nested',
              properties: {
                id: { type: 'keyword' },
                name: { type: 'text' },
                amount: { type: 'double' },
                rate: { type: 'double' }
              }
            },
            discounts: {
              type: 'nested',
              properties: {
                id: { type: 'keyword' },
                name: { type: 'text' },
                amount: { type: 'double' },
                code: {