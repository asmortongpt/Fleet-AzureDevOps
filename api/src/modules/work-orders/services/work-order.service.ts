import { injectable, inject } from "inversify";

import { BaseService } from "../../../services/base.service";
import { TYPES } from "../../../types";
import type { WorkOrder } from "../../../types/work-order";
import { WorkOrderRepository } from "../repositories/work-order.repository";
import { WorkOrderPartsRepository, WorkOrderPart } from "../repositories/work-order-parts.repository";
import { WorkOrderLaborRepository, WorkOrderLabor } from "../repositories/work-order-labor.repository";

@injectable()
export class WorkOrderService extends BaseService {
  constructor(
    @inject(TYPES.WorkOrderRepository) private workOrderRepository: WorkOrderRepository,
    @inject(TYPES.WorkOrderPartsRepository) private partsRepository: WorkOrderPartsRepository,
    @inject(TYPES.WorkOrderLaborRepository) private laborRepository: WorkOrderLaborRepository
  ) {
    super();
  }

  async validate(data: any): Promise<void> {
    if (!data.work_order_number) {
      throw new Error("Work order number is required");
    }
    if (!data.vehicle_id) {
      throw new Error("Vehicle ID is required");
    }
    if (!data.type) {
      throw new Error("Work order type is required");
    }
    if (!data.description) {
      throw new Error("Description is required");
    }

    // Validate type enum
    const validTypes = ['preventive', 'corrective', 'inspection'];
    if (data.type && !validTypes.includes(data.type)) {
      throw new Error(`Invalid work order type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate priority enum
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    // Validate status enum
    const validStatuses = ['open', 'in_progress', 'on_hold', 'completed', 'cancelled', 'approved'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  async getAll(tenantId: string | number): Promise<WorkOrder[]> {
    return this.executeInTransaction(async () => {
      return await this.workOrderRepository.findAll(tenantId);
    });
  }

  async getById(id: string | number, tenantId: string | number): Promise<WorkOrder | null> {
    return this.executeInTransaction(async () => {
      return await this.workOrderRepository.findById(id, tenantId);
    });
  }

  async getByStatus(status: string, tenantId: string | number): Promise<WorkOrder[]> {
    return this.executeInTransaction(async () => {
      return await this.workOrderRepository.findByStatus(status, tenantId);
    });
  }

  async getByPriority(priority: string, tenantId: string | number): Promise<WorkOrder[]> {
    return this.executeInTransaction(async () => {
      return await this.workOrderRepository.findByPriority(priority, tenantId);
    });
  }

  async getByVehicle(vehicleId: string, tenantId: string | number): Promise<WorkOrder[]> {
    return this.executeInTransaction(async () => {
      return await this.workOrderRepository.findByVehicle(vehicleId, tenantId);
    });
  }

  async getByFacility(facilityId: string, tenantId: string | number): Promise<WorkOrder[]> {
    return this.executeInTransaction(async () => {
      return await this.workOrderRepository.findByFacility(facilityId, tenantId);
    });
  }

  async getByTechnician(technicianId: string, tenantId: string | number): Promise<WorkOrder[]> {
    return this.executeInTransaction(async () => {
      return await this.workOrderRepository.findByTechnician(technicianId, tenantId);
    });
  }

  async getParts(workOrderId: string, tenantId: string | number): Promise<WorkOrderPart[]> {
    return this.executeInTransaction(async () => {
      return await this.partsRepository.findByWorkOrderId(workOrderId, String(tenantId));
    });
  }

  async getLabor(workOrderId: string, tenantId: string | number): Promise<WorkOrderLabor[]> {
    return this.executeInTransaction(async () => {
      return await this.laborRepository.findByWorkOrderId(workOrderId, String(tenantId));
    });
  }

  async create(data: Partial<WorkOrder>, tenantId: string | number): Promise<WorkOrder> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.workOrderRepository.create(data, tenantId);
    });
  }

  async update(id: string | number, data: Partial<WorkOrder>, tenantId: string | number): Promise<WorkOrder | null> {
    // Only validate fields that are being updated
    if (Object.keys(data).length > 0) {
      await this.validate({ ...data, work_order_number: data.work_order_number || 'dummy', vehicle_id: data.vehicle_id || 'dummy', type: data.type || 'preventive', description: data.description || 'dummy' });
    }
    return this.executeInTransaction(async () => {
      return await this.workOrderRepository.update(id, data, tenantId);
    });
  }

  async delete(id: string | number, tenantId: string | number): Promise<boolean> {
    return this.executeInTransaction(async () => {
      return await this.workOrderRepository.delete(id, tenantId);
    });
  }
}
