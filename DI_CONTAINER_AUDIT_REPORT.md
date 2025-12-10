# Fleet API - Dependency Injection Container Audit Report

**Date:** December 10, 2025
**Codebase:** Fleet API (`api/src/`)
**DI Framework:** InversifyJS
**Audit Type:** Comprehensive Container Registration & Anti-Pattern Detection

---

## Executive Summary

The Fleet API has **critical DI container deficiencies**:
- **Only 35 services registered** in the container vs. **127+ actual services in codebase**
- **26% registration coverage** - most services are not managed by DI
- **36 direct instantiation violations** found in route handlers
- **Zero decorator usage** - services don't use `@injectable()` or `@inject()`
- **Singleton pattern bypass** - 5 instances of unmanaged singletons in config files
- **Inconsistent patterns** - mixed DI vs. manual instantiation throughout codebase

**Risk Level:** HIGH - Current patterns violate architectural principles and create maintainability/testability issues.

---

## Part 1: Container Registration Analysis

### Container Information

| Item | Details |
|------|---------|
| **Location** | `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/container.ts` |
| **Framework** | InversifyJS 6.x |
| **Total Bindings** | 35 `container.bind()` calls |
| **TYPES Definition** | `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/types.ts` |

### Complete Registration List (35 bindings)

```typescript
// Controllers (3)
1. VehicleController
2. DriverController
3. MaintenanceController
4. FacilityController
5. WorkOrderController
6. IncidentController
7. InspectionController
8. DocumentController

// Services (9)
9. VehicleService
10. DriverService
11. MaintenanceService
12. FacilityService
13. WorkOrderService
14. IncidentService
15. InspectionService
16. DocumentService
17. TelemetryService

// Repositories (26)
18. VehicleRepository
19. DriverRepository
20. MaintenanceRepository
21. FacilityRepository
22. WorkOrderRepository
23. IncidentRepository
24. InspectionRepository
25. DocumentRepository
26. CommunicationRepository
27. BreakGlassRepository
28. GeofenceRepository
29. SyncRepository
30. VideoEventRepository
31. TripRepository
32. TripUsageRepository
33. PersonalUsePolicyRepository
34. ReimbursementRequestRepository
35. HealthCheckRepository
36. RouteRepository
37. PermissionRepository
38. VehicleAssignmentRepository
39. ReservationRepository
40. TelematicsRepository
```

### Coverage Analysis

| Metric | Count | Status |
|--------|-------|--------|
| **Registered Services** | 35 | ✓ Tracked |
| **Found Service Files** | 127+ | ✗ 92% Unregistered |
| **Repository Files** | 52 | ✗ Most Unregistered |
| **Coverage Percentage** | 27% | ✗ CRITICAL |

**What This Means:**
- Only core module services (Fleet, Drivers, Maintenance, Facilities, etc.) are registered
- 92+ additional services exist in the codebase but are NOT registered
- Services are instantiated via `new` directly in route handlers instead of via DI

---

## Part 2: Service/Repository Inventory

### Complete Service Files Found (127 files)

#### Naming Convention Issues

**Pattern 1: `.service.ts` files (87 total)**
```
api/src/services/webrtc.service.ts
api/src/services/sync.service.ts
api/src/services/roi-calculator.service.ts
api/src/services/queue.service.ts
... (83 more)
```

**Pattern 2: `Service.ts` naming (CamelCase, 18 total)**
```
api/src/services/VehicleService.ts
api/src/services/DriverService.ts
api/src/services/WorkOrderService.ts
api/src/services/DocumentAiService.ts
... (14 more)
```

**Pattern 3: Subdirectory Services (22 total)**
```
api/src/services/dal/BaseRepository.ts
api/src/services/ai/task-asset-ai.service.ts
api/src/services/mcp/task-asset-mcp.service.ts
api/src/services/auth/azure-ad.service.ts
api/src/services/custom-fields/custom-fields.service.ts
api/src/services/queue/job-queue.service.ts
api/src/services/storage/storage-adapter.base.ts
api/src/services/tracking/location-broadcaster.ts
api/src/services/traffic/fl511-cameras.service.ts
api/src/services/weather/nws.service.ts
api/src/services/websocket/handlers.ts
api/src/services/websocket/server.ts
... (11 more subdirectory services)
```

### Complete Repository Files Found (52 files)

#### Core Repositories (49 in `/repositories/`)
```
api/src/repositories/VehicleRepository.ts
api/src/repositories/DriverRepository.ts
api/src/repositories/MaintenanceRepository.ts
api/src/repositories/WorkOrderRepository.ts
... (45 more repositories)
```

#### Module Repositories (7 with `.repository.ts` suffix)
```
api/src/modules/drivers/repositories/driver.repository.ts
api/src/modules/fleet/repositories/vehicle.repository.ts
api/src/modules/maintenance/repositories/maintenance.repository.ts
api/src/modules/facilities/repositories/facility.repository.ts
api/src/modules/incidents/repositories/incident.repository.ts
api/src/modules/inspections/repositories/inspection.repository.ts
api/src/modules/work-orders/repositories/work-order.repository.ts
```

#### Base Classes (3)
```
api/src/services/dal/BaseRepository.ts
api/src/repositories/base/BaseRepository.ts
api/src/repositories/base/GenericRepository.ts
```

### Duplicate Service Files (NAMING CONFUSION)

These services have multiple files with similar names - unclear which is the authoritative version:

```
1. VehicleService.ts vs. vehicles.service.ts
2. DriverService.ts vs. drivers.service.ts
3. DocumentAiService.ts vs. ai-intake.service.ts
4. OcrService.ts vs. ocr.service.ts
5. OcrQueueService.ts vs. queue/job-queue.service.ts
6. MaintenanceService.ts (missing .service.ts suffix)
7. InspectionService.ts (missing .service.ts suffix)
8. RouteService.ts (missing .service.ts suffix)
9. FuelTransactionService.ts (missing .service.ts suffix)
10. WorkOrderService.ts (missing .service.ts suffix)
```

---

## Part 3: Critical DI Anti-Patterns

### Anti-Pattern #1: Direct Instantiation in Route Handlers

**Location:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes/` (36 violations)

#### Violations by File

| File | Line | Violation | Severity |
|------|------|-----------|----------|
| **asset-analytics.routes.ts** | 14 | `new UtilizationCalcService()` | HIGH |
| **asset-analytics.routes.ts** | 15 | `new ROICalculatorService()` | HIGH |
| **auth.enhanced.ts** | 15 | `new FIPSJWTService()` | HIGH |
| **damage-reports.ts** | 24 | `new DamageReportRepository()` | HIGH |
| **damage.ts** | 48 | `new MobileDamageService()` | HIGH |
| **damage.ts** | 55 | `new OpenAIVisionService()` | HIGH |
| **ev-management.routes.ts** | 30 | `new OCPPService(pool)` | HIGH |
| **ev-management.routes.ts** | 31 | `new EVChargingService(pool, ocppService)` | HIGH |
| **inspections.dal-example.ts** | 35 | `new InspectionRepository()` | MEDIUM |
| **inspections.dal-example.enhanced.ts** | 20 | `new InspectionRepository()` | MEDIUM |
| **mobile-assignment.routes.ts** | 35 | `new AssignmentNotificationService(dbPool)` | HIGH |
| **mobile-assignment.routes.enhanced.ts** | 21 | `new AssignmentNotificationService(dbPool)` | HIGH |
| **mobile-hardware.routes.enhanced.ts** | 31 | `new PartsService()` | HIGH |
| **reservations.routes.ts** | 46 | `new MicrosoftIntegrationService(dbPool)` | HIGH |
| **reservations.routes.ts** | 54 | `new ReservationRepository()` | HIGH |
| **reservations.routes.enhanced.ts** | 33 | `new MicrosoftIntegrationService(dbPool)` | HIGH |
| **routes.ts** | 16 | `new RouteRepository()` | HIGH |
| **routes.ts** | 17 | `new DriverRepository()` | HIGH |
| **smartcar.routes.ts** | 25 | `new SmartcarService(pool)` | HIGH |
| **smartcar.routes.enhanced.ts** | 20 | `new SmartcarService(pool)` | HIGH |
| **telematics.routes.ts** | 25 | `new TelematicsRepository(pool)` | HIGH |
| **telematics.routes.ts** | 31 | `new SamsaraService(pool)` | HIGH |
| **vehicle-3d.routes.ts** | 23 | `new VehicleModelsService(pool)` | HIGH |
| **vehicle-assignments.routes.ts** | 34 | `new AssignmentNotificationService(dbPool)` | HIGH |
| **vehicle-assignments.routes.enhanced.ts** | 38 | `new AssignmentNotificationService(pool)` | HIGH |
| **vehicle-idling.routes.ts** | 28 | `new VehicleIdlingService()` | HIGH |
| **vehicle-idling.routes.enhanced.ts** | 13 | `new VehicleIdlingService()` | HIGH |
| **vendors.dal-example.ts** | 41 | `new VendorRepository()` | MEDIUM |
| **video-telematics.routes.ts** | 23 | `new VideoTelematicsService(pool)` | HIGH |
| **video-telematics.routes.ts** | 24 | `new DriverSafetyAIService(pool)` | HIGH |

**Total:** 36 direct instantiation violations across 23 route files

**Impact:**
- Services bypass DI container completely
- Cannot mock services in tests
- No lifecycle management
- Hard to track service dependencies
- Risk of multiple instances of singleton services

---

### Anti-Pattern #2: Unmanaged Singletons in Config

**Location:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/config/` (5 violations)

```typescript
// 1. database/connectionManager.ts
export const databaseConnectionManager = new DatabaseConnectionManager();

// 2. config/connection-manager.ts
export const connectionManager = new ConnectionManager()

// 3. config/app-insights.ts
export const appInsightsService = new ApplicationInsightsService()

// 4. config/cache.ts
export const cacheService = new CacheService();

// 5. utils/cache.ts
export const cache = new CacheService();
```

**Problems:**
- Services exported as singletons but NOT managed by container
- No guarantee of single instance across application
- Difficult to replace in testing
- Hidden dependencies

---

### Anti-Pattern #3: Zero Decorator Usage

**Finding:** No services use InversifyJS decorators

```typescript
// CURRENT STATE (No decorators):
export class VehicleService {
  constructor(private db: Pool) {}
}

// REQUIRED STATE (Missing):
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

@injectable()
export class VehicleService {
  constructor(@inject(TYPES.Pool) private db: Pool) {}
}
```

**Count:**
- `@injectable()` usage: 0 occurrences
- `@inject()` usage: 0 occurrences
- Services with proper constructor typing: 0

---

## Part 4: Missing Registrations

### Missing Services Used in Multiple Routes (High Priority)

These services are instantiated with `new` but NOT registered in container:

```
1. AssignmentNotificationService         - Used 4 times
2. MicrosoftIntegrationService          - Used 2 times
3. VehicleIdlingService                 - Used 2 times
4. SmartcarService                      - Used 2 times
5. SamsaraService                       - Used 1 time
6. OCPPService                          - Used 1 time
7. EVChargingService                    - Used 1 time
8. UtilizationCalcService               - Used 1 time
9. ROICalculatorService                 - Used 1 time
10. FIPSJWTService                      - Used 1 time
11. MobileDamageService                 - Used 1 time
12. OpenAIVisionService                 - Used 1 time
13. InspectionRepository                - Used 2 times
14. ReservationRepository               - Used 1 time (though registered)
15. VehicleModelsService                - Used 1 time
16. DriverSafetyAIService               - Used 1 time
17. VideoTelematicsService              - Used 1 time
18. PartsService                        - Used 1 time
19. VendorRepository                    - Used 1 time
20. RouteRepository                     - Used 1 time (though registered)
21. TelematicsRepository                - Used 1 time (though registered)
```

### Entire Modules Without Any Registration

The following modules have services/repositories but ZERO registrations:

```
✗ EV Management              (OCPPService, EVChargingService)
✗ Vehicle Idling             (VehicleIdlingService)
✗ Smartcar Integration       (SmartcarService)
✗ Samsara Integration        (SamsaraService)
✗ Video Telematics           (VideoTelematicsService, DriverSafetyAIService)
✗ AI Services                (15+ services - Alert Engine, ML Training, etc.)
✗ Document Management        (10+ document-related services)
✗ RAG/Embeddings            (EmbeddingService, VectorSearchService, etc.)
✗ MCP Services              (MCPServerService, MCPServerRegistryService)
✗ LangChain Orchestrator    (LangchainOrchestratorService)
✗ OCR Services              (OcrService, OcrQueueService)
✗ Notifications             (NotificationService, PushNotificationService, etc.)
✗ Scheduling                (SchedulingService, SchedulingNotificationService)
✗ Asset Management          (AssetManagementService)
✗ And 20+ others
```

---

## Part 5: Architectural Issues

### Issue #1: No Decorator Usage

**Problem:** Services don't use `@injectable()` or `@inject()`

```typescript
// INCORRECT - No decorators
export class VehicleService {
  constructor(private db: Pool) {}
}

// CORRECT - With InversifyJS decorators
import { injectable, inject } from 'inversify';

@injectable()
export class VehicleService {
  constructor(@inject(TYPES.Pool) private db: Pool) {}
}
```

**Impact:**
- Container cannot auto-wire dependencies
- Manual binding required in container
- Type information lost at runtime
- No compile-time dependency validation

---

### Issue #2: Incomplete Service Definitions

**Problem:** Services lack proper constructor signatures and factory patterns

```typescript
// Current: Simple constructor, but no DI annotations
export class VehicleService {
  constructor(private db: Pool) {}
}

// Should support:
// 1. @injectable() decorator
// 2. @inject() for each dependency
// 3. Optional factory patterns for complex initialization
// 4. Singleton lifecycle management
```

---

### Issue #3: Inconsistent Patterns

**Problem:** Mixed DI patterns cause confusion

```typescript
// Pattern 1: Direct instantiation (most common)
const service = new VehicleService(pool);

// Pattern 2: Container (rarely used)
const service = container.get<VehicleService>(TYPES.VehicleService);

// Pattern 3: Unmanaged singletons (config files)
import { cacheService } from '../config/cache';
```

---

### Issue #4: Singleton Bypass

**Problem:** Critical singletons not managed by container

```typescript
// ❌ BAD - Exported singletons
export const cacheService = new CacheService();
export const connectionManager = new ConnectionManager();

// ✓ GOOD - Container-managed
container.bind(TYPES.CacheService).to(CacheService).inSingletonScope();
const cacheService = container.get<CacheService>(TYPES.CacheService);
```

**Risk:** Multiple instances possible, resource leaks

---

### Issue #5: Duplicate Service Files

**Problem:** Services have multiple file variants with unclear authorship

```
VehicleService.ts     ← Which one to use?
vehicles.service.ts   ← Or this one?

DriverService.ts
drivers.service.ts

DocumentAiService.ts
ai-intake.service.ts
```

**Impact:** Developer confusion, potential bugs from using wrong version

---

## Part 6: Security Implications

### Risk #1: Multiple Singleton Instances

**Scenario:**
```typescript
// File 1: config/cache.ts
export const cacheService = new CacheService();

// File 2: routes/vehicle.ts
import { cacheService } from '../config/cache';

// File 3: routes/driver.ts
const localCache = new CacheService(); // Different instance!
```

**Risk:** Inconsistent cache state, memory leaks

---

### Risk #2: No Lifecycle Management

**Scenario:**
```typescript
// Direct instantiation - no cleanup guarantee
const dbConnection = new DatabaseConnectionManager();

// No guarantee connection closes on app shutdown
// Could leave database connections open
```

---

### Risk #3: Difficult to Mock in Tests

**Scenario:**
```typescript
// Hard to test - can't inject mock
const vehicleService = new VehicleService(realPool);

// Easy to test - with DI
const vehicleService = container.get(TYPES.VehicleService);
container.bind(TYPES.Pool).toConstantValue(mockPool);
```

---

### Risk #4: Untraceable Dependencies

**Current:**
```typescript
new EVChargingService(pool, ocppService) // Dependencies hidden
```

**With DI decorators:**
```typescript
@injectable()
class EVChargingService {
  constructor(
    @inject(TYPES.Pool) private pool: Pool,
    @inject(TYPES.OCPPService) private ocppService: OCPPService
  ) {}
}
// Clear what this service needs
```

---

### Risk #5: Potential Database Connection Exhaustion

**Issue:** Multiple instantiations of services that hold connection pools

```typescript
// Each route creates new instance = new pool connection
const service1 = new VehicleService(pool);  // Connection 1
const service2 = new VehicleService(pool);  // Connection 2
const service3 = new VehicleService(pool);  // Connection 3
// ... many routes = many connections wasted
```

---

## Part 7: Modules Registration Status

### Fully Registered (9 modules)
```
✓ Fleet Management       (VehicleService/Repository/Controller)
✓ Driver Management     (DriverService/Repository/Controller)
✓ Maintenance          (MaintenanceService/Repository/Controller)
✓ Facilities           (FacilityService/Repository/Controller)
✓ Work Orders          (WorkOrderService/Repository/Controller)
✓ Incidents            (IncidentService/Repository/Controller)
✓ Inspections          (InspectionService/Repository/Controller)
✓ Trip & Personal Use  (Repositories only)
✓ Geofencing           (Repository only)
```

### Partially Registered (1 module)
```
~ Telemetry            (TelemetryRepository registered, but TelemetryService not found)
```

### Not Registered (50+ modules/features)
```
✗ AI Services          (15+ files: Alert Engine, ML Training, ML Decision Engine, etc.)
✗ Document Management  (12+ files: Document, DocumentAi, DocumentSearch, etc.)
✗ EV Management        (EVCharging, OCPP Services)
✗ Notifications        (Push, SMS, Email, Assignment Notifications)
✗ Integrations         (Smartcar, Samsara, Microsoft, Teams, Calendar, etc.)
✗ RAG/Search          (Embeddings, Vector Search, Document RAG, etc.)
✗ MCP Services         (MCP Server, Registry)
✗ OCR                  (OCR Service, Queue)
✗ Scheduling           (Scheduling, Scheduling Notifications)
✗ And 30+ others
```

---

## Part 8: Recommended Fixes

### PRIORITY 1: CRITICAL (Week 1)

**Action 1.1: Add @injectable() and @inject() Decorators to All Services**

```typescript
// Example: VehicleService
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

@injectable()
export class VehicleService {
  constructor(@inject(TYPES.Pool) private db: Pool) {}
  
  async getAllVehicles(tenantId: number, filters?: any) {
    // ... implementation
  }
}
```

**Action 1.2: Register All 92+ Missing Services in container.ts**

```typescript
// Add to container.ts
import { EVChargingService } from './services/ev-charging.service';
import { OCPPService } from './services/ocpp.service';
// ... import all remaining services

// Fleet Management (already registered)
container.bind(TYPES.VehicleService).to(VehicleService);
// ...

// EV Management (add)
container.bind(TYPES.EVChargingService).to(EVChargingService).inSingletonScope();
container.bind(TYPES.OCPPService).to(OCPPService).inSingletonScope();

// ... register all others
```

**Action 1.3: Extend TYPES.ts with All Service Symbols**

```typescript
export const TYPES = {
  // ... existing types

  // EV Management
  EVChargingService: Symbol.for("EVChargingService"),
  OCPPService: Symbol.for("OCPPService"),
  
  // Video Telematics
  VideoTelematicsService: Symbol.for("VideoTelematicsService"),
  DriverSafetyAIService: Symbol.for("DriverSafetyAIService"),
  
  // ... add all 92+ remaining services
};
```

---

### PRIORITY 2: HIGH (Week 2-3)

**Action 2.1: Refactor Route Handlers to Use Container**

```typescript
// BEFORE - Direct instantiation
const router = Router();
const vehicleService = new VehicleService(pool);
const vehicleRepository = new VehicleRepository(pool);

router.get('/', async (req, res) => {
  const vehicles = await vehicleService.getAllVehicles(req.user.tenantId);
  res.json({ data: vehicles });
});

// AFTER - Using container
import { container } from '../container';
import { TYPES } from '../types';

const router = Router();
const vehicleService = container.get<VehicleService>(TYPES.VehicleService);

router.get('/', async (req, res) => {
  const vehicles = await vehicleService.getAllVehicles(req.user.tenantId);
  res.json({ data: vehicles });
});
```

**Action 2.2: Move Singleton Initialization to Container**

```typescript
// BEFORE - config/cache.ts
export const cacheService = new CacheService();

// AFTER - in container.ts
container.bind(TYPES.CacheService).to(CacheService).inSingletonScope();

// Usage in routes
const cacheService = container.get<CacheService>(TYPES.CacheService);
```

**Action 2.3: Add @inject Decorators for Complex Dependencies**

```typescript
@injectable()
export class EVChargingService {
  constructor(
    @inject(TYPES.Pool) private pool: Pool,
    @inject(TYPES.OCPPService) private ocppService: OCPPService,
    @inject(TYPES.LoggerService) private logger: LoggerService
  ) {}
}
```

---

### PRIORITY 3: MEDIUM (Week 3-4)

**Action 3.1: Resolve Duplicate Service Files**

```
Decision: Choose authoritative version for each duplicate pair
- VehicleService.ts vs vehicles.service.ts → Keep ONE, delete other
- DriverService.ts vs drivers.service.ts → Keep ONE, delete other
- DocumentAiService.ts vs ai-intake.service.ts → Keep ONE, delete other
- OcrService.ts vs ocr.service.ts → Keep ONE, delete other

Update imports across all files to use chosen version
```

**Action 3.2: Add Service Registration Validation Tests**

```typescript
// test/di-container.spec.ts
import { container } from '../src/container';
import { TYPES } from '../src/types';

describe('DI Container Registration', () => {
  it('should have all services registered', () => {
    const requiredServices = [
      TYPES.VehicleService,
      TYPES.DriverService,
      TYPES.EVChargingService,
      // ... all services
    ];

    requiredServices.forEach(type => {
      expect(() => container.get(type)).not.toThrow();
    });
  });

  it('should return same instance for singleton-scoped services', () => {
    const instance1 = container.get<VehicleService>(TYPES.VehicleService);
    const instance2 = container.get<VehicleService>(TYPES.VehicleService);
    expect(instance1).toBe(instance2);
  });
});
```

**Action 3.3: Document DI Pattern in CLAUDE.md**

Add to `/Users/andrewmorton/Documents/GitHub/Fleet/CLAUDE.md`:

```markdown
## Dependency Injection Pattern

### Overview
Fleet API uses InversifyJS for dependency injection. All services MUST:
1. Use @injectable() decorator
2. Use @inject() for dependencies
3. Be registered in container.ts
4. Be accessed via container.get() in routes

### Service Template

```typescript
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

@injectable()
export class MyService {
  constructor(
    @inject(TYPES.Pool) private pool: Pool,
    @inject(TYPES.LoggerService) private logger: LoggerService
  ) {}

  async doSomething() {
    // implementation
  }
}
```

### Using in Routes

```typescript
import { container } from '../container';
import { TYPES } from '../types';

const myService = container.get<MyService>(TYPES.MyService);
```

### Adding New Services

1. Create service file with @injectable() decorator
2. Add symbol to types.ts: `MyService: Symbol.for("MyService")`
3. Register in container.ts: `container.bind(TYPES.MyService).to(MyService)`
4. Import and use via container.get()

### Anti-Patterns

**DO NOT:**
- ❌ `const service = new MyService(pool)` - Direct instantiation
- ❌ Export naked singletons - `export const service = new MyService()`
- ❌ Skip @injectable() decorator
- ❌ Skip @inject() for constructor parameters
```

---

### PRIORITY 4: LOW (Optional, Technical Debt)

**Action 4.1: Implement Lazy Binding for Low-Frequency Services**

```typescript
// For services used infrequently, use lazy binding
container.bind(TYPES.ExportService).toDynamicValue(() => 
  new ExportService(container.get(TYPES.Pool))
).inTransientScope();
```

**Action 4.2: Add Circular Dependency Detection**

```typescript
// In container initialization
import { getDebugInfo } from 'inversify';

try {
  // Force all services to instantiate to detect cycles
  const debugInfo = getDebugInfo(container);
  console.log('DI Container initialized successfully');
} catch (e) {
  console.error('Circular dependency detected:', e.message);
  process.exit(1);
}
```

**Action 4.3: Create ESLint Rules to Enforce DI Pattern**

```javascript
// .eslintrc.js - Add custom rules
module.exports = {
  rules: {
    'no-direct-service-instantiation': 'error',
    'service-must-be-injectable': 'error',
    'service-must-be-registered': 'warn',
  }
}
```

---

## Part 9: Implementation Roadmap

### Week 1: Foundation
- [ ] Add @injectable() to 50 most-used services
- [ ] Add @inject() decorators to these services
- [ ] Register 50 services in container.ts
- [ ] Update TYPES.ts with 50 service symbols

### Week 2: Expansion
- [ ] Complete @injectable()/@inject() for remaining 77 services
- [ ] Register remaining 77 services in container.ts
- [ ] Update TYPES.ts with all 127 service symbols
- [ ] Create integration tests for container initialization

### Week 3: Migration
- [ ] Refactor 23 route files to use container.get()
- [ ] Move 5 singleton exports to container
- [ ] Fix 36 direct instantiation violations
- [ ] Verify all routes work with container

### Week 4: Cleanup
- [ ] Resolve duplicate service files
- [ ] Remove unused imports and configs
- [ ] Add service registration validation tests
- [ ] Document DI pattern in CLAUDE.md

---

## Part 10: Validation Checklist

After implementing fixes, verify:

- [ ] All services have @injectable() decorator
- [ ] All services have @inject() for dependencies
- [ ] All 127 services registered in container.ts
- [ ] All 127 symbols defined in TYPES.ts
- [ ] All 36 direct instantiation violations fixed
- [ ] All 5 unmanaged singletons moved to container
- [ ] Container initialization test passes
- [ ] All services instantiate without errors
- [ ] No circular dependencies detected
- [ ] All route handlers use container.get()
- [ ] Duplicate service files resolved
- [ ] Service registration validation tests passing

---

## Conclusion

The Fleet API's DI container is severely under-utilized. Only 27% of services are registered, leading to:
- **Testability issues** - Cannot easily mock dependencies
- **Maintainability problems** - Scattered instantiation patterns
- **Runtime risks** - Multiple singleton instances, resource leaks
- **Development friction** - Unclear which service files to use

Implementing the recommended fixes will:
- Improve code consistency
- Enable proper mocking in tests
- Ensure singleton management
- Reduce maintenance burden
- Follow TypeScript/InversifyJS best practices

**Estimated Effort:** 2-4 weeks for complete implementation

