import { z } from 'zod';

import { emailSchema, phoneSchema, uuidSchema } from './common.schema';

/**
 * Comprehensive Zod validation schemas for Users
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Users represent system users with authentication, profiles, and preferences.
 * This schema complements auth.schema.ts with full user management capabilities.
 */

// User role enum
const userRoleEnum = z.enum([
  'viewer',
  'driver',
  'dispatcher',
  'supervisor',
  'manager',
  'admin',
  'super_admin'
]);

// User status enum
const userStatusEnum = z.enum([
  'active',
  'inactive',
  'pending',
  'suspended',
  'locked',
  'deleted'
]);

// Department enum
const departmentEnum = z.enum([
  'operations',
  'maintenance',
  'dispatch',
  'administration',
  'management',
  'safety',
  'compliance',
  'it',
  'other'
]);

/**
 * Base user schema with all fields
 * Represents the complete user entity from database
 */
export const userSchema = z.object({
  /** Unique user identifier */
  id: uuidSchema,

  /** User email address (unique, required for login) */
  email: emailSchema,

  /** User's first name */
  first_name: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less')
    .trim(),

  /** User's last name */
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less')
    .trim(),

  /** User's role in the system */
  role: userRoleEnum,

  /** User account status */
  status: userStatusEnum,

  /** User's department */
  department: departmentEnum.nullable().optional(),

  /** User's job title */
  job_title: z.string()
    .max(100, 'Job title must be 100 characters or less')
    .trim()
    .nullable()
    .optional(),

  /** User's phone number */
  phone: phoneSchema.nullable().optional(),

  /** User's mobile number */
  mobile: phoneSchema.nullable().optional(),

  /** Profile photo URL */
  photo_url: z.string()
    .url('Invalid photo URL')
    .max(500, 'Photo URL must be 500 characters or less')
    .nullable()
    .optional(),

  /** User's timezone (IANA timezone identifier) */
  timezone: z.string()
    .max(50, 'Timezone must be 50 characters or less')
    .default('America/New_York'),

  /** User's locale (language/region code) */
  locale: z.string()
    .max(10, 'Locale must be 10 characters or less')
    .default('en-US'),

  /** Email verification status */
  email_verified: z.boolean().default(false),

  /** Email verified timestamp */
  email_verified_at: z.coerce.date().nullable().optional(),

  /** Multi-factor authentication enabled */
  mfa_enabled: z.boolean().default(false),

  /** MFA method (if enabled) */
  mfa_method: z.enum(['totp', 'sms', 'email']).nullable().optional(),

  /** Last successful login timestamp */
  last_login_at: z.coerce.date().nullable().optional(),

  /** Last login IP address */
  last_login_ip: z.string()
    .ip()
    .nullable()
    .optional(),

  /** Failed login attempts counter */
  failed_login_attempts: z.number()
    .int()
    .nonnegative()
    .default(0),

  /** Account locked until timestamp */
  locked_until: z.coerce.date().nullable().optional(),

  /** Password last changed timestamp */
  password_changed_at: z.coerce.date().nullable().optional(),

  /** Force password change on next login */
  force_password_change: z.boolean().default(false),

  /** User notification preferences */
  notification_preferences: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
    in_app: z.boolean().default(true),
  }).optional(),

  /** User-specific settings and preferences */
  preferences: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional(),

  /** Additional user metadata */
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional(),

  /** Associated driver ID (if user is a driver) */
  driver_id: uuidSchema.nullable().optional(),

  /** User's supervisor/manager ID */
  supervisor_id: uuidSchema.nullable().optional(),

  /** Record creation timestamp */
  created_at: z.coerce.date(),

  /** Record last update timestamp */
  updated_at: z.coerce.date(),

  /** Record soft deletion timestamp */
  deleted_at: z.coerce.date().nullable().optional(),
}).strict();

/**
 * User creation schema
 * POST /users
 * Omits auto-generated fields (id, timestamps)
 */
export const userCreateSchema = userSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
  email_verified: true,
  email_verified_at: true,
  last_login_at: true,
  last_login_ip: true,
  failed_login_attempts: true,
  locked_until: true,
  password_changed_at: true,
}).extend({
  /** Password required on creation */
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be 128 characters or less')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  /** Send welcome email */
  send_welcome_email: z.boolean().default(true),
}).strict();

/**
 * User update schema
 * PUT/PATCH /users/:id
 * Partial updates allowed, timestamp fields excluded
 */
export const userUpdateSchema = userSchema.omit({
  id: true,
  email: true, // Email changes require separate verification flow
  created_at: true,
  updated_at: true,
  deleted_at: true,
  email_verified: true,
  email_verified_at: true,
  last_login_at: true,
  last_login_ip: true,
  failed_login_attempts: true,
  locked_until: true,
  password_changed_at: true,
}).partial().strict();

/**
 * User query/filter schema
 * GET /users
 */
export const userQuerySchema = z.object({
  /** Pagination: page number */
  page: z.coerce.number().int().positive().default(1),

  /** Pagination: items per page */
  limit: z.coerce.number().int().positive().max(500).default(50),

  /** Filter by role */
  role: userRoleEnum.optional(),

  /** Filter by status */
  status: userStatusEnum.optional(),

  /** Filter by department */
  department: departmentEnum.optional(),

  /** Filter by email verification status */
  email_verified: z.coerce.boolean().optional(),

  /** Filter by MFA enabled status */
  mfa_enabled: z.coerce.boolean().optional(),

  /** Filter by supervisor ID */
  supervisor_id: uuidSchema.optional(),

  /** Search by name or email */
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  /** Filter by creation date range */
  created_after: z.coerce.date().optional(),
  created_before: z.coerce.date().optional(),

  /** Filter by last login date range */
  last_login_after: z.coerce.date().optional(),
  last_login_before: z.coerce.date().optional(),

  /** Sort field */
  sort: z.enum([
    'first_name',
    'last_name',
    'email',
    'role',
    'status',
    'department',
    'created_at',
    'updated_at',
    'last_login_at'
  ]).default('created_at'),

  /** Sort order */
  order: z.enum(['asc', 'desc']).default('desc'),
}).refine(data => {
  if (data.created_after && data.created_before) {
    return data.created_after <= data.created_before;
  }
  return true;
}, {
  message: 'created_after must be before or equal to created_before'
}).refine(data => {
  if (data.last_login_after && data.last_login_before) {
    return data.last_login_after <= data.last_login_before;
  }
  return true;
}, {
  message: 'last_login_after must be before or equal to last_login_before'
});

/**
 * User ID parameter schema
 * For route parameters like /users/:id
 */
export const userIdSchema = z.object({
  id: uuidSchema
});

/**
 * Bulk user status update schema
 */
export const userBulkStatusUpdateSchema = z.object({
  user_ids: z.array(uuidSchema)
    .min(1, 'At least one user ID is required')
    .max(100, 'Maximum 100 users can be updated at once'),
  status: userStatusEnum,
  reason: z.string()
    .max(500, 'Reason must be 500 characters or less')
    .optional(),
});

/**
 * User role assignment schema
 */
export const userRoleAssignmentSchema = z.object({
  user_id: uuidSchema,
  role: userRoleEnum,
  reason: z.string()
    .max(500, 'Reason must be 500 characters or less')
    .optional(),
});

/**
 * User password reset (admin-initiated) schema
 */
export const userPasswordResetSchema = z.object({
  user_id: uuidSchema,
  force_password_change: z.boolean().default(true),
  send_notification: z.boolean().default(true),
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
export type UserId = z.infer<typeof userIdSchema>;
export type UserBulkStatusUpdate = z.infer<typeof userBulkStatusUpdateSchema>;
export type UserRoleAssignment = z.infer<typeof userRoleAssignmentSchema>;
export type UserPasswordReset = z.infer<typeof userPasswordResetSchema>;
export type UserRole = z.infer<typeof userRoleEnum>;
export type UserStatus = z.infer<typeof userStatusEnum>;
export type Department = z.infer<typeof departmentEnum>;
