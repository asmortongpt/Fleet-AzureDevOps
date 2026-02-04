/**
 * Tire Management System Types
 * Complete type definitions for tire lifecycle tracking
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum TireStatus {
  IN_STOCK = 'in-stock',
  MOUNTED = 'mounted',
  RETREADED = 'retreaded',
  SCRAPPED = 'scrapped'
}

export enum TireType {
  STEER = 'steer',
  DRIVE = 'drive',
  TRAILER = 'trailer',
  ALL_POSITION = 'all-position'
}

export enum TirePosition {
  LF = 'LF',    // Left Front
  RF = 'RF',    // Right Front
  LR1 = 'LR1',  // Left Rear 1 (outer dual)
  LR2 = 'LR2',  // Left Rear 2 (inner dual)
  RR1 = 'RR1',  // Right Rear 1 (outer dual)
  RR2 = 'RR2',  // Right Rear 2 (inner dual)
  SPARE = 'spare'
}

export enum RemovalReason {
  ROTATION = 'rotation',
  BLOWOUT = 'blowout',
  WEAR = 'wear',
  DAMAGE = 'damage',
  SEASONAL_SWAP = 'seasonal-swap',
  RETREADING = 'retreading',
  END_OF_LIFE = 'end-of-life'
}

export enum RotationPattern {
  FRONT_TO_REAR = 'front-to-rear',
  CROSS = 'cross',
  REARWARD_CROSS = 'rearward-cross',
  FIVE_TIRE = 'five-tire',
  SIDE_TO_SIDE = 'side-to-side'
}

export enum PressureLogSource {
  MANUAL = 'manual',
  TPMS = 'tpms',
  INSPECTION = 'inspection'
}

// ============================================================================
// TIRE INVENTORY
// ============================================================================

export interface TireInventory {
  id: string;
  tenant_id: string;
  tire_number: string;
  manufacturer: string;
  model: string;
  size: string; // e.g., "295/75R22.5"
  load_range?: string; // e.g., "G", "H"
  tire_type: TireType;
  tread_depth_32nds: number; // measured in 32nds of an inch
  dot_number?: string;
  manufacture_date?: Date;
  purchase_date?: Date;
  purchase_price?: number;
  vendor_id?: string;
  warranty_miles?: number;
  expected_life_miles?: number;
  status: TireStatus;
  facility_id?: string;
  location_in_warehouse?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTireInventoryInput {
  tire_number: string;
  manufacturer: string;
  model: string;
  size: string;
  load_range?: string;
  tire_type: TireType;
  tread_depth_32nds?: number;
  dot_number?: string;
  manufacture_date?: Date;
  purchase_date?: Date;
  purchase_price?: number;
  vendor_id?: string;
  warranty_miles?: number;
  expected_life_miles?: number;
  facility_id?: string;
  location_in_warehouse?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTireInventoryInput {
  tread_depth_32nds?: number;
  status?: TireStatus;
  facility_id?: string;
  location_in_warehouse?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// VEHICLE TIRE POSITIONS
// ============================================================================

export interface VehicleTirePosition {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  tire_id: string;
  position: string;
  mounted_date: Date;
  mounted_odometer: number;
  mounted_by?: string;
  removed_date?: Date;
  removed_odometer?: number;
  removed_by?: string;
  removal_reason?: RemovalReason;
  is_current: boolean;
  miles_on_tire?: number; // calculated field
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface MountTireInput {
  tire_id: string;
  position: string;
  mounted_date?: Date;
  mounted_odometer: number;
  mounted_by?: string;
  metadata?: Record<string, any>;
}

export interface UnmountTireInput {
  position: string;
  removed_date?: Date;
  removed_odometer: number;
  removed_by?: string;
  removal_reason: RemovalReason;
}

export interface RotateTiresInput {
  rotation_date?: Date;
  rotation_odometer: number;
  rotated_by?: string;
  rotation_pattern: RotationPattern;
  position_mappings: Array<{
    from_position: string;
    to_position: string;
  }>;
}

// ============================================================================
// TIRE INSPECTIONS
// ============================================================================

export interface TirePositionInspection {
  position: string;
  tire_id: string;
  tread_depth: number; // in 32nds
  psi: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  issues?: string[];
}

export interface TireDefect {
  position: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
}

export interface TireInspection {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  inspection_date: Date;
  inspector_id?: string;
  odometer_reading: number;
  tire_positions: TirePositionInspection[];
  defects_found: boolean;
  defects?: TireDefect[];
  work_order_id?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface CreateTireInspectionInput {
  vehicle_id: string;
  inspection_date?: Date;
  inspector_id?: string;
  odometer_reading: number;
  tire_positions: TirePositionInspection[];
  defects?: TireDefect[];
  work_order_id?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// TIRE ROTATION SCHEDULES
// ============================================================================

export interface TireRotationSchedule {
  id: string;
  tenant_id: string;
  vehicle_id?: string;
  vehicle_type?: string;
  interval_miles: number;
  rotation_pattern: RotationPattern;
  last_rotation_date?: Date;
  last_rotation_odometer?: number;
  next_rotation_odometer?: number;
  alert_threshold_percentage: number;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRotationScheduleInput {
  vehicle_id?: string;
  vehicle_type?: string;
  interval_miles: number;
  rotation_pattern: RotationPattern;
  alert_threshold_percentage?: number;
  metadata?: Record<string, any>;
}

export interface UpdateRotationScheduleInput {
  interval_miles?: number;
  rotation_pattern?: RotationPattern;
  alert_threshold_percentage?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface RotationAlert {
  vehicle_id: string;
  vehicle_name?: string;
  current_odometer: number;
  next_rotation_odometer: number;
  miles_overdue?: number;
  alert_level: 'info' | 'warning' | 'critical';
  schedule: TireRotationSchedule;
}

// ============================================================================
// TIRE PRESSURE LOGS
// ============================================================================

export interface TirePositionPressure {
  position: string;
  tire_id?: string;
  psi: number;
  temp_f?: number;
}

export interface PressureAlert {
  position: string;
  alert_type: 'low_pressure' | 'high_pressure' | 'high_temperature';
  threshold: number;
  actual: number;
  severity: 'warning' | 'critical';
}

export interface TirePressureLog {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  log_date: Date;
  tire_positions: TirePositionPressure[];
  checked_by?: string;
  source: PressureLogSource;
  alerts_triggered?: PressureAlert[];
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface CreatePressureLogInput {
  vehicle_id: string;
  log_date?: Date;
  tire_positions: TirePositionPressure[];
  checked_by?: string;
  source?: PressureLogSource;
  metadata?: Record<string, any>;
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

export interface TireAnalytics {
  tire_id: string;
  tire_number: string;
  total_miles: number;
  cost_per_mile: number;
  average_tread_wear_rate: number; // 32nds per 1000 miles
  expected_remaining_miles: number;
  actual_life_percentage: number; // compared to expected_life_miles
  rotation_count: number;
  inspection_count: number;
  defect_count: number;
  last_inspection_date?: Date;
  last_tread_depth?: number;
  current_vehicle_id?: string;
  current_position?: string;
}

export interface VehicleTireStatus {
  vehicle_id: string;
  vehicle_name?: string;
  current_tires: Array<{
    position: string;
    tire_id: string;
    tire_number: string;
    tread_depth_32nds: number;
    miles_on_position: number;
    status: 'good' | 'fair' | 'needs_attention' | 'replace_soon';
  }>;
  next_rotation_due: number;
  miles_until_rotation: number;
  last_inspection_date?: Date;
  alerts: TireAlert[];
}

export interface TireAlert {
  type: 'low_tread' | 'low_pressure' | 'overdue_rotation' | 'overdue_inspection' | 'uneven_wear';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  affected_positions?: string[];
  recommended_action: string;
}

export interface TireCostAnalysis {
  total_tire_cost: number;
  total_miles_driven: number;
  average_cost_per_mile: number;
  tire_count: number;
  tires_by_status: Record<TireStatus, number>;
  premature_failures: number; // tires scrapped before 80% expected life
  warranty_claims_available: number;
  potential_warranty_value: number;
  cost_optimization_recommendations: string[];
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface TireInventoryQuery {
  status?: TireStatus;
  tire_type?: TireType;
  manufacturer?: string;
  facility_id?: string;
  min_tread_depth?: number;
  max_tread_depth?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TireInspectionQuery {
  vehicle_id?: string;
  inspector_id?: string;
  defects_only?: boolean;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  pageSize?: number;
}

export interface TireRotationQuery {
  vehicle_id?: string;
  vehicle_type?: string;
  overdue_only?: boolean;
  active_only?: boolean;
  alert_level?: 'info' | 'warning' | 'critical';
}
