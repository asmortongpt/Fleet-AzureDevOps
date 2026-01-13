import { z } from 'zod';

/**
 * Common validation schemas used across the application
 * Implements CRIT-B-003: Input validation across all API endpoints
 */

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * UUID parameter schema
 */
export const uuidParamSchema = z.object({
  id: uuidSchema
});

/**
 * Pagination query parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Date range query parameters
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['endDate']
});

/**
 * Search query parameters
 */
export const searchSchema = z.object({
  q: z.string().min(1).max(500),
  ...paginationSchema.shape,
});

/**
 * Email validation
 */
export const emailSchema = z.string()
  .email('Invalid email address')
  .toLowerCase()
  .max(255, 'Email must be 255 characters or less')
  .trim();

/**
 * Phone number validation (flexible international format)
 */
export const phoneSchema = z.string()
  .regex(/^[\d\s\-\+\(\)]{10,20}$/, 'Invalid phone number format');

/**
 * VIN validation (17 characters, excludes I, O, Q)
 */
export const vinSchema = z.string()
  .length(17, 'VIN must be exactly 17 characters')
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, 'Invalid VIN format')
  .transform(val => val.toUpperCase());

/**
 * License plate validation
 */
export const licensePlateSchema = z.string()
  .min(2, 'License plate must be at least 2 characters')
  .max(15, 'License plate must be 15 characters or less')
  .regex(/^[A-Z0-9\s\-]+$/i, 'Invalid license plate format')
  .transform(val => val.toUpperCase());

/**
 * URL validation
 */
export const urlSchema = z.string()
  .url('Invalid URL format')
  .max(500, 'URL must be 500 characters or less');

/**
 * Positive number
 */
export const positiveNumberSchema = z.number()
  .positive('Must be a positive number');

/**
 * Non-negative number
 */
export const nonNegativeNumberSchema = z.number()
  .nonnegative('Must be non-negative');

/**
 * Currency amount (2 decimal places)
 */
export const currencySchema = z.number()
  .nonnegative('Amount must be non-negative')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

/**
 * Percentage (0-100)
 */
export const percentageSchema = z.number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage must be at most 100');

/**
 * Latitude validation
 */
export const latitudeSchema = z.number()
  .min(-90, 'Latitude must be between -90 and 90')
  .max(90, 'Latitude must be between -90 and 90');

/**
 * Longitude validation
 */
export const longitudeSchema = z.number()
  .min(-180, 'Longitude must be between -180 and 180')
  .max(180, 'Longitude must be between -180 and 180');

/**
 * Coordinates validation
 */
export const coordinatesSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

/**
 * Address validation
 */
export const addressSchema = z.object({
  street: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(50),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  country: z.string().length(2, 'Country must be 2-letter code').default('US'),
});

/**
 * File upload metadata
 */
export const fileMetadataSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid MIME type'),
  size: z.number().int().positive().max(50 * 1024 * 1024), // 50MB max
});

/**
 * Timestamp validation
 */
export const timestampSchema = z.coerce.date();

/**
 * Bulk operation schema
 */
export const bulkOperationSchema = z.object({
  ids: z.array(uuidSchema).min(1, 'At least one ID is required').max(100, 'Maximum 100 items allowed'),
  action: z.string().min(1),
});

/**
 * Sort order enum
 */
export const sortOrderEnum = z.enum(['asc', 'desc']);

/**
 * Status filter enum (common across entities)
 */
export const statusEnum = z.enum(['active', 'inactive', 'pending', 'archived']);

/**
 * Priority enum (common across entities)
 */
export const priorityEnum = z.enum(['low', 'medium', 'high', 'critical', 'urgent']);

// Type exports
export type UUID = z.infer<typeof uuidSchema>;
export type UUIDParam = z.infer<typeof uuidParamSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type Search = z.infer<typeof searchSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type VIN = z.infer<typeof vinSchema>;
export type LicensePlate = z.infer<typeof licensePlateSchema>;
export type URL = z.infer<typeof urlSchema>;
export type Currency = z.infer<typeof currencySchema>;
export type Percentage = z.infer<typeof percentageSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Address = z.infer<typeof addressSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;
export type BulkOperation = z.infer<typeof bulkOperationSchema>;
