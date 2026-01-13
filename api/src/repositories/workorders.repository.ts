import { Pool } from 'pg';

import { BaseRepository } from './base/BaseRepository';

export interface WorkOrder {
  id: number;
  vehicleId: number;
  description: string;
  status: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkOrdersRepository extends BaseRepository<WorkOrder> {
  constructor(pool: Pool) {
    super(pool, 'work_orders');
  }

  // TODO: Implement work order-specific methods
}
