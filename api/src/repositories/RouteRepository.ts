import { connectionManager } from '../config/connection-manager'
import { BaseRepository } from '../services/dal/BaseRepository'

/**
 * Route entity interface
 */
export interface Route {
  id: string | number
  tenant_id: string
  route_name?: string
  vehicle_id?: string | number
  driver_id?: string | number
  status?: string
  start_location?: string
  end_location?: string
  planned_start_time?: Date
  planned_end_time?: Date
  actual_start_time?: Date
  actual_end_time?: Date
  total_distance?: number
  estimated_duration?: number
  actual_duration?: number
  waypoints?: any // JSONB
  optimized_waypoints?: any // JSONB
  route_geometry?: any // JSONB or geometry type
  notes?: string
  created_at?: Date
  updated_at?: Date
}

/**
 * Route Repository
 * Provides data access operations for routes (route planning) using the DAL
 */
export class RouteRepository extends BaseRepository<Route> {
  constructor() {
    super('routes', connectionManager.getWritePool())
  }

  /**
   * Find all routes for a tenant with pagination
   */
  async findByTenant(
    tenantId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    return this.paginate({
      where: { tenant_id: tenantId },
      page: options.page || 1,
      limit: options.limit || 50,
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Find routes by driver ID
   */
  async findByDriver(
    driverId: string | number,
    tenantId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    return this.paginate({
      where: { driver_id: driverId, tenant_id: tenantId },
      page: options.page || 1,
      limit: options.limit || 50,
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Find route by ID and tenant (IDOR protection)
   */
  async findByIdAndTenant(id: string | number, tenantId: string): Promise<Route | null> {
    return this.findById(id, tenantId)
  }

  /**
   * Check if route belongs to specific driver (for IDOR checks)
   */
  async routeBelongsToDriver(
    routeId: string | number,
    driverId: string | number,
    tenantId: string
  ): Promise<boolean> {
    return this.exists({ id: routeId, driver_id: driverId, tenant_id: tenantId })
  }

  /**
   * Get route status
   */
  async getRouteStatus(id: string | number, tenantId: string): Promise<string | null> {
    const route = await this.findOne({ id, tenant_id: tenantId })
    return route?.status || null
  }

  /**
   * Create a new route
   */
  async createRoute(tenantId: string, data: Partial<Route>): Promise<Route> {
    return this.create({
      ...data,
      tenant_id: tenantId
    })
  }

  /**
   * Update a route
   */
  async updateRoute(
    id: string | number,
    tenantId: string,
    data: Partial<Route>
  ): Promise<Route> {
    return this.update(id, data, tenantId)
  }

  /**
   * Delete a route (soft delete if column exists, hard delete otherwise)
   */
  async deleteRoute(id: string | number, tenantId: string): Promise<boolean> {
    return this.delete(id, tenantId)
  }

  /**
   * Count routes by status
   */
  async countByStatus(tenantId: string, status: string): Promise<number> {
    return this.count({ tenant_id: tenantId, status })
  }
}
