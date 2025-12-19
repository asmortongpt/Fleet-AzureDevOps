import { z } from 'zod';

import { commonSchemas } from '../middleware/validation';

/**
 * Comprehensive Zod validation schemas for Safety Incidents & Accidents
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Includes accidents, injuries, near-misses, property damage, and OSHA reporting.
 */

// Incident type enum
const incidentTypeEnum = z.enum([
  'accident',
  'collision',
  'injury',
  'near_miss',
  'property_damage',
  'vehicle_damage',
  'environmental',
  'security',
  'health_hazard',
  'fire',
  'theft',
  'vandalism',
  'other'
]);

// Severity enum
const severityEnum = z.enum([
  'minor',
  'moderate',
  'severe',
  'critical',
  'fatal'
]);

// Status enum
const statusEnum = z.enum([
  'reported',
  'open',
  'investigating',
  'pending_review',
  'resolved',
  'closed',
  'archived'
]);

/**
 * Injury detail schema
 */
export const injuryDetailSchema = z.object({
  person_name: z.string().max(255),
  person_type: z.enum(['driver', 'passenger', 'pedestrian', 'third_party', 'employee']),
  injury_type: z.string().max(255),
  injury_severity: severityEnum,
  body_part_affected: z.string().max(255).optional(),
  medical_treatment_required: z.boolean().default(false),
  hospital_name: z.string().max(255).optional(),
  treatment_details: z.string().max(2000).optional()
}).strict();

/**
 * Witness information schema
 */
export const witnessSchema = z.object({
  name: z.string().max(255),
  contact_phone: z.string().max(20).optional(),
  contact_email: commonSchemas.email.optional(),
  statement: z.string().max(5000).optional(),
  relationship: z.enum(['driver', 'passenger', 'bystander', 'police', 'other']).optional()
}).strict();

/**
 * Vehicle involvement schema
 */
export const vehicleInvolvementSchema = z.object({
  vehicle_id: z.string().uuid().optional(),
  vehicle_type: z.string().max(100).optional(),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional(),
  license_plate: z.string().max(20).optional(),
  vin: z.string().length(17).optional(),
  driver_name: z.string().max(255).optional(),
  driver_license: z.string().max(50).optional(),
  insurance_company: z.string().max(255).optional(),
  insurance_policy: z.string().max(100).optional(),
  damage_description: z.string().max(2000).optional(),
  estimated_damage_cost: commonSchemas.currency.optional()
}).strict();

/**
 * Incident/Accident creation schema
 * POST /incidents
 */
export const incidentCreateSchema = z.object({
  // Incident identification (OPTIONAL - auto-generated)
  incident_number: z.string()
    .max(50, 'Incident number must be 50 characters or less')
    .regex(/^[A-Z0-9\-]+$/i, 'Incident number can only contain letters, numbers, and hyphens')
    .optional(),

  // Basic information (REQUIRED)
  incident_type: incidentTypeEnum,

  incident_date: z.coerce.date({
    errorMap: () => ({ message: 'Invalid incident date format' })
  }),

  incident_time: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Time must be in HH:MM or HH:MM:SS format')
    .optional(),

  severity: severityEnum,

  // Location (REQUIRED)
  location: z.string()
    .min(1, 'Location is required')
    .max(500, 'Location must be 500 characters or less'),

  latitude: commonSchemas.latitude.optional(),
  longitude: commonSchemas.longitude.optional(),

  // Description (REQUIRED)
  description: z.string()
    .min(1, 'Description is required')
    .max(10000, 'Description must be 10000 characters or less'),

  // Fleet involvement (OPTIONAL)
  vehicle_id: z.string().uuid('Invalid vehicle ID format').optional(),
  driver_id: z.string().uuid('Invalid driver ID format').optional(),

  // Casualties and damage
  injuries_count: z.number()
    .int('Injuries count must be an integer')
    .nonnegative('Injuries count must be non-negative')
    .max(1000, 'Injuries count exceeds maximum')
    .default(0),

  fatalities_count: z.number()
    .int('Fatalities count must be an integer')
    .nonnegative('Fatalities count must be non-negative')
    .max(1000, 'Fatalities count exceeds maximum')
    .default(0),

  injury_details: z.array(injuryDetailSchema)
    .max(100, 'Too many injury details')
    .optional(),

  property_damage_cost: commonSchemas.currency.optional(),
  vehicle_damage_cost: commonSchemas.currency.optional(),
  total_estimated_cost: commonSchemas.currency.optional(),

  // Fault and responsibility
  at_fault: z.boolean().optional(),
  at_fault_party: z.enum([
    'our_driver',
    'other_driver',
    'pedestrian',
    'weather',
    'road_conditions',
    'mechanical_failure',
    'unknown',
    'shared'
  ]).optional(),

  contributing_factors: z.array(
    z.enum([
      'speeding',
      'distracted_driving',
      'fatigue',
      'impaired_driving',
      'weather',
      'road_conditions',
      'mechanical_failure',
      'poor_visibility',
      'traffic_violation',
      'animal',
      'debris',
      'other'
    ])
  ).max(20).optional(),

  // Other parties involved
  other_vehicles_involved: z.array(vehicleInvolvementSchema)
    .max(20, 'Too many vehicles involved')
    .optional(),

  witnesses: z.array(witnessSchema)
    .max(50, 'Too many witnesses')
    .optional(),

  // Official reports and claims
  police_notified: z.boolean().default(false),
  police_report_number: z.string().max(100).optional(),
  police_department: z.string().max(255).optional(),
  police_officer_name: z.string().max(255).optional(),

  insurance_claim_filed: z.boolean().default(false),
  insurance_claim_number: z.string().max(100).optional(),
  insurance_company: z.string().max(255).optional(),

  reported_to_osha: z.boolean().default(false),
  osha_case_number: z.string().max(50).optional(),
  osha_recordable: z.boolean().default(false),

  // Analysis and corrective actions
  root_cause: z.string()
    .max(5000, 'Root cause must be 5000 characters or less')
    .optional(),

  corrective_actions: z.string()
    .max(5000, 'Corrective actions must be 5000 characters or less')
    .optional(),

  preventive_measures: z.string()
    .max(5000, 'Preventive measures must be 5000 characters or less')
    .optional(),

  // Status and tracking
  status: statusEnum.default('reported'),

  reported_by: z.string().uuid().optional(),
  investigated_by: z.string().uuid().optional(),

  investigation_completed_date: z.coerce.date().optional(),

  // Documentation
  photos: z.array(z.string().url())
    .max(100, 'Too many photos')
    .optional(),

  documents: z.array(z.string().url())
    .max(50, 'Too many documents')
    .optional(),

  video_urls: z.array(z.string().url())
    .max(20, 'Too many videos')
    .optional(),

  // Weather conditions
  weather_conditions: z.string().max(200).optional(),
  road_conditions: z.string().max(200).optional(),

  // Additional information
  notes: z.string()
    .max(10000, 'Notes must be 10000 characters or less')
    .optional(),

  internal_notes: z.string()
    .max(10000, 'Internal notes must be 10000 characters or less')
    .optional(),

  // Metadata
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional()
}).strict().refine(data => {
  // If OSHA case number provided, must be reported to OSHA
  if (data.osha_case_number) {
    return data.reported_to_osha === true;
  }
  return true;
}, {
  message: 'If OSHA case number is provided, reported_to_osha must be true',
  path: ['reported_to_osha']
}).refine(data => {
  // If insurance claim number provided, claim must be filed
  if (data.insurance_claim_number) {
    return data.insurance_claim_filed === true;
  }
  return true;
}, {
  message: 'If insurance claim number is provided, insurance_claim_filed must be true',
  path: ['insurance_claim_filed']
});

/**
 * Incident update schema
 * PUT /incidents/:id
 */
export const incidentUpdateSchema = z.object({
  incident_type: incidentTypeEnum.optional(),
  severity: severityEnum.optional(),

  location: z.string()
    .min(1)
    .max(500)
    .optional(),

  latitude: commonSchemas.latitude.nullable().optional(),
  longitude: commonSchemas.longitude.nullable().optional(),

  description: z.string()
    .min(1)
    .max(10000)
    .optional(),

  injuries_count: z.number().int().nonnegative().max(1000).optional(),
  fatalities_count: z.number().int().nonnegative().max(1000).optional(),

  injury_details: z.array(injuryDetailSchema).max(100).nullable().optional(),

  property_damage_cost: commonSchemas.currency.nullable().optional(),
  vehicle_damage_cost: commonSchemas.currency.nullable().optional(),
  total_estimated_cost: commonSchemas.currency.nullable().optional(),

  at_fault: z.boolean().nullable().optional(),
  at_fault_party: z.enum([
    'our_driver',
    'other_driver',
    'pedestrian',
    'weather',
    'road_conditions',
    'mechanical_failure',
    'unknown',
    'shared'
  ]).nullable().optional(),

  contributing_factors: z.array(z.enum([
    'speeding',
    'distracted_driving',
    'fatigue',
    'impaired_driving',
    'weather',
    'road_conditions',
    'mechanical_failure',
    'poor_visibility',
    'traffic_violation',
    'animal',
    'debris',
    'other'
  ])).max(20).nullable().optional(),

  other_vehicles_involved: z.array(vehicleInvolvementSchema).max(20).nullable().optional(),
  witnesses: z.array(witnessSchema).max(50).nullable().optional(),

  police_notified: z.boolean().optional(),
  police_report_number: z.string().max(100).nullable().optional(),
  police_department: z.string().max(255).nullable().optional(),
  police_officer_name: z.string().max(255).nullable().optional(),

  insurance_claim_filed: z.boolean().optional(),
  insurance_claim_number: z.string().max(100).nullable().optional(),
  insurance_company: z.string().max(255).nullable().optional(),

  reported_to_osha: z.boolean().optional(),
  osha_case_number: z.string().max(50).nullable().optional(),
  osha_recordable: z.boolean().optional(),

  root_cause: z.string().max(5000).nullable().optional(),
  corrective_actions: z.string().max(5000).nullable().optional(),
  preventive_measures: z.string().max(5000).nullable().optional(),

  status: statusEnum.optional(),

  investigated_by: z.string().uuid().nullable().optional(),
  investigation_completed_date: z.coerce.date().nullable().optional(),

  photos: z.array(z.string().url()).max(100).nullable().optional(),
  documents: z.array(z.string().url()).max(50).nullable().optional(),
  video_urls: z.array(z.string().url()).max(20).nullable().optional(),

  weather_conditions: z.string().max(200).nullable().optional(),
  road_conditions: z.string().max(200).nullable().optional(),

  notes: z.string().max(10000).nullable().optional(),
  internal_notes: z.string().max(10000).nullable().optional(),

  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).nullable().optional()
}).strict();

/**
 * Incident query parameters schema
 * GET /incidents
 */
export const incidentQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),

  // Filtering
  vehicle_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),

  incident_type: incidentTypeEnum.optional(),
  severity: severityEnum.optional(),
  status: statusEnum.optional(),

  at_fault: z.coerce.boolean().optional(),
  police_notified: z.coerce.boolean().optional(),
  insurance_claim_filed: z.coerce.boolean().optional(),
  reported_to_osha: z.coerce.boolean().optional(),
  osha_recordable: z.coerce.boolean().optional(),

  // Date range
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),

  // Cost range
  min_cost: commonSchemas.currency.optional(),
  max_cost: commonSchemas.currency.optional(),

  // Casualty filtering
  has_injuries: z.coerce.boolean().optional(),
  has_fatalities: z.coerce.boolean().optional(),

  // Search
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  // Sorting
  sort: z.enum([
    'incident_date',
    'incident_number',
    'severity',
    'status',
    'total_estimated_cost',
    'created_at'
  ]).default('incident_date'),
  order: z.enum(['asc', 'desc']).default('desc')
}).refine(data => {
  // Validate date range
  if (data.start_date && data.end_date) {
    return data.start_date <= data.end_date;
  }
  return true;
}, {
  message: 'start_date must be before or equal to end_date'
}).refine(data => {
  // Validate cost range
  if (data.min_cost !== undefined && data.max_cost !== undefined) {
    return data.min_cost <= data.max_cost;
  }
  return true;
}, {
  message: 'min_cost must be less than or equal to max_cost'
});

/**
 * Incident ID parameter schema
 */
export const incidentIdSchema = z.object({
  id: z.string().uuid('Invalid incident ID format')
});

// Type exports
export type InjuryDetail = z.infer<typeof injuryDetailSchema>;
export type Witness = z.infer<typeof witnessSchema>;
export type VehicleInvolvement = z.infer<typeof vehicleInvolvementSchema>;
export type IncidentCreate = z.infer<typeof incidentCreateSchema>;
export type IncidentUpdate = z.infer<typeof incidentUpdateSchema>;
export type IncidentQuery = z.infer<typeof incidentQuerySchema>;
export type IncidentId = z.infer<typeof incidentIdSchema>;
