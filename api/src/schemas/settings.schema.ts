import { z } from 'zod';

import { uuidSchema } from './common.schema';

/**
 * Comprehensive Zod validation schemas for Settings & Configuration
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * System and user settings for application configuration, preferences,
 * and customization. Supports hierarchical settings (system, organization, user).
 */

// Setting scope enum
const settingScopeEnum = z.enum([
  'system',       // System-wide settings (admin only)
  'organization', // Organization-level settings
  'user'          // User-specific settings
]);

// Setting type enum
const settingTypeEnum = z.enum([
  'string',
  'number',
  'boolean',
  'json',
  'enum',
  'email',
  'url',
  'color',
  'date',
  'datetime',
  'time',
  'file',
  'password'
]);

// Setting category enum
const settingCategoryEnum = z.enum([
  'general',
  'appearance',
  'notifications',
  'security',
  'integrations',
  'fleet',
  'maintenance',
  'dispatch',
  'compliance',
  'billing',
  'advanced',
  'developer'
]);

/**
 * Base setting schema
 */
export const settingSchema = z.object({
  /** Unique setting identifier */
  id: uuidSchema,

  /** Setting key (unique within scope) */
  key: z.string()
    .min(1, 'Setting key is required')
    .max(100, 'Setting key must be 100 characters or less')
    .regex(/^[a-z][a-z0-9_\.]*$/, 'Setting key must be lowercase letters, numbers, underscores, and dots')
    .trim(),

  /** Human-readable setting label */
  label: z.string()
    .min(1, 'Label is required')
    .max(255, 'Label must be 255 characters or less')
    .trim(),

  /** Setting description/help text */
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional(),

  /** Setting scope (system, organization, user) */
  scope: settingScopeEnum,

  /** Setting category for organization */
  category: settingCategoryEnum,

  /** Setting type */
  type: settingTypeEnum,

  /** Setting value (stored as JSON) */
  value: z.any(),

  /** Default value */
  default_value: z.any().nullable().optional(),

  /** Allowed values (for enum type) */
  allowed_values: z.array(z.any())
    .nullable()
    .optional(),

  /** Minimum value (for number type) */
  min_value: z.number().nullable().optional(),

  /** Maximum value (for number type) */
  max_value: z.number().nullable().optional(),

  /** Validation regex pattern */
  validation_pattern: z.string()
    .max(500, 'Validation pattern too long')
    .nullable()
    .optional(),

  /** User ID (for user-scoped settings) */
  user_id: uuidSchema.nullable().optional(),

  /** Organization ID (for organization-scoped settings) */
  organization_id: uuidSchema.nullable().optional(),

  /** Setting is required (cannot be null/empty) */
  is_required: z.boolean().default(false),

  /** Setting is encrypted in database */
  is_encrypted: z.boolean().default(false),

  /** Setting is read-only (cannot be modified via UI) */
  is_readonly: z.boolean().default(false),

  /** Setting is visible in UI */
  is_visible: z.boolean().default(true),

  /** Setting is public (visible to all users) */
  is_public: z.boolean().default(false),

  /** Setting requires restart to take effect */
  requires_restart: z.boolean().default(false),

  /** Setting group (for UI organization) */
  group: z.string()
    .max(100, 'Group must be 100 characters or less')
    .nullable()
    .optional(),

  /** Display order within category/group */
  display_order: z.number()
    .int()
    .nonnegative()
    .default(0),

  /** Tags for search and filtering */
  tags: z.array(z.string().max(50))
    .max(20)
    .nullable()
    .optional(),

  /** Additional metadata */
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional(),

  /** Record creation timestamp */
  created_at: z.coerce.date(),

  /** Record last update timestamp */
  updated_at: z.coerce.date(),

  /** User who last modified the setting */
  updated_by: uuidSchema.nullable().optional(),
}).strict();

/**
 * Setting creation schema
 * POST /settings
 */
export const settingCreateSchema = settingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  updated_by: true,
}).strict();

/**
 * Setting update schema
 * PUT/PATCH /settings/:id
 */
export const settingUpdateSchema = settingSchema.omit({
  id: true,
  key: true, // Key cannot be changed
  scope: true, // Scope cannot be changed
  created_at: true,
  updated_at: true,
  updated_by: true,
}).partial().strict();

/**
 * Setting value update schema (simple value change)
 * PATCH /settings/:key/value
 */
export const settingValueUpdateSchema = z.object({
  value: z.any(),
});

/**
 * Setting query schema
 * GET /settings
 */
export const settingQuerySchema = z.object({
  /** Pagination: page number */
  page: z.coerce.number().int().positive().default(1),

  /** Pagination: items per page */
  limit: z.coerce.number().int().positive().max(500).default(100),

  /** Filter by scope */
  scope: settingScopeEnum.optional(),

  /** Filter by category */
  category: settingCategoryEnum.optional(),

  /** Filter by type */
  type: settingTypeEnum.optional(),

  /** Filter by user ID */
  user_id: uuidSchema.optional(),

  /** Filter by organization ID */
  organization_id: uuidSchema.optional(),

  /** Filter by group */
  group: z.string().max(100).optional(),

  /** Filter by tags */
  tags: z.array(z.string().max(50)).optional(),

  /** Include encrypted settings (values will be masked) */
  include_encrypted: z.coerce.boolean().default(false),

  /** Include readonly settings */
  include_readonly: z.coerce.boolean().default(true),

  /** Only visible settings */
  visible_only: z.coerce.boolean().default(true),

  /** Search by key, label, or description */
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  /** Sort field */
  sort: z.enum([
    'key',
    'label',
    'category',
    'display_order',
    'created_at',
    'updated_at'
  ]).default('display_order'),

  /** Sort order */
  order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Bulk settings update schema
 */
export const settingBulkUpdateSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().max(100),
      value: z.any(),
    })
  )
    .min(1, 'At least one setting is required')
    .max(100, 'Maximum 100 settings can be updated at once'),

  /** Scope for all settings */
  scope: settingScopeEnum.optional(),

  /** User ID (for user-scoped settings) */
  user_id: uuidSchema.optional(),

  /** Organization ID (for organization-scoped settings) */
  organization_id: uuidSchema.optional(),
});

/**
 * Settings reset schema
 * POST /settings/reset
 */
export const settingResetSchema = z.object({
  /** Setting keys to reset (empty = reset all) */
  keys: z.array(z.string().max(100))
    .max(100, 'Maximum 100 settings can be reset at once')
    .optional(),

  /** Scope to reset */
  scope: settingScopeEnum.optional(),

  /** User ID (for user-scoped settings) */
  user_id: uuidSchema.optional(),

  /** Confirm reset action */
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm the reset action' })
  }),
});

/**
 * Settings export schema
 */
export const settingExportSchema = z.object({
  /** Export format */
  format: z.enum(['json', 'yaml', 'env', 'csv']).default('json'),

  /** Scope to export */
  scope: settingScopeEnum.optional(),

  /** Category to export */
  category: settingCategoryEnum.optional(),

  /** Include default values */
  include_defaults: z.boolean().default(false),

  /** Include metadata */
  include_metadata: z.boolean().default(false),

  /** Mask encrypted values */
  mask_encrypted: z.boolean().default(true),
});

/**
 * Settings import schema
 */
export const settingImportSchema = z.object({
  /** Import format */
  format: z.enum(['json', 'yaml', 'env']).default('json'),

  /** Settings data (JSON string or object) */
  data: z.union([
    z.string().max(1000000, 'Import data too large'),
    z.record(z.string(), z.any())
  ]),

  /** Target scope */
  scope: settingScopeEnum,

  /** User ID (for user-scoped settings) */
  user_id: uuidSchema.optional(),

  /** Organization ID (for organization-scoped settings) */
  organization_id: uuidSchema.optional(),

  /** Overwrite existing settings */
  overwrite: z.boolean().default(false),

  /** Validate only (don't import) */
  validate_only: z.boolean().default(false),
});

/**
 * Setting validation schema
 */
export const settingValidationSchema = z.object({
  /** Setting key */
  key: z.string().max(100),

  /** Setting type */
  type: settingTypeEnum,

  /** Value to validate */
  value: z.any(),

  /** Validation options */
  options: z.object({
    allowed_values: z.array(z.any()).optional(),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
    validation_pattern: z.string().optional(),
  }).optional(),
});

/**
 * Setting template schema
 * Predefined setting templates for quick setup
 */
export const settingTemplateSchema = z.object({
  /** Template ID */
  id: uuidSchema,

  /** Template name */
  name: z.string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be 100 characters or less')
    .trim(),

  /** Template description */
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .nullable()
    .optional(),

  /** Template category */
  category: settingCategoryEnum,

  /** Settings in this template */
  settings: z.array(settingCreateSchema)
    .min(1, 'At least one setting is required'),

  /** Template is active */
  is_active: z.boolean().default(true),

  /** Record creation timestamp */
  created_at: z.coerce.date(),

  /** Record last update timestamp */
  updated_at: z.coerce.date(),
}).strict();

/**
 * Setting ID parameter schema
 */
export const settingIdSchema = z.object({
  id: uuidSchema
});

/**
 * Setting key parameter schema
 */
export const settingKeySchema = z.object({
  key: z.string().max(100)
});

// Type exports
export type Setting = z.infer<typeof settingSchema>;
export type SettingCreate = z.infer<typeof settingCreateSchema>;
export type SettingUpdate = z.infer<typeof settingUpdateSchema>;
export type SettingValueUpdate = z.infer<typeof settingValueUpdateSchema>;
export type SettingQuery = z.infer<typeof settingQuerySchema>;
export type SettingBulkUpdate = z.infer<typeof settingBulkUpdateSchema>;
export type SettingReset = z.infer<typeof settingResetSchema>;
export type SettingExport = z.infer<typeof settingExportSchema>;
export type SettingImport = z.infer<typeof settingImportSchema>;
export type SettingValidation = z.infer<typeof settingValidationSchema>;
export type SettingTemplate = z.infer<typeof settingTemplateSchema>;
export type SettingId = z.infer<typeof settingIdSchema>;
export type SettingKey = z.infer<typeof settingKeySchema>;

export type SettingScope = z.infer<typeof settingScopeEnum>;
export type SettingType = z.infer<typeof settingTypeEnum>;
export type SettingCategory = z.infer<typeof settingCategoryEnum>;
