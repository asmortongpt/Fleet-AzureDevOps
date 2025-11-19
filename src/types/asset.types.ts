/**
 * Multi-Asset Vehicle Type Definitions (Frontend)
 * Created: 2025-11-19
 * Phase 3: TypeScript Types & Interfaces
 *
 * Aligns with:
 * - Database migration: api/src/migrations/032_multi_asset_vehicle_extensions.sql
 * - API types: api/src/types/asset.types.ts
 * - IMPLEMENTATION_TASKS.md Phase 3
 */

// ============================================================================
// ASSET CATEGORIES - Top-level classification (9 types)
// ============================================================================

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

// ============================================================================
// ASSET TYPES - Specific types (30+ types)
// ============================================================================

export type AssetType =
  // Passenger Vehicles
  | 'PASSENGER_CAR'
  | 'SUV'
  | 'PASSENGER_VAN'

  // Light Commercial
  | 'LIGHT_TRUCK'
  | 'PICKUP_TRUCK'
  | 'CARGO_VAN'

  // Heavy Trucks
  | 'MEDIUM_DUTY_TRUCK'
  | 'HEAVY_DUTY_TRUCK'
  | 'DUMP_TRUCK'

  // Tractors
  | 'SEMI_TRACTOR'
  | 'DAY_CAB_TRACTOR'
  | 'SLEEPER_CAB_TRACTOR'

  // Trailers
  | 'DRY_VAN_TRAILER'
  | 'FLATBED_TRAILER'
  | 'REFRIGERATED_TRAILER'
  | 'LOWBOY_TRAILER'
  | 'TANK_TRAILER'

  // Heavy Equipment
  | 'EXCAVATOR'
  | 'BULLDOZER'
  | 'BACKHOE'
  | 'MOTOR_GRADER'
  | 'WHEEL_LOADER'
  | 'SKID_STEER'
  | 'MOBILE_CRANE'
  | 'TOWER_CRANE'
  | 'FORKLIFT'

  // Utility/Service Vehicles
  | 'BUCKET_TRUCK'
  | 'SERVICE_BODY_TRUCK'
  | 'MOBILE_WORKSHOP'

  // Specialty Equipment
  | 'GENERATOR'
  | 'AIR_COMPRESSOR'
  | 'WATER_PUMP'
  | 'LIGHT_TOWER'

  // Non-Powered Assets
  | 'SHIPPING_CONTAINER'
  | 'STORAGE_TRAILER'
  | 'TOOLBOX_TRAILER'

  // Other
  | 'OTHER'

// ============================================================================
// ENUMS - Supporting Types
// ============================================================================

export type PowerType =
  | 'SELF_POWERED'
  | 'TOWED'
  | 'STATIONARY'
  | 'PORTABLE'

export type UsageMetric =
  | 'ODOMETER'
  | 'ENGINE_HOURS'
  | 'PTO_HOURS'
  | 'AUX_HOURS'
  | 'CYCLES'
  | 'CALENDAR'

export type OperationalStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'RESERVED'

export type RelationshipType =
  | 'TOWS'
  | 'ATTACHED'
  | 'CARRIES'
  | 'POWERS'
  | 'CONTAINS'

// ============================================================================
// CORE INTERFACES - Asset, AssetRelationship, AssetCombo
// ============================================================================

/**
 * Asset Interface - Complete asset/vehicle with all fields
 * This is the main interface for multi-asset support
 */
export interface Asset {
  // Core Identity
  id: string
  tenantId: string
  vin?: string
  make: string
  model: string
  year: number
  number?: string
  licensePlate?: string

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
  last_metric_update?: string

  // Equipment Specifications
  capacity_tons?: number
  max_reach_feet?: number
  lift_height_feet?: number
  bucket_capacity_yards?: number
  operating_weight_lbs?: number

  // Trailer Specifications
  axle_count?: number
  max_payload_kg?: number
  tank_capacity_l?: number

  // Equipment Capabilities
  has_pto?: boolean
  has_aux_power?: boolean
  is_road_legal?: boolean
  requires_cdl?: boolean
  requires_special_license?: boolean
  max_speed_kph?: number
  is_off_road_only?: boolean

  // Operational Status
  operational_status?: OperationalStatus

  // Asset Organization
  parent_asset_id?: string
  group_id?: string
  fleet_id?: string
  location_id?: string

  // Standard Vehicle Fields
  status: string
  fuelType?: string
  fuelLevel?: number
  ownership?: string
  assignedDriver?: string
  department?: string
  region?: string

  // Location
  location?: {
    lat: number
    lng: number
    address: string
  }

  // Timestamps
  createdAt?: string
  updatedAt?: string
  lastService?: string
  nextService?: string

  // Alerts and Tags
  alerts?: string[]
  tags?: string[]
  customFields?: Record<string, any>
}

/**
 * AssetRelationship Interface - Parent-child asset relationships
 * Example: Tractor #123 TOWS Trailer #456
 */
export interface AssetRelationship {
  id: string
  parent_asset_id: string
  child_asset_id: string
  relationship_type: RelationshipType
  connection_point?: string
  is_primary?: boolean
  effective_from: string
  effective_to?: string
  notes?: string
  created_at: string
  created_by?: string
}

/**
 * AssetCombo Interface - View of active asset combinations
 * From database view: vw_active_asset_combos
 */
export interface AssetCombo {
  relationship_id: string
  relationship_type: RelationshipType

  // Parent Asset
  parent_id: string
  parent_vin: string
  parent_make: string
  parent_model: string
  parent_type: AssetType

  // Child Asset
  child_id: string
  child_vin: string
  child_make: string
  child_model: string
  child_type: AssetType

  // Relationship Info
  effective_from: string
  effective_to?: string
  notes?: string
}

// ============================================================================
// HELPER CONSTANTS & MAPPINGS
// ============================================================================

/**
 * Asset types organized by category for filtering
 */
export const ASSET_TYPES_BY_CATEGORY: Record<AssetCategory, AssetType[]> = {
  PASSENGER_VEHICLE: ['PASSENGER_CAR', 'SUV', 'PASSENGER_VAN'],
  LIGHT_COMMERCIAL: ['LIGHT_TRUCK', 'PICKUP_TRUCK', 'CARGO_VAN'],
  HEAVY_TRUCK: ['MEDIUM_DUTY_TRUCK', 'HEAVY_DUTY_TRUCK', 'DUMP_TRUCK'],
  TRACTOR: ['SEMI_TRACTOR', 'DAY_CAB_TRACTOR', 'SLEEPER_CAB_TRACTOR'],
  TRAILER: ['DRY_VAN_TRAILER', 'FLATBED_TRAILER', 'REFRIGERATED_TRAILER', 'LOWBOY_TRAILER', 'TANK_TRAILER'],
  HEAVY_EQUIPMENT: ['EXCAVATOR', 'BULLDOZER', 'BACKHOE', 'MOTOR_GRADER', 'WHEEL_LOADER', 'SKID_STEER', 'MOBILE_CRANE', 'TOWER_CRANE', 'FORKLIFT'],
  UTILITY_VEHICLE: ['BUCKET_TRUCK', 'SERVICE_BODY_TRUCK', 'MOBILE_WORKSHOP'],
  SPECIALTY_EQUIPMENT: ['GENERATOR', 'AIR_COMPRESSOR', 'WATER_PUMP', 'LIGHT_TOWER'],
  NON_POWERED: ['SHIPPING_CONTAINER', 'STORAGE_TRAILER', 'TOOLBOX_TRAILER']
}

/**
 * Asset types that support PTO (Power Take-Off) tracking
 */
export const PTO_CAPABLE_TYPES: AssetType[] = [
  'EXCAVATOR',
  'BULLDOZER',
  'BACKHOE',
  'MOTOR_GRADER',
  'WHEEL_LOADER',
  'SKID_STEER',
  'GENERATOR',
  'WATER_PUMP',
  'AIR_COMPRESSOR'
]

/**
 * Display labels for asset categories
 */
export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  PASSENGER_VEHICLE: 'Passenger Vehicles',
  LIGHT_COMMERCIAL: 'Light Commercial',
  HEAVY_TRUCK: 'Heavy Trucks',
  TRACTOR: 'Tractors',
  TRAILER: 'Trailers',
  HEAVY_EQUIPMENT: 'Heavy Equipment',
  UTILITY_VEHICLE: 'Utility Vehicles',
  SPECIALTY_EQUIPMENT: 'Specialty Equipment',
  NON_POWERED: 'Non-Powered Assets'
}

/**
 * Display labels for asset types
 */
export const ASSET_TYPE_LABELS: Partial<Record<AssetType, string>> = {
  // Passenger Vehicles
  PASSENGER_CAR: 'Passenger Car',
  SUV: 'SUV',
  PASSENGER_VAN: 'Passenger Van',

  // Light Commercial
  LIGHT_TRUCK: 'Light Truck',
  PICKUP_TRUCK: 'Pickup Truck',
  CARGO_VAN: 'Cargo Van',

  // Heavy Trucks
  MEDIUM_DUTY_TRUCK: 'Medium Duty Truck',
  HEAVY_DUTY_TRUCK: 'Heavy Duty Truck',
  DUMP_TRUCK: 'Dump Truck',

  // Tractors
  SEMI_TRACTOR: 'Semi Tractor',
  DAY_CAB_TRACTOR: 'Day Cab Tractor',
  SLEEPER_CAB_TRACTOR: 'Sleeper Cab Tractor',

  // Trailers
  DRY_VAN_TRAILER: 'Dry Van Trailer',
  FLATBED_TRAILER: 'Flatbed Trailer',
  REFRIGERATED_TRAILER: 'Refrigerated Trailer',
  LOWBOY_TRAILER: 'Lowboy Trailer',
  TANK_TRAILER: 'Tank Trailer',

  // Heavy Equipment
  EXCAVATOR: 'Excavator',
  BULLDOZER: 'Bulldozer',
  BACKHOE: 'Backhoe',
  MOTOR_GRADER: 'Motor Grader',
  WHEEL_LOADER: 'Wheel Loader',
  SKID_STEER: 'Skid Steer',
  MOBILE_CRANE: 'Mobile Crane',
  TOWER_CRANE: 'Tower Crane',
  FORKLIFT: 'Forklift',

  // Utility Vehicles
  BUCKET_TRUCK: 'Bucket Truck',
  SERVICE_BODY_TRUCK: 'Service Body Truck',
  MOBILE_WORKSHOP: 'Mobile Workshop',

  // Specialty Equipment
  GENERATOR: 'Generator',
  AIR_COMPRESSOR: 'Air Compressor',
  WATER_PUMP: 'Water Pump',
  LIGHT_TOWER: 'Light Tower',

  // Non-Powered
  SHIPPING_CONTAINER: 'Shipping Container',
  STORAGE_TRAILER: 'Storage Trailer',
  TOOLBOX_TRAILER: 'Toolbox Trailer',

  OTHER: 'Other'
}

/**
 * Display labels for power types
 */
export const POWER_TYPE_LABELS: Record<PowerType, string> = {
  SELF_POWERED: 'Self-Powered',
  TOWED: 'Towed',
  STATIONARY: 'Stationary',
  PORTABLE: 'Portable'
}

/**
 * Display labels for operational status
 */
export const OPERATIONAL_STATUS_LABELS: Record<OperationalStatus, string> = {
  AVAILABLE: 'Available',
  IN_USE: 'In Use',
  MAINTENANCE: 'Maintenance',
  RESERVED: 'Reserved'
}

/**
 * Display labels for usage metrics
 */
export const USAGE_METRIC_LABELS: Record<UsageMetric, string> = {
  ODOMETER: 'Odometer (miles)',
  ENGINE_HOURS: 'Engine Hours',
  PTO_HOURS: 'PTO Hours',
  AUX_HOURS: 'Auxiliary Hours',
  CYCLES: 'Cycles',
  CALENDAR: 'Calendar Time'
}

/**
 * Display labels for relationship types
 */
export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  TOWS: 'Tows',
  ATTACHED: 'Attached',
  CARRIES: 'Carries',
  POWERS: 'Powers',
  CONTAINS: 'Contains'
}

// ============================================================================
// ADDITIONAL INTERFACES
// ============================================================================

/**
 * Asset Filters - For filtering vehicle/asset lists
 */
export interface AssetFilters {
  asset_category?: AssetCategory
  asset_type?: AssetType
  power_type?: PowerType
  operational_status?: OperationalStatus
  primary_metric?: UsageMetric
  is_road_legal?: boolean
  requires_cdl?: boolean
  location_id?: string
  group_id?: string
  fleet_id?: string
  department?: string
  region?: string
  search?: string
  page?: number
  limit?: number
}

/**
 * Create Asset Relationship Request
 */
export interface CreateAssetRelationshipRequest {
  parent_asset_id: string
  child_asset_id: string
  relationship_type: RelationshipType
  effective_from?: string
  effective_to?: string
  notes?: string
}

/**
 * Update Asset Relationship Request
 */
export interface UpdateAssetRelationshipRequest {
  relationship_type?: RelationshipType
  effective_from?: string
  effective_to?: string
  notes?: string
}

/**
 * Equipment Summary by Type
 */
export interface EquipmentSummary {
  asset_category: AssetCategory
  asset_type: AssetType
  total_count: number
  available_count: number
  in_use_count: number
  maintenance_count: number
  avg_odometer?: number
  avg_engine_hours?: number
  avg_pto_hours?: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper function to check if asset type requires heavy equipment fields
 */
export function requiresHeavyEquipmentFields(category?: AssetCategory): boolean {
  return category === 'HEAVY_EQUIPMENT'
}

/**
 * Helper function to check if asset type supports PTO tracking
 */
export function supportsPTOTracking(assetType?: AssetType): boolean {
  return assetType ? PTO_CAPABLE_TYPES.indexOf(assetType) !== -1 : false
}

/**
 * Helper function to get filtered asset types for a category
 */
export function getAssetTypesForCategory(category?: AssetCategory): AssetType[] {
  return category ? ASSET_TYPES_BY_CATEGORY[category] || [] : []
}

/**
 * Helper function to get display label for asset category
 */
export function getAssetCategoryLabel(category?: AssetCategory): string {
  return category ? ASSET_CATEGORY_LABELS[category] : 'Unknown'
}

/**
 * Helper function to get display label for asset type
 */
export function getAssetTypeLabel(assetType?: AssetType): string {
  return assetType ? ASSET_TYPE_LABELS[assetType] || assetType : 'Unknown'
}

/**
 * Helper function to get display label for operational status
 */
export function getOperationalStatusLabel(status?: OperationalStatus): string {
  return status ? OPERATIONAL_STATUS_LABELS[status] : 'Unknown'
}
