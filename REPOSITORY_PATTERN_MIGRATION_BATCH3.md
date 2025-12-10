# Repository Pattern Migration - Batch 3 (Final 24 Routes)

## Executive Summary

**Objective**: Complete repository pattern migration for remaining 24 routes with ~200 direct `pool.query` calls

**Current Progress**: 
- ✅ 9 routes already using Repository Pattern
- ✅ VideoTelematicsService enhanced with 10 new methods
- ⚠️ 24 routes still need migration
- ⚠️ ~200 direct `pool.query` calls to migrate

## Completed Work

### 1. VideoTelematicsService Enhancements (/api/src/services/video-telematics.service.ts)

Added 10 new repository-style methods:
```typescript
- getAllCamerasForTenant(tenantId: string)
- getVideoEventWithDetails(eventId: number, tenantId: string)
- logVideoAccess(eventId, userId, accessType, ipAddress)
- reviewVideoEvent(eventId, reviewed, reviewedBy, reviewNotes?, falsePositive?, coachingRequired?)
- getEventsRequiringCoaching(tenantId: string)
- queuePrivacyProcessing(eventId, taskType, priority)
- updatePrivacySettings(eventId, blurFaces, blurPlates)
- logPrivacyAction(eventId, userId, privacyAction)
- getDriverVideoScorecard(tenantId: string)
- getCameraHealthStatus(tenantId: string)
```

**Security**: All methods use parameterized queries ($1, $2, $3) with tenant isolation.

### 2. Routes Already Migrated
- fuel-transactions.routes.ts → FuelRepository ✅
- reservations.routes.ts → ReservationRepository ✅
- Modularized routes (drivers, vehicles, maintenance, work-orders, inspections, incidents, facilities) ✅

## Remaining Work - Priority Matrix

### 🔴 HIGH PRIORITY (Core Fleet Operations) - Week 1
1. **video-telematics.routes.ts** (11 calls) - SERVICE METHODS READY, needs route updates
2. **dispatch.routes.ts** (6 calls) - Create DispatchRepository
3. **vehicle-assignments.routes.ts** (13 calls) - Use existing VehicleAssignmentRepository
4. **asset-management.routes.ts** (9 calls) - Create AssetManagementRepository
5. **mobile-assignment.routes.ts** (20 calls) - Create MobileAssignmentRepository

### 🟡 MEDIUM PRIORITY (Mobile & Scheduling) - Week 2
6. **scheduling.routes.ts** (15 calls) - Create SchedulingRepository
7. **mobile-photos.routes.ts** (8 calls) - Create MobilePhotoRepository
8. **mobile-messaging.routes.ts** (9 calls) - Create MobileMessagingRepository
9. **mobile-trips.routes.ts** (14 calls) - Use existing TripRepository
10. **mobile-ocr.routes.ts** (7 calls) - Extend OCRService

### 🟢 LOWER PRIORITY (Analytics & System) - Week 3
11. **alerts.routes.ts** (14 calls) - Use existing AlertRepository
12. **assignment-reporting.routes.ts** (10 calls) - Create ReportingRepository
13. **cost-benefit-analysis.routes.ts** (8 calls) - Use existing CostRepository
14. **vehicle-history.routes.ts** (8 calls) - Extend VehicleRepository
15. **ai-insights.routes.ts** (5 calls) - Create AIInsightsRepository
16-24. (Remaining routes with 4-11 calls each)

## Implementation Pattern

For each route migration:

### Step 1: Create/Enhance Repository
```typescript
// Example: DispatchRepository.ts
@injectable()
export class DispatchRepository extends BaseRepository<Dispatch> {
  protected tableName = 'dispatches'
  protected idColumn = 'id'
  
  async findByStatus(status: string, context: QueryContext): Promise<Dispatch[]> {
    const result = await context.pool.query(
      `SELECT * FROM ${this.tableName}
       WHERE status = $1 AND tenant_id = $2`,
      [status, context.tenantId]
    )
    return result.rows
  }
}
```

### Step 2: Register in DI Container
```typescript
// container.ts
container.bind<DispatchRepository>(TYPES.DispatchRepository)
  .to(DispatchRepository).inSingletonScope()
```

### Step 3: Update Route File
```typescript
// Before
const result = await pool.query(...)

// After
const dispatches = await dispatchRepo.findByStatus(status, context)
```

### Step 4: Test
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
npm test -- dispatch.routes.spec.ts
```

## Testing Strategy

### Unit Tests
- Test each repository method independently
- Mock database responses
- Verify parameterized queries
- Check tenant isolation

### Integration Tests
- Test complete route flows
- Verify auth & permissions
- Check data integrity
- Validate error handling

### Commands
```bash
# Run all API tests
cd api && npm test

# Run specific test file
npm test -- routes/dispatch.routes.spec.ts

# Build and verify
npm run build
```

## Security Verification Checklist

For each migrated route:
- ✅ No string concatenation in SQL
- ✅ All queries use $1, $2, $3 placeholders
- ✅ Tenant isolation enforced
- ✅ Input validation with Zod
- ✅ CSRF protection on state-changing operations
- ✅ Authentication required
- ✅ Permission checks in place

## Estimated Timeline

- **Week 1**: High-priority routes (5 routes, 59 calls)
- **Week 2**: Medium-priority routes (5 routes, 53 calls)
- **Week 3**: Lower-priority routes (14 routes, ~88 calls)
- **Week 4**: Testing, bug fixes, documentation

**Total**: ~4 weeks for complete migration

## Next Immediate Steps

1. ✅ Finish video-telematics.routes.ts (service methods ready)
2. Create DispatchRepository
3. Migrate dispatch.routes.ts
4. Test and commit
5. Continue with vehicle-assignments.routes.ts

## Success Criteria

- ✅ 0 direct `pool.query` calls in route files
- ✅ All routes use Repository Pattern or Service Layer
- ✅ 100% parameterized queries
- ✅ 100% tenant isolation
- ✅ All tests passing
- ✅ Build succeeds without errors

## Resources

- Base Repository: `/api/src/repositories/BaseRepository.ts`
- Example Repository: `/api/src/repositories/FuelRepository.ts`
- DI Container: `/api/src/container.ts`
- TYPES: `/api/src/types.ts`

---

**Document Created**: 2025-12-10
**Status**: IN PROGRESS
**Priority**: P1 HIGH
**Issue**: BACKEND-4 Batch 3
