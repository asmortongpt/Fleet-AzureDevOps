import { MaintenanceRepository, MaintenanceRecord, MaintenanceRecordWithRelations } from '../repositories/maintenance.repository';

import { BaseService, NotFoundError } from './base.service';

export class MaintenanceService extends BaseService {
  constructor(
    private maintenanceRepository: MaintenanceRepository
  ) {
    super();
  }

  async getMaintenanceRecords(tenantId: number): Promise<{ data: MaintenanceRecordWithRelations[]; count: number }> {
    try {
      const records = await this.maintenanceRepository.findByTenant(tenantId);
      const count = await this.maintenanceRepository.countByTenant(tenantId);

      return {
        data: records,
        count
      };
    } catch (error) {
      return this.handleError('getMaintenanceRecords', error, { tenantId });
    }
  }

  async getMaintenanceRecordById(id: string, tenantId: number): Promise<MaintenanceRecordWithRelations> {
    try {
      const record = await this.maintenanceRepository.findById(id, tenantId);

      if (!record) {
        throw new NotFoundError('Maintenance record not found');
      }

      return record;
    } catch (error) {
      return this.handleError('getMaintenanceRecordById', error, { maintenanceId: id, tenantId });
    }
  }

  async createMaintenanceRecord(data: Partial<MaintenanceRecord>, tenantId: number, userId: number): Promise<MaintenanceRecord> {
    try {
      // Business logic: Set default values
      const recordData = {
        ...data,
        status: data.status || 'completed'
      };

      const record = await this.maintenanceRepository.create(recordData, tenantId, userId);

      this.logger.info('Maintenance record created', {
        maintenanceId: record.id,
        vehicleId: data.vehicle_id,
        userId,
        tenantId
      });

      return record;
    } catch (error) {
      return this.handleError('createMaintenanceRecord', error, { data, tenantId, userId });
    }
  }

  async updateMaintenanceRecord(id: string, updates: Partial<MaintenanceRecord>, tenantId: number, userId: number): Promise<MaintenanceRecord> {
    try {
      // Verify record exists and belongs to tenant
      const existingRecord = await this.maintenanceRepository.findById(id, tenantId);
      if (!existingRecord) {
        throw new NotFoundError('Maintenance record not found or access denied');
      }

      const record = await this.maintenanceRepository.update(id, updates, tenantId, userId);

      if (!record) {
        throw new NotFoundError('Maintenance record not found after update');
      }

      this.logger.info('Maintenance record updated', {
        maintenanceId: id,
        updatedFields: Object.keys(updates),
        userId,
        tenantId
      });

      return record;
    } catch (error) {
      return this.handleError('updateMaintenanceRecord', error, { maintenanceId: id, updates, tenantId, userId });
    }
  }

  async deleteMaintenanceRecord(id: string, tenantId: number, userId: number): Promise<void> {
    try {
      const deleted = await this.maintenanceRepository.softDelete(id, tenantId, userId);

      if (!deleted) {
        throw new NotFoundError('Maintenance record not found or already deleted');
      }

      this.logger.info('Maintenance record deleted (soft)', {
        maintenanceId: id,
        userId,
        tenantId
      });
    } catch (error) {
      return this.handleError('deleteMaintenanceRecord', error, { maintenanceId: id, tenantId, userId });
    }
  }
}
