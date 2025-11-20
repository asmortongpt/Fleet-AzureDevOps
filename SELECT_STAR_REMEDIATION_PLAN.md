# SELECT * Over-Fetching Remediation Report

**Remediation Agent**: R2 - SELECT * Query Fixer
**Date**: 2025-11-20
**Status**: IN PROGRESS

## Executive Summary

This remediation addresses CRITICAL over-fetching vulnerabilities identified in the DevSecOps audit. SELECT * queries expose sensitive data unnecessarily, waste bandwidth, and create security risks.

### Progress Overview

- **Initial SELECT * Count**: 130 instances across 54 route files
- **Current SELECT * Count**: 115 instances remaining
- **Instances Fixed**: 15 (11.5% reduction)
- **Files Modified**: 4 route files
- **Utilities Created**: 1 (scope-filter.ts)

### Completed Work

#### 1. Fixed Files (15 instances total)

| File | Instances Fixed | Tables Affected |
|------|----------------|-----------------|
| `api/src/routes/maintenance-schedules.ts` | 4 | maintenance_schedules, vehicle_telemetry_snapshots, work_orders |
| `api/src/routes/adaptive-cards.routes.ts` | 5 | vehicles, maintenance, users |
| `api/src/routes/drivers.ts` | 2 | users |
| `api/src/routes/vehicles.ts` | 1 | vehicles (refactored to service) |

#### 2. Scope Filter Utility Created

**File**: `api/src/utils/scope-filter.ts`

A comprehensive utility that eliminates duplicate scope-filtering logic across route files. Features:

- `applyScopeFilter()` - Main filtering function
- `applyScopeFilterForModification()` - For UPDATE/DELETE operations
- `buildScopeCountQuery()` - Generate COUNT queries with scope
- `buildScopeSelectQuery()` - Generate SELECT queries with scope

**Benefits**:
- Reduces code duplication by 8+ files
- Centralizes security logic
- Easier to audit and maintain
- Consistent scope filtering behavior

## Remaining Work

### High Priority Files (28 instances)

These files have 4+ SELECT * instances each:

1. **route-optimization.routes.ts** (5 instances)
2. **reimbursement-requests.ts** (5 instances)
3. **ai-insights.routes.ts** (5 instances)
4. **trip-marking.ts** (4 instances)
5. **queue.routes.ts** (4 instances)
6. **personal-use-charges.ts** (4 instances)
7. **documents.ts** (4 instances)
8. **ai-chat.ts** (4 instances)

### Medium Priority Files (24 instances)

Files with 3 SELECT * instances:

- video-telematics.routes.ts
- mobile-trips.routes.ts
- incident-management.routes.ts
- dispatch.routes.ts
- auth.ts
- arcgis-layers.ts

### Lower Priority Files (63 instances)

Files with 1-2 SELECT * instances (32 files)

## Standard Column Lists by Table

Use these as templates when fixing SELECT * queries:

### vehicles
```typescript
id, tenant_id, vehicle_number, vin, make, model, year,
license_plate, odometer, status, assigned_driver_id,
fuel_type, fuel_capacity, asset_category, asset_type,
power_type, operational_status, primary_metric,
is_road_legal, location_id, group_id, fleet_id,
purchase_date, purchase_price, current_value,
created_at, updated_at, created_by
```

### users (drivers)
```typescript
id, tenant_id, first_name, last_name, email, phone, role,
license_number, license_expiry, license_state, license_class,
status, hire_date, termination_date, department_id,
assigned_vehicle_id, team_id, scope_level,
created_at, updated_at, created_by
```

### maintenance
```typescript
id, tenant_id, vehicle_id, service_type, description,
scheduled_date, completed_date, odometer_reading,
cost, vendor, status, priority, notes,
created_at, updated_at
```

### maintenance_schedules
```typescript
id, tenant_id, vehicle_id, service_type, priority, status,
trigger_metric, trigger_value, current_value, next_due,
estimated_cost, is_recurring, recurrence_pattern,
auto_create_work_order, work_order_template, parts, notes,
created_at, updated_at
```

### work_orders
```typescript
id, tenant_id, work_order_number, title, description,
vehicle_id, driver_id, assigned_to, priority, status,
scheduled_date, completed_date, estimated_cost, actual_cost,
labor_hours, parts_cost, notes, attachments,
created_at, updated_at, created_by
```

### trips
```typescript
id, tenant_id, vehicle_id, driver_id, start_time, end_time,
start_location, end_location, start_odometer, end_odometer,
distance, duration, purpose, trip_type, status,
created_at, updated_at
```

### fuel
```typescript
id, tenant_id, vehicle_id, driver_id, transaction_date,
gallons, cost, price_per_gallon, odometer,
fuel_type, vendor, location, receipt_url,
created_at, updated_at
```

### incidents
```typescript
id, tenant_id, vehicle_id, driver_id, incident_date,
incident_type, severity, description, location,
police_report_number, insurance_claim_number,
estimated_damage_cost, status, reported_by,
created_at, updated_at
```

## Remediation Strategy

### Batch Processing Approach

For maximum efficiency, fix files in batches:

**Batch 1**: High priority (5 instances each)
- route-optimization.routes.ts
- reimbursement-requests.ts
- ai-insights.routes.ts

**Batch 2**: High priority (4 instances each)
- trip-marking.ts
- queue.routes.ts
- personal-use-charges.ts
- documents.ts
- ai-chat.ts

**Batch 3**: Medium priority (3 instances each)
- All 6 files with 3 instances

**Batch 4**: Lower priority (1-2 instances each)
- Remaining 32 files

### Pattern to Follow

For each SELECT * found:

1. **Identify the table** being queried
2. **Determine columns actually used** in the code (check what properties are accessed)
3. **Use standard column list** from the templates above
4. **Add any missing columns** that are specific to that query
5. **Replace SELECT \*** with explicit column list
6. **Test the endpoint** to ensure no regressions

### Example Fix

**Before:**
```typescript
const result = await pool.query(
  'SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2',
  [vehicleId, tenantId]
);
```

**After:**
```typescript
const result = await pool.query(
  `SELECT id, tenant_id, vehicle_number, vin, make, model, year,
          license_plate, odometer, status, assigned_driver_id,
          fuel_type, fuel_capacity, created_at, updated_at
   FROM vehicles WHERE id = $1 AND tenant_id = $2`,
  [vehicleId, tenantId]
);
```

## Scope Filter Refactoring

The following files have duplicate scope filtering logic and should be refactored to use the new `scope-filter.ts` utility:

1. **vehicles.ts** - Done (moved to service)
2. **drivers.ts** - Ready for refactoring (imports added)
3. **maintenance.ts** - Needs refactoring
4. **fuel.ts** - Needs refactoring
5. **trips.ts** - Needs refactoring
6. **work-orders.ts** - Needs refactoring
7. **incidents.ts** - Needs refactoring
8. **inspections.ts** - Needs refactoring

### Refactoring Template

```typescript
// Import the utilities
import { buildScopeSelectQuery, buildScopeCountQuery } from '../utils/scope-filter'

// In your route handler
const { query, params } = buildScopeSelectQuery(
  'table_name',
  ['column1', 'column2', 'column3'],
  req.user!,
  { tenant_id: req.user!.tenant_id },
  {
    scopeColumn: 'id',
    userScopeField: 'team_vehicle_ids',
    ownIdField: 'vehicle_id'
  },
  'created_at DESC',
  limit,
  offset
);

const result = await pool.query(query, params);
```

## Testing Strategy

After each fix:

1. **Unit Tests**: Run relevant unit tests
   ```bash
   cd api && npm test -- --grep "route-name"
   ```

2. **Integration Tests**: Test the specific endpoint
   ```bash
   npm run test:integration
   ```

3. **Manual Testing**:
   - Test with different user roles (own, team, fleet, global)
   - Verify no data is missing from responses
   - Check that only authorized data is returned

4. **Performance Testing**:
   - Measure query execution time before/after
   - Verify no performance degradation
   - Check that indexes are still being used

## Success Criteria

- [ ] All SELECT * instances in route files replaced with explicit columns
- [ ] Scope filter utility used in 8+ files
- [ ] All existing tests pass
- [ ] No new vulnerabilities introduced
- [ ] Performance remains same or improves
- [ ] Code review approved

## Estimated Effort

Based on current progress:

- **High Priority Files** (28 instances): 2-3 hours
- **Medium Priority Files** (24 instances): 2 hours
- **Lower Priority Files** (63 instances): 3-4 hours
- **Scope Filter Refactoring** (8 files): 2 hours
- **Testing & Verification**: 2 hours

**Total Estimated Time**: 11-14 hours

## Next Steps

1. Continue with high-priority files (route-optimization.routes.ts, reimbursement-requests.ts, ai-insights.routes.ts)
2. Refactor drivers.ts to fully use scope-filter utility
3. Apply scope-filter to remaining 7 files with duplicate logic
4. Run comprehensive test suite
5. Create PR with all changes
6. Request security review

## Files Modified

- `api/src/routes/maintenance-schedules.ts` ✅
- `api/src/routes/adaptive-cards.routes.ts` ✅
- `api/src/routes/drivers.ts` ✅ (partially - SELECT * fixed, scope-filter import added)
- `api/src/routes/vehicles.ts` ✅ (refactored to use service)
- `api/src/utils/scope-filter.ts` ✅ (new file)

## Compliance Impact

### Before Remediation
- **Security Risk**: HIGH - Sensitive data exposure
- **Performance**: Wasted bandwidth on unnecessary columns
- **Maintainability**: Medium - Risk of exposing new sensitive columns

### After Full Remediation
- **Security Risk**: LOW - Only required columns exposed
- **Performance**: Improved - Reduced data transfer
- **Maintainability**: HIGH - Explicit columns, centralized scope logic

## Recommendations

1. **Add linting rule** to prevent future SELECT * usage:
   ```json
   {
     "rules": {
       "no-select-star": "error"
     }
   }
   ```

2. **Update code review checklist** to include:
   - No SELECT * queries
   - Explicit column lists used
   - Scope filtering applied where needed

3. **Create migration guide** for existing developers

4. **Add to CI/CD pipeline**: Automated check for SELECT * patterns

5. **Consider ORM migration**: Tools like Prisma provide type-safe queries with explicit columns

## Conclusion

The SELECT * remediation is 11.5% complete with critical infrastructure (scope-filter utility) now in place. The remaining work follows a clear pattern and can be completed systematically using the templates and utilities created.

---

**Report Generated**: 2025-11-20
**Remediation Agent**: R2 - SELECT * Query Fixer
**Contact**: DevSecOps Team
