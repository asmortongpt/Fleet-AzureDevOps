import jwt from 'jsonwebtoken'
import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-characters-long-for-security'
const DB_NAME = process.env.DB_NAME || 'fleetdb'

function resolveTestDatabaseName(): string {
  if (process.env.TEST_DB_NAME) {
    return process.env.TEST_DB_NAME
  }
  if (DB_NAME.endsWith('_test')) {
    return DB_NAME
  }
  return `${DB_NAME}_test`
}

export const TEST_TENANT = {
  id: '12345678-1234-1234-1234-123456789012',
  name: 'CTA Fleet Test',
  slug: 'cta-fleet-test',
}

export const TEST_USERS = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    tenant_id: TEST_TENANT.id,
    email: 'admin@test.ctafleet.local',
    first_name: 'Admin',
    last_name: 'User',
    role: 'superadmin',
    scope_level: 'global',
    password: 'AdminPass123!',
  },
  manager: {
    id: '00000000-0000-0000-0000-000000000002',
    tenant_id: TEST_TENANT.id,
    email: 'manager@test.ctafleet.local',
    first_name: 'Fleet',
    last_name: 'Manager',
    role: 'fleet-manager',
    scope_level: 'tenant',
    password: 'ManagerPass123!',
  },
  driver: {
    id: '00000000-0000-0000-0000-000000000003',
    tenant_id: TEST_TENANT.id,
    email: 'driver@test.ctafleet.local',
    first_name: 'Field',
    last_name: 'Driver',
    role: 'driver',
    scope_level: 'own',
    password: 'DriverPass123!',
  },
  viewer: {
    id: '00000000-0000-0000-0000-000000000004',
    tenant_id: TEST_TENANT.id,
    email: 'viewer@test.ctafleet.local',
    first_name: 'Read',
    last_name: 'Only',
    role: 'viewer',
    scope_level: 'own',
    password: 'ViewerPass123!',
  },
} as const

export const TEST_VEHICLES = {
  vehicle1: {
    id: uuidv4(),
    tenant_id: TEST_TENANT.id,
    vin: '1HGCM82633A123456',
    license_plate: 'CTA-1001',
    make: 'Ford',
    model: 'F-250',
    year: 2021,
    status: 'active',
  },
  retiredVehicle: {
    id: uuidv4(),
    tenant_id: TEST_TENANT.id,
    vin: '1FTFW1ET3EFA12345',
    license_plate: 'CTA-0099',
    make: 'Chevrolet',
    model: 'Silverado',
    year: 2014,
    status: 'retired',
  },
} as const

type TestUser = typeof TEST_USERS[keyof typeof TEST_USERS] & {
  [key: string]: unknown
}

export function generateTestToken(user: TestUser): string {
  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      tenant_id: user.tenant_id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
      scope_level: user.scope_level || 'own',
      permissions: [],
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  )
}

export function generateExpiredToken(user: TestUser): string {
  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      tenant_id: user.tenant_id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
      scope_level: user.scope_level || 'own',
      permissions: [],
    },
    JWT_SECRET,
    { expiresIn: '-1h' }
  )
}

export function generateRefreshToken(user: TestUser): string {
  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      tenant_id: user.tenant_id,
      tenantId: user.tenant_id,
      type: 'refresh',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export async function checkDatabaseConnection(): Promise<boolean> {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: resolveTestDatabaseName(),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 2000,
  })

  try {
    await pool.query('SELECT 1')
    return true
  } catch {
    return false
  } finally {
    await pool.end().catch(() => undefined)
  }
}

export class TestSetup {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || '5432'),
      database: resolveTestDatabaseName(),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    })
  }

  async beforeAll() {
    await this.runMigrations()
    await this.seedTestData()
  }

  async afterAll() {
    await this.pool.query('TRUNCATE TABLE vehicles, drivers, inspections CASCADE')
    await this.pool.end()
  }

  private async runMigrations() {
    // Integration environments run migrations outside this helper.
  }

  private async seedTestData() {
    await this.pool.query(
      `
      INSERT INTO tenants (id, name, slug)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
      `,
      [TEST_TENANT.id, TEST_TENANT.name, TEST_TENANT.slug]
    )
  }
}
