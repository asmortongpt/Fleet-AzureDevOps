import * as fs from 'fs';
import * as path from 'path';

/**
 * Automated Test Generator for Repository Files
 * Generates comprehensive unit tests for all repository classes
 */

const REPOSITORIES_DIR = path.join(__dirname, '../repositories');
const TESTS_DIR = path.join(__dirname, '../__tests__/repositories');

interface RepositoryInfo {
  name: string;
  fileName: string;
  className: string;
  tableName: string;
}

/**
 * Generate test file content for a repository
 */
function generateTestContent(repo: RepositoryInfo): string {
  const className = repo.className;
  const fileName = repo.fileName.replace('.ts', '');

  return `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { pool } from '../../db';
import { ${className} } from '../../repositories/${fileName}';

// Mock the database pool
vi.mock('../../db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('${className}', () => {
  let repository: ${className};
  const mockTenantId = 1;

  beforeEach(() => {
    repository = new ${className}();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('CRUD Operations', () => {
    describe('findById', () => {
      it('should find a record by ID and tenant ID', async () => {
        const mockRecord = { id: 1, tenant_id: mockTenantId };
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
          rows: [mockRecord],
          rowCount: 1,
        });

        const result = await repository.findById(1, mockTenantId);

        expect(result).toEqual(mockRecord);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT'),
          expect.arrayContaining([1, mockTenantId])
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
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
          rows: [],
          rowCount: 0,
        });

        await repository.findById(1, mockTenantId);

        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('tenant_id'),
          expect.arrayContaining([1, mockTenantId])
        );
      });
    });

    describe('findAll', () => {
      it('should find all records for a tenant', async () => {
        const mockRecords = [
          { id: 1, tenant_id: mockTenantId },
          { id: 2, tenant_id: mockTenantId },
        ];
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
          rows: mockRecords,
          rowCount: 2,
        });

        const result = await repository.findAll(mockTenantId);

        expect(result).toEqual(mockRecords);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT'),
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

      it('should enforce tenant isolation', async () => {
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
          rows: [],
          rowCount: 0,
        });

        await repository.findAll(mockTenantId);

        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('tenant_id'),
          [mockTenantId]
        );
      });
    });

    describe('create', () => {
      it('should create a new record', async () => {
        const newData = { name: 'Test' };
        const mockCreatedRecord = { id: 1, ...newData, tenant_id: mockTenantId };
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
          rows: [mockCreatedRecord],
          rowCount: 1,
        });

        const result = await repository.create(newData, mockTenantId);

        expect(result).toEqual(mockCreatedRecord);
        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO'),
          expect.any(Array)
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

      it('should use parameterized queries', async () => {
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
          rows: [{ id: 1, name: 'Test', tenant_id: mockTenantId }],
          rowCount: 1,
        });

        await repository.create({ name: 'Test' }, mockTenantId);

        const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[0]).toContain('$');
        expect(Array.isArray(call[1])).toBe(true);
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
          expect.stringContaining('UPDATE'),
          expect.any(Array)
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
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
          rows: [],
          rowCount: 0,
        });

        await repository.update(1, { name: 'Test' }, mockTenantId);

        const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[1]).toContain(mockTenantId);
      });

      it('should use parameterized queries', async () => {
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
          rows: [{ id: 1, name: 'Updated', tenant_id: mockTenantId }],
          rowCount: 1,
        });

        await repository.update(1, { name: 'Updated' }, mockTenantId);

        const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[0]).toContain('$');
        expect(Array.isArray(call[1])).toBe(true);
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
          expect.stringContaining('DELETE FROM'),
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
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({
          rows: [],
          rowCount: 0,
        });

        await repository.delete(1, mockTenantId);

        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining('tenant_id'),
          [1, mockTenantId]
        );
      });

      it('should use parameterized queries', async () => {
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [], rowCount: 1 });

        await repository.delete(1, mockTenantId);

        const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[0]).toContain('$1');
        expect(call[0]).toContain('$2');
        expect(call[1]).toEqual([1, mockTenantId]);
      });
    });
  });

  describe('Security - SQL Injection Prevention', () => {
    it('should use parameterized queries in all operations', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.findById(1, mockTenantId);
      await repository.findAll(mockTenantId);

      const calls = (pool.query as ReturnType<typeof vi.fn>).mock.calls;
      calls.forEach(call => {
        expect(call[0]).toContain('$');
        expect(Array.isArray(call[1])).toBe(true);
      });
    });

    it('should never concatenate user input in SQL', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [], rowCount: 0 });

      const maliciousInput = "1; DROP TABLE users--";
      await repository.findById(maliciousInput as any, mockTenantId);

      const call = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
      // Should use parameterized query, not concatenation
      expect(call[1]).toContain(maliciousInput);
      expect(call[0]).not.toContain(maliciousInput);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should include tenant_id in all WHERE clauses', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.findById(1, mockTenantId);
      await repository.findAll(mockTenantId);
      await repository.delete(1, mockTenantId);

      const calls = (pool.query as ReturnType<typeof vi.fn>).mock.calls;
      calls.forEach(call => {
        expect(call[0]).toContain('tenant_id');
      });
    });

    it('should never leak data across tenants', async () => {
      const tenant1Id = 1;
      const tenant2Id = 2;

      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [], rowCount: 0 });

      await repository.findById(1, tenant1Id);
      await repository.findById(1, tenant2Id);

      const calls = (pool.query as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls[0][1]).toContain(tenant1Id);
      expect(calls[1][1]).toContain(tenant2Id);
    });
  });
});
`;
}

/**
 * Extract class name from repository file
 */
function extractClassName(content: string, fileName: string): string {
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  if (classMatch) {
    return classMatch[1];
  }

  // Fallback: generate from filename
  const baseName = fileName.replace('.repository.ts', '').replace('.ts', '');
  return baseName
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') + 'Repository';
}

/**
 * Extract table name from repository file
 */
function extractTableName(content: string): string {
  const tableMatch = content.match(/super\(['"](.+?)['"]\)/);
  return tableMatch ? tableMatch[1] : 'unknown_table';
}

/**
 * Scan repositories directory and generate tests
 */
async function generateTests() {
  console.log('🔍 Scanning repositories directory...');

  if (!fs.existsSync(TESTS_DIR)) {
    fs.mkdirSync(TESTS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(REPOSITORIES_DIR)
    .filter(f => f.endsWith('.repository.ts') && f !== 'base.repository.ts');

  console.log(`📁 Found ${files.length} repository files`);

  let generated = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(REPOSITORIES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const className = extractClassName(content, file);
    const tableName = extractTableName(content);

    const testFileName = file.replace('.ts', '.test.ts');
    const testFilePath = path.join(TESTS_DIR, testFileName);

    // Skip if test already exists
    if (fs.existsSync(testFilePath)) {
      console.log(`⏭️  Skipping ${testFileName} (already exists)`);
      skipped++;
      continue;
    }

    const repoInfo: RepositoryInfo = {
      name: file.replace('.ts', ''),
      fileName: file,
      className,
      tableName,
    };

    const testContent = generateTestContent(repoInfo);
    fs.writeFileSync(testFilePath, testContent);

    console.log(`✅ Generated ${testFileName}`);
    generated++;
  }

  console.log('\n📊 Generation Summary:');
  console.log(`   ✅ Generated: ${generated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📝 Total: ${files.length}`);
  console.log('\n✨ Test generation complete!');
}

// Run the generator
generateTests().catch(console.error);
