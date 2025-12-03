/**
 * Central export for all validation schemas
 * Implements CRIT-B-003: Comprehensive input validation across all API endpoints
 */

// Common schemas
export * from './common.schema';

// Entity schemas
export * from './vehicles.schema';
export * from './drivers.schema';
export * from './maintenance.schema';
export * from './auth.schema';

// Re-export validation middleware
export { validate, validateBody, validateQuery, validateParams, validateAll } from '../middleware/validate';
