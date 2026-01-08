import { z } from 'zod';

import { uuidSchema } from './common.schema';

/**
 * Comprehensive Zod validation schemas for Audit Logs
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Audit logging system for compliance, security, and troubleshooting.
 * Tracks all system changes, user actions, and security events with full context.
 */

// Action type enum
const actionTypeEnum = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'login_failed',
  'password_change',
  'password_reset',
  'email_change',
  'permission_grant',
  'permission_revoke',
  'role_assign',
  'role_remove',
  'export',
  'import',
  'approve',
  'reject',
  'assign',
  'unassign',
  'activate',
  'deactivate',
  'suspend',
  'restore',
  'archive',
  'download',
  'upload',
  'share',
  'access',
  'modify_settings',
  'api_call',
  'webhook',
  'system_event',
  'error',
  'warning',
  'other'
]);

// Severity level enum
const severityLevelEnum = z.enum([
  'debug',
  'info',
  'notice',
  'warning',
  'error',
  'critical',
  'alert',
  'emergency'
]);

// Resource/entity type enum
const entityTypeEnum = z.enum([
  'user',
  'role',
  'permission',
  'vehicle',
  'driver',
  'route',
  'work_order',
  'maintenance',
  'inspection',
  'incident',
  'facility',
  'geofence',
  'asset',
  'vendor',
  'notification',
  'api_key',
  'setting',
  'report',
  'export',
  'import',
  'session',
  'webhook',
  'system',
  'other'
]);

// Result/outcome enum
const resultEnum = z.enum([
  'success',
  'failure',
  'partial',
  'pending',
  'blocked',
  'unauthorized',
  'forbidden',
  'error'
]);

/**
 * Base audit log schema
 */
export const auditLogSchema = z.object({
  /** Unique audit log identifier */
  id: uuidSchema,

  /** User who performed the action (null for system actions) */
  user_id: uuidSchema.nullable().optional(),

  /** User's email at time of action */
  user_email: z.string()
    .email()
    .max(255)
    .nullable()
    .optional(),

  /** User's role at time of action */
  user_role: z.string()
    .max(50)
    .nullable()
    .optional(),

  /** Action performed */
  action: actionTypeEnum,

  /** Entity/resource type affected */
  entity_type: entityTypeEnum,

  /** Entity ID affected */
  entity_id: uuidSchema.nullable().optional(),

  /** Human-readable description of the action */
  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be 1000 characters or less')
    .trim(),

  /** Severity level of the event */
  severity: severityLevelEnum.default('info'),

  /** Action result/outcome */
  result: resultEnum,

  /** Old values before change (JSON snapshot) */
  old_values: z.record(
    z.string().max(100),
    z.any()
  ).nullable().optional(),

  /** New values after change (JSON snapshot) */
  new_values: z.record(
    z.string().max(100),
    z.any()
  ).nullable().optional(),

  /** Changed fields (array of field names) */
  changed_fields: z.array(z.string().max(100))
    .nullable()
    .optional(),

  /** Request method (GET, POST, PUT, DELETE, etc.) */
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
    .nullable()
    .optional(),

  /** Request URL/endpoint */
  url: z.string()
    .max(2048, 'URL too long')
    .nullable()
    .optional(),

  /** HTTP status code */
  status_code: z.number()
    .int()
    .min(100)
    .max(599)
    .nullable()
    .optional(),

  /** Client IP address */
  ip_address: z.string()
    .ip()
    .nullable()
    .optional(),

  /** User agent string */
  user_agent: z.string()
    .max(500, 'User agent too long')
    .nullable()
    .optional(),

  /** Session ID */
  session_id: uuidSchema.nullable().optional(),

  /** API key ID (if action performed via API) */
  api_key_id: uuidSchema.nullable().optional(),

  /** Request ID for correlation */
  request_id: z.string()
    .max(100, 'Request ID too long')
    .nullable()
    .optional(),

  /** Correlation ID for tracking related actions */
  correlation_id: z.string()
    .max(100, 'Correlation ID too long')
    .nullable()
    .optional(),

  /** Error message (if result is failure/error) */
  error_message: z.string()
    .max(2000, 'Error message too long')
    .nullable()
    .optional(),

  /** Error stack trace (for debugging) */
  error_stack: z.string()
    .max(10000, 'Error stack too long')
    .nullable()
    .optional(),

  /** Action duration in milliseconds */
  duration_ms: z.number()
    .int()
    .nonnegative()
    .nullable()
    .optional(),

  /** Geographic location (city, country, etc.) */
  location: z.object({
    city: z.string().max(100).optional(),
    region: z.string().max(100).optional(),
    country: z.string().max(2).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).nullable().optional(),

  /** Additional metadata for context */
  metadata: z.record(
    z.string().max(100),
    z.any()
  ).optional(),

  /** Tags for categorization and search */
  tags: z.array(z.string().max(50))
    .max(20)
    .nullable()
    .optional(),

  /** Compliance/regulatory flags */
  compliance_flags: z.array(z.string().max(50))
    .max(10)
    .nullable()
    .optional(),

  /** Retention policy (days to keep, null = default) */
  retention_days: z.number()
    .int()
    .positive()
    .max(3650)
    .nullable()
    .optional(),

  /** Record creation timestamp */
  created_at: z.coerce.date(),

  /** Record indexed timestamp (for search) */
  indexed_at: z.coerce.date().nullable().optional(),
}).strict();

/**
 * Audit log creation schema
 * POST /audit-logs
 */
export const auditLogCreateSchema = auditLogSchema.omit({
  id: true,
  created_at: true,
  indexed_at: true,
}).extend({
  /** Auto-capture IP from request */
  auto_capture_ip: z.boolean().default(true),

  /** Auto-capture user agent from request */
  auto_capture_user_agent: z.boolean().default(true),
}).strict();

/**
 * Audit log query schema
 * GET /audit-logs
 */
export const auditLogQuerySchema = z.object({
  /** Pagination: page number */
  page: z.coerce.number().int().positive().default(1),

  /** Pagination: items per page */
  limit: z.coerce.number().int().positive().max(500).default(50),

  /** Filter by user ID */
  user_id: uuidSchema.optional(),

  /** Filter by user email */
  user_email: z.string().email().optional(),

  /** Filter by action type */
  action: actionTypeEnum.optional(),

  /** Filter by multiple action types */
  actions: z.array(actionTypeEnum).optional(),

  /** Filter by entity type */
  entity_type: entityTypeEnum.optional(),

  /** Filter by entity ID */
  entity_id: uuidSchema.optional(),

  /** Filter by severity level */
  severity: severityLevelEnum.optional(),

  /** Filter by minimum severity (inclusive) */
  min_severity: severityLevelEnum.optional(),

  /** Filter by result */
  result: resultEnum.optional(),

  /** Filter by multiple results */
  results: z.array(resultEnum).optional(),

  /** Filter by HTTP method */
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),

  /** Filter by status code */
  status_code: z.coerce.number().int().optional(),

  /** Filter by IP address */
  ip_address: z.string().ip().optional(),

  /** Filter by session ID */
  session_id: uuidSchema.optional(),

  /** Filter by API key ID */
  api_key_id: uuidSchema.optional(),

  /** Filter by request ID */
  request_id: z.string().max(100).optional(),

  /** Filter by correlation ID */
  correlation_id: z.string().max(100).optional(),

  /** Filter by tags (match any) */
  tags: z.array(z.string().max(50)).optional(),

  /** Filter by compliance flags */
  compliance_flags: z.array(z.string().max(50)).optional(),

  /** Filter by date range */
  created_after: z.coerce.date().optional(),
  created_before: z.coerce.date().optional(),

  /** Filter by duration range (milliseconds) */
  min_duration_ms: z.coerce.number().int().nonnegative().optional(),
  max_duration_ms: z.coerce.number().int().nonnegative().optional(),

  /** Search in description and error messages */
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  /** Include system-generated logs */
  include_system: z.coerce.boolean().default(true),

  /** Sort field */
  sort: z.enum([
    'created_at',
    'severity',
    'duration_ms',
    'status_code'
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
  if (data.min_duration_ms !== undefined && data.max_duration_ms !== undefined) {
    return data.min_duration_ms <= data.max_duration_ms;
  }
  return true;
}, {
  message: 'min_duration_ms must be less than or equal to max_duration_ms'
});

/**
 * Audit log statistics schema
 * GET /audit-logs/statistics
 */
export const auditLogStatisticsQuerySchema = z.object({
  /** Statistics time range */
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),

  /** Group by field */
  group_by: z.enum([
    'action',
    'entity_type',
    'user',
    'result',
    'severity',
    'hour',
    'day',
    'week',
    'month'
  ]).default('day'),

  /** Filter by user ID */
  user_id: uuidSchema.optional(),

  /** Filter by entity type */
  entity_type: entityTypeEnum.optional(),

  /** Filter by action type */
  action: actionTypeEnum.optional(),
}).refine(data => {
  return data.start_date <= data.end_date;
}, {
  message: 'start_date must be before or equal to end_date'
});

/**
 * Audit log export schema
 */
export const auditLogExportSchema = z.object({
  /** Export format */
  format: z.enum(['json', 'csv', 'xlsx', 'pdf']).default('csv'),

  /** Query filters (same as query schema) */
  filters: auditLogQuerySchema.omit({ page: true, limit: true, sort: true, order: true }).optional(),

  /** Include columns */
  columns: z.array(z.string().max(50)).optional(),

  /** Date range for export */
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),

  /** Timezone for timestamps */
  timezone: z.string().max(50).default('UTC'),
}).refine(data => {
  return data.start_date <= data.end_date;
}, {
  message: 'start_date must be before or equal to end_date'
});

/**
 * Audit log retention policy schema
 */
export const auditLogRetentionPolicySchema = z.object({
  /** Policy ID */
  id: uuidSchema,

  /** Policy name */
  name: z.string()
    .min(1, 'Policy name is required')
    .max(100, 'Policy name must be 100 characters or less')
    .trim(),

  /** Entity types this policy applies to */
  entity_types: z.array(entityTypeEnum)
    .min(1, 'At least one entity type is required'),

  /** Severity levels this policy applies to */
  severity_levels: z.array(severityLevelEnum)
    .min(1, 'At least one severity level is required'),

  /** Retention period in days */
  retention_days: z.number()
    .int()
    .positive()
    .max(3650, 'Maximum retention is 10 years (3650 days)'),

  /** Archive logs instead of deleting */
  archive: z.boolean().default(false),

  /** Archive storage location */
  archive_location: z.string()
    .max(500, 'Archive location too long')
    .nullable()
    .optional(),

  /** Policy is active */
  is_active: z.boolean().default(true),

  /** Record creation timestamp */
  created_at: z.coerce.date(),

  /** Record last update timestamp */
  updated_at: z.coerce.date(),
}).strict();

/**
 * Audit log ID parameter schema
 */
export const auditLogIdSchema = z.object({
  id: uuidSchema
});

// Type exports
export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditLogCreate = z.infer<typeof auditLogCreateSchema>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
export type AuditLogStatisticsQuery = z.infer<typeof auditLogStatisticsQuerySchema>;
export type AuditLogExport = z.infer<typeof auditLogExportSchema>;
export type AuditLogRetentionPolicy = z.infer<typeof auditLogRetentionPolicySchema>;
export type AuditLogId = z.infer<typeof auditLogIdSchema>;

export type ActionType = z.infer<typeof actionTypeEnum>;
export type SeverityLevel = z.infer<typeof severityLevelEnum>;
export type EntityType = z.infer<typeof entityTypeEnum>;
export type Result = z.infer<typeof resultEnum>;
