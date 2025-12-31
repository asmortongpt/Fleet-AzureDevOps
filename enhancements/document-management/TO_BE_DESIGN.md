# **TO_BE_DESIGN.md**
**Document Management Module**
**Fleet Management System (FMS) - Enterprise Multi-Tenant Architecture**

**Version:** 1.0
**Last Updated:** [Date]
**Author:** [Your Name]
**Reviewers:** [Team Leads, Architects, Security Experts]

---

## **1. Overview**
The **Document Management Module (DMM)** is a core component of the **Fleet Management System (FMS)**, designed to handle the storage, retrieval, processing, and lifecycle management of fleet-related documents (e.g., vehicle registrations, insurance certificates, maintenance logs, driver licenses, compliance reports).

This **TO-BE** design outlines an **industry-leading**, **scalable**, **secure**, and **AI-powered** document management system with **real-time capabilities**, **PWA support**, and **enterprise-grade compliance**.

### **1.1 Key Objectives**
| Objective | Description |
|-----------|------------|
| **Performance** | Sub-50ms response times for 99% of requests |
| **Real-Time Updates** | WebSocket/SSE for live document status changes |
| **AI/ML Integration** | Automated document classification, OCR, predictive analytics |
| **PWA Support** | Offline-first, installable, cross-platform |
| **Accessibility** | WCAG 2.1 AAA compliance |
| **Search & Filtering** | Elasticsearch-powered advanced search |
| **Third-Party Integrations** | REST APIs, Webhooks, OAuth2, SAML |
| **Gamification** | User engagement via badges, leaderboards, rewards |
| **Analytics & Reporting** | Real-time dashboards, custom reports, predictive insights |
| **Security** | End-to-end encryption, audit logging, GDPR/CCPA compliance |
| **Testing** | 100% test coverage (unit, integration, E2E) |
| **Deployment** | Kubernetes-based microservices with auto-scaling |
| **Migration** | Zero-downtime migration with rollback plan |
| **KPIs** | Measurable success metrics |
| **Risk Mitigation** | Proactive failure handling |

---

## **2. System Architecture**
### **2.1 High-Level Architecture**
```mermaid
graph TD
    A[Client (PWA)] -->|HTTPS/WebSocket| B[API Gateway]
    B --> C[Auth Service]
    B --> D[Document Service]
    B --> E[Search Service]
    B --> F[Notification Service]
    B --> G[Analytics Service]
    D --> H[(Document Storage - S3/MinIO)]
    D --> I[(Database - PostgreSQL)]
    E --> J[Elasticsearch Cluster]
    G --> K[(Data Lake - S3 + Athena)]
    L[Third-Party APIs] --> B
    M[Webhooks] --> B
```

### **2.2 Microservices Breakdown**
| Service | Responsibility | Tech Stack |
|---------|---------------|------------|
| **Document Service** | Core CRUD, versioning, metadata | Node.js (TypeScript), Fastify, PostgreSQL |
| **Search Service** | Full-text search, filtering | Elasticsearch, Kibana |
| **AI/ML Service** | OCR, classification, predictive analytics | Python (FastAPI), TensorFlow, OpenCV |
| **Notification Service** | Real-time updates (WebSocket/SSE) | Node.js, Socket.io, Redis |
| **Analytics Service** | Dashboards, reporting, KPIs | Python (Pandas, Matplotlib), Grafana |
| **Auth Service** | JWT/OAuth2, RBAC, MFA | Keycloak, Redis |
| **Storage Service** | File storage, encryption | AWS S3/MinIO, AES-256 |
| **Audit Service** | Compliance logging | PostgreSQL, Kafka |

---

## **3. Performance Enhancements (Target: <50ms Response Time)**
### **3.1 Caching Strategies**
- **Redis Cache** (TTL-based, LRU eviction)
- **CDN for Static Assets** (Cloudflare, AWS CloudFront)
- **Database Query Optimization** (Indexing, Query Planning)

**Example: Redis Caching in TypeScript**
```typescript
import { createClient } from 'redis';
import { Document } from './models/document';

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

export async function getDocumentCached(id: string): Promise<Document | null> {
  const cachedDoc = await redisClient.get(`doc:${id}`);
  if (cachedDoc) return JSON.parse(cachedDoc);

  const doc = await Document.findById(id).lean();
  if (doc) await redisClient.set(`doc:${id}`, JSON.stringify(doc), { EX: 300 }); // 5min TTL
  return doc;
}
```

### **3.2 Database Optimization**
- **PostgreSQL** (Partitioning, Read Replicas)
- **Elasticsearch** (Full-text search, aggregations)
- **Connection Pooling** (PgBouncer)

**Example: Optimized PostgreSQL Query**
```typescript
// Using Prisma ORM for optimized queries
const documents = await prisma.document.findMany({
  where: { tenantId: tenantId, status: 'ACTIVE' },
  select: { id: true, name: true, metadata: true }, // Only fetch required fields
  orderBy: { createdAt: 'desc' },
  take: 50, // Pagination
});
```

### **3.3 Load Balancing & Auto-Scaling**
- **Kubernetes HPA** (Horizontal Pod Autoscaler)
- **NGINX Ingress** (Traffic routing)
- **Circuit Breakers** (Resilience4j)

**Example: Kubernetes HPA Configuration**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: document-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: document-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## **4. Real-Time Features (WebSocket/SSE)**
### **4.1 WebSocket Implementation**
- **Socket.io** for bidirectional communication
- **Redis Pub/Sub** for scaling

**Example: WebSocket Document Updates**
```typescript
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const io = new Server(server, { cors: { origin: '*' } });
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// Broadcast document updates to all connected clients
documentService.on('documentUpdated', (doc) => {
  io.to(`tenant:${doc.tenantId}`).emit('document:update', doc);
});

// Client-side subscription
io.on('connection', (socket) => {
  socket.on('subscribe', (tenantId) => {
    socket.join(`tenant:${tenantId}`);
  });
});
```

### **4.2 Server-Sent Events (SSE)**
- **Lightweight alternative to WebSocket**
- **Automatic reconnection**

**Example: SSE Document Stream**
```typescript
import { FastifyInstance } from 'fastify';

export async function sseDocumentStream(fastify: FastifyInstance) {
  fastify.get('/documents/stream', (req, reply) => {
    reply.sse((async function* source() {
      const documents = await documentService.getRealTimeUpdates(req.tenantId);
      for await (const doc of documents) {
        yield { data: JSON.stringify(doc) };
      }
    })());
  });
}
```

---

## **5. AI/ML Capabilities & Predictive Analytics**
### **5.1 Document Classification & OCR**
- **TensorFlow.js** (Client-side ML)
- **Tesseract.js** (OCR)
- **Custom NLP Models** (Document categorization)

**Example: OCR with Tesseract.js**
```typescript
import Tesseract from 'tesseract.js';

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng', {
    logger: (m) => console.log(m),
  });
  return text;
}
```

### **5.2 Predictive Analytics**
- **Expiry Alerts** (Insurance, registration)
- **Maintenance Forecasting** (Using historical data)
- **Anomaly Detection** (Fraudulent documents)

**Example: Expiry Prediction with Python (FastAPI)**
```python
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime, timedelta
import pandas as pd

app = FastAPI()

class DocumentExpiryRequest(BaseModel):
    documents: list[dict]

@app.post("/predict/expiry")
async def predict_expiry(request: DocumentExpiryRequest):
    df = pd.DataFrame(request.documents)
    df['expiry_date'] = pd.to_datetime(df['expiry_date'])
    df['days_until_expiry'] = (df['expiry_date'] - datetime.now()).dt.days
    df['risk_level'] = df['days_until_expiry'].apply(
        lambda x: "HIGH" if x < 30 else "MEDIUM" if x < 90 else "LOW"
    )
    return df.to_dict(orient="records")
```

---

## **6. Progressive Web App (PWA) Design**
### **6.1 Offline-First Approach**
- **Service Worker** (Caching, background sync)
- **IndexedDB** (Offline storage)
- **Workbox** (PWA tooling)

**Example: Service Worker (TypeScript)**
```typescript
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/documents'),
  new CacheFirst({
    cacheName: 'documents-cache',
    plugins: [
      {
        handlerDidError: async () => {
          return await fetch('/api/documents/fallback');
        },
      },
    ],
  })
);
```

### **6.2 Installable PWA**
- **Web App Manifest**
- **Beforeinstallprompt Event**

**Example: Manifest.json**
```json
{
  "name": "FleetDocs",
  "short_name": "FleetDocs",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3f51b5",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## **7. WCAG 2.1 AAA Accessibility Compliance**
### **7.1 Key Accessibility Features**
| Feature | Implementation |
|---------|---------------|
| **Keyboard Navigation** | `tabindex`, `aria-*` attributes |
| **Screen Reader Support** | `role`, `aria-label`, `aria-live` |
| **High Contrast Mode** | CSS `prefers-contrast` |
| **Reduced Motion** | `@media (prefers-reduced-motion)` |
| **Form Accessibility** | `label`, `aria-describedby` |
| **ARIA Landmarks** | `header`, `nav`, `main`, `footer` |

**Example: Accessible Document Upload Form**
```tsx
import React from 'react';

export const DocumentUploadForm = () => {
  return (
    <form aria-labelledby="upload-heading">
      <h2 id="upload-heading">Upload Document</h2>
      <div>
        <label htmlFor="file-upload">Select File:</label>
        <input
          type="file"
          id="file-upload"
          aria-describedby="file-help"
          accept=".pdf,.jpg,.png"
        />
        <span id="file-help">Supported formats: PDF, JPG, PNG</span>
      </div>
      <button type="submit" aria-label="Upload document">
        Upload
      </button>
    </form>
  );
};
```

---

## **8. Advanced Search & Filtering**
### **8.1 Elasticsearch Integration**
- **Full-text search**
- **Fuzzy matching**
- **Aggregations (facets)**

**Example: Elasticsearch Query (TypeScript)**
```typescript
import { Client } from '@elastic/elasticsearch';

const esClient = new Client({ node: process.env.ELASTICSEARCH_URL });

export async function searchDocuments(query: string, tenantId: string) {
  const { body } = await esClient.search({
    index: 'documents',
    body: {
      query: {
        bool: {
          must: [
            { match: { tenantId } },
            {
              multi_match: {
                query,
                fields: ['name^3', 'content', 'metadata.tags'],
                fuzziness: 'AUTO',
              },
            },
          ],
        },
      },
      aggs: {
        document_types: { terms: { field: 'type' } },
      },
    },
  });
  return body;
}
```

### **8.2 Frontend Search UI (React)**
```tsx
import React, { useState } from 'react';
import { searchDocuments } from './api';

export const DocumentSearch = ({ tenantId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const data = await searchDocuments(query, tenantId);
    setResults(data.hits.hits);
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search documents..."
      />
      <button onClick={handleSearch}>Search</button>
      <ul>
        {results.map((doc) => (
          <li key={doc._id}>{doc._source.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

---

## **9. Third-Party Integrations**
### **9.1 REST APIs**
- **OAuth2 Authentication**
- **Rate Limiting**
- **Swagger/OpenAPI Docs**

**Example: Fastify API with OAuth2**
```typescript
import fastify from 'fastify';
import fastifyOauth2 from '@fastify/oauth2';
import fastifySwagger from '@fastify/swagger';

const app = fastify();

app.register(fastifySwagger, { routePrefix: '/docs' });
app.register(fastifyOauth2, {
  name: 'googleOAuth2',
  credentials: {
    client: { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET },
    auth: fastifyOauth2.GOOGLE_CONFIGURATION,
  },
  startRedirectPath: '/login/google',
  callbackUri: 'http://localhost:3000/login/google/callback',
});

app.get('/protected', { preValidation: [app.oauth2] }, async (req) => {
  return { message: 'Authenticated!' };
});
```

### **9.2 Webhooks**
- **Event-driven notifications**
- **Retry mechanism**

**Example: Webhook Receiver (Fastify)**
```typescript
app.post('/webhooks/document-updated', async (req, reply) => {
  const { event, data } = req.body;

  if (event === 'document.uploaded') {
    await notifyThirdParty(data);
  }

  reply.status(200).send({ status: 'received' });
});
```

---

## **10. Gamification & User Engagement**
### **10.1 Badges & Achievements**
- **Points system**
- **Leaderboards**
- **Daily challenges**

**Example: Badge System (TypeScript)**
```typescript
export enum BadgeType {
  UPLOADER = 'uploader',
  ORGANIZER = 'organizer',
  COMPLIANT = 'compliant',
}

export async function awardBadge(userId: string, badge: BadgeType) {
  const user = await User.findById(userId);
  if (!user.badges.includes(badge)) {
    user.badges.push(badge);
    await user.save();
    await notifyUser(`You earned the ${badge} badge!`);
  }
}
```

### **10.2 Frontend Gamification UI (React)**
```tsx
import React from 'react';

export const UserProfile = ({ user }) => {
  return (
    <div>
      <h2>{user.name}</h2>
      <div className="badges">
        {user.badges.map((badge) => (
          <span key={badge} className="badge">
            {badge}
          </span>
        ))}
      </div>
      <div className="leaderboard">
        <h3>Top Uploaders</h3>
        <ol>
          {user.leaderboard.map((entry, i) => (
            <li key={i}>
              {entry.name} - {entry.points} points
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
```

---

## **11. Analytics Dashboards & Reporting**
### **11.1 Real-Time Dashboards (Grafana)**
- **Document upload trends**
- **Expiry alerts**
- **User activity**

**Example: Grafana Dashboard JSON**
```json
{
  "title": "Document Management Analytics",
  "panels": [
    {
      "title": "Documents Uploaded (Last 30 Days)",
      "type": "graph",
      "targets": [
        {
          "expr": "sum(rate(document_uploads_total[1d])) by (tenant)",
          "legendFormat": "{{tenant}}"
        }
      ]
    }
  ]
}
```

### **11.2 Custom Reports (Python + Pandas)**
```python
import pandas as pd
from fastapi import FastAPI

app = FastAPI()

@app.get("/reports/expiry")
async def generate_expiry_report(tenant_id: str):
    documents = await get_documents(tenant_id)
    df = pd.DataFrame(documents)
    df['expiry_date'] = pd.to_datetime(df['expiry_date'])
    df['days_until_expiry'] = (df['expiry_date'] - pd.Timestamp.now()).dt.days
    report = df.groupby('type')['days_until_expiry'].mean().to_dict()
    return report
```

---

## **12. Security Hardening**
### **12.1 Encryption**
- **AES-256 for data at rest**
- **TLS 1.3 for data in transit**

**Example: File Encryption (Node.js)**
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = process.env.ENCRYPTION_KEY; // 32-byte key

export function encryptFile(buffer: Buffer): { iv: string; data: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(KEY), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { iv: iv.toString('hex'), data: encrypted.toString('hex') };
}

export function decryptFile(iv: string, data: string): Buffer {
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(KEY), Buffer.from(iv, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]);
}
```

### **12.2 Audit Logging**
- **Immutable logs (Kafka + PostgreSQL)**
- **SIEM Integration (Splunk, ELK)**

**Example: Audit Log Middleware (Fastify)**
```typescript
app.addHook('onRequest', async (req) => {
  const auditLog = {
    timestamp: new Date(),
    userId: req.user?.id,
    action: req.method,
    path: req.url,
    ip: req.ip,
  };
  await AuditLog.create(auditLog);
});
```

### **12.3 Compliance (GDPR, CCPA, SOC2)**
- **Data anonymization**
- **Right to erasure**
- **Consent management**

**Example: GDPR Data Deletion**
```typescript
export async function deleteUserData(userId: string) {
  // Anonymize personal data
  await User.updateOne({ _id: userId }, { $set: { name: 'Deleted User', email: null } });

  // Delete documents (soft delete)
  await Document.updateMany({ ownerId: userId }, { $set: { deleted: true } });

  // Log compliance action
  await AuditLog.create({ action: 'GDPR_DELETION', userId });
}
```

---

## **13. Comprehensive Testing Strategy**
### **13.1 Unit Testing (Jest)**
```typescript
import { DocumentService } from './document.service';
import { Document } from './document.model';

jest.mock('./document.model');

describe('DocumentService', () => {
  it('should upload a document', async () => {
    const mockDoc = { id: '1', name: 'test.pdf' };
    Document.create.mockResolvedValue(mockDoc);

    const service = new DocumentService();
    const result = await service.uploadDocument('1', 'test.pdf', Buffer.from(''));

    expect(result).toEqual(mockDoc);
    expect(Document.create).toHaveBeenCalled();
  });
});
```

### **13.2 Integration Testing (Supertest)**
```typescript
import request from 'supertest';
import app from '../app';

describe('Document API', () => {
  it('should return 200 for GET /documents', async () => {
    const res = await request(app)
      .get('/documents')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
  });
});
```

### **13.3 End-to-End Testing (Cypress)**
```typescript
describe('Document Upload Flow', () => {
  it('should upload a document successfully', () => {
    cy.visit('/documents');
    cy.get('input[type="file"]').attachFile('test.pdf');
    cy.get('button').contains('Upload').click();
    cy.contains('Document uploaded successfully').should('be.visible');
  });
});
```

### **13.4 Performance Testing (k6)**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3000/api/documents');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 50ms': (r) => r.timings.duration < 50,
  });
}
```

---

## **14. Kubernetes Deployment Architecture**
### **14.1 Helm Charts**
```yaml
# values.yaml
replicaCount: 3
image:
  repository: fleet-docs/document-service
  tag: latest
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 200m
    memory: 256Mi
```

### **14.2 Ingress Configuration**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: document-service-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: docs.fleetmanagement.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: document-service
                port:
                  number: 3000
```

### **14.3 CI/CD Pipeline (GitHub Actions)**
```yaml
name: Deploy Document Service
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker build -t fleet-docs/document-service .
      - name: Log in to Docker Hub
        run: echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
      - name: Push to Docker Hub
        run: docker push fleet-docs/document-service
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/
          kubectl rollout status deployment/document-service
```

---

## **15. Migration Strategy & Rollback Plan**
### **15.1 Zero-Downtime Migration**
- **Blue-Green Deployment**
- **Database Schema Migrations (Flyway/Liquibase)**

**Example: Flyway Migration**
```sql
-- V1__Initial_schema.sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- V2__Add_metadata_column.sql
ALTER TABLE documents ADD COLUMN metadata JSONB;
```

### **15.2 Rollback Plan**
1. **Revert Kubernetes Deployment**
   ```sh
   kubectl rollout undo deployment/document-service
   ```
2. **Restore Database from Backup**
   ```sh
   pg_restore -U postgres -d fleet_docs -Fc latest_backup.dump
   ```
3. **Fallback to Previous Version**
   - **Feature Flags** (Toggle new features off)
   - **Canary Rollback** (Shift traffic back to old version)

---

## **16. Key Performance Indicators (KPIs)**
| KPI | Target | Measurement |
|-----|--------|-------------|
| **API Response Time** | <50ms (P99) | Prometheus + Grafana |
| **Document Upload Success Rate** | >99.9% | Application Logs |
| **Search Latency** | <100ms | Elasticsearch Monitoring |
| **User Engagement (DAU/MAU)** | >70% | Analytics Dashboard |
| **System Uptime** | >99.95% | SLA Monitoring |
| **Compliance Audit Pass Rate** | 100% | Internal Audits |

---

## **17. Risk Mitigation Strategies**
| Risk | Mitigation Strategy |
|------|---------------------|
| **Data Loss** | Automated backups (daily + point-in-time recovery) |
| **DDoS Attacks** | Cloudflare WAF + Rate Limiting |
| **AI Model Drift** | Continuous retraining + A/B testing |
| **Third-Party API Failures** | Circuit breakers + Fallback mechanisms |
| **Compliance Violations** | Automated compliance checks + Audit logs |
| **Performance Degradation** | Auto-scaling + Load testing |

---

## **18. Conclusion**
This **TO-BE** design outlines a **next-generation Document Management Module** for the **Fleet Management System**, incorporating:
✅ **Sub-50ms performance** (Redis, Elasticsearch, Kubernetes)
✅ **Real-time updates** (WebSocket, SSE)
✅ **AI-powered features** (OCR, predictive analytics)
✅ **PWA for offline access**
✅ **WCAG 2.1 AAA compliance**
✅ **Enterprise-grade security** (Encryption, Audit Logs, GDPR)
✅ **Comprehensive testing & deployment strategies**

**Next Steps:**
1. **Prototype development** (MVP with core features)
2. **Performance benchmarking** (Load testing with k6)
3. **Security audit** (Penetration testing)
4. **User acceptance testing (UAT)**
5. **Gradual rollout** (Canary deployment)

---

**Appendices**
- [API Documentation (Swagger/OpenAPI)](./api-docs.md)
- [Database Schema](./db-schema.md)
- [UI/UX Wireframes](./wireframes.md)
- [Security Compliance Checklist](./security-checklist.md)

---

**Approval**
| Role | Name | Approval Date |
|------|------|---------------|
| **Product Owner** | [Name] | [Date] |
| **Tech Lead** | [Name] | [Date] |
| **Security Lead** | [Name] | [Date] |
| **QA Lead** | [Name] | [Date] |

---
**End of Document** 🚀