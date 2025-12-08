import { z } from 'zod';

import { uuidSchema } from './common.schema';

/**
 * Comprehensive Zod validation schemas for Notifications
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Notifications system for multi-channel messaging (email, SMS, push, in-app).
 * Supports templates, scheduling, delivery tracking, and user preferences.
 */

// Notification type enum
const notificationTypeEnum = z.enum([
  'info',
  'success',
  'warning',
  'error',
  'alert',
  'reminder',
  'system',
  'security'
]);

// Notification channel enum
const notificationChannelEnum = z.enum([
  'email',
  'sms',
  'push',
  'in_app',
  'webhook'
]);

// Notification priority enum
const notificationPriorityEnum = z.enum([
  'low',
  'normal',
  'high',
  'urgent',
  'critical'
]);

// Notification status enum
const notificationStatusEnum = z.enum([
  'pending',
  'queued',
  'sending',
  'sent',
  'delivered',
  'read',
  'failed',
  'cancelled'
]);

// Notification category enum
const notificationCategoryEnum = z.enum([
  'maintenance',
  'inspection',
  'incident',
  'work_order',
  'route',
  'fuel',
  'driver',
  'vehicle',
  'compliance',
  'safety',
  'system',
  'account',
  'other'
]);

/**
 * Base notification schema
 */
export const notificationSchema = z.object({
  /** Unique notification identifier */
  id: uuidSchema,

  /** Recipient user ID */
  user_id: uuidSchema,

  /** Notification type */
  type: notificationTypeEnum,

  /** Notification category */
  category: notificationCategoryEnum,

  /** Notification priority */
  priority: notificationPriorityEnum.default('normal'),

  /** Notification channel */
  channel: notificationChannelEnum,

  /** Notification status */
  status: notificationStatusEnum.default('pending'),

  /** Notification title/subject */
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less')
    .trim(),

  /** Notification message body */
  message: z.string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be 5000 characters or less')
    .trim(),

  /** HTML version of message (for email) */
  html_message: z.string()
    .max(50000, 'HTML message too large')
    .nullable()
    .optional(),

  /** Related entity type */
  entity_type: z.string()
    .max(50, 'Entity type must be 50 characters or less')
    .nullable()
    .optional(),

  /** Related entity ID */
  entity_id: uuidSchema.nullable().optional(),

  /** Action URL (for clickable notifications) */
  action_url: z.string()
    .url('Invalid action URL')
    .max(500, 'Action URL too long')
    .nullable()
    .optional(),

  /** Action button text */
  action_text: z.string()
    .max(50, 'Action text must be 50 characters or less')
    .nullable()
    .optional(),

  /** Notification icon */
  icon: z.string()
    .max(100, 'Icon must be 100 characters or less')
    .nullable()
    .optional(),

  /** Notification image URL */
  image_url: z.string()
    .url('Invalid image URL')
    .max(500, 'Image URL too long')
    .nullable()
    .optional(),

  /** Additional notification data (JSON) */
  data: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional(),

  /** Template ID used (if any) */
  template_id: uuidSchema.nullable().optional(),

  /** Sender user ID (if sent by user) */
  sender_id: uuidSchema.nullable().optional(),

  /** Scheduled send time */
  scheduled_at: z.coerce.date().nullable().optional(),

  /** Actual send time */
  sent_at: z.coerce.date().nullable().optional(),

  /** Delivery confirmation time */
  delivered_at: z.coerce.date().nullable().optional(),

  /** Read/viewed time */
  read_at: z.coerce.date().nullable().optional(),

  /** Expiration time (auto-delete after) */
  expires_at: z.coerce.date().nullable().optional(),

  /** Number of send attempts */
  attempts: z.number()
    .int()
    .nonnegative()
    .default(0),

  /** Maximum send attempts before giving up */
  max_attempts: z.number()
    .int()
    .positive()
    .max(10)
    .default(3),

  /** Last error message (if failed) */
  error_message: z.string()
    .max(1000, 'Error message too long')
    .nullable()
    .optional(),

  /** External message ID (from email/SMS provider) */
  external_id: z.string()
    .max(255, 'External ID too long')
    .nullable()
    .optional(),

  /** Metadata for tracking */
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
 * Notification creation schema
 * POST /notifications
 */
export const notificationCreateSchema = notificationSchema.omit({
  id: true,
  status: true,
  sent_at: true,
  delivered_at: true,
  read_at: true,
  attempts: true,
  error_message: true,
  external_id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
}).extend({
  /** Multiple recipients */
  user_ids: z.array(uuidSchema)
    .min(1, 'At least one user ID is required')
    .max(1000, 'Maximum 1000 recipients allowed')
    .optional(),

  /** Send immediately (ignore scheduled_at) */
  send_immediately: z.boolean().default(true),
}).strict();

/**
 * Notification update schema
 * PUT/PATCH /notifications/:id
 */
export const notificationUpdateSchema = notificationSchema.omit({
  id: true,
  user_id: true,
  channel: true,
  sent_at: true,
  delivered_at: true,
  read_at: true,
  attempts: true,
  error_message: true,
  external_id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
}).partial().strict();

/**
 * Notification query schema
 * GET /notifications
 */
export const notificationQuerySchema = z.object({
  /** Pagination: page number */
  page: z.coerce.number().int().positive().default(1),

  /** Pagination: items per page */
  limit: z.coerce.number().int().positive().max(500).default(50),

  /** Filter by user ID */
  user_id: uuidSchema.optional(),

  /** Filter by type */
  type: notificationTypeEnum.optional(),

  /** Filter by category */
  category: notificationCategoryEnum.optional(),

  /** Filter by priority */
  priority: notificationPriorityEnum.optional(),

  /** Filter by channel */
  channel: notificationChannelEnum.optional(),

  /** Filter by status */
  status: notificationStatusEnum.optional(),

  /** Filter by read status */
  is_read: z.coerce.boolean().optional(),

  /** Filter by entity type */
  entity_type: z.string().max(50).optional(),

  /** Filter by entity ID */
  entity_id: uuidSchema.optional(),

  /** Filter by sender */
  sender_id: uuidSchema.optional(),

  /** Filter by creation date range */
  created_after: z.coerce.date().optional(),
  created_before: z.coerce.date().optional(),

  /** Filter by scheduled date range */
  scheduled_after: z.coerce.date().optional(),
  scheduled_before: z.coerce.date().optional(),

  /** Include expired notifications */
  include_expired: z.coerce.boolean().default(false),

  /** Search by title or message */
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  /** Sort field */
  sort: z.enum([
    'created_at',
    'scheduled_at',
    'sent_at',
    'priority',
    'status'
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
  if (data.scheduled_after && data.scheduled_before) {
    return data.scheduled_after <= data.scheduled_before;
  }
  return true;
}, {
  message: 'scheduled_after must be before or equal to scheduled_before'
});

/**
 * Mark notification as read schema
 */
export const notificationMarkReadSchema = z.object({
  notification_ids: z.array(uuidSchema)
    .min(1, 'At least one notification ID is required')
    .max(100, 'Maximum 100 notifications can be marked at once'),
});

/**
 * Bulk notification send schema
 */
export const notificationBulkSendSchema = z.object({
  /** User IDs to send to */
  user_ids: z.array(uuidSchema)
    .min(1, 'At least one user ID is required')
    .max(10000, 'Maximum 10000 recipients allowed'),

  /** Notification template ID */
  template_id: uuidSchema.optional(),

  /** Notification details (if not using template) */
  type: notificationTypeEnum.optional(),
  category: notificationCategoryEnum.optional(),
  priority: notificationPriorityEnum.optional(),
  channel: notificationChannelEnum,
  title: z.string().min(1).max(255).optional(),
  message: z.string().min(1).max(5000).optional(),

  /** Template variables (for template rendering) */
  variables: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional(),

  /** Schedule send time */
  scheduled_at: z.coerce.date().optional(),
}).refine(data => {
  // Either template_id or full notification details required
  if (!data.template_id) {
    return data.title && data.message && data.type && data.category;
  }
  return true;
}, {
  message: 'Either template_id or full notification details (title, message, type, category) required'
});

/**
 * Notification template schema
 */
export const notificationTemplateSchema = z.object({
  /** Unique template identifier */
  id: uuidSchema,

  /** Template name */
  name: z.string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be 100 characters or less')
    .trim(),

  /** Template code (unique identifier) */
  code: z.string()
    .min(3, 'Template code must be at least 3 characters')
    .max(50, 'Template code must be 50 characters or less')
    .regex(/^[a-z][a-z0-9_]*$/, 'Template code must be lowercase letters, numbers, and underscores')
    .trim(),

  /** Template description */
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .nullable()
    .optional(),

  /** Default notification type */
  type: notificationTypeEnum,

  /** Default category */
  category: notificationCategoryEnum,

  /** Default priority */
  priority: notificationPriorityEnum.default('normal'),

  /** Supported channels */
  channels: z.array(notificationChannelEnum)
    .min(1, 'At least one channel is required'),

  /** Email subject template */
  subject_template: z.string()
    .max(255, 'Subject template too long')
    .nullable()
    .optional(),

  /** Message body template (supports variables) */
  body_template: z.string()
    .min(1, 'Body template is required')
    .max(10000, 'Body template too long')
    .trim(),

  /** HTML body template (for email) */
  html_template: z.string()
    .max(100000, 'HTML template too large')
    .nullable()
    .optional(),

  /** Template variables (expected placeholders) */
  variables: z.array(z.string().max(50))
    .default([]),

  /** Template is active */
  is_active: z.boolean().default(true),

  /** Template metadata */
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional(),

  /** Record creation timestamp */
  created_at: z.coerce.date(),

  /** Record last update timestamp */
  updated_at: z.coerce.date(),
}).strict();

/**
 * Notification template creation schema
 */
export const notificationTemplateCreateSchema = notificationTemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).strict();

/**
 * Notification template update schema
 */
export const notificationTemplateUpdateSchema = notificationTemplateSchema.omit({
  id: true,
  code: true, // Code cannot be changed
  created_at: true,
  updated_at: true,
}).partial().strict();

/**
 * Notification ID parameter schema
 */
export const notificationIdSchema = z.object({
  id: uuidSchema
});

/**
 * Notification template ID parameter schema
 */
export const notificationTemplateIdSchema = z.object({
  id: uuidSchema
});

// Type exports
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationCreate = z.infer<typeof notificationCreateSchema>;
export type NotificationUpdate = z.infer<typeof notificationUpdateSchema>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export type NotificationMarkRead = z.infer<typeof notificationMarkReadSchema>;
export type NotificationBulkSend = z.infer<typeof notificationBulkSendSchema>;
export type NotificationId = z.infer<typeof notificationIdSchema>;

export type NotificationTemplate = z.infer<typeof notificationTemplateSchema>;
export type NotificationTemplateCreate = z.infer<typeof notificationTemplateCreateSchema>;
export type NotificationTemplateUpdate = z.infer<typeof notificationTemplateUpdateSchema>;
export type NotificationTemplateId = z.infer<typeof notificationTemplateIdSchema>;

export type NotificationType = z.infer<typeof notificationTypeEnum>;
export type NotificationChannel = z.infer<typeof notificationChannelEnum>;
export type NotificationPriority = z.infer<typeof notificationPriorityEnum>;
export type NotificationStatus = z.infer<typeof notificationStatusEnum>;
export type NotificationCategory = z.infer<typeof notificationCategoryEnum>;
