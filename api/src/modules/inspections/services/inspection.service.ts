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
    if (!data.vehicle_id) {
throw new Error("Vehicle ID is required");
}
    if (!data.type) {
throw new Error("Inspection type is required");
}

    // Validate type enum (matches DB inspection_type enum)
    const validTypes = ['pre_trip', 'post_trip', 'annual', 'dot', 'safety', 'emissions', 'special'];
    if (data.type && !validTypes.includes(data.type)) {
      throw new Error(`Invalid inspection type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate status enum
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'failed'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  async getAll(tenantId: string): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findAll(tenantId);
    });
  }

  async getById(id: string, tenantId: string): Promise<Inspection | null> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findById(id, tenantId);
    });
  }

  async getByType(inspectionType: string, tenantId: string): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByType(inspectionType, tenantId);
    });
  }

  async getByStatus(status: string, tenantId: string): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByStatus(status, tenantId);
    });
  }

  async getByVehicle(vehicleId: string, tenantId: string): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByVehicle(vehicleId, tenantId);
    });
  }

  async getByDriver(driverId: string, tenantId: string): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByDriver(driverId, tenantId);
    });
  }

  async getByInspector(inspectorId: string, tenantId: string): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByInspector(inspectorId, tenantId);
    });
  }

  async getFailed(tenantId: string): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findFailed(tenantId);
    });
  }

  async getByDateRange(startDate: string, endDate: string, tenantId: string): Promise<Inspection[]> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.findByDateRange(startDate, endDate, tenantId);
    });
  }

  async create(data: Partial<Inspection>, tenantId: string): Promise<Inspection> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.create(data, tenantId);
    });
  }

  async update(id: string, data: Partial<Inspection>, tenantId: string): Promise<Inspection | null> {
    // Only validate fields that are being updated
    if (Object.keys(data).length > 0) {
      const validationData = {
        vehicle_id: data.vehicle_id || 'dummy',
        type: data.type || 'pre_trip',
        ...data
      };
      await this.validate(validationData);
    }
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.update(id, data, tenantId);
    });
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    return this.executeInTransaction(async () => {
      return await this.inspectionRepository.delete(id, tenantId);
    });
  }
}
