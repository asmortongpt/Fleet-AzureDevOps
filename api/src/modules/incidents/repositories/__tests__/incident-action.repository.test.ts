import { describe, it, expect, beforeEach, vi } from 'vitest';

import { pool } from '../../../../db';
import { IncidentActionRepository } from '../incident-action.repository';

vi.mock('../../../../db', () => ({
  pool: {
    query: vi.fn()
  }
}));

describe('IncidentActionRepository', () => {
  let repository: IncidentActionRepository;

  beforeEach(() => {
    repository = new IncidentActionRepository();
    vi.clearAllMocks();
  });

  describe('findByIncidentId', () => {
    it('should return all actions for an incident', async () => {
      const mockActions = [
        {
          id: 1,
          incident_id: 1,
          action_type: 'corrective',
          action_description: 'Fix issue',
          status: 'pending'
        }
      ];

      (pool.query as any).mockResolvedValue({ rows: mockActions });

      const result = await repository.findByIncidentId('1');

      expect(result).toEqual(mockActions);
    });
  });

  describe('create', () => {
    it('should create a new corrective action', async () => {
      const mockAction = { id: 1, action_description: 'New Action' };
      const createData = {
        incident_id: 1,
        action_type: 'corrective',
        action_description: 'New Action',
        assigned_to: 1,
        due_date: new Date(),
        created_by: 1
      };

      (pool.query as any).mockResolvedValue({ rows: [mockAction] });

      const result = await repository.create(createData);

      expect(result).toEqual(mockAction);
    });
  });

  describe('update', () => {
    it('should update an action', async () => {
      const mockAction = { id: 1, status: 'in_progress' };
      (pool.query as any).mockResolvedValue({ rows: [mockAction] });

      const result = await repository.update(1, { status: 'in_progress' });

      expect(result).toEqual(mockAction);
    });

    it('should throw error if no fields to update', async () => {
      await expect(repository.update(1, {})).rejects.toThrow('No fields to update');
    });
  });

  describe('complete', () => {
    it('should mark action as complete', async () => {
      const mockAction = { id: 1, status: 'completed' };
      (pool.query as any).mockResolvedValue({ rows: [mockAction] });

      const result = await repository.complete(1, 'Action completed successfully');

      expect(result).toEqual(mockAction);
    });
  });

  describe('deleteById', () => {
    it('should delete action by ID', async () => {
      (pool.query as any).mockResolvedValue({ rowCount: 1 });

      const result = await repository.deleteById(1);

      expect(result).toBe(true);
    });
  });

  describe('findByStatus', () => {
    it('should return actions by status', async () => {
      const mockActions = [{ id: 1, status: 'pending' }];
      (pool.query as any).mockResolvedValue({ rows: mockActions });

      const result = await repository.findByStatus('pending', 1);

      expect(result).toEqual(mockActions);
    });
  });

  describe('findOverdue', () => {
    it('should return overdue actions', async () => {
      const mockActions = [{ id: 1, due_date: '2024-01-01' }];
      (pool.query as any).mockResolvedValue({ rows: mockActions });

      const result = await repository.findOverdue(1);

      expect(result).toEqual(mockActions);
    });
  });

  describe('findByAssignee', () => {
    it('should return actions assigned to a user', async () => {
      const mockActions = [{ id: 1, assigned_to: 1 }];
      (pool.query as any).mockResolvedValue({ rows: mockActions });

      const result = await repository.findByAssignee(1, 1);

      expect(result).toEqual(mockActions);
    });
  });
});
