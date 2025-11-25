import { BaseRepository } from '../services/dal/BaseRepository';
import { connectionManager } from '../config/connection-manager';
import { PoolClient } from 'pg';

/**
 * Maintenance Schedule entity interface
 */
export interface MaintenanceSchedule {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  service_type: string;
  description?: string;
  scheduled_date: Date;
  completed_date?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  odometer_reading?: number;
  estimated_cost?: number;
  actual_cost?: number;
  assigned_vendor_id?: string;
  assigned_technician?: string;
  notes?: string;
  recurring: boolean;
  recurring_interval_miles?: number;
  recurring_interval_days?: number;
  next_service_date?: Date;
  next_service_odometer?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

/**
 * Maintenance Repository
 * Provides data access operations for maintenance schedules with tenant isolation
 */
export class MaintenanceRepository extends BaseRepository<MaintenanceSchedule> {
  constructor() {
    super('maintenance_schedules', connectionManager.getWritePool());
  }

  /**
   * Find all maintenance schedules for a tenant
   */
  async findByTenant(tenantId: string): Promise<MaintenanceSchedule[]> {
    return this.findAll({
      where: { tenant_id: tenantId },
      orderBy: 'scheduled_date DESC'
    });
  }

  /**
   * Get paginated maintenance schedules with filters
   */
  async getPaginatedSchedules(
    tenantId: string,
    filters: {
      vehicle_id?: string;
      status?: string;
      service_type?: string;
      priority?: string;
      assigned_vendor_id?: string;
      from_date?: Date;
      to_date?: Date;
    } = {},
    options: { page?: number; limit?: number } = {}
  ) {
    const where: Record<string, any> = { tenant_id: tenantId };

    // Add filters
    if (filters.vehicle_id) where.vehicle_id = filters.vehicle_id;
    if (filters.status) where.status = filters.status;
    if (filters.service_type) where.service_type = filters.service_type;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigned_vendor_id) where.assigned_vendor_id = filters.assigned_vendor_id;

    // Date range filtering requires custom query
    if (filters.from_date || filters.to_date) {
      return this.findSchedulesByDateRange(
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
      orderBy: 'scheduled_date DESC'
    });
  }

  /**
   * Find schedules by date range (custom query)
   */
  async findSchedulesByDateRange(
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
    additionalFilters: Record<string, any> = {},
    options: { page?: number; limit?: number } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (fromDate) {
      conditions.push(`scheduled_date >= $${paramCount}`);
      values.push(fromDate);
      paramCount++;
    }

    if (toDate) {
      conditions.push(`scheduled_date <= $${paramCount}`);
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

    const whereClause = 'WHERE ${conditions.join(' AND ')}';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.query<{ count: string }>(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated data
    const columns = 'id, tenant_id, vehicle_id, service_type, description, scheduled_date, completed_date, status, odometer_reading, estimated_cost, actual_cost, assigned_vendor_id, assigned_technician, notes, recurring, recurring_interval_miles, recurring_interval_days, next_service_date, next_service_odometer, priority, created_at, updated_at, deleted_at';
    const dataQuery = `
      SELECT ${columns} FROM ${this.tableName}
      ${whereClause}
      ORDER BY scheduled_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const dataResult = await this.query<MaintenanceSchedule>(dataQuery, values);

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
   * Create a new maintenance schedule
   */
  async createSchedule(tenantId: string, data: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
    return this.create({
      ...data,
      tenant_id: tenantId,
      status: data.status || 'scheduled',
      recurring: data.recurring || false,
      priority: data.priority || 'medium'
    });
  }

  /**
   * Update a maintenance schedule
   */
  async updateSchedule(
    id: string,
    tenantId: string,
    data: Partial<MaintenanceSchedule>
  ): Promise<MaintenanceSchedule> {
    return this.update(id, data, tenantId);
  }

  /**
   * Delete a maintenance schedule (soft delete)
   */
  async deleteSchedule(id: string, tenantId: string): Promise<boolean> {
    return this.softDelete(id, tenantId).then(() => true).catch(() => false);
  }

  /**
   * Find schedule by ID for a tenant
   */
  async findByIdAndTenant(id: string, tenantId: string): Promise<MaintenanceSchedule | null> {
    return this.findById(id, tenantId);
  }

  /**
   * Find schedules by vehicle
   */
  async findByVehicle(tenantId: string, vehicleId: string): Promise<MaintenanceSchedule[]> {
    return this.findAll({
      where: { tenant_id: tenantId, vehicle_id: vehicleId },
      orderBy: 'scheduled_date DESC'
    });
  }

  /**
   * Find schedules by status
   */
  async findByStatus(tenantId: string, status: string): Promise<MaintenanceSchedule[]> {
    return this.findAll({
      where: { tenant_id: tenantId, status },
      orderBy: 'scheduled_date DESC'
    });
  }

  /**
   * Find overdue schedules
   */
  async findOverdue(tenantId: string): Promise<MaintenanceSchedule[]> {
    const columns = 'id, tenant_id, vehicle_id, service_type, description, scheduled_date, completed_date, status, odometer_reading, estimated_cost, actual_cost, assigned_vendor_id, assigned_technician, notes, recurring, recurring_interval_miles, recurring_interval_days, next_service_date, next_service_odometer, priority, created_at, updated_at, deleted_at';
    const query = `
      SELECT ${columns} FROM ${this.tableName}
      WHERE tenant_id = $1
        AND status IN ('scheduled', 'in_progress')
        AND scheduled_date < NOW()
        AND deleted_at IS NULL
      ORDER BY scheduled_date ASC
    `;

    const result = await this.query<MaintenanceSchedule>(query, [tenantId]);
    return result.rows;
  }

  /**
   * Find upcoming schedules (within next N days)
   */
  async findUpcoming(tenantId: string, daysAhead: number = 7): Promise<MaintenanceSchedule[]> {
    const columns = 'id, tenant_id, vehicle_id, service_type, description, scheduled_date, completed_date, status, odometer_reading, estimated_cost, actual_cost, assigned_vendor_id, assigned_technician, notes, recurring, recurring_interval_miles, recurring_interval_days, next_service_date, next_service_odometer, priority, created_at, updated_at, deleted_at';
    const query = `
      SELECT ${columns} FROM ${this.tableName}
      WHERE tenant_id = $1
        AND status = 'scheduled'
        AND scheduled_date BETWEEN NOW() AND NOW() + INTERVAL '${daysAhead} days'
        AND deleted_at IS NULL
      ORDER BY scheduled_date ASC
    `;

    const result = await this.query<MaintenanceSchedule>(query, [tenantId]);
    return result.rows;
  }

  /**
   * Find recurring schedules
   */
  async findRecurring(tenantId: string): Promise<MaintenanceSchedule[]> {
    return this.findAll({
      where: { tenant_id: tenantId, recurring: true },
      orderBy: 'next_service_date ASC'
    });
  }

  /**
   * Complete a maintenance schedule
   */
  async completeSchedule(
    id: string,
    tenantId: string,
    data: {
      completed_date?: Date;
      actual_cost?: number;
      odometer_reading?: number;
      notes?: string;
    }
  ): Promise<MaintenanceSchedule> {
    return this.update(id, {
      ...data,
      status: 'completed',
      completed_date: data.completed_date || new Date()
    }, tenantId);
  }

  /**
   * Mark schedule as in progress
   */
  async startSchedule(id: string, tenantId: string): Promise<MaintenanceSchedule> {
    return this.update(id, { status: 'in_progress' }, tenantId);
  }

  /**
   * Cancel a schedule
   */
  async cancelSchedule(id: string, tenantId: string, reason?: string): Promise<MaintenanceSchedule> {
    return this.update(id, {
      status: 'cancelled',
      notes: reason
    }, tenantId);
  }

  /**
   * Get maintenance statistics for a tenant
   */
  async getMaintenanceStats(tenantId: string): Promise<{
    total: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    overdue_count: number;
    upcoming_count: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE priority = 'low') as priority_low,
        COUNT(*) FILTER (WHERE priority = 'medium') as priority_medium,
        COUNT(*) FILTER (WHERE priority = 'high') as priority_high,
        COUNT(*) FILTER (WHERE priority = 'critical') as priority_critical,
        COUNT(*) FILTER (
          WHERE status IN ('scheduled', 'in_progress')
          AND scheduled_date < NOW()
        ) as overdue_count,
        COUNT(*) FILTER (
          WHERE status = 'scheduled'
          AND scheduled_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        ) as upcoming_count
      FROM ${this.tableName}
      WHERE tenant_id = $1 AND deleted_at IS NULL
    `;

    interface MaintenanceStatsRow {
      total: string
      scheduled: string
      in_progress: string
      completed: string
      overdue: string
      cancelled: string
      priority_low: string
      priority_medium: string
      priority_high: string
      priority_critical: string
      overdue_count: string
      upcoming_count: string
    }

    const result = await this.query<MaintenanceStatsRow>(query, [tenantId]);
    const row = result.rows[0];

    return {
      total: parseInt(row.total || '0'),
      by_status: {
        scheduled: parseInt(row.scheduled || '0'),
        in_progress: parseInt(row.in_progress || '0'),
        completed: parseInt(row.completed || '0'),
        overdue: parseInt(row.overdue || '0'),
        cancelled: parseInt(row.cancelled || '0')
      },
      by_priority: {
        low: parseInt(row.priority_low || '0'),
        medium: parseInt(row.priority_medium || '0'),
        high: parseInt(row.priority_high || '0'),
        critical: parseInt(row.priority_critical || '0')
      },
      overdue_count: parseInt(row.overdue_count || '0'),
      upcoming_count: parseInt(row.upcoming_count || '0')
    };
  }

  /**
   * Get maintenance history for a vehicle
   */
  async getVehicleMaintenanceHistory(
    tenantId: string,
    vehicleId: string,
    limit: number = 50
  ): Promise<MaintenanceSchedule[]> {
    return this.findAll({
      where: { tenant_id: tenantId, vehicle_id: vehicleId, status: 'completed' },
      orderBy: 'completed_date DESC',
      limit
    });
  }

  /**
   * Bulk create recurring schedules
   */
  async createRecurringSchedules(
    tenantId: string,
    schedules: Partial<MaintenanceSchedule>[]
  ): Promise<MaintenanceSchedule[]> {
    if (schedules.length === 0) return [];

    const schedulesWithDefaults = schedules.map(schedule => ({
      ...schedule,
      tenant_id: tenantId,
      recurring: true,
      status: 'scheduled' as const,
      priority: schedule.priority || 'medium' as const
    }));

    return this.bulkCreate(schedulesWithDefaults);
  }
}
