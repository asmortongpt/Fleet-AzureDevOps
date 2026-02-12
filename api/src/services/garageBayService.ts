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
   * Get work orders for a bay with complete details
   */
  private async getWorkOrdersForBay(
    client: PoolClient,
    bayId: string,
    tenantId: string
  ): Promise<WorkOrder[]> {
    const workOrdersResult = await client.query(
      `SELECT
          wo.id,
          wo.work_order_number as wo_number,
          wo.title,
          wo.description,
          wo.type,
          wo.priority,
          wo.status,
          wo.created_date,
          wo.scheduled_start,
          wo.scheduled_end,
          wo.estimated_completion,
          wo.actual_start,
          wo.actual_end,
          wo.progress_percentage,
          wo.estimated_cost,
          wo.actual_cost,
          wo.notes,
          wo.vehicle_id,
          v.number as vehicle_number,
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
          t.avatar as technician_avatar,
          t.role as technician_role,
          t.certifications as technician_certifications
        FROM work_orders wo
        LEFT JOIN vehicles v ON wo.vehicle_id = v.id
        LEFT JOIN users t ON wo.assigned_technician_id = t.id
        WHERE wo.garage_bay_id = $1
          AND wo.tenant_id = $2
          AND wo.status IN ('pending', 'in_progress', 'on_hold')
        ORDER BY
          CASE wo.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          wo.created_date ASC`,
      [bayId, tenantId]
    )

    const workOrders: WorkOrder[] = []
    for (const wo of workOrdersResult.rows) {
      const partsResult = await client.query(
        `SELECT
            p.id,
            p.name,
            p.part_number,
            wop.quantity,
            wop.quantity_in_stock,
            wop.unit_cost,
            s.name as supplier,
            s.contact_name as supplier_contact,
            s.contact_phone as supplier_phone,
            s.contact_email as supplier_email,
            wop.delivery_date,
            wop.status
          FROM work_order_parts wop
          JOIN parts_inventory p ON wop.part_id = p.id
          LEFT JOIN suppliers s ON wop.supplier_id = s.id
          WHERE wop.work_order_id = $1
          ORDER BY p.name ASC`,
        [wo.id]
      )

      const laborResult = await client.query(
        `SELECT
            wol.id,
            wol.technician_id,
            u.first_name || ' ' || u.last_name as technician_name,
            u.avatar as technician_avatar,
            wol.hours_logged,
            wol.hours_estimated,
            wol.rate,
            wol.date,
            wol.task_description,
            wol.status
          FROM work_order_labor wol
          LEFT JOIN users u ON wol.technician_id = u.id
          WHERE wol.work_order_id = $1
          ORDER BY wol.date DESC`,
        [wo.id]
      )

      const notesResult = await client.query(
        `SELECT note
         FROM work_order_notes
         WHERE work_order_id = $1
         ORDER BY created_at DESC`,
        [wo.id]
      )

      workOrders.push({
        id: wo.id,
        wo_number: wo.wo_number,
        title: wo.title,
        description: wo.description,
        type: wo.type,
        priority: wo.priority,
        status: wo.status,
        vehicle: {
          id: wo.vehicle_id,
          vehicle_number: wo.vehicle_number,
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
          name: wo.technician_name,
          email: wo.technician_email,
          phone: wo.technician_phone,
          avatar: wo.technician_avatar,
          role: wo.technician_role,
          certifications: wo.technician_certifications || [],
        },
        parts: partsResult.rows,
        labor: laborResult.rows,
        created_date: wo.created_date,
        scheduled_start: wo.scheduled_start,
        scheduled_end: wo.scheduled_end,
        estimated_completion: wo.estimated_completion,
        actual_start: wo.actual_start,
        actual_end: wo.actual_end,
        progress_percentage: wo.progress_percentage,
        estimated_cost: wo.estimated_cost,
        actual_cost: wo.actual_cost,
        notes: notesResult.rows.map((r) => r.note).filter(Boolean),
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
