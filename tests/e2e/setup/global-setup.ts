import { chromium, FullConfig } from '@playwright/test';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 E2E Global Setup Starting...\n');

  // Database setup
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet_test',
  });

  try {
    console.log('📦 Setting up test database...');

    // Create test tenant
    const tenantResult = await pool.query(
      `INSERT INTO tenants (name, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      ['Test Organization']
    );
    const tenantId = tenantResult.rows[0].id;
    console.log(`✅ Test tenant created: ID ${tenantId}`);

    // Hash password for test user
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create test users
    const users = [
      {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'admin',
        tenant_id: tenantId,
      },
      {
        email: 'manager@example.com',
        password: hashedPassword,
        name: 'Test Manager',
        role: 'manager',
        tenant_id: tenantId,
      },
      {
        email: 'driver@example.com',
        password: hashedPassword,
        name: 'Test Driver',
        role: 'driver',
        tenant_id: tenantId,
      },
    ];

    for (const user of users) {
      await pool.query(
        `INSERT INTO users (email, password, name, role, tenant_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE
         SET password = $2, role = $4, updated_at = NOW()`,
        [user.email, user.password, user.name, user.role, user.tenant_id]
      );
      console.log(`✅ Test user created: ${user.email} (${user.role})`);
    }

    // Create test vehicles
    const vehicles = [
      {
        vehicle_id: 'TEST-001',
        make: 'Ford',
        model: 'F-150',
        year: 2023,
        vin: 'TEST1234567890001',
        license_plate: 'TEST-001',
        status: 'active',
        tenant_id: tenantId,
      },
      {
        vehicle_id: 'TEST-002',
        make: 'Chevrolet',
        model: 'Silverado',
        year: 2023,
        vin: 'TEST1234567890002',
        license_plate: 'TEST-002',
        status: 'active',
        tenant_id: tenantId,
      },
    ];

    for (const vehicle of vehicles) {
      await pool.query(
        `INSERT INTO vehicles (vehicle_id, make, model, year, vin, license_plate, status, tenant_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (vehicle_id) DO UPDATE
         SET status = $7, updated_at = NOW()`,
        [
          vehicle.vehicle_id,
          vehicle.make,
          vehicle.model,
          vehicle.year,
          vehicle.vin,
          vehicle.license_plate,
          vehicle.status,
          vehicle.tenant_id,
        ]
      );
      console.log(`✅ Test vehicle created: ${vehicle.vehicle_id}`);
    }

    console.log('\n✅ E2E database setup complete\n');
  } catch (error) {
    console.error('❌ E2E database setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }

  // Browser setup for authentication state
  const baseURL = process.env.BASE_URL || 'http://localhost:5174';
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    console.log('🔐 Logging in to create auth state...');

    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill and submit login form
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/dashboard|fleet|home/, { timeout: 10000 });

    // Save authentication state
    await context.storageState({ path: 'tests/e2e/fixtures/auth.json' });
    console.log('✅ Authentication state saved\n');
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    // Don't throw - tests will handle auth failures individually
  } finally {
    await browser.close();
  }

  console.log('🎉 E2E Global Setup Complete\n');
}

export default globalSetup;
