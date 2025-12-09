import { Knex } from 'knex';

/**
 * Migration: Add tenant_id to all tables for multi-tenancy
 *
 * This migration adds tenant_id columns to support multi-tenant architecture.
 * Each row is scoped to a specific tenant for data isolation.
 */
export async function up(knex: Knex): Promise<void> {
  // Add uuid extension if not exists
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Add tenant_id to vehicles table
  await knex.schema.alterTable('vehicles', (table) => {
    table.uuid('tenant_id').notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    table.index('tenant_id'); // Index for fast filtering
  });

  // Add tenant_id to drivers table
  await knex.schema.alterTable('drivers', (table) => {
    table.uuid('tenant_id').notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    table.index('tenant_id');
  });

  // Add tenant_id to users table
  await knex.schema.alterTable('users', (table) => {
    table.uuid('tenant_id').notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    table.index('tenant_id');
  });

  // Add tenant_id to facilities table (if exists)
  const hasFacilities = await knex.schema.hasTable('facilities');
  if (hasFacilities) {
    await knex.schema.alterTable('facilities', (table) => {
      table.uuid('tenant_id').notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
      table.index('tenant_id');
    });
  }

  // Create composite indexes for common query patterns
  await knex.raw('CREATE INDEX idx_vehicles_tenant_status ON vehicles(tenant_id, status)');
  await knex.raw('CREATE INDEX idx_drivers_tenant_active ON drivers(tenant_id, is_active)');

  console.log('✅ Migration up: Added tenant_id columns and indexes');
}

export async function down(knex: Knex): Promise<void> {
  // Drop composite indexes
  await knex.raw('DROP INDEX IF EXISTS idx_vehicles_tenant_status');
  await knex.raw('DROP INDEX IF EXISTS idx_drivers_tenant_active');

  // Remove tenant_id from vehicles
  await knex.schema.alterTable('vehicles', (table) => {
    table.dropColumn('tenant_id');
  });

  // Remove tenant_id from drivers
  await knex.schema.alterTable('drivers', (table) => {
    table.dropColumn('tenant_id');
  });

  // Remove tenant_id from users
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('tenant_id');
  });

  // Remove tenant_id from facilities (if exists)
  const hasFacilities = await knex.schema.hasTable('facilities');
  if (hasFacilities) {
    await knex.schema.alterTable('facilities', (table) => {
      table.dropColumn('tenant_id');
    });
  }

  console.log('✅ Migration down: Removed tenant_id columns and indexes');
}
