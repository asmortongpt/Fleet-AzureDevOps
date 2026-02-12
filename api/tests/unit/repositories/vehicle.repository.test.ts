import { describe, it, expect, vi, beforeEach } from 'vitest';

import { VehicleRepository } from '../../../src/modules/fleet/repositories/vehicle.repository';
import type { Vehicle } from '../../../src/types/vehicle';

describe('VehicleRepository', () => {
  let vehicleRepository: VehicleRepository;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: vi.fn()
    };

    vehicleRepository = new VehicleRepository();
    vehicleRepository['pool'] = mockPool;
  });

  describe('findByNumber', () => {
    it('should find vehicle by number and tenant', async () => {
      const mockVehicle: Vehicle = {
        id: 1,
        number: 'V-001',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        status: 'active',
        tenantId: 1
      };

      mockPool.query.mockResolvedValue({
        rows: [mockVehicle],
        rowCount: 1
      });

      const result = await vehicleRepository.findByNumber('V-001', 1);

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM fleet_vehicles WHERE number = $1 AND tenant_id = $2',
        ['V-001', 1]
      );
      expect(result).toEqual(mockVehicle);
    });

    it('should return null when vehicle not found', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const result = await vehicleRepository.findByNumber('V-999', 1);

      expect(result).toBeNull();
    });

    it('should use parameterized query', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      await vehicleRepository.findByNumber('V-001', 5);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('$1'),
        expect.arrayContaining(['V-001', 5])
      );
    });

    it('should respect tenant isolation', async () => {
      const mockVehicle: Vehicle = {
        id: 1,
        number: 'V-001',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        status: 'active',
        tenantId: 2
      };

      mockPool.query.mockResolvedValue({
        rows: [mockVehicle],
        rowCount: 1
      });

      await vehicleRepository.findByNumber('V-001', 2);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['V-001', 2]
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPool.query.mockRejectedValue(dbError);

      await expect(vehicleRepository.findByNumber('V-001', 1))
        .rejects
        .toThrow('Database connection failed');
    });
  });

  describe('findActive', () => {
    it('should find all active vehicles for a tenant', async () => {
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
          status: 'active',
          tenantId: 1
        }
      ];

      mockPool.query.mockResolvedValue({
        rows: mockVehicles,
        rowCount: 2
      });

      const result = await vehicleRepository.findActive(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM fleet_vehicles WHERE status = 'active' AND tenant_id = $1",
        [1]
      );
      expect(result).toEqual(mockVehicles);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no active vehicles', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const result = await vehicleRepository.findActive(1);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should filter by active status only', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      await vehicleRepository.findActive(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'active'"),
        expect.any(Array)
      );
    });

    it('should use parameterized query for tenant', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      await vehicleRepository.findActive(5);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('$1'),
        [5]
      );
    });

    it('should respect tenant isolation', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      await vehicleRepository.findActive(10);

      const call = mockPool.query.mock.calls[0];
      expect(call[0]).toContain('tenant_id = $1');
      expect(call[1]).toEqual([10]);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Query timeout');
      mockPool.query.mockRejectedValue(dbError);

      await expect(vehicleRepository.findActive(1))
        .rejects
        .toThrow('Query timeout');
    });

    it('should return all active vehicles for large datasets', async () => {
      const mockVehicles = Array(100).fill(null).map((_, i) => ({
        id: i + 1,
        number: `V-${String(i + 1).padStart(3, '0')}`,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        status: 'active' as const,
        tenantId: 1
      }));

      mockPool.query.mockResolvedValue({
        rows: mockVehicles,
        rowCount: 100
      });

      const result = await vehicleRepository.findActive(1);

      expect(result).toHaveLength(100);
    });
  });

  describe('inherited methods from BaseRepository', () => {
    it('should use correct table name', () => {
      expect(vehicleRepository['tableName']).toBe('fleet_vehicles');
    });

    it('should inherit findAll method', () => {
      expect(typeof vehicleRepository.findAll).toBe('function');
    });

    it('should inherit findById method', () => {
      expect(typeof vehicleRepository.findById).toBe('function');
    });

    it('should inherit create method', () => {
      expect(typeof vehicleRepository.create).toBe('function');
    });

    it('should inherit update method', () => {
      expect(typeof vehicleRepository.update).toBe('function');
    });

    it('should inherit delete method', () => {
      expect(typeof vehicleRepository.delete).toBe('function');
    });
  });

  describe('SQL injection prevention', () => {
    it('should use parameterized queries in findByNumber', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const maliciousInput = "V-001' OR '1'='1";
      await vehicleRepository.findByNumber(maliciousInput, 1);

      const call = mockPool.query.mock.calls[0];
      expect(call[0]).toContain('$1');
      expect(call[1]).toEqual([maliciousInput, 1]);
    });

    it('should use parameterized queries in findActive', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await vehicleRepository.findActive(1);

      const call = mockPool.query.mock.calls[0];
      expect(call[0]).toContain('$1');
      // The query contains '1' in status = 'active' and tenant_id = $1, so we check parameters instead
      expect(call[1]).toEqual([1]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string vehicle number', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await vehicleRepository.findByNumber('', 1);

      expect(result).toBeNull();
    });

    it('should handle zero tenant ID', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await vehicleRepository.findActive(0);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        [0]
      );
    });

    it('should handle negative tenant ID', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await vehicleRepository.findActive(-1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        [-1]
      );
    });

    it('should handle special characters in vehicle number', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await vehicleRepository.findByNumber('V-001@#$', 1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['V-001@#$', 1]
      );
    });
  });
});
