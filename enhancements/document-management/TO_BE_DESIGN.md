# TO_BE_DESIGN.md - Document Management System (DMS) 2.0
*Comprehensive Next-Generation Enterprise Document Management Platform*

---

## Executive Vision (150+ lines)

### Strategic Transformation Goals

**1. Digital-First Enterprise Foundation**
The Document Management System 2.0 represents a paradigm shift from legacy file storage to an intelligent, AI-powered knowledge platform. By 2025, this system will:
- Reduce document retrieval time by 90% through predictive search and AI categorization
- Eliminate 95% of manual document processing via intelligent automation
- Achieve 100% compliance with global data protection regulations
- Enable seamless collaboration across 50+ enterprise applications

**2. Business Process Revolution**
The enhanced DMS will transform core business operations:
- **Procurement:** 70% faster contract lifecycle management with AI-powered clause analysis
- **HR:** 80% reduction in employee onboarding documentation processing time
- **Legal:** 60% decrease in compliance audit preparation time
- **Finance:** 90% faster invoice processing with intelligent OCR and data extraction

**3. Competitive Differentiation**
Key advantages over existing solutions:
- **Real-time collaboration** with WebSocket-powered simultaneous editing (100ms latency)
- **Predictive document generation** using LLM integration (30% faster document creation)
- **Automated compliance** with jurisdiction-aware policy enforcement
- **Enterprise-grade security** with quantum-resistant encryption for sensitive documents

### User Experience Transformation

**1. Unified Interface Paradigm**
- Single-pane-of-glass experience combining:
  - Document storage and versioning
  - Workflow automation
  - Team collaboration spaces
  - Advanced search and discovery
  - Analytics and reporting

**2. Intelligent Assistance Layer**
- Context-aware AI assistant providing:
  - Proactive document suggestions based on current work
  - Automated metadata tagging with 98% accuracy
  - Smart summarization of lengthy documents
  - Predictive search with 95% relevance ranking

**3. Progressive Enhancement**
- **Desktop:** Full-featured native experience with offline capabilities
- **Web:** Responsive PWA with 99.9% uptime
- **Mobile:** Native apps with AR document scanning (iOS/Android)
- **Wearables:** Apple Watch/Google Wear integration for notifications

### Long-Term Roadmap (2024-2027)

**2024 - Foundation Phase**
- Q1: Core platform migration to Kubernetes (99.99% uptime)
- Q2: AI/ML integration (document classification, OCR)
- Q3: Real-time collaboration features
- Q4: PWA with offline capabilities

**2025 - Intelligence Phase**
- Q1: Predictive document generation (LLM integration)
- Q2: Automated compliance engine
- Q3: Blockchain for document verification
- Q4: Quantum-resistant encryption

**2026 - Ecosystem Phase**
- Q1: Marketplace for third-party integrations
- Q2: Industry-specific templates and workflows
- Q3: IoT document capture (smart scanners, drones)
- Q4: Metaverse collaboration spaces

**2027 - Autonomous Phase**
- Q1: Self-optimizing document workflows
- Q2: Autonomous compliance monitoring
- Q3: AI-powered contract negotiation
- Q4: Fully autonomous document lifecycle management

### Business Impact Metrics

| KPI | Current State | Target 2025 | Target 2027 |
|-----|---------------|-------------|-------------|
| Document retrieval time | 2.5 minutes | <10 seconds | <2 seconds |
| Manual processing time | 40% of workflows | <5% | <1% |
| Compliance audit time | 120 hours | 20 hours | <5 hours |
| User adoption rate | 65% | 95% | 99% |
| Storage cost per TB | $120/month | $40/month | $15/month |
| Collaboration efficiency | 3.2 users/doc | 12+ users/doc | 50+ users/doc |

### Competitive Landscape Analysis

**Market Positioning:**
- **Against SharePoint/Box:** Superior AI capabilities and developer experience
- **Against Google Drive:** Better enterprise security and compliance features
- **Against Notion:** More robust document management and versioning
- **Against OpenText:** Modern architecture and lower TCO

**Unique Value Propositions:**
1. **AI-First Architecture:** Native integration of multiple AI models for different document types
2. **Developer Platform:** Comprehensive API and SDK for custom integrations
3. **Compliance Engine:** Automated policy enforcement across 120+ jurisdictions
4. **Real-Time Collaboration:** WebSocket-powered simultaneous editing with conflict resolution
5. **Progressive Web App:** Full offline capabilities with background sync

### Implementation Strategy

**Phased Rollout:**
1. **Pilot Phase (3 months):** 10% of users, core features only
2. **Departmental Rollout (6 months):** HR, Legal, Finance departments
3. **Enterprise-Wide (9 months):** All users with full feature set
4. **Continuous Improvement:** Quarterly feature updates

**Change Management:**
- **Training:** 20-hour certification program for power users
- **Adoption:** Gamification system with rewards for early adopters
- **Feedback:** Real-time sentiment analysis of user feedback
- **Support:** 24/7 AI-powered chatbot with human escalation

**Technical Strategy:**
- **Cloud-Native:** Kubernetes-based microservices architecture
- **Polyglot Persistence:** PostgreSQL (relational), MongoDB (documents), ElasticSearch (search)
- **Event-Driven:** Kafka for real-time event processing
- **Observability:** OpenTelemetry for comprehensive monitoring

### Financial Projections

**Investment:**
- Development: $8.2M (2024-2025)
- Infrastructure: $3.5M (2024-2027)
- Operations: $2.1M/year

**ROI:**
- Year 1: $12.4M (productivity gains)
- Year 2: $28.7M (process automation)
- Year 3: $45.2M (new revenue streams)
- 3-year ROI: 420%

**Cost Savings:**
- Document storage: 65% reduction
- Compliance costs: 70% reduction
- Manual processing: 85% reduction
- Paper usage: 95% reduction

---

## Performance Enhancements (300+ lines)

### Redis Caching Layer Implementation

```typescript
// src/cache/redis-cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { promisify } from 'util';
import { DocumentCacheKeyGenerator } from './document-cache-key-generator';
import { CacheTTL } from '../enums/cache-ttl.enum';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly redisClient: Redis;
  private readonly getAsync: (key: string) => Promise<string | null>;
  private readonly setAsync: (key: string, value: string, mode: string, duration: number) => Promise<string>;
  private readonly delAsync: (key: string) => Promise<number>;
  private readonly keysAsync: (pattern: string) => Promise<string[]>;

  constructor(
    private configService: ConfigService,
    private keyGenerator: DocumentCacheKeyGenerator
  ) {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB'),
      retryStrategy: (times: number) => Math.min(times * 100, 5000),
      reconnectOnError: (err: Error) => {
        this.logger.error(`Redis reconnection error: ${err.message}`);
        return true;
      }
    };

    this.redisClient = new Redis(redisConfig);

    // Promisify Redis methods
    this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
    this.setAsync = promisify(this.redisClient.set).bind(this.redisClient);
    this.delAsync = promisify(this.redisClient.del).bind(this.redisClient);
    this.keysAsync = promisify(this.redisClient.keys).bind(this.redisClient);

    // Event listeners
    this.redisClient.on('connect', () => {
      this.logger.log('Redis client connected');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.redisClient.on('reconnecting', () => {
      this.logger.warn('Redis client reconnecting');
    });
  }

  /**
   * Get cached value with automatic type conversion
   * @param key Cache key
   * @returns Cached value or null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.getAsync(key);
      if (!result) return null;

      try {
        return JSON.parse(result) as T;
      } catch (e) {
        this.logger.warn(`Failed to parse cached value for key ${key}: ${e.message}`);
        return null;
      }
    } catch (err) {
      this.logger.error(`Redis get error for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Set cache value with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds
   */
  async set<T>(key: string, value: T, ttl: number = CacheTTL.DEFAULT): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await this.setAsync(key, stringValue, 'EX', ttl);
    } catch (err) {
      this.logger.error(`Redis set error for key ${key}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Delete cache entry
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    try {
      await this.delAsync(key);
    } catch (err) {
      this.logger.error(`Redis delete error for key ${key}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Delete all keys matching pattern
   * @param pattern Key pattern
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.keysAsync(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } catch (err) {
      this.logger.error(`Redis delete by pattern error for ${pattern}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Cache document with version awareness
   * @param documentId Document ID
   * @param version Document version
   * @param data Document data
   */
  async cacheDocument(documentId: string, version: number, data: any): Promise<void> {
    const key = this.keyGenerator.generateDocumentKey(documentId, version);
    await this.set(key, data, CacheTTL.DOCUMENT);
  }

  /**
   * Get cached document
   * @param documentId Document ID
   * @param version Document version
   * @returns Cached document or null
   */
  async getCachedDocument(documentId: string, version: number): Promise<any> {
    const key = this.keyGenerator.generateDocumentKey(documentId, version);
    return this.get(key);
  }

  /**
   * Invalidate document cache
   * @param documentId Document ID
   */
  async invalidateDocumentCache(documentId: string): Promise<void> {
    const pattern = this.keyGenerator.generateDocumentPattern(documentId);
    await this.delByPattern(pattern);
  }

  /**
   * Cache document metadata
   * @param documentId Document ID
   * @param metadata Document metadata
   */
  async cacheDocumentMetadata(documentId: string, metadata: any): Promise<void> {
    const key = this.keyGenerator.generateMetadataKey(documentId);
    await this.set(key, metadata, CacheTTL.METADATA);
  }

  /**
   * Get cached document metadata
   * @param documentId Document ID
   * @returns Cached metadata or null
   */
  async getCachedDocumentMetadata(documentId: string): Promise<any> {
    const key = this.keyGenerator.generateMetadataKey(documentId);
    return this.get(key);
  }

  /**
   * Cache search results
   * @param query Search query
   * @param results Search results
   * @param ttl Custom TTL
   */
  async cacheSearchResults(query: string, results: any[], ttl?: number): Promise<void> {
    const key = this.keyGenerator.generateSearchKey(query);
    await this.set(key, results, ttl || CacheTTL.SEARCH);
  }

  /**
   * Get cached search results
   * @param query Search query
   * @returns Cached results or null
   */
  async getCachedSearchResults(query: string): Promise<any[] | null> {
    const key = this.keyGenerator.generateSearchKey(query);
    return this.get<any[]>(key);
  }

  /**
   * Cache user preferences
   * @param userId User ID
   * @param preferences User preferences
   */
  async cacheUserPreferences(userId: string, preferences: any): Promise<void> {
    const key = this.keyGenerator.generateUserPreferencesKey(userId);
    await this.set(key, preferences, CacheTTL.USER_PREFERENCES);
  }

  /**
   * Get cached user preferences
   * @param userId User ID
   * @returns Cached preferences or null
   */
  async getCachedUserPreferences(userId: string): Promise<any> {
    const key = this.keyGenerator.generateUserPreferencesKey(userId);
    return this.get(key);
  }

  /**
   * Cache document access control list
   * @param documentId Document ID
   * @param acl Access control list
   */
  async cacheDocumentACL(documentId: string, acl: any): Promise<void> {
    const key = this.keyGenerator.generateACLKey(documentId);
    await this.set(key, acl, CacheTTL.ACL);
  }

  /**
   * Get cached document ACL
   * @param documentId Document ID
   * @returns Cached ACL or null
   */
  async getCachedDocumentACL(documentId: string): Promise<any> {
    const key = this.keyGenerator.generateACLKey(documentId);
    return this.get(key);
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.redisClient.quit();
    } catch (err) {
      this.logger.error(`Error closing Redis connection: ${err.message}`);
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
import { Document } from '../entities/document.entity';
import { DocumentVersion } from '../entities/document-version.entity';
import { DocumentMetadata } from '../entities/document-metadata.entity';
import { User } from '../entities/user.entity';
import { DocumentAccessLog } from '../entities/document-access-log.entity';
import { QueryOptimizationConfig } from '../config/query-optimization.config';
import { PaginationOptions } from '../interfaces/pagination-options.interface';
import { DocumentSearchOptions } from '../interfaces/document-search-options.interface';

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentVersion)
    private documentVersionRepository: Repository<DocumentVersion>,
    @InjectRepository(DocumentMetadata)
    private documentMetadataRepository: Repository<DocumentMetadata>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(DocumentAccessLog)
    private documentAccessLogRepository: Repository<DocumentAccessLog>
  ) {}

  /**
   * Optimized document search with multiple filters
   */
  async optimizedDocumentSearch(
    options: DocumentSearchOptions,
    pagination: PaginationOptions
  ): Promise<{ data: Document[]; total: number }> {
    const { page = 1, limit = 20 } = pagination;
    const { searchTerm, documentTypes, statuses, dateRange, owners, tags, customFields } = options;

    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.currentVersion', 'currentVersion')
      .leftJoinAndSelect('document.metadata', 'metadata')
      .leftJoinAndSelect('document.owner', 'owner')
      .leftJoinAndSelect('document.tags', 'tags')
      .leftJoinAndSelect('document.accessLogs', 'accessLogs', 'accessLogs.accessedAt > :minAccessDate', {
        minAccessDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      })
      .where('document.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('document.isArchived = :isArchived', { isArchived: false });

    // Apply search term filter
    if (searchTerm) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('document.title ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
            .orWhere('document.description ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
            .orWhere('currentVersion.content ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
            .orWhere('metadata.keywords ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` });
        })
      );
    }

    // Apply document type filter
    if (documentTypes && documentTypes.length > 0) {
      queryBuilder.andWhere('document.documentType IN (:...documentTypes)', { documentTypes });
    }

    // Apply status filter
    if (statuses && statuses.length > 0) {
      queryBuilder.andWhere('document.status IN (:...statuses)', { statuses });
    }

    // Apply date range filter
    if (dateRange) {
      if (dateRange.from) {
        queryBuilder.andWhere('document.createdAt >= :fromDate', { fromDate: dateRange.from });
      }
      if (dateRange.to) {
        queryBuilder.andWhere('document.createdAt <= :toDate', { toDate: dateRange.to });
      }
    }

    // Apply owner filter
    if (owners && owners.length > 0) {
      queryBuilder.andWhere('document.ownerId IN (:...ownerIds)', { ownerIds: owners });
    }

    // Apply tag filter
    if (tags && tags.length > 0) {
      queryBuilder.andWhere('tags.id IN (:...tagIds)', { tagIds: tags });
    }

    // Apply custom field filters
    if (customFields && Object.keys(customFields).length > 0) {
      Object.entries(customFields).forEach(([field, value], index) => {
        queryBuilder.andWhere(`metadata.customFields->>:field = :value${index}`, {
          field,
          [`value${index}`]: JSON.stringify(value)
        });
      });
    }

    // Apply query optimization hints
    this.applyQueryOptimizations(queryBuilder);

    // Get total count for pagination
    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(this.getSortOptions(options.sortBy, options.sortOrder))
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Get document with all related data (optimized)
   */
  async getDocumentWithRelations(documentId: string): Promise<Document | null> {
    return this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.currentVersion', 'currentVersion')
      .leftJoinAndSelect('document.allVersions', 'allVersions')
      .leftJoinAndSelect('document.metadata', 'metadata')
      .leftJoinAndSelect('document.owner', 'owner')
      .leftJoinAndSelect('document.collaborators', 'collaborators')
      .leftJoinAndSelect('document.tags', 'tags')
      .leftJoinAndSelect('document.comments', 'comments', 'comments.isDeleted = :isDeleted', { isDeleted: false })
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('document.accessLogs', 'accessLogs', 'accessLogs.accessedAt > :minAccessDate', {
        minAccessDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      })
      .leftJoinAndSelect('document.relatedDocuments', 'relatedDocuments')
      .where('document.id = :documentId', { documentId })
      .andWhere('document.isDeleted = :isDeleted', { isDeleted: false })
      .getOne();
  }

  /**
   * Get recent documents for user (optimized)
   */
  async getRecentDocuments(userId: string, limit: number = 10): Promise<Document[]> {
    return this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.currentVersion', 'currentVersion')
      .leftJoinAndSelect('document.metadata', 'metadata')
      .leftJoin('document.accessLogs', 'accessLogs', 'accessLogs.userId = :userId', { userId })
      .where('document.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('document.isArchived = :isArchived', { isArchived: false })
      .orderBy('accessLogs.accessedAt', 'DESC')
      .distinct(true)
      .limit(limit)
      .getMany();
  }

  /**
   * Get documents by multiple IDs (optimized)
   */
  async getDocumentsByIds(documentIds: string[]): Promise<Document[]> {
    if (documentIds.length === 0) return [];

    // Batch processing for large ID sets
    const batchSize = QueryOptimizationConfig.MAX_IN_CLAUSE_SIZE;
    const batches = [];

    for (let i = 0; i < documentIds.length; i += batchSize) {
      batches.push(documentIds.slice(i, i + batchSize));
    }

    const results = await Promise.all(
      batches.map(batch =>
        this.documentRepository
          .createQueryBuilder('document')
          .leftJoinAndSelect('document.currentVersion', 'currentVersion')
          .leftJoinAndSelect('document.metadata', 'metadata')
          .where('document.id IN (:...ids)', { ids: batch })
          .andWhere('document.isDeleted = :isDeleted', { isDeleted: false })
          .getMany()
      )
    );

    return results.flat();
  }

  /**
   * Get document versions with pagination (optimized)
   */
  async getDocumentVersions(
    documentId: string,
    pagination: PaginationOptions
  ): Promise<{ data: DocumentVersion[]; total: number }> {
    const { page = 1, limit = 20 } = pagination;

    const [data, total] = await this.documentVersionRepository
      .createQueryBuilder('version')
      .leftJoinAndSelect('version.createdBy', 'createdBy')
      .where('version.documentId = :documentId', { documentId })
      .andWhere('version.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('version.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Get document access logs (optimized)
   */
  async getDocumentAccessLogs(
    documentId: string,
    pagination: PaginationOptions
  ): Promise<{ data: DocumentAccessLog[]; total: number }> {
    const { page = 1, limit = 20 } = pagination;

    const [data, total] = await this.documentAccessLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .where('log.documentId = :documentId', { documentId })
      .orderBy('log.accessedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Apply query optimization hints
   */
  private applyQueryOptimizations(queryBuilder: SelectQueryBuilder<any>): void {
    // Add query hints for PostgreSQL
    queryBuilder.addSelect('document.id', 'document_id');

    // Use materialized path for hierarchical queries
    if (queryBuilder.expressionMap.mainAlias?.metadata.tableName === 'document') {
      queryBuilder.addSelect('document.path', 'document_path');
    }

    // Add join conditions to prevent Cartesian products
    queryBuilder.expressionMap.joinAttributes.forEach(join => {
      if (join.condition) {
        queryBuilder.andWhere(join.condition);
      }
    });

    // Add query timeout
    queryBuilder.setQueryRunnerOptions({
      queryTimeout: QueryOptimizationConfig.QUERY_TIMEOUT_MS
    });
  }

  /**
   * Get sort options for query
   */
  private getSortOptions(sortBy?: string, sortOrder: 'ASC' | 'DESC' = 'DESC'): any {
    const defaultSort = { 'document.updatedAt': sortOrder };

    if (!sortBy) return defaultSort;

    const sortMap = {
      title: 'document.title',
      createdAt: 'document.createdAt',
      updatedAt: 'document.updatedAt',
      size: 'currentVersion.size',
      views: 'document.viewCount',
      relevance: 'document.relevanceScore'
    };

    const column = sortMap[sortBy] || sortMap.updatedAt;
    return { [column]: sortOrder };
  }

  /**
   * Get document statistics (optimized)
   */
  async getDocumentStatistics(documentId: string): Promise<any> {
    const document = await this.documentRepository
      .createQueryBuilder('document')
      .select([
        'COUNT(DISTINCT allVersions.id) as versionCount',
        'SUM(CASE WHEN allVersions.isCurrent = true THEN 1 ELSE 0 END) as currentVersion',
        'COUNT(DISTINCT collaborators.id) as collaboratorCount',
        'COUNT(DISTINCT comments.id) as commentCount',
        'COUNT(DISTINCT accessLogs.id) as accessCount',
        'MAX(accessLogs.accessedAt) as lastAccessedAt'
      ])
      .leftJoin('document.allVersions', 'allVersions')
      .leftJoin('document.collaborators', 'collaborators')
      .leftJoin('document.comments', 'comments', 'comments.isDeleted = :isDeleted', { isDeleted: false })
      .leftJoin('document.accessLogs', 'accessLogs')
      .where('document.id = :documentId', { documentId })
      .getRawOne();

    return {
      versionCount: parseInt(document.versionCount) || 0,
      currentVersion: parseInt(document.currentVersion) || 0,
      collaboratorCount: parseInt(document.collaboratorCount) || 0,
      commentCount: parseInt(document.commentCount) || 0,
      accessCount: parseInt(document.accessCount) || 0,
      lastAccessedAt: document.lastAccessedAt
    };
  }

  /**
   * Get user document activity (optimized)
   */
  async getUserDocumentActivity(userId: string, days: number = 30): Promise<any> {
    const minDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [created, edited, viewed] = await Promise.all([
      this.documentRepository
        .createQueryBuilder('document')
        .where('document.ownerId = :userId', { userId })
        .andWhere('document.createdAt >= :minDate', { minDate })
        .getCount(),

      this.documentVersionRepository
        .createQueryBuilder('version')
        .where('version.createdById = :userId', { userId })
        .andWhere('version.createdAt >= :minDate', { minDate })
        .getCount(),

      this.documentAccessLogRepository
        .createQueryBuilder('log')
        .where('log.userId = :userId', { userId })
        .andWhere('log.accessedAt >= :minDate', { minDate })
        .getCount()
    ]);

    return {
      documentsCreated: created,
      documentsEdited: edited,
      documentsViewed: viewed,
      activityScore: created * 2 + edited * 1.5 + viewed * 0.5
    };
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
import { CompressionConfig } from '../config/compression.config';
import { Logger } from '@nestjs/common';

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ResponseCompressionMiddleware.name);
  private readonly compressionMiddleware: (req: Request, res: Response, next: NextFunction) => void;

  constructor(private configService: ConfigService) {
    // Configure compression options
    const compressionOptions: compression.CompressionOptions = {
      level: this.configService.get<number>('COMPRESSION_LEVEL', CompressionConfig.DEFAULT_LEVEL),
      threshold: this.configService.get<number>('COMPRESSION_THRESHOLD', CompressionConfig.DEFAULT_THRESHOLD),
      filter: this.shouldCompress.bind(this),
      chunkSize: this.configService.get<number>('COMPRESSION_CHUNK_SIZE', CompressionConfig.DEFAULT_CHUNK_SIZE),
      windowBits: this.configService.get<number>('COMPRESSION_WINDOW_BITS', CompressionConfig.DEFAULT_WINDOW_BITS),
      memLevel: this.configService.get<number>('COMPRESSION_MEM_LEVEL', CompressionConfig.DEFAULT_MEM_LEVEL),
      strategy: this.configService.get<number>('COMPRESSION_STRATEGY', CompressionConfig.DEFAULT_STRATEGY)
    };

    this.compressionMiddleware = compression(compressionOptions);

    this.logger.log('Response compression middleware initialized with options:', compressionOptions);
  }

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Set compression-related headers
      this.setCompressionHeaders(req, res);

      // Apply compression middleware
      this.compressionMiddleware(req, res, next);
    } catch (err) {
      this.logger.error(`Error in response compression middleware: ${err.message}`);
      next(err);
    }
  }

  /**
   * Determine if response should be compressed
   */
  private shouldCompress(req: Request, res: Response): boolean {
    // Never compress responses that are already compressed
    if (res.getHeader('Content-Encoding')) {
      return false;
    }

    // Never compress responses with cache-control: no-transform
    if (res.getHeader('Cache-Control')?.includes('no-transform')) {
      return false;
    }

    // Don't compress small responses
    const contentLength = res.getHeader('Content-Length');
    if (contentLength && parseInt(contentLength as string) < CompressionConfig.MIN_COMPRESS_SIZE) {
      return false;
    }

    // Don't compress certain content types
    const contentType = res.getHeader('Content-Type') as string;
    if (contentType) {
      const excludedTypes = [
        'image/',
        'video/',
        'audio/',
        'application/pdf',
        'application/zip',
        'application/gzip',
        'application/x-rar-compressed',
        'application/x-tar'
      ];

      if (excludedTypes.some(type => contentType.includes(type))) {
        return false;
      }
    }

    // Compress based on accept-encoding header
    const acceptEncoding = req.headers['accept-encoding'] as string;
    if (!acceptEncoding) {
      return false;
    }

    // Check for supported compression algorithms
    const supportedAlgorithms = this.configService.get<string>('COMPRESSION_ALGORITHMS', 'gzip, deflate, br').split(',');
    return supportedAlgorithms.some(algo => acceptEncoding.includes(algo.trim()));
  }

  /**
   * Set compression-related headers
   */
  private setCompressionHeaders(req: Request, res: Response): void {
    // Set Vary header to ensure caches consider Accept-Encoding
    const vary = res.getHeader('Vary') as string || '';
    if (!vary.includes('Accept-Encoding')) {
      res.setHeader('Vary', vary ? `${vary}, Accept-Encoding` : 'Accept-Encoding');
    }

    // Set compression algorithm preference
    const acceptEncoding = req.headers['accept-encoding'] as string;
    if (acceptEncoding) {
      const algorithms = this.configService.get<string>('COMPRESSION_ALGORITHMS', 'gzip, deflate, br').split(',');
      const preferredAlgorithm = algorithms.find(algo => acceptEncoding.includes(algo.trim()));

      if (preferredAlgorithm) {
        res.locals.preferredCompressionAlgorithm = preferredAlgorithm.trim();
      }
    }
  }
}
```

### Lazy Loading Implementation

```typescript
// src/utils/lazy-loader.util.ts
import { Injectable, Logger } from '@nestjs/common';
import { Document } from '../entities/document.entity';
import { DocumentVersion } from '../entities/document-version.entity';
import { DocumentMetadata } from '../entities/document-metadata.entity';
import { User } from '../entities/user.entity';
import { Tag } from '../entities/tag.entity';
import { Comment } from '../entities/comment.entity';
import { DocumentAccessLog } from '../entities/document-access-log.entity';
import { QueryRunner, SelectQueryBuilder } from 'typeorm';
import { LazyLoadConfig } from '../config/lazy-load.config';
import { PaginationOptions } from '../interfaces/pagination-options.interface';

@Injectable()
export class LazyLoaderUtil {
  private readonly logger = new Logger(LazyLoaderUtil.name);

  /**
   * Lazy load document versions
   */
  async lazyLoadDocumentVersions(
    documentId: string,
    queryRunner: QueryRunner,
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<DocumentVersion[]> {
    const { page = 1, limit = 10 } = pagination;

    try {
      return await queryRunner.manager
        .getRepository(DocumentVersion)
        .createQueryBuilder('version')
        .where('version.documentId = :documentId', { documentId })
        .andWhere('version.isDeleted = :isDeleted', { isDeleted: false })
        .orderBy('version.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();
    } catch (err) {
      this.logger.error(`Error lazy loading document versions: ${err.message}`);
      throw err;
    }
  }

  /**
   * Lazy load document collaborators
   */
  async lazyLoadDocumentCollaborators(
    documentId: string,
    queryRunner: QueryRunner,
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<User[]> {
    const { page = 1, limit = 20 } = pagination;

    try {
      return await queryRunner.manager
        .createQueryBuilder(User, 'user')
        .innerJoin('user.collaboratingDocuments', 'document', 'document.id = :documentId', { documentId })
        .where('user.isActive = :isActive', { isActive: true })
        .orderBy('user.lastName', 'ASC')
        .addOrderBy('user.firstName', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();
    } catch (err) {
      this.logger.error(`Error lazy loading document collaborators: ${err.message}`);
      throw err;
    }
  }

  /**
   * Lazy load document comments
   */
  async lazyLoadDocumentComments(
    documentId: string,
    queryRunner: QueryRunner,
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<Comment[]> {
    const { page = 1, limit = 10 } = pagination;

    try {
      return await queryRunner.manager
        .getRepository(Comment)
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.author', 'author')
        .where('comment.documentId = :documentId', { documentId })
        .andWhere('comment.isDeleted = :isDeleted', { isDeleted: false })
        .orderBy('comment.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();
    } catch (err) {
      this.logger.error(`Error lazy loading document comments: ${err.message}`);
      throw err;
    }
  }

  /**
   * Lazy load document access logs
   */
  async lazyLoadDocumentAccessLogs(
    documentId: string,
    queryRunner: QueryRunner,
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<DocumentAccessLog[]> {
    const { page = 1, limit = 20 } = pagination;

    try {
      return await queryRunner.manager
        .getRepository(DocumentAccessLog)
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user')
        .where('log.documentId = :documentId', { documentId })
        .orderBy('log.accessedAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();
    } catch (err) {
      this.logger.error(`Error lazy loading document access logs: ${err.message}`);
      throw err;
    }
  }

  /**
   * Lazy load document tags
   */
  async lazyLoadDocumentTags(
    documentId: string,
    queryRunner: QueryRunner
  ): Promise<Tag[]> {
    try {
      return await queryRunner.manager
        .getRepository(Tag)
        .createQueryBuilder('tag')
        .innerJoin('tag.documents', 'document', 'document.id = :documentId', { documentId })
        .orderBy('tag.name', 'ASC')
        .getMany();
    } catch (err) {
      this.logger.error(`Error lazy loading document tags: ${err.message}`);
      throw err;
    }
  }

  /**
   * Lazy load document metadata
   */
  async lazyLoadDocumentMetadata(
    documentId: string,
    queryRunner: QueryRunner
  ): Promise<DocumentMetadata | null> {
    try {
      return await queryRunner.manager
        .getRepository(DocumentMetadata)
        .createQueryBuilder('metadata')
        .where('metadata.documentId = :documentId', { documentId })
        .getOne();
    } catch (err) {
      this.logger.error(`Error lazy loading document metadata: ${err.message}`);
      throw err;
    }
  }

  /**
   * Lazy load document with minimal relations
   */
  async lazyLoadDocument(
    documentId: string,
    queryRunner: QueryRunner
  ): Promise<Document | null> {
    try {
      return await queryRunner.manager
        .getRepository(Document)
        .createQueryBuilder('document')
        .leftJoinAndSelect('document.currentVersion', 'currentVersion')
        .leftJoinAndSelect('document.owner', 'owner')
        .where('document.id = :documentId', { documentId })
        .andWhere('document.isDeleted = :isDeleted', { isDeleted: false })
        .getOne();
    } catch (err) {
      this.logger.error(`Error lazy loading document: ${err.message}`);
      throw err;
    }
  }

  /**
   * Create a lazy loading proxy for document relations
   */
  createLazyLoadingProxy<T>(
    documentId: string,
    relationName: string,
    queryRunner: QueryRunner,
    pagination: PaginationOptions = { page: 1, limit: LazyLoadConfig.DEFAULT_LIMIT }
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      // Create a proxy that loads the data when accessed
      const proxy = new Proxy([], {
        get: (target, prop) => {
          if (prop === 'then') {
            // If someone tries to await the proxy, load the data
            return (resolveFn: (value: T[]) => void, rejectFn: (reason: any) => void) => {
              this.loadLazyRelation(documentId, relationName, queryRunner, pagination)
                .then(resolveFn)
                .catch(rejectFn);
            };
          }

          // For other properties, return the target's property
          return Reflect.get(target, prop);
        }
      });

      return proxy;
    });
  }

  /**
   * Load lazy relation data
   */
  private async loadLazyRelation<T>(
    documentId: string,
    relationName: string,
    queryRunner: QueryRunner,
    pagination: PaginationOptions
  ): Promise<T[]> {
    try {
      switch (relationName) {
        case 'versions':
          return this.lazyLoadDocumentVersions(documentId, queryRunner, pagination) as unknown as T[];
        case 'collaborators':
          return this.lazyLoadDocumentCollaborators(documentId, queryRunner, pagination) as unknown as T[];
        case 'comments':
          return this.lazyLoadDocumentComments(documentId, queryRunner, pagination) as unknown as T[];
        case 'accessLogs':
          return this.lazyLoadDocumentAccessLogs(documentId, queryRunner, pagination) as unknown as T[];
        case 'tags':
          return this.lazyLoadDocumentTags(documentId, queryRunner) as unknown as T[];
        default:
          throw new Error(`Unsupported relation: ${relationName}`);
      }
    } catch (err) {
      this.logger.error(`Error loading lazy relation ${relationName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Create a lazy loading document with all relations
   */
  async createLazyDocument(
    documentId: string,
    queryRunner: QueryRunner
  ): Promise<Document> {
    try {
      // First load the basic document
      const basicDocument = await this.lazyLoadDocument(documentId, queryRunner);
      if (!basicDocument) {
        throw new Error(`Document with ID ${documentId} not found`);
      }

      // Create proxies for lazy loading relations
      const lazyDocument = new Proxy(basicDocument, {
        get: (target, prop) => {
          if (prop === 'versions') {
            return this.createLazyLoadingProxy<DocumentVersion>(documentId, 'versions', queryRunner);
          } else if (prop === 'collaborators') {
            return this.createLazyLoadingProxy<User>(documentId, 'collaborators', queryRunner);
          } else if (prop === 'comments') {
            return this.createLazyLoadingProxy<Comment>(documentId, 'comments', queryRunner);
          } else if (prop === 'accessLogs') {
            return this.createLazyLoadingProxy<DocumentAccessLog>(documentId, 'accessLogs', queryRunner);
          } else if (prop === 'tags') {
            return this.createLazyLoadingProxy<Tag>(documentId, 'tags', queryRunner);
          } else if (prop === 'metadata') {
            return this.lazyLoadDocumentMetadata(documentId, queryRunner);
          }

          // For other properties, return the target's property
          return Reflect.get(target, prop);
        }
      });

      return lazyDocument;
    } catch (err) {
      this.logger.error(`Error creating lazy document: ${err.message}`);
      throw err;
    }
  }

  /**
   * Optimized query builder for lazy loading
   */
  createLazyQueryBuilder<T>(
    entity: new () => T,
    queryRunner: QueryRunner
  ): SelectQueryBuilder<T> {
    return queryRunner.manager.getRepository(entity).createQueryBuilder();
  }

  /**
   * Batch lazy loading of multiple documents
   */
  async batchLazyLoadDocuments(
    documentIds: string[],
    queryRunner: QueryRunner
  ): Promise<Document[]> {
    if (documentIds.length === 0) return [];

    try {
      // First load all basic documents
      const basicDocuments = await queryRunner.manager
        .getRepository(Document)
        .createQueryBuilder('document')
        .leftJoinAndSelect('document.currentVersion', 'currentVersion')
        .leftJoinAndSelect('document.owner', 'owner')
        .where('document.id IN (:...documentIds)', { documentIds })
        .andWhere('document.isDeleted = :isDeleted', { isDeleted: false })
        .getMany();

      // Create lazy loading proxies for each document
      return basicDocuments.map(doc => {
        return new Proxy(doc, {
          get: (target, prop) => {
            if (prop === 'versions') {
              return this.createLazyLoadingProxy<DocumentVersion>(doc.id, 'versions', queryRunner);
            } else if (prop === 'collaborators') {
              return this.createLazyLoadingProxy<User>(doc.id, 'collaborators', queryRunner);
            } else if (prop === 'comments') {
              return this.createLazyLoadingProxy<Comment>(doc.id, 'comments', queryRunner);
            } else if (prop === 'accessLogs') {
              return this.createLazyLoadingProxy<DocumentAccessLog>(doc.id, 'accessLogs', queryRunner);
            } else if (prop === 'tags') {
              return this.createLazyLoadingProxy<Tag>(doc.id, 'tags', queryRunner);
            } else if (prop === 'metadata') {
              return this.lazyLoadDocumentMetadata(doc.id, queryRunner);
            }

            return Reflect.get(target, prop);
          }
        });
      });
    } catch (err) {
      this.logger.error(`Error batch lazy loading documents: ${err.message}`);
      throw err;
    }
  }
}
```

### Request Debouncing

```typescript
// src/utils/request-debouncer.util.ts
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { DebounceConfig } from '../config/debounce.config';
import { promisify } from 'util';

@Injectable()
export class RequestDebouncer {
  private readonly logger = new Logger(RequestDebouncer.name);
  private readonly redisClient: Redis;
  private readonly getAsync: (key: string) => Promise<string | null>;
  private readonly setexAsync: (key: string, seconds: number, value: string) => Promise<string>;
  private readonly delAsync: (key: string) => Promise<number>;

  constructor(private configService: ConfigService) {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB_DEBOUNCE'),
      retryStrategy: (times: number) => Math.min(times * 100, 5000),
      reconnectOnError: (err: Error) => {
        this.logger.error(`Redis debounce reconnection error: ${err.message}`);
        return true;
      }
    };

    this.redisClient = new Redis(redisConfig);

    // Promisify Redis methods
    this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
    this.setexAsync = promisify(this.redisClient.setex).bind(this.redisClient);
    this.delAsync = promisify(this.redisClient.del).bind(this.redisClient);

    // Event listeners
    this.redisClient.on('connect', () => {
      this.logger.log('Debounce Redis client connected');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Debounce Redis error: ${err.message}`);
    });
  }

  /**
   * Debounce a request
   * @param key Unique key for the request
   * @param ttl Debounce time in milliseconds
   * @param callback Function to execute if not debounced
   * @returns Promise that resolves to the callback result or undefined if debounced
   */
  async debounce<T>(
    key: string,
    ttl: number = DebounceConfig.DEFAULT_TTL,
    callback: () => Promise<T>
  ): Promise<T | undefined> {
    try {
      // Check if key exists (request is already in progress)
      const existing = await this.getAsync(key);
      if (existing) {
        this.logger.debug(`Request debounced for key: ${key}`);
        return undefined;
      }

      // Set key with TTL (convert ms to seconds)
      await this.setexAsync(key, Math.ceil(ttl / 1000), '1');

      // Execute callback
      this.logger.debug(`Executing debounced request for key: ${key}`);
      return await callback();
    } catch (err) {
      this.logger.error(`Error in debounce for key ${key}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Debounce document operations
   */
  async debounceDocumentOperation<T>(
    documentId: string,
    operation: string,
    userId: string,
    callback: () => Promise<T>
  ): Promise<T | undefined> {
    const key = this.generateDocumentOperationKey(documentId, operation, userId);
    const ttl = this.getDocumentOperationTTL(operation);

    return this.debounce(key, ttl, callback);
  }

  /**
   * Debounce user operations
   */
  async debounceUserOperation<T>(
    userId: string,
    operation: string,
    callback: () => Promise<T>
  ): Promise<T | undefined> {
    const key = this.generateUserOperationKey(userId, operation);
    const ttl = this.getUserOperationTTL(operation);

    return this.debounce(key, ttl, callback);
  }

  /**
   * Debounce search operations
   */
  async debounceSearch<T>(
    query: string,
    userId: string,
    callback: () => Promise<T>
  ): Promise<T | undefined> {
    const key = this.generateSearchKey(query, userId);
    return this.debounce(key, DebounceConfig.SEARCH_TTL, callback);
  }

  /**
   * Cancel debounced request
   */
  async cancelDebounce(key: string): Promise<void> {
    try {
      await this.delAsync(key);
      this.logger.debug(`Cancelled debounced request for key: ${key}`);
    } catch (err) {
      this.logger.error(`Error cancelling debounce for key ${key}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Generate document operation key
   */
  private generateDocumentOperationKey(documentId: string, operation: string, userId: string): string {
    return `debounce:doc:${documentId}:${operation}:${userId}`;
  }

  /**
   * Generate user operation key
   */
  private generateUserOperationKey(userId: string, operation: string): string {
    return `debounce:user:${userId}:${operation}`;
  }

  /**
   * Generate search key
   */
  private generateSearchKey(query: string, userId: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    return `debounce:search:${normalizedQuery}:${userId}`;
  }

  /**
   * Get TTL for document operation
   */
  private getDocumentOperationTTL(operation: string): number {
    const ttlMap = {
      'save': DebounceConfig.DOCUMENT_SAVE_TTL,
      'update': DebounceConfig.DOCUMENT_UPDATE_TTL,
      'delete': DebounceConfig.DOCUMENT_DELETE_TTL,
      'share': DebounceConfig.DOCUMENT_SHARE_TTL,
      'comment': DebounceConfig.DOCUMENT_COMMENT_TTL,
      'download': DebounceConfig.DOCUMENT_DOWNLOAD_TTL
    };

    return ttlMap[operation] || DebounceConfig.DEFAULT_TTL;
  }

  /**
   * Get TTL for user operation
   */
  private getUserOperationTTL(operation: string): number {
    const ttlMap = {
      'profile-update': DebounceConfig.USER_PROFILE_UPDATE_TTL,
      'preferences-update': DebounceConfig.USER_PREFERENCES_UPDATE_TTL,
      'activity-log': DebounceConfig.USER_ACTIVITY_LOG_TTL
    };

    return ttlMap[operation] || DebounceConfig.DEFAULT_TTL;
  }

  /**
   * Check if request is currently debounced
   */
  async isDebounced(key: string): Promise<boolean> {
    try {
      const result = await this.getAsync(key);
      return result !== null;
    } catch (err) {
      this.logger.error(`Error checking debounce status for key ${key}: ${err.message}`);
      return false;
    }
  }

  /**
   * Get debounce status for document operation
   */
  async isDocumentOperationDebounced(documentId: string, operation: string, userId: string): Promise<boolean> {
    const key = this.generateDocumentOperationKey(documentId, operation, userId);
    return this.isDebounced(key);
  }

  /**
   * Get debounce status for user operation
   */
  async isUserOperationDebounced(userId: string, operation: string): Promise<boolean> {
    const key = this.generateUserOperationKey(userId, operation);
    return this.isDebounced(key);
  }

  /**
   * Get debounce status for search
   */
  async isSearchDebounced(query: string, userId: string): Promise<boolean> {
    const key = this.generateSearchKey(query, userId);
    return this.isDebounced(key);
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.redisClient.quit();
    } catch (err) {
      this.logger.error(`Error closing debounce Redis connection: ${err.message}`);
    }
  }
}
```

### Connection Pooling

```typescript
// src/database/connection-pool.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, PoolConfig } from 'pg';
import { ConnectionPoolConfig } from '../config/connection-pool.config';
import { QueryResult } from 'pg';
import { performance } from 'perf_hooks';

@Injectable()
export class ConnectionPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private pool: Pool;
  private readonly config: PoolConfig;
  private readonly connectionMetrics: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
    queryCount: number;
    queryTime: number;
  };

  constructor(private configService: ConfigService) {
    this.connectionMetrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      queryCount: 0,
      queryTime: 0
    };

    this.config = {
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
      max: this.configService.get<number>('DB_POOL_MAX', ConnectionPoolConfig.DEFAULT_MAX_POOL_SIZE),
      min: this.configService.get<number>('DB_POOL_MIN', ConnectionPoolConfig.DEFAULT_MIN_POOL_SIZE),
      idleTimeoutMillis: this.configService.get<number>('DB_POOL_IDLE_TIMEOUT', ConnectionPoolConfig.DEFAULT_IDLE_TIMEOUT),
      connectionTimeoutMillis: this.configService.get<number>('DB_POOL_CONNECTION_TIMEOUT', ConnectionPoolConfig.DEFAULT_CONNECTION_TIMEOUT),
      maxUses: this.configService.get<number>('DB_POOL_MAX_USES', ConnectionPoolConfig.DEFAULT_MAX_USES),
      application_name: 'document-management-system',
      ssl: this.configService.get<boolean>('DB_SSL', false) ? {
        rejectUnauthorized: this.configService.get<boolean>('DB_SSL_REJECT_UNAUTHORIZED', true),
        ca: this.configService.get<string>('DB_SSL_CA'),
        key: this.configService.get<string>('DB_SSL_KEY'),
        cert: this.configService.get<string>('DB_SSL_CERT')
      } : false
    };

    this.logger.log(`Initializing connection pool with config: ${JSON.stringify({
      ...this.config,
      password: '***',
      ssl: this.config.ssl ? { ...this.config.ssl, ca: '***', key: '***', cert: '***' } : false
    })}`);
  }

  async onModuleInit() {
    try {
      this.pool = new Pool(this.config);

      // Event listeners
      this.pool.on('connect', (client) => {
        this.connectionMetrics.totalConnections++;
        this.logger.debug(`New connection established. Total connections: ${this.connectionMetrics.totalConnections}`);
      });

      this.pool.on('acquire', (client) => {
        this.connectionMetrics.activeConnections++;
        this.connectionMetrics.idleConnections--;
        this.logger.debug(`Connection acquired. Active: ${this.connectionMetrics.activeConnections}, Idle: ${this.connectionMetrics.idleConnections}`);
      });

      this.pool.on('release', (err, client) => {
        this.connectionMetrics.activeConnections--;
        this.connectionMetrics.idleConnections++;
        if (err) {
          this.logger.error(`Error releasing connection: ${err.message}`);
        } else {
          this.logger.debug(`Connection released. Active: ${this.connectionMetrics.activeConnections}, Idle: ${this.connectionMetrics.idleConnections}`);
        }
      });

      this.pool.on('error', (err, client) => {
        this.logger.error(`Connection pool error: ${err.message}`);
      });

      this.pool.on('remove', (client) => {
        this.connectionMetrics.totalConnections--;
        this.logger.debug(`Connection removed. Total connections: ${this.connectionMetrics.totalConnections}`);
      });

      // Test the connection
      await this.testConnection();

      this.logger.log('Database connection pool initialized successfully');
    } catch (err) {
      this.logger.error(`Failed to initialize connection pool: ${err.message}`);
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.pool) {
        await this.pool.end();
        this.logger.log('Database connection pool closed');
      }
    } catch (err) {
      this.logger.error(`Error closing connection pool: ${err.message}`);
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('SELECT 1');
      this.logger.log('Database connection test successful');
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Get a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    try {
      this.connectionMetrics.waitingClients++;
      const startTime = performance.now();

      const client = await this.pool.connect();

      const endTime = performance.now();
      this.connectionMetrics.waitingClients--;

      this.logger.debug(`Acquired client in ${(endTime - startTime).toFixed(2)}ms`);

      return client;
    } catch (err) {
      this.connectionMetrics.waitingClients--;
      this.logger.error(`Error acquiring client from pool: ${err.message}`);
      throw err;
    }
  }

  /**
   * Release a client back to the pool
   */
  releaseClient(client: PoolClient): void {
    try {
      client.release();
    } catch (err) {
      this.logger.error(`Error releasing client: ${err.message}`);
    }
  }

  /**
   * Execute a query with connection pooling
   */
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await this.getClient();
    const startTime = performance.now();

    try {
      this.connectionMetrics.queryCount++;
      const result = await client.query<T>(text, params);
      return result;
    } catch (err) {
      this.logger.error(`Query error: ${err.message}\nQuery: ${text}\nParams: ${JSON.stringify(params)}`);
      throw err;
    } finally {
      const endTime = performance.now();
      this.connectionMetrics.queryTime += endTime - startTime;
      this.releaseClient(client);

      this.logger.debug(`Query executed in ${(endTime - startTime).toFixed(2)}ms`);
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.error(`Transaction error: ${err.message}`);
      throw err;
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats(): any {
    return {
      totalConnections: this.connectionMetrics.totalConnections,
      activeConnections: this.connectionMetrics.activeConnections,
      idleConnections: this.connectionMetrics.idleConnections,
      waitingClients: this.connectionMetrics.waitingClients,
      queryCount: this.connectionMetrics.queryCount,
      avgQueryTime: this.connectionMetrics.queryCount > 0
        ? this.connectionMetrics.queryTime / this.connectionMetrics.queryCount
        : 0,
      poolSize: this.pool ? this.pool.totalCount : 0,
      poolAvailable: this.pool ? this.pool.idleCount : 0,
      poolWaiting: this.pool ? this.pool.waitingCount : 0
    };
  }

  /**
   * Get connection pool status
   */
  getPoolStatus(): string {
    const stats = this.getPoolStats();
    return `Pool: ${stats.poolSize} total, ${stats.poolAvailable} available, ${stats.poolWaiting} waiting | ` +
           `Connections: ${stats.totalConnections} total, ${stats.activeConnections} active, ${stats.idleConnections} idle | ` +
           `Queries: ${stats.queryCount} total, ${stats.avgQueryTime.toFixed(2)}ms avg`;
  }

  /**
   * Check if pool is healthy
   */
  isPoolHealthy(): boolean {
    const stats = this.getPoolStats();
    return stats.poolSize > 0 &&
           stats.poolAvailable >= ConnectionPoolConfig.MIN_AVAILABLE_CONNECTIONS &&
           stats.poolWaiting <= ConnectionPoolConfig.MAX_WAITING_CLIENTS;
  }

  /**
   * Get connection pool metrics for monitoring
   */
  getMetrics(): any {
    const stats = this.getPoolStats();
    return {
      db_pool_total_connections: stats.totalConnections,
      db_pool_active_connections: stats.activeConnections,
      db_pool_idle_connections: stats.idleConnections,
      db_pool_waiting_clients: stats.waitingClients,
      db_pool_size: stats.poolSize,
      db_pool_available: stats.poolAvailable,
      db_pool_waiting: stats.poolWaiting,
      db_queries_total: stats.queryCount,
      db_query_avg_time_ms: stats.avgQueryTime,
      db_pool_healthy: this.isPoolHealthy() ? 1 : 0
    };
  }

  /**
   * Execute a batch of queries in a transaction
   */
  async batchQuery(queries: { text: string; params?: any[] }[]): Promise<QueryResult[]> {
    return this.transaction(async (client) => {
      const results: QueryResult[] = [];

      for (const query of queries) {
        const result = await client.query(query.text, query.params);
        results.push(result);
      }

      return results;
    });
  }

  /**
   * Execute a query with retry logic
   */
  async queryWithRetry<T = any>(
    text: string,
    params?: any[],
    maxRetries: number = ConnectionPoolConfig.DEFAULT_MAX_RETRIES,
    retryDelay: number = ConnectionPoolConfig.DEFAULT_RETRY_DELAY
  ): Promise<QueryResult<T>> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.query<T>(text, params);
      } catch (err) {
        lastError = err;
        this.logger.warn(`Query attempt ${i + 1} failed: ${err.message}. Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Exponential backoff
      }
    }

    this.logger.error(`Query failed after ${maxRetries} attempts: ${lastError.message}`);
    throw lastError;
  }

  /**
   * Execute a query with timeout
   */
  async queryWithTimeout<T = any>(
    text: string,
    params?: any[],
    timeout: number = ConnectionPoolConfig.DEFAULT_QUERY_TIMEOUT
  ): Promise<QueryResult<T>> {
    const client = await this.getClient();

    try {
      // Set statement timeout
      await client.query(`SET statement_timeout TO ${timeout}`);

      const result = await client.query<T>(text, params);
      return result;
    } catch (err) {
      if (err.message.includes('canceling statement due to statement timeout')) {
        this.logger.error(`Query timeout after ${timeout}ms: ${text}`);
        throw new Error(`Query timeout after ${timeout}ms`);
      }
      throw err;
    } finally {
      // Reset statement timeout
      await client.query('SET statement_timeout TO 0');
      this.releaseClient(client);
    }
  }

  /**
   * Get a client with specific settings
   */
  async getClientWithSettings(settings: Record<string, any>): Promise<PoolClient> {
    const client = await this.getClient();

    try {
      // Apply settings
      for (const [key, value] of Object.entries(settings)) {
        await client.query(`SET ${key} TO ${value}`);
      }

      return client;
    } catch (err) {
      this.releaseClient(client);
      throw err;
    }
  }
}
```

---

## Real-Time Features (350+ lines)

### WebSocket Server Setup

```typescript
// src/websocket/websocket.gateway.ts
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
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebSocketConfig } from '../config/websocket.config';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { DocumentService } from '../document/document.service';
import { WebSocketEvent } from '../enums/websocket-event.enum';
import { WebSocketMessage } from '../interfaces/websocket-message.interface';
import { WebSocketRoom } from '../enums/websocket-room.enum';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { WebSocketError } from '../enums/websocket-error.enum';
import { WebSocketAuthMiddleware } from './websocket-auth.middleware';
import { WebSocketThrottlerGuard } from './websocket-throttler.guard';
import { UseGuards } from '@nestjs/common';
import { DocumentEvent } from '../interfaces/document-event.interface';
import { UserEvent } from '../interfaces/user-event.interface';
import { SystemEvent } from '../interfaces/system-event.interface';

@WebSocketGateway({
  cors: {
    origin: WebSocketConfig.ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingInterval: WebSocketConfig.PING_INTERVAL,
  pingTimeout: WebSocketConfig.PING_TIMEOUT,
  maxHttpBufferSize: WebSocketConfig.MAX_MESSAGE_SIZE,
  path: WebSocketConfig.PATH
})
@Injectable()
export class WebSocketGatewayService implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebSocketGatewayService.name);
  private readonly rateLimiter: RateLimiterMemory;
  private readonly authMiddleware: WebSocketAuthMiddleware;
  private readonly throttlerGuard: WebSocketThrottlerGuard;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private userService: UserService,
    private documentService: DocumentService
  ) {
    // Initialize rate limiter
    this.rateLimiter = new RateLimiterMemory({
      points: WebSocketConfig.RATE_LIMIT_POINTS,
      duration: WebSocketConfig.RATE_LIMIT_DURATION
    });

    // Initialize middleware and guard
    this.authMiddleware = new WebSocketAuthMiddleware(authService);
    this.throttlerGuard = new WebSocketThrottlerGuard(this.rateLimiter);
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Apply authentication middleware
    server.use(this.authMiddleware.use.bind(this.authMiddleware));

    // Set up server event listeners
    this.setupServerEventListeners();
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.debug(`Connection details: ${JSON.stringify({
      id: client.id,
      handshake: client.handshake,
      rooms: Array.from(client.rooms)
    })}`);

    // Send welcome message
    this.sendToClient(client, WebSocketEvent.CONNECTED, {
      message: 'Connected to Document Management System',
      serverVersion: this.configService.get<string>('APP_VERSION'),
      timestamp: new Date().toISOString()
    });

    // Join default rooms
    this.joinDefaultRooms(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Leave all rooms
    this.leaveAllRooms(client);
  }

  /**
   * Set up server event listeners
   */
  private setupServerEventListeners() {
    this.server.on('error', (error) => {
      this.logger.error(`WebSocket server error: ${error.message}`);
    });

    this.server.on('new_namespace', (namespace) => {
      this.logger.debug(`New namespace created: ${namespace.name}`);
    });

    // Set up periodic health checks
    setInterval(() => {
      this.checkServerHealth();
    }, WebSocketConfig.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Check WebSocket server health
   */
  private checkServerHealth() {
    const stats = this.getServerStats();
    this.logger.debug(`WebSocket server health: ${JSON.stringify(stats)}`);

    // Check for potential issues
    if (stats.connectedClients > WebSocketConfig.MAX_CONNECTED_CLIENTS * 0.9) {
      this.logger.warn(`High client load: ${stats.connectedClients}/${WebSocketConfig.MAX_CONNECTED_CLIENTS}`);
    }

    if (stats.rooms > WebSocketConfig.MAX_ROOMS * 0.8) {
      this.logger.warn(`High room count: ${stats.rooms}/${WebSocketConfig.MAX_ROOMS}`);
    }
  }

  /**
   * Join default rooms for new client
   */
  private joinDefaultRooms(client: Socket) {
    // Join user-specific room
    if (client.data.user) {
      client.join(this.getUserRoom(client.data.user.id));
    }

    // Join system notification room
    client.join(WebSocketRoom.SYSTEM_NOTIFICATIONS);

    // Join global room
    client.join(WebSocketRoom.GLOBAL);
  }

  /**
   * Leave all rooms for client
   */
  private leaveAllRooms(client: Socket) {
    for (const room of client.rooms) {
      if (room !== client.id) { // Don't leave the default room (client.id)
        client.leave(room);
      }
    }
  }

  /**
   * Get room name for user
   */
  private getUserRoom(userId: string): string {
    return `${WebSocketRoom.USER_PREFIX}${userId}`;
  }

  /**
   * Get room name for document
   */
  private getDocumentRoom(documentId: string): string {
    return `${WebSocketRoom.DOCUMENT_PREFIX}${documentId}`;
  }

  /**
   * Get room name for team
   */
  private getTeamRoom(teamId: string): string {
    return `${WebSocketRoom.TEAM_PREFIX}${teamId}`;
  }

  /**
   * Send message to client
   */
  private sendToClient(client: Socket, event: WebSocketEvent, data: any): void {
    try {
      client.emit(event, this.createMessage(event, data));
    } catch (err) {
      this.logger.error(`Error sending message to client ${client.id}: ${err.message}`);
    }
  }

  /**
   * Send message to room
   */
  private sendToRoom(room: string, event: WebSocketEvent, data: any, except?: string): void {
    try {
      if (except) {
        this.server.to(room).except(except).emit(event, this.createMessage(event, data));
      } else {
        this.server.to(room).emit(event, this.createMessage(event, data));
      }
    } catch (err) {
      this.logger.error(`Error sending message to room ${room}: ${err.message}`);
    }
  }

  /**
   * Send message to all clients
   */
  private broadcast(event: WebSocketEvent, data: any, except?: string): void {
    try {
      if (except) {
        this.server.except(except).emit(event, this.createMessage(event, data));
      } else {
        this.server.emit(event, this.createMessage(event, data));
      }
    } catch (err) {
      this.logger.error(`Error broadcasting message: ${err.message}`);
    }
  }

  /**
   * Create standardized WebSocket message
   */
  private createMessage(event: WebSocketEvent, data: any): WebSocketMessage {
    return {
      event,
      data,
      timestamp: new Date().toISOString(),
      serverVersion: this.configService.get<string>('APP_VERSION')
    };
  }

  /**
   * Handle document events
   */
  @SubscribeMessage(WebSocketEvent.DOCUMENT_EVENT)
  @UseGuards(WebSocketThrottlerGuard)
  async handleDocumentEvent(
    @MessageBody() event: DocumentEvent,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    try {
      this.logger.debug(`Document event received from ${client.id}: ${JSON.stringify(event)}`);

      // Validate event
      if (!this.isValidDocumentEvent(event)) {
        this.sendError(client, WebSocketError.INVALID_EVENT, 'Invalid document event');
        return;
      }

      // Process event based on type
      switch (event.type) {
        case 'create':
          await this.handleDocumentCreate(event, client);
          break;
        case 'update':
          await this.handleDocumentUpdate(event, client);
          break;
        case 'delete':
          await this.handleDocumentDelete(event, client);
          break;
        case 'share':
          await this.handleDocumentShare(event, client);
          break;
        case 'comment':
          await this.handleDocumentComment(event, client);
          break;
        case 'collaborator_add':
          await this.handleCollaboratorAdd(event, client);
          break;
        case 'collaborator_remove':
          await this.handleCollaboratorRemove(event, client);
          break;
        case 'version_create':
          await this.handleVersionCreate(event, client);
          break;
        case 'lock':
          await this.handleDocumentLock(event, client);
          break;
        case 'unlock':
          await this.handleDocumentUnlock(event, client);
          break;
      }
    } catch (err) {
      this.logger.error(`Error handling document event: ${err.message}`);
      this.sendError(client, WebSocketError.INTERNAL_ERROR, 'Failed to process document event');
    }
  }

  /**
   * Handle document create event
   */
  private async handleDocumentCreate(event: DocumentEvent, client: Socket): Promise<void> {
    // Validate document
    const document = await this.documentService.getDocumentById(event.documentId);
    if (!document) {
      this.sendError(client, WebSocketError.DOCUMENT_NOT_FOUND, 'Document not found');
      return;
    }

    // Check permissions
    if (document.ownerId !== client.data.user.id) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Only document owner can create document events');
      return;
    }

    // Join document room
    client.join(this.getDocumentRoom(event.documentId));

    // Broadcast to user's room
    this.sendToRoom(this.getUserRoom(client.data.user.id), WebSocketEvent.DOCUMENT_CREATED, {
      documentId: event.documentId,
      document: this.sanitizeDocument(document),
      timestamp: new Date().toISOString()
    }, client.id);

    // Broadcast to global room
    this.broadcast(WebSocketEvent.DOCUMENT_CREATED, {
      documentId: event.documentId,
      ownerId: document.ownerId,
      documentType: document.documentType,
      timestamp: new Date().toISOString()
    }, client.id);
  }

  /**
   * Handle document update event
   */
  private async handleDocumentUpdate(event: DocumentEvent, client: Socket): Promise<void> {
    // Check if client is in document room
    if (!client.rooms.has(this.getDocumentRoom(event.documentId))) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Not subscribed to document updates');
      return;
    }

    // Get document
    const document = await this.documentService.getDocumentById(event.documentId);
    if (!document) {
      this.sendError(client, WebSocketError.DOCUMENT_NOT_FOUND, 'Document not found');
      return;
    }

    // Check permissions
    const hasPermission = await this.documentService.hasEditPermission(
      event.documentId,
      client.data.user.id
    );

    if (!hasPermission) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'No edit permission for document');
      return;
    }

    // Broadcast to document room
    this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_UPDATED, {
      documentId: event.documentId,
      changes: event.changes,
      updatedBy: client.data.user.id,
      timestamp: new Date().toISOString()
    }, client.id);
  }

  /**
   * Handle document delete event
   */
  private async handleDocumentDelete(event: DocumentEvent, client: Socket): Promise<void> {
    // Get document
    const document = await this.documentService.getDocumentById(event.documentId);
    if (!document) {
      this.sendError(client, WebSocketError.DOCUMENT_NOT_FOUND, 'Document not found');
      return;
    }

    // Check permissions
    if (document.ownerId !== client.data.user.id) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Only document owner can delete document');
      return;
    }

    // Broadcast to document room
    this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_DELETED, {
      documentId: event.documentId,
      timestamp: new Date().toISOString()
    });

    // Broadcast to user's room
    this.sendToRoom(this.getUserRoom(client.data.user.id), WebSocketEvent.DOCUMENT_DELETED, {
      documentId: event.documentId,
      timestamp: new Date().toISOString()
    });

    // Leave document room
    client.leave(this.getDocumentRoom(event.documentId));
  }

  /**
   * Handle document share event
   */
  private async handleDocumentShare(event: DocumentEvent, client: Socket): Promise<void> {
    // Get document
    const document = await this.documentService.getDocumentById(event.documentId);
    if (!document) {
      this.sendError(client, WebSocketError.DOCUMENT_NOT_FOUND, 'Document not found');
      return;
    }

    // Check permissions
    if (document.ownerId !== client.data.user.id) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Only document owner can share document');
      return;
    }

    // Get shared users
    const sharedUsers = await this.documentService.getDocumentCollaborators(event.documentId);

    // Notify shared users
    for (const user of sharedUsers) {
      if (user.id !== client.data.user.id) {
        this.sendToRoom(this.getUserRoom(user.id), WebSocketEvent.DOCUMENT_SHARED, {
          documentId: event.documentId,
          documentName: document.title,
          sharedBy: client.data.user.id,
          sharedWith: user.id,
          permissions: event.permissions,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Broadcast to document room
    this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_SHARED, {
      documentId: event.documentId,
      sharedBy: client.data.user.id,
      permissions: event.permissions,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle document comment event
   */
  private async handleDocumentComment(event: DocumentEvent, client: Socket): Promise<void> {
    // Check if client is in document room
    if (!client.rooms.has(this.getDocumentRoom(event.documentId))) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Not subscribed to document updates');
      return;
    }

    // Get document
    const document = await this.documentService.getDocumentById(event.documentId);
    if (!document) {
      this.sendError(client, WebSocketError.DOCUMENT_NOT_FOUND, 'Document not found');
      return;
    }

    // Check permissions
    const hasPermission = await this.documentService.hasCommentPermission(
      event.documentId,
      client.data.user.id
    );

    if (!hasPermission) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'No comment permission for document');
      return;
    }

    // Broadcast to document room
    this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_COMMENT, {
      documentId: event.documentId,
      commentId: event.commentId,
      comment: event.comment,
      commentedBy: client.data.user.id,
      timestamp: new Date().toISOString()
    }, client.id);
  }

  /**
   * Handle collaborator add event
   */
  private async handleCollaboratorAdd(event: DocumentEvent, client: Socket): Promise<void> {
    // Get document
    const document = await this.documentService.getDocumentById(event.documentId);
    if (!document) {
      this.sendError(client, WebSocketError.DOCUMENT_NOT_FOUND, 'Document not found');
      return;
    }

    // Check permissions
    if (document.ownerId !== client.data.user.id) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Only document owner can add collaborators');
      return;
    }

    // Notify added collaborator
    this.sendToRoom(this.getUserRoom(event.collaboratorId), WebSocketEvent.COLLABORATOR_ADDED, {
      documentId: event.documentId,
      documentName: document.title,
      addedBy: client.data.user.id,
      permissions: event.permissions,
      timestamp: new Date().toISOString()
    });

    // Broadcast to document room
    this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.COLLABORATOR_ADDED, {
      documentId: event.documentId,
      collaboratorId: event.collaboratorId,
      addedBy: client.data.user.id,
      permissions: event.permissions,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle collaborator remove event
   */
  private async handleCollaboratorRemove(event: DocumentEvent, client: Socket): Promise<void> {
    // Get document
    const document = await this.documentService.getDocumentById(event.documentId);
    if (!document) {
      this.sendError(client, WebSocketError.DOCUMENT_NOT_FOUND, 'Document not found');
      return;
    }

    // Check permissions
    if (document.ownerId !== client.data.user.id) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Only document owner can remove collaborators');
      return;
    }

    // Notify removed collaborator
    this.sendToRoom(this.getUserRoom(event.collaboratorId), WebSocketEvent.COLLABORATOR_REMOVED, {
      documentId: event.documentId,
      documentName: document.title,
      removedBy: client.data.user.id,
      timestamp: new Date().toISOString()
    });

    // Broadcast to document room
    this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.COLLABORATOR_REMOVED, {
      documentId: event.documentId,
      collaboratorId: event.collaboratorId,
      removedBy: client.data.user.id,
      timestamp: new Date().toISOString()
    });

    // Remove collaborator from document room
    this.server.socketsLeave(this.getDocumentRoom(event.documentId));
  }

  /**
   * Handle document version create event
   */
  private async handleVersionCreate(event: DocumentEvent, client: Socket): Promise<void> {
    // Check if client is in document room
    if (!client.rooms.has(this.getDocumentRoom(event.documentId))) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Not subscribed to document updates');
      return;
    }

    // Get document
    const document = await this.documentService.getDocumentById(event.documentId);
    if (!document) {
      this.sendError(client, WebSocketError.DOCUMENT_NOT_FOUND, 'Document not found');
      return;
    }

    // Check permissions
    const hasPermission = await this.documentService.hasEditPermission(
      event.documentId,
      client.data.user.id
    );

    if (!hasPermission) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'No edit permission for document');
      return;
    }

    // Broadcast to document room
    this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_VERSION_CREATED, {
      documentId: event.documentId,
      versionId: event.versionId,
      createdBy: client.data.user.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle document lock event
   */
  private async handleDocumentLock(event: DocumentEvent, client: Socket): Promise<void> {
    // Check if client is in document room
    if (!client.rooms.has(this.getDocumentRoom(event.documentId))) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Not subscribed to document updates');
      return;
    }

    // Get document
    const document = await this.documentService.getDocumentById(event.documentId);
    if (!document) {
      this.sendError(client, WebSocketError.DOCUMENT_NOT_FOUND, 'Document not found');
      return;
    }

    // Check permissions
    const hasPermission = await this.documentService.hasEditPermission(
      event.documentId,
      client.data.user.id
    );

    if (!hasPermission) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'No edit permission for document');
      return;
    }

    // Broadcast to document room
    this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_LOCKED, {
      documentId: event.documentId,
      lockedBy: client.data.user.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle document unlock event
   */
  private async handleDocumentUnlock(event: DocumentEvent, client: Socket): Promise<void> {
    // Check if client is in document room
    if (!client.rooms.has(this.getDocumentRoom(event.documentId))) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Not subscribed to document updates');
      return;
    }

    // Get document
    const document = await this.documentService.getDocumentById(event.documentId);
    if (!document) {
      this.sendError(client, WebSocketError.DOCUMENT_NOT_FOUND, 'Document not found');
      return;
    }

    // Check if document is locked by current user
    const isLockedByUser = await this.documentService.isDocumentLockedByUser(
      event.documentId,
      client.data.user.id
    );

    if (!isLockedByUser) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Document is not locked by you');
      return;
    }

    // Broadcast to document room
    this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_UNLOCKED, {
      documentId: event.documentId,
      unlockedBy: client.data.user.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle user events
   */
  @SubscribeMessage(WebSocketEvent.USER_EVENT)
  @UseGuards(WebSocketThrottlerGuard)
  async handleUserEvent(
    @MessageBody() event: UserEvent,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    try {
      this.logger.debug(`User event received from ${client.id}: ${JSON.stringify(event)}`);

      // Validate event
      if (!this.isValidUserEvent(event)) {
        this.sendError(client, WebSocketError.INVALID_EVENT, 'Invalid user event');
        return;
      }

      // Process event based on type
      switch (event.type) {
        case 'status_update':
          await this.handleUserStatusUpdate(event, client);
          break;
        case 'presence_update':
          await this.handleUserPresenceUpdate(event, client);
          break;
        case 'activity_update':
          await this.handleUserActivityUpdate(event, client);
          break;
      }
    } catch (err) {
      this.logger.error(`Error handling user event: ${err.message}`);
      this.sendError(client, WebSocketError.INTERNAL_ERROR, 'Failed to process user event');
    }
  }

  /**
   * Handle user status update
   */
  private async handleUserStatusUpdate(event: UserEvent, client: Socket): Promise<void> {
    // Update user status
    await this.userService.updateUserStatus(client.data.user.id, event.status);

    // Broadcast to user's room
    this.sendToRoom(this.getUserRoom(client.data.user.id), WebSocketEvent.USER_STATUS_UPDATED, {
      userId: client.data.user.id,
      status: event.status,
      timestamp: new Date().toISOString()
    }, client.id);

    // Broadcast to team rooms if applicable
    if (event.teamIds && event.teamIds.length > 0) {
      for (const teamId of event.teamIds) {
        this.sendToRoom(this.getTeamRoom(teamId), WebSocketEvent.USER_STATUS_UPDATED, {
          userId: client.data.user.id,
          status: event.status,
          teamId,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Handle user presence update
   */
  private async handleUserPresenceUpdate(event: UserEvent, client: Socket): Promise<void> {
    // Update user presence
    await this.userService.updateUserPresence(client.data.user.id, event.presence);

    // Broadcast to user's room
    this.sendToRoom(this.getUserRoom(client.data.user.id), WebSocketEvent.USER_PRESENCE_UPDATED, {
      userId: client.data.user.id,
      presence: event.presence,
      lastActive: new Date().toISOString(),
      timestamp: new Date().toISOString()
    }, client.id);
  }

  /**
   * Handle user activity update
   */
  private async handleUserActivityUpdate(event: UserEvent, client: Socket): Promise<void> {
    // Record user activity
    await this.userService.recordUserActivity(client.data.user.id, event.activity);

    // Broadcast to user's room
    this.sendToRoom(this.getUserRoom(client.data.user.id), WebSocketEvent.USER_ACTIVITY_UPDATED, {
      userId: client.data.user.id,
      activity: event.activity,
      timestamp: new Date().toISOString()
    }, client.id);
  }

  /**
   * Handle system events
   */
  @SubscribeMessage(WebSocketEvent.SYSTEM_EVENT)
  @UseGuards(WebSocketThrottlerGuard)
  async handleSystemEvent(
    @MessageBody() event: SystemEvent,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    try {
      this.logger.debug(`System event received from ${client.id}: ${JSON.stringify(event)}`);

      // Validate event
      if (!this.isValidSystemEvent(event)) {
        this.sendError(client, WebSocketError.INVALID_EVENT, 'Invalid system event');
        return;
      }

      // Process event based on type
      switch (event.type) {
        case 'maintenance':
          await this.handleMaintenanceEvent(event, client);
          break;
        case 'notification':
          await this.handleSystemNotification(event, client);
          break;
        case 'announcement':
          await this.handleSystemAnnouncement(event, client);
          break;
      }
    } catch (err) {
      this.logger.error(`Error handling system event: ${err.message}`);
      this.sendError(client, WebSocketError.INTERNAL_ERROR, 'Failed to process system event');
    }
  }

  /**
   * Handle maintenance event
   */
  private async handleMaintenanceEvent(event: SystemEvent, client: Socket): Promise<void> {
    // Check if user is admin
    const isAdmin = await this.userService.isAdmin(client.data.user.id);
    if (!isAdmin) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Only admins can send maintenance events');
      return;
    }

    // Broadcast to system notification room
    this.sendToRoom(WebSocketRoom.SYSTEM_NOTIFICATIONS, WebSocketEvent.SYSTEM_MAINTENANCE, {
      type: event.maintenanceType,
      startTime: event.startTime,
      endTime: event.endTime,
      message: event.message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle system notification
   */
  private async handleSystemNotification(event: SystemEvent, client: Socket): Promise<void> {
    // Check if user is admin
    const isAdmin = await this.userService.isAdmin(client.data.user.id);
    if (!isAdmin) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Only admins can send system notifications');
      return;
    }

    // Broadcast to system notification room
    this.sendToRoom(WebSocketRoom.SYSTEM_NOTIFICATIONS, WebSocketEvent.SYSTEM_NOTIFICATION, {
      notificationId: event.notificationId,
      title: event.title,
      message: event.message,
      severity: event.severity,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle system announcement
   */
  private async handleSystemAnnouncement(event: SystemEvent, client: Socket): Promise<void> {
    // Check if user is admin
    const isAdmin = await this.userService.isAdmin(client.data.user.id);
    if (!isAdmin) {
      this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Only admins can send system announcements');
      return;
    }

    // Broadcast to global room
    this.broadcast(WebSocketEvent.SYSTEM_ANNOUNCEMENT, {
      announcementId: event.announcementId,
      title: event.title,
      message: event.message,
      author: client.data.user.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Subscribe to document updates
   */
  @SubscribeMessage(WebSocketEvent.SUBSCRIBE_DOCUMENT)
  async handleSubscribeDocument(
    @MessageBody() documentId: string,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    try {
      this.logger.debug(`Client ${client.id} subscribing to document ${documentId}`);

      // Check if document exists
      const document = await this.documentService.getDocumentById(documentId);
      if (!document) {
        this.sendError(client, WebSocketError.DOCUMENT_NOT_FOUND, 'Document not found');
        return;
      }

      // Check permissions
      const hasPermission = await this.documentService.hasViewPermission(
        documentId,
        client.data.user.id
      );

      if (!hasPermission) {
        this.sendError(client, WebSocketError.PERMISSION_DENIED, 'No permission to view document');
        return;
      }

      // Join document room
      client.join(this.getDocumentRoom(documentId));

      // Send success response
      this.sendToClient(client, WebSocketEvent.SUBSCRIBED_DOCUMENT, {
        documentId,
        message: 'Successfully subscribed to document updates',
        timestamp: new Date().toISOString()
      });

      // Send current document state
      this.sendToClient(client, WebSocketEvent.DOCUMENT_STATE, {
        documentId,
        document: this.sanitizeDocument(document),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      this.logger.error(`Error subscribing to document ${documentId}: ${err.message}`);
      this.sendError(client, WebSocketError.INTERNAL_ERROR, 'Failed to subscribe to document');
    }
  }

  /**
   * Unsubscribe from document updates
   */
  @SubscribeMessage(WebSocketEvent.UNSUBSCRIBE_DOCUMENT)
  async handleUnsubscribeDocument(
    @MessageBody() documentId: string,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    try {
      this.logger.debug(`Client ${client.id} unsubscribing from document ${documentId}`);

      // Leave document room
      client.leave(this.getDocumentRoom(documentId));

      // Send success response
      this.sendToClient(client, WebSocketEvent.UNSUBSCRIBED_DOCUMENT, {
        documentId,
        message: 'Successfully unsubscribed from document updates',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      this.logger.error(`Error unsubscribing from document ${documentId}: ${err.message}`);
      this.sendError(client, WebSocketError.INTERNAL_ERROR, 'Failed to unsubscribe from document');
    }
  }

  /**
   * Subscribe to user updates
   */
  @SubscribeMessage(WebSocketEvent.SUBSCRIBE_USER)
  async handleSubscribeUser(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    try {
      this.logger.debug(`Client ${client.id} subscribing to user ${userId}`);

      // Check if user exists
      const user = await this.userService.getUserById(userId);
      if (!user) {
        this.sendError(client, WebSocketError.USER_NOT_FOUND, 'User not found');
        return;
      }

      // Check if requesting user is the same or admin
      if (client.data.user.id !== userId && !(await this.userService.isAdmin(client.data.user.id))) {
        this.sendError(client, WebSocketError.PERMISSION_DENIED, 'No permission to subscribe to user updates');
        return;
      }

      // Join user room
      client.join(this.getUserRoom(userId));

      // Send success response
      this.sendToClient(client, WebSocketEvent.SUBSCRIBED_USER, {
        userId,
        message: 'Successfully subscribed to user updates',
        timestamp: new Date().toISOString()
      });

      // Send current user state
      this.sendToClient(client, WebSocketEvent.USER_STATE, {
        userId,
        user: this.sanitizeUser(user),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      this.logger.error(`Error subscribing to user ${userId}: ${err.message}`);
      this.sendError(client, WebSocketError.INTERNAL_ERROR, 'Failed to subscribe to user');
    }
  }

  /**
   * Unsubscribe from user updates
   */
  @SubscribeMessage(WebSocketEvent.UNSUBSCRIBE_USER)
  async handleUnsubscribeUser(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    try {
      this.logger.debug(`Client ${client.id} unsubscribing from user ${userId}`);

      // Leave user room
      client.leave(this.getUserRoom(userId));

      // Send success response
      this.sendToClient(client, WebSocketEvent.UNSUBSCRIBED_USER, {
        userId,
        message: 'Successfully unsubscribed from user updates',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      this.logger.error(`Error unsubscribing from user ${userId}: ${err.message}`);
      this.sendError(client, WebSocketError.INTERNAL_ERROR, 'Failed to unsubscribe from user');
    }
  }

  /**
   * Get server statistics
   */
  @SubscribeMessage(WebSocketEvent.GET_SERVER_STATS)
  async handleGetServerStats(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      // Check if user is admin
      const isAdmin = await this.userService.isAdmin(client.data.user.id);
      if (!isAdmin) {
        this.sendError(client, WebSocketError.PERMISSION_DENIED, 'Only admins can request server stats');
        return;
      }

      const stats = this.getServerStats();
      this.sendToClient(client, WebSocketEvent.SERVER_STATS, stats);
    } catch (err) {
      this.logger.error(`Error getting server stats: ${err.message}`);
      this.sendError(client, WebSocketError.INTERNAL_ERROR, 'Failed to get server stats');
    }
  }

  /**
   * Send error to client
   */
  private sendError(client: Socket, error: WebSocketError, message: string): void {
    this.sendToClient(client, WebSocketEvent.ERROR, {
      error,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Validate document event
   */
  private isValidDocumentEvent(event: DocumentEvent): boolean {
    if (!event || !event.type || !event.documentId) {
      return false;
    }

    const requiredFields = {
      create: ['documentId'],
      update: ['documentId', 'changes'],
      delete: ['documentId'],
      share: ['documentId', 'permissions'],
      comment: ['documentId', 'commentId', 'comment'],
      collaborator_add: ['documentId', 'collaboratorId', 'permissions'],
      collaborator_remove: ['documentId', 'collaboratorId'],
      version_create: ['documentId', 'versionId'],
      lock: ['documentId'],
      unlock: ['documentId']
    };

    const fields = requiredFields[event.type];
    if (!fields) return false;

    return fields.every(field => event[field] !== undefined);
  }

  /**
   * Validate user event
   */
  private isValidUserEvent(event: UserEvent): boolean {
    if (!event || !event.type) {
      return false;
    }

    const requiredFields = {
      status_update: ['status'],
      presence_update: ['presence'],
      activity_update: ['activity']
    };

    const fields = requiredFields[event.type];
    if (!fields) return false;

    return fields.every(field => event[field] !== undefined);
  }

  /**
   * Validate system event
   */
  private isValidSystemEvent(event: SystemEvent): boolean {
    if (!event || !event.type) {
      return false;
    }

    const requiredFields = {
      maintenance: ['maintenanceType', 'startTime', 'endTime'],
      notification: ['notificationId', 'title', 'message', 'severity'],
      announcement: ['announcementId', 'title', 'message']
    };

    const fields = requiredFields[event.type];
    if (!fields) return false;

    return fields.every(field => event[field] !== undefined);
  }

  /**
   * Sanitize document data for WebSocket transmission
   */
  private sanitizeDocument(document: any): any {
    if (!document) return null;

    return {
      id: document.id,
      title: document.title,
      description: document.description,
      documentType: document.documentType,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      ownerId: document.ownerId,
      version: document.currentVersion?.versionNumber,
      size: document.currentVersion?.size,
      isLocked: document.isLocked,
      lockHolder: document.lockHolderId
    };
  }

  /**
   * Sanitize user data for WebSocket transmission
   */
  private sanitizeUser(user: any): any {
    if (!user) return null;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      presence: user.presence,
      lastActive: user.lastActive,
      role: user.role
    };
  }

  /**
   * Get WebSocket server statistics
   */
  getServerStats(): any {
    const sockets = this.server.sockets.sockets;
    const rooms = this.server.sockets.adapter.rooms;

    return {
      connectedClients: sockets.size,
      rooms: rooms.size,
      activeRooms: Array.from(rooms.entries()).filter(([_, clients]) => clients.size > 0).length,
      clientsPerRoom: Array.from(rooms.entries()).map(([room, clients]) => ({
        room,
        clientCount: clients.size
      })),
      clientDetails: Array.from(sockets.entries()).map(([id, socket]) => ({
        id,
        userId: socket.data.user?.id,
        rooms: Array.from(socket.rooms),
        connectedAt: socket.handshake.time,
        userAgent: socket.handshake.headers['user-agent']
      })),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      eventCounts: this.getEventCounts()
    };
  }

  /**
   * Get event counts
   */
  private getEventCounts(): Record<string, number> {
    // In a real implementation, you would track event counts
    return {
      document_events: 0,
      user_events: 0,
      system_events: 0,
      subscriptions: 0
    };
  }

  /**
   * Broadcast document event to all relevant clients
   */
  broadcastDocumentEvent(event: DocumentEvent): void {
    try {
      switch (event.type) {
        case 'create':
          this.broadcast(WebSocketEvent.DOCUMENT_CREATED, {
            documentId: event.documentId,
            timestamp: new Date().toISOString()
          });
          break;
        case 'update':
          this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_UPDATED, {
            documentId: event.documentId,
            changes: event.changes,
            timestamp: new Date().toISOString()
          });
          break;
        case 'delete':
          this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_DELETED, {
            documentId: event.documentId,
            timestamp: new Date().toISOString()
          });
          break;
        case 'share':
          this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_SHARED, {
            documentId: event.documentId,
            permissions: event.permissions,
            timestamp: new Date().toISOString()
          });
          break;
        case 'comment':
          this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_COMMENT, {
            documentId: event.documentId,
            commentId: event.commentId,
            timestamp: new Date().toISOString()
          });
          break;
        case 'collaborator_add':
          this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.COLLABORATOR_ADDED, {
            documentId: event.documentId,
            collaboratorId: event.collaboratorId,
            timestamp: new Date().toISOString()
          });
          break;
        case 'collaborator_remove':
          this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.COLLABORATOR_REMOVED, {
            documentId: event.documentId,
            collaboratorId: event.collaboratorId,
            timestamp: new Date().toISOString()
          });
          break;
        case 'version_create':
          this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_VERSION_CREATED, {
            documentId: event.documentId,
            versionId: event.versionId,
            timestamp: new Date().toISOString()
          });
          break;
        case 'lock':
          this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_LOCKED, {
            documentId: event.documentId,
            timestamp: new Date().toISOString()
          });
          break;
        case 'unlock':
          this.sendToRoom(this.getDocumentRoom(event.documentId), WebSocketEvent.DOCUMENT_UNLOCKED, {
            documentId: event.documentId,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      this.logger.error(`Error broadcasting document event: ${err.message}`);
    }
  }

  /**
   * Broadcast user event to all relevant clients
   */
  broadcastUserEvent(event: UserEvent): void {
    try {
      switch (event.type) {
        case 'status_update':
          this.sendToRoom(this.getUserRoom(event.userId), WebSocketEvent.USER_STATUS_UPDATED, {
            userId: event.userId,
            status: event.status,
            timestamp: new Date().toISOString()
          });
          break;
        case 'presence_update':
          this.sendToRoom(this.getUserRoom(event.userId), WebSocketEvent.USER_PRESENCE_UPDATED, {
            userId: event.userId,
            presence: event.presence,
            timestamp: new Date().toISOString()
          });
          break;
        case 'activity_update':
          this.sendToRoom(this.getUserRoom(event.userId), WebSocketEvent.USER_ACTIVITY_UPDATED, {
            userId: event.userId,
            activity: event.activity,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      this.logger.error(`Error broadcasting user event: ${err.message}`);
    }
  }

  /**
   * Broadcast system event to all relevant clients
   */
  broadcastSystemEvent(event: SystemEvent): void {
    try {
      switch (event.type) {
        case 'maintenance':
          this.sendToRoom(WebSocketRoom.SYSTEM_NOTIFICATIONS, WebSocketEvent.SYSTEM_MAINTENANCE, {
            type: event.maintenanceType,
            startTime: event.startTime,
            endTime: event.endTime,
            message: event.message,
            timestamp: new Date().toISOString()
          });
          break;
        case 'notification':
          this.sendToRoom(WebSocketRoom.SYSTEM_NOTIFICATIONS, WebSocketEvent.SYSTEM_NOTIFICATION, {
            notificationId: event.notificationId,
            title: event.title,
            message: event.message,
            severity: event.severity,
            timestamp: new Date().toISOString()
          });
          break;
        case 'announcement':
          this.broadcast(WebSocketEvent.SYSTEM_ANNOUNCEMENT, {
            announcementId: event.announcementId,
            title: event.title,
            message: event.message,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      this.logger.error(`Error broadcasting system event: ${err.message}`);
    }
  }
}
```

### Real-Time Event Handlers

```typescript
// src/websocket/websocket-event-handler.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket.gateway';
import { DocumentEvent } from '../interfaces/document-event.interface';
import { UserEvent } from '../interfaces/user-event.interface';
import { SystemEvent } from '../interfaces/system-event.interface';
import { DocumentService } from '../document/document.service';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';
import { WebSocketEvent } from '../enums/websocket-event.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WebSocketConfig } from '../config/websocket.config';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';
import { DocumentVersion } from '../entities/document-version.entity';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class WebSocketEventHandlerService {
  private readonly logger = new Logger(WebSocketEventHandlerService.name);

  constructor(
    private readonly websocketGateway: WebSocketGatewayService,
    private readonly documentService: DocumentService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // Subscribe to internal events
    this.subscribeToInternalEvents();
  }

  /**
   * Subscribe to internal application events
   */
  private subscribeToInternalEvents(): void {
    // Document events
    this.eventEmitter.on('document.created', (document: Document) => {
      this.handleDocumentCreated(document);
    });

    this.eventEmitter.on('document.updated', (document: Document) => {
      this.handleDocumentUpdated(document);
    });

    this.eventEmitter.on('document.deleted', (documentId: string) => {
      this.handleDocumentDeleted(documentId);
    });

    this.eventEmitter.on('document.shared', (data: { documentId: string; sharedWith: string[] }) => {
      this.handleDocumentShared(data.documentId, data.sharedWith);
    });

    this.eventEmitter.on('document.comment_added', (comment: Comment) => {
      this.handleDocumentCommentAdded(comment);
    });

    this.eventEmitter.on('document.collaborator_added', (data: { documentId: string; collaboratorId: string }) => {
      this.handleCollaboratorAdded(data.documentId, data.collaboratorId);
    });

    this.eventEmitter.on('document.collaborator_removed', (data: { documentId: string; collaboratorId: string }) => {
      this.handleCollaboratorRemoved(data.documentId, data.collaboratorId);
    });

    this.eventEmitter.on('document.version_created', (version: DocumentVersion) => {
      this.handleVersionCreated(version);
    });

    this.eventEmitter.on('document.locked', (data: { documentId: string; lockedBy: string }) => {
      this.handleDocumentLocked(data.documentId, data.lockedBy);
    });

    this.eventEmitter.on('document.unlocked', (documentId: string) => {
      this.handleDocumentUnlocked(documentId);
    });

    // User events
    this.eventEmitter.on('user.status_updated', (data: { userId: string; status: string }) => {
      this.handleUserStatusUpdated(data.userId, data.status);
    });

    this.eventEmitter.on('user.presence_updated', (data: { userId: string; presence: string }) => {
      this.handleUserPresenceUpdated(data.userId, data.presence);
    });

    this.eventEmitter.on('user.activity_recorded', (data: { userId: string; activity: string }) => {
      this.handleUserActivityRecorded(data.userId, data.activity);
    });

    // System events
    this.eventEmitter.on('system.maintenance', (event: SystemEvent) => {
      this.handleSystemMaintenance(event);
    });

    this.eventEmitter.on('system.notification', (event: SystemEvent) => {
      this.handleSystemNotification(event);
    });

    this.eventEmitter.on('system.announcement', (event: SystemEvent) => {
      this.handleSystemAnnouncement(event);
    });
  }

  /**
   * Handle document created event
   */
  private async handleDocumentCreated(document: Document): Promise<void> {
    try {
      const event: DocumentEvent = {
        type: 'create',
        documentId: document.id
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastDocumentEvent(event);

      // Create notification for owner
      await this.notificationService.createNotification({
        userId: document.ownerId,
        type: 'document_created',
        title: 'Document Created',
        message: `Your document "${document.title}" has been created successfully.`,
        data: {
          documentId: document.id,
          documentTitle: document.title
        },
        severity: 'info'
      });

      this.logger.log(`Document created event handled for document ${document.id}`);
    } catch (err) {
      this.logger.error(`Error handling document created event: ${err.message}`);
    }
  }

  /**
   * Handle document updated event
   */
  private async handleDocumentUpdated(document: Document): Promise<void> {
    try {
      const changes = await this.documentService.getDocumentChanges(document.id);

      const event: DocumentEvent = {
        type: 'update',
        documentId: document.id,
        changes
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastDocumentEvent(event);

      // Create notification for collaborators
      const collaborators = await this.documentService.getDocumentCollaborators(document.id);
      for (const collaborator of collaborators) {
        if (collaborator.id !== document.ownerId) {
          await this.notificationService.createNotification({
            userId: collaborator.id,
            type: 'document_updated',
            title: 'Document Updated',
            message: `Document "${document.title}" has been updated by ${document.updatedBy?.firstName || 'someone'}.`,
            data: {
              documentId: document.id,
              documentTitle: document.title,
              updatedBy: document.updatedBy?.id
            },
            severity: 'info'
          });
        }
      }

      this.logger.log(`Document updated event handled for document ${document.id}`);
    } catch (err) {
      this.logger.error(`Error handling document updated event: ${err.message}`);
    }
  }

  /**
   * Handle document deleted event
   */
  private async handleDocumentDeleted(documentId: string): Promise<void> {
    try {
      const event: DocumentEvent = {
        type: 'delete',
        documentId
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastDocumentEvent(event);

      // Get document info before deletion
      const document = await this.documentService.getDocumentById(documentId);
      if (document) {
        // Create notification for owner and collaborators
        const usersToNotify = [
          document.ownerId,
          ...(await this.documentService.getDocumentCollaborators(documentId)).map(c => c.id)
        ];

        for (const userId of usersToNotify) {
          await this.notificationService.createNotification({
            userId,
            type: 'document_deleted',
            title: 'Document Deleted',
            message: `Document "${document.title}" has been deleted.`,
            data: {
              documentId,
              documentTitle: document.title
            },
            severity: 'warning'
          });
        }
      }

      this.logger.log(`Document deleted event handled for document ${documentId}`);
    } catch (err) {
      this.logger.error(`Error handling document deleted event: ${err.message}`);
    }
  }

  /**
   * Handle document shared event
   */
  private async handleDocumentShared(documentId: string, sharedWith: string[]): Promise<void> {
    try {
      const document = await this.documentService.getDocumentById(documentId);
      if (!document) return;

      const permissions = await this.documentService.getDocumentPermissions(documentId);

      const event: DocumentEvent = {
        type: 'share',
        documentId,
        permissions
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastDocumentEvent(event);

      // Create notifications for shared users
      for (const userId of sharedWith) {
        if (userId !== document.ownerId) {
          await this.notificationService.createNotification({
            userId,
            type: 'document_shared',
            title: 'Document Shared',
            message: `Document "${document.title}" has been shared with you by ${document.owner?.firstName || 'someone'}.`,
            data: {
              documentId,
              documentTitle: document.title,
              sharedBy: document.ownerId,
              permissions
            },
            severity: 'info'
          });
        }
      }

      this.logger.log(`Document shared event handled for document ${documentId}`);
    } catch (err) {
      this.logger.error(`Error handling document shared event: ${err.message}`);
    }
  }

  /**
   * Handle document comment added event
   */
  private async handleDocumentCommentAdded(comment: Comment): Promise<void> {
    try {
      const document = await this.documentService.getDocumentById(comment.documentId);
      if (!document) return;

      const event: DocumentEvent = {
        type: 'comment',
        documentId: comment.documentId,
        commentId: comment.id,
        comment: comment.content
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastDocumentEvent(event);

      // Create notification for document owner and collaborators
      const usersToNotify = [
        document.ownerId,
        ...(await this.documentService.getDocumentCollaborators(comment.documentId)).map(c => c.id)
      ].filter(id => id !== comment.authorId);

      for (const userId of usersToNotify) {
        await this.notificationService.createNotification({
          userId,
          type: 'document_comment',
          title: 'New Comment',
          message: `New comment on document "${document.title}" by ${comment.author?.firstName || 'someone'}.`,
          data: {
            documentId: comment.documentId,
            documentTitle: document.title,
            commentId: comment.id,
            commentedBy: comment.authorId
          },
          severity: 'info'
        });
      }

      this.logger.log(`Document comment added event handled for comment ${comment.id}`);
    } catch (err) {
      this.logger.error(`Error handling document comment added event: ${err.message}`);
    }
  }

  /**
   * Handle collaborator added event
   */
  private async handleCollaboratorAdded(documentId: string, collaboratorId: string): Promise<void> {
    try {
      const document = await this.documentService.getDocumentById(documentId);
      if (!document) return;

      const permissions = await this.documentService.getDocumentPermissionsForUser(
        documentId,
        collaboratorId
      );

      const event: DocumentEvent = {
        type: 'collaborator_add',
        documentId,
        collaboratorId,
        permissions
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastDocumentEvent(event);

      // Create notification for added collaborator
      await this.notificationService.createNotification({
        userId: collaboratorId,
        type: 'collaborator_added',
        title: 'Added as Collaborator',
        message: `You have been added as a collaborator to document "${document.title}" by ${document.owner?.firstName || 'someone'}.`,
        data: {
          documentId,
          documentTitle: document.title,
          addedBy: document.ownerId,
          permissions
        },
        severity: 'info'
      });

      this.logger.log(`Collaborator added event handled for document ${documentId}, collaborator ${collaboratorId}`);
    } catch (err) {
      this.logger.error(`Error handling collaborator added event: ${err.message}`);
    }
  }

  /**
   * Handle collaborator removed event
   */
  private async handleCollaboratorRemoved(documentId: string, collaboratorId: string): Promise<void> {
    try {
      const document = await this.documentService.getDocumentById(documentId);
      if (!document) return;

      const event: DocumentEvent = {
        type: 'collaborator_remove',
        documentId,
        collaboratorId
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastDocumentEvent(event);

      // Create notification for removed collaborator
      await this.notificationService.createNotification({
        userId: collaboratorId,
        type: 'collaborator_removed',
        title: 'Removed as Collaborator',
        message: `You have been removed as a collaborator from document "${document.title}".`,
        data: {
          documentId,
          documentTitle: document.title,
          removedBy: document.ownerId
        },
        severity: 'warning'
      });

      this.logger.log(`Collaborator removed event handled for document ${documentId}, collaborator ${collaboratorId}`);
    } catch (err) {
      this.logger.error(`Error handling collaborator removed event: ${err.message}`);
    }
  }

  /**
   * Handle document version created event
   */
  private async handleVersionCreated(version: DocumentVersion): Promise<void> {
    try {
      const event: DocumentEvent = {
        type: 'version_create',
        documentId: version.documentId,
        versionId: version.id
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastDocumentEvent(event);

      // Create notification for document owner and collaborators
      const document = await this.documentService.getDocumentById(version.documentId);
      if (document) {
        const usersToNotify = [
          document.ownerId,
          ...(await this.documentService.getDocumentCollaborators(version.documentId)).map(c => c.id)
        ].filter(id => id !== version.createdById);

        for (const userId of usersToNotify) {
          await this.notificationService.createNotification({
            userId,
            type: 'document_version',
            title: 'New Version Created',
            message: `New version of document "${document.title}" has been created by ${version.createdBy?.firstName || 'someone'}.`,
            data: {
              documentId: version.documentId,
              documentTitle: document.title,
              versionId: version.id,
              versionNumber: version.versionNumber,
              createdBy: version.createdById
            },
            severity: 'info'
          });
        }
      }

      this.logger.log(`Document version created event handled for version ${version.id}`);
    } catch (err) {
      this.logger.error(`Error handling document version created event: ${err.message}`);
    }
  }

  /**
   * Handle document locked event
   */
  private async handleDocumentLocked(documentId: string, lockedBy: string): Promise<void> {
    try {
      const event: DocumentEvent = {
        type: 'lock',
        documentId
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastDocumentEvent(event);

      // Create notification for document collaborators
      const document = await this.documentService.getDocumentById(documentId);
      if (document) {
        const collaborators = await this.documentService.getDocumentCollaborators(documentId);
        for (const collaborator of collaborators) {
          if (collaborator.id !== lockedBy) {
            await this.notificationService.createNotification({
              userId: collaborator.id,
              type: 'document_locked',
              title: 'Document Locked',
              message: `Document "${document.title}" has been locked by ${collaborator.firstName || 'someone'}.`,
              data: {
                documentId,
                documentTitle: document.title,
                lockedBy
              },
              severity: 'warning'
            });
          }
        }
      }

      this.logger.log(`Document locked event handled for document ${documentId}`);
    } catch (err) {
      this.logger.error(`Error handling document locked event: ${err.message}`);
    }
  }

  /**
   * Handle document unlocked event
   */
  private async handleDocumentUnlocked(documentId: string): Promise<void> {
    try {
      const event: DocumentEvent = {
        type: 'unlock',
        documentId
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastDocumentEvent(event);

      // Create notification for document collaborators
      const document = await this.documentService.getDocumentById(documentId);
      if (document) {
        const collaborators = await this.documentService.getDocumentCollaborators(documentId);
        for (const collaborator of collaborators) {
          await this.notificationService.createNotification({
            userId: collaborator.id,
            type: 'document_unlocked',
            title: 'Document Unlocked',
            message: `Document "${document.title}" has been unlocked.`,
            data: {
              documentId,
              documentTitle: document.title
            },
            severity: 'info'
          });
        }
      }

      this.logger.log(`Document unlocked event handled for document ${documentId}`);
    } catch (err) {
      this.logger.error(`Error handling document unlocked event: ${err.message}`);
    }
  }

  /**
   * Handle user status updated event
   */
  private async handleUserStatusUpdated(userId: string, status: string): Promise<void> {
    try {
      const event: UserEvent = {
        type: 'status_update',
        userId,
        status
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastUserEvent(event);

      this.logger.log(`User status updated event handled for user ${userId}`);
    } catch (err) {
      this.logger.error(`Error handling user status updated event: ${err.message}`);
    }
  }

  /**
   * Handle user presence updated event
   */
  private async handleUserPresenceUpdated(userId: string, presence: string): Promise<void> {
    try {
      const event: UserEvent = {
        type: 'presence_update',
        userId,
        presence
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastUserEvent(event);

      this.logger.log(`User presence updated event handled for user ${userId}`);
    } catch (err) {
      this.logger.error(`Error handling user presence updated event: ${err.message}`);
    }
  }

  /**
   * Handle user activity recorded event
   */
  private async handleUserActivityRecorded(userId: string, activity: string): Promise<void> {
    try {
      const event: UserEvent = {
        type: 'activity_update',
        userId,
        activity
      };

      // Broadcast via WebSocket
      this.websocketGateway.broadcastUserEvent(event);

      this.logger.log(`User activity recorded event handled for user ${userId}`);
    } catch (err) {
      this.logger.error(`Error handling user activity recorded event: ${err.message}`);
    }
  }

  /**
   * Handle system maintenance event
   */
  private async handleSystemMaintenance(event: SystemEvent): Promise<void> {
    try {
      // Broadcast via WebSocket
      this.websocketGateway.broadcastSystemEvent(event);

      // Create notification for all users
      const users = await this.userService.getAllUsers();
      for (const user of users) {
        await this.notificationService.createNotification({
          userId: user.id,
          type: 'system_maintenance',
          title: 'System Maintenance',
          message: event.message,
          data: {
            type: event.maintenanceType,
            startTime: event.startTime,
            endTime: event.endTime
          },
          severity: 'warning'
        });
      }

      this.logger.log(`System maintenance event handled`);
    } catch (err) {
      this.logger.error(`Error handling system maintenance event: ${err.message}`);
    }
  }

  /**
   * Handle system notification event
   */
  private async handleSystemNotification(event: SystemEvent): Promise<void> {
    try {
      // Broadcast via WebSocket
      this.websocketGateway.broadcastSystemEvent(event);

      // Create notification for all users
      const users = await this.userService.getAllUsers();
      for (const user of users) {
        await this.notificationService.createNotification({
          userId: user.id,
          type: 'system_notification',
          title: event.title,
          message: event.message,
          data: {
            notificationId: event.notificationId,
            severity: event.severity
          },
          severity: event.severity as any
        });
      }

      this.logger.log(`System notification event handled`);
    } catch (err) {
      this.logger.error(`Error handling system notification event: ${err.message}`);
    }
  }

  /**
   * Handle system announcement event
   */
  private async handleSystemAnnouncement(event: SystemEvent): Promise<void> {
    try {
      // Broadcast via WebSocket
      this.websocketGateway.broadcastSystemEvent(event);

      // Create notification for all users
      const users = await this.userService.getAllUsers();
      for (const user of users) {
        await this.notificationService.createNotification({
          userId: user.id,
          type: 'system_announcement',
          title: event.title,
          message: event.message,
          data: {
            announcementId: event.announcementId,
            author: event.author
          },
          severity: 'info'
        });
      }

      this.logger.log(`System announcement event handled`);
    } catch (err) {
      this.logger.error(`Error handling system announcement event: ${err.message}`);
    }
  }

  /**
   * Handle document real-time collaboration event
   */
  async handleRealTimeCollaboration(
    documentId: string,
    userId: string,
    changes: any,
    cursorPosition?: { x: number; y: number }
  ): Promise<void> {
    try {
      // Get document to check permissions
      const document = await this.documentService.getDocumentById(documentId);
      if (!document) {
        this.logger.warn(`Document ${documentId} not found for real-time collaboration`);
        return;
      }

      // Check if user has edit permission
      const hasPermission = await this.documentService.hasEditPermission(documentId, userId);
      if (!hasPermission) {
        this.logger.warn(`User ${userId} has no edit permission for document ${documentId}`);
        return;
      }

      // Create collaboration event
      const event: DocumentEvent = {
        type: 'update',
        documentId,
        changes,
        cursorPosition,
        realTime: true
      };

      // Broadcast to document room (excluding sender)
      this.websocketGateway.server.to(this.websocketGateway.getDocumentRoom(documentId))
        .except(this.websocketGateway.getUserRoom(userId))
        .emit(WebSocketEvent.DOCUMENT_REALTIME_UPDATE, {
          documentId,
          changes,
          updatedBy: userId,
          cursorPosition,
          timestamp: new Date().toISOString()
        });

      this.logger.debug(`Real-time collaboration event handled for document ${documentId}`);
    } catch (err) {
      this.logger.error(`Error handling real-time collaboration event: ${err.message}`);
    }
  }

  /**
   * Handle document selection event (for collaborative editing)
   */
  async handleDocumentSelection(
    documentId: string,
    userId: string,
    selection: { start: number; end: number }
  ): Promise<void> {
    try {
      // Get document to check permissions
      const document = await this.documentService.getDocumentById(documentId);
      if (!document) {
        this.logger.warn(`Document ${documentId} not found for selection event`);
        return;
      }

      // Check if user has view permission
      const hasPermission = await this.documentService.hasViewPermission(documentId, userId);
      if (!hasPermission) {
        this.logger.warn(`User ${userId} has no view permission for document ${documentId}`);
        return;
      }

      // Broadcast selection to document room (excluding sender)
      this.websocketGateway.server.to(this.websocketGateway.getDocumentRoom(documentId))
        .except(this.websocketGateway.getUserRoom(userId))
        .emit(WebSocketEvent.DOCUMENT_SELECTION, {
          documentId,
          userId,
          selection,
          timestamp: new Date().toISOString()
        });

      this.logger.debug(`Document selection event handled for document ${documentId}`);
    } catch (err) {
      this.logger.error(`Error handling document selection event: ${err.message}`);
    }
  }

  /**
   * Handle document presence event (who is viewing/editing)
   */
  async handleDocumentPresence(
    documentId: string,
    userId: string,
    action: 'join' | 'leave'
  ): Promise<void> {
    try {
      // Get document to check permissions
      const document = await this.documentService.getDocumentById(documentId);
      if (!document) {
        this.logger.warn(`Document ${documentId} not found for presence event`);
        return;
      }

      // Check if user has view permission
      const hasPermission = await this.documentService.hasViewPermission(documentId, userId);
      if (!hasPermission) {
        this.logger.warn(`User ${userId} has no view permission for document ${documentId}`);
        return;
      }

      // Get user info
      const user = await this.userService.getUserById(userId);
      if (!user) {
        this.logger.warn(`User ${userId} not found for presence event`);
        return;
      }

      // Broadcast presence to document room
      this.websocketGateway.server.to(this.websocketGateway.getDocumentRoom(documentId))
        .emit(WebSocketEvent.DOCUMENT_PRESENCE, {
          documentId,
          userId,
          user: this.sanitizeUserForPresence(user),
          action,
          timestamp: new Date().toISOString()
        });

      this.logger.debug(`Document presence event handled for document ${documentId}, user ${userId}, action ${action}`);
    } catch (err) {
      this.logger.error(`Error handling document presence event: ${err.message}`);
    }
  }

  /**
   * Sanitize user data for presence events
   */
  private sanitizeUserForPresence(user: User): any {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      presence: user.presence,
      status: user.status
    };
  }

  /**
   * Get active users for document
   */
  async getActiveUsersForDocument(documentId: string): Promise<any[]> {
    try {
      const roomName = this.websocketGateway.getDocumentRoom(documentId);
      const room = this.websocketGateway.server.sockets.adapter.rooms.get(roomName);

      if (!room) return [];

      const activeUsers = [];
      for (const socketId of room) {
        const socket = this.websocketGateway.server.sockets.sockets.get(socketId);
        if (socket && socket.data.user) {
          activeUsers.push(this.sanitizeUserForPresence(socket.data.user));
        }
      }

      return activeUsers;
    } catch (err) {
      this.logger.error(`Error getting active users for document ${documentId}: ${err.message}`);
      return [];
    }
  }

  /**
   * Get document presence statistics
   */
  async getDocumentPresenceStats(documentId: string): Promise<any> {
    try {
      const roomName = this.websocketGateway.getDocumentRoom(documentId);
      const room = this.websocketGateway.server.sockets.adapter.rooms.get(roomName);

      return {
        documentId,
        activeUsers: room ? room.size : 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      this.logger.error(`Error getting document presence stats for ${documentId}: ${err.message}`);
      return {
        documentId,
        activeUsers: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }
}
```

### Client-Side WebSocket Integration

```typescript
// src/websocket/websocket-client.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import { WebSocketConfig } from '../config/websocket.config';
import { WebSocketEvent } from '../enums/websocket-event.enum';
import { WebSocketMessage } from '../interfaces/websocket-message.interface';
import { DocumentEvent } from '../interfaces/document-event.interface';
import { UserEvent } from '../interfaces/user-event.interface';
import { SystemEvent } from '../interfaces/system-event.interface';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map, shareReplay, takeUntil } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { WebSocketError } from '../enums/websocket-error.enum';

@Injectable()
export class WebSocketClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebSocketClientService.name);
  private socket: Socket;
  private readonly destroy$ = new Subject<void>();
  private readonly messageSubject = new BehaviorSubject<WebSocketMessage | null>(null);
  private readonly connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private readonly reconnectAttempts = new BehaviorSubject<number>(0);
  private reconnectTimeout: NodeJS.Timeout;
  private pingInterval: NodeJS.Timeout;
  private lastPingTime: number = 0;
  private readonly eventHandlers: Map<string, (data: any) => void> = new Map();

  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  async onModuleInit() {
    await this.initializeSocket();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  /**
   * Initialize WebSocket connection
   */
  private async initializeSocket(): Promise<void> {
    try {
      // Get authentication token
      const token = await this.authService.getAccessToken();

      // Create socket connection
      this.socket = io(this.configService.get<string>('WEBSOCKET_URL'), {
        path: WebSocketConfig.PATH,
        transports: ['websocket'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: WebSocketConfig.MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: WebSocketConfig.RECONNECT_DELAY,
        reconnectionDelayMax: WebSocketConfig.RECONNECT_DELAY_MAX,
        timeout: WebSocketConfig.CONNECTION_TIMEOUT,
        query: {
          token: token || ''
        },
        withCredentials: true,
        extraHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      // Set up event listeners
      this.setupEventListeners();

      // Connect to server
      this.socket.connect();

      this.logger.log('WebSocket client initialized');
    } catch (err) {
      this.logger.error(`Error initializing WebSocket client: ${err.message}`);
      throw err;
    }
  }

  /**
   * Set up WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.logger.log('WebSocket connected');
      this.connectionStatusSubject.next(true);
      this.reconnectAttempts.next(0);
      this.startPing();
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.log(`WebSocket disconnected: ${reason}`);
      this.connectionStatusSubject.next(false);
      this.stopPing();

      // Attempt reconnection if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (err) => {
      this.logger.error(`WebSocket connection error: ${err.message}`);
      this.connectionStatusSubject.next(false);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      this.logger.log(`WebSocket reconnection attempt ${attempt}`);
      this.reconnectAttempts.next(attempt);
    });

    this.socket.on('reconnect_failed', () => {
      this.logger.error('WebSocket reconnection failed');
      this.connectionStatusSubject.next(false);
    });

    // Message events
    this.socket.onAny((event, data) => {
      this.logger.debug(`WebSocket message received: ${event}`);
      this.messageSubject.next({ event, data });

      // Call registered event handlers
      if (this.eventHandlers.has(event)) {
        try {
          this.eventHandlers.get(event)(data);
        } catch (err) {
          this.logger.error(`Error in event handler for ${event}: ${err.message}`);
        }
      }
    });

    // Error events
    this.socket.on(WebSocketEvent.ERROR, (data) => {
      this.logger.error(`WebSocket error: ${data.message} (${data.error})`);
    });

    // Ping/pong events
    this.socket.on('ping', () => {
      this.lastPingTime = Date.now();
    });

    this.socket.on('pong', (latency) => {
      this.logger.debug(`WebSocket pong received with latency ${latency}ms`);
    });
  }

  /**
   * Start ping interval
   */
  private startPing(): void {
    this.stopPing();

    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping', Date.now());
      }
    }, WebSocketConfig.PING_INTERVAL);
  }

  /**
   * Stop ping interval
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = this.calculateReconnectDelay();
    this.logger.log(`Scheduling WebSocket reconnection in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Calculate reconnection delay with exponential backoff
   */
  private calculateReconnectDelay(): number {
    const attempt = this.reconnectAttempts.getValue();
    const delay = Math.min(
      WebSocketConfig.RECONNECT_DELAY * Math.pow(2, attempt),
      WebSocketConfig.RECONNECT_DELAY_MAX
    );

    // Add jitter to avoid thundering herd problem
    const jitter = delay * 0.2 * Math.random();
    return delay + jitter;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.logger.log('Disconnecting WebSocket');

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPing();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get connection status observable
   */
  get connectionStatus$(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable().pipe(
      takeUntil(this.destroy$),
      shareReplay(1)
    );
  }

  /**
   * Get reconnect attempts observable
   */
  get reconnect