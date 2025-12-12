/**
 * Common Zod Schema Utilities
 *
 * Reusable schema fragments for consistent type validation across the Fleet application.
 * These utilities ensure field name consistency and type safety across all API responses.
 */

import { z } from 'zod'

/**
 * Timestamp schema for created_at/updated_at fields
 * Validates ISO 8601 datetime strings
 */
export const timestampSchema = z.object({
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

/**
 * Tenant schema for multi-tenant data isolation
 * All tenant-scoped entities must include tenant_id
 */
export const tenantSchema = z.object({
  tenant_id: z.number().int().positive()
})

/**
 * ID schema for entities with numeric primary keys
 */
export const idSchema = z.object({
  id: z.number().int().positive()
})

/**
 * Helper to make a schema nullable and optional
 * Useful for optional fields that may be null or undefined
 *
 * @example
 * const schema = z.object({
 *   optional_field: nullable(z.string())
 * })
 */
export const nullable = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullable().optional()

/**
 * UUID schema for entities using UUID primary keys
 */
export const uuidSchema = z.object({
  id: z.string().uuid()
})

/**
 * Soft delete schema for entities supporting soft deletion
 */
export const softDeleteSchema = z.object({
  deleted_at: z.string().datetime().nullable()
})

/**
 * User tracking schema for created_by/updated_by fields
 */
export const userTrackingSchema = z.object({
  created_by: z.number().int().positive().nullable(),
  updated_by: z.number().int().positive().nullable()
})

/**
 * Combine multiple schema shapes into one
 * TypeScript helper for merging schema fragments
 */
export function combineSchemas<
  T extends z.ZodRawShape,
  U extends z.ZodRawShape
>(schema1: z.ZodObject<T>, schema2: z.ZodObject<U>) {
  return schema1.merge(schema2)
}

/**
 * Coordinates schema for latitude/longitude pairs
 */
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
})

/**
 * Address schema for physical locations
 */
export const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string().length(2), // US state abbreviation
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/), // US ZIP code format
  country: z.string().default('US')
})

/**
 * Phone number schema (US format)
 */
export const phoneNumberSchema = z.string().regex(
  /^\+?1?\d{10,14}$/,
  'Invalid phone number format'
)

/**
 * Email schema with validation
 */
export const emailSchema = z.string().email()

/**
 * Percentage schema (0-100)
 */
export const percentageSchema = z.number().min(0).max(100)

/**
 * Currency amount schema (non-negative, 2 decimal places)
 */
export const currencySchema = z.number().nonnegative().multipleOf(0.01)

/**
 * Date-only schema (ISO date string YYYY-MM-DD)
 */
export const dateOnlySchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
)

/**
 * URL schema with validation
 */
export const urlSchema = z.string().url()

/**
 * Status enum helper
 * Creates a schema for status fields with predefined values
 *
 * @example
 * const vehicleStatus = statusEnum(['active', 'maintenance', 'retired'])
 */
export function statusEnum<T extends string>(values: readonly [T, ...T[]]) {
  return z.enum(values)
}

/**
 * Metadata schema for flexible JSON data
 */
export const metadataSchema = z.record(z.unknown()).optional()

/**
 * File attachment schema
 */
export const fileAttachmentSchema = z.object({
  id: z.number().int().positive(),
  filename: z.string(),
  url: z.string().url(),
  mime_type: z.string(),
  size_bytes: z.number().int().nonnegative(),
  uploaded_at: z.string().datetime()
})
