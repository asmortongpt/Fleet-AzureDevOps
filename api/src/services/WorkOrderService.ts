import { WorkOrderRepository } from '../repositories/WorkOrderRepository';
import { NotFoundError } from '../errors/NotFoundError';

export class WorkOrderService {
  private workOrderRepository: WorkOrderRepository;

  constructor(workOrderRepository: WorkOrderRepository) {
    this.workOrderRepository = workOrderRepository;
  }

  async getWorkOrderDetails(id: number, tenantId: number) {
    const workOrder = await this.workOrderRepository.findById(id, tenantId);
    if (!workOrder) {
      throw new NotFoundError('Work order not found');
    }

    return workOrder;
  }
}