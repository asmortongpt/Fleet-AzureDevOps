# TO_BE_DESIGN.md - Notifications-Alerts Module
*(Comprehensive System Design - 2000+ lines)*

---

## **Executive Vision** *(120+ lines)*

### **1. Strategic Vision: The Future of Notifications & Alerts**
The enhanced **Notifications-Alerts Module** will transform how users interact with time-sensitive information, evolving from a basic messaging system into a **smart, context-aware, real-time engagement platform**. This redesign aligns with three core business objectives:

1. **Hyper-Personalization at Scale**
   - Move beyond generic "one-size-fits-all" notifications to **AI-driven, user-specific alerts** that adapt to behavior, preferences, and real-time context.
   - Example: A user who frequently dismisses "low-priority" alerts will see fewer of them, while critical alerts (e.g., fraud detection) bypass all filters.

2. **Omnichannel Engagement**
   - Unify notifications across **email, SMS, push, in-app, and emerging channels** (e.g., smartwatches, voice assistants) with a **single API**.
   - Example: A payment failure triggers:
     - **Push notification** (immediate)
     - **SMS** (if push fails)
     - **Email** (detailed troubleshooting)
     - **In-app banner** (persistent until resolved)

3. **Proactive vs. Reactive Alerts**
   - Shift from **reactive** (user-initiated actions) to **proactive** (system-initiated predictions).
   - Example:
     - **Reactive**: "Your payment failed."
     - **Proactive**: "Your payment will likely fail in 24 hours due to insufficient funds. [Add Funds Now]"

---

### **2. Business Transformation Goals**
| **Goal**                     | **Current State**               | **Future State**                                                                 | **KPI**                                  |
|------------------------------|---------------------------------|---------------------------------------------------------------------------------|------------------------------------------|
| **User Engagement**          | 30% open rate (push)            | 70% open rate via AI-optimized timing/content                                   | Open/Click-Through Rate (CTR)            |
| **Operational Efficiency**   | 5 FTEs managing notifications   | 0.5 FTEs via automation + self-service tools                                    | Cost per Notification (CPN)              |
| **Revenue Impact**           | $0 direct revenue               | $2M/year via upsell alerts (e.g., "Upgrade to avoid service interruption")      | Revenue per User (RPU)                   |
| **Churn Reduction**          | 12% monthly churn               | 5% monthly churn via proactive retention alerts                                 | Customer Retention Rate                  |
| **Compliance**               | Manual GDPR/CCPA checks         | Automated compliance with real-time consent management                          | Audit Pass Rate                          |

---

### **3. User Experience (UX) Improvements**
#### **3.1. The "Zero Annoyance" Principle**
- **Problem**: Users ignore or disable notifications due to **alert fatigue**.
- **Solution**:
  - **Adaptive Frequency Capping**: AI dynamically adjusts how often a user sees similar alerts (e.g., "You’ve seen 3 ‘Payment Failed’ alerts this week; we’ll mute the next one").
  - **Smart Bundling**: Group related alerts (e.g., "3 new messages from Support" instead of 3 separate pings).
  - **Contextual Delivery**: Suppress non-urgent alerts during user-defined "focus hours" (e.g., 9 AM–12 PM).

#### **3.2. The "One-Tap Resolution" Standard**
- **Problem**: Users abandon flows due to multi-step resolution.
- **Solution**:
  - **Embedded Actions**: Buttons directly in the notification (e.g., "Approve Request" in a push alert).
  - **Deep Linking**: Navigate users to the exact screen (e.g., "View Invoice #12345" opens the invoice detail).
  - **Progressive Disclosure**: Show minimal info first, expand on demand (e.g., "Your flight is delayed [+] Show new gate").

#### **3.3. Accessibility as a Default**
- **Problem**: Notifications are inaccessible to users with disabilities.
- **Solution**:
  - **WCAG 2.1 AAA Compliance**: Screen-reader optimization, keyboard navigation, and high-contrast modes.
  - **Multimodal Alerts**: Combine visual + auditory + haptic feedback (e.g., vibration patterns for urgency levels).
  - **Customizable Alert Styles**: Users can adjust font size, colors, and sounds.

---

### **4. Competitive Advantages**
| **Feature**                  | **Competitors** (e.g., Slack, Intercom) | **Our Advantage**                                                                 |
|------------------------------|----------------------------------------|----------------------------------------------------------------------------------|
| **AI-Powered Prioritization** | Static priority levels                 | Dynamic scoring based on user behavior, time of day, and content relevance       |
| **Omnichannel Orchestration** | Separate APIs per channel              | Unified API with fallback routing (e.g., push → SMS → email)                     |
| **Proactive Alerts**         | Reactive only                          | Predictive alerts (e.g., "Your subscription renews in 7 days; update payment")   |
| **Gamification**             | None                                   | Badges, streaks, and leaderboards to encourage engagement                        |
| **Developer Experience**     | Complex SDKs                           | Low-code UI + GraphQL API for rapid integration                                  |

---

### **5. Long-Term Roadmap (2024–2026)**
#### **Phase 1: Foundation (Q1–Q2 2024)**
- **Core**: Real-time WebSocket infrastructure, Redis caching, basic AI prioritization.
- **UX**: PWA support, WCAG 2.1 AAA compliance, smart bundling.
- **DevOps**: Kubernetes migration, CI/CD pipelines.

#### **Phase 2: Intelligence (Q3–Q4 2024)**
- **AI/ML**: Predictive alerts, sentiment analysis (e.g., detect frustration in support tickets).
- **Omnichannel**: Voice assistant integration (Alexa, Google Assistant), smartwatch support.
- **Analytics**: Real-time dashboards with anomaly detection.

#### **Phase 3: Ecosystem (2025–2026)**
- **Marketplace**: Third-party app integrations (e.g., Zapier, Salesforce).
- **Blockchain**: Immutable audit logs for compliance (e.g., HIPAA, GDPR).
- **AR/VR**: Notifications in augmented reality (e.g., "Your meeting starts in 5 mins" in AR glasses).

---

## **Performance Enhancements** *(300+ lines)*

### **1. Redis Caching Layer** *(50+ lines)*
```typescript
// src/cache/notificationCache.ts
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';
import { Notification } from '../models/notification.model';

class NotificationCache {
  private client: RedisClientType;
  private readonly TTL_SECONDS = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'notif:';

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        tls: process.env.REDIS_TLS === 'true',
        rejectUnauthorized: false,
      },
    });

    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    this.client.connect().catch((err) => {
      logger.error('Redis connection failed:', err);
    });
  }

  /**
   * Cache a notification with a TTL.
   * @param notification - The notification to cache.
   * @returns Promise<void>
   */
  async cacheNotification(notification: Notification): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}${notification.id}`;
      const value = JSON.stringify(notification);
      await this.client.set(key, value, { EX: this.TTL_SECONDS });
      logger.debug(`Cached notification ${notification.id}`);
    } catch (err) {
      logger.error('Failed to cache notification:', err);
      throw new Error('Cache write failed');
    }
  }

  /**
   * Retrieve a cached notification.
   * @param id - The notification ID.
   * @returns Promise<Notification | null>
   */
  async getCachedNotification(id: string): Promise<Notification | null> {
    try {
      const key = `${this.CACHE_PREFIX}${id}`;
      const cached = await this.client.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as Notification;
    } catch (err) {
      logger.error('Failed to retrieve cached notification:', err);
      return null;
    }
  }

  /**
   * Invalidate a cached notification.
   * @param id - The notification ID.
   * @returns Promise<void>
   */
  async invalidateNotification(id: string): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}${id}`;
      await this.client.del(key);
      logger.debug(`Invalidated cache for notification ${id}`);
    } catch (err) {
      logger.error('Failed to invalidate cache:', err);
    }
  }

  /**
   * Cache a user's notification preferences.
   * @param userId - The user ID.
   * @param preferences - The preferences object.
   * @returns Promise<void>
   */
  async cachePreferences(userId: string, preferences: object): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}prefs:${userId}`;
      await this.client.set(key, JSON.stringify(preferences), { EX: this.TTL_SECONDS });
    } catch (err) {
      logger.error('Failed to cache preferences:', err);
    }
  }

  /**
   * Retrieve cached preferences for a user.
   * @param userId - The user ID.
   * @returns Promise<object | null>
   */
  async getCachedPreferences(userId: string): Promise<object | null> {
    try {
      const key = `${this.CACHE_PREFIX}prefs:${userId}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      logger.error('Failed to retrieve cached preferences:', err);
      return null;
    }
  }
}

export const notificationCache = new NotificationCache();
```

---

### **2. Database Query Optimization** *(50+ lines)*
```typescript
// src/repositories/notification.repository.ts
import { PrismaClient, Notification, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { notificationCache } from '../cache/notificationCache';

const prisma = new PrismaClient();

class NotificationRepository {
  /**
   * Fetch notifications for a user with pagination and filtering.
   * Optimized with:
   * - Indexed queries (userId + createdAt)
   * - Selective field fetching
   * - Cursor-based pagination
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
      status?: 'READ' | 'UNREAD' | 'ARCHIVED';
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    } = {}
  ): Promise<{ notifications: Notification[]; nextCursor?: string }> {
    const { limit = 20, cursor, status, priority } = options;

    try {
      // Check cache first for recent notifications
      const cacheKey = `user:${userId}:notifs:${status || 'all'}:${priority || 'all'}`;
      const cached = await notificationCache.getCachedPreferences(cacheKey);
      if (cached) {
        logger.debug('Returning cached notifications for user', userId);
        return cached as { notifications: Notification[]; nextCursor?: string };
      }

      // Build the query with indexed fields
      const where: Prisma.NotificationWhereInput = {
        userId,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(cursor && { id: { lt: cursor } }), // Cursor-based pagination
      };

      const notifications = await prisma.notification.findMany({
        where,
        take: limit + 1, // Fetch one extra to check for next cursor
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          body: true,
          status: true,
          priority: true,
          createdAt: true,
          metadata: true,
          channel: true,
        },
      });

      let nextCursor: string | undefined;
      if (notifications.length > limit) {
        nextCursor = notifications.pop()?.id;
      }

      const result = { notifications, nextCursor };

      // Cache the result
      await notificationCache.cachePreferences(cacheKey, result);

      return result;
    } catch (err) {
      logger.error('Failed to fetch notifications:', err);
      throw new Error('Database query failed');
    }
  }

  /**
   * Batch update notification statuses (e.g., mark all as read).
   * Optimized with:
   * - Transaction for atomicity
   * - Bulk update
   */
  async batchUpdateStatus(
    notificationIds: string[],
    status: 'READ' | 'UNREAD' | 'ARCHIVED'
  ): Promise<number> {
    try {
      const result = await prisma.notification.updateMany({
        where: { id: { in: notificationIds } },
        data: { status },
      });

      // Invalidate cache for affected notifications
      await Promise.all(
        notificationIds.map((id) => notificationCache.invalidateNotification(id))
      );

      return result.count;
    } catch (err) {
      logger.error('Failed to batch update notifications:', err);
      throw new Error('Batch update failed');
    }
  }

  /**
   * Count unread notifications for a user (optimized for dashboard widgets).
   */
  async countUnread(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: { userId, status: 'UNREAD' },
      });
    } catch (err) {
      logger.error('Failed to count unread notifications:', err);
      throw new Error('Count query failed');
    }
  }
}

export const notificationRepository = new NotificationRepository();
```

---

### **3. API Response Compression** *(30+ lines)*
```typescript
// src/middleware/compression.middleware.ts
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { logger } from '../utils/logger';

/**
 * Middleware to compress API responses based on:
 * - Accept-Encoding header
 * - Response size thresholds
 * - Content type
 */
export function compressionMiddleware() {
  return compression({
    threshold: 1024, // Only compress responses >1KB
    filter: (req: Request, res: Response) => {
      // Skip compression for small responses or non-JSON content
      if (req.headers['x-no-compression']) return false;
      if (res.getHeader('Content-Type')?.includes('image/')) return false;
      return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression ratio
    strategy: 0, // Z_DEFAULT_STRATEGY
    chunkSize: 16384, // 16KB chunks
    windowBits: 15,
    memLevel: 8,
  });
}

/**
 * Custom compression for WebSocket messages.
 * @param data - The data to compress.
 * @returns Compressed data as Buffer.
 */
export function compressWebSocketData(data: any): Buffer {
  try {
    const json = JSON.stringify(data);
    const input = Buffer.from(json, 'utf8');
    return require('zlib').deflateSync(input, {
      level: 6,
      chunkSize: 16384,
    });
  } catch (err) {
    logger.error('WebSocket compression failed:', err);
    throw new Error('Compression failed');
  }
}

/**
 * Decompress WebSocket data.
 * @param data - The compressed data.
 * @returns Decompressed object.
 */
export function decompressWebSocketData(data: Buffer): any {
  try {
    const decompressed = require('zlib').inflateSync(data);
    return JSON.parse(decompressed.toString('utf8'));
  } catch (err) {
    logger.error('WebSocket decompression failed:', err);
    throw new Error('Decompression failed');
  }
}
```

---

### **4. Lazy Loading Implementation** *(40+ lines)*
```typescript
// src/utils/lazyLoader.ts
import { Notification } from '../models/notification.model';
import { notificationRepository } from '../repositories/notification.repository';
import { logger } from './logger';

/**
 * Lazy-load notifications in batches to improve performance.
 * Used for:
 * - Infinite scroll in the UI
 * - Background sync
 * - Offline-first apps
 */
export class LazyNotificationLoader {
  private readonly BATCH_SIZE = 10;
  private readonly MAX_RETRIES = 3;
  private userId: string;
  private lastCursor?: string;
  private isLoading = false;
  private retryCount = 0;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Load the next batch of notifications.
   * @param options - Filter options (status, priority).
   * @returns Promise<Notification[]>
   */
  async loadNextBatch(options: {
    status?: 'READ' | 'UNREAD' | 'ARCHIVED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } = {}): Promise<Notification[]> {
    if (this.isLoading) {
      logger.warn('Load already in progress');
      return [];
    }

    this.isLoading = true;

    try {
      const { notifications, nextCursor } = await notificationRepository.getUserNotifications(
        this.userId,
        {
          limit: this.BATCH_SIZE,
          cursor: this.lastCursor,
          ...options,
        }
      );

      this.lastCursor = nextCursor;
      this.retryCount = 0;
      return notifications;
    } catch (err) {
      logger.error('Failed to load batch:', err);
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        return this.loadNextBatch(options);
      }
      throw new Error('Max retries exceeded');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Reset the loader (e.g., after a refresh).
   */
  reset(): void {
    this.lastCursor = undefined;
    this.retryCount = 0;
  }

  /**
   * Check if more notifications are available.
   * @returns Promise<boolean>
   */
  async hasMore(): Promise<boolean> {
    if (!this.lastCursor) return true; // First load
    try {
      const { notifications } = await notificationRepository.getUserNotifications(
        this.userId,
        { cursor: this.lastCursor, limit: 1 }
      );
      return notifications.length > 0;
    } catch (err) {
      logger.error('Failed to check for more notifications:', err);
      return false;
    }
  }
}
```

---

### **5. Request Debouncing** *(30+ lines)*
```typescript
// src/utils/debouncer.ts
import { logger } from './logger';

type DebouncedFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void;

/**
 * Debounce API calls to avoid rate limits and improve performance.
 * Example use cases:
 * - Search-as-you-type
 * - Rapid UI interactions (e.g., marking notifications as read)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastArgs: Parameters<T> | null = null;

  return function debounced(...args: Parameters<T>): void {
    const now = Date.now();
    const elapsed = now - lastCallTime;

    lastCallTime = now;
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      try {
        func(...lastArgs!);
      } catch (err) {
        logger.error('Debounced function failed:', err);
      } finally {
        timeoutId = null;
      }
    }, Math.max(0, waitMs - elapsed));
  };
}

/**
 * Debounce a function with a leading edge (execute immediately on first call).
 */
export function debounceWithLeading<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastArgs: Parameters<T> | null = null;
  let hasLeadingExecuted = false;

  return function debounced(...args: Parameters<T>): void {
    const now = Date.now();
    const elapsed = now - lastCallTime;

    lastCallTime = now;
    lastArgs = args;

    if (!hasLeadingExecuted) {
      hasLeadingExecuted = true;
      try {
        func(...args);
      } catch (err) {
        logger.error('Leading debounce failed:', err);
      }
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      hasLeadingExecuted = false;
      timeoutId = null;
    }, waitMs);
  };
}
```

---

### **6. Connection Pooling** *(30+ lines)*
```typescript
// src/database/connectionPool.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

class ConnectionPool {
  private static instance: PrismaClient;
  private static MAX_CONNECTIONS = 50;
  private static IDLE_TIMEOUT = 30000; // 30 seconds
  private static CONNECTION_TIMEOUT = 5000; // 5 seconds

  private constructor() {
    // Private to enforce singleton
  }

  /**
   * Get the Prisma client instance with connection pooling.
   */
  public static getInstance(): PrismaClient {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ],
        errorFormat: 'pretty',
        // Connection pool settings
        pool: {
          max: ConnectionPool.MAX_CONNECTIONS,
          idleTimeout: ConnectionPool.IDLE_TIMEOUT,
          connectionTimeout: ConnectionPool.CONNECTION_TIMEOUT,
        },
      });

      // Log Prisma events
      ConnectionPool.instance.$on('query', (e) => {
        logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
      });

      ConnectionPool.instance.$on('error', (e) => {
        logger.error('Prisma error:', e);
      });
    }
    return ConnectionPool.instance;
  }

  /**
   * Gracefully disconnect the pool.
   */
  public static async disconnect(): Promise<void> {
    if (ConnectionPool.instance) {
      await ConnectionPool.instance.$disconnect();
      logger.info('Database connection pool closed');
    }
  }
}

export const prisma = ConnectionPool.getInstance();
```

---

## **Real-Time Features** *(300+ lines)*

### **1. WebSocket Server Setup** *(60+ lines)*
```typescript
// src/websocket/server.ts
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { logger } from '../utils/logger';
import { authenticateWebSocket } from './auth';
import { WebSocketMessage } from './types';
import { compressWebSocketData, decompressWebSocketData } from '../middleware/compression.middleware';

export class NotificationWebSocketServer {
  private wss: WebSocketServer;
  private readonly PING_INTERVAL = 30000; // 30 seconds
  private readonly MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB

  constructor(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws/notifications' });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleError.bind(this));

    // Heartbeat to detect dead connections
    setInterval(this.pingClients.bind(this), this.PING_INTERVAL);

    logger.info('WebSocket server started on /ws/notifications');
  }

  /**
   * Handle a new WebSocket connection.
   */
  private async handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    try {
      // Parse query params (e.g., ?token=...)
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Missing authentication token');
        return;
      }

      // Authenticate the connection
      const user = await authenticateWebSocket(token);
      if (!user) {
        ws.close(1008, 'Invalid token');
        return;
      }

      // Attach user metadata to the WebSocket
      (ws as any).user = user;

      // Set up message handlers
      ws.on('message', (data) => this.handleMessage(ws, data));
      ws.on('close', () => this.handleClose(ws));
      ws.on('pong', () => this.handlePong(ws));

      logger.info(`WebSocket connected for user ${user.id}`);
    } catch (err) {
      logger.error('WebSocket connection error:', err);
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Handle incoming WebSocket messages.
   */
  private handleMessage(ws: WebSocket, data: WebSocket.Data): void {
    try {
      // Check message size
      if (data instanceof Buffer && data.length > this.MAX_MESSAGE_SIZE) {
        ws.close(1009, 'Message too large');
        return;
      }

      // Decompress the message
      const decompressed = decompressWebSocketData(data as Buffer);
      const message: WebSocketMessage = decompressed;

      // Validate message structure
      if (!message.type || !message.payload) {
        ws.send(
          this.createErrorResponse('INVALID_MESSAGE', 'Missing type or payload')
        );
        return;
      }

      // Route the message to the appropriate handler
      switch (message.type) {
        case 'SUBSCRIBE':
          this.handleSubscribe(ws, message.payload);
          break;
        case 'UNSUBSCRIBE':
          this.handleUnsubscribe(ws, message.payload);
          break;
        case 'MARK_AS_READ':
          this.handleMarkAsRead(ws, message.payload);
          break;
        default:
          ws.send(this.createErrorResponse('UNKNOWN_TYPE', 'Invalid message type'));
      }
    } catch (err) {
      logger.error('WebSocket message handling failed:', err);
      ws.send(this.createErrorResponse('INTERNAL_ERROR', 'Processing failed'));
    }
  }

  /**
   * Handle WebSocket close events.
   */
  private handleClose(ws: WebSocket): void {
    logger.info(`WebSocket disconnected for user ${(ws as any).user?.id}`);
  }

  /**
   * Handle pong responses (heartbeat).
   */
  private handlePong(ws: WebSocket): void {
    (ws as any).isAlive = true;
  }

  /**
   * Ping all clients to check for dead connections.
   */
  private pingClients(): void {
    this.wss.clients.forEach((ws) => {
      if (!(ws as any).isAlive) {
        ws.terminate();
        return;
      }

      (ws as any).isAlive = false;
      ws.ping();
    });
  }

  /**
   * Handle subscription to a notification channel.
   */
  private handleSubscribe(ws: WebSocket, payload: any): void {
    if (!payload?.channel) {
      ws.send(this.createErrorResponse('INVALID_PAYLOAD', 'Missing channel'));
      return;
    }

    // Add the WebSocket to the channel's room
    const room = `channel:${payload.channel}`;
    if (!(ws as any).rooms) {
      (ws as any).rooms = new Set();
    }
    (ws as any).rooms.add(room);

    ws.send(this.createSuccessResponse('SUBSCRIBED', { channel: payload.channel }));
    logger.debug(`User ${(ws as any).user.id} subscribed to ${room}`);
  }

  /**
   * Handle unsubscription from a channel.
   */
  private handleUnsubscribe(ws: WebSocket, payload: any): void {
    if (!payload?.channel) {
      ws.send(this.createErrorResponse('INVALID_PAYLOAD', 'Missing channel'));
      return;
    }

    const room = `channel:${payload.channel}`;
    if ((ws as any).rooms?.has(room)) {
      (ws as any).rooms.delete(room);
      ws.send(this.createSuccessResponse('UNSUBSCRIBED', { channel: payload.channel }));
    } else {
      ws.send(this.createErrorResponse('NOT_SUBSCRIBED', 'Not subscribed to channel'));
    }
  }

  /**
   * Broadcast a message to all clients in a room.
   */
  public broadcastToRoom(room: string, message: WebSocketMessage): void {
    this.wss.clients.forEach((ws) => {
      if ((ws as any).rooms?.has(room) && ws.readyState === ws.OPEN) {
        try {
          const compressed = compressWebSocketData(message);
          ws.send(compressed);
        } catch (err) {
          logger.error('Broadcast failed:', err);
        }
      }
    });
  }

  /**
   * Send a message to a specific client.
   */
  public sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === ws.OPEN) {
      try {
        const compressed = compressWebSocketData(message);
        ws.send(compressed);
      } catch (err) {
        logger.error('Send to client failed:', err);
      }
    }
  }

  /**
   * Create a success response.
   */
  private createSuccessResponse(type: string, payload: any): string {
    return JSON.stringify({
      status: 'SUCCESS',
      type,
      payload,
    });
  }

  /**
   * Create an error response.
   */
  private createErrorResponse(code: string, message: string): string {
    return JSON.stringify({
      status: 'ERROR',
      code,
      message,
    });
  }

  /**
   * Handle errors.
   */
  private handleError(err: Error): void {
    logger.error('WebSocket server error:', err);
  }
}
```

---

### **2. Real-Time Event Handlers** *(80+ lines)*
```typescript
// src/websocket/handlers.ts
import { NotificationWebSocketServer } from './server';
import { notificationRepository } from '../repositories/notification.repository';
import { logger } from '../utils/logger';
import { WebSocketMessage } from './types';
import { Notification } from '../models/notification.model';

export class WebSocketEventHandlers {
  private wsServer: NotificationWebSocketServer;

  constructor(wsServer: NotificationWebSocketServer) {
    this.wsServer = wsServer;
  }

  /**
   * Handle a new notification event.
   */
  public async handleNewNotification(notification: Notification): Promise<void> {
    try {
      const room = `user:${notification.userId}`;
      const message: WebSocketMessage = {
        type: 'NEW_NOTIFICATION',
        payload: {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          priority: notification.priority,
          createdAt: notification.createdAt.toISOString(),
          metadata: notification.metadata,
        },
      };

      this.wsServer.broadcastToRoom(room, message);

      // Log the event
      logger.info(
        `Broadcasted NEW_NOTIFICATION to ${room} for notification ${notification.id}`
      );
    } catch (err) {
      logger.error('Failed to handle new notification:', err);
    }
  }

  /**
   * Handle a notification status update (e.g., read/archived).
   */
  public async handleStatusUpdate(
    notificationId: string,
    userId: string,
    status: 'READ' | 'UNREAD' | 'ARCHIVED'
  ): Promise<void> {
    try {
      const room = `user:${userId}`;
      const message: WebSocketMessage = {
        type: 'STATUS_UPDATE',
        payload: {
          id: notificationId,
          status,
        },
      };

      this.wsServer.broadcastToRoom(room, message);
      logger.info(`Broadcasted STATUS_UPDATE to ${room} for notification ${notificationId}`);
    } catch (err) {
      logger.error('Failed to handle status update:', err);
    }
  }

  /**
   * Handle a bulk status update (e.g., mark all as read).
   */
  public async handleBulkStatusUpdate(
    userId: string,
    notificationIds: string[],
    status: 'READ' | 'UNREAD' | 'ARCHIVED'
  ): Promise<void> {
    try {
      const room = `user:${userId}`;
      const message: WebSocketMessage = {
        type: 'BULK_STATUS_UPDATE',
        payload: {
          notificationIds,
          status,
        },
      };

      this.wsServer.broadcastToRoom(room, message);
      logger.info(`Broadcasted BULK_STATUS_UPDATE to ${room} for ${notificationIds.length} notifications`);
    } catch (err) {
      logger.error('Failed to handle bulk status update:', err);
    }
  }

  /**
   * Handle a user preference update (e.g., channel preferences).
   */
  public async handlePreferenceUpdate(userId: string, preferences: any): Promise<void> {
    try {
      const room = `user:${userId}`;
      const message: WebSocketMessage = {
        type: 'PREFERENCE_UPDATE',
        payload: preferences,
      };

      this.wsServer.broadcastToRoom(room, message);
      logger.info(`Broadcasted PREFERENCE_UPDATE to ${room}`);
    } catch (err) {
      logger.error('Failed to handle preference update:', err);
    }
  }

  /**
   * Handle a real-time analytics event (e.g., notification opened).
   */
  public async handleAnalyticsEvent(
    userId: string,
    eventType: 'OPENED' | 'CLICKED' | 'DISMISSED',
    notificationId: string
  ): Promise<void> {
    try {
      const room = `user:${userId}`;
      const message: WebSocketMessage = {
        type: 'ANALYTICS_EVENT',
        payload: {
          notificationId,
          eventType,
          timestamp: new Date().toISOString(),
        },
      };

      this.wsServer.broadcastToRoom(room, message);
      logger.debug(`Broadcasted ANALYTICS_EVENT to ${room}`);
    } catch (err) {
      logger.error('Failed to handle analytics event:', err);
    }
  }

  /**
   * Handle a user coming online (e.g., after reconnect).
   */
  public async handleUserOnline(userId: string): Promise<void> {
    try {
      // Fetch unread count and send to the user
      const unreadCount = await notificationRepository.countUnread(userId);
      const room = `user:${userId}`;
      const message: WebSocketMessage = {
        type: 'USER_ONLINE',
        payload: {
          unreadCount,
          lastActive: new Date().toISOString(),
        },
      };

      this.wsServer.broadcastToRoom(room, message);
      logger.info(`User ${userId} came online; sent unread count: ${unreadCount}`);
    } catch (err) {
      logger.error('Failed to handle user online:', err);
    }
  }

  /**
   * Handle a user marking a notification as read.
   */
  public async handleMarkAsRead(ws: WebSocket, payload: any): Promise<void> {
    if (!payload?.id) {
      this.wsServer.sendToClient(
        ws,
        this.createErrorResponse('INVALID_PAYLOAD', 'Missing notification ID')
      );
      return;
    }

    try {
      const userId = (ws as any).user.id;
      const updated = await notificationRepository.batchUpdateStatus(
        [payload.id],
        'READ'
      );

      if (updated > 0) {
        await this.handleStatusUpdate(payload.id, userId, 'READ');
        this.wsServer.sendToClient(
          ws,
          this.createSuccessResponse('MARK_AS_READ', { id: payload.id })
        );
      } else {
        this.wsServer.sendToClient(
          ws,
          this.createErrorResponse('NOT_FOUND', 'Notification not found')
        );
      }
    } catch (err) {
      logger.error('Failed to mark notification as read:', err);
      this.wsServer.sendToClient(
        ws,
        this.createErrorResponse('INTERNAL_ERROR', 'Update failed')
      );
    }
  }

  /**
   * Create a success response.
   */
  private createSuccessResponse(type: string, payload: any): WebSocketMessage {
    return {
      status: 'SUCCESS',
      type,
      payload,
    };
  }

  /**
   * Create an error response.
   */
  private createErrorResponse(code: string, message: string): WebSocketMessage {
    return {
      status: 'ERROR',
      code,
      message,
    };
  }
}
```

---

### **3. Client-Side WebSocket Integration** *(60+ lines)*
```typescript
// src/frontend/websocket/client.ts
import { debounce } from '../../utils/debouncer';
import { logger } from '../../utils/logger';
import { WebSocketMessage } from './types';

export class NotificationWebSocketClient {
  private ws: WebSocket | null = null;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private reconnectAttempts = 0;
  private readonly messageHandlers: Map<string, (payload: any) => void> = new Map();
  private readonly eventListeners: Map<string, (() => void)[]> = new Map();
  private readonly token: string;
  private readonly userId: string;

  constructor(token: string, userId: string) {
    this.token = token;
    this.userId = userId;
    this.connect();
  }

  /**
   * Connect to the WebSocket server.
   */
  private connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const url = `${process.env.WS_URL}/ws/notifications?token=${this.token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);

    logger.info('WebSocket client connecting...');
  }

  /**
   * Handle WebSocket open event.
   */
  private handleOpen(): void {
    this.reconnectAttempts = 0;
    logger.info('WebSocket connected');

    // Subscribe to the user's channel
    this.send({
      type: 'SUBSCRIBE',
      payload: { channel: `user:${this.userId}` },
    });

    // Notify listeners
    this.emit('connected');
  }

  /**
   * Handle incoming WebSocket messages.
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      if (message.status === 'ERROR') {
        logger.error('WebSocket error:', message.code, message.message);
        this.emit('error', message);
        return;
      }

      // Route the message to the appropriate handler
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message.payload);
      }

      // Log debug info
      logger.debug('WebSocket message received:', message.type);
    } catch (err) {
      logger.error('Failed to parse WebSocket message:', err);
    }
  }

  /**
   * Handle WebSocket close event.
   */
  private handleClose(event: CloseEvent): void {
    logger.warn('WebSocket disconnected:', event.code, event.reason);

    // Attempt to reconnect
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = this.RECONNECT_DELAY * this.reconnectAttempts;
      logger.info(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      logger.error('Max reconnect attempts reached');
      this.emit('disconnected');
    }
  }

  /**
   * Handle WebSocket errors.
   */
  private handleError(event: Event): void {
    logger.error('WebSocket error:', event);
    this.emit('error', event);
  }

  /**
   * Send a message to the WebSocket server.
   */
  public send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.warn('WebSocket not open; message not sent:', message);
    }
  }

  /**
   * Subscribe to a WebSocket message type.
   */
  public onMessage(type: string, handler: (payload: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Unsubscribe from a message type.
   */
  public offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  /**
   * Add an event listener.
   */
  public on(event: 'connected' | 'disconnected' | 'error', listener: () => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);
  }

  /**
   * Remove an event listener.
   */
  public off(event: 'connected' | 'disconnected' | 'error', listener: () => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      this.eventListeners.set(
        event,
        listeners.filter((l) => l !== listener)
      );
    }
  }

  /**
   * Emit an event to listeners.
   */
  private emit(event: 'connected' | 'disconnected' | 'error', ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(...args));
    }
  }

  /**
   * Debounced method to mark a notification as read.
   */
  public markAsRead = debounce((notificationId: string) => {
    this.send({
      type: 'MARK_AS_READ',
      payload: { id: notificationId },
    });
  }, 300);

  /**
   * Close the WebSocket connection.
   */
  public close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

---

### **4. Room/Channel Management** *(50+ lines)*
```typescript
// src/websocket/rooms.ts
import { NotificationWebSocketServer } from './server';
import { logger } from '../utils/logger';

export class WebSocketRoomManager {
  private wsServer: NotificationWebSocketServer;
  private readonly rooms: Map<string, Set<WebSocket>> = new Map();

  constructor(wsServer: NotificationWebSocketServer) {
    this.wsServer = wsServer;
  }

  /**
   * Add a WebSocket to a room.
   */
  public addToRoom(room: string, ws: WebSocket): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)?.add(ws);
    logger.debug(`Added WebSocket to room ${room}`);
  }

  /**
   * Remove a WebSocket from a room.
   */
  public removeFromRoom(room: string, ws: WebSocket): void {
    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.delete(ws);
      if (roomClients.size === 0) {
        this.rooms.delete(room);
      }
      logger.debug(`Removed WebSocket from room ${room}`);
    }
  }

  /**
   * Remove a WebSocket from all rooms.
   */
  public removeFromAllRooms(ws: WebSocket): void {
    this.rooms.forEach((clients, room) => {
      clients.delete(ws);
      if (clients.size === 0) {
        this.rooms.delete(room);
      }
    });
    logger.debug('Removed WebSocket from all rooms');
  }

  /**
   * Broadcast a message to all clients in a room.
   */
  public broadcastToRoom(room: string, message: any): void {
    const roomClients = this.rooms.get(room);
    if (!roomClients) return;

    roomClients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        try {
          this.wsServer.sendToClient(ws, message);
        } catch (err) {
          logger.error('Failed to broadcast to room:', err);
        }
      }
    });
  }

  /**
   * Get the number of clients in a room.
   */
  public getRoomSize(room: string): number {
    return this.rooms.get(room)?.size || 0;
  }

  /**
   * Get all rooms a WebSocket is in.
   */
  public getRoomsForClient(ws: WebSocket): string[] {
    const rooms: string[] = [];
    this.rooms.forEach((clients, room) => {
      if (clients.has(ws)) {
        rooms.push(room);
      }
    });
    return rooms;
  }

  /**
   * Clean up dead connections.
   */
  public cleanupDeadConnections(): void {
    this.rooms.forEach((clients, room) => {
      clients.forEach((ws) => {
        if (ws.readyState !== ws.OPEN) {
          clients.delete(ws);
        }
      });
      if (clients.size === 0) {
        this.rooms.delete(room);
      }
    });
  }
}
```

---

### **5. Reconnection Logic** *(30+ lines)*
```typescript
// src/websocket/reconnect.ts
import { NotificationWebSocketClient } from './client';
import { logger } from '../utils/logger';

export class WebSocketReconnectManager {
  private client: NotificationWebSocketClient;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000; // 3 seconds
  private reconnectAttempts = 0;
  private isReconnecting = false;

  constructor(client: NotificationWebSocketClient) {
    this.client = client;
    this.setupListeners();
  }

  /**
   * Set up event listeners for reconnection.
   */
  private setupListeners(): void {
    this.client.on('disconnected', this.handleDisconnect.bind(this));
    this.client.on('connected', this.handleConnect.bind(this));
    this.client.on('error', this.handleError.bind(this));
  }

  /**
   * Handle a disconnect event.
   */
  private handleDisconnect(): void {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    this.reconnect();
  }

  /**
   * Handle a connect event.
   */
  private handleConnect(): void {
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    logger.info('WebSocket reconnected successfully');
  }

  /**
   * Handle an error event.
   */
  private handleError(err: any): void {
    logger.error('WebSocket error during reconnection:', err);
  }

  /**
   * Attempt to reconnect.
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnect attempts reached');
      this.client.off('disconnected', this.handleDisconnect);
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Attempting reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);

    setTimeout(() => {
      try {
        this.client.close(); // Ensure old connection is closed
        this.client = new NotificationWebSocketClient(
          this.client['token'], // Access private field for re-creation
          this.client['userId']
        );
        this.setupListeners(); // Reattach listeners
      } catch (err) {
        logger.error('Reconnection failed:', err);
        this.reconnect(); // Retry
      }
    }, this.RECONNECT_DELAY * this.reconnectAttempts);
  }
}
```

---

## **AI/ML Capabilities** *(250+ lines)*

### **1. Predictive Model Training** *(80+ lines)*
```python
# src/ml/train_notification_model.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import joblib
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NotificationPriorityTrainer:
    def __init__(self, data_path: str, model_path: str = "models/priority_model.pkl"):
        self.data_path = data_path
        self.model_path = model_path
        self.model = None
        self.preprocessor = None

    def load_data(self) -> pd.DataFrame:
        """Load and preprocess the dataset."""
        try:
            df = pd.read_csv(self.data_path)
            logger.info(f"Loaded dataset with {len(df)} rows")

            # Feature engineering
            df['hour_of_day'] = pd.to_datetime(df['created_at']).dt.hour
            df['day_of_week'] = pd.to_datetime(df['created_at']).dt.dayofweek
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
            df['title_length'] = df['title'].apply(len)
            df['body_length'] = df['body'].apply(len)

            # Target: Convert priority to binary (CRITICAL/HIGH vs MEDIUM/LOW)
            df['priority_binary'] = df['priority'].apply(
                lambda x: 1 if x in ['CRITICAL', 'HIGH'] else 0
            )

            return df
        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            raise

    def preprocess_data(self, df: pd.DataFrame) -> tuple:
        """Split data into features and target, then preprocess."""
        # Features and target
        X = df.drop(columns=['priority', 'priority_binary', 'created_at', 'id'])
        y = df['priority_binary']

        # Identify numerical and categorical columns
        numerical_cols = X.select_dtypes(include=['int64', 'float64']).columns
        categorical_cols = X.select_dtypes(include=['object']).columns

        # Preprocessing pipeline
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
                ('num', numerical_transformer, numerical_cols),
                ('cat', categorical_transformer, categorical_cols)
            ]
        )

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        return X_train, X_test, y_train, y_test

    def train_model(self, X_train, y_train) -> Pipeline:
        """Train a Random Forest classifier."""
        try:
            # Create pipeline
            pipeline = Pipeline(steps=[
                ('preprocessor', self.preprocessor),
                ('classifier', RandomForestClassifier(
                    n_estimators=200,
                    max_depth=10,
                    min_samples_split=5,
                    class_weight='balanced',
                    random_state=42,
                    n_jobs=-1
                ))
            ])

            # Train
            pipeline.fit(X_train, y_train)
            logger.info("Model training completed")
            return pipeline
        except Exception as e:
            logger.error(f"Model training failed: {e}")
            raise

    def evaluate_model(self, model: Pipeline, X_test, y_test) -> dict:
        """Evaluate the model on test data."""
        try:
            y_pred = model.predict(X_test)
            y_proba = model.predict_proba(X_test)[:, 1]

            report = classification_report(y_test, y_pred, output_dict=True)
            roc_auc = roc_auc_score(y_test, y_proba)

            logger.info(f"Model evaluation - ROC AUC: {roc_auc:.4f}")
            logger.info(classification_report(y_test, y_pred))

            return {
                'classification_report': report,
                'roc_auc': roc_auc,
                'feature_importances': model.named_steps['classifier'].feature_importances_
            }
        except Exception as e:
            logger.error(f"Model evaluation failed: {e}")
            raise

    def save_model(self, model: Pipeline) -> str:
        """Save the trained model to disk."""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(model, self.model_path)
            logger.info(f"Model saved to {self.model_path}")
            return self.model_path
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            raise

    def train(self) -> dict:
        """End-to-end training pipeline."""
        try:
            # Load and preprocess data
            df = self.load_data()
            X_train, X_test, y_train, y_test = self.preprocess_data(df)

            # Train model
            self.model = self.train_model(X_train, y_train)

            # Evaluate
            evaluation = self.evaluate_model(self.model, X_test, y_test)

            # Save model
            self.save_model(self.model)

            return {
                'status': 'success',
                'model_path': self.model_path,
                'evaluation': evaluation,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Training failed: {e}")
            return {
                'status': 'error',
                'error': str(e)
            }

if __name__ == "__main__":
    trainer = NotificationPriorityTrainer(
        data_path="data/notifications.csv",
        model_path="models/priority_model.pkl"
    )
    result = trainer.train()
    print(result)
```

---

### **2. Real-Time Inference API** *(60+ lines)*
```python
# src/ml/inference_api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import logging
from typing import Optional
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Notification Priority API")

class NotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    channel: str
    created_at: str
    metadata: Optional[dict] = None

class PredictionResponse(BaseModel):
    priority: str  # CRITICAL, HIGH, MEDIUM, LOW
    priority_score: float
    model_version: str

# Load the model
MODEL_PATH = "models/priority_model.pkl"
try:
    model = joblib.load(MODEL_PATH)
    logger.info(f"Loaded model from {MODEL_PATH}")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    raise

@app.post("/predict", response_model=PredictionResponse)
async def predict_priority(request: NotificationRequest):
    """Predict the priority of a notification."""
    try:
        # Convert request to DataFrame
        input_data = pd.DataFrame([{
            'user_id': request.user_id,
            'title': request.title,
            'body': request.body,
            'channel': request.channel,
            'created_at': request.created_at,
            'title_length': len(request.title),
            'body_length': len(request.body),
            'hour_of_day': pd.to_datetime(request.created_at).hour,
            'day_of_week': pd.to_datetime(request.created_at).dayofweek,
            'is_weekend': pd.to_datetime(request.created_at).dayofweek in [5, 6],
            **request.metadata if request.metadata else {}
        }])

        # Ensure all required columns are present
        required_columns = [
            'title_length', 'body_length', 'hour_of_day',
            'day_of_week', 'is_weekend', 'channel'
        ]
        for col in required_columns:
            if col not in input_data.columns:
                input_data[col] = 0  # Default value

        # Predict
        proba = model.predict_proba(input_data)[0][1]  # Probability of HIGH/CRITICAL
        priority_score = proba

        # Map score to priority
        if proba >= 0.8:
            priority = "CRITICAL"
        elif proba >= 0.6:
            priority = "HIGH"
        elif proba >= 0.3:
            priority = "MEDIUM"
        else:
            priority = "LOW"

        return {
            "priority": priority,
            "priority_score": float(priority_score),
            "model_version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "model_loaded": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### **3. Feature Engineering Pipeline** *(60+ lines)*
```python
# src/ml/feature_engineering.py
import pandas as pd
import numpy as np
from datetime import datetime
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NotificationFeatureEngineer:
    def __init__(self):
        self.text_features = [
            'title_sentiment', 'body_sentiment',
            'title_keywords', 'body_keywords'
        ]

    def extract_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract time-based features from created_at."""
        try:
            df['created_at'] = pd.to_datetime(df['created_at'])
            df['hour_of_day'] = df['created_at'].dt.hour
            df['day_of_week'] = df['created_at'].dt.dayofweek
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
            df['is_business_hours'] = (
                (df['hour_of_day'] >= 9) &
                (df['hour_of_day'] <= 17) &
                (df['is_weekend'] == 0)
            ).astype(int)
            return df
        except Exception as e:
            logger.error(f"Time feature extraction failed: {e}")
            raise

    def extract_text_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features from text (title and body)."""
        try:
            # Sentiment analysis (placeholder - use NLP library in production)
            df['title_sentiment'] = df['title'].apply(
                lambda x: self._analyze_sentiment(x)
            )
            df['body_sentiment'] = df['body'].apply(
                lambda x: self._analyze_sentiment(x)
            )

            # Keyword detection
            df['title_keywords'] = df['title'].apply(
                lambda x: self._extract_keywords(x)
            )
            df['body_keywords'] = df['body'].apply(
                lambda x: self._extract_keywords(x)
            )

            # Text length
            df['title_length'] = df['title'].apply(len)
            df['body_length'] = df['body'].apply(len)

            return df
        except Exception as e:
            logger.error(f"Text feature extraction failed: {e}")
            raise

    def extract_user_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features based on user behavior."""
        try:
            # Historical engagement (placeholder - use actual data in production)
            df['user_engagement_score'] = np.random.uniform(0, 1, len(df))
            df['user_prefers_email'] = np.random.choice([0, 1], len(df))
            df['user_prefers_push'] = np.random.choice([0, 1], len(df))
            return df
        except Exception as e:
            logger.error(f"User feature extraction failed: {e}")
            raise

    def extract_metadata_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features from metadata JSON."""
        try:
            if 'metadata' in df.columns:
                # Parse metadata if it's a string
                if isinstance(df['metadata'].iloc[0], str):
                    df['metadata'] = df['metadata'].apply(
                        lambda x: {} if pd.isna(x) else eval(x)
                    )

                # Extract common metadata fields
                df['has_action'] = df['metadata'].apply(
                    lambda x: 1 if x.get('actions') else 0
                )
                df['has_image'] = df['metadata'].apply(
                    lambda x: 1 if x.get('image_url') else 0
                )
                df['has_deeplink'] = df['metadata'].apply(
                    lambda x: 1 if x.get('deeplink') else 0
                )
            else:
                df['has_action'] = 0
                df['has_image'] = 0
                df['has_deeplink'] = 0

            return df
        except Exception as e:
            logger.error(f"Metadata feature extraction failed: {e}")
            raise

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply all feature engineering steps."""
        try:
            df = self.extract_time_features(df)
            df = self.extract_text_features(df)
            df = self.extract_user_features(df)
            df = self.extract_metadata_features(df)
            return df
        except Exception as e:
            logger.error(f"Feature engineering failed: {e}")
            raise

    def _analyze_sentiment(self, text: str) -> float:
        """Placeholder for sentiment analysis."""
        # In production, use a library like TextBlob or VADER
        positive_words = ['success', 'approved', 'congrats', 'thank you']
        negative_words = ['failed', 'error', 'problem', 'urgent']

        score = 0
        for word in positive_words:
            if word in text.lower():
                score += 1
        for word in negative_words:
            if word in text.lower():
                score -= 1

        return score / max(1, len(text.split()))

    def _extract_keywords(self, text: str) -> str:
        """Placeholder for keyword extraction."""
        # In production, use TF-IDF or RAKE
        keywords = ['payment', 'account', 'security', 'update', 'action required']
        found_keywords = [kw for kw in keywords if kw in text.lower()]
        return ','.join(found_keywords) if found_keywords else 'none'
```

---

### **4. Model Monitoring and Retraining** *(50+ lines)*
```python
# src/ml/model_monitor.py
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, roc_auc_score
import joblib
import logging
from datetime import datetime, timedelta
import os
import smtplib
from email.mime.text import MIMEText

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelMonitor:
    def __init__(
        self,
        model_path: str = "models/priority_model.pkl",
        data_path: str = "data/new_notifications.csv",
        retrain_threshold: float = 0.05,
        alert_email: str = "alerts@company.com"
    ):
        self.model_path = model_path
        self.data_path = data_path
        self.retrain_threshold = retrain_threshold
        self.alert_email = alert_email
        self.model = None
        self.load_model()

    def load_model(self):
        """Load the trained model."""
        try:
            self.model = joblib.load(self.model_path)
            logger.info(f"Loaded model from {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def load_new_data(self) -> pd.DataFrame:
        """Load new data for monitoring."""
        try:
            df = pd.read_csv(self.data_path)
            logger.info(f"Loaded {len(df)} new samples for monitoring")
            return df
        except Exception as e:
            logger.error(f"Failed to load new data: {e}")
            raise

    def preprocess_data(self, df: pd.DataFrame) -> tuple:
        """Preprocess data for evaluation."""
        try:
            # Feature engineering (same as training)
            from feature_engineering import NotificationFeatureEngineer
            engineer = NotificationFeatureEngineer()
            df = engineer.engineer_features(df)

            # Target
            df['priority_binary'] = df['priority'].apply(
                lambda x: 1 if x in ['CRITICAL', 'HIGH'] else 0
            )

            X = df.drop(columns=['priority', 'priority_binary', 'created_at', 'id'])
            y = df['priority_binary']

            return X, y
        except Exception as e:
            logger.error(f"Data preprocessing failed: {e}")
            raise

    def evaluate_model(self, X: pd.DataFrame, y: pd.Series) -> dict:
        """Evaluate model performance on new data."""
        try:
            y_pred = self.model.predict(X)
            y_proba = self.model.predict_proba(X)[:, 1]

            report = classification_report(y, y_pred, output_dict=True)
            roc_auc = roc_auc_score(y, y_proba)

            return {
                'classification_report': report,
                'roc_auc': roc_auc,
                'accuracy': report['accuracy'],
                'precision': report['weighted avg']['precision'],
                'recall': report['weighted avg']['recall'],
                'f1_score': report['weighted avg']['f1-score'],
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Model evaluation failed: {e}")
            raise

    def check_drift(self, current_metrics: dict, baseline_metrics: dict) -> bool:
        """Check if model performance has drifted."""
        try:
            drift_detected = False
            messages = []

            # Compare ROC AUC
            auc_diff = abs(current_metrics['roc_auc'] - baseline_metrics['roc_auc'])
            if auc_diff > self.retrain_threshold:
                drift_detected = True
                messages.append(
                    f"ROC AUC dropped by {auc_diff:.4f} (threshold: {self.retrain_threshold})"
                )

            # Compare accuracy
            acc_diff = abs(current_metrics['accuracy'] - baseline_metrics['accuracy'])
            if acc_diff > self.retrain_threshold:
                drift_detected = True
                messages.append(
                    f"Accuracy dropped by {acc_diff:.4f} (threshold: {self.retrain_threshold})"
                )

            if drift_detected:
                logger.warning("Model drift detected!")
                logger.warning("\n".join(messages))
                self.send_alert("\n".join(messages))

            return drift_detected
        except Exception as e:
            logger.error(f"Drift detection failed: {e}")
            raise

    def send_alert(self, message: str):
        """Send an email alert about model drift."""
        try:
            msg = MIMEText(f"""
            Model Drift Alert
            -----------------
            {message}

            Model: {self.model_path}
            Timestamp: {datetime.now().isoformat()}

            Action Required: Retrain the model.
            """)
            msg['Subject'] = f"Model Drift Alert - {datetime.now().strftime('%Y-%m-%d')}"
            msg['From'] = "monitor@company.com"
            msg['To'] = self.alert_email

            with smtplib.SMTP('smtp.company.com', 587) as server:
                server.starttls()
                server.login("monitor@company.com", os.getenv("EMAIL_PASSWORD"))
                server.send_message(msg)

            logger.info("Alert email sent")
        except Exception as e:
            logger.error(f"Failed to send alert: {e}")

    def retrain_model(self):
        """Retrain the model if drift is detected."""
        try:
            logger.info("Starting model retraining...")
            from train_notification_model import NotificationPriorityTrainer
            trainer = NotificationPriorityTrainer(
                data_path="data/combined_notifications.csv",
                model_path=self.model_path
            )
            result = trainer.train()

            if result['status'] == 'success':
                logger.info("Model retrained successfully")
                self.load_model()  # Reload the new model
            else:
                logger.error("Model retraining failed")
        except Exception as e:
            logger.error(f"Retraining failed: {e}")

    def monitor(self):
        """Run the monitoring pipeline."""
        try:
            # Load new data
            df = self.load_new_data()
            X, y = self.preprocess_data(df)

            # Evaluate model
            current_metrics = self.evaluate_model(X, y)
            logger.info(f"Current model metrics: {current_metrics}")

            # Load baseline metrics (from training)
            baseline_metrics = {
                'roc_auc': 0.92,  # Example baseline (load from file in production)
                'accuracy': 0.88,
                'precision': 0.87,
                'recall': 0.89,
                'f1_score': 0.88
            }

            # Check for drift
            drift_detected = self.check_drift(current_metrics, baseline_metrics)

            if drift_detected:
                self.retrain_model()

            return {
                'status': 'success',
                'current_metrics': current_metrics,
                'drift_detected': drift_detected
            }
        except Exception as e:
            logger.error(f"Monitoring failed: {e}")
            return {
                'status': 'error',
                'error': str(e)
            }

if __name__ == "__main__":
    monitor = ModelMonitor()
    result = monitor.monitor()
    print(result)
```

---

*(Continued in next message due to length constraints. The remaining sections—Progressive Web App (PWA) Features, WCAG 2.1 AAA Accessibility, Advanced Search and Filtering, Third-Party Integrations, Gamification System, Analytics Dashboards, Security Hardening, Comprehensive Testing, Kubernetes Deployment, Database Migration Strategy, Key Performance Indicators, and Risk Mitigation—will follow in subsequent responses to meet the 2000+ line requirement.)*