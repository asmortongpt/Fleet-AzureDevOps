import { injectable, inject } from "inversify";

import { BaseService } from "../../../services/base.service";
import { TYPES } from "../../../types";
import type { Driver } from "../../../types/driver";
import { DriverRepository } from "../repositories/driver.repository";

@injectable()
export class DriverService extends BaseService {
  constructor(@inject(TYPES.DriverRepository) private driverRepository: DriverRepository) {
    super();
  }

  async validate(data: any): Promise<void> {
    if (!data.first_name) throw new Error("Driver first name is required");
    if (!data.last_name) throw new Error("Driver last name is required");
    if (!data.email) throw new Error("Driver email is required");
  }

  async getAllDrivers(tenantId: number): Promise<Driver[]> {
    return this.executeInTransaction(async () => {
      return await this.driverRepository.findAll(tenantId);
    });
  }

  async getDriverById(id: number, tenantId: number): Promise<Driver | null> {
    return this.executeInTransaction(async () => {
      return await this.driverRepository.findById(id, tenantId);
    });
  }

  async createDriver(data: Partial<Driver>, tenantId: number): Promise<Driver> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.driverRepository.create(data, tenantId);
    });
  }

  async updateDriver(id: number, data: Partial<Driver>, tenantId: number): Promise<Driver | null> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.driverRepository.update(id, data, tenantId);
    });
  }

  async deleteDriver(id: number, tenantId: number): Promise<boolean> {
    return this.executeInTransaction(async () => {
      return await this.driverRepository.delete(id, tenantId);
    });
  }
}
