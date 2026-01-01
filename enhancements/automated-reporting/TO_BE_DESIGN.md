# TO_BE_DESIGN.md - Automated Reporting Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Status:** Approved for Development

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

### Strategic Vision for the Automated Reporting System

The next-generation Automated Reporting Module represents a paradigm shift in how organizations consume, interact with, and derive value from their data. This system will transition from a static report generation tool to a dynamic, intelligent decision support platform that operates in real-time across all business functions.

#### Business Transformation Goals

1. **From Reactive to Predictive Analytics**
   - Current state: Reports show historical data with 24-48 hour latency
   - Future state: Real-time dashboards with predictive forecasting (90-day outlook)
   - Implementation: Machine learning models will analyze trends and provide forward-looking insights with 92%+ accuracy

2. **From Siloed to Integrated Insights**
   - Current state: Departmental reports with limited cross-functional visibility
   - Future state: Unified analytics platform with cross-departmental KPIs
   - Implementation: Graph database integration to show relationships between seemingly disparate data points

3. **From Manual to Automated Decision Making**
   - Current state: 80% of reports require human interpretation
   - Future state: 60% of standard decisions automated through rule-based engines
   - Implementation: Decision automation framework with configurable business rules

4. **From Static to Interactive Exploration**
   - Current state: PDF/Excel reports with no interactivity
   - Future state: Self-service analytics with drill-down capabilities
   - Implementation: OLAP cube integration with 10+ dimensions of analysis

#### User Experience Improvements

**1. Personalized Intelligence Layer**
```typescript
// Personalization Engine Core
class UserPreferenceManager {
  private static instance: UserPreferenceManager;
  private preferences: Map<string, UserPreference>;
  private behaviorTracker: BehaviorAnalytics;

  private constructor() {
    this.preferences = new Map();
    this.behaviorTracker = new BehaviorAnalytics();
    this.loadDefaultPreferences();
  }

  public static getInstance(): UserPreferenceManager {
    if (!UserPreferenceManager.instance) {
      UserPreferenceManager.instance = new UserPreferenceManager();
    }
    return UserPreferenceManager.instance;
  }

  private loadDefaultPreferences(): void {
    // Load from database with fallback to defaults
    this.preferences.set('default', {
      reportFrequency: ReportFrequency.DAILY,
      preferredFormats: [ReportFormat.HTML, ReportFormat.PDF],
      notificationPreferences: {
        email: true,
        push: true,
        sms: false
      },
      dashboardLayout: DashboardLayout.GRID,
      theme: Theme.LIGHT,
      dataDensity: DataDensity.MEDIUM,
      defaultTimeRange: TimeRange.LAST_7_DAYS,
      favoriteReports: [],
      recentReports: []
    });
  }

  public async getUserPreferences(userId: string): Promise<UserPreference> {
    try {
      if (!this.preferences.has(userId)) {
        const dbPreferences = await UserPreferenceModel.findOne({ userId });
        if (dbPreferences) {
          this.preferences.set(userId, dbPreferences);
        } else {
          const defaultPrefs = this.preferences.get('default')!;
          defaultPrefs.userId = userId;
          this.preferences.set(userId, defaultPrefs);
          await UserPreferenceModel.create(defaultPrefs);
        }
      }
      return this.preferences.get(userId)!;
    } catch (error) {
      this.logError('Failed to get user preferences', error);
      return this.preferences.get('default')!;
    }
  }

  public async updateUserPreferences(userId: string, updates: Partial<UserPreference>): Promise<UserPreference> {
    try {
      const currentPrefs = await this.getUserPreferences(userId);
      const updatedPrefs = { ...currentPrefs, ...updates };

      // Validate updates
      this.validatePreferences(updatedPrefs);

      // Update in memory
      this.preferences.set(userId, updatedPrefs);

      // Persist to database
      await UserPreferenceModel.updateOne({ userId }, { $set: updates });

      // Track behavior for future recommendations
      this.behaviorTracker.trackPreferenceUpdate(userId, updates);

      return updatedPrefs;
    } catch (error) {
      this.logError('Failed to update user preferences', error);
      throw new Error('Preference update failed');
    }
  }

  private validatePreferences(prefs: UserPreference): void {
    // Validate report frequency
    if (!Object.values(ReportFrequency).includes(prefs.reportFrequency)) {
      throw new Error('Invalid report frequency');
    }

    // Validate formats
    if (prefs.preferredFormats.some(f => !Object.values(ReportFormat).includes(f))) {
      throw new Error('Invalid report format');
    }

    // Validate time range
    if (!Object.values(TimeRange).includes(prefs.defaultTimeRange)) {
      throw new Error('Invalid time range');
    }
  }

  private logError(message: string, error: any): void {
    console.error(`[UserPreferenceManager] ${message}:`, error);
    // In production, this would log to a monitoring system
    ErrorTrackingService.captureException(error, {
      context: 'UserPreferenceManager',
      message
    });
  }
}
```

**2. Context-Aware Reporting**
- **Adaptive UI**: Interface adjusts based on user role, device, and current task
- **Smart Defaults**: System remembers previous selections and suggests relevant filters
- **Proactive Insights**: AI identifies anomalies and highlights them before user asks

**3. Natural Language Interface**
```typescript
// Natural Language Processing Service
class ReportQueryProcessor {
  private nlpEngine: NlpEngine;
  private reportCatalog: ReportCatalog;
  private entityRecognizer: EntityRecognizer;

  constructor() {
    this.nlpEngine = new NlpEngine();
    this.reportCatalog = new ReportCatalog();
    this.entityRecognizer = new EntityRecognizer();
    this.initializeModels();
  }

  private async initializeModels(): Promise<void> {
    try {
      await this.nlpEngine.loadModel('en-core-web-lg');
      await this.entityRecognizer.loadCustomEntities();
      await this.reportCatalog.load();
    } catch (error) {
      console.error('Failed to initialize NLP models:', error);
      throw new Error('NLP initialization failed');
    }
  }

  public async processQuery(query: string, userId: string): Promise<ReportQueryResult> {
    try {
      // Step 1: Clean and normalize input
      const cleanedQuery = this.cleanQuery(query);

      // Step 2: Entity recognition
      const entities = await this.entityRecognizer.recognize(cleanedQuery);

      // Step 3: Intent classification
      const intent = await this.nlpEngine.classifyIntent(cleanedQuery);

      // Step 4: Report mapping
      const report = await this.mapToReport(intent, entities);

      // Step 5: Parameter extraction
      const parameters = await this.extractParameters(entities, report);

      // Step 6: User context application
      const userContext = await this.applyUserContext(userId, parameters);

      // Step 7: Generate execution plan
      const executionPlan = this.generateExecutionPlan(report, userContext);

      return {
        success: true,
        originalQuery: query,
        cleanedQuery,
        intent,
        report,
        parameters: userContext,
        executionPlan,
        confidence: this.calculateConfidence(intent, entities)
      };
    } catch (error) {
      console.error('Query processing failed:', error);
      return {
        success: false,
        originalQuery: query,
        error: error.message,
        suggestions: await this.generateSuggestions(query)
      };
    }
  }

  private cleanQuery(query: string): string {
    // Remove special characters, normalize whitespace
    return query
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private async mapToReport(intent: Intent, entities: Entity[]): Promise<ReportDefinition> {
    // Find reports that match the intent and entities
    const matchingReports = this.reportCatalog.findReports({
      intent: intent.type,
      entities: entities.map(e => e.type)
    });

    if (matchingReports.length === 0) {
      throw new Error('No matching reports found');
    }

    if (matchingReports.length === 1) {
      return matchingReports[0];
    }

    // If multiple matches, use confidence scores to select
    return matchingReports.reduce((prev, current) =>
      (prev.confidenceScore > current.confidenceScore) ? prev : current
    );
  }

  private async extractParameters(entities: Entity[], report: ReportDefinition): Promise<ReportParameters> {
    const parameters: ReportParameters = {};

    // Map recognized entities to report parameters
    for (const param of report.requiredParameters) {
      const matchingEntity = entities.find(e => e.type === param.entityType);
      if (matchingEntity) {
        parameters[param.name] = this.convertEntityToParameter(matchingEntity, param.type);
      } else if (param.defaultValue !== undefined) {
        parameters[param.name] = param.defaultValue;
      } else {
        throw new Error(`Missing required parameter: ${param.name}`);
      }
    }

    // Handle optional parameters
    for (const param of report.optionalParameters) {
      const matchingEntity = entities.find(e => e.type === param.entityType);
      if (matchingEntity) {
        parameters[param.name] = this.convertEntityToParameter(matchingEntity, param.type);
      }
    }

    return parameters;
  }

  private convertEntityToParameter(entity: Entity, targetType: ParameterType): any {
    switch (targetType) {
      case ParameterType.DATE:
        return this.parseDate(entity.value);
      case ParameterType.NUMBER:
        return parseFloat(entity.value);
      case ParameterType.BOOLEAN:
        return entity.value.toLowerCase() === 'true' ||
               entity.value.toLowerCase() === 'yes';
      case ParameterType.STRING:
        return entity.value;
      case ParameterType.ENUM:
        return entity.value.toUpperCase();
      default:
        return entity.value;
    }
  }

  private parseDate(dateString: string): Date {
    // Handle various date formats
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try common relative dates
    const today = new Date();
    const lower = dateString.toLowerCase();

    if (lower.includes('today')) return today;
    if (lower.includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
    if (lower.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    if (lower.includes('last week')) {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return lastWeek;
    }
    if (lower.includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
    }

    throw new Error(`Could not parse date: ${dateString}`);
  }

  private async applyUserContext(userId: string, parameters: ReportParameters): Promise<ReportParameters> {
    const userContext = await UserContextService.getContext(userId);

    // Apply default time range from user preferences
    if (!parameters.timeRange && userContext.preferences.defaultTimeRange) {
      parameters.timeRange = userContext.preferences.defaultTimeRange;
    }

    // Apply department-specific filters
    if (userContext.department) {
      parameters.departmentId = parameters.departmentId || userContext.department.id;
    }

    // Apply role-based restrictions
    if (userContext.role === UserRole.BASIC) {
      parameters.sensitivity = parameters.sensitivity || DataSensitivity.PUBLIC;
    }

    return parameters;
  }

  private generateExecutionPlan(report: ReportDefinition, parameters: ReportParameters): ReportExecutionPlan {
    return {
      reportId: report.id,
      parameters,
      dataSources: report.dataSources,
      transformations: report.transformations,
      visualization: report.defaultVisualization,
      schedule: parameters.schedule || 'immediate',
      priority: parameters.priority || ExecutionPriority.NORMAL
    };
  }

  private calculateConfidence(intent: Intent, entities: Entity[]): number {
    let confidence = intent.confidence;

    // Adjust confidence based on entity recognition
    const entityConfidence = entities.reduce((sum, entity) => sum + entity.confidence, 0) / entities.length;
    confidence = (confidence + entityConfidence) / 2;

    // Penalize if required entities are missing
    if (intent.requiredEntities.some(e => !entities.some(entity => entity.type === e))) {
      confidence *= 0.7;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  private async generateSuggestions(query: string): Promise<string[]> {
    // Simple suggestion generation based on query keywords
    const keywords = query.split(' ').filter(k => k.length > 3);
    const suggestions: string[] = [];

    if (keywords.some(k => ['sales', 'revenue', 'profit'].includes(k))) {
      suggestions.push('Show me the sales report for last quarter');
      suggestions.push('What is our revenue trend this year?');
    }

    if (keywords.some(k => ['customer', 'client', 'user'].includes(k))) {
      suggestions.push('Show customer acquisition metrics');
      suggestions.push('What is our customer churn rate?');
    }

    if (keywords.some(k => ['inventory', 'stock', 'product'].includes(k))) {
      suggestions.push('Show current inventory levels');
      suggestions.push('What are our best-selling products?');
    }

    // Add some generic suggestions if none specific found
    if (suggestions.length === 0) {
      suggestions.push('Show me the executive dashboard');
      suggestions.push('What are our key performance indicators?');
      suggestions.push('Generate a financial summary report');
    }

    return suggestions;
  }
}
```

#### Competitive Advantages

1. **First-Mover Advantage in Predictive Reporting**
   - While competitors offer basic automation, our system provides predictive insights with 92%+ accuracy
   - 18-month head start in ML model training with proprietary datasets

2. **Unified Analytics Platform**
   - Single platform replaces 5+ separate tools (BI, reporting, analytics, dashboards)
   - 40% reduction in total cost of ownership for enterprise customers

3. **Real-Time Enterprise Intelligence**
   - Sub-second latency for most queries (vs 5-10 seconds for competitors)
   - WebSocket-based push notifications for critical events

4. **Enterprise-Grade Customization**
   - 100% white-label capable with deep theming options
   - Custom report builder with drag-and-drop interface

#### Long-Term Roadmap

**Phase 1: Foundation (0-6 months)**
- Core reporting engine with real-time capabilities
- Basic AI/ML integration for anomaly detection
- PWA implementation for mobile access
- WCAG 2.1 AAA compliance

**Phase 2: Intelligence (6-12 months)**
- Predictive analytics with 90%+ accuracy
- Natural language query interface
- Automated insight generation
- Advanced gamification system

**Phase 3: Ecosystem (12-18 months)**
- Marketplace for third-party report templates
- Developer API for custom integrations
- Blockchain-based audit logging
- AR/VR data visualization

**Phase 4: Autonomous Operations (18-24 months)**
- Self-healing report generation
- Autonomous anomaly resolution
- Cognitive decision support
- Full automation of routine reporting

---

## Performance Enhancements

### Redis Caching Layer Implementation

```typescript
// redis-cache.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { performance } from 'perf_hooks';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly cachePrefix = 'reporting:';
  private readonly defaultTtl = 3600; // 1 hour
  private readonly maxCacheSize = 1000000; // 1MB per item
  private cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };

  constructor(private configService: ConfigService) {
    const redisConfig = {
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
      retryStrategy: (times: number) => {
        return Math.min(times * 100, 5000);
      },
      reconnectOnError: (err: Error) => {
        const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNRESET'];
        return targetErrors.includes(err.message);
      }
    };

    this.redis = new Redis(redisConfig);

    // Set up event listeners
    this.redis.on('connect', () => {
      console.log('Redis client connected');
    });

    this.redis.on('error', (err) => {
      console.error('Redis error:', err);
      this.cacheStats.errors++;
      // In production, this would send to monitoring
    });

    this.redis.on('reconnecting', () => {
      console.log('Redis client reconnecting');
    });
  }

  async onModuleInit() {
    try {
      await this.redis.ping();
      console.log('Redis cache service initialized');
      this.setupCacheMonitoring();
    } catch (error) {
      console.error('Failed to initialize Redis cache:', error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.redis.quit();
      console.log('Redis cache service shutdown');
    } catch (error) {
      console.error('Error shutting down Redis:', error);
    }
  }

  private setupCacheMonitoring() {
    // Log cache stats every 5 minutes
    setInterval(() => {
      console.log('Cache Stats:', this.cacheStats);
      // Reset counters
      this.cacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0
      };
    }, 300000);
  }

  private generateCacheKey(key: string | object): string {
    if (typeof key === 'string') {
      return `${this.cachePrefix}${key}`;
    }

    // For object keys, create a consistent hash
    const hash = createHash('sha256');
    hash.update(JSON.stringify(key));
    return `${this.cachePrefix}${hash.digest('hex')}`;
  }

  private async checkCacheSize(value: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const size = Buffer.byteLength(serialized, 'utf8');
      return size <= this.maxCacheSize;
    } catch (error) {
      console.error('Error checking cache size:', error);
      return false;
    }
  }

  async get<T>(key: string | object): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key);

    try {
      const startTime = performance.now();
      const value = await this.redis.get(cacheKey);
      const duration = performance.now() - startTime;

      if (value) {
        this.cacheStats.hits++;
        // Log slow cache hits
        if (duration > 100) {
          console.warn(`Slow cache hit (${duration.toFixed(2)}ms) for key: ${cacheKey}`);
        }
        return JSON.parse(value);
      }

      this.cacheStats.misses++;
      return null;
    } catch (error) {
      this.cacheStats.errors++;
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string | object, value: T, ttl?: number): Promise<boolean> {
    const cacheKey = this.generateCacheKey(key);

    try {
      // Check if value is too large for cache
      if (!(await this.checkCacheSize(value))) {
        console.warn(`Value too large for cache (key: ${cacheKey})`);
        return false;
      }

      const serializedValue = JSON.stringify(value);
      const actualTtl = ttl || this.defaultTtl;

      const startTime = performance.now();
      const result = await this.redis.set(
        cacheKey,
        serializedValue,
        'EX',
        actualTtl
      );
      const duration = performance.now() - startTime;

      this.cacheStats.sets++;

      // Log slow cache sets
      if (duration > 100) {
        console.warn(`Slow cache set (${duration.toFixed(2)}ms) for key: ${cacheKey}`);
      }

      return result === 'OK';
    } catch (error) {
      this.cacheStats.errors++;
      console.error('Redis set error:', error);
      return false;
    }
  }

  async getWithFallback<T>(
    key: string | object,
    fallbackFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cachedValue = await this.get<T>(key);
    if (cachedValue !== null) {
      return cachedValue;
    }

    // Execute fallback function
    const value = await fallbackFn();

    // Cache the result
    await this.set(key, value, ttl);

    return value;
  }

  async delete(key: string | object): Promise<boolean> {
    const cacheKey = this.generateCacheKey(key);

    try {
      const result = await this.redis.del(cacheKey);
      this.cacheStats.deletes++;
      return result === 1;
    } catch (error) {
      this.cacheStats.errors++;
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    const cachePattern = `${this.cachePrefix}${pattern}`;
    try {
      const keys = await this.redis.keys(cachePattern);
      if (keys.length === 0) return 0;

      const result = await this.redis.del(keys);
      this.cacheStats.deletes += result;
      return result;
    } catch (error) {
      this.cacheStats.errors++;
      console.error('Redis delete pattern error:', error);
      return 0;
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    const cachePattern = `${this.cachePrefix}${pattern}`;
    try {
      return await this.redis.keys(cachePattern);
    } catch (error) {
      this.cacheStats.errors++;
      console.error('Redis keys error:', error);
      return [];
    }
  }

  async flush(): Promise<boolean> {
    try {
      const result = await this.redis.flushdb();
      this.cacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0
      };
      return result === 'OK';
    } catch (error) {
      this.cacheStats.errors++;
      console.error('Redis flush error:', error);
      return false;
    }
  }

  async getCacheStats(): Promise<CacheStats> {
    return {
      ...this.cacheStats,
      memoryUsage: await this.getMemoryUsage()
    };
  }

  private async getMemoryUsage(): Promise<MemoryUsage> {
    try {
      const info = await this.redis.info('memory');
      const lines = info.split('\r\n');

      const memory = {
        used: 0,
        total: 0,
        ratio: 0
      };

      for (const line of lines) {
        if (line.startsWith('used_memory:')) {
          memory.used = parseInt(line.split(':')[1], 10);
        } else if (line.startsWith('maxmemory:')) {
          memory.total = parseInt(line.split(':')[1], 10);
        }
      }

      if (memory.total > 0) {
        memory.ratio = memory.used / memory.total;
      }

      return memory;
    } catch (error) {
      console.error('Error getting memory usage:', error);
      return {
        used: 0,
        total: 0,
        ratio: 0
      };
    }
  }

  async cacheReportData(reportId: string, parameters: any, data: any): Promise<boolean> {
    const cacheKey = {
      reportId,
      parameters: this.normalizeParameters(parameters)
    };

    // Cache for 15 minutes by default
    return this.set(cacheKey, data, 900);
  }

  async getCachedReportData(reportId: string, parameters: any): Promise<any> {
    const cacheKey = {
      reportId,
      parameters: this.normalizeParameters(parameters)
    };

    return this.get(cacheKey);
  }

  private normalizeParameters(parameters: any): any {
    if (!parameters) return {};

    // Sort object keys to ensure consistent hashing
    const sortedKeys = Object.keys(parameters).sort();
    const normalized: any = {};

    for (const key of sortedKeys) {
      const value = parameters[key];

      // Convert dates to ISO strings for consistent comparison
      if (value instanceof Date) {
        normalized[key] = value.toISOString();
      }
      // Convert arrays to sorted strings
      else if (Array.isArray(value)) {
        normalized[key] = value.sort().toString();
      }
      // Convert objects to sorted key-value pairs
      else if (typeof value === 'object' && value !== null) {
        normalized[key] = this.normalizeParameters(value);
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  async withCache<T>(
    key: string | object,
    fn: () => Promise<T>,
    ttl?: number,
    options: CacheOptions = {}
  ): Promise<T> {
    const { forceRefresh = false, skipCache = false } = options;

    if (!skipCache && !forceRefresh) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    const result = await fn();

    if (!skipCache) {
      await this.set(key, result, ttl);
    }

    return result;
  }
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  memoryUsage?: MemoryUsage;
}

interface MemoryUsage {
  used: number;
  total: number;
  ratio: number;
}

interface CacheOptions {
  forceRefresh?: boolean;
  skipCache?: boolean;
}
```

### Database Query Optimization

```typescript
// database-optimizer.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource, QueryRunner, SelectQueryBuilder } from 'typeorm';
import { performance } from 'perf_hooks';
import { ReportQuery } from './interfaces/report-query.interface';
import { QueryAnalysisResult } from './interfaces/query-analysis-result.interface';
import { QueryOptimizationSuggestion } from './interfaces/query-optimization-suggestion.interface';

@Injectable()
export class DatabaseOptimizerService implements OnModuleInit {
  private readonly slowQueryThreshold = 1000; // 1 second
  private readonly verySlowQueryThreshold = 5000; // 5 seconds
  private readonly queryLog: QueryLogEntry[] = [];
  private readonly maxQueryLogSize = 1000;

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    // Set up query logging
    this.dataSource.driver.on('beforeQuery', (query, parameters) => {
      const entry: QueryLogEntry = {
        query: query,
        parameters: parameters || [],
        startTime: performance.now(),
        executionTime: 0,
        timestamp: new Date()
      };
      this.queryLog.push(entry);

      // Trim log if it gets too large
      if (this.queryLog.length > this.maxQueryLogSize) {
        this.queryLog.shift();
      }
    });

    this.dataSource.driver.on('afterQuery', (query, parameters) => {
      const entry = this.queryLog.find(
        e => e.query === query && JSON.stringify(e.parameters) === JSON.stringify(parameters)
      );

      if (entry) {
        entry.executionTime = performance.now() - entry.startTime;

        // Log slow queries
        if (entry.executionTime > this.slowQueryThreshold) {
          this.logSlowQuery(entry);
        }
      }
    });
  }

  private logSlowQuery(entry: QueryLogEntry) {
    const logLevel = entry.executionTime > this.verySlowQueryThreshold ? 'error' : 'warn';
    const message = `Slow query detected (${entry.executionTime.toFixed(2)}ms): ${entry.query}`;

    console[logLevel](message, {
      parameters: entry.parameters,
      executionTime: entry.executionTime,
      timestamp: entry.timestamp
    });

    // In production, this would send to monitoring
    this.reportToMonitoringSystem(entry);
  }

  private reportToMonitoringSystem(entry: QueryLogEntry) {
    // Implementation would send to APM system
    // This is a placeholder for the actual implementation
  }

  async optimizeReportQuery(query: ReportQuery): Promise<QueryAnalysisResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();

      // Analyze the query
      const analysis = await this.analyzeQuery(query, queryRunner);

      // Generate optimization suggestions
      const suggestions = this.generateOptimizationSuggestions(analysis);

      // Apply optimizations
      const optimizedQuery = this.applyOptimizations(query, suggestions);

      return {
        originalQuery: query,
        optimizedQuery,
        analysis,
        suggestions,
        performanceImprovement: this.estimatePerformanceImprovement(analysis, suggestions)
      };
    } finally {
      await queryRunner.release();
    }
  }

  private async analyzeQuery(query: ReportQuery, queryRunner: QueryRunner): Promise<QueryAnalysis> {
    const analysis: QueryAnalysis = {
      queryType: this.determineQueryType(query),
      tables: [],
      joins: [],
      whereClauses: [],
      groupBy: [],
      orderBy: [],
      subqueries: [],
      executionPlan: null,
      statistics: {
        estimatedRows: 0,
        estimatedCost: 0,
        actualTime: 0,
        actualRows: 0
      }
    };

    // Get execution plan
    const explainQuery = this.buildExplainQuery(query);
    const executionPlan = await queryRunner.query(explainQuery);
    analysis.executionPlan = executionPlan;

    // Parse execution plan to extract details
    this.parseExecutionPlan(executionPlan, analysis);

    // Get table statistics
    for (const table of analysis.tables) {
      const stats = await this.getTableStatistics(table.name, queryRunner);
      table.statistics = stats;
    }

    // Estimate query cost
    analysis.statistics.estimatedCost = this.estimateQueryCost(analysis);

    return analysis;
  }

  private determineQueryType(query: ReportQuery): QueryType {
    if (query.groupBy && query.groupBy.length > 0) {
      return QueryType.AGGREGATE;
    }

    if (query.joins && query.joins.length > 0) {
      return QueryType.JOIN;
    }

    if (query.subqueries && query.subqueries.length > 0) {
      return QueryType.COMPLEX;
    }

    return QueryType.SIMPLE;
  }

  private buildExplainQuery(query: ReportQuery): string {
    // Convert the report query to SQL
    const sql = this.buildSqlQuery(query);

    // Add EXPLAIN prefix
    return `EXPLAIN (ANALYZE, FORMAT JSON) ${sql}`;
  }

  private buildSqlQuery(query: ReportQuery): string {
    // This is a simplified version - actual implementation would be more complex
    let sql = 'SELECT ';

    // Add select columns
    if (query.select && query.select.length > 0) {
      sql += query.select.join(', ');
    } else {
      sql += '*';
    }

    // Add from
    sql += ` FROM ${query.from}`;

    // Add joins
    if (query.joins && query.joins.length > 0) {
      for (const join of query.joins) {
        sql += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
      }
    }

    // Add where clauses
    if (query.where && query.where.length > 0) {
      sql += ' WHERE ' + query.where.join(' AND ');
    }

    // Add group by
    if (query.groupBy && query.groupBy.length > 0) {
      sql += ' GROUP BY ' + query.groupBy.join(', ');
    }

    // Add order by
    if (query.orderBy && query.orderBy.length > 0) {
      sql += ' ORDER BY ' + query.orderBy.join(', ');
    }

    // Add limit
    if (query.limit) {
      sql += ` LIMIT ${query.limit}`;
    }

    return sql;
  }

  private parseExecutionPlan(plan: any[], analysis: QueryAnalysis) {
    if (!plan || plan.length === 0) return;

    const planNode = plan[0]['QUERY PLAN'];
    this.parsePlanNode(planNode, analysis);
  }

  private parsePlanNode(node: any, analysis: QueryAnalysis, parentNode?: any) {
    if (!node) return;

    // Extract node type
    const nodeType = node['Node Type'] || node['node_type'];
    const actualRows = node['Actual Rows'] || node['actual_rows'];
    const actualTime = node['Actual Total Time'] || node['actual_total_time'];
    const estimatedRows = node['Plan Rows'] || node['plan_rows'];
    const estimatedCost = node['Total Cost'] || node['total_cost'];

    // Update statistics
    if (actualRows !== undefined) {
      analysis.statistics.actualRows += actualRows;
    }
    if (actualTime !== undefined) {
      analysis.statistics.actualTime += actualTime;
    }
    if (estimatedRows !== undefined) {
      analysis.statistics.estimatedRows = estimatedRows;
    }
    if (estimatedCost !== undefined) {
      analysis.statistics.estimatedCost = estimatedCost;
    }

    // Extract table information
    if (node['Relation Name'] || node['relation_name']) {
      const tableName = node['Relation Name'] || node['relation_name'];
      const alias = node['Alias'] || node['alias'] || tableName;

      if (!analysis.tables.some(t => t.name === tableName)) {
        analysis.tables.push({
          name: tableName,
          alias,
          statistics: null
        });
      }
    }

    // Extract join information
    if (nodeType === 'Hash Join' || nodeType === 'Merge Join' || nodeType === 'Nested Loop') {
      const joinType = node['Join Type'] || node['join_type'];
      const condition = node['Hash Cond'] || node['Merge Cond'] || node['Join Filter'] || '';

      analysis.joins.push({
        type: joinType,
        condition,
        tables: [
          node['Inner Unique'] ? node['Inner']?.['Relation Name'] : node['Outer']?.['Relation Name'],
          node['Inner']?.['Relation Name']
        ].filter(Boolean)
      });
    }

    // Extract where clauses
    if (node['Filter'] || node['Index Cond']) {
      const filter = node['Filter'] || node['Index Cond'];
      if (filter && !analysis.whereClauses.includes(filter)) {
        analysis.whereClauses.push(filter);
      }
    }

    // Extract group by
    if (node['Group Key']) {
      for (const key of node['Group Key']) {
        if (!analysis.groupBy.includes(key)) {
          analysis.groupBy.push(key);
        }
      }
    }

    // Extract order by
    if (node['Sort Key']) {
      for (const key of node['Sort Key']) {
        if (!analysis.orderBy.includes(key)) {
          analysis.orderBy.push(key);
        }
      }
    }

    // Recursively parse child nodes
    if (node['Plans'] || node['plans']) {
      const plans = node['Plans'] || node['plans'];
      for (const plan of plans) {
        this.parsePlanNode(plan, analysis, node);
      }
    }
  }

  private async getTableStatistics(tableName: string, queryRunner: QueryRunner): Promise<TableStatistics> {
    try {
      // Get table size
      const sizeResult = await queryRunner.query(`
        SELECT pg_size_pretty(pg_total_relation_size($1)) as size,
               pg_total_relation_size($1) as size_bytes
      `, [tableName]);

      // Get row count
      const countResult = await queryRunner.query(`
        SELECT reltuples as approximate_row_count
        FROM pg_class
        WHERE relname = $1
      `, [tableName]);

      // Get index information
      const indexResult = await queryRunner.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = $1
      `, [tableName]);

      return {
        size: sizeResult[0].size,
        sizeBytes: sizeResult[0].size_bytes,
        rowCount: parseInt(countResult[0].approximate_row_count),
        indexes: indexResult.map(idx => ({
          name: idx.indexname,
          definition: idx.indexdef
        }))
      };
    } catch (error) {
      console.error(`Error getting statistics for table ${tableName}:`, error);
      return {
        size: 'unknown',
        sizeBytes: 0,
        rowCount: 0,
        indexes: []
      };
    }
  }

  private estimateQueryCost(analysis: QueryAnalysis): number {
    let cost = 0;

    // Base cost based on query type
    switch (analysis.queryType) {
      case QueryType.SIMPLE:
        cost = 10;
        break;
      case QueryType.JOIN:
        cost = 50;
        break;
      case QueryType.AGGREGATE:
        cost = 100;
        break;
      case QueryType.COMPLEX:
        cost = 200;
        break;
    }

    // Add cost for tables
    cost += analysis.tables.length * 10;

    // Add cost for joins
    cost += analysis.joins.length * 30;

    // Add cost for where clauses
    cost += analysis.whereClauses.length * 5;

    // Add cost for group by
    cost += analysis.groupBy.length * 20;

    // Add cost for order by
    cost += analysis.orderBy.length * 15;

    // Adjust based on table sizes
    for (const table of analysis.tables) {
      if (table.statistics) {
        cost += Math.log10(table.statistics.rowCount + 1) * 10;
      }
    }

    return cost;
  }

  private generateOptimizationSuggestions(analysis: QueryAnalysis): QueryOptimizationSuggestion[] {
    const suggestions: QueryOptimizationSuggestion[] = [];

    // Check for missing indexes
    for (const table of analysis.tables) {
      if (table.statistics && table.statistics.rowCount > 10000) {
        // Check if where clauses could benefit from indexes
        for (const whereClause of analysis.whereClauses) {
          if (whereClause.includes(table.name) || whereClause.includes(table.alias)) {
            const columnMatch = whereClause.match(/(\w+)\s*(=|>|<|>=|<=|<>|!=|LIKE)\s*/);
            if (columnMatch && columnMatch[1]) {
              const column = columnMatch[1];
              const existingIndex = table.statistics.indexes.find(idx =>
                idx.definition.includes(column)
              );

              if (!existingIndex) {
                suggestions.push({
                  type: SuggestionType.INDEX,
                  description: `Add index on ${table.name}.${column} to improve WHERE clause performance`,
                  impact: ImpactLevel.HIGH,
                  table: table.name,
                  column: column,
                  sql: `CREATE INDEX idx_${table.name}_${column} ON ${table.name} (${column});`
                });
              }
            }
          }
        }
      }
    }

    // Check for inefficient joins
    for (const join of analysis.joins) {
      if (join.type === 'Nested Loop' && analysis.statistics.estimatedRows > 1000) {
        suggestions.push({
          type: SuggestionType.JOIN,
          description: `Nested Loop join detected on large tables - consider rewriting as Hash or Merge join`,
          impact: ImpactLevel.MEDIUM,
          table1: join.tables[0],
          table2: join.tables[1],
          currentJoinType: join.type
        });
      }
    }

    // Check for full table scans
    if (analysis.executionPlan && this.hasFullTableScan(analysis.executionPlan)) {
      suggestions.push({
        type: SuggestionType.SCAN,
        description: 'Full table scan detected - consider adding appropriate indexes or rewriting query',
        impact: ImpactLevel.HIGH
      });
    }

    // Check for expensive operations
    if (analysis.groupBy.length > 0 && analysis.statistics.estimatedRows > 10000) {
      suggestions.push({
        type: SuggestionType.GROUP_BY,
        description: 'Large dataset with GROUP BY - consider pre-aggregating data or using materialized views',
        impact: ImpactLevel.MEDIUM
      });
    }

    // Check for sorting on large datasets
    if (analysis.orderBy.length > 0 && analysis.statistics.estimatedRows > 10000) {
      suggestions.push({
        type: SuggestionType.ORDER_BY,
        description: 'Large dataset with ORDER BY - consider adding indexes on sort columns',
        impact: ImpactLevel.MEDIUM,
        columns: analysis.orderBy
      });
    }

    // Check for select *
    if (analysis.queryType === QueryType.SIMPLE && !analysis.select) {
      suggestions.push({
        type: SuggestionType.SELECT,
        description: 'Using SELECT * - specify only needed columns to reduce data transfer',
        impact: ImpactLevel.LOW
      });
    }

    // Check for subqueries that could be joins
    if (analysis.subqueries.length > 0) {
      suggestions.push({
        type: SuggestionType.SUBQUERY,
        description: 'Subqueries detected - consider rewriting as joins for better performance',
        impact: ImpactLevel.MEDIUM
      });
    }

    return suggestions;
  }

  private hasFullTableScan(plan: any): boolean {
    if (!plan) return false;

    if (plan['Node Type'] === 'Seq Scan' || plan['node_type'] === 'Seq Scan') {
      return true;
    }

    if (plan['Plans'] || plan['plans']) {
      const plans = plan['Plans'] || plan['plans'];
      return plans.some((p: any) => this.hasFullTableScan(p));
    }

    return false;
  }

  private applyOptimizations(query: ReportQuery, suggestions: QueryOptimizationSuggestion[]): ReportQuery {
    let optimizedQuery = { ...query };

    // Apply index suggestions
    for (const suggestion of suggestions) {
      if (suggestion.type === SuggestionType.INDEX) {
        // This would be handled at the database level, not in the query
        continue;
      }

      if (suggestion.type === SuggestionType.JOIN) {
        // For join optimizations, we might rewrite the query
        if (suggestion.currentJoinType === 'Nested Loop') {
          optimizedQuery = this.rewriteNestedLoopJoins(optimizedQuery);
        }
      }

      if (suggestion.type === SuggestionType.SELECT) {
        // Replace SELECT * with specific columns
        if (!optimizedQuery.select || optimizedQuery.select.length === 0) {
          optimizedQuery.select = this.getDefaultColumnsForTable(optimizedQuery.from);
        }
      }
    }

    // Apply other optimizations
    optimizedQuery = this.optimizeWhereClauses(optimizedQuery);
    optimizedQuery = this.optimizeOrderBy(optimizedQuery);
    optimizedQuery = this.addQueryHints(optimizedQuery);

    return optimizedQuery;
  }

  private rewriteNestedLoopJoins(query: ReportQuery): ReportQuery {
    // This is a simplified version - actual implementation would be more complex
    const optimizedQuery = { ...query };

    if (optimizedQuery.joins) {
      optimizedQuery.joins = optimizedQuery.joins.map(join => {
        if (join.type === 'INNER') {
          // For inner joins, we can try to reorder them
          return {
            ...join,
            type: 'HASH' // Try hash join instead
          };
        }
        return join;
      });
    }

    return optimizedQuery;
  }

  private getDefaultColumnsForTable(table: string): string[] {
    // In a real implementation, this would come from metadata
    const defaultColumns: Record<string, string[]> = {
      'users': ['id', 'name', 'email', 'created_at', 'updated_at'],
      'orders': ['id', 'user_id', 'total', 'status', 'created_at'],
      'products': ['id', 'name', 'price', 'category', 'stock'],
      'transactions': ['id', 'amount', 'type', 'status', 'created_at']
    };

    return defaultColumns[table] || ['*'];
  }

  private optimizeWhereClauses(query: ReportQuery): ReportQuery {
    const optimizedQuery = { ...query };

    if (optimizedQuery.where && optimizedQuery.where.length > 0) {
      // Reorder where clauses to put most selective first
      optimizedQuery.where = this.reorderWhereClauses(optimizedQuery.where);

      // Simplify complex conditions
      optimizedQuery.where = optimizedQuery.where.map(clause =>
        this.simplifyWhereClause(clause)
      );
    }

    return optimizedQuery;
  }

  private reorderWhereClauses(clauses: string[]): string[] {
    // In a real implementation, this would use statistics to determine selectivity
    // For now, we'll just put equality conditions first
    const equalityClauses = clauses.filter(c => c.includes('='));
    const otherClauses = clauses.filter(c => !c.includes('='));

    return [...equalityClauses, ...otherClauses];
  }

  private simplifyWhereClause(clause: string): string {
    // Simplify complex conditions
    if (clause.includes(' AND ')) {
      const parts = clause.split(' AND ');
      if (parts.length > 2) {
        // Group conditions that can be evaluated together
        return `(${parts.join(' AND ')})`;
      }
    }

    return clause;
  }

  private optimizeOrderBy(query: ReportQuery): ReportQuery {
    const optimizedQuery = { ...query };

    if (optimizedQuery.orderBy && optimizedQuery.orderBy.length > 0) {
      // Remove redundant order by clauses
      optimizedQuery.orderBy = [...new Set(optimizedQuery.orderBy)];

      // If we have a limit, we might not need all order by clauses
      if (optimizedQuery.limit && optimizedQuery.limit < 1000) {
        optimizedQuery.orderBy = optimizedQuery.orderBy.slice(0, 2);
      }
    }

    return optimizedQuery;
  }

  private addQueryHints(query: ReportQuery): ReportQuery {
    // In PostgreSQL, we can add hints using comments
    // This is a simplified version
    const optimizedQuery = { ...query };

    if (optimizedQuery.joins && optimizedQuery.joins.length > 0) {
      // Add join hints
      optimizedQuery.comment = optimizedQuery.comment || '';
      optimizedQuery.comment += ' /*+ HashJoin */';
    }

    return optimizedQuery;
  }

  private estimatePerformanceImprovement(
    analysis: QueryAnalysis,
    suggestions: QueryOptimizationSuggestion[]
  ): number {
    let improvement = 0;

    for (const suggestion of suggestions) {
      switch (suggestion.impact) {
        case ImpactLevel.HIGH:
          improvement += 0.5;
          break;
        case ImpactLevel.MEDIUM:
          improvement += 0.3;
          break;
        case ImpactLevel.LOW:
          improvement += 0.1;
          break;
      }
    }

    // Cap at 90% improvement
    return Math.min(improvement, 0.9);
  }

  async getQueryPerformanceHistory(queryPattern: string): Promise<QueryPerformanceHistory> {
    const matchingQueries = this.queryLog.filter(entry =>
      entry.query.includes(queryPattern)
    );

    if (matchingQueries.length === 0) {
      return {
        count: 0,
        avgExecutionTime: 0,
        minExecutionTime: 0,
        maxExecutionTime: 0,
        samples: []
      };
    }

    const executionTimes = matchingQueries.map(q => q.executionTime);
    const avgExecutionTime = executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length;

    return {
      count: matchingQueries.length,
      avgExecutionTime,
      minExecutionTime: Math.min(...executionTimes),
      maxExecutionTime: Math.max(...executionTimes),
      samples: matchingQueries.slice(0, 10) // Return up to 10 samples
    };
  }

  async getSlowestQueries(limit: number = 10): Promise<QueryLogEntry[]> {
    return [...this.queryLog]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  async getMostFrequentQueries(limit: number = 10): Promise<{query: string, count: number}[]> {
    const queryCounts: Record<string, number> = {};

    for (const entry of this.queryLog) {
      const normalizedQuery = this.normalizeQuery(entry.query);
      queryCounts[normalizedQuery] = (queryCounts[normalizedQuery] || 0) + 1;
    }

    return Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private normalizeQuery(query: string): string {
    // Remove comments
    let normalized = query.replace(/\/\*.*?\*\//g, '');

    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // Remove parameter values (replace with ?)
    normalized = normalized.replace(/=\s*'[^']*'/g, '= ?');
    normalized = normalized.replace(/=\s*\d+/g, '= ?');

    return normalized;
  }
}

interface QueryAnalysis {
  queryType: QueryType;
  tables: TableInfo[];
  joins: JoinInfo[];
  whereClauses: string[];
  groupBy: string[];
  orderBy: string[];
  subqueries: SubqueryInfo[];
  executionPlan: any;
  statistics: QueryStatistics;
}

interface TableInfo {
  name: string;
  alias: string;
  statistics: TableStatistics | null;
}

interface TableStatistics {
  size: string;
  sizeBytes: number;
  rowCount: number;
  indexes: IndexInfo[];
}

interface IndexInfo {
  name: string;
  definition: string;
}

interface JoinInfo {
  type: string;
  condition: string;
  tables: string[];
}

interface SubqueryInfo {
  query: string;
  correlated: boolean;
}

interface QueryStatistics {
  estimatedRows: number;
  estimatedCost: number;
  actualTime: number;
  actualRows: number;
}

enum QueryType {
  SIMPLE = 'simple',
  JOIN = 'join',
  AGGREGATE = 'aggregate',
  COMPLEX = 'complex'
}

enum SuggestionType {
  INDEX = 'index',
  JOIN = 'join',
  SCAN = 'scan',
  GROUP_BY = 'group_by',
  ORDER_BY = 'order_by',
  SELECT = 'select',
  SUBQUERY = 'subquery'
}

enum ImpactLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

interface QueryOptimizationSuggestion {
  type: SuggestionType;
  description: string;
  impact: ImpactLevel;
  table?: string;
  column?: string;
  sql?: string;
  table1?: string;
  table2?: string;
  currentJoinType?: string;
  columns?: string[];
}

interface QueryLogEntry {
  query: string;
  parameters: any[];
  startTime: number;
  executionTime: number;
  timestamp: Date;
}

interface QueryPerformanceHistory {
  count: number;
  avgExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  samples: QueryLogEntry[];
}
```

### API Response Compression

```typescript
// response-compression.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as compression from 'compression';
import { promisify } from 'util';
import { gzip, brotliCompress } from 'zlib';
import { performance } from 'perf_hooks';

const gzipAsync = promisify(gzip);
const brotliCompressAsync = promisify(brotliCompress);

@Injectable()
export class ResponseCompressionMiddleware implements NestMiddleware {
  private readonly compressionThreshold = 1024; // 1KB
  private readonly compressionLevels = {
    gzip: 6, // Default level (0-9)
    brotli: 6 // Default level (0-11)
  };
  private readonly cacheControl = 'public, max-age=3600';
  private readonly excludedPaths = [
    '/health',
    '/status',
    '/metrics'
  ];
  private readonly excludedContentTypes = [
    'image/',
    'video/',
    'audio/',
    'application/pdf',
    'application/zip',
    'application/octet-stream'
  ];

  private compressionStats = {
    totalRequests: 0,
    compressedRequests: 0,
    gzipCompressions: 0,
    brotliCompressions: 0,
    totalBytesIn: 0,
    totalBytesOut: 0,
    avgCompressionRatio: 0
  };

  private lastStatsReset = performance.now();

  constructor() {
    this.setupStatsMonitoring();
  }

  private setupStatsMonitoring() {
    // Log stats every 5 minutes
    setInterval(() => {
      const now = performance.now();
      const duration = (now - this.lastStatsReset) / 1000; // in seconds

      console.log('Compression Stats:', {
        ...this.compressionStats,
        requestsPerSecond: this.compressionStats.totalRequests / duration,
        compressionRatio: this.compressionStats.avgCompressionRatio,
        period: `${duration.toFixed(1)}s`
      });

      // Reset counters
      this.compressionStats = {
        totalRequests: 0,
        compressedRequests: 0,
        gzipCompressions: 0,
        brotliCompressions: 0,
        totalBytesIn: 0,
        totalBytesOut: 0,
        avgCompressionRatio: 0
      };
      this.lastStatsReset = now;
    }, 300000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.compressionStats.totalRequests++;

    // Skip compression for excluded paths
    if (this.shouldExcludePath(req.path)) {
      return next();
    }

    // Check if client supports compression
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const supportsGzip = acceptEncoding.includes('gzip');
    const supportsBrotli = acceptEncoding.includes('br');

    // If no compression support, proceed normally
    if (!supportsGzip && !supportsBrotli) {
      return next();
    }

    // Store original methods
    const originalWrite = res.write;
    const originalEnd = res.end;
    const originalJson = res.json;
    const originalSend = res.send;

    let responseData: any = null;
    let responseHeadersSent = false;
    let compressionMethod: 'gzip' | 'brotli' | null = null;
    let originalContentLength: number | null = null;

    // Override response methods
    res.write = (chunk: any, encoding?: any, callback?: any) => {
      if (!responseHeadersSent) {
        responseData = responseData ? Buffer.concat([responseData, chunk]) : chunk;
      } else {
        originalWrite.call(res, chunk, encoding, callback);
      }
      return true;
    };

    res.end = (chunk?: any, encoding?: any, callback?: any) => {
      if (chunk) {
        responseData = responseData ? Buffer.concat([responseData, chunk]) : chunk;
      }

      if (responseData) {
        this.compressAndSend(res, responseData, supportsGzip, supportsBrotli)
          .then(() => {
            originalEnd.call(res, callback);
          })
          .catch(err => {
            console.error('Compression error:', err);
            originalEnd.call(res, responseData, encoding, callback);
          });
      } else {
        originalEnd.call(res, callback);
      }
    };

    res.json = (body: any) => {
      responseData = Buffer.from(JSON.stringify(body));
      return res;
    };

    res.send = (body: any) => {
      if (body) {
        if (typeof body === 'string') {
          responseData = Buffer.from(body);
        } else if (Buffer.isBuffer(body)) {
          responseData = body;
        } else {
          responseData = Buffer.from(JSON.stringify(body));
        }
      }
      return res;
    };

    // Set compression headers
    res.setHeader('Vary', 'Accept-Encoding');

    // Proceed to the next middleware
    next();
  }

  private shouldExcludePath(path: string): boolean {
    return this.excludedPaths.some(excludedPath =>
      path.startsWith(excludedPath)
    );
  }

  private shouldExcludeContentType(contentType: string): boolean {
    return this.excludedContentTypes.some(excludedType =>
      contentType.startsWith(excludedType)
    );
  }

  private async compressAndSend(
    res: Response,
    data: Buffer,
    supportsGzip: boolean,
    supportsBrotli: boolean
  ): Promise<void> {
    try {
      const contentType = res.getHeader('Content-Type') as string || '';
      const contentLength = data.length;

      // Skip compression for small responses or excluded content types
      if (contentLength < this.compressionThreshold ||
          this.shouldExcludeContentType(contentType)) {
        res.setHeader('Content-Length', contentLength);
        res.write(data);
        return;
      }

      // Determine best compression method
      let compressedData: Buffer;
      let method: 'gzip' | 'brotli';

      if (supportsBrotli) {
        compressedData = await brotliCompressAsync(data, {
          params: {
            [brotli.constants.BROTLI_PARAM_QUALITY]: this.compressionLevels.brotli
          }
        });
        method = 'brotli';
      } else if (supportsGzip) {
        compressedData = await gzipAsync(data, {
          level: this.compressionLevels.gzip
        });
        method = 'gzip';
      } else {
        // Shouldn't happen since we checked earlier
        res.setHeader('Content-Length', contentLength);
        res.write(data);
        return;
      }

      // Update stats
      this.compressionStats.compressedRequests++;
      if (method === 'gzip') this.compressionStats.gzipCompressions++;
      if (method === 'brotli') this.compressionStats.brotliCompressions++;

      this.compressionStats.totalBytesIn += contentLength;
      this.compressionStats.totalBytesOut += compressedData.length;

      const compressionRatio = compressedData.length / contentLength;
      this.compressionStats.avgCompressionRatio =
        (this.compressionStats.avgCompressionRatio + compressionRatio) / 2;

      // Set appropriate headers
      res.setHeader('Content-Encoding', method);
      res.setHeader('Content-Length', compressedData.length);
      res.removeHeader('Content-MD5'); // Remove if present as it's no longer valid

      // Cache control
      if (res.statusCode === 200) {
        res.setHeader('Cache-Control', this.cacheControl);
      }

      // Write compressed data
      res.write(compressedData);
    } catch (error) {
      console.error('Compression failed:', error);
      // Fall back to uncompressed
      const contentLength = data.length;
      res.setHeader('Content-Length', contentLength);
      res.write(data);
    }
  }

  // Alternative: Express compression middleware with custom enhancements
  static expressCompression(): (req: Request, res: Response, next: NextFunction) => void {
    const middleware = compression({
      threshold: 1024,
      filter: (req: Request, res: Response) => {
        // Custom filter logic
        if (req.headers['x-no-compression']) {
          return false;
        }

        const contentType = res.getHeader('Content-Type') as string || '';
        return !contentType.startsWith('image/');
      },
      level: 6,
      strategy: 0, // Z_DEFAULT_STRATEGY
      chunkSize: 16384,
      windowBits: 15,
      memLevel: 8,
      enabled: true
    });

    return (req: Request, res: Response, next: NextFunction) => {
      // Add custom headers
      res.setHeader('X-Compression', 'enabled');

      // Call the original middleware
      middleware(req, res, next);
    };
  }

  // Method to get current compression stats
  getStats(): CompressionStats {
    return {
      ...this.compressionStats,
      compressionRatio: this.compressionStats.totalBytesIn > 0 ?
        this.compressionStats.totalBytesOut / this.compressionStats.totalBytesIn : 0
    };
  }
}

interface CompressionStats {
  totalRequests: number;
  compressedRequests: number;
  gzipCompressions: number;
  brotliCompressions: number;
  totalBytesIn: number;
  totalBytesOut: number;
  avgCompressionRatio: number;
  compressionRatio: number;
}
```

### Lazy Loading Implementation

```typescript
// lazy-loader.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { performance } from 'perf_hooks';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Injectable()
export class LazyLoaderService implements OnModuleInit {
  private readonly loadingQueue: Map<string, LoadingOperation> = new Map();
  private readonly loadedModules: Map<string, any> = new Map();
  private readonly loadEvents: Subject<LoadEvent> = new Subject();
  private readonly maxConcurrentLoads = 5;
  private readonly debounceTimeMs = 300;
  private readonly cacheTtl = 3600000; // 1 hour

  private currentLoads = 0;
  private stats = {
    totalLoads: 0,
    successfulLoads: 0,
    failedLoads: 0,
    cacheHits: 0,
    avgLoadTime: 0,
    lastReset: performance.now()
  };

  constructor(private moduleRef: ModuleRef) {
    this.setupEventProcessing();
    this.setupStatsMonitoring();
  }

  onModuleInit() {
    console.log('LazyLoaderService initialized');
  }

  private setupEventProcessing() {
    this.loadEvents.pipe(
      debounceTime(this.debounceTimeMs),
      distinctUntilChanged((prev, curr) => prev.moduleName === curr.moduleName)
    ).subscribe(event => {
      this.processLoadEvent(event);
    });
  }

  private setupStatsMonitoring() {
    setInterval(() => {
      const now = performance.now();
      const duration = (now - this.stats.lastReset) / 1000; // in seconds

      console.log('Lazy Loading Stats:', {
        ...this.stats,
        loadsPerSecond: this.stats.totalLoads / duration,
        successRate: this.stats.totalLoads > 0 ?
          (this.stats.successfulLoads / this.stats.totalLoads * 100).toFixed(2) + '%' : 'N/A',
        period: `${duration.toFixed(1)}s`
      });

      // Reset counters
      this.stats = {
        totalLoads: 0,
        successfulLoads: 0,
        failedLoads: 0,
        cacheHits: 0,
        avgLoadTime: 0,
        lastReset: now
      };
    }, 300000); // 5 minutes
  }

  async loadModule<T>(moduleName: string, options: LoadOptions = {}): Promise<T> {
    const { forceReload = false, priority = LoadPriority.NORMAL } = options;

    // Check cache first
    if (!forceReload && this.loadedModules.has(moduleName)) {
      const cached = this.loadedModules.get(moduleName);
      if (this.isCacheValid(cached)) {
        this.stats.cacheHits++;
        return cached.module;
      } else {
        this.loadedModules.delete(moduleName);
      }
    }

    // Create loading operation
    const operationId = this.generateOperationId(moduleName);
    const operation: LoadingOperation = {
      id: operationId,
      moduleName,
      priority,
      status: LoadStatus.PENDING,
      createdAt: performance.now(),
      resolvedAt: 0,
      promise: null,
      resolve: null,
      reject: null
    };

    // Create promise for this load operation
    operation.promise = new Promise<T>((resolve, reject) => {
      operation.resolve = resolve;
      operation.reject = reject;
    });

    this.loadingQueue.set(operationId, operation);

    // Emit load event
    this.loadEvents.next({
      moduleName,
      priority,
      timestamp: performance.now()
    });

    return operation.promise;
  }

  private async processLoadEvent(event: LoadEvent) {
    // Check if we can process more loads
    if (this.currentLoads >= this.maxConcurrentLoads) {
      return;
    }

    // Find the highest priority pending operation
    const pendingOperations = Array.from(this.loadingQueue.values())
      .filter(op => op.status === LoadStatus.PENDING)
      .sort((a, b) => b.priority - a.priority);

    if (pendingOperations.length === 0) {
      return;
    }

    const operation = pendingOperations[0];
    this.currentLoads++;

    // Mark as loading
    operation.status = LoadStatus.LOADING;
    operation.startedAt = performance.now();

    try {
      // Actually load the module
      const module = await this.doLoadModule(operation.moduleName);

      // Cache the module
      this.loadedModules.set(operation.moduleName, {
        module,
        loadedAt: performance.now(),
        expiresAt: performance.now() + this.cacheTtl
      });

      // Resolve the promise
      operation.resolve!(module);
      operation.status = LoadStatus.SUCCESS;
      operation.resolvedAt = performance.now();

      this.stats.successfulLoads++;
      this.stats.avgLoadTime =
        (this.stats.avgLoadTime * (this.stats.totalLoads - 1) + (operation.resolvedAt - operation.startedAt)) /
        this.stats.totalLoads;
    } catch (error) {
      operation.reject!(error);
      operation.status = LoadStatus.FAILED;
      operation.resolvedAt = performance.now();

      this.stats.failedLoads++;
      console.error(`Failed to load module ${operation.moduleName}:`, error);
    } finally {
      this.loadingQueue.delete(operation.id);
      this.currentLoads--;
      this.stats.totalLoads++;

      // Process next operation if any
      if (this.loadingQueue.size > 0) {
        this.loadEvents.next({
          moduleName: operation.moduleName,
          priority: LoadPriority.HIGH, // Trigger immediate processing
          timestamp: performance.now()
        });
      }
    }
  }

  private async doLoadModule(moduleName: string): Promise<any> {
    try {
      // In a real implementation, this would load the actual module
      // For NestJS, we can use the ModuleRef to get providers

      // Check if it's a provider
      try {
        return this.moduleRef.get(moduleName, { strict: false });
      } catch (e) {
        // Not a provider, try dynamic import
      }

      // Dynamic import for other modules
      const modulePath = this.getModulePath(moduleName);
      const module = await import(modulePath);

      // If it's a default export, return that
      if (module.default) {
        return module.default;
      }

      // Otherwise return the module itself
      return module;
    } catch (error) {
      console.error(`Error loading module ${moduleName}:`, error);
      throw new Error(`Failed to load module ${moduleName}: ${error.message}`);
    }
  }

  private getModulePath(moduleName: string): string {
    // Map module names to actual paths
    const modulePaths: Record<string, string> = {
      'ReportGenerator': './report-generator/report-generator.service',
      'DataProcessor': './data-processor/data-processor.service',
      'VisualizationEngine': './visualization/visualization-engine.service',
      'EmailService': './notification/email.service',
      'PdfGenerator': './export/pdf-generator.service',
      'ExcelGenerator': './export/excel-generator.service'
    };

    if (modulePaths[moduleName]) {
      return modulePaths[moduleName];
    }

    // Default to the module name as path
    return moduleName;
  }

  private generateOperationId(moduleName: string): string {
    return `${moduleName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCacheValid(cached: CachedModule): boolean {
    return cached.expiresAt > performance.now();
  }

  getLoadingStatus(moduleName: string): LoadStatus {
    const operation = Array.from(this.loadingQueue.values())
      .find(op => op.moduleName === moduleName);

    if (operation) {
      return operation.status;
    }

    if (this.loadedModules.has(moduleName)) {
      return LoadStatus.SUCCESS;
    }

    return LoadStatus.NOT_LOADED;
  }

  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  getLoadingQueue(): LoadingOperation[] {
    return Array.from(this.loadingQueue.values());
  }

  clearCache(moduleName?: string): void {
    if (moduleName) {
      this.loadedModules.delete(moduleName);
    } else {
      this.loadedModules.clear();
    }
  }

  onModuleLoad(): Observable<LoadEvent> {
    return this.loadEvents.asObservable();
  }

  async preloadModules(moduleNames: string[], priority: LoadPriority = LoadPriority.LOW): Promise<void> {
    const promises = moduleNames.map(moduleName =>
      this.loadModule(moduleName, { priority })
        .catch(error => {
          console.warn(`Preload failed for ${moduleName}:`, error);
        })
    );

    await Promise.all(promises);
  }

  async loadWithFallback<T>(
    primaryModule: string,
    fallbackModule: string,
    options: LoadOptions = {}
  ): Promise<T> {
    try {
      return await this.loadModule<T>(primaryModule, options);
    } catch (error) {
      console.warn(`Primary module ${primaryModule} failed, falling back to ${fallbackModule}`);
      return this.loadModule<T>(fallbackModule, options);
    }
  }
}

interface LoadingOperation {
  id: string;
  moduleName: string;
  priority: LoadPriority;
  status: LoadStatus;
  createdAt: number;
  startedAt?: number;
  resolvedAt: number;
  promise: Promise<any>;
  resolve: ((value: any) => void) | null;
  reject: ((reason?: any) => void) | null;
}

interface LoadEvent {
  moduleName: string;
  priority: LoadPriority;
  timestamp: number;
}

interface LoadOptions {
  forceReload?: boolean;
  priority?: LoadPriority;
}

interface CachedModule {
  module: any;
  loadedAt: number;
  expiresAt: number;
}

enum LoadStatus {
  NOT_LOADED = 'not_loaded',
  PENDING = 'pending',
  LOADING = 'loading',
  SUCCESS = 'success',
  FAILED = 'failed'
}

enum LoadPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

// Example usage decorator
export function LazyLoad(moduleName: string, options: LoadOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const lazyLoader = this.lazyLoaderService || new LazyLoaderService(this.moduleRef);

      try {
        const module = await lazyLoader.loadModule(moduleName, options);
        return originalMethod.apply(this, [module, ...args]);
      } catch (error) {
        console.error(`Failed to load module ${moduleName} for method ${propertyKey}:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}
```

### Request Debouncing

```typescript
// request-debouncer.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { performance } from 'perf_hooks';

@Injectable()
export class RequestDebouncerService implements OnModuleInit {
  private readonly debounceMap: Map<string, DebounceEntry> = new Map();
  private readonly requestSubject: Subject<DebouncedRequest> = new Subject();
  private readonly defaultDebounceTime = 500; // ms
  private readonly maxDebounceTime = 5000; // ms
  private readonly maxQueueSize = 1000;

  private stats = {
    totalRequests: 0,
    debouncedRequests: 0,
    uniqueRequests: 0,
    avgDebounceTime: 0,
    lastReset: performance.now()
  };

  constructor() {
    this.setupStatsMonitoring();
  }

  onModuleInit() {
    console.log('RequestDebouncerService initialized');
    this.setupRequestProcessing();
  }

  private setupRequestProcessing() {
    // Process requests with the same key
    this.requestSubject.pipe(
      // Group by request key
      groupBy(request => request.key),
      // For each group, debounce and process
      mergeMap(group$ => group$.pipe(
        debounceTime(this.defaultDebounceTime),
        distinctUntilChanged((prev, curr) => this.areRequestsEqual(prev, curr)),
        // Take the last request in the debounce window
        takeLast(1)
      ))
    ).subscribe(async request => {
      try {
        await this.executeRequest(request);
      } catch (error) {
        console.error('Error executing debounced request:', error);
        this.handleRequestError(request, error);
      }
    });
  }

  private setupStatsMonitoring() {
    setInterval(() => {
      const now = performance.now();
      const duration = (now - this.stats.lastReset) / 1000; // in seconds

      console.log('Request Debouncer Stats:', {
        ...this.stats,
        requestsPerSecond: this.stats.totalRequests / duration,
        debounceRate: this.stats.totalRequests > 0 ?
          (this.stats.debouncedRequests / this.stats.totalRequests * 100).toFixed(2) + '%' : 'N/A',
        period: `${duration.toFixed(1)}s`
      });

      // Reset counters
      this.stats = {
        totalRequests: 0,
        debouncedRequests: 0,
        uniqueRequests: 0,
        avgDebounceTime: 0,
        lastReset: now
      };
    }, 300000); // 5 minutes
  }

  private areRequestsEqual(a: DebouncedRequest, b: DebouncedRequest): boolean {
    if (a.key !== b.key) return false;
    if (a.type !== b.type) return false;
    if (a.priority !== b.priority) return false;

    // Compare payloads
    return JSON.stringify(a.payload) === JSON.stringify(b.payload);
  }

  async debounceRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: DebounceOptions = {}
  ): Promise<T> {
    this.stats.totalRequests++;

    const {
      debounceTime = this.defaultDebounceTime,
      maxDebounceTime = this.maxDebounceTime,
      priority = RequestPriority.NORMAL,
      metadata = {}
    } = options;

    // Create a unique key for this request type
    const requestKey = `${key}:${JSON.stringify(metadata)}`;

    // Check if we have an existing request in progress
    const existingEntry = this.debounceMap.get(requestKey);

    if (existingEntry) {
      this.stats.debouncedRequests++;

      // Update the existing entry
      existingEntry.lastRequested = performance.now();
      existingEntry.requestCount++;
      existingEntry.priority = Math.max(existingEntry.priority, priority);

      // If we have a result already, return it
      if (existingEntry.result) {
        return existingEntry.result as T;
      }

      // If the request is still pending, return the promise
      if (existingEntry.promise) {
        return existingEntry.promise as Promise<T>;
      }
    }

    // Create new debounce entry
    const entry: DebounceEntry = {
      key: requestKey,
      type: key,
      requestCount: 1,
      firstRequested: performance.now(),
      lastRequested: performance.now(),
      debounceTime: Math.min(debounceTime, maxDebounceTime),
      priority,
      metadata,
      promise: null,
      result: null,
      completed: false,
      requestFn
    };

    // Create promise for this request
    entry.promise = new Promise<T>((resolve, reject) => {
      entry.resolve = resolve;
      entry.reject = reject;
    });

    this.debounceMap.set(requestKey, entry);

    // Emit the request to be processed
    this.requestSubject.next({
      key: requestKey,
      type: key,
      payload: metadata,
      priority,
      timestamp: performance.now()
    });

    // Clean up old entries periodically
    if (this.debounceMap.size > this.maxQueueSize) {
      this.cleanupOldEntries();
    }

    return entry.promise;
  }

  private async executeRequest(request: DebouncedRequest) {
    const entry = this.debounceMap.get(request.key);
    if (!entry || entry.completed) return;

    try {
      // Execute the request function
      const result = await entry.requestFn();

      // Resolve all waiting promises
      entry.result = result;
      entry.resolve!(result);
      entry.completed = true;

      this.stats.uniqueRequests++;

      // Clean up after a short delay
      setTimeout(() => {
        this.debounceMap.delete(request.key);
      }, 1000);
    } catch (error) {
      entry.reject!(error);
      this.debounceMap.delete(request.key);
    }
  }

  private handleRequestError(request: DebouncedRequest, error: any) {
    const entry = this.debounceMap.get(request.key);
    if (entry) {
      entry.reject!(error);
      this.debounceMap.delete(request.key);
    }
  }

  private cleanupOldEntries() {
    const now = performance.now();
    const entries = Array.from(this.debounceMap.entries());

    // Sort by last requested time (oldest first)
    entries.sort((a, b) => a[1].lastRequested - b[1].lastRequested);

    // Keep only the most recent entries
    const entriesToKeep = entries.slice(-this.maxQueueSize / 2);

    // Clear the map and re-add the entries to keep
    this.debounceMap.clear();
    entriesToKeep.forEach(([key, entry]) => {
      this.debounceMap.set(key, entry);
    });
  }

  getDebounceStatus(key: string): DebounceStatus {
    const entry = this.debounceMap.get(key);
    if (!entry) {
      return {
        status: DebounceState.NOT_FOUND,
        requestCount: 0,
        waitingTime: 0
      };
    }

    const now = performance.now();
    const waitingTime = now - entry.firstRequested;

    return {
      status: entry.completed ? DebounceState.COMPLETED :
               entry.promise ? DebounceState.PENDING : DebounceState.WAITING,
      requestCount: entry.requestCount,
      waitingTime,
      debounceTime: entry.debounceTime
    };
  }

  getActiveRequests(): DebounceStatus[] {
    const now = performance.now();
    return Array.from(this.debounceMap.entries()).map(([key, entry]) => {
      const waitingTime = now - entry.firstRequested;
      return {
        key,
        status: entry.completed ? DebounceState.COMPLETED :
                entry.promise ? DebounceState.PENDING : DebounceState.WAITING,
        requestCount: entry.requestCount,
        waitingTime,
        debounceTime: entry.debounceTime,
        priority: entry.priority
      };
    });
  }

  clearRequest(key: string): void {
    this.debounceMap.delete(key);
  }

  clearAll(): void {
    this.debounceMap.clear();
  }

  onRequestComplete(): Observable<RequestCompleteEvent> {
    return this.requestSubject.pipe(
      filter(request => {
        const entry = this.debounceMap.get(request.key);
        return entry && entry.completed;
      }),
      map(request => {
        const entry = this.debounceMap.get(request.key)!;
        return {
          key: request.key,
          type: request.type,
          result: entry.result,
          requestCount: entry.requestCount,
          processingTime: performance.now() - entry.firstRequested
        };
      })
    );
  }

  async debounceWithFallback<T>(
    primaryKey: string,
    fallbackKey: string,
    requestFn: () => Promise<T>,
    options: DebounceOptions = {}
  ): Promise<T> {
    try {
      return await this.debounceRequest(primaryKey, requestFn, options);
    } catch (error) {
      console.warn(`Primary request ${primaryKey} failed, falling back to ${fallbackKey}`);
      return this.debounceRequest(fallbackKey, requestFn, options);
    }
  }

  // Decorator for debouncing method calls
  static Debounce(key: string, options: DebounceOptions = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      const debouncer = new RequestDebouncerService();

      descriptor.value = async function (...args: any[]) {
        // Create a unique key that includes the arguments
        const argKey = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(':');

        const requestKey = `${key}:${propertyKey}:${argKey}`;

        // Create a request function that calls the original method
        const requestFn = () => originalMethod.apply(this, args);

        return debouncer.debounceRequest(requestKey, requestFn, options);
      };

      return descriptor;
    };
  }
}

interface DebouncedRequest {
  key: string;
  type: string;
  payload: any;
  priority: RequestPriority;
  timestamp: number;
}

interface DebounceEntry {
  key: string;
  type: string;
  requestCount: number;
  firstRequested: number;
  lastRequested: number;
  debounceTime: number;
  priority: RequestPriority;
  metadata: any;
  promise: Promise<any> | null;
  resolve: ((value: any) => void) | null;
  reject: ((reason?: any) => void) | null;
  result: any;
  completed: boolean;
  requestFn: () => Promise<any>;
}

interface DebounceOptions {
  debounceTime?: number;
  maxDebounceTime?: number;
  priority?: RequestPriority;
  metadata?: any;
}

interface DebounceStatus {
  key?: string;
  status: DebounceState;
  requestCount: number;
  waitingTime: number;
  debounceTime?: number;
  priority?: RequestPriority;
}

interface RequestCompleteEvent {
  key: string;
  type: string;
  result: any;
  requestCount: number;
  processingTime: number;
}

enum DebounceState {
  NOT_FOUND = 'not_found',
  WAITING = 'waiting',
  PENDING = 'pending',
  COMPLETED = 'completed'
}

enum RequestPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

// Helper function to group observables by key
function groupBy<T>(keySelector: (item: T) => string) {
  return (source: Observable<T>) =>
    new Observable<Observable<T>>(observer => {
      const groups = new Map<string, Subject<T>>();

      const subscription = source.subscribe({
        next: value => {
          const key = keySelector(value);
          if (!groups.has(key)) {
            const groupSubject = new Subject<T>();
            groups.set(key, groupSubject);
            observer.next(groupSubject.asObservable());
          }
          groups.get(key)!.next(value);
        },
        error: err => observer.error(err),
        complete: () => {
          groups.forEach(group => group.complete());
          observer.complete();
        }
      });

      return () => {
        subscription.unsubscribe();
        groups.forEach(group => group.complete());
      };
    });
}

// Helper function to take the last n items from an observable
function takeLast<T>(count: number) {
  return (source: Observable<T>) =>
    new Observable<T>(observer => {
      const buffer: T[] = [];

      const subscription = source.subscribe({
        next: value => {
          buffer.push(value);
          if (buffer.length > count) {
            buffer.shift();
          }
        },
        error: err => observer.error(err),
        complete: () => {
          buffer.forEach(item => observer.next(item));
          observer.complete();
        }
      });

      return () => subscription.unsubscribe();
    });
}
```

### Connection Pooling

```typescript
// database-connection-pool.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource, DataSourceOptions, QueryRunner } from 'typeorm';
import { performance } from 'perf_hooks';
import { Subject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Injectable()
export class DatabaseConnectionPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly dataSources: Map<string, DataSource> = new Map();
  private readonly defaultPoolName = 'default';
  private readonly maxPoolSize = 20;
  private readonly minPoolSize = 5;
  private readonly maxIdleTime = 30000; // 30 seconds
  private readonly connectionTimeout = 10000; // 10 seconds
  private readonly validationTimeout = 5000; // 5 seconds

  private poolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    connectionAttempts: 0,
    connectionFailures: 0,
    avgConnectionTime: 0,
    avgQueryTime: 0,
    lastReset: performance.now()
  };

  private connectionEvents = new Subject<ConnectionEvent>();
  private maintenanceInterval: NodeJS.Timeout;

  constructor() {
    this.setupStatsMonitoring();
  }

  async onModuleInit() {
    console.log('DatabaseConnectionPoolService initialized');
    await this.initializeDefaultPool();
    this.startMaintenance();
  }

  async onModuleDestroy() {
    console.log('Shutting down database connection pools');
    this.stopMaintenance();

    // Close all data sources
    const closePromises = Array.from(this.dataSources.values()).map(ds =>
      this.closeDataSource(ds)
    );

    await Promise.all(closePromises);
  }

  private async initializeDefaultPool() {
    try {
      const defaultOptions: DataSourceOptions = {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'reporting',
        synchronize: false,
        logging: process.env.DB_LOGGING === 'true',
        poolSize: this.maxPoolSize,
        extra: {
          connectionTimeoutMillis: this.connectionTimeout,
          idleTimeoutMillis: this.maxIdleTime,
          max: this.maxPoolSize,
          min: this.minPoolSize
        }
      };

      const defaultDataSource = new DataSource(defaultOptions);
      await defaultDataSource.initialize();
      this.dataSources.set(this.defaultPoolName, defaultDataSource);

      console.log('Default database connection pool initialized');
    } catch (error) {
      console.error('Failed to initialize default database connection pool:', error);
      throw error;
    }
  }

  private setupStatsMonitoring() {
    setInterval(() => {
      const now = performance.now();
      const duration = (now - this.poolStats.lastReset) / 1000; // in seconds

      console.log('Database Pool Stats:', {
        ...this.poolStats,
        connectionsPerSecond: this.poolStats.totalConnections / duration,
        connectionSuccessRate: this.poolStats.connectionAttempts > 0 ?
          (1 - this.poolStats.connectionFailures / this.poolStats.connectionAttempts) * 100 + '%' : 'N/A',
        utilization: this.poolStats.totalConnections > 0 ?
          (this.poolStats.activeConnections / this.poolStats.totalConnections * 100).toFixed(2) + '%' : '0%',
        period: `${duration.toFixed(1)}s`
      });

      // Reset counters
      this.poolStats = {
        totalConnections: this.poolStats.totalConnections,
        activeConnections: this.poolStats.activeConnections,
        idleConnections: this.poolStats.idleConnections,
        waitingRequests: 0,
        connectionAttempts: 0,
        connectionFailures: 0,
        avgConnectionTime: 0,
        avgQueryTime: 0,
        lastReset: now
      };
    }, 300000); // 5 minutes
  }

  private startMaintenance() {
    // Run maintenance every 30 seconds
    this.maintenanceInterval = setInterval(() => {
      this.performMaintenance();
    }, 30000);
  }

  private stopMaintenance() {
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }
  }

  private async performMaintenance() {
    try {
      // Check each data source
      for (const [name, dataSource] of this.dataSources) {
        if (!dataSource.isInitialized) continue;

        // Get pool statistics
        const pool = dataSource.driver.pool;
        if (pool) {
          // Check for idle connections that can be closed
          this.checkIdleConnections(pool);

          // Check for connections that need validation
          await this.validateConnections(pool);
        }
      }
    } catch (error) {
      console.error('Database pool maintenance error:', error);
    }
  }

  private checkIdleConnections(pool: any) {
    // Implementation depends on the specific database driver
    // This is a generic approach that would need adaptation

    // For pg-pool (PostgreSQL)
    if (pool._idleObjects && pool._idleObjects.length > this.minPoolSize) {
      const now = performance.now();
      const idleConnections = pool._idleObjects.filter((conn: any) => {
        return now - conn.lastReturned > this.maxIdleTime;
      });

      // Close excess idle connections
      if (idleConnections.length > 0) {
        console.log(`Closing ${idleConnections.length} idle connections`);
        idleConnections.forEach((conn: any) => {
          try {
            conn.obj.release();
          } catch (error) {
            console.error('Error closing idle connection:', error);
          }
        });
      }
    }
  }

  private async validateConnections(pool: any) {
    // Implementation depends on the specific database driver
    // This is a generic approach

    // For pg-pool
    if (pool._allObjects) {
      const connections = pool._allObjects.map((obj: any) => obj.obj);
      const now = performance.now();

      for (const conn of connections) {
        if (conn._validationTimeout && now > conn._validationTimeout) {
          try {
            // Simple query to validate connection
            await conn.query('SELECT 1');
            conn._validationTimeout = now + this.validationTimeout;
          } catch (error) {
            console.error('Connection validation failed:', error);
            // Remove invalid connection from pool
            try {
              conn.release();
            } catch (releaseError) {
              console.error('Error releasing invalid connection:', releaseError);
            }
          }
        }
      }
    }
  }

  async getConnection(poolName: string = this.defaultPoolName): Promise<QueryRunner> {
    const dataSource = this.dataSources.get(poolName);
    if (!dataSource) {
      throw new Error(`Database pool ${poolName} not found`);
    }

    if (!dataSource.isInitialized) {
      throw new Error(`Database pool ${poolName} is not initialized`);
    }

    try {
      this.poolStats.connectionAttempts++;
      const startTime = performance.now();

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      const connectionTime = performance.now() - startTime;
      this.poolStats.avgConnectionTime =
        (this.poolStats.avgConnectionTime * (this.poolStats.totalConnections - 1) + connectionTime) /
        this.poolStats.totalConnections;

      this.poolStats.totalConnections++;
      this.poolStats.activeConnections++;

      // Set up connection event tracking
      this.trackConnectionEvents(queryRunner);

      return queryRunner;
    } catch (error) {
      this.poolStats.connectionFailures++;
      console.error(`Failed to get connection from pool ${poolName}:`, error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  private trackConnectionEvents(queryRunner: QueryRunner) {
    const originalRelease = queryRunner.release;
    const originalQuery = queryRunner.query;
    const originalStartTransaction = queryRunner.startTransaction;
    const originalCommitTransaction = queryRunner.commitTransaction;
    const originalRollbackTransaction = queryRunner.rollbackTransaction;

    const connectionId = Math.random().toString(36).substr(2, 9);
    const startTime = performance.now();

    // Track query execution
    queryRunner.query = async (...args: any[]) => {
      const queryStart = performance.now();
      try {
        const result = await originalQuery.apply(queryRunner, args);
        const queryTime = performance.now() - queryStart;

        this.poolStats.avgQueryTime =
          (this.poolStats.avgQueryTime * (this.poolStats.activeConnections - 1) + queryTime) /
          this.poolStats.activeConnections;

        this.connectionEvents.next({
          type: ConnectionEventType.QUERY,
          connectionId,
          query: args[0],
          parameters: args[1],
          duration: queryTime,
          timestamp: performance.now()
        });

        return result;
      } catch (error) {
        this.connectionEvents.next({
          type: ConnectionEventType.QUERY_ERROR,
          connectionId,
          query: args[0],
          parameters: args[1],
          error: error.message,
          duration: performance.now() - queryStart,
          timestamp: performance.now()
        });
        throw error;
      }
    };

    // Track transaction start
    queryRunner.startTransaction = async (...args: any[]) => {
      const result = await originalStartTransaction.apply(queryRunner, args);
      this.connectionEvents.next({
        type: ConnectionEventType.TRANSACTION_START,
        connectionId,
        timestamp: performance.now()
      });
      return result;
    };

    // Track transaction commit
    queryRunner.commitTransaction = async (...args: any[]) => {
      const result = await originalCommitTransaction.apply(queryRunner, args);
      this.connectionEvents.next({
        type: ConnectionEventType.TRANSACTION_COMMIT,
        connectionId,
        timestamp: performance.now()
      });
      return result;
    };

    // Track transaction rollback
    queryRunner.rollbackTransaction = async (...args: any[]) => {
      const result = await originalRollbackTransaction.apply(queryRunner, args);
      this.connectionEvents.next({
        type: ConnectionEventType.TRANSACTION_ROLLBACK,
        connectionId,
        timestamp: performance.now()
      });
      return result;
    };

    // Override release to track connection lifecycle
    queryRunner.release = async (...args: any[]) => {
      const duration = performance.now() - startTime;
      this.poolStats.activeConnections--;
      this.poolStats.idleConnections++;

      this.connectionEvents.next({
        type: ConnectionEventType.RELEASE,
        connectionId,
        duration,
        timestamp: performance.now()
      });

      return originalRelease.apply(queryRunner, args);
    };
  }

  async executeQuery<T>(
    poolName: string,
    query: string,
    parameters?: any[],
    options: QueryOptions = {}
  ): Promise<T> {
    const { retries = 2, timeout = 30000 } = options;
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      const queryRunner = await this.getConnection(poolName);
      try {
        const startTime = performance.now();

        // Set up timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Query timeout after ${timeout}ms`));
          }, timeout);
        });

        // Execute query with timeout
        const result = await Promise.race([
          queryRunner.query(query, parameters),
          timeoutPromise
        ]) as T;

        const queryTime = performance.now() - startTime;
        this.connectionEvents.next({
          type: ConnectionEventType.QUERY,
          connectionId: queryRunner.connection.processID?.toString() || 'unknown',
          query,
          parameters,
          duration: queryTime,
          timestamp: performance.now()
        });

        await queryRunner.release();
        return result;
      } catch (error) {
        lastError = error;
        console.error(`Query attempt ${i + 1} failed:`, error);

        // On last attempt, don't release the connection (let it be closed)
        if (i < retries) {
          try {
            await queryRunner.release();
          } catch (releaseError) {
            console.error('Error releasing connection after failed query:', releaseError);
          }
        }
      }
    }

    throw lastError || new Error('Query execution failed');
  }

  async executeTransaction<T>(
    poolName: string,
    operation: (queryRunner: QueryRunner) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const { retries = 2, isolationLevel = 'READ COMMITTED' } = options;
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      const queryRunner = await this.getConnection(poolName);
      try {
        await queryRunner.startTransaction(isolationLevel);
        const startTime = performance.now();

        const result = await operation(queryRunner);

        await queryRunner.commitTransaction();
        const duration = performance.now() - startTime;

        this.connectionEvents.next({
          type: ConnectionEventType.TRANSACTION_SUCCESS,
          connectionId: queryRunner.connection.processID?.toString() || 'unknown',
          duration,
          timestamp: performance.now()
        });

        await queryRunner.release();
        return result;
      } catch (error) {
        lastError = error;
        console.error(`Transaction attempt ${i + 1} failed:`, error);

        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError);
        }

        // On last attempt, don't release the connection (let it be closed)
        if (i < retries) {
          try {
            await queryRunner.release();
          } catch (releaseError) {
            console.error('Error releasing connection after failed transaction:', releaseError);
          }
        }
      }
    }

    throw lastError || new Error('Transaction execution failed');
  }

  async addDataSource(name: string, options: DataSourceOptions): Promise<void> {
    if (this.dataSources.has(name)) {
      throw new Error(`Data source ${name} already exists`);
    }

    try {
      const dataSource = new DataSource({
        ...options,
        poolSize: this.maxPoolSize,
        extra: {
          ...options.extra,
          connectionTimeoutMillis: this.connectionTimeout,
          idleTimeoutMillis: this.maxIdleTime,
          max: this.maxPoolSize,
          min: this.minPoolSize
        }
      });

      await dataSource.initialize();
      this.dataSources.set(name, dataSource);
      console.log(`Added new data source: ${name}`);
    } catch (error) {
      console.error(`Failed to add data source ${name}:`, error);
      throw error;
    }
  }

  async removeDataSource(name: string): Promise<void> {
    const dataSource = this.dataSources.get(name);
    if (!dataSource) {
      throw new Error(`Data source ${name} not found`);
    }

    try {
      await this.closeDataSource(dataSource);
      this.dataSources.delete(name);
      console.log(`Removed data source: ${name}`);
    } catch (error) {
      console.error(`Failed to remove data source ${name}:`, error);
      throw error;
    }
  }

  private async closeDataSource(dataSource: DataSource): Promise<void> {
    if (dataSource.isInitialized) {
      try {
        await dataSource.destroy();
      } catch (error) {
        console.error('Error closing data source:', error);
        throw error;
      }
    }
  }

  getPoolStats(poolName: string = this.defaultPoolName): PoolStats {
    const dataSource = this.dataSources.get(poolName);
    if (!dataSource) {
      throw new Error(`Data source ${poolName} not found`);
    }

    const pool = dataSource.driver.pool;
    if (!pool) {
      return {
        poolName,
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingRequests: 0
      };
    }

    // Get pool statistics (implementation depends on driver)
    return {
      poolName,
      totalConnections: this.getPoolTotalConnections(pool),
      activeConnections: this.getPoolActiveConnections(pool),
      idleConnections: this.getPoolIdleConnections(pool),
      waitingRequests: this.getPoolWaitingRequests(pool)
    };
  }

  private getPoolTotalConnections(pool: any): number {
    // Implementation depends on the database driver
    if (pool._allObjects) {
      return pool._allObjects.length;
    }
    return 0;
  }

  private getPoolActiveConnections(pool: any): number {
    // Implementation depends on the database driver
    if (pool._inUseObjects) {
      return pool._inUseObjects.length;
    }
    return 0;
  }

  private getPoolIdleConnections(pool: any): number {
    // Implementation depends on the database driver
    if (pool._idleObjects) {
      return pool._idleObjects.length;
    }
    return 0;
  }

  private getPoolWaitingRequests(pool: any): number {
    // Implementation depends on the database driver
    if (pool._waitingClients) {
      return pool._waitingClients.length;
    }
    return 0;
  }

  getConnectionEvents(): Observable<ConnectionEvent> {
    return this.connectionEvents.asObservable();
  }

  async withConnection<T>(
    poolName: string,
    operation: (queryRunner: QueryRunner) => Promise<T>
  ): Promise<T> {
    const queryRunner = await this.getConnection(poolName);
    try {
      return await operation(queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  async withTransaction<T>(
    poolName: string,
    operation: (queryRunner: QueryRunner) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    return this.executeTransaction(poolName, operation, options);
  }

  // Decorator for automatic connection management
  static WithConnection(poolName: string = 'default') {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const poolService = this.databaseConnectionPoolService ||
          new DatabaseConnectionPoolService();

        return poolService.withConnection(poolName, async (queryRunner) => {
          return originalMethod.apply(this, [queryRunner, ...args]);
        });
      };

      return descriptor;
    };
  }

  // Decorator for automatic transaction management
  static WithTransaction(poolName: string = 'default', options: TransactionOptions = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const poolService = this.databaseConnectionPoolService ||
          new DatabaseConnectionPoolService();

        return poolService.withTransaction(poolName, async (queryRunner) => {
          return originalMethod.apply(this, [queryRunner, ...args]);
        }, options);
      };

      return descriptor;
    };
  }
}

interface QueryOptions {
  retries?: number;
  timeout?: number;
}

interface TransactionOptions {
  retries?: number;
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
}

interface PoolStats {
  poolName: string;
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
}

interface ConnectionEvent {
  type: ConnectionEventType;
  connectionId: string;
  query?: string;
  parameters?: any[];
  duration?: number;
  error?: string;
  timestamp: number;
}

enum ConnectionEventType {
  QUERY = 'query',
  QUERY_ERROR = 'query_error',
  TRANSACTION_START = 'transaction_start',
  TRANSACTION_COMMIT = 'transaction_commit',
  TRANSACTION_ROLLBACK = 'transaction_rollback',
  TRANSACTION_SUCCESS = 'transaction_success',
  RELEASE = 'release'
}
```

---

## Real-Time Features

### WebSocket Server Setup

```typescript
// websocket-gateway.service.ts
import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { performance } from 'perf_hooks';
import { Subject, Observable } from 'rxjs';
import { debounceTime, throttleTime } from 'rxjs/operators';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e6 // 1MB
})
@Injectable()
export class WebsocketGatewayService implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGatewayService.name);
  private readonly connectionStats: Map<string, ConnectionStats> = new Map();
  private readonly messageStats: MessageStats = {
    totalMessages: 0,
    totalBytes: 0,
    messageTypes: new Map(),
    lastReset: performance.now()
  };
  private readonly eventSubject = new Subject<WebsocketEvent>();
  private readonly maxConnections = 10000;
  private readonly rateLimits: Map<string, RateLimitEntry> = new Map();
  private readonly rateLimitWindow = 60000; // 1 minute
  private readonly rateLimitMax = 100; // messages per window

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    this.setupStatsMonitoring();
    this.setupEventProcessing();
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.server = server;

    // Set up server-level middleware
    this.server.use(async (socket: Socket, next) => {
      try {
        await this.handleConnectionMiddleware(socket);
        next();
      } catch (error) {
        next(error);
      }
    });

    // Set up connection tracking
    this.server.on('connection', (socket) => {
      this.trackConnection(socket);
    });
  }

  private async handleConnectionMiddleware(socket: Socket) {
    // Authentication middleware
    const token = this.extractToken(socket);
    if (!token) {
      throw new Error('Authentication token required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET')
      });

      // Attach user to socket
      socket.data.user = {
        id: payload.sub,
        username: payload.username,
        roles: payload.roles || [],
        department: payload.department
      };

      // Rate limiting
      this.setupRateLimiting(socket);
    } catch (error) {
      this.logger.warn(`Authentication failed: ${error.message}`);
      throw new Error('Invalid authentication token');
    }
  }

  private extractToken(socket: Socket): string | null {
    // Check query parameters
    if (socket.handshake.query.token) {
      return socket.handshake.query.token as string;
    }

    // Check headers
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private setupRateLimiting(socket: Socket) {
    const userId = socket.data.user.id;
    const key = `user:${userId}`;

    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, {
        count: 0,
        lastReset: performance.now()
      });
    }

    // Reset count if window has passed
    const entry = this.rateLimits.get(key)!;
    if (performance.now() - entry.lastReset > this.rateLimitWindow) {
      entry.count = 0;
      entry.lastReset = performance.now();
    }

    // Set up message handler with rate limiting
    const originalEmit = socket.emit;
    socket.emit = (event: string, ...args: any[]) => {
      entry.count++;

      if (entry.count > this.rateLimitMax) {
        this.logger.warn(`Rate limit exceeded for user ${userId}`);
        socket.disconnect(true);
        return false;
      }

      return originalEmit.call(socket, event, ...args);
    };
  }

  private trackConnection(socket: Socket) {
    const connectionId = socket.id;
    const userId = socket.data.user?.id || 'anonymous';

    // Initialize connection stats
    this.connectionStats.set(connectionId, {
      userId,
      connectedAt: performance.now(),
      lastActivity: performance.now(),
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      rooms: new Set()
    });

    // Track socket events
    this.trackSocketEvents(socket);

    this.logger.log(`Client connected: ${connectionId} (User: ${userId})`);
    this.eventSubject.next({
      type: 'connection',
      connectionId,
      userId,
      timestamp: performance.now()
    });
  }

  private trackSocketEvents(socket: Socket) {
    // Track message sending
    const originalEmit = socket.emit;
    socket.emit = (event: string, ...args: any[]) => {
      const stats = this.connectionStats.get(socket.id);
      if (stats) {
        stats.messagesSent++;
        stats.lastActivity = performance.now();

        // Calculate message size
        const messageSize = this.calculateMessageSize(args);
        stats.bytesSent += messageSize;

        // Update global stats
        this.messageStats.totalMessages++;
        this.messageStats.totalBytes += messageSize;

        if (!this.messageStats.messageTypes.has(event)) {
          this.messageStats.messageTypes.set(event, 0);
        }
        this.messageStats.messageTypes.set(event, this.messageStats.messageTypes.get(event)! + 1);
      }

      return originalEmit.call(socket, event, ...args);
    };

    // Track message receiving
    socket.onAny((event, ...args) => {
      const stats = this.connectionStats.get(socket.id);
      if (stats) {
        stats.messagesReceived++;
        stats.lastActivity = performance.now();

        // Calculate message size
        const messageSize = this.calculateMessageSize(args);
        stats.bytesReceived += messageSize;
      }
    });

    // Track room joins
    const originalJoin = socket.join;
    socket.join = (room: string | string[]) => {
      const stats = this.connectionStats.get(socket.id);
      if (stats) {
        const rooms = Array.isArray(room) ? room : [room];
        rooms.forEach(r => stats.rooms.add(r));
      }
      return originalJoin.call(socket, room);
    };

    // Track room leaves
    const originalLeave = socket.leave;
    socket.leave = (room: string) => {
      const stats = this.connectionStats.get(socket.id);
      if (stats) {
        stats.rooms.delete(room);
      }
      return originalLeave.call(socket, room);
    };
  }

  private calculateMessageSize(args: any[]): number {
    try {
      const message = args.length === 1 ? args[0] : args;
      const str = JSON.stringify(message);
      return Buffer.byteLength(str, 'utf8');
    } catch (error) {
      return 0;
    }
  }

  handleConnection(socket: Socket) {
    // Handled in the middleware
  }

  handleDisconnect(socket: Socket) {
    const connectionId = socket.id;
    const stats = this.connectionStats.get(connectionId);

    if (stats) {
      const duration = performance.now() - stats.connectedAt;
      this.logger.log(`Client disconnected: ${connectionId} (User: ${stats.userId}) ` +
        `after ${(duration / 1000).toFixed(1)}s, ` +
        `sent ${stats.messagesSent} messages (${this.formatBytes(stats.bytesSent)}), ` +
        `received ${stats.messagesReceived} messages (${this.formatBytes(stats.bytesReceived)})`);

      this.eventSubject.next({
        type: 'disconnection',
        connectionId,
        userId: stats.userId,
        duration,
        messagesSent: stats.messagesSent,
        messagesReceived: stats.messagesReceived,
        timestamp: performance.now()
      });

      this.connectionStats.delete(connectionId);
    }
  }

  private setupStatsMonitoring() {
    setInterval(() => {
      const now = performance.now();
      const duration = (now - this.messageStats.lastReset) / 1000; // in seconds

      this.logger.log('WebSocket Stats:', {
        connections: this.connectionStats.size,
        messagesPerSecond: this.messageStats.totalMessages / duration,
        bytesPerSecond: this.messageStats.totalBytes / duration,
        messageTypes: Object.fromEntries(this.messageStats.messageTypes),
        period: `${duration.toFixed(1)}s`
      });

      // Reset message stats
      this.messageStats.totalMessages = 0;
      this.messageStats.totalBytes = 0;
      this.messageStats.messageTypes.clear();
      this.messageStats.lastReset = now;

      // Log connection stats
      if (this.connectionStats.size > 0) {
        const activeConnections = Array.from(this.connectionStats.values());
        const avgDuration = activeConnections.reduce(
          (sum, conn) => sum + (now - conn.connectedAt), 0
        ) / activeConnections.length;

        const avgMessagesSent = activeConnections.reduce(
          (sum, conn) => sum + conn.messagesSent, 0
        ) / activeConnections.length;

        const avgMessagesReceived = activeConnections.reduce(
          (sum, conn) => sum + conn.messagesReceived, 0
        ) / activeConnections.length;

        this.logger.log('Connection Stats:', {
          totalConnections: this.connectionStats.size,
          avgConnectionDuration: `${(avgDuration / 1000).toFixed(1)}s`,
          avgMessagesSent,
          avgMessagesReceived,
          activeRooms: this.getActiveRooms().size
        });
      }
    }, 300000); // 5 minutes
  }

  private setupEventProcessing() {
    // Debounce connection events
    this.eventSubject.pipe(
      debounceTime(1000)
    ).subscribe(event => {
      if (event.type === 'connection') {
        this.handleConnectionEvent(event);
      }
    });

    // Throttle disconnection events
    this.eventSubject.pipe(
      throttleTime(1000)
    ).subscribe(event => {
      if (event.type === 'disconnection') {
        this.handleDisconnectionEvent(event);
      }
    });
  }

  private handleConnectionEvent(event: WebsocketEvent) {
    // Broadcast to monitoring system
    this.broadcastToMonitoring({
      event: 'websocket_connection',
      userId: event.userId,
      connectionId: event.connectionId,
      timestamp: new Date(event.timestamp).toISOString()
    });
  }

  private handleDisconnectionEvent(event: WebsocketEvent) {
    // Broadcast to monitoring system
    this.broadcastToMonitoring({
      event: 'websocket_disconnection',
      userId: event.userId,
      connectionId: event.connectionId,
      duration: event.duration,
      messagesSent: event.messagesSent,
      messagesReceived: event.messagesReceived,
      timestamp: new Date(event.timestamp).toISOString()
    });
  }

  private broadcastToMonitoring(data: any) {
    // In production, this would send to a monitoring service
    // This is a placeholder for the actual implementation
    this.logger.debug('Monitoring event:', data);
  }

  getConnectionStats(connectionId: string): ConnectionStats | null {
    return this.connectionStats.get(connectionId) || null;
  }

  getAllConnectionStats(): ConnectionStats[] {
    return Array.from(this.connectionStats.values());
  }

  getMessageStats(): MessageStats {
    return {
      ...this.messageStats,
      messageTypes: new Map(this.messageStats.messageTypes)
    };
  }

  getActiveRooms(): Set<string> {
    const rooms = new Set<string>();
    this.connectionStats.forEach(stats => {
      stats.rooms.forEach(room => rooms.add(room));
    });
    return rooms;
  }

  getConnectionsInRoom(room: string): string[] {
    const connections: string[] = [];
    this.connectionStats.forEach((stats, connectionId) => {
      if (stats.rooms.has(room)) {
        connections.push(connectionId);
      }
    });
    return connections;
  }

  getUserConnections(userId: string): string[] {
    const connections: string[] = [];
    this.connectionStats.forEach((stats, connectionId) => {
      if (stats.userId === userId) {
        connections.push(connectionId);
      }
    });
    return connections;
  }

  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
    this.logger.debug(`Broadcast to room ${room}: ${event}`);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    const connections = this.getUserConnections(userId);
    connections.forEach(connectionId => {
      this.server.to(connectionId).emit(event, data);
    });
    this.logger.debug(`Broadcast to user ${userId}: ${event}`);
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast to all: ${event}`);
  }

  async sendToConnection(connectionId: string, event: string, data: any): Promise<boolean> {
    const socket = this.server.sockets.sockets.get(connectionId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  onEvent(): Observable<WebsocketEvent> {
    return this.eventSubject.asObservable();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Health check endpoint
  async getHealthStatus(): Promise<WebsocketHealthStatus> {
    const now = performance.now();
    const activeConnections = this.getAllConnectionStats();

    return {
      status: 'healthy',
      connections: {
        total: this.connectionStats.size,
        active: activeConnections.length,
        max: this.maxConnections,
        utilization: this.connectionStats.size / this.maxConnections
      },
      messages: {
        total: this.messageStats.totalMessages,
        rate: this.messageStats.totalMessages / ((now - this.messageStats.lastReset) / 1000)
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  // Graceful shutdown
  async shutdown() {
    this.logger.log('Initiating WebSocket gateway shutdown');

    // Disconnect all clients with a message
    this.broadcastToAll('server_shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });

    // Give clients time to disconnect gracefully
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Force disconnect all remaining clients
    this.server.disconnectSockets(true);

    this.logger.log('WebSocket gateway shutdown complete');
  }
}

interface ConnectionStats {
  userId: string;
  connectedAt: number;
  lastActivity: number;
  messagesSent: number;
  messagesReceived: number;
  bytesSent: number;
  bytesReceived: number;
  rooms: Set<string>;
}

interface MessageStats {
  totalMessages: number;
  totalBytes: number;
  messageTypes: Map<string, number>;
  lastReset: number;
}

interface RateLimitEntry {
  count: number;
  lastReset: number;
}

interface WebsocketEvent {
  type: 'connection' | 'disconnection' | 'message';
  connectionId: string;
  userId: string;
  duration?: number;
  messagesSent?: number;
  messagesReceived?: number;
  timestamp: number;
}

interface WebsocketHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connections: {
    total: number;
    active: number;
    max: number;
    utilization: number;
  };
  messages: {
    total: number;
    rate: number;
  };
  uptime: number;
  timestamp: string;
}
```

### Real-Time Event Handlers

```typescript
// realtime-event-handler.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WebsocketGatewayService } from './websocket-gateway.service';
import { ReportService } from '../report/report.service';
import { NotificationService } from '../notification/notification.service';
import { DataChangeService } from '../data-change/data-change.service';
import { UserService } from '../user/user.service';
import { Subject, Observable } from 'rxjs';
import { filter, debounceTime, throttleTime } from 'rxjs/operators';
import { performance } from 'perf_hooks';

@Injectable()
export class RealtimeEventHandlerService implements OnModuleInit {
  private readonly logger = new Logger(RealtimeEventHandlerService.name);
  private readonly eventSubject = new Subject<RealtimeEvent>();
  private readonly eventHandlers: Map<string, EventHandler[]> = new Map();
  private readonly eventStats: Map<string, EventStats> = new Map();
  private readonly maxEventQueueSize = 1000;
  private readonly processingQueue: RealtimeEvent[] = [];

  constructor(
    private websocketGateway: WebsocketGatewayService,
    private reportService: ReportService,
    private notificationService: NotificationService,
    private dataChangeService: DataChangeService,
    private userService: UserService
  ) {
    this.setupDefaultHandlers();
    this.setupStatsMonitoring();
  }

  onModuleInit() {
    this.logger.log('RealtimeEventHandlerService initialized');
    this.setupEventProcessing();
  }

  private setupDefaultHandlers() {
    // Report events
    this.registerHandler('report_generated', this.handleReportGenerated.bind(this));
    this.registerHandler('report_failed', this.handleReportFailed.bind(this));
    this.registerHandler('report_updated', this.handleReportUpdated.bind(this));
    this.registerHandler('report_deleted', this.handleReportDeleted.bind(this));

    // Data change events
    this.registerHandler('data_changed', this.handleDataChanged.bind(this));
    this.registerHandler('data_processing_started', this.handleDataProcessingStarted.bind(this));
    this.registerHandler('data_processing_completed', this.handleDataProcessingCompleted.bind(this));

    // Notification events
    this.registerHandler('notification_sent', this.handleNotificationSent.bind(this));
    this.registerHandler('notification_failed', this.handleNotificationFailed.bind(this));

    // User events
    this.registerHandler('user_online', this.handleUserOnline.bind(this));
    this.registerHandler('user_offline', this.handleUserOffline.bind(this));
    this.registerHandler('user_activity', this.handleUserActivity.bind(this));

    // System events
    this.registerHandler('system_alert', this.handleSystemAlert.bind(this));
    this.registerHandler('maintenance_scheduled', this.handleMaintenanceScheduled.bind(this));
  }

  private setupEventProcessing() {
    // Process events with backpressure handling
    this.eventSubject.pipe(
      // Batch events of the same type
      groupBy(event => event.type),
      mergeMap(group$ => group$.pipe(
        // Throttle high-frequency events
        throttleTime(100, undefined, { leading: true, trailing: true }),
        // Process with concurrency limit
        mergeMap(event => this.processEvent(event), 5)
      ))
    ).subscribe({
      next: () => {},
      error: (err) => this.logger.error('Event processing error:', err)
    });

    // Log queue size
    setInterval(() => {
      if (this.processingQueue.length > this.maxEventQueueSize * 0.8) {
        this.logger.warn(`Event queue size high: ${this.processingQueue.length}/${this.maxEventQueueSize}`);
      }
    }, 10000);
  }

  private async processEvent(event: RealtimeEvent): Promise<void> {
    try {
      // Update stats
      this.updateEventStats(event);

      // Find handlers for this event type
      const handlers = this.eventHandlers.get(event.type) || [];

      // Execute all handlers
      const handlerPromises = handlers.map(handler =>
        this.executeHandler(handler, event)
      );

      await Promise.all(handlerPromises);

      // Broadcast to WebSocket clients if needed
      if (event.broadcast) {
        this.broadcastEvent(event);
      }
    } catch (error) {
      this.logger.error(`Error processing event ${event.type}:`, error);
      this.handleProcessingError(event, error);
    }
  }

  private async executeHandler(handler: EventHandler, event: RealtimeEvent): Promise<void> {
    try {
      const startTime = performance.now();
      await handler(event);
      const duration = performance.now() - startTime;

      if (duration > 100) { // Log slow handlers
        this.logger.warn(`Slow event handler for ${event.type}: ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      this.logger.error(`Error in handler for event ${event.type}:`, error);
      throw error; // Re-throw to be caught by processEvent
    }
  }

  private updateEventStats(event: RealtimeEvent) {
    if (!this.eventStats.has(event.type)) {
      this.eventStats.set(event.type, {
        count: 0,
        lastProcessed: 0,
        avgProcessingTime: 0,
        errorCount: 0
      });
    }

    const stats = this.eventStats.get(event.type)!;
    stats.count++;
    stats.lastProcessed = performance.now();
  }

  private setupStatsMonitoring() {
    setInterval(() => {
      const stats = Array.from(this.eventStats.entries()).map(([type, stat]) => ({
        type,
        count: stat.count,
        avgProcessingTime: stat.avgProcessingTime,
        errorRate: stat.count > 0 ? stat.errorCount / stat.count : 0,
        lastProcessed: new Date(stat.lastProcessed).toISOString()
      }));

      this.logger.log('Event Handler Stats:', {
        totalEvents: stats.reduce((sum, s) => sum + s.count, 0),
        eventTypes: stats.length,
        queueSize: this.processingQueue.length,
        stats
      });

      // Reset counters
      this.eventStats.forEach(stat => {
        stat.count = 0;
        stat.errorCount = 0;
      });
    }, 300000); // 5 minutes
  }

  registerHandler(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
    this.logger.log(`Registered handler for event type: ${eventType}`);
  }

  unregisterHandler(eventType: string, handler: EventHandler): void {
    if (this.eventHandlers.has(eventType)) {
      const handlers = this.eventHandlers.get(eventType)!;
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        this.logger.log(`Unregistered handler for event type: ${eventType}`);
      }
    }
  }

  emitEvent(event: RealtimeEvent): void {
    // Check if we're exceeding queue size
    if (this.processingQueue.length >= this.maxEventQueueSize) {
      this.logger.warn('Event queue full, dropping event:', event.type);
      return;
    }

    // Add to processing queue
    this.processingQueue.push(event);

    // Emit to subject for processing
    this.eventSubject.next(event);
  }

  onEvent(): Observable<RealtimeEvent> {
    return this.eventSubject.asObservable();
  }

  onEventType(eventType: string): Observable<RealtimeEvent> {
    return this.eventSubject.pipe(
      filter(event => event.type === eventType)
    );
  }

  private broadcastEvent(event: RealtimeEvent) {
    try {
      if (event.broadcast === 'all') {
        this.websocketGateway.broadcastToAll(event.type, event.payload);
      } else if (event.broadcast === 'room' && event.room) {
        this.websocketGateway.broadcastToRoom(event.room, event.type, event.payload);
      } else if (event.broadcast === 'user' && event.userId) {
        this.websocketGateway.broadcastToUser(event.userId, event.type, event.payload);
      }
    } catch (error) {
      this.logger.error('Error broadcasting event:', error);
    }
  }

  private handleProcessingError(event: RealtimeEvent, error: Error) {
    // Update error stats
    if (this.eventStats.has(event.type)) {
      const stats = this.eventStats.get(event.type)!;
      stats.errorCount++;
    }

    // Log to error tracking system
    this.reportError(event, error);

    // If this is a critical event, try to handle the error
    if (event.priority === EventPriority.CRITICAL) {
      this.handleCriticalEventError(event, error);
    }
  }

  private reportError(event: RealtimeEvent, error: Error) {
    // In production, this would send to an error tracking system
    this.logger.error('Event processing failed:', {
      eventType: event.type,
      eventId: event.id,
      error: error.message,
      stack: error.stack,
      payload: event.payload
    });
  }

  private handleCriticalEventError(event: RealtimeEvent, error: Error) {
    try {
      // Try to send a notification about the failure
      this.notificationService.sendSystemAlert({
        title: `Critical Event Processing Failed: ${event.type}`,
        message: `Failed to process critical event: ${error.message}`,
        severity: 'critical',
        metadata: {
          eventId: event.id,
          eventType: event.type,
          timestamp: new Date().toISOString()
        }
      });

      // For report events, try to generate a fallback report
      if (event.type.startsWith('report_')) {
        this.handleReportEventError(event, error);
      }
    } catch (notificationError) {
      this.logger.error('Failed to handle critical event error:', notificationError);
    }
  }

  private async handleReportEventError(event: RealtimeEvent, error: Error) {
    try {
      if (event.type === 'report_failed' && event.payload.reportId) {
        // Already a failure event, nothing to do
        return;
      }

      // Try to generate a simple version of the report
      const reportId = event.payload.reportId || event.payload.id;
      if (reportId) {
        const simpleReport = await this.reportService.generateSimpleReport(reportId);
        this.emitEvent({
          id: `fallback-${event.id}`,
          type: 'report_generated',
          payload: {
            ...event.payload,
            report: simpleReport,
            isFallback: true,
            originalError: error.message
          },
          timestamp: new Date().toISOString(),
          priority: EventPriority.HIGH,
          broadcast: event.broadcast,
          room: event.room,
          userId: event.userId
        });
      }
    } catch (fallbackError) {
      this.logger.error('Fallback report generation failed:', fallbackError);
    }
  }

  // Event Handlers

  private async handleReportGenerated(event: RealtimeEvent) {
    const { reportId, userId, report } = event.payload;

    // Update report status
    await this.reportService.updateReportStatus(reportId, 'completed');

    // Notify the user
    await this.notificationService.sendReportNotification({
      userId,
      reportId,
      title: `Report "${report.name}" is ready`,
      message: `Your report has been generated successfully.`,
      reportName: report.name,
      reportUrl: report.url,
      status: 'completed'
    });

    // Log the event
    this.logger.log(`Report generated: ${reportId} for user ${userId}`);
  }

  private async handleReportFailed(event: RealtimeEvent) {
    const { reportId, userId, error } = event.payload;

    // Update report status
    await this.reportService.updateReportStatus(reportId, 'failed');

    // Notify the user
    await this.notificationService.sendReportNotification({
      userId,
      reportId,
      title: `Report generation failed`,
      message: `Failed to generate your report: ${error}`,
      status: 'failed'
    });

    // Log the error
    this.logger.error(`Report generation failed: ${reportId} for user ${userId}`, error);
  }

  private async handleReportUpdated(event: RealtimeEvent) {
    const { reportId, userId, changes } = event.payload;

    // Notify users who have access to this report
    const users = await this.reportService.getReportUsers(reportId);
    for (const user of users) {
      await this.notificationService.sendReportNotification({
        userId: user.id,
        reportId,
        title: `Report updated: ${event.payload.reportName}`,
        message: `The report has been updated with new data.`,
        changes,
        reportUrl: event.payload.reportUrl
      });
    }

    // Log the update
    this.logger.log(`Report updated: ${reportId}`);
  }

  private async handleReportDeleted(event: RealtimeEvent) {
    const { reportId, userId } = event.payload;

    // Notify users who had access to this report
    const users = await this.reportService.getReportUsers(reportId);
    for (const user of users) {
      await this.notificationService.sendReportNotification({
        userId: user.id,
        reportId,
        title: `Report deleted`,
        message: `The report "${event.payload.reportName}" has been deleted.`,
        status: 'deleted'
      });
    }

    // Log the deletion
    this.logger.log(`Report deleted: ${reportId}`);
  }

  private async handleDataChanged(event: RealtimeEvent) {
    const { table, recordId, changes, timestamp } = event.payload;

    // Broadcast to subscribers of this data
    this.websocketGateway.broadcastToRoom(`data:${table}:${recordId}`, 'data_changed', {
      table,
      recordId,
      changes,
      timestamp
    });

    // For reports that depend on this data, trigger updates
    const affectedReports = await this.reportService.getReportsAffectedByDataChange(table, recordId);
    for (const report of affectedReports) {
      this.emitEvent({
        id: `data-change-trigger-${report.id}`,
        type: 'report_needs_update',
        payload: {
          reportId: report.id,
          reason: `Data changed in ${table} (ID: ${recordId})`,
          changes
        },
        timestamp: new Date().toISOString(),
        priority: EventPriority.HIGH
      });
    }

    // Log the data change
    this.logger.debug(`Data changed in ${table} (ID: ${recordId})`);
  }

  private async handleDataProcessingStarted(event: RealtimeEvent) {
    const { processId, processName, userId, recordsCount } = event.payload;

    // Update process status
    await this.dataChangeService.updateProcessStatus(processId, 'running');

    // Notify the user
    if (userId) {
      await this.notificationService.sendDataProcessingNotification({
        userId,
        processId,
        title: `Data processing started: ${processName}`,
        message: `Processing ${recordsCount} records...`,
        status: 'running'
      });
    }

    // Log the start
    this.logger.log(`Data processing started: ${processName} (ID: ${processId})`);
  }

  private async handleDataProcessingCompleted(event: RealtimeEvent) {
    const { processId, processName, userId, recordsProcessed, duration } = event.payload;

    // Update process status
    await this.dataChangeService.updateProcessStatus(processId, 'completed');

    // Notify the user
    if (userId) {
      await this.notificationService.sendDataProcessingNotification({
        userId,
        processId,
        title: `Data processing completed: ${processName}`,
        message: `Successfully processed ${recordsProcessed} records in ${duration}ms.`,
        status: 'completed',
        recordsProcessed,
        duration
      });
    }

    // Log the completion
    this.logger.log(`Data processing completed: ${processName} (ID: ${processId})`);
  }

  private async handleNotificationSent(event: RealtimeEvent) {
    const { notificationId, userId, type, status } = event.payload;

    // Update notification status
    await this.notificationService.updateNotificationStatus(notificationId, status);

    // Log the notification
    this.logger.debug(`Notification sent: ${notificationId} to user ${userId} (Type: ${type})`);
  }

  private async handleNotificationFailed(event: RealtimeEvent) {
    const { notificationId, userId, type, error } = event.payload;

    // Update notification status
    await this.notificationService.updateNotificationStatus(notificationId, 'failed');

    // Log the error
    this.logger.error(`Notification failed: ${notificationId} to user ${userId} (Type: ${type})`, error);
  }

  private async handleUserOnline(event: RealtimeEvent) {
    const { userId, connectionId } = event.payload;

    // Update user status
    await this.userService.updateUserStatus(userId, 'online');

    // Notify friends/colleagues if needed
    const colleagues = await this.userService.getUserColleagues(userId);
    for (const colleague of colleagues) {
      this.websocketGateway.broadcastToUser(colleague.id, 'colleague_online', {
        userId,
        name: event.payload.name,
        timestamp: new Date().toISOString()
      });
    }

    // Log the event
    this.logger.log(`User online: ${userId} (Connection: ${connectionId})`);
  }

  private async handleUserOffline(event: RealtimeEvent) {
    const { userId, connectionId, duration } = event.payload;

    // Update user status
    await this.userService.updateUserStatus(userId, 'offline');

    // Notify friends/colleagues if needed
    const colleagues = await this.userService.getUserColleagues(userId);
    for (const colleague of colleagues) {
      this.websocketGateway.broadcastToUser(colleague.id, 'colleague_offline', {
        userId,
        name: event.payload.name,
        duration,
        timestamp: new Date().toISOString()
      });
    }

    // Log the event
    this.logger.log(`User offline: ${userId} (Connection: ${connectionId}) after ${duration}ms`);
  }

  private async handleUserActivity(event: RealtimeEvent) {
    const { userId, activityType, metadata } = event.payload;

    // Update last activity time
    await this.userService.updateUserLastActivity(userId);

    // For certain activities, notify relevant parties
    if (activityType === 'report_view') {
      const reportId = metadata.reportId;
      const report = await this.reportService.getReport(reportId);
      if (report.ownerId !== userId) {
        this.websocketGateway.broadcastToUser(report.ownerId, 'report_viewed', {
          userId,
          userName: event.payload.userName,
          reportId,
          reportName: report.name,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Log the activity
    this.logger.debug(`User activity: ${userId} - ${activityType}`);
  }

  private async handleSystemAlert(event: RealtimeEvent) {
    const { alertId, severity, message, metadata } = event.payload;

    // Broadcast to all admins
    const admins = await this.userService.getUsersWithRole('admin');
    for (const admin of admins) {
      this.websocketGateway.broadcastToUser(admin.id, 'system_alert', {
        alertId,
        severity,
        message,
        metadata,
        timestamp: new Date().toISOString()
      });
    }

    // Log the alert
    this.logger.warn(`System alert (${severity}): ${message}`);
  }

  private async handleMaintenanceScheduled(event: RealtimeEvent) {
    const { maintenanceId, startTime, endTime, description, impact } = event.payload;

    // Notify all users
    this.websocketGateway.broadcastToAll('maintenance_scheduled', {
      maintenanceId,
      startTime,
      endTime,
      description,
      impact,
      timestamp: new Date().toISOString()
    });

    // Log the maintenance
    this.logger.log(`Maintenance scheduled: ${description} (${startTime} to ${endTime})`);
  }

  // Helper methods

  createEvent<T extends object>(
    type: string,
    payload: T,
    options: Partial<RealtimeEvent> = {}
  ): RealtimeEvent {
    return {
      id: this.generateEventId(),
      type,
      payload,
      timestamp: new Date().toISOString(),
      priority: EventPriority.NORMAL,
      broadcast: false,
      ...options
    };
  }

  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async processEventWithRetry(event: RealtimeEvent, maxRetries = 3): Promise<void> {
    let lastError: Error | null = null;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        await this.processEvent(event);
        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(`Event processing attempt ${i + 1} failed for ${event.type}:`, error);

        // Exponential backoff
        if (i < maxRetries) {
          const delay = Math.pow(2,