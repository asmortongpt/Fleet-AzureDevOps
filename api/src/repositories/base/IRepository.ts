/**
 * Base Repository Interface
 * Provides generic CRUD operations for all domain repositories
 */

import { PoolClient } from 'pg'
import { PaginatedResult, PaginationOptions } from './types'

export interface IRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  /**
   * Find entity by ID
   * @param id - Entity ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @param client - Optional database client for transactions
   * @returns Entity or null if not found
   */
  findById(id: number | string, tenantId: string, client?: PoolClient): Promise<T | null>

  /**
   * Find all entities with optional filters and pagination
   * @param tenantId - Tenant ID
   * @param options - Pagination options
   * @param client - Optional database client for transactions
   * @returns Paginated result of entities
   */
  findAll(tenantId: string, options?: PaginationOptions, client?: PoolClient): Promise<PaginatedResult<T>>

  /**
   * Create new entity
   * @param data - Entity creation data
   * @param tenantId - Tenant ID
   * @param userId - User ID for audit
   * @param client - Optional database client for transactions
   * @returns Created entity
   */
  create(data: CreateDTO, tenantId: string, userId: string, client?: PoolClient): Promise<T>

  /**
   * Update existing entity
   * @param id - Entity ID
   * @param data - Update data
   * @param tenantId - Tenant ID
   * @param userId - User ID for audit
   * @param client - Optional database client for transactions
   * @returns Updated entity
   */
  update(id: number | string, data: UpdateDTO, tenantId: string, userId: string, client?: PoolClient): Promise<T>

  /**
   * Delete entity (soft delete if supported)
   * @param id - Entity ID
   * @param tenantId - Tenant ID
   * @param userId - User ID for audit
   * @param client - Optional database client for transactions
   * @returns Boolean indicating success
   */
  delete(id: number | string, tenantId: string, userId: string, client?: PoolClient): Promise<boolean>

  /**
   * Count entities with optional filters
   * @param conditions - Query conditions
   * @param tenantId - Tenant ID
   * @param client - Optional database client for transactions
   * @returns Count of entities
   */
  count(conditions: Partial<T>, tenantId: string, client?: PoolClient): Promise<number>
}
