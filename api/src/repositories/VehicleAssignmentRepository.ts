import { PoolClient } from 'pg'

import { connectionManager } from '../config/connection-manager'
import { BaseRepository } from '../services/dal/BaseRepository'

/**
 * Vehicle Assignment entity interface
 */
export interface VehicleAssignment {
  id: string
  tenant_id?: string
  vehicle_id: string
  driver_id: string
  department_id?: string
  assignment_type: 'designated' | 'on_call' | 'temporary' | 'primary' | 'shared' | 'pool'
  start_date?: string
  end_date?: string
  is_ongoing?: boolean
  lifecycle_state?: 'draft' | 'submitted' | 'approved' | 'denied' | 'active' | 'suspended' | 'terminated' | 'pending_reauth'
  authorized_use?: string
  commuting_authorized?: boolean
  on_call_only?: boolean
  recommended_by_user_id?: string
  recommended_at?: Date
  recommendation_notes?: string
  approval_status?: string
  approved_by_user_id?: string
  approved_at?: Date
  denied_by_user_id?: string
  denied_at?: Date
  approval_notes?: string
  denial_reason?: string
  geographic_constraints?: Record<string, any>
  requires_secured_parking?: boolean
  secured_parking_location_id?: string
  cost_benefit_analysis_id?: string
  created_at?: Date
  updated_at?: Date
  created_by_user_id?: string

  // Legacy fields from migrations
  assignment_start?: Date
  assignment_end?: Date
  is_active?: boolean
  odometer_start?: number
  odometer_end?: number
  engine_hours_start?: number
  engine_hours_end?: number
  pre_trip_inspection_id?: string
  post_trip_inspection_id?: string
  notes?: string
  assigned_by?: string
}

export interface VehicleAssignmentFilters {
  assignment_type?: string
  lifecycle_state?: string
  driver_id?: string
  vehicle_id?: string
  department_id?: string
  is_active?: boolean
}

/**
 * Vehicle Assignment Repository
 * Provides data access operations for vehicle assignments using the DAL
 */
export class VehicleAssignmentRepository extends BaseRepository<VehicleAssignment> {
  constructor() {
    super('vehicle_assignments', connectionManager.getWritePool())
  }

  /**
   * Find all assignments for a tenant with optional filtering
   */
  async findByTenantWithFilters(
    tenantId: string,
    filters: VehicleAssignmentFilters = {},
    options: { page?: number; limit?: number } = {},
    client?: PoolClient
  ): Promise<{ data: VehicleAssignment[]; total: number }> {
    const { page = 1, limit = 50 } = options
    const offset = (page - 1) * limit

    // Build WHERE conditions
    const where: Record<string, any> = { tenant_id: tenantId }

    if (filters.assignment_type) {
      where.assignment_type = filters.assignment_type
    }
    if (filters.lifecycle_state) {
      where.lifecycle_state = filters.lifecycle_state
    }
    if (filters.driver_id) {
      where.driver_id = filters.driver_id
    }
    if (filters.vehicle_id) {
      where.vehicle_id = filters.vehicle_id
    }
    if (filters.department_id) {
      where.department_id = filters.department_id
    }
    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active
    }

    // Get total count
    const total = await this.count({ where, client })

    // Get paginated data
    const data = await this.findAll({
      where,
      orderBy: 'created_at DESC',
      limit,
      offset,
      client
    })

    return { data, total }
  }

  /**
   * Get paginated assignments for a tenant
   */
  async getPaginatedAssignments(
    tenantId: string,
    options: { page?: number; limit?: number } = {},
    client?: PoolClient
  ) {
    return this.paginate({
      where: { tenant_id: tenantId },
      page: options.page || 1,
      limit: options.limit || 50,
      orderBy: 'created_at DESC',
      client
    })
  }

  /**
   * Create a new assignment
   */
  async createAssignment(
    tenantId: string,
    data: Partial<VehicleAssignment>,
    client?: PoolClient
  ): Promise<VehicleAssignment> {
    return this.create({
      ...data,
      tenant_id: tenantId
    }, client)
  }

  /**
   * Update an assignment
   */
  async updateAssignment(
    id: string,
    tenantId: string,
    data: Partial<VehicleAssignment>,
    client?: PoolClient
  ): Promise<VehicleAssignment> {
    return this.update(id, data, tenantId, client)
  }

  /**
   * Delete an assignment
   */
  async deleteAssignment(
    id: string,
    tenantId: string,
    client?: PoolClient
  ): Promise<boolean> {
    return this.delete(id, tenantId, client)
  }

  /**
   * Find assignment by ID for a tenant
   */
  async findByIdAndTenant(
    id: string,
    tenantId: string,
    client?: PoolClient
  ): Promise<VehicleAssignment | null> {
    return this.findById(id, tenantId, client)
  }

  /**
   * Find active assignment for a vehicle
   */
  async findActiveByVehicle(
    vehicleId: string,
    tenantId: string,
    client?: PoolClient
  ): Promise<VehicleAssignment | null> {
    return this.findOne({
      vehicle_id: vehicleId,
      tenant_id: tenantId,
      is_active: true
    }, client)
  }

  /**
   * Find active assignment for a driver
   */
  async findActiveByDriver(
    driverId: string,
    tenantId: string,
    client?: PoolClient
  ): Promise<VehicleAssignment | null> {
    return this.findOne({
      driver_id: driverId,
      tenant_id: tenantId,
      is_active: true
    }, client)
  }

  /**
   * Find all assignments for a vehicle
   */
  async findByVehicle(
    vehicleId: string,
    tenantId: string,
    client?: PoolClient
  ): Promise<VehicleAssignment[]> {
    return this.findAll({
      where: {
        vehicle_id: vehicleId,
        tenant_id: tenantId
      },
      orderBy: 'created_at DESC',
      client
    })
  }

  /**
   * Find all assignments for a driver
   */
  async findByDriver(
    driverId: string,
    tenantId: string,
    client?: PoolClient
  ): Promise<VehicleAssignment[]> {
    return this.findAll({
      where: {
        driver_id: driverId,
        tenant_id: tenantId
      },
      orderBy: 'created_at DESC',
      client
    })
  }

  /**
   * Find assignments by lifecycle state
   */
  async findByLifecycleState(
    state: string,
    tenantId: string,
    options: { page?: number; limit?: number } = {},
    client?: PoolClient
  ): Promise<{ data: VehicleAssignment[]; total: number }> {
    const { page = 1, limit = 50 } = options
    const offset = (page - 1) * limit

    const where = {
      tenant_id: tenantId,
      lifecycle_state: state
    }

    const total = await this.count({ where, client })

    const data = await this.findAll({
      where,
      orderBy: 'created_at DESC',
      limit,
      offset,
      client
    })

    return { data, total }
  }

  /**
   * Update lifecycle state of an assignment
   */
  async updateLifecycleState(
    id: string,
    tenantId: string,
    state: string,
    notes?: string,
    client?: PoolClient
  ): Promise<VehicleAssignment> {
    const updateData: Partial<VehicleAssignment> = {
      lifecycle_state: state as any
    }

    if (notes) {
      updateData.notes = notes
    }

    return this.update(id, updateData, tenantId, client)
  }

  /**
   * Approve an assignment
   */
  async approveAssignment(
    id: string,
    tenantId: string,
    approvedByUserId: string,
    approvalNotes?: string,
    client?: PoolClient
  ): Promise<VehicleAssignment> {
    return this.update(
      id,
      {
        approval_status: 'approved',
        approved_by_user_id: approvedByUserId,
        approved_at: new Date(),
        approval_notes: approvalNotes,
        lifecycle_state: 'approved'
      },
      tenantId,
      client
    )
  }

  /**
   * Deny an assignment
   */
  async denyAssignment(
    id: string,
    tenantId: string,
    deniedByUserId: string,
    denialReason?: string,
    client?: PoolClient
  ): Promise<VehicleAssignment> {
    return this.update(
      id,
      {
        approval_status: 'denied',
        denied_by_user_id: deniedByUserId,
        denied_at: new Date(),
        denial_reason: denialReason,
        lifecycle_state: 'denied'
      },
      tenantId,
      client
    )
  }
}
