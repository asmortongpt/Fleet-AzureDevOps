import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';

export interface VehicleAssignment {
  id: number;
  vehicle_id: number;
  driver_id: number;
  start_date: Date;
  end_date?: Date | null;
  lifecycle_state: string;
  notes?: string | null;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface AssignmentFilters {
  vehicle_id?: number;
  driver_id?: number;
  lifecycle_state?: string;
  start_date?: Date;
  end_date?: Date;
}

export class VehicleAssignmentsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findAll(
    tenantId: number,
    filters?: AssignmentFilters,
    pagination?: { limit: number; offset: number }
  ) {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters?.vehicle_id) {
      conditions.push(`vehicle_id = $${paramIndex}`);
      params.push(filters.vehicle_id);
      paramIndex++;
    }

    if (filters?.driver_id) {
      conditions.push(`driver_id = $${paramIndex}`);
      params.push(filters.driver_id);
      paramIndex++;
    }

    if (filters?.lifecycle_state) {
      conditions.push(`lifecycle_state = $${paramIndex}`);
      params.push(filters.lifecycle_state);
      paramIndex++;
    }

    if (filters?.start_date) {
      conditions.push(`start_date >= $${paramIndex}`);
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters?.end_date) {
      conditions.push(`end_date <= $${paramIndex}`);
      params.push(filters.end_date);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const query = `
      SELECT id, created_at, updated_at FROM vehicle_assignments 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pagination?.limit || 50, pagination?.offset || 0);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async count(tenantId: number, filters?: AssignmentFilters) {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters?.vehicle_id) {
      conditions.push(`vehicle_id = $${paramIndex}`);
      params.push(filters.vehicle_id);
      paramIndex++;
    }

    if (filters?.driver_id) {
      conditions.push(`driver_id = $${paramIndex}`);
      params.push(filters.driver_id);
      paramIndex++;
    }

    if (filters?.lifecycle_state) {
      conditions.push(`lifecycle_state = $${paramIndex}`);
      params.push(filters.lifecycle_state);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const query = `SELECT COUNT(*) as count FROM vehicle_assignments WHERE ${whereClause}`;

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async findById(id: number, tenantId: number) {
    const result = await this.pool.query(
      'SELECT id, created_at, updated_at FROM vehicle_assignments WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }

  async create(data: Partial<VehicleAssignment>, tenantId: number) {
    const result = await this.pool.query(
      `INSERT INTO vehicle_assignments (
        vehicle_id, driver_id, start_date, end_date, 
        lifecycle_state, notes, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        data.vehicle_id,
        data.driver_id,
        data.start_date,
        data.end_date || null,
        data.lifecycle_state || 'active',
        data.notes || null,
        tenantId
      ]
    );
    return result.rows[0];
  }

  async update(id: number, data: Partial<VehicleAssignment>, tenantId: number) {
    const result = await this.pool.query(
      `UPDATE vehicle_assignments SET 
        vehicle_id = COALESCE($1, vehicle_id),
        driver_id = COALESCE($2, driver_id),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        lifecycle_state = COALESCE($5, lifecycle_state),
        notes = COALESCE($6, notes),
        updated_at = NOW()
      WHERE id = $7 AND tenant_id = $8
      RETURNING *`,
      [
        data.vehicle_id,
        data.driver_id,
        data.start_date,
        data.end_date,
        data.lifecycle_state,
        data.notes,
        id,
        tenantId
      ]
    );
    return result.rows[0];
  }

  async updateLifecycleState(id: number, state: string, tenantId: number) {
    const result = await this.pool.query(
      `UPDATE vehicle_assignments SET 
        lifecycle_state = $1,
        updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING *`,
      [state, id, tenantId]
    );
    return result.rows[0];
  }

  async addNote(id: number, userId: number, note: string, tenantId: number) {
    const result = await this.pool.query(
      `UPDATE vehicle_assignments SET 
        notes = CONCAT(COALESCE(notes, ''), $1),
        updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING *`,
      [`\n[User ${userId}]: ${note}`, id, tenantId]
    );
    return result.rows[0];
  }

  async delete(id: number, tenantId: number) {
    await this.pool.query(
      'DELETE FROM vehicle_assignments WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }

  async findActiveByVehicle(vehicleId: number, tenantId: number) {
    const result = await this.pool.query(
      `SELECT id, created_at, updated_at FROM vehicle_assignments 
       WHERE vehicle_id = $1 
       AND tenant_id = $2 
       AND lifecycle_state = 'active'
       AND (end_date IS NULL OR end_date > NOW())
       ORDER BY start_date DESC`,
      [vehicleId, tenantId]
    );
    return result.rows;
  }

  async findActiveByDriver(driverId: number, tenantId: number) {
    const result = await this.pool.query(
      `SELECT id, created_at, updated_at FROM vehicle_assignments 
       WHERE driver_id = $1 
       AND tenant_id = $2 
       AND lifecycle_state = 'active'
       AND (end_date IS NULL OR end_date > NOW())
       ORDER BY start_date DESC`,
      [driverId, tenantId]
    );
    return result.rows;
  }

  async findHistory(vehicleId: number, tenantId: number, limit = 10) {
    const result = await this.pool.query(
      `SELECT id, created_at, updated_at FROM vehicle_assignments 
       WHERE vehicle_id = $1 
       AND tenant_id = $2 
       ORDER BY start_date DESC
       LIMIT $3`,
      [vehicleId, tenantId, limit]
    );
    return result.rows;
  }
}
