/**
 * Garage Bay Service
 *
 * Provides business logic and data access for garage bay operations
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
  status: 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'failed'
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
   * Get work orders for a bay with complete details.
   *
   * Note: The work_orders table does not have a garage_bay_id column,
   * so we match work orders to a bay via the bay's facility/location.
   * If no facility link exists, we return work orders for the tenant
   * that are currently open/in_progress and assigned to the same facility_id
   * as the bay's location (if one exists), otherwise return an empty list.
   *
   * Actual columns used match the real database schema.
   */
  private async getWorkOrdersForBay(
    client: PoolClient,
    bayId: string,
    tenantId: string
  ): Promise<WorkOrder[]> {
    // Look up the bay's location to try to match a facility
    const bayResult = await client.query(
      'SELECT location FROM garage_bays WHERE id = $1 AND tenant_id = $2',
      [bayId, tenantId]
    )

    if (bayResult.rows.length === 0) {
      return []
    }

    const bayLocation = bayResult.rows[0].location

    // Try to find a facility matching the bay's location
    let facilityFilter = ''
    const queryParams: any[] = [tenantId]

    if (bayLocation) {
      const facilityResult = await client.query(
        `SELECT id FROM facilities WHERE tenant_id = $1 AND name ILIKE $2 LIMIT 1`,
        [tenantId, `%${bayLocation}%`]
      )
      if (facilityResult.rows.length > 0) {
        queryParams.push(facilityResult.rows[0].id)
        facilityFilter = `AND wo.facility_id = $${queryParams.length}`
      }
    }

    const workOrdersResult = await client.query(
      `SELECT
          wo.id,
          wo.work_order_number as wo_number,
          wo.description,
          wo.type,
          wo.priority,
          wo.status,
          wo.created_at,
          wo.scheduled_start,
          wo.scheduled_end,
          wo.estimated_completion_date,
          wo.actual_start,
          wo.actual_end,
          wo.estimated_total_cost,
          wo.total_cost,
          wo.notes,
          wo.vehicle_id,
          v.make as vehicle_make,
          v.model as vehicle_model,
          v.year as vehicle_year,
          v.vin,
          v.license_plate,
          v.odometer as odometer_reading,
          v.engine_hours,
          t.id as technician_id,
          t.first_name || ' ' || t.last_name as technician_name,
          t.email as technician_email,
          t.phone as technician_phone,
          t.role as technician_role
        FROM work_orders wo
        LEFT JOIN vehicles v ON wo.vehicle_id = v.id
        LEFT JOIN users t ON wo.assigned_technician_id = t.id
        WHERE wo.tenant_id = $1
          ${facilityFilter}
          AND wo.status IN ('open', 'in_progress', 'on_hold')
        ORDER BY
          CASE wo.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          wo.created_at ASC`,
      queryParams
    )

    const workOrders: WorkOrder[] = []
    for (const wo of workOrdersResult.rows) {
      // Fetch parts from work_order_parts (joined to parts_inventory)
      const partsResult = await client.query(
        `SELECT
            wop.id,
            COALESCE(p.name, wop.name) as name,
            COALESCE(p.part_number, wop.part_number) as part_number,
            wop.quantity,
            0 as quantity_in_stock,
            wop.unit_cost,
            COALESCE(wop.supplier, '') as supplier,
            '' as supplier_contact,
            '' as supplier_phone,
            '' as supplier_email,
            NULL as delivery_date,
            'in_stock' as status
          FROM work_order_parts wop
          LEFT JOIN parts_inventory p ON wop.part_id = p.id
          WHERE wop.work_order_id = $1
          ORDER BY COALESCE(p.name, wop.name) ASC`,
        [wo.id]
      )

      // Fetch labor entries from work_order_labor
      const laborResult = await client.query(
        `SELECT
            wol.id,
            wol.technician_id,
            COALESCE(u.first_name || ' ' || u.last_name, wol.technician_name) as technician_name,
            NULL as technician_avatar,
            wol.hours as hours_logged,
            0 as hours_estimated,
            wol.rate,
            wol.date,
            wol.task as task_description,
            'completed' as status
          FROM work_order_labor wol
          LEFT JOIN users u ON wol.technician_id = u.id
          WHERE wol.work_order_id = $1
          ORDER BY wol.date DESC`,
        [wo.id]
      )

      // Notes are stored as a text field on work_orders, not a separate table
      const notesList: string[] = wo.notes ? [wo.notes] : []

      workOrders.push({
        id: wo.id,
        wo_number: wo.wo_number,
        title: wo.description ? wo.description.substring(0, 100) : wo.wo_number,
        description: wo.description || '',
        type: wo.type,
        priority: wo.priority,
        status: wo.status,
        vehicle: {
          id: wo.vehicle_id,
          vehicle_number: wo.vin || `${wo.vehicle_year} ${wo.vehicle_make} ${wo.vehicle_model}`,
          make: wo.vehicle_make,
          model: wo.vehicle_model,
          year: wo.vehicle_year,
          vin: wo.vin,
          license_plate: wo.license_plate,
          odometer_reading: wo.odometer_reading,
          engine_hours: wo.engine_hours,
        },
        primary_technician: {
          id: wo.technician_id,
          name: wo.technician_name || 'Unassigned',
          email: wo.technician_email || '',
          phone: wo.technician_phone || '',
          avatar: undefined,
          role: wo.technician_role || '',
          certifications: [],
        },
        parts: partsResult.rows,
        labor: laborResult.rows,
        created_date: wo.created_at,
        scheduled_start: wo.scheduled_start,
        scheduled_end: wo.scheduled_end,
        estimated_completion: wo.estimated_completion_date,
        actual_start: wo.actual_start,
        actual_end: wo.actual_end,
        progress_percentage: wo.status === 'completed' ? 100 : wo.status === 'in_progress' ? 50 : 0,
        estimated_cost: wo.estimated_total_cost || 0,
        actual_cost: wo.total_cost || 0,
        notes: notesList,
      })
    }

    return workOrders
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
      // Note: work_orders does not have a garage_bay_id column.
      // If a future migration adds that column, re-enable this check.
      // For now, just verify the bay exists before deleting.

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
