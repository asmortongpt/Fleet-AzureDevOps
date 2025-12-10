/**
 * Schema Index
 *
 * Central export for all Zod schemas.
 * Use this file to import schemas across the application.
 */

// Base utilities
export * from './utils'
export * from './pagination'
export * from './filters'
export * from './responses'

// Domain schemas
export * from './vehicle.schema'
export * from './driver.schema'
export * from './telemetry.schema'

/**
 * Usage examples:
 *
 * import { vehicleSchema, validateVehicle } from '@/lib/schemas'
 * import { successResponseSchema, paginatedResponseSchema } from '@/lib/schemas'
 * import { vehicleStatusSchema, driverStatusSchema } from '@/lib/schemas'
 */
