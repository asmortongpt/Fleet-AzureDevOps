import { Pool } from 'pg';

/**
 * Tenant Validator - Prevents IDOR vulnerabilities
 * Validates that foreign keys belong to the current tenant before INSERT/UPDATE operations
 */
export class TenantValidator {
  constructor(private db: Pool) {}

  /**
   * Validate that a vehicle belongs to the specified tenant
   * @param vehicleId - Vehicle ID to validate
   * @param tenantId - Tenant ID to check against
   * @returns true if vehicle belongs to tenant, false otherwise
   */
  async validateVehicle(vehicleId: number, tenantId: number): Promise<boolean> {
    if (!vehicleId || !tenantId) return false;

    const result = await this.db.query(
      `SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [vehicleId, tenantId]
    );
    return result.rows.length > 0;
  }

  /**
   * Validate that an inspector belongs to the specified tenant
   */
  async validateInspector(inspectorId: number, tenantId: number): Promise<boolean> {
    if (!inspectorId || !tenantId) return false;

    const result = await this.db.query(
      `SELECT id FROM inspectors WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [inspectorId, tenantId]
    );
    return result.rows.length > 0;
  }

  /**
   * Validate that a route belongs to the specified tenant
   */
  async validateRoute(routeId: number, tenantId: number): Promise<boolean> {
    if (!routeId || !tenantId) return false;

    const result = await this.db.query(
      `SELECT id FROM routes WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [routeId, tenantId]
    );
    return result.rows.length > 0;
  }

  /**
   * Validate that a driver belongs to the specified tenant
   */
  async validateDriver(driverId: number, tenantId: number): Promise<boolean> {
    if (!driverId || !tenantId) return false;

    const result = await this.db.query(
      `SELECT id FROM drivers WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [driverId, tenantId]
    );
    return result.rows.length > 0;
  }

  /**
   * Validate that a work order belongs to the specified tenant
   */
  async validateWorkOrder(workOrderId: number, tenantId: number): Promise<boolean> {
    if (!workOrderId || !tenantId) return false;

    const result = await this.db.query(
      `SELECT id FROM work_orders WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [workOrderId, tenantId]
    );
    return result.rows.length > 0;
  }

  /**
   * Validate multiple foreign keys at once
   * @param validations - Array of [type, id] tuples to validate
   * @param tenantId - Tenant ID to check against
   * @returns Object with validation results for each type
   */
  async validateMultiple(
    validations: Array<['vehicle' | 'inspector' | 'driver' | 'route' | 'workOrder', number]>,
    tenantId: number
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [type, id] of validations) {
      switch (type) {
        case 'vehicle':
          results.vehicle = await this.validateVehicle(id, tenantId);
          break;
        case 'inspector':
          results.inspector = await this.validateInspector(id, tenantId);
          break;
        case 'driver':
          results.driver = await this.validateDriver(id, tenantId);
          break;
        case 'route':
          results.route = await this.validateRoute(id, tenantId);
          break;
        case 'workOrder':
          results.workOrder = await this.validateWorkOrder(id, tenantId);
          break;
      }
    }

    return results;
  }
}
