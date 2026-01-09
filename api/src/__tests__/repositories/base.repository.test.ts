import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { pool } from '../../db';
import { BaseRepository } from '../../repositories/base.repository';

// Mock the database pool
vi.mock('../../db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

// Test implementation of BaseRepository
class TestRepository extends BaseRepository<{ id: number; name: string; tenant_id: number }> {
  constructor() {
    super('test_table');
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  const mockTenantId = 1;

  beforeEach(() => {
    repository = new TestRepository();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('findById', () => {
    it('should find a record by ID and tenant ID', async () => {
      const mockRecord = { id: 1, name: 'Test', tenant_id: mockTenantId };
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [mockRecord],
        rowCount: 1,
      });

      const result = await repository.findById(1, mockTenantId);

      expect(result).toEqual(mockRecord);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE id = $1 AND tenant_id = $2',
        [1, mockTenantId]
      );
    });

    it('should return null if no record is found', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.findById(999, mockTenantId);

      expect(result).toBeNull();
    });

    it('should enforce tenant isolation', async () => {
      const differentTenantId = 2;
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await repository.findById(1, differentTenantId);

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [1, differentTenantId]
      );
    });
  });

  describe('findAll', () => {
    it('should find all records for a tenant', async () => {
      const mockRecords = [
        { id: 1, name: 'Test1', tenant_id: mockTenantId },
        { id: 2, name: 'Test2', tenant_id: mockTenantId },
      ];
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: mockRecords,
        rowCount: 2,
      });

      const result = await repository.findAll(mockTenantId);

      expect(result).toEqual(mockRecords);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE tenant_id = $1',
        [mockTenantId]
      );
    });

    it('should return empty array if no records exist', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.findAll(mockTenantId);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const newData = { name: 'New Test' };
      const mockCreatedRecord = { id: 1, ...newData, tenant_id: mockTenantId };
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [mockCreatedRecord],
        rowCount: 1,
      });

      const result = await repository.create(newData, mockTenantId);

      expect(result).toEqual(mockCreatedRecord);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO test_table'),
        expect.arrayContaining(['New Test', mockTenantId])
      );
    });

    it('should include tenant ID in created record', async () => {
      const newData = { name: 'Test' };
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [{ id: 1, name: 'Test', tenant_id: mockTenantId }],
        rowCount: 1,
      });

      await repository.create(newData, mockTenantId);

      const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[1]).toContain(mockTenantId);
    });
  });

  describe('update', () => {
    it('should update an existing record', async () => {
      const updateData = { name: 'Updated Test' };
      const mockUpdatedRecord = { id: 1, ...updateData, tenant_id: mockTenantId };
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [mockUpdatedRecord],
        rowCount: 1,
      });

      const result = await repository.update(1, updateData, mockTenantId);

      expect(result).toEqual(mockUpdatedRecord);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE test_table'),
        expect.arrayContaining(['Updated Test', 1, mockTenantId])
      );
    });

    it('should return null if record not found', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.update(999, { name: 'Test' }, mockTenantId);

      expect(result).toBeNull();
    });

    it('should enforce tenant isolation on update', async () => {
      const differentTenantId = 2;
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await repository.update(1, { name: 'Test' }, differentTenantId);

      const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[1]).toContain(differentTenantId);
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [],
        rowCount: 1,
      });

      const result = await repository.delete(1, mockTenantId);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM test_table WHERE id = $1 AND tenant_id = $2',
        [1, mockTenantId]
      );
    });

    it('should return false if record not found', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.delete(999, mockTenantId);

      expect(result).toBe(false);
    });

    it('should enforce tenant isolation on delete', async () => {
      const differentTenantId = 2;
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await repository.delete(1, differentTenantId);

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [1, differentTenantId]
      );
    });
  });

  describe('Security - SQL Injection Prevention', () => {
    it('should use parameterized queries for findById', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.findById(1, mockTenantId);

      const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('$1');
      expect(call[0]).toContain('$2');
      expect(call[1]).toEqual([1, mockTenantId]);
    });

    it('should use parameterized queries for create', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [{ id: 1, name: 'Test', tenant_id: mockTenantId }],
        rowCount: 1,
      });

      await repository.create({ name: 'Test' }, mockTenantId);

      const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('$');
      expect(Array.isArray(call[1])).toBe(true);
    });

    it('should use parameterized queries for update', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [{ id: 1, name: 'Updated', tenant_id: mockTenantId }],
        rowCount: 1,
      });

      await repository.update(1, { name: 'Updated' }, mockTenantId);

      const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('$');
      expect(Array.isArray(call[1])).toBe(true);
    });

    it('should use parameterized queries for delete', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [], rowCount: 1 });

      await repository.delete(1, mockTenantId);

      const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('$1');
      expect(call[0]).toContain('$2');
      expect(call[1]).toEqual([1, mockTenantId]);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should never return data from different tenants in findById', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.findById(1, 1);

      const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('tenant_id = $2');
    });

    it('should never return data from different tenants in findAll', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.findAll(1);

      const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('tenant_id = $1');
    });

    it('should include tenant_id in all WHERE clauses', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.findById(1, mockTenantId);
      await repository.delete(1, mockTenantId);

      const calls = (pool.query as ReturnType<typeof vi.fn>).mock.calls;
      calls.forEach(call => {
        expect(call[0]).toContain('tenant_id');
      });
    });
  });
});
