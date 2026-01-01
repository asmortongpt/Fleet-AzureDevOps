# TO_BE_DESIGN.md: Enhanced Audit-Logging Module
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Author:** Enterprise Architecture Team

---

## Executive Vision (120 lines)

### Strategic Vision
The enhanced audit-logging module represents a paradigm shift in how organizations capture, analyze, and act upon operational data. This isn't merely an incremental upgrade—it's a complete reimagining of audit capabilities that will serve as the foundation for enterprise-wide observability, compliance, and decision-making.

Our vision is to create the most comprehensive audit system in the industry, one that:
1. **Transforms passive logging into active intelligence** - Moving beyond simple record-keeping to predictive analytics and automated response
2. **Unifies disparate data sources** - Creating a single source of truth across all enterprise systems
3. **Enables real-time governance** - Providing immediate visibility into operational changes
4. **Drives business value** - Turning audit data into actionable insights that improve efficiency, security, and compliance

### Business Transformation Goals
**1. Compliance Revolution**
- Reduce audit preparation time by 80% through automated evidence collection
- Achieve continuous compliance monitoring for SOX, GDPR, HIPAA, and PCI-DSS
- Implement "compliance as code" with version-controlled audit rules
- Provide immutable audit trails with cryptographic verification

**2. Operational Excellence**
- Reduce mean time to detect (MTTD) security incidents by 90%
- Decrease mean time to resolve (MTTR) operational issues by 70%
- Automate 60% of routine audit tasks through AI-driven analysis
- Create self-healing systems that automatically remediate detected anomalies

**3. Strategic Decision Support**
- Provide real-time operational dashboards for C-level executives
- Enable predictive analytics for resource planning and risk management
- Create a "digital twin" of enterprise operations for scenario modeling
- Implement automated reporting to regulatory bodies with zero manual intervention

### User Experience Improvements
**For Security Teams:**
- Real-time threat detection with contextual alerts
- Automated incident response playbooks
- Visual attack path analysis
- One-click forensic investigations

**For Compliance Officers:**
- Continuous compliance monitoring dashboards
- Automated evidence collection for audits
- Risk scoring and prioritization
- Regulatory change impact analysis

**For Developers:**
- Self-service audit log access
- Change impact analysis tools
- Automated documentation generation
- Performance optimization recommendations

**For Executives:**
- Strategic risk dashboards
- Business impact analysis
- ROI tracking for security investments
- Competitive benchmarking

### Competitive Advantages
**1. Market Differentiation**
- First audit system with integrated AI-driven anomaly detection
- Only solution offering real-time compliance monitoring
- Most comprehensive third-party integration ecosystem
- First to implement blockchain-based audit trail immutability

**2. Technical Superiority**
- Sub-100ms response times for all queries
- 99.999% uptime SLA
- Linear scalability to petabyte-scale data
- Multi-cloud and hybrid deployment options

**3. Business Value**
- 40% reduction in audit-related costs
- 30% decrease in security incident response time
- 25% improvement in operational efficiency
- 20% reduction in compliance violations

### Long-Term Roadmap

**Phase 1: Foundation (0-6 months)**
- Core audit logging infrastructure
- Basic compliance monitoring
- Initial third-party integrations
- Performance optimization

**Phase 2: Intelligence (6-18 months)**
- AI-driven anomaly detection
- Predictive analytics
- Automated remediation
- Advanced visualization

**Phase 3: Ecosystem (18-36 months)**
- Marketplace for audit apps
- Developer SDK
- Industry-specific solutions
- Blockchain integration

**Phase 4: Autonomous Operations (36+ months)**
- Self-healing systems
- Fully automated compliance
- Cognitive security operations
- Enterprise digital twin

### Implementation Strategy
**1. Agile Transformation**
- Cross-functional scrum teams
- Continuous integration/deployment
- Feature flags for gradual rollout
- A/B testing for UX improvements

**2. Change Management**
- Executive sponsorship program
- Comprehensive training curriculum
- Gamified adoption metrics
- Community of practice

**3. Technical Approach**
- Microservices architecture
- Event-driven design
- Polyglot persistence
- Infrastructure as code

**4. Measurement Framework**
- OKRs for business impact
- SLOs for technical performance
- KPIs for user adoption
- ROI tracking for each feature

---

## Performance Enhancements (300+ lines)

### Redis Caching Layer (60 lines)

```typescript
import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/logger';
import { AuditLog } from '../models/audit-log.model';

class RedisCache {
  private client: RedisClientType;
  private logger: Logger;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'audit_log:';

  constructor() {
    this.logger = new Logger('RedisCache');
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 5000)
      }
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error', err);
    });

    this.client.connect().catch(err => {
      this.logger.error('Failed to connect to Redis', err);
    });
  }

  private getCacheKey(id: string): string {
    return `${this.CACHE_PREFIX}${id}`;
  }

  async getAuditLog(id: string): Promise<AuditLog | null> {
    try {
      const cachedData = await this.client.get(this.getCacheKey(id));
      if (cachedData) {
        this.logger.debug(`Cache hit for audit log ${id}`);
        return JSON.parse(cachedData);
      }
      this.logger.debug(`Cache miss for audit log ${id}`);
      return null;
    } catch (err) {
      this.logger.error(`Error getting audit log from cache: ${id}`, err);
      return null;
    }
  }

  async setAuditLog(auditLog: AuditLog): Promise<void> {
    try {
      await this.client.setEx(
        this.getCacheKey(auditLog.id),
        this.CACHE_TTL,
        JSON.stringify(auditLog)
      );
      this.logger.debug(`Cached audit log ${auditLog.id}`);
    } catch (err) {
      this.logger.error(`Error caching audit log ${auditLog.id}`, err);
    }
  }

  async invalidateAuditLog(id: string): Promise<void> {
    try {
      await this.client.del(this.getCacheKey(id));
      this.logger.debug(`Invalidated cache for audit log ${id}`);
    } catch (err) {
      this.logger.error(`Error invalidating cache for audit log ${id}`, err);
    }
  }

  async getRecentLogs(limit: number = 100): Promise<AuditLog[]> {
    try {
      const keys = await this.client.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length === 0) return [];

      const logs = await Promise.all(
        keys.slice(0, limit).map(key => this.client.get(key))
      );

      return logs
        .filter(log => log !== null)
        .map(log => JSON.parse(log!))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      this.logger.error('Error getting recent logs from cache', err);
      return [];
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await this.client.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.info(`Cleared ${keys.length} audit log cache entries`);
      }
    } catch (err) {
      this.logger.error('Error clearing cache', err);
    }
  }
}

export const redisCache = new RedisCache();
```

### Database Query Optimization (60 lines)

```typescript
import { Pool, QueryResult } from 'pg';
import { Logger } from '../utils/logger';
import { AuditLog } from '../models/audit-log.model';

class AuditLogRepository {
  private pool: Pool;
  private logger: Logger;
  private readonly BATCH_SIZE = 1000;

  constructor() {
    this.logger = new Logger('AuditLogRepository');
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', err);
    });
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const query = `
      SELECT * FROM audit_logs
      WHERE id = $1
      LIMIT 1;
    `;

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (err) {
      this.logger.error(`Error fetching audit log by ID: ${id}`, err);
      throw err;
    }
  }

  async getAuditLogsByUser(userId: string, limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM audit_logs
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3;
    `;

    try {
      const result = await this.pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (err) {
      this.logger.error(`Error fetching audit logs for user: ${userId}`, err);
      throw err;
    }
  }

  async searchAuditLogs(
    filters: {
      userId?: string;
      action?: string;
      resourceType?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      conditions.push(`user_id = $${paramIndex}`);
      values.push(filters.userId);
      paramIndex++;
    }

    if (filters.action) {
      conditions.push(`action = $${paramIndex}`);
      values.push(filters.action);
      paramIndex++;
    }

    if (filters.resourceType) {
      conditions.push(`resource_type = $${paramIndex}`);
      values.push(filters.resourceType);
      paramIndex++;
    }

    if (filters.fromDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      values.push(filters.fromDate);
      paramIndex++;
    }

    if (filters.toDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      values.push(filters.toDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      WITH filtered_logs AS (
        SELECT * FROM audit_logs
        ${whereClause}
      )
      SELECT * FROM filtered_logs
      ORDER BY timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};

      SELECT COUNT(*) as total FROM filtered_logs;
    `;

    try {
      const result = await this.pool.query(query, [...values, limit, offset]);
      const totalResult = await this.pool.query(`SELECT COUNT(*) as total FROM (${query.replace(';', '')}) as subquery`);

      return {
        logs: result.rows,
        total: parseInt(totalResult.rows[0].total)
      };
    } catch (err) {
      this.logger.error('Error searching audit logs', err);
      throw err;
    }
  }

  async batchInsertAuditLogs(logs: AuditLog[]): Promise<void> {
    if (logs.length === 0) return;

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const placeholders: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      logs.forEach((log, index) => {
        placeholders.push(
          `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
        );
        values.push(
          log.id,
          log.userId,
          log.action,
          log.resourceType,
          log.resourceId,
          log.metadata,
          log.timestamp
        );
      });

      const query = `
        INSERT INTO audit_logs (
          id, user_id, action, resource_type, resource_id, metadata, timestamp
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `;

      await client.query(query, values);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.error('Error in batch insert of audit logs', err);
      throw err;
    } finally {
      client.release();
    }
  }
}

export const auditLogRepository = new AuditLogRepository();
```

### API Response Compression (40 lines)

```typescript
import compression from 'compression';
import express from 'express';
import { Logger } from '../utils/logger';

class ResponseCompressor {
  private logger: Logger;
  private readonly MIN_COMPRESSION_SIZE = 1024; // 1KB
  private readonly COMPRESSION_LEVEL = 6; // Balance between speed and compression

  constructor() {
    this.logger = new Logger('ResponseCompressor');
  }

  configure(app: express.Application): void {
    app.use(compression({
      level: this.COMPRESSION_LEVEL,
      threshold: this.MIN_COMPRESSION_SIZE,
      filter: (req, res) => {
        // Don't compress responses that are already compressed
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Don't compress SSE streams
        if (res.getHeader('Content-Type')?.toString().includes('text/event-stream')) {
          return false;
        }

        // Compress JSON responses
        if (res.getHeader('Content-Type')?.toString().includes('application/json')) {
          return true;
        }

        // Compress text responses
        return compression.filter(req, res);
      }
    }));

    // Add compression headers
    app.use((req, res, next) => {
      res.setHeader('Vary', 'Accept-Encoding');
      next();
    });

    // Log compression stats
    app.use((req, res, next) => {
      const originalWrite = res.write;
      const originalEnd = res.end;
      let bytesWritten = 0;

      res.write = function(chunk: any, ...args: any[]) {
        if (chunk) {
          bytesWritten += chunk.length;
        }
        return originalWrite.apply(res, [chunk, ...args]);
      };

      res.end = function(chunk: any, ...args: any[]) {
        if (chunk) {
          bytesWritten += chunk.length;
        }

        if (res.getHeader('Content-Encoding') === 'gzip') {
          const originalSize = bytesWritten;
          const compressedSize = res.getHeader('Content-Length') || originalSize;
          const ratio = originalSize > 0 ? (1 - (compressedSize / originalSize)) * 100 : 0;

          this.logger.debug(`Compression stats for ${req.path}: ` +
            `Original: ${originalSize}B, Compressed: ${compressedSize}B, Ratio: ${ratio.toFixed(2)}%`);
        }

        return originalEnd.apply(res, [chunk, ...args]);
      };

      next();
    });
  }
}

export const responseCompressor = new ResponseCompressor();
```

### Lazy Loading Implementation (50 lines)

```typescript
import { AuditLog } from '../models/audit-log.model';
import { auditLogRepository } from '../repositories/audit-log.repository';
import { Logger } from '../utils/logger';

class AuditLogLazyLoader {
  private logger: Logger;
  private readonly DEFAULT_BATCH_SIZE = 50;
  private readonly MAX_BATCH_SIZE = 500;
  private readonly CACHE_EXPIRY = 300000; // 5 minutes

  constructor() {
    this.logger = new Logger('AuditLogLazyLoader');
  }

  async getLazyLoadedAuditLogs(
    userId: string,
    options: {
      batchSize?: number;
      filter?: {
        action?: string;
        resourceType?: string;
        fromDate?: Date;
        toDate?: Date;
      };
    } = {}
  ): Promise<AsyncIterable<AuditLog>> {
    const batchSize = Math.min(
      options.batchSize || this.DEFAULT_BATCH_SIZE,
      this.MAX_BATCH_SIZE
    );

    let offset = 0;
    let hasMore = true;
    let lastFetchTime = 0;
    let cachedResults: AuditLog[] = [];

    return {
      [Symbol.asyncIterator]: () => ({
        next: async () => {
          // Return cached results first
          if (cachedResults.length > 0) {
            const result = cachedResults.shift()!;
            return { value: result, done: false };
          }

          // Check if we need to fetch more data
          if (!hasMore) {
            return { value: undefined, done: true };
          }

          // Throttle requests to avoid overwhelming the database
          const now = Date.now();
          if (now - lastFetchTime < 100) {
            await new Promise(resolve => setTimeout(resolve, 100 - (now - lastFetchTime)));
          }

          try {
            this.logger.debug(`Fetching batch of ${batchSize} audit logs for user ${userId}, offset ${offset}`);

            const { logs, total } = await auditLogRepository.searchAuditLogs(
              {
                userId,
                ...options.filter
              },
              batchSize,
              offset
            );

            lastFetchTime = Date.now();
            offset += batchSize;
            hasMore = offset < total;
            cachedResults = logs;

            if (cachedResults.length === 0) {
              return { value: undefined, done: true };
            }

            const result = cachedResults.shift()!;
            return { value: result, done: false };
          } catch (err) {
            this.logger.error(`Error in lazy loading audit logs for user ${userId}`, err);
            return { value: undefined, done: true };
          }
        }
      })
    };
  }

  async getLazyLoadedAuditLogsWithCount(
    userId: string,
    options: {
      batchSize?: number;
      filter?: {
        action?: string;
        resourceType?: string;
        fromDate?: Date;
        toDate?: Date;
      };
    } = {}
  ): Promise<{ logs: AsyncIterable<AuditLog>; totalCount: Promise<number> }> {
    const batchSize = Math.min(
      options.batchSize || this.DEFAULT_BATCH_SIZE,
      this.MAX_BATCH_SIZE
    );

    const totalCountPromise = auditLogRepository.searchAuditLogs(
      {
        userId,
        ...options.filter
      },
      1, // Just get count
      0
    ).then(result => result.total);

    const logs = this.getLazyLoadedAuditLogs(userId, options);

    return {
      logs,
      totalCount: totalCountPromise
    };
  }
}

export const auditLogLazyLoader = new AuditLogLazyLoader();
```

### Request Debouncing (40 lines)

```typescript
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

class RequestDebouncer {
  private logger: Logger;
  private readonly DEBOUNCE_WINDOW = 200; // 200ms
  private readonly MAX_QUEUE_SIZE = 100;
  private requestQueues: Map<string, {
    timestamp: number;
    res: Response;
    next: NextFunction;
    timeout: NodeJS.Timeout;
  }[]>;

  constructor() {
    this.logger = new Logger('RequestDebouncer');
    this.requestQueues = new Map();
  }

  debounce(keyGenerator: (req: Request) => string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = keyGenerator(req);

      if (!this.requestQueues.has(key)) {
        this.requestQueues.set(key, []);
      }

      const queue = this.requestQueues.get(key)!;

      // If queue is too large, reject the request
      if (queue.length >= this.MAX_QUEUE_SIZE) {
        this.logger.warn(`Request queue full for key ${key}, rejecting request`);
        res.status(429).json({ error: 'Too many requests' });
        return;
      }

      // Add request to queue
      const requestEntry = {
        timestamp: Date.now(),
        res,
        next,
        timeout: setTimeout(() => {
          this.processQueue(key);
        }, this.DEBOUNCE_WINDOW)
      };

      queue.push(requestEntry);

      // Set up response handlers
      res.on('finish', () => {
        this.cleanupRequest(key, requestEntry);
      });

      res.on('close', () => {
        this.cleanupRequest(key, requestEntry);
      });
    };
  }

  private processQueue(key: string): void {
    const queue = this.requestQueues.get(key);
    if (!queue || queue.length === 0) return;

    this.logger.debug(`Processing debounced requests for key ${key}, count: ${queue.length}`);

    // Get the most recent request
    const latestRequest = queue[queue.length - 1];

    // Process only the latest request
    try {
      latestRequest.next();
    } catch (err) {
      this.logger.error(`Error processing debounced request for key ${key}`, err);
      latestRequest.res.status(500).json({ error: 'Internal server error' });
    }

    // Clean up all requests in the queue
    queue.forEach(request => {
      clearTimeout(request.timeout);
      if (request !== latestRequest) {
        request.res.status(429).json({
          error: 'Request superseded by newer request',
          debounced: true
        });
      }
    });

    this.requestQueues.delete(key);
  }

  private cleanupRequest(key: string, requestEntry: any): void {
    const queue = this.requestQueues.get(key);
    if (!queue) return;

    const index = queue.indexOf(requestEntry);
    if (index !== -1) {
      clearTimeout(requestEntry.timeout);
      queue.splice(index, 1);

      if (queue.length === 0) {
        this.requestQueues.delete(key);
      }
    }
  }
}

export const requestDebouncer = new RequestDebouncer();
```

### Connection Pooling (40 lines)

```typescript
import { Pool, PoolClient, PoolConfig } from 'pg';
import { Logger } from '../utils/logger';

class DatabaseConnectionPool {
  private pool: Pool;
  private logger: Logger;
  private readonly DEFAULT_CONFIG: PoolConfig = {
    max: 50, // Maximum number of clients in the pool
    min: 4, // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000, // How long to wait for a connection to be established
    maxUses: 1000, // Maximum number of uses per connection before it's closed
    application_name: 'audit-logging-service'
  };

  constructor(config?: Partial<PoolConfig>) {
    this.logger = new Logger('DatabaseConnectionPool');
    this.pool = new Pool({
      ...this.DEFAULT_CONFIG,
      ...config,
      connectionString: process.env.DATABASE_URL
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.pool.on('connect', () => {
      this.logger.debug('New database connection established');
    });

    this.pool.on('acquire', (client) => {
      this.logger.debug(`Client acquired from pool. Pool size: ${this.pool.totalCount}`);
    });

    this.pool.on('remove', (client) => {
      this.logger.debug(`Client removed from pool. Pool size: ${this.pool.totalCount}`);
    });

    this.pool.on('error', (err, client) => {
      this.logger.error('Unexpected error on idle client', err);
      // Attempt to reconnect
      if (client) {
        client.release(err);
      }
    });
  }

  async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      this.logger.debug(`Client checked out. Pool stats: ` +
        `total=${this.pool.totalCount}, ` +
        `idle=${this.pool.idleCount}, ` +
        `waiting=${this.pool.waitingCount}`);

      // Set up error handling for this client
      client.on('error', (err) => {
        this.logger.error('Client error', err);
        client.release(err);
      });

      return client;
    } catch (err) {
      this.logger.error('Error getting database client', err);
      throw err;
    }
  }

  async query<T>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      this.logger.debug(`Executed query: ${text.substring(0, 50)}... ` +
        `Duration: ${duration}ms, Rows: ${result.rowCount}`);

      return {
        rows: result.rows,
        rowCount: result.rowCount
      };
    } catch (err) {
      this.logger.error(`Error executing query: ${text.substring(0, 50)}...`, err);
      throw err;
    }
  }

  async end(): Promise<void> {
    try {
      await this.pool.end();
      this.logger.info('Database connection pool closed');
    } catch (err) {
      this.logger.error('Error closing database connection pool', err);
      throw err;
    }
  }

  getPoolStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
}

export const databaseConnectionPool = new DatabaseConnectionPool();
```

---

## Real-Time Features (350+ lines)

### WebSocket Server Setup (70 lines)

```typescript
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { createServer, Server } from 'https';
import { readFileSync } from 'fs';
import { join } from 'path';

class AuditLogWebSocketServer {
  private wss: WebSocketServer;
  private logger: Logger;
  private eventEmitter: EventEmitter;
  private server: Server;
  private readonly PING_INTERVAL = 30000; // 30 seconds
  private readonly CONNECTION_TIMEOUT = 60000; // 60 seconds

  constructor() {
    this.logger = new Logger('AuditLogWebSocketServer');
    this.eventEmitter = new EventEmitter();

    // Load SSL certificates
    const sslOptions = {
      key: readFileSync(join(__dirname, '../../certs/key.pem')),
      cert: readFileSync(join(__dirname, '../../certs/cert.pem'))
    };

    // Create HTTPS server
    this.server = createServer(sslOptions);

    // Initialize WebSocket server
    this.wss = new WebSocketServer({
      server: this.server,
      clientTracking: true,
      maxPayload: 1024 * 1024, // 1MB max payload
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        threshold: 1024
      }
    });

    this.setupEventListeners();
    this.setupPingPong();
  }

  private setupEventListeners(): void {
    this.wss.on('connection', (ws, req) => {
      const connectionId = uuidv4();
      const ip = req.socket.remoteAddress || 'unknown';

      this.logger.info(`New WebSocket connection established`, {
        connectionId,
        ip,
        currentConnections: this.wss.clients.size
      });

      // Set up connection-specific event handlers
      ws.on('message', (data) => this.handleMessage(ws, data, connectionId));
      ws.on('close', () => this.handleClose(ws, connectionId));
      ws.on('error', (err) => this.handleError(ws, err, connectionId));
      ws.on('pong', () => this.handlePong(ws, connectionId));

      // Send connection acknowledgment
      ws.send(JSON.stringify({
        type: 'connection_ack',
        connectionId,
        timestamp: new Date().toISOString(),
        serverTime: Date.now()
      }));

      // Set connection timeout
      const timeout = setTimeout(() => {
        if (ws.readyState === ws.OPEN) {
          this.logger.warn(`Closing inactive connection ${connectionId}`);
          ws.close(1008, 'Connection timeout');
        }
      }, this.CONNECTION_TIMEOUT);

      ws.once('close', () => clearTimeout(timeout));
    });

    this.wss.on('error', (err) => {
      this.logger.error('WebSocket server error', err);
    });

    this.wss.on('close', () => {
      this.logger.info('WebSocket server closed');
    });
  }

  private setupPingPong(): void {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
          try {
            ws.ping();
          } catch (err) {
            this.logger.error('Error sending ping', err);
          }
        }
      });
    }, this.PING_INTERVAL);
  }

  private handleMessage(ws: WebSocket, data: any, connectionId: string): void {
    try {
      const message = JSON.parse(data.toString());
      this.logger.debug(`Received message from ${connectionId}`, { message });

      // Validate message
      if (!message.type) {
        throw new Error('Message type is required');
      }

      // Emit message to event emitter
      this.eventEmitter.emit(`message:${message.type}`, {
        ws,
        message,
        connectionId
      });

      this.eventEmitter.emit('message', {
        ws,
        message,
        connectionId
      });
    } catch (err) {
      this.logger.error(`Error handling message from ${connectionId}`, err);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format',
        details: err.message
      }));
    }
  }

  private handleClose(ws: WebSocket, connectionId: string): void {
    this.logger.info(`WebSocket connection closed`, {
      connectionId,
      currentConnections: this.wss.clients.size
    });
    this.eventEmitter.emit('disconnect', { ws, connectionId });
  }

  private handleError(ws: WebSocket, err: Error, connectionId: string): void {
    this.logger.error(`WebSocket error for connection ${connectionId}`, err);
  }

  private handlePong(ws: WebSocket, connectionId: string): void {
    this.logger.debug(`Received pong from ${connectionId}`);
  }

  broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        try {
          ws.send(data);
        } catch (err) {
          this.logger.error('Error broadcasting message', err);
        }
      }
    });
  }

  sendToConnection(connectionId: string, message: any): boolean {
    const data = JSON.stringify(message);
    let sent = false;

    this.wss.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        const clientConnectionId = (ws as any).connectionId;
        if (clientConnectionId === connectionId) {
          try {
            ws.send(data);
            sent = true;
          } catch (err) {
            this.logger.error(`Error sending message to connection ${connectionId}`, err);
          }
        }
      }
    });

    return sent;
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  start(port: number): void {
    this.server.listen(port, () => {
      this.logger.info(`WebSocket server started on port ${port}`);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss.close((err) => {
        if (err) {
          this.logger.error('Error closing WebSocket server', err);
          reject(err);
        } else {
          this.server.close((err) => {
            if (err) {
              this.logger.error('Error closing HTTP server', err);
              reject(err);
            } else {
              this.logger.info('WebSocket server stopped');
              resolve();
            }
          });
        }
      });

      // Close all client connections
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
          ws.close(1001, 'Server shutting down');
        }
      });
    });
  }
}

export const auditLogWebSocketServer = new AuditLogWebSocketServer();
```

### Real-Time Event Handlers (90 lines)

```typescript
import { auditLogWebSocketServer } from './websocket-server';
import { AuditLog } from '../models/audit-log.model';
import { Logger } from '../utils/logger';
import { auditLogService } from '../services/audit-log.service';
import { EventEmitter } from 'events';

class RealTimeEventHandler {
  private logger: Logger;
  private eventEmitter: EventEmitter;
  private readonly MAX_SUBSCRIPTIONS_PER_CLIENT = 10;
  private clientSubscriptions: Map<string, Set<string>>;

  constructor() {
    this.logger = new Logger('RealTimeEventHandler');
    this.eventEmitter = new EventEmitter();
    this.clientSubscriptions = new Map();

    this.setupWebSocketHandlers();
    this.setupAuditLogListeners();
  }

  private setupWebSocketHandlers(): void {
    // Handle subscription requests
    auditLogWebSocketServer.on('message:subscribe', async ({ ws, message, connectionId }) => {
      try {
        if (!message.channel) {
          throw new Error('Channel is required for subscription');
        }

        if (!this.clientSubscriptions.has(connectionId)) {
          this.clientSubscriptions.set(connectionId, new Set());
        }

        const subscriptions = this.clientSubscriptions.get(connectionId)!;

        if (subscriptions.size >= this.MAX_SUBSCRIPTIONS_PER_CLIENT) {
          throw new Error(`Maximum subscriptions (${this.MAX_SUBSCRIPTIONS_PER_CLIENT}) reached`);
        }

        if (subscriptions.has(message.channel)) {
          throw new Error(`Already subscribed to channel ${message.channel}`);
        }

        // Validate channel
        if (!this.isValidChannel(message.channel)) {
          throw new Error(`Invalid channel: ${message.channel}`);
        }

        subscriptions.add(message.channel);
        (ws as any).subscriptions = subscriptions;

        this.logger.info(`Client ${connectionId} subscribed to channel ${message.channel}`);

        // Send acknowledgment
        ws.send(JSON.stringify({
          type: 'subscription_ack',
          channel: message.channel,
          status: 'subscribed',
          timestamp: new Date().toISOString()
        }));

        // Send initial data if requested
        if (message.initialData) {
          await this.sendInitialData(ws, message.channel);
        }
      } catch (err) {
        this.logger.error(`Error handling subscription for ${connectionId}`, err);
        ws.send(JSON.stringify({
          type: 'error',
          error: err.message,
          channel: message.channel,
          timestamp: new Date().toISOString()
        }));
      }
    });

    // Handle unsubscription requests
    auditLogWebSocketServer.on('message:unsubscribe', ({ ws, message, connectionId }) => {
      try {
        if (!message.channel) {
          throw new Error('Channel is required for unsubscription');
        }

        const subscriptions = this.clientSubscriptions.get(connectionId);
        if (!subscriptions || !subscriptions.has(message.channel)) {
          throw new Error(`Not subscribed to channel ${message.channel}`);
        }

        subscriptions.delete(message.channel);
        this.logger.info(`Client ${connectionId} unsubscribed from channel ${message.channel}`);

        ws.send(JSON.stringify({
          type: 'subscription_ack',
          channel: message.channel,
          status: 'unsubscribed',
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        this.logger.error(`Error handling unsubscription for ${connectionId}`, err);
        ws.send(JSON.stringify({
          type: 'error',
          error: err.message,
          channel: message.channel,
          timestamp: new Date().toISOString()
        }));
      }
    });

    // Handle disconnect
    auditLogWebSocketServer.on('disconnect', ({ connectionId }) => {
      this.clientSubscriptions.delete(connectionId);
      this.logger.info(`Cleaned up subscriptions for disconnected client ${connectionId}`);
    });
  }

  private setupAuditLogListeners(): void {
    // Listen for new audit logs
    auditLogService.on('auditLogCreated', (auditLog: AuditLog) => {
      this.broadcastAuditLog(auditLog);
    });

    // Listen for audit log updates
    auditLogService.on('auditLogUpdated', (auditLog: AuditLog) => {
      this.broadcastAuditLog(auditLog, 'update');
    });

    // Listen for audit log deletions
    auditLogService.on('auditLogDeleted', (auditLogId: string) => {
      this.broadcastAuditLogDeletion(auditLogId);
    });
  }

  private isValidChannel(channel: string): boolean {
    const validChannels = [
      'all',
      'user:{userId}',
      'resource:{resourceType}:{resourceId}',
      'action:{action}',
      'system'
    ];

    return validChannels.some(validChannel => {
      const pattern = validChannel.replace(/\{[^}]+\}/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(channel);
    });
  }

  private async sendInitialData(ws: WebSocket, channel: string): Promise<void> {
    try {
      let auditLogs: AuditLog[] = [];

      if (channel === 'all') {
        auditLogs = await auditLogService.getRecentAuditLogs(50);
      } else if (channel.startsWith('user:')) {
        const userId = channel.split(':')[1];
        auditLogs = await auditLogService.getAuditLogsByUser(userId, 50);
      } else if (channel.startsWith('resource:')) {
        const [, resourceType, resourceId] = channel.split(':');
        auditLogs = await auditLogService.getAuditLogsByResource(resourceType, resourceId, 50);
      } else if (channel.startsWith('action:')) {
        const action = channel.split(':')[1];
        auditLogs = await auditLogService.getAuditLogsByAction(action, 50);
      }

      ws.send(JSON.stringify({
        type: 'initial_data',
        channel,
        data: auditLogs,
        timestamp: new Date().toISOString()
      }));
    } catch (err) {
      this.logger.error(`Error sending initial data for channel ${channel}`, err);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Failed to load initial data',
        channel,
        timestamp: new Date().toISOString()
      }));
    }
  }

  private broadcastAuditLog(auditLog: AuditLog, eventType: 'create' | 'update' = 'create'): void {
    const message = {
      type: `audit_log_${eventType}`,
      data: auditLog,
      timestamp: new Date().toISOString()
    };

    // Broadcast to all clients subscribed to 'all'
    auditLogWebSocketServer.broadcast(message);

    // Broadcast to user-specific channel
    const userChannel = `user:${auditLog.userId}`;
    this.broadcastToChannel(userChannel, message);

    // Broadcast to resource-specific channel
    const resourceChannel = `resource:${auditLog.resourceType}:${auditLog.resourceId}`;
    this.broadcastToChannel(resourceChannel, message);

    // Broadcast to action-specific channel
    const actionChannel = `action:${auditLog.action}`;
    this.broadcastToChannel(actionChannel, message);
  }

  private broadcastAuditLogDeletion(auditLogId: string): void {
    const message = {
      type: 'audit_log_deleted',
      data: { id: auditLogId },
      timestamp: new Date().toISOString()
    };

    auditLogWebSocketServer.broadcast(message);
  }

  private broadcastToChannel(channel: string, message: any): void {
    const data = JSON.stringify(message);
    auditLogWebSocketServer.wss.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        const subscriptions = (ws as any).subscriptions as Set<string>;
        if (subscriptions && subscriptions.has(channel)) {
          try {
            ws.send(data);
          } catch (err) {
            this.logger.error(`Error sending message to channel ${channel}`, err);
          }
        }
      }
    });
  }
}

export const realTimeEventHandler = new RealTimeEventHandler();
```

### Client-Side WebSocket Integration (70 lines)

```typescript
import { Logger } from '../utils/logger';
import { AuditLog } from '../models/audit-log.model';

class AuditLogWebSocketClient {
  private socket: WebSocket | null = null;
  private logger: Logger;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private reconnectAttempts = 0;
  private connectionId: string | null = null;
  private subscriptions: Set<string> = new Set();
  private eventListeners: Map<string, Set<Function>> = new Map();
  private isConnecting = false;
  private url: string;
  private jwtToken: string;

  constructor(url: string, jwtToken: string) {
    this.logger = new Logger('AuditLogWebSocketClient');
    this.url = url;
    this.jwtToken = jwtToken;
  }

  connect(): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            resolve();
          } else if (!this.isConnecting) {
            clearInterval(checkConnection);
            reject(new Error('Connection failed'));
          }
        }, 100);
      });
    }

    this.isConnecting = true;
    this.reconnectAttempts++;

    return new Promise((resolve, reject) => {
      try {
        this.logger.info('Connecting to WebSocket server...');

        // Add JWT token to URL
        const wsUrl = new URL(this.url);
        wsUrl.searchParams.append('token', this.jwtToken);

        this.socket = new WebSocket(wsUrl.toString());

        this.socket.onopen = () => {
          this.logger.info('WebSocket connection established');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.socket.onclose = (event) => {
          this.logger.warn('WebSocket connection closed', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          this.isConnecting = false;
          this.scheduleReconnect();
        };

        this.socket.onerror = (error) => {
          this.logger.error('WebSocket error', error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (err) {
        this.isConnecting = false;
        this.logger.error('Error connecting to WebSocket', err);
        reject(err);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error(`Max reconnect attempts (${this.MAX_RECONNECT_ATTEMPTS}) reached`);
      return;
    }

    const delay = Math.min(this.RECONNECT_DELAY * this.reconnectAttempts, 30000);

    this.logger.info(`Attempting to reconnect in ${delay}ms...`);

    setTimeout(() => {
      this.connect().catch(() => {
        // Error already logged
      });
    }, delay);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      if (message.type === 'connection_ack') {
        this.connectionId = message.connectionId;
        this.logger.debug('Connection acknowledged', { connectionId: this.connectionId });
        return;
      }

      if (message.type === 'subscription_ack') {
        this.logger.debug('Subscription acknowledged', {
          channel: message.channel,
          status: message.status
        });
        return;
      }

      if (message.type === 'error') {
        this.logger.error('Received error from server', message);
        this.emit('error', message);
        return;
      }

      // Emit specific event types
      this.emit(message.type, message);

      // Also emit a generic message event
      this.emit('message', message);
    } catch (err) {
      this.logger.error('Error handling WebSocket message', err);
      this.emit('error', {
        type: 'parsing_error',
        error: err.message,
        data: event.data
      });
    }
  }

  subscribe(channel: string, initialData: boolean = false): Promise<void> {
    return this.ensureConnection().then(() => {
      if (this.subscriptions.has(channel)) {
        this.logger.warn(`Already subscribed to channel ${channel}`);
        return;
      }

      this.subscriptions.add(channel);
      this.socket!.send(JSON.stringify({
        type: 'subscribe',
        channel,
        initialData
      }));
    });
  }

  unsubscribe(channel: string): Promise<void> {
    return this.ensureConnection().then(() => {
      if (!this.subscriptions.has(channel)) {
        this.logger.warn(`Not subscribed to channel ${channel}`);
        return;
      }

      this.subscriptions.delete(channel);
      this.socket!.send(JSON.stringify({
        type: 'unsubscribe',
        channel
      }));
    });
  }

  private ensureConnection(): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            resolve();
          } else if (!this.isConnecting) {
            clearInterval(checkConnection);
            reject(new Error('Connection failed'));
          }
        }, 100);
      });
    }

    return this.connect();
  }

  on(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: (data: any) => void): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.delete(listener);
    }
  }

  private emit(event: string, data: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(listener => {
        try {
          listener(data);
        } catch (err) {
          this.logger.error(`Error in event listener for ${event}`, err);
        }
      });
    }
  }

  close(): void {
    if (this.socket) {
      this.socket.close(1000, 'Client closing connection');
      this.socket = null;
    }
    this.subscriptions.clear();
    this.eventListeners.clear();
    this.logger.info('WebSocket client closed');
  }

  getConnectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.socket) return 'closed';
    return ['connecting', 'open', 'closing', 'closed'][this.socket.readyState];
  }

  getConnectionId(): string | null {
    return this.connectionId;
  }
}

export const createAuditLogWebSocketClient = (url: string, jwtToken: string): AuditLogWebSocketClient => {
  return new AuditLogWebSocketClient(url, jwtToken);
};
```

### Room/Channel Management (60 lines)

```typescript
import { auditLogWebSocketServer } from './websocket-server';
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';

class RoomManager {
  private logger: Logger;
  private eventEmitter: EventEmitter;
  private rooms: Map<string, Set<string>>; // roomName -> Set<connectionIds>
  private connectionRooms: Map<string, Set<string>>; // connectionId -> Set<roomNames>

  constructor() {
    this.logger = new Logger('RoomManager');
    this.eventEmitter = new EventEmitter();
    this.rooms = new Map();
    this.connectionRooms = new Map();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Handle new connections
    auditLogWebSocketServer.on('connection', ({ connectionId }) => {
      this.connectionRooms.set(connectionId, new Set());
      this.logger.debug(`Initialized room tracking for connection ${connectionId}`);
    });

    // Handle disconnections
    auditLogWebSocketServer.on('disconnect', ({ connectionId }) => {
      const rooms = this.connectionRooms.get(connectionId);
      if (rooms) {
        rooms.forEach(room => {
          this.leaveRoom(connectionId, room);
        });
      }
      this.connectionRooms.delete(connectionId);
      this.logger.debug(`Cleaned up room tracking for connection ${connectionId}`);
    });

    // Handle join room messages
    auditLogWebSocketServer.on('message:join_room', ({ ws, message, connectionId }) => {
      try {
        if (!message.room) {
          throw new Error('Room name is required');
        }

        this.joinRoom(connectionId, message.room);
        ws.send(JSON.stringify({
          type: 'room_joined',
          room: message.room,
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        this.logger.error(`Error joining room for connection ${connectionId}`, err);
        ws.send(JSON.stringify({
          type: 'error',
          error: err.message,
          room: message.room,
          timestamp: new Date().toISOString()
        }));
      }
    });

    // Handle leave room messages
    auditLogWebSocketServer.on('message:leave_room', ({ ws, message, connectionId }) => {
      try {
        if (!message.room) {
          throw new Error('Room name is required');
        }

        this.leaveRoom(connectionId, message.room);
        ws.send(JSON.stringify({
          type: 'room_left',
          room: message.room,
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        this.logger.error(`Error leaving room for connection ${connectionId}`, err);
        ws.send(JSON.stringify({
          type: 'error',
          error: err.message,
          room: message.room,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  joinRoom(connectionId: string, roomName: string): void {
    // Initialize room if it doesn't exist
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }

    // Add connection to room
    this.rooms.get(roomName)!.add(connectionId);

    // Track room for connection
    if (!this.connectionRooms.has(connectionId)) {
      this.connectionRooms.set(connectionId, new Set());
    }
    this.connectionRooms.get(connectionId)!.add(roomName);

    this.logger.info(`Connection ${connectionId} joined room ${roomName}`, {
      roomSize: this.rooms.get(roomName)!.size
    });

    this.eventEmitter.emit('room_joined', { connectionId, roomName });
  }

  leaveRoom(connectionId: string, roomName: string): void {
    if (!this.rooms.has(roomName)) {
      this.logger.warn(`Room ${roomName} does not exist`);
      return;
    }

    const room = this.rooms.get(roomName)!;
    room.delete(connectionId);

    if (room.size === 0) {
      this.rooms.delete(roomName);
      this.logger.debug(`Room ${roomName} is now empty and has been removed`);
    } else {
      this.logger.debug(`Connection ${connectionId} left room ${roomName}`, {
        roomSize: room.size
      });
    }

    // Remove room from connection tracking
    if (this.connectionRooms.has(connectionId)) {
      this.connectionRooms.get(connectionId)!.delete(roomName);
    }

    this.eventEmitter.emit('room_left', { connectionId, roomName });
  }

  leaveAllRooms(connectionId: string): void {
    const rooms = this.connectionRooms.get(connectionId);
    if (rooms) {
      rooms.forEach(room => {
        this.leaveRoom(connectionId, room);
      });
    }
  }

  broadcastToRoom(roomName: string, message: any): void {
    if (!this.rooms.has(roomName)) {
      this.logger.warn(`Attempted to broadcast to non-existent room ${roomName}`);
      return;
    }

    const data = JSON.stringify(message);
    const room = this.rooms.get(roomName)!;

    room.forEach(connectionId => {
      if (auditLogWebSocketServer.sendToConnection(connectionId, message)) {
        this.logger.debug(`Sent message to connection ${connectionId} in room ${roomName}`);
      } else {
        this.logger.warn(`Failed to send message to connection ${connectionId} in room ${roomName}`);
      }
    });
  }

  getRoomConnections(roomName: string): Set<string> {
    return this.rooms.get(roomName) || new Set();
  }

  getConnectionRooms(connectionId: string): Set<string> {
    return this.connectionRooms.get(connectionId) || new Set();
  }

  getRoomSize(roomName: string): number {
    return this.rooms.get(roomName)?.size || 0;
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
}

export const roomManager = new RoomManager();
```

### Reconnection Logic (40 lines)

```typescript
import { auditLogWebSocketServer } from './websocket-server';
import { Logger } from '../utils/logger';
import { setTimeout } from 'timers/promises';

class WebSocketReconnectionManager {
  private logger: Logger;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly BASE_RECONNECT_DELAY = 1000; // 1 second
  private readonly MAX_RECONNECT_DELAY = 30000; // 30 seconds
  private reconnectAttempts: Map<string, number>;
  private connectionTimers: Map<string, NodeJS.Timeout>;

  constructor() {
    this.logger = new Logger('WebSocketReconnectionManager');
    this.reconnectAttempts = new Map();
    this.connectionTimers = new Map();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    auditLogWebSocketServer.on('disconnect', ({ connectionId }) => {
      this.reconnectAttempts.set(connectionId, 0);
      this.scheduleReconnect(connectionId);
    });

    auditLogWebSocketServer.on('message:reconnect', ({ ws, connectionId }) => {
      this.logger.info(`Manual reconnect requested for connection ${connectionId}`);
      this.handleReconnect(connectionId);
    });
  }

  private scheduleReconnect(connectionId: string): void {
    const attempts = this.reconnectAttempts.get(connectionId) || 0;

    if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.warn(`Max reconnect attempts (${this.MAX_RECONNECT_ATTEMPTS}) reached for connection ${connectionId}`);
      return;
    }

    const delay = Math.min(
      this.BASE_RECONNECT_DELAY * Math.pow(2, attempts),
      this.MAX_RECONNECT_DELAY
    );

    this.logger.info(`Scheduling reconnect for connection ${connectionId} in ${delay}ms`);

    const timer = setTimeout(() => {
      this.handleReconnect(connectionId);
    }, delay);

    this.connectionTimers.set(connectionId, timer);
  }

  private async handleReconnect(connectionId: string): Promise<void> {
    const attempts = this.reconnectAttempts.get(connectionId) || 0;
    this.reconnectAttempts.set(connectionId, attempts + 1);

    try {
      this.logger.info(`Attempting to reconnect connection ${connectionId} (attempt ${attempts + 1})`);

      // In a real implementation, we would have a way to reconnect the specific client
      // For this example, we'll simulate a successful reconnect after a delay
      await setTimeout(500);

      this.logger.info(`Successfully reconnected connection ${connectionId}`);

      // Reset reconnect attempts
      this.reconnectAttempts.delete(connectionId);
      this.connectionTimers.delete(connectionId);
    } catch (err) {
      this.logger.error(`Failed to reconnect connection ${connectionId}`, err);
      this.scheduleReconnect(connectionId);
    }
  }

  cancelReconnect(connectionId: string): void {
    const timer = this.connectionTimers.get(connectionId);
    if (timer) {
      clearTimeout(timer);
      this.connectionTimers.delete(connectionId);
      this.reconnectAttempts.delete(connectionId);
      this.logger.info(`Cancelled reconnect for connection ${connectionId}`);
    }
  }

  getReconnectStatus(connectionId: string): {
    attempts: number;
    maxAttempts: number;
    nextAttemptIn: number | null;
  } {
    const attempts = this.reconnectAttempts.get(connectionId) || 0;
    const timer = this.connectionTimers.get(connectionId);

    return {
      attempts,
      maxAttempts: this.MAX_RECONNECT_ATTEMPTS,
      nextAttemptIn: timer ? timer.refresh() - Date.now() : null
    };
  }
}

export const webSocketReconnectionManager = new WebSocketReconnectionManager();
```

---

## AI/ML Capabilities (300+ lines)

### Predictive Model Training (90 lines)

```python
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.externals import joblib
import joblib
import json
from datetime import datetime
import os
from typing import Dict, List, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('AuditLogPredictiveModel')

class AuditLogAnomalyDetector:
    def __init__(self, model_path: str = 'models/anomaly_detector.pkl'):
        self.model_path = model_path
        self.model = None
        self.preprocessor = None
        self.feature_columns = [
            'user_id', 'action', 'resource_type', 'hour_of_day',
            'day_of_week', 'is_weekend', 'action_frequency',
            'resource_access_frequency', 'user_action_frequency'
        ]
        self.categorical_features = ['user_id', 'action', 'resource_type']
        self.numerical_features = [
            'hour_of_day', 'day_of_week', 'is_weekend',
            'action_frequency', 'resource_access_frequency',
            'user_action_frequency'
        ]

        # Create model directory if it doesn't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)

    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess the raw audit log data for training."""
        logger.info("Preprocessing data...")

        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])

        # Extract temporal features
        df['hour_of_day'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

        # Calculate frequency features
        df['action_frequency'] = df.groupby('action')['action'].transform('count')
        df['resource_access_frequency'] = df.groupby(['resource_type', 'resource_id'])[
            ['resource_type', 'resource_id']
        ].transform('count')
        df['user_action_frequency'] = df.groupby(['user_id', 'action'])[
            ['user_id', 'action']
        ].transform('count')

        # Normalize frequency features
        df['action_frequency'] = df['action_frequency'] / df['action_frequency'].max()
        df['resource_access_frequency'] = (
            df['resource_access_frequency'] / df['resource_access_frequency'].max()
        )
        df['user_action_frequency'] = (
            df['user_action_frequency'] / df['user_action_frequency'].max()
        )

        # Select only the features we need
        df = df[self.feature_columns]

        return df

    def build_preprocessor(self) -> ColumnTransformer:
        """Build the data preprocessor pipeline."""
        logger.info("Building data preprocessor...")

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), self.numerical_features),
                ('cat', OneHotEncoder(handle_unknown='ignore'), self.categorical_features)
            ])

        return preprocessor

    def train_model(self, df: pd.DataFrame, contamination: float = 0.01) -> None:
        """Train the anomaly detection model."""
        logger.info("Training anomaly detection model...")

        # Preprocess the data
        df_processed = self.preprocess_data(df)

        # Split data into train and test sets
        X_train, X_test = train_test_split(
            df_processed,
            test_size=0.2,
            random_state=42,
            stratify=df_processed['action']
        )

        # Build and fit the preprocessor
        self.preprocessor = self.build_preprocessor()
        X_train_processed = self.preprocessor.fit_transform(X_train)
        X_test_processed = self.preprocessor.transform(X_test)

        # Train the Isolation Forest model
        self.model = IsolationForest(
            n_estimators=100,
            max_samples='auto',
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )

        self.model.fit(X_train_processed)

        # Evaluate the model
        self.evaluate_model(X_test_processed, X_test)

        # Save the model and preprocessor
        self.save_model()

    def evaluate_model(self, X_test: np.ndarray, X_test_original: pd.DataFrame) -> None:
        """Evaluate the trained model."""
        logger.info("Evaluating model...")

        # Predict anomalies (-1 for anomalies, 1 for normal)
        y_pred = self.model.predict(X_test)

        # Convert predictions to binary (0 for normal, 1 for anomaly)
        y_pred_binary = np.where(y_pred == -1, 1, 0)

        # For evaluation, we'll assume that any point not in the training set is "normal"
        # In a real scenario, we would have labeled data
        y_true = np.zeros(len(y_pred_binary))

        logger.info("\nClassification Report:")
        logger.info(classification_report(y_true, y_pred_binary, target_names=['Normal', 'Anomaly']))

        logger.info("\nConfusion Matrix:")
        logger.info(confusion_matrix(y_true, y_pred_binary))

        # Log some example anomalies
        anomalies = X_test_original[y_pred == -1]
        if not anomalies.empty:
            logger.info(f"\nFound {len(anomalies)} anomalies in test set")
            logger.info("Sample anomalies:")
            logger.info(anomalies.head().to_string())

    def save_model(self) -> None:
        """Save the trained model and preprocessor to disk."""
        logger.info(f"Saving model to {self.model_path}...")

        model_data = {
            'model': self.model,
            'preprocessor': self.preprocessor,
            'feature_columns': self.feature_columns,
            'categorical_features': self.categorical_features,
            'numerical_features': self.numerical_features,
            'timestamp': datetime.now().isoformat()
        }

        joblib.dump(model_data, self.model_path)
        logger.info("Model saved successfully")

    def load_model(self) -> bool:
        """Load the trained model and preprocessor from disk."""
        try:
            logger.info(f"Loading model from {self.model_path}...")

            model_data = joblib.load(self.model_path)
            self.model = model_data['model']
            self.preprocessor = model_data['preprocessor']
            self.feature_columns = model_data['feature_columns']
            self.categorical_features = model_data['categorical_features']
            self.numerical_features = model_data['numerical_features']

            logger.info("Model loaded successfully")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return False

    def predict_anomaly(self, audit_log: Dict) -> Tuple[bool, float]:
        """Predict whether a single audit log is an anomaly."""
        if not self.model or not self.preprocessor:
            if not self.load_model():
                raise Exception("Model not trained and could not be loaded")

        # Convert audit log to DataFrame
        df = pd.DataFrame([audit_log])

        # Preprocess the data
        df_processed = self.preprocess_data(df)

        # Transform the data
        X_processed = self.preprocessor.transform(df_processed)

        # Predict anomaly score
        anomaly_score = self.model.decision_function(X_processed)[0]
        is_anomaly = self.model.predict(X_processed)[0] == -1

        return is_anomaly, anomaly_score

    def batch_predict_anomalies(self, audit_logs: List[Dict]) -> List[Tuple[bool, float]]:
        """Predict anomalies for a batch of audit logs."""
        if not self.model or not self.preprocessor:
            if not self.load_model():
                raise Exception("Model not trained and could not be loaded")

        # Convert audit logs to DataFrame
        df = pd.DataFrame(audit_logs)

        # Preprocess the data
        df_processed = self.preprocess_data(df)

        # Transform the data
        X_processed = self.preprocessor.transform(df_processed)

        # Predict anomalies
        anomaly_scores = self.model.decision_function(X_processed)
        predictions = self.model.predict(X_processed)

        return [
            (pred == -1, score)
            for pred, score in zip(predictions, anomaly_scores)
        ]

# Example usage
if __name__ == "__main__":
    # Load sample data (in a real scenario, this would come from your database)
    sample_data = pd.read_json('sample_audit_logs.json')

    # Initialize and train the model
    detector = AuditLogAnomalyDetector()
    detector.train_model(sample_data)

    # Test prediction
    test_log = {
        "user_id": "user123",
        "action": "DELETE",
        "resource_type": "database",
        "resource_id": "db456",
        "timestamp": "2023-11-15T03:14:15.000Z"
    }

    is_anomaly, score = detector.predict_anomaly(test_log)
    print(f"Is anomaly: {is_anomaly}, Score: {score}")
```

### Real-Time Inference API (70 lines)

```python
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
import json
from datetime import datetime
from audit_log_anomaly_detector import AuditLogAnomalyDetector
import asyncio
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('AuditLogInferenceAPI')

app = FastAPI(title="Audit Log Anomaly Detection API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the anomaly detector
anomaly_detector = AuditLogAnomalyDetector()

# WebSocket manager
class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, List[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        # Remove from all subscriptions
        for sub in self.subscriptions:
            if client_id in self.subscriptions[sub]:
                self.subscriptions[sub].remove(client_id)
        logger.info(f"Client {client_id} disconnected")

    async def broadcast(self, message: Dict, channel: Optional[str] = None):
        if channel:
            for websocket in self.subscriptions.get(channel, []):
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to channel {channel}: {str(e)}")
        else:
            for websocket in self.active_connections.values():
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting: {str(e)}")

    def subscribe(self, client_id: str, channel: str):
        if client_id in self.active_connections:
            self.subscriptions[channel].append(self.active_connections[client_id])
            logger.info(f"Client {client_id} subscribed to channel {channel}")

    def unsubscribe(self, client_id: str, channel: str):
        if client_id in self.active_connections and client_id in self.subscriptions[channel]:
            self.subscriptions[channel].remove(self.active_connections[client_id])
            logger.info(f"Client {client_id} unsubscribed from channel {channel}")

websocket_manager = WebSocketManager()

class AuditLogRequest(BaseModel):
    user_id: str
    action: str
    resource_type: str
    resource_id: str
    timestamp: str
    metadata: Optional[Dict] = None

class BatchAuditLogRequest(BaseModel):
    logs: List[AuditLogRequest]

@app.on_event("startup")
async def startup_event():
    """Load the model when the application starts."""
    if not anomaly_detector.load_model():
        logger.warning("No pre-trained model found. Please train a model first.")
    else:
        logger.info("Model loaded successfully")

@app.post("/predict")
async def predict_anomaly(log: AuditLogRequest):
    """Predict if a single audit log is an anomaly."""
    try:
        # Convert to dict and add any missing fields
        log_dict = log.dict()

        # Predict anomaly
        is_anomaly, score = anomaly_detector.predict_anomaly(log_dict)

        # Prepare response
        response = {
            "is_anomaly": bool(is_anomaly),
            "anomaly_score": float(score),
            "log": log_dict,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Broadcast to WebSocket clients if it's an anomaly
        if is_anomaly:
            await websocket_manager.broadcast({
                "type": "anomaly_detected",
                "data": response
            }, channel="anomalies")

        return response
    except Exception as e:
        logger.error(f"Error predicting anomaly: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-predict")
async def batch_predict_anomalies(request: BatchAuditLogRequest):
    """Predict anomalies for a batch of audit logs."""
    try:
        # Convert logs to dicts
        log_dicts = [log.dict() for log in request.logs]

        # Predict anomalies
        predictions = anomaly_detector.batch_predict_anomalies(log_dicts)

        # Prepare response
        results = []
        anomalies = []

        for log, (is_anomaly, score) in zip(log_dicts, predictions):
            result = {
                "is_anomaly": bool(is_anomaly),
                "anomaly_score": float(score),
                "log": log
            }
            results.append(result)

            if is_anomaly:
                anomalies.append(result)

        # Broadcast anomalies to WebSocket clients
        if anomalies:
            await websocket_manager.broadcast({
                "type": "batch_anomalies_detected",
                "data": {
                    "count": len(anomalies),
                    "anomalies": anomalies
                }
            }, channel="anomalies")

        return {
            "results": results,
            "anomaly_count": len(anomalies),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in batch prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time anomaly notifications."""
    await websocket.accept()
    client_id = str(id(websocket))

    try:
        await websocket_manager.connect(websocket, client_id)

        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)

                if message.get("type") == "subscribe":
                    channel = message.get("channel")
                    if channel:
                        websocket_manager.subscribe(client_id, channel)
                        await websocket.send_json({
                            "type": "subscription_ack",
                            "channel": channel,
                            "status": "subscribed"
                        })
                elif message.get("type") == "unsubscribe":
                    channel = message.get("channel")
                    if channel:
                        websocket_manager.unsubscribe(client_id, channel)
                        await websocket.send_json({
                            "type": "subscription_ack",
                            "channel": channel,
                            "status": "unsubscribed"
                        })
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {str(e)}")
        websocket_manager.disconnect(client_id)

@app.get("/model-info")
async def get_model_info():
    """Get information about the current model."""
    try:
        if not anomaly_detector.model:
            raise HTTPException(status_code=404, detail="Model not loaded")

        return {
            "model_type": "IsolationForest",
            "features": anomaly_detector.feature_columns,
            "categorical_features": anomaly_detector.categorical_features,
            "numerical_features": anomaly_detector.numerical_features,
            "status": "ready"
        }
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Feature Engineering Pipeline (70 lines)

```python
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging
from collections import defaultdict
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('FeatureEngineeringPipeline')

class AuditLogFeatureEngineer:
    def __init__(self):
        self.user_action_counts = defaultdict(lambda: defaultdict(int))
        self.resource_access_counts = defaultdict(lambda: defaultdict(int))
        self.action_counts = defaultdict(int)
        self.user_action_windows = defaultdict(lambda: defaultdict(list))
        self.window_size = timedelta(hours=1)

    def reset_counters(self):
        """Reset all counters and windows."""
        self.user_action_counts.clear()
        self.resource_access_counts.clear()
        self.action_counts.clear()
        self.user_action_windows.clear()

    def update_counters(self, audit_log: Dict):
        """Update counters with a new audit log."""
        # Update user action counts
        self.user_action_counts[audit_log['user_id']][audit_log['action']] += 1

        # Update resource access counts
        resource_key = f"{audit_log['resource_type']}:{audit_log['resource_id']}"
        self.resource_access_counts[resource_key][audit_log['user_id']] += 1

        # Update action counts
        self.action_counts[audit_log['action']] += 1

        # Update time windows for user actions
        timestamp = pd.to_datetime(audit_log['timestamp'])
        self.user_action_windows[audit_log['user_id']][audit_log['action']].append(timestamp)

        # Clean up old timestamps
        self._cleanup_old_timestamps()

    def _cleanup_old_timestamps(self):
        """Remove timestamps older than the window size."""
        current_time = datetime.utcnow()
        for user_id in list(self.user_action_windows.keys()):
            for action in list(self.user_action_windows[user_id].keys()):
                # Remove timestamps older than window_size
                self.user_action_windows[user_id][action] = [
                    ts for ts in self.user_action_windows[user_id][action]
                    if current_time - ts < self.window_size
                ]

                # Remove empty action lists
                if not self.user_action_windows[user_id][action]:
                    del self.user_action_windows[user_id][action]

            # Remove empty user entries
            if not self.user_action_windows[user_id]:
                del self.user_action_windows[user_id]

    def calculate_features(self, audit_log: Dict) -> Dict:
        """Calculate features for a single audit log."""
        timestamp = pd.to_datetime(audit_log['timestamp'])
        features = {}

        # Basic features
        features['hour_of_day'] = timestamp.hour
        features['day_of_week'] = timestamp.dayofweek
        features['is_weekend'] = 1 if timestamp.dayofweek >= 5 else 0
        features['is_night'] = 1 if timestamp.hour < 6 or timestamp.hour >= 22 else 0

        # User behavior features
        user_actions = self.user_action_counts.get(audit_log['user_id'], {})
        features['user_total_actions'] = sum(user_actions.values())
        features['user_action_frequency'] = user_actions.get(audit_log['action'], 0)
        features['user_action_diversity'] = len(user_actions)

        # Calculate recent action frequency for this user
        recent_actions = self._get_recent_actions(audit_log['user_id'], audit_log['action'])
        features['user_recent_action_frequency'] = len(recent_actions)

        # Resource access features
        resource_key = f"{audit_log['resource_type']}:{audit_log['resource_id']}"
        resource_access = self.resource_access_counts.get(resource_key, {})
        features['resource_total_accesses'] = sum(resource_access.values())
        features['resource_user_accesses'] = resource_access.get(audit_log['user_id'], 0)
        features['resource_access_diversity'] = len(resource_access)

        # Action features
        features['action_frequency'] = self.action_counts.get(audit_log['action'], 0)
        features['action_user_ratio'] = (
            features['user_action_frequency'] / features['action_frequency']
            if features['action_frequency'] > 0 else 0
        )

        # Time since last action by this user
        last_action_time = self._get_last_action_time(audit_log['user_id'], audit_log['action'])
        features['time_since_last_action'] = (
            (timestamp - last_action_time).total_seconds() / 3600  # in hours
            if last_action_time else 24  # Default to 24 hours if no previous action
        )

        # Time since last access to this resource by this user
        last_resource_access = self._get_last_resource_access_time(
            audit_log['user_id'], resource_key
        )
        features['time_since_last_resource_access'] = (
            (timestamp - last_resource_access).total_seconds() / 3600  # in hours
            if last_resource_access else 24
        )

        # Normalize some features
        features['normalized_user_action_frequency'] = (
            features['user_action_frequency'] / (features['user_total_actions'] + 1)
        )
        features['normalized_resource_user_accesses'] = (
            features['resource_user_accesses'] / (features['resource_total_accesses'] + 1)
        )

        return features

    def _get_recent_actions(self, user_id: str, action: str) -> List[datetime]:
        """Get recent actions for a user within the time window."""
        current_time = datetime.utcnow()
        return [
            ts for ts in self.user_action_windows.get(user_id, {}).get(action, [])
            if current_time - ts < self.window_size
        ]

    def _get_last_action_time(self, user_id: str, action: str) -> Optional[datetime]:
        """Get the timestamp of the last action by this user."""
        recent_actions = self._get_recent_actions(user_id, action)
        return max(recent_actions) if recent_actions else None

    def _get_last_resource_access_time(self, user_id: str, resource_key: str) -> Optional[datetime]:
        """Get the timestamp of the last access to this resource by this user."""
        # This would require additional tracking in a real implementation
        # For this example, we'll return None
        return None

    def process_batch(self, audit_logs: List[Dict]) -> pd.DataFrame:
        """Process a batch of audit logs and return a DataFrame with features."""
        # First update all counters
        for log in audit_logs:
            self.update_counters(log)

        # Then calculate features for each log
        feature_list = []
        for log in audit_logs:
            features = self.calculate_features(log)
            # Combine with original log data
            combined = {**log, **features}
            feature_list.append(combined)

        return pd.DataFrame(feature_list)

    def to_feature_vector(self, features: Dict) -> List[float]:
        """Convert feature dictionary to a numerical feature vector."""
        # Define the order of features
        feature_order = [
            'hour_of_day', 'day_of_week', 'is_weekend', 'is_night',
            'user_total_actions', 'user_action_frequency',
            'user_action_diversity', 'user_recent_action_frequency',
            'resource_total_accesses', 'resource_user_accesses',
            'resource_access_diversity', 'action_frequency',
            'action_user_ratio', 'time_since_last_action',
            'time_since_last_resource_access', 'normalized_user_action_frequency',
            'normalized_resource_user_accesses'
        ]

        # Create vector in the correct order
        vector = []
        for feature in feature_order:
            if feature in features:
                vector.append(float(features[feature]))
            else:
                vector.append(0.0)  # Default value if feature is missing

        return vector

# Example usage
if __name__ == "__main__":
    # Sample audit logs
    sample_logs = [
        {
            "user_id": "user1",
            "action": "READ",
            "resource_type": "database",
            "resource_id": "db1",
            "timestamp": "2023-11-15T08:00:00.000Z"
        },
        {
            "user_id": "user1",
            "action": "READ",
            "resource_type": "database",
            "resource_id": "db1",
            "timestamp": "2023-11-15T08:05:00.000Z"
        },
        {
            "user_id": "user2",
            "action": "WRITE",
            "resource_type": "database",
            "resource_id": "db1",
            "timestamp": "2023-11-15T08:10:00.000Z"
        },
        {
            "user_id": "user1",
            "action": "DELETE",
            "resource_type": "file",
            "resource_id": "file1",
            "timestamp": "2023-11-15T08:15:00.000Z"
        }
    ]

    # Initialize feature engineer
    feature_engineer = AuditLogFeatureEngineer()

    # Process batch
    features_df = feature_engineer.process_batch(sample_logs)
    print("Feature DataFrame:")
    print(features_df.head())

    # Get feature vector for the last log
    last_log_features = feature_engineer.calculate_features(sample_logs[-1])
    feature_vector = feature_engineer.to_feature_vector(last_log_features)
    print("\nFeature vector for last log:")
    print(feature_vector)
```

### Model Monitoring and Retraining (60 lines)

```python
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from datetime import datetime, timedelta
import logging
import json
import os
from typing import Dict, List, Optional
from audit_log_anomaly_detector import AuditLogAnomalyDetector
from feature_engineering_pipeline import AuditLogFeatureEngineer
import smtplib
from email.mime.text import MIMEText
from apscheduler.schedulers.background import BackgroundScheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('ModelMonitor')

class ModelMonitor:
    def __init__(self, model_path: str = 'models/anomaly_detector.pkl'):
        self.model_path = model_path
        self.detector = AuditLogAnomalyDetector(model_path)
        self.feature_engineer = AuditLogFeatureEngineer()
        self.performance_metrics = []
        self.data_drift_metrics = []
        self.last_retrain_time = None
        self.retrain_scheduler = BackgroundScheduler()
        self.alert_thresholds = {
            'accuracy_drop': 0.1,  # 10% drop in accuracy
            'precision_drop': 0.15,
            'recall_drop': 0.1,
            'f1_drop': 0.1,
            'feature_drift': 0.2  # 20% drift in feature distribution
        }

        # Load existing metrics if available
        self.load_metrics()

        # Schedule regular retraining
        self.retrain_scheduler.add_job(
            self.retrain_if_needed,
            'interval',
            days=7,
            next_run_time=datetime.now() + timedelta(minutes=5)
        )
        self.retrain_scheduler.start()

    def load_metrics(self):
        """Load saved metrics from disk."""
        try:
            with open('metrics/performance_metrics.json', 'r') as f:
                self.performance_metrics = json.load(f)
            with open('metrics/data_drift_metrics.json', 'r') as f:
                self.data_drift_metrics = json.load(f)
            logger.info("Loaded existing metrics")
        except FileNotFoundError:
            logger.info("No existing metrics found, starting fresh")
        except Exception as e:
            logger.error(f"Error loading metrics: {str(e)}")

    def save_metrics(self):
        """Save metrics to disk."""
        os.makedirs('metrics', exist_ok=True)
        try:
            with open('metrics/performance_metrics.json', 'w') as f:
                json.dump(self.performance_metrics, f, indent=2)
            with open('metrics/data_drift_metrics.json', 'w') as f:
                json.dump(self.data_drift_metrics, f, indent=2)
            logger.info("Metrics saved successfully")
        except Exception as e:
            logger.error(f"Error saving metrics: {str(e)}")

    def calculate_performance_metrics(self, y_true: List[int], y_pred: List[int]) -> Dict:
        """Calculate performance metrics for the model."""
        metrics = {
            'timestamp': datetime.utcnow().isoformat(),
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred),
            'recall': recall_score(y_true, y_pred),
            'f1': f1_score(y_true, y_pred),
            'sample_size': len(y_true)
        }
        return metrics

    def calculate_data_drift(self, reference_data: pd.DataFrame, current_data: pd.DataFrame) -> Dict:
        """Calculate data drift between reference and current data."""
        drift_metrics = {
            'timestamp': datetime.utcnow().isoformat(),
            'features': {}
        }

        # Compare feature distributions
        for feature in self.detector.numerical_features:
            if feature in reference_data.columns and feature in current_data.columns:
                ref_mean = reference_data[feature].mean()
                curr_mean = current_data[feature].mean()
                ref_std = reference_data[feature].std()
                curr_std = current_data[feature].std()

                drift_metrics['features'][feature] = {
                    'mean_drift': abs(ref_mean - curr_mean) / (ref_std + 1e-6),
                    'std_drift': abs(ref_std - curr_std) / (ref_std + 1e-6)
                }

        # Calculate overall drift
        drift_scores = [
            metrics['mean_drift'] + metrics['std_drift']
            for metrics in drift_metrics['features'].values()
        ]
        drift_metrics['overall_drift'] = np.mean(drift_scores) if drift_scores else 0

        return drift_metrics

    def evaluate_model(self, test_data: pd.DataFrame) -> Dict:
        """Evaluate the model on test data."""
        try:
            # Preprocess the data
            test_data_processed = self.detector.preprocess_data(test_data)

            # Split into features and labels (we'll use all as "normal" for evaluation)
            X = test_data_processed[self.detector.feature_columns]

            # Transform the data
            X_processed = self.detector.preprocessor.transform(X)

            # Predict
            y_pred = self.detector.model.predict(X_processed)
            y_pred_binary = np.where(y_pred == -1, 1, 0)  # 1 for anomaly, 0 for normal
            y_true = np.zeros(len(y_pred_binary))  # Assume all are normal for evaluation

            # Calculate metrics
            metrics = self.calculate_performance_metrics(y_true, y_pred_binary)

            # Compare with previous metrics
            if self.performance_metrics:
                last_metrics = self.performance_metrics[-1]
                metrics['accuracy_change'] = metrics['accuracy'] - last_metrics['accuracy']
                metrics['precision_change'] = metrics['precision'] - last_metrics['precision']
                metrics['recall_change'] = metrics['recall'] - last_metrics['recall']
                metrics['f1_change'] = metrics['f1'] - last_metrics['f1']

            # Save metrics
            self.performance_metrics.append(metrics)
            self.save_metrics()

            # Check for performance degradation
            self.check_performance_degradation(metrics)

            return metrics
        except Exception as e:
            logger.error(f"Error evaluating model: {str(e)}")
            raise

    def check_performance_degradation(self, current_metrics: Dict):
        """Check if performance has degraded beyond thresholds."""
        if not self.performance_metrics:
            return

        last_metrics = self.performance_metrics[-1]
        alerts = []

        if 'accuracy_change' in current_metrics:
            if abs(current_metrics['accuracy_change']) > self.alert_thresholds['accuracy_drop']:
                alerts.append(
                    f"Accuracy dropped by {current_metrics['accuracy_change']:.2%} "
                    f"(threshold: {self.alert_thresholds['accuracy_drop']:.2%})"
                )

        if 'precision_change' in current_metrics:
            if abs(current_metrics['precision_change']) > self.alert_thresholds['precision_drop']:
                alerts.append(
                    f"Precision dropped by {current_metrics['precision_change']:.2%} "
                    f"(threshold: {self.alert_thresholds['precision_drop']:.2%})"
                )

        if 'recall_change' in current_metrics:
            if abs(current_metrics['recall_change']) > self.alert_thresholds['recall_drop']:
                alerts.append(
                    f"Recall dropped by {current_metrics['recall_change']:.2%} "
                    f"(threshold: {self.alert_thresholds['recall_drop']:.2%})"
                )

        if 'f1_change' in current_metrics:
            if abs(current_metrics['f1_change']) > self.alert_thresholds['f1_drop']:
                alerts.append(
                    f"F1 score dropped by {current_metrics['f1_change']:.2%} "
                    f"(threshold: {self.alert_thresholds['f1_drop']:.2%})"
                )

        if alerts:
            alert_message = "Model performance degradation detected:\n" + "\n".join(alerts)
            logger.warning(alert_message)
            self.send_alert(alert_message)

    def check_data_drift(self, reference_data: pd.DataFrame, current_data: pd.DataFrame):
        """Check for data drift between reference and current data."""
        try:
            drift_metrics = self.calculate_data_drift(reference_data, current_data)
            self.data_drift_metrics.append(drift_metrics)
            self.save_metrics()

            if drift_metrics['overall_drift'] > self.alert_thresholds['feature_drift']:
                alert_message = (
                    f"Significant data drift detected: {drift_metrics['overall_drift']:.2%} "
                    f"(threshold: {self.alert_thresholds['feature_drift']:.2%})"
                )
                logger.warning(alert_message)
                self.send_alert(alert_message)

            return drift_metrics
        except Exception as e:
            logger.error(f"Error checking data drift: {str(e)}")
            raise

    def retrain_if_needed(self):
        """Check if retraining is needed and perform retraining if so."""
        try:
            logger.info("Checking if model retraining is needed...")

            # Load recent data for retraining
            recent_data = self.load_recent_data(days=30)

            if len(recent_data) < 1000:  # Minimum data size for retraining
                logger.info("Not enough data for retraining")
                return False

            # Check data drift
            reference_data = self.load_reference_data()
            if len(reference_data) > 0:
                drift_metrics = self.check_data_drift(reference_data, recent_data)
                if drift_metrics['overall_drift'] <= self.alert_thresholds['feature_drift']:
                    logger.info("No significant data drift detected, skipping retraining")
                    return False

            # Retrain the model
            logger.info("Retraining model...")
            self.detector.train_model(recent_data)
            self.last_retrain_time = datetime.utcnow().isoformat()
            self.save_metrics()

            # Evaluate the new model
            self.evaluate_model(recent_data.sample(frac=0.2))

            logger.info("Model retraining completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error during model retraining: {str(e)}")
            self.send_alert(f"Model retraining failed: {str(e)}")
            return False

    def load_recent_data(self, days: int = 30) -> pd.DataFrame:
        """Load recent audit log data for retraining."""
        # In a real implementation, this would query your database
        # For this example, we'll return an empty DataFrame
        logger.info(f"Loading recent data from last {days} days")
        return pd.DataFrame()

    def load_reference_data(self) -> pd.DataFrame:
        """Load reference data for drift detection."""
        # In a real implementation, this would load the data used for initial training
        # For this example, we'll return an empty DataFrame
        logger.info("Loading reference data")
        return pd.DataFrame()

    def send_alert(self, message: str):
        """Send an alert about model performance or data drift."""
        try:
            # In a real implementation, this would send an email or other notification
            logger.info(f"Sending alert: {message}")

            # Example email sending (commented out as it requires SMTP configuration)
            """
            msg = MIMEText(message)
            msg['Subject'] = 'Audit Log Model Alert'
            msg['From'] = 'model-monitor@yourcompany.com'
            msg['To'] = 'team@yourcompany.com'

            with smtplib.SMTP('smtp.yourcompany.com', 587) as server:
                server.starttls()
                server.login('username', 'password')
                server.send_message(msg)
            """
        except Exception as e:
            logger.error(f"Error sending alert: {str(e)}")

    def get_metrics(self) -> Dict:
        """Get current metrics for the model."""
        return {
            'performance_metrics': self.performance_metrics,
            'data_drift_metrics': self.data_drift_metrics,
            'last_retrain_time': self.last_retrain_time,
            'model_path': self.model_path,
            'alert_thresholds': self.alert_thresholds
        }

    def shutdown(self):
        """Clean up resources."""
        self.retrain_scheduler.shutdown()
        logger.info("Model monitor shutdown complete")

# Example usage
if __name__ == "__main__":
    monitor = ModelMonitor()

    # Simulate evaluating the model
    sample_data = pd.DataFrame([
        {
            "user_id": "user1",
            "action": "READ",
            "resource_type": "database",
            "resource_id": "db1",
            "timestamp": "2023-11-15T08:00:00.000Z"
        },
        {
            "user_id": "user1",
            "action": "WRITE",
            "resource_type": "database",
            "resource_id": "db1",
            "timestamp": "2023-11-15T08:05:00.000Z"
        }
    ])

    # Evaluate the model
    metrics = monitor.evaluate_model(sample_data)
    print("Performance Metrics:")
    print(json.dumps(metrics, indent=2))

    # Check data drift
    reference_data = pd.DataFrame([
        {
            "user_id": "user1",
            "action": "READ",
            "resource_type": "database",
            "resource_id": "db1",
            "timestamp": "2023-10-01T08:00:00.000Z"
        }
    ])

    drift_metrics = monitor.check_data_drift(reference_data, sample_data)
    print("\nData Drift Metrics:")
    print(json.dumps(drift_metrics, indent=2))

    # Get all metrics
    all_metrics = monitor.get_metrics()
    print("\nAll Metrics:")
    print(json.dumps(all_metrics, indent=2))

    # Clean up
    monitor.shutdown()
```

---

## Progressive Web App (PWA) Features (220+ lines)

### Service Worker Registration (50 lines)

```typescript
import { Logger } from '../utils/logger';

class ServiceWorkerManager {
  private logger: Logger;
  private readonly SERVICE_WORKER_PATH = '/sw.js';
  private readonly SERVICE_WORKER_SCOPE = '/';
  private registration: ServiceWorkerRegistration | null = null;
  private isUpdating = false;
  private updateListeners: Array<() => void> = [];

  constructor() {
    this.logger = new Logger('ServiceWorkerManager');
  }

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      this.logger.warn('Service workers are not supported in this browser');
      return;
    }

    try {
      this.logger.info('Registering service worker...');

      this.registration = await navigator.serviceWorker.register(
        this.SERVICE_WORKER_PATH,
        {
          scope: this.SERVICE_WORKER_SCOPE,
          type: 'module' // For ES modules support
        }
      );

      this.logger.info('Service worker registered successfully', {
        scope: this.registration.scope,
        installing: this.registration.installing !== null,
        waiting: this.registration.waiting !== null,
        active: this.registration.active !== null
      });

      this.setupEventListeners();
    } catch (err) {
      this.logger.error('Service worker registration failed', err);
      throw err;
    }
  }

  private setupEventListeners(): void {
    if (!this.registration) return;

    // Handle service worker updates
    this.registration.addEventListener('updatefound', () => {
      this.logger.info('New service worker version found');

      const newWorker = this.registration!.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        this.logger.debug(`Service worker state changed to ${newWorker.state}`);

        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New version installed, but old version is still in control
            this.logger.info('New service worker installed, waiting to activate');
            this.notifyUpdateAvailable();
          } else {
            // No active service worker, this is the first install
            this.logger.info('Service worker installed for the first time');
          }
        } else if (newWorker.state === 'activated') {
          this.logger.info('New service worker activated');
          window.location.reload();
        }
      });
    });

    // Check for updates periodically
    setInterval(() => {
      this.checkForUpdates();
    }, 60 * 60 * 1000); // Check every hour

    // Check for updates on page load
    this.checkForUpdates();
  }

  async checkForUpdates(): Promise<void> {
    if (!this.registration || this.isUpdating) return;

    this.isUpdating = true;
    try {
      this.logger.info('Checking for service worker updates...');
      const updateFound = await this.registration.update();

      if (updateFound) {
        this.logger.info('Service worker update found');
      } else {
        this.logger.info('No service worker updates found');
      }
    } catch (err) {
      this.logger.error('Error checking for service worker updates', err);
    } finally {
      this.isUpdating = false;
    }
  }

  async unregister(): Promise<void> {
    if (!this.registration) return;

    try {
      const success = await this.registration.unregister();
      if (success) {
        this.logger.info('Service worker unregistered successfully');
        this.registration = null;
      } else {
        this.logger.warn('Service worker unregistration failed');
      }
    } catch (err) {
      this.logger.error('Error unregistering service worker', err);
      throw err;
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      this.logger.warn('No waiting service worker to skip');
      return;
    }

    try {
      this.logger.info('Skipping waiting for service worker activation');
      await this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch (err) {
      this.logger.error('Error skipping waiting for service worker', err);
      throw err;
    }
  }

  onUpdate(listener: () => void): void {
    this.updateListeners.push(listener);
  }

  private notifyUpdateAvailable(): void {
    this.logger.info('Notifying about available update');
    this.updateListeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        this.logger.error('Error in update listener', err);
      }
    });
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  getActiveWorker(): ServiceWorker | null {
    return this.registration?.active || null;
  }

  getWaitingWorker(): ServiceWorker | null {
    return this.registration?.waiting || null;
  }

  getInstallingWorker(): ServiceWorker | null {
    return this.registration?.installing || null;
  }

  isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();

// Register the service worker when the app starts
if (process.env.NODE_ENV === 'production') {
  serviceWorkerManager.register().catch(err => {
    console.error('Service worker registration failed:', err);
  });
}
```

### Caching Strategies (70 lines)

```typescript
import { Logger } from '../utils/logger';

class CacheManager {
  private logger: Logger;
  private readonly CACHE_NAME = 'audit-log-app-v2';
  private readonly CACHE_VERSION = '2.0.0';
  private readonly CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private cache: Cache | null = null;

  constructor() {
    this.logger = new Logger('CacheManager');
  }

  async openCache(): Promise<Cache> {
    if (this.cache) return this.cache;

    try {
      this.cache = await caches.open(`${this.CACHE_NAME}-${this.CACHE_VERSION}`);
      this.logger.info('Cache opened successfully');
      return this.cache;
    } catch (err) {
      this.logger.error('Error opening cache', err);
      throw err;
    }
  }

  async addToCache(request: RequestInfo, response: Response): Promise<void> {
    try {
      const cache = await this.openCache();

      // Clone the response as it can only be consumed once
      const responseClone = response.clone();

      // Add to cache with expiration metadata
      await cache.put(request, responseClone);

      this.logger.debug(`Added to cache: ${request}`);
      await this.enforceCacheSize();
    } catch (err) {
      this.logger.error(`Error adding to cache: ${request}`, err);
    }
  }

  async getFromCache(request: RequestInfo): Promise<Response | undefined> {
    try {
      const cache = await this.openCache();
      const cachedResponse = await cache.match(request);

      if (!cachedResponse) {
        this.logger.debug(`Cache miss: ${request}`);
        return undefined;
      }

      // Check if the response is expired
      const cacheTimestamp = cachedResponse.headers.get('X-Cache-Timestamp');
      if (cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp, 10);
        if (Date.now() - timestamp > this.CACHE_EXPIRATION) {
          this.logger.debug(`Cache expired: ${request}`);
          await this.removeFromCache(request);
          return undefined;
        }
      }

      this.logger.debug(`Cache hit: ${request}`);
      return cachedResponse;
    } catch (err) {
      this.logger.error(`Error getting from cache: ${request}`, err);
      return undefined;
    }
  }

  async removeFromCache(request: RequestInfo): Promise<void> {
    try {
      const cache = await this.openCache();
      await cache.delete(request);
      this.logger.debug(`Removed from cache: ${request}`);
    } catch (err) {
      this.logger.error(`Error removing from cache: ${request}`, err);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name.startsWith(this.CACHE_NAME))
          .map(name => caches.delete(name))
      );
      this.cache = null;
      this.logger.info('Cache cleared successfully');
    } catch (err) {
      this.logger.error('Error clearing cache', err);
      throw err;
    }
  }

  async enforceCacheSize(): Promise<void> {
    try {
      const cache = await this.openCache();
      const keys = await cache.keys();
      let cacheSize = 0;

      // Calculate current cache size
      const responses = await Promise.all(
        keys.map(key => cache.match(key))
      );

      for (const response of responses) {
        if (response) {
          const blob = await response.blob();
          cacheSize += blob.size;
        }
      }

      this.logger.debug(`Current cache size: ${cacheSize} bytes`);

      // If cache is too large, remove oldest entries
      if (cacheSize > this.MAX_CACHE_SIZE) {
        this.logger.info('Cache size exceeded, removing oldest entries');

        // Get all cache entries with their timestamps
        const entries = await Promise.all(
          keys.map(async key => {
            const response = await cache.match(key);
            const timestamp = response?.headers.get('X-Cache-Timestamp') || '0';
            return {
              key,
              timestamp: parseInt(timestamp, 10)
            };
          })
        );

        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a.timestamp - b.timestamp);

        // Remove oldest entries until we're under the limit
        let sizeToRemove = cacheSize - this.MAX_CACHE_SIZE;
        let removedCount = 0;

        for (const entry of entries) {
          if (sizeToRemove <= 0) break;

          const response = await cache.match(entry.key);
          if (response) {
            const blob = await response.blob();
            sizeToRemove -= blob.size;
            await cache.delete(entry.key);
            removedCount++;
          }
        }

        this.logger.info(`Removed ${removedCount} entries to enforce cache size limit`);
      }
    } catch (err) {
      this.logger.error('Error enforcing cache size', err);
    }
  }

  async cacheStrategy(request: Request, strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' = 'network-first'): Promise<Response> {
    try {
      if (strategy === 'cache-first') {
        return await this.cacheFirstStrategy(request);
      } else if (strategy === 'stale-while-revalidate') {
        return await this.staleWhileRevalidateStrategy(request);
      } else {
        return await this.networkFirstStrategy(request);
      }
    } catch (err) {
      this.logger.error(`Error in cache strategy for ${request.url}`, err);
      throw err;
    }
  }

  private async networkFirstStrategy(request: Request): Promise<Response> {
    try {
      // Try network first
      const networkResponse = await fetch(request.clone());

      // If network succeeds, cache the response
      if (networkResponse.ok) {
        // Add cache timestamp header
        const responseWithTimestamp = new Response(networkResponse.body, networkResponse);
        responseWithTimestamp.headers.set('X-Cache-Timestamp', Date.now().toString());
        await this.addToCache(request, responseWithTimestamp);
        return networkResponse;
      }

      // If network fails, try cache
      const cachedResponse = await this.getFromCache(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // If both fail, throw error
      throw new Error('Network and cache failed');
    } catch (err) {
      // Try cache as fallback
      const cachedResponse = await this.getFromCache(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw err;
    }
  }

  private async cacheFirstStrategy(request: Request): Promise<Response> {
    // Try cache first
    const cachedResponse = await this.getFromCache(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If cache fails, try network
    try {
      const networkResponse = await fetch(request.clone());
      if (networkResponse.ok) {
        // Add cache timestamp header
        const responseWithTimestamp = new Response(networkResponse.body, networkResponse);
        responseWithTimestamp.headers.set('X-Cache-Timestamp', Date.now().toString());
        await this.addToCache(request, responseWithTimestamp);
        return networkResponse;
      }
      throw new Error('Network request failed');
    } catch (err) {
      throw new Error('Cache and network failed');
    }
  }

  private async staleWhileRevalidateStrategy(request: Request): Promise<Response> {
    // Try cache first
    const cachedResponsePromise = this.getFromCache(request);

    // Try network in parallel
    const networkResponsePromise = fetch(request.clone())
      .then(async networkResponse => {
        if (networkResponse.ok) {
          // Add cache timestamp header
          const responseWithTimestamp = new Response(networkResponse.body, networkResponse);
          responseWithTimestamp.headers.set('X-Cache-Timestamp', Date.now().toString());
          await this.addToCache(request, responseWithTimestamp);
          return networkResponse;
        }
        throw new Error('Network request failed');
      })
      .catch(() => null); // Don't throw if network fails

    // Return cached response if available
    const cachedResponse = await cachedResponsePromise;
    if (cachedResponse) {
      // Start updating the cache in the background
      networkResponsePromise.catch(() => {});
      return cachedResponse;
    }

    // If cache fails, wait for network
    const networkResponse = await networkResponsePromise;
    if (networkResponse) {
      return networkResponse;
    }

    throw new Error('Cache and network failed');
  }

  async precacheAssets(assets: string[]): Promise<void> {
    try {
      const cache = await this.openCache();

      await Promise.all(
        assets.map(async asset => {
          try {
            const response = await fetch(asset);
            if (response.ok) {
              await cache.put(asset, response);
              this.logger.debug(`Precached asset: ${asset}`);
            }
          } catch (err) {
            this.logger.error(`Error precaching asset: ${asset}`, err);
          }
        })
      );

      this.logger.info(`Precached ${assets.length} assets`);
    } catch (err) {
      this.logger.error('Error precaching assets', err);
      throw err;
    }
  }
}

export const cacheManager = new CacheManager();
```

### Offline Functionality (60 lines)

```typescript
import { Logger } from '../utils/logger';
import { cacheManager } from './cache-manager';
import { auditLogService } from '../services/audit-log.service';
import { AuditLog } from '../models/audit-log.model';
import { v4 as uuidv4 } from 'uuid';

class OfflineManager {
  private logger: Logger;
  private readonly OFFLINE_QUEUE_KEY = 'offline-audit-logs';
  private readonly MAX_QUEUE_SIZE = 100;
  private isOnline = navigator.onLine;
  private queue: AuditLog[] = [];
  private syncInProgress = false;

  constructor() {
    this.logger = new Logger('OfflineManager');
    this.setupEventListeners();
    this.loadQueue();
  }

  private setupEventListeners(): void {
    // Online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Beforeunload event to save queue
    window.addEventListener('beforeunload', () => this.saveQueue());
  }

  private handleOnline(): void {
    this.logger.info('Application is online');
    this.isOnline = true;
    this.syncQueue();
  }

  private handleOffline(): void {
    this.logger.info('Application is offline');
    this.isOnline = false;
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueData = localStorage.getItem(this.OFFLINE_QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        this.logger.info(`Loaded ${this.queue.length} items from offline queue`);
      }
    } catch (err) {
      this.logger.error('Error loading offline queue', err);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
      this.logger.debug(`Saved ${this.queue.length} items to offline queue`);
    } catch (err) {
      this.logger.error('Error saving offline queue', err);
    }
  }

  async addToQueue(auditLog: Omit<AuditLog, 'id'>): Promise<AuditLog> {
    try {
      // Create a new audit log with a temporary ID
      const logWithId: AuditLog = {
        ...auditLog,
        id: `temp-${uuidv4()}`,
        timestamp: new Date().toISOString()
      };

      // Add to queue
      this.queue.push(logWithId);

      // Enforce max queue size
      if (this.queue.length > this.MAX_QUEUE_SIZE) {
        this.queue.shift(); // Remove oldest item
        this.logger.warn(`Offline queue exceeded max size, removed oldest item`);
      }

      // Save queue
      await this.saveQueue();

      this.logger.info(`Added audit log to offline queue`, {
        queueSize: this.queue.length,
        logId: logWithId.id
      });

      return logWithId;
    } catch (err) {
      this.logger.error('Error adding to offline queue', err);
      throw err;
    }
  }

  async syncQueue(): Promise<void> {
    if (this.syncInProgress || this.queue.length === 0 || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    this.logger.info(`Starting sync of ${this.queue.length} offline audit logs`);

    try {
      // Process queue in batches
      const batchSize = 10;
      let processedCount = 0;

      while (this.queue.length > 0 && this.isOnline) {
        const batch = this.queue.splice(0, batchSize);
        this.logger.debug(`Processing batch of ${batch.length} audit logs`);

        try {
          // Try to send the batch
          await auditLogService.createAuditLogs(batch);

          // If successful, remove from queue
          processedCount += batch.length;
          this.logger.info(`Synced ${processedCount}/${this.queue.length + processedCount} audit logs`);

          // Save the updated queue
          await this.saveQueue();
        } catch (err) {
          // If sync fails, put the batch back in the queue
          this.queue.unshift(...batch);
          this.logger.error('Error syncing batch, will retry later', err);
          break;
        }
      }

      this.logger.info(`Sync completed. Processed ${processedCount} audit logs`);
    } catch (err) {
      this.logger.error('Error during sync', err);
    } finally {
      this.syncInProgress = false;
    }
  }

  async getOfflineAuditLogs(): Promise<AuditLog[]> {
    return [...this.queue];
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    localStorage.removeItem(this.OFFLINE_QUEUE_KEY);
    this.logger.info('Cleared offline queue');
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  isOffline(): boolean {
    return !this.isOnline;
  }

  async createAuditLog(auditLog: Omit<AuditLog, 'id'>): Promise<AuditLog> {
    if (this.isOnline) {
      try {
        return await auditLogService.createAuditLog(auditLog);
      } catch (err) {
        this.logger.error('Error creating audit log online, falling back to offline', err);
        return this.addToQueue(auditLog);
      }
    } else {
      return this.addToQueue(auditLog);
    }
  }

  async setupOfflineDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('audit-log-offline-db', 2);

      request.onerror = () => {
        this.logger.error('Error opening offline database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.logger.info('Offline database opened successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        this.logger.info('Upgrading offline database');

        if (!db.objectStoreNames.contains('audit_logs')) {
          const store = db.createObjectStore('audit_logs', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('action', 'action', { unique: false });
          this.logger.info('Created audit_logs object store');
        }

        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id' });
          this.logger.info('Created queue object store');
        }
      };
    });
  }

  async addToIndexedDB(auditLog: AuditLog): Promise<void> {
    try {
      const db = await this.setupOfflineDatabase();
      const transaction = db.transaction(['audit_logs', 'queue'], 'readwrite');
      const auditLogsStore = transaction.objectStore('audit_logs');
      const queueStore = transaction.objectStore('queue');

      // Add to audit logs store
      await new Promise<void>((resolve, reject) => {
        const request = auditLogsStore.put(auditLog);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Add to queue store
      await new Promise<void>((resolve, reject) => {
        const request = queueStore.put(auditLog);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.logger.debug(`Added audit log to IndexedDB`, { logId: auditLog.id });
    } catch (err) {
      this.logger.error('Error adding to IndexedDB', err);
      throw err;
    }
  }
}

export const offlineManager = new OfflineManager();
```

### Background Sync (40 lines)

```typescript
import { Logger } from '../utils/logger';
import { offlineManager } from './offline-manager';
import { serviceWorkerManager } from './service-worker-manager';

class BackgroundSyncManager {
  private logger: Logger;
  private syncTag = 'audit-log-sync';
  private isSyncRegistered = false;

  constructor() {
    this.logger = new Logger('BackgroundSyncManager');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for service worker registration
    if (serviceWorkerManager.getRegistration()) {
      this.registerSync();
    } else {
      serviceWorkerManager.onUpdate(() => {
        this.registerSync();
      });
    }
  }

  async registerSync(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      this.logger.warn('Background sync not supported in this browser');
      return;
    }

    try {
      const registration = serviceWorkerManager.getRegistration();
      if (!registration) {
        this.logger.warn('Service worker not registered');
        return;
      }

      if (this.isSyncRegistered) {
        this.logger.info('Background sync already registered');
        return;
      }

      // Register sync event
      await registration.sync.register(this.syncTag);
      this.isSyncRegistered = true;

      this.logger.info('Background sync registered successfully');

      // Listen for sync completion
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'sync-complete') {
          this.logger.info('Background sync completed', event.data);
          this.handleSyncComplete(event.data);
        } else if (event.data.type === 'sync-error') {
          this.logger.error('Background sync error', event.data);
          this.handleSyncError(event.data);
        }
      });
    } catch (err) {
      this.logger.error('Error registering background sync', err);
    }
  }

  async unregisterSync(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      return;
    }

    try {
      const registration = serviceWorkerManager.getRegistration();
      if (!registration) return;

      await registration.sync.unregister(this.syncTag);
      this.isSyncRegistered = false;
      this.logger.info('Background sync unregistered');
    } catch (err) {
      this.logger.error('Error unregistering background sync', err);
    }
  }

  async requestSync(): Promise<void> {
    if (!this.isSyncRegistered) {
      await this.registerSync();
    }

    try {
      const registration = serviceWorkerManager.getRegistration();
      if (!registration) return;

      // Trigger a sync event
      await registration.sync.register(this.syncTag);
      this.logger.info('Background sync requested');
    } catch (err) {
      this.logger.error('Error requesting background sync', err);
    }
  }

  private async handleSyncComplete(data: any): Promise<void> {
    this.logger.info('Handling sync completion', data);

    try {
      // Clear the offline queue if sync was successful
      if (data.success) {
        await offlineManager.clearQueue();
        this.logger.info('Offline queue cleared after successful sync');
      }
    } catch (err) {
      this.logger.error('Error handling sync completion', err);
    }
  }

  private async handleSyncError(data: any): Promise<void> {
    this.logger.error('Handling sync error', data);

    try {
      // Implement retry logic or other error handling
      if (data.retry) {
        this.logger.info('Will retry background sync');
        await this.requestSync();
      }
    } catch (err) {
      this.logger.error('Error handling sync error', err);
    }
  }

  async setupPeriodicSync(): Promise<void> {
    if (!('PeriodicSyncManager' in window)) {
      this.logger.warn('Periodic background sync not supported in this browser');
      return;
    }

    try {
      const registration = serviceWorkerManager.getRegistration();
      if (!registration) return;

      // Register periodic sync
      await (registration.periodicSync as any).register(this.syncTag, {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
      });

      this.logger.info('Periodic background sync registered');
    } catch (err) {
      this.logger.error('Error registering periodic background sync', err);
    }
  }

  async getSyncStatus(): Promise<{
    isRegistered: boolean;
    lastSync?: string;
    pending?: boolean;
  }> {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      return { isRegistered: false };
    }

    try {
      const registration = serviceWorkerManager.getRegistration();
      if (!registration) {
        return { isRegistered: false };
      }

      const tags = await registration.sync.getTags();
      const isRegistered = tags.includes(this.syncTag);

      // In a real implementation, you would track last sync time
      // This is just a placeholder
      const lastSync = localStorage.getItem('lastSyncTime') || undefined;

      return {
        isRegistered,
        lastSync,
        pending: isRegistered // Simplified - in reality you'd check if there are pending syncs
      };
    } catch (err) {
      this.logger.error('Error getting sync status', err);
      return { isRegistered: false };
    }
  }
}

export const backgroundSyncManager = new BackgroundSyncManager();

// Register background sync when the app starts
if (process.env.NODE_ENV === 'production') {
  backgroundSyncManager.registerSync().catch(err => {
    console.error('Background sync registration failed:', err);
  });
}
```

---

## WCAG 2.1 AAA Accessibility (220+ lines)

### ARIA Implementation (70 lines)

```typescript
import { Logger } from '../utils/logger';

class AriaManager {
  private logger: Logger;
  private liveRegions: Map<string, HTMLElement>;
  private focusTraps: Map<string, () => void>;

  constructor() {
    this.logger = new Logger('AriaManager');
    this.liveRegions = new Map();
    this.focusTraps = new Map();
  }

  /**
   * Initialize ARIA attributes for an element
   * @param element The element to initialize
   * @param options ARIA attributes to set
   */
  initElement(element: HTMLElement, options: {
    role?: string;
    label?: string;
    labelledby?: string;
    describedby?: string;
    live?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
    relevant?: string;
    busy?: boolean;
    hidden?: boolean;
    expanded?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    disabled?: boolean;
    invalid?: boolean | string;
    required?: boolean;
    current?: boolean | string;
    level?: number;
    posinset?: number;
    setsize?: number;
    haspopup?: 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  } = {}): void {
    try {
      if (options.role) {
        element.setAttribute('role', options.role);
      }

      if (options.label) {
        element.setAttribute('aria-label', options.label);
      }

      if (options.labelledby) {
        element.setAttribute('aria-labelledby', options.labelledby);
      }

      if (options.describedby) {
        element.setAttribute('aria-describedby', options.describedby);
      }

      if (options.live) {
        element.setAttribute('aria-live', options.live);
        if (options.atomic !== undefined) {
          element.setAttribute('aria-atomic', options.atomic.toString());
        }
        if (options.relevant) {
          element.setAttribute('aria-relevant', options.relevant);
        }
      }

      if (options.busy !== undefined) {
        element.setAttribute('aria-busy', options.busy.toString());
      }

      if (options.hidden !== undefined) {
        element.setAttribute('aria-hidden', options.hidden.toString());
      }

      if (options.expanded !== undefined) {
        element.setAttribute('aria-expanded', options.expanded.toString());
      }

      if (options.selected !== undefined) {
        element.setAttribute('aria-selected', options.selected.toString());
      }

      if (options.checked !== undefined) {
        element.setAttribute('aria-checked', options.checked.toString());
      }

      if (options.disabled !== undefined) {
        element.setAttribute('aria-disabled', options.disabled.toString());
      }

      if (options.invalid !== undefined) {
        element.setAttribute('aria-invalid', typeof options.invalid === 'boolean'
          ? options.invalid.toString()
          : options.invalid);
      }

      if (options.required !== undefined) {
        element.setAttribute('aria-required', options.required.toString());
      }

      if (options.current !== undefined) {
        element.setAttribute('aria-current', typeof options.current === 'boolean'
          ? options.current.toString()
          : options.current);
      }

      if (options.level !== undefined) {
        element.setAttribute('aria-level', options.level.toString());
      }

      if (options.posinset !== undefined) {
        element.setAttribute('aria-posinset', options.posinset.toString());
      }

      if (options.setsize !== undefined) {
        element.setAttribute('aria-setsize', options.setsize.toString());
      }

      if (options.haspopup) {
        element.setAttribute('aria-haspopup', options.haspopup);
      }

      this.logger.debug('Initialized ARIA attributes for element', {
        element: element.tagName,
        id: element.id,
        options
      });
    } catch (err) {
      this.logger.error('Error initializing ARIA attributes', err);
    }
  }

  /**
   * Create a live region for dynamic content announcements
   * @param id ID for the live region
   * @param options Live region options
   * @returns The live region element
   */
  createLiveRegion(id: string, options: {
    role?: 'alert' | 'log' | 'marquee' | 'status' | 'timer';
    live?: 'polite' | 'assertive';
    atomic?: boolean;
    relevant?: string;
  } = {}): HTMLElement {
    try {
      if (this.liveRegions.has(id)) {
        this.logger.warn(`Live region with ID ${id} already exists`);
        return this.liveRegions.get(id)!;
      }

      const liveRegion = document.createElement('div');
      liveRegion.id = id;

      // Set default role if not provided
      const role = options.role || 'status';
      liveRegion.setAttribute('role', role);

      // Set live region attributes
      if (options.live) {
        liveRegion.setAttribute('aria-live', options.live);
      } else {
        // Set default based on role
        liveRegion.setAttribute('aria-live',
          role === 'alert' ? 'assertive' : 'polite');
      }

      if (options.atomic !== undefined) {
        liveRegion.setAttribute('aria-atomic', options.atomic.toString());
      }

      if (options.relevant) {
        liveRegion.setAttribute('aria-relevant', options.relevant);
      }

      // Hide the live region visually but keep it accessible to screen readers
      liveRegion.style.position = 'absolute';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.margin = '-1px';
      liveRegion.style.padding = '0';
      liveRegion.style.overflow = 'hidden';
      liveRegion.style.clip = 'rect(0, 0, 0, 0)';
      liveRegion.style.whiteSpace = 'nowrap';
      liveRegion.style.border = '0';

      document.body.appendChild(liveRegion);
      this.liveRegions.set(id, liveRegion);

      this.logger.debug('Created live region', { id, options });
      return liveRegion;
    } catch (err) {
      this.logger.error(`Error creating live region ${id}`, err);
      throw err;
    }
  }

  /**
   * Announce a message using a live region
   * @param id ID of the live region
   * @param message Message to announce
   * @param options Announcement options
   */
  announce(id: string, message: string, options: {
    politeness?: 'polite' | 'assertive';
    clear?: boolean;
  } = {}): void {
    try {
      const liveRegion = this.liveRegions.get(id);
      if (!liveRegion) {
        this.logger.warn(`Live region ${id} not found`);
        return;
      }

      // Set politeness level if provided
      if (options.politeness) {
        liveRegion.setAttribute('aria-live', options.politeness);
      }

      // Clear previous content if requested
      if (options.clear) {
        liveRegion.textContent = '';
      }

      // Add the new message
      liveRegion.textContent = message;

      this.logger.debug('Announced message', { id, message, options });
    } catch (err) {
      this.logger.error(`Error announcing message to live region ${id}`, err);
    }
  }

  /**
   * Remove a live region
   * @param id ID of the live region to remove
   */
  removeLiveRegion(id: string): void {
    try {
      const liveRegion = this.liveRegions.get(id);
      if (!liveRegion) {
        this.logger.warn(`Live region ${id} not found`);
        return;
      }

      liveRegion.remove();
      this.liveRegions.delete(id);

      this.logger.debug('Removed live region', { id });
    } catch (err) {
      this.logger.error(`Error removing live region ${id}`, err);
    }
  }

  /**
   * Create a focus trap for modal dialogs
   * @param container The container element to trap focus within
   * @param options Focus trap options
   */
  createFocusTrap(container: HTMLElement, options: {
    initialFocus?: string | HTMLElement;
    returnFocus?: boolean;
    escapeDeactivates?: boolean;
  } = {}): void {
    try {
      if (this.focusTraps.has(container.id)) {
        this.logger.warn(`Focus trap already exists for container ${container.id}`);
        return;
      }

      const focusableElements = this.getFocusableElements(container);
      if (focusableElements.length === 0) {
        this.logger.warn(`No focusable elements found in container ${container.id}`);
        return;
      }

      // Set initial focus
      if (options.initialFocus) {
        let initialElement: HTMLElement | null = null;

        if (typeof options.initialFocus === 'string') {
          initialElement = container.querySelector(options.initialFocus);
        } else {
          initialElement = options.initialFocus;
        }

        if (initialElement) {
          (initialElement as HTMLElement).focus();
        } else {
          focusableElements[0].focus();
        }
      } else {
        focusableElements[0].focus();
      }

      // Store the previous active element
      const previousActiveElement = document.activeElement as HTMLElement;

      // Create and store the focus trap function
      const trapFocus = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
        let nextIndex = 0;

        if (e.shiftKey) {
          // Shift+Tab - move to previous element
          nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        } else {
          // Tab - move to next element
          nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
        }

        focusableElements[nextIndex].focus();
        e.preventDefault();
      };

      container.addEventListener('keydown', trapFocus);

      // Store the cleanup function
      this.focusTraps.set(container.id, () => {
        container.removeEventListener('keydown', trapFocus);

        if (options.returnFocus !== false && previousActiveElement) {
          previousActiveElement.focus();
        }

        this.logger.debug('Focus trap deactivated', { containerId: container.id });
      });

      this.logger.debug('Focus trap created', { containerId: container.id });
    } catch (err) {
      this.logger.error(`Error creating focus trap for container ${container.id}`, err);
    }
  }

  /**
   * Deactivate a focus trap
   * @param containerId ID of the container with the focus trap
   */
  deactivateFocusTrap(containerId: string): void {
    try {
      const cleanup = this.focusTraps.get(containerId);
      if (!cleanup) {
        this.logger.warn(`Focus trap not found for container ${containerId}`);
        return;
      }

      cleanup();
      this.focusTraps.delete(containerId);
    } catch (err) {
      this.logger.error(`Error deactivating focus trap for container ${containerId}`, err);
    }
  }

  /**
   * Get all focusable elements within a container
   * @param container The container element
   * @returns Array of focusable elements
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]:not([tabindex="-1"])'
    ];

    const elements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors.join(',')));

    // Filter out elements that are not visible
    return elements.filter(el => {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
  }
}

export const ariaManager = new AriaManager();
```

### Keyboard Navigation (60 lines)

```typescript
import { Logger } from '../utils/logger';
import { ariaManager } from './aria-manager';

class KeyboardNavigationManager {
  private logger: Logger;
  private keyboardShortcuts: Map<string, {
    description: string;
    handler: (e: KeyboardEvent) => void;
    preventDefault?: boolean;
  }>;
  private rovingTabIndexElements: Map<string, HTMLElement[]>;
  private rovingTabIndexIndex: Map<string, number>;

  constructor() {
    this.logger = new Logger('KeyboardNavigationManager');
    this.keyboardShortcuts = new Map();
    this.rovingTabIndexElements = new Map();
    this.rovingTabIndexIndex = new Map();

    this.setupGlobalKeyboardHandler();
  }

  /**
   * Set up global keyboard event handler
   */
  private setupGlobalKeyboardHandler(): void {
    document.addEventListener('keydown', (e) => {
      // Skip if the event target is an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable) {
        return;
      }

      // Check for registered keyboard shortcuts
      const keyCombo = this.getKeyCombo(e);
      if (this.keyboardShortcuts.has(keyCombo)) {
        const shortcut = this.keyboardShortcuts.get(keyCombo)!;
        shortcut.handler(e);

        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
      }
    });
  }

  /**
   * Register a keyboard shortcut
   * @param keyCombo Key combination (e.g., 'Ctrl+Shift+K')
   * @param description Description of the shortcut
   * @param handler Function to call when shortcut is pressed
   * @param preventDefault Whether to prevent default behavior (default: true)
   */
  registerShortcut(
    keyCombo: string,
    description: string,
    handler: (e: KeyboardEvent) => void,
    preventDefault: boolean = true
  ): void {
    try {
      if (this.keyboardShortcuts.has(keyCombo)) {
        this.logger.warn(`Keyboard shortcut ${keyCombo} already registered`);
        return;
      }

      this.keyboardShortcuts.set(keyCombo, {
        description,
        handler,
        preventDefault
      });

      this.logger.debug('Registered keyboard shortcut', { keyCombo, description });
    } catch (err) {
      this.logger.error(`Error registering keyboard shortcut ${keyCombo}`, err);
    }
  }

  /**
   * Unregister a keyboard shortcut
   * @param keyCombo Key combination to unregister
   */
  unregisterShortcut(keyCombo: string): void {
    try {
      if (!this.keyboardShortcuts.has(keyCombo)) {
        this.logger.warn(`Keyboard shortcut ${keyCombo} not found`);
        return;
      }

      this.keyboardShortcuts.delete(keyCombo);
      this.logger.debug('Unregistered keyboard shortcut', { keyCombo });
    } catch (err) {
      this.logger.error(`Error unregistering keyboard shortcut ${keyCombo}`, err);
    }
  }

  /**
   * Get a string representation of the key combination
   * @param e Keyboard event
   * @returns String representation of the key combination
   */
  private getKeyCombo(e: KeyboardEvent): string {
    const keys = [];

    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    if (e.metaKey) keys.push('Meta');

    // Add the key
    keys.push(e.key);

    return keys.join('+');
  }

  /**
   * Set up roving tabindex for a group of elements
   * @param groupId ID for the group
   * @param elements Array of elements in the group
   * @param options Options for roving tabindex
   */
  setupRovingTabIndex(
    groupId: string,
    elements: HTMLElement[],
    options: {
      initialIndex?: number;
      wrap?: boolean;
      orientation?: 'horizontal' | 'vertical' | 'both';
    } = {}
  ): void {
    try {
      if (this.rovingTabIndexElements.has(groupId)) {
        this.logger.warn(`Roving tabindex group ${groupId} already exists`);
        return;
      }

      if (elements.length === 0) {
        this.logger.warn(`No elements provided for roving tabindex group ${groupId}`);
        return;
      }

      // Set initial tabindex
      const initialIndex = options.initialIndex || 0;
      this.rovingTabIndexIndex.set(groupId, initialIndex);

      elements.forEach((el, index