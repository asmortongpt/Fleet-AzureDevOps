/**
 * Shared Repository Types
 *
 * Common type definitions used across all repositories.
 */

import { Pool, PoolClient } from 'pg'

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Query context passed to repository methods
 */
export interface QueryContext {
  userId: string
  tenantId: string
  pool?: Pool | PoolClient // Optional: for transactions
}

/**
 * Transaction callback type
 */
export type TransactionCallback<R> = (client: PoolClient) => Promise<R>

/**
 * Valid sort orders (whitelist for SQL injection prevention)
 */
export const VALID_SORT_ORDERS = ['ASC', 'DESC'] as const
export type ValidSortOrder = typeof VALID_SORT_ORDERS[number]

/**
 * Type guard for valid sort order
 */
export function isValidSortOrder(order: string): order is ValidSortOrder {
  return VALID_SORT_ORDERS.includes(order.toUpperCase() as ValidSortOrder)
}
