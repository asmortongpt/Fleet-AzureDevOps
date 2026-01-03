import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';


interface MaintenanceSchedule {
  id: number;
  vehicle_id: number;
  schedule_date: Date;
  description: string;
  completed: boolean;
  tenant_id: string;
}

export class MaintenanceSchedulesRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAll(tenantId: string): Promise<MaintenanceSchedule[]> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM maintenance_schedules WHERE tenant_id = $1';
    const result: QueryResult<MaintenanceSchedule> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getById(id: number, tenantId: string): Promise<MaintenanceSchedule | null> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2';
    const result: QueryResult<MaintenanceSchedule> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(maintenanceSchedule: Omit<MaintenanceSchedule, 'id'>, tenantId: string): Promise<MaintenanceSchedule> {
    const { vehicle_id, schedule_date, description, completed } = maintenanceSchedule;
    const query = 'INSERT INTO maintenance_schedules (vehicle_id, schedule_date, description, completed, tenant_id) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const result: QueryResult<MaintenanceSchedule> = await this.pool.query(query, [vehicle_id, schedule_date, description, completed, tenantId]);
    return result.rows[0];
  }

  async update(id: number, maintenanceSchedule: Partial<Omit<MaintenanceSchedule, 'id'>>, tenantId: string): Promise<MaintenanceSchedule | null> {
    const { vehicle_id, schedule_date, description, completed } = maintenanceSchedule;
    const setClause = Object.entries({ vehicle_id, schedule_date, description, completed })
      .filter(([, value]) => value !== undefined)
      .map(([key,], index) => `${key} = $${index + 2}`)
      .join(', ');
    
    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `UPDATE maintenance_schedules SET ${setClause} WHERE id = $1 AND tenant_id = $${Object.keys(maintenanceSchedule).length + 2} RETURNING *`;
    const values = [id, ...Object.values(maintenanceSchedule).filter(value => value !== undefined), tenantId];
    const result: QueryResult<MaintenanceSchedule> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: string): Promise<boolean> {
    const query = 'DELETE FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2';
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}