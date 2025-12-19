import { z } from 'zod';

import { commonSchemas } from '../middleware/validation';

/**
 * Comprehensive Zod validation schemas for Geofences
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Geofences are geographic boundaries used for alerting and tracking.
 */

// Geofence type enum
const geofenceTypeEnum = z.enum([
  'circular',
  'polygon',
  'rectangle'
]);

/**
 * Coordinate schema for polygon vertices
 */
export const coordinateSchema = z.object({
  latitude: commonSchemas.latitude,
  longitude: commonSchemas.longitude
}).strict();

/**
 * Geofence creation schema
 * POST /geofences
 */
export const geofenceCreateSchema = z.object({
  // Geofence identification (REQUIRED)
  name: z.string()
    .min(1, 'Geofence name is required')
    .max(255, 'Geofence name must be 255 characters or less')
    .trim(),

  // Geofence type (REQUIRED)
  geofence_type: geofenceTypeEnum,

  // For circular geofences
  center_latitude: commonSchemas.latitude.optional(),
  center_longitude: commonSchemas.longitude.optional(),

  radius: z.number()
    .positive('Radius must be positive')
    .max(100000, 'Radius exceeds maximum (100km)')
    .optional(), // in meters

  // For polygon/rectangle geofences
  vertices: z.array(coordinateSchema)
    .min(3, 'Polygon must have at least 3 vertices')
    .max(100, 'Too many vertices')
    .optional(),

  // Alert configuration
  alert_on_entry: z.boolean().default(false),
  alert_on_exit: z.boolean().default(false),
  alert_on_dwell: z.boolean().default(false),

  dwell_threshold_minutes: z.number()
    .int('Dwell threshold must be an integer')
    .positive('Dwell threshold must be positive')
    .max(1440, 'Dwell threshold exceeds maximum (24 hours)')
    .optional(),

  // Alert recipients
  alert_recipients: z.array(commonSchemas.email)
    .max(50, 'Too many alert recipients')
    .optional(),

  sms_alert_recipients: z.array(commonSchemas.phone)
    .max(50, 'Too many SMS alert recipients')
    .optional(),

  // Geofence classification
  category: z.string()
    .max(100, 'Category must be 100 characters or less')
    .optional(),

  tags: z.array(z.string().max(50))
    .max(20, 'Too many tags')
    .optional(),

  // Schedule (optional - geofence only active during certain hours)
  active_days: z.array(
    z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
  ).max(7).optional(),

  active_start_time: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format')
    .optional(),

  active_end_time: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format')
    .optional(),

  // Status
  is_active: z.boolean().default(true),

  // Additional information
  description: z.string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),

  notes: z.string()
    .max(5000, 'Notes must be 5000 characters or less')
    .optional(),

  // Metadata
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional()
}).strict().refine(data => {
  // Circular geofences must have center and radius
  if (data.geofence_type === 'circular') {
    return data.center_latitude !== undefined &&
           data.center_longitude !== undefined &&
           data.radius !== undefined;
  }
  return true;
}, {
  message: 'Circular geofences require center_latitude, center_longitude, and radius',
  path: ['geofence_type']
}).refine(data => {
  // Polygon/rectangle geofences must have vertices
  if (data.geofence_type === 'polygon' || data.geofence_type === 'rectangle') {
    return data.vertices !== undefined && data.vertices.length >= 3;
  }
  return true;
}, {
  message: 'Polygon and rectangle geofences require at least 3 vertices',
  path: ['geofence_type']
}).refine(data => {
  // At least one alert type must be enabled
  return data.alert_on_entry || data.alert_on_exit || data.alert_on_dwell;
}, {
  message: 'At least one alert type must be enabled (entry, exit, or dwell)',
  path: ['alert_on_entry']
}).refine(data => {
  // If dwell alerts enabled, must have threshold
  if (data.alert_on_dwell) {
    return data.dwell_threshold_minutes !== undefined;
  }
  return true;
}, {
  message: 'Dwell threshold is required when dwell alerts are enabled',
  path: ['dwell_threshold_minutes']
});

/**
 * Geofence update schema
 * PUT /geofences/:id
 */
export const geofenceUpdateSchema = z.object({
  name: z.string()
    .min(1)
    .max(255)
    .trim()
    .optional(),

  center_latitude: commonSchemas.latitude.nullable().optional(),
  center_longitude: commonSchemas.longitude.nullable().optional(),

  radius: z.number()
    .positive()
    .max(100000)
    .nullable()
    .optional(),

  vertices: z.array(coordinateSchema)
    .min(3)
    .max(100)
    .nullable()
    .optional(),

  alert_on_entry: z.boolean().optional(),
  alert_on_exit: z.boolean().optional(),
  alert_on_dwell: z.boolean().optional(),

  dwell_threshold_minutes: z.number()
    .int()
    .positive()
    .max(1440)
    .nullable()
    .optional(),

  alert_recipients: z.array(commonSchemas.email)
    .max(50)
    .nullable()
    .optional(),

  sms_alert_recipients: z.array(commonSchemas.phone)
    .max(50)
    .nullable()
    .optional(),

  category: z.string()
    .max(100)
    .nullable()
    .optional(),

  tags: z.array(z.string().max(50))
    .max(20)
    .nullable()
    .optional(),

  active_days: z.array(
    z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
  ).max(7).nullable().optional(),

  active_start_time: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .nullable()
    .optional(),

  active_end_time: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .nullable()
    .optional(),

  is_active: z.boolean().optional(),

  description: z.string()
    .max(2000)
    .nullable()
    .optional(),

  notes: z.string()
    .max(5000)
    .nullable()
    .optional(),

  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).nullable().optional()
}).strict();

/**
 * Geofence query parameters schema
 * GET /geofences
 */
export const geofenceQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),

  // Filtering
  geofence_type: geofenceTypeEnum.optional(),
  category: z.string().max(100).optional(),
  is_active: z.coerce.boolean().optional(),

  alert_on_entry: z.coerce.boolean().optional(),
  alert_on_exit: z.coerce.boolean().optional(),
  alert_on_dwell: z.coerce.boolean().optional(),

  // Geospatial filtering - find geofences near a point
  near_latitude: commonSchemas.latitude.optional(),
  near_longitude: commonSchemas.longitude.optional(),
  radius_km: z.coerce.number()
    .positive('Radius must be positive')
    .max(500, 'Radius exceeds maximum (500 km)')
    .optional(),

  // Search
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  // Sorting
  sort: z.enum([
    'name',
    'geofence_type',
    'created_at',
    'updated_at'
  ]).default('name'),
  order: z.enum(['asc', 'desc']).default('asc')
}).refine(data => {
  // If geospatial search, must have all three parameters
  if (data.near_latitude !== undefined || data.near_longitude !== undefined || data.radius_km !== undefined) {
    return data.near_latitude !== undefined && data.near_longitude !== undefined && data.radius_km !== undefined;
  }
  return true;
}, {
  message: 'Geospatial search requires near_latitude, near_longitude, and radius_km'
});

/**
 * Geofence event query schema
 * GET /geofence-events
 */
export const geofenceEventQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(100),

  // Filtering
  geofence_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),

  event_type: z.enum(['entry', 'exit', 'dwell']).optional(),

  // Date range
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),

  // Alert status
  alert_sent: z.coerce.boolean().optional(),

  // Sorting
  sort: z.enum(['event_time', 'geofence_id', 'vehicle_id']).default('event_time'),
  order: z.enum(['asc', 'desc']).default('desc')
}).refine(data => {
  // Validate date range
  if (data.start_date && data.end_date) {
    return data.start_date <= data.end_date;
  }
  return true;
}, {
  message: 'start_date must be before or equal to end_date'
});

/**
 * Geofence ID parameter schema
 */
export const geofenceIdSchema = z.object({
  id: z.string().uuid('Invalid geofence ID format')
});

// Type exports
export type Coordinate = z.infer<typeof coordinateSchema>;
export type GeofenceCreate = z.infer<typeof geofenceCreateSchema>;
export type GeofenceUpdate = z.infer<typeof geofenceUpdateSchema>;
export type GeofenceQuery = z.infer<typeof geofenceQuerySchema>;
export type GeofenceEventQuery = z.infer<typeof geofenceEventQuerySchema>;
export type GeofenceId = z.infer<typeof geofenceIdSchema>;
