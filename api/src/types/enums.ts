// Enum Type Definitions for Fleet Management System
// Using enums prevents typos and provides compile-time safety

// ============================================================================
// User and Authentication Enums
// ============================================================================

export enum UserRole {
  ADMIN = 'admin',
  FLEET_MANAGER = 'fleet_manager',
  DRIVER = 'driver',
  TECHNICIAN = 'technician',
  VIEWER = 'viewer'
}

export enum ScopeLevel {
  OWN = 'own',
  TEAM = 'team',
  FLEET = 'fleet',
  GLOBAL = 'global'
}

// ============================================================================
// Vehicle Enums
// ============================================================================

export enum VehicleStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
  RETIRED = 'retired',
  SOLD = 'sold'
}

export enum AssetCategory {
  VEHICLE = 'vehicle',
  EQUIPMENT = 'equipment',
  TRAILER = 'trailer',
  SPECIALTY = 'specialty'
}

export enum PowerType {
  GASOLINE = 'gasoline',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
  PLUG_IN_HYBRID = 'plug_in_hybrid',
  HYDROGEN = 'hydrogen',
  CNG = 'cng',
  PROPANE = 'propane'
}

export enum OperationalStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
  RESERVED = 'reserved'
}

// ============================================================================
// Driver Enums
// ============================================================================

export enum DriverStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  ON_LEAVE = 'on_leave'
}

export enum CertificationStatus {
  CERTIFIED = 'certified',
  PENDING = 'pending',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

// ============================================================================
// Maintenance Enums
// ============================================================================

export enum MaintenanceType {
  ROUTINE = 'routine',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  RECALL = 'recall',
  PREVENTIVE = 'preventive',
  EMERGENCY = 'emergency',
  OTHER = 'other'
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ============================================================================
// Audit and Security Enums
// ============================================================================

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  CERTIFY = 'CERTIFY',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT'
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PENDING = 'pending'
}

// ============================================================================
// Notification Enums
// ============================================================================

export enum NotificationType {
  MAINTENANCE_DUE = 'maintenance_due',
  INSPECTION_DUE = 'inspection_due',
  VEHICLE_ASSIGNMENT = 'vehicle_assignment',
  DRIVER_ASSIGNMENT = 'driver_assignment',
  ALERT = 'alert',
  MESSAGE = 'message',
  SYSTEM = 'system',
  WARNING = 'warning',
  ERROR = 'error'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook'
}

// ============================================================================
// Document Enums
// ============================================================================

export enum DocumentType {
  PDF = 'pdf',
  IMAGE = 'image',
  VIDEO = 'video',
  SPREADSHEET = 'spreadsheet',
  TEXT = 'text',
  OTHER = 'other'
}

export enum DocumentCategory {
  REGISTRATION = 'registration',
  INSURANCE = 'insurance',
  MAINTENANCE = 'maintenance',
  INSPECTION = 'inspection',
  LICENSE = 'license',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  REPORT = 'report',
  OTHER = 'other'
}

// ============================================================================
// Trip and Usage Enums
// ============================================================================

export enum TripType {
  BUSINESS = 'business',
  PERSONAL = 'personal',
  COMMUTE = 'commute',
  UNKNOWN = 'unknown'
}

export enum TripStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// ============================================================================
// Health and System Enums
// ============================================================================

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

export enum ServiceStatus {
  UP = 'up',
  DOWN = 'down',
  DEGRADED = 'degraded',
  UNKNOWN = 'unknown'
}

// ============================================================================
// Mobile Device Enums
// ============================================================================

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web'
}

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

// ============================================================================
// Fuel Enums
// ============================================================================

export enum FuelType {
  GASOLINE = 'gasoline',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  CNG = 'cng',
  PROPANE = 'propane',
  HYDROGEN = 'hydrogen'
}

export enum FuelTransactionType {
  PURCHASE = 'purchase',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment'
}

// ============================================================================
// Inspection Enums
// ============================================================================

export enum InspectionType {
  PRE_TRIP = 'pre_trip',
  POST_TRIP = 'post_trip',
  ANNUAL = 'annual',
  SAFETY = 'safety',
  EMISSIONS = 'emissions',
  CUSTOM = 'custom'
}

export enum InspectionStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  CONDITIONAL = 'conditional'
}

// ============================================================================
// Work Order Enums
// ============================================================================

export enum WorkOrderStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export enum WorkOrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency'
}

// ============================================================================
// Alert Enums
// ============================================================================

export enum AlertType {
  MAINTENANCE = 'maintenance',
  SAFETY = 'safety',
  COMPLIANCE = 'compliance',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  SYSTEM = 'system'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

// ============================================================================
// Charging Station Enums (EV)
// ============================================================================

export enum ChargingStationStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  OFFLINE = 'offline',
  FAULTED = 'faulted',
  RESERVED = 'reserved'
}

export enum ChargingSessionStatus {
  INITIATED = 'initiated',
  CHARGING = 'charging',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if a value is a valid enum value
 */
export function isEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] {
  return Object.values(enumObj).includes(value as string);
}

/**
 * Get all enum values as an array
 */
export function getEnumValues<T extends Record<string, string>>(enumObj: T): string[] {
  return Object.values(enumObj);
}

/**
 * Get all enum keys as an array
 */
export function getEnumKeys<T extends Record<string, string>>(enumObj: T): string[] {
  return Object.keys(enumObj);
}
