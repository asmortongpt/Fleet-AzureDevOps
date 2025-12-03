import { Pool } from 'pg';

/**
 * Tenant Validator - Prevents IDOR vulnerabilities
 * Validates that foreign keys belong to the current tenant before INSERT/UPDATE operations
 */
export class TenantValidator {
  constructor(private db: Pool) {}

  async validateVehicle(vehicleId: number, tenantId: number): Promise<boolean> {
    if (!vehicleId || !tenantId) return false;
    const result = await this.db.query(
      `SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [vehicleId, tenantId]
    );
    return result.rows.length > 0;
  }

  async validateInspector(inspectorId: number, tenantId: number): Promise<boolean> {
    if (!inspectorId || !tenantId) return false;
    const result = await this.db.query(
      `SELECT id FROM inspectors WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [inspectorId, tenantId]
    );
    return result.rows.length > 0;
  }

  async validateDriver(driverId: number, tenantId: number): Promise<boolean> {
    if (!driverId || !tenantId) return false;
    const result = await this.db.query(
      `SELECT id FROM drivers WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [driverId, tenantId]
    );
    return result.rows.length > 0;
  }

  async validateRoute(routeId: number, tenantId: number): Promise<boolean> {
    if (!routeId || !tenantId) return false;
    const result = await this.db.query(
      `SELECT id FROM routes WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [routeId, tenantId]
    );
    return result.rows.length > 0;
  }

  async validateWorkOrder(workOrderId: number, tenantId: number): Promise<boolean> {
    if (!workOrderId || !tenantId) return false;
    const result = await this.db.query(
      `SELECT id FROM work_orders WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [workOrderId, tenantId]
    );
    return result.rows.length > 0;
  }
}
