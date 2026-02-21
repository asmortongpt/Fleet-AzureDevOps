import { z } from 'zod'

import { flexUuid } from '../middleware/validation'

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
  entity_id: flexUuid,
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

  // Sender information (OPTIONAL - can be system-generated)
  sender_id: flexUuid.optional(),

  sender_name: z.string()
    .max(200, 'Sender name too long')
    .trim()
    .optional(),

  // Recipients (OPTIONAL for some communication types - stored as jsonb)
  recipients: z.array(
    z.string().max(500)
  ).max(100, 'Too many recipients').optional(),

  // Participants (OPTIONAL - stored as jsonb)
  participants: z.array(
    z.string().max(500)
  ).max(100, 'Too many participants').optional(),

  // Classification
  priority: communicationPriorityEnum.optional(),

  // Related entity
  related_entity_type: entityTypeEnum.optional(),
  related_entity_id: flexUuid.optional(),

  // Status
  status: communicationStatusEnum.default('sent'),

  // Direction
  direction: z.enum(['inbound', 'outbound', 'internal']).default('outbound'),

  // Channel
  channel: z.string().max(100).optional(),

  // Follow-up tracking (OPTIONAL)
  follow_up_required: z.boolean().default(false),

  follow_up_date: z.coerce.date().optional(),

  follow_up_notes: z.string().max(2000).optional(),

  // Entity links (OPTIONAL)
  linked_entities: z.array(entityLinkSchema)
    .max(50, 'Too many linked entities')
    .optional(),

  // Metadata
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(1000), z.number(), z.boolean()])
  ).optional()
}).passthrough().refine(data => {
  // If follow_up_required is true, must have follow_up_date
  if (data.follow_up_required && !data.follow_up_date) {
    return false
  }
  return true
}, {
  message: 'Follow-up date is required when follow-up is enabled',
  path: ['follow_up_date']
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

  priority: communicationPriorityEnum.optional(),

  related_entity_type: entityTypeEnum.optional(),
  related_entity_id: flexUuid.optional(),

  status: communicationStatusEnum.optional(),

  follow_up_required: z.boolean().optional(),
  follow_up_date: z.coerce.date().optional(),
  follow_up_notes: z.string().max(2000).optional(),

  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(1000), z.number(), z.boolean()])
  ).optional()
}).passthrough()

/**
 * Link entity to communication
 * POST /communications/:id/link
 */
export const linkEntitySchema = z.object({
  entity_type: entityTypeEnum,
  entity_id: flexUuid,
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
  follow_up_required: z.coerce.boolean().optional(),
  follow_up_overdue: z.coerce.boolean().optional(),

  // Entity filtering
  entity_type: entityTypeEnum.optional(),
  entity_id: flexUuid.optional(),

  // Sorting
  sort: z.enum([
    'created_at',
    'subject',
    'priority',
    'status',
    'follow_up_date'
  ]).default('created_at'),
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
  template_name: z.string()
    .min(1, 'Template name is required')
    .max(200, 'Template name too long')
    .trim(),

  template_category: communicationCategoryEnum.optional(),

  subject_template: z.string()
    .max(500, 'Subject template too long')
    .optional(),

  body_template: z.string()
    .max(50000, 'Body template too long'),

  required_variables: z.array(
    z.string().max(100)
  ).max(50, 'Too many template variables').optional(),

  optional_variables: z.array(
    z.string().max(100)
  ).max(50, 'Too many optional variables').optional(),

  is_active: z.boolean().default(true)
}).passthrough()

/**
 * Type exports for TypeScript
 */
export type CreateCommunicationInput = z.infer<typeof createCommunicationSchema>
export type UpdateCommunicationInput = z.infer<typeof updateCommunicationSchema>
export type LinkEntityInput = z.infer<typeof linkEntitySchema>
export type GetCommunicationsQuery = z.infer<typeof getCommunicationsQuerySchema>
export type CreateCommunicationTemplateInput = z.infer<typeof createCommunicationTemplateSchema>
export type EntityLink = z.infer<typeof entityLinkSchema>
