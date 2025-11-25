import { BaseRepository } from '../services/dal/BaseRepository';
import { connectionManager } from '../config/connection-manager';
import { PoolClient } from 'pg';

/**
 * Work Order entity interface
 */
export interface WorkOrder {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  work_order_type: 'repair' | 'maintenance' | 'inspection' | 'modification' | 'other';
  assigned_to?: string;
  assigned_vendor_id?: string;
  assigned_technician?: string;
  estimated_cost?: number;
  actual_cost?: number;
  estimated_hours?: number;
  actual_hours?: number;
  parts_cost?: number;
  labor_cost?: number;
  odometer_reading?: number;
  scheduled_start_date?: Date;
  scheduled_end_date?: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  completed_date?: Date;
  notes?: string;
  attachments?: string[];
  related_maintenance_schedule_id?: string;
  related_inspection_id?: string;
  warranty_covered?: boolean;
  warranty_claim_number?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

/**
 * Work Order Repository
 * Provides data access operations for work orders with tenant isolation
 */
export class WorkOrderRepository extends BaseRepository<WorkOrder> {
  constructor() {
    super('work_orders', connectionManager.getWritePool());
  }

  /**
   * Find all work orders for a tenant
   */
  async findByTenant(tenantId: string): Promise<WorkOrder[]> {
    return this.findAll({
      where: { tenant_id: tenantId },
      orderBy: 'created_at DESC'
    });
  }

  /**
   * Get paginated work orders with filters
   */
  async getPaginatedWorkOrders(
    tenantId: string,
    filters: {
      vehicle_id?: string;
      status?: string;
      priority?: string;
      work_order_type?: string;
      assigned_vendor_id?: string;
      assigned_to?: string;
      warranty_covered?: boolean;
      from_date?: Date;
      to_date?: Date;
    } = {},
    options: { page?: number; limit?: number } = {}
  ) {
    const where: Record<string, any> = { tenant_id: tenantId };

    // Add simple filters
    if (filters.vehicle_id) where.vehicle_id = filters.vehicle_id;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.work_order_type) where.work_order_type = filters.work_order_type;
    if (filters.assigned_vendor_id) where.assigned_vendor_id = filters.assigned_vendor_id;
    if (filters.assigned_to) where.assigned_to = filters.assigned_to;
    if (filters.warranty_covered !== undefined) where.warranty_covered = filters.warranty_covered;

    // Date range filtering requires custom query
    if (filters.from_date || filters.to_date) {
      return this.findWorkOrdersByDateRange(
        tenantId,
        filters.from_date,
        filters.to_date,
        filters,
        options
      );
    }

    return this.paginate({
      where,
      page: options.page || 1,
      limit: options.limit || 50,
      orderBy: 'created_at DESC'
    });
  }

  /**
   * Find work orders by date range
   */
  async findWorkOrdersByDateRange(
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
    additionalFilters: Record<string, any> = {},
    options: { page?: number; limit?: number } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = $1', 'deleted_at IS NULL'];
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (fromDate) {
      conditions.push(`created_at >= $${paramCount}`);
      values.push(fromDate);
      paramCount++;
    }

    if (toDate) {
      conditions.push(`created_at <= $${paramCount}`);
      values.push(toDate);
      paramCount++;
    }

    // Add additional filters
    Object.entries(additionalFilters).forEach(([key, value]) => {
      if (value !== undefined && key !== 'from_date' && key !== 'to_date') {
        conditions.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    const whereClause = 'WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.query<{ count: string }>(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated data
    const columns = 'id, tenant_id, vehicle_id, type, priority, description, estimated_cost, actual_cost, status, created_at, updated_at, deleted_at, metadata, created_by, assigned_to';
    const dataQuery = `
      SELECT ${columns} FROM ${this.tableName}
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const dataResult = await this.query<WorkOrder>(dataQuery, values);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create a new work order
   */
  async createWorkOrder(tenantId: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
    return this.create({
      ...data,
      tenant_id: tenantId,
      status: data.status || 'open',
      priority: data.priority || 'medium',
      work_order_type: data.work_order_type || 'repair'
    });
  }

  /**
   * Update a work order
   */
  async updateWorkOrder(
    id: string,
    tenantId: string,
    data: Partial<WorkOrder>
  ): Promise<WorkOrder> {
    return this.update(id, data, tenantId);
  }

  /**
   * Delete a work order (soft delete)
   */
  async deleteWorkOrder(id: string, tenantId: string): Promise<boolean> {
    return this.softDelete(id, tenantId).then(() => true).catch(() => false);
  }

  /**
   * Find work order by ID for a tenant
   */
  async findByIdAndTenant(id: string, tenantId: string): Promise<WorkOrder | null> {
    return this.findById(id, tenantId);
  }

  /**
   * Find work orders by vehicle
   */
  async findByVehicle(tenantId: string, vehicleId: string): Promise<WorkOrder[]> {
    return this.findAll({
      where: { tenant_id: tenantId, vehicle_id: vehicleId },
      orderBy: 'created_at DESC'
    });
  }

  /**
   * Find work orders by status
   */
  async findByStatus(tenantId: string, status: string): Promise<WorkOrder[]> {
    return this.findAll({
      where: { tenant_id: tenantId, status },
      orderBy: 'created_at DESC'
    });
  }

  /**
   * Find active work orders (open or in progress)
   */
  async findActive(tenantId: string): Promise<WorkOrder[]> {
    const columns = 'id, tenant_id, vehicle_id, type, priority, description, estimated_cost, actual_cost, status, created_at, updated_at, deleted_at, metadata, created_by, assigned_to';
    const query = `
      SELECT ${columns} FROM ${this.tableName}
      WHERE tenant_id = $1
        AND status IN ('open', 'in_progress')
        AND deleted_at IS NULL
      ORDER BY priority DESC, created_at ASC
    `;

    const result = await this.query<WorkOrder>(query, [tenantId]);
    return result.rows;
  }

  /**
   * Find overdue work orders
   */
  async findOverdue(tenantId: string): Promise<WorkOrder[]> {
    const columns = 'id, tenant_id, vehicle_id, type, priority, description, estimated_cost, actual_cost, status, created_at, updated_at, deleted_at, metadata, created_by, assigned_to';
    const query = `
      SELECT ${columns} FROM ${this.tableName}
      WHERE tenant_id = $1
        AND status IN ('open', 'in_progress')
        AND scheduled_end_date < NOW()
        AND deleted_at IS NULL
      ORDER BY scheduled_end_date ASC
    `;

    const result = await this.query<WorkOrder>(query, [tenantId]);
    return result.rows;
  }

  /**
   * Find work orders by priority
   */
  async findByPriority(tenantId: string, priority: string): Promise<WorkOrder[]> {
    return this.findAll({
      where: { tenant_id: tenantId, priority },
      orderBy: 'created_at DESC'
    });
  }

  /**
   * Find work orders assigned to a user
   */
  async findAssignedTo(tenantId: string, userId: string): Promise<WorkOrder[]> {
    return this.findAll({
      where: { tenant_id: tenantId, assigned_to: userId },
      orderBy: 'priority DESC, created_at ASC'
    });
  }

  /**
   * Find work orders assigned to a vendor
   */
  async findByVendor(tenantId: string, vendorId: string): Promise<WorkOrder[]> {
    return this.findAll({
      where: { tenant_id: tenantId, assigned_vendor_id: vendorId },
      orderBy: 'created_at DESC'
    });
  }

  /**
   * Find warranty-covered work orders
   */
  async findWarrantyOrders(tenantId: string): Promise<WorkOrder[]> {
    return this.findAll({
      where: { tenant_id: tenantId, warranty_covered: true },
      orderBy: 'created_at DESC'
    });
  }

  /**
   * Start a work order (mark as in progress)
   */
  async startWorkOrder(id: string, tenantId: string): Promise<WorkOrder> {
    return this.update(id, {
      status: 'in_progress',
      actual_start_date: new Date()
    }, tenantId);
  }

  /**
   * Complete a work order
   */
  async completeWorkOrder(
    id: string,
    tenantId: string,
    data: {
      actual_cost?: number;
      actual_hours?: number;
      parts_cost?: number;
      labor_cost?: number;
      odometer_reading?: number;
      notes?: string;
    }
  ): Promise<WorkOrder> {
    return this.update(id, {
      ...data,
      status: 'completed',
      completed_date: new Date(),
      actual_end_date: new Date()
    }, tenantId);
  }

  /**
   * Cancel a work order
   */
  async cancelWorkOrder(id: string, tenantId: string, reason?: string): Promise<WorkOrder> {
    return this.update(id, {
      status: 'cancelled',
      notes: reason
    }, tenantId);
  }

  /**
   * Put work order on hold
   */
  async holdWorkOrder(id: string, tenantId: string, reason?: string): Promise<WorkOrder> {
    return this.update(id, {
      status: 'on_hold',
      notes: reason
    }, tenantId);
  }

  /**
   * Assign work order to user
   */
  async assignToUser(id: string, tenantId: string, userId: string): Promise<WorkOrder> {
    return this.update(id, { assigned_to: userId }, tenantId);
  }

  /**
   * Assign work order to vendor
   */
  async assignToVendor(
    id: string,
    tenantId: string,
    vendorId: string,
    technicianName?: string
  ): Promise<WorkOrder> {
    return this.update(id, {
      assigned_vendor_id: vendorId,
      assigned_technician: technicianName
    }, tenantId);
  }

  /**
   * Approve work order
   */
  async approveWorkOrder(
    id: string,
    tenantId: string,
    approvedBy: string
  ): Promise<WorkOrder> {
    return this.update(id, {
      approved_by: approvedBy,
      approved_at: new Date()
    }, tenantId);
  }

  /**
   * Get work order statistics for a tenant
   */
  async getWorkOrderStats(tenantId: string): Promise<{
    total: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    by_type: Record<string, number>;
    overdue_count: number;
    active_count: number;
    avg_completion_days: number;
    total_cost: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as status_open,
        COUNT(*) FILTER (WHERE status = 'in_progress') as status_in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as status_completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as status_cancelled,
        COUNT(*) FILTER (WHERE status = 'on_hold') as status_on_hold,
        COUNT(*) FILTER (WHERE priority = 'low') as priority_low,
        COUNT(*) FILTER (WHERE priority = 'medium') as priority_medium,
        COUNT(*) FILTER (WHERE priority = 'high') as priority_high,
        COUNT(*) FILTER (WHERE priority = 'critical') as priority_critical,
        COUNT(*) FILTER (WHERE work_order_type = 'repair') as type_repair,
        COUNT(*) FILTER (WHERE work_order_type = 'maintenance') as type_maintenance,
        COUNT(*) FILTER (WHERE work_order_type = 'inspection') as type_inspection,
        COUNT(*) FILTER (WHERE work_order_type = 'modification') as type_modification,
        COUNT(*) FILTER (WHERE work_order_type = 'other') as type_other,
        COUNT(*) FILTER (
          WHERE status IN ('open', 'in_progress')
          AND scheduled_end_date < NOW()
        ) as overdue_count,
        COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')) as active_count,
        AVG(
          EXTRACT(EPOCH FROM (completed_date - actual_start_date)) / 86400
        ) FILTER (WHERE status = 'completed' AND completed_date IS NOT NULL AND actual_start_date IS NOT NULL) as avg_completion_days,
        COALESCE(SUM(actual_cost), 0) as total_cost
      FROM ${this.tableName}
      WHERE tenant_id = $1 AND deleted_at IS NULL
    `;

    interface WorkOrderStatsRow {
      total: string
      status_open: string
      status_in_progress: string
      status_completed: string
      status_cancelled: string
      status_on_hold: string
      priority_low: string
      priority_medium: string
      priority_high: string
      priority_critical: string
      type_repair: string
      type_maintenance: string
      type_inspection: string
      type_modification: string
      type_other: string
      overdue_count: string
      active_count: string
      avg_completion_days: string
      total_cost: string
    }

    const result = await this.query<WorkOrderStatsRow>(query, [tenantId]);
    const row = result.rows[0];

    return {
      total: parseInt(row.total || '0'),
      by_status: {
        open: parseInt(row.status_open || '0'),
        in_progress: parseInt(row.status_in_progress || '0'),
        completed: parseInt(row.status_completed || '0'),
        cancelled: parseInt(row.status_cancelled || '0'),
        on_hold: parseInt(row.status_on_hold || '0')
      },
      by_priority: {
        low: parseInt(row.priority_low || '0'),
        medium: parseInt(row.priority_medium || '0'),
        high: parseInt(row.priority_high || '0'),
        critical: parseInt(row.priority_critical || '0')
      },
      by_type: {
        repair: parseInt(row.type_repair || '0'),
        maintenance: parseInt(row.type_maintenance || '0'),
        inspection: parseInt(row.type_inspection || '0'),
        modification: parseInt(row.type_modification || '0'),
        other: parseInt(row.type_other || '0')
      },
      overdue_count: parseInt(row.overdue_count || '0'),
      active_count: parseInt(row.active_count || '0'),
      avg_completion_days: parseFloat(row.avg_completion_days || '0'),
      total_cost: parseFloat(row.total_cost || '0')
    };
  }

  /**
   * Get work order history for a vehicle
   */
  async getVehicleWorkOrderHistory(
    tenantId: string,
    vehicleId: string,
    limit: number = 50
  ): Promise<WorkOrder[]> {
    return this.findAll({
      where: { tenant_id: tenantId, vehicle_id: vehicleId },
      orderBy: 'created_at DESC',
      limit
    });
  }

  /**
   * Get work orders by cost range
   */
  async findByCostRange(
    tenantId: string,
    minCost: number,
    maxCost: number
  ): Promise<WorkOrder[]> {
    const columns = 'id, tenant_id, vehicle_id, type, priority, description, estimated_cost, actual_cost, status, created_at, updated_at, deleted_at, metadata, created_by, assigned_to';
    const query = `
      SELECT ${columns} FROM ${this.tableName}
      WHERE tenant_id = $1
        AND actual_cost BETWEEN $2 AND $3
        AND deleted_at IS NULL
      ORDER BY actual_cost DESC
    `;

    const result = await this.query<WorkOrder>(query, [tenantId, minCost, maxCost]);
    return result.rows;
  }

  /**
   * Bulk assign work orders to a vendor
   */
  async bulkAssignToVendor(
    workOrderIds: string[],
    tenantId: string,
    vendorId: string
  ): Promise<number> {
    if (workOrderIds.length === 0) return 0;

    const idPlaceholders = workOrderIds.map((_, idx) => '$${3 + idx}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET assigned_vendor_id = $1, updated_at = NOW()
      WHERE tenant_id = $2
        AND id IN (${idPlaceholders})
        AND deleted_at IS NULL
    `;

    const result = await this.query(query, [vendorId, tenantId, ...workOrderIds]);
    return result.rowCount || 0;
  }

  /**
   * Bulk update work order status
   */
  async bulkUpdateStatus(
    workOrderIds: string[],
    tenantId: string,
    status: string
  ): Promise<number> {
    if (workOrderIds.length === 0) return 0;

    const idPlaceholders = workOrderIds.map((_, idx) => '$${3 + idx}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET status = $1, updated_at = NOW()
      WHERE tenant_id = $2
        AND id IN (${idPlaceholders})
        AND deleted_at IS NULL
    `;

    const result = await this.query(query, [status, tenantId, ...workOrderIds]);
    return result.rowCount || 0;
  }
}
