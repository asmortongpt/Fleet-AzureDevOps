#!/usr/bin/env node
/**
 * Database Migration Runner
 * Runs all SQL migration files in order and tracks applied migrations
 */

import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

dotenv.config()

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fleetdb',
  user: process.env.DB_USER || process.env.DB_USERNAME || 'fleetadmin',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL_MODE === 'require' ? { rejectUnauthorized: false } : false
})

interface Migration {
  filename: string
  filepath: string
  order: number
}

// Migration tracking table
const createMigrationTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      checksum VARCHAR(64),
      execution_time_ms INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename ON schema_migrations(filename);
  `
  await pool.query(query)
  console.log('✅ Migration tracking table ready')
}

// Get all migration files from multiple directories
const getMigrationFiles = (): Migration[] => {
  const migrationDirs = [
    path.join(__dirname, '../../..', 'database'),
    path.join(__dirname, '../../..', 'database/migrations'),
    path.join(__dirname, '../migrations'),
    path.join(__dirname, '../../db/migrations')
  ]

  const migrations: Migration[] = []

  for (const dir of migrationDirs) {
    if (!fs.existsSync(dir)) continue

    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.sql'))
      .filter(f => !f.includes('orchestration')) // Skip orchestration schema for now

    for (const file of files) {
      const filepath = path.join(dir, file)

      // Extract order from filename (e.g., 001_, 002_, etc.)
      let order = 0
      const orderMatch = file.match(/^(\d+)/)
      if (orderMatch) {
        order = parseInt(orderMatch[1])
      } else if (file === 'schema.sql') {
        order = 0 // Base schema runs first
      } else if (file === 'schema-simple.sql') {
        continue // Skip simple schema
      } else if (file === 'indexes.sql') {
        order = 9999 // Indexes run last
      } else {
        // For files without numbers, use hash of filename for consistent ordering
        order = 1000 + (file.charCodeAt(0) * 10)
      }

      migrations.push({ filename: file, filepath, order })
    }
  }

  // Sort by order
  return migrations.sort((a, b) => a.order - b.order)
}

// Check if migration has been applied
const isMigrationApplied = async (filename: string): Promise<boolean> => {
  const result = await pool.query(
    'SELECT filename FROM schema_migrations WHERE filename = $1',
    [filename]
  )
  return result.rows.length > 0
}

// Record migration as applied
const recordMigration = async (filename: string, executionTimeMs: number) => {
  await pool.query(
    'INSERT INTO schema_migrations (filename, execution_time_ms) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING',
    [filename, executionTimeMs]
  )
}

// Run a single migration file
const runMigration = async (migration: Migration): Promise<boolean> => {
  const { filename, filepath } = migration

  // Check if already applied
  if (await isMigrationApplied(filename)) {
    console.log(`⏭️  Skipping ${filename} (already applied)`)
    return false
  }

  console.log(`\n🔄 Running migration: ${filename}`)
  const startTime = Date.now()

  try {
    const sql = fs.readFileSync(filepath, 'utf-8')

    // Start transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Execute migration SQL
      await client.query(sql)

      // Record migration
      const executionTime = Date.now() - startTime
      await client.query(
        'INSERT INTO schema_migrations (filename, execution_time_ms) VALUES ($1, $2)',
        [filename, executionTime]
      )

      await client.query('COMMIT')
      console.log(`✅ Completed ${filename} (${executionTime}ms)`)
      return true
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(`❌ Failed to run ${filename}:`, error)
    throw error
  }
}

// Main migration function
const runMigrations = async () => {
  console.log('🚀 Starting database migrations...\n')
  console.log('📍 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'fleetdb'}`)
  console.log('👤 User: ${process.env.DB_USER || process.env.DB_USERNAME || 'fleetadmin'}\n`)

  try {
    // Test connection
    await pool.query('SELECT NOW()')
    console.log('✅ Database connection established\n')

    // Create migration tracking table
    await createMigrationTable()

    // Get all migrations
    const migrations = getMigrationFiles()
    console.log(`\n📋 Found ${migrations.length} migration files\n`)

    if (migrations.length === 0) {
      console.log('⚠️  No migration files found')
      return
    }

    // Run migrations
    let appliedCount = 0
    let skippedCount = 0

    for (const migration of migrations) {
      const applied = await runMigration(migration)
      if (applied) {
        appliedCount++
      } else {
        skippedCount++
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ Migration complete!')
    console.log(`   Applied: ${appliedCount}`)
    console.log(`   Skipped: ${skippedCount}`)
    console.log(`   Total: ${migrations.length}`)
    console.log('='.repeat(60) + '\n')

    // Count tables
    const result = await pool.query(
      "SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'"
    )
    console.log(`📊 Total tables in database: ${result.rows[0].table_count}\n`)

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Show migration status
const showStatus = async () => {
  console.log('📊 Migration Status\n')

  try {
    await pool.query('SELECT NOW()')
    await createMigrationTable()

    const result = await pool.query(
      'SELECT filename, executed_at, execution_time_ms FROM schema_migrations ORDER BY executed_at DESC'
    )

    console.log(`Total applied migrations: ${result.rows.length}\n`)

    if (result.rows.length > 0) {
      console.log('Applied migrations:')
      console.log('-'.repeat(80))
      result.rows.forEach(row => {
        const date = new Date(row.executed_at).toISOString()
        console.log(`  ${row.filename.padEnd(50)} ${date} (${row.execution_time_ms}ms)`)
      })
    }

    const tableCount = await pool.query(
      "SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'"
    )
    console.log(`\n📊 Total tables: ${tableCount.rows[0].table_count}`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// CLI
const command = process.argv[2]

if (command === 'status') {
  showStatus()
} else {
  runMigrations()
}
