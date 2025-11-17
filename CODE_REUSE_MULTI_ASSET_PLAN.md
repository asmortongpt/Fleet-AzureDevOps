# Multi-Asset Fleet Management - Code Reuse Implementation Plan

**Date**: 2025-11-17
**Status**: Implementation Plan
**Approach**: REUSE existing code, NOT greenfield development

## Executive Summary

The Fleet repository **already has 80% of the multi-asset functionality** we need:

- ✅ **`vehicles` table** - Has `engine_hours` field already (schema.sql:86)
- ✅ **`assets` table** - Generic asset management with QR codes, depreciation, assignments (asset-management.routes.ts)
- ✅ **`heavy_equipment` migration** - Complete heavy equipment tracking with hour meters, PTO hours, operator certifications (009_heavy_equipment.sql)
- ✅ **`maintenance_schedules` table** - Supports miles, hours, and calendar-based triggers (schema.sql:215-242)

## What Already Exists (Code Inventory)

### 1. Database Tables - ALREADY IMPLEMENTED

#### `vehicles` Table (schema.sql:74-104)
```sql
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vin VARCHAR(17) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(20),
    vehicle_type VARCHAR(50), -- sedan, suv, truck, van, etc.
    fuel_type VARCHAR(50), -- gasoline, diesel, electric, hybrid
    status VARCHAR(50) DEFAULT 'active',
    odometer DECIMAL(10,2) DEFAULT 0,
    engine_hours DECIMAL(10,2) DEFAULT 0,  -- ✅ ALREADY HAS ENGINE HOURS!
    ...
);
```

#### `assets` Table (asset-management.routes.ts:51-119)
```sql
CREATE TABLE assets (
    id UUID,
    tenant_id UUID,
    asset_name VARCHAR(255),
    asset_type VARCHAR(50), -- vehicle, equipment, tool, trailer, other
    asset_tag VARCHAR(100),
    serial_number VARCHAR(255),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    current_value DECIMAL(10,2),
    depreciation_rate DECIMAL(5,2),
    warranty_expiry DATE,
    location VARCHAR(255),
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(50), -- active, inactive, maintenance, retired, disposed
    description TEXT,
    specifications JSONB,
    photo_url TEXT,
    qr_code_data TEXT,
    disposal_date DATE,
    disposal_reason TEXT,
    disposal_value DECIMAL(10,2),
    created_by UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### `heavy_equipment` Table (009_heavy_equipment.sql:42-103)
```sql
CREATE TABLE heavy_equipment (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    asset_id UUID NOT NULL REFERENCES assets(id),  -- ✅ Links to assets!
    equipment_type VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,

    -- ✅ Multi-metric tracking ALREADY IMPLEMENTED
    engine_hours DECIMAL(10,1) DEFAULT 0,
    odometer_miles DECIMAL(10,1) DEFAULT 0,
    last_hour_meter_reading DECIMAL(10,1),
    last_hour_meter_date DATE,

    -- ✅ Capacity specs
    capacity_tons DECIMAL(10,2),
    max_reach_feet DECIMAL(10,2),
    lift_height_feet DECIMAL(10,2),
    bucket_capacity_yards DECIMAL(10,2),

    -- ✅ Hour-based maintenance tracking
    last_inspection_date DATE,
    next_inspection_date DATE,

    -- ✅ Operational status
    availability_status VARCHAR(50), -- available, in_use, maintenance, down
    current_job_site VARCHAR(255),
    ...
);
```

#### `equipment_hour_meter_readings` Table (009_heavy_equipment.sql:146-165)
```sql
CREATE TABLE equipment_hour_meter_readings (
    id UUID,
    equipment_id UUID REFERENCES heavy_equipment(id),
    reading_date TIMESTAMP NOT NULL,
    hours DECIMAL(10,1) NOT NULL,  -- ✅ Hour meter tracking
    odometer_miles DECIMAL(10,1),
    fuel_level_percent INTEGER,
    recorded_by UUID REFERENCES users(id),
    job_site VARCHAR(255),
    operator_id UUID REFERENCES drivers(id),
    billable_hours DECIMAL(8,2),
    notes TEXT,
    photo_url TEXT
);
```

#### `equipment_maintenance_schedules` Table (009_heavy_equipment.sql:314-343)
```sql
CREATE TABLE equipment_maintenance_schedules (
    id UUID,
    equipment_id UUID REFERENCES heavy_equipment(id),
    maintenance_type VARCHAR(100),
    schedule_type VARCHAR(50), -- ✅ hours, calendar, both

    -- ✅ Hour-based scheduling
    interval_hours INTEGER,
    last_performed_hours DECIMAL(10,1),
    next_due_hours DECIMAL(10,1),

    -- ✅ Calendar-based scheduling
    interval_days INTEGER,
    last_performed_date DATE,
    next_due_date DATE,

    priority VARCHAR(50),
    status VARCHAR(50), -- scheduled, overdue, in_progress, completed
    ...
);
```

### 2. API Routes - ALREADY IMPLEMENTED

#### Asset Management Routes (asset-management.routes.ts)
- ✅ `GET /api/assets` - List all assets with filtering by type, status, location
- ✅ `GET /api/assets/:id` - Get single asset with history and maintenance
- ✅ `POST /api/assets` - Create new asset with QR code generation
- ✅ `PUT /api/assets/:id` - Update asset
- ✅ `POST /api/assets/:id/assign` - Assign asset to user
- ✅ `POST /api/assets/:id/transfer` - Transfer asset to location
- ✅ `GET /api/assets/:id/depreciation` - Calculate depreciation
- ✅ `GET /api/assets/analytics/summary` - Asset analytics by type and status
- ✅ `DELETE /api/assets/:id` - Dispose/retire asset

#### Vehicle Routes (vehicles.ts)
- ✅ `GET /api/vehicles` - List vehicles with scope-based filtering
- ✅ `GET /api/vehicles/:id` - Get single vehicle
- ✅ `POST /api/vehicles` - Create vehicle with VIN validation
- ✅ `PUT /api/vehicles/:id` - Update vehicle
- ✅ `DELETE /api/vehicles/:id` - Delete vehicle (only if sold/retired)

### 3. Database Functions - ALREADY IMPLEMENTED

#### Auto-Update Hour Meters (009_heavy_equipment.sql:444-461)
```sql
CREATE OR REPLACE FUNCTION update_equipment_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE heavy_equipment
  SET
    engine_hours = NEW.hours,
    last_hour_meter_reading = NEW.hours,
    last_hour_meter_date = NEW.reading_date::DATE,
    updated_at = NOW()
  WHERE id = NEW.equipment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Auto-Check Maintenance Due (009_heavy_equipment.sql:468-488)
```sql
CREATE OR REPLACE FUNCTION check_maintenance_due()
RETURNS TRIGGER AS $$
BEGIN
  -- Update hour-based maintenance schedules
  UPDATE equipment_maintenance_schedules
  SET status = CASE
    WHEN next_due_hours IS NOT NULL AND NEW.engine_hours >= next_due_hours THEN 'overdue'
    ELSE status
  END
  WHERE equipment_id = NEW.id
    AND schedule_type IN ('hours', 'both')
    AND status = 'scheduled';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4. Views - ALREADY IMPLEMENTED

#### Equipment Maintenance Due (009_heavy_equipment.sql:495-521)
```sql
CREATE OR REPLACE VIEW vw_equipment_maintenance_due AS
SELECT
  he.id,
  he.equipment_type,
  he.engine_hours,
  ems.maintenance_type,
  ems.next_due_hours,
  ems.next_due_date,
  CASE
    WHEN ems.next_due_hours IS NOT NULL
    THEN ems.next_due_hours - he.engine_hours
    ELSE NULL
  END as hours_until_due,
  CASE
    WHEN ems.next_due_date IS NOT NULL
    THEN ems.next_due_date - CURRENT_DATE
    ELSE NULL
  END as days_until_due
FROM heavy_equipment he
JOIN assets a ON he.asset_id = a.id
JOIN equipment_maintenance_schedules ems ON he.id = ems.equipment_id
WHERE ems.status IN ('scheduled', 'overdue');
```

## What We Need to ADD (Minimal Work)

### 1. Extend `vehicles` Table to Support All Asset Types

**APPROACH**: Add fields to existing `vehicles` table instead of creating new tables.

```sql
-- Migration: 032_multi_asset_vehicle_extensions.sql

-- Add asset type categorization
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS asset_category VARCHAR(50)
    CHECK (asset_category IN ('PASSENGER_VEHICLE', 'LIGHT_COMMERCIAL', 'HEAVY_TRUCK', 'TRACTOR', 'TRAILER', 'HEAVY_EQUIPMENT', 'UTILITY_VEHICLE', 'SPECIALTY_EQUIPMENT', 'NON_POWERED')),
  ADD COLUMN IF NOT EXISTS asset_type VARCHAR(50)
    CHECK (asset_type IN ('PASSENGER_CAR', 'SUV', 'PICKUP_TRUCK', 'CARGO_VAN', 'SEMI_TRACTOR', 'DRY_VAN_TRAILER', 'FLATBED_TRAILER', 'REFRIGERATED_TRAILER', 'EXCAVATOR', 'BULLDOZER', 'FORKLIFT', 'MOBILE_CRANE', 'BUCKET_TRUCK', 'GENERATOR', 'SHIPPING_CONTAINER', 'OTHER')),
  ADD COLUMN IF NOT EXISTS power_type VARCHAR(20)
    CHECK (power_type IN ('SELF_POWERED', 'TOWED', 'STATIONARY', 'PORTABLE'));

-- Add multi-metric tracking fields
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS primary_metric VARCHAR(20) DEFAULT 'ODOMETER'
    CHECK (primary_metric IN ('ODOMETER', 'ENGINE_HOURS', 'PTO_HOURS', 'AUX_HOURS', 'CYCLES', 'CALENDAR')),
  ADD COLUMN IF NOT EXISTS pto_hours DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aux_hours DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cycle_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_metric_update TIMESTAMP;

-- Add equipment-specific attributes
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS capacity_tons DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS max_reach_feet DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS lift_height_feet DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS bucket_capacity_yards DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS operating_weight_lbs DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS axle_count INTEGER,
  ADD COLUMN IF NOT EXISTS max_payload_kg DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS tank_capacity_l DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS has_pto BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_aux_power BOOLEAN DEFAULT FALSE;

-- Add road/usage restrictions
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS is_road_legal BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS requires_cdl BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_special_license BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_speed_kph DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS is_off_road_only BOOLEAN DEFAULT FALSE;

-- Add operational status
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50) DEFAULT 'AVAILABLE'
    CHECK (operational_status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RESERVED'));

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_vehicles_asset_category ON vehicles(asset_category);
CREATE INDEX IF NOT EXISTS idx_vehicles_asset_type ON vehicles(asset_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_primary_metric ON vehicles(primary_metric);
CREATE INDEX IF NOT EXISTS idx_vehicles_operational_status ON vehicles(operational_status);

-- Update existing vehicles to have asset_type
UPDATE vehicles SET asset_type = 'OTHER', asset_category = 'PASSENGER_VEHICLE', power_type = 'SELF_POWERED' WHERE asset_type IS NULL;
```

### 2. Create Asset Relationships Table

**NEW TABLE**: For tractor-trailer combos, machine-attachments

```sql
-- Migration: 032_multi_asset_vehicle_extensions.sql (continued)

CREATE TABLE IF NOT EXISTS asset_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_asset_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  child_asset_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  relationship_type VARCHAR(20) NOT NULL
    CHECK (relationship_type IN ('TOWS', 'ATTACHED', 'CARRIES', 'POWERS', 'CONTAINS')),
  connection_point VARCHAR(100),
  is_primary BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  CONSTRAINT chk_different_assets CHECK (parent_asset_id != child_asset_id),
  CONSTRAINT chk_relationship_type CHECK (relationship_type IN ('TOWS', 'ATTACHED', 'CARRIES', 'POWERS', 'CONTAINS'))
);

CREATE INDEX idx_asset_relationships_parent ON asset_relationships(parent_asset_id);
CREATE INDEX idx_asset_relationships_child ON asset_relationships(child_asset_id);
CREATE INDEX idx_asset_relationships_type ON asset_relationships(relationship_type);
CREATE INDEX idx_asset_relationships_effective ON asset_relationships(effective_from, effective_to);

COMMENT ON TABLE asset_relationships IS 'Asset relationships for combos like tractor-trailer, machine-attachments';
```

### 3. Extend Telemetry for Multi-Metric Tracking

**APPROACH**: Reuse existing telemetry/GPS tables and extend event schema

```sql
-- Migration: 032_multi_asset_vehicle_extensions.sql (continued)

-- Add telemetry event extension table for equipment-specific data
CREATE TABLE IF NOT EXISTS telemetry_equipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  event_time TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Multi-metric tracking
  engine_hours DECIMAL(10,2),
  pto_hours DECIMAL(10,2),
  aux_hours DECIMAL(10,2),
  cycle_count INTEGER,

  -- Equipment-specific data
  hydraulic_pressure_bar DECIMAL(6,2),
  boom_angle_degrees DECIMAL(5,2),
  load_weight_kg DECIMAL(12,2),
  attachment_position VARCHAR(100),
  fuel_level_percent INTEGER CHECK (fuel_level_percent >= 0 AND fuel_level_percent <= 100),
  coolant_temp_celsius DECIMAL(5,2),
  oil_pressure_bar DECIMAL(6,2),

  -- Diagnostic codes
  fault_codes TEXT[],
  warning_codes TEXT[],

  -- Context
  operator_id UUID REFERENCES drivers(id),
  job_site VARCHAR(255),
  project_code VARCHAR(100),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telemetry_equipment_vehicle ON telemetry_equipment_events(vehicle_id);
CREATE INDEX idx_telemetry_equipment_time ON telemetry_equipment_events(event_time DESC);
CREATE INDEX idx_telemetry_equipment_operator ON telemetry_equipment_events(operator_id);
```

### 4. Update Maintenance Schedules for Multi-Metric Triggers

**APPROACH**: Extend existing `maintenance_schedules` table

```sql
-- Migration: 032_multi_asset_vehicle_extensions.sql (continued)

-- Add multi-metric trigger support to existing maintenance_schedules table
ALTER TABLE maintenance_schedules
  ADD COLUMN IF NOT EXISTS trigger_metric VARCHAR(20)
    CHECK (trigger_metric IN ('ODOMETER', 'ENGINE_HOURS', 'PTO_HOURS', 'AUX_HOURS', 'CYCLES', 'CALENDAR')),
  ADD COLUMN IF NOT EXISTS trigger_condition VARCHAR(10) DEFAULT 'OR'
    CHECK (trigger_condition IN ('AND', 'OR')),
  ADD COLUMN IF NOT EXISTS last_service_pto_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS last_service_aux_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS last_service_cycles INTEGER,
  ADD COLUMN IF NOT EXISTS next_service_due_pto_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS next_service_due_aux_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS next_service_due_cycles INTEGER;

-- Update is_overdue to check multiple metrics
ALTER TABLE maintenance_schedules DROP COLUMN IF EXISTS is_overdue;

-- Create function to check if maintenance is overdue based on multiple metrics
CREATE OR REPLACE FUNCTION is_maintenance_overdue(
  p_interval_type VARCHAR,
  p_trigger_metric VARCHAR,
  p_trigger_condition VARCHAR,
  p_next_due_date DATE,
  p_next_due_odometer DECIMAL,
  p_next_due_engine_hours DECIMAL,
  p_next_due_pto_hours DECIMAL,
  p_next_due_aux_hours DECIMAL,
  p_next_due_cycles INTEGER,
  p_current_odometer DECIMAL,
  p_current_engine_hours DECIMAL,
  p_current_pto_hours DECIMAL,
  p_current_aux_hours DECIMAL,
  p_current_cycles INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  -- Calendar-based
  IF p_interval_type = 'days' AND p_next_due_date < CURRENT_DATE THEN
    RETURN TRUE;
  END IF;

  -- Odometer-based
  IF p_trigger_metric = 'ODOMETER' AND p_next_due_odometer IS NOT NULL AND p_current_odometer >= p_next_due_odometer THEN
    RETURN TRUE;
  END IF;

  -- Engine hours-based
  IF p_trigger_metric = 'ENGINE_HOURS' AND p_next_due_engine_hours IS NOT NULL AND p_current_engine_hours >= p_next_due_engine_hours THEN
    RETURN TRUE;
  END IF;

  -- PTO hours-based
  IF p_trigger_metric = 'PTO_HOURS' AND p_next_due_pto_hours IS NOT NULL AND p_current_pto_hours >= p_next_due_pto_hours THEN
    RETURN TRUE;
  END IF;

  -- Aux hours-based
  IF p_trigger_metric = 'AUX_HOURS' AND p_next_due_aux_hours IS NOT NULL AND p_current_aux_hours >= p_next_due_aux_hours THEN
    RETURN TRUE;
  END IF;

  -- Cycle-based
  IF p_trigger_metric = 'CYCLES' AND p_next_due_cycles IS NOT NULL AND p_current_cycles >= p_next_due_cycles THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

## Implementation Steps

### Phase 1: Database Extensions (1-2 hours)
1. ✅ Review existing tables (DONE)
2. Create migration `032_multi_asset_vehicle_extensions.sql`
3. Run migration on development database
4. Verify all indexes and constraints

### Phase 2: API Routes Extension (2-3 hours)
1. **Extend** `api/src/routes/vehicles.ts`:
   - Add query filters for `asset_type`, `asset_category`, `power_type`
   - Add query filters for `operational_status`
   - Support filtering by metric type (odometer, engine_hours, pto_hours, etc.)

2. **Create** `api/src/routes/asset-relationships.routes.ts`:
   - `GET /api/asset-relationships` - List relationships
   - `GET /api/asset-relationships/combos` - Get current asset combos
   - `POST /api/asset-relationships` - Create relationship (e.g., attach trailer)
   - `DELETE /api/asset-relationships/:id` - End relationship

3. **Extend** `api/src/routes/maintenance-schedules.ts`:
   - Support creating schedules with multi-metric triggers
   - API endpoint to check maintenance due across all metrics

### Phase 3: UI Components (3-4 hours)
1. **Extend** `src/components/dialogs/AddVehicleDialog.tsx`:
   - Add asset type selector (dropdowns for category/type)
   - Conditional fields based on asset type
   - Multi-metric input fields

2. **Create** `src/components/filters/AssetTypeFilter.tsx`:
   - Filter by asset category
   - Filter by asset type
   - Filter by power type
   - Filter by operational status

3. **Extend** `src/components/VehicleDetailPanel.tsx`:
   - Show asset type information
   - Display multi-metric readings (odometer, engine_hours, pto_hours, etc.)
   - Show attached/related assets (trailers, attachments)

4. **Create** `src/components/AssetComboManager.tsx`:
   - UI to attach/detach trailers from tractors
   - UI to attach equipment to machines
   - Show current combos

### Phase 4: Testing (1-2 hours)
1. Add test data for all asset types
2. Test filtering by asset type
3. Test multi-metric maintenance triggers
4. Test asset relationship creation

### Phase 5: Documentation & Deployment (1 hour)
1. Update API documentation
2. Create user guide for multi-asset types
3. Deploy to staging
4. Deploy to production

## Total Estimated Time: 8-12 hours

## Risk Mitigation

### Risk 1: Breaking Existing Vehicle Functionality
**Mitigation**: All new fields are nullable with defaults. Existing queries continue to work.

### Risk 2: Data Migration Complexity
**Mitigation**: New fields are added incrementally. Existing vehicles default to `asset_type = 'OTHER'`.

### Risk 3: UI/UX Complexity
**Mitigation**: Asset type selection is optional. Existing users see same UI by default.

## Success Metrics

- ✅ All existing vehicle functionality still works
- ✅ Can create and manage tractors, trailers, heavy equipment
- ✅ Can attach trailers to tractors (asset relationships)
- ✅ Maintenance triggers work for engine hours, PTO hours
- ✅ Telemetry tracks equipment-specific metrics
- ✅ UI filters by asset type and category

## Code Reuse Summary

**REUSING (80%)**:
- ✅ `vehicles` table structure
- ✅ `assets` table and routes
- ✅ `heavy_equipment` table and hour meters
- ✅ `maintenance_schedules` table
- ✅ Existing API routes for vehicles and assets
- ✅ Existing UI components (dialogs, panels, filters)

**ADDING (20%)**:
- ⚡ Asset type/category fields to `vehicles` table
- ⚡ Multi-metric fields (pto_hours, aux_hours, cycle_count)
- ⚡ `asset_relationships` table
- ⚡ `telemetry_equipment_events` table
- ⚡ Extended maintenance trigger logic
- ⚡ Asset type filters in UI

## Next Steps

1. Create migration file `032_multi_asset_vehicle_extensions.sql`
2. Test migration on development database
3. Extend API routes for asset types
4. Update UI components for asset type selection
5. Test end-to-end with all asset types
