import { Pool } from 'pg';
import { NotFoundError, ValidationError } from '../lib/errors';
import { BaseRepository } from './base/BaseRepository';

export interface WorkOrder {
  id: string;
  number: string;
  vehicleId: string;
  title: string;
  description?: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost?: number;
  actualCost?: number;
  scheduledStartDate?: Date;
  scheduledEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  odometerAtStart?: number;
  odometerAtEnd?: number;
  laborHours?: number;
  notes?: string;
  assignedToId?: string;
  requestedById?: string;
  approvedById?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkOrdersRepository extends BaseRepository<WorkOrder> {
  constructor(pool: Pool) {
    super(pool, 'work_orders');
  }

  async findById(id: string, tenantId: string): Promise<WorkOrder | null> {
    const result = await this.pool.query(
      `SELECT id, number, vehicle_id AS "vehicleId", title, description, type, status, priority,
              estimated_cost AS "estimatedCost", actual_cost AS "actualCost",
              scheduled_start_date AS "scheduledStartDate", scheduled_end_date AS "scheduledEndDate",
              actual_start_date AS "actualStartDate", actual_end_date AS "actualEndDate",
              odometer_at_start AS "odometerAtStart", odometer_at_end AS "odometerAtEnd",
              labor_hours AS "laborHours", notes, assigned_to_id AS "assignedToId",
              requested_by_id AS "requestedById", approved_by_id AS "approvedById",
              tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM work_orders WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async findByTenant(tenantId: string, options: { limit?: number, offset?: number } = {}): Promise<WorkOrder[]> {
    const { limit = 50, offset = 0 } = options;
    const result = await this.pool.query(
      `SELECT id, number, vehicle_id AS "vehicleId", title, status, priority, created_at AS "createdAt"
       FROM work_orders WHERE tenant_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
    return result.rows;
  }

  async findByVehicle(vehicleId: string, tenantId: string): Promise<WorkOrder[]> {
    const result = await this.pool.query(
      `SELECT id, number, title, status, priority, actual_end_date AS "actualEndDate"
       FROM work_orders WHERE vehicle_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC`,
      [vehicleId, tenantId]
    );
    return result.rows;
  }

  async create(data: Partial<WorkOrder>, tenantId: string): Promise<WorkOrder> {
    if (!data.vehicleId || !data.title || !data.type) {
      throw new ValidationError('Vehicle ID, title, and type are required');
    }

    const number = `WO-${Date.now()}`; // Simplified for example

    const result = await this.pool.query(
      `INSERT INTO work_orders (
        number, vehicle_id, title, description, type, status, priority,
        estimated_cost, scheduled_start_date, scheduled_end_date, 
        requested_by_id, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, number, title, status, priority, created_at AS "createdAt"`,
      [
        number,
        data.vehicleId,
        data.title,
        data.description || null,
        data.type,
        data.status || 'pending',
        data.priority || 'medium',
        data.estimatedCost || null,
        data.scheduledStartDate || null,
        data.scheduledEndDate || null,
        data.requestedById || null,
        tenantId
      ]
    );
    return result.rows[0];
  }
}
