/**
 * Filter Zod Schemas
 *
 * Advanced filtering schemas for complex data queries.
 * Supports field-level filters with various operators.
 */

import { z } from 'zod'

/**
 * Filter operators supported by the API
 */
export const filterOperatorSchema = z.enum([
  'eq',       // Equal to
  'ne',       // Not equal to
  'gt',       // Greater than
  'gte',      // Greater than or equal to
  'lt',       // Less than
  'lte',      // Less than or equal to
  'like',     // SQL LIKE pattern matching
  'ilike',    // Case-insensitive LIKE
  'in',       // In array of values
  'not_in',   // Not in array of values
  'between',  // Between two values
  'is_null',  // Is NULL
  'is_not_null' // Is NOT NULL
])

/**
 * Type for filter operators
 */
export type FilterOperator = z.infer<typeof filterOperatorSchema>

/**
 * Single filter condition
 */
export const filterSchema = z.object({
  field: z.string(),
  operator: filterOperatorSchema,
  value: z.unknown() // Type depends on operator
})

/**
 * Type for a single filter
 */
export type Filter = z.infer<typeof filterSchema>

/**
 * Array of filter conditions
 * Can be combined with AND/OR logic
 */
export const filtersSchema = z.array(filterSchema)

/**
 * Type for multiple filters
 */
export type Filters = z.infer<typeof filtersSchema>

/**
 * Filter group with logical operator
 * Allows complex nested filter conditions
 */
export const filterGroupSchema: any = z.object({
  logic: z.enum(['and', 'or']).default('and'),
  filters: z.array(
    z.union([
      filterSchema,
      z.lazy(() => filterGroupSchema) // Recursive for nested groups
    ])
  )
})

/**
 * Type for filter groups
 */
export type FilterGroup = z.infer<typeof filterGroupSchema>

/**
 * Date range filter (common pattern)
 */
export const dateRangeFilterSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional()
})

/**
 * Type for date range filters
 */
export type DateRangeFilter = z.infer<typeof dateRangeFilterSchema>

/**
 * Search filter for full-text search
 */
export const searchFilterSchema = z.object({
  query: z.string(),
  fields: z.array(z.string()).optional(), // Fields to search
  fuzzy: z.boolean().default(false) // Enable fuzzy matching
})

/**
 * Type for search filters
 */
export type SearchFilter = z.infer<typeof searchFilterSchema>

/**
 * Combined filter parameters for API requests
 * Includes filters, search, and date range
 */
export const filterParamsSchema = z.object({
  filters: filtersSchema.optional(),
  search: searchFilterSchema.optional(),
  date_range: dateRangeFilterSchema.optional()
})

/**
 * Type for filter parameters
 */
export type FilterParams = z.infer<typeof filterParamsSchema>

/**
 * Numeric range filter
 */
export const numericRangeFilterSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional()
})

/**
 * Type for numeric range filters
 */
export type NumericRangeFilter = z.infer<typeof numericRangeFilterSchema>

/**
 * Vehicle-specific filters
 * Common filter combinations for vehicle queries
 */
export const vehicleFiltersSchema = z.object({
  status: z.array(z.string()).optional(),
  make: z.array(z.string()).optional(),
  model: z.array(z.string()).optional(),
  year_range: numericRangeFilterSchema.optional(),
  odometer_range: numericRangeFilterSchema.optional(),
  fuel_level_range: numericRangeFilterSchema.optional()
})

/**
 * Type for vehicle filters
 */
export type VehicleFilters = z.infer<typeof vehicleFiltersSchema>

/**
 * Driver-specific filters
 */
export const driverFiltersSchema = z.object({
  status: z.array(z.string()).optional(),
  license_class: z.array(z.string()).optional(),
  safety_score_range: numericRangeFilterSchema.optional()
})

/**
 * Type for driver filters
 */
export type DriverFilters = z.infer<typeof driverFiltersSchema>

/**
 * Maintenance-specific filters
 */
export const maintenanceFiltersSchema = z.object({
  status: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
  due_date_range: dateRangeFilterSchema.optional(),
  cost_range: numericRangeFilterSchema.optional()
})

/**
 * Type for maintenance filters
 */
export type MaintenanceFilters = z.infer<typeof maintenanceFiltersSchema>

/**
 * Helper to build filter query string
 * Converts filter object to URL query parameters
 */
export function buildFilterQueryString(filters: FilterParams): string {
  const params = new URLSearchParams()

  if (filters.search?.query) {
    params.append('search', filters.search.query)
    if (filters.search.fields) {
      params.append('search_fields', filters.search.fields.join(','))
    }
    if (filters.search.fuzzy) {
      params.append('fuzzy', 'true')
    }
  }

  if (filters.date_range?.start_date) {
    params.append('start_date', filters.date_range.start_date)
  }
  if (filters.date_range?.end_date) {
    params.append('end_date', filters.date_range.end_date)
  }

  if (filters.filters) {
    params.append('filters', JSON.stringify(filters.filters))
  }

  return params.toString()
}