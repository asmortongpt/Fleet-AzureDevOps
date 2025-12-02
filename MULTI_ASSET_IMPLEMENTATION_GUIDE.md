# Multi-Asset Fleet Management System - Implementation Guide

## Overview

This guide provides a complete implementation plan to extend the Fleet Management System from basic vehicle tracking to a comprehensive multi-asset platform supporting:

- **Passenger vehicles** (cars, SUVs, vans)
- **Commercial trucks** (light, medium, heavy duty)
- **Tractors** (semi-tractors, prime movers)
- **Trailers** (dry van, flatbed, refrigerated, lowboy)
- **Heavy equipment** (excavators, loaders, cranes, graders, dozers)
- **Utility units** (bucket trucks, service bodies, mobile workshops)
- **Specialty assets** (generators, compressors, pumps)
- **Non-powered assets** (containers, toolboxes, tracked equipment)

---

## Phase 1: Core Data Model Extension

### 1.1 Asset Type System

**File**: `api/src/types/asset-types.ts`

```typescript
export enum AssetType {
  // Passenger Vehicles
  PASSENGER_CAR = 'PASSENGER_CAR',
  SUV = 'SUV',
  PASSENGER_VAN = 'PASSENGER_VAN',

  // Light Commercial
  LIGHT_TRUCK = 'LIGHT_TRUCK',
  PICKUP_TRUCK = 'PICKUP_TRUCK',
  CARGO_VAN = 'CARGO_VAN',

  // Medium/Heavy Trucks
  MEDIUM_DUTY_TRUCK = 'MEDIUM_DUTY_TRUCK',
  HEAVY_DUTY_TRUCK = 'HEAVY_DUTY_TRUCK',
  DUMP_TRUCK = 'DUMP_TRUCK',

  // Tractors
  SEMI_TRACTOR = 'SEMI_TRACTOR',
  DAY_CAB_TRACTOR = 'DAY_CAB_TRACTOR',
  SLEEPER_CAB_TRACTOR = 'SLEEPER_CAB_TRACTOR',

  // Trailers
  DRY_VAN_TRAILER = 'DRY_VAN_TRAILER',
  FLATBED_TRAILER = 'FLATBED_TRAILER',
  REFRIGERATED_TRAILER = 'REFRIGERATED_TRAILER',
  LOWBOY_TRAILER = 'LOWBOY_TRAILER',
  TANK_TRAILER = 'TANK_TRAILER',
  CONTAINER_CHASSIS = 'CONTAINER_CHASSIS',

  // Heavy Equipment - Earthmoving
  EXCAVATOR = 'EXCAVATOR',
  BULLDOZER = 'BULLDOZER',
  BACKHOE = 'BACKHOE',
  MOTOR_GRADER = 'MOTOR_GRADER',
  WHEEL_LOADER = 'WHEEL_LOADER',
  SKID_STEER = 'SKID_STEER',

  // Heavy Equipment - Lifting/Material Handling
  MOBILE_CRANE = 'MOBILE_CRANE',
  TOWER_CRANE = 'TOWER_CRANE',
  FORKLIFT = 'FORKLIFT',
  TELEHANDLER = 'TELEHANDLER',

  // Utility/Service Vehicles
  BUCKET_TRUCK = 'BUCKET_TRUCK',
  SERVICE_BODY_TRUCK = 'SERVICE_BODY_TRUCK',
  MOBILE_WORKSHOP = 'MOBILE_WORKSHOP',

  // Specialty Equipment
  GENERATOR = 'GENERATOR',
  AIR_COMPRESSOR = 'AIR_COMPRESSOR',
  WATER_PUMP = 'WATER_PUMP',
  LIGHT_TOWER = 'LIGHT_TOWER',

  // Non-Powered Assets
  SHIPPING_CONTAINER = 'SHIPPING_CONTAINER',
  STORAGE_TRAILER = 'STORAGE_TRAILER',
  TOOLBOX_TRAILER = 'TOOLBOX_TRAILER',

  OTHER = 'OTHER'
}

export enum AssetCategory {
  PASSENGER_VEHICLE = 'PASSENGER_VEHICLE',
  LIGHT_COMMERCIAL = 'LIGHT_COMMERCIAL',
  HEAVY_TRUCK = 'HEAVY_TRUCK',
  TRACTOR = 'TRACTOR',
  TRAILER = 'TRAILER',
  HEAVY_EQUIPMENT = 'HEAVY_EQUIPMENT',
  UTILITY_VEHICLE = 'UTILITY_VEHICLE',
  SPECIALTY_EQUIPMENT = 'SPECIALTY_EQUIPMENT',
  NON_POWERED = 'NON_POWERED'
}

export enum PowerType {
  SELF_POWERED = 'SELF_POWERED',      // Has its own engine
  TOWED = 'TOWED',                    // Requires towing (trailers)
  STATIONARY = 'STATIONARY',          // Fixed location (generators, etc.)
  PORTABLE = 'PORTABLE'               // Manually moved
}

export enum UsageMetric {
  ODOMETER = 'ODOMETER',              // km/mi
  ENGINE_HOURS = 'ENGINE_HOURS',      // Hours
  PTO_HOURS = 'PTO_HOURS',           // Power take-off hours
  AUX_HOURS = 'AUX_HOURS',           // Auxiliary equipment hours
  CYCLES = 'CYCLES',                  // Load cycles (cranes, forklifts)
  CALENDAR = 'CALENDAR'               // Time-based only
}
```

### 1.2 Extended Asset Model

**File**: `api/src/models/asset.model.ts`

```typescript
import { AssetType, AssetCategory, PowerType, UsageMetric } from '../types/asset-types';

export interface Asset {
  // Core Identification
  id: string;
  orgId: string;                      // Multi-tenant support
  tenantId: string;
  assetType: AssetType;
  category: AssetCategory;
  powerType: PowerType;

  // Basic Info
  name: string;
  displayName?: string;
  description?: string;
  vinOrSerial: string;                // VIN for vehicles, serial for equipment
  plateNumber?: string;

  // Manufacturer Details
  make?: string;
  model?: string;
  year?: number;

  // Usage Tracking - Multi-Metric Support
  primaryMetric: UsageMetric;
  odometer?: number;                  // km/mi
  engineHours?: number;
  ptoHours?: number;                  // Power Take-Off hours
  auxHours?: number;                  // Auxiliary equipment hours
  cycleCount?: number;                // For lifting equipment
  lastMetricUpdate?: Date;

  // Physical Attributes
  weightKg?: number;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  axleCount?: number;
  maxPayloadKg?: number;
  capacityM3?: number;                // Volume capacity
  tankCapacityL?: number;             // Fuel/liquid capacity

  // Equipment-Specific Attributes
  liftCapacityKg?: number;            // For cranes, forklifts
  boomLengthM?: number;               // For cranes, bucket trucks
  bucketCapacityM3?: number;          // For loaders, excavators
  bladeWidthM?: number;               // For dozers, graders
  hydraulicPressureBar?: number;
  hasPTO?: boolean;                   // Power Take-Off
  hasAuxPower?: boolean;

  // Road/Usage Restrictions
  isRoadLegal?: boolean;
  requiresCDL?: boolean;
  requiresSpecialLicense?: boolean;
  maxSpeedKph?: number;
  isOffRoadOnly?: boolean;

  // Relationships
  parentAssetId?: string;             // e.g., tractor for a trailer
  assignedToAssetId?: string;         // Currently attached/towed by
  groupId?: string;                   // Asset grouping
  fleetId?: string;
  locationId?: string;

  // Assignment
  assignedDriverId?: string;
  assignedDepartment?: string;
  homeBase?: string;

  // Financial
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  depreciationMethod?: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';

  // Status
  status: 'ACTIVE' | 'IN_SERVICE' | 'OUT_OF_SERVICE' | 'RETIRED' | 'DISPOSED';
  operationalStatus?: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RESERVED';

  // Metadata
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}
```

### 1.3 Asset Relationship Model

**File**: `api/src/models/asset-relationship.model.ts`

```typescript
export enum RelationshipType {
  TOWS = 'TOWS',                      // Tractor tows trailer
  ATTACHED = 'ATTACHED',              // Attachment connected to machine
  CARRIES = 'CARRIES',                // Truck carries container
  POWERS = 'POWERS',                  // Generator powers equipment
  CONTAINS = 'CONTAINS'               // Container contains items
}

export interface AssetRelationship {
  id: string;
  parentAssetId: string;              // The main asset (tractor, truck, etc.)
  childAssetId: string;               // The dependent asset (trailer, attachment)
  relationshipType: RelationshipType;

  // Temporal tracking
  effectiveFrom: Date;
  effectiveTo?: Date;

  // Connection details
  connectionPoint?: string;            // e.g., "fifth wheel", "front mount", "PTO"
  isPrimary?: boolean;                 // Primary attachment vs secondary

  // Metadata
  notes?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface AssetCombo {
  id: string;
  name: string;
  primaryAssetId: string;
  relationships: AssetRelationship[];
  isActive: boolean;
  createdAt: Date;
}
```

---

## Phase 2: Maintenance System Extension

### 2.1 Multi-Metric Maintenance Templates

**File**: `api/src/models/maintenance-template.model.ts`

```typescript
import { AssetType, UsageMetric } from '../types/asset-types';

export enum TriggerCondition {
  AND = 'AND',                        // All triggers must be met
  OR = 'OR'                           // Any trigger can activate
}

export interface MaintenanceTrigger {
  id: string;
  type: UsageMetric;
  threshold: number;
  unit: string;                       // 'km', 'miles', 'hours', 'days', 'cycles'
  isRecurring: boolean;
  lastTriggered?: Date;
  nextDue?: number;
}

export interface MaintenanceTemplate {
  id: string;
  orgId: string;
  name: string;
  description?: string;

  // Applicable to which assets
  assetTypes: AssetType[];
  category?: string;

  // Trigger configuration
  triggers: MaintenanceTrigger[];
  triggerCondition: TriggerCondition;

  // Service details
  serviceType: 'INSPECTION' | 'SERVICE' | 'REPAIR' | 'SAFETY_CHECK';
  estimatedDurationHours?: number;
  estimatedCost?: number;

  // Checklist
  checklistItems: {
    id: string;
    description: string;
    isRequired: boolean;
    category?: string;                // 'ENGINE', 'HYDRAULICS', 'ELECTRICAL', etc.
  }[];

  // Parts
  recommendedParts?: {
    partNumber: string;
    description: string;
    quantity: number;
  }[];

  // Notification
  notifyDaysBefore?: number;
  notifyAtThreshold?: number;         // Percentage (e.g., 90% = notify at 90% of threshold)

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Maintenance Scheduling Logic

**File**: `api/src/services/maintenance-scheduler.service.ts`

```typescript
export class MaintenanceSchedulerService {
  /**
   * Calculate when next maintenance is due based on asset's usage metrics
   */
  async calculateNextDue(
    asset: Asset,
    template: MaintenanceTemplate
  ): Promise<{ isDue: boolean; dueAt: Date | null; dueIn: number | null }> {
    const triggers = template.triggers;
    const condition = template.triggerCondition;

    let triggerResults: boolean[] = [];

    for (const trigger of triggers) {
      const currentValue = this.getCurrentMetricValue(asset, trigger.type);
      const threshold = trigger.threshold;

      // Calculate if this trigger is met
      const isMet = currentValue >= threshold;
      triggerResults.push(isMet);

      // Calculate how much is left
      const remaining = threshold - currentValue;
      console.log(`Trigger ${trigger.type}: ${currentValue}/${threshold} (${remaining} remaining)`);
    }

    // Evaluate based on condition
    const isDue = condition === TriggerCondition.AND
      ? triggerResults.every(r => r)
      : triggerResults.some(r => r);

    return {
      isDue,
      dueAt: isDue ? new Date() : this.estimateDueDate(asset, template),
      dueIn: this.calculateDaysUntilDue(asset, template)
    };
  }

  private getCurrentMetricValue(asset: Asset, metric: UsageMetric): number {
    switch (metric) {
      case UsageMetric.ODOMETER:
        return asset.odometer || 0;
      case UsageMetric.ENGINE_HOURS:
        return asset.engineHours || 0;
      case UsageMetric.PTO_HOURS:
        return asset.ptoHours || 0;
      case UsageMetric.AUX_HOURS:
        return asset.auxHours || 0;
      case UsageMetric.CYCLES:
        return asset.cycleCount || 0;
      case UsageMetric.CALENDAR:
        // Calculate days since last service
        const lastService = this.getLastServiceDate(asset);
        return daysSince(lastService);
      default:
        return 0;
    }
  }

  // Additional helper methods...
}
```

---

## Phase 3: Telemetry & Tracking Extension

### 3.1 Enhanced Telemetry Event Model

**File**: `api/src/models/telemetry-event.model.ts`

```typescript
export interface TelemetryEvent {
  id: string;
  assetId: string;
  timestamp: Date;

  // Location (if applicable)
  lat?: number;
  lon?: number;
  altitude?: number;
  heading?: number;
  accuracy?: number;

  // Multi-metric readings
  odometer?: number;
  engineHours?: number;
  ptoHours?: number;
  auxHours?: number;
  cycleCount?: number;

  // Speed & Motion
  speedKph?: number;
  isMoving?: boolean;
  isIdling?: boolean;

  // Engine/Equipment Status
  engineOn?: boolean;
  ptoEngaged?: boolean;
  batteryVoltage?: number;
  fuelLevelPercent?: number;
  fuelRateL PerHour?: number;

  // Equipment-Specific Telemetry
  hydraulicPressure?: number;
  hydraulicTemp?: number;
  loadWeight?: number;               // For scales/load sensors
  boomAngle?: number;                // For cranes
  attachmentPosition?: string;       // For excavators, etc.

  // Event Classification
  eventType?: 'NORMAL' | 'HARSH_BRAKE' | 'HARSH_ACCEL' | 'OVER_SPEED' |
              'IDLE_EXCESSIVE' | 'GEOFENCE_ENTER' | 'GEOFENCE_EXIT' |
              'MAINTENANCE_ALERT' | 'FAULT_CODE' | 'CUSTOM';

  // Diagnostic/Fault Codes
  faultCodes?: string[];
  diagnosticTroubleCodesystem?: 'OBD2' | 'J1939' | 'PROPRIETARY';

  // Custom payload for vendor-specific data
  payload?: Record<string, any>;
  source?: string;                   // 'GPS_TRACKER' | 'TELEMATICS_DEVICE' | 'MANUAL_ENTRY'

  createdAt: Date;
}
```

### 3.2 Telemetry Ingest Service

**File**: `api/src/services/telemetry-ingest.service.ts`

```typescript
export class TelematryIngestService {
  async ingestEvent(event: TelemetryEvent): Promise<void> {
    // 1. Validate event
    const asset = await this.getAsset(event.assetId);
    if (!asset) throw new Error('Asset not found');

    // 2. Update asset metrics
    await this.updateAssetMetrics(asset, event);

    // 3. Check for maintenance triggers
    await this.checkMaintenanceTriggers(asset);

    // 4. Check for alerts
    await this.checkAlertRules(asset, event);

    // 5. Store event
    await this.storeEvent(event);

    // 6. Update real-time dashboards (WebSocket)
    await this.broadcastUpdate(event);
  }

  private async updateAssetMetrics(asset: Asset, event: TelemetryEvent): Promise<void> {
    const updates: Partial<Asset> = {
      lastMetricUpdate: new Date()
    };

    if (event.odometer !== undefined) {
      updates.odometer = Math.max(asset.odometer || 0, event.odometer);
    }

    if (event.engineHours !== undefined) {
      updates.engineHours = Math.max(asset.engineHours || 0, event.engineHours);
    }

    if (event.ptoHours !== undefined) {
      updates.ptoHours = Math.max(asset.ptoHours || 0, event.ptoHours);
    }

    if (event.auxHours !== undefined) {
      updates.auxHours = Math.max(asset.auxHours || 0, event.auxHours);
    }

    if (event.cycleCount !== undefined) {
      updates.cycleCount = Math.max(asset.cycleCount || 0, event.cycleCount);
    }

    await this.updateAsset(asset.id, updates);
  }
}
```

---

## Phase 4: Database Migration

### 4.1 PostgreSQL Migration Script

**File**: `api/src/migrations/002_multi_asset_support.sql`

```sql
-- ============================================================================
-- MIGRATION: Add Multi-Asset Support to Fleet Management System
-- Version: 002
-- Description: Extends vehicles table to support all asset types with
--              multi-metric tracking, relationships, and equipment-specific fields
-- ============================================================================

BEGIN;

-- Add new asset type columns
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS asset_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS power_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS primary_metric VARCHAR(20) DEFAULT 'ODOMETER';

-- Add multi-metric tracking columns
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS engine_hours DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pto_hours DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aux_hours DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cycle_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_metric_update TIMESTAMP;

-- Add physical attribute columns
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS length_m DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS width_m DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS height_m DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS axle_count INTEGER,
  ADD COLUMN IF NOT EXISTS max_payload_kg DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS capacity_m3 DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS tank_capacity_l DECIMAL(10,2);

-- Add equipment-specific columns
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS lift_capacity_kg DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS boom_length_m DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS bucket_capacity_m3 DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS blade_width_m DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS hydraulic_pressure_bar DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS has_pto BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_aux_power BOOLEAN DEFAULT FALSE;

-- Add road/usage restriction columns
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS is_road_legal BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS requires_cdl BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_special_license BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_speed_kph INTEGER,
  ADD COLUMN IF NOT EXISTS is_off_road_only BOOLEAN DEFAULT FALSE;

-- Add relationship columns
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS parent_asset_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to_asset_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_id UUID;

-- Add operational status
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS operational_status VARCHAR(20) DEFAULT 'AVAILABLE';

-- ============================================================================
-- CREATE: Asset Relationships Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_asset_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  child_asset_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  relationship_type VARCHAR(20) NOT NULL,
  connection_point VARCHAR(100),
  is_primary BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID,

  CONSTRAINT chk_relationship_type CHECK (relationship_type IN ('TOWS', 'ATTACHED', 'CARRIES', 'POWERS', 'CONTAINS')),
  CONSTRAINT chk_not_self_reference CHECK (parent_asset_id != child_asset_id)
);

CREATE INDEX idx_asset_relationships_parent ON asset_relationships(parent_asset_id);
CREATE INDEX idx_asset_relationships_child ON asset_relationships(child_asset_id);
CREATE INDEX idx_asset_relationships_active ON asset_relationships(effective_from, effective_to)
  WHERE effective_to IS NULL;

-- ============================================================================
-- CREATE: Maintenance Templates Table (Multi-Metric)
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  asset_types TEXT[], -- Array of asset types this applies to
  category VARCHAR(50),
  service_type VARCHAR(20) NOT NULL,
  trigger_condition VARCHAR(5) DEFAULT 'OR',
  estimated_duration_hours DECIMAL(5,2),
  estimated_cost DECIMAL(10,2),
  checklist_items JSONB,
  recommended_parts JSONB,
  notify_days_before INTEGER,
  notify_at_threshold INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_service_type CHECK (service_type IN ('INSPECTION', 'SERVICE', 'REPAIR', 'SAFETY_CHECK')),
  CONSTRAINT chk_trigger_condition CHECK (trigger_condition IN ('AND', 'OR'))
);

CREATE INDEX idx_maintenance_templates_org ON maintenance_templates(org_id);
CREATE INDEX idx_maintenance_templates_active ON maintenance_templates(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- CREATE: Maintenance Triggers Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES maintenance_templates(id) ON DELETE CASCADE,
  trigger_type VARCHAR(20) NOT NULL,
  threshold DECIMAL(12,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  is_recurring BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_trigger_type CHECK (trigger_type IN ('ODOMETER', 'ENGINE_HOURS', 'PTO_HOURS', 'AUX_HOURS', 'CYCLES', 'CALENDAR'))
);

CREATE INDEX idx_maintenance_triggers_template ON maintenance_triggers(template_id);

-- ============================================================================
-- EXTEND: Telemetry Events Table
-- ============================================================================

ALTER TABLE telemetry_events
  ADD COLUMN IF NOT EXISTS engine_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS pto_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS aux_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS cycle_count INTEGER,
  ADD COLUMN IF NOT EXISTS engine_on BOOLEAN,
  ADD COLUMN IF NOT EXISTS pto_engaged BOOLEAN,
  ADD COLUMN IF NOT EXISTS battery_voltage DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS fuel_level_percent DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS fuel_rate_lph DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS hydraulic_pressure DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS hydraulic_temp DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS load_weight DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS boom_angle DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS attachment_position VARCHAR(50),
  ADD COLUMN IF NOT EXISTS fault_codes TEXT[],
  ADD COLUMN IF NOT EXISTS dtc_system VARCHAR(20),
  ADD COLUMN IF NOT EXISTS payload JSONB,
  ADD COLUMN IF NOT EXISTS source VARCHAR(50);

-- ============================================================================
-- UPDATE: Migrate existing vehicles to new schema
-- ============================================================================

-- Set default asset type for existing vehicles
UPDATE vehicles
SET
  asset_type = CASE
    WHEN make ILIKE '%semi%' OR make ILIKE '%tractor%' THEN 'SEMI_TRACTOR'
    WHEN make ILIKE '%trailer%' THEN 'DRY_VAN_TRAILER'
    WHEN make ILIKE '%excavator%' THEN 'EXCAVATOR'
    WHEN make ILIKE '%loader%' THEN 'WHEEL_LOADER'
    ELSE 'LIGHT_TRUCK'
  END,
  category = CASE
    WHEN make ILIKE '%semi%' OR make ILIKE '%tractor%' THEN 'TRACTOR'
    WHEN make ILIKE '%trailer%' THEN 'TRAILER'
    WHEN make ILIKE '%excavator%' OR make ILIKE '%loader%' THEN 'HEAVY_EQUIPMENT'
    ELSE 'LIGHT_COMMERCIAL'
  END,
  power_type = CASE
    WHEN make ILIKE '%trailer%' THEN 'TOWED'
    ELSE 'SELF_POWERED'
  END,
  primary_metric = CASE
    WHEN make ILIKE '%excavator%' OR make ILIKE '%loader%' OR make ILIKE '%crane%' THEN 'ENGINE_HOURS'
    WHEN make ILIKE '%trailer%' THEN 'CALENDAR'
    ELSE 'ODOMETER'
  END
WHERE asset_type IS NULL;

COMMIT;
```

---

## Phase 5: UI/UX Updates

### 5.1 Asset List Component with Type Filtering

**File**: `src/components/assets/AssetList.tsx`

```typescript
import React, { useState } from 'react';
import { AssetType, AssetCategory } from '@/types/asset-types';

export function AssetList() {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<AssetType | 'ALL'>('ALL');

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', selectedCategory, selectedType],
    queryFn: () => fetchAssets({ category: selectedCategory, type: selectedType })
  });

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1 rounded ${selectedCategory === 'ALL' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          All Assets
        </button>
        <button
          onClick={() => setSelectedCategory(AssetCategory.PASSENGER_VEHICLE)}
          className={`px-3 py-1 rounded ${selectedCategory === AssetCategory.PASSENGER_VEHICLE ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          🚗 Vehicles
        </button>
        <button
          onClick={() => setSelectedCategory(AssetCategory.HEAVY_TRUCK)}
          className={`px-3 py-1 rounded ${selectedCategory === AssetCategory.HEAVY_TRUCK ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          🚛 Trucks
        </button>
        <button
          onClick={() => setSelectedCategory(AssetCategory.TRACTOR)}
          className={`px-3 py-1 rounded ${selectedCategory === AssetCategory.TRACTOR ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          🚜 Tractors
        </button>
        <button
          onClick={() => setSelectedCategory(AssetCategory.TRAILER)}
          className={`px-3 py-1 rounded ${selectedCategory === AssetCategory.TRAILER ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          📦 Trailers
        </button>
        <button
          onClick={() => setSelectedCategory(AssetCategory.HEAVY_EQUIPMENT)}
          className={`px-3 py-1 rounded ${selectedCategory === AssetCategory.HEAVY_EQUIPMENT ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          🏗️ Equipment
        </button>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets?.map(asset => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </div>
  );
}

function AssetCard({ asset }: { asset: Asset }) {
  const icon = getAssetIcon(asset.assetType);
  const primaryMetric = getPrimaryMetricDisplay(asset);

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold">{asset.name}</h3>
            <p className="text-sm text-gray-500">{asset.assetType.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(asset.operationalStatus)}`}>
          {asset.operationalStatus}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-sm">
          <span className="text-gray-500">Primary Metric:</span>
          <span className="ml-2 font-medium">{primaryMetric}</span>
        </div>

        {asset.assignedDriverId && (
          <div className="text-sm">
            <span className="text-gray-500">Assigned to:</span>
            <span className="ml-2">{asset.assignedDriverId}</span>
          </div>
        )}

        {asset.assignedToAssetId && (
          <div className="text-sm">
            <span className="text-gray-500">Connected to:</span>
            <span className="ml-2">{asset.assignedToAssetId}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getAssetIcon(type: AssetType): string {
  const iconMap: Record<AssetType, string> = {
    [AssetType.PASSENGER_CAR]: '🚗',
    [AssetType.PICKUP_TRUCK]: '🛻',
    [AssetType.SEMI_TRACTOR]: '🚛',
    [AssetType.DRY_VAN_TRAILER]: '📦',
    [AssetType.EXCAVATOR]: '🏗️',
    [AssetType.BULLDOZER]: '🚜',
    [AssetType.MOBILE_CRANE]: '🏗️',
    [AssetType.BUCKET_TRUCK]: '🚒',
    // ... add all types
  };
  return iconMap[type] || '📦';
}
```

---

## Phase 6: API Routes

### 6.1 Asset Management Routes

**File**: `api/src/routes/assets.routes.ts`

```typescript
import express from 'express';
import { AssetService } from '../services/asset.service';
import { AssetRelationshipService } from '../services/asset-relationship.service';

const router = express.Router();
const assetService = new AssetService();
const relationshipService = new AssetRelationshipService();

// List assets with filtering
router.get('/assets', async (req, res) => {
  const { category, type, status, assignedDriver } = req.query;
  const tenantId = req.user.tenant_id;

  const assets = await assetService.list({
    tenantId,
    category: category as string,
    assetType: type as string,
    status: status as string,
    assignedDriverId: assignedDriver as string
  });

  res.json(assets);
});

// Get asset details
router.get('/assets/:id', async (req, res) => {
  const asset = await assetService.getById(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  // Include relationships
  const relationships = await relationshipService.getForAsset(asset.id);

  res.json({ ...asset, relationships });
});

// Create asset
router.post('/assets', async (req, res) => {
  const assetData = {
    ...req.body,
    tenantId: req.user.tenant_id,
    createdBy: req.user.id
  };

  const asset = await assetService.create(assetData);
  res.status(201).json(asset);
});

// Update asset metrics (from telemetry)
router.patch('/assets/:id/metrics', async (req, res) => {
  const { odometer, engineHours, ptoHours, auxHours, cycleCount } = req.body;

  const updated = await assetService.updateMetrics(req.params.id, {
    odometer,
    engineHours,
    ptoHours,
    auxHours,
    cycleCount,
    lastMetricUpdate: new Date()
  });

  res.json(updated);
});

// Asset relationships
router.post('/assets/:id/relationships', async (req, res) => {
  const relationship = await relationshipService.create({
    parentAssetId: req.params.id,
    ...req.body
  });

  res.status(201).json(relationship);
});

router.delete('/assets/:id/relationships/:relationshipId', async (req, res) => {
  await relationshipService.delete(req.params.relationshipId);
  res.status(204).send();
});

export default router;
```

---

## Implementation Phases Summary

### **Phase 1: Foundation (Week 1)**
- [ ] Create type definitions (`asset-types.ts`)
- [ ] Extend Asset model
- [ ] Create Asset Relationship model
- [ ] Database migration script

### **Phase 2: Backend Logic (Week 2)**
- [ ] Asset Service with multi-type support
- [ ] Asset Relationship Service
- [ ] Maintenance Template Service (multi-metric)
- [ ] Telemetry Ingest Service (multi-metric)

### **Phase 3: API Layer (Week 3)**
- [ ] Asset CRUD routes
- [ ] Relationship routes
- [ ] Telemetry routes (extended)
- [ ] Maintenance routes (extended)

### **Phase 4: Frontend UI (Week 4)**
- [ ] Asset List with category/type filters
- [ ] Asset Detail view (type-specific fields)
- [ ] Asset Relationship UI (tractor-trailer combos)
- [ ] Maintenance Schedule view (multi-metric)

### **Phase 5: Integration & Testing (Week 5)**
- [ ] Unit tests for all services
- [ ] Integration tests for workflows
- [ ] E2E tests for critical paths
- [ ] Performance testing

### **Phase 6: Documentation & Deployment (Week 6)**
- [ ] API documentation
- [ ] User guides per asset type
- [ ] Admin training materials
- [ ] Production deployment

---

## Next Steps

1. **Review this implementation plan** with your development team
2. **Prioritize features** based on business needs
3. **Start with Phase 1** (data model foundation)
4. **Implement incrementally** and test each phase
5. **Migrate existing data** using the provided SQL script
6. **Train users** on new asset types and features

This comprehensive guide provides everything needed to transform your Fleet Management System into a true multi-asset platform supporting trucks, trailers, heavy equipment, and specialty assets.
