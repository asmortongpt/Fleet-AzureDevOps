import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IncidentTimelineRepository } from '../incident-timeline.repository';
import { pool } from '../../../../db';

vi.mock('../../../../db', () => ({
  pool: {
    query: vi.fn()
  }
}));

describe('IncidentTimelineRepository', () => {
  let repository: IncidentTimelineRepository;

  beforeEach(() => {
    repository = new IncidentTimelineRepository();
    vi.clearAllMocks();
  });

  describe('findByIncidentId', () => {
    it('should return all timeline entries for an incident', async () => {
      const mockTimeline = [
        {
          id: 1,
          incident_id: 1,
          event_type: 'created',
          description: 'Incident reported',
          performed_by: 1
        }
      ];

      (pool.query as any).mockResolvedValue({ rows: mockTimeline });

      const result = await repository.findByIncidentId('1');

      expect(result).toEqual(mockTimeline);
    });
  });

  describe('create', () => {
    it('should create a new timeline entry', async () => {
      const mockEntry = { id: 1, event_type: 'created' };
      const createData = {
        incident_id: 1,
        event_type: 'created',
        description: 'Incident reported',
        performed_by: 1
      };

      (pool.query as any).mockResolvedValue({ rows: [mockEntry] });

      const result = await repository.create(createData);

      expect(result).toEqual(mockEntry);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple timeline entries', async () => {
      const mockEntries = [
        { id: 1, event_type: 'created' },
        { id: 2, event_type: 'updated' }
      ];

      const createData = [
        {
          incident_id: 1,
          event_type: 'created',
          description: 'Created',
          performed_by: 1
        },
        {
          incident_id: 1,
          event_type: 'updated',
          description: 'Updated',
          performed_by: 1
        }
      ];

      (pool.query as any).mockResolvedValue({ rows: mockEntries });

      const result = await repository.bulkCreate(createData);

      expect(result).toEqual(mockEntries);
    });

    it('should return empty array if no entries to create', async () => {
      const result = await repository.bulkCreate([]);

      expect(result).toEqual([]);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('deleteById', () => {
    it('should delete timeline entry by ID', async () => {
      (pool.query as any).mockResolvedValue({ rowCount: 1 });

      const result = await repository.deleteById(1);

      expect(result).toBe(true);
    });
  });

  describe('deleteByIncidentId', () => {
    it('should delete all timeline entries for an incident', async () => {
      (pool.query as any).mockResolvedValue({ rowCount: 5 });

      const result = await repository.deleteByIncidentId('1');

      expect(result).toBe(5);
    });
  });

  describe('findByIncidentIdWithUserDetails', () => {
    it('should return timeline with user details', async () => {
      const mockTimeline = [
        {
          id: 1,
          incident_id: 1,
          event_type: 'created',
          performed_by_name: 'John Doe',
          performed_by_email: 'john@example.com'
        }
      ];

      (pool.query as any).mockResolvedValue({ rows: mockTimeline });

      const result = await repository.findByIncidentIdWithUserDetails('1');

      expect(result).toEqual(mockTimeline);
    });
  });

  describe('findRecentByTenant', () => {
    it('should return recent timeline entries for a tenant', async () => {
      const mockTimeline = [
        {
          id: 1,
          incident_id: 1,
          event_type: 'created',
          incident_title: 'Test Incident'
        }
      ];

      (pool.query as any).mockResolvedValue({ rows: mockTimeline });

      const result = await repository.findRecentByTenant(1, 50);

      expect(result).toEqual(mockTimeline);
    });
  });

  describe('findByEventType', () => {
    it('should return timeline entries by event type', async () => {
      const mockTimeline = [{ id: 1, event_type: 'closed' }];
      (pool.query as any).mockResolvedValue({ rows: mockTimeline });

      const result = await repository.findByEventType('closed', 1, 100);

      expect(result).toEqual(mockTimeline);
    });
  });
});
