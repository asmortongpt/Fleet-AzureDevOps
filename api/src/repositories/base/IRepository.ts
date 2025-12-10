/**
 * Base Repository Interface
 * Provides generic CRUD operations for all domain repositories
 */
export interface IRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  /**
   * Find entity by ID
   * @param id - Entity ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns Entity or null if not found
   */
  findById(id: number | string, tenantId: number): Promise<T | null>

  /**
   * Find all entities with optional filters
   * @param filters - Query filters
   * @param tenantId - Tenant ID
   * @returns Array of entities
   */
  findAll(filters: Record<string, any>, tenantId: number): Promise<T[]>

  /**
   * Create new entity
   * @param data - Entity creation data
   * @param tenantId - Tenant ID
   * @returns Created entity
   */
  create(data: CreateDTO, tenantId: number): Promise<T>

  /**
   * Update existing entity
   * @param id - Entity ID
   * @param data - Update data
   * @param tenantId - Tenant ID
   * @returns Updated entity
   */
  update(id: number | string, data: UpdateDTO, tenantId: number): Promise<T>

  /**
   * Delete entity (soft delete if supported)
   * @param id - Entity ID
   * @param tenantId - Tenant ID
   * @returns Boolean indicating success
   */
  delete(id: number | string, tenantId: number): Promise<boolean>

  /**
   * Count entities with optional filters
   * @param filters - Query filters
   * @param tenantId - Tenant ID
   * @returns Count of entities
   */
  count(filters: Record<string, any>, tenantId: number): Promise<number>
}
