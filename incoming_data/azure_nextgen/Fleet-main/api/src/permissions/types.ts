/**
 * RBAC Permission System Types
 * Defines types for role-based access control with field-level redaction
 */

export type UserRole =
  | 'Admin'
  | 'FleetManager'
  | 'MaintenanceManager'
  | 'Inspector'
  | 'Driver'
  | 'Finance'
  | 'Safety'
  | 'Auditor'
  | 'Vendor';

export interface User {
  id: string;
  email: string;
  name?: string;
  org_id: string;
  roles: UserRole[];
  depot_id?: string;
  tenantId?: string;
}

export interface PermissionContext {
  user: User;
  resource?: any;
  resourceType?: string;
  action?: string;
  org_id?: string;
  depot_id?: string;
  created_by?: string;
  assigned_user?: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  conditions?: string[];
}

export interface ModuleConfig {
  name: string;
  description: string;
  roles: UserRole[];
}

export interface ActionConfig {
  description: string;
  roles: UserRole[];
  conditions: string[];
}

export interface FieldVisibilityRule {
  roles?: UserRole[];
  redact_for_others?: boolean;
  redact_for?: UserRole[];
  anonymize_for?: UserRole[];
  summary_for?: UserRole[];
}

export interface FieldConfig {
  always_visible?: string[];
  [fieldName: string]: string[] | FieldVisibilityRule | undefined;
}

export interface PermissionConfig {
  modules: Record<string, ModuleConfig>;
  actions: Record<string, ActionConfig>;
  fields: Record<string, FieldConfig>;
}

export interface RoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  org_id?: string;
  granted_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

export interface AuditLogEntry {
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  allowed: boolean;
  reason?: string;
  timestamp: Date;
  context?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface PermissionEvaluationContext {
  user: User;
  action: string;
  resource?: any;
  resourceType?: string;
  conditions?: Record<string, any>;
}

export interface VisibleModulesResult {
  modules: string[];
  moduleConfigs: Record<string, ModuleConfig>;
}

export interface FieldFilterResult {
  filteredData: any;
  redactedFields: string[];
  anonymizedFields: string[];
}

export interface RecordFilterOptions {
  user: User;
  resourceType: string;
  baseConditions?: Record<string, any>;
}

/**
 * Condition evaluation helpers
 */
export interface ConditionEvaluator {
  evaluate(condition: string, context: PermissionContext): boolean;
}

/**
 * Permission engine interface
 */
export interface IPermissionEngine {
  can(user: User, action: string, resource?: any, context?: any): Promise<PermissionCheckResult>;
  visibleModules(user: User): Promise<VisibleModulesResult>;
  applyRecordFilter(query: any, user: User, resourceType: string): Promise<any>;
  filterFields(user: User, resourceType: string, payload: any): Promise<FieldFilterResult>;
}

/**
 * Role database model
 */
export interface RoleModel {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * User role database model
 */
export interface UserRoleModel {
  id: string;
  user_id: string;
  role_id: string;
  org_id?: string;
  granted_at: Date;
  expires_at?: Date;
  is_active: boolean;
  assigned_by?: string;
}

/**
 * Permission audit log database model
 */
export interface PermissionAuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  allowed: boolean;
  reason?: string;
  timestamp: Date;
  context?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}
