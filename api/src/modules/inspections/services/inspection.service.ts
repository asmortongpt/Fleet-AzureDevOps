import { injectable, inject } from "inversify";

import { BaseService } from "../../../services/base.service";
import { TYPES } from "../../../types";
import type { Inspection } from "../../../types/inspection";
import { InspectionRepository } from "../repositories/inspection.repository";

@injectable()
export class InspectionService extends BaseService {
  constructor(@inject(TYPES.InspectionRepository) private inspectionRepository: InspectionRepository) {
    super();
  }

  async validate(data: any): Promise<void> {
    if (!data.vehicle_id) throw new Error("Vehicle ID is required");
    if (!data.inspection_type) throw new Error("Inspection type is required");

    // Validate inspection_type enum
    const validTypes = ['pre_trip', 'post_trip', 'periodic', 'annual', 'dot', 'safety'];
    if (data.inspection_type && !validTypes.includes(data.inspection_type)) {
      throw new Error(`Invalid inspection type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate status enum
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'failed'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  async getAll(tenantId: number): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findAll(tenantId);
    });
  }

  async getById(id: number, tenantId: number): Promise<Inspection | null> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findById(id, tenantId);
    });
  }

  async getByType(inspectionType: string, tenantId: number): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByType(inspectionType, tenantId);
    });
  }

  async getByStatus(status: string, tenantId: number): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByStatus(status, tenantId);
    });
  }

  async getByVehicle(vehicleId: string, tenantId: number): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByVehicle(vehicleId, tenantId);
    });
  }

  async getByDriver(driverId: string, tenantId: number): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByDriver(driverId, tenantId);
    });
  }

  async getByInspector(inspectorId: string, tenantId: number): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByInspector(inspectorId, tenantId);
    });
  }

  async getFailed(tenantId: number): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findFailed(tenantId);
    });
  }

  async getByDateRange(startDate: string, endDate: string, tenantId: number): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByDateRange(startDate, endDate, tenantId);
    });
  }

  async create(data: Partial<Inspection>, tenantId: number): Promise<Inspection> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.create(data, tenantId);
    });
  }

  async update(id: number, data: Partial<Inspection>, tenantId: number): Promise<Inspection | null> {
    // Only validate fields that are being updated
    if (Object.keys(data).length > 0) {
      const validationData = {
        vehicle_id: data.vehicle_id || 'dummy',
        inspection_type: data.inspection_type || 'pre_trip',
        ...data
      };
      await this.validate(validationData);
    }
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.update(id, data, tenantId);
    });
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.delete(id, tenantId);
    });
  }
}
