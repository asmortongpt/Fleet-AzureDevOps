import { BaseRepository } from '../repositories/BaseRepository';

import { Repository } from '../lib/repository';
import { prisma } from '../lib/prisma';

export class InspectionRepository extends Repository<any> {
  constructor(pool: Pool) {
    super(pool, 'LInspection_LRepository extends s');
  }

  constructor() {
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

export const inspectionRepository = new InspectionRepository();

/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM inspection t
    WHERE t.id = \api/src/repositories/inspection.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM inspection t
    WHERE t.tenant_id = \api/src/repositories/inspection.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
