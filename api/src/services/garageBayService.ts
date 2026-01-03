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

  /**
   * Get mock data for testing
   */
  static getMockData(): GarageBayWithWorkOrders[] {
    return MOCK_GARAGE_BAYS
  }
}

/**
 * Mock Data for Testing
 * Comprehensive realistic data for development and testing
 */
export const MOCK_GARAGE_BAYS: GarageBayWithWorkOrders[] = [
  {
    id: 'bay-001',
    tenant_id: 'tenant-001',
    bay_number: '1',
    bay_name: 'Bay 1 - Heavy Duty',
    location: 'Building A - North Wing',
    capacity: 2,
    status: 'occupied',
    equipment: [
      'Hydraulic Lift (20 ton)',
      'Alignment Machine',
      'Tire Changer',
      'Wheel Balancer',
      'Diagnostic Computer',
      'Air Compressor',
      'Parts Washer',
      'Welding Equipment'
    ],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-12-01'),
    work_orders: [
      {
        id: 'wo-001',
        wo_number: 'WO-2024-001',
        title: 'Preventive Maintenance - PM-A Service',
        description: 'Complete PM-A service including oil change, filter replacements, brake inspection, tire rotation, and 150-point inspection. Vehicle has 45,000 miles and is due for scheduled maintenance per manufacturer specifications.',
        type: 'preventive',
        priority: 'medium',
        status: 'in_progress',
        created_date: '2024-12-01T08:00:00Z',
        scheduled_start: '2024-12-01T08:00:00Z',
        scheduled_end: '2024-12-01T16:00:00Z',
        estimated_completion: '2024-12-01T15:30:00Z',
        actual_start: '2024-12-01T08:15:00Z',
        progress_percentage: 65,
        estimated_cost: 850.00,
        actual_cost: 763.50,
        notes: [
          'Customer reported slight vibration at highway speeds - investigating during service',
          'Brake pads at 40% - recommend monitoring',
          'Found small oil leak from valve cover gasket - quoted separately'
        ],
        vehicle: {
          id: 'veh-101',
          vehicle_number: 'FLEET-2401',
          make: 'Ford',
          model: 'F-550',
          year: 2022,
          vin: '1FDUF5HT8NEA12345',
          license_plate: 'FLT2401',
          odometer_reading: 45237,
          engine_hours: 1823
        },
        primary_technician: {
          id: 'tech-001',
          name: 'John Martinez',
          email: 'john.martinez@fleet.com',
          phone: '555-0101',
          avatar: 'https://i.pravatar.cc/150?img=12',
          role: 'Senior Diesel Mechanic',
          certifications: ['ASE Master Technician', 'Ford Certified', 'Diesel Specialist', 'EPA 609']
        },
        parts: [
          {
            id: 'part-001',
            name: 'Engine Oil Filter',
            part_number: 'FL-2016',
            quantity: 2,
            quantity_in_stock: 15,
            unit_cost: 24.99,
            supplier: 'Fleet Parts Direct',
            supplier_contact: 'Sarah Johnson',
            supplier_phone: '555-0200',
            supplier_email: 'sarah.j@fleetparts.com',
            status: 'in_stock'
          },
          {
            id: 'part-002',
            name: 'Motorcraft 15W-40 Diesel Oil',
            part_number: 'MC-DPF15W40',
            quantity: 4,
            quantity_in_stock: 24,
            unit_cost: 28.50,
            supplier: 'Fleet Parts Direct',
            supplier_contact: 'Sarah Johnson',
            supplier_phone: '555-0200',
            supplier_email: 'sarah.j@fleetparts.com',
            status: 'in_stock'
          },
          {
            id: 'part-003',
            name: 'Air Filter',
            part_number: 'FA-1927',
            quantity: 1,
            quantity_in_stock: 8,
            unit_cost: 45.99,
            supplier: 'Fleet Parts Direct',
            supplier_contact: 'Sarah Johnson',
            supplier_phone: '555-0200',
            supplier_email: 'sarah.j@fleetparts.com',
            status: 'in_stock'
          },
          {
            id: 'part-004',
            name: 'Cabin Air Filter',
            part_number: 'CF-1234',
            quantity: 1,
            quantity_in_stock: 6,
            unit_cost: 32.99,
            supplier: 'Fleet Parts Direct',
            supplier_contact: 'Sarah Johnson',
            supplier_phone: '555-0200',
            supplier_email: 'sarah.j@fleetparts.com',
            status: 'in_stock'
          },
          {
            id: 'part-005',
            name: 'Fuel Filter',
            part_number: 'FD-4616',
            quantity: 2,
            quantity_in_stock: 12,
            unit_cost: 38.75,
            supplier: 'Fleet Parts Direct',
            supplier_contact: 'Sarah Johnson',
            supplier_phone: '555-0200',
            supplier_email: 'sarah.j@fleetparts.com',
            status: 'in_stock'
          }
        ],
        labor: [
          {
            id: 'labor-001',
            technician_id: 'tech-001',
            technician_name: 'John Martinez',
            technician_avatar: 'https://i.pravatar.cc/150?img=12',
            hours_logged: 5.5,
            hours_estimated: 8.0,
            rate: 95.00,
            date: '2024-12-01',
            task_description: 'PM-A Service - Oil/filter change, inspections, tire rotation',
            status: 'in_progress'
          },
          {
            id: 'labor-002',
            technician_id: 'tech-002',
            technician_name: 'Mike Thompson',
            technician_avatar: 'https://i.pravatar.cc/150?img=33',
            hours_logged: 0.5,
            hours_estimated: 1.0,
            rate: 85.00,
            date: '2024-12-01',
            task_description: 'Brake inspection and measurement',
            status: 'in_progress'
          }
        ]
      }
    ]
  },
  {
    id: 'bay-002',
    tenant_id: 'tenant-001',
    bay_number: '2',
    bay_name: 'Bay 2 - Transmission & Drivetrain',
    location: 'Building A - North Wing',
    capacity: 1,
    status: 'occupied',
    equipment: [
      'Hydraulic Lift (15 ton)',
      'Transmission Jack',
      'Diagnostic Scanner',
      'Pressure Washer',
      'Parts Washer',
      'Air Tools'
    ],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-12-01'),
    work_orders: [
      {
        id: 'wo-002',
        wo_number: 'WO-2024-002',
        title: 'Transmission Repair - Slipping in 3rd Gear',
        description: 'Driver reported transmission slipping between 2nd and 3rd gear under load. Diagnostic scan shows P0730 code (incorrect gear ratio). Transmission fluid dark and has burnt smell. Recommend full transmission rebuild.',
        type: 'corrective',
        priority: 'high',
        status: 'in_progress',
        created_date: '2024-11-28T10:00:00Z',
        scheduled_start: '2024-11-30T07:00:00Z',
        scheduled_end: '2024-12-02T17:00:00Z',
        estimated_completion: '2024-12-02T16:00:00Z',
        actual_start: '2024-11-30T07:30:00Z',
        progress_percentage: 45,
        estimated_cost: 4850.00,
        actual_cost: 3920.00,
        notes: [
          'Transmission removed - found metal shavings in pan',
          'Torque converter needs replacement',
          '3-4 clutch pack severely worn',
          'Parts on order - arriving Dec 2nd morning',
          'Customer authorized full rebuild'
        ],
        vehicle: {
          id: 'veh-102',
          vehicle_number: 'FLEET-2315',
          make: 'Chevrolet',
          model: 'Silverado 2500HD',
          year: 2021,
          vin: '1GC4YVEY2MF123456',
          license_plate: 'FLT2315',
          odometer_reading: 87459,
          engine_hours: 3245
        },
        primary_technician: {
          id: 'tech-003',
          name: 'Robert Chen',
          email: 'robert.chen@fleet.com',
          phone: '555-0102',
          avatar: 'https://i.pravatar.cc/150?img=68',
          role: 'Transmission Specialist',
          certifications: ['ASE Master Technician', 'ATRA Certified', 'GM Certified']
        },
        parts: [
          {
            id: 'part-006',
            name: 'Transmission Rebuild Kit',
            part_number: 'TRK-6L80E',
            quantity: 1,
            quantity_in_stock: 0,
            unit_cost: 1250.00,
            supplier: 'Advanced Transmission Parts',
            supplier_contact: 'Mike Stevens',
            supplier_phone: '555-0300',
            supplier_email: 'mike.s@atparts.com',
            delivery_date: '2024-12-02T08:00:00Z',
            status: 'ordered'
          },
          {
            id: 'part-007',
            name: 'Torque Converter',
            part_number: 'TC-6L80-HD',
            quantity: 1,
            quantity_in_stock: 0,
            unit_cost: 485.00,
            supplier: 'Advanced Transmission Parts',
            supplier_contact: 'Mike Stevens',
            supplier_phone: '555-0300',
            supplier_email: 'mike.s@atparts.com',
            delivery_date: '2024-12-02T08:00:00Z',
            status: 'ordered'
          },
          {
            id: 'part-008',
            name: 'Transmission Fluid (ATF)',
            part_number: 'DEXVI-QT',
            quantity: 12,
            quantity_in_stock: 48,
            unit_cost: 14.99,
            supplier: 'Fleet Parts Direct',
            supplier_contact: 'Sarah Johnson',
            supplier_phone: '555-0200',
            supplier_email: 'sarah.j@fleetparts.com',
            status: 'in_stock'
          },
          {
            id: 'part-009',
            name: 'Transmission Filter',
            part_number: 'TF-6L80E',
            quantity: 1,
            quantity_in_stock: 3,
            unit_cost: 67.50,
            supplier: 'Fleet Parts Direct',
            supplier_contact: 'Sarah Johnson',
            supplier_phone: '555-0200',
            supplier_email: 'sarah.j@fleetparts.com',
            status: 'in_stock'
          }
        ],
        labor: [
          {
            id: 'labor-003',
            technician_id: 'tech-003',
            technician_name: 'Robert Chen',
            technician_avatar: 'https://i.pravatar.cc/150?img=68',
            hours_logged: 12.5,
            hours_estimated: 28.0,
            rate: 110.00,
            date: '2024-11-30',
            task_description: 'Transmission removal, disassembly, inspection, and rebuild',
            status: 'in_progress'
          },
          {
            id: 'labor-004',
            technician_id: 'tech-004',
            technician_name: 'David Lopez',
            technician_avatar: 'https://i.pravatar.cc/150?img=52',
            hours_logged: 2.0,
            hours_estimated: 4.0,
            rate: 95.00,
            date: '2024-11-30',
            task_description: 'Assist with transmission removal and installation',
            status: 'in_progress'
          }
        ]
      }
    ]
  },
  {
    id: 'bay-003',
    tenant_id: 'tenant-001',
    bay_number: '3',
    bay_name: 'Bay 3 - Light Duty Service',
    location: 'Building A - South Wing',
    capacity: 2,
    status: 'available',
    equipment: [
      'Hydraulic Lift (10 ton)',
      'Tire Changer',
      'Wheel Balancer',
      'Brake Lathe',
      'Diagnostic Scanner'
    ],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-12-01'),
    work_orders: []
  },
  {
    id: 'bay-004',
    tenant_id: 'tenant-001',
    bay_number: '4',
    bay_name: 'Bay 4 - Emergency/Express',
    location: 'Building B - East Wing',
    capacity: 1,
    status: 'occupied',
    equipment: [
      'Quick Lift',
      'Diagnostic Computer',
      'Air Tools',
      'Parts Washer'
    ],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-12-01'),
    work_orders: [
      {
        id: 'wo-003',
        wo_number: 'WO-2024-003',
        title: 'Emergency - No Start Condition',
        description: 'Vehicle towed in - will not start. Driver reports it died while driving and would not restart. No warning lights prior to failure. Battery tested good. Investigating fuel delivery and ignition systems.',
        type: 'emergency',
        priority: 'critical',
        status: 'in_progress',
        created_date: '2024-12-01T14:00:00Z',
        scheduled_start: '2024-12-01T14:30:00Z',
        scheduled_end: '2024-12-01T18:00:00Z',
        estimated_completion: '2024-12-01T17:00:00Z',
        actual_start: '2024-12-01T14:35:00Z',
        progress_percentage: 30,
        estimated_cost: 650.00,
        actual_cost: 285.00,
        notes: [
          'No fuel pressure - fuel pump relay clicking',
          'Fuel pump fuse intact',
          'Testing fuel pump operation - likely failed pump',
          'High priority - vehicle needed for route tomorrow'
        ],
        vehicle: {
          id: 'veh-103',
          vehicle_number: 'FLEET-1807',
          make: 'Ram',
          model: 'ProMaster 2500',
          year: 2023,
          vin: '3C6TRVDG8PE123456',
          license_plate: 'FLT1807',
          odometer_reading: 28934,
          engine_hours: 987
        },
        primary_technician: {
          id: 'tech-005',
          name: 'Lisa Anderson',
          email: 'lisa.anderson@fleet.com',
          phone: '555-0103',
          avatar: 'https://i.pravatar.cc/150?img=45',
          role: 'Diagnostic Specialist',
          certifications: ['ASE Master Technician', 'L1 Advanced Diagnostics', 'Stellantis Certified']
        },
        parts: [
          {
            id: 'part-010',
            name: 'Fuel Pump Assembly',
            part_number: 'FP-PM2500',
            quantity: 1,
            quantity_in_stock: 1,
            unit_cost: 385.00,
            supplier: 'Auto Parts Warehouse',
            supplier_contact: 'Tom Bradley',
            supplier_phone: '555-0400',
            supplier_email: 'tom.b@apwarehouse.com',
            status: 'in_stock'
          },
          {
            id: 'part-011',
            name: 'Fuel Filter',
            part_number: 'FF-2500',
            quantity: 1,
            quantity_in_stock: 4,
            unit_cost: 42.50,
            supplier: 'Fleet Parts Direct',
            supplier_contact: 'Sarah Johnson',
            supplier_phone: '555-0200',
            supplier_email: 'sarah.j@fleetparts.com',
            status: 'in_stock'
          }
        ],
        labor: [
          {
            id: 'labor-005',
            technician_id: 'tech-005',
            technician_name: 'Lisa Anderson',
            technician_avatar: 'https://i.pravatar.cc/150?img=45',
            hours_logged: 1.5,
            hours_estimated: 4.5,
            rate: 105.00,
            date: '2024-12-01',
            task_description: 'Diagnostic and fuel pump replacement',
            status: 'in_progress'
          }
        ]
      }
    ]
  }
]

export default GarageBayService
