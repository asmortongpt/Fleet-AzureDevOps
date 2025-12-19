import Knex from 'knex';

import knexConfig from '../../knexfile';
import { logger } from '../services/logger';

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

if (!config) {
  throw new Error(`No Knex configuration found for environment: ${environment}`);
}

export const knex = Knex(config);

/**
 * Migration Service
 *
 * Provides functions for running, rolling back, and checking migration status.
 */
export class MigrationService {
  /**
   * Run pending migrations
   */
  static async runMigrations(): Promise<[number, string[]]> {
    try {
      logger.info('Running database migrations...');
      const [batchNo, migrations] = await knex.migrate.latest();

      if (migrations.length === 0) {
        logger.info('No pending migrations to run');
      } else {
        logger.info(`Ran ${migrations.length} migrations`, {
          batchNo,
          migrations,
        });
      }

      return [batchNo, migrations];
    } catch (error) {
      logger.error('Migration failed', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Rollback the last batch of migrations
   */
  static async rollbackMigrations(all = false): Promise<[number, string[]]> {
    try {
      logger.info(all ? 'Rolling back all migrations...' : 'Rolling back last migration batch...');

      const [batchNo, migrations] = all
        ? await knex.migrate.rollback({}, true) // Rollback all
        : await knex.migrate.rollback(); // Rollback last batch

      if (migrations.length === 0) {
        logger.info('No migrations to rollback');
      } else {
        logger.info(`Rolled back ${migrations.length} migrations`, {
          batchNo,
          migrations,
        });
      }

      return [batchNo, migrations];
    } catch (error) {
      logger.error('Rollback failed', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Get migration status (completed and pending)
   */
  static async getMigrationStatus(): Promise<{
    completed: string[];
    pending: string[];
    currentBatch: number;
  }> {
    try {
      const [completed, pending] = await knex.migrate.list();

      // Get current batch number
      const lastMigration = await knex('knex_migrations')
        .orderBy('batch', 'desc')
        .first();

      const currentBatch = lastMigration ? lastMigration.batch : 0;

      return {
        completed,
        pending,
        currentBatch,
      };
    } catch (error) {
      logger.error('Failed to get migration status', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Create a new migration file
   */
  static async createMigration(name: string): Promise<string> {
    try {
      logger.info(`Creating new migration: ${name}`);
      const migrationPath = await knex.migrate.make(name);
      logger.info(`Migration created at: ${migrationPath}`);
      return migrationPath;
    } catch (error) {
      logger.error('Failed to create migration', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Run migrations up to a specific version
   */
  static async migrateToVersion(version: string): Promise<void> {
    try {
      logger.info(`Migrating to version: ${version}`);
      await knex.migrate.up({ name: version });
      logger.info(`Migrated to version: ${version}`);
    } catch (error) {
      logger.error('Failed to migrate to version', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Rollback a specific migration
   */
  static async rollbackVersion(version: string): Promise<void> {
    try {
      logger.info(`Rolling back version: ${version}`);
      await knex.migrate.down({ name: version });
      logger.info(`Rolled back version: ${version}`);
    } catch (error) {
      logger.error('Failed to rollback version', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Test if migrations are working (dry run)
   */
  static async testMigrations(): Promise<boolean> {
    try {
      const status = await this.getMigrationStatus();
      logger.info('Migration system test passed', {
        completedCount: status.completed.length,
        pendingCount: status.pending.length,
        currentBatch: status.currentBatch,
      });
      return true;
    } catch (error) {
      logger.error('Migration system test failed', { error: error instanceof Error ? error.message : error });
      return false;
    }
  }

  /**
   * Close database connection
   */
  static async close(): Promise<void> {
    await knex.destroy();
  }
}

/**
 * Auto-run migrations on server startup (optional, can be disabled)
 */
export async function autoMigrate(): Promise<void> {
  if (process.env.AUTO_MIGRATE === 'true') {
    try {
      await MigrationService.runMigrations();
    } catch (error) {
      logger.error('Auto-migration failed on startup', { error: error instanceof Error ? error.message : error });
      // Don't crash the server - let admin run migrations manually
    }
  }
}
