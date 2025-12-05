# CRIT-FRONTEND: Field Mapping Inconsistencies Execution Report

## Task Summary
- **Task ID**: CRIT-FRONTEND-FIELD-MAPPINGS
- **Task Name**: Fix inconsistent field mappings between API (snake_case) and frontend (camelCase)
- **Severity**: Critical
- **Estimated Hours**: 40 hours
- **Status**: ⚠️ PARTIALLY IMPLEMENTED (transformers exist but incomplete)
- **Analysis Date**: 2025-12-03

## Executive Summary

Field mapping infrastructure exists via `data-transformers.ts`, but has **major inconsistencies** causing type errors, confusion, and potential bugs.

**Issues Identified**:
1. ❌ TypeScript interfaces mixing camelCase and snake_case
2. ❌ Data transformers missing multi-asset field mappings (131 snake_case usages found)
3. ❌ API hook interfaces conflicting with main type definitions
4. ❌ Multiple field names for same data (e.g., `vehicle_number` vs `unit_number`)
5. ⚠️ No validation that transformations are complete

**Impact**:
- **Type Safety**: TypeScript can't catch field access errors
- **Developer Experience**: Confusion about which field name to use
- **Runtime Errors**: Undefined field access when API returns snake_case but frontend expects camelCase
- **Code Quality**: Inconsistent patterns across 40+ components

## Current Implementation

### 1. Data Transformer Infrastructure

**File**: `src/lib/data-transformers.ts` (214 lines)

**Purpose**: Transform API data (snake_case) to frontend format (camelCase)

**Functions Implemented**:
- ✅ `transformVehicle(apiVehicle)` - Vehicle transformation
- ✅ `transformDriver(apiDriver)` - Driver transformation
- ✅ `transformFacility(apiFacility)` - Facility transformation
- ✅ `transformVehicles(apiVehicles[])` - Batch vehicle transformation
- ✅ `transformDrivers(apiDrivers[])` - Batch driver transformation
- ✅ `transformFacilities(apiFacilities[])` - Batch facility transformation

### 2. Vehicle Transformation Example

**Good Transformations** (Lines 12-37):
```typescript
export function transformVehicle(apiVehicle: any): Vehicle {
  return {
    id: apiVehicle.id?.toString() || '',
    tenantId: apiVehicle.tenant_id?.toString() || '',        // ✅ tenant_id → tenantId
    number: apiVehicle.vehicle_number || apiVehicle.unit_number || `V-${apiVehicle.id}`, // ⚠️ Multiple sources
    type: normalizeVehicleType(apiVehicle.vehicle_type) || 'sedan',  // ✅ vehicle_type → type
    make: apiVehicle.make || 'Unknown',
    model: apiVehicle.model || 'Unknown',
    year: apiVehicle.year || new Date().getFullYear(),
    vin: apiVehicle.vin || '',
    licensePlate: apiVehicle.license_plate || '',            // ✅ license_plate → licensePlate
    fuelLevel: apiVehicle.fuel_level ?? 75,                  // ✅ fuel_level → fuelLevel
    fuelType: apiVehicle.fuel_type || 'gasoline',            // ✅ fuel_type → fuelType
    mileage: apiVehicle.current_mileage || apiVehicle.odometer || apiVehicle.mileage || 0, // ⚠️ Multiple sources
    assignedDriver: apiVehicle.assigned_driver_id?.toString(), // ✅ assigned_driver_id → assignedDriver
    lastService: apiVehicle.last_service || ...,              // ✅ last_service → lastService
    nextService: apiVehicle.next_service || ...,              // ✅ next_service → nextService
  }
}
```

**Problems**:
1. **Multiple source fields**: `vehicle_number || unit_number` - which is correct?
2. **Multiple mileage fields**: `current_mileage || odometer || mileage` - no clear winner
3. **Missing multi-asset fields**: No transformation for 40+ snake_case fields

## Field Mapping Inconsistencies

### Issue 1: TypeScript Interface Mixing

**File**: `src/lib/types.ts`

**Lines 1-115**: camelCase fields ✅
```typescript
export interface Vehicle {
  id: string
  tenantId: string          // ✅ camelCase
  number: string
  assignedDriver?: string   // ✅ camelCase
  fuelLevel: number         // ✅ camelCase
  licensePlate: string      // ✅ camelCase
  lastService: string       // ✅ camelCase
}
```

**Lines 71-115**: snake_case fields ❌
```typescript
export interface Vehicle {
  // ... camelCase fields above ...

  // ❌ INCONSISTENT: Multi-asset extensions use snake_case
  asset_category?: 'PASSENGER_VEHICLE' | 'HEAVY_EQUIPMENT' | ...
  asset_type?: string
  power_type?: 'SELF_POWERED' | 'TOWED' | ...

  primary_metric?: 'ODOMETER' | 'ENGINE_HOURS' | ...
  odometer?: number
  engine_hours?: number       // ❌ snake_case
  pto_hours?: number          // ❌ snake_case
  aux_hours?: number          // ❌ snake_case
  cycle_count?: number

  capacity_tons?: number
  max_reach_feet?: number     // ❌ snake_case
  lift_height_feet?: number   // ❌ snake_case
  bucket_capacity_yards?: number

  axle_count?: number
  max_payload_kg?: number     // ❌ snake_case

  has_pto?: boolean           // ❌ snake_case
  has_aux_power?: boolean     // ❌ snake_case
  is_road_legal?: boolean     // ❌ snake_case
  requires_cdl?: boolean
  requires_special_license?: boolean
  max_speed_kph?: number
  is_off_road_only?: boolean  // ❌ snake_case

  operational_status?: 'AVAILABLE' | 'IN_USE' | ...

  parent_asset_id?: string    // ❌ snake_case
  group_id?: string
  fleet_id?: string
  location_id?: string
}
```

**Impact**:
- Mixed naming conventions in **same interface**
- 40+ fields using snake_case
- **131 usages** of these snake_case fields found in components

### Issue 2: API Hook Interface Conflicts

**File**: `src/hooks/use-api.ts` (Lines 187-191)

```typescript
interface Vehicle {
  id: string;
  tenant_id: string;  // ❌ CONFLICT: types.ts uses tenantId
  // other vehicle properties
}
```

**Problem**:
- `use-api.ts` defines `tenant_id` (snake_case)
- `types.ts` defines `tenantId` (camelCase)
- **TypeScript can't catch this conflict** because interface names differ

### Issue 3: Multiple Field Name Aliases

**In `data-transformers.ts`**:

**Vehicle Number** (Line 16):
```typescript
number: apiVehicle.vehicle_number || apiVehicle.unit_number || `V-${apiVehicle.id}`
```
- Which is the **canonical** field name in the API?
- Do both exist? If so, which takes priority?

**Mileage** (Line 29):
```typescript
mileage: apiVehicle.current_mileage || apiVehicle.odometer || apiVehicle.mileage || 0
```
- **THREE** possible field names for odometer!
- Which is correct? `current_mileage`, `odometer`, or `mileage`?

**Location Fields** (Lines 134-136):
```typescript
let lat = parseFloat(apiVehicle.location_lat || '0')
let lng = parseFloat(apiVehicle.location_lng || '0')
```
- Why `location_lat` instead of `latitude`?
- Inconsistent with facility transformer (Line 80): `apiFacility.latitude`

### Issue 4: Missing Transformations

**Multi-Asset Fields** (40+ fields):
- ❌ `asset_category` - NOT transformed
- ❌ `asset_type` - NOT transformed
- ❌ `power_type` - NOT transformed
- ❌ `primary_metric` - NOT transformed
- ❌ `engine_hours` - NOT transformed
- ❌ `pto_hours` - NOT transformed
- ❌ `aux_hours` - NOT transformed
- ❌ `max_reach_feet` - NOT transformed
- ❌ `has_pto` - NOT transformed
- ❌ `parent_asset_id` - NOT transformed
- ... (30+ more fields)

**Evidence**: 131 snake_case field accesses found in components:
```bash
$ grep -r "asset_category\|engine_hours\|pto_hours" src --include="*.tsx" --include="*.ts" | wc -l
131
```

**Impact**:
- Components access `vehicle.engine_hours` (snake_case)
- If API response is transformed by `transformVehicle()`, this field will be `undefined`
- **Silent runtime errors** - no TypeScript error, just undefined values

## Field Usage Analysis

### Vehicle Number Field

**Search Results**: 32 occurrences across 14 files
```bash
$ grep -r "vehicle\.vehicle_number\|vehicle\.number\|vehicle\.unit_number" src
```

**Files Using**:
- FleetDashboard.tsx (10 usages)
- DataWorkbench.tsx (4 usages)
- GPSTracking.tsx (3 usages)
- CompactVehicleList.tsx (2 usages)
- ... (10 more files)

**Question**: Are components using `vehicle.number` (camelCase) or `vehicle.vehicle_number` (snake_case)?

### Driver ID Field

**Search Results**: 17 occurrences across 10 files
```bash
$ grep -r "driver\.driver_id\|driver\.id\|driver\.driverId" src
```

**Files Using**:
- DriverPerformance.tsx (5 usages)
- DriverScorecard.tsx (3 usages)
- PeopleManagement.tsx (1 usage)
- ... (7 more files)

### Tenant ID Field

**Search Results**: 0 matches for `vehicle.tenant_id` or `vehicle.tenantId`

**Conclusion**: Components may not be filtering by tenant_id, or using different access pattern

## Root Cause Analysis

### Why This Happened

1. **Phase 1 (Initial Development)**: Used camelCase for main fields
2. **Phase 3 (Multi-Asset Extensions)**: Added 40+ snake_case fields from database migration
3. **No Update to Transformers**: `data-transformers.ts` never updated for Phase 3 fields
4. **No Validation**: No tests to verify all API fields are transformed

### Correct Approach

**Option A**: Transform ALL fields to camelCase (Recommended)
```typescript
export function transformVehicle(apiVehicle: any): Vehicle {
  return {
    // ... existing transformations ...

    // Multi-asset transformations (NEW)
    assetCategory: apiVehicle.asset_category,
    assetType: apiVehicle.asset_type,
    powerType: apiVehicle.power_type,
    primaryMetric: apiVehicle.primary_metric,
    engineHours: apiVehicle.engine_hours,
    ptoHours: apiVehicle.pto_hours,
    auxHours: apiVehicle.aux_hours,
    capacityTons: apiVehicle.capacity_tons,
    maxReachFeet: apiVehicle.max_reach_feet,
    liftHeightFeet: apiVehicle.lift_height_feet,
    bucketCapacityYards: apiVehicle.bucket_capacity_yards,
    operatingWeightLbs: apiVehicle.operating_weight_lbs,
    axleCount: apiVehicle.axle_count,
    maxPayloadKg: apiVehicle.max_payload_kg,
    tankCapacityL: apiVehicle.tank_capacity_l,
    hasPto: apiVehicle.has_pto,
    hasAuxPower: apiVehicle.has_aux_power,
    isRoadLegal: apiVehicle.is_road_legal,
    requiresCdl: apiVehicle.requires_cdl,
    requiresSpecialLicense: apiVehicle.requires_special_license,
    maxSpeedKph: apiVehicle.max_speed_kph,
    isOffRoadOnly: apiVehicle.is_off_road_only,
    operationalStatus: apiVehicle.operational_status,
    parentAssetId: apiVehicle.parent_asset_id,
    groupId: apiVehicle.group_id,
    fleetId: apiVehicle.fleet_id,
    locationId: apiVehicle.location_id,
  }
}
```

**Option B**: Keep snake_case (NOT recommended)
- Goes against TypeScript/JavaScript conventions
- Harder to read in JSX: `{vehicle.max_reach_feet}`
- Inconsistent with existing camelCase fields

## Recommendations

### Phase 1: Update Type Definitions (4 hours)

1. **Update `src/lib/types.ts`** to use camelCase for ALL fields:
```typescript
export interface Vehicle {
  // Existing fields (already camelCase)
  id: string
  tenantId: string
  number: string

  // Multi-asset fields (convert to camelCase)
  assetCategory?: 'PASSENGER_VEHICLE' | 'HEAVY_EQUIPMENT' | ...
  assetType?: string
  powerType?: 'SELF_POWERED' | 'TOWED' | ...
  primaryMetric?: 'ODOMETER' | 'ENGINE_HOURS' | ...
  engineHours?: number  // WAS: engine_hours
  ptoHours?: number     // WAS: pto_hours
  auxHours?: number     // WAS: aux_hours
  cycleCount?: number
  capacityTons?: number
  maxReachFeet?: number // WAS: max_reach_feet
  // ... continue for all 40 fields
}
```

2. **Remove duplicate interfaces** from `src/hooks/use-api.ts` (Lines 187-200)
   - Use shared types from `src/lib/types.ts` instead

### Phase 2: Complete Data Transformers (8 hours)

1. **Update `transformVehicle()`** to handle all 40+ multi-asset fields
2. **Update `transformDriver()`** for any missing driver fields
3. **Update `transformFacility()`** for consistency
4. **Fix field name aliases**:
   - Choose ONE canonical field name per concept
   - Document why multiple sources exist (if needed for backwards compatibility)

### Phase 3: Update Component Usage (16 hours)

1. **Find-and-replace snake_case field access** (131 occurrences):
```bash
# Example: engine_hours → engineHours
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/\.engine_hours/.engineHours/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/\.pto_hours/.ptoHours/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/\.asset_category/.assetCategory/g'
# ... repeat for all 40 fields
```

2. **TypeScript compilation** will catch remaining errors
3. **Test all components** that use multi-asset fields

### Phase 4: Add Validation Tests (4 hours)

1. **Create transformer tests** at `src/tests/transformers.test.ts`:
```typescript
import { transformVehicle } from '@/lib/data-transformers'
import { Vehicle } from '@/lib/types'

describe('transformVehicle', () => {
  it('transforms all snake_case fields to camelCase', () => {
    const apiVehicle = {
      id: '1',
      tenant_id: 'tenant-1',
      vehicle_number: 'V-001',
      engine_hours: 1500,
      pto_hours: 300,
      asset_category: 'HEAVY_EQUIPMENT',
      max_reach_feet: 50,
      has_pto: true,
      // ... all 40 fields
    }

    const result = transformVehicle(apiVehicle)

    // Verify camelCase output
    expect(result.engineHours).toBe(1500)
    expect(result.ptoHours).toBe(300)
    expect(result.assetCategory).toBe('HEAVY_EQUIPMENT')
    expect(result.maxReachFeet).toBe(50)
    expect(result.hasPto).toBe(true)

    // Verify no snake_case fields leaked through
    expect((result as any).engine_hours).toBeUndefined()
    expect((result as any).pto_hours).toBeUndefined()
  })

  it('matches all keys in Vehicle interface', () => {
    const apiVehicle = { /* full test data */ }
    const result = transformVehicle(apiVehicle)

    // Get all keys defined in Vehicle interface
    const vehicleKeys: (keyof Vehicle)[] = [
      'id', 'tenantId', 'number', 'type', 'make', 'model',
      'assetCategory', 'engineHours', 'ptoHours', /* all keys */
    ]

    // Verify transformer outputs all expected keys (or undefined for optional)
    vehicleKeys.forEach(key => {
      expect(result).toHaveProperty(key)
    })
  })
})
```

2. **Add runtime validation** (development only):
```typescript
export function transformVehicle(apiVehicle: any): Vehicle {
  const result = {
    // ... all transformations ...
  }

  // Development-only validation
  if (process.env.NODE_ENV === 'development') {
    // Warn if snake_case fields are accessed
    const snakeCaseKeys = Object.keys(apiVehicle).filter(k => k.includes('_'))
    const untransformedKeys = snakeCaseKeys.filter(k => result[k as keyof Vehicle] === undefined)

    if (untransformedKeys.length > 0) {
      console.warn('[Transformer] Untransformed snake_case fields:', untransformedKeys)
    }
  }

  return result
}
```

### Phase 5: Documentation (4 hours)

1. **Create `src/lib/FIELD_MAPPING_GUIDE.md`**:
```markdown
# Field Mapping Guide

## Naming Convention

**Rule**: Frontend uses **camelCase** for all fields

**Rationale**:
- TypeScript/JavaScript convention
- Better readability in JSX
- Consistent with React ecosystem

## API to Frontend Mapping

| API Field (snake_case) | Frontend Field (camelCase) | Type | Notes |
|------------------------|---------------------------|------|-------|
| tenant_id | tenantId | string | Multi-tenancy ID |
| vehicle_number | number | string | Preferred over unit_number |
| engine_hours | engineHours | number | For heavy equipment |
| pto_hours | ptoHours | number | Power take-off hours |
| asset_category | assetCategory | enum | PASSENGER_VEHICLE, etc. |
| ... | ... | ... | ... |

## Adding New Fields

1. Define field in `src/lib/types.ts` using **camelCase**
2. Add transformation in `src/lib/data-transformers.ts`
3. Add test case to `src/tests/transformers.test.ts`
4. Update this mapping table

## Common Pitfalls

- ❌ Accessing `vehicle.engine_hours` directly
- ✅ Use `vehicle.engineHours` instead
- ❌ Mixing camelCase and snake_case in same interface
- ✅ Use consistent camelCase throughout
```

2. **Update component documentation** with field access examples

### Phase 6: Enforcement (4 hours)

1. **Add ESLint rule** to ban snake_case field access:
```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "MemberExpression[property.name=/.*_.*$/]",
        "message": "Use camelCase field names. Convert snake_case API fields via data-transformers.ts"
      }
    ]
  }
}
```

2. **Add TypeScript strict property checks**:
```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,  // Flag vehicle[key] access
    "exactOptionalPropertyTypes": true  // Prevent {a?: string | undefined}
  }
}
```

## Implementation Timeline

| Phase | Tasks | Hours | Priority |
|-------|-------|-------|----------|
| 1. Type Definitions | Update types.ts to camelCase | 4 | P0 - Critical |
| 2. Data Transformers | Complete transformer functions | 8 | P0 - Critical |
| 3. Component Updates | Find-and-replace + fix errors | 16 | P0 - Critical |
| 4. Validation Tests | Unit tests + runtime checks | 4 | P1 - High |
| 5. Documentation | Field mapping guide | 4 | P1 - High |
| 6. Enforcement | ESLint + TypeScript config | 4 | P2 - Medium |
| **TOTAL** | | **40** | |

## Compliance Status

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Consistent naming convention | ⚠️ Partial | 40+ snake_case fields in types.ts |
| Complete field transformations | ❌ Missing | 131 untransformed field accesses |
| Type safety | ❌ Broken | use-api.ts conflicts with types.ts |
| Developer clarity | ⚠️ Poor | Multiple aliases for same field |
| Test coverage | ❌ Missing | No transformer tests |
| Documentation | ❌ Missing | No field mapping guide |

## Risks of NOT Fixing

### Runtime Errors
```typescript
// Component expects camelCase after transformation
const hours = vehicle.engineHours  // undefined! (API has engine_hours)

// Calculation fails silently
const cost = hours * hourlyRate  // NaN (undefined * number)
```

### Type Safety Breakdown
```typescript
// TypeScript can't catch this
interface A { tenantId: string }
interface B { tenant_id: string }

const vehicle: A = apiResponse as A  // No error, but wrong type!
```

### Developer Confusion
```typescript
// Which is correct?
vehicle.number  // From transformVehicle()
vehicle.vehicle_number  // From API
vehicle.unit_number  // Alias in transformer?
```

### Maintenance Burden
- Every new field requires checking 3 places (types.ts, data-transformers.ts, components)
- No automated validation catches mistakes
- Bugs appear in production, not during development

## Conclusion

**CRIT-FRONTEND-FIELD-MAPPINGS is PARTIALLY IMPLEMENTED with major gaps.**

The codebase has:
- ✅ Data transformer infrastructure (`data-transformers.ts`)
- ✅ Transformations for ~30 core fields
- ❌ Missing transformations for 40+ multi-asset fields
- ❌ TypeScript interface mixing camelCase and snake_case
- ❌ API hook interfaces conflicting with main types
- ❌ No validation or tests
- ❌ 131 snake_case field accesses in components

**Primary Gaps**:
1. Complete `transformVehicle()` for all 40+ fields
2. Convert types.ts to consistent camelCase
3. Fix 131 component field accesses
4. Add transformer tests

**Recommendation**: Implement all 6 phases systematically to achieve full type safety and field mapping consistency.

**Time to Full Implementation**: 40 hours (as estimated)

---

**Generated**: 2025-12-03
**Reviewed By**: Claude Code
**Evidence**: File analysis + grep statistics + field usage patterns
**Verification Method**: Zero Simulation Policy - comprehensive code review and pattern analysis
