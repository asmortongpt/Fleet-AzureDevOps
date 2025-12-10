/**
 * Base Repository Interface
 *
 * Provides type-safe contract for all repository implementations.
 * Ensures consistent CRUD operations across all domain repositories.
 *
 * SECURITY:
 * - All queries MUST use parameterized queries ($1, $2, $3)
 * - All queries MUST include tenant_id for multi-tenant isolation
 * - All column names MUST be validated against whitelists
 */

import { PaginationOptions, PaginatedResult } from './types'

export interface IRepository<T> {
  /**
   * Find a single record by ID
   * @param id - Primary key value
   * @param tenantId - Tenant ID for isolation
   * @returns Record or null if not found
   */
  findById(id: number | string, tenantId: string): Promise<T | null>

  /**
   * Find all records for a tenant with optional pagination
   * @param tenantId - Tenant ID for isolation
   * @param options - Pagination and sorting options
   * @returns Paginated result set
   */
  findAll(tenantId: string, options?: PaginationOptions): Promise<PaginatedResult<T>>

  /**
   * Find records matching WHERE conditions
   * @param conditions - Field-value pairs for WHERE clause
   * @param tenantId - Tenant ID for isolation
   * @param options - Pagination and sorting options
   * @returns Paginated result set
   */
  findWhere(
    conditions: Partial<T>,
    tenantId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>>

  /**
   * Create a new record
   * @param data - Record data (without id)
   * @param tenantId - Tenant ID for isolation
   * @param userId - User ID for audit trail
   * @returns Created record with generated ID
   */
  create(data: Partial<T>, tenantId: string, userId: string): Promise<T>

  /**
   * Update an existing record
   * @param id - Primary key value
   * @param data - Fields to update
   * @param tenantId - Tenant ID for isolation
   * @param userId - User ID for audit trail
   * @returns Updated record
   */
  update(id: number | string, data: Partial<T>, tenantId: string, userId: string): Promise<T>

  /**
   * Delete a record (soft or hard depending on table schema)
   * @param id - Primary key value
   * @param tenantId - Tenant ID for isolation
   * @param userId - User ID for audit trail (soft delete)
   * @returns True if deleted successfully
   */
  delete(id: number | string, tenantId: string, userId: string): Promise<boolean>

  /**
   * Check if a record exists
   * @param id - Primary key value
   * @param tenantId - Tenant ID for isolation
   * @returns True if exists
   */
  exists(id: number | string, tenantId: string): Promise<boolean>

  /**
   * Count records matching conditions
   * @param conditions - Field-value pairs for WHERE clause
   * @param tenantId - Tenant ID for isolation
   * @returns Count of matching records
   */
  count(conditions: Partial<T>, tenantId: string): Promise<number>
}
