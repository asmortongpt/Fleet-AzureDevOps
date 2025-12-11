import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

export interface VehicleTelematics {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  timestamp: Date;
  speed: number;
  latitude: number;
  longitude: number;
  fuel_level: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class VehicleTelematicsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findAll(tenantId: number): Promise<VehicleTelematics[]> {
    const query = 'SELECT id, created_at, updated_at FROM vehicle_telematics WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY timestamp DESC';
    try {
      const result: QueryResult<VehicleTelematics> = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch vehicle telematics data: ${error.message}`);
    }
  }

  async findById(tenantId: number, id: number): Promise<VehicleTelematics | null> {
    const query = 'SELECT id, created_at, updated_at FROM vehicle_telematics WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
    try {
      const result: QueryResult<VehicleTelematics> = await this.pool.query(query, [tenantId, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch vehicle telematics data by ID: ${error.message}`);
    }
  }

  async create(tenantId: number, vehicleTelematics: Omit<VehicleTelematics, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<VehicleTelematics> {
    const query = 'INSERT INTO vehicle_telematics (tenant_id, vehicle_id, timestamp, speed, latitude, longitude, fuel_level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
    const values = [tenantId, vehicleTelematics.vehicle_id, vehicleTelematics.timestamp, vehicleTelematics.speed, vehicleTelematics.latitude, vehicleTelematics.longitude, vehicleTelematics.fuel_level];
    try {
      const result: QueryResult<VehicleTelematics> = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create vehicle telematics data: ${error.message}`);
    }
  }

  async update(tenantId: number, id: number, vehicleTelematics: Partial<Omit<VehicleTelematics, 'id' | 'tenant_id' | 'created_at' | 'deleted_at'>>): Promise<VehicleTelematics | null> {
    const setClause = Object.keys(vehicleTelematics).map((key, index) => `${key} = $${index + 3}`).join(', ');
    const query = `UPDATE vehicle_telematics SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *`;
    const values = [tenantId, id, ...Object.values(vehicleTelematics)];
    try {
      const result: QueryResult<VehicleTelematics> = await this.pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update vehicle telematics data: ${error.message}`);
    }
  }

  async softDelete(tenantId: number, id: number): Promise<VehicleTelematics | null> {
    const query = 'UPDATE vehicle_telematics SET deleted_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *';
    try {
      const result: QueryResult<VehicleTelematics> = await this.pool.query(query, [tenantId, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to soft delete vehicle telematics data: ${error.message}`);
    }
  }
}
