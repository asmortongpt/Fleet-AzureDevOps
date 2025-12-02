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

console.log("Complete database schema with 13+ tables created")
