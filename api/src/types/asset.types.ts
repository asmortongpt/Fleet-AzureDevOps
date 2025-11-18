/**
 * Multi-Asset Vehicle Type Definitions
 * Created: 2025-11-17
 * Migration: 032_multi_asset_vehicle_extensions.sql
 *
 * Extends the Fleet Management System to support heavy equipment, trailers,
 * tractors, specialty equipment, and non-powered assets beyond passenger vehicles.
 */

// ============================================================================
// ENUMS - Matching PostgreSQL CHECK constraints from migration 032
// ============================================================================

/**
 * Asset Category - Top-level asset classification
 */
export enum AssetCategory {
  PASSENGER_VEHICLE = 'PASSENGER_VEHICLE',
  HEAVY_EQUIPMENT = 'HEAVY_EQUIPMENT',
  TRAILER = 'TRAILER',
  TRACTOR = 'TRACTOR',
  SPECIALTY = 'SPECIALTY',
  NON_POWERED = 'NON_POWERED'
}

/**
 * Asset Type - Specific type within a category
 */
export enum AssetType {
  // Passenger Vehicles
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  TRUCK = 'TRUCK',
  VAN = 'VAN',

  // Heavy Equipment
  EXCAVATOR = 'EXCAVATOR',
  BULLDOZER = 'BULLDOZER',
  LOADER = 'LOADER',
  BACKHOE = 'BACKHOE',
  GRADER = 'GRADER',
  ROLLER = 'ROLLER',
  CRANE = 'CRANE',
  FORKLIFT = 'FORKLIFT',

  // Trailers
  FLATBED = 'FLATBED',
  ENCLOSED = 'ENCLOSED',
  DUMP = 'DUMP',
  LOWBOY = 'LOWBOY',
  REFRIGERATED = 'REFRIGERATED',

  // Tractors
  FARM_TRACTOR = 'FARM_TRACTOR',
  ROAD_TRACTOR = 'ROAD_TRACTOR',

  // Specialty
  GENERATOR = 'GENERATOR',
  COMPRESSOR = 'COMPRESSOR',
  PUMP = 'PUMP',
  WELDER = 'WELDER',

  // Other
  OTHER = 'OTHER'
}

/**
 * Power Type - How the asset is powered
 */
export enum PowerType {
  SELF_POWERED = 'SELF_POWERED',
  TOWED = 'TOWED',
  CARRIED = 'CARRIED',
  STATIONARY = 'STATIONARY',
  MANUAL = 'MANUAL'
}

/**
 * Operational Status - Current operational state
 */
export enum OperationalStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

/**
 * Primary Metric - Which metric is primary for this asset
 */
export enum PrimaryMetric {
  ODOMETER = 'ODOMETER',
  ENGINE_HOURS = 'ENGINE_HOURS',
  PTO_HOURS = 'PTO_HOURS',
  AUX_HOURS = 'AUX_HOURS',
  CYCLES = 'CYCLES',
  CALENDAR = 'CALENDAR'
}

/**
 * Relationship Type - Type of asset-to-asset relationship
 */
export enum RelationshipType {
  TOWS = 'TOWS',
  ATTACHED = 'ATTACHED',
  CARRIES = 'CARRIES',
  POWERS = 'POWERS',
  CONTAINS = 'CONTAINS'
}

/**
 * Trigger Condition - Logic for multi-metric maintenance triggers
 */
export enum TriggerCondition {
  AND = 'AND',
  OR = 'OR'
}

// ============================================================================
// INTERFACES - Extended Vehicle Properties
// ============================================================================

/**
 * Multi-Metric Tracking - Metrics beyond odometer
 */
export interface MultiMetricTracking {
  /** Power Take-Off hours (for equipment with PTO) */
  pto_hours?: number

  /** Auxiliary power hours (generators, etc.) */
  aux_hours?: number

  /** Cycle count (for repetitive operations like compressors) */
  cycle_count?: number

  /** Which metric is considered primary */
  primary_metric: PrimaryMetric

  /** Last time any metric was updated */
  last_metric_update?: Date
}

/**
 * Equipment Specifications - Heavy equipment specific properties
 */
export interface EquipmentSpecifications {
  /** Lifting/loading capacity in tons */
  capacity_tons?: number

  /** Maximum reach in feet (cranes, excavators) */
  max_reach_feet?: number

  /** Maximum lift height in feet */
  lift_height_feet?: number

  /** Bucket capacity in cubic yards */
  bucket_capacity_yards?: number

  /** Operating weight in pounds */
  operating_weight_lbs?: number
}

/**
 * Trailer Specifications - Trailer specific properties
 */
export interface TrailerSpecifications {
  /** Number of axles */
  axle_count?: number

  /** Maximum payload in kg */
  max_payload_kg?: number

  /** Fuel tank capacity in liters (for refrigerated trailers) */
  tank_capacity_l?: number
}

/**
 * Equipment Capabilities - What the equipment can do
 */
export interface EquipmentCapabilities {
  /** Has Power Take-Off capability */
  has_pto: boolean

  /** Has auxiliary power output */
  has_aux_power: boolean

  /** Can be used on public roads */
  is_road_legal: boolean

  /** Requires CDL to operate */
  requires_cdl: boolean

  /** Requires special license/certification */
  requires_special_license: boolean

  /** Maximum speed in km/h (for road-legal equipment) */
  max_speed_kph?: number

  /** Off-road use only */
  is_off_road_only: boolean
}

/**
 * Asset Organization - How assets are grouped
 */
export interface AssetOrganization {
  /** Current operational status */
  operational_status: OperationalStatus

  /** Parent asset ID (for attachments, trailers) */
  parent_asset_id?: string

  /** Asset group ID */
  group_id?: string

  /** Fleet ID */
  fleet_id?: string

  /** Facility/location ID */
  location_id?: string
}

/**
 * Extended Vehicle - Complete multi-asset vehicle interface
 */
export interface ExtendedVehicle {
  // Base vehicle properties
  id: string
  tenant_id: string
  vin?: string
  make: string
  model: string
  year: number

  // Multi-asset categorization
  asset_category: AssetCategory
  asset_type: AssetType
  power_type: PowerType

  // Metrics
  odometer?: number
  engine_hours?: number
  multi_metric_tracking: MultiMetricTracking

  // Specifications
  equipment_specs?: EquipmentSpecifications
  trailer_specs?: TrailerSpecifications

  // Capabilities
  capabilities: EquipmentCapabilities

  // Organization
  organization: AssetOrganization

  // Standard fields
  status: string
  created_at: Date
  updated_at: Date
}

// ============================================================================
// ASSET RELATIONSHIPS
// ============================================================================

/**
 * Asset Relationship - Parent-child asset relationships
 */
export interface AssetRelationship {
  id: string
  parent_asset_id: string
  child_asset_id: string
  relationship_type: RelationshipType

  /** When this relationship became effective */
  effective_from: Date

  /** When this relationship ended (null = currently active) */
  effective_to?: Date

  /** User who created this relationship */
  created_by: string

  /** Optional notes about the relationship */
  notes?: string

  created_at: Date
  updated_at: Date
}

/**
 * Active Asset Combination - View data from vw_active_asset_combos
 */
export interface ActiveAssetCombination {
  relationship_id: string
  parent_asset_id: string
  parent_asset_name: string
  parent_asset_type: AssetType
  child_asset_id: string
  child_asset_name: string
  child_asset_type: AssetType
  relationship_type: RelationshipType
  effective_from: Date
  tenant_id: string
}

/**
 * Relationship History Entry
 */
export interface RelationshipHistoryEntry extends AssetRelationship {
  parent_asset_name: string
  child_asset_name: string
  created_by_name: string
}

// ============================================================================
// EQUIPMENT TELEMETRY
// ============================================================================

/**
 * Equipment Telemetry Event - Specialized telemetry for heavy equipment
 */
export interface EquipmentTelemetryEvent {
  id: string
  vehicle_id: string
  event_time: Date

  // Metrics
  engine_hours?: number
  pto_hours?: number
  aux_hours?: number
  cycle_count?: number

  // Equipment-specific sensors
  hydraulic_pressure_bar?: number
  boom_angle_degrees?: number
  load_weight_kg?: number

  // Operating parameters
  fuel_level_percent?: number
  coolant_temp_celsius?: number
  oil_pressure_bar?: number

  // Diagnostics
  fault_codes?: string[]
  warning_codes?: string[]

  // Location
  latitude?: number
  longitude?: number

  // Operator
  operator_id?: string

  tenant_id: string
  created_at: Date
}

// ============================================================================
// MULTI-METRIC MAINTENANCE
// ============================================================================

/**
 * Multi-Metric Maintenance Schedule
 */
export interface MultiMetricMaintenanceSchedule {
  id: string
  tenant_id: string
  vehicle_id: string
  service_type: string

  /** Which metric triggers this maintenance */
  trigger_metric: PrimaryMetric

  /** AND/OR logic for multiple metrics */
  trigger_condition?: TriggerCondition

  // Service intervals for different metrics
  service_interval_miles?: number
  service_interval_hours?: number
  service_interval_days?: number

  // PTO hours tracking
  last_service_pto_hours?: number
  next_service_due_pto_hours?: number

  // Aux hours tracking
  last_service_aux_hours?: number
  next_service_due_aux_hours?: number

  // Cycle tracking
  last_service_cycles?: number
  next_service_due_cycles?: number

  // Standard fields
  last_service_date?: Date
  last_service_odometer?: number
  next_service_due_date?: Date
  next_service_due_odometer?: number

  priority: string
  estimated_cost: number
  notes?: string
  status: string

  created_at: Date
  updated_at: Date
}

/**
 * Multi-Metric Maintenance Due - View data from vw_multi_metric_maintenance_due
 */
export interface MultiMetricMaintenanceDue {
  schedule_id: string
  vehicle_id: string
  vehicle_name: string
  asset_type: AssetType
  service_type: string
  trigger_metric: PrimaryMetric

  // Current values
  current_odometer?: number
  current_engine_hours?: number
  current_pto_hours?: number
  current_aux_hours?: number
  current_cycles?: number

  // Due values
  next_due_odometer?: number
  next_due_engine_hours?: number
  next_due_pto_hours?: number
  next_due_aux_hours?: number
  next_due_cycles?: number
  next_due_date?: Date

  /** How many units until due (based on trigger_metric) */
  units_until_due?: number

  /** Is this maintenance overdue? */
  is_overdue: boolean

  priority: string
  estimated_cost: number
  tenant_id: string
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

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
 * Vehicle Query Filters - Multi-asset filters
 */
export interface VehicleQueryFilters {
  asset_category?: AssetCategory
  asset_type?: AssetType
  power_type?: PowerType
  operational_status?: OperationalStatus
  primary_metric?: PrimaryMetric
  is_road_legal?: boolean
  location_id?: string
  group_id?: string
  fleet_id?: string
  page?: number
  limit?: number
}

/**
 * Maintenance Schedule Query Filters - Multi-metric filters
 */
export interface MaintenanceScheduleQueryFilters {
  trigger_metric?: PrimaryMetric
  vehicle_id?: string
  service_type?: string
  is_overdue?: boolean
  page?: number
  limit?: number
}

/**
 * Equipment by Type Summary - View data from vw_equipment_by_type
 */
export interface EquipmentByTypeSummary {
  tenant_id: string
  asset_category: AssetCategory
  asset_type: AssetType
  total_count: number
  available_count: number
  in_use_count: number
  maintenance_count: number
  avg_odometer: number
  avg_engine_hours: number
  avg_pto_hours: number
  total_maintenance_schedules: number
  overdue_maintenance_count: number
}
