import { z } from 'zod';

import { uuidSchema } from './common.schema';

/**
 * Comprehensive Zod validation schemas for Roles & Permissions
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Role-Based Access Control (RBAC) system for fine-grained permissions management.
 * Supports hierarchical roles, resource-based permissions, and dynamic access control.
 */

// Resource types that can be protected by permissions
const resourceTypeEnum = z.enum([
  'vehicles',
  'drivers',
  'routes',
  'work_orders',
  'maintenance',
  'inspections',
  'incidents',
  'facilities',
  'geofences',
  'assets',
  'vendors',
  'users',
  'roles',
  'permissions',
  'reports',
  'analytics',
  'settings',
  'api_keys',
  'audit_logs',
  'notifications',
  'communications',
  'fuel_transactions',
  'telemetry',
  'all' // Special wildcard for system-wide permissions
]);

// Action types for permissions
const actionEnum = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'list',
  'export',
  'import',
  'approve',
  'reject',
  'assign',
  'manage', // Full CRUD + special actions
  'admin'   // Full access including configuration
]);

// Permission effect (allow/deny)
const effectEnum = z.enum(['allow', 'deny']);

// Role type
const roleTypeEnum = z.enum([
  'system',    // Built-in system roles (cannot be deleted)
  'custom',    // User-defined custom roles
  'temporary'  // Temporary roles with expiration
]);

/**
 * Permission schema
 * Individual permission definition
 */
export const permissionSchema = z.object({
  /** Unique permission identifier */
  id: uuidSchema,

  /** Permission name/code (unique, lowercase, snake_case) */
  name: z.string()
    .min(3, 'Permission name must be at least 3 characters')
    .max(100, 'Permission name must be 100 characters or less')
    .regex(/^[a-z][a-z0-9_]*$/, 'Permission name must be lowercase letters, numbers, and underscores only')
    .trim(),

  /** Human-readable permission description */
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less')
    .trim(),

  /** Resource type this permission applies to */
  resource: resourceTypeEnum,

  /** Action allowed by this permission */
  action: actionEnum,

  /** Effect of the permission (allow/deny) */
  effect: effectEnum.default('allow'),

  /** Conditions for permission application (JSON) */
  conditions: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean(), z.array(z.string())])
  ).optional(),

  /** System-defined permission (cannot be modified) */
  is_system: z.boolean().default(false),

  /** Permission is active */
  is_active: z.boolean().default(true),

  /** Record creation timestamp */
  created_at: z.coerce.date(),

  /** Record last update timestamp */
  updated_at: z.coerce.date(),
}).strict();

/**
 * Role schema
 * Role definition with associated permissions
 */
export const roleSchema = z.object({
  /** Unique role identifier */
  id: uuidSchema,

  /** Role name (unique) */
  name: z.string()
    .min(3, 'Role name must be at least 3 characters')
    .max(100, 'Role name must be 100 characters or less')
    .trim(),

  /** Role code (unique, lowercase, snake_case) */
  code: z.string()
    .min(3, 'Role code must be at least 3 characters')
    .max(50, 'Role code must be 50 characters or less')
    .regex(/^[a-z][a-z0-9_]*$/, 'Role code must be lowercase letters, numbers, and underscores only')
    .trim(),

  /** Human-readable role description */
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional(),

  /** Role type */
  type: roleTypeEnum.default('custom'),

  /** Parent role ID (for role hierarchy) */
  parent_role_id: uuidSchema.nullable().optional(),

  /** Role level (0 = highest, higher numbers = lower privilege) */
  level: z.number()
    .int('Level must be an integer')
    .nonnegative('Level must be non-negative')
    .max(100, 'Level exceeds maximum')
    .default(10),

  /** Permission IDs assigned to this role */
  permission_ids: z.array(uuidSchema).default([]),

  /** Role expiration timestamp (for temporary roles) */
  expires_at: z.coerce.date().nullable().optional(),

  /** Maximum number of users allowed with this role */
  max_users: z.number()
    .int('Max users must be an integer')
    .positive('Max users must be positive')
    .nullable()
    .optional(),

  /** Role is active */
  is_active: z.boolean().default(true),

  /** Additional role metadata */
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional(),

  /** Record creation timestamp */
  created_at: z.coerce.date(),

  /** Record last update timestamp */
  updated_at: z.coerce.date(),

  /** Record soft deletion timestamp */
  deleted_at: z.coerce.date().nullable().optional(),
}).strict();

/**
 * Permission creation schema
 * POST /permissions
 */
export const permissionCreateSchema = permissionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).strict();

/**
 * Permission update schema
 * PUT/PATCH /permissions/:id
 */
export const permissionUpdateSchema = permissionSchema.omit({
  id: true,
  name: true, // Name cannot be changed after creation
  is_system: true, // System flag cannot be changed
  created_at: true,
  updated_at: true,
}).partial().strict();

/**
 * Permission query schema
 * GET /permissions
 */
export const permissionQuerySchema = z.object({
  /** Pagination: page number */
  page: z.coerce.number().int().positive().default(1),

  /** Pagination: items per page */
  limit: z.coerce.number().int().positive().max(500).default(100),

  /** Filter by resource type */
  resource: resourceTypeEnum.optional(),

  /** Filter by action */
  action: actionEnum.optional(),

  /** Filter by effect */
  effect: effectEnum.optional(),

  /** Filter by active status */
  is_active: z.coerce.boolean().optional(),

  /** Filter by system permission */
  is_system: z.coerce.boolean().optional(),

  /** Search by name or description */
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  /** Sort field */
  sort: z.enum(['name', 'resource', 'action', 'created_at']).default('name'),

  /** Sort order */
  order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Role creation schema
 * POST /roles
 */
export const roleCreateSchema = roleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
}).extend({
  /** Permission codes to assign (alternative to permission_ids) */
  permission_codes: z.array(z.string()).optional(),
}).strict();

/**
 * Role update schema
 * PUT/PATCH /roles/:id
 */
export const roleUpdateSchema = roleSchema.omit({
  id: true,
  code: true, // Code cannot be changed after creation
  type: true, // Type cannot be changed after creation
  created_at: true,
  updated_at: true,
  deleted_at: true,
}).partial().extend({
  /** Permission codes to assign (alternative to permission_ids) */
  permission_codes: z.array(z.string()).optional(),
}).strict();

/**
 * Role query schema
 * GET /roles
 */
export const roleQuerySchema = z.object({
  /** Pagination: page number */
  page: z.coerce.number().int().positive().default(1),

  /** Pagination: items per page */
  limit: z.coerce.number().int().positive().max(500).default(50),

  /** Filter by role type */
  type: roleTypeEnum.optional(),

  /** Filter by active status */
  is_active: z.coerce.boolean().optional(),

  /** Filter by parent role */
  parent_role_id: uuidSchema.optional(),

  /** Filter by level range */
  min_level: z.coerce.number().int().nonnegative().optional(),
  max_level: z.coerce.number().int().nonnegative().optional(),

  /** Search by name, code, or description */
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  /** Include expired roles */
  include_expired: z.coerce.boolean().default(false),

  /** Sort field */
  sort: z.enum(['name', 'code', 'level', 'created_at']).default('name'),

  /** Sort order */
  order: z.enum(['asc', 'desc']).default('asc'),
}).refine(data => {
  if (data.min_level !== undefined && data.max_level !== undefined) {
    return data.min_level <= data.max_level;
  }
  return true;
}, {
  message: 'min_level must be less than or equal to max_level'
});

/**
 * Role-Permission assignment schema
 */
export const rolePermissionAssignmentSchema = z.object({
  /** Role ID */
  role_id: uuidSchema,

  /** Permission IDs to assign */
  permission_ids: z.array(uuidSchema)
    .min(1, 'At least one permission ID is required')
    .max(100, 'Maximum 100 permissions can be assigned at once'),

  /** Replace existing permissions (true) or add to existing (false) */
  replace: z.boolean().default(false),
});

/**
 * User-Role assignment schema
 */
export const userRoleAssignmentSchema = z.object({
  /** User ID */
  user_id: uuidSchema,

  /** Role IDs to assign */
  role_ids: z.array(uuidSchema)
    .min(1, 'At least one role ID is required')
    .max(10, 'Maximum 10 roles can be assigned to a user'),

  /** Replace existing roles (true) or add to existing (false) */
  replace: z.boolean().default(false),

  /** Assignment expiration (for temporary assignments) */
  expires_at: z.coerce.date()
    .refine(date => date > new Date(), {
      message: 'Expiration date must be in the future'
    })
    .optional(),

  /** Reason for assignment */
  reason: z.string()
    .max(500, 'Reason must be 500 characters or less')
    .optional(),
});

/**
 * Permission check schema
 * Check if user has specific permission
 */
export const permissionCheckSchema = z.object({
  /** User ID to check */
  user_id: uuidSchema,

  /** Resource to check access for */
  resource: resourceTypeEnum,

  /** Action to check permission for */
  action: actionEnum,

  /** Optional context/conditions for the check */
  context: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional(),
});

/**
 * Bulk permission check schema
 */
export const bulkPermissionCheckSchema = z.object({
  /** User ID to check */
  user_id: uuidSchema,

  /** Permissions to check */
  checks: z.array(z.object({
    resource: resourceTypeEnum,
    action: actionEnum,
  }))
    .min(1, 'At least one permission check is required')
    .max(50, 'Maximum 50 permission checks allowed'),
});

/**
 * Permission ID parameter schema
 */
export const permissionIdSchema = z.object({
  id: uuidSchema
});

/**
 * Role ID parameter schema
 */
export const roleIdSchema = z.object({
  id: uuidSchema
});

// Type exports
export type Permission = z.infer<typeof permissionSchema>;
export type PermissionCreate = z.infer<typeof permissionCreateSchema>;
export type PermissionUpdate = z.infer<typeof permissionUpdateSchema>;
export type PermissionQuery = z.infer<typeof permissionQuerySchema>;
export type PermissionId = z.infer<typeof permissionIdSchema>;

export type Role = z.infer<typeof roleSchema>;
export type RoleCreate = z.infer<typeof roleCreateSchema>;
export type RoleUpdate = z.infer<typeof roleUpdateSchema>;
export type RoleQuery = z.infer<typeof roleQuerySchema>;
export type RoleId = z.infer<typeof roleIdSchema>;

export type RolePermissionAssignment = z.infer<typeof rolePermissionAssignmentSchema>;
export type UserRoleAssignment = z.infer<typeof userRoleAssignmentSchema>;
export type PermissionCheck = z.infer<typeof permissionCheckSchema>;
export type BulkPermissionCheck = z.infer<typeof bulkPermissionCheckSchema>;

export type ResourceType = z.infer<typeof resourceTypeEnum>;
export type Action = z.infer<typeof actionEnum>;
export type Effect = z.infer<typeof effectEnum>;
export type RoleType = z.infer<typeof roleTypeEnum>;
