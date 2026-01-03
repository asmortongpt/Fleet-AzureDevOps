# Dependency Injection Migration Catalog

**ARCHITECTURE FIX (Backend High, 20 hrs):** Phase 2 - Structure - Service DI Migration

## Overview

This document catalogs all 99 services identified for DI migration, their current patterns, and migration priority.

**Discovery Date:** 2025-12-04
**Total Services:** 99 class-based services
**Database Imports:** 84 services directly importing from `../config/database`
**Status:** 2 legacy singletons registered in container, 97 need migration

## Migration Patterns

### Current Legacy Pattern (Anti-Pattern)
```typescript
// ❌ BAD: Direct database import + singleton export
import { pool } from '../config/database'

class MyService {
  constructor() {
    // Direct usage of imported pool
  }

  async doSomething() {
    const result = await pool.query('SELECT ...')
  }
}

export default new MyService() // Singleton export
```

### Target DI Pattern
```typescript
// ✅ GOOD: Constructor injection + class export
import { Pool } from 'pg'
import { Logger } from 'winston'

export default class MyService {
  constructor(
    private db: Pool,
    private logger: Logger
  ) {}

  async doSomething() {
    this.logger.info('Doing something')
    const result = await this.db.query('SELECT ...')
    return result.rows
  }
}

// container.ts registration:
container.register({
  myService: asClass(MyService, {
    lifetime: Lifetime.SINGLETON
  })
})
```

## Priority Tiers

### Tier 1: Legacy Singletons Already in Container (2 services)
**Priority:** CRITICAL - These are already registered but use legacy pattern
**Estimated Time:** 4 hours total

| Service | File | Current Pattern | Container Registration |
|---------|------|-----------------|----------------------|
| dispatch.service.ts | `/api/src/services/dispatch.service.ts` | Legacy singleton, direct `pool` import | ✅ Registered as `dispatchService` |
| document.service.ts | `/api/src/services/document.service.ts` | Legacy singleton, direct `pool` import | ✅ Registered as `documentService` |

**Impact:** These services are already used by routes via DI container, but the service classes themselves use anti-patterns internally.

### Tier 2: Core Business Logic Services (15 services)
**Priority:** HIGH - Most frequently used by routes
**Estimated Time:** 6 hours total

| Service | File | Database Import | Business Domain |
|---------|------|-----------------|-----------------|
| VehicleService.ts | `/api/src/services/VehicleService.ts` | ✅ Yes | Vehicles |
| DriverService.ts | `/api/src/services/DriverService.ts` | ✅ Yes | Drivers |
| MaintenanceService.ts | `/api/src/services/MaintenanceService.ts` | ✅ Yes | Maintenance |
| WorkOrderService.ts | `/api/src/services/WorkOrderService.ts` | ✅ Yes | Work Orders |
| InspectionService.ts | `/api/src/services/InspectionService.ts` | ✅ Yes | Inspections |
| FuelTransactionService.ts | `/api/src/services/FuelTransactionService.ts` | ✅ Yes | Fuel |
| RouteService.ts | `/api/src/services/RouteService.ts` | ✅ Yes | Routes |
| drivers.service.ts | `/api/src/services/drivers.service.ts` | ✅ Yes | Drivers |
| vehicles.service.ts | `/api/src/services/vehicles.service.ts` | ✅ Yes | Vehicles |
| calendar.service.ts | `/api/src/services/calendar.service.ts` | ✅ Yes | Calendar |
| scheduling.service.ts | `/api/src/services/scheduling.service.ts` | ✅ Yes | Scheduling |
| teams.service.ts | `/api/src/services/teams.service.ts` | ✅ Yes | Teams |
| webhook.service.ts | `/api/src/services/webhook.service.ts` | ✅ Yes | Webhooks |
| sync.service.ts | `/api/src/services/sync.service.ts` | ✅ Yes | Sync |
| queue.service.ts | `/api/src/services/queue.service.ts` | ✅ Yes | Queue |

### Tier 3: Document Management Services (12 services) ✅ COMPLETE
**Priority:** MEDIUM-HIGH - Complex document ecosystem
**Estimated Time:** 4 hours total
**Actual Time:** ~2 hours (automated migration + fixes + verification)
**Completion Date:** 2025-12-04

| Service | File | Status | Notes |
|---------|------|--------|-------|
| DocumentAiService.ts | `/api/src/services/DocumentAiService.ts` | ✅ Complete | AI document processing, constructor injection |
| DocumentIndexer.ts | `/api/src/services/DocumentIndexer.ts` | ✅ Complete | Real-time indexing, registered in container |
| DocumentSearchService.ts | `/api/src/services/DocumentSearchService.ts` | ✅ Complete | Unified search system |
| document-audit.service.ts | `/api/src/services/document-audit.service.ts` | ✅ Complete | Audit logging, first migrated |
| document-folder.service.ts | `/api/src/services/document-folder.service.ts` | ✅ Complete | Folder management, SQL fix applied |
| document-geo.service.ts | `/api/src/services/document-geo.service.ts` | ✅ Complete | Geospatial operations |
| document-management.service.ts | `/api/src/services/document-management.service.ts` | ✅ Complete | Document lifecycle orchestration |
| document-permission.service.ts | `/api/src/services/document-permission.service.ts` | ✅ Complete | Role-based access control |
| document-rag.service.ts | `/api/src/services/document-rag.service.ts` | ✅ Complete | RAG for semantic search |
| document-search.service.ts | `/api/src/services/document-search.service.ts` | ✅ Complete | Full-text search with PostgreSQL |
| document-storage.service.ts | `/api/src/services/document-storage.service.ts` | ✅ Complete | Storage integration service |
| document-version.service.ts | `/api/src/services/document-version.service.ts` | ✅ Complete | Version history tracking |

**Migration Summary:**
- Discovery: Parallel file reading (12 services in <2 mins) - 0% DI-ready
- Migration: Automated via autonomous-coder agent
- Fixes: Template literal conversion for SQL strings (11 services)
- Verification: CodeQL v2.20.1 (205 queries) - ZERO vulnerabilities
- Container: All 12 services registered as SINGLETON in `/api/src/container.ts`
- Compilation: ✅ All production code compiles successfully

### Tier 4: AI/ML Services (14 services)
**Priority:** MEDIUM - Complex dependencies
**Estimated Time:** 5 hours total

| Service | File | Database Import | AI Function |
|---------|------|-----------------|-------------|
| ai-agent-supervisor.service.ts | `/api/src/services/ai-agent-supervisor.service.ts` | ❌ No | Agent supervision |
| ai-controls.service.ts | `/api/src/services/ai-controls.service.ts` | ❌ No | AI controls |
| ai-intake.service.ts | `/api/src/services/ai-intake.service.ts` | ❌ No | AI intake |
| ai-ocr.service.ts | `/api/src/services/ai-ocr.service.ts` | ❌ No | OCR |
| ai-validation.service.ts | `/api/src/services/ai-validation.service.ts` | ❌ No | Validation |
| driver-safety-ai.service.ts | `/api/src/services/driver-safety-ai.service.ts` | ✅ Yes | Driver safety |
| fleet-cognition.service.ts | `/api/src/services/fleet-cognition.service.ts` | ✅ Yes | Fleet intelligence |
| fleet-optimizer.service.ts | `/api/src/services/fleet-optimizer.service.ts` | ✅ Yes | Fleet optimization |
| langchain-orchestrator.service.ts | `/api/src/services/langchain-orchestrator.service.ts` | ✅ Yes | LangChain |
| ml-decision-engine.service.ts | `/api/src/services/ml-decision-engine.service.ts` | ✅ Yes | ML decisions |
| ml-training.service.ts | `/api/src/services/ml-training.service.ts` | ✅ Yes | ML training |
| rag-engine.service.ts | `/api/src/services/rag-engine.service.ts` | ✅ Yes | RAG engine |
| EmbeddingService.ts | `/api/src/services/EmbeddingService.ts` | ✅ Yes | Embeddings |
| VectorSearchService.ts | `/api/src/services/VectorSearchService.ts` | ✅ Yes | Vector search |

### Tier 5: Integration Services (18 services)
**Priority:** LOW-MEDIUM - External integrations
**Estimated Time:** 6 hours total

| Service | File | Database Import | Integration |
|---------|------|-----------------|-------------|
| microsoft-graph.service.ts | `/api/src/services/microsoft-graph.service.ts` | ❌ No | Microsoft Graph |
| microsoft-integration.service.ts | `/api/src/services/microsoft-integration.service.ts` | ❌ No | Microsoft 365 |
| outlook.service.ts | `/api/src/services/outlook.service.ts` | ✅ Yes | Outlook |
| google-calendar.service.ts | `/api/src/services/google-calendar.service.ts` | ✅ Yes | Google Calendar |
| samsara.service.ts | `/api/src/services/samsara.service.ts` | ❌ No | Samsara |
| smartcar.service.ts | `/api/src/services/smartcar.service.ts` | ❌ No | SmartCar |
| obd2.service.ts | `/api/src/services/obd2.service.ts` | ✅ Yes | OBD2 |
| obd2-emulator.service.ts | `/api/src/services/obd2-emulator.service.ts` | ❌ No | OBD2 Emulator |
| ocpp.service.ts | `/api/src/services/ocpp.service.ts` | ❌ No | EV Charging |
| ev-charging.service.ts | `/api/src/services/ev-charging.service.ts` | ❌ No | EV Charging |
| mobile-integration.service.ts | `/api/src/services/mobile-integration.service.ts` | ✅ Yes | Mobile apps |
| push-notification.service.ts | `/api/src/services/push-notification.service.ts` | ✅ Yes | Push notifications |
| sms.service.ts | `/api/src/services/sms.service.ts` | ✅ Yes | SMS |
| webrtc.service.ts | `/api/src/services/webrtc.service.ts` | ❌ No | WebRTC |
| video-telematics.service.ts | `/api/src/services/video-telematics.service.ts` | ❌ No | Video |
| mcp-server.service.ts | `/api/src/services/mcp-server.service.ts` | ✅ Yes | MCP Server |
| mcp-server-registry.service.ts | `/api/src/services/mcp-server-registry.service.ts` | ✅ Yes | MCP Registry |
| adaptive-cards.service.ts | `/api/src/services/adaptive-cards.service.ts` | ❌ No | Adaptive Cards |

### Tier 6: Utility/Support Services (38 services)
**Priority:** LOW - Supporting functionality
**Estimated Time:** 12 hours total

**Analytics & Reporting:**
- analytics/analytics.service.ts (DB: ✅)
- billing-reports.ts (DB: ✅)
- cost-analysis.service.ts (DB: ✅)
- custom-report.service.ts (DB: ✅)
- executive-dashboard.service.ts (DB: ✅)
- driver-scorecard.service.ts (DB: ✅)
- excel-export.service.ts (DB: ❌)
- roi-calculator.service.ts (DB: ❌)
- utilization-calc.service.ts (DB: ❌)

**Notifications & Alerts:**
- alert-engine.service.ts (DB: ❌)
- assignment-notification.service.ts (DB: ❌)
- email-notifications.ts (DB: ❌)
- notifications/notification.service.ts (DB: ✅)
- scheduling-notification.service.ts (DB: ✅)

**Storage & Media:**
- attachment.service.ts (DB: ✅)
- photo-processing.service.ts (DB: ✅)
- photo-storage.service.ts (DB: ❌)
- offline-storage.service.ts (DB: ✅)
- StorageManager.ts (DB: ❌)

**Security & Compliance:**
- auditService.ts (DB: ❌)
- fips-crypto.service.ts (DB: ❌)
- fips-jwt.service.ts (DB: ❌)

**Search & Indexing:**
- SearchIndexService.ts (DB: ✅)
- OcrService.ts (DB: ✅)
- OcrQueueService.ts (DB: ✅)
- ocr.service.ts (DB: ✅)

**Traffic & Location:**
- traffic/fl511-cameras.service.ts (DB: ❌)
- traffic/camera-map-layers.service.ts (DB: ❌)
- mapbox.service.ts (DB: ❌)
- vehicle-identification.service.ts (DB: ✅)
- vehicle-models.service.ts (DB: ❌)

**Other Utilities:**
- custom-fields/custom-fields.service.ts (DB: ✅)
- collaboration/real-time.service.ts (DB: ✅)
- presence.service.ts (DB: ✅)
- query-performance.service.ts (DB: ❌)
- streaming-query.service.ts (DB: ❌)
- qr-generator.service.ts (DB: ❌)
- video-privacy.service.ts (DB: ❌)

## Migration Steps (Per Service)

1. **Update Imports**
   - Remove: `import pool from '../config/database'`
   - Remove: `import { pool } from '../config/database'`
   - Add: `import { Pool } from 'pg'`
   - Add: `import { Logger } from 'winston'`

2. **Add Constructor**
   ```typescript
   constructor(
     private db: Pool,
     private logger: Logger
   ) {}
   ```

3. **Update Database Calls**
   - Replace: `pool.query(...)` → `this.db.query(...)`
   - Replace: `await pool` → `await this.db`

4. **Update Logger Calls**
   - Replace: `console.log(...)` → `this.logger.info(...)`
   - Replace: `console.error(...)` → `this.logger.error(...)`
   - Replace: `console.warn(...)` → `this.logger.warn(...)`

5. **Change Export**
   - Remove: `export default new MyService()`
   - Add: `export default MyService`

6. **Register in Container** (`/api/src/container.ts`)
   ```typescript
   container.register({
     myService: asClass(MyService, {
       lifetime: Lifetime.SINGLETON
     })
   })
   ```

7. **Update Container Interface**
   ```typescript
   export interface DIContainer extends AwilixContainer {
     // ...existing
     myService: MyService
   }
   ```

## Verification Checklist

After each service migration:

- [ ] Service compiles without errors
- [ ] No direct `pool` imports remain
- [ ] Constructor injection implemented
- [ ] Service registered in container
- [ ] Container interface updated
- [ ] Routes updated to use `req.container.resolve('serviceName')`
- [ ] CodeQL scan passes (no new vulnerabilities)

## Estimated Timeline

| Tier | Services | Hours | Priority | Target Week |
|------|----------|-------|----------|-------------|
| Tier 1 | 2 | 4 | Critical | Week 1 |
| Tier 2 | 15 | 6 | High | Week 1-2 |
| Tier 3 | 12 | 4 | Medium-High | Week 2 |
| Tier 4 | 14 | 5 | Medium | Week 3 |
| Tier 5 | 18 | 6 | Low-Medium | Week 3-4 |
| Tier 6 | 38 | 12 | Low | Week 4-5 |
| **Total** | **99** | **37** | | **5 weeks** |

**Note:** Original Excel estimate was 40 hours. Actual catalog shows 37 hours with proper prioritization.

## Current Status

**Completed:**
- ✅ Catalog created (99 services identified)
- ✅ Tier 1 services identified (dispatch, document)
- ✅ Migration pattern documented
- ✅ Example DI service created (`example-di.service.ts`)

**In Progress:**
- 🟡 dispatch.service.ts migration (Tier 1, Critical)

**Next Up:**
- 📋 document.service.ts migration (Tier 1, Critical)
- 📋 VehicleService.ts migration (Tier 2, High)
- 📋 DriverService.ts migration (Tier 2, High)

---

**Last Updated:** 2025-12-04
**Document Version:** 1.0
**Phase:** 2 (Structure)
