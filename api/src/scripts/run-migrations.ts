#!/usr/bin/env tsx

/**
 * Database Migration Runner
 *
 * Runs SQL migration files in the src/migrations directory in sequential order.
 * Tracks which migrations have been applied to avoid re-running them.
 */

import * as fs from 'fs';
import * as path from 'path';

import * as dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

// Database connection configuration
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fleet_management',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

interface MigrationRecord {
  id: number;
  filename: string;
  applied_at: Date;
}

/**
 * Create the schema_migrations table if it doesn't exist
 */
async function createMigrationsTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ Schema migrations table ready');
  } finally {
    client.release();
  }
}

/**
 * Get list of already applied migrations
 */
async function getAppliedMigrations(): Promise<Set<string>> {
  const client = await pool.connect();
  try {
    const result = await client.query<MigrationRecord>(
      'SELECT filename FROM schema_migrations ORDER BY id'
    );
    return new Set(result.rows.map(row => row.filename));
  } finally {
    client.release();
  }
}

/**
 * Get all migration files from the migrations directory
 */
function getMigrationFiles(): string[] {
  const migrationsDir = path.join(__dirname, '..', `migrations`);

  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  const includeSeeds = process.env.MIGRATIONS_INCLUDE_SEEDS === 'true';
  const includeDemo = process.env.MIGRATIONS_INCLUDE_DEMO === 'true';
  const includeUnversioned = process.env.MIGRATIONS_INCLUDE_UNVERSIONED === 'true';

  const files = fs.readdirSync(migrationsDir, { withFileTypes: true })
    .filter((ent) => ent.isFile())
    .map((ent) => ent.name)
    .filter((f) => f.endsWith('.sql'))
    // By default we only run "versioned" migrations (filename starts with a digit).
    // This prevents accidentally running ad-hoc scripts like `create_audit_tables.sql`
    // or seed/demo scripts in production environments.
    .filter((f) => includeUnversioned ? true : /^[0-9]/.test(f))
    .filter((f) => includeSeeds ? true : !/seed/i.test(f))
    .filter((f) => includeDemo ? true : !/demo/i.test(f))
    .filter((f) => !/\.skip$/i.test(f))
    .sort(); // Sort alphabetically to run in order

  return files;
}

function getAllowlist(): Set<string> | null {
  const raw = process.env.MIGRATIONS_ALLOWLIST;
  if (!raw) return null;
  const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return new Set(items);
}

function getSkiplist(): Set<string> | null {
  const raw = process.env.MIGRATIONS_SKIP;
  if (!raw) return null;
  const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return new Set(items);
}

/**
 * Run a single migration file
 */
async function runMigration(filename: string): Promise<void> {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  const client = await pool.connect();
  try {
    // Start transaction
    await client.query('BEGIN');

    console.log(`⏳ Applying migration: ${filename}...`);
    // Run the migration SQL
    const statements = sql.split('--> statement-breakpoint');
    for (const statement of statements) {
      if (statement.trim().length > 0) {
        await client.query(statement);
      }
    }

    // Record the migration as applied
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    );

    // Commit transaction
    await client.query(`COMMIT`);

    console.log(`✓ Applied migration: ${filename}`);
  } catch (error) {
    // Rollback on error
    await client.query(`ROLLBACK`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main migration runner
 */
async function runMigrations(): Promise<void> {
  console.log(`🚀 Starting database migrations...\n`);

  try {
    // Ensure migrations table exists
    await createMigrationsTable();

    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log(`📊 Found ${appliedMigrations.size} previously applied migrations\n`);

    // Get all migration files
    const migrationFiles = getMigrationFiles();
    console.log(`📁 Found ${migrationFiles.length} total migration files\n`);

    // Filter to only pending migrations
    const allowlist = getAllowlist();
    const skiplist = getSkiplist();
    const pendingMigrations = migrationFiles.filter((file) => {
      if (appliedMigrations.has(file)) return false;
      if (skiplist?.has(file)) return false;
      if (allowlist) return allowlist.has(file);
      return true;
    });

    if (pendingMigrations.length === 0) {
      console.log(`✅ No pending migrations. Database is up to date!\n`);
      return;
    }

    if (skiplist && skiplist.size > 0) {
      console.log(`⏭️  Skipping ${skiplist.size} migrations via MIGRATIONS_SKIP\n`);
    }

    // Guardrail: this repo contains many SQL files, including bootstrap and data scripts.
    // Refuse to apply a large backlog unless explicitly opted-in.
    const bootstrapOk = process.env.MIGRATIONS_BOOTSTRAP === 'true';
    if (!allowlist && pendingMigrations.length > 20 && !bootstrapOk) {
      console.error(
        `\n❌ Refusing to run ${pendingMigrations.length} pending migrations without explicit opt-in.\n` +
        `Set MIGRATIONS_BOOTSTRAP=true to run the full backlog, or set MIGRATIONS_ALLOWLIST="file1.sql,file2.sql" to run specific migrations.\n`
      );
      process.exit(1);
    }

    console.log(`⏳ Running ${pendingMigrations.length} pending migrations...\n`);

    // Run each pending migration
    for (const filename of pendingMigrations) {
      await runMigration(filename);
    }

    console.log(`\n✅ All migrations completed successfully!\n`);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
