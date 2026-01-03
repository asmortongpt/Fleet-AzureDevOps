// Core Type Definitions for Fleet Management System

import { Request } from 'express';
import { QueryResult as PgQueryResult } from 'pg';

// ============================================================================
// User and Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  tenant_id: string;
  is_active: boolean;
  phone?: string;
  password_hash: string;
  failed_login_attempts: number;
  account_locked_until: Date | null;
  last_login_at: Date | null;
  team_vehicle_ids: string[] | null;
  team_driver_ids: string[] | null;
  vehicle_id: string | null;
  driver_id: string | null;
  scope_level: ScopeLevel;
  created_at: Date;
  updated_at: Date;
}

export type UserRole = 'admin' | 'fleet_manager' | 'driver' | 'technician' | 'viewer';
export type ScopeLevel = 'own' | 'team' | 'fleet' | 'global';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: UserRole;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  tenant_id: string;
  iat?: number;
  exp?: number;
}

// ============================================================================
// Vehicle Types
// ============================================================================

export interface Vehicle {
  id: string;
  tenant_id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  status: VehicleStatus;
  operational_status?: string;
  odometer: number;
  driver_id: string | null;
  is_active: boolean;
  asset_category?: string;
  asset_type?: string;
  power_type?: string;
  primary_metric?: string;
  is_road_legal?: boolean;
  location_id?: string;
  group_id?: string;
  fleet_id?: string;
  created_at: Date;
  updated_at: Date;

  // Extended properties for emulators and advanced features
  isElectric?: boolean;
  batteryCapacity?: number;
  features?: string[];
  location?: { lat: number; lng: number };
  driverId?: string;
}

export type VehicleStatus = 'active' | 'maintenance' | 'inactive' | 'retired' | 'sold';

export interface CreateVehicleRequest {
  vin: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  status?: VehicleStatus;
  odometer?: number;
  driver_id?: string;
  asset_category?: string;
  asset_type?: string;
  power_type?: string;
}

export interface UpdateVehicleRequest {
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  status?: VehicleStatus;
  odometer?: number;
  driver_id?: string;
}

// ============================================================================
// Driver Types
// ============================================================================

export interface Driver {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_expiry: Date;
  status: DriverStatus;
  is_active: boolean;
  certification_status?: string;
  certification_type?: string;
  certification_expiry?: Date;
  certified_by?: string;
  certified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export type DriverStatus = 'active' | 'inactive' | 'suspended';

export interface CreateDriverRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_expiry: Date;
  status?: DriverStatus;
}

// ============================================================================
// Maintenance Types
// ============================================================================

export interface MaintenanceRecord {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  type: MaintenanceType;
  description: string;
  scheduled_date: Date;
  completed_date: Date | null;
  status: MaintenanceStatus;
  cost: number;
  odometer: number;
  technician: string;
  notes: string;
  created_at: Date;
  updated_at: Date;
}

export type MaintenanceType = 'routine' | 'repair' | 'inspection' | 'recall' | 'other';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceSchedule {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  service_type: string;
  interval_miles?: number;
  interval_days?: number;
  last_service_date?: Date;
  last_service_miles?: number;
  next_service_date?: Date;
  next_service_miles?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiError {
  error: string;
  code?: string;
  details?: ErrorDetails;
  timestamp: string;
  attempts_remaining?: number;
  locked_until?: Date;
}

export interface ErrorDetails {
  message?: string;
  field?: string;
  [key: string]: unknown;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// ============================================================================
// Database Query Types
// ============================================================================

export interface QueryResult<T> extends PgQueryResult<T> {
  rows: T[];
  rowCount: number;
}

export type SqlValue = string | number | boolean | Date | null | undefined;
export type SqlParams = SqlValue[];

export interface BuildInsertResult {
  columnNames: string;
  placeholders: string;
  values: SqlValue[];
}

export interface BuildUpdateResult {
  fields: string;
  values: SqlValue[];
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface AuditLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: AuditAction;
  resource_type: string;
  resource_id: string | null;
  changes: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  status?: 'success' | 'failure';
  failure_reason?: string;
  created_at: Date;
}

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'CERTIFY';

// ============================================================================
// Tenant Types
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug?: string;
  domain?: string;
  is_active: boolean;
  settings?: TenantSettings;
  created_at: Date;
  updated_at: Date;
}

export interface TenantSettings {
  timezone?: string;
  currency?: string;
  date_format?: string;
  language?: string;
  features?: string[];
  [key: string]: unknown;
}

// ============================================================================
// Document and Attachment Types
// ============================================================================

export interface Attachment {
  id: string;
  tenant_id: string;
  resource_type: string;
  resource_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  category?: string;
  tags?: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Mobile Device Types
// ============================================================================

export interface MobileDevice {
  id: string;
  tenant_id: string;
  user_id: string;
  device_token: string;
  platform: 'ios' | 'android';
  os_version?: string;
  app_version?: string;
  device_model?: string;
  is_active: boolean;
  last_active_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  data?: Record<string, unknown>;
  read_at?: Date;
  sent_at?: Date;
  scheduled_for?: Date;
  created_at: Date;
  updated_at: Date;
}

export type NotificationType =
  | 'maintenance_due'
  | 'inspection_due'
  | 'vehicle_assignment'
  | 'driver_assignment'
  | 'alert'
  | 'message'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: ServiceStatus;
}

export interface ServiceStatus {
  database: ComponentStatus;
  redis?: ComponentStatus;
  storage?: ComponentStatus;
  [key: string]: ComponentStatus | undefined;
}

export interface ComponentStatus {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  message?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Error Types
// ============================================================================

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: ErrorDetails;
  isOperational?: boolean;
}

export interface ValidationError extends AppError {
  field: string;
  value: unknown;
  constraint: string;
}

// ============================================================================
// Query Filter Types
// ============================================================================

export interface QueryFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface DateRangeFilter {
  start_date?: Date;
  end_date?: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Awaitable<T> = T | Promise<T>;

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
