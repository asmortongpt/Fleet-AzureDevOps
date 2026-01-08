/**
 * API Response Schemas
 * Zod schemas for validating API responses and ensuring type safety
 *
 * These schemas define the exact structure returned from the backend API
 * Backend uses snake_case for field names (database convention)
 */

import { z } from 'zod'

// ============================================================================
// Vehicle Response Schema
// ============================================================================

export const VehicleResponseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  vin: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number(),
  license_plate: z.string().nullable().optional(),
  vehicle_type: z.string().nullable().optional(),
  fuel_type: z.string().nullable().optional(),
  status: z.enum(['active', 'maintenance', 'out_of_service', 'sold', 'retired']).default('active'),
  odometer: z.number().nullable().optional(),
  engine_hours: z.number().nullable().optional(),
  purchase_date: z.string().nullable().optional(),
  purchase_price: z.number().nullable().optional(),
  current_value: z.number().nullable().optional(),
  gps_device_id: z.string().nullable().optional(),
  last_gps_update: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  assigned_driver_id: z.string().uuid().nullable().optional(),
  assigned_facility_id: z.string().uuid().nullable().optional(),
  telematics_data: z.record(z.any()).nullable().optional(),
  photos: z.array(z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type VehicleResponse = z.infer<typeof VehicleResponseSchema>

// ============================================================================
// Driver Response Schema
// ============================================================================

export const DriverResponseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(),
  license_number: z.string(),
  license_state: z.string().nullable().optional(),
  license_expiration: z.string().nullable().optional(),
  cdl_class: z.string().nullable().optional(),
  cdl_endorsements: z.array(z.string()).nullable().optional(),
  medical_card_expiration: z.string().nullable().optional(),
  hire_date: z.string().nullable().optional(),
  termination_date: z.string().nullable().optional(),
  status: z.enum(['active', 'on_leave', 'suspended', 'terminated']).default('active'),
  safety_score: z.number().nullable().optional(),
  total_miles_driven: z.number().nullable().optional(),
  total_hours_driven: z.number().nullable().optional(),
  incidents_count: z.number().default(0),
  violations_count: z.number().default(0),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  // Extended fields from join
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
})

export type DriverResponse = z.infer<typeof DriverResponseSchema>

// ============================================================================
// Work Order Response Schema
// ============================================================================

export const WorkOrderResponseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  work_order_number: z.string(),
  vehicle_id: z.string().uuid(),
  facility_id: z.string().uuid().nullable().optional(),
  assigned_technician_id: z.string().uuid().nullable().optional(),
  type: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['open', 'in_progress', 'on_hold', 'completed', 'cancelled']).default('open'),
  description: z.string(),
  odometer_reading: z.number().nullable().optional(),
  engine_hours_reading: z.number().nullable().optional(),
  scheduled_start: z.string().nullable().optional(),
  scheduled_end: z.string().nullable().optional(),
  actual_start: z.string().nullable().optional(),
  actual_end: z.string().nullable().optional(),
  labor_hours: z.number().nullable().optional(),
  labor_cost: z.number().nullable().optional(),
  parts_cost: z.number().nullable().optional(),
  total_cost: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  // Extended fields
  vehicle_vin: z.string().nullable().optional(),
  vehicle_make: z.string().nullable().optional(),
  vehicle_model: z.string().nullable().optional(),
  technician_name: z.string().nullable().optional(),
})

export type WorkOrderResponse = z.infer<typeof WorkOrderResponseSchema>

// ============================================================================
// Fuel Transaction Response Schema
// ============================================================================

export const FuelTransactionResponseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  driver_id: z.string().uuid().nullable().optional(),
  transaction_date: z.string(),
  station_name: z.string().nullable().optional(),
  station_address: z.string().nullable().optional(),
  fuel_type: z.string(),
  quantity_gallons: z.number(),
  price_per_gallon: z.number(),
  total_cost: z.number(),
  odometer_reading: z.number().nullable().optional(),
  mpg: z.number().nullable().optional(),
  payment_method: z.string().nullable().optional(),
  receipt_image_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  // Extended fields
  vehicle_vin: z.string().nullable().optional(),
  driver_name: z.string().nullable().optional(),
})

export type FuelTransactionResponse = z.infer<typeof FuelTransactionResponseSchema>

// ============================================================================
// Maintenance Request Response Schema
// ============================================================================

export const MaintenanceRequestResponseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  requested_by_id: z.string().uuid(),
  issue_type: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  description: z.string(),
  request_date: z.string(),
  status: z.enum(['pending', 'approved', 'in_progress', 'completed', 'rejected']).default('pending'),
  approved_by_id: z.string().uuid().nullable().optional(),
  approved_date: z.string().nullable().optional(),
  work_order_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  // Extended fields
  vehicle_vin: z.string().nullable().optional(),
  requester_name: z.string().nullable().optional(),
})

export type MaintenanceRequestResponse = z.infer<typeof MaintenanceRequestResponseSchema>

// ============================================================================
// Asset Response Schema (for Asset Management)
// ============================================================================

export const AssetResponseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  asset_tag: z.string(),
  asset_name: z.string(),
  asset_type: z.string(),
  category: z.string(),
  description: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  purchase_date: z.string().nullable().optional(),
  purchase_price: z.number().nullable().optional(),
  current_value: z.number().nullable().optional(),
  depreciation_rate: z.number().nullable().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'needs_repair']).default('good'),
  status: z.enum(['active', 'in_use', 'maintenance', 'retired', 'disposed']).default('active'),
  location: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  warranty_expiration: z.string().nullable().optional(), // Database field name
  last_maintenance: z.string().nullable().optional(),
  qr_code_data: z.string().nullable().optional(), // Database field name
  specifications: z.record(z.any()).nullable().optional(),
  photo_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  // Extended fields
  assigned_to_name: z.string().nullable().optional(),
  history_count: z.number().nullable().optional(),
  next_maintenance: z.string().nullable().optional(),
})

export type AssetResponse = z.infer<typeof AssetResponseSchema>

// ============================================================================
// Maintenance Schedule Response Schema
// ============================================================================

export const MaintenanceScheduleResponseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  service_type: z.string(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'mileage-based']),
  interval_miles: z.number().nullable().optional(),
  last_performed: z.string().nullable().optional(),
  next_due: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigned_vendor_id: z.string().uuid().nullable().optional(),
  assigned_technician: z.string().nullable().optional(),
  estimated_cost: z.number().nullable().optional(),
  status: z.enum(['scheduled', 'due', 'overdue', 'completed']).default('scheduled'),
  auto_schedule: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  // Extended fields
  vehicle_vin: z.string().nullable().optional(),
})

export type MaintenanceScheduleResponse = z.infer<typeof MaintenanceScheduleResponseSchema>

// ============================================================================
// Helper: Validate Array Response
// ============================================================================

export function validateArrayResponse<T>(
  schema: z.ZodType<T>,
  data: unknown
): T[] {
  return z.array(schema).parse(data)
}

export function validateSingleResponse<T>(
  schema: z.ZodType<T>,
  data: unknown
): T {
  return schema.parse(data)
}
