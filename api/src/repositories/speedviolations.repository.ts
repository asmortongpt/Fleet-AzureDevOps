import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface SpeedViolation {
  id: number;
  vehicle_id: number;
  speed: number;
  location: string;
  timestamp: Date;
  tenant_id: string;
}

export class SpeedViolationsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    super('speed_violations', pool);
    this.pool = pool;
  }

  /**
   * Creates a new speed violation record
   * @param speedViolation - The speed violation object to be created
   * @param tenantId - The ID of the tenant
   * @returns The created speed violation object
   */
  async create(speedViolation: Omit<SpeedViolation, 'id'>, tenantId: string): Promise<SpeedViolation> {
    const query = `
      INSERT INTO speed_violations (vehicle_id, speed, location, timestamp, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, vehicle_id, speed, location, timestamp;
    `;
    const values = [
      speedViolation.vehicle_id,
      speedViolation.speed,
      speedViolation.location,
      speedViolation.timestamp,
      tenantId
    ];

    const result: QueryResult<SpeedViolation> = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Retrieves a speed violation by its ID
   * @param id - The ID of the speed violation
   * @param tenantId - The ID of the tenant
   * @returns The speed violation object if found, null otherwise
   */
  async read(id: number, tenantId: string): Promise<SpeedViolation | null> {
    const query = `
      SELECT id, vehicle_id, speed, location, timestamp
      FROM speed_violations
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenantId];

    const result: QueryResult<SpeedViolation> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Updates an existing speed violation record
   * @param id - The ID of the speed violation to update
   * @param speedViolation - The updated speed violation object
   * @param tenantId - The ID of the tenant
   * @returns The updated speed violation object
   */
  async update(id: number, speedViolation: Partial<SpeedViolation>, tenantId: string): Promise<SpeedViolation> {
    const query = `
      UPDATE speed_violations
      SET vehicle_id = $1, speed = $2, location = $3, timestamp = $4
      WHERE id = $5 AND tenant_id = $6
      RETURNING id, vehicle_id, speed, location, timestamp;
    `;
    const values = [
      speedViolation.vehicle_id,
      speedViolation.speed,
      speedViolation.location,
      speedViolation.timestamp,
      id,
      tenantId
    ];

    const result: QueryResult<SpeedViolation> = await this.pool.query(query, values);
    if (result.rowCount === 0) {
      throw new Error('Speed violation not found or unauthorized');
    }
    return result.rows[0];
  }

  /**
   * Deletes a speed violation record
   * @param id - The ID of the speed violation to delete
   * @param tenantId - The ID of the tenant
   * @returns True if the deletion was successful, false otherwise
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM speed_violations
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenantId];

    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Retrieves all speed violations for a tenant
   * @param tenantId - The ID of the tenant
   * @returns An array of speed violation objects
   */
  async list(tenantId: string): Promise<SpeedViolation[]> {
    const query = `
      SELECT id, vehicle_id, speed, location, timestamp
      FROM speed_violations
      WHERE tenant_id = $1;
    `;
    const values = [tenantId];

    const result: QueryResult<SpeedViolation> = await this.pool.query(query, values);
    return result.rows;
  }
}