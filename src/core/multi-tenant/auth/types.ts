/**
 * Authentication Types for Fleet Management System
 * Centralized type definitions for authentication and authorization
 */

// Base user information from Okta
export interface OktaUserInfo {
  sub: string;
  name?: string;
  email: string;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  zoneinfo?: string;
  groups?: string[];
  department?: string;
  org?: string;
  employee_id?: string;
  employeeNumber?: string;
  amr?: string[]; // Authentication methods reference (for MFA detection)
}

// Enhanced user profile with fleet-specific data
export interface FleetUserProfile {
  // Core identity
  sub: string;
  name: string;
  email: string;
  preferred_username: string;

  // Organization info
  department: string;
  employee_id?: string;
  division?: string;
  cost_center?: string;

  // Fleet-specific attributes
  driver_license?: string;
  license_expiry?: Date;
  cdl_endorsed?: boolean;
  emergency_certified?: boolean;

  // Authorization
  roles: string[];
  permissions: string[];
  groups: string[];

  // Security
  mfa_enabled: boolean;
  security_clearance?: 'public' | 'sensitive' | 'confidential';

  // Session info
  last_login?: Date;
  session_start?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// Authentication state
export interface AuthenticationState {
  user: FleetUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  permissions: string[];
  roles: string[];
  sessionId: string | null;
  mfaRequired: boolean;
  loginMethod: 'okta' | 'azure' | 'local' | null;
}

// Login credentials
export interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
  mfaCode?: string;
}

// Role definitions
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

// Permission record definitions (database model)
export interface PermissionRecord {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

// JWT token payload
export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  session_id: string;
}

// Session information
export interface SessionInfo {
  id: string;
  user_id: string;
  created_at: Date;
  last_activity: Date;
  expires_at: Date;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
}

// Authentication configuration
export interface AuthConfig {
  okta: {
    clientId: string;
    issuer: string;
    redirectUri: string;
    scopes: string[];
  };
  azure: {
    clientId: string;
    authority: string;
    redirectUri: string;
    scopes: string[];
  };
  session: {
    timeout: number;
    refreshThreshold: number;
  };
  security: {
    requireMFA: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
}

// Fleet-specific permissions
export const FLEET_PERMISSIONS = {
  // Vehicle management
  VEHICLE_VIEW: 'vehicle:view',
  VEHICLE_CREATE: 'vehicle:create',
  VEHICLE_UPDATE: 'vehicle:update',
  VEHICLE_DELETE: 'vehicle:delete',
  VEHICLE_ASSIGN: 'vehicle:assign',

  // Driver management
  DRIVER_VIEW: 'driver:view',
  DRIVER_CREATE: 'driver:create',
  DRIVER_UPDATE: 'driver:update',
  DRIVER_DELETE: 'driver:delete',

  // Maintenance
  MAINTENANCE_VIEW: 'maintenance:view',
  MAINTENANCE_CREATE: 'maintenance:create',
  MAINTENANCE_UPDATE: 'maintenance:update',
  MAINTENANCE_DELETE: 'maintenance:delete',
  MAINTENANCE_SCHEDULE: 'maintenance:schedule',

  // Reports and analytics
  REPORTS_VIEW: 'reports:view',
  REPORTS_CREATE: 'reports:create',
  REPORTS_EXPORT: 'reports:export',
  ANALYTICS_VIEW: 'analytics:view',

  // Administration
  ADMIN_USERS: 'admin:users',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_PERMISSIONS: 'admin:permissions',
  ADMIN_SYSTEM: 'admin:system',

  // Emergency
  EMERGENCY_ALERT: 'emergency:alert',
  EMERGENCY_RESPONSE: 'emergency:response'
} as const;

// Fleet roles
export const FLEET_ROLES = {
  SUPER_ADMIN: 'super_admin',
  FLEET_ADMIN: 'fleet_admin',
  FLEET_MANAGER: 'fleet_manager',
  DISPATCHER: 'dispatcher',
  DRIVER: 'driver',
  MECHANIC: 'mechanic',
  VIEWER: 'viewer'
} as const;

// Government Role enum for role-based access control
export enum GovernmentRole {
  SUPER_ADMIN = 'super_admin',
  FLEET_ADMIN = 'fleet_admin',
  FLEET_MANAGER = 'fleet_manager',
  FLEET_SUPERVISOR = 'fleet_supervisor',
  DISPATCHER = 'dispatcher',
  DRIVER = 'driver',
  MECHANIC = 'mechanic',
  SAFETY_OFFICER = 'safety_officer',
  AUDITOR = 'auditor',
  VIEWER = 'viewer'
}

// Audit Event Types for compliance and security logging
export enum AuditEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  SESSION_EXTENDED = 'session_extended',
  SESSION_EXPIRED = 'session_expired',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  PERMISSION_CHANGED = 'permission_changed',
  ROLE_CHANGED = 'role_changed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  PASSWORD_CHANGED = 'password_changed',
  DATA_ACCESS = 'data_access',
  DATA_MODIFIED = 'data_modified',
  DATA_DELETED = 'data_deleted',
  SECURITY_ALERT = 'security_alert',
  COMPLIANCE_VIOLATION = 'compliance_violation'
}

// Permission enum for permission-based access control
export enum Permission {
  // Fleet view permissions
  FLEET_VIEW_ALL = 'fleet:view:all',
  FLEET_VIEW_ASSIGNED = 'fleet:view:assigned',

  // Vehicle management
  VEHICLE_VIEW = 'vehicle:view',
  VEHICLE_CREATE = 'vehicle:create',
  VEHICLE_UPDATE = 'vehicle:update',
  VEHICLE_DELETE = 'vehicle:delete',
  VEHICLE_ASSIGN = 'vehicle:assign',

  // Driver management
  DRIVER_VIEW = 'driver:view',
  DRIVER_CREATE = 'driver:create',
  DRIVER_UPDATE = 'driver:update',
  DRIVER_DELETE = 'driver:delete',

  // Maintenance
  MAINTENANCE_VIEW = 'maintenance:view',
  MAINTENANCE_CREATE = 'maintenance:create',
  MAINTENANCE_UPDATE = 'maintenance:update',
  MAINTENANCE_DELETE = 'maintenance:delete',
  MAINTENANCE_SCHEDULE = 'maintenance:schedule',

  // Reports and analytics
  REPORTS_VIEW = 'reports:view',
  REPORTS_CREATE = 'reports:create',
  REPORTS_EXPORT = 'reports:export',
  ANALYTICS_VIEW = 'analytics:view',

  // Administration
  ADMIN_USERS = 'admin:users',
  ADMIN_ROLES = 'admin:roles',
  ADMIN_PERMISSIONS = 'admin:permissions',
  ADMIN_SYSTEM = 'admin:system',

  // Emergency
  EMERGENCY_ALERT = 'emergency:alert',
  EMERGENCY_RESPONSE = 'emergency:response'
}

// Type guards
export function isFleetUserProfile(obj: any): obj is FleetUserProfile {
  return obj && typeof obj.sub === 'string' && typeof obj.email === 'string';
}

export function isAuthenticationState(obj: any): obj is AuthenticationState {
  return obj && typeof obj.isAuthenticated === 'boolean';
}

export function hasPermission(user: FleetUserProfile | null, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false;
}

export function hasRole(user: FleetUserProfile | null, role: string): boolean {
  return user?.roles.includes(role) ?? false;
}

export function hasAnyRole(user: FleetUserProfile | null, roles: string[]): boolean {
  return roles.some(role => hasRole(user, role));
}

export function hasAllPermissions(user: FleetUserProfile | null, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}
