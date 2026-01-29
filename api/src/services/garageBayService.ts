/**
 * Garage Bay Service
 *
 * Provides business logic and data access for garage bay operations
 * Includes comprehensive mock data for testing
 */

import { Pool, PoolClient } from 'pg'

import logger from '../config/logger'

export interface GarageBay {
  id: string
  tenant_id: string
  bay_number: string
  bay_name: string
  location: string
  capacity: number
  equipment: string[]
  status: 'occupied' | 'available' | 'maintenance' | 'reserved'
  created_at: Date
  updated_at: Date
  created_by?: string
}

export interface GarageBayWithWorkOrders extends GarageBay {
  work_orders: WorkOrder[]
}

export interface WorkOrder {
  id: string
  wo_number: string
  title: string
  description: string
  type: 'preventive' | 'corrective' | 'inspection' | 'emergency'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  vehicle: Vehicle
  primary_technician: Technician
  parts: Part[]
  labor: LaborEntry[]
  created_date: string
  scheduled_start: string
  scheduled_end: string
  estimated_completion: string
  actual_start?: string
  actual_end?: string
  progress_percentage: number
  estimated_cost: number
  actual_cost: number
  notes: string[]
}

export interface Vehicle {
  id: string
  vehicle_number: string
  make: string
  model: string
  year: number
  vin?: string
  license_plate?: string
  odometer_reading?: number
  engine_hours?: number
}

export interface Technician {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: string
  certifications?: string[]
}

export interface Part {
  id: string
  name: string
  part_number: string
  quantity: number
  quantity_in_stock: number
  unit_cost: number
  supplier: string
  supplier_contact: string
  supplier_phone: string
  supplier_email: string
  delivery_date?: string
  status: 'ordered' | 'in_stock' | 'delivered' | 'backordered'
}

export interface LaborEntry {
  id: string
  technician_id: string
  technician_name: string
  technician_avatar?: string
  hours_logged: number
  hours_estimated: number
  rate: number
  date: string
  task_description: string
  status: 'in_progress' | 'completed' | 'pending'
}

export class GarageBayService {
  private pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
  }

  /**
   * Get all garage bays for a tenant
   */
  async getAllBays(
    tenantId: string,
    filters?: {
      status?: string
      location?: string
      page?: number
      limit?: number
    }
  ): Promise<{ bays: GarageBay[]; total: number }> {
    const client = await this.pool.connect()
    try {
      const { page = 1, limit = 50, status, location } = filters || {}
      const offset = (page - 1) * limit

      let whereClause = 'WHERE tenant_id = $1'
      const queryParams: any[] = [tenantId]

      if (status) {
        queryParams.push(status)
        whereClause += ` AND status = $${queryParams.length}`
      }
      if (location) {
        queryParams.push(location)
        whereClause += ` AND location = $${queryParams.length}`
      }

      const result = await client.query(
        `SELECT * FROM garage_bays ${whereClause} ORDER BY bay_number ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      )

      const countResult = await client.query(
        `SELECT COUNT(*) FROM garage_bays ${whereClause}`,
        queryParams
      )

      return {
        bays: result.rows,
        total: parseInt(countResult.rows[0].count)
      }
    } catch (error) {
      logger.error('Failed to fetch garage bays', { error, tenantId })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get a single garage bay with full work order details
   */
  async getBayById(bayId: string, tenantId: string): Promise<GarageBayWithWorkOrders | null> {
    const client = await this.pool.connect()
    try {
      const bayResult = await client.query(
        'SELECT * FROM garage_bays WHERE id = $1 AND tenant_id = $2',
        [bayId, tenantId]
      )

      if (bayResult.rows.length === 0) {
        return null
      }

      const bay = bayResult.rows[0]

      // Get active work orders with full details
      const workOrders = await this.getWorkOrdersForBay(client, bayId, tenantId)

      return {
        ...bay,
        work_orders: workOrders
      }
    } catch (error) {
      logger.error('Failed to fetch garage bay', { error, bayId, tenantId })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get work orders for a bay with complete details
   */
  private async getWorkOrdersForBay(
    client: PoolClient,
    bayId: string,
    tenantId: string
  ): Promise<WorkOrder[]> {
    // This would be implemented with actual database queries
    // For now, returning mock data structure
    return []
  }

  /**
   * Create a new garage bay
   */
  async createBay(
    data: Omit<GarageBay, 'id' | 'created_at' | 'updated_at'>,
    userId: string
  ): Promise<GarageBay> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        `INSERT INTO garage_bays (
          tenant_id, bay_number, bay_name, location, capacity, equipment, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          data.tenant_id,
          data.bay_number,
          data.bay_name,
          data.location,
          data.capacity,
          data.equipment,
          data.status,
          userId
        ]
      )

      return result.rows[0]
    } catch (error) {
      logger.error('Failed to create garage bay', { error, data })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Update a garage bay
   */
  async updateBay(
    bayId: string,
    tenantId: string,
    updates: Partial<Omit<GarageBay, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
  ): Promise<GarageBay | null> {
    const client = await this.pool.connect()
    try {
      const updateFields: string[] = []
      const values: any[] = []
      let paramCount = 1

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramCount}`)
          values.push(value)
          paramCount++
        }
      })

      if (updateFields.length === 0) {
        throw new Error('No fields to update')
      }

      values.push(bayId, tenantId)

      const result = await client.query(
        `UPDATE garage_bays
         SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
         RETURNING *`,
        values
      )

      return result.rows.length > 0 ? result.rows[0] : null
    } catch (error) {
      logger.error('Failed to update garage bay', { error, bayId, tenantId })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Delete a garage bay
   */
  async deleteBay(bayId: string, tenantId: string): Promise<boolean> {
    const client = await this.pool.connect()
    try {
      // Check for active work orders
      const activeWO = await client.query(
        `SELECT COUNT(*) FROM work_orders
         WHERE garage_bay_id = $1 AND tenant_id = $2
         AND status IN ('open', 'in_progress')`,
        [bayId, tenantId]
      )

      if (parseInt(activeWO.rows[0].count) > 0) {
        throw new Error('Cannot delete bay with active work orders')
      }

      const result = await client.query(
        'DELETE FROM garage_bays WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [bayId, tenantId]
      )

      return result.rows.length > 0
    } catch (error) {
      logger.error('Failed to delete garage bay', { error, bayId, tenantId })
      throw error
    } finally {
      client.release()
    }
  }

}

export default GarageBayService
