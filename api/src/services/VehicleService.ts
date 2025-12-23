import { Pool } from 'pg';

/**
 * VehicleService - Business Logic Layer for Vehicle Operations
 * Extracts business logic from route handlers
 */
export class VehicleService {
  constructor(private db: Pool) { }

  async getAllVehicles(tenantId: number, filters?: any) {
    // Business logic for fetching vehicles
    const query = `
      SELECT id, make, model, year, vin, license_plate, status, tenant_id, created_at, updated_at
      FROM vehicles
      WHERE tenant_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [tenantId]);
    return result.rows;
  }

  async getVehicleById(id: number, tenantId: number) {
    const query = `
      SELECT id, make, model, year, vin, license_plate, status, tenant_id, created_at, updated_at
      FROM vehicles
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async createVehicle(data: any, tenantId: number) {
    const { make, model, year, vin, license_plate, status } = data;

    // Business validation
    if (!make || !model || !year) {
      throw new Error('Make, model, and year are required');
    }

    const query = `
      INSERT INTO vehicles (make, model, year, vin, license_plate, status, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, make, model, year, vin, license_plate, status, tenant_id, created_at, updated_at
    `;
    const result = await this.db.query(query, [make, model, year, vin, license_plate, status || 'active', tenantId]);
    return result.rows[0];
  }

  async updateVehicle(id: number, data: any, tenantId: number) {
    // First verify vehicle belongs to tenant
    const existing = await this.getVehicleById(id, tenantId);
    if (!existing) {
      throw new Error('Vehicle not found or access denied');
    }

    const { make, model, year, vin, license_plate, status } = data;
    const query = `
      UPDATE vehicles
      SET make = COALESCE($1, make),
          model = COALESCE($2, model),
          year = COALESCE($3, year),
          vin = COALESCE($4, vin),
          license_plate = COALESCE($5, license_plate),
          status = COALESCE($6, status),
          updated_at = NOW()
      WHERE id = $7 AND tenant_id = $8 AND deleted_at IS NULL
      RETURNING id, make, model, year, vin, license_plate, status, tenant_id, created_at, updated_at
    `;
    const result = await this.db.query(query, [make, model, year, vin, license_plate, status, id, tenantId]);
    return result.rows[0];
  }

  async deleteVehicle(id: number, tenantId: number) {
    // Soft delete
    const query = `
      UPDATE vehicles
      SET deleted_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return (result.rowCount || 0) > 0;
  }
}
