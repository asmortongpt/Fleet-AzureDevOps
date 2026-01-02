# **TO_BE_DESIGN.md**
**Asset Depreciation Module - Next-Generation Financial Management System**

**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Author:** Financial Systems Architecture Team
**Approvers:** CFO, CTO, Head of Product

---

## **Table of Contents**
1. [Executive Vision](#executive-vision-100-lines-minimum)
2. [Performance Enhancements](#performance-enhancements-250-lines-minimum)
3. [Real-Time Features](#real-time-features-300-lines-minimum)
4. [AI/ML Capabilities](#aiml-capabilities-250-lines-minimum)
5. [Progressive Web App (PWA) Features](#progressive-web-app-pwa-features-200-lines-minimum)
6. [WCAG 2.1 AAA Accessibility](#wcag-21-aaa-accessibility-200-lines-minimum)
7. [Advanced Search and Filtering](#advanced-search-and-filtering-180-lines-minimum)
8. [Third-Party Integrations](#third-party-integrations-250-lines-minimum)
9. [Gamification System](#gamification-system-150-lines-minimum)
10. [Analytics Dashboards](#analytics-dashboards-200-lines-minimum)
11. [Security Hardening](#security-hardening-250-lines-minimum)
12. [Comprehensive Testing](#comprehensive-testing-300-lines-minimum)
13. [Kubernetes Deployment](#kubernetes-deployment-250-lines-minimum)
14. [Database Migration Strategy](#database-migration-strategy-180-lines-minimum)
15. [Key Performance Indicators](#key-performance-indicators-120-lines-minimum)
16. [Risk Mitigation](#risk-mitigation-120-lines-minimum)

---

## **Executive Vision (100+ lines minimum)**

### **1.1 Strategic Vision**
The **Asset Depreciation Module 2.0** represents a **paradigm shift** in financial asset management, moving beyond traditional accounting systems to a **real-time, AI-driven, and user-centric** platform. This transformation aligns with our **digital-first financial strategy**, enabling:

- **Predictive Financial Planning:** AI-driven depreciation forecasting to optimize tax strategies and capital expenditure (CapEx) decisions.
- **Automated Compliance:** Real-time adherence to **GAAP, IFRS, and local tax regulations** with automated audit trails.
- **Seamless Integration:** Unified financial ecosystem connecting **ERP, CRM, and payment gateways** for end-to-end asset lifecycle management.
- **Enhanced User Experience:** A **PWA-based interface** with offline capabilities, reducing friction for field auditors and remote teams.

### **1.2 Business Transformation Goals**
| **Goal** | **Current State** | **Future State (2.0)** | **Business Impact** |
|----------|------------------|-----------------------|---------------------|
| **Depreciation Accuracy** | Manual calculations, 15% error rate | AI-optimized, <1% error rate | $2.5M annual savings in audit corrections |
| **Audit Readiness** | 48-hour audit prep time | Real-time compliance reporting | 90% reduction in audit preparation time |
| **User Productivity** | 30% time spent on data entry | 90% automation, AI-assisted inputs | 20% increase in financial analyst productivity |
| **Cross-Department Collaboration** | Siloed systems (ERP, CRM, Payroll) | Unified API-driven workflows | 30% faster inter-departmental reporting |
| **Mobile Accessibility** | Limited mobile support | Full PWA with offline mode | 40% increase in field team efficiency |

### **1.3 Competitive Advantages**
1. **AI-Powered Depreciation Forecasting**
   - **Dynamic tax optimization** using ML models trained on **10+ years of historical data**.
   - **Scenario modeling** for "what-if" analysis (e.g., accelerated vs. straight-line depreciation).

2. **Real-Time Financial Insights**
   - **WebSocket-driven dashboards** updating asset values, depreciation schedules, and tax implications **instantly**.
   - **Automated alerts** for anomalies (e.g., unexpected asset write-offs).

3. **Regulatory Compliance Automation**
   - **Pre-built templates** for **GAAP, IFRS, and 50+ local tax jurisdictions**.
   - **Automated audit trails** with blockchain-backed immutability.

4. **Unified Financial Ecosystem**
   - **Native integrations** with **Salesforce, Stripe, QuickBooks, and SAP**.
   - **Single sign-on (SSO)** with **Okta, Azure AD, and Google Workspace**.

5. **Gamified Financial Management**
   - **Achievement badges** for accurate forecasting, early compliance submissions, and cost-saving suggestions.
   - **Leaderboards** to incentivize team performance.

### **1.4 Long-Term Roadmap (2024-2026)**
| **Year** | **Milestone** | **Key Deliverables** |
|----------|--------------|----------------------|
| **2024** | **Core 2.0 Launch** | AI forecasting, PWA, real-time dashboards |
| **2025** | **Global Expansion** | Multi-currency support, 100+ tax jurisdiction templates |
| **2026** | **Autonomous Financial Agent** | Self-optimizing depreciation strategies using reinforcement learning |

### **1.5 User Experience Improvements**
- **Voice-Activated Commands** (e.g., *"Show me the depreciation schedule for Asset #12345"*).
- **Augmented Reality (AR) Asset Tracking** for physical inventory verification.
- **Dark Mode & High-Contrast UI** for accessibility compliance.
- **Offline-First Design** with **automatic sync** when connectivity is restored.

---

## **Performance Enhancements (250+ lines minimum)**

### **2.1 Redis Caching Layer (50+ lines)**
```typescript
import { createClient, RedisClientType } from 'redis';
import { DepreciationSchedule } from '../models/depreciation.model';
import { logger } from '../utils/logger';

class RedisCache {
  private client: RedisClientType;
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 5000),
      },
    });

    this.client.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    this.client.connect().catch((err) => {
      logger.error('Failed to connect to Redis:', err);
    });
  }

  /**
   * Cache depreciation schedules for a given asset
   * @param assetId - Unique asset identifier
   * @param schedule - Depreciation schedule data
   */
  async cacheDepreciationSchedule(assetId: string, schedule: DepreciationSchedule[]): Promise<void> {
    try {
      const key = `depreciation:${assetId}`;
      await this.client.set(key, JSON.stringify(schedule), {
        EX: this.CACHE_TTL,
      });
      logger.info(`Cached depreciation schedule for asset ${assetId}`);
    } catch (err) {
      logger.error(`Failed to cache depreciation schedule for asset ${assetId}:`, err);
      throw new Error('Redis cache write failed');
    }
  }

  /**
   * Retrieve cached depreciation schedule
   * @param assetId - Unique asset identifier
   * @returns Cached schedule or null if not found
   */
  async getCachedDepreciationSchedule(assetId: string): Promise<DepreciationSchedule[] | null> {
    try {
      const key = `depreciation:${assetId}`;
      const cachedData = await this.client.get(key);
      if (!cachedData) return null;

      logger.info(`Retrieved cached depreciation schedule for asset ${assetId}`);
      return JSON.parse(cachedData);
    } catch (err) {
      logger.error(`Failed to retrieve cached schedule for asset ${assetId}:`, err);
      return null;
    }
  }

  /**
   * Invalidate cache for a specific asset
   * @param assetId - Unique asset identifier
   */
  async invalidateCache(assetId: string): Promise<void> {
    try {
      const key = `depreciation:${assetId}`;
      await this.client.del(key);
      logger.info(`Invalidated cache for asset ${assetId}`);
    } catch (err) {
      logger.error(`Failed to invalidate cache for asset ${assetId}:`, err);
      throw new Error('Redis cache invalidation failed');
    }
  }
}

export const redisCache = new RedisCache();
```

### **2.2 Database Query Optimization (50+ lines)**
```typescript
import { Pool } from 'pg';
import { DepreciationSchedule } from '../models/depreciation.model';
import { logger } from '../utils/logger';

class DepreciationRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Optimized query to fetch depreciation schedules with pagination
   * Uses indexed columns (asset_id, fiscal_year) for faster lookups
   */
  async getDepreciationSchedules(
    assetId: string,
    fiscalYear?: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<DepreciationSchedule[]> {
    try {
      let query = `
        SELECT
          id, asset_id, fiscal_year, depreciation_amount,
          net_book_value, method, created_at, updated_at
        FROM depreciation_schedules
        WHERE asset_id = $1
      `;
      const params: (string | number)[] = [assetId];

      if (fiscalYear) {
        query += ` AND fiscal_year = $2`;
        params.push(fiscalYear);
      }

      query += ` ORDER BY fiscal_year DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (err) {
      logger.error(`Failed to fetch depreciation schedules for asset ${assetId}:`, err);
      throw new Error('Database query failed');
    }
  }

  /**
   * Batch insert depreciation schedules using COPY command for bulk operations
   */
  async batchInsertSchedules(schedules: DepreciationSchedule[]): Promise<void> {
    if (schedules.length === 0) return;

    try {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Create a temporary table
        await client.query(`
          CREATE TEMP TABLE temp_depreciation_schedules (
            asset_id VARCHAR(50),
            fiscal_year INTEGER,
            depreciation_amount DECIMAL(15, 2),
            net_book_value DECIMAL(15, 2),
            method VARCHAR(20)
          ) ON COMMIT DROP
        `);

        // Use COPY for bulk insert
        const values = schedules.map(s =>
          `${s.asset_id}\t${s.fiscal_year}\t${s.depreciation_amount}\t${s.net_book_value}\t${s.method}`
        ).join('\n');

        await client.query(`
          COPY temp_depreciation_schedules FROM STDIN WITH (FORMAT TEXT, DELIMITER '\t')
        `, [values]);

        // Insert from temp table into main table
        await client.query(`
          INSERT INTO depreciation_schedules (
            asset_id, fiscal_year, depreciation_amount, net_book_value, method
          )
          SELECT asset_id, fiscal_year, depreciation_amount, net_book_value, method
          FROM temp_depreciation_schedules
          ON CONFLICT (asset_id, fiscal_year) DO UPDATE SET
            depreciation_amount = EXCLUDED.depreciation_amount,
            net_book_value = EXCLUDED.net_book_value,
            method = EXCLUDED.method
        `);

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('Batch insert failed:', err);
      throw new Error('Database batch insert failed');
    }
  }
}

export const depreciationRepo = new DepreciationRepository();
```

### **2.3 API Response Compression (30+ lines)**
```typescript
import { NextFunction, Request, Response } from 'express';
import compression from 'compression';
import { logger } from '../utils/logger';

/**
 * Middleware to compress API responses for large payloads
 */
export function compressionMiddleware() {
  return compression({
    level: 6, // Optimal balance between speed and compression
    threshold: 1024, // Only compress responses > 1KB
    filter: (req: Request, res: Response) => {
      // Skip compression for small responses or binary data
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    strategy: require('zlib').Z_DEFAULT_STRATEGY,
  });
}

/**
 * Custom compression for WebSocket responses
 */
export function compressWebSocketData(data: any): Buffer {
  try {
    const jsonString = JSON.stringify(data);
    return require('zlib').gzipSync(jsonString, {
      level: 6,
    });
  } catch (err) {
    logger.error('WebSocket compression failed:', err);
    throw new Error('Data compression failed');
  }
}

/**
 * Decompress WebSocket data
 */
export function decompressWebSocketData(compressedData: Buffer): any {
  try {
    const decompressed = require('zlib').gunzipSync(compressedData);
    return JSON.parse(decompressed.toString());
  } catch (err) {
    logger.error('WebSocket decompression failed:', err);
    throw new Error('Data decompression failed');
  }
}
```

### **2.4 Lazy Loading Implementation (40+ lines)**
```typescript
import { DepreciationSchedule } from '../models/depreciation.model';
import { depreciationRepo } from '../repositories/depreciation.repository';
import { redisCache } from '../cache/redis.cache';

/**
 * Lazy loader for depreciation schedules with caching
 */
export class DepreciationLazyLoader {
  private loadedSchedules: Map<string, DepreciationSchedule[]> = new Map();
  private loadingPromises: Map<string, Promise<DepreciationSchedule[]>> = new Map();

  /**
   * Load schedules for an asset (lazy-loaded and cached)
   */
  async loadSchedules(assetId: string, fiscalYear?: number): Promise<DepreciationSchedule[]> {
    const cacheKey = fiscalYear ? `${assetId}:${fiscalYear}` : assetId;

    // Return cached data if available
    if (this.loadedSchedules.has(cacheKey)) {
      return this.loadedSchedules.get(cacheKey)!;
    }

    // Return existing loading promise if already in progress
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Start loading process
    const loadPromise = (async () => {
      try {
        // Check Redis cache first
        const cachedData = await redisCache.getCachedDepreciationSchedule(assetId);
        if (cachedData) {
          this.loadedSchedules.set(cacheKey, cachedData);
          return cachedData;
        }

        // Fall back to database
        const schedules = await depreciationRepo.getDepreciationSchedules(assetId, fiscalYear);
        this.loadedSchedules.set(cacheKey, schedules);

        // Cache in Redis
        if (schedules.length > 0) {
          await redisCache.cacheDepreciationSchedule(assetId, schedules);
        }

        return schedules;
      } catch (err) {
        throw new Error(`Failed to load schedules for asset ${assetId}: ${err.message}`);
      } finally {
        this.loadingPromises.delete(cacheKey);
      }
    })();

    this.loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Invalidate cached schedules for an asset
   */
  async invalidate(assetId: string): Promise<void> {
    const cacheKey = assetId;
    this.loadedSchedules.delete(cacheKey);
    await redisCache.invalidateCache(assetId);
  }
}

export const depreciationLoader = new DepreciationLazyLoader();
```

### **2.5 Request Debouncing (30+ lines)**
```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Debounce middleware to prevent duplicate requests
 */
export function debounceMiddleware(timeout: number = 500) {
  const requestTimestamps = new Map<string, number>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method}:${req.originalUrl}:${JSON.stringify(req.body)}`;
    const now = Date.now();

    if (requestTimestamps.has(key)) {
      const lastRequestTime = requestTimestamps.get(key)!;
      if (now - lastRequestTime < timeout) {
        logger.warn(`Debounced duplicate request: ${key}`);
        return res.status(429).json({
          error: 'Duplicate request detected. Please wait before retrying.',
        });
      }
    }

    requestTimestamps.set(key, now);

    // Clean up old entries
    if (requestTimestamps.size > 1000) {
      for (const [k, timestamp] of requestTimestamps.entries()) {
        if (now - timestamp > 10000) {
          requestTimestamps.delete(k);
        }
      }
    }

    next();
  };
}

/**
 * Debounce function for client-side API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
```

### **2.6 Connection Pooling (30+ lines)**
```typescript
import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 50, // Maximum number of clients in the pool
      min: 10, // Minimum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      application_name: 'asset-depreciation-service',
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database pool error:', err);
    });

    this.pool.on('connect', () => {
      logger.info('New database connection established');
    });
  }

  public static getInstance(): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool();
    }
    return DatabaseConnectionPool.instance;
  }

  /**
   * Get a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (err) {
      logger.error('Failed to get database client:', err);
      throw new Error('Database connection failed');
    }
  }

  /**
   * Execute a query with automatic client release
   */
  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connection pool closed');
    } catch (err) {
      logger.error('Failed to close database pool:', err);
      throw new Error('Database pool closure failed');
    }
  }
}

export const dbPool = DatabaseConnectionPool.getInstance();
```

---

## **Real-Time Features (300+ lines minimum)**

### **3.1 WebSocket Server Setup (60+ lines)**
```typescript
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from '../utils/logger';
import { compressWebSocketData, decompressWebSocketData } from '../utils/compression';
import { DepreciationEvent } from '../models/events.model';

class DepreciationWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<WebSocket>> = new Map(); // assetId -> Set<WebSocket>

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const assetId = this.getAssetIdFromRequest(req);
      if (!assetId) {
        ws.close(1008, 'Asset ID required');
        return;
      }

      this.addClient(assetId, ws);

      ws.on('message', (data) => {
        this.handleMessage(ws, data);
      });

      ws.on('close', () => {
        this.removeClient(assetId, ws);
      });

      ws.on('error', (err) => {
        logger.error('WebSocket error:', err);
        this.removeClient(assetId, ws);
      });

      logger.info(`New WebSocket connection for asset ${assetId}`);
    });

    logger.info('WebSocket server started');
  }

  private getAssetIdFromRequest(req: IncomingMessage): string | null {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    return url.searchParams.get('assetId');
  }

  private addClient(assetId: string, ws: WebSocket): void {
    if (!this.clients.has(assetId)) {
      this.clients.set(assetId, new Set());
    }
    this.clients.get(assetId)!.add(ws);
  }

  private removeClient(assetId: string, ws: WebSocket): void {
    if (this.clients.has(assetId)) {
      const clientSet = this.clients.get(assetId)!;
      clientSet.delete(ws);
      if (clientSet.size === 0) {
        this.clients.delete(assetId);
      }
    }
  }

  private async handleMessage(ws: WebSocket, data: any): Promise<void> {
    try {
      const decompressed = decompressWebSocketData(data);
      if (decompressed.type === 'subscribe') {
        const assetId = decompressed.assetId;
        this.addClient(assetId, ws);
      }
    } catch (err) {
      logger.error('Failed to process WebSocket message:', err);
      ws.close(1003, 'Invalid message format');
    }
  }

  /**
   * Broadcast depreciation event to all subscribers
   */
  async broadcastEvent(event: DepreciationEvent): Promise<void> {
    if (!this.clients.has(event.assetId)) return;

    const compressedData = compressWebSocketData(event);
    const clientSet = this.clients.get(event.assetId)!;

    for (const client of clientSet) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(compressedData, { binary: true });
      }
    }
  }

  /**
   * Close all connections
   */
  close(): void {
    this.wss.clients.forEach((client) => {
      client.close(1001, 'Server shutting down');
    });
    this.wss.close();
    logger.info('WebSocket server closed');
  }
}

export const wsServer = (server: any) => new DepreciationWebSocketServer(server);
```

### **3.2 Real-Time Event Handlers (80+ lines)**
```typescript
import { DepreciationEvent, EventType } from '../models/events.model';
import { depreciationRepo } from '../repositories/depreciation.repository';
import { wsServer } from '../websocket/server';
import { logger } from '../utils/logger';

class DepreciationEventHandler {
  /**
   * Handle depreciation schedule updates
   */
  async handleScheduleUpdate(assetId: string, fiscalYear: number): Promise<void> {
    try {
      const schedules = await depreciationRepo.getDepreciationSchedules(assetId, fiscalYear);
      const event: DepreciationEvent = {
        type: EventType.SCHEDULE_UPDATE,
        assetId,
        fiscalYear,
        data: schedules,
        timestamp: new Date().toISOString(),
      };

      await wsServer.broadcastEvent(event);
      logger.info(`Broadcasted schedule update for asset ${assetId}`);
    } catch (err) {
      logger.error(`Failed to handle schedule update for asset ${assetId}:`, err);
    }
  }

  /**
   * Handle asset write-off events
   */
  async handleWriteOff(assetId: string, amount: number): Promise<void> {
    try {
      const event: DepreciationEvent = {
        type: EventType.WRITE_OFF,
        assetId,
        data: { amount },
        timestamp: new Date().toISOString(),
      };

      await wsServer.broadcastEvent(event);
      logger.info(`Broadcasted write-off event for asset ${assetId}`);
    } catch (err) {
      logger.error(`Failed to handle write-off for asset ${assetId}:`, err);
    }
  }

  /**
   * Handle method change (e.g., straight-line to accelerated)
   */
  async handleMethodChange(assetId: string, newMethod: string): Promise<void> {
    try {
      const event: DepreciationEvent = {
        type: EventType.METHOD_CHANGE,
        assetId,
        data: { newMethod },
        timestamp: new Date().toISOString(),
      };

      await wsServer.broadcastEvent(event);
      logger.info(`Broadcasted method change for asset ${assetId}`);
    } catch (err) {
      logger.error(`Failed to handle method change for asset ${assetId}:`, err);
    }
  }

  /**
   * Handle bulk updates (e.g., year-end processing)
   */
  async handleBulkUpdate(assetIds: string[]): Promise<void> {
    try {
      const event: DepreciationEvent = {
        type: EventType.BULK_UPDATE,
        assetIds,
        data: { count: assetIds.length },
        timestamp: new Date().toISOString(),
      };

      for (const assetId of assetIds) {
        await wsServer.broadcastEvent(event);
      }
      logger.info(`Broadcasted bulk update for ${assetIds.length} assets`);
    } catch (err) {
      logger.error('Failed to handle bulk update:', err);
    }
  }
}

export const eventHandler = new DepreciationEventHandler();
```

### **3.3 Client-Side WebSocket Integration (60+ lines)**
```typescript
import { DepreciationEvent, EventType } from '../models/events.model';
import { decompressWebSocketData } from '../utils/compression';
import { logger } from '../utils/logger';

class DepreciationWebSocketClient {
  private ws: WebSocket | null = null;
  private assetId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(assetId: string) {
    this.assetId = assetId;
    this.connect();
  }

  private connect(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws?assetId=${this.assetId}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      logger.info(`WebSocket connected for asset ${this.assetId}`);
      this.subscribe();
    };

    this.ws.onmessage = (event) => {
      try {
        const decompressed = decompressWebSocketData(event.data);
        this.handleEvent(decompressed);
      } catch (err) {
        logger.error('Failed to process WebSocket message:', err);
      }
    };

    this.ws.onclose = () => {
      logger.warn(`WebSocket disconnected for asset ${this.assetId}`);
      this.reconnect();
    };

    this.ws.onerror = (err) => {
      logger.error('WebSocket error:', err);
    };
  }

  private subscribe(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        assetId: this.assetId,
      }));
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      logger.info(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      logger.error('Max reconnection attempts reached');
    }
  }

  private handleEvent(event: DepreciationEvent): void {
    switch (event.type) {
      case EventType.SCHEDULE_UPDATE:
        this.handleScheduleUpdate(event);
        break;
      case EventType.WRITE_OFF:
        this.handleWriteOff(event);
        break;
      case EventType.METHOD_CHANGE:
        this.handleMethodChange(event);
        break;
      case EventType.BULK_UPDATE:
        this.handleBulkUpdate(event);
        break;
      default:
        logger.warn('Unknown event type:', event.type);
    }
  }

  private handleScheduleUpdate(event: DepreciationEvent): void {
    const schedules = event.data;
    logger.info(`Received schedule update for asset ${event.assetId}`, schedules);
    // Update UI or state management (e.g., Redux, Vuex)
  }

  private handleWriteOff(event: DepreciationEvent): void {
    logger.info(`Asset ${event.assetId} written off: ${event.data.amount}`);
    // Trigger UI notification
  }

  private handleMethodChange(event: DepreciationEvent): void {
    logger.info(`Asset ${event.assetId} method changed to ${event.data.newMethod}`);
    // Refresh relevant UI components
  }

  private handleBulkUpdate(event: DepreciationEvent): void {
    logger.info(`Bulk update for ${event.assetIds?.length || 0} assets`);
    // Refresh dashboard
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const createWebSocketClient = (assetId: string) => new DepreciationWebSocketClient(assetId);
```

### **3.4 Room/Channel Management (50+ lines)**
```typescript
import { WebSocket } from 'ws';
import { logger } from '../utils/logger';

class WebSocketRoomManager {
  private rooms: Map<string, Set<WebSocket>> = new Map(); // roomId -> Set<WebSocket>

  /**
   * Add a client to a room
   */
  addToRoom(roomId: string, ws: WebSocket): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(ws);
    logger.info(`Client added to room ${roomId}`);
  }

  /**
   * Remove a client from a room
   */
  removeFromRoom(roomId: string, ws: WebSocket): void {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId)!;
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
      logger.info(`Client removed from room ${roomId}`);
    }
  }

  /**
   * Broadcast a message to all clients in a room
   */
  broadcastToRoom(roomId: string, message: any): void {
    if (!this.rooms.has(roomId)) return;

    const room = this.rooms.get(roomId)!;
    const data = JSON.stringify(message);

    room.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });

    logger.info(`Broadcasted message to room ${roomId} (${room.size} clients)`);
  }

  /**
   * Get all rooms a client is in
   */
  getClientRooms(ws: WebSocket): string[] {
    const rooms: string[] = [];
    this.rooms.forEach((clients, roomId) => {
      if (clients.has(ws)) {
        rooms.push(roomId);
      }
    });
    return rooms;
  }

  /**
   * Close all connections in a room
   */
  closeRoom(roomId: string): void {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId)!;
      room.forEach((client) => {
        client.close(1000, 'Room closed');
      });
      this.rooms.delete(roomId);
      logger.info(`Room ${roomId} closed`);
    }
  }
}

export const roomManager = new WebSocketRoomManager();
```

### **3.5 Reconnection Logic (30+ lines)**
```typescript
import { WebSocket } from 'ws';
import { logger } from '../utils/logger';

class WebSocketReconnector {
  private ws: WebSocket;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      logger.info('WebSocket connected');
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.reconnect();
    };

    this.ws.onerror = (err) => {
      logger.error('WebSocket error:', err);
    };
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      logger.info(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      logger.error('Max reconnection attempts reached');
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  close(): void {
    this.stopHeartbeat();
    this.ws.close();
  }
}

export const createReconnectingWebSocket = (url: string) => new WebSocketReconnector(url);
```

---

## **AI/ML Capabilities (250+ lines minimum)**

### **4.1 Predictive Model Training (80+ lines)**
```python
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DepreciationPredictor:
    def __init__(self):
        self.model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=5,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False

    def load_data(self, file_path: str) -> pd.DataFrame:
        """Load historical depreciation data"""
        try:
            data = pd.read_csv(file_path)
            logger.info(f"Loaded data with {len(data)} records")
            return data
        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            raise

    def preprocess_data(self, data: pd.DataFrame) -> tuple:
        """Feature engineering and preprocessing"""
        try:
            # Feature engineering
            data['asset_age'] = data['current_year'] - data['acquisition_year']
            data['depreciation_rate'] = data['depreciation_amount'] / data['acquisition_cost']

            # Select features and target
            features = [
                'acquisition_cost', 'asset_age', 'useful_life',
                'depreciation_method', 'industry_code', 'location_id'
            ]
            target = 'depreciation_amount'

            # One-hot encode categorical features
            data = pd.get_dummies(data, columns=['depreciation_method', 'industry_code', 'location_id'])

            # Split data
            X = data[[col for col in data.columns if col in features or col.startswith('depreciation_method_') or col.startswith('industry_code_') or col.startswith('location_id_')]]
            y = data[target]

            # Scale features
            X_scaled = self.scaler.fit_transform(X)

            return train_test_split(X_scaled, y, test_size=0.2, random_state=42)
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            raise

    def train(self, X_train, y_train) -> None:
        """Train the model"""
        try:
            self.model.fit(X_train, y_train)
            self.is_trained = True
            logger.info("Model training completed")
        except Exception as e:
            logger.error(f"Training failed: {e}")
            raise

    def evaluate(self, X_test, y_test) -> dict:
        """Evaluate model performance"""
        if not self.is_trained:
            raise ValueError("Model not trained")

        try:
            y_pred = self.model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)

            logger.info(f"Model evaluation - MAE: {mae:.2f}, R2: {r2:.2f}")
            return {
                'mae': mae,
                'r2_score': r2,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Evaluation failed: {e}")
            raise

    def save_model(self, model_path: str, scaler_path: str) -> None:
        """Save trained model and scaler"""
        try:
            joblib.dump(self.model, model_path)
            joblib.dump(self.scaler, scaler_path)
            logger.info(f"Model saved to {model_path}, scaler saved to {scaler_path}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            raise

    def load_model(self, model_path: str, scaler_path: str) -> None:
        """Load trained model and scaler"""
        try:
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.is_trained = True
            logger.info(f"Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

# Example usage
if __name__ == "__main__":
    predictor = DepreciationPredictor()
    data = predictor.load_data("historical_depreciation_data.csv")
    X_train, X_test, y_train, y_test = predictor.preprocess_data(data)
    predictor.train(X_train, y_train)
    metrics = predictor.evaluate(X_test, y_test)
    predictor.save_model("depreciation_model.pkl", "depreciation_scaler.pkl")
```

### **4.2 Real-Time Inference API (60+ lines)**
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import logging
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Load model and scaler
try:
    model = joblib.load("depreciation_model.pkl")
    scaler = joblib.load("depreciation_scaler.pkl")
    logger.info("Model and scaler loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    raise

class DepreciationInput(BaseModel):
    acquisition_cost: float
    asset_age: int
    useful_life: int
    depreciation_method: str
    industry_code: str
    location_id: str

class DepreciationOutput(BaseModel):
    predicted_depreciation: float
    confidence_interval: List[float]
    model_version: str = "1.0.0"

@app.post("/predict", response_model=DepreciationOutput)
async def predict_depreciation(input_data: DepreciationInput):
    try:
        # Prepare input features
        features = [
            input_data.acquisition_cost,
            input_data.asset_age,
            input_data.useful_life,
            input_data.depreciation_method,
            input_data.industry_code,
            input_data.location_id
        ]

        # One-hot encode categorical features
        categorical_features = {
            'depreciation_method': input_data.depreciation_method,
            'industry_code': input_data.industry_code,
            'location_id': input_data.location_id
        }

        # Create feature vector (simplified for example)
        feature_vector = [
            input_data.acquisition_cost,
            input_data.asset_age,
            input_data.useful_life
        ]

        # Add one-hot encoded features
        for cat_feature, value in categorical_features.items():
            for possible_value in ["straight_line", "accelerated", "double_declining"]:  # Example values
                feature_vector.append(1 if value == possible_value else 0)

        # Scale features
        scaled_features = scaler.transform([feature_vector])

        # Make prediction
        prediction = model.predict(scaled_features)[0]

        # Calculate confidence interval (simplified)
        confidence_interval = [
            max(0, prediction * 0.95),
            prediction * 1.05
        ]

        return {
            "predicted_depreciation": float(prediction),
            "confidence_interval": confidence_interval,
            "model_version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### **4.3 Feature Engineering Pipeline (60+ lines)**
```python
import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AssetAgeCalculator(BaseEstimator, TransformerMixin):
    """Calculate asset age from acquisition year"""
    def __init__(self, current_year: int = 2023):
        self.current_year = current_year

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        X['asset_age'] = self.current_year - X['acquisition_year']
        return X

class DepreciationRateCalculator(BaseEstimator, TransformerMixin):
    """Calculate depreciation rate"""
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        X['depreciation_rate'] = X['depreciation_amount'] / X['acquisition_cost']
        return X

class OutlierHandler(BaseEstimator, TransformerMixin):
    """Handle outliers in numerical features"""
    def __init__(self, threshold: float = 3.0):
        self.threshold = threshold

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        numerical_cols = X.select_dtypes(include=['float64', 'int64']).columns

        for col in numerical_cols:
            if col in ['acquisition_year', 'fiscal_year']:  # Skip year columns
                continue

            mean = X[col].mean()
            std = X[col].std()
            X[col] = np.where(
                np.abs(X[col] - mean) > self.threshold * std,
                mean,
                X[col]
            )

        return X

class FeatureEngineeringPipeline:
    def __init__(self):
        self.pipeline = Pipeline([
            ('age_calculator', AssetAgeCalculator()),
            ('rate_calculator', DepreciationRateCalculator()),
            ('outlier_handler', OutlierHandler()),
            ('preprocessor', self._create_preprocessor())
        ])

    def _create_preprocessor(self):
        """Create column transformer for preprocessing"""
        numerical_features = ['acquisition_cost', 'asset_age', 'useful_life']
        categorical_features = ['depreciation_method', 'industry_code', 'location_id']

        preprocessor = ColumnTransformer([
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])

        return preprocessor

    def fit(self, X, y=None):
        """Fit the pipeline"""
        try:
            self.pipeline.fit(X, y)
            logger.info("Feature engineering pipeline fitted")
            return self
        except Exception as e:
            logger.error(f"Pipeline fitting failed: {e}")
            raise

    def transform(self, X):
        """Transform data using the pipeline"""
        try:
            return self.pipeline.transform(X)
        except Exception as e:
            logger.error(f"Pipeline transformation failed: {e}")
            raise

    def fit_transform(self, X, y=None):
        """Fit and transform data"""
        return self.fit(X, y).transform(X)

# Example usage
if __name__ == "__main__":
    # Sample data
    data = pd.DataFrame({
        'acquisition_cost': [10000, 20000, 15000],
        'acquisition_year': [2020, 2019, 2021],
        'useful_life': [5, 10, 7],
        'depreciation_method': ['straight_line', 'accelerated', 'straight_line'],
        'industry_code': ['IT', 'Manufacturing', 'Healthcare'],
        'location_id': ['US', 'EU', 'APAC'],
        'depreciation_amount': [2000, 3000, 2500]
    })

    pipeline = FeatureEngineeringPipeline()
    transformed_data = pipeline.fit_transform(data)
    print("Transformed data shape:", transformed_data.shape)
```

### **4.4 Model Monitoring and Retraining (50+ lines)**
```python
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error
import joblib
import logging
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelMonitor:
    def __init__(self, model_path: str, scaler_path: str, threshold: float = 0.15):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.threshold = threshold  # 15% performance degradation threshold
        self.performance_history = []

    def load_model(self):
        """Load the trained model and scaler"""
        try:
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
            logger.info("Model and scaler loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def evaluate_performance(self, X_test, y_test):
        """Evaluate model performance on new data"""
        try:
            y_pred = self.model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            logger.info(f"Current MAE: {mae:.2f}")

            # Compare with historical performance
            if len(self.performance_history) > 0:
                avg_mae = np.mean([p['mae'] for p in self.performance_history])
                degradation = (mae - avg_mae) / avg_mae

                if degradation > self.threshold:
                    logger.warning(f"Model performance degraded by {degradation:.2%}")
                    self.send_alert(degradation, mae)
                    return True
                else:
                    logger.info(f"Model performance stable (degradation: {degradation:.2%})")

            # Store performance metrics
            self.performance_history.append({
                'mae': mae,
                'timestamp': datetime.now().isoformat(),
                'data_size': len(X_test)
            })

            return False
        except Exception as e:
            logger.error(f"Performance evaluation failed: {e}")
            raise

    def send_alert(self, degradation: float, current_mae: float):
        """Send email alert for performance degradation"""
        try:
            msg = MIMEText(f"""
            Model Performance Alert

            Current MAE: {current_mae:.2f}
            Performance Degradation: {degradation:.2%}

            Please review the model and consider retraining.
            """)

            msg['Subject'] = f"Model Performance Alert - {datetime.now().strftime('%Y-%m-%d')}"
            msg['From'] = "model-monitor@company.com"
            msg['To'] = "data-science-team@company.com"

            with smtplib.SMTP('smtp.company.com', 587) as server:
                server.starttls()
                server.login("user", "password")
                server.send_message(msg)

            logger.info("Performance alert email sent")
        except Exception as e:
            logger.error(f"Failed to send alert email: {e}")

    def retrain_model(self, X_train, y_train):
        """Retrain the model with new data"""
        try:
            logger.info("Starting model retraining...")
            self.model.fit(X_train, y_train)
            joblib.dump(self.model, self.model_path)
            logger.info("Model retrained and saved successfully")
        except Exception as e:
            logger.error(f"Model retraining failed: {e}")
            raise

class DataDriftDetector:
    def __init__(self, reference_data: pd.DataFrame, threshold: float = 0.1):
        self.reference_data = reference_data
        self.threshold = threshold

    def detect_drift(self, current_data: pd.DataFrame) -> bool:
        """Detect data drift using Kolmogorov-Smirnov test"""
        try:
            from scipy.stats import ks_2samp

            drift_detected = False
            numerical_cols = current_data.select_dtypes(include=['float64', 'int64']).columns

            for col in numerical_cols:
                if col in self.reference_data.columns:
                    stat, p_value = ks_2samp(
                        self.reference_data[col],
                        current_data[col]
                    )

                    if p_value < self.threshold:
                        logger.warning(f"Data drift detected in column {col} (p-value: {p_value:.4f})")
                        drift_detected = True

            return drift_detected
        except Exception as e:
            logger.error(f"Data drift detection failed: {e}")
            raise

# Example usage
if __name__ == "__main__":
    # Load test data
    test_data = pd.read_csv("test_depreciation_data.csv")
    X_test = test_data.drop('depreciation_amount', axis=1)
    y_test = test_data['depreciation_amount']

    # Monitor model
    monitor = ModelMonitor("depreciation_model.pkl", "depreciation_scaler.pkl")
    monitor.load_model()
    performance_degraded = monitor.evaluate_performance(X_test, y_test)

    if performance_degraded:
        # Load training data
        train_data = pd.read_csv("new_training_data.csv")
        X_train = train_data.drop('depreciation_amount', axis=1)
        y_train = train_data['depreciation_amount']

        # Retrain model
        monitor.retrain_model(X_train, y_train)

    # Check for data drift
    reference_data = pd.read_csv("reference_data.csv")
    drift_detector = DataDriftDetector(reference_data)
    current_data = pd.read_csv("current_data.csv")
    drift_detected = drift_detector.detect_drift(current_data)

    if drift_detected:
        logger.warning("Data drift detected - consider updating training data")
```

---

## **Progressive Web App (PWA) Features (200+ lines minimum)**

### **5.1 Service Worker Registration (40+ lines)**
```typescript
// src/service-worker/register.ts
import { Workbox } from 'workbox-window';
import { logger } from '../utils/logger';

class ServiceWorkerManager {
  private workbox: Workbox | null = null;
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
    if (!this.isDev && 'serviceWorker' in navigator) {
      this.initialize();
    }
  }

  private initialize(): void {
    try {
      this.workbox = new Workbox('/sw.js');
      this.setupEventListeners();
      this.register();
    } catch (err) {
      logger.error('Failed to initialize service worker:', err);
    }
  }

  private setupEventListeners(): void {
    if (!this.workbox) return;

    this.workbox.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        logger.info('New service worker installed - content will be updated after page reload');
        this.showUpdateNotification();
      } else {
        logger.info('Service worker installed for the first time');
      }
    });

    this.workbox.addEventListener('waiting', () => {
      logger.info('New service worker waiting to activate');
      this.showUpdateNotification();
    });

    this.workbox.addEventListener('controlling', () => {
      window.location.reload();
    });

    this.workbox.addEventListener('activated', (event) => {
      if (event.isUpdate) {
        logger.info('New service worker activated');
      }
    });
  }

  private async register(): Promise<void> {
    if (!this.workbox) return;

    try {
      await this.workbox.register();
      logger.info('Service worker registered');
    } catch (err) {
      logger.error('Service worker registration failed:', err);
    }
  }

  private showUpdateNotification(): void {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    notification.style.zIndex = '1000';
    notification.style.cursor = 'pointer';

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span>A new version is available</span>
        <button style="background: white; color: #4CAF50; border: none; padding: 5px 10px; border-radius: 3px;">
          Refresh
        </button>
      </div>
    `;

    notification.querySelector('button')?.addEventListener('click', () => {
      if (this.workbox) {
        this.workbox.addEventListener('controlling', () => {
          window.location.reload();
        });
        this.workbox.messageSkipWaiting();
      }
    });

    document.body.appendChild(notification);
  }

  public unregister(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          logger.info('Service worker unregistered');
        });
      });
    }
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();
```

### **5.2 Caching Strategies (60+ lines)**
```typescript
// src/service-worker/cache-strategies.ts
import { registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  NetworkOnly,
} from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { logger } from '../utils/logger';

class CacheStrategyManager {
  private static readonly CACHE_NAME = 'asset-depreciation-v2';
  private static readonly MAX_ENTRIES = 100;
  private static readonly MAX_AGE_DAYS = 30;

  constructor() {
    this.setupStrategies();
  }

  private setupStrategies(): void {
    // Cache API responses with NetworkFirst strategy
    this.setupApiCaching();

    // Cache static assets with CacheFirst strategy
    this.setupStaticAssetCaching();

    // Cache offline fallback pages
    this.setupOfflineFallback();

    // Background sync for failed requests
    this.setupBackgroundSync();
  }

  private setupApiCaching(): void {
    registerRoute(
      ({ url }) => url.pathname.startsWith('/api/'),
      new NetworkFirst({
        cacheName: `${CacheStrategyManager.CACHE_NAME}-api`,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new ExpirationPlugin({
            maxEntries: CacheStrategyManager.MAX_ENTRIES,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          }),
        ],
      }),
      'GET'
    );

    // For POST/PUT/DELETE requests, use background sync
    registerRoute(
      ({ url }) => url.pathname.startsWith('/api/'),
      new NetworkOnly({
        plugins: [
          new BackgroundSyncPlugin('apiQueue', {
            maxRetentionTime: 24 * 60, // 1 day
          }),
        ],
      }),
      'POST'
    );

    registerRoute(
      ({ url }) => url.pathname.startsWith('/api/'),
      new NetworkOnly({
        plugins: [
          new BackgroundSyncPlugin('apiQueue', {
            maxRetentionTime: 24 * 60,
          }),
        ],
      }),
      'PUT'
    );

    registerRoute(
      ({ url }) => url.pathname.startsWith('/api/'),
      new NetworkOnly({
        plugins: [
          new BackgroundSyncPlugin('apiQueue', {
            maxRetentionTime: 24 * 60,
          }),
        ],
      }),
      'DELETE'
    );
  }

  private setupStaticAssetCaching(): void {
    // Cache JS, CSS, and images
    registerRoute(
      ({ request }) =>
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image',
      new CacheFirst({
        cacheName: `${CacheStrategyManager.CACHE_NAME}-static`,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new ExpirationPlugin({
            maxEntries: CacheStrategyManager.MAX_ENTRIES,
            maxAgeSeconds: CacheStrategyManager.MAX_AGE_DAYS * 24 * 60 * 60,
          }),
        ],
      })
    );

    // Cache fonts
    registerRoute(
      ({ request }) => request.destination === 'font',
      new CacheFirst({
        cacheName: `${CacheStrategyManager.CACHE_NAME}-fonts`,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          }),
        ],
      })
    );
  }

  private setupOfflineFallback(): void {
    // Serve offline page when network fails
    registerRoute(
      ({ request }) => request.mode === 'navigate',
      new NetworkFirst({
        cacheName: `${CacheStrategyManager.CACHE_NAME}-pages`,
        plugins: [
          {
            handlerDidError: async () => {
              return await caches.match('/offline.html');
            },
          },
        ],
      })
    );
  }

  private setupBackgroundSync(): void {
    // Retry failed requests when back online
    const bgSyncPlugin = new BackgroundSyncPlugin('failedRequestsQueue', {
      maxRetentionTime: 24 * 60, // 1 day
    });

    registerRoute(
      ({ url }) => url.pathname.startsWith('/api/'),
      new NetworkOnly({
        plugins: [bgSyncPlugin],
      }),
      'POST'
    );
  }
}

export const cacheStrategyManager = new CacheStrategyManager();
```

### **5.3 Offline Functionality (50+ lines)**
```typescript
// src/offline/offline-manager.ts
import { openDB, DBSchema } from 'idb';
import { logger } from '../utils/logger';

interface OfflineDB extends DBSchema {
  'depreciation-schedules': {
    key: string;
    value: {
      id: string;
      assetId: string;
      fiscalYear: number;
      data: any;
      timestamp: string;
      syncStatus: 'pending' | 'synced' | 'failed';
    };
  };
  'assets': {
    key: string;
    value: {
      id: string;
      name: string;
      acquisitionCost: number;
      acquisitionDate: string;
      usefulLife: number;
      method: string;
    };
  };
}

class OfflineManager {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initializeDB();
  }

  private async initializeDB(): Promise<IDBDatabase> {
    return openDB<OfflineDB>('asset-depreciation-offline', 1, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains('depreciation-schedules')) {
          const store = db.createObjectStore('depreciation-schedules', {
            keyPath: 'id',
          });
          store.createIndex('assetId', 'assetId', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', {
            keyPath: 'id',
          });
        }
      },
    });
  }

  /**
   * Store depreciation schedule for offline use
   */
  async storeDepreciationSchedule(schedule: any): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('depreciation-schedules', 'readwrite');
      const store = tx.objectStore('depreciation-schedules');

      await store.put({
        id: `${schedule.assetId}-${schedule.fiscalYear}`,
        assetId: schedule.assetId,
        fiscalYear: schedule.fiscalYear,
        data: schedule,
        timestamp: new Date().toISOString(),
        syncStatus: 'pending',
      });

      await tx.done;
      logger.info(`Stored depreciation schedule for asset ${schedule.assetId} offline`);
    } catch (err) {
      logger.error('Failed to store depreciation schedule offline:', err);
      throw new Error('Offline storage failed');
    }
  }

  /**
   * Get pending depreciation schedules
   */
  async getPendingSchedules(): Promise<any[]> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('depreciation-schedules', 'readonly');
      const store = tx.objectStore('depreciation-schedules');
      const index = store.index('syncStatus');

      const pending = await index.getAll('pending');
      await tx.done;

      return pending.map((item) => item.data);
    } catch (err) {
      logger.error('Failed to get pending schedules:', err);
      return [];
    }
  }

  /**
   * Mark schedule as synced
   */
  async markScheduleAsSynced(assetId: string, fiscalYear: number): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('depreciation-schedules', 'readwrite');
      const store = tx.objectStore('depreciation-schedules');

      const id = `${assetId}-${fiscalYear}`;
      const item = await store.get(id);

      if (item) {
        item.syncStatus = 'synced';
        await store.put(item);
      }

      await tx.done;
      logger.info(`Marked schedule for asset ${assetId} as synced`);
    } catch (err) {
      logger.error('Failed to mark schedule as synced:', err);
    }
  }

  /**
   * Store asset for offline use
   */
  async storeAsset(asset: any): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('assets', 'readwrite');
      const store = tx.objectStore('assets');

      await store.put({
        id: asset.id,
        name: asset.name,
        acquisitionCost: asset.acquisitionCost,
        acquisitionDate: asset.acquisitionDate,
        usefulLife: asset.usefulLife,
        method: asset.method,
      });

      await tx.done;
      logger.info(`Stored asset ${asset.id} offline`);
    } catch (err) {
      logger.error('Failed to store asset offline:', err);
      throw new Error('Offline asset storage failed');
    }
  }

  /**
   * Get all assets available offline
   */
  async getAllAssets(): Promise<any[]> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction('assets', 'readonly');
      const store = tx.objectStore('assets');

      const assets = await store.getAll();
      await tx.done;

      return assets;
    } catch (err) {
      logger.error('Failed to get offline assets:', err);
      return [];
    }
  }
}

export const offlineManager = new OfflineManager();
```

### **5.4 Background Sync (30+ lines)**
```typescript
// src/offline/background-sync.ts
import { offlineManager } from './offline-manager';
import { logger } from '../utils/logger';
import { depreciationApi } from '../api/depreciation.api';

class BackgroundSyncManager {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupOnlineListener();
    this.startPeriodicSync();
  }

  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      logger.info('Back online - starting background sync');
      this.syncPendingData();
    });
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingData();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Sync all pending data with the server
   */
  async syncPendingData(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    try {
      const pendingSchedules = await offlineManager.getPendingSchedules();
      if (pendingSchedules.length === 0) {
        logger.info('No pending data to sync');
        return;
      }

      logger.info(`Syncing ${pendingSchedules.length} pending schedules...`);

      for (const schedule of pendingSchedules) {
        try {
          await depreciationApi.updateDepreciationSchedule(
            schedule.assetId,
            schedule.fiscalYear,
            schedule
          );
          await offlineManager.markScheduleAsSynced(schedule.assetId, schedule.fiscalYear);
          logger.info(`Synced schedule for asset ${schedule.assetId}`);
        } catch (err) {
          logger.error(`Failed to sync schedule for asset ${schedule.assetId}:`, err);
          // Mark as failed after 3 attempts
          // (Implementation would track attempt count)
        }
      }
    } catch (err) {
      logger.error('Background sync failed:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Stop periodic sync
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const backgroundSyncManager = new BackgroundSyncManager();
```

---

## **WCAG 2.1 AAA Accessibility (200+ lines minimum)**

### **6.1 ARIA Implementation (60+ lines)**
```typescript
// src/accessibility/aria.ts
import { logger } from '../utils/logger';

class AriaManager {
  /**
   * Set ARIA attributes for a DOM element
   */
  setAttributes(element: HTMLElement, attributes: Record<string, string>): void {
    try {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    } catch (err) {
      logger.error('Failed to set ARIA attributes:', err);
    }
  }

  /**
   * Create an accessible modal dialog
   */
  createModalDialog(
    id: string,
    title: string,
    content: HTMLElement,
    onClose: () => void
  ): HTMLElement {
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `${id}-title`);
    modal.setAttribute('aria-describedby', `${id}-description`);
    modal.id = id;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'document');
    dialog.style.backgroundColor = 'white';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '5px';
    dialog.style.maxWidth = '80%';
    dialog.style.maxHeight = '80%';
    dialog.style.overflow = 'auto';

    const titleElement = document.createElement('h2');
    titleElement.id = `${id}-title`;
    titleElement.textContent = title;
    dialog.appendChild(titleElement);

    const descriptionElement = document.createElement('div');
    descriptionElement.id = `${id}-description`;
    descriptionElement.appendChild(content);
    dialog.appendChild(descriptionElement);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '20px';
    closeButton.addEventListener('click', () => {
      modal.remove();
      onClose();
    });
    dialog.appendChild(closeButton);

    modal.appendChild(dialog);

    // Trap focus inside modal
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      } else if (e.key === 'Escape') {
        modal.remove();
        onClose();
      }
    });

    return modal;
  }

  /**
   * Create an accessible dropdown menu
   */
  createDropdown(
    id: string,
    label: string,
    options: { value: string; text: string }[],
    onSelect: (value: string) => void
  ): HTMLElement {
    const container = document.createElement('div');
    container.id = id;

    const labelElement = document.createElement('label');
    labelElement.id = `${id}-label`;
    labelElement.textContent = label;
    labelElement.htmlFor = `${id}-select`;
    container.appendChild(labelElement);

    const select = document.createElement('select');
    select.id = `${id}-select`;
    select.setAttribute('aria-labelledby', `${id}-label`);
    select.style.padding = '8px';
    select.style.borderRadius = '4px';
    select.style.border = '1px solid #ccc';

    options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      select.appendChild(optionElement);
    });

    select.addEventListener('change', () => {
      onSelect(select.value);
    });

    container.appendChild(select);
    return container;
  }

  /**
   * Create an accessible tooltip
   */
  createTooltip(target: HTMLElement, content: string): void {
    target.setAttribute('aria-describedby', `${target.id}-tooltip`);

    const tooltip = document.createElement('div');
    tooltip.id = `${target.id}-tooltip`;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = content;
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = '#333';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '14px';
    tooltip.style.zIndex = '1000';
    tooltip.style.display = 'none';

    document.body.appendChild(tooltip);

    target.addEventListener('mouseenter', () => {
      const rect = target.getBoundingClientRect();
      tooltip.style.display = 'block';
      tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
      tooltip.style.left = `${rect.left + window.scrollX}px`;
    });

    target.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });

    target.addEventListener('focus', () => {
      const rect = target.getBoundingClientRect();
      tooltip.style.display = 'block';
      tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
      tooltip.style.left = `${rect.left + window.scrollX}px`;
    });

    target.addEventListener('blur', () => {
      tooltip.style.display = 'none';
    });
  }
}

export const ariaManager = new AriaManager();
```

### **6.2 Keyboard Navigation (50+ lines)**
```typescript
// src/accessibility/keyboard.ts
import { logger } from '../utils/logger';

class KeyboardNavigationManager {
  private focusableElements: HTMLElement[] = [];
  private currentFocusIndex = -1;

  /**
   * Initialize keyboard navigation for a container
   */
  initialize(container: HTMLElement): void {
    this.focusableElements = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    if (this.focusableElements.length === 0) return;

    container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        this.moveFocus(1);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        this.moveFocus(-1);
        e.preventDefault();
      } else if (e.key === 'Home') {
        this.currentFocusIndex = 0;
        this.focusCurrentElement();
        e.preventDefault();
      } else if (e.key === 'End') {
        this.currentFocusIndex = this.focusableElements.length - 1;
        this.focusCurrentElement();
        e.preventDefault();
      }
    });

    // Set initial focus
    this.currentFocusIndex = 0;
    this.focusCurrentElement();
  }

  private moveFocus(direction: number): void {
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex += direction;

    // Wrap around
    if (this.currentFocusIndex < 0) {
      this.currentFocusIndex = this.focusableElements.length - 1;
    } else if (this.currentFocusIndex >= this.focusableElements.length) {
      this.currentFocusIndex = 0;
    }

    this.focusCurrentElement();
  }

  private focusCurrentElement(): void {
    if (this.currentFocusIndex >= 0 && this.currentFocusIndex < this.focusableElements.length) {
      this.focusableElements[this.currentFocusIndex].focus();
    }
  }

  /**
   * Create a keyboard-navigable table
   */
  createAccessibleTable(
    headers: string[],
    rows: string[][],
    onRowSelect?: (rowIndex: number) => void
  ): HTMLElement {
    const table = document.createElement('table');
    table.setAttribute('role', 'grid');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.setAttribute('role', 'row');

    headers.forEach((header, index) => {
      const th = document.createElement('th');
      th.setAttribute('role', 'columnheader');
      th.setAttribute('scope', 'col');
      th.textContent = header;
      th.style.padding = '8px';
      th.style.border = '1px solid #ddd';
      th.style.backgroundColor = '#f2f2f2';
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');

    rows.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      tr.setAttribute('role', 'row');
      tr.setAttribute('tabindex', '0');
      tr.style.border = '1px solid #ddd';

      if (onRowSelect) {
        tr.addEventListener('click', () => {
          onRowSelect(rowIndex);
        });

        tr.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onRowSelect(rowIndex);
            e.preventDefault();
          }
        });
      }

      row.forEach((cell, cellIndex) => {
        const td = document.createElement('td');
        td.setAttribute('role', 'gridcell');
        td.textContent = cell;
        td.style.padding = '8px';
        td.style.border = '1px solid #ddd';
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
  }

  /**
   * Make a custom component keyboard-accessible
   */
  makeAccessible(
    element: HTMLElement,
    options: {
      role: string;
      tabIndex?: number;
      onEnter?: () => void;
      onSpace?: () => void;
      onArrowLeft?: () => void;
      onArrowRight?: () => void;
    }
  ): void {
    element.setAttribute('role', options.role);
    if (options.tabIndex !== undefined) {
      element.setAttribute('tabindex', options.tabIndex.toString());
    }

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && options.onEnter) {
        options.onEnter();
        e.preventDefault();
      } else if (e.key === ' ' && options.onSpace) {
        options.onSpace();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && options.onArrowLeft) {
        options.onArrowLeft();
        e.preventDefault();
      } else if (e.key === 'ArrowRight' && options.onArrowRight) {
        options.onArrowRight();
        e.preventDefault();
      }
    });
  }
}

export const keyboardManager = new KeyboardNavigationManager();
```

### **6.3 Screen Reader Optimization (40+ lines)**
```typescript
// src/accessibility/screen-reader.ts
import { logger } from '../utils/logger';

class ScreenReaderManager {
  private liveRegion: HTMLElement;

  constructor() {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.margin = '-1px';
    this.liveRegion.style.padding = '0';
    this.liveRegion.style.overflow = 'hidden';
    this.liveRegion.style.clip = 'rect(0, 0, 0, 0)';
    this.liveRegion.style.border = '0';

    document.body.appendChild(this.liveRegion);
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    try {
      this.liveRegion.setAttribute('aria-live', priority);
      this.liveRegion.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        this.liveRegion.textContent = '';
      }, 1000);
    } catch (err) {
      logger.error('Failed to announce message:', err);
    }
  }

  /**
   * Create an accessible button with proper ARIA attributes
   */
  createAccessibleButton(
    text: string,
    onClick: () => void,
    options: {
      id?: string;
      ariaLabel?: string;
      ariaPressed?: boolean;
      disabled?: boolean;
    } = {}
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;

    if (options.id) {
      button.id = options.id;
    }

    if (options.ariaLabel) {
      button.setAttribute('aria-label', options.ariaLabel);
    }

    if (options.ariaPressed !== undefined) {
      button.setAttribute('aria-pressed', options.ariaPressed.toString());
    }

    if (options.disabled) {
      button.setAttribute('disabled', 'true');
      button.setAttribute('aria-disabled', 'true');
    }

    button.addEventListener('click', () => {
      if (!options.disabled) {
        onClick();
      }
    });

    return button;
  }

  /**
   * Create an accessible form field
   */
  createAccessibleFormField(
    label: string,
    type: string,
    id: string,
    options: {
      required?: boolean;
      value?: string;
      placeholder?: string;
      ariaDescribedBy?: string;
    } = {}
  ): HTMLElement {
    const container = document.createElement('div');
    container.style.marginBottom = '15px';

    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    if (options.required) {
      labelElement.textContent += ' *';
    }
    container.appendChild(labelElement);

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;

    if (options.value) {
      input.value = options.value;
    }

    if (options.placeholder) {
      input.placeholder = options.placeholder;
    }

    if (options.required) {
      input.required = true;
    }

    if (options.ariaDescribedBy) {
      input.setAttribute('aria-describedby', options.ariaDescribedBy);
    }

    container.appendChild(input);

    if (options.required) {
      const errorElement = document.createElement('div');
      errorElement.id = `${id}-error`;
      errorElement.setAttribute('aria-live', 'polite');
      errorElement.style.color = 'red';
      errorElement.style.fontSize = '12px';
      errorElement.style.marginTop = '5px';
      errorElement.style.display = 'none';
      errorElement.textContent = 'This field is required';
      container.appendChild(errorElement);

      input.addEventListener('invalid', () => {
        errorElement.style.display = 'block';
      });

      input.addEventListener('input', () => {
        if (input.validity.valid) {
          errorElement.style.display = 'none';
        }
      });
    }

    return container;
  }

  /**
   * Create an accessible alert
   */
  createAlert(message: string, type: 'success' | 'error' | 'warning' = 'success'): HTMLElement {
    const alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    alert.setAttribute('aria-live', 'assertive');

    let icon = '';
    let bgColor = '';

    switch (type) {
      case 'success':
        icon = '✓';
        bgColor = '#d4edda';
        break;
      case 'error':
        icon = '✗';
        bgColor = '#f8d7da';
        break;
      case 'warning':
        icon = '!';
        bgColor = '#fff3cd';
        break;
    }

    alert.style.padding = '15px';
    alert.style.margin = '10px 0';
    alert.style.borderRadius = '4px';
    alert.style.backgroundColor = bgColor;
    alert.style.display = 'flex';
    alert.style.alignItems = 'center';
    alert.style.gap = '10px';

    const iconElement = document.createElement('span');
    iconElement.textContent = icon;
    iconElement.style.fontSize = '20px';
    alert.appendChild(iconElement);

    const messageElement = document.createElement('span');
    messageElement.textContent = message;
    alert.appendChild(messageElement);

    return alert;
  }
}

export const screenReaderManager = new ScreenReaderManager();
```

### **6.4 Focus Management (30+ lines)**
```typescript
// src/accessibility/focus.ts
import { logger } from '../utils/logger';

class FocusManager {
  /**
   * Trap focus within a container
   */
  trapFocus(container: HTMLElement): void {
    const focusableElements = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    if (focusableElements.length === 0) return;

    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    });

    // Set initial focus
    focusableElements[0].focus();
  }

  /**
   * Move focus to a specific element
   */
  focusElement(selector: string, container: HTMLElement = document): void {
    try {
      const element = container.querySelector(selector) as HTMLElement;
      if (element) {
        element.focus();
        if (element.tabIndex === -1) {
          element.tabIndex = 0;
        }
      }
    } catch (err) {
      logger.error('Failed to focus element:', err);
    }
  }

  /**
   * Create a visually hidden but focusable element
   */
  createFocusableSkipLink(text: string, targetId: string): HTMLElement {
    const link = document.createElement('a');
    link.href = `#${targetId}`;
    link.textContent = text;
    link.style.position = 'absolute';
    link.style.width = '1px';
    link.style.height = '1px';
    link.style.margin = '-1px';
    link.style.padding = '0';
    link.style.overflow = 'hidden';
    link.style.clip = 'rect(0, 0, 0, 0)';
    link.style.border = '0';

    link.addEventListener('focus', () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.tabIndex = -1;
        target.focus();
      }
    });

    return link;
  }

  /**
   * Manage focus for dynamic content
   */
  manageDynamicFocus(container: HTMLElement, options: {
    onOpen?: () => void;
    onClose?: () => void;
  } = {}): void {
    const focusableElements = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    if (options.onOpen) {
      options.onOpen();
    }

    container.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (options.onClose) {
          options.onClose();
        }
        container.remove();
      }
    });
  }
}

export const focusManager = new FocusManager();
```

---

## **Advanced Search and Filtering (180+ lines minimum)**

### **7.1 ElasticSearch Client Setup (40+ lines)**
```typescript
// src/search/elasticsearch.client.ts
import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

class ElasticSearchClient {
  private client: Client;
  private readonly INDEX_NAME = 'asset_depreciation';

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
      },
      maxRetries: 3,
      requestTimeout: 60000,
      sniffOnStart: true,
    });

    this.initializeIndex();
  }

  private async initializeIndex(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.INDEX_NAME,
      });

      if (!indexExists.body) {
        await this.client.indices.create({
          index: this.INDEX_NAME,
          body: {
            settings: {
              analysis: {
                analyzer: {
                  autocomplete: {
                    tokenizer: 'autocomplete',
                    filter: ['lowercase'],
                  },
                  autocomplete_search: {
                    tokenizer: 'lowercase',
                  },
                },
                tokenizer: {
                  autocomplete: {
                    type: 'edge_ngram',
                    min_gram: 2,
                    max_gram: 10,
                    token_chars: ['letter', 'digit'],
                  },
                },
              },
            },
            mappings: {
              properties: {
                assetId: { type: 'keyword' },
                assetName: {
                  type: 'text',
                  analyzer: 'autocomplete',
                  search_analyzer: 'autocomplete_search',
                },
                description: { type: 'text' },
                acquisitionCost: { type: 'double' },
                acquisitionDate: { type: 'date' },
                usefulLife: { type: 'integer' },
                depreciationMethod: { type: 'keyword' },
                currentBookValue: { type: 'double' },
                location: { type: 'keyword' },
                department: { type: 'keyword' },
                tags: { type: 'keyword' },
                lastUpdated: { type: 'date' },
              },
            },
          },
        });

        logger.info(`Created Elasticsearch index: ${this.INDEX_NAME}`);
      }
    } catch (err) {
      logger.error('Failed to initialize Elasticsearch index:', err);
      throw new Error('Elasticsearch initialization failed');
    }
  }

  /**
   * Index a document
   */
  async indexDocument(document: any): Promise<void> {
    try {
      await this.client.index({
        index: this.INDEX_NAME,
        id: document.assetId,
        body: document,
        refresh: true,
      });

      logger.info(`Indexed document for asset ${document.assetId}`);
    } catch (err) {
      logger.error(`Failed to index document for asset ${document.assetId}:`, err);
      throw new Error('Document indexing failed');
    }
  }

  /**
   * Bulk index documents
   */
  async bulkIndex(documents: any[]): Promise<void> {
    if (documents.length === 0) return;

    try {
      const body = documents.flatMap((doc) => [
        { index: { _index: this.INDEX_NAME, _id: doc.assetId } },
        doc,
      ]);

      await this.client.bulk({
        body,
        refresh: true,
      });

      logger.info(`Bulk indexed ${documents.length} documents`);
    } catch (err) {
      logger.error('Bulk indexing failed:', err);
      throw new Error('Bulk indexing failed');
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(assetId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.INDEX_NAME,
        id: assetId,
      });

      logger.info(`Deleted document for asset ${assetId}`);
    } catch (err) {
      logger.error(`Failed to delete document for asset ${assetId}:`, err);
      throw new Error('Document deletion failed');
    }
  }

  /**
   * Get the underlying client
   */
  getClient(): Client {
    return this.client;
  }
}

export const elasticClient = new ElasticSearchClient();
```

### **7.2 Index Configuration (40+ lines)**
```typescript
// src/search/index-config.ts
import { elasticClient } from './elasticsearch.client';
import { logger } from '../utils/logger';

class IndexConfigurator {
  private readonly INDEX_NAME = 'asset_depreciation';

  /**
   * Update index mappings
   */
  async updateMappings(): Promise<void> {
    try {
      await elasticClient.getClient().indices.putMapping({
        index: this.INDEX_NAME,
        body: {
          properties: {
            assetId: { type: 'keyword' },
            assetName: {
              type: 'text',
              analyzer: 'autocomplete',
              search_analyzer: 'autocomplete_search',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            description: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword', ignore_above: 256 },
              },
            },
            acquisitionCost: { type: 'double' },
            acquisitionDate: { type: 'date' },
            usefulLife: { type: 'integer' },
            depreciationMethod: {
              type: 'keyword',
              fields: {
                text: { type: 'text' },
              },
            },
            currentBookValue: { type: 'double' },
            location: {
              type: 'keyword',
              fields: {
                text: { type: 'text' },
              },
            },
            department: {
              type: 'keyword',
              fields: {
                text: { type: 'text' },
              },
            },
            tags: {
              type: 'keyword',
              fields: {
                text: { type: 'text' },
              },
            },
            lastUpdated: { type: 'date' },
            // New fields
            status: { type: 'keyword' },
            responsiblePerson: {
              type: 'keyword',
              fields: {
                text: { type: 'text' },
              },
            },
          },
        },
      });

      logger.info('Updated Elasticsearch index mappings');
    } catch (err) {
      logger.error('Failed to update index mappings:', err);
      throw new Error('Mapping update failed');
    }
  }

  /**
   * Create index aliases
   */
  async createAliases(): Promise<void> {
    try {
      const client = elasticClient.getClient();

      // Check if alias exists
      const aliasExists = await client.indices.existsAlias({
        name: `${this.INDEX_NAME}_read`,
      });

      if (!aliasExists.body) {
        await client.indices.putAlias({
          index: this.INDEX_NAME,
          name: `${this.INDEX_NAME}_read`,
        });

        await client.indices.putAlias({
          index: this.INDEX_NAME,
          name: `${this.INDEX_NAME}_write`,
        });

        logger.info('Created Elasticsearch index aliases');
      }
    } catch (err) {
      logger.error('Failed to create index aliases:', err);
      throw new Error('Alias creation failed');
    }
  }

  /**
   * Configure index settings
   */
  async configureSettings(): Promise<void> {
    try {
      await elasticClient.getClient().indices.putSettings({
        index: this.INDEX_NAME,
        body: {
          settings: {
            'index.number_of_shards': 3,
            'index.number_of_replicas': 1,
            'index.refresh_interval': '30s',
            'index.max_result_window': 100000,
            analysis: {
              analyzer: {
                autocomplete: {
                  tokenizer: 'autocomplete',
                  filter: ['lowercase', 'asciifolding'],
                },
                autocomplete_search: {
                  tokenizer: 'lowercase',
                  filter: ['asciifolding'],
                },
              },
              tokenizer: {
                autocomplete: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 15,
                  token_chars: ['letter', 'digit', 'whitespace'],
                },
              },
            },
          },
        },
      });

      logger.info('Configured Elasticsearch index settings');
    } catch (err) {
      logger.error('Failed to configure index settings:', err);
      throw new Error('Settings configuration failed');
    }
  }

  /**
   * Reindex data with new mappings
   */
  async reindex(): Promise<void> {
    try {
      const client = elasticClient.getClient();

      // Create new index with updated mappings
      const newIndexName = `${this.INDEX_NAME}_v2`;
      await client.indices.create({
        index: newIndexName,
        body: {
          settings: {
            analysis: {
              analyzer: {
                autocomplete: {
                  tokenizer: 'autocomplete',
                  filter: ['lowercase', 'asciifolding'],
                },
                autocomplete_search: {
                  tokenizer: 'lowercase',
                  filter: ['asciifolding'],
                },
              },
              tokenizer: {
                autocomplete: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 15,
                  token_chars: ['letter', 'digit', 'whitespace'],
                },
              },
            },
          },
          mappings: {
            properties: {
              // Include all current mappings
              assetId: { type: 'keyword' },
              assetName: {
                type: 'text',
                analyzer: 'autocomplete',
                search_analyzer: 'autocomplete_search',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              // ... other fields
            },
          },
        },
      });

      // Reindex data
      await client.reindex({
        body: {
          source: { index: this.INDEX_NAME },
          dest: { index: newIndexName },
        },
      });

      // Swap aliases
      await client.indices.updateAliases({
        body: {
          actions: [
            { remove: { index: this.INDEX_NAME, alias: `${this.INDEX_NAME}_read` } },
            { remove: { index: this.INDEX_NAME, alias: `${this.INDEX_NAME}_write` } },
            { add: { index: newIndexName, alias: `${this.INDEX_NAME}_read` } },
            { add: { index: newIndexName, alias: `${this.INDEX_NAME}_write` } },
          ],
        },
      });

      // Delete old index
      await client.indices.delete({ index: this.INDEX_NAME });

      logger.info('Reindexing completed successfully');
    } catch (err) {
      logger.error('Reindexing failed:', err);
      throw new Error('Reindexing failed');
    }
  }
}

export const indexConfigurator = new IndexConfigurator();
```

### **7.3 Advanced Query Builder (60+ lines)**
```typescript
// src/search/query-builder.ts
import { elasticClient } from './elasticsearch.client';
import { logger } from '../utils/logger';

class AdvancedQueryBuilder {
  private readonly INDEX_NAME = 'asset_depreciation';

  /**
   * Build a simple search query
   */
  buildSimpleQuery(query: string, fields: string[] = ['assetName', 'description']): any {
    return {
      query: {
        multi_match: {
          query,
          fields,
          type: 'best_fields',
          operator: 'and',
          fuzziness: 'AUTO',
        },
      },
      highlight: {
        fields: {
          assetName: {},
          description: {},
        },
      },
    };
  }

  /**
   * Build a boolean query with filters
   */
  buildBooleanQuery(
    query: string,
    filters: Record<string, any> = {},
    fields: string[] = ['assetName', 'description']
  ): any {
    const mustClauses: any[] = [];
    const filterClauses: any[] = [];

    // Add search query if provided
    if (query) {
      mustClauses.push({
        multi_match: {
          query,
          fields,
          type: 'best_fields',
          operator: 'and',
          fuzziness: 'AUTO',
        },
      });
    }

    // Add filters
    for (const [field, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          filterClauses.push({
            terms: { [field]: value },
          });
        }
      } else if (value !== undefined && value !== null && value !== '') {
        if (field === 'acquisitionCost' || field === 'currentBookValue') {
          // Range filter for numeric fields
          if (value.min !== undefined || value.max !== undefined) {
            const range: any = {};
            if (value.min !== undefined) range.gte = value.min;
            if (value.max !== undefined) range.lte = value.max;
            filterClauses.push({ range: { [field]: range } });
          }
        } else if (field === 'acquisitionDate') {
          // Date range filter
          if (value.from || value.to) {
            const range: any = {};
            if (value.from) range.gte = value.from;
            if (value.to) range.lte = value.to;
            filterClauses.push({ range: { [field]: range } });
          }
        } else {
          // Term filter
          filterClauses.push({
            term: { [field]: value },
          });
        }
      }
    }

    return {
      query: {
        bool: {
          must: mustClauses,
          filter: filterClauses,
        },
      },
      highlight: {
        fields: {
          assetName: {},
          description: {},
        },
      },
    };
  }

  /**
   * Build an aggregation query
   */
  buildAggregationQuery(
    query: string,
    aggregations: Record<string, any>,
    filters: Record<string, any> = {},
    fields: string[] = ['assetName', 'description']
  ): any {
    const baseQuery = this.buildBooleanQuery(query, filters, fields);

    return {
      ...baseQuery,
      aggs: aggregations,
    };
  }

  /**
   * Build a suggestion query
   */
  buildSuggestionQuery(query: string, field: string = 'assetName'): any {
    return {
      suggest: {
        [field + '_suggest']: {
          prefix: query,
          completion: {
            field,
            size: 10,
            fuzzy: {
              fuzziness: 'AUTO',
            },
          },
        },
      },
    };
  }

  /**
   * Execute a search query
   */
  async executeQuery(query: any, from: number = 0, size: number = 20): Promise<any> {
    try {
      const result = await elasticClient.getClient().search({
        index: this.INDEX_NAME,
        body: {
          ...query,
          from,
          size,
          track_total_hits: true,
        },
      });

      return {
        total: result.body.hits.total.value,
        hits: result.body.hits.hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          source: hit._source,
          highlight: hit.highlight,
        })),
        aggregations: result.body.aggregations,
        suggestions: result.body.suggest,
      };
    } catch (err) {
      logger.error('Search query failed:', err);
      throw new Error('Search execution failed');
    }
  }

  /**
   * Execute a suggestion query
   */
  async executeSuggestionQuery(query: string, field: string = 'assetName'): Promise<any[]> {
    try {
      const result = await elasticClient.getClient().search({
        index: this.INDEX_NAME,
        body: this.buildSuggestionQuery(query, field),
      });

      if (result.body.suggest && result.body.suggest[field + '_suggest']) {
        return result.body.suggest[field + '_suggest'][0].options.map(
          (option: any) => option.text
        );
      }

      return [];
    } catch (err) {
      logger.error('Suggestion query failed:', err);
      throw new Error('Suggestion execution failed');
    }
  }
}

export const queryBuilder = new AdvancedQueryBuilder();
```

### **7.4 Faceted Search Implementation (40+ lines)**
```typescript
// src/search/faceted-search.ts
import { queryBuilder } from './query-builder';
import { logger } from '../utils/logger';

class FacetedSearchManager {
  private currentQuery = '';
  private currentFilters: Record<string, any> = {};
  private currentAggregations: Record<string, any> = {};

  /**
   * Initialize faceted search with default aggregations
   */
  initialize(): void {
    this.currentAggregations = {
      depreciationMethod: { terms: { field: 'depreciationMethod', size: 10 } },
      location: { terms: { field: 'location', size: 20 } },
      department: { terms: { field: 'department', size: 20 } },
      status: { terms: { field: 'status', size: 10 } },
      acquisitionCost: {
        range: {
          field: 'acquisitionCost',
          ranges: [
            { to: 1000 },
            { from: 1000, to: 5000 },
            { from: 5000, to: 10000 },
            { from: 10000 },
          ],
        },
      },
      usefulLife: {
        range: {
          field: 'usefulLife',
          ranges: [
            { to: 3 },
            { from: 3, to: 5 },
            { from: 5, to: 10 },
            { from: 10 },
          ],
        },
      },
    };
  }

  /**
   * Update search query
   */
  updateQuery(query: string): void {
    this.currentQuery = query;
  }

  /**
   * Add or update a filter
   */
  updateFilter(field: string, value: any): void {
    if (value === undefined || value === null || value === '') {
      delete this.currentFilters[field];
    } else {
      this.currentFilters[field] = value;
    }
  }

  /**
   * Remove a filter
   */
  removeFilter(field: string): void {
    delete this.currentFilters[field];
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.currentFilters = {};
  }

  /**
   * Execute faceted search
   */
  async executeSearch(from: number = 0, size: number = 20): Promise<any> {
    try {
      const query = queryBuilder.buildAggregationQuery(
        this.currentQuery,
        this.currentAggregations,
        this.currentFilters
      );

      const result = await queryBuilder.executeQuery(query, from, size);

      // Process aggregations into facets
      const facets: Record<string, any> = {};
      for (const [field, agg] of Object.entries(this.currentAggregations)) {
        if (result.aggregations[field]) {
          if (agg.range) {
            facets[field] = result.aggregations[field].buckets.map((bucket: any) => ({
              key: `${bucket.from || ''}-${bucket.to || ''}`,
              from: bucket.from,
              to: bucket.to,
              count: bucket.doc_count,
              selected: this.isRangeSelected(field, bucket.from, bucket.to),
            }));
          } else {
            facets[field] = result.aggregations[field].buckets.map((bucket: any) => ({
              key: bucket.key,
              count: bucket.doc_count,
              selected: this.isTermSelected(field, bucket.key),
            }));
          }
        }
      }

      return {
        total: result.total,
        hits: result.hits,
        facets,
      };
    } catch (err) {
      logger.error('Faceted search failed:', err);
      throw new Error('Faceted search execution failed');
    }
  }

  private isTermSelected(field: string, value: any): boolean {
    if (!this.currentFilters[field]) return false;
    if (Array.isArray(this.currentFilters[field])) {
      return this.currentFilters[field].includes(value);
    }
    return this.currentFilters[field] === value;
  }

  private isRangeSelected(field: string, from: number, to: number): boolean {
    if (!this.currentFilters[field]) return false;

    const filter = this.currentFilters[field];
    if (filter.min !== undefined && filter.max !== undefined) {
      return filter.min === from && filter.max === to;
    } else if (filter.min !== undefined) {
      return filter.min === from;
    } else if (filter.max !== undefined) {
      return filter.max === to;
    }

    return false;
  }

  /**
   * Get current search state
   */
  getState(): any {
    return {
      query: this.currentQuery,
      filters: this.currentFilters,
    };
  }

  /**
   * Restore search state
   */
  restoreState(state: any): void {
    this.currentQuery = state.query || '';
    this.currentFilters = state.filters || {};
  }
}

export const facetedSearchManager = new FacetedSearchManager();
```

---

## **Third-Party Integrations (250+ lines minimum)**

### **8.1 Salesforce Integration (50+ lines)**
```typescript
// src/integrations/salesforce.integration.ts
import jsforce from 'jsforce';
import { logger } from '../utils/logger';

class SalesforceIntegration {
  private conn: jsforce.Connection;
  private isConnected = false;

  constructor() {
    this.conn = new jsforce.Connection({
      loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
      maxRequest: 100,
      callOptions: {
        client: 'AssetDepreciation/2.0',
      },
    });
  }

  /**
   * Authenticate with Salesforce
   */
  async authenticate(): Promise<void> {
    try {
      await this.conn.login(
        process.env.SALESFORCE_USERNAME!,
        process.env.SALESFORCE_PASSWORD! + process.env.SALESFORCE_SECURITY_TOKEN!
      );

      this.isConnected = true;
      logger.info('Authenticated with Salesforce');
    } catch (err) {
      logger.error('Salesforce authentication failed:', err);
      throw new Error('Salesforce authentication failed');
    }
  }

  /**
   * Get asset data from Salesforce
   */
  async getAsset(assetId: string): Promise<any> {
    if (!this.isConnected) await this.authenticate();

    try {
      const result = await this.conn.sobject('Asset').retrieve(assetId);
      logger.info(`Retrieved asset ${assetId} from Salesforce`);
      return this.mapSalesforceAsset(result);
    } catch (err) {
      logger.error(`Failed to retrieve asset ${assetId} from Salesforce:`, err);
      throw new Error('Salesforce asset retrieval failed');
    }
  }

  /**
   * Get multiple assets from Salesforce
   */
  async getAssets(assetIds: string[]): Promise<any[]> {
    if (!this.isConnected) await this.authenticate();

    try {
      const result = await this.conn.sobject('Asset').retrieve(assetIds);
      logger.info(`Retrieved ${assetIds.length} assets from Salesforce`);

      if (Array.isArray(result)) {
        return result.map((asset) => this.mapSalesforceAsset(asset));
      } else {
        return [this.mapSalesforceAsset(result)];
      }
    } catch (err) {
      logger.error('Failed to retrieve assets from Salesforce:', err);
      throw new Error('Salesforce assets retrieval failed');
    }
  }

  /**
   * Create an asset in Salesforce
   */
  async createAsset(assetData: any): Promise<string> {
    if (!this.isConnected) await this.authenticate();

    try {
      const salesforceAsset = this.mapToSalesforceAsset(assetData);
      const result = await this.conn.sobject('Asset').create(salesforceAsset);
      logger.info(`Created asset in Salesforce with ID: ${result.id}`);
      return result.id;
    } catch (err) {
      logger.error('Failed to create asset in Salesforce:', err);
      throw new Error('Salesforce asset creation failed');
    }
  }

  /**
   * Update an asset in Salesforce
   */
  async updateAsset(assetId: string, assetData: any): Promise<void> {
    if (!this.isConnected) await this.authenticate();

    try {
      const salesforceAsset = this.mapToSalesforceAsset(assetData);
      await this.conn.sobject('Asset').update({
        Id: assetId,
        ...salesforceAsset,
      });
      logger.info(`Updated asset ${assetId} in Salesforce`);
    } catch (err) {
      logger.error(`Failed to update asset ${assetId} in Salesforce:`, err);
      throw new Error('Salesforce asset update failed');
    }
  }

  /**
   * Map Salesforce asset to our format
   */
  private mapSalesforceAsset(sfAsset: any): any {
    return {
      id: sfAsset.Id,
      name: sfAsset.Name,
      description: sfAsset.Description,
      acquisitionDate: sfAsset.PurchaseDate,
      acquisitionCost: sfAsset.OriginalCost,
      usefulLife: sfAsset.UsableLife,
      depreciationMethod: sfAsset.DepreciationMethod__c,
      currentBookValue: sfAsset.BookValue__c,
      status: sfAsset.Status,
      location: sfAsset.InstallLocation__c,
      department: sfAsset.Department__c,
      responsiblePerson: sfAsset.ContactId,
      lastUpdated: sfAsset.LastModifiedDate,
    };
  }

  /**
   * Map our asset format to Salesforce
   */
  private mapToSalesforceAsset(asset: any): any {
    return {
      Name: asset.name,
      Description: asset.description,
      PurchaseDate: asset.acquisitionDate,
      OriginalCost: asset.acquisitionCost,
      UsableLife: asset.usefulLife,
      DepreciationMethod__c: asset.depreciationMethod,
      BookValue__c: asset.currentBookValue,
      Status: asset.status,
      InstallLocation__c: asset.location,
      Department__c: asset.department,
      ContactId: asset.responsiblePerson,
    };
  }

  /**
   * Subscribe to Salesforce asset changes
   */
  async subscribeToAssetChanges(callback: (asset: any) => void): Promise<void> {
    if (!this.isConnected) await this.authenticate();

    try {
      const channel = '/topic/AssetUpdates';
      const subscription = this.conn.streaming.topic(channel).subscribe((message) => {
        const asset = this.mapSalesforceAsset(message.sobject);
        callback(asset);
      });

      logger.info(`Subscribed to Salesforce asset changes on channel ${channel}`);
      return subscription;
    } catch (err) {
      logger.error('Failed to subscribe to Salesforce changes:', err);
      throw new Error('Salesforce subscription failed');
    }
  }
}

export const salesforceIntegration = new SalesforceIntegration();
```

### **8.2 Stripe Payment Processing (50+ lines)**
```typescript
// src/integrations/stripe.integration.ts
import Stripe from 'stripe';
import { logger } from '../utils/logger';

class StripeIntegration {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-08-16',
      maxNetworkRetries: 3,
      timeout: 30000,
    });
  }

  /**
   * Create a payment intent for asset purchase
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata: Record<string, string> = {}
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        metadata: {
          ...metadata,
          integration: 'asset-depreciation',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Created payment intent ${paymentIntent.id} for amount ${amount}`);
      return paymentIntent;
    } catch (err) {
      logger.error('Failed to create payment intent:', err);
      throw new Error('Payment intent creation failed');
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      logger.info(`Confirmed payment intent ${paymentIntentId}`);
      return paymentIntent;
    } catch (err) {
      logger.error(`Failed to confirm payment intent ${paymentIntentId}:`, err);
      throw new Error('Payment confirmation failed');
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(
    email: string,
    name: string,
    metadata: Record<string, string> = {}
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          ...metadata,
          integration: 'asset-depreciation',
        },
      });

      logger.info(`Created Stripe customer ${customer.id}`);
      return customer;
    } catch (err) {
      logger.error('Failed to create Stripe customer:', err);
      throw new Error('Customer creation failed');
    }
  }

  /**
   * Create a subscription for recurring payments
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata: Record<string, string> = {}
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          ...metadata,
          integration: 'asset-depreciation',
        },
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      logger.info(`Created subscription ${subscription.id} for customer ${customerId}`);
      return subscription;
    } catch (err) {
      logger.error(`Failed to create subscription for customer ${customerId}:`, err);
      throw new Error('Subscription creation failed');
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(signature: string, payload: Buffer): Promise<Stripe.Event> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      logger.info(`Received Stripe webhook event: ${event.type}`);
      return event;
    } catch (err) {
      logger.error('Stripe webhook verification failed:', err);
      throw new Error('Webhook verification failed');
    }
  }

  /**
   * Get payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.customers.listPaymentMethods(customerId, {
        type: 'card',
      });

      logger.info(`Retrieved ${paymentMethods.data.length} payment methods for customer ${customerId}`);
      return paymentMethods.data;
    } catch (err) {
      logger.error(`Failed to get payment methods for customer ${customerId}:`, err);
      throw new Error('Payment methods retrieval failed');
    }
  }
}

export const stripeIntegration = new StripeIntegration();
```

### **8.3 SendGrid Email Service (40+ lines)**
```typescript
// src/integrations/sendgrid.integration.ts
import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

class SendGridIntegration {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  /**
   * Send an email
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string,
    from: string = process.env.SENDGRID_FROM_EMAIL!,
    attachments?: any[]
  ): Promise<void> {
    try {
      const msg: sgMail.MailDataRequired = {
        to,
        from,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Fallback to stripped HTML
        attachments,
      };

      await sgMail.send(msg);
      logger.info(`Email sent to ${Array.isArray(to) ? to.join(', ') : to}`);
    } catch (err) {
      logger.error('Failed to send email:', err);
      throw new Error('Email sending failed');
    }
  }

  /**
   * Send a template email
   */
  async sendTemplateEmail(
    to: string | string[],
    templateId: string,
    dynamicTemplateData: any,
    from: string = process.env.SENDGRID_FROM_EMAIL!
  ): Promise<void> {
    try {
      const msg: sgMail.MailDataRequired = {
        to,
        from,
        templateId,
        dynamicTemplateData,
      };

      await sgMail.send(msg);
      logger.info(`Template email ${templateId} sent to ${Array.isArray(to) ? to.join(', ') : to}`);
    } catch (err) {
      logger.error(`Failed to send template email ${templateId}:`, err);
      throw new Error('Template email sending failed');
    }
  }

  /**
   * Send a bulk email
   */
  async sendBulkEmail(
    personalizations: sgMail.PersonalizationData[],
    subject: string,
    html: string,
    text?: string,
    from: string = process.env.SENDGRID_FROM_EMAIL!
  ): Promise<void> {
    try {
      const msg: sgMail.MailDataRequired = {
        from,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        personalizations,
      };

      await sgMail.send(msg);
      logger.info(`Bulk email sent to ${personalizations.length} recipients`);
    } catch (err) {
      logger.error('Failed to send bulk email:', err);
      throw new Error('Bulk email sending failed');
    }
  }

  /**
   * Send a depreciation report email
   */
  async sendDepreciationReport(
    to: string | string[],
    reportData: any,
    reportUrl?: string
  ): Promise<void> {
    try {
      const templateId = process.env.SENDGRID_DEPRECIATION_REPORT_TEMPLATE_ID!;
      const dynamicTemplateData = {
        reportDate: new Date().toLocaleDateString(),
        assetCount: reportData.assetCount,
        totalBookValue: reportData.totalBookValue.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        }),
        totalDepreciation: reportData.totalDepreciation.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        }),
        reportUrl,
      };

      await this.sendTemplateEmail(to, templateId, dynamicTemplateData);
    } catch (err) {
      logger.error('Failed to send depreciation report:', err);
      throw new Error('Depreciation report sending failed');
    }
  }
}

export const sendGridIntegration = new SendGridIntegration();
```

### **8.4 Twilio SMS Notifications (40+ lines)**
```typescript
// src/integrations/twilio.integration.ts
import twilio from 'twilio';
import { logger } from '../utils/logger';

class TwilioIntegration {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }

  /**
   * Send an SMS message
   */
  async sendSms(
    to: string,
    body: string,
    from: string = process.env.TWILIO_PHONE_NUMBER!
  ): Promise<void> {
    try {
      const message = await this.client.messages.create({
        body,
        to,
        from,
      });

      logger.info(`SMS sent to ${to} with SID ${message.sid}`);
    } catch (err) {
      logger.error(`Failed to send SMS to ${to}:`, err);
      throw new Error('SMS sending failed');
    }
  }

  /**
   * Send a bulk SMS to multiple recipients
   */
  async sendBulkSms(
    recipients: string[],
    body: string,
    from: string = process.env.TWILIO_PHONE_NUMBER!
  ): Promise<void> {
    try {
      const promises = recipients.map((to) =>
        this.client.messages.create({
          body,
          to,
          from,
        })
      );

      await Promise.all(promises);
      logger.info(`Bulk SMS sent to ${recipients.length} recipients`);
    } catch (err) {
      logger.error('Failed to send bulk SMS:', err);
      throw new Error('Bulk SMS sending failed');
    }
  }

  /**
   * Send a verification code via SMS
   */
  async sendVerificationCode(
    to: string,
    code: string,
    from: string = process.env.TWILIO_PHONE_NUMBER!
  ): Promise<void> {
    try {
      const body = `Your verification code is: ${code}. It expires in 5 minutes.`;
      await this.sendSms(to, body, from);
    } catch (err) {
      logger.error(`Failed to send verification code to ${to}:`, err);
      throw new Error('Verification code sending failed');
    }
  }

  /**
   * Send a depreciation alert SMS
   */
  async sendDepreciationAlert(
    to: string,
    assetName: string,
    currentValue: number,
    threshold: number
  ): Promise<void> {
    try {
      const body = `ALERT: Asset "${assetName}" has reached its depreciation threshold. Current value: ${currentValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}. Threshold: ${threshold.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.`;
      await this.sendSms(to, body);
    } catch (err) {
      logger.error(`Failed to send depreciation alert to ${to}:`, err);
      throw new Error('Depreciation alert sending failed');
    }
  }

  /**
   * Make a voice call
   */
  async makeVoiceCall(
    to: string,
    message: string,
    from: string = process.env.TWILIO_PHONE_NUMBER!
  ): Promise<void> {
    try {
      await this.client.calls.create({
        url: `http://demo.twilio.com/docs/voice.xml?Message=${encodeURIComponent(message)}`,
        to,
        from,
      });

      logger.info(`Voice call initiated to ${to}`);
    } catch (err) {
      logger.error(`Failed to make voice call to ${to}:`, err);
      throw new Error('Voice call failed');
    }
  }
}

export const twilioIntegration = new TwilioIntegration();
```

### **8.5 Google Analytics 4 (40+ lines)**
```typescript
// src/integrations/ga4.integration.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { logger } from '../utils/logger';

class GoogleAnalytics4Integration {
  private client: BetaAnalyticsDataClient;

  constructor() {
    this.client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GA4_CLIENT_EMAIL!,
        private_key: process.env.GA4_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      },
    });
  }

  /**
   * Track a custom event
   */
  async trackEvent(
    eventName: string,
    params: Record<string, any>,
    clientId: string
  ): Promise<void> {
    try {
      // In a real implementation, this would send to GA4 via Measurement Protocol
      // This is a simplified example
      logger.info(`Tracking event ${eventName} with params:`, params);

      // Example of what the actual API call might look like:
      /*
      await this.client.runReport({
        property: `properties/${process.env.GA4_PROPERTY_ID}`,
        requests: [
          {
            event: {
              name: eventName,
              params: {
                ...params,
                client_id: clientId,
                timestamp_micros: Date.now() * 1000,
              },
            },
          },
        ],
      });
      */
    } catch (err) {
      logger.error(`Failed to track event ${eventName}:`, err);
      throw new Error('Event tracking failed');
    }
  }

  /**
   * Track a page view
   */
  async trackPageView(
    pagePath: string,
    pageTitle: string,
    clientId: string,
    userId?: string
  ): Promise<void> {
    try {
      const params: Record<string, any> = {
        page_path: pagePath,
        page_title: pageTitle,
        client_id: clientId,
      };

      if (userId) {
        params.user_id = userId;
      }

      await this.trackEvent('page_view', params, clientId);
    } catch (err) {
      logger.error(`Failed to track page view for ${pagePath}:`, err);
      throw new Error('Page view tracking failed');
    }
  }

  /**
   * Track a depreciation calculation
   */
  async trackDepreciationCalculation(
    assetId: string,
    method: string,
    clientId: string,
    userId?: string
  ): Promise<void> {
    try {
      const params = {
        asset_id: assetId,
        depreciation_method: method,
        event_category: 'depreciation',
        event_label: 'calculation',
      };

      if (userId) {
        params.user_id = userId;
      }

      await this.trackEvent('depreciation_calculation', params, clientId);
    } catch (err) {
      logger.error(`Failed to track depreciation calculation for asset ${assetId}:`, err);
      throw new Error('Depreciation calculation tracking failed');
    }
  }

  /**
   * Get report data from GA4
   */
  async getReport(
    dimensions: string[],
    metrics: string[],
    dateRanges: { startDate: string; endDate: string }[],
    dimensionFilter?: any
  ): Promise<any> {
    try {
      const [response] = await this.client.runReport({
        property: `properties/${process.env.GA4_PROPERTY_ID}`,
        requests: [
          {
            dimensions: dimensions.map((dim) => ({ name: dim })),
            metrics: metrics.map((met) => ({ name: met })),
            dateRanges,
            dimensionFilter,
          },
        ],
      });

      return response;
    } catch (err) {
      logger.error('Failed to get GA4 report:', err);
      throw new Error('GA4 report retrieval failed');
    }
  }

  /**
   * Track an error
   */
  async trackError(
    errorMessage: string,
    errorStack: string,
    clientId: string,
    userId?: string
  ): Promise<void> {
    try {
      const params = {
        error_message: errorMessage,
        error_stack: errorStack,
        event_category: 'error',
      };

      if (userId) {
        params.user_id = userId;
      }

      await this.trackEvent('exception', params, clientId);
    } catch (err) {
      logger.error('Failed to track error:', err);
      throw new Error('Error tracking failed');
    }
  }
}

export const ga4Integration = new GoogleAnalytics4Integration();
```

---

## **Gamification System (150+ lines minimum)**

### **9.1 Points Calculation Engine (40+ lines)**
```typescript
// src/gamification/points.engine.ts
import { logger } from '../utils/logger';
import { UserAchievement } from '../models/user-achievement.model';

class PointsEngine {
  private readonly POINTS_CONFIG = {
    actions: {
      login: 10,
      view_asset: 5,
      calculate_depreciation: 20,
      update_asset: 15,
      generate_report: 30,
      share_report: 25,
      early_compliance: 50,
      accurate_forecast: 40,
      cost_saving_suggestion: 35,
    },
    streaks: {
      daily_login: { days: 7, points: 100 },
      weekly_reports: { weeks: 4, points: 200 },
    },
    multipliers: {
      accuracy: {
        95: 1.2,
        98: 1.5,
        100: 2.0,
      },
    },
  };

  /**
   * Calculate points for an action
   */
  calculatePoints(action: string, metadata: any = {}): number {
    try {
      if (!this.POINTS_CONFIG.actions[action]) {
        logger.warn(`No points configured for action: ${action}`);
        return 0;
      }

      let points = this.POINTS_CONFIG.actions[action];

      // Apply multipliers based on metadata
      if (metadata.accuracy && this.POINTS_CONFIG.multipliers.accuracy[metadata.accuracy]) {
        points *= this.POINTS_CONFIG.multipliers.accuracy[metadata.accuracy];
      }

      if (metadata.streak && this.POINTS_CONFIG.streaks[metadata.streak]) {
        points += this.POINTS_CONFIG.streaks[metadata.streak].points;
      }

      return Math.round(points);
    } catch (err) {
      logger.error(`Failed to calculate points for action ${action}:`, err);
      return 0;
    }
  }

  /**
   * Calculate points for a streak
   */
  calculateStreakPoints(streakType: string, currentStreak: number): number {
    try {
      if (!this.POINTS_CONFIG.streaks[streakType]) {
        logger.warn(`No streak configuration for: ${streakType}`);
        return 0;
      }

      const config = this.POINTS_CONFIG.streaks[streakType];
      if (currentStreak >= config.days) {
        return config.points;
      }

      return 0;
    } catch (err) {
      logger.error(`Failed to calculate streak points for ${streakType}:`, err);
      return 0;
    }
  }

  /**
   * Calculate total points for a user
   */
  async calculateTotalPoints(userId: string, achievements: UserAchievement[]): Promise<number> {
    try {
      // In a real implementation, this would sum all points from the database
      const total = achievements.reduce((sum, achievement) => sum + achievement.points, 0);
      return total;
    } catch (err) {
      logger.error(`Failed to calculate total points for user ${userId}:`, err);
      throw new Error('Points calculation failed');
    }
  }

  /**
   * Get points configuration
   */
  getPointsConfig(): any {
    return this.POINTS_CONFIG;
  }
}

export const pointsEngine = new PointsEngine();
```

### **9.2 Badge/Achievement System (40+ lines)**
```typescript
// src/gamification/badge.system.ts
import { UserAchievement } from '../models/user-achievement.model';
import { logger } from '../utils/logger';

class BadgeSystem {
  private readonly BADGES = {
    first_calculation: {
      id: 'first_calculation',
      name: 'First Calculation',
      description: 'Complete your first depreciation calculation',
      points: 50,
      icon: 'calculator',
      condition: (achievements: UserAchievement[]) =>
        achievements.some((a) => a.action === 'calculate_depreciation'),
    },
    accuracy_master: {
      id: 'accuracy_master',
      name: 'Accuracy Master',
      description: 'Achieve 100% accuracy in depreciation forecasts for 5 consecutive assets',
      points: 200,
      icon: 'target',
      condition: (achievements: UserAchievement[]) => {
        const accurateCalculations = achievements.filter(
          (a) => a.action === 'calculate_depreciation' && a.metadata?.accuracy === 100
        );
        return accurateCalculations.length >= 5;
      },
    },
    early_bird: {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Submit compliance reports 3 days before deadline for 3 consecutive months',
      points: 150,
      icon: 'alarm',
      condition: (achievements: UserAchievement[]) => {
        const earlyCompliances = achievements.filter(
          (a) => a.action === 'early_compliance'
        );
        return earlyCompliances.length >= 3;
      },
    },
    report_master: {
      id: 'report_master',
      name: 'Report Master',
      description: 'Generate 10 different types of reports',
      points: 100,
      icon: 'file-text',
      condition: (achievements: UserAchievement[]) => {
        const reports = new Set(
          achievements
            .filter((a) => a.action === 'generate_report')
            .map((a) => a.metadata?.reportType)
        );
        return reports.size >= 10;
      },
    },
    cost_saver: {
      id: 'cost_saver',
      name: 'Cost Saver',
      description: 'Suggest cost-saving measures that are implemented',
      points: 300,
      icon: 'dollar-sign',
      condition: (achievements: UserAchievement[]) =>
        achievements.some((a) => a.action === 'cost_saving_suggestion' && a.metadata?.implemented),
    },
    weekly_streak: {
      id: 'weekly_streak',
      name: 'Weekly Warrior',
      description: 'Use the system every week for 4 consecutive weeks',
      points: 200,
      icon: 'calendar',
      condition: (achievements: UserAchievement[]) => {
        const logins = achievements.filter((a) => a.action === 'login');
        if (logins.length < 4) return false;

        // Check if there are 4 logins in 4 different weeks
        const weeks = new Set();
        for (const login of logins) {
          const week = this.getWeekNumber(new Date(login.timestamp));
          weeks.add(week);
          if (weeks.size >= 4) return true;
        }

        return false;
      },
    },
  };

  private getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Check for new badges based on user achievements
   */
  async checkForNewBadges(
    userId: string,
    achievements: UserAchievement[]
  ): Promise<UserAchievement[]> {
    try {
      const newBadges: UserAchievement[] = [];

      for (const [badgeId, badge] of Object.entries(this.BADGES)) {
        // Check if user already has this badge
        const hasBadge = achievements.some((a) => a.badgeId === badgeId);
        if (hasBadge) continue;

        // Check if condition is met
        if (badge.condition(achievements)) {
          newBadges.push({
            userId,
            badgeId,
            name: badge.name,
            description: badge.description,
            points: badge.points,
            icon: badge.icon,
            action: 'badge_earned',
            timestamp: new Date().toISOString(),
          });
        }
      }

      return newBadges;
    } catch (err) {
      logger.error(`Failed to check for new badges for user ${userId}:`, err);
      throw new Error('Badge checking failed');
    }
  }

  /**
   * Get all available badges
   */
  getAllBadges(): any {
    return this.BADGES;
  }

  /**
   * Get badge by ID
   */
  getBadge(badgeId: string): any {
    return this.BADGES[badgeId];
  }
}

export const badgeSystem = new BadgeSystem();
```

### **9.3 Leaderboard Implementation (40+ lines)**
```typescript
// src/gamification/leaderboard.ts
import { UserAchievement } from '../models/user-achievement.model';
import { logger } from '../utils/logger';

class Leaderboard {
  private readonly LEADERBOARD_SIZE = 20;
  private readonly TIME_RANGES = {
    daily: { label: 'Today', seconds: 86400 },
    weekly: { label: 'This Week', seconds: 604800 },
    monthly: { label: 'This Month', seconds: 2592000 },
    all_time: { label: 'All Time', seconds: Infinity },
  };

  /**
   * Get leaderboard for a specific time range
   */
  async getLeaderboard(
    timeRange: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time',
    limit: number = this.LEADERBOARD_SIZE
  ): Promise<any[]> {
    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() - this.TIME_RANGES[timeRange].seconds * 1000);

      // In a real implementation, this would query the database
      // This is a simplified example
      const allAchievements: UserAchievement[] = []; // Would come from DB

      const userPoints = new Map<string, number>();

      for (const achievement of allAchievements) {
        const achievementDate = new Date(achievement.timestamp);
        if (achievementDate < cutoff) continue;

        const userId = achievement.userId;
        const points = achievement.points;

        if (userPoints.has(userId)) {
          userPoints.set(userId, userPoints.get(userId)! + points);
        } else {
          userPoints.set(userId, points);
        }
      }

      // Convert to array and sort
      const leaderboard = Array.from(userPoints.entries())
        .map(([userId, points]) => ({
          userId,
          points,
          rank: 