import { Pool } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';


export interface WorkOrder {
  id: number;
  tenant_id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class WorkOrdersRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {
    super('work_orders', pool);
  }

  /**
   * Find all work orders
   * @param tenantId 
   * @param filters 
   * @returns 
   */
  async findAll(tenantId: number, filters?: any): Promise<WorkOrder[]> {
    try {
      const query = `
          SELECT id, tenant_id, created_at, updated_at FROM work_orders
          WHERE tenant_id = $1
          AND deleted_at IS NULL
          ORDER BY created_at DESC
        `;
      const result = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('Failed to fetch records');
    }
  }

  /**
   * Find work order by id
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async findById(id: number, tenantId: number): Promise<WorkOrder | null> {
    const query = `
        SELECT id, tenant_id, created_at, updated_at FROM work_orders
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new work order
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async create(data: Partial<WorkOrder>, tenantId: number): Promise<WorkOrder> {
    const query = `
        INSERT INTO work_orders (tenant_id, name, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
      `;
    const result = await this.pool.query(query, [tenantId, data.name]);
    return result.rows[0];
  }

  /**
   * Update a work order
   * @param id 
   * @param data 
   * @param tenantId 
   * @returns 
   */
  async update(id: number, data: Partial<WorkOrder>, tenantId: number): Promise<WorkOrder> {
    const query = `
        UPDATE work_orders
        SET name = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
        RETURNING *
      `;
    const result = await this.pool.query(query, [data.name, id, tenantId]);
    return result.rows[0];
  }

  /**
   * Soft delete a work order
   * @param id 
   * @param tenantId 
   * @returns 
   */
  async softDelete(id: number, tenantId: number): Promise<boolean> {
    const query = `
        UPDATE work_orders
        SET deleted_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * N+1 PREVENTION: Fetch work order with full context (vehicle, driver, facility)
   */
  async findWithFullContext(id: string, tenantId: string) {
    const query = `
        SELECT
            wo.id, wo.description, wo.status, wo.priority, wo.due_date,
            v.id as vehicle_id, v.make as vehicle_make, v.model as vehicle_model, v.vin as vehicle_vin,
            d.id as driver_id, d.name as driver_name, d.email as driver_email,
            f.id as facility_id, f.name as facility_name, f.address as facility_address
        FROM work_orders wo
        LEFT JOIN vehicles v ON wo.vehicle_id = v.id
        LEFT JOIN drivers d ON v.driver_id = d.id
        LEFT JOIN facilities f ON wo.facility_id = f.id
        WHERE wo.id = $1 AND wo.tenant_id = $2 AND wo.deleted_at IS NULL
        `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }
}
