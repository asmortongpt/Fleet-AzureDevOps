/**
 * Vehicle Contracts & Leasing API Tests
 *
 * Comprehensive test suite for vehicle contract management,
 * lease tracking, and lease-end inspection workflows.
 *
 * @module routes/__tests__/vehicle-contracts.test
 * @since 2026-02-02
 */

import request from 'supertest';
import express from 'express';
import vehicleContractsRouter from '../vehicle-contracts';
import { tenantSafeQuery } from '../../utils/dbHelpers';

// Mock dependencies
jest.mock('../../utils/dbHelpers');
jest.mock('../../middleware/auth', () => ({
  authenticateJWT: (req: any, res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      tenant_id: 'test-tenant-id',
      email: 'test@example.com',
    };
    next();
  },
  AuthRequest: {} as any,
}));
jest.mock('../../middleware/permissions', () => ({
  requirePermission: () => (req: any, res: any, next: any) => next(),
}));
jest.mock('../../middleware/audit', () => ({
  auditLog: () => (req: any, res: any, next: any) => next(),
}));
// Mock CSRF middleware - must match named export
jest.mock('../../middleware/csrf', () => {
  const middleware = jest.fn((req: any, res: any, next: any) => next());
  return {
    doubleCsrfProtection: middleware,
    validateRequest: middleware,
    csrfProtection: middleware,
  };
});
jest.mock('../../utils/fieldMasking', () => ({
  applyFieldMasking: () => (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/vehicle-contracts', vehicleContractsRouter);

const mockedTenantSafeQuery = tenantSafeQuery as jest.MockedFunction<typeof tenantSafeQuery>;

describe('Vehicle Contracts API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/vehicle-contracts', () => {
    it('should list all vehicle contracts with pagination', async () => {
      const mockContracts = [
        {
          id: 'contract-1',
          tenant_id: 'test-tenant-id',
          contract_number: 'LEASE-2024-001',
          contract_type: 'lease',
          vehicle_id: 'vehicle-1',
          vendor_id: 'vendor-1',
          start_date: '2024-01-01',
          end_date: '2027-01-01',
          monthly_payment: 450.00,
          status: 'active',
        },
      ];

      mockedTenantSafeQuery
        .mockResolvedValueOnce({ rows: mockContracts, rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts')
        .query({ page: 1, limit: 50 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].contract_number).toBe('LEASE-2024-001');
      expect(response.body.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 50,
        total_pages: 1,
      });
    });

    it('should filter contracts by vehicle_id', async () => {
      mockedTenantSafeQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts')
        .query({ vehicle_id: 'vehicle-123' });

      expect(response.status).toBe(200);
      expect(mockedTenantSafeQuery).toHaveBeenCalledWith(
        expect.stringContaining('vc.vehicle_id = $2'),
        expect.arrayContaining(['vehicle-123']),
        'test-tenant-id'
      );
    });

    it('should filter contracts by status', async () => {
      mockedTenantSafeQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts')
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      expect(mockedTenantSafeQuery).toHaveBeenCalledWith(
        expect.stringContaining('vc.status = $2'),
        expect.arrayContaining(['active']),
        'test-tenant-id'
      );
    });
  });

  describe('POST /api/vehicle-contracts', () => {
    it('should create a new vehicle contract', async () => {
      const newContract = {
        contract_number: 'LEASE-2024-002',
        contract_type: 'lease',
        vehicle_id: 'vehicle-1',
        vendor_id: 'vendor-1',
        start_date: '2024-06-01',
        end_date: '2027-06-01',
        monthly_payment: 500.00,
        mileage_allowance_annual: 15000,
        excess_mileage_fee: 0.25,
      };

      const mockCreatedContract = {
        id: 'contract-2',
        tenant_id: 'test-tenant-id',
        ...newContract,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      mockedTenantSafeQuery
        .mockResolvedValueOnce({ rows: [mockCreatedContract], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // Update vehicle query

      const response = await request(app)
        .post('/api/vehicle-contracts')
        .send(newContract);

      expect(response.status).toBe(201);
      expect(response.body.contract_number).toBe('LEASE-2024-002');
      expect(response.body.monthly_payment).toBe(500.00);
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidContract = {
        contract_type: 'lease',
        // Missing contract_number, vendor_id, dates
      };

      const response = await request(app)
        .post('/api/vehicle-contracts')
        .send(invalidContract);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 409 if contract number already exists', async () => {
      const duplicateContract = {
        contract_number: 'LEASE-2024-001',
        contract_type: 'lease',
        vendor_id: 'vendor-1',
        start_date: '2024-01-01',
        end_date: '2027-01-01',
      };

      mockedTenantSafeQuery.mockRejectedValueOnce({ code: '23505' });

      const response = await request(app)
        .post('/api/vehicle-contracts')
        .send(duplicateContract);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Contract number already exists');
    });
  });

  describe('GET /api/vehicle-contracts/expiring', () => {
    it('should return contracts expiring within specified days', async () => {
      const mockExpiringContracts = [
        {
          contract_id: 'contract-1',
          contract_number: 'LEASE-2024-001',
          end_date: '2024-03-15',
          days_until_expiry: 45,
        },
      ];

      mockedTenantSafeQuery.mockResolvedValueOnce({
        rows: mockExpiringContracts,
        rowCount: 1,
      } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts/expiring')
        .query({ days: 60 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].days_until_expiry).toBe(45);
    });
  });

  describe('GET /api/vehicle-contracts/:id', () => {
    it('should return a specific contract by ID', async () => {
      const mockContract = {
        id: 'contract-1',
        contract_number: 'LEASE-2024-001',
        contract_type: 'lease',
        vehicle_number: 'V-1001',
        vendor_name: 'Acme Leasing',
      };

      mockedTenantSafeQuery.mockResolvedValueOnce({
        rows: [mockContract],
        rowCount: 1,
      } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts/contract-1');

      expect(response.status).toBe(200);
      expect(response.body.contract_number).toBe('LEASE-2024-001');
      expect(response.body.vendor_name).toBe('Acme Leasing');
    });

    it('should return 404 if contract not found', async () => {
      mockedTenantSafeQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Contract not found');
    });
  });

  describe('PUT /api/vehicle-contracts/:id', () => {
    it('should update an existing contract', async () => {
      const updateData = {
        monthly_payment: 550.00,
        notes: 'Updated payment amount',
      };

      const mockUpdatedContract = {
        id: 'contract-1',
        contract_number: 'LEASE-2024-001',
        monthly_payment: 550.00,
        notes: 'Updated payment amount',
      };

      mockedTenantSafeQuery.mockResolvedValueOnce({
        rows: [mockUpdatedContract],
        rowCount: 1,
      } as any);

      const response = await request(app)
        .put('/api/vehicle-contracts/contract-1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.monthly_payment).toBe(550.00);
      expect(response.body.notes).toBe('Updated payment amount');
    });

    it('should return 404 if contract to update not found', async () => {
      mockedTenantSafeQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await request(app)
        .put('/api/vehicle-contracts/nonexistent-id')
        .send({ monthly_payment: 600.00 });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Contract not found');
    });
  });

  describe('GET /api/vehicle-contracts/vehicles/:vehicleId/lease-status', () => {
    it('should return lease status with mileage analysis', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        vehicle_number: 'V-1001',
        odometer: 40000,
        ownership_type: 'leased',
        contract_id: 'contract-1',
        contract_number: 'LEASE-2024-001',
        lease_mileage_allowance: 45000,
        end_date: '2027-01-01',
        excess_mileage_fee: 0.25,
      };

      const mockMileageAnalysis = {
        mileage_allowance: 45000,
        current_mileage: 40000,
        mileage_used: 40000,
        mileage_remaining: 5000,
        mileage_overage: 0,
        percentage_used: 88.89,
        excess_mileage_fee: 0.25,
        estimated_overage_charge: 0,
      };

      mockedTenantSafeQuery
        .mockResolvedValueOnce({ rows: [mockVehicle], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [mockMileageAnalysis], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // Inspection query

      const response = await request(app)
        .get('/api/vehicle-contracts/vehicles/vehicle-1/lease-status');

      expect(response.status).toBe(200);
      expect(response.body.vehicle_id).toBe('vehicle-1');
      expect(response.body.mileage_analysis.percentage_used).toBeCloseTo(88.89, 1);
      expect(response.body.alerts).toBeDefined();
    });

    it('should return 404 if vehicle not found', async () => {
      mockedTenantSafeQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts/vehicles/nonexistent-vehicle/lease-status');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Vehicle not found');
    });

    it('should return 400 if vehicle is not leased', async () => {
      const mockOwnedVehicle = {
        id: 'vehicle-2',
        vehicle_number: 'V-1002',
        ownership_type: 'owned',
        contract_id: null,
      };

      mockedTenantSafeQuery.mockResolvedValueOnce({
        rows: [mockOwnedVehicle],
        rowCount: 1,
      } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts/vehicles/vehicle-2/lease-status');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('does not have an active lease');
    });

    it('should generate mileage alerts at 80% threshold', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        vehicle_number: 'V-1001',
        odometer: 36000, // 80% of 45000
        ownership_type: 'leased',
        contract_id: 'contract-1',
        contract_number: 'LEASE-2024-001',
        lease_mileage_allowance: 45000,
        end_date: '2027-01-01',
        excess_mileage_fee: 0.25,
      };

      const mockMileageAnalysis = {
        mileage_allowance: 45000,
        current_mileage: 36000,
        mileage_used: 36000,
        mileage_remaining: 9000,
        mileage_overage: 0,
        percentage_used: 80.0,
        excess_mileage_fee: 0.25,
        estimated_overage_charge: 0,
      };

      mockedTenantSafeQuery
        .mockResolvedValueOnce({ rows: [mockVehicle], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [mockMileageAnalysis], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts/vehicles/vehicle-1/lease-status');

      expect(response.status).toBe(200);
      expect(response.body.alerts).toHaveLength(1);
      expect(response.body.alerts[0].alert_type).toBe('mileage_80');
      expect(response.body.alerts[0].severity).toBe('info');
    });

    it('should generate critical alert at 100% mileage', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        vehicle_number: 'V-1001',
        odometer: 50000, // Over allowance
        ownership_type: 'leased',
        contract_id: 'contract-1',
        contract_number: 'LEASE-2024-001',
        lease_mileage_allowance: 45000,
        end_date: '2027-01-01',
        excess_mileage_fee: 0.25,
      };

      const mockMileageAnalysis = {
        mileage_allowance: 45000,
        current_mileage: 50000,
        mileage_used: 50000,
        mileage_remaining: 0,
        mileage_overage: 5000,
        percentage_used: 111.11,
        excess_mileage_fee: 0.25,
        estimated_overage_charge: 1250.00,
      };

      mockedTenantSafeQuery
        .mockResolvedValueOnce({ rows: [mockVehicle], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [mockMileageAnalysis], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts/vehicles/vehicle-1/lease-status');

      expect(response.status).toBe(200);
      expect(response.body.alerts.length).toBeGreaterThan(0);
      const mileageAlert = response.body.alerts.find((a: any) => a.alert_type === 'mileage_100');
      expect(mileageAlert).toBeDefined();
      expect(mileageAlert.severity).toBe('critical');
      expect(mileageAlert.alert_message).toContain('5000 miles');
    });
  });

  describe('POST /api/vehicle-contracts/lease-end-inspections', () => {
    it('should create a new lease-end inspection', async () => {
      const newInspection = {
        contract_id: 'contract-1',
        vehicle_id: 'vehicle-1',
        inspection_date: '2027-01-15',
        final_odometer: 42000,
        inspector_name: 'John Doe',
        inspector_company: 'Auto Inspections Inc',
        mileage_overage: 0,
        mileage_penalty: 0,
        excess_wear_items: [
          { item: 'front bumper', description: 'minor scratch', charge: 250 },
        ],
        excess_wear_total: 250,
        missing_items: [],
        missing_items_total: 0,
        disposition: 'returned',
      };

      const mockCreatedInspection = {
        id: 'inspection-1',
        tenant_id: 'test-tenant-id',
        ...newInspection,
        total_charges: 250,
        created_at: new Date().toISOString(),
      };

      mockedTenantSafeQuery.mockResolvedValueOnce({
        rows: [mockCreatedInspection],
        rowCount: 1,
      } as any);

      const response = await request(app)
        .post('/api/vehicle-contracts/lease-end-inspections')
        .send(newInspection);

      expect(response.status).toBe(201);
      expect(response.body.total_charges).toBe(250);
      expect(response.body.disposition).toBe('returned');
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidInspection = {
        contract_id: 'contract-1',
        // Missing vehicle_id, inspection_date, final_odometer
      };

      const response = await request(app)
        .post('/api/vehicle-contracts/lease-end-inspections')
        .send(invalidInspection);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should calculate total charges correctly', async () => {
      const inspectionWithCharges = {
        contract_id: 'contract-1',
        vehicle_id: 'vehicle-1',
        inspection_date: '2027-01-15',
        final_odometer: 50000,
        mileage_overage: 5000,
        mileage_penalty: 1250.00,
        excess_wear_items: [
          { item: 'front bumper', description: 'scratch', charge: 250 },
          { item: 'door dent', description: 'small dent', charge: 150 },
        ],
        excess_wear_total: 400,
        missing_items: [
          { item: 'spare tire', description: 'missing', charge: 150 },
        ],
        missing_items_total: 150,
      };

      const expectedTotalCharges = 1250 + 400 + 150; // 1800

      const mockCreatedInspection = {
        id: 'inspection-1',
        ...inspectionWithCharges,
        total_charges: expectedTotalCharges,
      };

      mockedTenantSafeQuery.mockResolvedValueOnce({
        rows: [mockCreatedInspection],
        rowCount: 1,
      } as any);

      const response = await request(app)
        .post('/api/vehicle-contracts/lease-end-inspections')
        .send(inspectionWithCharges);

      expect(response.status).toBe(201);
      expect(response.body.total_charges).toBe(1800);
    });
  });

  describe('GET /api/vehicle-contracts/lease-end-inspections/:id', () => {
    it('should return a specific inspection by ID', async () => {
      const mockInspection = {
        id: 'inspection-1',
        contract_id: 'contract-1',
        contract_number: 'LEASE-2024-001',
        vehicle_id: 'vehicle-1',
        vehicle_number: 'V-1001',
        inspection_date: '2027-01-15',
        total_charges: 250,
        vendor_name: 'Acme Leasing',
      };

      mockedTenantSafeQuery.mockResolvedValueOnce({
        rows: [mockInspection],
        rowCount: 1,
      } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts/lease-end-inspections/inspection-1');

      expect(response.status).toBe(200);
      expect(response.body.contract_number).toBe('LEASE-2024-001');
      expect(response.body.total_charges).toBe(250);
    });

    it('should return 404 if inspection not found', async () => {
      mockedTenantSafeQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await request(app)
        .get('/api/vehicle-contracts/lease-end-inspections/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Lease-end inspection not found');
    });
  });
});
