# Fleet Enterprise Architecture
## System Design & Technical Specifications

**Version:** 1.0  
**Last Updated:** November 7, 2025  
**Architecture Type:** Cloud-Native, Microservices-Ready

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT TIER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web App     │  │  Mobile PWA  │  │  Admin Portal│      │
│  │  (React 19)  │  │  (React 19)  │  │  (React 19)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                  AZURE FRONT DOOR / CDN                      │
│           (SSL Termination, DDoS Protection, WAF)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               AZURE STATIC WEB APPS                          │
│         (Frontend Hosting, Auto-Scaling)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓ API Calls
┌─────────────────────────────────────────────────────────────┐
│                  API GATEWAY / APIM                          │
│     (Rate Limiting, Throttling, Analytics, Caching)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION TIER                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │        AZURE FUNCTIONS (Backend API)                  │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │  │
│  │  │ Fleet  │ │ Work   │ │ Fuel   │ │ Vendor │        │  │
│  │  │  API   │ │ Orders │ │  Mgmt  │ │  Mgmt  │ ...    │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                ↓                    ↓
┌─────────────────────┐   ┌─────────────────────────┐
│    DATA TIER        │   │   EXTERNAL SERVICES     │
│  ┌───────────────┐  │   │  ┌──────────────────┐  │
│  │  Azure SQL DB │  │   │  │ Azure OpenAI     │  │
│  │  or CosmosDB  │  │   │  │  (GPT-4)         │  │
│  └───────────────┘  │   │  └──────────────────┘  │
│  ┌───────────────┐  │   │  ┌──────────────────┐  │
│  │ Blob Storage  │  │   │  │ Microsoft Graph  │  │
│  │ (Files/Images)│  │   │  │  (Teams/Outlook) │  │
│  └───────────────┘  │   │  └──────────────────┘  │
│  ┌───────────────┐  │   │  ┌──────────────────┐  │
│  │  Redis Cache  │  │   │  │ Azure Maps       │  │
│  └───────────────┘  │   │  └──────────────────┘  │
└─────────────────────┘   └─────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│                MONITORING & SECURITY                         │
│  ┌────────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  Application   │  │   Azure    │  │   Azure Key      │  │
│  │   Insights     │  │    AD      │  │     Vault        │  │
│  │  (Monitoring)  │  │   (Auth)   │  │   (Secrets)      │  │
│  └────────────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ TECHNOLOGY STACK

### Frontend Stack
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 19.0 | UI library |
| **Language** | TypeScript | 5.7 | Type safety |
| **Build Tool** | Vite | 6.3 | Fast builds |
| **Styling** | Tailwind CSS | 4.1 | Utility-first CSS |
| **Components** | Radix UI | Latest | Accessible primitives |
| **State** | React Query | 5.83 | Server state |
| **Forms** | React Hook Form | 7.54 | Form management |
| **Validation** | Zod | 3.25 | Schema validation |
| **Icons** | Phosphor Icons | 2.1 | Icon system |
| **Charts** | Recharts | 2.15 | Data visualization |

### Backend Stack
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 20 LTS | JavaScript runtime |
| **Framework** | Express.js | 4.x | Web framework |
| **Language** | TypeScript | 5.7 | Type safety |
| **Database** | Azure SQL / CosmosDB | Latest | Data persistence |
| **ORM** | Prisma | 5.x | Database access |
| **Auth** | Azure AD B2C | Latest | Authentication |
| **Validation** | Zod | 3.25 | Input validation |
| **Testing** | Vitest + Supertest | Latest | Unit/integration tests |

### Azure Services
| Service | Purpose | Tier |
|---------|---------|------|
| **Static Web Apps** | Frontend hosting | Standard |
| **Function App** | Backend API | Premium P1V2 |
| **SQL Database** | Relational data | S2 Standard |
| **Storage Account** | File storage | Standard_LRS |
| **OpenAI Service** | AI features | Pay-per-use |
| **Application Insights** | Monitoring | Pay-per-GB |
| **Azure AD B2C** | Authentication | Pay-per-MAU |
| **Key Vault** | Secrets management | Standard |
| **Front Door** | CDN + WAF | Standard |
| **SignalR** | Real-time updates | Standard |

---

## 📐 ARCHITECTURE PATTERNS

### 1. Frontend Architecture (React)

```
src/
├── components/
│   ├── ui/                    # Radix UI wrappers
│   ├── modules/               # Feature modules (21 modules)
│   └── dialogs/               # Modal components
├── hooks/
│   ├── use-fleet-data.ts      # Data management
│   └── use-mobile.ts          # Responsive utilities
├── lib/
│   ├── types.ts               # TypeScript interfaces
│   ├── utils.ts               # Utility functions
│   ├── aiAssistant.ts         # AI service
│   └── msOfficeIntegration.ts # MS Graph
└── styles/
    └── theme.css              # Global styles
```

**Design Patterns:**
- **Component Composition** - Radix UI primitives
- **Custom Hooks** - Reusable logic extraction
- **React Query** - Server state management
- **Error Boundaries** - Graceful error handling

### 2. Backend Architecture (API)

```
api/
├── src/
│   ├── server.ts              # Express app entry point
│   ├── config/
│   │   ├── database.ts        # DB connection
│   │   ├── azure.ts           # Azure clients
│   │   └── environment.ts     # Config management
│   ├── routes/
│   │   ├── vehicles.ts        # Vehicle endpoints
│   │   ├── drivers.ts         # Driver endpoints
│   │   └── ...                # 18 route files
│   ├── controllers/
│   │   ├── vehicleController.ts
│   │   └── ...
│   ├── services/
│   │   ├── vehicleService.ts  # Business logic
│   │   └── ...
│   ├── models/
│   │   ├── Vehicle.ts         # TypeScript types
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification
│   │   ├── validation.ts      # Input validation
│   │   ├── errorHandler.ts    # Error middleware
│   │   └── rateLimiter.ts     # Rate limiting
│   └── utils/
│       ├── logger.ts          # Winston logger
│       └── apiResponse.ts     # Standard responses
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── prisma/
    ├── schema.prisma          # Database schema
    └── migrations/            # DB migrations
```

**Design Patterns:**
- **MVC Pattern** - Routes → Controllers → Services → Models
- **Dependency Injection** - Service layer isolation
- **Repository Pattern** - Data access abstraction
- **Middleware Chain** - Request processing pipeline

### 3. Database Design

#### Azure SQL Schema (Relational)
```sql
-- Core entities
TABLE vehicles (
  id UUID PRIMARY KEY,
  number VARCHAR(20) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL,
  make VARCHAR(50),
  model VARCHAR(50),
  year INT,
  vin VARCHAR(17) UNIQUE,
  license_plate VARCHAR(20),
  status VARCHAR(20),
  -- location fields
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  address VARCHAR(255),
  -- operational fields
  region VARCHAR(50),
  department VARCHAR(50),
  fuel_level INT,
  fuel_type VARCHAR(20),
  mileage INT,
  ownership VARCHAR(20),
  -- dates
  last_service DATE,
  next_service DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- indexes
  INDEX idx_status (status),
  INDEX idx_region (region),
  INDEX idx_department (department),
  INDEX idx_location (latitude, longitude)
)

-- Relationships
TABLE drivers (...)
TABLE work_orders (vehicle_id FK vehicles(id), ...)
TABLE fuel_transactions (vehicle_id FK, ...)
TABLE maintenance_requests (vehicle_id FK, ...)
TABLE vehicle_alerts (vehicle_id FK, ...)
```

#### CosmosDB Schema (NoSQL Alternative)
```json
{
  "id": "veh-1001",
  "partitionKey": "region-east",
  "type": "vehicle",
  "data": {
    "number": "FL-1001",
    "make": "Ford",
    "model": "F-150",
    "status": "active",
    "location": {
      "type": "Point",
      "coordinates": [-80.1918, 25.7617]
    },
    "alerts": ["low_fuel", "maintenance_due"],
    "metadata": {
      "created": "2025-01-01T00:00:00Z",
      "updated": "2025-11-07T00:00:00Z"
    }
  }
}
```

**Indexing Strategy:**
- Partition by region (geographic distribution)
- Index on status, department, type
- Composite index on (status, region)
- Full-text search on make/model

---

## 🔐 SECURITY ARCHITECTURE

### Authentication Flow (Azure AD B2C)
```
1. User clicks "Login"
   ↓
2. Redirect to Azure AD B2C
   ↓
3. User authenticates (email/password or SSO)
   ↓
4. Azure AD returns JWT token
   ↓
5. Frontend stores token (httpOnly cookie)
   ↓
6. All API calls include token in Authorization header
   ↓
7. API validates token with Azure AD
   ↓
8. API checks RBAC permissions
   ↓
9. Allow/Deny request
```

### Role-Based Access Control (RBAC)
```typescript
enum Role {
  SuperAdmin = 'super_admin',     // Full access
  FleetManager = 'fleet_manager',  // Manage fleet
  Supervisor = 'supervisor',       // Approve requests
  Driver = 'driver',               // View own data
  Technician = 'technician',       // Manage work orders
  ReadOnly = 'read_only'           // View only
}

const permissions = {
  super_admin: ['*'],
  fleet_manager: [
    'vehicles:*',
    'drivers:*',
    'workorders:*',
    'reports:read'
  ],
  driver: [
    'vehicles:read:assigned',
    'workorders:create',
    'fuel:create'
  ]
}
```

### Security Layers
1. **Network Security**
   - Azure Front Door (DDoS protection)
   - WAF (Web Application Firewall)
   - Private endpoints for database

2. **Application Security**
   - HTTPS everywhere (TLS 1.3)
   - CSP headers
   - CSRF tokens
   - Rate limiting (100 req/min/IP)
   - Input validation (Zod schemas)

3. **Data Security**
   - Encryption at rest (Azure Storage)
   - Encryption in transit (TLS)
   - Secrets in Key Vault
   - SQL injection protection
   - XSS protection

4. **Identity Security**
   - Multi-factor authentication (MFA)
   - Conditional access policies
   - Session timeout (1 hour)
   - Token refresh (every 15 min)

---

## 📊 DATA FLOW DIAGRAMS

### Vehicle Creation Flow
```
User (Web) → Click "Add Vehicle"
    ↓
Component → Open Dialog with Form
    ↓
Form → User fills details
    ↓
Submit → Validate with Zod schema
    ↓
API Call → POST /api/vehicles {data}
    ↓
API → Verify JWT token
    ↓
API → Check permissions (RBAC)
    ↓
API → Validate input (Zod)
    ↓
Service Layer → Business logic (check duplicates)
    ↓
Database → INSERT INTO vehicles
    ↓
Database → Return new vehicle
    ↓
API → Return 201 Created {vehicle}
    ↓
Frontend → Invalidate cache (React Query)
    ↓
Frontend → Refetch vehicles list
    ↓
UI → Show success toast + updated list
```

### Real-Time GPS Update Flow (Future)
```
OBD-II Device → Send GPS data
    ↓
Azure IoT Hub → Receive telemetry
    ↓
Event Grid → Trigger function
    ↓
Function → Process & validate
    ↓
SignalR → Broadcast update
    ↓
Connected Clients → Receive update
    ↓
React Component → Update map marker
```

---

## 🚀 SCALABILITY STRATEGY

### Horizontal Scaling
- **Frontend:** Auto-scaling via Azure Static Web Apps
- **Backend:** Azure Functions consumption plan (auto-scale)
- **Database:** Azure SQL elastic pool or CosmosDB auto-scale

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
const cacheKey = `vehicles:region:${region}`
let vehicles = await redis.get(cacheKey)

if (!vehicles) {
  vehicles = await db.vehicles.findMany({
    where: { region }
  })
  await redis.setex(cacheKey, 300, JSON.stringify(vehicles)) // 5 min TTL
}
```

### CDN Strategy
- Static assets (JS, CSS, images) → Azure Front Door CDN
- API responses (cacheable) → API Management caching
- Database query results → Redis cache

### Load Balancing
- Azure Front Door → Geographic load balancing
- Function App → Automatic load distribution
- Database → Read replicas for reporting queries

---

## 📈 MONITORING & OBSERVABILITY

### Application Insights Integration
```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web'

const appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.APPINSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true
  }
})

appInsights.loadAppInsights()

// Custom events
appInsights.trackEvent({
  name: 'VehicleCreated',
  properties: { vehicleId, userId }
})

// Performance tracking
appInsights.trackMetric({
  name: 'APIResponseTime',
  average: responseTime
})

// Error tracking
appInsights.trackException({
  exception: error,
  severityLevel: SeverityLevel.Error
})
```

### Monitoring Dashboards
1. **Application Health**
   - Response time (p50, p95, p99)
   - Error rate (target: <1%)
   - Availability (target: 99.9%)

2. **Business Metrics**
   - Active users (DAU, MAU)
   - Vehicles managed
   - Work orders created
   - API calls per module

3. **Infrastructure Metrics**
   - CPU/Memory usage
   - Database connections
   - Storage usage
   - Costs per service

### Alerting Rules
```
CRITICAL Alerts (PagerDuty):
- Error rate >5% for 5 minutes
- Response time >5s for 5 minutes
- Availability <99% for 10 minutes
- Database connection failures

WARNING Alerts (Email):
- Error rate >2% for 15 minutes
- Response time >2s for 10 minutes
- Unusual traffic patterns
- High Azure costs

INFO Alerts (Slack):
- New deployment completed
- Scale events triggered
- Database backup completed
```

---

## 🔄 CI/CD PIPELINE

### Build Pipeline
```yaml
Build → Test → Security Scan → Package → Deploy

Steps:
1. Checkout code
2. Install dependencies (npm ci)
3. Run linter (ESLint)
4. Type check (tsc --noEmit)
5. Run tests (vitest)
6. Security scan (npm audit)
7. Build frontend (vite build)
8. Build backend (tsc)
9. Package artifacts
10. Upload to Azure
```

### Deployment Strategy
```
Development → Staging → Production

Environments:
- Dev: Auto-deploy on every commit to main
- Staging: Auto-deploy on PR merge
- Production: Manual approval required

Deployment Technique:
- Blue-Green deployment
- 10% → 50% → 100% traffic shift
- Automatic rollback on errors
```

---

## 📦 DISASTER RECOVERY

### Backup Strategy
- **Database:** Daily automated backups (7-day retention)
- **Files:** Geo-redundant storage (GRS)
- **Configuration:** Infrastructure as Code (Terraform)

### Recovery Objectives
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour

### Disaster Recovery Plan
1. Detect outage (automated alerts)
2. Assess impact
3. Activate DR plan
4. Restore from backup
5. Redirect traffic to DR region
6. Verify functionality
7. Post-mortem analysis

---

**Document Version:** 1.0
**Last Updated:** November 7, 2025
**Next Review:** Quarterly or after major changes
