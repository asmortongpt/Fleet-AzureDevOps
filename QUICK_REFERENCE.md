# Fleet Management System - Quick Reference

## Key Components At-A-Glance

### Backend Server
- **File**: `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/server.ts`
- **Framework**: Express.js 4.18.2
- **Language**: TypeScript 5.3.3
- **Database**: PostgreSQL
- **Real-time**: WebSocket (ws 8.16.0) + Azure Web PubSub

### OBD2 Vehicle Diagnostics
- **Service**: `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/services/obd2.service.ts`
- **Routes**: `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes/mobile-obd2.routes.ts`
- **Supported Adapters**: ELM327, Vgate, OBDLink, BlueDriver, Generic
- **Connection Types**: Bluetooth, WiFi, USB
- **Key Endpoints**:
  - `POST /api/mobile/obd2/connect` - Register adapter
  - `POST /api/mobile/obd2/live-data` - Stream real-time data
  - `POST /api/mobile/obd2/dtcs` - Report diagnostic codes

### Real-time Dispatch System
- **Service**: `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/services/dispatch.service.ts`
- **WebSocket Path**: `/api/dispatch/ws`
- **Features**: Audio streaming, push-to-talk, transcription, incident tagging
- **Azure Services**: Web PubSub, Blob Storage, Speech Services, OpenAI

### Telemetry & Monitoring
- **Backend Config**: `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/config/telemetry.ts`
- **Frontend**: `/Users/andrewmorton/Documents/GitHub/Fleet/src/telemetry/` (DISABLED - React 19 incompatibility)
- **Technology**: OpenTelemetry + Azure Application Insights
- **Traces**: HTTP, Express routes, PostgreSQL, Redis

### Web Frontend
- **Framework**: React 19.0.0 + Vite 6.3.5
- **Location**: `/Users/andrewmorton/Documents/GitHub/Fleet/src/`
- **Components**: 62 component directories
- **Hooks**: 36 custom hooks
- **State**: React Query 5.83.1 + SWR 2.3.6
- **Maps**: Leaflet 1.9.4, Azure Maps, Mapbox GL 3.10.0
- **Visualization**: Three.js, D3, Recharts

### Mobile App (iOS)
- **Location**: `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/`
- **Language**: Swift + SwiftUI
- **OBD2 Manager**: `/App/OBD2Manager.swift`
- **Data Parser**: `/App/OBD2DataParser.swift`
- **Sync Service**: `/App/Services/OBD2/OBD2SyncService.swift`

### Database
- **Type**: PostgreSQL
- **Location**: `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/config/database.ts`
- **Migrations**: `/Users/andrewmorton/Documents/GitHub/Fleet/api/database/migrations/`
- **Security**: Row-Level Security (RLS), Multi-tenancy, Parameterized queries

### Security
- **Auth**: JWT + Azure AD
- **Auth Middleware**: `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/middleware/auth.ts`
- **CSRF Protection**: `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/middleware/csrf.ts`
- **Multi-tenancy**: `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/middleware/tenant-context.ts`
- **RBAC**: `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/middleware/permissions.ts`

## API Routes Summary (50+)

**Core Fleet**: `/vehicles`, `/drivers`, `/work-orders`, `/maintenance-schedules`, `/fuel-transactions`

**Telemetry**: `/telemetry`, `/telematics`, `/video-telematics`, `/vehicle-3d`

**Mobile OBD2**: `/mobile/obd2/*`, `/mobile/ocr`, `/mobile/trips`, `/mobile/notifications`

**Dispatch**: `/dispatch`, `/dispatch/ws` (WebSocket)

**Integration**: `/teams`, `/outlook`, `/sync`, `/webhooks/*`

**Business**: `/purchase-orders`, `/mileage-reimbursement`, `/billing-reports`, `/vendors`

## Vehicle Data Flow

```
iOS App (OBD2 scan)
    ↓
OBD2Manager (CoreBluetooth)
    ↓
ELM327 Adapter (Bluetooth/WiFi/USB)
    ↓
OBD2DataParser
    ↓
OBD2SyncService (local queue + sync)
    ↓
API: POST /api/mobile/obd2/live-data
    ↓
Express Server (obd2.service.ts)
    ↓
PostgreSQL (telemetry tables)
    ↓
OpenTelemetry Spans
    ↓
Azure Application Insights
    ↓
React Frontend (React Query + SWR)
    ↓
Vehicle Dashboard (real-time display)
```

## Real-time Communication Flow

```
Client (Web/Mobile)
    ↓ WebSocket Connection
/api/dispatch/ws
    ↓
WebSocketServer (ws library)
    ↓
DispatchService
    ↓
Azure Web PubSub (broadcast)
    ↓
All connected clients (real-time update)
```

## Key Metrics

- **OBD2 Business Value**: $800,000/year
- **Dispatch Business Value**: $150,000/year
- **API Routes**: 50+
- **Database Migrations**: 15+
- **Frontend Components**: 62+
- **Custom Hooks**: 36+
- **Job Queue Support**: Bull + pg-boss
- **Connection Pools**: Write, Read, Admin (3 levels)

## Environment Variables Required

**Azure Services**:
- `APPLICATIONINSIGHTS_CONNECTION_STRING`
- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`
- `AZURE_WEBPUBSUB_CONNECTION_STRING`
- `AZURE_OPENAI_ENDPOINT`

**Database**:
- `DATABASE_URL` (PostgreSQL)
- `DATABASE_READ_REPLICA_URL` (optional)

**Authentication**:
- `JWT_SECRET`
- `AZURE_AD_CLIENT_ID`
- `AZURE_AD_CLIENT_SECRET`

**API**:
- `NODE_ENV` (development/staging/production)
- `API_PORT` (default 3000)
- `API_HOST` (default localhost)

## Testing

**Tests Location**: `/Users/andrewmorton/Documents/GitHub/Fleet/tests/`

**Test Scripts**:
- `npm test` - Playwright tests
- `npm run test:smoke` - Smoke tests
- `npm run test:e2e` - End-to-end tests
- `npm run test:unit` - Vitest unit tests

**API Tests**: `/Users/andrewmorton/Documents/GitHub/Fleet/tests/api/python/`

## Deployment

**Docker**:
- `/Users/andrewmorton/Documents/GitHub/Fleet/api/Dockerfile`
- `/Users/andrewmorton/Documents/GitHub/Fleet/api/Dockerfile.production`

**Kubernetes**:
- `/Users/andrewmorton/Documents/GitHub/Fleet/k8s/` (Helm charts)

**Infrastructure**:
- `/Users/andrewmorton/Documents/GitHub/Fleet/terraform/` (IaC)
- `/Users/andrewmorton/Documents/GitHub/Fleet/azure-pipelines/` (CI/CD)

## Critical Security Notes

1. **Parameterized Queries Only**: Never concatenate SQL strings
2. **RLS Enforcement**: Row-Level Security mandatory on multi-tenant tables
3. **Tenant Context**: Middleware sets PostgreSQL session variable
4. **CSRF Tokens**: Required for all state-changing operations
5. **Rate Limiting**: 10 req/60s on sensitive endpoints
6. **Audit Logging**: All operations logged via audit middleware

## Next Steps

1. Read full report: `/Users/andrewmorton/Documents/GitHub/Fleet/CODEBASE_EXPLORATION_REPORT.md`
2. Start with backend: `/api/src/server.ts` 
3. Explore OBD2 service: `/api/src/services/obd2.service.ts`
4. Check routes: `/api/src/routes/mobile-obd2.routes.ts`
5. Mobile integration: `/mobile-apps/ios-native/App/OBD2Manager.swift`
6. Real-time system: `/api/src/services/dispatch.service.ts`

