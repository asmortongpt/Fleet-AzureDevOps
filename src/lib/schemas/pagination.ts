/**
 * Pagination Zod Schemas
 *
 * Standard pagination schemas for paginated API responses.
 * Ensures consistency across all list endpoints.
 */

import { z } from 'zod'

/**
 * Pagination parameters for API requests
 * Used for query string validation on list endpoints
 */
export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc')
})

/**
 * Type for pagination parameters
 */
export type PaginationParams = z.infer<typeof paginationParamsSchema>

/**
 * Pagination metadata included in responses
 */
export const paginationMetadataSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
  has_next: z.boolean().optional(),
  has_previous: z.boolean().optional()
})

/**
 * Type for pagination metadata
 */
export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>

/**
 * Generic paginated response schema
 * Wraps any data array with pagination metadata
 *
 * @example
 * const vehiclesResponseSchema = paginatedResponseSchema(vehicleSchema)
 * type VehiclesResponse = z.infer<typeof vehiclesResponseSchema>
 */
export function paginatedResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: z.array(dataSchema),
    pagination: paginationMetadataSchema
  })
}

/**
 * Alternative pagination with cursor-based navigation
 * Used for infinite scroll and real-time data feeds
 */
export const cursorPaginationParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20)
})

/**
 * Type for cursor pagination parameters
 */
export type CursorPaginationParams = z.infer<typeof cursorPaginationParamsSchema>

/**
 * Cursor-based pagination metadata
 */
export const cursorPaginationMetadataSchema = z.object({
  next_cursor: z.string().nullable(),
  previous_cursor: z.string().nullable(),
  has_more: z.boolean()
})

/**
 * Type for cursor pagination metadata
 */
export type CursorPaginationMetadata = z.infer<typeof cursorPaginationMetadataSchema>

/**
 * Generic cursor-paginated response schema
 *
 * @example
 * const telemetryResponseSchema = cursorPaginatedResponseSchema(telemetrySchema)
 */
export function cursorPaginatedResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: z.array(dataSchema),
    pagination: cursorPaginationMetadataSchema
  })
}

/**
 * Helper to validate pagination params from query string
 * Coerces string values to numbers
 */
export const paginationParamsFromQuery = paginationParamsSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

/**
 * Type for query string pagination params
 */
export type PaginationParamsFromQuery = z.infer<typeof paginationParamsFromQuery>
