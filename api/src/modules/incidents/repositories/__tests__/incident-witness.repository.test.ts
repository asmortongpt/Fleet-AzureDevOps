import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IncidentWitnessRepository } from '../incident-witness.repository';
import { pool } from '../../../../db';

vi.mock('../../../../db', () => ({
  pool: {
    query: vi.fn()
  }
}));

describe('IncidentWitnessRepository', () => {
  let repository: IncidentWitnessRepository;

  beforeEach(() => {
    repository = new IncidentWitnessRepository();
    vi.clearAllMocks();
  });

  describe('findByIncidentId', () => {
    it('should return all witnesses for an incident', async () => {
      const mockWitnesses = [
        {
          id: 1,
          incident_id: 1,
          witness_name: 'John Witness',
          contact_info: 'john@example.com',
          statement: 'I saw everything'
        }
      ];

      (pool.query as any).mockResolvedValue({ rows: mockWitnesses });

      const result = await repository.findByIncidentId('1');

      expect(result).toEqual(mockWitnesses);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE incident_id = $1'),
        ['1']
      );
    });
  });

  describe('create', () => {
    it('should create a new witness record', async () => {
      const mockWitness = { id: 1, witness_name: 'Jane Witness' };
      const createData = {
        incident_id: 1,
        witness_name: 'Jane Witness',
        contact_info: 'jane@example.com',
        statement: 'I heard the crash'
      };

      (pool.query as any).mockResolvedValue({ rows: [mockWitness] });

      const result = await repository.create(createData);

      expect(result).toEqual(mockWitness);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO incident_witnesses'),
        [
          createData.incident_id,
          createData.witness_name,
          createData.contact_info,
          createData.statement
        ]
      );
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple witness records', async () => {
      const mockWitnesses = [
        { id: 1, witness_name: 'Witness 1' },
        { id: 2, witness_name: 'Witness 2' }
      ];

      const createData = [
        {
          incident_id: 1,
          witness_name: 'Witness 1',
          contact_info: 'w1@example.com'
        },
        {
          incident_id: 1,
          witness_name: 'Witness 2',
          contact_info: 'w2@example.com'
        }
      ];

      (pool.query as any).mockResolvedValue({ rows: mockWitnesses });

      const result = await repository.bulkCreate(createData);

      expect(result).toEqual(mockWitnesses);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO incident_witnesses'),
        expect.any(Array)
      );
    });

    it('should return empty array if no witnesses to create', async () => {
      const result = await repository.bulkCreate([]);

      expect(result).toEqual([]);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('deleteById', () => {
    it('should delete witness by ID', async () => {
      (pool.query as any).mockResolvedValue({ rowCount: 1 });

      const result = await repository.deleteById(1);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM incident_witnesses WHERE id'),
        [1]
      );
    });

    it('should return false if witness not found', async () => {
      (pool.query as any).mockResolvedValue({ rowCount: 0 });

      const result = await repository.deleteById(999);

      expect(result).toBe(false);
    });
  });

  describe('deleteByIncidentId', () => {
    it('should delete all witnesses for an incident', async () => {
      (pool.query as any).mockResolvedValue({ rowCount: 3 });

      const result = await repository.deleteByIncidentId('1');

      expect(result).toBe(3);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM incident_witnesses WHERE incident_id'),
        ['1']
      );
    });
  });

  describe('update', () => {
    it('should update witness information', async () => {
      const mockWitness = { id: 1, witness_name: 'Updated Witness' };
      const updates = {
        witness_name: 'Updated Witness',
        contact_info: 'updated@example.com'
      };

      (pool.query as any).mockResolvedValue({ rows: [mockWitness] });

      const result = await repository.update(1, updates);

      expect(result).toEqual(mockWitness);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE incident_witnesses'),
        expect.any(Array)
      );
    });

    it('should throw error if no fields to update', async () => {
      await expect(repository.update(1, {})).rejects.toThrow('No fields to update');
    });

    it('should return null if witness not found', async () => {
      (pool.query as any).mockResolvedValue({ rows: [] });

      const result = await repository.update(999, { witness_name: 'Test' });

      expect(result).toBeNull();
    });
  });
});
