/**
 * TypeScript types for Fleet Management System seed data
 * Generated from database schema in artifacts/system_map/db_schema.json
 */

// Enum types matching PostgreSQL enums
export type UserRole =
  | 'SuperAdmin'
  | 'Admin'
  | 'Manager'
  | 'Supervisor'
  | 'Driver'
  | 'Dispatcher'
  | 'Mechanic'
  | 'Viewer';

export type VehicleStatus =
  | 'active'
  | 'idle'
  | 'charging'
  | 'service'
  | 'emergency'
  | 'offline'
  | 'maintenance'
  | 'retired';

export type VehicleType =
  | 'sedan'
  | 'suv'
  | 'truck'
  | 'van'
  | 'bus'
  | 'emergency'
  | 'construction'
  | 'specialty';

export type DriverStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'terminated'
  | 'on_leave'
  | 'training';

export type FuelType =
  | 'gasoline'
  | 'diesel'
  | 'electric'
  | 'hybrid'
  | 'propane'
  | 'cng'
  | 'hydrogen';

export type MaintenanceType =
  | 'preventive'
  | 'corrective'
  | 'inspection'
  | 'recall'
  | 'upgrade';

export type Status =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold'
  | 'failed';

export type Priority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'emergency';

export type IncidentSeverity =
  | 'minor'
  | 'moderate'
  | 'major'
  | 'critical'
  | 'fatal';

export type InspectionType =
  | 'pre_trip'
  | 'post_trip'
  | 'annual'
  | 'dot'
  | 'safety'
  | 'emissions'
  | 'special';

export type CertificationStatus =
  | 'active'
  | 'expired'
  | 'pending'
  | 'suspended'
  | 'revoked';

// Database table types
export interface Tenant {
  id: string;
  name: string;
  subdomain: string | null;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Vehicle {
  id: string;
  tenant_id: string;
  vehicle_number: string;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  type: VehicleType | null;
  fuel_type: FuelType | null;
  status: VehicleStatus;
  license_plate: string | null;
  current_mileage: number | null;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: Date | null;
  assigned_driver_id: string | null;
  assigned_facility_id: string | null;
  model_3d_url: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Driver {
  id: string;
  tenant_id: string;
  user_id: string | null;
  employee_number: string | null;
  license_number: string;
  license_state: string | null;
  license_expiry: Date | null;
  status: DriverStatus;
  hire_date: Date | null;
  phone: string | null;
  email: string | null;
  safety_score: number;
  created_at: Date;
  updated_at: Date;
}

export interface Route {
  id: string;
  tenant_id: string;
  route_name: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  status: Status;
  route_type: string | null;
  start_location: string | null;
  end_location: string | null;
  planned_start_time: Date | null;
  planned_end_time: Date | null;
  actual_start_time: Date | null;
  actual_end_time: Date | null;
  total_distance: number | null;
  estimated_duration: number | null;
  actual_duration: number | null;
  waypoints: Record<string, any> | null;
  optimized_waypoints: Record<string, any> | null;
  route_geometry: Record<string, any> | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MaintenanceSchedule {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  type: MaintenanceType | null;
  description: string | null;
  scheduled_date: Date | null;
  completed_date: Date | null;
  status: Status;
  priority: Priority;
  assigned_mechanic_id: string | null;
  mileage_at_service: number | null;
  cost: number | null;
  work_order_id: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface FuelTransaction {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  driver_id: string | null;
  transaction_date: Date;
  gallons: number | null;
  cost_per_gallon: number | null;
  total_cost: number | null;
  fuel_type: FuelType | null;
  vendor: string | null;
  location: string | null;
  odometer: number | null;
  card_number_last_4: string | null;
  receipt_url: string | null;
  created_at: Date;
}

export interface Incident {
  id: string;
  tenant_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  incident_date: Date;
  severity: IncidentSeverity;
  type: string | null;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  injuries_count: number | null;
  fatalities_count: number | null;
  police_report_number: string | null;
  insurance_claim_number: string | null;
  status: Status;
  estimated_cost: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ComplianceRecord {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  certification_type: string;
  certification_number: string | null;
  issuing_authority: string | null;
  issue_date: Date | null;
  expiry_date: Date | null;
  status: CertificationStatus;
  document_url: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface WorkOrder {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  work_order_number: string;
  type: MaintenanceType;
  priority: Priority;
  status: Status;
  description: string | null;
  assigned_to: string | null;
  scheduled_start: Date | null;
  scheduled_end: Date | null;
  actual_start: Date | null;
  actual_end: Date | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

// Factory builder options
export interface FactoryOptions {
  seed?: string | number;
  overrides?: Record<string, any>;
}

// Seeder configuration
export interface SeedConfig {
  tenantCount: number;
  usersPerTenant: number;
  vehiclesPerTenant: number;
  driversPerTenant: number;
  routesPerVehicle: number;
  maintenancePerVehicle: number;
  fuelTransactionsPerVehicle: number;
  incidentsPerTenant: number;
  complianceRecordsPerEntity: number;
  workOrdersPerVehicle: number;
}
