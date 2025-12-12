import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

/**
 * Repository for maintenance schedules
 * Extends BaseRepository for consistent pattern compliance
 * All methods include tenant_id filtering for security
 */

export interface MaintenanceSchedule {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  service_type: string;
  priority: string;
  status: string;
  trigger_metric?: string;
  trigger_value?: number;
  current_value?: number;
  next_due?: Date;
  estimated_cost?: number;
  is_recurring: boolean;
  recurrence_pattern?: any;
  auto_create_work_order?: boolean;
  work_order_template?: any;
  parts?: any;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface MaintenanceScheduleFilters {
  trigger_metric?: string;
  vehicle_id?: string;
  service_type?: string;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export class MaintenanceSchedulesRepository extends BaseRepository<MaintenanceSchedule> {
  constructor(pool: Pool) {
    super(pool, 'maintenance_schedules');
  }

  /**
   * Get paginated maintenance schedules with filters
   */
  async findMaintenanceSchedules(
    tenantId: string,
    filters: MaintenanceScheduleFilters,
    pagination: PaginationParams
  ): Promise<MaintenanceSchedule[]> {
    let query = `SELECT id, tenant_id, vehicle_id, service_type, priority, status,
                  trigger_metric, trigger_value, current_value, next_due,
                  estimated_cost, is_recurring, recurrence_pattern,
                  auto_create_work_order, work_order_template, notes,
                  created_at, updated_at
           FROM maintenance_schedules WHERE tenant_id = $1 AND deleted_at IS NULL`;
    
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.vehicle_id) {
      query += ` AND vehicle_id = $${paramIndex}`;
      params.push(filters.vehicle_id);
      paramIndex++;
    }

    if (filters.service_type) {
      query += ` AND service_type = $${paramIndex}`;
      params.push(filters.service_type);
      paramIndex++;
    }

    if (filters.trigger_metric) {
      query += ` AND trigger_metric = $${paramIndex}`;
      params.push(filters.trigger_metric);
      paramIndex++;
    }

    query += ` ORDER BY next_due ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pagination.limit, pagination.offset);

    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * N+1 PREVENTION: Get maintenance schedules with vehicle details
   */
  async findWithVehicle(tenantId: string) {
    const query = `
      SELECT 
        ms.*,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.vin as vehicle_vin
      FROM maintenance_schedules ms
      LEFT JOIN vehicles v ON ms.vehicle_id = v.id
      WHERE ms.tenant_id = $1 AND ms.deleted_at IS NULL
      ORDER BY ms.next_due ASC
    `;
    const result = await this.query(query, [tenantId]);
    return result.rows;
  }
}
