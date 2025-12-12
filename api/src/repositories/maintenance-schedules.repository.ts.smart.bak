import { BaseRepository } from './BaseRepository';

import pool from '../config/database';
import { PoolClient } from 'pg';

/**
 * Repository for maintenance schedules
 * Eliminates all direct database queries from routes
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

/**
 * Get paginated maintenance schedules with filters
 */
export async function findMaintenanceSchedules(
  tenantId: string,
  filters: MaintenanceScheduleFilters,
  pagination: PaginationParams
): Promise<MaintenanceSchedule[]> {
  let query = `SELECT id, tenant_id, vehicle_id, service_type, priority, status,
                trigger_metric, trigger_value, current_value, next_due,
                estimated_cost, is_recurring, recurrence_pattern,
                auto_create_work_order, work_order_template, notes,
                created_at, updated_at
         FROM maintenance_schedules WHERE tenant_id = $1`;
  
  const params: any[] = [tenantId];
  let paramIndex = 2;

  if (filters.trigger_metric) {
    query += ` AND trigger_metric = $${paramIndex++}`;
    params.push(filters.trigger_metric);
  }

  if (filters.vehicle_id) {
    query += ` AND vehicle_id = $${paramIndex++}`;
    params.push(filters.vehicle_id);
  }

  if (filters.service_type) {
    query += ` AND service_type = $${paramIndex++}`;
    params.push(filters.service_type);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pagination.limit, pagination.offset);

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Count maintenance schedules with filters
 */
export async function countMaintenanceSchedules(
  tenantId: string,
  filters: MaintenanceScheduleFilters
): Promise<number> {
  let query = `SELECT COUNT(*) FROM maintenance_schedules WHERE tenant_id = $1`;
  const params: any[] = [tenantId];
  let paramIndex = 2;

  if (filters.trigger_metric) {
    query += ` AND trigger_metric = $${paramIndex++}`;
    params.push(filters.trigger_metric);
  }

  if (filters.vehicle_id) {
    query += ` AND vehicle_id = $${paramIndex++}`;
    params.push(filters.vehicle_id);
  }

  if (filters.service_type) {
    query += ` AND service_type = $${paramIndex++}`;
    params.push(filters.service_type);
  }

  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count);
}

/**
 * Find maintenance schedule by ID
 */
export async function findMaintenanceScheduleById(
  id: string,
  tenantId: string
): Promise<MaintenanceSchedule | null> {
  const result = await pool.query(
    `SELECT id, tenant_id, vehicle_id, service_type, priority, status,
            trigger_metric, trigger_value, current_value, next_due,
            estimated_cost, is_recurring, recurrence_pattern,
            auto_create_work_order, work_order_template, parts,
            notes, created_at, updated_at
     FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Create maintenance schedule
 */
export async function createMaintenanceSchedule(
  tenantId: string,
  columnNames: string,
  placeholders: string,
  values: any[]
): Promise<MaintenanceSchedule> {
  const result = await pool.query(
    `INSERT INTO maintenance_schedules (${columnNames}) VALUES (${placeholders}) RETURNING *`,
    [tenantId, ...values]
  );

  return result.rows[0];
}

/**
 * Update maintenance schedule
 */
export async function updateMaintenanceSchedule(
  id: string,
  tenantId: string,
  fields: string,
  values: any[]
): Promise<MaintenanceSchedule | null> {
  const result = await pool.query(
    `UPDATE maintenance_schedules SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
    [id, tenantId, ...values]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Delete maintenance schedule
 */
export async function deleteMaintenanceSchedule(
  id: string,
  tenantId: string
): Promise<string | null> {
  const result = await pool.query(
    `DELETE FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );

  return result.rows.length > 0 ? result.rows[0].id : null;
}

/**
 * Create recurring maintenance schedule
 */
export async function createRecurringSchedule(
  tenantId: string,
  vehicleId: string,
  serviceType: string,
  priority: string,
  estimatedCost: number,
  recurrencePattern: any,
  autoCreateWorkOrder: boolean,
  workOrderTemplate: any,
  nextDue: Date,
  notes?: string,
  parts?: any
): Promise<MaintenanceSchedule> {
  const result = await pool.query(
    `INSERT INTO maintenance_schedules (
      tenant_id, vehicle_id, service_type, priority, estimated_cost,
      is_recurring, recurrence_pattern, auto_create_work_order,
      work_order_template, next_due, notes, parts, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      tenantId,
      vehicleId,
      serviceType,
      priority,
      estimatedCost,
      true,
      JSON.stringify(recurrencePattern),
      autoCreateWorkOrder,
      JSON.stringify(workOrderTemplate),
      nextDue,
      notes,
      parts ? JSON.stringify(parts) : null,
      'scheduled'
    ]
  );

  return result.rows[0];
}

/**
 * Update recurrence pattern
 */
export async function updateRecurrencePattern(
  id: string,
  tenantId: string,
  updateFields: string[],
  updateValues: any[]
): Promise<MaintenanceSchedule | null> {
  const result = await pool.query(
    `UPDATE maintenance_schedules
     SET ${updateFields.join(`, `)}, updated_at = NOW()
     WHERE id = $1 AND tenant_id = $2 AND is_recurring = true
     RETURNING *`,
    [id, tenantId, ...updateValues]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Find due schedules
 */
export async function findDueSchedules(
  tenantId: string,
  futureDate: Date,
  includeOverdue: boolean
): Promise<MaintenanceSchedule[]> {
  const query = includeOverdue
    ? 'SELECT id, tenant_id, created_at, updated_at FROM maintenance_schedules WHERE tenant_id = $1 AND (next_due <= $2 OR next_due < NOW())'
    : 'SELECT id, tenant_id, created_at, updated_at FROM maintenance_schedules WHERE tenant_id = $1 AND next_due <= $2 AND next_due >= NOW()';

  const result = await pool.query(query, [tenantId, futureDate]);
  return result.rows;
}

/**
 * Get schedule by ID (basic fields for work order generation)
 */
export async function findScheduleForWorkOrder(
  id: string,
  tenantId: string
): Promise<any | null> {
  const result = await pool.query(
    `SELECT id, tenant_id, vehicle_id, service_type, description, scheduled_date, completed_date, status, odometer_reading, estimated_cost, actual_cost, assigned_vendor_id, assigned_technician, notes, recurring, recurring_interval_miles, recurring_interval_days, next_service_date, next_service_odometer, priority, created_at, updated_at, deleted_at FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get vehicle telemetry snapshot
 */
export async function findLatestVehicleTelemetry(
  vehicleId: string,
  tenantId: string
): Promise<any | null> {
  const result = await pool.query(
    `SELECT id, tenant_id, created_at, updated_at FROM vehicle_telemetry_snapshots
     WHERE vehicle_id = $1 AND tenant_id = $2
     ORDER BY snapshot_date DESC LIMIT 1`,
    [vehicleId, tenantId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Create work order from schedule
 */
export async function createWorkOrder(
  tenantId: string,
  vehicleId: string,
  type: string,
  priority: string,
  description: string,
  estimatedCost: number,
  status: string,
  metadata: any,
  createdAt: Date
): Promise<string> {
  const result = await pool.query(
    `INSERT INTO work_orders (tenant_id, vehicle_id, type, priority, description, estimated_cost, status, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [tenantId, vehicleId, type, priority, description, estimatedCost, status, JSON.stringify(metadata), createdAt]
  );

  return result.rows[0].id;
}

/**
 * Find work order by ID
 */
export async function findWorkOrderById(
  id: string
): Promise<any | null> {
  const result = await pool.query(
    `SELECT id, tenant_id, vehicle_id, type, priority, description, estimated_cost, actual_cost, status, created_at, updated_at, deleted_at, metadata, created_by, assigned_to FROM work_orders WHERE id = $1`,
    [id]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get schedule history with work orders
 */
export async function findScheduleHistory(
  scheduleId: string,
  tenantId: string
): Promise<any[]> {
  const result = await pool.query(
    `SELECT
      msh.*,
      wo.work_order_number, wo.title, wo.status as work_order_status,
      wo.actual_cost, wo.completed_date
     FROM maintenance_schedule_history msh
     LEFT JOIN work_orders wo ON msh.work_order_id = wo.id
     WHERE msh.schedule_id = $1 AND msh.tenant_id = $2
     ORDER BY msh.created_at DESC`,
    [scheduleId, tenantId]
  );

  return result.rows;
}

/**
 * Get recurring schedule statistics
 */
export async function getRecurringScheduleStats(
  tenantId: string
): Promise<any> {
  const result = await pool.query(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN auto_create_work_order THEN 1 ELSE 0 END) as active,
            SUM(estimated_cost) as total_estimated_cost
     FROM maintenance_schedules
     WHERE tenant_id = $1 AND is_recurring = true`,
    [tenantId]
  );

  return result.rows[0];
}

/**
 * Pause auto work order generation
 */
export async function pauseAutoWorkOrderGeneration(
  id: string,
  tenantId: string
): Promise<MaintenanceSchedule | null> {
  const result = await pool.query(
    `UPDATE maintenance_schedules
     SET auto_create_work_order = false, updated_at = NOW()
     WHERE id = $1 AND tenant_id = $2 AND is_recurring = true
     RETURNING *`,
    [id, tenantId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Resume auto work order generation
 */
export async function resumeAutoWorkOrderGeneration(
  id: string,
  tenantId: string
): Promise<MaintenanceSchedule | null> {
  const result = await pool.query(
    `UPDATE maintenance_schedules
     SET auto_create_work_order = true, updated_at = NOW()
     WHERE id = $1 AND tenant_id = $2 AND is_recurring = true
     RETURNING *`,
    [id, tenantId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get multi-metric maintenance due schedules
 */
export async function findMultiMetricDueSchedules(
  tenantId: string,
  filters: {
    trigger_metric?: string;
    is_overdue?: boolean;
    vehicle_id?: string;
  }
): Promise<any[]> {
  let query = `SELECT vehicle_id, vehicle_name, last_service_date, days_since_service, miles_since_service, next_due_date FROM vw_multi_metric_maintenance_due WHERE tenant_id = $1`;
  const params: any[] = [tenantId];
  let paramIndex = 2;

  if (filters.trigger_metric) {
    query += ` AND trigger_metric = $${paramIndex++}`;
    params.push(filters.trigger_metric);
  }

  if (filters.is_overdue !== undefined) {
    query += ` AND is_overdue = $${paramIndex++}`;
    params.push(filters.is_overdue);
  }

  if (filters.vehicle_id) {
    query += ` AND vehicle_id = $${paramIndex++}`;
    params.push(filters.vehicle_id);
  }

  query += ` ORDER BY
    CASE WHEN is_overdue THEN 0 ELSE 1 END,
    units_until_due ASC NULLS LAST`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get multi-metric schedules for a specific vehicle
 */
export async function findMultiMetricSchedulesByVehicle(
  vehicleId: string,
  tenantId: string
): Promise<any[]> {
  const result = await pool.query(
    `SELECT vehicle_id, vehicle_name, last_service_date, days_since_service, miles_since_service, next_due_date FROM vw_multi_metric_maintenance_due
     WHERE vehicle_id = $1 AND tenant_id = $2
     ORDER BY
       CASE WHEN is_overdue THEN 0 ELSE 1 END,
       trigger_metric,
       units_until_due ASC NULLS LAST`,
    [vehicleId, tenantId]
  );

  return result.rows;
}
