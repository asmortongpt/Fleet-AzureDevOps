import { injectable, inject } from "inversify";

import { BaseService } from "../../../services/base.service";
import { TYPES } from "../../../types";
import type { Facility } from "../../../types/facility";
import { FacilityRepository } from "../repositories/facility.repository";

@injectable()
export class FacilityService extends BaseService {
  constructor(@inject(TYPES.FacilityRepository) private facilityRepository: FacilityRepository) {
    super();
  }

  async validate(data: any): Promise<void> {
    if (!data.name) throw new Error("Facility name is required");
    if (!data.facility_type) throw new Error("Facility type is required");
    if (!data.address) throw new Error("Address is required");
  }

  async getAllFacilities(tenantId: number): Promise<Facility[]> {
    return this.executeInTransaction(async () => {
      return await this.facilityRepository.findAll(tenantId);
    });
  }

  async getFacilityById(id: number, tenantId: number): Promise<Facility | null> {
    return this.executeInTransaction(async () => {
      return await this.facilityRepository.findById(id, tenantId);
    });
  }

  async getFacilitiesByType(facilityType: string, tenantId: number): Promise<Facility[]> {
    return this.executeInTransaction(async () => {
      return await this.facilityRepository.findByType(facilityType, tenantId);
    });
  }

  async getActiveFacilities(tenantId: number): Promise<Facility[]> {
    return this.executeInTransaction(async () => {
      return await this.facilityRepository.findActive(tenantId);
    });
  }

  async createFacility(data: Partial<Facility>, tenantId: number): Promise<Facility> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.facilityRepository.create(data, tenantId);
    });
  }

  async updateFacility(id: number, data: Partial<Facility>, tenantId: number): Promise<Facility | null> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.facilityRepository.update(id, data, tenantId);
    });
  }

  async deleteFacility(id: number, tenantId: number): Promise<boolean> {
    return this.executeInTransaction(async () => {
      return await this.facilityRepository.delete(id, tenantId);
    });
  }
}
