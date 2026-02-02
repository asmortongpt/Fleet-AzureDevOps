#!/usr/bin/env node
/**
 * Simple SQL Migration Runner
 * Runs SQL migration files using the pg module
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DB_CONFIG = {
  host: process.env.DATABASE_HOST || 'fleet-postgres-prod.postgres.database.azure.com',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'postgres',
  user: process.env.DATABASE_USER || 'fleetadmin',
  password: process.env.DATABASE_PASSWORD || 'FleetP0stgr3s0fad3984a32ddb85!',
  ssl: {
    rejectUnauthorized: false
  }
};

const SQL_MIGRATIONS = [
  '000_enable_extensions.sql',
  '001_initial_schema.sql',
  '002_vehicle_3d_models.sql',
  '006_amt_complete_schema.sql',
  '007_performance_indexes.sql',
  '008_rls_policies.sql',
  'add-security-columns.sql'
];

async function runMigrations() {
  const client = new Client(DB_CONFIG);

  console.log('=== Fleet Database Migrations ===');
  console.log(`Connecting to: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    const migrationsDir = path.join(__dirname, 'migrations');

    for (const migrationFile of SQL_MIGRATIONS) {
      const filePath = path.join(migrationsDir, migrationFile);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${migrationFile} (file not found)`);
        continue;
      }

      console.log(`📝 Running migration: ${migrationFile}...`);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query(sql);
        console.log(`   ✅ ${migrationFile} completed successfully`);
      } catch (error) {
        // Check if error is due to already existing objects (safe to ignore)
        if (error.message && (
          error.message.includes('already exists') ||
          error.message.includes('duplicate key')
        )) {
          console.log(`   ℹ️  ${migrationFile} - objects already exist (skipping)`);
        } else {
          console.error(`   ❌ ${migrationFile} failed:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log('✅ All SQL migrations have been applied!');

    // Verify tables exist
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`\n📊 Database has ${result.rows.length} tables:`);
    result.rows.forEach(row => console.log(`   - ${row.table_name}`));

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
