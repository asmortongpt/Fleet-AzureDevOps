import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class WorkorderRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'workorders');
  }

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
