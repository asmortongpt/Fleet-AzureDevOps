import { describe, it, expect, vi, beforeEach } from 'vitest';

import { VehicleService } from '../../../src/modules/fleet/services/vehicle.service';
import type { Vehicle } from '../../../src/types/vehicle';

describe('VehicleService', () => {
  let vehicleService: VehicleService;
  let mockVehicleRepository: any;
  let mockTransaction: any;

  beforeEach(() => {
    mockVehicleRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };

    // Mock the transaction mechanism
    mockTransaction = vi.fn((callback) => callback());

    vehicleService = new VehicleService(mockVehicleRepository);
    vehicleService['executeInTransaction'] = mockTransaction;
  });

  describe('validate', () => {
    it('should throw error when vehicle number is missing', async () => {
      const invalidData = { make: 'Toyota', model: 'Camry' };

      await expect(vehicleService.validate(invalidData))
        .rejects
        .toThrow('Vehicle number is required');
    });

    it('should throw error when make is missing', async () => {
      const invalidData = { number: 'V-001', model: 'Camry' };

      await expect(vehicleService.validate(invalidData))
        .rejects
        .toThrow('Make is required');
    });

    it('should throw error when model is missing', async () => {
      const invalidData = { number: 'V-001', make: 'Toyota' };

      await expect(vehicleService.validate(invalidData))
        .rejects
        .toThrow('Model is required');
    });

    it('should not throw error for valid data', async () => {
      const validData = {
        number: 'V-001',
        make: 'Toyota',
        model: 'Camry'
      };

      await expect(vehicleService.validate(validData))
        .resolves
        .toBeUndefined();
    });
  });

  describe('getAllVehicles', () => {
    it('should return all vehicles for a tenant', async () => {
      const mockVehicles: Vehicle[] = [
        {
          id: 1,
          number: 'V-001',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          status: 'active',
          tenantId: 1
        },
        {
          id: 2,
          number: 'V-002',
          make: 'Honda',
          model: 'Accord',
          year: 2021,
          status: 'maintenance',
          tenantId: 1
        }
      ];

      mockVehicleRepository.findAll.mockResolvedValue(mockVehicles);

      const result = await vehicleService.getAllVehicles(1);

      expect(mockVehicleRepository.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockVehicles);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no vehicles exist', async () => {
      mockVehicleRepository.findAll.mockResolvedValue([]);

      const result = await vehicleService.getAllVehicles(1);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should execute within a transaction', async () => {
      mockVehicleRepository.findAll.mockResolvedValue([]);

      await vehicleService.getAllVehicles(1);

      expect(mockTransaction).toHaveBeenCalled();
    });
  });

  describe('getVehicleById', () => {
    it('should return vehicle when found', async () => {
      const mockVehicle: Vehicle = {
        id: 1,
        number: 'V-001',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        status: 'active',
        tenantId: 1
      };

      mockVehicleRepository.findById.mockResolvedValue(mockVehicle);

      const result = await vehicleService.getVehicleById(1, 1);

      expect(mockVehicleRepository.findById).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(mockVehicle);
    });

    it('should return null when vehicle not found', async () => {
      mockVehicleRepository.findById.mockResolvedValue(null);

      const result = await vehicleService.getVehicleById(999, 1);

      expect(result).toBeNull();
    });

    it('should pass correct parameters to repository', async () => {
      mockVehicleRepository.findById.mockResolvedValue(null);

      await vehicleService.getVehicleById(42, 5);

      expect(mockVehicleRepository.findById).toHaveBeenCalledWith(42, 5);
    });

    it('should execute within a transaction', async () => {
      mockVehicleRepository.findById.mockResolvedValue(null);

      await vehicleService.getVehicleById(1, 1);

      expect(mockTransaction).toHaveBeenCalled();
    });
  });

  describe('createVehicle', () => {
    it('should create a new vehicle with valid data', async () => {
      const vehicleData = {
        number: 'V-003',
        make: 'Ford',
        model: 'F-150',
        year: 2022,
        status: 'active' as const
      };

      const createdVehicle: Vehicle = {
        id: 3,
        tenantId: 1,
        ...vehicleData
      };

      mockVehicleRepository.create.mockResolvedValue(createdVehicle);

      const result = await vehicleService.createVehicle(vehicleData, 1);

      expect(mockVehicleRepository.create).toHaveBeenCalledWith(vehicleData, 1);
      expect(result).toEqual(createdVehicle);
      expect(result.id).toBe(3);
    });

    it('should throw error for invalid data', async () => {
      const invalidData = {
        make: 'Ford',
        model: 'F-150'
        // missing number
      };

      await expect(vehicleService.createVehicle(invalidData, 1))
        .rejects
        .toThrow('Vehicle number is required');

      expect(mockVehicleRepository.create).not.toHaveBeenCalled();
    });

    it('should execute within a transaction', async () => {
      const vehicleData = {
        number: 'V-003',
        make: 'Ford',
        model: 'F-150'
      };

      mockVehicleRepository.create.mockResolvedValue({ id: 1, ...vehicleData, tenantId: 1 });

      await vehicleService.createVehicle(vehicleData, 1);

      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const vehicleData = {
        number: 'V-003',
        make: 'Ford',
        model: 'F-150'
      };

      const dbError = new Error('Database connection failed');
      mockVehicleRepository.create.mockRejectedValue(dbError);

      await expect(vehicleService.createVehicle(vehicleData, 1))
        .rejects
        .toThrow('Database connection failed');
    });
  });

  describe('updateVehicle', () => {
    it('should update an existing vehicle', async () => {
      const updateData = {
        number: 'V-001-UPDATED',
        make: 'Toyota',
        model: 'Camry',
        year: 2021
      };

      const updatedVehicle: Vehicle = {
        id: 1,
        tenantId: 1,
        status: 'active',
        ...updateData
      };

      mockVehicleRepository.update.mockResolvedValue(updatedVehicle);

      const result = await vehicleService.updateVehicle(1, updateData, 1);

      expect(mockVehicleRepository.update).toHaveBeenCalledWith(1, updateData, 1);
      expect(result).toEqual(updatedVehicle);
    });

    it('should throw error for invalid update data', async () => {
      const invalidData = {
        model: 'Camry'
        // missing required fields
      };

      await expect(vehicleService.updateVehicle(1, invalidData, 1))
        .rejects
        .toThrow();

      expect(mockVehicleRepository.update).not.toHaveBeenCalled();
    });

    it('should return null when vehicle not found', async () => {
      const updateData = {
        number: 'V-999',
        make: 'Toyota',
        model: 'Camry'
      };

      mockVehicleRepository.update.mockResolvedValue(null);

      const result = await vehicleService.updateVehicle(999, updateData, 1);

      expect(result).toBeNull();
    });

    it('should execute within a transaction', async () => {
      const updateData = {
        number: 'V-001',
        make: 'Toyota',
        model: 'Camry'
      };

      mockVehicleRepository.update.mockResolvedValue(null);

      await vehicleService.updateVehicle(1, updateData, 1);

      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        number: 'V-001',
        make: 'Toyota',
        model: 'Camry',
        status: 'maintenance' as const
      };

      const updatedVehicle: Vehicle = {
        id: 1,
        tenantId: 1,
        year: 2020, // existing field
        ...partialUpdate
      };

      mockVehicleRepository.update.mockResolvedValue(updatedVehicle);

      const result = await vehicleService.updateVehicle(1, partialUpdate, 1);

      expect(result).toEqual(updatedVehicle);
    });
  });

  describe('deleteVehicle', () => {
    it('should delete an existing vehicle', async () => {
      mockVehicleRepository.delete.mockResolvedValue(true);

      const result = await vehicleService.deleteVehicle(1, 1);

      expect(mockVehicleRepository.delete).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });

    it('should return false when vehicle not found', async () => {
      mockVehicleRepository.delete.mockResolvedValue(false);

      const result = await vehicleService.deleteVehicle(999, 1);

      expect(result).toBe(false);
    });

    it('should execute within a transaction', async () => {
      mockVehicleRepository.delete.mockResolvedValue(true);

      await vehicleService.deleteVehicle(1, 1);

      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      const dbError = new Error('Foreign key constraint violation');
      mockVehicleRepository.delete.mockRejectedValue(dbError);

      await expect(vehicleService.deleteVehicle(1, 1))
        .rejects
        .toThrow('Foreign key constraint violation');
    });

    it('should pass correct tenant isolation', async () => {
      mockVehicleRepository.delete.mockResolvedValue(true);

      await vehicleService.deleteVehicle(5, 10);

      expect(mockVehicleRepository.delete).toHaveBeenCalledWith(5, 10);
    });
  });

  describe('tenant isolation', () => {
    it('should respect tenant boundaries in all operations', async () => {
      const tenantId = 42;

      mockVehicleRepository.findAll.mockResolvedValue([]);
      mockVehicleRepository.findById.mockResolvedValue(null);
      mockVehicleRepository.create.mockResolvedValue({ id: 1, tenantId });
      mockVehicleRepository.update.mockResolvedValue(null);
      mockVehicleRepository.delete.mockResolvedValue(false);

      await vehicleService.getAllVehicles(tenantId);
      expect(mockVehicleRepository.findAll).toHaveBeenCalledWith(tenantId);

      await vehicleService.getVehicleById(1, tenantId);
      expect(mockVehicleRepository.findById).toHaveBeenCalledWith(1, tenantId);

      const validData = { number: 'V-001', make: 'Toyota', model: 'Camry' };
      await vehicleService.createVehicle(validData, tenantId);
      expect(mockVehicleRepository.create).toHaveBeenCalledWith(validData, tenantId);

      await vehicleService.updateVehicle(1, validData, tenantId);
      expect(mockVehicleRepository.update).toHaveBeenCalledWith(1, validData, tenantId);

      await vehicleService.deleteVehicle(1, tenantId);
      expect(mockVehicleRepository.delete).toHaveBeenCalledWith(1, tenantId);
    });
  });
});
