import { BaseRepository } from '../repositories/BaseRepository';

import { Repository } from '../lib/repository';
import { prisma } from '../lib/prisma';

export class WorkOrderRepository extends Repository<any> {
  constructor(pool: Pool) {
    super(pool, 'LWork_LOrder_LRepository extends s');
  }

  constructor() {
    super(prisma.workOrder);
  }
  
  async findByStatus(status: string) {
    return await prisma.workOrder.findMany({
      where: { status },
      orderBy: { priority: 'desc' }
    });
  }
  
  async findByPriority(priority: string) {
    return await prisma.workOrder.findMany({
      where: { priority },
      orderBy: { scheduledDate: 'asc' }
    });
  }
}

export const workOrderRepository = new WorkOrderRepository();

/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM workorder t
    WHERE t.id = \api/src/repositories/workorder.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM workorder t
    WHERE t.tenant_id = \api/src/repositories/workorder.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
