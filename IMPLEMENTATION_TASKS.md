# Multi-Asset Fleet Management - Implementation Task List

**Date**: 2025-11-17
**Status**: Ready for Implementation
**Estimated Total Time**: 8-12 hours

## Prerequisites Completed ✅

- ✅ Code inventory and analysis
- ✅ Implementation plan (CODE_REUSE_MULTI_ASSET_PLAN.md)
- ✅ Database migration file (api/src/migrations/032_multi_asset_vehicle_extensions.sql)
- ✅ Documentation of existing functionality

## Phase 1: Database Migration (1-2 hours)

### Task 1.1: Test Migration Locally
**File**: `api/src/migrations/032_multi_asset_vehicle_extensions.sql`
**Description**: Run the migration on development database to verify it works
**Steps**:
1. Connect to local PostgreSQL database
2. Run migration script
3. Verify all new columns exist in `vehicles` table
4. Verify `asset_relationships` table created
5. Verify `telemetry_equipment_events` table created
6. Verify views created successfully
7. Test that existing vehicle data still works

**Acceptance Criteria**:
- All new columns added to `vehicles` table
- All new tables created
- All indexes created
- Existing vehicle queries still work
- No data loss

### Task 1.2: Create Rollback Migration
**File**: `api/src/migrations/032_rollback_multi_asset_vehicle_extensions.sql`
**Description**: Create rollback script in case migration needs to be reversed
**Steps**:
1. Create SQL script to drop all new columns
2. Create SQL script to drop new tables
3. Test rollback on development database

**Acceptance Criteria**:
- Rollback script executes without errors
- Database returns to pre-migration state

---

## Phase 2: API Route Extensions (2-3 hours)

### Task 2.1: Extend Vehicle Routes for Asset Types
**File**: `api/src/routes/vehicles.ts`
**Description**: Add query filters for asset types and categories
**Changes Needed**:
```typescript
// Add to GET /vehicles route (line 13-68)
// Extract new query parameters
const {
  page = 1,
  limit = 50,
  asset_category,    // NEW
  asset_type,        // NEW
  power_type,        // NEW
  operational_status // NEW
} = req.query

// Add filters to SQL query
if (asset_category) {
  scopeFilter += ' AND asset_category = $X'
  scopeParams.push(asset_category)
}
if (asset_type) {
  scopeFilter += ' AND asset_type = $X'
  scopeParams.push(asset_type)
}
if (power_type) {
  scopeFilter += ' AND power_type = $X'
  scopeParams.push(power_type)
}
if (operational_status) {
  scopeFilter += ' AND operational_status = $X'
  scopeParams.push(operational_status)
}
```

**Acceptance Criteria**:
- `GET /api/vehicles?asset_category=HEAVY_EQUIPMENT` works
- `GET /api/vehicles?asset_type=EXCAVATOR` works
- `GET /api/vehicles?operational_status=IN_USE` works
- Multiple filters can be combined

### Task 2.2: Create Asset Relationships Routes
**File**: `api/src/routes/asset-relationships.routes.ts` (NEW FILE)
**Description**: Create API routes for managing asset relationships (tractor-trailer combos)
**Routes to Create**:

```typescript
import express from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/asset-relationships - List all relationships
router.get('/', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  // Query: SELECT * FROM asset_relationships WHERE tenant_id = ...
  // Filter by parent_asset_id, child_asset_id, relationship_type
})

// GET /api/asset-relationships/active-combos - Get current active combos
router.get('/active-combos', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  // Query: SELECT * FROM vw_active_asset_combos WHERE tenant_id = ...
})

// POST /api/asset-relationships - Create new relationship (attach trailer)
router.post('/', requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  // Insert into asset_relationships
  // Example: Attach trailer #123 to tractor #456
})

// DELETE /api/asset-relationships/:id - End relationship (detach trailer)
router.delete('/:id', requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  // Set effective_to = NOW()
})

export default router
```

**Acceptance Criteria**:
- Can create tractor-trailer relationship via API
- Can list active combos
- Can end relationship (detach trailer)
- All operations audit logged

### Task 2.3: Register Asset Relationships Routes
**File**: `api/src/server.ts`
**Description**: Add asset-relationships routes to Express app
**Changes Needed**:
```typescript
import assetRelationshipsRoutes from './routes/asset-relationships.routes'

// Add route registration
app.use('/api/asset-relationships', assetRelationshipsRoutes)
```

**Acceptance Criteria**:
- Routes accessible at `/api/asset-relationships`
- Swagger documentation updated

### Task 2.4: Extend Maintenance Schedule Routes
**File**: `api/src/routes/maintenance-schedules.ts`
**Description**: Support multi-metric maintenance triggers
**Changes Needed**:
- Add `trigger_metric` field to POST/PUT requests
- Support filtering by `trigger_metric`
- Return maintenance due based on multiple metrics

**Acceptance Criteria**:
- Can create maintenance schedule with PTO hours trigger
- Can query maintenance due by metric type

---

## Phase 3: TypeScript Types & Interfaces (1 hour)

### Task 3.1: Create Asset Type Definitions
**File**: `src/types/asset.types.ts` (NEW FILE)
**Description**: Define TypeScript types for all asset enums and interfaces
**Content**:

```typescript
// Asset Categories
export type AssetCategory =
  | 'PASSENGER_VEHICLE'
  | 'LIGHT_COMMERCIAL'
  | 'HEAVY_TRUCK'
  | 'TRACTOR'
  | 'TRAILER'
  | 'HEAVY_EQUIPMENT'
  | 'UTILITY_VEHICLE'
  | 'SPECIALTY_EQUIPMENT'
  | 'NON_POWERED'

// Asset Types
export type AssetType =
  // Passenger Vehicles
  | 'PASSENGER_CAR' | 'SUV' | 'PASSENGER_VAN'
  // Light Commercial
  | 'LIGHT_TRUCK' | 'PICKUP_TRUCK' | 'CARGO_VAN'
  // Heavy Trucks
  | 'MEDIUM_DUTY_TRUCK' | 'HEAVY_DUTY_TRUCK' | 'DUMP_TRUCK'
  // Tractors
  | 'SEMI_TRACTOR' | 'DAY_CAB_TRACTOR' | 'SLEEPER_CAB_TRACTOR'
  // Trailers
  | 'DRY_VAN_TRAILER' | 'FLATBED_TRAILER' | 'REFRIGERATED_TRAILER' | 'LOWBOY_TRAILER' | 'TANK_TRAILER'
  // Heavy Equipment
  | 'EXCAVATOR' | 'BULLDOZER' | 'BACKHOE' | 'MOTOR_GRADER' | 'WHEEL_LOADER'
  | 'SKID_STEER' | 'MOBILE_CRANE' | 'TOWER_CRANE' | 'FORKLIFT'
  // Utility
  | 'BUCKET_TRUCK' | 'SERVICE_BODY_TRUCK' | 'MOBILE_WORKSHOP'
  // Specialty
  | 'GENERATOR' | 'AIR_COMPRESSOR' | 'WATER_PUMP' | 'LIGHT_TOWER'
  // Non-Powered
  | 'SHIPPING_CONTAINER' | 'STORAGE_TRAILER' | 'TOOLBOX_TRAILER'
  | 'OTHER'

export type PowerType = 'SELF_POWERED' | 'TOWED' | 'STATIONARY' | 'PORTABLE'

export type UsageMetric = 'ODOMETER' | 'ENGINE_HOURS' | 'PTO_HOURS' | 'AUX_HOURS' | 'CYCLES' | 'CALENDAR'

export type OperationalStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RESERVED'

export type RelationshipType = 'TOWS' | 'ATTACHED' | 'CARRIES' | 'POWERS' | 'CONTAINS'

// Extended Vehicle/Asset Interface
export interface Asset {
  id: string
  tenant_id: string

  // Asset Classification
  asset_category?: AssetCategory
  asset_type?: AssetType
  power_type?: PowerType

  // Multi-Metric Tracking
  primary_metric?: UsageMetric
  odometer?: number
  engine_hours?: number
  pto_hours?: number
  aux_hours?: number
  cycle_count?: number
  last_metric_update?: Date

  // Equipment Specs
  capacity_tons?: number
  max_reach_feet?: number
  lift_height_feet?: number
  bucket_capacity_yards?: number
  operating_weight_lbs?: number

  // Operational
  operational_status?: OperationalStatus

  // ... existing vehicle fields
  vin: string
  make: string
  model: string
  year: number
  status: string
  // etc.
}

export interface AssetRelationship {
  id: string
  parent_asset_id: string
  child_asset_id: string
  relationship_type: RelationshipType
  connection_point?: string
  is_primary?: boolean
  effective_from: Date
  effective_to?: Date
  notes?: string
  created_at: Date
  created_by?: string
}

// Asset Combo (from view)
export interface AssetCombo {
  relationship_id: string
  relationship_type: RelationshipType
  parent_id: string
  parent_vin: string
  parent_make: string
  parent_model: string
  parent_type: AssetType
  child_id: string
  child_vin: string
  child_make: string
  child_model: string
  child_type: AssetType
  effective_from: Date
  effective_to?: Date
  notes?: string
}
```

**Acceptance Criteria**:
- All types compile without errors
- Types imported successfully in components

### Task 3.2: Update Existing Vehicle Type
**File**: `src/types/vehicle.ts`
**Description**: Extend existing Vehicle interface with new fields
**Changes Needed**:
- Import types from `asset.types.ts`
- Add new fields to Vehicle interface

**Acceptance Criteria**:
- No TypeScript errors
- All components using Vehicle type still work

---

## Phase 4: UI Components (3-4 hours)

### Task 4.1: Create Asset Type Filter Component
**File**: `src/components/filters/AssetTypeFilter.tsx` (NEW FILE)
**Description**: Filter component for asset categories and types
**Component**:

```typescript
import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AssetCategory, AssetType, PowerType, OperationalStatus } from '@/types/asset.types'

interface AssetTypeFilterProps {
  onFilterChange: (filters: AssetFilters) => void
  currentFilters: AssetFilters
}

interface AssetFilters {
  asset_category?: AssetCategory
  asset_type?: AssetType
  power_type?: PowerType
  operational_status?: OperationalStatus
}

export function AssetTypeFilter({ onFilterChange, currentFilters }: AssetTypeFilterProps) {
  return (
    <div className="flex gap-4">
      {/* Asset Category Filter */}
      <Select
        value={currentFilters.asset_category}
        onValueChange={(value) => onFilterChange({ ...currentFilters, asset_category: value as AssetCategory })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Asset Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PASSENGER_VEHICLE">Passenger Vehicles</SelectItem>
          <SelectItem value="HEAVY_TRUCK">Heavy Trucks</SelectItem>
          <SelectItem value="TRACTOR">Tractors</SelectItem>
          <SelectItem value="TRAILER">Trailers</SelectItem>
          <SelectItem value="HEAVY_EQUIPMENT">Heavy Equipment</SelectItem>
          {/* Add all categories */}
        </SelectContent>
      </Select>

      {/* Asset Type Filter */}
      <Select
        value={currentFilters.asset_type}
        onValueChange={(value) => onFilterChange({ ...currentFilters, asset_type: value as AssetType })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Asset Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="SEMI_TRACTOR">Semi Tractor</SelectItem>
          <SelectItem value="DRY_VAN_TRAILER">Dry Van Trailer</SelectItem>
          <SelectItem value="EXCAVATOR">Excavator</SelectItem>
          {/* Add all types */}
        </SelectContent>
      </Select>

      {/* Operational Status Filter */}
      <Select
        value={currentFilters.operational_status}
        onValueChange={(value) => onFilterChange({ ...currentFilters, operational_status: value as OperationalStatus })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AVAILABLE">Available</SelectItem>
          <SelectItem value="IN_USE">In Use</SelectItem>
          <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
          <SelectItem value="RESERVED">Reserved</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      <button onClick={() => onFilterChange({})}>Clear Filters</button>
    </div>
  )
}
```

**Acceptance Criteria**:
- Component renders without errors
- Filters update parent component state
- Clear filters button works

### Task 4.2: Extend AddVehicleDialog for Asset Types
**File**: `src/components/dialogs/AddVehicleDialog.tsx`
**Description**: Add asset type selection and conditional fields
**Changes Needed**:

1. Add asset type selector at top of form:
```typescript
// Add after basic info section
<div className="grid grid-cols-3 gap-4">
  <div>
    <Label>Asset Category</Label>
    <Select name="asset_category" value={formData.asset_category} onChange={handleChange}>
      <option value="">Select Category</option>
      <option value="PASSENGER_VEHICLE">Passenger Vehicle</option>
      <option value="HEAVY_TRUCK">Heavy Truck</option>
      <option value="TRACTOR">Tractor</option>
      <option value="TRAILER">Trailer</option>
      <option value="HEAVY_EQUIPMENT">Heavy Equipment</option>
      {/* ... all categories */}
    </Select>
  </div>

  <div>
    <Label>Asset Type</Label>
    <Select name="asset_type" value={formData.asset_type} onChange={handleChange}>
      {/* Filter options based on selected category */}
    </Select>
  </div>

  <div>
    <Label>Power Type</Label>
    <Select name="power_type" value={formData.power_type} onChange={handleChange}>
      <option value="SELF_POWERED">Self-Powered</option>
      <option value="TOWED">Towed</option>
      <option value="STATIONARY">Stationary</option>
      <option value="PORTABLE">Portable</option>
    </Select>
  </div>
</div>
```

2. Add conditional sections based on asset_category:
```typescript
{/* Show for HEAVY_EQUIPMENT */}
{formData.asset_category === 'HEAVY_EQUIPMENT' && (
  <div className="grid grid-cols-3 gap-4">
    <div>
      <Label>Capacity (tons)</Label>
      <Input type="number" name="capacity_tons" value={formData.capacity_tons} onChange={handleChange} />
    </div>
    <div>
      <Label>Lift Height (feet)</Label>
      <Input type="number" name="lift_height_feet" value={formData.lift_height_feet} onChange={handleChange} />
    </div>
    <div>
      <Label>Bucket Capacity (yards³)</Label>
      <Input type="number" name="bucket_capacity_yards" value={formData.bucket_capacity_yards} onChange={handleChange} />
    </div>
  </div>
)}

{/* Show for equipment with PTO */}
{formData.asset_type && ['EXCAVATOR', 'BACKHOE', 'WHEEL_LOADER'].includes(formData.asset_type) && (
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label>Has PTO</Label>
      <input type="checkbox" name="has_pto" checked={formData.has_pto} onChange={handleChange} />
    </div>
    <div>
      <Label>PTO Hours</Label>
      <Input type="number" name="pto_hours" value={formData.pto_hours} onChange={handleChange} disabled={!formData.has_pto} />
    </div>
  </div>
)}
```

**Acceptance Criteria**:
- Asset type fields appear in dialog
- Conditional fields show/hide based on selection
- Form submits with new fields
- API receives correct data

### Task 4.3: Update Vehicle Detail Panel
**File**: `src/components/drilldown/VehicleDetailPanel.tsx`
**Description**: Show asset type information and multi-metric readings
**Changes Needed**:

Add new sections:
```typescript
{/* Asset Classification */}
<div className="border-b pb-4">
  <h3 className="font-semibold mb-2">Asset Classification</h3>
  <div className="grid grid-cols-3 gap-4 text-sm">
    <div>
      <span className="text-gray-500">Category:</span>
      <span className="ml-2 font-medium">{vehicle.asset_category || 'N/A'}</span>
    </div>
    <div>
      <span className="text-gray-500">Type:</span>
      <span className="ml-2 font-medium">{vehicle.asset_type || 'N/A'}</span>
    </div>
    <div>
      <span className="text-gray-500">Power Type:</span>
      <span className="ml-2 font-medium">{vehicle.power_type || 'N/A'}</span>
    </div>
  </div>
</div>

{/* Multi-Metric Tracking */}
<div className="border-b pb-4">
  <h3 className="font-semibold mb-2">Usage Metrics</h3>
  <div className="grid grid-cols-4 gap-4">
    {vehicle.primary_metric === 'ODOMETER' && (
      <MetricCard label="Odometer" value={vehicle.odometer} unit="miles" isPrimary />
    )}
    {vehicle.primary_metric === 'ENGINE_HOURS' && (
      <MetricCard label="Engine Hours" value={vehicle.engine_hours} unit="hrs" isPrimary />
    )}
    {vehicle.pto_hours > 0 && (
      <MetricCard label="PTO Hours" value={vehicle.pto_hours} unit="hrs" isPrimary={vehicle.primary_metric === 'PTO_HOURS'} />
    )}
    {vehicle.aux_hours > 0 && (
      <MetricCard label="Aux Hours" value={vehicle.aux_hours} unit="hrs" isPrimary={vehicle.primary_metric === 'AUX_HOURS'} />
    )}
    {vehicle.cycle_count > 0 && (
      <MetricCard label="Cycles" value={vehicle.cycle_count} unit="cycles" isPrimary={vehicle.primary_metric === 'CYCLES'} />
    )}
  </div>
</div>

{/* Equipment Specifications (if HEAVY_EQUIPMENT) */}
{vehicle.asset_category === 'HEAVY_EQUIPMENT' && (
  <div className="border-b pb-4">
    <h3 className="font-semibold mb-2">Equipment Specifications</h3>
    <div className="grid grid-cols-3 gap-4 text-sm">
      {vehicle.capacity_tons && (
        <div>
          <span className="text-gray-500">Capacity:</span>
          <span className="ml-2 font-medium">{vehicle.capacity_tons} tons</span>
        </div>
      )}
      {vehicle.lift_height_feet && (
        <div>
          <span className="text-gray-500">Lift Height:</span>
          <span className="ml-2 font-medium">{vehicle.lift_height_feet} ft</span>
        </div>
      )}
      {vehicle.bucket_capacity_yards && (
        <div>
          <span className="text-gray-500">Bucket Capacity:</span>
          <span className="ml-2 font-medium">{vehicle.bucket_capacity_yards} yd³</span>
        </div>
      )}
    </div>
  </div>
)}

{/* Asset Relationships (attached trailers, etc.) */}
<div className="border-b pb-4">
  <h3 className="font-semibold mb-2">Attached Assets</h3>
  <AssetRelationshipsList vehicleId={vehicle.id} />
</div>
```

**Acceptance Criteria**:
- Asset type info displays correctly
- Multi-metric readings show for equipment
- Equipment specs show for heavy equipment
- Attached assets list displays

### Task 4.4: Create Asset Combo Manager Component
**File**: `src/components/AssetComboManager.tsx` (NEW FILE)
**Description**: UI to attach/detach trailers from tractors
**Component**:

```typescript
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { api } from '@/lib/api'

interface AssetComboManagerProps {
  parentAssetId: string
  parentAssetType: AssetType
}

export function AssetComboManager({ parentAssetId, parentAssetType }: AssetComboManagerProps) {
  const [availableAssets, setAvailableAssets] = useState([])
  const [currentAttachments, setCurrentAttachments] = useState([])
  const [selectedAsset, setSelectedAsset] = useState('')

  // Fetch available assets to attach based on parent type
  useEffect(() => {
    if (parentAssetType === 'SEMI_TRACTOR') {
      // Fetch available trailers
      api.get('/vehicles?asset_category=TRAILER&operational_status=AVAILABLE')
        .then(res => setAvailableAssets(res.data.data))
    }
  }, [parentAssetType])

  // Fetch current attachments
  useEffect(() => {
    api.get(`/asset-relationships/active-combos?parent_asset_id=${parentAssetId}`)
      .then(res => setCurrentAttachments(res.data))
  }, [parentAssetId])

  const handleAttach = async () => {
    await api.post('/asset-relationships', {
      parent_asset_id: parentAssetId,
      child_asset_id: selectedAsset,
      relationship_type: 'TOWS', // or 'ATTACHED' for equipment
      effective_from: new Date()
    })
    // Refresh lists
  }

  const handleDetach = async (relationshipId: string) => {
    await api.delete(`/asset-relationships/${relationshipId}`)
    // Refresh lists
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)}>
          <option value="">Select asset to attach...</option>
          {availableAssets.map(asset => (
            <option key={asset.id} value={asset.id}>
              {asset.make} {asset.model} ({asset.vin})
            </option>
          ))}
        </Select>
        <Button onClick={handleAttach} disabled={!selectedAsset}>Attach</Button>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Currently Attached:</h4>
        {currentAttachments.map(combo => (
          <div key={combo.relationship_id} className="flex justify-between items-center p-2 border rounded mb-2">
            <div>
              <div className="font-medium">{combo.child_make} {combo.child_model}</div>
              <div className="text-sm text-gray-500">{combo.child_vin} • {combo.relationship_type}</div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => handleDetach(combo.relationship_id)}>
              Detach
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Acceptance Criteria**:
- Can attach trailer to tractor
- Can detach trailer
- List updates in real-time
- Only shows compatible asset types

### Task 4.5: Integrate Filters into Vehicle List Page
**File**: `src/pages/Vehicles.tsx` or equivalent
**Description**: Add AssetTypeFilter component to vehicle list page
**Changes Needed**:

```typescript
import { AssetTypeFilter } from '@/components/filters/AssetTypeFilter'

function VehiclesPage() {
  const [filters, setFilters] = useState({})

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    // Trigger API call with new filters
    fetchVehicles(newFilters)
  }

  return (
    <div>
      <AssetTypeFilter onFilterChange={handleFilterChange} currentFilters={filters} />
      {/* Vehicle list */}
    </div>
  )
}
```

**Acceptance Criteria**:
- Filters appear on vehicle list page
- Changing filters updates vehicle list
- URL parameters update with filters

---

## Phase 5: Testing (1-2 hours)

### Task 5.1: Create Test Data
**File**: `api/seeds/multi-asset-test-data.sql` (NEW FILE)
**Description**: Create seed data for all asset types
**Data to Create**:
- 5 semi tractors
- 10 dry van trailers
- 3 excavators
- 2 bulldozers
- 2 forklifts
- 5 tractor-trailer combos (relationships)

**Acceptance Criteria**:
- Seed script runs without errors
- All asset types represented
- Relationships created correctly

### Task 5.2: Test Asset Type Filtering
**Test Cases**:
1. Filter by asset_category=HEAVY_EQUIPMENT → Shows only equipment
2. Filter by asset_type=EXCAVATOR → Shows only excavators
3. Filter by operational_status=AVAILABLE → Shows only available assets
4. Combine filters → Shows correct intersection

**Acceptance Criteria**:
- All filters work correctly
- No SQL errors
- Results match expectations

### Task 5.3: Test Asset Relationships
**Test Cases**:
1. Attach trailer to tractor → Relationship created
2. View tractor detail → Shows attached trailer
3. Detach trailer → Relationship ends (effective_to set)
4. Cannot attach same trailer to two tractors
5. Can attach multiple trailers to yard tractor

**Acceptance Criteria**:
- All CRUD operations work
- Business rules enforced
- Audit logging works

### Task 5.4: Test Multi-Metric Maintenance
**Test Cases**:
1. Create maintenance schedule with ENGINE_HOURS trigger
2. Update engine hours → Maintenance becomes due
3. Create schedule with PTO_HOURS trigger
4. Update PTO hours → Maintenance becomes due

**Acceptance Criteria**:
- Hour-based triggers work
- Maintenance due calculated correctly
- Views return correct data

---

## Phase 6: Documentation (1 hour)

### Task 6.1: Update API Documentation
**File**: `api/README.md` or Swagger docs
**Description**: Document new endpoints and parameters
**Sections to Add**:
- Asset type filtering parameters
- Asset relationships endpoints
- Multi-metric maintenance examples

**Acceptance Criteria**:
- All new endpoints documented
- Examples provided
- Swagger UI updated

### Task 6.2: Create User Guide
**File**: `docs/MULTI_ASSET_USER_GUIDE.md` (NEW FILE)
**Description**: End-user documentation for multi-asset features
**Sections**:
1. Introduction to Asset Types
2. How to Add Different Asset Types
3. How to Attach Trailers to Tractors
4. How to Track Equipment Hours
5. Setting Up Hour-Based Maintenance
6. Filtering by Asset Type

**Acceptance Criteria**:
- Clear step-by-step instructions
- Screenshots (optional)
- Common use cases covered

---

## Phase 7: Deployment (1 hour)

### Task 7.1: Commit Changes to Git
**Description**: Commit all changes with proper commit messages
**Commands**:
```bash
git add .
git commit -m "feat: Add multi-asset support for tractors, trailers, heavy equipment

- Extended vehicles table with 30+ asset type fields
- Added asset_relationships table for combos
- Added telemetry_equipment_events table
- Extended maintenance schedules for multi-metric triggers
- Created AssetTypeFilter component
- Extended AddVehicleDialog for asset types
- Updated VehicleDetailPanel with asset info
- Created AssetComboManager component
- Added API routes for asset relationships

Closes #XXX"
```

**Acceptance Criteria**:
- All files committed
- Commit message follows convention
- No sensitive data committed

### Task 7.2: Push to Remote Repository
**Commands**:
```bash
git push origin stage-a/requirements-inception
# or
git push origin main
```

**Acceptance Criteria**:
- Changes pushed successfully
- CI/CD pipeline runs
- Tests pass

### Task 7.3: Deploy to Staging Environment
**Description**: Deploy to staging for QA testing
**Steps**:
1. Run migration on staging database
2. Deploy API changes
3. Deploy UI changes
4. Verify all features work in staging

**Acceptance Criteria**:
- Migration runs successfully
- API responds to new endpoints
- UI displays new features
- No errors in logs

---

## Summary Checklist

### Database
- [ ] Migration 032 tested locally
- [ ] Rollback migration created
- [ ] Migration deployed to staging

### API
- [ ] Vehicle routes extended with filters
- [ ] Asset relationship routes created
- [ ] Routes registered in server.ts
- [ ] Maintenance schedule routes updated

### Types
- [ ] asset.types.ts created
- [ ] Vehicle type updated
- [ ] No TypeScript errors

### UI Components
- [ ] AssetTypeFilter component created
- [ ] AddVehicleDialog extended
- [ ] VehicleDetailPanel updated
- [ ] AssetComboManager component created
- [ ] Filters integrated into vehicle list

### Testing
- [ ] Test data created
- [ ] Asset type filtering tested
- [ ] Asset relationships tested
- [ ] Multi-metric maintenance tested

### Documentation
- [ ] API docs updated
- [ ] User guide created

### Deployment
- [ ] Changes committed to git
- [ ] Changes pushed to remote
- [ ] Deployed to staging
- [ ] QA testing complete

---

## Estimated Timeline

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Database | 2 tasks | 1-2 hours |
| Phase 2: API Routes | 4 tasks | 2-3 hours |
| Phase 3: TypeScript | 2 tasks | 1 hour |
| Phase 4: UI Components | 5 tasks | 3-4 hours |
| Phase 5: Testing | 4 tasks | 1-2 hours |
| Phase 6: Documentation | 2 tasks | 1 hour |
| Phase 7: Deployment | 3 tasks | 1 hour |
| **TOTAL** | **22 tasks** | **8-12 hours** |

---

## Notes for Claude Code on Web

- All file paths are relative to `/Users/andrewmorton/Documents/GitHub/Fleet/`
- Migration file is already created: `api/src/migrations/032_multi_asset_vehicle_extensions.sql`
- Implementation plan is in: `CODE_REUSE_MULTI_ASSET_PLAN.md`
- Existing code patterns are in: `api/src/routes/vehicles.ts`, `api/src/routes/asset-management.routes.ts`
- UI patterns are in: `src/components/dialogs/AddVehicleDialog.tsx`
- Database connection: `api/src/config/database.ts`
- This is a code REUSE project - 80% exists, only 20% new work needed
