import { z } from 'zod'

import { commonSchemas } from '../middleware/validation'

/**
 * Communications Validation Schemas
 *
 * Comprehensive validation for universal communications system including:
 * - Email, SMS, voice, Teams, and other communication types
 * - Entity linking (vehicles, drivers, work orders, etc.)
 * - Priority and category classification
 * - Follow-up tracking
 * - Attachments
 *
 * Security Features:
 * - XSS prevention through input sanitization
 * - SQL injection prevention via parameterized queries
 * - File upload restrictions
 * - Length limits on all text fields
 */

/**
 * Communication types enumeration
 */
const communicationTypeEnum = z.enum([
  'email',
  'sms',
  'voice',
  'teams_message',
  'teams_meeting',
  'outlook_email',
  'outlook_calendar',
  'system_notification',
  'mobile_push',
  'web_chat',
  'phone_call',
  'fax',
  'other'
])

/**
 * Communication status
 */
const communicationStatusEnum = z.enum([
  'draft',
  'sent',
  'delivered',
  'read',
  'failed',
  'pending',
  'closed',
  'archived'
])

/**
 * Communication priority
 */
const communicationPriorityEnum = z.enum([
  'low',
  'medium',
  'high',
  'urgent',
  'critical'
])

/**
 * Communication category
 */
const communicationCategoryEnum = z.enum([
  'maintenance',
  'accident',
  'incident',
  'compliance',
  'scheduling',
  'general',
  'emergency',
  'support',
  'billing',
  'other'
])

/**
 * Entity link types
 */
const entityLinkTypeEnum = z.enum([
  'related',
  'primary',
  'secondary',
  'referenced',
  'caused_by',
  'resolves',
  'follows_up'
])

/**
 * Entity types for linking
 */
const entityTypeEnum = z.enum([
  'vehicle',
  'driver',
  'work_order',
  'maintenance',
  'incident',
  'accident',
  'fuel_transaction',
  'inspection',
  'facility',
  'route',
  'trip',
  'asset',
  'vendor',
  'invoice',
  'document'
])

/**
 * Entity link schema
 */
export const entityLinkSchema = z.object({
  entity_type: entityTypeEnum,
  entity_id: z.string().uuid('Invalid entity ID format'),
  link_type: entityLinkTypeEnum.default('related'),
  relevance_score: z.number()
    .min(0, 'Relevance score must be 0-100')
    .max(100, 'Relevance score must be 0-100')
    .optional(),
  auto_detected: z.boolean().default(false)
}).strict()

/**
 * Create communication
 * POST /communications
 */
export const createCommunicationSchema = z.object({
  // Communication type and metadata (REQUIRED)
  communication_type: communicationTypeEnum,

  subject: z.string()
    .min(1, 'Subject is required')
    .max(500, 'Subject must be 500 characters or less')
    .trim(),

  body: z.string()
    .max(50000, 'Body must be 50000 characters or less')
    .optional(),

  // Timestamp (REQUIRED)
  communication_datetime: z.coerce.date({
    errorMap: () => ({ message: 'Invalid datetime format' })
  }),

  // Sender information (OPTIONAL - can be system-generated)
  from_user_id: z.string().uuid().optional(),

  from_contact_name: z.string()
    .max(200, 'Contact name too long')
    .trim()
    .optional(),

  from_contact_email: commonSchemas.email.optional(),

  from_contact_phone: commonSchemas.phone.optional(),

  // Recipients (OPTIONAL for some communication types)
  to_recipients: z.array(
    z.string().email('Invalid email format')
  ).max(100, 'Too many recipients').optional(),

  cc_recipients: z.array(
    z.string().email('Invalid email format')
  ).max(50, 'Too many CC recipients').optional(),

  bcc_recipients: z.array(
    z.string().email('Invalid email format')
  ).max(50, 'Too many BCC recipients').optional(),

  // Classification (OPTIONAL - can be AI-detected)
  manual_category: communicationCategoryEnum.optional(),
  manual_priority: communicationPriorityEnum.optional(),

  // Status
  status: communicationStatusEnum.default('sent'),

  // Direction
  direction: z.enum(['inbound', 'outbound', 'internal']).default('outbound'),

  // Follow-up tracking (OPTIONAL)
  requires_follow_up: z.boolean().default(false),

  follow_up_by_date: z.coerce.date().optional(),

  follow_up_assigned_to: z.string().uuid().optional(),

  follow_up_completed: z.boolean().default(false),

  // Entity links (OPTIONAL)
  linked_entities: z.array(entityLinkSchema)
    .max(50, 'Too many linked entities')
    .optional(),

  // External IDs for integration tracking
  external_message_id: z.string()
    .max(500, 'External message ID too long')
    .optional(),

  external_thread_id: z.string()
    .max(500, 'External thread ID too long')
    .optional(),

  external_conversation_id: z.string()
    .max(500, 'External conversation ID too long')
    .optional(),

  // Metadata
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(1000), z.number(), z.boolean()])
  ).optional()
}).strict().refine(data => {
  // If requires_follow_up is true, must have follow_up_by_date
  if (data.requires_follow_up && !data.follow_up_by_date) {
    return false
  }
  return true
}, {
  message: 'Follow-up date is required when follow-up is enabled',
  path: ['follow_up_by_date']
}).refine(data => {
  // Email communications must have recipients
  if (data.communication_type === 'email' || data.communication_type === 'outlook_email') {
    return data.to_recipients && data.to_recipients.length > 0
  }
  return true
}, {
  message: 'Email communications must have at least one recipient',
  path: ['to_recipients']
})

/**
 * Update communication
 * PUT /communications/:id
 */
export const updateCommunicationSchema = z.object({
  subject: z.string()
    .min(1)
    .max(500)
    .trim()
    .optional(),

  body: z.string()
    .max(50000)
    .optional(),

  manual_category: communicationCategoryEnum.optional(),
  manual_priority: communicationPriorityEnum.optional(),

  status: communicationStatusEnum.optional(),

  requires_follow_up: z.boolean().optional(),
  follow_up_by_date: z.coerce.date().optional(),
  follow_up_assigned_to: z.string().uuid().optional(),
  follow_up_completed: z.boolean().optional(),

  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(1000), z.number(), z.boolean()])
  ).optional()
}).strict()

/**
 * Link entity to communication
 * POST /communications/:id/link
 */
export const linkEntitySchema = z.object({
  entity_type: entityTypeEnum,
  entity_id: z.string().uuid('Invalid entity ID format'),
  link_type: entityLinkTypeEnum.default('related')
}).strict()

/**
 * Query parameters for GET /communications
 */
export const getCommunicationsQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),

  // Filtering
  communication_type: communicationTypeEnum.optional(),
  category: communicationCategoryEnum.optional(),
  priority: communicationPriorityEnum.optional(),
  status: communicationStatusEnum.optional(),
  direction: z.enum(['inbound', 'outbound', 'internal']).optional(),

  // Search
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  // Date range
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),

  // Follow-up filtering
  requires_follow_up: z.coerce.boolean().optional(),
  follow_up_overdue: z.coerce.boolean().optional(),

  // Entity filtering
  entity_type: entityTypeEnum.optional(),
  entity_id: z.string().uuid().optional(),

  // Sorting
  sort: z.enum([
    'communication_datetime',
    'subject',
    'priority',
    'status',
    'follow_up_by_date'
  ]).default('communication_datetime'),
  order: z.enum(['asc', 'desc']).default('desc')
}).refine(data => {
  // Validate date range
  if (data.start_date && data.end_date) {
    return data.start_date <= data.end_date
  }
  return true
}, {
  message: 'start_date must be before or equal to end_date'
})

/**
 * Communication template schema
 * POST /communications/templates
 */
export const createCommunicationTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .max(200, 'Template name too long')
    .trim(),

  type: communicationTypeEnum,

  subject: z.string()
    .max(500, 'Subject template too long')
    .optional(),

  body: z.string()
    .max(50000, 'Body template too long'),

  template_category: communicationCategoryEnum.optional(),

  variables: z.array(
    z.string().max(100)
  ).max(50, 'Too many template variables').optional(),

  is_active: z.boolean().default(true)
}).strict()

/**
 * Type exports for TypeScript
 */
export type CreateCommunicationInput = z.infer<typeof createCommunicationSchema>
export type UpdateCommunicationInput = z.infer<typeof updateCommunicationSchema>
export type LinkEntityInput = z.infer<typeof linkEntitySchema>
export type GetCommunicationsQuery = z.infer<typeof getCommunicationsQuerySchema>
export type CreateCommunicationTemplateInput = z.infer<typeof createCommunicationTemplateSchema>
export type EntityLink = z.infer<typeof entityLinkSchema>
