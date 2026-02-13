import { injectable, inject } from "inversify";
import { Pool } from 'pg';

import { BaseRepository } from "../../../repositories/base/BaseRepository";
import { TYPES } from "../../../types";
import type { MaintenanceRecord } from "../../../types/maintenance";

@injectable()
export class MaintenanceRepository extends BaseRepository<MaintenanceRecord> {
  constructor(@inject(TYPES.DatabasePool) pool: Pool) {
    super(pool, "work_orders");
  }

  async findAll(tenantId: string | number): Promise<MaintenanceRecord[]> {
    const result = await this.pool.query(
      `SELECT 
        id as id, 
        tenant_id, 
        vehicle_id, 
        type as service_type, 
        description, 
        actual_cost as cost, 
        odometer_at_start as mileage, 
        status, 
        created_at, 
        updated_at 
       FROM ${this.tableName} 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows as MaintenanceRecord[];
  }

  async findById(id: string | number, tenantId: string | number): Promise<MaintenanceRecord | null> {
    const result = await this.pool.query(
      `SELECT 
        id as id, 
        tenant_id, 
        vehicle_id, 
        type as service_type, 
        description, 
        actual_cost as cost, 
        odometer_at_start as mileage, 
        status, 
        created_at, 
        updated_at 
       FROM ${this.tableName} 
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return (result.rows[0] as MaintenanceRecord) || null;
  }

  async findByVehicleId(vehicleId: string | number, tenantId: string | number): Promise<MaintenanceRecord[]> {
    const result = await this.pool.query(
      `SELECT 
        id as id, 
        tenant_id, 
        vehicle_id, 
        type as service_type, 
        description, 
        actual_cost as cost, 
        odometer_at_start as mileage, 
        status, 
        created_at, 
        updated_at 
       FROM ${this.tableName} 
       WHERE vehicle_id = $1 AND tenant_id = $2 
       ORDER BY created_at DESC`,
      [vehicleId, tenantId]
    );
    return result.rows as MaintenanceRecord[];
  }

  async findByStatus(status: string, tenantId: string | number): Promise<MaintenanceRecord[]> {
    const result = await this.pool.query(
      `SELECT 
        id as id, 
        tenant_id, 
        vehicle_id, 
        type as service_type, 
        description, 
        actual_cost as cost, 
        odometer_at_start as mileage, 
        status, 
        created_at, 
        updated_at 
       FROM ${this.tableName} 
       WHERE status = $1 AND tenant_id = $2 
       ORDER BY created_at DESC`,
      [status, tenantId]
    );
    return result.rows as MaintenanceRecord[];
  }

  async findByServiceType(serviceType: string, tenantId: string | number): Promise<MaintenanceRecord[]> {
    const result = await this.pool.query(
      `SELECT 
        id as id, 
        tenant_id, 
        vehicle_id, 
        type as service_type, 
        description, 
        actual_cost as cost, 
        odometer_at_start as mileage, 
        status, 
        created_at, 
        updated_at 
       FROM ${this.tableName} 
       WHERE type = $1 AND tenant_id = $2 
       ORDER BY created_at DESC`,
      [serviceType, tenantId]
    );
    return result.rows as MaintenanceRecord[];
  }

  async create(data: Partial<MaintenanceRecord>, tenantId: string | number): Promise<MaintenanceRecord> {
    const result = await this.pool.query(
      `INSERT INTO ${this.tableName} (
        tenant_id, vehicle_id, type, description, actual_cost, odometer_at_start, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id as id, 
        tenant_id, 
        vehicle_id, 
        type as service_type, 
        description, 
        actual_cost as cost, 
        odometer_at_start as mileage, 
        status, 
        created_at, 
        updated_at`,
      [
        tenantId,
        data.vehicle_id,
        data.service_type,
        data.description || null,
        data.cost || null,
        data.mileage || null,
        data.status || 'pending'
      ]
    );
    return result.rows[0] as MaintenanceRecord;
  }

  async update(id: string | number, data: Partial<MaintenanceRecord>, tenantId: string | number): Promise<MaintenanceRecord | null> {
    const result = await this.pool.query(
      `UPDATE ${this.tableName}
       SET 
         type = COALESCE($3, type),
         description = COALESCE($4, description),
         actual_cost = COALESCE($5, actual_cost),
         odometer_at_start = COALESCE($6, odometer_at_start),
         status = COALESCE($7, status),
         updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING 
         id as id, 
         tenant_id, 
         vehicle_id, 
         type as service_type, 
         description, 
         actual_cost as cost, 
         odometer_at_start as mileage, 
         status, 
         created_at, 
         updated_at`,
      [
        id,
        tenantId,
        data.service_type,
        data.description,
        data.cost,
        data.mileage,
        data.status
      ]
    );
    return (result.rows[0] as MaintenanceRecord) || null;
  }

  async delete(id: string | number, tenantId: string | number): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
