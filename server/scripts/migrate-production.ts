import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Production Database Migration Script
 *
 * Applies all SQL migrations from api/src/migrations/ directory to production PostgreSQL
 * Tracks applied migrations in schema_migrations table
 * Uses transactions for atomicity
 *
 * Usage:
 *   ts-node server/scripts/migrate-production.ts
 *
 * Environment Variables Required:
 *   DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD
 */

// Database connection configuration
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: true,
  } : false,
  max: 1, // Single connection for migrations
  connectionTimeoutMillis: 30000,
  statement_timeout: 300000, // 5 minute query timeout
});

/**
 * Main migration function
 */
async function runMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('========================================');
    console.log('Fleet Management - Database Migrations');
    console.log('========================================');
    console.log(`Database: ${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`);
    console.log(`User: ${process.env.DATABASE_USER}`);
    console.log('');

    // Create migrations tracking table if it doesn't exist
    console.log('Creating schema_migrations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW(),
        execution_time_ms INTEGER
      );
    `);
    console.log('✓ schema_migrations table ready');
    console.log('');

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../../api/src/migrations');

    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Alphabetical order (ensure proper naming like 001_*, 002_*, etc.)

    console.log(`Found ${migrationFiles.length} migration files`);
    console.log('');

    let appliedCount = 0;
    let skippedCount = 0;

    // Apply each migration
    for (const file of migrationFiles) {
      const startTime = Date.now();

      // Check if migration was already applied
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE migration_name = $1',
        [file]
      );

      if (rows.length > 0) {
        console.log(`⊘ SKIPPED (already applied): ${file}`);
        skippedCount++;
        continue;
      }

      // Read migration SQL
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // Apply migration in transaction
      console.log(`⟳ APPLYING: ${file}...`);
      await client.query('BEGIN');

      try {
        // Execute migration SQL
        await client.query(sql);

        // Record migration as applied
        const executionTime = Date.now() - startTime;
        await client.query(
          'INSERT INTO schema_migrations (migration_name, execution_time_ms) VALUES ($1, $2)',
          [file, executionTime]
        );

        await client.query('COMMIT');
        console.log(`✓ APPLIED: ${file} (${executionTime}ms)`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`✗ FAILED: ${file}`);
        console.error(`  Error: ${err instanceof Error ? err.message : err}`);
        throw new Error(`Migration failed: ${file}`);
      }
    }

    console.log('');
    console.log('========================================');
    console.log('Migration Summary');
    console.log('========================================');
    console.log(`Total migrations: ${migrationFiles.length}`);
    console.log(`Applied: ${appliedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log('');
    console.log('✓ All migrations completed successfully');
    console.log('========================================');

    // Display schema info
    const { rows: tableCount } = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);
    console.log(`Database contains ${tableCount[0].count} tables`);

    // Display recent migrations
    const { rows: recentMigrations } = await client.query(`
      SELECT migration_name, applied_at, execution_time_ms
      FROM schema_migrations
      ORDER BY applied_at DESC
      LIMIT 5
    `);
    console.log('');
    console.log('Recent migrations:');
    recentMigrations.forEach(m => {
      const date = new Date(m.applied_at).toISOString();
      console.log(`  - ${m.migration_name} (${date}, ${m.execution_time_ms}ms)`);
    });

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('MIGRATION FAILED');
    console.error('========================================');
    console.error(error instanceof Error ? error.message : error);
    console.error('');
    console.error('Database state may be inconsistent.');
    console.error('Check logs and retry or rollback manually.');
    console.error('========================================');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('');
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('');
    console.error('Migration script failed:', err);
    process.exit(1);
  });
