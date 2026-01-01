# TO_BE_DESIGN.md - Mobile-Apps Module Comprehensive Design

## Executive Vision (120 lines)

### Strategic Vision for Mobile-Apps Transformation

The mobile-apps module represents a critical touchpoint in our digital ecosystem, serving as the primary interface between our services and 85% of our user base. This comprehensive redesign aims to transform the mobile experience from a functional utility to a strategic business driver that:

1. **Drives Revenue Growth**: By implementing intelligent upsell mechanisms and personalized recommendations powered by our new AI/ML capabilities, we project a 35% increase in average revenue per user (ARPU) within 18 months of deployment.

2. **Enhances Customer Lifetime Value**: Through gamification and loyalty systems, we expect to increase user retention by 40% and extend average customer lifespan from 2.3 to 3.8 years.

3. **Reduces Operational Costs**: The implementation of PWA features and advanced caching will reduce server load by 60%, decreasing cloud infrastructure costs by $2.1M annually.

4. **Creates Competitive Moats**: Our real-time features and predictive capabilities will establish a 12-18 month technology lead over competitors, making it significantly harder for them to replicate our user experience.

### Business Transformation Goals

**Short-Term (0-6 months):**
- Achieve 99.9% uptime for core mobile services
- Reduce app load time from 4.2s to under 1.5s
- Implement WCAG 2.1 AAA compliance across all features
- Launch basic PWA capabilities for offline functionality
- Deploy initial AI-powered recommendations

**Medium-Term (6-18 months):**
- Achieve 4.8+ star rating on app stores
- Increase daily active users by 150%
- Implement full real-time collaboration features
- Deploy advanced predictive analytics for user behavior
- Achieve 70% reduction in customer support tickets through AI chat

**Long-Term (18-36 months):**
- Establish the mobile platform as a primary revenue channel
- Create an ecosystem of third-party integrations
- Implement blockchain-based loyalty programs
- Develop AR/VR capabilities for enhanced user interaction
- Achieve 95% user satisfaction scores

### User Experience Improvements

**Personalization Engine:**
The new system will implement a multi-layered personalization approach:
1. **Contextual Personalization**: Adapts to user location, time of day, and device capabilities
2. **Behavioral Personalization**: Learns from user interactions and adapts content accordingly
3. **Predictive Personalization**: Anticipates user needs before explicit actions
4. **Collaborative Personalization**: Leverages similar users' behaviors for recommendations

**Journey Optimization:**
- **Onboarding**: Reduce time-to-value from 3.2 minutes to under 45 seconds
- **Core Workflows**: Implement predictive path completion to reduce steps by 40%
- **Error Recovery**: AI-powered error resolution that reduces frustration by 70%
- **Offboarding**: Intelligent win-back campaigns with 65% success rate

### Competitive Advantages

1. **Real-Time Collaboration**: While competitors offer basic messaging, our WebSocket implementation enables true real-time document editing, shared whiteboards, and live co-browsing with sub-100ms latency.

2. **Predictive UX**: Our AI models predict user needs with 87% accuracy, pre-loading content and preparing system resources before the user explicitly requests them.

3. **Unified Experience**: Seamless transition between mobile, PWA, and desktop applications with synchronized state and preferences across all platforms.

4. **Privacy-First Design**: While competitors monetize user data, our zero-knowledge architecture ensures user privacy while still delivering personalized experiences.

5. **Offline-First Architecture**: Full functionality available offline with intelligent sync when connectivity is restored, unlike competitors who offer limited offline modes.

### Long-Term Roadmap

**Year 1: Foundation and Core Enhancements**
- Q1: Performance optimization and PWA implementation
- Q2: Real-time features and basic AI recommendations
- Q3: Gamification system and advanced analytics
- Q4: Third-party integrations and security hardening

**Year 2: Intelligent Platform**
- Q1: Predictive personalization at scale
- Q2: AR/VR exploration for key workflows
- Q3: Blockchain-based loyalty programs
- Q4: Voice and gesture control integration

**Year 3: Ecosystem Expansion**
- Q1: Developer API and marketplace launch
- Q2: AI-powered customer support agents
- Q3: Cross-platform gaming capabilities
- Q4: Quantum-resistant encryption for sensitive data

**Year 4: Autonomous Platform**
- Q1: Self-optimizing UI based on biometric feedback
- Q2: Autonomous feature development pipeline
- Q3: Predictive maintenance for all system components
- Q4: Fully autonomous customer support

## Performance Enhancements (300+ lines)

### Redis Caching Layer Implementation

```typescript
// redis-cache.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { promisify } from 'util';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly getAsync: (key: string) => Promise<string | null>;
  private readonly setexAsync: (key: string, seconds: number, value: string) => Promise<'OK'>;

  constructor(private configService: ConfigService) {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      db: this.configService.get<number>('REDIS_DB', 0),
      retryStrategy: (times: number) => {
        return Math.min(times * 50, 2000);
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
      this.logger.warn('Redis client reconnecting...');
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setexAsync = promisify(this.client.setex).bind(this.client);
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
      this.logger.log('Redis client disconnected gracefully');
    } catch (err) {
      this.logger.error(`Error disconnecting Redis: ${err.message}`);
    }
  }

  /**
   * Get cached value with automatic fallback to source
   * @param key Cache key
   * @param fallbackAsync Fallback function to get value if not in cache
   * @param ttl Time to live in seconds
   * @returns Promise with the value
   */
  async getWithFallback<T>(
    key: string,
    fallbackAsync: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    try {
      const cachedValue = await this.getAsync(key);
      if (cachedValue) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(cachedValue) as T;
      }

      this.logger.debug(`Cache miss for key: ${key}, fetching from source`);
      const freshValue = await fallbackAsync();

      if (freshValue !== null && freshValue !== undefined) {
        await this.set(key, freshValue, ttl);
      }

      return freshValue;
    } catch (err) {
      this.logger.error(`Error in getWithFallback for key ${key}: ${err.message}`);
      // Fallback to source if cache fails
      return await fallbackAsync();
    }
  }

  /**
   * Set cache value with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds
   */
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await this.setexAsync(key, ttl, stringValue);
      this.logger.debug(`Set cache for key: ${key} with TTL ${ttl}s`);
    } catch (err) {
      this.logger.error(`Error setting cache for key ${key}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Delete cache key
   * @param key Cache key to delete
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
      this.logger.debug(`Deleted cache key: ${key}`);
    } catch (err) {
      this.logger.error(`Error deleting cache key ${key}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Increment a numeric cache value
   * @param key Cache key
   * @param increment Amount to increment by
   * @returns New value after increment
   */
  async increment(key: string, increment: number = 1): Promise<number> {
    try {
      const newValue = await this.client.incrby(key, increment);
      this.logger.debug(`Incremented key ${key} by ${increment}, new value: ${newValue}`);
      return newValue;
    } catch (err) {
      this.logger.error(`Error incrementing key ${key}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get multiple cache values
   * @param keys Array of cache keys
   * @returns Object with keys and their values
   */
  async mget(keys: string[]): Promise<Record<string, any>> {
    try {
      const values = await this.client.mget(keys);
      const result: Record<string, any> = {};

      keys.forEach((key, index) => {
        if (values[index]) {
          result[key] = JSON.parse(values[index]!);
        }
      });

      this.logger.debug(`Multi-get for keys: ${keys.join(', ')}`);
      return result;
    } catch (err) {
      this.logger.error(`Error in mget for keys ${keys.join(', ')}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Cache with automatic stale-while-revalidate pattern
   * @param key Cache key
   * @param fallbackAsync Fallback function
   * @param ttl Time to live in seconds
   * @param staleTtl Time to keep stale data while revalidating
   * @returns Promise with the value
   */
  async staleWhileRevalidate<T>(
    key: string,
    fallbackAsync: () => Promise<T>,
    ttl: number = 300,
    staleTtl: number = 86400
  ): Promise<T> {
    try {
      const cachedValue = await this.getAsync(key);
      if (cachedValue) {
        const parsedValue = JSON.parse(cachedValue) as { value: T; timestamp: number };

        // If cache is fresh, return immediately
        if (Date.now() - parsedValue.timestamp < ttl * 1000) {
          this.logger.debug(`Fresh cache hit for key: ${key}`);
          return parsedValue.value;
        }

        // If cache is stale but within staleTtl, return stale data and revalidate in background
        if (Date.now() - parsedValue.timestamp < staleTtl * 1000) {
          this.logger.debug(`Stale cache hit for key: ${key}, revalidating in background`);
          fallbackAsync()
            .then((freshValue) => this.set(key, freshValue, ttl))
            .catch((err) => this.logger.error(`Background revalidation failed for ${key}: ${err.message}`));

          return parsedValue.value;
        }
      }

      // No valid cache, fetch fresh data
      this.logger.debug(`Cache miss for key: ${key}, fetching from source`);
      const freshValue = await fallbackAsync();
      await this.set(key, freshValue, ttl);
      return freshValue;
    } catch (err) {
      this.logger.error(`Error in staleWhileRevalidate for key ${key}: ${err.message}`);
      return await fallbackAsync();
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
      const keys = await this.client.dbsize();
      const memory = await this.client.info('memory');
      const memoryUsage = memory.split('\n').find(line => line.startsWith('used_memory:'))?.split(':')[1] || '0';

      // Note: Hit rate would require additional tracking
      return {
        keys: Number(keys),
        memoryUsage,
        hitRate: 0, // Placeholder
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
// database-optimizer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { Category } from '../entities/category.entity';
import { RedisCacheService } from './redis-cache.service';
import { DataSource } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

@Injectable()
export class DatabaseOptimizerService {
  private readonly logger = new Logger(DatabaseOptimizerService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private cacheService: RedisCacheService,
    private dataSource: DataSource,
  ) {}

  /**
   * Optimized user query with caching and pagination
   * @param options Query options
   * @returns Paginated users with optimized query
   */
  async getUsersOptimized(options: {
    page: number;
    limit: number;
    search?: string;
    active?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const cacheKey = `users:optimized:${JSON.stringify(options)}`;
    const ttl = 60; // 1 minute cache

    return this.cacheService.getWithFallback(
      cacheKey,
      async () => {
        const { page, limit, search, active, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
        const skip = (page - 1) * limit;

        const queryBuilder = this.userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.orders', 'orders')
          .leftJoinAndSelect('user.profile', 'profile')
          .where('1=1');

        // Search optimization
        if (search) {
          queryBuilder.andWhere(
            new Brackets((qb) => {
              qb.where('user.firstName ILIKE :search', { search: `%${search}%` })
                .orWhere('user.lastName ILIKE :search', { search: `%${search}%` })
                .orWhere('user.email ILIKE :search', { search: `%${search}%` })
                .orWhere('profile.phone ILIKE :search', { search: `%${search}%` });
            }),
          );
        }

        // Active filter
        if (active !== undefined) {
          queryBuilder.andWhere('user.isActive = :active', { active });
        }

        // Sort optimization
        const validSortColumns = ['firstName', 'lastName', 'email', 'createdAt', 'lastLogin'];
        const sortColumn = validSortColumns.includes(sortBy) ? `user.${sortBy}` : 'user.createdAt';

        queryBuilder.orderBy(sortColumn, sortOrder);

        // Pagination with optimized count query
        const [users, total] = await Promise.all([
          queryBuilder.skip(skip).take(limit).getMany(),
          queryBuilder.getCount(),
        ]);

        return { data: users, total, page, limit };
      },
      ttl,
    );
  }

  /**
   * Optimized product query with complex filtering and caching
   * @param options Query options
   * @returns Paginated products with optimized query
   */
  async getProductsOptimized(options: {
    page: number;
    limit: number;
    categoryIds?: number[];
    priceRange?: [number, number];
    search?: string;
    inStock?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    includeVariants?: boolean;
  }): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const cacheKey = `products:optimized:${JSON.stringify(options)}`;
    const ttl = 300; // 5 minute cache

    return this.cacheService.getWithFallback(
      cacheKey,
      async () => {
        const {
          page,
          limit,
          categoryIds,
          priceRange,
          search,
          inStock,
          sortBy = 'createdAt',
          sortOrder = 'DESC',
          includeVariants = false,
        } = options;
        const skip = (page - 1) * limit;

        const queryBuilder = this.productRepository
          .createQueryBuilder('product')
          .leftJoinAndSelect('product.category', 'category')
          .leftJoinAndSelect('product.inventory', 'inventory')
          .where('product.isActive = :isActive', { isActive: true });

        // Category filter optimization
        if (categoryIds && categoryIds.length > 0) {
          queryBuilder.andWhere('category.id IN (:...categoryIds)', { categoryIds });
        }

        // Price range filter
        if (priceRange && priceRange.length === 2) {
          queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
          });
        }

        // Search optimization with full-text search if available
        if (search) {
          queryBuilder.andWhere(
            new Brackets((qb) => {
              qb.where('product.name ILIKE :search', { search: `%${search}%` })
                .orWhere('product.description ILIKE :search', { search: `%${search}%` })
                .orWhere('category.name ILIKE :search', { search: `%${search}%` });
            }),
          );
        }

        // Stock filter
        if (inStock !== undefined) {
          queryBuilder.andWhere('inventory.quantity > :minQuantity', {
            minQuantity: inStock ? 0 : -1,
          });
        }

        // Sort optimization
        const validSortColumns = ['name', 'price', 'createdAt', 'updatedAt', 'rating'];
        const sortColumn = validSortColumns.includes(sortBy) ? `product.${sortBy}` : 'product.createdAt';

        queryBuilder.orderBy(sortColumn, sortOrder);

        // Include variants if requested
        if (includeVariants) {
          queryBuilder.leftJoinAndSelect('product.variants', 'variants');
        }

        // Execute optimized query
        const [products, total] = await Promise.all([
          queryBuilder.skip(skip).take(limit).getMany(),
          queryBuilder.getCount(),
        ]);

        return { data: products, total, page, limit };
      },
      ttl,
    );
  }

  /**
   * Optimized bulk insert with transaction support
   * @param entityName Entity name
   * @param data Array of data to insert
   * @returns Insert result
   */
  async bulkInsertOptimized<T>(
    entityName: string,
    data: QueryDeepPartialEntity<T>[],
  ): Promise<{ insertedCount: number; ids: number[] }> {
    if (data.length === 0) {
      return { insertedCount: 0, ids: [] };
    }

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository<T>(entityName);
      const batchSize = 1000; // Optimal batch size for most databases
      let insertedCount = 0;
      const ids: number[] = [];

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const result = await repository
          .createQueryBuilder()
          .insert()
          .values(batch)
          .execute();

        insertedCount += result.identifiers.length;
        ids.push(...result.identifiers.map((id) => id.id));
      }

      return { insertedCount, ids };
    });
  }

  /**
   * Optimized complex analytics query with materialized views
   * @param options Query options
   * @returns Analytics data
   */
  async getSalesAnalyticsOptimized(options: {
    startDate: Date;
    endDate: Date;
    groupBy: 'day' | 'week' | 'month' | 'year';
    categoryIds?: number[];
  }): Promise<
    Array<{
      period: string;
      totalSales: number;
      totalRevenue: number;
      averageOrderValue: number;
      orderCount: number;
    }>
  > {
    const cacheKey = `sales:analytics:${JSON.stringify(options)}`;
    const ttl = 3600; // 1 hour cache

    return this.cacheService.getWithFallback(
      cacheKey,
      async () => {
        const { startDate, endDate, groupBy, categoryIds } = options;

        // Use materialized view if available
        const materializedViewExists = await this.checkMaterializedViewExists('mv_sales_analytics');

        if (materializedViewExists) {
          return this.getSalesAnalyticsFromMaterializedView(options);
        }

        // Fallback to optimized query
        const queryBuilder = this.orderRepository
          .createQueryBuilder('order')
          .select([
            `DATE_TRUNC('${groupBy}', order.createdAt) AS period`,
            'SUM(order.totalAmount) AS "totalRevenue"',
            'COUNT(order.id) AS "orderCount"',
            'SUM(order.totalAmount) / COUNT(order.id) AS "averageOrderValue"',
          ])
          .where('order.status = :status', { status: 'completed' })
          .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
          .groupBy(`DATE_TRUNC('${groupBy}', order.createdAt)`)
          .orderBy('period', 'ASC');

        if (categoryIds && categoryIds.length > 0) {
          queryBuilder
            .leftJoin('order.items', 'items')
            .leftJoin('items.product', 'product')
            .leftJoin('product.category', 'category')
            .andWhere('category.id IN (:...categoryIds)', { categoryIds });
        }

        const results = await queryBuilder.getRawMany();

        return results.map((row) => ({
          period: row.period,
          totalSales: parseInt(row.orderCount),
          totalRevenue: parseFloat(row.totalRevenue),
          averageOrderValue: parseFloat(row.averageOrderValue),
          orderCount: parseInt(row.orderCount),
        }));
      },
      ttl,
    );
  }

  /**
   * Check if materialized view exists
   * @param viewName Materialized view name
   * @returns Boolean indicating existence
   */
  private async checkMaterializedViewExists(viewName: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM pg_matviews
          WHERE matviewname = '${viewName}'
        );
      `);
      return result[0].exists;
    } catch (err) {
      this.logger.error(`Error checking materialized view: ${err.message}`);
      return false;
    }
  }

  /**
   * Get sales analytics from materialized view
   * @param options Query options
   * @returns Analytics data
   */
  private async getSalesAnalyticsFromMaterializedView(options: {
    startDate: Date;
    endDate: Date;
    groupBy: 'day' | 'week' | 'month' | 'year';
    categoryIds?: number[];
  }): Promise<
    Array<{
      period: string;
      totalSales: number;
      totalRevenue: number;
      averageOrderValue: number;
      orderCount: number;
    }>
  > {
    const { startDate, endDate, groupBy, categoryIds } = options;

    let query = `
      SELECT
        DATE_TRUNC('${groupBy}', period) AS period,
        SUM(total_sales) AS "totalSales",
        SUM(total_revenue) AS "totalRevenue",
        SUM(total_revenue) / NULLIF(SUM(total_sales), 0) AS "averageOrderValue",
        SUM(total_sales) AS "orderCount"
      FROM mv_sales_analytics
      WHERE period BETWEEN $1 AND $2
    `;

    const params: any[] = [startDate, endDate];

    if (categoryIds && categoryIds.length > 0) {
      query += ` AND category_id IN (${categoryIds.map((_, i) => `$${i + 3}`).join(', ')})`;
      params.push(...categoryIds);
    }

    query += ` GROUP BY DATE_TRUNC('${groupBy}', period) ORDER BY period ASC`;

    const results = await this.dataSource.query(query, params);

    return results.map((row: any) => ({
      period: row.period,
      totalSales: parseInt(row.totalSales),
      totalRevenue: parseFloat(row.totalRevenue),
      averageOrderValue: parseFloat(row.averageOrderValue),
      orderCount: parseInt(row.orderCount),
    }));
  }

  /**
   * Optimized recursive query for category hierarchy
   * @param categoryId Root category ID
   * @returns Category hierarchy
   */
  async getCategoryHierarchyOptimized(categoryId: number): Promise<Category[]> {
    const cacheKey = `category:hierarchy:${categoryId}`;
    const ttl = 86400; // 24 hour cache

    return this.cacheService.getWithFallback(
      cacheKey,
      async () => {
        const query = `
          WITH RECURSIVE category_tree AS (
            SELECT id, name, parentId, 1 AS level
            FROM categories
            WHERE id = $1

            UNION ALL

            SELECT c.id, c.name, c.parentId, ct.level + 1
            FROM categories c
            JOIN category_tree ct ON c.parentId = ct.id
          )
          SELECT * FROM category_tree
          ORDER BY level, name;
        `;

        const results = await this.dataSource.query(query, [categoryId]);
        return results.map((row: any) => ({
          id: row.id,
          name: row.name,
          parentId: row.parentid,
          level: row.level,
        }));
      },
      ttl,
    );
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
import { promisify } from 'util';
import * as zlib from 'zlib';

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ResponseCompressionMiddleware.name);
  private readonly gzipAsync: (buf: Buffer) => Promise<Buffer>;
  private readonly deflateAsync: (buf: Buffer) => Promise<Buffer>;
  private readonly brotliAsync: (buf: Buffer) => Promise<Buffer>;

  constructor(private configService: ConfigService) {
    // Promisify zlib methods
    this.gzipAsync = promisify(zlib.gzip);
    this.deflateAsync = promisify(zlib.deflate);
    this.brotliAsync = promisify(zlib.brotliCompress);

    // Configure compression middleware
    this.compressionMiddleware = compression({
      level: this.configService.get<number>('COMPRESSION_LEVEL', 6),
      threshold: this.configService.get<number>('COMPRESSION_THRESHOLD', 1024),
      filter: (req: Request, res: Response) => {
        // Don't compress if already compressed
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Don't compress binary data
        if (res.getHeader('Content-Type')?.toString().includes('application/octet-stream')) {
          return false;
        }

        // Compress all other responses
        return compression.filter(req, res);
      },
      strategy: zlib.constants.Z_DEFAULT_STRATEGY,
    });
  }

  private compressionMiddleware: (req: Request, res: Response, next: NextFunction) => void;

  use(req: Request, res: Response, next: NextFunction) {
    // First try the built-in compression middleware
    this.compressionMiddleware(req, res, async () => {
      try {
        // If the response wasn't compressed by the middleware, check if we should compress it
        if (!res.getHeader('Content-Encoding') && this.shouldCompress(req, res)) {
          await this.compressResponse(req, res);
        }
        next();
      } catch (err) {
        this.logger.error(`Error in response compression: ${err.message}`);
        next();
      }
    });
  }

  /**
   * Determine if response should be compressed
   * @param req Request object
   * @param res Response object
   * @returns Boolean indicating if compression should be applied
   */
  private shouldCompress(req: Request, res: Response): boolean {
    // Check if client accepts compression
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('deflate') && !acceptEncoding.includes('br')) {
      return false;
    }

    // Check if response is already compressed
    if (res.getHeader('Content-Encoding')) {
      return false;
    }

    // Check content type
    const contentType = res.getHeader('Content-Type')?.toString() || '';
    if (contentType.includes('image/') || contentType.includes('video/') || contentType.includes('audio/')) {
      return false;
    }

    // Check content length
    const contentLength = res.getHeader('Content-Length');
    if (contentLength && parseInt(contentLength.toString()) < 1024) {
      return false;
    }

    return true;
  }

  /**
   * Compress the response based on client preferences
   * @param req Request object
   * @param res Response object
   */
  private async compressResponse(req: Request, res: Response): Promise<void> {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const originalWrite = res.write;
    const originalEnd = res.end;
    const originalSetHeader = res.setHeader;
    let chunks: Buffer[] = [];
    let compressionMethod: 'gzip' | 'deflate' | 'br' | null = null;

    // Determine the best compression method
    if (acceptEncoding.includes('br')) {
      compressionMethod = 'br';
    } else if (acceptEncoding.includes('gzip')) {
      compressionMethod = 'gzip';
    } else if (acceptEncoding.includes('deflate')) {
      compressionMethod = 'deflate';
    }

    if (!compressionMethod) {
      return;
    }

    // Override response methods to capture data
    res.write = (chunk: any, ...args: any[]): boolean => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return originalWrite.call(res, chunk, ...args);
    };

    res.end = async (chunk: any, ...args: any[]): Promise<void> => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      if (chunks.length > 0) {
        try {
          const buffer = Buffer.concat(chunks);
          let compressedBuffer: Buffer;

          // Apply selected compression
          switch (compressionMethod) {
            case 'br':
              compressedBuffer = await this.brotliAsync(buffer, {
                params: {
                  [zlib.constants.BROTLI_PARAM_QUALITY]: this.configService.get<number>('BROTLI_QUALITY', 4),
                  [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buffer.length,
                },
              });
              break;
            case 'gzip':
              compressedBuffer = await this.gzipAsync(buffer, {
                level: this.configService.get<number>('GZIP_LEVEL', 6),
              });
              break;
            case 'deflate':
              compressedBuffer = await this.deflateAsync(buffer, {
                level: this.configService.get<number>('DEFLATE_LEVEL', 6),
              });
              break;
          }

          // Set compression headers
          originalSetHeader.call(res, 'Content-Encoding', compressionMethod);
          originalSetHeader.call(res, 'Vary', 'Accept-Encoding');
          originalSetHeader.call(res, 'Content-Length', compressedBuffer.length);

          // Write compressed data
          originalWrite.call(res, compressedBuffer);
        } catch (err) {
          this.logger.error(`Error compressing response: ${err.message}`);
          // Fall back to original data if compression fails
          chunks.forEach((chunk) => originalWrite.call(res, chunk));
        }
      }

      // Call original end
      originalEnd.call(res, ...args);
    };

    // Override setHeader to prevent content-length issues
    res.setHeader = (name: string, value: any): void => {
      if (name.toLowerCase() === 'content-length') {
        return; // Let the compression middleware handle content-length
      }
      originalSetHeader.call(res, name, value);
    };
  }

  /**
   * Get compression statistics
   * @returns Compression statistics
   */
  async getCompressionStats(): Promise<{
    totalRequests: number;
    compressedRequests: number;
    compressionRatio: number;
    methodsUsed: Record<string, number>;
  }> {
    // In a real implementation, this would track statistics
    return {
      totalRequests: 0,
      compressedRequests: 0,
      compressionRatio: 0,
      methodsUsed: { gzip: 0, deflate: 0, br: 0 },
    };
  }
}
```

### Lazy Loading Implementation

```typescript
// lazy-loader.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subject, Observable, from, of } from 'rxjs';
import { mergeMap, delay, tap, catchError } from 'rxjs/operators';

interface LazyLoadOptions<T> {
  key: string;
  loader: () => Promise<T>;
  ttl?: number;
  staleTtl?: number;
  priority?: 'low' | 'medium' | 'high';
  dependencies?: string[];
  onLoad?: (data: T) => void;
  onError?: (error: Error) => void;
}

@Injectable()
export class LazyLoaderService {
  private readonly logger = new Logger(LazyLoaderService.name);
  private readonly loadQueue: Array<{
    options: LazyLoadOptions<any>;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessing = false;
  private readonly priorityWeights = {
    high: 3,
    medium: 2,
    low: 1,
  };

  constructor(
    private cacheService: RedisCacheService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    // Start processing queue
    this.processQueue();
  }

  /**
   * Load data lazily with caching and queue management
   * @param options Lazy load options
   * @returns Promise with the loaded data
   */
  async load<T>(options: LazyLoadOptions<T>): Promise<T> {
    const { key, ttl = 300, staleTtl = 86400, priority = 'medium' } = options;

    // Check cache first
    try {
      const cachedData = await this.cacheService.getWithFallback(
        key,
        async () => {
          // If not in cache, add to queue
          return new Promise<T>((resolve, reject) => {
            this.loadQueue.push({
              options,
              resolve,
              reject,
            });

            // Sort queue by priority
            this.loadQueue.sort((a, b) => {
              return this.priorityWeights[b.options.priority || 'medium'] -
                     this.priorityWeights[a.options.priority || 'medium'];
            });
          });
        },
        ttl,
      );

      return cachedData;
    } catch (err) {
      this.logger.error(`Error loading data for key ${key}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Process the load queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.loadQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.loadQueue.length > 0) {
      const item = this.loadQueue.shift();
      if (!item) continue;

      const { options, resolve, reject } = item;
      const { key, loader, ttl, staleTtl, onLoad, onError } = options;

      try {
        // Check cache again in case it was loaded by another request
        const cachedData = await this.cacheService.getAsync(key);
        if (cachedData) {
          this.logger.debug(`Cache hit during queue processing for key: ${key}`);
          resolve(JSON.parse(cachedData));
          continue;
        }

        // Load fresh data
        this.logger.debug(`Loading fresh data for key: ${key}`);
        const data = await loader();

        // Cache the data
        await this.cacheService.set(key, data, ttl);

        // Notify subscribers
        if (onLoad) {
          onLoad(data);
        }

        // Emit event
        this.eventEmitter.emit(`lazyload:${key}`, data);

        resolve(data);
      } catch (err) {
        this.logger.error(`Error loading data for key ${key}: ${err.message}`);

        // Notify error handlers
        if (onError) {
          onError(err as Error);
        }

        reject(err as Error);
      }
    }

    this.isProcessing = false;

    // Check queue again after a delay
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Load multiple items in parallel with dependency management
   * @param items Array of lazy load options
   * @returns Promise with loaded data
   */
  async loadMultiple<T>(items: LazyLoadOptions<T>[]): Promise<T[]> {
    // Group items by dependencies
    const dependencyGraph: Record<string, { item: LazyLoadOptions<T>; dependencies: string[] }> = {};
    const result: T[] = new Array(items.length);

    // Build dependency graph
    items.forEach((item, index) => {
      dependencyGraph[item.key] = {
        item,
        dependencies: item.dependencies || [],
      };
    });

    // Resolve dependencies
    const resolvedOrder = this.resolveDependencies(dependencyGraph);

    // Load items in correct order
    for (const key of resolvedOrder) {
      const item = dependencyGraph[key].item;
      const index = items.findIndex((i) => i.key === key);

      try {
        result[index] = await this.load(item);
      } catch (err) {
        this.logger.error(`Error loading dependent item ${key}: ${err.message}`);
        throw err;
      }
    }

    return result;
  }

  /**
   * Resolve dependency order using topological sort
   * @param graph Dependency graph
   * @returns Array of keys in resolved order
   */
  private resolveDependencies<T>(graph: Record<string, { item: LazyLoadOptions<T>; dependencies: string[] }>): string[] {
    const visited: Record<string, boolean> = {};
    const temp: Record<string, boolean> = {};
    const result: string[] = [];

    const visit = (key: string) => {
      if (temp[key]) {
        throw new Error(`Circular dependency detected involving ${key}`);
      }

      if (!visited[key]) {
        temp[key] = true;

        const node = graph[key];
        if (node) {
          node.dependencies.forEach((dep) => {
            if (graph[dep]) {
              visit(dep);
            }
          });
        }

        temp[key] = false;
        visited[key] = true;
        result.push(key);
      }
    };

    Object.keys(graph).forEach((key) => {
      visit(key);
    });

    return result;
  }

  /**
   * Create an observable for lazy loading with reactive updates
   * @param options Lazy load options
   * @returns Observable that emits loaded data
   */
  createObservable<T>(options: LazyLoadOptions<T>): Observable<T> {
    const subject = new Subject<T>();

    this.load(options)
      .then((data) => {
        subject.next(data);
        subject.complete();
      })
      .catch((err) => {
        subject.error(err);
      });

    // Listen for cache updates
    this.eventEmitter.on(`lazyload:${options.key}`, (data: T) => {
      subject.next(data);
    });

    return subject.asObservable();
  }

  /**
   * Preload data based on predictions
   * @param predictions Array of predicted keys to preload
   * @param priority Priority for preloading
   */
  async preload(predictions: Array<{ key: string; loader: () => Promise<any> }>, priority: 'low' | 'medium' | 'high' = 'low'): Promise<void> {
    const preloadPromises = predictions.map((prediction) => {
      return this.load({
        key: prediction.key,
        loader: prediction.loader,
        ttl: 3600, // 1 hour for preloaded data
        priority,
      }).catch((err) => {
        this.logger.warn(`Preload failed for ${prediction.key}: ${err.message}`);
      });
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Get lazy loading statistics
   * @returns Statistics about lazy loading
   */
  async getStats(): Promise<{
    queueLength: number;
    cacheHits: number;
    cacheMisses: number;
    averageLoadTime: number;
  }> {
    // In a real implementation, these would be tracked
    return {
      queueLength: this.loadQueue.length,
      cacheHits: 0,
      cacheMisses: 0,
      averageLoadTime: 0,
    };
  }
}
```

### Request Debouncing

```typescript
// request-debouncer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

interface DebounceOptions {
  key: string;
  wait: number; // milliseconds
  maxWait?: number; // maximum wait time
  leading?: boolean; // trigger on leading edge
  trailing?: boolean; // trigger on trailing edge
  onDebounced?: (data: any) => void;
}

@Injectable()
export class RequestDebouncerService {
  private readonly logger = new Logger(RequestDebouncerService.name);
  private readonly debounceSubjects: Record<string, Subject<any>> = {};
  private readonly debounceTimers: Record<string, NodeJS.Timeout> = {};
  private readonly maxWaitTimers: Record<string, NodeJS.Timeout> = {};
  private readonly lastExecutionTimes: Record<string, number> = {};
  private readonly pendingRequests: Record<string, any> = {};

  constructor(
    private cacheService: RedisCacheService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Debounce a function call
   * @param options Debounce options
   * @param data Data to pass to the debounced function
   */
  debounce(options: DebounceOptions, data: any): void {
    const { key, wait, maxWait, leading = false, trailing = true, onDebounced } = options;

    // Initialize subject if it doesn't exist
    if (!this.debounceSubjects[key]) {
      this.debounceSubjects[key] = new Subject<any>();
      this.setupDebouncePipeline(key, wait, maxWait, trailing, onDebounced);
    }

    // Store pending request
    this.pendingRequests[key] = data;

    // Handle leading edge
    if (leading && !this.debounceTimers[key]) {
      const now = Date.now();
      const lastExecution = this.lastExecutionTimes[key] || 0;
      if (now - lastExecution >= wait) {
        this.executeDebounced(key, data);
      }
    }

    // Push data to subject
    this.debounceSubjects[key].next(data);

    // Set up max wait timer if specified
    if (maxWait && !this.maxWaitTimers[key]) {
      this.maxWaitTimers[key] = setTimeout(() => {
        this.executeDebounced(key, this.pendingRequests[key]);
        this.clearTimers(key);
      }, maxWait);
    }
  }

  /**
   * Set up the debounce pipeline for a key
   * @param key Debounce key
   * @param wait Debounce wait time
   * @param maxWait Maximum wait time
   * @param trailing Whether to trigger on trailing edge
   * @param onDebounced Callback for debounced execution
   */
  private setupDebouncePipeline(
    key: string,
    wait: number,
    maxWait: number | undefined,
    trailing: boolean,
    onDebounced?: (data: any) => void,
  ): void {
    this.debounceSubjects[key]
      .pipe(
        debounceTime(wait),
        distinctUntilChanged((prev, curr) => {
          // Custom comparison logic - can be overridden per key
          return JSON.stringify(prev) === JSON.stringify(curr);
        }),
        map((data) => {
          if (trailing) {
            return data;
          }
          return null;
        }),
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.executeDebounced(key, data, onDebounced);
          }
        },
        error: (err) => {
          this.logger.error(`Error in debounce pipeline for ${key}: ${err.message}`);
        },
      });
  }

  /**
   * Execute the debounced function
   * @param key Debounce key
   * @param data Data to pass to the function
   * @param onDebounced Optional callback
   */
  private executeDebounced(key: string, data: any, onDebounced?: (data: any) => void): void {
    try {
      this.logger.debug(`Executing debounced function for key: ${key}`);

      // Update last execution time
      this.lastExecutionTimes[key] = Date.now();

      // Execute callback if provided
      if (onDebounced) {
        onDebounced(data);
      }

      // Emit event
      this.eventEmitter.emit(`debounce:${key}`, data);

      // Clear pending request
      delete this.pendingRequests[key];
    } catch (err) {
      this.logger.error(`Error executing debounced function for ${key}: ${err.message}`);
    } finally {
      this.clearTimers(key);
    }
  }

  /**
   * Clear all timers for a key
   * @param key Debounce key
   */
  private clearTimers(key: string): void {
    if (this.debounceTimers[key]) {
      clearTimeout(this.debounceTimers[key]);
      delete this.debounceTimers[key];
    }

    if (this.maxWaitTimers[key]) {
      clearTimeout(this.maxWaitTimers[key]);
      delete this.maxWaitTimers[key];
    }
  }

  /**
   * Cancel debouncing for a key
   * @param key Debounce key
   */
  cancel(key: string): void {
    this.clearTimers(key);

    if (this.debounceSubjects[key]) {
      this.debounceSubjects[key].complete();
      delete this.debounceSubjects[key];
    }

    delete this.pendingRequests[key];
  }

  /**
   * Flush pending debounced calls
   * @param key Debounce key
   */
  flush(key: string): void {
    if (this.pendingRequests[key]) {
      this.executeDebounced(key, this.pendingRequests[key]);
    }
  }

  /**
   * Create an observable for debounced events
   * @param key Debounce key
   * @returns Observable that emits debounced data
   */
  createObservable(key: string): Observable<any> {
    if (!this.debounceSubjects[key]) {
      this.debounceSubjects[key] = new Subject<any>();
    }

    return this.debounceSubjects[key].asObservable();
  }

  /**
   * Get debounce statistics
   * @returns Statistics about debouncing
   */
  async getStats(): Promise<{
    activeDebouncers: number;
    pendingRequests: number;
    averageWaitTime: number;
  }> {
    return {
      activeDebouncers: Object.keys(this.debounceSubjects).length,
      pendingRequests: Object.keys(this.pendingRequests).length,
      averageWaitTime: 0, // Would be tracked in a real implementation
    };
  }

  /**
   * Debounce with Redis-based distributed locking
   * @param options Debounce options
   * @param data Data to debounce
   * @param lockTtl Lock time to live in seconds
   */
  async debounceWithLock(options: DebounceOptions & { lockTtl: number }, data: any): Promise<void> {
    const { key, lockTtl } = options;
    const lockKey = `debounce:lock:${key}`;

    try {
      // Try to acquire lock
      const lockAcquired = await this.cacheService.set(lockKey, 'locked', lockTtl, 'NX');

      if (lockAcquired) {
        this.logger.debug(`Acquired lock for debounced key: ${key}`);
        this.debounce(options, data);
      } else {
        this.logger.debug(`Debounce lock busy for key: ${key}, request ignored`);
      }
    } catch (err) {
      this.logger.error(`Error acquiring debounce lock for ${key}: ${err.message}`);
      // Fall back to local debouncing
      this.debounce(options, data);
    }
  }
}
```

### Connection Pooling

```typescript
// connection-pool.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, PoolConfig } from 'pg';
import { Redis } from 'ioredis';
import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { createPool, Pool as GenericPool } from 'generic-pool';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  maxConnections: number;
  minConnections: number;
}

@Injectable()
export class ConnectionPoolService implements OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private postgresPool: Pool;
  private redisPools: Record<string, Redis> = {};
  private mongoPools: Record<string, { client: MongoClient; db: Db }> = {};
  private genericPools: Record<string, GenericPool<any>> = {};
  private readonly poolStats: Record<string, ConnectionPoolStats> = {};

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.initializePools();
  }

  /**
   * Initialize all connection pools
   */
  private initializePools(): void {
    // Initialize PostgreSQL pool
    this.initializePostgresPool();

    // Initialize Redis pools
    this.initializeRedisPools();

    // Initialize MongoDB pools
    this.initializeMongoPools();

    // Initialize generic pools
    this.initializeGenericPools();
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  private initializePostgresPool(): void {
    const config: PoolConfig = {
      host: this.configService.get<string>('POSTGRES_HOST', 'localhost'),
      port: this.configService.get<number>('POSTGRES_PORT', 5432),
      user: this.configService.get<string>('POSTGRES_USER', 'postgres'),
      password: this.configService.get<string>('POSTGRES_PASSWORD', 'postgres'),
      database: this.configService.get<string>('POSTGRES_DB', 'app_db'),
      max: this.configService.get<number>('POSTGRES_POOL_MAX', 20),
      min: this.configService.get<number>('POSTGRES_POOL_MIN', 4),
      idleTimeoutMillis: this.configService.get<number>('POSTGRES_POOL_IDLE_TIMEOUT', 30000),
      connectionTimeoutMillis: this.configService.get<number>('POSTGRES_POOL_CONNECTION_TIMEOUT', 2000),
      application_name: 'mobile-apps-service',
    };

    this.postgresPool = new Pool(config);

    // Event listeners
    this.postgresPool.on('connect', () => {
      this.logger.log('PostgreSQL client connected');
      this.updatePoolStats('postgres');
    });

    this.postgresPool.on('acquire', () => {
      this.updatePoolStats('postgres');
    });

    this.postgresPool.on('remove', () => {
      this.updatePoolStats('postgres');
    });

    this.postgresPool.on('error', (err) => {
      this.logger.error(`PostgreSQL pool error: ${err.message}`);
      this.eventEmitter.emit('pool:error', { pool: 'postgres', error: err });
    });

    this.logger.log('PostgreSQL connection pool initialized');
  }

  /**
   * Initialize Redis connection pools
   */
  private initializeRedisPools(): void {
    const redisConfigs = this.configService.get<Record<string, any>>('REDIS_POOLS', {});

    Object.entries(redisConfigs).forEach(([name, config]) => {
      const redisConfig = {
        host: config.host || 'localhost',
        port: config.port || 6379,
        password: config.password || '',
        db: config.db || 0,
        maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
        enableReadyCheck: true,
        connectTimeout: config.connectTimeout || 5000,
        retryStrategy: (times: number) => {
          return Math.min(times * 50, 2000);
        },
      };

      this.redisPools[name] = new Redis(redisConfig);

      // Event listeners
      this.redisPools[name].on('connect', () => {
        this.logger.log(`Redis pool ${name} connected`);
        this.updatePoolStats(`redis:${name}`);
      });

      this.redisPools[name].on('error', (err) => {
        this.logger.error(`Redis pool ${name} error: ${err.message}`);
        this.eventEmitter.emit('pool:error', { pool: `redis:${name}`, error: err });
      });

      this.logger.log(`Redis connection pool ${name} initialized`);
    });
  }

  /**
   * Initialize MongoDB connection pools
   */
  private initializeMongoPools(): void {
    const mongoConfigs = this.configService.get<Record<string, any>>('MONGO_POOLS', {});

    Object.entries(mongoConfigs).forEach(async ([name, config]) => {
      const mongoConfig: MongoClientOptions = {
        connectTimeoutMS: config.connectTimeoutMS || 5000,
        socketTimeoutMS: config.socketTimeoutMS || 30000,
        maxPoolSize: config.maxPoolSize || 10,
        minPoolSize: config.minPoolSize || 2,
        maxIdleTimeMS: config.maxIdleTimeMS || 30000,
        waitQueueTimeoutMS: config.waitQueueTimeoutMS || 10000,
        retryWrites: config.retryWrites || true,
        retryReads: config.retryReads || true,
      };

      try {
        const client = new MongoClient(config.uri, mongoConfig);
        await client.connect();

        this.mongoPools[name] = {
          client,
          db: client.db(config.database || 'app_db'),
        };

        this.logger.log(`MongoDB connection pool ${name} initialized`);
        this.updatePoolStats(`mongo:${name}`);
      } catch (err) {
        this.logger.error(`Error initializing MongoDB pool ${name}: ${err.message}`);
        this.eventEmitter.emit('pool:error', { pool: `mongo:${name}`, error: err });
      }
    });
  }

  /**
   * Initialize generic connection pools
   */
  private initializeGenericPools(): void {
    const genericPoolConfigs = this.configService.get<Record<string, any>>('GENERIC_POOLS', {});

    Object.entries(genericPoolConfigs).forEach(([name, config]) => {
      const factory = {
        create: async () => {
          // Create a new connection based on the config
          switch (config.type) {
            case 'http':
              return this.createHttpConnection(config);
            case 'grpc':
              return this.createGrpcConnection(config);
            case 'custom':
              return config.create();
            default:
              throw new Error(`Unknown pool type: ${config.type}`);
          }
        },
        destroy: async (connection: any) => {
          // Destroy the connection
          if (config.destroy) {
            await config.destroy(connection);
          }
        },
        validate: async (connection: any) => {
          // Validate the connection
          if (config.validate) {
            return config.validate(connection);
          }
          return true;
        },
      };

      const poolOptions = {
        max: config.max || 10,
        min: config.min || 2,
        acquireTimeoutMillis: config.acquireTimeoutMillis || 5000,
        idleTimeoutMillis: config.idleTimeoutMillis || 30000,
        evictionRunIntervalMillis: config.evictionRunIntervalMillis || 10000,
        numTestsPerEvictionRun: config.numTestsPerEvictionRun || 3,
        softIdleTimeoutMillis: config.softIdleTimeoutMillis || -1,
        Promise: Promise,
      };

      this.genericPools[name] = createPool(factory, poolOptions);

      // Event listeners
      this.genericPools[name].on('factoryCreateError', (err) => {
        this.logger.error(`Generic pool ${name} factory create error: ${err.message}`);
        this.eventEmitter.emit('pool:error', { pool: `generic:${name}`, error: err });
      });

      this.genericPools[name].on('factoryDestroyError', (err) => {
        this.logger.error(`Generic pool ${name} factory destroy error: ${err.message}`);
      });

      this.logger.log(`Generic connection pool ${name} initialized`);
    });
  }

  /**
   * Create an HTTP connection for generic pool
   * @param config HTTP connection config
   * @returns HTTP connection
   */
  private async createHttpConnection(config: any): Promise<any> {
    const axios = require('axios');
    return axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 5000,
      headers: config.headers || {},
    });
  }

  /**
   * Create a gRPC connection for generic pool
   * @param config gRPC connection config
   * @returns gRPC connection
   */
  private async createGrpcConnection(config: any): Promise<any> {
    const grpc = require('@grpc/grpc-js');
    const protoLoader = require('@grpc/proto-loader');

    const packageDefinition = protoLoader.loadSync(config.protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const service = protoDescriptor[config.package][config.service];

    return new service(config.address, grpc.credentials.createInsecure());
  }

  /**
   * Get a PostgreSQL client from the pool
   * @returns PostgreSQL client
   */
  async getPostgresClient(): Promise<PoolClient> {
    try {
      const client = await this.postgresPool.connect();
      this.updatePoolStats('postgres');
      return client;
    } catch (err) {
      this.logger.error(`Error getting PostgreSQL client: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get a Redis connection from the pool
   * @param poolName Pool name
   * @returns Redis connection
   */
  getRedisClient(poolName: string = 'default'): Redis {
    if (!this.redisPools[poolName]) {
      throw new Error(`Redis pool ${poolName} not found`);
    }
    this.updatePoolStats(`redis:${poolName}`);
    return this.redisPools[poolName];
  }

  /**
   * Get a MongoDB connection from the pool
   * @param poolName Pool name
   * @returns MongoDB database connection
   */
  getMongoDb(poolName: string = 'default'): Db {
    if (!this.mongoPools[poolName]) {
      throw new Error(`MongoDB pool ${poolName} not found`);
    }
    this.updatePoolStats(`mongo:${poolName}`);
    return this.mongoPools[poolName].db;
  }

  /**
   * Get a connection from a generic pool
   * @param poolName Pool name
   * @returns Generic connection
   */
  async getGenericConnection(poolName: string): Promise<any> {
    if (!this.genericPools[poolName]) {
      throw new Error(`Generic pool ${poolName} not found`);
    }

    try {
      const connection = await this.genericPools[poolName].acquire();
      this.updatePoolStats(`generic:${poolName}`);
      return connection;
    } catch (err) {
      this.logger.error(`Error getting connection from generic pool ${poolName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Release a generic connection back to the pool
   * @param poolName Pool name
   * @param connection Connection to release
   */
  async releaseGenericConnection(poolName: string, connection: any): Promise<void> {
    if (!this.genericPools[poolName]) {
      throw new Error(`Generic pool ${poolName} not found`);
    }

    try {
      await this.genericPools[poolName].release(connection);
      this.updatePoolStats(`generic:${poolName}`);
    } catch (err) {
      this.logger.error(`Error releasing connection to generic pool ${poolName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Update pool statistics
   * @param poolName Pool name
   */
  private updatePoolStats(poolName: string): void {
    try {
      let stats: ConnectionPoolStats;

      if (poolName === 'postgres') {
        stats = {
          totalConnections: this.postgresPool.totalCount,
          activeConnections: this.postgresPool.waitingCount,
          idleConnections: this.postgresPool.idleCount,
          waitingClients: this.postgresPool.waitingCount,
          maxConnections: this.postgresPool.options.max,
          minConnections: this.postgresPool.options.min,
        };
      } else if (poolName.startsWith('redis:')) {
        const name = poolName.split(':')[1];
        stats = {
          totalConnections: 1, // Redis client doesn't expose pool stats
          activeConnections: 1,
          idleConnections: 0,
          waitingClients: 0,
          maxConnections: 1,
          minConnections: 1,
        };
      } else if (poolName.startsWith('mongo:')) {
        const name = poolName.split(':')[1];
        const pool = this.mongoPools[name].client.topology.s.pool;
        stats = {
          totalConnections: pool.totalConnectionCount,
          activeConnections: pool.currentCheckedOutCount,
          idleConnections: pool.currentIdleCount,
          waitingClients: pool.waitQueueSize,
          maxConnections: pool.options.maxPoolSize,
          minConnections: pool.options.minPoolSize,
        };
      } else if (poolName.startsWith('generic:')) {
        const name = poolName.split(':')[1];
        const pool = this.genericPools[name];
        stats = {
          totalConnections: pool.size,
          activeConnections: pool.borrowed,
          idleConnections: pool.available,
          waitingClients: pool.pending,
          maxConnections: pool.max,
          minConnections: pool.min,
        };
      } else {
        return;
      }

      this.poolStats[poolName] = stats;
      this.eventEmitter.emit('pool:stats', { pool: poolName, stats });
    } catch (err) {
      this.logger.error(`Error updating pool stats for ${poolName}: ${err.message}`);
    }
  }

  /**
   * Get pool statistics
   * @param poolName Pool name
   * @returns Pool statistics
   */
  getPoolStats(poolName: string): ConnectionPoolStats {
    return this.poolStats[poolName] || {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      maxConnections: 0,
      minConnections: 0,
    };
  }

  /**
   * Get all pool statistics
   * @returns All pool statistics
   */
  getAllPoolStats(): Record<string, ConnectionPoolStats> {
    return this.poolStats;
  }

  /**
   * Drain a pool (close all connections)
   * @param poolName Pool name
   */
  async drainPool(poolName: string): Promise<void> {
    try {
      if (poolName === 'postgres') {
        await this.postgresPool.end();
        this.logger.log('PostgreSQL pool drained');
      } else if (poolName.startsWith('redis:')) {
        const name = poolName.split(':')[1];
        await this.redisPools[name].quit();
        delete this.redisPools[name];
        this.logger.log(`Redis pool ${name} drained`);
      } else if (poolName.startsWith('mongo:')) {
        const name = poolName.split(':')[1];
        await this.mongoPools[name].client.close();
        delete this.mongoPools[name];
        this.logger.log(`MongoDB pool ${name} drained`);
      } else if (poolName.startsWith('generic:')) {
        const name = poolName.split(':')[1];
        await this.genericPools[name].drain();
        await this.genericPools[name].clear();
        delete this.genericPools[name];
        this.logger.log(`Generic pool ${name} drained`);
      }
    } catch (err) {
      this.logger.error(`Error draining pool ${poolName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Clean up all pools on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    try {
      // Drain PostgreSQL pool
      await this.postgresPool.end();
      this.logger.log('PostgreSQL pool closed');

      // Close Redis connections
      await Promise.all(
        Object.entries(this.redisPools).map(async ([name, client]) => {
          await client.quit();
          this.logger.log(`Redis pool ${name} closed`);
        }),
      );

      // Close MongoDB connections
      await Promise.all(
        Object.entries(this.mongoPools).map(async ([name, { client }]) => {
          await client.close();
          this.logger.log(`MongoDB pool ${name} closed`);
        }),
      );

      // Drain generic pools
      await Promise.all(
        Object.entries(this.genericPools).map(async ([name, pool]) => {
          await pool.drain();
          await pool.clear();
          this.logger.log(`Generic pool ${name} closed`);
        }),
      );
    } catch (err) {
      this.logger.error(`Error during pool cleanup: ${err.message}`);
    }
  }

  /**
   * Execute a function with automatic connection management
   * @param poolName Pool name
   * @param operation Operation to execute
   * @returns Result of the operation
   */
  async withConnection<T>(poolName: string, operation: (connection: any) => Promise<T>): Promise<T> {
    if (poolName === 'postgres') {
      const client = await this.getPostgresClient();
      try {
        return await operation(client);
      } finally {
        client.release();
      }
    } else if (poolName.startsWith('generic:')) {
      const name = poolName.split(':')[1];
      const connection = await this.getGenericConnection(name);
      try {
        return await operation(connection);
      } finally {
        await this.releaseGenericConnection(name, connection);
      }
    } else {
      throw new Error(`Unsupported pool type for withConnection: ${poolName}`);
    }
  }

  /**
   * Execute a transaction with PostgreSQL
   * @param operation Operation to execute within the transaction
   * @returns Result of the operation
   */
  async withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getPostgresClient();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
```

## Real-Time Features (300+ lines)

### WebSocket Server Setup

```typescript
// websocket-gateway.service.ts
import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../redis/redis-cache.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { ConnectionPoolService } from '../database/connection-pool.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  path: '/ws',
  serveClient: false,
  pingInterval: 25000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e6, // 1MB
})
@Injectable()
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly connectedClients: Map<string, Socket> = new Map();
  private readonly clientRooms: Map<string, Set<string>> = new Map();
  private readonly roomClients: Map<string, Set<string>> = new Map();
  private readonly rateLimiter: RateLimiterMemory;
  private readonly messageBuffer: Map<string, any[]> = new Map();
  private readonly bufferFlushInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private cacheService: RedisCacheService,
    private jwtService: JwtService,
    private eventEmitter: EventEmitter2,
    private connectionPool: ConnectionPoolService,
  ) {
    // Initialize rate limiter
    this.rateLimiter = new RateLimiterMemory({
      points: this.configService.get<number>('WS_RATE_LIMIT_POINTS', 100),
      duration: this.configService.get<number>('WS_RATE_LIMIT_DURATION', 60),
      blockDuration: this.configService.get<number>('WS_RATE_LIMIT_BLOCK_DURATION', 60),
    });

    // Set up buffer flush interval
    this.bufferFlushInterval = setInterval(() => this.flushMessageBuffers(), 1000);
  }

  /**
   * Initialize the WebSocket server
   * @param server Socket.IO server
   */
  afterInit(server: Server): void {
    this.logger.log('WebSocket Gateway initialized');

    // Set up server-wide middleware
    server.use(async (socket: Socket, next) => {
      try {
        // Rate limiting
        const clientId = socket.handshake.address;
        await this.rateLimiter.consume(clientId);

        // Authentication
        const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];
        if (token) {
          const payload = this.jwtService.verify(token, {
            secret: this.configService.get<string>('JWT_SECRET'),
          });
          socket.data.user = payload;
        }

        next();
      } catch (err) {
        this.logger.warn(`WebSocket connection rejected: ${err.message}`);
        next(new Error('Authentication failed'));
      }
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up WebSocket event listeners
   */
  private setupEventListeners(): void {
    // Listen for application events
    this.eventEmitter.on('user:status', (data: { userId: string; status: string }) => {
      this.broadcastToUserRooms(data.userId, 'user:status', data);
    });

    this.eventEmitter.on('document:update', (data: { documentId: string; content: any }) => {
      this.broadcastToRoom(`document:${data.documentId}`, 'document:update', data);
    });

    this.eventEmitter.on('notification:send', (data: { userId: string; notification: any }) => {
      this.sendToUser(data.userId, 'notification:received', data.notification);
    });
  }

  /**
   * Handle new client connection
   * @param client Socket client
   */
  async handleConnection(client: Socket): Promise<void> {
    const clientId = client.id;
    const userId = client.data.user?.sub;

    this.logger.log(`Client connected: ${clientId}${userId ? ` (User: ${userId})` : ''}`);

    // Store client connection
    this.connectedClients.set(clientId, client);

    // Initialize client rooms set
    this.clientRooms.set(clientId, new Set());

    // Track user connection if authenticated
    if (userId) {
      await this.cacheService.set(`ws:user:${userId}`, clientId, 86400); // 24 hours
      this.eventEmitter.emit('user:connected', { userId, clientId });
    }

    // Send welcome message
    client.emit('connection:established', {
      clientId,
      serverTime: new Date().toISOString(),
      version: this.configService.get<string>('APP_VERSION'),
    });

    // Flush any buffered messages for this client
    await this.flushClientBuffer(clientId);
  }

  /**
   * Handle client disconnection
   * @param client Socket client
   */
  async handleDisconnect(client: Socket): Promise<void> {
    const clientId = client.id;
    const userId = client.data.user?.sub;

    this.logger.log(`Client disconnected: ${clientId}${userId ? ` (User: ${userId})` : ''}`);

    // Remove client from all rooms
    const rooms = this.clientRooms.get(clientId) || new Set();
    for (const room of rooms) {
      this.leaveRoom(clientId, room);
    }

    // Remove client from tracking
    this.connectedClients.delete(clientId);
    this.clientRooms.delete(clientId);

    // Remove user connection tracking if authenticated
    if (userId) {
      await this.cacheService.del(`ws:user:${userId}`);
      this.eventEmitter.emit('user:disconnected', { userId, clientId });
    }
  }

  /**
   * Join a room
   * @param clientId Client ID
   * @param room Room name
   */
  joinRoom(clientId: string, room: string): void {
    const client = this.connectedClients.get(clientId);
    if (!client) {
      this.logger.warn(`Client ${clientId} not found when joining room ${room}`);
      return;
    }

    // Add to client's rooms
    const rooms = this.clientRooms.get(clientId) || new Set();
    rooms.add(room);
    this.clientRooms.set(clientId, rooms);

    // Add to room's clients
    const roomClients = this.roomClients.get(room) || new Set();
    roomClients.add(clientId);
    this.roomClients.set(room, roomClients);

    // Join the room
    client.join(room);
    this.logger.debug(`Client ${clientId} joined room ${room}`);
  }

  /**
   * Leave a room
   * @param clientId Client ID
   * @param room Room name
   */
  leaveRoom(clientId: string, room: string): void {
    const client = this.connectedClients.get(clientId);
    if (!client) {
      this.logger.warn(`Client ${clientId} not found when leaving room ${room}`);
      return;
    }

    // Remove from client's rooms
    const rooms = this.clientRooms.get(clientId) || new Set();
    rooms.delete(room);
    this.clientRooms.set(clientId, rooms);

    // Remove from room's clients
    const roomClients = this.roomClients.get(room) || new Set();
    roomClients.delete(clientId);
    if (roomClients.size === 0) {
      this.roomClients.delete(room);
    } else {
      this.roomClients.set(room, roomClients);
    }

    // Leave the room
    client.leave(room);
    this.logger.debug(`Client ${clientId} left room ${room}`);
  }

  /**
   * Send a message to a specific client
   * @param clientId Client ID
   * @param event Event name
   * @param data Data to send
   * @param buffer Whether to buffer if client is not connected
   */
  async sendToClient(clientId: string, event: string, data: any, buffer: boolean = true): Promise<void> {
    const client = this.connectedClients.get(clientId);
    if (client) {
      try {
        client.emit(event, data);
        this.logger.debug(`Sent event ${event} to client ${clientId}`);
      } catch (err) {
        this.logger.error(`Error sending to client ${clientId}: ${err.message}`);
        if (buffer) {
          this.bufferMessage(clientId, event, data);
        }
      }
    } else if (buffer) {
      this.bufferMessage(clientId, event, data);
    }
  }

  /**
   * Send a message to a specific user
   * @param userId User ID
   * @param event Event name
   * @param data Data to send
   * @param buffer Whether to buffer if user is not connected
   */
  async sendToUser(userId: string, event: string, data: any, buffer: boolean = true): Promise<void> {
    const clientId = await this.cacheService.getAsync(`ws:user:${userId}`);
    if (clientId) {
      await this.sendToClient(clientId, event, data, buffer);
    } else if (buffer) {
      this.bufferMessage(`user:${userId}`, event, data);
    }
  }

  /**
   * Broadcast a message to all clients in a room
   * @param room Room name
   * @param event Event name
   * @param data Data to send
   * @param exceptClientId Client ID to exclude (optional)
   */
  broadcastToRoom(room: string, event: string, data: any, exceptClientId?: string): void {
    const roomClients = this.roomClients.get(room);
    if (!roomClients || roomClients.size === 0) {
      this.logger.debug(`No clients in room ${room} to broadcast ${event}`);
      return;
    }

    this.server.to(room).except(exceptClientId).emit(event, data);
    this.logger.debug(`Broadcast event ${event} to room ${room} (${roomClients.size} clients)`);
  }

  /**
   * Broadcast a message to all rooms a user is in
   * @param userId User ID
   * @param event Event name
   * @param data Data to send
   */
  async broadcastToUserRooms(userId: string, event: string, data: any): Promise<void> {
    const clientId = await this.cacheService.getAsync(`ws:user:${userId}`);
    if (!clientId) {
      this.logger.debug(`User ${userId} not connected, cannot broadcast to rooms`);
      return;
    }

    const rooms = this.clientRooms.get(clientId) || new Set();
    for (const room of rooms) {
      this.broadcastToRoom(room, event, data, clientId);
    }
  }

  /**
   * Broadcast a message to all connected clients
   * @param event Event name
   * @param data Data to send
   * @param exceptClientId Client ID to exclude (optional)
   */
  broadcastToAll(event: string, data: any, exceptClientId?: string): void {
    this.server.except(exceptClientId).emit(event, data);
    this.logger.debug(`Broadcast event ${event} to all clients (${this.connectedClients.size} clients)`);
  }

  /**
   * Buffer a message for later delivery
   * @param key Buffer key (clientId or user:userId)
   * @param event Event name
   * @param data Data to buffer
   */
  private bufferMessage(key: string, event: string, data: any): void {
    if (!this.messageBuffer.has(key)) {
      this.messageBuffer.set(key, []);
    }

    this.messageBuffer.get(key)!.push({ event, data, timestamp: Date.now() });
    this.logger.debug(`Buffered message for ${key}: ${event}`);
  }

  /**
   * Flush buffered messages for a specific client
   * @param clientId Client ID
   */
  private async flushClientBuffer(clientId: string): Promise<void> {
    const userId = Array.from(this.connectedClients.values()).find(
      (client) => client.id === clientId,
    )?.data.user?.sub;

    // Flush client buffer
    if (this.messageBuffer.has(clientId)) {
      const messages = this.messageBuffer.get(clientId) || [];
      for (const message of messages) {
        await this.sendToClient(clientId, message.event, message.data, false);
      }
      this.messageBuffer.delete(clientId);
    }

    // Flush user buffer if authenticated
    if (userId && this.messageBuffer.has(`user:${userId}`)) {
      const messages = this.messageBuffer.get(`user:${userId}`) || [];
      for (const message of messages) {
        await this.sendToUser(userId, message.event, message.data, false);
      }
      this.messageBuffer.delete(`user:${userId}`);
    }
  }

  /**
   * Flush all message buffers
   */
  private flushMessageBuffers(): void {
    this.messageBuffer.forEach((messages, key) => {
      // Remove old messages (older than 1 hour)
      const recentMessages = messages.filter((msg) => Date.now() - msg.timestamp < 3600000);

      if (recentMessages.length === 0) {
        this.messageBuffer.delete(key);
      } else if (recentMessages.length !== messages.length) {
        this.messageBuffer.set(key, recentMessages);
      }
    });
  }

  /**
   * Get WebSocket statistics
   * @returns WebSocket statistics
   */
  getStats(): {
    connectedClients: number;
    activeRooms: number;
    messagesSent: number;
    messagesBuffered: number;
  } {
    let messagesBuffered = 0;
    this.messageBuffer.forEach((messages) => {
      messagesBuffered += messages.length;
    });

    return {
      connectedClients: this.connectedClients.size,
      activeRooms: this.roomClients.size,
      messagesSent: 0, // Would be tracked in a real implementation
      messagesBuffered,
    };
  }

  /**
   * Get all connected clients
   * @returns Array of connected client IDs
   */
  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }

  /**
   * Get all rooms
   * @returns Array of room names
   */
  getAllRooms(): string[] {
    return Array.from(this.roomClients.keys());
  }

  /**
   * Get clients in a room
   * @param room Room name
   * @returns Array of client IDs in the room
   */
  getClientsInRoom(room: string): string[] {
    return Array.from(this.roomClients.get(room) || []);
  }

  /**
   * Get rooms for a client
   * @param clientId Client ID
   * @returns Array of room names the client is in
   */
  getClientRooms(clientId: string): string[] {
    return Array.from(this.clientRooms.get(clientId) || []);
  }

  /**
   * Clean up on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    clearInterval(this.bufferFlushInterval);

    // Disconnect all clients
    this.connectedClients.forEach((client) => {
      client.disconnect(true);
    });

    this.logger.log('WebSocket Gateway destroyed');
  }
}
```

### Real-Time Event Handlers

```typescript
// realtime-events.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket-gateway.service';
import { RedisCacheService } from '../redis/redis-cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConnectionPoolService } from '../database/connection-pool.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface DocumentUpdateEvent {
  documentId: string;
  content: any;
  version: number;
  lastModifiedBy: string;
  timestamp: string;
}

interface PresenceUpdateEvent {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'typing';
  lastActive: string;
  currentRoom?: string;
}

interface NotificationEvent {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
}

@Injectable()
export class RealtimeEventsService {
  private readonly logger = new Logger(RealtimeEventsService.name);
  private readonly documentUpdateSubjects: Map<string, Subject<DocumentUpdateEvent>> = new Map();
  private readonly presenceUpdateSubjects: Map<string, Subject<PresenceUpdateEvent>> = new Map();
  private readonly typingIndicators: Map<string, { userId: string; timestamp: number }> = new Map();
  private readonly typingIndicatorInterval: NodeJS.Timeout;

  constructor(
    private websocketGateway: WebsocketGateway,
    private cacheService: RedisCacheService,
    private eventEmitter: EventEmitter2,
    private connectionPool: ConnectionPoolService,
    private configService: ConfigService,
  ) {
    // Set up typing indicator cleanup
    this.typingIndicatorInterval = setInterval(() => this.cleanupTypingIndicators(), 5000);

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Document updates
    this.eventEmitter.on('document:update', (event: DocumentUpdateEvent) => {
      this.handleDocumentUpdate(event);
    });

    // User presence
    this.eventEmitter.on('user:connected', (data: { userId: string; clientId: string }) => {
      this.handleUserConnected(data.userId, data.clientId);
    });

    this.eventEmitter.on('user:disconnected', (data: { userId: string; clientId: string }) => {
      this.handleUserDisconnected(data.userId, data.clientId);
    });

    // Notifications
    this.eventEmitter.on('notification:created', (notification: NotificationEvent) => {
      this.handleNotificationCreated(notification);
    });
  }

  /**
   * Handle document update event
   * @param event Document update event
   */
  private async handleDocumentUpdate(event: DocumentUpdateEvent): Promise<void> {
    try {
      const { documentId, content, version, lastModifiedBy } = event;
      const roomName = `document:${documentId}`;

      // Get document collaborators
      const collaborators = await this.getDocumentCollaborators(documentId);

      // Update document in database
      await this.updateDocumentInDatabase(documentId, content, version, lastModifiedBy);

      // Broadcast to room
      this.websocketGateway.broadcastToRoom(roomName, 'document:update', {
        documentId,
        content,
        version,
        lastModifiedBy,
        timestamp: new Date().toISOString(),
      });

      // Notify collaborators who aren't in the room
      for (const userId of collaborators) {
        const isInRoom = this.websocketGateway.getClientsInRoom(roomName).some((clientId) => {
          const client = this.websocketGateway['connectedClients'].get(clientId);
          return client?.data.user?.sub === userId;
        });

        if (!isInRoom) {
          this.websocketGateway.sendToUser(userId, 'document:update:notification', {
            documentId,
            version,
            lastModifiedBy,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Update document version in cache
      await this.cacheService.set(`document:${documentId}:version`, version, 86400);

      // Emit to observable
      if (this.documentUpdateSubjects.has(documentId)) {
        this.documentUpdateSubjects.get(documentId)!.next(event);
      }
    } catch (err) {
      this.logger.error(`Error handling document update for ${event.documentId}: ${err.message}`);
    }
  }

  /**
   * Get document collaborators from database
   * @param documentId Document ID
   * @returns Array of user IDs
   */
  private async getDocumentCollaborators(documentId: string): Promise<string[]> {
    try {
      const result = await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          SELECT user_id FROM document_collaborators
          WHERE document_id = $1
        `;
        const { rows } = await client.query(query, [documentId]);
        return rows.map((row) => row.user_id);
      });

      return result;
    } catch (err) {
      this.logger.error(`Error getting collaborators for document ${documentId}: ${err.message}`);
      return [];
    }
  }

  /**
   * Update document in database
   * @param documentId Document ID
   * @param content Document content
   * @param version Document version
   * @param lastModifiedBy User ID who modified the document
   */
  private async updateDocumentInDatabase(
    documentId: string,
    content: any,
    version: number,
    lastModifiedBy: string,
  ): Promise<void> {
    try {
      await this.connectionPool.withConnection('postgres', async (client) => {
        await client.query('BEGIN');

        // Update document content
        const updateQuery = `
          UPDATE documents
          SET content = $1, version = $2, last_modified_by = $3, last_modified_at = NOW()
          WHERE id = $4
        `;
        await client.query(updateQuery, [content, version, lastModifiedBy, documentId]);

        // Add to document history
        const historyQuery = `
          INSERT INTO document_history (document_id, version, content, modified_by, modified_at)
          VALUES ($1, $2, $3, $4, NOW())
        `;
        await client.query(historyQuery, [documentId, version, content, lastModifiedBy]);

        await client.query('COMMIT');
      });
    } catch (err) {
      this.logger.error(`Error updating document ${documentId} in database: ${err.message}`);
      throw err;
    }
  }

  /**
   * Handle user connected event
   * @param userId User ID
   * @param clientId Client ID
   */
  private async handleUserConnected(userId: string, clientId: string): Promise<void> {
    try {
      // Update user status
      await this.updateUserPresence(userId, 'online');

      // Get user's active documents
      const activeDocuments = await this.getUserActiveDocuments(userId);

      // Join document rooms
      for (const documentId of activeDocuments) {
        this.websocketGateway.joinRoom(clientId, `document:${documentId}`);
      }

      // Join user's personal room
      this.websocketGateway.joinRoom(clientId, `user:${userId}`);

      // Broadcast presence update
      this.broadcastPresenceUpdate(userId, 'online');

      this.logger.log(`User ${userId} connected (client: ${clientId})`);
    } catch (err) {
      this.logger.error(`Error handling user connected for ${userId}: ${err.message}`);
    }
  }

  /**
   * Handle user disconnected event
   * @param userId User ID
   * @param clientId Client ID
   */
  private async handleUserDisconnected(userId: string, clientId: string): Promise<void> {
    try {
      // Check if user has other active connections
      const activeConnections = await this.cacheService.getAsync(`ws:user:${userId}`);
      if (!activeConnections) {
        // No other connections, mark as offline
        await this.updateUserPresence(userId, 'offline');
        this.broadcastPresenceUpdate(userId, 'offline');
      }

      // Remove from typing indicators
      this.typingIndicators.forEach((value, key) => {
        if (value.userId === userId) {
          this.typingIndicators.delete(key);
        }
      });

      this.logger.log(`User ${userId} disconnected (client: ${clientId})`);
    } catch (err) {
      this.logger.error(`Error handling user disconnected for ${userId}: ${err.message}`);
    }
  }

  /**
   * Update user presence in database and cache
   * @param userId User ID
   * @param status Presence status
   */
  private async updateUserPresence(userId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Update in database
      await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          INSERT INTO user_presence (user_id, status, last_active)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id)
          DO UPDATE SET status = $2, last_active = $3
        `;
        await client.query(query, [userId, status, now]);
      });

      // Update in cache
      await this.cacheService.set(`user:${userId}:presence`, { status, lastActive: now }, 3600);
    } catch (err) {
      this.logger.error(`Error updating presence for user ${userId}: ${err.message}`);
    }
  }

  /**
   * Get user's active documents
   * @param userId User ID
   * @returns Array of document IDs
   */
  private async getUserActiveDocuments(userId: string): Promise<string[]> {
    try {
      const result = await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          SELECT document_id FROM document_collaborators
          WHERE user_id = $1 AND last_accessed_at > NOW() - INTERVAL '1 hour'
        `;
        const { rows } = await client.query(query, [userId]);
        return rows.map((row) => row.document_id);
      });

      return result;
    } catch (err) {
      this.logger.error(`Error getting active documents for user ${userId}: ${err.message}`);
      return [];
    }
  }

  /**
   * Broadcast presence update to relevant users
   * @param userId User ID
   * @param status Presence status
   */
  private async broadcastPresenceUpdate(userId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
    try {
      // Get user's collaborators
      const collaborators = await this.getUserCollaborators(userId);

      // Broadcast to collaborators
      for (const collaboratorId of collaborators) {
        this.websocketGateway.sendToUser(collaboratorId, 'presence:update', {
          userId,
          status,
          timestamp: new Date().toISOString(),
        });
      }

      // Broadcast to user's own room
      this.websocketGateway.broadcastToRoom(`user:${userId}`, 'presence:self:update', {
        userId,
        status,
        timestamp: new Date().toISOString(),
      });

      // Emit to observable
      if (this.presenceUpdateSubjects.has(userId)) {
        this.presenceUpdateSubjects.get(userId)!.next({
          userId,
          status,
          lastActive: new Date().toISOString(),
        });
      }
    } catch (err) {
      this.logger.error(`Error broadcasting presence update for ${userId}: ${err.message}`);
    }
  }

  /**
   * Get user's collaborators
   * @param userId User ID
   * @returns Array of collaborator user IDs
   */
  private async getUserCollaborators(userId: string): Promise<string[]> {
    try {
      const result = await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          SELECT DISTINCT c.user_id
          FROM document_collaborators c
          JOIN document_collaborators uc ON c.document_id = uc.document_id
          WHERE uc.user_id = $1 AND c.user_id != $1
        `;
        const { rows } = await client.query(query, [userId]);
        return rows.map((row) => row.user_id);
      });

      return result;
    } catch (err) {
      this.logger.error(`Error getting collaborators for user ${userId}: ${err.message}`);
      return [];
    }
  }

  /**
   * Handle typing start event
   * @param documentId Document ID
   * @param userId User ID
   */
  async handleTypingStart(documentId: string, userId: string): Promise<void> {
    try {
      const roomName = `document:${documentId}`;
      const key = `${documentId}:${userId}`;

      // Update typing indicator
      this.typingIndicators.set(key, {
        userId,
        timestamp: Date.now(),
      });

      // Broadcast to room
      this.websocketGateway.broadcastToRoom(
        roomName,
        'document:typing',
        {
          documentId,
          userId,
          isTyping: true,
          timestamp: new Date().toISOString(),
        },
        userId, // Don't send back to the typing user
      );
    } catch (err) {
      this.logger.error(`Error handling typing start for document ${documentId}: ${err.message}`);
    }
  }

  /**
   * Handle typing stop event
   * @param documentId Document ID
   * @param userId User ID
   */
  async handleTypingStop(documentId: string, userId: string): Promise<void> {
    try {
      const roomName = `document:${documentId}`;
      const key = `${documentId}:${userId}`;

      // Remove typing indicator
      this.typingIndicators.delete(key);

      // Broadcast to room
      this.websocketGateway.broadcastToRoom(
        roomName,
        'document:typing',
        {
          documentId,
          userId,
          isTyping: false,
          timestamp: new Date().toISOString(),
        },
        userId, // Don't send back to the typing user
      );
    } catch (err) {
      this.logger.error(`Error handling typing stop for document ${documentId}: ${err.message}`);
    }
  }

  /**
   * Clean up stale typing indicators
   */
  private cleanupTypingIndicators(): void {
    const now = Date.now();
    const timeout = 3000; // 3 seconds

    this.typingIndicators.forEach((value, key) => {
      if (now - value.timestamp > timeout) {
        this.typingIndicators.delete(key);

        const [documentId, userId] = key.split(':');
        this.websocketGateway.broadcastToRoom(
          `document:${documentId}`,
          'document:typing',
          {
            documentId,
            userId,
            isTyping: false,
            timestamp: new Date().toISOString(),
          },
          userId,
        );
      }
    });
  }

  /**
   * Handle notification created event
   * @param notification Notification event
   */
  private async handleNotificationCreated(notification: NotificationEvent): Promise<void> {
    try {
      // Store notification in database
      await this.storeNotification(notification);

      // Send to user
      this.websocketGateway.sendToUser(notification.userId, 'notification:received', notification);

      // Update unread count
      await this.updateUnreadCount(notification.userId);
    } catch (err) {
      this.logger.error(`Error handling notification created for ${notification.userId}: ${err.message}`);
    }
  }

  /**
   * Store notification in database
   * @param notification Notification event
   */
  private async storeNotification(notification: NotificationEvent): Promise<void> {
    try {
      await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          INSERT INTO notifications (id, user_id, type, title, message, data, timestamp, read)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await client.query(query, [
          notification.notificationId,
          notification.userId,
          notification.type,
          notification.title,
          notification.message,
          notification.data,
          notification.timestamp,
          notification.read,
        ]);
      });
    } catch (err) {
      this.logger.error(`Error storing notification ${notification.notificationId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Update user's unread notification count
   * @param userId User ID
   */
  private async updateUnreadCount(userId: string): Promise<void> {
    try {
      const count = await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          SELECT COUNT(*) FROM notifications
          WHERE user_id = $1 AND read = false
        `;
        const { rows } = await client.query(query, [userId]);
        return parseInt(rows[0].count);
      });

      // Update in cache
      await this.cacheService.set(`user:${userId}:unread_count`, count, 3600);

      // Send to user
      this.websocketGateway.sendToUser(userId, 'notification:unread:count', { count });
    } catch (err) {
      this.logger.error(`Error updating unread count for user ${userId}: ${err.message}`);
    }
  }

  /**
   * Get document update observable
   * @param documentId Document ID
   * @returns Observable for document updates
   */
  getDocumentUpdateObservable(documentId: string): Observable<DocumentUpdateEvent> {
    if (!this.documentUpdateSubjects.has(documentId)) {
      this.documentUpdateSubjects.set(documentId, new Subject<DocumentUpdateEvent>());
    }

    return this.documentUpdateSubjects.get(documentId)!.asObservable();
  }

  /**
   * Get presence update observable
   * @param userId User ID
   * @returns Observable for presence updates
   */
  getPresenceUpdateObservable(userId: string): Observable<PresenceUpdateEvent> {
    if (!this.presenceUpdateSubjects.has(userId)) {
      this.presenceUpdateSubjects.set(userId, new Subject<PresenceUpdateEvent>());
    }

    return this.presenceUpdateSubjects.get(userId)!.asObservable();
  }

  /**
   * Get real-time document collaborators
   * @param documentId Document ID
   * @returns Observable for collaborator presence updates
   */
  getDocumentCollaboratorsObservable(documentId: string): Observable<PresenceUpdateEvent[]> {
    const subject = new Subject<PresenceUpdateEvent[]>();

    // Initial collaborators
    this.getDocumentCollaborators(documentId).then((collaborators) => {
      const initialPresence = collaborators.map((userId) => ({
        userId,
        status: 'offline',
        lastActive: new Date(0).toISOString(),
      }));

      subject.next(initialPresence);
    });

    // Listen for presence updates
    const presenceObservables = Array.from(this.presenceUpdateSubjects.entries()).map(
      ([userId, presenceSubject]) => {
        return presenceSubject.asObservable().pipe(
          debounceTime(100),
          distinctUntilChanged((prev, curr) => prev.status === curr.status),
        );
      },
    );

    // Combine all presence updates
    const combinedObservable = presenceObservables.length > 0
      ? Observable.merge(...presenceObservables)
      : new Observable<PresenceUpdateEvent>();

    combinedObservable.subscribe({
      next: (update) => {
        this.getDocumentCollaborators(documentId).then((collaborators) => {
          if (collaborators.includes(update.userId)) {
            this.getCollaboratorsPresence(documentId).then((presence) => {
              subject.next(presence);
            });
          }
        });
      },
    });

    return subject.asObservable();
  }

  /**
   * Get current presence of document collaborators
   * @param documentId Document ID
   * @returns Array of presence updates
   */
  private async getCollaboratorsPresence(documentId: string): Promise<PresenceUpdateEvent[]> {
    const collaborators = await this.getDocumentCollaborators(documentId);
    const presencePromises = collaborators.map(async (userId) => {
      const cachedPresence = await this.cacheService.getAsync(`user:${userId}:presence`);
      if (cachedPresence) {
        return {
          userId,
          status: cachedPresence.status,
          lastActive: cachedPresence.lastActive,
        };
      }

      // Fallback to database
      try {
        const result = await this.connectionPool.withConnection('postgres', async (client) => {
          const query = `
            SELECT status, last_active FROM user_presence
            WHERE user_id = $1
          `;
          const { rows } = await client.query(query, [userId]);
          return rows[0];
        });

        return {
          userId,
          status: result?.status || 'offline',
          lastActive: result?.last_active || new Date(0).toISOString(),
        };
      } catch (err) {
        this.logger.error(`Error getting presence for user ${userId}: ${err.message}`);
        return {
          userId,
          status: 'offline',
          lastActive: new Date(0).toISOString(),
        };
      }
    });

    return Promise.all(presencePromises);
  }

  /**
   * Clean up on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    clearInterval(this.typingIndicatorInterval);

    // Complete all subjects
    this.documentUpdateSubjects.forEach((subject) => subject.complete());
    this.presenceUpdateSubjects.forEach((subject) => subject.complete());

    this.logger.log('RealtimeEventsService destroyed');
  }

  /**
   * Periodic cleanup of stale data
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStaleData(): Promise<void> {
    try {
      this.logger.log('Running periodic cleanup of stale data');

      // Clean up stale presence data
      await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          DELETE FROM user_presence
          WHERE last_active < NOW() - INTERVAL '24 hours'
        `;
        await client.query(query);
      });

      // Clean up old document history
      await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          DELETE FROM document_history
          WHERE modified_at < NOW() - INTERVAL '30 days'
        `;
        await client.query(query);
      });

      // Clean up old notifications
      await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          DELETE FROM notifications
          WHERE timestamp < NOW() - INTERVAL '90 days'
        `;
        await client.query(query);
      });
    } catch (err) {
      this.logger.error(`Error during periodic cleanup: ${err.message}`);
    }
  }
}
```

### Client-Side WebSocket Integration

```typescript
// websocket-client.service.ts
import { Injectable, Logger, OnDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subject, Observable, BehaviorSubject, fromEvent, merge } from 'rxjs';
import { filter, map, share, takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

interface WebSocketConfig {
  url: string;
  path?: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  randomizationFactor?: number;
  timeout?: number;
  autoConnect?: boolean;
  query?: Record<string, any>;
  auth?: Record<string, any>;
}

interface WebSocketEvent {
  event: string;
  data: any;
  timestamp: number;
}

interface DocumentUpdate {
  documentId: string;
  content: any;
  version: number;
  lastModifiedBy: string;
  timestamp: string;
}

interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastActive: string;
  currentRoom?: string;
}

interface Notification {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
}

@Injectable()
export class WebsocketClientService implements OnDestroy {
  private readonly logger = new Logger(WebsocketClientService.name);
  private socket: Socket | null = null;
  private readonly eventSubject = new Subject<WebSocketEvent>();
  private readonly connectionStatus = new BehaviorSubject<boolean>(false);
  private readonly reconnectionAttempts = new BehaviorSubject<number>(0);
  private readonly destroy$ = new Subject<void>();
  private readonly pendingRequests: Map<string, { resolve: (data: any) => void; reject: (err: Error) => void }> = new Map();
  private readonly documentUpdateSubjects: Map<string, Subject<DocumentUpdate>> = new Map();
  private readonly presenceUpdateSubjects: Map<string, Subject<PresenceUpdate>> = new Map();
  private readonly typingIndicators: Map<string, { userId: string; timestamp: number }> = new Map();
  private readonly typingIndicatorTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly messageQueue: any[] = [];
  private isConnecting = false;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    // Initialize WebSocket connection
    this.initialize();

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize WebSocket connection
   */
  private initialize(): void {
    const config: WebSocketConfig = {
      url: this.configService.get<string>('WS_URL', 'http://localhost:3000'),
      path: this.configService.get<string>('WS_PATH', '/ws'),
      reconnection: true,
      reconnectionAttempts: this.configService.get<number>('WS_RECONNECTION_ATTEMPTS', 10),
      reconnectionDelay: this.configService.get<number>('WS_RECONNECTION_DELAY', 1000),
      reconnectionDelayMax: this.configService.get<number>('WS_RECONNECTION_DELAY_MAX', 5000),
      randomizationFactor: this.configService.get<number>('WS_RANDOMIZATION_FACTOR', 0.5),
      timeout: this.configService.get<number>('WS_TIMEOUT', 20000),
      autoConnect: false,
      query: {
        clientType: 'mobile-app',
        version: this.configService.get<string>('APP_VERSION'),
      },
      auth: {
        token: this.configService.get<string>('WS_AUTH_TOKEN'),
      },
    };

    this.socket = io(config.url, config);

    // Set up connection status observable
    this.connectionStatus.next(false);
  }

  /**
   * Set up WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.logger.log('WebSocket connected');
      this.connectionStatus.next(true);
      this.reconnectionAttempts.next(0);

      // Process queued messages
      this.processMessageQueue();
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.log(`WebSocket disconnected: ${reason}`);
      this.connectionStatus.next(false);

      // Clean up typing indicators
      this.cleanupTypingIndicators();
    });

    this.socket.on('connect_error', (err) => {
      this.logger.error(`WebSocket connection error: ${err.message}`);
      this.connectionStatus.next(false);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      this.logger.log(`WebSocket reconnection attempt ${attempt}`);
      this.reconnectionAttempts.next(attempt);
    });

    this.socket.on('reconnect_failed', () => {
      this.logger.error('WebSocket reconnection failed');
      this.connectionStatus.next(false);
    });

    // Custom events
    this.socket.on('connection:established', (data) => {
      this.logger.log(`WebSocket connection established: ${JSON.stringify(data)}`);
      this.eventSubject.next({
        event: 'connection:established',
        data,
        timestamp: Date.now(),
      });
    });

    this.socket.on('document:update', (data: DocumentUpdate) => {
      this.logger.debug(`Document update received for ${data.documentId}`);
      this.eventSubject.next({
        event: 'document:update',
        data,
        timestamp: Date.now(),
      });

      // Emit to document-specific subject
      if (this.documentUpdateSubjects.has(data.documentId)) {
        this.documentUpdateSubjects.get(data.documentId)!.next(data);
      }
    });

    this.socket.on('document:typing', (data: { documentId: string; userId: string; isTyping: boolean }) => {
      this.logger.debug(`Typing indicator for ${data.documentId}: ${data.userId} is ${data.isTyping ? 'typing' : 'not typing'}`);
      this.eventSubject.next({
        event: 'document:typing',
        data,
        timestamp: Date.now(),
      });

      // Update typing indicators
      const key = `${data.documentId}:${data.userId}`;
      if (data.isTyping) {
        this.typingIndicators.set(key, {
          userId: data.userId,
          timestamp: Date.now(),
        });

        // Set timeout to remove indicator
        if (this.typingIndicatorTimeouts.has(key)) {
          clearTimeout(this.typingIndicatorTimeouts.get(key));
        }
        this.typingIndicatorTimeouts.set(
          key,
          setTimeout(() => {
            this.typingIndicators.delete(key);
            this.typingIndicatorTimeouts.delete(key);
          }, 3000),
        );
      } else {
        this.typingIndicators.delete(key);
        if (this.typingIndicatorTimeouts.has(key)) {
          clearTimeout(this.typingIndicatorTimeouts.get(key));
          this.typingIndicatorTimeouts.delete(key);
        }
      }
    });

    this.socket.on('presence:update', (data: PresenceUpdate) => {
      this.logger.debug(`Presence update for ${data.userId}: ${data.status}`);
      this.eventSubject.next({
        event: 'presence:update',
        data,
        timestamp: Date.now(),
      });

      // Emit to user-specific subject
      if (this.presenceUpdateSubjects.has(data.userId)) {
        this.presenceUpdateSubjects.get(data.userId)!.next(data);
      }
    });

    this.socket.on('presence:self:update', (data: PresenceUpdate) => {
      this.logger.debug(`Self presence update: ${data.status}`);
      this.eventSubject.next({
        event: 'presence:self:update',
        data,
        timestamp: Date.now(),
      });
    });

    this.socket.on('notification:received', (data: Notification) => {
      this.logger.debug(`Notification received: ${data.type}`);
      this.eventSubject.next({
        event: 'notification:received',
        data,
        timestamp: Date.now(),
      });

      // Emit application event
      this.eventEmitter.emit('notification:received', data);
    });

    this.socket.on('notification:unread:count', (data: { count: number }) => {
      this.logger.debug(`Unread notification count: ${data.count}`);
      this.eventSubject.next({
        event: 'notification:unread:count',
        data,
        timestamp: Date.now(),
      });
    });

    // Response to requests
    this.socket.on('response', (data: { requestId: string; success: boolean; data?: any; error?: string }) => {
      const { requestId, success, data: responseData, error } = data;
      const pendingRequest = this.pendingRequests.get(requestId);

      if (pendingRequest) {
        if (success) {
          pendingRequest.resolve(responseData);
        } else {
          pendingRequest.reject(new Error(error || 'Request failed'));
        }
        this.pendingRequests.delete(requestId);
      }
    });
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (!this.socket || this.connectionStatus.value || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.socket.connect();
    this.isConnecting = false;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (!this.socket || !this.connectionStatus.value) {
      return;
    }

    this.socket.disconnect();
  }

  /**
   * Reconnect to WebSocket server
   */
  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  /**
   * Get connection status observable
   * @returns Observable<boolean>
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable().pipe(
      distinctUntilChanged(),
      share(),
    );
  }

  /**
   * Get reconnection attempts observable
   * @returns Observable<number>
   */
  getReconnectionAttempts(): Observable<number> {
    return this.reconnectionAttempts.asObservable().pipe(
      distinctUntilChanged(),
      share(),
    );
  }

  /**
   * Get all events observable
   * @returns Observable<WebSocketEvent>
   */
  getEvents(): Observable<WebSocketEvent> {
    return this.eventSubject.asObservable().pipe(
      takeUntil(this.destroy$),
      share(),
    );
  }

  /**
   * Get observable for specific event type
   * @param event Event name
   * @returns Observable for the event
   */
  onEvent<T>(event: string): Observable<T> {
    return this.getEvents().pipe(
      filter((e) => e.event === event),
      map((e) => e.data as T),
      share(),
    );
  }

  /**
   * Get document update observable
   * @param documentId Document ID
   * @returns Observable<DocumentUpdate>
   */
  getDocumentUpdates(documentId: string): Observable<DocumentUpdate> {
    if (!this.documentUpdateSubjects.has(documentId)) {
      this.documentUpdateSubjects.set(documentId, new Subject<DocumentUpdate>());
    }

    return this.documentUpdateSubjects.get(documentId)!.asObservable().pipe(
      takeUntil(this.destroy$),
      share(),
    );
  }

  /**
   * Get presence update observable
   * @param userId User ID
   * @returns Observable<PresenceUpdate>
   */
  getPresenceUpdates(userId: string): Observable<PresenceUpdate> {
    if (!this.presenceUpdateSubjects.has(userId)) {
      this.presenceUpdateSubjects.set(userId, new Subject<PresenceUpdate>());
    }

    return this.presenceUpdateSubjects.get(userId)!.asObservable().pipe(
      takeUntil(this.destroy$),
      share(),
    );
  }

  /**
   * Get typing indicators for a document
   * @param documentId Document ID
   * @returns Observable of typing users
   */
  getTypingIndicators(documentId: string): Observable<string[]> {
    return merge(
      this.onEvent<{ documentId: string; userId: string; isTyping: boolean }>('document:typing').pipe(
        filter((data) => data.documentId === documentId),
      ),
      this.connectionStatus.pipe(
        filter((connected) => connected),
        map(() => ({ documentId, userId: '', isTyping: false })), // Trigger initial state
      ),
    ).pipe(
      debounceTime(100),
      map(() => {
        const typingUsers: string[] = [];
        this.typingIndicators.forEach((value, key) => {
          if (key.startsWith(`${documentId}:`)) {
            typingUsers.push(value.userId);
          }
        });
        return typingUsers;
      }),
      distinctUntilChanged((prev, curr) => {
        if (prev.length !== curr.length) return false;
        return prev.every((userId) => curr.includes(userId));
      }),
      share(),
    );
  }

  /**
   * Join a room
   * @param room Room name
   */
  joinRoom(room: string): void {
    if (!this.socket || !this.connectionStatus.value) {
      this.logger.warn('Cannot join room - WebSocket not connected');
      return;
    }

    this.socket.emit('join:room', { room });
    this.logger.debug(`Joined room: ${room}`);
  }

  /**
   * Leave a room
   * @param room Room name
   */
  leaveRoom(room: string): void {
    if (!this.socket || !this.connectionStatus.value) {
      this.logger.warn('Cannot leave room - WebSocket not connected');
      return;
    }

    this.socket.emit('leave:room', { room });
    this.logger.debug(`Left room: ${room}`);
  }

  /**
   * Send a document update
   * @param documentId Document ID
   * @param content Document content
   * @param version Document version
   */
  sendDocumentUpdate(documentId: string, content: any, version: number): void {
    const data = {
      documentId,
      content,
      version,
      timestamp: new Date().toISOString(),
    };

    this.emit('document:update', data);
  }

  /**
   * Send typing start event
   * @param documentId Document ID
   */
  sendTypingStart(documentId: string): void {
    this.emit('document:typing:start', { documentId });
  }

  /**
   * Send typing stop event
   * @param documentId Document ID
   */
  sendTypingStop(documentId: string): void {
    this.emit('document:typing:stop', { documentId });
  }

  /**
   * Update presence status
   * @param status Presence status
   * @param currentRoom Current room (optional)
   */
  updatePresence(status: 'online' | 'away', currentRoom?: string): void {
    this.emit('presence:update', {
      status,
      currentRoom,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Mark notification as read
   * @param notificationId Notification ID
   */
  markNotificationAsRead(notificationId: string): void {
    this.emit('notification:read', { notificationId });
  }

  /**
   * Get unread notification count
   */
  getUnreadNotificationCount(): void {
    this.emit('notification:unread:count:get');
  }

  /**
   * Make a request to the server
   * @param event Event name
   * @param data Data to send
   * @param timeout Request timeout in ms
   * @returns Promise with response data
   */
  request<T>(event: string, data: any, timeout: number = 5000): Promise<T> {
    if (!this.socket || !this.connectionStatus.value) {
      return Promise.reject(new Error('WebSocket not connected'));
    }

    const requestId = uuidv4();
    const requestData = { ...data, requestId };

    return new Promise<T>((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve: (data) => {
          clearTimeout(timeoutId);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        },
      });

      // Send request
      this.socket!.emit(event, requestData);
    });
  }

  /**
   * Emit an event to the server
   * @param event Event name
   * @param data Data to send
   */
  emit(event: string, data: any = {}): void {
    if (!this.socket) {
      this.logger.warn('Cannot emit - WebSocket not initialized');
      return;
    }

    if (!this.connectionStatus.value) {
      this.logger.debug(`WebSocket not connected, queuing event: ${event}`);
      this.messageQueue.push({ event, data });
      return;
    }

    try {
      this.socket.emit(event, data);
      this.logger.debug(`Emitted event: ${event}`);
    } catch (err) {
      this.logger.error(`Error emitting event ${event}: ${err.message}`);
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (!this.socket || !this.connectionStatus.value) {
      return;
    }

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.emit(message.event, message.data);
      }
    }
  }

  /**
   * Clean up typing indicators
   */
  private cleanupTypingIndicators(): void {
    this.typingIndicators.clear();
    this.typingIndicatorTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingIndicatorTimeouts.clear();
  }

  /**
   * Get WebSocket statistics
   * @returns WebSocket statistics
   */
  getStats(): {
    isConnected: boolean;
    reconnectionAttempts: number;
    pendingRequests: number;
    messageQueueLength: number;
    documentUpdateSubjects: number;
    presenceUpdateSubjects: number;
  } {
    return {
      isConnected: this.connectionStatus.value,
      reconnectionAttempts: this.reconnectionAttempts.value,
      pendingRequests: this.pendingRequests.size,
      messageQueueLength: this.messageQueue.length,
      documentUpdateSubjects: this.documentUpdateSubjects.size,
      presenceUpdateSubjects: this.presenceUpdateSubjects.size,
    };
  }

  /**
   * Clean up on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.disconnect();

    // Complete all subjects
    this.eventSubject.complete();
    this.connectionStatus.complete();
    this.reconnectionAttempts.complete();

    this.documentUpdateSubjects.forEach((subject) => subject.complete());
    this.presenceUpdateSubjects.forEach((subject) => subject.complete());

    this.cleanupTypingIndicators();

    this.logger.log('WebsocketClientService destroyed');
  }
}
```

### Room/Channel Management

```typescript
// room-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket-gateway.service';
import { RedisCacheService } from '../redis/redis-cache.service';
import { ConnectionPoolService } from '../database/connection-pool.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Room {
  name: string;
  type: 'public' | 'private' | 'protected';
  createdBy: string;
  createdAt: string;
  lastActive: string;
  memberCount: number;
  metadata?: any;
}

interface RoomMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'banned';
}

interface RoomMessage {
  messageId: string;
  roomName: string;
  userId: string;
  content: any;
  timestamp: string;
  edited: boolean;
  metadata?: any;
}

interface RoomInvitation {
  invitationId: string;
  roomName: string;
  invitedBy: string;
  invitedUserId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
}

@Injectable()
export class RoomManagerService {
  private readonly logger = new Logger(RoomManagerService.name);
  private readonly roomUpdateSubjects: Map<string, Subject<Room>> = new Map();
  private readonly memberUpdateSubjects: Map<string, Subject<RoomMember[]>> = new Map();
  private readonly messageUpdateSubjects: Map<string, Subject<RoomMessage>> = new Map();
  private readonly typingIndicators: Map<string, Set<string>> = new Map();

  constructor(
    private websocketGateway: WebsocketGateway,
    private cacheService: RedisCacheService,
    private connectionPool: ConnectionPoolService,
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
  ) {
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for user connections/disconnections
    this.eventEmitter.on('user:connected', (data: { userId: string; clientId: string }) => {
      this.handleUserConnected(data.userId, data.clientId);
    });

    this.eventEmitter.on('user:disconnected', (data: { userId: string; clientId: string }) => {
      this.handleUserDisconnected(data.userId, data.clientId);
    });

    // Listen for typing events
    this.websocketGateway['server'].on('document:typing:start', (data: { documentId: string; userId: string }) => {
      this.handleTypingStart(data.documentId, data.userId);
    });

    this.websocketGateway['server'].on('document:typing:stop', (data: { documentId: string; userId: string }) => {
      this.handleTypingStop(data.documentId, data.userId);
    });
  }

  /**
   * Create a new room
   * @param roomName Room name
   * @param type Room type
   * @param createdBy User ID who created the room
   * @param metadata Additional room metadata
   * @returns Created room
   */
  async createRoom(roomName: string, type: 'public' | 'private' | 'protected', createdBy: string, metadata?: any): Promise<Room> {
    try {
      // Validate room name
      if (!this.isValidRoomName(roomName)) {
        throw new Error('Invalid room name');
      }

      // Check if room already exists
      const existingRoom = await this.getRoom(roomName);
      if (existingRoom) {
        throw new Error('Room already exists');
      }

      // Create room in database
      const room = await this.connectionPool.withTransaction(async (client) => {
        const now = new Date().toISOString();

        // Insert room
        const roomQuery = `
          INSERT INTO rooms (name, type, created_by, created_at, last_active, metadata)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const roomResult = await client.query(roomQuery, [
          roomName,
          type,
          createdBy,
          now,
          now,
          metadata || {},
        ]);

        // Add creator as owner
        const memberQuery = `
          INSERT INTO room_members (room_name, user_id, role, joined_at, last_active, status)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await client.query(memberQuery, [
          roomName,
          createdBy,
          'owner',
          now,
          now,
          'active',
        ]);

        return roomResult.rows[0];
      });

      // Cache the room
      await this.cacheService.set(`room:${roomName}`, room, 86400);

      // Join the room
      this.websocketGateway.joinRoom(this.websocketGateway['connectedClients'].get(createdBy)?.id, roomName);

      // Emit room created event
      this.eventEmitter.emit('room:created', room);

      // Notify room update
      this.notifyRoomUpdate(roomName);

      return this.mapRoom(room);
    } catch (err) {
      this.logger.error(`Error creating room ${roomName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get room information
   * @param roomName Room name
   * @returns Room information or null if not found
   */
  async getRoom(roomName: string): Promise<Room | null> {
    try {
      // Check cache first
      const cachedRoom = await this.cacheService.getAsync(`room:${roomName}`);
      if (cachedRoom) {
        return this.mapRoom(cachedRoom);
      }

      // Get from database
      const room = await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          SELECT * FROM rooms
          WHERE name = $1
        `;
        const result = await client.query(query, [roomName]);
        return result.rows[0] || null;
      });

      if (room) {
        // Cache the room
        await this.cacheService.set(`room:${roomName}`, room, 3600);
        return this.mapRoom(room);
      }

      return null;
    } catch (err) {
      this.logger.error(`Error getting room ${roomName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Update room information
   * @param roomName Room name
   * @param updates Room updates
   * @param updatedBy User ID who updated the room
   * @returns Updated room
   */
  async updateRoom(roomName: string, updates: Partial<Omit<Room, 'name' | 'createdBy' | 'createdAt'>>, updatedBy: string): Promise<Room> {
    try {
      // Check if user has permission to update the room
      const hasPermission = await this.hasRoomPermission(roomName, updatedBy, ['owner', 'admin']);
      if (!hasPermission) {
        throw new Error('Permission denied');
      }

      // Update room in database
      const room = await this.connectionPool.withConnection('postgres', async (client) => {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
          if (key !== 'name' && key !== 'createdBy' && key !== 'createdAt') {
            setClauses.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        });

        if (setClauses.length === 0) {
          throw new Error('No valid updates provided');
        }

        values.push(roomName);
        const query = `
          UPDATE rooms
          SET ${setClauses.join(', ')}, last_active = NOW()
          WHERE name = $${paramIndex}
          RETURNING *
        `;

        const result = await client.query(query, values);
        return result.rows[0];
      });

      // Update cache
      await this.cacheService.set(`room:${roomName}`, room, 86400);

      // Notify room update
      this.notifyRoomUpdate(roomName);

      return this.mapRoom(room);
    } catch (err) {
      this.logger.error(`Error updating room ${roomName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Delete a room
   * @param roomName Room name
   * @param deletedBy User ID who deleted the room
   */
  async deleteRoom(roomName: string, deletedBy: string): Promise<void> {
    try {
      // Check if user has permission to delete the room
      const hasPermission = await this.hasRoomPermission(roomName, deletedBy, ['owner']);
      if (!hasPermission) {
        throw new Error('Permission denied');
      }

      // Delete room from database
      await this.connectionPool.withConnection('postgres', async (client) => {
        await client.query('BEGIN');

        // Delete room members
        const membersQuery = `
          DELETE FROM room_members
          WHERE room_name = $1
        `;
        await client.query(membersQuery, [roomName]);

        // Delete room messages
        const messagesQuery = `
          DELETE FROM room_messages
          WHERE room_name = $1
        `;
        await client.query(messagesQuery, [roomName]);

        // Delete room invitations
        const invitationsQuery = `
          DELETE FROM room_invitations
          WHERE room_name = $1
        `;
        await client.query(invitationsQuery, [roomName]);

        // Delete room
        const roomQuery = `
          DELETE FROM rooms
          WHERE name = $1
        `;
        await client.query(roomQuery, [roomName]);

        await client.query('COMMIT');
      });

      // Remove from cache
      await this.cacheService.del(`room:${roomName}`);

      // Notify all clients in the room to leave
      this.websocketGateway.broadcastToRoom(roomName, 'room:deleted', { roomName });

      // Remove all clients from the room
      const clients = this.websocketGateway.getClientsInRoom(roomName);
      clients.forEach((clientId) => {
        this.websocketGateway.leaveRoom(clientId, roomName);
      });

      // Emit room deleted event
      this.eventEmitter.emit('room:deleted', { roomName, deletedBy });
    } catch (err) {
      this.logger.error(`Error deleting room ${roomName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Join a room
   * @param roomName Room name
   * @param userId User ID joining the room
   * @param role Role to assign (optional)
   * @returns Room member information
   */
  async joinRoom(roomName: string, userId: string, role?: 'admin' | 'member' | 'guest'): Promise<RoomMember> {
    try {
      // Get the room
      const room = await this.getRoom(roomName);
      if (!room) {
        throw new Error('Room not found');
      }

      // Check if user is already a member
      const existingMember = await this.getRoomMember(roomName, userId);
      if (existingMember) {
        if (existingMember.status === 'banned') {
          throw new Error('User is banned from this room');
        }
        return existingMember;
      }

      // Check room type and permissions
      if (room.type === 'private') {
        // Check if user has an invitation
        const invitation = await this.getPendingInvitation(roomName, userId);
        if (!invitation) {
          throw new Error('Invitation required for private rooms');
        }

        // Accept the invitation
        await this.acceptInvitation(invitation.invitationId, userId);
      } else if (room.type === 'protected') {
        // For protected rooms, we might want to add additional checks
        // For now, we'll allow joining but this could be extended
      }

      // Add member to database
      const member = await this.connectionPool.withConnection('postgres', async (client) => {
        const now = new Date().toISOString();

        const query = `
          INSERT INTO room_members (room_name, user_id, role, joined_at, last_active, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        const result = await client.query(query, [
          roomName,
          userId,
          role || 'member',
          now,
          now,
          'active',
        ]);

        return result.rows[0];
      });

      // Update room member count
      await this.updateRoomMemberCount(roomName);

      // Join the room
      const clientId = await this.cacheService.getAsync(`ws:user:${userId}`);
      if (clientId) {
        this.websocketGateway.joinRoom(clientId, roomName);
      }

      // Cache the member
      await this.cacheService.set(`room:${roomName}:member:${userId}`, member, 86400);

      // Notify room update
      this.notifyRoomUpdate(roomName);

      // Notify member update
      this.notifyMemberUpdate(roomName);

      return this.mapRoomMember(member);
    } catch (err) {
      this.logger.error(`Error joining room ${roomName} for user ${userId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Leave a room
   * @param roomName Room name
   * @param userId User ID leaving the room
   */
  async leaveRoom(roomName: string, userId: string): Promise<void> {
    try {
      // Check if user is a member
      const member = await this.getRoomMember(roomName, userId);
      if (!member) {
        throw new Error('User is not a member of this room');
      }

      // Check if user is the owner
      if (member.role === 'owner') {
        throw new Error('Owners cannot leave the room. Transfer ownership first.');
      }

      // Remove member from database
      await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          DELETE FROM room_members
          WHERE room_name = $1 AND user_id = $2
        `;
        await client.query(query, [roomName, userId]);
      });

      // Update room member count
      await this.updateRoomMemberCount(roomName);

      // Leave the room
      const clientId = await this.cacheService.getAsync(`ws:user:${userId}`);
      if (clientId) {
        this.websocketGateway.leaveRoom(clientId, roomName);
      }

      // Remove from cache
      await this.cacheService.del(`room:${roomName}:member:${userId}`);

      // Notify room update
      this.notifyRoomUpdate(roomName);

      // Notify member update
      this.notifyMemberUpdate(roomName);
    } catch (err) {
      this.logger.error(`Error leaving room ${roomName} for user ${userId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get room members
   * @param roomName Room name
   * @returns Array of room members
   */
  async getRoomMembers(roomName: string): Promise<RoomMember[]> {
    try {
      // Check cache first
      const cachedMembers = await this.cacheService.getAsync(`room:${roomName}:members`);
      if (cachedMembers) {
        return cachedMembers.map(this.mapRoomMember);
      }

      // Get from database
      const members = await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          SELECT * FROM room_members
          WHERE room_name = $1 AND status != 'banned'
          ORDER BY role DESC, joined_at ASC
        `;
        const result = await client.query(query, [roomName]);
        return result.rows;
      });

      // Cache the members
      await this.cacheService.set(`room:${roomName}:members`, members, 3600);

      return members.map(this.mapRoomMember);
    } catch (err) {
      this.logger.error(`Error getting members for room ${roomName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get room member information
   * @param roomName Room name
   * @param userId User ID
   * @returns Room member information or null if not found
   */
  async getRoomMember(roomName: string, userId: string): Promise<RoomMember | null> {
    try {
      // Check cache first
      const cachedMember = await this.cacheService.getAsync(`room:${roomName}:member:${userId}`);
      if (cachedMember) {
        return this.mapRoomMember(cachedMember);
      }

      // Get from database
      const member = await this.connectionPool.withConnection('postgres', async (client) => {
        const query = `
          SELECT * FROM room_members
          WHERE room_name = $1 AND user_id = $2
        `;
       