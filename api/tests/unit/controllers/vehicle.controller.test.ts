import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { Vehicle } from '../../../src/types/vehicle';

// Mock container before imports
vi.mock('../../../src/container', () => ({
  container: {
    get: vi.fn()
  }
}));

import { VehicleController } from '../../../src/modules/fleet/controllers/vehicle.controller';
import { container } from '../../../src/container';

describe('VehicleController', () => {
  let vehicleController: VehicleController;
  let mockVehicleService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockVehicleService = {
      getAllVehicles: vi.fn(),
      createVehicle: vi.fn(),
      updateVehicle: vi.fn(),
      deleteVehicle: vi.fn()
    };

    vi.mocked(container.get).mockReturnValue(mockVehicleService);

    vehicleController = new VehicleController();

    mockRequest = {
      body: {},
      params: {},
      user: { tenant_id: 1 } as any
    } as Partial<Request>;

    mockResponse = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    } as Partial<Response>;

    mockNext = vi.fn();
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
        }
      ];

      mockVehicleService.getAllVehicles.mockResolvedValue(mockVehicles);

      await vehicleController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.getAllVehicles).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockVehicles);
    });

    it('should use tenant ID from authenticated user', async () => {
      mockRequest.user = { tenant_id: 42 } as any;
      mockVehicleService.getAllVehicles.mockResolvedValue([]);

      await vehicleController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.getAllVehicles).toHaveBeenCalledWith(42);
    });

    it('should default to tenant ID 1 when user not authenticated', async () => {
      delete mockRequest.user;
      mockVehicleService.getAllVehicles.mockResolvedValue([]);

      await vehicleController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.getAllVehicles).toHaveBeenCalledWith(1);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockVehicleService.getAllVehicles.mockRejectedValue(error);

      await vehicleController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should return empty array when no vehicles exist', async () => {
      mockVehicleService.getAllVehicles.mockResolvedValue([]);

      await vehicleController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      mockVehicleService.getAllVehicles.mockRejectedValue(dbError);

      await vehicleController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe('createVehicle', () => {
    it('should create a new vehicle', async () => {
      const vehicleData = {
        number: 'V-002',
        make: 'Honda',
        model: 'Accord',
        year: 2021
      };

      const createdVehicle: Vehicle = {
        id: 2,
        tenantId: 1,
        status: 'active',
        ...vehicleData
      };

      mockRequest.body = vehicleData;
      mockVehicleService.createVehicle.mockResolvedValue(createdVehicle);

      await vehicleController.createVehicle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.createVehicle).toHaveBeenCalledWith(vehicleData, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdVehicle);
    });

    it('should use tenant ID from authenticated user', async () => {
      mockRequest.user = { tenant_id: 5 } as any;
      mockRequest.body = {
        number: 'V-003',
        make: 'Ford',
        model: 'F-150'
      };

      mockVehicleService.createVehicle.mockResolvedValue({
        id: 3,
        tenantId: 5
      });

      await vehicleController.createVehicle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.createVehicle).toHaveBeenCalledWith(
        mockRequest.body,
        5
      );
    });

    it('should default to tenant ID 1 when user not authenticated', async () => {
      delete mockRequest.user;
      mockRequest.body = {
        number: 'V-004',
        make: 'Chevrolet',
        model: 'Silverado'
      };

      mockVehicleService.createVehicle.mockResolvedValue({ id: 4, tenantId: 1 });

      await vehicleController.createVehicle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.createVehicle).toHaveBeenCalledWith(
        mockRequest.body,
        1
      );
    });

    it('should return 201 status code', async () => {
      mockRequest.body = {
        number: 'V-005',
        make: 'Tesla',
        model: 'Model 3'
      };

      mockVehicleService.createVehicle.mockResolvedValue({
        id: 5,
        tenantId: 1
      });

      await vehicleController.createVehicle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Vehicle number is required');
      mockRequest.body = { make: 'Toyota' };
      mockVehicleService.createVehicle.mockRejectedValue(validationError);

      await vehicleController.createVehicle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle duplicate vehicle number errors', async () => {
      const duplicateError = new Error('Vehicle number already exists');
      mockRequest.body = {
        number: 'V-001',
        make: 'Toyota',
        model: 'Camry'
      };
      mockVehicleService.createVehicle.mockRejectedValue(duplicateError);

      await vehicleController.createVehicle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(duplicateError);
    });

    it('should pass entire request body to service', async () => {
      const vehicleData = {
        number: 'V-006',
        make: 'Nissan',
        model: 'Altima',
        year: 2022,
        status: 'active',
        vin: '1234567890'
      };

      mockRequest.body = vehicleData;
      mockVehicleService.createVehicle.mockResolvedValue({
        id: 6,
        tenantId: 1,
        ...vehicleData
      });

      await vehicleController.createVehicle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.createVehicle).toHaveBeenCalledWith(vehicleData, 1);
    });
  });

  describe('error handling', () => {
    it('should pass errors to next middleware', async () => {
      const error = new Error('Unexpected error');
      mockVehicleService.getAllVehicles.mockRejectedValue(error);

      await vehicleController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not call response methods when error occurs', async () => {
      const error = new Error('Service error');
      mockVehicleService.getAllVehicles.mockRejectedValue(error);

      await vehicleController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('tenant isolation', () => {
    it('should never expose data from other tenants', async () => {
      mockRequest.user = { tenant_id: 1 } as any;
      mockVehicleService.getAllVehicles.mockResolvedValue([
        { id: 1, tenantId: 1 }
      ]);

      await vehicleController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.getAllVehicles).toHaveBeenCalledWith(1);
      expect(mockVehicleService.getAllVehicles).not.toHaveBeenCalledWith(2);
    });

    it('should isolate create operations by tenant', async () => {
      mockRequest.user = { tenant_id: 3 } as any;
      mockRequest.body = { number: 'V-007', make: 'BMW', model: 'X5' };
      mockVehicleService.createVehicle.mockResolvedValue({
        id: 7,
        tenantId: 3
      });

      await vehicleController.createVehicle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.createVehicle).toHaveBeenCalledWith(
        expect.any(Object),
        3
      );
    });
  });

  describe('edge cases', () => {
    it('should handle missing request body', async () => {
      delete mockRequest.body;
      mockVehicleService.createVehicle.mockResolvedValue({ id: 1, tenantId: 1 });

      await vehicleController.createVehicle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.createVehicle).toHaveBeenCalled();
    });

    it('should handle null user object', async () => {
      (mockRequest as any).user = null;
      mockVehicleService.getAllVehicles.mockResolvedValue([]);

      await vehicleController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.getAllVehicles).toHaveBeenCalledWith(1);
    });

    it('should handle undefined tenant_id', async () => {
      mockRequest.user = {} as any;
      mockVehicleService.getAllVehicles.mockResolvedValue([]);

      await vehicleController.getAllVehicles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockVehicleService.getAllVehicles).toHaveBeenCalledWith(1);
    });
  });
});
