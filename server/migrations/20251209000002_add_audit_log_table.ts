import { Knex } from 'knex';

/**
 * Migration: Create audit_logs table for SOC 2 compliance
 *
 * This table tracks all security-relevant events for compliance and forensics.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('user_id').nullable(); // Null for system events
    table.string('action', 100).notNullable(); // e.g., 'user.login', 'vehicle.update'
    table.string('resource_type', 50).notNullable(); // e.g., 'vehicle', 'user', 'driver'
    table.string('resource_id', 255).nullable(); // ID of affected resource
    table.jsonb('before').nullable(); // State before change
    table.jsonb('after').nullable(); // State after change
    table.inet('ip_address').nullable(); // Client IP
    table.string('user_agent', 500).nullable(); // Browser/client info
    table.string('result', 20).notNullable(); // 'success' or 'failure'
    table.text('error_message').nullable(); // Error details for failures
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for fast querying
    table.index('tenant_id');
    table.index('user_id');
    table.index('action');
    table.index('resource_type');
    table.index('created_at');
    table.index(['tenant_id', 'created_at']); // Composite for common queries
  });

  // Create a GIN index on JSONB columns for fast searching
  await knex.raw('CREATE INDEX idx_audit_logs_before_gin ON audit_logs USING gin(before)');
  await knex.raw('CREATE INDEX idx_audit_logs_after_gin ON audit_logs USING gin(after)');

  // Add foreign key constraints
  await knex.schema.alterTable('audit_logs', (table) => {
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
  });

  console.log('✅ Migration up: Created audit_logs table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
  console.log('✅ Migration down: Dropped audit_logs table');
}
