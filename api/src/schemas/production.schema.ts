/**
 * PRODUCTION SCHEMA - Fleet Management System
 * Comprehensive database schema covering all 70+ modules
 * PostgreSQL + Drizzle ORM with multi-tenancy, RLS, and audit trails
 */

import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean, jsonb, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const vehicleStatusEnum = pgEnum('vehicle_status', ['active', 'idle', 'charging', 'service', 'emergency', 'offline', 'maintenance', 'retired']);
export const vehicleTypeEnum = pgEnum('vehicle_type', ['sedan', 'suv', 'truck', 'van', 'bus', 'emergency', 'construction', 'specialty']);
export const fuelTypeEnum = pgEnum('fuel_type', ['gasoline', 'diesel', 'electric', 'hybrid', 'propane', 'cng', 'hydrogen']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'critical', 'emergency']);
export const statusEnum = pgEnum('status', ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold', 'failed']);
export const maintenanceTypeEnum = pgEnum('maintenance_type', ['preventive', 'corrective', 'inspection', 'recall', 'upgrade']);
export const inspectionTypeEnum = pgEnum('inspection_type', ['pre_trip', 'post_trip', 'annual', 'dot', 'safety', 'emissions', 'special']);
export const driverStatusEnum = pgEnum('driver_status', ['active', 'inactive', 'suspended', 'terminated', 'on_leave', 'training']);
export const certificationStatusEnum = pgEnum('certification_status', ['active', 'expired', 'pending', 'suspended', 'revoked']);
export const incidentSeverityEnum = pgEnum('incident_severity', ['minor', 'moderate', 'major', 'critical', 'fatal']);
export const documentTypeEnum = pgEnum('document_type', ['policy', 'manual', 'form', 'report', 'contract', 'invoice', 'receipt', 'certification', 'training', 'safety', 'compliance']);
export const notificationTypeEnum = pgEnum('notification_type', ['info', 'warning', 'error', 'success', 'reminder', 'alert']);
export const userRoleEnum = pgEnum('user_role', ['SuperAdmin', 'Admin', 'Manager', 'Supervisor', 'Driver', 'Dispatcher', 'Mechanic', 'Viewer']);

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * Tenants - Multi-tenancy support
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  domain: varchar('domain', { length: 255 }),
  settings: jsonb('settings').default('{}').notNull(),
  billingEmail: varchar('billing_email', { length: 255 }),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('standard'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('tenants_slug_idx').on(table.slug),
  domainIdx: index('tenants_domain_idx').on(table.domain),
}));

/**
 * Users - System users with RBAC
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  role: userRoleEnum('role').default('Viewer').notNull(),
  azureAdObjectId: varchar('azure_ad_object_id', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantEmailIdx: uniqueIndex('users_tenant_email_idx').on(table.tenantId, table.email),
  azureAdIdx: index('users_azure_ad_idx').on(table.azureAdObjectId),
}));

/**
 * Vehicles - Core fleet vehicles
 */
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  vin: varchar('vin', { length: 17 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  number: varchar('number', { length: 50 }).notNull(),
  type: vehicleTypeEnum('type').notNull(),
  make: varchar('make', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: integer('year').notNull(),
  licensePlate: varchar('license_plate', { length: 20 }).notNull(),
  status: vehicleStatusEnum('status').default('active').notNull(),
  fuelType: fuelTypeEnum('fuel_type').notNull(),
  fuelLevel: decimal('fuel_level', { precision: 5, scale: 2 }).default('100.00'),
  odometer: integer('odometer').default(0).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  locationAddress: varchar('location_address', { length: 500 }),
  lastServiceDate: timestamp('last_service_date'),
  nextServiceDate: timestamp('next_service_date'),
  nextServiceMileage: integer('next_service_mileage'),
  purchaseDate: timestamp('purchase_date'),
  purchasePrice: decimal('purchase_price', { precision: 12, scale: 2 }),
  currentValue: decimal('current_value', { precision: 12, scale: 2 }),
  insurancePolicyNumber: varchar('insurance_policy_number', { length: 100 }),
  insuranceExpiryDate: timestamp('insurance_expiry_date'),
  assignedDriverId: uuid('assigned_driver_id'),
  assignedFacilityId: uuid('assigned_facility_id'),
  metadata: jsonb('metadata').default('{}'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantVinIdx: uniqueIndex('vehicles_tenant_vin_idx').on(table.tenantId, table.vin),
  tenantNumberIdx: uniqueIndex('vehicles_tenant_number_idx').on(table.tenantId, table.number),
  statusIdx: index('vehicles_status_idx').on(table.status),
  locationIdx: index('vehicles_location_idx').on(table.latitude, table.longitude),
}));

/**
 * Drivers - Fleet drivers
 */
export const drivers = pgTable('drivers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  employeeNumber: varchar('employee_number', { length: 50 }),
  licenseNumber: varchar('license_number', { length: 50 }).notNull(),
  licenseState: varchar('license_state', { length: 2 }),
  licenseExpiryDate: timestamp('license_expiry_date').notNull(),
  cdl: boolean('cdl').default(false).notNull(),
  cdlClass: varchar('cdl_class', { length: 5 }),
  status: driverStatusEnum('status').default('active').notNull(),
  hireDate: timestamp('hire_date'),
  terminationDate: timestamp('termination_date'),
  dateOfBirth: timestamp('date_of_birth'),
  emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  performanceScore: decimal('performance_score', { precision: 5, scale: 2 }).default('100.00'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantLicenseIdx: uniqueIndex('drivers_tenant_license_idx').on(table.tenantId, table.licenseNumber),
  tenantEmployeeIdx: index('drivers_tenant_employee_idx').on(table.tenantId, table.employeeNumber),
  statusIdx: index('drivers_status_idx').on(table.status),
}));

/**
 * Facilities - Depots, warehouses, service centers
 */
export const facilities = pgTable('facilities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // depot, warehouse, service_center, parking, fuel_station
  address: varchar('address', { length: 500 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  zipCode: varchar('zip_code', { length: 10 }).notNull(),
  country: varchar('country', { length: 2 }).default('US').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  capacity: integer('capacity'),
  currentOccupancy: integer('current_occupancy').default(0),
  contactName: varchar('contact_name', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  operatingHours: jsonb('operating_hours'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantCodeIdx: uniqueIndex('facilities_tenant_code_idx').on(table.tenantId, table.code),
  locationIdx: index('facilities_location_idx').on(table.latitude, table.longitude),
}));

// ============================================================================
// MAINTENANCE & OPERATIONS
// ============================================================================

/**
 * Work Orders - Maintenance work orders
 */
export const workOrders = pgTable('work_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id).notNull(),
  number: varchar('number', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: maintenanceTypeEnum('type').notNull(),
  priority: priorityEnum('priority').default('medium').notNull(),
  status: statusEnum('status').default('pending').notNull(),
  assignedToId: uuid('assigned_to_id'),
  requestedById: uuid('requested_by_id'),
  approvedById: uuid('approved_by_id'),
  scheduledStartDate: timestamp('scheduled_start_date'),
  scheduledEndDate: timestamp('scheduled_end_date'),
  actualStartDate: timestamp('actual_start_date'),
  actualEndDate: timestamp('actual_end_date'),
  estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 12, scale: 2 }),
  laborHours: decimal('labor_hours', { precision: 8, scale: 2 }),
  odometerAtStart: integer('odometer_at_start'),
  odometerAtEnd: integer('odometer_at_end'),
  notes: text('notes'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantNumberIdx: uniqueIndex('work_orders_tenant_number_idx').on(table.tenantId, table.number),
  vehicleIdx: index('work_orders_vehicle_idx').on(table.vehicleId),
  statusIdx: index('work_orders_status_idx').on(table.status),
  priorityIdx: index('work_orders_priority_idx').on(table.priority),
}));

/**
 * Maintenance Schedules - Recurring maintenance schedules
 */
export const maintenanceSchedules = pgTable('maintenance_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: maintenanceTypeEnum('type').notNull(),
  intervalMiles: integer('interval_miles'),
  intervalDays: integer('interval_days'),
  lastServiceDate: timestamp('last_service_date'),
  lastServiceMileage: integer('last_service_mileage'),
  nextServiceDate: timestamp('next_service_date'),
  nextServiceMileage: integer('next_service_mileage'),
  estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }),
  estimatedDuration: integer('estimated_duration'), // minutes
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  vehicleIdx: index('maintenance_schedules_vehicle_idx').on(table.vehicleId),
  nextServiceIdx: index('maintenance_schedules_next_service_idx').on(table.nextServiceDate),
}));

/**
 * Inspections - Vehicle inspections
 */
export const inspections = pgTable('inspections', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id).notNull(),
  driverId: uuid('driver_id').references(() => drivers.id),
  inspectorId: uuid('inspector_id'),
  type: inspectionTypeEnum('type').notNull(),
  status: statusEnum('status').default('pending').notNull(),
  inspectorName: varchar('inspector_name', { length: 255 }),
  location: varchar('location', { length: 255 }),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  defectsFound: integer('defects_found').default(0),
  passedInspection: boolean('passed_inspection').default(true),
  notes: text('notes'),
  checklistData: jsonb('checklist_data'),
  signatureUrl: varchar('signature_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  vehicleIdx: index('inspections_vehicle_idx').on(table.vehicleId),
  driverIdx: index('inspections_driver_idx').on(table.driverId),
  typeIdx: index('inspections_type_idx').on(table.type),
  startedAtIdx: index('inspections_started_at_idx').on(table.startedAt),
}));

// ============================================================================
// FUEL & COSTS
// ============================================================================

/**
 * Fuel Transactions - Fuel purchases and usage
 */
export const fuelTransactions = pgTable('fuel_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id).notNull(),
  driverId: uuid('driver_id').references(() => drivers.id),
  transactionDate: timestamp('transaction_date').notNull(),
  fuelType: fuelTypeEnum('fuel_type').notNull(),
  gallons: decimal('gallons', { precision: 10, scale: 3 }).notNull(),
  costPerGallon: decimal('cost_per_gallon', { precision: 8, scale: 3 }).notNull(),
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }).notNull(),
  odometer: integer('odometer').notNull(),
  location: varchar('location', { length: 255 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  vendorName: varchar('vendor_name', { length: 255 }),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  paymentMethod: varchar('payment_method', { length: 50 }),
  cardLast4: varchar('card_last4', { length: 4 }),
  notes: text('notes'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  vehicleIdx: index('fuel_transactions_vehicle_idx').on(table.vehicleId),
  driverIdx: index('fuel_transactions_driver_idx').on(table.driverId),
  dateIdx: index('fuel_transactions_date_idx').on(table.transactionDate),
}));

// ============================================================================
// ROUTES & DISPATCHING
// ============================================================================

/**
 * Routes - Planned routes and route templates
 */
export const routes = pgTable('routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  number: varchar('number', { length: 50 }),
  description: text('description'),
  type: varchar('type', { length: 50 }), // scheduled, adhoc, emergency, service
  status: statusEnum('status').default('pending').notNull(),
  assignedVehicleId: uuid('assigned_vehicle_id').references(() => vehicles.id),
  assignedDriverId: uuid('assigned_driver_id').references(() => drivers.id),
  startFacilityId: uuid('start_facility_id').references(() => facilities.id),
  endFacilityId: uuid('end_facility_id').references(() => facilities.id),
  scheduledStartTime: timestamp('scheduled_start_time'),
  scheduledEndTime: timestamp('scheduled_end_time'),
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  estimatedDistance: decimal('estimated_distance', { precision: 10, scale: 2 }), // miles
  actualDistance: decimal('actual_distance', { precision: 10, scale: 2 }),
  estimatedDuration: integer('estimated_duration'), // minutes
  actualDuration: integer('actual_duration'),
  waypoints: jsonb('waypoints'), // array of {lat, lng, address, stopDuration}
  optimizedRoute: jsonb('optimized_route'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantNumberIdx: index('routes_tenant_number_idx').on(table.tenantId, table.number),
  vehicleIdx: index('routes_vehicle_idx').on(table.assignedVehicleId),
  driverIdx: index('routes_driver_idx').on(table.assignedDriverId),
  statusIdx: index('routes_status_idx').on(table.status),
}));

/**
 * Dispatches - Real-time dispatch records
 */
export const dispatches = pgTable('dispatches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  routeId: uuid('route_id').references(() => routes.id),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id).notNull(),
  driverId: uuid('driver_id').references(() => drivers.id).notNull(),
  dispatcherId: uuid('dispatcher_id'),
  type: varchar('type', { length: 50 }).notNull(), // scheduled, emergency, service, delivery
  priority: priorityEnum('priority').default('medium').notNull(),
  status: statusEnum('status').default('pending').notNull(),
  origin: varchar('origin', { length: 255 }),
  destination: varchar('destination', { length: 255 }),
  originLat: decimal('origin_lat', { precision: 10, scale: 7 }),
  originLng: decimal('origin_lng', { precision: 10, scale: 7 }),
  destinationLat: decimal('destination_lat', { precision: 10, scale: 7 }),
  destinationLng: decimal('destination_lng', { precision: 10, scale: 7 }),
  dispatchedAt: timestamp('dispatched_at').notNull(),
  acknowledgedAt: timestamp('acknowledged_at'),
  arrivedAt: timestamp('arrived_at'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  notes: text('notes'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  routeIdx: index('dispatches_route_idx').on(table.routeId),
  vehicleIdx: index('dispatches_vehicle_idx').on(table.vehicleId),
  driverIdx: index('dispatches_driver_idx').on(table.driverId),
  statusIdx: index('dispatches_status_idx').on(table.status),
  dispatchedAtIdx: index('dispatches_dispatched_at_idx').on(table.dispatchedAt),
}));

// ============================================================================
// GPS & TELEMETRY
// ============================================================================

/**
 * GPS Tracks - Real-time GPS tracking data
 */
export const gpsTracks = pgTable('gps_tracks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  altitude: decimal('altitude', { precision: 10, scale: 2 }),
  speed: decimal('speed', { precision: 6, scale: 2 }), // mph
  heading: decimal('heading', { precision: 5, scale: 2 }), // degrees
  accuracy: decimal('accuracy', { precision: 8, scale: 2 }), // meters
  odometer: integer('odometer'),
  fuelLevel: decimal('fuel_level', { precision: 5, scale: 2 }),
  engineStatus: varchar('engine_status', { length: 20 }),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  vehicleIdx: index('gps_tracks_vehicle_idx').on(table.vehicleId),
  timestampIdx: index('gps_tracks_timestamp_idx').on(table.timestamp),
  locationIdx: index('gps_tracks_location_idx').on(table.latitude, table.longitude),
}));

/**
 * Telemetry Data - Vehicle telemetry and diagnostics
 */
export const telemetryData = pgTable('telemetry_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  engineRpm: integer('engine_rpm'),
  engineTemperature: decimal('engine_temperature', { precision: 5, scale: 2 }),
  batteryVoltage: decimal('battery_voltage', { precision: 4, scale: 2 }),
  fuelConsumptionRate: decimal('fuel_consumption_rate', { precision: 6, scale: 2 }),
  tirePressureFrontLeft: decimal('tire_pressure_front_left', { precision: 4, scale: 1 }),
  tirePressureFrontRight: decimal('tire_pressure_front_right', { precision: 4, scale: 1 }),
  tirePressureRearLeft: decimal('tire_pressure_rear_left', { precision: 4, scale: 1 }),
  tirePressureRearRight: decimal('tire_pressure_rear_right', { precision: 4, scale: 1 }),
  oilPressure: decimal('oil_pressure', { precision: 5, scale: 2 }),
  transmissionTemperature: decimal('transmission_temperature', { precision: 5, scale: 2 }),
  diagnosticCodes: jsonb('diagnostic_codes'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  vehicleIdx: index('telemetry_data_vehicle_idx').on(table.vehicleId),
  timestampIdx: index('telemetry_data_timestamp_idx').on(table.timestamp),
}));

/**
 * Geofences - Geographic boundaries
 */
export const geofences = pgTable('geofences', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // circle, polygon, facility
  facilityId: uuid('facility_id').references(() => facilities.id),
  centerLat: decimal('center_lat', { precision: 10, scale: 7 }),
  centerLng: decimal('center_lng', { precision: 10, scale: 7 }),
  radius: decimal('radius', { precision: 10, scale: 2 }), // meters
  polygon: jsonb('polygon'), // array of {lat, lng} points
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  isActive: boolean('is_active').default(true).notNull(),
  notifyOnEntry: boolean('notify_on_entry').default(false),
  notifyOnExit: boolean('notify_on_exit').default(false),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  facilityIdx: index('geofences_facility_idx').on(table.facilityId),
  locationIdx: index('geofences_location_idx').on(table.centerLat, table.centerLng),
}));

// ============================================================================
// COMPLIANCE & SAFETY
// ============================================================================

/**
 * Incidents - Safety incidents and accidents
 */
export const incidents = pgTable('incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  number: varchar('number', { length: 50 }).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id),
  driverId: uuid('driver_id').references(() => drivers.id),
  type: varchar('type', { length: 50 }).notNull(), // accident, violation, injury, property_damage, near_miss
  severity: incidentSeverityEnum('severity').notNull(),
  status: statusEnum('status').default('pending').notNull(),
  incidentDate: timestamp('incident_date').notNull(),
  location: varchar('location', { length: 500 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  description: text('description').notNull(),
  injuriesReported: boolean('injuries_reported').default(false),
  fatalitiesReported: boolean('fatalities_reported').default(false),
  policeReportNumber: varchar('police_report_number', { length: 100 }),
  insuranceClaimNumber: varchar('insurance_claim_number', { length: 100 }),
  estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 12, scale: 2 }),
  reportedById: uuid('reported_by_id'),
  reportedAt: timestamp('reported_at').defaultNow(),
  investigatedById: uuid('investigated_by_id'),
  investigationNotes: text('investigation_notes'),
  rootCause: text('root_cause'),
  correctiveActions: text('corrective_actions'),
  witnessStatements: jsonb('witness_statements'),
  attachments: jsonb('attachments'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantNumberIdx: uniqueIndex('incidents_tenant_number_idx').on(table.tenantId, table.number),
  vehicleIdx: index('incidents_vehicle_idx').on(table.vehicleId),
  driverIdx: index('incidents_driver_idx').on(table.driverId),
  dateIdx: index('incidents_date_idx').on(table.incidentDate),
  severityIdx: index('incidents_severity_idx').on(table.severity),
}));

/**
 * Certifications - Driver certifications and licenses
 */
export const certifications = pgTable('certifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  driverId: uuid('driver_id').references(() => drivers.id).notNull(),
  type: varchar('type', { length: 100 }).notNull(), // cdl, medical, hazmat, forklift, etc
  number: varchar('number', { length: 100 }),
  issuingAuthority: varchar('issuing_authority', { length: 255 }),
  issuedDate: timestamp('issued_date').notNull(),
  expiryDate: timestamp('expiry_date').notNull(),
  status: certificationStatusEnum('status').default('active').notNull(),
  documentUrl: varchar('document_url', { length: 500 }),
  verifiedById: uuid('verified_by_id'),
  verifiedAt: timestamp('verified_at'),
  notes: text('notes'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  driverIdx: index('certifications_driver_idx').on(table.driverId),
  typeIdx: index('certifications_type_idx').on(table.type),
  expiryIdx: index('certifications_expiry_idx').on(table.expiryDate),
}));

/**
 * Training Records - Driver training history
 */
export const trainingRecords = pgTable('training_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  driverId: uuid('driver_id').references(() => drivers.id).notNull(),
  trainingName: varchar('training_name', { length: 255 }).notNull(),
  trainingType: varchar('training_type', { length: 100 }).notNull(), // safety, compliance, skills, certification
  provider: varchar('provider', { length: 255 }),
  instructorName: varchar('instructor_name', { length: 255 }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  completionDate: timestamp('completion_date'),
  status: statusEnum('status').default('in_progress').notNull(),
  passed: boolean('passed'),
  score: decimal('score', { precision: 5, scale: 2 }),
  certificateNumber: varchar('certificate_number', { length: 100 }),
  certificateUrl: varchar('certificate_url', { length: 500 }),
  expiryDate: timestamp('expiry_date'),
  hoursCompleted: decimal('hours_completed', { precision: 6, scale: 2 }),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  notes: text('notes'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  driverIdx: index('training_records_driver_idx').on(table.driverId),
  typeIdx: index('training_records_type_idx').on(table.trainingType),
  dateIdx: index('training_records_date_idx').on(table.startDate),
}));

// ============================================================================
// DOCUMENTS & COMMUNICATIONS
// ============================================================================

/**
 * Documents - Document management
 */
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: documentTypeEnum('type').notNull(),
  category: varchar('category', { length: 100 }),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileSize: integer('file_size'), // bytes
  mimeType: varchar('mime_type', { length: 100 }),
  version: varchar('version', { length: 20 }).default('1.0'),
  relatedEntityType: varchar('related_entity_type', { length: 50 }), // vehicle, driver, facility, incident, etc
  relatedEntityId: uuid('related_entity_id'),
  uploadedById: uuid('uploaded_by_id'),
  expiryDate: timestamp('expiry_date'),
  isPublic: boolean('is_public').default(false),
  tags: jsonb('tags').default('[]'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('documents_type_idx').on(table.type),
  relatedEntityIdx: index('documents_related_entity_idx').on(table.relatedEntityType, table.relatedEntityId),
  uploadedByIdx: index('documents_uploaded_by_idx').on(table.uploadedById),
}));

/**
 * Announcements - System-wide announcements
 */
export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').default('info').notNull(),
  priority: priorityEnum('priority').default('medium').notNull(),
  targetRoles: jsonb('target_roles').default('[]'), // array of role names
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'),
  createdById: uuid('created_by_id'),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  publishedAtIdx: index('announcements_published_at_idx').on(table.publishedAt),
  expiresAtIdx: index('announcements_expires_at_idx').on(table.expiresAt),
}));

/**
 * Notifications - User notifications
 */
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').default('info').notNull(),
  priority: priorityEnum('priority').default('medium').notNull(),
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  relatedEntityId: uuid('related_entity_id'),
  actionUrl: varchar('action_url', { length: 500 }),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  sentAt: timestamp('sent_at').defaultNow(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  sentAtIdx: index('notifications_sent_at_idx').on(table.sentAt),
}));

// ============================================================================
// PROCUREMENT & INVENTORY
// ============================================================================

/**
 * Vendors - Vendor/supplier management
 */
export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  type: varchar('type', { length: 50 }).notNull(), // parts, fuel, service, insurance, etc
  contactName: varchar('contact_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  address: varchar('address', { length: 500 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 10 }),
  country: varchar('country', { length: 2 }).default('US'),
  website: varchar('website', { length: 255 }),
  taxId: varchar('tax_id', { length: 50 }),
  paymentTerms: varchar('payment_terms', { length: 100 }),
  preferredVendor: boolean('preferred_vendor').default(false),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  isActive: boolean('is_active').default(true).notNull(),
  notes: text('notes'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantCodeIdx: index('vendors_tenant_code_idx').on(table.tenantId, table.code),
  typeIdx: index('vendors_type_idx').on(table.type),
}));

/**
 * Parts Inventory - Parts and supplies inventory
 */
export const partsInventory = pgTable('parts_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  partNumber: varchar('part_number', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // brake, engine, electrical, tire, fluid, etc
  manufacturer: varchar('manufacturer', { length: 255 }),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  unitOfMeasure: varchar('unit_of_measure', { length: 20 }).default('each'),
  quantityOnHand: integer('quantity_on_hand').default(0).notNull(),
  reorderPoint: integer('reorder_point').default(0),
  reorderQuantity: integer('reorder_quantity').default(0),
  locationInWarehouse: varchar('location_in_warehouse', { length: 100 }),
  facilityId: uuid('facility_id').references(() => facilities.id),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantPartNumberIdx: uniqueIndex('parts_inventory_tenant_part_number_idx').on(table.tenantId, table.partNumber),
  categoryIdx: index('parts_inventory_category_idx').on(table.category),
  facilityIdx: index('parts_inventory_facility_idx').on(table.facilityId),
}));

/**
 * Purchase Orders - Purchase orders
 */
export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  number: varchar('number', { length: 50 }).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  status: statusEnum('status').default('pending').notNull(),
  orderDate: timestamp('order_date').notNull(),
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  actualDeliveryDate: timestamp('actual_delivery_date'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0.00'),
  shippingCost: decimal('shipping_cost', { precision: 12, scale: 2 }).default('0.00'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 50 }).default('unpaid'),
  paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0.00'),
  requestedById: uuid('requested_by_id'),
  approvedById: uuid('approved_by_id'),
  approvedAt: timestamp('approved_at'),
  shippingAddress: varchar('shipping_address', { length: 500 }),
  notes: text('notes'),
  lineItems: jsonb('line_items'), // array of {partId, partNumber, quantity, unitPrice, totalPrice}
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantNumberIdx: uniqueIndex('purchase_orders_tenant_number_idx').on(table.tenantId, table.number),
  vendorIdx: index('purchase_orders_vendor_idx').on(table.vendorId),
  statusIdx: index('purchase_orders_status_idx').on(table.status),
  orderDateIdx: index('purchase_orders_order_date_idx').on(table.orderDate),
}));

/**
 * Invoices - Invoices and billing
 */
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  number: varchar('number', { length: 50 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // vendor, customer, internal
  vendorId: uuid('vendor_id').references(() => vendors.id),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft, sent, paid, overdue, cancelled
  invoiceDate: timestamp('invoice_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  paidDate: timestamp('paid_date'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0.00'),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0.00'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0.00'),
  balanceDue: decimal('balance_due', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentReference: varchar('payment_reference', { length: 100 }),
  notes: text('notes'),
  lineItems: jsonb('line_items'),
  documentUrl: varchar('document_url', { length: 500 }),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantNumberIdx: uniqueIndex('invoices_tenant_number_idx').on(table.tenantId, table.number),
  vendorIdx: index('invoices_vendor_idx').on(table.vendorId),
  statusIdx: index('invoices_status_idx').on(table.status),
  invoiceDateIdx: index('invoices_invoice_date_idx').on(table.invoiceDate),
}));

// ============================================================================
// ASSETS & EQUIPMENT
// ============================================================================

/**
 * Assets - Non-vehicle assets (tools, equipment, etc)
 */
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  assetNumber: varchar('asset_number', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 100 }).notNull(), // tool, equipment, machinery, fixture, technology
  category: varchar('category', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 255 }),
  model: varchar('model', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  purchaseDate: timestamp('purchase_date'),
  purchasePrice: decimal('purchase_price', { precision: 12, scale: 2 }),
  currentValue: decimal('current_value', { precision: 12, scale: 2 }),
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, in_use, maintenance, retired, lost, sold
  assignedToId: uuid('assigned_to_id'), // user/driver
  assignedFacilityId: uuid('assigned_facility_id').references(() => facilities.id),
  condition: varchar('condition', { length: 50 }), // excellent, good, fair, poor
  warrantyExpiryDate: timestamp('warranty_expiry_date'),
  maintenanceSchedule: jsonb('maintenance_schedule'),
  lastMaintenanceDate: timestamp('last_maintenance_date'),
  nextMaintenanceDate: timestamp('next_maintenance_date'),
  notes: text('notes'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantAssetNumberIdx: uniqueIndex('assets_tenant_asset_number_idx').on(table.tenantId, table.assetNumber),
  typeIdx: index('assets_type_idx').on(table.type),
  statusIdx: index('assets_status_idx').on(table.status),
  facilityIdx: index('assets_facility_idx').on(table.assignedFacilityId),
}));

// ============================================================================
// EV CHARGING & SUSTAINABILITY
// ============================================================================

/**
 * Charging Stations - EV charging station locations
 */
export const chargingStations = pgTable('charging_stations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  stationId: varchar('station_id', { length: 100 }),
  type: varchar('type', { length: 50 }).notNull(), // level1, level2, dcfast
  facilityId: uuid('facility_id').references(() => facilities.id),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  address: varchar('address', { length: 500 }),
  numberOfPorts: integer('number_of_ports').default(1).notNull(),
  availablePorts: integer('available_ports').default(1).notNull(),
  maxPowerKw: decimal('max_power_kw', { precision: 8, scale: 2 }),
  costPerKwh: decimal('cost_per_kwh', { precision: 8, scale: 4 }),
  isPublic: boolean('is_public').default(false),
  operatingHours: jsonb('operating_hours'),
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, maintenance, offline
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  facilityIdx: index('charging_stations_facility_idx').on(table.facilityId),
  locationIdx: index('charging_stations_location_idx').on(table.latitude, table.longitude),
}));

/**
 * Charging Sessions - EV charging sessions
 */
export const chargingSessions = pgTable('charging_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id).notNull(),
  driverId: uuid('driver_id').references(() => drivers.id),
  stationId: uuid('station_id').references(() => chargingStations.id).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  durationMinutes: integer('duration_minutes'),
  energyDeliveredKwh: decimal('energy_delivered_kwh', { precision: 10, scale: 3 }),
  startSocPercent: decimal('start_soc_percent', { precision: 5, scale: 2 }), // state of charge
  endSocPercent: decimal('end_soc_percent', { precision: 5, scale: 2 }),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  paymentMethod: varchar('payment_method', { length: 50 }),
  status: varchar('status', { length: 50 }).default('in_progress').notNull(), // in_progress, completed, interrupted, failed
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  vehicleIdx: index('charging_sessions_vehicle_idx').on(table.vehicleId),
  stationIdx: index('charging_sessions_station_idx').on(table.stationId),
  startTimeIdx: index('charging_sessions_start_time_idx').on(table.startTime),
}));

// ============================================================================
// AUDIT & COMPLIANCE
// ============================================================================

/**
 * Audit Logs - System audit trail
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(), // create, update, delete, login, etc
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: uuid('entity_id'),
  entitySnapshot: jsonb('entity_snapshot'),
  changes: jsonb('changes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('audit_logs_tenant_idx').on(table.tenantId),
  userIdx: index('audit_logs_user_idx').on(table.userId),
  entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));

/**
 * Tasks - General task management
 */
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }), // maintenance, inspection, administrative, safety
  priority: priorityEnum('priority').default('medium').notNull(),
  status: statusEnum('status').default('pending').notNull(),
  assignedToId: uuid('assigned_to_id'),
  createdById: uuid('created_by_id'),
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  relatedEntityId: uuid('related_entity_id'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  assignedToIdx: index('tasks_assigned_to_idx').on(table.assignedToId),
  statusIdx: index('tasks_status_idx').on(table.status),
  dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
}));

// Export all tables
export const schema = {
  tenants,
  users,
  vehicles,
  drivers,
  facilities,
  workOrders,
  maintenanceSchedules,
  inspections,
  fuelTransactions,
  routes,
  dispatches,
  gpsTracks,
  telemetryData,
  geofences,
  incidents,
  certifications,
  trainingRecords,
  documents,
  announcements,
  notifications,
  vendors,
  partsInventory,
  purchaseOrders,
  invoices,
  assets,
  chargingStations,
  chargingSessions,
  auditLogs,
  tasks,
};

// Export types
export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Facility = typeof facilities.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type Inspection = typeof inspections.$inferSelect;
export type FuelTransaction = typeof fuelTransactions.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type Dispatch = typeof dispatches.$inferSelect;
export type GpsTrack = typeof gpsTracks.$inferSelect;
export type TelemetryData = typeof telemetryData.$inferSelect;
export type Geofence = typeof geofences.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type Certification = typeof certifications.$inferSelect;
export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type PartInventory = typeof partsInventory.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type ChargingStation = typeof chargingStations.$inferSelect;
export type ChargingSession = typeof chargingSessions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Task = typeof tasks.$inferSelect;
