import { InspectionsRepository, Inspection, InspectionWithRelations } from '../repositories/inspections.repository';

import { BaseService, NotFoundError, ForbiddenError } from './base.service';

export class InspectionsService extends BaseService {
  constructor(
    private inspectionsRepository: InspectionsRepository
  ) {
    super();
  }

  async getInspections(tenantId: number): Promise<{ data: InspectionWithRelations[]; count: number }> {
    try {
      const inspections = await this.inspectionsRepository.findByTenant(tenantId);
      const count = await this.inspectionsRepository.countByTenant(tenantId);

      return {
        data: inspections,
        count
      };
    } catch (error) {
      return this.handleError('getInspections', error, { tenantId });
    }
  }

  async getInspectionById(id: string, tenantId: number): Promise<InspectionWithRelations> {
    try {
      const inspection = await this.inspectionsRepository.findById(id, tenantId);

      if (!inspection) {
        throw new NotFoundError('Inspection not found');
      }

      return inspection;
    } catch (error) {
      return this.handleError('getInspectionById', error, { inspectionId: id, tenantId });
    }
  }

  async createInspection(data: Partial<Inspection>, tenantId: number, userId: number): Promise<Inspection> {
    try {
      // Business logic: Validate foreign keys
      if (data.vehicle_id && !(await this.inspectionsRepository.validateVehicle(data.vehicle_id, tenantId))) {
        throw new ForbiddenError('Vehicle not found or access denied');
      }

      if (data.inspector_id && !(await this.inspectionsRepository.validateInspector(data.inspector_id, tenantId))) {
        throw new ForbiddenError('Inspector not found or access denied');
      }

      const inspection = await this.inspectionsRepository.create(data, tenantId, userId);

      this.logger.info('Inspection created', {
        inspectionId: inspection.id,
        vehicleId: data.vehicle_id,
        userId,
        tenantId
      });

      return inspection;
    } catch (error) {
      return this.handleError('createInspection', error, { data, tenantId, userId });
    }
  }

  async updateInspection(id: string, updates: Partial<Inspection>, tenantId: number, userId: number): Promise<Inspection> {
    try {
      // Verify inspection exists and belongs to tenant
      const existingInspection = await this.inspectionsRepository.findById(id, tenantId);
      if (!existingInspection) {
        throw new NotFoundError('Inspection not found or access denied');
      }

      const inspection = await this.inspectionsRepository.update(id, updates, tenantId, userId);

      if (!inspection) {
        throw new NotFoundError('Inspection not found after update');
      }

      this.logger.info('Inspection updated', {
        inspectionId: id,
        updatedFields: Object.keys(updates),
        userId,
        tenantId
      });

      return inspection;
    } catch (error) {
      return this.handleError('updateInspection', error, { inspectionId: id, updates, tenantId, userId });
    }
  }

  async deleteInspection(id: string, tenantId: number, userId: number): Promise<void> {
    try {
      const deleted = await this.inspectionsRepository.softDelete(id, tenantId, userId);

      if (!deleted) {
        throw new NotFoundError('Inspection not found or already deleted');
      }

      this.logger.info('Inspection deleted (soft)', {
        inspectionId: id,
        userId,
        tenantId
      });
    } catch (error) {
      return this.handleError('deleteInspection', error, { inspectionId: id, tenantId, userId });
    }
  }
}
