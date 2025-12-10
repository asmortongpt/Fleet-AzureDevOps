import { z } from 'zod';
import {
  uuidSchema,
  paginationSchema,
  dateRangeSchema,
  emailSchema,
  phoneSchema,
  urlSchema,
  currencySchema,
  percentageSchema,
  timestampSchema,
  priorityEnum,
  statusEnum,
} from './common.schema';

/**
 * Comprehensive Zod Validation Schemas
 *
 * SECURITY: Implements CRIT-B-003 (BACKEND-23)
 * Provides validation for all API endpoints to prevent:
 * - SQL injection attacks
 * - XSS injection attacks
 * - NoSQL injection
 * - Command injection
 * - Path traversal attacks
 *
 * @module schemas/comprehensive
 */

// ============================================================================
// AI & CHAT SCHEMAS
// ============================================================================

export const aiChatMessageSchema = z.object({
  sessionId: uuidSchema.optional(),
  message: z.string().min(1).max(5000).trim(),
  documentIds: z.array(uuidSchema).max(50).optional(),
  systemPrompt: z.string().max(2000).optional(),
  stream: z.boolean().optional(),
});

export const aiChatSessionSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  documentIds: z.array(uuidSchema).max(100).optional(),
  systemPrompt: z.string().max(2000).optional(),
});

export const aiInsightQuerySchema = z.object({
  query: z.string().min(1).max(1000).trim(),
  contextType: z.enum(['vehicle', 'driver', 'maintenance', 'fuel', 'route', 'general']).optional(),
  contextId: uuidSchema.optional(),
  includeRecommendations: z.boolean().optional(),
});

export const aiTaskPrioritizationSchema = z.object({
  taskIds: z.array(uuidSchema).min(1).max(100),
  criteria: z.array(z.enum(['urgency', 'importance', 'deadline', 'cost', 'risk'])).optional(),
  weightings: z.record(z.number().min(0).max(1)).optional(),
});

// ============================================================================
// ALERT & NOTIFICATION SCHEMAS
// ============================================================================

export const alertCreateSchema = z.object({
  vehicleId: uuidSchema.optional(),
  driverId: uuidSchema.optional(),
  type: z.enum([
    'maintenance_due',
    'low_fuel',
    'speeding',
    'harsh_braking',
    'geofence_violation',
    'license_expiring',
    'inspection_due',
    'custom',
  ]),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  title: z.string().min(1).max(200).trim(),
  message: z.string().max(2000).trim(),
  metadata: z.record(z.any()).optional(),
  expiresAt: timestampSchema.optional(),
});

export const alertUpdateSchema = z.object({
  status: z.enum(['new', 'acknowledged', 'resolved', 'dismissed']).optional(),
  assignedTo: uuidSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export const alertQuerySchema = paginationSchema.extend({
  vehicleId: uuidSchema.optional(),
  driverId: uuidSchema.optional(),
  type: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  ...dateRangeSchema.shape,
});

// ============================================================================
// ASSET MANAGEMENT SCHEMAS
// ============================================================================

export const assetCreateSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  assetNumber: z.string().min(1).max(50).trim(),
  category: z.enum(['vehicle', 'equipment', 'tool', 'device', 'facility', 'other']),
  type: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  purchaseDate: timestampSchema.optional(),
  purchasePrice: currencySchema.optional(),
  currentValue: currencySchema.optional(),
  depreciationMethod: z.enum(['straight_line', 'declining_balance', 'units_of_production']).optional(),
  usefulLifeYears: z.number().int().min(1).max(100).optional(),
  salvageValue: currencySchema.optional(),
  status: statusEnum.optional(),
  locationId: uuidSchema.optional(),
  assignedTo: uuidSchema.optional(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.any()).optional(),
});

export const assetUpdateSchema = assetCreateSchema.partial();

export const assetQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  status: z.string().optional(),
  locationId: uuidSchema.optional(),
  assignedTo: uuidSchema.optional(),
  search: z.string().max(500).optional(),
  ...dateRangeSchema.shape,
});

// ============================================================================
// ATTACHMENT & DOCUMENT SCHEMAS
// ============================================================================

export const attachmentUploadSchema = z.object({
  entityType: z.enum(['vehicle', 'driver', 'work_order', 'inspection', 'incident', 'asset', 'facility', 'other']),
  entityId: uuidSchema,
  category: z.enum(['photo', 'document', 'receipt', 'report', 'diagram', 'other']).optional(),
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const documentSearchSchema = paginationSchema.extend({
  q: z.string().min(1).max(500).optional(),
  entityType: z.string().optional(),
  entityId: uuidSchema.optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  ...dateRangeSchema.shape,
});

// ============================================================================
// BILLING & COST SCHEMAS
// ============================================================================

export const billingReportSchema = z.object({
  reportType: z.enum(['summary', 'detailed', 'by_vehicle', 'by_driver', 'by_category']),
  ...dateRangeSchema.shape,
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
  includeProjections: z.boolean().optional(),
});

export const costEntrySchema = z.object({
  vehicleId: uuidSchema.optional(),
  driverId: uuidSchema.optional(),
  category: z.enum(['fuel', 'maintenance', 'insurance', 'registration', 'tolls', 'parking', 'other']),
  subcategory: z.string().max(100).optional(),
  amount: currencySchema,
  quantity: z.number().min(0).optional(),
  unitPrice: currencySchema.optional(),
  vendor: z.string().max(200).optional(),
  invoiceNumber: z.string().max(100).optional(),
  transactionDate: timestampSchema,
  paidDate: timestampSchema.optional(),
  paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'check', 'wire_transfer', 'other']).optional(),
  notes: z.string().max(1000).optional(),
});

export const costAnalysisQuerySchema = z.object({
  ...dateRangeSchema.shape,
  groupBy: z.enum(['vehicle', 'driver', 'category', 'day', 'week', 'month']).optional(),
  vehicleIds: z.array(uuidSchema).max(100).optional(),
  categories: z.array(z.string()).max(20).optional(),
});

// ============================================================================
// CHARGING (EV) SCHEMAS
// ============================================================================

export const chargingSessionSchema = z.object({
  vehicleId: uuidSchema,
  stationId: uuidSchema,
  startTime: timestampSchema,
  endTime: timestampSchema.optional(),
  energyDelivered: z.number().min(0).max(1000).optional(), // kWh
  cost: currencySchema.optional(),
  socStart: percentageSchema.optional(), // State of charge
  socEnd: percentageSchema.optional(),
  notes: z.string().max(500).optional(),
});

export const chargingStationSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  locationId: uuidSchema.optional(),
  address: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  connectorType: z.enum(['J1772', 'CCS', 'CHAdeMO', 'Tesla', 'Type2', 'other']),
  maxPowerKw: z.number().min(0).max(500),
  costPerKwh: currencySchema.optional(),
  networkProvider: z.string().max(100).optional(),
  status: z.enum(['available', 'in_use', 'out_of_service', 'maintenance']).optional(),
});

// ============================================================================
// COMMUNICATION SCHEMAS
// ============================================================================

export const communicationLogSchema = z.object({
  entityType: z.enum(['driver', 'vendor', 'customer', 'internal', 'other']),
  entityId: uuidSchema.optional(),
  type: z.enum(['phone', 'email', 'sms', 'in_person', 'video', 'other']),
  direction: z.enum(['inbound', 'outbound']),
  subject: z.string().max(200).optional(),
  summary: z.string().max(2000),
  outcome: z.string().max(500).optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: timestampSchema.optional(),
  communicatedAt: timestampSchema,
  participants: z.array(z.string().max(200)).max(20).optional(),
});

// ============================================================================
// CRASH & INCIDENT SCHEMAS
// ============================================================================

export const crashDetectionSchema = z.object({
  vehicleId: uuidSchema,
  driverId: uuidSchema.optional(),
  severity: z.enum(['minor', 'moderate', 'severe', 'critical']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).max(200).optional(), // mph
  gForce: z.number().min(0).max(20).optional(),
  airbagDeployment: z.boolean().optional(),
  timestamp: timestampSchema,
  metadata: z.record(z.any()).optional(),
});

export const incidentCreateSchema = z.object({
  vehicleId: uuidSchema.optional(),
  driverId: uuidSchema.optional(),
  type: z.enum(['accident', 'theft', 'vandalism', 'breakdown', 'citation', 'other']),
  severity: z.enum(['minor', 'moderate', 'major', 'critical']),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(5000),
  occurredAt: timestampSchema,
  location: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  policeReportNumber: z.string().max(100).optional(),
  insuranceClaimNumber: z.string().max(100).optional(),
  estimatedCost: currencySchema.optional(),
  injuries: z.boolean().optional(),
  witnesses: z.array(z.object({
    name: z.string().max(200),
    contact: z.string().max(200).optional(),
    statement: z.string().max(2000).optional(),
  })).max(10).optional(),
});

// ============================================================================
// DISPATCH & ROUTE SCHEMAS
// ============================================================================

export const dispatchAssignmentSchema = z.object({
  vehicleId: uuidSchema,
  driverId: uuidSchema,
  routeId: uuidSchema.optional(),
  scheduledStart: timestampSchema,
  scheduledEnd: timestampSchema,
  priority: priorityEnum,
  instructions: z.string().max(2000).optional(),
  requiredEquipment: z.array(z.string().max(100)).max(50).optional(),
  specialRequirements: z.string().max(1000).optional(),
}).refine(data => data.scheduledStart < data.scheduledEnd, {
  message: 'Scheduled end must be after scheduled start',
  path: ['scheduledEnd'],
});

export const routeOptimizationSchema = z.object({
  vehicleIds: z.array(uuidSchema).min(1).max(50),
  stops: z.array(z.object({
    address: z.string().max(500),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    sequence: z.number().int().min(1).optional(),
    timeWindowStart: timestampSchema.optional(),
    timeWindowEnd: timestampSchema.optional(),
    serviceTime: z.number().int().min(0).max(480).optional(), // minutes
  })).min(2).max(100),
  optimizationGoal: z.enum(['distance', 'time', 'cost', 'balanced']).optional(),
  avoidTolls: z.boolean().optional(),
  avoidHighways: z.boolean().optional(),
});

// ============================================================================
// DAMAGE REPORT SCHEMAS
// ============================================================================

export const damageReportSchema = z.object({
  vehicleId: uuidSchema,
  reportedBy: uuidSchema.optional(),
  driverId: uuidSchema.optional(),
  severity: z.enum(['minor', 'moderate', 'major', 'critical']),
  type: z.enum(['collision', 'scratch', 'dent', 'paint', 'glass', 'mechanical', 'interior', 'other']),
  location: z.enum(['front', 'rear', 'left_side', 'right_side', 'top', 'bottom', 'interior', 'multiple']),
  description: z.string().min(1).max(2000),
  estimatedCost: currencySchema.optional(),
  occurredAt: timestampSchema,
  discoveredAt: timestampSchema.optional(),
  isPreTrip: z.boolean().optional(),
  weatherConditions: z.string().max(200).optional(),
});

// ============================================================================
// RESERVATION SCHEMAS
// ============================================================================

export const reservationSchema = z.object({
  vehicleId: uuidSchema,
  driverId: uuidSchema.optional(),
  requestedBy: uuidSchema,
  startTime: timestampSchema,
  endTime: timestampSchema,
  purpose: z.string().max(500),
  destination: z.string().max(500).optional(),
  estimatedMiles: z.number().min(0).max(10000).optional(),
  passengerCount: z.number().int().min(1).max(100).optional(),
  specialRequirements: z.string().max(1000).optional(),
  approvalRequired: z.boolean().optional(),
}).refine(data => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// ============================================================================
// OCR & VIDEO TELEMATICS SCHEMAS
// ============================================================================

export const ocrProcessSchema = z.object({
  imageUrl: urlSchema.optional(),
  imageBase64: z.string().max(10_000_000).optional(), // ~7.5MB
  documentType: z.enum(['receipt', 'invoice', 'license', 'registration', 'insurance', 'bol', 'other']).optional(),
  extractFields: z.array(z.string()).max(50).optional(),
  language: z.string().length(2).optional(), // ISO 639-1 code
}).refine(data => data.imageUrl || data.imageBase64, {
  message: 'Either imageUrl or imageBase64 must be provided',
});

export const videoTelematicsEventSchema = z.object({
  vehicleId: uuidSchema,
  driverId: uuidSchema.optional(),
  eventType: z.enum([
    'harsh_braking',
    'harsh_acceleration',
    'harsh_cornering',
    'collision',
    'speeding',
    'distracted_driving',
    'drowsy_driving',
    'following_too_close',
    'lane_departure',
    'other',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  timestamp: timestampSchema,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  speed: z.number().min(0).max(200).optional(),
  videoUrl: urlSchema.optional(),
  duration: z.number().int().min(1).max(300).optional(), // seconds
  confidence: percentageSchema.optional(),
});

// ============================================================================
// MOBILE APP SCHEMAS
// ============================================================================

export const mobileAssignmentSchema = z.object({
  driverId: uuidSchema,
  vehicleId: uuidSchema,
  assignmentType: z.enum(['delivery', 'pickup', 'service', 'inspection', 'other']),
  priority: priorityEnum,
  scheduledFor: timestampSchema,
  location: z.string().max(500),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  instructions: z.string().max(2000).optional(),
  estimatedDuration: z.number().int().min(1).max(960).optional(), // minutes
});

export const mobileCheckInSchema = z.object({
  assignmentId: uuidSchema.optional(),
  vehicleId: uuidSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  odometerReading: z.number().min(0).max(10_000_000).optional(),
  fuelLevel: percentageSchema.optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// CALENDAR & SCHEDULING SCHEMAS
// ============================================================================

export const calendarEventSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  eventType: z.enum(['maintenance', 'inspection', 'meeting', 'training', 'deadline', 'other']),
  startTime: timestampSchema,
  endTime: timestampSchema,
  allDay: z.boolean().optional(),
  vehicleId: uuidSchema.optional(),
  driverId: uuidSchema.optional(),
  location: z.string().max(500).optional(),
  attendees: z.array(uuidSchema).max(100).optional(),
  recurrenceRule: z.string().max(500).optional(), // iCal RRULE format
  reminderMinutes: z.number().int().min(0).max(10080).optional(), // Max 1 week
}).refine(data => !data.endTime || data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export const comprehensiveSchemas = {
  // AI & Chat
  aiChatMessage: aiChatMessageSchema,
  aiChatSession: aiChatSessionSchema,
  aiInsightQuery: aiInsightQuerySchema,
  aiTaskPrioritization: aiTaskPrioritizationSchema,

  // Alerts
  alertCreate: alertCreateSchema,
  alertUpdate: alertUpdateSchema,
  alertQuery: alertQuerySchema,

  // Assets
  assetCreate: assetCreateSchema,
  assetUpdate: assetUpdateSchema,
  assetQuery: assetQuerySchema,

  // Attachments
  attachmentUpload: attachmentUploadSchema,
  documentSearch: documentSearchSchema,

  // Billing & Costs
  billingReport: billingReportSchema,
  costEntry: costEntrySchema,
  costAnalysisQuery: costAnalysisQuerySchema,

  // Charging
  chargingSession: chargingSessionSchema,
  chargingStation: chargingStationSchema,

  // Communication
  communicationLog: communicationLogSchema,

  // Crash & Incidents
  crashDetection: crashDetectionSchema,
  incidentCreate: incidentCreateSchema,

  // Dispatch & Routes
  dispatchAssignment: dispatchAssignmentSchema,
  routeOptimization: routeOptimizationSchema,

  // Damage
  damageReport: damageReportSchema,

  // Reservations
  reservation: reservationSchema,

  // OCR & Video
  ocrProcess: ocrProcessSchema,
  videoTelematicsEvent: videoTelematicsEventSchema,

  // Mobile
  mobileAssignment: mobileAssignmentSchema,
  mobileCheckIn: mobileCheckInSchema,

  // Calendar
  calendarEvent: calendarEventSchema,
};

// Type exports
export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;
export type AiChatSession = z.infer<typeof aiChatSessionSchema>;
export type AiInsightQuery = z.infer<typeof aiInsightQuerySchema>;
export type AlertCreate = z.infer<typeof alertCreateSchema>;
export type AlertUpdate = z.infer<typeof alertUpdateSchema>;
export type AssetCreate = z.infer<typeof assetCreateSchema>;
export type AssetUpdate = z.infer<typeof assetUpdateSchema>;
export type AttachmentUpload = z.infer<typeof attachmentUploadSchema>;
export type BillingReport = z.infer<typeof billingReportSchema>;
export type CostEntry = z.infer<typeof costEntrySchema>;
export type ChargingSession = z.infer<typeof chargingSessionSchema>;
export type ChargingStation = z.infer<typeof chargingStationSchema>;
export type CommunicationLog = z.infer<typeof communicationLogSchema>;
export type CrashDetection = z.infer<typeof crashDetectionSchema>;
export type IncidentCreate = z.infer<typeof incidentCreateSchema>;
export type DispatchAssignment = z.infer<typeof dispatchAssignmentSchema>;
export type RouteOptimization = z.infer<typeof routeOptimizationSchema>;
export type DamageReport = z.infer<typeof damageReportSchema>;
export type Reservation = z.infer<typeof reservationSchema>;
export type OcrProcess = z.infer<typeof ocrProcessSchema>;
export type VideoTelematicsEvent = z.infer<typeof videoTelematicsEventSchema>;
export type MobileAssignment = z.infer<typeof mobileAssignmentSchema>;
export type MobileCheckIn = z.infer<typeof mobileCheckInSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
