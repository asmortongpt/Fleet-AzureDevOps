import { Pool } from 'pg';

import { pool } from '../config/database';

export interface LeaseTracking {
  id: string;
  tenant_id: string;
  vehicle_id?: string;
  lease_provider?: string;
  start_date?: Date;
  end_date?: Date;
  monthly_payment?: number;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class LeaseTrackingRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async create(leaseTracking: Partial<LeaseTracking>): Promise<LeaseTracking> {
    const result = await this.pool.query(
      `INSERT INTO lease_tracking
       (vehicle_id, lease_provider, start_date, end_date, monthly_payment, status, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        leaseTracking.vehicle_id,
        leaseTracking.lease_provider,
        leaseTracking.start_date,
        leaseTracking.end_date,
        leaseTracking.monthly_payment,
        leaseTracking.status || 'active',
        leaseTracking.tenant_id
      ]
    );
    return result.rows[0];
  }

  async readAll(tenant_id: string): Promise<LeaseTracking[]> {
    const result = await this.pool.query(
      `SELECT * FROM lease_tracking WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenant_id]
    );
    return result.rows;
  }

  async readById(id: string, tenant_id: string): Promise<LeaseTracking | null> {
    const result = await this.pool.query(
      `SELECT * FROM lease_tracking WHERE id = $1 AND tenant_id = $2`,
      [id, tenant_id]
    );
    return result.rows[0] || null;
  }

  async update(id: string, leaseTracking: Partial<LeaseTracking>, tenant_id: string): Promise<LeaseTracking | null> {
    const result = await this.pool.query(
      `UPDATE lease_tracking
       SET vehicle_id = COALESCE($1, vehicle_id),
           lease_provider = COALESCE($2, lease_provider),
           start_date = COALESCE($3, start_date),
           end_date = COALESCE($4, end_date),
           monthly_payment = COALESCE($5, monthly_payment),
           status = COALESCE($6, status),
           updated_at = NOW()
       WHERE id = $7 AND tenant_id = $8
       RETURNING *`,
      [
        leaseTracking.vehicle_id,
        leaseTracking.lease_provider,
        leaseTracking.start_date,
        leaseTracking.end_date,
        leaseTracking.monthly_payment,
        leaseTracking.status,
        id,
        tenant_id
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id: string, tenant_id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM lease_tracking WHERE id = $1 AND tenant_id = $2`,
      [id, tenant_id]
    );
    return (result.rowCount || 0) > 0;
  }

  async query1(param1: string, tenant_id: string): Promise<LeaseTracking[]> {
    const result = await this.pool.query(
      `SELECT * FROM lease_tracking WHERE tenant_id = $1 AND status = $2`,
      [tenant_id, param1]
    );
    return result.rows;
  }

  async query2(param1: string, param2: string, tenant_id: string): Promise<LeaseTracking[]> {
    const result = await this.pool.query(
      `SELECT * FROM lease_tracking
       WHERE tenant_id = $1 AND status = $2 AND lease_provider = $3`,
      [tenant_id, param1, param2]
    );
    return result.rows;
  }

  async query3(param1: string, param2: string, param3: string, tenant_id: string): Promise<LeaseTracking[]> {
    const result = await this.pool.query(
      `SELECT * FROM lease_tracking
       WHERE tenant_id = $1 AND status = $2 AND lease_provider = $3 AND vehicle_id = $4`,
      [tenant_id, param1, param2, param3]
    );
    return result.rows;
  }
}