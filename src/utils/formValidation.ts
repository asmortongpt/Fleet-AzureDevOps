/**
 * Form Validation Utilities
 * Provides reusable validation functions for common form fields
 */

import { z } from 'zod';

// ============================================================================
// Basic Validators
// ============================================================================

export const emailValidator = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const phoneValidator = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    'Invalid phone number format'
  );

export const vinValidator = z
  .string()
  .length(17, 'VIN must be exactly 17 characters')
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format');

export const licensePlateValidator = z
  .string()
  .min(1, 'License plate is required')
  .max(10, 'License plate must not exceed 10 characters')
  .regex(/^[A-Z0-9-]+$/, 'Invalid license plate format');

export const zipCodeValidator = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format');

export const urlValidator = z
  .string()
  .url('Invalid URL format')
  .optional()
  .or(z.literal(''));

export const passwordValidator = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ============================================================================
// Vehicle Schemas
// ============================================================================

export const vehicleSchema = z.object({
  number: z.string().min(1, 'Vehicle number is required'),
  type: z.enum([
    'sedan',
    'suv',
    'truck',
    'van',
    'emergency',
    'specialty',
    'tractor',
    'forklift',
    'trailer',
    'construction',
    'bus',
    'motorcycle',
  ]),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z
    .number()
    .min(1900, 'Invalid year')
    .max(new Date().getFullYear() + 1, 'Invalid year'),
  vin: vinValidator,
  licensePlate: licensePlateValidator,
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'cng', 'propane']),
  mileage: z.number().min(0, 'Mileage must be positive'),
  department: z.string().min(1, 'Department is required'),
  region: z.string().min(1, 'Region is required'),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;

// ============================================================================
// Driver Schemas
// ============================================================================

export const driverSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(1, 'Name is required'),
  email: emailValidator,
  phone: phoneValidator,
  department: z.string().min(1, 'Department is required'),
  licenseType: z.string().min(1, 'License type is required'),
  licenseExpiry: z.string().min(1, 'License expiry date is required'),
  emergencyContact: z
    .object({
      name: z.string().min(1, 'Emergency contact name is required'),
      phone: phoneValidator,
      relationship: z.string().min(1, 'Relationship is required'),
    })
    .optional(),
});

export type DriverFormData = z.infer<typeof driverSchema>;

// ============================================================================
// Work Order Schemas
// ============================================================================

export const workOrderSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  assignedTo: z.string().optional(),
  estimatedCost: z.number().min(0, 'Cost must be positive').optional(),
  laborHours: z.number().min(0, 'Labor hours must be positive').optional(),
  notes: z.string().optional(),
});

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;

// ============================================================================
// Maintenance Schedule Schema
// ============================================================================

export const maintenanceScheduleSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'mileage-based']),
  intervalMiles: z.number().min(0).optional(),
  nextDue: z.string().min(1, 'Next due date is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimatedCost: z.number().min(0, 'Cost must be positive'),
  assignedVendorId: z.string().optional(),
  autoSchedule: z.boolean(),
});

export type MaintenanceScheduleFormData = z.infer<typeof maintenanceScheduleSchema>;

// ============================================================================
// Parts Inventory Schema
// ============================================================================

export const partSchema = z.object({
  partNumber: z.string().min(1, 'Part number is required'),
  name: z.string().min(1, 'Part name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum([
    'engine',
    'transmission',
    'brakes',
    'electrical',
    'body',
    'interior',
    'tires',
    'fluids',
    'filters',
    'other',
  ]),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  quantityOnHand: z.number().min(0, 'Quantity must be positive'),
  minStockLevel: z.number().min(0, 'Minimum stock level must be positive'),
  reorderPoint: z.number().min(0, 'Reorder point must be positive'),
  unitCost: z.number().min(0, 'Unit cost must be positive'),
  location: z.string().min(1, 'Location is required'),
});

export type PartFormData = z.infer<typeof partSchema>;

// ============================================================================
// Vendor Schema
// ============================================================================

export const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  type: z.enum(['parts', 'service', 'fuel', 'insurance', 'leasing', 'towing', 'other']),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: emailValidator,
  phone: phoneValidator,
  address: z.string().min(1, 'Address is required'),
  website: urlValidator,
  taxId: z.string().min(1, 'Tax ID is required'),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
});

export type VendorFormData = z.infer<typeof vendorSchema>;

// ============================================================================
// Fuel Transaction Schema
// ============================================================================

export const fuelTransactionSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  date: z.string().min(1, 'Date is required'),
  station: z.string().min(1, 'Station is required'),
  gallons: z.number().min(0.1, 'Gallons must be greater than 0'),
  pricePerGallon: z.number().min(0, 'Price must be positive'),
  totalCost: z.number().min(0, 'Total cost must be positive'),
  odometer: z.number().min(0, 'Odometer reading must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

export type FuelTransactionFormData = z.infer<typeof fuelTransactionSchema>;

// ============================================================================
// Custom Validation Functions
// ============================================================================

/**
 * Validate date is not in the past
 */
export function validateFutureDate(date: string): boolean {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): boolean {
  return new Date(startDate) <= new Date(endDate);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Format validation error messages
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};

  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    formattedErrors[path] = error.message;
  });

  return formattedErrors;
}

/**
 * Safe parse with formatted errors
 */
export function safeParseWithErrors<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: formatValidationErrors(result.error),
  };
}

// ============================================================================
// Field-level validators (for use with react-hook-form)
// ============================================================================

export const fieldValidators = {
  required: (message = 'This field is required') => ({
    required: message,
  }),

  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address',
    },
  },

  phone: {
    required: 'Phone number is required',
    pattern: {
      value: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      message: 'Invalid phone number',
    },
  },

  vin: {
    required: 'VIN is required',
    minLength: {
      value: 17,
      message: 'VIN must be 17 characters',
    },
    maxLength: {
      value: 17,
      message: 'VIN must be 17 characters',
    },
    pattern: {
      value: /^[A-HJ-NPR-Z0-9]{17}$/,
      message: 'Invalid VIN format',
    },
  },

  minLength: (length: number, fieldName = 'This field') => ({
    minLength: {
      value: length,
      message: `${fieldName} must be at least ${length} characters`,
    },
  }),

  maxLength: (length: number, fieldName = 'This field') => ({
    maxLength: {
      value: length,
      message: `${fieldName} must not exceed ${length} characters`,
    },
  }),

  min: (value: number, fieldName = 'Value') => ({
    min: {
      value,
      message: `${fieldName} must be at least ${value}`,
    },
  }),

  max: (value: number, fieldName = 'Value') => ({
    max: {
      value,
      message: `${fieldName} must not exceed ${value}`,
    },
  }),
};
