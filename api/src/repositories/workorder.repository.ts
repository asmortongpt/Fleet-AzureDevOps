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
