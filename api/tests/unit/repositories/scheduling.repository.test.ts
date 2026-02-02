/**
 * SchedulingRepository Tests
 * B3: Agent 31 - Test suite for scheduling repository
 */

import { Pool } from 'pg';
import { SchedulingRepository } from '../../../src/repositories/scheduling.repository';

describe('SchedulingRepository', () => {
  let pool: Pool;
  let repository: SchedulingRepository;
  const mockTenantId = 1;
  const mockUserId = 100;

  beforeEach(() => {
    pool = {
      query: jest.fn()
    } as any;
    repository = new SchedulingRepository(pool);
  });

  describe('findReservations', () => {
    it('should find reservations with all filters', async () => {
      const mockRows = [
        { id: 1, vehicle_id: 10, reserved_by: 100, status: 'confirmed' }
      ];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      const filters = {
        vehicleId: '10',
        status: 'confirmed',
        driverId: '5',
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      };

      const result = await repository.findReservations(mockTenantId, filters);

      expect(result).toEqual(mockRows);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE vr.tenant_id = '),
        expect.arrayContaining([mockTenantId, '10', 'confirmed', '5', '2025-01-01', '2025-01-31'])
      );
    });

    it('should use parameterized queries with tenant_id filter', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await repository.findReservations(mockTenantId);

      const call = (pool.query as jest.Mock).mock.calls[0];
      expect(call[0]).toContain('WHERE vr.tenant_id = ');
      expect(call[1][0]).toBe(mockTenantId);
    });
  });

  describe('updateReservation', () => {
    it('should update reservation with allowed fields only', async () => {
      const mockRow = { id: 1, status: 'confirmed' };
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

      const updates = {
        status: 'confirmed',
        notes: 'Updated notes',
        invalid_field: 'should be ignored'
      };

      const result = await repository.updateReservation(mockTenantId, '1', updates);

      expect(result).toEqual(mockRow);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE tenant_id =  AND id = '),
        expect.arrayContaining([mockTenantId, '1'])
      );
    });

    it('should return null if no fields to update', async () => {
      const result = await repository.updateReservation(mockTenantId, '1', {});
      expect(result).toBeNull();
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('cancelReservation', () => {
    it('should cancel reservation with parameterized query', async () => {
      const mockRow = { id: 1, status: 'cancelled' };
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

      const result = await repository.cancelReservation(mockTenantId, '1');

      expect(result).toEqual(mockRow);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE tenant_id =  AND id = '),
        ['cancelled', mockTenantId, '1']
      );
    });

    it('should return null if reservation not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repository.cancelReservation(mockTenantId, '999');
      expect(result).toBeNull();
    });
  });

  describe('approveReservation', () => {
    it('should approve reservation with correct parameters', async () => {
      const mockRow = { id: 1, approval_status: 'approved' };
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

      const result = await repository.approveReservation(mockTenantId, '1', mockUserId);

      expect(result).toEqual(mockRow);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE tenant_id =  AND id = '),
        ['approved', mockUserId, 'confirmed', mockTenantId, '1']
      );
    });
  });

  describe('rejectReservation', () => {
    it('should reject reservation with reason', async () => {
      const mockRow = { id: 1, approval_status: 'rejected' };
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

      const reason = 'Vehicle unavailable';
      const result = await repository.rejectReservation(mockTenantId, '1', mockUserId, reason);

      expect(result).toEqual(mockRow);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE tenant_id =  AND id = '),
        ['rejected', mockUserId, reason, 'cancelled', mockTenantId, '1']
      );
    });
  });

  describe('findMaintenanceAppointments', () => {
    it('should find maintenance appointments with filters', async () => {
      const mockRows = [{ id: 1, vehicle_id: 10 }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      const filters = {
        vehicleId: '10',
        technicianId: '5',
        serviceBayId: '2',
        status: 'scheduled',
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      };

      const result = await repository.findMaintenanceAppointments(mockTenantId, filters);

      expect(result).toEqual(mockRows);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE sbs.tenant_id = '),
        expect.arrayContaining([mockTenantId])
      );
    });
  });

  describe('findCalendarIntegrations', () => {
    it('should find calendar integrations for user', async () => {
      const mockRows = [{ id: 1, provider: 'google' }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      const result = await repository.findCalendarIntegrations(mockUserId);

      expect(result).toEqual(mockRows);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = '),
        [mockUserId]
      );
    });
  });

  describe('getIntegrationProvider', () => {
    it('should get integration provider', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ provider: 'google' }] });

      const result = await repository.getIntegrationProvider(mockUserId, '1');

      expect(result).toBe('google');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id =  AND user_id = '),
        ['1', mockUserId]
      );
    });

    it('should return null if integration not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repository.getIntegrationProvider(mockUserId, '999');
      expect(result).toBeNull();
    });
  });

  describe('deleteCalendarIntegration', () => {
    it('should delete calendar integration', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await repository.deleteCalendarIntegration('1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM calendar_integrations WHERE id = '),
        ['1']
      );
    });
  });

  describe('updateLastSyncTime', () => {
    it('should update last sync time', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await repository.updateLastSyncTime('1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE calendar_integrations SET last_sync_at = NOW()'),
        ['1']
      );
    });
  });

  describe('findAppointmentTypes', () => {
    it('should find appointment types for tenant', async () => {
      const mockRows = [{ id: 1, name: 'Oil Change' }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      const result = await repository.findAppointmentTypes(mockTenantId);

      expect(result).toEqual(mockRows);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE tenant_id =  AND is_active = true'),
        [mockTenantId]
      );
    });
  });

  describe('Security Tests - Parameterized Queries', () => {
    it('should always use parameterized queries with , , etc.', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await repository.findReservations(mockTenantId, { vehicleId: '10' });
      await repository.cancelReservation(mockTenantId, '1');
      await repository.findMaintenanceAppointments(mockTenantId, { status: 'scheduled' });
      await repository.findCalendarIntegrations(mockUserId);
      await repository.findAppointmentTypes(mockTenantId);

      // Check that all queries use parameterized format
      const allCalls = (pool.query as jest.Mock).mock.calls;
      allCalls.forEach(call => {
        const query = call[0];
        const params = call[1];
        
        // Should contain $ placeholders
        expect(query).toMatch(/\$\d+/);
        
        // Should not have string concatenation in WHERE clauses
        expect(query).not.toContain(WHERE id = ");
        expect(query).not.toContain("WHERE tenant_id = );
        
        // Should have parameters array
        expect(Array.isArray(params)).toBe(true);
      });
    });

    it('should always filter by tenant_id in multi-tenant queries', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await repository.findReservations(mockTenantId);
      await repository.updateReservation(mockTenantId, '1', { status: 'confirmed' });
      await repository.findMaintenanceAppointments(mockTenantId);
      await repository.findAppointmentTypes(mockTenantId);

      const allCalls = (pool.query as jest.Mock).mock.calls;
      allCalls.forEach(call => {
        const query = call[0];
        const params = call[1];
        
        // Multi-tenant queries should have tenant_id filter
        if (query.includes('vehicle_reservations') || 
            query.includes('service_bay_schedules') || 
            query.includes('appointment_types')) {
          expect(query).toContain('tenant_id');
          expect(params).toContain(mockTenantId);
        }
      });
    });
  });
});
