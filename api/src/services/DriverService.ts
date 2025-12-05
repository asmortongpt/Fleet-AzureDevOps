import { Pool } from 'pg';

/**
 * DriverService - Business Logic Layer for Driver Operations
 */
export class DriverService {
  constructor(private db: Pool) {}

  async getAllDrivers(tenantId: number, filters?: any) {
    const query = `
      SELECT id, first_name, last_name, email, phone, license_number, 
             license_expiry, status, tenant_id, created_at, updated_at
      FROM drivers
      WHERE tenant_id = $1 AND deleted_at IS NULL
      ORDER BY last_name, first_name
    `;
    const result = await this.db.query(query, [tenantId]);
    return result.rows;
  }

  async getDriverById(id: number, tenantId: number) {
    const query = `
      SELECT id, first_name, last_name, email, phone, license_number,
             license_expiry, status, tenant_id, created_at, updated_at
      FROM drivers
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async createDriver(data: any, tenantId: number) {
    const { first_name, last_name, email, phone, license_number, license_expiry, status } = data;
    
    // Business validation
    if (!first_name || !last_name || !email) {
      throw new Error('First name, last name, and email are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const query = `
      INSERT INTO drivers (first_name, last_name, email, phone, license_number, license_expiry, status, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, first_name, last_name, email, phone, license_number, license_expiry, status, tenant_id, created_at, updated_at
    `;
    const result = await this.db.query(query, [
      first_name, last_name, email, phone, license_number, license_expiry, status || 'active', tenantId
    ]);
    return result.rows[0];
  }

  async updateDriver(id: number, data: any, tenantId: number) {
    // Verify driver belongs to tenant
    const existing = await this.getDriverById(id, tenantId);
    if (!existing) {
      throw new Error('Driver not found or access denied');
    }

    const { first_name, last_name, email, phone, license_number, license_expiry, status } = data;
    
    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
    }

    const query = `
      UPDATE drivers
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          email = COALESCE($3, email),
          phone = COALESCE($4, phone),
          license_number = COALESCE($5, license_number),
          license_expiry = COALESCE($6, license_expiry),
          status = COALESCE($7, status),
          updated_at = NOW()
      WHERE id = $8 AND tenant_id = $9 AND deleted_at IS NULL
      RETURNING id, first_name, last_name, email, phone, license_number, license_expiry, status, tenant_id, created_at, updated_at
    `;
    const result = await this.db.query(query, [
      first_name, last_name, email, phone, license_number, license_expiry, status, id, tenantId
    ]);
    return result.rows[0];
  }

  async deleteDriver(id: number, tenantId: number) {
    // Soft delete
    const query = `
      UPDATE drivers
      SET deleted_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await this.db.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }

  async getDriverAssignments(driverId: number, tenantId: number) {
    // Get current vehicle assignments for driver
    const query = `
      SELECT v.id, v.make, v.model, v.vin, v.license_plate
      FROM vehicles v
      WHERE v.assigned_driver_id = $1 AND v.tenant_id = $2 AND v.deleted_at IS NULL
    `;
    const result = await this.db.query(query, [driverId, tenantId]);
    return result.rows;
  }
}
