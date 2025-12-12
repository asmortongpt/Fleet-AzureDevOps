import { injectable } from 'inversify';
import { BaseRepository } from '../../../repositories/BaseRepository';

export interface Vehicle {
  id: string;
  tenant_id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate?: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: Date;
  updated_at: Date;
}

@injectable()
export class VehiclesRepository extends BaseRepository<Vehicle> {
  constructor(pool: any) {
    super(pool, 'vehicles');
  }

  async findByStatus(status: string, tenantId: string): Promise<Vehicle[]> {
    const result = await this.pool.query(
      'SELECT id, tenant_id, created_at, updated_at FROM vehicles WHERE status = $1 AND tenant_id = $2',
      [status, tenantId]
    );
    return result.rows;
  }

  async findByVin(vin: string, tenantId: string): Promise<Vehicle | null> {
    const result = await this.pool.query(
      'SELECT id, tenant_id, created_at, updated_at FROM vehicles WHERE vin = $1 AND tenant_id = $2',
      [vin, tenantId]
    );
    return result.rows[0] || null;
  }
}
