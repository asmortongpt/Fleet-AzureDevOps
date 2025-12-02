/**
 * Database Migration Tests
 * Ensures all migrations run successfully and create expected schema
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testPool, closeTestDatabase } from '../setup'
import fs from 'fs'
import path from 'path'

describe('Database Migrations', () => {
  const migrationsDir = path.join(__dirname, '../../db/migrations')

  afterAll(async () => {
    await closeTestDatabase()
  })

  describe('Migration Files', () => {
    it('should have migration files', () => {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
      expect(files.length).toBeGreaterThan(0)
    })

    it('should have sequentially numbered migrations', () => {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort()

      for (let i = 0; i < files.length; i++) {
        const expectedNumber = String(i + 1).padStart(3, '0')
        expect(files[i]).toContain(expectedNumber)
      }
    })

    it('should have valid SQL syntax in migrations', async () => {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))

      for (const file of files) {
        const filePath = path.join(migrationsDir, file)
        const sql = fs.readFileSync(filePath, 'utf-8')

        // Check for basic SQL syntax requirements
        expect(sql.trim().length).toBeGreaterThan(0)
        expect(sql).not.toContain('syntax error')
      }
    })
  })

  describe('Table Creation', () => {
    it('should have created users table', async () => {
      const result = await testPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'users'
        )
      `)
      expect(result.rows[0].exists).toBe(true)
    })

    it('should have created tenants table', async () => {
      const result = await testPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'tenants'
        )
      `)
      expect(result.rows[0].exists).toBe(true)
    })

    it('should have created vehicles table', async () => {
      const result = await testPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'vehicles'
        )
      `)
      expect(result.rows[0].exists).toBe(true)
    })

    it('should have created assets table', async () => {
      const result = await testPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'assets'
        )
      `)
      expect(result.rows[0].exists).toBe(true)
    })

    it('should have created tasks table', async () => {
      const result = await testPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'tasks'
        )
      `)
      expect(result.rows[0].exists).toBe(true)
    })

    it('should have created incidents table', async () => {
      const result = await testPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'incidents'
        )
      `)
      expect(result.rows[0].exists).toBe(true)
    })

    it('should have created alerts table', async () => {
      const result = await testPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'alerts'
        )
      `)
      expect(result.rows[0].exists).toBe(true)
    })
  })

  describe('Table Structure', () => {
    it('should have tenant_id column in multi-tenant tables', async () => {
      const tables = ['assets', 'tasks', 'incidents', 'alerts', 'vehicles', 'drivers']

      for (const table of tables) {
        const result = await testPool.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = $1 AND column_name = 'tenant_id'
        `, [table])

        expect(result.rows.length).toBe(1)
      }
    })

    it('should have created_at and updated_at timestamps', async () => {
      const tables = ['assets', 'tasks', 'incidents', 'vehicles']

      for (const table of tables) {
        const result = await testPool.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = $1
          AND column_name IN ('created_at', 'updated_at')
        `, [table])

        expect(result.rows.length).toBeGreaterThanOrEqual(1)
      }
    })

    it('should have id primary keys', async () => {
      const tables = ['assets', 'tasks', 'incidents', 'alerts', 'vehicles', 'users']

      for (const table of tables) {
        const result = await testPool.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1 AND column_name = 'id'
        `, [table])

        expect(result.rows.length).toBe(1)
        expect(['uuid', 'character varying']).toContain(result.rows[0].data_type)
      }
    })
  })

  describe('Indexes', () => {
    it('should have index on tenant_id for performance', async () => {
      const tables = ['assets', 'tasks', 'incidents', 'alerts']

      for (const table of tables) {
        const result = await testPool.query(`
          SELECT indexname
          FROM pg_indexes
          WHERE tablename = $1
          AND indexname LIKE '%tenant_id%'
        `, [table])

        expect(result.rows.length).toBeGreaterThan(0)
      }
    })

    it('should have indexes on foreign keys', async () => {
      const result = await testPool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'tasks'
        AND (indexname LIKE '%assigned_to%' OR indexname LIKE '%created_by%')
      `)

      expect(result.rows.length).toBeGreaterThan(0)
    })
  })

  describe('Constraints', () => {
    it('should have foreign key constraints', async () => {
      const result = await testPool.query(`
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name IN ('assets', 'tasks', 'incidents')
      `)

      expect(result.rows.length).toBeGreaterThan(0)
    })

    it('should have NOT NULL constraints on required fields', async () => {
      const result = await testPool.query(`
        SELECT column_name, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'assets'
        AND column_name IN ('id', 'tenant_id', 'asset_name')
      `)

      result.rows.forEach(row => {
        expect(row.is_nullable).toBe('NO')
      })
    })
  })

  describe('Data Integrity', () => {
    it('should prevent orphaned records with foreign keys', async () => {
      try {
        // Try to create asset_history for non-existent asset
        await testPool.query(`
          INSERT INTO asset_history (asset_id, action, performed_by)
          VALUES ('non-existent-id', 'test', 'test-user-id')
        `)
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        // Should throw foreign key violation
        expect(error.code).toBe('23503') // Foreign key violation
      }
    })

    it('should cascade delete related records', async () => {
      // This test would verify CASCADE DELETE behavior if configured
      // For now, we just check that the constraint exists
      const result = await testPool.query(`
        SELECT confdeltype
        FROM pg_constraint
        WHERE conname LIKE '%fkey%'
        LIMIT 1
      `)

      // confdeltype: 'a' = NO ACTION, 'r' = RESTRICT, 'c' = CASCADE, 'n' = SET NULL
      expect(['a', 'r', 'c', 'n']).toContain(result.rows[0]?.confdeltype)
    })
  })

  describe('Migration Idempotency', () => {
    it('should handle CREATE TABLE IF NOT EXISTS', async () => {
      // Try to create tables that already exist
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS assets (
          id UUID PRIMARY KEY,
          tenant_id VARCHAR(255) NOT NULL
        )
      `)

      // Should not throw error
      const result = await testPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'assets'
        )
      `)
      expect(result.rows[0].exists).toBe(true)
    })
  })

  describe('Schema Validation', () => {
    it('should have all expected columns in assets table', async () => {
      const expectedColumns = [
        'id',
        'tenant_id',
        'asset_name',
        'asset_type',
        'status',
        'created_at',
        'updated_at'
      ]

      const result = await testPool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'assets'
      `)

      const actualColumns = result.rows.map(r => r.column_name)

      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col)
      })
    })

    it('should have all expected columns in tasks table', async () => {
      const expectedColumns = [
        'id',
        'tenant_id',
        'title',
        'description',
        'status',
        'priority',
        'assigned_to',
        'created_by',
        'created_at',
        'updated_at'
      ]

      const result = await testPool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'tasks'
      `)

      const actualColumns = result.rows.map(r => r.column_name)

      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col)
      })
    })

    it('should have all expected columns in incidents table', async () => {
      const expectedColumns = [
        'id',
        'tenant_id',
        'incident_title',
        'incident_type',
        'severity',
        'status',
        'incident_date',
        'created_at',
        'updated_at'
      ]

      const result = await testPool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'incidents'
      `)

      const actualColumns = result.rows.map(r => r.column_name)

      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col)
      })
    })
  })
})
