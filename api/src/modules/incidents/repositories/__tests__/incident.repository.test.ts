import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IncidentRepository } from '../incident.repository';
import { pool } from '../../../../db';

vi.mock('../../../../db', () => ({
  pool: {
    query: vi.fn()
  }
}));

describe('IncidentRepository', () => {
  let repository: IncidentRepository;
  const mockTenantId = 1;
  const mockUserId = 1;

  beforeEach(() => {
    repository = new IncidentRepository();
    vi.clearAllMocks();
  });

  describe('findAllWithDetails', () => {
    it('should return all incidents with filters and details', async () => {
      const mockIncidents = [
        {
          id: 1,
          incident_title: 'Test Incident',
          severity: 'high',
          status: 'open',
          reported_by_name: 'John Doe',
          action_count: 2,
          photo_count: 1
        }
      ];

      (pool.query as any).mockResolvedValue({ rows: mockIncidents });

      const filters = {
        status: 'open',
        severity: 'high'
      };

      const result = await repository.findAllWithDetails(filters, mockTenantId);

      expect(result).toEqual(mockIncidents);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([mockTenantId])
      );
    });

    it('should handle empty filters', async () => {
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await repository.findAllWithDetails({}, mockTenantId);

      expect(result).toEqual([]);
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('findByIdWithDetails', () => {
    it('should return incident with details by ID', async () => {
      const mockIncident = {
        id: 1,
        incident_title: 'Test Incident',
        reported_by_name: 'John Doe'
      };

      (pool.query as any).mockResolvedValue({ rows: [mockIncident] });

      const result = await repository.findByIdWithDetails('1', mockTenantId);

      expect(result).toEqual(mockIncident);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE i.id = $1 AND i.tenant_id = $2'),
        ['1', mockTenantId]
      );
    });

    it('should return null if incident not found', async () => {
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await repository.findByIdWithDetails('999', mockTenantId);

      expect(result).toBeNull();
    });
  });

  describe('createIncident', () => {
    it('should create a new incident', async () => {
      const mockIncident = { id: 1, incident_title: 'New Incident' };
      const createData = {
        tenant_id: mockTenantId,
        incident_title: 'New Incident',
        incident_type: 'accident',
        severity: 'medium',
        incident_date: '2025-01-01',
        incident_time: '10:00',
        location: 'Test Location',
        description: 'Test Description',
        reported_by: mockUserId
      };

      (pool.query as any).mockResolvedValue({ rows: [mockIncident] });

      const result = await repository.createIncident(createData);

      expect(result).toEqual(mockIncident);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO incidents'),
        expect.any(Array)
      );
    });
  });

  describe('updateIncident', () => {
    it('should update an incident', async () => {
      const mockIncident = { id: 1, incident_title: 'Updated Incident' };
      const updates = {
        incident_title: 'Updated Incident',
        severity: 'high'
      };

      (pool.query as any).mockResolvedValue({ rows: [mockIncident] });

      const result = await repository.updateIncident('1', mockTenantId, updates);

      expect(result).toEqual(mockIncident);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE incidents'),
        expect.any(Array)
      );
    });

    it('should throw error if no fields to update', async () => {
      await expect(
        repository.updateIncident('1', mockTenantId, {})
      ).rejects.toThrow('No fields to update');
    });

    it('should return null if incident not found', async () => {
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await repository.updateIncident('999', mockTenantId, {
        severity: 'high'
      });

      expect(result).toBeNull();
    });
  });

  describe('closeIncident', () => {
    it('should close an incident', async () => {
      const mockIncident = { id: 1, status: 'closed' };
      const closeData = {
        resolution_notes: 'Resolved',
        root_cause: 'Equipment failure',
        preventive_measures: 'Regular maintenance',
        closed_by: mockUserId
      };

      (pool.query as any).mockResolvedValue({ rows: [mockIncident] });

      const result = await repository.closeIncident('1', mockTenantId, closeData);

      expect(result).toEqual(mockIncident);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE incidents'),
        expect.arrayContaining([
          closeData.resolution_notes,
          closeData.root_cause,
          closeData.preventive_measures,
          closeData.closed_by,
          '1',
          mockTenantId
        ])
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return incident analytics', async () => {
      const mockStatusCounts = { rows: [{ status: 'open', count: 5 }] };
      const mockSeverityCounts = { rows: [{ severity: 'high', count: 3 }] };
      const mockTypeCounts = { rows: [{ incident_type: 'accident', count: 4 }] };
      const mockMonthlyTrend = { rows: [{ month: new Date(), count: 10 }] };

      (pool.query as any)
        .mockResolvedValueOnce(mockStatusCounts)
        .mockResolvedValueOnce(mockSeverityCounts)
        .mockResolvedValueOnce(mockTypeCounts)
        .mockResolvedValueOnce(mockMonthlyTrend);

      const result = await repository.getAnalytics(mockTenantId);

      expect(result).toHaveProperty('by_status');
      expect(result).toHaveProperty('by_severity');
      expect(result).toHaveProperty('by_type');
      expect(result).toHaveProperty('monthly_trend');
      expect(pool.query).toHaveBeenCalledTimes(4);
    });
  });

  describe('findByType', () => {
    it('should return incidents by type', async () => {
      const mockIncidents = [{ id: 1, incident_type: 'accident' }];
      (pool.query as any).mockResolvedValue({ rows: mockIncidents });

      const result = await repository.findByType('accident', mockTenantId);

      expect(result).toEqual(mockIncidents);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE incident_type = $1'),
        ['accident', mockTenantId]
      );
    });
  });

  describe('findBySeverity', () => {
    it('should return incidents by severity', async () => {
      const mockIncidents = [{ id: 1, severity: 'critical' }];
      (pool.query as any).mockResolvedValue({ rows: mockIncidents });

      const result = await repository.findBySeverity('critical', mockTenantId);

      expect(result).toEqual(mockIncidents);
    });
  });

  describe('findByStatus', () => {
    it('should return incidents by status', async () => {
      const mockIncidents = [{ id: 1, status: 'closed' }];
      (pool.query as any).mockResolvedValue({ rows: mockIncidents });

      const result = await repository.findByStatus('closed', mockTenantId);

      expect(result).toEqual(mockIncidents);
    });
  });

  describe('findByVehicle', () => {
    it('should return incidents by vehicle', async () => {
      const mockIncidents = [{ id: 1, vehicle_id: 'V-001' }];
      (pool.query as any).mockResolvedValue({ rows: mockIncidents });

      const result = await repository.findByVehicle('V-001', mockTenantId);

      expect(result).toEqual(mockIncidents);
    });
  });

  describe('findByDriver', () => {
    it('should return incidents by driver', async () => {
      const mockIncidents = [{ id: 1, driver_id: 'D-001' }];
      (pool.query as any).mockResolvedValue({ rows: mockIncidents });

      const result = await repository.findByDriver('D-001', mockTenantId);

      expect(result).toEqual(mockIncidents);
    });
  });

  describe('findByDateRange', () => {
    it('should return incidents within date range', async () => {
      const mockIncidents = [{ id: 1, incident_date: '2025-01-01' }];
      (pool.query as any).mockResolvedValue({ rows: mockIncidents });

      const result = await repository.findByDateRange(
        '2025-01-01',
        '2025-12-31',
        mockTenantId
      );

      expect(result).toEqual(mockIncidents);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('BETWEEN'),
        ['2025-01-01', '2025-12-31', mockTenantId]
      );
    });
  });
});
