/**
 * Repository Base Layer Exports
 *
 * Provides all base repository infrastructure components.
 * Import from this file to get everything you need:
 *
 * import {
 *   GenericRepository,
 *   TransactionManager,
 *   IRepository,
 *   PaginationOptions,
 *   PaginatedResult
 * } from '../base'
 */

// Base classes and interfaces
export { GenericRepository } from './GenericRepository'
export { IRepository } from './IRepository'
export { TransactionManager } from './TransactionManager'

// Types and utilities
export {
  PaginationOptions,
  PaginatedResult,
  QueryContext,
  TransactionCallback,
  VALID_SORT_ORDERS,
  ValidSortOrder,
  isValidSortOrder
} from './types'
