import { z } from 'zod';

/**
 * Comprehensive Zod validation schemas for Drivers
 * Implements CRIT-B-003: Input validation across all API endpoints
 */

// Driver status enum
const driverStatusEnum = z.enum([
  'active',
  'inactive',
  'on_leave',
  'terminated',
  'suspended'
]);

// License class enum (common US license classes)
const licenseClassEnum = z.enum([
  'A',
  'B',
  'C',
  'D',
  'M',
  'CDL-A',
  'CDL-B',
  'CDL-C'
]);

// Phone number validation (flexible international format)
const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;

// Email validation
const emailSchema = z.string()
  .email('Invalid email address')
  .toLowerCase()
  .max(255, 'Email must be 255 characters or less');

/**
 * Driver creation schema - validates all required fields
 */
export const driverCreateSchema = z.object({
  employeeId: z.string()
    .min(1, 'Employee ID is required')
    .max(50, 'Employee ID must be 50 characters or less')
    .regex(/^[A-Z0-9\-]+$/i, 'Employee ID can only contain letters, numbers, and hyphens')
    .optional(),

  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .trim(),

  email: emailSchema,

  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number format')
    .optional(),

  licenseNumber: z.string()
    .min(1, 'License number is required')
    .max(50, 'License number must be 50 characters or less')
    .regex(/^[A-Z0-9\-]+$/i, 'License number can only contain letters, numbers, and hyphens'),

  licenseExpiry: z.coerce.date()
    .refine(date => date > new Date(), {
      message: 'License must not be expired'
    }),

  licenseClass: licenseClassEnum.optional(),

  status: driverStatusEnum.default('active'),

  photoUrl: z.string()
    .url('Invalid photo URL')
    .max(500, 'Photo URL must be 500 characters or less')
    .optional(),

  azureAdId: z.string()
    .max(255, 'Azure AD ID must be 255 characters or less')
    .optional(),

  assignedVehicleId: z.number()
    .int('Vehicle ID must be an integer')
    .positive('Vehicle ID must be positive')
    .optional(),

  rating: z.number()
    .min(0, 'Rating must be at least 0')
    .max(5, 'Rating must be at most 5')
    .multipleOf(0.01, 'Rating must have at most 2 decimal places')
    .default(5.00),

  totalTrips: z.number()
    .int('Total trips must be an integer')
    .nonnegative('Total trips must be non-negative')
    .default(0),

  totalMiles: z.number()
    .int('Total miles must be an integer')
    .nonnegative('Total miles must be non-negative')
    .default(0),

  safetyScore: z.number()
    .int('Safety score must be an integer')
    .min(0, 'Safety score must be at least 0')
    .max(100, 'Safety score must be at most 100')
    .default(100),

  hireDate: z.coerce.date().optional(),

  certifications: z.array(z.object({
    name: z.string(),
    issueDate: z.coerce.date(),
    expiryDate: z.coerce.date().optional(),
    issuingAuthority: z.string().optional(),
  })).optional(),

  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string().optional(),
    phone: z.string().regex(phoneRegex, 'Invalid emergency contact phone'),
    email: emailSchema.optional(),
  }).optional(),
});

/**
 * Driver update schema - all fields optional
 */
export const driverUpdateSchema = z.object({
  employeeId: z.string()
    .min(1, 'Employee ID cannot be empty')
    .max(50, 'Employee ID must be 50 characters or less')
    .regex(/^[A-Z0-9\-]+$/i, 'Employee ID can only contain letters, numbers, and hyphens')
    .optional(),

  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(255, 'Name must be 255 characters or less')
    .trim()
    .optional(),

  email: emailSchema.optional(),

  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number format')
    .nullable()
    .optional(),

  licenseNumber: z.string()
    .min(1, 'License number cannot be empty')
    .max(50, 'License number must be 50 characters or less')
    .regex(/^[A-Z0-9\-]+$/i, 'License number can only contain letters, numbers, and hyphens')
    .optional(),

  licenseExpiry: z.coerce.date()
    .refine(date => date > new Date(), {
      message: 'License must not be expired'
    })
    .optional(),

  licenseClass: licenseClassEnum.optional(),

  status: driverStatusEnum.optional(),

  photoUrl: z.string()
    .url('Invalid photo URL')
    .max(500, 'Photo URL must be 500 characters or less')
    .nullable()
    .optional(),

  azureAdId: z.string()
    .max(255, 'Azure AD ID must be 255 characters or less')
    .nullable()
    .optional(),

  assignedVehicleId: z.number()
    .int('Vehicle ID must be an integer')
    .positive('Vehicle ID must be positive')
    .nullable()
    .optional(),

  rating: z.number()
    .min(0, 'Rating must be at least 0')
    .max(5, 'Rating must be at most 5')
    .multipleOf(0.01, 'Rating must have at most 2 decimal places')
    .optional(),

  totalTrips: z.number()
    .int('Total trips must be an integer')
    .nonnegative('Total trips must be non-negative')
    .optional(),

  totalMiles: z.number()
    .int('Total miles must be an integer')
    .nonnegative('Total miles must be non-negative')
    .optional(),

  safetyScore: z.number()
    .int('Safety score must be an integer')
    .min(0, 'Safety score must be at least 0')
    .max(100, 'Safety score must be at most 100')
    .optional(),

  hireDate: z.coerce.date().nullable().optional(),

  certifications: z.array(z.object({
    name: z.string(),
    issueDate: z.coerce.date(),
    expiryDate: z.coerce.date().optional(),
    issuingAuthority: z.string().optional(),
  })).nullable().optional(),

  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string().optional(),
    phone: z.string().regex(phoneRegex, 'Invalid emergency contact phone'),
    email: emailSchema.optional(),
  }).nullable().optional(),
});

/**
 * Driver query parameters schema
 */
export const driverQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  status: driverStatusEnum.optional(),
  licenseClass: licenseClassEnum.optional(),
  assignedVehicleId: z.coerce.number().int().positive().optional(),
  search: z.string().max(255).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Driver ID parameter schema
 */
export const driverIdSchema = z.object({
  id: z.string().uuid('Invalid driver ID format')
});

// Type exports
export type DriverCreate = z.infer<typeof driverCreateSchema>;
export type DriverUpdate = z.infer<typeof driverUpdateSchema>;
export type DriverQuery = z.infer<typeof driverQuerySchema>;
export type DriverId = z.infer<typeof driverIdSchema>;
