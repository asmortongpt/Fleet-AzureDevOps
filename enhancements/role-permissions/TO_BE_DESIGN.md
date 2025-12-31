# **TO_BE_DESIGN.md**
**Fleet Management System - Role-Permissions Module**
*Enterprise-Grade, Multi-Tenant, AI-Powered Access Control*

---

## **1. Overview**
### **1.1 Purpose**
The **Role-Permissions Module** is a core component of the **Fleet Management System (FMS)**, providing **fine-grained, dynamic, and AI-driven access control** for multi-tenant enterprise environments. It ensures **least-privilege access**, **real-time permission updates**, and **predictive security** while maintaining **sub-50ms response times** and **WCAG 2.1 AAA compliance**.

### **1.2 Key Objectives**
| Objective | Description |
|-----------|------------|
| **Performance** | Sub-50ms response times for all permission checks |
| **Real-Time Updates** | WebSocket/SSE for live permission changes |
| **AI/ML Integration** | Predictive permission recommendations, anomaly detection |
| **PWA Support** | Offline-first, installable, and responsive UX |
| **Accessibility** | Full WCAG 2.1 AAA compliance |
| **Security** | Zero-trust architecture, encryption, audit logging |
| **Scalability** | Kubernetes-native, multi-region deployment |
| **Gamification** | Role-based achievements, leaderboards, and engagement |
| **Analytics** | Real-time dashboards, predictive access trends |

---

## **2. System Architecture**
### **2.1 High-Level Architecture**
```mermaid
graph TD
    A[Client (PWA)] -->|REST/WebSocket| B[API Gateway]
    B --> C[Auth Service]
    B --> D[Role-Permissions Service]
    D --> E[Redis Cache]
    D --> F[PostgreSQL (TimescaleDB)]
    D --> G[AI/ML Service]
    D --> H[Event Bus (Kafka)]
    H --> I[Audit Log Service]
    H --> J[Notification Service]
    K[Admin Dashboard] --> B
    L[Third-Party Integrations] --> B
```

### **2.2 Microservices Breakdown**
| Service | Responsibility | Tech Stack |
|---------|---------------|------------|
| **Role-Permissions Service** | Core permission logic, RBAC, ABAC | Node.js (NestJS), TypeScript |
| **Auth Service** | JWT/OAuth2, MFA, SSO | Keycloak, OpenID Connect |
| **AI/ML Service** | Predictive permissions, anomaly detection | Python (FastAPI), TensorFlow |
| **Audit Log Service** | Immutable logs, compliance reporting | Elasticsearch, Logstash |
| **Notification Service** | Real-time alerts (SSE/WebSocket) | WebSocket (Socket.io) |
| **API Gateway** | Rate limiting, request routing | Kong, Envoy |

---

## **3. Core Features & Design**
### **3.1 Role-Based Access Control (RBAC) with Attribute-Based Extensions (ABAC)**
#### **3.1.1 Permission Model**
```typescript
// src/permissions/models/permission.model.ts
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
}

export enum PermissionResource {
  VEHICLE = 'vehicle',
  DRIVER = 'driver',
  ROUTE = 'route',
  REPORT = 'report',
  USER = 'user',
  ROLE = 'role',
}

export interface Permission {
  id: string;
  tenantId: string;
  resource: PermissionResource;
  action: PermissionAction;
  attributes?: Record<string, unknown>; // ABAC conditions
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  tenantId: string;
  expiresAt?: Date; // Temporary role assignment
}
```

#### **3.1.2 Permission Checker (Optimized for <50ms)**
```typescript
// src/permissions/services/permission-checker.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';
import { Permission, Role, UserRoleAssignment } from '../models/permission.model';

@Injectable()
export class PermissionCheckerService {
  constructor(private readonly redis: RedisService) {}

  async checkPermission(
    userId: string,
    tenantId: string,
    resource: PermissionResource,
    action: PermissionAction,
    attributes?: Record<string, unknown>,
  ): Promise<boolean> {
    // 1. Check Redis cache (TTL: 5s)
    const cacheKey = `perm:${userId}:${tenantId}:${resource}:${action}`;
    const cachedResult = await this.redis.get(cacheKey);
    if (cachedResult !== null) return cachedResult === 'true';

    // 2. Fetch user roles
    const roles = await this.getUserRoles(userId, tenantId);

    // 3. Check permissions (RBAC + ABAC)
    const hasPermission = roles.some((role) =>
      role.permissions.some((perm) => {
        const resourceMatch = perm.resource === resource;
        const actionMatch = perm.action === action;
        const attributesMatch = this.checkAttributes(perm.attributes, attributes);
        return resourceMatch && actionMatch && attributesMatch;
      }),
    );

    // 4. Cache result
    await this.redis.set(cacheKey, hasPermission.toString(), 5); // 5s TTL
    return hasPermission;
  }

  private async getUserRoles(userId: string, tenantId: string): Promise<Role[]> {
    const cacheKey = `roles:${userId}:${tenantId}`;
    const cachedRoles = await this.redis.get(cacheKey);
    if (cachedRoles) return JSON.parse(cachedRoles);

    // Fetch from DB (PostgreSQL)
    const roles = await this.fetchRolesFromDB(userId, tenantId);
    await this.redis.set(cacheKey, JSON.stringify(roles), 300); // 5min TTL
    return roles;
  }

  private checkAttributes(
    permAttrs: Record<string, unknown> = {},
    reqAttrs: Record<string, unknown> = {},
  ): boolean {
    return Object.entries(permAttrs).every(([key, value]) => {
      if (key === '$or') {
        return (value as Array<Record<string, unknown>>).some((orCond) =>
          this.checkAttributes(orCond, reqAttrs),
        );
      }
      return reqAttrs[key] === value;
    });
  }
}
```

---

### **3.2 Real-Time Permission Updates (WebSocket/SSE)**
#### **3.2.1 WebSocket Gateway (NestJS)**
```typescript
// src/permissions/gateways/permission.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PermissionCheckerService } from '../services/permission-checker.service';

@WebSocketGateway({ cors: true })
export class PermissionGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly permissionChecker: PermissionCheckerService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const tenantId = client.handshake.query.tenantId as string;

    if (!userId || !tenantId) {
      client.disconnect();
      return;
    }

    // Subscribe to permission updates
    client.join(`tenant:${tenantId}`);
    client.join(`user:${userId}`);
  }

  async broadcastPermissionUpdate(tenantId: string, roleId: string) {
    this.server.to(`tenant:${tenantId}`).emit('permission-updated', { roleId });
  }
}
```

#### **3.2.2 Server-Sent Events (SSE) Fallback**
```typescript
// src/permissions/controllers/permission.controller.ts
import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { PermissionService } from '../services/permission.service';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Sse('updates')
  sseUpdates(): Observable<MessageEvent> {
    return interval(1000).pipe(
      map(() => ({
        data: { message: 'Permission update', timestamp: new Date().toISOString() },
      })),
    );
  }
}
```

---

### **3.3 AI/ML-Powered Predictive Permissions**
#### **3.3.1 Anomaly Detection (TensorFlow.js)**
```typescript
// src/ai/services/anomaly-detection.service.ts
import * as tf from '@tensorflow/tfjs-node';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AnomalyDetectionService {
  private model: tf.LayersModel;

  async loadModel() {
    this.model = await tf.loadLayersModel('file://./models/anomaly-detection.json');
  }

  detectAnomaly(permissionCheck: {
    userId: string;
    resource: string;
    action: string;
    timestamp: number;
  }): boolean {
    const input = tf.tensor2d([
      [
        this.hashUserId(permissionCheck.userId),
        this.hashResource(permissionCheck.resource),
        this.hashAction(permissionCheck.action),
        permissionCheck.timestamp,
      ],
    ]);

    const prediction = this.model.predict(input) as tf.Tensor;
    const anomalyScore = prediction.dataSync()[0];
    return anomalyScore > 0.9; // 90% threshold
  }

  private hashUserId(userId: string): number {
    return parseInt(userId.replace(/\D/g, '')) % 1000;
  }

  private hashResource(resource: string): number {
    return resource.length % 10;
  }

  private hashAction(action: string): number {
    const actions = ['read', 'create', 'update', 'delete', 'execute'];
    return actions.indexOf(action);
  }
}
```

#### **3.3.2 Predictive Permission Recommendations**
```typescript
// src/ai/services/permission-recommender.service.ts
import { Injectable } from '@nestjs/common';
import { Permission, Role } from '../../permissions/models/permission.model';
import { UserActivityService } from '../../analytics/services/user-activity.service';

@Injectable()
export class PermissionRecommenderService {
  constructor(private readonly userActivity: UserActivityService) {}

  async recommendPermissions(userId: string, tenantId: string): Promise<Permission[]> {
    const userActivity = await this.userActivity.getUserActivity(userId, tenantId);
    const frequentResources = this.getFrequentResources(userActivity);
    const frequentActions = this.getFrequentActions(userActivity);

    // Fetch existing permissions
    const existingPermissions = await this.getUserPermissions(userId, tenantId);

    // Generate recommendations
    return frequentResources.flatMap((resource) =>
      frequentActions.map((action) => ({
        resource,
        action,
        attributes: {},
      })),
    ).filter((perm) => !existingPermissions.some((p) => p.resource === perm.resource && p.action === perm.action));
  }

  private getFrequentResources(activity: any[]): string[] {
    const resourceCounts = activity.reduce((acc, act) => {
      acc[act.resource] = (acc[act.resource] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(resourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([resource]) => resource);
  }

  private getFrequentActions(activity: any[]): string[] {
    const actionCounts = activity.reduce((acc, act) => {
      acc[act.action] = (acc[act.action] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([action]) => action);
  }
}
```

---

### **3.4 Progressive Web App (PWA) Design**
#### **3.4.1 Service Worker (Offline Support)**
```typescript
// src/pwa/service-worker.ts
const CACHE_NAME = 'fms-permissions-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    }),
  );
});
```

#### **3.4.2 Web App Manifest**
```json
{
  "name": "Fleet Management System - Permissions",
  "short_name": "FMS Permissions",
  "description": "Enterprise-grade role and permission management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

### **3.5 WCAG 2.1 AAA Compliance**
#### **3.5.1 Key Accessibility Features**
| Requirement | Implementation |
|-------------|---------------|
| **Keyboard Navigation** | Full tab/arrow key support, focus indicators |
| **Screen Reader Support** | ARIA labels, live regions, semantic HTML |
| **High Contrast Mode** | CSS variables for contrast adjustments |
| **Captions & Transcripts** | All videos/audio have captions |
| **Form Accessibility** | Error messages, labels, and instructions |
| **Color Blindness** | No color-only indicators (e.g., icons + text) |

#### **3.5.2 Example: Accessible Permission Table**
```tsx
// src/permissions/components/PermissionTable.tsx
import React from 'react';

const PermissionTable = ({ permissions }: { permissions: Permission[] }) => {
  return (
    <div role="region" aria-labelledby="permissions-heading">
      <h2 id="permissions-heading">Permission List</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className="p-2 text-left">Resource</th>
            <th scope="col" className="p-2 text-left">Action</th>
            <th scope="col" className="p-2 text-left">Attributes</th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((perm) => (
            <tr key={`${perm.resource}-${perm.action}`}>
              <td className="p-2">{perm.resource}</td>
              <td className="p-2">
                <span aria-label={`Action: ${perm.action}`}>
                  {perm.action}
                </span>
              </td>
              <td className="p-2">
                {perm.attributes ? (
                  <ul>
                    {Object.entries(perm.attributes).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {JSON.stringify(value)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  'None'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

### **3.6 Advanced Search & Filtering**
#### **3.6.1 Elasticsearch Integration**
```typescript
// src/search/services/permission-search.service.ts
import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Permission } from '../../permissions/models/permission.model';

@Injectable()
export class PermissionSearchService {
  constructor(private readonly es: ElasticsearchService) {}

  async indexPermission(permission: Permission) {
    await this.es.index({
      index: 'permissions',
      id: permission.id,
      body: {
        tenantId: permission.tenantId,
        resource: permission.resource,
        action: permission.action,
        attributes: permission.attributes,
        createdAt: permission.createdAt,
      },
    });
  }

  async searchPermissions(
    tenantId: string,
    query: string,
    filters: Record<string, unknown> = {},
  ): Promise<Permission[]> {
    const { body } = await this.es.search({
      index: 'permissions',
      body: {
        query: {
          bool: {
            must: [
              { match: { tenantId } },
              {
                multi_match: {
                  query,
                  fields: ['resource', 'action', 'attributes.*'],
                },
              },
              ...Object.entries(filters).map(([field, value]) => ({
                term: { [field]: value },
              })),
            ],
          },
        },
      },
    });

    return body.hits.hits.map((hit) => hit._source);
  }
}
```

#### **3.6.2 GraphQL API for Search**
```graphql
# src/permissions/graphql/permissions.graphql
type Query {
  searchPermissions(
    tenantId: ID!
    query: String
    filters: PermissionFilters
    limit: Int = 10
    offset: Int = 0
  ): [Permission!]!
}

input PermissionFilters {
  resource: String
  action: String
  createdAfter: DateTime
}
```

---

### **3.7 Third-Party Integrations**
#### **3.7.1 Webhook Subscriptions**
```typescript
// src/integrations/services/webhook.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';

@Injectable()
export class WebhookService {
  private webhooks: Map<string, { url: string; events: string[] }> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.eventEmitter.on('permission.updated', (data) => this.handleEvent('permission.updated', data));
    this.eventEmitter.on('role.assigned', (data) => this.handleEvent('role.assigned', data));
  }

  registerWebhook(tenantId: string, url: string, events: string[]) {
    this.webhooks.set(tenantId, { url, events });
  }

  private async handleEvent(event: string, data: any) {
    for (const [tenantId, webhook] of this.webhooks) {
      if (webhook.events.includes(event)) {
        try {
          await axios.post(webhook.url, { event, data, tenantId });
        } catch (error) {
          console.error(`Webhook failed for ${tenantId}:`, error);
        }
      }
    }
  }
}
```

#### **3.7.2 OAuth2 Integration (Keycloak)**
```typescript
// src/auth/strategies/keycloak.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-keycloak';
import { AuthService } from '../services/auth.service';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      realm: process.env.KEYCLOAK_REALM,
      authServerURL: process.env.KEYCLOAK_AUTH_URL,
      callbackURL: process.env.KEYCLOAK_CALLBACK_URL,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return this.authService.validateKeycloakUser(profile);
  }
}
```

---

### **3.8 Gamification & User Engagement**
#### **3.8.1 Role-Based Achievements**
```typescript
// src/gamification/services/achievement.service.ts
import { Injectable } from '@nestjs/common';
import { Role, UserRoleAssignment } from '../../permissions/models/permission.model';

@Injectable()
export class AchievementService {
  private achievements = {
    FIRST_ROLE_ASSIGNED: {
      id: 'FIRST_ROLE_ASSIGNED',
      name: 'First Role Assigned',
      description: 'Assign your first role to a user',
      points: 10,
    },
    PERMISSION_MASTER: {
      id: 'PERMISSION_MASTER',
      name: 'Permission Master',
      description: 'Create 10 custom permissions',
      points: 50,
    },
  };

  async checkAchievements(userId: string, tenantId: string, event: string) {
    const userAchievements = await this.getUserAchievements(userId, tenantId);

    switch (event) {
      case 'role_assigned':
        if (!userAchievements.some((a) => a.id === 'FIRST_ROLE_ASSIGNED')) {
          await this.awardAchievement(userId, tenantId, 'FIRST_ROLE_ASSIGNED');
        }
        break;
      case 'permission_created':
        const permissionCount = await this.countUserPermissions(userId, tenantId);
        if (permissionCount >= 10 && !userAchievements.some((a) => a.id === 'PERMISSION_MASTER')) {
          await this.awardAchievement(userId, tenantId, 'PERMISSION_MASTER');
        }
        break;
    }
  }

  private async awardAchievement(userId: string, tenantId: string, achievementId: string) {
    // Save to DB
    await this.saveAchievement(userId, tenantId, achievementId);
    // Notify user (WebSocket/SSE)
    this.eventEmitter.emit('achievement.unlocked', { userId, achievementId });
  }
}
```

#### **3.8.2 Leaderboard (Redis Sorted Sets)**
```typescript
// src/gamification/services/leaderboard.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from '../../cache/redis.service';

@Injectable()
export class LeaderboardService {
  private readonly LEADERBOARD_KEY = 'leaderboard:permissions';

  constructor(private readonly redis: RedisService) {}

  async updateScore(userId: string, tenantId: string, points: number) {
    await this.redis.zincrby(this.LEADERBOARD_KEY, points, `${tenantId}:${userId}`);
  }

  async getLeaderboard(tenantId: string, limit = 10): Promise<Array<{ userId: string; score: number }>> {
    const key = `${this.LEADERBOARD_KEY}:${tenantId}`;
    const results = await this.redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
    return results.map((result, index) => ({
      rank: index + 1,
      userId: result[0].split(':')[1],
      score: parseInt(result[1]),
    }));
  }
}
```

---

### **3.9 Analytics & Reporting**
#### **3.9.1 Real-Time Dashboard (Grafana + TimescaleDB)**
```sql
-- src/analytics/sql/permission-usage.sql
SELECT
  date_trunc('hour', created_at) AS hour,
  resource,
  action,
  COUNT(*) AS usage_count
FROM permission_checks
WHERE tenant_id = $1
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour, resource, action
ORDER BY hour, usage_count DESC;
```

#### **3.9.2 Predictive Access Trends (Python)**
```python
# src/ai/models/permission_trends.py
import pandas as pd
from prophet import Prophet

def predict_permission_trends(historical_data: pd.DataFrame) -> pd.DataFrame:
    # Prepare data
    df = historical_data.rename(columns={'date': 'ds', 'usage': 'y'})

    # Train model
    model = Prophet(daily_seasonality=True)
    model.fit(df)

    # Predict next 30 days
    future = model.make_future_dataframe(periods=30)
    forecast = model.predict(future)

    return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
```

---

### **3.10 Security Hardening**
#### **3.10.1 Encryption (AES-256 for Sensitive Data)**
```typescript
// src/security/services/encryption.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly ALGORITHM = 'aes-256-cbc';
  private readonly KEY = process.env.ENCRYPTION_KEY; // 32-byte key
  private readonly IV_LENGTH = 16;

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, Buffer.from(this.KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(text: string): string {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(this.ALGORITHM, Buffer.from(this.KEY), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
```

#### **3.10.2 Audit Logging (Immutable Logs)**
```typescript
// src/audit/services/audit-log.service.ts
import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class AuditLogService {
  constructor(private readonly es: ElasticsearchService) {}

  async logEvent(event: {
    userId: string;
    tenantId: string;
    action: string;
    resource: string;
    metadata?: Record<string, unknown>;
  }) {
    await this.es.index({
      index: 'audit-logs',
      body: {
        ...event,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async getLogs(tenantId: string, userId?: string, limit = 100) {
    const query = {
      bool: {
        must: [{ term: { tenantId } }],
        ...(userId && { term: { userId } }),
      },
    };

    const { body } = await this.es.search({
      index: 'audit-logs',
      body: { query, size: limit, sort: [{ timestamp: 'desc' }] },
    });

    return body.hits.hits.map((hit) => hit._source);
  }
}
```

---

### **3.11 Testing Strategy**
#### **3.11.1 Unit Testing (Jest)**
```typescript
// src/permissions/services/permission-checker.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionCheckerService } from './permission-checker.service';
import { RedisService } from '../../cache/redis.service';

describe('PermissionCheckerService', () => {
  let service: PermissionCheckerService;
  let redis: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionCheckerService,
        {
          provide: RedisService,
          useValue: { get: jest.fn(), set: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PermissionCheckerService>(PermissionCheckerService);
    redis = module.get<RedisService>(RedisService);
  });

  it('should return true if user has permission', async () => {
    jest.spyOn(redis, 'get').mockResolvedValue(null);
    jest.spyOn(service, 'getUserRoles').mockResolvedValue([
      {
        permissions: [{ resource: 'vehicle', action: 'read' }],
      } as any,
    ]);

    const result = await service.checkPermission('user1', 'tenant1', 'vehicle', 'read');
    expect(result).toBe(true);
  });

  it('should cache permission results', async () => {
    jest.spyOn(redis, 'get').mockResolvedValue('true');
    const result = await service.checkPermission('user1', 'tenant1', 'vehicle', 'read');
    expect(result).toBe(true);
    expect(redis.get).toHaveBeenCalled();
  });
});
```

#### **3.11.2 Integration Testing (TestContainers)**
```typescript
// src/permissions/permissions.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionCheckerService } from './services/permission-checker.service';
import { Permission } from './models/permission.model';
import { PostgreSqlContainer } from 'testcontainers';

describe('PermissionCheckerService (Integration)', () => {
  let service: PermissionCheckerService;
  let container: PostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getPort(),
          username: container.getUsername(),
          password: container.getPassword(),
          database: container.getDatabase(),
          entities: [Permission],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Permission]),
      ],
      providers: [PermissionCheckerService],
    }).compile();

    service = module.get<PermissionCheckerService>(PermissionCheckerService);
  });

  afterAll(async () => {
    await container.stop();
  });

  it('should check permissions against real DB', async () => {
    // Seed test data
    await service['permissionRepository'].save({
      tenantId: 'tenant1',
      resource: 'vehicle',
      action: 'read',
    });

    const result = await service.checkPermission('user1', 'tenant1', 'vehicle', 'read');
    expect(result).toBe(true);
  });
});
```

#### **3.11.3 End-to-End Testing (Cypress)**
```typescript
// cypress/e2e/permissions.cy.ts
describe('Role-Permissions Module', () => {
  beforeEach(() => {
    cy.login('admin@fms.com', 'password123');
  });

  it('should create a new role with permissions', () => {
    cy.visit('/roles');
    cy.get('[data-testid="new-role-btn"]').click();
    cy.get('[data-testid="role-name"]').type('Fleet Manager');
    cy.get('[data-testid="permission-vehicle-read"]').check();
    cy.get('[data-testid="permission-driver-update"]').check();
    cy.get('[data-testid="save-role-btn"]').click();
    cy.contains('Role created successfully');
  });

  it('should enforce permission checks', () => {
    cy.visit('/vehicles');
    cy.get('[data-testid="vehicle-list"]').should('exist');

    // Revoke permission
    cy.visit('/roles');
    cy.contains('Fleet Manager').click();
    cy.get('[data-testid="permission-vehicle-read"]').uncheck();
    cy.get('[data-testid="save-role-btn"]').click();

    // Verify access denied
    cy.visit('/vehicles');
    cy.contains('Access Denied');
  });
});
```

---

### **3.12 Kubernetes Deployment Architecture**
#### **3.12.1 Helm Chart Structure**
```
fms-role-permissions/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   └── pdb.yaml
└── charts/
    ├── redis/
    └── postgres/
```

#### **3.12.2 Deployment (deployment.yaml)**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: role-permissions-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: role-permissions-service
  template:
    metadata:
      labels:
        app: role-permissions-service
    spec:
      containers:
        - name: role-permissions
          image: ghcr.io/fms/role-permissions:{{ .Values.image.tag }}
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: role-permissions-config
            - secretRef:
                name: role-permissions-secrets
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - role-permissions-service
                topologyKey: "kubernetes.io/hostname"
```

#### **3.12.3 Horizontal Pod Autoscaler (hpa.yaml)**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: role-permissions-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: role-permissions-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

### **3.13 Migration Strategy & Rollback Plan**
#### **3.13.1 Database Migration (TypeORM)**
```typescript
// src/migrations/1650000000000-AddTenantIdToPermissions.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantIdToPermissions1650000000000 implements MigrationInterface {
  name = 'AddTenantIdToPermissions1650000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "permissions" ADD "tenant_id" character varying NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_permissions_tenant_id" ON "permissions" ("tenant_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_permissions_tenant_id"`);
    await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "tenant_id"`);
  }
}
```

#### **3.13.2 Blue-Green Deployment**
1. **Deploy new version (v2) alongside v1**
   ```bash
   kubectl apply -f role-permissions-v2.yaml
   ```
2. **Route 10% of traffic to v2**
   ```yaml
   # ingress.yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: role-permissions-ingress
     annotations:
       nginx.ingress.kubernetes.io/canary: "true"
       nginx.ingress.kubernetes.io/canary-weight: "10"
   ```
3. **Monitor for errors (Prometheus + Grafana)**
4. **Gradually increase traffic to 100%**
5. **Rollback if issues detected**
   ```bash
   kubectl apply -f role-permissions-v1.yaml
   ```

---

### **3.14 Key Performance Indicators (KPIs)**
| KPI | Target | Measurement Method |
|-----|--------|-------------------|
| **Permission Check Latency** | <50ms (P99) | Prometheus (histogram) |
| **API Availability** | 99.99% | UptimeRobot, Grafana |
| **Database Query Time** | <20ms (P95) | PostgreSQL `pg_stat_statements` |
| **Cache Hit Ratio** | >90% | Redis `info stats` |
| **Error Rate** | <0.1% | Sentry, Grafana |
| **User Engagement** | 80% weekly active users | Mixpanel, Amplitude |
| **Deployment Frequency** | 2x/week | GitHub Actions |
| **Mean Time to Recovery (MTTR)** | <15min | Incident logs |

---

### **3.15 Risk Mitigation Strategies**
| Risk | Mitigation Strategy |
|------|---------------------|
| **Performance Degradation** | Load testing (k6), auto-scaling, caching |
| **Security Breach** | Zero-trust, encryption, audit logs, penetration testing |
| **Data Loss** | Multi-region backups, WAL archiving (PostgreSQL) |
| **Downtime During Migration** | Blue-green deployment, rollback plan |
| **AI Model Bias** | Continuous monitoring, fairness metrics |
| **Third-Party API Failures** | Circuit breakers, retries, fallback mechanisms |
| **Compliance Violations** | Automated compliance checks (OpenPolicyAgent) |

---

## **4. Future Enhancements**
1. **Blockchain-Based Permission Auditing** (Hyperledger Fabric)
2. **Voice-Activated Permission Management** (Amazon Lex)
3. **AR/VR Role Assignment** (Unity + WebXR)
4. **Self-Healing Permissions** (AI-driven auto-correction)
5. **Quantum-Resistant Encryption** (Post-quantum cryptography)

---

## **5. Conclusion**
This **TO_BE_DESIGN** document outlines a **next-generation Role-Permissions Module** for the **Fleet Management System**, incorporating:
✅ **Sub-50ms permission checks** (Redis + ABAC)
✅ **Real-time updates** (WebSocket/SSE)
✅ **AI-driven predictive permissions** (TensorFlow)
✅ **PWA with offline support**
✅ **WCAG 2.1 AAA compliance**
✅ **Enterprise-grade security** (Zero-trust, encryption)
✅ **Kubernetes-native deployment**
✅ **Comprehensive testing & monitoring**

The module is designed for **scalability, security, and user engagement**, ensuring it meets the demands of **enterprise multi-tenant environments**.

---

**Approval Required:**
- [ ] CTO
- [ ] Security Team
- [ ] DevOps Lead
- [ ] Product Owner

**Last Updated:** `2023-11-15`
**Version:** `2.0.0`