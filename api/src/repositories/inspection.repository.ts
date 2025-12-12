import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class InspectionRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LInspection_s');
  }

    super(pool, 'LInspection_LRepository extends s');
  }

    super(prisma.inspection);
  }
  
  async findByVehicle(vehicleId: string) {
    return await prisma.inspection.findMany({
      where: { vehicleId },
      orderBy: { inspectionDate: 'desc' }
    });
  }
  
  async findFailedInspections() {
    return await prisma.inspection.findMany({
      where: { passedInspection: false },
      orderBy: { inspectionDate: 'desc' }
    });
  }
}

  /**
   * N+1 PREVENTION: Find with related data
   * Override this method in subclasses for specific relationships
   */
  async findWithRelatedData(id: string, tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.id = $1 AND t.tenant_id = $2 AND t.deleted_at IS NULL
    `;
    const result = await this.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * N+1 PREVENTION: Find all with related data
   * Override this method in subclasses for specific relationships
   */
  async findAllWithRelatedData(tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.tenant_id = $1 AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `;
    const result = await this.query(query, [tenantId]);
    return result.rows;
  }
