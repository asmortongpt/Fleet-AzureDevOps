/**
 * Zod Validation Schemas for Input Validation
 *
 * Defines validation rules for all resource types to prevent invalid data
 * and enforce business rules at the API boundary.
 */

import { z } from 'zod'

// ============================================================================
// User Schemas
// ============================================================================

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(20).optional(),
  department: z.string().max(100).optional(),
  job_title: z.string().max(100).optional(),
  employee_id: z.string().max(50).optional(),
  license_number: z.string().max(50).optional(),
  license_state: z.string().length(2).optional(),
  license_expiry: z.string().datetime().optional(),
  hire_date: z.string().datetime().optional(),
  emergency_contact: z.string().max(255).optional(),
  emergency_phone: z.string().max(20).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional()
})

export const updateUserSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  department: z.string().max(100).optional(),
  job_title: z.string().max(100).optional(),
  employee_id: z.string().max(50).optional(),
  license_number: z.string().max(50).optional(),
  license_state: z.string().length(2).optional(),
  license_expiry: z.string().datetime().optional(),
  emergency_contact: z.string().max(255).optional(),
  emergency_phone: z.string().max(20).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional()
})

// ============================================================================
// Registration Schema (Special Case - Prevents Role Elevation)
// ============================================================================

export const registerUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(20).optional()
  // NOTE: Role is NOT accepted - always defaults to 'viewer' in backend
})

// ============================================================================
// Vehicle Schemas
// ============================================================================

export const createVehicleSchema = z.object({
  vin: z.string()
    .length(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, 'Invalid VIN format (excluding I, O, Q)'),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2),
  license_plate: z.string().max(20).optional(),
  license_state: z.string().length(2).optional(),
  vehicle_type: z.string().max(50).optional(),
  fuel_type: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  current_mileage: z.number().int().min(0).optional(),
  purchase_date: z.string().datetime().optional(),
  purchase_price: z.number().positive().optional(),
  department: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
  notes: z.string().optional(),
  engine_type: z.string().max(100).optional(),
  transmission: z.string().max(50).optional(),
  seating_capacity: z.number().int().min(1).max(100).optional(),
  // Multi-asset fields
  asset_category: z.string().max(50).optional(),
  asset_type: z.string().max(50).optional(),
  power_type: z.string().max(50).optional(),
  operational_status: z.string().max(50).optional(),
  primary_metric: z.string().max(50).optional(),
  is_road_legal: z.boolean().optional(),
  location_id: z.string().uuid().optional(),
  group_id: z.string().uuid().optional(),
  fleet_id: z.string().uuid().optional()
})

export const updateVehicleSchema = z.object({
  make: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional(),
  license_plate: z.string().max(20).optional(),
  license_state: z.string().length(2).optional(),
  vehicle_type: z.string().max(50).optional(),
  fuel_type: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  current_mileage: z.number().int().min(0).optional(),
  department: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
  notes: z.string().optional(),
  engine_type: z.string().max(100).optional(),
  transmission: z.string().max(50).optional(),
  seating_capacity: z.number().int().min(1).max(100).optional(),
  // Multi-asset fields
  asset_category: z.string().max(50).optional(),
  asset_type: z.string().max(50).optional(),
  power_type: z.string().max(50).optional(),
  operational_status: z.string().max(50).optional(),
  primary_metric: z.string().max(50).optional(),
  is_road_legal: z.boolean().optional(),
  location_id: z.string().uuid().optional(),
  group_id: z.string().uuid().optional(),
  fleet_id: z.string().uuid().optional()
})

// ============================================================================
// Vendor Schemas
// ============================================================================

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(255),
  contact_name: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  vendor_type: z.string().max(50).optional(),
  payment_terms: z.string().max(100).optional(),
  tax_id: z.string().max(50).optional(),
  notes: z.string().optional(),
  primary_contact: z.string().max(255).optional(),
  secondary_contact: z.string().max(255).optional(),
  preferred_payment_method: z.string().max(50).optional()
})

export const updateVendorSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  contact_name: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  vendor_type: z.string().max(50).optional(),
  payment_terms: z.string().max(100).optional(),
  tax_id: z.string().max(50).optional(),
  notes: z.string().optional(),
  primary_contact: z.string().max(255).optional(),
  secondary_contact: z.string().max(255).optional(),
  preferred_payment_method: z.string().max(50).optional()
})

// ============================================================================
// Purchase Order Schemas
// ============================================================================

export const createPurchaseOrderSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  order_number: z.string().min(1).max(100).optional(),
  description: z.string().min(1, 'Description is required'),
  total_amount: z.number().positive('Total amount must be positive'),
  currency: z.string().length(3).default('USD'),
  due_date: z.string().datetime().optional(),
  shipping_address: z.string().max(500).optional(),
  billing_address: z.string().max(500).optional(),
  notes: z.string().optional(),
  line_items: z.array(z.any()).optional(),
  tax_amount: z.number().min(0).optional(),
  shipping_amount: z.number().min(0).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
})

export const updatePurchaseOrderSchema = z.object({
  vendor_id: z.string().uuid().optional(),
  order_number: z.string().min(1).max(100).optional(),
  description: z.string().min(1).optional(),
  total_amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  due_date: z.string().datetime().optional(),
  shipping_address: z.string().max(500).optional(),
  billing_address: z.string().max(500).optional(),
  notes: z.string().optional(),
  line_items: z.array(z.any()).optional(),
  tax_amount: z.number().min(0).optional(),
  shipping_amount: z.number().min(0).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
})

// ============================================================================
// Inspection Schemas
// ============================================================================

export const createInspectionSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  inspector_id: z.string().uuid('Invalid inspector ID').optional(),
  inspection_type: z.string().min(1, 'Inspection type is required').max(100),
  inspection_date: z.string().datetime(),
  mileage: z.number().int().min(0).optional(),
  location: z.string().max(255).optional(),
  notes: z.string().optional(),
  inspection_items: z.array(z.any()).optional(),
  defects_found: z.array(z.any()).optional(),
  maintenance_required: z.boolean().optional()
})

export const updateInspectionSchema = z.object({
  inspection_type: z.string().min(1).max(100).optional(),
  inspection_date: z.string().datetime().optional(),
  mileage: z.number().int().min(0).optional(),
  location: z.string().max(255).optional(),
  notes: z.string().optional(),
  inspection_items: z.array(z.any()).optional(),
  defects_found: z.array(z.any()).optional(),
  maintenance_required: z.boolean().optional()
})

// ============================================================================
// Maintenance Schedule Schemas
// ============================================================================

export const createMaintenanceScheduleSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  service_type: z.string().min(1, 'Service type is required').max(100),
  description: z.string().optional(),
  frequency_type: z.enum(['mileage', 'time', 'both']),
  frequency_value: z.number().int().positive(),
  last_service_date: z.string().datetime().optional(),
  last_service_mileage: z.number().int().min(0).optional(),
  next_service_date: z.string().datetime().optional(),
  next_service_mileage: z.number().int().min(0).optional(),
  estimated_cost: z.number().positive().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  notes: z.string().optional()
})

export const updateMaintenanceScheduleSchema = z.object({
  service_type: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  frequency_type: z.enum(['mileage', 'time', 'both']).optional(),
  frequency_value: z.number().int().positive().optional(),
  last_service_date: z.string().datetime().optional(),
  last_service_mileage: z.number().int().min(0).optional(),
  next_service_date: z.string().datetime().optional(),
  next_service_mileage: z.number().int().min(0).optional(),
  estimated_cost: z.number().positive().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  notes: z.string().optional()
})

// ============================================================================
// Work Order Schemas
// ============================================================================

export const createWorkOrderSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().datetime().optional(),
  estimated_cost: z.number().positive().optional(),
  estimated_hours: z.number().positive().optional(),
  assigned_to: z.string().uuid().optional(),
  parts_required: z.array(z.any()).optional(),
  notes: z.string().optional()
})

export const updateWorkOrderSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().datetime().optional(),
  estimated_cost: z.number().positive().optional(),
  estimated_hours: z.number().positive().optional(),
  assigned_to: z.string().uuid().optional(),
  parts_required: z.array(z.any()).optional(),
  notes: z.string().optional()
})

// ============================================================================
// Fuel Transaction Schemas
// ============================================================================

export const createFuelTransactionSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  driver_id: z.string().uuid('Invalid driver ID').optional(),
  transaction_date: z.string().datetime(),
  gallons: z.number().positive('Gallons must be positive'),
  cost: z.number().positive('Cost must be positive'),
  price_per_gallon: z.number().positive('Price per gallon must be positive'),
  mileage: z.number().int().min(0).optional(),
  location: z.string().max(255).optional(),
  fuel_type: z.string().max(50).optional(),
  receipt_number: z.string().max(100).optional(),
  notes: z.string().optional()
})

export const updateFuelTransactionSchema = z.object({
  transaction_date: z.string().datetime().optional(),
  gallons: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  price_per_gallon: z.number().positive().optional(),
  mileage: z.number().int().min(0).optional(),
  location: z.string().max(255).optional(),
  fuel_type: z.string().max(50).optional(),
  receipt_number: z.string().max(100).optional(),
  notes: z.string().optional()
})

// ============================================================================
// Safety Incident Schemas
// ============================================================================

export const createSafetyIncidentSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  driver_id: z.string().uuid('Invalid driver ID').optional(),
  incident_date: z.string().datetime(),
  incident_type: z.string().min(1, 'Incident type is required').max(100),
  severity: z.enum(['minor', 'moderate', 'severe', 'critical']),
  location: z.string().max(255).optional(),
  description: z.string().min(1, 'Description is required'),
  injuries: z.boolean().optional(),
  property_damage: z.boolean().optional(),
  police_report_number: z.string().max(100).optional(),
  witness_names: z.array(z.string()).optional(),
  witness_contacts: z.array(z.string()).optional(),
  notes: z.string().optional()
})

export const updateSafetyIncidentSchema = z.object({
  incident_date: z.string().datetime().optional(),
  incident_type: z.string().min(1).max(100).optional(),
  severity: z.enum(['minor', 'moderate', 'severe', 'critical']).optional(),
  location: z.string().max(255).optional(),
  description: z.string().min(1).optional(),
  injuries: z.boolean().optional(),
  property_damage: z.boolean().optional(),
  police_report_number: z.string().max(100).optional(),
  witness_names: z.array(z.string()).optional(),
  witness_contacts: z.array(z.string()).optional(),
  notes: z.string().optional()
})

// ============================================================================
// Geofence Schemas
// ============================================================================

export const createGeofenceSchema = z.object({
  name: z.string().min(1, 'Geofence name is required').max(255),
  description: z.string().optional(),
  fence_type: z.enum(['circular', 'polygon']),
  coordinates: z.array(z.number()).min(2, 'Coordinates required'),
  radius: z.number().positive().optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional(),
  is_active: z.boolean().default(true),
  entry_notification: z.boolean().default(false),
  exit_notification: z.boolean().default(false),
  color: z.string().max(20).optional()
})

export const updateGeofenceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  fence_type: z.enum(['circular', 'polygon']).optional(),
  coordinates: z.array(z.number()).min(2).optional(),
  radius: z.number().positive().optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional(),
  is_active: z.boolean().optional(),
  entry_notification: z.boolean().optional(),
  exit_notification: z.boolean().optional(),
  color: z.string().max(20).optional()
})

// ============================================================================
// Facility Schemas
// ============================================================================

export const createFacilitySchema = z.object({
  name: z.string().min(1, 'Facility name is required').max(255),
  facility_type: z.string().max(100).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional(),
  country: z.string().max(100).default('USA'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capacity: z.number().int().min(0).optional(),
  operating_hours: z.string().max(255).optional(),
  contact_name: z.string().max(255).optional(),
  contact_phone: z.string().max(20).optional(),
  contact_email: z.string().email().optional(),
  notes: z.string().optional()
})

export const updateFacilitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  facility_type: z.string().max(100).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capacity: z.number().int().min(0).optional(),
  operating_hours: z.string().max(255).optional(),
  contact_name: z.string().max(255).optional(),
  contact_phone: z.string().max(20).optional(),
  contact_email: z.string().email().optional(),
  notes: z.string().optional()
})
