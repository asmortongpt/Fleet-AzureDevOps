import { injectable, inject } from "inversify";

import { BaseService } from "../../../services/base.service";
import { TYPES } from "../../../types";
import type { Incident } from "../../../types/incident";
import { IncidentRepository } from "../repositories/incident.repository";

@injectable()
export class IncidentService extends BaseService {
  constructor(@inject(TYPES.IncidentRepository) private incidentRepository: IncidentRepository) {
    super();
  }

  async validate(data: any): Promise<void> {
    if (!data.incident_number) throw new Error("Incident number is required");
    if (!data.incident_type) throw new Error("Incident type is required");
    if (!data.incident_date) throw new Error("Incident date is required");
    if (!data.description) throw new Error("Description is required");
    if (!data.reported_by) throw new Error("Reported by is required");

    // Validate incident_type enum
    const validTypes = ['accident', 'damage', 'theft', 'breakdown', 'safety', 'other'];
    if (data.incident_type && !validTypes.includes(data.incident_type)) {
      throw new Error(`Invalid incident type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate severity enum
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (data.severity && !validSeverities.includes(data.severity)) {
      throw new Error(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`);
    }

    // Validate status enum
    const validStatuses = ['reported', 'investigating', 'resolved', 'closed'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  async getAll(tenantId: number): Promise<Incident[]> {
    return this.executeInTransaction(async () => {
      return await this.incidentRepository.findAll(tenantId);
    });
  }

  async getById(id: number, tenantId: number): Promise<Incident | null> {
    return this.executeInTransaction(async () => {
      return await this.incidentRepository.findById(id, tenantId);
    });
  }

  async getByType(incidentType: string, tenantId: number): Promise<Incident[]> {
    return this.executeInTransaction(async () => {
      return await this.incidentRepository.findByType(incidentType, tenantId);
    });
  }

  async getBySeverity(severity: string, tenantId: number): Promise<Incident[]> {
    return this.executeInTransaction(async () => {
      return await this.incidentRepository.findBySeverity(severity, tenantId);
    });
  }

  async getByStatus(status: string, tenantId: number): Promise<Incident[]> {
    return this.executeInTransaction(async () => {
      return await this.incidentRepository.findByStatus(status, tenantId);
    });
  }

  async getByVehicle(vehicleId: string, tenantId: number): Promise<Incident[]> {
    return this.executeInTransaction(async () => {
      return await this.incidentRepository.findByVehicle(vehicleId, tenantId);
    });
  }

  async getByDriver(driverId: string, tenantId: number): Promise<Incident[]> {
    return this.executeInTransaction(async () => {
      return await this.incidentRepository.findByDriver(driverId, tenantId);
    });
  }

  async getByDateRange(startDate: string, endDate: string, tenantId: number): Promise<Incident[]> {
    return this.executeInTransaction(async () => {
      return await this.incidentRepository.findByDateRange(startDate, endDate, tenantId);
    });
  }

  async create(data: Partial<Incident>, tenantId: number): Promise<Incident> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.incidentRepository.create(data, tenantId);
    });
  }

  async update(id: number, data: Partial<Incident>, tenantId: number): Promise<Incident | null> {
    // Only validate fields that are being updated
    if (Object.keys(data).length > 0) {
      const validationData = {
        incident_number: data.incident_number || 'dummy',
        incident_type: data.incident_type || 'other',
        incident_date: data.incident_date || new Date(),
        description: data.description || 'dummy',
        reported_by: data.reported_by || 'dummy',
        ...data
      };
      await this.validate(validationData);
    }
    return this.executeInTransaction(async () => {
      return await this.incidentRepository.update(id, data, tenantId);
    });
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    return this.executeInTransaction(async () => {
      return await this.incidentRepository.delete(id, tenantId);
    });
  }
}
