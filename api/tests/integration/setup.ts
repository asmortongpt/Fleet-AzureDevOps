import { Pool } from 'pg';

export class TestSetup {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME + '_test',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
  }

  async beforeAll() {
    await this.runMigrations();
    await this.seedTestData();
  }

  async afterAll() {
    await this.pool.query('TRUNCATE TABLE vehicles, drivers, inspections CASCADE');
    await this.pool.end();
  }

  private async runMigrations() {
    console.log('Running test migrations...');
  }

  private async seedTestData() {
    await this.pool.query(`
      INSERT INTO tenants (id, name, subdomain)
      VALUES (1, 'Test Tenant', 'test')
      ON CONFLICT (id) DO NOTHING
    `);
  }
}
