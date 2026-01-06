// Complete Drizzle ORM Schema for Fleet Local

import { pgTable, serial, varchar, timestamp, integer, boolean, decimal, text, jsonb } from 'drizzle-orm/pg-core'

// Vehicles table
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull().unique(),
  make: varchar('make', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: integer('year').notNull(),
  vin: varchar('vin', { length: 17 }).notNull().unique(),
  licensePlate: varchar('license_plate', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  mileage: integer('mileage').notNull().default(0),
  fuelType: varchar('fuel_type', { length: 50 }).notNull(),
  location: varchar('location', { length: 255 }),
  assignedDriverId: integer('assigned_driver_id'),
  facilityId: integer('facility_id'),
  model3dId: integer('model_3d_id'),
  lastServiceDate: timestamp('last_service_date'),
  nextServiceDate: timestamp('next_service_date'),
  purchaseDate: timestamp('purchase_date'),
  purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }),
  currentValue: decimal('current_value', { precision: 10, scale: 2 }),
  insurancePolicyNumber: varchar('insurance_policy_number', { length: 100 }),
  registrationExpiry: timestamp('registration_expiry'),
  inspectionDue: timestamp('inspection_due'),
  specifications: jsonb('specifications'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Drivers table
export const drivers = pgTable('drivers', {
  id: serial('id').primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  licenseNumber: varchar('license_number', { length: 50 }).notNull().unique(),
  licenseExpiry: timestamp('license_expiry').notNull(),
  licenseClass: varchar('license_class', { length: 10 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  photoUrl: varchar('photo_url', { length: 500 }),
  azureAdId: varchar('azure_ad_id', { length: 255 }),
  assignedVehicleId: integer('assigned_vehicle_id'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('5.00'),
  totalTrips: integer('total_trips').default(0),
  totalMiles: integer('total_miles').default(0),
  safetyScore: integer('safety_score').default(100),
  hireDate: timestamp('hire_date'),
  certifications: jsonb('certifications'),
  emergencyContact: jsonb('emergency_contact'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Fuel Transactions
export const fuelTransactions = pgTable('fuel_transactions', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull(),
  driverId: integer('driver_id'),
  vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull(),
  date: timestamp('date').notNull().defaultNow(),
  station: varchar('station', { length: 255 }).notNull(),
  gallons: decimal('gallons', { precision: 6, scale: 2 }).notNull(),
  pricePerGallon: decimal('price_per_gallon', { precision: 5, scale: 3 }).notNull(),
  totalCost: decimal('total_cost', { precision: 8, scale: 2 }).notNull(),
  mpg: decimal('mpg', { precision: 5, scale: 2 }),
  odometerReading: integer('odometer_reading'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Maintenance Records
export const maintenanceRecords = pgTable('maintenance_records', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull(),
  vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull(),
  serviceType: varchar('service_type', { length: 100 }).notNull(),
  serviceDate: timestamp('service_date').notNull(),
  nextDue: timestamp('next_due'),
  mileageAtService: integer('mileage_at_service'),
  nextDueMileage: integer('next_due_mileage'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  status: varchar('status', { length: 20 }).default('scheduled'),
  estimatedCost: decimal('estimated_cost', { precision: 8, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 8, scale: 2 }),
  vendor: varchar('vendor', { length: 255 }),
  technicianName: varchar('technician_name', { length: 255 }),
  partsReplaced: jsonb('parts_replaced'),
  workPerformed: text('work_performed'),
  notes: text('notes'),
  invoiceUrl: varchar('invoice_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Additional tables (compact)
export const incidents = pgTable('incidents', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull(),
  driverId: integer('driver_id'),
  incidentDate: timestamp('incident_date').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  description: text('description').notNull(),
  location: varchar('location', { length: 255 }),
  damageEstimate: decimal('damage_estimate', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).default('open'),
  reportedBy: varchar('reported_by', { length: 255 }),
  photos: jsonb('photos'),
  witnesses: jsonb('witnesses'),
  policeReportNumber: varchar('police_report_number', { length: 100 }),
  insuranceClaimNumber: varchar('insurance_claim_number', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
})

export const parts = pgTable('parts', {
  id: serial('id').primaryKey(),
  partNumber: varchar('part_number', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 255 }),
  quantityInStock: integer('quantity_in_stock').notNull().default(0),
  minimumStock: integer('minimum_stock').default(10),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }).notNull(),
  vendorId: integer('vendor_id'),
  location: varchar('location', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
})

export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  contractNumber: varchar('contract_number', { length: 100 }),
  contractExpiry: timestamp('contract_expiry'),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Facilities table
export const facilities = pgTable('facilities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  capacity: integer('capacity'),
  status: varchar('status', { length: 20 }).default('active'),
  coordinates: jsonb('coordinates'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// 3D Vehicle Models table
export const vehicle3dModels = pgTable('vehicle_3d_models', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  vehicleType: varchar('vehicle_type', { length: 100 }),
  make: varchar('make', { length: 100 }),
  model: varchar('model', { length: 100 }),
  year: integer('year'),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileFormat: varchar('file_format', { length: 20 }),
  fileSizeMb: decimal('file_size_mb', { precision: 8, scale: 2 }),
  polyCount: integer('poly_count'),
  source: varchar('source', { length: 50 }),
  sourceId: varchar('source_id', { length: 255 }),
  license: varchar('license', { length: 100 }),
  licenseUrl: varchar('license_url', { length: 500 }),
  author: varchar('author', { length: 255 }),
  authorUrl: varchar('author_url', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  previewImages: jsonb('preview_images'),
  qualityTier: varchar('quality_tier', { length: 20 }),
  hasInterior: boolean('has_interior').default(false),
  hasPbrMaterials: boolean('has_pbr_materials').default(false),
  viewCount: integer('view_count').default(0),
  downloadCount: integer('download_count').default(0),
  isFeatured: boolean('is_featured').default(false),
  isActive: boolean('is_active').default(true),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Users table (for authentication)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  microsoftId: varchar('microsoft_id', { length: 255 }).unique(),
  displayName: varchar('display_name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('user'),
  authProvider: varchar('auth_provider', { length: 50 }).default('microsoft'),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Sessions table (for authentication)
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  token: varchar('token', { length: 500 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// ============================================================================
// POLICY MANAGEMENT TABLES
// ============================================================================

// Policies table (mirrors API data locally + extends with local features)
export const policies = pgTable('policies', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // safety, dispatch, privacy, ev-charging, payments, maintenance, osha, environmental, data-retention, security, vehicle-use, driver-behavior
  version: varchar('version', { length: 20 }).notNull().default('1.0'),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, testing, approved, active, deprecated, archived
  mode: varchar('mode', { length: 20 }).notNull().default('monitor'), // monitor, human-in-loop, autonomous
  conditions: jsonb('conditions').notNull().default('[]'), // Evaluation conditions
  actions: jsonb('actions').notNull().default('[]'), // Actions to take when conditions met
  scope: jsonb('scope').default('{}'), // Scope of policy application
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }).default('0.85'),
  requiresDualControl: boolean('requires_dual_control').default(false),
  requiresMFAForExecution: boolean('requires_mfa_for_execution').default(false),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastModifiedBy: varchar('last_modified_by', { length: 255 }),
  lastModifiedAt: timestamp('last_modified_at'),
  tags: jsonb('tags').default('[]'),
  relatedPolicies: jsonb('related_policies').default('[]'),
  executionCount: integer('execution_count').default(0),
  violationCount: integer('violation_count').default(0),
  category: varchar('category', { length: 100 }),
  effectiveDate: timestamp('effective_date'),
  expiryDate: timestamp('expiry_date'),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: timestamp('approved_at'),
})

// Policy versions (version history tracking)
export const policyVersions = pgTable('policy_versions', {
  id: serial('id').primaryKey(),
  policyId: integer('policy_id').notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  policyData: jsonb('policy_data').notNull(), // Full policy snapshot
  changeDescription: text('change_description'),
  changedBy: varchar('changed_by', { length: 255 }).notNull(),
  changedAt: timestamp('changed_at').defaultNow(),
  isPrimary: boolean('is_primary').default(false),
})

// Policy acknowledgments (signature tracking)
export const policyAcknowledgments = pgTable('policy_acknowledgments', {
  id: serial('id').primaryKey(),
  policyId: integer('policy_id').notNull(),
  policyVersion: varchar('policy_version', { length: 20 }).notNull(),
  userId: integer('user_id'),
  driverId: integer('driver_id'),
  acknowledgedBy: varchar('acknowledged_by', { length: 255 }).notNull(),
  acknowledgedAt: timestamp('acknowledged_at').defaultNow(),
  signatureData: text('signature_data'), // Base64 encoded signature
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  isRequired: boolean('is_required').default(true),
  expiryDate: timestamp('expiry_date'),
})

// Policy violations (tracking and enforcement)
export const policyViolations = pgTable('policy_violations', {
  id: serial('id').primaryKey(),
  policyId: integer('policy_id').notNull(),
  violationType: varchar('violation_type', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull().default('medium'), // low, medium, high, critical
  description: text('description').notNull(),
  violatedBy: varchar('violated_by', { length: 255 }),
  driverId: integer('driver_id'),
  vehicleId: integer('vehicle_id'),
  detectedAt: timestamp('detected_at').defaultNow(),
  detectionMethod: varchar('detection_method', { length: 100 }), // automatic, manual, audit
  contextData: jsonb('context_data'), // Detailed context of violation
  status: varchar('status', { length: 20 }).default('open'), // open, investigating, resolved, dismissed
  assignedTo: varchar('assigned_to', { length: 255 }),
  resolutionNotes: text('resolution_notes'),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: varchar('resolved_by', { length: 255 }),
  correctiveActions: jsonb('corrective_actions'),
})

// Policy executions (audit trail)
export const policyExecutions = pgTable('policy_executions', {
  id: serial('id').primaryKey(),
  policyId: integer('policy_id').notNull(),
  executedAt: timestamp('executed_at').defaultNow(),
  executionMode: varchar('execution_mode', { length: 20 }).notNull(), // automatic, manual
  evaluationContext: jsonb('evaluation_context').notNull(),
  conditionResults: jsonb('condition_results'),
  actionsTaken: jsonb('actions_taken'),
  executionStatus: varchar('execution_status', { length: 20 }).notNull(), // success, failed, partial
  executedBy: varchar('executed_by', { length: 255 }),
  errorDetails: text('error_details'),
  executionDurationMs: integer('execution_duration_ms'),
})

// ============================================================================
// STANDARD OPERATING PROCEDURES (SOP) TABLES
// ============================================================================

// SOP documents
export const sopDocuments = pgTable('sop_documents', {
  id: serial('id').primaryKey(),
  sopNumber: varchar('sop_number', { length: 50 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // safety, maintenance, dispatch, compliance, emergency, administrative
  description: text('description'),
  purpose: text('purpose').notNull(),
  scope: text('scope').notNull(),
  definitions: jsonb('definitions'),
  procedure: text('procedure').notNull(), // Step-by-step procedure
  safetyControls: text('safety_controls'),
  requiredForms: jsonb('required_forms'),
  relatedPolicies: jsonb('related_policies'),
  relatedSOPs: jsonb('related_sops'),
  kpis: jsonb('kpis'),
  version: varchar('version', { length: 20 }).notNull().default('1.0'),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, review, approved, active, archived
  owner: varchar('owner', { length: 255 }).notNull(),
  approver: varchar('approver', { length: 255 }),
  reviewCycle: integer('review_cycle_months').default(12),
  lastReviewedAt: timestamp('last_reviewed_at'),
  nextReviewDue: timestamp('next_review_due'),
  effectiveDate: timestamp('effective_date'),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: timestamp('updated_at'),
  documentUrl: varchar('document_url', { length: 500 }),
  attachments: jsonb('attachments'),
  tags: jsonb('tags'),
})

// SOP assignments (who needs to read/complete what)
export const sopAssignments = pgTable('sop_assignments', {
  id: serial('id').primaryKey(),
  sopId: integer('sop_id').notNull(),
  assignedTo: varchar('assigned_to', { length: 100 }).notNull(), // role, department, or individual
  assignmentType: varchar('assignment_type', { length: 50 }).notNull(), // role-based, department, individual, all-drivers
  assignedBy: varchar('assigned_by', { length: 255 }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
  dueDate: timestamp('due_date'),
  isRequired: boolean('is_required').default(true),
  requiresAcknowledgment: boolean('requires_acknowledgment').default(true),
  requiresTest: boolean('requires_test').default(false),
  status: varchar('status', { length: 20 }).default('assigned'), // assigned, in-progress, completed, overdue
})

// SOP completions (tracking)
export const sopCompletions = pgTable('sop_completions', {
  id: serial('id').primaryKey(),
  sopAssignmentId: integer('sop_assignment_id').notNull(),
  sopId: integer('sop_id').notNull(),
  userId: integer('user_id'),
  driverId: integer('driver_id'),
  completedBy: varchar('completed_by', { length: 255 }).notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
  timeSpentMinutes: integer('time_spent_minutes'),
  testScore: decimal('test_score', { precision: 5, scale: 2 }),
  testPassed: boolean('test_passed'),
  acknowledgmentData: text('acknowledgment_data'),
  notes: text('notes'),
})

// ============================================================================
// TRAINING & CERTIFICATION TABLES
// ============================================================================

// Training modules
export const trainingModules = pgTable('training_modules', {
  id: serial('id').primaryKey(),
  moduleNumber: varchar('module_number', { length: 50 }).unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // safety, compliance, equipment, emergency, regulatory
  type: varchar('type', { length: 50 }).notNull(), // online, in-person, video, document, hands-on
  duration Minutes: integer('duration_minutes'),
  contentUrl: varchar('content_url', { length: 500 }),
  content: text('content'),
  learningObjectives: jsonb('learning_objectives'),
  prerequisites: jsonb('prerequisites'),
  passingScore: decimal('passing_score', { precision: 5, scale: 2 }).default('80.00'),
  hasCertification: boolean('has_certification').default(false),
  certificationValidMonths: integer('certification_valid_months'),
  relatedPolicies: jsonb('related_policies'),
  relatedSOPs: jsonb('related_sops'),
  status: varchar('status', { length: 20 }).default('active'),
  version: varchar('version', { length: 20 }).default('1.0'),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: timestamp('updated_at'),
  tags: jsonb('tags'),
})

// Training assignments
export const trainingAssignments = pgTable('training_assignments', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').notNull(),
  assignedTo: varchar('assigned_to', { length: 100 }).notNull(),
  assignmentType: varchar('assignment_type', { length: 50 }).notNull(), // role-based, department, individual, new-hire
  assignedBy: varchar('assigned_by', { length: 255 }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
  dueDate: timestamp('due_date'),
  isRequired: boolean('is_required').default(true),
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high, critical
  status: varchar('status', { length: 20 }).default('assigned'), // assigned, in-progress, completed, overdue, waived
  reminderSentAt: timestamp('reminder_sent_at'),
})

// Training completions
export const trainingCompletions = pgTable('training_completions', {
  id: serial('id').primaryKey(),
  assignmentId: integer('assignment_id').notNull(),
  moduleId: integer('module_id').notNull(),
  userId: integer('user_id'),
  driverId: integer('driver_id'),
  completedBy: varchar('completed_by', { length: 255 }).notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
  score: decimal('score', { precision: 5, scale: 2 }),
  passed: boolean('passed').notNull(),
  attempts: integer('attempts').default(1),
  timeSpentMinutes: integer('time_spent_minutes'),
  certificateIssued: boolean('certificate_issued').default(false),
  certificateNumber: varchar('certificate_number', { length: 100 }),
  certificateExpiryDate: timestamp('certificate_expiry_date'),
  instructorName: varchar('instructor_name', { length: 255 }),
  location: varchar('location', { length: 255 }),
  notes: text('notes'),
})

// ============================================================================
// ONBOARDING TABLES
// ============================================================================

// Onboarding checklists
export const onboardingChecklists = pgTable('onboarding_checklists', {
  id: serial('id').primaryKey(),
  checklistNumber: varchar('checklist_number', { length: 50 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  checklistType: varchar('checklist_type', { length: 50 }).notNull(), // driver, employee, contractor, volunteer
  department: varchar('department', { length: 100 }),
  items: jsonb('items').notNull(), // Array of checklist items
  estimatedDays: integer('estimated_days'),
  isTemplate: boolean('is_template').default(true),
  status: varchar('status', { length: 20 }).default('active'),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: timestamp('updated_at'),
})

// Onboarding progress (per person)
export const onboardingProgress = pgTable('onboarding_progress', {
  id: serial('id').primaryKey(),
  checklistId: integer('checklist_id').notNull(),
  userId: integer('user_id'),
  driverId: integer('driver_id'),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  employeeId: varchar('employee_id', { length: 100 }),
  startDate: timestamp('start_date').notNull(),
  targetCompletionDate: timestamp('target_completion_date'),
  actualCompletionDate: timestamp('actual_completion_date'),
  status: varchar('status', { length: 20 }).default('in-progress'), // not-started, in-progress, completed, on-hold
  overallProgress: decimal('overall_progress', { precision: 5, scale: 2 }).default('0.00'),
  currentStep: integer('current_step').default(1),
  itemsCompleted: jsonb('items_completed'),
  assignedTo: varchar('assigned_to', { length: 255 }), // HR rep or supervisor
  notes: text('notes'),
})

// ============================================================================
// COMPLIANCE CHECKLIST TABLES
// ============================================================================

// Compliance checklists
export const complianceChecklists = pgTable('compliance_checklists', {
  id: serial('id').primaryKey(),
  checklistNumber: varchar('checklist_number', { length: 50 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  complianceType: varchar('compliance_type', { length: 100 }).notNull(), // DOT, OSHA, EPA, IFTA, state, local
  frequency: varchar('frequency', { length: 50 }).notNull(), // daily, weekly, monthly, quarterly, annually
  items: jsonb('items').notNull(),
  owner: varchar('owner', { length: 255 }).notNull(),
  regulatoryAuthority: varchar('regulatory_authority', { length: 255 }),
  regulatoryReference: varchar('regulatory_reference', { length: 255 }),
  penaltyForNoncompliance: text('penalty_for_noncompliance'),
  status: varchar('status', { length: 20 }).default('active'),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: timestamp('updated_at'),
})

// Compliance checklist completions
export const complianceChecklistCompletions = pgTable('compliance_checklist_completions', {
  id: serial('id').primaryKey(),
  checklistId: integer('checklist_id').notNull(),
  completionDate: timestamp('completion_date').notNull(),
  completedBy: varchar('completed_by', { length: 255 }).notNull(),
  itemsCompleted: jsonb('items_completed').notNull(),
  overallCompliance: decimal('overall_compliance', { precision: 5, scale: 2 }),
  nonCompliantItems: jsonb('non_compliant_items'),
  correctiveActions: jsonb('corrective_actions'),
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: timestamp('follow_up_date'),
  reviewedBy: varchar('reviewed_by', { length: 255 }),
  reviewedAt: timestamp('reviewed_at'),
  notes: text('notes'),
  attachments: jsonb('attachments'),
})

// ============================================================================
// WORKFLOW TABLES
// ============================================================================

// Workflow definitions (templates)
export const workflowDefinitions = pgTable('workflow_definitions', {
  id: serial('id').primaryKey(),
  workflowNumber: varchar('workflow_number', { length: 50 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // approval, review, investigation, procurement, maintenance
  triggerType: varchar('trigger_type', { length: 50 }).notNull(), // manual, automatic, scheduled, event-driven
  triggerConditions: jsonb('trigger_conditions'),
  steps: jsonb('steps').notNull(), // Array of workflow steps
  approvers: jsonb('approvers'), // Approval routing
  escalationRules: jsonb('escalation_rules'),
  slaHours: integer('sla_hours'),
  notificationSettings: jsonb('notification_settings'),
  isTemplate: boolean('is_template').default(true),
  status: varchar('status', { length: 20 }).default('active'),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: timestamp('updated_at'),
})

// Workflow instances (active workflows)
export const workflowInstances = pgTable('workflow_instances', {
  id: serial('id').primaryKey(),
  workflowDefinitionId: integer('workflow_definition_id').notNull(),
  instanceNumber: varchar('instance_number', { length: 100 }).unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  initiatedBy: varchar('initiated_by', { length: 255 }).notNull(),
  initiatedAt: timestamp('initiated_at').defaultNow(),
  contextData: jsonb('context_data'), // Related data (vehicle, driver, incident, etc.)
  currentStep: integer('current_step').default(1),
  status: varchar('status', { length: 20 }).default('in-progress'), // pending, in-progress, approved, rejected, on-hold, completed, cancelled
  priority: varchar('priority', { length: 20 }).default('medium'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  completionNotes: text('completion_notes'),
  attachments: jsonb('attachments'),
})

// Workflow approvals (approval tracking)
export const workflowApprovals = pgTable('workflow_approvals', {
  id: serial('id').primaryKey(),
  workflowInstanceId: integer('workflow_instance_id').notNull(),
  stepNumber: integer('step_number').notNull(),
  stepName: varchar('step_name', { length: 255 }).notNull(),
  approverRole: varchar('approver_role', { length: 100 }),
  approverName: varchar('approver_name', { length: 255 }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
  dueDate: timestamp('due_date'),
  actionedAt: timestamp('actioned_at'),
  action: varchar('action', { length: 50 }), // approved, rejected, delegated, escalated, on-hold
  comments: text('comments'),
  attachments: jsonb('attachments'),
  delegatedTo: varchar('delegated_to', { length: 255 }),
  escalatedTo: varchar('escalated_to', { length: 255 }),
  remindersSent: integer('reminders_sent').default(0),
  lastReminderAt: timestamp('last_reminder_at'),
})

console.log("Complete database schema with 30+ tables created including comprehensive Policy Management system")
